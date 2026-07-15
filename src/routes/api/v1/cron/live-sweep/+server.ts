import { json, error } from '@sveltejs/kit';
import { put } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import {
	getEndedActiveReservations,
	setReservationStatus,
	getShow,
	mutateShow,
	mutateUser,
	type Episode,
	type LiveReservation
} from '$lib/server/store';
import { azuracast, azuracastConfigured } from '$lib/server/azuracast';
import { reservationLabelJst } from '$lib/server/slots';

export const prerender = false;
export const config = { maxDuration: 120 };

// 生放送の後始末(Vercel cron。数分おき):
// 1) 枠終了を過ぎたのにアクティブな予約のストリーマーを強制切断・無効化(アプリが閉じていても止める)
// 2) 紐づく番組があれば、その枠の録音を取り込んで番組のエピソード(履歴)にする
// 3) 取り込み済み or 猶予超過なら completed にしてストリーマーを削除
// Vercel は CRON_SECRET 設定時 Authorization: Bearer <CRON_SECRET> を付与する。
function authorized(request: Request, secret: string | undefined): boolean {
	if (!secret) return true; // 未設定なら制限なし(開発用)
	const header = request.headers.get('authorization') ?? '';
	return header.replace(/^Bearer\s+/i, '') === secret;
}

function slotEndMs(r: LiveReservation): number {
	return new Date(r.slotStart).getTime() + r.durationMin * 60 * 1000;
}

/** 録音を取り込んで番組のエピソードにする。成功で true。 */
async function ingestRecording(r: LiveReservation): Promise<boolean> {
	if (!r.showSlug || r.azStreamerId == null) return false;
	const show = await getShow(r.showSlug);
	if (!show) return false;

	const streamer = await azuracast.getStreamer(r.azStreamerId).catch(() => null);
	const slotStart = new Date(r.slotStart).getTime();
	const slotEnd = slotEndMs(r);
	const bc = (streamer?.broadcasts ?? [])
		.filter((b) => b.recordingPath)
		.find((b) => {
			const t = new Date(b.timestampStart).getTime();
			return t >= slotStart - 15 * 60 * 1000 && t <= slotEnd + 15 * 60 * 1000;
		});
	if (!bc) return false; // 録音がまだ用意できていない

	const buffer = await azuracast.downloadBroadcastRecording(bc.id);
	const bytes = buffer.byteLength;
	if (bytes < 1024) return false; // 実体のない録音はスキップ

	const blob = await put(`live/${r.id}.mp3`, Buffer.from(buffer), {
		access: 'public',
		contentType: 'audio/mpeg'
	});

	const durationSec = bc.timestampEnd
		? Math.max(0, (new Date(bc.timestampEnd).getTime() - new Date(bc.timestampStart).getTime()) / 1000)
		: 0;

	const episode: Episode = {
		id: crypto.randomUUID(),
		title: r.title || `生放送 ${reservationLabelJst(r)}`,
		notes: 'ラジオ経済で放送した生放送のアーカイブ',
		audioURL: blob.url,
		bytes,
		durationSec,
		mimeType: 'audio/mpeg',
		pubDate: new Date().toISOString(),
		chapters: [],
		status: 'published'
	};

	const updated = await mutateShow(r.showSlug, (s) => {
		s.episodes.push(episode);
		return s;
	});
	if (!updated) return false;
	// ストレージ計上(番組オーナー。アーカイブは上限で弾かない)
	await mutateUser(show.ownerSub, (u) => {
		u.storageUsed += bytes;
		return u;
	}).catch(() => {});
	return true;
}

export async function GET({ request }) {
	if (!authorized(request, env.CRON_SECRET)) throw error(401, 'unauthorized');
	if (!azuracastConfigured()) return json({ swept: 0, note: 'azuracast not configured' });

	const ended = await getEndedActiveReservations();
	const results: Record<string, unknown>[] = [];

	for (const r of ended) {
		// 1) 強制終了(枠を過ぎたら止める)
		if (r.azStreamerId != null) {
			await azuracast.deactivateStreamer(r.azStreamerId).catch(() => {});
			await azuracast.disconnectStreamers().catch(() => {});
		}

		// 2) 録音 → エピソード
		let ingested = false;
		try {
			ingested = await ingestRecording(r);
		} catch {
			ingested = false;
		}

		// 3) 完了判定(取り込み済み / 番組なし / 録音待ちの猶予 30 分超過)
		const graceExceeded = Date.now() - slotEndMs(r) > 30 * 60 * 1000;
		const complete = ingested || !r.showSlug || graceExceeded;
		if (complete) {
			await setReservationStatus(r.id, 'completed');
			if (r.azStreamerId != null) await azuracast.deleteStreamer(r.azStreamerId).catch(() => {});
		}
		results.push({ id: r.id, ingested, completed: complete });
	}

	return json({ swept: ended.length, results });
}
