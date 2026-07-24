import { loadDefaultJapaneseParser } from 'budoux';

// 和文の改行を自然にするヘルパー。
// BudouX で文節の境界を求め、そこへ ZWSP(U+200B / ゼロ幅スペース)を挿入する。
// SSR(モジュール読み込み時)に実行されるので、初回描画から改行が確定し、
// クライアント適用のようなちらつき・レイアウトシフトが起きない。
//
// 使い方: 適用要素の親側に `word-break: keep-all; overflow-wrap: anywhere;` を
// 効かせておくこと(各ページのルート .hs / .cw / .fm に付与済み)。keep-all で
// 既定の CJK 途中改行を抑え、ZWSP を入れた文節境界だけで折り返させる。
const parser = loadDefaultJapaneseParser();
const ZWSP = '​';

/** 和文文字列を BudouX の文節境界で ZWSP 区切りにして返す。 */
export function bd(text: string): string {
	return parser.parse(text).join(ZWSP);
}
