import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getBroadcaster, LIMITS } from '$lib/server/store';
import { listBookableSlots } from '$lib/server/slots';

export const prerender = false;

// 予約可能な 30 分枠の一覧(空き状況つき)。放送者ステータスも返す。
// Pro 判定は実予約(POST /reservations)で行う。ここは閲覧のみ。
export async function GET({ request }) {
	const sub = await requireAuth(request);
	const [broadcaster, slots] = await Promise.all([getBroadcaster(sub), listBookableSlots()]);
	return json({
		broadcaster,
		slotMinutes: LIMITS.liveSlotMinutes,
		weeklyLimit: 1,
		slots
	});
}
