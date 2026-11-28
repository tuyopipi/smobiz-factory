// Content page: AI search (AEO) for restaurants and cafés (飲食店). Industry page.
// Angle: the facts a diner asks AI about before choosing a restaurant - the menu as
// page text (not only PDF or photos), tax-inclusive prices and takeout/eat-in, seat or
// service charges, allergen information (what is and is not required for restaurants,
// how to write it so a sentence lifted by AI stays safe), origin and wording rules
// (rice origin, 景品表示法 menu wording), vegetarian/vegan/halal, and the split between
// the own site, Google Business Profile, gourmet/booking sites and the new
// "Businesses in ChatGPT" (beta). Separate from booking-page-ai-search (reservation
// pages), business-hours-holidays-ai-search (hours), fix-business-listings-ai-search
// (fixing listings) and multi-location-business-ai-search (chains).
//
// Written 2026-11-28 8時 (JST). Nurevo AEO facts from the plugin source (0.9.2): setup
// wizard card 飲食店・カフェ / "Restaurant or café" sets Restaurant (family
// CafeOrCoffeeShop, Bakery, BarOrPub); the business node carries name, url,
// description, address, telephone, openingHours, email, logo; servesCuisine,
// priceRange, hasMenu, acceptsReservations are not fields, so they go through the
// webmcp_canary_business_node filter; Services up to 20 (WEBMCP_CANARY_MAX_SERVICES);
// FAQPage only on a page that shows the Nurevo FAQ block or [nurevo_faq]. Free monthly
// check: three questions to Perplexity built from type and area, never the name. Pro
// measurement (beta) on Perplexity. Prices: Free 0, Standard 3,000 JPY / USD 20, Pro
// from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-28):
// - 消費者庁 食物アレルギー表示ハンドブック (R5-03, R6-03 一部改訂): 義務は容器包装された
//   加工食品・添加物; 対象外: 容器包装に入れずに販売する食品, 設備を設けて飲食させる食品
//   (飲食店で提供される食品、出前など); 飲食店でも容器包装に入れた食品を販売する場合は表示が必要.
// - 消費者庁 改正概要 (R8-04-01): カシューナッツが特定原材料に移行, 令和8年4月1日施行.
//   事務連絡 (R8-04-01): ピスタチオを準ずるものに追加, 2年間の経過措置.
//   厚労省 協議会資料 (R8-05-27, 消費者庁): 義務9品目・推奨20品目.
//   仙台市 (2026-05-14 更新, secondary): カシューナッツの経過措置は令和10年3月31日まで.
// - 外食・中食におけるアレルゲン情報の提供に向けた手引き (検討会, H29-06-30, 改訂 2019-09-19,
//   2023-03-09; JF site): コンタミネーションのリスクを示す, 正確に把握できない場合は安易に
//   提供しない, 最新に保つ.
// - 消費者庁 外食等におけるアレルゲン情報の提供の在り方検討会 中間報告 (H26-12-03): 正確性が
//   大前提, 分からない場合は店舗責任者に, 来店前に見られるウェブでの事前の情報提供が望ましい.
// - 消費者庁 景表法 ガイドライン一覧 (メニュー・料理等の食品表示に係る景品表示法上の考え方;
//   PDF body NOT read). 高知県掲載の消費者庁スライド (H26-07): バナメイエビを「シバエビ」と
//   表示すると問題 (Q-11).
// - 農水省 米トレーサビリティ法の概要: 外食店等では米飯類のみ産地情報の伝達が必要 (2011-07-01).
//   群馬県資料: メニューへの記載・店内掲示・問い合わせへの回答・ウェブや電話の照会先.
// - 財務省 総額表示の考え方 (R3-01-07): 2021-04-01 以降 税込価格, 表示媒体を問わない;
//   政府広報: メニュー表やウェブショップも含む. 財務省 軽減税率と価格表示 (2018-05): 店内と
//   持ち帰りの表示の3つの方法.
// - 観光庁 飲食事業者等におけるベジタリアン・ヴィーガン対応ガイド (R2-04): 約32%が食材が
//   メニューに明記されていないと入店しない; 口頭で説明できること・メニューに記載が第一歩 (p.18).
// - 訪日ラボ (mov) 2026-10-01: AIを日常的に使い飲食店選びにも使ったことがある483人, AIが
//   提案した店への来店率60%, 8割超が情報が不十分な店を候補から外した経験. 2026-09-17 (n=360):
//   約70%が情報が古い・不足で候補から外した経験.
// - DoorDash 2026-05-18: 22% used AI like ChatGPT/Gemini to help choose a restaurant (3,001 US).
//   Reputation/Nielsen 2025-10-21: 20% (763 US). NIQ/Zonal 2026-10-08 (5,000+ GB): 19%; of
//   those using AI, 38% view menus, 43% prices, 35% opening times.
// - Uberall QSR GEO playbook (no date): 83% of locations absent from AI recommendations, 17%
//   appear in a ChatGPT recommendation (Uberall's own study).
// - Google Search Central local business (updated 2026-09): servesCuisine, menu, priceRange
//   recommended; acceptsReservations not listed. GBP help 9455840: menu editor (sections,
//   items, prices; 24-48 hours), menu photos incl. PDF, menu link, Google may transcribe the
//   menu from the website.
// - schema.org (V30): hasMenu supersedes menu; acceptsReservations Boolean or URL; MenuItem
//   suitableForDiet (RestrictedDiet: 11 values); no allergen property in the vocabulary.
// - OpenAI 2026-11-10 (upd 11-19) Businesses in ChatGPT (beta), Business Hub; help 20001635:
//   local stores and restaurants can only claim an existing US listing; editable website,
//   description, category, logo, delivery/return policy; no guarantee of visibility.
// - en only: FDA FASTER Act (9 major allergens, sesame 2023-01-01); Food Code 2022 3-602.12(C)
//   written notification for unpackaged food, model code only where adopted; FDA menu
//   labeling (chains 20+, 2018-05-07), 21 CFR 101.11 includes "menus on the Internet" (2019
//   CFR read); UK technical guidance (upd 2026-11-03): 14 allergens, verbal with signposting,
//   PPDS 2021-10-01, distance selling; FSA best practice (2025-02-24): written + conversation,
//   online one click away, not law.
// Top articles read 2026-11-28: uravation cafe (2026-10-09), uravation chain (07-26, upd
// 09-05), uravation local (07-18), 0120.co.jp aio-92 (05-25, upd 10-22), GMO koukoku 業種別
// (09-28, upd 11-27), assist-all (01-31, upd 07-13), FindSkill (07-08); Owner (10-22),
// ChowNow (07-20, upd 09-18), Malou x2 (05-26, 09-22), Yext (06-18), Uberall, Bloom
// (07-02, upd 10-05), Modern Restaurant Management (03-13), NRN (11-12). MediaPost failed.
// Not verified, so not stated: the body of the 景表法 menu guideline (beyond the one
// slide), MAFF's own wording on how to convey rice origin, the national 経過措置 date in a
// 消費者庁 document, Muslim guide details, which data providers feed ChatGPT's local
// results, whether ChatGPT business profiles show menus, and the live eCFR text.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  caaHandbook: "https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/assets/food_labeling_cms204_210514_01.pdf",
  caaReform: "https://www.caa.go.jp/policies/policy/food_labeling/food_labeling_act/assets/food_labeling_cms201_260401_06.pdf",
  caaPistachio: "https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/assets/food_labeling_cms204_260401_03.pdf",
  mhlwAllergy: "https://www.mhlw.go.jp/content/10905000/001704059.pdf",
  sendai: "https://www.city.sendai.jp/sekatsuese-shokuhin/cashew-pistachio.html",
  jfGuide: encodeURI("https://www.jfnet.or.jp/wp/wp-content/uploads/2025/08/【食の安全・安心関連アレルゲン】外食・中食におけるアレルゲン情報の提供に向けた手引き.pdf"),
  caaInterim: "https://www.cao.go.jp/consumer/history/05/kabusoshiki/syokuhinhyouji/doc/190426_sankou3.pdf",
  caaEfforts: "https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/efforts",
  caaKeihyo: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/guideline/",
  kochiSlide: "https://www.pref.kochi.lg.jp/doc/2014080800328/file_contents/siryou4.pdf",
  maffRice: "https://www.maff.go.jp/j/syouan/keikaku/kome_toresa/",
  gunmaRice: "https://www.pref.gunma.jp/uploaded/attachment/1508.pdf",
  mofSougaku: "https://www.mof.go.jp/tax_policy/summary/consumption/210107guideline_sougaku.pdf",
  govOnline: "https://www.gov-online.go.jp/article/202104/entry-10238.html",
  mofKeigen: "https://www.mof.go.jp/tax_policy/summary/consumption/20180518kakaku_3.pdf",
  mlitVeg: "https://www.mlit.go.jp/kankocho/content/810003294.pdf",
  mlitMuslim: "https://www.mlit.go.jp/kankocho/seisaku_seido/kihonkeikaku/inbound_kaifuku/ukeire/kankochi/shukyo/tayo.html",
  honichiAi: "https://honichi.com/reports/202610_survey_gourmet_ai/",
  honichiSearch: "https://honichi.com/reports/202609_survey_gourmet_search/",
  doordash: "https://about.doordash.com/en-us/news/doordash-restaurant-industry-trends-report-2026",
  reputation: "https://reputation.com/press-room/new-reputation-survey-reveals-how-ai-and-economic-pressures-are-rewriting-the-rules-of-dining-out-in-america/",
  niq: "https://nielseniq.com/global/en/insights/report/2026/nearly-a-fifth-of-consumers-use-ai-tools-to-plan-a-visit-to-a-pub-bar-or-restaurant/",
  uberall: "https://uberall.com/en-us/qsr-geo-playbook-2026",
  googleLb: "https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=ja",
  googleLbEn: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  gbpMenu: "https://support.google.com/business/answer/9455840?hl=ja",
  gbpMenuEn: "https://support.google.com/business/answer/9455840?hl=en",
  schemaMenuItem: "https://schema.org/MenuItem",
  schemaRestaurant: "https://schema.org/Restaurant",
  schemaRestrictedDiet: "https://schema.org/RestrictedDiet",
  openaiBiz: "https://openai.com/index/introducing-businesses-chatgpt/",
  openaiHelp: "https://help.openai.com/en/articles/20001635-setting-up-your-business-on-chatgpt",
  fdaSesame: "https://www.fda.gov/food/food-allergies/faster-act-sesame-ninth-major-food-allergen",
  fdaFoodCode: "https://www.fda.gov/food/retail-food-industryregulatory-assistance-training/addition-2022-food-code-sesame-added-major-food-allergen",
  fdaMenu: "https://www.fda.gov/food/food-labeling-nutrition/menu-labeling-requirements",
  cfr10111: "https://www.govinfo.gov/content/pkg/CFR-2019-title21-vol2/pdf/CFR-2019-title21-vol2-sec101-11.pdf",
  ukTech: "https://www.gov.uk/government/publications/food-allergen-labelling-and-information-requirements-technical-guidance/food-allergen-labelling-and-information-requirements-technical-guidance",
  ukBest: "https://www.gov.uk/government/publications/allergen-information-for-non-prepacked-foods-best-practice/allergen-information-for-non-prepacked-foods-best-practice",
  uravationCafe: "https://uravation.com/llmo/cafe-kojin-inshokuten-llmo-taisaku/",
  uravationChain: "https://uravation.com/llmo/inshoku-chain-llmo-taisaku/",
  aio92: "https://0120.co.jp/blog/aio-92/",
  koukoku: "https://www.koukoku.jp/service/suketto/marketer/aio/%e6%a5%ad%e7%a8%ae%e5%88%a5aio%e5%af%be%e7%ad%96%ef%bc%9a%e9%a3%b2%e9%a3%9f%e3%83%bb%e7%be%8e%e5%ae%b9%e3%83%bb%e6%95%b4%e4%bd%93%e3%83%bb%e5%a3%ab%e6%a5%ad%e3%81%aeai%e6%8e%a8%e8%96%a6faq%e8%a8%ad/",
  findskill: "https://findskill.ai/ja/blog/ai-inshokuten-shukyaku-2026/",
  owner: "https://www.owner.com/blog/the-ultimate-guide-to-chatgpt-for-restaurants-how-to-get-recommended-in-ai-search",
  chownow: "https://get.chownow.com/blog/how-to-get-your-restaurant-found-in-ai-search/",
  yext: "https://www.yext.com/knowledge-center/how-restaurants-use-menus-to-win-citations-near-me-searches",
  bloom: "https://bloomintelligence.com/blog/ai-restaurant-discovery/",
  malouSchema: "https://www.malou.io/en-us/blog/structured-data-for-restaurants",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": "https://example.jp/#organization",
      "name": "例食堂（例）",
      "description": "◯◯駅から徒歩3分の定食と季節の魚料理の店です。昼は定食、夜は一品料理とコースです。",
      "url": "https://example.jp/",
      "telephone": "+81-00-0000-0000",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "◯◯県",
        "addressLocality": "◯◯市",
        "streetAddress": "◯◯町1-2-3"
      },
      "openingHours": ["Tu-Su 11:30-14:00", "Tu-Sa 17:30-22:00"],
      "servesCuisine": ["和食", "定食", "魚料理"],
      "priceRange": "昼 1,000〜1,800円・夜 4,000〜6,000円（税込）",
      "menu": "https://example.jp/menu/",
      "hasMenu": { "@id": "https://example.jp/menu/#menu" },
      "acceptsReservations": "https://example.jp/reserve/"
    },
    {
      "@type": "Menu",
      "@id": "https://example.jp/menu/#menu",
      "name": "昼のメニュー",
      "hasMenuSection": {
        "@type": "MenuSection",
        "name": "定食",
        "hasMenuItem": [
          {
            "@type": "MenuItem",
            "name": "さばの塩焼き定食",
            "description": "さばの塩焼き、ご飯（国産米）、みそ汁、小鉢2品。",
            "offers": { "@type": "Offer", "price": "1200", "priceCurrency": "JPY" }
          },
          {
            "@type": "MenuItem",
            "name": "野菜の煮物定食",
            "description": "肉・魚・だしに動物性の材料を使わない定食です。",
            "suitableForDiet": "https://schema.org/VeganDiet",
            "offers": { "@type": "Offer", "price": "1100", "priceCurrency": "JPY" }
          }
        ]
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": "https://example.com/#organization",
      "name": "Example Kitchen (example)",
      "description": "Neighbourhood bistro three minutes from Example Station. Lunch set menus, dinner à la carte and a tasting menu.",
      "url": "https://example.com/",
      "telephone": "+1-000-000-0000",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "CA",
        "addressLocality": "Example City",
        "streetAddress": "123 Example St"
      },
      "openingHours": ["Tu-Su 11:30-14:00", "Tu-Sa 17:30-22:00"],
      "servesCuisine": ["French", "Seafood"],
      "priceRange": "$$",
      "menu": "https://example.com/menu/",
      "hasMenu": { "@id": "https://example.com/menu/#menu" },
      "acceptsReservations": "https://example.com/reserve/"
    },
    {
      "@type": "Menu",
      "@id": "https://example.com/menu/#menu",
      "name": "Lunch menu",
      "hasMenuSection": {
        "@type": "MenuSection",
        "name": "Mains",
        "hasMenuItem": [
          {
            "@type": "MenuItem",
            "name": "Grilled mackerel",
            "description": "Grilled mackerel, potatoes, green salad.",
            "offers": { "@type": "Offer", "price": "18.00", "priceCurrency": "USD" }
          },
          {
            "@type": "MenuItem",
            "name": "Roasted vegetable plate",
            "description": "No meat, fish, dairy or eggs, including the stock.",
            "suitableForDiet": "https://schema.org/VeganDiet",
            "offers": { "@type": "Offer", "price": "15.00", "priceCurrency": "USD" }
          }
        ]
      }
    }
  ]
}`;

const PHP_JA = `// 料理のジャンル・価格帯・メニューと予約のURLを事業者のノードに足す（値は本文と同じにする）
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['servesCuisine'] = array('和食', '定食', '魚料理');
    $node['priceRange'] = '昼 1,000〜1,800円・夜 4,000〜6,000円（税込）';
    $node['menu'] = 'https://example.jp/menu/';
    $node['hasMenu'] = 'https://example.jp/menu/';
    $node['acceptsReservations'] = 'https://example.jp/reserve/';
    return $node;
}, 10, 2);`;

const PHP_EN = `// Add cuisine, price range, menu and booking URLs to the business node (same values as the page text)
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['servesCuisine'] = array('French', 'Seafood');
    $node['priceRange'] = '$$';
    $node['menu'] = 'https://example.com/menu/';
    $node['hasMenu'] = 'https://example.com/menu/';
    $node['acceptsReservations'] = 'https://example.com/reserve/';
    return $node;
}, 10, 2);`;

export default {
  slug: "restaurant-ai-search",
  targetQueries: [
    "飲食店 AI検索対策",
    "飲食店 ChatGPT 集客 メニュー",
    "飲食店 LLMO アレルギー表示 構造化データ",
    "restaurant AI search optimization",
    "how to get my restaurant recommended by ChatGPT",
    "restaurant menu schema markup allergens",
  ],
  related: ["booking-page-ai-search", "business-hours-holidays-ai-search", "fix-business-listings-ai-search", "multi-location-business-ai-search", "multilingual-site-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "飲食店のAI検索対策：メニュー・価格・アレルギーの書き方 | Nurevo",
      description: "飲食店のAI検索対策。メニューを文字で書く、税込の価格と席料、アレルギー情報の範囲と書き方、産地やヴィーガン対応、ChatGPTのビジネス掲載とGoogleの役割分担を、構造化データとWordPressの手順で。",
      h1: "飲食店のAI検索対策：メニュー・価格・アレルギー情報をAIに正しく読ませる手順",
      lead: "飲食店のAI検索対策（AEO）で一番大事なのは、お客様が店を決める前にAIに聞く「何が食べられるか・いくらか・自分が食べられるか」に、AIが答えられる事実を自分のサイトに文字で書くことです。具体的には、メニューをPDFや写真だけにせずページの文字で書くこと、税込の価格と席料・サービス料、アレルギー情報の範囲と更新日、ヴィーガン・ハラールなどの対応の中身です。そのうえで、Googleビジネスプロフィール・グルメサイト・ChatGPTのビジネス掲載に同じ事実をそろえ、構造化データ（Restaurant と Menu）で補います。",
      intro: [
        "作成日：2026年11月28日（JST）。消費者庁・農林水産省・財務省・観光庁などの資料は、本文に記したリンク先で2026年11月28日に確認しました。この記事は法的な助言ではありません。表示の判断は、保健所や消費者庁の窓口、必要に応じて専門家に確かめてください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがあなたの店の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "飲食店でAIに聞かれること",
          paragraphs: [
            "店を探す人がAIに聞くのは「◯◯駅 ランチ」だけではありません。「子連れで入れる？」「えびのアレルギーがあるけど食べられるものはある？」「ヴィーガンのメニューは？」「夜は一人いくらくらい？」のように、条件をつけて聞きます。AIがこうした質問に答えるには、その答えがどこかに文字で書かれている必要があります。",
          ],
          table: {
            head: ["質問の型", "質問の例", "AIが答えに必要な事実"],
            rows: [
              ["料理と店の種類", "「◯◯駅の近くで魚の定食が食べられる店は？」", "料理のジャンル、看板の料理、昼と夜の違い"],
              ["メニューと価格", "「夜はコースだけ？一人いくら？」", "ページの文字で書いたメニュー、税込の価格、席料・サービス料・お通し"],
              ["食べられるか", "「小麦のアレルギーでも食べられるものは？」「ヴィーガン対応？」", "アレルゲンの一覧、対応の範囲、コンタミネーションの説明、確認の方法"],
              ["使い方", "「一人でも入りやすい？」「個室はある？」「子連れは？」", "席の種類と数、個室、子ども用の椅子、ベビーカー、喫煙"],
              ["予約と待ち時間", "「予約できる？当日でも大丈夫？」", "予約の方法と受付の期限、予約なしで入れるか"],
              ["持ち帰り・配達", "「テイクアウトできる？」", "持ち帰りのメニューと価格、受け取り方、配達サービス"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
          after: [
            "営業時間・定休日の書き方は[営業時間・定休日のAI検索対策](/guide/business-hours-holidays-ai-search)、予約ページは[予約ページのAI検索対策](/guide/booking-page-ai-search)にくわしく書きました。この記事は、飲食店ならではのメニュー・価格・食べられるかの情報に絞ります。",
          ],
        },
        {
          heading: "数字で見る：AIで店を選ぶ人と、情報が足りずに外される店",
          paragraphs: [
            "AIで飲食店を探す人がどのくらいいるかは、国や調べ方で数字が違います。発行元のページで確かめられた数字だけを並べます。",
          ],
          table: {
            head: ["調査（発行元・公開日）", "対象", "数字"],
            rows: [
              [`[訪日ラボ（2026年10月1日）](${SRC.honichiAi})`, "AIを日常的に使い、飲食店選びにも使ったことがある483人（日本）", "AIが提案した店に行った割合が60%。8割超が、情報が足りない店を候補から外したことがある"],
              [`[訪日ラボ（2026年9月17日）](${SRC.honichiSearch})`, "AIを飲食店探しに使ったことがない360人（日本）", "約70%が、情報が古い・足りないことを理由に店を候補から外したことがある"],
              [`[DoorDash（2026年5月18日）](${SRC.doordash})`, "米国の消費者3,001人", "22%が、ChatGPTやGeminiなどのAIを店選びに使ったことがある"],
              [`[NIQ・Zonal（2026年10月8日）](${SRC.niq})`, "英国の消費者5,000人超", "19%がパブ・バー・飲食店に行く計画にAIを使っている。そのうち38%がメニュー、43%が価格、35%が営業時間を見ている"],
              [`[Uberall（日付なし）](${SRC.uberall})`, "同社の調査（店舗数は記載なし）", "飲食店の店舗の83%がAIのおすすめに出てこず、ChatGPTのおすすめに出たのは17%"],
            ],
            caption: "訪日ラボの調査は無料で読める要約による数字です。Uberall の数字は同社が自社の調査として示したものです。",
          },
          after: [
            "どの調査も、AIが店をどう選んでいるかを示すものではありません。ただ、「メニュー・価格・営業時間を見ている」「情報が足りない店は外される」という点は国をまたいで共通しています。AIに選ばれる以前に、AIが答えに使える事実がサイトにあるかどうかが出発点です。",
          ],
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            `2026年11月28日に、日本語と英語で「飲食店 AI検索対策」「restaurant AI search」などの上位記事を16本読みました。日本語では、[uravationのカフェ・個人店の記事](${SRC.uravationCafe})（2026年10月9日）が「静か」「作業向き」のような言葉を事実に置きかえる考え方をくわしく書き、[同じサイトの飲食チェーンの記事](${SRC.uravationChain})（2026年7月26日、9月5日更新）は、アレルギー表示の制度と季節メニューの期限に触れています。[0120.co.jpの記事](${SRC.aio92})（2026年5月25日、10月22日更新）は、Restaurant 型の構造化データのコード例を載せている数少ない記事です。ただし、どの記事にもWordPressでの手順はなく、メニューの品目を構造化データ（Menu）で書く例もありません。税込表示や店内・持ち帰りの価格、米の産地の伝え方、メニューの言葉の決まり（景品表示法）を扱った記事はありませんでした。[FindSkillの記事](${SRC.findskill})（2026年7月8日）は、AIごとの「星の評価の目安」を出典を示さずに書いています。`,
            `英語では、[Owner](${SRC.owner})（2026年10月22日）がPDFより文字のメニューを強く勧め、ログアウトした状態でChatGPTに聞いて確かめる方法を書いています。[Yext](${SRC.yext})（2026年6月18日）はメニューのデータの項目を並べ、[Bloom Intelligence](${SRC.bloom})（2026年10月5日更新）は場所ごとに質問を決めて測る手順がくわしい一方、どれも構造化データのコード例はありません。[Malouの構造化データの記事](${SRC.malouSchema})（2026年9月22日更新）も、読めた本文にはコード例がありませんでした。英語でも日本語でも、アレルギー情報を「AIに一文だけ抜き出されても安全な書き方」で扱った記事はなく、2026年11月に始まった ChatGPT のビジネス掲載に触れた解説記事もありませんでした。この記事は、これらを埋めます。`,
          ],
        },
        {
          heading: "メニューは、PDFや写真だけにせず、ページの文字で書く",
          paragraphs: [
            "メニューを写真やPDFだけで載せると、AIはその中身を読み取れないか、読み違えることがあります。メニューのページは、料理の名前・短い説明・税込の価格を、ページの文字（HTML）で書きます。写真やPDFは、文字のメニューに添えるものにします。",
          ],
          list: [
            "料理の名前は、店内のメニューと同じ名前にします。あわせて、何の料理かがわかる短い説明（主な食材、量、辛さなど）を一行添えます。「シェフの気まぐれ」のような名前だけでは、AIは何の料理か答えられません。",
            "昼・夜・コース・飲み物・持ち帰りのように見出しで分けます。昼だけの料理、平日だけの料理は、見出しかその行に書きます。",
            "季節や数量限定の料理は、提供する期間を書き、終わったら消します。終わった料理が残っていると、AIは今も食べられると答えます。",
            "メニューのページに更新日を書きます。価格を変えた日に、サイト・Googleビジネスプロフィール・グルメサイトのメニューを同じ日に直します。",
            "外国のお客様が多い店は、英語などのメニューも文字で用意します。書き方は[多言語サイトのAI検索対策](/guide/multilingual-site-ai-search)をご覧ください。",
          ],
          after: [
            `Googleビジネスプロフィールでは、飲食店はメニューエディタでセクション・料理・説明・価格を入力でき、変更が反映されるまで24〜48時間かかる場合があるとされています。メニューの写真（PDFも可）やメニューのリンクも登録でき、Googleがお店のウェブサイトからメニューを読み取って表示することもあり、オーナーは表示するメニューを選べます。[Googleビジネスプロフィール ヘルプ：メニューエディタについて](${SRC.gbpMenu}) サイトの文字のメニューを正しくしておくことは、Googleに読み取られるメニューを正しくすることにもなります。`,
          ],
        },
        {
          heading: "価格：税込の総額、店内と持ち帰り、席料やサービス料",
          paragraphs: [
            `2021年4月1日からは、消費者に価格を示すときは税込の価格を表示することが必要で、表示する媒体を問わないとされています（[財務省：価格表示に関する消費税法の考え方](${SRC.mofSougaku})）。政府広報は、対象に「メニュー表やウェブショップなども含まれます」と説明しています（[政府広報オンライン](${SRC.govOnline})）。サイトのメニューも税込の価格で書きます。`,
            `店内で食べる場合と持ち帰りで税率が違うときの価格の表示について、財務省は、両方の税込価格を書く、片方の税込価格を書いて「店内でお召し上がりの場合は価格が異なります」のように掲示する、両方を同じ税込価格にする、という方法を示しています（[財務省：軽減税率制度の実施に伴う価格表示について](${SRC.mofKeigen})）。サイトにも、店で採っている方法と同じ書き方をします。`,
          ],
          list: [
            "AIは一文だけを抜き出して答えることがあります。「ランチ1,000円〜」と書いて条件をページの下に置くと、条件が落ちるかもしれません。「ランチの定食は1,000〜1,800円（税込）です」のように、税込であることを金額と同じ文に書きます。",
            "席料・チャージ・お通し・サービス料・個室料がある場合は、金額と、どんなときにかかるかを書きます。夜だけ、コースだけ、のような条件も書きます。",
            "コースは、品数・飲み放題の有無と時間・最少の人数・予約の期限を価格と一緒に書きます。",
            "「一人あたりの目安」を書くなら、何を含めた目安か（飲み物を含むか）を同じ文に書きます。",
          ],
        },
        {
          heading: "アレルギー情報：飲食店の表示の決まりと、書き方",
          paragraphs: [
            `食品表示法のアレルギー表示が義務になるのは、容器包装に入れられた加工食品などです。消費者庁のハンドブックは、飲食店で提供される食品や出前のように、設備を設けて飲食させる食品は対象外としています。ただし、飲食店でも容器包装に入れた食品を売る場合（持ち帰りのお弁当、瓶詰めなど）は表示が必要です。[消費者庁：食物アレルギー表示ハンドブック](${SRC.caaHandbook})`,
            `表示の義務がある「特定原材料」は、2026年4月1日に施行された改正でカシューナッツが加わり、えび・かに・くるみ・小麦・そば・卵・乳・落花生・カシューナッツの9品目になりました。ピスタチオは表示が勧められる「特定原材料に準ずるもの」に加わり、こちらは20品目です。[消費者庁：改正の概要（2026年4月1日）](${SRC.caaReform})／[消費者庁：事務連絡（2026年4月1日）](${SRC.caaPistachio})／[消費者庁の説明資料（2026年5月27日、9品目・20品目）](${SRC.mhlwAllergy}) カシューナッツの経過措置は、仙台市の説明では2028年3月31日までです（[仙台市](${SRC.sendai})）。`,
            `飲食店の表示は任意ですが、伝え方の指針があります。外食・中食の業界団体などがまとめた手引きは、コンタミネーション（調理の過程で混ざる可能性）のリスクを示すこと、正確な情報を把握できない場合は安易に情報を出さないこと、情報を最新に保つことを求めています（[外食・中食におけるアレルゲン情報の提供に向けた手引き（2023年3月9日改訂）](${SRC.jfGuide})）。消費者庁の検討会の中間報告は、情報の正確さが大前提であることと、来店前に見られるウェブでの情報提供が望ましいことを挙げています（[中間報告（2014年12月3日）](${SRC.caaInterim})）。消費者庁は、事業者向けの動画やパンフレットも公開しています（[消費者庁：取組](${SRC.caaEfforts})）。`,
          ],
          table: {
            head: ["書くこと", "書き方の例"],
            rows: [
              ["どこまで対応しているか", "「特定原材料9品目について、料理ごとの使用の有無を一覧にしています。それ以外の食材はスタッフにお尋ねください」"],
              ["一覧の形", "料理を行、アレルゲンを列にした表を、ページの文字で書く（画像だけにしない）"],
              ["コンタミネーション", "「同じ厨房・同じ油で、えび・小麦などを使う料理も調理しています。完全に取り除くことはできません」"],
              ["確かめ方", "「ご予約のときに、食べられない食材をお知らせください。当日の確認は店長がお答えします」"],
              ["更新日", "「2026年◯月◯日時点の食材です。仕入れ先を変えた日に見直します」"],
            ],
            caption: "書き方は例です。実際の厨房と食材の扱いに合わせて書いてください。正確に把握できないことは書きません。",
          },
          after: [
            "AIに答えを抜き出されたときに危ないのは、「えび不使用」の一文だけが残り、「同じ厨房でえびを扱っています」の注記が落ちることです。注意は料理の行やページの最初にも書き、「不使用」と「対応できる」を分けて書きます。「アレルギー対応」のような広い言葉だけを、Googleビジネスプロフィールの説明やよくある質問に書くのはやめておきます。",
          ],
        },
        {
          heading: "産地や「手打ち」「自家製」などの書き方",
          paragraphs: [
            `米トレーサビリティ法では、外食店などは、米飯類について米の産地の情報を伝えることが必要です（2011年7月1日施行）。[農林水産省：米トレーサビリティ法の概要](${SRC.maffRice}) 伝え方は、メニューに書く、店内に掲示する、「店員にお尋ねください」と掲示して問い合わせに答える、ウェブサイトや電話の問い合わせ先を書く、などの方法が自治体の資料で紹介されています（[群馬県の資料](${SRC.gunmaRice})）。サイトのメニューに「ご飯（国産米）」のように書くと、AIの答えにも同じ事実が使われます。`,
            `メニューの言葉には景品表示法の考え方もあります。消費者庁は「メニュー・料理等の食品表示に係る景品表示法上の考え方について」を公表しています（[消費者庁：景品表示法のガイドライン一覧](${SRC.caaKeihyo})）。消費者庁の説明資料には、たとえばバナメイエビを「シバエビ」と表示すると問題になる例があります（[高知県が掲載した消費者庁の資料（2014年7月）](${SRC.kochiSlide})）。「手打ち」「自家製」「朝獲れ」「国産」のような言葉は、実際にそうであるものにだけ使います。AIは、その言葉をそのまま店の特徴として答えるからです。`,
          ],
        },
        {
          heading: "ベジタリアン・ヴィーガン・ハラールなどの対応",
          paragraphs: [
            `観光庁の「飲食事業者等におけるベジタリアン・ヴィーガン対応ガイド」（2020年4月）は、調査で約32%が「使用する食材がメニューに明記されていないと入店しない」と答えたことを紹介し、口頭で説明できることやメニューに対応できると書くことを第一歩としています。[観光庁：ベジタリアン・ヴィーガン対応ガイド](${SRC.mlitVeg}) ムスリムのお客様の受け入れについても、観光庁がガイドブックを公開しています（[観光庁：多様な食文化・食習慣を有する外国人客への対応](${SRC.mlitMuslim})）。`,
          ],
          list: [
            "「ヴィーガン対応」と書くなら、どの料理が対応か、だしや調味料まで動物性の材料を使っていないかを書きます。「肉は使っていないが、だしに魚を使う」のような料理は、そのとおりに書きます。",
            "ハラールは、認証を受けている場合はその認証の名前を、受けていない場合は「豚肉・アルコールを使わない料理があります（認証は受けていません）」のように、していることだけを書きます。",
            "対応できる料理の数が少ない場合も、その料理名を書いておくと、AIは「この店ではこの料理が食べられる」と答えられます。",
          ],
        },
        {
          heading: "自社サイト・Googleビジネスプロフィール・グルメサイト・ChatGPTの役割分担",
          paragraphs: [
            `2026年11月10日、OpenAIは「Businesses in ChatGPT」をベータ版として始めました。Business Hubでお店が自分の掲載を申請して確認し、情報を直せます（[OpenAI：Introducing Businesses in ChatGPT](${SRC.openaiBiz})）。ヘルプによると、編集できるのはウェブサイト・説明・カテゴリ・ロゴなどで、店舗や飲食店は「米国の既存の掲載」だけを申請できます。掲載を整えても表示が増えることは保証されず、ChatGPTはほかの情報源も使って答えると書かれています（[OpenAI ヘルプ：Setting up your business on ChatGPT](${SRC.openaiHelp})）。日本の店は、今のところ自分のサイトとほかの掲載先を正しくしておくことが、ChatGPTの答えを正しくする手段です。`,
          ],
          table: {
            head: ["場所", "役割", "そろえること"],
            rows: [
              ["自社サイト", "事実のおおもと。メニュー・価格・アレルギー・対応の中身・席・予約の方法をくわしく書く", "ほかの掲載先は、ここに合わせる"],
              ["Googleビジネスプロフィール", "地図と検索での店の情報。営業時間・メニュー・写真・口コミ", "店名・住所・電話・営業時間・メニューの価格"],
              ["グルメサイト・予約サイト", "予約と比較。AIの答えの出典になることもある", "営業時間・価格帯・席数・予約の方法"],
              ["ChatGPTのビジネス掲載（米国、ベータ）", "ChatGPTに出る店の情報を、お店が直せる", "ウェブサイト・説明・カテゴリ"],
              ["Instagramなどの投稿", "新しいメニューや臨時休業のお知らせ", "変わった事実は、自社サイトにも同じ日に書く"],
            ],
            caption: "役割の分け方は、この記事の提案です。",
          },
          after: [
            "ほかの掲載先が間違っている場合の直し方は[ポータル・比較サイトの自社情報の直し方](/guide/fix-business-listings-ai-search)、複数店舗の店は[複数店舗のAI検索対策](/guide/multi-location-business-ai-search)をご覧ください。",
          ],
        },
        {
          heading: "構造化データ：Restaurant と Menu",
          paragraphs: [
            `schema.orgでは、飲食店は[Restaurant](${SRC.schemaRestaurant})（カフェは CafeOrCoffeeShop、パン屋は Bakery、バーは BarOrPub）で書きます。料理のジャンルは servesCuisine、価格帯は priceRange、予約は acceptsReservations（はい・いいえか、予約のページのURL）です。メニューは、schema.org では hasMenu が新しい名前で、古い menu は hasMenu に置きかえられた扱いですが、Googleの説明は menu（メニューのURL）を推奨の項目に挙げ、servesCuisine・priceRange も推奨としています（[Google 検索セントラル：ローカルビジネスの構造化データ](${SRC.googleLb})）。両方に同じURLを書いても矛盾はありません。`,
            `料理ひとつひとつは Menu・MenuSection・[MenuItem](${SRC.schemaMenuItem}) で書けます。MenuItem には、ヴィーガンやハラールなどに合うことを示す suitableForDiet があり、値は[RestrictedDiet](${SRC.schemaRestrictedDiet})の11種類（VeganDiet、VegetarianDiet、HalalDiet、GlutenFreeDiet など）です。一方で、schema.org にはアレルゲンを書く項目がありません。アレルギーの情報は構造化データに頼らず、ページの文字の表で書きます。`,
          ],
          code: SCHEMA_JA,
          after: [
            "料理を構造化データに書くのは、ページのメニューと同じ内容を保てる場合だけにします。品数が多く、価格をよく変える店は、hasMenu にメニューのページのURLを書くだけでも十分です。構造化データとページの価格が違うと、AIはどちらが正しいか判断できません。",
          ],
        },
        {
          heading: "WordPressの飲食店のサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「飲食店・カフェ」を選びます。Restaurant として出力されます。カフェ・パン屋・バーの場合は、設定画面の「業種（schema.org型）」に CafeOrCoffeeShop・Bakery・BarOrPub と入れます。",
            "店名・住所・電話番号・営業時間を、Googleビジネスプロフィールと同じ表記で入れます。説明文の最初の一文に、料理のジャンルと看板の料理、昼と夜の違いを書きます。",
            "コース・宴会・個室・持ち帰り・ケータリングなど、お店の利用のしかたを「サービス」に登録します（最大20件）。サービスは構造化データ（Service）とllms.txtに載ります。料理の一品ずつは、サービスではなくメニューのページに書きます。",
            "料理のジャンル（servesCuisine）・価格帯（priceRange）・メニュー（menu／hasMenu）・予約（acceptsReservations）の入力欄はないので、下の webmcp_canary_business_node フィルターで足します。値は本文と同じにします。Yoast SEOなどが有効な場合は、そのプラグインがすでに出している値が優先されます。",
            "アレルギーの確かめ方・ヴィーガン対応・子連れ・個室・予約なしで入れるかなどの答えをよくある質問に入力し、Nurevo FAQブロック（または[nurevo_faq]ショートコード）をメニューか店舗案内のページに置きます。FAQの構造化データは、質問が表示されているページにだけ出ます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search)をご覧ください。",
            "/llms.txt を開き、メニュー・店舗案内・予約のページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "メニューのページに、料理の名前・短い説明・税込の価格が文字で書かれている（写真やPDFだけではない）。",
            "昼・夜・コース・飲み物・持ち帰りが見出しで分かれていて、メニューの更新日がある。",
            "税込であることが金額と同じ文にあり、店内と持ち帰りの価格の書き方が店と同じ。",
            "席料・お通し・サービス料・個室料の金額と、かかる条件が書かれている。",
            "アレルギー情報の範囲・一覧・コンタミネーションの説明・確かめ方・更新日が書かれている。",
            "ご飯を出す店は、米の産地を伝えている。「手打ち」「自家製」などの言葉は、実際にそうであるものだけ。",
            "ヴィーガン・ハラールなどは、対応する料理と中身（だし・調味料・認証の有無）が書かれている。",
            "店名・住所・電話・営業時間・メニューの価格が、サイト・Googleビジネスプロフィール・グルメサイトで同じ。",
            "構造化データが Restaurant（またはカフェなどの型）で、servesCuisine・priceRange・menu／hasMenu・acceptsReservations がページと同じ。",
            "llms.txtにメニュー・店舗案内・予約のページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、お客様が聞きそうな質問をAIに投げます。「◯◯駅 魚の定食 ランチ」のような地域＋料理の質問で名前が出るかに加えて、店名を入れて「夜は一人いくら？」「えびのアレルギーでも食べられる？」「ヴィーガンのメニューはある？」と聞き、答えの事実がサイトと合っているかを見ます。間違っていたら、答えの出典になったページを開いて、そのページの情報から直します。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、結果を記録します。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（店の名前は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在はPerplexity）。どちらも回答の一部を見本として調べるもので、すべての回答を見ているわけではありません。くわしくは[AIでの登場率の測り方](/guide/measure-ai-visibility)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "飲食店のAI検索対策は、何から始めればいいですか？", a: "まず、メニューのページを、料理の名前・短い説明・税込の価格の文字で書きます（写真やPDFだけにしない）。次に、席料などの追加の料金、アレルギー情報の範囲と確かめ方、ヴィーガンなどの対応の中身を書き、Googleビジネスプロフィールとグルメサイトの情報をサイトと同じにします。" },
        { q: "PDFのメニューではだめですか？", a: "PDFを置くこと自体は問題ありませんが、PDFや写真だけだと、AIが中身を読み取れないか読み違えることがあります。同じ内容をページの文字でも書き、PDFは印刷用として添えるのが安全です。" },
        { q: "飲食店はアレルギー表示をしなければいけませんか？", a: "食品表示法のアレルギー表示の義務は容器包装された食品が対象で、店内で出す料理は対象外です。ただし持ち帰りのお弁当など容器包装に入れて売る場合は表示が必要です。店内の料理も、情報を出すなら正確に、コンタミネーションの説明と更新日を添えて書いてください。" },
        { q: "アレルギー情報を構造化データに入れられますか？", a: "schema.org にはアレルゲンを書く項目がありません。ヴィーガンやハラールなどに合うことは MenuItem の suitableForDiet で示せますが、アレルギーの情報はページの文字の表で書いてください。" },
        { q: "ChatGPTのビジネス掲載は日本の店でも使えますか？", a: "2026年11月時点のOpenAIのヘルプでは、店舗や飲食店が申請できるのは米国の既存の掲載だけです。日本の店は、自分のサイトとGoogleビジネスプロフィールなどの掲載先を正しくしておくことが、ChatGPTの答えを正しくする手段です。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ずおすすめされますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、メニュー・価格・食べられるかの情報をAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの店のサイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOで店の情報・コースや持ち帰りなどのサービス・よくある質問を無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleとGeminiはGoogle LLCの商標です。DoorDash、NIQ、Zonal、Uberall、Owner、ChowNow、Yext、Bloom Intelligence、Malou、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "Restaurant AI Search: Menus, Prices & Allergen Info | Nurevo",
      description: "AI search for restaurants: menus as page text, full prices and charges, safe allergen and dietary info, Google and ChatGPT listings, schema and WordPress steps.",
      h1: "AI search for restaurants: make your menu, prices and allergen information readable to ChatGPT and Google",
      lead: "The most important part of AI search optimisation (AEO) for a restaurant is to put, as text on your own site, the facts diners ask AI before they choose: what they can eat, what it costs, and whether they can eat it safely. That means a menu written as page text rather than only a PDF or photo, full prices with any service or cover charges, allergen information with its limits and a date, and the real detail behind \"vegan\" or \"halal\". Then align the same facts on Google Business Profile, booking and review sites and the new Businesses in ChatGPT, and support them with Restaurant and Menu structured data.",
      intro: [
        "Written 28 November 2026 (JST). FDA, UK government, schema.org, Google and OpenAI pages were checked at the links in the text on 28 November 2026. This article is not legal advice; check allergen and labelling duties with your local food authority.",
        "AI answers change from day to day and with the wording of a question. The steps here help AI read your restaurant's facts correctly; they do not guarantee that you will appear in an AI answer or rank higher.",
      ],
      sections: [
        {
          heading: "What diners ask AI about restaurants",
          paragraphs: [
            "People do not only ask \"lunch near Example Station\". They add conditions: \"Is it OK with kids?\", \"I'm allergic to shellfish, is there anything I can eat?\", \"Do they have vegan dishes?\", \"How much is dinner per person?\". AI can only answer these if the answer is written somewhere as text.",
          ],
          table: {
            head: ["Type of question", "Example", "Facts AI needs to answer"],
            rows: [
              ["Food and style", "\"Where can I get grilled fish near Example Station?\"", "Cuisine, signature dishes, how lunch and dinner differ"],
              ["Menu and price", "\"Is dinner tasting-menu only? How much per person?\"", "A text menu, full prices, service or cover charges"],
              ["Can I eat it?", "\"Anything gluten-free?\" \"Is it vegan-friendly?\"", "Allergen list, what you can and cannot guarantee, cross-contact, how to check"],
              ["Fit", "\"Good for solo diners?\" \"Private room?\" \"Kids?\"", "Seating types and numbers, private rooms, high chairs, accessibility"],
              ["Booking and waiting", "\"Can I book? Walk-ins?\"", "How to book, cut-off times, whether walk-ins are seated"],
              ["Takeout and delivery", "\"Do they do takeout?\"", "Takeout menu and prices, pick-up, delivery services"],
            ],
            caption: "The example questions illustrate this article; they are not measured question frequencies.",
          },
          after: [
            "Hours and closures are covered in [business hours and holidays for AI search](/guide/business-hours-holidays-ai-search), and booking pages in [booking pages for AI search](/guide/booking-page-ai-search). This article focuses on what is specific to restaurants: menu, price and \"can I eat this\".",
          ],
        },
        {
          heading: "The numbers: diners using AI, and restaurants left out",
          paragraphs: [
            "How many people use AI to choose a restaurant depends on the country and the survey. These are figures we could confirm on the publisher's own page.",
          ],
          table: {
            head: ["Survey (publisher, date)", "Who", "Figure"],
            rows: [
              [`[DoorDash (18 May 2026)](${SRC.doordash})`, "3,001 US consumers", "22% have used an AI tool such as ChatGPT or Gemini to help choose a restaurant"],
              [`[Reputation / Nielsen (21 Oct 2025)](${SRC.reputation})`, "763 US consumers", "20% use AI tools like ChatGPT to research restaurants and bars"],
              [`[NIQ / Zonal (8 Oct 2026)](${SRC.niq})`, "5,000+ British consumers", "19% use AI to plan a visit to a pub, bar or restaurant; of those, 38% view menus, 43% check prices and 35% check opening times"],
              [`[Honichi Lab (1 Oct 2026)](${SRC.honichiAi})`, "483 people in Japan who use AI daily and have used it to choose restaurants", "60% visited a restaurant AI suggested; over 80% have dropped a restaurant from consideration for lack of information"],
              [`[Uberall (no date)](${SRC.uberall})`, "The company's own study (sample size not given)", "83% of restaurant locations do not appear in AI recommendations; 17% appear in a ChatGPT recommendation"],
            ],
            caption: "Honichi Lab figures are from its free summary. Uberall's figures are presented as its own study.",
          },
          after: [
            "None of these surveys shows how AI chooses restaurants. What they share across countries is that diners look at menus, prices and hours, and drop places whose information is missing. Before you can be chosen, the facts AI needs have to be on your site.",
          ],
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            `On 28 November 2026 we read 16 top results in English and Japanese for queries such as \"restaurant AI search\". [Owner](${SRC.owner}) (22 October 2026) makes the strongest case for text menus over PDFs and explains checking ChatGPT while logged out. [Yext](${SRC.yext}) (18 June 2026) lists the menu data fields AI uses, and [Bloom Intelligence](${SRC.bloom}) (updated 5 October 2026) has the most concrete measurement plan, with a set of prompts per location. [ChowNow](${SRC.chownow}) (updated 18 September 2026) stresses keeping the menu on your own site, not only inside an ordering app. None of them includes a structured-data code example, and the text we could read of [Malou's structured-data guide](${SRC.malouSchema}) (updated 22 September 2026) did not show one either.`,
            "Across both languages, no article covered allergen information in a way that stays safe when AI lifts a single sentence, none explained what US and UK rules actually require restaurants to disclose, none had WordPress steps, and none covered Businesses in ChatGPT, launched in November 2026. Several repeat AI \"rating thresholds\" without a source. This article fills those gaps.",
          ],
        },
        {
          heading: "Write the menu as page text, not only a PDF or photo",
          paragraphs: [
            "If your menu exists only as a photo or PDF, AI may not read it, or may read it wrongly. Put each dish name, a short description and the price on the page as HTML text. Keep the PDF or photo as an addition to the text menu, not instead of it.",
          ],
          list: [
            "Use the same dish names as your printed menu, with one line saying what it is (main ingredients, portion, spice level). \"Chef's whim\" alone tells AI nothing.",
            "Group by lunch, dinner, set or tasting menus, drinks and takeout. Mark dishes served only at lunch or only on weekdays.",
            "For seasonal or limited dishes, give the dates and remove them when they end. A dish left on the page is a dish AI says you still serve.",
            "Show the date the menu was last updated. When prices change, update your site, Google Business Profile and listing sites on the same day.",
            "If many guests are visitors from abroad, publish the menu as text in their languages too. See [multilingual sites for AI search](/guide/multilingual-site-ai-search).",
          ],
          after: [
            `On Google Business Profile, food and drink businesses can add sections, dishes, descriptions and prices in the menu editor, and changes can take 24 to 48 hours. You can also add menu photos (PDFs too) or a menu link; Google may transcribe the menu from your website, and owners can choose which menu is shown. [Google Business Profile Help: About the menu editor](${SRC.gbpMenuEn}) Getting the text menu on your site right also helps the menu Google reads from it.`,
          ],
        },
        {
          heading: "Prices: what is included, and what is extra",
          paragraphs: [
            `AI may quote one sentence from your page. \"Mains from $15\" with the conditions at the bottom of the page can become just \"$15\". Put the conditions in the same sentence as the price: \"Lunch mains are $15 to $24; a 3% kitchen charge is added to every bill.\"`,
            `In the US, chain restaurants with 20 or more locations must show calories for standard menu items; the compliance date was 7 May 2018 ([FDA: Menu labeling requirements](${SRC.fdaMenu})). The rule's definition of a menu includes \"menus on the Internet\" ([21 CFR 101.11, 2019 edition](${SRC.cfr10111})), so a covered chain's website menu needs the same calories as its printed one.`,
          ],
          list: [
            "List every extra charge: service charge, cover, kitchen or wellness fees, private-room minimums. Say when each applies (dinner only, groups of six or more).",
            "For set or tasting menus, give the number of courses, what drinks are included, the minimum party size and the booking cut-off next to the price.",
            "If you give a \"typical spend per person\", say what it includes (drinks or not, tip or not) in the same sentence.",
            "If takeout and dine-in prices differ, say so in both places.",
          ],
        },
        {
          heading: "Allergen information: what the rules ask, and how to write it",
          paragraphs: [
            `In the US there are nine major food allergens: milk, eggs, fish, crustacean shellfish, tree nuts, peanuts, wheat, soybeans and sesame, which was added from 1 January 2023 ([FDA: FASTER Act](${SRC.fdaSesame})). Federal labelling rules apply to packaged food. For unpackaged food, the 2022 FDA Food Code says the permit holder shall notify consumers in writing of major food allergens in the food, by physical or electronic means such as a menu; the Food Code is a model, and applies only where a state or local jurisdiction adopts it ([FDA: 2022 Food Code and sesame](${SRC.fdaFoodCode})). Check which edition your jurisdiction uses.`,
            `In the UK, information on 14 allergens must be available for non-prepacked food. It can be given orally by staff, as long as a notice, menu or label tells customers where to find it; prepacked-for-direct-sale food has needed full ingredient labelling since 1 October 2021; and for online orders the information must be available before purchase and at delivery ([UK technical guidance, updated 3 November 2026](${SRC.ukTech})). The Food Standards Agency's best-practice guidance (24 February 2025) recommends written information supported by a conversation, and online, on the main menu or no more than one click away. It is guidance, not law ([FSA best practice](${SRC.ukBest})).`,
          ],
          table: {
            head: ["What to write", "Example"],
            rows: [
              ["Scope", "\"Our allergen chart covers the 14 allergens for every dish. For other ingredients, please ask our staff.\""],
              ["Format", "A text table with dishes as rows and allergens as columns, not only an image"],
              ["Cross-contact", "\"We cook shellfish and wheat in the same kitchen and fryer. We cannot guarantee any dish is free from traces.\""],
              ["How to check", "\"Tell us about allergies when you book. On the day, the manager will confirm ingredients.\""],
              ["Date", "\"Ingredients as of [date]. We review the chart whenever a supplier changes.\""],
            ],
            caption: "Examples only. Write what your kitchen actually does, and leave out anything you cannot confirm.",
          },
          after: [
            "The risk with AI is that \"no shellfish\" survives as a quote while \"cooked in the same fryer as shellfish\" is dropped. Put the cross-contact warning at the top of the page and on the relevant dishes, and separate \"does not contain\" from \"can be prepared without\". Avoid broad phrases such as \"allergy-friendly\" on their own in your Google description or FAQs.",
            "If you run a restaurant in Japan, the rules differ: allergen labelling is mandatory only for packaged food, nine specified ingredients apply since April 2026, and rice origin must be conveyed for rice dishes. The Japanese version of this page covers those rules.",
          ],
        },
        {
          heading: "Vegetarian, vegan, halal and other diets",
          list: [
            "If you say \"vegan\", say which dishes, and whether stocks and sauces are free of animal products too. If a dish has no meat but uses fish stock, write exactly that.",
            "For halal or kosher, name the certification if you have one. If you do not, say only what you do: \"Some dishes contain no pork or alcohol (not certified).\"",
            "Even if only a few dishes qualify, name them. AI can then say \"you can eat this dish here\" instead of guessing.",
            "Words such as \"homemade\", \"local\" or \"line-caught\" become your restaurant's description in AI answers. Use them only where they are true.",
          ],
        },
        {
          heading: "Your site, Google, listing sites and ChatGPT: who does what",
          paragraphs: [
            `On 10 November 2026 OpenAI launched Businesses in ChatGPT in beta: in Business Hub a business can claim and verify its profile and update its details ([OpenAI: Introducing Businesses in ChatGPT](${SRC.openaiBiz})). According to the help centre, you can edit the website, description, category and logo; local stores and restaurants can only claim an existing US listing; and claiming does not guarantee more visibility, since ChatGPT may use other sources ([OpenAI Help: Setting up your business on ChatGPT](${SRC.openaiHelp})). Outside the US, keeping your own site and other listings correct is still the way to keep ChatGPT's answers correct.`,
          ],
          table: {
            head: ["Place", "Role", "Keep identical"],
            rows: [
              ["Your website", "The source of truth: menu, prices, allergens, diets, seating, booking", "Everything else follows this"],
              ["Google Business Profile", "Maps and search: hours, menu, photos, reviews", "Name, address, phone, hours, menu prices"],
              ["Booking and review sites (OpenTable, Yelp, Tripadvisor...)", "Booking and comparison; often cited by AI", "Hours, price range, seating, how to book"],
              ["Businesses in ChatGPT (US, beta)", "Lets you correct how ChatGPT shows your business", "Website, description, category"],
              ["Social posts", "New dishes and temporary closures", "Put any changed fact on your site the same day"],
            ],
            caption: "This division of roles is our suggestion.",
          },
          after: [
            "To correct wrong listings, see [how to fix business listings for AI search](/guide/fix-business-listings-ai-search). For groups, see [multi-location businesses and AI search](/guide/multi-location-business-ai-search).",
          ],
        },
        {
          heading: "Structured data: Restaurant and Menu",
          paragraphs: [
            `Use [Restaurant](${SRC.schemaRestaurant}) (or CafeOrCoffeeShop, Bakery, BarOrPub). Cuisine goes in servesCuisine, price level in priceRange, and bookings in acceptsReservations (true/false or the URL of your booking page). For the menu, schema.org's current property is hasMenu, which supersedes menu; Google's documentation lists menu (the menu URL), servesCuisine and priceRange as recommended properties ([Google Search Central: Local business structured data](${SRC.googleLbEn})). Giving both the same URL is consistent.`,
            `Dishes can be described with Menu, MenuSection and [MenuItem](${SRC.schemaMenuItem}). MenuItem has suitableForDiet, whose values are the 11 [RestrictedDiet](${SRC.schemaRestrictedDiet}) types such as VeganDiet, VegetarianDiet, HalalDiet and GlutenFreeDiet. schema.org has no property for allergens, so allergen information belongs in a text table on the page, not in structured data.`,
          ],
          code: SCHEMA_EN,
          after: [
            "Only mark up individual dishes if you can keep them identical to the page. If your menu is long or prices change often, pointing hasMenu at the menu page is enough. A price in structured data that differs from the page leaves AI unsure which is right.",
          ],
        },
        {
          heading: "Setting it up on a WordPress site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working, without duplicate structured data.`,
            "In the setup wizard, choose \"Restaurant or café\". It publishes Restaurant. For a café, bakery or bar, enter CafeOrCoffeeShop, Bakery or BarOrPub in \"Business type (schema.org type)\" in Settings.",
            "Enter your name, address, phone and hours exactly as on Google Business Profile. Start the description with your cuisine, signature dishes and how lunch and dinner differ.",
            "Add the ways guests use you as Services: tasting menu, private dining, events, takeout, catering (up to 20). Services appear in structured data (Service) and in llms.txt. Individual dishes belong on the menu page, not in Services.",
            "There are no fields for servesCuisine, priceRange, menu/hasMenu or acceptsReservations, so add them with the webmcp_canary_business_node filter below, using the same values as your page text. If Yoast SEO or a similar plugin is active, values it already publishes take precedence.",
            "Enter FAQs on allergens, vegan dishes, children, private rooms and walk-ins, and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your menu or visit page. FAQ structured data is published only on a page that shows the questions. See [FAQ pages for AI search](/guide/faq-page-ai-search).",
            "Open /llms.txt and check that the menu, visit and booking pages are listed. Run the check on the AEO score screen and fix what it flags.",
          ],
          code: PHP_EN,
          after: [
            "The same checks apply to sites not on WordPress. Enter your URL in the [free check](/check), no sign-up needed, to see the state of your structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "The menu page has dish names, short descriptions and prices as text, not only as a photo or PDF.",
            "Lunch, dinner, set menus, drinks and takeout have their own headings, and the menu shows an updated date.",
            "Every price sentence says what is included, and extra charges and when they apply are listed.",
            "If you are a US chain with 20+ locations, the website menu shows the same calories as the printed one.",
            "The allergen information states its scope, has a text table, a cross-contact warning, how to check, and a date.",
            "Vegan, vegetarian, halal or gluten-free claims name the dishes and what is behind them (stocks, sauces, certification).",
            "\"Homemade\", \"local\" and similar words are used only where true.",
            "Name, address, phone, hours and menu prices match across your site, Google Business Profile and listing sites.",
            "Structured data uses Restaurant (or a café, bakery or bar type) with servesCuisine, priceRange, menu/hasMenu and acceptsReservations matching the page.",
            "llms.txt lists your menu, visit and booking pages. [What is llms.txt?](/guide/llms-txt)",
          ],
        },
        {
          heading: "Check whether AI mentions you, and whether it is right",
          paragraphs: [
            "Once the facts are in place, ask AI what diners would ask. Check area-plus-food questions such as \"grilled fish lunch near Example Station\", and then ask about you by name: \"How much is dinner per person?\", \"Can I eat there with a shellfish allergy?\", \"Do they have vegan dishes?\". Compare each answer with your site. If something is wrong, open the page the answer cites and fix the information there first.",
            "AI answers vary between runs, so ask the same questions at intervals and keep a record. On the Free and Standard plans, Nurevo AEO sends three questions built from your business type and area (never your name) to Perplexity once a month and records whether your name or site appears. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a restaurant start with AI search?", a: "Start with the menu page: dish names, short descriptions and prices as text, not only a PDF or photo. Then add extra charges, allergen information with its limits and a date, and the detail behind dietary claims, and make Google Business Profile and listing sites match your site." },
        { q: "Is a PDF menu a problem?", a: "Having a PDF is fine, but if the menu exists only as a PDF or photo, AI may not read it, or may read it wrongly. Publish the same menu as page text and keep the PDF for printing." },
        { q: "Do restaurants have to publish allergen information?", a: "It depends on where you are. In the UK, information on 14 allergens must be available for non-prepacked food, and can be given by staff if signposted. In the US, federal labelling rules cover packaged food, while the FDA Food Code, where adopted, asks for written notification for unpackaged food. Whatever the rule, if you publish it, make it accurate, with a cross-contact warning and a date." },
        { q: "Can allergens go in structured data?", a: "schema.org has no allergen property. You can mark dishes suitable for diets such as vegan or halal with suitableForDiet on MenuItem, but publish allergen information as a text table on the page." },
        { q: "Should we claim our restaurant in ChatGPT?", a: "If you are in the US and an existing listing for you appears in Business Hub, claiming it lets you correct your website, description and category. OpenAI says it does not guarantee more visibility. Outside the US, local businesses cannot claim yet, so keep your site and other listings accurate." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends us?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your menu, prices and dietary facts easy for AI to read, and keep checking whether you are mentioned and described correctly." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your restaurant's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your restaurant facts, services such as private dining and takeout, and FAQs for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google and Gemini of Google LLC. DoorDash, Reputation, Nielsen, NIQ, Zonal, Uberall, Owner, ChowNow, Yext, Bloom Intelligence, Malou, OpenTable, Yelp, Tripadvisor, Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
