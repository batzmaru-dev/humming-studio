import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getOrCreateUser, mutateUser, type VoiceProfile } from '$lib/server/store';

export const prerender = false;

/**
 * 「声を守る」ボイスプロファイルの取得(端末間共有)。
 */
export async function GET({ request }) {
	const sub = await requireAuth(request);
	const user = await getOrCreateUser(sub);
	return json({ voices: user.voiceProfiles ?? [] });
}

/**
 * ボイスプロファイル一覧をまるごと保存(置き換え)。
 * body: { voices: [{ id, name, weights: number[], createdAt }] }
 */
export async function PUT({ request }) {
	const sub = await requireAuth(request);
	await getOrCreateUser(sub);

	const body = await request.json().catch(() => null);
	if (!body || !Array.isArray(body.voices)) throw error(400, 'voices array required');

	const voices: VoiceProfile[] = body.voices
		.slice(0, 20)
		.map((v: Record<string, unknown>) => ({
			id: String(v.id ?? ''),
			name: String(v.name ?? '').slice(0, 40),
			weights: Array.isArray(v.weights)
				? (v.weights as unknown[]).slice(0, 2048).map((n) => Number(n) || 0)
				: [],
			createdAt: String(v.createdAt ?? '')
		}))
		.filter((v: VoiceProfile) => v.id && v.name && v.weights.length > 0);

	const updated = await mutateUser(sub, (u) => ({ ...u, voiceProfiles: voices }));
	return json({ voices: updated?.voiceProfiles ?? voices });
}
