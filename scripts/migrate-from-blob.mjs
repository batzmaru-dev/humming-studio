// Vercel Blob(JSON ドキュメント)→ Neon Postgres への一回限りの移行スクリプト。
// 実行: node --env-file=.env.local scripts/migrate-from-blob.mjs
import { list } from '@vercel/blob';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
	sub  text PRIMARY KEY,
	doc  jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS shows (
	slug text PRIMARY KEY,
	doc  jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS invites (
	code       text PRIMARY KEY,
	slug       text NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_usage (
	sub     text NOT NULL,
	month   text NOT NULL,
	seconds double precision NOT NULL DEFAULT 0,
	PRIMARY KEY (sub, month)
);
`;

async function readAll(prefix) {
	const docs = [];
	let cursor;
	do {
		const page = await list({ prefix, cursor });
		for (const blob of page.blobs) {
			const res = await fetch(`${blob.url}?ts=${Date.now()}`, { cache: 'no-store' });
			if (!res.ok) continue;
			docs.push({ pathname: blob.pathname, doc: await res.json() });
		}
		cursor = page.cursor;
	} while (cursor);
	return docs;
}

console.log('creating schema...');
await pool.query(SCHEMA_SQL);

console.log('migrating users...');
const users = await readAll('data/users/');
for (const { doc } of users) {
	await pool.query(
		'INSERT INTO users (sub, doc) VALUES ($1, $2) ON CONFLICT (sub) DO UPDATE SET doc = $2',
		[doc.sub, JSON.stringify(doc)]
	);
	console.log('  user:', doc.sub.slice(0, 12) + '…', `shows=${(doc.shows ?? []).length}`);
}

console.log('migrating shows...');
const shows = await readAll('data/shows/');
for (const { doc } of shows) {
	await pool.query(
		'INSERT INTO shows (slug, doc) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET doc = $2',
		[doc.slug, JSON.stringify(doc)]
	);
	console.log('  show:', doc.slug, `episodes=${(doc.episodes ?? []).length}`);
}

console.log('migrating invites...');
const invites = await readAll('data/invites/');
for (const { pathname, doc } of invites) {
	const code = pathname.replace('data/invites/', '').replace('.json', '');
	await pool.query(
		'INSERT INTO invites (code, slug, created_at) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING',
		[code, doc.slug, doc.createdAt ?? new Date().toISOString()]
	);
	console.log('  invite:', code, '->', doc.slug);
}

const counts = await pool.query(
	`SELECT (SELECT count(*) FROM users) AS users,
	        (SELECT count(*) FROM shows) AS shows,
	        (SELECT count(*) FROM invites) AS invites`
);
console.log('done:', counts.rows[0]);
await pool.end();
