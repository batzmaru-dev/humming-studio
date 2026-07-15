import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getBroadcaster, applyBroadcaster } from '$lib/server/store';
import { notifySlack } from '$lib/server/pro';
import { BROADCAST_GUIDELINES } from '$lib/server/broadcast';

export const prerender = false;

export async function GET({ request }) {
	const sub = await requireAuth(request);
	const broadcaster = await getBroadcaster(sub);
	return json({ broadcaster, guidelines: BROADCAST_GUIDELINES });
}

export async function POST({ request }) {
	const sub = await requireAuth(request);
	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');
	if (body.agreeGuidelines !== true) {
		throw error(400, 'ガイドラインへの同意が必要です');
	}
	const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
	if (!displayName || displayName.length > 40) {
		throw error(400, 'オンエア名(1〜40 文字)を入力してください');
	}

	const current = await getBroadcaster(sub);
	if (current.status === 'approved') {
		return json({ broadcaster: current, alreadyApproved: true });
	}

	const broadcaster = await applyBroadcaster(sub, displayName);
	await notifySlack(
		`🎙️ 生放送 放送者申請: 「${displayName}」(sub: ${sub.slice(0, 12)}…)が審査待ちです。管理APIで承認してください。`
	);
	return json({ broadcaster });
}
