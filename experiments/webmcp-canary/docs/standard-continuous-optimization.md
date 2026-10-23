# Standard継続自動最適化：実装・検証・反映手順

2026-10-20。作業ブランチ `feat/standard-continuous-optimization`。本番への接続・SQL適用・公開・pushは実施していない。

## A. 中央ルールセット版を単一情報源に

- `aeo_rulesets.definition_json` に `scoring` と `generation` を追加。重み、ステータス係数、閾値、本文判定の長さ・パターン、採点対象型、クローラー一覧を版に含める。
- `generation.properties` を共通インタプリタで生成。ホスト型・tag/config・WPの事業者schemaが同じ中央テンプレートを使用。WPの同期前の実データ・ロゴは保持し、中央profileと不一致なら配信検証は成立させない。新プロパティは実在する設定値へのsource参照とobject定義で追加できる。
- WPのWebSite/WebPage/BlogPosting/FAQPage/Serviceも、ローカルの投稿・サービス等から取得した事実を、中央 `generation.entityTemplates` で出力する。第三者SEO/WooCommerceが所有するschemaには介入しない。
- llms.txtの節・テンプレート、robotsの対象・許可方針も中央版から配信。既存WP同期頻度とFreeの固定ベースラインは維持。WPの通信障害時のローカル出力には中央の配信証跡を付けない。
- `0032` は現在activeの定義を複製した新しい版を有効化。古い定義は変更しない。従来の実効LocalBusiness採点項目を保存し、業種別基準への置換・採点緩和は行わない。
- 初期値は `aeo-rules.mjs` に集約し、`scripts/build-continuous-rules-seed.mjs` でSQL内のスナップショットを再生成できる。本番D1が存在する場合、欠落・不正なactive定義を組込み既定値で隠さない。
- 管理APIの作成・有効化時に重み合計、範囲、必須定義、正規表現、テンプレートを検証。生成テンプレートはコード実行せず、事実をliteralで作る定義は拒否する。

## B. 取得版と実配信版を分離

- `aeo_delivery_expectations`: サイト・版ごとの取得した中央schema。取得だけで配信済みにはしない。同じ内容の再取得はDB更新を省略。
- `aeo_site_delivery`: 公開サイトから最後に検証できた版と時刻。
- HTMLの版証跡、raw HTML内の実際のJSON-LDと取得した中央生成物の照合、robots.txtとllms.txtの版一致、到達性を検証。
- `aeo_scores.ruleset_version` は診断開始時に読んだ採点基準版。保存時にactiveを読み直さない。追加した `delivered_ruleset_version` はその診断で検証できた実配信版、`score_model_version` は採点モデル。未検証はNULL。過去行もNULLのまま。
- 配信状態とスコア行はD1 batchでまとめて保存。スコア書込み失敗だけで配信状態が先行しない。
- 新版取得後でも旧キャッシュなら旧版を記録。schema/robots/llmsの版が混在、生成内容が不一致、証跡なしの場合は未検証。
- ダッシュボードで取得・追従を「最新化済み」と同一視しない。before/afterの差分は、同じ採点基準・同じモデルかつ両方の実配信版が確認できた行だけを比較。配信版の変更前後は同じ基準で比較できる。

## C. 日次診断から修正を自動適用

既存 `runAeoScoreCron` の診断後に修正ジョブを接続。新しいcronは作らない。

1. Standard/Proかつ配信停止でないサイトを対象に、サイト単位で24時間に1回までジョブを確保。同時実行も条件付きUPSERTで重複を抑制。
2. 修正可能な項目を、schema出力・llms出力・クローラー許可・既存情報の抽出という対応可能なアクションへ変換。
3. 中央設定へ適用し、WPは既存のtwicedailyルール同期で受信。WPの固定allowlistのみ実行し、同じrequested_atを再適用しない。llmsの中央取得は設定・版別に6時間キャッシュし、取得障害は5分の再試行間隔を置く。出力設定・スコアキャッシュを更新し、対応キャッシュプラグインと拡張フックで公開キャッシュを破棄。
4. 住所等は既存 `webmcp_canary_autofill_business_data()` を再利用し、既存のプロフィール同期・人の入力を保護するマージ処理へ接続。
5. 診断で取得済みの公開JSON-LDから、同一事業者と一意に確認できる住所/SNS/geoを再利用。別の追加巡回・有料AI・外部ジオコーディング呼出しは発生しない。曖昧な拠点、別サイト、範囲外・空の座標、既存住所と矛盾する座標は適用しない。
6. 不足事実や自動処理できない項目を `aeo_site_recommendations` と修正ジョブへ保存。WP管理画面とStandardでも閲覧可能なオーナーダッシュボードへ通知。通知は管理画面内であり、メール送信ではない。
7. 次の公開診断で修正が確認できた時点をverifiedとする。ローカルの設定保存・WPの取得成功だけではverifiedにしない。

任意の本文・未知の事実・レビュー評価は生成しない。tag/static連携ではrobotsやraw HTMLなどの変更をこちらから配信できないため、対応外アクションをオーナー確認へ回す。ページキャッシュの独自実装には `webmcp_canary_aeo_cache_purge` の接続が必要で、破棄できない間も成功扱いにしない。

**ハーベストの確認範囲:** このチェックアウトでは既存の住所等のWP抽出は確認できたが、独立した「SNS抽出＋住所からgeoへの変換サービス」は見つからなかった。既存抽出を再実装せず接続し、SNS・geoは診断で既に取得した明示値のアダプタを追加した。住所だけから座標を推測しない。別ブランチ・別サービスのジオコーダーとの接続確認は未実施。

## D. Pro測定の蓄積口

- 既存 `storeSovRun` の `status=measured` の結果保存に `aeo_learning_observations` の書込みを追加。
- run IDで既存の回答・引用証跡に接続。測定モデル、エンジン、クエリセット、回答数・測定率、測定以前の直近スコアの時刻・採点版・実配信版・モデルを保存。
- 対応するスコアがなければNULL。未設定・未測定は学習サンプルにしない。測定と蓄積は同じbatchで保存。
- active版の更新・重みの自動変異は行わない。既存のinactive候補生成フローも再実装しない。

## ローカル検証

- `npm run test:continuous`: 実SQLite、実PHPの同期・出力関数、WordPress APIスタブ、HTTPモックによる結合テスト。実WordPressインストール・本番ネットワーク・本番D1でのE2Eではない。
- 移行前後のLocalBusiness/SoftwareApplication/Product/Service/Articleの実効採点項目・スコアが同じことを確認。
- 中央新版→tag/config取得→PHP同期→raw schema出力→公開診断→スコア履歴の実配信版更新を確認。JS/PHP変更なしで中央の事業者プロパティとWP WebSiteプロパティが増えることも確認。
- 取得だけでは未検証、旧キャッシュは旧版、証跡と内容の不一致・3成果物の版混在は未検証、スコア保存失敗時の配信状態ロールバックを確認。
- 実際の日次cron経路からのジョブ作成、24時間制限、Free除外、WPでの自動設定変更・既存住所抽出・重複適用抑止・オーナー通知を確認。
- 観測値だけのハーベスト、空座標を0にしないこと、矛盾・別サイト・曖昧拠点の拒否を確認。
- Pro測定のスコア版との紐付け、未測定除外、測定によってactive版が変わらないことを確認。
- UIテストで未検証版の表示、比較可能なbefore/afterだけの差分表示、通知のHTMLエスケープを確認。
- `npm run test:canary`: AEO、SoV、プロフィール、課金の既存回帰テスト、ダッシュボード、プラン、WP管理画面が通過。Stripe・課金コードへの変更なし。
- `npm run plugin:build`: `dist/nurevo-webmcp-0.7.2.zip`。公開・アップロードなし。
- Wrangler 4.143.0で `deploy --dry-run` のバンドル確認。設定済みAssetsルートの一般的な警告は出るが、ビルドは成功。

## 確認後の本番反映手順（未実行）

対象は `webmcp-canary` Worker、`DB` バインディングの `nurevo-db`。別DBの `WEBMCP_DB` へこのSQLを適用しない。

1. 対象アカウント・現在のWorker版・activeルール版・既存マイグレーション適用状態を読み取り確認。`0013`〜`0031` の依存テーブルが存在することと、`0032` 未適用を確認する。
2. 対象D1をバックアップし、現在のWorker版・WP版も保存する。

   ```sh
   ./node_modules/.bin/wrangler d1 export nurevo-db --remote --output /private/tmp/nurevo-before-0032.sql
   ```

3. 承認済みの `0032` を1回だけ適用する。既存方式に合わせたALTER TABLEを含み、再実行可能なSQLではない。移行はactiveの定義を複製して新しい版を作るため、本番の版番号はテストのv4/v5とは限らない。

   ```sh
   ./node_modules/.bin/wrangler d1 execute nurevo-db --remote --file nurevo-impl/db/0032_continuous_optimization.sql
   ```

4. activeが1件で、scoring/generation/entityFieldsが完全に入ったことを確認してから、同じブランチのWorkerとassetsを通常のレビュー・公開手順で反映する。mainへの直接変更・force-pushは行わない。
5. WPのレビュー済み0.7.2 ZIPを更新。既存twicedaily同期を待つか、対象サイトで既存同期を1回実行する。WP-Cron停止中は同期されない。
6. 対象サイトのHTML・robots・llmsの版とschema内容を確認後、既存の認証付きサイト診断を1回実行する。取得直後の「未検証」は正常な中間状態。
7. 以下のSQLやオーナーダッシュボードで履歴を確認する。

   ```sql
   SELECT version,active,notes FROM aeo_rulesets ORDER BY version DESC LIMIT 5;
   SELECT site_id,ruleset_version,fetched_at FROM aeo_delivery_expectations WHERE site_id='<site-id>' ORDER BY ruleset_version DESC;
   SELECT site_id,delivered_version,verified_at FROM aeo_site_delivery WHERE site_id='<site-id>';
   SELECT scanned_at,score,ruleset_version,delivered_ruleset_version,score_model_version
     FROM aeo_scores WHERE site_id='<site-id>' ORDER BY scanned_at DESC LIMIT 10;
   SELECT site_id,status,requested_at,actions_json FROM aeo_autofix_jobs WHERE site_id='<site-id>';
   SELECT run_id,measured_at,scoring_ruleset_version,delivered_ruleset_version
     FROM aeo_learning_observations WHERE site_id='<site-id>' ORDER BY measured_at DESC LIMIT 10;
   ```

8. 次の日次診断で修正・確認待ち通知・失敗状態を確認する。学習口の確認に新規の有料Pro測定を勝手に増やさず、既存スケジュールの測定保存を確認する。

ロールバック時はWorker・WPの旧版復帰を先に検討し、保存したactive版へ戻す。新Workerはscoring/generationのない旧定義を有効化しないため、新Workerを残す場合は旧内容を完全定義の新しい版として作成する。追加した履歴列・テーブルは削除せず保持できる。

技術確認資料: [D1 batchのトランザクション](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)、[Wranglerのローカルバンドル確認](https://developers.cloudflare.com/workers/wrangler/bundling/)。

## Git

作業前の未追跡 `backups/` は変更・追加・コミットしない。この実装だけを作業ブランチへコミットし、指定のCo-Authored-ByとClaude-Sessionを末尾に付ける。push・本番反映は行わない。最終git statusは実行結果として別途報告する。
