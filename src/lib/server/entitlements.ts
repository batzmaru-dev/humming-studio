import type { Queryable } from './unlockCodes';

// アカウント(Apple サインインの sub)単位の利用権。
//
// 以前はアプリが毎回 App Store の購入証明(JWS)を送り、サーバーはそれを検証するだけ
// だったので、権利は「その購入をした端末」にしか無かった。iPhone と Mac で同じ Pro を
// 使えるようにするため、購入元(App Store / Stripe)ごとの権利をここに持ち、
// サインインしたアカウントで引く(2026-11-25 川上決定)。
//
// - 1 行 = 1 つの購入。App Store は originalTransactionId、Stripe は subscription の id が ref
// - 1 つの購入は 1 つのアカウントにしか紐づけない(主キーが source + ref)。
//   購入証明を他人のアカウントに登録して Pro を配る、を防ぐ
// - expires_at が null の行は期限なし(買い切りの Unlock)
// - 解放コード(unlock_codes)は端末単位の別の仕組みで、ここには入れない

export type EntitlementSource = 'appstore' | 'stripe';
export type EntitlementPlan = 'pro' | 'unlock';

export const ENTITLEMENT_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS entitlements (
	source      text NOT NULL,
	ref         text NOT NULL,
	sub         text NOT NULL,
	plan        text NOT NULL,
	expires_at  timestamptz,
	revoked_at  timestamptz,
	customer_id text,
	detail      text,
	created_at  timestamptz NOT NULL DEFAULT now(),
	updated_at  timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (source, ref)
);
CREATE INDEX IF NOT EXISTS entitlements_sub ON entitlements (sub);
CREATE INDEX IF NOT EXISTS entitlements_customer ON entitlements (customer_id) WHERE customer_id IS NOT NULL;
`;

export async function ensureEntitlementSchema(db: Queryable): Promise<void> {
	await db.query(ENTITLEMENT_SCHEMA_SQL);
}

export interface EntitlementInput {
	source: EntitlementSource;
	ref: string;
	sub: string;
	plan: EntitlementPlan;
	/** null は期限なし */
	expiresAt: Date | null;
	/** 返金・取り消しされた時刻。null は有効 */
	revokedAt?: Date | null;
	customerId?: string | null;
	/** 状態のメモ(Stripe の status など)。判定には使わない */
	detail?: string | null;
}

export type UpsertResult = { ok: true } | { ok: false; reason: 'other_account' };

/**
 * 購入を登録・更新する。すでに別のアカウントに紐づいている購入は上書きしない。
 */
export async function upsertEntitlement(db: Queryable, e: EntitlementInput): Promise<UpsertResult> {
	const { rows } = await db.query(
		`INSERT INTO entitlements (source, ref, sub, plan, expires_at, revoked_at, customer_id, detail)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 ON CONFLICT (source, ref) DO UPDATE
		    SET plan        = EXCLUDED.plan,
		        expires_at  = EXCLUDED.expires_at,
		        revoked_at  = EXCLUDED.revoked_at,
		        customer_id = COALESCE(EXCLUDED.customer_id, entitlements.customer_id),
		        detail      = EXCLUDED.detail,
		        updated_at  = now()
		  WHERE entitlements.sub = EXCLUDED.sub
		RETURNING sub`,
		[
			e.source,
			e.ref,
			e.sub,
			e.plan,
			e.expiresAt ? e.expiresAt.toISOString() : null,
			e.revokedAt ? e.revokedAt.toISOString() : null,
			e.customerId ?? null,
			e.detail ?? null
		]
	);
	return rows.length > 0 ? { ok: true } : { ok: false, reason: 'other_account' };
}

/**
 * 通知(App Store / Stripe の Webhook)から来た更新。アカウントは分からないので、
 * すでに登録済みの行だけを更新する。行が無ければ何もしない(false)。
 */
export async function updateEntitlementByRef(
	db: Queryable,
	source: EntitlementSource,
	ref: string,
	patch: { expiresAt: Date | null; revokedAt: Date | null; detail?: string | null }
): Promise<boolean> {
	const { rows } = await db.query(
		`UPDATE entitlements
		    SET expires_at = $3, revoked_at = $4, detail = COALESCE($5, detail), updated_at = now()
		  WHERE source = $1 AND ref = $2
		RETURNING sub`,
		[
			source,
			ref,
			patch.expiresAt ? patch.expiresAt.toISOString() : null,
			patch.revokedAt ? patch.revokedAt.toISOString() : null,
			patch.detail ?? null
		]
	);
	return rows.length > 0;
}

export interface AccountEntitlements {
	/** 有効な Pro(複数あれば期限がいちばん先のもの)。無ければ null */
	pro: { expiresAt: string; source: EntitlementSource } | null;
	/** 買い切りの Unlock を持っているか(Pro が有効なあいだは Pro が Unlock を含む) */
	unlocked: boolean;
	/** Stripe で契約中か(契約の管理画面を出せるか) */
	stripeCustomer: boolean;
}

/** このアカウントで今有効な権利 */
export async function getAccountEntitlements(db: Queryable, sub: string): Promise<AccountEntitlements> {
	const { rows } = await db.query(
		`SELECT source, plan, expires_at, customer_id
		   FROM entitlements
		  WHERE sub = $1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`,
		[sub]
	);
	let pro: AccountEntitlements['pro'] = null;
	let unlocked = false;
	let stripeCustomer = false;
	for (const r of rows) {
		if (r.source === 'stripe' && r.customer_id) stripeCustomer = true;
		if (r.plan === 'unlock') {
			unlocked = true;
			continue;
		}
		if (r.plan !== 'pro' || !r.expires_at) continue;
		const expiresAt = new Date(r.expires_at as string | Date).toISOString();
		if (!pro || expiresAt > pro.expiresAt) pro = { expiresAt, source: r.source as EntitlementSource };
	}
	return { pro, unlocked, stripeCustomer };
}

/** クラウド機能の課金判定用: このアカウントに有効な Pro があるか */
export async function hasAccountPro(db: Queryable, sub: string): Promise<boolean> {
	const { rows } = await db.query(
		`SELECT 1 FROM entitlements
		  WHERE sub = $1 AND plan = 'pro' AND revoked_at IS NULL AND expires_at > now()
		  LIMIT 1`,
		[sub]
	);
	return rows.length > 0;
}

/** Stripe の顧客 ID(契約の管理画面を開くのに使う)。期限切れの行からも探す */
export async function findStripeCustomer(db: Queryable, sub: string): Promise<string | null> {
	const { rows } = await db.query(
		`SELECT customer_id FROM entitlements
		  WHERE sub = $1 AND source = 'stripe' AND customer_id IS NOT NULL
		  ORDER BY updated_at DESC LIMIT 1`,
		[sub]
	);
	return rows.length > 0 ? (rows[0].customer_id as string) : null;
}
