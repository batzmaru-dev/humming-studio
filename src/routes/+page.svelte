<script lang="ts">
	// texpile.com を参考にした構成: ヒーロー(プロダクトモック)→ 機能 →
	// 3ステップ → AI → ラジオ経済 → プライバシー → 最終CTA
	const blocks = [
		{ speaker: 'Mic 1', color: 'bg-primary-500/20 text-primary-300', time: '00:12.4', text: 'それでは今週の経済ニュース、いってみましょう。' },
		{ speaker: 'Mic 2', color: 'bg-secondary-500/20 text-secondary-300', time: '00:18.9', text: 'はい、まずは為替から。今週は大きな動きがありましたね。' },
		{ speaker: 'Mic 1', color: 'bg-primary-500/20 text-primary-300', time: '00:26.1', text: 'えーっと、その前に、あの、先週の続きなんですけど…', deleted: true },
		{ speaker: 'Mic 2', color: 'bg-secondary-500/20 text-secondary-300', time: '00:31.7', text: '実は日銀の発表の裏で、こんな動きがあったんです。' }
	];
</script>

<svelte:head>
	<title>Humming Studio - 文字で編集するポッドキャストスタジオ</title>
	<meta
		name="description"
		content="録音・文字起こし・ブロック編集・配信までを iPad と Mac で完結。文字起こしも AI もすべてオンデバイスで動くポッドキャスト制作アプリ。"
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
			録って、読んで、いらない行を消すだけ。録音から文字起こし、編集、配信まで
			iPad と Mac の中で完結します。音声が外部に送られることはありません。
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<a href="#testflight" class="btn preset-filled-primary-500 btn-lg">無料でベータに参加</a>
			<a href="#features" class="btn preset-tonal btn-lg">機能を見る</a>
		</div>

		<!-- プロダクトモック: ブロックエディタ -->
		<div
			class="card mx-auto mt-14 max-w-3xl border border-surface-700 bg-surface-900 p-4 text-left shadow-2xl shadow-primary-500/10"
		>
			<div class="mb-3 flex items-center gap-2 border-b border-surface-800 pb-3">
				<span class="h-3 w-3 rounded-full bg-red-400/70"></span>
				<span class="h-3 w-3 rounded-full bg-yellow-400/70"></span>
				<span class="h-3 w-3 rounded-full bg-green-400/70"></span>
				<span class="ml-3 text-xs text-surface-400">第24回 ラジオ経済.podblock</span>
				<span class="badge preset-tonal-primary ml-auto text-xs">文字起こし済み</span>
			</div>
			<div class="space-y-2">
				{#each blocks as block}
					<div
						class="flex items-start gap-3 rounded-lg p-3 {block.deleted
							? 'bg-surface-800/40 opacity-45'
							: 'bg-surface-800'}"
					>
						<span class="badge {block.color} shrink-0 text-xs font-semibold">{block.speaker}</span>
						<div class="min-w-0 flex-1">
							<p class="text-sm {block.deleted ? 'line-through' : ''}">{block.text}</p>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<span class="font-mono text-xs text-surface-500">{block.time}</span>
							<!-- 波形ミニチュア -->
							<div class="flex h-6 items-center gap-px" aria-hidden="true">
								{#each [3, 8, 14, 10, 16, 7, 12, 5, 9, 4] as h}
									<span
										class="w-0.5 rounded-full {block.deleted
											? 'bg-surface-600'
											: 'bg-primary-400'}"
										style="height: {h}px"
									></span>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
			<p class="mt-3 text-center text-xs text-surface-500">
				↑ 消したいブロックを選んで Delete。それだけでカット編集が終わります
			</p>
		</div>
	</div>
</section>

<!-- 3ステップ (texpile の "Write, Write, and Write" 相当) -->
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
				内蔵マイクでも、USB ミキサー(ZOOM PodTrak P4 など)のマルチトラックでも。収録中はライブ文字起こしが話者ごとに色分けで流れます。
			</p>
		</div>
		<div class="card preset-outlined-surface-700 p-6">
			<span class="badge-icon preset-filled-primary-500 mb-4 text-lg font-bold">2</span>
			<h3 class="h4">読む</h3>
			<p class="mt-2 text-sm text-surface-300">
				停止した瞬間、端末内の Whisper が全文を書き起こし、発話ごとのブロックに分かれます。無音や言い直しも自動で検出。
			</p>
		</div>
		<div class="card preset-outlined-surface-700 p-6">
			<span class="badge-icon preset-filled-primary-500 mb-4 text-lg font-bold">3</span>
			<h3 class="h4">消す</h3>
			<p class="mt-2 text-sm text-surface-300">
				いらないブロックを選んで削除するだけ。ブロック単位のマイク音量調整や、部分的な再文字起こしもできます。仕上げは WAV / M4A で書き出し。
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
				<h3 class="h5 text-primary-300">AI が目次をつくる</h3>
				<p class="mt-2 text-sm text-surface-300">
					話題ごとにブロックを自動グループ化。チャプター付きのエピソードノートを Markdown で書き出せます。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">トピックプランナー</h3>
				<p class="mt-2 text-sm text-surface-300">
					収録前にテーマを渡せば AI がアジェンダを生成。収録中は話し終えたトピックに自動でチェックが付きます。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">本格ミキサー内蔵</h3>
				<p class="mt-2 text-sm text-surface-300">
					3バンド EQ・パン・フェーダーのチャンネルストリップ。SE / BGM は番組プリセットとしてワンタップ挿入。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">クラップでマーカー</h3>
				<p class="mt-2 text-sm text-surface-300">
					収録中に手を叩くだけで、あとで見返したい位置に自動でマーカーが入ります。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">小声も拾い直せる</h3>
				<p class="mt-2 text-sm text-surface-300">
					無音と判定された区間だけ音量を持ち上げて再文字起こし。ささやき声のオフトークも逃しません。
				</p>
			</div>
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h5 text-primary-300">すべてオンデバイス</h3>
				<p class="mt-2 text-sm text-surface-300">
					録音も文字起こしも AI 処理も端末内で完結。音声が外部サーバーへ送られることはありません(配信のための公開時を除く)。
				</p>
			</div>
		</div>
	</div>
</section>

<!-- ラジオ経済 -->
<section class="mx-auto max-w-6xl px-6 py-20">
	<div class="card preset-filled-primary-500/10 border border-primary-500/30 p-8 md:p-10">
		<div class="grid items-center gap-8 md:grid-cols-[1fr_auto]">
			<div>
				<span class="badge preset-tonal-primary mb-3">配信先</span>
				<h2 class="text-2xl font-bold">「ラジオ経済」であなたの番組が流れる</h2>
				<p class="mt-3 text-surface-300">
					Humming Studio のホスティング(提供予定)で公開した番組は、当社が運営するミニFM・インターネットラジオ媒体
					<a href="https://radio-keizai.com" class="anchor">ラジオ経済</a>
					で紹介・掲載・放送されることがあります。作った番組に、最初のリスナーと露出の場を。
					掲載は番組ごとにいつでも停止できます(<a href="/terms" class="anchor">利用規約</a>)。
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
			iPad(iPadOS 17 以降)でお使いいただけるテスターを募集しています(無料)。<br />
			TestFlight の招待リンクは準備中です。お急ぎの方はメールでご連絡ください。
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<a href="mailto:kawakami@tsunagu-hito.com" class="btn preset-filled-primary-500 btn-lg"
				>kawakami@tsunagu-hito.com</a
			>
		</div>
		<p class="mt-6 text-xs text-surface-500">
			基本機能は無料。書き出し無制限とホスティング(提供予定)は Humming Studio Pro(月額600円)で。
		</p>
	</div>
</section>
