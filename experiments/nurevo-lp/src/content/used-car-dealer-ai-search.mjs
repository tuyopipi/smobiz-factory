// Content page: AI search (AEO) for used car dealers (中古車販売店). Industry page.
// Angle: the facts AI needs to answer "which shop has X under ¥N total" are the
// 支払総額 with its breakdown and conditions, the per-car display items Japan's
// used-car advertising code requires (走行距離, 保証の有無, 定期点検整備,
// 修復歴, 車台番号の下3桁), sold-car handling, the 古物商 display on the
// website, and keeping the dealer site, the listing portals and the Google
// Business Profile in step. Separate from the auto repair / 車検 article
// (PR #87, unmerged), which covers 認証・指定工場 and repair pricing.
//
// Written 2026-11-24 11時 (JST). Nurevo AEO facts come from the plugin source and
// readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2):
// the wizard has no car card; "Other"（その他）sets no type and publishes
// LocalBusiness when address/phone/hours are present; Settings has a free
// "Business type (schema.org type)"（業種（schema.org型））field and
// webmcp_canary_business_schema_type() publishes any valid type name typed
// there, so AutoDealer can be entered. Services (up to 20) become Service +
// Offer + ReserveAction and an llms.txt line; FAQ block / [nurevo_faq]; monthly
// free check (three questions to Perplexity, never the business name); Pro
// measurement (beta) on Perplexity. Nurevo does not output Car / vehicle
// inventory markup. Prices: Free 0, Standard 3,000 JPY / USD 20, Pro from
// 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-24):
// - AFTC「中古車の販売価格の表示が、『支払総額』に変わります。」(2023年4月, PDF):
//   2023-10-01 施行; 支払総額＝車両価格＋諸費用 with the breakdown; 諸費用 =
//   保険料・税金・登録等に伴う費用 only; 納車準備費用・納車整備費用・販売手数料・
//   利益・広告掲載料 go in 車両価格; mandatory 保証・整備 cost goes in 車両価格,
//   「メンテナンスパック付きの支払総額」不可; conditions such as 県内登録・店頭納車;
//   update promptly when the total changes; Web sites and portal listings must
//   change too; 厳重警告, 違約金, 社名公表.
// - AFTC pamphlet 2023_07 (A4): 「諸費用０円」不可; website example; price board too.
// - AFTC 中古車の広告宣伝チェックリスト (2020.04): 必要表示事項 = 現金価格（車両価格）,
//   支払総額（名称は「支払総額」、「コミコミ価格」「諸費用込価格」は違反例）,
//   走行距離数, 保証の有無（保証付なら期間・距離）, 定期点検整備（実施する／しない、
//   整備費用を含む／含まない）, 修復歴の有無, 車台番号（下3桁以上）; 登録済未使用車
//   に「未走行」「0km」は不当表示のおそれ. 修復歴の定義はこれらのPDFにない.
// - くるまのニュース 2023-10-01 (secondary): AFTC survey, about 9 in 10 consumers
//   want 支払総額 shown.
// - 警視庁「古物営業法の一部改正について（令和6年4月1日施行）」(更新 2024-04-17):
//   第12条第2項 = website shows 氏名又は名称・許可をした公安委員会の名称・許可証の
//   番号; exemption: 常時使用する従業員5人以下 or no website (施行規則第13条の2);
//   特定古物商 (internet transactions, 第5条第1項第6号) must show them regardless
//   (第8条の2第1項); 「消費者の目につきやすい箇所に明瞭に掲載」.
// - 静岡県警察「インターネット利用の古物商」(更新 2026-10-26): URL届出 (第5条第1項
//   第6号・第7条第1項) and the published list (第8条の2).
// - Google Search Central updates, 2025-09-09: documentation removed for vehicle
//   listing (with course info, estimated salary, learning video, special
//   announcement): "no longer shown in Google Search results". Blog post of
//   2023-10 introduced it (US-only scope not verified verbatim, so not stated).
// - schema-dts 2.1.0: AutoDealer (LocalBusiness, under AutomotiveBusiness), Car
//   (Vehicle → Product) with mileageFromOdometer, dateVehicleFirstRegistered,
//   knownVehicleDamages ("A textual description of known damages, both
//   repaired and unrepaired"), vehicleTransmission, fuelType, color; Offer has
//   itemCondition (UsedCondition), availability (SoldOut), warranty.
// - Google "AI features and your website" (checked earlier): no special markup.
// Top articles read 2026-11-24: uravation 自動車販売店・整備工場 (2026-08-01, upd
// 09-05), assist-all 自動車整備 LLMO (2026-01-30, upd 06-09), 0120.co.jp 自動車
// AIO (2026-07-29, upd 10-22), GMO ローカルAIO (upd 11-16), 車選びドットコム
// (2023-03-30, consumer-side); Marchex (2025-08-14), Dealer.com GEO (mod
// 2026-05-04), Fullpath (2025-07-09), Cox Automotive (mod 2026-03-27), Keyloop
// (2025-10-30, mod 2026-11-09), Car Dealership Guy News (2026-01-29). aipicks
// and AutoSuccess failed. schema.org pages and the Google 2025-06 blog post
// were not readable (permission), so types were checked in schema-dts.
// Not verified, so not stated: the definition of 修復歴 (which frame parts),
// meter-replacement rules, rules outside Japan, whether non-members of AFTC are
// bound, portal-side inventory sync features, share of buyers who ask AI.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  aftcTotal: "https://www.aftc.or.jp/content/files/pdf/shiharaisougakupnf.pdf",
  aftcPamph: "https://www.aftc.or.jp/content/files/pdf/2023_07_kaiseipamph_A4.pdf",
  aftcCheck: "https://www.aftc.or.jp/pdf/cyuko_cl.pdf",
  kurumaNews: "https://kuruma-news.jp/post/693314",
  mpdKobutsu: "https://www.keishicho.metro.tokyo.lg.jp/tetsuzuki/kobutsu/kaisetsu/kobutu_eigyo_r6.html",
  shizuoka: "https://www.pref.shizuoka.jp/police/shinse/seikatsu/kobutsu/internet/index.html",
  googleUpdates: "https://developers.google.com/search/updates",
  googleVehicleBlog: "https://developers.google.com/search/blog/2023/10/vehicle-listings-structured-data",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  autoDealer: "https://schema.org/AutoDealer",
  car: "https://schema.org/Car",
  uravation: "https://uravation.com/llmo/jidosha-hanbai-seibi-llmo-taisaku/",
  zeroOne: "https://0120.co.jp/blog/aio-157/",
  keyloop: "https://keyloop.com/blog/industry-insights/seo-in-the-age-of-ai",
  marchex: "https://www.marchex.com/chatgpts-new-role-as-car-buying-advisor-how-ai-is-transforming-dealership-marketing/",
};

const SCHEMA_DEALER_JA = `{
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  "@id": "https://example.jp/#organization",
  "name": "例オート（例）",
  "description": "◯◯市の中古車販売店です。軽自動車とミニバンを中心に、常時30台前後を展示しています。価格はすべて支払総額（県内登録・店頭納車）で表示しています。古物商許可：◯◯県公安委員会 第000000000000号。",
  "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯市◯◯町1-2-3" },
  "telephone": "+81-00-0000-0000",
  "url": "https://example.jp/",
  "openingHours": "Mo,Tu,Th,Fr,Sa,Su 10:00-19:00"
}`;

const SCHEMA_CAR_JA = `{
  "@context": "https://schema.org",
  "@type": "Car",
  "name": "例メーカー 例ワゴン G 2WD",
  "url": "https://example.jp/stock/1234/",
  "dateVehicleFirstRegistered": "2021-04",
  "mileageFromOdometer": { "@type": "QuantitativeValue", "value": 31000, "unitCode": "KMT" },
  "fuelType": "ガソリン",
  "vehicleTransmission": "CVT",
  "color": "パールホワイト",
  "knownVehicleDamages": "修復歴なし",
  "offers": {
    "@type": "Offer",
    "price": "1298000",
    "priceCurrency": "JPY",
    "itemCondition": "https://schema.org/UsedCondition",
    "availability": "https://schema.org/InStock",
    "description": "支払総額1,298,000円（車両価格1,180,000円＋諸費用118,000円）。2026年11月現在、◯◯県内登録・店頭納車の場合。保証付（1年・走行距離無制限）、定期点検整備付き（整備費用は車両価格に含む）。",
    "seller": { "@id": "https://example.jp/#organization" }
  }
}`;

const SCHEMA_DEALER_EN = `{
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  "@id": "https://example.com/#organization",
  "name": "Example Motors",
  "description": "Used car dealer in Example City. Mostly compact cars and minivans, with around 30 cars on the lot. Every price is shown as the total payable amount, with the fees itemised.",
  "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Example St, Example City" },
  "telephone": "+1-000-000-0000",
  "url": "https://example.com/",
  "openingHours": "Mo,Tu,Th,Fr,Sa,Su 10:00-19:00"
}`;

const SCHEMA_CAR_EN = `{
  "@context": "https://schema.org",
  "@type": "Car",
  "name": "Example Make Example Wagon G 2WD",
  "url": "https://example.com/stock/1234/",
  "dateVehicleFirstRegistered": "2021-04",
  "mileageFromOdometer": { "@type": "QuantitativeValue", "value": 31000, "unitCode": "KMT" },
  "fuelType": "Petrol",
  "vehicleTransmission": "CVT",
  "color": "Pearl white",
  "knownVehicleDamages": "No accident repair history",
  "offers": {
    "@type": "Offer",
    "price": "8900",
    "priceCurrency": "USD",
    "itemCondition": "https://schema.org/UsedCondition",
    "availability": "https://schema.org/InStock",
    "description": "Total payable $8,900 (vehicle $8,100 + fees $800), as of November 2026, for registration in this state and collection at our lot. 12-month warranty, no mileage limit. Service before handover included in the vehicle price.",
    "seller": { "@id": "https://example.com/#organization" }
  }
}`;

export default {
  slug: "used-car-dealer-ai-search",
  targetQueries: [
    "used car dealer AI search optimization",
    "car dealership ChatGPT recommendation",
    "car dealer schema AutoDealer Car structured data",
    "中古車販売店 AI検索対策",
    "中古車 LLMO 集客 ホームページ",
    "中古車 支払総額 表示 ホームページ AI",
  ],
  related: ["pricing-page-ai-search", "online-shop-ai-search", "faq-page-ai-search", "bing-places-ai-search", "ai-visibility-drop-causes", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "中古車販売店のAI検索対策：支払総額・在庫・古物商の表示 | Nurevo",
      description: "中古車販売店のAI検索対策は、支払総額と内訳・条件、走行距離・保証・整備・修復歴の表示、売約車の扱い、古物商の表示を、サイト・ポータル・Googleでそろえて正確に出すこと。手順と構造化データの例。",
      h1: "中古車販売店のAI検索対策：支払総額、在庫の表示、古物商の表示をAIに正しく読ませる手順",
      lead: "中古車販売店のAI検索対策（AEO）で一番大事なのは、AIに「◯◯市で総額100万円以下の軽自動車を置いている店は？」「この店の価格は諸費用込み？」と聞かれたときに、自分のサイトが正確な答えを返せる状態にすることです。具体的には、価格を支払総額と内訳・条件つきで書き、走行距離・保証・定期点検整備・修復歴を1台ずつ文字で出し、売れた車をすぐ「売約済」にし、古物商の表示をサイトに入れ、同じ事実をポータルサイトとGoogleビジネスプロフィールにもそろえます。",
      intro: [
        "作成日：2026年11月24日（JST）。表示のルールは、本文に記した自動車公正取引協議会の資料と、警視庁・静岡県警察のページで確認したものです。この記事は法的な助言ではありません。細かい扱いは自動車公正取引協議会や管轄の警察署に確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが店と在庫の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "中古車の購入で、AIにどんな質問がされているか",
          paragraphs: [
            "中古車を探す人は、車種と予算から入ることが多く、そのあと「どこで買うか」「本当にその値段で買えるか」「状態は大丈夫か」で候補を絞ります。AIはこうした質問に、店のサイト・ポータルサイトの掲載・地図の情報・口コミなどを組み合わせて答えます。店のサイトに条件が文字で書かれていないと、AIはほかの情報源に頼るか、条件をつけずにあいまいに答えます。",
          ],
          table: {
            head: ["よくある質問の型", "質問の例", "AIが答えに必要な、店側の事実"],
            rows: [
              ["予算", "「総額100万円以下のミニバンがある店は？」", "支払総額と、その内訳（車両価格＋諸費用）、総額の条件（登録地域・納車方法）"],
              ["在庫", "「◯◯市でN-BOXを置いている店は？」", "車種・グレード・年式・走行距離・色、今も売っているか（売約済か）"],
              ["状態", "「修復歴なしで保証つきの車は？」", "修復歴の有無、保証の有無と期間・距離、定期点検整備の有無"],
              ["買い方", "「ローンは使える？下取りは？県外に納車できる？」", "ローン・下取り・県外登録・自宅納車の可否と、別にかかる費用"],
              ["店の信頼", "「ちゃんとした店？」", "古物商許可の表示、所在地、営業時間、定休日、口コミへの返信"],
              ["相談", "「家族4人で乗れる、燃費のいい車は？」", "得意な車種、用途別のおすすめの考え方、試乗の可否"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            `2026年11月24日に、日本語と英語で「中古車販売店 AI検索対策」「car dealership AI search」などの上位記事を13本選び、11本を読みました（2本は取得できず）。日本語では、販売と整備をまとめて扱う記事が中心でした。支払総額の表示まで触れていたのは[uravationの記事](${SRC.uravation})だけで、[株式会社課題解決プラットフォームの記事](${SRC.zeroOne})は毎月同じ質問をAIに投げて記録する測り方が具体的でした。一方で、古物商の表示、売約車の扱い、WordPressでの手順、車1台ずつの構造化データの書き方は、どの日本語記事にもありませんでした。`,
            `英語の記事は、6本中5本が販売店向けの製品を売る会社のもので、統計の多くは出典がないか自社調査でした。[Keyloopの記事](${SRC.keyloop})はサーバーのログでAIのボットを見る方法、[Marchexの記事](${SRC.marchex})は電話の計測で見分ける方法を挙げていて参考になります。ただ、どの記事も車の構造化データの例や、「総額でいくらか」を正確に出す書き方までは説明していません。また、Googleは2025年9月に、車両の掲載（vehicle listing）の構造化データの説明を削除しています（下で説明します）。この記事は、これらの抜けを日本の表示ルールに沿って埋めます。`,
          ],
        },
        {
          heading: "価格は「支払総額」で、内訳と条件まで文字で書く",
          paragraphs: [
            `2023年10月1日から、自動車公正取引協議会の規約により、中古車の価格を表示するときは「支払総額」を表示することになりました。支払総額は、車両価格と諸費用を足したもので、内訳として車両価格と諸費用の額を示し、登録の時期や地域などの条件を書きます。諸費用に入れてよいのは、保険料（自賠責）、税金、登録などに伴う費用（検査登録・車庫証明の手続き代行費用）だけです。[自動車公正取引協議会：中古車の販売価格の表示が「支払総額」に変わります（PDF）](${SRC.aftcTotal})`,
            "「納車準備費用」や納車前の点検・整備の費用、販売手数料、広告掲載料などは、諸費用として別に取ることはできず、車両価格に含めます。保証や定期点検整備を買う条件にしている場合、その費用も車両価格に含めます。協議会の資料は、「諸費用０円」の表示や、「コミコミ価格」「諸費用込価格」といった名前での表示を認めていません。[パンフレット（PDF）](" + SRC.aftcPamph + ")／[広告宣伝のチェックリスト（PDF）](" + SRC.aftcCheck + ")",
            "AI検索にとっても、これはそのまま「正確に答えられる価格」になります。条件のない数字だけの価格や、画像の中にだけある価格は、AIが「総額か、車両本体だけか」を判断できません。総額・内訳・条件を、同じ文の中に文字で書きます。",
          ],
          table: {
            head: ["書き方", "AIにとっての読みやすさ", "直し方"],
            rows: [
              ["「98万円」だけ", "総額か本体価格か判断できない", "「支払総額1,298,000円（車両価格1,180,000円＋諸費用118,000円）」"],
              ["「諸費用別途」", "協議会の資料では違反の例にあたる", "支払総額と内訳を書き、条件をそえる"],
              ["総額はあるが条件がない", "県外の人に同じ金額で買えると読まれる", "「2026年11月現在、◯◯県内登録・店頭納車の場合」"],
              ["プライスボードの写真だけ", "画像の文字は読まれないことがある", "在庫ページの本文に、同じ内容を文字で書く"],
              ["総額が古いまま", "ポータルとサイトで金額が違い、どちらを使うか定まらない", "値下げしたら、サイト・ポータルの両方を同じ日に直す"],
            ],
            caption: "協議会の資料は、支払総額が変わったときは速やかに直すよう求めており、「●月現在」と書くだけでは問題を避けられないとしています。",
          },
          after: [
            "協議会の調査では、消費者の約9割が支払総額の表示を求めていたと報じられています。[くるまのニュース（2023年10月1日）](" + SRC.kurumaNews + ")。AIに「総額で比べたい」と聞く人にとっても、総額と条件が書いてある店は答えに使いやすい店になります。",
          ],
        },
        {
          heading: "1台ずつ書く事実：走行距離・保証・整備・修復歴",
          paragraphs: [
            "協議会の「中古車の広告宣伝を行う際のチェックリスト」（2020年4月）は、広告で必ず表示する事項として次の7つを挙げています。これは、AIが「状態は大丈夫か」に答えるための事実の一覧でもあります。",
          ],
          table: {
            head: ["表示する事項", "書き方の例", "AIにとっての意味"],
            rows: [
              ["車両価格（現金価格）", "車両価格1,180,000円", "支払総額の内訳がわかる"],
              ["支払総額", "支払総額1,298,000円（◯月現在、県内登録・店頭納車）", "予算の質問に、条件つきで答えられる"],
              ["走行距離", "3.1万km", "「走行距離が少ない車」の質問に答えられる"],
              ["保証の有無", "保証付（1年・走行距離無制限）／保証無", "「保証つきの車」の質問に、期間と距離まで答えられる"],
              ["定期点検整備", "定期点検整備付き（整備費用は車両価格に含む）／なし", "納車前に何をしてくれるかがわかる"],
              ["修復歴の有無", "修復歴無／修復歴有", "「修復歴なし」の質問に答えられる"],
              ["車台番号", "下3桁「…123」（車台番号）", "同じ車が複数のサイトに出ていても、同じ1台だとわかる"],
            ],
            caption: "自動車公正取引協議会のチェックリスト（2020年4月版）の「必要表示事項」をもとにした表です。全車が保証付・修復歴無なら「全車」と書きます。修復歴にあたる部位の定義はこの資料にはないため、協議会の資料で確かめてください。",
          },
          after: [
            "登録済未使用車について「未走行」「0km」と書くことは、チェックリストで不当表示のおそれがある例に挙げられています。AI検索のためにも、強い言葉よりも、走行距離の数字と登録の状態をそのまま書くほうが、条件つきで正しく紹介されます。",
          ],
        },
        {
          heading: "売れた車と在庫ページの扱い",
          paragraphs: [
            "中古車は1台ずつしかないので、売れた車のページが「販売中」のまま残ると、AIが「この店にある」と答えて、問い合わせのあとに食い違いが起きます。AIの答えのもとになる情報が古いことは、AIが店の情報を間違えるよくある原因の1つです。",
          ],
          list: [
            "売約が決まった日に、サイトの在庫ページを「売約済」にし、価格の表示を外すか「売約済」と並べます。ポータルサイトの掲載も同じ日に直します。",
            "売約済のページは、しばらく残すなら「売約済」を見出しの近くに文字で書き、似た在庫の一覧へのリンクを置きます。残さないなら削除し、在庫一覧から外します。",
            "在庫一覧のページには、最後に更新した日付と、「掲載の在庫は◯月◯日時点です」の一文を入れます。",
            "構造化データを使っている場合は、availability を SoldOut にするか、ページと一緒に消します。ページが「売約済」なのにデータが InStock のままにしないこと。",
            "店のトップや「店舗案内」には、在庫が日々変わること、最新の在庫はどのページかを書きます。AIに「在庫は電話で確かめて」と案内してもらいやすくなります。",
          ],
          after: [
            "情報がずれる原因と直し方は[AIでの表示が減った・間違うときの原因](/guide/ai-visibility-drop-causes/)にまとめています。",
          ],
        },
        {
          heading: "古物商の表示：サイトに「氏名・公安委員会・許可番号」",
          paragraphs: [
            `中古車の売買は古物営業にあたり、古物商はホームページに「氏名又は名称、許可をした公安委員会の名称及び許可証の番号」を表示することになっています（古物営業法第12条第2項、令和6年4月1日施行）。常時使用する従業員が5人以下の場合などは対象外ですが、インターネットで取引をする届出をしている古物商（特定古物商）は、人数にかかわらず表示が必要です。表示は「消費者の目につきやすい箇所に明瞭に」とされています。[警視庁：古物営業法の一部改正について](${SRC.mpdKobutsu})`,
            `インターネットで古物取引をする場合は、サイトのURLを公安委員会に届け出ます。都道府県警察は、届け出た古物商の名称・URL・許可番号を公表しています。[静岡県警察：インターネット利用の古物商](${SRC.shizuoka})。サイトのURLを変えたとき（リニューアルやドメインの変更）は、届け出の変更も確かめてください。`,
            "この表示は法律上のものですが、AIにとっても「実在して、許可を受けている店」を示す具体的な事実になります。フッターか「会社概要」「店舗案内」のページに、画像ではなく文字で書きます。書き方の例：「古物商許可：◯◯県公安委員会 第000000000000号　例オート株式会社」。",
          ],
        },
        {
          heading: "店の構造化データ：AutoDealer",
          paragraphs: [
            `schema.orgには販売店を表す[AutoDealer](${SRC.autoDealer})があり、LocalBusinessの一種（自動車関係の事業者 AutomotiveBusiness の下）です。店の情報はこの型で、本文と同じ名前・住所・電話・営業時間を出します（schema-dts 2.1.0で確認、2026年11月24日）。`,
          ],
          code: SCHEMA_DEALER_JA,
        },
        {
          heading: "在庫の1台ずつはCarで：Googleの扱いが変わった点に注意",
          paragraphs: [
            `在庫の1台ずつは[Car](${SRC.car})で書けます。Carは車両（Vehicle）、さらに商品（Product）の一種で、初度登録の年月（dateVehicleFirstRegistered）、走行距離（mileageFromOdometer）、燃料、変速機、色、修理済み・未修理の損傷の説明（knownVehicleDamages）などの項目があり、価格は Offer に入れます。下の例では、価格（price）に支払総額を入れ、内訳・条件・保証・整備は説明（description）に、ページと同じ文で書いています。`,
          ],
          code: SCHEMA_CAR_JA,
          after: [
            `注意点が1つあります。Googleは2023年10月に車両の掲載（vehicle listing）の構造化データを始めましたが、2025年9月9日に、この型の説明を「Google検索の結果に表示されなくなった」として削除しました。[Google：Search Central の更新履歴](${SRC.googleUpdates})／[2023年の発表](${SRC.googleVehicleBlog})。つまり、Carのマークアップで検索結果に特別な表示が出ることは期待できません。また、GoogleはAI OverviewsやAI Modeのための特別なマークアップは必要ないとしています。[Google：AI features and your website](${SRC.googleAi})。Carのマークアップは、ページの事実を項目ごとに機械が読める形にした写しとして使い、本文に見えている事実だけを入れ、ページとずれないようにすることが大切です。`,
          ],
        },
        {
          heading: "WordPressの中古車販売店のサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「その他」を選び、住所・電話番号・営業時間（定休日を含む）を入れます。ウィザードには車の販売店のカードがないため、そのあと「設定」の「業種（schema.org型）」に AutoDealer と入力します。入力した型で店の情報が出力されます。",
            "店の説明に、扱う車種の傾向、展示台数の目安、価格はすべて支払総額で表示していること、古物商許可の表示（公安委員会と許可番号）を入れます。",
            "在庫の車1台ずつは、Nurevo AEOのサービスには登録しません（サービスは最大20件で、店のメニュー向けです）。代わりに、車検・点検、保証プラン、下取り査定、ローンの相談、県外登録・自宅納車のような店のサービスを、料金と条件つきで登録します。llms.txtにも載ります。",
            "在庫ページは、在庫管理の仕組みやテーマが出す構造化データに任せます。Nurevo AEOは車（Car）の構造化データを出しません。在庫ページにすでに Car や Product が出ているか、テストツールで確かめ、出ていない場合は上の例を参考に制作会社と相談してください。",
            "よくある質問（総額の条件、県外への納車、下取り、ローン、保証の範囲、売約済の車の扱い）を入力し、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search/)をご覧ください。",
            "/llms.txt を開き、在庫一覧・店舗案内・保証や整備の説明・会社概要のページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。料金の書き方全般は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "ポータルサイト・Googleビジネスプロフィール・Bingとそろえる",
          paragraphs: [
            "中古車販売店の在庫は、自社サイトより先に、中古車のポータルサイトに載っていることが多いはずです。AIはポータルの掲載も読むので、サイトとポータルで支払総額・走行距離・保証の内容が違うと、どちらが正しいか定まらず、古いほうの情報が答えに使われることがあります。協議会の資料も、支払総額への変更にあたって、自社のWebサイトと中古車情報サイトの両方の表示を直すよう求めています。",
            "そろえる順番は、①在庫の元データ（管理の仕組み）→②自社サイト→③ポータル→④Googleビジネスプロフィール（営業時間・定休日・電話・サイトのURL）です。店の基本情報はBing Placesにも同じものを入れます。手順は[Bing PlacesのAI検索対策](/guide/bing-places-ai-search/)をご覧ください。",
          ],
          table: {
            head: ["そろえる事実", "自社サイト", "ポータル", "Googleビジネスプロフィール"],
            rows: [
              ["支払総額と条件", "在庫ページの本文", "掲載の価格欄と備考", "（載せる場合は商品の説明）"],
              ["走行距離・保証・整備・修復歴", "在庫ページの本文", "掲載の項目欄", "—"],
              ["売約済", "当日に「売約済」", "当日に掲載を終了", "—"],
              ["営業時間・定休日", "店舗案内とフッター", "店舗情報", "営業時間と特別営業時間"],
              ["古物商許可の表示", "フッターか会社概要", "店舗情報（欄があれば）", "—"],
            ],
            caption: "ポータルやGoogleビジネスプロフィールの欄の名前と有無は、サービスによって違います。この表はそろえる項目の考え方を示すものです。",
          },
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "価格がすべて「支払総額」で、内訳（車両価格＋諸費用）と条件（◯月現在、登録地域、店頭納車など）が文字で書かれている。",
            "「諸費用別途」「諸費用0円」「コミコミ価格」の表示が残っていない。",
            "在庫ページに、走行距離・保証の有無（期間・距離）・定期点検整備・修復歴の有無・車台番号（下3桁以上）が文字で書かれている。",
            "プライスボードや掲載の画像の中にだけある情報がない。",
            "売れた車が当日に「売約済」になり、構造化データも InStock のままになっていない。",
            "在庫一覧に「◯月◯日時点」の更新日がある。",
            "古物商の表示（氏名又は名称、公安委員会の名称、許可証の番号）がフッターか会社概要に文字である。",
            "店の構造化データの型が AutoDealer（または LocalBusiness）で、名前・住所・電話・営業時間が本文と同じ。",
            "自社サイト・ポータル・Googleビジネスプロフィール・Bing Placesで、価格・在庫・営業時間がそろっている。",
            "llms.txtに在庫一覧・店舗案内・保証と整備の説明・会社概要が載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、買う人が聞きそうな質問をAIに投げます。「◯◯市 中古車 軽自動車 総額100万円以下」「◯◯駅の近くの中古車販売店 修復歴なし」のような地域＋条件の質問で名前が出るかに加えて、店の名前を入れて「この店の価格は諸費用込み？」「県外にも納車できる？」と聞き、答えがサイトの事実と合っているかも見ます。売れた車を「ある」と答えていないかも確かめます。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、結果を記録します。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（店の名前は含めません）をPerplexityに投げ、回答に店の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在はPerplexity）。どちらも回答の一部を見本として調べるもので、すべての回答を見ているわけではありません。くわしくは[AIでの登場率の測り方](/guide/measure-ai-visibility/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "中古車販売店のAI検索対策は、何から始めればいいですか？", a: "まず、在庫ページの価格を「支払総額」と内訳・条件つきの文字にし、走行距離・保証・定期点検整備・修復歴を1台ずつ文字で書きます。次に、売れた車を当日に「売約済」にする運用を決め、古物商の表示をフッターに入れます。そのうえで、店の情報を AutoDealer の構造化データとllms.txtで出し、ポータルとGoogleビジネスプロフィールの情報をそろえます。" },
        { q: "支払総額の表示は、自社のホームページにも必要ですか？", a: "自動車公正取引協議会の資料は、Webサイトの広告の表示例を示し、自社のWebサイトと中古車情報サイトの表示の両方を支払総額に変えるよう求めています。協議会の会員でない場合の扱いなど細かいことは、協議会に確認してください。" },
        { q: "古物商の許可番号は、サイトのどこに書けばいいですか？", a: "古物営業法では「消費者の目につきやすい箇所に明瞭に」とされています。全ページのフッターか、会社概要・店舗案内のページに、氏名又は名称、許可をした公安委員会の名称、許可証の番号を文字で書くのが確実です。" },
        { q: "車1台ずつに構造化データは必要ですか？", a: "必須ではありません。schema.orgの Car で走行距離や初度登録年月を書けますが、Googleは車両の掲載の構造化データの説明を2025年9月に削除しており、検索結果の特別な表示は期待できません。まずは在庫ページの本文に事実を文字で書くことが先です。構造化データを使うなら、本文と同じ内容にし、売約済のときは一緒に直します。" },
        { q: "Nurevo AEOで、在庫の車を出せますか？", a: "いいえ。Nurevo AEOは店の情報（AutoDealerなど）、サービス、FAQ、llms.txtを出すもので、車1台ずつの構造化データは出しません。在庫ページは在庫管理の仕組みやテーマに任せ、Nurevo AEOには車検・保証・下取り・ローン相談などの店のサービスを登録します。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ず紹介されますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、価格と在庫の事実をAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの店のサイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOで店の情報とサービスを無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleはGoogle LLCの、BingはMicrosoft Corporationの商標です。N-BOXは本田技研工業株式会社の商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Used Car Dealers: Total Price, Stock, Trust | Nurevo",
      description: "AEO for used car dealers: show the total price with its breakdown, mileage, warranty, servicing and accident history per car, mark sold cars fast, and align portals.",
      h1: "AI search for used car dealers: getting AI to read your total prices, your stock and your licence details correctly",
      lead: "AI search optimization (AEO) for a used car dealer comes down to making your own site able to answer what buyers ask AI, such as \"Which dealers in [city] have a small car under $8,000 all-in?\" or \"Does this dealer's price include fees?\" Show each price as the total payable amount with its breakdown and conditions, write mileage, warranty, servicing and accident history for every car as text, mark sold cars as sold the same day, show your dealer licence details, and keep the same facts on your listing portals and Google Business Profile.",
      intro: [
        "Written November 24, 2026 (JST). The display rules described here are Japanese: the used-car advertising code of the Japan Fair Trade Council for Automobiles (AFTC) and the Antique Dealings Act as explained by the Tokyo Metropolitan Police, as cited in the text. Rules differ by country and state, so check the ones that apply where you sell. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention you or rank you anywhere.",
      ],
      sections: [
        {
          heading: "What buyers ask AI about used cars",
          paragraphs: [
            "Used car buyers usually start from a model and a budget, then narrow down by where to buy, whether the advertised price is what they will actually pay, and whether the car is in good shape. AI answers these questions by combining dealer sites, portal listings, map data and reviews. If your site does not state the conditions in text, AI leans on other sources or answers vaguely, without the conditions.",
          ],
          table: {
            head: ["Question type", "Example", "Facts AI needs from the dealer"],
            rows: [
              ["Budget", "\"Which dealers have a minivan under $10,000 all-in?\"", "The total payable price, its breakdown (vehicle + fees) and its conditions (where it is registered, how it is handed over)"],
              ["Stock", "\"Who has a [model] in [city]?\"", "Model, trim, first registration, mileage, colour, and whether it is still for sale"],
              ["Condition", "\"Cars with no accident history and a warranty?\"", "Accident repair history, warranty yes/no with length and mileage, servicing before handover"],
              ["How to buy", "\"Finance? Part-exchange? Delivery out of state?\"", "Whether you offer finance, trade-ins, out-of-area registration and home delivery, and what each costs extra"],
              ["Trust", "\"Is this a proper dealer?\"", "Licence details, address, hours, closed days, replies to reviews"],
              ["Advice", "\"An economical car for a family of four?\"", "The kinds of car you specialise in, how you advise, and whether test drives are possible"],
            ],
            caption: "The example questions illustrate the point. They are not a measurement of how often people ask them.",
          },
        },
        {
          heading: "What the top guides leave out",
          paragraphs: [
            `On November 24, 2026 we picked 13 top-ranking articles in Japanese and English for queries such as "car dealership AI search" and "中古車販売店 AI検索対策", and read 11 (two could not be retrieved). The Japanese articles mostly cover sales and repair together. Only [Uravation's article](${SRC.uravation}) mentioned Japan's total-price rule, and [Kadai Kaiketsu Platform's article](${SRC.zeroOne}) gave a concrete way to measure: ask AI the same set of questions every month and record the results. None covered licence display, handling of sold cars, WordPress steps or per-car structured data.`,
            `Five of the six English articles come from companies that sell products to dealers, and most of their statistics are unsourced or from their own surveys. [Keyloop](${SRC.keyloop}) suggests filtering server logs for AI bots and [Marchex](${SRC.marchex}) suggests call tracking, which are useful. None gives a working vehicle markup example or explains how to state an all-in price precisely. And Google removed its vehicle listing structured data documentation in September 2025 (more below). This guide fills those gaps, using Japan's display rules as the worked example.`,
          ],
        },
        {
          heading: "Show the total payable price, with the breakdown and conditions in text",
          paragraphs: [
            `Since October 1, 2023, Japan's used-car advertising code has required dealers to show a "total payable amount" (支払総額) whenever they show a price. It is the vehicle price plus fees, shown with the breakdown and with conditions such as when and where the car is registered. Only insurance (compulsory), taxes and registration-related charges (paperwork for inspection, registration and parking certificates) count as fees. [AFTC: the total payable price rule (PDF, Japanese)](${SRC.aftcTotal})`,
            "Preparation charges, pre-delivery inspection and servicing, sales commission and advertising costs cannot be added as separate fees; they belong in the vehicle price. If a warranty or service plan is a condition of sale, its cost goes into the vehicle price too. The AFTC materials do not allow \"fees: 0\" or names such as \"all-in price\" in place of the term \"total payable amount\". [AFTC pamphlet (PDF)](" + SRC.aftcPamph + ") / [AFTC advertising checklist (PDF)](" + SRC.aftcCheck + ")",
            "Even outside Japan, this is exactly what makes a price usable by AI. A bare number, or a price that exists only inside an image, gives AI no way to tell whether it is the total or the car alone. Put the total, the breakdown and the conditions in one sentence of text.",
          ],
          table: {
            head: ["How the price is written", "What AI can read", "Fix"],
            rows: [
              ["\"$7,900\" alone", "Cannot tell total from vehicle-only", "\"Total payable $8,900 (vehicle $8,100 + fees $800)\""],
              ["\"Plus fees\"", "In Japan, listed as a violation example", "Show the total and breakdown, with conditions"],
              ["A total with no conditions", "Read as available at that price to anyone, anywhere", "\"As of November 2026, registered in this state, collected at our lot\""],
              ["Only a photo of the price board", "Text in images may not be read", "Write the same details as text on the car's page"],
              ["An old total", "Site and portal disagree, so AI cannot tell which is right", "When you cut a price, update the site and the portals on the same day"],
            ],
            caption: "The AFTC materials ask dealers to update the total promptly when it changes, and say that writing \"as of [month]\" alone does not solve the problem.",
          },
          after: [
            "According to press coverage of the AFTC's survey, about nine in ten consumers wanted the total payable amount shown. [Kuruma News, October 1, 2023 (Japanese)](" + SRC.kurumaNews + "). Buyers who ask AI to compare prices all-in are served best by dealers that state the total and its conditions.",
          ],
        },
        {
          heading: "Facts to write for every car: mileage, warranty, servicing, accident history",
          paragraphs: [
            "The AFTC's checklist for used-car advertising (April 2020) lists seven items that an advert must show. It doubles as the list of facts AI needs to answer \"is this car in good shape?\"",
          ],
          table: {
            head: ["Item", "Example", "What it lets AI answer"],
            rows: [
              ["Vehicle price (cash price)", "Vehicle price $8,100", "The breakdown of the total"],
              ["Total payable amount", "Total payable $8,900 (as of [month], registered locally, collected at the lot)", "Budget questions, with conditions"],
              ["Mileage", "31,000 km", "\"Low-mileage cars\""],
              ["Warranty yes/no", "12-month warranty, no mileage limit / no warranty", "\"Cars with a warranty\", down to length and mileage"],
              ["Servicing before handover", "Serviced before handover (included in the vehicle price) / not serviced", "What the dealer does before handing over"],
              ["Accident repair history", "No accident repair history / has repair history", "\"No accident history\""],
              ["Chassis number", "Last three digits \"…123\"", "Recognising the same car across several sites"],
            ],
            caption: "Based on the required items in the AFTC checklist (April 2020 edition). Where every car has a warranty or no repair history, say \"all cars\". The checklist does not define which repairs count as repair history; check the AFTC's materials.",
          },
          after: [
            "The checklist lists describing a registered but unused car as \"unused, 0 km\" as a possible misleading claim. For AI too, plain numbers and the registration status lead to more accurate, conditional mentions than strong wording.",
          ],
        },
        {
          heading: "Handling sold cars and stock pages",
          paragraphs: [
            "Every used car is a single item. If a sold car's page still says it is for sale, AI may tell buyers you have it, and the enquiry ends in disappointment. Out-of-date source information is one of the common reasons AI gets a business wrong.",
          ],
          list: [
            "On the day a sale is agreed, mark the car's page as sold and remove the price or show \"sold\" beside it. Update the portal listings the same day.",
            "If you keep sold pages for a while, write \"Sold\" as text near the heading and link to similar cars in stock. If you do not keep them, delete them and remove them from the stock list.",
            "Put the date of the last update on the stock list, with a sentence such as \"Stock shown as of [date]\".",
            "If you use structured data, set availability to SoldOut or remove it together with the page. Do not leave a sold page with InStock data.",
            "On your home or About page, say that stock changes daily and where the current stock list is. That makes it easier for AI to tell buyers to confirm by phone.",
          ],
          after: [
            "Causes of drift and how to fix them are covered in [why AI visibility drops or goes wrong](/guide/ai-visibility-drop-causes/).",
          ],
        },
        {
          heading: "Licence details on the site (Japan: the second-hand dealer display)",
          paragraphs: [
            `In Japan, buying and selling used cars is a second-hand dealing business. Licensed second-hand dealers must show on their website their name, the name of the Public Safety Commission that granted the licence, and the licence number (Antique Dealings Act, Article 12(2), in force from April 1, 2024). Businesses with five or fewer regular employees are exempt, but dealers registered for internet transactions must show these details regardless of size. The display must be clear and easy for consumers to see. [Tokyo Metropolitan Police: 2024 amendment (Japanese)](${SRC.mpdKobutsu})`,
            `Dealers who trade online also register their website URL with the Public Safety Commission, and prefectural police publish the list of names, URLs and licence numbers. [Shizuoka Prefectural Police (Japanese)](${SRC.shizuoka}). If you change your site's URL in a redesign or domain move, check whether the registration needs updating.`,
            "This is a legal display, but for AI it is also a concrete signal that the dealer exists and is licensed. Put it as text, not an image, in the footer or on your company or About page. Outside Japan, show whatever dealer licence or registration your jurisdiction requires in the same way.",
          ],
        },
        {
          heading: "Business structured data: AutoDealer",
          paragraphs: [
            `schema.org has [AutoDealer](${SRC.autoDealer}) for dealerships. It is a kind of LocalBusiness (under AutomotiveBusiness). Publish your business with this type, using the same name, address, phone and hours as the page text (checked in schema-dts 2.1.0, November 24, 2026).`,
          ],
          code: SCHEMA_DEALER_EN,
        },
        {
          heading: "Each car as Car markup, and what changed at Google",
          paragraphs: [
            `Each car in stock can be described with [Car](${SRC.car}), a kind of Vehicle and Product. It has properties for the first registration date (dateVehicleFirstRegistered), mileage (mileageFromOdometer), fuel, transmission, colour and a text description of known damages, repaired and unrepaired (knownVehicleDamages). The price goes in an Offer. In the example below, the price is the total payable amount, and the breakdown, conditions, warranty and servicing are in the description, in the same words as the page.`,
          ],
          code: SCHEMA_CAR_EN,
          after: [
            `One caution. Google launched vehicle listing structured data for dealers in October 2023, but on September 9, 2025 it removed the documentation, saying the type is no longer shown in Google Search results. [Google: Search Central updates](${SRC.googleUpdates}) / [2023 announcement](${SRC.googleVehicleBlog}). So do not expect Car markup to earn a special search feature. Google also says its AI features need no special markup. [Google: AI features and your website](${SRC.googleAi}). Treat Car markup as a machine-readable copy of the facts on the page: include only what is visible there, and never let it drift from the page.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress dealer site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit can stay; the structured data does not duplicate.`,
            "In the setup wizard, choose \"Other\" and enter your address, phone number and opening hours (including closed days). The wizard has no car dealer card, so afterwards go to Settings and enter AutoDealer in \"Business type (schema.org type)\". Your business is then published with that type.",
            "In the business description, say what kinds of car you mainly sell, roughly how many are on the lot, that every price is shown as the total payable amount, and your licence details.",
            "Do not add individual cars as Nurevo AEO services (services are capped at 20 and are meant for your menu). Add your own services instead, such as inspections and servicing, warranty plans, trade-in valuations, finance advice and out-of-area registration or home delivery, with prices and conditions. They also appear in llms.txt.",
            "Leave the car pages to your inventory system or theme. Nurevo AEO does not publish Car markup. Use a testing tool to see whether your stock pages already carry Car or Product data; if not, use the example above as a starting point with your developer.",
            "Enter frequently asked questions (conditions of the total price, out-of-area delivery, trade-ins, finance, warranty cover, what happens to sold cars) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode). See [AI search for FAQ pages](/guide/faq-page-ai-search/).",
            "Open /llms.txt and check that the stock list, About page, warranty and servicing pages and company page are listed. Run the diagnosis on the AEO score screen and fix what is missing.",
          ],
          after: [
            "The same checks apply to sites not built on WordPress. Enter your URL in the [free check](/check) (no sign-up) to see the state of your structured data, llms.txt and AI crawler access. For writing prices in general, see [AI search for pricing pages](/guide/pricing-page-ai-search/).",
          ],
        },
        {
          heading: "Keep portals, Google Business Profile and Bing in step",
          paragraphs: [
            "A dealer's stock often appears on used-car portals before, or instead of, the dealer's own site. AI reads those listings too, so if the site and a portal disagree on the total price, mileage or warranty, AI cannot tell which is right and may use the older one. In Japan, the AFTC also asked dealers to change both their own websites and their used-car portal listings when the total-price rule came in.",
            "Update in this order: (1) the source data in your inventory system, (2) your own site, (3) the portals, (4) Google Business Profile (hours, closed days, phone, website URL). Enter the same business details in Bing Places as well; see [AI search and Bing Places](/guide/bing-places-ai-search/).",
          ],
          table: {
            head: ["Fact", "Your site", "Portals", "Google Business Profile"],
            rows: [
              ["Total price and conditions", "Text on the car page", "Price field and notes", "(Product description, if you list cars)"],
              ["Mileage, warranty, servicing, repair history", "Text on the car page", "Listing fields", "—"],
              ["Sold", "Marked sold the same day", "Listing ended the same day", "—"],
              ["Hours and closed days", "About page and footer", "Dealer information", "Hours and special hours"],
              ["Licence details", "Footer or company page", "Dealer information (if there is a field)", "—"],
            ],
            caption: "Field names, and whether a field exists, differ between portals and services. The table shows which facts to align, not exact field names.",
          },
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Every price is a total payable amount, with the breakdown (vehicle + fees) and conditions (as of [month], where registered, how handed over) in text.",
            "No \"plus fees\", \"fees: 0\" or \"all-in price\" wording remains.",
            "Each car page states mileage, warranty (length and mileage), servicing before handover, accident repair history and (in Japan) the last three digits of the chassis number as text.",
            "No fact exists only inside a price-board photo or listing image.",
            "Sold cars are marked sold the same day, and their structured data is not left as InStock.",
            "The stock list shows an \"as of [date]\" update date.",
            "Licence details are in the footer or on the company page as text.",
            "The business structured data type is AutoDealer (or LocalBusiness), and name, address, phone and hours match the page.",
            "Prices, stock and hours match across your site, the portals, Google Business Profile and Bing Places.",
            "llms.txt lists the stock list, About page, warranty and servicing pages and company page. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI mentions you, and whether it is right",
          paragraphs: [
            "Once your pages are in order, put the questions buyers would ask to AI. Check whether your name comes up for area-plus-condition questions such as \"used small car under $8,000 all-in in [city]\" or \"dealers near [station] with no accident history\", and also ask with your name, such as \"Does this dealer's price include fees?\" or \"Do they deliver out of state?\", to see whether the answers match your site. Check that AI does not say you still have cars you have sold.",
            "AI answers change between runs, so ask the same questions several times, spread over time, and keep a record. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a used car dealer start with AI search?", a: "First, rewrite each car's price as a total payable amount with its breakdown and conditions, and write mileage, warranty, servicing and accident history for every car as text. Then set a rule to mark sold cars the same day and put your licence details in the footer. After that, publish your business as AutoDealer structured data and in llms.txt, and align your portals and Google Business Profile." },
        { q: "Does the total-price rule in Japan apply to a dealer's own website?", a: "The AFTC materials include a website advert example and ask dealers to change both their own websites and their used-car portal listings to the total payable amount. For details, such as how the rule applies to non-members, ask the AFTC." },
        { q: "Where on the site should licence details go?", a: "Japan's Antique Dealings Act requires a clear display that is easy for consumers to see. Putting the name, the granting Public Safety Commission and the licence number as text in the footer of every page, or on the company page, is the safest choice." },
        { q: "Does every car need structured data?", a: "No. Car markup can carry mileage and first registration date, but Google removed its vehicle listing documentation in September 2025, so do not expect a special search feature. Writing the facts as text on the car page comes first. If you use markup, keep it identical to the page and update it when the car sells." },
        { q: "Can Nurevo AEO publish my stock?", a: "No. Nurevo AEO publishes your business (such as AutoDealer), services, FAQs and llms.txt, not per-car data. Leave car pages to your inventory system or theme, and add dealer services such as servicing, warranty plans, trade-ins and finance advice to Nurevo AEO." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends my dealership?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your price and stock facts easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your dealer site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your business details and services for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Google of Google LLC, and Bing of Microsoft Corporation. Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
