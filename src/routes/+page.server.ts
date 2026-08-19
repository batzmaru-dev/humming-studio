import { getNews } from '$lib/server/cms';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const news = await getNews(3);
	return { news };
};
