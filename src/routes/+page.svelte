<script lang="ts">
	// ヒーロー(実機風 Forest Glass モック)→ 3ステップ → 機能 → スタジオ mock →
	// ホスティング → ラジオ経済 → 最終CTA
	const blocks = [
		{ mic: 'leaf', speaker: 'Mic 1', time: '00:12.4', text: 'それでは今週の経済ニュース、いってみましょう。' },
		{ mic: 'blue', speaker: 'Mic 2', time: '00:18.9', text: 'はい、まずは為替から。今週は大きな動きがありましたね。' },
		{ mic: 'leaf', speaker: 'Mic 1', time: '00:26.1', text: 'えーっと、その前に、あの、先週の続きなんですけど…', deleted: true },
		{ mic: 'blue', speaker: 'Mic 2', time: '00:31.7', text: '実は日銀の発表の裏で、こんな動きがあったんです。' }
	];
	const agenda = [
		{ done: true, text: '今週の為替' },
		{ done: true, text: '日銀の発表' },
		{ done: false, text: 'リスナーのお便り' },
		{ done: false, text: '来週の予告' }
	];
	function pill(mic: string) {
		return mic === 'leaf'
			? 'background:rgba(115,199,148,.22);color:#CFEEDB'
			: 'background:rgba(111,173,230,.22);color:#BcdcF5';
	}
</script>

<svelte:head>
	<title>Humming Studio - 文字で編集するポッドキャストスタジオ</title>
	<meta
		name="description"
		content="録音・文字起こし・ブロック編集・配信までを iPad・iPhone・Mac で完結。iPhone をワイヤレスカメラにしたマルチカム収録、AI が作る BGM/SE のサウンドステッカーまで。文字で編集するポッドキャスト制作アプリ。"
	/>
</svelte:head>

<!-- ヒーロー -->
<section class="relative overflow-hidden">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,--theme(--color-primary-500/15),transparent_60%)]"
	></div>
	<div class="relative mx-auto max-w-6xl px-6 pt-20 pb-14 text-center">
		<span class="badge preset-outlined-primary-500 mb-6">TestFlight ベータテスター募集中</span>
		<h1 class="mx-auto max-w-3xl text-4xl leading-tight font-bold sm:text-5xl">
			波形とにらめっこ、終わり。<br />
			<span class="text-primary-400">文字で編集する</span>ポッドキャスト。
		</h1>
		<p class="mx-auto mt-5 max-w-2xl text-lg text-surface-300">
			録って、読んで、いらない行を消すだけ。収録・文字起こし・編集・配信までを
			iPad・iPhone・Mac で完結。iPhone をワイヤレスカメラにしたマルチカム収録にも対応します。
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<a href="#testflight" class="btn preset-filled-primary-500 btn-lg">無料でベータに参加</a>
			<a href="/features" class="btn preset-tonal btn-lg">仕様・機能を見る</a>
		</div>

		<!-- 実機風モック: iPad の Forest Glass ブロックエディタ -->
		<div class="mx-auto mt-16 max-w-4xl">
			<div
				class="rounded-[1.9rem] border border-[#1c4b38] bg-[#050f0a] p-2.5 shadow-2xl shadow-[#298C5C]/25"
			>
				<div
					class="overflow-hidden rounded-[1.35rem] text-left"
					style="background:linear-gradient(160deg,#0B1F17,#0D3D2B 58%,#081710)"
				>
					<!-- トランスポートバー -->
					<div class="flex items-center gap-3 border-b border-white/10 px-4 py-3">
						<span
							class="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm text-[#EAF5EE]"
							>❚❚</span
						>
						<span class="font-mono text-sm text-[#EAF5EE]"
							>00:31.7 <span class="text-[#EAF5EE]/40">/ 12:04</span></span
						>
						<div class="ml-auto hidden items-center gap-1.5 md:flex">
							{#each ['取り込み', '文字起こし', 'マーカー', 'トピック', '書き出し'] as t}
								<span
									class="rounded-md border border-[#9BD8B2]/25 px-2 py-1 text-xs text-[#9BD8B2]"
									>{t}</span
								>
							{/each}
						</div>
						<span class="rounded-md bg-[#298C5C]/30 px-2 py-1 text-xs whitespace-nowrap text-[#CFEEDB]"
							>編集後 09:48</span
						>
					</div>
					<div class="grid md:grid-cols-[1fr_220px]">
						<!-- ブロックリスト -->
						<div class="space-y-2 p-4">
							<div class="flex items-center gap-2 text-xs font-semibold text-[#9B8CE8]">
								<span>◆</span> オープニング
							</div>
							{#each blocks as b}
								<div
									class="flex items-start gap-3 rounded-xl border border-dashed border-white/10 p-3 {b.deleted
										? 'opacity-45'
										: ''}"
									style="background:rgba(8,23,16,.4)"
								>
									<span
										class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
										style={pill(b.mic)}>{b.speaker}</span
									>
									<p
										class="min-w-0 flex-1 text-sm text-[#EAF5EE] {b.deleted ? 'line-through' : ''}"
									>
										{b.text}
									</p>
									<div class="flex shrink-0 items-center gap-2">
										<span class="font-mono text-xs text-[#EAF5EE]/40">{b.time}</span>
										<div class="flex h-6 items-center gap-px" aria-hidden="true">
											{#each [3, 8, 14, 10, 16, 7, 12, 5, 9, 4] as h}
												<span
													class="w-0.5 rounded-full"
													style="height:{h}px;background:{b.deleted ? '#2c4a3b' : '#73C794'}"
												></span>
											{/each}
										</div>
									</div>
								</div>
							{/each}
						</div>
						<!-- トピックプランナー -->
						<div class="hidden border-l border-white/10 p-4 md:block">
							<p class="mb-3 text-xs font-semibold tracking-wide text-[#9BD8B2]/70">
								トピックプランナー
							</p>
							<div class="space-y-2.5">
								{#each agenda as a}
									<div class="flex items-center gap-2 text-xs">
										<span
											class="grid h-4 w-4 place-items-center rounded-full text-[9px] {a.done
												? 'bg-[#298C5C] text-[#081710]'
												: 'border border-white/20 text-transparent'}">✓</span
										>
										<span class={a.done ? 'text-[#EAF5EE]/50 line-through' : 'text-[#EAF5EE]'}
											>{a.text}</span
										>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
			<p class="mt-4 text-center text-xs text-surface-500">
				↑ 消したいブロックを選んで Delete。それだけでカット編集が終わります
			</p>
		</div>
	</div>
</section>

<!-- 3ステップ -->
<section class="mx-auto max-w-6xl px-6 py-20">
	<h2 class="text-center text-3xl font-bold">録る。読む。消す。<span class="text-primary-400">それだけ。</span></h2>
	<p class="mx-auto mt-3 max-w-xl text-center text-surface-300">
		編集ソフトの操作を覚える必要はありません。テキストを読める人なら、誰でも番組を仕上げられます。
	</p>
	<div class="mt-12 grid gap-6 md:grid-cols-3">
		<div class="card preset-outlined-surface-700 p-6">
			<span class="badge-icon preset-filled-primary-500 mb-4 text-lg font-bold">1</span>
			<h3 class="h4">録る</h3>
			<p class="mt-2 text-sm text-surface-300">
				内蔵マイクでも、USB ミキサー(ZOOM PodTrak P4 など)のマルチトラックでも。iPhone をワイヤレスカメラにすれば映像も同時収録。収録中はライブ文字起こしが話者ごとに色分けで流れます。
			</p>
		</div>
		<div class="card preset-outlined-surface-700 p-6">
			<span class="badge-icon preset-filled-primary-500 mb-4 text-lg font-bold">2</span>
			<h3 class="h4">読む</h3>
			<p class="mt-2 text-sm text-surface-300">
				停止した瞬間、端末内の Whisper が全文を書き起こし、発話ごとのブロックに分かれます。高精度が必要なときはクラウドのプレミアム文字起こしも選べます。
			</p>
		</div>
		<div class="card preset-outlined-surface-700 p-6">
			<span class="badge-icon preset-filled-primary-500 mb-4 text-lg font-bold">3</span>
			<h3 class="h4">消す</h3>
			<p class="mt-2 text-sm text-surface-300">
				いらないブロックを選んで削除するだけ。映像も同じ編集がそのままカットに反映され、音声は WAV / M4A、動画は縦型・横型で書き出せます。
			</p>
		</div>
	</div>
</section>

<!-- 機能グリッド -->
<section id="features" class="border-y border-surface-800 bg-surface-900/50">
	<div class="mx-auto max-w-6xl px-6 py-20">
		<h2 class="text-center text-3xl font-bold">Podcaster が手放せなくなる道具</h2>
		<div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">iPhone がワイヤレスカメラに</h3>
				<p class="mt-2 text-sm text-surface-300">
					iPhone で開くとカメラモードで起動。同じ Wi-Fi の iPad から接続して、収録に合わせて遠隔で録画。フル画質は iPhone 本体に保存し、必要なときに転送します。複数台つなげばマルチカムに。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">サウンドステッカー(AI 生成)</h3>
				<p class="mt-2 text-sm text-surface-300">
					BGM / SE をプロンプトから AI 生成し、声(タイトルコール)を重ねて 1 本のジングルに。作ったステッカーは編集画面のサウンドメニューからワンタップ挿入できます。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">番組ホスティング & RSS 配信</h3>
				<p class="mt-2 text-sm text-surface-300">
					書き出した番組をそのまま公開。RSS を発行して Apple Podcasts / Spotify に登録できます。既存番組の RSS インポート、チームでの共同運用にも対応。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">AI が目次をつくる</h3>
				<p class="mt-2 text-sm text-surface-300">
					話題ごとにブロックを自動グループ化。トピックの切り替わりには色の違うマーカーが自動で入り、チャプター付きノートを Markdown で書き出せます。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">本格ミキサー内蔵</h3>
				<p class="mt-2 text-sm text-surface-300">
					3バンド EQ・パン・フェーダーのチャンネルストリップ。BGM レーン、クラップ検知でのマーカー、ジョグホイールでの微調整まで、仕上げの道具がそろっています。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">小声も拾い直せる</h3>
				<p class="mt-2 text-sm text-surface-300">
					無音と判定された区間だけ音量を持ち上げて再文字起こし。ささやき声のオフトークも逃しません。基本の文字起こしは端末内で完結します。
				</p>
			</div>
		</div>
		<div class="mt-10 text-center">
			<a href="/features" class="btn preset-tonal">すべての機能・仕様を見る →</a>
		</div>
	</div>
</section>

<!-- スタジオ mock: サウンドステッカー & ワイヤレスカメラ -->
<section class="mx-auto max-w-6xl px-6 py-20">
	<div class="grid items-center gap-12 md:grid-cols-2">
		<!-- iPhone: サウンドステッカースタジオ -->
		<div class="order-2 md:order-1">
			<span class="badge preset-tonal-primary mb-3">NEW</span>
			<h2 class="text-2xl font-bold">AI で “番組の音” をつくる</h2>
			<p class="mt-3 text-surface-300">
				オープニングのジングル、コーナーの SE、エンディングの BGM。プロンプトを書けば AI が生成し、その場でタイトルコールを重ねて 1 本のサウンドステッカーに。番組の世界観を、数タップで。
			</p>
		</div>
		<!-- iPhone フレーム -->
		<div class="order-1 mx-auto md:order-2">
			<div
				class="w-[240px] rounded-[2.2rem] border border-[#1c4b38] bg-[#050f0a] p-2 shadow-2xl shadow-[#298C5C]/25"
			>
				<div
					class="overflow-hidden rounded-[1.7rem]"
					style="background:linear-gradient(165deg,#0B1F17,#0D3D2B 60%,#081710)"
				>
					<div class="flex items-center justify-between px-4 pt-3 pb-1 text-[10px] text-[#EAF5EE]/60">
						<span>9:41</span><span>サウンドステッカー</span><span>􀋲</span>
					</div>
					<div class="px-4 py-3">
						<div class="mb-3 flex items-center gap-2 text-xs text-[#EAF5EE]">
							<span class="text-[#CFEEDB]">◈</span> 番組オープニング
						</div>
						<!-- レイヤー -->
						<div class="space-y-2">
							<div class="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-[#081710]" style="background:#9BD8B2">
								〜 ベース(BGM)
							</div>
							<div class="ml-6 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-[#081710]" style="background:#EFB65A">
								◉ 声・タイトルコール
							</div>
							<div class="ml-10 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-[#081710]" style="background:#9B8CE8">
								◆ SE ジングル
							</div>
						</div>
						<div class="mt-4 flex gap-2">
							<span class="flex-1 rounded-full py-2 text-center text-[11px] font-semibold text-[#081710]" style="background:#CFEEDB">✦ ベースを生成</span>
							<span class="flex-1 rounded-full py-2 text-center text-[11px] font-semibold text-[#081710]" style="background:#EFB65A">● 声を録音</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ホスティング -->
<section class="border-y border-surface-800 bg-surface-900/50">
	<div class="mx-auto max-w-6xl px-6 py-20">
		<div class="grid items-center gap-8 md:grid-cols-[1fr_auto]">
			<div>
				<span class="badge preset-tonal-primary mb-3">配信</span>
				<h2 class="text-2xl font-bold">書き出したら、そのまま世界へ</h2>
				<p class="mt-3 text-surface-300">
					Humming Studio のホスティングで番組を公開すると、RSS フィードが発行され Apple Podcasts / Spotify に登録できます。既存番組の移行(RSS インポート)や、チームでの共同運用にも対応。当社運営の
					<a href="https://radio-keizai.com" class="anchor">ラジオ経済</a>
					で紹介・放送されることもあります(番組ごとにいつでも停止可・<a href="/terms" class="anchor">利用規約</a>)。
				</p>
			</div>
			<a href="https://radio-keizai.com" class="btn preset-filled-primary-500">ラジオ経済を見る</a>
		</div>
	</div>
</section>

<!-- 最終CTA -->
<section id="testflight" class="border-t border-surface-800 bg-surface-900/50">
	<div class="mx-auto max-w-3xl px-6 py-20 text-center">
		<h2 class="text-3xl font-bold">ベータテスター募集中</h2>
		<p class="mt-4 text-surface-300">
			iPad(iPadOS 17 以降)・iPhone・Mac(macOS 14 以降)のテスターを募集しています(無料)。<br />
			TestFlight アプリをインストールして、下のリンクから参加してください。
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<a
				href="https://testflight.apple.com/join/s8DBaCfG"
				class="btn preset-filled-primary-500 btn-lg">TestFlight で参加する</a
			>
			<a href="mailto:kawakami@tsunagu-hito.com" class="btn preset-tonal btn-lg">メールで問い合わせ</a>
		</div>
		<p class="mt-6 text-xs text-surface-500">
			基本機能は無料。プレミアム文字起こし・BGM/SE 生成・書き出し無制限・ホスティングは Humming Studio Pro(月額600円)で。
		</p>
	</div>
</section>
