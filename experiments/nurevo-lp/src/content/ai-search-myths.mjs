// Content page: common misconceptions about AI search optimization (AEO /
// GEO / LLMO), each checked against a primary source, with how strong the
// evidence is, how to check it yourself, and one sentence an agency can say
// to a client. Agency-facing (explaining AI search to clients) but readable
// by business owners. Companion to agency-aeo-monthly-service (service
// design) and the proposal/audit guide (sales step); this page answers the
// "is it true that...?" questions clients bring.
//
// Written 2026-11-13 (JST). Outside facts, and where they were checked. On
// 2026-11-13 the Google, OpenAI, Perplexity and Ahrefs pages could not be
// re-fetched from this environment (permission timeout), so every outside
// fact below is one already checked on the official page for another guide
// on this site, with that date. Re-check them when this page is updated.
//   - Google "Optimizing for generative AI features" (updated 2026-07-10,
//     read 2026-11-02 for agency-aeo-proposal-audit): built on core Search,
//     still SEO; page must be indexed and eligible for a snippet; no new
//     machine-readable or AI text files needed; Google Search ignores
//     llms.txt; no special schema.org markup; no third-party tool has access
//     to Google's internal ranking or AI systems.
//   - Google "Do you need an SEO?" and "Third-party SEO tools and advice"
//     (both updated 2026-06-05, read 2026-11-02): no one can guarantee a #1
//     ranking; claims of improvement in AI experiences should be evaluated
//     carefully.
//   - Google "AI features and your website" (read 2026-10-31 / 2026-11-10):
//     no special optimization; structured data should match visible text;
//     keep Business Profile information up to date.
//   - OpenAI crawlers overview (read 2026-10-31): sites that opt out of
//     OAI-SearchBot are not shown in ChatGPT search answers; GPTBot is a
//     separate (training) crawler. Perplexity crawlers page (read 2026-10-31):
//     PerplexityBot and Perplexity-User.
//   - Search Console Help, Generative AI performance report and the Search
//     generative AI control (read 2026-11-10): impressions only; excluding
//     the site removes links and content from those AI features.
//   - Google AI Overviews feedback (Search Help 14901683, read 2026-11-12).
// Deliberately not used: vendor statistics in top-ranking articles (Ahrefs,
// Semrush, Superlines and others) - their pages could not be opened to check
// method and numbers; Google's wording on "chunking" (only seen second-hand).
// Nurevo facts: aeo-signals-ai-answers-study (62 businesses, Perplexity,
// 2026-10-24), research-japan-web-agencies-ai-search-2026 (2,357 sites,
// November 2026), plugin readme.txt 0.9.1 (training crawlers left to
// robots.txt; blocking them does not affect AI search or the score; fills
// blanks only), measure-ai-visibility (free AI check, Pro on Perplexity).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  aiGuide: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  aiGuideJa: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide?hl=ja",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  hireSeo: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo",
  hireSeoJa: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo?hl=ja",
  thirdParty: "https://developers.google.com/search/docs/fundamentals/third-party-seo",
  thirdPartyJa: "https://developers.google.com/search/docs/fundamentals/third-party-seo?hl=ja",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  perplexityBots: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  gscReportJa: "https://support.google.com/webmasters/answer/16984139?hl=ja",
  gscReportEn: "https://support.google.com/webmasters/answer/16984139?hl=en",
  aioHelpJa: "https://support.google.com/websearch/answer/14901683?hl=ja",
  aioHelpEn: "https://support.google.com/websearch/answer/14901683?hl=en",
  llmstxt: "https://llmstxt.org/",
  richResults: "https://search.google.com/test/rich-results",
};

export default {
  slug: "ai-search-myths",
  targetQueries: [
    "AEO myths",
    "GEO myths debunked llms.txt schema",
    "AI search optimization misconceptions",
    "AI検索対策 誤解",
    "LLMO 意味ない 本当",
    "llms.txt 効果 ない",
  ],
  related: ["aeo-vs-seo-vs-geo", "llms-txt", "measure-ai-visibility", "aeo-signals-ai-answers-study", "agency-aeo-monthly-service"],
  locales: {
    ja: {
      title: "AI検索対策のよくある誤解12個と、公式情報で確かめた事実 | Nurevo",
      description: "「llms.txtを置けばAIに出る」「AI専用の構造化データがある」などAI検索対策（AEO・LLMO）の誤解12個を、Google・OpenAIの公式情報と当社の調査で確かめ、お客様への説明例と確認手順をまとめました。",
      h1: "AI検索対策（AEO・LLMO・GEO）のよくある誤解12個：公式情報と調査で確かめた「本当のところ」と、お客様への説明のしかた",
      lead: "AI検索対策の誤解の多くは、「AI専用の特別な施策がある」「何かを置けばAIに出る」「AIにも順位がある」の3つの思い込みから生まれています。Googleは生成AI機能のための最適化もSEOであり、AI専用のファイルやマークアップは要らないと説明しています。実際にできるのは、AIが読む事実をサイトと掲載情報でそろえ、AIのクローラを止めず、決めた質問で見え方を繰り返し確かめることです。",
      intro: [
        "作成日：2026年11月13日。Google・OpenAI・Perplexityの説明は、当サイトの各ガイドを作成した際（2026年10月31日〜11月12日）に公式ページで確認したもので、本文の各所に確認先のリンクを付けています。仕様は変わることがあるため、お客様に説明する前に最新の公式ページもご確認ください。",
        "この記事は、制作会社・SEO会社・MEO会社の担当者が、お客様から「〜って本当？」と聞かれたときにそのまま使えるよう、誤解ごとに「実際」「根拠の強さ」「自分で確かめる方法」「お客様への一言」をまとめたものです。事業者の方がご自身で判断するときにも使えます。なお、AIの回答は質問のたびに変わり、どんな対策でも、AIに必ず表示されることや順位を保証することはできません。",
      ],
      sections: [
        {
          heading: "早見表：12の誤解と、根拠の強さ",
          paragraphs: [
            "「根拠の強さ」は、次の3段階で示しています。公式＝Google・OpenAIなど、その仕組みを運営する会社が自社のページで説明していること。当社調査＝Nurevoが自分で測った結果（条件つき）。説明なし＝公式の説明が見当たらず、誰も確かなことを言えないこと。お客様への説明では、この区別をそのまま伝えるのがいちばん誠実です。",
          ],
          table: {
            head: ["よくある誤解", "実際", "根拠の強さ"],
            rows: [
              ["1. AI検索対策はSEOとは別物で、専用の新しい施策が要る", "GoogleはAI機能向けの最適化もSEOだと説明している", "公式（Google）"],
              ["2. AIの時代なので、もうSEOはいらない", "GoogleのAI機能に出るには、ページがインデックスされ、スニペット表示の対象であることが前提", "公式（Google）"],
              ["3. llms.txtを置けばAIに出る", "Google検索はllms.txtを使わない。他のAIでも効果を示す公式の説明はない", "公式（Google）＋当社調査"],
              ["4. AI専用の特別な構造化データがある", "AI専用のマークアップはない。通常の構造化データを表示内容と一致させる", "公式（Google）"],
              ["5. AI対応のスコアを満点にすればAIに出る", "当社の調査（62件）では、サイト側のスコアと登場率に関係は見られなかった", "当社調査"],
              ["6. AIのクローラはまとめてブロックしておけば安全", "AI検索用のクローラを止めると、その検索に出られなくなる。学習用とは別に判断する", "公式（OpenAI）"],
              ["7. AIの回答にも1位があり、保証できる", "1位の保証はできないとGoogle自身が書いている。AIの回答は質問ごとに変わる", "公式（Google）"],
              ["8. 1回聞いて出なければ、対策は失敗", "1回の結果は偶然に左右される。同じ質問を同じ条件で繰り返して割合で見る", "当社の計測方法"],
              ["9. ツールを使えばAIの内部の評価がわかる", "第三者のツールはGoogleの内部の仕組みにアクセスできない", "公式（Google）"],
              ["10. サイトを直せば、すぐAIの答えが変わる／AI会社に頼めば直してもらえる", "反映までの期間は公式に示されていない。回答を直接書き換えてもらう窓口も確認できない", "説明なし"],
              ["11. Search ConsoleでAIからのクリックや順位がわかる", "生成AIのレポートでわかるのは表示回数。ChatGPTやPerplexityは対象外", "公式（Google）"],
              ["12. 店舗や地域の会社は、サイトだけ整えればよい", "GoogleはビジネスプロフィールをAI機能のために最新に保つよう勧めている", "公式（Google）"],
            ],
            caption: "根拠のリンクは、以下の各章にあります。",
          },
        },
        {
          heading: "誤解1・2：「AI検索対策はSEOと別物」「もうSEOはいらない」",
          paragraphs: [
            `Googleは、生成AI機能のための最適化について、AI機能はGoogle検索の中心となる仕組みの上に作られており、引き続きSEOであると説明しています（[Google：生成AI機能向けの最適化](${SRC.aiGuideJa})、2026年7月10日更新）。同じページでは、AIによる概要やAIモードに表示されるには、ページがインデックスされ、スニペット付きで表示できる状態であることが前提だとしています。つまり「SEOはもういらない」は逆で、SEOの土台がないとGoogleのAI機能には出られません。`,
            "一方で、「SEOと全く同じなので何もしなくてよい」というのも言い過ぎです。AIは質問に直接答えるため、営業時間・料金・対応エリア・サービス内容のような事実が、サイトのどこかにはっきり書かれ、掲載情報と食い違っていないことの重みが増します。また、ChatGPTやPerplexityはGoogleとは別のクローラでページを読むので、それらを止めていないかの確認が加わります。AEO・GEO・LLMOという呼び方の違いは[AEO・SEO・GEOの違い](/guide/aeo-vs-seo-vs-geo)にまとめています。",
          ],
          after: [
            "お客様への一言：「AI検索対策の土台はSEOと同じです。そのうえで、AIが答えに使う事実をサイトに正しく書き、ChatGPTやPerplexityのクローラが読めるかを確かめる作業を足します。」",
          ],
        },
        {
          heading: "誤解3：「llms.txtを置けばAIに出る」",
          paragraphs: [
            `llms.txtは、サイトの要点と主なページをAI向けにまとめるために提案された形式です（[llmstxt.org](${SRC.llmstxt})）。Googleは、生成AI機能のために新しいAI用のテキストファイルを作る必要はなく、Google検索はllms.txtを使わないと明記しています（[Google：生成AI機能向けの最適化](${SRC.aiGuideJa})）。ChatGPTやPerplexityについては、llms.txtを読んで回答に使うと説明する公式のページを、この記事の作成時点で確認できていません。`,
            "当社が日本の地域事業者62件をPerplexityで測った調査でも、llms.txtを含むサイト側の対策のスコアと、名前が挙がる・引用される割合との間に関係は見られませんでした（詳しくは誤解5）。なお、国内のWeb制作会社のサイト2,357件を当社が2026年11月に調べたところ、llms.txtがあったのは321件（13.6%）でした（[調査レポート](/guide/research-japan-web-agencies-ai-search-2026)）。",
            "では置く意味がないかというと、「害はなく、手間も小さい補助」という位置づけが正確です。サイトの要点が1か所にまとまっていると、AIのエージェントや、将来この形式を使うサービスが読みやすくなる可能性があります。ただし効果は約束できません。書き方は[llms.txtの書き方](/guide/llms-txt)をご覧ください。",
          ],
          after: [
            "お客様への一言：「llms.txtは置いておいて損のない補助のファイルですが、これだけでAIに出るものではありません。Googleは使わないと明言しています。」",
          ],
        },
        {
          heading: "誤解4・5：「AI専用の構造化データがある」「スコアを満点にすればAIに出る」",
          paragraphs: [
            `Googleは、生成AI機能のために特別なschema.orgのマークアップは必要ないとしています（[Google：生成AI機能向けの最適化](${SRC.aiGuideJa})）。構造化データについては、ページに表示されている内容と一致させることを求めています（[Google：AI機能とウェブサイト](${SRC.googleAiJa})）。「AI専用のマークアップを入れます」という提案は、根拠のない商品になりやすいので注意してください。役に立つのは、会社や店の名前・住所・電話・営業時間・業種などの通常の構造化データを、表示内容と同じ値で、重複なく出すことです。`,
            "では、構造化データやllms.txtを整えてスコアを上げれば、AIに出やすくなるのでしょうか。当社は2026年10月24日に、日本の地域事業者62件について、サイトの中の対策（構造化データ・llms.txt・クローラの許可など）を測る当社のスコアと、おすすめを尋ねる質問にPerplexityがその事業者の名前を挙げる・サイトを引用する割合を比べました。結果は、関係が見られないというものでした（Spearmanのρ＝0.03、95%信頼区間 −0.23〜0.28）。62件で確実に見つけられるのは強めの関係だけなので、弱い関係があることまでは否定できません（[調査の詳細](/guide/aeo-signals-ai-answers-study)）。",
            "当社のスコアは「AIがサイトを読める状態か」を確かめるためのもので、AIに選ばれるかどうかの予測ではありません。自社製品の数字ですが、お客様に誤解を与えないよう、ここではそのままお伝えします。",
          ],
          after: [
            "お客様への一言：「構造化データは、AIや検索エンジンに事実を正しく伝えるための基本の整備です。点数を上げること自体が目的ではなく、整えたうえで実際のAIの回答を測って確かめます。」",
          ],
        },
        {
          heading: "誤解6：「AIのクローラはまとめてブロックしておけば安全」",
          paragraphs: [
            `AIのクローラには、AIの学習のためにページを集めるものと、AI検索の回答を作るためにページを読むものがあります。OpenAIは、検索用のOAI-SearchBotと、学習用のGPTBotを別のクローラとして公開しており、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（[OpenAI：クローラの概要](${SRC.openaiBots})）。PerplexityもPerplexityBotとPerplexity-Userを公開しています（[Perplexity：クローラ](${SRC.perplexityBots})）。`,
            "つまり「AIのボットは全部止める」と書くと、学習を止めるつもりで、AI検索に出る道も閉じてしまうことがあります。逆に、学習用のGPTBotを止めても、検索用のOAI-SearchBotを許可していれば、OpenAIの説明ではChatGPTの検索回答の対象からは外れません。学習を許可するかどうかは、AI検索とは別の、お客様自身が決めることです。",
            "当社の調査では、robots.txtがある国内のWeb制作会社のサイト2,158件のうち、少なくとも1つのAIボットにトップページを拒否していたのは28件（1.3%）で、検索用のOAI-SearchBotやClaude-SearchBotを拒否していたサイトはありませんでした（[調査レポート](/guide/research-japan-web-agencies-ai-search-2026)）。止めているのは主に学習用のクローラです。",
          ],
          after: [
            "お客様への一言：「AIの学習に使われるのを止めることと、AI検索に出ることは別々に選べます。検索用のクローラは許可し、学習用はご希望に合わせて決めましょう。」",
          ],
        },
        {
          heading: "誤解7・8：「AIで1位を保証できる」「1回聞いて出なければ失敗」",
          paragraphs: [
            `Googleは、SEO会社の選び方を説明するページで、Google検索で1位を保証できる人はいないと書いています（[Google：SEOの専門家が必要ですか？](${SRC.hireSeoJa})）。第三者のツールやアドバイスについても、AIでの改善をうたう主張は慎重に見るよう勧めています（[Google：第三者のSEOツールとアドバイス](${SRC.thirdPartyJa})）。AIの回答は、同じ質問でも日や回、ログインの有無や地域によって変わり、検索結果のような決まった順位もありません。`,
            "同じ理由で、お客様が試しにChatGPTで1回聞いて「出てこなかった」としても、それだけで対策の成否は判断できません。当社が計測で使っている方法は、店名を含まない質問を決めておき、同じ質問を同じ条件で何回か聞いて、名前が出た割合とサイトが引用された割合を分けて記録するものです。月ごとの推移で見れば、偶然の上下と変化を区別しやすくなります（[AIでの登場率の測り方](/guide/measure-ai-visibility)）。",
          ],
          after: [
            "お客様への一言：「AIの回答は毎回変わるので、1回の結果では判断しません。決めた質問を同じ条件で繰り返し聞き、割合の推移でご報告します。」",
          ],
        },
        {
          heading: "誤解9：「ツールを使えばAIの内部の評価がわかる」",
          paragraphs: [
            `Googleは、第三者のツールはGoogleの内部のランキングやAIの仕組みにアクセスできないと説明しています（[Google：生成AI機能向けの最適化](${SRC.aiGuideJa})）。AI検索の計測ツールがしているのは、決めた質問をAIに送り、返ってきた回答に名前や出典が含まれるかを数えることです。これは役に立つサンプルですが、「AIからの評価点」ではありません。`,
            "ツールを選ぶときは、どのAIで測るか、質問をいくつ・何回聞くか、質問に店名を含めるか、失敗した回をどう扱うかが書かれているかを確かめてください。各社の違いは[AEOツールの比較](/guide/aeo-tools-comparison)にまとめています。",
          ],
          after: [
            "お客様への一言：「ツールでわかるのは、決めた質問への実際の回答のサンプルです。AIの中の評価は誰にも見えません。」",
          ],
        },
        {
          heading: "誤解10：「直せばすぐ変わる」「AI会社に頼めば直してもらえる」",
          paragraphs: [
            `AIや検索エンジンが直したページをいつ読み直し、いつ回答に反映するかについて、決まった期間を示す公式の説明は見当たりません。また、会社や店の依頼でAIの回答そのものを書き換えてもらう窓口も、各社の公式ページでは確認できませんでした。GoogleのAIによる概要には、回答に対して問題を報告する機能がありますが、確実に直す手段ではありません（[Google検索ヘルプ：AIによる概要](${SRC.aioHelpJa})）。`,
            "効果の中心は、AIが読む元の情報（自社サイト、Googleビジネスプロフィール、掲載先のサイト）を正しくそろえることです。直した日付を記録し、1〜2週間など間隔を決めて同じ質問で測り直してください。",
          ],
          after: [
            "お客様への一言：「AIの回答を直接直す方法はありません。AIが読む元の情報を直し、日付を記録して、同じ質問で変化を確かめます。」",
          ],
        },
        {
          heading: "誤解11・12：「Search ConsoleでAIのクリックがわかる」「店はサイトだけでよい」",
          paragraphs: [
            `Search Consoleの生成AIパフォーマンスレポートでは、AIによる概要とAIモードでサイトへのリンクが表示された回数を確認できます。わかるのは表示回数で、AI機能からのクリック数や順位はこのレポートでは確認できません（[Search Consoleヘルプ：生成AIパフォーマンスレポート](${SRC.gscReportJa})）。ChatGPTやPerplexityでの見え方はSearch Consoleの対象外なので、決めた質問での計測や、アクセス解析の参照元とあわせて見ます（[Search ConsoleでAIの表示を見る方法](/guide/search-console-ai-features)）。`,
            `店舗や地域の会社では、Googleはビジネスプロフィールの情報を最新に保つよう勧めています（[Google：AI機能とウェブサイト](${SRC.googleAiJa})）。サイトの営業時間とビジネスプロフィールの営業時間が違うと、AIがどちらを答えるかはわかりません。サイト・構造化データ・ビジネスプロフィール・主な掲載先で、同じ事実を同じ書き方でそろえることが、地域の事業者にとっていちばん効果の見込める作業です（[店舗の構造化データの足し方](/guide/local-business-schema-seo-plugins)）。`,
          ],
          after: [
            "お客様への一言：「Search Consoleでは、GoogleのAI機能での表示回数だけがわかります。店の情報は、サイトとビジネスプロフィールで同じにそろえるのが先です。」",
          ],
        },
        {
          heading: "自分で確かめる手順（WordPressの場合）",
          paragraphs: [
            "誤解を解くときは、説明よりも「お客様のサイトで一緒に確かめる」ほうが伝わります。次の順で、30分ほどで確認できます。",
          ],
          list: [
            "ブラウザで「サイトのURL/robots.txt」を開き、OAI-SearchBot・PerplexityBotなど検索用のクローラが Disallow されていないかを見る（誤解6）。WordPressでは、SEOプラグインやセキュリティ系プラグインがrobots.txtを書き換えていることがあるので、設定画面もあわせて確認する。",
            `[リッチリザルトテスト](${SRC.richResults})にトップページと会社概要のURLを入れ、会社・店の構造化データが出ているか、営業時間や住所が表示内容と同じかを見る（誤解4）。SEOプラグインとテーマの両方が出していて重複していないかも確認する。`,
            "「サイトのURL/llms.txt」を開き、あるか、中身が今のサービスや料金と合っているかを見る。ない場合は作ってもよいが、効果は約束しない（誤解3）。",
            "Googleビジネスプロフィールの営業時間・電話・住所と、サイトの表記を見比べ、違いがあれば正しい方にそろえる（誤解12）。",
            "お客様と一緒に、店名を含まない質問を3〜5個決め、ChatGPT・Perplexity・GoogleのAIモードで聞き、日時と条件、名前が出たか、サイトが引用されたかを表に記録する（誤解7・8）。",
            "Search Consoleの権限があれば、生成AIパフォーマンスレポートで表示回数を確認し、「検索の生成 AI」の設定で意図せずサイトが除外されていないかを見る（誤解11）。",
          ],
        },
        {
          heading: "お客様に渡す「1枚の説明資料」の作り方",
          paragraphs: [
            "上の内容は、A4で1枚にまとめるとお客様との認識合わせに使えます。おすすめの構成は次のとおりです。誤解の否定ばかりにせず、「できること」を同じだけ書くのがこつです。",
          ],
          list: [
            "AI検索対策とは何か（1〜2文）：SEOを土台に、AIが答えに使う事実を正しく伝え、見え方を確かめること。",
            "できること：クローラの許可の確認、構造化データ・サイト・ビジネスプロフィールの事実をそろえる、llms.txtなどの補助の整備、決めた質問での定期的な計測と報告。",
            "できないこと：AIに必ず出ること・順位の保証、AIの回答を直接直すこと、AIの内部の評価を知ること、反映までの期間を約束すること。",
            "よくある誤解（3〜5個）：早見表から、そのお客様が気にしているものを選ぶ。それぞれに公式ページのリンクを付ける。",
            "確かめ方：どの質問を、どのAIで、何回、どの頻度で測り、何を報告するか。",
          ],
          after: [
            `月額サービスとして続けるときの作業範囲と報告のしかたは[制作会社がAI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)にまとめています。お客様にNurevoをご紹介いただく制作会社・個人の方向けには、紹介パートナーの制度があります（[パートナープログラム](${PARTNER})）。`,
          ],
        },
        {
          heading: "Nurevo AEOでできること",
          paragraphs: [
            `Nurevo AEO（WordPressプラグイン、無料）は、AIがサイトを読める状態かを診断し、足りない構造化データ・llms.txt・AI検索用クローラの許可をサーバー側で出力します。自動で読み取るのは空欄だけで、入力済みの値は上書きしません。学習用のクローラ（GPTBot・Google-Extendedなど）は初期設定ではサイトのrobots.txtのとおりで、管理画面から許可か拒否かを選べます。これを止めても、AI検索やスコアには影響しません。SEO SIMPLE PACKやVK All in One Expansion Unitとも構造化データが重複しないように併用できます（0.9.1以降）。[WordPress.orgで無料で入れてみる](${WP_ORG})`,
            "料金はFree 0円、Standard 月3,000円、Pro 月14,800円〜です。接続したFree・Standardのサイトでは、店名を含まない3つの質問を月1回Perplexityに聞く無料のAIチェックが使えます。決めた質問を同じ条件で測り続ける計測はPro（ベータ）で、現在はPerplexityで測っています。上で書いたとおり、どのプランでもAIに出ることは保証しません。",
          ],
        },
      ],
      faqs: [
        { q: "LLMOやGEOは、意味のない言葉なのですか？", a: "呼び方の問題で、目指すことはほぼ同じです。AIの回答で正しく取り上げられることを目的に、AIが読む情報を整えることを指します。言葉の違いより、どの作業をして、どう確かめるかを決めることが大切です。" },
        { q: "llms.txtは置かないほうがよいのですか？", a: "置いて問題はありません。ただし、Google検索は使わないと明言しており、他のAIで効果を示す公式の説明も確認できていないため、効果は約束せずに補助として扱うのが正確です。" },
        { q: "GPTBotを止めると、ChatGPTに出なくなりますか？", a: "OpenAIは、検索用のOAI-SearchBotと学習用のGPTBotを別のクローラとしています。ChatGPTの検索回答に表示されなくなるのは、OAI-SearchBotを拒否した場合だと説明しています。止める前にrobots.txtでどちらを指定しているかを確かめてください。" },
        { q: "お客様に「AIで1位にしてほしい」と言われたら？", a: "AIの回答には決まった順位がなく、同じ質問でも回答が変わること、Google自身が1位の保証はできないと書いていることを伝えます。そのうえで、決めた質問で名前が出る割合を測り、推移を報告する形を提案するのが誠実です。" },
        { q: "誤解かどうか、自分で確かめる方法はありますか？", a: "あります。robots.txt・構造化データ・llms.txt・ビジネスプロフィールはそれぞれ直接開いて確認でき、AIでの見え方は店名を含まない質問を同じ条件で繰り返し聞くことで確かめられます。手順はこの記事の「自分で確かめる手順」をご覧ください。" },
        { q: "この記事の内容は、いつまで正しいですか？", a: "AIの仕組みと各社の説明は変わり続けています。記事は2026年11月13日時点の確認にもとづいています。お客様に説明する前に、リンク先の公式ページで最新の内容を確かめてください。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "お客様のサイトで、誤解を一緒に確かめる",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの許可など、AIが読む情報の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPT、OpenAI、GPTBot、Perplexity、Google、Search Console、Googleビジネスプロフィール、Claude、WordPress、SEO SIMPLE PACK、VK All in One Expansion Unitおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "12 AI Search Optimization Myths, Checked Against Sources | Nurevo",
      description: "Twelve AEO and GEO myths, from llms.txt to AI-only schema and blocking AI bots, checked against Google and OpenAI docs and our own study, with what to tell clients.",
      h1: "12 AI search optimization (AEO / GEO) myths: what the official sources and our own data actually say, and how to explain it to clients",
      lead: "Most AI search myths come from three assumptions: that AI needs its own special tactics, that adding one file or tag gets you into AI answers, and that AI answers have rankings you can win. Google says optimizing for its generative AI features is still SEO and needs no AI-only files or markup. What actually helps is keeping the facts AI reads consistent across your site and listings, not blocking AI search crawlers, and checking how you show up by asking fixed questions repeatedly.",
      intro: [
        "Written November 13, 2026. What Google, OpenAI and Perplexity say was checked on their own pages while writing other guides on this site (October 31 to November 12, 2026); each claim links to its source. These pages change, so check the current versions before you rely on them with a client.",
        "This page is for agencies, SEO consultants and local marketing firms who get asked \"is it true that...?\" by clients. For each myth it gives what is actually true, how strong the evidence is, how to check it yourself, and one sentence you can say to the client. Business owners can use it the same way. AI answers change from one question to the next, and no tactic can guarantee that an AI will mention you or rank you anywhere.",
      ],
      sections: [
        {
          heading: "At a glance: 12 myths and how strong the evidence is",
          paragraphs: [
            "Evidence is graded three ways. Official: the company that runs the system says so on its own pages. Our data: something Nurevo measured itself, with conditions. No statement: no official explanation exists, so nobody can say for sure. Passing this distinction on to clients as it is is the most honest way to explain AI search.",
          ],
          table: {
            head: ["Myth", "What is actually true", "Evidence"],
            rows: [
              ["1. AI search optimization is separate from SEO and needs new tactics", "Google says optimizing for its AI features is still SEO", "Official (Google)"],
              ["2. SEO no longer matters in the AI era", "To appear in Google's AI features a page must be indexed and eligible to show with a snippet", "Official (Google)"],
              ["3. Adding llms.txt gets you into AI answers", "Google Search ignores llms.txt; no other AI officially says it helps", "Official (Google) + our data"],
              ["4. There is special AI-only structured data", "There is no AI-only markup. Use ordinary structured data that matches the visible page", "Official (Google)"],
              ["5. A perfect AI readiness score gets you into AI answers", "In our study of 62 businesses, the on-site score showed no relationship with appearance rate", "Our data"],
              ["6. Blocking every AI crawler is the safe choice", "Blocking an AI search crawler takes you out of that search. Training crawlers are a separate decision", "Official (OpenAI)"],
              ["7. You can guarantee #1 in AI answers", "Google itself says no one can guarantee #1. AI answers change from question to question", "Official (Google)"],
              ["8. If you don't appear when you ask once, the work failed", "One answer is mostly chance. Ask fixed questions repeatedly and read the share", "Our method"],
              ["9. Tools can show how AI rates you internally", "No third-party tool has access to Google's internal systems", "Official (Google)"],
              ["10. Fix the site and answers change at once / the AI company will fix it for you", "No official timeframe exists, and we found no way to have an answer rewritten on request", "No statement"],
              ["11. Search Console shows clicks and rankings from AI", "The generative AI report shows impressions. ChatGPT and Perplexity are not covered", "Official (Google)"],
              ["12. Local businesses only need to fix their website", "Google recommends keeping Business Profile information up to date for its AI features", "Official (Google)"],
            ],
            caption: "Source links are in each section below.",
          },
        },
        {
          heading: "Myths 1 and 2: \"AI search is separate from SEO\" and \"SEO no longer matters\"",
          paragraphs: [
            `Google says its generative AI features are built on its core Search systems, and that optimizing for them is still SEO ([Google: Optimizing for generative AI features](${SRC.aiGuide}), updated July 10, 2026). The same page says a page must be indexed and eligible to be shown with a snippet to appear in AI Overviews or AI Mode. So \"SEO no longer matters\" has it backwards: without the SEO foundation you cannot appear in Google's AI features at all.`,
            "Saying \"it is exactly SEO, so there is nothing new to do\" goes too far the other way. Because AI answers questions directly, it matters more that facts such as hours, prices, service areas and services are stated plainly somewhere on your site and do not contradict your listings. ChatGPT and Perplexity also read pages with their own crawlers, separate from Google's, so checking that those are not blocked is an extra step. The naming differences between AEO, GEO and LLMO are covered in [AEO vs SEO vs GEO](/guide/aeo-vs-seo-vs-geo).",
          ],
          after: [
            "What to tell the client: \"The foundation of AI search optimization is the same as SEO. On top of it we make sure the facts AI uses in answers are stated correctly on your site, and that ChatGPT's and Perplexity's crawlers can read it.\"",
          ],
        },
        {
          heading: "Myth 3: \"Adding llms.txt gets you into AI answers\"",
          paragraphs: [
            `llms.txt is a proposed format for summarizing a site and its main pages for AI ([llmstxt.org](${SRC.llmstxt})). Google states that you do not need to create new AI text files for its generative AI features and that Google Search ignores llms.txt ([Google: Optimizing for generative AI features](${SRC.aiGuide})). For ChatGPT and Perplexity, we have not found an official page saying they read llms.txt and use it in answers, as of writing.`,
            "In our study of 62 local businesses in Japan, measured on Perplexity, the score for on-site work including llms.txt showed no relationship with how often a business was named or cited (see myth 5). For context, when we checked 2,357 Japanese web agency sites in November 2026, 321 (13.6%) had an llms.txt ([research report](/guide/research-japan-web-agencies-ai-search-2026)).",
            "Is it pointless, then? The accurate framing is \"a harmless, low-effort extra\". Having the key points of a site in one place may make it easier for AI agents, or for services that adopt the format later, to read. But no effect can be promised. See [how to write llms.txt](/guide/llms-txt).",
          ],
          after: [
            "What to tell the client: \"llms.txt is a helper file that does no harm, but it will not get you into AI answers on its own. Google says outright that it does not use it.\"",
          ],
        },
        {
          heading: "Myths 4 and 5: \"There is AI-only structured data\" and \"a perfect score gets you in\"",
          paragraphs: [
            `Google says no special schema.org markup is needed for its generative AI features ([Google: Optimizing for generative AI features](${SRC.aiGuide})), and asks that structured data match what is visible on the page ([Google: AI features and your website](${SRC.googleAi})). A proposal to \"add AI-specific markup\" easily becomes a product with no basis. What helps is ordinary structured data for the business, such as name, address, phone, hours and business type, published once, without duplicates, and with the same values the page shows.`,
            "So does tidying structured data and llms.txt to raise a score make AI more likely to mention you? On October 24, 2026 we compared, for 62 local businesses in Japan, our on-site score (structured data, llms.txt, crawler access and similar) with how often Perplexity named the business or cited its site when asked for recommendations. We found no relationship (Spearman ρ = 0.03, 95% CI −0.23 to 0.28). With 62 businesses only fairly strong relationships can be detected reliably, so a weaker one cannot be ruled out ([full study](/guide/aeo-signals-ai-answers-study)).",
            "Our score checks whether AI can read a site. It does not predict whether AI will pick it. That is our own product's number, and we state the result plainly so it does not mislead clients.",
          ],
          after: [
            "What to tell the client: \"Structured data is basic upkeep so AI and search engines get your facts right. Raising a score is not the goal; we tidy things up and then check real AI answers.\"",
          ],
        },
        {
          heading: "Myth 6: \"Blocking every AI crawler is the safe choice\"",
          paragraphs: [
            `Some AI crawlers collect pages to train models; others read pages to build AI search answers. OpenAI publishes OAI-SearchBot (search) and GPTBot (training) as separate crawlers, and says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers ([OpenAI: overview of crawlers](${SRC.openaiBots})). Perplexity publishes PerplexityBot and Perplexity-User ([Perplexity: crawlers](${SRC.perplexityBots})).`,
            "A blanket \"block all AI bots\" rule can therefore close the door to AI search while meaning only to stop training. The reverse also holds: by OpenAI's description, blocking GPTBot while allowing OAI-SearchBot does not remove a site from ChatGPT search answers. Whether to allow training is the client's own decision, separate from AI search.",
            "In our research, of 2,158 Japanese web agency sites with a robots.txt, 28 (1.3%) disallowed the home page for at least one AI bot, and none blocked the search crawlers OAI-SearchBot or Claude-SearchBot ([research report](/guide/research-japan-web-agencies-ai-search-2026)). Most blocks targeted training crawlers.",
          ],
          after: [
            "What to tell the client: \"Stopping AI training on your content and appearing in AI search are separate choices. Let's allow the search crawlers and decide on training crawlers as you prefer.\"",
          ],
        },
        {
          heading: "Myths 7 and 8: \"#1 in AI can be guaranteed\" and \"one failed question means failure\"",
          paragraphs: [
            `On its page about hiring an SEO, Google says no one can guarantee a #1 ranking on Google ([Google: Do you need an SEO?](${SRC.hireSeo})). It also advises treating claims of improvement in AI experiences from third-party tools and advice with care ([Google: Third-party SEO tools and advice](${SRC.thirdParty})). AI answers change with the day, the run, whether you are signed in and where you are, and they have no fixed ranking like a results page.`,
            "For the same reason, a client asking ChatGPT once and not seeing their business tells you little about whether the work succeeded. The method we use is to fix a set of questions that do not include the business name, ask each several times under the same conditions, and record the share of answers that name the business and the share that cite its site, separately. Month-by-month trends make it easier to tell real change from noise ([how to measure AI visibility](/guide/measure-ai-visibility)).",
          ],
          after: [
            "What to tell the client: \"AI answers change every time, so we don't judge from one answer. We ask fixed questions repeatedly under the same conditions and report the trend.\"",
          ],
        },
        {
          heading: "Myth 9: \"Tools can show how AI rates you internally\"",
          paragraphs: [
            `Google says no third-party tool has access to its internal ranking or AI systems ([Google: Optimizing for generative AI features](${SRC.aiGuide})). What AI visibility tools do is send fixed questions to AI services and count whether the answers include a name or a source. That is a useful sample, not a score from the AI.`,
            "When choosing a tool, check that it states which AI services it measures, how many questions and runs it uses, whether questions include the business name, and how failed runs are handled. Differences between tools are covered in [AEO tools compared](/guide/aeo-tools-comparison).",
          ],
          after: [
            "What to tell the client: \"A tool shows a sample of real answers to fixed questions. Nobody can see how the AI rates you inside.\"",
          ],
        },
        {
          heading: "Myth 10: \"Fixes show up at once\" and \"the AI company will fix it for you\"",
          paragraphs: [
            `We found no official statement of how long it takes AI services or search engines to re-read a corrected page and reflect it in answers. Nor could we find, on any of the companies' official pages, a way for a business to have an AI answer rewritten on request. Google's AI Overviews let users report a problem with an answer, but that is not a reliable way to correct it ([Google Search Help: AI Overviews](${SRC.aioHelpEn})).`,
            "The work that matters is fixing the information AI reads: your own site, your Google Business Profile and the sites that list you. Record the date of each fix, then re-ask the same questions at a set interval, such as every one or two weeks.",
          ],
          after: [
            "What to tell the client: \"There is no way to edit an AI answer directly. We fix the information AI reads, record the date, and check with the same questions.\"",
          ],
        },
        {
          heading: "Myths 11 and 12: \"Search Console shows AI clicks\" and \"a local business only needs its site\"",
          paragraphs: [
            `The Generative AI performance report in Search Console shows how many times links to your site were shown in AI Overviews and AI Mode. It shows impressions; clicks and positions from AI features are not available in that report ([Search Console Help: Generative AI performance report](${SRC.gscReportEn})). ChatGPT and Perplexity are outside Search Console, so combine it with fixed-question measurement and referrers in your analytics ([how to see AI features in Search Console](/guide/search-console-ai-features)).`,
            `For local businesses, Google recommends keeping Business Profile information up to date ([Google: AI features and your website](${SRC.googleAi})). If the hours on the site and on the Business Profile differ, there is no telling which one an AI will give. Stating the same facts the same way across the site, structured data, Business Profile and main listings is the work with the best expected payoff for a local business ([adding business schema with SEO plugins](/guide/local-business-schema-seo-plugins)).`,
          ],
          after: [
            "What to tell the client: \"Search Console only shows impressions in Google's AI features. The first job is making your site and Business Profile say the same thing.\"",
          ],
        },
        {
          heading: "How to check it yourself (on WordPress)",
          paragraphs: [
            "Myths fall away faster when you check the client's site together than when you explain. This takes about 30 minutes, in this order.",
          ],
          list: [
            "Open yoursite/robots.txt in a browser and check that search crawlers such as OAI-SearchBot and PerplexityBot are not disallowed (myth 6). On WordPress, SEO and security plugins sometimes rewrite robots.txt, so check their settings too.",
            `Put the home page and About page URLs into the [Rich Results Test](${SRC.richResults}). Check that business structured data is present and that hours and address match the page (myth 4), and that the SEO plugin and the theme are not both outputting it.`,
            "Open yoursite/llms.txt and check whether it exists and matches current services and prices. If there is none you can add one, but promise no effect (myth 3).",
            "Compare hours, phone and address on the Google Business Profile with the site and align them to the correct values (myth 12).",
            "With the client, choose 3 to 5 questions that do not include the business name, ask them in ChatGPT, Perplexity and Google's AI Mode, and record the date and conditions, whether the business was named and whether the site was cited (myths 7 and 8).",
            "If you have Search Console access, check impressions in the Generative AI performance report and make sure the Search generative AI setting is not excluding the site by mistake (myth 11).",
          ],
        },
        {
          heading: "Building a one-page explainer for clients",
          paragraphs: [
            "The points above fit on one page, which works well for getting on the same page with a client. A suggested outline follows. The trick is to give \"what we can do\" as much space as the myths.",
          ],
          list: [
            "What AI search optimization is (one or two sentences): SEO as the base, plus stating the facts AI uses correctly and checking how you show up.",
            "What we can do: check crawler access, align facts across structured data, the site and the Business Profile, set up helpers such as llms.txt, and measure and report on fixed questions regularly.",
            "What we cannot do: guarantee appearance or a position, edit AI answers directly, see how AI rates you inside, or promise how long changes take.",
            "Common myths (3 to 5): pick the ones this client worries about from the table above, each with a link to the official page.",
            "How we check: which questions, on which AI services, how many runs, how often, and what we report.",
          ],
          after: [
            `How to run this as an ongoing monthly service, with scope and reporting, is covered in [turning AI search optimization into a monthly agency service](/guide/agency-aeo-monthly-service). For agencies and freelancers who refer clients to Nurevo, there is a referral partner program ([partner program](${PARTNER})).`,
          ],
        },
        {
          heading: "What Nurevo AEO does",
          paragraphs: [
            `Nurevo AEO, a free WordPress plugin, checks whether AI can read a site and publishes missing structured data, llms.txt and AI search crawler rules from your own server. It fills blank fields only and never overwrites values you typed. Training crawlers (GPTBot, Google-Extended and others) are left to your robots.txt by default, and you can allow or block them in the admin screen; blocking them does not affect AI search or your score. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data. [Try it free on WordPress.org](${WP_ORG})`,
            "Plans: Free $0, Standard $20/month, Pro from $99/month. Connected Free and Standard sites get a free AI check that asks Perplexity three questions without the business name once a month. Ongoing measurement of a fixed question set under the same conditions is Pro (beta) and currently runs on Perplexity. As stated above, no plan guarantees appearance in AI answers.",
          ],
        },
      ],
      faqs: [
        { q: "Are LLMO and GEO meaningless terms?", a: "They are names for nearly the same goal: preparing the information AI reads so a business is represented correctly in AI answers. Deciding which work to do and how to check it matters more than the label." },
        { q: "Should I avoid adding llms.txt?", a: "Adding one is fine. But Google says Search ignores it, and we have found no official statement that other AI services use it, so treat it as a helper and promise no effect." },
        { q: "If I block GPTBot, will I disappear from ChatGPT?", a: "OpenAI treats OAI-SearchBot (search) and GPTBot (training) as separate crawlers, and says it is opting out of OAI-SearchBot that keeps a site out of ChatGPT search answers. Check which one your robots.txt names before blocking." },
        { q: "A client wants to be \"#1 in AI\". What do I say?", a: "Explain that AI answers have no fixed ranking and change even for the same question, and that Google itself says no one can guarantee #1. Then offer to measure the share of fixed questions that name the business and report the trend." },
        { q: "Can I check these myths myself?", a: "Yes. robots.txt, structured data, llms.txt and the Business Profile can each be opened and checked directly, and how you show up in AI can be checked by asking questions without your name repeatedly under the same conditions. See \"How to check it yourself\" above." },
        { q: "How long will this page stay accurate?", a: "AI systems and the companies' documentation keep changing. This page reflects checks as of November 13, 2026. Before explaining to a client, confirm the current wording on the linked official pages." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check the myths on your client's site together",
        body: "The free check shows the state of what AI reads, such as structured data, llms.txt and AI crawler access, with no sign-up. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT, OpenAI, GPTBot, Perplexity, Google, Search Console, Google Business Profile, Claude, WordPress, SEO SIMPLE PACK, VK All in One Expansion Unit and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
