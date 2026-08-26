# smobiz-factory 実装指示書（Codex向け）

## 目的
Chrome拡張を自動生成→需要検証→ビルド→自動公開→計測→判定するオーケストレーターをCloud Run上に構築する。無限に候補を生成し、当たりに倍賭け、赤字は放置/撤退する淘汰ループ。

## 技術スタック
- 言語: TypeScript (Node.js 20+)
- 実行環境: Google Cloud Run (プロジェクトID: dogmap-476906, リージョン: asia-northeast1)
- DB: Firestore (native, (default))
- キュー: Cloud Tasks
- 定期起動: Cloud Scheduler
- 秘密情報: Secret Manager（下記キー名で参照。値はコードに書かない）
- コンテナ: Artifact Registry (asia-northeast1-docker.pkg.dev/dogmap-476906/apps-repo)

## Secret Manager キー名（既に格納済み）
ANTHROPIC_API_KEY, OPENAI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN, CHROME_PUBLISHER_ID

## アーキテクチャ
- キュー式ワーカー + イベント駆動 + 非同期（眠らず連続、審査待ちはブロックしない）
- PFアダプタ方式：共通インターフェースの裏に各PFを差し込む。まずChromeアダプタのみ実装、後で全PF拡張可能な設計にする

## 1サイクルのパイプライン
1. Cloud Tasksから次タスク取得
2. 候補生成（LLMでChrome拡張のニッチアイデアを複数生成）
3. 需要検証（3層フィルタ、下記）
4. 指紋・重複チェック（Firestore内の既存プロダクトと構造比較、被りは落とすか既存アプデに振替）
5. PF選択（今はChrome固定）
6. ビルド（Codex/LLMにChrome拡張のコードを生成させ、テストを実行、緑にならなければ退避）
7. パッケージング（manifest, アイコン自動生成, ストア掲載文生成, zip化）
8. 【ship承認ゲート】Firestoreに"pending_ship"として記録し、承認アプリに出す
9. 承認されたらChrome Web Store APIで公開申請、計器オン
10. 計測（インストール/初週リピート/課金転換/返金率/レビュー/PF警告をFirestoreに蓄積）
11. 判定（下記ロジックで倍賭け/放置/retireに仕分け）
12. 【double-down承認ゲート】【retire承認ゲート】

## 需要検証の3層フィルタ
- 第1層: Chromeウェブストアの公開データ（既存拡張のインストール数・レビュー数・評価を取得）
- 第2層: Google検索サジェスト/関連キーワードで検索需要を確認（無料エンドポイント）
- 第3層: 上記実データをClaude(ANTHROPIC_API_KEY)に渡し収益性をスコアリング。※モデルの記憶のみで判断させず必ず実データを土台にする
- 3層通過したものだけビルドへ

## 判定ロジック（閾値は環境変数で調整可能に）
- 倍賭け: 初週リピート率 >= 閾値(初期30%) かつ 無料→課金転換 >= 下限(初期2%) → double-down候補として承認アプリに提示
- 放置: シグナル弱いが運用コスト0 → そのまま生かす（殺さない）
- retire推奨: 返金率高 / 低評価 / PF警告 / 保守費が見込収益超過 のいずれか → retire候補として提示
- ※低収益単独ではretireしない

## アカウント信用保護（重要）
- 1つの開発者アカウントに詰め込みすぎない設計
- 権限の狭い単機能拡張のみ生成（<all_urls>等の広い権限を避ける）
- 既存商標に似たロゴ・名前を避ける

## 承認ゲート
Firestoreの"decisions"コレクションに ship/double-down/retire の3種を積む。
各decisionには: プレビュー, 根拠(需要検証データ), 売上予測レンジ+内訳, 既存との差分 を含める。
（承認アプリ iOS/Swift は別途。まずバックエンドがdecisionをFirestoreに書き、REST APIで読める状態にする）

## 実装フェーズ順（この順で作る）
1. プロジェクト初期化（package.json, tsconfig, フォルダ構造）
2. 共通基盤（Secret Manager読み込み, Firestoreクライアント, 型定義）
3. 需要検証モジュール（3層フィルタ）+ 単体テスト
4. 候補生成モジュール + 指紋チェック
5. Chromeアダプタ（ビルド・パッケージング・公開API）
6. オーケストレーター本体（Cloud Tasksワーカー, パイプライン結線）
7. 判定モジュール + 計測モジュール
8. decision用のREST API（承認アプリが読む）
9. Dockerfile + Cloud Runデプロイスクリプト（1コマンド）

## 受け入れ条件
- 全モジュールに単体テスト、緑であること
- 秘密情報はSecret Manager参照のみ（ハードコード禁止）
- ローカルで`npm test`が通り、`npm run build`が成功
- デプロイスクリプト実行でCloud Runにデプロイできる

## デプロイ先
gcloud run deploy でCloud Runへ。サービスアカウント: factory-deployer@dogmap-476906.iam.gserviceaccount.com
