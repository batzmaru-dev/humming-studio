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

	// Sign In with Apple(Web版)のコールバック。Appleは response_mode=form_post で
	// appleid.apple.com から humming-studio.com へクロスオリジンの POST を送ってくる
	// (OAuthのform_postとして正規の挙動)。SvelteKitの既定CSRF保護(checkOrigin)は
	// Origin不一致のform系POSTを一律拒否する("Cross-site POST form submissions
	// are forbidden")ため、resolve()に渡す前にここで横取りして直接処理する
	// (このパスだけCSRFチェックを回避。他のルートには影響しない)。
	if (event.url.pathname === '/api/v1/auth/apple/callback' && event.request.method === 'POST') {
		const form = await event.request.formData().catch(() => null);
		const idToken = form?.get('id_token');
		if (typeof idToken !== 'string' || !idToken) {
			return new Response('id_token missing from Apple callback', { status: 400 });
		}
		const callback = new URL('podblock://auth-callback');
		callback.searchParams.set('identityToken', idToken);
		return Response.redirect(callback.toString(), 302);
	}

	return resolve(event);
};
