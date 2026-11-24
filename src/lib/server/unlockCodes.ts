import { createHash, randomBytes } from 'node:crypto';

/**
 * 解放コード(Mac 直接配布版の課金手段)。
 *
 * 背景: Mac の直接配布版(Developer ID・App Store レシートなし)では StoreKit が
 * サンドボックス環境にしかつながらず、利用者の本物の Apple アカウントでは購入できない
 * (2026-11 に利用者からの問い合わせで発覚)。そのため Mac 直接配布版では、
 * 運営が利用者ごとに発行したコードで解放する。
 *
 * 設計:
 * - コードは発行時に一度だけ平文で返し、DB には SHA-256 だけを持つ(漏れても使えない)。
 * - 1コード=1端末。同じ端末からの再入力は何度でも通る(再インストール・再検証のため)。
 *   別の端末からは使えない。機種変更は運営が reset して対応する。
 * - plan は 'unlock'(書き出し無制限など)か 'pro'(Unlock+クラウド AI)。
 * - pro のクラウド機能はサーバー側で sub を見て判定するので、サインイン済みの端末が
 *   検証に来たときに sub を紐づける(hasProGrant)。
 *
 * DB アクセスは Queryable を引数で受ける。本番は Neon の Pool、テストは pg を渡す。
 */

export type UnlockPlan = 'unlock' | 'pro';

export interface Queryable {
	query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export const UNLOCK_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS unlock_codes (
	id           bigserial PRIMARY KEY,
	code_hash    text NOT NULL UNIQUE,
	code_hint    text NOT NULL,
	plan         text NOT NULL CHECK (plan IN ('unlock', 'pro')),
	note         text NOT NULL DEFAULT '',
	created_at   timestamptz NOT NULL DEFAULT now(),
	device_id    text,
	sub          text,
	redeemed_at  timestamptz,
	last_seen_at timestamptz,
	revoked_at   timestamptz
);
-- 端末リセット時に、それまで使っていた端末を覚えておく(その端末からの再取得を断るため)
ALTER TABLE unlock_codes ADD COLUMN IF NOT EXISTS blocked_device_id text;
CREATE INDEX IF NOT EXISTS unlock_codes_sub ON unlock_codes (sub) WHERE sub IS NOT NULL;
`;

// 見間違えやすい 0/O・1/I/L を除いた 31 文字。20 文字で約 99 ビット。
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 20;
const GROUP = 5;

/** 入力の揺れ(小文字・空白・ハイフン)を吸収する */
export function normalizeCode(input: string): string {
	return input.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function hashCode(normalized: string): string {
	return createHash('sha256').update(normalized).digest('hex');
}

function generateCode(): string {
	let out = '';
	// 剰余の偏りを避けるため、範囲外のバイトは捨てる
	const limit = 256 - (256 % ALPHABET.length);
	while (out.length < CODE_LENGTH) {
		for (const b of randomBytes(32)) {
			if (b >= limit) continue;
			out += ALPHABET[b % ALPHABET.length];
			if (out.length === CODE_LENGTH) break;
		}
	}
	return out;
}

function formatCode(normalized: string): string {
	return normalized.match(new RegExp(`.{1,${GROUP}}`, 'g'))!.join('-');
}

export async function ensureUnlockSchema(db: Queryable): Promise<void> {
	await db.query(UNLOCK_SCHEMA_SQL);
}

export interface IssuedCode {
	id: number;
	/** 平文。ここでしか返らない */
	code: string;
	plan: UnlockPlan;
	note: string;
}

export async function issueCode(db: Queryable, plan: UnlockPlan, note: string): Promise<IssuedCode> {
	const normalized = generateCode();
	const result = await db.query(
		`INSERT INTO unlock_codes (code_hash, code_hint, plan, note)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		[hashCode(normalized), normalized.slice(-4), plan, note]
	);
	return { id: Number(result.rows[0].id), code: formatCode(normalized), plan, note };
}

export type RedeemResult =
	| { ok: true; plan: UnlockPlan }
	| { ok: false; reason: 'invalid' | 'revoked' | 'other_device' };

/**
 * コードを端末に紐づける(初回)か、紐づけ済みの端末からの再検証を通す。
 * sub があれば紐づける(pro のサーバー側判定に使う)。
 */
export async function redeemCode(
	db: Queryable,
	rawCode: string,
	deviceId: string,
	sub: string | null
): Promise<RedeemResult> {
	const normalized = normalizeCode(rawCode);
	if (normalized.length !== CODE_LENGTH) return { ok: false, reason: 'invalid' };

	// 未使用か、同じ端末のものだけを1文で更新する(同時に2端末から来ても片方しか通らない)
	const updated = await db.query(
		`UPDATE unlock_codes
		    SET device_id    = $2,
		        redeemed_at  = COALESCE(redeemed_at, now()),
		        last_seen_at = now(),
		        sub          = COALESCE($3, sub)
		  WHERE code_hash = $1
		    AND revoked_at IS NULL
		    AND (device_id IS NULL OR device_id = $2)
		    AND (blocked_device_id IS NULL OR blocked_device_id <> $2)
		RETURNING plan`,
		[hashCode(normalized), deviceId, sub]
	);
	if (updated.rows.length > 0) return { ok: true, plan: updated.rows[0].plan as UnlockPlan };

	const found = await db.query(
		`SELECT revoked_at IS NOT NULL AS revoked FROM unlock_codes WHERE code_hash = $1`,
		[hashCode(normalized)]
	);
	if (found.rows.length === 0) return { ok: false, reason: 'invalid' };
	return { ok: false, reason: found.rows[0].revoked ? 'revoked' : 'other_device' };
}

/** この sub に有効な pro コードが紐づいているか(クラウド機能の課金判定用) */
export async function hasProGrant(db: Queryable, sub: string): Promise<boolean> {
	const rows = await db.query(
		`SELECT 1 FROM unlock_codes
		  WHERE sub = $1 AND plan = 'pro' AND revoked_at IS NULL AND redeemed_at IS NOT NULL
		  LIMIT 1`,
		[sub]
	);
	return rows.rows.length > 0;
}

export interface CodeSummary {
	id: number;
	/** 末尾4文字だけ(問い合わせ時の突き合わせ用) */
	hint: string;
	plan: UnlockPlan;
	note: string;
	createdAt: string;
	redeemedAt: string | null;
	lastSeenAt: string | null;
	revokedAt: string | null;
	hasAccount: boolean;
}

export async function listCodes(db: Queryable): Promise<CodeSummary[]> {
	const result = await db.query(
		`SELECT id, code_hint, plan, note, created_at, redeemed_at, last_seen_at, revoked_at,
		        sub IS NOT NULL AS has_account
		   FROM unlock_codes ORDER BY id DESC LIMIT 500`
	);
	const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
	return result.rows.map((r) => ({
		id: Number(r.id),
		hint: r.code_hint as string,
		plan: r.plan as UnlockPlan,
		note: r.note as string,
		createdAt: iso(r.created_at)!,
		redeemedAt: iso(r.redeemed_at),
		lastSeenAt: iso(r.last_seen_at),
		revokedAt: iso(r.revoked_at),
		hasAccount: Boolean(r.has_account)
	}));
}

/** 失効。以後の検証は revoked で落ちる。戻すことはしない(必要なら再発行する) */
export async function revokeCode(db: Queryable, id: number): Promise<boolean> {
	const result = await db.query(
		`UPDATE unlock_codes SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL RETURNING id`,
		[id]
	);
	return result.rows.length > 0;
}

/**
 * 端末の紐づけを外す(機種変更・故障時)。コードは別の端末で使えるようになる。
 *
 * それまで使っていた端末は blocked_device_id に残し、その端末からの再取得は断る。
 * こうしないと、古い Mac が次に起動したときの再検証で自分に紐づけ直してしまい、
 * 新しい Mac がまた「別の端末で使用中」になる。
 * アカウント(sub)の紐づけも外す。pro の判定は sub を見るので、残すと古い側で Pro が続く。
 */
export async function resetCodeDevice(db: Queryable, id: number): Promise<boolean> {
	const result = await db.query(
		`UPDATE unlock_codes
		    SET blocked_device_id = COALESCE(device_id, blocked_device_id),
		        device_id = NULL,
		        sub = NULL
		  WHERE id = $1 AND revoked_at IS NULL RETURNING id`,
		[id]
	);
	return result.rows.length > 0;
}
