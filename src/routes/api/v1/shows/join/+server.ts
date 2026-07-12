import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { consumeInvite, mutateShow, mutateUser } from '$lib/server/store';

export const prerender = false;

/** 招待コードで番組のチームに参加する */
export async function POST({ request }) {
	const sub = await requireAuth(request);
	const body = await request.json().catch(() => null);
	const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
	if (!code) throw error(400, 'code is required');

	// 消費は DELETE RETURNING で原子的(同時参加でも二重使用されない)
	const slug = await consumeInvite(code);
	if (!slug) throw error(404, '招待コードが無効か、使用済みです');

	const show = await mutateShow(slug, (s) => {
		if (s.ownerSub === sub || (s.members ?? []).includes(sub)) return null;
		s.members = [...(s.members ?? []), sub];
		return s;
	});
	if (!show) throw error(404, 'show not found');

	await mutateUser(sub, (user) => {
		if (user.shows.includes(slug)) return null;
		user.shows.push(slug);
		return user;
	});

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
