// Content page: Wikipedia and Wikidata for AI search — whether a company
// should (or can) have a Wikipedia article, the notability and
// conflict-of-interest / paid-editing rules, what Wikidata is, how the Google
// knowledge panel relates, and what to do on the company's own site
// (Organization markup, sameAs) when there is no article. All industries.
// Separate from company-profile-page-ai-search (the about page itself) and
// agency-ai-search-manipulation-risks (refusing manipulative requests).
//
// Written 2026-11-24 20時 (JST).
//
// Outside facts and where they were read (2026-11-24):
// - Search Engine Roundtable, 2025-06-11 (reporting Profound's study):
//   30 million citations, Aug 2024–Jun 2025, ChatGPT / Google AI Overviews /
//   Perplexity; ChatGPT's top source Wikipedia at 47.9% (share among its top
//   sources); AI Overviews top source Reddit 21%, Wikipedia 5.7%; Perplexity
//   top source Reddit 46.7%.
// - Semrush, 2025-11-10: 230,000+ prompts weekly for 13 weeks (2025-07-14 to
//   2025-10-12), 100M+ citations, ChatGPT search / Google AI Mode /
//   Perplexity; Wikipedia in roughly 55% of ChatGPT responses falling to under
//   20% after mid-September 2025, still one of ChatGPT's two most-cited
//   domains with Reddit; about 2–3% of AI Mode responses; 0.8% of Perplexity.
//   Response share, not citation share — not comparable with Profound.
// - ja.wikipedia 「Wikipedia:特筆性 (組織)」 (calls itself a guideline):
//   notable when covered by secondary sources that are reliable and
//   independent; thin coverage needs several independent sources; trivial
//   coverage does not count; press releases, own publications, company
//   profiles, paid advertorials are primary; business hours notices, phone
//   numbers and addresses, directory listings (タウンページ) do not count;
//   size alone not a criterion; promotion is banned by official policy; chain
//   stores generally not notable; products usually merged into the company.
// - en.wikipedia "Conflict of interest" (behavioural guideline): COI editing
//   strongly discouraged; propose changes on talk pages ({{edit COI}});
//   new articles via Articles for Creation; paid editors must disclose
//   employer, client and affiliation; "you have no right to control its
//   content".
// - en.wikipedia "Wikipedia is not Crunchbase": existence, funding, routine
//   business activity (launches, executive changes, awards, listings) do not
//   make a company notable; founder-interview profiles are dependent sources.
// - Meta-Wiki, FAQ on paid contributions without disclosure (Wayback
//   2021-09-29) and the ja translation of the amendment: disclosure of
//   employer, client and affiliation required for any paid contribution to
//   any Wikimedia project; user page, talk page or edit summary; amount need
//   not be disclosed; in effect 2014-06-16 (Board approval 2014-04-25);
//   projects may adopt alternative disclosure policies by consensus.
// - Wikidata:Notability: the three criteria are summarised from secondary
//   sources (parse.gl 2026-11-20, uravation 2026-09-05) and the Help:Items
//   search snippet; the Wikidata pages themselves could not be fetched. The
//   article says so and tells readers to read the original.
// - Google knowledge panel help 9787176 (ja): panels created automatically
//   when enough information is on the open web; sources are public sources,
//   licensed data and content owners; Wikipedia not named. 7534902 (ja):
//   claim via search → "ナレッジパネルの認証を受ける" → sign in to YouTube,
//   Search Console, X (Twitter) or Facebook; not every panel can be claimed.
// - Google Organization structured data (ja): home page or a single page
//   describing the organization; no required properties; sameAs for pages on
//   other sites with more information about the organization.
// - Adobe Experience League, LLM Optimizer Wikipedia analysis (2026-08-06):
//   compares an existing article with up to six competitors; edits must be
//   made on Wikipedia itself.
// Not stated: Japanese Wikipedia's own COI page (not read), the share of
// companies whose articles are deleted, how any AI system weights Wikidata,
// timelines for Wikipedia or Wikidata changes reaching AI answers.
//
// Nurevo facts: plugin docs/developers.md (webmcp_canary_business_node filter
// with a sameAs example; with Yoast SEO, Rank Math, All in One SEO or Slim SEO
// the node is merged and their values win); the plugin does not create
// Wikipedia or Wikidata entries; free AI check monthly with three Perplexity
// questions; Pro (from ¥14,800 / USD 99) on Perplexity, ChatGPT once
// configured; 0.9.1 coexists with SEO SIMPLE PACK and VK All in One Expansion
// Unit.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  ser: "https://www.seroundtable.com/chatgpt-google-aio-sources-39578.html",
  semrush: "https://www.semrush.com/blog/most-cited-domains-ai/",
  jaOrg: "https://ja.wikipedia.org/wiki/Wikipedia:%E7%89%B9%E7%AD%86%E6%80%A7_%28%E7%B5%84%E7%B9%94%29",
  coi: "https://en.wikipedia.org/wiki/Wikipedia:Conflict_of_interest",
  crunchbase: "https://en.wikipedia.org/wiki/Wikipedia:Wikipedia_is_not_Crunchbase",
  paidFaq: "https://meta.wikimedia.org/wiki/Terms_of_use/FAQ_on_paid_contributions_without_disclosure",
  paidJa: "https://meta.wikimedia.org/wiki/Terms_of_use/Paid_contributions_amendment/ja",
  wdNotability: "https://www.wikidata.org/wiki/Wikidata:Notability",
  kg: "https://support.google.com/knowledgepanel/answer/9787176?hl=ja",
  kgEn: "https://support.google.com/knowledgepanel/answer/9787176?hl=en",
  claim: "https://support.google.com/knowledgepanel/answer/7534902?hl=ja",
  claimEn: "https://support.google.com/knowledgepanel/answer/7534902?hl=en",
  org: "https://developers.google.com/search/docs/appearance/structured-data/organization?hl=ja",
  orgEn: "https://developers.google.com/search/docs/appearance/structured-data/organization",
  adobe: "https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/opportunities/wikipedia-analysis",
};

const JSONLD = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://example.co.jp/#organization",
  "name": "株式会社サンプル",
  "alternateName": "Sample Inc.",
  "url": "https://example.co.jp/",
  "logo": "https://example.co.jp/logo.png",
  "foundingDate": "2012-04-01",
  "sameAs": [
    "https://www.linkedin.com/company/example",
    "https://www.youtube.com/@example",
    "https://www.wikidata.org/wiki/Q00000000"
  ]
}
</script>`;

const JSONLD_EN = JSONLD.replace("株式会社サンプル", "Sample Co., Ltd.");

const FILTER = `add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    // 会社が管理しているページと、実在する Wikidata の項目だけを入れる
    $node['sameAs'] = array(
        'https://www.linkedin.com/company/example',
        'https://www.wikidata.org/wiki/Q00000000',
    );
    return $node;
}, 10, 2);`;

const FILTER_EN = FILTER.replace("// 会社が管理しているページと、実在する Wikidata の項目だけを入れる", "// Only pages the company controls, and a Wikidata item that really exists");

export default {
  slug: "wikipedia-wikidata-ai-search",
  targetQueries: [
    "Wikipedia AI search visibility company page",
    "Wikidata for brands AI search",
    "should my company have a Wikipedia page ChatGPT",
    "Wikipedia 会社 記事 作成 AI検索",
    "Wikidata 企業 登録 AI",
    "ChatGPT Wikipedia 出典 会社",
  ],
  related: ["company-profile-page-ai-search", "how-to-appear-in-chatgpt", "agency-ai-search-manipulation-risks", "person-profile-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "Wikipedia・WikidataとAI検索：自社の記事は作るべきか | Nurevo",
      description: "ChatGPTはWikipediaを多く出典にしますが、自社の記事は基準を満たさないと作れず、自分で書くことも推奨されません。特筆性・有料編集の開示・Wikidata・自社サイトでできることを公式の規則で整理。",
      h1: "Wikipedia・WikidataとAI検索：自社の記事は作るべきか、載らない会社は何をすればいいか",
      lead: "ChatGPTの回答の出典として、Wikipediaはもっとも多く使われるサイトの1つです。ただし、会社の記事が作れるのは、会社と関係のない信頼できる媒体で取り上げられている（特筆性がある）場合だけで、社員や依頼を受けた人が自分で書くことは強く非推奨、報酬を受けて編集するなら開示が義務です。多くの中小企業にとって確かなのは、Wikipediaに記事を作ることではなく、自社サイトの会社概要と構造化データを正しい事実の置き場所にし、すでに記事がある場合は正しい手続きで間違いを直すことです。",
      intro: [
        "作成日：2026年11月24日（日本時間）。Wikipediaの規則は日本語版の「特筆性 (組織)」、英語版の「利益相反」、ウィキメディア財団の有料編集の決まりを同日に読んで確認しました。Wikidataの収録基準は原文のページを取得できなかったため、二次情報で要約しています。",
        "Wikipediaに記事があっても、AIの回答に会社が必ず出る・順位が上がるということはありません。AIの回答は日々変わり、出典の選び方も公表されていません。この記事は、AIに会社の事実を正しく伝えるための判断と手順をまとめたものです。",
      ],
      sections: [
        {
          heading: "AIはどれくらいWikipediaを出典にしているか",
          paragraphs: [
            "Wikipediaの影響はAIの種類によって大きく違い、時期によっても変わります。公開されている2つの調査を並べます。数え方が違うため、数字どうしを直接くらべることはできません。",
          ],
          table: {
            head: ["調査", "対象と期間", "Wikipediaについての結果"],
            rows: [
              ["Profound（Search Engine Roundtable の報道、2025-06-11）", "約3,000万件の引用、2024年8月〜2025年6月、ChatGPT・GoogleのAIによる概要・Perplexity", "ChatGPTでもっとも多い出典がWikipediaで、上位の出典の中で47.9%。AIによる概要では5.7%（1位はReddit 21%）。Perplexityの1位はReddit（46.7%）"],
              ["Semrush（2025-11-10）", "23万件超の質問を13週（2025年7月14日〜10月12日）、1億件超の引用、ChatGPT検索・GoogleのAIモード・Perplexity", "ChatGPTの回答のおよそ55%に出ていたが、2025年9月中旬から20%未満に。それでもRedditと並ぶChatGPTの2大出典。AIモードでは回答の約2〜3%、Perplexityでは0.8%"],
            ],
          },
          after: [
            `出典：[Search Engine Roundtable](${SRC.ser})、[Semrush](${SRC.semrush})。どちらも民間の調査で、質問の選び方によって結果は変わります。`,
            "読み取れるのは、ChatGPTでは出典として目立つ一方、GoogleのAIやPerplexityではそれほど大きくないこと、そして割合は数か月で大きく動くことです。「Wikipediaさえあれば大丈夫」とも「Wikipediaがないと出られない」とも言えません。",
            "また、ここで数えているのは「Wikipediaのページが出典として表示されたか」です。表示されたページが自社の記事とは限らず、業界や地域の一般的な記事であることがほとんどです。",
          ],
        },
        {
          heading: "自社はWikipediaに載る条件を満たすか：判定表",
          paragraphs: [
            `日本語版Wikipediaのガイドライン「特筆性 (組織)」は、会社や団体は「二次情報源で報道の対象となっている場合」に特筆性があるとしています。情報源は信頼でき、会社から独立している必要があり、取り上げ方が浅い場合は複数の独立した情報源が要ります（[Wikipedia:特筆性 (組織)](${SRC.jaOrg})）。特筆性は「有名」「重要」という意味ではなく、独立した媒体の「目に留まった」かどうかです。`,
          ],
          table: {
            head: ["手元にあるもの", "特筆性の根拠になるか", "理由"],
            rows: [
              ["新聞・雑誌・専門誌が、会社そのものを中心に取り上げた記事（複数）", "なりうる", "信頼でき、会社から独立した二次情報源"],
              ["プレスリリース、PR TIMESなどの配信記事", "ならない", "会社自身が出した一次情報源として扱われる"],
              ["自社サイト、会社案内、宣伝動画、社長の著書", "ならない", "会社自身の発行物"],
              ["お金を払って載せた記事・記事広告", "ならない", "独立していない"],
              ["電話帳・企業データベース・業界団体の名簿への掲載", "ならない", "電話番号や住所の掲載は取り上げではない"],
              ["新店オープン、新製品、役員交代、資金調達、受賞の短い報道", "ふつうはならない", "英語版の解説は、通常の事業活動の報道だけでは足りないとしている"],
              ["創業者へのインタビューをもとにした紹介記事", "ふつうはならない", "会社に依存した情報源とみなされる"],
              ["会社の規模、上場していること、店舗数", "それだけではならない", "規模だけを基準にしないとガイドラインが書いている"],
            ],
          },
          after: [
            `表の5行目までは「特筆性 (組織)」、6・7行目は英語版の解説ページ「Wikipedia is not Crunchbase」によります（[英語版](${SRC.crunchbase})）。チェーン店の各店舗は一般に特筆性がなく、製品やサービスは会社の記事にまとめるのが普通だともガイドラインは書いています。`,
            "地域の中小企業の多くは、地元紙で1回紹介された程度では基準に届きません。届かない会社が記事を作っても、削除の議論にかけられる可能性が高く、時間と信用を失います。",
          ],
        },
        {
          heading: "自分で書く・業者に頼む前に知っておく規則",
          paragraphs: [
            "条件を満たしそうでも、会社の人が自分で記事を書くのは規則上とても難しいことです。主な決まりは次の3つです。",
          ],
          list: [
            `宣伝は禁止：「特筆性 (組織)」は、宣伝活動はウィキペディアの公式な方針で禁止されていると書いています（[Wikipedia:特筆性 (組織)](${SRC.jaOrg})）。`,
            `利益相反の編集は強く非推奨：英語版のガイドラインは、自社に関係する記事を直接編集せず、記事のノート（トーク）ページで変更を提案するよう求めています。新しい記事は「Articles for Creation」で審査を受ける流れです。また「記事が作られたら、その内容を管理する権利はない」とはっきり書いています（[Wikipedia:Conflict of interest](${SRC.coi})）。`,
            `報酬を受けた編集は開示が義務：ウィキメディア財団の利用規約は、報酬を受けてウィキメディアのどのプロジェクトに投稿する場合も、雇用主・依頼主・関係を開示するよう定めています。開示の場所は利用者ページ、記事のノートページ、編集の要約欄のいずれかで、金額は開示しなくてよいとされています。この決まりは2014年6月16日に発効しました（[有料編集のFAQ](${SRC.paidFaq})、[改訂案の日本語訳](${SRC.paidJa})）。プロジェクトごとに合意で別の開示の方針を決めることもできるため、日本語版の運用もあわせて確かめてください。`,
          ],
          after: [
            "「Wikipediaの記事を作成します」「掲載を保証します」という業者もいますが、記事を残すか消すかを決めるのはWikipediaの編集者のコミュニティで、業者が保証できるものではありません。頼むなら、少なくとも次の3点を確かめてください。",
          ],
        },
        {
          heading: "作成代行を検討するときの確認表",
          table: {
            head: ["確かめること", "望ましい答え", "危ない答え"],
            rows: [
              ["報酬を受けていることを開示するか", "利用者ページなどで依頼主を開示する", "「開示しなくてもばれない」"],
              ["どう投稿するか", "下書きの審査やノートページでの提案を使う", "複数のアカウントで直接作る"],
              ["根拠になる記事", "独立した媒体の記事を事前に一覧にして見せる", "プレスリリースや自社サイトで足りると言う"],
              ["掲載の保証", "保証できないと説明する", "「必ず載る」「削除されたら作り直す」"],
              ["作った後の内容", "会社が内容を決められないことを説明する", "会社の望む文面にできると言う"],
            ],
          },
          after: [
            "開示しない有料編集が見つかると、記事への注意書きや削除、アカウントの停止につながることがあり、報道されれば会社の評判にも響きます。AI検索の対策として頼んだことが、かえって会社の情報を不安定にします。",
          ],
        },
        {
          heading: "すでに記事がある会社：間違いを直す手順",
          list: [
            "記事の間違い（古い所在地、退任した役員、終わった事業など）と、正しいことを示す公開の資料（登記の情報、新聞記事、決算公告など）を一覧にします。自社サイトだけを根拠にすると採用されにくくなります。",
            "記事を直接書き換えず、記事の「ノート」ページに、会社の関係者であることを書いたうえで、直してほしい箇所・正しい内容・出典を並べて提案します。英語版では {{edit COI}} というテンプレートで編集依頼を出す方法が案内されています。",
            "反映されなくても、何度も同じ依頼を出したり、別のアカウントで書き換えたりしないでください。ほかの編集者が判断するまで待ちます。",
            "直った内容と日付を記録し、自社サイトの会社概要も同じ事実になっているかを見直します。",
          ],
          after: [
            `既存の記事を競合とくらべて改善点を出すツールもあります（例：Adobe LLM OptimizerのWikipedia分析。記事があることが前提で、編集はWikipedia上で行う、と説明されています。[Adobe Experience League](${SRC.adobe})）。ツールが出す提案も、上の規則に沿って提案の形で出すことになります。`,
          ],
        },
        {
          heading: "Wikidataとは：Wikipediaより基準は広いが、宣伝の場ではない",
          paragraphs: [
            "Wikidataは、ウィキメディアが運営する構造化データのデータベースです。1つの物事が「項目」として Q で始まる番号を持ち、名前・説明・別名と、「設立日」「本社の所在地」「公式サイト」といった事実を文の形で持ちます。Wikipediaの記事がなくても項目を作れる場合があるため、「Wikipediaに載らない会社はWikidataを」と勧める記事が多くあります。",
            `ただしWikidataにも収録基準（[Wikidata:Notability](${SRC.wdNotability})）があります。今回は原文のページを取得できなかったため、二次情報による要約ですが、項目は次のどれかを満たす必要があるとされています。①ウィキメディアのプロジェクト（Wikipediaなど）のページとつながっている、②信頼できる公開の資料で説明できる、はっきり識別できる実体である、③ほかの項目の記述に構造上必要である。登録する前に必ず原文を読んでください。`,
          ],
          list: [
            "Wikidataも報酬を受けた投稿の開示の対象です（利用規約はウィキメディアのすべてのプロジェクトに適用されます）。",
            "公式サイトだけを出典にした項目より、登記や報道など公開の資料を出典にした項目のほうが残りやすくなります。",
            "同じ会社の項目がすでにないか、社名・英語名・旧社名で先に検索します。重複を作らないことが大切です。",
            "AIがWikidataをどの程度使っているかを公表しているAIの会社はありません。項目を作ればAIに出る、という関係は確かめられていません。",
          ],
        },
        {
          heading: "Googleのナレッジパネルとの関係",
          paragraphs: [
            `Googleの検索結果の右側に出る会社の情報の枠（ナレッジパネル）は、オープンウェブに十分な情報があると、Googleのアルゴリズムが自動で作るとGoogleは説明しています。情報の出どころは、公開されている情報源、データ提供者との契約、内容の持ち主（会社など）からの情報だとしており、このヘルプにWikipediaの名前は出てきません（[Googleのナレッジグラフの仕組み](${SRC.kg})）。`,
            `パネルが出ている会社は、Googleで自社を検索し、パネルの「ナレッジパネルの認証を受ける」から、YouTube・Search Console・X（Twitter）・Facebookの公式アカウントにログインして本人確認をすると、変更を提案できるようになります。すべてのパネルが認証できるわけではありません（[Google の認証を受ける](${SRC.claim})）。誰でもパネルの「フィードバック」から間違いを報告できます。`,
          ],
        },
        {
          heading: "4つの置き場所の比較",
          table: {
            head: ["置き場所", "誰が書くか", "載る条件", "会社が自分で直せるか", "AIでの使われ方"],
            rows: [
              ["自社サイト（会社概要・構造化データ）", "会社", "なし", "直せる", "ウェブ検索で読まれ、出典にもなる"],
              ["Wikipedia", "独立した編集者", "特筆性（独立した二次情報源）", "直接は直さず、ノートで提案", "ChatGPTでは目立つ出典。割合は時期で変わる"],
              ["Wikidata", "編集者（会社も開示すれば参加できる）", "Wikidataの収録基準", "規則に沿って編集できるが、ほかの編集者も直す", "公表された説明はない"],
              ["Googleのナレッジパネル", "Googleが自動で作る", "ウェブ上の十分な情報", "認証すれば変更を提案できる", "Googleが情報をどこまでAIの回答に使うかは公表されていない"],
            ],
          },
          after: [
            "どの会社でも、今日から確実に直せるのは自社サイトだけです。Wikipediaがある会社もない会社も、ほかの3つが参照できる「正しい事実」をまず自社サイトに置くことが土台になります。",
          ],
        },
        {
          heading: "Wikipediaがなくても自社サイトでできること",
          list: [
            "会社概要のページに、正式な社名・英語表記・旧社名・設立年月日・所在地・代表者・事業内容を文字で書きます。書き方は[会社概要ページのAI検索対策](/guide/company-profile-page-ai-search)にまとめています。",
            "トップページか会社概要のページに、Organization の構造化データを置きます。Googleは必須の項目はないとしたうえで、ホームページか組織を説明する1つのページに置くことを勧めています。",
            "sameAs には、その会社の情報が載っている別のサイトのURLを並べます。入れるのは会社が管理している公式アカウントや、自社を指していることが確かなページだけです。Wikidataの項目やWikipediaの記事は、実在して内容が正しい場合にだけ入れます。",
            "新聞や専門誌に取り上げられたら、サイトの「掲載実績」に媒体名・日付・記事へのリンクを書きます。AIにとっても、Wikipediaの編集者にとっても、独立した情報源を見つける手がかりになります。",
          ],
          code: JSONLD,
          after: [
            `上の例の Q00000000 は書き方の見本です。実在しない番号や他社の項目を入れないでください（[Google：組織の構造化データ](${SRC.org})）。`,
          ],
        },
        {
          heading: "WordPressでの手順",
          list: [
            "使っているSEOプラグイン（Yoast SEO、Rank Math、SEO SIMPLE PACKなど）やテーマが Organization を出しているか、ページのソースで application/ld+json を探して確かめます。SNSのURLの欄があれば、そこに公式アカウントを入れます。",
            "Nurevo AEO（無料のWordPressプラグイン）は会社・店舗の構造化データを出しますが、Wikipediaの記事やWikidataの項目を作ったり、自動で探したりはしません。WikidataのURLなどを sameAs に足したいときは、開発者向けのフィルター webmcp_canary_business_node を使います。",
            "Yoast SEO・Rank Math・All in One SEO・Slim SEOが有効な場合、このフィルターの値はそれらのプラグインの会社の情報にまとめられ、プラグインがすでに出している値が優先されます。0.9.1からはSEO SIMPLE PACK・VK All in One Expansion Unitと一緒に使っても構造化データは重複しません。",
            `入れたら、ページのソースで sameAs が1か所にまとまって出ているかを確かめます。[WordPress.orgで入手](${WP_ORG})`,
          ],
          code: FILTER,
        },
        {
          heading: "確かめ方",
          list: [
            "ChatGPT・Perplexity・GoogleのAIモードに「（社名）はどんな会社？」「（社名）の設立は？」と聞き、答えと出典のURLを日付付きで記録します。間違いがあれば、その出典がWikipediaか、ほかのサイトかを見ます。",
            "Wikipediaで社名・旧社名・英語名を検索し、記事の有無と内容を確かめます。同名の別の会社の記事と混ざっていないかも見ます。",
            "Wikidataで同じように検索し、項目があれば、公式サイトのURL・設立日・所在地が正しいかを見ます。",
            "AIの回答は日によって変わるため、同じ質問を毎月同じ日に聞きます。決めた質問のセットで記録する方法は[AIでの登場率の測り方](/guide/measure-ai-visibility)にあります。",
            "Nurevo AEOの無料のAIチェックは、接続したサイトに月1回、業種と地域から作った3つの質問をPerplexityに聞きます。継続して測るPro（月14,800円〜）も現在はPerplexityで測っています（ChatGPTは設定され次第）。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "自社を中心に取り上げた独立した媒体の記事を一覧にした",
            "プレスリリース・自社サイト・名簿への掲載を根拠に数えていない",
            "基準に届かないなら、Wikipediaの記事を作らないと決めた",
            "作成代行に頼むなら、開示・投稿の方法・保証しないことを確かめた",
            "既存の記事の間違いは、ノートページで出典付きで提案した",
            "Wikidataで重複がないか、社名・英語名・旧社名で検索した",
            "Wikidataの収録基準を原文で読んだ",
            "会社概要のページに、社名・設立・所在地などを文字で書いた",
            "Organization の構造化データの sameAs に、管理しているページと実在する項目だけを入れた",
            "AIへの質問と答え・出典を、日付を付けて記録した",
          ],
        },
        {
          heading: "制作会社がお客様に「Wikipediaを作って」と頼まれたら",
          paragraphs: [
            "お客様のためにWikipediaの記事を書くことは、報酬を受けた編集にあたり、開示が必要で、直接の作成も勧められていません。多くの場合は、特筆性の判定表でお客様の手元の記事を一緒に確かめ、届かなければ会社概要と構造化データの整備、掲載実績のページ作りを提案するほうが、確実で説明もしやすくなります。",
            "頼まれた施策が規則に触れそうなときの判断と断り方は[AI検索の不正な手法を頼まれたら](/guide/agency-ai-search-manipulation-risks)にまとめています。AI検索の整備を月額の保守に入れる方法は[パートナーのページ](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "Wikipediaに会社の記事がないと、ChatGPTに出られませんか？", a: "そうとは言えません。ChatGPTはWikipediaを多く出典にしますが、会社の情報は自社サイトや報道、口コミのサイトなど、ほかのページからも読まれます。GoogleのAIやPerplexityでは、Wikipediaの割合はさらに小さいという調査があります。" },
        { q: "自社の記事を社員が書いてもいいですか？", a: "勧められません。英語版のガイドラインは利益相反の編集を強く非推奨とし、ノートページでの提案を求めています。仕事として書くなら、報酬を受けた編集として雇用主などの開示も必要です。" },
        { q: "プレスリリースをたくさん出せば、特筆性はできますか？", a: "できません。プレスリリースは会社自身が出した一次情報源とされ、特筆性の根拠になりません。独立した媒体が会社そのものを取り上げた記事が必要です。" },
        { q: "Wikidataなら自由に会社を登録できますか？", a: "自由ではありません。Wikidataにも収録基準があり、信頼できる公開の資料で説明できることなどが求められます。報酬を受けた投稿の開示の決まりも適用されます。" },
        { q: "Wikipediaの記事の内容が間違っています。直してもいいですか？", a: "直接書き換えず、記事のノートページで、関係者であることを書いたうえで、正しい内容と出典を示して提案してください。判断はほかの編集者が行います。" },
        { q: "Googleのナレッジパネルを出すにはWikipediaが必要ですか？", a: "Googleのヘルプは、オープンウェブに十分な情報があるとパネルが自動で作られると説明しており、Wikipediaが必要とは書いていません。パネルが出ていれば、認証して変更を提案できます。" },
        { q: "構造化データの sameAs にWikipediaのURLを入れていいですか？", a: "自社の記事が実在し、内容が正しい場合は入れてかまいません。業界の一般的な記事や同名の他社の記事、作られていない項目は入れないでください。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの会社のサイトを読めるか確認",
        body: "登録不要の無料チェックで、会社の構造化データ、llms.txt、AI検索のクローラーの許可の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "Wikipedia、Wikidata、ウィキペディアはWikimedia Foundationの商標または登録商標です。Google、Search Console、YouTube、ChatGPT、OpenAI、Perplexity、Semrush、Profound、Adobe、X、Facebook、LinkedIn、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの団体・企業と提携・協賛関係にありません。",
    },

    en: {
      title: "Wikipedia and Wikidata for AI Search: Do You Need a Page? | Nurevo",
      description: "ChatGPT cites Wikipedia often, but a company article needs independent coverage and writing your own is discouraged. The rules, Wikidata, and what to do on your site.",
      h1: "Wikipedia and Wikidata for AI search: should your company have an article, and what to do if it doesn't qualify",
      lead: "Wikipedia is one of the sources ChatGPT cites most. But a company article is only appropriate when the company has been covered by reliable sources independent of it (notability), editing your own article is strongly discouraged, and paid editing must be disclosed. For most small and mid-sized businesses, the dependable move is not getting a Wikipedia article: it is making your own site's about page and structured data the place where the correct facts live, and, if an article already exists, fixing errors through the proper process.",
      intro: [
        "Written November 24, 2026 (JST). The Wikipedia rules were checked that day against the Japanese Wikipedia guideline on organization notability, the English Wikipedia conflict-of-interest guideline and the Wikimedia Foundation's paid-contribution rules. The Wikidata notability page could not be fetched, so its criteria are summarized from secondary sources.",
        "Having a Wikipedia article does not guarantee that AI answers will mention your company or rank it higher. AI answers change daily, and how sources are chosen is not published. This guide covers the decisions and steps for getting your company's facts across to AI correctly.",
      ],
      sections: [
        {
          heading: "How often AI cites Wikipedia",
          paragraphs: [
            "Wikipedia's weight differs a lot between AI systems and changes over time. Here are two public studies side by side. They count differently, so their numbers cannot be compared directly.",
          ],
          table: {
            head: ["Study", "Scope and period", "Findings on Wikipedia"],
            rows: [
              ["Profound (reported by Search Engine Roundtable, 2025-06-11)", "About 30 million citations, August 2024 to June 2025; ChatGPT, Google AI Overviews, Perplexity", "Wikipedia was ChatGPT's top source, 47.9% among its top sources. In AI Overviews, 5.7% (Reddit led at 21%). Perplexity's top source was Reddit (46.7%)"],
              ["Semrush (2025-11-10)", "230,000+ prompts for 13 weeks (July 14 to October 12, 2025), 100M+ citations; ChatGPT search, Google AI Mode, Perplexity", "Appeared in roughly 55% of ChatGPT responses, falling below 20% from mid-September 2025, yet still one of ChatGPT's two most-cited domains with Reddit. About 2–3% of AI Mode responses; 0.8% on Perplexity"],
            ],
          },
          after: [
            `Sources: [Search Engine Roundtable](${SRC.ser}), [Semrush](${SRC.semrush}). Both are commercial studies, and results depend on which prompts are chosen.`,
            "What you can take from them: Wikipedia stands out as a ChatGPT source, matters much less in Google's AI features and Perplexity, and its share can swing within months. Neither \"a Wikipedia article is all you need\" nor \"without Wikipedia you can't appear\" holds.",
            "These studies count whether a Wikipedia page was shown as a source. The page shown is usually a general article about a topic or place, not a company's own article.",
          ],
        },
        {
          heading: "Does your company qualify? A quick test",
          paragraphs: [
            `The Japanese Wikipedia guideline on organization notability says companies and organizations are notable when they have been covered by secondary sources. Those sources must be reliable and independent of the company, and thin coverage needs several independent sources ([Japanese Wikipedia: notability (organizations)](${SRC.jaOrg})). Notability does not mean "famous" or "important". It means independent publications have taken notice.`,
          ],
          table: {
            head: ["What you have", "Counts toward notability?", "Why"],
            rows: [
              ["Several newspaper, magazine or trade-press articles about the company itself", "Can count", "Reliable secondary sources independent of the company"],
              ["Press releases, wire-distributed announcements", "No", "Treated as primary sources from the company itself"],
              ["Your website, brochure, promotional video, the founder's book", "No", "The company's own publications"],
              ["Paid placements and advertorials", "No", "Not independent"],
              ["Directory, database or trade-association listings", "No", "Listing a phone number or address is not coverage"],
              ["Short reports of openings, launches, executive changes, funding or awards", "Usually not", "English Wikipedia's essay says routine business news is not enough"],
              ["Profiles based on interviews with the founder", "Usually not", "Considered dependent on the company"],
              ["Size, being listed on a stock exchange, number of locations", "Not by itself", "The guideline says size alone is not a criterion"],
            ],
          },
          after: [
            `Rows one to five come from the Japanese guideline; rows six and seven from the English essay "Wikipedia is not Crunchbase" ([English Wikipedia](${SRC.crunchbase})). The guideline also says individual branches of a chain are generally not notable, and products and services usually belong in the company's article.`,
            "Most local small businesses do not meet the bar with one feature in the local paper. An article created without enough coverage is likely to be nominated for deletion, which costs time and credibility.",
          ],
        },
        {
          heading: "Rules to know before writing it yourself or hiring someone",
          paragraphs: [
            "Even when a company might qualify, writing its own article is very hard to do within the rules. Three rules matter most.",
          ],
          list: [
            `No promotion: the Japanese guideline states that promotional activity is prohibited by Wikipedia's official policy ([Japanese Wikipedia: notability (organizations)](${SRC.jaOrg})).`,
            `Conflict-of-interest editing is strongly discouraged: the English guideline asks people connected to a subject not to edit its article directly and to propose changes on the article's talk page. New articles are meant to go through Articles for Creation review. It also says plainly that once an article about your company exists, you have no right to control its content ([Wikipedia: Conflict of interest](${SRC.coi})).`,
            `Paid editing must be disclosed: the Wikimedia Foundation's Terms of Use require anyone paid to contribute to any Wikimedia project to disclose their employer, client and affiliation, on their user page, the article's talk page or in the edit summary. The amount paid need not be disclosed. The rule took effect on June 16, 2014 ([FAQ on paid contributions](${SRC.paidFaq})). Individual projects can adopt an alternative disclosure policy by consensus, so check the rules of the language edition you are dealing with.`,
          ],
          after: [
            "Some services offer to \"create your Wikipedia page\" or \"guarantee\" it. Whether an article stays is decided by Wikipedia's volunteer community, so no vendor can guarantee it. If you do hire someone, check at least the points below.",
          ],
        },
        {
          heading: "Checklist for evaluating a Wikipedia writing service",
          table: {
            head: ["Ask", "Good answer", "Red flag"],
            rows: [
              ["Will you disclose that you are paid?", "Yes, on the user page and talk page, naming the client", "\"Nobody will notice\""],
              ["How will you submit it?", "Through draft review or talk-page requests", "Creating it directly, from several accounts"],
              ["What sources will support it?", "A list of independent articles, shown in advance", "Says press releases or your website are enough"],
              ["Is publication guaranteed?", "Explains that it cannot be guaranteed", "\"Guaranteed\" or \"we'll recreate it if deleted\""],
              ["Who controls the content afterwards?", "Explains that the company does not", "Promises wording you approve"],
            ],
          },
          after: [
            "Undisclosed paid editing, once found, can lead to warning tags, deletion and blocked accounts, and media coverage of it hurts the company's reputation. Something bought as an AI search tactic ends up making your company's information less stable.",
          ],
        },
        {
          heading: "If an article already exists: how to fix errors",
          list: [
            "List each error (old address, departed executives, discontinued businesses) and public evidence of the correct fact: registry records, news articles, published financial notices. Your own website alone is weak evidence.",
            "Do not edit the article. On its talk page, state that you are connected to the company and list the passage, the correct fact and the source. English Wikipedia offers an {{edit COI}} template for these requests.",
            "If nothing changes, do not repeat the request or edit from another account. Wait for other editors to decide.",
            "Record what was corrected and when, and confirm that your own about page states the same facts.",
          ],
          after: [
            `Some tools compare an existing article with competitors' and suggest improvements, such as Adobe LLM Optimizer's Wikipedia analysis, which requires an existing article and notes that edits are made on Wikipedia itself ([Adobe Experience League](${SRC.adobe})). Any suggestions still have to go through the process above.`,
          ],
        },
        {
          heading: "What Wikidata is: a lower bar than Wikipedia, but not a promotion channel",
          paragraphs: [
            "Wikidata is Wikimedia's structured-data database. Each thing is an item with an ID starting with Q, holding a label, description and aliases, plus facts stated as claims such as inception date, headquarters location and official website. Because an item can sometimes exist without a Wikipedia article, many guides suggest Wikidata to companies that don't qualify for Wikipedia.",
            `Wikidata has its own notability policy ([Wikidata:Notability](${SRC.wdNotability})). We could not fetch the original page this time, so this is a summary from secondary sources: an item should meet at least one of three criteria. (1) It links to a page on a Wikimedia project such as Wikipedia. (2) It refers to a clearly identifiable entity that can be described using serious, publicly available references. (3) It fulfills a structural need, making other items' statements more useful. Read the original before creating anything.`,
          ],
          list: [
            "Paid-contribution disclosure applies to Wikidata too: the Terms of Use cover all Wikimedia projects.",
            "Items referenced to public records and press coverage hold up better than items referenced only to the company's site.",
            "Search first by company name, English name and former names, so that you don't create a duplicate.",
            "No AI company has published how much it uses Wikidata. That creating an item makes you appear in AI answers has not been shown.",
          ],
        },
        {
          heading: "How Google's knowledge panel fits in",
          paragraphs: [
            `Google says knowledge panels are created automatically by its algorithms when enough information is available on the open web. It describes the sources as publicly available information, licensed data and content owners themselves; Wikipedia is not named on that help page ([How Google's Knowledge Graph works](${SRC.kgEn})).`,
            `If your company has a panel, search for it on Google, choose "Claim this knowledge panel" and sign in to an official YouTube, Search Console, X (Twitter) or Facebook account to verify. You can then suggest changes. Not every panel can be claimed yet ([Get verified on Google](${SRC.claimEn})). Anyone can report errors through the panel's Feedback link.`,
          ],
        },
        {
          heading: "Comparing the four places your facts live",
          table: {
            head: ["Place", "Who writes it", "Entry bar", "Can the company fix it?", "Role in AI"],
            rows: [
              ["Your site (about page, structured data)", "The company", "None", "Yes", "Read via web search and cited as a source"],
              ["Wikipedia", "Independent editors", "Notability (independent secondary sources)", "Not directly; propose on the talk page", "A prominent ChatGPT source; share changes over time"],
              ["Wikidata", "Editors (the company can take part with disclosure)", "Wikidata notability policy", "Editable within the rules, but others edit too", "No published explanation"],
              ["Google knowledge panel", "Generated automatically by Google", "Enough information on the web", "Suggest changes once verified", "How far Google uses it in AI answers is not published"],
            ],
          },
          after: [
            "The only one any company can reliably fix today is its own site. Whether or not you have a Wikipedia article, the foundation is putting the correct facts on your site, where the other three can find them.",
          ],
        },
        {
          heading: "What you can do on your own site without Wikipedia",
          list: [
            "State your legal name, name in other languages, former names, founding date, address, representative and business lines as text on your about page. See [about pages for AI search](/guide/company-profile-page-ai-search).",
            "Add Organization structured data to the home page or the about page. Google says no property is required and recommends placing it on the home page or a single page that describes the organization.",
            "In sameAs, list URLs on other sites that hold information about your company. Include only official accounts you control and pages that definitely refer to you. Add a Wikidata item or Wikipedia article only if it exists and is correct.",
            "When newspapers or trade publications cover you, list the outlet, date and link on a press or media page. It helps AI and Wikipedia editors alike find independent sources.",
          ],
          code: JSONLD_EN,
          after: [
            `Q00000000 above is a placeholder. Never insert an ID that doesn't exist or belongs to another company ([Google: Organization structured data](${SRC.orgEn})).`,
          ],
        },
        {
          heading: "Steps in WordPress",
          list: [
            "Check whether your SEO plugin (Yoast SEO, Rank Math and others) or theme already outputs Organization: look for application/ld+json in the page source. If it has fields for social profiles, enter your official accounts there.",
            "Nurevo AEO (a free WordPress plugin) outputs business structured data, but it does not create Wikipedia articles or Wikidata items, or look them up automatically. To add a Wikidata URL or similar to sameAs, use the developer filter webmcp_canary_business_node.",
            "With Yoast SEO, Rank Math, All in One SEO or Slim SEO active, the filter's values are merged into that plugin's business node, and values the plugin already sets win. From 0.9.1, Nurevo also runs alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            `Afterwards, check the page source to confirm that sameAs appears once, in one place. [Get it on WordPress.org](${WP_ORG})`,
          ],
          code: FILTER_EN,
        },
        {
          heading: "How to check",
          list: [
            "Ask ChatGPT, Perplexity and Google AI Mode \"What is (company)?\" and \"When was (company) founded?\", and log the answers and cited URLs with the date. If something is wrong, note whether the source is Wikipedia or another site.",
            "Search Wikipedia for your name, former names and names in other languages. Check whether an article exists, what it says, and whether it mixes you up with a namesake.",
            "Search Wikidata the same way. If there is an item, check the official website, founding date and location.",
            "AI answers change from day to day, so ask the same questions on the same day each month. [Measuring AI visibility](/guide/measure-ai-visibility) explains logging a fixed question set.",
            "Nurevo AEO's free AI check asks Perplexity three questions built from your industry and area once a month for connected sites. Pro (from USD 99/month), for ongoing measurement, currently measures on Perplexity too (ChatGPT once configured).",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "Listed independent articles that cover the company itself",
            "Did not count press releases, your own site or directory listings",
            "If you don't meet the bar, decided not to create a Wikipedia article",
            "If hiring a writer, confirmed disclosure, submission method and no guarantee",
            "Proposed corrections to an existing article on its talk page, with sources",
            "Searched Wikidata for duplicates by name, English name and former names",
            "Read Wikidata's notability policy in the original",
            "Stated name, founding date, address and similar facts as text on the about page",
            "Put only pages you control and items that exist in Organization sameAs",
            "Logged AI questions, answers and sources with dates",
          ],
        },
        {
          heading: "When a client asks your agency to \"get us on Wikipedia\"",
          paragraphs: [
            "Writing a client's Wikipedia article is paid editing: it requires disclosure, and creating the article directly is discouraged. Usually it works better to go through the notability test with the client's coverage, and if it falls short, propose cleaning up the about page and structured data and building a press page instead. That is more dependable and easier to explain.",
            "For judging requests that may break the rules and how to decline them, see [when clients ask for AI search manipulation](/guide/agency-ai-search-manipulation-risks). To add AI search work to monthly maintenance, see the [partner page](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "Can my company appear in ChatGPT without a Wikipedia article?", a: "Yes, that is possible. ChatGPT cites Wikipedia often, but company facts are also read from your own site, news coverage, review sites and other pages. Studies find Wikipedia's share even smaller in Google's AI features and Perplexity." },
        { q: "Can an employee write our company's article?", a: "It is not recommended. English Wikipedia strongly discourages conflict-of-interest editing and asks for talk-page proposals instead. If it is part of someone's job, it is also paid editing and the employer must be disclosed." },
        { q: "Will lots of press releases make us notable?", a: "No. Press releases are primary sources from the company and don't count. You need independent publications covering the company itself." },
        { q: "Can we register our company freely on Wikidata?", a: "Not freely. Wikidata has a notability policy, including being describable with serious, publicly available references, and the paid-contribution disclosure rules apply." },
        { q: "Our Wikipedia article has an error. Can we fix it?", a: "Don't edit it directly. On the article's talk page, say you are connected to the company and propose the correct fact with a source. Other editors decide." },
        { q: "Do we need Wikipedia to get a Google knowledge panel?", a: "Google's help says panels are created automatically when there is enough information on the open web and does not say Wikipedia is required. If a panel exists, you can claim it and suggest changes." },
        { q: "Can we put our Wikipedia URL in sameAs?", a: "Yes, if your article exists and is accurate. Don't add general topic articles, a namesake's article, or items that don't exist." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your company site",
        body: "A free check with no sign-up shows the state of your company structured data, llms.txt and access for AI search crawlers. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Wikipedia and Wikidata are trademarks of the Wikimedia Foundation. Google, Search Console, YouTube, ChatGPT, OpenAI, Perplexity, Semrush, Profound, Adobe, X, Facebook, LinkedIn, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit, WordPress and their product names are trademarks of their respective owners. Nurevo is not affiliated with these organizations.",
    },
  },
};
