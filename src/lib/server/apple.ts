import { createRemoteJWKSet, jwtVerify } from 'jose';

// Sign in with Apple の identityToken 検証。
// audience は2種類ありうる:
// - ネイティブ(iOS)アプリからの ID トークン: バンドル ID
// - Mac 版からの Web(ASWebAuthenticationSession)経由の ID トークン: Services ID
// Services ID は Apple Developer Portal で Primary App ID = BUNDLE_ID と紐付けて
// 作成しているため、どちらの経路でサインインしても sub(ユーザー識別子)は同一になる。
const APPLE_ISSUER = 'https://appleid.apple.com';
const BUNDLE_ID = 'com.tsunagibito.PodBlock';
const WEB_SERVICES_ID = 'com.tsunagibito.PodBlock.web';

const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export interface AppleIdentity {
	sub: string;
	email?: string;
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentity> {
	const { payload } = await jwtVerify(identityToken, jwks, {
		issuer: APPLE_ISSUER,
		audience: [BUNDLE_ID, WEB_SERVICES_ID]
	});
	if (!payload.sub) throw new Error('apple token has no sub');
	return { sub: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined };
}
