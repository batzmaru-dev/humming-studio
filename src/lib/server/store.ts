import { put, head, del } from '@vercel/blob';

// Vercel Blob を JSON ドキュメントストアとして使う(ベータ規模向け。
// 同一ドキュメントへの同時書き込みは last-write-wins — GA では Postgres へ移行予定)。
// 公開ストアだが、URL を知られて困る秘密情報は置かない(メールアドレス等は保存しない)。

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

export interface User {
	sub: string;
	createdAt: string;
	storageUsed: number;
	shows: string[]; // slugs
}

/** 規約に合わせた上限 */
export const LIMITS = {
	storagePerUser: 10 * 1024 * 1024 * 1024, // 10GB
	bytesPerEpisode: 500 * 1024 * 1024 // 500MB
};

async function readJSON<T>(pathname: string): Promise<T | null> {
	try {
		const meta = await head(pathname);
		// 公開 Blob は CDN キャッシュされるため、クエリでバスターして常に最新を読む
		const res = await fetch(`${meta.url}?ts=${Date.now()}`, { cache: 'no-store' });
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null; // BlobNotFound
	}
}

async function writeJSON(pathname: string, doc: unknown): Promise<void> {
	await put(pathname, JSON.stringify(doc), {
		access: 'public',
		addRandomSuffix: false,
		allowOverwrite: true,
		contentType: 'application/json'
	});
}

// --- User ---

export async function getUser(sub: string): Promise<User | null> {
	return readJSON<User>(`data/users/${encodeURIComponent(sub)}.json`);
}

export async function saveUser(user: User): Promise<void> {
	await writeJSON(`data/users/${encodeURIComponent(user.sub)}.json`, user);
}

export async function getOrCreateUser(sub: string): Promise<User> {
	const existing = await getUser(sub);
	if (existing) return existing;
	const user: User = { sub, createdAt: new Date().toISOString(), storageUsed: 0, shows: [] };
	await saveUser(user);
	return user;
}

// --- Show ---

export async function getShow(slug: string): Promise<Show | null> {
	return readJSON<Show>(`data/shows/${slug}.json`);
}

export async function saveShow(show: Show): Promise<void> {
	await writeJSON(`data/shows/${show.slug}.json`, show);
}

// --- 全ショーの索引(ラジオ経済のディレクトリ用) ---

export async function listShowSlugs(): Promise<string[]> {
	return (await readJSON<string[]>('data/index/shows.json')) ?? [];
}

export async function addShowToIndex(slug: string): Promise<void> {
	const slugs = await listShowSlugs();
	if (!slugs.includes(slug)) {
		slugs.push(slug);
		await writeJSON('data/index/shows.json', slugs);
	}
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/;

// --- チーム招待コード(code → slug の対応。参加時に消費する一回限り) ---

interface Invite {
	slug: string;
	createdAt: string;
}

export async function createInvite(slug: string): Promise<string> {
	// 紛らわしい文字を除いた 8 文字コード
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	const bytes = crypto.getRandomValues(new Uint8Array(8));
	const code = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
	await writeJSON(`data/invites/${code}.json`, {
		slug,
		createdAt: new Date().toISOString()
	} satisfies Invite);
	return code;
}

export async function consumeInvite(code: string): Promise<string | null> {
	if (!/^[A-Z2-9]{8}$/.test(code)) return null;
	const invite = await readJSON<Invite>(`data/invites/${code}.json`);
	if (!invite) return null;
	try {
		await del(`data/invites/${code}.json`);
	} catch {
		// 既に消費済みでも進める(同時参加のレースは last-write-wins 前提のベータ仕様)
	}
	return invite.slug;
}
