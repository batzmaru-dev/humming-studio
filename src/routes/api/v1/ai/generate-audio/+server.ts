import { json, error } from '@sveltejs/kit';
import { put } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import { requireAuth } from '$lib/server/session';
import { verifyProSubscription } from '$lib/server/appstore';
import {
	getAudioGenUsage,
	addAudioGenUsage,
	getOrCreateUser,
	mutateUser,
	LIMITS
} from '$lib/server/store';

export const prerender = false;
export const config = { maxDuration: 120 };

/**
 * BGM/SE 生成(サウンドステッカーのベース音)。
 * - Pro サブスク限定(月 5 回まで)。未加入は生涯 1 回だけ無料お試し可。
 * - SE(効果音/ジングル) → ElevenLabs Sound Effects
 * - BGM → Stability Stable Audio
 * 生成物は Vercel Blob に置き、公開 URL を返す(アプリが取得してサウンドプリセット登録)。
 *
 * body: {
 *   transactionJWS?: string,  // StoreKit2 Transaction.jwsRepresentation(Pro。無料お試しでは不要)
 *   kind: 'se' | 'bgm',
 *   prompt: string,           // 生成プロンプト(日本語可)
 *   durationSec?: number      // SE: 1..22(既定 8) / BGM: 1..60(既定 30)
 * }
 */
export async function POST({ request }) {
	const sub = await requireAuth(request);

	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'invalid body');

	const kind = body.kind === 'bgm' ? 'bgm' : body.kind === 'se' ? 'se' : null;
	if (!kind) throw error(400, 'kind must be "se" or "bgm"');

	const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
	if (!prompt) throw error(400, 'prompt is required');
	if (prompt.length > 500) throw error(400, 'prompt too long (max 500 chars)');

	// 1 回あたりの原価を固定するため尺に上限
	const maxDur = kind === 'se' ? 22 : 60;
	const fallbackDur = kind === 'se' ? 8 : 30;
	let durationSec = Number(body.durationSec) || fallbackDur;
	durationSec = Math.max(1, Math.min(maxDur, durationSec));

	// プロバイダの鍵(未設定なら準備中)
	const elevenKey = env.ELEVENLABS_API_KEY;
	const stabilityKey = env.STABILITY_API_KEY;
	if (kind === 'se' && !elevenKey) throw error(503, 'SE 生成は準備中です');
	if (kind === 'bgm' && !stabilityKey) throw error(503, 'BGM 生成は準備中です');

	// Pro 検証。未加入は生涯 1 回の無料お試しを許可。
	// AI_FREE_SUBS(カンマ区切り)は審査前の動作確認バイパス。
	const freeSubs = (env.AI_FREE_SUBS ?? '').split(',').filter(Boolean);
	let usingFreeTrial = false;
	if (!freeSubs.includes(sub)) {
		const reason = await verifyProSubscription(body.transactionJWS ?? '');
		if (reason) {
			const user = await getOrCreateUser(sub);
			if (user.freeAudioGenUsed) {
				throw error(403, `Pro サブスクリプションが必要です(${reason})`);
			}
			usingFreeTrial = true;
		}
	}

	// 月間上限(無料お試しは月次カウントとは別枠の 1 回)
	if (!usingFreeTrial) {
		const used = await getAudioGenUsage(sub);
		if (used >= LIMITS.audioGenerationsPerMonth) {
			throw error(429, `今月の生成上限(${LIMITS.audioGenerationsPerMonth}回)に達しました`);
		}
	}

	// 生成
	let audio: ArrayBuffer;
	if (kind === 'se') {
		audio = await generateSoundEffect(elevenKey!, prompt, durationSec);
	} else {
		audio = await generateBGM(stabilityKey!, prompt, durationSec);
	}

	// Blob に保存して公開 URL を返す
	const stamp = Date.now();
	const pathname = `gen-audio/${kind}-${stamp}.mp3`;
	const blob = await put(pathname, Buffer.from(audio), {
		access: 'public',
		contentType: 'audio/mpeg',
		addRandomSuffix: true
	});

	// 成功後にメータリング
	let remainingThisMonth = LIMITS.audioGenerationsPerMonth;
	if (usingFreeTrial) {
		await mutateUser(sub, (u) => ({ ...u, freeAudioGenUsed: true }));
		remainingThisMonth = 0;
	} else {
		const count = await addAudioGenUsage(sub);
		remainingThisMonth = Math.max(0, LIMITS.audioGenerationsPerMonth - count);
	}

	return json({
		audioURL: blob.url,
		kind,
		durationSec,
		usage: {
			usedFreeTrial: usingFreeTrial,
			remainingThisMonth,
			limitPerMonth: LIMITS.audioGenerationsPerMonth
		}
	});
}

/** ElevenLabs Sound Effects: text → mp3(効果音・ジングル) */
async function generateSoundEffect(
	apiKey: string,
	prompt: string,
	durationSec: number
): Promise<ArrayBuffer> {
	const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
		method: 'POST',
		headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			text: prompt,
			duration_seconds: Math.min(durationSec, 22), // ElevenLabs SFX は最大 22 秒
			output_format: 'mp3_44100_128'
		})
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		console.error('elevenlabs sfx failed', res.status, detail.slice(0, 500));
		throw error(502, 'SE の生成に失敗しました。時間をおいて再度お試しください');
	}
	return res.arrayBuffer();
}

/**
 * Stability Stable Audio: text → mp3(BGM)。
 * NOTE: エンドポイント/パラメータは STABILITY_API_KEY 発行時に最新ドキュメントで要確認
 * (v2beta/audio/stable-audio-2/text-to-audio, multipart, Authorization: Bearer, Accept: audio/*)。
 */
async function generateBGM(
	apiKey: string,
	prompt: string,
	durationSec: number
): Promise<ArrayBuffer> {
	const form = new FormData();
	form.append('prompt', prompt);
	form.append('duration', String(durationSec));
	form.append('output_format', 'mp3');
	const res = await fetch('https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio', {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiKey}`, Accept: 'audio/*' },
		body: form
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		console.error('stability stable-audio failed', res.status, detail.slice(0, 500));
		throw error(502, 'BGM の生成に失敗しました。時間をおいて再度お試しください');
	}
	return res.arrayBuffer();
}
