# Nurevo LP

Cloudflare Pagesで `nurevo.jp` に置くための軽量な静的LPです。WordPress公式ディレクトリ提出時に参照するサービス説明、導入導線、サイトキー発行フォーム、規約類を含みます。

## 構成

- `public/index.html`: LP本体
- `public/privacy.html`: プライバシーポリシー雛形
- `public/terms.html`: 利用規約雛形
- `public/tokushoho.html`: 特定商取引法に基づく表記雛形
- `public/config.js`: 公開Worker URL、tag.js URL、WordPressプラグインURLの設定
- `public/assets/app.js`: i18n、タブ、コピー、サイトキー発行フォーム
- `public/assets/styles.css`: レスポンシブCSS

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
