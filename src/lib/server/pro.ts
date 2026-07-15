import { env } from '$env/dynamic/private';
import { verifyProSubscription } from './appstore';

/**
 * Pro サブスク検証。OK なら null、NG なら理由文字列を返す。
 * AI_FREE_SUBS(カンマ区切り sub)は審査前の動作確認バイパス(BGM/SE 生成と共通)。
 */
export async function checkPro(sub: string, transactionJWS: string | undefined): Promise<string | null> {
	const freeSubs = (env.AI_FREE_SUBS ?? '').split(',').filter(Boolean);
	if (freeSubs.includes(sub)) return null;
	return verifyProSubscription(transactionJWS ?? '');
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
