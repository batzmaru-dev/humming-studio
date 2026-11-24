import { getShow, mutateShow, type Episode, type Show } from '$lib/server/store';
import { tsunaguHosting } from '$lib/server/tsunagu-hosting';

// Humming Studio の番組・エピソードを つなぐホスティング(Castopod)へ送る手順をまとめる。
// 公開時の自動同期(episodes POST)と、運営による既存番組の移行(admin API)の両方がここを使う。

/** Castopod に送る対象か(公開中のものだけ。takedown は送らない) */
function syncable(e: Episode): boolean {
	return e.status === 'published';
}

function pending(show: Show): Episode[] {
	return show.episodes.filter((e) => syncable(e) && !e.tsunaguEpisodeId);
}

/**
 * 番組が Castopod にまだ無ければ作り、ID と handle を控える。
 * 公開中のエピソードが1つも無い番組(=新しい番組)は、その場でフィードの正本を
 * Castopod に切り替える。既存エピソードがある番組は syncPendingEpisodes が送り終えてから切り替える。
 */
export async function ensureTsunaguPodcast(slug: string): Promise<Show | null> {
	const show = await getShow(slug);
	if (!show) return null;
	if (show.tsunaguPodcastId) return show;

	const podcast = await tsunaguHosting.createPodcast({
		slug: show.slug,
		title: show.title,
		description: show.description,
		author: show.author,
		ownerEmail: show.ownerEmail,
		artworkURL: show.artworkURL
	});

	return mutateShow(slug, (s) => {
		// 同時公開で二重に作られた場合は先に入った方を残す(後発の番組は Castopod に空で残るのでログに出す)
		if (s.tsunaguPodcastId && s.tsunaguPodcastId !== podcast.id) {
			console.error(
				`[tsunagu-hosting] duplicate podcast created for show=${slug}: kept=${s.tsunaguPodcastId} orphan=${podcast.id}`
			);
			return s;
		}
		s.tsunaguPodcastId = podcast.id;
		s.tsunaguPodcastHandle = podcast.handle;
		if (s.episodes.filter(syncable).length === 0) s.tsunaguFeedMigratedAt = new Date().toISOString();
		return s;
	});
}

/** エピソード1件を Castopod に作成・公開し、Castopod 側の ID を控える */
export async function syncEpisode(slug: string, podcastId: number, episode: Episode): Promise<void> {
	const synced = await tsunaguHosting.createAndPublishEpisode({
		podcastId,
		episodeId: episode.id,
		title: episode.title,
		description: episode.notes,
		audioURL: episode.audioURL,
		transcriptURL: episode.transcriptURL,
		pubDate: episode.pubDate
	});
	await mutateShow(slug, (s) => {
		const ep = s.episodes.find((e) => e.id === episode.id);
		if (ep) ep.tsunaguEpisodeId = synced.id;
		// 公開中の回がすべて Castopod に入ったら、フィードの正本を切り替える
		// (新しい番組は最初の1話を送った時点でここを通る)
		if (!s.tsunaguFeedMigratedAt && pending(s).length === 0) {
			s.tsunaguFeedMigratedAt = new Date().toISOString();
		}
		return s;
	});
}

/**
 * まだ送っていない公開中エピソードを古い順に送る。全部送り終えたらフィードの正本を
 * Castopod に切り替える。1回の呼び出しは budgetMs で打ち切る(関数の実行時間制限のため)。
 * 残りがあれば、もう一度呼べば続きから進む。
 */
export async function syncPendingEpisodes(
	slug: string,
	budgetMs = 200_000
): Promise<{ synced: number; remaining: number; migrated: boolean; errors: string[] }> {
	const started = Date.now();
	const errors: string[] = [];
	let synced = 0;

	const show = await ensureTsunaguPodcast(slug);
	if (!show?.tsunaguPodcastId) throw new Error('show not found');

	const queue = pending(show).sort((a, b) => a.pubDate.localeCompare(b.pubDate));
	for (const episode of queue) {
		if (Date.now() - started > budgetMs) break;
		try {
			await syncEpisode(slug, show.tsunaguPodcastId, episode);
			synced++;
		} catch (e) {
			errors.push(`${episode.id}: ${e instanceof Error ? e.message : String(e)}`);
			// 順番を保つため、失敗したらそこで止める(次回の呼び出しで同じ回からやり直す)
			break;
		}
	}

	const after = await mutateShow(slug, (s) => {
		if (!s.tsunaguFeedMigratedAt && pending(s).length === 0) {
			s.tsunaguFeedMigratedAt = new Date().toISOString();
		}
		return s;
	});
	return {
		synced,
		remaining: after ? pending(after).length : 0,
		migrated: Boolean(after?.tsunaguFeedMigratedAt),
		errors
	};
}
