import { json, error } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';
import { redeemCode } from '$lib/server/unlockCodes';
import { unlockDb } from '$lib/server/unlockDb';

export const prerender = false;

/**
 * 解放コードの引き換え・再検証(Mac 直接配布版のアプリが呼ぶ)。
 *
 *   POST /api/v1/unlock/redeem   { code, deviceId }
 *   → 200 { plan: "unlock" | "pro" }
 *   → 404 コードが存在しない / 409 別の端末で使用済み / 410 失効済み
 *     (本文に reason: "invalid" | "other_device" | "revoked" を付ける)
 *
 * サインインは必須にしない(買い切りの解放だけならアカウント不要)。
 * Authorization が付いていて有効なら、その sub をコードに紐づける。
 * pro のクラウド機能はサーバー側で sub を見て判定するため、アプリはサインイン後にも
 * 同じコードでもう一度これを呼ぶ(同じ端末なら何度呼んでも通る)。
 */
export async function POST({ request }: { request: Request }) {
	const body = (await request.json().catch(() => null)) as {
		code?: unknown;
		deviceId?: unknown;
	} | null;
	if (!body || typeof body.code !== 'string' || typeof body.deviceId !== 'string') {
		throw error(400, 'code and deviceId are required');
	}
	const deviceId = body.deviceId.trim();
	if (deviceId.length < 8 || deviceId.length > 128) throw error(400, 'invalid deviceId');
	if (body.code.length > 64) throw error(400, 'invalid code');

	const sub = await optionalSub(request);
	const result = await redeemCode(await unlockDb(), body.code, deviceId, sub);
	if (result.ok) return json({ plan: result.plan });

	// 断った理由は reason で機械的に読めるようにする。アプリは「失効」「別の端末」と
	// はっきり分かったときだけ端末側の解放を外す(ステータスだけでは、API が無い環境の
	// 404 と「コードが違う」の 404 を区別できない)。
	switch (result.reason) {
		case 'other_device':
			return json(
				{ message: 'このコードは別の端末で使用されています', reason: 'other_device' },
				{ status: 409 }
			);
		case 'revoked':
			return json({ message: 'このコードは無効になっています', reason: 'revoked' }, { status: 410 });
		default:
			return json({ message: 'コードが正しくありません', reason: 'invalid' }, { status: 404 });
	}
}

/** Bearer が有効なら sub、無い・無効なら null(未サインインでも引き換えは通す) */
async function optionalSub(request: Request): Promise<string | null> {
	const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
	const secret = env.SESSION_SECRET;
	if (!token || !secret) return null;
	try {
		const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
			issuer: 'humming-studio'
		});
		return payload.sub ?? null;
	} catch {
		return null;
	}
}
