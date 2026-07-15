import { Pool } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

// Neon Postgres を JSONB ドキュメントストアとして使う。
// 読み書きは行単位で原子的。競合しうる更新(エピソード追加・メンバー変更・
// ストレージ計上)は mutateShow / mutateUser の行ロック(FOR UPDATE)で直列化する。
// 旧実装(Vercel Blob JSON)からは scripts/migrate-from-blob.mjs で移行済み。

export interface Chapter {
	start: number; // 秒
	title: string;
}

export interface Episode {
	id: string;
	title: string;
	/** ショーノート(Markdown / プレーンテキスト) */
	notes: string;
	audioURL: string;
	bytes: number;
	durationSec: number;
	mimeType: string;
	pubDate: string; // ISO8601
	chapters: Chapter[];
	status: 'published' | 'takedown';
	/** RSS インポート由来(音源は外部ホスティングを参照。ストレージ計上・Blob削除の対象外) */
	external?: boolean;
}

export interface Show {
	slug: string;
	ownerSub: string;
	title: string;
	description: string;
	author: string;
	category: string;
	language: string;
	explicit: boolean;
	artworkURL?: string;
	/** フィードの itunes:owner に載せる連絡先(Spotify 等の所有確認メールが届く) */
	ownerEmail?: string;
	radioKeizaiOptIn: boolean;
	createdAt: string;
	episodes: Episode[];
	/** チームメンバー(オーナー以外の sub)。エピソードの公開・削除ができる */
	members?: string[];
}

/** 番組メタデータの編集・チーム管理はオーナーのみ、エピソード操作はメンバーも可 */
export function canPublish(show: Show, sub: string): boolean {
	return show.ownerSub === sub || (show.members ?? []).includes(sub);
}

export interface VoiceProfile {
	id: string;
	name: string;
	weights: number[]; // 周波数ビンごとの声の強さ
	createdAt: string;
}

export interface User {
	sub: string;
	createdAt: string;
	storageUsed: number;
	shows: string[]; // slugs
	/** 無料お試しの BGM/SE 生成を消費済みか(生涯 1 回) */
	freeAudioGenUsed?: boolean;
	/** 「声を守る」ボイスプロファイル(端末間で共有) */
	voiceProfiles?: VoiceProfile[];
}

/** 規約に合わせた上限 */
export const LIMITS = {
	storagePerUser: 10 * 1024 * 1024 * 1024, // 10GB
	bytesPerEpisode: 500 * 1024 * 1024, // 500MB
	/** サブスク(Pro)のクラウド文字起こし上限(秒/月) */
	transcriptionSecondsPerMonth: 360 * 60,
	/** サブスク(Pro)の BGM/SE 生成上限(回/月) */
	audioGenerationsPerMonth: 5,
	/** 無料ユーザーが試せる BGM/SE 生成(生涯・合計) */
	freeAudioGenerationsTotal: 1
};

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/;

// --- 接続 ---

let _pool: Pool | null = null;

function pool(): Pool {
	if (!_pool) {
		const url = env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL is not set');
		_pool = new Pool({ connectionString: url });
	}
	return _pool;
}

async function query<T = Record<string, unknown>>(
	text: string,
	params: unknown[] = []
): Promise<T[]> {
	const result = await pool().query(text, params);
	return result.rows as T[];
}

/** 行ロック付きの読み取り→変更→書き込み。mutator が null を返したら変更なし(ロック解放のみ) */
async function mutateDoc<T>(
	table: 'users' | 'shows',
	keyColumn: 'sub' | 'slug',
	key: string,
	mutator: (doc: T) => T | null
): Promise<T | null> {
	const client = await pool().connect();
	try {
		await client.query('BEGIN');
		const found = await client.query(
			`SELECT doc FROM ${table} WHERE ${keyColumn} = $1 FOR UPDATE`,
			[key]
		);
		if (found.rows.length === 0) {
			await client.query('ROLLBACK');
			return null;
		}
		const updated = mutator(found.rows[0].doc as T);
		if (updated === null) {
			await client.query('ROLLBACK');
			return found.rows[0].doc as T;
		}
		await client.query(`UPDATE ${table} SET doc = $2 WHERE ${keyColumn} = $1`, [
			key,
			JSON.stringify(updated)
		]);
		await client.query('COMMIT');
		return updated;
	} catch (e) {
		await client.query('ROLLBACK').catch(() => {});
		throw e;
	} finally {
		client.release();
	}
}

// --- User ---

export async function getUser(sub: string): Promise<User | null> {
	const rows = await query<{ doc: User }>('SELECT doc FROM users WHERE sub = $1', [sub]);
	return rows[0]?.doc ?? null;
}

export async function saveUser(user: User): Promise<void> {
	await query('INSERT INTO users (sub, doc) VALUES ($1, $2) ON CONFLICT (sub) DO UPDATE SET doc = $2', [
		user.sub,
		JSON.stringify(user)
	]);
}

export async function getOrCreateUser(sub: string): Promise<User> {
	const fresh: User = { sub, createdAt: new Date().toISOString(), storageUsed: 0, shows: [] };
	// 既存があればそのまま、無ければ作成(競合しても既存が勝つ)
	await query('INSERT INTO users (sub, doc) VALUES ($1, $2) ON CONFLICT (sub) DO NOTHING', [
		sub,
		JSON.stringify(fresh)
	]);
	return (await getUser(sub)) ?? fresh;
}

/**
 * ユーザードキュメントの原子的更新(行ロック)。
 * mutator が例外を投げるとロールバックされる(ストレージ上限チェックに使う)。
 */
export async function mutateUser(
	sub: string,
	mutator: (user: User) => User | null
): Promise<User | null> {
	await getOrCreateUser(sub);
	return mutateDoc<User>('users', 'sub', sub, mutator);
}

// --- Show ---

export async function getShow(slug: string): Promise<Show | null> {
	const rows = await query<{ doc: Show }>('SELECT doc FROM shows WHERE slug = $1', [slug]);
	return rows[0]?.doc ?? null;
}

export async function saveShow(show: Show): Promise<void> {
	await query(
		'INSERT INTO shows (slug, doc) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET doc = $2',
		[show.slug, JSON.stringify(show)]
	);
}

/** 番組ドキュメントの原子的更新(行ロック)。番組が無ければ null */
export async function mutateShow(
	slug: string,
	mutator: (show: Show) => Show | null
): Promise<Show | null> {
	return mutateDoc<Show>('shows', 'slug', slug, mutator);
}

// --- 全ショーの索引(ラジオ経済のディレクトリ用) ---

export async function listShowSlugs(): Promise<string[]> {
	const rows = await query<{ slug: string }>('SELECT slug FROM shows ORDER BY slug');
	return rows.map((r) => r.slug);
}

// --- チーム招待コード(一回限り。消費は DELETE RETURNING で原子的) ---

export async function createInvite(slug: string): Promise<string> {
	// 紛らわしい文字を除いた 8 文字コード
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	const bytes = crypto.getRandomValues(new Uint8Array(8));
	const code = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
	await query('INSERT INTO invites (code, slug) VALUES ($1, $2)', [code, slug]);
	return code;
}

export async function consumeInvite(code: string): Promise<string | null> {
	if (!/^[A-Z2-9]{8}$/.test(code)) return null;
	const rows = await query<{ slug: string }>(
		'DELETE FROM invites WHERE code = $1 RETURNING slug',
		[code]
	);
	return rows[0]?.slug ?? null;
}

// --- AI 使用量(サブスクのクラウド文字起こしメータリング) ---

/** 今月の使用秒数を加算して合計を返す(原子的 UPSERT) */
export async function addTranscriptionUsage(sub: string, seconds: number): Promise<number> {
	const month = new Date().toISOString().slice(0, 7); // YYYY-MM
	const rows = await query<{ seconds: number }>(
		`INSERT INTO ai_usage (sub, month, seconds) VALUES ($1, $2, $3)
		 ON CONFLICT (sub, month) DO UPDATE SET seconds = ai_usage.seconds + $3
		 RETURNING seconds`,
		[sub, month, seconds]
	);
	return Number(rows[0]?.seconds ?? seconds);
}

/** 今月の使用秒数 */
export async function getTranscriptionUsage(sub: string): Promise<number> {
	const month = new Date().toISOString().slice(0, 7);
	const rows = await query<{ seconds: number }>(
		'SELECT seconds FROM ai_usage WHERE sub = $1 AND month = $2',
		[sub, month]
	);
	return Number(rows[0]?.seconds ?? 0);
}

// --- AI 使用量(BGM/SE 生成メータリング) ---

/** 今月の生成回数 */
export async function getAudioGenUsage(sub: string): Promise<number> {
	const month = new Date().toISOString().slice(0, 7);
	const rows = await query<{ count: number }>(
		'SELECT count FROM audio_gen_usage WHERE sub = $1 AND month = $2',
		[sub, month]
	);
	return Number(rows[0]?.count ?? 0);
}

/** 今月の生成回数を 1 加算して合計を返す(原子的 UPSERT) */
export async function addAudioGenUsage(sub: string): Promise<number> {
	const month = new Date().toISOString().slice(0, 7);
	const rows = await query<{ count: number }>(
		`INSERT INTO audio_gen_usage (sub, month, count) VALUES ($1, $2, 1)
		 ON CONFLICT (sub, month) DO UPDATE SET count = audio_gen_usage.count + 1
		 RETURNING count`,
		[sub, month]
	);
	return Number(rows[0]?.count ?? 1);
}

// --- スキーマ(初期化スクリプトと移行スクリプトから使う) ---

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
	sub  text PRIMARY KEY,
	doc  jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS shows (
	slug text PRIMARY KEY,
	doc  jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS invites (
	code       text PRIMARY KEY,
	slug       text NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_usage (
	sub     text NOT NULL,
	month   text NOT NULL,
	seconds double precision NOT NULL DEFAULT 0,
	PRIMARY KEY (sub, month)
);
CREATE TABLE IF NOT EXISTS audio_gen_usage (
	sub   text NOT NULL,
	month text NOT NULL,
	count integer NOT NULL DEFAULT 0,
	PRIMARY KEY (sub, month)
);
`;
