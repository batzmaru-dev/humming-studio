import { XMLParser } from 'fast-xml-parser';
import type { Episode, Show } from './store';

// 既存ポッドキャストの RSS を読み込んで Humming Studio の番組として移行する。
// 過去エピソードの音源は元ホスティングの URL をそのまま参照する(コピーしない)ため、
// ストレージを消費せず、公開済みエピソードの URL も変わらない。
// 続きのエピソードだけ Humming Studio から公開できるようになる。

interface ImportedFeed {
	title: string;
	description: string;
	author: string;
	language: string;
	explicit: boolean;
	artworkURL?: string;
	episodes: Episode[];
}

function asArray<T>(value: T | T[] | undefined): T[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	if (value && typeof value === 'object' && '#text' in (value as Record<string, unknown>)) {
		return text((value as Record<string, unknown>)['#text']);
	}
	return '';
}

/** itunes:duration は "HH:MM:SS" / "MM:SS" / 秒数 のいずれか */
function parseDuration(value: unknown): number {
	const s = text(value).trim();
	if (!s) return 0;
	if (/^\d+$/.test(s)) return Number(s);
	const parts = s.split(':').map(Number);
	if (parts.some(Number.isNaN)) return 0;
	return parts.reduce((acc, part) => acc * 60 + part, 0);
}

export function parseExternalFeed(xml: string): ImportedFeed {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
		removeNSPrefix: false
	});
	const doc = parser.parse(xml);
	const channel = doc?.rss?.channel;
	if (!channel) throw new Error('RSS 2.0 のフィードではありません');

	const episodes: Episode[] = asArray(channel.item)
		.map((item: Record<string, unknown>): Episode | null => {
			const enclosure = (Array.isArray(item.enclosure) ? item.enclosure[0] : item.enclosure) as
				| Record<string, string>
				| undefined;
			const audioURL = enclosure?.['@_url'];
			if (!audioURL) return null;
			const guid = text(item.guid) || audioURL;
			const pubDate = new Date(text(item.pubDate) || Date.now());
			return {
				id: guid,
				title: text(item.title) || '(無題)',
				notes: text(item['content:encoded']) || text(item.description) || '',
				audioURL,
				bytes: Number(enclosure?.['@_length']) || 1,
				durationSec: parseDuration(item['itunes:duration']),
				mimeType: enclosure?.['@_type'] || 'audio/mpeg',
				pubDate: Number.isNaN(pubDate.getTime()) ? new Date().toISOString() : pubDate.toISOString(),
				chapters: [],
				status: 'published',
				external: true
			};
		})
		.filter((e: Episode | null): e is Episode => e !== null);

	const image =
		channel['itunes:image']?.['@_href'] ?? (channel.image ? text(channel.image.url) : undefined);

	return {
		title: text(channel.title) || 'Imported Show',
		description: text(channel.description),
		author: text(channel['itunes:author']) || text(channel.title),
		language: text(channel.language) || 'ja',
		explicit: /^(true|yes)$/i.test(text(channel['itunes:explicit'])),
		artworkURL: typeof image === 'string' && image.startsWith('http') ? image : undefined,
		episodes
	};
}

export async function fetchExternalFeed(rssURL: string): Promise<ImportedFeed> {
	const url = new URL(rssURL);
	if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('invalid URL');
	const res = await fetch(rssURL, {
		headers: { 'user-agent': 'HummingStudio/1.0 (+https://humming-studio.com)' },
		signal: AbortSignal.timeout(15_000)
	});
	if (!res.ok) throw new Error(`フィードを取得できません(HTTP ${res.status})`);
	const xml = await res.text();
	if (xml.length > 10 * 1024 * 1024) throw new Error('フィードが大きすぎます');
	return parseExternalFeed(xml);
}

export function buildImportedShow(
	slug: string,
	ownerSub: string,
	feed: ImportedFeed,
	radioKeizaiOptIn: boolean
): Show {
	return {
		slug,
		ownerSub,
		title: feed.title,
		description: feed.description,
		author: feed.author,
		category: 'Society & Culture',
		language: feed.language,
		explicit: feed.explicit,
		artworkURL: feed.artworkURL,
		radioKeizaiOptIn,
		createdAt: new Date().toISOString(),
		episodes: feed.episodes
	};
}
