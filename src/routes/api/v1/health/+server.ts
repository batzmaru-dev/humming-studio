import { json } from '@sveltejs/kit';

export const prerender = false;

export function GET() {
	return json({ ok: true, service: 'humming-studio-api', version: 1 });
}
