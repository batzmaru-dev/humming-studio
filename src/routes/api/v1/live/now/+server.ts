import { json } from '@sveltejs/kit';
import { getActiveLiveReservationNow, getBroadcaster, getShow } from '$lib/server/store';

export const prerender = false;

// 公開ブリッジ: 現在の生放送枠(時間内のアクティブ予約)の表示情報を返す。
// radio-keizai(radio-system)がライブ検知時にこれを引き、番組サムネ・説明・オンエア名で
// now playing 表示を上書きする(直前の AutoDJ 曲メタが残る問題の解消)。
// 認証不要・非機密のみ(接続資格情報は返さない)。
export async function GET() {
	const r = await getActiveLiveReservationNow();
	if (!r) return json({ live: false });

	const [broadcaster, show] = await Promise.all([
		getBroadcaster(r.sub),
		r.showSlug ? getShow(r.showSlug) : Promise.resolve(null)
	]);

	return json({
		live: true,
		onairName: broadcaster.displayName ?? null,
		title: r.title ?? null,
		showSlug: r.showSlug ?? null,
		showTitle: show?.title ?? null,
		description: show?.description ?? null,
		thumbnailURL: show?.artworkURL ?? null,
		slotStart: r.slotStart,
		durationMin: r.durationMin
	});
}
