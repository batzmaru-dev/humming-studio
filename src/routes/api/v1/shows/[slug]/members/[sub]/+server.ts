import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, mutateShow, mutateUser } from '$lib/server/store';

export const prerender = false;

/** メンバーの除外(オーナー)または自分での離脱(メンバー本人) */
export async function DELETE({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');

	// "me" は本人(離脱)として解決する
	const target = params.sub === 'me' ? sub : params.sub;
	const isOwner = show.ownerSub === sub;
	if (!isOwner && target !== sub) throw error(403, 'not allowed');
	if (target === show.ownerSub) throw error(400, 'owner cannot be removed');

	await mutateShow(params.slug, (s) => {
		s.members = (s.members ?? []).filter((m) => m !== target);
		return s;
	});

	await mutateUser(target, (member) => {
		member.shows = member.shows.filter((s) => s !== params.slug);
		return member;
	});

	return json({ ok: true });
}
