// Mac 版(ホームページ配布)の料金と決済リンク。
//
// Mac の直接配布版はアプリ内購入が使えないため、解放コードを販売する。
// アプリ側には価格も決済リンクも埋め込まず、「料金と購入方法」からこのページを開く。
// 価格やリンクを変えるときは、ここを直してデプロイするだけでよい(アプリの再配布は不要)。
//
// checkoutUrl が空のあいだは「準備中」と出し、問い合わせ窓口を案内する。

export interface MacPlan {
	id: 'unlock' | 'pro';
	name: string;
	/** 税込の表示価格 */
	price: string;
	term: string;
	summary: string;
	features: string[];
	/** Stripe の決済リンク(Payment Link)。未設定は空文字 */
	checkoutUrl: string;
}

export const MAC_PLANS: MacPlan[] = [
	{
		id: 'unlock',
		name: 'Humming Studio Unlock',
		price: '3,000円',
		term: '買い切り(期限なし)',
		summary: '長い番組を書き出して公開したい方に。',
		features: [
			'書き出しの長さが無制限に(無料版は編集後 10 分まで)',
			'番組をいくつでも作成・管理',
			'テロップのスタイルや動画レイアウトのフル機能'
		],
		checkoutUrl: 'https://buy.stripe.com/7sY8wO8oz6n43ET6ONeZ200'
	},
	{
		id: 'pro',
		name: 'Humming Studio Pro',
		price: '6,000円',
		term: '1 年間(コードを有効にした日から)',
		summary: 'Unlock の内容に加えて、クラウドの AI 機能を使いたい方に。',
		features: [
			'Unlock の機能をすべて含む',
			'クラウド文字起こし(月 360 分)',
			'AI によるカット候補・トピック抽出・企画支援、生放送の予約'
		],
		checkoutUrl: 'https://buy.stripe.com/3cI7sKeMXfXE6R58WVeZ201'
	}
];

/**
 * Pro 月額(Stripe の定期課金)。解放コードとは別の仕組みで、アプリにサインインした
 * アカウントに付く。申込みはアプリのマイページから始める(誰の契約かをサーバーが
 * 知る必要があるので、このページからは直接買えない)。
 *
 * enabled は、Stripe の本番の設定(価格・Webhook・環境変数)が済んでから true にする。
 * false のあいだは、料金ページにも特商法の表記にも月額を出さない。
 */
export const MAC_MONTHLY = {
	enabled: false,
	name: 'Humming Studio Pro 月額',
	price: '600円',
	term: '1 か月ごとに自動更新(いつでも解約できます)',
	summary: 'Pro を月ごとに。同じアカウントの iPhone・iPad でも Pro になります。',
	features: [
		'Pro の機能をすべて含む(Unlock の機能+クラウドの AI 機能)',
		'同じ Apple アカウントでサインインした iPhone・iPad でも使える',
		'解約はアプリのマイページからいつでも'
	]
};

/** Mac 版の解放コードの購入・問い合わせ窓口(特商法の表記・料金ページ・アプリ内の問い合わせ先で共通) */
export const MAC_PLANS_CONTACT = 'info@tsunagu-hito.com';
