import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, saveShow, getUser, saveUser } from '$lib/server/store';

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

	show.members = (show.members ?? []).filter((m) => m !== target);
	await saveShow(show);

	const member = await getUser(target);
	if (member) {
		member.shows = member.shows.filter((s) => s !== show.slug);
		await saveUser(member);
	}

	return json({ ok: true });
}
