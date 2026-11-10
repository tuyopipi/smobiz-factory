// Content page: how to see Google's AI features (AI Overviews, AI Mode) in
// Search Console - the Generative AI performance report (Search), how its
// impressions are counted, how to read it next to the normal Performance
// report, the Search generative AI control, WordPress steps and what Search
// Console cannot show (ChatGPT, Perplexity).
//
// Written 2026-11-10 (JST). Google facts were read that day on Google's own
// pages (linked in SRC): the two Search Console Help articles (report and
// control), the Discover report article, the Search Central blog post of
// 2026-06-03, "AI features and your website" (last updated 2025-12-10) and the
// Search Console data anomalies page (Aug 13-17, 2026 logging issue, restored).
// Not stated, because no Google page we read says it: clicks or position in
// the generative AI report, API access, hourly dates, data retention beyond
// "the usual data limitations".
// utm_source=chatgpt.com: same OpenAI FAQ sentence as measure-ai-visibility.
// Product facts: readme.txt 0.9.1 (Google-Extended left to robots.txt by
// default; free AI check on Perplexity; Pro measurement on Perplexity).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  reportJa: "https://support.google.com/webmasters/answer/16984139?hl=ja",
  reportEn: "https://support.google.com/webmasters/answer/16984139?hl=en",
  controlJa: "https://support.google.com/webmasters/answer/16908024?hl=ja",
  controlEn: "https://support.google.com/webmasters/answer/16908024?hl=en",
  discoverJa: "https://support.google.com/webmasters/answer/16983858?hl=ja",
  discoverEn: "https://support.google.com/webmasters/answer/16983858?hl=en",
  anomaliesJa: "https://support.google.com/webmasters/answer/6211453?hl=ja",
  anomaliesEn: "https://support.google.com/webmasters/answer/6211453?hl=en",
  blog: "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  openaiFaq: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
  report: "https://search.google.com/search-console/performance/search-analytics/ai",
  control: "https://search.google.com/search-console/settings/search-gen-ai",
};

export default {
  slug: "search-console-ai-features",
  targetQueries: [
    "Search Console generative AI performance report",
    "how to see AI Overviews impressions in Search Console",
    "Search Console AI Mode data",
    "サーチコンソール AIによる概要 表示回数",
    "Search Console 生成AI パフォーマンス レポート 見方",
    "サーチコンソール AIモード 確認",
  ],
  related: ["measure-ai-visibility", "aeo-vs-seo-vs-geo", "agency-aeo-monthly-service", "aeo-tools-comparison", "what-is-aeo"],
  locales: {
    ja: {
      title: "Search ConsoleでAIによる概要・AIモードの表示を見る方法 | Nurevo",
      description: "Search Consoleの「生成AIパフォーマンスレポート」の開き方、表示回数の数え方、通常のレポートとの読み合わせ方、除外設定の注意、WordPressでの手順をまとめました。",
      h1: "Search ConsoleでAIによる概要・AIモードの表示を見る方法：生成AIレポートの読み方と注意点",
      lead: "GoogleのAIによる概要（AI Overviews）とAIモードにあなたのサイトがどれだけ表示されたかは、Search Consoleの「生成AIパフォーマンスレポート（検索）」で見られます。2026年8月31日から全世界のサイトに提供されています。わかるのは表示回数で、ページ・国・デバイス・日付ごとに分けられます。クリックはこのレポートには出ないため、通常の検索パフォーマンスと並べて読みます。",
      intro: [
        "作成日：2026年11月10日。Googleの仕様は、同日にSearch Consoleヘルプと検索セントラルの公式ページで確認したものです。画面や仕様は変わることがあるため、最新のヘルプもあわせてご確認ください。",
        "このレポートで見えるのはGoogleの検索の中のAI機能だけです。ChatGPTやPerplexityでの見え方は、別の方法で確かめる必要があります（後の章）。また、どんな対策をしても、AIの回答に必ず表示される・順位が保証されるということはありません。AIの回答は日々変わります。",
      ],
      sections: [
        {
          heading: "生成AIパフォーマンスレポートでわかること・わからないこと",
          paragraphs: [
            `Googleは2026年6月3日にこのレポートを発表し（[検索セントラル ブログ](${SRC.blog})）、最初は一部のサイトから提供を始めました。ヘルプによると、2026年8月31日時点で全世界のすべてのサイトに提供されています（[Search Console ヘルプ：生成 AI パフォーマンス レポート（検索）](${SRC.reportJa})）。要点は次のとおりです。`,
          ],
          table: {
            head: ["項目", "内容（2026年11月10日時点のヘルプによる）"],
            rows: [
              ["対象", "Google検索のAIによる概要とAIモード。Search Labsの試験機能のデータは含まれません"],
              ["指標", "表示回数（AI機能の中で、あなたのサイトへのリンクが利用者に表示された回数）"],
              ["分け方", "ページ、国、デバイス（パソコン・タブレット・モバイル）、日付"],
              ["検索タイプ", "「ウェブ：テキストベース」と「ウェブ：マルチモーダル」（Googleレンズ、かこって検索、画像のアップロードなど）"],
              ["時刻", "日付は太平洋時間。直近のデータは暫定値で、グラフでは点線で示されます"],
              ["書き出し", "グラフと表をダウンロード可能。画面で「~」や「-」と表示された値は、ファイルでは0になります"],
              ["通常のレポートとの関係", "通常の検索パフォーマンスの「ウェブ」のデータに含まれる分を、AI機能に絞って見せるもの"],
              ["Discover", "Discoverの生成AI機能は、別の「生成 AI パフォーマンス レポート（Discover）」で見ます"],
            ],
            caption: "表示回数のほかに、クリック数・掲載順位・検索キーワードをこのレポートで見られるとは、ヘルプには書かれていません。",
          },
          after: [
            `わからないことも押さえておきます。どんな検索語でAIに表示されたか、AIの回答の中で何番目に出たか、AIの回答からのクリック数は、このレポートでは見られません。GoogleのAI機能からのクリックや表示は、通常の検索パフォーマンスの「ウェブ」の数字に含めて集計されます（[Google：AI機能とウェブサイト](${SRC.googleAi})）。Discoverのレポートは[こちらのヘルプ](${SRC.discoverJa})にあります。`,
          ],
        },
        {
          heading: "レポートの開き方と、表示されないときの確認",
          list: [
            `Search Consoleで対象のプロパティを選び、生成AIパフォーマンスレポート（検索）を開きます。直接開くURLは ${SRC.report} です（ログインが必要です）。`,
            "期間を「過去3か月」などに広げ、グラフで表示回数の推移を見ます。直近の点線部分は暫定値なので、月の比較からは外します。",
            "表の「ページ」タブで、AI機能に表示されたページを確認します。リダイレクト後の最終URLで集計されます。",
            "「国」「デバイス」タブで、どの地域・端末で表示されているかを見ます。店舗や地域の事業なら、国内の比率を確認します。",
            "検索タイプのフィルタで「ウェブ：マルチモーダル」に切り替え、画像を使った検索での表示があるかも見ておきます（商品や料理、建物などの写真が多いサイト向け）。",
          ],
          after: [
            `レポートが出てこない、または数字が空のときは、まず2つを確認します。1つは、AI機能での表示回数がまだ少ない場合で、ヘルプはこれがよくある理由だとしています。もう1つは、後で説明する「検索の生成 AI」設定でサイトが除外されている場合です（[ヘルプ](${SRC.reportJa})）。`,
            `なお、2026年8月13日〜17日はGoogle側の記録の不具合で表示回数が少なく出ていましたが、データは後に復元されたと公表されています（[Search Console のデータ異常](${SRC.anomaliesJa})）。過去の数字に不自然な落ち込みがあるときは、まずこのページを見ます。`,
          ],
        },
        {
          heading: "数え方の注意：グラフと表の合計が合わない理由",
          paragraphs: [
            "このレポートは、場所によって数え方が違います。知らずに比べると、数字が合わずに混乱します。",
          ],
          table: {
            head: ["見ている場所", "数え方", "例：同じAIの回答に、自社の2ページのリンクが出た"],
            rows: [
              ["グラフの合計", "プロパティ（サイト）単位", "1回"],
              ["表の「ページ」", "ページ単位", "ページAに1回、ページBに1回（合計2回）"],
              ["表の「国」「デバイス」「日付」", "プロパティ単位", "1回"],
              ["グラフ（URLで絞り込んだとき）", "URL単位", "絞り込んだページの1回"],
            ],
            caption: "Search Console ヘルプ（生成 AI パフォーマンス レポート（検索））の説明をもとに作成。",
          },
          after: [
            "このため、ページ表の合計はグラフの合計より大きくなることがあります。報告書に書くときは「サイト全体の表示回数（グラフ）」と「ページごとの表示回数（表）」を分けて書き、足し合わせないようにします。表は通常のレポートと同じく1,000行までの制限があります。",
          ],
        },
        {
          heading: "通常の検索パフォーマンスと並べて読む",
          paragraphs: [
            "生成AIレポートは表示回数しかないため、単独では「表示が増えて良かった」以上のことが言えません。通常の検索パフォーマンス（検索タイプ：ウェブ）のページ別のクリック数・表示回数と、同じ期間・同じページで並べると、読み取れることが増えます。",
          ],
          table: {
            head: ["AI機能の表示回数", "通常レポートのクリック数", "考えられること・次にやること"],
            rows: [
              ["増えた", "増えた・変わらない", "AI機能でも通常の結果でも見つけられている。そのページの事実（料金・営業時間など）が最新かを定期的に確認"],
              ["増えた", "減った", "AIの回答で用が足りて、クリックが減っている可能性。ページの中に、AIの要約だけでは伝わらない情報（予約、見積もり、写真、事例）があるかを見直す"],
              ["少ない・ない", "多い", "通常の検索では強いが、AI機能のリンクにはあまり出ていない。質問に直接答える文章や、ページの見える内容と一致した構造化データがあるかを確認"],
              ["少ない・ない", "少ない", "まずは通常のSEOの基本（インデックス、スニペット表示の可否、内容の充実）から"],
            ],
            caption: "原因は数字からは断定できません。あくまで仮説を立てて確かめるための目安です。",
          },
          after: [
            `Googleは、AI機能に表示されるための追加の要件や特別な最適化はなく、ページがインデックスされ、スニペット付きで表示できる状態であることが条件だとしています（[Google：AI機能とウェブサイト](${SRC.googleAi})）。表示が少ないページは、まず通常の検索での状態を確認するのが近道です。`,
          ],
        },
        {
          heading: "毎月の確認チェックリスト",
          list: [
            "期間を前月1か月（太平洋時間の日付）に固定し、グラフの表示回数を記録する。暫定値の日は含めない",
            "ページ表の上位10ページと、前月からの増減を記録する",
            "同じ10ページについて、通常の検索パフォーマンス（ウェブ）のクリック数と表示回数を並べて記録する",
            "国・デバイスの比率に大きな変化がないかを見る",
            "データ異常のページで、その月に記録の不具合が公表されていないかを確認する",
            "「検索の生成 AI」設定が意図どおり（通常は「含める」または親から継承）かを確認する",
            "ChatGPT・Perplexityなど、Google以外のAIでの見え方を別の方法で記録する（後の章）",
          ],
          after: [
            "記録表の列は「月／AI機能の表示回数（サイト）／上位ページ／そのページのウェブのクリック数・表示回数／メモ（サイトの変更・不具合）」の5つで十分です。サイトの変更（ページの追加、構造化データの修正、テーマ変更）をメモに書いておくと、後で増減の理由を考えやすくなります。",
          ],
        },
        {
          heading: "「検索の生成 AI」設定：除外すると何が起きるか",
          paragraphs: [
            `レポートと同時に、AI機能へのサイトの表示を止める設定も用意されました。Search Consoleの［設定］＞［検索の生成 AI］にあり、2026年8月31日時点で全世界のサイトに提供されています（[Search Console ヘルプ：検索の生成 AI 設定](${SRC.controlJa})）。`,
          ],
          table: {
            head: ["選択肢・方法", "起きること"],
            rows: [
              ["含める（既定）", "AIによる概要・AIモード・Discoverの生成AI機能に、サイトのリンクと内容が使われる"],
              ["除外", "これらのAI機能にリンクと内容が出なくなり、回答を作る材料にも使われない。AI機能からの表示やアクセスもなくなる"],
              ["親から継承", "ドメインプロパティなど上位のプロパティの設定に従う（上位がある場合の既定）"],
              ["Google-Extended（robots.txt）", "AIの学習への利用を制限するためのもの。「検索の生成 AI」設定は学習には影響しない"],
              ["noindex", "Google検索そのものから外す"],
              ["nosnippet・data-nosnippet・max-snippet", "検索結果やAI機能での抜粋（プレビュー）に使われる範囲を制限する"],
            ],
            caption: "Search Console ヘルプ（検索の生成 AI 設定）と、Google検索セントラル（AI機能とウェブサイト）をもとに作成。",
          },
          after: [
            "Googleは、この設定は検索のほかの部分の順位や掲載の判断には使わないとしています。除外は設定から1〜2日で反映され、キャッシュなどの都合でもっとかかる場合があります。",
            "多くの事業者にとって、AI機能はお客様に見つけてもらう入口の1つです。除外するのは、会員向けの情報や、要約されると誤解を招く内容が中心のサイトなど、はっきりした理由がある場合に限るのが無難です。一部の文章だけ要約に使われたくないなら、サイト全体の除外ではなく data-nosnippet を使う方法もあります。",
          ],
        },
        {
          heading: "WordPressでの手順",
          list: [
            "プロパティはドメインプロパティで登録する：DNSのTXTレコードで所有権を確認します。上位のドメインプロパティの「検索の生成 AI」設定は下位のURLプレフィックスのプロパティに引き継がれるため、www付き・なし、http・httpsをまとめて管理できます。",
            "インデックスを止めていないか確認する：WordPressの［設定］＞［表示設定］の「検索エンジンでの表示」にチェックが入っていると、検索エンジンにインデックスしないよう求めます。移転や公開直後に外し忘れがないかを見ます。",
            "robots.txtでGooglebotを止めていないか確認する：ブラウザで /robots.txt を開き、Googlebot や全体（User-agent: *）に Disallow: / がないかを見ます。",
            "要約に使われたくない一部分には data-nosnippet：ブロックエディタでその段落を「HTMLとして編集」にし、囲む要素に data-nosnippet 属性を付けます。ページ全体を止めたいときは、使っているSEOプラグインのページごとの設定（noindex など）を使います。",
            "構造化データとページの見える内容をそろえる：営業時間・料金・住所などは、ページの文章と構造化データで同じ値にします。食い違いはAIの回答の誤りの原因になります。",
          ],
          after: [
            `Nurevo AEO（WordPressプラグイン、無料）は、構造化データ・llms.txt・AI検索のクローラ向けのrobots.txtをサーバー側で出力します。AIの学習用のクローラ（Google-Extendedなど）は、初期設定ではサイトのrobots.txtのとおりにしておき、許可か拒否かを管理画面から選べます。これはrobots.txtの仕組みで、Search Consoleの「検索の生成 AI」設定とは別のものです。[WordPress.orgで入手](${WP_ORG})`,
          ],
        },
        {
          heading: "Search Consoleでわからないこと：ChatGPT・Perplexityの見え方",
          paragraphs: [
            "Search Consoleが扱うのはGoogleだけです。ChatGPTやPerplexityの回答にあなたの会社や店が出ているかは、次の方法で補います。",
          ],
          table: {
            head: ["方法", "わかること"],
            rows: [
              ["アクセス解析の参照元", `AIの回答からサイトに来た訪問。OpenAIは、ChatGPTの検索結果からのリンクに utm_source=chatgpt.com を付けるとしています（[OpenAI：パブリッシャー向けFAQ](${SRC.openaiFaq})）`],
              ["決めた質問を定期的に聞く", "店名を含まない質問で、名前が出たか・サイトが引用されたかの割合。[AIでの登場率の測り方](/guide/measure-ai-visibility)"],
              ["計測ツール", "質問のセットを自動で聞き、言及・引用・競合・推移を記録。[AEOツールの比較](/guide/aeo-tools-comparison)"],
            ],
          },
          after: [
            "Nurevo AEOでは、接続したFree・Standardのサイトに、業種と地域から作った店名を含まない3つの質問を月1回Perplexityに聞く無料のAIチェックがあります。決めた質問のセットを継続して測るPro（月14,800円〜、ベータ）も、現在はPerplexityで測っています。Search ConsoleのGoogleの数字と、こうしたGoogle以外のAIの記録を、同じ月の表に並べておくと全体像がつかめます。",
          ],
        },
      ],
      faqs: [
        { q: "生成AIパフォーマンスレポートはどこにありますか？", a: "Search Console ヘルプにある直接のURL（search.google.com/search-console/performance/search-analytics/ai）から開けます。2026年8月31日時点で全世界のサイトに提供されています。表示されない場合は、AI機能での表示回数が少ないか、「検索の生成 AI」設定で除外されている可能性があります。" },
        { q: "AIによる概要からのクリック数は見られますか？", a: "生成AIパフォーマンスレポートで見られるのは表示回数です。GoogleのAI機能からのクリックや表示は、通常の検索パフォーマンスの「ウェブ」の数字に含まれますが、AI機能の分だけを切り分けたクリック数は見られません。ページ別に、AI機能の表示回数と通常のクリック数を並べて読むのが現実的です。" },
        { q: "グラフの合計と、ページ表の合計が違うのはなぜですか？", a: "グラフはサイト単位、ページ表はページ単位で数えるためです。同じAIの回答に自社の2ページが出た場合、グラフでは1回、ページ表では各ページに1回ずつ数えられます。報告書では2つを足し合わせないようにします。" },
        { q: "「検索の生成 AI」設定で除外すると、通常の検索順位は下がりますか？", a: "Googleは、この設定は検索のほかの部分の順位や掲載の判断には使わないとしています。ただし、除外するとAIによる概要・AIモード・Discoverの生成AI機能からの表示とアクセスはなくなります。AIの学習への利用を制限したい場合は、この設定ではなくGoogle-Extendedを使います。" },
        { q: "ChatGPTやPerplexityでの表示もSearch Consoleでわかりますか？", a: "いいえ。Search ConsoleはGoogleのデータだけです。ChatGPTやPerplexityは、アクセス解析の参照元、決めた質問を定期的に聞く方法、計測ツールなどで別に確認します。" },
        { q: "表示回数を増やすために特別な設定はありますか？", a: "Googleは、AI機能に表示されるための追加の要件や特別な最適化はないとしています。インデックスされていてスニペット付きで表示できること、内容が質問に直接答えていること、構造化データがページの見える内容と一致していることなど、通常の基本を整えるのが近道です。表示が保証される方法はありません。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトを読めるか確認",
        body: "登録不要の無料チェックで、構造化データやllms.txt、AI検索のクローラの許可など、AIが読む情報の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "Google、Search Console、Google Discover、ChatGPT、OpenAI、Perplexity、WordPressおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "How to See AI Overviews and AI Mode in Search Console | Nurevo",
      description: "Open Search Console's Generative AI performance report, understand how its impressions are counted, read it next to the Performance report, and decide on the AI control.",
      h1: "How to see AI Overviews and AI Mode in Search Console: reading the Generative AI performance report",
      lead: "Search Console's \"Generative AI performance report (Search)\" shows how often links to your site appeared in Google's AI Overviews and AI Mode. It has been available to all websites worldwide since August 31, 2026. It reports impressions, broken down by page, country, device and date. It does not show clicks, so read it side by side with the normal Performance report.",
      intro: [
        "Written November 10, 2026. Google's behavior described here was checked that day in Search Console Help and on Google Search Central. Screens and rules can change, so check the current help pages too.",
        "This report only covers AI features inside Google Search. How you appear in ChatGPT or Perplexity has to be checked another way (see below). And nothing you do can guarantee that an AI answer will include you or rank you anywhere. AI answers change from day to day.",
      ],
      sections: [
        {
          heading: "What the report shows and what it does not",
          paragraphs: [
            `Google announced the report on June 3, 2026 ([Search Central Blog](${SRC.blog})) and first rolled it out to a subset of sites. According to the help page, it reached all websites worldwide as of August 31, 2026 ([Search Console Help: Generative AI performance report (Search)](${SRC.reportEn})). The essentials:`,
          ],
          table: {
            head: ["Item", "What the help page says (as of November 10, 2026)"],
            rows: [
              ["Coverage", "AI Overviews and AI Mode in Google Search. Data from Search Labs experiments is not included"],
              ["Metric", "Impressions: how many times links to your site were shown to a user in a generative AI feature"],
              ["Breakdowns", "Pages, countries, devices (desktop, tablet, mobile) and dates"],
              ["Search type", "\"Web: text-based\" and \"Web: multimodal\" (Google Lens, Circle to Search, uploaded images and similar)"],
              ["Time zone", "Dates are in Pacific Time. The newest data can be preliminary and is drawn as a dotted line"],
              ["Export", "Chart and table data can be downloaded. Values shown as ~ or - become zeros in the file"],
              ["Relation to the main report", "It shows the part of the Performance report's Web search type data that came from AI features"],
              ["Discover", "Generative AI features in Discover have their own report, the Generative AI performance report (Discover)"],
            ],
            caption: "The help page does not describe clicks, positions or queries in this report.",
          },
          after: [
            `Be clear about the gaps. This report does not tell you which queries triggered the AI feature, where in the answer your link appeared, or how many clicks the AI answer sent you. Clicks and impressions from Google's AI features are counted inside the normal Performance report under the Web search type ([Google: AI features and your website](${SRC.googleAi})). The Discover report is described [in this help article](${SRC.discoverEn}).`,
          ],
        },
        {
          heading: "Opening the report, and what to check when it is missing",
          list: [
            `In Search Console, choose your property and open the Generative AI performance report (Search). The direct link is ${SRC.report} (you need to be signed in).`,
            "Widen the date range, for example to the last three months, and look at the impressions trend in the chart. Leave the dotted, preliminary days out of any month-to-month comparison.",
            "In the table's Pages tab, see which pages were shown in AI features. Pages are reported by their final URL after redirects.",
            "Use the Countries and Devices tabs to see where and on what devices you appear. For a local business, check the share coming from your own country.",
            "Switch the search type filter to \"Web: multimodal\" to see whether you appear in image-based searches. This matters most for sites with many product, food or building photos.",
          ],
          after: [
            `If the report does not appear or is empty, check two things. The common reason, according to Google, is that your site has not yet had enough impressions in generative AI features. The other is that the site has been excluded with the Search generative AI control described below ([help page](${SRC.reportEn})).`,
            `Also note that from August 13 to 17, 2026, a logging problem at Google reduced the impressions in this report. Google says the missing data was later restored ([Search Console data anomalies](${SRC.anomaliesEn})). When an old dip looks odd, check that page first.`,
          ],
        },
        {
          heading: "How impressions are counted, and why the totals differ",
          paragraphs: [
            "The report counts differently depending on where you look. Compare numbers without knowing this and they will not add up.",
          ],
          table: {
            head: ["Where you look", "Counted by", "Example: one AI answer shows links to two of your pages"],
            rows: [
              ["Chart total", "Property (the whole site)", "1"],
              ["Table, Pages tab", "Page", "1 for page A and 1 for page B (2 in total)"],
              ["Table, Countries, Devices, Dates", "Property", "1"],
              ["Chart with a URL filter", "URL", "1 for the filtered page"],
            ],
            caption: "Based on Search Console Help, Generative AI performance report (Search).",
          },
          after: [
            "So the sum of the Pages table can be higher than the chart total. In a report, write the site-wide impressions (chart) and the per-page impressions (table) separately and never add them together. As in the normal report, the table is limited to 1,000 rows.",
          ],
        },
        {
          heading: "Read it next to the normal Performance report",
          paragraphs: [
            "Because the report only has impressions, on its own it can tell you little more than \"more impressions than last month\". Put it next to the normal Performance report (search type: Web) for the same pages and the same dates, and you can read much more.",
          ],
          table: {
            head: ["AI feature impressions", "Clicks in the normal report", "What it may mean, and what to do next"],
            rows: [
              ["Up", "Up or flat", "You are being found both in AI features and in normal results. Keep the facts on that page (prices, hours) current"],
              ["Up", "Down", "The AI answer may be satisfying the search, so fewer people click. Check whether the page offers what a summary cannot: booking, quotes, photos, case studies"],
              ["Low or none", "High", "Strong in normal results but rarely linked in AI features. Check for text that answers the question directly, and structured data that matches the visible page"],
              ["Low or none", "Low", "Start with SEO basics: indexing, whether a snippet can be shown, depth of content"],
            ],
            caption: "The numbers cannot prove a cause. Use these as hypotheses to test.",
          },
          after: [
            `Google says there are no additional requirements or special optimizations for appearing in AI features, and that a page must be indexed and eligible to be shown in Google Search with a snippet ([Google: AI features and your website](${SRC.googleAi})). For a page with few AI impressions, checking its state in normal search is the quickest start.`,
          ],
        },
        {
          heading: "Monthly checklist",
          list: [
            "Fix the date range to last month (Pacific Time dates) and record the chart's impressions. Leave out preliminary days",
            "Record the top ten pages in the Pages table and their change from the previous month",
            "For the same ten pages, record clicks and impressions from the normal Performance report (Web) next to them",
            "Look for large shifts in the country and device split",
            "Check the data anomalies page for any logging issue Google reported that month",
            "Confirm the Search generative AI control is set as intended (normally Include, or inherited from the parent)",
            "Record how you appear in AI outside Google, such as ChatGPT and Perplexity, another way (see below)",
          ],
          after: [
            "Five columns are enough for the log: month, AI feature impressions (site), top pages, those pages' Web clicks and impressions, and notes (site changes, known issues). Writing down site changes such as new pages, structured data fixes or a theme change makes it much easier to explain a rise or a fall later.",
          ],
        },
        {
          heading: "The Search generative AI control: what excluding does",
          paragraphs: [
            `Alongside the report, Google added a setting that stops your site from appearing in its AI features. It is under Settings > Search generative AI in Search Console, and it was available to all websites worldwide as of August 31, 2026 ([Search Console Help: Search generative AI control](${SRC.controlEn})).`,
          ],
          table: {
            head: ["Option or method", "What happens"],
            rows: [
              ["Include (default)", "Your links and content can be used in AI Overviews, AI Mode and generative AI features in Discover"],
              ["Exclude", "Your links and content no longer appear in those features and are not used as input to generate a response. You also get no impressions or traffic from them"],
              ["Inherit control from parent", "Follows the setting of a parent property such as a domain property (the default when a parent exists)"],
              ["Google-Extended (robots.txt)", "Limits use of your content for AI training. The Search generative AI control does not affect training"],
              ["noindex", "Removes the page from Google Search altogether"],
              ["nosnippet, data-nosnippet, max-snippet", "Limit how much of the page can be used as a preview in results and AI features"],
            ],
            caption: "Based on Search Console Help (Search generative AI control) and Google Search Central (AI features and your website).",
          },
          after: [
            "Google says the control is not used as a ranking or inclusion signal for other parts of Search. Exclusion takes effect within one to two days, and some content can take longer because of caching.",
            "For most businesses, AI features are one more way for customers to find them. Exclude only for a clear reason, such as a site built mainly around members-only content or text that misleads when summarized. If only some passages should stay out of summaries, data-nosnippet on those passages is an alternative to excluding the whole site.",
          ],
        },
        {
          heading: "Steps in WordPress",
          list: [
            "Register a domain property: verify ownership with a DNS TXT record. A domain property's Search generative AI setting is inherited by URL-prefix properties under it, so www and non-www, http and https are managed in one place.",
            "Make sure indexing is not blocked: in WordPress, Settings > Reading has a \"Search engine visibility\" option. When it is ticked, WordPress asks search engines not to index the site. Check it after a migration or a launch.",
            "Make sure robots.txt does not block Googlebot: open /robots.txt in a browser and look for Disallow: / under Googlebot or under User-agent: *.",
            "Keep a passage out of previews with data-nosnippet: in the block editor, choose \"Edit as HTML\" on that block and add the data-nosnippet attribute to the element around it. To stop a whole page, use your SEO plugin's per-page setting, such as noindex.",
            "Keep structured data and visible text in agreement: hours, prices and addresses should have the same values in the page text and in the structured data. A mismatch is a common source of wrong AI answers.",
          ],
          after: [
            `Nurevo AEO, a free WordPress plugin, outputs structured data, llms.txt and robots.txt rules for AI search crawlers from your own server. Crawlers that collect content for AI training, such as Google-Extended, are left to your robots.txt by default, and you can allow or block them from the admin screen. That is a robots.txt rule, separate from Search Console's Search generative AI control. [Get it on WordPress.org](${WP_ORG})`,
          ],
        },
        {
          heading: "What Search Console cannot show: ChatGPT and Perplexity",
          paragraphs: [
            "Search Console only covers Google. To see whether ChatGPT or Perplexity mention your business, add these:",
          ],
          table: {
            head: ["Method", "What it tells you"],
            rows: [
              ["Referrers in your analytics", `Visits that came from an AI answer. OpenAI says it adds utm_source=chatgpt.com to links from ChatGPT search results ([OpenAI: Publishers and Developers FAQ](${SRC.openaiFaq}))`],
              ["Asking fixed questions regularly", "With questions that do not contain your name, the share of answers that name you or cite your site. [How to measure AI visibility](/guide/measure-ai-visibility)"],
              ["Measurement tools", "Ask a question set automatically and record mentions, citations, competitors and trends. [AEO tools compared](/guide/aeo-tools-comparison)"],
            ],
          },
          after: [
            "Nurevo AEO includes a free AI check for connected Free and Standard sites: once a month it asks Perplexity three questions built from your trade and area, without your name. Pro (from USD 99 a month, in beta), which keeps measuring a fixed question set, also measures on Perplexity for now. Put Google's numbers from Search Console and these records from other AI platforms in the same monthly sheet to see the whole picture.",
          ],
        },
      ],
      faqs: [
        { q: "Where is the Generative AI performance report?", a: "Search Console Help gives a direct link to it (search.google.com/search-console/performance/search-analytics/ai). It was available to all websites worldwide as of August 31, 2026. If you cannot see it, your site may not have enough impressions in AI features yet, or it may be excluded with the Search generative AI control." },
        { q: "Can I see clicks from AI Overviews?", a: "The Generative AI performance report shows impressions. Clicks and impressions from Google's AI features are included in the normal Performance report under the Web search type, but you cannot isolate the clicks that came from AI features. The practical approach is to compare AI feature impressions with normal clicks page by page." },
        { q: "Why does the chart total differ from the Pages table?", a: "The chart counts by property and the Pages table counts by page. If one AI answer shows two of your pages, the chart counts one impression and the table counts one for each page. Do not add the two together in a report." },
        { q: "Will excluding my site with the Search generative AI control hurt my rankings?", a: "Google says the control is not used as a ranking or inclusion signal for other parts of Search. But once excluded, you get no impressions or traffic from AI Overviews, AI Mode or generative AI features in Discover. To limit AI training, use Google-Extended rather than this control." },
        { q: "Does Search Console show ChatGPT or Perplexity?", a: "No. Search Console only has Google's data. Check ChatGPT and Perplexity separately with your analytics referrers, by asking fixed questions regularly, or with a measurement tool." },
        { q: "Is there a special setting that increases AI impressions?", a: "Google says there are no additional requirements or special optimizations for AI features. Getting the basics right is the quickest route: pages that are indexed and can show a snippet, text that answers the question directly, and structured data that matches the visible page. No method guarantees that you will be shown." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your site",
        body: "A free check with no sign-up shows the state of what AI reads on your site: structured data, llms.txt and access for AI search crawlers. On WordPress, Nurevo AEO fills in what is missing for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Google, Search Console, Google Discover, ChatGPT, OpenAI, Perplexity, WordPress and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
