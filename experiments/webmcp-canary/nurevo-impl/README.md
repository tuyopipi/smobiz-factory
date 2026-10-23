# Nurevo 実装パッケージ — タグ⇄ダッシュボード連携 ＋ AIクローラー8種

タグ・ダッシュボード・バックエンドを「サイトキー1本」で結ぶ最小実装。
スタック: Cloudflare Workers(webmcp-canary) + D1 + Pages / wrangler。
方針: canary で検証 → 本番反映。

## ファイル
```
shared/ai-crawlers.js            対応AIクローラー8種（唯一の正）＋ robots/llms 生成・検知
db/schema.sql                    D1 スキーマ（sites が稼働スイッチ）
worker/agent-authorization.mjs   ★稼働スイッチ：env許可リスト → D1参照 ＋ last_seen更新
worker/api.mjs                   /api/sites 登録・一覧(4指標)・設定保存・/api/tag/config
tag/tag.js                       客先に貼る1行タグ（設定取得＋schema注入＋ハートビート）
wordpress/nurevo-webmcp.php      サーバー側でschema/robots/llms出力（非JSクローラーに確実に届く・推奨）
```

## 何と何が「結びつく」か
```
[ダッシュボード] URL登録 ──POST /api/sites──▶ D1 sites に site_key を発行(status=pending)
        │                                          = 稼働スイッチON
        ▼
[客先サイトのタグ/プラグイン] site_key を名乗る
        │  tag.js  ─GET /api/tag/config?k=KEY─▶ worker
        │  WPプラグイン ─同上（サーバー側）─────▶ worker
        ▼
[worker] authorizeSiteKey(): D1でキー照合 →
        ・登録あり → last_seen更新・status=active（＝設置検証）
        ・store情報から JSON-LD を返す（タグが注入）
        ▼
[ダッシュボード] GET /api/sites → 4指標を表示
```
サイトキーが「発行(ダッシュボード)」→「名乗る(タグ)」→「照合(worker)」で一致することが紐づけ。

## ダッシュボードの4指標がどこから来るか（全て確実に取れる実測値）
| 指標 | ソース | 実装 |
|---|---|---|
| 稼働 (last_seen) | タグのハートビート | `authorizeSiteKey()` が毎回 `last_seen_at` を更新。24hで途切れたら error |
| schema出力（種類数） | 出力中の JSON-LD type 数 | `PUT /api/sites/:id` の `countSchemaTypes()`。serve_schema=OFFなら0 |
| クローラー許可（○×） | llms.txt / robots の設定 | `site_settings.allow_crawlers`。WPプラグインが8種をrobots/llmsに出力 |
| 情報充足率（n/7） | 店舗情報の入力状況 | `completeness()`（name/tel/address/hours/geo/image/reserve） |

## 対応AIクローラー 8種（`shared/ai-crawlers.js`）
1. **GPTBot** — OpenAI（学習・インデックス）
2. **OAI-SearchBot** — OpenAI（ChatGPT検索）
3. **ChatGPT-User** — OpenAI（ユーザー操作ブラウズ）
4. **ClaudeBot** — Anthropic（Claude）
5. **PerplexityBot** — Perplexity
6. **Google-Extended** — Google（Gemini / AI Overviews）
7. **Applebot-Extended** — Apple（Apple Intelligence）
8. **Bytespider** — ByteDance（Doubao 等）

追加・削除は `ai-crawlers.js` の配列と `nurevo-webmcp.php` の `NUREVO_AI_CRAWLERS` を揃えるだけ。

## 正直な限界（設計に反映済み）
- **JSタグの schema 注入はベストエフォート**。JSを実行しないクローラーには届かない。
  確実に届けるなら **WordPressプラグイン（サーバー側出力）を推奨**。
- **robots.txt / llms.txt は JS で作れない**（ドメイン直下ファイル）。クローラー許可は
  プラグイン or サーバー側で行う。タグ経路では「許可設定」は保存するが配信はしない。
- **AIクローラーの実アクセス数**は tag.js では取れない（クローラーはJSを走らせない）。
  サーバー/CDNログ or WPプラグインの `matchCrawler` 集計が要る → `crawler_hits` に日次投入。今回は枠のみ。

## デプロイ手順（canary → 本番）
```bash
# 1) D1 作成 & スキーマ
wrangler d1 create nurevo-db
wrangler d1 execute nurevo-db --file=db/schema.sql

# 2) worker に DB バインド（wrangler.toml）
#   [[d1_databases]]
#   binding = "DB"; database_name = "nurevo-db"; database_id = "..."

# 3) ルーティング：既存 index.mjs から handleApi() を呼ぶ
#   import { handleApi } from "./worker/api.mjs";
#   const res = await handleApi(request, env); if (res) return res;

# 4) agent-authorization を D1版に差し替え（env許可リストを廃止）

# 5) tag.js を Pages(nurevo) に配置 → https://nurevo.jp/tag.js
```

## 受け入れ条件（Codexに1タスクずつ）
- **T-auth**: 未登録キー=basic / 登録キー(pro)=high / 呼ぶ度に last_seen 更新・active化
- **T-sites**: `POST /api/sites` でキー発行＆INSERT(pending) / `GET /api/sites` が4指標を返す
- **T-tag**: `tag.js` 設置後、`/api/tag/config` が叩かれ、ダッシュボードで「稼働中」表示
- **T-crawlers**: WPプラグイン有効化で robots.txt に8種の Allow、`/llms.txt` が8種を列挙
- **T-schema**: 情報を埋めると schema_types が増え、詳細の JSON-LD に反映
