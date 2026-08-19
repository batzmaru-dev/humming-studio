<script lang="ts">
	let { data } = $props();

	function formatDate(iso: string) {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>最新情報 - Humming Studio</title>
	<meta name="description" content="Humming Studio の最新情報・アップデートのお知らせ。" />
</svelte:head>

<section class="mx-auto max-w-3xl px-6 pt-16 pb-8 text-center">
	<span class="badge preset-outlined-primary-500 mb-5">最新情報</span>
	<h1 class="text-3xl font-bold sm:text-4xl">お知らせ</h1>
	<p class="text-surface-300 mt-4">Humming Studio のアップデート・お知らせをまとめています。</p>
</section>

<section class="mx-auto max-w-3xl px-6 pb-20">
	{#if data.items.length === 0}
		<p class="text-surface-400 py-16 text-center text-sm">現在お知らせはありません。</p>
	{:else}
		<div class="divide-surface-800 divide-y">
			{#each data.items as item (item.id)}
				<a href="/news/{item.slug}" class="hover:bg-surface-900/50 -mx-4 flex gap-4 rounded-lg px-4 py-5 transition-colors">
					<span class="text-surface-500 shrink-0 text-sm">{formatDate(item.date)}</span>
					<span class="flex-1">
						<span class="badge preset-tonal-primary mr-2 text-xs">{item.category}</span>
						<span class="font-medium">{item.title}</span>
					</span>
				</a>
			{/each}
		</div>
	{/if}
</section>
