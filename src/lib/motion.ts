// 軽量モーション用の Svelte アクション集。
// すべてクライアント専用(use: は client でのみ実行される)。
// - prefers-reduced-motion を尊重(その場合は何もしない)
// - 初期表示で既にビューポート内の要素は隠さない(SSR フラッシュ回避)
// - パララックスは requestAnimationFrame + passive scroll で間引く

type ActionReturn = { destroy?: () => void } | void;

const EASE = 'cubic-bezier(.2,.7,.2,1)';

function reduced(): boolean {
	return (
		typeof matchMedia !== 'undefined' &&
		matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/** スクロールで一度だけふわっと現れる(下から) */
export function reveal(
	node: HTMLElement,
	opts: { y?: number; delay?: number; dur?: number } = {}
): ActionReturn {
	if (reduced()) return;
	const { y = 26, delay = 0, dur = 720 } = opts;

	// 既に画面内なら隠さず即表示(初期フラッシュ防止)
	const r = node.getBoundingClientRect();
	if (r.top < window.innerHeight * 0.88 && r.bottom > 0) return;

	node.style.opacity = '0';
	node.style.transform = `translateY(${y}px)`;
	node.style.willChange = 'opacity, transform';

	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (!e.isIntersecting) continue;
				node.style.transition = `opacity ${dur}ms ${EASE} ${delay}ms, transform ${dur}ms ${EASE} ${delay}ms`;
				node.style.opacity = '1';
				node.style.transform = 'none';
				io.disconnect();
			}
		},
		{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}

/** 子要素を順番に(スタッガーで)現す。グリッドや行に付ける */
export function stagger(
	node: HTMLElement,
	opts: { step?: number; y?: number; dur?: number } = {}
): ActionReturn {
	if (reduced()) return;
	const { step = 95, y = 24, dur = 660 } = opts;

	// 既に画面内なら隠さない
	const r = node.getBoundingClientRect();
	const alreadyIn = r.top < window.innerHeight * 0.82 && r.bottom > 0;

	const kids = Array.from(node.children) as HTMLElement[];
	if (!alreadyIn) {
		for (const k of kids) {
			k.style.opacity = '0';
			k.style.transform = `translateY(${y}px)`;
			k.style.willChange = 'opacity, transform';
		}
	}

	const play = () => {
		kids.forEach((k, i) => {
			k.style.transition = `opacity ${dur}ms ${EASE} ${i * step}ms, transform ${dur}ms ${EASE} ${i * step}ms`;
			k.style.opacity = '1';
			k.style.transform = 'none';
		});
	};

	if (alreadyIn) return;

	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (!e.isIntersecting) continue;
				play();
				io.disconnect();
			}
		},
		{ threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}

/**
 * 下部固定 CTA バー用。ヒーロー([data-hero] か指定セレクタ)を過ぎたら
 * node に .on を付ける(CSS 側でスライドイン)。主にモバイルで使う。
 */
export function stickyCTA(
	node: HTMLElement,
	opts: { heroSel?: string } = {}
): ActionReturn {
	const hero = document.querySelector(opts.heroSel ?? '[data-hero]') as HTMLElement | null;
	if (!hero) return;
	let raf = 0;
	const update = () => {
		raf = 0;
		// ヒーローの下端が画面上端付近まで来たら表示
		node.classList.toggle('on', hero.getBoundingClientRect().bottom < 44);
	};
	const onScroll = () => {
		if (!raf) raf = requestAnimationFrame(update);
	};
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll, { passive: true });
	update();
	return {
		destroy: () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (raf) cancelAnimationFrame(raf);
		}
	};
}

/**
 * スクロールに対して要素をゆっくり(または速く)ずらすパララックス。
 * speed>0 でスクロールと逆方向にドリフト。max で移動量を頭打ち。
 * 適用済み offset を差し引いて自然位置を求めるのでフィードバックしない。
 */
export function parallax(
	node: HTMLElement,
	opts: { speed?: number; max?: number } = {}
): ActionReturn {
	if (reduced()) return;
	const { speed = 0.12, max = 70 } = opts;

	let raf = 0;
	let cur = 0;
	node.style.willChange = 'transform';

	const update = () => {
		raf = 0;
		const vh = window.innerHeight;
		const rect = node.getBoundingClientRect();
		// 適用中の offset を除いた「自然な」中心(ビューポート基準)
		const naturalCenter = rect.top + rect.height / 2 - cur;
		const rel = (naturalCenter - vh / 2) / vh; // 概ね -1..1
		if (Math.abs(rel) > 1.6) return; // 画面から遠いときは更新しない
		let off = -rel * speed * vh;
		off = Math.max(-max, Math.min(max, off));
		cur = off;
		node.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
	};
	const onScroll = () => {
		if (!raf) raf = requestAnimationFrame(update);
	};

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll, { passive: true });
	update();

	return {
		destroy: () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (raf) cancelAnimationFrame(raf);
		}
	};
}
