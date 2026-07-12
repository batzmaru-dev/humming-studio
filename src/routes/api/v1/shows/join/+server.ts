import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { consumeInvite, getShow, saveShow, getOrCreateUser, saveUser } from '$lib/server/store';

export const prerender = false;

/** 招待コードで番組のチームに参加する */
export async function POST({ request }) {
	const sub = await requireAuth(request);
	const body = await request.json().catch(() => null);
	const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
	if (!code) throw error(400, 'code is required');

	const slug = await consumeInvite(code);
	if (!slug) throw error(404, '招待コードが無効か、使用済みです');

	const show = await getShow(slug);
	if (!show) throw error(404, 'show not found');

	if (show.ownerSub !== sub && !(show.members ?? []).includes(sub)) {
		show.members = [...(show.members ?? []), sub];
		await saveShow(show);
	}

	const user = await getOrCreateUser(sub);
	if (!user.shows.includes(slug)) {
		user.shows.push(slug);
		await saveUser(user);
	}

	return json({
		show: {
			slug: show.slug,
			title: show.title,
			episodeCount: show.episodes.filter((e) => e.status === 'published').length,
			radioKeizaiOptIn: show.radioKeizaiOptIn,
			feedURL: `https://humming-studio.com/feed/${show.slug}.xml`,
			role: 'member'
		}
	});
}
