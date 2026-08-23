import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, mutateShow, canPublish } from '$lib/server/store';
import { tsunaguListenUrl, tsunaguRssUrl } from '$lib/server/tsunagu-hosting';

export const prerender = false;

/** 番組詳細(オーナー+メンバー)。メンバー一覧はオーナーにのみ返す */
export async function GET({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (!canPublish(show, sub)) throw error(403, 'not a member of this show');
	const isOwner = show.ownerSub === sub;
	return json({
		show: {
			...show,
			members: isOwner ? (show.members ?? []) : undefined,
			role: isOwner ? 'owner' : 'member',
			feedURL: `https://humming-studio.com/feed/${show.slug}.xml`,
			// つなぐホスティングに紐付いている番組のみ、視聴ページ/RSSリンクを返す
			...(show.tsunaguPodcastHandle
				? {
						tsunaguListenURL: tsunaguListenUrl(show.tsunaguPodcastHandle),
						tsunaguRssURL: tsunaguRssUrl(show.tsunaguPodcastHandle)
					}
				: {})
		}
	});
}

/** 番組メタデータの更新(slug は変更不可、オーナーのみ) */
export async function PATCH({ request, params }) {
	const sub = await requireAuth(request);
	const existing = await getShow(params.slug);
	if (!existing) throw error(404, 'show not found');
	if (existing.ownerSub !== sub) throw error(403, 'only the owner can edit the show');
	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');

	const show = await mutateShow(params.slug, (s) => {
		for (const key of [
			'title',
			'description',
			'author',
			'category',
			'language',
			'artworkURL',
			'ownerEmail',
			'tsunaguPodcastHandle'
		] as const) {
			if (typeof body[key] === 'string') s[key] = body[key];
		}
		if (typeof body.explicit === 'boolean') s.explicit = body.explicit;
		if (typeof body.radioKeizaiOptIn === 'boolean') s.radioKeizaiOptIn = body.radioKeizaiOptIn;
		// つなぐホスティングとの紐付け(運営が発行した番組IDを番組オーナーが登録する)
		if (typeof body.tsunaguPodcastId === 'number' && Number.isFinite(body.tsunaguPodcastId)) {
			s.tsunaguPodcastId = body.tsunaguPodcastId;
		}
		return s;
	});
	return json({ show });
}
