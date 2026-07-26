import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { requireAuth } from '$lib/server/session';
import { verifyProSubscription } from '$lib/server/appstore';

export const prerender = false;
export const config = { maxDuration: 60 };

/**
 * カット指示の検出(Pro サブスク限定)。文字起こしブロックから、話者が「その部分を
 * 編集でカット/やり直したい」と実際に指示している発言だけを選ぶ。オンデバイス
 * (Apple Intelligence)非対応環境向けのクラウド版。単語「カット」の一致ではなく意味で判定。
 *
 * body: {
 *   transactionJWS: string,
 *   blocks: [{ index: number, text: string }]   // 発話ブロック(最大 500)
 * }
 * 返り値: { cuts: [{ startIndex: number, endIndex: number, phrase: string }] }
 *   startIndex..endIndex = 削除すべきブロック範囲(失敗箇所〜「カット/やり直し」の指示ブロックまで)
 */
export async function POST({ request }) {
	const sub = await requireAuth(request);
	if (!env.ANTHROPIC_API_KEY) throw error(503, 'AI カット検出は準備中です');

	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');
	if (typeof body.transactionJWS !== 'string') throw error(400, 'transactionJWS is required');
	if (!Array.isArray(body.blocks) || body.blocks.length === 0)
		throw error(400, 'blocks is required');
	if (body.blocks.length > 500) throw error(400, 'too many blocks (max 500)');

	// AI_FREE_SUBS はサブスク審査前の動作確認用バイパス
	const freeSubs = (env.AI_FREE_SUBS ?? '').split(',').filter(Boolean);
	if (!freeSubs.includes(sub)) {
		const reason = await verifyProSubscription(body.transactionJWS);
		if (reason) throw error(403, `Pro サブスクリプションが必要です(${reason})`);
	}

	const transcript = body.blocks
		.filter((b: { index?: unknown; text?: unknown }) =>
			typeof b?.index === 'number' && typeof b?.text === 'string' && b.text.trim())
		.map((b: { index: number; text: string }) => `[${b.index}] ${b.text.trim()}`)
		.join('\n');

	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'x-api-key': env.ANTHROPIC_API_KEY,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 1500,
			system:
				'あなたはポッドキャスト編集アシスタントです。文字起こしを読み、話者が' +
				'「その部分を編集でカット/やり直したい」と実際に指示・要望している箇所を見つけ、' +
				'**削除すべきブロックの範囲**を判断します。\n' +
				'該当する例: 「ここカットで」「今の無しで」「さっきのところ使わないで」' +
				'「ここ切っといて」「ちょっと言い直します」「もう一回やり直します」「今のところ編集でお願い」「ここ使えないな」\n' +
				'該当しない例(選ばない): 「ケーキをカットする」「髪をカットする」「ヘアカット」「カットソー」など、' +
				'編集の指示ではなく“切る”という一般的な動作や名詞。単に話題として編集やカットに触れているだけのもの。\n\n' +
				'範囲の決め方: 多くの場合、話者は失敗したあとに「カット/やり直し」と言います。' +
				'その場合 startIndex = 失敗・言い直しが始まったブロック、endIndex = 「カット/やり直し」と言ったブロック(この指示自体も削除に含める)。' +
				'言い直した正しいテイクは範囲に含めないでください。1ブロックだけなら startIndex = endIndex。\n' +
				'判断に迷うものは選ばないでください。JSON のみで返してください。',
			messages: [
				{
					role: 'user',
					content:
						'以下はポッドキャストの文字起こしブロックです(各行の [n] はブロック番号)。' +
						'カット/やり直しの指示がある箇所について、削除すべきブロック範囲を JSON のみで返してください。' +
						'形式: {"cuts":[{"startIndex":0,"endIndex":2,"phrase":"根拠フレーズ"}]}。無ければ {"cuts":[]}。\n\n' +
						transcript
				}
			]
		})
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		console.error('anthropic cuts failed', res.status, detail.slice(0, 500));
		throw error(502, 'カット検出に失敗しました');
	}
	const result = await res.json();
	const text: string = result.content?.[0]?.text ?? '';
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) throw error(502, 'カット検出の結果を解釈できませんでした');

	let cuts: { startIndex: number; endIndex: number; phrase: string }[];
	try {
		const parsed = JSON.parse(match[0]).cuts ?? [];
		cuts = (parsed as unknown[])
			.map((c) => c as { startIndex?: unknown; endIndex?: unknown; index?: unknown; phrase?: unknown })
			.filter(
				(c) =>
					typeof c.startIndex === 'number' ||
					typeof c.index === 'number'
			)
			.map((c) => {
				// startIndex/endIndex 優先。旧形式(index のみ)にも一応対応。
				const s = typeof c.startIndex === 'number' ? c.startIndex : (c.index as number);
				const e = typeof c.endIndex === 'number' ? c.endIndex : s;
				return {
					startIndex: Math.min(s, e),
					endIndex: Math.max(s, e),
					phrase: typeof c.phrase === 'string' ? c.phrase : ''
				};
			});
	} catch {
		throw error(502, 'カット検出の結果を解釈できませんでした');
	}
	return json({ cuts });
}
