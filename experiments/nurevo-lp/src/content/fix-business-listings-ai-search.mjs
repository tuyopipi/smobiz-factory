// Content page: correcting your business details on listings, portals and
// comparison sites that AI answers draw on (全業種). Angle: which listing sites AI
// actually cites (the 2024-2026 studies), how to find the ones that matter for
// your own business, how each place is corrected (Google Business Profile, a
// Google Maps suggestion, Apple, Bing, Tabelog, Tripadvisor / Yelp, contract
// portals, articles), request templates, the order for moves / renames /
// closures / duplicates, the WordPress side and how to re-check.
// Separate from fix-wrong-ai-answers (PR #80, cause-sorting for wrong answers; its
// listing step is one paragraph), business-hours-holidays-ai-search (hours only),
// bing-places-ai-search, multi-location-business-ai-search and
// wikipedia-wikidata-ai-search.
//
// Written 2026-11-27 17時 (JST). Nurevo AEO facts from the plugin readme and
// existing pages: business details (name, address, phone, hours, services)
// published as structured data and in /llms.txt; sameAs is not a form field and is
// added with the developer filter webmcp_canary_business_node; 0.9.1+ coexists with
// SEO SIMPLE PACK and VK All in One Expansion Unit; Free monthly check: three
// questions built from type and area (never the name) put to Perplexity; Pro
// (beta) measurement on Perplexity with competitor comparison and history.
//
// Outside facts and where they were read (2026-11-27):
// - BrightLocal, "Top sources and directories for local AI search" (published
//   2026-08-26, modified 2026-11-13): 1,355 locations in US/UK/AU, Google AIO, AI Mode,
//   ChatGPT; about 1.97M citations across 116,670 domains. Table: Google Business
//   Profile 28.63%, Yelp 9.53%, Facebook 2.23%, Tripadvisor 1.79%, OpenTable 1.18%,
//   MapQuest 0.42%, BBB 0.33%, Yellow Pages 0.09%, apple.com 0.07%. ChatGPT: Yelp
//   99,281 citations, "appeared as a source in 80% of all answers from ChatGPT";
//   Google Business Profile is not a top ChatGPT source, Apple is. The key-findings
//   text says Yelp 8.53%, which conflicts with the table (we use the table).
// - BrightLocal, local AI visibility study (2026-09-16, modified 11-13): 93% of
//   unique cited domains were business sites, 42% of all citations; repeat-run
//   overlap 20-33%.
// - BrightLocal, Uncovering ChatGPT Search Sources (2024-12-12): US, 800 searches,
//   Nov 2024: business websites 58%, business mentions 27%, directories 15%; Yelp,
//   Facebook and Google Maps did not appear as directory sources.
// - Yext press release (2025-10-09): 6.8M citations, 2025-07-01 to 08-31, ChatGPT,
//   Gemini, Perplexity: websites 44%, listings 42%, reviews/social 8%.
// - Yext Research brief (July 2026): 155.5M citations, 1,623 brands, Jan-Mar 2026:
//   80% of citations to websites or listings; MapQuest 6.0M, TripAdvisor 3.8M, Yelp
//   2.1M, Wikipedia 1.0M.
// - Birdeye (2025-08-12, updated 2026-03-17): some LLMs showed closed businesses as
//   open (qualitative only).
// - Google Maps help 7084895 (ja) and 10552932 (ja): anyone signed in can suggest an
//   edit; closure / duplicate / moved options; Google reviews edits and it can take
//   time; large business-info edits may not be approved; some countries only.
// - Google Business Profile help 3039617: verified owners edit; changes reviewed
//   before going live; moving after verification requires re-verification; a name
//   change may require it.
// - 食べログ店舗会員規約 (改定 2022-04-01): 第2条5 changes must be reported promptly;
//   第5条1 members edit store info on their own responsibility; 第5条5 after leaving,
//   members cannot delete. 食べログ利用規約 (2026-02-17): wrong restaurant info goes to
//   the inquiry form.
// - Apple: "Apple Business Connect is now Apple Business" (Apple support). The
//   location pages of the Apple Business User Guide were not readable, so no steps.
// - Tripadvisor: BrightLocal guide (2023-05-23, modified 2025-10-24): claim free,
//   phone verification, "Request Update" for a wrong phone "up to 5 days".
// Top articles read 2026-11-27: assist-all citation (no date), Sungrove MEO citation
// (2026-09-02, upd 09-16), 0120.co.jp (2026-06-14, upd 10-20), uravation local
// (2026-07-18, upd 09-05), koukoku.jp (2026-09-02, upd 11-27); Thrive (2026-09-16),
// SEO.com (2026-08-21, upd 11-20), Semrush (2026-05-08), thestacc (upd 2026-07-10),
// PushLeads (2026-07-21, upd 11-21). Search Engine Land 485506 failed to load.
// Not verified, so not stated: Japan-specific shares of AI citations by listing
// site, Yelp's and Tripadvisor's official help wording (fetch blocked), Apple's
// claim and verification steps, Hot Pepper's or other contract portals' edit flows,
// how long AI takes to reflect a corrected listing.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  blDirectories: "https://www.brightlocal.com/resources/ai-directory-sources/",
  blStudy: "https://www.brightlocal.com/research/local-ai-visibility-study/",
  bl2024: "https://brightlocal.com/research/uncovering-chatgpt-search-sources/",
  yext2025: "https://www.nasdaq.com/press-release/yext-research-86-ai-citations-come-brand-managed-sources-clarifying-how-marketers-can",
  yext2026: "https://www.yext.com/research/articles/ai-citation-behavior-across-models-consistent-source-preferences-across-a-growing-ai-landscape",
  birdeye: "https://birdeye.com/blog/llm-vs-traditional-local-search-accuracy-report/",
  mapsEditJa: "https://support.google.com/maps/answer/7084895?hl=ja",
  mapsEditEn: "https://support.google.com/maps/answer/3094088?hl=en",
  mapsClosedJa: "https://support.google.com/maps/answer/10552932?hl=ja",
  mapsClosedEn: "https://support.google.com/maps/answer/10552932?hl=en",
  gbpEditJa: "https://support.google.com/business/answer/3039617?hl=ja",
  gbpEditEn: "https://support.google.com/business/answer/3039617?hl=en",
  tabelogOwner: "https://tabelog.com/help/owner_rules/",
  tabelogRules: "https://tabelog.com/help/rules/",
  appleBusiness: "https://support.apple.com/guide/apple-business-connect/apple-business-connect-is-now-apple-business-abcb205640e7/web",
  appleGuide: "https://support.apple.com/guide/business/",
  blTripadvisor: "https://www.brightlocal.com/learn/how-to-add-or-claim-your-tripadvisor-listing/",
  assist: "https://assist-all.co.jp/column/meo/citation-meo-seo-nap-ai/",
  sungrove: "https://www.sungrove.co.jp/meo-citation/",
  r0120: "https://0120.co.jp/blog/shobai-ai-117/",
  uravation: "https://uravation.com/llmo/local-business-aio-taisaku/",
  koukoku: "https://www.koukoku.jp/service/suketto/marketer/?p=32405",
  thrive: "https://thriveagency.com/news/how-to-correct-outdated-business-information-in-ai/",
  seocom: "https://www.seo.com/blog/ai-sharing-wrong-information/",
  semrush: "https://www.semrush.com/blog/fix-ai-brand-misinformation/",
  thestacc: "https://thestacc.com/blog/ai-wrong-business-info-fix",
  pushleads: "https://pushleads.com/how-to-fix-business-info-in-ai-search-results-before-wrong-data-costs-you-custom/",
};

const FACTS_JA = `正しい事実の表（例）　最終更新：2026-11-27　担当：◯◯
正式な名前 ：例カフェ 中央店（「例カフェ中央店」「例カフェ 中央」は使わない）
住所       ：〒000-0000 ◯◯県◯◯市中央1-2-3 例ビル2階
電話       ：00-0000-0000（予約・問い合わせ共通）
営業時間   ：火〜日 11:00-20:00（ラストオーダー 19:30）／定休日 月曜（祝日は営業、翌火曜休み）
サイト     ：https://example.jp/ （店舗ページ https://example.jp/shop/chuo/）
予約       ：https://example.jp/reserve/ （電話でも可）
変更の予定 ：2027-01-10 から 営業時間を 11:00-21:00 に変更
過去の情報 ：旧住所 ◯◯市本町4-5-6（2025-03 に移転）／旧電話 00-1111-1111（使用停止）`;

const FACTS_EN = `Fact sheet (example)   Last updated: 2026-11-27   Owner: ___
Official name : Example Cafe Downtown (not "Example Cafe DT" or "Example Café")
Address       : 123 Example St, Suite 200, Example City, CA 90000
Phone         : (000) 000-0000 (bookings and questions)
Hours         : Tue-Sun 11:00-20:00 (last order 19:30); closed Mondays
Website       : https://example.com/ (location page https://example.com/downtown/)
Booking       : https://example.com/book/ (phone also accepted)
Planned change: from 2027-01-10, open 11:00-21:00
Old details   : former address 45 Old Rd (moved 2025-03); former phone (000) 111-1111 (disconnected)`;

const MAIL_JA = `件名：【掲載情報の訂正のお願い】例カフェ 中央店（◯◯市）

◯◯（サイト名）ご担当者様

いつもお世話になっております。例カフェ 中央店の◯◯と申します。
貴サイトの次のページに掲載いただいている当店の情報に、古い内容がありましたので、訂正をお願いできますでしょうか。

対象ページ：https://（掲載ページのURL）
訂正をお願いしたい箇所：
・住所　　掲載：◯◯市本町4-5-6　→　正：◯◯市中央1-2-3 例ビル2階（2025年3月に移転しました）
・定休日　掲載：水曜　→　正：月曜（祝日は営業、翌火曜休み）

確認いただける資料：当店の公式サイトの店舗ページ https://example.jp/shop/chuo/
（必要でしたら、店舗の電話 00-0000-0000 にご確認ください）

掲載いただいていることに感謝しております。お手数をおかけしますが、よろしくお願いいたします。

例カフェ 中央店　◯◯（店長）
メール：info@example.jp`;

const MAIL_EN = `Subject: Correction request: Example Cafe Downtown (Example City)

Hello [site name] team,

I'm [name], the owner of Example Cafe Downtown. Thank you for listing us.
Some of our details on the page below are out of date. Could you correct them?

Page: https://[listing URL]
Corrections:
- Address   listed: 45 Old Rd  ->  correct: 123 Example St, Suite 200 (we moved in March 2025)
- Closed day listed: Wednesday  ->  correct: Monday

You can check these on our official location page: https://example.com/downtown/
or by calling the business line, (000) 000-0000.

Thanks for your help.
[Name], Owner, Example Cafe Downtown
info@example.com`;

const PHP_JA = `// 自社が管理している掲載先のページを sameAs として事業者のノードに足す
// （管理していないページ・まとめ記事は入れない。URLは掲載先の正式なページ）
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['sameAs'] = array(
        'https://www.instagram.com/example_cafe/',
        'https://tabelog.com/（店舗会員として管理している当店のページ）',
    );
    return $node;
}, 10, 2);`;

const PHP_EN = `// Add the listing pages you control to the business node as sameAs
// (not pages you do not manage, and not articles about you)
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['sameAs'] = array(
        'https://www.instagram.com/example_cafe/',
        'https://www.yelp.com/biz/(your claimed page)',
        'https://www.tripadvisor.com/(your claimed page)',
    );
    return $node;
}, 10, 2);`;

export default {
  slug: "fix-business-listings-ai-search",
  targetQueries: [
    "ポータルサイト 掲載情報 修正 AI検索",
    "比較サイト 自社情報 間違い 直し方",
    "サイテーション 修正依頼 AI",
    "fix business listings for AI search",
    "which directories does ChatGPT use for local businesses",
    "how to correct wrong business info on directories",
  ],
  related: ["business-hours-holidays-ai-search", "bing-places-ai-search", "multi-location-business-ai-search", "wikipedia-wikidata-ai-search", "measure-ai-visibility", "agency-reviews-testimonials-ai-search"],
  locales: {
    ja: {
      title: "ポータル・比較サイトの自社情報の直し方：AIが読む掲載先と依頼文 | Nurevo",
      description: "AIの回答に古い住所や営業時間が出るとき、直すのはAIではなく掲載先です。AIが実際に出典にしている掲載サイトの調べ方、Google・食べログなど掲載先ごとの直し方、訂正依頼の文例、移転・閉業の順番を手順にしました。",
      h1: "ポータル・比較サイト・地図アプリの自社情報の直し方：AIが読んでいる掲載先を見つけ、正しい事実にそろえる手順",
      lead: "AIの回答に古い住所・営業時間・電話番号が出るとき、直す相手はAIではなく、AIが出典にしている掲載先です。まず自社サイトに「正しい事実の表」を置き、AIの回答の出典と古い情報の文字で掲載先を探し、Googleビジネスプロフィール・地図アプリ・業種のポータル・比較サイトの順に、それぞれの窓口で直します。海外の調査では、AIの出典の4割前後が掲載サイトでした。",
      intro: [
        "作成日：2026年11月27日（JST）。掲載先のヘルプ・規約と調査のページは、本文のリンク先で2026年11月27日に確認しました。掲載先の手順や画面は変わることがあるので、作業の前に各社のヘルプで確かめてください。",
        "AIの回答は日や聞き方によって変わります。掲載先を直しても、AIの回答にいつ反映されるかは各社とも公表しておらず、この記事の方法でAIに必ず正しく表示されることは保証できません。直すのは「AIが読む元の情報」で、効果は期間をあけて確かめます。",
      ],
      sections: [
        {
          heading: "AIはどの掲載先を読んでいるか：分かっている数字",
          paragraphs: [
            "「AIは掲載サイトを読んでいるのか」は、2024年から2026年にかけて海外でいくつか調べられています。どれも米国・英国などのデータで、日本の掲載サイト（食べログ、ホットペッパー、エキテンなど）がどれだけ出典になっているかを調べた公開データは、確認できた範囲ではありません。",
          ],
          table: {
            head: ["調査", "対象", "分かったこと"],
            rows: [
              [`[BrightLocal](${SRC.blDirectories})（2026年8月26日公開、11月13日更新）`, "米国・英国・オーストラリアの1,355拠点、Google AIによる概要・AIモード・ChatGPT、出典 約197万件", "出典の割合（表の値）：Googleビジネスプロフィール 28.63%、Yelp 9.53%、Facebook 2.23%、Tripadvisor 1.79%、OpenTable 1.18%。ChatGPTではGoogleビジネスプロフィールは上位に入らず、Yelpが回答の80%で出典に出た"],
              [`[BrightLocal](${SRC.blStudy})（2026年9月16日、11月13日更新）`, "同じデータ（約20万の質問）", "出典になったドメインの93%は事業者自身のサイトで、出典の件数の42%を占めた。同じ質問を繰り返したときに同じ事業者が出る重なりは20〜33%"],
              [`[Yext](${SRC.yext2025})（2025年10月9日）`, "ChatGPT・Gemini・Perplexity、2025年7〜8月、出典 680万件", "出典は、事業者のサイト44%、掲載サイト（リスティング）42%、口コミ・SNS 8%"],
              [`[Yext](${SRC.yext2026})（2026年7月）`, "4つのAI、2026年1〜3月、出典 1億5,550万件・1,623ブランド", "出典の80%がサイトか掲載サイト。第三者のサイトでは MapQuest 600万件、Tripadvisor 380万件、Yelp 210万件、Wikipedia 100万件"],
              [`[BrightLocal](${SRC.bl2024})（2024年12月12日）`, "米国、ChatGPTで800回検索（2024年11月）", "出典は事業者のサイト58%、記事などでの言及27%、掲載サイト15%。このときはYelp・Facebook・Googleマップは掲載サイトの出典に出なかった"],
            ],
            caption: "数字は各調査のページから。BrightLocal（2026）は要約文でYelpを8.53%と書いており、表の値（9.53%）と食い違っています。この記事は表の値を使いました。Yextは掲載情報の管理サービスの会社で、調べ方も対象もそれぞれ違うため、数字を足したり直接比べたりはできません。",
          },
          after: [
            "読み取れることは3つです。1つ目、事業者のサイトと掲載サイトは、どの調査でもAIの出典の大きな部分を占めます。2つ目、AIごとに使う掲載サイトが違い、2024年と2026年でも変わっています（ChatGPTのYelpがその例です）。3つ目、だから「このサイトに載れば十分」という決め打ちはできず、自分の業種と地域で、AIが実際に出典にしている掲載先を調べるのが確実です。",
            `古い情報が残るとどうなるかについて、[Birdeye](${SRC.birdeye})（2026年3月17日更新）は、閉業したクリニックや飲食店を営業中として示したAIがあったと書いています（割合は示されていません）。`,
          ],
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            `2026年11月27日に、「サイテーション AI検索」「掲載情報 修正 AI」「fix wrong business info AI」などの上位記事を日本語5本・英語5本読みました。日本語では、[サングローブ](${SRC.sungrove})（2026年9月16日更新）と[0120.co.jp](${SRC.r0120})（10月20日更新）がNAP（名前・住所・電話）の統一と掲載先の棚卸しを手順にしていますが、どちらもMEO（地図検索）の話が中心で、AIの回答のどこから古い情報が来ているかの調べ方はありません。[アシスト](${SRC.assist})は検索の演算子で言及を探す方法を書きますが、調査の数字に出典がありません。[uravation](${SRC.uravation})（9月5日更新）と[koukoku.jp](${SRC.koukoku})（11月27日更新）はAIの回答の直し方を扱いますが、掲載先ごとの直し方は「正しい情報に更新する」の一言です。`,
            `英語では、[Thrive](${SRC.thrive})（2026年9月16日）と[SEO.com](${SRC.seocom})（11月20日更新）が「出典をたどって元を直す」流れを、[Semrush](${SRC.semrush})（5月8日）と[thestacc](${SRC.thestacc})（7月10日更新）がAIごとの報告の方法を書いています。[PushLeads](${SRC.pushleads})（11月21日更新）は数字が多いものの、ほとんどにリンクがありません。10本とも、掲載先の運営者に出す依頼文の例、移転や閉業のときに直す順番、WordPress側で何を書くか、直したあとの確かめ方の記録の形がありませんでした。この記事はそこを埋めます。`,
          ],
        },
        {
          heading: "手順1：直す前に「正しい事実の表」を1枚作る",
          paragraphs: [
            "掲載先を直す前に、正しい事実を1か所にまとめます。担当者や時期によって「例カフェ中央店」「例カフェ 中央」と表記が揺れていると、掲載先ごとに違う名前で登録され、AIが同じ店だと判断しにくくなります。表は社内用ですが、同じ内容を自社サイトの店舗ページ・会社概要にも書き、掲載先への依頼で「確認できる資料」として示します。",
          ],
          code: FACTS_JA,
          after: [
            "ポイントは「過去の情報」の行です。旧住所・旧電話番号・旧店名は、次の手順で古い掲載を探すための検索語になります。営業時間の書き方（祝日・年末年始・ラストオーダー）は[営業時間・定休日のAI検索対策](/guide/business-hours-holidays-ai-search)にまとめています。",
          ],
        },
        {
          heading: "手順2：AIが実際に使っている掲載先を見つける",
          paragraphs: [
            "掲載先は数百あり得ますが、全部を直す必要はありません。先に、AIの回答に影響していそうな掲載先を見つけます。",
          ],
          list: [
            "AIに聞く：ChatGPT・Perplexity・Google（AIによる概要・AIモード）に、店名入りの質問（「例カフェ 中央店の定休日は？」）と、店名なしの質問（「◯◯市中央で月曜もやっているカフェは？」）を聞きます。回答に出典のリンクが付いたら、そのURLを全部書き写します。",
            "古い情報の文字で探す：Googleで、旧住所・旧電話番号・旧店名を\"\"で囲んで検索します（例：\"00-1111-1111\"）。出てきたページは、AIがいつか読む可能性のある古い掲載です。",
            "主な地図アプリを見る：Googleマップ、Appleのマップ、Bingの地図で店名を検索し、同じ店が2つ出ないか（重複）、閉業や移転前の場所が残っていないかを見ます。",
            "業種のポータルを見る：飲食なら食べログ・ぐるなび・ホットペッパーグルメ、美容ならホットペッパービューティー、宿なら予約サイト、医療なら病院検索のサイトなど、業種の主な掲載先を店名で検索します。",
            "表にする：見つけた掲載先ごとに、URL・間違っている項目・誰が直せるか（自社・運営者・筆者）・AIの出典に出たか、を1行で書きます。",
          ],
          after: [
            "直す順番は、「AIの出典に出た掲載先」→「Googleビジネスプロフィールと地図アプリ」→「業種の主なポータル」→「その他の掲載先・記事」です。AIの回答は回ごとに変わるので、出典は1回の結果で決めつけず、日をあけて2〜3回聞いて重なるものを優先します。",
          ],
        },
        {
          heading: "手順3：掲載先ごとの直し方",
          paragraphs: [
            "掲載先によって、直せる人と窓口が違います。自社が管理者として登録できる掲載先は自分で直し、できない掲載先は運営者に依頼します。",
          ],
          table: {
            head: ["掲載先", "誰が・どこで直すか", "確認できたこと"],
            rows: [
              [`Googleビジネスプロフィール（[ヘルプ](${SRC.gbpEditJa})）`, "オーナー確認を済ませた管理者が、検索やマップの「プロフィールを編集」から", "変更はGoogleの確認のあとに公開。確認後に住所を移すと再度のオーナー確認が必要、名前を変えると必要になる場合がある"],
              [`Googleマップの「情報の修正を提案」（[ヘルプ](${SRC.mapsEditJa})）`, "ログインした人なら誰でも（自社のプロフィールを持っていない場合や、重複・閉業の報告）", `閉業・重複・移転は「[この場所は閉業したか、ここにはありません](${SRC.mapsClosedJa})」から。Googleが確認するため反映に時間がかかることがあり、大幅な変更は承認されない場合がある`],
              [`Appleのマップ（[Apple Business](${SRC.appleGuide})）`, "店舗の管理者として登録して、Apple Business の画面から", `Apple Business Connect は [Apple Business に統合](${SRC.appleBusiness})された。場所の登録・確認の手順は、Apple Business ユーザガイドで確かめる`],
              ["Bing Places", "管理者として登録して、Bing Places の画面から", "[Bing PlacesとAI検索](/guide/bing-places-ai-search)を参照"],
              [`食べログ（[店舗会員規約](${SRC.tabelogOwner})）`, "店舗会員になった店は、店舗の管理画面から自分で", `規約は、店舗会員が自らの責任で掲載情報を変更できること（第5条1）と、情報が変わったら速やかに届け出ること（第2条5）を定めている。店舗会員でない場合、間違いは[利用規約](${SRC.tabelogRules})にある問い合わせフォームへ`],
              [`Tripadvisor（[BrightLocalの解説](${SRC.blTripadvisor})）`, "掲載を無料で管理者登録（claim）して管理画面から", "BrightLocalの解説（2025年10月更新）では、店の電話での確認があり、電話番号の訂正（Request Update）は最大5日かかる。公式ヘルプは今回読めていない"],
              ["掲載料を払っているポータル（ホットペッパーなど）", "管理画面か営業担当", "契約ごとに手順が違うため、この記事では確かめていない。契約の窓口に、直したい項目と正しい値を伝える"],
              ["比較サイト・まとめ記事・ブログ", "運営者か筆者", "自分では直せない。次の手順4の依頼文で頼む"],
            ],
            caption: "2026年11月27日に各ページで確認した内容です。Yelp・Tripadvisorの公式ヘルプとAppleの場所の手順のページは、今回は読めなかったため、手順の細部は書いていません。",
          },
        },
        {
          heading: "手順4：運営者・筆者への依頼文の型",
          paragraphs: [
            "自分で直せない掲載先には、メールか問い合わせフォームで依頼します。運営者は多くの依頼を受けるので、どのページの・どの項目を・何に直すかと、確認できる資料を1通に入れると、確認の手間が減ります。",
          ],
          code: MAIL_JA,
          after: [
            "書くときのポイント：対象ページのURLと、「掲載」と「正」を並べた行を必ず入れます。理由（移転・電話番号の変更など）を一言添えると、運営者が古い情報だと判断しやすくなります。掲載そのものへのお礼を入れ、削除や順位の変更など、訂正以外のお願いは混ぜません。",
            "返事がないときは、2〜3週間あけて1回だけ送り直し、それでも直らなければ表に「依頼済み・未反映」と書いて次に進みます。何度も送ったり、別の名前で提案を繰り返したりするのはやめましょう。",
          ],
        },
        {
          heading: "移転・名前の変更・閉業・重複のときの順番",
          paragraphs: [
            "大きな変更は、直す順番を間違えると古い情報と新しい情報が混ざります。次の順で進めます。",
          ],
          table: {
            head: ["変更", "直す順番", "注意すること"],
            rows: [
              ["移転", "自社サイト（新住所と「◯年◯月に移転」の一文）→ Googleビジネスプロフィール（同じプロフィールの住所を変更）→ Apple・Bing → 業種のポータル → その他", "新しいプロフィールを作らず、今のプロフィールの住所を変える。移転後はGoogleで再度のオーナー確認が必要"],
              ["名前の変更", "自社サイト（旧名も「旧◯◯」と一度書く）→ Googleビジネスプロフィール → 各掲載先", "旧名で検索する人とAIのために、しばらくは旧名もサイトに残す"],
              ["閉業（1店舗だけ）", "自社サイト（閉店の日と、近くの店舗）→ Googleビジネスプロフィールで閉業に → 各掲載先", "ページは消さず、閉店のお知らせとして残すと、AIが閉業を読める"],
              ["重複", "残すほうを決める → Googleマップの「重複」で報告 → 各掲載先で統合か削除を依頼", "口コミが多いほうを残すことが多い。統合できるかは掲載先しだい"],
              ["電話番号の変更", "自社サイト → Googleビジネスプロフィール → 各掲載先", "旧番号はしばらく案内を流すと、古い掲載から電話した人を逃しにくい"],
            ],
            caption: "順番はこの記事の提案です。Googleの再確認の決まりは、Googleビジネスプロフィールのヘルプによります。",
          },
          after: [
            "店舗が複数ある場合の、店舗ごとのページと掲載の分け方は[複数店舗のAI検索対策](/guide/multi-location-business-ai-search)をご覧ください。",
          ],
        },
        {
          heading: "WordPress側でやること：サイトをいちばん正しい情報源にする",
          paragraphs: [
            "掲載先を直しても、自社サイトが古ければ元に戻ります。BrightLocalの調査でも、出典の件数の4割強は事業者自身のサイトでした。サイトには次の4つを置きます。",
          ],
          list: [
            "店舗ページか会社概要に、正しい事実の表と同じ内容を文字で書く（画像だけにしない）。最終更新日も書く。",
            "移転・名前の変更・閉業は、お知らせの記事だけでなく、店舗ページの本文に一文で書く。",
            "構造化データ（LocalBusiness）とllms.txtに、同じ名前・住所・電話・営業時間を出す。Nurevo AEOでは、事業者情報の画面に入れた内容が構造化データと /llms.txt の両方に出るので、表記が1か所でそろいます。",
            "自社が管理している掲載先のページは、構造化データの sameAs に入れる（下のコード）。Nurevo AEOの事業者情報の画面には sameAs の欄がないため、開発者向けのフィルター webmcp_canary_business_node で足します。",
          ],
          code: PHP_JA,
          after: [
            "sameAs には、自社が管理している公式のページだけを入れます。まとめ記事や、管理者登録していない掲載ページは入れません。Nurevo AEO 0.9.1 以降は、SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても構造化データが重複しません。",
          ],
        },
        {
          heading: "確かめ方：同じ質問で、期間をあけて記録する",
          paragraphs: [
            "掲載先を直したら、手順2と同じ質問を、2〜4週間ごとに聞き直します。AIの回答は回ごとに変わり、BrightLocalの調査でも同じ質問の繰り返しで同じ事業者が出る重なりは20〜33%でした。1回の回答で「直った」「直っていない」と判断せず、次の項目を記録します。",
          ],
          table: {
            head: ["記録する項目", "例"],
            rows: [
              ["日付・AI・質問", "2026-12-15、Perplexity、「◯◯市中央で月曜もやっているカフェは？」"],
              ["店が出たか", "出た／出ない"],
              ["回答の事実", "定休日を「水曜」と答えた（古い）／「月曜」と答えた（正しい）"],
              ["出典のURL", "回答に付いたリンク（掲載先の表の行と照らし合わせる）"],
              ["前回からの変化", "出典から旧住所のまとめ記事が消えた、など"],
            ],
          },
          after: [
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（店名は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在はPerplexity）。どちらも回答の一部を見本として調べるもので、すべての回答を見ているわけではありません。くわしくは[AIでの登場率の測り方](/guide/measure-ai-visibility)をご覧ください。",
          ],
        },
        {
          heading: "やってはいけないこと",
          list: [
            "一括登録のツールなどで、同じ店の掲載を新しく増やす（重複が増え、古い掲載が残ったままになる）。",
            "移転のときに、Googleビジネスプロフィールを新しく作り直す（今のプロフィールの住所を変える）。",
            "掲載先ごとに名前や電話番号の表記を変える（「正しい事実の表」の表記に合わせる）。",
            "AIに直接「正しい情報」を何度も入力して直そうとする（回答の評価ボタンでの報告はできますが、元の掲載が古いままでは直りません）。",
            "口コミや記事を自分で書いて、古い情報を埋もれさせようとする。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "正しい事実の表を作り、旧住所・旧電話番号・旧店名も書いた",
            "自社サイトの店舗ページに、表と同じ事実を文字で書き、最終更新日を入れた",
            "ChatGPT・Perplexity・Googleに店名あり・なしの質問をして、出典のURLを書き写した",
            "旧住所・旧電話番号を\"\"で囲んで検索し、古い掲載を表にした",
            "Googleビジネスプロフィールの名前・住所・電話・営業時間を表と同じにした",
            "Googleマップ・Appleのマップ・Bingで、重複と閉業・移転前の場所がないか見た",
            "業種の主なポータルで、自社が管理できる掲載は自分で直した",
            "直せない掲載先に、URL・項目・正しい値・資料を入れた依頼を出した",
            "構造化データとllms.txtの表記が表と同じで、sameAsは管理しているページだけにした",
            "2〜4週間後に同じ質問で聞き直す日を決め、記録の表を作った",
          ],
        },
      ],
      faqs: [
        { q: "AIの回答の間違いは、AIの会社に連絡すれば直りますか？", a: "回答の評価ボタンなどで報告はできますが、AIは掲載先や自社サイトの情報をもとに答えるため、元の情報が古いままでは同じ間違いが出続けることがあります。まず出典になっている掲載先と自社サイトを直し、報告はそのあとに補助として使います。" },
        { q: "掲載サイトは、どこまで直せばいいですか？", a: "全部を直す必要はありません。AIの回答の出典に出た掲載先、Googleビジネスプロフィールと地図アプリ、業種の主なポータルを優先します。古い情報の文字で検索して見つかった掲載は、表にして順に依頼します。" },
        { q: "ChatGPTはGoogleビジネスプロフィールを読んでいますか？", a: "米国・英国・オーストラリアを調べたBrightLocalの2026年の調査では、ChatGPTの出典でGoogleビジネスプロフィールは上位に入らず、Yelpが多く使われていました。日本で同じ傾向かを調べた公開データは見つかっていません。GoogleのAIによる概要やAIモードでは、Googleビジネスプロフィールが最も多い出典でした。" },
        { q: "食べログの情報が古いとき、店舗会員にならないと直せませんか？", a: "店舗会員になると、管理画面から自分で直せます。店舗会員でない場合は、食べログの利用規約が案内している問い合わせフォームから、正しくない情報を伝えられます。" },
        { q: "比較サイトの運営者が直してくれません。どうすればいいですか？", a: "2〜3週間あけて1回だけ依頼を送り直し、それでも直らなければ記録して次に進みます。その間も、自社サイトとGoogleビジネスプロフィールに正しい事実を書いておけば、AIが別の出典から正しい情報を読める可能性が高まります。" },
        { q: "直してから、AIの回答に反映されるまでどれくらいかかりますか？", a: "各社とも公表しておらず、決まった期間はありません。掲載先によっては、反映の前に運営者の確認もあります。2〜4週間ごとに同じ質問で聞き直し、記録して変化を見ます。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})から無料で入れられます。` },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトの事実を読めるか確かめる",
        body: "掲載先を直す前に、いちばん正しい情報源になる自社サイトの状態を確かめましょう。無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleとGeminiはGoogle LLCの商標です。Apple、Bing、食べログ、ぐるなび、ホットペッパー、エキテン、Yelp、Tripadvisor、Facebook、OpenTable、MapQuest、Wikipedia、BrightLocal、Yext、Birdeye、Semrush、SEO SIMPLE PACK、VK All in One Expansion Unitは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。",
    },
    en: {
      title: "Fix Business Listings for AI Search: Sources, Steps, Request Templates",
      description: "When AI shows an old address or hours, fix the listings it cites, not the AI. How to find them, how each is corrected, request templates, and the order for moves.",
      h1: "How to fix your business details on listings and comparison sites that AI answers draw on",
      lead: "When an AI answer shows your old address, hours or phone number, the thing to fix is not the AI but the listings it cites. Put one fact sheet on your own site, find the listings by reading the answer's sources and searching your old details, then correct them in order: Google Business Profile, map apps, your industry's directories and comparison sites. In the studies so far, listings made up around four in ten AI citations.",
      intro: [
        "Written 27 November 2026 (JST). The listing sites' help pages and terms, and the studies, were read at the links in the text on that date. Screens and steps change, so check each site's help before you start.",
        "AI answers vary by day and by wording. No AI company publishes how long a corrected listing takes to show up, and nothing in this guide guarantees that an AI will show your details correctly. You are fixing what the AI reads, and you check the effect over weeks.",
      ],
      sections: [
        {
          heading: "Which listings does AI read? What the studies show",
          paragraphs: [
            "Several studies from 2024 to 2026 looked at the sources AI answers cite for local businesses. All of them use US, UK or Australian data. We found no public study of how often Japanese listing sites, or the directories in most other countries, are cited.",
          ],
          table: {
            head: ["Study", "Scope", "Findings"],
            rows: [
              [`[BrightLocal](${SRC.blDirectories}) (published 26 Aug 2026, updated 13 Nov)`, "1,355 locations in the US, UK and Australia; Google AI Overviews, AI Mode and ChatGPT; about 1.97M citations", "Share of citations (table values): Google Business Profile 28.63%, Yelp 9.53%, Facebook 2.23%, Tripadvisor 1.79%, OpenTable 1.18%. In ChatGPT, Google Business Profile was not a top source; Yelp appeared as a source in 80% of answers"],
              [`[BrightLocal](${SRC.blStudy}) (16 Sep 2026, updated 13 Nov)`, "Same data (about 200,000 prompts)", "93% of cited domains were business websites, making up 42% of citations. Repeat runs of the same prompt named the same businesses 20–33% of the time"],
              [`[Yext](${SRC.yext2025}) (9 Oct 2025)`, "ChatGPT, Gemini, Perplexity; July–Aug 2025; 6.8M citations", "Websites 44%, listings 42%, reviews and social 8%"],
              [`[Yext](${SRC.yext2026}) (July 2026)`, "Four AI models; Jan–Mar 2026; 155.5M citations, 1,623 brands", "80% of citations went to websites or listings. Third-party domains: MapQuest 6.0M, Tripadvisor 3.8M, Yelp 2.1M, Wikipedia 1.0M"],
              [`[BrightLocal](${SRC.bl2024}) (12 Dec 2024)`, "US, 800 ChatGPT searches (Nov 2024)", "Business websites 58%, mentions 27%, directories 15%. At that time Yelp, Facebook and Google Maps did not appear as directory sources"],
            ],
            caption: "Figures are from each study's page. BrightLocal's 2026 summary text gives Yelp as 8.53%, which conflicts with its table (9.53%); we use the table. Yext sells listings management. The studies use different methods and scopes, so their numbers cannot be added or compared directly.",
          },
          after: [
            "Three things follow. First, in every study your own website and listings together make up a large share of what AI cites. Second, each AI leans on different listings, and that changed between 2024 and 2026 (ChatGPT and Yelp are the example). Third, there is no single list that is enough; the reliable way is to check which listings AI actually cites for your business type and area.",
            `On what stale data does, [Birdeye](${SRC.birdeye}) (updated 17 March 2026) reports that some AI tools showed closed clinics and restaurants as open. It gives no rate.`,
          ],
        },
        {
          heading: "What the top-ranking articles miss",
          paragraphs: [
            `On 27 November 2026 we read ten top results for queries such as "fix wrong business info AI" and "citations AI search", five in English and five in Japanese. [Thrive](${SRC.thrive}) (16 Sep 2026) and [SEO.com](${SRC.seocom}) (updated 20 Nov) explain tracing a claim to its source and fixing it upstream. [Semrush](${SRC.semrush}) (8 May) and [thestacc](${SRC.thestacc}) (updated 10 July) walk through reporting errors in each AI. [PushLeads](${SRC.pushleads}) (updated 21 Nov) cites many numbers, most without links.`,
            `The Japanese articles, from [Sungrove](${SRC.sungrove}), [0120.co.jp](${SRC.r0120}), [assist](${SRC.assist}), [uravation](${SRC.uravation}) and [koukoku.jp](${SRC.koukoku}), focus on NAP consistency for map rankings or on general AI correction. None of the ten gives a request template for listing owners, the order to follow for a move or closure, what to put on a WordPress site, or a record format for checking afterwards. This guide fills those gaps.`,
          ],
        },
        {
          heading: "Step 1: Write one fact sheet before you fix anything",
          paragraphs: [
            "Put the correct facts in one place first. If staff write the name three ways, listings end up under three names and AI has a harder time telling they are the same business. The sheet is internal, but the same facts go on your location page and About page, and you point listing owners to that page as proof.",
          ],
          code: FACTS_EN,
          after: [
            "The \"Old details\" line matters most: your former address, phone and name are the search terms for finding stale listings in step 2. For hours, holidays and temporary closures, see [AI search and business hours](/guide/business-hours-holidays-ai-search).",
          ],
        },
        {
          heading: "Step 2: Find the listings AI actually uses",
          paragraphs: [
            "You may be listed on hundreds of sites, but you do not need to fix them all. Find the ones likely to feed AI answers first.",
          ],
          list: [
            "Ask the AI: put a question with your name (\"What day is Example Cafe Downtown closed?\") and one without it (\"Cafes open on Mondays in downtown Example City?\") to ChatGPT, Perplexity and Google (AI Overviews and AI Mode). Copy every source URL the answer shows.",
            "Search your old details: search Google for your former address, phone number or name in quotes (for example \"(000) 111-1111\"). Every page that comes up is a stale listing an AI may read.",
            "Check the map apps: search your name in Google Maps, Apple Maps and Bing Maps. Look for duplicates, closed pins and the pre-move location.",
            "Check your industry's directories: Yelp, Tripadvisor and OpenTable for restaurants and travel, Healthgrades or similar for clinics, BBB and Angi for services, and so on.",
            "Make a table: one row per listing with the URL, the wrong field, who can fix it (you, the site, an author) and whether it appeared as an AI source.",
          ],
          after: [
            "Fix them in this order: listings that appeared as AI sources, then Google Business Profile and map apps, then your industry's main directories, then other listings and articles. Answers vary from run to run, so ask two or three times on different days and give priority to sources that repeat.",
          ],
        },
        {
          heading: "Step 3: How each kind of listing is corrected",
          paragraphs: [
            "Who can correct a listing, and where, depends on the site. Fix the ones you can manage yourself; ask the owners of the rest.",
          ],
          table: {
            head: ["Listing", "Who fixes it, and where", "What we confirmed"],
            rows: [
              [`Google Business Profile ([help](${SRC.gbpEditEn}))`, "The verified manager, via Edit profile in Search or Maps", "Google reviews changes before they go live. Moving to a new address after verification requires verifying again; a name change may"],
              [`Google Maps "Suggest an edit" ([help](${SRC.mapsEditEn}))`, "Anyone signed in (useful when you do not manage the profile, or to report duplicates and closures)", `Closures, duplicates and moves are reported under "[this place is closed or does not exist](${SRC.mapsClosedEn})". Google reviews edits, which can take time; available in some countries only`],
              [`Apple Maps ([Apple Business](${SRC.appleGuide}))`, "Register as the location's manager in Apple Business", `Apple Business Connect became [part of Apple Business](${SRC.appleBusiness}). Check the Apple Business User Guide for the claim and verification steps`],
              ["Bing Places", "Claim the listing in Bing Places", "See [Bing Places and AI search](/guide/bing-places-ai-search)"],
              [`Tripadvisor ([BrightLocal's guide](${SRC.blTripadvisor}))`, "Claim the free listing and edit in the management center", "Per BrightLocal's guide (updated Oct 2025), verification is by a call or text to the business phone, and a phone number Request Update takes up to 5 days. We could not read Tripadvisor's own help this time"],
              ["Yelp", "Claim the business page and edit as the owner", "We could not read Yelp's official help this time, so we do not describe the steps"],
              ["Paid directories", "The dashboard or your account rep", "Steps differ by contract; send the field and the correct value"],
              ["Comparison sites, roundups, blogs", "The site owner or author", "You cannot fix these yourself. Use the request template in step 4"],
            ],
            caption: "Confirmed on each page on 27 November 2026. We could not read Yelp's and Tripadvisor's official help, or Apple's location pages, so finer steps are left out.",
          },
        },
        {
          heading: "Step 4: A request template for site owners and authors",
          paragraphs: [
            "For listings you cannot edit, send a request by email or the site's contact form. Owners get many requests, so one message that says which page, which field, the correct value and where to check it saves them time.",
          ],
          code: MAIL_EN,
          after: [
            "Always include the page URL and \"listed / correct\" pairs. A short reason (we moved, the number changed) helps the owner see the old value is stale. Thank them for the listing, and do not mix in other asks such as removal or ranking.",
            "If you hear nothing, send one follow-up after two or three weeks. If it is still not fixed, mark it \"requested, not fixed\" in your table and move on. Do not keep resending or submit the same edit under different accounts.",
          ],
        },
        {
          heading: "The order for moves, renames, closures and duplicates",
          paragraphs: [
            "With big changes, fixing things in the wrong order mixes old and new details. Use this order.",
          ],
          table: {
            head: ["Change", "Order", "Watch out for"],
            rows: [
              ["Move", "Your site (new address and \"moved in [month year]\") → Google Business Profile (change the address on the existing profile) → Apple, Bing → industry directories → the rest", "Do not create a new profile; edit the existing one. Google requires verifying again after a move"],
              ["Rename", "Your site (mention the former name once) → Google Business Profile → each listing", "Keep the former name on your site for a while for people and AI searching by it"],
              ["Closing one location", "Your site (closing date and nearest location) → mark closed in Google Business Profile → each listing", "Keep the page as a closure notice instead of deleting it, so AI can read that it closed"],
              ["Duplicates", "Decide which to keep → report the duplicate in Google Maps → ask each site to merge or remove", "Many keep the one with more reviews; whether a merge is possible depends on the site"],
              ["New phone number", "Your site → Google Business Profile → each listing", "A recorded message on the old number helps people calling from stale listings"],
            ],
            caption: "The order is our suggestion. The re-verification rule is from Google Business Profile help.",
          },
          after: [
            "For separate pages and listings per location, see [AI search for multi-location businesses](/guide/multi-location-business-ai-search).",
          ],
        },
        {
          heading: "On WordPress: make your site the most reliable source",
          paragraphs: [
            "Corrected listings drift back if your own site is out of date. In BrightLocal's study, business websites were over 40% of citations. Put these four things on your site.",
          ],
          list: [
            "The fact sheet's details as text on the location or About page (not only in an image), with a last-updated date.",
            "Moves, renames and closures stated in one sentence on the location page itself, not only in a news post.",
            "The same name, address, phone and hours in your LocalBusiness structured data and llms.txt. In Nurevo AEO, what you enter in the business details screen is published in both the structured data and /llms.txt, so the wording stays the same in one place.",
            "The listing pages you control in sameAs (code below). Nurevo AEO's business details form has no sameAs field, so add it with the developer filter webmcp_canary_business_node.",
          ],
          code: PHP_EN,
          after: [
            "Only list official pages you manage in sameAs; leave out articles and listings you have not claimed. From 0.9.1, Nurevo AEO can run alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
          ],
        },
        {
          heading: "How to check: same questions, a few weeks apart, written down",
          paragraphs: [
            "After the fixes, ask the step 2 questions again every two to four weeks. Answers vary; in BrightLocal's study, repeat runs named the same businesses only 20–33% of the time. Do not judge from one answer. Record these fields.",
          ],
          table: {
            head: ["Field", "Example"],
            rows: [
              ["Date, AI, question", "15 Dec 2026, Perplexity, \"Cafes open on Mondays in downtown Example City?\""],
              ["Were you named?", "Yes / no"],
              ["The fact in the answer", "Said closed Wednesdays (stale) / Mondays (correct)"],
              ["Source URLs", "The links on the answer, matched to rows in your listings table"],
              ["Change since last time", "The roundup with the old address no longer appears as a source"],
            ],
          },
          after: [
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "What not to do",
          list: [
            "Use bulk submission tools that create new listings for the same business (more duplicates, and the stale ones stay).",
            "Create a new Google Business Profile when you move (change the address on the existing one).",
            "Write your name or phone differently on different sites (follow the fact sheet).",
            "Try to fix answers by typing corrections into the AI over and over (feedback buttons exist, but stale sources keep the error alive).",
            "Write reviews or articles yourself to bury the old details.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "Fact sheet written, including former address, phone and name",
            "Location page states the same facts as text, with a last-updated date",
            "Asked ChatGPT, Perplexity and Google questions with and without your name, and copied the source URLs",
            "Searched your old address and phone in quotes and listed the stale pages",
            "Google Business Profile name, address, phone and hours match the sheet",
            "Checked Google Maps, Apple Maps and Bing Maps for duplicates and old pins",
            "Corrected the industry listings you can manage yourself",
            "Sent requests with URL, field, correct value and proof for the rest",
            "Structured data and llms.txt match the sheet; sameAs lists only pages you manage",
            "Set a date two to four weeks out to re-ask the same questions, and made the record table",
          ],
        },
      ],
      faqs: [
        { q: "Will contacting the AI company fix a wrong answer?", a: "You can report an answer with the feedback buttons, but AI answers draw on listings and your own site. If those stay stale, the same error can keep coming back. Fix the sources first and use reports as a supplement." },
        { q: "How many listings do I need to fix?", a: "Not all of them. Start with listings that appear as AI sources, then Google Business Profile and map apps, then your industry's main directories. Pages found by searching your old details go into a table and get requests in turn." },
        { q: "Does ChatGPT read Google Business Profile?", a: "In BrightLocal's 2026 study of the US, UK and Australia, Google Business Profile was not a top ChatGPT source, while Yelp was used heavily. In Google's AI Overviews and AI Mode, Google Business Profile was the most cited source. Results in other countries have not been published." },
        { q: "Do I need to claim a listing to fix it?", a: "To edit it yourself, usually yes. Without claiming, Google Maps lets anyone signed in suggest an edit, and many sites have a contact form for wrong details. Claimed listings are faster to keep current." },
        { q: "The comparison site will not fix my details. What now?", a: "Send one follow-up after two or three weeks. If nothing changes, record it and move on. Meanwhile, keeping the correct facts on your site and Google Business Profile gives AI other sources with the right details." },
        { q: "How long until AI answers reflect the fix?", a: "No AI company publishes a timeframe, and some listing sites review edits first. Re-ask the same questions every two to four weeks and record what changes." },
        { q: "Is Nurevo AEO free?", a: `Yes. Structured data for your business type, address, hours, services and FAQ, llms.txt, AI crawler settings, the AEO score and the free monthly AI check are on the free plan. Paid plans add always-current rules (Standard, $20/month) and beta AI visibility measurement (Pro, from $99/month). Install it free from [WordPress.org](${WP_ORG}).` },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your site's facts",
        body: "Before fixing listings, check the site that should be your most reliable source. The free check shows your structured data, llms.txt and AI crawler access, with no sign-up.",
        label: "Run the free AI readiness check",
        href: "/check",
        secondary: { label: "Install free from WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google and Gemini of Google LLC. Apple, Bing, Tabelog, Hot Pepper, Yelp, Tripadvisor, Facebook, OpenTable, MapQuest, Healthgrades, BBB, Angi, Wikipedia, BrightLocal, Yext, Birdeye, Semrush, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
