import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { requireAuth } from '$lib/server/session';
import { verifyProSubscription } from '$lib/server/appstore';
import {
	addTranscriptionUsage,
	getTranscriptionUsage,
	LIMITS
} from '$lib/server/store';

export const prerender = false;
export const config = { maxDuration: 300 };

/**
 * クラウド文字起こし(Pro サブスク限定、月 360 分まで)。
 * 音声は先に POST /api/v1/upload で Blob に上げ、その URL を渡す
 * (Vercel の 4.5MB ボディ制限を回避。OpenAI 側の 25MB 制限があるため
 *  長尺はアプリ側で 10 分程度のチャンクに分けて呼ぶ)。
 *
 * body: {
 *   transactionJWS: string,  // StoreKit2 Transaction.jwsRepresentation(Pro)
 *   audioURL: string,        // Blob の URL
 *   durationSec: number,     // チャンクの尺(メータリングのフォールバック)
 *   language?: string,       // 既定 "ja"
 *   timestamps?: boolean     // true: whisper-1(単語タイムスタンプ付き) / false: gpt-4o-mini-transcribe
 * }
 */
export async function POST({ request }) {
	const sub = await requireAuth(request);
	if (!env.OPENAI_API_KEY) throw error(503, 'AI 文字起こしは準備中です');

	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');
	if (typeof body.transactionJWS !== 'string') throw error(400, 'transactionJWS is required');
	if (typeof body.audioURL !== 'string') throw error(400, 'audioURL is required');
	const durationSec = Number(body.durationSec) || 0;
	if (durationSec <= 0 || durationSec > 3600) throw error(400, 'durationSec must be 1..3600');

	// SSRF 対策: 自前 Blob ストアの URL のみ許可
	let audioURL: URL;
	try {
		audioURL = new URL(body.audioURL);
	} catch {
		throw error(400, 'invalid audioURL');
	}
	if (!audioURL.hostname.endsWith('.public.blob.vercel-storage.com')) {
		throw error(400, 'audioURL must be a Humming Studio upload');
	}

	// Pro サブスクリプションの検証(Apple 署名の JWS)
	const reason = await verifyProSubscription(body.transactionJWS);
	if (reason) throw error(403, `Pro サブスクリプションが必要です(${reason})`);

	// 月間上限
	const used = await getTranscriptionUsage(sub);
	if (used + durationSec > LIMITS.transcriptionSecondsPerMonth) {
		throw error(429, `今月のクラウド文字起こしの上限(${LIMITS.transcriptionSecondsPerMonth / 60}分)に達しました`);
	}

	// 音声を取得して OpenAI へ転送
	const audioRes = await fetch(body.audioURL);
	if (!audioRes.ok) throw error(422, '音声を取得できませんでした');
	const audioBlob = await audioRes.blob();
	if (audioBlob.size > 25 * 1024 * 1024) {
		throw error(413, '1 チャンクは 25MB までです(長い音声は分割してください)');
	}

	const wantsTimestamps = body.timestamps !== false; // 既定: ブロック編集用にタイムスタンプ付き
	const model = wantsTimestamps ? 'whisper-1' : 'gpt-4o-mini-transcribe';
	const form = new FormData();
	const ext = audioURL.pathname.split('.').pop() || 'm4a';
	form.append('file', audioBlob, `audio.${ext}`);
	form.append('model', model);
	form.append('language', typeof body.language === 'string' ? body.language : 'ja');
	if (wantsTimestamps) {
		form.append('response_format', 'verbose_json');
		form.append('timestamp_granularities[]', 'word');
		form.append('timestamp_granularities[]', 'segment');
	} else {
		form.append('response_format', 'json');
	}

	const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
		body: form
	});
	if (!openaiRes.ok) {
		const detail = await openaiRes.text().catch(() => '');
		console.error('openai transcription failed', openaiRes.status, detail.slice(0, 500));
		throw error(502, '文字起こしに失敗しました。時間をおいて再度お試しください');
	}
	const result = await openaiRes.json();

	// メータリング(whisper の実測 duration があれば優先)
	const measured = Number(result.duration) || durationSec;
	const total = await addTranscriptionUsage(sub, measured);

	return json({
		text: result.text ?? '',
		segments: result.segments ?? null,
		words: result.words ?? null,
		usage: {
			usedSeconds: total,
			limitSeconds: LIMITS.transcriptionSecondsPerMonth,
			remainingSeconds: Math.max(0, LIMITS.transcriptionSecondsPerMonth - total)
		}
	});
}
