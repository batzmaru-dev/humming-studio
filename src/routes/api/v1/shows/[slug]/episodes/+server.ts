import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, saveShow, getOrCreateUser, saveUser, LIMITS, type Episode } from '$lib/server/store';

export const prerender = false;

/**
 * エピソードを公開する。音声は先に POST /api/v1/upload(クライアントアップロード)で
 * Blob に上げ、その URL をここに渡す。
 */
export async function POST({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (show.ownerSub !== sub) throw error(403, 'not your show');

	const body = await request.json().catch(() => null);
	if (!body?.title || typeof body.title !== 'string') throw error(400, 'title is required');
	if (typeof body.audioURL !== 'string' || !body.audioURL.startsWith('https://'))
		throw error(400, 'audioURL is required');
	const bytes = Number(body.bytes) || 0;
	if (bytes <= 0 || bytes > LIMITS.bytesPerEpisode)
		throw error(400, `bytes must be 1..${LIMITS.bytesPerEpisode}`);

	const user = await getOrCreateUser(sub);
	if (user.storageUsed + bytes > LIMITS.storagePerUser)
		throw error(413, 'storage limit exceeded (10GB)');

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

	show.episodes.push(episode);
	await saveShow(show);

	user.storageUsed += bytes;
	await saveUser(user);

	return json({ episode }, { status: 201 });
}
