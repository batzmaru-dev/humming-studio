<script lang="ts">
	import { MAC_PLANS, MAC_PLANS_CONTACT } from '$lib/macPlans';
</script>

<svelte:head>
	<title>特定商取引法に基づく表記 | Humming Studio</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-14">
	<article
		class="prose prose-invert prose-headings:text-primary-300 prose-a:text-primary-400 max-w-none"
	>
		<h1>特定商取引法に基づく表記</h1>
		<p class="updated">最終更新日: 2026年11月24日</p>
		<p>
			当社ウェブサイトで販売する、Mac 版 Humming Studio の解放コードについての表記です。iPhone・iPad
			版のアプリ内課金は Apple の App Store を通じた販売となり、本表記の対象外です。
		</p>

		<table>
			<tbody>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">販売業者</th>
					<td>合同会社ツナギビト</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">運営統括責任者</th>
					<td>川上 真生</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">所在地</th>
					<td>請求があった場合には、遅滞なく開示します。下記のメールアドレスまでご連絡ください。</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">電話番号</th>
					<td>請求があった場合には、遅滞なく開示します。下記のメールアドレスまでご連絡ください。</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">メールアドレス</th>
					<td><a href={`mailto:${MAC_PLANS_CONTACT}`}>{MAC_PLANS_CONTACT}</a></td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">販売価格</th>
					<td>
						{#each MAC_PLANS as plan}
							{plan.name}: {plan.price}(税込)<br />
						{/each}
						最新の価格は<a href="/mac-plans">料金と購入方法</a>のページに表示します。
					</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">商品代金以外の必要料金</th>
					<td>ありません。インターネット接続にかかる通信料はお客様のご負担となります。</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">支払方法</th>
					<td>クレジットカード決済</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">支払時期</th>
					<td>ご注文時に決済が確定します。</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">商品の引渡時期</th>
					<td>決済の確認後、3 営業日以内に、決済時のメールアドレス宛に解放コードを送信します。</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">返品・キャンセル</th>
					<td>
						デジタルコンテンツの性質上、解放コードの送信後は、お客様のご都合による返品・返金はお受けしていません。<br />
						コードが届かない、入力しても有効にならないなど、当社の責めに帰すべき事由がある場合は、コードの再発行または返金で対応します。上記のメールアドレスまでご連絡ください。
					</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">有効期間・自動更新</th>
					<td>
						Unlock は買い切りで、期限はありません。<br />
						Pro は、解放コードを有効にした日から 1 年間有効です。自動では更新されず、追加の請求は発生しません。
					</td>
				</tr>
				<tr>
					<th scope="row" class="w-28 align-top sm:w-48 sm:whitespace-nowrap">動作環境</th>
					<td>
						当社ウェブサイトからダウンロードする Mac 版 Humming Studio(macOS 14 以降)。解放コードは 1
						つにつき Mac 1 台で利用できます。
					</td>
				</tr>
			</tbody>
		</table>
	</article>
</div>
