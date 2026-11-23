import { json, error } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/pro';
import { issueCode, listCodes, resetCodeDevice, revokeCode } from '$lib/server/unlockCodes';
import { unlockDb } from '$lib/server/unlockDb';

export const prerender = false;

/**
 * 解放コードの管理(運営用。Authorization: Bearer <ADMIN_TOKEN>)。
 *
 *   GET  /api/v1/admin/unlock-codes
 *        → 発行済みの一覧(コード本体は返さない。末尾4文字と状態だけ)
 *   POST /api/v1/admin/unlock-codes
 *        { action: "issue",  plan: "unlock" | "pro", note: "誰に・なぜ" }
 *          → { id, code, plan, note }  ※ code はこの応答でしか見られない
 *        { action: "revoke", id }  → 失効(戻せない。必要なら再発行)
 *        { action: "reset",  id }  → 端末の紐づけを外す(機種変更・故障時)
 */
export async function GET({ request }: { request: Request }) {
	if (!isAdmin(request)) throw error(401, 'unauthorized');
	return json({ codes: await listCodes(await unlockDb()) });
}

export async function POST({ request }: { request: Request }) {
	if (!isAdmin(request)) throw error(401, 'unauthorized');
	const body = (await request.json().catch(() => null)) as {
		action?: unknown;
		plan?: unknown;
		note?: unknown;
		id?: unknown;
	} | null;
	if (!body) throw error(400, 'invalid body');
	const db = await unlockDb();

	if (body.action === 'issue') {
		if (body.plan !== 'unlock' && body.plan !== 'pro') throw error(400, 'plan must be unlock or pro');
		const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) : '';
		// 誰に渡したコードか分からなくなると失効も問い合わせ対応もできないので必須にする
		if (!note) throw error(400, 'note is required (誰に・なぜ発行したか)');
		return json(await issueCode(db, body.plan, note));
	}

	if (body.action === 'revoke' || body.action === 'reset') {
		const id = Number(body.id);
		if (!Number.isInteger(id) || id <= 0) throw error(400, 'id is required');
		const ok = body.action === 'revoke' ? await revokeCode(db, id) : await resetCodeDevice(db, id);
		if (!ok) throw error(404, 'code not found or already revoked');
		return json({ ok: true });
	}

	throw error(400, 'unknown action');
}
