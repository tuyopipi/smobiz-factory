// Content page: building an original research / data page (独自調査・調査
// リリースの原本) on your own site so AI search and people can cite it. All
// industries. Separate from agency-press-release-ai-search (the release text
// and distribution), media-coverage-page-ai-search (third-party coverage list)
// and blog-articles-ai-citations (ordinary articles): this page is about the
// research page itself — method, limits, data file, citation rules, Japan's
// No.1-claim rules and Dataset markup.
//
// Written 2026-11-25 20時 (JST).
//
// Outside facts and where they were read (2026-11-25):
// - GEO paper, arXiv 2311.09735 v3 (2024-06-28), KDD '24: "up to 40%"
//   visibility in generative engine responses; GEO-bench 10K queries; Table 1
//   (Position-Adjusted Word Count overall / Subjective Impression average):
//   No Optimization 19.3/19.3, Keyword Stuffing 17.7/20.2, Quotation Addition
//   27.2/24.7, Statistics Addition 25.2/23.7, Cite Sources 24.6/21.9; caption:
//   best methods +41% and +28%. Main engine is a constructed pipeline
//   (Google top-5 sources + gpt-3.5-turbo); Perplexity.ai up to 37%.
// - Kevin Indig, "Why most original data never gets cited" (Search Engine
//   Land, no date shown): Gauge cited-URL set, 301 pages, 316 prompts, 7
//   verticals, 1,075 citations; 8 pages (2.7%) primary research took 90
//   citations (8.4%); 11.3 vs 3.4 per page; 75 of 90 from one cluster (cloud
//   warehouse benchmarks); Fivetran's benchmark 44. Sampling not explained.
// - Vishwakarma, Kumar, Jamidar (Sprinklr), "What Gets Cited: Competitive GEO
//   in AI Answer Engines", arXiv 2605.25517 (2026-05-25), SIGIR '26: 252,000
//   trials, six LLMs, two-document testbed; topical relevance and list
//   position biggest drivers; explicit price and recent timestamp help;
//   formatting-only edits little impact.
// - Google, "Creating helpful, reliable, people-first content": asks whether
//   content provides original information, reporting, research or analysis;
//   "How" section: explain how automation / AI was used.
// - Google, Dataset structured data (ja/en): for Dataset Search; required
//   name, description (50–5,000 characters); recommended creator, license,
//   temporalCoverage, spatialCoverage, variableMeasured, distribution
//   (DataDownload contentUrl, encodingFormat) etc.; examples include "a table
//   or a CSV file with some data".
// - CAA (消費者庁) "No.1表示に関する実態調査報告書" 2024-09-26 (notice and
//   commissioner's press conference): problem example — 満足度No.1 where the
//   survey did not check whether respondents used the product; advertisers
//   often didn't know the survey content; responsibility is the
//   advertiser's; advertisers encouraged to let consumers see the basis; 2008
//   JFTC report still applies. ECのミカタ (2024-10-22 update): 368 ads,
//   1,000-person web survey, 15 advertisers; only 1 of 15 knew the comparison
//   set. J-CAST 2022-02-03: JFTC 2008 — objective survey, results cited
//   accurately; JMRA protest letter 2022-01-18 (patterns: no design
//   disclosed, skewed sample, stopping once ahead, splitting categories).
//   The report PDF itself (conditions in detail) was NOT read — not written.
// - Japanese marketer surveys (vendor, self-reported): PRIZMA n=426
//   (2026-07-16〜21, ascii.jp 2026-07-30) — most effective measures:
//   external distribution 52.8%, primary information 43.5%; TRUE MARKETING /
//   PRIZMA panel n=1,003 (2026-08-10〜12, 2026-09-29) — tactics: primary
//   information 46.9%.
// Not stated: any AI company's statement that it prefers original research or
// reads Dataset markup; how long new data takes to reach AI answers.
//
// Nurevo facts: research-japan-web-agencies-ai-search-2026 (2,756 targets,
// 2,357 reached, tallied 2026-11-05; summary / method / limits / citing /
// opinion sections; never publishes company names or groups under 30 sites);
// plugin docs/developers.md (webmcp_canary_schema_graph: 'extra' nodes are
// never suppressed, org_id read-only; not called on pages excluded from
// structured data; webmcp_canary_llms_txt_lines); llms.txt lists the 30 most
// recently modified pages/posts; free AI check monthly, three Perplexity
// questions; Pro from ¥14,800 / USD 99 on Perplexity (ChatGPT once
// configured); 0.9.1 coexists with SEO SIMPLE PACK and VK All in One
// Expansion Unit.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  geo: "https://arxiv.org/abs/2311.09735",
  indig: "https://searchengineland.com/why-most-original-data-never-gets-cited-481676",
  sigir: "https://arxiv.org/abs/2605.25517",
  helpful: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja",
  helpfulEn: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
  dataset: "https://developers.google.com/search/docs/appearance/structured-data/dataset?hl=ja",
  datasetEn: "https://developers.google.com/search/docs/appearance/structured-data/dataset",
  caa: "https://www.caa.go.jp/notice/entry/039459/",
  caaPress: "https://www.caa.go.jp/notice/statement/arai/039582.html",
  ecnomikata: "https://ecnomikata.com/ecnews/44902/",
  jcast: "https://www.j-cast.com/2022/02/03430291.html?p=all",
  prizma: "https://ascii.jp/elem/000/004/423/4423386/",
  truemkt: "https://www.koukoku.jp/truemarketing/aio/20260929/",
};

const DATASET = `// 調査ページ（スラッグ research-2026）にだけ Dataset を足す
add_filter('webmcp_canary_schema_graph', function (array $bundle) {
    if (!is_page('research-2026')) {
        return $bundle;
    }
    $bundle['extra'][] = array(
        '@type'            => 'Dataset',
        'name'             => '（地域）の引っ越し見積もり 依頼内容の集計 2026年10月',
        'description'      => '当社に2026年10月に届いた見積もり依頼412件を、間取り・移動距離・希望日で集計したデータ。対象・期間・集計方法と限界は本文に記載。',
        'creator'          => array('@id' => $bundle['org_id']),
        'license'          => 'https://creativecommons.org/licenses/by/4.0/',
        'temporalCoverage' => '2026-10-01/2026-10-31',
        'distribution'     => array(array(
            '@type'          => 'DataDownload',
            'encodingFormat' => 'text/csv',
            'contentUrl'     => 'https://example.co.jp/wp-content/uploads/2026/11/research-2026.csv',
        )),
    );
    return $bundle;
});`;

const DATASET_EN = DATASET
  .replace("// 調査ページ（スラッグ research-2026）にだけ Dataset を足す", "// Add a Dataset node only on the research page (slug research-2026)")
  .replace("（地域）の引っ越し見積もり 依頼内容の集計 2026年10月", "Moving quote requests in (region): October 2026 tally")
  .replace("当社に2026年10月に届いた見積もり依頼412件を、間取り・移動距離・希望日で集計したデータ。対象・期間・集計方法と限界は本文に記載。", "412 moving quote requests we received in October 2026, tallied by home size, distance and requested date. Scope, period, method and limits are described on the page.");

const LLMS = `// 調査ページを、更新日にかかわらず llms.txt に載せる
add_filter('webmcp_canary_llms_txt_lines', function (array $lines) {
    $lines[] = '## 調査・データ';
    $lines[] = '';
    $lines[] = '- [引っ越し見積もり依頼の集計 2026年10月](https://example.co.jp/research-2026/): 412件の集計、方法・限界・CSVあり';
    $lines[] = '';
    return $lines;
});`;

const LLMS_EN = LLMS
  .replace("// 調査ページを、更新日にかかわらず llms.txt に載せる", "// Keep the research page in llms.txt whatever its modified date")
  .replace("## 調査・データ", "## Research and data")
  .replace("[引っ越し見積もり依頼の集計 2026年10月](https://example.co.jp/research-2026/): 412件の集計、方法・限界・CSVあり", "[Moving quote requests, October 2026](https://example.co.jp/research-2026/): tally of 412 requests, with method, limits and CSV");

export default {
  slug: "original-research-data-page-ai-search",
  targetQueries: [
    "original research AI citations",
    "proprietary data page get cited by ChatGPT",
    "research page methodology template",
    "独自調査 AI検索 引用",
    "調査リリース 一次情報 LLMO",
    "調査データ ページ 作り方",
  ],
  related: ["agency-press-release-ai-search", "media-coverage-page-ai-search", "blog-articles-ai-citations", "measure-ai-visibility", "research-japan-web-agencies-ai-search-2026"],
  locales: {
    ja: {
      title: "独自調査・データのページの作り方：AI検索に引用される一次情報 | Nurevo",
      description: "独自調査のページは、数字・対象・期間・方法・限界を1か所にそろえると、AIと記者が引用しやすくなります。調査概要の書き方、No.1表示の注意、Datasetの構造化データ、WordPressの手順をまとめました。",
      h1: "独自調査・データのページの作り方：AI検索と記者に引用される「原本」を自社サイトに置く手順",
      lead: "独自調査やデータをAI検索に引用してもらうには、プレスリリースだけでなく、自社サイトに「原本」のページを置き、数字と一緒に対象・件数・期間・方法・限界を書くことが基本です。数字や引用を足した文章はAIの回答に使われやすいという研究がある一方、出典として選ばれる仕組みは公表されておらず、引用を約束できる方法はありません。小さな会社でも、自社の受注や問い合わせの集計、価格の推移、測定・比較の結果なら、ほかにないデータを作れます。",
      intro: [
        "作成日：2026年11月25日（日本時間）。研究と調査の数字は、論文（arXiv）・Search Engine Land の記事・Googleの公式ドキュメント・消費者庁の発表と報道を同日に読んで確認しました。",
        "AIの回答は日々変わり、どのページを出典にするかはAIの会社ごとに決めていて、詳しい基準は公表されていません。この記事は、調査を正しく、確かめられる形で公開するための手順です。",
      ],
      sections: [
        {
          heading: "数字や一次情報は、AIの回答に使われやすいのか：3つの研究",
          paragraphs: [
            "「独自データはAIに引用されやすい」という話はよく見かけますが、根拠になっている研究は条件つきです。主な3つを並べます。",
          ],
          table: {
            head: ["研究", "条件", "わかったこと"],
            rows: [
              ["GEO（プリンストン大学ほか、KDD 2024）", "1万件の質問。Google上位5件をもとに gpt-3.5-turbo が答える実験用の仕組み（Perplexity でも検証）", "統計を足すと見える量の指標が19.3→25.2、引用を足すと27.2、出典を書くと24.6。キーワードの詰め込みは17.7に下がった。最大で約40%の改善（Perplexity では最大37%）"],
              ["Kevin Indig（Search Engine Land）", "Gauge のデータで、7業種・316の質問で引用された301ページ・1,075件の引用", "一次調査は8ページ（2.7%）だが引用の8.4%（90件）を集め、1ページあたり11.3件（ほかは3.4件）。ただし90件中75件はクラウドのデータ基盤の性能比較という1つの分野に集中"],
              ["Sprinklr の研究者（SIGIR 2026）", "6つのAIモデル、2つの文書をくらべる実験を25万2,000回", "引用の順番を最も左右したのは、質問との関連性と並び順。明記された価格と新しい日付も効いた。見た目の書式だけの変更はほとんど効かなかった"],
            ],
          },
          after: [
            `出典：[GEO の論文](${SRC.geo})、[Kevin Indig の記事](${SRC.indig})、[What Gets Cited](${SRC.sigir})。GEO は実験用の仕組みでの結果で、今のChatGPTやGoogleのAIモードでの数字ではありません。Indig の記事は質問の選び方を説明しておらず、記事に日付の記載もありません。`,
            "3つから言えるのは、①数字・引用・出典を本文に書くと回答に使われやすい傾向がある、②一次調査が強いのは「比較の基準になる数字」を求める質問がある分野、③見た目を整えるより、質問に合った中身と新しい日付が大事、というところまでです。",
            `Googleも、役に立つコンテンツの自己評価の質問として「独自の情報・報道・調査・分析を提供しているか」を挙げています（[Google 検索セントラル](${SRC.helpful})）。`,
          ],
        },
        {
          heading: "国内の担当者は一次情報をどう見ているか",
          paragraphs: [
            `国内でも一次情報への注目は高まっています。PRIZMA の調査（2026年7月、426人）では、AIによる概要の対策で効果を実感した施策として「一次情報」が43.5%（外部への配信52.8%に次ぐ）でした（[ASCII.jp](${SRC.prizma})）。別の調査（2026年8月、1,003人）では、実施している施策の1位が「一次情報」の46.9%でした（[TRUE MARKETING](${SRC.truemkt})）。`,
            "どちらもAI対策のサービスを売る会社の調査で、効果は回答者の自己申告です。「一次情報を出せば引用される」ことを示すデータではありません。",
          ],
        },
        {
          heading: "小さな会社でも作れる独自データ5種類",
          paragraphs: ["大きなアンケートを外注しなくても、ほかの会社が持っていないデータは手元にあります。"],
          table: {
            head: ["種類", "例", "注意"],
            rows: [
              ["自社の実績の集計", "見積もり依頼の内訳、問い合わせの多い月、修理の故障箇所の割合", "個人が特定されないように集計し、少ない件数のグループは出さない"],
              ["価格・相場の記録", "毎月の仕入れ値、地域の家賃の募集価格を1年記録", "どこの何を、いつ記録したかを書く"],
              ["測定・比較（ベンチマーク）", "道具や機器を同じ条件で試した結果、サイトの表示速度の比較", "条件と手順を書き、他社製品を扱うなら公平に"],
              ["お客様へのアンケート", "利用後アンケートの満足度、選んだ理由", "対象が「利用した人」だけだと明記。No.1表示に使うなら後の「日本の決まり」の章を必ず確認"],
              ["公開データの集計", "官公庁の統計を地域・業種で集計し直す", "元のデータの出典と取得日を書き、加工したことを明記"],
            ],
          },
          after: [
            "Indig の分析で引用が集中したのは「性能を比べた結果」でした。自社の業種で「比べたいけれど数字がない」質問（例：〇〇の修理は何日かかる？）を探すと、テーマが決まりやすくなります。",
          ],
        },
        {
          heading: "調査ページに書く10の項目",
          paragraphs: ["プレスリリースは配信サービスに載りますが、数字の原本は自社サイトに置きます。リリースからは必ずこのページにリンクします。"],
          table: {
            head: ["項目", "書き方", "理由"],
            rows: [
              ["タイトル", "何を・どこで・いつ・何件（例：〇〇市の見積もり依頼412件の集計、2026年10月）", "質問と合うかを一目で判断できる"],
              ["要点", "1文に1つの数字。分母・時期・出典名を同じ文に入れる", "その1文だけを引用されても意味が通る"],
              ["調査概要", "対象・抽出の方法・期間・方法・件数（n）", "数字の重みを読者とAIが判断できる"],
              ["設問・定義", "質問文そのもの、「あり」とみなした条件", "数字の意味がぶれない"],
              ["結果の表", "表は画像ではなく文字の表。分母を書く", "AIも読者も読み取れる"],
              ["限界", "調べていないこと、偏りのありそうなところ", "過大な引用を防ぐ"],
              ["意見", "「ここからは当社の意見です」と分ける", "事実と解釈を混ぜない"],
              ["引用・転載のルール", "出典の書き方と、そのまま使える1文", "引用する人の手間を減らす"],
              ["データファイル", "CSVなど。列の説明を付ける", "裏付けを確かめられる"],
              ["日付と更新履歴", "公開日・集計日・直した内容", "新しい日付は引用に効くという研究がある"],
            ],
          },
          after: [
            "Nurevo の調査ページもこの形で作っています。たとえば[国内Web制作会社サイトの調査](/guide/research-japan-web-agencies-ai-search-2026)は、対象2,756件・トップページに到達できた2,357件・2026年11月5日集計と調査概要に書き、限界・引用のルール・当社の意見を別の見出しに分けました。会社名は出さず、30件未満のグループの数字も出していません。",
          ],
        },
        {
          heading: "日本の決まり：調査をNo.1表示や広告に使うとき",
          paragraphs: [
            `調査の結果を「満足度No.1」のように広告で使うと、景品表示法の対象になります。消費者庁は2024年9月26日に「No.1表示に関する実態調査報告書」を公表しました（[消費者庁](${SRC.caa})）。報道によると、広告368件・消費者1,000人へのWebアンケート・広告主15社への聞き取りをもとにしており、比べた相手の会社を知っていた広告主は15社中1社でした（[ECのミカタ](${SRC.ecnomikata})）。`,
            `長官の会見では、利用したかどうかを確かめずに満足度を聞いた調査が問題の例として挙げられ、調査会社に頼んだ場合でも責任は広告主にあること、根拠を消費者が確かめられるようにすることが求められました（[会見要旨](${SRC.caaPress})）。2008年の公正取引委員会の報告書の考え方（客観的な調査にもとづくこと、結果を正確に引用すること）も引き続き使われます。`,
            `日本マーケティング・リサーチ協会は2022年1月18日に、結果ありきの「No.1調査」への抗議状を出しました。報道では、設計を明かさない、回答者の偏り、上回った時点で調査を止める、部門を細かく分けて1位を作る、といった手口が挙げられています（[J-CAST](${SRC.jcast})）。`,
          ],
          list: [
            "調査ページには、No.1表示に使うかどうかにかかわらず、対象・比べた相手・期間・方法・件数を書く",
            "利用者に聞いたのか、利用していない人の印象を聞いたのかを明記する",
            "広告やリリースに数字を使うときは、調査ページへのリンク（またはQRコード）を付ける",
            "お金を払って記事や順位を載せた場合は広告と明示する（2023年10月からのステルスマーケティング規制）",
          ],
          after: ["この記事は法律の助言ではありません。広告に使う前に、必要に応じて専門家に確認してください。"],
        },
        {
          heading: "構造化データ：Dataset を使うか",
          paragraphs: [
            `Google は、データセットを Dataset Search で見つけやすくするための構造化データ Dataset を説明しています。「データのある表やCSVファイル」もデータセットの例に入っています。必須は name と description（50〜5,000文字）で、creator・license・temporalCoverage・spatialCoverage・variableMeasured・distribution（ダウンロードのURLと形式）などが推奨です（[Google 検索セントラル](${SRC.dataset})）。`,
            "これは Dataset Search 向けのもので、AIの回答に使われると公表しているAIの会社はありません。ページに文字で調査概要と表を書くことが先で、Dataset はCSVを公開するときの追加と考えてください。ページに見えていない内容を構造化データだけに書くのは避けます。",
          ],
        },
        {
          heading: "WordPressでの手順",
          list: [
            "固定ページで調査ページを作り、URLを /research-2026/ のような短い英字にします。要点・調査概要・結果・限界・意見・引用のルール・データ・更新履歴を見出しで分けます。",
            "結果はテーブルブロックで文字の表にします。グラフを画像で入れる場合も、同じ数字の表を下に置きます。",
            "CSVをメディアライブラリ（または自社サーバー）に置き、ページからリンクします。列の名前と意味を本文に書きます。フォームの入力やメールアドレスの登録をしないとデータが見られない形にすると、AIのクローラーも記者も中身を読めません。",
            "プレスリリース・ブログ記事・会社概要から調査ページにリンクします。リリースの書き方は[プレスリリースをAI検索向けに整える](/guide/agency-press-release-ai-search)にあります。",
            "Nurevo AEO（無料のWordPressプラグイン）では、フィルター webmcp_canary_schema_graph の extra に足したノードは、SEOプラグインと併用していても外されません（下の例）。構造化データを出さない設定にしたページでは呼ばれません。0.9.1 からは SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても構造化データは重複しません。",
            "Nurevo AEO の llms.txt は最近更新した公開済みのページと投稿を30件まで並べます。調査ページを長く更新しないと外れることがあるため、残したい場合はフィルター webmcp_canary_llms_txt_lines で行を足します（2つ目の例）。",
            `入れたら、ページのソース（application/ld+json）と /llms.txt で、本文と同じ内容が出ているかを確かめます。[WordPress.orgで入手](${WP_ORG})`,
          ],
          code: DATASET,
        },
        {
          heading: "llms.txt に調査ページを残す",
          paragraphs: ["上の Dataset とは別に、調査ページへの入り口を llms.txt に固定する例です。"],
          code: LLMS,
        },
        {
          heading: "確かめ方",
          list: [
            "調査が答える質問（例：「（地域）の引っ越しはいつが安い？」）を ChatGPT・Perplexity・GoogleのAIモードに聞き、答えと出典のURLを日付付きで記録します。",
            "出典に調査ページ・リリース・それを取り上げた記事のどれが出るか、数字が正しく引用されているかを見ます。数字が違っていたら、要点の1文をより明確に書き直します。",
            "Googleアナリティクス4で、調査ページへのAIのサービスからの流入と、CSVのダウンロード数を見ます。被リンクや言及は Search Console のリンクのレポートや社名の検索で見ます。",
            "AIの回答は日によって変わるため、同じ質問を毎月同じ日に聞きます。決めた質問のセットで記録する方法は[AIでの登場率の測り方](/guide/measure-ai-visibility)にあります。",
            "Nurevo AEO の無料のAIチェックは、接続したサイトに月1回、業種と地域から作った3つの質問を Perplexity に聞きます。継続して測る Pro（月14,800円〜）も現在は Perplexity で測っています（ChatGPTは設定され次第）。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "タイトルに、何を・どこで・いつ・何件かを入れた",
            "要点の各文に、分母・時期・出典名を入れた",
            "対象・抽出の方法・期間・方法・件数・設問を書いた",
            "結果を画像だけでなく文字の表でも載せた",
            "調べていないこと（限界）を書いた",
            "事実と当社の意見を見出しで分けた",
            "個人や取引先が特定されないように集計し、少ない件数は出していない",
            "No.1表示や広告に使う場合、利用者に聞いたか・比べた相手を明記した",
            "CSVと列の説明を、登録なしで見られるようにした",
            "引用のルールと、そのまま使える1文を書いた",
          ],
        },
        {
          heading: "毎年続けると強くなる",
          paragraphs: [
            "同じ方法で毎年（または毎月）集計すると、「前年からどう変わったか」という、ほかにない数字ができます。URLは年ごとに分け（/research-2026/、/research-2027/）、前年のページは消さずに残し、互いにリンクします。方法を変えたときは、比べられない点を限界に書きます。",
          ],
        },
      ],
      faqs: [
        { q: "独自調査のページを作れば、AIに引用されますか？", a: "必ずとは言えません。数字や出典を書いた文章は回答に使われやすいという研究はありますが、出典の選び方は公表されていません。対象・件数・方法・限界をそろえ、確かめられる形にすることが前提です。" },
        { q: "回答者は何人いれば調査として出せますか？", a: "決まった基準はありません。件数そのものより、件数と対象を正直に書くことが大切です。少ない件数を細かく分けた数字は出さず、限界に書きます。" },
        { q: "プレスリリースだけ出せば十分ですか？", a: "数字の原本は自社サイトに置くことをおすすめします。リリースの配信ページは変更や削除ができないことがあり、方法やデータを全部は載せられません。リリースから調査ページにリンクします。" },
        { q: "調査結果をダウンロードするのにメール登録を必須にしてもいいですか？", a: "営業上の理由で登録を求めることはできますが、AIのクローラーや記者は登録の先を読めません。少なくとも要点・調査概要・主な表はページに文字で公開してください。" },
        { q: "「満足度No.1」と書くための調査をしてもいいですか？", a: "景品表示法の対象になります。消費者庁は、利用したか確かめずに満足度を聞いた調査を問題の例に挙げ、責任は広告主にあるとしています。比べた相手・対象・方法を明記し、必要に応じて専門家に確認してください。" },
        { q: "AIでデータを分析・文章化してもいいですか？", a: "使えますが、数字は元のデータで確かめ、AIをどう使ったかを調査概要に書くと読者が判断できます。Googleも、自動化やAIをどう使ったかの説明を勧めています。" },
        { q: "Dataset の構造化データは必須ですか？", a: "必須ではありません。Google の Dataset Search 向けのもので、AIが使うと公表している会社はありません。CSVを公開するなら、本文と同じ内容で足すとよいでしょう。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトを読めるか確認",
        body: "登録不要の無料チェックで、構造化データ、llms.txt、AI検索のクローラーの許可の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "AI対応を無料でチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "Google、Googleアナリティクス、Search Console、Dataset Search、ChatGPT、OpenAI、Perplexity、Gemini、Search Engine Land、Gauge、Fivetran、Sprinklr、PRIZMA、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPress などの製品名・社名・媒体名は各社の商標または登録商標です。Nurevo はこれらの組織と提携していません。",
    },
    en: {
      title: "Original Research Pages That AI Search Can Cite | Nurevo",
      description: "Put your research on your own site with numbers, sample, dates, method and limits together. Page template, No.1-claim rules, Dataset markup and WordPress steps.",
      h1: "Original research and data pages: putting a citable \"original\" on your own site for AI search and journalists",
      lead: "To have original research or data cited by AI search, publish the original on your own site, not only in a press release, and state the sample, count, period, method and limits right next to the numbers. Research suggests that text with statistics and quotations is used more in generative answers, but no AI company publishes how it picks sources, and no method can promise a citation. Even a small business can produce data nobody else has: tallies of its own orders or enquiries, price records, or measured comparisons.",
      intro: [
        "Written 25 November 2026 (JST). Research findings and figures were checked the same day against the papers (arXiv), a Search Engine Land article, Google's documentation, and the Japanese Consumer Affairs Agency's notices and press coverage.",
        "AI answers change from day to day, each AI company decides which pages to cite, and the detailed criteria are not public. This guide is about publishing research correctly and in a form others can verify.",
      ],
      sections: [
        {
          heading: "Do numbers and first-hand data get used in AI answers? Three studies",
          paragraphs: [
            "\"Original data gets cited by AI\" is a common claim, but the studies behind it come with conditions. Here are the three most useful.",
          ],
          table: {
            head: ["Study", "Setup", "Findings"],
            rows: [
              ["GEO (Princeton and others, KDD 2024)", "10,000 queries; an experimental pipeline where gpt-3.5-turbo answers from Google's top 5 results (also tested on Perplexity)", "Adding statistics raised the position-adjusted word count metric from 19.3 to 25.2, adding quotations to 27.2, citing sources to 24.6; keyword stuffing dropped it to 17.7. Up to about 40% improvement (up to 37% on Perplexity)"],
              ["Kevin Indig (Search Engine Land)", "Gauge data: 301 pages cited across 316 prompts in 7 verticals, 1,075 citations", "Primary research was 8 pages (2.7%) but took 8.4% of citations (90), 11.3 per page vs 3.4 for others. But 75 of the 90 came from one cluster: cloud data warehouse benchmarks"],
              ["Sprinklr researchers (SIGIR 2026)", "Six AI models, 252,000 trials comparing two documents", "Topical relevance and list position mattered most for being cited first. Explicit prices and a recent timestamp also helped. Formatting-only edits had little effect"],
            ],
          },
          after: [
            `Sources: [the GEO paper](${SRC.geo}), [Kevin Indig's article](${SRC.indig}), [What Gets Cited](${SRC.sigir}). GEO's results come from an experimental pipeline, not today's ChatGPT or Google AI Mode. Indig's article does not explain how prompts were chosen, and no date is shown on it.`,
            "Together they support only this much: (1) numbers, quotations and named sources in the text tend to be used more in answers; (2) primary research is strongest where people ask for a benchmark figure; (3) content that fits the question and a recent date matter more than formatting.",
            `Google's own self-assessment questions for helpful content include whether the content provides original information, reporting, research or analysis ([Google Search Central](${SRC.helpfulEn})).`,
          ],
        },
        {
          heading: "What marketers in Japan report",
          paragraphs: [
            `Interest in first-hand information is rising in Japan as well. In a PRIZMA survey (July 2026, 426 people), "primary information" was the measure marketers felt worked best for Google's AI Overviews at 43.5%, second to outside distribution at 52.8% ([ASCII.jp](${SRC.prizma}), Japanese). Another survey (August 2026, 1,003 people) found primary information was the most common tactic in use, at 46.9% ([TRUE MARKETING](${SRC.truemkt}), Japanese).`,
            "Both come from companies that sell AI-search services, and the effects are self-reported. They do not show that publishing first-hand data gets you cited.",
          ],
        },
        {
          heading: "Five kinds of original data a small business can produce",
          paragraphs: ["You don't need to commission a big survey. You already hold data no other company has."],
          table: {
            head: ["Kind", "Examples", "Watch out for"],
            rows: [
              ["Tallies of your own work", "Breakdown of quote requests, busiest months for enquiries, share of repairs by fault", "Aggregate so no individual can be identified; don't publish very small groups"],
              ["Price and rate records", "Monthly purchase prices; asking rents in your area tracked for a year", "Say what you recorded, where and when"],
              ["Measurements and benchmarks", "Tools or equipment tested under the same conditions; site speed comparisons", "Describe conditions and steps; be fair to other companies' products"],
              ["Customer surveys", "Post-service satisfaction, reasons for choosing you", "State that only customers were asked; read the Japan rules section below before using it in a \"No.1\" claim"],
              ["Re-tallied public data", "Government statistics re-cut by region or industry", "Name the original source and date retrieved, and say you processed it"],
            ],
          },
          after: [
            "In Indig's analysis, citations clustered on benchmark results. Look for questions in your trade that people want to compare but can't find numbers for (\"how many days does X repair take?\"), and a topic usually follows.",
          ],
        },
        {
          heading: "Ten things to put on the research page",
          paragraphs: ["A press release lives on the distribution service; the original of the numbers lives on your site. Always link from the release to this page."],
          table: {
            head: ["Item", "How to write it", "Why"],
            rows: [
              ["Title", "What, where, when, how many (e.g. \"412 moving quote requests in X city, October 2026\")", "Readers and AI can tell at a glance whether it fits the question"],
              ["Key findings", "One number per sentence, with the base, period and source name in the same sentence", "The sentence still makes sense if quoted alone"],
              ["About the study", "Population, how it was selected, period, method, count (n)", "Lets readers and AI judge how much weight the number carries"],
              ["Questions and definitions", "The exact question wording; what counted as \"yes\"", "Keeps the meaning of the number stable"],
              ["Results table", "A text table, not an image, with the base for each figure", "Both AI and readers can read it"],
              ["Limitations", "What you didn't measure; where bias is likely", "Prevents over-reading"],
              ["Opinion", "Clearly marked: \"From here on, this is our view\"", "Keeps facts and interpretation apart"],
              ["Citation terms", "How to credit, plus ready-to-use sentences", "Makes it easy for others to cite correctly"],
              ["Data file", "CSV or similar, with column descriptions", "Others can verify"],
              ["Dates and change log", "Published, tallied, what was corrected", "Research suggests recent dates help"],
            ],
          },
          after: [
            "Nurevo's own research pages use this structure. For example, [our survey of Japanese web agencies' sites](/guide/research-japan-web-agencies-ai-search-2026) states 2,756 targets, 2,357 home pages reached and a tally date of 5 November 2026 in its method section, and keeps limitations, citation terms and our opinion under separate headings. It names no companies and publishes no figures for groups under 30 sites.",
          ],
        },
        {
          heading: "Rules when survey results become advertising claims (Japan example)",
          paragraphs: [
            "Advertising rules for survey-based claims differ by country. In Japan, using results in ads such as \"No.1 in customer satisfaction\" falls under the Act against Unjustifiable Premiums and Misleading Representations. Japan's rules are described here as one example; check the rules where you operate.",
            `On 26 September 2024 Japan's Consumer Affairs Agency published a fact-finding report on No.1 claims ([CAA](${SRC.caa}), Japanese). According to press coverage, it was based on 368 ads, a web survey of 1,000 consumers and interviews with 15 advertisers, of whom only one knew which competitors had been compared ([ECのミカタ](${SRC.ecnomikata}), Japanese).`,
            `At the commissioner's press conference, a satisfaction survey that never checked whether respondents had used the product was given as a problem example; responsibility stays with the advertiser even when a research firm ran the survey, and advertisers were asked to let consumers see the basis ([summary](${SRC.caaPress}), Japanese). The Japan Fair Trade Commission's 2008 view — the claim must rest on an objective survey, and results must be cited accurately — still applies.`,
            `On 18 January 2022 the Japan Marketing Research Association issued a protest against "No.1 surveys" designed to produce a set result. Coverage listed tactics such as not disclosing the design, skewed samples, stopping once ahead, and splitting categories until a first place appears ([J-CAST](${SRC.jcast}), Japanese).`,
          ],
          list: [
            "On the research page, state the population, who you compared against, period, method and count, whether or not you make a No.1 claim",
            "Say whether you asked users or asked non-users for impressions",
            "When numbers appear in ads or releases, link (or QR-code) to the research page",
            "Label paid placements as advertising (Japan has regulated stealth marketing since October 2023)",
          ],
          after: ["This guide is not legal advice. Check with a professional where needed before using results in advertising."],
        },
        {
          heading: "Structured data: should you use Dataset?",
          paragraphs: [
            `Google documents Dataset structured data for making datasets easier to find in Dataset Search; "a table or a CSV file with some data" is among its examples. Required properties are name and description (50 to 5,000 characters); creator, license, temporalCoverage, spatialCoverage, variableMeasured and distribution (download URL and format) are among the recommended ones ([Google Search Central](${SRC.datasetEn})).`,
            "It is for Dataset Search, and no AI company has said it uses this markup in answers. Writing the method and tables as text on the page comes first; treat Dataset as an extra when you publish a CSV. Don't put anything in structured data that isn't visible on the page.",
          ],
        },
        {
          heading: "Steps in WordPress",
          list: [
            "Create the research page as a Page with a short English slug such as /research-2026/. Use headings for key findings, about the study, results, limitations, opinion, citation terms, data and change log.",
            "Put results in a Table block as text. If you add a chart image, place a table with the same numbers below it.",
            "Upload the CSV to the Media Library (or your own server) and link it from the page, with column names and meanings in the text. If the data sits behind a form or email sign-up, neither AI crawlers nor journalists can read it.",
            "Link to the research page from the press release, blog posts and the company page. How to write the release is in [Making press releases work for AI search](/guide/agency-press-release-ai-search).",
            "In Nurevo AEO (a free WordPress plugin), nodes you add to 'extra' through the webmcp_canary_schema_graph filter are not removed even alongside an SEO plugin (example below). The filter is not called on pages excluded from structured data. Since 0.9.1, using it alongside SEO SIMPLE PACK or VK All in One Expansion Unit does not duplicate structured data.",
            "Nurevo AEO's llms.txt lists up to 30 of the most recently modified published pages and posts. A research page left unedited can drop off, so to keep it listed, add a line with the webmcp_canary_llms_txt_lines filter (second example).",
            `Afterwards, check the page source (application/ld+json) and /llms.txt to confirm they match the page. [Get it on WordPress.org](${WP_ORG})`,
          ],
          code: DATASET_EN,
        },
        {
          heading: "Keep the research page in llms.txt",
          paragraphs: ["Separately from Dataset, this pins an entry for the research page in llms.txt."],
          code: LLMS_EN,
        },
        {
          heading: "How to check",
          list: [
            "Ask ChatGPT, Perplexity and Google AI Mode the question your research answers (\"when is moving cheapest in (region)?\") and record the answer and source URLs with the date.",
            "See which appears as a source — the research page, the release or coverage of it — and whether the numbers are quoted correctly. If they're wrong, rewrite the key-finding sentence more plainly.",
            "In Google Analytics 4, look at visits to the research page from AI services and CSV downloads. Track links and mentions with Search Console's links report and brand searches.",
            "AI answers vary by day, so ask the same questions on the same day each month. A method for a fixed question set is in [How to measure AI visibility](/guide/measure-ai-visibility).",
            "Nurevo AEO's free AI check asks Perplexity three questions built from your industry and area once a month. Pro (from USD 99 a month) also measures on Perplexity for now, with ChatGPT once configured.",
          ],
        },
        {
          heading: "Pre-publication checklist",
          list: [
            "The title says what, where, when and how many",
            "Each key-finding sentence includes the base, period and source name",
            "Population, selection, period, method, count and question wording are stated",
            "Results are in a text table, not only an image",
            "Limitations are written down",
            "Facts and our opinion are under separate headings",
            "Data is aggregated so no person or client can be identified; tiny groups are withheld",
            "If used for No.1 or ad claims, it says whether users were asked and who was compared",
            "The CSV and column descriptions are available without sign-up",
            "Citation terms and ready-to-use sentences are on the page",
          ],
        },
        {
          heading: "Repeat it every year",
          paragraphs: [
            "Running the same method every year (or month) gives you a number nobody else has: how it changed since last time. Give each year its own URL (/research-2026/, /research-2027/), keep earlier pages and link them to each other. If you change the method, say in the limitations what can't be compared.",
          ],
        },
      ],
      faqs: [
        { q: "Will a research page get us cited by AI?", a: "Not guaranteed. Research suggests text with numbers and sources is used more in answers, but source selection isn't public. Stating population, count, method and limits so others can verify is the starting point." },
        { q: "How many respondents do we need?", a: "There's no fixed threshold. Stating the count and population honestly matters more than the number itself. Don't publish small groups sliced finely; note it in the limitations." },
        { q: "Isn't a press release enough?", a: "Keep the original of the numbers on your own site. Distribution pages can't always be edited or removed and can't hold the full method and data. Link from the release to the research page." },
        { q: "Can we require an email sign-up to download results?", a: "You can, for sales reasons, but AI crawlers and journalists can't read past a sign-up. At least publish the key findings, method and main tables as text on the page." },
        { q: "Can we run a survey so we can say \"No.1 in satisfaction\"?", a: "In Japan that falls under the misleading-representations law; the Consumer Affairs Agency flagged surveys that never checked whether respondents had used the product and says the advertiser is responsible. Other countries have their own rules. State who was compared, the population and method, and check with a professional." },
        { q: "Can we use AI to analyse the data or draft the text?", a: "Yes, but check every number against the source data and say in the method how AI was used so readers can judge. Google also recommends explaining how automation or AI was used." },
        { q: "Is Dataset structured data required?", a: "No. It's for Google's Dataset Search, and no AI company says it uses it. If you publish a CSV, adding it with the same content as the page is reasonable." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your site",
        body: "A free check with no sign-up shows the state of your structured data, llms.txt and access for AI search crawlers. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Google, Google Analytics, Search Console, Dataset Search, ChatGPT, OpenAI, Perplexity, Gemini, Search Engine Land, Gauge, Fivetran, Sprinklr, PRIZMA, SEO SIMPLE PACK, VK All in One Expansion Unit, WordPress and their product, company and publication names are trademarks of their respective owners. Nurevo is not affiliated with these organizations.",
    },
  },
};
