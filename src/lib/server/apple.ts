import { createRemoteJWKSet, jwtVerify } from 'jose';

// Sign in with Apple の identityToken 検証。
// アプリ(ネイティブ)から来る ID トークンの audience はバンドル ID。
const APPLE_ISSUER = 'https://appleid.apple.com';
const BUNDLE_ID = 'com.tsunagibito.PodBlock';

const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export interface AppleIdentity {
	sub: string;
	email?: string;
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentity> {
	const { payload } = await jwtVerify(identityToken, jwks, {
		issuer: APPLE_ISSUER,
		audience: BUNDLE_ID
	});
	if (!payload.sub) throw new Error('apple token has no sub');
	return { sub: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined };
}
