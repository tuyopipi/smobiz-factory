# Nurevo server-side integration kit

PHP / Node.js / Next.js のサーバー生成HTMLに、サイトキーで取得したJSON-LDを出力するサンプルです。既存のJSON-LDとの自動統合・重複除去はしません。公開前に既存出力との整合性を確認してください。AIによる取得・推薦を保証するものではありません。

- PHP: `php/nurevo-aeo.php` を配置し、head 内で `nurevo_render_jsonld('nrv_サイトキー');` を呼びます。
- Node.js 18+: `node/nurevo-aeo.js` の `nurevoJsonLdTag`（CommonJS）を await して head 内に出力します。ESMプロジェクトでは .cjs に改名する等、モジュール方式に合わせてください。Expressでは `nurevoMiddleware` も利用できます。
- Next.js App Router: `nextjs/nurevo.ts` の `getNurevoJsonLd` をServer Componentで呼び、値があれば `JSON.stringify(ld).replace(/</g, '\\u003c')` を script[type="application/ld+json"] 内に出力します。ファイル内に描画例があります。クライアント専用Reactへの貼付だけではサーバーHTMLにはなりません。
- `static/robots.txt` は参考例です。既存のrobots.txtを上書きせず、管理者が意図するアクセス制御と照合してから必要箇所を取り込んでください。CDN側の制限も別途確認します。

取得先: `GET https://nurevo.jp/api/tag/config?k=<siteKey>`。
応答の `ok` と `jsonld` を利用します。`crawlerAllowed` を参照して出力を制御する実装ではありません。

キャッシュ: PHPは600秒、Node.jsは600000ミリ秒が既定。失敗時は手元の期限切れキャッシュを使い、無ければ出力しません。Next.js版は `revalidate: 600` を指定し、取得失敗時はnullを返します。再検証やCDNの挙動は導入環境で確認が必要です。最大10分の更新保証ではありません。

確認: ブラウザの「ページのソースを表示」でJSON-LDを確認し、既存schemaとの重複や矛盾、API障害時、キャッシュ期限後をテストしてください。Next.jsの実アプリでの動作は利用バージョンごとに検証が必要です。
