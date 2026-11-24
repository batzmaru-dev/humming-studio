import { env } from '$env/dynamic/private';
import { verifyProSubscription } from './appstore';
import { hasProGrant } from './unlockCodes';
import { unlockDb } from './unlockDb';

/**
 * Pro サブスク検証。OK なら null、NG なら理由文字列を返す。
 * AI_FREE_SUBS(カンマ区切り sub)は審査前の動作確認バイパス(BGM/SE 生成と共通)。
 */
export async function checkPro(sub: string, transactionJWS: string | undefined): Promise<string | null> {
	const freeSubs = (env.AI_FREE_SUBS ?? '').split(',').filter(Boolean);
	if (freeSubs.includes(sub)) return null;
	return verifyProOrGrant(sub, transactionJWS);
}

/**
 * App Store の Pro サブスク、または解放コード(pro)のどちらかがあれば null。
 *
 * Mac の直接配布版は StoreKit で購入できない(サンドボックスにしかつながらない)ため、
 * 運営が発行した解放コードを sub に紐づけて Pro 扱いにする。詳細は unlockCodes.ts。
 * 先に JWS を検証するので、App Store で加入している利用者は DB を引かない。
 */
export async function verifyProOrGrant(
	sub: string,
	transactionJWS: string | undefined
): Promise<string | null> {
	const reason = await verifyProSubscription(transactionJWS ?? '');
	if (!reason) return null;
	try {
		if (await hasProGrant(await unlockDb(), sub)) return null;
	} catch (e) {
		// コードの照会に失敗しても、元の判定(未加入)を返すだけにする
		console.error('[pro] unlock grant lookup failed', e);
	}
	return reason;
}

/** 管理者トークン検証(生放送の審査 API を守る)。ADMIN_TOKEN 未設定なら常に false。 */
export function isAdmin(request: Request): boolean {
	const expected = env.ADMIN_TOKEN;
	if (!expected) return false;
	const header = request.headers.get('authorization') ?? '';
	const token = header.replace(/^Bearer\s+/i, '');
	return token.length > 0 && token === expected;
}

/** Slack 通知(SLACK_WEBHOOK_URL 未設定なら何もしない)。失敗しても本処理は止めない。 */
export async function notifySlack(text: string): Promise<void> {
	const url = env.SLACK_WEBHOOK_URL;
	if (!url) return;
	try {
		await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text }),
			signal: AbortSignal.timeout(5000)
		});
	} catch {
		// 通知失敗は無視
	}
}
