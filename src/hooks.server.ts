import type { Handle } from '@sveltejs/kit';

// 将来 feed.humming-studio.com をこのプロジェクトに割り当てたとき、
// https://feed.humming-studio.com/{slug}.xml → /feed/{slug}.xml として配信する
export const handle: Handle = async ({ event, resolve }) => {
	const host = event.request.headers.get('host') ?? '';
	if (host.startsWith('feed.') && !event.url.pathname.startsWith('/feed/')) {
		const slugPath = event.url.pathname.replace(/^\//, '');
		if (/^[a-z0-9-]+\.xml$/.test(slugPath)) {
			return Response.redirect(`https://humming-studio.com/feed/${slugPath}`, 307);
		}
	}
	return resolve(event);
};
