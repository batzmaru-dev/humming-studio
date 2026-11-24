import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, mutateShow, canPublish } from '$lib/server/store';
import {
	publicFeedUrl,
	tsunaguHosting,
	tsunaguListenUrl,
	tsunaguRssUrl
} from '$lib/server/tsunagu-hosting';

export const prerender = false;

/** 番組詳細(オーナー+メンバー)。メンバー一覧はオーナーにのみ返す */
export async function GET({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (!canPublish(show, sub)) throw error(403, 'not a member of this show');
	const isOwner = show.ownerSub === sub;
	return json({
		show: {
			...show,
			members: isOwner ? (show.members ?? []) : undefined,
			role: isOwner ? 'owner' : 'member',
			feedURL: publicFeedUrl(show),
			// つなぐホスティングに紐付いている番組のみ、視聴ページ/RSSリンクを返す
			...(show.tsunaguPodcastHandle
				? {
						tsunaguListenURL: tsunaguListenUrl(show.tsunaguPodcastHandle),
						tsunaguRssURL: tsunaguRssUrl(show.tsunaguPodcastHandle)
					}
				: {})
		}
	});
}

/** 番組メタデータの更新(slug は変更不可、オーナーのみ) */
export async function PATCH({ request, params }) {
	const sub = await requireAuth(request);
	const existing = await getShow(params.slug);
	if (!existing) throw error(404, 'show not found');
	if (existing.ownerSub !== sub) throw error(403, 'only the owner can edit the show');
	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');

	const show = await mutateShow(params.slug, (s) => {
		for (const key of [
			'title',
			'description',
			'author',
			'category',
			'language',
			'artworkURL',
			'ownerEmail'
		] as const) {
			if (typeof body[key] === 'string') s[key] = body[key];
		}
		if (typeof body.explicit === 'boolean') s.explicit = body.explicit;
		if (typeof body.radioKeizaiOptIn === 'boolean') s.radioKeizaiOptIn = body.radioKeizaiOptIn;
		// つなぐホスティングとの紐付け(tsunaguPodcastId / Handle)はここでは受け付けない。
		// 番組は公開時に自動作成し、既存番組の紐付けは運営が admin API で行う
		// (オーナーが任意の ID を入れられると、他人の番組にエピソードを送れてしまう)。
		return s;
	});

	// Castopod 側の番組情報も合わせる(ベストエフォート。失敗しても編集自体は成功)
	if (show?.tsunaguPodcastId && tsunaguHosting.configured()) {
		const changed = (['title', 'description', 'author'] as const).some(
			(key) => typeof body[key] === 'string' && body[key] !== existing[key]
		);
		if (changed) {
			try {
				await tsunaguHosting.updatePodcast({
					podcastId: show.tsunaguPodcastId,
					title: show.title,
					description: show.description,
					author: show.author
				});
			} catch (e) {
				console.error(
					`[tsunagu-hosting] podcast update failed for show=${params.slug}:`,
					e instanceof Error ? e.message : e
				);
			}
		}
	}
	return json({ show });
}
