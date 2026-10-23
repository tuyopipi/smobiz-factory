# 紹介コード・メール新規登録の実装報告

本番デプロイ・本番DB変更・Stripe課金処理の変更は実施していません。
既存の認証セッション、CSRF、Resend、8言語メール設定を利用しています。

## マイグレーション0030

`nurevo-impl/db/0030_account_referrals.sql`。
既存DBには accounts がないため、members と一対一で対応する accounts を作成します。
INTEGER のアカウントID、member_id、email、created_at に加えて次を保持します。

- referral_code TEXT UNIQUE（未発行は NULL）
- referred_by_account_id INTEGER（親アカウントIDへの外部キー）
- referred_by_code TEXT（登録時に使われたコードの履歴）
- referral_code と referred_by_account_id のインデックス
- 自己参照を拒否する CHECK 制約

既存 members を紹介なしでバックフィルし、旧認証経路から作成されたメンバーも必要時に同期します。
新規メンバー・組織・メール言語・紹介アカウントは D1 batch の一トランザクションで作成します。
既存メールへの登録リクエストはアカウントや紹介元を書き換えません。
コード更新は referral_code のみを変更し、親IDと履歴コードを保持します。

auth_tokens は token（SHA-256ハッシュ）、account_id、purpose、email、expires_at、used_at を保持します。
トークンは256ビットのランダム値、15分有効、単回使用です。
条件付き UPDATE の変更件数で競合を判定し、勝ったリクエストだけが既存 nrv_session セッションを発行します。
メール送信失敗時は未送信トークンを削除します。

リリース前に既存0029まで適用済みのDBへ0030を適用する必要があります。
本実装ではリモートへの適用を行っていません。
このSQLは nurevo-impl/db の既存適用方式に従います。旧 canary の migrations ディレクトリとは別です。

## API

| Method / path | 動作例 |
| --- | --- |
| POST /api/auth/signup | `{"email":"child@example.test","referral_code":"ABCDEFGHJKMN","locale":"ja"}` → 登録・紹介固定・確認メール、`{"ok":true,"message":"..."}` |
| POST /api/auth/magic-link | `{"email":"child@example.test"}` → ログインメール。既存の findOrCreateMember の登録動作も維持 |
| GET /api/auth/verify?token=... | 未使用・期限内のトークン → used_at を設定、セッションCookie、302 /dashboard。無効時は /auth-error.html |
| GET /api/partner | 自分の紹介コード、月額見込み、累計報酬、紹介したアカウント・所有サイト・課金状態・登録日 |
| POST /api/partner/code | ログイン＋CSRF必須。12文字の英数字を発行。既発行なら同じコードを返す |
| POST /api/partner/code/regenerate | ログイン＋CSRF必須。新コードを発行。旧コードは新規紹介に使用不可、既存の紹介関係は保持 |

既存 /api/auth/request と /api/auth/callback は維持します。
新旧メール送信経路で同じ制限を共有します：IPあたり10回/10分、メールあたり5回/1時間。
無効コードは紹介なしで登録を続行し、個人情報や入力コードを含めず警告ログを出します。
自己紹介・既存アカウントへの後付け紹介は保存しません。
コード生成は Web Crypto の rejection sampling、事前重複確認、DBの UNIQUE 制約と競合再試行を併用します。

## 支払額の算出と確認できない値

月額見込みは、紹介アカウントが所有するサイトについて、保存されたStripe webhook由来の
`plan=standard`、`contract=active`、`stripe_subscription_id` ありのサブスクを重複排除し、1件¥1,200で算出します。
trial、past_due、unpaid、cancelled、手動付与、StripeサブスクIDのないサイトは対象外です。

累計報酬はStripeの入金済請求書を GET で読み、登録後のStandard請求書の amount_paid × 40% を算出します。
Stripe APIキー／Standard price ID不足、通信失敗、混在明細、明細省略、credit note調整、読取上限到達時は
不確かな金額を返さず null（未確認）とします。履歴読取は最大20リクエストまでです。
累計報酬は請求書の入金額に基づく値で、実際に紹介元へ送金した額ではありません。
既存DBにこのアカウント紹介制度の支払台帳がないため cumulative_paid_yen は null とし、UIにも「未確認」と表示します。
StripeのPOST、課金、transfer、webhook処理は変更していません。

## UI

ダッシュボードは `#partner`、i18nキー partner、JP「パートナー」／EN「Partner」に変更しました。
全アカウントで発行・コピー・更新、見込み・累計、紹介一覧を表示します。
旧 `#billing` は互換のため `#partner` へ解決します。
紹介一覧はDBから取得するため手動追加は不要です。画面読込・更新時に反映します。

8言語のLPヘッダーに以下を追加しています（日本語出力例）。

```html
<a href="/dashboard" class="login-link">ログイン</a>
<a href="/signup.html?lang=ja" class="btn">新規登録</a>
```

登録フォームはメールと任意紹介コードを送信し、成功時に「確認メールを送りました」を表示します。
LP言語を登録フォームと確認メールへ引き継ぎます。既存メールはログイン文面を使用します。
確認メールは8言語でメールアドレス確認とログイン、有効期限のみを説明します。

ローカルChromeで取得したスクリーンショット（fixtureのテストデータ、本番画面ではありません）：

- /private/tmp/nurevo-partner-qa/partner-ja.png
- /private/tmp/nurevo-partner-qa/partner-en.png
- /private/tmp/nurevo-partner-qa/lp-signup-button.png
- /private/tmp/nurevo-partner-qa/lp-mobile.png
- /private/tmp/nurevo-partner-qa/signup-form.png
- /private/tmp/nurevo-partner-qa/signup-sent.png

## テスト結果

すべて PASS。

- `node scripts/test-partner-auth.mjs`：実SQLiteで0030適用と既存メンバー移行、発行、強制重複の再試行、別メール紹介登録、親一覧、更新後の紐付け維持、旧／無効コード、自己紹介、既存紹介の不変、トークンハッシュ・単回使用・期限切れ・同時使用、セッション／CSRF、共有メール／IP制限、メール失敗、課金状態別見込み、Stripe読取のみの累計、登録前請求／調整請求の処理、8言語確認メール。
- `node scripts/test-partner-ui.mjs`：ChromeでJP/EN、storeロールの表示、発行・更新、紹介表、支払表示、LP登録ボタン、登録payloadと完了表示、言語引継ぎ、モバイル。外部APIはテストfixture。
- `node scripts/test-email-i18n.mjs`：既存の8言語ログインメール回帰。
- `node scripts/test-member-registration.mjs`：既存の承認制会員登録回帰。
- `npm run test:billing`：既存Stripeプラン、webhook、checkout／portal、ライセンス、コード、コンプ、kickback回帰。
- `npm run test:dashboard`：サイト一覧・作成・カタログ・AEO・ルーティング・接続・オンボーディング・SEO・推奨修正回帰。
- LP `npm run check`：8言語の生成一致、静的検査、SEO検査。
- `git diff --check`：問題なし。

authテストは node:sqlite を使うため Node 22.13+、UIテストはPlaywrightとChromeが必要です。
実メール送信、実Stripe課金／送金、本番デプロイは行っていません。

## 差分とgit状態

対象は0030、partner読み取りモジュール、認証API／メール文面、ダッシュボードとナビゲーション、
LPソースと8言語生成HTML、登録フォーム、テスト、実装報告です。
作業開始時から未追跡の `experiments/webmcp-canary/backups/` は変更・ステージ対象に含めません。
シークレットファイルは作成せず、既存 .gitignore の .env／.env.*／.dev.vars 除外を確認しています。

## 実装確認に使用した公式資料

- [Cloudflare D1 batch（トランザクション）](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)
- [Stripe 入金済請求書の読み取り](https://docs.stripe.com/api/invoices/list)
