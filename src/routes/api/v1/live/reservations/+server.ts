import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import {
	getBroadcaster,
	createReservation,
	listReservationsBySub,
	setReservationStatus,
	attachStreamer,
	LIMITS,
	SlotTakenError,
	WeeklyLimitError,
	type LiveReservation
} from '$lib/server/store';
import { isValidSlotStart, reservationLabelJst } from '$lib/server/slots';
import { azuracast, azuracastConfigured, generateStreamerPassword } from '$lib/server/azuracast';
import { checkPro, notifySlack } from '$lib/server/pro';

export const prerender = false;

// 所有者に返す予約 DTO(接続資格情報を含む)
function dto(r: LiveReservation) {
	return {
		id: r.id,
		slotStart: r.slotStart,
		labelJst: reservationLabelJst(r),
		durationMin: r.durationMin,
		status: r.status,
		title: r.title,
		note: r.note,
		streamer:
			r.azUsername && r.azPassword
				? { username: r.azUsername, password: r.azPassword }
				: null
	};
}

// 自分の予約一覧 + 放送者ステータス
export async function GET({ request }) {
	const sub = await requireAuth(request);
	const [broadcaster, reservations] = await Promise.all([
		getBroadcaster(sub),
		listReservationsBySub(sub)
	]);
	return json({ broadcaster, reservations: reservations.map(dto) });
}

// 30 分枠を予約(Pro + 放送者承認済 + 空き枠 + 週 1 回)
export async function POST({ request }) {
	const sub = await requireAuth(request);
	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');

	// 1) Pro 検証
	const proReason = await checkPro(sub, body.transactionJWS);
	if (proReason) throw error(403, `Pro サブスクリプションが必要です(${proReason})`);

	// 2) 放送者オンボーディング(初回審査)。未承認は 409 + code でアプリが分岐できるようにする。
	const broadcaster = await getBroadcaster(sub);
	if (broadcaster.status !== 'approved') {
		const pending = broadcaster.status === 'pending';
		return json(
			{
				code: pending ? 'onboarding_pending' : 'onboarding_required',
				message: pending
					? '放送者審査中です。承認までお待ちください。'
					: '先に放送者オンボーディング(ガイドライン同意)が必要です。'
			},
			{ status: 409 }
		);
	}

	// 3) 枠の妥当性
	const slotStartUTC = new Date(body.slotStartUTC);
	if (isNaN(slotStartUTC.getTime()) || !isValidSlotStart(slotStartUTC)) {
		throw error(400, '選択できない枠です(開放時間外・過去・先すぎ)');
	}

	const title = typeof body.title === 'string' ? body.title.trim().slice(0, 80) || null : null;
	const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) || null : null;

	// 4) 予約作成(週 1 回・二重予約は store 側で原子的に弾く)
	const id = crypto.randomUUID();
	let reservation: LiveReservation;
	try {
		reservation = await createReservation({
			id,
			sub,
			slotStartUTC,
			durationMin: LIMITS.liveSlotMinutes,
			title,
			note
		});
	} catch (e) {
		if (e instanceof SlotTakenError) throw error(409, e.message);
		if (e instanceof WeeklyLimitError) throw error(409, e.message);
		throw e;
	}

	// 5) AzuraCast ストリーマー発行(枠外接続を拒否する時間強制つき)
	if (azuracastConfigured()) {
		try {
			const username = `hs_${id.replace(/-/g, '').slice(0, 16)}`;
			const password = generateStreamerPassword();
			const streamer = await azuracast.createSlotStreamer({
				username,
				password,
				displayName: broadcaster.displayName || 'Humming Studio 放送',
				comments: `Humming Studio 予約 ${id} / ${title ?? ''}`,
				slotStartUTC,
				durationMin: LIMITS.liveSlotMinutes
			});
			await attachStreamer(id, { azStreamerId: streamer.id, azUsername: username, azPassword: password });
			reservation.azStreamerId = streamer.id;
			reservation.azUsername = username;
			reservation.azPassword = password;
		} catch (e) {
			// 発行失敗時は予約をキャンセルして枠を解放(オーファンを残さない)
			await setReservationStatus(id, 'cancelled').catch(() => {});
			const msg = e instanceof Error ? e.message : String(e);
			throw error(502, `放送枠の発行に失敗しました。時間をおいて再試行してください(${msg})`);
		}
	}

	await notifySlack(
		`✅ 生放送 予約確定: ${reservationLabelJst(reservation)} 「${title ?? broadcaster.displayName ?? ''}」(${broadcaster.displayName ?? sub.slice(0, 8)})`
	);
	return json({ reservation: dto(reservation) }, { status: 201 });
}
