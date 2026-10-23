# SaaS / Software（SoftwareApplication）診断修正

- SoftwareApplicationを業種別の評価対象として追加。name / applicationCategory / operatingSystem / offers.price / offers.priceCurrency / descriptionを評価する。
- SoftwareApplicationの公開JSON-LDまたは明示された業種を優先し、Productを要求しない。Offer単体やWooCommerceへの本文中の言及を物販の根拠にしない。物販のProduct / OnlineStore、商品catalog、WooCommerceのclass/idによる判定は維持。
- 明示的なentityFieldsがある場合は、その有効な項目だけを評価・表示。診断モデルをu1-v4に変更し旧キャッシュを分離。
- 項目ごとに埋め方を案内。descriptionは説明文、brandはブランド設定、skuは在庫設定、価格・通貨・在庫は対応する値を案内。レビュー案内はaggregateRatingのみ。SoftwareApplicationはLPのJSON-LDテンプレートまたは対応プラグインを案内し、Nurevoに専用入力欄がないことを明記。

## 検証

- npm run test:aeo-score：成功。
- node scripts/test-aeo-check-lang.mjs：成功。
- node scripts/test-aeo-metrics-checks.mjs：成功。
- wrangler deploy --dry-run：成功。
- nurevo.jpの公開HTMLによるローカル診断：SoftwareApplication全6項目present=true、Product項目0。
- 本番Worker反映：ab5b6f07-2d2b-40ad-9706-918427d139ca。
- 本番 /api/aeo/score?url=https%3A%2F%2Fnurevo.jp&lang=ja およびlang=en：成功。両言語でSoftwareApplication全6項目present=true、Product項目0をassertで確認。
- https://nurevo.jp/en/ と https://nurevo.jp/check/：HTTP 200。英語ページのhtml lang=enも確認。
- 本番シークレット・課金処理・DBルールの変更なし。
