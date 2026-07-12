import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, saveShow } from '$lib/server/store';

export const prerender = false;

async function requireOwnedShow(request: Request, slug: string) {
	const sub = await requireAuth(request);
	const show = await getShow(slug);
	if (!show) throw error(404, 'show not found');
	if (show.ownerSub !== sub) throw error(403, 'not your show');
	return show;
}

export async function GET({ request, params }) {
	const show = await requireOwnedShow(request, params.slug);
	return json({ show: { ...show, feedURL: `https://humming-studio.com/feed/${show.slug}.xml` } });
}

/** 番組メタデータの更新(slug は変更不可) */
export async function PATCH({ request, params }) {
	const show = await requireOwnedShow(request, params.slug);
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
