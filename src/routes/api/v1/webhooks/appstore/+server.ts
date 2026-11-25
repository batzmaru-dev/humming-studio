import { json, error } from '@sveltejs/kit';
import { classifyTransaction, verifyNotification } from '$lib/server/appstore';
import { updateEntitlementByRef } from '$lib/server/entitlements';
import { unlockDb } from '$lib/server/unlockDb';

export const prerender = false;

/**
 * App Store サーバー通知 V2(サブスクの更新・解約・返金)。
 *
 * iPhone で契約した Pro を Mac でも使えるようにしているので、iPhone のアプリを開かなくても
 * 期限の延長や返金がサーバーに届く必要がある。Apple が署名した通知だけを受け付ける。
 *
 * アカウントは通知からは分からない。アプリが /api/v1/entitlements/appstore で登録済みの
 * 購入(originalTransactionId)だけを更新し、未登録の購入は無視する(200 で返す)。
 */
export async function POST({ request }: { request: Request }) {
	const body = (await request.json().catch(() => null)) as { signedPayload?: unknown } | null;
	if (!body || typeof body.signedPayload !== 'string') throw error(400, 'signedPayload is required');

	let notification;
	try {
		notification = await verifyNotification(body.signedPayload);
	} catch {
		throw error(400, 'invalid signature');
	}
	const purchase = notification.transaction ? classifyTransaction(notification.transaction) : null;
	if (!purchase) return json({ received: true, ignored: true });

	const updated = await updateEntitlementByRef(
		await unlockDb(),
		'appstore',
		purchase.originalTransactionId,
		{
			expiresAt: purchase.expiresAt,
			revokedAt: purchase.revokedAt,
			detail: `${purchase.environment} ${notification.notificationType}${notification.subtype ? '/' + notification.subtype : ''}`
		}
	);
	return json({ received: true, updated });
}
