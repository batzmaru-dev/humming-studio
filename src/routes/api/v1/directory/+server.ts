import { json } from '@sveltejs/kit';
import { listShowSlugs, getShow } from '$lib/server/store';
import { publicFeedUrl } from '$lib/server/tsunagu-hosting';

export const prerender = false;

/** ラジオ経済(radio-keizai.com)向け: 掲載 optIn している番組の一覧 */
export async function GET() {
	const slugs = await listShowSlugs();
	const shows = (await Promise.all(slugs.map((slug) => getShow(slug)))).filter(
		(s) => s !== null && s.radioKeizaiOptIn && s.episodes.some((e) => e.status === 'published')
	);
	return json(
		{
			shows: shows.map((s) => ({
				slug: s.slug,
				title: s.title,
				description: s.description,
				author: s.author,
				artworkURL: s.artworkURL ?? null,
				episodeCount: s.episodes.filter((e) => e.status === 'published').length,
				latestPubDate: s.episodes
					.filter((e) => e.status === 'published')
					.map((e) => e.pubDate)
					.sort()
					.at(-1),
				feedURL: publicFeedUrl(s)
			}))
		},
		{ headers: { 'cache-control': 'public, s-maxage=300' } }
	);
}
