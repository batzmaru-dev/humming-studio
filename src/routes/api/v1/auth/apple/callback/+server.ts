export const prerender = false;

/**
 * Mac版(ASWebAuthenticationSession)からの Sign In with Apple 用コールバック。
 *
 * ネイティブアプリはプロビジョニングプロファイルの制約で Sign In with Apple の
 * entitlement を使えない(Developer ID 配布のため)。代わりに Web 版の
 * Sign In with Apple(Services ID)でブラウザ認証させ、ここへ返ってきた
 * id_token をアプリ用カスタム URL スキーム(podblock://)へリレーする。
 *
 * response_mode=form_post(クロスオリジン POST)は ASWebAuthenticationSession の
 * WebKit がプライバシー保護のためブロックする("Cross-site POST form submissions
 * are forbidden")。そのため response_mode=fragment を使い、Apple からは通常の
 * GET ナビゲーション(#id_token=... というURLフラグメント付き)で戻ってくる。
 * フラグメントはサーバーには送信されないため、ここは素の HTML+JS を返し、
 * クライアント側で location.hash を読んでリレーする。
 */
export function GET() {
	const html = `<!doctype html>
<html lang="ja">
<head><meta charset="utf-8"><title>サインイン中…</title></head>
<body>
<p id="msg">サインインを完了しています…</p>
<script>
  var params = new URLSearchParams(location.hash.replace(/^#/, ''));
  var idToken = params.get('id_token');
  if (idToken) {
    var callback = new URL('podblock://auth-callback');
    callback.searchParams.set('identityToken', idToken);
    location.href = callback.toString();
  } else {
    document.getElementById('msg').textContent = 'サインインに失敗しました。アプリに戻ってやり直してください。';
  }
</script>
</body>
</html>`;
	return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
