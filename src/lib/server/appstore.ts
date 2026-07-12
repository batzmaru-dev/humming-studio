import { X509Certificate } from 'node:crypto';
import { compactVerify, decodeProtectedHeader, importX509 } from 'jose';

// StoreKit 2 の Transaction.jwsRepresentation(Apple 署名の JWS)をサーバー側で検証する。
// x5c 証明書チェーンを Apple Root CA - G3 まで辿り、リーフ鍵で署名を検証する。
// これにより「Pro サブスクを持っている」ことをクライアント申告なしに確認できる。

const BUNDLE_ID = 'com.tsunagibito.PodBlock';
const PRO_PRODUCT_ID = 'com.tsunagibito.PodBlock.pro.monthly';
const APPLE_ROOT_URL = 'https://www.apple.com/certificateauthority/AppleRootCA-G3.cer';

interface TransactionPayload {
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
	if (tx.productId !== PRO_PRODUCT_ID) return 'not a Pro subscription';
	if (tx.revocationDate) return 'subscription revoked';
	if (!tx.expiresDate || tx.expiresDate < Date.now()) return 'subscription expired';
	return null;
}
