import { LIMITS, listActiveReservations, type LiveReservation } from './store';

// 予約可能な 30 分枠の生成と空き判定。
// 局(ラジオ経済)は JST 固定。開放時間帯 LIMITS.liveSlotOpenHoursJst の各時に :00 / :30 の枠を開ける。

export interface Slot {
	/** 枠開始(UTC ISO8601) */
	startUTC: string;
	/** 表示用の JST ラベル "M/D(曜) HH:MM" */
	labelJst: string;
	durationMin: number;
	available: boolean;
}

const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'];

/** JST の壁時計(年月日時分)から UTC の Date を作る(JST は UTC+9 固定) */
function jstWallToUTC(y: number, m: number, d: number, hh: number, mm: number): Date {
	return new Date(Date.UTC(y, m - 1, d, hh, mm) - 9 * 60 * 60 * 1000);
}

/** ある UTC 時刻を JST の壁時計に分解 */
function toJstParts(utc: Date) {
	const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
	return {
		y: jst.getUTCFullYear(),
		m: jst.getUTCMonth() + 1,
		d: jst.getUTCDate(),
		hh: jst.getUTCHours(),
		mm: jst.getUTCMinutes(),
		dow: jst.getUTCDay()
	};
}

/** 今日(JST)から horizon 日先までの全枠(空き状況つき)を返す */
export async function listBookableSlots(now: Date = new Date()): Promise<Slot[]> {
	const dur = LIMITS.liveSlotMinutes;
	const horizon = LIMITS.liveBookingHorizonDays;
	const leadMs = LIMITS.liveBookingLeadMinutes * 60 * 1000;
	const earliest = now.getTime() + leadMs;

	const todayJst = toJstParts(now);
	const rangeEnd = new Date(now.getTime() + (horizon + 1) * 24 * 60 * 60 * 1000);
	const reservations = await listActiveReservations(now, rangeEnd);
	const takenSet = new Set(reservations.map((r) => new Date(r.slotStart).getTime()));

	const slots: Slot[] = [];
	for (let dayOffset = 0; dayOffset <= horizon; dayOffset++) {
		// JST の当日 0:00 を基準に dayOffset 日進める
		const base = jstWallToUTC(todayJst.y, todayJst.m, todayJst.d, 0, 0);
		const dayUTC = new Date(base.getTime() + dayOffset * 24 * 60 * 60 * 1000);
		const dp = toJstParts(dayUTC);
		for (const hour of LIMITS.liveSlotOpenHoursJst) {
			for (const minute of [0, 30]) {
				const startUTC = jstWallToUTC(dp.y, dp.m, dp.d, hour, minute);
				if (startUTC.getTime() < earliest) continue; // 過去 or リード時間内
				const t = startUTC.getTime();
				slots.push({
					startUTC: startUTC.toISOString(),
					labelJst: `${dp.m}/${dp.d}(${WEEKDAY_JA[toJstParts(startUTC).dow]}) ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
					durationMin: dur,
					available: !takenSet.has(t)
				});
			}
		}
	}
	return slots;
}

/** 指定の開始 UTC が正当な開放枠か(任意時刻の予約を防ぐ) */
export function isValidSlotStart(startUTC: Date, now: Date = new Date()): boolean {
	const leadMs = LIMITS.liveBookingLeadMinutes * 60 * 1000;
	if (startUTC.getTime() < now.getTime() + leadMs) return false;
	const horizonMs = (LIMITS.liveBookingHorizonDays + 1) * 24 * 60 * 60 * 1000;
	if (startUTC.getTime() > now.getTime() + horizonMs) return false;
	const p = toJstParts(startUTC);
	if (!LIMITS.liveSlotOpenHoursJst.includes(p.hh)) return false;
	if (p.mm !== 0 && p.mm !== 30) return false;
	return true;
}

/** 予約 → 表示用 JST ラベル */
export function reservationLabelJst(r: LiveReservation): string {
	const p = toJstParts(new Date(r.slotStart));
	return `${p.m}/${p.d}(${WEEKDAY_JA[p.dow]}) ${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`;
}
