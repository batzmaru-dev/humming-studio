import { env } from '$env/dynamic/private';

// Humming Studio → つなぐホスティング（Castopod / podcast.radio-keizai.com）。
// 番組ホストは Castopod へのログインを一切意識しない設計（2026-08-24 決定）。
// Humming Studio 側は RadioSystem と同じ共有 REST API クレデンシャルでサーバー間通信のみ行う。
// podcast の紐付け（tsunaguPodcastId）は運営が Castopod 管理画面で番組を作成し、
// Show.tsunaguPodcastId として手動で発行する（Castopod の REST API にはpodcast作成/
// ユーザー管理の口が無いため、自動プロビジョニングはできない）。
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

async function th<T>(path: string, init: { method: string; body?: FormData }): Promise<T> {
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
		signal: AbortSignal.timeout(60_000)
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`つなぐホスティング ${res.status}: ${text.slice(0, 300)}`);
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

export const tsunaguHosting = {
	configured: tsunaguHostingConfigured,
	listenUrl: tsunaguListenUrl,
	rssUrl: tsunaguRssUrl,

	/**
	 * エピソードを作成して即座に公開する(Castopod REST APIは create → publish の2段階)。
	 * audioURL(Vercel Blobの公開URL)を取得してmultipartで転送する。
	 * slug には Humming Studio 側のエピソードUUIDをそのまま使う(一意性が保証済み、
	 * かつCastopodのslugバリデーション `[a-zA-Z0-9\-]{1,128}` を満たす)。
	 */
	createAndPublishEpisode: async (params: {
		podcastId: number;
		episodeId: string;
		title: string;
		description: string;
		audioURL: string;
	}): Promise<TsunaguEpisode> => {
		const c = cfg();
		if (!c) throw new Error('つなぐホスティングが未設定です');

		const audioRes = await fetch(params.audioURL, { signal: AbortSignal.timeout(60_000) });
		if (!audioRes.ok) throw new Error(`音声ファイルの取得に失敗しました: ${audioRes.status}`);
		const audioBlob = await audioRes.blob();

		const createForm = new FormData();
		createForm.set('title', params.title);
		createForm.set('slug', params.episodeId);
		createForm.set('podcast_id', String(params.podcastId));
		createForm.set('description', params.description);
		createForm.set('type', 'full');
		createForm.set('created_by', String(c.userId));
		createForm.set('updated_by', String(c.userId));
		createForm.set('audio_file', audioBlob, 'episode.mp3');

		const created = await th<TsunaguEpisode>('/episodes', { method: 'POST', body: createForm });

		const publishForm = new FormData();
		publishForm.set('publication_method', 'now');
		publishForm.set('created_by', String(c.userId));
		return th<TsunaguEpisode>(`/episodes/${created.id}/publish`, { method: 'POST', body: publishForm });
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
