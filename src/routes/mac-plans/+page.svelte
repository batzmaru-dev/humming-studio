<script lang="ts">
	import { MAC_PLANS, MAC_PLANS_CONTACT } from '$lib/macPlans';

	const mailto = `mailto:${MAC_PLANS_CONTACT}?subject=${encodeURIComponent('Humming Studio 解放コードについて')}`;
</script>

<svelte:head>
	<title>Mac 版の料金と購入方法 | Humming Studio</title>
	<meta
		name="description"
		content="ホームページからダウンロードする Mac 版 Humming Studio の料金と、解放コードの購入・入力方法。"
	/>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-14">
	<article
		class="prose prose-invert prose-headings:text-primary-300 prose-a:text-primary-400 max-w-none"
	>
		<h1>Mac 版の料金と購入方法</h1>
		<p>
			ホームページからダウンロードする Mac 版は、アプリの中では購入できません。このページで
			<strong>解放コード</strong>を購入し、アプリに入力すると有料の機能が使えるようになります。
		</p>
		<p>
			録音・文字起こし・編集と、編集後 10 分までの書き出しは、無料のままお使いいただけます。
		</p>
	</article>

	<div class="not-prose mt-10 grid gap-5 sm:grid-cols-2">
		{#each MAC_PLANS as plan (plan.id)}
			<section
				class="flex flex-col rounded-2xl border border-surface-700 bg-surface-900/60 p-6"
				aria-labelledby={`plan-${plan.id}`}
			>
				<h2 id={`plan-${plan.id}`} class="text-lg font-bold text-surface-50">{plan.name}</h2>
				<p class="mt-1 text-sm text-surface-300">{plan.summary}</p>
				<p class="mt-5 text-3xl font-bold text-surface-50">
					{plan.price}<span class="ml-1 text-sm font-normal text-surface-300">(税込)</span>
				</p>
				<p class="mt-1 text-sm text-surface-300">{plan.term}</p>
				<ul class="mt-5 flex-1 space-y-2 text-sm text-surface-200">
					{#each plan.features as feature}
						<li class="flex gap-2">
							<span class="text-primary-400" aria-hidden="true">✓</span>
							<span>{feature}</span>
						</li>
					{/each}
				</ul>
				{#if plan.checkoutUrl}
					<a
						href={plan.checkoutUrl}
						class="mt-6 rounded-xl bg-primary-500 px-4 py-3 text-center font-bold text-surface-950 hover:bg-primary-400"
						rel="noopener"
					>
						{plan.name.replace('Humming Studio ', '')} を購入する
					</a>
				{:else}
					<p class="mt-6 rounded-xl border border-surface-700 px-4 py-3 text-center text-sm text-surface-300">
						オンライン決済は準備中です。<br />
						<a class="text-primary-400 underline" href={mailto}>メールでお問い合わせ</a>ください。
					</p>
				{/if}
			</section>
		{/each}
	</div>

	<article
		class="prose prose-invert prose-headings:text-primary-300 prose-a:text-primary-400 mt-12 max-w-none"
	>
		<h2>購入から使えるようになるまで</h2>
		<ol>
			<li>上のボタンから決済します。</li>
			<li>決済を確認したあと、決済時のメールアドレス宛に解放コードをお送りします。</li>
			<li>
				アプリ右上のマイページから「すべての機能を解放」を開き、解放コードを入力して「有効にする」を押します。
			</li>
		</ol>

		<h2>ご購入の前に</h2>
		<ul>
			<li>解放コードは <strong>1 つにつき Mac 1 台</strong>で使えます。Mac を買い替えたときは、移し替えますのでお問い合わせください。</li>
			<li>Pro は、コードを有効にした日から 1 年間です。自動では更新されません。続けて使う場合は、新しいコードを購入して入力してください。</li>
			<li>Pro のクラウド機能を使うには、アプリで Apple アカウントにサインインしている必要があります。</li>
			<li>iPhone・iPad 版は、これまでどおり App Store からご購入いただけます。App Store での購入は Mac 版には引き継がれません。</li>
		</ul>

		<p>
			返品・キャンセルなどの条件は、<a href="/tokushoho">特定商取引法に基づく表記</a>をご覧ください。
		</p>

		<h2>お問い合わせ</h2>
		<p>
			コードが届かない、入力しても有効にならないなどの場合は、
			<a href={mailto}>{MAC_PLANS_CONTACT}</a> までご連絡ください。
		</p>
	</article>
</div>
