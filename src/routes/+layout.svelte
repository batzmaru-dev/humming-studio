<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<header
		class="sticky top-0 z-50 border-b border-surface-800 bg-surface-950/80 backdrop-blur"
	>
		<nav class="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
			<a href="/" class="flex items-center gap-2 font-bold text-surface-50">
				<img src="/podblock-icon.png" alt="" class="h-7 w-7 rounded-md" />
				Humming Studio
			</a>
			<div class="ml-auto flex items-center gap-5 text-sm">
				<a href="/terms" class="text-surface-300 hover:text-surface-50">利用規約</a>
				<a href="/privacy" class="text-surface-300 hover:text-surface-50">プライバシー</a>
				<a href="/takedown" class="hidden text-surface-300 hover:text-surface-50 sm:inline"
					>削除対応</a
				>
				<a href="/#testflight" class="btn preset-filled-primary-500 btn-sm">テスターに応募</a>
			</div>
		</nav>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="border-t border-surface-800">
		<div
			class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-sm text-surface-400"
		>
			<span
				>運営: <a href="https://tsunagu-hito.com" class="anchor">合同会社ツナギビト</a></span
			>
			<a href="/terms" class="hover:text-surface-200">利用規約</a>
			<a href="/privacy" class="hover:text-surface-200">プライバシーポリシー</a>
			<a href="/takedown" class="hover:text-surface-200">削除対応(権利者の方へ)</a>
			<span class="ml-auto">© 2026 tsunagibito LLC</span>
		</div>
	</footer>
</div>
