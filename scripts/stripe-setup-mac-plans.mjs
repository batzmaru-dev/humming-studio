// Mac 版の解放コード(Unlock / Pro)を売るための Stripe の商品・価格・決済リンクを用意する。
//
// 何度実行しても同じ結果になる(すでにあるものは作り直さない)。
// サンドボックスで試してから、本番のキーで同じものを作るために使う。
//
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup-mac-plans.mjs          # サンドボックス
//   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup-mac-plans.mjs --live   # 本番(--live が無いと止まる)
//
// 出力された決済リンクの URL を src/lib/macPlans.ts の checkoutUrl に入れる。
// キーはファイルに書かず、環境変数で渡すこと。
//
// 価格は税込(tax_behavior: inclusive)。買い切りの決済で、サブスクリプションではない
// (Pro も 1 年分の買い切り。自動更新はしない)。
const key = process.env.STRIPE_SECRET_KEY ?? '';
const live = process.argv.includes('--live');
if (!key.startsWith('sk_')) {
	console.error('STRIPE_SECRET_KEY を環境変数で渡してください');
	process.exit(1);
}
if (key.startsWith('sk_live_') && !live) {
	console.error('本番のキーです。本番に作る場合は --live を付けて実行してください');
	process.exit(1);
}
if (!key.startsWith('sk_live_') && live) {
	console.error('--live が付いていますが、本番のキーではありません');
	process.exit(1);
}

const PLANS = [
	{
		plan: 'unlock',
		productId: 'hs_mac_unlock',
		lookupKey: 'hs_mac_unlock_jpy',
		name: 'Humming Studio Unlock(Mac 版 解放コード)',
		description: '買い切り。書き出しの長さ無制限・複数番組・動画の演出。Mac 1 台で利用できます。',
		amount: 3000
	},
	{
		plan: 'pro',
		productId: 'hs_mac_pro_1y',
		lookupKey: 'hs_mac_pro_1y_jpy',
		name: 'Humming Studio Pro 1年(Mac 版 解放コード)',
		description:
			'コードを有効にした日から 1 年間。Unlock の機能に加えてクラウドの AI 機能。自動更新はありません。Mac 1 台で利用できます。',
		amount: 6000
	}
];

const CONFIRMATION =
	'ご購入ありがとうございます。解放コードは、決済時のメールアドレス宛に 3 営業日以内にお送りします。届かない場合は kawakami@tsunagu-hito.com までご連絡ください。';

/** Stripe の API はフォーム形式。入れ子は a[b][c]=v の形に展開する */
function encode(obj, prefix = '', out = new URLSearchParams()) {
	for (const [k, v] of Object.entries(obj)) {
		const name = prefix ? `${prefix}[${k}]` : k;
		if (v !== null && typeof v === 'object') encode(v, name, out);
		else if (v !== undefined) out.append(name, String(v));
	}
	return out;
}

async function stripe(method, path, body) {
	const url = `https://api.stripe.com/v1${path}` + (method === 'GET' && body ? `?${encode(body)}` : '');
	const res = await fetch(url, {
		method,
		headers: {
			authorization: `Bearer ${key}`,
			...(method === 'POST' ? { 'content-type': 'application/x-www-form-urlencoded' } : {})
		},
		body: method === 'POST' && body ? encode(body) : undefined
	});
	const json = await res.json();
	if (!res.ok) {
		const err = new Error(json?.error?.message ?? `Stripe ${res.status}`);
		err.status = res.status;
		err.code = json?.error?.code;
		throw err;
	}
	return json;
}

async function ensureProduct(p) {
	try {
		return await stripe('GET', `/products/${p.productId}`);
	} catch (e) {
		if (e.status !== 404) throw e;
	}
	return stripe('POST', '/products', {
		id: p.productId,
		name: p.name,
		description: p.description,
		metadata: { plan: p.plan }
	});
}

async function ensurePrice(p) {
	const found = await stripe('GET', '/prices', { lookup_keys: { 0: p.lookupKey }, limit: 1 });
	if (found.data.length > 0) {
		const price = found.data[0];
		if (price.unit_amount !== p.amount || price.currency !== 'jpy') {
			throw new Error(
				`${p.lookupKey} が ${price.unit_amount} ${price.currency} で登録済みです。金額を変える場合は Stripe 側で価格を作り直してください`
			);
		}
		return price;
	}
	return stripe('POST', '/prices', {
		product: p.productId,
		currency: 'jpy',
		unit_amount: p.amount,
		tax_behavior: 'inclusive',
		lookup_key: p.lookupKey,
		metadata: { plan: p.plan }
	});
}

async function ensurePaymentLink(p, price) {
	// 決済リンクには検索用のキーが無いので、有効なものを一覧してメタデータで探す
	let startingAfter;
	for (let page = 0; page < 10; page++) {
		const list = await stripe('GET', '/payment_links', {
			active: true,
			limit: 100,
			...(startingAfter ? { starting_after: startingAfter } : {})
		});
		const hit = list.data.find((l) => l.metadata?.hs_plan === p.plan);
		if (hit) return hit;
		if (!list.has_more) break;
		startingAfter = list.data[list.data.length - 1].id;
	}
	return stripe('POST', '/payment_links', {
		line_items: { 0: { price: price.id, quantity: 1 } },
		// 買った人と、どのプランかを決済に残す(コードを発行するときの突き合わせ用)
		metadata: { hs_plan: p.plan },
		payment_intent_data: { metadata: { hs_plan: p.plan } },
		customer_creation: 'always',
		after_completion: {
			type: 'hosted_confirmation',
			hosted_confirmation: { custom_message: CONFIRMATION }
		}
	});
}

console.log(live ? '== 本番環境 ==' : '== サンドボックス(テスト) ==');
for (const p of PLANS) {
	await ensureProduct(p);
	const price = await ensurePrice(p);
	const link = await ensurePaymentLink(p, price);
	console.log(`${p.plan.padEnd(6)}  ${p.amount.toLocaleString('ja-JP')}円(税込)  ${link.url}`);
}
console.log('上の URL を src/lib/macPlans.ts の checkoutUrl に入れてください。');
