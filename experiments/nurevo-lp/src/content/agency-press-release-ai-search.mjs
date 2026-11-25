// Content page (agencies): rewriting clients' press releases so AI search and
// journalists can read and cite them, and selling it as a monthly menu.
// Separate from media-coverage-page-ai-search (the page that lists
// third-party coverage), agency-ai-search-manipulation-risks (refusing
// manipulation) and agency-aeo-monthly-service (the overall monthly plan):
// this page is about the release text itself, the original on the client's
// own site, link rules and measurement.
//
// Written 2026-11-25 14時 (JST).
//
// Outside facts and where they were read (2026-11-25):
// - Optyino.ai (Wallabee) release on PR TIMES, 2026-07-11: AI answers
//   collected 2026-04-21 to 07-08, 120 prompts (finance, housing,
//   appliances, B2B services), 81,895 answers, 704,963 cited URLs after
//   de-duplication; 15,512 press release URLs = 2.20%; 12,322 answers
//   (15.05%) cited at least one; PR TIMES 9,381 of 15,512 (60.5%); top 5
//   domains 69.4%; links inside the answer text 0.63% (518). Per model
//   (answer rate): ChatGPT GPT-5 mini 42.84% (small sample, 1,125),
//   GPT-5.2 27.33%, Perplexity 21.45%, AI Mode 20.68%, AI Overview 12.81%,
//   Claude 6.00%, Copilot 2.90%. Limits: automatic classification, API
//   answers, observational, figures change with model updates.
// - Muck Rack "What is AI Reading?" December 2025 (read in the 2026-11-25
//   8時 run): press releases rose from 1.2% to about 6% of citations.
// - Meltwater blog 2026-06-26 (updated 09-29), its own GenAI Lens data:
//   8M+ citations across eight LLMs; press releases 0.2% in May 2026 (0.4%
//   in April). Vendor data, method not published in detail.
// - Google spam policies (ja, last updated 2026-11-24 UTC): link spam
//   includes paid articles with optimized anchor text links in articles,
//   guest posts or press releases distributed on other sites; nofollow or
//   sponsored on the <a> tag is not a violation; scaled content abuse is
//   generating many pages mainly to manipulate rankings. The press release
//   example was added in 2013 (Search Engine Land).
// - Top articles read (structure only): uravation (2026-07-18, 09-05
//   updated), 汐留PR塾 3 posts (2026-02/03, 04-21 updated), 共同通信PRワイヤー
//   LLMO page (spot ¥78,000 / release, 5 per year ¥186,000, tax excluded),
//   Web担 PR TIMES items (PRIZMA 2025-12-10, IDEATECH 2026-02-26);
//   Business Wire (2026-03-12), PR Newswire ME, Notified (2026-05-12),
//   PR.co (2025-11-06), Meltwater (2026-09-29), Superprompt (2026-01-23),
//   Matter (2025-12-16), Medianet (2025-10-22).
// Not stated: any AI company's statement on how it weights press releases;
// whether schema on a release page affects AI answers; how long a release
// takes to reach AI answers; PR TIMES prices and terms (not read).
//
// Nurevo facts: plugin source — on single posts without an SEO plugin,
// BlogPosting with headline, description (the excerpt, or the first 40
// words), datePublished, dateModified, author, image and publisher pointing
// at the business node; with an SEO plugin, WebSite/WebPage/Article stay as
// that plugin publishes them (readme). llms.txt "## Pages" lists the 30
// most recently modified published pages and posts; filter
// webmcp_canary_llms_txt_lines; per-page "leave out of llms.txt". 0.9.1
// coexists with SEO SIMPLE PACK and VK All in One Expansion Unit. Free AI
// check monthly with three Perplexity questions; Pro (from ¥14,800 / USD
// 99) on Perplexity, ChatGPT once configured.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  optyino: "https://prtimes.jp/main/html/rd/p/000000018.000124655.html",
  muck2025: "https://media.muckrack.com/static/reports/2025/MuckRack-GenerativePulse2025-1.pdf",
  meltwater: "https://www.meltwater.com/en/blog/press-release-distribution-effect-ai-search",
  spamJa: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja",
  spamEn: "https://developers.google.com/search/docs/essentials/spam-policies",
  sel2013: "https://searchengineland.com/google-adds-large-scale-guest-posting-advertorials-optimized-anchor-text-to-list-of-link-schemes-168082",
  prwire: "https://kyodonewsprwire.jp/corp/llmo",
};

const TEMPLATE = `【タイトル】（社名）、（何を）（いつから）（どこで）開始　※数字があれば入れる
【要約（3行）】
・何が新しいか（1文）
・誰の役に立つか（1文）
・数字・期間・場所（1文）
【リード】（日付）、（正式な社名）（本社：市区町村、代表者：氏名）は、……
【本文】見出しごとに1つの事実。数字には「（2026年10月末時点、自社集計）」のように時点と数え方
【よくある質問】記者と読者が聞きそうな質問を3〜5個、答えは2〜3文
【コメント】担当者の名前・役職と、本人の言葉（言い切れる事実だけ）
【会社概要】正式名・所在地・設立・事業内容・URL（自社サイトの会社概要と同じ表記）
【原本】自社サイトのこのリリースのURL／お問い合わせ先`;

const TEMPLATE_EN = `[Headline] (Company) launches (what) in (where), from (date) — add a number if there is one
[Summary, three lines]
- What is new (one sentence)
- Who it helps (one sentence)
- Numbers, dates, place (one sentence)
[Lead] (CITY, date) — (Legal company name), based in (city), ...
[Body] One fact per subheading. Each number with its date and how it was counted, e.g. "(as of 31 October 2026, internal count)"
[FAQ] Three to five questions a journalist or reader would ask; two or three sentences each
[Quote] Named person and title, saying only what they can stand behind
[About] Legal name, address, founded, what the company does, URL (same wording as the About page)
[Original] URL of this release on the company's own site / media contact`;

const FILTER = `// llms.txt に「プレスリリース一覧」の行を常に載せる
add_filter('webmcp_canary_llms_txt_lines', function (array $lines) {
    $lines[] = '## プレスリリース';
    $lines[] = '';
    $lines[] = '- [プレスリリース一覧](https://example.co.jp/news/press/): 当社の発表の原本（日付・訂正の履歴つき）';
    $lines[] = '';
    return $lines;
});`;

const FILTER_EN = FILTER
  .replace("// llms.txt に「プレスリリース一覧」の行を常に載せる", "// Always list the press release index in llms.txt")
  .replace("## プレスリリース", "## Press releases")
  .replace("[プレスリリース一覧](https://example.co.jp/news/press/): 当社の発表の原本（日付・訂正の履歴つき）", "[Press releases](https://example.com/news/press/): the originals of our announcements, with dates and corrections");

export default {
  slug: "agency-press-release-ai-search",
  targetQueries: [
    "press release AI search citations",
    "write press release for ChatGPT Perplexity",
    "agency press release service AEO",
    "プレスリリース AI検索 引用",
    "プレスリリース LLMO 書き方",
    "プレスリリース 代行 制作会社 AI対策",
  ],
  related: ["media-coverage-page-ai-search", "agency-aeo-monthly-service", "agency-ai-search-manipulation-risks", "measure-ai-visibility", "llms-txt"],
  locales: {
    ja: {
      title: "プレスリリースをAI検索向けに整える：制作会社の代行メニュー | Nurevo",
      description: "AIの回答の約15%がプレスリリースを出典にしたという調査があります。引用されやすい本文の型、Googleのリンクの決まり、自社サイトに原本を置くWordPressの手順、制作会社の月額メニューの作り方をまとめました。",
      h1: "プレスリリースをAI検索に読まれる形に整える：本文の型・原本の置き方・制作会社の代行メニュー",
      lead: "AIはプレスリリースを出典に使います。8万件余りのAIの回答を調べた調査では、回答の15.05%が少なくとも1本のリリースを出典に挙げ、その6割は配信サービスのページでした。引用されやすくするには、冒頭の3行に「誰が・何を・いつ・数字」を書き、数字には時点と数え方を付け、同じ内容の原本をお客様の自社サイトに置きます。リリース内のリンクを検索順位のために作り込むのはGoogleのスパムの決まりに触れるため、やりません。",
      intro: [
        "作成日：2026年11月25日（日本時間）。調査の数字は Optyino.ai（株式会社Wallabee）の2026年7月の発表、Muck Rack・Meltwater の公開資料、リンクの決まりは Google のスパムに関するポリシー（2026年11月24日更新）を同日に読んで確認しました。",
        "この記事は、お客様のプレスリリースの作成や配信を手伝っている制作会社・代理店向けです。リリースを整えても、AIの回答に会社が必ず出るわけではありません。AIの回答は日々変わり、出典の選び方も公表されていません。ここでは、正しい事実がAIと記者に伝わる形にする手順と、それを月額の作業として説明する方法を書きます。",
      ],
      sections: [
        {
          heading: "AIはプレスリリースをどれくらい出典にしているか",
          paragraphs: [
            "調査によって数え方が違い、数字は大きくずれます。「回答のうちリリースを1本でも出典にした割合」と「出典のURL全体に占めるリリースの割合」は別の数字なので、混ぜないことが大切です。",
          ],
          table: {
            head: ["調査", "対象", "わかったこと"],
            rows: [
              ["Optyino.ai（2026-07-11発表）", "2026年4月21日〜7月8日、120の質問（金融・住宅・家電・BtoBサービス）、81,895件の回答", "回答の15.05%がリリースを1本以上出典にした。出典のURL全体ではリリースは2.20%。リリースのURLの60.5%がPR TIMES、上位5つのサイトで69.4%"],
              ["同上（AIごと、回答に占める割合）", "APIで集めた回答", "ChatGPT（GPT-5 mini）42.84%（件数が少ない）、ChatGPT（GPT-5.2）27.33%、Perplexity 21.45%、GoogleのAIモード 20.68%、AIによる概要 12.81%、Claude 6.00%、Copilot 2.90%"],
              ["Muck Rack（2025年12月）", "100万件超のリンク、2025年7〜12月", "出典に占めるプレスリリースが1.2%から約6%に増えた"],
              ["Meltwater（2026-06-26、09-29更新）", "8つのAI、800万件超の出典（自社ツールのデータ）", "2026年5月はプレスリリースが出典の0.2%（4月は0.4%）"],
            ],
          },
          after: [
            `出典：[Optyino.ai の発表（PR TIMES）](${SRC.optyino})、[Muck Rack 2025年12月](${SRC.muck2025})、[Meltwater](${SRC.meltwater})。いずれも関連する製品を売る会社の調査です。Optyino.ai の調査は API で集めた回答で、分類は自動、質問は4つの分野に偏っており、モデルの更新で数字が変わると発表自体に書かれています。Meltwater の数え方の詳細は公開されていません。`,
            "3つから言えるのは、①AIはリリースを出典に使うことがあり、②その割合は質問の分野とAIによって大きく違い、③出典のURL全体の中では小さな割合にとどまる、ということまでです。「リリースを出せばAIに出る」とは言えません。",
          ],
        },
        {
          heading: "引用されるのは、どのURLか",
          paragraphs: [
            "Optyino.ai の調査では、出典になったリリースのURLの60.5%がPR TIMESのページでした。AIが出典に挙げるのは、多くの場合お客様のサイトではなく配信サービスのページです。また、回答の本文の中にリンクが張られていたのは0.63%で、ほとんどは回答の下の出典の欄に並んでいました。",
            "ここから、制作会社の作業として次の2つが大切になります。",
          ],
          list: [
            "配信先のページだけで事実がわかるように書く：AIが読むのは配信先の1ページです。会社の正式名・所在地・日付・数字を、リリースの中で完結させます。",
            "お客様のサイトに原本を置く：配信先は後から直せないことがあります。訂正や価格の変更を書き足せる原本を自社サイトに置き、リリースの末尾からリンクします。AIや記者が「今の正しい事実」を確かめる先になります。",
          ],
        },
        {
          heading: "AIと記者の両方が読める本文の型",
          paragraphs: [
            "上位の記事が勧める書き方は、ほぼ「逆三角形（大事なことを先に）」と「質問に答える見出し」にまとまります。それを1本のリリースの型にしたのが下の例です。お客様から材料を集めるときの聞き取りの表にも使えます。",
          ],
          code: TEMPLATE,
          after: [
            "会社概要の表記は、お客様のサイトの会社概要・Googleビジネスプロフィールと1文字までそろえます。社名や所在地の書き方がばらばらだと、AIが別の会社として扱うおそれがあります。会社概要ページの整え方は[会社概要ページのAI検索対策](/guide/company-profile-page-ai-search)にあります。",
          ],
        },
        {
          heading: "書き換えの例",
          table: {
            head: ["よくある書き方", "書き換え", "理由"],
            rows: [
              ["業界初の画期的なサービスを開始", "（社名）、（市区町村）で（サービス名）を12月1日から開始。初年度の目標は50社", "確かめられない言葉より、日付・場所・数字のほうが引用されやすく、誤解も生まない"],
              ["多くのお客様にご好評いただいています", "2026年10月末時点で導入は128社（自社集計）", "数字に時点と数え方を付けると、AIも記者も裏付けとして扱える"],
              ["詳しくはWebで", "料金：月額3万円（税別）から。対象：従業員50人以下の会社", "AIは配信先のページだけを読むことが多い。リンク先に頼らない"],
              ["弊社／当社", "初出で正式な社名、以降は略称を1つに決める", "社名の揺れは別の会社に見える原因になる"],
              ["調査の結果、7割が満足", "2026年10月1〜14日、インターネット調査、全国の20〜60代500人。「満足」「やや満足」の合計72.4%", "調査の方法がないと、数字だけが切り取られて広まる"],
            ],
          },
        },
        {
          heading: "調査リリースは「方法」を本文に書く",
          paragraphs: [
            "調査の数字はAIの回答に引用されやすい材料ですが、方法が書かれていない数字は、引用されても誤って広まります。期間・方法・対象・人数・設問・集計の仕方を本文に書きます。",
            "Optyino.ai の発表自体がよい例です。期間、質問の数と分野、回答の件数に加えて、「分類は自動」「APIの回答で実際の画面と違うことがある」「モデルの更新で変わる」という限界まで書かれています。お客様の調査でも、限界を書くことは信頼を下げるのではなく、正しく引用されるための材料になります。",
          ],
        },
        {
          heading: "やってはいけないこと：リンクの作り込みと量産",
          list: [
            `リリースのリンクを検索順位のために作り込まない：Googleのスパムに関するポリシーは、リンクスパムの例として、他のサイトで配布される記事・ゲスト投稿・プレスリリース内の作為的なアンカーテキストのリンクを挙げています（[Google：スパムに関するポリシー](${SRC.spamJa})）。この例は2013年に加わりました（[Search Engine Land](${SRC.sel2013})）。リンクは「会社のサイト」「このリリースの原本」のように素直に書きます。`,
            "有料の配信や記事広告のリンクには rel=\"nofollow\" または rel=\"sponsored\" が付いていれば、Googleのポリシー違反にはならないとされています。配信サービスがどう扱っているかを確かめておきます。",
            "言い回しを変えた同じリリースを量産しない：Googleは、検索順位の操作を主な目的に大量のページを作ることを「大量生成されたコンテンツの不正使用」としています。ニュースのない月にリリースを出すより、事実が変わったときに1本出すほうが、お客様の信用を守れます。",
            "確かめられない最上級を使わない：「No.1」「業界初」は根拠を本文に書けるときだけにします。広告の表示の決まり（景品表示法など）にも関わります。",
            "AIに読ませるためだけの文章を足さない：見えない文字や、本文と関係のないキーワードの羅列は、読者にも記者にも害になります。",
          ],
          after: [
            "お客様から「AIに出るリリースを大量に」と頼まれたときの判断と断り方は[AI検索の不正な手法を頼まれたら](/guide/agency-ai-search-manipulation-risks)にまとめています。",
          ],
        },
        {
          heading: "WordPressで、お客様のサイトに原本を置く手順",
          list: [
            "投稿に「プレスリリース」のカテゴリを作り、一覧のURLを /news/press/ のような短い英字にします。配信した文章と同じ内容を、配信日と同じ日に公開します。",
            "抜粋（要約）の欄に、型の「要約（3行）」をそのまま入れます。Nurevo AEO（無料のWordPressプラグイン）は、SEOプラグインがないサイトでは、投稿の構造化データ（BlogPosting）の説明に抜粋を使い、抜粋がなければ本文の冒頭を使います。見出し・公開日・更新日・著者・アイキャッチ画像も入り、発行元は会社の情報を指します。",
            "Yoast SEO・Rank Math・All in One SEO・Slim SEO が有効なサイトでは、記事の構造化データはそれらのプラグインのものがそのまま使われます。0.9.1 からは SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても重複しません。",
            "訂正や価格の変更があれば、本文を書き換えたうえで、冒頭に「2026年12月3日 訂正：料金を〇〇に改めました」と日付つきで追記します。配信先のページにも訂正を依頼し、両方の表記をそろえます。",
            "Nurevo AEO の llms.txt は、最近更新した公開済みのページと投稿を30件まで並べます。リリースが多いサイトでは古いものが外れるため、一覧のページを常に載せたい場合はフィルター webmcp_canary_llms_txt_lines で行を足します（下の例）。載せたくない投稿は、投稿ごとの設定で llms.txt から外せます。",
            `入れたら、/llms.txt と投稿のソース（application/ld+json）で、抜粋と日付が本文と同じになっているかを確かめます。[WordPress.orgで入手](${WP_ORG})`,
          ],
          code: FILTER,
        },
        {
          heading: "制作会社の代行メニューの作り方",
          paragraphs: [
            "リリースの代行を「1本いくら」の作業だけで終わらせず、AIと記者に読まれる形に整える作業を月額の保守に組み込むと、お客様に成果の確かめ方まで説明できます。料金は会社ごとに決めるものなので、ここでは作業の分け方だけを示します。",
          ],
          table: {
            head: ["作業", "頻度", "成果物", "確かめること"],
            rows: [
              ["材料の聞き取り", "リリースごと", "型に沿った聞き取りの表", "数字に時点と数え方があるか"],
              ["本文の作成・書き換え", "リリースごと", "配信用の本文と要約3行", "社名・所在地が会社概要と同じか"],
              ["原本の公開", "リリースごと", "自社サイトの投稿（抜粋・日付つき）", "配信先から原本にリンクしたか"],
              ["訂正の管理", "随時", "訂正の追記と配信先への依頼", "両方の表記がそろったか"],
              ["AIの回答の記録", "月1回", "決めた質問の答えと出典のURLの記録", "出典が配信先か原本か、内容が正しいか"],
            ],
          },
          after: [
            `配信サービスの料金は別にかかります。たとえば共同通信PRワイヤーは、公式ページでスポット1本78,000円、年5本186,000円（いずれも税別）と案内しています（[共同通信PRワイヤー](${SRC.prwire})、2026年11月25日に確認）。お客様の見積もりでは、配信費と作業費を分けて書きます。`,
            "AI検索の整備全体を月額の保守にする方法は[制作会社がAI対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)、第三者の記事を一覧にする掲載実績のページは[メディア掲載ページの作り方](/guide/media-coverage-page-ai-search)にあります。パートナーの条件は[パートナーのページ](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
        {
          heading: "確かめ方",
          list: [
            "リリースのテーマに合う質問を3〜5個決めます（例：「（地域）で（サービス）を始めた会社は？」「（社名）の（サービス名）の料金は？」）。配信の前の日と、2〜4週間後に同じ質問をChatGPT・Perplexity・GoogleのAIモードに聞きます。",
            "答えに社名が出たか、内容が正しいか、出典が配信先・原本・第三者の記事のどれかを、日付と一緒に表に記録します。",
            "内容が古い・違う場合は、原本の訂正と配信先への依頼を先にします。AIの答えの直し方は[AIでの登場率の測り方](/guide/measure-ai-visibility)の記録の方法と合わせて進めます。",
            "Googleアナリティクス4で原本の投稿へのAIのサービスからの流入を、Search Consoleで社名やサービス名の検索の変化を見ます。",
            "Nurevo AEO の無料のAIチェックは、接続したサイトに月1回、業種と地域から作った3つの質問を Perplexity に聞きます。継続して測る Pro（月14,800円〜）も現在は Perplexity で測っています（ChatGPTは設定され次第）。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "冒頭の3行に、誰が・何を・いつ・数字を書いた",
            "数字に時点と数え方を付けた",
            "調査リリースに期間・方法・対象・人数・限界を書いた",
            "会社概要の表記をお客様のサイトの会社概要と同じにした",
            "「業界初」「No.1」は根拠を本文に書けるときだけ使った",
            "リンクは作り込まず、会社のサイトと原本を素直に示した",
            "同じ内容を言い回しだけ変えて何本も出していない",
            "お客様のサイトに原本を公開し、抜粋に要約3行を入れた",
            "訂正は日付つきで追記し、配信先にも依頼した",
            "決めた質問の答えと出典を、配信前と2〜4週間後に記録した",
          ],
        },
      ],
      faqs: [
        { q: "プレスリリースを配信すれば、AIに会社が出ますか？", a: "必ずとは言えません。8万件余りの回答の調査では、リリースを出典にした回答は15.05%で、AIや質問の分野によって大きく違いました。正しい事実が伝わる形に整えることが、できる準備です。" },
        { q: "AIが出典にするのは配信サービスのページですか、自社サイトですか？", a: "調査ではリリースのURLの60.5%がPR TIMESでした。配信先のページだけで事実がわかるように書き、訂正できる原本を自社サイトに置いて、両方の表記をそろえます。" },
        { q: "リリースにリンクをたくさん入れたほうがいいですか？", a: "いいえ。他のサイトで配布されるリリース内の作為的なアンカーテキストのリンクを、Googleはリンクスパムの例に挙げています。会社のサイトと原本へのリンクを素直に入れるだけで十分です。" },
        { q: "よくある質問（Q&A）をリリースに入れる意味はありますか？", a: "記者と読者が聞きそうな質問に2〜3文で答えておくと、AIが答えの一部として使える形になります。ただし効果を示した公式の説明はなく、中身が事実であることが前提です。" },
        { q: "自社サイトに同じ文章を載せると、重複になりませんか？", a: "自社の発表の原本を自社サイトに置くことは、検索順位の操作を目的とした量産とは違います。言い回しだけを変えた同じリリースを何本も出すことは避けてください。" },
        { q: "構造化データは必要ですか？", a: "必須ではありません。WordPressの投稿として公開すれば、Nurevo AEO またはSEOプラグインが記事の構造化データを出します。AIがリリースの構造化データを使うと公表している会社はありません。" },
        { q: "効果はどのくらいで確かめられますか？", a: "反映までの期間は公表されていません。配信前の日と2〜4週間後に同じ質問をして、答えと出典を記録してください。AIの回答は日によって変わるため、月1回など決まった間隔で続けます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、お客様のサイトをAIが読めるか確認",
        body: "登録不要の無料チェックで、会社の構造化データ、llms.txt、AI検索のクローラーの許可の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "PR TIMES、Optyino.ai、Muck Rack、Meltwater、共同通信PRワイヤー、Google、Googleアナリティクス、Search Console、ChatGPT、OpenAI、Claude、Anthropic、Copilot、Microsoft、Perplexity、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressおよび各製品名・サービス名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの団体・企業と提携・協賛関係にありません。",
    },
    en: {
      title: "Press Releases for AI Search: An Agency Guide | Nurevo",
      description: "One study found 15% of AI answers cited a press release. A release outline for AI and journalists, Google's link rules, the original on WordPress, and an agency menu.",
      h1: "Writing Press Releases AI Search Can Read: Structure, the Original on the Client's Site, and an Agency Service Menu",
      lead: "AI does cite press releases. A study of about 82,000 AI answers found that 15.05% cited at least one release, and six in ten of those citations pointed at the distribution service's page, not the company's site. To make a release usable, put who, what, when and the key number in the first three lines, give every figure its date and how it was counted, and publish the same text as an original on the client's own site. Do not engineer the links inside a release for rankings: Google's spam policies name that as link spam.",
      intro: [
        "Written 2026-11-25 (JST). The figures come from Optyino.ai's July 2026 release (a Japanese study) and the public reports of Muck Rack and Meltwater; the link rules come from Google's spam policies (last updated 2026-11-24). All were read on the same day. Some examples refer to Japanese services such as PR TIMES; elsewhere the same role is played by newswires such as Business Wire, PR Newswire or GlobeNewswire.",
        "This guide is for web agencies and consultancies that write or distribute press releases for clients. A better release does not guarantee that AI will mention the client. AI answers change day to day, and no AI company publishes how it picks sources. What follows is how to get accurate facts to AI and journalists, and how to explain that work as a monthly service.",
      ],
      sections: [
        {
          heading: "How often AI cites press releases",
          paragraphs: [
            "Studies count different things, so the numbers vary widely. \"Share of answers citing at least one release\" and \"share of all cited URLs that are releases\" are separate figures; don't mix them.",
          ],
          table: {
            head: ["Study", "Scope", "Findings"],
            rows: [
              ["Optyino.ai (released 2026-07-11)", "21 April – 8 July 2026; 120 prompts (finance, housing, appliances, B2B services); 81,895 answers", "15.05% of answers cited one or more releases. Releases were 2.20% of all cited URLs. 60.5% of release URLs were on PR TIMES; the top five sites held 69.4%"],
              ["Same study, by AI (share of answers)", "Answers collected through APIs", "ChatGPT (GPT-5 mini) 42.84% (small sample), ChatGPT (GPT-5.2) 27.33%, Perplexity 21.45%, Google AI Mode 20.68%, AI Overviews 12.81%, Claude 6.00%, Copilot 2.90%"],
              ["Muck Rack (December 2025)", "1 million+ links, July–December 2025", "Press releases rose from 1.2% to about 6% of citations"],
              ["Meltwater (2026-06-26, updated 09-29)", "Eight AI models, 8 million+ citations (its own tool's data)", "Press releases were 0.2% of citations in May 2026 (0.4% in April)"],
            ],
          },
          after: [
            `Sources: [Optyino.ai release (PR TIMES, Japanese)](${SRC.optyino}), [Muck Rack, December 2025](${SRC.muck2025}), [Meltwater](${SRC.meltwater}). All three come from companies selling related products. The Optyino.ai release itself says its answers were collected through APIs, classification was automatic, the prompts cover four sectors, and the figures will change with model updates. Meltwater does not publish its method in detail.`,
            "Together they support only this much: (1) AI does cite releases, (2) how often depends heavily on the AI and the subject, and (3) releases remain a small share of all cited URLs. \"Publish a release and you'll appear in AI\" is not a conclusion they support.",
          ],
        },
        {
          heading: "Which URL gets cited",
          paragraphs: [
            "In the Optyino.ai study, 60.5% of cited release URLs were PR TIMES pages. What AI lists as the source is usually the distribution service's page, not the client's site. Links placed inside the answer text appeared in only 0.63% of answers; almost all citations sat in the source list under the answer.",
            "That makes two pieces of work matter for an agency.",
          ],
          list: [
            "Make the distributed page stand on its own: AI reads that one page. Put the legal company name, location, date and figures inside the release itself.",
            "Publish an original on the client's site: distributed copies can be hard to correct later. An original that you can update with corrections or price changes, linked from the foot of the release, gives AI and journalists somewhere to check what is true now.",
          ],
        },
        {
          heading: "A structure both AI and journalists can use",
          paragraphs: [
            "The advice in the top-ranking guides comes down to the inverted pyramid (most important first) and subheadings that answer questions. Here it is as a single release outline. It also works as the intake form when you collect material from the client.",
          ],
          code: TEMPLATE_EN,
          after: [
            "Match the company details character for character with the client's About page and Google Business Profile. Inconsistent names or addresses can make AI treat them as different companies. See [company profile pages for AI search](/guide/company-profile-page-ai-search).",
          ],
        },
        {
          heading: "Rewrite examples",
          table: {
            head: ["Typical wording", "Rewrite", "Why"],
            rows: [
              ["Launches a groundbreaking, industry-first service", "(Company) launches (service) in (city) on 1 December; first-year target 50 clients", "Dates, places and numbers are easier to cite than claims no one can check, and harder to misread"],
              ["Loved by many customers", "128 companies as of 31 October 2026 (internal count)", "A figure with its date and method can be used as evidence by AI and journalists"],
              ["See our website for details", "Price: from 30,000 yen a month excl. tax. For companies with 50 or fewer staff", "AI often reads only the distributed page; don't rely on the link"],
              ["\"We\" / \"the company\" throughout", "Legal name at first mention, then one fixed short name", "Name variations look like different companies"],
              ["Survey shows 70% are satisfied", "Online survey, 1–14 October 2026, 500 people aged 20–69 nationwide; \"satisfied\" plus \"somewhat satisfied\" 72.4%", "Without the method, the number travels without its context"],
            ],
          },
        },
        {
          heading: "Survey releases: put the method in the text",
          paragraphs: [
            "Survey figures are the kind of material AI answers quote, but a figure without its method spreads in a distorted form once quoted. Put the period, method, population, sample size, questions and how answers were tallied in the body.",
            "The Optyino.ai release is itself a good example: alongside the period, number and type of prompts and number of answers, it states its limits — automatic classification, API answers that may differ from what users see, figures that change with model updates. Stating limits does not weaken a client's survey; it is what lets it be quoted correctly.",
          ],
        },
        {
          heading: "What not to do: engineered links and mass production",
          list: [
            `Don't engineer release links for rankings: Google's spam policies list, as an example of link spam, links with optimized anchor text in articles, guest posts or press releases distributed on other sites ([Google: spam policies](${SRC.spamEn})). The press release example was added in 2013 ([Search Engine Land](${SRC.sel2013})). Write links plainly: \"our website\", \"the original of this release\".`,
            "Google says paid links are not a policy violation when they carry rel=\"nofollow\" or rel=\"sponsored\". Check how the distribution service handles links.",
            "Don't publish the same release reworded many times: Google treats generating many pages mainly to manipulate rankings as scaled content abuse. One release when a fact changes protects the client's credibility better than a release every month with nothing new in it.",
            "Don't use superlatives you can't support: \"No. 1\" and \"industry first\" only when the basis is in the text. Advertising rules apply too.",
            "Don't add text written only for AI: hidden text or unrelated keyword lists harm readers and journalists.",
          ],
          after: [
            "For how to judge and turn down a request such as \"mass-produce releases that get us into AI\", see [when clients ask for AI search manipulation](/guide/agency-ai-search-manipulation-risks).",
          ],
        },
        {
          heading: "Publishing the original on the client's WordPress site",
          list: [
            "Create a \"Press releases\" category for posts with a short index URL such as /news/press/. Publish the same text on the same day it is distributed.",
            "Put the three-line summary into the excerpt field. Nurevo AEO (a free WordPress plugin), on sites with no SEO plugin, uses the excerpt as the description in the post's structured data (BlogPosting), or the opening words when there is no excerpt. The headline, published and modified dates, author and featured image are included, and the publisher points at the business node.",
            "Where Yoast SEO, Rank Math, All in One SEO or Slim SEO is active, the article structured data stays exactly as that plugin publishes it. From 0.9.1, Nurevo AEO also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "When something changes, edit the text and add a dated note at the top: \"Corrected 3 December 2026: the price is now ...\". Ask the distribution service to correct its copy too, so both match.",
            "Nurevo AEO's llms.txt lists up to the 30 most recently modified published pages and posts. On sites with many releases, older ones drop off; to keep the index page listed, add a line with the webmcp_canary_llms_txt_lines filter (example below). Any post can be left out of llms.txt from its own settings.",
            `Then check /llms.txt and the post's source (application/ld+json) to confirm the excerpt and dates match the text. [Get it on WordPress.org](${WP_ORG})`,
          ],
          code: FILTER_EN,
        },
        {
          heading: "Building the agency service menu",
          paragraphs: [
            "Instead of selling releases only per piece, fold the work of making them readable by AI and journalists into the monthly retainer, and you can show the client how results are checked. Prices are yours to set; below is just a way to divide the work.",
          ],
          table: {
            head: ["Task", "Frequency", "Deliverable", "Check"],
            rows: [
              ["Gathering material", "Per release", "Intake form following the outline", "Every number has a date and method"],
              ["Writing or rewriting", "Per release", "Distribution text and three-line summary", "Name and address match the About page"],
              ["Publishing the original", "Per release", "Post on the client's site with excerpt and dates", "The distributed copy links to the original"],
              ["Managing corrections", "As needed", "Dated correction note and request to the service", "Both versions now match"],
              ["Recording AI answers", "Monthly", "Answers and cited URLs for a fixed set of questions", "Whether the source is the wire copy or the original, and whether it is right"],
            ],
          },
          after: [
            "Distribution fees are separate. Show distribution and your own work as separate lines on the quote.",
            "For turning AI search work as a whole into a retainer, see [how agencies turn AEO into a monthly service](/guide/agency-aeo-monthly-service); for listing third-party coverage, see [press coverage pages](/guide/media-coverage-page-ai-search). Partner terms are on the [partner page](https://nurevo.jp/partner/).",
          ],
        },
        {
          heading: "How to check results",
          list: [
            "Pick three to five questions that fit the release (for example \"Which companies started (service) in (area)?\" or \"How much is (company)'s (service)?\"). Ask ChatGPT, Perplexity and Google AI Mode the day before distribution and again two to four weeks later.",
            "Record, with the date, whether the company appeared, whether the facts were right, and whether the source was the distributed copy, the original or a third-party article.",
            "If the facts are old or wrong, correct the original and ask the service to correct its copy first. Keep the records in the way described in [how to measure AI visibility](/guide/measure-ai-visibility).",
            "In Google Analytics 4, watch referrals from AI services to the original post; in Search Console, watch searches for the company and service names.",
            "Nurevo AEO's free AI check asks Perplexity three questions built from the business type and area once a month for each connected site. Pro (from USD 99 a month) measures continuously, currently on Perplexity, with ChatGPT once configured.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "The first three lines say who, what, when and the key number",
            "Every number has a date and how it was counted",
            "Survey releases state period, method, population, sample size and limits",
            "Company details match the client's About page",
            "\"Industry first\" and \"No. 1\" appear only with the basis in the text",
            "Links are plain: the company site and the original, nothing engineered",
            "No near-identical releases published with different wording",
            "The original is on the client's site with the summary in the excerpt",
            "Corrections are dated on the original and requested from the service",
            "Answers and sources for fixed questions recorded before and two to four weeks after",
          ],
        },
      ],
      faqs: [
        { q: "If we distribute a press release, will AI mention the company?", a: "Not necessarily. In a study of about 82,000 answers, 15.05% cited a release, and the share varied widely by AI and subject. Getting accurate facts into a usable form is the part you can control." },
        { q: "Does AI cite the newswire page or the company's own site?", a: "In that study 60.5% of release URLs were on PR TIMES, a distribution service. Make the distributed page complete on its own, keep a correctable original on the company site, and keep the two consistent." },
        { q: "Should a release include lots of links?", a: "No. Google lists links with optimized anchor text in press releases distributed on other sites as an example of link spam. Plain links to the company site and the original are enough." },
        { q: "Is it worth adding a Q&A section to a release?", a: "Short answers to the questions journalists and readers would ask give AI something it can use as part of an answer. No AI company has said it favours this, and the content still has to be factual." },
        { q: "Will publishing the same text on our own site count as duplicate content?", a: "Hosting the original of your own announcement on your own site is not mass production aimed at rankings. What to avoid is publishing many reworded copies of the same release." },
        { q: "Do we need structured data?", a: "It is not required. Published as a WordPress post, the release gets article structured data from Nurevo AEO or your SEO plugin. No AI company has said it uses release structured data." },
        { q: "How soon can we see results?", a: "No AI company publishes how long it takes. Ask the same questions the day before and two to four weeks after, and record answers and sources. AI answers vary from day to day, so keep checking at a fixed interval, such as monthly." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your client's site",
        body: "A free check with no sign-up shows the state of the business structured data, llms.txt and AI search crawler access. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "PR TIMES, Optyino.ai, Muck Rack, Meltwater, Business Wire, PR Newswire, GlobeNewswire, Google, Google Analytics, Search Console, ChatGPT, OpenAI, Claude, Anthropic, Copilot, Microsoft, Perplexity, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit, WordPress and their product and service names are trademarks of their respective owners. Nurevo is not affiliated with these organizations.",
    },
  },
};
