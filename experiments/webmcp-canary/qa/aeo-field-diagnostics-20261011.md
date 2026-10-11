# AEO診断の項目表示改修（2026-10-11）

## 調査結果（変更前のHEAD）

- `aeo-score.mjs` の基本判定は name / url / address / telephone / openingHours / geo の固定セット。業種の schema 型は認識していたが、44業種に応じてプロパティセットを切り替える処理はなかった。
- 登録サイトでは active ruleset の `scoredProps` が渡されていたが、Product/Offer の price / priceCurrency / availability / brand / sku 等の専用判定はなかった。
- migration 0024 の商品・サービス・FAQ・ページは同期とダッシュボード表示に使われていたが、AEO診断には渡されていなかった。
- 作業開始時に今回の改修に関する未コミット変更があったため、内容を確認して補完した。`backups/` はコミット対象外。

## 変更後

- `schema.entityFields` に業種別の診断項目を定義し、従来の `schema.fields` / `scoredProps` との互換性も維持。無効な項目は表示しない。weight 指定にも対応。
- 公開JSON-LD、登録サイトの entityType、catalog の商品・サービス、WooCommerce の痕跡から診断対象を選ぶ。物販は Product 内の offers.price / priceCurrency / availability を必ず診断する。
- catalog は対象業種を選ぶ根拠として使い、未公開の商品情報を「充足」として数えない。FAQ・pages は読み込むが、登録だけでFAQPageやArticleを充足扱いにしない。一般ページ一覧からArticleを推測しない。
- 共通の WebSite / FAQPage / Organization 項目も診断する。診断対象URLのraw HTMLに公開されたJSON-LDのみを評価し、商品詳細など別URLのクロールは追加していない。
- `checks[].fields` と `structuredData.fields` に entityType / field / label / present / weight / description / howTo を返す。複数の同種エンティティがある場合は全件の充足を要求する。
- 構造化データと重要情報の網羅は同じ項目・充足数・判定を使う。JSON-LDの不正や型不一致がある場合も判定を揃える。
- ダッシュボード、WordPress管理画面、公開 `/check` で ✓/✗ と充足数を表示。欠け項目には意味と設定方法を表示。Nurevoに専用入力欄がない項目はその旨を明示。
- ラベル・項目の意味・設定案内・本文改善ヒントは ja / en / zh / zh-TW / ko / es / fr / de に対応。
- 本文の機械可読性には本文への名称・説明の明記、見出し・FAQの追加を案内。
- 診断モデルを u1-v3 に更新。公開診断のキャッシュキーにルール定義のハッシュを含め、ルール変更時に旧結果を再利用しない。

## 変更ファイル

`experiments/webmcp-canary/`:

- worker/aeo-fields.mjs
- worker/aeo-score.mjs
- worker/api.mjs
- worker/diagnose.mjs
- public/dashboard-aeo-metrics.js
- wordpress-plugin/webmcp-canary/nurevo-webmcp.php
- package.json
- scripts/test-aeo-fields.mjs
- scripts/test-aeo-fields-browser.mjs
- scripts/test-aeo-score.mjs
- scripts/test-aeo-endpoints.mjs
- scripts/test-aeo-check-lang.mjs
- scripts/test-plan-tiers.mjs
- scripts/test-wordpress-aeo-admin.php
- qa/aeo-field-diagnostics-20261011.md

`experiments/nurevo-lp/`:

- public/check/index.html
- scripts/check-aeo-checker.mjs

## 検証

- nurevo-lp: `npm run check`、`npm run check:aeo` 成功。
- webmcp-canary: `npm run test:aeo-score`、`npm run test:dashboard`、`npm run test:wp-aeo-admin` 成功。
- PHP構文チェック成功。
- `AEO_BROWSER_CHANNEL=chrome node scripts/test-aeo-fields-browser.mjs` 成功。ダッシュボードと `/check` の画面を模擬APIで実際に描画し、Productの✓/✗、価格・通貨・在庫項目を確認。
- 商品catalogを持つ登録サイトのAPIテストでProduct項目が選ばれ、非公開情報は欠け扱いになることを確認。
- 8言語で項目ラベル・意味・設定案内と判定の維持を確認。
- 本番 `https://nurevo.jp/check/` と公開 `/api/aeo/score?url=https%3A%2F%2Fnurevo.jp&lang=ja` はHTTP 200。診断APIは8チェックを返すが、現在の本番には項目表示改修は未反映。デプロイは実施していない。
- 本番シークレット・課金処理の変更なし。
