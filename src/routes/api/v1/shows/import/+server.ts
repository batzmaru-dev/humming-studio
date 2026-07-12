import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { mutateUser, getShow, saveShow, SLUG_PATTERN } from '$lib/server/store';
import { fetchExternalFeed, buildImportedShow } from '$lib/server/rssImport';

export const prerender = false;

/**
 * 既存ポッドキャストの RSS を読み込んで番組を移行する。
 * 過去エピソードは元の音源 URL を参照(ストレージ消費なし)。
 * 以降のエピソードは Humming Studio から公開でき、リスナーは
 * 各プラットフォームのフィード URL を新しいものに切り替えるだけでよい。
 */
export async function POST({ request }) {
	const sub = await requireAuth(request);
	const body = await request.json().catch(() => null);
	if (typeof body?.rssURL !== 'string') throw error(400, 'rssURL is required');

	const slug = typeof body.slug === 'string' ? body.slug.toLowerCase() : '';
	if (!SLUG_PATTERN.test(slug) || ['join', 'import'].includes(slug)) {
		throw error(400, 'slug must be 3-40 chars of [a-z0-9-], no leading/trailing hyphen');
	}
	if (await getShow(slug)) throw error(409, 'slug is already taken');

	let feed;
	try {
		feed = await fetchExternalFeed(body.rssURL);
	} catch (e) {
		throw error(422, e instanceof Error ? e.message : 'フィードを読み込めませんでした');
	}
	if (feed.episodes.length === 0) throw error(422, 'フィードにエピソードが見つかりません');

	const show = buildImportedShow(slug, sub, feed, body.radioKeizaiOptIn !== false);
	await saveShow(show);

	await mutateUser(sub, (user) => {
		if (user.shows.includes(slug)) return null;
		user.shows.push(slug);
		return user;
	});

	return json(
		{
			show: {
				slug: show.slug,
				title: show.title,
				episodeCount: show.episodes.length,
				radioKeizaiOptIn: show.radioKeizaiOptIn,
				feedURL: `https://humming-studio.com/feed/${slug}.xml`
			}
		},
		{ status: 201 }
	);
}
