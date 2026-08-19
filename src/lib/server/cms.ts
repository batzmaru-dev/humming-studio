import { env } from '$env/dynamic/private';

// ツナギビトHP(https://tsunagu-hito.com)と共用のNotion CMS(データベース: 🔥 ツナギビトHP ブログ投稿)から、
// Products プロパティに「Humming Studio」タグが付いた記事だけを抽出して「最新情報」として表示する。
// 実装はツナギビトHP側の lib/cms.ts の移植(Notion REST APIを直接叩くだけで、SDK依存なし)。

const NOTION_API_KEY = env.NOTION_API_KEY;
const NOTION_BLOG_DATABASE_ID = env.NOTION_BLOG_DATABASE_ID;
const PRODUCT_TAG = 'Humming Studio';

interface RichText {
	plain_text: string;
	href: string | null;
	annotations: {
		bold: boolean;
		italic: boolean;
		strikethrough: boolean;
		underline: boolean;
		code: boolean;
	};
}

interface NotionPage {
	id: string;
	created_time: string;
	properties: {
		Title: { title: RichText[] };
		Status: { select: { name: string } | null };
		Category: { select: { name: string } | null };
		PublishedAt: { date: { start: string } | null };
		Eyecatch: { url: string | null };
		Slug?: { rich_text: RichText[] };
	};
}

interface Block {
	id: string;
	type: string;
	paragraph?: { rich_text: RichText[] };
	heading_1?: { rich_text: RichText[] };
	heading_2?: { rich_text: RichText[] };
	heading_3?: { rich_text: RichText[] };
	bulleted_list_item?: { rich_text: RichText[] };
	numbered_list_item?: { rich_text: RichText[] };
	quote?: { rich_text: RichText[] };
	code?: { rich_text: RichText[]; language: string };
	image?: {
		type: 'external' | 'file';
		external?: { url: string };
		file?: { url: string };
		caption: RichText[];
	};
	divider?: object;
}

export interface NewsItem {
	id: string;
	title: string;
	body: string;
	category: string;
	date: string;
	eyecatch?: string;
	slug: string;
}

function notionFetch(path: string, options: RequestInit = {}) {
	return fetch(`https://api.notion.com/v1/${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${NOTION_API_KEY}`,
			'Notion-Version': '2022-06-28',
			'Content-Type': 'application/json',
			...(options.headers ?? {})
		}
	});
}

function rtHtml(richText: RichText[]): string {
	return richText
		.map((r) => {
			let t = r.plain_text
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/\n/g, '<br>');
			if (r.annotations.code) t = `<code class="rounded bg-surface-800 px-1 text-sm">${t}</code>`;
			if (r.annotations.bold) t = `<strong>${t}</strong>`;
			if (r.annotations.italic) t = `<em>${t}</em>`;
			if (r.annotations.strikethrough) t = `<s>${t}</s>`;
			if (r.annotations.underline) t = `<u>${t}</u>`;
			if (r.href) t = `<a href="${r.href}" class="anchor">${t}</a>`;
			return t;
		})
		.join('');
}

function blocksToHtml(blocks: Block[]): string {
	const out: string[] = [];
	let i = 0;
	while (i < blocks.length) {
		const b = blocks[i];

		if (b.type === 'bulleted_list_item') {
			const items: string[] = [];
			while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
				items.push(`<li>${rtHtml(blocks[i].bulleted_list_item!.rich_text)}</li>`);
				i++;
			}
			out.push(`<ul class="my-4 list-inside list-disc space-y-1">${items.join('')}</ul>`);
			continue;
		}
		if (b.type === 'numbered_list_item') {
			const items: string[] = [];
			while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
				items.push(`<li>${rtHtml(blocks[i].numbered_list_item!.rich_text)}</li>`);
				i++;
			}
			out.push(`<ol class="my-4 list-inside list-decimal space-y-1">${items.join('')}</ol>`);
			continue;
		}

		switch (b.type) {
			case 'paragraph':
				out.push(`<p class="mb-4 leading-relaxed">${rtHtml(b.paragraph!.rich_text)}</p>`);
				break;
			case 'heading_1':
				out.push(`<h2 class="mt-10 mb-4 text-2xl font-bold">${rtHtml(b.heading_1!.rich_text)}</h2>`);
				break;
			case 'heading_2':
				out.push(`<h3 class="mt-8 mb-3 text-xl font-bold">${rtHtml(b.heading_2!.rich_text)}</h3>`);
				break;
			case 'heading_3':
				out.push(`<h4 class="mt-6 mb-2 text-lg font-bold">${rtHtml(b.heading_3!.rich_text)}</h4>`);
				break;
			case 'quote':
				out.push(
					`<blockquote class="border-primary-500 text-surface-300 my-4 border-l-4 pl-4 italic">${rtHtml(b.quote!.rich_text)}</blockquote>`
				);
				break;
			case 'code':
				out.push(
					`<pre class="bg-surface-900 my-4 overflow-x-auto rounded-lg p-4"><code class="text-sm">${rtHtml(b.code!.rich_text)}</code></pre>`
				);
				break;
			case 'image': {
				const url = b.image!.type === 'external' ? b.image!.external!.url : b.image!.file!.url;
				const caption = b.image!.caption.length > 0 ? rtHtml(b.image!.caption) : '';
				out.push(
					`<figure class="my-6"><img src="${url}" alt="${caption}" class="w-full rounded-lg" loading="lazy" />${caption ? `<figcaption class="text-surface-400 mt-2 text-center text-sm">${caption}</figcaption>` : ''}</figure>`
				);
				break;
			}
			case 'divider':
				out.push(`<hr class="border-surface-800 my-8" />`);
				break;
			default:
				break;
		}
		i++;
	}
	return out.join('\n');
}

function normalizeSlug(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9\-._~]/g, '')
		.replace(/-{2,}/g, '-')
		.replace(/^-+|-+$/g, '');
}

function pageToNewsItem(page: NotionPage, body = ''): NewsItem {
	const title = page.properties.Title.title.map((r) => r.plain_text).join('');
	const category = page.properties.Category.select?.name ?? '未分類';
	const date = page.properties.PublishedAt.date?.start ?? page.created_time ?? '';
	const eyecatch = page.properties.Eyecatch.url ?? undefined;
	const rawSlug = (page.properties.Slug?.rich_text ?? []).map((r) => r.plain_text).join('');
	const normalized = normalizeSlug(rawSlug);
	const slug = normalized.length > 0 ? normalized : page.id.replace(/-/g, '');
	return { id: page.id, title, body, category, date, eyecatch, slug };
}

function isPageIdLike(s: string): boolean {
	return (
		/^[a-f0-9]{32}$/i.test(s) ||
		/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s)
	);
}

function toDashedUuid(hex32: string): string {
	return hex32.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

/** Humming Studio タグ付きの公開済み記事を新しい順に返す */
export async function getNews(limit = 20): Promise<NewsItem[]> {
	if (!NOTION_API_KEY || !NOTION_BLOG_DATABASE_ID) return [];
	try {
		const res = await notionFetch(`databases/${NOTION_BLOG_DATABASE_ID}/query`, {
			method: 'POST',
			body: JSON.stringify({
				filter: {
					and: [
						{ property: 'Status', select: { equals: 'Published' } },
						{ property: 'Products', multi_select: { contains: PRODUCT_TAG } }
					]
				},
				sorts: [{ property: 'PublishedAt', direction: 'descending' }],
				page_size: limit
			})
		});
		if (!res.ok) return [];
		const data = (await res.json()) as { results: NotionPage[] };
		return data.results.map((p) => pageToNewsItem(p));
	} catch {
		return [];
	}
}

export async function getNewsBySlug(idOrSlug: string): Promise<NewsItem | null> {
	if (!NOTION_API_KEY) return null;

	let pageId: string | null = null;
	if (isPageIdLike(idOrSlug)) {
		pageId = idOrSlug.includes('-') ? idOrSlug : toDashedUuid(idOrSlug);
	} else if (NOTION_BLOG_DATABASE_ID) {
		try {
			const queryRes = await notionFetch(`databases/${NOTION_BLOG_DATABASE_ID}/query`, {
				method: 'POST',
				body: JSON.stringify({
					filter: {
						and: [
							{ property: 'Status', select: { equals: 'Published' } },
							{ property: 'Products', multi_select: { contains: PRODUCT_TAG } },
							{ property: 'Slug', rich_text: { equals: idOrSlug } }
						]
					},
					page_size: 1
				})
			});
			if (queryRes.ok) {
				const queryData = (await queryRes.json()) as { results: { id: string }[] };
				pageId = queryData.results[0]?.id ?? null;
			}
		} catch {
			return null;
		}
	}
	if (!pageId) return null;

	try {
		const [pageRes, blocksRes] = await Promise.all([
			notionFetch(`pages/${pageId}`),
			notionFetch(`blocks/${pageId}/children?page_size=100`)
		]);
		if (!pageRes.ok) return null;
		const page = (await pageRes.json()) as NotionPage;
		const blocksData = (await blocksRes.json()) as { results: Block[] };
		const body = blocksToHtml(blocksData.results);
		return pageToNewsItem(page, body);
	} catch {
		return null;
	}
}
