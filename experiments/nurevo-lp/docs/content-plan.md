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
