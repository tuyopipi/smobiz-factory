// Content page: AI search (AEO) for moving companies (引越し業者). Industry
// page. Japan-first: the 標準引越運送約款 (cancellation / postponement fees,
// free estimates, the 3-day confirmation, the 3-month claim window), the
// 引越安心マーク certification, written estimates with their conditions, the
// service area and the MovingCompany schema.org type.
//
// Written 2026-11-19 08時 (JST). Every claim about Nurevo AEO is one the
// plugin's readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.2) or its source: Settings has a free-text "業種（schema.org型）" field
// (nurevo-webmcp.php, business_type, any [A-Za-z][A-Za-z0-9]* value is used as
// the business node's @type); the wizard's "Professional services" card sets
// ProfessionalService (includes/setup-wizard.php), "Other" sets no type;
// filter webmcp_canary_business_node ($node, $settings) documented in
// wordpress-plugin/webmcp-canary/docs/developers.md (properties merged into
// the SEO plugin's business node, existing values win); services (name,
// minutes, price, currency, category, booking URL, description) published as
// Service + Offer + ReserveAction and an llms.txt line; FAQ block /
// [nurevo_faq]; per-page FAQ and llms.txt exclusion; monthly free check:
// three questions from business type and area (never the name) to Perplexity;
// Pro measurement (beta) on Perplexity.
//
// Outside facts and where they were read (2026-11-19):
// - MLIT 標準引越運送約款等の改正について (jidosha_tk4_000033): in force
//   2018-06-01 (平成30年6月1日); applies to 積合せ moves too; cancellation /
//   postponement fees: 当日 up to 50%, 前日 up to 30%, 前々日 up to 20% of
//   運賃及び料金 (previously 当日 20%, 前日 10%). Same table on the Chugoku
//   bureau page (truckhikkoshioshirase).
// - Hyogo Prefecture consumer leaflet (toraburu11.pdf, 2019-02, reflecting the
//   2018 rules): 見積料 and 内金・手付金 are not charged at estimate time; the
//   mover confirms changes 3 days before the pick-up date written in the
//   estimate; damage or loss must be reported within 3 months of the move;
//   advice: have the mover come to inspect rather than estimate by phone or
//   online, the estimate cannot be raised for the mover's convenience, check
//   cancellation fees in advance, declare fragile items and valuables.
//   (Summary of the 約款; the article text itself was not readable this run.)
// - MLIT 引越事業者優良認定制度 (jidosha_tk4_000026): created by 全日本トラック
//   協会 in FY2014 (平成26年度); mark 「引越安心マーク」. Kyushu bureau page
//   (updated 2024-02-29): offices must be 安全性優良事業所 or equivalent,
//   follow the 約款, have a complaint system.
// - LOGISTICS TODAY 2025-12-22 (reporting the JTA announcement of the 17th):
//   FY2025 41 movers certified (43 applied), valid 2026-01-01 to 2028-12-31;
//   348 movers / 1,673 offices carry the mark incl. FY2023 and FY2024.
// - schema-dts 2.1.0 (read 2026-11-19): MovingCompany "A moving company.",
//   one of the HomeAndConstructionBusiness subtypes (LocalBusiness);
//   areaServed on Organization/Service: AdministrativeArea | GeoShape | Place | Text.
// - Google "AI features and your website" and NTA tax answer 6902: as checked
//   2026-11-01 for hair-salon-ai-search (not re-fetched this run).
// - Top articles read 2026-11-19: uravation 引っ越し業者のLLMO対策 (2026-08-15),
//   kigyolog LLMO対策 (2026-08-07), Movers Development x2 (2026-11-04,
//   2026-10-24), The Mover (2025-11-10, teaser only), CallRail (2025-07-30),
//   Netpeak (2026-06-10, the 15-25% figure is the author's estimate),
//   ThinkProfits (service page, undated).
// Not verified, so not stated: anything in a 2024 revision of the moving
// 約款 (MLIT jidosha_tk4_000009 could not be fetched), seasonal demand
// figures, rules on disposal / 不用品回収 permits, the JTA list page itself,
// statistics on how many people choose a mover through AI.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  mlitYakkan: "https://www.mlit.go.jp/jidosha/jidosha_tk4_000033.html",
  chugoku: "https://wwwtb.mlit.go.jp/chugoku/jidousha/truckhikkoshioshirase.html",
  hyogo: "https://web.pref.hyogo.lg.jp/kf13/shohiseikatsu/sonota/suishinhombu/documents/toraburu11.pdf",
  mlitMark: "https://www.mlit.go.jp/jidosha/jidosha_tk4_000026.html",
  kyushu: "https://wwwtb.mlit.go.jp/kyushu/yuryo.html",
  logiToday: "https://www.logi-today.com/892661",
  movingCompany: "https://schema.org/MovingCompany",
  areaServed: "https://schema.org/areaServed",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
  uravation: "https://uravation.com/llmo/hikkoshi-gyosha-llmo-taisaku/",
  moversdev: "https://moversdev.com/how-moving-companies-can-show-up-in-chatgpt-search-results/",
  netpeak: "https://netpeak.us/blog/what-percent-of-customers-find-their-moving-company-through-ai-assistants-chatgpt/",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MovingCompany",
      "@id": "https://example.jp/#organization",
      "name": "例引越センター（例）",
      "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯市◯◯町1-2-3" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Mo-Su 08:00-20:00",
      "areaServed": [
        { "@type": "AdministrativeArea", "name": "◯◯県" },
        { "@type": "AdministrativeArea", "name": "◯◯県◯◯市" }
      ]
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "訪問見積もり（無料・約30分）",
      "description": "お部屋で荷物の量と搬出経路を確かめ、条件を書いた見積書をお渡しします。見積もりだけで契約する必要はありません。",
      "category": "引越し",
      "provider": { "@id": "https://example.jp/#organization" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 30, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/estimate" },
        "result": { "@type": "Reservation", "name": "訪問見積もり（無料・約30分）" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MovingCompany",
      "@id": "https://example.com/#organization",
      "name": "Example Movers",
      "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Example St, Example City" },
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Mo-Su 08:00-20:00",
      "areaServed": [
        { "@type": "AdministrativeArea", "name": "Example County" },
        { "@type": "AdministrativeArea", "name": "Example City" }
      ]
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "In-home estimate (free, about 30 min)",
      "description": "We check the amount of furniture and the route out of your home, then give you a written estimate with its conditions. No obligation to book.",
      "category": "Moving",
      "provider": { "@id": "https://example.com/#organization" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 30, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/estimate" },
        "result": { "@type": "Reservation", "name": "In-home estimate (free, about 30 min)" }
      }
    }
  ]
}`;

const PHP_JA = `// 対応エリアを業者のノードに足す（値は「対応エリア」ページの本文と同じにする）
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'AdministrativeArea', 'name' => '◯◯県'),
        array('@type' => 'AdministrativeArea', 'name' => '◯◯県◯◯市'),
    );
    return $node;
}, 10, 2);`;

const PHP_EN = `// Add the service area to the mover's node (same values as your "Areas we cover" page)
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'AdministrativeArea', 'name' => 'Example County'),
        array('@type' => 'AdministrativeArea', 'name' => 'Example City'),
    );
    return $node;
}, 10, 2);`;

export default {
  slug: "moving-company-ai-search",
  targetQueries: [
    "moving company AI search optimization",
    "movers ChatGPT recommendations",
    "MovingCompany schema markup",
    "引越し業者 AI検索対策",
    "引越し 業者 ChatGPT 集客",
    "引越し業者 LLMO 構造化データ",
  ],
  related: ["local-business-schema-seo-plugins", "multi-location-business-ai-search", "measure-ai-visibility", "llms-txt", "google-ai-overviews-citations"],
  locales: {
    ja: {
      title: "引越し業者のAI検索対策：見積もり・料金・キャンセル料・対応エリア | Nurevo",
      description: "引越し業者のAI検索対策は、見積もりの取り方、料金が決まる条件、キャンセル料、補償の申し出期限、対応エリアを本文に書き、MovingCompanyの構造化データとそろえること。約款に沿った書き方と手順。",
      h1: "引越し業者のAI検索対策：見積もり・料金の条件・キャンセル料・対応エリアをAIに正しく読ませる手順",
      lead: "引越し業者のAI検索対策の中心は、AIに聞かれる「見積もりは無料か、家に来てもらう必要があるか」「単身・家族でいくらぐらいか、何で金額が変わるか」「キャンセルや日にちの変更はいつまで無料か」「物が壊れたらどうなるか」「うちの地域に来てくれるか」に、ページ本文で条件まで書いて答えることです。キャンセル料や見積もりのルールは国土交通省の標準引越運送約款に沿って書き、会社は schema.org の MovingCompany、対応エリアは areaServed、無料見積もりは Service として、本文と同じ値を構造化データにします。",
      intro: [
        "作成日：2026年11月19日（JST）。国土交通省・運輸局・兵庫県の資料、引越安心マークの報道、上位の記事はこの日に読みました。schema.org の型は同じ日に schema-dts 2.1.0 で確認しました。Google と国税庁のページは2026年11月1日に確認した内容です。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが引越し業者の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。約款の細かい扱いは、国土交通省の最新の約款と管轄の運輸局で確かめてください。",
      ],
      sections: [
        {
          heading: "引越しを考える人はAIに何を聞くか",
          paragraphs: [
            "引越しの相談は、場所・時期・荷物の量・お金・不安がからみます。「3月末に◯◯市から◯◯市へ、2人暮らしの引越し。いくらぐらいで、どこに頼めばいい？」「見積もりは家に来てもらわないとだめ？」「前日にキャンセルしたらいくら取られる？」「冷蔵庫が壊れたら補償される？」「エアコンの取り外しもやってくれる業者は？」といった質問です。",
            "AIがこれに答えるには、業者のサイトに、対応する地域、見積もりの方法と費用、料金が何で決まるか、キャンセル・延期の料金、補償の申し出の方法、頼める作業（梱包、家具の組み立て、エアコンなど）が文字で書かれている必要があります。料金が「お見積もりします」だけ、対応エリアが地図の画像だけ、キャンセル料が約款のPDFの中だけ、という状態だと、AIは一括見積もりサイトや比較記事の一般論で答えることになります。",
            `Googleは、AIによる概要やAIモードに出るための追加の要件や特別な構造化データはなく、構造化データを見える文章と一致させる、ビジネスプロフィールを最新にする、といった通常の基本が大切だとしています。[Google：AI features and your website](${SRC.googleAi})。引越し業者の対策も、裏技ではなく、事実をそろえて書くことが本体です。`,
          ],
          table: {
            head: ["よく聞かれること", "ページに書くこと", "置く場所"],
            rows: [
              ["見積もりは無料か、訪問が必要か", "訪問・オンライン（ビデオ）・電話それぞれの可否と所要時間、見積料がかからないこと、見積書を渡すこと", "見積もりのページ、FAQ"],
              ["いくらぐらいか", "料金が変わる条件（荷物の量、距離、時期・曜日・時間帯、階段やエレベーター、作業員の人数）と、条件を書いた見積もりの例2〜3通り（税込・作成日つき）", "料金のページ"],
              ["キャンセル・延期はいつまで無料か", "約款どおりの料金の区分（当日・前日・前々日）と、無料になる時期、連絡方法", "料金のページ、FAQ、見積書"],
              ["壊れた・なくなったときは", "申し出の期限と窓口、事前に伝えてほしい物（壊れやすい物・貴重品）", "補償のページ、FAQ"],
              ["地域に来てくれるか", "対応する都道府県・市区町村を文字で、長距離の扱い", "対応エリアのページ"],
              ["ほかに何を頼めるか", "梱包・荷ほどき、家具の分解と組み立て、エアコン、ピアノ、不用品の扱い（自社で行うか、提携先に取り次ぐか）", "サービスのページ"],
            ],
            caption: "質問の例は、この記事の作成時に整理したものです。どの質問がどれだけ聞かれているかの統計ではありません。",
          },
        },
        {
          heading: "上位の記事に足りなかったこと",
          paragraphs: [
            `「引越し業者 AI検索対策」「moving company AI search」で上位の記事を日本語・英語で8本読みました。日本語では、[uravation（2026年8月15日）](${SRC.uravation})が料金の幅や繁忙期の説明、訪問見積もりとオンライン見積もりの考え方まで書いていて、いちばん具体的でした。英語では、[Movers Development（2026年10月24日更新）](${SRC.moversdev})がrobots.txtの例と確かめ方の質問を載せていました。`,
            `一方で、どの記事にも構造化データの具体例やWordPressでの設定手順はなく、料金の表は「◯万円」のような空欄のままでした。英語の記事の数字は多くが出典のない自己申告で、[Netpeak（2026年6月10日）](${SRC.netpeak})の「15〜25%の人がAIで業者を探す」も、筆者自身が引越し業界の調査ではなく周辺のデータからの推定だと書いています。この記事では、国土交通省の約款の決まりに沿った書き方、MovingCompany と対応エリアの構造化データ、WordPressでの手順、測り方までを1本にまとめました。`,
          ],
        },
        {
          heading: "見積もりとキャンセル料は、約款どおりに本文に書く",
          paragraphs: [
            `国土交通省の標準引越運送約款は、2018年6月1日施行の改正で、キャンセル・延期の料金の上限を、引越し当日は運賃と料金の50%以内、前日は30%以内、前々日は20%以内にしました（それまでは当日20%、前日10%）。1台のトラックで複数の家の荷物を運ぶ「積合せ」の引越しにも約款が使われるようになりました。[国土交通省：標準引越運送約款等の改正について](${SRC.mlitYakkan})・[中国運輸局](${SRC.chugoku})`,
            `兵庫県の消費者向けの資料（2019年2月）は、改正後の約款のポイントとして、見積料や内金・手付金は見積もりのときに請求しないこと、見積書に書いた荷物の受け取り日の3日前までに業者が内容の変更を確かめること、荷物の破損や紛失は引越しの日から3か月以内に申し出ることを挙げています。消費者には、電話やネットだけの見積もりは避けて下見に来てもらうこと、解約・延期の料金を前もって確かめることをすすめています。[兵庫県：引越しのトラブル（PDF）](${SRC.hyogo})`,
            "AIは「前日キャンセルはいくら？」と聞かれると、約款の一般的なルールで答えることがあります。自社の扱いが約款どおりなら、そのことと料金の区分を料金のページとFAQに文字で書き、約款より利用者に有利な扱い（例：前々日までは無料）にしているなら、それをはっきり書きます。約款のPDFを置くだけでは、AIも人も読みにくいままです。",
          ],
          table: {
            head: ["引越しの日から見て", "キャンセル・延期の料金の上限（約款）", "ページでの書き方の例"],
            rows: [
              ["当日", "運賃と料金の50%以内", "「当日のキャンセル・延期：運賃と料金の50%以内」"],
              ["前日", "運賃と料金の30%以内", "「前日：30%以内」"],
              ["前々日", "運賃と料金の20%以内", "「前々日：20%以内」"],
              ["それより前", "上の区分に当たらない", "自社の扱い（例：「3日前までの連絡は無料」）をそのまま書く"],
            ],
            caption: "上限は2018年6月1日施行の標準引越運送約款による（国土交通省のページで2026年11月19日確認）。自社の約款を使っている場合や、その後の改正があった場合は、自社で使っている約款の値を書いてください。",
          },
          after: [
            `料金は税込で書きます。国税庁は、消費者に前もって価格を示す場合は消費税を含めた総額を表示するよう案内しています。[国税庁：タックスアンサー No.6902](${SRC.ntaTotal})`,
          ],
        },
        {
          heading: "料金は「条件つきの例」で書く",
          paragraphs: [
            "引越しの料金は荷物の量・距離・時期・建物の条件で変わるので、一律の価格は書けません。だからといって「お見積もりします」だけでは、AIは「業者によって違います」としか答えられません。条件を全部書いた見積もりの例を2〜3通り、作成した月と一緒に載せると、AIも人も「この条件ならこのくらい」と読めます。",
          ],
          list: [
            "例ごとに書く条件：人数と間取り、荷物の量（家具・家電の主なもの、段ボールの数）、移動の距離（市内・県内・県外など）、時期（月・平日か土日か・時間帯）、建物（階数、エレベーターの有無、トラックを停める場所からの距離）、作業員とトラックの数、含まれる作業（梱包材、養生、家具の組み立てなど）。",
            "金額は税込で、見積もりを作った年月を添えます。古い例は更新するか消します。",
            "繁忙期の扱いは、なぜ高くなるのか（作業員とトラックの数に限りがあるなど自社の事情）と、早めの予約や日程の調整でどう変わるかを書きます。業界全体の需要の数字は、出典を確かめられるものだけを使います。",
            "追加料金がかかる場合（当日の荷物の増加、吊り上げ作業、長い距離の手運びなど）と、その決め方を書きます。兵庫県の資料は、見積もりの金額を業者の都合で増やすことはできないと案内しています。",
          ],
        },
        {
          heading: "対応エリア・補償・信頼の手がかり",
          paragraphs: [
            "対応エリアは、地図の画像だけでなく、都道府県と市区町村の名前を文字で書きます。長距離や県外の引越しを受けるか、受けるなら別の扱いがあるかも書きます。複数の営業所があるなら、営業所ごとのページに住所・電話・対応エリアを書き分けます。[複数店舗・支店のAI検索対策](/guide/multi-location-business-ai-search/)",
            "補償は、破損や紛失の申し出の期限（約款では引越しの日から3か月以内）、申し出の窓口、事前に伝えてほしい物、自社が入っている保険があればその範囲を書きます。保険の金額などを書くときは、契約の内容と同じにします。",
            `信頼の手がかりとして、引越安心マークがあります。全日本トラック協会が2014年度に作った引越事業者優良認定制度で、安全で安心な引越しのサービスを提供すると認めた業者に与えられます。[国土交通省：引越事業者優良認定制度](${SRC.mlitMark})。認定には、引越しを行う営業所が安全性優良事業所（Gマーク）かそれと同じ水準であること、約款を守ること、苦情に対応する体制があることなどが求められます。[九州運輸局](${SRC.kyushu})。2025年12月の報道では、2025年度に41社が認定され（有効期間は2026年1月1日〜2028年12月31日）、マークを持つ業者は348社・1,673事業所でした。[LOGISTICS TODAY（2025年12月22日）](${SRC.logiToday})`,
            "認定を受けているなら、マークの画像だけでなく「引越安心マーク（全日本トラック協会の引越事業者優良認定）取得、有効期間◯年◯月まで」と文字で会社概要に書きます。受けていないのに似た表現を使うことはしません。口コミは、Googleビジネスプロフィールなど第三者の場所で集め、サイトに自分で載せた口コミで評価を水増ししないようにします。",
          ],
        },
        {
          heading: "構造化データ：MovingCompany と areaServed",
          paragraphs: [
            `schema.org には引越し業者のための型 [MovingCompany](${SRC.movingCompany}) があり、住宅・建設関係の業種（HomeAndConstructionBusiness）の一つとして LocalBusiness の下にあります。対応エリアは [areaServed](${SRC.areaServed}) で、都道府県や市区町村を AdministrativeArea として並べられます。無料の訪問見積もりは Service と Offer（0円）で表せます。`,
            "Nurevo AEOで業種を MovingCompany にし、訪問見積もりをサービスに入れ、対応エリアを下のフィルターで足すと、次のような形になります（値は例です）。",
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データの値は、ページ本文と同じにします。Offer に入る金額は1つだけなので、引越しのプランの料金は本文の「条件つきの例」の表に書き、構造化データには無料の見積もりのように金額が決まっているものだけを入れるのが安全です。",
          ],
        },
        {
          heading: "WordPressの引越し業者サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「その他」を選び、設定画面の「業種（schema.org型）」に MovingCompany と入力します。「専門サービス」は ProfessionalService になるため選びません。",
            "会社名・住所・電話番号・受付時間・説明を確認します。説明には、対応エリア、単身・家族・オフィスなど受ける引越しの種類、見積もりの方法を短く書きます。",
            "サービスに、訪問見積もり（0円・所要時間）、オンライン見積もり、主なプラン、エアコンなどの付帯作業を1つずつ登録します（最大20件）。名前・時間（分）・税込の料金と通貨（JPY）・カテゴリ・予約ページのURL・説明を入れると、Service・Offer・予約の操作（ReserveAction）として出力され、llms.txtにも1行ずつ載ります。料金が条件で変わるプランは、金額を入れずに説明に条件を書きます。",
            "対応エリアは、開発者向けの webmcp_canary_business_node フィルターで areaServed を足します（下のコード。子テーマの functions.php かコードスニペットのプラグインに）。SEOプラグインを使っている場合は、そのプラグインの会社のノードにまとめられ、プラグイン側にすでにある値が優先されます。",
            "よく聞かれる質問（見積もりの費用と方法、キャンセル・延期の料金、補償の申し出、当日の追加料金、支払い方法、対応エリア外の扱い）をFAQに入れ、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。料金ページだけの質問は、ブロックエディタのNurevo AEOパネルでそのページ専用のFAQにできます。",
            "/llms.txt を開き、料金・見積もり・対応エリア・補償・会社概要のページが載っているか確かめます。終わったキャンペーンのページは、Nurevo AEOパネルでllms.txtに載せない設定にできます。AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態を確かめられます。SEOプラグインとの併用の詳細は[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "一括見積もりサイト・比較サイトとのそろえ方",
          paragraphs: [
            "AIは、業者のサイトだけでなく、一括見積もりサイトや比較記事、Googleビジネスプロフィールも読みます。会社名・住所・電話・対応エリア・営業時間が場所ごとに違うと、どれが正しいかAIが判断できません。掲載しているサイトを一覧にして、年に1〜2回、自社サイトの値に合わせて直します。",
            "料金やキャンペーンは掲載先ごとに違うことがあるので、自社サイトには「料金は見積書の金額が基準」「掲載サイトのキャンペーンは各サイトの条件による」と書いておくと、AIが古い割引の値をそのまま答える場面を減らせます。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "見積もりの方法（訪問・オンライン・電話）ごとに、費用がかからないこと、所要時間、見積書を渡すことが書かれている。",
            "料金のページに、条件を全部書いた見積もりの例が2〜3通り、税込・作成年月つきで載っている。",
            "キャンセル・延期の料金の区分（当日・前日・前々日）と、無料になる時期が、料金のページとFAQに文字で書かれている。",
            "破損・紛失の申し出の期限と窓口、事前に伝えてほしい物が書かれている。",
            "対応エリアが都道府県・市区町村の名前で文字になっていて、構造化データの areaServed と同じ。",
            "業種が MovingCompany になっていて、名前・住所・電話・受付時間がサイト・構造化データ・Googleビジネスプロフィール・掲載サイトでそろっている。",
            "引越安心マークなどの認定は、名前・認定した団体・有効期間を文字で書いている（受けていない認定は書かない）。",
            "「業界最安値」「必ず」など、根拠を示せない言い方がない。",
            "llms.txtに、料金・見積もり・対応エリア・補償・会社概要のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、引越しを考える人が聞きそうな質問を、地域・時期・人数・不安（キャンセル料、補償、見積もり）の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げて、自社が名前やURLで出るか、料金やキャンセル料の説明が正しいか、引用元が自社サイトか一括見積もりサイトかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、料金のページを直した月の前後で分けて記録します。[AIでの登場率の測り方](/guide/measure-ai-visibility/)",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（会社名は含めません）をPerplexityに投げ、回答に会社の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に会社が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "引越し業者のAI検索対策は、何から始めればいいですか？", a: "料金のページに条件を書いた見積もりの例を載せること、キャンセル・延期の料金と補償の申し出の期限を文字で書くこと、対応エリアを市区町村の名前で書くことからです。そのうえで業種を MovingCompany にした構造化データと、Googleビジネスプロフィール・掲載サイトの値をそろえます。" },
        { q: "料金を載せると、他社に比べられて不利になりませんか？", a: "一律の価格ではなく、条件つきの例として載せれば、実際の見積もりと違うという誤解は減らせます。料金が書かれていないと、AIは一括見積もりサイトや一般論の金額で答えることがあります。例には条件と作成年月を必ず添えてください。" },
        { q: "キャンセル料はどう書けばいいですか？", a: "国土交通省の標準引越運送約款（2018年6月1日施行）では、上限は当日が運賃と料金の50%以内、前日が30%以内、前々日が20%以内です。自社で使っている約款の値と、無料になる時期を、料金のページとFAQに文字で書きます。" },
        { q: "見積もりは訪問しないといけませんか？", a: "決まりではありませんが、兵庫県の消費者向けの資料は、電話やネットだけの見積もりを避けて下見に来てもらうようすすめています。訪問・オンライン・電話のそれぞれで何が分かり、見積書がどう渡されるかを書くと、AIも違いを説明しやすくなります。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.org の MovingCompany です。対応エリアは areaServed、無料の見積もりは Service と Offer（0円）で表せます。値はページ本文と同じにしてください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。会社の連絡先・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに会社が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが会社の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが自社のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。引越安心マークは公益社団法人全日本トラック協会の認定制度です。Nurevoはこれらの企業や、記事で触れた会社・団体と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Moving Companies: Estimates, Fees, Area | Nurevo",
      description: "How a mover gets described correctly by AI search: explain estimates, what sets the price, cancellation fees, claims and your service area, with MovingCompany schema.",
      h1: "AI search for moving companies: getting your estimates, price conditions, cancellation fees and service area read correctly",
      lead: "For a moving company, AI search optimization mostly means answering, in the text of your own pages, what people ask an AI assistant before they book: \"Is the estimate free, and does someone have to visit?\", \"Roughly how much for a one-bedroom, and what changes the price?\", \"Until when can I cancel or change the date for free?\", \"What happens if something breaks?\" and \"Do you cover my area?\". Write cancellation and estimate rules the way your contract terms set them (in Japan, the standard moving contract terms published by the transport ministry), then publish the same values as structured data: the company as a schema.org MovingCompany, the area as areaServed and the free estimate as a Service.",
      intro: [
        "Written 19 November 2026 (JST). The Japanese transport ministry and regional bureau pages, a Hyogo Prefecture consumer leaflet, news coverage of the certification mark and the top-ranking articles were read that day. schema.org types were checked that day in schema-dts 2.1.0. The Google and National Tax Agency pages reflect what we checked on 1 November 2026.",
        "This guide is written for movers in Japan, where Nurevo is based, so the contract sections describe Japanese rules. If you work elsewhere, the same pattern applies to whatever terms and consumer rules govern moves in your country. AI answers change with the day and the wording, and nothing can guarantee you will appear. The aim is that AI does not get your facts wrong and has what it needs to recommend you. This is not legal advice.",
      ],
      sections: [
        {
          heading: "What people planning a move ask AI",
          paragraphs: [
            "Moving questions combine place, timing, volume, money and worry: \"Two of us are moving from [city] to [city] at the end of March. Roughly how much, and who should we use?\", \"Do I have to let them into my home for the estimate?\", \"How much will I pay if I cancel the day before?\", \"Is my fridge covered if it gets damaged?\", \"Which movers also take down the air conditioner?\"",
            "To answer, an AI needs your site to state in text the areas you cover, how estimates work and what they cost, what drives the price, cancellation and postponement fees, how to make a damage claim and the extra jobs you take on (packing, furniture assembly, air conditioners). If your prices say only \"contact us for a quote\", your area is a map image and your cancellation terms sit inside a PDF, the AI falls back on comparison sites and generic articles.",
            "Google says there are no extra requirements or special structured data for AI Overviews and AI Mode: structured data that matches the visible text and an up-to-date Business Profile are the basics that matter. [Google: AI features and your website](" + SRC.googleAi + "). For a mover, the work is the same: get the facts written down and consistent, not a trick.",
          ],
          table: {
            head: ["Common question", "What to write", "Where"],
            rows: [
              ["Is the estimate free, does someone have to visit?", "Whether you do in-home, video and phone estimates, how long each takes, that there is no estimate fee and that you hand over a written estimate", "Estimate page, FAQ"],
              ["Roughly how much?", "What changes the price (volume, distance, season, weekday or weekend, time of day, stairs or lift, crew size) and two or three worked examples with all conditions, tax included and dated", "Prices page"],
              ["Until when can I cancel or postpone for free?", "The fee bands your terms set (moving day, day before, two days before), when it becomes free, how to tell you", "Prices page, FAQ, the estimate"],
              ["What if something breaks or goes missing?", "The deadline and contact for claims, items to declare in advance (fragile items, valuables)", "Claims page, FAQ"],
              ["Do you cover my area?", "Prefectures and cities by name, in text, and how you handle long-distance moves", "Service area page"],
              ["What else can you do?", "Packing and unpacking, furniture assembly, air conditioners, pianos, unwanted items (done yourself or passed to a partner)", "Services page"],
            ],
            caption: "The questions are examples we put together while writing this guide, not statistics on how often each is asked.",
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read eight top-ranking articles in Japanese and English for \"moving company AI search\" and its Japanese equivalent. In Japanese, [uravation (15 August 2026)](" + SRC.uravation + ") was the most concrete, covering price ranges, peak season and in-home versus online estimates. In English, [Movers Development (updated 24 October 2026)](" + SRC.moversdev + ") included a robots.txt example and a set of test questions.",
            "None of them gave a structured data example or WordPress setup steps, and the price tables were left as blanks. Most figures in the English articles are self-reported with no source; the \"15–25% of customers find their mover through AI\" estimate from [Netpeak (10 June 2026)](" + SRC.netpeak + ") is, in the author's own words, derived from adjacent data rather than a study of the moving industry. This guide puts together writing to the official contract terms, MovingCompany and service area structured data, WordPress steps and how to measure.",
          ],
        },
        {
          heading: "Write estimates and cancellation fees the way your terms set them",
          paragraphs: [
            "Japan's standard moving contract terms (標準引越運送約款), published by the Ministry of Land, Infrastructure, Transport and Tourism, were revised with effect from 1 June 2018. The cap on cancellation and postponement fees became 50% of the fare and charges on moving day, 30% the day before and 20% two days before (previously 20% on the day and 10% the day before). The terms also began to apply to shared-truck moves, where one truck carries several households' belongings. [MLIT: revision of the standard moving terms](" + SRC.mlitYakkan + ") · [Chugoku District Transport Bureau](" + SRC.chugoku + ")",
            "A consumer leaflet from Hyogo Prefecture (February 2019) lists the main points of the revised terms: no estimate fee and no deposit at the estimate; the mover confirms any changes up to three days before the pick-up date in the estimate; damage or loss must be reported within three months of the move. It advises consumers to have the mover inspect in person rather than quote by phone or online only, and to check cancellation fees in advance. [Hyogo Prefecture: moving troubles (PDF, Japanese)](" + SRC.hyogo + ")",
            "Asked \"how much if I cancel the day before?\", an AI may answer with the general rule. If you follow the standard terms, say so and list the bands on your prices page and in your FAQ. If you are more generous (free until two days before, for example), state that clearly. Uploading the terms as a PDF alone leaves them hard to read for both people and AI.",
          ],
          table: {
            head: ["Counted from moving day", "Cap on cancellation or postponement fee (standard terms)", "How to write it on the page"],
            rows: [
              ["Moving day", "Up to 50% of the fare and charges", "\"Cancelling or postponing on moving day: up to 50% of the fare and charges\""],
              ["Day before", "Up to 30%", "\"Day before: up to 30%\""],
              ["Two days before", "Up to 20%", "\"Two days before: up to 20%\""],
              ["Earlier", "Not covered by the bands above", "Write your own rule as it is (e.g. \"free if you tell us three or more days before\")"],
            ],
            caption: "Caps from the standard moving terms in force from 1 June 2018 (checked on the MLIT page on 19 November 2026). If you use your own terms, or the terms have been revised since, write the values in the terms you actually use.",
          },
          after: [
            "Show prices including tax. Japan's National Tax Agency asks businesses that show prices to consumers in advance to show the total including consumption tax. [National Tax Agency: Tax Answer No. 6902 (Japanese)](" + SRC.ntaTotal + ")",
          ],
        },
        {
          heading: "Publish prices as worked examples with their conditions",
          paragraphs: [
            "A move's price depends on volume, distance, timing and the building, so you cannot list one fixed price. But \"contact us for a quote\" alone leaves an AI with nothing better than \"it varies by company\". Two or three worked examples, each with every condition and the month it was written, let both people and AI read \"under these conditions, about this much\".",
          ],
          list: [
            "Conditions for each example: number of people and home size, volume (main furniture and appliances, number of boxes), distance (same city, same prefecture, out of prefecture), timing (month, weekday or weekend, time of day), the building (floor, lift or not, distance from where the truck parks), crew and truck size, and what is included (packing materials, floor protection, furniture assembly).",
            "Give amounts including tax with the month and year of the estimate. Update or remove old examples.",
            "For peak season, explain why prices rise (your own limits on crew and trucks, for example) and how booking early or being flexible on dates changes them. Use industry-wide demand figures only if you can check their source.",
            "Say when extra charges apply (more belongings on the day, hoisting, long carries) and how they are decided. The Hyogo leaflet notes that the estimate cannot be raised for the mover's convenience.",
          ],
        },
        {
          heading: "Service area, claims and signals of trust",
          paragraphs: [
            "Write your service area as prefecture and city names in text, not just a map image. Say whether you take long-distance or out-of-prefecture moves and whether they are handled differently. If you have several branches, give each its own page with its address, phone number and area. [AI search for multi-location businesses](/guide/multi-location-business-ai-search/)",
            "For claims, state the deadline (three months from the move under the standard terms), where to report, what to declare in advance and, if you carry insurance, what it covers. Any amounts you publish should match the policy.",
            "One signal of trust in Japan is the Hikkoshi Anshin Mark (引越安心マーク). It comes from a certification scheme the Japan Trucking Association created in fiscal 2014 for movers it recognises as providing safe and reliable moving services. [MLIT: certification of excellent movers (Japanese)](" + SRC.mlitMark + "). Requirements include every branch handling moves being a certified safe operator (G-mark) or equivalent, following the standard terms and having a complaint-handling system. [Kyushu District Transport Bureau (Japanese)](" + SRC.kyushu + "). According to December 2025 coverage, 41 movers were certified in fiscal 2025 (valid 1 January 2026 to 31 December 2028), and 348 movers with 1,673 branches held the mark. [LOGISTICS TODAY, 22 December 2025 (Japanese)](" + SRC.logiToday + ")",
            "If you hold a certification, write its name, the body that grants it and its validity period in text on your company page, not just as a logo. Do not use similar wording if you are not certified. Collect reviews on third-party places such as your Google Business Profile rather than padding your reputation with reviews you post on your own site.",
          ],
        },
        {
          heading: "Structured data: MovingCompany and areaServed",
          paragraphs: [
            "schema.org has a type for movers, [MovingCompany](" + SRC.movingCompany + "), one of the home and construction business types (HomeAndConstructionBusiness) under LocalBusiness. The area you cover goes in [areaServed](" + SRC.areaServed + "), where prefectures or cities can be listed as AdministrativeArea. A free in-home estimate can be a Service with an Offer of 0.",
            "With Nurevo AEO set to MovingCompany, the in-home estimate entered as a service and the area added with the filter below, the output looks like this (values are examples):",
          ],
          code: SCHEMA_EN,
          after: [
            "Keep structured data identical to the page text. An Offer holds a single amount, so keep plan prices in the worked examples on your page and put only fixed amounts, such as the free estimate, in structured data.",
          ],
        },
        {
          heading: "Setting it up on a WordPress moving site",
          list: [
            "Install and activate Nurevo AEO (free) from [WordPress.org](" + WP_ORG + "). Yoast SEO, Rank Math, All in One SEO and Slim SEO keep working. From 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "In the setup wizard choose \"Other\", then enter MovingCompany in Settings > \"Business type (schema.org type)\". Do not choose \"Professional services\", which sets ProfessionalService.",
            "Check the company name, address, phone number, hours and description. In the description, briefly state your area, the kinds of move you take (single person, family, office) and how estimates work.",
            "Add services one by one (up to 20): in-home estimate (0 and its duration), online estimate, your main plans and extras such as air conditioners. Name, duration in minutes, price including tax with currency, category, booking URL and description are published as a Service, an Offer and a booking action (ReserveAction), and each gets a line in llms.txt. For plans whose price depends on conditions, leave the price empty and write the conditions in the description.",
            "Add your service area as areaServed with the developer filter webmcp_canary_business_node (code below; in a child theme's functions.php or a code snippets plugin). With an SEO plugin active, the property is merged into that plugin's business node, and values the plugin already sets win.",
            "Enter the questions people ask (estimate cost and method, cancellation and postponement fees, claims, extra charges on the day, payment methods, moves outside your area) as FAQ and place the Nurevo FAQ block (or the [nurevo_faq] shortcode). Questions only for your prices page can be set as that page's own FAQ in the Nurevo AEO panel of the block editor.",
            "Open /llms.txt and check that your prices, estimates, area, claims and company pages are listed. Pages for finished campaigns can be left out of llms.txt in the Nurevo AEO panel. Run the diagnosis on the AEO score screen and apply the one-click fixes.",
          ],
          code: PHP_EN,
          after: [
            "On a site that is not WordPress, check the same things: enter your URL in the [free check](/check), no sign-up needed, to see the state of your structured data, llms.txt and AI crawler access. For working alongside SEO plugins, see [adding business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Keeping comparison and quote sites consistent",
          paragraphs: [
            "AI reads quote-comparison sites, comparison articles and your Google Business Profile as well as your own site. If your name, address, phone, area or hours differ from place to place, the AI cannot tell which is right. Keep a list of where you are listed and bring each one in line with your site once or twice a year.",
            "Prices and campaigns can differ between listing sites. Saying on your own site that \"the written estimate is the reference price\" and that \"campaigns on listing sites follow each site's conditions\" reduces the chance of an AI repeating an expired discount.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "For each estimate method (in-home, online, phone): no fee, how long it takes, and that a written estimate is given.",
            "Your prices page has two or three worked examples with every condition, tax included and dated.",
            "The cancellation and postponement fee bands (moving day, day before, two days before) and when cancelling becomes free are written in text on the prices page and in the FAQ.",
            "The claim deadline and contact, and items to declare in advance, are stated.",
            "Your area is written as prefecture and city names and matches areaServed in your structured data.",
            "The business type is MovingCompany, and your name, address, phone and hours match across your site, structured data, Google Business Profile and listing sites.",
            "Any certification is written out with its name, granting body and validity period (and nothing you do not hold).",
            "No claims you cannot back up, such as \"cheapest in the industry\" or \"guaranteed\".",
            "llms.txt lists your prices, estimates, area, claims and company pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the pages are in order, write 5–10 questions a prospective customer might ask, combining area, timing, household size and worries (cancellation fees, claims, estimates). Ask them in ChatGPT and Perplexity and record whether your company appears by name or URL, whether prices and cancellation fees are described correctly, and whether the source cited is your site or a quote site. AI answers change between runs, so repeat the same questions over time and keep the records before and after the month you changed your prices page apart. [How to measure AI visibility](/guide/measure-ai-visibility/)",
            "On the Free and Standard plans, Nurevo AEO puts three questions built from your business type and area (never your company name) to Perplexity once a month and records whether your name or site appears. On Pro ($99/month and up), the beta AI visibility measurement shows how often you appear, with competitor comparison and trend (currently measured on Perplexity). Both look at a sample of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a moving company start with AI search?", a: "Put worked price examples with their conditions on your prices page, write your cancellation and postponement fees and the claim deadline in text, and list your service area by city name. Then publish structured data with the MovingCompany type and make your Google Business Profile and listing sites match." },
        { q: "Won't publishing prices put us at a disadvantage?", a: "Publishing worked examples with conditions, rather than a single price, avoids the impression that a quote will match exactly. Without any figures, AI may answer with numbers from comparison sites or generic articles. Always add the conditions and the month each example was written." },
        { q: "How should we write cancellation fees?", a: "Under Japan's standard moving terms in force from 1 June 2018, the caps are 50% of the fare and charges on moving day, 30% the day before and 20% two days before. Write the values in the terms you use, and when cancelling becomes free, in text on your prices page and FAQ." },
        { q: "Do estimates have to be done in person?", a: "It is not a rule, but a Hyogo Prefecture consumer leaflet advises people to have the mover inspect rather than rely on a phone or online quote alone. Explaining what each method (in-home, online, phone) can assess and how the written estimate is given helps AI explain the difference." },
        { q: "Which structured data type should a mover use?", a: "schema.org MovingCompany. The service area goes in areaServed and a free estimate can be a Service with an Offer of 0. Keep the values identical to the page text." },
        { q: "Can I use Nurevo AEO for free?", a: "Yes. Structured data for your contact details, hours, services and FAQ, llms.txt, AI crawler rules and the AEO score are on the free plan. Paid plans add the always-current ruleset (Standard, $20/month) and the beta AI visibility measurement (Pro, $99/month and up). [Nurevo AEO on WordPress.org](" + WP_ORG + ")" },
        { q: "Will this guarantee ChatGPT recommends us?", a: "No. AI answers vary, and no tool or method can guarantee appearance or ranking. What you can do is make sure AI reads your facts correctly and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your site",
        body: "The free check, no sign-up needed, shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. The Hikkoshi Anshin Mark is a certification scheme of the Japan Trucking Association. Nurevo is not affiliated with them, or with any company or organisation mentioned in this guide. This is not legal advice.",
    },
  },
};
