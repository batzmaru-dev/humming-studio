import { json, error } from '@sveltejs/kit';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAuth } from '$lib/server/session';
import { LIMITS } from '$lib/server/store';

export const prerender = false;

/**
 * 音声ファイルのクライアントアップロード(Vercel Blob client upload protocol)。
 * ネイティブアプリ側の手順:
 *   1. POST ここへ {"type":"blob.generate-client-token","payload":{"pathname":"audio/<uuid>.m4a","callbackUrl":"https://humming-studio.com/api/v1/upload","clientPayload":null,"multipart":false}}
 *      (Authorization: Bearer <セッショントークン> 必須)
 *   2. 返ってきた clientToken で PUT https://blob.vercel-storage.com/<pathname>
 *      (@vercel/blob/client の put() と同じプロトコル)
 *   3. 完了後の URL を POST /api/v1/shows/{slug}/episodes に渡す
 */
export async function POST({ request }) {
	// トークン発行要求はセッション必須(Blob 完了コールバックは Vercel 署名で検証される)
	const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
	if (!body) throw error(400, 'invalid body');

	if (body.type === 'blob.generate-client-token') {
		await requireAuth(request);
	}

	try {
		const result = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async (pathname) => {
				if (!pathname.startsWith('audio/')) throw new Error('pathname must start with audio/');
				return {
					allowedContentTypes: ['audio/mp4', 'audio/x-m4a', 'audio/mpeg', 'audio/wav', 'audio/aac'],
					maximumSizeInBytes: LIMITS.bytesPerEpisode,
					addRandomSuffix: true
				};
			},
			onUploadCompleted: async () => {
				// エピソード登録は別 API(/episodes)で行うためここでは何もしない
			}
		});
		return json(result);
	} catch (e) {
		throw error(400, e instanceof Error ? e.message : 'upload failed');
	}
}
