// 解放コード(Mac 直接配布版の課金手段)の発行・一覧・失効・端末リセット。
// 管理 API(/api/v1/admin/unlock-codes)を叩くだけの薄いラッパー。
//
// 使い方(ADMIN_TOKEN は .admin-token.local か環境変数から読む):
//   node scripts/unlock-code.mjs issue unlock "◯◯様 2026-11 問い合わせ対応"
//   node scripts/unlock-code.mjs issue pro "◯◯様 Stripe 決済 pi_xxx"        # 既定で引き換えから365日
//   node scripts/unlock-code.mjs issue pro "◯◯様 お詫び対応" --days 30      # 期間を指定(none で無期限)
//   node scripts/unlock-code.mjs list
//   node scripts/unlock-code.mjs revoke 12        # 失効(戻せない)
//   node scripts/unlock-code.mjs reset 12         # 端末の紐づけを外す(機種変更・故障時。元の端末では使えなくなる)
//
// 接続先は既定で本番。別の環境は UNLOCK_API_BASE で指定する。
// 発行したコードはこの出力でしか見られない(DB にはハッシュしか残らない)。
import { readFileSync, existsSync } from 'node:fs';

const base = process.env.UNLOCK_API_BASE ?? 'https://humming-studio.com/api/v1';
const token =
	process.env.ADMIN_TOKEN ??
	(existsSync('.admin-token.local') ? readFileSync('.admin-token.local', 'utf8').trim() : '');
if (!token) {
	console.error('ADMIN_TOKEN が見つかりません(.admin-token.local か環境変数で渡してください)');
	process.exit(1);
}

async function call(method, body) {
	const res = await fetch(`${base}/admin/unlock-codes`, {
		method,
		headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined
	});
	const text = await res.text();
	if (!res.ok) {
		console.error(`失敗 (${res.status}): ${text}`);
		process.exit(1);
	}
	return JSON.parse(text);
}

const args = process.argv.slice(2);
// --days N: 有効期間を日数で指定(省略時は pro=365日・unlock=無期限)。--days none で無期限
const daysIndex = args.indexOf('--days');
let validDays;
if (daysIndex >= 0) {
	const raw = args[daysIndex + 1];
	validDays = raw === 'none' ? null : Number(raw);
	if (validDays !== null && (!Number.isInteger(validDays) || validDays < 1)) {
		console.error('--days には 1 以上の整数か none を指定してください');
		process.exit(1);
	}
	args.splice(daysIndex, 2);
}
const [action, a, b] = args;

if (action === 'issue') {
	if ((a !== 'unlock' && a !== 'pro') || !b) {
		console.error('使い方: issue <unlock|pro> "<誰に・なぜ発行したか>"');
		process.exit(1);
	}
	const issued = await call('POST', { action: 'issue', plan: a, note: b, validDays });
	const term = issued.validDays ? `引き換えから ${issued.validDays} 日間` : '無期限';
	console.log(`発行しました  id=${issued.id}  plan=${issued.plan}  有効期間=${term}`);
	console.log(`コード: ${issued.code}`);
	console.log('このコードは二度と表示されません。利用者に渡す前に控えてください。');
} else if (action === 'list') {
	const { codes } = await call('GET');
	for (const c of codes) {
		const expired = c.expiresAt && new Date(c.expiresAt) <= new Date();
		const state = c.revokedAt ? '失効' : expired ? '期限切れ' : c.redeemedAt ? '使用中' : '未使用';
		const until = c.expiresAt ? `〜${c.expiresAt.slice(0, 10)}` : c.validDays ? `${c.validDays}日` : '無期限';
		console.log(
			[String(c.id).padStart(4), c.plan.padEnd(6), `…${c.hint}`, state.padEnd(4), until.padEnd(11), c.createdAt.slice(0, 10), c.note].join('  ')
		);
	}
	if (codes.length === 0) console.log('発行済みのコードはありません');
} else if (action === 'revoke' || action === 'reset') {
	const id = Number(a);
	if (!Number.isInteger(id) || id <= 0) {
		console.error(`使い方: ${action} <id>(id は list で確認)`);
		process.exit(1);
	}
	await call('POST', { action, id });
	console.log(action === 'revoke' ? `id=${id} を失効させました` : `id=${id} の端末の紐づけを外しました`);
} else {
	console.error('使い方: issue <unlock|pro> "<メモ>" | list | revoke <id> | reset <id>');
	process.exit(1);
}
