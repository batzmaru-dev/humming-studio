import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { classifyTransaction, verifyTransactionJWS } from '$lib/server/appstore';
import { getAccountEntitlements, upsertEntitlement } from '$lib/server/entitlements';
import { unlockDb } from '$lib/server/unlockDb';

export const prerender = false;

/**
 * App Store で買った権利を、サインイン中のアカウントに登録する(App Store 版のアプリが呼ぶ)。
 *
 *   POST /api/v1/entitlements/appstore   { transactions: [<StoreKit 2 の jwsRepresentation>, ...] }
 *   → 200 { pro, unlocked, stripeCustomer, registered: n, skipped: [{ reason }] }
 *
 * アプリは「現在の権利(Transaction.currentEntitlements)」の JWS をまとめて送る。
 * Apple の署名を検証できたものだけを登録するので、クライアントの申告は信用していない。
 * 1 つの購入は 1 アカウントにしか紐づかない。別のアカウントに登録済みなら skipped に入る。
 */
export async function POST({ request }: { request: Request }) {
	const sub = await requireAuth(request);
	const body = (await request.json().catch(() => null)) as { transactions?: unknown } | null;
	const list = Array.isArray(body?.transactions) ? body.transactions : null;
	if (!list || list.length === 0 || list.length > 10) {
		throw error(400, 'transactions must be an array of 1..10 JWS strings');
	}

	const db = await unlockDb();
	let registered = 0;
	const skipped: { reason: string }[] = [];
	for (const jws of list) {
		if (typeof jws !== 'string' || jws.length > 20_000) {
			skipped.push({ reason: 'invalid' });
			continue;
		}
		let purchase;
		try {
			purchase = classifyTransaction(await verifyTransactionJWS(jws));
		} catch {
			skipped.push({ reason: 'invalid' });
			continue;
		}
		if (!purchase) {
			skipped.push({ reason: 'not_a_product' });
			continue;
		}
		const result = await upsertEntitlement(db, {
			source: 'appstore',
			ref: purchase.originalTransactionId,
			sub,
			plan: purchase.plan,
			expiresAt: purchase.expiresAt,
			revokedAt: purchase.revokedAt,
			detail: purchase.environment
		});
		if (result.ok) registered++;
		else skipped.push({ reason: 'other_account' });
	}

	return json({ ...(await getAccountEntitlements(db, sub)), registered, skipped });
}
