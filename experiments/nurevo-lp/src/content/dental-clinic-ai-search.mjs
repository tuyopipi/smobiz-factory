// Content page: AI search (AEO) for dental clinics. Industry page.
//
// Written 2026-10-29 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or experiments/webmcp-canary/docs/pro-measurement-implementation.md (Pro
// measurement runs on Perplexity). The Dentist type is in the plugin's
// clinic family (includes/setup-wizard.php).
//
// Outside facts, checked 2026-10-29 on the primary pages linked in the copy:
// - Google LocalBusiness structured data: required name + address, recommended
//   openingHoursSpecification, telephone, url, geo, department...; "use the most
//   specific LocalBusiness sub-type possible".
// - Google "AI features and your website": no additional requirements or special
//   schema for AI Overviews / AI Mode; structured data should match visible text;
//   keep Business Profile up to date.
// - schema.org Dentist: under MedicalBusiness, also LocalBusiness and MedicalOrganization.
// - MHLW (Japan): since the Medical Care Act amendment in force 2018-06-01,
//   websites are covered by medical advertising rules; prohibited examples include
//   false, exaggerated and comparative claims, patient testimonials and before/after
//   photos; the four conditions for lifting the limit on what may be shown
//   (限定解除). Case book 5th edition notified 2025-03-11.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  dentist: "https://schema.org/Dentist",
  mhlwCases: "https://www.mhlw.go.jp/content/10800000/001232587.pdf",
  mhlwNotice5: "https://www.mhlw.go.jp/content/001440134.pdf",
};

export default {
  slug: "dental-clinic-ai-search",
  targetQueries: [
    "AI search optimization for dentists",
    "dental clinic ChatGPT visibility",
    "dentist schema markup",
    "歯科医院 AI検索対策",
    "歯医者 ChatGPT 表示 対策",
    "歯科 構造化データ Dentist",
  ],
  related: ["local-business-schema-seo-plugins", "what-is-aeo", "llms-txt", "appear-in-chatgpt", "aeo-wordpress"],
  locales: {
    ja: {
      title: "歯科医院のAI検索対策：ChatGPTやGoogle AIに正しく伝える方法 | Nurevo",
      description: "歯科医院のAI検索対策は、診療時間・診療科目・住所などの事実をDentistの構造化データとページ本文で正確に公開することから。医療広告ガイドラインとの関係、手順、チェック表を解説します。",
      h1: "歯科医院のAI検索対策：AIに医院の事実を正しく読ませる手順",
      lead: "歯科医院のAI検索対策（AEO）の中心は、診療時間・休診日・診療科目・住所・電話番号・予約方法といった事実を、ページ本文と構造化データ（schema.orgのDentist）で正確に、矛盾なく公開することです。「土曜に開いている近くの歯医者」のような質問に、AIが推測せずに答えられる材料をそろえます。日本では医院のウェブサイトも医療広告規制の対象なので、AI向けだからといって体験談や誇張した表現を足さないことも同じくらい大切です。",
      intro: [
        "作成日：2026年10月29日（JST）。Google・schema.org・厚生労働省の情報は、同日に各公式ページで確認したものです。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが医院の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "患者さんはAIに何を聞き、AIは何を読んでいるか",
          paragraphs: [
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどに歯科医院を探す質問をすると、AIはウェブ上の情報を読んで答えをまとめます。患者さんが聞くのは、たとえば「◯◯駅の近くで土曜も診てくれる歯医者」「子どもの歯科検診ができる医院」「夜19時以降に予約できる歯科」といった、場所・曜日・時間・診療内容がからむ質問です。",
            "こうした質問に答えるには、医院がどこにあり、何曜日の何時に開いていて、何を診ているかを、AIが読める形で読み取れる必要があります。営業時間が画像だけで書かれている、ページごとに休診日が違う、診療科目がどこにも文字で書かれていない、といった状態では、AIは答えに使いにくくなります。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別な構造化データはなく、通常のSEOの基本（構造化データをページの見える文章と一致させる、ビジネスプロフィールの情報を最新にする等）が大切だとしています。[Google：AI features and your website](${SRC.googleAi})。AI向けの裏技ではなく、医院の事実をそろえて正しく出すことが対策の本体です。`,
          ],
        },
        {
          heading: "歯科医院がサイトで公開しておきたい情報",
          paragraphs: [
            `構造化データでは、医院を[schema.orgのDentist](${SRC.dentist})（LocalBusinessの一種）として表します。Googleのローカルビジネスの構造化データでは、nameとaddressが必須、openingHoursSpecification・telephone・urlなどが推奨で、できるだけ具体的な種類を使うよう案内されています。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})`,
          ],
          table: {
            head: ["情報", "ページ本文での書き方", "構造化データ（Dentist）"],
            rows: [
              ["医院名", "正式名称を表記ゆれなく。看板・Googleビジネスプロフィールと同じに", "name（必須）"],
              ["住所・アクセス", "郵便番号から番地・建物名まで。最寄り駅と徒歩分数も文字で", "address（必須）、geo（推奨）"],
              ["電話番号・予約方法", "電話番号は文字で。ウェブ予約のページがあればリンク", "telephone、url（推奨）"],
              ["診療時間・休診日", "表を画像にせず文字で。昼休み・土曜の短縮・祝日の扱いも", "openingHoursSpecification（推奨）"],
              ["診療科目・診療内容", "一般歯科・小児歯科・矯正歯科・歯科口腔外科など、標榜している科目を文字で", "サービス（Service）として医院に紐づける"],
              ["よくある質問", "駐車場、保険診療か自由診療か、初診の持ち物など、実際によく聞かれること", "FAQPage（ページに見えているFAQにだけ付ける）"],
            ],
            caption: "構造化データの必須・推奨は、2026年10月29日時点のGoogleのローカルビジネスのドキュメントによります。",
          },
          after: [
            "大切なのは、本文・構造化データ・Googleビジネスプロフィール・llms.txtで、同じ事実が同じ値になっていることです。年末年始や臨時休診で診療時間が変わったら、すべてを一緒に更新します。",
          ],
        },
        {
          heading: "医療広告ガイドラインとの関係：AI向けでも書いてはいけないこと",
          paragraphs: [
            `日本では、2018年6月1日に施行された改正医療法により、医療機関のウェブサイトも医療広告規制の対象になりました。厚生労働省の「医療広告規制におけるウェブサイト等の事例解説書」では、虚偽広告、誇大広告、比較優良広告（他院より優れていると示すもの）、患者さんの体験談、治療前後の写真（ビフォーアフター）などが、広告が禁止される事例として扱われています。[厚生労働省：事例解説書（分科会資料）](${SRC.mhlwCases})／[第5版の通知（2025年3月11日）](${SRC.mhlwNotice5})`,
            "AI検索対策のために、構造化データやFAQに「地域No.1」「痛くない治療」のような表現や、患者さんの口コミ・体験談を足すのは避けてください。構造化データもページの内容を機械向けに書いたものなので、本文に書けないことは構造化データにも書かないのが原則です。",
            "一方で、自由診療の内容・費用・主なリスクや副作用、問い合わせ先などを、患者さんが自ら調べて見るウェブサイトで詳しく説明することは、事例解説書が示す「限定解除」の要件を満たす形で認められています。具体的な表現の可否は、事例解説書や医療広告ガイドライン、管轄の保健所などで確認してください。",
          ],
        },
        {
          heading: "WordPressの歯科医院サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。`,
            "初回の設定ウィザードで「クリニック・歯科」を選び、業種をDentistにします。医院名・住所・電話番号・診療時間・説明を確認します。空欄の項目だけがSEOプラグインなどの既存の設定から補われ、入力済みの値は上書きされません。",
            "設定画面で診療内容（一般歯科、小児歯科など）をサービスとして登録し、よくある質問を入力します。FAQはNurevo FAQブロック（または[nurevo_faq]ショートコード）を置いたページで、そのページのFAQPageに追加されます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可（OAI-SearchBot、PerplexityBot、Claude-SearchBotなど）は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールの診療時間と一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインが出しているグラフに足りない住所・電話番号・診療時間・Dentistの種類だけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/ja/guide/local-business-schema-seo-plugins/)をご覧ください。WordPress以外のサイトでも、上の表の情報を本文と構造化データで公開する考え方は同じです。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "診療時間・休診日が、画像ではなく文字で書かれている。",
            "医院名・住所・電話番号が、サイト内とGoogleビジネスプロフィールで一致している。",
            "構造化データの種類がOrganizationのままではなく、Dentistになっている。",
            "構造化データの診療時間が、ページに見えている診療時間と同じ。",
            "FAQの構造化データは、そのFAQが見えているページにだけ付いている。",
            "体験談・ビフォーアフター写真・「No.1」などの比較や誇張の表現を、本文にも構造化データにも入れていない。",
            "llms.txtに、医院の概要・診療内容・アクセス・予約のページが載っている。[llms.txtとは](/ja/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、患者さんが聞きそうな質問をAIに投げて、医院が名前やURLで出てくるかを見ます。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて確かめるのが現実的です。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（医院名は含めません）をPerplexityに投げ、回答に医院の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に医院が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "歯科医院のAI検索対策は、何から始めればいいですか？", a: "診療時間・休診日・住所・電話番号・診療科目を、ページ本文に文字で正しく書くことからです。そのうえで、同じ事実をDentistの構造化データとllms.txtで公開し、Googleビジネスプロフィールと値をそろえます。" },
        { q: "構造化データはOrganizationやLocalBusinessではだめですか？", a: "間違いではありませんが、Googleはできるだけ具体的な種類を使うよう案内しています。歯科医院ならschema.orgのDentistが当てはまります。" },
        { q: "AI向けに患者さんの口コミや体験談を載せてもいいですか？", a: "日本では、医院のウェブサイトも医療広告規制の対象で、患者さんの体験談は禁止される事例として扱われています。AI向けの構造化データやFAQにも入れないでください。判断に迷う場合は、厚生労働省の事例解説書や管轄の保健所で確認してください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（Dentist）・住所・診療時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに医院が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが医院の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが医院のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEOはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Dental Clinics: Get Your Practice Read Right | Nurevo",
      description: "AEO for dentists starts with publishing your hours, services, address and booking details correctly, in page text and Dentist structured data. Steps and a checklist.",
      h1: "AI search for dental clinics: how to get AI to read your practice's facts correctly",
      lead: "AI search optimization (AEO) for a dental clinic comes down to publishing the facts patients ask about (opening hours, days closed, treatments, address, phone number and how to book) accurately and consistently, both in your page text and in schema.org Dentist structured data. That gives ChatGPT, Perplexity and Google's AI what they need to answer \"which dentist near me is open on Saturday?\" without guessing. Healthcare advertising rules still apply to your website, so do not add testimonials or bold claims just because the audience is a machine.",
      intro: [
        "Written October 29, 2026 (JST). Information from Google, schema.org and Japan's Ministry of Health, Labour and Welfare was checked on each official page that day.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your practice's facts readable to AI. They do not guarantee that an AI will mention your clinic or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What patients ask AI, and what AI reads",
          paragraphs: [
            "When someone asks ChatGPT, Perplexity or Google's AI Overviews to find a dentist, the AI reads what it can find on the web and builds an answer. The questions are usually about place, day, time and treatment: \"a dentist near the station that is open on Saturday\", \"a family dentist that sees children\", \"a dental clinic with evening appointments after 7pm\".",
            "To answer them, an AI has to be able to read where your practice is, which days and hours it is open, and what it treats. If your hours exist only as an image, your days closed differ between pages, or your treatments are never written out as text, your clinic is harder to use in an answer.",
            `Google says there are no additional requirements and no special schema.org markup needed to appear in AI Overviews or AI Mode, and that normal SEO basics still matter, such as making structured data match the visible text and keeping your Business Profile up to date. [Google: AI features and your website](${SRC.googleAi}). The work is not an AI trick: it is publishing your practice's facts correctly and consistently.`,
          ],
        },
        {
          heading: "The facts a dental practice should publish",
          paragraphs: [
            `In structured data, a dental practice is described as a [schema.org Dentist](${SRC.dentist}), a kind of LocalBusiness. Google's local business documentation lists name and address as required, recommends openingHoursSpecification, telephone, url and others, and asks you to use the most specific LocalBusiness sub-type possible. [Google: Local business structured data](${SRC.googleLocal})`,
          ],
          table: {
            head: ["Fact", "On the page", "In structured data (Dentist)"],
            rows: [
              ["Practice name", "Your official name, spelled the same way everywhere, matching your sign and Business Profile", "name (required)"],
              ["Address and directions", "The full address, plus nearby stations, parking or landmarks as text", "address (required), geo (recommended)"],
              ["Phone and booking", "The phone number as text, and a link to online booking if you have it", "telephone, url (recommended)"],
              ["Opening hours and days closed", "A text table, not an image, including lunch breaks, short Saturdays and public holidays", "openingHoursSpecification (recommended)"],
              ["Treatments", "General, pediatric, orthodontic, oral surgery and so on, written out as text", "Services (Service) linked to the practice"],
              ["Frequently asked questions", "What patients really ask: parking, insurance, what to bring to a first visit", "FAQPage, only on the page where the FAQ is visible"],
            ],
            caption: "Required and recommended properties as listed in Google's local business documentation on October 29, 2026.",
          },
          after: [
            "What matters most is that the same fact has the same value everywhere: page text, structured data, your Google Business Profile and llms.txt. When holiday or temporary closures change your hours, update all of them together.",
          ],
        },
        {
          heading: "Healthcare advertising rules: what not to add for AI",
          paragraphs: [
            `Rules differ by country, so check the ones that apply to you. In Japan, an amendment to the Medical Care Act that took effect on June 1, 2018 brought medical institutions' websites under the medical advertising rules. The Ministry of Health, Labour and Welfare's case book on websites treats false and exaggerated claims, claims of being better than other clinics, patient testimonials and before-and-after treatment photos as examples of prohibited advertising. [MHLW case book (committee material, Japanese)](${SRC.mhlwCases}) / [5th edition notice, March 11, 2025 (Japanese)](${SRC.mhlwNotice5})`,
            "So do not add phrases like \"No. 1 in the area\" or \"painless treatment\", or patient reviews and testimonials, to your structured data or FAQ for the sake of AI. Structured data is your page's content written for machines: if you cannot say it on the page, do not say it in the markup.",
            "On the other hand, the case book sets out conditions under which a website patients look up themselves may explain more, such as the content, cost and main risks and side effects of self-paid treatment, with contact details for questions. For whether a particular wording is allowed, check the official guidance or your local health authority.",
          ],
        },
        {
          heading: "Setting it up on a WordPress dental site",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO or Slim SEO if you use one.`,
            "In the setup wizard, choose \"Clinic or dental\" and set the business type to Dentist. Confirm the name, address, phone, opening hours and description. Only blank fields are filled in from your existing settings; nothing you typed is overwritten.",
            "Under Settings, add your treatments (general, pediatric and so on) as services and enter your FAQ. FAQ questions are added to the page's FAQPage on the page where you place the Nurevo FAQ block or the [nurevo_faq] shortcode.",
            "Run the diagnosis on the AEO Score screen and apply the one-click fixes the checklist offers. Structured data, llms.txt and AI crawler access (OAI-SearchBot, PerplexityBot, Claude-SearchBot and others) are all on the free plan.",
            "See what AI reads from the outside with the [free AI readability check](/check?lang=en), and confirm the hours match your Google Business Profile.",
          ],
          after: [
            "With an SEO plugin active, Nurevo AEO does not print a second set of structured data. It adds only the missing address, phone, opening hours and the Dentist type into the graph your SEO plugin already publishes. See [adding local business schema to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/). On sites not built with WordPress, the same idea applies: publish the facts in the table above in your page text and in structured data.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Opening hours and days closed are written as text, not shown as an image.",
            "Name, address and phone match across your site and your Google Business Profile.",
            "The structured data type is Dentist, not a generic Organization.",
            "Hours in the structured data match the hours visible on the page.",
            "FAQ structured data appears only on the page where that FAQ is visible.",
            "No testimonials, before-and-after photos or comparative or exaggerated claims, in the text or in the markup.",
            "llms.txt lists your practice overview, treatments, directions and booking pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions your patients would ask and see whether your practice comes up by name or URL. Answers change between runs, so ask the same questions a few times, spread over time.",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your clinic's name) are put to Perplexity, and the plugin records whether the answers named your practice or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your practice appears in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a dental clinic start with AI search?", a: "Write your opening hours, days closed, address, phone and treatments correctly as text on your pages. Then publish the same facts as Dentist structured data and in llms.txt, and make sure they match your Google Business Profile." },
        { q: "Is Organization or LocalBusiness structured data wrong for a dentist?", a: "Not wrong, but Google asks you to use the most specific type possible. For a dental practice that is schema.org Dentist." },
        { q: "Should I add patient reviews or testimonials for AI?", a: "Check your local rules first. In Japan, clinic websites are covered by medical advertising rules, and patient testimonials are treated as prohibited advertising. Do not add them to structured data or FAQ for AI either." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (Dentist), address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my practice appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your practice's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO and Slim SEO are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
