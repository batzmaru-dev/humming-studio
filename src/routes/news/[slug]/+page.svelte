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
	<title>{data.item.title} - Humming Studio</title>
</svelte:head>

<article class="mx-auto max-w-2xl px-6 py-16">
	<a href="/news" class="text-surface-400 hover:text-surface-200 text-sm">← 最新情報一覧</a>
	<header class="mt-6 mb-8">
		<div class="mb-3 flex items-center gap-3 text-sm">
			<span class="badge preset-tonal-primary">{data.item.category}</span>
			<span class="text-surface-500">{formatDate(data.item.date)}</span>
		</div>
		<h1 class="text-2xl font-bold sm:text-3xl">{data.item.title}</h1>
	</header>
	{#if data.item.eyecatch}
		<img src={data.item.eyecatch} alt="" class="mb-8 w-full rounded-lg" loading="lazy" />
	{/if}
	<div class="prose prose-invert max-w-none">
		{@html data.item.body}
	</div>
</article>
