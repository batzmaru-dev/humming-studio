import { getNews } from '$lib/server/cms';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
	const items = await getNews();
	return { items };
};
