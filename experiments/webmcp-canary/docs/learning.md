# 学習データ（Learning data）

Nurevo が「どの変更をすると、事業者が AI の回答に登場しやすくなるか」を、
導入済みサイトの自然な展開（natural rollout）から学ぶための仕組み。協力サイトを
募る実験プログラムは置かず、各サイトがそれぞれのタイミングで行った変更の前後を比べる。

- コード: `worker/learning-events.mjs`（変更ログ）、`worker/learning-baseline.mjs`
  （導入前ベースライン）、`worker/learning.mjs`（パネルと推定量）、
  `wordpress-plugin/webmcp-canary/includes/learning-events.php`（プラグイン側）
- マイグレーション: `nurevo-impl/db/0049_learning_events.sql`（追加のみ）
- 画面: ダッシュボードの「学習データ」（Learning、スーパー管理者のみ）
- API: `GET /api/admin/learning`（`SUPER_ADMIN_EMAILS` のみ、読み取り専用）
- テスト: `scripts/test-learning.mjs`、`scripts/test-wordpress-aeo-admin.php`（プラグイン側）

## スコープ（Scope、オーナー決定）

学習は **Nurevo（プラグインとサービス）が実際に変えられること** の範囲にとどめる。

1. 推定量（estimator）と提案（proposal）は、Nurevo が変えられる変更（lever）だけを
   対象にする: 構造化データ・事業情報の充足、サイト種別、llms.txt、AI クローラー設定、
   FAQ・サービス・商品の内容、ワンクリック修正、SEO プラグインとのスキーマ統合、
   プラグインの導入・接続とバージョン。`LEARNING_TREATMENTS` はすべて `lever: true`。
2. Nurevo が変えられない要因（口コミ、Google マップ、人気、プラン、業種、地域、
   外部掲載監査）は **比較の層（strata）/ 制御変数（control）としてのみ** 使い、
   効果（lever）や推奨として報告しない（`CONTEXT_ONLY`）。推定量はコンテキスト以外の
   層指定を拒否し、lever でない処置の推定も拒否する。
   **Google マップ / Places のデータ収集は追加しない**（既存の外部掲載監査の件数だけを
   イベントとして記録する）。
3. 成果指標（outcome）は、登場（named or cited）・店名登場（named）に加えて、
   **自サイト引用（own site cited）** を実行ごとに別に記録し、レポートでは最初に示す。
   AI の回答の出典に自サイトのドメインが載るかどうかは、Nurevo が最も影響を与えやすい成果。

## 何を記録するか（What is collected）

### 変更ログ（change log, `learning_events`）

サイトごと・時刻つき・型つきのイベントと、小さな JSON ペイロード。
**個人データは入らない**: イベント型ごとに許可キーの一覧（allowlist）があり、各キーは
真偽値・範囲内の整数・固定リストの値・短い識別子（`[a-z0-9_.-]`）しか通さない。
記録するのは「どの項目を入力したか」（項目名）であって、入力内容（住所・電話番号・
メール・FAQ 本文など）ではない。一覧にないキーは書き込み前に捨て、未知の型は拒否する。

| 送り手 | 型 | 内容 |
|---|---|---|
| plugin | `snapshot` | 接続後の最初の観測時の状態: 出力スイッチ、入力済みの項目名、事業情報が揃っているか、サイト種別、SEO プラグイン（Yoast / Rank Math / AIOSEO / Slim SEO / none 等）、プラグインのバージョン、FAQ・サービス・商品の件数、導入からの日数 |
| plugin | `output_toggled` | 出力スイッチ（schema / llms.txt / crawlers / browser tag / schema 統合 / 全体）のオン・オフ |
| plugin | `fields_changed` | 入力・削除された項目名、事業情報が揃ったか（`became_complete`） |
| plugin | `site_type_changed`, `ai_training_changed`, `plugin_version_changed`, `seo_plugin_changed`, `counts_changed` | 変化前後の値（列挙値・件数・バージョン） |
| plugin | `fix_applied` | 適用したワンクリック修正 / 提案変更の ID |
| service | `site_created`, `site_connected`, `plan_changed` | 作成、接続（ペアリング / ライセンス）、プラン変更（プランは制御変数） |
| service | `score_changed` | AI 対応度（readiness）とコンポーネント別状態の変化、score_version |
| service | `sov_run`, `free_check`, `baseline_measured` | エンジン別の回答数・店名登場・自サイト引用・登場の件数 |
| service | `offsite_audit` | 外部掲載監査の結果件数（制御変数のみ） |
| service | `recommendations_shown` | 表示した推奨の ID（1サイト1日1件） |

プラグイン側の規則は他のリクエストと同じ: **サイトが接続され（サイト ID とプロフィール
トークン）、同意がある場合だけ** 記録・送信する。イベントはオプションにキューされ
（最大 200 件、古いものから捨てる）、1日2回の同期で 50 件ずつ、各イベント ID つきで
`POST /api/sites/{id}/events`（Bearer プロフィールトークン、CSRF 対象外）へ送る。
`(site_id, event_id)` が主キーなので再送しても1回しか保存されない（idempotent）。
サービスに届かない間はキューに残る（offline queue）。readme の External services と
プラグインのプライバシーポリシー案、サイトのプライバシーポリシー（日英、LP と Worker の
両方）に記載した。

### 導入前ベースライン（pre-install baseline, `learning_baselines`）

ダッシュボードで WordPress サイトを追加すると（dashboard-first onboarding、ペアリング前）、
1回だけのベースライン計測を予約し、毎時ジョブ（`learning-baselines`）が実行する。

- 無料チェックと同じ方法: そのサイト向けの非ブランド質問 3 問（`FREE_SOV_QUESTIONS`）を
  Perplexity に各1回。同じ質問生成・集計・エンジンアダプター。
- その時点の公開スコアラーによる AI 対応度（readiness）とコンポーネント。
- 対象: 既存の不正利用対策を通過したアカウントのサイトのみ（承認済み active メンバー、
  1日のサイト作成上限、アカウントの月次無料チェック枠 `FREE_SOV_SITES_PER_ACCOUNT` を
  1つ使う）。Pro は対象外（プランで計測される）。作成から 7 日を過ぎたものは `too_late`。
- 費用: **無料予算に含める**。グローバルの無料行（scope `*`, engine `free:perplexity`）に
  `FREE_SOV_MONTHLY_USD` の範囲で原子的に予約し、別の台帳理由 `free:baseline`
  （サイト行・全体行）にも記録する。サイト自身の `free:perplexity` 行には触れないので、
  サイトの最初の月次無料チェックは消費しない。上限に達していれば何も呼ばず `skipped`
  （`used_up:global` / `used_up:account`）。後からは再試行しない（遅いベースラインは
  ベースラインではない）。
- 費用の目安: 1 サイトあたり 3 呼び出し（Perplexity の想定最大単価で予約、実績で精算）。
  無料チェック 1 回分と同じで、グローバル上限（既定 20 USD/月）の内側に収まる。
  アカウントあたりの枠で数も制限される。

## 推定量（Estimator）

`worker/learning.mjs`。

1. **パネル（panels）**: サイトごと、週単位（UTC、月曜始まり）。AI 対応度と
   コンポーネント、その週のイベント、エンジン別の成果（Pro の SoV、無料チェック、
   ベースライン。エンジン間で合算しない）、サイト種別・業種・おおよその地域
   （市区町村 / 国）・プラン。地域や業種は集計と層分けにだけ使い、API はサイト単位の
   パネルを返さない。
2. **処置（treatment）** の時点 g: lever ごとの最初の発生。接続時のスナップショットで既に
   オンだったものは、導入から 14 日以内なら導入時点を処置時点とし、それ以外は
   always-treated として除外する。スナップショットのないサイトは状態不明として除外。
   最初にオンにした時点で判定する（intent-to-treat）。
3. **差分の差分（staggered difference-in-differences）**: 処置サイトごとに、事前窓
   [g−12, g−1] 週から事後窓 [g+2, g+13] 週（回答への反映の遅れとして 2 週）への成果率の
   変化を求め、同じ暦週・同じ層（サイト種別・プラン）・同じエンジン・同じ計測種別
   （SoV / 無料）で、まだ処置されていないサイト（never treated、または事後窓の後に処置）
   の平均変化を引く。その平均が ATT。
4. **不確実性**: サイト単位のクラスターブートストラップ（cluster bootstrap by site、
   既定 400 回）による 95% パーセンタイル区間。
5. **検証**: 事前期間のプラセボ（pre-trend placebo、0 を含むはず）と、事後期間の
   ビン別イベントスタディ（event study）。
6. **成果指標の順序**: 自サイト引用 → 登場（named or cited）→ 店名登場。

合成データ（効果 +0.12、共通ドリフトあり、160 サイト中 80 処置）でテストし、推定値が
CI 内に入り、効果ゼロでは CI が 0 を含み、プラセボが 0 を含むことを確認している。

### ゲート（Gate）

事前・事後の両方の計測がある処置サイトが **30 未満**（`LEARNING_MIN_TREATED`）、または
比較サイトが 30 未満（`LEARNING_MIN_CONTROLS`）なら、数値を出さず
`insufficient_data` と件数だけを返す。イベントスタディの各ビンにも同じゲートをかける。

### 横断的キャリブレーション（Exploratory）

既存の `aeo-calibration.mjs`（ある時点でチェック合格サイトと不合格サイトを比べる）は
**探索的（exploratory）** と明記して併記する。サイト間の違い（業種・規模・地域）が
そのまま混ざるため因果推定ではない。

## 限界（Limits）

- **交絡（confounding）**: 変更を行うサイトは、同時に他のこと（口コミ、広告、季節要因、
  外部掲載）も変えているかもしれない。層分けと未処置比較で共通の変化は除けるが、
  処置と同時に起きたサイト固有の変化は除けない。
- **エンジンのドリフト（engine drift）**: AI エンジン自体がモデルや検索を変える。
  同じ暦週の比較サイトとの差を取ることで共通のドリフトは打ち消すが、サイト種別や
  地域ごとに異なるドリフトは残りうる。エンジン間では合算しない。
- **少数（small n）**: 無料チェックは月1回 3 問で、1サイトの率は粗い。ゲート未満では
  何も主張しない。ゲートを越えても CI が広ければ提案は出ない。
- 複数の変更が同時に起きる（例: 接続時にスイッチがまとめてオンになる）と個別の効果は
  分けられない。その場合は「プラグイン導入・接続」としてまとめて推定する。
- 計測方法の切り替え（無料 → Pro）をまたぐ比較はしない（同じ計測種別の窓だけを使う）。

## 提案の確認（How a proposal would be reviewed）

レポートの `proposals` は **確認用の提案** であり、`applied: false`・`auto_apply: false`
固定。スコアやルールセットを自動で変えることはない。

1. ゲートを越え、CI が 0 を含まず、プラセボが 0 を含む lever だけが提案になる。
2. 担当者が、効果量・CI・処置/比較サイト数・イベントスタディの形（効果が時間とともに
   安定しているか）・エンジン別の一貫性を確認する。
3. 交絡の候補（同時期の他の変更、特定の業種や地域への偏り）を確認する。
4. 採用する場合は、ルールセットの候補を `/api/admin/aeo/rulesets` で作成し、
   ノートに根拠（レポートの日時・推定値・CI・n）を書き、手動で有効化する。
   スコアのモデルを変える場合は `score_model_version` を上げ、履歴を版ごとに分ける。

## 用語（Terms）

| 日本語 | English |
|---|---|
| 変更ログ | change log (learning events) |
| 導入前ベースライン | pre-install baseline |
| 処置 / 処置サイト | treatment / treated sites |
| まだ処置されていない比較 | not-yet-treated comparison |
| 差分の差分 | difference-in-differences (DiD) |
| 段階的導入 | staggered adoption |
| サイト単位クラスターブートストラップ | cluster bootstrap by site |
| 事前トレンドの確認 | pre-trend placebo |
| イベントスタディ | event study |
| ゲート（最小 n） | minimum-n gate |
| 層 / 制御変数 | strata / control variables |
| 変えられる変更 | lever (controllable change) |
| 自サイト引用 | own site cited |
| 探索的 | exploratory |
