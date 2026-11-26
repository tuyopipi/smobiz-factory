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
| 2026-11-16 14時 | person-profile-page-ai-search | 代表者・専門家・著者のプロフィールページのAI検索対策（全業種。人についての質問の型6つ〔名前なしの専門分野からの発見を含む〕、Googleの公式見解の表〔有用なコンテンツの作成 2026-10-05更新：正確な著者情報・バイラインを強く推奨、AI顔写真・作った名前・偽の資格は欺瞞、E-E-A-Tそのものはランキング要因ではない・Trustが最重要・YMYLで重み大／ProfilePage：主役が1人か1組織のページ・店のトップは対象外・必須 mainEntity と name・dateModified は人の編集のみ／AI機能に特別なマークアップ不要〕、上位記事でよく見る主張の根拠表〔「16%」等の割合はリンク・定義なし、Person必須説、sameAs多いほど良い説、名前だけの監修、最適な字数〕、役割別（代表者・専門家・著者・外部監修者）の置き場所とつなぎ方表、書く項目11と schema.org の対応〔name/alternateName・jobTitle/worksFor・hasCredential/EducationalOccupationalCredential・knowsAbout〔示唆するが意味しない〕・alumniOf・award・sameAs・image・dateModified、schema-dts 2.1.0で確認〕、1文目の型、医師等資格確認検索、著者と監修〔reviewedBy は author と別〕、AI下書きの開示、ProfilePage+Person の JSON-LD 例、WordPress手順〔表示名＝Nurevo独自グラフの BlogPosting の author、SEOプラグイン4種・ExUnit の Article/著者は変更しない、webmcp_canary_business_node で founder・webmcp_canary_schema_graph の extra で ProfilePage、二重出力の確認、llms.txt 30件〕、名前を入れた質問の記録表、チェックリスト11、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261116-14 |
メモ：2026-11-16 14時の回は Google の Article 構造化データ（著者のマークアップのベストプラクティス）、AI features、Rank Math の Author SEO を WebFetch の許可待ちで取得できなかった。Article の author.name/url の扱いは書いていない。AI features の記述は 2026-11-01 確認の範囲だけ。日弁連・税理士の検索サイトは確認できず、医師等資格確認検索（厚労省）だけリンク。
翻訳の残り（8時台で補完）：ai-visibility-drop-causes・research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search（ja/en のみ）。
次の候補：
1. 写真館・フォトスタジオのAI検索対策（撮影プラン・データ納品・衣装・予約）【業種別】
2. 制作会社向け：AI検索対策の作業をお客様に引き継ぐ・解約するときの手順（設定の書き出し、出力の止め方、報告の締め方）【制作会社向け】
3. 眼科・コンタクトのAI検索対策（検査の予約・処方箋・保険と自費のレーシック等）【業種別】
4. 記事・ブログのAI検索対策（AIに引用されやすい記事の書き方：答えの先出し・表・更新日・出典）【全業種】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-16 17時 | agency-aeo-client-handover | 制作会社向け：AI検索対策の契約を終える・引き継ぐときの手順（上位の引き継ぎ記事12本〔oflight・@SOHO×3・アイミツ・StockSun・Rocket.net・Seer・Chaser・White Label Coders・DEV/InstaRenewal・ManyRequests〕に抜けていたAI検索の項目6つの表、残す/止める/移すの選び方の表、AI向けの出力の一覧表〔構造化データを誰が足しているか・FAQ・llms.txt・robots.txt・ページごとの設定・自作のコード〕、Nurevo AEOを外すと消えるもの〔無料の出力は接続なしで動く・SEOプラグインのグラフに足した住所/電話/営業時間が消える・robots_txt フィルタ＝仮想robots.txt・アンインストールでページごとのメタまで全削除・Standard→同梱の基準で継続・利用規約第5条〕、書き出しに入る項目と入らないページごとの設定〔_nurevo_exclude_llms/_nurevo_exclude_schema/_nurevo_faq を wp post list で一覧〕、止めるもの表〔WP管理者・Google系は権限名を書かずヘルプ参照・ダッシュボードとペアリングコード・月次レポート・有料プランはお客様の判断・ウィジェット〕、引き継ぎ後の確かめ方、最初の契約書に入れること、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261116-17 |
メモ：2026-11-16 17時の回は support.google.com（Search Console の権限、GA4 のアクセス管理、ビジネスプロフィールのオーナー移行）を WebFetch の許可待ちで取得できなかった。権限の名前・待機期間・移行の手順は書かず「各サービスのヘルプで確認」とした。ICANN の移管ルールも書いていない。
翻訳の残り（8時台で補完）：ai-visibility-drop-causes・research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover（ja/en のみ）。
次の候補：
1. 写真館・フォトスタジオのAI検索対策（撮影プラン・データ納品・衣装・予約）【業種別】
2. 眼科・コンタクトのAI検索対策（検査の予約・処方箋・保険と自費のレーシック等）【業種別】
3. 記事・ブログのAI検索対策（AIに引用されやすい記事の書き方：答えの先出し・表・更新日・出典）【全業種】
4. フランチャイズ本部向け：加盟店サイトとAI検索（表記ルール・リンク・本部と加盟店の役割）【制作会社・本部向け】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-16 20時 | photo-studio-ai-search | 写真館・フォトスタジオのAI検索対策（業種別。家族の質問の型6つの表〔総額・受け取り方・衣装支度・時期・予約の条件・撮影の種類〕、上位記事〔uravation×2・renue・キャクル・@SOHO・aurant・PhotoBiz×3・Texta・LinkGraph〕の抜け、「持ち帰る総額」の表6項目と税込（国税庁6902）・早撮り割引は期間と対象を書き比較価格は価格表示ルールで確認、データ納品6項目〔枚数・形式・受け取り・保存期限・使い方・レタッチ〕、衣装・支度・撮影の種類の書き分け、時期のページは年度と期間・空きは予約システムへ・キャンセル表と体調不良FAQ、作例の代替テキストと掲載同意・ステマ規制、構造化データ〔写真館の型なし・Photographは作品・ProfessionalServiceは非推奨（schema-dts 2.1.0で確認）→ LocalBusiness＋Service/Offer〕とNurevoのService出力例（additionalProperty duration・ReserveAction）、WordPress手順〔ウィザード「その他」・「専門サービス」は選ばない・サービス最大20件・FAQ・ページ専用FAQ・昨年のページをllms.txtから外す〕、チェックリスト10、時期を分けた測り方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261116-20 |
メモ：2026-11-16 20時の回は schema.org・Google（AI features）・財務省・消費者庁（価格表示ガイドライン）を WebFetch の許可待ちで取得できなかった。Google・国税庁・消費者庁（ステマ）の記述は hair-salon-ai-search（2026-11-01確認）の範囲だけ。二重価格（比較対照価格・8週間）の具体的なルール、子どもの写真の肖像権・個人情報の法令、format.com の記事は書いていない／読めていない。
翻訳の残り（8時台で補完）：ai-visibility-drop-causes・research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search（ja/en のみ）。
次の候補：
1. 眼科・コンタクトのAI検索対策（検査の予約・処方箋・保険と自費のレーシック等）【業種別】
2. 記事・ブログのAI検索対策（AIに引用されやすい記事の書き方：答えの先出し・表・更新日・出典）【全業種】
3. フランチャイズ本部向け：加盟店サイトとAI検索（表記ルール・リンク・本部と加盟店の役割）【制作会社・本部向け】
4. 料理教室・習い事教室のAI検索対策（体験・月謝・振替・持ち物）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-16 調査 | research-prefecture-ranking-2026 | 都道府県別ランキング（所在地が分かる国内制作会社サイト2,098件、到達30件以上の23都道府県〔市区町村つき表記を都道府県にまとめた〕、6項目平均3.69 京都〜4.38 広島・llms.txt 5.9% 新潟〜22.5% 広島、カイ二乗検定で差ははっきりしない〔llms.txt p=0.36・5項目以上 p=0.56・JSON-LD p=0.79・地方別 llms.txt p=0.90〕、地方別6区分＋所在地不明388件、東京 vs 東京以外〔llms.txt 16.4% vs 12.8%〕、限界〔件数は収集リスト由来で事業者分布ではない〕） | raw_2026-11-12（summary_2026-11-12 と日本全体の値が一致） | ja/en | content/research-20261116 |
調査レポートの未着手の切り口（2026-11-16 時点）：WordPress と非WordPress／日本と海外の比較（総論）／国別（UK・US・AU・CA・DE・FR など）。AIクローラー（#77）・llms.txt（#83）・構造化データ（#89）は未マージPRあり。
| 2026-11-17 8時 | blog-articles-ai-citations | AIに引用される記事・ブログの書き方（全業種。AI別の「候補に入る条件」表〔Google：インデックス＋スニペット表示可・追加要件なし／OpenAI：OAI-SearchBot拒否で非表示／Perplexity：PerplexityBot・Perplexity-User〕、プレビュー制御（nosnippet・max-snippet等）を強くするほどAI機能での表示が限られる〔Google検索セントラル ブログ 2025-05-21〕、上位記事13本でよく見る主張と根拠の強さ表〔AI専用の書き方・GEO論文の数字（記事ごとに食い違い）・「44％が最初の30％」（原典なし）・Evertuneの中央値941語（ベンダー分析）・FAQ構造化データ・llms.txt〕、1記事1質問と質問の型6つの表〔地域・営業時間の質問は記事でなく事業の情報〕、抜き出しても意味が通る段落の型7つと書き直し例（架空の税理士事務所）、使われにくい記事のパターン8つ、更新日・著者・出典・AI利用の書き方〔Google有用なコンテンツ〕、WordPress手順〔NurevoのBlogPosting：抜粋→description・更新日時・表示名→author・アイキャッチ→image・SEOプラグインのArticleはそのまま・ページ専用FAQ・llms.txt 30件〕、公開後の確かめ方4つ〔生成AIパフォーマンスレポート・utm_source=chatgpt.com・ログ・質問の記録〕と62件調査、チェックリスト11、FAQ 7問）。41言語 | 全業種 | content/daily-20261117-08 |
翻訳の補完ログ：2026-11-17 ai-visibility-drop-causes に39言語を追加（41言語）。
翻訳の残り（8時台で補完）：research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search（ja/en のみ）。
メモ：2026-11-17 8時の回は Google（AI features・AI optimization guide・publication dates）、OpenAI・Perplexity のクローラのページ、arXiv（GEO論文）、growth-memo.com を WebFetch の許可待ちで取得できなかった。Google の検索セントラル ブログ（2025-05-21）だけ当日確認。他の公式の記述は既存ガイドで確認済みの範囲だけ。GEO論文の数字・「44.2%」・チャンク分割についてのGoogleの記述・FAQリッチリザルトの変更日は書いていない（「確かめられなかった」と明記）。
次の候補：
1. 眼科・コンタクトのAI検索対策（検査の予約・処方箋・保険と自費、多焦点眼内レンズ）【業種別】
2. フランチャイズ本部向け：加盟店サイトとAI検索（表記ルール・リンク・本部と加盟店の役割）【制作会社・本部向け】
3. 料理教室・習い事教室のAI検索対策（体験・月謝・振替・持ち物）【業種別】
4. 制作会社向け：ブログ記事のAI検索向けリライトを月額サービスにする方法（記事の棚卸し・統合・更新日の運用）【制作会社向け】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-17 11時 | eye-clinic-ai-search | 眼科のAI検索対策（業種別。患者・家族の質問の型6つ〔地域×症状・コンタクト・白内障・子どもの近視・屈折矯正・検査と予約〕、上位記事（日本語5本〔uravation×2・0120.co.jp・assist-all・koukoku.jp〕・英語6本〔Specialty Vision・Texta・Medical Marketing Firm・Healio・EyeSmart・Officite〕）に眼科特化の日本語記事なし・出典のない「レビュー50件・星4.5」「約40%」、保険・選定療養・自費の書き分け表5行〔多焦点眼内レンズ＝令和2年4月から選定療養・追加分は全額自己負担・病院例 234,300〜272,800円（片眼・税込）／低濃度アトロピン点眼 2024-12-27承認（薬事日報）・医療機関例：5〜15歳・検査は保険・薬は自費30日5,000円〕、自費ページの型7項目〔医療広告Q&A Q6-10/11/12〕、コンタクト：処方は医院・販売は販売店〔消費者庁 2021-09-10 高度管理医療機器・カラー含む／政府広報 104件 2014-08〜2022-12・通販が半数以上／厚労省通知 2012-07-18 販売時の受診確認〕、口コミ・術後の見え方の衝突表、構造化データ〔Ophthalmology・Optometric（米国の検眼）・Optician（販売店）・medicalSpecialty、schema-dts 2.1.0で確認〕、WordPress手順〔業種欄 Ophthalmology・レンズ代をサービスに・ページ専用FAQ〕、medicalSpecialty のフィルター、チェックリスト10、測り方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261117-11 |
メモ：2026-11-17 11時の回は、選定療養の厚労省の告示・通知そのもの、消費者庁のレーシック注意喚起（2013年）を確認できなかったため書いていない。多焦点の費用と低濃度アトロピンの扱いは「1つの医療機関の例」として書いた。医療広告Q&Aは 2026-11-16 確認の範囲、Google は 2026-10-29 確認の範囲。
翻訳の残り（8時台で補完）：research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search（ja/en のみ）。
次の候補：
1. フランチャイズ本部向け：加盟店サイトとAI検索（表記ルール・リンク・本部と加盟店の役割）【制作会社・本部向け】
2. 料理教室・習い事教室のAI検索対策（体験・月謝・振替・持ち物）【業種別】
3. 制作会社向け：ブログ記事のAI検索向けリライトを月額サービスにする方法（記事の棚卸し・統合・更新日の運用）【制作会社向け】
4. 耳鼻咽喉科・小児科のAI検索対策（予約・発熱外来・対象年齢）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-17 14時 | franchise-headquarters-ai-search | フランチャイズ本部のAI検索対策（制作会社・本部向け。お客様と加盟検討者の質問の型6つの表、ブランディングワークス調査〔PR TIMES 2026-10-12：ChatGPT/Gemini API・有効54件、ChatGPTの89%がブランド名なし、引用元上位は比較サイト web-repo.jp 8.8%・entrenet.jp 7.7%、切り口「初期費用の安さ」35.2%、調査会社がLLMO支援を販売・小規模〕、上位記事（日本語〔キャククル×2・Aurant・assist-all・PR TIMES×2〕・英語〔Reshift Media・Uberall・BizIQ・AirOps・Franchising.com・AI Growth Agent〕）の抜け6点の表、直営店と加盟店の書き分け表6項目〔運営会社・価格・支払い・窓口・返品苦情・求人〕、構造化データ〔schema-dts 2.1.0：subOrganization＝子会社などの包含関係・franchise系プロパティなし→加盟店は brand=本部・parentOrganization=運営会社＋legalName、直営は parentOrganization=本部、branchCode〕とJSON-LD例、加盟募集ページの項目表7〔費用内訳・ロイヤルティ・契約・店舗数は直営/加盟別で日付・モデル収支の前提・支援・募集エリア〕と法定開示書面に合わせる、Franchising.com（2025-11-30）、本部・加盟店・制作会社の役割表、譲渡時の同日変更、WordPress手順〔webmcp_canary_schema_graph で brand/parentOrganization を出し分けるPHP、加盟募集ページ専用FAQ、llms.txt、設定の書き出し/読み込み〕、2種類の質問の記録表、チェックリスト11、FAQ 7問、パートナー導線）。2言語（ja・en） | 制作会社・本部向け | content/daily-20261117-14 |
メモ：2026-11-17 14時の回は 公正取引委員会（フランチャイズ・ガイドライン）、e-Gov（中小小売商業振興法）、JFA、Googleビジネスプロフィールのガイドライン、schema.org を WebFetch の許可待ちで取得できなかった。法定開示の項目・条文番号・販売価格の制限のルール・GBPのオーナーの決まりは書かず「原文で確認」とした。schema.org の定義は schema-dts 2.1.0 で確認。Google の記述は 2026-10-29 確認の範囲だけ。franchise.org の記事はリダイレクトのループで読めず。
翻訳の残り（8時台で補完）：research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search（ja/en のみ）。
次の候補：
1. 料理教室・習い事教室のAI検索対策（体験・月謝・振替・持ち物）【業種別】
2. 制作会社向け：ブログ記事のAI検索向けリライトを月額サービスにする方法（記事の棚卸し・統合・更新日の運用）【制作会社向け】
3. 耳鼻咽喉科・小児科のAI検索対策（予約・発熱外来・対象年齢）【業種別】
4. 比較サイト・ポータルに載っている自社情報の直し方（求人・飲食・フランチャイズのポータル、更新依頼の出し方）【全業種】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-17 17時 | lesson-studio-ai-search | 習い事教室（ピアノ・料理・書道・華道・茶道・手芸など、自宅教室を含む）のAI検索対策（業種別。生徒・保護者の質問の型6つの表、上位記事（uravation×3〔音楽教室・スクール・英会話〕・coeteco〔ドローンスクール〕・Texta〔ピアノ〕・bili-ai〔音楽教室〕・trakkr〔質問例〕、firstsalesは中身なし）の抜け〔振替・休会・退会、1年の総額、自宅教室の住所、構造化データの形、WordPress、測り方〕と出典なしの「口コミ50件・星4.5」、1年の総額の表6項目〔月謝の回数と時間・入会金・教材費/材料費・発表会/検定・楽器/道具・総額の例〕と税込（国税庁6902）、振替・休会・退会のリスト、特定継続的役務提供（京都府 2025-04-30更新：7役務・外国語会話教室/学習塾/家庭教師/パソコン教室は2か月超・5万円超・クーリング・オフ8日、料理・音楽は対象外）、体験と講師（資格は発行団体名）、自宅教室の住所の4つの形の表と「本文にない番地を構造化データに入れない」・Googleのリッチリザルトは住所必須、構造化データ〔schema-dts 2.1.0：習い事専用の型なし・EducationalOrganizationは学校向けでLocalBusinessではない・Course/CourseInstance courseMode はNurevo非出力〕と住所なしのService出力例、WordPress手順〔「その他」・住所欄を空けても電話か営業時間があればLocalBusiness（webmcp_canary_business_schema_type）・コース名に回数と時間・体験ページ専用FAQ〕、チェックリスト9、時期を分けた測り方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261117-17 |
メモ：2026-11-17 17時の回は 消費者庁（特定商取引法ガイド）、Googleビジネスプロフィールのガイドライン、Google の LocalBusiness・Course info・検索セントラル ブログ（2025-06 の検索結果の簡素化）を WebFetch の許可待ちで取得できなかった。特定継続的役務提供は京都府のページだけで確認（中途解約の上限額は本文に書いていない）。GBPで住所を非表示にする条件・Course info のリッチリザルトの現状は書かず「ガイドラインで確認」とした。Google の記述は 2026-10-29〜11-01 確認の範囲だけ。
翻訳の残り（8時台で補完）：research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search（ja/en のみ）。
次の候補：
1. 制作会社向け：ブログ記事のAI検索向けリライトを月額サービスにする方法（記事の棚卸し・統合・更新日の運用）【制作会社向け】
2. 耳鼻咽喉科・小児科のAI検索対策（予約・発熱外来・対象年齢）【業種別】
3. 比較サイト・ポータルに載っている自社情報の直し方（求人・飲食・フランチャイズのポータル、更新依頼の出し方）【全業種】
4. 結婚相談所のAI検索対策（料金の内訳・特定継続的役務提供・成婚の定義）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-17 20時 | b2b-saas-ai-search | BtoB・SaaSのAI検索対策（業種別。買い手の質問の型6つの表〔カテゴリ・条件・比較・料金・乗り換え・社名〕と答えるページ、TaTap調査〔2026-11、n=135：62.2%が生成AIに「おすすめの会社」を質問・27.4%が名前の出ない会社を外す/優先度を下げる、支援会社の小規模調査と明記〕、上位記事13本〔jinrai×2・uravation・0120.co.jp・ITreview labo（PR記事）・TaTap／TripleDart・Superlines・Texta・Rock The Rankings・Discovered Labs・Pepper・Linkflow〕でよく見る主張と根拠の強さ表〔CVR何倍・7割がAIで調べ始める等は使わない〕、料金ページの項目表8〔課金単位・プラン差・初期費用/最低契約・税込税抜・トライアル・オプション・見積もり制の決まり方と下限・更新日〕、導入事例の項目表8〔業種規模・部署・課題・選定条件・機能・期間・結果と測り方・時点〕、比較/乗り換えページ（同じ条件・確認日と出典・向かない条件）、連携/対応環境/セキュリティ/サポート、レビューサイト（掲載情報の更新・ステマ規制 2023-10-01）、JavaScript描画とOAI-SearchBot/PerplexityBot、構造化データ〔Organization＋SoftwareApplication（CreativeWork・WebApplication下位型、schema-dts 2.1.0）/Service、NurevoのSoftwareApplication出力例・作った評価を出さない・Googleのリッチリザルト要件は原文で〕、llms.txt（Pricing/Case studies の Key facts 出力例）、WordPress手順〔サイト種類「BtoB・SaaS」・BtoBで使える型・サービス最大20件と「ソフトウェア（SaaS・アプリ）です」・カテゴリが計測の質問になる・料金/導入事例ページURL・診断の4要件〕、社名なし/ありの記録表、チェックリスト11、FAQ 7問、パートナー導線）。2言語（ja・en） | 業種別 | content/daily-20261117-20 |
メモ：2026-11-17 20時の回は Google（ソフトウェアアプリの構造化データ・AI features）、OpenAI・Perplexity のクローラのページ、schema.org、消費者庁を WebFetch の許可待ちで取得できなかった。これらの記述は既存ガイドで確認済みの範囲（2026-10-31〜11-10）と schema-dts 2.1.0 だけ。ソフトウェアアプリのリッチリザルトの要件、比較広告の法令、各レビューサイトの謝礼つきレビューのルールは書かず「原文で確認」とした。funnel-ai.jp の記事は別ホストへのリダイレクトで読めず。
翻訳の残り（8時台で補完）：research-wordpress-seo-plugins-2026・pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search（ja/en のみ）。
次の候補：
1. 制作会社向け：ブログ記事のAI検索向けリライトを月額サービスにする方法（記事の棚卸し・統合・更新日の運用）【制作会社向け】
2. 耳鼻咽喉科・小児科のAI検索対策（予約・発熱外来・対象年齢）【業種別】
3. 比較サイト・ポータルに載っている自社情報の直し方（求人・飲食・フランチャイズ・SaaSレビューサイト、更新依頼の出し方）【全業種】
4. 結婚相談所のAI検索対策（料金の内訳・特定継続的役務提供・成婚の定義）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-17 調査 | research-us-web-agencies-ai-search-2026 | 国別レポート1本目：米国（到達4,472件〔うちHTTP 202が671件、202を除いた値も併記〕、llms.txt 23.1%〔日本13.4%・202除く27.2%〕、JSON-LD 69.0%〔日本69.4%〕、6項目すべて18.9%〔日本10.4%〕、AIボットのブロック4.3%〔147/3,404、日本1.3%〕、ボット別表〔学習用3〜4%台・OAI-SearchBot/Claude-SearchBot/PerplexityBot 0.3%〕、GPTBotブロック128件中119件がOAI-SearchBotは許可、7ボット同一の組み合わせ93/159、英国・カナダ・豪州・米国以外の海外との比較表、WordPress 74.5%・SEOプラグイン別 llms.txt〔AIOSEO 53.4%・Rank Math 38.2%・Yoast 28.0%〕、6項目の分布、カイ二乗 p<0.001）。PR TIMES 用リリース文を PR 本文に記載 | raw_2026-11-12（summary.byCountry.US と一致） | ja/en | content/research-20261117 |
調査レポートの未着手の切り口（2026-11-17 時点）：WordPress と非WordPress／日本と海外の比較（総論）／国別（UK・AU・CA・IN・FR・ES など。米国は公開済み）。AIクローラー（#77）・llms.txt（#83）・構造化データ（#89）は未マージPRあり。
| 2026-11-18 8時 | marriage-agency-ai-search | 結婚相談所のAI検索対策（業種別。婚活中の人の質問の型6つの表〔年代・状況×地域／総額／成婚の定義／会員と出会いの数／解約・休会／安心〕、上位記事（日本語〔uravation（2026-08-27）・PR TIMES ブランディングワークス調査（2026-10-03：gpt-5.1/gemini-3.1-pro API・1問×60回・引用元1位24.9%・2位18.2%はランキング/比較サイト）・みんなの結婚相談所（2026-10-27）・オリコン料金・スペースシップアース〕・英語〔Texta（2025-03・出典なし「口コミ50件」）・SEO Design Chicago・5W Dating App Index（2026-10-30更新：AI Overviews 41件中25件で reddit 引用）・eSEOspace・Hall・TechRadar〕）の抜け、「入会から成婚までの総額」の表6項目と税込（国税庁6902）、成婚の定義の書き方4点（定義は各社で違う：交際開始〜婚約〜退会届）と実績の分母・期間、自社と連盟の会員数の分け方の表、特定継続的役務提供（大阪府FAQ 2024-05-14更新：2か月超・5万円超・8日・中途解約上限 サービス前3万円／開始後 対価＋2万円か残額2割の低いほう、広島県 2024-08-01更新で同じ上限・契約金額に入会金と関連商品）、入会書類・認証（大阪府 2026-05-29更新：IMS認証・マル適マークCMS）・体験談とステマ規制、構造化データ〔schema-dts 2.1.0：専用の型なし・ProfessionalService非推奨・memberOfはあるがNurevo非出力〕と無料カウンセリングのService出力例、WordPress手順〔「その他」・「専門サービス」は選ばない・サービス最大20件と説明欄に内訳・料金ページ専用FAQ・終わったイベントをllms.txtから外す〕、チェックリスト10、改定前後で分けた測り方、FAQ 7問）。41言語 | 業種別 | content/daily-20261118-08 |
翻訳の補完ログ：2026-11-18 research-wordpress-seo-plugins-2026 に39言語を追加（41言語）。
メモ：2026-11-18 8時の回は 国税庁6902（許可待ちで取得できず）・Google AI features・消費者庁ステマは 2026-11-01 確認の範囲だけ。消費者庁の特定商取引法ガイド、概要書面・契約書面の記載事項、成婚率の広告表示のルールは確認できなかったため書いていない。国民生活センターの「消費者トラブル解説集」は 2026-09-07 で終了していた。ekitan.com・datingnews.com は読めず。
翻訳の残り（8時台で補完）：pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search（ja/en のみ）。
次の候補：
1. 制作会社向け：ブログ記事のAI検索向けリライトを月額サービスにする方法（記事の棚卸し・統合・更新日の運用）【制作会社向け】
2. 耳鼻咽喉科・小児科のAI検索対策（予約・発熱外来・対象年齢）【業種別】
3. 比較サイト・ポータルに載っている自社情報の直し方（求人・飲食・フランチャイズ・SaaSレビュー・結婚相談所の比較サイト、更新依頼の出し方）【全業種】
4. 探偵事務所・興信所のAI検索対策（届出番号・料金の内訳・調査の範囲）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-18 11時 | detective-agency-ai-search | 探偵事務所・興信所のAI検索対策（業種別。依頼者の質問の型6つの表〔調査の種類×地域／料金／届出・信頼／引き受ける範囲／報告と書類／秘密・解約〕、上位記事〔Uravation 探偵LLMO（2026-09）・Texta（2025-03・出典なし「口コミ100件」）・ClickSlice 英国NPI事例（3.9%→30.6%、測り方の記載なし）・seolocal・Insites〕の抜け、2024-04-01施行の改正〔届出証明書の廃止→自作の標識をA4白地黒字で営業所とサイトに掲示、従業者5人以下・サイトなしは免除、役員・個人事業主は数えず事務員は数える、外部委託でも免除なし、受理番号へ名称変更〕（神奈川・長野・茨城県警）、標識の載せ方の表と文字でも書く、料金は第8条「概算額及び支払時期」に合わせた見積もりの例の表6項目と税込、扱う調査と引き受けない依頼（第2・7・9条）、相談〜報告の流れと第8条1項9項目・2項8項目の対応表、秘密（第10条）と事例の匿名化、国民生活センター2016の注意喚起（消費生活センターに似た名乗り・警察と連携の虚偽・高額解約料）、構造化データ〔専用の型なし・ProfessionalService非推奨（schema-dts 2.1.0）〕と無料相談のService出力例、WordPress手順、チェックリスト10、時期を分けた測り方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261118-11 |
メモ：2026-11-18 11時の回は 探偵業法の条文を衆議院の制定法律ページ（2006年制定時）で確認し、改正点は県警の案内で補った。e-Gov の現行条文、探偵契約のクーリング・オフ、広告での届出番号表示の義務、探偵向けの広告規制は確認できず書いていない。国民生活センターの旧FAQ（t_box）は 2026-09-07 で終了。mandr-group は読めず。
翻訳の残り（8時台で補完）：pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search（ja/en のみ）。
次の候補：
1. 制作会社向け：ブログ記事のAI検索向けリライトを月額サービスにする方法（記事の棚卸し・統合・更新日の運用）【制作会社向け】
2. 耳鼻咽喉科・小児科のAI検索対策（予約・発熱外来・対象年齢）【業種別】
3. 比較サイト・ポータルに載っている自社情報の直し方（更新依頼の出し方）【全業種】
4. 引越し業者のAI検索対策（見積もりの種類・標準引越運送約款・繁忙期）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-18 14時 | agency-content-refresh-service | 制作会社が既存記事のAI検索向けの見直しを月額サービスにする方法（制作会社向け。上位記事13本〔jinrai GEOリライト（2026-11-10）・GMO AIかんたん集客×2（2026-11-16）・StockSun・AI革命（サービスページ）／AirOps（2026-10-13）・Winston Digital（2026-06-14）・Frase（2026-04-30）・Quattr（2026-05-15）・Digital Applied（2026-10-04）・The Rank Masters〕の抜け6点の表、棚卸し（スポット）＋毎月の見直し＋前後の報告の3区分、棚卸しの表の10列〔答えている質問・時点のある事実・Search Console と生成AIパフォーマンスレポートのページ別表示〕、判定5つ〔残す・更新・書き直し・統合（301で寄せ内部リンク付け替え）・外す（承認制）〕、Googleの日付ガイド〔2026-02-20更新：公開日か大きな変更日を推定・ラベル付きの表示日付と datePublished/dateModified の一致・未来日不可・表示保証なし〕、WordPressは保存のたびに更新日時が変わる→NurevoのBlogPosting dateModified も同じ日時、作業別の更新日の表、Nurevo の llms.txt は更新日時の新しい順に30件→保存で入れ替わる、前後の比べ方の表〔同じ期間・同じ質問・同じ回数、utm_source=chatgpt.com、無料AIチェック3問/月〕、成果を保証しない契約の文例4つ、判定ごとの時間で積み上げる価格、WordPress手順、チェックリスト11、FAQ 7問、パートナー導線）。2言語（ja・en） | 制作会社向け | content/daily-20261118-14 |
メモ：2026-11-18 14時の回は Google の creating-helpful-content・spam-policies・301-redirects・consolidate-duplicate-urls・HTTPエラーのページを WebFetch の許可待ちで取得できなかった。スパムポリシーの中身、転送の種類、404/410、正規URLの強さは書かず「原文で確認」とした。helpful content の記述は 2026-11-16 確認の範囲だけ。funnel-ai.jp は別ドメインへのリダイレクトで読めず。
翻訳の残り（8時台で補完）：pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service（ja/en のみ）。
次の候補：
1. 耳鼻咽喉科・小児科のAI検索対策（予約・発熱外来・対象年齢）【業種別】
2. 引越し業者のAI検索対策（見積もりの種類・標準引越運送約款・繁忙期）【業種別】
3. 比較サイト・ポータルに載っている自社情報の直し方（更新依頼の出し方）【全業種】
4. 税理士・社労士事務所のAI検索対策（顧問料の内訳・対応地域・業種の得意分野）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-18 17時 | perplexity-citations | Perplexityに自社サイトが引用される仕組みと確かめ方（全業種。公式の資料にあること・ないことの表7行〔PerplexityBot＝検索結果に出してリンク・Perplexity-User＝質問時に取得し robots.txt を一般に無視・学習には使わない・反映最大24時間・IP範囲JSON／出典の選び方・件数・Bing依存は非公開・未確認〕、上位記事13本〔fyve・alejandrorioja・jinrai・0120.co.jp×2・GMO koukoku.jp／Pepper・Discovered Labs・LLM Pulse・Texta・Fuel Online・Wix Studio・NAV43〕の主張と根拠の強さ表〔候補数5〜10/約10/20〜50の食い違い・採点の重み・Reddit 46.7%の出典と対象の食い違い・引用までの日数は使わない〕、2つのクローラーの比較表、robots.txt の例とグループ内で全体の決まりを書き直す理由、WAF/CDN はUAとIP範囲の両方で、Cloudflareの報告〔2025-08-04：名乗らないクローラー・確認済みボットから除外／Perplexityは反論（PC Gamer 2025-08-05）、件数は書かない〕、ページ側の手入れ6点、62事業者調査（ρ=0.03）、WordPress手順〔仮想 robots.txt と実ファイルの優先・Nurevoの許可設定・WAF/セキュリティプラグイン・curl/アクセスログで確認〕、3つの確かめ方の表、無料AIチェック（月3問・社名なし）とPro（最大20問×1〜3回・出典順は出典一覧の順）、チェックリスト10、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261118-17 |
メモ：2026-11-18 17時の回は Cloudflare のブログが途中で切れたため、リクエスト数・ドメイン数は書いていない。Perplexity の2つの資料でUAの例とIP範囲のドメイン（perplexity.com / perplexity.ai）が違うため「最新のページで確認」とした。Perplexity の Publishers Program、有料プランでの出典の違い、Bing の利用は確認できず書いていない。
翻訳の残り（8時台で補完）：pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations（ja/en のみ）。
次の候補：
1. 引越し業者のAI検索対策（見積もりの種類・標準引越運送約款・繁忙期）【業種別】
2. 比較サイト・ポータルに載っている自社情報の直し方（更新依頼の出し方）【全業種】
3. Google の AI モード・AI による概要に出典として出る仕組み（公式の説明と確かめ方）【全業種】
4. 耳鼻咽喉科のAI検索対策（予約・アレルギー・子どもの受診）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-18 20時 | google-ai-overviews-citations | GoogleのAIによる概要・AIモードに出典として出る条件と確かめ方（全業種。Googleの資料にあること・ないことの表7行〔AI機能とウェブサイト 2025-12-10更新：インデックス＋スニペット付きで表示できること・追加要件なし・クエリ・ファンアウト・出ない検索も多い・特別なファイル/schema不要・「ウェブ」に含めて集計／最適化ガイド 2026-07更新：Search Consoleの「検索の生成 AI」設定で含まれていること・llms.txtはGoogle検索が無視・チャンク不要・AEO/GEOもSEO〕、上位記事8本〔Ahrefs×3・Souzoh／LLM Pulse・The HOTH・WebFX・Contently、Surfer・Previsibleは転送先が読めず〕の主張と根拠の強さ表〔Ahrefs自社調査 76.10%が上位10位（2025）は傾向として、40〜60語・ドメイン別シェアは使わない〕、ファンアウトの例と小さな質問ごとの答え、Search Consoleでの前提確認表5行、表示を制限する設定の表7行〔robots.txt・noindex・nosnippet・max-snippet・data-nosnippet・検索の生成AI設定・Google-Extendedは「その他のシステム」向け〕とコード例、しなくていいこと4点とスパムポリシー、ページ側の6点、ビジネスプロフィール/Merchant Center の表、WordPress手順〔表示設定のnoindex・SEOプラグイン・robots.txt・WAF・Nurevoの構造化データは本文と一致・URL検査〕、確かめ方の表〔生成AIパフォーマンスレポート・ウェブ・手での記録〕、Nurevoの無料AIチェックはPerplexityでGoogleは測らないと明記、チェックリスト10、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261118-20 |
メモ：2026-11-18 20時の回は Google の robots メタタグのページと一般的なクローラー（Google-Extended）のページを WebFetch の許可待ちで取得できなかった。nosnippet などは名前と「AI機能とウェブサイト」の記述の範囲だけ書き、Google-Extended がAIによる概要に影響するかは「その他のシステム向け」という記述だけにした。最適化ガイドの「AIのための書き直し」「不自然な言及」の項は要約でしか読めず書いていない。AIモードの提供国、CTRの調査、ドメイン別の引用シェアは書いていない。Ahrefs の英語版URLは確認できず、英語ページも日本語版にリンク。
翻訳の残り（8時台で補完）：pharmacy-ai-search・agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations（ja/en のみ）。
次の候補：
1. 引越し業者のAI検索対策（見積もりの種類・標準引越運送約款・繁忙期）【業種別】
2. 比較サイト・ポータルに載っている自社情報の直し方（更新依頼の出し方）【全業種】
3. Gemini アプリ・Claude に自社が出る仕組み（公式の説明と確かめ方）【全業種】
4. 耳鼻咽喉科のAI検索対策（予約・アレルギー・子どもの受診）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-18 調査 | research-uk-web-agencies-ai-search-2026 | 国別レポート2本目：英国（掲載1,555件中到達942件〔うちHTTP 202が140件、202を除いた値も併記〕、llms.txt 21.5%〔203件、日本13.4%・米国23.1%・202除く25.3%〕、JSON-LD 68.8%、6項目すべて17.7%〔日本10.4%〕、AIボットのブロック4.7%〔33/699、日本1.3%〕、ボット別表〔学習用3.9〜4.7%・OAI-SearchBot 1件・PerplexityBot/Claude-SearchBot/ChatGPT-User 0件〕、GPTBotブロック28件すべてOAI-SearchBotは許可、7ボット同一の組み合わせ27/35、構造化データの型〔英・米・日〕、WordPress 73.4%・Yoast 58.0%・Rank Math 20.7%〔AIOSEO 25件・SEOPress 4件は30件未満で省略〕、6項目の分布、カイ二乗：対日本 p<0.001・対米国は差なし〔p=0.31〕）。PR TIMES 文なし（国別の初回ではないため） | raw_2026-11-12（summary.byCountry.GB と一致） | ja/en | content/research-20261118 |
| 2026-11-19 8時 | moving-company-ai-search | 引越し業者のAI検索対策（業種別。AIに聞かれる質問6つと書く場所の表、上位記事8本〔uravation 2026-08-15・起業LOG 2026-08-07／Movers Development×2・The Mover〔冒頭のみ〕・CallRail・Netpeak〔15〜25%は筆者の推定〕・ThinkProfits〕の抜け〔構造化データの例・WordPress手順なし、料金表が空欄、数字の出典なし〕、標準引越運送約款〔国交省：2018-06-01施行、キャンセル・延期料の上限 当日50%・前日30%・前々日20%、積合せにも適用〕と兵庫県の消費者向け資料〔2019-02：見積料・内金なし、3日前の確認、破損は3か月以内に申し出、下見をすすめる、見積額は業者の都合で増やせない〕、キャンセル料の書き方表、条件つきの料金の例の書き方、税込表示〔国税庁6902〕、対応エリア・補償、引越安心マーク〔全ト協・2014年度創設、Gマーク等の要件〔九州運輸局〕、2025年度41社認定・有効期間2026-01-01〜2028-12-31・計348社1,673事業所〔LOGISTICS TODAY 2025-12-22〕〕、MovingCompany＋areaServed〔schema-dts 2.1.0〕のJSON-LD例、WordPress手順〔ウィザード「その他」＋業種欄に MovingCompany、webmcp_canary_business_node で areaServed を足すPHP、無料見積もりを Service 0円〕、一括見積もりサイトとのそろえ方、チェックリスト9、測り方、FAQ 7問）。41言語 | 業種別 | content/daily-20261119-08 |
メモ：2026-11-19 8時の回は 国交省の標準約款のページ（jidosha_tk4_000009、令和6年6月1日施行の版へのリンク先）と全日本トラック協会の認定事業者名簿のページを WebFetch の許可待ちで取得できなかった。2024年の改正が引越の約款に及ぶかは確認できず、2018年施行の値だけを書き「自社で使っている約款の値を書く」とした。約款の条文番号、見積書の交付義務の条文、下見費用の扱い、繁忙期の需要の数字、不用品回収の許可は書いていない。3日前の確認・3か月の申し出期限は兵庫県の資料の要約による。翻訳の補完：pharmacy-ai-search に39言語を追加（41言語）。
翻訳の残り（8時台で補完）：agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations（ja/en のみ）。
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（更新依頼の出し方）【全業種】
2. Gemini アプリ・Claude に自社が出る仕組み（公式の説明と確かめ方）【全業種】
3. 耳鼻咽喉科のAI検索対策（予約・アレルギー・子どもの受診）【業種別】
4. 制作会社向け：AI検索対策の提案書と見積もりの作り方（項目と工数の目安の出し方）【制作会社向け】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-19 11時 | ent-clinic-ai-search | 耳鼻咽喉科のAI検索対策（業種別。AIに聞かれる質問の型6つの表〔地域×症状×時間・花粉症の時期・舌下免疫療法・聞こえと補聴器・めまい耳鳴り・手術と紹介〕、上位記事8本〔0120.co.jp aio-142（2026-10-20更新）・uravation 医療クリニック（2026-09-05）・お名前.com MEO（2025-07、AI言及なし）／Texta ENT（日付・出典なし）・Officite（2026-09-23）・Netpeak（2025-11）・Emulent（出典なしの63〜84%）・AAO-HNS Bulletin（2026-06、臨床・請求中心）〕の抜け、季節の受付変更を期間つきで書く表、舌下免疫療法〔2014年から保険適用（日本医事新報）、スギはシーズンを外して開始・ダニは原則制限なし（日本耳鼻咽喉科免疫アレルギー感染症学会 委員会 2023-07）、シダキュア 2017-09承認・成人及び小児・治験5〜64歳（鳥居薬品）、ミティキュア 2018-02 小児追加承認で12歳以上の制限なし（日刊薬業）、シダキュア限定出荷2023〜・2025秋から段階増（薬事日報 2025-02-14）、3年以上推奨は1病院の資料として〕、補聴器〔補聴器相談医＝日本耳鼻咽喉科頭頸部外科学会の委嘱・名簿、認定補聴器技能者・専門店＝テクノエイド協会（滋賀県・島根県）、医療費控除は補聴器相談医の「補聴器適合に関する診療情報提供書（2018）」（国税庁 2018-04-16）、医院と販売店を分ける〕、子どもの受診、医療広告Q&Aとぶつかる助言の表、構造化データ〔Otolaryngologic・Audiology は MedicalBusiness の下位、medicalSpecialty に Otolaryngologic/Audiology/Pediatric（schema-dts 2.1.0）〕、WordPress手順と medicalSpecialty のフィルター、チェックリスト10、測り方（花粉の時期と時期外の両方で）、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261119-11 |
メモ：2026-11-19 11時の回は 添付文書を読んでおらず、舌下錠の正確な下限年齢・治療期間の推奨は書かず「自院の方針として」とした。シダキュアの現在の出荷状況は確認できず、2025-02の報道の範囲だけ。日刊薬業・薬事日報・日本医事新報は会員向けで冒頭のみ読めた。補聴器相談医の名簿URLは島根県のページのリンク先（直接は未取得）。学会名は国税庁（2018）が旧称、県の案内が現称。
翻訳の残り（8時台で補完）：agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations・ent-clinic-ai-search（ja/en のみ）。
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（更新依頼の出し方）【全業種】
2. Gemini アプリ・Claude に自社が出る仕組み（公式の説明と確かめ方）【全業種】
3. 制作会社向け：AI検索対策を保守契約に組み込むときの作業範囲と月次報告の型【制作会社向け】
4. 産婦人科・婦人科のAI検索対策（分娩の予約時期・費用・出産育児一時金）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-19 14時 | gemini-claude-citations | GeminiアプリとClaudeに自社サイトが出典として出る仕組みと確かめ方（全業種。Geminiアプリ・Google検索のAI機能・Claudeを分ける表〔読むもの・管理する名前・止めたときの影響・出典の見え方〕、公式の資料にあること・ないことの表7行〔Google-Extended＝Geminiモデルの学習＋GeminiアプリとVertex AIのグラウンディング、Google検索の掲載・順位には影響なし、専用UAなし（Googleのクローラー一覧 2026-10-30更新）／Claudeの3つ：ClaudeBot学習・Claude-SearchBot索引・Claude-User質問時取得、3つとも robots.txt に従う・Crawl-delay対応・CAPTCHA回避なし・IP一覧 bots.json（Anthropicヘルプ）／ウェブ検索の提供元は非公開、画像検索はBing、Brave は TechCrunch 2025-03-21 の報道として／選び方は非公開〕、Perplexity-User との違い、上位記事10本〔jinrai（2026-11-18更新）・GMO koukoku.jp（2026-11-16更新）・crystal-method・SEOmator（独）／Moburst・Lilach Bullock・Saffron Edge・TripleDart・Nex.ad・Marie Haynes〕の主張と根拠の強さ表、目的別 robots.txt〔Claudeは検索用を通し ClaudeBot だけ止める例／Google-Extended は学習とグラウンディングを分けられない→Geminiアプリに出たいなら止めない、Googleは2027年初めにAIPREF対応予定、Anthropicは2026-10-30から aipref 信号を認識・ClaudeBot 名指しが優先〕、ページ側5点、WordPress手順〔Nurevo の学習用ブロックは Google-Extended も止める点を明記、実ファイル優先・WAF・curl・ログ（Google-Extended はログに出ない）〕、確かめ方〔Geminiの「ソース」ボタンは付かない回答もある・Claudeはウェブ検索時に出典・記録表5行、Nurevoの計測はPerplexityでGemini/Claudeは手で記録と明記〕、チェックリスト8、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261119-14 |
メモ：2026-11-19 14時の回は Anthropic のヘルプに更新日がなく（「2週間以上前に更新」）、2026-11-19 に読んだ内容で書いた。bots.json の中身は取得していない。Claude の新しい画面（切り替えなし）の提供範囲、プラン別のウェブ検索の可否、Gemini の「回答を再確認」機能は確認できず書いていない。Cloudflare Radar のシェア、クロールと送客の比、Claude の市場シェアは使っていない。AIPREF 対応後の Google-Extended の扱いは未公開。
翻訳の残り（8時台で補完）：agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations・ent-clinic-ai-search・gemini-claude-citations（ja/en のみ）。
次の候補：
1. 制作会社向け：AI検索対策を保守契約に組み込むときの作業範囲と月次報告の型【制作会社向け】（17時か20時で）
2. 産婦人科・婦人科のAI検索対策（分娩の予約時期・費用・出産育児一時金）【業種別】
3. 比較サイト・ポータルに載っている自社情報の直し方（更新依頼の出し方）【全業種】
4. AIの学習を止めて検索には出る robots.txt の書き方（ボット別一覧・AIPREF）【全業種】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-19 17時 | site-renewal-ai-search | サイトリニューアル・ドメイン変更でAI検索の出典を失わない手順（制作会社向け。上位記事12本〔uravation（2026-09-05更新）・jinrai（2026-11-10更新）・issoh（2026-11-16更新）・mobinc（2026-02-14）・MarkeZine（2025-05-29、1ページ目のみ）／Codal・MaxAEO・Vincent Schmalbach・Koozai・eSEOspace・Answerburst(Moburst)・BrightEdge〕の抜けの表、変更の種類5つ×必要な作業×アドレス変更ツールの表〔対象はドメイン・サブドメインの移転だけ〕、AI向けの棚卸し表6行〔AIで引用されているURL・AIからの流入・生成AIパフォーマンスレポート・構造化データ・llms.txt/robots.txt・事実の載ったページ〕、Googleのリダイレクトの決まり〔サイト移転 ja 2026-09-11更新：301/308・PageRankは失われない・1対1・トップへのまとめ転送はソフト404・404/410・10回まで追うが直接（5回未満・できれば3回以下）・1年以上・canonical/内部リンク/サイトマップ/hreflang・数週間以上・一度に1つ／リダイレクト 2026-11-16更新：恒久と一時の区分〕、Apache/nginx の例、ChatGPT・Perplexity・Claudeのリダイレクトの扱いは公式資料なしと明記、公開日の確認表6行〔robots.txt・CDN/WAF（Perplexityの反映最大24時間）・構造化データの旧URL・二重/空・llms.txt・事実〕、WordPress手順〔export/import〔キー等は入らない・ページごとの設定は入らない〕・wp search-replace --dry-run・Nurevoの「URL」設定が空なら home_url、入力済みなら旧ドメインが残る・サービス/予約URL・llms.txt は最大30件を今のパーマリンクで・仮想robots.txtと実ファイル・SEOプラグインとテーマの構造化データ〕、curl -sIL の確認、公開後の表〔アドレス変更ツール180日・旧ドメインを1年以上〕、日数の数字はMaxAEOの自社データのみで使わない、Nurevoの「引用」はホストで数えるためドメイン変更直後は旧ドメインを手で記録、見積もり・契約に入れること5点、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261119-17 |
メモ：2026-11-19 17時の回は stock-sun の記事を取得できなかった。Google「サイトを移転する」の英語版の更新日は確認できず、日本語版（2026-09-11）で確認した内容で書いた。Bing のサイト移動ツールと Bing の AI パフォーマンスレポートは一次資料を読めず書いていない。ChatGPT・Perplexity・Claude のリダイレクトの扱いは、公式資料が見つからなかった（eSEOspace・Schmalbach も未公開と記載）。AIが新URLを引用するまでの日数（MaxAEO 38件の自社データ）は数字を書かず、出典として紹介だけした。リニューアルの費用相場は書いていない。
翻訳の残り（8時台で補完）：agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations・ent-clinic-ai-search・gemini-claude-citations・site-renewal-ai-search（ja/en のみ）。
次の候補：
1. 産婦人科・婦人科のAI検索対策（分娩の予約時期・費用・出産育児一時金）【業種別】（20時で）
2. 比較サイト・ポータルに載っている自社情報の直し方（更新依頼の出し方）【全業種】
3. AIの学習を止めて検索には出る robots.txt の書き方（ボット別一覧・AIPREF）【全業種】
4. 制作会社向け：AI検索対策を保守契約に組み込むときの作業範囲と月次報告の型（PR #65・agency-aeo-monthly-service と重ならない切り口が見つかれば）【制作会社向け】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-19 20時 | faq-page-ai-search | FAQページとFAQ構造化データはAI検索に効くか（全業種。変わったこと・変わっていないことの表6行〔GoogleのFAQリッチリザルト 2026-05-07 表示終了・2023-08から政府/保健医療に限定（SEJ 2026-05-10・Search Engine Land）／Search ConsoleのFAQレポート・リッチリザルトテストは2026-06、APIは2026-08に終了と予告（TechWyseが引用するGoogleの告知、実施は未確認）／FAQPage型は有効・残しても問題なし／AI機能に特別な構造化データは不要・本文と一致（AI機能とウェブサイト、11-18確認）／ChatGPT・Perplexity・ClaudeがFAQPageを使うと明記した公式資料は見つからず〕、上位記事8本〔GMO koukoku.jp（2026-11-16更新、終了に触れず最優先のまま）・0120.co.jp aio-108（2026-10-19更新）・jinrai（2026-11-10更新）・issoh（2026-08-15、終了したテストを確認方法に勧める食い違い）／ThePlusAddons（2026-05-29）・Frase（2026-09-01更新）・NAV43（2026-05-25）・Contently（2026-03）〕の主張と根拠の強さ表、質問の集め方5つ、答えの悪い例・良い例の表、置き場所の表、FAQPageの決まりとJSON-LD例、既存マークアップを消さずに直す3点、WordPress手順〔Nurevo AIO 設定・「Nurevo AIO FAQ」ブロック・このページ専用の質問・SEOプラグインのFAQに足りない質問だけ足す・SEO SIMPLE PACK・Schema Markup Validator〕、測り方〔社名なしの質問を前後で記録、無料AIチェック・ProはPerplexity、62事業者調査 ρ=0.03〕、チェックリスト10、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261119-20 |
メモ：2026-11-19 20時の回は developers.google.com（FAQのドキュメント・検索の更新履歴・2023年のブログ）と schema.org を WebFetch の許可待ちで取得できなかった。2026年の終了と6月・8月の予告は SEJ・TechWyse が引用した Google の告知の文で書き、6月・8月の実施は「各ツールで確認」とした。2019年の開始日、QAPage との違い、答えの語数の目安、AIでの引用の倍率は書いていない。業種別は今日すでに2本（引越し・耳鼻咽喉科）のため、20時は全業種のテーマにした。
翻訳の残り（8時台で補完）：agency-aeo-first-audit-proposal・company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations・ent-clinic-ai-search・gemini-claude-citations・site-renewal-ai-search・faq-page-ai-search（ja/en のみ）。
次の候補：
1. 産婦人科・婦人科のAI検索対策（分娩の予約時期・費用・出産育児一時金）【業種別】（明日8時で）
2. 比較サイト・ポータルに載っている自社情報の直し方（PR #80 fix-wrong-ai-answers と重ならない「掲載先の一覧と更新依頼の文例」に絞れれば）【全業種】
3. 制作会社向け：AI検索対策の見積もり項目と工数の出し方（agency-aeo-first-audit-proposal と重ならない切り口で）【制作会社向け】
4. 料金ページをAIに正しく読ませる書き方（税込表示・条件つき料金・Offer）【全業種】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-19 調査 | research-au-web-agencies-ai-search-2026 | 国別レポート3本目：オーストラリア（掲載2,289件中到達1,719件〔うちHTTP 202が250件、202を除いた値も併記〕、llms.txt 24.3%〔418件、日本13.4%・米国23.1%・英国21.5%・NZ 25.4%・202除く28.4%〕、JSON-LD 71.3%、FAQPage 10.3%〔米国6.2%・p<0.001〕、6項目すべて20.8%〔日本10.4%の2.0倍〕、AIボットのブロック4.7%〔63/1,336、日本1.3%〕、ボット別表〔学習用3.4〜4.3%・検索/質問時用4種のどれかは5件0.4%〕、GPTBotブロック56件中55件がOAI-SearchBotは許可、7ボット同一の組み合わせ42/65、構造化データの型〔豪・米・英・日〕、WordPress 76.0%・Yoast 53.5%・Rank Math 22.8%・AIOSEO 5.6%〔SEOPress 12件は省略〕、6項目の分布、カイ二乗：対日本 p<0.001・対米英NZは差なし〔llms.txt p=0.32/0.12/0.68〕・豪州以外の海外より llms.txt やや低い p=0.04）。PR TIMES 文なし（国別の初回ではないため） | raw_2026-11-12（summary.byCountry.AU と一致） | ja/en | content/research-20261119 |
| 2026-11-20 8時 | obgyn-clinic-ai-search | 産婦人科・婦人科のAI検索対策（業種別。妊娠中の人と家族の質問の型6つの表〔分娩の予約・費用・無痛分娩・里帰り出産・妊婦健診だけ・婦人科外来〕、ChatGPTのクリニック検索5,460件の調査プレスリリース〔料金の質問で自院サイトが96%、調査会社自身の調査〕、上位記事13本〔jinrai（2026-11-10更新）・assist-all・uravation（2026-09-05更新）・0120.co.jp aio-142（2026-10-20更新）・shopowner-support（2026-11-06更新、AIに触れず）・stock-sun／texta.ai・medicalmarketingfirm・trakkr.ai・techmagnate・Single Grain・TMA（Officite）〕の抜けの表、分娩予約の書き方の表〔愛育病院 通常8〜9週・日赤医療センター 20週までを例に〕、費用〔出産育児一時金 50万円・22週未満48.8万円・直接支払制度（協会けんぽ）／健康保険法等の一部を改正する法律 2026-06-05公布：分娩の基本単価を現物給付＋一律の現金給付、公布から2年以内に政令で施行、当分の間は現行制度も可（厚労省概要・2026-10-01検討会資料）、開始日・金額は未定と明記〕、無痛分娩の公開9項目〔厚労省 自主点検表 令和7年5月版、JALAと自院サイト、年1回以上更新〕、出産なび〔2024-05-30開始・2026-02-20時点2,097施設・年21件以上・費用は四半期更新〕と産科医療補償制度〔シンボルマーク・加入分娩機関検索〕の一致表、妊婦健診14回・全市区町村が14回以上助成（2022-04-01）、医療広告の表、Obstetric/Gynecologic の型表〔schema.org V30.1〕、WordPress手順とmedicalSpecialtyのフィルター、チェックリスト10、確かめ方、FAQ 7問）。41言語 | 業種別 | content/daily-20261120-08 |
メモ：2026-11-20 8時の回は、出産なびのトップページ、schema.org/MedicalSpecialty（health-lifesci のミラーで確認）、産科医療補償制度の公式サイトを取得できなかった。改正法の成立日（2026-05-29）は二次情報のみのため書かず、公布日（厚労省資料）で書いた。新制度の開始時期（2027年度後半の報道）と金額は未確認のため書いていない。「人気の病院は早く埋まる」は一次資料がなく書いていない。産科医療補償制度に加入していない施設の一時金額は確認できず書いていない。
翻訳の補完ログ：2026-11-20 agency-aeo-first-audit-proposal に39言語を追加（41言語）。
翻訳の残り（8時台で補完）：company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations・ent-clinic-ai-search・gemini-claude-citations・site-renewal-ai-search・faq-page-ai-search（ja/en のみ）。
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（PR #80 fix-wrong-ai-answers と重ならない「掲載先の一覧と更新依頼の文例」に絞れれば）【全業種】
2. 制作会社向け：AI検索対策の見積もり項目と工数の出し方（agency-aeo-first-audit-proposal と重ならない切り口で）【制作会社向け】
3. 料金ページをAIに正しく読ませる書き方（税込表示・条件つき料金・Offer）【全業種】
4. 不妊治療クリニックのAI検索対策（保険適用の条件・年齢と回数・先進医療の表示）【業種別】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-20 11時 | pricing-page-ai-search | 料金ページをAIに正しく読ませる書き方（全業種。AIが料金を間違える5つの原因と直し方の表〔画像/PDF/タブ・税の扱い・単位・古い料金・外部の掲載先〕、Profound調査〔2026-09-03、Cloud 100の料金の質問・6エンジン約7,600回答：料金ページの引用46%・最初の出典12%・公開料金ページ77件中57件がAIで読める状態、調査会社自身の調査〕、上位記事〔Uravation 料金ページのAI検索設計（2026-09-05更新）・ステラジェント（費用相場で別テーマ）・0120.co.jp（サービスページ）／Trakkr・Profound・Single Grain・eSEOspace・Texta・GenOptima・PeerPush〕の抜けの表〔総額表示・見積もり制の例・二重価格・WordPressなし、Single GrainとPeerPushで型が食い違う〕、料金の1行の6要素の表と悪い例・良い例、総額表示（国税庁6902）、見積もり制は下限・決まり方・条件つきの例、キャンペーンの期間と二重価格（消費者庁：最近相当期間の価格でなければ期間を正確に表示、架空の希望小売価格）、改定の手順6点、curlでHTMLを確かめる、構造化データ〔schema-dts 2.1.0：price は数字だけ・priceCurrency・valueAddedTaxIncluded・minPrice/maxPrice・validFrom/validThrough・UnitPriceSpecification billingDuration/unitText/priceType〕のJSON-LD例、WordPress手順〔Nurevoの「料金」欄は入れた文字がそのまま price に出る→数字だけ、Offerに税の印なし→説明と本文に、所要時間とllms.txtの行、掲載ページID、料金ページ（BtoB）→ Key facts の Pricing、WooCommerceのOfferは任せる〕、料金の質問の記録表、チェックリスト10、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261120-11 |
メモ：2026-11-20 11時の回は、国税庁6902・schema.org・Googleの商品/販売者リスティングのドキュメントを取得できなかった（許可待ち）。6902 は 2026-11-01（hair-salon-ai-search）に確認した範囲、schema.org の決まりはローカルに入れた schema-dts 2.1.0 の説明文で書いた。消費者庁の価格表示ガイドラインPDF（週数などの目安）は読めず、数字は書いていない。Googleのリッチリザルトの条件は書かず「各型のドキュメントで確認」とした。funnel-ai.jp の記事は別ドメインへの転送で読んでいない。BtoBの料金ページの項目は b2b-saas-ai-search と重ならないよう、リンクだけにした。
翻訳の残り（8時台で補完）：company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations・ent-clinic-ai-search・gemini-claude-citations・site-renewal-ai-search・faq-page-ai-search・pricing-page-ai-search（ja/en のみ）。
次の候補：
1. 不妊治療クリニックのAI検索対策（保険適用の条件・年齢と回数・先進医療の表示）【業種別】（14時か17時で）
2. 制作会社向け：AI検索対策の見積もり項目と工数の出し方（agency-aeo-first-audit-proposal と重ならない切り口で）【制作会社向け】（17時か20時で）
3. 比較サイト・ポータルに載っている自社情報の直し方（PR #80 fix-wrong-ai-answers と重ならない「掲載先の一覧と更新依頼の文例」に絞れれば）【全業種】
4. 営業時間・定休日・臨時休業をAIに正しく読ませる書き方（祝日・年末年始・specialOpeningHours）【全業種】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-20 14時 | fertility-clinic-ai-search | 不妊治療クリニックのAI検索対策（業種別。治療を考える人の質問の型6つの表〔保険の条件・先進医療・費用・男性不妊・通院の負担・初診〕、上位記事13本〔uravation 医院情報設計（2026-09-05更新）・uravation 美容の自由診療（2026-10-07）・0120.co.jp aio-142（2026-10-20更新）・jinrai（2026-11-10更新、成功率の掲載を広告ルールに触れず推奨）・キャククル ポータル掲載（AIに触れず・2018年の統計）・LANY プレスリリース（2026-06-30）／Trakkr（例の数字は作ったものと明記）・upGrowth（自社の合成クエリ）・WebFX（2026-10-28）・Texta（2025-03）・Webtonic（自社を2位にした一覧）・Techmagnate（方法なしの事例）・Medical Marketing Firm〕の抜けの表、保険の条件の表〔2022-04開始・43歳未満・40歳未満6回/40〜43歳未満3回（1子ごと、胚移植の回数）・事実婚・3割（栃木県・札幌市）、初回移植の年齢は治療計画作成日（厚労省2022）、保険診療の移植だけ数える（鹿児島県Q&A）、第三者の配偶子は対象外、高額療養費は東海市のしおり（R8-04）で控除の前提〕、先進医療〔兵庫県 R8-03-01現在 先進医療A 11技術＋PGT-A（先進医療B）、札幌市 R8-04-01現在 タクロリムス・マイクロ流体、助成は兵庫3万円定額・札幌7割上限3.5万円、PGT-Aは先進医療技術審査部会 2025-12-15 で主要評価項目が基準を上回らず比較試験が必要〕、自費の限定解除の要件（Q6-10〜6-12）、治療実績の表〔Q2-16/2-17 治療効果・Q3-17 件数は期間併記で年ごと複数年・Q3-16 医師個人の件数不可・Q1-18/2-9 体験談〕と妊娠率の4つの定義（この記事のすすめと明記）、JSOG登録施設（2022 中医協資料の施設基準）、通院の負担と男性不妊、外の一覧の表、構造化データ〔schema.orgに不妊治療の分野なし→MedicalClinic＋medicalSpecialty Gynecologic/Urologic＋availableService MedicalProcedure、schema-dts 2.1.0〕、WordPress手順とフィルター、チェックリスト10、確かめ方〔条件を正しく答えているかを記録〕、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261120-14 |
メモ：2026-11-20 14時の回は、厚労省の「不妊治療に関する取組」のページ・先進医療の各技術の概要・実施医療機関の一覧、鹿児島県が参照する厚労省リーフレットを読んでいない。先進医療の一覧は全国の一覧ではなく兵庫県・札幌市の案内（時点つき）で書いた。高額療養費は東海市のしおりの記載（控除の前提）で書き、上限額は書いていない。令和8年度診療報酬改定での不妊治療の変更は一次資料を読めず、書いていない。治療成績の公開ルールは2021年の中医協で「引き続き検討」とあったが現状は未確認のため書かず、妊娠率の定義4つはこの記事のすすめとして書いた。卵子凍結の助成（東京都など）、治療費の金額、妊娠率の数字は書いていない。stock-sun の記事は取得できなかった。
翻訳の残り（8時台で補完）：company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations・ent-clinic-ai-search・gemini-claude-citations・site-renewal-ai-search・faq-page-ai-search・pricing-page-ai-search・fertility-clinic-ai-search（ja/en のみ）。
次の候補：
1. 制作会社向け：AI検索対策の見積もり項目と工数の出し方（agency-aeo-first-audit-proposal と重ならない切り口で）【制作会社向け】（17時で）
2. 営業時間・定休日・臨時休業をAIに正しく読ませる書き方（祝日・年末年始・specialOpeningHours）【全業種】（20時で。年末年始の前に）
3. 比較サイト・ポータルに載っている自社情報の直し方（PR #80 fix-wrong-ai-answers と重ならない「掲載先の一覧と更新依頼の文例」に絞れれば）【全業種】
4. 美容皮膚科・美容クリニックのAI検索対策（自由診療の限定解除・料金とリスクの同じページ表示）【業種別】（dermatology-clinic-ai-search と重ならない切り口で）
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-20 17時 | agency-new-site-build-ai-search | 新規サイト制作にAI検索対策を最初から入れる手順（制作会社向け。上位記事11本〔sungrove aio-hp（2026-11-18更新）・jinrai web-development（2026-11-18更新）・発注ラウンジ ヒアリングシート（2026-09-08）・PRONIアイミツ ヒアリングシート（2025-01-08更新）／Aurum House（2026-05-27）・ColorWhistle（2026-10-07更新）・Avenue Z（2025-07-22）・Xponent21・Orbit Media（2026-03-19）・Webflow（2026-04-15更新）・IMPACT（2026-09-29更新）〕の抜けの表、工程ごとの表6行〔ヒアリング・サイトマップ・原稿・構築・公開日・公開後〕、Google AI機能とウェブサイト（2025-12-10更新：追加の要件なし・特別な構造化データ/AI向けファイル不要・本文と一致）、ヒアリングシートに足す8項目、ページの型の表7行、原稿依頼シートの型と悪い例・良い例、構築の決めごと〔JSは処理される・完全な意味づけHTMLは不要（Google 最適化ガイド 2026-07-10）、他のAIのJSは未確認と明記、構造化データの出し手を1つ〕、WordPress 5.3以降の非公開設定〔noindex,nofollow の meta・robots.txt の Disallow: / は削除（Make WordPress Core 2019-09-02）・X-Robots-Tag〕、Nurevoは blog_public=0 の間 AIクローラーの行と構造化データを出さない・llms.txt は出る→ステージングは認証で、公開日の確認表6行とコマンド、WordPress手順9点〔種類・空欄だけ埋める・サービスURL・FAQブロック・llms.txt 最大30件の除外・SEOプラグイン併用・学習用クローラー・export/import（キーは入らない）・status〕、見積もりの行7つと契約の4点〔金額・工数の相場は出典なしで書かない〕、公開日の基準の記録と比べ方、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261120-17 |
メモ：2026-11-20 17時の回は、Google の「AI 機能とウェブサイト」「生成 AI 機能のためのサイトの最適化」・OpenAI のクローラーのページ・構造化データの一般ガイドラインを WebFetch の許可待ちで読めず、Googleの2ページは 2026-11-18（google-ai-overviews-citations）に確認した内容で書いた。Fyve のサービスページはトップページの内容しか返らず使っていない。見積もりの金額・工数の相場、ほかのAIクローラーのJavaScriptの扱い、上位記事の「引用◯倍」の数字は書いていない。制作会社向けの「見積もり項目と工数」は agency-aeo-monthly-service の価格の章と重なるため、新規制作の工程に切り口を変えた。
翻訳の残り（8時台で補完）：company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations・ent-clinic-ai-search・gemini-claude-citations・site-renewal-ai-search・faq-page-ai-search・pricing-page-ai-search・fertility-clinic-ai-search・agency-new-site-build-ai-search（ja/en のみ）。
次の候補：
1. 営業時間・定休日・臨時休業をAIに正しく読ませる書き方（祝日・年末年始・specialOpeningHours）【全業種】（20時で。年末年始の前に）
2. 比較サイト・ポータルに載っている自社情報の直し方（PR #80 fix-wrong-ai-answers と重ならない「掲載先の一覧と更新依頼の文例」に絞れれば）【全業種】
3. 美容皮膚科・美容クリニックのAI検索対策（自由診療の限定解除・料金とリスクの同じページ表示）【業種別】（dermatology-clinic-ai-search と重ならない切り口で）
4. 制作会社向け：お客様に渡すAI検索対策の社内向け説明資料（担当者が上司に説明するための1枚）【制作会社向け】
5. 次の月曜の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-20 20時 | business-hours-holidays-ai-search | 営業時間・定休日・祝日・臨時休業をAIに正しく読ませる書き方（全業種。AIが営業時間を間違える5つの原因の表、SEJ（2026-07-20、Searchable のテスト：英国の小売店の64%で誤った事実）・Local Search Forum（2026-10、AIによる概要が2023年の表計算ファイルの古い営業時間を使用・未解決）、上位記事〔Uravation 店舗AIO・飲食チェーン（2026-09-05更新）・課題解決プラットフォーム 特別営業時間（2026-10-20更新、AIなし）・Alejandro Rioja（2026-10-23）・GMO（営業時間なし）・訪日ラボ3本（有料部分は未読）／SEJ・Cloutly（2026-09-06）・PushLeads（2026-10-27更新）・Texta・PinMeTo（2023）・Seybold（2015）・Locafy〕の抜けの表、営業時間のブロックの6項目の表と悪い例・良い例、お知らせの書き方（年を省かない・期間後に消す・同じURLを毎年書き換え）、Googleビジネスプロフィール〔特別営業時間は6日まで・7日以上/未定は臨時休業（ヘルプ2ページで7日ちょうどの書き方が違う）・祝日も確認をすすめる・深夜は2日に分ける・「決まった営業時間で営業している」でないと特別営業時間が出ない・広い検索で臨時休業は営業中のあと・祝日のリスト・Copy Hours（SER 2025-01-28）〕、構造化データ〔Googleのドキュメント（2026-09-12更新）：定休日・24時間 00:00-23:59・深夜は1つで 18:00-03:00・休業は validFrom/validThrough＋00:00-00:00、specialOpeningHoursSpecification はGoogleに記載なし、schema.org の「opensがなければ休み」との違い、PublicHolidays は国が未定義（schema-dts 2.1.0）〕、WordPress手順〔Nurevoの「営業時間」欄は毎週の形なら openingHoursSpecification、祝日・第2火曜・LO・「9-5」は入れた文字のまま、24:00→23:59、深夜OK、webmcp_canary_business_node で休業の1行、SEOプラグインが店の情報を全部出していればフィルターは効かない、EC/BtoBは営業時間なし、llms.txt の Hours〕、年末年始の前のスケジュール表、確かめ方の表、チェックリスト10、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261120-20 |
メモ：2026-11-20 20時の回は、Googleの祝日のリストは日本の部分まで読めていない（日付は書いていない）。GBPヘルプの臨時休業 9790266・営業時間の編集 15300403 は読んでいない。PushLeads・Locafy の数字（SOCi・Whitespark・Yext など）は一次情報を確認できず使っていない。各AIの反映日数は公開されておらず書いていない。ChatGPT・PerplexityがGoogleビジネスプロフィールや営業時間の構造化データを使うかの公式情報は見つからなかった。
翻訳の残り（8時台で補完）：company-profile-page-ai-search・multi-location-business-ai-search・dermatology-clinic-ai-search・person-profile-page-ai-search・agency-aeo-client-handover・photo-studio-ai-search・eye-clinic-ai-search・franchise-headquarters-ai-search・lesson-studio-ai-search・b2b-saas-ai-search・detective-agency-ai-search・agency-content-refresh-service・perplexity-citations・google-ai-overviews-citations・ent-clinic-ai-search・gemini-claude-citations・site-renewal-ai-search・faq-page-ai-search・pricing-page-ai-search・fertility-clinic-ai-search・agency-new-site-build-ai-search（ja/en のみ）。・business-hours-holidays-ai-search
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（PR #80 fix-wrong-ai-answers と重ならない「掲載先の一覧と更新依頼の文例」に絞れれば）【全業種】
2. 美容皮膚科・美容クリニックのAI検索対策（自由診療の限定解除・料金とリスクの同じページ表示）【業種別】（dermatology-clinic-ai-search と重ならない切り口で）
3. 制作会社向け：お客様に渡すAI検索対策の社内向け説明資料（担当者が上司に説明するための1枚）【制作会社向け】
4. 予約ページ・予約システムをAIに正しく読ませる書き方（外部予約サイトへのリンク・空き状況・キャンセル規定）【全業種】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-20 調査 | research-wordpress-vs-non-wordpress-2026 | WordPress と非WordPress（HTTP 200で到達した14,361件＝WordPress 12,376・非WP 1,985〔海外の非WPの202 1,477件は表から除外、含めた値は本文〕、JSON-LD 88.8% vs 17.6%、llms.txt 29.6% vs 9.8%、6項目すべて24.9% vs 4.7%、日本の非WP 191件：JSON-LD 28.3%〔WP 72.9%〕・robots.txt 45.0%〔95.6%、無し55.0%〕・canonical 42.9%・llms.txt 6.3%〔14.0%、Fisher p=0.002〕・FAQPage差なし p=0.73、AIボットのブロック 日本 非WP 9.3%〔8/86〕vs 1.0%・海外 非WP 13.8%〔89/643〕vs 4.3%、検索用4種は1%未満、7ボット同一の組み合わせ 海外非WP 73/93・WP 268/465、GPTBotブロックでOAI-SearchBot許可 海外WP 346/363、WP どうしでも日本14.0%・海外33.1%〔p<0.001〕、非WPどうしは差なし、構造化データの型表、6項目の分布、限界にJS非実行・meta descriptionの属性順・WP判定の痕跡） | raw_2026-11-12（summary.japanWP・japanNonWP・intlWP と一致） | ja/en | content/research-20261120 |
| 2026-11-21 8時 | booking-page-ai-search | 予約ページをAIに正しく読ませる書き方（全業種。AIが予約を間違える5つの原因の表、AIの中で予約できる仕組みの表〔ChatGPT：OpenTable全世界・Resy米国・Yelp米国とカナダ、予約ボタンは予約サービスの掲載と結び付いたときだけ・予約は保存しない（OpenAIヘルプ 9237897、2026-11-21確認／Resy 2026-08-10）、予約サービス向け仕様で店ごとに website_url と platform_url／Google AIモード：2025-08-21 米国 AI Ultra（Labs）で飲食店から、英国 2026-04-10／GBP：ビジネスリンクのポリシー 13769188、予約サービス経由 7475773〕、上位記事11本〔Uravation 電話・予約導線・Uravation 体験観光・GMO ローカルAIO・AIsmiley・assist-all／LSEO 2本・Mindbody・Owner・J.A. Watte・Mews〕の表、予約ページに書く8つの事実、予約サイトを複数使うときの6手順、空き状況ではなく確かめ方を書く、埋め込み・ログインの curl 確認、OAI-SearchBot と IP、Stripe のエージェント予約、ReserveAction は付けてよいが公式に使うと書いた資料なし、Nurevo の実際の出力（Service＋ReserveAction＋llms.txt のリンク、予約プラグインは読まない）、確かめ方5問、チェックリスト10、FAQ 7問）。41言語 | 全業種 | content/daily-20261121-08 |
翻訳の補完ログ：2026-11-21 company-profile-page-ai-search に39言語を追加（41言語）。
メモ：2026-11-21 8時の回は、OpenAIのヘルプに絶対日付がなく、2026-11-21 に読んだ内容で書いた。ChatGPTやAIモードで日本の予約サイトが連携しているという公式発表は見つからず書いていない。Googleの LocalBusiness ドキュメントに ReserveAction がないという点は Uravation の記述で、Googleの資料は直接読んでいないため本文では使っていない。GMO・Owner・Mindbody などの統計は使っていない。
翻訳の残り（8時台で補完）：multi-location-business-ai-search から順に（前回の一覧から company-profile-page-ai-search を除いたもの）
次の候補：
1. 美容皮膚科・美容クリニックのAI検索対策（自由診療の限定解除・料金とリスクの同じページ表示）【業種別】
2. 制作会社向け：お客様に渡すAI検索対策の社内向け説明資料（担当者が上司に説明するための1枚）【制作会社向け】
3. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】
4. アクセス・駐車場・行き方のページをAIに正しく読ませる書き方【全業種】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-21 11時 | emergency-home-repair-ai-search | 水道修理・鍵開け・害虫駆除など駆けつけ修理のAI検索対策（業種別。困った人の質問の型5つの表、上位記事10本〔uravation 水道修理・鍵開け（2026-08-29）・uravation 害虫駆除（2026-08-31）・uravation 家電修理（2026-10-25）・assist-all 修繕工事／建設（2026-01）／Sagnik Bhattacharya（2026-10-29）・High Level Marketing・Web Tonic（2026-10-09更新）・Marchex（2025-08-15）・PHCP Pros（2026-06-01）〕の表、国民生活センター（2021-10-07：相談 2016年度2,437→2020年度5,882件・電子広告 19.2%→41.1%・「950円～」で数十万円）、消費者委員会の意見（2025-08-04：電子広告 約15%→約55%、700人調査 決め手：安い金額39%・見積り無料36%・検索の一番上33%、高額請求37%・見積もり無料が有料24%）、埼玉県の景品表示法 措置命令2件（2024-02-08・2025-03-05、「350円～」「基本料金3,000円」「0円 完全無料 現地見積り」「今月だけのWEB限定割引」・件数・満足度99%・他社比較）と代わりの書き方の表、千葉市の事例（2026-10-07更新）、料金ページの7項目〔出張費・見積もり費・キャンセル料・作業前の総額提示・作業別の総額の例・夜間割増・支払いと書面〕、大阪府FAQ（2026-04-01更新：訪問販売・8日・自分で呼んでも可能性）、指定給水装置工事事業者〔静岡市 条例で禁止・柏市・福岡市 要件と一覧・札幌市、2019-10-01 改正水道法で5年更新（千葉県・日本水道協会）〕、到着の目安と受付/出動の区別、構造化データ〔Plumber・Locksmith・Electrician・HVACBusiness、害虫駆除の型なし（schema-dts 2.1.0）、Offer 0 は本当に無料のときだけ、hasCredential のフィルター例〕、WordPress手順、紹介サイト・検索広告とそろえる、チェックリスト10、確かめ方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261121-11 |
メモ：2026-11-21 11時の回は、どの作業に指定給水装置工事事業者が必要か（パッキン交換などの軽微な修理の扱い）を書いた上下水道局のページは見つからず、書いていない。鍵の資格・害虫駆除の登録（建築物ねずみ昆虫等防除業）は二次情報しか読めず書いていない。国民生活センターの2021年の報告書PDF・消費者トラブル解決ナビは読んでいない。adsx の記事は取得できなかった。相場の金額・AIで業者を探す人の割合は書いていない。
翻訳の残り（8時台で補完）：multi-location-business-ai-search から順に（前回の一覧に emergency-home-repair-ai-search を追加、ja/en のみ）
次の候補：
1. 制作会社向け：お客様に渡すAI検索対策の社内向け説明資料（担当者が上司に説明するための1枚）【制作会社向け】（14時か17時で）
2. 美容クリニックのAI検索対策は dermatology-clinic-ai-search と重なるため保留。代わりに、エステサロン・脱毛サロンのAI検索対策（特定継続的役務・中途解約の書き方）【業種別】
3. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】
4. アクセス・駐車場・行き方のページをAIに正しく読ませる書き方【全業種】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-21 14時 | agency-ai-search-manipulation-risks | AI検索の不正な手法をお客様に頼まれたとき（制作会社向け。上位記事10本〔Uravation NG11選（2026-07-13）・仁頼 GEOでやってはいけない6つ（2026-11-18）・サングローブ NG12選（2026-11-16更新）・マイナビ LLMO連載3（2026-09-16）・ビジネスジャーナル（2025-07）・お名前.com（2025-07）／Similarweb black hat GEO（2026-02-26、05-20更新）・Lily Ray（2026-06-17）・Citable（2026-06-25）・SEL 隠しプロンプト〕の抜けの表、3つの決まりの表〔Googleのスパムポリシーが生成AIの回答にも適用（2026-05-15、SER・SELの報道で。原文は取得できず）・Anthropic利用ポリシー（2026-11-12施行：情報源の出どころ・書き手・独立性を偽る操作、サクラ・偽の口コミ、それをサービスとして売ること）・ステマ規制（2023-10-01、広告主が対象、措置命令）〕、依頼されやすい8手法の判断表〔隠しテキスト/AIへの指示・クローキング・自社1位の一覧（Lily Ray：323件中224件69%が推薦されず、本人の標本）・社員の口コミ/星5条件（Q&A Q6）・独立を装うサイト網・地域名だけのページ量産・見えないFAQ/評価の構造化データ・「AIで1位」業者〕、グレーな依頼の線引き6行〔Q&A Q3・Q10・Q11・Q12・Q14・Q15・Q16〕、断りのメール文例、契約の条文例（弁護士の確認を明記）、引き継いだサイトの点検コマンド5つと手動による対策レポート、WordPress手順〔Nurevoはユーザーエージェントを読まない・FAQPageは見えるページだけ・AggregateRatingはWooCommerceのレビューがあるときだけ・空欄だけ埋める・パネルで llms.txt から除外・無料チェックは社名なし〕、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261121-14 |
メモ：2026-11-21 14時の回は、Googleのスパムに関するポリシーの原文・更新履歴、BBC（2026-05-19）を WebFetch の許可待ちで読めず、Googleの変更は Search Engine Roundtable・Search Engine Land・PPC Land の報道として書き、原文へのリンクを付けた。searchengineland 463684・emarketed は取得できなかった。上位記事の「流入60〜80%減」「回復3〜6か月」は出典がなく使っていない。日本以外の広告表示の規制は一次情報を読んでおらず、「自分の市場の規則を確認」とだけ書いた。ステマ規制Q&Aは自社の比較・ランキング記事を直接は扱っておらず、そこは記事のすすめとして書いた。
翻訳の残り（8時台で補完）：multi-location-business-ai-search から順に（前回の一覧に agency-ai-search-manipulation-risks を追加、ja/en のみ）
次の候補：
1. エステサロン・脱毛サロンのAI検索対策（特定継続的役務・中途解約の書き方）【業種別】（17時で）
2. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】
3. アクセス・駐車場・行き方のページをAIに正しく読ませる書き方【全業種】
4. 制作会社向け：お客様に渡すAI検索対策の社内向け説明資料（初回提案の記事と重ならない形にできれば）【制作会社向け】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-21 17時 | esthetic-salon-ai-search | エステ・脱毛サロンのAI検索対策（業種別。契約前にAIに聞かれる質問の型6つの表〔総額・回数と期限・解約返金・支払いと倒産の不安・医療脱毛との違い・勧誘と体験〕、上位記事11本〔uravation エステ・脱毛（2026-09-05）・uravation 美容室サロン（2026-09-05）・0120.co.jp aio-156（2026-10-22）・assist-all エステ／脱毛（2026-01-30）・GMO ローカルAIO（2026-11-16）／AestheticsPro（2026-05）・AmSpa（2026-03-31）・dev.to Gyubin Kim（2026-06）・5W Med Spa Index 2.0（2026-11-03）・Growth99〕、特定継続的役務〔大阪府FAQ 2026-11-13更新：1か月超・5万円超、8日、関連商品もクーリング・オフ、中途解約 前2万円・後 提供分＋2万円か残額1割の低いほう〕と広島県の上限表（2024-08-01、美容医療は後 5万円か20%）、自分のコースに当てはめた計算例の書き方、前払いと倒産〔TSR 2023 88件・2024年1〜10月 87件（J-CAST報道）、消費者庁 前受金保全措置、福岡市 通い放題・永久保証の有償/無償期間（2025-07-10）〕、医療脱毛との線引き〔厚労省 医政医発第105号 2001-11-08〕、構造化データ〔HealthAndBeautyBusinessの下位型6つ（schema-dts 2.1.0）、BeautySalon/DaySpa、コースごとのService＋Offer JSON例〕、WordPress手順、予約サイトとの値合わせ、チェックリスト10、確かめ方〔サロン名入りで解約・違いを聞き、料金ページと合うか記録〕、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261121-17 |
メモ：2026-11-21 17時の回は、国民生活センターの消費者トラブル解説集（2026-09-07終了）は読めず、消費者トラブル解決ナビは読んでいない。消費者庁の前払いの注意喚起は掲載日が確認できず日付を書いていない。uravation が挙げる 2026-03-25 の消費者庁の措置は一次情報を読んでおらず書いていない。痩身・美肌の景品表示法・薬機法の表現ルールは一次情報を読んでおらず書かず、hair-salon-ai-search へのリンクに留めた。美容医療の「サービスを受ける前」の上限は広島県の表から読み取れず、そう明記した。相場の金額・AIでサロンを探す人の割合は書いていない。5W の調査は米国のメドスパ・PR会社の調査と明記して使った。
翻訳の残り（8時台で補完）：multi-location-business-ai-search から順に（前回の一覧に esthetic-salon-ai-search を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（20時で）
2. アクセス・駐車場・行き方のページをAIに正しく読ませる書き方【全業種】
3. 制作会社向け：お客様に渡すAI検索対策の社内向け説明資料（初回提案の記事と重ならない形にできれば）【制作会社向け】
4. 整体・リラクゼーションサロンのAI検索対策（整骨院と分けて、医業類似行為・効果表現の線引き）【業種別】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-21 20時 | access-directions-parking-ai-search | アクセス・駐車場・行き方のページをAIに正しく読ませる書き方（全業種。AIがアクセス情報を間違える5つの原因の表、上位記事13本〔uravation 店舗AIO（2026-09-05更新）・個人カフェ（2026-10-09）・多店舗チェーン（2026-08-15）・駐車場運営（2026-10-24）・アシスト 不動産（2026-07-31更新）・一創 MEO（2026-08-09）・サングローブ 2027年MEO（2026-11-04更新）／Semrush（2026-07-15）・Birdeye（2026-08-17更新）・Yext（2025-01-24）・Straight North・SEO.com（2026-11-20更新）・SEJ 属性（2021）〕の抜けの表、アクセスのページに書く8つの事実の表と悪い例・良い例、提携駐車場の条件、徒歩分数の測り方〔不動産の公正競争規約 施行規則：道路距離80mで1分・端数切り上げ・信号待ち含めない（三菱地所ハウスネットの用語集による）〕、住所の表記をそろえる5点と移転時の1行、GBP属性〔9049526：事業者が編集できる属性と来店者の情報、バリアフリー（入口・トイレ・席・エレベーター・車いす対応駐車場）、確認は通常10分・最長30日〕、構造化データ〔Google LocalBusiness（2026-09-08更新）：必須 name・address、geo 推奨・小数点以下5桁以上、PostalAddress の分割例、hasMap・amenityFeature は記載なし／schema.org V30.1・schema-dts 2.1.0：hasMap・amenityFeature（LocationFeatureSpecification）・publicAccess、AIが使うと明記した資料なし〕、WordPress手順〔Nurevoの「住所」欄は streetAddress の1文字列と llms.txt Address、住所から座標を推測しない、webmcp_canary_business_node で geo・hasMap・amenityFeature、SEOプラグインが店の情報を全部出していればフィルターは効かない、診断の「重要情報の網羅」、EC/BtoBは geo なし〕、確かめ方5問、チェックリスト10、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261121-20 |
メモ：2026-11-21 20時の回は、OpenAIのヘルプ（ChatGPT search、9237897）が取得できず、ChatGPTが利用者の位置や地図データをどう使うかは書いていない。schema.org の hasMap・publicAccess のページは WebFetch の許可待ちで読めず、定義は schema-dts 2.1.0 の説明文で確認した。Googleのローカルビジネスのドキュメントは旧URLからの転送先として読んだ（直接のURLは許可待ち）。Googleマップのヘルプ 9882117 は利用者向けのアクセシビリティ機能のページで、店の属性の話ではなく使っていない。GMO TECH の調査・Straight North の自社アンケートの数字はアクセス情報と関係が薄く使っていない。徒歩分数の基準は一次資料（規約本文）ではなく用語集の説明として出典を示した。
翻訳の残り（8時台で補完）：multi-location-business-ai-search から順に（前回の一覧に access-directions-parking-ai-search を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 制作会社向け：お客様に渡すAI検索対策の社内向け説明資料（初回提案の記事と重ならない形にできれば）【制作会社向け】
3. 整体・リラクゼーションサロンのAI検索対策（整骨院と分けて、医業類似行為・効果表現の線引き）【業種別】
4. 宿泊施設のアクセス（送迎・最終チェックイン・駐車場の予約）は hotel 記事と重なるため保留。代わりに、ペットサロン・トリミングのAI検索対策【業種別】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-21 調査 | research-in-web-agencies-ai-search-2026 | 国別レポート4本目：インド（掲載2,316件中到達1,554件〔HTTP 202は23件のみ、200だけでも対米国で llms.txt 37.2% vs 27.2%・6項目すべて30.3% vs 22.3%〕、llms.txt 36.6%〔569件、日本13.4%の2.7倍・米国23.1%・英国21.5%・シンガポール38.8%〕、JSON-LD 84.4%、FAQPage 14.5%、6項目すべて29.9%〔日本の2.9倍〕・平均4.53、到達100件以上の17か国表〔llms.txt・6項目すべて・FAQPage でシンガポールに次ぐ2位、平均はフランスに次ぐ2位〕、AIボットのブロック5.8%〔81/1,406、対米国 p=0.04〕、ボット別表〔学習用4.2〜5.6%・検索/質問時用4種のどれかは7件0.5%〕、GPTBotブロック72件中70件がOAI-SearchBotは許可、7ボット同一の組み合わせ52/93・Bytespiderだけ11件、構造化データの型〔印・米・英・星・日、AggregateRating 10.9%〕、WordPress 89.0%・Yoast 42.7%・Rank Math 29.9%・AIOSEO 6.9%〔SEOPress 4件は省略〕、6項目の分布、カイ二乗：対日米英・インド以外の海外 p<0.001・対シンガポールは差なし）。PR TIMES 文なし（国別の初回ではないため） | raw_2026-11-12（summary.byCountry.IN と一致） | ja/en/hi | content/research-20261121 |
メモ：2026-11-21 の調査回は、新しい summary が来ていない（最新は 2026-11-12）ため総論の更新はせず、未着手の国別（インド）にした。AIクローラーのブロック（#77）・llms.txt 導入率（#83）・構造化データの壊れ率（#89）は未マージのPRに原稿があるため重ねていない。インドはヒンディー語版を src/content/research-in-web-agencies-ai-search-2026/hi.json に置いた。
| 2026-11-22 8時 | seitai-relaxation-salon-ai-search | 整体院・リラクゼーションサロンのAI検索対策（業種別。国家資格のない手技の店。AIに聞かれる質問の型6つの表、上位記事13本〔uravation 整骨院・整体院（2026-09-05）・uravation 整体予約AI（2026-09-22）・assist-all エステ（2026-01-30）・@SOHO 整体師（2026-08-13）・GMO ローカルAIO（2026-11-16）・キャククル 整体院の広告（2020-05-14）・uravation 美容室（2026-09-05）／MASSAGE Magazine（2026-08-26）・Sagnik Bhattacharya（2026-11-04）・MassageBook（2026-08-18）・Zenoti（2025-06-30）・Chirovant/MarTech Edge（2026-11-04）・Perfect Patients・Semrush（2026-07-15）〕の抜け、公的な線引き〔国民生活センター 2012-08-02：あはき法1条・12条、1960-01-27最高裁、1991-06-28 医事第58号（ヘルニア等に施術しない・頸部の危険な手技禁止・医療受診・誇大広告）、2012-02-29 厚労省会議「マッサージ」表記／消費者庁 2017-05-26：1,483件・1か月以上240件・神経脊髄290・骨折122（大阪市掲載）／総務省 2020-11-17 勧告・2023-03-27 フォローアップ〕、避けたい表現と代わりの事実の表6行、ページに書く8つの事実、構造化データ〔HealthAndBeautyBusiness／DaySpa、Physiotherapy は MedicalBusiness の下で使わない、Chiropractic は MedicineSystem の値（schema-dts 2.1.0）〕、WordPress手順〔「美容サロン」→業種を HealthAndBeautyBusiness、「クリニック・歯科」は選ばない〕、予約サイト・GBPとそろえる、チェックリスト10、確かめ方、FAQ 7問）。41言語 | 業種別 | content/daily-20261122-08 |
翻訳の補完ログ：2026-11-22 multi-location-business-ai-search に39言語を追加（41言語）。
メモ：2026-11-22 8時の回は、総務省の報告書本文（000717036.pdf）は表紙と目次しか取得できず、勧告の内容は報道資料の範囲で書いた。埼玉県の事例ページはサーバーエラーで読めなかった。厚労省の無資格者の見分け方のリーフレット（0000118514.pdf）は読んでいない。整体で療養費（健康保険）が使えるかの一次資料は読んでおらず、「使えないなら、そう書く」という書き方のすすめに留めた。日本以外の資格制度、相場の料金、AIで店を探す人の割合、罰則は書いていない。Chirovant のテストは集客会社の小さな標本と明記した。adsx は取得できなかった。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧から multi-location-business-ai-search を除いたもの。seitai-relaxation-salon-ai-search は41言語で公開済み）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 制作会社向け：お客様に渡すAI検索対策の社内向け説明資料（初回提案の記事と重ならない形にできれば）【制作会社向け】
3. ペットサロン・トリミングのAI検索対策（動物病院 PR #84 と分けて）【業種別】
4. 鍼灸院・マッサージ院（国家資格のあはき師）のAI検索対策：あはき法第7条の広告できる事項に沿った書き方【業種別】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-22 11時 | acupuncture-massage-clinic-ai-search | 鍼灸院・マッサージ院のAI検索対策（業種別。国家資格のあはき師の施術所。AIに聞かれる質問の型6つの表〔保険・費用と回数・痛みとリスク・施術者・訪問・予約と時間〕、上位記事11本〔uravation 整骨院・整体院（2026-09-05）・サングローブ 鍼灸院の広告規制（2026-06-12）・GMO ローカルAIO（2026-11-16）・assist-all エステ／脱毛（2026-01-30）／Texta acupuncture（2025-03）・MGMA Woo（2026-05-20：200院・約4,950質問で0院、筆者は自社の利害を明記）・MGMA Stat（2026-06-17）・WebPT（2026-01-14）・Birdeye（2026-07-04）・St. Pete Catalyst（2026-07-30：28院中11院が一度も挙がらず、症状ページ 53% vs 9%）〕、あはき・柔整広告ガイドライン〔医政発0218第1号 2025-02-18、技術的助言、検討会 2018-05〜2024-07 の11回、意見募集 2024-08-30〜09-28 の72件、誘引性・特定性・認知性、Ⅱ-6(6) サイトは原則広告とみなさない／SNS・検索広告・紹介サイトの紹介ページ・有料口コミサイトは広告〕の媒体別の表、Ⅵ-3 サイトに載せるべき3項目とAIの質問の対応、Ⅵ-4 載せない表現と代わりの事実の表6行、療養費〔厚労省 2026-04-30・東北厚生局：はり・きゅう6疾病、主治医の診察後の同意・オンライン診療不可・6か月（2018-10-01に3→6）、同一疾病の保険医療と併用不可、マッサージは筋麻痺・筋萎縮・関節拘縮等、受領委任 2019-01〜、一部負担金の減免不可、明細書無料、往療の条件〕と書き方の例、施術所の名前と第7条・告示の広告できる事項、構造化データ〔MedicalBusiness を推奨（schema-dts 2.1.0 の説明）、MedicalClinic・Physician・Physiotherapy は使わない、美容鍼中心は HealthAndBeautyBusiness〕、WordPress手順〔「クリニック・歯科」→MedicalBusiness のまま〕、チェックリスト10、確かめ方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261122-11 |
メモ：2026-11-22 11時の回は、ガイドライン本文は荒川区が掲載している写しで全文を読んだ（厚労省の本文URLは確認していない。厚労省の概要スライドを併記）。Googleビジネスプロフィールはガイドラインに名前がなく、地図サービスの有料・依頼した口コミの扱いだけを書き、「迷う場合は保健所に確認」とした。高知県のチラシは料金の表示を広告できないとしており、ガイドラインより厳しい案内がある旨だけを書いた。往療料の金額・一部負担の割合は書いていない。日本以外の制度、相場の料金、AIで院を探す人の割合は書いていない。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に acupuncture-massage-clinic-ai-search を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 制作会社向け：お客様に渡すAI検索対策の社内向け説明資料（初回提案の記事と重ならない形にできれば）【制作会社向け】（14時か17時で）
3. ペットサロン・トリミングのAI検索対策（動物病院 PR #84 と分けて）【業種別】
4. 訪問マッサージ・訪問鍼灸のAI検索対策は今回の記事と重なるため保留。代わりに、行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-22 14時 | ai-search-ads-vs-aeo | ChatGPT広告・AI Overviews広告とAI検索対策（AEO）の違い（制作会社・広告代理店向け。上位記事14本〔ppc-master（2026-07）・LANY ChatGPT広告（2026-10-21）・SEED（2026-10-04更新）・キーワードマーケティング（2026-07-29追記）・shwat（2026-07-08）・LANY AIO/AIモード広告（2026-10-20）・awoo（2026-09-11）／PPC Land 89か国（2026-10-21）・AirOps（2026-11-02更新）・Keywords Everywhere（2026-08-31更新）・RankScope（2026-11-14）・OrganiKPI（2026-10-13更新）・SER（2025-12-22）・PPC Land AIO 11か国（2025-12-22）〕の抜けの表、2026年11月時点の提供状況の表〔OpenAI 広告の方針（2026-01-16）：回答に影響しない・Free/Goのみ・18歳未満なし・健康/メンタルヘルス/政治の近くに出ない／広告のテスト（2026-02-09、08-11追記で日本開始）／Google 広告ヘルプ 16297775：AIO内の広告は英語12か国・日本なし・上下は200以上の市場・オプトアウト不可・上部の広告として報告／Google ブログ AIモード広告（2026-10-28）10か国・日本記載なし／Perplexity 広告から撤退（MacRumors 2026-02-18、FT引用）〕、広告と回答の中の出典の比較表8行、お客様の3つの質問と答え方、業種別の判断表5行、OAI-AdsBot と OAI-SearchBot（OpenAI ヘルプ 20001243・ボットの説明：AdsBotは広告ページだけ・学習に使わない・robots.txtだけでは不十分）と確かめるコマンド、WordPress手順〔Nurevo の初期の許可一覧に OAI-AdsBot はなく、webmcp_canary_robots_search_agents フィルターで足せる〕、測り方の分け方〔広告として出たものは登場に数えない・Pro計測は広告のない Perplexity〕、見積もり・報告の分け方、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261122-14 |
メモ：2026-11-22 14時の回は、OpenAIのヘルプ（20001047 ChatGPTの広告）は取得できず、対象プラン・国はOpenAIのブログ2本で確かめた。日本での最初の表示日は報道で6月19日・21日・22日と分かれ、記事ではOpenAIの8月11日の追記に合わせ、6月とする報道がある旨だけ書いた。89か国は PPC Land が引用するOpenAIの発表（原文URLは未確認）。Microsoft Copilot の広告（2024年の資料のみ）、Geminiアプリの広告（9to5Google は未読）は書いていない。CPC・CPM・CTR・日本の最低出稿額は代理店・ベンダーの数字しかなく書いていない。ChatGPTの日本のベータ期間の業種制限（shwat の記載）は一次情報を読んでおらず、OpenAIの「健康・政治などの近く」とGoogleの除外業種だけを書いた。広告費と出典の関係を検証した公開データは見つからず、その旨を書いた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に ai-search-ads-vs-aeo を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. ペットサロン・トリミングのAI検索対策（動物病院 PR #84 と分けて）【業種別】（17時で）
3. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】
4. ネットショップの商品フィードとChatGPTのショッピング（商品が回答に出る仕組みと Merchant Center との違い）【EC】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-22 17時 | chatgpt-shopping-product-feed | ChatGPTのショッピングに商品を出す方法（EC。商品フィード・Merchant Centerとの違い・日本のショップがいまやること。上位記事16本〔CommercePick（2026-07-21）・ネットショップ担当者フォーラム 15638（2026-04-13）・15734（2026-03-12）・14912（2025-10-09）・gori.me（2026-03-26）・Shopify JP GEO（2026-06-05）・stellagent UCP（2026-03-03）・Shopifyヘルプ／BigCommerce（2026-09-30）・WPBeginner（2026-09-09更新）・SEO.com（2026-11-20更新、Instant Checkoutを現行扱い）・Alhena（2026-11-05更新）・Meetanshi（2026-08-19）・Lengow・Profound（2025-07）・Publitas（2025-09）〕の抜けの表、提供状況の表〔OpenAI 販売店向けページ：米国の利用者向け・フォーム（本社の国に日本あり・順番待ち）・フィードは必須でない・Shopify/Etsyは連携済み・単独のInstant Checkoutから離れる・ChatGPT発の購入に手数料なし／フィードの仕様：必須9項目＋target_countries・store_country、標準の対象は米国（US・CA・MX）／Google UCP：一部の販売店・米国の商品から、CA・AUが次、英国はその後、日本の記載なし／会話向けの属性は世界で利用可（2026-05-20）／AIの分析は US・CA・AU・IN・NZ〕、ChatGPTの3つの入口（OAI-SearchBot・約24時間で反映、フィード、Shopify/Etsy）、2025-09の発表の並べ方（在庫・価格・品質・主な販売元）、フィードの項目とWooCommerceの対応表、申し込みの流れ（Business Hub・本人確認・国と通貨・手動/HTTPS/SFTP・全件）、ChatGPTとGoogleの比較表、優先順7つ、WordPress手順〔Nurevo はフィードを作らないと明記〕、確かめ方のコマンド、チェックリスト10、FAQ 7問）。2言語（ja・en） | EC | content/daily-20261122-17 |
メモ：2026-11-22 17時の回は、OpenAIのヘルプ 11128490（ChatGPT検索のショッピング）と「Powering product discovery in ChatGPT」は取得できず、販売店向けページ（日付なし）・2025-09-29の発表・開発者向けの仕様で書いた。フィードの仕様ページは要約での確認のため、必須項目と対象国だけに絞った（ページ内に Stable と Draft の両方の表記があるとの報告あり、要再確認）。手数料は2025年の発表（少額の手数料）と販売店向けページ（手数料なし）が食い違うため、新しい販売店向けページに合わせた。日本の利用者の画面にショッピングが出るかは公式の記載がなく、書いていない。Perplexityのショッピング、承認までの期間、WooCommerce本体のGTIN欄、コンバージョン率の数字は書いていない。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に chatgpt-shopping-product-feed を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. ペットサロン・トリミングのAI検索対策（動物病院 PR #84 と分けて）【業種別】
3. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
4. 制作会社向け：ECサイトの保守契約に「商品データの整合チェック」を足す方法【制作会社向け】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-22 20時 | agency-ai-crawler-blocking-audit | CloudflareやWAFがAIのクローラーを止めていないか確かめる手順（制作会社向け。上位記事13本〔Impress Watch（2026-09-18）・Kinsta日本語（2026-09-18更新）・GMO robots.txt解説（2026-11-16更新）・@IT（2025-10-07）・Zenn（2025-04-24）／Playwire（2026-06-15）・Search Engine Land WP Engineの事例・HackerNoon（2026-11-19）・RunCloud（2026-07-25更新）・RightBlogger（2026-10-30更新）・CMSWire（2026-09-24）・dev.to・Brunch（2026-06-12）〕の抜けの表、4つの層の表〔robots.txt・CDN/WAF・サーバー・プラグイン、応答コード、確かめる場所。WP Engineの429の事例は1サイト〕、HackerNoonの640サイトの調査（591中100がGPTBot/ClaudeBotを拒否、robots.txtに書いていたのは4、無作為でない）、Cloudflareの2026年の変更の表〔7-01 検索/エージェント/学習の3区分を無料プランにも・9-15以降の新規ドメインは広告のあるページで学習とエージェントをブロック・9-15 Disallow AI Training追加、Block AI Botsのスイッチ廃止予定、Managed robots.txt→Bot Preference Sync〕、学習のブロックがGooglebotなど兼用クローラーに影響する注意、curlとログの確認コマンド（なりすましの限界）、Cloudflareの画面の確認5つ、サーバー・プラグインの確認5つ、方針の表4行と報告の文例、WordPress手順〔Nurevoは robots.txt の層だけ・診断はWAFを見ない〕、保守の毎月の確認6つ、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261122-20 |
メモ：2026-11-22 20時の回は、OpenAI・Perplexity・Anthropic・Googleのクローラーの公式ページ、Cloudflareの block-ai-bots・Bot Fight Mode・日本語のプレスリリースを WebFetch の許可待ちで読めなかった。クローラーの名前と用途はプラグインの readme と既存記事（2026-10-31に読んだ内容）に合わせ、公式ページへのリンクを付けた。Bot Fight Mode で認証済みボットが除外されるか、ChatGPT-User・Claude-SearchBot・PerplexityBot のCloudflareでの区分、日本のレンタルサーバーのWAFの既定、クロールと流入の比（出典で食い違う）は書いていない。9-15の既定が新規ドメインだけかは changelog の記述に合わせた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に agency-ai-crawler-blocking-audit を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. ペットサロン・トリミングのAI検索対策（動物病院 PR #84 と分けて）【業種別】
3. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
4. 制作会社向け：ECサイトの保守契約に「商品データの整合チェック」を足す方法【制作会社向け】
5. 次の月曜（11-23）の書き直し候補：aeo-vs-seo-vs-geo（AEO・GEO・SEOの違い、短い初期版）
| 2026-11-22 調査 | research-ca-web-agencies-ai-search-2026 | 国別レポート5本目：カナダ（掲載1,335件中到達908件〔HTTP 202が122件・13.4%、200だけで llms.txt 26.5%・6項目すべて21.9%、対米国200で差なし p=0.73/0.85〕、llms.txt 22.9%〔208件、米国23.1% p=0.95・英国21.5%・豪州24.3%と差なし、日本13.4%の1.7倍〕、JSON-LD 68.1%〔日本69.4% p=0.47〕、FAQPage 8.0%〔対米国 p=0.048〕、6項目すべて18.9%〔米国と同じ〕・平均3.58、17か国表で llms.txt 12位・AIボットのブロック率は4番目に低い、AIボットのブロック3.5%〔23/660、対米英豪は差なし〕、ボット別表〔学習用2.4〜3.5%・検索/質問時用4種は1件0.2%〕、GPTBotブロック19件すべてOAI-SearchBotは許可、7ボット同一の組み合わせ15/25、構造化データの型〔加・米・英・豪・日、壊れ率1.1%〕、WordPress 71.6%・Yoast 53.7%・Rank Math 21.4%・AIOSEO 7.1%〔SEOPress 3件は省略〕、非WPは200だけでも llms.txt 5.9%、.ca 301件 vs .com 499件〔llms.txt 20.3% vs 24.4% p=0.20、JSON-LD 62.8% vs 70.3% p=0.03〕、6項目の分布、州・言語別は件数不足で未実施）。PR TIMES 文なし（国別の初回ではないため） | raw_2026-11-12（summary.byCountry.CA と一致） | ja/en/fr | content/research-20261122 |
メモ：2026-11-22 の調査回も新しい summary が来ていない（最新は 2026-11-12）ため総論の更新はせず、未着手の国別（カナダ）にした。フランス語版は src/content/research-ca-web-agencies-ai-search-2026/fr.json。AIクローラー（#77）・llms.txt（#83）・構造化データ（#89）は未マージPRに原稿があるため重ねていない。次の国別候補：フランス（405件、fr）・南アフリカ（389件）・ニュージーランド（417件）・シンガポール（641件）。
| 2026-11-23 8時（月曜・書き直し） | aeo-vs-seo-vs-geo | スカイスクレイパー方式で全面書き直し（2026-10の短い版から）：AEO・GEO・LLMO・AIOとSEOの違い。上位記事13本〔Ahrefs JA（2026-07-17、08-20更新）・Adobe JP（2026-07-10）・ステラジェント（11-08更新）・サングローブ（11-20更新）・Ahrefs JA「GEOはSEOと同じ」（2025-05-29、2026-02-19更新）・issoh（10-30更新）／HubSpot（11-10更新）・Yext（2025-09-22）・Backlinko・Neil Patel・Progress（2026-04-16）・NeuronWriter（2026-08-05）。Search Engine Land は取得できず〕の抜け〔WordPress手順なし・測り方が道具の名前だけ・一次情報が少ない・AIOの二重の意味に触れない・ベンダーの自社製品寄り〕を埋めた。用語の一覧表5行（出どころ・指すもの、AIO＝AI Optimization／AI Overviews の二重の意味）、同じものかの整理、SEOとの比較表7行、分かっていること表6行〔GEO論文 Aggarwal ほか KDD 2024：GEO-bench 1万件・最大40%・Perplexity.ai 最大37%（arXiv v3 2024-06-28）／Google AI機能：特別な対策不要（既存記事で確認済みの内容）／Search Console 生成AIレポート（2026-08-31〜全世界、表示回数のみ）／Bing AI Performance（2026-02-10 公開プレビュー：Copilot・Bing のAI要約・一部パートナー、引用数・引用ページ・グラウンディングクエリ）・2026-06-16 意図・トピック・引用シェア・期間比較／Nurevo 62件 ρ=0.03〕、優先順位6つ、測り方の表5行、WordPress手順6つ〔SEO SIMPLE PACK・VK併用 0.9.1、検索用と学習用クローラーの分け方、無料AIチェック、Pro 月14,800円〜／USD 99〕、提案を受けたときの確認表5行、チェックリスト10、FAQ 7問。41言語（39言語は書き直した英語から再翻訳） | 書き直し | content/daily-20261123-08 |
翻訳の補完ログ：2026-11-23 dermatology-clinic-ai-search に39言語を追加（41言語）。
メモ：2026-11-23 8時の回は、Google「AI 機能とウェブサイト」と arXiv の abs ページが WebFetch の許可待ちで読めず、Google の説明は既存記事（2026-10-30・11-10に確認、最終更新 2025-12-10）の内容に合わせた。GEO論文は arXiv の HTML 版（v3）で読み、キーワードの詰め込みが効かなかった点は本文で確認できなかったため書いていない。AEO・LLMO・AIO の言葉の初出年、各語の検索数、AIで店を探す人の割合は書いていない。セルビア語のグロッサリーの「AI crawlers」（крулери）は誤記の可能性があると翻訳担当から報告あり（今回の翻訳では「AI претраживачки ботови」）。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧から dermatology-clinic-ai-search を除いたもの。次は person-profile-page-ai-search）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. ペットサロン・トリミングのAI検索対策（動物病院 PR #84 と分けて）【業種別】
3. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
4. 制作会社向け：ECサイトの保守契約に「商品データの整合チェック」を足す方法【制作会社向け】
5. Bing Webmaster Tools の AI Performance の見方（Copilot での引用数・グラウンディングクエリ・引用シェア）【計測】
6. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-23 11時 | pet-salon-grooming-ai-search | トリミングサロン・ペットサロンのAI検索対策（業種別。動物病院 PR #84 とは分け、診療の話は書かない。AIに聞かれる質問の型6つの表〔料金・時間と送迎・受け入れ条件・安全・健康の相談・信頼〕、上位記事10本を選び8本を読んだ〔uravation トリミングサロン（2026-08-08、09-05更新）・uravation AI活用（2026-06-07、10-23更新）・GMO ローカルAIO（11-16更新）／Texta（2025-03）・Netranks（2026-05-13）・getseoforai・PetBizAI（2025-06-22、2026-07-14更新）・RefreshAI。adsx は取得できず、aiofacts は別ドメインへ転送〕の抜け、第一種動物取扱業〔環境省：保管＝顧客の動物を預かる業、例に「美容業者（動物を預かる場合）」／広島県 2025-01-10：広告に8項目・HPやSNSも対象・更新時に番号を直す／埼玉県 手引き 25.11.20版：同項目・有効期間5年・2か月前から更新〕のサイト表示の表6行、獣医療との線引き〔農林水産省 FAQ 2024-12-12：病気を治す目的のシャンプー不可・スケーラーでの歯石除去は診療・歯石は歯磨きで取れない／日本獣医師会 2019-04-15：爪切り・耳そうじ・トリミング・シャンプー・肛門しぼり・歯磨きは診療でない、注射・麻酔・投薬・診断は診療〕と言い換え表5行、ページに書く8つの事実、構造化データ〔schema-dts 2.1.0：トリミングの型なし、PetStore は「A pet store」、LocalBusiness を推奨、VeterinaryCare と BeautySalon は使わない〕、WordPress手順〔「その他」→LocalBusiness、販売中心は「小売店」＋PetStore、「美容サロン」「クリニック・歯科」は選ばない〕、Instagram・予約サイト・GBPとそろえる、チェックリスト10、確かめ方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261123-11 |
メモ：2026-11-23 11時の回は、保管の数値基準（ケージの広さ・従業者の数）の省令は読んでおらず書いていない。飼い主の前でその場で仕上げる形が登録の対象かは公的資料に明記がなく、「自治体の窓口に確認」とした。「無麻酔歯石除去」について獣医師団体の声明は読んでおらず、農林水産省の「スケーラーでの歯石除去は診療」「歯石は歯磨きで取れない」だけを書いた。日本以外の制度、相場の料金、AIでサロンを探す人の割合、罰則は書いていない。英語の上位記事の数字（口コミ50件、成約率23倍など）は出典がないか販売会社の主張のため使っていない。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に pet-salon-grooming-ai-search を追加、ja/en のみ。次は person-profile-page-ai-search）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 制作会社向け：ECサイトの保守契約に「商品データの整合チェック」を足す方法【制作会社向け】（今日の14時か17時で）
3. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
4. Bing Webmaster Tools の AI Performance の見方（Copilot での引用数・グラウンディングクエリ・引用シェア）【計測】
5. ペットホテル・ペットシッターのAI検索対策は今回と重なるため保留。代わりに、写真館以外の出張撮影・ドッグトレーナー（訓練業）のAI検索対策【業種別】
| 2026-11-23 14時 | agency-ec-product-data-check | ECサイトの保守に「商品データの整合チェック」を足す方法（制作会社向け。chatgpt-shopping-product-feed とは分け、保守の作業と報告に絞る。上位記事16本〔Salesforce JP チェックリスト（2026-11-17更新）・Shopify JP ECの構造化データ（2026-07-23）・ネットショップ担当者フォーラム 15079（2025-11-07）・ECのミカタ 48397（会員限定で本文未読）・コマースピック 98063（2026-07-21）・Business Insider Japan（2026-09-28）・Shopifyヘルプ・stellagent（別記事が返った）／SEJ フィードの担当（2026-06-10）・BelVG（2026-06-12）・Yotpo（2026-10-20更新）・Sitebulb（2026-03-31）・TechWyse（2026-09-07）・DesignRush（2026-10-05）・Redefine Web（2026-09-22更新）・dev.to EShopSet〕の抜けの表、Googleの説明の表5行〔Merchant Center ヘルプ 12159029：ページ・構造化データとの比較、不承認・アカウント停止の可能性、JSで入れた価格はエラー、構造化データが違えば不承認が続く／9773429：警告・事前の不承認、審査7営業日・不合格で7営業日の待機／14916353：自動更新でも重大なエラー扱い／7331077：サーバーのHTML、表示と一致、自動更新に price・priceCurrency・availability・condition〕、AIの回答の数字〔Product.ai（BI Japan）：913件中85%が今の価格と一致・Googleは開発者APIと反論／Productrise（TechWyse）：AIモードと通常検索で38.1%不一致・相関のみ／Profound（DesignRush経由）：フィード由来61.54%・追跡した質問のみ〕、4か所×9項目の表、ずれの原因と直し方8行、毎月の手順8つとPythonのスクリプト（フィードCSVとページのJSON-LDのprice・availabilityを比較、ローカルで動作確認済み）、AIの回答の確かめ方、報告の文例、契約の範囲の表4行、WordPress手順〔Nurevo：OnlineStore、トップに OfferCatalog 最大30件、商品ページはWooCommerceに任せる、llms.txt は新しい50件・get_price のまま（税抜入力なら税抜）・transient 最大1日・保存で作り直し、MerchantReturnPolicy、フィードは作らない〕、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261123-14 |
メモ：2026-11-23 14時の回は、WooCommerce本体の構造化データの項目（priceValidUntil の既定値、税の扱い）はコードを読んでおらず書いていない。日本の総額表示とMerchant Centerの税の扱い、BelVGの「68%」（件数の記載なし）、Yotpoの市場の数字、日本の保守の相場は書いていない。Product.aiの原典・Productriseの原典・SEJのProfoundの記事は二次情報（報道）で確認し、その旨を本文に書いた。Search Central の販売者のリスティングのページは一部を要約で確認。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に agency-ec-product-data-check を追加、ja/en のみ。次は person-profile-page-ai-search）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で、17時か20時で）
3. Bing Webmaster Tools の AI Performance の見方（Copilot での引用数・グラウンディングクエリ・引用シェア）【計測】
4. 出張撮影・ドッグトレーナー（訓練業）のAI検索対策【業種別】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-23 17時 | bing-webmaster-ai-performance | Bing Webmaster Tools の AI Performance の見方（計測。search-console-ai-features の Microsoft 版、役割を分ける。上位記事11本〔uravation（2026-11-04）・Adobe Experience League JA（2026-10-03更新、動画のみ）・pasqualepillitteri JA（ボット対策で読めず）／Search Engine Land 468751・Similarweb（2026-02-16、09-22更新、例の数字は仮定）・Practical Ecommerce（2026-06-22）・SER（2026-06-17）・PinMeTo（2026-07-03）・TechWyse（2026-06-17）。SEL 480277・472320 は取得できず〕の抜け〔WordPress手順なし・Google以外のAIとの並べ方なし・見えたことを直しにつなげる表なし・小規模事業者の例なし〕を埋めた。指標の表5行〔Bing Webmaster Blog 2026-02-10：公開プレビュー、Copilot・BingのAI要約・一部の提携先、グラウンディングクエリは標本、順位・位置を示さない、robots.txtを守る、IndexNow・Bing Placesを推奨〕、追加機能の表6行〔Microsoft Advertising 2026-03-23 Page Mapping／Bing Search Blog 2026-06-16 Intents・Topics・Citation Share（競合ドメインを見せない・アクセスのシェアでない・品質の点数でない）・Compare（30日 vs 前30日・任意）／Bing Webmaster Blog 2026-10-13 Topics Portfolio ベータ（1〜3か月、Topic Size・Sites Cited・Queries は概数、Opportunity Queries、方向を示すもの）〕、始め方〔GSCからの取り込み・約24時間・書き出しは Practical Ecommerce による〕、6月1日の急増はバックフィル（PinMeTo、二次情報）、見えたこと→やることの表5行、毎月の記録の表5行（Search Console・Perplexity・参照元）、WordPress手順6つ〔表示設定・robots.txtのBingbot・確認コード・サイトマップ・IndexNow・Bing Places、Nurevo の許可一覧に Bingbot はない〕、チェックリスト10、制作会社の報告の注意、FAQ 7問）。2言語（ja・en） | 計測 | content/daily-20261123-17 |
メモ：2026-11-23 17時の回は、Bing のヘルプ（AI Performance・サイトの追加と確認）が WebFetch の許可待ちで読めず、データの更新頻度・保存期間・API・国や言語の制限・公式の意図の一覧は書いていない。uravation が書いている「ページ単位のAIグラウンディングの制御（Disallow／DisallowExtended、2027-02-01から）」は Bing のブログの一覧で見つからず書いていない。SEOプラグインの Bing 確認コード欄・IndexNow 機能はプラグイン名を挙げずに一般的に書いた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に bing-webmaster-ai-performance を追加、ja/en のみ。次は person-profile-page-ai-search）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
3. 出張撮影・ドッグトレーナー（訓練業）のAI検索対策【業種別】（20時で）
4. Bing Places for Business の登録と、Copilot での店舗情報のそろえ方【店舗】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-23 20時 | dog-training-ai-search | ドッグトレーナー・犬のしつけ教室のAI検索対策（業種別。pet-salon-grooming-ai-search〔保管〕とは分け、訓練業に絞る。上位記事14本を選び12本を読んだ〔uravation トリミングサロン（2026-08-08、09-05更新）・uravation スクール・教室（2026-07-21、09-05更新）・GMO ローカルAIO（11-16更新）・assist-all 2本（ペット以外）・くらしのマーケットの出張しつけの掲載／Texta dog training（2025-03）・NetRanks（2026-05-13）・WebFX（2026-07-28更新、AIの話なし）・Barketing（2026-05-29）・BlogPaws（2025-05-15）・SEJ 地域検索のAI Overviews（2026-07-22、Whitespark 68%）。petscare は取得できず、wagbar は別記事〕の抜け〔しつけ教室向けの日本語記事なし・出張訓練が登録対象である根拠なし・WordPress手順と構造化データのコードなし・英語は出典のない口コミ件数と「成果保証」の推奨〕を埋めた。質問の型6つの表、第一種動物取扱業「訓練」〔環境省：顧客の動物を預かり訓練を行う業・例に出張訓練業者・飼養施設がなくても対象／東京都 2026-07-10更新：「出張も含む」・広告の8項目／福岡市 2026-11-11更新：訓練場は施設で訓練する場合だけ〕の表示の表6行、言い切らない書き換え表5行、ページに書く8つの事実〔厚生労働省：犬の登録・年1回の狂犬病予防注射・鑑札と注射済票〕、構造化データ〔schema-dts 2.1.0：犬の訓練の型なし→LocalBusiness＋Service、Courseは使わない〕、WordPress手順〔「その他」、出張エリアの専用欄はないので説明に書く〕、GBPのサービス提供地域（ヘルプ 9157481）、チェックリスト10、確かめ方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261123-20 |
メモ：2026-11-23 20時の回は、飼い主が自分の犬を扱うグループレッスンやオンライン相談だけの形が登録の対象かは公的資料に明記がなく「自治体の窓口に確認」とした。日本以外のトレーナーの資格制度、民間資格の団体の要件、相場の料金、特定商取引法の対象か、AIでトレーナーを探す人の割合は書いていない。GBPのヘルプは検索結果のページ名で確認した（本文は未読）。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に dog-training-ai-search を追加、ja/en のみ。次は person-profile-page-ai-search）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
3. 出張撮影（フォトグラファー）のAI検索対策【業種別】
4. Bing Places for Business の登録と、Copilot での店舗情報のそろえ方【店舗】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）

| 2026-11-23 調査 | research-fr-web-agencies-ai-search-2026 | 国別レポート6本目：フランス（掲載821件中到達405件〔HTTP 202は7件・1.7%のみ、200だけで llms.txt 26.9%・6項目すべて24.4%・平均4.80、対米国200で差なし p=0.96/0.37〕、6項目の平均4.71・JSON-LD 90.1%は17か国で最高、5項目以上74.3%、llms.txt 26.4%〔107件、フランス以外の海外26.4% p=1.00・英国21.5% p=0.06・スペイン31.9% p=0.16・イタリア20.0%・日本13.4%の2.0倍〕、5項目サイト204件中196件は llms.txt だけ欠け、6項目すべて24.0%〔17か国で7位、対英国 p=0.01〕、AIボットのブロック1.9%〔7/378、日本に次いで低い、Fisher：対英 p=0.018・西 0.031・伊 0.005・海外 0.002・日本 0.34〕、検索/質問時用4種のブロック0件、GPTBotブロック5件すべてOAI-SearchBotは許可、7ボット同一の組み合わせ4/7、構造化データの型〔仏・英・西・伊・日〕、WordPress 92.3%〔日本と同じ〕・Yoast 55.9%・Rank Math 20.9%〔AIOSEO 11件・SEOPress 4件は省略〕、WP どうしで llms.txt 27.5% vs 海外33.3% p=0.023、.fr 209件 vs .com 143件〔llms.txt 21.5% vs 33.6% p=0.017・6項目すべて18.2% vs 32.2% p=0.004〕、6項目の分布）。PR TIMES 文なし（国別の初回ではないため） | raw_2026-11-12（summary.byCountry.FR と一致） | ja/en/fr | content/research-20261123 |
メモ：2026-11-23 の調査回も新しい summary が来ていない（最新は 2026-11-12）ため総論の更新はせず、未着手の国別（フランス）にした。フランス語版は src/content/research-fr-web-agencies-ai-search-2026/fr.json。比較相手は欧州（英国・スペイン・イタリア）と日本。次の国別候補：シンガポール（641件）・南アフリカ（389件）・ニュージーランド（417件）・ブラジル（261件、pt）・スペイン（248件、es）。
| 2026-11-24 8時 | bing-places-ai-search | Bing Places for Business の登録と、Copilot・Bing での店舗情報のそろえ方（店舗・全業種。bing-webmaster-ai-performance〔計測〕とは分け、掲載の登録・同期・重複・サイトとの一致に絞る。上位記事14本〔Whitespark（2025-10-30更新）・BrightLocal（2025-07-16更新）・Birdeye（2026-07-01更新）・SocialPlaces（2026-07-10）・theStacc（2026-07-10更新）・MediaOfficers（2026-08-03）・Semrush（2023-08-17）・Widewail（2024-09-17）・daltonluka（2026-01-02更新）・Omnyra（2026-08-10）・Flento（2026-10-23更新）・FitSmallBusiness（2023-10-31）／assist-all（2026-04-20、Bingマップ中心）・0120.co.jp（2026-10-19更新、Bing Places なし）〕の抜け〔「CopilotはBing Placesを使う」を出典なしで断定・同期の上書きの向きを書かない・重複の直し方なし・サイトの構造化データとの対照なし・WordPress手順なし・日本向けの情報なし〕を埋めた。2025-10-03 の作り直しの表5行〔Bing Search Blog：bing.com/forbusiness へ移転・自動移行・Google取り込みの改善・Recommendation Tool・一括編集、Copilot連携は「今後」〕、わかっていること・いないことの表5行、登録手順6つ〔取り込み最大2日（Microsoft Q&A 2025-11）、カテゴリは取り込まれない（2023の担当者回答）〕、同期の表5行〔GBPがBingを上書き・Bingから GBP は直せない・公開の周期 約10日（2023、作り直し前）〕、重複の直し方5つ〔Microsoft Q&A 2026-06：別のデータ源から自動作成・サポートへ・確認を進めない・編集の提案は「うまくいくこともある」〕、3か所の対照表6行、WordPress手順5つ〔Nurevo：PostalAddress・+81の電話番号・openingHoursSpecification・同じ @id に足す・0.9.1 併用〕、確かめ方5つ、チェックリスト10、制作会社向け、FAQ 7問）。41言語 | 店舗 | content/daily-20261124-08 |
翻訳の補完ログ：2026-11-24 person-profile-page-ai-search に39言語を追加（41言語）。
メモ：2026-11-24 8時の回は、bing.com/forbusiness と Bing Webmaster Guidelines が WebFetch の許可待ちで読めず、対応する国（日本の住所で登録できるか）、日本で選べる確認の方法、作り直し後の公開までの時間、ログインに使えるアカウントの種類は書いていない（「画面で確かめる」とした）。同期の向き・約10日・カテゴリは作り直し前（2023）のサポート担当者の回答で、その旨を本文に書いた。写真100枚・カテゴリ10個は Whitespark の二次情報。「Copilot が Bing Places を使う」「Windows検索・Edgeに出る」は制作会社の主張として扱い、事実としては書いていない。表の caption はリンクを描画しないため、出典リンクは本文に置くこと（今回 caption の SEJ のリンクを外した）。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧から person-profile-page-ai-search を除いたもの）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
3. 出張撮影（フォトグラファー）のAI検索対策【業種別】
4. 制作会社向け：お客様のGBP・Bing Places・サイトの対照表を保守報告に入れる方法【制作会社向け】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-24 11時 | used-car-dealer-ai-search | 中古車販売店のAI検索対策（業種別。整備工場・車検の PR #87〔未マージ〕とは分け、販売・在庫・価格表示に絞る。質問の型6つの表、上位記事13本を選び11本を読んだ〔uravation 自動車販売店・整備工場（2026-08-01、09-05更新）・assist-all 自動車整備LLMO（2026-01-30、06-09更新）・0120.co.jp 自動車AIO（2026-07-29、10-22更新）・GMO ローカルAIO（11-16更新）・車選びドットコム（2023-03-30、消費者向け）／Marchex（2025-08-14）・Dealer.com GEO（2026-05-04更新）・Fullpath（2025-07-09）・Cox Automotive（2026-03-27更新）・Keyloop（2025-10-30、11-09更新）・Car Dealership Guy News（2026-01-29）。aipicks・AutoSuccess は取得できず〕の抜け〔古物商の表示・売約車の扱い・WordPress手順・車1台ずつの構造化データの例がない、英語は6本中5本が販売店向け製品の会社で統計の多くが出典なし〕を埋めた。支払総額〔自動車公正取引協議会 PDF 2023年4月：2023-10-01施行、支払総額＝車両価格＋諸費用、諸費用は保険料・税金・登録等に伴う費用のみ、納車準備費用などは車両価格に、強制の保証・整備も車両価格に、Webサイトと中古車情報サイトも変更、厳重警告・違約金・社名公表／パンフレット 2023_07：「諸費用0円」不可／チェックリスト 2020.04：「コミコミ価格」「諸費用込価格」は違反例〕の書き方の表5行、必要表示事項7つの表〔車両価格・支払総額・走行距離・保証の有無・定期点検整備・修復歴の有無・車台番号下3桁、登録済未使用車の「未走行」「0km」は不当表示のおそれ〕、売約車の扱い5つ、古物商の表示〔警視庁（2024-04-17更新）：第12条第2項 氏名又は名称・公安委員会の名称・許可証の番号、5人以下などは対象外だが特定古物商は必要（第8条の2第1項）／静岡県警（2026-10-26更新）：URLの届出と公表〕、構造化データ〔schema-dts 2.1.0：AutoDealer（LocalBusiness・AutomotiveBusiness の下）、Car の dateVehicleFirstRegistered・mileageFromOdometer・knownVehicleDamages、Offer の price に支払総額／Google 更新履歴 2025-09-09：vehicle listing の説明を「検索結果に表示されなくなった」として削除〕、WordPress手順7つ〔Nurevo：ウィザード「その他」→設定の「業種（schema.org型）」に AutoDealer、在庫の車はサービスに入れない、Car は出さない〕、ポータル・GBP・Bing の対照表5行、チェックリスト10、確かめ方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261124-11 |
メモ：2026-11-24 11時の回は、schema.org のページと Google の 2025-06 のブログ（simplifying search results）が WebFetch の許可待ちで読めず、型と項目は schema-dts 2.1.0 で確認した。Google の 2023 年の発表の対象国（米国のみか）は本文を逐語で確認できなかったため書いていない。修復歴にあたる部位の定義、メーター交換の扱い、協議会の非会員への適用、日本以外の制度（米国の Buyers Guide など）、ポータルの在庫連動の機能、AIで車を探す人の割合は書いていない。くるまのニュースの「約9割」は協議会の調査の報道（二次情報）として書いた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に used-car-dealer-ai-search を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 制作会社向け：お客様のGBP・Bing Places・サイトの対照表を保守報告に入れる方法【制作会社向け】（今日の14時か17時で）
3. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
4. 出張撮影（フォトグラファー）のAI検索対策【業種別】（photo-studio-ai-search と分けて）
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-24 14時 | multilingual-site-ai-search | 多言語サイト（インバウンド・海外向け）のAI検索対策（制作会社向け。site-renewal-ai-search・agency-new-site-build-ai-search とは分け、言語ごとのURL・hreflang・言語でそろえる事実に絞る。上位記事13本を選び12本を読んだ〔uravation（2026-07-18、09-05更新）・DeepL掲載のWeglot（2026-06-19更新、noindex）・GOOD LUCK TRIP（2025-03-21更新、AIの話なし）・JNTO（2026-09-30）・Digima（2026-03-11、AIの話なし）／GSQi（2025-12-01）・Weglot（2026-08-10更新）・RWS（2026-04-28）・Lokalise（2026-11-16）・eSEOspace（2026-10-13、11-16確認）・MultiLipi（2026-05-27）。funnel-ai は別ホストに転送され読んでいない〕の抜け〔hreflang の例と相互の確かめ方なし・公式と推測の区別なし・言語でずれる事実の扱いなし・WordPress手順なし・見積もりと保守の扱いなし、英語は翻訳ツールの会社の調べ方のない数字〕を埋めた。わかっていること・いないことの表6行〔Google 多言語・多地域（ja 2025-12-18更新）：本文で言語判定・lang属性やURLは使わない・自動の転送を避ける・Googlebotは米国からAccept-Languageなし・1ページ1言語・テンプレだけの翻訳は重複／ローカライズ版（2026-09-21更新）：hreflangとlangは言語判定に使わない・相互に指さないと無視・3方法は同等・ISO 639-1/3166-1/15924・es-419不可・完全なURL／スパムポリシー（2026-11-23更新）：自動の変換の例に翻訳／Googleのコメント 2025-06（SER・GSQi）：AI翻訳はそれだけでスパムではない・robots.txtで自動翻訳をブロックする記述を削除／Bing 2020-09 Fabrice Canel：hreflangはcontent-languageより弱い／ChatGPT・Perplexity・Claude：公式の説明なし〕、GSQiの観察（仏・伊・西の3例、ChatGPT・Claudeは3例とも英語版、Copilotは3例とも正しい）、URLの分け方の表4行、そろえる事実と変えるものの表8行、hreflangのコード例と間違いの表5行、相互の確認のPythonスクリプト（public/ のローカルのファイルで動作確認済み）、構造化データの方針〔同じ@id・name/alternateName・inLanguage、Googleの決まりではないと明記〕、WordPress手順〔Polylang：自動・x-defaultはトップだけ・pll_rel_hreflang_attributes／WPML（2025-01-07更新）：自動・言語ごとのコード欄・誤りを警告しない／Nurevo：inLanguage は get_bloginfo('language')・Polylang/WPML専用の処理なし・会社情報は1組・llms.txt はサイトの言語で1つ／nurevo.jp の hreflang の例〕、言語ごとの確かめ方、見積もりの表5行、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261124-14 |
メモ：2026-11-24 14時の回は、hreflang-for-polylang のページが WebFetch の許可待ちで読めず、Polylang単体で足りない点の詳細は書いていない。Weglotの「327%」「431%」は調べ方がなく使っていない。GSQiの「Reddit の AI 翻訳が2026年5月のコアアップデートで下落」の記事は読んでおらず書いていない。Search Console の生成AIのレポートの国別の表示は確かめておらず、通常の検索パフォーマンスの国別だけを書いた。Bing の発言は2020年のもので古い旨を本文に書いた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に multilingual-site-ai-search を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で、17時か20時で）
3. 出張撮影（フォトグラファー）のAI検索対策【業種別】（photo-studio-ai-search と分けて）
4. 観光施設・体験アクティビティのAI検索対策（料金・所要時間・予約・言語対応）【業種別】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-24 17時 | activity-tour-operator-ai-search | 体験アクティビティ・ツアー事業者のAI検索対策（業種別。ホテル PR #62〔未マージ〕・lesson-studio-ai-search〔地元向けの教室〕・multilingual-site-ai-search〔URL設計〕とは分け、1体験1ページの事実・雨天中止とキャンセル料・Things to do に絞る。上位記事13本〔uravation 体験・観光アクティビティ（2026-10-12）・uravation 観光協会・DMO（2026-10-13）・0120.co.jp ホテル・観光業AIO（2026-07-21、10-22更新）・GOOD LUCK TRIP コラム（日付なし）・観光庁 生成AI活用（2025-03、業務活用）／Rezdy（2026-03-28、中身はゲート）・FareHarbor 2本（2025-11-10／2026-03-01、07-22更新）・Rezgo（2025-07-22、2026-05-01更新）・TrekkSoft（2026-07-31）・WP Travel Engine（2026-07-01、07-27更新）・TOMIS（2026-07-06）・PhocusWire（ニュース）〕の抜け〔英語8本中7本が予約システム・計測ツールの会社でコードなし・雨天中止とキャンセル料の書き方なし・法律の表示なし・Things to do の照合なし、日本語は構造化データとWordPress手順と旅行業・特商法の話なし〕を埋めた。質問の型6つの表、9つの事実の表、雨天・中止の書き換え表5行、日本の決まり〔観光庁 旅行業法の概要（2026-04-30更新）：第2条の行為・第1種は長官／和歌山県：運輸機関・宿泊を含むと登録、登録番号の表記／観光庁サイト掲載の販路構築の手引き：運送・宿泊を伴うと原則登録、体験だけの扱いは断定せず窓口へ／通信販売の申込み段階の表示ガイドライン（JCCI掲載の写し）：役務も対象、最終確認画面に撤回・解除の条件〕、Things to do〔広告ヘルプ 10723429：無料掲載と広告・接続パートナーを強く推奨（100未満）／13149532：予約ページは別ドメイン可だがサイトから明確にリンク・GBPなどで確認・一般的なトップページは不可／Actions Center 体験の最適化（2026-09-10）：大人1人の価格・含まれるもの・誇張しない・キャンセル規定・場所はページと照合／OBM（2026-04-01）：事業者名をページに〕、掲載先4つの役割の表、構造化データ〔LocalBusiness＋Service、TouristTrip（schema-dts 2.1.0：itinerary・offers・provider・touristType）は Nurevo が出力しない〕、WordPress手順7つ、チェックリスト10、確かめ方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261124-17 |
メモ：2026-11-24 17時の回は、e-Gov の旅行業法本文（第2条・第12条の7・第12条の8）と消費者庁の特定商取引法ガイド（第11条の表示事項）が WebFetch の許可待ちで読めず、条文の中身・広告の表示事項の一覧・体験だけを売る場合の登録の要否は書いていない（窓口に確認とした）。ガイドラインは JCCI の写しで発行日が見えない。Things to do の価格ポリシー（税・手数料）、対応言語、日本の接続パートナーの名前、水辺・山岳などの安全や保険の決まりは書いていない。PhocusWire の Phocuswright の数字は二次情報として書いた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に activity-tour-operator-ai-search を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で、20時で）
3. 出張撮影（フォトグラファー）のAI検索対策【業種別】（photo-studio-ai-search と分けて）
4. 制作会社向け：OTA・GBP・自社サイトの事実の対照表を観光・体験のお客様の保守に入れる方法【制作会社向け】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-24 20時 | wikipedia-wikidata-ai-search | Wikipedia・WikidataとAI検索：自社の記事は作るべきか（全業種・制作会社。company-profile-page-ai-search〔会社概要ページ〕・agency-ai-search-manipulation-risks〔不正な手法の断り方〕とは分け、Wikipedia の記事の可否・規則・Wikidata・ナレッジパネル・sameAs に絞る。上位記事11本を読んだ〔uravation（2026-07-18、09-05更新）・マネーフォワード（2026-02-26、利用者向けで対象外）・frank_marketing note（2026-05-15、出典のない基準と作成代行の宣伝）／wellows（2026-11-12）・Search Atlas（2026-04-06更新、出典のない数字・矛盾）・Agility PR（2026-06-05）・Writesonic（2025-09-29）・Wix（2025-08-26更新）・Radiant Elephant（2026-07-14）・parse.gl（2026-11-20更新）・iPullRank（2026-06-04）〕の抜け〔47.9%と7.8%などの数字の混同・WordPress手順なし・特筆性の判定を具体的な資料でできない・作成代行の確認点なし・ナレッジパネルの公式の説明なし・日本語版の規則の確認なし〕を埋めた。調査の表2行〔Profound（SER 2025-06-11）：3,000万件、2024-08〜2025-06、ChatGPT の上位の出典で47.9%・AIO 5.7%・Perplexity は Reddit 46.7%／Semrush（2025-11-10）：23万件×13週、ChatGPT の回答の約55%→9月中旬から20%未満・AIモード約2〜3%・Perplexity 0.8%〕、判定表8行〔ja「特筆性 (組織)」：独立した信頼できる二次情報源・プレスリリース/自社発行物/記事広告/名簿は不可・規模だけでは不可・宣伝は禁止・チェーンの各店は一般に不可／en「Wikipedia is not Crunchbase」：通常の事業活動の報道・創業者インタビューは不可〕、規則3つ〔en COI：直接編集は強く非推奨・ノートで提案・AfC・内容を管理する権利はない／有料編集の開示：雇用主・依頼主・関係、利用者ページ・ノート・要約欄、2014-06-16発効、プロジェクトごとの別方針可〕、作成代行の確認表5行、既存記事の直し方4つ（{{edit COI}}、Adobe LLM Optimizer の Wikipedia 分析）、Wikidata〔収録基準3つは二次情報で要約・原文を読むよう明記、開示の決まりは全プロジェクト〕、ナレッジパネル〔9787176：自動で作成・Wikipedia の名前なし／7534902：認証の手順〕、4つの置き場所の比較表、自社サイト〔Organization はホームか会社概要・必須項目なし・sameAs〕のJSON-LD例、WordPress手順〔Nurevo：Wikipedia/Wikidata は作らない・探さない、webmcp_canary_business_node で sameAs を足す、Yoast等が有効なら既存の値が優先、0.9.1 併用〕、確かめ方5つ、チェックリスト10、制作会社向け、FAQ 7問）。2言語（ja・en） | 全業種・制作会社 | content/daily-20261124-20 |
メモ：2026-11-24 20時の回は、Wikidata のページ（Help:Items・Wikidata:Notability・Help:Editing）、英語版の WP:PAID・NCORP、日本語版の WP:NRVE が取得できず、Wikidata の基準は二次情報（parse.gl・uravation）の要約として書き、原文を読むよう本文に書いた。日本語版Wikipediaの利益相反のページは読んでおらず、英語版のガイドラインとして書いた。有料編集の発効日は Meta の FAQ（Wayback 2021-09-29）による。wellows 等の「7.8%（ChatGPT の全引用）」は一次情報を読めず書いていない。AIが Wikidata をどう使うか、記事の削除率、反映までの時間は書いていない。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に wikipedia-wikidata-ai-search を追加、ja/en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
3. 出張撮影（フォトグラファー）のAI検索対策【業種別】（photo-studio-ai-search と分けて）
4. 掲載実績・メディア掲載ページの作り方（独立した報道をAIと編集者に見つけてもらう）【全業種】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-24 調査 | research-sg-web-agencies-ai-search-2026 | 国別レポート7本目：シンガポール（掲載974件中到達641件〔HTTP 202が47件・7.3%、200だけで llms.txt 41.9%・6項目すべて35.0%・平均4.70、対インド200で p=0.043/0.036〕、llms.txt 38.8%〔249件〕と6項目すべて32.4%は17か国で1位、対インド差なし〔p=0.33/0.23〕・対豪米英NZ日本 p<0.001・対フィリピン llms.txt p=0.045、JSON-LD 80.8%〔3位、対インド p=0.042〕、FAQPage 15.0%・AIボットに言及22.0%・JSON-LD 壊れ率4.1%も17か国で最高、言及してもブロックしない86件〔15.8%、海外5.8%〕のうち62件に llms.txt、AIボットのブロック5.7%〔31/546、対インド・米国・海外は差なし、対マレーシア p=0.009〕、ボット別表〔学習用4.6〜6.0%・検索用3種は同じ1件〕、GPTBotブロック28件中27件がOAI-SearchBotは許可、7ボット同一の組み合わせ25/34、アジア太平洋10か国・地域の表〔台湾60・韓国36・マレーシア80・香港79件を含む〕、構造化データの型〔星・印・豪・米・日〕、WordPress 81.3%・WP どうしでも llms.txt 46.3% vs 海外32.4%〔p<0.001〕・vs インド39.5%〔p=0.007〕、Yoast 50.3%・Rank Math 23.0%・AIOSEO 6.0%〔llms.txt 64.5%〕〔SEOPress 1件は省略〕、.sg（.com.sg 含む）50件 vs .com 413件〔JSON-LD 64.0% vs 83.1% p=0.001、llms.txt p=0.060〕、5項目239件中207件は llms.txt だけ欠け、llms.txt 行数の中央値88行、6項目の分布）。PR TIMES 文なし（国別の初回ではないため） | raw_2026-11-12（summary.byCountry.SG と一致） | ja/en（シンガポールの主な業務言語が英語のため） | content/research-20261124 |
メモ：2026-11-24 の調査回も新しい summary が来ていない（最新は 2026-11-12）ため総論の更新はせず、未着手の国別（シンガポール）にした。AIクローラー（#77）・llms.txt（#83）・構造化データ（#89）は未マージPRに原稿があるため重ねていない。次の国別候補：南アフリカ（389件）・ニュージーランド（417件）・ブラジル（261件、pt）・スペイン（248件、es）・フィリピン（241件）。未着手の「日本と海外の比較（総論）」も残っている。
| 2026-11-25 8時 | media-coverage-page-ai-search | メディア掲載ページの作り方：AI検索に報道を見つけてもらう（全業種・制作会社。company-profile-page-ai-search〔会社概要〕・wikipedia-wikidata-ai-search〔特筆性・sameAs〕・agency-ai-search-manipulation-risks とは分け、自社サイトの掲載実績ページの中身・権利・表示に絞る。上位記事14本〔sungrove（2026-11-16更新）・AIsmiley（2026-10-29更新）・uravation サイテーション（2026-09-05更新）・Meltwater JP 2本（2026-09-15・10-22）・MarkeZine 49504（AD）・共同通信PRワイヤー 汐留PR塾（2026-04-21更新）／Presspage（2026-02-02）・Business Wire（2026-03-12更新）・PR Newswire・Meltwater EN（2026-09-10更新）・Agility PR（2026-04-22）・5WPR（2026-11-22更新）・ContentGrip（2026-09-21）〕の抜け〔自社の掲載ページの具体的な項目なし・WordPress手順なし・ステマ規制なし・著作権は1本だけ・数字の母数の混同〕を埋めた。調査3本の表〔Muck Rack 2026-05：2,500万件超・ChatGPT/Claude/Gemini・earned 約84%・報道 約27%・広告0.3%・57%が12か月以内／Muck Rack 2025-12：100万件超・報道25%弱・earned 82%・リリース1.2%→約6%／BuzzStream 2026-03：約400万件・3,600問・ニュース14.09%・ブランド7.26% vs 比較約18%・通信社0.21%・自社ニュースルーム2.98%（ChatGPT 18.15%、母数不明と明記）〕、LeadCoverage の「25%」の誤読の注意、3つの置き場所の表、1件ごとの8項目の表〔日本新聞協会 Q&A 2021-12-10 を目安に〕、著作権〔アドタイ 2026-07-03：複製は原則許諾、2023年判決 日経約696万円・中日約133万円〕、ステマ規制〔消費者庁：2023-10-01、新聞・雑誌も対象、広告主が責任〕、rel="sponsored"、構造化データ〔subjectOf・award、リッチリザルト対象外、見える内容だけ〕、WordPress手順〔Nurevo：llms.txt は最近更新の30件→webmcp_canary_llms_txt_lines で固定、business_node で subjectOf、0.9.1 併用〕、確かめ方5つ、チェックリスト10、制作会社向け、FAQ 7問）。41言語 | 全業種・制作会社 | content/daily-20261125-08 |
翻訳の補完ログ：2026-11-25 b2b-saas-ai-search に39言語を追加（41言語）。注：how-to-appear-in-chatgpt.mjs の slug は appear-in-chatgpt で、翻訳は src/content/appear-in-chatgpt/ に既にある（ファイル名ではなく slug で未翻訳を判定すること）。
メモ：2026-11-25 8時の回は、Muck Rack の詳しい方法（generativepulse.ai）、消費者庁の告示本文・Q&A（記事広告の扱い）、アドタイの2ページ目（リンク・見出しの扱い）は読んでおらず書いていない。日本語の質問での割合、テレビ・ラジオの引用の割合、AIが subjectOf を使うかは確認できず書いていない。日本新聞協会の Q&A は検索サービス向けの資料で、目安として使った旨を本文に書いた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧から b2b-saas-ai-search を除いたもの。次は access-directions-parking-ai-search。ai-visibility-check は en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
3. 出張撮影（フォトグラファー）のAI検索対策【業種別】（photo-studio-ai-search と分けて）
4. 制作会社向け：プレスリリースの書き方をAI検索向けに整える代行メニュー（media-coverage-page-ai-search と分け、リリース本文に絞る）【制作会社向け】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-25 11時 | on-location-photographer-ai-search | 出張撮影・フリーランスのカメラマンのAI検索対策（業種別。photo-studio-ai-search〔スタジオ型：持ち帰る総額・衣装・時期のページ〕とは分け、スタジオのない出張撮影の撮影エリア・出張費・撮影場所の許可・雨天とキャンセルに絞る。上位記事14本〔uravation 写真館（2026-08-12）・a-x.inc LLMO（2025-11-14）・クラウドワークス 費用相場（2020-07-08、2026-09-29更新）・@SOHO 2本（2026-05-29／06-28）・くらしのマーケット 出張撮影一覧・stock-sun（出典のない数字多数）／Format（2026-09-01、10-09更新）・PhotoBiz 2本（2025-09-05／2026-07-27）・PhotoWorkout（2026）・DEV Community 結婚式（2026-11-23更新）・Semrush 結婚式SEO（2024-03-25、noindex）・Texta（日付なし、出典のない「50件・4.5」）〕の抜け〔住所を出さずにエリアを示す方法・撮影場所の許可・雨天とキャンセルの書き方・WordPress手順・確かめ方がない、JSON-LD は DEV の1本だけ〕を埋めた。質問の型6つの表、エリアの書き換え表5行、GBP〔3038177：サービス提供地域は住所を非表示・看板のない出張型は1プロフィール・拠点から車で約2時間・私書箱/バーチャルオフィス不可・名前に地域名不可／9157481：最大20件・半径不可・最大48時間〕、総額の例の表5行〔NTA 6902 は 11-01 確認分〕、公園の許可の表4行〔杉並区（2026-10-09更新）：業としてのSNS・雑誌等は申請・個人のスナップは不要・写真1,997円/時・3日前に窓口／世田谷区（2026-05-01更新）：商用は規模にかかわらず・家族は不要・1,997円・5営業日前／港区（2026-04-13更新）：商業撮影・6,757円・当日先着／井の頭恩賜公園（2023-06-14改定）：土日祝不可・100円（30㎡以下）〕と「有料の家族撮影が商用にあたるかは書かれていない」の注記、雨天・キャンセルの表5行と消費者契約法9条1項1号〔消費者庁 検討会資料での引用〕・研究会の約6割〔ECのミカタ 2023-12-26〕、作例と掲載の同意、構造化データ〔schema-dts 2.1.0：Photographer 型なし・areaServed は Organization/Service/Offer〕の例、WordPress手順〔Nurevo：住所が空なら address を出さない・電話か時間で LocalBusiness・診断では住所が不足と数える・areaServed は webmcp_canary_business_node で足す（PHP例）〕、GBP・ポータル・SNSの対照表5行、チェックリスト10、確かめ方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261125-11 |
メモ：2026-11-25 11時の回は、Google の AI features のページ・国税庁 6902 が WebFetch の許可待ちで読めず、以前の回で確認した内容として引用した。消費者契約法の条文は e-Gov ではなく消費者庁の検討会資料での引用で確認した（Wikibooks は取得できず）。検討会資料の日付は本文に書いていない。神社・寺・商業施設・結婚式場の撮影の決まり、肖像権の法的な扱い、東京以外の公園の扱い、日本でAIでカメラマンを探す人の割合は書いていない。英語版の公園の例は日本のもので、国ごとに違う旨を書いた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に on-location-photographer-ai-search を追加、ja/en のみ。次は access-directions-parking-ai-search）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 制作会社向け：プレスリリースの書き方をAI検索向けに整える代行メニュー（media-coverage-page-ai-search と分け、リリース本文に絞る）【制作会社向け】（14時か17時で）
3. ハウスクリーニング・家事代行のAI検索対策（対応エリア・料金の内訳・損害の補償）【業種別】（on-location-photographer と同じ出張型だが、作業範囲と補償に絞る）
4. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-25 14時 | agency-press-release-ai-search | プレスリリースをAI検索向けに整える：制作会社の代行メニュー（制作会社向け。media-coverage-page-ai-search〔第三者の記事の一覧〕・agency-ai-search-manipulation-risks・agency-aeo-monthly-service とは分け、リリース本文・自社サイトの原本・リンクの決まり・確かめ方に絞る。上位記事15本〔uravation（2026-07-18、09-05更新）・汐留PR塾 3本（2026-02〜03、04-21更新）・共同通信PRワイヤー LLMO・Web担 PRIZMA（2025-12-10）・IDEATECH（2026-02-26）／Business Wire（2026-03-12）・PR Newswire ME・Notified（2026-05-12）・PR.co（2025-11-06）・Meltwater（2026-09-29）・Superprompt（2026-01-23）・Matter（2025-12-16）・Medianet（2025-10-22）〕の抜け〔自社サイトの原本と訂正の扱いなし・WordPress手順なし・Googleのリンクスパムの例に触れるのは1本だけ・確かめ方が手動の聞き取りだけ・調査の数字の数え方の区別なし・制作会社の作業の分け方なし〕を埋めた。調査の表4行〔Optyino.ai（2026-07-11）：81,895件・回答の15.05%・URLの2.20%・PR TIMES 60.5%・上位5で69.4%・本文内リンク0.63%、AIごとの割合7つ、限界／Muck Rack 2025-12：1.2%→約6%／Meltwater：2026年5月0.2%〕、本文の型、書き換え表5行、調査リリースの方法、やってはいけないこと〔Google スパムポリシー（ja 2026-11-24更新）：プレスリリース内の作為的なアンカーテキスト、nofollow/sponsored は違反でない、大量生成、2013年に追加（SEL）〕、WordPress手順〔Nurevo：SEOプラグインなしで BlogPosting の description は抜粋、日付・著者・画像・publisher、SEOプラグインがあれば Article はそのまま、llms.txt 30件と webmcp_canary_llms_txt_lines、0.9.1 併用〕、代行メニューの表5行〔料金は書かず、共同通信PRワイヤーの公表価格をja だけに例示〕、確かめ方5つ、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261125-14 |
メモ：2026-11-25 14時の回は、Google の外部リンクの属性・Article の構造化データのページ・PR TIMES の規約が WebFetch の許可待ちで読めず、rel の説明はスパムポリシーの記述だけで書き、PR TIMES の料金・規約は書いていない。2021年のリンクスパムのブログは本文が取得できず使っていない。Notified の「GlobeNewswire 61%」は母数が不明で使っていない。Optyino.ai の Gemini・Grok の数字は別ページで読んでおらず書いていない。英語版では日本の配信サービスの料金は書いていない。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に agency-press-release-ai-search を追加、ja/en のみ。次は access-directions-parking-ai-search）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. ハウスクリーニング・家事代行のAI検索対策（対応エリア・料金の内訳・損害の補償）【業種別】（17時か20時で）
3. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
4. 調査リリース・独自データのページの作り方（方法・限界・データの置き場所）【全業種】（agency-press-release-ai-search と分け、自社サイトのデータのページに絞る）
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-25 17時 | house-cleaning-housekeeping-ai-search | ハウスクリーニング・家事代行のAI検索対策（業種別。emergency-home-repair-ai-search〔緊急の修理〕・on-location-photographer-ai-search〔サービス提供地域の詳細〕とは分け、家に入るサービスの料金と追加料金の条件・破損の補償・鍵の預かり・スタッフの資格と認証・キャンセルに絞る。上位記事14本〔uravation（2026-08-13、09-05更新）・@SOHO AI集客ツール（2026-05-21、08-19更新）・サングローブ（2025-10-28、2026-07-15更新）・yoshikazunomori（2026-08）・GMO AIかんたん集客（2026-09-11、11-16更新）・stock-sun（日付なし）／Texta（2025-03、出典のない「口コミ50〜100件」）・ThinkProfits・Marchex（2025-08-15）・Jobber（2026-08-27、11-04更新）・Servgrow・Netpeak（2026-04-10）・eSEOspace（2026-10-13）、FirstSales は一覧ページが返り対象外〕の抜け〔追加料金の公的な事例なし・鍵の預かりの決め方なし・キャンセル規定の書き方なし・WordPress手順なし・JSON-LD の例なし〕を埋めた。質問の型6つの表（清掃と家事代行を分ける）、国民生活センター〔2025-02-28：換気扇5,000円→約60万円の事例・部品破損後に連絡不通・複数社の見積もり・補償と保険の確認・一定の要件でクーリング・オフ等／2026-06-03 エアコン修理：451件→1,251件、作業前の確認と帰る前の確認（修理の話と明記）〕、料金の表6行、補償の表5行、鍵〔介護関連サービス事業協会 ガイドライン 2025-03-30：やむを得ない場合だけ・預り証・マニュアル・持出記録〕、資格と認証〔厚労省 ハウスクリーニング技能士・指定試験機関 全国ハウスクリーニング協会／家事代行サービス認証：全国家事代行サービス協会・日本規格協会・2016年・3観点／METI 報告書：2025年1月末 19社〕、キャンセルの表4行と消費者契約法9条（ガイドラインでの言及）、GBP〔サービス提供地域・20件・約2時間・名前に地域名不可〕、構造化データ〔schema-dts 2.1.0：清掃の型なし・DryCleaningOrLaundry は衣類〕の例、WordPress手順〔Nurevo：「その他」＋HomeAndConstructionBusiness、専門サービスは ProfessionalService、住所が空なら出さない、areaServed は webmcp_canary_business_node、0.9.1 併用〕、チェックリスト10、確かめ方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261125-17 |
メモ：2026-11-25 17時の回は、ハウスクリーニング技能検定の級・開始年、家事代行サービス認証の基準の全文、@SOHO の損害保険の記事（取得失敗）、特定商取引法の適用条件は読んでおらず書いていない。英語版の日本以外の保険・身元確認・消費者の決まりは確認しておらず、国ごとに違う旨を書いた。Google のヘルプ 3038177・9157481 は同日11時の回で確認した内容による。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に house-cleaning-housekeeping-ai-search を追加、ja/en のみ。次は access-directions-parking-ai-search）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
3. 調査リリース・独自データのページの作り方（方法・限界・データの置き場所）【全業種】（20時で）
4. 制作会社向け：フランチャイズ加盟店のサイトをAI検索向けにそろえる運用（franchise-headquarters-ai-search と分け、制作会社の作業に絞る）【制作会社向け】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-25 20時 | original-research-data-page-ai-search | 独自調査・データのページの作り方：AI検索に引用される一次情報（全業種。agency-press-release-ai-search〔リリース本文と配信〕・media-coverage-page-ai-search〔第三者の記事の一覧〕・blog-articles-ai-citations〔普通の記事〕とは分け、自社サイトの調査ページの中身・方法と限界の書き方・データファイル・引用のルール・No.1表示の決まり・Dataset に絞る。上位記事12本を読んだ〔GMO AIかんたん集客（2026-08-06、11-16更新）・PRIZMA 2本（ASCII 2026-03-05・07-30）・ナレッジホールディングス（ASCII 2026-05-21）・IDEATECH（Web担）・TRUE MARKETING（2026-09-29）／Similarweb（2026-07-09、10-04更新）・Kevin Indig（Search Engine Land）・Ranktracker（2025-11-25）・Pollfish（2026-05-22）。media-radar・Neil Patel・SEL 481380 は取得失敗〕の抜け〔景品表示法・No.1表示の注意なし・データファイルとDatasetの説明なし・WordPress手順は1本だけ・研究の数字の条件の説明なし・小さな会社のデータの例なし〕を埋めた。研究3つの表〔GEO KDD 2024：19.3→統計25.2・引用27.2・出典24.6・詰め込み17.7、最大約40%（Perplexity 37%）／Indig・Gauge：301ページ中8ページ2.7%が引用8.4%、11.3対3.4、90件中75件はベンチマーク／SIGIR 2026：関連性と並び順、価格と日付〕、国内の担当者調査2つ（自己申告と明記）、独自データ5種類の表、調査ページの10項目の表、Nurevo の調査ページの実例、No.1表示〔消費者庁 2024-09-26 報告書：368件・1,000人・15社中1社、利用を確かめない満足度調査、責任は広告主／公取委2008／JMRA 2022-01-18〕、Dataset〔name・description 50〜5,000字必須、推奨項目〕、WordPress手順〔webmcp_canary_schema_graph の extra で Dataset、llms_txt_lines、0.9.1 併用〕、確かめ方5つ、チェックリスト10、毎年続ける、FAQ 7問）。2言語（ja・en） | 全業種 | content/daily-20261125-20 |
メモ：2026-11-25 20時の回は、消費者庁の報告書の本文（PDF。No.1表示の根拠の詳しい条件）を取得できず、条件の詳細は書いていない（長官の会見要旨と報道で確認した範囲のみ）。日本以外の広告規制は確認しておらず、英語版は国ごとに違う旨を書いた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に original-research-data-page-ai-search を追加、ja/en のみ。次は access-directions-parking-ai-search）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
3. 制作会社向け：フランチャイズ加盟店のサイトをAI検索向けにそろえる運用（franchise-headquarters-ai-search と分け、制作会社の作業に絞る）【制作会社向け】
4. 葬儀社・仏壇店のAI検索対策（PR #88 と重ならない形で、仏壇・墓石の店に絞る）【業種別】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-25 調査 | research-br-web-agencies-ai-search-2026 | 国別レポート8本目：ブラジル（中南米で初。掲載383件中到達261件〔HTTP 202は9件・3.4%、200だけで llms.txt 35.3%・6項目すべて26.2%・平均4.25、対米国200 p=0.005/0.15〕、llms.txt 34.1%〔89件〕は17か国で3位〔シンガポール・インドに次ぐ〕、対米国・日本 p<0.001・対海外 p=0.004・対スペイン差なし p=0.59・対ポルトガル p=0.29、6項目すべて25.3%〔5位〕・平均4.11、比較相手にスペイン語圏の中南米4か国〔メキシコ116・コロンビア81・アルゼンチン76・チリ50＝323件〕：llms.txt 24.5% p=0.011・JSON-LD 74.7% vs 54.8% p<0.001・WordPress 76.6% vs 47.7%・WP どうしでは llms.txt 38.5% vs 38.3%、FAQPage 13.4%〔3位、対米国 p<0.001〕、AIボットのブロック5.5%〔12/217、対米国 p=0.39・対日本 p<0.001〕、検索用4種は全ボット拒否の1件だけ、GPTBotブロック11件中10件がOAI-SearchBotは許可、7ボット同一の組み合わせ7/13、ポルトガル語圏・スペイン語圏7か国の表〔ポルトガル・チリのブロック率は robots.txt 30件未満で「—」〕、構造化データの型、Yoast 54.0%・Rank Math 26.0%〔llms.txt 55.8%〕〔AIOSEO 4件は省略〕、.com.br 127件 vs .com 58件〔差なし〕、5項目99件中83件は llms.txt だけ欠け、llms.txt 行数の中央値64行、0項目37件〔202が9件・200で何もなし28件〕、6項目の分布）。PR TIMES 文なし（国別の初回ではないため） | raw_2026-11-12（summary.byCountry.BR と一致） | ja/en/pt-BR | content/research-20261125 |
メモ：2026-11-25 の調査回も新しい summary が来ていない（最新は 2026-11-12）ため総論の更新はせず、未着手の国別（ブラジル）にした。ポルトガル語版は src/content/research-br-web-agencies-ai-search-2026/pt-BR.json。AIクローラー（#77）・llms.txt（#83）・構造化データ（#89）は未マージPRに原稿があるため重ねていない。次の国別候補：南アフリカ（389件）・ニュージーランド（417件）・スペイン（248件、es）・フィリピン（241件）・アイルランド（266件）。日本と海外の比較（英語中心）も未着手。
| 2026-11-26 8時 | driving-school-ai-search | 自動車教習所のAI検索対策（業種別。lesson-studio-ai-search〔習い事〕・学習塾 PR #78・access-directions-parking-ai-search〔アクセス〕とは分け、公安委員会指定の有無・卒業までの総額と含まれる/含まれないもの・追加教習と再検定・保証プラン・解約と返金・期間と予約・合宿の条件・実績の数字の定義に絞る。上位記事12本〔uravation（2026-08-11、09-05更新）・switchitmaker2（2025-02-16）・キャククル（2026-10-29更新）・coomil（日付なし）・rpa-support（2023-09-01）／texta.ai（日付なし）・bili-ai（2026-03-11）・Total Drive（2026-06-22）・ProfileTree（2026-07-25、11-16更新）・LinkGraph（2025-12-07）・Jobber（2026-08-27、11-04更新）・Whito データレポート（2026-11-25更新）。firstsales は一覧ページ、Whito の AI 記事は取得失敗〕の抜け〔指定の公的な出典なし・国民生活センターの注意なし・存在しない DrivingSchool 型を勧める記事あり・JSON-LD と WordPress 手順なし・合格率の定義なし・確かめ方が手動だけ〕を埋めた。警察白書 令和8年版〔2025年末 1,277か所、2025年中の試験合格の卒業者 144万6,135人、技能試験免除〕、茨城県警〔指定外は技能試験・取得時講習の免除なし〕、国民生活センター 子どもサポート情報 第230号（2026-02-19）〔予約が取れない・返金が少ない、所要期間・予約・追加料金・解約条件、指定と指定外の違い〕、京都府公安委員会 審査基準（2025-03-21）〔普通免許 学科 第一段階10・第二段階16時限〕、愛知県警〔教習所ごとの取得後1年の人身事故の公表〕、国税庁6902、schema-dts 2.1.0〔DrivingSchool 型なし、DrivingSchoolVehicleUsage は CarUsageType の値〕、質問の型6つの表、料金の表7行、JSON-LD 例、WordPress手順〔「その他」→LocalBusiness、サービスに免許の種類ごとのコース・時間は空欄可・0.9.1 併用〕、チェックリスト10、確かめ方、FAQ 7問）。41言語 | 業種別 | content/daily-20261126-08 |
翻訳の補完ログ：2026-11-26 access-directions-parking-ai-search に39言語を追加（41言語）。
メモ：2026-11-26 8時の回は、技能教習の最低時限数（AT/MT）、教習期限の長さ、卒業証明書の有効期間、合宿・通学の相場、AIで教習所を探す人の割合（業者の記事の数字は元の調査が確認できず）は書いていない。運転免許統計（r07main.pdf）の年別の卒業者数は抽出が要約だったため使っていない。schema.org のページは取得できず、schema-dts 2.1.0 で確認した。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧から access-directions-parking-ai-search を除いたもの。次は agency-ai-search-manipulation-risks〔2026-11-21 公開順〕。ai-visibility-check は en のみ）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
3. 制作会社向け：フランチャイズ加盟店のサイトをAI検索向けにそろえる運用（franchise-headquarters-ai-search と分け、制作会社の作業に絞る）【制作会社向け】
4. 仏壇・墓石の店のAI検索対策（PR #88 の葬儀社と重ならない形で）【業種別】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-26 11時 | butsudan-gravestone-shop-ai-search | 仏壇店・石材店のAI検索対策（業種別。uravation の霊園・墓石の記事〔区画が中心〕・葬儀社 PR #88〔未マージ〕・online-shop-ai-search とは分け、店側の事実＝墓石の総額の内訳と霊園に払うお金の区別・工事できる霊園の書き方・墓じまいで店がする工事としない手続き・仏壇の寸法/材料/製造地・修理と保証に絞る。上位記事11本〔uravation 霊園・墓石（2026-09-27）・サングローブ 石材店の集客（2019-03-25、2025-10-29更新、AI検索なし・市場規模に出典なし）・GMO ローカルAIO（2026-08-07、11-16更新）・サングローブ MEO×AI（2026-04-10、09-25更新）・uravation 買取（仏壇の記述なし）／Stone World（2025-06-02）・Texta stonemasons・Texta memorial garden stones・Funeral Guide UK（2025-11-04）・5W 葬儀分野のAI登場率（2026-04、墓石の結果なし）・coloradowebimpressions（monument は地名）〕の抜け〔仏壇店の記事なし・総額を分ける表なし・工事できる霊園の書き方なし・伝統的工芸品の表示の確かめ方なし・JSON-LD例と WordPress 手順なし〕を埋めた。質問の型6つの表、総額の内訳の表6行、墓じまいの表6行〔総務省 東北管区行政評価局：改葬 H26 約8万4千→R6 約17万6千（衛生行政報告例）／国民生活センター「墓」2023年度1,046・2024年度1,018・2025年度1,077（2026-05-31現在、2026-07-31更新）、事例は寺院の離檀料・解約料〕、仏壇〔伝統的工芸品241品目（R7-10-27、滋賀県）・彦根仏壇・大阪仏壇 S57-11-01・三河仏壇 S51-12-15・広島仏壇 S53・伝統証紙は産地組合等の検査に合格（滋賀県・伝産協会 公募資料）・名古屋仏壇 地域団体商標 第5098956号〕、FTC〔Funeral Rule は monument dealers に適用されない・墓地が認める墓石の種類を確認（2024-03-04更新）〕、構造化データ〔schema-dts 2.1.0：専用の型なし・Cemetery は CivicStructure・Store＋Service〕、WordPress手順〔ウィザード「小売店」→Store、型名を入力すればその型で出力、サービス最大20、areaServed は webmcp_canary_business_node、0.9.1 併用〕、チェックリスト10、確かめ方、FAQ 7問）。2言語（ja・en） | 業種別 | content/daily-20261126-11 |
メモ：2026-11-26 11時の回は、墓石の価格の相場、石材の産地表示の決まり、霊園の指定石材店の割合、仏壇の国内生産の割合、仏壇の処分の宗教上の作法、AIで石材店・仏壇店を探す人の割合は確認できず書いていない。厚労省 001765354.pdf の「令和7年度 改葬191,212件」は図の抽出で区分が確かめにくく使っていない。総務省の資料の発行日は本文から確認できず書いていない。英語版の米国以外の墓地・石材の決まりは確認しておらず、国・墓地ごとに違う旨を書いた。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に butsudan-gravestone-shop-ai-search を追加、ja/en のみ。次は agency-ai-search-manipulation-risks）
次の候補：
1. 制作会社向け：フランチャイズ加盟店のサイトをAI検索向けにそろえる運用（franchise-headquarters-ai-search と分け、制作会社の作業に絞る）【制作会社向け】（14時で）
2. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
3. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
4. 遺品整理・不用品回収のAI検索対策（許可の区分・料金・買取との違い）【業種別】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
| 2026-11-26 14時 | agency-reviews-testimonials-ai-search | 口コミ・お客様の声とAI検索：制作会社が守るルールと整え方（制作会社向け。agency-ai-search-manipulation-risks〔不正な手法全般〕・media-coverage-page-ai-search〔第三者の報道〕・bing-places-ai-search とは分け、口コミの依頼の決まり・お客様の声ページ・自己言及レビューの構造化データ・点検と記録に絞る。上位記事15本〔訪日ラボ/mov（2026-10-29）・GMO NIKKO AIかんたん集客（2026-11-16更新）・マイナビTECH+ LLMO（2026-09-10）・PRONIアイミツ お客様の声（2025-01-17）・キーワードマーケティング（2022-10-25）・Google Japan Blog クチコミの仕組み（2022-02-02）・ネットショップ担当者フォーラム（2022-09-20）／Seer Interactive（2026-05-14）・Whitespark（2025-09-15更新）・Search Engine Land（Amsive）・Trustmary（2026、満足度を先に聞いて満足した人だけを口コミサイトへ＝選別した依頼を勧める）・SEJ スポンサー記事（Reviewly、2026-09-09）・Birdeye（2026-08-17更新）・eClincher（2026-10-23）・Trustpilot〕の抜けの表、調査の表3行〔Seer 804,491件：口コミ・信頼性サイトの出典の割合 1.51%→16.24%→24.27%、引用率の中央値 1% vs 53.5%／Whitespark Bing Places の口コミの出どころ Facebook 716・Yelp 482・TripAdvisor 217／mov アンケート〕、依頼の「してよい・いけない」表5行〔Googleマップの虚偽のエンゲージメント・FTC 465.4/465.5/465.7・ステマ告示〕、ビジネスプロフィールの制限3つ、ステマ規制（2023-10-01、第三者に依頼した投稿も広告、規制は事業者）、FTC 規則（2024-10-21施行、代理店も免責されない、警告書のひな形 2025-12-22・1件最大53,088ドル）、依頼文の例、お客様の声の型〔許可・時期・利用内容・当社から・お礼の有無〕、医療の体験談の禁止〔厚労省 事例解説書〕、自己言及レビュー〔review snippet 2026-09-17更新・2019-09-16 ブログ・埋め込みウィジェットも対象〕と点検用のコンソールのコード、Nurevo は店・会社のノードに評価を出さず WooCommerce の商品はレビュー1件以上のときだけ aggregateRating、WordPress手順5点、メニューの表5行、確かめ方〔Pro は抜粋を残し誤りを人が印付け、口コミは比べる条件にだけ使う〕、チェックリスト10、FAQ 7問）。2言語（ja・en） | 制作会社向け | content/daily-20261126-14 |
メモ：2026-11-26 14時の回は、消費者庁のステマ告示の運用基準（PDF）と Q&A を読めておらず、従業員の口コミ・対価つきの口コミの具体例は日本語版に書いていない（Googleマップのポリシーと FTC の規則で書いた）。eCFR の 16 CFR 465 は取得できず、条文の区分は FTC の警告書のひな形の添付（2025-12-17 時点）で確認した。FTC の Q&A の 465.7・465.8 の部分は要約しか取得できず使っていない。Google のレビュー抜粋のページは英語版も日本語で返ったため、英語版の文言は日本語版と 2019 年のブログで確認した。SOCi の調査（eClincher の記事が紹介）は元の資料を読んでおらず使っていない。口コミの件数・星の基準、AI の会社による口コミの重みづけは確認できず書いていない。候補にあった「制作会社向け：フランチャイズ加盟店のサイトの運用」は franchise-headquarters-ai-search の「本部・加盟店・制作会社で、誰が何を直すか」と加盟店の自社サイトの FAQ に大きく重なるため見送った。
翻訳の残り（8時台で補完）：ja/en のみの記事から順に（前回の一覧に agency-reviews-testimonials-ai-search を追加、ja/en のみ。次は agency-ai-search-manipulation-risks）
次の候補：
1. 比較サイト・ポータルに載っている自社情報の直し方（掲載先の一覧と更新依頼の文例）【全業種】（PR #80 と重ならない形で）
2. 行政書士・社労士などの士業のAI検索対策（業務範囲と報酬額の表示）【業種別】（PR #63 と重ならない形で）
3. 遺品整理・不用品回収のAI検索対策（許可の区分・料金・買取との違い）【業種別】
4. 制作会社向け：口コミへの返信の代行（返信の型、否定的な口コミ、業種別の注意。今回の記事の依頼の章と重ならない深さで）【制作会社向け】
5. 次の月曜（11-30）の書き直し候補：appear-in-chatgpt（ChatGPTに載る方法、初期版。how-to-appear-in-chatgpt と役割を分ける）
