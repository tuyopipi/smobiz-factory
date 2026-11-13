# nurevo.jp ガイド記事 コンテンツ計画

毎日1本、AI検索（ChatGPT・Perplexity・Google AI）で「AEOツール」「AI検索最適化」などを聞かれたときに出典として選ばれる記事を、ja/en の2ロケールで下書きし、`content/daily-YYYYMMDD` ブランチのPRとして出す。マージ・デプロイはオーナー。

ルール：週に1本は業種別、週に1本は制作会社向け。既存記事と重なる場合は既存記事の更新にしてよい。他社の事実は一次情報（公式ページ）で確認し出典リンクを付ける。

## 公開済み（main にある記事）

| スラッグ | テーマ |
|---|---|
| what-is-aeo | AEOとは |
| aeo-vs-seo-vs-geo | AEO・SEO・GEOの違い |
| llms-txt | llms.txtとは・書き方 |
| appear-in-chatgpt | ChatGPTに載る方法 |
| aeo-wordpress | WordPressのAEO |
| local-business-schema-seo-plugins | Yoast・Rank Math・AIOSEOに店舗の構造化データを追加 |
| aeo-signals-ai-answers-study | AEOシグナルとAI回答の調査 |
| research-japan-web-agencies-ai-search-2026 | 調査レポート：国内Web制作会社サイトのAI検索対応状況（総論、2,357件、2026-11-05集計） |
| ai-visibility-check | （枠のみ・未公開）AIに見えているかの確認 |

## 日次ログ

| 日付（JST） | スラッグ | テーマ | 種別 | PR |
|---|---|---|---|---|
| 2026-10-28 | aeo-tools-comparison | AEOツールの比較と選び方（計測型と実装型） | 比較 | content/daily-20261028 |
| 2026-10-29 | dental-clinic-ai-search | 歯科医院のAI検索対策（未マージのPR） | 業種別 | content/daily-20261029 |
| 2026-10-30 | agency-aeo-monthly-service | 制作会社がAI検索対策を月額サービスにする方法（作業範囲・月次作業・レポート・価格の決め方）。41言語 | 制作会社向け | content/daily-20261030 |

翻訳の補完ログ：2026-10-30 aeo-tools-comparison に39言語を追加（ja/en と合わせて41言語）。残り：aeo-signals-ai-answers-study、local-business-schema-seo-plugins。
| 2026-10-31 | measure-ai-visibility | AIでの登場率（AI可視性）の測り方：4つの数字、6ステップ、質問の選び方、記録表、読み方の注意、手作業以外の測り方。41言語 | 実践ガイド | content/daily-20261031 |
翻訳の補完ログ：2026-10-30 aeo-tools-comparison に39言語を追加（ja/en と合わせて41言語）。2026-10-31 aeo-signals-ai-answers-study に39言語を追加。残り：local-business-schema-seo-plugins、dental-clinic-ai-search（マージ後）。

## 候補（上から優先）

1. 美容室・サロンのAI検索対策（HairSalon / BeautySalon、メニュー・予約導線）【業種別】
2. AIでの登場率（AI可視性）の測り方：質問の選び方・回数・読み方
3. ネットショップ（EC）のAI検索対策：商品・在庫・返品ポリシーの構造化データ【業種別】
4. BtoB・SaaSのAI検索対策：サービス・料金・導入事例ページとllms.txt【業種別】
5. 制作会社向け：AI検索対策の提案書・初回診断の進め方（無料チェックの使い方、説明してはいけないこと）【制作会社向け】

その他の候補：BtoB・SaaSのAI検索対策／飲食店・士業・宿泊のAI検索対策／ChatGPT・Perplexityに店や会社が出る仕組み（appear-in-chatgpt の更新でも可）。
| 2026-10-29 | dental-clinic-ai-search | 歯科医院のAI検索対策（Dentistの構造化データ、診療時間、医療広告ガイドラインとの関係） | 業種別 | content/daily-20261029 |
1. 制作会社がAI検索対策を月額サービスにする方法（作業範囲・レポート・価格設計）【制作会社向け】
2. AIでの登場率（AI可視性）の測り方：質問の選び方・回数・読み方
3. 美容室・サロンのAI検索対策（HairSalon / BeautySalon、メニュー・予約導線）【業種別】
4. ネットショップ（EC）のAI検索対策：商品・在庫・返品ポリシーの構造化データ【業種別】
5. BtoB・SaaSのAI検索対策：サービス・料金・導入事例ページとllms.txt
その他の候補：飲食店・士業・宿泊のAI検索対策／ChatGPT・Perplexityに店や会社が出る仕組み（appear-in-chatgpt の更新でも可）。
メモ：多言語の仕組み（src/i18n/locales.mjs）は 2026-10-29 時点で main に無いため、記事は ja/en のみ。翻訳の補完は仕組みのマージ後に行う。
2. ネットショップ（EC）のAI検索対策：商品・在庫・返品ポリシーの構造化データ【業種別】
3. 制作会社向け：AI検索対策の提案書・初回診断の進め方（無料チェックの使い方、約束してはいけないこと）【制作会社向け】
5. AIからのアクセスを解析ツールで見分ける方法（参照元・utm_source・AIクローラのログ）
| 2026-11-01 | hair-salon-ai-search | 美容室・サロンのAI検索対策（HairSalon / BeautySalon、メニュー・税込料金・所要時間・予約URL、口コミの扱い〔自己言及レビュー・ステマ規制〕）。41言語 | 業種別 | content/daily-20261101 |
翻訳の補完ログ：2026-10-30 aeo-tools-comparison に39言語を追加（ja/en と合わせて41言語）。2026-10-31 aeo-signals-ai-answers-study に39言語を追加。2026-11-01 local-business-schema-seo-plugins に残り33言語を追加（既存の8言語と合わせて41言語）。残り：dental-clinic-ai-search（マージ後）。
1. ネットショップ（EC）のAI検索対策：商品・在庫・返品ポリシーの構造化データ【業種別】
2. 制作会社向け：AI検索対策の提案書・初回診断の進め方（無料チェックの使い方、約束してはいけないこと）【制作会社向け】
3. BtoB・SaaSのAI検索対策：サービス・料金・導入事例ページとllms.txt【業種別】
4. AIからのアクセスを解析ツールで見分ける方法（参照元・utm_source・AIクローラのログ）
5. 飲食店のAI検索対策：メニュー・営業時間・予約・アレルギー表示の書き方【業種別】
その他の候補：士業・宿泊のAI検索対策／ChatGPT・Perplexityに店や会社が出る仕組み（appear-in-chatgpt の更新でも可）。
| 2026-11-02 | online-shop-ai-search | ネットショップ（EC）のAI検索対策（OnlineStore・Product/Offer・在庫・返品ポリシー〔merchantReturnLink〕・送料〔ShippingService〕、Merchant Centerとの優先順位、ChatGPTの商品結果の仕組み、特定商取引法の表示と返品特約、WooCommerceでの設定）。41言語 | 業種別 | content/daily-20261102 |
翻訳の補完ログ：2026-10-30 aeo-tools-comparison に39言語を追加（ja/en と合わせて41言語）。2026-10-31 aeo-signals-ai-answers-study に39言語を追加。2026-11-01 local-business-schema-seo-plugins に残り33言語を追加（既存の8言語と合わせて41言語）。2026-11-02 は main の公開記事がすべて41言語にそろっていたため補完なし。残り：dental-clinic-ai-search（PR #45 マージ後）。
1. 制作会社向け：AI検索対策の提案書・初回診断の進め方（無料チェックの使い方、約束してはいけないこと）【制作会社向け】
2. BtoB・SaaSのAI検索対策：サービス・料金・導入事例ページとllms.txt【業種別】
3. AIからのアクセスを解析ツールで見分ける方法（参照元・utm_source・AIクローラのログ）
4. 飲食店のAI検索対策：メニュー・営業時間・予約・アレルギー表示の書き方【業種別】
5. 商品フィードとAI：Merchant Center・ChatGPTの商品フィード・構造化データの役割分担（online-shop-ai-search の続き）
メモ：多言語の仕組み（src/i18n/locales.mjs）は main にマージ済み。新しい記事は ja/en を .mjs、他の39言語を src/content/<slug>/<code>.json に書く。dental-clinic-ai-search（PR未マージ）は ja/en のみのため、マージ後に翻訳を補う。
| 2026-11-10 20時 | search-console-ai-features | Search ConsoleでAIによる概要・AIモードの表示を見る方法（生成AIパフォーマンスレポート〔検索〕：2026-08-31に全世界提供、表示回数のみ、ページ・国・デバイス・日付、ウェブ：テキストベース/マルチモーダル、太平洋時間・暫定値、グラフはプロパティ単位・ページ表はページ単位、8/13〜17の記録不具合と復元）、通常の検索パフォーマンスとの読み合わせ表、毎月のチェックリスト、「検索の生成 AI」設定〔含める/除外/親から継承、Google-Extended・noindex・nosnippet との違い〕、WordPressでの手順、ChatGPT・Perplexityの補い方）。2言語（ja・en） | 実践ガイド | content/daily-20261110-20 |
1. 整骨院・接骨院のAI検索対策（施術内容・保険の扱い・広告規制との関係）【業種別】
2. 不動産会社のAI検索対策（物件情報・対応エリア・RealEstateAgent）【業種別】
3. MEO会社のAI検索対策：Googleビジネスプロフィールとサイトの事実をそろえる【制作会社向け】
4. SWELL・Lightningでの構造化データとllms.txtの整え方（テーマ別の注意）
5. 学習塾のAI検索対策（コース・料金・対象学年・体験授業）【業種別】
翻訳の残り（8時台で補完）：search-console-ai-features（ja/en のみ）ほか未マージPRの ja/en 記事。

| 2026-11-13 8時 | veterinary-clinic-ai-search | 動物病院のAI検索対策（公開したい事実の表〔診療対象の動物は診ない動物も書く・受付終了・夜間救急と案内先・往診・保険の窓口精算〕、VeterinaryCareはLocalBusinessではなくMedicalOrganizationの下という型の注意と3つの書き方の比較表、獣医療法第17条と2024-04-01の広告制限の改正〔愛知県・熊本県のページ〕・指針〔平成26年改正版〕でのホームページの扱い、WordPressでの手順〔「クリニック・歯科」→業種にVeterinaryCare〕、測り方）。41言語 | 業種別 | content/daily-20261113-08 |
翻訳の補完ログ：2026-11-13 search-console-ai-features に39言語を追加（ja/en と合わせて41言語）。
1. 制作会社向け：お客様にAI検索対策を説明する1枚資料（よくある誤解と答え方）【制作会社向け】
2. 整体・リラクゼーションサロンのAI検索対策（施術の表現と広告の注意）【業種別】
3. ChatGPTの「場所」検索と地図情報：店舗の住所・営業時間がどこから来るか
4. 地域×業種のAI検索の傾向：同じ質問を地域を変えて聞いたときの出典の違い（測定記事）
5. 保育園・幼稚園・習い事教室のAI検索対策（ChildCare、対象年齢・送迎・費用）【業種別】
翻訳の残り（8時台で補完）：未マージPRの ja/en 記事（マージ後に順に）。
メモ：プラグインの営業時間の読み取りは「定休」「休み」は読めるが「休診」は読めない（「9:00-12:00, 16:00-19:00、水曜休診」→出力なし）。記事の例は「水曜定休」にした。医療系の業種向けに「休診」の対応を検討。maff.go.jp と schema.org はこの回も取得できず（許可待ち）。

## 調査レポート（research-）ログ

| 日付（JST） | スラッグ | 切り口 | データ | 言語 | PR |
|---|---|---|---|---|---|
| 2026-11-10 | research-japan-web-agencies-ai-search-2026 | 総論（国内Web制作会社サイトのAI検索対応状況） | summary_2026-11-05 | ja/en | content/research-20261110（未マージの #57・#60 と同じ切り口。#60 の原稿を最新の main に載せ直したもの） |

未着手の切り口：AIクローラーのブロック実態（ボット別）／llms.txt 導入率／構造化データの種類と壊れ率／都道府県別／WordPress と非WordPress／SEOプラグイン別／日本と海外の比較／国別（UK・US・AU・CA・DE・FR など）／AI対応スコア分布。
