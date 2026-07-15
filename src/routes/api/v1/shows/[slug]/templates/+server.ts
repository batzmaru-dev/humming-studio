import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/session';
import { getShow, mutateShow, canPublish, LIMITS, type ShowTemplate } from '$lib/server/store';

export const prerender = false;

/**
 * 番組テンプレート(編集スタイル)の一覧を取得。番組メンバーのみ。
 * チームで見た目を統一するための共有ライブラリ。
 */
export async function GET({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (!canPublish(show, sub)) throw error(403, 'not a member of this show');
	return json({ templates: show.showTemplates ?? [] });
}

/**
 * 番組テンプレート一覧をまるごと保存(置き換え)。番組メンバーのみ。
 * body: { templates: ShowTemplate[] }
 * 中身(videoExport/videoDesign/画像 base64)はサーバでは解釈せずそのまま保持する。
 */
export async function PUT({ request, params }) {
	const sub = await requireAuth(request);
	const show = await getShow(params.slug);
	if (!show) throw error(404, 'show not found');
	if (!canPublish(show, sub)) throw error(403, 'not a member of this show');

	const body = await request.json().catch(() => null);
	if (!body || !Array.isArray(body.templates)) throw error(400, 'templates array required');

	const now = new Date().toISOString();
	const templates: ShowTemplate[] = body.templates
		.slice(0, LIMITS.templatesPerShow)
		.map((t: Record<string, unknown>): ShowTemplate => ({
			id: String(t.id ?? crypto.randomUUID()),
			name: String(t.name ?? '名称未設定').slice(0, 80),
			createdAt: typeof t.createdAt === 'string' ? t.createdAt : now,
			updatedBy: sub,
			videoExport: t.videoExport ?? null,
			videoDesign: t.videoDesign ?? null,
			backgroundImage: typeof t.backgroundImage === 'string' ? t.backgroundImage : null,
			frameImage: typeof t.frameImage === 'string' ? t.frameImage : null
		}))
		.filter((t: ShowTemplate) => t.id && t.name);

	// DB 保護: テンプレート全体のサイズ上限
	const size = Buffer.byteLength(JSON.stringify(templates), 'utf8');
	if (size > LIMITS.templatesTotalBytes)
		throw error(413, `templates too large (max ${LIMITS.templatesTotalBytes} bytes)`);

	const updated = await mutateShow(params.slug, (s) => ({ ...s, showTemplates: templates }));
	return json({ templates: updated?.showTemplates ?? templates });
}
