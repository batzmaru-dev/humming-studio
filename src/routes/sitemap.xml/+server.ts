// /sitemap.xml — ビルド時に静的生成(prerender)。公開ページを列挙する。
// ページを増やしたら PATHS に足すだけ。
export const prerender = true;

const SITE = 'https://humming-studio.com';
const PATHS = ['/', '/features', '/terms', '/privacy', '/takedown'];

export function GET() {
	const urls = PATHS.map((p) => `\t<url><loc>${SITE}${p}</loc></url>`).join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}
