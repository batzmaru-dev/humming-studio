import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getOrCreateUser, getShow, LIMITS } from '$lib/server/store';
import { tsunaguListenUrl, tsunaguRssUrl } from '$lib/server/tsunagu-hosting';

export const prerender = false;

export async function GET({ request }) {
	const sub = await requireAuth(request);
	const user = await getOrCreateUser(sub);
	const shows = (await Promise.all(user.shows.map((slug) => getShow(slug)))).filter(
		(s) => s !== null
	);
	return json({
		user: { sub: user.sub, storageUsed: user.storageUsed, storageLimit: LIMITS.storagePerUser },
		shows: shows.map((s) => ({
			slug: s.slug,
			title: s.title,
			episodeCount: s.episodes.filter((e) => e.status === 'published').length,
			radioKeizaiOptIn: s.radioKeizaiOptIn,
			artworkURL: s.artworkURL ?? null,
			feedURL: `https://humming-studio.com/feed/${s.slug}.xml`,
			role: s.ownerSub === sub ? 'owner' : 'member',
			// つなぐホスティングに紐付いている番組のみ、視聴ページ/RSSリンクを返す
			...(s.tsunaguPodcastHandle
				? {
						tsunaguListenURL: tsunaguListenUrl(s.tsunaguPodcastHandle),
						tsunaguRssURL: tsunaguRssUrl(s.tsunaguPodcastHandle)
					}
				: {})
		}))
	});
}
