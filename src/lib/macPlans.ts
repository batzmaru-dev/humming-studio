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
		checkoutUrl: ''
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
		checkoutUrl: ''
	}
];

/** Mac 版の解放コードの購入・問い合わせ窓口(特商法の表記・料金ページ・アプリ内の問い合わせ先で共通) */
export const MAC_PLANS_CONTACT = 'info@tsunagu-hito.com';
