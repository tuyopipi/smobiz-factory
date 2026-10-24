# サイト種別（Site types）: 店舗 / EC / BtoB — Phase 1 設計

Nurevo はこれまで店舗・地域ビジネス（LocalBusiness）専用だった。Phase 1 では
サイトごとに **site type** を持たせ、出力（JSON-LD / llms.txt）・診断（score）・
AI登場率の測定（SoV question templates）・サイト外チェック（off-site checklist）を
種別に合わせる。**`local` の挙動は一切変えない**（main から採取した golden で回帰テスト）。

| site type | 対象 | 業態の例 |
|---|---|---|
| `local`（既定・未設定も local） | 来店・訪問される事業者 | 飲食・美容・クリニック・士業の事務所・宿泊 |
| `ec` | オンラインショップ（e-commerce） | WooCommerce / Shopify 等の通販 |
| `b2b` | BtoB・SaaS・専門サービス | SaaS、受託開発、コンサル、法人向けサービス |

## 1. AI 回答エンジンが種別ごとに必要とするもの（根拠つき）

まず前提として、正直に書いておくべきこと:

- Google は「AI Overviews / AI Mode に出るための追加要件や特別な最適化はない」「特別な
  schema.org も新しい AI 用ファイル（llms.txt 等）も不要」と明言している
  （[AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)）。
  構造化データは **ページの可視テキストと一致していること** が求められる。
- したがって Nurevo の価値は「AI専用の裏技」ではなく、**事業者の事実を、機械が読める形で、
  欠けなく・矛盾なく公開すること** にある。構造化データや llms.txt が AI の回答に
  どれだけ効くかを直接示す公開データはない（ChatGPT / Perplexity / Claude は仕様を公開していない）。
  効果の主張はしない。測定（Pro の AI 登場率）は観測であって因果の証明ではない。

### EC（online shop）

| 必要な情報 | schema.org / 仕様 | 出典 |
|---|---|---|
| 運営者の実体 | `Organization` の最も具体的なサブタイプ。EC は **`OnlineStore`** を推奨。必須プロパティなし、`name` `url` `logo` `contactPoint` `email` `telephone` `address` 等を推奨 | [Google: Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) / [schema.org/OnlineStore](https://schema.org/OnlineStore) |
| 商品と価格・在庫 | `Product` + `Offer`（`price` `priceCurrency` `availability`）、`sku` `brand` `image`。merchant listing は `name` `image` `offers.price` `priceCurrency` が必須 | [Google: Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) / [Product snippet](https://developers.google.com/search/docs/appearance/structured-data/product-snippet) / [schema.org/Product](https://schema.org/Product) [Offer](https://schema.org/Offer) |
| 評価 | `AggregateRating` / `Review` は **実在するレビューのみ**。自作・自己評価はスパム扱い | [Google: Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) / [schema.org/AggregateRating](https://schema.org/AggregateRating) |
| 返品条件 | `MerchantReturnPolicy`。組織単位では `hasMerchantReturnPolicy`。**`merchantReturnLink` のみでも要件を満たす**（Option B） | [Google: Return policy](https://developers.google.com/search/docs/appearance/structured-data/return-policy) / [schema.org/MerchantReturnPolicy](https://schema.org/MerchantReturnPolicy) |
| 送料・配送 | 組織単位は `hasShippingService` → `ShippingService`（`shippingConditions` が必須）。商品単位は `OfferShippingDetails` | [Google: Shipping policy](https://developers.google.com/search/docs/appearance/structured-data/shipping-policy) / [schema.org/OfferShippingDetails](https://schema.org/OfferShippingDetails) |

### BtoB / SaaS / 専門サービス

| 必要な情報 | schema.org / 仕様 | 出典 |
|---|---|---|
| 企業の実体 | `Organization`（`name` `url` `logo` `description` `contactPoint` `sameAs` 等） | [Google: Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| 何を提供しているか | `Service`（`name` `description` `provider` `serviceType` `offers`）/ ソフトウェアは `SoftwareApplication`（`applicationCategory` `operatingSystem` `offers`） | [schema.org/Service](https://schema.org/Service) / [Google: Software app](https://developers.google.com/search/docs/appearance/structured-data/software-app) |
| よくある質問 | `FAQPage` は **ページ上に見える FAQ にだけ**付ける | [Google: FAQ](https://developers.google.com/search/docs/appearance/structured-data/faqpage) |
| 料金・導入事例 | 構造化データの要件ではない。比較・検討系の質問（「◯◯ 比較」「おすすめの◯◯ツール」）に答える材料として本文・llms.txt に必要 | — （経験則。効果の定量的根拠はない） |

### Nurevo が影響を与えられるもの / 与えられないもの

| 影響できる（自社サイト上） | 影響できない |
|---|---|
| JSON-LD の種類・項目の欠け（実データがある範囲） | AI エンジンの学習・ランキング・引用の選び方 |
| llms.txt（商品・サービス・ポリシーのページ） | 第三者レビュー（ITreview / G2 等）の件数・評価 |
| AI 検索クローラーの robots.txt 許可 | モール・Merchant Center・LinkedIn 等の掲載内容（**確認手順の提示のみ**） |
| 診断で欠けている事実と、その直し方の提示 | Google の rich result 表示可否（要件を満たしても表示は保証されない） |
| 測定（Pro）: 実際の回答に名前・URL が出るかの観測 | 測定結果を上げることの保証 |

## 2. 種別の保存と設定

- D1: `site_settings.site_type`（`local`/`ec`/`b2b`、NULL は local）。**migration `0044_site_types.sql`**
  （0043 は feat/dashboard-59-locales が使用）。同じ migration で
  `site_products.brand/image/rating_value/review_count`、`site_services.description/url/kind`、
  `site_pages.role` を追加。すべて nullable の追加のみ。
- migration 未適用でも壊れない: `site_type` は profile フィールドとは別の読み書き（`loadSiteType`
  / `writeSiteType`）で、未適用時は local 扱い・書き込みは `migration_pending` を返す。
  カタログ同期は新列が無ければ旧列だけで書き直す（D1 batch はトランザクションなので部分書き込みなし）。
- 設定する場所: ダッシュボードのサイト設定（セレクト）、WordPress プラグインの設定（「サイトの種類」）、
  セットアップウィザード（カードに「ECサイト」「BtoB・SaaS」を追加）。WooCommerce が有効で未選択なら
  **EC を提案するだけ**（保存するまで変えない）。
- 同期: プラグインは owner が選んだときだけ profile PUT に `site_type` を載せる。profile GET は
  `site_type` を返し、ダッシュボードで選ばれた ec/b2b はプラグインに反映される（どちらも人の選択なので最新が勝つ）。

## 3. 出力（never fabricate）

| | local（不変） | ec | b2b |
|---|---|---|---|
| business node `@type` | 既存どおり（LocalBusiness 等） | `OnlineStore`（owner の型が OnlineStore/OnlineBusiness/Organization/Corporation ならそれ） | `Organization`（owner の型が Organization 系ならそれ） |
| 住所・電話 | 既存どおり | 入力済みなら出す（必須ではない） | 同左 |
| openingHours / geo / priceRange / ReserveAction | 既存どおり | **出さない** | **出さない** |
| 追加ノード | なし | `OfferCatalog`（同期済み商品の `Product`+`Offer`。価格が無ければ Offer なし、在庫不明なら availability なし、レビュー件数が無ければ rating なし）、返品ページがあれば `hasMerchantReturnPolicy{merchantReturnLink}` | 入力されたサービスごとに `Service` / `SoftwareApplication`（説明・URL・カテゴリは入力された場合のみ） |
| llms.txt | 既存どおり | ショップ情報（サイト・メール・電話・返品・配送）＋商品一覧 | 会社情報（料金・導入事例ページ）＋サービス一覧 |

- 商品ページの `Product` は WooCommerce 自身が出す。Nurevo はトップページに一覧（OfferCatalog）を
  出すだけで、商品ページに重複させない。トップページの一覧は rich result の対象ではない（機械可読な一覧として出す）。
- 配送ポリシーは Google の `ShippingService` が `shippingConditions`（送料・日数）を必須とするため、
  事実を持たない Phase 1 では**構造化データにしない**（llms.txt にページを載せるだけ）。

実装: `worker/site-type-output.mjs`、`worker/api.mjs`（buildJsonLd / static snippet / tag config / llms）、
プラグイン `includes/site-types.php`。

## 4. 診断（score）

重み（schema 30 / coverage 25 / legibility 20 / llms 15 / consistency 10）、帯（green 80 / yellow 50）、
gate（AI検索クローラー許可・エッジ・サーバー描画、未達は最大15点）は**変更しない**。種別で変わるのは「何が揃えば完全か」だけ。

- schema / coverage のフィールド（`worker/site-types.mjs` `TYPED_SCHEMA_FIELDS`）
  - ec: Organization（name, url, contactPoint=メール/電話/ContactPoint のいずれか, hasMerchantReturnPolicy）、
    Product（name, image, offers.price, offers.priceCurrency, offers.availability。**入れ子の商品も読む**）、WebSite、FAQPage
  - b2b: Organization（name, url, description, contactPoint, logo）、Service（name, description, provider）または
    SoftwareApplication（name, description, applicationCategory）、WebSite、FAQPage
  - brand / gtin / aggregateRating は出力はするが**採点しない**（レビューがまだ無い店を減点しない）
- サイト要件（coverage に `coverageMix` で混ぜる。理由 `via` を必ず返す）
  - ec: 価格と在庫のある商品 / 返品ページ / 配送ページ / 連絡先
  - b2b: 提供内容の説明 / 料金ページ / 導入事例または FAQ / 企業の識別情報
  - 判定材料は対象ページの HTML（リンク文言・href）と JSON-LD、同期済みカタログ、設定で指定したページのみ。他ページは取得しない。
- legibility の本文中の事実、llms.txt の4つ目の品質テストを種別ごとの語彙に差し替え。
- local は従来のコードパスをそのまま通る。`scripts/fixtures/aeo-local.golden.json` は main で採取した
  16 ケースの結果で、siteType なし / `local` の両方で完全一致することをテストしている。
- ec/b2b ではローカル向けの「住所・電話・営業時間を出していない」系の改善提案（recommendations の scoredProps パス）を出さない。

## 5. AI登場率の質問（Pro measurement）

`worker/sov-site-type.mjs`。測定対応の 10 言語（ja, en, zh-Hans, zh-Hant, ko, es, fr, de, pt, it）すべてに
10 問 + ブランド名入りの対照 3 問。

- ec: 「{カテゴリ}のおすすめ通販サイトは？」「{カテゴリ}でおすすめのブランドを教えて。」… カテゴリは同期済み商品で
  最も多いカテゴリ（「未分類」等は除外）、無ければ owner の業種ラベル、無ければ中立語（「人気の商品」）。
- b2b: 「{業務}におすすめの{ツール/サービス}は？」「{カテゴリ}を比較して。」… カテゴリは owner の業種ラベル、
  業務はサービスのカテゴリ、ソフトウェアがあれば「ツール」。
- 非ブランド質問に社名を入れない。社名・ドメインを含むカテゴリ語は捨てる。
- 種別が変わると別の推移系列（`profileIdentity` に siteType/category を追加。local は不変）。未編集の既定質問セットは新種別のものに置き換え、owner が編集したセットは残す。

## 6. サイト外チェック（manual checklist のみ・新規 API なし）

| 種別 | 確認先 | 確認する項目 |
|---|---|---|
| local | 従来どおり（Google マップ自動チェック + Bing/Apple/Yahoo!/食べログ/HPB/Instagram/Facebook） | 名称・住所・電話・営業時間 |
| ec | 楽天市場（RMS）、Amazon（セラーセントラル）、Yahoo!ショッピング（ストアクリエイターPro）、Google Merchant Center | ショップ名・価格・在庫・返品/配送条件 |
| b2b | ITreview、BOXIL、G2、Capterra、LinkedIn 会社ページ、Crunchbase、Wantedly | 名称・URL・説明・カテゴリ |

Google マップ（Places API）の自動チェックは local のみ。ec/b2b では呼ばず、利用枠も消費しない。
ディレクトリの検索 URL が公開仕様でないものは `site:` 検索リンクにしている。

## 7. 文言（strings）

- プラグイン msgid: `scripts/generate-plugin-translations.mjs` に日本語を追加済み。41 言語への翻訳は別途。
- ダッシュボード: 既存インライン辞書 I5 の各言語末尾 `/* site types (docs/industries.md) */` 以降（8言語）。
- 診断の新しい文言（要件ラベル・新フィールド名）: `worker/site-type-i18n.mjs`（ダッシュボードの 8 言語、他は英語にフォールバック）。
  42 言語の診断カタログ（`worker/i18n/diagnosis/*.json`）へ移すのは Phase 2。

## 8. Phase 2 で扱うもの

- LP の業種別ページ（EC / BtoB）、営業資料、料金表の業種別説明、導入事例。
- 公開 URL 診断（ログイン不要の checker）での種別指定・自動推定（現在は local として採点）。
- 配送ポリシーの構造化（`ShippingService` / `OfferShippingDetails`）: 送料・日数を入力できる UI を作ってから。
- Shopify / BASE / STORES など WooCommerce 以外のカタログ取り込み、Merchant Center フィード連携（owner 認可つき）。
- B2B の料金プラン（`Offer` 複数）、導入事例（`Review`/`CaseStudy` 的な記述）の入力 UI。
- ダッシュボードで種別に応じて店舗用入力欄（営業時間・緯度経度・予約URL）を折りたたむ。
- 診断の新文言・プラグイン新 msgid の 41〜59 言語翻訳、ダッシュボード辞書の JSON 化（feat/dashboard-59-locales）への移設。
- 種別ごとの改善提案（recommendations）の文言と優先度。
