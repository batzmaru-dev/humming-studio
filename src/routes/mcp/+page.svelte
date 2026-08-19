<svelte:head>
	<title>MCPで編集操作 - Humming Studio</title>
	<meta
		name="description"
		content="Humming Studio Mac版はMCP(Model Context Protocol)に対応。Claude Code などのAIエージェントから、編集モード中のプロジェクトを直接操作できます。セットアップ方法と使い方。"
	/>
</svelte:head>

<section class="mx-auto max-w-3xl px-6 pt-16 pb-8 text-center">
	<span class="badge preset-outlined-primary-500 mb-5">Mac版・NEW</span>
	<h1 class="text-3xl font-bold sm:text-4xl">AIエージェントから、編集操作を。</h1>
	<p class="text-surface-300 mt-4">
		Humming Studio Mac版はMCP(Model Context Protocol)に対応しています。Claude
		Codeなどのエージェントに話しかけるだけで、編集モード中のプロジェクトを直接操作できます。
	</p>
</section>

<section class="mx-auto max-w-3xl px-6 pb-10">
	<div class="card preset-outlined-surface-700 bg-surface-900 p-6">
		<h2 class="mb-3 text-lg font-bold">できること</h2>
		<ul class="text-surface-300 space-y-1.5 text-sm">
			<li>・プロジェクトのブロック一覧・マーカー一覧・文字起こし全文の取得</li>
			<li>・ブロックの削除・復元(非破壊。⌘Zでいつでも戻せます)</li>
			<li>・ブロックの分割</li>
			<li>・マーカーの追加・削除</li>
		</ul>
		<p class="text-surface-500 mt-4 text-xs">
			すべての操作はUndo/Redo・自動保存の対象です。収録モード中は無効(編集モードでのみ動作)。
		</p>
	</div>
</section>

<section class="mx-auto max-w-3xl px-6 pb-10">
	<h2 class="mb-4 text-xl font-bold">セットアップ</h2>
	<div class="space-y-4">
		<div class="card preset-outlined-surface-700 bg-surface-900 p-5">
			<p class="text-surface-300 mb-2 text-sm font-semibold">1. Humming Studio Mac版で、プロジェクトを編集モードで開く</p>
			<p class="text-surface-400 text-xs">build 118 以降が必要です。App内の「アップデートを確認」から最新版にしてください。</p>
		</div>
		<div class="card preset-outlined-surface-700 bg-surface-900 p-5">
			<p class="text-surface-300 mb-2 text-sm font-semibold">2. MCPクライアントに登録する</p>
			<p class="text-surface-400 mb-3 text-xs">Claude Codeの場合、ターミナルで:</p>
			<pre class="bg-surface-950 overflow-x-auto rounded-lg p-3 text-xs"><code>claude mcp add --scope user humming-studio -- npx -y humming-studio-mcp</code></pre>
			<p class="text-surface-400 mt-3 text-xs">
				他のMCPクライアント(Claude Desktop等)の場合は、設定ファイルに以下を追加してください:
			</p>
			<pre class="bg-surface-950 mt-2 overflow-x-auto rounded-lg p-3 text-xs"><code>{`{
  "mcpServers": {
    "humming-studio": {
      "command": "npx",
      "args": ["-y", "humming-studio-mcp"]
    }
  }
}`}</code></pre>
		</div>
		<div class="card preset-outlined-surface-700 bg-surface-900 p-5">
			<p class="text-surface-300 mb-2 text-sm font-semibold">3. AIエージェントに話しかける</p>
			<p class="text-surface-400 text-xs">
				「今のプロジェクトの内容を教えて」「この無音区間を削除して」「◯分◯秒にマーカーを付けて」のように指示するだけです。
			</p>
		</div>
	</div>
</section>

<section class="mx-auto max-w-3xl px-6 py-16 text-center">
	<h2 class="text-xl font-bold">パッケージはnpmで公開しています</h2>
	<p class="text-surface-300 mt-3 text-sm">
		<a href="https://www.npmjs.com/package/humming-studio-mcp" class="anchor">humming-studio-mcp</a>
	</p>
	<div class="mt-6 flex flex-wrap justify-center gap-3">
		<a href="/features" class="btn preset-tonal btn-lg">機能一覧に戻る</a>
		<a href="/" class="btn preset-filled-primary-500 btn-lg">トップに戻る</a>
	</div>
</section>
