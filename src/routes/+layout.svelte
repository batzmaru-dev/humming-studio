<script lang="ts">
	import '../app.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { page } from '$app/state';
	let { children } = $props();

	// Vercel Web Analytics(訪問数・ページ別・参照元などをダッシュボードで集計)
	injectAnalytics();

	// トップページは独自のライトデザイン(自前のヘッダー/フッター)を使うため、
	// 共通のダークなヘッダー/フッターはトップでは出さない。他ページは従来どおり。
	const isHome = $derived(page.url.pathname === '/');
</script>

<div class="flex min-h-screen flex-col">
	{#if !isHome}
	<header
		class="sticky top-0 z-50 border-b border-surface-800 bg-surface-950/80 backdrop-blur"
	>
		<nav class="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
			<a
				href="/"
				class="flex shrink-0 items-center gap-2 font-bold whitespace-nowrap text-surface-50"
			>
				<img src="/podblock-icon.png" alt="" class="h-7 w-7 rounded-md" />
				Humming Studio
			</a>
			<div class="ml-auto flex items-center gap-4 text-sm sm:gap-5">
				<a href="/features" class="hidden text-surface-300 hover:text-surface-50 sm:inline">機能</a>
				<a href="/terms" class="hidden text-surface-300 hover:text-surface-50 sm:inline">利用規約</a>
				<a href="/privacy" class="hidden text-surface-300 hover:text-surface-50 sm:inline"
					>プライバシー</a
				>
				<a href="/takedown" class="hidden text-surface-300 hover:text-surface-50 sm:inline"
					>削除対応</a
				>
				<a href="/#testflight" class="btn preset-filled-primary-500 btn-sm shrink-0 whitespace-nowrap"
					>テスターに応募</a
				>
			</div>
		</nav>
	</header>
	{/if}

	<main class="flex-1">
		{@render children()}
	</main>

	{#if !isHome}
	<footer class="border-t border-surface-800">
		<div
			class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-sm text-surface-400"
		>
			<span
				>運営: <a href="https://tsunagu-hito.com" class="anchor">合同会社ツナギビト</a></span
			>
			<a href="/features" class="hover:text-surface-200">機能</a>
			<a href="/terms" class="hover:text-surface-200">利用規約</a>
			<a href="/privacy" class="hover:text-surface-200">プライバシーポリシー</a>
			<a href="/takedown" class="hover:text-surface-200">削除対応(権利者の方へ)</a>
			<span class="ml-auto">© 2026 tsunagibito LLC</span>
		</div>
	</footer>
	{/if}
</div>
