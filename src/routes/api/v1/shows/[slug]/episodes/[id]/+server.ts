import { json, error } from '@sveltejs/kit';
import { del } from '@vercel/blob';
import { requireAuth } from '$lib/server/session';
import { getShow, mutateShow, mutateUser, canPublish, type Episode } from '$lib/server/store';
import { tsunaguHosting } from '$lib/server/tsunagu-hosting';

export const prerender = false;

/**
 * エピソードの公開後編集(タイトル・ショーノート)。つなぐホスティングに同期済みの
 * エピソードは、あわせてCastopod側も更新する(ベストエフォート。失敗してもHumming Studio
 * 側の編集自体は成功として扱う)。
 */
export async function PATCH({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (!canPublish(show, sub)) throw error(403, 'not a member of this show');

	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');
	const title = typeof body.title === 'string' ? body.title.trim() : undefined;
	const notes = typeof body.notes === 'string' ? body.notes : undefined;
	if (title !== undefined && title === '') throw error(400, 'title cannot be empty');

	let updated: Episode | undefined;
	const result = await mutateShow(params.slug, (s) => {
		const ep = s.episodes.find((e) => e.id === params.id);
		if (!ep) return null;
		if (title !== undefined) ep.title = title;
		if (notes !== undefined) ep.notes = notes;
		updated = ep;
		return s;
	});
	if (!result || !updated) throw error(404, 'episode not found');
	const episode = updated;

	if (episode.tsunaguEpisodeId) {
		try {
			await tsunaguHosting.updateEpisode({
				tsunaguEpisodeId: episode.tsunaguEpisodeId,
				title,
				description: notes
			});
		} catch (e) {
			console.error(
				`[tsunagu-hosting] episode update failed for show=${params.slug} episode=${episode.id}:`,
				e instanceof Error ? e.message : e
			);
		}
	}

	return json({ episode });
}

/** エピソードを削除(フィードから除去し、音声 Blob も消す) */
export async function DELETE({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (!canPublish(show, sub)) throw error(403, 'not a member of this show');

	// 行ロック内で取り除く(同時削除・同時公開と競合しない)
	let removed: Episode | undefined;
	await mutateShow(params.slug, (s) => {
		const index = s.episodes.findIndex((e) => e.id === params.id);
		if (index < 0) return null;
		[removed] = s.episodes.splice(index, 1);
		return s;
	});
	if (!removed) throw error(404, 'episode not found');
	const episode = removed;

	// RSS インポート由来のエピソードは外部音源参照なので、ストレージ計上も Blob 削除もしない。
	// 計上先は公開時と同じく番組オーナー
	if (!episode.external) {
		await mutateUser(show.ownerSub, (user) => {
			user.storageUsed = Math.max(0, user.storageUsed - episode.bytes);
			return user;
		});

		try {
			await del(episode.audioURL);
		} catch {
			// Blob が既に無い場合は無視
		}
	}

	return json({ ok: true });
}
