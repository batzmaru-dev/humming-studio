import { redirect, error } from '@sveltejs/kit';

export const prerender = false;

/**
 * Mac版(ASWebAuthenticationSession)からの Sign In with Apple 用コールバック。
 *
 * ネイティブアプリはプロビジョニングプロファイルの制約で Sign In with Apple の
 * entitlement を使えない(Developer ID 配布のため)。代わりに Web 版の
 * Sign In with Apple(Services ID)でブラウザ認証させ、Apple がここへ
 * response_mode=form_post で POST してきた id_token を、アプリ用カスタム
 * URL スキーム(podblock://)へそのままリレーする。
 *
 * このエンドポイント自身はトークンを検証しない — 受け取った id_token を
 * 既存の /api/v1/auth/apple(POST)にそのまま渡せば、ネイティブ版と同じ
 * 検証・セッション発行ロジックが使われる(audience に Services ID を追加済み)。
 */
export async function POST({ request }) {
	const form = await request.formData().catch(() => null);
	const idToken = form?.get('id_token');

	if (typeof idToken !== 'string' || !idToken) {
		throw error(400, 'id_token missing from Apple callback');
	}

	const callback = new URL('podblock://auth-callback');
	callback.searchParams.set('identityToken', idToken);
	throw redirect(302, callback.toString());
}
