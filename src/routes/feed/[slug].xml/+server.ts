import { error } from '@sveltejs/kit';
import { getShow } from '$lib/server/store';
import { buildFeed } from '$lib/server/rss';
import { tsunaguFeedMigrated, tsunaguRssUrl } from '$lib/server/tsunagu-hosting';

export const prerender = false;

/**
 * 番組の RSS フィード。
 * フィードの正本を つなぐホスティング(Castopod)へ移した番組は、そちらへ 301 転送する
 * (Spotify / Apple Podcasts などは 301 をたどって登録 URL を更新する)。
 * 未移行の番組は従来どおりここで配信する。
 */
export async function GET({ params }) {
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'feed not found');
	if (tsunaguFeedMigrated(show)) {
		return new Response(null, {
			status: 301,
			headers: {
				location: tsunaguRssUrl(show.tsunaguPodcastHandle!),
				'cache-control': 'public, s-maxage=300'
			}
		});
	}
	return new Response(buildFeed(show), {
		headers: {
			'content-type': 'application/rss+xml; charset=utf-8',
			'cache-control': 'public, s-maxage=60, stale-while-revalidate=300'
		}
	});
}
