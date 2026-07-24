<script lang="ts">
	import { reveal, stagger, parallax, stickyCTA } from '$lib/motion';

	// CANDY WAVE × Humming Studio 専用ランディング。
	// CANDY WAVE の世界観(ゆめかわ・マスコット「もくもくちゃん」・カーテン遷移)を
	// そのまま持ち込み、アプリも CANDY テーマの実機画面で見せる。
	const TF = 'https://testflight.apple.com/join/s8DBaCfG';
	const CANDY = 'https://candy-wave.vercel.app';

	const feats = [
		{ emoji: '☁', title: '文字で編集', desc: '話したことがぜんぶ文字ブロックに。いらない一行を消すだけでカット。音も映像もおなじ操作で ♡' },
		{ emoji: '♡', title: 'マルチマイク収録', desc: 'ゲストとマイクを分けて収録。話者ごとにきれいに分かれて、あとから整えるのもかんたん。' },
		{ emoji: '★', title: 'ワンストップ配信', desc: '公開すれば Spotify や Apple Podcasts へ。RSS はこちらで用意するから、むずかしい設定はナシ。' }
	];
</script>

<svelte:head>
	<title>CANDY WAVE × Humming Studio — 話した言葉で、編集する。</title>
	<meta
		name="description"
		content="CANDY WAVE の世界のまま、話した言葉でポッドキャストを編集。収録・文字起こし・編集・配信を iPhone・iPad・Mac で。かわいい CANDY テーマで、あなたも番組をはじめよう。"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&family=M+PLUS+Rounded+1c:wght@400;500;700;800;900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{#snippet mascot(width: number, anim: string)}
	{@const s = width / 190}
	<div class="cw-mascot" style="width:{width}px;height:{170 * s}px">
		<div class="cw-mascot-float {anim}" style="width:{width}px;height:{170 * s}px;filter:drop-shadow(0 {8 * s}px 0 rgba(255,143,193,.25))">
			<div style="position:relative;width:190px;height:170px;transform:scale({s});transform-origin:top left">
				<div style="position:absolute;top:16px;left:36%;width:3px;height:26px;background:#ffb7d5;transform:rotate(-16deg);border-radius:2px"></div>
				<div style="position:absolute;top:2px;left:29%;color:#ff5fa8;font-size:20px;transform:rotate(-12deg)">♥</div>
				<div style="position:absolute;top:16px;left:62%;width:3px;height:26px;background:#c9b6f2;transform:rotate(16deg);border-radius:2px"></div>
				<div style="position:absolute;top:0;left:64%;color:#f2b04d;font-size:22px;transform:rotate(14deg)">★</div>
				<div style="position:absolute;bottom:66px;left:34px;width:56px;height:56px;background:#ffd6e8;border-radius:50%"></div>
				<div style="position:absolute;bottom:62px;right:26px;width:44px;height:44px;background:#e3d7ff;border-radius:50%"></div>
				<div style="position:absolute;bottom:74px;left:78px;width:66px;height:66px;background:#fff;border-radius:50%"></div>
				<div style="position:absolute;bottom:20px;left:12px;right:12px;height:78px;background:#fff;border-radius:44px"></div>
				<div style="position:absolute;bottom:8px;left:44px;width:14px;height:20px;background:#b8edd9;border-radius:0 0 9px 9px"></div>
				<div style="position:absolute;bottom:0;left:92px;width:13px;height:28px;background:#ffb7d5;border-radius:0 0 8px 8px"></div>
				<div style="position:absolute;bottom:10px;right:52px;width:14px;height:16px;background:#bde3ff;border-radius:0 0 9px 9px"></div>
				<div style="position:absolute;bottom:44px;left:0;width:22px;height:12px;background:#ffd6e8;border-radius:8px;transform:rotate(-30deg)"></div>
				<div style="position:absolute;bottom:48px;right:-2px;width:22px;height:12px;background:#e3d7ff;border-radius:8px;transform:rotate(38deg)"></div>
				<div style="position:absolute;bottom:48px;left:52px;color:#6b5b8e;font-size:22px;line-height:1">★</div>
				<div style="position:absolute;bottom:52px;right:60px;width:10px;height:16px;background:#6b5b8e;border-radius:5px"></div>
				<div style="position:absolute;bottom:61px;right:62px;width:4px;height:4px;background:#fff;border-radius:50%"></div>
				<div style="position:absolute;bottom:36px;left:50%;transform:translateX(-50%);width:22px;height:15px;background:#6b5b8e;border-radius:5px 5px 14px 14px;overflow:hidden">
					<div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:14px;height:9px;background:#ff8fc1;border-radius:7px 7px 0 0"></div>
				</div>
				<div style="position:absolute;bottom:46px;left:38px;width:16px;height:10px;background:#ff9ec6;border-radius:50%"></div>
				<div style="position:absolute;bottom:46px;right:40px;width:16px;height:10px;background:#ff9ec6;border-radius:50%"></div>
				<div style="position:absolute;bottom:24px;right:6px;transform:rotate(18deg);font-size:20px;color:#ff8fc1">♡</div>
				<div style="position:absolute;bottom:70px;left:16px;transform:rotate(-14deg);font-size:13px;color:#7db8e8">✦</div>
			</div>
		</div>
	</div>
{/snippet}

<div class="cw">
	<!-- 到着カーテン(純CSS、reduced-motion では非表示) -->
	<div class="cw-enter" aria-hidden="true">
		<div class="cw-curtain cw-curtain-left"></div>
		<div class="cw-curtain cw-curtain-right"></div>
		<div class="cw-enter-center">
			{@render mascot(150, 'cw-jump')}
			<div class="cw-loading">おとどけちゅうもく〜!<span class="cw-dots"><i></i><i></i><i></i></span></div>
		</div>
	</div>

	<a class="cw-btn cw-sticky-cta" href={TF} use:stickyCTA aria-label="ベータに参加">ベータに参加 ♡</a>

	<header class="cw-hero" data-hero>
		<span class="cw-deco cw-deco-1" use:parallax={{ speed: 0.16, max: 90 }} aria-hidden="true">♡</span>
		<span class="cw-deco cw-deco-2" use:parallax={{ speed: -0.1, max: 70 }} aria-hidden="true">☁</span>
		<span class="cw-deco cw-deco-3" use:parallax={{ speed: 0.22, max: 110 }} aria-hidden="true">★</span>
		<span class="cw-deco cw-deco-4" use:parallax={{ speed: -0.14, max: 80 }} aria-hidden="true">✦</span>
		<div class="cw-wrap">
			<nav class="cw-nav">
				<div class="cw-brand">
					<span class="cw-brand-name">Humming&nbsp;Studio</span>
					<span class="cw-x">×</span>
					<span class="cw-brand-media">CANDY&nbsp;WAVE</span>
				</div>
				<a class="cw-btn cw-nav-cta" href={TF}>ベータに参加 ♡</a>
			</nav>

			<div class="cw-hero-grid">
				<div class="cw-hero-copy">
					<div class="cw-eyebrow">CANDY WAVE から、ようこそ ♡</div>
					<h1>話した言葉で、<br />編集する。</h1>
					<p class="cw-lead">
						むずかしい波形編集は、もうバイバイ。話した内容がぜんぶ文字になって、いらない一行を消すだけ。音も、同時に撮った映像も、おなじ操作でカットできちゃう。
					</p>
					<div class="cw-cta">
						<a class="cw-btn" href={TF}>TestFlight で試す →</a>
						<a class="cw-btn cw-btn-ghost" href="#screen">アプリを見る</a>
					</div>
					<div class="cw-meta">収録 → 文字起こし → 編集 → 配信</div>
				</div>
				<div class="cw-hero-art">
					{@render mascot(268, 'cw-float')}
					<div class="cw-mascot-tag">もくもくちゃんと、はじめよう</div>
				</div>
			</div>
		</div>
	</header>

	<section class="cw-section cw-screen" id="screen">
		<div class="cw-wrap">
			<div class="cw-sec-head" use:reveal>
				<div class="cw-kicker">☁ Your world</div>
				<h2>CANDY WAVE の世界のまま、収録できる。</h2>
				<p class="cw-sub">
					アプリのデザインは <b>GREEN / CANDY / KEIZAI</b> から選べます。CANDY を選べば、収録も編集も、このかわいい世界のまま ♡
				</p>
			</div>
			<figure class="cw-shot">
				<div class="cw-ipad" use:parallax={{ speed: 0.06, max: 26 }}>
					<img src="/shots/ipad-candy-editor.jpg" alt="CANDY テーマの Humming Studio エディタ画面" loading="lazy" />
				</div>
				<figcaption>話した内容がブロックに。ピンクの波形も、消すだけで音がカットされる。</figcaption>
			</figure>
		</div>
	</section>

	<section class="cw-section cw-feats">
		<div class="cw-wrap">
			<div class="cw-sec-head" use:reveal>
				<div class="cw-kicker">♡ できること</div>
				<h2>話せるなら、もう作れる。</h2>
			</div>
			<div class="cw-feat-grid" use:stagger>
				{#each feats as f}
					<div class="cw-card">
						<div class="cw-card-emoji">{f.emoji}</div>
						<h3>{f.title}</h3>
						<p>{f.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="cw-section cw-final">
		<div class="cw-wrap">
			<div class="cw-final-card" use:reveal>
				{@render mascot(120, 'cw-float')}
				<h2>あなたも、パーソナリティに ♡</h2>
				<p>収録から文字起こし・編集・配信まで、これ一台で。いま TestFlight でベータを配信しています。</p>
				<div class="cw-cta">
					<a class="cw-btn cw-btn-lg" href={TF}>TestFlight ベータに参加 →</a>
				</div>
				<a class="cw-back" href={CANDY}>← CANDY WAVE にもどる</a>
			</div>
		</div>
	</section>

	<footer class="cw-footer">
		<div class="cw-wrap cw-foot-inner">
			<span class="cw-brand-name">Humming&nbsp;Studio</span>
			<div class="cw-foot-links">
				<a href="/">Humming Studio</a>
				<a href="/features">機能</a>
				<a href="/terms">利用規約</a>
				<a href="/privacy">プライバシー</a>
			</div>
			<span class="cw-foot-note">運営: 合同会社ツナギビト</span>
		</div>
	</footer>
</div>

<style>
	.cw {
		--cw-bg: #fff7fb;
		--cw-ink: #6b5b8e;
		--cw-body: #7a6ba0;
		--cw-pink: #ff8fc1;
		--cw-pink-deep: #e0669d;
		--cw-pink-lt: #ffb7d5;
		--cw-pink-pale: #ffd6e8;
		--cw-hot: #ff5fa8;
		--cw-purple: #a06fd6;
		--cw-lav: #c9b6f2;
		--cw-lav-lt: #e3d7ff;
		--cw-pale: #efe7ff;
		--cw-mint: #b8edd9;
		--cw-sky: #bde3ff;
		--cw-amber: #f2b04d;
		--cw-sans: 'Zen Maru Gothic', system-ui, sans-serif;
		--cw-round: 'M PLUS Rounded 1c', system-ui, sans-serif;

		background: var(--cw-bg);
		color: var(--cw-ink);
		font-family: var(--cw-sans);
		line-height: 1.9;
		-webkit-font-smoothing: antialiased;
		overflow-x: clip;
		min-height: 100vh;
	}
	.cw :global(*) {
		box-sizing: border-box;
	}
	.cw img {
		max-width: 100%;
		display: block;
	}
	.cw a {
		text-decoration: none;
		transition: color 0.2s;
	}
	.cw a:not(.cw-btn) {
		color: var(--cw-purple);
	}
	.cw a:not(.cw-btn):hover {
		color: var(--cw-pink);
	}
	.cw h1,
	.cw h2,
	.cw h3,
	.cw p {
		margin: 0;
	}
	.cw-wrap {
		max-width: 1120px;
		margin: 0 auto;
		padding-left: clamp(20px, 5vw, 44px);
		padding-right: clamp(20px, 5vw, 44px);
	}

	/* buttons — rounded, 3D pressed */
	.cw-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		font-family: var(--cw-round);
		font-weight: 800;
		font-size: 15px;
		color: #fff;
		background: linear-gradient(135deg, #ff8fc1, #c9b6f2);
		border-radius: 999px;
		padding: 13px 26px;
		box-shadow: 0 5px 0 #e0669d;
		transition:
			transform 0.12s ease,
			box-shadow 0.12s ease;
		line-height: 1;
	}
	.cw-btn:hover {
		transform: translateY(1px);
		box-shadow: 0 4px 0 #e0669d;
		color: #fff;
	}
	.cw-btn:active {
		transform: translateY(4px);
		box-shadow: 0 1px 0 #e0669d;
	}
	.cw-btn-ghost {
		background: #fff;
		color: var(--cw-hot);
		box-shadow: 0 5px 0 var(--cw-pink-pale);
		border: 2px solid var(--cw-pink-pale);
	}
	.cw-btn-ghost:hover {
		color: var(--cw-hot);
		box-shadow: 0 4px 0 var(--cw-pink-pale);
	}
	.cw-btn-lg {
		font-size: 16px;
		padding: 15px 30px;
	}

	/* NAV */
	.cw-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 22px 0;
	}
	.cw-brand {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.cw-brand-name {
		font-family: var(--cw-round);
		font-weight: 900;
		font-size: 18px;
		color: var(--cw-ink);
		white-space: nowrap;
	}
	.cw-x {
		color: var(--cw-pink);
		font-weight: 700;
	}
	.cw-brand-media {
		font-family: var(--cw-round);
		font-weight: 900;
		font-size: 15px;
		color: var(--cw-hot);
		background: var(--cw-pink-pale);
		border-radius: 999px;
		padding: 3px 12px;
		white-space: nowrap;
	}
	.cw-nav-cta {
		padding: 10px 20px;
		font-size: 14px;
	}

	/* HERO */
	.cw-hero {
		border-bottom: 3px dotted var(--cw-pink-pale);
		background:
			radial-gradient(60% 50% at 85% 12%, #ffe3f0 0%, transparent 60%),
			radial-gradient(50% 45% at 10% 90%, #efe7ff 0%, transparent 60%),
			var(--cw-bg);
	}
	.cw-hero-grid {
		display: grid;
		grid-template-columns: 1.15fr 0.85fr;
		gap: clamp(20px, 4vw, 52px);
		align-items: center;
		padding: clamp(30px, 5vw, 60px) 0 clamp(44px, 6vw, 74px);
	}
	.cw-eyebrow {
		font-family: var(--cw-round);
		font-weight: 800;
		color: var(--cw-hot);
		font-size: 15px;
	}
	.cw-hero h1 {
		font-family: var(--cw-round);
		font-weight: 900;
		font-size: clamp(38px, 7vw, 66px);
		line-height: 1.24;
		color: var(--cw-ink);
		margin: 14px 0 0;
		letter-spacing: 0.01em;
	}
	.cw-lead {
		color: var(--cw-body);
		font-size: clamp(15px, 1.7vw, 17px);
		line-height: 2;
		max-width: 30em;
		margin: 22px 0 0;
	}
	.cw-cta {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		margin-top: 30px;
	}
	.cw-meta {
		margin-top: 26px;
		color: var(--cw-mute, #b9a8d9);
		font-size: 13px;
		font-family: var(--cw-round);
		font-weight: 700;
		color: #b9a8d9;
	}
	.cw-hero-art {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}
	.cw-mascot {
		position: relative;
	}
	.cw-mascot-tag {
		font-family: var(--cw-round);
		font-weight: 800;
		font-size: 13px;
		color: var(--cw-purple);
		background: #fff;
		border: 2px solid var(--cw-lav-lt);
		border-radius: 999px;
		padding: 6px 16px;
	}

	/* SECTION */
	.cw-section {
		padding: clamp(56px, 8vw, 96px) 0;
	}
	.cw-sec-head {
		text-align: center;
		max-width: 40em;
		margin: 0 auto;
	}
	.cw-kicker {
		font-family: var(--cw-round);
		font-weight: 800;
		color: var(--cw-hot);
		font-size: 14px;
	}
	.cw-sec-head h2 {
		font-family: var(--cw-round);
		font-weight: 900;
		font-size: clamp(26px, 4vw, 40px);
		color: var(--cw-ink);
		line-height: 1.4;
		margin: 10px 0 0;
	}
	.cw-sub {
		color: var(--cw-body);
		font-size: 15px;
		margin: 14px auto 0;
		line-height: 1.9;
	}
	.cw-sub b {
		color: var(--cw-hot);
	}

	/* screenshot */
	.cw-screen {
		background: linear-gradient(180deg, #fff, #ffeef6);
		border-top: 3px dotted var(--cw-pink-pale);
		border-bottom: 3px dotted var(--cw-pink-pale);
	}
	.cw-shot {
		margin: clamp(28px, 4vw, 44px) auto 0;
		max-width: 820px;
	}
	.cw-ipad {
		background: #fff;
		border: 3px solid var(--cw-pink-pale);
		border-radius: 22px;
		padding: 12px;
		box-shadow: 0 26px 50px -28px rgba(224, 102, 157, 0.4);
	}
	.cw-ipad img {
		width: 100%;
		border-radius: 12px;
	}
	.cw-shot figcaption {
		text-align: center;
		color: var(--cw-body);
		font-size: 13px;
		margin-top: 16px;
	}

	/* features */
	.cw-feat-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(16px, 2.5vw, 24px);
		margin-top: clamp(30px, 4vw, 48px);
	}
	.cw-card {
		background: #fff;
		border: 2px solid var(--cw-pink-pale);
		border-radius: 22px;
		padding: 28px 24px 30px;
		box-shadow: 0 14px 34px -22px rgba(224, 102, 157, 0.35);
	}
	.cw-card-emoji {
		width: 52px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		border-radius: 16px;
		background: linear-gradient(135deg, var(--cw-pink-pale), var(--cw-lav-lt));
		margin-bottom: 16px;
	}
	.cw-card h3 {
		font-family: var(--cw-round);
		font-weight: 800;
		font-size: 18px;
		color: var(--cw-ink);
		margin: 0 0 10px;
	}
	.cw-card p {
		color: var(--cw-body);
		font-size: 14px;
		line-height: 1.85;
	}

	/* final CTA */
	.cw-final {
		background:
			radial-gradient(60% 60% at 50% 0%, #ffe3f0 0%, transparent 70%), var(--cw-bg);
	}
	.cw-final-card {
		text-align: center;
		max-width: 640px;
		margin: 0 auto;
		background: #fff;
		border: 3px solid var(--cw-pink-pale);
		border-radius: 30px;
		padding: clamp(30px, 5vw, 48px);
		box-shadow: 0 30px 60px -34px rgba(224, 102, 157, 0.5);
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.cw-final-card h2 {
		font-family: var(--cw-round);
		font-weight: 900;
		font-size: clamp(24px, 3.6vw, 34px);
		color: var(--cw-ink);
		margin: 12px 0 0;
	}
	.cw-final-card p {
		color: var(--cw-body);
		font-size: 15px;
		margin: 14px 0 0;
		max-width: 28em;
		line-height: 1.9;
	}
	.cw-back {
		margin-top: 18px;
		font-family: var(--cw-round);
		font-weight: 700;
		font-size: 14px;
	}

	/* footer */
	.cw-footer {
		border-top: 3px dotted var(--cw-pink-pale);
		padding: 34px 0;
	}
	.cw-foot-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}
	.cw-foot-links {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
	}
	.cw-foot-links a {
		font-size: 14px;
	}
	.cw-foot-note {
		color: var(--cw-body);
		font-size: 13px;
	}

	/* mascot animations */
	.cw-mascot-float.cw-float {
		animation: cw-float 3.5s ease-in-out infinite;
	}
	.cw-mascot-float.cw-jump {
		animation: cw-jump 0.9s ease-in-out infinite;
	}
	@keyframes cw-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
		}
	}
	@keyframes cw-jump {
		0%,
		100% {
			transform: translateY(0) scale(1, 1);
		}
		15% {
			transform: translateY(2px) scale(1.08, 0.9);
		}
		45% {
			transform: translateY(-22px) scale(0.96, 1.06);
		}
		70% {
			transform: translateY(0) scale(1, 1);
		}
		85% {
			transform: translateY(1px) scale(1.05, 0.94);
		}
	}

	/* ---- 到着カーテン ---- */
	.cw-enter {
		position: fixed;
		inset: 0;
		z-index: 200;
		pointer-events: none;
		animation: cw-enter-gone 0s 1.15s forwards;
	}
	@keyframes cw-enter-gone {
		to {
			visibility: hidden;
		}
	}
	.cw-curtain {
		position: absolute;
		top: 0;
		bottom: 0;
		width: calc(50% + 8px);
		background-image: radial-gradient(rgba(255, 255, 255, 0.38) 3px, transparent 4px);
		background-size: 28px 28px;
	}
	.cw-curtain-left {
		left: 0;
		background-color: #ffd6e8;
		animation: cw-curtain-out-l 0.5s cubic-bezier(0.65, 0, 0.35, 1) 0.62s forwards;
	}
	.cw-curtain-right {
		right: 0;
		background-color: #e3d7ff;
		animation: cw-curtain-out-r 0.5s cubic-bezier(0.65, 0, 0.35, 1) 0.62s forwards;
	}
	.cw-curtain-right::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -23px;
		width: 24px;
		background: radial-gradient(circle at 100% 50%, #e3d7ff 23px, transparent 24px);
		background-size: 24px 48px;
		background-repeat: repeat-y;
	}
	@keyframes cw-curtain-out-l {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-110%);
		}
	}
	@keyframes cw-curtain-out-r {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(110%);
		}
	}
	.cw-enter-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		animation: cw-center-out 0.32s ease 0.66s forwards;
	}
	@keyframes cw-center-out {
		to {
			opacity: 0;
		}
	}
	.cw-loading {
		font-family: var(--cw-round);
		font-weight: 800;
		color: #a06fd6;
		font-size: 15px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.cw-dots {
		display: inline-flex;
		gap: 5px;
	}
	.cw-dots i {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #ff8fc1;
		animation: cw-dot 0.9s ease-in-out infinite;
	}
	.cw-dots i:nth-child(2) {
		animation-delay: 0.15s;
		background: #c9b6f2;
	}
	.cw-dots i:nth-child(3) {
		animation-delay: 0.3s;
		background: #bde3ff;
	}
	@keyframes cw-dot {
		0%,
		60%,
		100% {
			transform: translateY(0);
		}
		30% {
			transform: translateY(-6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cw-enter {
			display: none;
		}
		.cw-mascot-float.cw-float,
		.cw-mascot-float.cw-jump {
			animation: none;
		}
	}

	/* 浮遊デコ(パララックス) */
	.cw-hero {
		position: relative;
		overflow: hidden;
	}
	.cw-hero .cw-wrap {
		position: relative;
		z-index: 1;
	}
	.cw-deco {
		position: absolute;
		z-index: 0;
		opacity: 0.5;
		pointer-events: none;
		user-select: none;
		line-height: 1;
	}
	.cw-deco-1 {
		top: 13%;
		left: 5%;
		font-size: 58px;
		color: #ff9ec6;
	}
	.cw-deco-2 {
		top: 18%;
		right: 8%;
		font-size: 92px;
		color: #e3d7ff;
	}
	.cw-deco-3 {
		bottom: 16%;
		left: 11%;
		font-size: 44px;
		color: #f2b04d;
	}
	.cw-deco-4 {
		bottom: 24%;
		right: 15%;
		font-size: 38px;
		color: #7db8e8;
	}

	/* モバイル: ヒーローを過ぎたら下部に張り付く CTA */
	.cw-sticky-cta {
		position: fixed;
		left: 16px;
		right: 16px;
		bottom: 14px;
		z-index: 60;
		display: none;
		justify-content: center;
		transform: translateY(170%);
		transition: transform 0.36s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.cw-sticky-cta:global(.on) {
		transform: translateY(0);
	}
	@media (max-width: 760px) {
		.cw-sticky-cta {
			display: inline-flex;
		}
		.cw-deco-2,
		.cw-deco-4 {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cw-sticky-cta {
			transition: none;
		}
	}

	/* responsive */
	@media (max-width: 860px) {
		.cw-hero-grid {
			grid-template-columns: 1fr;
			gap: 8px;
			text-align: center;
		}
		.cw-hero-copy {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		.cw-hero-art {
			order: -1;
			margin-bottom: 6px;
		}
		.cw-feat-grid {
			grid-template-columns: 1fr;
			max-width: 420px;
			margin-left: auto;
			margin-right: auto;
		}
	}
	@media (max-width: 480px) {
		.cw-cta {
			flex-direction: column;
			align-items: stretch;
			width: 100%;
			max-width: 320px;
		}
		.cw-cta .cw-btn {
			justify-content: center;
		}
		.cw-foot-inner {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
