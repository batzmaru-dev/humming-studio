import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getAccountEntitlements } from '$lib/server/entitlements';
import { stripeConfigured } from '$lib/server/stripe';
import { unlockDb } from '$lib/server/unlockDb';

export const prerender = false;

/**
 * このアカウントで今有効な権利(アプリがサインイン後・起動時・前面復帰時に呼ぶ)。
 *
 *   GET /api/v1/entitlements
 *   → { pro: { expiresAt, source: "appstore" | "stripe" } | null,
 *       unlocked: boolean,
 *       stripeCustomer: boolean,     // Stripe の契約管理画面を出せるか
 *       monthlyAvailable: boolean }  // Mac の月額(Stripe)を受け付けているか
 *
 * 別の端末で契約した Pro を、この端末でも有効にするための口。
 */
export async function GET({ request }: { request: Request }) {
	const sub = await requireAuth(request);
	const entitlements = await getAccountEntitlements(await unlockDb(), sub);
	return json(
		{ ...entitlements, monthlyAvailable: stripeConfigured() },
		{ headers: { 'cache-control': 'no-store' } }
	);
}
