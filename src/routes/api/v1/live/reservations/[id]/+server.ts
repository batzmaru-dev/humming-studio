import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getReservation, setReservationStatus } from '$lib/server/store';
import { reservationLabelJst } from '$lib/server/slots';
import { azuracast, azuracastConfigured } from '$lib/server/azuracast';
import { env } from '$env/dynamic/private';

export const prerender = false;

// 単一予約の取得。所有者にのみ接続資格情報(Icecast SOURCE)を返す。
// P3(アプリの生放送)が枠時刻に go-live する直前に呼ぶ。
export async function GET({ request, params }) {
	const sub = await requireAuth(request);
	const r = await getReservation(params.id);
	if (!r || r.sub !== sub) throw error(404, 'not found');

	// Icecast SOURCE 接続情報。ホストは AzuraCast のベース URL から導出。
	// ポート/マウントは局設定に依存するため env で上書き可能(既定は AzuraCast の標準)。
	let host: string | null = null;
	try {
		host = env.AZURACAST_BASE_URL ? new URL(env.AZURACAST_BASE_URL).hostname : null;
	} catch {
		host = null;
	}
	const connection =
		r.azUsername && r.azPassword
			? {
					host,
					port: Number(env.AZURACAST_DJ_PORT ?? '8005'),
					mount: env.AZURACAST_DJ_MOUNT ?? '/',
					username: r.azUsername,
					password: r.azPassword,
					// TLS 有無(既定は AzuraCast のベース URL が https かどうか)
					tls: (env.AZURACAST_BASE_URL ?? '').startsWith('https')
				}
			: null;

	return json({
		id: r.id,
		slotStart: r.slotStart,
		labelJst: reservationLabelJst(r),
		durationMin: r.durationMin,
		status: r.status,
		title: r.title,
		connection
	});
}

// 自分の予約をキャンセル(枠解放 + ストリーマー削除)
export async function DELETE({ request, params }) {
	const sub = await requireAuth(request);
	const r = await getReservation(params.id);
	if (!r || r.sub !== sub) throw error(404, 'not found');
	if (r.status === 'completed' || r.status === 'cancelled') {
		return json({ ok: true, status: r.status });
	}

	if (azuracastConfigured() && r.azStreamerId != null) {
		try {
			await azuracast.deleteStreamer(r.azStreamerId);
		} catch {
			// ストリーマー削除失敗は握りつぶす(予約自体は解放する)
		}
	}
	await setReservationStatus(params.id, 'cancelled');
	return json({ ok: true, status: 'cancelled' });
}
