// Content page: for web agencies / WordPress care companies that maintain
// online shops - how to add a monthly "product data consistency check" to an
// ecommerce maintenance contract: compare price, sale price, currency and stock
// for the same product on the visible page, the page's JSON-LD (Product/Offer),
// the Merchant Center feed and llms.txt / AI answers; the causes of mismatches,
// a script, a report template, contract scope, and WooCommerce + Nurevo steps.
//
// Written 2026-11-23 14時 (JST).
//
// Nurevo AEO facts (plugin readme 0.9.2 and source, includes/site-types.php,
// nurevo-webmcp.php):
// - Online shop site type: OnlineStore, the WooCommerce catalogue as an
//   OfferCatalog on the front page (up to 30 products, each Product with an
//   Offer only when there is a price; availability InStock/OutOfStock; rating
//   only with real reviews), and a MerchantReturnPolicy with merchantReturnLink
//   when a return policy page is set.
// - Product/Offer markup on product pages is left to WooCommerce (no duplicate).
// - llms.txt lists WooCommerce products (newest 50 published, visible) with the
//   product's current price as stored in WooCommerce (get_price: sale price when
//   on sale), currency and stock. llms.txt is cached in a transient for at most
//   a day and rebuilt when a post is saved/deleted or settings change.
// - Pro measurement runs on Perplexity (ChatGPT once configured). Free check:
//   monthly, three Perplexity questions for connected Free/Standard sites.
// - The plugin does not make Merchant Center or ChatGPT feeds.
//
// Outside facts and where they were read (2026-11-23):
// - Merchant Center help 12159029 (Mismatched product price): Googlebot compares
//   the feed price with the landing page and structured data; mismatch may lead
//   to disapproval and may lead to account suspension; JS-inserted prices
//   trigger errors; HTML prices must match exactly; sale dates/timezone;
//   currency; minimum order quantity; disapprovals persist until structured data
//   is fixed when page matches feed but markup does not; re-crawl hours/days.
// - 9773429: account warning / pre-emptive item disapproval for price or
//   availability mismatches found by policy reviewers; causes list (sales out of
//   sync, structured data, IP/dynamic prices, variants preselection, price
//   ranges, membership prices, slow loading prices); review takes 7 working
//   days, failed review = 7 working days cooldown; recommends automatic item
//   updates and automated feeds.
// - 14916353: automatic item updates (Products > Automations); mismatches still
//   critical errors that can lead to suspension.
// - 7331077: structured data must be in server HTML (not added by JS), must
//   match values shown to user; price with a period decimal separator; sale
//   price in markup if that is what the user pays; automatic item updates need
//   price, priceCurrency, availability, condition.
// - Search Central merchant listing: price & priceCurrency required;
//   availability, shippingDetails, hasMerchantReturnPolicy, priceValidUntil
//   recommended; Google may verify merchant listing data.
// - Business Insider Japan 2026-09-28 (Product.ai study): 220 prompts x 5 runs,
//   ChatGPT/Claude/Gemini/Perplexity, 8,794 answers; 913 verifiable price
//   answers, 85% matched the current price. Google said the developer API was
//   tested, not the consumer app.
// - TechWyse 2026-09-07 citing Productrise: 2M+ listings Aug 9-31; prices
//   differed in 38.1% of matched cases between AI Mode and traditional search;
//   correlation only.
// - DesignRush 2026-10-05 citing SEJ / Profound: feed-connected sources 61.54%
//   of tracked ChatGPT Shopping recommendations around 10 July (tracked prompts,
//   not all ChatGPT).
// - SEJ 2026-06-10 (Emina Demiri-Watson): client example with four different
//   prices across site, feed, Google's chosen price and schema; proposes a
//   monthly audit and shared ownership of the feed.
// Top articles read 2026-11-23: Salesforce JP checklist (2026-11-17 update),
// Shopify JP ecommerce schema (2026-07-23), Netshop Forum 15079 (2025-11-07),
// ECのミカタ 48397 (gated), CommercePick 98063 (2026-07-21), Business Insider JP
// (2026-09-28), Shopify Help optimizing products, stellagent (URL served a
// different article) / SEJ feed ownership (2026-06-10), BelVG data consistency
// (2026-06-12), Yotpo AI audit (2026-10-20 update), Sitebulb (2026-03-31),
// TechWyse (2026-09-07), DesignRush (2026-10-05), Redefine Web maintenance
// tiers (2026-09-22 update), dev.to EShopSet.
// Not stated on purpose: exact WooCommerce core JSON-LD fields (not re-read
// this run), Japanese tax display rules in Merchant Center, BelVG's 68% (no
// sample given), Yotpo's market statistics, any price for the agency service.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  gmcMismatch: "https://support.google.com/merchants/answer/12159029",
  gmcAccount: "https://support.google.com/merchants/answer/9773429",
  gmcAuto: "https://support.google.com/merchants/answer/14916353",
  gmcSd: "https://support.google.com/merchants/answer/7331077",
  merchantListing: "https://developers.google.com/search/docs/appearance/structured-data/merchant-listing",
  biJp: "https://www.businessinsider.jp/article/2609-study-shows-ai-errors-shopping-tools-struggle-accuracy/",
  techwyse: "https://www.techwyse.com/news/reports-data/google-ai-mode-product-prices-seller-mismatch",
  designrush: "https://news.designrush.com/chatgpt-shopping-makes-bad-product-data-harder-hide",
  sejFeed: "https://www.searchenginejournal.com/why-your-product-feed-is-an-seo-asset-and-who-should-own-it/575543/",
  redefine: "https://redefineweb.com/blog/best-ecommerce-maintenance-package-tiers-pricing/",
};

const SCRIPT_BODY = `import csv, json, re, sys, urllib.request

def offers(node):
    if isinstance(node, list):
        for n in node:
            yield from offers(n)
    elif isinstance(node, dict):
        if "@graph" in node:
            yield from offers(node["@graph"])
        types = node.get("@type", [])
        types = types if isinstance(types, list) else [types]
        if "Product" in types or "ProductGroup" in types:
            yield from offers(node.get("offers", []))
            yield from offers(node.get("hasVariant", []))
        if "Offer" in types or "AggregateOffer" in types:
            yield node

def num(text):
    m = re.search(r"\\d[\\d,]*(?:\\.\\d+)?", str(text or ""))
    return float(m.group(0).replace(",", "")) if m else None

def page_offers(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (offer-check)"})
    html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")
    found = []
    for block in re.findall(r'<script[^>]+application/ld\\+json[^>]*>(.*?)</script>', html, re.S | re.I):
        try:
            found += list(offers(json.loads(block)))
        except ValueError:
            pass
    return found

print("id\\tfeed_price\\tjsonld_price\\tfeed_availability\\tjsonld_availability\\tresult")
for row in csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")):
    try:
        found = page_offers(row["link"])
    except Exception as e:
        print(f"{row['id']}\\t{row['price']}\\t\\t{row['availability']}\\t\\tFETCH_ERROR {e}")
        continue
    prices = sorted({num(o.get("price", o.get("lowPrice"))) for o in found} - {None})
    avail = sorted({str(o.get("availability", "")).rsplit("/", 1)[-1] for o in found})
    feed_avail = row["availability"].replace("_", "").lower()
    ok_price = num(row["price"]) in prices
    ok_avail = any(a.lower() == feed_avail for a in avail)
    result = "OK" if ok_price and ok_avail else ("NO_JSONLD" if not found else "MISMATCH")
    print(f"{row['id']}\\t{row['price']}\\t{','.join(f'{p:g}' for p in prices)}\\t{row['availability']}\\t{','.join(avail)}\\t{result}")`;

const SCRIPT = `# 使い方：python3 check_offers.py feed.csv > result.tsv
# feed.csv は id, link, price, availability の列を持つCSV
# （Merchant Center の商品一覧の書き出しや、フィードのファイルから列を選んだもの）
# 結果：OK＝フィードの価格・在庫がページのJSON-LDにある／MISMATCH＝ずれている
#       NO_JSONLD＝ページにProduct・Offerがない／FETCH_ERROR＝ページを取れない
${SCRIPT_BODY}`;

const SCRIPT_EN = `# Usage: python3 check_offers.py feed.csv > result.tsv
# feed.csv needs the columns id, link, price, availability
# (an export of the Merchant Center product list, or those columns of your feed)
# Result: OK = the feed's price and stock are in the page's JSON-LD / MISMATCH
#         NO_JSONLD = no Product/Offer on the page / FETCH_ERROR = page not fetched
${SCRIPT_BODY}`;

const REPORT = `【商品データの整合チェック】◯◯ショップ様（2026年◯月◯日）

1. 点検した商品：◯件（売れ筋◯・セール中◯・今月変更した商品◯・バリエーションのある商品◯）
2. 結果
   ・ページの表示とJSON-LDとフィードが一致：◯件
   ・ずれていた：◯件（価格◯・在庫◯・送料◯・商品名や画像◯）
   ・JSON-LDがない／ページを取れない：◯件
3. Merchant Center
   ・価格・在庫の不一致による警告・不承認：なし／あり（◯件、期限◯月◯日）
   ・自動での商品の更新：オン／オフ
4. llms.txt・AIの回答
   ・llms.txt の価格・在庫がサイトと一致：◯件中◯件
   ・AIに聞いた質問：◯問（価格◯・在庫◯・送料◯）。古い・違う回答：◯件（質問と回答を添付）
5. 直したこと／お客様に決めていただきたいこと
   ・◯◯（例：セールの終了日時の設定、フィードの更新の回数）`;

const REPORT_EN = `Product data consistency check - <shop> (<date>)

1. Products checked: <n> (best sellers <n>, on sale <n>, changed this month <n>, with variants <n>)
2. Results
   - Visible page, JSON-LD and feed agree: <n>
   - Mismatched: <n> (price <n>, stock <n>, shipping <n>, title or image <n>)
   - No JSON-LD / page could not be fetched: <n>
3. Merchant Center
   - Warnings or disapprovals for price or availability mismatch: none / <n> (deadline <date>)
   - Automatic item updates: on / off
4. llms.txt and AI answers
   - llms.txt price and stock match the site: <n> of <n>
   - Questions asked to AI: <n> (price <n>, stock <n>, shipping <n>). Outdated or wrong answers: <n> (questions and answers attached)
5. What we fixed / what we need you to decide
   - <e.g. end time of the sale, how often the feed updates>`;

export default {
  slug: "agency-ec-product-data-check",
  targetQueries: [
    "ECサイト 保守 商品データ チェック",
    "Merchant Center 価格の不一致 構造化データ",
    "ネットショップ AI検索 価格 在庫 ずれ 制作会社",
    "ecommerce maintenance product data consistency check",
    "Merchant Center mismatched price structured data agency",
    "product schema price feed mismatch AI search audit",
  ],
  related: ["chatgpt-shopping-product-feed", "online-shop-ai-search", "agency-aeo-monthly-service", "agency-content-refresh-service", "ai-visibility-drop-causes"],
  locales: {
    ja: {
      title: "ECサイトの保守に「商品データの整合チェック」を足す方法 | Nurevo",
      description: "ネットショップの保守契約に、商品ページの表示・構造化データ・Merchant Centerのフィード・llms.txtの価格と在庫を毎月突き合わせる作業を足す手順。ずれの原因、確認のスクリプト、報告の文例、契約の書き方。",
      h1: "ECサイトの保守に「商品データの整合チェック」を足す方法：制作会社のための手順と報告の型",
      lead: "ネットショップの保守契約には、同じ商品について「ページに見えている価格と在庫」「ページの構造化データ（Product・Offer）」「Merchant Centerなどのフィード」「llms.txt とAIの回答」の4か所の値が一致しているかを、毎月、決まった商品で突き合わせる作業を足すのがおすすめです。Googleは、フィードの価格がページや構造化データと一致しないと商品が不承認になることがあり、アカウントの停止につながる場合もあると説明しています。AIの回答も、価格を古いまま答えることがあります。この記事では、ずれが起きる原因、点検の手順とスクリプト、報告の文例、契約への書き方をまとめます。",
      intro: [
        "作成日：2026年11月23日（JST）。対象は、ネットショップを作る・保守する制作会社、WordPress（WooCommerce）の保守会社、ECの運用を預かっているフリーランスの方です。Merchant Centerの説明は、この記事の作成時点のGoogleのヘルプに合わせています。画面や条件は変わることがあるので、作業の前に各リンク先を確かめてください。",
        "AIの回答は日や聞き方によって変わります。商品データをそろえることは、AIや検索に正しく読まれるための前提で、AIの回答に出ることや順位を保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれている記事と、足りないこと",
          paragraphs: [
            "「ECサイト 保守 商品データ」「Merchant Center 価格の不一致」「product data consistency」などで上位に出る日本語8本・英語8本を、2026年11月23日に読みました。日本語では、Salesforceのチェックリスト（11月17日更新）、ShopifyのECの構造化データの解説（7月23日）、ネットショップ担当者フォーラム（2025年11月7日）、コマースピック（7月21日）、Business Insider Japan（9月28日）、Shopifyのヘルプなど。英語では、Search Engine Journal（6月10日）、BelVG（6月12日）、Yotpo（10月20日更新）、Sitebulb（3月31日）、TechWyse（9月7日）、DesignRush（10月5日）、Redefine Webの保守プランの記事（9月22日更新）、dev.toのMerchant Centerの記事です。",
            "「ページ・構造化データ・フィードの値をそろえる」ことが大事だという点は、ほとんどの記事で一致していました。一方で、制作会社が保守の作業として毎月回すときに必要な次の点は、ほとんど書かれていませんでした。",
          ],
          table: {
            head: ["足りない点", "この記事で書いていること"],
            rows: [
              ["「価格をそろえる」とだけ書かれ、どの値をどこで比べるかが書かれていない", "4か所×9項目の突き合わせの表"],
              ["ずれる原因（セールの時刻、キャッシュ、JavaScriptでの表示、バリエーションなど）と直し方がまとまっていない", "Googleのヘルプに沿った原因と直し方の表"],
              ["点検の方法が、1ページずつの手作業かツールの紹介だけ", "フィードの書き出しとページのJSON-LDを比べるスクリプトと、抜き出す商品の選び方"],
              ["WordPress（WooCommerce）での手順がない", "WooCommerceとNurevo AEOを使う場合に、どこを見るか"],
              ["保守契約・報告での扱いがない", "毎月の流れ、報告の文例、契約に書く範囲の表"],
            ],
            caption: "上位の記事には「◯%の店でずれている」といった数字もありましたが、調べた件数や方法が書かれていないものは使っていません。",
          },
        },
        {
          heading: "なぜ保守の項目にするのか：Googleの扱いとAIの回答",
          paragraphs: [
            "商品データのずれは、一度直しても、セールや値上げ、在庫の変化のたびに起きます。月に一度、決まった手順で確かめる保守の項目にしておくと、お客様から言われる前に見つけられます。Googleのヘルプには、次のように書かれています。",
          ],
          table: {
            head: ["Googleの説明", "出典"],
            rows: [
              ["Googlebotは商品ページを定期的に読み、フィードの価格を、ページに表示された価格や構造化データ（ある場合）と比べる。一致しないと商品が不承認になることがあり、アカウントの停止につながる場合もある", `[Merchant Center ヘルプ：価格の不一致](${SRC.gmcMismatch})`],
              ["ページのHTMLの価格は、Merchant Centerの価格と正確に一致している必要がある。読み込みのあとにJavaScriptで入れた価格はエラーになる。ページとフィードが一致していても、構造化データが違えば、構造化データを直すまで不承認が続く", `[Merchant Center ヘルプ：価格の不一致](${SRC.gmcMismatch})`],
              ["審査の担当者が価格や在庫のずれを見つけると、アカウントへの警告や、商品の事前の不承認になることがある。審査は7営業日かかり、審査に通らないと7営業日の待機期間がある", `[Merchant Center ヘルプ：フィードとページの不一致](${SRC.gmcAccount})`],
              ["「自動での商品の更新」をオンにすると、Googleがページの値で価格を直すことがある。ただし、ずれは引き続き重大なエラーとして扱われ、アカウントの停止につながりうる", `[Merchant Center ヘルプ：自動更新と価格の不一致](${SRC.gmcAuto})`],
              ["構造化データは、サーバーが返すHTMLに入っていて、利用者に見えている値と一致している必要がある。自動での商品の更新には price・priceCurrency・availability・condition が必要", `[Merchant Center ヘルプ：構造化データの設定](${SRC.gmcSd})`],
            ],
          },
          after: [
            `AIの回答の側でも、価格の誤りは起きています。Business Insider Japan が紹介した Product.ai の調査（2026年9月）では、ChatGPT・Claude・Gemini・Perplexity に220の買い物の質問を5回ずつ聞き、価格を確かめられた913件の回答のうち、今の価格と一致したのは85%でした（[Business Insider Japan](${SRC.biJp})。Googleは、調べたのは開発者向けのAPIで、一般向けのアプリではないと説明しています）。ショップ側でできるのは、AIが読む元のデータを、どこで読まれても同じ値にしておくことです。`,
            `また、GoogleのAIモードと通常の検索で、同じ商品の価格が一致しなかった例が38.1%あったという、Productriseのデータを紹介する記事もあります（[TechWyse](${SRC.techwyse})。8月の約3週間・200万件以上の掲載を追った集計で、原因は示されていないと記事に書かれています）。ChatGPTのショッピングでは、Profoundが追っている質問で、フィードとつながった情報源からの商品の推薦が7月に61.54%になったと報じられています（[DesignRush](${SRC.designrush})。ChatGPT全体の数字ではありません）。フィードとページがずれていると、どちらの値がAIに使われるかを、ショップ側では選べません。`,
          ],
        },
        {
          heading: "突き合わせる4か所と9項目",
          paragraphs: [
            "点検では、同じ商品（同じSKU、バリエーションがある場合は同じ色・サイズ）について、次の表の4か所の値を横に並べます。すべての商品で9項目を見る必要はありません。毎月は「価格・セール・在庫」を、四半期に一度は残りの項目を見る、という分け方でも十分に役立ちます。",
          ],
          table: {
            head: ["項目", "ページの表示", "構造化データ（JSON-LD）", "フィード（Merchant Centerなど）", "llms.txt・AIの回答"],
            rows: [
              ["価格", "カートに入れる前に見える価格", "Offer の price", "price", "載せている場合の価格"],
              ["セール価格と期間", "セールの価格と、いつまでか", "セール中は price がセール価格", "sale_price と sale_price_effective_date", "セールの価格のまま残っていないか"],
              ["通貨", "円の表示", "priceCurrency（JPY）", "price の通貨", "通貨の書き方"],
              ["在庫", "在庫あり・なし・予約", "availability", "availability", "「在庫切れ」の商品をすすめていないか"],
              ["送料", "送料と無料の条件", "shippingDetails（入れている場合）", "shipping、またはMerchant Centerの送料の設定", "送料を聞いたときの答え"],
              ["返品", "返品の条件のページ", "hasMerchantReturnPolicy（入れている場合）", "Merchant Centerの返品の設定", "返品を聞いたときの答え"],
              ["商品名", "商品名", "Product の name", "title", "商品名の言い方"],
              ["識別子", "型番・JANなど（表示している場合）", "sku・gtin", "id・gtin・mpn", "—"],
              ["画像", "主な画像", "image", "image_link", "—"],
            ],
          },
          after: [
            `Search Centralの説明では、Offer の price と priceCurrency が必須で、availability・shippingDetails・hasMerchantReturnPolicy・priceValidUntil は推奨です（[Google：販売者のリスティングの構造化データ](${SRC.merchantListing})）。`,
          ],
        },
        {
          heading: "ずれが起きるよくある原因と直し方",
          paragraphs: [
            "Googleのヘルプに挙がっている原因のうち、制作会社が保守で見つけやすいものを、直し方と一緒に並べました。",
          ],
          table: {
            head: ["原因", "起きること", "直し方"],
            rows: [
              ["セールの開始・終了の時刻やタイムゾーンの設定違い", "フィードかページのどちらかが、セール前・セール後の価格のまま", "フィードの sale_price_effective_date とショップのセールの設定を同じ日時・タイムゾーンにする"],
              ["フィードの更新が1日1回などで、ページより遅い", "値上げ・値下げや在庫切れのあと、しばらくずれる", "ページの更新のすぐあとにフィードを更新する設定にする。自動での商品の更新も検討する"],
              ["ページのキャッシュ（プラグイン・サーバー・CDN）が古い", "管理画面では新しい価格なのに、公開されたHTMLは古い価格", "価格を変えたときに商品ページのキャッシュが消える設定か確かめる"],
              ["価格をJavaScriptで後から表示している", "Googlebotが読むHTMLに価格がない、または違う", "サーバーが返すHTMLに価格と構造化データを入れる"],
              ["バリエーションの初期表示", "ページで最初に選ばれている色・サイズの価格と、フィードの商品の価格が違う", "フィードの各バリエーションのURLで、その色・サイズが選ばれた状態になるようにする"],
              ["会員価格・まとめ買い・最小注文数", "誰でも払える価格とフィードの価格が違う", "フィードとページの目立つ価格を、誰でも払える価格にそろえる。最小注文数がある場合は、その数の合計価格を出す"],
              ["構造化データが2つ出ている（テーマ・プラグインの重複）", "Product・Offer が2組あり、片方が古い価格", "どのプラグインが出しているかを確かめ、1つにする"],
              ["税込・税抜の入力と表示の設定", "表示は税込なのに、構造化データやフィードが別の数字", "ショップの価格の入力と表示の設定を確かめ、4か所で同じ数字が出るようにする"],
            ],
          },
          after: [
            `原因の一覧は、[価格の不一致](${SRC.gmcMismatch})と[フィードとページの不一致](${SRC.gmcAccount})のヘルプをもとに、制作会社の作業の言葉に直したものです。`,
          ],
        },
        {
          heading: "毎月の点検の手順",
          list: [
            "点検する商品を決める（例：30件）。売れ筋の上位、いまセール中の商品、今月価格や在庫を変えた商品、バリエーションのある商品、新しく追加した商品を、少しずつ入れる。毎月すべてを見るより、ずれやすい商品を確実に見るほうが役立ちます。",
            "Merchant Centerの「診断」で、価格・在庫の不一致の警告や不承認がないかを先に見る。期限のある警告があれば、ほかの作業より先に対応する。",
            "フィードから、点検する商品の id・link・price・availability を書き出す。",
            "下のスクリプトで、フィードの価格・在庫が、ページのJSON-LDに入っているかを比べる。",
            "スクリプトで OK になった商品も、5件ほどはブラウザで開き、カートに入れる前の価格・在庫・送料の表示が同じかを目で見る（スクリプトは見えている文字までは比べません）。",
            "llms.txt を出している場合は、点検した商品の価格・在庫が載っていれば一致を確かめる。",
            "AIに、点検した商品の価格・在庫・送料を数問聞き、日付と一緒に質問と回答を残す。",
            "ずれていた商品は、原因の表に当てはめて直し、翌月に同じ商品をもう一度見る。",
          ],
          after: [
            "フィードとページのJSON-LDを比べるスクリプトの例です（Python 3、標準ライブラリだけ）。お客様の承諾を得て、サーバーに負担をかけない数（数十件）で使ってください。",
          ],
          code: SCRIPT,
        },
        {
          heading: "AIの回答の確かめ方",
          paragraphs: [
            "AIの回答は、ショップのデータを直してもすぐには変わりません。毎月同じ質問を聞き、変化を記録するのが現実的です。",
          ],
          list: [
            "質問は、お客様が実際に聞きそうな形にする。例：「◯◯ショップの△△（商品名）はいくら？」「△△は在庫がある？」「◯◯ショップの送料は？」「◯◯ショップで返品できる？」。",
            "ChatGPT・Perplexity・GoogleのAIモードなど、聞いたAI・日付・回答・出典のURLを表に残す。回答に出典があれば、どのページ（自社の商品ページ、モール、比較サイト）から答えているかも残す。",
            "古い価格や在庫を答えていて、出典が自社のページなら、そのページのキャッシュと構造化データを確かめる。出典がモールや比較サイトなら、そちらの掲載をお客様に直してもらう。",
            "同じ質問でも回答は変わるので、1回の誤りで判断せず、数か月の傾向で見る。",
          ],
        },
        {
          heading: "お客様への報告の文例",
          paragraphs: [
            "毎月の報告は、件数と、お客様に決めていただきたいことが分かる形にしておくと、作業の価値が伝わりやすくなります。",
          ],
          code: REPORT,
        },
        {
          heading: "保守契約への書き方",
          paragraphs: [
            "商品データの整合チェックは、作業の範囲をはっきり書いておかないと、「商品の登録や価格の変更も保守に入っている」と受け取られることがあります。誰が何をするかを、次のように分けておくと安心です。",
          ],
          table: {
            head: ["区分", "例"],
            rows: [
              ["保守に含む（制作会社）", "毎月◯件の点検、Merchant Centerの警告の確認、スクリプトと目視での突き合わせ、AIへの質問◯問、報告書、原因が設定やキャッシュにある場合の修正"],
              ["お客様の作業", "商品の登録、価格・セールの決定と入力、在庫の更新、モール・比較サイトの掲載の更新"],
              ["別見積もり", "フィードの仕組みの作り直し、テーマ・プラグインの入れ替え、全商品の一括の修正、ChatGPTなど新しいフィードへの申し込み"],
              ["決めておくこと", "点検する件数と選び方、警告が出たときの連絡の早さ、報告の日、AIに聞く質問の一覧"],
            ],
          },
          after: [
            `米国の制作会社の保守プランの例では、フィードの監視を上位のプランに含め、下のプランでは追加の作業にしているものもあります（[Redefine Web](${SRC.redefine})）。日本の価格の相場は、確かめられる資料がなかったため書いていません。`,
            `Search Engine Journal の記事では、ある店の1つの商品が、サイト・フィード・Googleが選んだ価格・構造化データで4つの違う価格になっていた例を挙げ、SEOの担当とフィードの担当が一緒に毎月確かめることをすすめています（[Search Engine Journal](${SRC.sejFeed})）。保守の報告に、フィードの担当者（広告代理店やお客様の社内の担当）も入れておくと、直す人がすぐ決まります。`,
            "月額の保守としてのAI検索対策全体の組み立て方は、[AI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)にまとめています。",
          ],
        },
        {
          heading: "WordPress（WooCommerce）での手順（Nurevo AEOを使う場合）",
          paragraphs: [
            `無料のプラグイン[Nurevo AEO](${WP_ORG})を使うショップでは、点検する場所が次のようになります。Nurevo AEOはMerchant CenterやChatGPTのフィードは作らないので、フィードは今お使いの仕組みで確かめてください。`,
          ],
          list: [
            "サイトの種類で「ネットショップ」を選ぶと（WooCommerceが有効なら提案されます）、店の情報を OnlineStore として出します。商品ページの Product・Offer は、WooCommerceの出力をそのまま使い、重ねて出しません。商品ページのJSON-LDを見るときは、WooCommerce以外のテーマやプラグインが2つ目を出していないかを確かめます。",
            "トップページには、商品の一覧（新しい順に最大30件）を OfferCatalog として載せます。価格がある商品だけに Offer を付け、在庫が分かれば在庫あり・なしを入れます。トップページも点検の対象に入れてください。",
            "llms.txt には、公開中で表示されている商品のうち新しい50件を、WooCommerceにある今の価格（セール中はセール価格）・通貨・在庫と一緒に載せます。WooCommerceに入力した価格の数字をそのまま使うので、税抜で入力して表示のときに税を足す設定では、税抜の数字になります。",
            "llms.txt は、投稿や商品を保存したとき、設定を変えたときに作り直され、それ以外は最大1日、前の内容を使います。予約したセールが始まった・終わった直後は、llms.txt の価格も確かめてください。",
            "返品のページを設定すると、そのURLを返品ポリシー（MerchantReturnPolicy）として載せます。返品の条件そのものは、ページの文章で書きます。",
            "AIでの登場の確認は、つないだ Free・Standard のサイトで月に1回、Perplexityに3つの質問をして結果を表示します。Pro（月14,800円〜）では、計測を Perplexity で行います（ChatGPTは設定され次第）。",
          ],
        },
        {
          heading: "制作会社がNurevoを使う場合",
          paragraphs: [
            `お客様のショップごとに無料のプラグインを入れ、構造化データ・llms.txt・AIのクローラーの許可を整えたうえで、この記事の点検を保守の項目にすると、「何を直したか」と「AIにどう読まれているか」を同じ報告にまとめられます。Standardは月3,000円です。パートナー制度は[パートナーのページ](${PARTNER})をご覧ください。`,
          ],
        },
        {
          heading: "毎月の点検のチェックリスト",
          list: [
            "Merchant Centerに、価格・在庫の不一致の警告や不承認がない（あれば期限を確かめた）",
            "点検する商品に、売れ筋・セール中・今月変更・バリエーションのある商品が入っている",
            "フィードの価格・在庫が、ページのJSON-LDの Offer と一致している",
            "ブラウザで見える価格・在庫・送料が、JSON-LDと一致している（数件の目視）",
            "セールの開始・終了の日時が、ショップとフィードで同じ",
            "価格や在庫を変えたあと、商品ページのキャッシュが消えている",
            "Product・Offer の構造化データが1ページに1組だけ出ている",
            "価格がサーバーのHTMLに入っている（JavaScriptで後から入れていない）",
            "llms.txt の価格・在庫が、サイトと一致している",
            "AIへの質問と回答を日付つきで残し、前の月と比べた",
          ],
        },
      ],
      faqs: [
        { q: "Merchant Centerを使っていないショップにも、この点検は必要ですか？", a: "フィードがなくても、ページの表示と構造化データ、llms.txt、AIの回答の突き合わせは役立ちます。AIや検索がページの構造化データを読むので、表示と構造化データのずれを毎月確かめる価値があります。" },
        { q: "「自動での商品の更新」をオンにすれば、点検はいりませんか？", a: "Googleのヘルプでは、自動での更新で価格が直された場合も、ずれは引き続き重大なエラーとして扱われ、アカウントの停止につながりうると説明されています。自動の更新は保険と考え、元のずれを直す点検は続けてください。" },
        { q: "全商品を毎月見る必要がありますか？", a: "多くのショップでは、売れ筋・セール中・今月変更した商品・バリエーションのある商品を中心に数十件を見れば、ずれの多くを見つけられます。ずれが続く原因が見つかったら、その原因に当てはまる商品をまとめて確かめます。" },
        { q: "スクリプトでMISMATCHになりました。まず何を見ればいいですか？", a: "ブラウザでその商品ページを開き、見えている価格がフィードとJSON-LDのどちらと同じかを確かめます。見えている価格とJSON-LDが違えば構造化データやキャッシュ、見えている価格とフィードが違えばフィードの更新やセールの設定を疑います。" },
        { q: "AIが古い価格を答えています。どうすればいいですか？", a: "回答の出典を確かめます。自社のページが出典なら、そのページの表示・構造化データ・キャッシュを直します。モールや比較サイトが出典なら、その掲載の更新が必要です。直してもすぐに回答が変わるとは限らないので、数か月の記録で見てください。" },
        { q: "価格の入力やセールの設定もお客様から頼まれます。保守に含めるべきですか？", a: "契約で分けておくのがおすすめです。点検と、設定やキャッシュが原因のずれの修正は保守に、商品の登録や価格の決定はお客様の作業、または別料金の運用代行にすると、作業量が読みやすくなります。" },
        { q: "商品データをそろえれば、ChatGPTやGoogleのAIに商品が出ますか？", a: "保証はできません。AIの回答は日や聞き方で変わり、ほかの店の商品や口コミも使われます。そろえておくことは、出たときに正しい価格や在庫で紹介されるための前提です。" },
      ],
      relatedHeading: "関連するガイド",
      cta: {
        heading: "お客様のショップを、AIがどう読んでいるか確認",
        body: "無料のチェックは登録不要です。URLを入れると、構造化データ・llms.txt・AIのクローラーの許可の状態が分かります。毎月の点検の前に使ってください。",
        label: "AIへの読まれ方を無料でチェック",
        href: "/check",
        secondary: { label: "パートナー制度を見る", href: PARTNER },
      },
      footnote: "Google・Merchant Center・Gemini はGoogle LLC、ChatGPTはOpenAI、PerplexityはPerplexity AI、ClaudeはAnthropicの商標です。WordPressはWordPress Foundation、WooCommerceはAutomatticの商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Product data consistency checks for ecommerce care plans | Nurevo",
      description: "Add a monthly check to shop care plans: compare price and stock on the page, its structured data, the Merchant Center feed and llms.txt. Causes, a script and a report.",
      h1: "Adding a product data consistency check to an ecommerce care plan: steps and a report template for agencies",
      lead: "Add one recurring task to every online shop care plan: each month, for a fixed set of products, check that four places agree - the price and stock visible on the product page, the page's structured data (Product and Offer), the Merchant Center or other product feed, and llms.txt and AI answers. Google says a feed price that does not match the landing page or its structured data can get products disapproved and may lead to account suspension. AI answers also quote outdated prices. This guide covers why mismatches happen, how to run the check (with a script), a report template, and how to write it into the contract.",
      intro: [
        "Written 23 November 2026 (JST). For agencies that build or maintain online shops, WordPress (WooCommerce) care companies, and freelancers who run a shop's day-to-day operations. Merchant Center details follow Google's help pages as of writing; screens and rules change, so check the linked pages before you start.",
        "AI answers vary by day and by wording. Consistent product data is a precondition for being read correctly by AI and search; it does not guarantee that a shop will appear in AI answers or rank anywhere.",
      ],
      sections: [
        {
          heading: "What the popular articles leave out",
          paragraphs: [
            "On 23 November 2026 we read eight Japanese and eight English articles that rank for searches such as \"ecommerce product data consistency\", \"Merchant Center mismatched price\" and their Japanese equivalents. In English: Search Engine Journal (10 June), BelVG (12 June), Yotpo (updated 20 October), Sitebulb (31 March), TechWyse (7 September), DesignRush (5 October), Redefine Web's maintenance tiers (updated 22 September) and a dev.to Merchant Center guide. In Japanese: Salesforce's checklist (updated 17 November), Shopify's ecommerce schema guide (23 July), Netshop Tantosha Forum (7 November 2025), CommercePick (21 July), Business Insider Japan (28 September) and Shopify's help centre.",
            "Almost all of them agree that the page, structured data and feed should match. Very few cover what an agency needs to run this as a monthly maintenance task:",
          ],
          table: {
            head: ["What is missing", "What this guide covers"],
            rows: [
              ["\"Keep prices consistent\", without saying which values to compare where", "A table of four places and nine fields"],
              ["No single list of causes (sale timing, caching, JavaScript prices, variants) and fixes", "Causes and fixes based on Google's help pages"],
              ["Checks are one page at a time by hand, or a tool pitch", "A script that compares a feed export with each page's JSON-LD, and how to pick the sample"],
              ["No WordPress (WooCommerce) steps", "Where to look on a WooCommerce shop using Nurevo AEO"],
              ["Nothing on care plans or client reports", "A monthly routine, a report template and a scope table for the contract"],
            ],
            caption: "Some articles quote figures such as \"x% of shops have mismatches\"; we left out any figure that did not state how many sites were checked or how.",
          },
        },
        {
          heading: "Why make it a maintenance task: Google's rules and AI answers",
          paragraphs: [
            "Product data drifts apart again with every sale, price change and stock-out, even after it has been fixed once. A fixed monthly check lets you find mismatches before the client does. Google's help pages say:",
          ],
          table: {
            head: ["What Google says", "Source"],
            rows: [
              ["Googlebot regularly crawls landing pages and compares the feed price with the price on the page and in structured data, if present. A mismatch may lead to disapproval and may lead to account suspension.", `[Merchant Center Help: mismatched product price](${SRC.gmcMismatch})`],
              ["Prices in the HTML must match the Merchant Center price exactly; prices inserted with JavaScript after load trigger an error. If the visible page matches the feed but the structured data does not, disapprovals persist until the structured data is fixed.", `[Merchant Center Help: mismatched product price](${SRC.gmcMismatch})`],
              ["When policy reviewers find price or availability mismatches, the account can get a warning or pre-emptive item disapprovals. A review takes seven working days, and a failed review starts a seven-working-day cooldown.", `[Merchant Center Help: feed and landing page inconsistency](${SRC.gmcAccount})`],
              ["With automatic item updates on, Google may correct prices from the page. Mismatches are still treated as critical errors that can lead to suspension.", `[Merchant Center Help: automatic updates, mismatched price](${SRC.gmcAuto})`],
              ["Structured data must be in the HTML returned by the server and match the values shown to the user. Automatic item updates need price, priceCurrency, availability and condition.", `[Merchant Center Help: structured data](${SRC.gmcSd})`],
            ],
          },
          after: [
            `AI answers get prices wrong too. A Product.ai study reported by Business Insider Japan (September 2026) asked ChatGPT, Claude, Gemini and Perplexity 220 shopping questions five times each; of 913 answers whose price could be checked, 85% matched the current price ([Business Insider Japan](${SRC.biJp}); Google said the study used the developer API rather than the consumer app). What a shop controls is the source data: make it say the same thing wherever it is read.`,
            `An article on Productrise data reports that the same product's price differed between Google AI Mode and traditional search in 38.1% of matched cases ([TechWyse](${SRC.techwyse}); about three weeks of August, more than 2 million listings, with no cause established). For ChatGPT Shopping, feed-connected sources reportedly made up 61.54% of product recommendations in Profound's tracked prompts in July ([DesignRush](${SRC.designrush}); not a figure for all of ChatGPT). When the feed and the page disagree, the shop does not get to choose which value an AI uses.`,
          ],
        },
        {
          heading: "Four places and nine fields to compare",
          paragraphs: [
            "For the same product (same SKU; for variants, the same colour and size), put the values from the four places side by side. You do not need all nine fields for every product: checking price, sale and stock monthly, and the rest quarterly, already catches most problems.",
          ],
          table: {
            head: ["Field", "Visible page", "Structured data (JSON-LD)", "Feed (Merchant Center etc.)", "llms.txt and AI answers"],
            rows: [
              ["Price", "Price shown before add to cart", "Offer price", "price", "Price, if listed"],
              ["Sale price and dates", "Sale price and end date", "price is the sale price during the sale", "sale_price and sale_price_effective_date", "Sale price left over after the sale?"],
              ["Currency", "Currency shown", "priceCurrency", "Currency in price", "How the currency is written"],
              ["Stock", "In stock, out of stock, pre-order", "availability", "availability", "Recommending out-of-stock items?"],
              ["Shipping", "Shipping cost and free-shipping threshold", "shippingDetails (if used)", "shipping, or Merchant Center shipping settings", "Answer when asked about shipping"],
              ["Returns", "Returns policy page", "hasMerchantReturnPolicy (if used)", "Merchant Center return settings", "Answer when asked about returns"],
              ["Title", "Product name", "Product name", "title", "Name used in answers"],
              ["Identifiers", "Model number, GTIN (if shown)", "sku, gtin", "id, gtin, mpn", "-"],
              ["Image", "Main image", "image", "image_link", "-"],
            ],
          },
          after: [
            `In Search Central, price and priceCurrency are required for Offer; availability, shippingDetails, hasMerchantReturnPolicy and priceValidUntil are recommended ([Google: merchant listing structured data](${SRC.merchantListing})).`,
          ],
        },
        {
          heading: "Common causes of mismatches and how to fix them",
          paragraphs: [
            "These are the causes from Google's help pages that agencies most often find during maintenance, with the fix for each.",
          ],
          table: {
            head: ["Cause", "What happens", "Fix"],
            rows: [
              ["Sale start/end time or time zone set differently", "Feed or page still shows the pre-sale or post-sale price", "Set sale_price_effective_date and the shop's sale schedule to the same time and time zone"],
              ["Feed updates less often than the site (e.g. daily)", "Prices or stock disagree for a while after each change", "Update the feed right after site changes; consider automatic item updates as a backstop"],
              ["Stale page cache (plugin, host or CDN)", "Admin shows the new price but the served HTML has the old one", "Confirm that product page caches are purged when price or stock changes"],
              ["Price rendered by JavaScript after load", "The HTML Googlebot reads has no price, or a different one", "Put the price and structured data in the server-rendered HTML"],
              ["Variant preselection", "The colour or size selected by default has a different price from the feed item", "Make each variant's feed URL open with that variant selected"],
              ["Member prices, bulk pricing, minimum order", "The price anyone can pay differs from the feed price", "Use the price anyone can pay on the page and in the feed; with a minimum order, submit the total for that quantity"],
              ["Two sets of structured data (theme and plugin)", "Two Product/Offer blocks, one with an old price", "Find which theme or plugin prints each and keep one"],
              ["Tax-inclusive vs tax-exclusive settings", "Page shows one number, structured data or feed another", "Check how prices are entered and displayed so all four places show the same number"],
            ],
          },
          after: [
            `Based on Google's help pages on [mismatched product price](${SRC.gmcMismatch}) and [feed and landing page inconsistency](${SRC.gmcAccount}), rewritten in terms of agency tasks.`,
          ],
        },
        {
          heading: "The monthly routine",
          list: [
            "Choose the products to check (for example 30): some best sellers, products on sale now, products whose price or stock changed this month, products with variants, and new products. Reliably checking the products most likely to drift is more useful than skimming everything.",
            "Look at Merchant Center diagnostics first for price or availability mismatch warnings and disapprovals. A warning with a deadline comes before everything else.",
            "Export id, link, price and availability for those products from the feed.",
            "Run the script below to check whether the feed's price and stock appear in each page's JSON-LD.",
            "Open about five products in a browser, including some that passed, and compare the visible price, stock and shipping before add to cart (the script does not read visible text).",
            "If the shop publishes llms.txt, confirm the price and stock listed there for the checked products.",
            "Ask AI assistants a few questions about the checked products' price, stock and shipping, and keep the questions and answers with the date.",
            "Fix each mismatch using the causes table, and check the same products again next month.",
          ],
          after: [
            "An example script that compares a feed export with each page's JSON-LD (Python 3, standard library only). Use it with the client's agreement and on a few dozen URLs so as not to load the server.",
          ],
          code: SCRIPT_EN,
        },
        {
          heading: "Checking AI answers",
          paragraphs: [
            "Fixing the shop's data does not change AI answers right away. Ask the same questions every month and record the change.",
          ],
          list: [
            "Phrase questions the way customers would: \"How much is <product> at <shop>?\", \"Is <product> in stock?\", \"What does <shop> charge for shipping?\", \"Can I return items to <shop>?\"",
            "Record the assistant (ChatGPT, Perplexity, Google AI Mode...), date, answer and cited URLs. If there are sources, note whether the answer came from the shop's own product page, a marketplace or a comparison site.",
            "If the answer is outdated and cites the shop's own page, check that page's cache and structured data. If it cites a marketplace or comparison site, the client needs to update that listing.",
            "Answers vary even for the same question, so judge by the trend over several months, not one wrong answer.",
          ],
        },
        {
          heading: "Report template for the client",
          paragraphs: [
            "A monthly report that shows counts and what the client needs to decide makes the value of the work visible.",
          ],
          code: REPORT_EN,
        },
        {
          heading: "Writing it into the care plan",
          paragraphs: [
            "Without a clear scope, a \"product data check\" can be read as \"maintenance includes entering products and changing prices\". Split the work like this:",
          ],
          table: {
            head: ["Category", "Examples"],
            rows: [
              ["Included in the care plan (agency)", "Monthly check of <n> products, Merchant Center warnings, script and visual comparison, <n> AI questions, report, fixes where the cause is settings or caching"],
              ["Client's work", "Adding products, deciding and entering prices and sales, stock updates, updating marketplace and comparison site listings"],
              ["Quoted separately", "Rebuilding the feed setup, replacing themes or plugins, bulk fixes across the catalogue, applying to new feeds such as ChatGPT's"],
              ["Agree in advance", "How many products and how they are chosen, how fast you report warnings, the report date, the list of AI questions"],
            ],
          },
          after: [
            `One US agency's published maintenance tiers include feed monitoring in the higher tiers and make it an add-on in the entry tier ([Redefine Web](${SRC.redefine})). We found no checkable data on typical prices for this service, so we do not quote any.`,
            `Search Engine Journal describes one product that showed four different prices across the site, the feed, the price Google chose and the schema, and recommends that the SEO and feed owners check together every month ([Search Engine Journal](${SRC.sejFeed})). Copying the report to whoever owns the feed (an ads agency or the client's own staff) means the person who fixes it is known straight away.`,
            "For how to structure AI search work as a monthly service overall, see [turning AI search optimization into a monthly service](/guide/agency-aeo-monthly-service).",
          ],
        },
        {
          heading: "Steps on WordPress (WooCommerce) with Nurevo AEO",
          paragraphs: [
            `On a shop that uses the free plugin [Nurevo AEO](${WP_ORG}), the places to check look like this. Nurevo AEO does not build Merchant Center or ChatGPT feeds, so check the feed with whatever system the shop already uses.`,
          ],
          list: [
            "With the site type set to Online shop (suggested automatically when WooCommerce is active), the shop is published as an OnlineStore. Product and Offer markup on product pages is left to WooCommerce and not duplicated. When you inspect a product page's JSON-LD, check that no other theme or plugin prints a second set.",
            "The front page carries the catalogue as an OfferCatalog (up to 30 products, newest first). Only products with a price get an Offer, with in stock or out of stock when known. Include the front page in the check.",
            "llms.txt lists the newest 50 published, visible products with the price currently stored in WooCommerce (the sale price during a sale), the currency and stock. It uses the number as entered in WooCommerce, so a shop that enters prices without tax and adds tax on display will show the pre-tax number there.",
            "llms.txt is rebuilt when a post or product is saved or settings change, and is otherwise reused for up to a day. Right after a scheduled sale starts or ends, check the prices in llms.txt as well.",
            "If you set a returns page, its URL is published as the shop's MerchantReturnPolicy. Write the return conditions themselves on that page.",
            "For AI visibility, connected Free and Standard sites get a monthly check that asks Perplexity three questions. Pro (from USD 99 a month) runs its measurement on Perplexity, with ChatGPT to follow once configured.",
          ],
        },
        {
          heading: "If your agency uses Nurevo",
          paragraphs: [
            `Install the free plugin on each client's shop, put structured data, llms.txt and AI crawler access in order, then make this check part of the care plan. That way \"what we fixed\" and \"how AI reads the shop\" go into one report. Standard is USD 20 a month. For the partner program, see the [partner page](${PARTNER}).`,
          ],
        },
        {
          heading: "Monthly checklist",
          list: [
            "No price or availability mismatch warnings or disapprovals in Merchant Center (or the deadline is noted)",
            "The sample includes best sellers, items on sale, items changed this month and items with variants",
            "Feed price and stock match the Offer in each page's JSON-LD",
            "Visible price, stock and shipping match the JSON-LD (a few checked by eye)",
            "Sale start and end times are the same in the shop and the feed",
            "Product page caches are purged after price or stock changes",
            "Only one set of Product/Offer structured data per page",
            "Prices are in the server HTML, not added later by JavaScript",
            "Prices and stock in llms.txt match the site",
            "AI questions and answers are recorded with dates and compared with last month",
          ],
        },
      ],
      faqs: [
        { q: "Is this worth doing for a shop that does not use Merchant Center?", a: "Yes. Without a feed, comparing the visible page, structured data, llms.txt and AI answers is still useful, because AI and search read the page's structured data." },
        { q: "If automatic item updates are on, can we skip the check?", a: "Google's help says mismatches are still treated as critical errors that can lead to suspension, even when automatic updates correct the price. Treat automatic updates as a backstop and keep fixing the cause." },
        { q: "Do we need to check every product every month?", a: "For most shops, a few dozen products weighted towards best sellers, items on sale, items changed this month and items with variants catch most mismatches. When you find a recurring cause, check every product it could affect." },
        { q: "The script says MISMATCH. What do we look at first?", a: "Open the product page in a browser and see whether the visible price matches the feed or the JSON-LD. If the visible price and JSON-LD differ, suspect structured data or caching; if the visible price and feed differ, suspect feed timing or sale settings." },
        { q: "An AI assistant quotes an old price. What can we do?", a: "Check the cited source. If it is the shop's own page, fix that page's display, structured data and cache. If it is a marketplace or comparison site, that listing needs updating. Answers may not change right away, so look at several months of records." },
        { q: "Clients also ask us to enter prices and set up sales. Should that be in the care plan?", a: "Keep it separate in the contract. Put the check and fixes for settings or caching causes in the care plan, and product entry and pricing decisions with the client or in a separately priced operations service." },
        { q: "If product data is consistent, will products appear in ChatGPT or Google's AI?", a: "That cannot be guaranteed. AI answers change by day and wording and draw on other shops and reviews too. Consistent data means that when a product does appear, it is shown with the right price and stock." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads your client's shop",
        body: "The free check needs no sign-up: enter a URL to see the state of its structured data, llms.txt and AI crawler access. Run it before the monthly check.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "Google, Merchant Center and Gemini are trademarks of Google LLC; ChatGPT of OpenAI; Perplexity of Perplexity AI; Claude of Anthropic. WordPress is a trademark of the WordPress Foundation and WooCommerce of Automattic. Nurevo is not affiliated with or endorsed by these companies.",
    },
  },
};
