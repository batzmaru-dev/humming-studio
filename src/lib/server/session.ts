import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

// Humming Studio 自前セッション(Sign in with Apple 検証後に発行)。
// アプリはこれを Authorization: Bearer で送る。
const alg = 'HS256';

function secret(): Uint8Array {
	const s = env.SESSION_SECRET;
	if (!s) throw new Error('SESSION_SECRET is not set');
	return new TextEncoder().encode(s);
}

export async function issueSession(sub: string): Promise<string> {
	return await new SignJWT({})
		.setProtectedHeader({ alg })
		.setSubject(sub)
		.setIssuer('humming-studio')
		.setIssuedAt()
		.setExpirationTime('90d')
		.sign(secret());
}

/** Authorization ヘッダーを検証して Apple の user identifier (sub) を返す */
export async function requireAuth(request: Request): Promise<string> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.replace(/^Bearer\s+/i, '');
	if (!token) throw error(401, 'missing bearer token');
	try {
		const { payload } = await jwtVerify(token, secret(), { issuer: 'humming-studio' });
		if (!payload.sub) throw new Error('no sub');
		return payload.sub;
	} catch {
		throw error(401, 'invalid or expired token');
	}
}
