import { json, error } from '@sveltejs/kit';
import { isAdmin, notifySlack } from '$lib/server/pro';
import { getReservation, setReservationStatus } from '$lib/server/store';
import { azuracast, azuracastConfigured } from '$lib/server/azuracast';
import { reservationLabelJst } from '$lib/server/slots';

export const prerender = false;

// 運営キルスイッチ: 進行中/予定の予約を停止。
// - ストリーマーを無効化 + 接続中なら強制切断(AutoDJ=P1 ローテに切戻る)。
// Authorization: Bearer <ADMIN_TOKEN>
// body: { action: 'kill' | 'cancel' }
export async function POST({ request, params }) {
	if (!isAdmin(request)) throw error(401, 'admin token required');
	const body = await request.json().catch(() => ({}));
	const action = body?.action === 'cancel' ? 'cancel' : 'kill';

	const r = await getReservation(params.id);
	if (!r) throw error(404, 'not found');

	if (azuracastConfigured() && r.azStreamerId != null) {
		try {
			await azuracast.deactivateStreamer(r.azStreamerId);
			if (r.status === 'live') await azuracast.disconnectStreamers();
		} catch {
			// AzuraCast 側の失敗でも予約ステータスは進める
		}
	}
	await setReservationStatus(params.id, 'cancelled');
	await notifySlack(`⛔ 生放送 ${action === 'kill' ? '緊急停止' : 'キャンセル'}: ${reservationLabelJst(r)}`);
	return json({ ok: true, status: 'cancelled' });
}
