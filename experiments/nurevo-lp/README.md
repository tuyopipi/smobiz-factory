# Nurevo LP

Cloudflare Pagesで `nurevo.jp` に置くための軽量な静的LPです。WordPress公式ディレクトリ提出時に参照するサービス説明、導入導線、サイトキー発行フォーム、規約類を含みます。

## 構成

LPは言語ごとの静的ページとしてビルドします。**`public/index.html` と `public/<言語>/index.html` は生成物なので直接編集しません。**

- `src/lp.html`: LP本体のテンプレート（日本語のマークアップ。`data-i18n` で辞書のキーを指す）
- `src/i18n.mjs`: 全文言の辞書（8言語）。日本語が正で、変えたら他の7言語も合わせる
- `src/site.mjs`: head・JSON-LD・sitemap・llms.txt に出す事実（会社情報、料金、言語とURL）
- `src/content/*.mjs`: コンテンツページの枠。本文が全部入った言語だけが公開される
- `src/lp.js` / `src/ai-referral.js`: ページのスクリプト／AI検索からの流入を数えるビーコン
- `scripts/build-site.mjs`: 上記から `public/` を生成（各言語のLP、`sitemap-pages.xml`、`llms-pages.json`、手書きページのheadブロック）
- `scripts/check-seo.mjs`: 生成物の検査（h1、canonical、hreflangの相互参照、JSON-LDがページ本文と一致するか）
- `public/check/` `public/partner/` `public/guide/` `public/*.html`: 手書きのページ。`<!-- seo:generated … -->` の間だけビルドが書き換える

```bash
npm run build            # src/ を変えたら必ず実行
npm run check            # 生成物が最新か＋SEO/構造化データの検査
npm run preview:drafts   # 未完成のコンテンツページを noindex で確認（デプロイされない .preview/ に出力）
npm run deploy           # check を通してから Pages へ
```

`/robots.txt` `/sitemap.xml` `/llms.txt` は `experiments/webmcp-canary` のワーカーが配信します（`worker/site-seo.mjs`）。`/sitemap.xml` は `sitemap-pages.xml`（このビルド）と `sitemap-stores.xml`（ホスト店舗）のインデックスです。

規約類は雛形です。公開前に必ず法的レビューを行ってください。

## ローカル確認

```bash
cd /Users/apple/smobiz-factory/experiments/nurevo-lp
npm run check
npm run preview
```

表示されたローカルURLをブラウザで開きます。

## Worker URLの設定

先に `experiments/webmcp-canary` のCloudflare Workerをデプロイし、公開URLを控えます。

例:

```text
https://webmcp-canary.YOUR_SUBDOMAIN.workers.dev
```

`public/config.js` を次のように変更します。

```js
window.NUREVO_CONFIG = {
  apiBase: "https://webmcp-canary.YOUR_SUBDOMAIN.workers.dev",
  tagUrl: "https://webmcp-canary.YOUR_SUBDOMAIN.workers.dev/tag.js",
  wpPluginUrl: "#wordpress",
  docsUrl: "#developers"
};
```

WordPress公式ディレクトリの審査後、`wpPluginUrl` を実際のプラグインURLへ差し替えます。

## Cloudflare Pagesへデプロイ

Cloudflare Pagesを選ぶ理由:

- 静的LPを無料枠で配信できる
- HTTPSが標準で有効
- `nurevo.jp` のカスタムドメイン設定が簡単
- Worker APIとは分離しつつ、同じCloudflare上で運用できる

初回のみWranglerでログインします。

```bash
cd /Users/apple/smobiz-factory/experiments/nurevo-lp
npx wrangler@latest login
```

Pagesへデプロイします。

```bash
npm run deploy
```

初回デプロイ後、Cloudflare Dashboardで次を設定します。

1. `Workers & Pages` を開く
2. `nurevo-jp` Pagesプロジェクトを開く
3. `Custom domains` を開く
4. `Set up a custom domain` を押す
5. `nurevo.jp` を入力
6. Cloudflareの指示に従ってDNSを設定

`nurevo.jp` をCloudflare管理のゾーンにしている場合は、必要なDNSレコードが自動作成されます。別DNSを使っている場合は、Cloudflareの案内に従ってCNAMEまたはネームサーバー設定を行います。

## サイトキー発行の確認

1. `public/config.js` の `apiBase` が公開Worker URLになっていることを確認
2. LPの「サイトキーを発行」フォームにサイトURLとメールアドレスを入力
3. `nrv_...` 形式のサイトキーと貼り付け用スニペットが表示されることを確認

発行APIは `POST /api/site-key` を使います。Worker側では、発行済みキーをD1の `site_keys` テーブルに保存し、`/api/agent-authorization` と `/api/site-insights` で認証対象にします。

## WordPressプラグイン設定に入れるURL

Workerの公開URLが次の場合:

```text
https://webmcp-canary.YOUR_SUBDOMAIN.workers.dev
```

WordPressプラグインの設定画面には次を入力します。

```text
Tag URL: https://webmcp-canary.YOUR_SUBDOMAIN.workers.dev/tag.js
Site Key: LPで発行された nrv_... のキー
```

LPで発行されたスニペットをGTMに貼る場合も同じ `tag.js` URLを使います。

## データ方針

保存するもの:

- フォーム構造
- 実行の成否
- エラーの種類
- 完了ステップ数
- 所要時間
- フォーム構造ハッシュ
- A/Bテストの配信結果と集計

保存しないもの:

- 氏名
- 電話番号
- メールアドレス
- 住所
- 会社名
- その他、フォームに入力された値そのもの

エラーメッセージは保存前に、メールアドレス形式を `[EMAIL]` に、3桁以上の数字列を `[NUM]` にマスクします。保存先はCloudflare D1/KVです。

## 詰まりやすい点

- サイトキー発行フォームで `config.js の apiBase を公開Worker URLに変更してください` と出る  
  `public/config.js` の `apiBase` が初期値のままです。

- CORSエラーが出る  
  `experiments/webmcp-canary` のWorkerでCORSヘッダーが返っているか、`WEBMCP_ALLOWED_ORIGINS` を絞りすぎていないか確認します。

- `nurevo.jp` が表示されない  
  PagesのCustom domainsに `nurevo.jp` が追加済みか、DNSがCloudflareの指示通りになっているか確認します。
