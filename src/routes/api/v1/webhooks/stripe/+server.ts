import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { updateEntitlementByRef, upsertEntitlement } from '$lib/server/entitlements';
import {
	stripeApi,
	subscriptionEntitled,
	subscriptionPeriodEnd,
	verifyStripeSignature,
	type StripeSubscription
} from '$lib/server/stripe';
import { notifySlack } from '$lib/server/pro';
import { unlockDb } from '$lib/server/unlockDb';

export const prerender = false;

/**
 * Stripe からの通知(Pro 月額の開始・更新・解約)。
 *
 * 受け取るイベント:
 *   checkout.session.completed          申込み完了 → アカウントに Pro を付ける
 *   customer.subscription.updated       更新・支払い失敗・解約予約 → 期限と状態を更新
 *   customer.subscription.deleted       解約が確定 → 失効
 *
 * 署名を検証できない通知は 400 で返す。処理中に失敗したら 500 を返し、Stripe の再送に任せる
 * (同じ通知を何度受けても結果は同じ)。関係ないイベントは 200 で流す。
 */
export async function POST({ request }: { request: Request }) {
	const secret = env.STRIPE_WEBHOOK_SECRET;
	if (!secret) throw error(503, 'webhook is not configured');
	const raw = await request.text();
	if (!verifyStripeSignature(raw, request.headers.get('stripe-signature'), secret)) {
		throw error(400, 'invalid signature');
	}
	const event = JSON.parse(raw) as { type: string; data: { object: Record<string, unknown> } };
	const object = event.data.object;
	const db = await unlockDb();

	if (event.type === 'checkout.session.completed') {
		if (object.mode !== 'subscription' || typeof object.subscription !== 'string') {
			return json({ received: true });
		}
		const sub = typeof object.client_reference_id === 'string' ? object.client_reference_id : '';
		if (!sub) return json({ received: true, ignored: 'no account' });
		// 期限はセッションに無いので、サブスクリプションを取り直す
		const subscription = await stripeApi<StripeSubscription>(
			'GET',
			`/subscriptions/${object.subscription}`
		);
		await apply(db, sub, subscription);
		await notifySlack(`Humming Studio: Mac の Pro 月額の申込みがありました(${subscription.id})`);
		return json({ received: true });
	}

	if (
		event.type === 'customer.subscription.updated' ||
		event.type === 'customer.subscription.deleted'
	) {
		const subscription = object as unknown as StripeSubscription;
		const sub = subscription.metadata?.sub;
		if (sub) {
			await apply(db, sub, subscription);
		} else {
			// metadata が無い(想定外)ときは、登録済みの行だけ更新する
			await updateEntitlementByRef(db, 'stripe', subscription.id, {
				expiresAt: subscriptionPeriodEnd(subscription),
				revokedAt: subscriptionEntitled(subscription) ? null : new Date(),
				detail: subscription.status
			});
		}
		return json({ received: true });
	}

	return json({ received: true });
}

async function apply(
	db: Awaited<ReturnType<typeof unlockDb>>,
	sub: string,
	subscription: StripeSubscription
): Promise<void> {
	const result = await upsertEntitlement(db, {
		source: 'stripe',
		ref: subscription.id,
		sub,
		plan: 'pro',
		expiresAt: subscriptionPeriodEnd(subscription),
		// 使えない状態(canceled / unpaid / incomplete_expired など)は、期限を待たずに失効させる
		revokedAt: subscriptionEntitled(subscription) ? null : new Date(),
		customerId: subscription.customer,
		detail: subscription.cancel_at_period_end
			? `${subscription.status} (cancel at period end)`
			: subscription.status
	});
	if (!result.ok) {
		console.error(`[stripe] subscription ${subscription.id} is bound to another account`);
	}
}
