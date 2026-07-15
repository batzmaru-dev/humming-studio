import { json, error } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/pro';
import { listPendingBroadcasters, listUpcomingReservations } from '$lib/server/store';
import { reservationLabelJst } from '$lib/server/slots';

export const prerender = false;

// 運営ダッシュボード(生放送): 審査待ち放送者 + これからの予約。
// Authorization: Bearer <ADMIN_TOKEN>
export async function GET({ request }) {
	if (!isAdmin(request)) throw error(401, 'admin token required');
	const [pending, upcoming] = await Promise.all([
		listPendingBroadcasters(),
		listUpcomingReservations()
	]);
	return json({
		pendingBroadcasters: pending,
		upcomingReservations: upcoming.map((r) => ({
			id: r.id,
			sub: r.sub,
			labelJst: reservationLabelJst(r),
			slotStart: r.slotStart,
			status: r.status,
			title: r.title,
			azStreamerId: r.azStreamerId
		}))
	});
}
