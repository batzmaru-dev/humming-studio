import { env } from '$env/dynamic/private';

// Humming Studio → つなぐホスティング（Castopod / podcast.radio-keizai.com）。
// 番組ホストは Castopod へのログインを一切意識しない設計（2026-08-24 決定）。
// Humming Studio 側は RadioSystem と同じ共有 REST API クレデンシャルでサーバー間通信のみ行う。
//
// 2026-11-25: RSS 配信を Castopod へ一本化する方針に変更(川上決定)。Castopod 側に番組の
// 作成・更新・削除 API を追加したので(castopod-overrides/PodcastController.php)、番組は
// 公開の時点で自動作成する。フィードの正本は Castopod になり、Humming Studio の
// /feed/<slug>.xml は移行済みの番組について Castopod のフィードへ 301 転送する。
//
// azuracast.ts / asc.ts と同じ conventions: cfg() が env 不足で null を返す(=機能ごと無効)。

function cfg() {
	const base = env.TSUNAGU_HOSTING_BASE_URL;
	const username = env.TSUNAGU_HOSTING_USERNAME;
	const password = env.TSUNAGU_HOSTING_PASSWORD;
	const userIdRaw = env.TSUNAGU_HOSTING_USER_ID;
	const userId = userIdRaw ? Number(userIdRaw) : NaN;
	if (!base || !username || !password || !Number.isFinite(userId)) return null;
	return { base, username, password, userId };
}

/** つなぐホスティング連携が構成済みか(env未設定なら公開時の自動同期をスキップ) */
export function tsunaguHostingConfigured(): boolean {
	return cfg() !== null;
}

/** つなぐホスティングが 2xx 以外を返したとき。status で 409(重複)や 400(検証エラー)を見分ける */
export class TsunaguHostingError extends Error {
	constructor(
		public status: number,
		body: string
	) {
		super(`つなぐホスティング ${status}: ${body.slice(0, 300)}`);
	}
}

async function th<T>(
	path: string,
	init: { method: string; body?: FormData | URLSearchParams; timeoutMs?: number }
): Promise<T> {
	const c = cfg();
	if (!c) {
		throw new Error(
			'つなぐホスティングが未設定です (TSUNAGU_HOSTING_BASE_URL / _USERNAME / _PASSWORD / _USER_ID)'
		);
	}
	const auth = 'Basic ' + Buffer.from(`${c.username}:${c.password}`).toString('base64');
	const res = await fetch(`${c.base}/api/rest/v1${path}`, {
		method: init.method,
		headers: { Authorization: auth },
		body: init.body,
		signal: AbortSignal.timeout(init.timeoutMs ?? 60_000)
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new TsunaguHostingError(res.status, text);
	}
	return res.json() as Promise<T>;
}

export interface TsunaguEpisode {
	id: number;
	slug: string;
	title: string;
	audio_url: string;
	cover_url: string;
}

/** 番組の視聴ページURL(@handle)。env未設定でも既定ホストで組み立てる(表示用途のフォールバック) */
export function tsunaguListenUrl(handle: string): string {
	const base = cfg()?.base ?? 'https://podcast.radio-keizai.com';
	return `${base}/@${handle}`;
}

/** 番組のRSSフィードURL */
export function tsunaguRssUrl(handle: string): string {
	const base = cfg()?.base ?? 'https://podcast.radio-keizai.com';
	return `${base}/@${handle}/feed.xml`;
}

export interface TsunaguPodcast {
	id: number;
	handle: string;
	title: string;
	feed_url: string;
	cover_url: string;
}

const DEFAULT_COVER_URL = 'https://humming-studio.com/default-cover.png';
const FALLBACK_OWNER_EMAIL = 'info@tsunagu-hito.com';

/**
 * Humming Studio の slug([a-z0-9-]{3,40})から Castopod の handle([a-zA-Z0-9_]{1,32})を作る。
 * handle はフィード URL の一部になり、作成後は変えられない。
 */
export function tsunaguHandleFromSlug(slug: string): string {
	return slug.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 32);
}

/**
 * フィードの正本が Castopod に移った番組か。移行済みなら /feed/<slug>.xml は転送し、
 * API が返す feedURL も Castopod のものにする。
 * (番組を Castopod に作っただけでは true にしない。既存エピソードを送り終えてから
 *  tsunaguFeedMigratedAt を立てる。途中で切り替えると購読者から見て話数が減るため)
 */
export function tsunaguFeedMigrated(show: {
	tsunaguPodcastHandle?: string;
	tsunaguFeedMigratedAt?: string;
}): boolean {
	return Boolean(show.tsunaguPodcastHandle && show.tsunaguFeedMigratedAt);
}

/** 利用者に見せるフィード URL(移行済みなら Castopod、未移行なら Humming Studio) */
export function publicFeedUrl(show: {
	slug: string;
	tsunaguPodcastHandle?: string;
	tsunaguFeedMigratedAt?: string;
}): string {
	return tsunaguFeedMigrated(show)
		? tsunaguRssUrl(show.tsunaguPodcastHandle!)
		: `https://humming-studio.com/feed/${show.slug}.xml`;
}

async function fetchBlob(url: string, timeoutMs = 60_000): Promise<Blob> {
	const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
	if (!res.ok) throw new Error(`ファイルの取得に失敗しました: ${res.status} ${url}`);
	return res.blob();
}

function coverFilename(blob: Blob): string {
	return blob.type === 'image/png' ? 'cover.png' : 'cover.jpg';
}

/** Castopod の scheduled_publication_date 用(Y-m-d H:i、UTC) */
function castopodDate(iso: string): string {
	return new Date(iso).toISOString().slice(0, 16).replace('T', ' ');
}

export const tsunaguHosting = {
	configured: tsunaguHostingConfigured,
	listenUrl: tsunaguListenUrl,
	rssUrl: tsunaguRssUrl,

	/**
	 * 番組を Castopod に作る。handle は slug から作り、既に使われていれば(409)
	 * 末尾に _2, _3… を付けて取り直す。
	 * カバーは Castopod の要件(1400px 以上の正方形 jpg/png)を満たさないと 400 になるので、
	 * 番組のアートワークで弾かれたら既定のカバーで作り直す(番組を作れないよりよい)。
	 */
	createPodcast: async (params: {
		slug: string;
		title: string;
		description: string;
		author: string;
		ownerEmail?: string;
		artworkURL?: string;
	}): Promise<TsunaguPodcast> => {
		const c = cfg();
		if (!c) throw new Error('つなぐホスティングが未設定です');

		const base = tsunaguHandleFromSlug(params.slug);
		const covers: string[] = [];
		if (params.artworkURL) covers.push(params.artworkURL);
		covers.push(DEFAULT_COVER_URL);

		let lastError: unknown;
		for (const coverURL of covers) {
			let cover: Blob;
			try {
				cover = await fetchBlob(coverURL);
			} catch (e) {
				lastError = e;
				continue;
			}
			for (let n = 1; n <= 5; n++) {
				const suffix = n === 1 ? '' : `_${n}`;
				const handle = base.slice(0, 32 - suffix.length) + suffix;
				const form = new FormData();
				form.set('created_by', String(c.userId));
				form.set('title', params.title.slice(0, 128));
				form.set('handle', handle);
				// Castopod は説明が必須
				form.set('description', params.description.trim() || params.title);
				form.set('owner_name', params.author || params.title);
				form.set('owner_email', params.ownerEmail || FALLBACK_OWNER_EMAIL);
				// Castopod は publisher をフィードの itunes:author に出す。番組の発信者名を入れる
				form.set('publisher', params.author || params.title);
				form.set('cover', cover, coverFilename(cover));
				try {
					return await th<TsunaguPodcast>('/podcasts', {
						method: 'POST',
						body: form,
						timeoutMs: 120_000
					});
				} catch (e) {
					lastError = e;
					if (e instanceof TsunaguHostingError && e.status === 409) continue; // handle 重複 → 次の候補
					break; // 400(カバー不適合など)→ 次のカバーで試す
				}
			}
			if (!(lastError instanceof TsunaguHostingError && lastError.status === 400)) break;
		}
		throw lastError instanceof Error ? lastError : new Error('番組を作成できませんでした');
	},

	/** 番組のタイトル・説明・発信者名を Castopod 側にも反映する(送った項目だけ更新) */
	updatePodcast: async (params: {
		podcastId: number;
		title?: string;
		description?: string;
		author?: string;
	}): Promise<TsunaguPodcast> => {
		const c = cfg();
		if (!c) throw new Error('つなぐホスティングが未設定です');
		const form = new FormData();
		form.set('updated_by', String(c.userId));
		if (params.title !== undefined) form.set('title', params.title.slice(0, 128));
		if (params.description !== undefined && params.description.trim() !== '')
			form.set('description', params.description);
		if (params.author !== undefined && params.author !== '') {
			form.set('owner_name', params.author);
			form.set('publisher', params.author);
		}
		return th<TsunaguPodcast>(`/podcasts/${params.podcastId}`, { method: 'POST', body: form });
	},

	/**
	 * エピソードを作成して公開する(Castopod REST API は create → publish の2段階)。
	 *
	 * 音声は Castopod 側が audioURL(Vercel Blob の公開 URL)へ直接取りに行く(audio_url。
	 * 2026-11-25 に Castopod へ追加)。この関数を経由して転送しないので、大きな音声でも
	 * こちらのメモリ・実行時間に乗らない。
	 * slug と guid には Humming Studio 側のエピソード UUID を使う。guid を揃えておくと、
	 * フィードを Castopod へ切り替えたときに購読アプリが同じ回として扱う(新着の重複を防ぐ)。
	 * ファイルを添付しないので application/x-www-form-urlencoded で送る
	 * (multipart で日本語の説明文を送ると URL 系の項目を読み落とす既知の不具合を避ける)。
	 */
	createAndPublishEpisode: async (params: {
		podcastId: number;
		episodeId: string;
		title: string;
		description: string;
		audioURL: string;
		transcriptURL?: string;
		/** 元の公開日時(ISO8601)。過去のエピソードを移すとき、公開日を保つために渡す */
		pubDate?: string;
	}): Promise<TsunaguEpisode> => {
		const c = cfg();
		if (!c) throw new Error('つなぐホスティングが未設定です');

		const create = new URLSearchParams();
		create.set('title', params.title);
		create.set('slug', params.episodeId);
		create.set('guid', params.episodeId);
		create.set('podcast_id', String(params.podcastId));
		// Castopod は description が無いと 500 になる
		create.set('description', params.description.trim() || params.title);
		create.set('type', 'full');
		create.set('created_by', String(c.userId));
		create.set('updated_by', String(c.userId));
		create.set('audio_url', params.audioURL);
		// 文字起こし(WebVTT)も Castopod 側が取りに行って実ファイルとして保存する(transcript_url)。
		// Castopod のフィードは URL 参照(transcript_remote_url)の文字起こしを出力しないため。
		if (params.transcriptURL) create.set('transcript_url', params.transcriptURL);

		const created = await th<TsunaguEpisode>('/episodes', {
			method: 'POST',
			body: create,
			timeoutMs: 280_000
		});

		const publish = new URLSearchParams();
		publish.set('created_by', String(c.userId));
		// 10分以上前の公開日時は、その日時で公開する(過去日時の schedule は即時公開扱いになる)
		const backdated =
			params.pubDate && Date.now() - new Date(params.pubDate).getTime() > 10 * 60_000;
		if (backdated) {
			publish.set('publication_method', 'schedule');
			publish.set('scheduled_publication_date', castopodDate(params.pubDate!));
			publish.set('client_timezone', 'UTC');
		} else {
			publish.set('publication_method', 'now');
		}
		return th<TsunaguEpisode>(`/episodes/${created.id}/publish`, { method: 'POST', body: publish });
	},

	/**
	 * エピソードを Castopod から消す(非公開化+削除。2026-11-25 に Castopod へ追加)。
	 * 取り違え防止のため、Castopod 側は slug(= Humming Studio のエピソード UUID)の一致を確かめる。
	 * 既に無い(404)場合は成功として扱う。
	 */
	deleteEpisode: async (params: { tsunaguEpisodeId: number; episodeId: string }): Promise<void> => {
		const body = new URLSearchParams();
		body.set('slug', params.episodeId);
		try {
			await th<unknown>(`/episodes/${params.tsunaguEpisodeId}/delete`, {
				method: 'POST',
				body,
				timeoutMs: 120_000
			});
		} catch (e) {
			if (e instanceof TsunaguHostingError && e.status === 404) return;
			throw e;
		}
	},

	/**
	 * 既存エピソードの部分更新。Castopod本体には無い機能で、2026-08-24に自前で追加した
	 * `POST /episodes/{id}` エンドポイント(EpisodeController::attemptUpdate)を呼ぶ。
	 * 現時点ではHumming Studio側にエピソード編集APIが無いため、この関数を呼び出す口はまだ無い
	 * (エピソード編集機能を追加する際に配線する)。
	 */
	updateEpisode: async (params: {
		tsunaguEpisodeId: number;
		title?: string;
		description?: string;
	}): Promise<TsunaguEpisode> => {
		const c = cfg();
		if (!c) throw new Error('つなぐホスティングが未設定です');
		const form = new FormData();
		form.set('updated_by', String(c.userId));
		if (params.title !== undefined) form.set('title', params.title);
		if (params.description !== undefined) form.set('description', params.description);
		return th<TsunaguEpisode>(`/episodes/${params.tsunaguEpisodeId}`, { method: 'POST', body: form });
	}
};
