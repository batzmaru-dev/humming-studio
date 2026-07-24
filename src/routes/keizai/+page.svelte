<script lang="ts">
	// ラジオ経済(Radio KEIZAI)× Humming Studio 専用ランディング。
	// クリーム×朱の現代エディトリアル(Archivo / Zen Kaku Gothic New / DM Mono、
	// 角なし・2px 罫線・マーキー)で、ラジオ経済の硬派な佇まいをそのまま持ち込む。
	const TF = 'https://testflight.apple.com/join/s8DBaCfG';
	const KEIZAI = 'https://radio-keizai.com';

	const marquee = [
		'話した言葉で、編集する',
		'RADIO KEIZAI × HUMMING STUDIO',
		'収録・文字起こし・編集・配信',
		'iPhone · iPad · Mac',
		'TESTFLIGHT BETA'
	];

	const feats = [
		{ no: '01', en: 'BLOCK EDITOR', title: '文字で編集する', desc: '自動文字起こしされた発話がブロックに。要らない一行を消すだけで、音も映像もカット。' },
		{ no: '02', en: 'TRANSCRIPTION', title: 'オンデバイス & クラウド', desc: '端末内 Whisper で無料・プライベートに。Pro では高精度クラウド。ライブ文字起こしで待ち時間ゼロ。' },
		{ no: '03', en: 'MULTI-MIC', title: 'マルチマイク & ミキサー', desc: '複数マイクを個別トラックで収録。音量・EQ・パン、ブロック単位まで非破壊で。' },
		{ no: '04', en: 'VIDEO', title: 'ビデオポッドキャスト', desc: 'iPhone をワイヤレスカメラに。縦横の書き出しと、文字起こしからのテロップ自動焼き込み。' },
		{ no: '05', en: 'AUDIO', title: 'BGM・SE・AI チャプター', desc: 'BGM の音量やフェード、効果音も簡単。AI が話題の切れ目でチャプターを自動生成。' },
		{ no: '06', en: 'HOSTING', title: 'ワンストップ配信', desc: '公開すれば RSS を発行。Spotify や Apple Podcasts へ。既存番組の移行にも対応。' }
	];
</script>

<svelte:head>
	<title>ラジオ経済 × Humming Studio — 話した言葉で、編集する。</title>
	<meta
		name="description"
		content="ラジオ経済の佇まいのまま、話した言葉でポッドキャストを編集。収録・文字起こし・編集・配信を iPhone・iPad・Mac で。クリームと朱の KEIZAI テーマで番組をつくる。"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=DM+Mono:wght@400;500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="fm">
	<div class="fm-marquee" aria-hidden="true">
		<div class="fm-track">
			{#each [...marquee, ...marquee] as m, i}
				<span class:fm-accent={i % 5 === 1}>{m}</span><span class="fm-sep">◆</span>
			{/each}
		</div>
	</div>

	<header class="fm-hero">
		<div class="fm-wrap">
			<nav class="fm-nav">
				<div class="fm-brand">
					<span class="fm-brand-name">Humming&nbsp;Studio</span>
					<span class="fm-x">×</span>
					<span class="fm-media">RADIO&nbsp;KEIZAI</span>
				</div>
				<a class="fm-btn fm-nav-cta" href={TF}>ベータに参加</a>
			</nav>

			<div class="fm-hero-grid">
				<div class="fm-hero-copy">
					<div class="fm-kicker"><span class="fm-dot"></span>NOW — TESTFLIGHT BETA</div>
					<div class="fm-over">EDIT WITH YOUR WORDS</div>
					<h1>話した言葉で、<br />編集する。</h1>
					<p class="fm-lead">
						波形とにらめっこする編集は、もう終わり。収録すると発話がすべて文字になり、要らない一行を消すだけで、音も、同時に撮った映像もカットされる。ラジオ経済の硬派な佇まいのまま、番組づくりを。
					</p>
					<div class="fm-cta">
						<a class="fm-btn" href={TF}>TestFlight で試す</a>
						<a class="fm-btn fm-btn-ghost" href="#screen">実機を見る</a>
					</div>
					<div class="fm-meta">RECORD → TRANSCRIBE → EDIT → PUBLISH</div>
				</div>
				<aside class="fm-quote">
					<div class="fm-quote-label">THE THESIS</div>
					<blockquote>「編集できる人」だけの世界から、「話せる人なら、誰でも」の世界へ。</blockquote>
					<div class="fm-quote-rule"></div>
					<p>波形ではなく、文章を編集する。原稿を読み直すのと同じ感覚で、番組が仕上がる。</p>
				</aside>
			</div>
		</div>
	</header>

	<section class="fm-section fm-screen" id="screen">
		<div class="fm-wrap">
			<div class="fm-sec-head">
				<div class="fm-kicker">YOUR WORLD — 世界観</div>
				<h2>ラジオ経済の佇まいのまま、収録する。</h2>
				<p class="fm-sub">
					アプリのデザインは <b>GREEN / CANDY / KEIZAI</b> から。KEIZAI を選べば、クリームと朱の落ち着いた画面のまま、収録から編集・配信まで。
				</p>
			</div>
			<figure class="fm-shot">
				<div class="fm-shot-frame">
					<img src="/shots/ipad-keizai-editor.jpg" alt="KEIZAI テーマの Humming Studio エディタ画面" loading="lazy" />
				</div>
				<figcaption>話した内容がブロックに。朱の波形も、テキストを消すと同じ位置でカットされる。</figcaption>
			</figure>
		</div>
	</section>

	<section class="fm-section fm-feats">
		<div class="fm-wrap">
			<div class="fm-sec-head">
				<div class="fm-kicker">FEATURES — 機能</div>
				<h2>一台に、スタジオを。</h2>
			</div>
			<div class="fm-feat-grid">
				{#each feats as f}
					<article class="fm-feat">
						<div class="fm-feat-top"><span class="fm-feat-no">{f.no}</span><span class="fm-feat-en">{f.en}</span></div>
						<h3>{f.title}</h3>
						<p>{f.desc}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="fm-section fm-cta">
		<div class="fm-wrap">
			<div class="fm-kicker fm-kicker-c"><span class="fm-dot"></span>BETA IS OPEN</div>
			<h2>話せる人なら、誰でも。</h2>
			<p>収録から文字起こし・編集・配信まで、これ一台で。いま TestFlight でベータを配信しています。</p>
			<div class="fm-cta fm-cta-center">
				<a class="fm-btn fm-btn-lg" href={TF}>TestFlight ベータに参加</a>
			</div>
			<a class="fm-back" href={KEIZAI}>← ラジオ経済にもどる</a>
		</div>
	</section>

	<footer class="fm-footer">
		<div class="fm-wrap fm-foot-inner">
			<span class="fm-brand-name">Humming&nbsp;Studio</span>
			<div class="fm-foot-links">
				<a href="/">Humming Studio</a>
				<a href="/features">機能</a>
				<a href="/terms">利用規約</a>
				<a href="/privacy">プライバシー</a>
			</div>
			<span class="fm-foot-note">運営: 合同会社ツナギビト</span>
		</div>
	</footer>
</div>

<style>
	.fm {
		--fm-paper: #faf5ea;
		--fm-paper2: #f3ebda;
		--fm-paper3: #ece1cb;
		--fm-ink: #211a11;
		--fm-ink2: #4a4031;
		--fm-soft: #6e624e;
		--fm-line: #d9ccb1;
		--fm-line2: #c6b696;
		--fm-verm: oklch(0.62 0.185 38);
		--fm-verm-ink: oklch(0.5 0.16 38);
		--fm-sun: oklch(0.82 0.145 78);
		--fm-display: 'Archivo', 'Zen Kaku Gothic New', system-ui, sans-serif;
		--fm-jp: 'Zen Kaku Gothic New', system-ui, sans-serif;
		--fm-mono: 'DM Mono', ui-monospace, monospace;

		background: var(--fm-paper);
		color: var(--fm-ink);
		font-family: var(--fm-jp);
		line-height: 1.85;
		-webkit-font-smoothing: antialiased;
		overflow-x: clip;
		min-height: 100vh;
	}
	.fm :global(*) {
		box-sizing: border-box;
	}
	.fm img {
		max-width: 100%;
		display: block;
	}
	.fm a {
		text-decoration: none;
		transition:
			color 0.2s,
			box-shadow 0.12s,
			transform 0.12s;
	}
	.fm a:not(.fm-btn) {
		color: var(--fm-verm-ink);
	}
	.fm a:not(.fm-btn):hover {
		color: var(--fm-verm);
	}
	.fm h1,
	.fm h2,
	.fm h3,
	.fm p {
		margin: 0;
	}
	.fm-wrap {
		max-width: 1140px;
		margin: 0 auto;
		padding-left: clamp(20px, 5vw, 44px);
		padding-right: clamp(20px, 5vw, 44px);
	}

	/* buttons — sharp, editorial, offset hard-shadow on hover */
	.fm-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		font-family: var(--fm-display);
		font-weight: 700;
		font-size: 15px;
		letter-spacing: 0.02em;
		color: var(--fm-paper);
		background: var(--fm-ink);
		border: 2px solid var(--fm-ink);
		border-radius: 0;
		padding: 13px 26px;
		line-height: 1;
	}
	.fm-btn:hover {
		color: var(--fm-paper);
		transform: translate(-2px, -2px);
		box-shadow: 5px 5px 0 var(--fm-verm);
	}
	.fm-btn-ghost {
		color: var(--fm-ink);
		background: transparent;
	}
	.fm-btn-ghost:hover {
		color: var(--fm-ink);
	}
	.fm-btn-lg {
		font-size: 16px;
		padding: 15px 30px;
	}

	/* marquee */
	.fm-marquee {
		overflow: hidden;
		background: var(--fm-ink);
		white-space: nowrap;
	}
	.fm-track {
		display: inline-flex;
		align-items: center;
		animation: fm-marquee 32s linear infinite;
	}
	.fm-track span {
		font-family: var(--fm-mono);
		font-size: 12.5px;
		letter-spacing: 0.14em;
		color: var(--fm-paper);
		padding: 9px 18px;
		text-transform: uppercase;
	}
	.fm-track .fm-accent {
		color: var(--fm-sun);
	}
	.fm-track .fm-sep {
		color: var(--fm-verm);
		padding: 9px 2px;
	}
	@keyframes fm-marquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	/* NAV */
	.fm-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 22px 0;
		border-bottom: 2px solid var(--fm-ink);
	}
	.fm-brand {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.fm-brand-name {
		font-family: var(--fm-display);
		font-weight: 800;
		font-size: 18px;
		color: var(--fm-ink);
		white-space: nowrap;
	}
	.fm-x {
		color: var(--fm-verm);
		font-weight: 700;
	}
	.fm-media {
		font-family: var(--fm-display);
		font-weight: 800;
		font-size: 14px;
		letter-spacing: 0.06em;
		color: var(--fm-paper);
		background: var(--fm-verm);
		padding: 4px 11px;
		white-space: nowrap;
	}
	.fm-nav-cta {
		padding: 10px 20px;
		font-size: 14px;
	}

	/* HERO */
	.fm-hero {
		background: var(--fm-paper);
	}
	.fm-hero-grid {
		display: grid;
		grid-template-columns: 1.25fr 0.75fr;
		gap: clamp(24px, 4vw, 56px);
		align-items: stretch;
		padding: clamp(34px, 5vw, 62px) 0 clamp(48px, 6vw, 76px);
	}
	.fm-kicker {
		font-family: var(--fm-mono);
		font-size: 12px;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: var(--fm-soft);
		display: inline-flex;
		align-items: center;
		gap: 9px;
	}
	.fm-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--fm-verm);
		animation: fm-pulse 1.8s infinite;
	}
	@keyframes fm-pulse {
		0% {
			box-shadow: 0 0 0 0 var(--fm-verm);
		}
		70% {
			box-shadow: 0 0 0 7px transparent;
		}
		100% {
			box-shadow: 0 0 0 0 transparent;
		}
	}
	.fm-over {
		font-family: var(--fm-display);
		font-weight: 800;
		font-style: italic;
		font-size: clamp(14px, 1.8vw, 18px);
		letter-spacing: 0.04em;
		color: var(--fm-verm);
		margin-top: 16px;
	}
	.fm-hero h1 {
		font-family: var(--fm-jp);
		font-weight: 900;
		font-size: clamp(38px, 6.6vw, 70px);
		line-height: 1.16;
		letter-spacing: 0.01em;
		color: var(--fm-ink);
		margin: 6px 0 0;
	}
	.fm-lead {
		color: var(--fm-ink2);
		font-size: clamp(15px, 1.7vw, 17px);
		line-height: 2;
		max-width: 32em;
		margin: 22px 0 0;
	}
	.fm-cta {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		margin-top: 30px;
	}
	.fm-meta {
		margin-top: 28px;
		font-family: var(--fm-mono);
		font-size: 12px;
		letter-spacing: 0.16em;
		color: var(--fm-soft);
	}
	/* hero quote block */
	.fm-quote {
		border: 2px solid var(--fm-ink);
		background: var(--fm-paper2);
		padding: clamp(22px, 2.4vw, 30px);
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.fm-quote-label {
		font-family: var(--fm-mono);
		font-size: 11px;
		letter-spacing: 0.28em;
		color: var(--fm-verm);
	}
	.fm-quote blockquote {
		font-family: var(--fm-jp);
		font-weight: 900;
		font-size: clamp(19px, 2vw, 23px);
		line-height: 1.7;
		color: var(--fm-ink);
		margin: 16px 0 0;
	}
	.fm-quote-rule {
		height: 2px;
		background: var(--fm-ink);
		margin: 20px 0;
	}
	.fm-quote p {
		color: var(--fm-ink2);
		font-size: 14px;
		line-height: 1.9;
	}

	/* SECTION */
	.fm-section {
		padding: clamp(56px, 8vw, 96px) 0;
	}
	.fm-sec-head {
		max-width: 42em;
	}
	.fm-sec-head h2 {
		font-family: var(--fm-jp);
		font-weight: 900;
		font-size: clamp(27px, 4vw, 42px);
		color: var(--fm-ink);
		line-height: 1.34;
		margin: 12px 0 0;
	}
	.fm-sub {
		color: var(--fm-ink2);
		font-size: 15px;
		margin: 14px 0 0;
		line-height: 1.9;
		max-width: 36em;
	}
	.fm-sub b {
		color: var(--fm-verm-ink);
	}

	/* screenshot */
	.fm-screen {
		background: var(--fm-paper2);
		border-top: 2px solid var(--fm-ink);
		border-bottom: 2px solid var(--fm-ink);
	}
	.fm-shot {
		margin: clamp(28px, 4vw, 44px) auto 0;
		max-width: 840px;
	}
	.fm-shot-frame {
		border: 2px solid var(--fm-ink);
		background: var(--fm-paper);
		padding: 14px;
		box-shadow: 12px 12px 0 var(--fm-paper3);
	}
	.fm-shot-frame img {
		width: 100%;
		border: 1px solid var(--fm-line);
	}
	.fm-shot figcaption {
		font-family: var(--fm-mono);
		font-size: 12px;
		letter-spacing: 0.04em;
		color: var(--fm-soft);
		margin-top: 16px;
	}

	/* features — editorial grid, sharp rules */
	.fm-feat-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 2px solid var(--fm-ink);
		border-left: 2px solid var(--fm-ink);
		margin-top: clamp(28px, 4vw, 46px);
	}
	.fm-feat {
		border-right: 2px solid var(--fm-ink);
		border-bottom: 2px solid var(--fm-ink);
		padding: 26px 24px 30px;
		background: var(--fm-paper);
	}
	.fm-feat-top {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}
	.fm-feat-no {
		font-family: var(--fm-display);
		font-weight: 800;
		font-size: 18px;
		color: var(--fm-verm);
	}
	.fm-feat-en {
		font-family: var(--fm-mono);
		font-size: 10.5px;
		letter-spacing: 0.2em;
		color: var(--fm-soft);
	}
	.fm-feat h3 {
		font-family: var(--fm-jp);
		font-weight: 700;
		font-size: 18px;
		color: var(--fm-ink);
		margin: 14px 0 8px;
	}
	.fm-feat p {
		color: var(--fm-ink2);
		font-size: 13.5px;
		line-height: 1.85;
	}

	/* CTA */
	.fm-cta {
		/* reused; center variant below */
	}
	.fm-section.fm-cta {
		background: var(--fm-ink);
		text-align: center;
	}
	.fm-kicker-c {
		color: var(--fm-sun);
		justify-content: center;
	}
	.fm-section.fm-cta h2 {
		font-family: var(--fm-jp);
		font-weight: 900;
		font-size: clamp(30px, 5vw, 52px);
		color: var(--fm-paper);
		line-height: 1.24;
		margin: 12px 0 0;
	}
	.fm-section.fm-cta p {
		color: var(--fm-line);
		font-size: 16px;
		margin: 18px auto 0;
		max-width: 34em;
		line-height: 1.95;
	}
	.fm-cta-center {
		justify-content: center;
		margin-top: 28px;
	}
	.fm-section.fm-cta .fm-btn {
		background: var(--fm-paper);
		color: var(--fm-ink);
		border-color: var(--fm-paper);
	}
	.fm-section.fm-cta .fm-btn:hover {
		color: var(--fm-ink);
		box-shadow: 5px 5px 0 var(--fm-verm);
	}
	.fm-back {
		display: inline-block;
		margin-top: 22px;
		font-family: var(--fm-mono);
		font-size: 13px;
		letter-spacing: 0.06em;
		color: var(--fm-line) !important;
	}
	.fm-back:hover {
		color: var(--fm-sun) !important;
	}

	/* footer */
	.fm-footer {
		border-top: 2px solid var(--fm-ink);
		padding: 32px 0;
		background: var(--fm-paper);
	}
	.fm-foot-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}
	.fm-foot-links {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
	}
	.fm-foot-links a {
		font-family: var(--fm-mono);
		font-size: 13px;
		letter-spacing: 0.04em;
	}
	.fm-foot-note {
		font-family: var(--fm-mono);
		color: var(--fm-soft);
		font-size: 12px;
	}

	@media (prefers-reduced-motion: reduce) {
		.fm-track {
			animation: none;
		}
		.fm-dot {
			animation: none;
		}
	}

	@media (max-width: 860px) {
		.fm-hero-grid {
			grid-template-columns: 1fr;
			gap: 28px;
		}
		.fm-feat-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 560px) {
		.fm-feat-grid {
			grid-template-columns: 1fr;
		}
		.fm-cta {
			flex-direction: column;
			align-items: stretch;
			max-width: 340px;
		}
		.fm-cta .fm-btn {
			justify-content: center;
		}
		.fm-foot-inner {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
