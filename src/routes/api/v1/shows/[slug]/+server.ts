import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, saveShow, canPublish } from '$lib/server/store';

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
			feedURL: `https://humming-studio.com/feed/${show.slug}.xml`
		}
	});
}

/** 番組メタデータの更新(slug は変更不可、オーナーのみ) */
export async function PATCH({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (show.ownerSub !== sub) throw error(403, 'only the owner can edit the show');
	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');

	for (const key of ['title', 'description', 'author', 'category', 'language', 'artworkURL'] as const) {
		if (typeof body[key] === 'string') show[key] = body[key];
	}
	if (typeof body.explicit === 'boolean') show.explicit = body.explicit;
	if (typeof body.radioKeizaiOptIn === 'boolean') show.radioKeizaiOptIn = body.radioKeizaiOptIn;

	await saveShow(show);
	return json({ show });
}
