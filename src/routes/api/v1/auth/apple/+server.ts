import { json, error } from '@sveltejs/kit';
import { verifyAppleIdentityToken } from '$lib/server/apple';
import { issueSession } from '$lib/server/session';
import { getOrCreateUser } from '$lib/server/store';

export const prerender = false;

/** Sign in with Apple の identityToken を検証し、自前セッショントークンを発行する */
export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	const identityToken = body?.identityToken;
	if (typeof identityToken !== 'string') throw error(400, 'identityToken is required');

	let identity;
	try {
		identity = await verifyAppleIdentityToken(identityToken);
	} catch {
		throw error(401, 'invalid apple identity token');
	}

	const user = await getOrCreateUser(identity.sub);
	const token = await issueSession(identity.sub);
	return json({ token, user: { sub: user.sub, shows: user.shows } });
}
