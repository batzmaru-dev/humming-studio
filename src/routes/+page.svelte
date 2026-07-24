<script lang="ts">
	import { reveal, stagger, parallax, stickyCTA } from '$lib/motion';

	// トップページ = Humming Studio ランディング(ライト/森のエディトリアル)。
	// 共通レイアウトのダークなヘッダー/フッターはトップでは非表示(+layout.svelte)。

	// 実機スクリーンショット(iPhone)
	const shots = [
		{
			src: '/shots/iphone-editor.jpg',
			label: 'iPhone',
			caption: '話した内容がブロックに。消すだけで編集でき、話者もマイクごとに自動で分かれる。'
		},
		{
			src: '/shots/iphone-mixer.jpg',
			label: 'iPhone',
			caption: '3バンド EQ・パン・フェーダーの本格ミキサーを内蔵。'
		},
		{
			src: '/shots/iphone-publish.jpg',
			label: 'iPhone',
			caption: '公開すれば Spotify や Apple Podcasts へ。RSS はこちらで用意する。'
		}
	];

	const features = [
		{
			title: '文字で編集する',
			desc: '自動文字起こしされた発話がブロックに。要らない箇所はテキストを消すだけでカット。分割・並べ替え・伸縮も指先で。'
		},
		{
			title: 'オンデバイス & クラウド文字起こし',
			desc: '端末内の Whisper で無料・プライベートに。Pro では高精度なクラウドエンジンも。収録中のライブ文字起こしで待ち時間ゼロ。'
		},
		{
			title: 'マルチマイク & ミキサー',
			desc: 'USB オーディオ I/F の複数マイクを個別トラックで収録。音量・EQ・パン、ブロック単位の調整まで非破壊で。'
		},
		{
			title: 'ビデオポッドキャスト',
			desc: 'iPad のカメラや iPhone をワイヤレスカメラに。縦型・横型の書き出し、文字起こしからのテロップ自動焼き込み。'
		},
		{
			title: 'BGM・SE・AI チャプター',
			desc: 'BGM の音量やフェードを調整、効果音も簡単。AI が話題の切れ目を見つけてチャプターを自動生成。'
		},
		{
			title: 'ワンストップ配信',
			desc: '公開すると RSS を発行。Spotify や Apple Podcasts に登録でき、既存番組の移行やチーム共同運用にも対応。'
		}
	];

	// 選べる UI デザイン(アプリのテーマ = 提携メディアの世界観)
	const themes = [
		{
			name: 'GREEN',
			desc: '深い森のクールな余白。集中して仕上げたい人へ。',
			bg: 'linear-gradient(160deg,#0B1F17,#0D3D2B 60%,#081710)',
			accent: '#298C5C',
			accentLight: '#9BD8B2',
			ink: '#EAF5EE',
			card: 'rgba(234,245,238,.06)',
			stroke: 'rgba(234,245,238,.14)',
			onAccent: '#ffffff',
			font: 'font-family:system-ui,sans-serif;font-weight:700;'
		},
		{
			name: 'CANDY',
			desc: '原宿系のポップでかわいい世界観。配信を楽しく。',
			bg: 'linear-gradient(160deg,#FFE3F0,#FFF7FB 55%,#EFE7FF)',
			accent: '#FF5FA8',
			accentLight: '#C9B6F2',
			ink: '#6B5B8E',
			card: '#ffffff',
			stroke: 'rgba(255,143,193,.35)',
			onAccent: '#ffffff',
			font: "font-family:'Zen Maru Gothic',system-ui,sans-serif;font-weight:800;"
		},
		{
			name: 'KEIZAI',
			desc: '硬派でエディトリアルな経済ラジオの佇まい。明朝体。',
			bg: 'linear-gradient(160deg,#FAF5EA,#F3EBDA 55%,#ECE1CB)',
			accent: '#D9643A',
			accentLight: '#F5D66B',
			ink: '#211A11',
			card: '#FFFDF8',
			stroke: 'rgba(33,26,17,.18)',
			onAccent: '#FAF5EA',
			font: "font-family:'Zen Old Mincho',serif;font-weight:700;letter-spacing:.02em;"
		}
	];

	const TF = 'https://testflight.apple.com/join/s8DBaCfG';
</script>

<svelte:head>
	<title>Humming Studio - 文字で編集するポッドキャストスタジオ</title>
	<meta
		name="description"
		content="録音・文字起こし・ブロック編集・配信までを iPad・iPhone・Mac で完結。iPhone をワイヤレスカメラにしたマルチカム収録、AI が作る BGM/SE のサウンドステッカーまで。文字で編集するポッドキャスト制作アプリ。"
	/>
</svelte:head>

<div class="hs">
	<a class="hs-btn hs-btn-honey hs-sticky-cta" href={TF} use:stickyCTA aria-label="無料で試す">無料で試す</a>

	<header class="hs-hero" id="top" data-hero>
		<div class="hs-wrap">
			<nav class="hs-nav">
				<div class="hs-brand">
					<span class="hs-brand-name">Humming&nbsp;Studio</span>
					<span class="hs-brand-tag">ポッドキャストスタジオ</span>
				</div>
				<div class="hs-nav-links">
					<a href="#essence">考え方</a>
					<a href="#screens">実際の画面</a>
					<a href="#features">機能</a>
					<a class="hs-btn hs-btn-honey hs-nav-cta" href={TF}>無料で試す</a>
				</div>
			</nav>

			<div class="hs-hero-grid">
				<div class="hs-hero-copy">
					<div class="hs-hero-eyebrow hs-rise" style="animation-delay:.05s">
						iPhone・iPad・Mac のポッドキャストスタジオ
					</div>
					<h1 class="hs-rise" style="animation-delay:.12s">話した言葉で、<br />編集する。</h1>
					<p class="hs-hero-lead hs-rise" style="animation-delay:.22s">
						収録すると、すべての発話がその場で文字に。要らない一行を消せば、音声も、同時に撮った映像も、まったく同じ操作でカットされます。波形とにらめっこする編集は、もう要りません。
					</p>
					<div class="hs-hero-cta hs-rise" style="animation-delay:.32s">
						<a class="hs-btn hs-btn-honey" href={TF}>無料で試す</a>
						<a class="hs-btn hs-btn-ghost" href="#screens">実際の画面を見る</a>
					</div>
					<div class="hs-hero-meta hs-rise" style="animation-delay:.42s">
						<span>収録 → 文字起こし → 編集 → 配信</span>
					</div>
				</div>
				<div class="hs-hero-art hs-fade" style="animation-delay:.35s">
					<div class="hs-phone" use:parallax={{ speed: 0.05, max: 24 }}>
						<img
							src="/shots/iphone-editor.jpg"
							alt="Humming Studio のブロックエディタ画面"
							loading="eager"
						/>
					</div>
					<div class="hs-hero-badge">
						<small>Block Editor</small><b>消すだけで、編集</b>
					</div>
				</div>
			</div>
		</div>
	</header>

	<section class="hs-section hs-essence" id="essence">
		<div class="hs-wrap">
			<div class="hs-sec-head" use:reveal>
				<h2>波形ではなく、<br />文章を編集する。</h2>
			</div>
			<div class="hs-essence-grid">
				<div class="hs-essence-body">
					<p>
						従来のポッドキャスト編集は、無音の波形を目で探し、コンマ数秒単位でカット位置を合わせる職人作業でした。この工程が、番組を続けられなくなる最大の壁です。
					</p>
					<p>
						Humming Studio では、発話がひとつずつ「ブロック」になります。言い間違い、長すぎる沈黙、要らない相槌——テキストを一行消すだけで、音声も、同時に撮った映像も、まったく同じ操作で切れる。編集の熟練度に関係なく、原稿を読み直すのと同じ感覚で番組が仕上がります。
					</p>
					<p class="hs-pull">「編集できる人」だけの世界から、「話せる人なら、誰でも」の世界へ。</p>
				</div>
				<div class="hs-demo" aria-hidden="true" use:parallax={{ speed: 0.05, max: 20 }}>
					<div class="hs-demo-top"><span>TRANSCRIPT</span><span class="t">00:14 – 00:22</span></div>
					<div class="hs-wave">
						<i style="height:40%"></i><i style="height:70%"></i><i style="height:55%"></i><i
							style="height:85%"
						></i><i style="height:60%"></i><i style="height:35%"></i><i style="height:75%"></i><span
							class="hs-gap"
						></span><i style="height:50%"></i><i style="height:80%"></i><i style="height:45%"></i><i
							style="height:65%"
						></i><i style="height:90%"></i><i style="height:55%"></i><i style="height:70%"></i><i
							style="height:40%"
						></i>
					</div>
					<div class="hs-blk">
						<span class="hs-bar"></span><p>今日のテーマは「文字で編集する」です。</p>
					</div>
					<div class="hs-blk hs-del">
						<span class="hs-bar"></span><p>えー、あー、そのー……</p><span class="hs-tag">削除</span>
					</div>
					<div class="hs-blk">
						<span class="hs-bar"></span><p>波形を触らずに、読むように仕上がります。</p>
					</div>
					<div class="hs-demo-note">
						<span class="hs-cut">┈┈</span> テキストを消すと、上の波形も同じ位置でカットされる。
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="hs-section hs-manifesto">
		<div class="hs-wrap hs-mani-inner" use:stagger={{ step: 140 }}>
			<h2>おもしろい話ができる人は、<br />もう、たくさんいる。</h2>
			<p>
				ラジオやポッドキャストを自分たちで運営するなかで、何度も見てきました。収録は簡単なのに、編集で心が折れる。せっかく良い話ができても、公開までのハードルが高すぎて、番組が続かない。
			</p>
			<p>
				足りないのは才能じゃなくて、届けるための道具でした。「編集できる人」だけの特権を、「話せる人なら、誰でも」に。だから私たちは、話すだけで届く場所をつくっています。
			</p>
			<p class="hs-mani-close">あなたの声が、まだ会っていない誰かに届きますように。</p>
		</div>
	</section>

	<section class="hs-section hs-gallery" id="screens">
		<div class="hs-wrap">
			<div class="hs-sec-head" use:reveal>
				<h2>これは、実機の画面です。</h2>
				<p class="hs-lede">
					iPhone・iPad・Mac、同じプロジェクトをどこでも。モックではなく、いま動いているアプリのスクリーンショットを並べています。
				</p>
			</div>
			<div class="hs-plate-row" use:stagger>
				{#each shots as s}
					<figure class="hs-plate">
						<div class="hs-plate-phone"><img src={s.src} alt={s.caption} loading="lazy" /></div>
						<figcaption class="hs-cap"><b>{s.label}</b>{s.caption}</figcaption>
					</figure>
				{/each}
			</div>
			<figure class="hs-lineup-fig">
				<div class="hs-lineup">
					<div class="hs-dev-slot hs-dev-mac" use:parallax={{ speed: 0.04, max: 30 }}>
						<div class="hs-mac">
							<div class="hs-mac-screen">
								<span class="hs-mac-cam"></span>
								<img src="/shots/mac-editor.jpg" alt="Mac のエディタ画面" loading="lazy" />
							</div>
							<div class="hs-mac-base"></div>
						</div>
						<span class="hs-dev-label">MAC</span>
					</div>
					<div class="hs-dev-slot hs-dev-ipad" use:parallax={{ speed: 0.09, max: 46 }}>
						<div class="hs-ipad">
							<span class="hs-ipad-cam"></span>
							<img src="/shots/ipad-editor-land.jpg" alt="iPad(横画面)のエディタ画面" loading="lazy" />
						</div>
						<span class="hs-dev-label">IPAD</span>
					</div>
				</div>
				<figcaption class="hs-cap hs-lineup-cap">
					一番広い Mac、横画面で広がる iPad。画面の広さに合わせてレイアウトが変わり、一覧性も操作もそのまま。同じプロジェクトを、iCloud で iPhone ⇄ iPad ⇄ Mac で行き来。
				</figcaption>
			</figure>
		</div>
	</section>

	<section class="hs-section hs-features" id="features">
		<div class="hs-wrap">
			<div class="hs-sec-head" use:reveal>
				<h2>一台に、スタジオを。</h2>
			</div>
			<div class="hs-feat-grid" use:stagger>
				{#each features as f}
					<div class="hs-feat">
						<h3>{f.title}</h3>
						<p>{f.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="hs-section hs-reach">
		<div class="hs-wrap">
			<div class="hs-sec-head" use:reveal>
				<h2>作るだけじゃない。<br />ちゃんと、見つけてもらえる。</h2>
				<p class="hs-lede">
					ただ公開するだけでは、届きません。Humming Studio は、探している人に見つけてもらうための情報を、番組に添えて配信します。
				</p>
			</div>
			<div class="hs-reach-body">
				<p>
					Podcast 2.0 のリッチなメタ情報つきで配信。チャプター、番組の恒久 ID、出演者——番組を探すアプリやサービスが、あなたの回を正しく理解できます。
				</p>
				<p>
					さらに、収録すれば音声はそのまま文字に。内容がテキストで残るから、あとから探すのも、読み返すのも簡単。ただ届けるだけでなく、見つけてもらう配信を。
				</p>
			</div>
			<div class="hs-reach-tags" use:stagger={{ step: 70 }}>
				<span class="hs-reach-tag">Podcast 2.0 メタ情報</span>
				<span class="hs-reach-tag">チャプター</span>
				<span class="hs-reach-tag">文字起こし</span>
				<span class="hs-reach-tag">Spotify / Apple Podcasts</span>
			</div>
		</div>
	</section>

	<section class="hs-section hs-sync">
		<div class="hs-wrap hs-sync-inner">
			<div>
				<h2>iPhone ⇄ iPad ⇄ Mac。</h2>
				<p>
					iCloud で、同じプロジェクトをどの端末でも続きから。iPhone はワイヤレスカメラにもなり、収録から編集まで手元の道具だけで完結します。
				</p>
				<div class="hs-chips">
					<span class="hs-chip">iCloud 同期</span>
					<span class="hs-chip">ワイヤレスカメラ</span>
					<span class="hs-chip">非破壊編集</span>
				</div>
			</div>
			<div class="hs-sync-flow">
				<div class="hs-node"><div class="hs-disc">iPhone</div><small>収録・カメラ</small></div>
				<span class="hs-flow-ar">→</span>
				<div class="hs-node"><div class="hs-disc">iPad</div><small>編集</small></div>
				<span class="hs-flow-ar">→</span>
				<div class="hs-node"><div class="hs-disc">Mac</div><small>仕上げ・配信</small></div>
			</div>
		</div>
	</section>

	<section class="hs-section hs-themes" id="themes">
		<div class="hs-wrap">
			<div class="hs-sec-head" use:reveal>
				<h2>見た目は、3つの世界から選べる。</h2>
				<p class="hs-lede">
					「録る・読む・消す」の編集体験はそのままに、好みのデザインで収録・編集できます。初回に選んで、あとから設定でいつでも切り替え。
				</p>
			</div>
			<div class="hs-theme-grid" use:stagger>
				{#each themes as t}
					<figure class="hs-theme-card">
						<div class="hs-tm" style="background:{t.bg}">
							<div class="hs-tm-bar">
								<span class="hs-tm-dot" style="background:{t.accent}"></span>
								<span class="hs-tm-line" style="background:{t.ink}"></span>
							</div>
							{#each [1, 2, 3] as i}
								<div class="hs-tm-block" style="background:{t.card};border-color:{t.stroke}">
									<span class="hs-tm-pill" style="background:{t.accent};color:{t.onAccent}"
										>話者{i}</span
									>
									<span class="hs-tm-fill" style="background:{t.ink}"></span>
									<span class="hs-tm-dot2" style="background:{t.accentLight}"></span>
								</div>
							{/each}
						</div>
						<figcaption class="hs-theme-cap">
							<span class="hs-theme-name" style={t.font}>{t.name}</span>
							<p>{t.desc}</p>
						</figcaption>
					</figure>
				{/each}
			</div>
			<p class="hs-theme-note">
				GREEN は現行のデザイン。CANDY はポップな原宿系ラジオ、KEIZAI は
				<a href="https://radio-keizai.com" target="_blank" rel="noopener">ラジオ経済</a>
				の世界観をアプリに取り込みました。提携メディアに掲載されると、番組はより多くのリスナーへ届きます。
			</p>
		</div>
	</section>

	<section class="hs-section hs-hook">
		<div class="hs-wrap" use:stagger={{ step: 120 }}>
			<h2>ボイスメモで、ポッドキャスト?<br />——もう、終わりにしよう。</h2>
			<p class="hs-hook-sub">Humming Studio で録れば、話した言葉が、そのまま番組になる。</p>
		</div>
	</section>

	<section class="hs-section hs-cta" id="testflight">
		<div class="hs-wrap">
			<h2>話せる人なら、誰でも。</h2>
			<p>
				収録から文字起こし・編集・配信まで、これ一台で。いま TestFlight でベータを配信しています。
			</p>
			<div class="hs-hero-cta"><a class="hs-btn hs-btn-honey" href={TF}>無料で試す</a></div>
			<p class="hs-cta-fine">RSS での配信・既存番組の移行にも対応 ・ 合同会社ツナギビト</p>
		</div>
	</section>

	<footer class="hs-footer">
		<div class="hs-wrap">
			<div class="hs-foot-grid">
				<span class="hs-brand-name" style="font-size:18px">Humming&nbsp;Studio</span>
				<div class="hs-foot-links">
					<a href="#essence">考え方</a>
					<a href="#screens">実際の画面</a>
					<a href="/features">機能</a>
					<a href="/terms">利用規約</a>
					<a href="/privacy">プライバシー</a>
					<a href="/takedown">削除対応</a>
				</div>
			</div>
			<div class="hs-colophon">
				<span>運営: <a href="https://tsunagu-hito.com" target="_blank" rel="noopener">合同会社ツナギビト</a> ・ © 2026 tsunagibito LLC</span>
				<span>話した言葉で、編集する。</span>
			</div>
		</div>
	</footer>
</div>

<style>
	.hs {
		--paper: #f1f2ec;
		--paper2: #e8eae0;
		--paper3: #dee2d5;
		--ink: #18201b;
		--ink2: #3b443c;
		--ink-soft: #6a7168;
		--pine: #1b3b2b;
		--pine2: #122e1e;
		--moss: #4a7a5a;
		--sage: #9db29d;
		--honey: #c88a3a;
		--honey2: #e0a94f;
		--line: rgba(24, 32, 27, 0.14);
		--line-soft: rgba(24, 32, 27, 0.08);
		--paper-line: rgba(241, 242, 236, 0.14);
		--f-display: 'Zen Old Mincho', serif;
		--f-body: 'Zen Kaku Gothic New', system-ui, sans-serif;
		--f-mono: 'IBM Plex Mono', ui-monospace, monospace;

		background: var(--paper);
		color: var(--ink);
		font-family: var(--f-body);
		line-height: 1.85;
		-webkit-font-smoothing: antialiased;
		overflow-x: clip;
		min-height: 100vh;
	}
	.hs :global(*) {
		box-sizing: border-box;
	}
	.hs img {
		max-width: 100%;
		display: block;
	}
	.hs a {
		text-decoration: none;
		transition: color 0.2s;
	}
	.hs a:not(.hs-btn) {
		color: var(--pine);
	}
	.hs a:not(.hs-btn):hover {
		color: var(--honey);
	}
	.hs h1,
	.hs h2,
	.hs h3 {
		margin: 0;
	}
	.hs p {
		margin: 0;
	}
	.hs-wrap {
		max-width: 1180px;
		margin: 0 auto;
		padding-left: clamp(20px, 5vw, 48px);
		padding-right: clamp(20px, 5vw, 48px);
	}
	.hs-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.6em;
		font-family: var(--f-body);
		font-weight: 700;
		font-size: 15px;
		padding: 15px 26px;
		border-radius: 6px;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
		letter-spacing: 0.02em;
		line-height: 1;
	}
	.hs-btn-honey {
		background: var(--honey);
		color: #231a0c;
	}
	.hs-btn-honey:hover {
		background: var(--honey2);
		color: #231a0c;
	}
	.hs-btn-ghost {
		background: transparent;
		color: var(--paper);
		border-color: var(--paper-line);
	}
	.hs-btn-ghost:hover {
		background: rgba(241, 242, 236, 0.08);
		color: var(--paper);
	}

	/* NAV */
	.hs-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-top: 26px;
		padding-bottom: 26px;
	}
	.hs-brand {
		display: flex;
		align-items: baseline;
		gap: 12px;
		min-width: 0;
	}
	.hs-brand-name {
		font-family: var(--f-display);
		font-weight: 700;
		font-size: 20px;
		letter-spacing: 0.02em;
		color: var(--paper);
		white-space: nowrap;
	}
	.hs-brand-tag {
		color: var(--sage);
		font-size: 12px;
		white-space: nowrap;
	}
	.hs-nav-links {
		display: flex;
		align-items: center;
		gap: 28px;
		flex: none;
	}
	.hs-nav-links a:not(.hs-btn) {
		color: var(--paper);
		font-size: 14px;
		font-weight: 500;
	}
	.hs-nav-links a:not(.hs-btn):hover {
		color: var(--honey2);
	}
	.hs-nav-cta {
		padding: 11px 20px;
		font-size: 14px;
		white-space: nowrap;
	}

	/* HERO */
	.hs-hero {
		display: block;
		background: linear-gradient(180deg, #1e4331 0%, var(--pine) 60%, #10291b 100%);
		color: var(--paper);
	}
	.hs-hero-grid {
		display: grid;
		grid-template-columns: 1.06fr 0.94fr;
		gap: clamp(28px, 5vw, 64px);
		align-items: center;
		padding-top: clamp(40px, 7vw, 86px);
		padding-bottom: clamp(56px, 8vw, 104px);
	}
	.hs-hero h1 {
		font-family: var(--f-display);
		font-weight: 900;
		color: var(--paper);
		font-size: clamp(38px, 6.6vw, 68px);
		line-height: 1.18;
		letter-spacing: 0.01em;
		margin: 18px 0 0;
	}
	.hs-hero-eyebrow {
		color: var(--sage);
		font-size: 14px;
		letter-spacing: 0.03em;
	}
	.hs-hero-lead {
		color: #d3dbcf;
		font-size: clamp(15px, 1.7vw, 18px);
		line-height: 2;
		max-width: 30em;
		margin: 26px 0 0;
	}
	.hs-hero-cta {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		margin-top: 34px;
	}
	.hs-hero-meta {
		display: flex;
		gap: 22px;
		margin-top: 30px;
		flex-wrap: wrap;
		color: var(--sage);
		font-size: 13px;
		letter-spacing: 0.02em;
	}
	.hs-hero-art {
		position: relative;
		display: flex;
		justify-content: center;
	}
	.hs-phone {
		background: #0c1f16;
		padding: 9px;
		border-radius: 38px;
		box-shadow: 0 40px 80px -34px rgba(6, 18, 12, 0.7);
		width: min(300px, 78%);
	}
	.hs-phone img {
		border-radius: 30px;
		width: 100%;
	}
	.hs-hero-badge {
		position: absolute;
		left: -6px;
		bottom: 34px;
		background: var(--paper);
		color: var(--ink);
		border-radius: 12px;
		padding: 12px 15px;
		box-shadow: 0 20px 40px -18px rgba(6, 18, 12, 0.55);
		max-width: 210px;
	}
	.hs-hero-badge small {
		color: var(--moss);
		font-size: 12px;
		display: block;
		margin-bottom: 4px;
	}
	.hs-hero-badge b {
		font-family: var(--f-display);
		font-weight: 700;
		font-size: 15px;
	}

	/* SECTION */
	.hs-section {
		padding-top: clamp(64px, 9vw, 116px);
		padding-bottom: clamp(64px, 9vw, 116px);
	}
	.hs-sec-head {
		max-width: 760px;
	}
	.hs-sec-head h2 {
		font-family: var(--f-display);
		font-weight: 700;
		font-size: clamp(28px, 4.2vw, 44px);
		line-height: 1.36;
		letter-spacing: 0.01em;
	}
	.hs-lede {
		color: var(--ink-soft);
		font-size: 16px;
		margin-top: 16px;
		line-height: 1.95;
		max-width: 34em;
	}

	/* ESSENCE */
	.hs-essence {
		background: var(--paper);
	}
	.hs-essence-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(32px, 6vw, 80px);
		align-items: center;
		margin-top: clamp(30px, 4vw, 52px);
	}
	.hs-essence-body p {
		color: var(--ink2);
		font-size: 16px;
		line-height: 2.05;
		margin: 0 0 18px;
	}
	.hs-pull {
		font-family: var(--f-display);
		font-weight: 700;
		font-size: clamp(20px, 2.4vw, 25px);
		line-height: 1.75;
		letter-spacing: 0.01em;
		margin-top: 26px !important;
		padding-left: 18px;
		border-left: 2px solid var(--moss);
		color: var(--ink);
	}
	.hs-demo {
		background: var(--paper2);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 22px 22px 24px;
	}
	.hs-demo-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
		font-family: var(--f-mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		color: var(--moss);
	}
	.hs-demo-top .t {
		color: var(--ink-soft);
	}
	.hs-wave {
		display: flex;
		align-items: flex-end;
		gap: 3px;
		height: 34px;
		margin-bottom: 18px;
	}
	.hs-wave i {
		display: block;
		width: 3px;
		border-radius: 2px;
		background: var(--moss);
		opacity: 0.55;
	}
	.hs-wave .hs-gap {
		background: transparent;
		opacity: 1;
		width: 26px;
		position: relative;
	}
	.hs-wave .hs-gap::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 1px;
		background: repeating-linear-gradient(90deg, var(--honey) 0 4px, transparent 4px 8px);
	}
	.hs-blk {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 11px 13px;
		border-radius: 8px;
		background: var(--paper);
		border: 1px solid var(--line-soft);
		margin-bottom: 9px;
	}
	.hs-blk .hs-bar {
		width: 3px;
		align-self: stretch;
		border-radius: 2px;
		background: var(--moss);
		flex: none;
	}
	.hs-blk p {
		margin: 0;
		font-size: 14px;
		color: var(--ink2);
		line-height: 1.65;
	}
	.hs-blk.hs-del {
		background: transparent;
		border-style: dashed;
	}
	.hs-blk.hs-del .hs-bar {
		background: var(--ink-soft);
		opacity: 0.4;
	}
	.hs-blk.hs-del p {
		color: var(--ink-soft);
		text-decoration: line-through;
		opacity: 0.7;
	}
	.hs-blk .hs-tag {
		margin-left: auto;
		align-self: center;
		font-family: var(--f-mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		color: var(--ink-soft);
		border: 1px solid var(--line);
		border-radius: 5px;
		padding: 2px 7px;
		flex: none;
	}
	.hs-demo-note {
		margin: 14px 2px 0;
		font-size: 13px;
		color: var(--ink-soft);
		display: flex;
		align-items: center;
		gap: 9px;
	}
	.hs-cut {
		color: var(--honey);
	}

	/* GALLERY */
	.hs-gallery {
		background: var(--paper3);
	}
	.hs-plate-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(16px, 2.4vw, 28px);
		margin-top: clamp(30px, 4vw, 48px);
	}
	.hs-plate {
		margin: 0;
	}
	.hs-plate-phone {
		background: #0c1f16;
		padding: 7px;
		border-radius: 24px;
		box-shadow: 0 24px 46px -32px rgba(16, 42, 24, 0.5);
	}
	.hs-plate-phone img {
		border-radius: 18px;
		width: 100%;
	}
	.hs-cap {
		font-size: 13px;
		color: var(--ink-soft);
		line-height: 1.75;
		margin-top: 14px;
		padding: 0 2px;
	}
	.hs-cap b {
		font-family: var(--f-display);
		color: var(--ink);
		font-weight: 700;
		margin-right: 0.5em;
	}
	.hs-lineup-fig {
		margin: clamp(30px, 4vw, 52px) 0 0;
	}
	.hs-lineup {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: clamp(20px, 4vw, 56px);
		margin-top: clamp(28px, 3.6vw, 46px);
	}
	.hs-dev-slot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		margin: 0;
	}
	.hs-dev-mac {
		flex: 0 1 600px;
		min-width: 0;
	}
	.hs-dev-ipad {
		flex: 0 1 400px;
		min-width: 0;
	}
	.hs-dev-label {
		color: var(--ink-soft);
		font-family: var(--f-mono);
		font-size: 11px;
		letter-spacing: 0.18em;
	}
	.hs-mac {
		width: 100%;
	}
	.hs-mac-screen {
		position: relative;
		background: #0b0b0b;
		border-radius: 14px 14px 5px 5px;
		padding: 12px 12px 14px;
		box-shadow:
			0 30px 56px -34px rgba(16, 42, 24, 0.5),
			0 0 0 2px #2a2e2a;
	}
	.hs-mac-screen img {
		border-radius: 4px;
		width: 100%;
	}
	.hs-mac-cam {
		position: absolute;
		top: 5px;
		left: 50%;
		transform: translateX(-50%);
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #262a26;
	}
	.hs-mac-base {
		height: 16px;
		width: 117%;
		margin-left: -8.5%;
		background: linear-gradient(180deg, #d0d3cd 0%, #abafa8 55%, #83887f 100%);
		border-radius: 2px 2px 12px 12px / 2px 2px 26px 26px;
		position: relative;
	}
	.hs-mac-base::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 14%;
		height: 6px;
		background: #8a8f86;
		border-radius: 0 0 8px 8px;
	}
	.hs-ipad {
		position: relative;
		background: #0f0f0f;
		border-radius: 20px;
		padding: 13px;
		box-shadow:
			0 28px 52px -34px rgba(16, 42, 24, 0.5),
			0 0 0 2px #262a26;
		width: 100%;
	}
	.hs-ipad img {
		border-radius: 7px;
		width: 100%;
	}
	.hs-ipad-cam {
		position: absolute;
		top: 50%;
		left: 6px;
		transform: translateY(-50%);
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #2a2e2a;
	}
	.hs-lineup-cap {
		text-align: center;
		max-width: 56ch;
		margin-left: auto;
		margin-right: auto;
		margin-top: 26px;
	}

	/* FEATURES */
	.hs-features {
		background: var(--pine);
		color: var(--paper);
	}
	.hs-features h2 {
		color: var(--paper);
	}
	.hs-feat-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background: var(--paper-line);
		border: 1px solid var(--paper-line);
		border-radius: 12px;
		overflow: hidden;
		margin-top: clamp(30px, 4vw, 52px);
	}
	.hs-feat {
		background: var(--pine);
		padding: 32px 28px 34px;
	}
	.hs-feat h3 {
		font-family: var(--f-display);
		font-weight: 700;
		font-size: 19px;
		margin: 0 0 12px;
		color: var(--paper);
		line-height: 1.5;
	}
	.hs-feat p {
		margin: 0;
		font-size: 14px;
		line-height: 1.9;
		color: #c0ccc2;
	}

	/* SYNC */
	.hs-sync {
		background: var(--moss);
		color: var(--paper);
	}
	.hs-sync-inner {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(28px, 5vw, 64px);
		align-items: center;
	}
	.hs-sync h2 {
		font-family: var(--f-display);
		font-weight: 700;
		font-size: clamp(26px, 3.6vw, 38px);
		color: var(--paper);
		line-height: 1.4;
	}
	.hs-sync p {
		color: #e6ede5;
		font-size: 16px;
		line-height: 2;
		margin: 18px 0 0;
		max-width: 34ch;
	}
	.hs-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 22px;
	}
	.hs-chip {
		font-size: 13px;
		color: var(--paper);
		border: 1px solid var(--paper-line);
		border-radius: 6px;
		padding: 7px 14px;
	}
	.hs-sync-flow {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		flex-wrap: wrap;
	}
	.hs-node {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		text-align: center;
	}
	.hs-disc {
		width: 76px;
		height: 76px;
		border-radius: 14px;
		background: rgba(241, 242, 236, 0.12);
		border: 1px solid var(--paper-line);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		color: var(--paper);
	}
	.hs-node small {
		color: #dce7db;
		font-size: 12px;
	}
	.hs-flow-ar {
		color: var(--paper);
		opacity: 0.6;
		font-size: 20px;
	}

	/* THEMES(選べる UI デザイン) */
	.hs-themes {
		background: var(--paper);
	}
	.hs-theme-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(16px, 2.4vw, 26px);
		margin-top: clamp(30px, 4vw, 48px);
	}
	.hs-theme-card {
		margin: 0;
		border: 1px solid var(--line);
		border-radius: 12px;
		overflow: hidden;
		background: var(--paper2);
	}
	.hs-tm {
		padding: 16px;
	}
	.hs-tm-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 14px;
	}
	.hs-tm-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex: none;
	}
	.hs-tm-line {
		height: 6px;
		width: 84px;
		border-radius: 3px;
		opacity: 0.85;
	}
	.hs-tm-block {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 1px solid;
		border-radius: 9px;
		padding: 9px 10px;
		margin-top: 8px;
	}
	.hs-tm-pill {
		font-size: 10px;
		font-weight: 700;
		border-radius: 999px;
		padding: 2px 8px;
		flex: none;
	}
	.hs-tm-fill {
		height: 6px;
		flex: 1;
		border-radius: 3px;
		opacity: 0.5;
	}
	.hs-tm-dot2 {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex: none;
	}
	.hs-theme-cap {
		padding: 16px 18px 20px;
	}
	.hs-theme-name {
		font-size: 20px;
		color: var(--ink);
	}
	.hs-theme-cap p {
		margin: 6px 0 0;
		font-size: 13.5px;
		color: var(--ink-soft);
		line-height: 1.8;
	}
	.hs-theme-note {
		margin: clamp(24px, 3vw, 34px) auto 0;
		max-width: 46em;
		text-align: center;
		font-size: 13px;
		color: var(--ink-soft);
		line-height: 1.9;
	}

	/* MANIFESTO(想い) */
	.hs-manifesto {
		background: var(--pine);
		color: var(--paper);
	}
	.hs-mani-inner {
		max-width: 760px;
	}
	.hs-manifesto h2 {
		font-family: var(--f-display);
		font-weight: 700;
		font-size: clamp(28px, 4.2vw, 44px);
		line-height: 1.42;
		color: var(--paper);
	}
	.hs-manifesto p {
		color: #c4d0c6;
		font-size: 16px;
		line-height: 2.05;
		margin: 20px 0 0;
		max-width: 40em;
	}
	.hs-manifesto .hs-mani-close {
		font-family: var(--f-display);
		font-weight: 700;
		font-size: clamp(19px, 2.4vw, 24px);
		line-height: 1.7;
		color: var(--honey2);
		margin-top: 30px;
	}

	/* REACH(見つけてもらえる) */
	.hs-reach {
		background: var(--paper);
	}
	.hs-reach-body {
		max-width: 44em;
		margin-top: 6px;
	}
	.hs-reach-body p {
		color: var(--ink2);
		font-size: 16px;
		line-height: 2.05;
		margin: 0 0 16px;
	}
	.hs-reach-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 22px;
	}
	.hs-reach-tag {
		font-size: 13px;
		border: 1px solid var(--line);
		border-radius: 6px;
		padding: 7px 14px;
		color: var(--ink2);
	}

	/* HOOK(パンチライン) */
	.hs-hook {
		background: var(--paper2);
		text-align: center;
	}
	.hs-hook h2 {
		font-family: var(--f-display);
		font-weight: 900;
		font-size: clamp(28px, 4.6vw, 46px);
		line-height: 1.42;
		letter-spacing: 0.01em;
		color: var(--ink);
		margin: 0 auto;
		max-width: 22em;
	}
	.hs-hook-sub {
		font-family: var(--f-display);
		font-weight: 700;
		font-size: clamp(18px, 2.2vw, 24px);
		color: var(--moss);
		margin-top: 18px;
	}

	/* CTA */
	.hs-cta {
		background: linear-gradient(180deg, #1e4331 0%, var(--pine) 60%, #10291b 100%);
		color: var(--paper);
		text-align: center;
	}
	.hs-cta h2 {
		font-family: var(--f-display);
		font-weight: 900;
		font-size: clamp(32px, 5.2vw, 56px);
		color: var(--paper);
		line-height: 1.26;
		letter-spacing: 0.01em;
	}
	.hs-cta p {
		color: #d3dbcf;
		font-size: 17px;
		margin: 22px auto 0;
		max-width: 36ch;
		line-height: 2;
	}
	.hs-cta .hs-hero-cta {
		justify-content: center;
	}
	.hs-cta-fine {
		color: var(--sage);
		font-size: 13px;
		margin-top: 22px !important;
	}

	/* FOOTER */
	.hs-footer {
		background: var(--pine2);
		color: var(--sage);
		padding-top: 48px;
		padding-bottom: 48px;
	}
	.hs-foot-grid {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 28px;
		flex-wrap: wrap;
	}
	.hs-foot-links {
		display: flex;
		gap: 22px;
		flex-wrap: wrap;
	}
	.hs-foot-links a {
		color: #c0ccc2;
		font-size: 14px;
	}
	.hs-foot-links a:hover {
		color: var(--honey2);
	}
	.hs-colophon {
		margin-top: 34px;
		padding-top: 22px;
		border-top: 1px solid var(--paper-line);
		display: flex;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
		color: var(--sage);
		font-size: 13px;
	}
	.hs-colophon a {
		color: var(--sage);
	}
	.hs-colophon a:hover {
		color: var(--honey2);
	}

	/* animation */
	@keyframes hs-rise {
		from {
			opacity: 0;
			transform: translateY(18px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@keyframes hs-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.hs-rise {
		opacity: 0;
		animation: hs-rise 0.85s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
	.hs-fade {
		opacity: 0;
		animation: hs-fade 1.1s ease both;
	}
	@media (prefers-reduced-motion: reduce) {
		.hs-rise,
		.hs-fade {
			animation: none;
			opacity: 1;
			transform: none;
		}
	}

	/* モバイル: ヒーローを過ぎたら下部に張り付く CTA */
	.hs-sticky-cta {
		position: fixed;
		left: 16px;
		right: 16px;
		bottom: 14px;
		z-index: 60;
		display: none;
		justify-content: center;
		box-shadow: 0 12px 30px -8px rgba(6, 18, 12, 0.45);
		transform: translateY(160%);
		transition: transform 0.36s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.hs-sticky-cta:global(.on) {
		transform: translateY(0);
	}
	@media (max-width: 760px) {
		.hs-sticky-cta {
			display: inline-flex;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.hs-sticky-cta {
			transition: none;
		}
	}

	@media (max-width: 900px) {
		.hs-hero-grid {
			grid-template-columns: 1fr;
			gap: 10px;
		}
		.hs-hero-art {
			margin-top: 26px;
			order: 2;
			flex-direction: column;
			align-items: center;
		}
		.hs-hero-badge {
			position: static;
			left: auto;
			bottom: auto;
			margin: 20px auto 0;
		}
		.hs-hero-lead {
			max-width: 100%;
		}
		.hs-essence-grid {
			grid-template-columns: 1fr;
		}
		.hs-feat-grid {
			grid-template-columns: 1fr 1fr;
		}
		.hs-sync-inner {
			grid-template-columns: 1fr;
		}
		.hs-nav-links a:not(.hs-nav-cta) {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.hs-lineup {
			flex-direction: column;
			align-items: center;
			gap: 30px;
		}
		.hs-dev-mac,
		.hs-dev-ipad {
			flex: 0 1 auto;
			width: 100%;
			max-width: 460px;
		}
	}
	@media (max-width: 620px) {
		.hs-plate-row {
			grid-template-columns: 1fr;
			max-width: 340px;
			margin-left: auto;
			margin-right: auto;
		}
		.hs-feat-grid {
			grid-template-columns: 1fr;
		}
		.hs-theme-grid {
			grid-template-columns: 1fr;
			max-width: 360px;
			margin-left: auto;
			margin-right: auto;
		}
	}
	@media (max-width: 480px) {
		.hs-brand-tag {
			display: none;
		}
		.hs-hero h1 {
			font-size: clamp(32px, 9.5vw, 44px);
		}
		.hs-hero-cta {
			flex-direction: column;
			align-items: center;
		}
		.hs-hero-cta .hs-btn {
			width: 100%;
			max-width: 340px;
			justify-content: center;
		}
		.hs-foot-grid {
			flex-direction: column;
			gap: 18px;
		}
		.hs-colophon {
			flex-direction: column;
			gap: 6px;
		}
	}
</style>
