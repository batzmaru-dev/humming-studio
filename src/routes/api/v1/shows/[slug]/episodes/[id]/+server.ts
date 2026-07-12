import { json, error } from '@sveltejs/kit';
import { del } from '@vercel/blob';
import { requireAuth } from '$lib/server/session';
import { getShow, saveShow, getOrCreateUser, saveUser } from '$lib/server/store';

export const prerender = false;

/** エピソードを削除(フィードから除去し、音声 Blob も消す) */
export async function DELETE({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (show.ownerSub !== sub) throw error(403, 'not your show');

	const index = show.episodes.findIndex((e) => e.id === params.id);
	if (index < 0) throw error(404, 'episode not found');
	const [episode] = show.episodes.splice(index, 1);
	await saveShow(show);

	// RSS インポート由来のエピソードは外部音源参照なので、ストレージ計上も Blob 削除もしない
	if (!episode.external) {
		const user = await getOrCreateUser(sub);
		user.storageUsed = Math.max(0, user.storageUsed - episode.bytes);
		await saveUser(user);

		try {
			await del(episode.audioURL);
		} catch {
			// Blob が既に無い場合は無視
		}
	}

	return json({ ok: true });
}
