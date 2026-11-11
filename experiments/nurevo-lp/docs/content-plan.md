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
| 2026-11-11 11時 | seikotsuin-ai-search | 整骨院・接骨院のAI検索対策（令和7年2月18日のあはき・柔整広告ガイドライン：サイトは原則広告ではない／広告・バナー・SNSは3要件で広告、サイトに書くべきでない表現、広告できる事項と「各種保険取扱い」「交通事故取扱い」の不可、協会けんぽの保険の対象・対象外・医師の同意・令和9年1月の償還払い、自費メニューの書き方、MedicalBusiness/LocalBusinessの選び方、WordPressでの手順、チェック表）。2言語（ja・en） | 業種別 | content/daily-20261111-11 |
1. 不動産会社のAI検索対策（物件情報・対応エリア・RealEstateAgent、宅建業法の広告ルール）【業種別】
2. MEO会社のAI検索対策：Googleビジネスプロフィールとサイトの事実をそろえる【制作会社向け】
3. SWELL・Lightningでの構造化データとllms.txtの整え方（テーマ別の注意）
4. 学習塾のAI検索対策（コース・料金・対象学年・体験授業）【業種別】
5. 鍼灸院・マッサージ院のAI検索対策（あはき法の広告事項、整骨院記事との違い）【業種別】
翻訳の残り（8時台で補完）：search-console-ai-features、seikotsuin-ai-search（ja/en のみ）ほか未マージPRの ja/en 記事。

## 調査レポート（research-）ログ

| 日付（JST） | スラッグ | 切り口 | データ | 言語 | PR |
|---|---|---|---|---|---|
| 2026-11-10 | research-japan-web-agencies-ai-search-2026 | 総論（国内Web制作会社サイトのAI検索対応状況） | summary_2026-11-05 | ja/en | content/research-20261110（未マージの #57・#60 と同じ切り口。#60 の原稿を最新の main に載せ直したもの） |

未着手の切り口：AIクローラーのブロック実態（ボット別）／llms.txt 導入率／構造化データの種類と壊れ率／都道府県別／WordPress と非WordPress／SEOプラグイン別／日本と海外の比較／国別（UK・US・AU・CA・DE・FR など）／AI対応スコア分布。
| 2026-11-02 17時 | agency-aeo-proposal-audit | 制作会社向け：AI検索対策の初回診断と提案書の進め方（診断を「読めるか／どう見えているか」に分ける7ステップ、質問の3種類、結果の優先順位表、提案書の8章テンプレート、約束してはいけない表現の言い換え〔Google「SEOの専門家が必要ですか？」・生成AI最適化ガイド・第三者ツールのページ〕、Search Console生成AIパフォーマンスレポート）。ja/en のみ（他言語は後日の8時台で補完） | 制作会社向け | content/daily-20261102-17 |
翻訳の残り（8時台で補完）：dental-clinic-ai-search、agency-aeo-proposal-audit。
次の候補：
1. BtoB・SaaSのAI検索対策：サービス・料金・導入事例ページとllms.txt【業種別】
2. 飲食店のAI検索対策：メニュー・営業時間・予約・アレルギー表示の書き方【業種別】
3. AIからのアクセスを解析ツールで見分ける方法（参照元・utm_source・AIクローラのログ、Search Console生成AIパフォーマンスレポート）
4. 士業（税理士・行政書士・弁護士）のAI検索対策：専門分野・対応地域・料金表示と広告規程【業種別】
5. SWELL・Lightning・SEO SIMPLE PACKでのAI検索対策（テーマ・プラグイン別の構造化データの出方）
| 2026-11-02 20時 | b2b-saas-ai-search | BtoB・SaaSのAI検索対策（質問の型6つ、Organization・Service・SoftwareApplication、SoftwareApplicationのリッチリザルト要件〔評価・レビュー必須〕とレビューの見返り開示、FAQリッチリザルト終了〔2026-06-15〕、料金ページ・比較ページ・導入事例の書き方、法人番号、レビューサイト等の社外情報の一致、OAI-SearchBot・PerplexityBot、WordPressでの設定）。ja/en（他の39言語は後日の8時台で補完） | 業種別 | content/daily-20261102-20 |
1. AIからのアクセスを解析ツールで見分ける方法（参照元・utm_source・AIクローラのログ）
2. 飲食店のAI検索対策：メニュー・営業時間・予約・アレルギー表示の書き方【業種別】
3. 士業（税理士・行政書士・弁護士）のAI検索対策：取扱業務・料金・広告規程【業種別】
4. MEO会社・WordPress保守会社がAI検索対策を保守メニューに足す方法【制作会社向け】
5. 商品フィードとAI：Merchant Center・ChatGPTの商品フィード・構造化データの役割分担（online-shop-ai-search の続き）
翻訳の補完待ち：b2b-saas-ai-search（ja/en のみ）、agency-aeo-proposal-audit（PR #50 マージ後）、dental-clinic-ai-search（未マージなら）。
| 2026-11-03 | restaurant-ai-search | 飲食店・カフェ・バーのAI検索対策（質問の型と必要な事実の表、AIが読む情報源、メニューを文字で・総額表示・GBPのメニュー機能、Restaurantの構造化データ〔Google推奨のmenu・servesCuisine・priceRange、schema.orgのacceptsReservations・hasMenu〕、アレルギー情報の出し方〔外食は表示義務の対象外・コンタミ・更新〕、口コミ、WordPressでの設定、AIの回答が間違ったときの直し方、測り方）。41言語 | 業種別 | content/daily-20261103-08 |
翻訳の補完ログ：2026-11-03 dental-clinic-ai-search に39言語を追加（ja/en と合わせて41言語）。main の公開記事はすべて41言語にそろった（未マージPR #50・#51 は ja/en のみ、マージ後に補完）。
1. AIからのアクセスを解析ツールで見分ける方法（GA4の参照元・utm_source=chatgpt.com・AIクローラのログ）
2. 士業（税理士・弁護士・行政書士）のAI検索対策：取扱業務・料金・相談方法と広告規程【業種別】
3. 宿泊施設（旅館・ホテル）のAI検索対策：部屋・料金・アクセス・予約サイトとの整合【業種別】
4. MEO会社・WordPress保守会社がAI検索対策を既存の月額に組み込む方法【制作会社向け】
5. 商品フィードとAI：Merchant Center・ChatGPTの商品フィード・構造化データの役割分担
| 2026-11-10 | professional-firm-ai-search | 士業（弁護士・税理士・行政書士など）のAI検索対策（LegalService / AccountingService、取扱業務を資格の範囲内で相談者の言葉で、対応地域・資格者・料金の決まり方、広告の規程と守秘義務、WordPressでの設定）。ja/en（11時台） | 業種別 | content/daily-20261110-11 |
メモ（2026-11-10 11時台）：未マージPRのテーマ（重複回避）：#50 提案書と初回診断（制作会社向け）、#51 BtoB・SaaS、#53 飲食店、#62 宿泊。各士業会の広告規程の一次情報は今回取得できなかったため、条文は引用せず「所属会の規程で確認」とした。取得できたら条文リンクを追記する。
1. 整骨院・接骨院・整体院のAI検索対策：施術メニューの書き方と広告の制限【業種別】
2. 不動産会社のAI検索対策：RealEstateAgent と物件情報・会社情報の書き方【業種別】
3. 学習塾のAI検索対策：コース・料金・時間割をAIに読ませる【業種別】
4. WordPress保守会社がAI検索対策を保守プランに組み込む方法【制作会社向け】
5. AIからのアクセスを解析ツールで見分ける方法（参照元・utm_source・AIクローラのログ）
| 2026-11-10 | ai-traffic-google-analytics | GA4でAIからの流入を見る方法（標準の「AI アシスタント」チャネル、Perplexity・Claudeの取りこぼし、カスタムチャネルグループの正規表現と並び順、AIによる概要・AIモードはオーガニック検索、参照元のない訪問はダイレクト、着地ページとキーイベント、月次の記録表、GA4で見えないものとの分担、WordPress〔Site Kit〕での導入確認）。2言語（ja・en） | 実践ガイド | content/daily-20261110-14 |
1. 制作会社・WordPress保守会社向け：保守プランにAI検索対策を組み込む方法（作業範囲・月次報告にGA4のAIの行と登場率を入れる）【制作会社向け】
2. 整骨院・接骨院のAI検索対策（施術内容・保険の扱い・広告規制との関係）【業種別】
3. 不動産会社のAI検索対策（物件情報・対応エリア・RealEstateAgent）【業種別】
4. Search ConsoleでGoogleのAI機能（AIによる概要・AIモード）の影響を見る方法（ai-traffic-google-analytics の続き）
5. SWELL・Lightningでの構造化データとllms.txtの整え方（テーマ別の注意）
| 2026-11-10 17時 | wordpress-maintenance-ai-search | WordPress保守会社のAI検索対策（保守作業ごとの事故と確認方法の表〔移転時の「インデックスしない」設定＝WP5.3以降はrobotsメタタグ、X-Robots-Tag・Basic認証の持ち込み、WAF・CDNのボット対策〔Cloudflare の Search/Agent/Training ポリシー、兼用クローラ〕、物理robots.txt、SEOプラグイン・テーマ変更、キャッシュ〕、作業のたび・毎月・移転時のチェックリスト、月次報告に足す行、アクセスログでの確認〔UA偽装テストの限界〕、Nurevo診断の限界）。2言語（ja・en） | 制作会社向け | content/daily-20261110-17 |
1. 整骨院・接骨院のAI検索対策（施術内容・保険の扱い・広告規制との関係）【業種別】
2. 不動産会社のAI検索対策（物件情報・対応エリア・RealEstateAgent）【業種別】
3. MEO会社のAI検索対策：Googleビジネスプロフィールとサイトの事実をそろえる（保守会社向けとは別の読者）【制作会社向け】
4. Search ConsoleでGoogleのAI機能（AIによる概要・AIモード）の影響を見る方法
5. SWELL・Lightningでの構造化データとllms.txtの整え方（テーマ別の注意）
翻訳の残り（8時台で補完）：wordpress-maintenance-ai-search（ja/en のみ）ほか未マージPRの ja/en 記事。
| 2026-11-11 8時 | （新規記事なし） | 不動産会社のAI検索対策を予定。上位記事の調査は済んだが、一次情報（schema.org・不動産公正取引協議会・e-Gov）をこの回は取得できなかった（実行中の取得許可が得られず）ため、確認できない事実を書かないルールに従い見送り | — | content/daily-20261111-08 |
翻訳の補完ログ：2026-11-11 dental-clinic-ai-search に39言語を追加（ja/en と合わせて41言語）。残り：search-console-ai-features、research-japan-web-agencies-ai-search-2026（ja/en のみ）ほか未マージPRの ja/en 記事。

### 調査メモ：不動産会社のAI検索対策（2026-11-11、次の回で執筆）
上位記事（日本語）：assist-all.co.jp/note/llmo-ai-real-estate-roadmap/、jinrai.co.jp/blog/2026/05/20/real-estate-aio-optimization-strategy/、uravation.com/llmo/fudosan-aio-taisaku/、0120.co.jp/blog/aio-145/、koukoku.jp/service/suketto/marketer/?p=29364。
上位記事（英語）：housingwire.com（seven tips / cited-in-ai-answers）、colibrirealestate.com、singlegrain.com（GEO for Realtors）、jefflenney.com/real-estate/schema-markup-guide、nowbam.com、thepaperlessagent.com。
共通の不足：AIでの登場を繰り返し測る方法がない／WordPressでの手順がない（JSON-LDの実例は Lenney のみ）／出典のない統計が多い・売り込みが強い／日本の広告ルール（宅建業法32条・34条、不動産の表示に関する公正競争規約の徒歩80m=1分・取引態様・おとり広告・免許番号）に触れていない／FAQ・HowTo・自社レビューの構造化データについて古い・誤った助言がある。
書く前に一次情報で確認すること：schema.org RealEstateAgent の親（LocalBusiness）と RealEstateListing、Google の検索ギャラリーに不動産物件のリッチリザルトがないこと、rftc.jp の表示規約・施行規則の条番号、e-Gov の宅建業法32条・34条。Nurevo の事実：設定の「専門サービス」カードの仲間に RealEstateAgent（includes/setup-wizard.php）、RealEstateListing はページ種別としてSEOプラグイン側に任せる（nurevo-webmcp.php webmcp_canary_page_type_families）。
