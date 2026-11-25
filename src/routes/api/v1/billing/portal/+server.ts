import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { findStripeCustomer } from '$lib/server/entitlements';
import { stripeApi, stripeConfigured } from '$lib/server/stripe';
import { unlockDb } from '$lib/server/unlockDb';

export const prerender = false;

/**
 * Pro 月額(Stripe)の契約管理ページを開く(解約・支払い方法の変更・領収書)。
 *
 *   POST /api/v1/billing/portal
 *   → 200 { url }   Stripe の顧客ポータル
 *   → 404 このアカウントに Stripe の契約が無い
 */
export async function POST({ request }: { request: Request }) {
	const sub = await requireAuth(request);
	if (!stripeConfigured()) throw error(503, 'monthly plan is not available');
	const customer = await findStripeCustomer(await unlockDb(), sub);
	if (!customer) throw error(404, 'no stripe subscription for this account');
	const session = await stripeApi<{ url: string }>('POST', '/billing_portal/sessions', {
		customer,
		return_url: 'https://humming-studio.com/mac-plans'
	});
	return json({ url: session.url });
}
