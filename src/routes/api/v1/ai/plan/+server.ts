import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { requireAuth } from '$lib/server/session';
import { verifyProSubscription } from '$lib/server/appstore';

export const prerender = false;
export const config = { maxDuration: 60 };

/**
 * トピック(トークテーマ)の提案(Pro サブスク限定)。収録前のテーマから、話す話題を提案する。
 * オンデバイス(Apple Intelligence)非対応環境向けのクラウド版。
 *
 * body: {
 *   transactionJWS: string,
 *   concept: string,        // 番組のテーマ・話したいこと(空でも可 = 一般的に盛り上がる話題)
 *   existing?: string[],    // すでにある見出し(重複回避)
 *   count?: number          // 提案数(既定 6)
 * }
 * 返り値: { topics: [{ title: string, note: string }] }
 */
export async function POST({ request }) {
	const sub = await requireAuth(request);
	if (!env.ANTHROPIC_API_KEY) throw error(503, 'AI トピック提案は準備中です');

	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');
	if (typeof body.transactionJWS !== 'string') throw error(400, 'transactionJWS is required');

	const freeSubs = (env.AI_FREE_SUBS ?? '').split(',').filter(Boolean);
	if (!freeSubs.includes(sub)) {
		const reason = await verifyProSubscription(body.transactionJWS);
		if (reason) throw error(403, `Pro サブスクリプションが必要です(${reason})`);
	}

	const concept = (typeof body.concept === 'string' ? body.concept : '').trim().slice(0, 2000);
	const existing: string[] = Array.isArray(body.existing)
		? body.existing.filter((s: unknown): s is string => typeof s === 'string').slice(0, 30)
		: [];
	const count = Math.min(Math.max(Number(body.count) || 6, 1), 12);

	const avoid = existing.length
		? '\n次の話題とは重複しないでください:\n' + existing.map((s) => `・${s}`).join('\n')
		: '';

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
				'あなたはポッドキャストの企画作家です。リスナーが思わず聞き入る、面白くて話が広がる' +
				'トークテーマを提案します。各テーマは短い日本語の見出し(20文字以内)と、なぜ盛り上がるか/' +
				'どう切り込むかの一言(note)を添えてください。JSON のみで返してください。',
			messages: [
				{
					role: 'user',
					content:
						`トークテーマを ${count} 件、話す順に提案してください。` +
						(concept
							? `番組のテーマ・話したいこと「${concept}」に沿って。`
							: 'ジャンルは自由。日常・カルチャー・仕事・エンタメなど幅広く。') +
						avoid +
						'\n形式: {"topics":[{"title":"見出し","note":"一言"}]}'
				}
			]
		})
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		console.error('anthropic plan failed', res.status, detail.slice(0, 500));
		throw error(502, 'トピック提案に失敗しました');
	}
	const result = await res.json();
	const text: string = result.content?.[0]?.text ?? '';
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) throw error(502, 'トピック提案の結果を解釈できませんでした');

	let topics: { title: string; note: string }[];
	try {
		const parsed = JSON.parse(match[0]).topics ?? [];
		const existingSet = new Set(existing);
		topics = (parsed as unknown[])
			.map((t) => t as { title?: unknown; note?: unknown })
			.filter((t) => typeof t.title === 'string' && t.title.trim() && !existingSet.has(t.title.trim()))
			.map((t) => ({
				title: (t.title as string).trim().slice(0, 60),
				note: typeof t.note === 'string' ? t.note.trim().slice(0, 200) : ''
			}));
	} catch {
		throw error(502, 'トピック提案の結果を解釈できませんでした');
	}
	return json({ topics });
}
