# Pro測定・レポート：棚卸しとローカル実装

2026-10-19。実API QA・リモートDB変更・デプロイは未実施。
ブランチ: feat/pro-measurement-report。Stripe課金ロジックは変更しない。

## フェーズ0（実装前の状態）

| 項目 | 既存実装 | 不足 |
|---|---|---|
| measurement | worker/aeo-sov.mjs: 業種×地域クエリ生成、PerplexityとOpenAIアダプタ、言及/引用判定、少数サンプルで率をnullにする処理 | 編集可能な永続クエリ、同一クエリN回 |
| 競合 | 回答の引用ドメインを抽出・集計、アグリゲータ除外 | 指定競合、自社とのSoV分母の明示 |
| 推移 | aeo_sov_runs、loadSovHistory、GET /sov | 同一セット/モデル/条件での比較 |
| 正確性 | 言及有無・400文字抜粋、指名質問を率から除外する対照テスト | 誤りの確認状態・レビュー記録 |
| 証跡 | aeo_sov_mentions: クエリ、エンジン、言及/引用フラグ、他社ホスト、抜粋 | 引用URL一覧、サンプル日時・番号、引用順 |
| レポート | worker/aeo-report.mjs、monthly-report API、JSON/HTML/text、dashboard-sov.js | 全セクションをまとめたProレポート |
| コスト/権限 | Proガード、月間200回、1回40回まで、タイムアウト、公開チェッカーキャッシュ | Pro結果キャッシュ、同時実行と課金カウンタの競合防止 |

既存の認証、所有権、プラン判定、measureSov、履歴テーブル、月次レポートは再利用。

## 追加内容

- 0031_pro_measurement.sql: クエリ設定、証跡、サイト単位の実行ロック。schema.sqlにも反映。
- 設定は最大20クエリ、N=1〜3（初期値2）、競合最大10ドメイン。未設定時は既存生成器の先頭5クエリを保存。業種に適さないクエリは測定前に編集する。
- 固定セットのバージョンと内容をrun.detail_jsonにスナップショット保存。過去の設定は書き換えない。
- Pro測定はPerplexityのみ。既存OpenAIアダプタは公開チェッカー等の既存用途に残す。ENGINE_ADAPTERSでエンジン呼び出しを分離。
- URL順はプロバイダの出典一覧順であり、検索順位・回答内のおすすめ順位ではない。本文URLのみの場合、引用順はnull。
- 言及と誤りは分離。抜粋を保存し、未確認はunreviewed。所有者が参照事実/URLをメモしてconfirmed_error / checked_no_obvious_error / uncertainを保存。自動で「正しい」とは判定しない。抜粋外の回答は確認対象に含めない。
- 指定競合と自社について、回答内でそのドメインが引用された回数を比較。同じ回答内の重複は1回。SoV分母は自社＋指定競合の引用回数合計。1回答で複数ドメインが引用されるため、回答数とは異なる。
- 失敗は頻度の分母に入れない。回答2件未満の率・SoVはnull。ギャップは観測上の引用なしを示し、原因を推測しない。
- レポートの推移は設定・ブランドプロフィール・モデル・エンジン条件のSHA-256が一致する履歴のみ（直近52runの範囲）。全履歴・旧履歴は従来APIに残す。旧runに無い証跡を補完しない。
- 同じ条件の成功結果を1時間キャッシュ。条件変更などでキャッシュが使えない再実行は最低60秒間隔。サイト単位ロック30分（最大40回×20秒を超える期間）で重複呼び出しを拒否。月間200回。呼び出し前に枠を予約、正常完了時に未使用分を返却。強制終了時には過剰予約が残るが、過少計上による追加課金を防ぐ。
- run/既存mentions/新証跡をD1 batchで一括保存。新テーブルのmigrationは配布時に必須。
- APIキーはWorkerのsecret binding／ローカル.dev.varsから供給。QAスクリプトは環境変数/.env/.dev.vars対応。キー未設定なら実測せずunconfigured。変動と非保証をレポート・画面に明記。

## API（すべて既存Pro・サイト所有権ガードを使用）

- GET/PUT /api/sites/:id/sov/query-set
- POST /api/sites/:id/sov （既存の測定ルートを拡張、キャッシュ時queries_used=0）
- GET /api/sites/:id/sov/report （統合JSON）
- PUT /api/sites/:id/sov/evidence/:id （正確性確認記録）

PUTは所有者セッション＋既存CSRFが必要。サイトキーは読取のみ。
画面は既存ダッシュボードのPro測定パネルを拡張。固定クエリ編集、測定実行、各レポート節、証跡確認、JSONダウンロード。
既存のmonthly-reportは維持し、統合レポートは/sov/reportを利用する。

## ローカル検証

```sh
npm run test:sov
npm run test:dashboard
npm run test:billing
```

追加テストはネット不要。Node 22.13以降のnode:sqliteを使用（experimental警告あり）。
実SQLiteでmigrationの冪等性、設定、ロック排他、証跡保存、頻度/SoV、条件別推移、レビュー更新・他サイト拒否、キャッシュ、空回答、キー未設定、予算上限を検証。
APIはProガード・CSRF拒否・設定バリデーションも検証。

## 橋本確認・キー設定後のQA

1. この差分とクエリを橋本が確認。ローカル.dev.varsか環境変数にPERPLEXITY_API_KEYを設定（コミット・表示しない）。
2. 上記ローカルテストを実行。
3. 明示的に承認済みの実測を実行する。
   `npm run qa:pro-report -- --live-approved`
4. nurevo.jpを対象に固定2クエリ×2回＝最大4回のPerplexity実API呼び出しを行い、qa/pro-reports/nurevo-*.jsonへ1件出力する。リモートDBは変更しない。失敗は捏造せず証跡に残し、全回答失敗なら終了コード1。
5. JSONの引用元URLと抜粋を人が確認し、Nurevoの説明の明らかな誤りを記録する。呼び出し回数・日時・エンジン・引用順・分母を確認する。
6. ローカルWorkerで画面QAする場合は、既存migration済みローカルnurevo-dbへ0031を適用し、Proのローカルテストサイトと所有者セッションを使用。固定クエリ保存→測定→レポート/JSON→正確性保存を確認。直後の再実行でcached=true・queries_used=0を確認する。
7. 本番migration・secret設定・デプロイは別途橋本の確認後。この作業では行わない。

Perplexity公式ドキュメント確認時点では従来同期SonarリクエストはAgent APIへ再構成されて動作するため、既存接続方式を維持。実測QAで実モデルと引用レスポンスも確認する。
https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar/overview
