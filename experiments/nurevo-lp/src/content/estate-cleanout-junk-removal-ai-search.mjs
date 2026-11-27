// Content page: AI search (AEO) for estate clean-out (遺品整理) and junk removal
// (不用品回収) businesses. Industry page.
// Angle: the facts AI needs to tell a lawful, clearly priced operator from the
// rest: which permit covers household waste (一般廃棄物収集運搬業 from the
// municipality, or collection by a permitted partner) versus 産業廃棄物 and
// 古物商 permits that do not cover it, a price written as a load definition plus
// what is added, home appliances under 家電リサイクル法, buying (買取) kept
// separate with receipts, and for 遺品整理: keep / sell / dispose sorting,
// valuables and documents, attendance, and who decides. Separate from
// moving-company-ai-search (不用品 only as a line in a table),
// house-cleaning-housekeeping-ai-search, emergency-home-repair-ai-search and
// uravation's 便利屋 article.
//
// Written 2026-11-27 8時 (JST). Nurevo AEO facts from the plugin source
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2): wizard card
// "その他" (Other) leaves the type empty and publishes LocalBusiness when address,
// phone or hours are set; any schema.org type name can be entered in the business
// type setting; Services up to 20 as Service + Offer and llms.txt lines;
// webmcp_canary_business_node filter for areaServed / hasCredential. Free monthly
// check: three questions to Perplexity built from type and area, never the name.
// Pro measurement (beta) on Perplexity. Prices: Free 0, Standard 3,000 JPY / USD 20,
// Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-27):
// - 国民生活センター「不用品回収サービスのトラブル」(公表 2022-11-02、更新 11-11):
//   PIO-NET 2018年度 1,354 / 2019 1,457 / 2020 1,788 / 2021 2,231 / 2022 857 (9月末
//   まで). 軽トラックパック7,000円 → 当日25万円; 詰め放題が荷台のあおりの高さまで;
//   1台分を2台分で請求; キャンセル料. Advice: 市区町村のサイトで一般廃棄物処理業の
//   許可業者を探す、複数の見積もり、追加料金がかからないことの確認、作業内容・料金・
//   キャンセル料、当日の値上げは断る、訪問販売のクーリング・オフの可能性. 家庭のごみは
//   一般廃棄物処理業の許可か市区町村の委託が必要; 産業廃棄物処理業の許可のみの事業者
//   とのトラブル. 家電4品目と小売店の引き取り.
// - 国民生活センター「遺品整理サービスの契約トラブル」(2018-07-19): 2013年度 73 /
//   2014 109 / 2015 90 / 2016 114 / 2017 105 / 2018年度 31 (6/30まで、前年同期16).
//   Cases: せかされて契約、高額なキャンセル料、見積もりの2倍の請求、処分しないよう
//   頼んだ物の処分. Advice: 複数の見積もり、書面、料金・キャンセル料・作業内容、残す
//   物と処分する物を分ける.
// - 環境省 報道発表 不用品回収業者に関する調査 (2011-05-23): consumers 「わからない」
//   84.5% about the permit; 家庭から業として収集運搬するには市町村長の一般廃棄物
//   収集運搬業の許可が原則必要.
// - 環境省 令和5年度 報告書 (令和6年3月22日) 000214350.pdf: a 古物商 holder with no
//   receipts was judged to collect 一般廃棄物 without a permit; another municipality
//   could not confirm the 古物商許可 printed on flyers.
// - 環境省 廃家電・粗大ごみ Q&A: 産業廃棄物処理業・古物商の許可では家庭の廃棄物を
//   回収できない; 家電4品目はリサイクル料金と収集運搬料金、家電リサイクル券.
// - 杉並区 (更新 2025-06-10), 千葉市 (更新 2025-07-30): same rule at municipal level;
//   千葉市 says even permit holders take household waste only for 一時多量ごみ等; ask
//   for a written estimate, 引き取り書・領収書.
// - 愛知県警 古物営業法の解説 (公開 2025-12-15): 古物の売買・交換を業として行うには
//   古物商の許可; buying from the public at the 営業所 or the seller's home.
// - 神戸新聞NEXT (2026-10-29): ブランディングワークス (2026年9月) 54 answers from
//   ChatGPT and Gemini; くらしのマーケット 言及率 51.9%, ミツモア 50.0%, メルカリ 37.0%;
//   cited sites meetsmore.com 10.8%, curama.jp 10.3%. Primary report not linked.
// - EPA "Household Hazardous Waste" (updated 2026-06-01): paints, cleaners, oils,
//   batteries, pesticides; many communities run HHW collection; regulated at state
//   and local level. EPA HHW and demolition (updated 2026-03-09): propane and oxygen
//   tanks; your state may not allow HHW in household trash.
// - schema-dts 2.1.0: no junk-removal / estate-clean-out type. RecyclingCenter is a
//   LocalBusiness subtype (a recycling facility). HomeAndConstructionBusiness covers
//   MovingCompany, Plumber, etc. Organization has hasCredential.
// Top articles read 2026-11-27: uravation 不用品回収・遺品整理 (2026-08-28),
// uravation 便利屋 (2026-10-26), サングローブ 不用品回収の集客 (2025-11-25, upd
// 2026-07-15), 神戸新聞NEXT (2026-10-29); Texta junk removal & hauling, Texta estate
// liquidation (no dates), FindSkill (2026-06-16), The Haulers Edge (2026-08-09),
// Servgrow (no date), Workiz (upd 2026-05-11). stock-sun の2本は取得できず.
// Not verified, so not stated: 料金の相場, 遺品整理士の資格の要件, 訪問購入の
// クーリング・オフの日数, FTC contractor guidance (not read), US state licence rules,
// the share of people who use AI to find these firms.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  kokusenJunk: "https://www.kokusen.go.jp/news/data/n-20221102_1.html",
  kokusenEstate: "https://www.kokusen.go.jp/news/data/n-20180719_1.html",
  envPress: "https://www.env.go.jp/press/13804.html",
  envReport: "https://www.env.go.jp/content/000214350.pdf",
  envQa: "https://www.env.go.jp/recycle/kaden/tv-recycle/qa.html",
  suginami: "https://www.city.suginami.tokyo.jp/s104/753.html",
  chiba: "https://www.city.chiba.jp/kankyo/junkan/sangyohaikibutsu/huyouhinkaisyu.html",
  aichiKobutsu: "https://www.pref.aichi.jp/police/shinsei/sonota/kobutsu/kobutukaisetu.html",
  kobeNp: "https://www.kobe-np.co.jp/rentoku/omoshiro/202610/0020978970.shtml",
  epaHhw: "https://www.epa.gov/hw/household-hazardous-waste-hhw",
  epaDemolition: "https://www.epa.gov/large-scale-residential-demolition/household-hazardous-waste-and-demolition",
  gbpGuidelines: "https://support.google.com/business/answer/3038177?hl=ja",
  gbpGuidelinesEn: "https://support.google.com/business/answer/3038177?hl=en",
  localBusiness: "https://schema.org/LocalBusiness",
  recyclingCenter: "https://schema.org/RecyclingCenter",
  uravation: "https://uravation.com/llmo/fuyohin-kaishu-ihin-seiri-llmo-taisaku/",
  uravationBenriya: "https://uravation.com/llmo/benriya-llmo-taisaku/",
  sungrove: "https://www.sungrove.co.jp/fuyouhin-marketing/",
  texta: "https://www.texta.ai/api/md/how-to-rank-business-on-ai/home-services/junk-removal-and-hauling",
  textaEstate: "https://www.texta.ai/api/md/how-to-rank-business-on-ai/real-estate/estate-liquidation",
  findskill: "https://findskill.ai/blog/junk-removal-marketing-found-by-ai/",
  haulersEdge: "https://thehaulersedge.beehiiv.com/p/chatgpt-doesn-t-know-you-exist",
  workiz: "https://www.workiz.com/blog/tips-tricks/how-to-get-your-site-to-apear-in-ai-search-results/",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#organization",
      "name": "例クリーンサービス（例）",
      "description": "◯◯市の遺品整理・不用品回収の会社です。家庭のごみの収集運搬は◯◯市の一般廃棄物収集運搬業の許可（第◯◯号）で行い、まだ使える品の買取は古物商許可（◯◯県公安委員会 第◯◯号）で行います。料金ページに、荷台の量の決め方と追加になる費用を載せています。",
      "url": "https://example.jp/",
      "telephone": "+81-00-0000-0000",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "◯◯県",
        "addressLocality": "◯◯市",
        "streetAddress": "◯◯町1-2-3"
      },
      "areaServed": { "@type": "City", "name": "◯◯市" }
    },
    {
      "@type": "Service",
      "name": "軽トラック1台分の不用品回収",
      "serviceType": "不用品回収",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": {
        "@type": "Offer",
        "price": "33000",
        "priceCurrency": "JPY",
        "description": "税込33,000円の例。荷台の囲い（あおり）の高さまで積める量で、作業員2名・運搬・処分費を含みます。家電4品目のリサイクル料金、3階以上の階段での運び出し、解体が必要な家具は別料金で、作業の前に書面でお伝えします。"
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
      "name": "Example Clear-Outs",
      "description": "Junk removal and estate clean-outs in Example City. Our pricing page explains how a truck load is measured, what is added to it, and the items we cannot take, such as paint, pesticides and propane tanks.",
      "url": "https://example.com/",
      "telephone": "+1-000-000-0000",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "Example State",
        "addressLocality": "Example City",
        "streetAddress": "1 Example Road"
      },
      "areaServed": { "@type": "City", "name": "Example City" }
    },
    {
      "@type": "Service",
      "name": "Half truck load junk removal",
      "serviceType": "Junk removal",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": {
        "@type": "Offer",
        "price": "350",
        "priceCurrency": "USD",
        "description": "$350 including tax, an example. Half of our 15-cubic-yard truck, two crew, loading, haul-away and disposal fees. Mattresses, appliances with refrigerant and stairs above the second floor are added at the listed rates and confirmed in writing before we start."
      }
    }
  ]
}`;

const PHP_JA = `// 対応エリアと許可を事業者のノードに足す（値は本文と同じにする）
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'City', 'name' => '◯◯市'),
    );
    $node['hasCredential'] = array(
        array(
            '@type' => 'EducationalOccupationalCredential',
            'name' => '一般廃棄物収集運搬業の許可（◯◯市 第◯◯号）',
            'recognizedBy' => array('@type' => 'GovernmentOrganization', 'name' => '◯◯市'),
        ),
        array(
            '@type' => 'EducationalOccupationalCredential',
            'name' => '古物商許可（◯◯県公安委員会 第◯◯号）',
            'recognizedBy' => array('@type' => 'GovernmentOrganization', 'name' => '◯◯県公安委員会'),
        ),
    );
    return $node;
}, 10, 2);`;

const PHP_EN = `// Add the service area and your licence to the business node (same values as the page text)
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'City', 'name' => 'Example City'),
    );
    $node['hasCredential'] = array(
        '@type' => 'EducationalOccupationalCredential',
        'name' => 'Waste hauler licence, Example City (No. 000)',
        'recognizedBy' => array('@type' => 'GovernmentOrganization', 'name' => 'Example City'),
    );
    return $node;
}, 10, 2);`;

export default {
  slug: "estate-cleanout-junk-removal-ai-search",
  targetQueries: [
    "遺品整理 AI検索対策",
    "不用品回収 業者 ChatGPT 集客",
    "不用品回収 LLMO 許可 料金表示",
    "junk removal company AI search optimization",
    "estate cleanout company get recommended by ChatGPT",
    "junk removal schema markup",
  ],
  related: ["pricing-page-ai-search", "faq-page-ai-search", "moving-company-ai-search", "house-cleaning-housekeeping-ai-search", "agency-reviews-testimonials-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "遺品整理・不用品回収のAI検索対策：許可・料金・買取の書き方 | Nurevo",
      description: "遺品整理・不用品回収のAI検索対策。家庭のごみを運べる許可の書き方、積み放題の量と追加料金、家電4品目、買取との分け方、遺品の仕分けを、AIに正しく読ませる手順と構造化データ・WordPressの設定例。",
      h1: "遺品整理・不用品回収のAI検索対策：許可の区分、料金の決め方、買取と処分の違いをAIに正しく読ませる手順",
      lead: "遺品整理・不用品回収の会社のAI検索対策（AEO）で一番大事なのは、AIが「頼んで大丈夫な業者か」「結局いくらか」を答えられる事実を、サイトに文字で書くことです。具体的には、家庭のごみを運ぶための市町村の許可（一般廃棄物収集運搬業）を持っているか、持っていない場合はどの許可業者に運搬を任せるか、積み放題などの量の決め方と追加になる費用、家電4品目の扱い、買取（古物商許可）と処分を分けた書き方、遺品整理なら残す物の仕分けと立ち会いの方法です。そのうえで同じ事実を、Googleビジネスプロフィールと構造化データ（LocalBusiness＋Service）に出します。",
      intro: [
        "作成日：2026年11月27日（JST）。国民生活センター・環境省・自治体・警察のページは、本文に記したリンク先で2026年11月27日に確認しました。この記事は法的な助言ではありません。許可の要件や扱いは市区町村によって違うので、営業する地域の担当の窓口で確かめてください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがあなたの会社の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "遺品整理・不用品回収でAIに聞かれること",
          paragraphs: [
            "不用品回収と遺品整理は、料金のトラブルや無許可の業者の話題がよく報じられる分野です。そのため、AIに投げられる質問も「安いところ」だけでなく「ちゃんとした業者か」「あとから高くならないか」が多くなります。AIがこうした質問に答えるには、許可・料金の決め方・追加料金の条件が、どこかに文字で書かれている必要があります。",
          ],
          table: {
            head: ["質問の型", "質問の例", "AIが答えに必要な事実"],
            rows: [
              ["許可", "「◯◯市で家庭の不用品を回収できる許可業者は？」", "一般廃棄物収集運搬業の許可の市町村名と番号、または運搬を任せる許可業者の名前"],
              ["総額", "「軽トラック1台分でいくら？何が別料金？」", "量の決め方（荷台のどこまでか）、含まれるもの、追加になる費用と金額"],
              ["家電", "「冷蔵庫と洗濯機も一緒に持っていける？」", "家電4品目の扱い、リサイクル料金と運搬料金、家電リサイクル券"],
              ["買取", "「まだ使える家具は買い取ってもらえる？」", "古物商許可の公安委員会名と番号、買取の明細の出し方、処分費との相殺のしかた"],
              ["遺品整理", "「実家の片付けで、写真や書類は残してもらえる？」", "仕分けの方法、貴重品・書類の扱い、立ち会いなしの対応、供養の手配"],
              ["日程・キャンセル", "「明日来られる？キャンセル料は？」", "最短の日程、見積もりの方法（訪問・写真）、キャンセル料の条件"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            `2026年11月27日に、日本語と英語で「遺品整理 AI検索対策」「junk removal AI search」などの上位記事を10本読みました。日本語では、[uravationの不用品回収・遺品整理の記事](${SRC.uravation})（2026年8月28日）が、許可の区分・料金の変動条件・口コミの扱いを公的なリンク付きでくわしく扱っています。ただし、家電リサイクル法には触れておらず、構造化データの例とWordPressでの手順はありません。同じサイトの[便利屋の記事](${SRC.uravationBenriya})も、家庭ごみの回収と買取を分ける考え方は同じですが、遺品整理の具体的な書き方はありません。[サングローブの不用品回収の集客の記事](${SRC.sungrove})（2026年7月更新）は広告・MEO・チラシの話が中心で、AI検索と許可の書き方は扱っていません。[神戸新聞NEXTの記事](${SRC.kobeNp})（2026年10月29日）は、AIが比較サイトや予約サイトをよく挙げることを紹介していますが、業者がどうすればいいかは書いていません。`,
            `英語では、[Texta](${SRC.texta})の不用品回収と[遺品の処分（estate liquidation）](${SRC.textaEstate})のページは同じひな形で、「50件以上の口コミ」などの基準に出典がありません。[FindSkill](${SRC.findskill})（2026年6月）と[The Haulers Edge](${SRC.haulersEdge})（2026年8月）はGoogleビジネスプロフィールやChatGPTでの確かめ方に触れますが、料金の書き方や引き取れない物の一覧はありません。[Workiz](${SRC.workiz})（2026年5月更新）は構造化データの種類を挙げますが、業種に合わせた例はありません。どの記事にも、量の決め方と追加料金を表にした料金の書き方、家電と危険物の扱い、買取と処分の分け方、WordPressでの設定はありません。この記事は、これらを埋めます。`,
          ],
        },
        {
          heading: "まず許可を書く：家庭のごみは市町村の許可か、許可業者への委託",
          paragraphs: [
            `家庭から出る不用品を、お金をもらって集めて運ぶには、原則として市町村長の「一般廃棄物収集運搬業」の許可が必要です。[環境省：不用品回収業者に関する調査結果（2011年5月23日）](${SRC.envPress})。環境省のQ&Aは、産業廃棄物処理業の許可や古物商の許可では、家庭から出る廃棄物を回収できないと説明しています。[環境省：廃家電・粗大ごみの無許可回収業者 Q&A](${SRC.envQa})。杉並区・千葉市も同じ注意を出しています。[杉並区（2025年6月10日更新）](${SRC.suginami})・[千葉市（2025年7月30日更新）](${SRC.chiba})`,
            `一方で、消費者は許可のことをよく知りません。環境省の2011年の調査では、不用品回収業者を使った人のうち、その業者の許可を「わからない」と答えた人が84.5%でした。[環境省（2011年5月23日）](${SRC.envPress})。古い調査ですが、だからこそ、許可の情報は業者のサイトに「どこの、何の許可か」まで書いておく意味があります。`,
          ],
          table: {
            head: ["書く項目", "書き方の例"],
            rows: [
              ["一般廃棄物収集運搬業の許可", "◯◯市 一般廃棄物収集運搬業 許可 第◯◯号（許可の範囲：◯◯市内の家庭から出る◯◯）。許可のある市町村を全部、名前で書く"],
              ["許可を持っていない場合", "運搬と処分は◯◯市の許可業者「◯◯（例）」に任せています。当社は仕分け・運び出し・梱包を行います"],
              ["古物商許可", "◯◯県公安委員会 第◯◯号。まだ使える品の買取に使う許可で、ごみの回収の許可ではないことを書く"],
              ["産業廃棄物収集運搬業の許可", "お店や会社から出る廃棄物のための許可であることを書き、家庭の不用品の回収の根拠にしない"],
              ["許可のない地域", "◯◯町は許可がないため、町の粗大ごみの受付や、町の許可業者をご案内します"],
            ],
            caption: "許可の範囲や扱いは市区町村によって違います（千葉市では、許可業者でも家庭のごみを扱えるのは一時的に大量に出るごみなどに限られます）。自分の許可の内容どおりに書いてください。",
          },
          after: [
            "許可番号は、トップページのフッターだけでなく、料金ページと会社概要、対応エリアのページにも同じ表記で書きます。許可のない市町村を「対応エリア」に入れると、AIが「その地域で回収できる」と答えてしまうおそれがあります。",
          ],
        },
        {
          heading: "料金は「量の決め方」と「追加になる費用」で書く",
          paragraphs: [
            `国民生活センターには、不用品回収サービスの相談が2018年度1,354件、2019年度1,457件、2020年度1,788件、2021年度2,231件寄せられています（2022年度は9月末までで857件）。紹介されている事例には、「軽トラックパック7,000円」の広告を見て頼んだら当日に25万円を請求された、「詰め放題」が荷台の囲い（あおり）の高さまでだった、1台分を2台分として請求された、といったものがあります。[国民生活センター：不用品回収サービスのトラブル（2022年11月2日公表、11月11日更新）](${SRC.kokusenJunk})`,
            "つまり、AIとお客様が知りたいのは「1台いくら」だけではなく、その1台に何がどこまで入って、何が別になるかです。料金ページには、パックの価格を出す場合でも、次の項目を文字で書きます。",
          ],
          table: {
            head: ["書く項目", "書き方の例"],
            rows: [
              ["量の決め方", "軽トラック1台分＝荷台の囲い（あおり）の高さまで。2tトラックは◯㎥まで。写真で例を示す"],
              ["含まれるもの", "作業員2名、運び出し、運搬、処分費（税込）"],
              ["追加になる費用", "3階以上の階段作業 1階ごとに◯円、解体が必要な家具 1点◯円、エアコンの取り外し 1台◯円"],
              ["家電4品目", "リサイクル料金（メーカーと品目ごとに決まった額）と収集運搬料金は別。家電リサイクル券をお渡しします"],
              ["引き取れない物", "消火器・ガスボンベ・塗料・農薬・医療系の廃棄物など。処分先のご案内の有無"],
              ["見積もりとキャンセル", "訪問見積もりは無料。作業日の前日までのキャンセルは無料、当日は◯円。見積もり後に金額が変わる条件"],
            ],
            caption: "金額と条件は書き方の例です。自分の会社の実際の料金と、自治体の決まりに合った内容を書いてください。",
          },
          after: [
            `国民生活センターは消費者に、複数の業者から見積もりを取り、作業内容・料金・キャンセル料と「追加料金がかからないこと」を確かめるよう勧めています。[国民生活センター](${SRC.kokusenJunk})。サイトにこの4つが書いてあれば、AIがその業者を説明するときの材料になります。料金ページ全般の書き方は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)をご覧ください。`,
          ],
        },
        {
          heading: "家電4品目は、料金の内訳と流れを書く",
          paragraphs: [
            `エアコン、テレビ、冷蔵庫・冷凍庫、洗濯機・衣類乾燥機の4品目は、家電リサイクル法の対象です。引き渡すときには、リサイクル料金と収集運搬料金がかかり、家電リサイクル券が発行されます。[環境省 Q&A](${SRC.envQa})。国民生活センターの資料では、買い替えのときは新しい製品を買う店が、処分だけのときは買った店が引き取ることになっています。[国民生活センター](${SRC.kokusenJunk})`,
          ],
          list: [
            "4品目を引き取る場合は、リサイクル料金と収集運搬料金を分けて書き、家電リサイクル券の控えを渡すことを書きます。",
            "引き取らない場合は、そのことと、お客様が使える方法（買った店、自治体の案内）へのリンクを書きます。",
            "パソコンや小型の家電など、4品目以外の扱いも、自治体の決まりに合わせて書きます。",
          ],
        },
        {
          heading: "買取と処分を分けて書く：古物商許可はごみの許可ではない",
          paragraphs: [
            `まだ使える品を買い取って売るには、古物商の許可が必要です。古物の売買・交換を仕事として行う場合の許可で、買い取る場所も、営業所かお客様の住所などに決められています。[愛知県警察：古物営業法の解説（2025年12月15日公開）](${SRC.aichiKobutsu})。ただし、古物商の許可は、ごみを回収する許可ではありません。[環境省 Q&A](${SRC.envQa})`,
            `環境省の2024年3月の報告書では、古物商の許可を持つ業者が引き取りの記録を渡していなかったため、自治体がその品を一般廃棄物と判断し、無許可の回収として扱った例が紹介されています。チラシに書かれた古物商許可の真偽が確かめられない、という自治体の声もあります。[環境省：令和5年度 適正なリユースの促進及び違法な不用品回収業者対策 報告書（PDF）](${SRC.envReport})`,
          ],
          list: [
            "買取の品と、処分する品の料金を、見積もりと明細で分けて書きます。「買取額を処分費から差し引く」場合は、その計算を明細に残すことを書きます。",
            "買い取った品には、買取の明細（品名・数・金額）を渡すことを書きます。",
            `「無料回収」と書く場合は、何が無料で、どんなときに費用がかかるかを書きます。杉並区・千葉市は、無料をうたって集めたあとで料金を求める業者への注意を出しています。[杉並区](${SRC.suginami})・[千葉市](${SRC.chiba})`,
          ],
        },
        {
          heading: "遺品整理：仕分け・貴重品・立ち会い・誰が決めるかを書く",
          paragraphs: [
            `国民生活センターに寄せられた遺品整理サービスの相談は、2013年度73件から2017年度105件と増え、2018年度は6月末までで31件（前年の同じ時期は16件）でした。事例には、見積もりのときにせかされて契約した、高額なキャンセル料を求められた、見積もりの2倍を請求された、「処分しないように」と頼んだ物まで処分された、といったものがあります。[国民生活センター：遺品整理サービスの契約トラブル（2018年7月19日）](${SRC.kokusenEstate})`,
            "遺品整理では、料金に加えて「大事な物をどう扱うか」が、お客様の一番の心配です。次のことを、作業の流れのページに書きます。",
          ],
          list: [
            "仕分けの方法：「残す物」「売る物」「処分する物」をどう決めるか。事前に印を付けてもらうのか、当日に一緒に確認するのか。",
            "貴重品・書類・写真：現金、通帳、権利書、写真や手紙が見つかったときの扱い（まとめて保管し、作業の終わりにお渡しする など）。",
            "立ち会い：立ち会いなしで作業する場合の鍵の受け渡し、作業前と作業後の写真の報告。",
            "誰が決めるか：依頼する人と、片付ける家の持ち主や家族が違う場合に、誰の同意をもらって作業するか。",
            "供養・ハウスクリーニング・賃貸の退去：自社でするか、提携先に頼むか、しないか。",
            "資格の書き方：遺品整理士などの民間の資格は、国の許可とは別のものとして書きます。",
          ],
        },
        {
          heading: "比較サイト・予約サイトの掲載と、Googleビジネスプロフィールをそろえる",
          paragraphs: [
            `神戸新聞NEXTの記事（2026年10月29日）は、株式会社ブランディングワークスの2026年9月の調査として、ChatGPTとGeminiに不用品回収サービスのおすすめを聞いた54件の回答で、くらしのマーケットが51.9%、ミツモアが50.0%の回答に出たと紹介しています。[神戸新聞NEXT](${SRC.kobeNp})。調べた回答の数は少なく、元の調査の資料はリンクされていませんが、AIが個別の業者より比較サイト・予約サイトを挙げることがある、という点は覚えておく価値があります。`,
          ],
          list: [
            "比較サイト・予約サイトに載せている場合は、会社名・許可番号・料金の決め方・対応エリアを、自社サイトと同じにします。",
            `Googleビジネスプロフィールの名前に「◯◯市 不用品回収 即日」のような地域名やサービス名を足すことは、ガイドラインで認められていません。[Google：ビジネス情報のガイドライン](${SRC.gbpGuidelines})`,
            "口コミの依頼のしかたには決まりがあります。[口コミ・お客様の声とAI検索](/guide/agency-reviews-testimonials-ai-search/)をご覧ください。引っ越しと一緒に頼まれることが多い場合は、[引越し会社のAI検索対策](/guide/moving-company-ai-search/)、ハウスクリーニングもしている場合は[家事代行・ハウスクリーニングのAI検索対策](/guide/house-cleaning-housekeeping-ai-search/)もあわせてご覧ください。",
          ],
        },
        {
          heading: "構造化データ：専用の型はない。LocalBusiness＋Service",
          paragraphs: [
            `schema.orgには、不用品回収や遺品整理のための専用の型はありません（schema-dts 2.1.0で確認、2026年11月27日）。[RecyclingCenter](${SRC.recyclingCenter})はリサイクルの施設を表す型なので、施設を持って営業している場合でなければ使いません。会社は[LocalBusiness](${SRC.localBusiness})で出し、不用品回収・遺品整理・買取などを Service と Offer で、対応エリアを areaServed で、許可を hasCredential で書きます。`,
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データの料金は本文と同じにします。作業によって大きく変わる遺品整理の料金は、Offer に1つの金額を入れず、本文の総額の例と条件で説明します。",
          ],
        },
        {
          heading: "WordPressの遺品整理・不用品回収のサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「その他」を選びます。業種の型を指定しない設定で、住所・電話番号・営業時間のどれかが入っていれば LocalBusiness として出力されます。",
            "会社名・住所・電話番号・受付時間を、Googleビジネスプロフィールと同じ表記で入れます。",
            "不用品回収（トラックの大きさごと）・遺品整理・生前整理・買取・家電の引き取りなどを「サービス」に登録します（最大20件）。名前・料金・見積もり依頼のURL・説明を入れ、説明に「含まれるもの・追加になるもの」を書きます。サービスは構造化データ（Service）とllms.txtに載ります。",
            "対応エリア（areaServed）と許可（hasCredential）の入力欄はないので、下の webmcp_canary_business_node フィルターで足します。値は本文と同じにします。Yoast SEOなどが有効な場合は、そのプラグインがすでに出している値が優先されます。",
            "許可・追加料金・家電・買取・貴重品の扱いの答えをよくある質問に入力し、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を料金ページに置きます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search/)をご覧ください。",
            "/llms.txt を開き、料金・許可・遺品整理の流れ・よくある質問のページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "一般廃棄物収集運搬業の許可の市町村名と番号、または運搬を任せる許可業者の名前が書かれている。",
            "古物商許可と産業廃棄物の許可が、家庭のごみの許可と混ざらないように書かれている。",
            "対応エリアに、許可のない市町村が入っていない（入れる場合は扱いを書いている）。",
            "トラック1台分などの量の決め方が、言葉と写真で書かれている。",
            "含まれるもの・追加になる費用・キャンセル料が、金額と条件で書かれている。",
            "家電4品目のリサイクル料金と収集運搬料金が分けて書かれている。",
            "引き取れない物と、その処分先の案内が書かれている。",
            "買取と処分の料金を明細で分け、買取の明細を渡すことが書かれている。",
            "遺品整理の仕分け・貴重品・立ち会い・同意の取り方が書かれている。",
            "構造化データが LocalBusiness＋Service で、料金と許可が本文と同じ。llms.txtに主なページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、お客様が聞きそうな質問をAIに投げます。「◯◯市 不用品回収 許可業者」「◯◯市 遺品整理 立ち会いなし」のような地域＋サービスの質問で名前が出るかに加えて、会社の名前を入れて「許可は持っている？」「軽トラック1台でいくら？何が別料金？」「冷蔵庫も持っていける？」と聞き、答えがサイトの事実と合っているかを見ます。古物商許可がごみの許可として説明されていないか、許可のない市町村が対応エリアとして答えられていないかも確かめます。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、結果を記録します。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（会社の名前は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在はPerplexity）。どちらも回答の一部を見本として調べるもので、すべての回答を見ているわけではありません。くわしくは[AIでの登場率の測り方](/guide/measure-ai-visibility/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "不用品回収のAI検索対策は、何から始めればいいですか？", a: "まず、家庭のごみを運ぶ許可（一般廃棄物収集運搬業）の市町村名と番号、または運搬を任せる許可業者を書きます。次に、トラック1台分などの量の決め方、含まれるもの、追加になる費用とキャンセル料を料金ページに書きます。そのうえで、Googleビジネスプロフィールと比較サイトの掲載をそろえ、構造化データとllms.txtで出します。" },
        { q: "一般廃棄物の許可を持っていない場合は、どう書けばいいですか？", a: "持っていない許可を持っているように書かないでください。運搬と処分を任せる許可業者がいる場合は、その名前と、自社がする作業（仕分け・運び出しなど）を分けて書きます。いない地域は、自治体の粗大ごみの受付や許可業者の案内を書きます。" },
        { q: "古物商許可があれば、家庭の不用品を回収できますか？", a: "環境省は、古物商の許可や産業廃棄物処理業の許可では、家庭から出る廃棄物を回収できないと説明しています。古物商許可は、まだ使える品を買い取って売るための許可として書きます。" },
        { q: "料金を「〜円から」と書くのは問題ですか？", a: "「〜円から」だけだと、AIもお客様も総額を取り違えやすくなります。量の決め方、含まれるもの、追加になる費用の条件と金額を一緒に書き、総額の例を1つ載せることをおすすめします。" },
        { q: "遺品整理の料金を構造化データに入れるべきですか？", a: "部屋の広さや物の量で大きく変わる場合は、Offer に1つの金額を入れず、本文に総額の例と条件を書きます。トラック1台分のように決まった料金があるサービスは、本文と同じ金額で Offer に入れられます。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ず紹介されますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、許可・料金の決め方・買取と処分の違い・遺品の扱いをAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの会社のサイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOで不用品回収・遺品整理・買取のサービスとよくある質問を無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleとGeminiはGoogle LLCの商標です。くらしのマーケット、ミツモア、メルカリ、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Junk Removal & Estate Clean-Outs | Nurevo",
      description: "AEO for junk removal and estate clean-out firms: write your licence, how a load is priced, what costs extra, what you can't take and how buying differs from disposal.",
      h1: "AI search for junk removal and estate clean-out companies: getting AI to read your licence, load pricing, refused items and resale correctly",
      lead: "AI search optimization (AEO) for a junk removal or estate clean-out company comes down to writing, as text on your own site, the facts AI needs to answer two questions: is this a legitimate hauler, and what will it really cost. That means the waste licence or permit you hold and where it is valid (or which licensed hauler you use), how a load is measured and what is added to the price, the items you cannot take, how resale or buying is kept separate from disposal, and, for estate clean-outs, how keepsakes, valuables and documents are handled. Then publish the same facts in your Google Business Profile and in structured data (LocalBusiness with Service).",
      intro: [
        "Written November 27, 2026 (JST). Several examples come from Japan, where we checked the consumer agency, environment ministry and city pages on November 27, 2026, and the US examples come from EPA pages read the same day. Waste licensing and disposal rules differ by country, state and city, so check the ones that apply where you work. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention you or rank you anywhere.",
      ],
      sections: [
        {
          heading: "What people ask AI about junk removal and estate clean-outs",
          paragraphs: [
            "Junk removal is a field where price disputes and unlicensed operators make the news, so people do not only ask AI for the cheapest option. They ask whether a company is legitimate and whether the price will grow on the day. AI can only answer those questions if your licence, your pricing method and the conditions for extra charges are written down somewhere it can read.",
          ],
          table: {
            head: ["Question type", "Example question", "Facts AI needs from you"],
            rows: [
              ["Licence", "\"Which licensed junk haulers work in [city]?\"", "The licence or permit you hold, who issued it, its number, and where it is valid"],
              ["Total price", "\"How much is half a truck load, and what costs extra?\"", "How a load is measured, what is included, surcharges and their amounts"],
              ["Refused items", "\"Will they take paint, propane tanks or a fridge?\"", "Items you cannot take, items with a surcharge, where customers can take the rest"],
              ["Resale and donation", "\"Do they buy furniture or donate usable items?\"", "Whether you buy or donate, how it is shown on the invoice"],
              ["Estate clean-out", "\"Can they clear my parents' house and keep photos and papers aside?\"", "How sorting works, valuables and documents, unattended jobs, who signs off"],
              ["Booking", "\"Can they come tomorrow? Is there a cancellation fee?\"", "Earliest dates, how quotes are given (visit or photos), cancellation terms"],
            ],
            caption: "The example questions illustrate the article. They are not measured question frequencies.",
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            `On November 27, 2026 we read 10 top-ranking articles in English and Japanese. In English, [Texta's junk removal page](${SRC.texta}) and its [estate liquidation page](${SRC.textaEstate}) use the same template, with thresholds such as \"over 50 verified reviews\" and no sources. [FindSkill](${SRC.findskill}) (June 2026) and [The Haulers Edge](${SRC.haulersEdge}) (August 2026) cover Google Business Profile and testing ChatGPT, but say nothing about how to write prices or which items you refuse. [Workiz](${SRC.workiz}) (updated May 2026) lists schema types without an example for this trade.`,
            `In Japanese, [uravation's article on junk removal and estate clean-outs](${SRC.uravation}) (August 2026) covers permits, price conditions and reviews with official links, but not appliance recycling, structured data examples or WordPress steps. A [Kobe Shimbun NEXT article](${SRC.kobeNp}) (October 2026) reports that AI often names comparison and booking platforms, without advice for operators. None of the 10 showed a pricing table built on how a load is measured and what is added, covered hazardous items, separated buying from disposal, or gave WordPress setup. This article fills those gaps.`,
          ],
        },
        {
          heading: "Start with your licence, and where it is valid",
          paragraphs: [
            `Who may collect household waste for a fee is set locally. In Japan, collecting waste from homes as a business requires, in principle, a municipal general-waste collection licence. [Ministry of the Environment, May 23, 2011 (Japanese)](${SRC.envPress}). The ministry explains that an industrial-waste licence or a second-hand dealer licence does not allow collecting household waste. [Ministry of the Environment Q&A (Japanese)](${SRC.envQa}). In its 2011 survey, 84.5% of people who had used a junk collector said they did not know whether it was licensed. Few customers check, which is why the facts should be on your site.`,
            "Elsewhere, licences may be issued by a city, county or state, or not required at all. Whatever applies to you, write it in a form AI can repeat accurately.",
          ],
          table: {
            head: ["Item", "Example wording"],
            rows: [
              ["Your licence", "Waste hauler licence, Example City, No. 000 (valid for Example City). Name every place it covers"],
              ["If you use a partner", "Hauling and disposal are done by [licensed partner], a licensed hauler in Example City. We sort, carry out and load"],
              ["Other licences", "A second-hand or resale licence covers buying goods, not waste collection. Say which licence is for what"],
              ["Insurance", "Liability insurance with [insurer], certificate available on request (only if true)"],
              ["Places you do not cover", "We are not licensed in North Town. Please use the town's bulk waste service"],
            ],
            caption: "Wording is an example. Write what your licence actually covers.",
          },
          after: [
            "Put the licence on your pricing page, About page and each service-area page, in the same wording. If you list a town where you are not licensed as a service area, AI may tell people you can collect there.",
          ],
        },
        {
          heading: "Write prices as how a load is measured, plus what is added",
          paragraphs: [
            `Japan's National Consumer Affairs Center received 1,354 consultations about junk collection services in fiscal 2018, 1,457 in 2019, 1,788 in 2020 and 2,231 in 2021 (857 in fiscal 2022 to the end of September). Its examples include an advert for a 7,000-yen light-truck pack that turned into a 250,000-yen bill on the day, an \"all you can load\" offer that only went up to the height of the truck's side rails, and one truck load billed as two. [National Consumer Affairs Center, November 2, 2022 (Japanese)](${SRC.kokusenJunk})`,
            "The lesson travels: the price of \"one load\" means little unless you say how much fits in it and what costs extra. Even if you sell fixed packages, write these items in words.",
          ],
          table: {
            head: ["Item", "Example wording"],
            rows: [
              ["How a load is measured", "Our truck holds 15 cubic yards; a half load is 7.5 cubic yards, loaded no higher than the side rails. Photos show examples"],
              ["Included", "Two crew, loading, haul-away and disposal fees, including tax"],
              ["Surcharges", "Stairs above the second floor $X per floor, mattresses $X each, appliances with refrigerant $X each"],
              ["Items we cannot take", "Paint, solvents, pesticides, propane tanks, medical waste. Where customers can take them"],
              ["Minimum charge", "Minimum charge $X for a single item"],
              ["Quotes and cancellation", "Free on-site or photo quotes. Free cancellation until the day before; $X on the day. When a quote can change"],
            ],
            caption: "Amounts are placeholders. Write your real prices and the rules that apply where you work.",
          },
          after: [
            `The Consumer Affairs Center advises people to get several quotes and to confirm the work, the price, the cancellation fee and that no extra charges will be added. [National Consumer Affairs Center (Japanese)](${SRC.kokusenJunk}). If your site answers those four points, AI has the material to describe you. For pricing pages in general, see [pricing pages and AI search](/guide/pricing-page-ai-search/).`,
          ],
        },
        {
          heading: "Hazardous items and appliances: say what you refuse and why",
          paragraphs: [
            `In the United States, the EPA describes household hazardous waste as leftover household products that can catch fire, react or explode, such as paints, cleaners, oils, batteries and pesticides, and says it is regulated at the state and local level; many communities run collection programs. [EPA: Household Hazardous Waste (updated June 1, 2026)](${SRC.epaHhw}). Its page on demolition adds compressed gas tanks such as propane and oxygen, and notes that while federal law allows household hazardous waste in household trash, your state may not. [EPA: Household Hazardous Waste and Demolition (updated March 9, 2026)](${SRC.epaDemolition})`,
            `In Japan, air conditioners, televisions, refrigerators and freezers, and washing machines and dryers fall under the home appliance recycling law: handing one over involves a recycling fee and a collection fee, and a recycling ticket is issued. [Ministry of the Environment Q&A (Japanese)](${SRC.envQa})`,
          ],
          list: [
            "List the items you cannot take, and link to the local program or drop-off that accepts them.",
            "List items you take for a surcharge (mattresses, tyres, appliances with refrigerant) with the amount.",
            "For appliances covered by recycling rules, show the recycling fee separately from your own charge.",
          ],
        },
        {
          heading: "Keep buying, resale and donation separate from disposal",
          paragraphs: [
            `Buying used goods to sell on usually needs its own licence. In Japan it is a second-hand dealer licence from the prefectural public safety commission, which also limits where goods may be bought from the public. [Aichi Prefectural Police (Japanese)](${SRC.aichiKobutsu}). That licence is not a waste licence. A March 2024 environment ministry report describes a dealer that gave customers no record of what it took, so the city treated the goods as waste collected without a licence. [Ministry of the Environment report (PDF, Japanese)](${SRC.envReport})`,
          ],
          list: [
            "Show what you buy and what you dispose of as separate lines on quotes and invoices. If a purchase price is deducted from the disposal fee, show the calculation.",
            "Give a receipt that lists items bought, with quantities and amounts.",
            "If you donate or recycle, say which items, through whom, and whether you give a receipt. Avoid percentage claims you cannot document.",
            "If you advertise \"free pickup\", say exactly what is free and when charges apply.",
          ],
        },
        {
          heading: "Estate clean-outs: sorting, valuables, attendance and who decides",
          paragraphs: [
            `Japan's Consumer Affairs Center recorded estate clean-out consultations rising from 73 in fiscal 2013 to 105 in fiscal 2017, with 31 in the first quarter of fiscal 2018 against 16 a year earlier. Cases include being rushed into signing at the quote, large cancellation fees, a bill twice the estimate, and items the family had asked to keep being thrown away. [National Consumer Affairs Center, July 19, 2018 (Japanese)](${SRC.kokusenEstate})`,
            "For a family clearing a home after a death, how you treat what matters is the first worry. Write these on your process page.",
          ],
          list: [
            "Sorting: how keep, sell and dispose are decided (labels in advance, or together on the day).",
            "Valuables and documents: what happens to cash, bank papers, deeds, photos and letters you find (set aside and handed over at the end, for example).",
            "Attendance: how keys are handled for unattended jobs, and before-and-after photo reports.",
            "Who decides: whose approval you need when the person booking is not the owner or the only family member.",
            "Related services: cleaning, repairs or handing back a rental, done by you, a partner, or not offered.",
          ],
        },
        {
          heading: "Match platform listings and your Google Business Profile",
          paragraphs: [
            `Kobe Shimbun NEXT (October 29, 2026) reported a September 2026 study by Branding Works that asked ChatGPT and Gemini for junk collection recommendations: across 54 answers, the booking platform Kurashi no Market appeared in 51.9% and the quote platform Meetsmore in 50.0%. [Kobe Shimbun NEXT (Japanese)](${SRC.kobeNp}). The sample is small and the original report is not linked, but it is a reminder that AI may name platforms rather than individual firms.`,
          ],
          list: [
            "If you are listed on comparison or booking platforms, keep your name, licence, pricing method and area the same as on your site.",
            `Google's guidelines do not allow adding places or service keywords such as \"[city] junk removal same day\" to the business name. [Google: Guidelines for representing your business](${SRC.gbpGuidelinesEn})`,
            "There are rules on how you ask for reviews; see [reviews, testimonials and AI search](/guide/agency-reviews-testimonials-ai-search/). If jobs often come with a move, see [moving companies and AI search](/guide/moving-company-ai-search/); if you also clean, see [house cleaning and AI search](/guide/house-cleaning-housekeeping-ai-search/).",
          ],
        },
        {
          heading: "Structured data: no junk removal type, so use LocalBusiness with Service",
          paragraphs: [
            `schema.org has no dedicated type for junk removal or estate clean-outs (checked in schema-dts 2.1.0 on November 27, 2026). [RecyclingCenter](${SRC.recyclingCenter}) describes a recycling facility, so use it only if you run one. Publish the business as [LocalBusiness](${SRC.localBusiness}), describe each service (load sizes, estate clean-outs, single-item pickup) as a Service with an Offer, put your area in areaServed and your licence in hasCredential.`,
          ],
          code: SCHEMA_EN,
          after: [
            "Keep prices in structured data identical to the page. Estate clean-outs that vary widely with the size of the home are better explained with an example total and conditions in the text than with a single Offer price.",
          ],
        },
        {
          heading: "Setting it up on a WordPress site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working, without duplicate structured data.`,
            "In the setup wizard choose \"Other\". This leaves the business type unset, and the business is published as LocalBusiness once an address, phone number or opening hours are entered.",
            "Enter your name, address, phone and hours exactly as in your Google Business Profile.",
            "Add load sizes, single-item pickup, estate clean-outs and appliance removal as Services (up to 20) with name, price, quote URL and a description of what is included and what costs extra. Services appear as Service structured data and in llms.txt.",
            "There are no fields for areaServed or hasCredential. Add them with the webmcp_canary_business_node filter below, using the same values as the page. If Yoast SEO or a similar plugin is active, values that plugin already sets take precedence.",
            "Enter your answers on licences, surcharges, refused items, resale and valuables as FAQs, and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your pricing page. See [FAQ pages and AI search](/guide/faq-page-ai-search/).",
            "Open /llms.txt and check that pricing, licence, estate clean-out process and FAQ pages are listed. Run the diagnosis on the AEO score screen and fix what it finds.",
          ],
          code: PHP_EN,
          after: [
            "The same checks apply to sites not on WordPress. Enter your URL in the [free check](/check), no sign-up required, to see the state of your structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Your licence, who issued it, its number and where it is valid are written, or the licensed partner you use is named.",
            "Resale or second-hand licences are not presented as waste licences.",
            "Service areas do not include places where you are not licensed (or say how those are handled).",
            "How a load is measured is explained in words and photos.",
            "What is included, surcharges and the cancellation fee are written with amounts and conditions.",
            "Recycling fees for appliances are shown separately from your own charge.",
            "Items you cannot take are listed, with where customers can take them.",
            "Buying and disposal are separate lines, and you say you give a receipt for items bought.",
            "Estate clean-out sorting, valuables, attendance and approval are explained.",
            "Structured data is LocalBusiness with Service, prices and licence match the page, and llms.txt lists the main pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI mentions you, and whether it is right",
          paragraphs: [
            "Once your pages are in order, ask AI what customers would ask. Check whether you are named for questions such as \"licensed junk removal in [city]\" or \"estate clean-out in [city] without being there\", and ask with your name, such as \"Are they licensed?\", \"What does half a truck cost and what is extra?\" or \"Will they take a fridge?\", to see whether the answers match your site. Watch for a resale licence being described as a waste licence, and for towns you do not cover being given as your area.",
            "AI answers change between runs, so ask the same questions several times, spread over time, and keep a record. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a junk removal company start with AI search?", a: "First, write the licence you hold, who issued it and where it is valid, or the licensed hauler you use. Then explain on your pricing page how a load is measured, what is included, what costs extra and the cancellation fee. After that, match your Google Business Profile and platform listings, and publish the same facts in structured data and llms.txt." },
        { q: "What if we do not hold a waste licence ourselves?", a: "Never imply a licence you do not hold. If a licensed partner hauls and disposes, name them and describe your part (sorting, carrying out). Where you have no route, point customers to the local bulk waste service." },
        { q: "Does a resale licence let us collect household junk?", a: "Not necessarily. In Japan, the environment ministry says a second-hand dealer licence or an industrial-waste licence does not allow collecting household waste. Check the rules where you work and describe each licence for what it covers." },
        { q: "Is \"from $X\" pricing a problem?", a: "On its own, \"from $X\" makes it easy for AI and customers to misread the total. Add how a load is measured, what is included, surcharges with amounts, and one example total." },
        { q: "Should estate clean-out prices go in structured data?", a: "When the price varies widely with the size of the home, do not put a single amount in an Offer; explain an example total and conditions in the text. Services with a fixed price, such as a half load, can carry that price in an Offer if it matches the page." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends us?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your licence, pricing method, refused items, resale and estate clean-out process easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your junk removal, estate clean-out and resale services and FAQs for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google and Gemini of Google LLC. Kurashi no Market, Meetsmore, Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
