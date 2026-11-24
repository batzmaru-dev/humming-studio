import { json, error } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/pro';
import { getShow, listShowSlugs, mutateShow } from '$lib/server/store';
import { publicFeedUrl, tsunaguHosting } from '$lib/server/tsunagu-hosting';
import { syncPendingEpisodes } from '$lib/server/tsunaguSync';

export const prerender = false;

/**
 * つなぐホスティング(Castopod)への移行の管理(運営用。Authorization: Bearer <ADMIN_TOKEN>)。
 *
 *   GET  /api/v1/admin/tsunagu
 *        → 全番組の移行状況(Castopod の番組 ID・未送信の話数・フィードの正本)
 *   POST /api/v1/admin/tsunagu
 *        { action: "sync", slug }
 *          → 番組が Castopod に無ければ作り、未送信のエピソードを古い順に送る。
 *            全部送り終えるとフィードの正本が Castopod に切り替わる(/feed/<slug>.xml が 301 になる)。
 *            時間切れで残った分は remaining に出るので、0 になるまで繰り返し呼ぶ。
 *        { action: "link", slug, podcastId, handle }
 *          → Castopod に既にある番組へ紐付ける(自社番組など、手で作ってあった番組用)。
 *            エピソードは送らない。中身を突き合わせてから markSynced / sync を使うこと。
 *        { action: "markSynced", slug, episodeId, tsunaguEpisodeId }
 *          → Castopod に同じ回が既にあるエピソードを「送信済み」として記録する(二重投稿を避ける)。
 *        { action: "unmigrate", slug }
 *          → フィードの正本を Humming Studio に戻す(切り戻し用。Castopod 側の番組は消さない)。
 */
export async function GET({ request }: { request: Request }) {
	if (!isAdmin(request)) throw error(401, 'unauthorized');
	const slugs = await listShowSlugs();
	const shows = [];
	for (const slug of slugs) {
		const s = await getShow(slug);
		if (!s) continue;
		const published = s.episodes.filter((e) => e.status === 'published');
		shows.push({
			slug: s.slug,
			title: s.title,
			published: published.length,
			radioKeizaiOptIn: s.radioKeizaiOptIn,
			unsynced: published.filter((e) => !e.tsunaguEpisodeId).length,
			tsunaguPodcastId: s.tsunaguPodcastId ?? null,
			tsunaguPodcastHandle: s.tsunaguPodcastHandle ?? null,
			tsunaguFeedMigratedAt: s.tsunaguFeedMigratedAt ?? null,
			feedURL: publicFeedUrl(s)
		});
	}
	return json({ configured: tsunaguHosting.configured(), shows });
}

export async function POST({ request }: { request: Request }) {
	if (!isAdmin(request)) throw error(401, 'unauthorized');
	const body = (await request.json().catch(() => null)) as {
		action?: unknown;
		slug?: unknown;
		podcastId?: unknown;
		handle?: unknown;
		episodeId?: unknown;
		tsunaguEpisodeId?: unknown;
	} | null;
	if (!body || typeof body.slug !== 'string') throw error(400, 'slug is required');
	const slug = body.slug;
	if (!(await getShow(slug))) throw error(404, 'show not found');

	if (body.action === 'sync') {
		if (!tsunaguHosting.configured()) throw error(503, 'tsunagu hosting is not configured');
		try {
			return json(await syncPendingEpisodes(slug));
		} catch (e) {
			throw error(502, e instanceof Error ? e.message : 'sync failed');
		}
	}

	if (body.action === 'link') {
		const podcastId = Number(body.podcastId);
		const handle = typeof body.handle === 'string' ? body.handle : '';
		if (!Number.isInteger(podcastId) || podcastId <= 0) throw error(400, 'podcastId is required');
		if (!/^[a-zA-Z0-9_]{1,32}$/.test(handle)) throw error(400, 'handle is invalid');
		const show = await mutateShow(slug, (s) => {
			s.tsunaguPodcastId = podcastId;
			s.tsunaguPodcastHandle = handle;
			return s;
		});
		return json({ ok: true, tsunaguPodcastId: show?.tsunaguPodcastId, handle });
	}

	if (body.action === 'markSynced') {
		const tsunaguEpisodeId = Number(body.tsunaguEpisodeId);
		if (typeof body.episodeId !== 'string') throw error(400, 'episodeId is required');
		if (!Number.isInteger(tsunaguEpisodeId) || tsunaguEpisodeId <= 0)
			throw error(400, 'tsunaguEpisodeId is required');
		let found = false;
		await mutateShow(slug, (s) => {
			const ep = s.episodes.find((e) => e.id === body.episodeId);
			if (!ep) return null;
			ep.tsunaguEpisodeId = tsunaguEpisodeId;
			found = true;
			return s;
		});
		if (!found) throw error(404, 'episode not found');
		return json({ ok: true });
	}

	if (body.action === 'unmigrate') {
		await mutateShow(slug, (s) => {
			delete s.tsunaguFeedMigratedAt;
			return s;
		});
		return json({ ok: true });
	}

	throw error(400, 'unknown action');
}
