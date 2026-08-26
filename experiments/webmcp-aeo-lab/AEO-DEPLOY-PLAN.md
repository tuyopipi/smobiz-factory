# AEO 本番反映手順書

対象: `webmcp-aeo-lab` で開発・審査した AEO 機能を `webmcp-canary`（本番）へ反映する。

> **実施条件:** 審査通過後にのみ実行すること。この文書作成時点では deploy、D1 操作、secret 変更は行っていない。

## 0. 最重要事項

- 作業ディレクトリ:
  - ラボ: `/Users/tsuyoshi/smobiz-factory/experiments/webmcp-aeo-lab`
  - 本番: `/Users/tsuyoshi/smobiz-factory/experiments/webmcp-canary`
- 反映対象は次の 3 ファイルだけ。
  1. `worker/index.mjs`
  2. `public/tag.js`
  3. `wordpress-plugin/webmcp-canary/webmcp-canary.php`
- `qa/` は本番へ反映しない。
- `migrations/` は反映しない。ラボと本番で `0001`〜`0006` の内容が完全一致しており、AEO 用の D1 スキーマ変更はない。
- ラボの `wrangler.jsonc` を本番へコピーしない。差分は Worker 名だけだが、コピーすると本番名が `webmcp-aeo-lab` になる。
- ラボと本番の `wrangler.jsonc` は、KV namespace ID と D1 database ID が同一。ラボからの実行でも本番データへ接続し得るため、検証中を含め D1 操作を安易に実行しない。
- 本番側には既存の未コミット変更が存在する可能性がある。ファイルを上書きする前に必ず `git status` と個別 diff を確認し、既存変更を失わないこと。

## 1. 反映するファイルと変更内容

### 1.1 `worker/index.mjs`

#### 追加エンドポイント

| メソッド | パス | 機能 |
|---|---|---|
| `GET` | `/api/llms.txt` | 登録済みフォーム情報から `llms.txt` を生成する |
| `POST` | `/api/page-meta` | ページメタデータをサニタイズして KV に保存する |
| `GET` | `/api/org-schema` | Organization JSON-LD を生成・返却する |
| `GET` | `/api/faq-schema` | FAQPage JSON-LD を生成・返却する |
| `GET` | `/api/article-schema` | BlogPosting JSON-LD を生成・返却する |
| `GET` | `/api/aeo-schemas` | Organization、FAQ、Article を並列処理し、まとめて返却する |

全エンドポイントの基本条件:

- `site_key` と `host` が必要。
- site key が active であること。
- 指定 host が site key の登録 host と一致すること。
- AEO エンドポイントは Pro プラン限定。対象外は情報を露出せず `404` を返す。
- schema 系は、対象ページのデータが先に `/api/page-meta` へ保存されている必要がある。

#### 追加関数

- `generateLlmsTxt`
- `loadLlmsSiteMetadata`
- `llmsText`
- `authorizeSiteKeyHost`
- `storePageMeta`
- `organizationSchemaForPage`
- `extractOrganizationWithOpenAI`
- `faqSchemaForPage`
- `extractFaqWithOpenAI`
- `buildFaqSchema`
- `articleSchemaForPage`
- `extractArticleWithOpenAI`
- `buildArticleSchema`
- `validIso8601`
- `buildOrganizationSchema`
- `validHttpUrl`
- `isSha256Hex`
- `stableJson`
- `sanitizePagePathname`
- `sanitizePageMeta`
- `sanitizeJsonLd`
- `piiSafeText`
- `limitText`
- `truncateUtf8`
- `redactPii`

#### 保存先と TTL

| データ | KV key | TTL |
|---|---|---|
| page metadata | `page-meta:{siteKeyHash}:{pathnameHash}` | 7 日 |
| Organization schema | `org-schema:{siteKeyHash}:{contentHash}` | 30 日 |
| FAQ schema | `faq-schema:{siteKeyHash}:{contentHash}` | 30 日 |
| Article schema | `article-schema:{siteKeyHash}:{contentHash}` | 30 日 |

page metadata は保存前に件数・長さ・JSON-LD 合計 10 KB の制限を受け、メールアドレスと電話番号らしい文字列がマスクされる。site key は KV key 内で SHA-256 化される。

`/api/llms.txt` は既存 D1 のサイト・フォーム情報を読み取る。D1 binding がない場合は KV の footprint を利用する。AEO 用の D1 書き込みや新規テーブルはない。

#### `site-insights` 認可

従来から存在した「セッション所有者、管理者トークン、または active な site key と登録 host の一致」という要件は維持される。ラボ版では site key と host の照合を `authorizeSiteKeyHost()` に共通化し、AEO API からも利用する。認可要件の緩和ではない。

### 1.2 `public/tag.js`

追加処理:

- `collectPageMeta`
  - title、meta description、OGP、canonical URL、HTML lang、h1〜h3、既存 JSON-LD を収集する。
- `sendPageMeta`
  - `/api/page-meta` へページ情報を送信する。
- `fetchAndApplyAeoContentSchemas`
  - `/api/aeo-schemas` から JSON-LD を取得する。
- `applyAeoContentSchemas`
  - `script#webmcp-aeo-content[type="application/ld+json"]` を `head` へ追加する。
  - 複数 schema は `@graph` にまとめる。
  - schema 配列を `window.__webmcpAeoContent` にも格納する。
- `truncateUtf8`
  - 収集 JSON-LD のバイト上限を制御する。

実行順:

1. 認可状態を確認する。
2. `auth.registered === true && auth.quality === "high"` の場合だけ page metadata を送信する。
3. page metadata 保存完了後、AEO schema を取得・反映する。
4. 従来の WebMCP tools を登録する。
5. footprint listener を設定する。

`TAG_VERSION` は `2026-07-23.1` から `2026-08-20.2` へ更新される。

### 1.3 WordPress プラグイン

対象: `wordpress-plugin/webmcp-canary/webmcp-canary.php`

追加機能:

- `allow_ai_crawlers` 設定（デフォルト有効）
  - WordPress の仮想 `robots.txt` に主要 AI crawler の `Allow: /` を追記する。
  - 対象: GPTBot、OAI-SearchBot、ChatGPT-User、ClaudeBot、anthropic-ai、PerplexityBot、Google-Extended、CCBot、Applebot-Extended。
  - WebMCP tag が有効で、WordPress が検索エンジン公開状態の場合だけ適用する。
- `serve_llms_txt` 設定（デフォルト有効）
  - サイトの `/llms.txt` へのアクセスを受け、Worker の `/api/llms.txt` を取得して `text/plain` で返す。
  - timeout は 10 秒、最大応答サイズは 256 KB。
  - Worker が失敗、空応答、サイズ超過の場合は割り込まず通常の WordPress 処理へ戻る。
- 管理画面へ上記 2 項目を追加する。

既存設定に新しいキーがなくてもデフォルト値との merge により有効になる。既に WebMCP tag が有効なサイトでは、プラグイン更新直後から robots.txt と llms.txt が有効になり得るため、公開方針を事前確認すること。

WordPress の `robots_txt` filter を使うため、ドキュメントルートに物理的な `robots.txt` があるサイトでは反映されない可能性がある。

## 2. 反映しないもの

### `migrations/`

反映しない。ラボと本番の次のファイルはファイル名・内容・SHA-256 が一致している。

- `0001_init.sql`
- `0002_site_keys.sql`
- `0003_site_key_management.sql`
- `0004_learned_rules.sql`
- `0005_site_keys_email.sql`
- `0006_stripe_webhook_events.sql`

AEO の page metadata と生成 schema は KV 保存であり、新規テーブル、列、index はない。このリリースでは `wrangler d1 migrations apply` を実行しない。

### `qa/`

テスト用 HTML・スクリプト等であり、本番配布物ではないため反映しない。

### `wrangler.jsonc`

反映しない。ラボと本番の差は `name` だけで、本番では `"name": "webmcp-canary"` を維持する。KV、D1、vars、assets、cron の設定差はない。

## 3. 反映前チェック

以下をすべて完了してから作業する。

- [ ] AEO 機能が審査を通過している。
- [ ] 本番ディレクトリで `git status --short` を確認した。
- [ ] 対象 3 ファイルの本番側未コミット変更を確認・保全した。
- [ ] AEO 反映直前のコミットまたはタグを作成した。
- [ ] 現行 Cloudflare Worker の deployment/version ID を記録した。
- [ ] 現行 WordPress プラグインの zip またはディレクトリを保存した。
- [ ] 本番 Worker の secret 名一覧に `OPENAI_API_KEY` があることを確認した。値は表示・記録しない。
- [ ] `OPENAI_MODEL` が意図した `gpt-4.1-mini` であることを確認した。
- [ ] 通常の OpenAI endpoint を使う場合、`OPENAI_API_URL` は追加不要であることを確認した。
- [ ] OpenAI 互換 endpoint を使う場合のみ `OPENAI_API_URL` を設定した。
- [ ] `WEBMCP_KV` と `WEBMCP_DB` の binding が本番設定に存在することを確認した。
- [ ] robots.txt が WordPress 仮想配信か、物理ファイルか確認した。
- [ ] AI crawler 許可と `/llms.txt` をデフォルト有効にしてよいか確認した。
- [ ] Free と Pro の両方の動作確認用 site key と登録 host を用意した。

参考となる読み取り確認コマンド:

```sh
cd /Users/tsuyoshi/smobiz-factory/experiments/webmcp-canary
git status --short
npx wrangler secret list --name webmcp-canary
```

secret 一覧には Cloudflare 認証が必要。値を取得・出力しないこと。

## 4. 本番反映手順

### Step 1: 直前差分を固定する

現在のラボと本番を再比較し、対象 3 ファイル以外を反映しないことを確認する。

```sh
cd /Users/tsuyoshi/smobiz-factory/experiments
diff -u webmcp-canary/worker/index.mjs webmcp-aeo-lab/worker/index.mjs
diff -u webmcp-canary/public/tag.js webmcp-aeo-lab/public/tag.js
diff -u webmcp-canary/wordpress-plugin/webmcp-canary/webmcp-canary.php webmcp-aeo-lab/wordpress-plugin/webmcp-canary/webmcp-canary.php
diff -ru webmcp-canary/migrations webmcp-aeo-lab/migrations
diff -u webmcp-canary/wrangler.jsonc webmcp-aeo-lab/wrangler.jsonc
```

想定外の差分があれば中止し、審査対象との差を再確認する。

### Step 2: Worker コードを反映する

最初に `worker/index.mjs` だけを本番へ反映する。古い tag.js とプラグインは新 API を呼ばないため、Worker を先行させる。

単純上書きではなく、本番側の既存変更を確認したうえで、審査済み差分を merge する。反映後に次を確認する。

```sh
cd /Users/tsuyoshi/smobiz-factory/experiments/webmcp-canary
git diff -- worker/index.mjs
```

本番の `wrangler.jsonc` が `"name": "webmcp-canary"` のままであることを再確認し、既存のプロジェクト標準テストを実行する。その後、通常の本番 Worker リリース手順で deploy する。

### Step 3: Worker API を先行確認する

本番 tag.js を更新する前に、実 site key と登録 host を用いて新 API を確認する。

- 正常な Pro site key + 一致 host が通る。
- 不正 site key が `403`。
- host 不一致が `403`。
- Free site key が `404`。
- `/api/page-meta` が `200` を返す。
- page metadata 保存後に `/api/aeo-schemas` が schema 配列を返す。
- `/api/org-schema`、`/api/faq-schema`、`/api/article-schema` が内容に応じた応答を返す。
- `/api/llms.txt` が `text/plain` を返す。
- 既存 `/api/site-insights` のセッション、管理者、site key + host 認可が維持される。

ここで異常があれば tag.js とプラグインへ進まず、Worker をロールバックする。

### Step 4: `public/tag.js` を反映する

`public/tag.js` の審査済み差分を本番へ merge し、通常の本番リリース手順で assets を反映する。

確認事項:

- `TAG_VERSION` が `2026-08-20.2`。
- Pro サイトで page-meta と schema API が呼ばれる。
- Free サイトでは AEO API が呼ばれない。
- 従来の WebMCP tool 登録と footprint が継続する。

### Step 5: WordPress プラグインを反映する

最後に `wordpress-plugin/webmcp-canary/webmcp-canary.php` の審査済み差分を本番プラグインへ反映する。

プラグイン更新前に、対象サイトごとに以下を決める。

- AI crawler を許可するか。
- `/llms.txt` を公開するか。
- 物理 `robots.txt` が存在する場合、別途同等設定が必要か。

更新後、管理画面で新しい 2 設定を保存し、期待する有効・無効状態を明示的に確定する。

## 5. 反映後の動作確認（11 項目）

1. **既存 WebMCP tool 登録**  
   対象フォームが従来どおり tool として登録され、送信動作を妨げない。

2. **footprint 送信**  
   成功、失敗、abandoned 等の既存イベント送信が継続する。

3. **site-insights 認可**  
   セッション所有者、管理者トークン、正しい site key + host は成功し、不正 key・host 不一致は拒否される。

4. **Pro / Free 制御**  
   Pro のみ AEO が有効で、Free では AEO API が `404` となり情報を露出しない。

5. **page-meta と PII マスク**  
   title、description、OGP、canonical、lang、見出し、JSON-LD が保存対象となり、メール・電話番号らしい文字列がマスクされる。

6. **Organization / FAQ / Article schema**  
   ページ内容に対応した正しい JSON-LD が生成され、存在しない情報を推測して追加しない。

7. **schema がないページ**  
   FAQ や記事ではないページで誤 schema を生成せず、空 schema を安全に処理する。

8. **`/llms.txt`**  
   Pro サイトで `text/plain; charset=utf-8` の内容が返り、設定無効・Worker 失敗時の挙動も正常。

9. **`/robots.txt`**  
   設定有効時のみ AI crawler ルールが重複なく追加され、既存 robots ルールを失わない。

10. **障害時の既存機能継続**  
    OpenAI API や AEO API が失敗しても、ページ表示、既存フォーム、WebMCP tools、認証、決済が継続する。

11. **ログ・キャッシュ・呼び出し回数**  
    Worker ログに継続的な `500`、KV エラー、認可異常がなく、content hash cache により同一内容で OpenAI 呼び出しが繰り返されない。

追加のブラウザ確認:

- `head` に `script#webmcp-aeo-content` が 1 個だけ存在する。
- 複数 schema は `@graph` として妥当な JSON になっている。
- `window.__webmcpAeoContent` に期待する配列が入る。
- フォームがないページでも JavaScript エラーにならない。

## 6. ロールバック手順

問題が起きた場合は利用者側に近い層から逆順で戻す。

1. **WordPress プラグインを旧版へ戻す**
   - 保存済み zip またはディレクトリから復元する。
   - `/robots.txt` と `/llms.txt` が旧挙動へ戻ったことを確認する。
2. **`public/tag.js` を旧版へ戻す**
   - AEO の page-meta 送信と schema 挿入を止める。
   - CDN・ブラウザキャッシュを必要に応じて purge する。
   - 従来の WebMCP tool 登録を確認する。
3. **Worker を直前 version へ戻す**
   - 事前に記録した deployment/version ID を指定して Cloudflare の標準 rollback 手順を実施する。
   - 既存 API、認可、認証、決済を再確認する。
4. **監視する**
   - Worker ログ、WordPress エラー、ブラウザ Console、主要 API の応答を確認する。

D1 の変更はないため、down migration やデータ復元は不要。AEO が KV に保存した page metadata と schema cache は TTL で自然消滅し、旧 Worker/tag.js から参照されない。緊急ロールバックで KV 削除は原則不要であり、安易に削除しない。

## 7. 既存機能への副作用と注意点

### WebMCP

- AEO 処理は認可後、従来の `registerTools()` より前に実行される。
- Pro サイトでは初回表示時に `/api/page-meta` と `/api/aeo-schemas` の追加通信が発生する。
- schema 初回生成では Organization、FAQ、Article の最大 3 OpenAI 呼び出しが並列発生し、tools 登録開始が遅れる可能性がある。
- AEO 処理自体は catch されるため、失敗後も原則として従来の tool 登録へ進む。
- 従来は対象フォームがないページで認可 API を呼ばなかったが、新版は boot 直後に認可確認するため、フォームなしページでも認可通信が発生する。

### OpenAI・キャッシュ

- `/api/aeo-schemas` は `Promise.all()` のため、1 種類の生成が例外になると応答全体が失敗する可能性がある。
- 同一 content hash は 30 日キャッシュされ、通常は毎回 OpenAI を呼ばない。
- `OPENAI_API_KEY` がない場合、schema 生成は `412 OPENAI_API_KEY_MISSING` となる。

### 認可

- `site-insights` の site key + host 照合は新規導入ではなく、既存処理の共通化。
- AEO API も active site key、登録 host 一致、Pro 判定を要求する。
- 認可を緩和する差分は確認されていない。

### 決済・認証

- Stripe checkout、webhook、site key plan 更新、メール認証のコードに AEO 固有の変更はない。
- ただし同じ Worker ファイルを反映するため、反映後スモークテストでは認証と決済 webhook の既存経路も確認する。
- D1 schema 変更がないため、AEO 反映による決済テーブル変更はない。

### WordPress

- 新設定は既存サイトでもデフォルト有効として merge される。
- `/llms.txt` は WordPress リクエスト時に Worker へ同期 HTTP リクエストを行う。Worker 不調時は最大 10 秒待つ可能性がある。
- robots.txt の Allow 追記がサイトのAI crawler方針と一致することを必ず確認する。

## 完了条件

次のすべてを満たした時点で本番反映完了とする。

- 対象 3 ファイルだけが意図どおり反映されている。
- 本番 Worker 名と binding が変更されていない。
- D1 migration を実行していない。
- 11 項目の動作確認が完了している。
- WebMCP、footprint、site-insights、認証、決済に回帰がない。
- `/robots.txt` と `/llms.txt` が運用方針どおりである。
- ロールバック用 version と旧プラグインを保持している。
