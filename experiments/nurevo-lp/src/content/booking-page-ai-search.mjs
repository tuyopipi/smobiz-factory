// Content page: how to write a booking page (予約ページ / reservations page)
// so AI search answers "how do I book / do I need to book / can I cancel"
// correctly, and what "booking inside AI" actually runs on in November 2026.
// For every business type that takes bookings (salons, clinics, restaurants,
// studios, lodging, local services). Opening hours live in
// business-hours-holidays-ai-search, prices in pricing-page-ai-search.
//
// Written 2026-11-21 (JST). Product facts come from the plugin (0.9.2):
// - nurevo-webmcp.php webmcp_canary_service_entries(): services are typed in
//   by hand (max 20); nothing is read from booking plugins such as Amelia,
//   which expose no documented API ("a wrong duration published as fact is
//   worse than no duration").
// - webmcp_canary_service_schema_nodes(): Service node; when a booking URL is
//   entered, potentialAction = ReserveAction { target: EntryPoint
//   { urlTemplate: <booking URL> }, result: Reservation { name } }. Comment:
//   a bare Reservation node would claim a booking already exists.
// - webmcp_canary_service_llms_line(): the service name links to the booking
//   URL in llms.txt ("- [name](booking url) — description · N min · JPY 5500").
// - Admin labels (ja .po): 「予約URL」「サービス名」; help text: Service 構造化
//   データとして出力し、入力された予約URLを指す ReserveAction を付けます。
// - Services are published on the page set as the services/FAQ page ID
//   (0 = front page). Coexists with Yoast / Rank Math / AIOSEO / Slim SEO and,
//   from 0.9.1, SEO SIMPLE PACK and VK All in One Expansion Unit.
// - Free AI check: 3 unbranded questions a month on Perplexity; Pro (beta,
//   月14,800円〜 / USD 99) up to 20 questions on Perplexity (ChatGPT once set up).
//
// Outside facts and where they were read (2026-11-21):
// - OpenAI Help "ChatGPT search" (9237897, "updated 11 hours ago"): restaurant
//   reservation search shows times from OpenTable, Resy and Yelp; globally via
//   OpenTable, US with Resy, US and Canada with Yelp; Reserve button only when
//   ChatGPT can match the restaurant to a supported provider's listing;
//   ChatGPT does not save the reservation, cannot cancel or modify it; consumer
//   plans only (not Work / Enterprise / Edu / Business). To be included in
//   search: allow OAI-SearchBot and allow OpenAI's published IP addresses.
// - Resy newsroom (2026-08-10): Resy reservations in ChatGPT, U.S. restaurants.
// - OpenAI developers "Restaurant reservation conversion spec" (no date): for
//   reservation platforms, beta with approved partners; business feed needs
//   website_url and platform_url per restaurant. No schema.org mentioned.
// - Google blog (Robby Stein, 2025-08-21): AI Mode agentic restaurant
//   reservations rolling out to Google AI Ultra subscribers in the U.S. (Labs);
//   local service appointments and event tickets "soon"; partners OpenTable,
//   Resy, Tock, Ticketmaster, StubHub, SeatGeek, Booksy; links to booking page.
// - Google UK blog (2026-04-10): AI Mode restaurant reservations in the UK;
//   partners TheFork, SevenRooms, ResDiary, Mozrest, Foodhub, Dojo,
//   DesignMyNight, OpenTable.
// - Business Profile Help 13769188 (business links policies, no date): profile
//   must be verified; link must lead to a dedicated landing page and let the
//   customer complete the action; no social / messaging / app store /
//   shorteners; max 20 links per type; one link per domain; checked at most
//   daily; verification crawlers don't follow robots.txt; no CAPTCHA, login or
//   geoblocking; must return 200.
// - Business Profile Help 7475773 (bookings through a provider, no date):
//   providers from Reserve with Google, shown within a week; you can also add
//   your own link; no performance data for custom links; providers may charge.
// - Stripe docs "Accept service bookings and payments from agents" (no date):
//   agents either browse the website (review bot protections, consider WebMCP)
//   or use a booking API / MCP server.
// - Google "AI features and your website" (read 2026-11-18 for
//   google-ai-overviews-citations): no special schema needed; markup must
//   match visible text.
// - Top articles read 2026-11-21: Uravation 電話・予約導線 (2026-08-09, updated
//   2026-09-05), Uravation 体験観光 (2026-10-12), GMO koukoku.jp ローカルAIO
//   (updated 2026-11-16), AIsmiley ChatGPTのレストラン予約 (updated 2026-10-30),
//   assist-all 洋食店 LLMO (updated 2026-07-13); LSEO booking/pricing/
//   availability (modified 2026-10-02), LSEO "Schedule a Plumber" (modified
//   2026-04-24), Mindbody fitness (2026-10-13), Owner restaurants
//   (2026-10-22), J.A. Watte lodging & agents (updated 2026-11-06), Mews hotels
//   (2025-02-04). Jicoo AI予約システム was off topic.
// Not stated on purpose: survey percentages from vendor articles, whether
// ChatGPT / Perplexity / Google read ReserveAction (no official statement
// found), Japanese partners for ChatGPT or AI Mode beyond what OpenAI says,
// how fast each AI picks up a changed booking rule.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  openaiSearch: "https://help.openai.com/en/articles/9237897-chatgpt-search",
  openaiSpec: "https://developers.openai.com/plugins/guides/restaurant-reservation-conversion-spec",
  resy: "https://blog.resy.com/newsroom/resy-launches-reservations-in-chatgpt/",
  googleAgentic: "https://blog.google/products/search/ai-mode-agentic-personalized/",
  googleUk: "https://blog.google/company-news/inside-google/around-the-globe/google-europe/united-kingdom/ai-mode-restaurants-uk/",
  gbpLinks: "https://support.google.com/business/answer/13769188",
  gbpProvider: "https://support.google.com/business/answer/7475773",
  stripe: "https://docs.stripe.com/agentic-commerce/for-sellers/services",
  aiFeaturesJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  aiFeatures: "https://developers.google.com/search/docs/appearance/ai-features",
  reserveAction: "https://schema.org/ReserveAction",
  validator: "https://validator.schema.org/",
  uravationTel: "https://uravation.com/llmo/denwa-yoyaku-dousen-ai-search/",
  uravationTour: "https://uravation.com/llmo/taiken-kanko-activity-llmo-taisaku/",
  gmo: "https://www.koukoku.jp/service/suketto/marketer/aio/%e7%94%9f%e6%88%90ai%e6%a4%9c%e7%b4%a2%e3%81%a7%e8%a6%8b%e3%81%a4%e3%81%8b%e3%82%8b%e5%ae%9f%e5%ba%97%e8%88%97%e3%83%bb%e5%9c%b0%e5%9f%9f%e3%83%93%e3%82%b8%e3%83%8d%e3%82%b9%e3%82%92%e4%bd%9c%e3%82%8b/",
  aismiley: "https://aismiley.co.jp/ai_news/chatgpt-restaurant-reservation/",
  lseoBooking: "https://lseo.com/generative-engine-optimization/booking-pricing-and-availability-pages-for-agentic-search/",
  lseoPlumber: "https://lseo.com/blog/uncategorized/direct-booking-via-ai-preparing-your-site-for-schedule-a-plumber/",
  mindbody: "https://www.mindbodyonline.com/business/education/blog/how-to-optimize-fitness-website-AI-search",
  owner: "https://www.owner.com/blog/the-ultimate-guide-to-chatgpt-for-restaurants-how-to-get-recommended-in-ai-search",
  jwatte: "https://jwatte.com/blog/lodging-sites-ai-agents-booking/",
};

const JSONLD = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://example.jp/#nurevo-service-1",
  "name": "カット（シャンプー・ブロー込み）",
  "provider": { "@id": "https://example.jp/#business" },
  "additionalProperty": {
    "@type": "PropertyValue",
    "name": "duration",
    "value": 60,
    "unitCode": "MIN",
    "unitText": "minutes"
  },
  "offers": { "@type": "Offer", "price": "5500", "priceCurrency": "JPY" },
  "potentialAction": {
    "@type": "ReserveAction",
    "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/reserve/cut/" },
    "result": { "@type": "Reservation", "name": "カット（シャンプー・ブロー込み）" }
  }
}
</script>`;

const JSONLD_EN = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://example.com/#nurevo-service-1",
  "name": "Haircut (wash and blow-dry included)",
  "provider": { "@id": "https://example.com/#business" },
  "additionalProperty": {
    "@type": "PropertyValue",
    "name": "duration",
    "value": 60,
    "unitCode": "MIN",
    "unitText": "minutes"
  },
  "offers": { "@type": "Offer", "price": "55.00", "priceCurrency": "USD" },
  "potentialAction": {
    "@type": "ReserveAction",
    "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/book/haircut/" },
    "result": { "@type": "Reservation", "name": "Haircut (wash and blow-dry included)" }
  }
}
</script>`;

const CURL = `# 予約ページが、ログインなし・200で、本文に予約のルールを持っているか
curl -s -o /dev/null -w "%{http_code}\\n" https://example.jp/reserve/
curl -s https://example.jp/reserve/ | grep -E "キャンセル|予約受付|当日"
# 何も出なければ、ルールは画像・予約システムの埋め込み・JavaScriptの中にあります`;
const CURL_EN = `# Is the booking page public (200, no login) and are the rules in its HTML?
curl -s -o /dev/null -w "%{http_code}\\n" https://example.com/book/
curl -s https://example.com/book/ | grep -iE "cancel|walk-in|same day"
# If nothing prints, the rules live in an image, an embedded widget or JavaScript`;

const FOOT_JA = "ChatGPTはOpenAI、Google、Google 検索、Googleビジネスプロフィール、Reserve with GoogleはGoogle LLC、PerplexityはPerplexity AIの商標です。OpenTable、Resy、Yelp、Tock、TheFork、Booksy、Stripe、WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、Amelia、ならびに本文で紹介した各社の名称は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。";
const FOOT_EN = "ChatGPT is a trademark of OpenAI; Google, Google Search, Google Business Profile and Reserve with Google of Google LLC; Perplexity of Perplexity AI. OpenTable, Resy, Yelp, Tock, TheFork, Booksy, Stripe, WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit, Amelia and the names of the companies cited in this guide are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.";

export default {
  slug: "booking-page-ai-search",
  targetQueries: [
    "booking page AI search optimization",
    "ChatGPT book appointment local business",
    "ReserveAction schema booking AI",
    "予約ページ AI検索 対策",
    "ChatGPT 予約 できる 店",
    "予約 構造化データ ReserveAction",
  ],
  related: ["business-hours-holidays-ai-search", "pricing-page-ai-search", "faq-page-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "予約ページをAIに正しく読ませる書き方：予約方法・キャンセル | Nurevo",
      description: "AIが「予約は必要？」「当日でも行ける？」「キャンセル料は？」を間違えないための予約ページの書き方。ChatGPTやGoogleのAIで予約ができる仕組み、外部予約サイトとの分け方、構造化データ、WordPressの手順。",
      h1: "予約ページをAIに正しく読ませる書き方：予約方法・受付期限・キャンセル規定と、AIの中で予約できる仕組み",
      lead: "AIに予約のことを正しく答えてもらうには、自社サイトに予約ページを1つ決め、「予約の方法（ネット・電話・LINE）」「予約が必要か、当日や予約なしでも行けるか」「何日前まで・何日先まで受け付けるか」「キャンセルの期限と料金」「正式な予約先の一覧」を、画像や予約システムの埋め込みの中ではなくHTMLの文字で書きます。ChatGPTやGoogleのAIの中で予約まで進む仕組みは、2026年11月時点では主に飲食店向けで、OpenTableなどの予約サービスとの連携で動いています。自社サイトの予約ページは、その連携がなくてもAIが予約のルールを読みに来る場所です。",
      intro: [
        "作成日：2026年11月21日（JST）。営業時間・定休日の書き方は[営業時間・定休日をAIに正しく読ませる書き方](/guide/business-hours-holidays-ai-search)、料金の書き方は[料金ページの書き方](/guide/pricing-page-ai-search)で扱いました。この記事は、美容室・クリニック・飲食店・教室・宿泊・出張サービスなど、予約を受ける業種に共通する「予約ページ」に絞ります。",
        "AIの回答は日・聞き方・使うサービスによって変わります。この記事の手順は、AIが予約のルールを読み違えにくいページを作り、正しく確かめるためのもので、回答に出ることやAIの中で予約できるようになることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "まず結論：AIが予約について間違える5つの原因と直し方",
          table: {
            head: ["原因", "AIの答えに起きること", "直し方"],
            rows: [
              ["予約のルールが予約システムの埋め込みや画像の中だけにある", "「予約方法は公式サイトで確認してください」としか答えられない", "予約ページの本文に、予約方法・受付期限・キャンセル規定を文字で書く"],
              ["「予約優先」「予約制」の意味が書いていない", "予約なしで行けるのか、行けないのかを取り違える", "「予約なしでも受け付けます（待ち時間あり）」のように、予約なしのときどうなるかまで書く"],
              ["予約先が複数あり、正式な窓口が分からない", "古い予約サイトや、やめた電話番号を案内する", "使っている予約先を一覧にし、メニューごとの正式なURLを決める"],
              ["キャンセルの期限と料金が書いていない、または予約サイトごとに違う", "キャンセル料を「無料」と答える、または別の店の規定を答える", "期限・料金・連絡方法を1か所に書き、予約サイトの規定も同じにする"],
              ["予約ページがログインや会員登録をしないと見られない", "予約できるかどうか自体を答えられない", "ルールを書いた公開ページを用意し、予約フォームはその先に置く"],
            ],
          },
        },
        {
          heading: "AIの中で予約ができる仕組み（2026年11月時点）",
          paragraphs: [
            "「ChatGPTで予約できるようにしたい」という相談は増えていますが、AIの中で予約まで進む機能は、いまのところ予約サービスとの連携で動いています。サイトに何かを書けば予約ボタンが付く、という仕組みではありません。公式の発表で確かめられたことを表にします。",
          ],
          table: {
            head: ["サービス", "できること", "対象", "出典"],
            rows: [
              ["ChatGPT（レストラン予約）", "回答の中に空いている日時を出し、予約を進める", `OpenTable は全世界、Resy は米国、Yelp は米国とカナダ。予約ボタンは、ChatGPTが対応する予約サービスの掲載とお店を結び付けられたときだけ出る。ChatGPTは予約を保存せず、変更・キャンセルは予約サービス側で行う`, `[OpenAI ヘルプ](${SRC.openaiSearch})（2026-11-21に確認）、[Resy（2026-08-10）](${SRC.resy})`],
              ["Google 検索のAIモード（予約の代行）", "条件に合う店の空きを探し、予約ページへのリンクを出す", "2025-08-21に米国の Google AI Ultra 加入者向け（Labs）で飲食店から開始。英国では2026-04-10から飲食店の予約に対応。提携先として OpenTable・Resy・Tock・TheFork などが挙がっている", `[Google（2025-08-21）](${SRC.googleAgentic})、[Google UK（2026-04-10）](${SRC.googleUk})`],
              ["Googleビジネスプロフィール", "プロフィールに予約のリンクを出す", "オーナー確認済みのプロフィール。自分で入れるリンクのほか、Reserve with Google の予約サービス経由でも出せる", `[ビジネスリンクのポリシー](${SRC.gbpLinks})、[予約サービス経由の予約](${SRC.gbpProvider})`],
            ],
          },
          after: [
            `ChatGPTの予約は、予約サービスが OpenAI に店の一覧を渡す形で作られています。その一覧には、店ごとに「店の公式サイトのURL」と「予約サービス上の掲載ページのURL」を入れることになっています（[OpenAI：Restaurant reservation conversion spec](${SRC.openaiSpec})、予約サービス向けの資料）。日本の予約サイトが連携しているという公式の発表は、調べた範囲では見つかりませんでした（OpenTable に載っている日本の店は対象になりうる、というのが OpenAIの書き方から言えることです）。`,
            "つまり、AIの中の予約ボタンは予約サービス次第で、店にできるのは「使っている予約サービスの掲載を正しく保つこと」と「自社サイトに予約のルールを正しく書くこと」です。予約ボタンが出ない店でも、AIは「予約は必要？」「キャンセル料は？」と聞かれれば、サイトや口コミサイトを読んで答えます。この記事の残りは、その答えを正しくするための手順です。",
          ],
        },
        {
          heading: "上位の記事で分かったこと・足りなかったこと",
          paragraphs: [
            "「予約ページ AI検索 対策」「booking page AI search」などで上位の日本語の記事と英語の記事を読みました（2026-11-21）。多くの記事は「店舗情報をそろえる」「口コミを増やす」といった店舗のAI対策全般で、予約ページそのものの書き方を手順まで書いた記事は少数でした。構造化データの例を載せた記事、WordPressでの手順を書いた記事は、どちらもほぼありませんでした。",
          ],
          table: {
            head: ["記事", "よく書けている点", "足りなかった点"],
            rows: [
              [`[Uravation 電話・予約導線（2026-09-05更新）](${SRC.uravationTel})`, "ReserveAction に期待しすぎない判断、予約URLを1つに固定、GA4での計測の手順", "JSON-LDの例、WordPressの手順、予約サイトを複数使う場合の整理"],
              [`[Uravation 体験観光（2026-10-12）](${SRC.uravationTour})`, "1体験1ページ、雨天中止・所要時間などの条件の書き方", "体験観光だけが対象。コード例・WordPressの手順なし"],
              [`[GMO ローカルAIO（2026-11-16更新）](${SRC.gmo})・[AIsmiley（2026-10-30更新）](${SRC.aismiley})`, "Googleビジネスプロフィールの整え方／ChatGPTのレストラン予約の日本での使える範囲", "統計の出典が本文にない（GMO）。店側の予約ページの書き方がない（AIsmiley）"],
              [`[LSEO 予約・料金・空き（2026-10-02更新）](${SRC.lseoBooking})・[LSEO 配管業（2026-04-24更新）](${SRC.lseoPlumber})`, "「予約のための万能の構造化データはない」「空きは運用のシステムから」という正直な整理", "具体的な手順・出典・WordPressの手順がない"],
              [`[J.A. Watte 宿泊（2026-11-06更新）](${SRC.jwatte})・[Owner 飲食（2026-10-22）](${SRC.owner})・[Mindbody（2026-10-13）](${SRC.mindbody})`, "予約リンクの作り方・税込の書き方（宿泊）、メニューを文字で書く（飲食）、サービスページ（フィットネス）", "宿泊・飲食・フィットネスに限られる。自社サービスの宣伝が多い。日本の事情なし"],
            ],
          },
          after: [
            "この記事は、業種を問わず「予約ページに何を書くか」と「予約サイトを複数使うときの分け方」を具体的に書き、構造化データとWordPressの手順、確かめ方まで1本にまとめます。",
          ],
        },
        {
          heading: "予約ページに書く8つの事実",
          paragraphs: [
            "予約について聞かれる質問は、だいたい次の8つに分かれます。それぞれに1〜2文で答える段落か表の行を、予約ページの本文に用意します。",
          ],
          table: {
            head: ["事実", "書く例", "AIに聞かれる質問"],
            rows: [
              ["予約の方法", "ネット予約（24時間）、電話（10時〜19時）、LINE（返信は営業時間内）", "「（店名）はどうやって予約する？」"],
              ["予約が必要か", "予約制。予約なしでも空きがあれば受け付けます（待ち時間あり）", "「予約なしで行ける？」"],
              ["受付の期限", "前日の20時まで。当日は電話のみ", "「当日予約できる？」"],
              ["どこまで先か", "2か月先まで", "「来月の予約はもう取れる？」"],
              ["所要時間", "カットは約60分", "「どのくらい時間がかかる？」"],
              ["キャンセル規定", "前日までは無料。当日のキャンセルは料金の50%。連絡は電話で", "「キャンセル料はかかる？」"],
              ["支払い・前金", "予約時の支払いはなし。来店時に現金・カード・QR決済", "「前払いが必要？」"],
              ["対象・持ち物", "初めての方は問診票の記入で10分早めに。子ども連れ可", "「初めてでも大丈夫？」「子どもを連れて行ける？」"],
            ],
          },
          after: [
            "書くときは、どの文も単独で読んで意味が通るようにします。AIはページから1文だけを抜き出して答えることがあるので、「上記の通り」「こちらから」のような前後に頼る言い方は避けます。悪い例：「ご予約はこちらから。キャンセルは早めにご連絡ください。」良い例：「ネット予約は24時間、電話予約は10時〜19時に受け付けています。キャンセルは前日までは無料で、当日のキャンセルは料金の50%をいただきます。」",
            "予約の有無で変わることも書きます。予約の人を優先する店なら「予約なしの方は、予約の方の合間にご案内します」、完全予約制なら「予約のない方はご案内できません」とはっきり書くと、AIが「予約なしでも大丈夫です」と誤って答えることを減らせます。",
          ],
        },
        {
          heading: "予約サイトを複数使っているとき：正式な窓口を決める",
          paragraphs: [
            "美容室や飲食店では、自社の予約システム、予約サイト、電話、LINEなど、予約先がいくつもあるのが普通です。AIは見つけた予約先をそのまま案内するので、やめた予約サイトや古い電話番号が残っていると、そちらを案内されることがあります。次の順で整理します。",
          ],
          list: [
            "使っている予約先をすべて書き出す（自社システム、予約サイト、Googleビジネスプロフィールの予約リンク、電話、LINE、SNSのDM）",
            "やめた予約先の掲載を消すか、「現在は受け付けていません」と書き換える",
            "予約ページの本文に「ご予約は次の方法で受け付けています」として、使っている予約先だけを並べる",
            "メニューやコースごとに予約URLが分かれているなら、メニューごとの正式なURLを1つ決める（トップページへのリンクより、メニューの予約画面へ直接つながるURL）",
            "キャンセル規定・受付期限を、自社サイトと各予約サイトで同じにする。違う場合は、どの予約先にどの規定が適用されるかを書く",
            "予約サイトやGoogleビジネスプロフィールの説明文から、自社サイトの予約ページへリンクする",
          ],
          after: [
            `Googleビジネスプロフィールの予約のリンクには決まりがあります。オーナー確認が済んでいること、リンク先がその店専用のページで、そこで予約を完了できること、SNS・メッセージアプリ・アプリストア・短縮URLは使えないこと、ログインやCAPTCHAなしで開けて200を返すこと、などです（[ビジネスリンクのポリシー](${SRC.gbpLinks})）。Reserve with Google に対応した予約サービスを使う方法もあり、自分で入れたリンクには実績のデータが出ない、と案内されています（[予約サービス経由の予約](${SRC.gbpProvider})）。`,
          ],
        },
        {
          heading: "空き状況は書かない。確かめ方を書く",
          paragraphs: [
            "「土曜はいつも空いています」「平日は予約なしでも大丈夫」のような空き状況を本文に書くと、AIは状況が変わってもその文を使い続けることがあります。各AIがページを読み直す間隔は公開されていません。空き状況は予約システムで見るものとして、本文には「空き状況はネット予約の画面でご確認ください。当日の空きは電話でお問い合わせください」のように、確かめ方を書きます。",
            "混みやすい時間帯を書くなら「土日の午後は混み合うため、予約をおすすめします」のように、変わりにくい傾向として書きます。実際より空いているように見せる書き方は、人にもAIにも誤解のもとになります。",
          ],
        },
        {
          heading: "AIが読める形にする：埋め込み・画像・ログインを確かめる",
          paragraphs: [
            "予約システムの多くは、予約画面を別のサイトから埋め込む形（iframe）やJavaScriptで表示します。人には見えても、埋め込みの中の文字が予約ページの本文として読まれるかはAIのサービスごとに違い、公開されていません。予約のルールは、埋め込みの外側、予約ページそのものの本文に書くのが確実です。予約フォームは埋め込みのままで構いません。",
            "自分の予約ページが、ログインなしで開けて本文にルールを持っているかは、次のコマンドで確かめられます。",
          ],
          code: CURL,
          after: [
            `ChatGPTの検索に載るには、OAI-SearchBot のクロールを許可し、サーバーやCDNが OpenAI の公開しているIPアドレスからのアクセスを通すことが大切だと案内されています（[OpenAI ヘルプ](${SRC.openaiSearch})）。予約ページだけをボット対策で止めていないかも確かめてください。AIの代理の操作で予約を受けたい事業者向けに、Stripe はボット対策の見直しや WebMCP の利用を挙げていますが、これは決済まで含めた先の話です（[Stripe](${SRC.stripe})）。`,
          ],
        },
        {
          heading: "構造化データ：ReserveAction は付けてよいが、期待しすぎない",
          paragraphs: [
            `schema.org には「予約する」という行動を表す [ReserveAction](${SRC.reserveAction}) があり、サービスに予約のURLを結び付けて書けます。ただし、ChatGPT・Perplexity・GoogleのAI機能が ReserveAction を予約に使うと書いた公式の資料は、調べた範囲では見つかりませんでした。GoogleはAI機能のために特別な構造化データは要らず、構造化データは見えている本文と一致させるよう案内しています（[AI機能とウェブサイト](${SRC.aiFeaturesJa})、2026-11-18に確認）。付けても害は小さいものの、予約ボタンが出るようになるものではありません。`,
            "付ける場合は、次のように Service（サービス）ごとに予約URLを指す形にします。Nurevo AIO が出力する形と同じです。",
          ],
          code: JSONLD,
          after: [
            "ポイントは、Reservation（予約そのもの）を単独で書かないことです。Reservation だけを書くと「予約がすでにある」という意味になり、事実と違います。ReserveAction の結果（result）として書けば「この操作で予約ができる」という意味になります。書いたら [Schema Markup Validator](" + SRC.validator + ") で文法を確かめます。",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AIOの場合）",
          paragraphs: [
            `[Nurevo AIO（無料、旧表示名 Nurevo AEO）](${WP_ORG})では、設定画面の「サービス」に入れた予約URLが、Service の構造化データの ReserveAction と llms.txt に出ます。次の順で進めます。`,
          ],
          list: [
            "先に予約ページの本文を、この記事の8つの事実で整える（構造化データより本文が先）",
            "サービスを登録する（最大20件）。「サービス名」「所要時間（分）」「料金」「通貨」に加えて「予約URL」に、そのメニューの予約画面のURLを入れる",
            "予約URLを入れたサービスは、llms.txt でサービス名が予約URLへのリンクになる（例：- [カット](https://example.jp/reserve/cut/) — 60 min · JPY 5500）",
            "予約プラグイン（Amelia など）の中身は読み取らない。所要時間や予約URLの誤った値を事実として出さないためで、値は手で入れる",
            "「サービスを掲載するページID」に予約ページかメニューページのIDを入れると、サービスの構造化データがそのページに出る（0はフロントページ）",
            "キャンセル料・当日予約・予約なしの来店は、よくある質問に登録する。Yoast SEO・Rank Math・All in One SEO・Slim SEO と一緒でも二重にならず、SEO SIMPLE PACK・VK All in One Expansion Unit とも併用できる（0.9.1から）",
            "予約先を変えたときは、本文・Nurevo の予約URL・FAQの答え・Googleビジネスプロフィールを同じ日に直す",
          ],
          after: [
            "お客様のサイトを保守している制作会社は、「予約先の変更」を保守の作業範囲に入れておくと、予約サイトの乗り換えのたびに古いURLが残るのを防げます。月額で支援する制作会社向けに[パートナー制度](" + PARTNER + ")があります。",
          ],
        },
        {
          heading: "確かめ方：予約の質問を決めて記録する",
          paragraphs: [
            "予約のルールが正しく伝わっているかは、同じ質問を同じAIに、日を変えて何回か聞いて記録します。1回の答えだけで判断しないでください。",
          ],
          table: {
            head: ["質問の例", "見ること"],
            rows: [
              ["「（店名）は予約が必要？」", "予約制か、予約なしでも行けるかが合っているか"],
              ["「（店名）は当日予約できる？」", "受付の期限と方法（電話のみ等）が合っているか"],
              ["「（店名）のキャンセル料は？」", "期限と料金が合っているか。出典が古い予約サイトではないか"],
              ["「（店名）の予約方法は？」", "案内された予約先が、いま使っている正式な窓口か"],
              ["「（地域）で今日予約できる（業種）は？」", "社名なしの質問で候補に入るか。予約ボタンが出るか（飲食店の場合）"],
            ],
          },
          after: [
            "記録するのは、日付・AIのサービス名・質問・答え・出典のURLです。出典が古い予約サイトやブログ記事なら、そこを直します。Nurevoの無料プランとStandardでは、月に1回、業種と地域から作った社名なしの質問3つをNurevoのサービスがPerplexityに聞き、名前が出たか・サイトが引用されたかを表示します。Pro（月14,800円〜、ベータ）は最大20問をPerplexityで計測します（ChatGPTは設定され次第）。予約の質問は手で記録してください。詳しくは[AIでの登場率の測り方](/guide/measure-ai-visibility)へ。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "予約ページが1つに決まっていて、ログインなしで開ける",
            "予約の方法と受付時間が文字で書いてある",
            "予約が必要か、予約なしのときどうなるかが書いてある",
            "受付の期限（当日・前日）と、何日先まで取れるかが書いてある",
            "キャンセルの期限・料金・連絡方法が書いてあり、予約サイトの規定と同じ",
            "使っている予約先だけが並んでいて、やめた予約先が残っていない",
            "空き状況ではなく、空きの確かめ方が書いてある",
            "予約のルールが埋め込みや画像の外、本文にある",
            "構造化データの予約URLが、いま使っている予約画面のURL",
            "Googleビジネスプロフィールの予約リンクも同じ予約先",
          ],
        },
      ],
      faqs: [
        { q: "サイトに何を書けば、ChatGPTに予約ボタンが出ますか？", a: "サイトの書き方で予約ボタンが出る仕組みにはなっていません。OpenAI のヘルプでは、予約ボタンはChatGPTが対応する予約サービス（OpenTable・Resy・Yelp）の掲載とお店を結び付けられたときだけ出る、とされています。サイトには予約のルールを正しく書き、使っている予約サービスの掲載を正しく保つのが、店にできることです。" },
        { q: "ReserveAction を付ければ、AIから予約が入りますか？", a: "そうした公式の説明は見つかっていません。ReserveAction は付けても害は小さいものですが、予約を増やす効果は確かめられていません。先に本文の予約のルールを整えてください。" },
        { q: "予約システムの埋め込みだけで、本文がありません。", a: "埋め込みの中の文字が予約ページの本文として読まれるかはAIのサービスごとに違い、公開されていません。予約フォームは埋め込みのままでよいので、その上か下に、予約方法・受付期限・キャンセル規定を文字で書いてください。" },
        { q: "予約サイトのキャンセル規定と、自社サイトの規定が違います。", a: "AIはどちらを答えるか分かりません。できれば同じにし、違う場合は「ネット予約は前日まで無料、予約サイト経由の予約は各サイトの規定に従います」のように、どの予約先にどの規定が適用されるかを書いてください。" },
        { q: "空き状況をサイトに書いたほうがAIに出やすくなりますか？", a: "空き状況は変わるので、本文に書くと古い情報がAIの答えに残るおそれがあります。本文には空きの確かめ方を書き、空きそのものは予約システムで見てもらいます。" },
        { q: "飲食店以外でも、AIの中で予約できるようになりますか？", a: "Googleは2025年8月に、AIモードでの予約の代行を地域のサービスの予約にも広げる予定と発表しましたが、この記事を書いた時点で日本で使えるという公式の発表は確認できていません。今できることは、予約ページとGoogleビジネスプロフィールの予約リンクを正しく保つことです。" },
        { q: "予約ページを変えたら、AIの答えはいつ変わりますか？", a: "各AIが反映するまでの日数は公開されていません。変更の数日後から数週間後に、同じ質問で確かめてください。答えに古い予約先が出る場合は、出典のURLを確かめ、そのページを直します。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIがサイトを読める状態かを確かめる",
        body: "無料チェックは登録不要です。URLを入れると、AIクローラーの許可、構造化データ、llms.txtの状態が分かります。WordPressなら無料のプラグインで、サービスと予約URLを構造化データとllms.txtに出し、SEOプラグインと重ならないように整えられます。",
        label: "AI対応を無料でチェック",
        href: "/check",
        secondary: { label: "無料のWordPressプラグインを入れてみる", href: WP_ORG },
      },
      footnote: FOOT_JA,
    },
    en: {
      title: "How to write a booking page AI reads correctly | Nurevo",
      description: "Help AI answer \"do I need to book?\" and \"is there a cancellation fee?\" correctly: what a booking page needs, how booking inside AI works, schema, WordPress steps.",
      h1: "How to write a booking page AI reads correctly: booking methods, cut-offs, cancellation rules, and how booking inside AI works",
      lead: "To get AI to answer booking questions correctly, pick one booking page on your own site and write, as HTML text rather than inside an image or an embedded booking widget: how to book (online, phone, messaging), whether booking is required and what happens to walk-ins, how late and how far ahead you take bookings, the cancellation deadline and fee, and the list of official places to book. As of November 2026, booking inside ChatGPT or Google's AI runs mainly for restaurants, through reservation platforms such as OpenTable. Your own booking page is where AI goes to read your booking rules whether or not you are on one of those platforms.",
      intro: [
        "Written November 21, 2026 (JST). How to write opening hours is in [opening hours and holidays](/guide/business-hours-holidays-ai-search), and prices in [how to write a pricing page](/guide/pricing-page-ai-search). This guide covers the booking page that salons, clinics, restaurants, studios, lodging and call-out services all have in common.",
        "AI answers change by day, by wording and by service. The steps here make a page whose booking rules AI is less likely to misread, and show how to check; they do not guarantee you will appear in an answer or become bookable inside an AI.",
      ],
      sections: [
        {
          heading: "The short answer: five reasons AI gets booking wrong, and the fix for each",
          table: {
            head: ["Cause", "What happens in AI answers", "Fix"],
            rows: [
              ["The booking rules live only inside an embedded widget or an image", "AI can only say \"check the official website for how to book\"", "Write the booking method, cut-offs and cancellation rules as text on the booking page"],
              ["\"Bookings preferred\" or \"by appointment\" isn't explained", "AI gets wrong whether walk-ins are accepted", "Say what happens without a booking: \"Walk-ins welcome when we have space (expect a wait)\""],
              ["Several places to book, none marked as official", "AI sends people to an old booking site or a disconnected number", "List the places you use and fix one official booking URL per service"],
              ["No cancellation deadline or fee, or different rules on each site", "AI says cancellation is free, or quotes another business's rule", "Write the deadline, the fee and how to cancel in one place, and match the booking sites to it"],
              ["The booking page needs a login or an account to view", "AI can't even say whether you take bookings", "Keep a public page with the rules, and put the booking form behind it"],
            ],
          },
        },
        {
          heading: "How booking inside AI works (November 2026)",
          paragraphs: [
            "More businesses ask how to become bookable in ChatGPT. For now, booking inside an AI runs through integrations with booking platforms. There is no tag you can put on your site that adds a booking button. The table lists what the official announcements say.",
          ],
          table: {
            head: ["Service", "What it does", "Who it covers", "Source"],
            rows: [
              ["ChatGPT (restaurant reservations)", "Shows available times in the answer and takes the booking forward", `OpenTable worldwide, Resy in the U.S., Yelp in the U.S. and Canada. The Reserve button only appears when ChatGPT can match the restaurant to a listing on a supported provider. ChatGPT does not save the booking; changes and cancellations go through the provider`, `[OpenAI Help](${SRC.openaiSearch}) (checked 2026-11-21), [Resy (2026-08-10)](${SRC.resy})`],
              ["Google Search AI Mode (agentic booking)", "Finds availability that fits the request and links to the booking page", "Started 2025-08-21 with restaurants, for Google AI Ultra subscribers in the U.S. (Labs). Restaurant bookings in the UK from 2026-04-10. Partners named include OpenTable, Resy, Tock and TheFork", `[Google (2025-08-21)](${SRC.googleAgentic}), [Google UK (2026-04-10)](${SRC.googleUk})`],
              ["Google Business Profile", "Shows booking links on your profile", "Verified profiles. You can add your own link, or appear through a Reserve with Google booking provider", `[Business links policies](${SRC.gbpLinks}), [Bookings through a provider](${SRC.gbpProvider})`],
            ],
          },
          after: [
            `ChatGPT's reservations are built from lists of restaurants that booking platforms send to OpenAI. Each record is meant to carry the restaurant's own website URL and its listing URL on the platform ([OpenAI: Restaurant reservation conversion spec](${SRC.openaiSpec}), written for booking platforms).`,
            "So the booking button inside an AI depends on your booking platform. What a business controls is keeping its platform listings correct and writing its booking rules correctly on its own site. Even without a booking button, an AI asked \"do I need to book?\" or \"is there a cancellation fee?\" will answer from your site and from review and listing sites. The rest of this guide is about making that answer right.",
          ],
        },
        {
          heading: "What the top articles cover, and what they miss",
          paragraphs: [
            "We read the top Japanese and English articles for queries such as \"booking page AI search\" (2026-11-21). Most cover local AI visibility in general (consistent business details, more reviews). Few explain how to write the booking page itself step by step, and almost none give a structured data example or WordPress steps.",
          ],
          table: {
            head: ["Article", "Strong on", "Missing"],
            rows: [
              [`[Uravation, phone and booking routes (updated 2026-09-05, Japanese)](${SRC.uravationTel})`, "Not over-relying on ReserveAction, one fixed booking URL, measuring in GA4", "A JSON-LD example, WordPress steps, handling several booking sites"],
              [`[Uravation, experiences and tours (2026-10-12, Japanese)](${SRC.uravationTour})`, "One page per experience; writing conditions such as rain cancellations and duration", "Tours and activities only. No code, no WordPress"],
              [`[GMO local AIO (updated 2026-11-16, Japanese)](${SRC.gmo}) and [AIsmiley (updated 2026-10-30, Japanese)](${SRC.aismiley})`, "Google Business Profile set-up / what ChatGPT's restaurant booking covers in Japan", "Statistics without sources (GMO). Nothing on the business's own booking page (AIsmiley)"],
              [`[LSEO booking, pricing and availability (2026-10-02)](${SRC.lseoBooking}) and [LSEO plumber (2026-04-24)](${SRC.lseoPlumber})`, "An honest line: there is no universal booking schema, and availability should come from live systems", "No step-by-step, no sources, no WordPress"],
              [`[J.A. Watte, lodging (updated 2026-11-06)](${SRC.jwatte}), [Owner, restaurants (2026-10-22)](${SRC.owner}) and [Mindbody (2026-10-13)](${SRC.mindbody})`, "Booking links and tax-inclusive prices (lodging), menus as text (restaurants), a services page (fitness)", "Limited to one sector each; heavy on their own products"],
            ],
          },
          after: [
            "This guide covers, for any business that takes bookings, what to write on the booking page, how to sort out several booking channels, structured data, WordPress steps and how to check the result.",
          ],
        },
        {
          heading: "Eight facts every booking page needs",
          paragraphs: [
            "Booking questions fall into roughly eight kinds. Give each a one- or two-sentence paragraph, or a table row, in the booking page's text.",
          ],
          table: {
            head: ["Fact", "Example", "The question AI gets"],
            rows: [
              ["How to book", "Online 24 hours a day, by phone 10 am to 7 pm, by message (replies during opening hours)", "\"How do I book at (business)?\""],
              ["Whether booking is required", "By appointment. Walk-ins welcome when we have space (expect a wait)", "\"Can I just walk in?\""],
              ["Cut-off", "Until 8 pm the day before. Same-day by phone only", "\"Can I book for today?\""],
              ["How far ahead", "Up to two months ahead", "\"Can I book for next month yet?\""],
              ["Duration", "A haircut takes about 60 minutes", "\"How long does it take?\""],
              ["Cancellation", "Free until the day before. Same-day cancellations are charged 50%. Cancel by phone", "\"Is there a cancellation fee?\""],
              ["Payment and deposits", "No payment when booking. Pay on the day by cash, card or mobile payment", "\"Do I have to pay in advance?\""],
              ["Who it's for, what to bring", "First visit: arrive 10 minutes early to fill in a form. Children welcome", "\"Is it OK for a first visit?\" \"Can I bring my kids?\""],
            ],
          },
          after: [
            "Make every sentence make sense on its own. AI sometimes lifts a single sentence to answer, so avoid phrases that lean on what's around them, such as \"see above\" or \"click here\". Weak: \"Book here. Please let us know early if you need to cancel.\" Strong: \"Online booking is open 24 hours a day, and phone booking from 10 am to 7 pm. Cancellation is free until the day before; same-day cancellations are charged 50% of the price.\"",
            "Say what changes with and without a booking. If booked customers come first, write \"Walk-ins are seen between booked appointments.\" If you are strictly by appointment, write \"We can't see customers without a booking.\" That reduces answers that wrongly say \"no booking needed\".",
          ],
        },
        {
          heading: "Several booking sites: decide which channels are official",
          paragraphs: [
            "Salons and restaurants commonly take bookings in several places: their own system, booking sites, phone, messaging. AI passes on whatever booking channel it finds, so a booking site you've left or an old phone number can end up in the answer. Sort it out in this order.",
          ],
          list: [
            "List every channel you take bookings through (your own system, booking sites, the Google Business Profile booking link, phone, messaging, social media DMs)",
            "Remove listings on channels you no longer use, or mark them \"no longer taking bookings\"",
            "On the booking page, write \"We take bookings in these ways\" and list only the channels you use",
            "If each service has its own booking URL, fix one official URL per service (a link straight to that service's booking screen beats a link to your home page)",
            "Use the same cancellation rules and cut-offs on your site and every booking site. Where they differ, say which rule applies to which channel",
            "Link from booking-site profiles and your Google Business Profile description back to your own booking page",
          ],
          after: [
            `Google Business Profile booking links have rules: the profile must be verified; the link must lead to a page dedicated to your business where the booking can be completed; social media, messaging apps, app stores and link shorteners aren't allowed; the page must open without a login or CAPTCHA and return 200 ([Business links policies](${SRC.gbpLinks})). You can also appear through a booking provider that works with Reserve with Google; Google says custom links you add yourself get no performance data ([Bookings through a provider](${SRC.gbpProvider})).`,
          ],
        },
        {
          heading: "Don't write availability. Write how to check it",
          paragraphs: [
            "Write \"Saturdays are usually quiet\" or \"no booking needed on weekdays\" and an AI may keep using the sentence after things change. No AI service publishes how often it re-reads a page. Treat availability as something your booking system shows, and write how to check it instead: \"See available times on the online booking screen. For same-day availability, please call.\"",
            "If you mention busy times, phrase them as a stable pattern: \"Weekend afternoons get busy, so we recommend booking.\" Making it look emptier than it is misleads people and AI alike.",
          ],
        },
        {
          heading: "Make it readable: check embeds, images and logins",
          paragraphs: [
            "Many booking systems show their screen as an embed from another site (an iframe) or through JavaScript. People can see it, but whether AI reads the text inside an embed as part of your page differs by service and isn't published. Write the booking rules outside the embed, in the booking page's own text. The booking form itself can stay embedded.",
            "This command shows whether your booking page opens without a login and carries the rules in its HTML.",
          ],
          code: CURL_EN,
          after: [
            `OpenAI says that to be included in ChatGPT search, you should allow OAI-SearchBot to crawl your site and make sure your host or CDN allows traffic from OpenAI's published IP addresses ([OpenAI Help](${SRC.openaiSearch})). Check that bot protection isn't blocking the booking page in particular. For businesses that want AI agents to complete bookings for customers, Stripe suggests reviewing bot protections and considering WebMCP, but that is a further step that includes payments ([Stripe](${SRC.stripe})).`,
          ],
        },
        {
          heading: "Structured data: ReserveAction is fine to add, but don't expect much",
          paragraphs: [
            `schema.org has [ReserveAction](${SRC.reserveAction}), the action of making a reservation, and you can use it to tie a booking URL to a service. But we found no official statement from ChatGPT, Perplexity or Google's AI features that they use ReserveAction for booking. Google says AI features need no special structured data and that structured data must match the visible text ([AI features and your website](${SRC.aiFeatures}), checked 2026-11-18). Adding it does little harm, but it won't make a booking button appear.`,
            "If you add it, point each Service at its booking URL like this. It is the same shape Nurevo AIO publishes.",
          ],
          code: JSONLD_EN,
          after: [
            "The key is not to write a Reservation on its own. A bare Reservation says a booking already exists, which isn't true. As the result of a ReserveAction it says \"this action produces a booking\". Check the syntax with the [Schema Markup Validator](" + SRC.validator + ").",
          ],
        },
        {
          heading: "WordPress steps (with Nurevo AIO)",
          paragraphs: [
            `With [Nurevo AIO (free, formerly shown as Nurevo AEO)](${WP_ORG}), the booking URL entered for each service under Services in Settings is published as a ReserveAction in the Service structured data and in llms.txt. Work in this order.`,
          ],
          list: [
            "Fix the booking page text first, using the eight facts above (page text before structured data)",
            "Add your services (up to 20). Alongside Service name, Duration (minutes), Price and Currency, put that service's booking screen URL in Booking URL",
            "For services with a booking URL, the service name in llms.txt links to it (for example: - [Haircut](https://example.com/book/haircut/) — 60 min · USD 55.00)",
            "Nothing is read from booking plugins such as Amelia. That is deliberate, so that a wrong duration or booking URL is never published as fact; enter the values by hand",
            "Enter the booking or menu page's ID as the page that carries the services, and the Service markup goes on that page (0 = front page)",
            "Add cancellation fees, same-day booking and walk-ins to your FAQ. It won't duplicate Yoast SEO, Rank Math, All in One SEO or Slim SEO, and works alongside SEO SIMPLE PACK and VK All in One Expansion Unit (from 0.9.1)",
            "When you change booking channels, update the page text, the booking URLs in Nurevo, the FAQ answers and your Google Business Profile on the same day",
          ],
          after: [
            "Agencies that maintain client sites can put \"booking channel changes\" in the maintenance scope, so an old URL isn't left behind every time a client switches booking site. For agencies offering monthly support there is a [partner programme](" + PARTNER + ").",
          ],
        },
        {
          heading: "How to check: fix your booking questions and keep a record",
          paragraphs: [
            "To see whether your booking rules come across correctly, ask the same questions to the same AI on different days and record the answers. Don't judge from a single answer.",
          ],
          table: {
            head: ["Question", "What to look at"],
            rows: [
              ["\"Do I need to book at (business)?\"", "Is it right about appointments only vs walk-ins welcome?"],
              ["\"Can I book (business) for today?\"", "Are the cut-off and the method (phone only, etc.) right?"],
              ["\"What is (business)'s cancellation fee?\"", "Are the deadline and fee right? Is the source an old booking site?"],
              ["\"How do I book at (business)?\"", "Is the channel it gives one you use now?"],
              ["\"Which (business type) in (area) can I book today?\"", "Are you on the list for an unbranded question? Does a booking button appear (restaurants)?"],
            ],
          },
          after: [
            "Record the date, the AI service, the question, the answer and the source URL. If the source is an old booking site or blog post, fix that. On Nurevo's Free and Standard plans, once a month the Nurevo service asks Perplexity three unbranded questions built from your business type and area, and shows whether your name appeared and whether your site was cited. Pro ($99/month and up, beta) measures up to 20 questions on Perplexity (ChatGPT once configured). Record booking questions by hand. See [measuring AI visibility](/guide/measure-ai-visibility) for more.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "There is one booking page, and it opens without a login",
            "How to book and when bookings are taken is written as text",
            "Whether booking is required, and what happens without one, is stated",
            "The cut-off (same day, day before) and how far ahead you book are stated",
            "The cancellation deadline, fee and how to cancel are stated and match the booking sites",
            "Only channels you use are listed; old ones are gone",
            "The page says how to check availability rather than stating availability",
            "The booking rules are in the page text, outside embeds and images",
            "The booking URLs in structured data point at the booking screens you use now",
            "Your Google Business Profile booking link points at the same channel",
          ],
        },
      ],
      faqs: [
        { q: "What do I put on my site to get a Reserve button in ChatGPT?", a: "Nothing on your site switches it on. OpenAI's help says the Reserve button only appears when ChatGPT can match the restaurant to a listing on a supported provider (OpenTable, Resy, Yelp). What you can do is write your booking rules correctly on your site and keep your booking platform listings accurate." },
        { q: "Will adding ReserveAction bring bookings from AI?", a: "We found no official statement that it does. ReserveAction does little harm, but no benefit to bookings has been shown. Fix the booking rules in your page text first." },
        { q: "Our booking page is just an embedded widget with no text.", a: "Whether AI reads the text inside an embed as part of your page differs by service and isn't published. The form can stay embedded; write the booking methods, cut-offs and cancellation rules as text above or below it." },
        { q: "Our booking site's cancellation rules differ from our own site's.", a: "There's no telling which one an AI will quote. Make them the same if you can; if not, say which rule applies to which channel, for example \"Online bookings can be cancelled free until the day before; bookings made through booking sites follow each site's rules.\"" },
        { q: "Would writing our availability on the site help us appear in AI?", a: "Availability changes, so writing it in the page text risks old information staying in AI answers. Write how to check availability, and let the booking system show the availability itself." },
        { q: "Will businesses other than restaurants become bookable inside AI?", a: "In August 2025 Google said agentic booking in AI Mode would expand to local service appointments, starting in the U.S. Check Google's announcements for your country. What you can do now is keep your booking page and your Google Business Profile booking link accurate." },
        { q: "After we change the booking page, when will AI answers change?", a: "No AI service publishes how long it takes. Check with the same questions a few days to a few weeks later. If an old booking channel still appears, check the source URL and fix that page." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See whether AI can read your site",
        body: "The free check needs no sign-up: enter a URL to see AI crawler access, structured data and llms.txt. On WordPress, the free plugin publishes your services and booking URLs as structured data and in llms.txt, without duplicating your SEO plugin's output.",
        label: "Check your AI readiness for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: FOOT_EN,
    },
  },
};
