import { error } from '@sveltejs/kit';
import { getNewsBySlug } from '$lib/server/cms';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params }) => {
	const item = await getNewsBySlug(params.slug);
	if (!item) error(404, '記事が見つかりませんでした');
	return { item };
};
