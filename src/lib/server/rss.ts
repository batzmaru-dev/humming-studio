import type { Show, Episode } from './store';

// RSS 2.0 + iTunes 名前空間 + Podlove Simple Chapters。
// フィード URL は恒久(feed.humming-studio.com 移行時も itunes:new-feed-url で追随)。

const SITE = 'https://humming-studio.com';

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

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:psc="http://podlove.org/simple-chapters"
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
${owner}${artwork}    <atom:link href="${SITE}/feed/${show.slug}.xml" rel="self" type="application/rss+xml"/>
    <generator>Humming Studio</generator>
${items}
  </channel>
</rss>
`;
}
