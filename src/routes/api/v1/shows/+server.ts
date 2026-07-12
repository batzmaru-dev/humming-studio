import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import {
	getOrCreateUser,
	saveUser,
	getShow,
	saveShow,
	addShowToIndex,
	SLUG_PATTERN,
	type Show
} from '$lib/server/store';

export const prerender = false;

/** 番組を作成する。slug はフィード URL の一部になり、以後変更不可。 */
export async function POST({ request }) {
	const sub = await requireAuth(request);
	const body = await request.json().catch(() => null);
	if (!body?.title || typeof body.title !== 'string') throw error(400, 'title is required');

	const slug = typeof body.slug === 'string' ? body.slug.toLowerCase() : '';
	if (!SLUG_PATTERN.test(slug)) {
		throw error(400, 'slug must be 3-40 chars of [a-z0-9-], no leading/trailing hyphen');
	}
	if (await getShow(slug)) throw error(409, 'slug is already taken');

	const show: Show = {
		slug,
		ownerSub: sub,
		title: body.title,
		description: typeof body.description === 'string' ? body.description : '',
		author: typeof body.author === 'string' ? body.author : body.title,
		category: typeof body.category === 'string' ? body.category : 'Society & Culture',
		language: typeof body.language === 'string' ? body.language : 'ja',
		explicit: body.explicit === true,
		artworkURL: typeof body.artworkURL === 'string' ? body.artworkURL : undefined,
		// ラジオ経済掲載は番組単位 optIn(規約第5条: 既定で有効、いつでも停止可)
		radioKeizaiOptIn: body.radioKeizaiOptIn !== false,
		createdAt: new Date().toISOString(),
		episodes: []
	};
	await saveShow(show);
	await addShowToIndex(slug);

	const user = await getOrCreateUser(sub);
	if (!user.shows.includes(slug)) {
		user.shows.push(slug);
		await saveUser(user);
	}

	return json(
		{ show: { ...show, feedURL: `https://humming-studio.com/feed/${slug}.xml` } },
		{ status: 201 }
	);
}
