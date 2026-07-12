import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, createInvite } from '$lib/server/store';

export const prerender = false;

/** チーム招待コードの発行(オーナーのみ)。コードは一回限り有効。 */
export async function POST({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (show.ownerSub !== sub) throw error(403, 'only the owner can invite members');

	const code = await createInvite(show.slug);
	return json({ code }, { status: 201 });
}
