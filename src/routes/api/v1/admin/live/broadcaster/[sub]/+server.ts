import { json, error } from '@sveltejs/kit';
import { isAdmin, notifySlack } from '$lib/server/pro';
import { reviewBroadcaster, getBroadcaster } from '$lib/server/store';

export const prerender = false;

// 放送者の審査(承認 / 却下)。初回のみ。承認後はその放送者の週次予約が自動確定になる。
// Authorization: Bearer <ADMIN_TOKEN>
// body: { approve: boolean, note?: string }
export async function POST({ request, params }) {
	if (!isAdmin(request)) throw error(401, 'admin token required');
	const body = await request.json().catch(() => null);
	if (!body || typeof body.approve !== 'boolean') throw error(400, 'approve (boolean) required');

	const before = await getBroadcaster(params.sub);
	if (before.status === 'none') throw error(404, 'no application for this user');

	const broadcaster = await reviewBroadcaster(params.sub, body.approve, body.note);
	await notifySlack(
		`${body.approve ? '🟢 承認' : '🔴 却下'}: 放送者「${before.displayName ?? params.sub.slice(0, 8)}」`
	);
	return json({ broadcaster });
}
