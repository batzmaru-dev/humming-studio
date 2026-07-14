// スキーマ適用(冪等)。新テーブル追加時に本番/開発 DB へ流す。
// 実行: node --env-file=.env.local scripts/apply-schema.mjs
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// src/lib/server/store.ts の SCHEMA_SQL と一致させること
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
CREATE TABLE IF NOT EXISTS audio_gen_usage (
	sub   text NOT NULL,
	month text NOT NULL,
	count integer NOT NULL DEFAULT 0,
	PRIMARY KEY (sub, month)
);
`;

await pool.query(SCHEMA_SQL);
console.log('schema applied (audio_gen_usage ほか)');
await pool.end();
