#!/usr/bin/env node
// Mac版DMG(HummingStudio.dmg)をVercel Blobへアップロードする。
//
// 2GB規模・GitHub単一ファイル100MB上限を超えるため、gitではなくVercel Blobで配信する
// (static/HummingStudio.dmg は .gitignore 対象)。パスを固定(addRandomSuffix:false)
// しているため、再アップロードしても公開URLは変わらない
// (https://iprukt1z2pyeb6bl.public.blob.vercel-storage.com/HummingStudio.dmg)。
// appcast.xml / src/routes/+page.svelte の MAC 定数もこのURLを直接参照している。
//
// 使い方:
//   BLOB_READ_WRITE_TOKEN=... node scripts/upload-mac-dmg.mjs path/to/HummingStudio.dmg
// (.env.local に BLOB_READ_WRITE_TOKEN があるなら `set -a; source .env.local; set +a` してから実行)

import { put } from '@vercel/blob';
import fs from 'node:fs';

const path = process.argv[2];
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!path || !token) {
	console.error('usage: BLOB_READ_WRITE_TOKEN=... node scripts/upload-mac-dmg.mjs <path-to-dmg>');
	process.exit(1);
}

const stream = fs.createReadStream(path);
const stat = fs.statSync(path);

const blob = await put('HummingStudio.dmg', stream, {
	access: 'public',
	token,
	addRandomSuffix: false,
	allowOverwrite: true,
	contentType: 'application/x-apple-diskimage',
	multipart: true
});

console.log('uploaded:', stat.size, 'bytes');
console.log('url:', blob.url);
