import { X509Certificate } from 'node:crypto';
import { compactVerify, decodeProtectedHeader, importX509 } from 'jose';

// StoreKit 2 の Transaction.jwsRepresentation(Apple 署名の JWS)をサーバー側で検証する。
// x5c 証明書チェーンを Apple Root CA - G3 まで辿り、リーフ鍵で署名を検証する。
// これにより「Pro サブスクを持っている」ことをクライアント申告なしに確認できる。

const BUNDLE_ID = 'com.tsunagibito.PodBlock';
const PRO_PRODUCT_IDS = ['com.tsunagibito.PodBlock.pro.monthly', 'com.tsunagibito.PodBlock.pro.annual'];
const UNLOCK_PRODUCT_ID = 'com.tsunagibito.PodBlock.unlock';
const APPLE_ROOT_URL = 'https://www.apple.com/certificateauthority/AppleRootCA-G3.cer';

export interface TransactionPayload {
	bundleId: string;
	productId: string;
	expiresDate?: number; // ms
	revocationDate?: number;
	environment: 'Sandbox' | 'Production';
	originalTransactionId: string;
}

let cachedRoot: X509Certificate | null = null;

async function appleRoot(): Promise<X509Certificate> {
	if (!cachedRoot) {
		const res = await fetch(APPLE_ROOT_URL);
		if (!res.ok) throw new Error('failed to fetch Apple root certificate');
		cachedRoot = new X509Certificate(Buffer.from(await res.arrayBuffer()));
	}
	return cachedRoot;
}

/** JWS を検証してトランザクションのペイロードを返す(署名・チェーン不正は例外) */
export async function verifyTransactionJWS(jws: string): Promise<TransactionPayload> {
	const header = decodeProtectedHeader(jws);
	const x5c = header.x5c;
	if (!x5c || x5c.length < 3) throw new Error('missing x5c chain');

	const certs = x5c.map((c) => new X509Certificate(Buffer.from(c, 'base64')));
	const root = await appleRoot();

	// チェーン検証: chain の末尾が Apple Root と一致し、各証明書が上位で署名されている
	if (!certs[certs.length - 1].raw.equals(root.raw)) {
		throw new Error('certificate chain does not end at Apple Root CA');
	}
	for (let i = 0; i < certs.length - 1; i++) {
		if (!certs[i].verify(certs[i + 1].publicKey)) {
			throw new Error(`certificate chain verification failed at ${i}`);
		}
	}
	const now = Date.now();
	for (const cert of certs) {
		if (now < Date.parse(cert.validFrom) || now > Date.parse(cert.validTo)) {
			throw new Error('certificate expired');
		}
	}

	// リーフ証明書の公開鍵で JWS 署名を検証
	const leafKey = await importX509(certs[0].toString(), 'ES256');
	const { payload } = await compactVerify(jws, leafKey);
	return JSON.parse(new TextDecoder().decode(payload)) as TransactionPayload;
}

/** Pro サブスクリプションの有効なトランザクションか検証する。無効なら理由文字列を返す */
export async function verifyProSubscription(jws: string): Promise<string | null> {
	let tx: TransactionPayload;
	try {
		tx = await verifyTransactionJWS(jws);
	} catch (e) {
		return e instanceof Error ? e.message : 'invalid transaction';
	}
	if (tx.bundleId !== BUNDLE_ID) return 'bundleId mismatch';
	if (!PRO_PRODUCT_IDS.includes(tx.productId)) return 'not a Pro subscription';
	if (tx.revocationDate) return 'subscription revoked';
	if (!tx.expiresDate || tx.expiresDate < Date.now()) return 'subscription expired';
	return null;
}

export interface AppStorePurchase {
	plan: 'pro' | 'unlock';
	originalTransactionId: string;
	/** Pro は更新期限。Unlock(買い切り)は null */
	expiresAt: Date | null;
	/** 返金・取り消しされていればその時刻 */
	revokedAt: Date | null;
	environment: 'Sandbox' | 'Production';
}

/**
 * 検証済みのトランザクションを、アカウントに登録できる形に読み替える。
 * このアプリの商品でなければ null(理由は呼び出し側で 400 にする)。
 */
export function classifyTransaction(tx: TransactionPayload): AppStorePurchase | null {
	if (tx.bundleId !== BUNDLE_ID) return null;
	const revokedAt = tx.revocationDate ? new Date(tx.revocationDate) : null;
	const base = { originalTransactionId: tx.originalTransactionId, revokedAt, environment: tx.environment };
	if (PRO_PRODUCT_IDS.includes(tx.productId)) {
		if (!tx.expiresDate) return null;
		return { ...base, plan: 'pro', expiresAt: new Date(tx.expiresDate) };
	}
	if (tx.productId === UNLOCK_PRODUCT_ID) return { ...base, plan: 'unlock', expiresAt: null };
	return null;
}

/**
 * App Store サーバー通知 V2 の signedPayload を検証して中身を返す。
 * 署名の形式はトランザクションの JWS と同じ(x5c を Apple Root CA まで辿る)。
 */
export async function verifyNotification(signedPayload: string): Promise<{
	notificationType: string;
	subtype?: string;
	transaction: TransactionPayload | null;
}> {
	const outer = (await verifyTransactionJWS(signedPayload)) as unknown as {
		notificationType: string;
		subtype?: string;
		data?: { bundleId?: string; signedTransactionInfo?: string };
	};
	const signed = outer.data?.signedTransactionInfo;
	const transaction = signed ? await verifyTransactionJWS(signed) : null;
	return { notificationType: outer.notificationType, subtype: outer.subtype, transaction };
}
