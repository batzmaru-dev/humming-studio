import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, mutateShow, mutateUser, canPublish, LIMITS, type Episode } from '$lib/server/store';

export const prerender = false;

class StorageLimitError extends Error {}

/**
 * エピソードを公開する。音声は先に POST /api/v1/upload(クライアントアップロード)で
 * Blob に上げ、その URL をここに渡す。
 */
export async function POST({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (!canPublish(show, sub)) throw error(403, 'not a member of this show');

	const body = await request.json().catch(() => null);
	if (!body?.title || typeof body.title !== 'string') throw error(400, 'title is required');
	if (typeof body.audioURL !== 'string' || !body.audioURL.startsWith('https://'))
		throw error(400, 'audioURL is required');
	const bytes = Number(body.bytes) || 0;
	if (bytes <= 0 || bytes > LIMITS.bytesPerEpisode)
		throw error(400, `bytes must be 1..${LIMITS.bytesPerEpisode}`);

	// ストレージはメンバーが公開しても番組オーナーに計上する(上限管理を一元化)。
	// 上限チェックと計上は行ロック内で原子的に行う(同時公開でも超過しない)
	try {
		await mutateUser(show.ownerSub, (user) => {
			if (user.storageUsed + bytes > LIMITS.storagePerUser) throw new StorageLimitError();
			user.storageUsed += bytes;
			return user;
		});
	} catch (e) {
		if (e instanceof StorageLimitError) throw error(413, 'storage limit exceeded (10GB)');
		throw e;
	}

	const episode: Episode = {
		id: crypto.randomUUID(),
		title: body.title,
		notes: typeof body.notes === 'string' ? body.notes : '',
		audioURL: body.audioURL,
		bytes,
		durationSec: Number(body.durationSec) || 0,
		mimeType: typeof body.mimeType === 'string' ? body.mimeType : 'audio/mp4',
		pubDate: new Date().toISOString(),
		chapters: Array.isArray(body.chapters)
			? body.chapters
					.filter((c: unknown): c is { start: number; title: string } => {
						const o = c as Record<string, unknown>;
						return typeof o?.start === 'number' && typeof o?.title === 'string';
					})
					.map((c) => ({ start: c.start, title: c.title }))
			: [],
		status: 'published'
	};

	const updated = await mutateShow(params.slug, (s) => {
		s.episodes.push(episode);
		return s;
	});
	if (!updated) {
		// 直前に番組が消えた場合は計上を戻す
		await mutateUser(show.ownerSub, (user) => {
			user.storageUsed = Math.max(0, user.storageUsed - bytes);
			return user;
		});
		throw error(404, 'show not found');
	}

	return json({ episode }, { status: 201 });
}
