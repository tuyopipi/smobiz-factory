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

## 調査レポート（research-）ログ

| 日付（JST） | スラッグ | 切り口 | データ | 言語 | PR |
|---|---|---|---|---|---|
| 2026-11-10 | research-japan-web-agencies-ai-search-2026 | 総論（国内Web制作会社サイトのAI検索対応状況） | summary_2026-11-05 | ja/en | content/research-20261110（未マージの #57・#60 と同じ切り口。#60 の原稿を最新の main に載せ直したもの） |

未着手の切り口：AIクローラーのブロック実態（ボット別）／llms.txt 導入率／構造化データの種類と壊れ率／都道府県別／WordPress と非WordPress／SEOプラグイン別／日本と海外の比較／国別（UK・US・AU・CA・DE・FR など）／AI対応スコア分布。
| 2026-11-14 8時 | nursing-care-facility-ai-search | 老人ホーム・介護施設のAI検索対策（家族・ケアマネが聞く条件つきの質問、費用の内訳と月額外の費用・受け入れ条件〔要介護度・認知症・医療的ケア〕・職員体制〔常勤換算・夜間〕・空室の更新日・退去条件の書き方表、2025-04-01からの重要事項のウェブ掲載義務〔栃木県・豊明市資料〕、有料老人ホームの不当表示告示の運用基準、schema.orgに介護施設の型がないこと〔Nursing・Geriatricは職種・分野〕→LocalBusiness、WordPress手順〔ウィザード「その他」〕、チェックリスト、測り方、FAQ 7問）。41言語 | 業種別 | content/daily-20261114-08 |
翻訳の補完ログ：2026-11-14 research-japan-web-agencies-ai-search-2026 に39言語を追加（41言語）。search-console-ai-features・dental-clinic-ai-search の翻訳は未マージPR（#68・#78・#84）にあるため、今回は重ねて訳していない。
次の候補：
1. 求人・採用ページのAI検索対策（JobPosting、給与・勤務地・応募方法の書き方）【全業種】
2. 内科・小児科クリニックのAI検索対策（診療時間・予約・発熱外来・オンライン診療、医療広告ガイドライン）【業種別】
3. 結婚式場のAI検索対策（費用の見積もりと総額、収容人数、持ち込み料）【業種別】
4. 制作会社向け：AI検索対策の月次レポートの作り方（何を測り、どう伝えるか）【制作会社向け】
5. 薬局・ドラッグストアのAI検索対策（営業時間・在宅対応・取り扱い）【業種別】
| 2026-11-14 11時 | medical-clinic-ai-search | 内科・小児科クリニックのAI検索対策（受付終了の時刻・午後休診・祝日、予約制/順番受付/予約なし、発熱時の受診方法、小児の対象年齢・予防接種・乳幼児健診の枠、オンライン診療の対象、夜間休日の案内の書き方表、診療時間を画像でなく文字で、医療情報ネット〔ナビイ、2024年4月〜〕と値をそろえる、医療広告の禁止例、MedicalClinic・Physician/PhysiciansOffice・medicalSpecialty〔PrimaryCare・Pediatric〕・isAcceptingNewPatientsの使い分け、WordPress手順〔ウィザード「クリニック・歯科」→業種欄をPhysician等に、営業時間欄の書き方と変換されない書き方〕、チェックリスト、測り方〔Mayui社のChatGPT回答調査・MGMA〕、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261114-11 |
次の候補：
1. 求人・採用ページのAI検索対策（JobPosting、給与・勤務地・応募方法の書き方）【全業種】
2. 制作会社向け：AI検索対策の月次レポートの作り方（何を測り、どう伝えるか）【制作会社向け】
3. 結婚式場のAI検索対策（費用の見積もりと総額、収容人数、持ち込み料）【業種別】
4. 薬局・ドラッグストアのAI検索対策（営業時間・在宅対応・取り扱い、医療情報ネットとの整合）【業種別】
5. 皮膚科・美容皮膚科のAI検索対策（保険診療と自費の書き分け、料金表示と限定解除）【業種別】
翻訳の残り（8時台で補完）：medical-clinic-ai-search（ja/en のみ）。
メモ：未マージの content/daily-* PR（#62〜#88）の多くは checks 成功のまま main と衝突（dirty）している。
| 2026-11-14 14時 | recruiting-page-ai-search | 採用ページ・求人ページのAI検索対策（全業種。求職者がAIに聞く条件つきの質問、求人ごとの詳細ページに書く10項目の表〔給与の範囲と固定残業代、勤務地と変更の範囲、リモートの条件、選考の流れ、募集期限〕、改正職業安定法〔2022-10-01、的確な表示の義務、広島労働局リーフレットの虚偽表示の例〕と2024-04-01の募集時明示事項の追加3項目、GoogleのJobPosting必須・推奨プロパティ表〔2026-09-08更新〕・一覧ページに付けない・期限切れの閉じ方と手動対策・Indexing API、ChatGPT/PerplexityのJobPosting利用は公開資料で未確認と明記、WordPress手順〔NurevoはJobPostingを出さない→求人プラグイン/JSON-LD/webmcp_canary_schema_graph、llms.txtは固定ページ・投稿の更新順30件でカスタム投稿タイプは入らない、「このページをllms.txtに載せない」、ページごとのFAQ〕、チェックリスト、測り方〔社名＋条件／社名なし〕、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261114-14 |
次の候補：
1. 制作会社向け：AI検索対策の月次レポートで「下がった」ときの説明と原因の切り分け（agency-aeo-monthly-service の報告項目の続き）【制作会社向け】
2. 結婚式場のAI検索対策（見積もりと総額、収容人数、持ち込み料）【業種別】
3. 薬局・ドラッグストアのAI検索対策（営業時間・在宅対応・取り扱い、医療情報ネットとの整合）【業種別】
4. 皮膚科・美容皮膚科のAI検索対策（保険診療と自費の書き分け、料金表示と限定解除）【業種別】
5. 会社概要ページのAI検索対策（Organization・沿革・役員・所在地の表記ゆれ）【全業種】
翻訳の残り（8時台で補完）：medical-clinic-ai-search・recruiting-page-ai-search（ja/en のみ）。
| 2026-11-14 17時 | ai-visibility-drop-causes | 制作会社向け：AIでの登場率が下がったときの原因の切り分けと報告（1回の計測のばらつき〔SparkToro/Gumshoe調査・AI検索ドック調査〕、段階1 計測条件の確認表〔質問・回数・AI・地域・ツール・失敗回〕とデータ側の問題〔Search Consoleデータ異常 2026-08-13〜17、Promptwatchのreddit.com引用の暫定値〕、段階2 下がり方の形で疑う場所の表、段階3 原因の候補と確かめ方の表〔検索用クローラ・noindex/nosnippet・検索の生成AI設定・URL変更・構造化データ/llms.txtの消失・事実の食い違い・出典の入れ替わり・AI側〕、WordPress手順〔AEOスコアの再診断・診断履歴・設定の書き出し wp nurevo export・SEOプラグイン併用・robots.txt〕、無料AIチェックの読み方、報告書の5欄テンプレート、毎月の仕組み、Proの同条件推移、チェックリスト、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261114-17 |
次の候補：
1. 結婚式場のAI検索対策（見積もりと総額、収容人数、持ち込み料）【業種別】
2. 薬局・ドラッグストアのAI検索対策（営業時間・在宅対応・取り扱い、医療情報ネットとの整合）【業種別】
3. 皮膚科・美容皮膚科のAI検索対策（保険診療と自費の書き分け、料金表示と限定解除）【業種別】
4. 会社概要ページのAI検索対策（Organization・沿革・役員・所在地の表記ゆれ）【全業種】
5. 制作会社向け：AI検索対策の初回診断と提案書の進め方（無料チェックの使い方、約束してはいけないこと）【制作会社向け】
翻訳の残り（8時台で補完）：medical-clinic-ai-search・recruiting-page-ai-search・ai-visibility-drop-causes（ja/en のみ）。
メモ：2026-11-14 17時の回は、WebFetchの許可待ちで一次情報（OpenAI・Perplexity・Google・SparkToro原典）を再取得できなかった。これらは既存記事で確認済みの範囲（2026-10-31・11-10）だけを書き、SparkToroは Search Engine Land の記事を出典にした。
| 2026-11-14 調査 | research-wordpress-seo-plugins-2026 | SEOプラグイン別（WordPress 12,376件：日本2,295・海外10,081。シェア〔日本 AIOSEO 35.2%・Yoast 14.4%・Rank Math 1.7%・検出なし48.6%／海外 Yoast 53.1%・Rank Math 22.2%・AIOSEO 6.1%〕、国別シェア13か国〔WP100件以上〕、プラグイン別の llms.txt・JSON-LD・Organization系・BreadcrumbList・OGP・canonical・AIボットブロック・6項目、限界〔文字列判定の優先順・SEO SIMPLE PACK等は検出なし〕） | raw_2026-11-12（summary_2026-11-12 と一致） | ja/en | content/research-20261114 |
調査レポートの未着手の切り口：都道府県別／WordPress と非WordPress／日本と海外の比較（総論）／国別（UK・US・AU・CA・DE・FR など）／AI対応スコア分布。
| 2026-11-15 調査 | research-ai-readiness-score-distribution-2026 | AI対応スコア分布（6項目〔survey.js score()〕、到達15,838件：日本2,486〔平均4.05・中央値5・5点以上52.2%・6点10.4%〕・海外13,352〔3.83・58.2%・21.8%〕、WordPress/非WP別、項目別達成率、5点サイトの欠け項目〔日本 llms.txt 94.9%〕、国別17か国〔到達100件以上〕、海外のHTTP 202応答1,477件を除いた値を併記、限界〔robots.txt 無しは(4)が0点〕） | raw_2026-11-12（summary_2026-11-12 と一致） | ja/en | content/research-20261115 |
調査レポートの未着手の切り口（2026-11-15 時点）：都道府県別／WordPress と非WordPress／日本と海外の比較（総論）／国別（UK・US・AU・CA・DE・FR など）。メモ：raw_2026-11-12 は 11-05 の取得分を再利用しているため（survey.js は7日以内の raw を引き継ぐ）、11-05 との「前回比」は独立した再測定ではない。メモ：#77（AIクローラー）・#83（llms.txt）・#89（構造化データ）は checks 成功のまま未マージ。
| 2026-11-15 8時 | wedding-venue-ai-search | 結婚式場のAI検索対策（カップルがAIに聞く条件つきの質問〔The Knot 2026 Real Weddings Study：AI利用36%〕、公開する事実の表〔会場の種類と挙式スタイル・会場ごとの収容人数・人数別の見積もり例・増えやすい項目・品目ごとの持ち込み可否と持ち込み料・申込金とキャンセル料の表・空き日・設備・見学〕、全国平均〔ゼクシィ結婚トレンド調査2024：52.0人・343.9万円〕を自社の数字と分けて書く、滋賀県の消費生活ページの事例と消費者契約法第9条1号「平均的な損害」、schema.orgに結婚式場の型がない・EventVenueはPlaceでLocalBusinessではない・maximumAttendeeCapacity、WordPress手順〔ウィザード「その他」・ページ専用FAQ・webmcp_canary_schema_graph〕、チェックリスト、測り方、FAQ 7問）。41言語 | 業種別 | content/daily-20261115-08 |
翻訳の補完ログ：2026-11-15 medical-clinic-ai-search に39言語を追加（41言語）。
翻訳の残り（8時台で補完）：recruiting-page-ai-search・ai-visibility-drop-causes・research-wordpress-seo-plugins-2026（ja/en のみ）。search-console-ai-features・dental-clinic-ai-search は未マージPRに翻訳あり。
次の候補：
1. 薬局・ドラッグストアのAI検索対策（営業時間・在宅対応・取り扱い、医療情報ネットとの整合）【業種別】
2. 皮膚科・美容皮膚科のAI検索対策（保険診療と自費の書き分け、料金表示と限定解除）【業種別】
3. 会社概要ページのAI検索対策（Organization・沿革・役員・所在地の表記ゆれ）【全業種】
4. 制作会社向け：AI検索対策の初回診断と提案書の進め方（無料チェックの使い方、約束してはいけないこと）【制作会社向け】
5. 写真館・フォトスタジオのAI検索対策（撮影プラン・データ納品・衣装・予約）【業種別】
| 2026-11-15 11時 | pharmacy-ai-search | 薬局・ドラッグストアのAI検索対策（AIに聞かれる条件つきの質問、店の営業時間と調剤の受付時間・薬剤師の不在時間・開店時間外の相談・処方箋の受付と事前送信・在宅訪問・認定/表示・取り扱い・言語の書き方表、薬局機能情報提供制度〔薬機法第8条の2、G-MIS 2024-01〜・ナビイ公開 2024-04〜、定期報告12/31時点・随時報告の項目＝営業日・開店時間・時間外相談・健康サポート薬局・地域連携/専門医療機関連携薬局・薬剤師不在時間、東京都・埼玉県のページ〕と値をそろえる、医薬品等適正広告基準（名前とリンクのみ。厚労省ページは今回取得できず詳細は書いていない）、schema.org Pharmacy〔MedicalBusiness・LocalBusiness+MedicalOrganization、Storeの下位ではない〕・specialOpeningHoursSpecification・knowsLanguage・paymentAccepted・hasOfferCatalog、WordPress手順〔ウィザード「小売店」→業種欄をPharmacy〕、チェックリスト、測り方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261115-11 |
翻訳の残り（8時台で補完）：recruiting-page-ai-search・ai-visibility-drop-causes・research-wordpress-seo-plugins-2026・pharmacy-ai-search（ja/en のみ）。
メモ：2026-11-15 11時の回は厚生労働省のページ（認定薬局・広告基準・一般用医薬品の販売・オンライン服薬指導）と schema.org・geolyzer.io を WebFetch の許可待ちで取得できなかった。2025年の薬機法改正や要指導医薬品の扱いは書いていない。次に更新するときに確認して足す。
次の候補：
1. 皮膚科・美容皮膚科のAI検索対策（保険診療と自費の書き分け、料金表示と限定解除）【業種別】
2. 会社概要ページのAI検索対策（Organization・沿革・役員・所在地の表記ゆれ）【全業種】
3. 制作会社向け：AI検索対策の初回診断と提案書の進め方（無料チェックの使い方、約束してはいけないこと）【制作会社向け】
4. 写真館・フォトスタジオのAI検索対策（撮影プラン・データ納品・衣装・予約）【業種別】
5. 多店舗チェーンのAI検索対策（店舗ごとのページ・営業時間・Googleビジネスプロフィールの一括管理）【全業種】
| 2026-11-15 14時 | agency-aeo-first-audit-proposal | 制作会社向け：AI検索対策の初回診断と提案書の作り方（Googleの「SEO 業者の利用を検討する」2026-06改訂〔「生成 AI 向けに最適化」、AEO/GEOの助言を公式指針で確かめる節、「一番上に掲載されることは誰にも保証できません」〕と「third-party SEO tools, services, and advice」〔AEO/GEOツール、Googleは第三者サービスを評価しない、予測は外れうる〕、商談前の初回診断の表7項目〔インデックス・AI検索クローラ・構造化データ・llms.txt・事実の食い違い・画像だけの情報・AI回答のサンプル〕、AI回答を診断に使う注意〔AI検索ドックの回数別の差、指名/発見、記録〕、Pew 2025〔8%/15%/1%〕、提案書7章の表〔書くこと/書かないこと〕、診断サービスの価格帯〔ステラジェント比較24件〕、約束してよいこと/いけないこと表、商談の想定問答表、WordPress手順〔/check→お知らせ→ウィザード→AEOスコア→無料AIチェック→設定の書き出し〕、パートナー機能、チェックリスト、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261115-14 |
翻訳の残り（8時台で補完）：recruiting-page-ai-search・ai-visibility-drop-causes・research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal（ja/en のみ）。
次の候補：
1. 皮膚科・美容皮膚科のAI検索対策（保険診療と自費の書き分け、料金表示と限定解除）【業種別】
2. 会社概要ページのAI検索対策（Organization・沿革・役員・所在地の表記ゆれ）【全業種】
3. 写真館・フォトスタジオのAI検索対策（撮影プラン・データ納品・衣装・予約）【業種別】
4. 多店舗チェーンのAI検索対策（店舗ごとのページ・営業時間・Googleビジネスプロフィールの一括管理）【全業種】
5. 制作会社向け：AI検索対策の作業をお客様に引き継ぐ・解約するときの手順（設定の書き出し、出力の止め方、報告の締め方）【制作会社向け】
| 2026-11-15 17時 | company-profile-page-ai-search | 会社概要ページのAI検索対策（全業種。社名を含む質問の型6つ、書く項目の表12項目〔正式な社名=legalName・通称/ブランド/英語表記=alternateName・所在地・連絡先・設立=foundingDate ISO 8601・代表者〔本文だけ〕・事業内容・従業員数/資本金〔時点〕・法人番号〔本文、taxIDに入れるかはGoogleに記載なし〕・sameAs・logo 112px・最終更新日〕、紹介文2〜3文＋表、沿革に旧社名/移転、表記ゆれの表〔前株/後株・英語表記・番地・電話・旧表記〕とサイト内/社外の確認場所、同名の会社との区別〔iso6523Code・naics〕、Google Organization構造化データ〔2026-09-15更新：必須なし・トップか会社概要の1ページ・地域ビジネスはLocalBusinessの下位型・logo 112×112〕、AboutPage、WordPress手順〔ウィザード B2B/SaaS=Organization・基本情報8欄・住所はPostalAddressの1文字列・サイトロゴ・SEOプラグイン側の値が優先・legalName/alternateName/foundingDate/sameAs は webmcp_canary_business_node・llms.txt 30件と webmcp_canary_llms_txt_lines〕、社名ありの質問での確かめ方の表、チェックリスト11、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261115-17 |
メモ：2026-11-15 17時の回は国税庁 法人番号公表サイト・gBizINFO・Yoast/Rank Mathのヘルプ・OpenAIのボット一覧を WebFetch の許可待ちで取得できなかった。法人番号は公表サイトへのリンクだけにし、桁数や公表項目は書いていない。Google の Organization ページは zh-cn 表示で取得（日本語の文言は引用していない）。
翻訳の残り（8時台で補完）：recruiting-page-ai-search・ai-visibility-drop-causes・research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search（ja/en のみ）。
次の候補：
1. 皮膚科・美容皮膚科のAI検索対策（保険診療と自費の書き分け、料金表示と限定解除）【業種別】
2. 写真館・フォトスタジオのAI検索対策（撮影プラン・データ納品・衣装・予約）【業種別】
3. 多店舗チェーンのAI検索対策（店舗ごとのページ・営業時間・Googleビジネスプロフィールの一括管理）【全業種】
4. 制作会社向け：AI検索対策の作業をお客様に引き継ぐ・解約するときの手順（設定の書き出し、出力の止め方、報告の締め方）【制作会社向け】
5. 代表者・専門家のプロフィールページのAI検索対策（Person・資格・経歴の書き方）【全業種】
| 2026-11-15 20時 | multi-location-business-ai-search | 多店舗・チェーンのAI検索対策（全業種。店舗の質問の型6つとよくある間違い4つ、ブランド/店舗一覧/店舗ページ/閉店のお知らせの役割表、店舗ページの項目表10項目〔店名の決まった形・住所/geo/hasMap・直通か代表か・店ごとの営業時間・specialOpeningHoursSpecification・店ごとのサービスとdepartment・branchCode・parentOrganization〕、閉店・移転・一時休業の片付け順、本部Organizationと店舗LocalBusinessの @id と parentOrganization〔schema.org：branchOf は非推奨〕、店舗の一覧表（マスタ）の列、GBPの一括確認等はヘルプ参照（数字は書いていない）、WordPress手順〔設定は本部・営業時間を入れない注意・ページ専用FAQ・webmcp_canary_schema_graph の extra と org_id・店舗検索プラグインとの重複回避・llms.txt 30件と行の追加・wp nurevo export/import〕、店ごとの確かめ方、チェックリスト11、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261115-20 |
メモ：2026-11-15 20時の回は Google（LocalBusiness・AI features）、GBPヘルプ、schema.org を WebFetch の許可待ちで取得できなかった。Googleの記述は dental-clinic-ai-search（2026-10-29確認）の範囲だけ、schema.org の定義は schema-dts 2.1.0 で確認。GBPの一括確認の店舗数などは書いていない。
翻訳の残り（8時台で補完）：recruiting-page-ai-search・ai-visibility-drop-causes・research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search（ja/en のみ）。
次の候補：
1. 皮膚科・美容皮膚科のAI検索対策（保険診療と自費の書き分け、料金表示と限定解除）【業種別】
2. 写真館・フォトスタジオのAI検索対策（撮影プラン・データ納品・衣装・予約）【業種別】
3. 制作会社向け：AI検索対策の作業をお客様に引き継ぐ・解約するときの手順（設定の書き出し、出力の止め方、報告の締め方）【制作会社向け】
4. 代表者・専門家のプロフィールページのAI検索対策（Person・資格・経歴の書き方）【全業種】
5. フランチャイズ本部向け：加盟店サイトとAI検索（表記ルール・リンク・本部と加盟店の役割）【制作会社・本部向け】
| 2026-11-16 8時（月曜・書き直し） | llms-txt | スカイスクレイパー方式で全面書き直し（2026-10-23の短い版から）：llms.txtとは〔Answer.AI Jeremy Howard 2024-09-03の提案・robots.txt/sitemap.xml/構造化データとの違い表〕、効果について分かっていること表〔Google「AI機能とウェブサイト」＝新しいAI向けファイル不要・AI各社の公式説明なし・ステラジェントの自社ログ28日〔llms.txt 4回すべてAmazonbot、ChatGPT-User 18,553回で0回〕・Nurevo調査の設置率〔日本13.4%・海外26.4%〕・62件の調査で関係なし〕、サイト種類別の判断表、形式〔H1必須・引用・本文・H2リンク一覧・Optional、.md版とllms-full.txtは任意〕、BtoB/SaaSの例（コードブロック）、よくある間違い表、WordPressの置き方3つ〔手で置く・生成プラグイン・Nurevo AEO〕、Nurevo AEOの生成内容〔Key facts/Pages 30件/Products/Services・サイト種類で営業時間を出さない・「このページをllms.txtに載せない」・webmcp_canary_llms_txt_lines・llms-full.txtは作らない〕、公開後の確かめ方〔ブラウザ・curl -I・ログ・AEOスコア15点の4つの確認〕、チェックリスト10、FAQ 7問）。41言語（39言語は書き直した英語から再翻訳）。ビルドに section.code（<pre>）を追加 | 書き直し | content/daily-20261116-08 |
翻訳の補完ログ：2026-11-16 recruiting-page-ai-search に39言語を追加（41言語）。
翻訳の残り（8時台で補完）：ai-visibility-drop-causes・research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search（ja/en のみ）。
メモ：2026-11-16 8時の回は llmstxt.org・answer.ai・Google（AI features / AI optimization guide）・Ahrefs・Search Engine Journal・Chrome Lighthouse を WebFetch の許可待ちで取得できなかった。Googleの説明は 2026-10-30/11-01 に確認済みの範囲だけ、形式は提案の基本部分だけを書き、Ahrefs・SE Ranking等の第三者調査、Google担当者の発言、仕様の改訂（「v2」）、Lighthouseの llms.txt 監査は書いていない。次に更新するときに一次情報で確かめて足す。
次の候補：
1. 皮膚科・美容皮膚科のAI検索対策（保険診療と自費の書き分け、料金表示と限定解除）【業種別】
2. 写真館・フォトスタジオのAI検索対策（撮影プラン・データ納品・衣装・予約）【業種別】
3. 制作会社向け：AI検索対策の作業をお客様に引き継ぐ・解約するときの手順（設定の書き出し、出力の止め方、報告の締め方）【制作会社向け】
4. 代表者・専門家のプロフィールページのAI検索対策（Person・資格・経歴の書き方）【全業種】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-16 11時 | dermatology-clinic-ai-search | 皮膚科・美容皮膚科のAI検索対策（業種別。一般皮膚科と美容皮膚科の質問の型、上位記事の抜け4点、保険/自費の書き分け表5ページ〔厚労省Q&A A3-9/A3-18：承認品の自費は自由診療である旨と標準的な費用〕、自費の施術ページの型8項目〔限定解除：Q6-12 治療内容・費用・主なリスク副作用（短所1〜2個では不足）、Q6-10 問い合わせ先（予約専用・自動応答は不可）、Q6-11 見やすさ、Q2-14 承認外使用は未承認医薬品と同じ扱い〕、美容医療の検討会報告書〔2024-11-22：ネットパトロール強化・施術後の相談窓口〕、国民生活センターの相談件数〔2023年6,281・2024年10,744・2025年7,944、2026-05-31現在〕、口コミ・症例写真と一般的なAI対策の助言の衝突表〔Q1-18/Q2-9 体験談、Q2-8/Q3-14 術前術後写真、Q2-11 依頼していない第三者口コミは広告でない〕、構造化データ〔Dermatology＝MedicalBusinessの下位型・medicalSpecialty Dermatology/PlasticSurgery・Service+Offer・isAcceptingNewPatients、schema-dts 2.1.0で確認〕、WordPress手順〔ウィザード「クリニック・歯科」→業種欄を Dermatology・サービスに料金/所要時間・ページ専用FAQ・llms.txtから外す〕、webmcp_canary_business_node で medicalSpecialty を足すコード、チェックリスト10、測り方、MGMA 200件、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261116-11 |
メモ：2026-11-16 11時の回は厚労省の医療広告規制のページ・ガイドライン本体・schema.org・Google（AI features）を WebFetch の許可待ちで取得できなかった。限定解除の4条件は全文を書かず、Q&A（令和8年3月改定まで記載の版）で確認できた項目だけを書いた。未承認医薬品で書くべき項目（入手経路など）は書いていない。Googleの記述は dental-clinic-ai-search（2026-10-29確認）の範囲だけ。
翻訳の残り（8時台で補完）：ai-visibility-drop-causes・research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search（ja/en のみ）。
次の候補：
1. 写真館・フォトスタジオのAI検索対策（撮影プラン・データ納品・衣装・予約）【業種別】
2. 制作会社向け：AI検索対策の作業をお客様に引き継ぐ・解約するときの手順（設定の書き出し、出力の止め方、報告の締め方）【制作会社向け】
3. 代表者・専門家のプロフィールページのAI検索対策（Person・資格・経歴の書き方）【全業種】
4. 眼科・コンタクトのAI検索対策（検査の予約・処方箋・保険と自費のレーシック等）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
