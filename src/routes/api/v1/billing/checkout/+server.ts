import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getAccountEntitlements } from '$lib/server/entitlements';
import { PRO_MONTHLY_LOOKUP_KEY, stripeApi, stripeConfigured } from '$lib/server/stripe';
import { unlockDb } from '$lib/server/unlockDb';

export const prerender = false;

const SITE = 'https://humming-studio.com';

/**
 * Pro 月額(Stripe)の申込みを始める(Mac 直接配布版のアプリが呼ぶ)。
 *
 *   POST /api/v1/billing/checkout
 *   → 200 { url }   Stripe の決済ページ。アプリはブラウザで開く
 *   → 409 すでに有効な Pro がある(二重に契約させない)
 *   → 503 月額を受け付けていない(Stripe 未設定)
 *
 * 誰の契約かは、決済ページに渡す client_reference_id とサブスクリプションの
 * metadata.sub で持つ。決済が済むと Stripe が /api/v1/webhooks/stripe を呼び、
 * そこでアカウントに Pro を付ける。
 */
export async function POST({ request }: { request: Request }) {
	const sub = await requireAuth(request);
	if (!stripeConfigured()) throw error(503, 'monthly plan is not available');

	const current = await getAccountEntitlements(await unlockDb(), sub);
	if (current.pro) throw error(409, 'already subscribed');

	const prices = await stripeApi<{ data: { id: string }[] }>('GET', '/prices', {
		lookup_keys: { 0: PRO_MONTHLY_LOOKUP_KEY },
		active: true,
		limit: 1
	});
	const price = prices.data[0];
	if (!price) throw error(503, 'monthly price is not set up');

	const session = await stripeApi<{ url: string }>('POST', '/checkout/sessions', {
		mode: 'subscription',
		line_items: { 0: { price: price.id, quantity: 1 } },
		client_reference_id: sub,
		subscription_data: { metadata: { sub, hs_plan: 'pro_monthly' } },
		metadata: { sub, hs_plan: 'pro_monthly' },
		locale: 'ja',
		success_url: `${SITE}/mac-plans/thanks`,
		cancel_url: `${SITE}/mac-plans`
	});
	return json({ url: session.url });
}
