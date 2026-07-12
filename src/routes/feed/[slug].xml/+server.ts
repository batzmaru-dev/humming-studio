import { error } from '@sveltejs/kit';
import { getShow } from '$lib/server/store';
import { buildFeed } from '$lib/server/rss';

export const prerender = false;

/** 番組の RSS フィード。この URL は恒久(Spotify / Apple Podcasts に登録される)。 */
export async function GET({ params }) {
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'feed not found');
	return new Response(buildFeed(show), {
		headers: {
			'content-type': 'application/rss+xml; charset=utf-8',
			'cache-control': 'public, s-maxage=60, stale-while-revalidate=300'
		}
	});
}
