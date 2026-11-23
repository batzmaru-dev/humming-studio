import { Pool } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import { ensureUnlockSchema, type Queryable } from './unlockCodes';

// 解放コード用の DB 接続。store.ts の pool は外へ出していないので、ここで別に持つ。
// テーブルは初回アクセス時に作る(CREATE TABLE IF NOT EXISTS なので何度流しても同じ)。

let _pool: Pool | null = null;
let _ready: Promise<void> | null = null;

export async function unlockDb(): Promise<Queryable> {
	if (!_pool) {
		const url = env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL is not set');
		_pool = new Pool({ connectionString: url });
	}
	const db: Queryable = {
		query: async (text, params = []) => {
			const result = await _pool!.query(text, params);
			return { rows: result.rows as Record<string, unknown>[] };
		}
	};
	if (!_ready) {
		_ready = ensureUnlockSchema(db).catch((e) => {
			_ready = null; // 次のリクエストでやり直せるようにする
			throw e;
		});
	}
	await _ready;
	return db;
}
