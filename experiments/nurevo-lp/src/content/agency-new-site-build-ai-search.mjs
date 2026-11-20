// Content page: for web agencies - how to build a NEW client site with AI
// search readiness from the first meeting: hearing-sheet items to add, the
// sitemap and page types, the copy request sheet (question -> answer -> detail),
// template/theme decisions (one source of structured data), staging and launch
// day (WordPress "discourage search engines", Nurevo's behaviour while it is
// on), WordPress steps with Nurevo AEO, what to write in the quote/scope, and
// how to measure a site that has no history.
// Different from: site-renewal-ai-search (existing site, URL moves/redirects),
// agency-aeo-first-audit-proposal (pre-sales audit of an existing site),
// agency-aeo-monthly-service (retainer after launch), agency-aeo-client-handover.
//
// Written 2026-11-20 (JST). Product facts come from the plugin source
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2):
// - nurevo-webmcp.php webmcp_canary_allow_ai_crawlers_robots_txt(): when the
//   robots_txt filter's $public is false (WordPress "Discourage search
//   engines" on, blog_public = 0) Nurevo adds no AI crawler group. Search
//   agents allowed: OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
//   Claude-User, PerplexityBot, Perplexity-User. Training crawlers default to
//   the site's own robots.txt (readme).
// - webmcp_canary_schema_request_allowed(): no Nurevo structured data while
//   blog_public is off.
// - webmcp_canary_llms_txt_body(): /llms.txt depends only on the plugin's
//   enabled / serve_llms_txt switches (not on blog_public), so it is served on
//   a staging site too.
// - webmcp_canary_build_local_llms_txt(): Pages = up to 30 published pages
//   and posts, most recently modified first, minus per-page exclusions; then
//   Products and Services. "URL" fact = business URL setting or home_url('/').
// - readme: setup wizard (site type Local business / Online shop / B2B-SaaS),
//   extraction fills blank fields only, typed values never overwritten;
//   per-page settings (leave out of llms.txt, no Nurevo structured data, page
//   FAQ); Nurevo FAQ block / [nurevo_faq] - FAQPage only where shown;
//   Settings > Tools export/import JSON, keys/tokens/plan/connection never
//   exported; WP-CLI `wp nurevo status|diagnose|export|import`; SEO plugin
//   coexistence (Yoast / Rank Math / AIOSEO / Slim SEO graph filters; SEO
//   SIMPLE PACK and VK ExUnit handled since 0.9.1).
// Outside facts:
// - make.wordpress.org/core 2019-09-02 (read 2026-11-20): since WordPress 5.3
//   "Discourage search engines" outputs <meta name='robots'
//   content='noindex,nofollow' />, and Disallow: / was removed from robots.txt
//   for non-public sites; X-Robots-Tag header recommended for non-HTML files.
// - Google "AI features and your website" (last updated 2025-12-10, read
//   2026-11-18 for google-ai-overviews-citations; not re-readable this run):
//   no additional requirements; no special schema.org; no new AI text files;
//   structured data must match visible text.
// - Google "Optimizing your website for generative AI features" (2026-07-10,
//   read 2026-11-18): JavaScript is processed unless blocked; perfectly
//   semantic HTML not required; LLMS.txt is ignored by Google Search.
// - Search Console generative AI performance report: all sites as of
//   2026-08-31 (read 2026-11-10 for search-console-ai-features).
// - Perplexity crawlers doc: changes can take up to 24 hours (read 2026-11-18).
// - Top articles read 2026-11-20 (ja): sungrove aio-hp (2026-11-10, upd
//   2026-11-18), jinrai web-development (upd 2026-11-18), 発注ラウンジ
//   ヒアリングシート (2026-09-08), PRONIアイミツ ヒアリングシート (upd
//   2025-01-08); Fyve service pages returned only the home page. (en): Aurum
//   House (2026-05-27), ColorWhistle (upd 2026-10-07), Avenue Z (2025-07-22),
//   Xponent21 (undated), Orbit Media (2026-03-19), Webflow (upd 2026-04-15),
//   IMPACT (upd 2026-09-29).
// Not stated on purpose: price ranges or hours for this work (no primary
// source; jinrai's prices are its own), how non-Google AI crawlers render
// JavaScript (no official documentation read), any "x times more citations"
// figures from the top articles (unsourced or vendor data).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  wp53: "https://make.wordpress.org/core/2019/09/02/changes-to-prevent-search-engines-indexing-sites/",
  aiFeaturesJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  aiFeatures: "https://developers.google.com/search/docs/appearance/ai-features",
  optGuide: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  pplxCrawlers: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  richResults: "https://search.google.com/test/rich-results",
  validator: "https://validator.schema.org/",
};

const BRIEF = `【原稿依頼シート】ページ：料金（/price/）　締切：◯月◯日　確認者：◯◯様
1. このページで答える質問（お客様がよく聞かれる言い方で）
   例）初回はいくらかかりますか？／追加料金がかかるのはどんなときですか？
2. 答え（1〜2文。数字・単位・税込/税抜・いつ時点かを入れる）
   例）初回カウンセリングは無料、施術は1回 8,800円（税込）からです（2026年11月時点）。
3. くわしい説明（条件・例外・対象外）
4. 表にしたい内容（コース名／料金／所要時間／条件）
5. この情報の正本と更新する人（例：料金表 Excel、店長が改定時に連絡）
6. 画像やPDFにしか載っていない情報はないか（ある場合は文字で）`;

const BRIEF_EN = `[Copy request sheet] Page: Pricing (/pricing/)  Due: <date>  Approver: <name>
1. The questions this page answers (in the words customers actually use)
   e.g. How much is the first visit? When do extra charges apply?
2. The answer (1-2 sentences, with numbers, units, tax and an "as of" date)
   e.g. The first consultation is free; treatments start at $65 per session (as of November 2026).
3. Details (conditions, exceptions, what is not included)
4. What belongs in a table (plan / price / duration / conditions)
5. Where the master copy of this fact lives and who updates it
6. Anything that exists only in an image or PDF (send it as text)`;

const LAUNCH = `# 1. 本番の robots.txt（AI検索のクローラーの行があるか、Disallow: / が残っていないか）
curl -s https://www.example.jp/robots.txt

# 2. 「検索エンジンがサイトをインデックスしないようにする」が外れているか
#    （0 なら非公開のまま。1 で公開）
wp option get blog_public
curl -s https://www.example.jp/ | grep -i 'name=.robots'

# 3. llms.txt と Nurevo の出力の状態
curl -s https://www.example.jp/llms.txt | head -20
wp nurevo status

# 4. ステージングから設定を移す（キー・トークン・プランは入らない）
wp nurevo export --file=nurevo-settings.json   # ステージングで
wp nurevo import nurevo-settings.json          # 本番で`;

const LAUNCH_EN = `# 1. Production robots.txt (are the AI search crawler groups there? no leftover Disallow: /?)
curl -s https://www.example.com/robots.txt

# 2. Is "Discourage search engines" off? (0 = still private, 1 = public)
wp option get blog_public
curl -s https://www.example.com/ | grep -i 'name=.robots'

# 3. llms.txt and Nurevo's output status
curl -s https://www.example.com/llms.txt | head -20
wp nurevo status

# 4. Move settings from staging (keys, tokens and the plan are not included)
wp nurevo export --file=nurevo-settings.json   # on staging
wp nurevo import nurevo-settings.json          # on production`;

export default {
  slug: "agency-new-site-build-ai-search",
  targetQueries: [
    "ホームページ制作 AI検索対策 最初から",
    "Web制作 ヒアリングシート AI検索",
    "新規サイト制作 LLMO AIO 設計",
    "build new website for AI search agency",
    "website discovery questionnaire AEO",
    "AEO checklist new website launch",
  ],
  related: ["site-renewal-ai-search", "agency-aeo-first-audit-proposal", "agency-aeo-monthly-service", "pricing-page-ai-search", "faq-page-ai-search"],
  locales: {
    ja: {
      title: "新規サイト制作にAI検索対策を最初から入れる手順：制作会社向け | Nurevo",
      description: "制作会社が新しいサイトを作るときに、AI検索対策を後付けにしない手順。ヒアリングシートに足す項目、ページの型、原稿依頼シート、ステージングと公開日の確認、見積もりの書き方。",
      h1: "新規サイト制作にAI検索対策を最初から入れる手順：ヒアリングから公開後の測定まで",
      lead: "新しいサイトにAI検索対策を最初から入れるには、①ヒアリングで「お客様がよく聞かれる質問」と「事実の正本（料金・営業時間・対応エリアなどの元データ）と更新する人」を聞き、②1ページ1つの話題でページの型を決め、③原稿を「質問→1〜2文の答え→くわしい説明」の形で依頼し、④構造化データを出すのはテーマ・SEOプラグイン・専用プラグインのどれか1つと決め、⑤公開日に、ステージングの非公開設定とAIのクローラーの扱いを確かめます。どれも、作り終えてから足すより、設計と原稿の段階で決めるほうが手戻りが少なくなります。",
      intro: [
        "作成日：2026年11月20日（JST）。対象は、お客様の新しいサイトを企画・制作する制作会社・フリーランスのWebデザイナー・ディレクターです。いまのサイトを作り直してURLやドメインが変わる場合は[リニューアルでAI検索の出典を失わない手順](/guide/site-renewal-ai-search)を、商談前にいまのサイトを診断する場合は[初回診断と提案書の作り方](/guide/agency-aeo-first-audit-proposal)を、公開後の月額の作業は[AI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)を見てください。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、AIがお客様の事実を正しく読める状態で公開するためのもので、AIの回答に出ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれている記事と、足りないこと",
          paragraphs: [
            "「ホームページ制作 AI検索対策」「Web制作 ヒアリングシート」「AEO checklist new website」などで上位に出る日本語4本と英語7本を、2026年11月20日に読みました（日本語のもう1社はサービスページを開いてもトップページの内容しか出ず、使えませんでした）。日本語では、AI検索に強いサイトの特徴を説明する記事（sungrove、2026年11月18日更新）と、制作会社のサービス紹介（jinrai、2026年11月18日更新）、ヒアリングシートの解説（発注ラウンジ 2026年9月8日、PRONIアイミツ 2025年1月8日更新）が上位でした。英語では、制作会社が自社の進め方を説明する記事（Aurum House、ColorWhistle、Xponent21、Orbit Media）と、AEOの解説（Avenue Z、Webflow、IMPACT）が中心でした。",
            "結論を先に書く・見出しを整理する・構造化データを入れる・クロールを止めない、という点はほぼすべての記事で一致しています。一方で、制作の工程に落としたときに必要な次の点は、ほとんど書かれていませんでした。",
          ],
          table: {
            head: ["足りない点", "この記事で書いていること"],
            rows: [
              ["ヒアリングシートの記事は、目的・ターゲット・デザイン・素材・予算などの項目だけで、AI検索のために聞くことがない", "ヒアリングシートに足す8項目と、聞く理由"],
              ["AI検索の記事は「結論を先に」と書くが、原稿をお客様にどう依頼するかがない", "原稿依頼シートの型と、悪い例・良い例"],
              ["ステージング（公開前の確認用サイト）の非公開設定と、AI向けの出力の関係に触れた記事がない", "WordPressの非公開設定の動き（5.3以降）と、公開日に外すものの確認"],
              ["構造化データの「型」は並ぶが、テーマ・SEOプラグイン・別のプラグインのどれが出すかを決める話がない", "出し手を1つに決める表"],
              ["見積もり・作業範囲・契約に何を書くかを書いた記事がない（日本語の1本が見積もりの進め方に触れるだけ）", "見積もりの行と、契約に入れる4点"],
              ["公開後の測り方が「AIで確認する」程度。新しいサイトには比べる前の数字がない", "公開日に基準を記録し、同じ質問で比べる方法"],
            ],
            caption: "記事ごとの良し悪しではなく、制作の工程で抜けやすい点をまとめています。上位の記事には「AIの引用が◯倍」といった数字もありましたが、出典がないか1社の自社データだったため、この記事では使っていません。",
          },
        },
        {
          heading: "工程ごとに入れるもの：全体の表",
          paragraphs: [
            "AI検索対策を新規制作に入れるといっても、特別な工程が増えるわけではありません。いつもの工程の中で、聞くこと・決めること・確かめることが少し増えるだけです。Googleも、AIによる概要などのAI機能のために追加の要件や特別な最適化は必要なく、特別な構造化データや新しいAI向けのテキストファイルも要らないとしています（[AI 機能とウェブサイト](" + SRC.aiFeaturesJa + ")、2025年12月10日更新、2026年11月18日に確認）。だからこそ、通常のサイト作りの質を、事実の正しさと読みやすさの面で上げることが中心になります。",
          ],
          table: {
            head: ["工程", "AI検索のために足すこと", "成果物", "主に動く人"],
            rows: [
              ["ヒアリング・要件定義", "よく聞かれる質問、事実の正本と更新する人、外部の掲載先、業種の広告ルール、学習用クローラーの方針を聞く", "ヒアリングシート（AIの項目つき）", "制作会社が聞き、お客様が答える"],
              ["サイトマップ・ワイヤーフレーム", "質問をページに割り当てる。1ページ1つの話題。事実のページ（料金・アクセス・会社概要・FAQ）を独立させる", "質問とページの対応表", "制作会社"],
              ["原稿・素材", "「質問→答え→くわしい説明」の形で依頼。数字・単位・時点・条件を入れてもらう。画像やPDFだけの情報を文字にする", "原稿依頼シート", "お客様が書き、制作会社が整える"],
              ["構築", "本文を文字で出す。表は表として作る。構造化データの出し手を1つに決め、本文と同じ値にする", "テンプレート、設定", "制作会社"],
              ["公開日", "非公開設定を外す。robots.txt・llms.txt・構造化データ・WAFを確かめる。Search Consoleを設定する", "公開日の確認表", "制作会社"],
              ["公開後1〜3か月", "決めた質問をAIで聞いて記録する。事実が変わったら直す", "測定の記録、月次の報告", "制作会社（保守契約がある場合）"],
            ],
            caption: "Googleは同じページで、構造化データはページに見えている文字と一致させるよう求めています。原稿と構造化データの値を同じ元データから作るのは、このためです。",
          },
        },
        {
          heading: "ヒアリングシートに足す8項目",
          paragraphs: [
            "ヒアリングシートの解説記事が挙げる項目（会社の基本情報、目的、ターゲット、競合、デザイン、掲載したい内容、素材、予算と納期）は、そのまま使えます。そこに、AI検索のために次の8項目を足します。どれも、後から聞き直すと原稿の書き直しになる項目です。",
          ],
          table: {
            head: ["足す項目", "聞き方の例", "なぜ要るか"],
            rows: [
              ["よく聞かれる質問（10〜20個）", "電話・メール・窓口・営業の場で、初めての人によく聞かれることは？　その時の言い方で", "AIに聞かれる質問に近い。ページの割り当てとFAQの元になる"],
              ["正式な名前と表記のゆれ", "正式名称、略称、英字表記、旧社名・旧店名はありますか", "AIや外部の掲載先で別の名前が使われていると、同じ会社だと分かりにくい"],
              ["事実の正本と更新する人", "料金・営業時間・対応エリア・定休日は、どこに元データがあり、変わったときに誰が知らせますか", "公開後に古い事実が残るのを防ぐ。保守の範囲を決める材料にもなる"],
              ["外部の掲載先", "Googleビジネスプロフィール、予約サイト、ポータル、SNS、業界団体の名簿に載っていますか。管理者は誰ですか", "サイトと外部で住所・電話・時間が食い違わないようにそろえる"],
              ["数字と実績の根拠", "「実績◯件」「創業◯年」の数字は、いつ時点で、何を数えたものですか", "原稿に時点と数え方を書ける。根拠のない数字を載せない"],
              ["業種の広告ルール", "医療・士業・不動産など、表示に決まりのある業種ですか", "体験談や比較の書き方に制限がある業種では、原稿の段階で直すほうが早い"],
              ["AIの学習用クローラーの方針", "AIの学習のための収集（GPTBot など）を許可しますか、止めますか", "AI検索への表示とは別の判断。お客様に決めてもらい、記録しておく"],
              ["比べられる相手", "お客様が他にどこと比べて選んでいますか", "比較の質問（◯◯と△△の違い）に答えるページや表を作るかを決める"],
            ],
            caption: "「よく聞かれる質問」は、お客様に一覧を書いてもらうより、電話やメールの問い合わせを一緒に見返すほうが集まりやすくなります。",
          },
        },
        {
          heading: "サイトマップとページの型を決める",
          paragraphs: [
            "集めた質問を、どのページで答えるかに割り当てます。1つのページには1つの話題を置き、料金・アクセス・会社概要のように事実がまとまっているページは、トップページの一部ではなく独立したページにします。AIが「この会社の料金は」と調べたときに、そのことだけを書いたページがあれば、答えに使える範囲がはっきりします。",
          ],
          table: {
            head: ["ページ", "冒頭の1〜2文で答えること", "載せる事実", "主な構造化データ", "くわしいガイド"],
            rows: [
              ["トップ", "何の会社・お店で、どこで、誰のためにあるか", "名前、所在地または対応地域、主なサービス", "Organization または LocalBusiness の詳しい型、WebSite", "―"],
              ["サービス（1つずつ）", "このサービスは何で、誰に向いているか", "内容、対象、所要時間、料金の目安、申し込み方法", "Service（会社とつなぐ）", "―"],
              ["料金", "いくらで、何が含まれ、税込か", "料金表、単位、時点、追加料金の条件", "Offer など（本文と同じ値）", "[料金ページ](/guide/pricing-page-ai-search)"],
              ["アクセス・営業時間", "どこにあり、いつ開いているか", "住所、地図、営業時間、定休日、駐車場", "LocalBusiness", "―"],
              ["会社概要", "どんな会社か", "正式名称、設立、代表者、所在地、許認可", "Organization", "[会社概要ページ](/guide/company-profile-page-ai-search)"],
              ["FAQ", "質問ごとに1〜2文で", "ヒアリングで集めた質問", "FAQPage（ページに見えている質問だけ）", "[FAQページ](/guide/faq-page-ai-search)"],
              ["代表・スタッフ", "誰が担当し、どんな資格・経歴か", "名前、役職、資格、経歴", "Person", "[人物紹介ページ](/guide/person-profile-page-ai-search)"],
            ],
            caption: "質問とページの対応表は、ワイヤーフレームと一緒にお客様に見せると、「この質問の答えはどのページにあるか」を確認でき、原稿の抜けも見つけやすくなります。",
          },
        },
        {
          heading: "原稿依頼シートを「質問→答え→くわしい説明」の形にする",
          paragraphs: [
            "AI検索のための原稿で一番大事なのは、各ページの最初に、質問への答えを短く書くことです。ただ、お客様に「結論を先に書いてください」と頼むだけでは、多くの場合キャッチコピーや挨拶文が返ってきます。依頼シートの欄そのものを、質問と答えの形にしておきます。",
          ],
          code: BRIEF,
          after: [
            "悪い例は「お客様一人ひとりに寄り添った、安心の料金体系です」のように、事実が1つも入っていない書き出しです。良い例は「初回カウンセリングは無料、施術は1回 8,800円（税込）からです（2026年11月時点）」のように、数字・単位・税・時点が1文に入っているものです。デザインのキャッチコピーは別の欄に分けておけば、見た目の自由度は下がりません。",
            "料金表・メニュー・時間割が画像やPDFでしか届かないことはよくあります。原稿の締切までに文字のデータをもらうか、制作会社が文字に起こしてお客様に確認してもらう段取りを、最初のスケジュールに入れておきます。",
          ],
        },
        {
          heading: "構築：テーマとテンプレートで決めること",
          list: [
            "本文の事実を文字で出す。料金表・営業時間を画像にしない。表は表のタグで作る。",
            "タブやアコーディオンに大事な事実を隠しすぎない。Googleは、ブロックされていなければJavaScriptも処理するとし、完全に意味づけされたHTMLは必須ではないとしています（[Google 検索の生成 AI 機能のためのサイトの最適化](" + SRC.optGuide + ")、2026年7月10日）。ほかのAIのクローラーがJavaScriptをどう扱うかの公式の説明は、この記事では確認していません。迷ったら、HTMLにそのまま書かれている状態にしておくのが安全です。",
            "見出しは質問か、質問に対応する言葉にする（「料金」より「料金と追加料金の条件」）。",
            "構造化データの出し手を1つに決める。テーマ（SWELL・Lightning など）、SEOプラグイン、専用のプラグインがそれぞれ会社の情報を出すと、1ページに同じ会社が2つ載ることがある。どれが何を出すかを構築の最初に決めて記録する。",
            "会社の名前・住所・電話・時間は、本文と構造化データで同じ値にする。手で2か所に入れると、どちらかだけ直されて食い違うので、なるべく1か所の設定から両方に出す。",
            `公開前に[リッチリザルト テスト](${SRC.richResults})と[Schema Markup Validator](${SRC.validator})で主なページを確かめる。`,
          ],
        },
        {
          heading: "ステージングと公開日：非公開設定とAIのクローラー",
          paragraphs: [
            `WordPressの「表示設定」にある「検索エンジンがサイトをインデックスしないようにする」は、ステージングでよく使われます。WordPress 5.3以降、この設定をオンにするとページに \`<meta name='robots' content='noindex,nofollow' />\` が出力され、それまでrobots.txtに出していた \`Disallow: /\` は出さなくなりました（[Make WordPress Core、2019年9月2日](${SRC.wp53})）。つまり、この設定はクロールを止めるものではなく、インデックスしないよう頼むものです。画像やPDFなどHTML以外のファイルには、サーバーの設定で X-Robots-Tag ヘッダーを付けるよう同じ記事で案内されています。`,
            "Nurevo AEOは、この設定がオンの間（WordPressのオプション blog_public が 0 の間）、robots.txtにAI検索のクローラーの行を足さず、構造化データも出しません。一方、/llms.txt はプラグインの「llms.txt を出す」の設定だけで決まるので、ステージングでも出ます。ステージングは、この設定だけに頼らず、Basic認証やIP制限で外から見えないようにしておきます。",
            "ステージングのデータベースをそのまま本番に移すと、非公開の設定もそのまま本番に来ます。公開日には、次の表を上から確かめます。",
          ],
          table: {
            head: ["確かめること", "起きやすいこと", "確かめ方"],
            rows: [
              ["非公開設定が外れているか", "ステージングの設定のまま公開し、noindex が全ページに出る", "表示設定のチェック、またはページのソースで robots の meta を見る"],
              ["robots.txt にAI検索のクローラーの行があるか", "非公開の間は足されないため、外し忘れると行がない。サーバーに古い実ファイルの robots.txt が置かれている", "https://ドメイン/robots.txt で OAI-SearchBot・ChatGPT-User・Claude-SearchBot・Claude-User・PerplexityBot・Perplexity-User の扱いを見る"],
              ["サーバー・CDN・WAFで止めていないか", "新しいサーバーのボット対策が初期設定でAIのクローラーを止める", `各社が公開しているUAとIPの範囲で許可する。Perplexityは設定の反映に最大24時間かかることがあるとしている（[Perplexity：クローラー](${SRC.pplxCrawlers})）`],
              ["構造化データが1つで、本文と同じ値か", "テーマとプラグインの両方が会社の情報を出す。ステージングのURLが残る", "リッチリザルトテストと、ソースでステージングのドメインを検索"],
              ["llms.txt に本番のURLが並ぶか", "会社のURLの設定にステージングのURLを手で入れたまま", "https://ドメイン/llms.txt を開く"],
              ["Search Consoleとアクセス解析", "本番のドメインで所有権の確認をしていない", "プロパティを作り、サイトマップを送る"],
            ],
          },
          code: LAUNCH,
        },
        {
          heading: "WordPressでの手順（Nurevo AEOを使う場合）",
          paragraphs: [
            `ここでは、無料のプラグイン[Nurevo AEO](${WP_ORG})を使う場合の手順を書きます。別のプラグインや手作業でも、決めることは同じです。`,
          ],
          list: [
            "ステージングに入れ、初回の設定ウィザードで種類（店舗などの地域のお店・ネットショップ・BtoB／SaaS）を選ぶ。種類によって、AI向けに出す内容（店舗の情報か、商品の一覧か、会社とサービスか）が変わる。",
            "名前・住所・電話・営業時間・説明を入れる。プラグインはSEOプラグインの設定などから空欄だけを埋め、入力した値は上書きしない。ヒアリングで決めた正式名称と、原稿と同じ値を入れる。",
            "サービスを1つずつ入れ、それぞれのページのURLと予約のURLを入れる。",
            "FAQページに「Nurevo FAQ」ブロックを置く。FAQの構造化データは、このブロックかショートコードを置いたページにだけ出る。",
            "お礼ページ・テスト用のページなど、AIに読ませる必要のないページは、ページごとの設定で llms.txt から外す。llms.txt に並ぶページは、最近更新された順に最大30件なので、記事の多いサイトでは特に効く。",
            "SEOプラグインを使う場合は、Yoast SEO・Rank Math・All in One SEO・Slim SEO の構造化データの中に足りない事実が足されるので、会社の情報が2つにならない。SEO SIMPLE PACK と VK All in One Expansion Unit とも併用できる（0.9.1から）。テーマが自前の構造化データを出す場合は、公開前にリッチリザルトテストで確かめる。",
            "学習用クローラー（GPTBot・ClaudeBot・Google-Extended など）は、初期状態ではサイトの robots.txt に任せている。ヒアリングで決めた方針に合わせて、許可か拒否を選ぶ。AI検索のクローラーとは別の設定で、拒否してもAI検索への表示やスコアには影響しない。",
            "本番では、設定 > ツールの書き出し（または wp nurevo export）でステージングの設定を移す。キー・トークン・プラン・接続は書き出されないので、有料プランの場合は本番でつなぎ直す。会社のURLの設定にステージングのURLが入っていないかも確かめる。",
            "公開後に wp nurevo status か管理画面のスコアで、構造化データ・llms.txt・AIのクローラーの出力がオンになっているかを見る。",
          ],
        },
        {
          heading: "見積もりと作業範囲に書くこと",
          paragraphs: [
            "AI検索対策を新規制作に含めるなら、見積もりと作業範囲の書類に、何をするかを行として書いておきます。金額や工数の相場は、確かな出典がないためこの記事では書きません。サイトの規模とページ数で変わるので、自社の作業時間の記録から決めてください。",
          ],
          table: {
            head: ["行", "中身", "含める範囲の例"],
            rows: [
              ["ヒアリング（AIの項目）", "8項目のヒアリングと、質問の一覧づくり", "質問20個まで"],
              ["質問とページの対応表", "質問をページに割り当てた表", "サイトマップと一緒に提出"],
              ["原稿の構成と整え", "原稿依頼シートの作成、届いた原稿の「答え」の書き出しの整え", "お客様の原稿を前提。執筆は別の行"],
              ["構造化データ・llms.txt・robots.txt の設定", "出し手を決め、本文と同じ値で設定", "主な種類のページ"],
              ["公開日の確認", "上の確認表と、確認の結果の記録", "公開日1回"],
              ["公開時の基準の記録", "決めた質問を各AIで聞いた結果の記録", "公開日と1か月後の2回など"],
              ["公開後の保守（任意）", "事実の更新、月次の測定と報告", "[月額サービス](/guide/agency-aeo-monthly-service)として別契約"],
            ],
          },
          after: [
            "契約書や作業範囲の書類には、少なくとも次の4点を入れておくと、公開後の行き違いを防げます。①AIの回答は日や聞き方で変わり、表示や順位を保証しないこと。②学習用クローラーを許可するか止めるかはお客様が決め、その決定を記録すること。③料金・営業時間などの事実の正本はお客様が持ち、変わったときに知らせる人を決めること。④公開後の更新や測定は、保守契約がある場合に行うこと。",
            `お客様にNurevoの有料プランを使ってもらう場合は、[パートナープログラム](${PARTNER})で紹介の登録ができます。`,
          ],
        },
        {
          heading: "公開後の測り方：比べる前の数字がないサイトの場合",
          paragraphs: [
            "新しいサイトには、比べるための過去の数字がありません。そこで、公開日に基準を作ります。ヒアリングで集めた質問のうち、社名を入れない質問（「◯◯市 △△ おすすめ」「□□の料金はいくら」など）を10個ほど選び、ChatGPT・Perplexity・GoogleのAIによる概要で聞き、お客様の名前が出たか、サイトが出典に出たか、事実が正しいかを記録します。AIの回答は日によって変わるので、同じ質問を日を変えて2回以上聞いておきます。",
            "その後は、1か月後・3か月後など決めた時期に同じ質問で比べます。GoogleのAI機能については、Search Consoleの生成AIのパフォーマンスレポートが2026年8月31日からすべてのサイトで使えます（[Search ConsoleでAI機能の表示を見る方法](/guide/search-console-ai-features)）。Nurevoの無料のAIチェック（[/check](/check)）では、AIからの読みやすさを確かめられます。AIでの登場率の継続的な計測は Pro プランの機能で、現在は Perplexity で測っています（ベータ版）。測り方のくわしい手順は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
          ],
        },
        {
          heading: "新規制作のチェックリスト",
          list: [
            "ヒアリングシートに、よく聞かれる質問・事実の正本と更新する人・外部の掲載先・学習用クローラーの方針を入れた。",
            "質問とページの対応表を作り、料金・アクセス・会社概要・FAQを独立したページにした。",
            "原稿依頼シートを「質問→答え→くわしい説明」の形にし、数字・単位・税・時点を入れてもらった。",
            "画像やPDFにしかない料金表・時間を文字にした。",
            "構造化データの出し手を1つに決め、本文と同じ値にした。",
            "ステージングを認証で守った。",
            "公開日に非公開設定を外し、ページの robots の meta を確かめた。",
            "robots.txt・WAFでAI検索のクローラーを止めていないこと、llms.txt に本番のURLが並ぶことを確かめた。",
            "Search Consoleを設定し、サイトマップを送った。",
            "公開日に、社名なしの質問10個の結果を記録した。",
          ],
        },
      ],
      faqs: [
        { q: "新規サイトなら、AI検索対策は公開後に足せばよいのでは？", a: "足すことはできますが、原稿の書き出しやページの分け方は後から変えると書き直しになります。ヒアリングで質問と事実の正本を聞き、原稿を質問と答えの形で依頼するだけでも、手戻りは減ります。" },
        { q: "llms.txt は作るべきですか？", a: "Googleは、Google検索では LLMS.txt を使わないとしています。ほかのAIが使うかどうかは各社で違うため、作る手間が小さければ置いておき、本文と同じ事実を載せる、という扱いで十分です。プラグインで自動で作る方法もあります。" },
        { q: "ステージングで「検索エンジンがサイトをインデックスしないようにする」をオンにしておけば安全ですか？", a: "WordPress 5.3以降、この設定は noindex の meta を出すもので、robots.txt でクロールを止めるものではありません。ステージングはBasic認証やIP制限で守り、公開日にこの設定を外したかを必ず確かめてください。" },
        { q: "お客様が原稿を書けない場合は？", a: "ヒアリングの場で質問に口頭で答えてもらい、制作会社が答えの文にしてお客様に確認してもらう方法があります。事実（数字・時点・条件）はお客様に確かめてもらい、推測で書かないことが大切です。" },
        { q: "構造化データはテーマとSEOプラグインのどちらで出すべきですか？", a: "どちらでも構いませんが、1つに決めることが大切です。両方が会社の情報を出すと、1ページに同じ会社が2つ載ることがあります。構築の最初に、どれが何を出すかを決めて記録してください。" },
        { q: "見積もりにはいくらくらい上乗せすればよいですか？", a: "相場の確かな出典がないため、この記事では金額を書いていません。ヒアリング・対応表・原稿の整え・設定・公開日の確認・基準の記録の行ごとに、自社の作業時間から積み上げてください。" },
        { q: "この手順で作れば、公開後すぐにAIに出ますか？", a: "保証はできません。AIの回答は日や聞き方で変わり、新しいサイトが読まれるまでの期間も公開されていません。この手順は、読まれたときに事実が正しく伝わる状態で公開するためのものです。" },
      ],
      relatedHeading: "あわせて読みたい",
      cta: {
        heading: "公開前と公開日に、AIがサイトをどう読むか確認",
        body: "無料のチェックは登録不要です。URLを入れると、構造化データ・llms.txt・AIのクローラーの扱いを確かめられます。ステージングの確認と公開日の確認に使えます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: PARTNER },
      },
      footnote: "ChatGPT・GPTBot・OAI-SearchBotはOpenAI、PerplexityはPerplexity AI、Claude・ClaudeBotはAnthropic、Google・Search ConsoleはGoogle LLCの商標です。WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、SWELL、Lightningはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Building New Client Sites for AI Search: Agency Guide | Nurevo",
      description: "Build AI search readiness into a new client site from day one: discovery questions to add, page types, a copy request sheet, staging and launch checks, and scope wording.",
      h1: "Building a New Client Site Ready for AI Search: From Discovery to Post-Launch Measurement",
      lead: "To build AI search readiness into a new site from the start: (1) in discovery, ask which questions the client hears most and where the master copy of each fact (prices, hours, service area) lives and who updates it; (2) plan one topic per page; (3) request copy in a question → one-to-two-sentence answer → details format; (4) decide that exactly one of the theme, the SEO plugin or a dedicated plugin outputs structured data; and (5) on launch day, check the staging privacy setting and how AI crawlers are treated. Each of these is cheaper to decide during planning and copywriting than to add after the build.",
      intro: [
        "Written 20 November 2026 (JST). This guide is for agencies, freelance web designers and project leads who plan and build new client sites. If you are rebuilding an existing site and URLs or the domain will change, see [Keeping AI search citations through a site redesign](/guide/site-renewal-ai-search). For auditing a client's current site before a pitch, see [First AEO audit and proposal](/guide/agency-aeo-first-audit-proposal); for post-launch work, see [Offering AI search optimization monthly](/guide/agency-aeo-monthly-service).",
        "AI answers change from day to day and with the wording of the question. These steps help a site launch in a state where AI can read the client's facts correctly; they do not guarantee that it will appear in AI answers.",
      ],
      sections: [
        {
          heading: "What the top-ranking guides leave out",
          paragraphs: [
            "On 20 November 2026 we read four Japanese and seven English pages that rank for queries such as \"build website for AI search\", \"website discovery questionnaire\" and \"AEO checklist new website\" (one more Japanese agency's service pages only returned its home page, so it was not used). In English, the results were mostly agencies describing their own process (Aurum House, ColorWhistle, Xponent21, Orbit Media) and AEO explainers (Avenue Z, Webflow, IMPACT). In Japanese, they were an explainer on AI-ready sites, an agency service page, and two guides to discovery questionnaires.",
            "Almost all agree on leading with the answer, clear headings, structured data and not blocking crawlers. What they rarely cover is how to turn that into steps inside a build project:",
          ],
          table: {
            head: ["What is missing", "What this guide adds"],
            rows: [
              ["Questionnaire guides list goals, audience, design, assets and budget, but nothing to ask for AI search", "Eight discovery questions to add, and why each matters"],
              ["AI search guides say \"lead with the answer\" but not how to brief the client's copywriting", "A copy request sheet, with weak and strong examples"],
              ["None connects the staging site's privacy setting to AI-facing output", "How WordPress's setting works since 5.3, and what to switch off at launch"],
              ["Schema types are listed, but not who outputs them: theme, SEO plugin or another plugin", "A rule to pick exactly one source"],
              ["None says what to put in the quote, scope or contract", "Quote lines and four points for the contract"],
              ["Measurement is \"check AI answers\". A new site has no \"before\" numbers", "Recording a baseline on launch day and comparing the same questions"],
            ],
            caption: "This summarizes common gaps, not the quality of each article. Some top pages quoted figures such as \"x times more AI citations\" without a source or from one company's own data, so we do not use them.",
          },
        },
        {
          heading: "The whole build at a glance",
          paragraphs: [
            "Building for AI search does not add a new phase. It adds a few questions, decisions and checks to the phases you already run. Google says AI features such as AI Overviews have no additional requirements or special optimizations, and need no special structured data or new AI text files ([AI features and your website](" + SRC.aiFeatures + "), last updated 10 December 2025, checked 18 November 2026). The work is mostly ordinary site quality, applied to the accuracy and readability of facts.",
          ],
          table: {
            head: ["Phase", "What to add for AI search", "Deliverable", "Who mainly acts"],
            rows: [
              ["Discovery and requirements", "Ask for common questions, the master copy of facts and who updates them, outside listings, industry advertising rules and the AI training crawler policy", "Questionnaire with AI items", "Agency asks, client answers"],
              ["Sitemap and wireframes", "Map questions to pages; one topic per page; separate pages for facts (pricing, location, about, FAQ)", "Question-to-page map", "Agency"],
              ["Copy and assets", "Brief copy as question → answer → details, with numbers, units, dates and conditions; turn image- or PDF-only facts into text", "Copy request sheet", "Client writes, agency edits"],
              ["Build", "Facts as text; tables as tables; one source of structured data, with the same values as the page", "Templates and settings", "Agency"],
              ["Launch day", "Turn off the privacy setting; check robots.txt, llms.txt, structured data and the WAF; set up Search Console", "Launch checklist", "Agency"],
              ["First 1–3 months", "Ask the chosen questions in AI tools and record results; fix facts that change", "Measurement log, monthly report", "Agency (if there is a care plan)"],
            ],
            caption: "The same Google page asks that structured data match the text visible on the page. That is why copy and structured data should come from the same source data.",
          },
        },
        {
          heading: "Eight questions to add to the discovery questionnaire",
          paragraphs: [
            "The usual questionnaire items (company basics, goals, audience, competitors, design, content, assets, budget and timeline) still apply. Add these eight for AI search. Each is one that, if asked late, means rewriting copy.",
          ],
          table: {
            head: ["Question to add", "How to ask it", "Why it matters"],
            rows: [
              ["Common questions (10–20)", "What do first-time customers ask most on the phone, by email, at the counter or in sales calls? In their words", "Close to what people ask AI; becomes the page map and the FAQ"],
              ["Official name and variants", "Legal name, short name, name in other scripts, former names?", "If AI tools or listings use another name, it is harder to tell it is the same business"],
              ["Master copy of facts and owner", "Where do prices, hours, service area and closing days live, and who tells you when they change?", "Prevents stale facts after launch and defines the care plan scope"],
              ["Outside listings", "Google Business Profile, booking sites, directories, social, trade associations? Who manages each?", "Keeps address, phone and hours consistent between the site and elsewhere"],
              ["Evidence for numbers", "For \"x projects\" or \"since year y\": as of when, counting what?", "Lets copy state the date and basis; avoids unsupported claims"],
              ["Industry advertising rules", "Is this a regulated field such as healthcare, legal or real estate?", "Testimonials and comparisons may be restricted; easier to fix at the copy stage"],
              ["AI training crawler policy", "Allow or block collection for AI training (GPTBot and others)?", "A separate decision from AI search; the client decides and you record it"],
              ["Who they are compared with", "Who else do customers consider?", "Decides whether to build pages or tables for comparison questions"],
            ],
            caption: "Common questions are easier to collect by reviewing real phone and email enquiries together than by asking the client to write a list.",
          },
        },
        {
          heading: "Plan the sitemap and page types",
          paragraphs: [
            "Assign each collected question to the page that answers it. Keep one topic per page, and give fact-heavy content such as pricing, location and company details its own page rather than a section of the home page. When an AI looks up \"what does this company charge\", a page about only that makes the usable answer clear.",
          ],
          table: {
            head: ["Page", "First 1–2 sentences answer", "Facts to include", "Main structured data", "Detailed guide"],
            rows: [
              ["Home", "What the business is, where, and for whom", "Name, location or service area, main services", "Organization or a specific LocalBusiness type, WebSite", "—"],
              ["Each service", "What it is and who it suits", "Scope, audience, duration, price guide, how to book", "Service (linked to the business)", "—"],
              ["Pricing", "How much, what is included, tax", "Price table, units, date, extra charges", "Offer and similar (same values as the page)", "[Pricing pages](/guide/pricing-page-ai-search)"],
              ["Location and hours", "Where it is and when it is open", "Address, map, hours, closing days, parking", "LocalBusiness", "—"],
              ["About", "What kind of company it is", "Legal name, founding, leader, address, licences", "Organization", "[Company profile pages](/guide/company-profile-page-ai-search)"],
              ["FAQ", "One to two sentences per question", "Questions collected in discovery", "FAQPage (only for questions shown on the page)", "[FAQ pages](/guide/faq-page-ai-search)"],
              ["Team", "Who does the work and their credentials", "Name, role, qualifications, background", "Person", "[Profile pages](/guide/person-profile-page-ai-search)"],
            ],
            caption: "Showing the question-to-page map with the wireframes lets the client confirm where each answer lives and makes missing copy easier to spot.",
          },
        },
        {
          heading: "Make the copy request sheet question → answer → details",
          paragraphs: [
            "The most important thing in copy for AI search is a short answer to the page's question at the very top. But asking a client to \"lead with the answer\" usually returns a tagline or a welcome message. Build the question-and-answer shape into the fields of the request sheet itself.",
          ],
          code: BRIEF_EN,
          after: [
            "A weak opening is \"Pricing designed around you, for peace of mind\": it contains no facts. A strong one is \"The first consultation is free; treatments start at $65 per session (as of November 2026)\": number, unit and date in one sentence. Keep a separate field for the design's tagline so the visual direction is not constrained.",
            "Price lists, menus and timetables often arrive only as images or PDFs. Put a step in the first schedule to get them as text by the copy deadline, or to transcribe them and have the client confirm.",
          ],
        },
        {
          heading: "Build: decisions for the theme and templates",
          list: [
            "Output facts as text. Do not put price lists or hours in images. Build tables with table markup.",
            "Do not hide key facts too deep in tabs or accordions. Google says it processes JavaScript unless it is blocked, and that perfectly semantic HTML is not required ([Optimizing your website for generative AI features on Google Search](" + SRC.optGuide + "), 10 July 2026). We have not checked official documentation on how other AI crawlers handle JavaScript, so when in doubt, keep the facts in the HTML itself.",
            "Write headings as questions or the words that match them (\"Prices and when extra charges apply\" rather than \"Prices\").",
            "Pick one source of structured data. If the theme, the SEO plugin and another plugin each output the business, a page can describe the same business twice. Decide who outputs what at the start of the build and record it.",
            "Use the same name, address, phone and hours in the copy and in structured data. Typing them into two places means one gets updated and the other does not, so output both from one setting where possible.",
            `Before launch, test the main pages with the [Rich Results Test](${SRC.richResults}) and the [Schema Markup Validator](${SRC.validator}).`,
          ],
        },
        {
          heading: "Staging and launch day: the privacy setting and AI crawlers",
          paragraphs: [
            `WordPress's \"Discourage search engines from indexing this site\" (Settings > Reading) is often used on staging. Since WordPress 5.3, turning it on outputs \`<meta name='robots' content='noindex,nofollow' />\` on pages, and the \`Disallow: /\` line that robots.txt used to carry is no longer added ([Make WordPress Core, 2 September 2019](${SRC.wp53})). In other words, the setting asks not to index; it does not block crawling. The same post recommends an X-Robots-Tag header, set in the server configuration, for non-HTML files such as images and PDFs.`,
            "While this setting is on (the WordPress option blog_public is 0), Nurevo AEO adds no AI search crawler groups to robots.txt and outputs no structured data. /llms.txt, however, depends only on the plugin's \"Serve /llms.txt\" setting, so it is served on staging too. Do not rely on this setting alone: protect staging with HTTP authentication or IP restrictions.",
            "Copying the staging database to production carries the privacy setting with it. On launch day, work down this table:",
          ],
          table: {
            head: ["Check", "What tends to go wrong", "How to check"],
            rows: [
              ["The privacy setting is off", "The site launches with staging settings and noindex on every page", "Settings > Reading, or the robots meta tag in the page source"],
              ["robots.txt has the AI search crawler groups", "They are not added while the site is private, so they are missing if the setting is left on; or an old physical robots.txt sits on the server", "Open https://domain/robots.txt and look at OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User"],
              ["The server, CDN or WAF does not block them", "The new host's bot protection blocks AI crawlers by default", `Allow by each company's published user agents and IP ranges. Perplexity notes changes can take up to 24 hours ([Perplexity crawlers](${SRC.pplxCrawlers}))`],
              ["One set of structured data, matching the page", "Theme and plugin both output the business; staging URLs remain", "Rich Results Test, and search the source for the staging domain"],
              ["llms.txt lists production URLs", "A staging URL was typed into the organization URL setting", "Open https://domain/llms.txt"],
              ["Search Console and analytics", "Ownership not verified on the production domain", "Create the property and submit the sitemap"],
            ],
          },
          code: LAUNCH_EN,
        },
        {
          heading: "Steps in WordPress (with Nurevo AEO)",
          paragraphs: [
            `These steps use the free [Nurevo AEO](${WP_ORG}) plugin. With another plugin or by hand, the decisions are the same.`,
          ],
          list: [
            "Install it on staging and choose the site type in the setup wizard (local business, online shop, or B2B / SaaS). The type decides what is published for AI: business details, a product catalogue, or the organization and its services.",
            "Enter the name, address, phone, hours and description. The plugin fills only blank fields from sources such as SEO plugin settings and never overwrites typed values. Use the official name from discovery and the same values as the copy.",
            "Add each service with its page URL and booking URL.",
            "Place the \"Nurevo FAQ\" block on the FAQ page. FAQ structured data is output only on pages where the block or shortcode appears.",
            "Use per-page settings to leave thank-you pages, test pages and anything AI need not read out of llms.txt. llms.txt lists at most 30 pages, most recently modified first, so this matters most on sites with many posts.",
            "With Yoast SEO, Rank Math, All in One SEO or Slim SEO, missing facts are added inside their structured data, so the business is not described twice. SEO SIMPLE PACK and VK All in One Expansion Unit are also supported (since 0.9.1). If the theme outputs its own structured data, check with the Rich Results Test before launch.",
            "Training crawlers (GPTBot, ClaudeBot, Google-Extended and others) are left to the site's robots.txt by default. Allow or block them according to the policy agreed in discovery. This is separate from AI search crawlers; blocking them does not affect AI search or the score.",
            "On production, move the staging settings with Settings > Tools export (or wp nurevo export). Keys, tokens, the plan and the connection are not exported, so reconnect paid plans on production. Check that no staging URL is left in the organization URL setting.",
            "After launch, use wp nurevo status or the score in the dashboard to confirm structured data, llms.txt and AI crawler rules are switched on.",
          ],
        },
        {
          heading: "What to write in the quote and scope",
          paragraphs: [
            "If AI search readiness is part of the build, list it as lines in the quote and scope document. We do not give price or hour ranges, because we found no reliable source; they depend on site size and page count, so set them from your own time records.",
          ],
          table: {
            head: ["Line", "What it covers", "Example of scope"],
            rows: [
              ["Discovery (AI items)", "The eight questions and the list of common questions", "Up to 20 questions"],
              ["Question-to-page map", "Each question assigned to a page", "Delivered with the sitemap"],
              ["Copy structure and editing", "The request sheet, and editing the opening answers of the copy received", "Assumes client-written copy; copywriting is a separate line"],
              ["Structured data, llms.txt, robots.txt", "Pick the source and set values matching the copy", "Main page types"],
              ["Launch checks", "The table above and a record of the results", "Once, on launch day"],
              ["Launch baseline", "Results of the chosen questions in each AI tool", "For example, launch day and one month later"],
              ["Ongoing care (optional)", "Updating facts, monthly measurement and reporting", "Separate [monthly service](/guide/agency-aeo-monthly-service) contract"],
            ],
          },
          after: [
            "Put at least these four points in the contract or scope to avoid misunderstandings after launch: (1) AI answers vary by day and wording, and appearance or ranking is not guaranteed; (2) the client decides whether to allow or block AI training crawlers, and the decision is recorded; (3) the client holds the master copy of facts such as prices and hours, and names who reports changes; (4) post-launch updates and measurement happen only under a care plan.",
            `If your clients use a paid Nurevo plan, you can register referrals through the [partner program](${PARTNER}).`,
          ],
        },
        {
          heading: "Measuring after launch when there is no \"before\"",
          paragraphs: [
            "A new site has no past numbers to compare with, so create a baseline on launch day. From the discovery questions, pick about ten that do not include the business name (\"best [service] in [city]\", \"how much does [service] cost\"), ask them in ChatGPT, Perplexity and Google's AI Overviews, and record whether the client is named, whether the site is cited, and whether the facts are right. AI answers change from day to day, so ask each question on at least two different days.",
            "After that, compare the same questions at set points, such as one and three months later. For Google's AI features, Search Console's generative AI performance report has been available to all sites since 31 August 2026 ([Search Console and AI features](/guide/search-console-ai-features)). Nurevo's free check at [/check](/check) shows how readable the site is to AI. Ongoing AI visibility measurement is a Pro feature (beta), currently measured on Perplexity. For the full method, see [How to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "New build checklist",
          list: [
            "The questionnaire covers common questions, the master copy of facts and its owner, outside listings and the AI training crawler policy.",
            "A question-to-page map exists, with separate pages for pricing, location, about and FAQ.",
            "The copy request sheet uses question → answer → details, with numbers, units, tax and dates.",
            "Price lists and hours that existed only as images or PDFs are now text.",
            "Exactly one source outputs structured data, with the same values as the copy.",
            "Staging is protected by authentication.",
            "On launch day the privacy setting is off and the robots meta tag is checked.",
            "robots.txt and the WAF do not block AI search crawlers, and llms.txt lists production URLs.",
            "Search Console is set up and the sitemap submitted.",
            "Results for ten questions without the business name are recorded on launch day.",
          ],
        },
      ],
      faqs: [
        { q: "For a new site, can't we just add AI search work after launch?", a: "You can, but changing how copy opens or how pages are divided later means rewriting. Asking for common questions and the master copy of facts in discovery, and briefing copy as questions and answers, already cuts most of the rework." },
        { q: "Should we create llms.txt?", a: "Google says Google Search does not use LLMS.txt. Whether other AI tools use it varies by company, so if it is cheap to produce, publish one with the same facts as the pages. A plugin can generate it automatically." },
        { q: "Is staging safe if \"Discourage search engines\" is on?", a: "Since WordPress 5.3 the setting outputs a noindex meta tag; it does not block crawling in robots.txt. Protect staging with HTTP authentication or IP restrictions, and always confirm the setting is off on launch day." },
        { q: "What if the client cannot write the copy?", a: "Ask the questions in a meeting, write the answers up yourself and have the client confirm them. The client must confirm the facts (numbers, dates, conditions); do not fill them in by guesswork." },
        { q: "Should the theme or the SEO plugin output structured data?", a: "Either works, but pick one. If both output the business, a page can describe it twice. Decide who outputs what at the start of the build and record it." },
        { q: "How much should we add to the quote?", a: "We do not give amounts because we found no reliable source for market rates. Build it up line by line from your own time records: discovery, page map, copy editing, setup, launch checks and the baseline." },
        { q: "If we follow these steps, will the site appear in AI answers right after launch?", a: "That cannot be guaranteed. AI answers vary by day and wording, and how long it takes for a new site to be read is not published. These steps make sure that when the site is read, its facts come across correctly." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check how AI reads the site on staging and on launch day",
        body: "The free check needs no sign-up: enter a URL to see the state of its structured data, llms.txt and AI crawler access. Use it for the staging review and the launch-day check.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "ChatGPT, GPTBot and OAI-SearchBot are trademarks of OpenAI, Perplexity of Perplexity AI, Claude and ClaudeBot of Anthropic, and Google and Search Console of Google LLC. WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit, SWELL and Lightning are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
