import { env } from '$env/dynamic/private';

// Humming Studio → AzuraCast（ラジオ経済 / stream.yotsuya-fm.com）。
// Pro ユーザーの生放送予約が承認されたとき、その 30 分枠だけ接続できる
// 「時間強制つきストリーマー」を発行する。枠外接続は AzuraCast 側が拒否するので
// これ自体がキルスイッチ兼時間制限になる。録音は局側で有効化済み。
//
// radio-system/src/lib/azuracast.ts の実装を app-facing に最小移植したもの。
// エンドポイント規約: 一覧/作成は複数形 /streamers、個別は単数形 /streamer/{id}。

function cfg() {
	const base = env.AZURACAST_BASE_URL;
	const key = env.AZURACAST_API_KEY;
	const stationId = env.AZURACAST_STATION_ID ?? '1';
	if (!base || !key) return null;
	return { base, key, stationId };
}

/** AzuraCast 連携が構成済みか（env 未設定なら予約承認時のストリーマー発行をスキップ） */
export function azuracastConfigured(): boolean {
	return cfg() !== null;
}

async function az<T>(path: string, init?: RequestInit): Promise<T> {
	const c = cfg();
	if (!c) throw new Error('AzuraCast is not configured (AZURACAST_BASE_URL / AZURACAST_API_KEY)');
	const res = await fetch(`${c.base}/api${path}`, {
		...init,
		signal: AbortSignal.timeout(15000),
		headers: {
			'X-API-Key': c.key,
			...((init?.headers as Record<string, string>) ?? {})
		}
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`AzuraCast ${res.status}: ${text}`);
	}
	return res.json() as Promise<T>;
}

function stationId(): string {
	return cfg()?.stationId ?? '1';
}

export interface AzScheduleItem {
	start_time: number; // HHMM（局ローカル=JST）例: 2100
	end_time: number; // HHMM
	start_date?: string | null; // YYYY-MM-DD
	end_date?: string | null;
	days?: number[]; // 1=月 .. 7=日
	loop_once?: boolean;
}

export interface AzStreamer {
	id: number;
	streamer_username: string;
	display_name: string;
	is_active: boolean;
	enforce_schedule: boolean;
	schedule_items: AzScheduleItem[];
}

/** UTC の 30 分枠 → AzuraCast schedule_items（JST の当日ピンポイント窓）に変換 */
export function slotToScheduleItem(slotStartUTC: Date, durationMin: number): AzScheduleItem {
	const jst = new Date(slotStartUTC.getTime() + 9 * 60 * 60 * 1000);
	const y = jst.getUTCFullYear();
	const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
	const d = String(jst.getUTCDate()).padStart(2, '0');
	const dateStr = `${y}-${m}-${d}`;
	const hh = jst.getUTCHours();
	const mm = jst.getUTCMinutes();
	const startNum = hh * 100 + mm;
	const endTotalMin = hh * 60 + mm + durationMin;
	const endHh = Math.floor(endTotalMin / 60) % 24;
	const endMm = endTotalMin % 60;
	const endNum = endHh * 100 + endMm;
	const azDay = jst.getUTCDay() === 0 ? 7 : jst.getUTCDay(); // JS 0=日 → AzuraCast 7=日
	return {
		start_time: startNum,
		end_time: endNum,
		start_date: dateStr,
		end_date: dateStr,
		days: [azDay],
		loop_once: true
	};
}

/** ランダムなソースパスワード（Icecast SOURCE 認証用。英数字のみ） */
export function generateStreamerPassword(): string {
	const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	const bytes = crypto.getRandomValues(new Uint8Array(20));
	return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

export const azuracast = {
	stationId,

	listStreamers: () => az<AzStreamer[]>(`/station/${stationId()}/streamers`),

	/** 予約枠専用のストリーマーを発行。enforce_schedule=true で枠外接続を拒否する。
	 *
	 * AzuraCast には playlist と同様、streamer POST でも
	 *   Typed property StationStreamer::$station_id must not be accessed before initialization
	 * を投げる既知バグがある(行は作成されるが応答シリアライズで 500)。
	 * その 500 を見たら一覧から username 一致で拾う(実機で検証済 2026-07)。 */
	createSlotStreamer: async (params: {
		username: string;
		password: string;
		displayName: string;
		comments?: string;
		slotStartUTC: Date;
		durationMin: number;
	}): Promise<AzStreamer> => {
		const body = {
			streamer_username: params.username,
			streamer_password: params.password,
			display_name: params.displayName,
			comments: params.comments ?? '',
			is_active: true,
			enforce_schedule: true,
			schedule_items: [slotToScheduleItem(params.slotStartUTC, params.durationMin)]
		};
		try {
			return await az<AzStreamer>(`/station/${stationId()}/streamers`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			const isNormalizerCrash =
				msg.includes('station_id must not be accessed') || msg.includes('DoctrineEntityNormalizer');
			if (!isNormalizerCrash) throw e;
			const all = await azuracast.listStreamers();
			const found = all.find((s) => s.streamer_username === params.username);
			if (!found) {
				throw new Error(
					`createSlotStreamer: normalizer 500 後に一覧からも "${params.username}" が見つからない (元: ${msg})`
				);
			}
			return found;
		}
	},

	/** ストリーマーを無効化（キルスイッチ）。接続中なら切断もあわせて行う。 */
	deactivateStreamer: async (id: number): Promise<void> => {
		await az(`/station/${stationId()}/streamer/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ is_active: false })
		});
	},

	deleteStreamer: async (id: number): Promise<void> => {
		await az(`/station/${stationId()}/streamer/${id}`, { method: 'DELETE' });
	},

	/** 接続中の全ライブストリーマーを強制切断（AutoDJ に切戻す）。 */
	disconnectStreamers: async (): Promise<void> => {
		try {
			await az(`/station/${stationId()}/streamers/disconnect`, { method: 'POST' });
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg.includes(' 404')) {
				await az(`/station/${stationId()}/streamers/disconnect-streamer`, { method: 'POST' });
				return;
			}
			throw e;
		}
	}
};
