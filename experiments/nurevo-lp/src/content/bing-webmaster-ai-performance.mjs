// Content page: how to read Bing Webmaster Tools' "AI Performance" report
// (citations of your pages in Microsoft Copilot, AI summaries in Bing and
// select partner AI experiences): the metrics, the 2026 additions (Grounding
// Query - Page Mapping, Intents, Topics, Citation Share, Compare, Topics
// Portfolio beta), what it cannot show, how to turn findings into page work,
// a monthly record next to Search Console and a Perplexity check, and
// WordPress steps.
//
// Written 2026-11-23 17時 (JST).
//
// Outside facts and where they were read (2026-11-23):
// - Bing Webmaster Blog, 2026-02-10, "Introducing AI Performance in Bing
//   Webmaster Tools Public Preview": public preview; Microsoft Copilot,
//   AI-generated summaries in Bing and select partner integrations; metrics
//   Total Citations, Average Cited Pages (unique pages per day, averaged),
//   Grounding queries ("a sample of overall citation activity"), page-level
//   citation activity, visibility trends; none indicates ranking, placement or
//   authority; Bing respects robots.txt; recommends IndexNow and Bing Places.
// - Microsoft Advertising blog, 2026-03-23: Grounding Query - Page Mapping;
//   one query may map to several pages and vice versa.
// - Bing Search Blog, 2026-06-16: Intents, Topics, Citation Share, Compare in
//   preview globally; Citation Share = share of citations attributed to your
//   site out of all citations shown across all sites for that grounding query;
//   does not expose competitor domains, traffic share or quality scores;
//   Compare: current 30 days vs prior 30 days or custom ranges; citation
//   patterns shift with user behaviour, models, freshness, partner refreshes.
// - Bing Webmaster Blog, 2026-10-13, Topics Portfolio (Beta): tab next to
//   Citations & Pages; 1/2/3-month window; columns Topic, Topic Size, Sites
//   Cited, Queries (approximate); Top Opportunity Queries; Your Grounding
//   Queries / Opportunity Queries; topics with too little presence/activity
//   not shown; branded queries may appear as opportunities; "directional
//   signals for planning".
// - Practical Ecommerce 2026-06-22 (secondary): Grounding Queries and Pages
//   views, export to spreadsheet, click-through from query to pages and page to
//   queries; add site via "Import your sites from GSC", about 24 hours for data.
// - Search Engine Land (secondary): no click, traffic or revenue data.
// - PinMeTo 2026-07-03 (secondary, citing a Microsoft PM's reply on X): jumps
//   seen from 2026-06-01 were backfill, not more citations.
// Not stated, because no page we read says it: data lag, history length,
// API, country/language limits, the official intent list, Bing help pages
// (blocked from our fetch), page-level grounding controls.
//
// Nurevo facts: readme.txt 0.9.x (AI search crawlers allowed: OAI-SearchBot,
// ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User;
// Bingbot is not in that list; free AI check: monthly, three Perplexity
// questions; Pro measurement on Perplexity, ChatGPT once configured).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  launch: "https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview",
  mapping: "https://about.ads.microsoft.com/en/blog/post/march-2026/the-ai-performance-dashboard-your-view-into-where-your-brand-appears-across-the-ai-web",
  june: "https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare",
  topics: "https://blogs.bing.com/webmaster/2026/10/introducing-topics-portfolio-beta-in-ai-performance/",
  pec: "https://www.practicalecommerce.com/bings-improved-ai-performance-section",
  sel: "https://searchengineland.com/bing-webmaster-tools-ai-performance-report-468751",
  pinmeto: "https://www.pinmeto.com/news/bing-ai-performance-backfill-citation-share-2026/",
  bwt: "https://www.bing.com/webmasters/",
};

export default {
  slug: "bing-webmaster-ai-performance",
  targetQueries: [
    "Bing Webmaster Tools AI Performance report",
    "how to see Copilot citations of my website",
    "Bing grounding queries citation share",
    "Bing Webmaster Tools AI Performance 見方",
    "Copilot 引用 確認 方法",
    "グラウンディングクエリ 引用シェア",
  ],
  related: ["search-console-ai-features", "measure-ai-visibility", "aeo-vs-seo-vs-geo", "perplexity-citations", "agency-aeo-monthly-service"],
  locales: {
    ja: {
      title: "Bing Webmaster ToolsのAI Performanceの見方 | Nurevo",
      description: "Copilotなどの回答で自社ページが出典になった回数を見るBingのAI Performance。指標の意味、2026年の追加機能、見えたことをページの直しにつなげる手順、WordPressでの準備をまとめました。",
      h1: "Bing Webmaster ToolsのAI Performanceの見方：Copilotの引用数・グラウンディングクエリ・引用シェアを、ページの直しにつなげる",
      lead: "Microsoft CopilotやBingのAIによる要約で、あなたのサイトのページが出典として何回表示されたかは、Bing Webmaster Toolsの「AI Performance」で見られます。わかるのは引用の回数・引用されたページ・AIが情報を探すのに使った語句（グラウンディングクエリ）で、クリック数や回答の中の順位はわかりません。まず「どのページが、どんな語句で引用されているか」を確かめ、引用されていない大事なページを直す、という使い方が現実的です。",
      intro: [
        "作成日：2026年11月23日。Bingの機能は、同日にMicrosoftの公式ブログ（Bing Webmaster Blog・Bing Search Blog・Microsoft Advertisingのブログ）で確認しました。AI Performanceはプレビュー・ベータの機能を含み、画面の名前や中身は変わることがあります。ログイン後の画面とBingのヘルプもあわせてご確認ください。",
        "このレポートでわかるのはMicrosoftのAIの中での引用だけです。ChatGPT・Perplexity・GoogleのAIによる概要は含まれません。また、どんな対策をしても、AIの回答に必ず引用される・順位が保証されるということはありません。AIの回答は日々変わります。",
      ],
      sections: [
        {
          heading: "AI Performanceとは：何を数えるレポートか",
          paragraphs: [
            `Bingは2026年2月10日に、Bing Webmaster ToolsのAI Performanceを公開プレビューとして出しました（[Bing Webmaster Blog](${SRC.launch})）。対象は、Microsoft Copilot、BingのAIによる要約、一部の提携先のAIの体験です。どの提携先かは公開されていません。`,
            "数えているのは「AIの回答の中で、あなたのサイトのページが出典として表示された回数」です。通常の検索レポートの表示回数・クリック数・掲載順位とは別物です。",
          ],
          table: {
            head: ["指標（画面の英語名）", "意味", "読むときの注意"],
            rows: [
              ["Total Citations（引用の合計）", "選んだ期間に、AIの回答で出典として表示された回数の合計", "回答の中のどの位置に出たかは示さない"],
              ["Average Cited Pages（平均の引用ページ数）", "1日あたり、出典として表示されたあなたのサイトの異なるページ数を、期間で平均したもの", "ページの重要度や順位を示すものではない"],
              ["Grounding queries（グラウンディングクエリ）", "AIが引用した内容を探すときに使った短い語句", "利用者が入力した質問の原文ではない。全体の一部を抜き出した標本"],
              ["ページごとの引用", "URLごとの引用回数", "回数であって、ページの評価や順位ではない"],
              ["推移（Visibility trends）", "引用の回数の日ごとの推移", "急な増減は、データの補完やAI側の変化でも起きる（後述）"],
            ],
            caption: "Bing Webmaster Blog（2026-02-10）の説明をもとに作成。",
          },
          after: [
            `クリックやアクセス、売上のデータはこのレポートにはありません（[Search Engine Land](${SRC.sel})）。サイトへの訪問は、アクセス解析で別に見ます。`,
          ],
        },
        {
          heading: "2026年に足された機能：ページの対応・意図・トピック・引用シェア・比較",
          paragraphs: [
            "公開後、次の機能が順に足されました。どれもプレビューかベータで、ラベルや数え方は変わる可能性があります。",
          ],
          table: {
            head: ["時期", "機能", "わかること", "出典"],
            rows: [
              ["2026-03-23", "Grounding Query – Page Mapping", "ある語句でどのページが引用されたか、あるページがどの語句で引用されたかを行き来できる。1つの語句に複数のページ、1つのページに複数の語句が対応することがある", `[Microsoft Advertising](${SRC.mapping})`],
              ["2026-06-16", "Intents（意図）", "グラウンディングクエリを、情報収集・商用・指名（ナビゲーション）・地域などの目的に分類（AIによる分類）", `[Bing Search Blog](${SRC.june})`],
              ["2026-06-16", "Topics（トピック）", "関連する語句をテーマのまとまりにする", `[Bing Search Blog](${SRC.june})`],
              ["2026-06-16", "Citation Share（引用シェア）", "ある語句で表示された全サイトの引用のうち、あなたのサイトの割合", `[Bing Search Blog](${SRC.june})`],
              ["2026-06-16", "Compare（比較）", "今の期間と前の期間を重ねて見る。直近30日と前の30日、または任意の期間", `[Bing Search Blog](${SRC.june})`],
              ["2026-10-13", "Topics Portfolio（ベータ）", "あなたが出ているトピックごとに、トピック全体の引用数・出ているサイト数・語句数（どれも概数）と、他のサイトは出ていてあなたは出ていない語句（Opportunity Queries）", `[Bing Webmaster Blog](${SRC.topics})`],
            ],
          },
          after: [
            "引用シェアについてBingは、競合のドメイン名は見せない、アクセスのシェアではない、内容の品質の点数ではない、としています。Topics Portfolioの数字も、Bing自身が「計画のための方向を示すもので、正確な台帳ではない」と書いています。どちらも順位表として読まないのが大切です。",
            `Topics Portfolioでは、出ているサイトや引用が少なすぎるトピックは表示されません。指名の語句（店名や会社名）が「機会」として出ることもあるとBingは書いています（[Bing Webmaster Blog](${SRC.topics})）。`,
          ],
        },
        {
          heading: "始め方：サイトの登録とレポートの開き方",
          list: [
            `[Bing Webmaster Tools](${SRC.bwt})にMicrosoftアカウントでログインし、サイトを追加して所有権を確認する。Google Search Consoleに登録済みなら、そこからサイトを取り込む方法があります（Practical Ecommerce は「Import your sites from GSC」を選び、データが出るまで約24時間としています：[Practical Ecommerce](${SRC.pec})）。`,
            "左のメニューから「AI Performance」を開く。期間を選び、「Citations & Pages」とTopics Portfolioのタブを切り替えて見ます（タブの名前は時期によって変わることがあります）。",
            "グラウンディングクエリの表で語句をクリックすると、その語句で引用されたページが出ます。ページのURLをクリックすると、そのページが引用された語句の一覧が出ます。",
            `表は表計算ソフトに書き出せます（[Practical Ecommerce](${SRC.pec})）。プレビュー中の機能はあとで変わる可能性があるため、毎月同じ日に書き出して残しておくと、比べやすくなります。`,
          ],
          after: [
            "データが出ない、または少ないときは、そもそもMicrosoftのAIで引用されていないか、Bingにページが読まれていない（インデックスされていない）可能性があります。次の章の確認をしてから、数か月単位で様子を見ます。",
          ],
        },
        {
          heading: "数字が急に増えた・減ったときに確かめること",
          paragraphs: [
            `2026年6月1日ごろから、多くのアカウントで引用数が大きく増えたという報告がありました。PinMeToは、Microsoftの担当者がX上で「データの補完（バックフィル）であって、引用が増えたわけではない」と答えたと伝えています（[PinMeTo](${SRC.pinmeto})、二次情報）。こうした変化は、記録に「データの変更」と書き添えておきます。`,
            `Bingは、引用のされ方は利用者の行動、モデルの変化、情報の新しさ、提携先の更新の周期などで動くとしています（[Bing Search Blog](${SRC.june})）。1か月の増減だけで良し悪しを決めず、比較（Compare）で同じ長さの期間を並べ、数か月の流れで判断します。`,
          ],
        },
        {
          heading: "見えたことを、ページの直しにつなげる",
          paragraphs: [
            "レポートは「見て終わり」になりがちです。次の表のように、見えたことごとに、やることを決めておきます。",
          ],
          table: {
            head: ["見えたこと", "考えられること", "やること"],
            rows: [
              ["料金・メニュー・アクセスのページが一度も引用されていない", "ページが読まれていない、または答えが文章として書かれていない", "Bingでインデックスされているか確かめ、料金・時間・場所などを本文の文章と表で書く。構造化データと値をそろえる"],
              ["引用されているのがブログの古い記事ばかり", "最新の正式なページより、古い記事のほうが質問に直接答えている", "正式なページに同じ質問への答えを書き、古い記事は最新の情報に直すか、正式なページへリンクする"],
              ["店名・会社名の語句で、自社以外のページの割合が高い（引用シェアが低い）", "比較サイトや口コミサイトの情報が先に使われている", "自社サイトの会社概要・店舗情報を充実させ、外部の掲載先の情報も最新にそろえる"],
              ["地域・業種の語句（例：「渋谷 歯科 土曜」）で出ていない", "地域や対応条件がページに書かれていない", "対応エリア・診療日・土日の対応などを、具体的な言葉でページに書く。Bing Placesの情報も確認する"],
              ["1つの語句で、自社の似たページが複数引用されている", "同じ内容のページが重なっている", "中心にするページを決め、他のページはそこへリンクするか内容を分ける"],
            ],
          },
          after: [
            "どの直しも、AIに引用されるための特別な書き方ではなく、お客様が知りたい事実を正確にわかりやすく書くことが中心です。直したら日付を記録し、1〜3か月後に比較で前後を見ます。直したことが原因かどうかは断定できないため、「直した後にこう変わった」という事実として記録します。",
          ],
        },
        {
          heading: "毎月の記録：Search ConsoleとGoogle以外のAIと並べる",
          paragraphs: [
            "AI Performanceが扱うのはMicrosoftのAIだけです。GoogleのAIによる概要・AIモードはSearch Consoleの生成AIパフォーマンスレポート、ChatGPTやPerplexityは別の方法で見ます。1枚の表に月ごとに並べておくと、全体の様子がつかめます。",
          ],
          table: {
            head: ["記録する項目", "どこで見るか"],
            rows: [
              ["Microsoft：引用の合計・平均の引用ページ数・引用されたページ上位5つ・主なグラウンディングクエリ", "Bing Webmaster Tools の AI Performance（書き出し）"],
              ["Google：AI機能での表示回数（ページ別）", "Search Console の生成AIパフォーマンスレポート。[見方のガイド](/guide/search-console-ai-features)"],
              ["ChatGPT・Perplexity：決めた質問で名前が出たか・サイトが引用されたか", "決めた質問を定期的に聞く。[AIでの登場率の測り方](/guide/measure-ai-visibility)"],
              ["AIからの訪問", "アクセス解析の参照元（copilot.microsoft.com、chatgpt.com、perplexity.ai など）"],
              ["その月に直したページと日付", "自分の作業メモ"],
            ],
          },
          after: [
            "Nurevo AEOでは、接続したFree・Standardのサイトに、業種と地域から作った店名を含まない3つの質問を月1回Perplexityに聞く無料のAIチェックがあります。決めた質問のセットを継続して測るPro（月14,800円〜）も、現在はPerplexityで測っています（ChatGPTは設定され次第）。BingのMicrosoftの数字と、Perplexityの記録を同じ表に置くと、AIごとの違いが見えます。",
          ],
        },
        {
          heading: "WordPressでの準備",
          list: [
            "Bingにサイトを読ませる：WordPressの［設定］＞［表示設定］で「検索エンジンでの表示」のチェックが外れているか確認します。チェックが入っていると、検索エンジンにインデックスしないよう求めます。",
            "robots.txtでBingbotを止めていないか確認する：ブラウザで /robots.txt を開き、Bingbot や全体（User-agent: *）に Disallow: / がないかを見ます。Bingは robots.txt などの指定を守るとしているため、止めていると引用もされません。",
            "所有権の確認：多くのSEOプラグインには、ウェブマスターツールの確認コード（メタタグ）を入れる欄があります。欄がない場合は、Bingが案内するほかの方法（ファイルのアップロードやDNSなど）や、Search Consoleからの取り込みを使います。",
            "サイトマップを送る：SEOプラグインが出すサイトマップのURL（例：/sitemap.xml や /sitemap_index.xml）をBing Webmaster Toolsに登録します。",
            `更新をすぐ知らせる：Bingは公開時の案内でIndexNowを勧めています（[Bing Webmaster Blog](${SRC.launch})）。使っているSEOプラグインなどにIndexNowの機能があれば有効にします。`,
            "店舗ならBing Placesも：Bingは店舗の情報としてBing Placesも勧めています。住所・営業時間・電話番号を、サイトの表記と同じにします。",
          ],
          after: [
            `Nurevo AEO（WordPressプラグイン、無料）は、構造化データ・llms.txt・AI検索のクローラー向けのrobots.txtをサーバー側で出力します。robots.txtで許可を足すのはOAI-SearchBot・ChatGPT-User・Claude-SearchBot・Claude-User・PerplexityBot・Perplexity-Userで、Bingbotの扱いはサイトのrobots.txtのままです。0.9.1からはSEO SIMPLE PACK・VK All in One Expansion Unitと一緒に使っても構造化データが重複しません。[WordPress.orgで入手](${WP_ORG})`,
          ],
        },
        {
          heading: "毎月の確認チェックリスト",
          list: [
            "AI Performanceを同じ日に書き出して保存した",
            "引用の合計と平均の引用ページ数を、前の期間と比較（Compare）で並べた",
            "引用されたページの上位5つと、主なグラウンディングクエリを記録した",
            "料金・メニュー・アクセス・会社概要など大事なページが引用されているか確かめた",
            "引用シェアの低い指名の語句がないか確かめた",
            "Topics PortfolioのOpportunity Queriesから、答えるべき質問を1つ選んだ",
            "急な増減に、データの変更やAI側の変化の可能性を書き添えた",
            "Bingのインデックスとrobots.txtに問題がないか確かめた",
            "Search Consoleの生成AIレポートとPerplexityの記録を同じ表に入れた",
            "その月に直したページと日付を記録した",
          ],
        },
        {
          heading: "制作会社・保守会社が報告に使うとき",
          paragraphs: [
            "お客様への月次の報告では、AI Performanceの数字を「順位」や「成果の保証」として見せないことが大切です。「Microsoftの AIで、この月にこのページがこの語句で何回出典になった」「直したページの前後でこう変わった」という事実を書き、Googleや他のAIの記録と並べて見せます。",
            "書き出したデータの保存、引用されていない大事なページの洗い出し、直しの提案までを毎月の作業にすると、保守の作業とAI検索の見え方を1つの報告にまとめられます。月額サービスにする方法は[制作会社がAI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)にまとめています。パートナー制度は[パートナーのページ](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "AI Performanceはどこで見られますか？", a: "Bing Webmaster Toolsにサイトを登録し、所有権を確認したあと、メニューの「AI Performance」から開けます。2026年2月10日に公開プレビューとして始まり、その後の機能もプレビューやベータとして足されています。" },
        { q: "ChatGPTやPerplexityでの引用もわかりますか？", a: "いいえ。対象はMicrosoft Copilot、BingのAIによる要約、一部の提携先のAIです。ChatGPT・Perplexity・GoogleのAIによる概要は含まれないため、Search Consoleや、決めた質問を定期的に聞く方法などで別に確認します。" },
        { q: "グラウンディングクエリは、利用者が入力した質問ですか？", a: "いいえ。AIが引用した内容を探すときに使った短い語句で、利用者の質問の原文ではありません。Bingは、表示されるのは引用全体の一部を抜き出した標本だとしています。" },
        { q: "引用シェアで競合のサイトはわかりますか？", a: "わかりません。引用シェアは、ある語句で表示された全サイトの引用のうちあなたのサイトの割合で、Bingは競合のドメイン名を見せない、アクセスのシェアや品質の点数ではない、としています。" },
        { q: "クリック数やAIからの訪問数は見られますか？", a: "AI Performanceにはクリックやアクセスのデータはありません。AIからの訪問は、アクセス解析の参照元（copilot.microsoft.com など）で別に見ます。" },
        { q: "6月に引用数が急に増えたのはなぜですか？", a: "2026年6月1日ごろからの急な増加について、Microsoftの担当者がデータの補完（バックフィル）だと説明したと報じられています（二次情報）。記録には「データの変更」と書き添え、同じ長さの期間を比べて判断します。" },
        { q: "引用数を増やす特別な設定はありますか？", a: "Bingが示しているのは、robots.txtなどでBingに読ませること、IndexNowで更新を知らせること、店舗ならBing Placesを整えることなどです。引用が保証される方法はありません。お客様が知りたい事実を、ページに正確にわかりやすく書くことが中心です。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトを読めるか確認",
        body: "登録不要の無料チェックで、構造化データやllms.txt、AI検索のクローラーの許可など、AIが読む情報の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "Microsoft、Bing、Copilot、Bing Webmaster Tools、Bing Places、Google、Search Console、ChatGPT、OpenAI、Perplexity、WordPressおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "How to Read Bing Webmaster Tools AI Performance | Nurevo",
      description: "Bing's AI Performance report shows how often Copilot and Bing's AI summaries cite your pages. What each metric means, 2026 additions, and WordPress setup.",
      h1: "How to read Bing Webmaster Tools' AI Performance report: turn Copilot citations, grounding queries and citation share into page fixes",
      lead: "Bing Webmaster Tools' \"AI Performance\" report shows how often pages from your site were shown as sources in Microsoft Copilot and Bing's AI-generated summaries. It reports citation counts, which pages were cited and the phrases the AI used to find content (grounding queries). It does not report clicks or where you appeared inside an answer. The practical use is to see which pages are cited for which phrases, then fix the important pages that are not cited.",
      intro: [
        "Written November 23, 2026. Bing's features were checked that day on Microsoft's own blogs (Bing Webmaster Blog, Bing Search Blog and the Microsoft Advertising blog). Parts of AI Performance are in preview or beta, so names and contents can change. Check the signed-in screen and Bing's help pages too.",
        "This report only covers citations inside Microsoft's AI experiences. ChatGPT, Perplexity and Google's AI Overviews are not included. And nothing you do can guarantee that an AI answer will cite you or rank you anywhere. AI answers change from day to day.",
      ],
      sections: [
        {
          heading: "What AI Performance counts",
          paragraphs: [
            `Bing launched AI Performance in Bing Webmaster Tools as a public preview on February 10, 2026 ([Bing Webmaster Blog](${SRC.launch})). It covers Microsoft Copilot, AI-generated summaries in Bing and select partner AI experiences. Bing does not say which partners.`,
            "What it counts is how often a page from your site was displayed as a source inside an AI answer. That is a different thing from the impressions, clicks and positions in the normal search report.",
          ],
          table: {
            head: ["Metric", "Meaning", "Caution"],
            rows: [
              ["Total Citations", "Total number of times your pages were shown as sources in AI answers in the selected period", "Does not show where in the answer you appeared"],
              ["Average Cited Pages", "Number of distinct pages from your site shown as sources per day, averaged over the period", "Not a measure of page importance or ranking"],
              ["Grounding queries", "Short phrases the AI used when retrieving the content it cited", "Not the user's original prompt; a sample of overall citation activity"],
              ["Page-level citations", "Citations per URL", "A count, not a page score or rank"],
              ["Visibility trends", "Citations over time, by day", "Sudden jumps can come from data backfill or changes on the AI side (see below)"],
            ],
            caption: "Based on Bing Webmaster Blog (2026-02-10).",
          },
          after: [
            `The report has no click, traffic or revenue data ([Search Engine Land](${SRC.sel})). Look at visits in your analytics separately.`,
          ],
        },
        {
          heading: "What was added in 2026: page mapping, intents, topics, citation share, compare",
          paragraphs: [
            "Since launch, Bing has added the following, one after another. All are preview or beta, so labels and counting can change.",
          ],
          table: {
            head: ["When", "Feature", "What it tells you", "Source"],
            rows: [
              ["2026-03-23", "Grounding Query – Page Mapping", "Move from a phrase to the pages cited for it, or from a page to the phrases it was cited for. One phrase can map to several pages and vice versa", `[Microsoft Advertising](${SRC.mapping})`],
              ["2026-06-16", "Intents", "Grounding queries grouped by purpose, such as informational, commercial, navigational and local (classified by AI)", `[Bing Search Blog](${SRC.june})`],
              ["2026-06-16", "Topics", "Related phrases grouped into themes", `[Bing Search Blog](${SRC.june})`],
              ["2026-06-16", "Citation Share", "Your site's share of all citations shown across all sites for one grounding query", `[Bing Search Blog](${SRC.june})`],
              ["2026-06-16", "Compare", "Overlay a previous period on the current one: the last 30 days against the 30 before, or custom ranges", `[Bing Search Blog](${SRC.june})`],
              ["2026-10-13", "Topics Portfolio (beta)", "For each topic you appear in: approximate total citations across sites, number of sites cited and number of phrases, plus phrases where other sites appear and you do not (Opportunity Queries)", `[Bing Webmaster Blog](${SRC.topics})`],
            ],
          },
          after: [
            "Bing says Citation Share does not expose competitor domains, is not traffic share and is not a content quality score. For Topics Portfolio, Bing itself says to treat the numbers as directional signals for planning, not a precise ledger. Neither is a ranking table.",
            `Topics with too little site presence or activity are not shown in Topics Portfolio, and Bing notes that branded queries (your own business name) can show up as opportunities ([Bing Webmaster Blog](${SRC.topics})).`,
          ],
        },
        {
          heading: "Getting started: adding the site and opening the report",
          list: [
            `Sign in to [Bing Webmaster Tools](${SRC.bwt}) with a Microsoft account, add your site and verify ownership. If the site is already in Google Search Console, you can import it from there (Practical Ecommerce describes choosing "Import your sites from GSC" and waiting about 24 hours for data: [Practical Ecommerce](${SRC.pec})).`,
            "Open \"AI Performance\" from the left menu. Choose a period and switch between the \"Citations & Pages\" and Topics Portfolio tabs (tab names may change over time).",
            "Click a phrase in the grounding queries table to see the pages cited for it. Click a page URL to see the phrases it was cited for.",
            `The tables can be exported to a spreadsheet ([Practical Ecommerce](${SRC.pec})). Preview features can change, so export on the same day each month to keep comparable records.`,
          ],
          after: [
            "If there is no data or very little, your pages may simply not be cited in Microsoft's AI yet, or Bing may not have indexed them. Run the checks in the WordPress section below, then watch over months rather than days.",
          ],
        },
        {
          heading: "When the numbers jump or drop",
          paragraphs: [
            `From around June 1, 2026, many accounts reported large jumps in citations. PinMeTo reports that a Microsoft product manager replied on X that this was a data backfill, not more citations ([PinMeTo](${SRC.pinmeto}), secondhand). Note such changes in your records as a data change.`,
            `Bing says citation patterns shift with user behavior, evolving models, freshness and partner refresh cycles ([Bing Search Blog](${SRC.june})). Do not judge from one month's change. Use Compare to line up periods of the same length and read the trend over several months.`,
          ],
        },
        {
          heading: "Turning what you see into page fixes",
          paragraphs: [
            "Reports tend to end at \"we looked at it\". Decide in advance what you will do for each finding, as in this table.",
          ],
          table: {
            head: ["What you see", "Likely reason", "What to do"],
            rows: [
              ["Pricing, services or directions pages are never cited", "The page is not indexed, or the answer is not written as text", "Check the page is indexed in Bing. Write prices, hours and location in body text and a table. Keep structured data values identical"],
              ["Only old blog posts are cited", "Old posts answer the question more directly than the current official page", "Answer the same question on the official page, and update old posts or link them to it"],
              ["For your own business name, other sites take most citations (low citation share)", "Comparison or review sites are used first", "Strengthen your company and location pages, and bring outside listings up to date"],
              ["You are missing for area + service phrases (e.g. \"dentist open Saturday Shibuya\")", "Area or conditions are not written on your pages", "State service area, opening days and weekend availability in plain words. Check Bing Places too"],
              ["Several similar pages of yours are cited for one phrase", "Pages overlap", "Pick one main page and link the others to it, or separate their content"],
            ],
          },
          after: [
            "None of these is a special trick for AI. The core is writing the facts customers need, accurately and clearly. Record the date of each fix and compare before and after one to three months later. You cannot prove the fix caused a change, so record it as \"after this fix, this changed\".",
          ],
        },
        {
          heading: "A monthly record next to Search Console and other AIs",
          paragraphs: [
            "AI Performance only covers Microsoft's AI. Google's AI Overviews and AI Mode are in Search Console's Generative AI performance report, and ChatGPT and Perplexity need another method. Putting them in one monthly table gives you the whole picture.",
          ],
          table: {
            head: ["What to record", "Where to look"],
            rows: [
              ["Microsoft: total citations, average cited pages, top five cited pages, main grounding queries", "Bing Webmaster Tools AI Performance (export)"],
              ["Google: impressions in AI features, by page", "Search Console Generative AI performance report. [Guide](/guide/search-console-ai-features)"],
              ["ChatGPT and Perplexity: whether set questions named you or cited your site", "Ask a fixed set of questions regularly. [How to measure AI visibility](/guide/measure-ai-visibility)"],
              ["Visits from AI", "Referrers in your analytics (copilot.microsoft.com, chatgpt.com, perplexity.ai and so on)"],
              ["Pages you fixed that month, with dates", "Your own work log"],
            ],
          },
          after: [
            "Nurevo AEO includes a free AI check for connected Free and Standard sites: once a month it asks Perplexity three questions built from your business type and area (never your business name). Pro (from USD 99 a month) measures a fixed question set over time, currently on Perplexity, with ChatGPT once configured. Putting Bing's Microsoft numbers and the Perplexity record in the same table shows how the AIs differ.",
          ],
        },
        {
          heading: "Setting up in WordPress",
          list: [
            "Let Bing read the site: in WordPress, go to Settings > Reading and make sure \"Search engine visibility\" is unchecked. When it is checked, WordPress asks search engines not to index the site.",
            "Check that robots.txt does not block Bingbot: open /robots.txt in a browser and look for Disallow: / under Bingbot or under all agents (User-agent: *). Bing says it respects robots.txt, so a blocked site will not be cited either.",
            "Verify ownership: many SEO plugins have a field for webmaster tools verification codes (meta tags). If yours does not, use another method Bing offers (file upload or DNS) or import from Search Console.",
            "Submit the sitemap: add the sitemap URL your SEO plugin outputs (for example /sitemap.xml or /sitemap_index.xml) in Bing Webmaster Tools.",
            `Tell Bing about updates quickly: Bing recommended IndexNow in its launch post ([Bing Webmaster Blog](${SRC.launch})). If your SEO plugin or another plugin offers IndexNow, turn it on.`,
            "For local businesses, Bing Places too: Bing also recommends Bing Places for business listings. Keep address, hours and phone number identical to your site.",
          ],
          after: [
            `Nurevo AEO (free WordPress plugin) outputs structured data, llms.txt and robots.txt rules for AI search crawlers on the server. The crawlers it adds allow rules for are OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User; Bingbot is left to your existing robots.txt. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data. [Get it on WordPress.org](${WP_ORG})`,
          ],
        },
        {
          heading: "Monthly checklist",
          list: [
            "Exported AI Performance on the same day as last month and saved it",
            "Compared total citations and average cited pages with the previous period (Compare)",
            "Recorded the top five cited pages and the main grounding queries",
            "Checked whether key pages (pricing, services, directions, about) are cited",
            "Checked for branded phrases with low citation share",
            "Picked one question to answer from Topics Portfolio's Opportunity Queries",
            "Noted possible data changes or AI-side changes next to any sudden jump",
            "Checked Bing indexing and robots.txt",
            "Put the Search Console generative AI numbers and the Perplexity record in the same table",
            "Logged the pages fixed that month, with dates",
          ],
        },
        {
          heading: "For agencies and WordPress care companies",
          paragraphs: [
            "In monthly client reports, do not present AI Performance numbers as rankings or guaranteed results. Report facts: \"in Microsoft's AI this month, this page was a source this many times for these phrases\" and \"this is how it changed after we fixed that page\". Show them next to Google and other AI records.",
            "Making the export, the list of important uncited pages and the fix proposals part of the monthly work lets you combine maintenance and AI search visibility in one report. See [how agencies turn AI search work into a monthly service](/guide/agency-aeo-monthly-service), and the [partner page](https://nurevo.jp/partner/) for the partner program.",
          ],
        },
      ],
      faqs: [
        { q: "Where do I find AI Performance?", a: "Add your site to Bing Webmaster Tools, verify ownership, then open \"AI Performance\" from the menu. It started as a public preview on February 10, 2026, and later features were added as previews or beta." },
        { q: "Does it show citations in ChatGPT or Perplexity?", a: "No. It covers Microsoft Copilot, Bing's AI-generated summaries and select partner AI experiences. ChatGPT, Perplexity and Google's AI Overviews are not included, so check them separately, for example with Search Console and a fixed set of questions asked regularly." },
        { q: "Are grounding queries what users typed?", a: "No. They are short phrases the AI used to retrieve the content it cited, not the user's original prompt. Bing says the data shown is a sample of overall citation activity." },
        { q: "Can I see competitors in Citation Share?", a: "No. Citation Share is your share of all citations shown across all sites for one phrase. Bing says it does not expose competitor domains and is not traffic share or a quality score." },
        { q: "Can I see clicks or visits from AI?", a: "AI Performance has no click or traffic data. Look at visits from AI in your analytics referrers, such as copilot.microsoft.com." },
        { q: "Why did citations jump in June 2026?", a: "For the jumps seen from around June 1, 2026, a Microsoft product manager reportedly said it was a data backfill (secondhand report). Note it as a data change and compare periods of the same length." },
        { q: "Is there a setting that increases citations?", a: "What Bing points to is letting Bing read your site (robots.txt and other controls), telling it about updates with IndexNow, and keeping Bing Places listings accurate for local businesses. Nothing guarantees citations. The core is writing the facts customers need, accurately and clearly." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your site",
        body: "A free check with no sign-up shows the state of what AI reads: structured data, llms.txt and access for AI search crawlers. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Microsoft, Bing, Copilot, Bing Webmaster Tools, Bing Places, Google, Search Console, ChatGPT, OpenAI, Perplexity, WordPress and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
