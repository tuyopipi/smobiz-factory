// Content page: AI search (AEO) for driving schools (自動車教習所・自動車学校),
// commuting and residential (合宿免許) courses. Industry page. Lesson studios
// and cram schools have their own pages; access/parking is in
// access-directions-parking-ai-search. This one is about: whether the school is
// 公安委員会指定, the total price to graduation and the conditions for extra
// charges, the guarantee plan, refunds on withdrawal, how long it takes and how
// easy lessons are to book, residential-course terms, and how to state pass /
// safety figures.
//
// Written 2026-11-26 8時 (JST). Product facts (plugin 0.9.2,
// experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// - Wizard "Other" card sets no type; with no type the business node is a
//   LocalBusiness when any of address, phone or hours is filled (see
//   lesson-studio-ai-search notes). "Business type (schema.org type)" field
//   takes a schema.org type name.
// - Services (up to 20): Service with name, provider, description, url,
//   category, additionalProperty duration only when minutes > 0, Offer with
//   price/priceCurrency when a price is entered, ReserveAction when a
//   reservation URL is entered (nurevo-webmcp.php
//   webmcp_canary_service_schema_nodes); one llms.txt line each.
// - FAQPage only on a page showing the Nurevo FAQ block / [nurevo_faq].
// - 0.9.1: SEO SIMPLE PACK and VK All in One Expansion Unit coexist without
//   duplicate structured data. Free/Standard: monthly 3-question Perplexity
//   check; Pro measures AI visibility (currently Perplexity).
//
// Outside facts and where they were read (2026-11-26):
// - NPA white paper 令和8年版 ch.5 (npa.go.jp/hakusyo/r08/.../cc5531000.html):
//   1,277 指定自動車教習所 at end of 2025; graduates who passed the licence
//   exam in 2025: 1,446,135; graduates are exempt from the skills test;
//   graduates of 指定/特定届出 schools are exempt from 取得時講習.
// - Ibaraki Prefectural Police (updated 2024-05-14): graduating from a school
//   other than a 指定自動車教習所 does not exempt you from the skills test or
//   取得時講習.
// - 国民生活センター 子どもサポート情報 第230号 (2026-02-19) "自動車教習所選び
//   は慎重に": complaints that skills lessons cannot be booked, small refunds
//   on cancellation; check 所要期間, ease of booking, extra charges and
//   cancellation terms; designated vs non-designated schools differ in whether
//   there are rules on the 教習期限 and the number of lesson periods.
// - Kyoto Prefectural Public Safety Commission 審査基準 for designating
//   schools (2025-03-21), attachment 1: 普通免許 学科 10 periods in stage 1 and
//   16 in stage 2 (legal basis 道路交通法施行規則 第33条 etc.). Skills-lesson
//   minimums were not in what we read, so not stated.
// - Aichi Prefectural Police PDF "普通免許取得後1年間における交通人身事故":
//   per-school graduates, accident persons and rate for licences obtained in
//   2022-2024. Only its existence is stated (column order unclear in the text).
// - NTA tax answer 6902 (checked 2026-11-01 for lesson-studio): advance price
//   displays to consumers must include consumption tax.
// - schema-dts 2.1.0 (checked 2026-11-26): no DrivingSchool type;
//   DrivingSchoolVehicleUsage exists only as a CarUsageType value (a car used
//   by a driving school). EducationalOrganization subtypes are
//   CollegeOrUniversity, ElementarySchool, HighSchool, MiddleSchool, Preschool,
//   School. Course / CourseInstance exist.
// - Google "AI features and your website": no special markup needed (checked
//   2026-11-01 for hair-salon-ai-search, not re-fetched).
// Top articles read 2026-11-26: uravation (2026-08-11, upd 09-05),
// switchitmaker2 (2025-02-16), キャククル shopowner-support (upd 2026-10-29),
// coomil (no date), rpa-support (2023-09-01); texta.ai (no date), bili-ai
// (2026-03-11), Total Drive (2026-06-22), ProfileTree (2026-07-25, upd 11-16),
// LinkGraph (2025-12-07), Jobber (2026-08-27, upd 11-04), Whito data report
// (upd 2026-11-25). firstsales returned an index page; whito AI article failed.
// Not stated on purpose: skills-lesson minimum periods, the 教習期限 length,
// the validity of the graduation certificate, market price ranges, any survey
// of how many learners use AI (sources were vendor posts without a study).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  npa: "https://www.npa.go.jp/hakusyo/r08/honbun/html/cc5531000.html",
  ibaraki: "https://www.pref.ibaraki.jp/kenkei/a03_license/school/about.html",
  kokusen: "https://www.kokusen.go.jp/mimamori/kmj_mailmag/kmj-support230.html",
  kyoto: "https://www.pref.kyoto.jp/fukei/kotu/koki_k_t/shinsa/documents/12shinsa.pdf",
  aichi: "https://www.pref.aichi.jp/police/menkyo/tetsuzuki/jinkou/images/R8hutuu.pdf",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
  localBusiness: "https://schema.org/LocalBusiness",
  educationalOrg: "https://schema.org/EducationalOrganization",
  course: "https://schema.org/Course",
  vehicleUsage: "https://schema.org/DrivingSchoolVehicleUsage",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  uravation: "https://uravation.com/llmo/driving-school-kyoshujo-llmo-taisaku/",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#business",
      "name": "例自動車学校（例）",
      "description": "◯◯県公安委員会指定の自動車教習所。普通車（AT・MT）、準中型、普通二輪の教習。通学と合宿。卒業すると運転免許試験場での技能試験が免除されます。",
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "◯◯県",
        "addressLocality": "◯◯市",
        "streetAddress": "例町1-2-3",
        "addressCountry": "JP"
      },
      "openingHours": "Tu-Su 09:00-20:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "普通車AT 通学（免許なし・18歳以上）",
      "category": "普通自動車免許",
      "provider": { "@id": "https://example.jp/#business" },
      "description": "卒業までの総額000,000円（税込）。入所金・教材費・技能と学科の規定時限・検定料・卒業証明書の発行を含みます。規定を超えた技能教習は1時限0,000円、再検定は1回0,000円。仮免許の学科試験の手数料と、試験場での手数料は含みません。",
      "url": "https://example.jp/price/",
      "offers": { "@type": "Offer", "price": "000000", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/apply/" },
        "result": { "@type": "Reservation", "name": "普通車AT 通学（免許なし・18歳以上）" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.com/#business",
      "name": "Example Driving School",
      "description": "State-approved driving school for cars (automatic and manual) and motorcycles. Weekday and weekend lessons, teen and adult courses.",
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Example Street",
        "addressLocality": "Springfield",
        "addressRegion": "IL",
        "postalCode": "62701",
        "addressCountry": "US"
      },
      "openingHours": "Mo-Sa 08:00-19:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Teen driver's ed package (automatic)",
      "category": "Car licence",
      "provider": { "@id": "https://example.com/#business" },
      "description": "Total $000 including tax: classroom course, 6 in-car lessons of 60 minutes, use of a school car for the road test. Extra lessons $00 each. Licence and test fees paid to the state are not included.",
      "url": "https://example.com/prices/",
      "offers": { "@type": "Offer", "price": "000", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/enroll/" },
        "result": { "@type": "Reservation", "name": "Teen driver's ed package (automatic)" }
      }
    }
  ]
}`;

export default {
  slug: "driving-school-ai-search",
  targetQueries: [
    "自動車教習所 AI検索対策",
    "自動車学校 LLMO 集客",
    "合宿免許 ChatGPT 紹介",
    "driving school AI search optimization",
    "driving school recommended by ChatGPT",
    "driving school schema markup",
  ],
  related: ["access-directions-parking-ai-search", "pricing-page-ai-search", "lesson-studio-ai-search", "faq-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "自動車教習所のAI検索対策：指定・総額・期間・合宿 | Nurevo",
      description: "教習所・自動車学校のAI検索対策は、公安委員会の指定、卒業までの総額と追加料金の条件、保証プラン、解約時の返金、卒業までの期間と予約の取りやすさを本文に書くこと。構造化データとWordPressの手順も。",
      h1: "自動車教習所のAI検索対策：指定の有無・卒業までの総額・追加料金・期間をAIに正しく読ませる手順",
      lead: "自動車教習所（自動車学校）のAI検索対策の中心は、入所を考える人と保護者がAIに聞く「指定の教習所？」「卒業までに全部でいくら？」「追加料金はどんなときにかかる？」「何日で卒業できる？予約は取れる？」に、ページ本文の文字で答えることです。公安委員会の指定の有無、免許の種類ごとの総額と含まれるもの・含まれないもの、追加教習と再検定の料金、保証プランの範囲、解約したときの返金の計算、卒業までの期間の目安を書き、同じ事実を構造化データ・llms.txt・Googleビジネスプロフィール・合宿免許のポータルの掲載とそろえます。",
      intro: [
        "作成日：2026年11月26日（JST）。警察庁・茨城県警察・京都府・国民生活センターのページは同日に確認しました。schema.orgの型は同日に schema-dts 2.1.0 で確認しています。この記事は法的な助言ではありません。",
        "AIの回答は日や聞き方、使うサービスによって変わります。この記事の手順は、AIが教習所の事実を正しく読める状態をつくり、確かめるためのもので、AIの回答に必ず出ることや順位を保証するものではありません。駐車場や送迎バスの乗り場の書き方は[アクセス・駐車場のページの書き方](/guide/access-directions-parking-ai-search)で扱っています。",
      ],
      sections: [
        {
          heading: "入所を考える人と保護者はAIに何を聞くか",
          paragraphs: [
            "教習所の質問は、近くで通える学校を探す「通学」と、遠くの学校を短い期間で比べる「合宿」で、聞き方が分かれます。どちらも、最後は料金と期間と条件の質問になります。",
          ],
          table: {
            head: ["質問の型", "AIへの質問の例", "答えに必要な事実"],
            rows: [
              ["近くの学校", "「◯◯市 教習所 送迎あり 普通車AT」", "所在地、送迎の範囲、取扱いの免許の種類"],
              ["総額", "「◯◯自動車学校 AT 総額いくら」", "免許の種類・年齢・所持免許ごとの税込み総額、含まれるもの"],
              ["追加料金", "「補習になったら追加でいくら？」", "追加の技能教習・再検定の単価、保証プランの範囲"],
              ["期間と予約", "「最短何日？春休みでも予約取れる？」", "最短と目安の日数、繁忙期の実績、予約の方法"],
              ["合宿", "「合宿免許 2週間 個室 食事つき」", "宿泊・食事・交通費の扱い、延泊の費用、キャンセル料"],
              ["解約", "「途中でやめたら返金される？」", "解約の手続き、返金の計算方法、返金されない費用"],
            ],
          },
        },
        {
          heading: "上位の記事に足りない点",
          paragraphs: [
            `日本語と英語の上位記事を12本読みました。料金の透明性や、合宿と地元の通学を分けて考える点は、[uravation の記事](${SRC.uravation})などでもすでに書かれています。一方、ほとんどの記事に次の点がありませんでした。`,
          ],
          list: [
            "「公安委員会の指定」がAIの答えで何を変えるかと、公的な出典",
            "2026年2月に国民生活センターが出した、教習所選びの注意（予約・解約・追加料金）",
            "schema.orgに教習所の専用の型がないこと（英語の記事には、存在しない DrivingSchool 型を勧めるものもありました）",
            "構造化データの例と、WordPressでの設定手順",
            "合格率などの実績の数字を、どう定義して書くか",
            "AIの答えが正しいかを確かめる方法",
          ],
        },
        {
          heading: "最初に「公安委員会指定かどうか」を書く",
          paragraphs: [
            `日本で運転免許を取る人の多くは、都道府県の公安委員会が指定した「指定自動車教習所」を卒業します。警察庁の白書によると、指定自動車教習所は2025年末に全国で1,277か所あり、卒業者で2025年中に運転免許試験に合格した人は144万6,135人でした。卒業者は試験場での技能試験が免除されます。[警察庁：令和8年版 警察白書 第5章](${SRC.npa})`,
            `指定以外の教習所を卒業しても、技能試験と取得時講習は免除されません。[茨城県警察：指定自動車教習所について](${SRC.ibaraki})。国民生活センターも、指定と指定外の教習所では、教習期限や教習の時限数の決まりの有無などが違うと説明しています。[国民生活センター：子どもサポート情報 第230号（2026年2月19日）](${SRC.kokusen})`,
            "そのため、AIが「この学校を卒業すれば試験場で技能試験を受けなくていいか」を答えられるように、トップページと会社概要に「◯◯県公安委員会指定」と、指定を受けている免許の種類（普通車・準中型・普通二輪など）を文字で書きます。ロゴや画像の中だけに書くと、AIが読めないことがあります。指定外の練習コース（ペーパードライバー講習など）がある場合は、指定の教習と分けて書きます。",
          ],
        },
        {
          heading: "料金は「卒業までの総額」と「追加でかかる条件」で書く",
          paragraphs: [
            `国民生活センターの子どもサポート情報（2026年2月）では、技能教習の予約が取れない、解約したら返金が少なかった、という相談が紹介され、所要期間・予約の取りやすさ・追加料金の有無・解約条件を確かめるよう呼びかけています。[国民生活センター](${SRC.kokusen})。これは、AIに聞かれる質問そのものです。料金表がPDFや画像だけだったり、「お問い合わせください」だけだったりすると、AIはポータルの古い料金や推測で答えることがあります。`,
            `消費者に向けた料金の表示は、税込みの総額で書きます。[国税庁：No.6902 総額表示](${SRC.ntaTotal})`,
          ],
          table: {
            head: ["項目", "書くこと", "書き方の例"],
            rows: [
              ["総額", "免許の種類・AT/MT・所持免許・年齢ごとの税込み総額", "「普通車AT・免許なし：卒業まで000,000円（税込）」"],
              ["含まれるもの", "入所金・教材費・規定時限の教習・検定料・写真代など", "「検定料と卒業証明書の発行を含みます」"],
              ["含まれないもの", "仮免許の学科試験の手数料、試験場での手数料、追加の教習", "「試験場で払う手数料は含みません」"],
              ["追加料金", "規定時限を超えた技能教習・再検定・補講の単価", "「追加の技能教習は1時限0,000円」"],
              ["保証プラン", "何が、何回まで、いつまで無料になるか", "「追加教習と再検定が卒業まで無料。教習期限を過ぎた場合は対象外」"],
              ["割引", "学生・グループ・時期の割引の条件と併用の可否", "「学生割引は在学証明書が必要。他の割引と併用不可」"],
              ["解約・返金", "手続き、返金の計算、返金されない費用", "「受けていない教習の料金を返金。入所金は返金しません」"],
            ],
          },
          after: [
            "金額の「◯」の部分は、必ず自校の正しい金額に置き換えてください。この記事では相場の金額を書いていません。地域・時期・免許の種類で大きく違い、確かめられる公的な統計がないためです。",
          ],
        },
        {
          heading: "卒業までの期間と、予約の取りやすさを正直に書く",
          paragraphs: [
            "「最短◯日」だけを書くと、AIはその日数を目安として答えてしまいます。最短の日数と、実際に卒業した人の目安（例：昨年の平均や、多くの人がかかった日数）を分けて書き、春休み・夏休みなどの繁忙期に予約が取りにくくなるならそう書きます。実績の数字は、自校の記録から出したものだけを、いつの数字かを添えて書きます。",
            `技能教習の予約の方法（ウェブ・アプリ・窓口）、1日に受けられる時限の上限、キャンセルの期限、送迎バスの時刻も書きます。学科教習は、普通免許では第一段階10時限・第二段階16時限が教習の標準として定められています（京都府公安委員会の審査基準、別添1）。[京都府：指定自動車教習所の指定の審査基準（PDF）](${SRC.kyoto})。技能教習の時限数はAT・MTなどで違うので、自校の案内と同じ数字を書きます。`,
            "教習期限（入所から卒業までの期限）と、仮免許・卒業証明書の有効期限も、自校の案内どおりに書きます。保証プランの多くは期限内が条件なので、期限とプランの説明を同じ場所に置くと、AIが条件つきで答えやすくなります。",
          ],
        },
        {
          heading: "合宿免許のページで書くこと",
          paragraphs: [
            "合宿は、遠くの学校を比べる質問が中心です。合宿のページには、総額に含まれる宿泊（部屋の種類）・食事の回数・往復の交通費の上限、卒業が延びたときの延泊の費用と保証の範囲、入校日の一覧、キャンセル料（何日前からいくらか）、申し込み先を書きます。",
            "合宿免許のポータルから申し込む場合と、学校に直接申し込む場合で料金や条件が違うなら、その違いを公式サイトに書きます。違いが書かれていないと、AIはポータルの料金と公式サイトの料金を混ぜて答えることがあります。ポータルの掲載も、年に数回は公式サイトと同じ内容になっているかを確かめます。",
          ],
        },
        {
          heading: "合格率・卒業率などの数字は、定義をつけて書く",
          paragraphs: [
            "「合格率98%」のような数字は、AIに引用されやすい一方で、定義がないと比べられません。何の試験か（仮免許の学科・卒業検定・試験場の学科試験）、分母（受験した人か、入所した人か）、期間（何年の何月から何月）、1回目で受かった人だけか、を一緒に書きます。",
            `都道府県警察が教習所ごとの数字を公表している場合は、その出典を使えます。例えば愛知県警察は、教習所ごとに、卒業者が普通免許を取ってから1年以内の交通人身事故の人数と割合を公表しています。[愛知県警察：普通免許取得後1年間における交通人身事故（PDF）](${SRC.aichi})。引用するときは、何年に取得した人の数字かと出典を必ず添え、他校を下げる書き方はしません。`,
          ],
        },
        {
          heading: "構造化データ：教習所の専用の型はない",
          paragraphs: [
            `schema.orgには、自動車教習所の専用の型はありません（schema-dts 2.1.0で確認、2026年11月26日）。名前の似た [DrivingSchoolVehicleUsage](${SRC.vehicleUsage}) は、教習車として使われる車を表す値で、学校の型ではありません。[EducationalOrganization](${SRC.educationalOrg}) の下にある型は大学・小学校・中学校・高校・幼稚園・学校で、地域ビジネス（[LocalBusiness](${SRC.localBusiness})）には含まれていません。`,
            "所在地・電話・営業時間をAIや検索エンジンに伝えるには、学校を LocalBusiness として出し、免許の種類ごとのコースを Service と Offer で紐づけるのが無理のない形です。Nurevo AEOでコースを登録すると、次のような形で出力されます（金額は例です）。",
          ],
          code: SCHEMA_JA,
          after: [
            `講座を表す [Course](${SRC.course}) という型もありますが、Nurevo AEOは出力しません。どの型を使っても、構造化データは本文に書いた総額と条件の写しとして使い、本文と同じ内容にします。Googleは、AI機能に出るために特別な構造化データは必要ないと説明しています。[Google：AI機能とウェブサイト](${SRC.googleAi})`,
          ],
        },
        {
          heading: "WordPressの教習所サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「その他」を選びます。業種の型を指定しない設定で、住所・電話番号・営業時間のどれかが入っていれば LocalBusiness として出力されます。",
            "学校名・住所・電話番号・受付時間（休校日を含む）を入れ、説明に「◯◯県公安委員会指定」と取扱いの免許の種類を書きます。",
            "設定画面の「サービス」に、免許の種類ごとのコースを1つずつ登録します（最大20件）。名前（「普通車AT 通学（免許なし・18歳以上）」のように条件も入れる）、税込みの総額と通貨（JPY）、カテゴリ、料金ページのURL、申し込みページのURL、説明（含まれるもの・含まれないもの・追加料金）を入れます。時間（分）は1回のレッスンではないので空けておけます。サービスは Service・Offer・予約の操作（ReserveAction）として出力され、llms.txtにも1行ずつ載ります。",
            "保証プラン・解約と返金・教習期限・予約の方法・送迎の範囲・合宿のキャンセル料をよくある質問に入れ、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を料金ページか入所案内のページに置きます。FAQPageは、質問が表示されているページにだけ出力されます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search)をご覧ください。",
            "料金表は、PDFだけでなく固定ページの本文に表で書きます。終わった季節のキャンペーンのページは、ブロックエディタのNurevo AEOパネルでllms.txtに載せない設定にできます。",
            "/llms.txt を開き、料金・入所案内・合宿・アクセス・よくある質問のページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・営業時間・サービス・FAQだけを足します。WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "トップページと会社概要に「◯◯県公安委員会指定」と、指定の免許の種類が文字で書かれている。",
            "免許の種類・AT/MT・所持免許・年齢ごとの税込み総額が、本文の表にある。",
            "総額に含まれるもの・含まれないもの（試験場での手数料など）が書かれている。",
            "追加の技能教習・再検定の単価と、保証プランの範囲・期限・対象外が書かれている。",
            "解約の手続きと返金の計算方法、返金されない費用が書かれている。",
            "最短の日数と、実際の目安の日数が分けて書かれ、繁忙期の予約の状況が書かれている。",
            "教習期限、予約の方法、キャンセルの期限、送迎の範囲と時刻が書かれている。",
            "合宿のページに、宿泊・食事・交通費・延泊・キャンセル料・入校日が書かれている。",
            "合格率などの数字に、試験の種類・分母・期間・出典が添えられている。",
            "Googleビジネスプロフィール・合宿のポータルの料金や営業時間が、公式サイトと同じ。",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、入所を考える人が聞きそうな質問をAIに投げます。「◯◯市 教習所 送迎あり」「合宿免許 ◯◯県 AT 2週間」のような質問で名前が出るかに加えて、学校の名前を入れて「卒業までの総額は？」「追加料金はかかる？」「指定の教習所？」「途中でやめたら返金される？」と聞き、答えがサイトの事実と合っているかを見ます。古い料金や、終わったキャンペーンが答えに出ていないかも確かめます。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、結果を記録します。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（事業の名前は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在はPerplexity）。どちらも回答の一部を見本として調べるもので、すべての回答を見ているわけではありません。くわしくは[AIでの登場率の測り方](/guide/measure-ai-visibility)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "教習所のAI検索対策は、何から始めればいいですか？", a: "まず、公安委員会指定であることと、免許の種類ごとの税込み総額・含まれるもの・追加料金の条件を、料金ページに文字の表で書きます。次に、保証プラン・解約と返金・卒業までの期間を書き、同じ事実を構造化データ・llms.txt・Googleビジネスプロフィール・ポータルの掲載とそろえます。" },
        { q: "料金をPDFで載せているだけでは、だめですか？", a: "PDFも残してかまいませんが、本文にも表で書くことをおすすめします。PDFや画像の中の数字は、AIが読まなかったり読み違えたりすることがあり、その場合はポータルの古い料金や推測で答えられることがあります。" },
        { q: "「最短◯日」を書くと、AIに紹介されやすくなりますか？", a: "日数の短さで紹介されるかどうかが決まる、という公式の情報はありません。最短の日数だけを書くと、AIがそれを目安として答え、実際の期間との違いが不満につながることがあります。最短と実際の目安を分けて書いてください。" },
        { q: "構造化データの型は DrivingSchool にすればいいですか？", a: "schema.orgに DrivingSchool という型はありません（2026年11月、schema-dts 2.1.0で確認）。学校は LocalBusiness で出し、免許の種類ごとのコースを Service と Offer で表すのが無理のない形です。DrivingSchoolVehicleUsage は教習車の用途を表す値で、学校の型ではありません。" },
        { q: "合宿免許のポータルに載っていれば、公式サイトは整えなくていいですか？", a: "ポータルは比べる人に見つけてもらう助けになりますが、AIはポータルと公式サイトの両方を読むことがあります。公式サイトに総額・条件・申し込み先を書き、ポータルの掲載と内容をそろえておくと、AIが食い違った答えを出しにくくなります。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・連絡先・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ず紹介されますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、指定・総額・追加料金・期間・解約の事実をAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの教習所のサイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOで免許の種類ごとのコースとよくある質問を無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、ならびに本文で紹介した各社の名称は、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Driving Schools: Approval, Total Price, Time | Nurevo",
      description: "AEO for driving schools: state your official approval, the total price to a licence, what triggers extra charges, refunds, how long it takes and how lessons are booked.",
      h1: "AI search for driving schools: getting AI to read your approval status, total price, extra charges and timeline correctly",
      lead: "AI search optimization (AEO) for a driving school comes down to answering, as text on your own pages, what learners and parents ask an AI before they enrol: Are you officially approved? What does it cost in total to get the licence? When do extra charges apply? How long will it take, and can I actually book lessons? What happens if I quit halfway? Write your approval status, the total price per licence type with what is and isn't included, the price of extra lessons and re-tests, what any guarantee covers, how refunds are calculated and a realistic timeline. Then publish the same facts in your structured data, llms.txt, Google Business Profile and any booking portals.",
      intro: [
        "Written November 26, 2026 (JST). The official examples here are from Japan, where we checked the National Police Agency, two prefectural police or public-safety-commission documents and the National Consumer Affairs Center on November 26, 2026. Licensing, approval and consumer rules differ by country and state, so use the ones that apply to you. Schema.org types were checked in schema-dts 2.1.0 the same day. This article is not legal advice.",
        "AI answers change from day to day, with how a question is phrased and with the service used. The steps here make your facts readable to AI and help you check the answers. They do not guarantee that an AI will mention you or rank you anywhere. For parking and pick-up points, see [how to write your directions and parking page](/guide/access-directions-parking-ai-search).",
      ],
      sections: [
        {
          heading: "What learners and parents ask AI",
          paragraphs: [
            "Driving-school questions split into two kinds: finding a school close enough to attend, and comparing schools further away for an intensive or residential course. Both end in the same place: price, time and terms.",
          ],
          table: {
            head: ["Question type", "Example question to AI", "Facts the answer needs"],
            rows: [
              ["Nearby school", "\"Driving school in Springfield with pick-up, automatic\"", "Location, pick-up area, licence types taught"],
              ["Total price", "\"How much does Example Driving School cost in total?\"", "Tax-inclusive total by licence type, age and existing licence; what is included"],
              ["Extra charges", "\"How much extra if I need more lessons?\"", "Price per extra lesson and re-test; what the guarantee covers"],
              ["Timeline and booking", "\"How fast can I pass? Can I book lessons in summer?\"", "Fastest and typical time, busy seasons, how booking works"],
              ["Intensive course", "\"Two-week intensive driving course with accommodation\"", "Accommodation, meals, travel, cost of extra nights, cancellation fees"],
              ["Withdrawal", "\"Do I get a refund if I quit?\"", "How to withdraw, how refunds are calculated, what is non-refundable"],
            ],
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read 12 top-ranking articles in Japanese and English. Price transparency and the split between local and intensive courses are already covered in some of them. Most of them, though, lack the following:",
          ],
          list: [
            "What official approval changes in an AI's answer, with a public source",
            "The consumer-agency warning about bookings, refunds and extra charges (Japan, February 2026)",
            "The fact that schema.org has no driving-school type (some English articles recommend a DrivingSchool type that does not exist)",
            "A structured-data example and WordPress setup steps",
            "How to define pass rates and other figures before you publish them",
            "A way to check whether AI answers about you are correct",
          ],
        },
        {
          heading: "Say first whether you are officially approved",
          paragraphs: [
            `In Japan, most new drivers graduate from a school designated by the prefectural public safety commission. According to the National Police Agency's white paper, there were 1,277 designated driving schools at the end of 2025, and 1,446,135 of their graduates passed the licence exam during 2025. Graduates are exempt from the skills test at the licensing centre. [National Police Agency white paper 2026, chapter 5 (Japanese)](${SRC.npa})`,
            `Graduating from a school that is not designated does not exempt you from the skills test or the mandatory course for new licence holders. [Ibaraki Prefectural Police (Japanese)](${SRC.ibaraki}). Japan's National Consumer Affairs Center also notes that designated and non-designated schools differ in whether there are rules on the course deadline and the number of lesson periods. [National Consumer Affairs Center, February 19, 2026 (Japanese)](${SRC.kokusen})`,
            "Wherever you are, the question \"does finishing this school's course replace part of the official test?\" depends on an approval or registration status. Write that status as text on your home page and about page, with the authority's name and the licence types it covers. If it only appears in a logo or a certificate image, AI may not read it. Keep courses outside the approved programme (refresher lessons for licensed drivers, for example) clearly separate.",
          ],
        },
        {
          heading: "Price the whole licence, and the conditions for extra charges",
          paragraphs: [
            `In February 2026, Japan's National Consumer Affairs Center described complaints from learners who could not book practical lessons and who received small refunds after cancelling. It advised checking how long the course takes, how easy lessons are to book, whether there are extra charges and the cancellation terms. [National Consumer Affairs Center (Japanese)](${SRC.kokusen}). Those are exactly the questions people ask an AI. If your price list is only a PDF or an image, or just says \"contact us\", an AI may answer from an old portal listing or a guess.`,
            `Show consumer prices including tax, as your local rules require. In Japan, advance price displays to consumers must include consumption tax. [National Tax Agency No. 6902 (Japanese)](${SRC.ntaTotal})`,
          ],
          table: {
            head: ["Item", "What to write", "Example wording"],
            rows: [
              ["Total", "Tax-inclusive total by licence type, automatic/manual, existing licence and age", "\"Car, automatic, no licence: $000 in total including tax\""],
              ["Included", "Enrolment fee, materials, the required lessons, tests, certificates", "\"Includes the school test and the completion certificate\""],
              ["Not included", "Fees paid to the licensing authority, extra lessons", "\"Fees paid to the state are not included\""],
              ["Extra charges", "Price per extra practical lesson, re-test and catch-up class", "\"Extra practical lessons are $00 each\""],
              ["Guarantee", "What becomes free, how many times and until when", "\"Extra lessons and re-tests free until you finish; not valid after the course deadline\""],
              ["Discounts", "Conditions for student, group and seasonal discounts, and whether they combine", "\"Student discount needs proof of enrolment; cannot be combined\""],
              ["Withdrawal and refunds", "The procedure, how the refund is calculated, what is not refunded", "\"Lessons not taken are refunded; the enrolment fee is not\""],
            ],
          },
          after: [
            "Replace every \"0\" with your own figures. We have not given market prices: they vary widely by area, season and licence type, and we found no public statistics to check them against.",
          ],
        },
        {
          heading: "Be honest about the timeline and how easy lessons are to book",
          paragraphs: [
            "If you only write \"pass in as little as X days\", AI will repeat that number as the typical time. Give the fastest time and the typical time separately (for example, last year's average or the range most learners took), and say so if lessons are harder to book in school holidays. Publish only figures from your own records, with the period they cover.",
            `Write how practical lessons are booked (web, app or front desk), how many lessons a learner can take per day, the cancellation deadline for a lesson and the pick-up timetable. In Japan, the classroom part of the standard car licence course is 10 periods in stage one and 16 in stage two (Kyoto Prefectural Public Safety Commission's designation criteria, attachment 1). [Kyoto Prefecture (PDF, Japanese)](${SRC.kyoto}). Practical-lesson requirements differ for automatic and manual, so use the same numbers as your own course guide.`,
            "Also write your course deadline (how long after enrolment learners must finish) and how long any provisional licence or completion certificate stays valid, exactly as your own terms say. Most guarantees only apply within the deadline, so put the deadline next to the guarantee and AI is more likely to give the conditions too.",
          ],
        },
        {
          heading: "What an intensive or residential course page needs",
          paragraphs: [
            "Intensive courses are compared across regions. The page should say what the total includes: the room type, how many meals, the cap on travel costs. It should also give the cost of extra nights if a learner needs longer and whether the guarantee covers it, the start dates, the cancellation fees (from how many days before, and how much) and where to apply.",
            "If the price or terms differ between booking through a portal and booking directly with you, say so on your own site. If you don't, AI may mix the portal's price with yours. Check a few times a year that portal listings still match your site.",
          ],
        },
        {
          heading: "Define pass rates and other figures before you publish them",
          paragraphs: [
            "A line such as \"98% pass rate\" is easy for AI to quote but impossible to compare without a definition. Say which test (theory, the school's final test or the official test), the denominator (learners who sat the test or everyone who enrolled), the period, and whether it counts first attempts only.",
            `Where a public body publishes school-level figures, you can cite them. Aichi Prefectural Police in Japan, for example, publishes, for each school, how many graduates were involved in an injury accident within a year of getting a standard licence, and the rate. [Aichi Prefectural Police (PDF, Japanese)](${SRC.aichi}). If you quote such data, give the year and the source, and don't use it to run down other schools.`,
          ],
        },
        {
          heading: "Structured data: there is no driving-school type",
          paragraphs: [
            `Schema.org has no type for driving schools (checked in schema-dts 2.1.0 on November 26, 2026). The similarly named [DrivingSchoolVehicleUsage](${SRC.vehicleUsage}) is a value describing a car used by a driving school, not a type for the school. The subtypes of [EducationalOrganization](${SRC.educationalOrg}) are college or university, elementary, middle and high school, preschool and school, and it is not part of [LocalBusiness](${SRC.localBusiness}).`,
            "To give AI and search engines your address, phone number and hours, publish the school as a LocalBusiness and link each licence course to it as a Service with an Offer. When you enter courses in Nurevo AEO, they come out like this (prices are placeholders):",
          ],
          code: SCHEMA_EN,
          after: [
            `Schema.org also has a [Course](${SRC.course}) type, which Nurevo AEO does not publish. Whatever types you use, treat structured data as a copy of the totals and terms on the page, and keep it identical to the text. Google says no special structured data is needed to appear in its AI features. [Google: AI features and your website](${SRC.googleAi})`,
          ],
        },
        {
          heading: "Setting it up on a WordPress driving-school site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO and Slim SEO keep working. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicate structured data.`,
            "In the setup wizard, choose \"Other\". With no specific type set, the business is published as a LocalBusiness as long as an address, phone number or opening hours is filled in.",
            "Enter the school name, address, phone and office hours (including closed days), and put your approval status and the licence types you teach in the description.",
            "Add each licence course under Services, one per course (up to 20): a name that includes the conditions (\"Car, automatic, no licence, 18+\"), the tax-inclusive total and currency, a category, the price-page URL, the enrolment URL and a description of what is included, what is not and the extra charges. Leave the minutes field empty, since a course is not a single lesson. Each course is published as a Service with an Offer and a ReserveAction, and gets a line in llms.txt.",
            "Put the guarantee, withdrawal and refunds, course deadline, how booking works, the pick-up area and intensive-course cancellation fees into the FAQ, and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your price or enrolment page. FAQPage is published only on a page that shows the questions. See [FAQ pages for AI search](/guide/faq-page-ai-search).",
            "Put the price list in the page body as a table, not only in a PDF. Past seasonal campaign pages can be left out of llms.txt from the Nurevo AEO panel in the block editor.",
            "Open /llms.txt and check that your price, enrolment, intensive course, directions and FAQ pages are listed. Run the diagnosis on the AEO score screen and fix what is missing.",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not print a second graph; it adds only the missing address, phone, hours, services and FAQ to the SEO plugin's graph. On a site that isn't WordPress, the checks are the same: put your URL into the [free check](/check), no sign-up needed, to see your structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Your approval status and the licence types it covers are written as text on the home and about pages.",
            "The page body has a table of tax-inclusive totals by licence type, automatic/manual, existing licence and age.",
            "What the total includes and excludes (such as fees paid to the authority) is written out.",
            "The price of extra lessons and re-tests, and the guarantee's scope, deadline and exclusions, are written out.",
            "The withdrawal procedure, how refunds are calculated and what is non-refundable are written out.",
            "The fastest and typical timelines are given separately, with how booking goes in busy seasons.",
            "The course deadline, how to book, the lesson cancellation deadline and the pick-up area and times are written out.",
            "The intensive-course page covers accommodation, meals, travel, extra nights, cancellation fees and start dates.",
            "Pass rates and other figures come with the test, denominator, period and source.",
            "Google Business Profile and portal listings show the same prices and hours as your site.",
          ],
        },
        {
          heading: "Checking whether AI mentions you, and gets it right",
          paragraphs: [
            "Once the pages are in order, ask AI what a prospective learner would ask. Check whether your name comes up for questions like \"driving school in Springfield with pick-up\" or \"two-week intensive course, automatic\". Then ask with your school's name: \"What is the total cost?\", \"Are there extra charges?\", \"Is it officially approved?\", \"Do I get a refund if I quit?\" and compare the answers with your site. Look out for old prices or campaigns that have ended.",
            "AI answers change each time, so ask the same questions at intervals and keep a record. Nurevo AEO's Free and Standard plans ask Perplexity three questions built from your business type and area (without your business name) once a month and record whether your name or site appears. The Pro plan (from USD 99 a month) adds the beta AI visibility measurement, with competitor comparison and trends (currently on Perplexity). Both look at a sample of answers, not every answer. See [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a driving school start with AI search?", a: "Start by writing your approval status and a text table of tax-inclusive totals per licence type, with what is included and when extra charges apply. Then add the guarantee, withdrawal and refunds, and the timeline, and keep the same facts in your structured data, llms.txt, Google Business Profile and portal listings." },
        { q: "Is a PDF price list enough?", a: "You can keep the PDF, but put the prices in the page body as a table too. AI may skip or misread figures inside PDFs and images, and then answer from an old portal listing or a guess." },
        { q: "Does advertising \"pass in X days\" help me get recommended?", a: "There is no official statement that a shorter timeline gets a school recommended. If you only give the fastest time, AI may present it as typical, and the gap with reality can lead to complaints. Give the fastest and the typical time separately." },
        { q: "Should I use a DrivingSchool schema type?", a: "Schema.org has no DrivingSchool type (checked in schema-dts 2.1.0, November 2026). Publish the school as a LocalBusiness and each licence course as a Service with an Offer. DrivingSchoolVehicleUsage describes how a car is used, not the school." },
        { q: "If we are listed on booking portals, do we still need to fix our own site?", a: "Portals help people comparing schools find you, but AI may read both the portal and your site. With the totals, terms and how to apply on your own site, and portal listings that match it, AI is less likely to give conflicting answers." },
        { q: "Is Nurevo AEO free?", a: `Yes. Structured data for your business type, contact details, hours, services and FAQ, llms.txt, AI crawler settings, the AEO score and a free monthly AI check are on the Free plan. Paid plans add always-current rules (Standard, USD 20 a month) and the beta AI visibility measurement (Pro, from USD 99 a month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee that ChatGPT recommends us?", a: "No. AI answers change, and no tool or method can guarantee appearance or ranking. What you can do is publish your approval, totals, extra charges, timeline and refund terms in a form AI can read, and keep checking whether you appear and whether the answers are right." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your driving school's website",
        body: "The free check needs no sign-up: enter a URL to see the state of your structured data, llms.txt and AI crawler access. On WordPress, the free Nurevo AEO plugin publishes your licence courses and FAQ.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and the names of the organisations cited in this guide are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
