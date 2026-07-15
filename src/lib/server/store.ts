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

/** 生放送(ラジオ経済への出演)の放送者オンボーディング状態。初回のみ運営が審査する。 */
export interface BroadcasterProfile {
	/** none=未申請 / pending=審査待ち / approved=承認済(以降の週次予約は自動確定) / rejected=却下 */
	status: 'none' | 'pending' | 'approved' | 'rejected';
	/** オンエア名(番組表・now playing に出す) */
	displayName?: string;
	/** 放送ガイドラインへの同意時刻 */
	guidelineAgreedAt?: string;
	appliedAt?: string;
	reviewedAt?: string;
	reviewNote?: string;
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
	/** 生放送の放送者審査状態(初回のみ) */
	broadcaster?: BroadcasterProfile;
}

/** 生放送予約(Pro ユーザーが週 1 で 30 分枠を予約) */
export type ReservationStatus = 'approved' | 'live' | 'completed' | 'cancelled';

export interface LiveReservation {
	id: string;
	sub: string;
	/** 枠開始(UTC ISO8601) */
	slotStart: string;
	durationMin: number;
	status: ReservationStatus;
	/** この生放送を紐づける番組(自分の show の slug)。ライブ中の now playing 表示に使う */
	showSlug: string | null;
	/** 番組タイトル(任意) */
	title: string | null;
	note: string | null;
	/** 承認時に発行した AzuraCast ストリーマー(P3 のアプリが接続情報を取得して使う) */
	azStreamerId: number | null;
	azUsername: string | null;
	/** Icecast SOURCE パスワード(自前生成の機械資格情報。所有者にのみ TLS 越しで返す) */
	azPassword: string | null;
	createdAt: string;
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
	freeAudioGenerationsTotal: 1,
	/** 生放送 1 枠の長さ(分) */
	liveSlotMinutes: 30,
	/** 予約を受け付ける先の日数(今日から) */
	liveBookingHorizonDays: 14,
	/** 予約可能な枠の時間帯(JST の時、その時台に 30 分刻みで開ける)。運営が広げられる。 */
	liveSlotOpenHoursJst: [19, 20, 21, 22],
	/** 予約開始まで最低これだけ先でないと取れない(分) */
	liveBookingLeadMinutes: 10,
	/** ストリーマー許可窓を枠の前後に広げる余白(分)。アプリの go-live 解禁(5分前)と揃える。 */
	liveStreamerWindowPadMinutes: 5
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

// --- 生放送: 放送者オンボーディング(ユーザー doc 上の審査状態) ---

export async function getBroadcaster(sub: string): Promise<BroadcasterProfile> {
	const user = await getUser(sub);
	return user?.broadcaster ?? { status: 'none' };
}

/** ガイドライン同意 + 放送者申請(→ pending)。既に approved ならそのまま返す。 */
export async function applyBroadcaster(
	sub: string,
	displayName: string
): Promise<BroadcasterProfile> {
	const updated = await mutateUser(sub, (u) => {
		const cur = u.broadcaster;
		if (cur?.status === 'approved') return null; // 変更なし
		const now = new Date().toISOString();
		u.broadcaster = {
			status: 'pending',
			displayName: displayName || cur?.displayName,
			guidelineAgreedAt: now,
			appliedAt: now
		};
		return u;
	});
	return updated?.broadcaster ?? { status: 'pending' };
}

/** 運営による放送者審査(承認 / 却下)。 */
export async function reviewBroadcaster(
	sub: string,
	approve: boolean,
	note?: string
): Promise<BroadcasterProfile | null> {
	const updated = await mutateUser(sub, (u) => {
		if (!u.broadcaster) u.broadcaster = { status: 'none' };
		u.broadcaster.status = approve ? 'approved' : 'rejected';
		u.broadcaster.reviewedAt = new Date().toISOString();
		if (note) u.broadcaster.reviewNote = note;
		return u;
	});
	return updated?.broadcaster ?? null;
}

/** 審査待ちの放送者一覧(運営 UI 用)。JSONB を直接クエリ。 */
export async function listPendingBroadcasters(): Promise<
	{ sub: string; broadcaster: BroadcasterProfile }[]
> {
	const rows = await query<{ sub: string; broadcaster: BroadcasterProfile }>(
		`SELECT sub, doc->'broadcaster' AS broadcaster FROM users
		 WHERE doc->'broadcaster'->>'status' = 'pending'
		 ORDER BY doc->'broadcaster'->>'appliedAt'`
	);
	return rows;
}

// --- 生放送: 予約(専用テーブル。枠の重複は部分 UNIQUE INDEX で原子的に防ぐ) ---

function rowToReservation(r: Record<string, unknown>): LiveReservation {
	return {
		id: r.id as string,
		sub: r.sub as string,
		slotStart: new Date(r.slot_start as string).toISOString(),
		durationMin: Number(r.duration_min),
		status: r.status as ReservationStatus,
		showSlug: (r.show_slug as string | null) ?? null,
		title: (r.title as string | null) ?? null,
		note: (r.note as string | null) ?? null,
		azStreamerId: r.az_streamer_id == null ? null : Number(r.az_streamer_id),
		azUsername: (r.az_username as string | null) ?? null,
		azPassword: (r.az_password as string | null) ?? null,
		createdAt: new Date(r.created_at as string).toISOString()
	};
}

export async function getReservation(id: string): Promise<LiveReservation | null> {
	const rows = await query('SELECT * FROM live_reservations WHERE id = $1', [id]);
	return rows[0] ? rowToReservation(rows[0]) : null;
}

export async function listReservationsBySub(sub: string): Promise<LiveReservation[]> {
	const rows = await query(
		'SELECT * FROM live_reservations WHERE sub = $1 ORDER BY slot_start DESC',
		[sub]
	);
	return rows.map(rowToReservation);
}

/** アクティブ(承認済/放送中)な予約を時間範囲で取得。空き枠計算に使う。 */
export async function listActiveReservations(
	fromUTC: Date,
	toUTC: Date
): Promise<LiveReservation[]> {
	const rows = await query(
		`SELECT * FROM live_reservations
		 WHERE status IN ('approved','live') AND slot_start >= $1 AND slot_start < $2
		 ORDER BY slot_start`,
		[fromUTC.toISOString(), toUTC.toISOString()]
	);
	return rows.map(rowToReservation);
}

/** 運営 UI 用: これから放送されるアクティブな予約一覧。 */
export async function listUpcomingReservations(): Promise<LiveReservation[]> {
	const rows = await query(
		`SELECT * FROM live_reservations
		 WHERE status IN ('approved','live') AND slot_start >= now() - interval '1 hour'
		 ORDER BY slot_start`
	);
	return rows.map(rowToReservation);
}

/** 今まさに放送枠の時間内にあるアクティブ予約(前後 pad 分の余白込み)。/live/now 用。 */
export async function getActiveLiveReservationNow(padMinutes = 5): Promise<LiveReservation | null> {
	const rows = await query(
		`SELECT * FROM live_reservations
		 WHERE status IN ('approved','live')
		   AND now() >= slot_start - ($1 || ' minutes')::interval
		   AND now() <= slot_start + ((duration_min + $1) || ' minutes')::interval
		 ORDER BY slot_start DESC
		 LIMIT 1`,
		[padMinutes]
	);
	return rows[0] ? rowToReservation(rows[0]) : null;
}

/** 枠の終了時刻を過ぎたのにまだアクティブな予約(cron の後始末対象)。 */
export async function getEndedActiveReservations(): Promise<LiveReservation[]> {
	const rows = await query(
		`SELECT * FROM live_reservations
		 WHERE status IN ('approved','live')
		   AND now() > slot_start + (duration_min || ' minutes')::interval
		 ORDER BY slot_start`
	);
	return rows.map(rowToReservation);
}

export class SlotTakenError extends Error {}
export class WeeklyLimitError extends Error {}

/**
 * 予約を作成(status=approved)。
 * - 同一枠の二重予約は部分 UNIQUE INDEX 違反 → SlotTakenError。
 * - 同一 ISO 週(JST)に既存のアクティブ予約があれば WeeklyLimitError(週 1 回)。
 * ストリーマー発行は呼び出し側(API)が承認後に行い attachStreamer で紐づける。
 */
export async function createReservation(params: {
	id: string;
	sub: string;
	slotStartUTC: Date;
	durationMin: number;
	showSlug: string | null;
	title: string | null;
	note: string | null;
}): Promise<LiveReservation> {
	// 週 1 回制限: 同じ JST の ISO 週にアクティブ予約があれば拒否
	const weekKey = isoWeekKeyJst(params.slotStartUTC);
	const existing = await query<{ slot_start: string }>(
		`SELECT slot_start FROM live_reservations
		 WHERE sub = $1 AND status IN ('approved','live')`,
		[params.sub]
	);
	for (const e of existing) {
		if (isoWeekKeyJst(new Date(e.slot_start)) === weekKey) {
			throw new WeeklyLimitError('この週は既に予約があります(予約は週 1 回まで)');
		}
	}
	try {
		const rows = await query(
			`INSERT INTO live_reservations (id, sub, slot_start, duration_min, status, show_slug, title, note)
			 VALUES ($1, $2, $3, $4, 'approved', $5, $6, $7)
			 RETURNING *`,
			[
				params.id,
				params.sub,
				params.slotStartUTC.toISOString(),
				params.durationMin,
				params.showSlug,
				params.title,
				params.note
			]
		);
		return rowToReservation(rows[0]);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (msg.includes('live_reservations_slot_uniq') || msg.includes('duplicate key')) {
			throw new SlotTakenError('この枠は既に予約されています');
		}
		throw e;
	}
}

export async function attachStreamer(
	id: string,
	s: { azStreamerId: number; azUsername: string; azPassword: string }
): Promise<void> {
	await query(
		`UPDATE live_reservations
		 SET az_streamer_id = $2, az_username = $3, az_password = $4
		 WHERE id = $1`,
		[id, s.azStreamerId, s.azUsername, s.azPassword]
	);
}

export async function setReservationStatus(
	id: string,
	status: ReservationStatus
): Promise<void> {
	await query('UPDATE live_reservations SET status = $2 WHERE id = $1', [id, status]);
}

/** ISO 週キー(JST 基準)。"2026-W29" 形式。週 1 回制限の判定に使う。 */
function isoWeekKeyJst(dateUTC: Date): string {
	const jst = new Date(dateUTC.getTime() + 9 * 60 * 60 * 1000);
	// ISO week: 木曜日を含む週の年・週番号
	const d = new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()));
	const day = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
	d.setUTCDate(d.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
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
CREATE TABLE IF NOT EXISTS live_reservations (
	id             text PRIMARY KEY,
	sub            text NOT NULL,
	slot_start     timestamptz NOT NULL,
	duration_min   integer NOT NULL DEFAULT 30,
	status         text NOT NULL DEFAULT 'approved',
	show_slug      text,
	title          text,
	note           text,
	az_streamer_id integer,
	az_username    text,
	az_password    text,
	created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE live_reservations ADD COLUMN IF NOT EXISTS show_slug text;
-- 同一枠はアクティブな予約 1 件だけ(二重予約を DB レベルで防ぐ)
CREATE UNIQUE INDEX IF NOT EXISTS live_reservations_slot_uniq
	ON live_reservations (slot_start) WHERE status IN ('approved','live');
CREATE INDEX IF NOT EXISTS live_reservations_sub_idx ON live_reservations (sub);
`;
