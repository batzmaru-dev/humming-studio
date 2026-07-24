import { createHash } from 'node:crypto';
import type { Show, Episode } from './store';

// RSS 2.0 + iTunes 名前空間 + Podlove Simple Chapters + Podcasting 2.0 名前空間。
// フィード URL は恒久(feed.humming-studio.com 移行時も itunes:new-feed-url で追随)。

const SITE = 'https://humming-studio.com';

// Podcasting 2.0 の podcast:guid は「プロトコルを除いたフィード URL」の UUIDv5。
// namespace は Podcast Index 規定の固定値。番組ごとに恒久で安定する(再生成しても不変)。
const PODCAST_NS = 'ead4c236-bf58-58c6-a2c6-a6b28d128cb6';
function uuidv5(name: string): string {
	const ns = Buffer.from(PODCAST_NS.replaceAll('-', ''), 'hex');
	const bytes = createHash('sha1')
		.update(ns)
		.update(Buffer.from(name, 'utf8'))
		.digest()
		.subarray(0, 16);
	bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
	bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC4122
	const h = bytes.toString('hex');
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

function esc(s: string): string {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function cdata(s: string): string {
	return `<![CDATA[${s.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

function rfc822(iso: string): string {
	return new Date(iso).toUTCString();
}

function hms(totalSec: number): string {
	const t = Math.max(0, Math.round(totalSec));
	const h = Math.floor(t / 3600);
	const m = Math.floor((t % 3600) / 60);
	const s = t % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function chapterXML(episode: Episode): string {
	if (!episode.chapters?.length) return '';
	const entries = episode.chapters
		.map((c) => `      <psc:chapter start="${hms(c.start)}" title="${esc(c.title)}"/>`)
		.join('\n');
	return `    <psc:chapters version="1.2">\n${entries}\n    </psc:chapters>\n`;
}

function itemXML(show: Show, episode: Episode): string {
	return `  <item>
    <title>${esc(episode.title)}</title>
    <guid isPermaLink="false">${esc(episode.id)}</guid>
    <pubDate>${rfc822(episode.pubDate)}</pubDate>
    <enclosure url="${esc(episode.audioURL)}" length="${episode.bytes}" type="${esc(episode.mimeType)}"/>
    <itunes:duration>${hms(episode.durationSec)}</itunes:duration>
    <description>${cdata(episode.notes)}</description>
${chapterXML(episode)}  </item>`;
}

export function buildFeed(show: Show): string {
	const items = show.episodes
		.filter((e) => e.status === 'published')
		.sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1))
		.map((e) => itemXML(show, e))
		.join('\n');

	const artwork = show.artworkURL
		? `    <itunes:image href="${esc(show.artworkURL)}"/>\n`
		: '';

	// Spotify / Apple の所有確認・連絡先(登録時に必要)
	const owner = show.ownerEmail
		? `    <itunes:owner>\n      <itunes:name>${esc(show.author)}</itunes:name>\n      <itunes:email>${esc(show.ownerEmail)}</itunes:email>\n    </itunes:owner>\n`
		: '';

	// Podcasting 2.0: 番組の恒久 GUID / メディア種別 / 無断取り込みロック / 出演者。
	const guid = uuidv5(`humming-studio.com/feed/${show.slug}.xml`);
	const locked = show.ownerEmail
		? `    <podcast:locked owner="${esc(show.ownerEmail)}">yes</podcast:locked>\n`
		: `    <podcast:locked>no</podcast:locked>\n`;
	const person = show.author
		? `    <podcast:person role="host" group="cast">${esc(show.author)}</podcast:person>\n`
		: '';

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:psc="http://podlove.org/simple-chapters"
     xmlns:podcast="https://podcastindex.org/namespace/1.0"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(show.title)}</title>
    <link>${SITE}</link>
    <language>${esc(show.language)}</language>
    <description>${cdata(show.description)}</description>
    <itunes:author>${esc(show.author)}</itunes:author>
    <itunes:summary>${cdata(show.description)}</itunes:summary>
    <itunes:explicit>${show.explicit ? 'true' : 'false'}</itunes:explicit>
    <itunes:category text="${esc(show.category)}"/>
    <itunes:type>episodic</itunes:type>
    <podcast:guid>${guid}</podcast:guid>
    <podcast:medium>podcast</podcast:medium>
${locked}${person}${owner}${artwork}    <atom:link href="${SITE}/feed/${show.slug}.xml" rel="self" type="application/rss+xml"/>
    <generator>Humming Studio</generator>
${items}
  </channel>
</rss>
`;
}
