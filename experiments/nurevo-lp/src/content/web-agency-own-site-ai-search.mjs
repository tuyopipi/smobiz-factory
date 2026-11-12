// Content page: how a web design agency can make its OWN website easy for AI
// search (ChatGPT, Perplexity, Google AI) to read and cite when someone asks
// "which web design company should I hire in <city>?".
//
// Written 2026-11-12 (JST). Figures about agency websites come only from
// research-japan-web-agencies-ai-search-2026 (Nurevo survey, aggregated
// 2026-11-05, home pages only); do not add others. Claims about Nurevo AEO come
// from the plugin readme (experiments/webmcp-canary/wordpress-plugin/
// webmcp-canary/readme.txt). Google / OpenAI / Perplexity statements match the
// wording already checked for agency-aeo-monthly-service and
// measure-ai-visibility. schema.org ProfessionalService: the type page notes the
// general type for local businesses was deprecated (checked 2026-11-12), so the
// copy recommends Organization (+ LocalBusiness only for a visitable office).
// CAA stealth marketing: same source and wording as hair-salon-ai-search.
// Agencies join as referral partners only (see the channel rule in check-static).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  openai: "https://developers.openai.com/api/docs/bots",
  perplexity: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers.md",
  schemaPro: "https://schema.org/ProfessionalService",
  schemaArea: "https://schema.org/areaServed",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
};
const STUDY = "/guide/research-japan-web-agencies-ai-search-2026";

export default {
  slug: "web-agency-own-site-ai-search",
  targetQueries: [
    "ホームページ制作会社 AI検索 集客",
    "制作会社 自社サイト ChatGPT おすすめ 出る",
    "Web制作会社 LLMO 自社",
    "get your web design agency recommended by ChatGPT",
    "web agency AI search visibility own website",
    "how AI chooses which agency to recommend",
  ],
  related: ["research-japan-web-agencies-ai-search-2026", "agency-aeo-monthly-service", "measure-ai-visibility", "llms-txt", "local-business-schema-seo-plugins", "appear-in-chatgpt"],
  locales: {
    ja: {
      title: "Web制作会社の自社サイトをAI検索に選ばれる形にする手順 | Nurevo",
      description: "「〇〇市でおすすめのホームページ制作会社は？」とAIに聞かれたとき、自社の事実を正しく読ませる手順。対応エリア・料金・実績の書き方、構造化データ、測り方まで。",
      h1: "Web制作会社の自社サイトを、AI検索で選ばれる形にする手順",
      lead: "ChatGPTやPerplexityに「〇〇市でおすすめのホームページ制作会社は？」と聞くと、AIはウェブを検索し、制作会社のサイトや比較サイト・口コミなど複数のページを読んで答えをまとめます。自社が候補に入るには、「どこで・何を・いくらで・どんな実績で」作るのかを、自社サイトにAIが読める形で書き、外部の掲載情報とそろえ、決めた質問で定期的に確かめるのが近道です。AIの回答は日や回によって変わるため、必ず出る方法はありませんが、事実が読めない会社は候補に入りにくくなります。",
      intro: [
        "作成日：2026年11月12日（JST）。Google・OpenAI・Perplexityの仕様は各社の公式ドキュメントに基づきます。仕様は変わることがあるため、最新の情報もあわせてご確認ください。",
        "この記事は、お客様のAI検索対策ではなく、制作会社自身の集客のための記事です。お客様向けのサービス設計は[制作会社がAI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)にまとめています。",
      ],
      sections: [
        {
          heading: "AIは「おすすめの制作会社」をどうやって答えているか",
          paragraphs: [
            "ChatGPTの検索は OAI-SearchBot というクローラが集めた情報を使い、OpenAIは OAI-SearchBot を拒否したサイトはChatGPTの検索回答に表示されないとしています（[OpenAI：クローラの概要](" + SRC.openai + ")）。Perplexityも PerplexityBot の許可を推奨しています（[Perplexity：クローラ](" + SRC.perplexity + ")）。GoogleのAI OverviewsやAI Modeについて、Googleは追加の要件や特別な最適化はなく、通常のSEOのベストプラクティスが当てはまると説明しています（[Google検索セントラル：AI機能とウェブサイト](" + SRC.googleAi + ")）。",
            "つまり、AIは「検索して読めたページ」から答えを組み立てます。自社サイトはその材料の1つにすぎず、比較サイト・ポータル・口コミ・SNSなど自社の外のページも読まれます。制作会社ができるのは、(1) 自社サイトに事実を読める形で置く、(2) 外部の情報を同じ事実にそろえる、(3) 実際の回答を測る、の3つです。",
          ],
        },
        {
          heading: "制作会社サイトの現状：2,357件の調査から",
          paragraphs: [
            "Nurevoが2026年11月に国内Web制作会社の自社サイト2,357件のトップページを調べたところ、基本的なSEO設定はほぼ整っていた一方、AIが事業の事実を読み取るための項目は少数でした（[調査レポート](" + STUDY + ")）。",
          ],
          table: {
            head: ["項目", "割合", "読み方"],
            rows: [
              ["WordPressで作られている", "91.9%", "多くの会社は、プラグインやテーマの設定で直せる"],
              ["構造化データ（JSON-LD）がある", "68.9%", "約3割はトップページに構造化データがない"],
              ["Organization系の構造化データがある", "58.3%", "会社としての情報を出していないサイトが4割以上"],
              ["住所（PostalAddress）がある", "16.3%", "「どこの会社か」が機械的に読めるサイトは少ない"],
              ["llms.txt がある", "13.6%", "設置している会社はまだ一部"],
              ["FAQPage がある", "3.9%", "よくある質問を構造化しているサイトはまれ"],
              ["robots.txt でAIボットを1つ以上ブロック", "1.3%", "AIを拒否している会社はごく少数"],
            ],
            caption: "出典：Nurevo AEO 調査（国内Web制作会社の自社サイト2,357件、トップページのみ、2026年11月5日集計）。robots.txt の行は robots.txt がある2,158件が分母。",
          },
          after: [
            "AIを拒否している会社はほとんどないので、多くの制作会社にとっての課題は「読まれないこと」ではなく「読まれても、どこで何をいくらで作る会社かが伝わらないこと」です。なお、この調査はトップページだけを見ており、下層ページの状態は含みません。",
          ],
        },
        {
          heading: "AIに聞かれる質問と、自社サイトに置くべき答え",
          paragraphs: [
            "発注を考えている人がAIに聞く質問は、たいてい条件付きです。質問の型ごとに、AIが答えるために必要な事実と、それを置く場所を整理しました。",
          ],
          table: {
            head: ["質問の例", "AIが必要とする事実", "置く場所"],
            rows: [
              ["〇〇市でおすすめのホームページ制作会社は？", "所在地、対応エリア、オンラインでの打ち合わせの可否", "会社概要、フッター、構造化データ（address・areaServed）"],
              ["飲食店のサイトが得意な制作会社は？", "得意な業種と、その業種の制作実績", "業種別の実績ページ、サービスページ"],
              ["30万円くらいでサイトを作れる会社は？", "料金の目安と、その料金に含まれる作業", "料金ページ（税込・税別を明記）"],
              ["WordPressで作って保守まで頼める会社は？", "使うCMS、保守プランの内容と月額", "サービスページ、保守プランのページ"],
              ["急ぎで1か月以内に公開できる？", "制作期間の目安、進め方", "制作の流れのページ、FAQ"],
              ["小さな会社でも相談できる？", "対象とする顧客の規模、最低発注額の有無", "サービスページ、FAQ"],
            ],
          },
          after: [
            "どの質問にも共通するのは、「ご相談ください」「柔軟に対応します」ではAIが答えを作れないことです。数字や地名、業種名をはっきり書くほど、条件付きの質問に当てはまる会社として読まれやすくなります。",
          ],
        },
        {
          heading: "手順1：会社の事実を、ページの文章として書く",
          list: [
            "会社概要：社名（屋号）、所在地、対応エリア（市区町村・都道府県名で）、設立年、人数、代表者、電話・メール、営業時間。対応エリアが全国ならそう書き、来社が必要かどうかも書きます。",
            "サービスと料金：制作プランごとに料金の目安、含まれる作業（ページ数、デザイン、スマホ対応、CMS、写真撮影の有無など）、制作期間の目安を表にします。「〇〇円〜」だけでなく、よくある構成でいくらになるかの例があるとAIが答えやすくなります。",
            "実績：業種、地域、作ったもの（サイトの種類、ページ数）、担当した範囲、公開年を1件ずつ書きます。お客様の名前やURLを出すときは必ず許可を取り、許可がなければ「〇〇市の歯科医院（20ページ、WordPress）」のように書きます。",
            "得意分野：得意な業種・規模・CMSを、実績へのリンク付きで書きます。実績のない業種を「得意」と書かないでください。AIが外部情報と食い違いを見つけると、かえって信頼されにくくなります。",
            "よくある質問：問い合わせで実際に聞かれる質問（料金、期間、保守、修正回数、契約期間、ドメインやサーバーの名義）に、短く具体的に答えます。",
          ],
        },
        {
          heading: "手順2：構造化データで「どこの・何の会社か」を出す",
          paragraphs: [
            "構造化データ（schema.orgのJSON-LD）は、ページの文章と同じ事実を機械が読みやすい形で出すものです。制作会社の場合は、Organization を基本にし、来客を受ける事務所があるなら LocalBusiness も使えます。schema.org には ProfessionalService という型もありますが、schema.orgはこの型を地域の事業者向けの汎用の型としては非推奨にしています（[schema.org：ProfessionalService](" + SRC.schemaPro + ")）。",
          ],
          table: {
            head: ["プロパティ", "入れる内容", "メモ"],
            rows: [
              ["name / url / logo", "社名、サイトのURL、ロゴ", "多くのSEOプラグインが無料版でも出している"],
              ["address", "所在地（PostalAddress）", "調査では16.3%のサイトにしかなかった"],
              ["telephone / email", "問い合わせ先", "ページに表示しているものと同じにする"],
              ["areaServed", "対応エリア（都道府県名・市区町村名など）", "[schema.org：areaServed](" + SRC.schemaArea + ")"],
              ["sameAs", "公式SNS、Googleビジネスプロフィールなど自社の外のプロフィール", "外部の情報と同じ会社だと結びつける"],
              ["makesOffer / hasOfferCatalog", "制作・保守などのサービス", "料金ページの内容と一致させる"],
            ],
          },
          after: [
            "WordPressでは、Yoast SEO・Rank Math・All in One SEO などの無料版は、名前・URL・ロゴの Organization は出しても、住所や電話番号までは出さないことが多いです。足りない分だけを足し、同じ会社を2つ出さないようにします。手順は[SEOプラグインに店舗の構造化データを足す方法](/guide/local-business-schema-seo-plugins)を参照してください。Googleも、構造化データの内容をページに見えている内容と一致させることを求めています（[Google：LocalBusinessの構造化データ](" + SRC.googleLocal + ")）。",
          ],
        },
        {
          heading: "手順3：AIのクローラを止めていないか確かめる",
          list: [
            "robots.txt：OAI-SearchBot・PerplexityBot・Googlebot をブロックしていないか確かめます。調査ではブロックしていた制作会社は1.3%でしたが、ステージング環境の設定が本番に残っている、といった事故は自社サイトでも起こります。",
            "セキュリティ系プラグイン・WAF・CDNのボット対策：robots.txt以外の仕組みでAIのクローラを止めていないか、設定画面で確かめます。",
            "学習用クローラは別の判断：GPTBotのようなAIモデルの学習用のクローラを許可するかどうかは、AI検索への表示とは別の問題です。自社の方針として決めましょう。",
          ],
        },
        {
          heading: "手順4：llms.txt に会社の要約と主要ページを置く",
          paragraphs: [
            "llms.txt は、サイトの概要と主要なページをAI向けにまとめたテキストファイルです（/llms.txt）。会社の1行説明、対応エリア、サービスと料金ページ、業種別の実績ページ、FAQ、問い合わせページを並べます。調査では設置していた制作会社は13.6%でした。",
            "ただし、Googleは自社のAI機能のために新しいAI向けファイルは不要としており、llms.txt を置けばAIに出るという保証はありません。補助として扱い、本文と構造化データを先に整えてください。書き方は[llms.txtの書き方](/guide/llms-txt)にまとめています。",
          ],
        },
        {
          heading: "手順5：自社の外の情報をそろえる",
          paragraphs: [
            "AIは自社サイト以外のページも読むため、外部の掲載情報が古いと、古い住所や終了したサービスが答えに混ざります。社名の表記、所在地、電話番号、対応エリア、主なサービスを、次の場所で同じにします。",
          ],
          list: [
            "Googleビジネスプロフィール（事務所がある場合）",
            "制作会社のポータル・比較サイト・マッチングサービスの掲載ページ",
            "公式SNSのプロフィール、商工会議所や業界団体の会員ページ",
            "求人サイトの会社情報、プレスリリース",
          ],
          after: [
            `口コミや比較記事を自分で用意したり、第三者を装って書かせたりするのはやめましょう。日本では2023年10月1日からステルスマーケティングが景品表示法の違反となり、事業者が第三者に依頼・指示した投稿はその事業者の広告として扱われます（[消費者庁：ステルスマーケティング](${SRC.caaStealth})）。お客様に感想をお願いするのは構いませんが、内容を指示したり見返りを条件にしたりせず、関係を明示してください。`,
          ],
        },
        {
          heading: "手順6：決めた質問で、月に1回測る",
          paragraphs: [
            "最後に、見込み客が実際に聞きそうな質問を10問ほど決め、毎月同じ条件でChatGPTやPerplexityに聞いて、自社が出たか（言及）、自社サイトが出典になったか（引用）、どのページが出典になったかを記録します。AIの回答は回によって変わるため、1問を何回か聞き、1回の結果で判断しないのがコツです。測り方の詳細は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            "出典に比較サイトばかりが出るなら外部の掲載情報の見直し、競合だけが出るなら対応エリアや料金など条件の書き方の見直し、というように、結果を手順1〜5のどれに戻すかを決めると改善につながります。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "会社概要に、所在地・対応エリア・連絡先を文章で書いた",
            "料金の目安と含まれる作業、制作期間の目安を書いた",
            "業種・地域・範囲がわかる実績を、許可を取って載せた",
            "Organization（必要なら LocalBusiness）の構造化データに、住所・電話・対応エリアを入れ、ページの表示と一致させた",
            "SEOプラグインやテーマと、同じ会社を二重に出していない",
            "robots.txt・WAF・CDNで OAI-SearchBot・PerplexityBot・Googlebot を止めていない",
            "llms.txt に会社の要約と主要ページを並べた",
            "外部の掲載情報（Googleビジネスプロフィール、ポータル、SNS）を同じ事実にそろえた",
            "決めた質問を月1回、同じ条件で記録している",
          ],
        },
        {
          heading: "Nurevo AEO で整える場合",
          paragraphs: [
            `Nurevo AEO のWordPressプラグイン（[WordPress.org](${WP_ORG})、無料）では、サイトの種類で「B2B / SaaS」を選ぶと、提供しているサービスを持つ Organization を出し、料金・導入事例・FAQのページを llms.txt に並べます。Yoast SEO・Rank Math・All in One SEO・Slim SEO の構造化データは置き換えず、足りない事実だけを足します。0.9.1 からは SEO SIMPLE PACK・VK All in One Expansion Unit と併用しても構造化データが重複しません。`,
            "料金は Free 0円、評価基準の自動更新は Standard 月3,000円、AI登場率の継続計測（現在は Perplexity）は Pro 月14,800円〜です。自社サイトで試した手順は、そのままお客様への提案にも使えます。制作会社向けには、紹介したお客様の月額の40%（Stripe手数料控除後）をお支払いする紹介報酬もあります（承認制・国内の事業者が対象）。詳しくは[パートナープログラム](/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "比較サイトに有料で掲載すれば、AIに出やすくなりますか？", a: "わかりません。AIが比較サイトを出典にすることはありますが、どのサイトを読むかは質問や回によって変わり、掲載の効果を確かめた一次情報は見つかりませんでした。掲載するなら、自社サイトと同じ事実が書かれているかを必ず確認してください。" },
        { q: "料金を公開しないと不利ですか？", a: "「30万円くらいで」のような予算付きの質問には、料金がわからない会社は当てはめにくくなります。個別見積もりの場合も、よくある構成での目安や、料金に含まれる作業を書いておくと、AIも人も判断しやすくなります。" },
        { q: "対応エリアを広く書けば、多くの地域で出ますか？", a: "実際に対応していない地域まで書くのはおすすめしません。実績や外部の情報と食い違うと、正しく読まれない原因になります。全国対応ならそう書き、実績のある地域を具体的に示すほうが確実です。" },
        { q: "ブログ記事を量産すればAIに出ますか？", a: "量よりも、見込み客の質問に具体的に答えているかが大切です。料金・期間・保守・実績のように、発注前に聞かれる質問に事実で答えるページを先に整えましょう。" },
        { q: "効果はどれくらいで出ますか？", a: "決まった期間はありません。AIが新しい情報を読むまでの時間も、回答の変わり方もサービスごとに違います。月1回、同じ質問で記録し、推移で判断してください。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、自社サイトをAIがどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラ設定の現状がわかります。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "Google、ChatGPT、OpenAI、Perplexity、WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "Get Your Web Design Agency Cited by AI Search | Nurevo",
      description: "When someone asks ChatGPT or Perplexity which web design agency to hire in their city, can AI read your facts? Service area, pricing, case studies, schema, measurement.",
      h1: "How a web design agency can make its own site easy for AI search to recommend",
      lead: "When someone asks ChatGPT or Perplexity \"which web design agency should I hire in my city?\", the AI searches the web and pieces an answer together from several pages: agency websites, directories, reviews and comparison articles. To be one of the candidates, write down where you work, what you build, what it costs and what you have built, in a form AI can read on your own site; make your listings elsewhere say the same thing; and check a fixed set of questions regularly. AI answers vary between days and runs, so nothing guarantees a mention, but an agency whose facts cannot be read is hard to include.",
      intro: [
        "Written November 12, 2026 (JST). What Google, OpenAI and Perplexity say is based on their own documentation. Their guidance can change, so check the current pages too.",
        "This guide is about winning clients for your agency, not about AEO for your clients. For the client-facing service, see [how agencies can offer AI search optimization monthly](/guide/agency-aeo-monthly-service).",
      ],
      sections: [
        {
          heading: "How AI answers \"which agency should I hire?\"",
          paragraphs: [
            "ChatGPT search relies on a crawler called OAI-SearchBot, and OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers ([OpenAI: overview of crawlers](" + SRC.openai + ")). Perplexity recommends allowing PerplexityBot ([Perplexity: crawlers](" + SRC.perplexity + ")). For AI Overviews and AI Mode, Google says there are no additional requirements or special optimizations, and that SEO best practices still apply ([Google Search Central: AI features and your website](" + SRC.googleAi + ")).",
            "In short, AI builds its answer from pages it could find and read. Your website is one of those sources, alongside directories, portals, reviews and social profiles you do not control. What you can do comes down to three things: (1) publish your facts on your own site in a readable form, (2) make outside listings say the same, and (3) measure the actual answers.",
          ],
        },
        {
          heading: "Where agency websites stand: a survey of 2,357 sites",
          paragraphs: [
            "In November 2026 Nurevo examined the home pages of 2,357 Japanese web design agencies. Basic SEO settings were almost universal, but the items that let AI read a business's facts were much rarer ([survey report](" + STUDY + ")). The sample is Japanese, but the checks apply to any agency site.",
          ],
          table: {
            head: ["Item", "Share", "What it means"],
            rows: [
              ["Built on WordPress", "91.9%", "Most agencies can fix this with plugin or theme settings"],
              ["Has structured data (JSON-LD)", "68.9%", "About three in ten home pages have none"],
              ["Has Organization-type structured data", "58.3%", "Over four in ten do not describe themselves as a company"],
              ["Has an address (PostalAddress)", "16.3%", "Few sites say, in machine-readable form, where they are"],
              ["Has an llms.txt", "13.6%", "Still a minority"],
              ["Has FAQPage structured data", "3.9%", "Structured FAQs are rare"],
              ["robots.txt blocks at least one AI bot", "1.3%", "Almost nobody is blocking AI"],
            ],
            caption: "Source: Nurevo AEO survey (2,357 Japanese web design agency websites, home pages only, aggregated 2026-11-05). The robots.txt row uses the 2,158 sites with a robots.txt as its base.",
          },
          after: [
            "Since almost no agency blocks AI, the usual problem is not that AI cannot read your site. It is that, once it does, it still cannot tell where you work, what you build or what you charge. Note that the survey looked at home pages only.",
          ],
        },
        {
          heading: "The questions buyers ask, and the answers your site should hold",
          paragraphs: [
            "People who are about to hire an agency ask AI questions with conditions attached. For each kind of question, here is the fact AI needs and where to put it.",
          ],
          table: {
            head: ["Example question", "Facts AI needs", "Where to put them"],
            rows: [
              ["Best web design agency in [city]?", "Location, service area, whether you work remotely", "About page, footer, structured data (address, areaServed)"],
              ["Agency that is good at restaurant websites?", "Industries you specialise in, with work in that industry", "Case studies by industry, services page"],
              ["Can I get a website for around $3,000?", "Price guide and what the price includes", "Pricing page (say whether tax is included)"],
              ["Agency that builds on WordPress and maintains it?", "CMS you use, maintenance plans and monthly fee", "Services page, maintenance plan page"],
              ["Can you launch within a month?", "Typical timeline and process", "Process page, FAQ"],
              ["Do you work with small businesses?", "Client size you serve, any minimum budget", "Services page, FAQ"],
            ],
          },
          after: [
            "What these have in common: \"get in touch\" and \"flexible solutions\" give AI nothing to answer with. The more plainly you state numbers, place names and industries, the easier it is for AI to match you to a question with conditions.",
          ],
        },
        {
          heading: "Step 1: write your facts as page text",
          list: [
            "About page: company name, address, service area (by city or region name), year founded, team size, who runs it, phone and email, business hours. If you serve the whole country, say so, and say whether clients need to visit.",
            "Services and pricing: for each plan, a price guide, what is included (number of pages, design, mobile, CMS, photography and so on) and a typical timeline, in a table. A worked example of a common project helps AI more than \"from $X\" alone.",
            "Case studies: for each one, the industry, location, what you built (type of site, number of pages), your part in it and the launch year. Get the client's permission before naming them or linking to the site; without it, write \"a dental clinic in [city] (20 pages, WordPress)\".",
            "Specialities: name the industries, client sizes and CMSs you are good at, linked to the case studies that prove it. Do not claim industries you have no work in; when AI finds your claims contradicted elsewhere, it trusts you less.",
            "FAQ: short, specific answers to what prospects really ask: price, timeline, maintenance, rounds of revisions, contract length, and who owns the domain and hosting.",
          ],
        },
        {
          heading: "Step 2: use structured data to say where you are and what you do",
          paragraphs: [
            "Structured data (schema.org JSON-LD) repeats the facts on your pages in a form machines read easily. For an agency, start with Organization, and add LocalBusiness if you have an office that receives visitors. schema.org also has a ProfessionalService type, but schema.org notes that the general type for local businesses was deprecated ([schema.org: ProfessionalService](" + SRC.schemaPro + ")).",
          ],
          table: {
            head: ["Property", "What to put in", "Note"],
            rows: [
              ["name / url / logo", "Company name, site URL, logo", "Most SEO plugins publish these even in their free versions"],
              ["address", "Your address (PostalAddress)", "Only 16.3% of surveyed sites had one"],
              ["telephone / email", "Contact details", "Same as what the page shows"],
              ["areaServed", "Service area (region or city names)", "[schema.org: areaServed](" + SRC.schemaArea + ")"],
              ["sameAs", "Official social profiles, your Google Business Profile and other profiles off your site", "Ties outside listings to the same company"],
              ["makesOffer / hasOfferCatalog", "Services such as design and maintenance", "Keep consistent with your pricing page"],
            ],
          },
          after: [
            "On WordPress, the free versions of Yoast SEO, Rank Math and All in One SEO usually publish an Organization with a name, URL and logo, but often not the address or phone number. Add only what is missing, and never publish the same company twice. See [adding local business schema to your SEO plugin](/guide/local-business-schema-seo-plugins). Google also asks that structured data match what is visible on the page ([Google: LocalBusiness structured data](" + SRC.googleLocal + ")).",
          ],
        },
        {
          heading: "Step 3: make sure you are not blocking AI crawlers",
          list: [
            "robots.txt: check that OAI-SearchBot, PerplexityBot and Googlebot are not blocked. Only 1.3% of surveyed agencies blocked an AI bot, but a staging robots.txt left on the live site happens to agencies too.",
            "Security plugins, WAFs and CDN bot protection: check their settings for anything that stops AI crawlers outside robots.txt.",
            "Training crawlers are a separate decision: whether to allow crawlers that collect content for model training, such as GPTBot, is a different question from appearing in AI search. Decide it as company policy.",
          ],
        },
        {
          heading: "Step 4: put a summary and your key pages in llms.txt",
          paragraphs: [
            "llms.txt is a text file at /llms.txt that summarises your site and lists its key pages for AI. List a one-line description of the company, your service area, services and pricing pages, case studies by industry, FAQ and contact page. In the survey, 13.6% of agencies had one.",
            "Google says you don't need new AI text files for its own AI features, and an llms.txt does not guarantee a mention. Treat it as a helpful extra, after your page text and structured data. See [how to write llms.txt](/guide/llms-txt).",
          ],
        },
        {
          heading: "Step 5: make your listings elsewhere say the same thing",
          paragraphs: [
            "AI reads pages beyond your own site, so out-of-date listings put old addresses or discontinued services into its answers. Keep your company name, address, phone number, service area and main services identical in places like these:",
          ],
          list: [
            "Google Business Profile (if you have an office)",
            "Agency directories, comparison sites and matching platforms",
            "Official social profiles, chamber of commerce and trade association member pages",
            "Company details on job sites, press releases",
          ],
          after: [
            `Do not write your own reviews or comparison articles, or have them written under a third party's name. Rules on undisclosed advertising differ by country; in Japan, stealth marketing has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023, and posts a business asks or instructs third parties to make count as that business's advertising ([Consumer Affairs Agency: stealth marketing (Japanese)](${SRC.caaStealth})). Asking clients for honest feedback is fine; do not dictate what they say or make a reward conditional on it, and disclose the relationship.`,
          ],
        },
        {
          heading: "Step 6: check a fixed set of questions once a month",
          paragraphs: [
            "Finally, pick about ten questions your prospects are likely to ask and, once a month under the same conditions, ask them in ChatGPT and Perplexity. Record whether you were named (a mention), whether your site was a source (a citation), and which page was cited. Answers change between runs, so ask each question more than once and do not judge from a single result. See [how to measure AI visibility](/guide/measure-ai-visibility).",
            "Then decide which step to go back to. If the sources are mostly directories, review your outside listings. If only competitors appear, review how clearly you state conditions such as service area and pricing.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "The About page states your address, service area and contact details in plain text",
            "Pricing guides, what they include and typical timelines are published",
            "Case studies show industry, location and scope, with the client's permission",
            "Organization (and LocalBusiness if relevant) structured data includes address, phone and service area, and matches the page",
            "The SEO plugin or theme and your additions do not publish the company twice",
            "robots.txt, WAF and CDN do not block OAI-SearchBot, PerplexityBot or Googlebot",
            "llms.txt lists a company summary and your key pages",
            "Outside listings (Google Business Profile, directories, social profiles) state the same facts",
            "A fixed set of questions is recorded monthly under the same conditions",
          ],
        },
        {
          heading: "Doing it with Nurevo AEO",
          paragraphs: [
            `In the Nurevo AEO WordPress plugin ([WordPress.org](${WP_ORG}), free), choosing the \"B2B / SaaS\" site type publishes an Organization with the services you offer and lists your pricing, case study and FAQ pages in llms.txt. It does not replace the structured data from Yoast SEO, Rank Math, All in One SEO or Slim SEO; it adds only the facts they leave out.`,
            "Pricing: Free at USD 0; automatic ruleset updates on Standard at USD 20 a month; ongoing AI visibility measurement (currently Perplexity) on Pro from USD 99 a month. What you try on your own site can become your proposal to clients, and agencies based in Japan can apply to our [partner programme](/partner/), which pays a referral reward on clients they refer.",
          ],
        },
      ],
      faqs: [
        { q: "Will a paid listing on a comparison site make AI recommend us?", a: "We don't know. AI does cite comparison sites, but which ones it reads varies by question and by run, and we found no primary source measuring the effect of paid listings. If you list, make sure the listing states the same facts as your site." },
        { q: "Are we at a disadvantage if we don't publish prices?", a: "For questions with a budget, such as \"around $3,000\", an agency with no price information is hard to match. Even if every project is quoted individually, a guide for a typical project and what the price includes helps both AI and people decide." },
        { q: "If we list a wide service area, will we appear in more places?", a: "We don't recommend listing areas you do not actually serve. When your claims contradict your case studies or outside listings, AI is less likely to read you correctly. If you serve the whole country, say so, and name the places where you have work." },
        { q: "Will publishing lots of blog posts get us into AI answers?", a: "Specific answers to prospects' questions matter more than volume. Start with pages that answer pre-hire questions with facts: price, timeline, maintenance and case studies." },
        { q: "How long until we see results?", a: "There is no fixed time. How quickly AI picks up new information, and how its answers change, differs by service. Record the same questions monthly and judge by the trend." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your agency's site",
        body: "The free check needs no sign-up and shows the state of your structured data, llms.txt and AI crawler access.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Google, ChatGPT, OpenAI, Perplexity, WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
