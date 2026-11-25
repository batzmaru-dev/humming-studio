import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

// Stripe(Mac 直接配布版の Pro 月額)。SDK は入れず、必要な API だけ fetch で呼ぶ。
//
// 環境変数:
//   STRIPE_SECRET_KEY      制限付きキー(rk_)でよい。Checkout セッション・顧客ポータル・
//                          サブスクリプションの読み取り・価格の読み取りが要る
//   STRIPE_WEBHOOK_SECRET  Webhook エンドポイントの署名シークレット(whsec_)
// どちらかが無ければ月額の受付ごと無効(configured() が false)。

/** Pro 月額の価格を引くキー。scripts/stripe-setup-mac-plans.mjs が作る */
export const PRO_MONTHLY_LOOKUP_KEY = 'hs_mac_pro_monthly_jpy';

export function stripeConfigured(): boolean {
	return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

/** Stripe の API はフォーム形式。入れ子は a[b][c]=v に展開する */
function encode(obj: Record<string, unknown>, prefix = '', out = new URLSearchParams()): URLSearchParams {
	for (const [k, v] of Object.entries(obj)) {
		const name = prefix ? `${prefix}[${k}]` : k;
		if (v !== null && typeof v === 'object') encode(v as Record<string, unknown>, name, out);
		else if (v !== undefined && v !== null) out.append(name, String(v));
	}
	return out;
}

export class StripeError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

export async function stripeApi<T>(
	method: 'GET' | 'POST',
	path: string,
	body?: Record<string, unknown>
): Promise<T> {
	const key = env.STRIPE_SECRET_KEY;
	if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
	const query = method === 'GET' && body ? `?${encode(body)}` : '';
	const res = await fetch(`https://api.stripe.com/v1${path}${query}`, {
		method,
		headers: {
			authorization: `Bearer ${key}`,
			...(method === 'POST' ? { 'content-type': 'application/x-www-form-urlencoded' } : {})
		},
		body: method === 'POST' && body ? encode(body) : undefined,
		signal: AbortSignal.timeout(20_000)
	});
	const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
	if (!res.ok) throw new StripeError(res.status, json?.error?.message ?? `Stripe ${res.status}`);
	return json as T;
}

/**
 * Webhook の署名(Stripe-Signature ヘッダー)を検証する。
 * 形式: t=<unix秒>,v1=<HMAC-SHA256(secret, `${t}.${生の本文}`) の16進>[,v1=...]
 * 再送攻撃を避けるため、5 分より古いものは受け付けない。
 */
export function verifyStripeSignature(
	rawBody: string,
	header: string | null,
	secret: string,
	nowSeconds = Math.floor(Date.now() / 1000),
	toleranceSeconds = 300
): boolean {
	if (!header) return false;
	let timestamp = '';
	const signatures: string[] = [];
	for (const part of header.split(',')) {
		const [k, v] = part.split('=', 2);
		if (k === 't') timestamp = v ?? '';
		else if (k === 'v1' && v) signatures.push(v);
	}
	const t = Number(timestamp);
	if (!Number.isFinite(t) || signatures.length === 0) return false;
	if (Math.abs(nowSeconds - t) > toleranceSeconds) return false;
	const expected = Buffer.from(
		createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex'),
		'utf8'
	);
	return signatures.some((sig) => {
		const got = Buffer.from(sig, 'utf8');
		return got.length === expected.length && timingSafeEqual(got, expected);
	});
}

export interface StripeSubscription {
	id: string;
	status: string;
	customer: string;
	cancel_at_period_end?: boolean;
	current_period_end?: number;
	items?: { data: { current_period_end?: number; price?: { lookup_key?: string | null } }[] };
	metadata?: Record<string, string>;
}

/**
 * サブスクリプションの「ここまで使える」時刻。
 * API のバージョンによって current_period_end の位置が違う(新しい版は items 側)ので両方見る。
 */
export function subscriptionPeriodEnd(s: StripeSubscription): Date | null {
	const seconds = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
	return typeof seconds === 'number' ? new Date(seconds * 1000) : null;
}

/**
 * 利用できる状態か。支払いが一時的に失敗している(past_due)あいだは、Stripe が再試行して
 * いる期間なので使えるままにする。再試行が尽きると unpaid / canceled になる。
 */
export function subscriptionEntitled(s: StripeSubscription): boolean {
	return s.status === 'active' || s.status === 'trialing' || s.status === 'past_due';
}
