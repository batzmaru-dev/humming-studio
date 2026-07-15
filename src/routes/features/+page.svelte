<script lang="ts">
	const groups = [
		{
			title: '収録',
			items: [
				['内蔵マイク & USB マルチトラック', 'iPad / iPhone / Mac の内蔵マイクから、ZOOM PodTrak P4 など USB オーディオインターフェースのマルチトラック収録まで対応。'],
				['iPhone ワイヤレスカメラ', 'iPhone をカメラモードで起動し、同じ Wi-Fi の iPad から遠隔で録画。フル画質は iPhone に保存し、必要なときにローカルネットワークで転送。複数台つなげばマルチカム。'],
				['ライブ文字起こし', '収録中に話者ごとに色分けされた字幕がリアルタイムで流れます。'],
				['クラップでマーカー', '手を叩くだけで、あとで見返したい位置に自動でマーカー。映像との同期にも使えます。'],
				['トピックプランナー', '収録前にテーマを渡すと AI がアジェンダを生成。話し終えたトピックに自動でチェックが付きます。'],
				['iPad 横向き固定 / iPhone は縦向きフルスタジオ', '端末に合わせた最適レイアウト。iPhone 単体でも収録から編集・書き出しまで完結します。']
			]
		},
		{
			title: '文字起こし',
			items: [
				['オンデバイス Whisper(無料)', '停止した瞬間、端末内で全文を書き起こし。音声は外部に送られません。'],
				['プレミアム文字起こし(Pro)', '高精度が必要なときはクラウドエンジンを選択。月 360 分まで。'],
				['発話ごとのブロック分割', '無音や言い直しを自動検出し、編集しやすいブロックに分けます。'],
				['小声の拾い直し', '無音と判定された区間だけ音量を持ち上げて再文字起こし。']
			]
		},
		{
			title: '編集',
			items: [
				['ブロックを消すだけのカット編集', 'いらないブロックを選んで Delete。テキストを読める人なら誰でも仕上げられます。'],
				['連結 FAB & ジョグホイール', '再生 / 停止・再生位置での分割・マーカー追加をまとめた FAB を配置。ジョグでクラップやマーカーにスナップしながら微調整。'],
				['トピック自動グループ', '話題ごとにブロックを自動グループ化。切り替わりには色の違うマーカーが自動で入ります。'],
				['ブロック単位のマイク音量', 'マルチトラック収録なら、ブロックごとに特定マイクの音量調整や部分ミュートができます。']
			]
		},
		{
			title: '音・BGM',
			items: [
				['本格ミキサー内蔵', '3バンド EQ・パン・フェーダーのチャンネルストリップ。マスターと BGM レーンも。'],
				['サウンドステッカー(AI 生成)', 'BGM / SE をプロンプトから AI 生成し、声(タイトルコール)や効果音を重ねて 1 本のジングルに。編集画面のサウンドメニューから挿入。'],
				['サウンドプリセット', 'よく使う SE / BGM を番組プリセットに登録して、ワンタップ挿入。']
			]
		},
		{
			title: '映像',
			items: [
				['マルチカム(iPhone)', '複数の iPhone アングルを 1 本のプロジェクトに。編集画面でアングルを切り替え。'],
				['クラップ同期', '音声と映像のクラップからオフセットを自動推定して位置合わせ。'],
				['ブロック編集を映像に適用', '音声のカット編集がそのまま映像カットに反映されて書き出し。'],
				['縦型 / 横型 / 正方形・テロップ焼き込み', 'SNS 向けのアスペクト比とレイアウトを選び、字幕を焼き込んで mp4 出力。']
			]
		},
		{
			title: '配信',
			items: [
				['番組ホスティング & RSS 発行', '公開すると RSS フィードを発行。Apple Podcasts / Spotify に登録できます。'],
				['RSS インポート(番組移行)', '既存番組の RSS を取り込んで移行。過去エピソードは元の音源を参照するので容量を消費しません。'],
				['チーム共同運用', '招待コードでメンバーを追加し、番組を共同で運用。'],
				['ラジオ経済への掲載', '公開した番組は当社運営のラジオ経済で紹介・放送されることがあります(番組ごとにいつでも停止可)。']
			]
		},
		{
			title: '書き出し',
			items: [
				['音声: WAV / M4A', '無圧縮 24bit WAV、または AAC 192kbps の M4A。'],
				['動画: mp4', 'ブロック編集を適用した映像を、指定のアスペクト比・レイアウトで書き出し。']
			]
		}
	];
</script>

<svelte:head>
	<title>機能・仕様 - Humming Studio</title>
	<meta
		name="description"
		content="Humming Studio の機能一覧。収録・文字起こし・ブロック編集・ミキサー・サウンドステッカー(AI 生成 BGM/SE)・iPhone ワイヤレスカメラ・マルチカム映像・ホスティング/RSS 配信まで。"
	/>
</svelte:head>

<section class="mx-auto max-w-4xl px-6 pt-16 pb-8 text-center">
	<span class="badge preset-outlined-primary-500 mb-5">機能・仕様</span>
	<h1 class="text-3xl font-bold sm:text-4xl">Humming Studio でできること</h1>
	<p class="mx-auto mt-4 max-w-2xl text-surface-300">
		収録から配信まで。基本の文字起こしは端末内で完結し、AI 生成やクラウド高精度文字起こしは必要なときだけ選べます。
	</p>
</section>

<section class="mx-auto max-w-5xl px-6 pb-16">
	<div class="space-y-10">
		{#each groups as g}
			<div>
				<h2 class="mb-4 flex items-center gap-3 text-xl font-bold">
					<span class="h-5 w-1.5 rounded-full bg-primary-500"></span>{g.title}
				</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each g.items as [title, desc]}
						<div class="card preset-outlined-surface-700 bg-surface-900 p-5">
							<h3 class="h6 font-semibold text-primary-300">{title}</h3>
							<p class="mt-1.5 text-sm text-surface-300">{desc}</p>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- プラン -->
<section class="border-y border-surface-800 bg-surface-900/50">
	<div class="mx-auto max-w-5xl px-6 py-16">
		<h2 class="text-center text-2xl font-bold">プラン</h2>
		<div class="mt-8 grid gap-6 md:grid-cols-2">
			<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
				<h3 class="h4">無料</h3>
				<p class="mt-1 text-sm text-surface-400">まずは無料で、ひと通り。</p>
				<ul class="mt-4 space-y-2 text-sm text-surface-300">
					<li>・録音・オンデバイス文字起こし・ブロック編集</li>
					<li>・ミキサー・BGM / SE 挿入・マーカー</li>
					<li>・iPhone ワイヤレスカメラ・マルチカム</li>
					<li>・WAV / M4A 書き出し(尺の上限あり)</li>
				</ul>
			</div>
			<div class="card border border-primary-500/40 bg-primary-500/5 p-6">
				<div class="flex items-baseline justify-between">
					<h3 class="h4 text-primary-300">Humming Studio Pro</h3>
					<span class="text-lg font-bold">月額 600円</span>
				</div>
				<p class="mt-1 text-sm text-surface-400">番組を “仕事” にする人へ。</p>
				<ul class="mt-4 space-y-2 text-sm text-surface-300">
					<li>・プレミアム文字起こし(クラウド高精度・月 360 分)</li>
					<li>・サウンドステッカーの AI 生成(BGM / SE・月 5 回)</li>
					<li>・書き出し無制限(音声・動画)</li>
					<li>・番組ホスティング & RSS 配信</li>
				</ul>
			</div>
		</div>
		<p class="mt-6 text-center text-xs text-surface-500">
			BGM / SE 生成のお試しは、無料ユーザーも 1 回まで。仕様は開発中のため変更されることがあります。
		</p>
	</div>
</section>

<section class="mx-auto max-w-3xl px-6 py-16 text-center">
	<h2 class="text-2xl font-bold">ベータで試せます</h2>
	<p class="mt-3 text-surface-300">iPad・iPhone・Mac のテスターを募集中(無料)。</p>
	<div class="mt-6 flex flex-wrap justify-center gap-3">
		<a href="https://testflight.apple.com/join/s8DBaCfG" class="btn preset-filled-primary-500 btn-lg"
			>TestFlight で参加する</a
		>
		<a href="/" class="btn preset-tonal btn-lg">トップに戻る</a>
	</div>
</section>
