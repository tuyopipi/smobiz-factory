// Content page: AI search (AEO) for activity and tour operators (体験アクティビティ・
// ツアー事業者). Industry page.
// Angle: the facts AI needs to answer "what can I do in X this weekend, for kids,
// in English, if it rains?" are one page per experience with the time breakdown,
// meeting point, total price and what it includes, who can join, the minimum
// group and weather rules, the cancellation fee table, the guide's languages,
// and the booking cut-off. Plus: where 旅行業登録 comes in (transport or lodging),
// the 特定商取引法 final confirmation screen for online booking, and how
// Google Things to do checks the feed against the operator's own landing page.
// Separate from hotels (PR #62, unmerged), lesson-studio-ai-search (classes for
// locals) and multilingual-site-ai-search (URL / hreflang design).
//
// Written 2026-11-24 17時 (JST). Nurevo AEO facts come from the plugin source and
// readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2):
// webmcp_canary_business_schema_type() publishes the Settings "Business type
// (schema.org type)" value when it is a valid type name, else LocalBusiness
// when address/phone/hours exist; services (up to 20) become Service + Offer +
// ReserveAction and an llms.txt line; FAQ block / [nurevo_faq]; monthly free
// check (three questions to Perplexity, never the business name); Pro
// measurement (beta) on Perplexity. Nurevo does not output TouristTrip or
// Things to do feeds. Prices: Free 0, Standard 3,000 JPY / USD 20, Pro from
// 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-24):
// - 観光庁「旅行業法の概要」(最終更新 2026-04-30): registration for 旅行業/代理業 for
//   acts in 第2条 (not listed on the page); 第1種 is 観光庁長官, others 都道府県知事;
//   地域限定旅行業務取扱管理者 for own 市町村 and adjacent ones.
// - 和歌山県 旅行業 page: registration needed when the tour includes buses,
//   rail, planes or lodging; exceptions such as a bus operator or lodging
//   selling its own tours; 登録番号 formats (観光庁長官登録旅行業第◯号 /
//   ◯◯県知事登録旅行業第2・3・地-◯号).
// - 観光庁サイト掲載 PDF 001885296 (観光コンテンツ販路構築の手引き, 中部運輸局):
//   運送・宿泊を伴うコンテンツの販売には原則として旅行業の登録が必要; 体験コンテンツ
//   and ガイドツアー are listed separately from 交通付き・宿泊付き. It does NOT say a
//   standalone experience is exempt, so the article says "check 第2条 and the
//   prefecture".
// - 「通信販売の申込み段階における表示についてのガイドライン」(JCCI archive copy,
//   issue date not shown): 第12条の6 covers 役務; 最終確認画面 shows 分量 (提供期間・
//   回数), 価格, 支払時期・方法, 提供時期, 申込期間 (only when set), 申込みの撤回・解除
//   の条件・方法・効果; restricted cancellation methods on the screen itself.
// - Google Ads help 10723429 "Introducing Things to do on Google": free listings
//   and ads; connectivity partners strongly recommended for a single operator or
//   a system with fewer than 100 operators; direct integration via intake form.
// - Google Ads help 13149532 "Things to do official site policies": booking page
//   may be on another domain if the operator site clearly links to it, verified
//   via GBP among others; no generalised landing pages; INVENTORY_TYPE_
//   OPERATOR_DIRECT for operators' own booking page; misrepresentation removes
//   the badge.
// - Actions Center "Experiences product optimization" (2026-09-10): price for
//   one adult, multi-currency price_options; locations checked against the
//   landing page; detailed description, highlights, inclusions/exclusions, no
//   exaggeration; cancellation_policy; localized content.
// - Actions Center "Operator booking module optimization" (2026-04-01): operator
//   name visible on the landing page; GBP name; correct GBP category.
// - schema-dts 2.1.0: TouristTrip (Trip: itinerary, offers, provider,
//   arrivalTime, departureTime; TouristTrip: touristType), TouristAttraction
//   (availableLanguage, touristType).
// - PhocusWire (2026, date not shown in fetch): Phocuswright 56% of US leisure
//   travelers use AI for travel, 35–40% in UK/FR/DE (secondary).
// - Google "AI features and your website" (checked earlier): no special markup.
// Top articles read 2026-11-24: uravation 体験・観光アクティビティ (2026-10-12),
// uravation 観光協会・DMO (2026-10-13), 0120.co.jp ホテル・観光業 AIO (2026-07-21,
// upd 10-22), GOOD LUCK TRIP コラム (undated, ~late 2025), 観光庁 生成AI活用
// (2025-03, business use only); Rezdy (2026-03-28, gated), FareHarbor LLM-friendly
// (2025-11-10, upd 2026-07-22), FareHarbor SEO→AIO (2026-03-01, upd 07-22), Rezgo
// (2025-07-22, upd 2026-05-01), TrekkSoft (2026-07-31), WP Travel Engine
// (2026-07-01, upd 07-27), TOMIS (2026-07-06), PhocusWire (news).
// Not verified, so not stated: the text of 旅行業法第2条 and 第12条の7/12条の8
// (e-Gov not readable), 特商法第11条 list (caa.go.jp not readable), Things to
// do price policy (taxes/fees), supported languages, connectivity partner names
// in Japan, insurance or safety rules for specific activities (water, mountain).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  kankochoLaw: "https://www.mlit.go.jp/kankocho/seisaku_seido/ryokogyoho/ryokogyohogaiyo.html",
  wakayama: "https://www.pref.wakayama.lg.jp/prefg/130300/01/d00216211.html",
  contentGuide: "https://www.mlit.go.jp/kankocho/content/001885296.pdf",
  mailorderGuideline: "https://archive.jcci.or.jp/consumer_transaction_cms202_220209_07.pdf",
  ttdIntro: "https://support.google.com/google-ads/answer/10723429?hl=en",
  ttdOfficial: "https://support.google.com/google-ads/answer/13149532?hl=en-GB",
  ttdExperience: "https://developers.google.com/actions-center/verticals/things-to-do/guides/partner-integration/experiences-product-optimization",
  ttdOperator: "https://developers.google.com/actions-center/verticals/things-to-do/guides/partner-integration/obm-product-optimization",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  touristTrip: "https://schema.org/TouristTrip",
  localBusiness: "https://schema.org/LocalBusiness",
  phocus: "https://www.phocuswire.com/news/technology/tour-operators-question-ota-rankings-ai-changes-travel-discovery",
  uravation: "https://uravation.com/llmo/taiken-kanko-activity-llmo-taisaku/",
  fareharbor: "https://fareharbor.com/blog/how-to-make-your-tour-website-llm-friendly",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#organization",
      "name": "例リバーアクティビティ（例）",
      "description": "◯◯川でのカヌー体験と、渓谷の散策ガイドツアーを行っています。ガイドは日本語と英語に対応。集合は◯◯駅から徒歩5分の当社ベース。宿泊や交通の手配は行っていません。",
      "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯町◯◯1-2-3" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Mo-Su 08:30-17:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "カヌー体験 半日（約3時間・水上約90分）",
      "description": "集合9:00・解散12:00頃。受付と着替え20分、説明と練習30分、川下り約90分、送迎車でベースに戻り着替え。料金は税込で、ガイド・カヌー・ライフジャケット・ウェットスーツ・保険料を含みます。6歳から参加可（12歳以下は保護者と同じ艇）。泳げなくても参加できます。最少催行2名。増水・雷のときは当日7:00までに中止を連絡し、全額返金。お客様都合のキャンセルは前日50%、当日100%。",
      "category": "体験アクティビティ・カヌー",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": { "@type": "Offer", "price": "8800", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/booking/canoe-half-day/" },
        "result": { "@type": "Reservation", "name": "カヌー体験 半日" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.com/#organization",
      "name": "Example River Adventures",
      "description": "Canoe trips on the Example River and guided gorge walks. Guides speak English and Spanish. Meet at our base, a 5-minute walk from Example Station. We do not arrange lodging or transport.",
      "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 River Rd, Example Town" },
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Mo-Su 08:30-17:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Half-day canoe trip (about 3 hours, about 90 minutes on the water)",
      "description": "Meet 9:00, finish around 12:00. Check-in and changing 20 min, briefing and practice 30 min, about 90 min on the river, then our van back to base. Price includes tax, guide, canoe, life jacket, wetsuit and insurance. Ages 6 and up (12 and under share a boat with a parent). You do not need to swim. Minimum 2 guests. If the river is high or there is lightning we cancel by 7:00 on the day and refund in full. Your own cancellation: 50% the day before, 100% on the day.",
      "category": "Outdoor activity, canoeing",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": { "@type": "Offer", "price": "60", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/booking/canoe-half-day/" },
        "result": { "@type": "Reservation", "name": "Half-day canoe trip" }
      }
    }
  ]
}`;

export default {
  slug: "activity-tour-operator-ai-search",
  targetQueries: [
    "tour operator AI search optimization",
    "activity business ChatGPT recommendation",
    "tour schema markup TouristTrip",
    "体験アクティビティ AI検索対策",
    "ツアー会社 LLMO 集客",
    "観光体験 ChatGPT 予約 載る",
  ],
  related: ["booking-page-ai-search", "pricing-page-ai-search", "multilingual-site-ai-search", "business-hours-holidays-ai-search", "faq-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "体験アクティビティ・ツアーのAI検索対策：中止条件と料金の書き方 | Nurevo",
      description: "体験・ツアー事業者のAI検索対策は、1つの体験に1ページを作り、所要時間の内訳、集合場所、税込の総額と含まれるもの、参加条件、雨天・中止とキャンセル料、ガイドの言語を本文と構造化データで同じに出すこと。",
      h1: "体験アクティビティ・ツアー事業者のAI検索対策：所要時間、参加条件、雨の日の中止とキャンセル料をAIに正しく読ませる",
      lead: "体験アクティビティやガイドツアーのAI検索対策（AEO）の中心は、AIに「◯◯で子どもと半日でできる体験は？」「雨でもやってる？」「英語のガイドはいる？」と聞かれたときに、自分のサイトが条件ごとに答えられる状態にすることです。体験ごとに1ページを作り、所要時間の内訳、集合場所、税込の総額と含まれるもの、年齢や体力の条件、最少催行人数と天候による中止の決め方、キャンセル料、ガイドの言語を本文に文字で書き、同じ事実を構造化データとllms.txtで公開します。OTA（旅行予約サイト）やGoogleの掲載ともそろえます。",
      intro: [
        "作成日：2026年11月24日（JST）。法律・行政・Googleの情報は、本文に記した観光庁・和歌山県・Googleの公式ページなどで確認したものです。この記事は法的な助言ではありません。旅行業の登録が必要かどうかは、商品の中身によって変わるので、都道府県の窓口に確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが体験の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。地元の人が通う教室は[習い事・レッスン教室のAI検索対策](/guide/lesson-studio-ai-search/)、言語ごとのページの作り方は[多言語サイトのAI検索対策](/guide/multilingual-site-ai-search/)で扱っています。",
      ],
      sections: [
        {
          heading: "体験・ツアーについて、AIはどんな質問をされているか",
          paragraphs: [
            "旅行の計画では、行き先が決まったあとに「そこで何をするか」を探します。このとき聞かれるのは、店の名前ではなく条件です。日程・同行者・天気・言語・予算が重なった質問に、AIは複数の体験を並べて答えます。条件の答えがページに書いてあれば、AIはそれを根拠に「小学生から参加でき、雨でも催行する◯◯」と紹介できます。書いていなければ、OTAの掲載や口コミから推測するか、候補から外します。",
            `旅行でAIを使う人は増えています。旅行業界のニュースサイトPhocusWireは、米国のレジャー旅行者の56%が旅行にAIを使い、英国・フランス・ドイツでは35〜40%だというPhocuswrightの調査を紹介しています（二次情報）。[PhocusWire](${SRC.phocus})。日本の旅行者についての同じ形の数字は、この記事では確かめられていません。`,
          ],
          table: {
            head: ["よくある質問の型", "質問の例", "AIが答えに必要な、事業者側の事実"],
            rows: [
              ["時間", "「半日で終わる体験は？」「午後からでも間に合う？」", "集合・解散の時刻、所要時間の内訳（受付・説明・本番・移動）"],
              ["同行者", "「5歳の子どもでもできる？」「70代の親と行ける？」", "年齢の下限・上限、体力の目安、泳げなくてよいか、車いすの可否"],
              ["天気", "「雨だと中止？」「雨の日でもできる体験は？」", "雨天催行か、中止の基準と連絡の時刻、中止のときの返金"],
              ["言語", "「英語のガイドツアーはある？」", "ガイドが話せる言語、日によって違うか、資料だけの対応か"],
              ["料金", "「全部込みでいくら？」", "税込の総額、含まれるもの（道具・保険・送迎・入場料）と含まれないもの"],
              ["予約", "「当日でも予約できる？」「キャンセル料は？」", "予約の締切、最少催行人数、キャンセル料の表、予約のURL"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            "2026年11月24日に、日本語と英語で「体験アクティビティ AI検索対策」「tour operator AI search」などの上位記事を13本読みました。日本語では、体験・観光アクティビティに絞った記事（2026年10月）が、1体験1ページで情報をまとめることや、OTA・自社予約・地図の役割分担を整理していました。一方で、構造化データのコード、WordPressでの手順、旅行業の登録や通信販売の表示といった日本の決まりは、具体的には書かれていませんでした。ほかは宿泊施設や観光協会・DMO向けの記事、AIの話が中心のコラム、観光庁の業務での生成AI活用の資料で、体験事業者のサイトの作り方を扱うものではありませんでした。",
            `英語の8本は、ニュース1本を除き予約システムやAI計測ツールの会社の記事でした。FareHarborの記事はTouristTripなどの型の名前を挙げていますが、コードの例はありません。[FareHarbor](${SRC.fareharbor})。8本とも、雨天・中止の決め方とキャンセル料の書き方、法律上の表示、Googleの「Things to do」が掲載とサイトをどう照らし合わせるかには触れていませんでした。この記事では、その抜けを公式の情報で埋めます。`,
          ],
        },
        {
          heading: "1つの体験に1ページ：ページに書く9つの事実",
          paragraphs: [
            "「アクティビティ一覧」のページに全部の体験を短く並べるだけだと、AIはどの条件がどの体験のものか区別しにくくなります。体験ごとにページを分け、次の9つを文字で書きます。料金表やコースの説明を画像やPDFだけで載せている場合は、本文にも同じ内容を書きます。",
          ],
          table: {
            head: ["書く事実", "書き方の例", "抜けているとAIが困ること"],
            rows: [
              ["所要時間の内訳", "「集合9:00、解散12:00頃。受付・着替え20分、練習30分、川下り約90分」", "「3時間」だけだと、水の上が何分か、午後の予定に間に合うかを答えられない"],
              ["集合場所と行き方", "「◯◯駅から徒歩5分のベース。駐車場10台・無料」", "近くの別の施設と取り違える、車で行けるか答えられない"],
              ["税込の総額と含まれるもの", "「8,800円（税込）。道具・ウェットスーツ・保険料込み。写真データは別料金1,000円」", "「全部込みでいくら？」に答えられない、追加料金を見落とす"],
              ["参加できる人", "「6歳から。12歳以下は保護者と同じ艇。泳げなくても可。妊娠中の方は不可」", "子ども連れ・高齢の家族の質問に条件をつけずに答えてしまう"],
              ["最少催行人数", "「2名から催行。1名の予約は前日17時に催行を連絡」", "1人旅の人が予約してよいかわからない"],
              ["天候による中止", "「小雨は催行。増水・雷・警報のときは当日7:00までに中止を連絡し、全額返金」", "「雨でもやってる？」に推測で答える"],
              ["キャンセル料", "「お客様都合：前日50%、当日100%」", "予約前の質問に答えられない、OTAの規定と混ざる"],
              ["ガイドの言語", "「日本語・英語（毎日）。中国語は土日のみ、要予約」", "英語の可否を間違える、日による違いが伝わらない"],
              ["予約の方法と締切", "「前日18時までにWeb予約。当日は電話で空きを確認」", "当日の予約ができるかを答えられない"],
            ],
            caption: "書き方の例は、この記事の架空の体験の例です。金額や条件は自分の体験の事実に置きかえてください。",
          },
          after: [
            "体験の名前には、何をするかと長さを入れます（例：「カヌー体験 半日（約3時間）」）。「◯◯川アドベンチャーA」のような社内の呼び方だけだと、AIはどんな体験かを名前から読み取れません。料金ページの書き方全般は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)、季節や曜日で変わる営業日は[営業時間・定休日のAI検索対策](/guide/business-hours-holidays-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "雨の日・中止・キャンセルの書き方：あいまいな言葉を条件に置きかえる",
          paragraphs: [
            "体験の予約で一番多い不安は、天気と当日の中止です。「天候により中止の場合があります」とだけ書くと、AIは「雨でも催行するか」を判断できず、OTAの一般的な規定や口コミの一文を根拠に答えてしまうことがあります。中止は、何を基準に、いつ、誰が決めて、どう連絡し、お金がどうなるかを、条件として書きます。",
          ],
          table: {
            head: ["避けたい表現", "理由", "代わりに書く事実の例"],
            rows: [
              ["「天候により中止の場合があります」", "どの天気で中止か、いつわかるかがない", "「小雨は催行。増水・雷・暴風警報のときは中止。前日18時と当日7時に判断します」"],
              ["「中止の場合はご連絡します」", "連絡の方法と時刻がない", "「予約時のメールとSMSに、当日7:00までに連絡します」"],
              ["「返金いたします」", "全額か、手数料が引かれるかがない", "「当社判断の中止は全額返金（決済手数料も当社負担）。日程の振替もできます」"],
              ["「キャンセル規定はお問い合わせください」", "予約前の質問に答えられない", "「お客様都合：7日前まで無料、前日50%、当日・連絡なし100%」"],
              ["「初心者でも安心」", "どこまでの人が参加できるかがわからない", "「はじめての方が9割です。泳げなくても参加できます。体重◯kg以上の方はご相談ください」"],
            ],
            caption: "この記事が勧める書き換えです。キャンセル料の金額や割合は例で、相場を示すものではありません。",
          },
          after: [
            "OTAで売っている体験は、OTA側のキャンセル規定が自社サイトと違うことがあります。違う場合は、自社サイトに「◯◯（OTA名）でのご予約は、◯◯の規定が適用されます」と書いておくと、AIが規定を混ぜて答えるのを防ぎやすくなります。",
          ],
        },
        {
          heading: "日本の決まり：旅行業の登録と、ネット予約の最終確認画面",
          paragraphs: [
            `体験の内容によっては、旅行業法の登録が関わります。観光庁は、報酬を得て旅行業法第2条に定める行為を事業として行う場合は、旅行業または旅行業者代理業の登録が必要だと説明しています（第1種は観光庁長官、それ以外は都道府県知事）。[観光庁：旅行業法の概要](${SRC.kankochoLaw})。和歌山県の案内は、バスや鉄道などの運輸機関の利用や宿泊を含む旅行商品を売る場合に登録が必要になると書いています。[和歌山県：旅行業](${SRC.wakayama})。観光庁のサイトに掲載されている「観光コンテンツ販路構築の手引き」も、運送・宿泊を伴うコンテンツの販売には原則として旅行業の登録が必要だとしています。[観光コンテンツ販路構築の手引き（PDF）](${SRC.contentGuide})。`,
            "つまり、「駅からの送迎つき」「宿泊とセット」のように運送や宿泊を組み合わせて売るときは、登録の要否を必ず確かめます。自社の体験だけを売る場合の扱いは、上の資料では言い切られていないので、この記事でも断定しません。商品の組み立てを決める前に、都道府県の旅行業の窓口に確認してください。登録している場合は、和歌山県の案内にある「◯◯県知事登録旅行業第2-◯◯号」のような登録番号を、会社概要とフッターに文字で書きます。AIにとっても、どの範囲を扱える事業者かがわかる事実になります。",
            `自社サイトでネット予約を受ける場合は、特定商取引法の通信販売の決まりも関わります。消費者庁の「通信販売の申込み段階における表示についてのガイドライン」は、サービス（役務）の申込みも対象で、申込みを確定する最終確認画面に、サービスの内容と回数・期間、価格、支払の時期と方法、提供の時期、申込みの撤回・解除の条件と方法を表示するよう求めています。[ガイドライン（日本商工会議所の掲載の写し、PDF）](${SRC.mailorderGuideline})。キャンセル料の表を予約画面とサイトの両方に同じ内容で書いておくことは、法律の面でもAI検索の面でも役に立ちます。`,
          ],
        },
        {
          heading: "Googleの「Things to do」：掲載はフィードで、照らし合わせるのはあなたのページ",
          paragraphs: [
            `Googleの検索やマップには、体験やツアーを予約先つきで並べる「Things to do」があります。Googleの説明では、無料の掲載と、クリックされたときに費用がかかる広告の2つがあり、事業者は予約システムなどの接続パートナーを通じて参加します。個人の事業者や、扱う事業者が100未満の予約システムには、接続パートナーを使うことを強く勧めています。[Google 広告ヘルプ：Things to do on Google](${SRC.ttdIntro})。サイトに構造化データを書いても、それだけでThings to doに載るわけではありません。`,
            `大事なのは、Googleが掲載の情報を事業者のページと照らし合わせている点です。公式サイトのバッジの決まりでは、予約ページが別のドメインにあってもよいものの、事業者のサイトからその予約ページへはっきりリンクしていることが条件で、Googleビジネスプロフィールなどで確かめるとしています。重要な情報を探すのに別のページへ移動させるような、一般的なトップページを予約先にすることは認めていません。[Google 広告ヘルプ：Things to do official site policies](${SRC.ttdOfficial})。商品の最適化ガイドは、価格を大人1人の参加に必要な金額にすること、見どころ・含まれるもの・含まれないものを正確に書き誇張しないこと、キャンセルの規定を入れることを挙げ、場所はリンク先のページと照らし合わせて、ページにない地域は表示から外すとしています（2026年9月10日更新）。[Google：エクスペリエンス プロダクトの最適化](${SRC.ttdExperience})。事業者名がリンク先のページに見えていることも求めています。[Google：Operator booking module の最適化](${SRC.ttdOperator})。`,
            "どちらも、予約システムや自社サイトのページに、正確で具体的な事実が書かれていることが前提です。この記事の9つの事実をページに書いておくことは、AIの回答だけでなく、Googleの掲載をきちんと動かすための土台にもなります。",
          ],
        },
        {
          heading: "自社サイト・OTA・Googleビジネスプロフィールの役割と、そろえる事実",
          paragraphs: [
            "体験事業者は、自社サイトのほかに複数のOTAに掲載し、Googleビジネスプロフィールも持っていることがほとんどです。AIはそれらを並べて読むので、どこか1つに古い料金や終わったプランが残ると、それが答えに使われることがあります。それぞれの役割を決め、変わりやすい事実は同じ日に直します。",
          ],
          table: {
            head: ["掲載先", "主な役割", "そろえる事実", "ずれやすい点"],
            rows: [
              ["自社サイト", "事実の正本。条件・規定・運営者を一番詳しく書く", "9つの事実すべて、運営者の情報、登録番号", "季節の料金の切り替え忘れ、終わったプランのページ"],
              ["OTA（予約サイト）", "予約の受け口。口コミが集まる", "体験名、所要時間、総額、参加条件、言語", "OTAごとのキャンセル規定、割引後の価格、写真の古さ"],
              ["Googleビジネスプロフィール", "地図と検索での事業者の情報", "名前、住所（集合場所）、電話、営業時間、カテゴリ、サイトのURL", "冬季休業の反映忘れ、集合場所と事務所の住所の違い"],
              ["予約システムの予約ページ", "決済と最終確認画面", "総額、キャンセル料、提供日時", "サイトとキャンセル規定の文が違う"],
            ],
            caption: "役割の分け方はこの記事の提案です。集合場所と事務所が違う場合は、どちらをGoogleビジネスプロフィールの住所にしているかをサイトにも書きます。",
          },
        },
        {
          heading: "構造化データ：事業者はLocalBusiness、体験はServiceで",
          paragraphs: [
            `体験事業者のサイトでは、事業者を[LocalBusiness](${SRC.localBusiness})として、体験を1つずつServiceとして出すのが、扱いやすく正確です。schema.orgには[TouristTrip](${SRC.touristTrip})という型もあり、行程（itinerary）、料金（offers）、主催者（provider）、どんな旅行者向けか（touristType）を表せます（schema-dts 2.1.0で確認）。複数の場所をめぐるガイドツアーでは使える型ですが、Nurevo AEOはTouristTripを出力しないので、使う場合は手で書き、本文に見えている事実だけを入れます。`,
            "Googleは、AI OverviewsやAI Modeのための特別なschema.orgのマークアップは必要ないとしています。[Google：AI features and your website](" + SRC.googleAi + ")。どの型を使っても、説明の文に9つの事実が入っていることのほうが大切です。Nurevo AEOで登録すると、次のような形になります（値は例です）。",
          ],
          code: SCHEMA_JA,
          after: [
            "体験施設（観光農園、工房、テーマパークなど）で、施設そのものが目的地になっている場合は、設定の「業種（schema.org型）」に、より具体的な型を入れることもできます。型の名前はschema.orgで実在するものを選び、迷ったらLocalBusinessのままにします。",
          ],
        },
        {
          heading: "WordPressの体験・ツアー事業者のサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「その他」を選び、住所（集合場所かベース）・電話番号・受付時間を入れます。LocalBusinessとして出力されます。",
            "店の説明に、どんな体験をしているか、集合場所と最寄り駅、ガイドの言語、旅行業の登録の有無（登録している場合は登録番号、運送・宿泊の手配をしていない場合はその旨）を書きます。",
            "体験を1つずつサービスとして登録します（最大20件）。サービス名に内容と長さ（例：カヌー体験 半日（約3時間））、料金に大人1人の税込の金額（数字だけ）、通貨にJPY、予約URLにその体験の予約ページ、説明に所要時間の内訳・含まれるもの・参加条件・最少催行人数・中止の基準・キャンセル料を入れます。サービス・料金・予約のアクションとして出力され、llms.txtにも1行ずつ載ります。",
            "よくある質問（雨の日、子どもの年齢、泳げなくてよいか、言語、当日予約、キャンセル、駐車場）を入力し、体験のページなどにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search/)をご覧ください。",
            "予約システムの予約ページが別のドメインにある場合は、体験のページから予約ページへ、体験ごとに直接リンクします（トップページだけにリンクしない）。予約ページの作り方は[予約ページのAI検索対策](/guide/booking-page-ai-search/)にまとめています。",
            "/llms.txt を開き、体験ごとのページ・料金・キャンセル規定・アクセスのページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "体験ごとに1ページあり、体験の名前に内容と長さが入っている。",
            "集合・解散の時刻と、所要時間の内訳が文字で書かれている。",
            "集合場所の住所、最寄り駅からの行き方、駐車場の有無が書かれている。",
            "税込の総額と、含まれるもの・含まれないもの（別料金）が書かれている。",
            "年齢・体力・泳げるか・妊娠中などの参加条件が書かれている。",
            "最少催行人数と、天候による中止の基準・判断の時刻・連絡方法・返金が書かれている。",
            "キャンセル料の表があり、OTAで予約した場合の扱いも書かれている。",
            "ガイドの言語と、日によって違う場合の条件が書かれている。",
            "運送や宿泊を組み合わせる商品について、旅行業の登録の要否を窓口で確かめ、登録番号があれば会社概要とフッターに書いている。",
            "自社サイト・OTA・Googleビジネスプロフィール・予約ページで、料金・規定・営業期間がそろっている。",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、旅行者が聞きそうな質問をAIに投げます。「◯◯ 子ども 半日 体験」「◯◯ 雨の日 アクティビティ」「◯◯ English guided tour」のような地域＋条件の質問で名前が出るかに加えて、名前を入れて「雨でも催行する？」「何歳から？」「キャンセル料は？」と聞き、答えがサイトと合っているかを記録します。違う答えが出たら、OTAの掲載、古いブログ記事、終わったプランのページのどこかに古い情報が残っていないかを探します。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（名前は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "体験・ツアー事業者のAI検索対策は、何から始めればいいですか？", a: "体験ごとに1ページを作り、所要時間の内訳、集合場所、税込の総額と含まれるもの、参加条件、最少催行人数、天候による中止の基準、キャンセル料、ガイドの言語を本文に文字で書きます。そのうえで同じ事実を構造化データ（LocalBusinessとService）とllms.txtで公開し、OTAやGoogleビジネスプロフィールとそろえます。" },
        { q: "「雨の日はどうなるか」は、どう書けばいいですか？", a: "「小雨は催行。増水・雷・警報のときは中止」のように基準を書き、判断する時刻（前日18時・当日7時など）、連絡の方法、返金か振替かを書きます。「天候により中止の場合があります」だけでは、AIは雨でも催行するかを判断できません。" },
        { q: "体験を売るのに旅行業の登録は必要ですか？", a: "観光庁のサイトに掲載の手引きや和歌山県の案内は、運送や宿泊を伴う商品を売るには原則として登録が必要だとしています。自社の体験だけを売る場合の扱いは、商品の組み立てによるので、都道府県の旅行業の窓口に確認してください。この記事は法的な助言ではありません。" },
        { q: "Googleの「Things to do」に載るには、構造化データを書けばいいですか？", a: "いいえ。GoogleはThings to doへの参加を、予約システムなどの接続パートナーを通じて行うよう勧めています。ただし、Googleは掲載の情報を事業者のページと照らし合わせるので、体験のページに正確な事実を書き、予約ページへ体験ごとに直接リンクしておくことは必要です。" },
        { q: "構造化データの型はTouristTripを使うべきですか？", a: "必須ではありません。事業者をLocalBusiness、体験をServiceとして出し、説明に条件を入れれば、事実は十分に伝わります。複数の場所をめぐるツアーでTouristTripを使う場合は、本文に見えている行程と料金だけを入れます。Nurevo AEOはTouristTripを出力しません。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・メニュー（サービス）・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ず紹介されますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、事実をAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOで体験ごとの料金と予約先を無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleはGoogle LLCの商標です。FareHarbor、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Tour and Activity Operators: Weather, Prices, Booking | Nurevo",
      description: "AI search for tour operators: one page per experience with timings, meeting point, all-in price, who can join, weather and cancellation rules and guide languages.",
      h1: "AI search for tour and activity operators: make AI read your timings, who can join, weather calls and cancellation fees correctly",
      lead: "AI search optimisation (AEO) for tours and activities comes down to one thing: when someone asks an AI \"what can we do in X for half a day with a 6-year-old?\", \"does it run in the rain?\" or \"is there an English-speaking guide?\", your site should answer each condition. Give every experience its own page and write, as text, the time breakdown, the meeting point, the all-in price and what it includes, age and fitness requirements, the minimum group size and how weather cancellations are decided, the cancellation fees and the guide's languages. Publish the same facts in structured data and llms.txt, and keep your OTA listings and Google listings in step.",
      intro: [
        "Written 24 November 2026 (JST). Legal, government and Google information was checked on the official pages linked in the text. Most of the legal points describe Japan; outside Japan, check your own country's licensing and consumer rules. This article is not legal advice.",
        "AI answers change by day and by wording. These steps make your facts readable to AI. They do not guarantee that you will appear in AI answers or rank higher. Classes for local residents are covered in [AI search for lesson studios](/guide/lesson-studio-ai-search/), and how to structure pages per language in [AI search for multilingual sites](/guide/multilingual-site-ai-search/).",
      ],
      sections: [
        {
          heading: "What travellers ask AI about tours and activities",
          paragraphs: [
            "Once people have picked a destination, they look for things to do there. They rarely ask for an operator by name. They ask with conditions: dates, who is coming, the weather, language and budget. AI answers by listing several experiences. If those conditions are answered on your page, AI can say \"from age 6, runs in light rain\" and name you. If they are not, it guesses from OTA listings and reviews, or leaves you out.",
            `More travellers plan with AI. The travel trade site PhocusWire reports Phocuswright research that 56% of US leisure travellers use AI for travel, and 35–40% in the UK, France and Germany (secondary source). [PhocusWire](${SRC.phocus}). We have not verified a comparable figure for other markets.`,
          ],
          table: {
            head: ["Type of question", "Example", "Facts the AI needs from you"],
            rows: [
              ["Time", "\"Anything that takes half a day?\" \"Can we still make an afternoon start?\"", "Meeting and finish times, and the breakdown (check-in, briefing, activity, transfers)"],
              ["Who is coming", "\"Can a 5-year-old do it?\" \"Is it OK for my parents in their 70s?\"", "Minimum and maximum age, fitness level, whether you need to swim, wheelchair access"],
              ["Weather", "\"Is it cancelled if it rains?\" \"What can we do on a rainy day?\"", "Whether it runs in rain, what triggers a cancellation, when you decide, refunds"],
              ["Language", "\"Is there an English-speaking tour?\"", "The languages guides speak, whether it varies by day, or written material only"],
              ["Price", "\"How much all in?\"", "Total price including tax, what is included (gear, insurance, pick-up, entry) and what is not"],
              ["Booking", "\"Can I book on the day?\" \"What is the cancellation fee?\"", "Booking cut-off, minimum group, cancellation fee table, booking URL"],
            ],
            caption: "The example questions illustrate this article. They are not measured question frequencies.",
          },
        },
        {
          heading: "What the top-ranking guides leave out",
          paragraphs: [
            `On 24 November 2026 we read 13 top-ranking articles in English and Japanese for queries such as "tour operator AI search" and the Japanese equivalents. Seven of the eight English articles came from booking-software or AI-tracking vendors; the eighth was trade news. FareHarbor names schema types such as TouristTrip but shows no markup. [FareHarbor](${SRC.fareharbor}). None of the eight covered how to write weather calls and cancellation fees, legal display rules, or how Google's Things to do checks a listing against the operator's own page.`,
            "In Japanese, one article from October 2026 focused on experiences and made a good case for one page per experience and for separating the roles of OTAs, your own booking and maps. It had no structured data code, no WordPress steps and nothing specific on Japan's travel agency registration or online sales display rules. The rest were about hotels, tourism boards, general AI commentary, or the Japan Tourism Agency's guide to using generative AI in back-office work. This article fills those gaps with official sources.",
          ],
        },
        {
          heading: "One page per experience: nine facts to write",
          paragraphs: [
            "A single \"Activities\" page that lists everything briefly makes it hard for AI to tell which condition belongs to which experience. Give each experience its own page and write the nine facts below as text. If your price list or itinerary is only an image or a PDF, put the same content in the page body as well.",
          ],
          table: {
            head: ["Fact", "Example", "What goes wrong without it"],
            rows: [
              ["Time breakdown", "\"Meet 9:00, finish around 12:00. Check-in 20 min, practice 30 min, about 90 min on the river\"", "\"3 hours\" alone does not say how long you are on the water, or whether an afternoon plan fits"],
              ["Meeting point and how to get there", "\"Our base, 5 minutes' walk from Example Station. 10 free parking spaces\"", "AI confuses you with a nearby venue, or cannot say if you can drive"],
              ["All-in price and inclusions", "\"$60 including tax. Gear, wetsuit and insurance included. Photos $8 extra\"", "It cannot answer \"how much all in?\" or misses extras"],
              ["Who can join", "\"Ages 6 and up. 12 and under share a boat with a parent. No need to swim. Not suitable during pregnancy\"", "It answers family questions without the conditions"],
              ["Minimum group", "\"Runs with 2 or more. Solo bookings confirmed by 17:00 the day before\"", "Solo travellers cannot tell whether to book"],
              ["Weather cancellations", "\"Runs in light rain. Cancelled for high water, lightning or storm warnings, decided by 7:00 on the day, full refund\"", "It guesses whether you run in the rain"],
              ["Cancellation fees", "\"Your cancellation: 50% the day before, 100% on the day\"", "It cannot answer before booking, or mixes in OTA terms"],
              ["Guide languages", "\"English and Spanish daily. French on weekends only, book ahead\"", "It gets language availability wrong, or misses that it varies by day"],
              ["How to book and the cut-off", "\"Book online until 18:00 the day before. On the day, call to check space\"", "It cannot say whether same-day booking works"],
            ],
            caption: "The examples describe a fictional experience in this article. Replace amounts and conditions with your own facts.",
          },
          after: [
            "Put what you do and how long it takes in the experience name (for example \"Half-day canoe trip (about 3 hours)\"). An internal name such as \"River Adventure A\" tells AI nothing. See [AI search for pricing pages](/guide/pricing-page-ai-search/) for price pages in general, and [AI search for opening hours and holidays](/guide/business-hours-holidays-ai-search/) for seasonal operating days.",
          ],
        },
        {
          heading: "Rain, cancellations and refunds: turn vague words into conditions",
          paragraphs: [
            "The most common worry before booking an activity is the weather and whether it will go ahead. \"Subject to weather\" alone gives AI nothing to decide whether you run in the rain, so it may answer from a generic OTA policy or a line in a review. Write cancellations as conditions: what triggers them, when and who decides, how guests are told, and what happens to their money.",
          ],
          table: {
            head: ["Avoid", "Why", "Write instead"],
            rows: [
              ["\"Tours may be cancelled due to weather\"", "No trigger, no time", "\"Runs in light rain. Cancelled for high water, lightning or storm warnings. We decide at 18:00 the day before and 7:00 on the day\""],
              ["\"We will contact you if cancelled\"", "No channel, no time", "\"We email and text the number on your booking by 7:00 on the day\""],
              ["\"Refunds available\"", "Full or minus fees?", "\"If we cancel, full refund including card fees, or move to another date\""],
              ["\"Contact us for our cancellation policy\"", "It cannot be answered before booking", "\"Your cancellation: free up to 7 days before, 50% the day before, 100% on the day or no-show\""],
              ["\"Beginner-friendly\"", "Who exactly can join?", "\"9 in 10 guests are first-timers. You do not need to swim. Please ask if you weigh over X kg\""],
            ],
            caption: "These rewrites are this article's recommendation. Fee percentages are examples, not market rates.",
          },
          after: [
            "If you also sell through OTAs, their cancellation terms may differ from yours. Say so on your site (\"Bookings made on [OTA] follow [OTA]'s terms\") so AI is less likely to mix the two.",
          ],
        },
        {
          heading: "Rules in Japan: travel agency registration and the online booking confirmation screen",
          paragraphs: [
            `Depending on what you sell, Japan's Travel Agency Act may apply. The Japan Tourism Agency explains that anyone carrying out the acts set out in Article 2 of the Act as a business for payment must register as a travel agency or travel agency subagent (with the Commissioner for Type 1, otherwise with the prefectural governor). [Japan Tourism Agency: Travel Agency Act overview](${SRC.kankochoLaw}). Wakayama Prefecture's guidance says registration is needed when a product includes buses, trains or other transport, or lodging. [Wakayama Prefecture: travel agency](${SRC.wakayama}). A guide on selling tourism content, published on the Japan Tourism Agency's site, also says selling content with transport or lodging in principle requires registration. [Tourism content sales guide (PDF)](${SRC.contentGuide}).`,
            "So if you bundle transport or lodging, such as \"with pick-up from the station\" or \"with a night's stay\", check whether you need to register. These sources do not state outright how an experience sold on its own is treated, so we do not either. Ask the prefectural travel agency office before you design the product. If you are registered, write the registration number (in a format such as \"[Prefecture] Governor Registered Travel Agency No. 2-XXX\", per Wakayama's guidance) on your company page and in the footer. It also tells AI what you are allowed to sell.",
            `If you take bookings online on your own site, Japan's Act on Specified Commercial Transactions also applies to mail-order sales. The Consumer Affairs Agency's guideline on display at the application stage covers services too, and asks that the final confirmation screen show the content and number or period of the service, the price, when and how to pay, when the service is provided, and the conditions and method for withdrawing or cancelling. [Guideline (copy hosted by the Japan Chamber of Commerce and Industry, PDF)](${SRC.mailorderGuideline}). Writing the same cancellation table on your booking screen and on your site helps both with the law and with AI search.`,
          ],
        },
        {
          heading: "Google Things to do: listings come from feeds, and Google checks your page",
          paragraphs: [
            `Google Search and Maps can list tours and activities with booking links under \"Things to do\". Google describes free listings and ads that you pay for only when clicked, and operators take part through a connectivity partner such as their booking system. Google strongly recommends a connectivity partner for an individual operator or for a booking system with fewer than 100 operators. [Google Ads Help: Things to do on Google](${SRC.ttdIntro}). Adding structured data to your site does not, by itself, get you into Things to do.`,
            `What matters is that Google checks listings against your pages. Under the official site policies, the booking page may sit on a different domain, provided your main site clearly links to it; Google verifies this through sources such as your Google Business Profile. A generalised landing page where users must navigate elsewhere to find key ticket information is not accepted. [Google Ads Help: Things to do official site policies](${SRC.ttdOfficial}). The product optimisation guide asks for a price that covers what one adult needs to take part, accurate highlights, inclusions and exclusions without exaggeration, and a cancellation policy; locations are checked against the landing page, and regions not shown there are excluded (updated 10 September 2026). [Google: Experiences product optimisation](${SRC.ttdExperience}). The operator's name must also be visible on the landing page. [Google: Operator booking module optimisation](${SRC.ttdOperator}).`,
            "Both assume your booking system and your own pages carry accurate, specific facts. The nine facts above are the groundwork not only for AI answers but for Google's listings to work properly.",
          ],
        },
        {
          heading: "Your site, OTAs and Google Business Profile: roles and the facts to keep in step",
          paragraphs: [
            "Most operators list on several OTAs and have a Google Business Profile as well as their own site. AI reads them side by side, so an old price or a discontinued tour left in one place can end up in an answer. Give each a role, and change the facts that move most often on the same day everywhere.",
          ],
          table: {
            head: ["Where", "Main role", "Facts to keep in step", "What tends to drift"],
            rows: [
              ["Your site", "The source of truth, with the fullest conditions, policies and operator details", "All nine facts, operator details, registration number", "Seasonal prices not switched, pages for tours you no longer run"],
              ["OTAs", "Booking channel where reviews collect", "Name, duration, all-in price, who can join, languages", "Per-OTA cancellation terms, discounted prices, old photos"],
              ["Google Business Profile", "Your business on maps and search", "Name, address (meeting point), phone, hours, category, site URL", "Winter closures not entered, meeting point vs office address"],
              ["Booking system page", "Payment and confirmation screen", "Total price, cancellation fees, date and time", "Cancellation wording differs from your site"],
            ],
            caption: "The split of roles is this article's suggestion. If your meeting point and office differ, say on your site which one your Google Business Profile uses.",
          },
        },
        {
          heading: "Structured data: LocalBusiness for you, Service for each experience",
          paragraphs: [
            `For an operator's site, publishing the business as [LocalBusiness](${SRC.localBusiness}) and each experience as a Service is simple and accurate. schema.org also has [TouristTrip](${SRC.touristTrip}), which can carry an itinerary, offers, a provider and touristType (checked in schema-dts 2.1.0). It suits guided tours that visit several places, but Nurevo AEO does not output TouristTrip, so if you use it, write it by hand and include only facts visible on the page.`,
            "Google says no special schema.org markup is needed for AI Overviews or AI Mode. [Google: AI features and your website](" + SRC.googleAi + "). Whatever type you use, having the nine facts in the description matters more. With Nurevo AEO, the output looks like this (values are examples).",
          ],
          code: SCHEMA_EN,
          after: [
            "If the venue itself is the destination (a farm, a workshop, a theme park), you can type a more specific type into the \"Business type (schema.org type)\" setting. Use a type name that exists on schema.org, and keep LocalBusiness if unsure.",
          ],
        },
        {
          heading: "Setting it up on a WordPress tour or activity site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working (structured data is not duplicated).`,
            "In the setup wizard choose \"Other\" and enter the address (meeting point or base), phone and office hours. It is published as LocalBusiness.",
            "In the business description, write what experiences you run, the meeting point and nearest station, guide languages, and your travel agency registration status (the number if registered, or that you do not arrange transport or lodging).",
            "Add each experience as a service (up to 20). Put what it is and how long in the name (for example \"Half-day canoe trip (about 3 hours)\"), the all-in adult price as a number, the currency, that experience's booking page as the URL, and the time breakdown, inclusions, who can join, minimum group, weather rule and cancellation fees in the description. Each becomes a Service with an Offer and a reserve action, and a line in llms.txt.",
            "Enter FAQs (rain, children's ages, whether you need to swim, languages, same-day booking, cancellations, parking) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your experience pages. See [AI search for FAQ pages](/guide/faq-page-ai-search/).",
            "If your booking system is on another domain, link from each experience page straight to its own booking page, not just to the booking home page. See [AI search for booking pages](/guide/booking-page-ai-search/).",
            "Open /llms.txt and check that each experience page, prices, cancellation policy and directions are listed. Run the diagnosis on the AEO score screen and fix what it flags.",
          ],
          after: [
            "The same checks apply to non-WordPress sites. Enter your URL in the [free check](/check), no sign-up needed, to see the state of your structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Each experience has its own page, and its name says what it is and how long it takes.",
            "Meeting and finish times and the time breakdown are written as text.",
            "The meeting point address, directions from the nearest station and parking are written.",
            "The all-in price including tax, what is included and what costs extra are written.",
            "Age, fitness, swimming, pregnancy and similar conditions are written.",
            "The minimum group, the weather cancellation trigger, decision time, how guests are told and the refund are written.",
            "There is a cancellation fee table, and the page says how OTA bookings are handled.",
            "Guide languages, and any day-by-day differences, are written.",
            "For products that bundle transport or lodging, registration has been checked with the authorities (in Japan, the prefectural office), and any registration number is on the company page and footer.",
            "Prices, policies and operating seasons match across your site, OTAs, Google Business Profile and the booking page.",
          ],
        },
        {
          heading: "Check whether you appear, and whether AI answers correctly",
          paragraphs: [
            "Afterwards, ask AI the questions travellers would ask. Check whether you appear for area plus condition questions such as \"[town] half day activity kids\", \"[town] rainy day things to do\" or \"[town] English guided tour\". Then ask by name, \"does it run in the rain?\", \"what age?\", \"cancellation fee?\", and record whether the answers match your site. If they do not, look for old information on an OTA listing, an old blog post or a page for a tour you no longer run.",
            "AI answers change between runs, so ask the same questions several times, spread over time. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a tour or activity operator start with AI search?", a: "Give each experience its own page and write, as text, the time breakdown, meeting point, all-in price and inclusions, who can join, minimum group, weather cancellation rule, cancellation fees and guide languages. Then publish the same facts as LocalBusiness and Service structured data and in llms.txt, and keep them in step with your OTA listings and Google Business Profile." },
        { q: "How should I describe what happens when it rains?", a: "State the trigger (\"runs in light rain; cancelled for high water, lightning or warnings\"), when you decide (for example 18:00 the day before and 7:00 on the day), how you tell guests, and whether they get a refund or a new date. \"Subject to weather\" alone does not let AI tell whether you run in the rain." },
        { q: "Do I need a travel agency licence to sell activities in Japan?", a: "Guidance from Wakayama Prefecture and a guide published on the Japan Tourism Agency's site say products that include transport or lodging in principle require registration. How an experience sold on its own is treated depends on the product, so ask the prefectural travel agency office. This article is not legal advice." },
        { q: "Will structured data get me into Google Things to do?", a: "No. Google recommends taking part through a connectivity partner such as your booking system. But Google checks listings against your pages, so you still need accurate facts on each experience page and a direct link from each one to its booking page." },
        { q: "Should I use TouristTrip?", a: "It is not required. LocalBusiness for the business and a Service for each experience, with the conditions in the description, carries the facts well. If you use TouristTrip for multi-stop tours, include only the itinerary and prices shown on the page. Nurevo AEO does not output TouristTrip." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends my tours?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes each experience's price and booking link for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. FareHarbor, Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
