import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { requireAuth } from '$lib/server/session';
import { verifyProSubscription } from '$lib/server/appstore';

export const prerender = false;
export const config = { maxDuration: 60 };

/**
 * トピック抽出(Pro サブスク限定)。文字起こしブロックから話題のまとまりを抽出する。
 * オンデバイス(Apple Intelligence)非対応環境向けのクラウド版。
 *
 * body: {
 *   transactionJWS: string,
 *   blocks: [{ index: number, text: string }]   // 発話ブロック(最大 500)
 * }
 * 返り値: { groups: [{ title: string, blockIndexes: number[] }] }
 */
export async function POST({ request }) {
	await requireAuth(request);
	if (!env.ANTHROPIC_API_KEY) throw error(503, 'AI トピック抽出は準備中です');

	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');
	if (typeof body.transactionJWS !== 'string') throw error(400, 'transactionJWS is required');
	if (!Array.isArray(body.blocks) || body.blocks.length === 0)
		throw error(400, 'blocks is required');
	if (body.blocks.length > 500) throw error(400, 'too many blocks (max 500)');

	const reason = await verifyProSubscription(body.transactionJWS);
	if (reason) throw error(403, `Pro サブスクリプションが必要です(${reason})`);

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
			max_tokens: 2000,
			messages: [
				{
					role: 'user',
					content:
						'以下はポッドキャストの文字起こしブロックです(各行の [n] はブロック番号)。' +
						'話題ごとに連続するブロックをグループ化し、JSON のみで返してください。' +
						'形式: {"groups":[{"title":"短い話題名","blockIndexes":[0,1,2]}]}\n\n' +
						transcript
				}
			]
		})
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		console.error('anthropic topics failed', res.status, detail.slice(0, 500));
		throw error(502, 'トピック抽出に失敗しました');
	}
	const result = await res.json();
	const text: string = result.content?.[0]?.text ?? '';
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) throw error(502, 'トピック抽出の結果を解釈できませんでした');

	let groups: { title: string; blockIndexes: number[] }[];
	try {
		groups = JSON.parse(match[0]).groups ?? [];
	} catch {
		throw error(502, 'トピック抽出の結果を解釈できませんでした');
	}
	return json({ groups });
}
