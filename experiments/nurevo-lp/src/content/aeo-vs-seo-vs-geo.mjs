// Content page: AEO vs GEO vs SEO (plus LLMO, AIO) — what each term means,
// whether they are the same thing, how AI search differs from classic search
// in where results show up and how they are measured, what to do first, and
// how to set it up on WordPress.
//
// Rewritten 2026-11-23 (JST, Monday skyscraper rewrite of the short
// 2026-10 page). Top pages read that day: Ahrefs JA (2026-07-17, mod.
// 2026-08-20), Adobe JP (2026-07-10), Stellagent (updated 2026-11-08),
// Sungrove (updated 2026-11-20), Ahrefs JA "GEO is just SEO" (2025-05-29, mod.
// 2026-02-19), issoh (updated 2026-10-30); HubSpot (updated 2026-11-10), Yext
// (2025-09-22), Backlinko (undated), Neil Patel (undated), Progress
// (2026-04-16), NeuronWriter (2026-08-05). Search Engine Land could not be
// fetched.
// Outside facts read 2026-11-23:
// - Aggarwal et al., "GEO: Generative Engine Optimization", arXiv 2311.09735v3
//   (28 Jun 2024), KDD '24 (Barcelona). Abstract: "up to 40%" visibility;
//   GEO-bench of 10,000 queries; up to 37% on Perplexity.ai. Authors from IIT
//   Delhi and Princeton (plus two independent). Keyword stuffing result NOT
//   stated (not verified in the text we could read).
// - Bing Webmaster blog 2026-02-10: AI Performance (public preview) — Microsoft
//   Copilot, AI-generated summaries in Bing, select partner integrations;
//   Total Citations, Average Cited Pages, grounding queries (sample),
//   page-level citations, trends. Bing Search blog 2026-06-16: Intents, Topics,
//   Citation Share (not a ranking, no competitor domains), Compare (preview).
// Facts reused from pages already on this site (not re-fetched today because
// the Google page could not be fetched this run):
// - Google "AI features and your website": no additional requirements or
//   special markup / AI text files for AI Overviews and AI Mode; SEO basics
//   apply (read 2026-10-30, 2026-11-10; last updated 2025-12-10).
// - Search Console generative AI performance report: impressions only,
//   worldwide from 2026-08-31 (search-console-ai-features, read 2026-11-10).
// - Nurevo study: 62 local businesses, rho 0.03 (aeo-signals-ai-answers-study).
// Product facts: readme.txt 0.9.1 (AEO score 0-100, server-rendered JSON-LD,
// llms.txt, AI crawler rules split search vs training, coexistence with Yoast
// SEO / Rank Math / AIOSEO / Slim SEO, SEO SIMPLE PACK and VK All in One
// Expansion Unit from 0.9.1; Free AI check: once a month, 3 questions to
// Perplexity built from business type and area; Pro measurement on Perplexity).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  geoPaper: "https://arxiv.org/abs/2311.09735",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  bingAiPerf: "https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview",
  bingInsights: "https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare",
  ahrefsJa: "https://ahrefs.com/ja/blog/geo-is-just-seo/",
  sungrove: "https://www.sungrove.co.jp/aio-llmo-difference/",
  neuron: "https://neuronwriter.com/geo-vs-aeo-vs-seo/",
};

export default {
  slug: "aeo-vs-seo-vs-geo",
  targetQueries: [
    "AEO vs GEO vs SEO",
    "difference between AEO and GEO",
    "LLMO vs GEO vs AEO",
    "AEO GEO SEO 違い",
    "LLMO AIO GEO 違い",
    "AEO GEO 同じ",
  ],
  related: ["what-is-aeo", "measure-ai-visibility", "search-console-ai-features", "aeo-signals-ai-answers-study", "aeo-tools-comparison", "aeo-wordpress"],
  locales: {
    ja: {
      title: "AEO・GEO・LLMO・AIOとSEOの違い：一覧表と、いま何をやるか | Nurevo",
      description: "AEO・GEO・LLMO・AIOは同じこと？SEOと何が違う？用語の一覧表、成果の出る場所と測り方の比較、研究で分かっていること、優先順位、WordPressでの手順とチェックリスト。",
      h1: "AEO・GEO・LLMO・AIOとSEOの違い：用語の一覧表、測り方の違い、いまやる順番",
      lead: "AEO・GEO・LLMO・AIOは、どれも「ChatGPT・Perplexity・GoogleのAIによる概要などの回答の中で、自社の名前を挙げてもらう・出典として引用してもらう」ための取り組みを指す言葉で、実務ではほぼ同じものとして扱って問題ありません。SEOは検索結果のリンク一覧で上位に出るための取り組みです。土台（クロールされる・ページに正確な事実がある）は共通で、違うのは成果が出る場所と測り方です。Google も、AIによる概要やAIモードのために特別な対策は必要なく、SEOの基本がそのまま当てはまると説明しています。",
      intro: [
        "作成日：2026年11月23日（JST）。2026年10月に公開した短い記事を、日本語・英語の上位記事13本と一次情報を読み直して全面的に書き直しました。対象は、言葉が多すぎて何をすればいいか分からない事業者と、「LLMO対策」「GEO対策」の提案を受けた、または出す側の制作会社です。",
        "AIの回答は日や聞き方によって変わります。この記事の手順はAIが読む元の情報を整えるためのもので、AIの回答に必ず出ることや順位を保証するものではありません。",
      ],
      sections: [
        {
          heading: "用語の一覧表：SEO・AEO・GEO・LLMO・AIO",
          paragraphs: [
            "まず言葉の出どころと、どこを狙う言葉なのかを並べます。定義は書き手によって少しずつ違い、統一された定義はありません。",
          ],
          table: {
            head: ["略語", "正式名", "言葉の出どころ", "主に指すもの"],
            rows: [
              ["SEO", "Search Engine Optimization（検索エンジン最適化）", "検索エンジンの普及とともに広まった一般的な用語", "Google・Bing などの検索結果のリンク一覧で上位に出ること"],
              ["AEO", "Answer Engine Optimization（回答エンジン最適化）", "生成AI以前は、強調スニペットや音声アシスタントの答えに選ばれる取り組みを指していた", "AIの回答の中で、名前を挙げられる・引用されること"],
              ["GEO", "Generative Engine Optimization（生成エンジン最適化）", `2023年に公開された論文（[Aggarwal ほか、KDD 2024](${SRC.geoPaper})）で名付けられた`, "生成AIの回答で、自社のページの内容が使われ・引用されること"],
              ["LLMO", "Large Language Model Optimization（大規模言語モデル最適化）", "日本のSEO会社・制作会社の記事でよく使われる", "ChatGPT などのLLMに、自社を正しく理解・紹介してもらうこと"],
              ["AIO", "AI Optimization（AI最適化）", "日本で使われることが多い。ただし「AIO」は Google の AI Overviews（AIによる概要）の略としても使われる", "AI検索全般への対策。AIによる概要だけを指す場合もある"],
            ],
          },
          after: [
            "AIOは2つの意味で使われるので注意が必要です。「AIO対策」と言われたら、AI検索全般のことか、GoogleのAIによる概要だけのことかを確かめてください。どちらを指すかで、測る場所が変わります（後の章）。",
          ],
        },
        {
          heading: "AEO・GEO・LLMO・AIOは同じものか",
          paragraphs: [
            `実務の答えは「同じものとして扱ってよい」です。Ahrefs の日本語ブログは、GEO・LLMO・AEO の3つは同じことを指していると書いています（[Ahrefs：GEO は SEO と同じ](${SRC.ahrefsJa})）。一方で、AIOとLLMOの違いを説明する記事でも、定義は統一されていないと断ったうえで、共通の施策を挙げています（[サングローブ](${SRC.sungrove})）。`,
            `英語の記事には、AEOを「答えとして抜き出されること」、GEOを「生成AIに要約・統合・引用されること」と分ける説明もあります（[NeuronWriter](${SRC.neuron})）。ただ、その違いのためにサイトで別の作業が必要になるわけではありません。どの言葉でも、やることは「AIに読める状態にする」「ページの事実を正確にそろえる」「実際に出ているかを測る」の3つに集まります。`,
          ],
          after: [
            "言葉選びの目安：お客様や社内が使っている言葉に合わせれば十分です。提案書や契約書では、言葉の名前よりも「何を直すか」「何をどう測るか」を書いてください。言葉が違うだけで作業も成果物も同じなのに、別料金のメニューに分かれている場合は、中身を比べる価値があります。",
          ],
        },
        {
          heading: "SEOとAI検索対策（AEO・GEO）の違い：比較表",
          paragraphs: [
            "違いがはっきり出るのは、成果がどこにどう現れるかと、それをどう測るかです。",
          ],
          table: {
            head: ["観点", "SEO", "AEO・GEO（AI検索対策）"],
            rows: [
              ["成果が出る場所", "検索結果のリンク一覧", "ChatGPT・Perplexity・Gemini・Claude・Microsoft Copilot・GoogleのAIによる概要とAIモードの回答の中"],
              ["成果の形", "順位、表示回数、クリック", "名前が挙がる、出典として引用される、内容が正しく説明される"],
              ["クリック", "クリックされて初めて来訪になる", "回答だけで用が済み、クリックされないことも多い"],
              ["結果の安定性", "順位は日々動くが、同じ検索語ならおおむね同じ並び", "同じ質問でも、回や日、聞き方で答えが変わる。1回の結果では判断できない"],
              ["AIが情報を得る経路", "検索エンジンのインデックス", "回答時の検索（各社の検索用クローラーや検索インデックス）と、モデルの学習データ"],
              ["公式の計測", "Google Search Console、Bing Webmaster Tools", "GoogleのAI機能は Search Console の生成AIパフォーマンスレポート（表示回数）、Copilot などは Bing の AI Performance。ChatGPT・Perplexity には事業者向けの公式レポートがない"],
              ["共通の土台", "クロールとインデックス、ページの中身、構造化データとページの一致", "同じ。加えて、AI検索用のクローラーを止めていないか、他のサイトに載っている自社情報と食い違っていないか"],
            ],
          },
          after: [
            "比較表のとおり、AI検索対策はSEOの「代わり」ではなく「上に足すもの」です。インデックスされていないページや、本文に事実が書かれていないページは、どちらでも使われにくくなります。",
          ],
        },
        {
          heading: "研究と公式情報で分かっていること・分かっていないこと",
          paragraphs: [
            "「こうすればAIに引用される」という説明は多いのですが、確かめられる情報は限られます。2026年11月23日時点で、出典をたどれるものだけを並べます。",
          ],
          table: {
            head: ["問い", "分かっていること", "出典"],
            rows: [
              ["GEOという言葉の出どころと、効果の研究", "1万件の質問を集めた GEO-bench で実験し、本文の書き方を変えると生成AIの回答での見え方が最大40%上がったと報告。Perplexity.ai でも最大37%。研究用の環境での結果で、実際の各社のAI検索でそのまま再現されるとは限らない", `[Aggarwal ほか「GEO: Generative Engine Optimization」（KDD 2024）](${SRC.geoPaper})`],
              ["GoogleのAI機能に特別な対策は必要か", "AIによる概要・AIモードに表示されるための追加の要件や特別なマークアップ、新しいAI向けファイルは必要なく、SEOの基本がそのまま当てはまると説明している", `[Google 検索セントラル：AI 機能とウェブサイト](${SRC.googleAiJa})`],
              ["GoogleのAI機能での表示は測れるか", "Search Console の生成AIパフォーマンスレポートで、AIによる概要とAIモードでの表示回数が見られる（2026年8月31日から全世界）。クリックはこのレポートに出ない", "[Search Console で見る方法](/guide/search-console-ai-features)"],
              ["Copilot などでの引用は測れるか", "Bing Webmaster Tools の AI Performance（2026年2月10日に公開プレビュー）で、Microsoft Copilot・Bing のAIの要約などでの引用数、引用されたページ、AIが検索に使った語（一部のサンプル）が見られる。2026年6月16日に、質問の意図・トピック・引用シェア・期間比較が追加された", `[Bing Webmaster ブログ（2月）](${SRC.bingAiPerf})・[Bing 検索ブログ（6月）](${SRC.bingInsights})`],
              ["サイトの中の対策の点数が高いほどAIに紹介されるか", "日本の地域事業者62件では、構造化データ・llms.txt・クローラー許可などの点数と Perplexity での登場のあいだに関係は見られなかった（ρ＝0.03）", "[Nurevo の調査](/guide/aeo-signals-ai-answers-study)"],
              ["ChatGPT・Perplexity は何を基準に出典を選ぶか", "どちらも選び方の詳しい基準は公開していない", "各社の公開資料（この記事の作成時に確認できた範囲）"],
            ],
          },
          after: [
            "まとめると、「書き方を変えると研究環境では見え方が変わる」「Googleは特別な対策は不要と言っている」「点数を上げるだけで紹介されるとは限らない」の3つが、いま言えることです。だからこそ、整えたあとに実際に出ているかを測る手順が欠かせません。",
          ],
        },
        {
          heading: "何から始めるか：小さな事業者の優先順位",
          paragraphs: [
            "言葉に関係なく、効果の土台になる順に並べます。上から順に、できたものから次へ進んでください。",
          ],
          list: [
            "インデックスとクロール：Search Console でトップページと主要ページがインデックスされているかを見る。robots.txt やCDN・WAFで、AI検索用のクローラー（OAI-SearchBot・ChatGPT-User・PerplexityBot・Claude-SearchBot など）を止めていないかを確かめる（[確かめる手順](/guide/agency-ai-crawler-blocking-audit)）",
            "ページの事実：会社名・住所・電話・営業時間・料金・対応地域・サービスの内容を、画像ではなく本文の文字で書く",
            "構造化データ：その事実を JSON-LD で書き、ページの表示と同じ値にする",
            "他のサイトとそろえる：Googleビジネスプロフィール、ポータルサイト、SNSのプロフィールの情報を、自社サイトと同じにする",
            "質問に答えるページ：お客様が実際にAIに聞きそうな質問（料金はいくら、予約は必要か、どこにあるか）に、見出しと短い答えで応える",
            "測る：自社名を含まない質問を決めて、同じ条件で繰り返し聞き、名前が出た・引用された割合を記録する（[測り方](/guide/measure-ai-visibility)）",
          ],
          after: [
            "llms.txt は、この6つが終わったあとに足すものとして扱うのが現実的です。効果は確かめられていませんが、費用は小さく、置いて損をするという公式の説明もありません（[llms.txt の解説](/guide/llms-txt)）。",
          ],
        },
        {
          heading: "測り方の違い：どの言葉の成果を、どこで見るか",
          table: {
            head: ["見たいもの", "見る場所", "分かること", "分からないこと"],
            rows: [
              ["Googleの検索順位とクリック（SEO）", "Search Console の検索パフォーマンス", "表示回数・クリック・平均掲載順位", "AIの回答の中身"],
              ["GoogleのAIによる概要・AIモード（AIO・AEO）", "Search Console の生成AIパフォーマンスレポート", "AI機能での表示回数（ページ・国・デバイス別）", "クリック、回答の中で何と書かれたか"],
              ["Microsoft Copilot・Bing のAI", "Bing Webmaster Tools の AI Performance", "引用数、引用されたページ、AIが検索に使った語の一部", "ChatGPT など他社のAIでの状況"],
              ["ChatGPT・Perplexity・Gemini・Claude（GEO・LLMO）", "自分で質問を固定して聞く、または計測ツール", "名前が出た割合、引用された割合、代わりに出た競合", "すべての利用者の回答（測れるのは一部のサンプル）"],
              ["AIからの来訪", "アクセス解析の参照元（chatgpt.com、perplexity.ai など）", "クリックして来た人数と、その後の行動", "クリックされなかった回答"],
            ],
          },
          after: [
            "「LLMO対策の効果」「GEOの成果」と言うときは、この表のどの行を見ているのかを最初に決めておくと、報告が言葉だけのものになりません。",
          ],
        },
        {
          heading: "WordPressでの手順：SEOプラグインとAI検索対策を両立させる",
          paragraphs: [
            "WordPressでは、Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK などのSEOプラグインがタイトル・サイトマップ・基本の構造化データを担います。AI検索対策で足りなくなりやすいのは、店舗や会社の事実（住所・営業時間・料金・サービス）の構造化データ、llms.txt、AI検索用クローラーの許可です。",
          ],
          list: [
            "SEOプラグインはそのまま使う。タイトルとメタディスクリプション、XMLサイトマップ、noindex の設定を確かめる",
            `[Nurevo AEO](${WP_ORG})（無料）を入れ、サイトの種類（店舗・ネットショップ・BtoB など）と事業の情報を入力する。Yoast SEO・Rank Math・AIOSEO・Slim SEO に加え、0.9.1 からは SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても構造化データが重複しない`,
            "Nurevo AEO の「AEOスコア」で診断を実行し、0〜100点の結果と直す項目の一覧を見て、無料の修正を当てる",
            "robots.txt を確かめる。Nurevo AEO は AI 検索用のクローラー（OAI-SearchBot・ChatGPT-User・Claude-SearchBot・Claude-User・PerplexityBot・Perplexity-User）を許可し、学習用のクローラー（GPTBot・ClaudeBot・Google-Extended など）は既存の robots.txt の設定に任せる。学習用を止めても AI 検索と AEOスコアには影響しない",
            "/llms.txt を開き、サイトの事実がページと同じ値で出ているかを見る",
            "月に1回の無料のAIチェック（業種と地域から作った3つの質問を Perplexity に聞き、名前が出たか・引用されたかを表示）で推移を見る。毎月の決まった質問での継続計測が必要なら Pro（月14,800円〜、計測は現在 Perplexity）",
          ],
          after: [
            "AEOスコアは「AIが読みやすいか」の点数で、AIに紹介されるかの点数ではありません。上の調査のとおり、点数が上がっても登場が増えるとは限らないため、最後の手順の「測る」までを1セットにしてください。",
          ],
        },
        {
          heading: "「LLMO対策」「GEO対策」の提案を受けたときの確認表",
          paragraphs: [
            "言葉が新しいほど、中身の分からないサービスも増えます。発注する側も、提案する制作会社の側も、次の5つを書面で確かめておくと誤解が減ります。",
          ],
          table: {
            head: ["確かめること", "よい答えの例", "注意したい答え"],
            rows: [
              ["何を直すか", "構造化データ、ページの事実、クローラーの設定、他サイトの情報の修正など、作業の一覧がある", "「AIに最適化します」だけで作業が書かれていない"],
              ["何で測るか", "どのAIに、どの質問を、何回、いつ聞くかが決まっている", "測り方の説明がない。または1回の画面のスクリーンショットだけ"],
              ["どの言葉の成果か", "Search Console・Bing・自前の計測のどれで報告するかが決まっている", "SEOの順位の報告をAI検索の成果として出す"],
              ["保証", "AIの回答は変わるので保証はできないと説明がある", "「必ずAIに出る」「1位を保証」"],
              ["やり方の安全性", "事実の整備と、第三者のサイトでの正しい情報の掲載", "口コミの自作、AIへの指示文の埋め込み、大量の似たページの自動生成"],
            ],
          },
          after: [
            "制作会社の方は、避けたい手法の具体例を[AI検索の不正な手法のリスク](/guide/agency-ai-search-manipulation-risks)に、月額サービスとしての作業範囲の決め方を[AI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)にまとめています。お客様のサイトをまとめて管理するなら、[Nurevo のパートナー制度](https://nurevo.jp/partner/)もご覧ください。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "社内とお客様のあいだで、使う言葉（AEO・GEO・LLMO・AIO）と、それが何を指すかをそろえた",
            "「AIO」が AI検索全般か GoogleのAIによる概要だけかをはっきりさせた",
            "主要ページがインデックスされ、AI検索用のクローラーを robots.txt やCDN・WAFで止めていない",
            "会社名・住所・電話・営業時間・料金が本文の文字で書かれている",
            "構造化データの値がページの表示と同じ",
            "Googleビジネスプロフィールやポータルサイトの情報が自社サイトと同じ",
            "お客様がAIに聞きそうな質問に、見出しと短い答えで応えるページがある",
            "自社名を含まない質問を決め、同じ条件で繰り返し聞いて記録している",
            "Search Console の生成AIパフォーマンスレポートと Bing の AI Performance を確認する担当と頻度が決まっている",
            "「必ず出る」「順位保証」をうたうサービスを使っていない",
          ],
        },
      ],
      faqs: [
        { q: "AEOとGEOはどちらの言葉を使えばいいですか？", a: "どちらでも構いません。作業も成果物もほぼ同じです。英語圏ではGEOとAEOの両方、日本ではLLMOやAIOも使われます。サイトの記事や提案書では、相手が検索しそうな言葉を見出しや本文に併記しておくと伝わりやすくなります。" },
        { q: "AI検索対策をすればSEOはもう要りませんか？", a: "要ります。AIの回答も、多くは検索用のクローラーやインデックスで集めたページをもとに作られます。インデックスされていないページや、事実が書かれていないページはAIにも使われにくくなります。SEOは土台、AI検索対策はその上に足すものと考えてください。" },
        { q: "LLMOは学習データへの対策で、GEOは検索への対策ですか？", a: "そう説明する記事もありますが、統一された定義ではありません。実際のAIの回答は、回答時の検索と学習データの両方から作られることがあり、サイト側でできる作業（事実の整備・クローラーの許可・他サイトとの一致）はどちらでも同じです。学習用のクローラーを止めるかどうかは、AI検索とは別の判断として決められます。" },
        { q: "AIOはGoogleのAIによる概要のことですか？", a: "両方の意味で使われます。AI Overviews の略としての AIO と、AI Optimization（AI最適化）としての AIO があります。話している相手に、どちらの意味かを確かめてください。GoogleのAIによる概要だけなら、Search Console の生成AIパフォーマンスレポートで表示回数を見られます。" },
        { q: "AI検索対策の効果はどのくらいで出ますか？", a: "決まった期間はありません。AIの回答は変わりやすく、検索用のクローラーがページを読み直すまでの時間もサービスごとに違います。同じ質問を同じ条件で月ごとに測り、1回ではなく推移で判断してください。" },
        { q: "GEOの論文の「最大40%」は、実際のChatGPTでも同じですか？", a: "同じとは限りません。論文は研究用に集めた1万件の質問と、研究用に作った生成エンジンでの実験で、Perplexity.ai でも試していますが、各社のAI検索は仕組みも更新も別です。書き方の工夫が効く可能性を示した研究として読み、自分のサイトでは実際に測って確かめてください。" },
        { q: "WordPressなら何を入れればいいですか？", a: "SEOプラグインはそのまま使い、足りない事実の構造化データ・llms.txt・AI検索用クローラーの許可を足します。Nurevo AEO（無料）はこれらをまとめて出し、主なSEOプラグインと構造化データが重複しないように動きます。入れたあとは、実際にAIに出ているかを測ってください。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "言葉より先に、自分のサイトがAIに読めるかを確かめる",
        body: "無料チェックで、構造化データ・llms.txt・AIクローラーの許可状況が登録なしで分かります。WordPress なら Nurevo AEO（無料）で足りない部分を補えます。AIの回答に出ることを保証するものではありません。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "Nurevo AEO を無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPT は OpenAI、Perplexity は Perplexity AI、Claude は Anthropic、Google・Gemini は Google LLC、Microsoft Copilot・Bing は Microsoft の商標または名称です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPress、Ahrefs、NeuronWriter はそれぞれの所有者の商標です。Nurevo はこれらの会社と提携しておらず、推奨も受けていません。",
    },
    en: {
      title: "AEO vs GEO vs SEO (plus LLMO and AIO): The Differences | Nurevo",
      description: "Are AEO, GEO, LLMO and AIO the same thing, and how do they differ from SEO? A term table, how results and measurement differ, what research shows, and what to do first.",
      h1: "AEO vs GEO vs SEO (plus LLMO and AIO): What Each Term Means, How Measurement Differs, and What to Do First",
      lead: "AEO, GEO, LLMO and AIO are all names for the same work: getting your business named, or your pages cited, inside answers from ChatGPT, Perplexity, Google AI Overviews and similar tools. In practice you can treat them as one thing. SEO is about ranking in a list of search results. The foundation is shared (pages that can be crawled and that state accurate facts); what differs is where results show up and how you measure them. Google itself says AI Overviews and AI Mode need no special optimization beyond SEO best practices.",
      intro: [
        "Written 23 November 2026 (JST). This is a full rewrite of our short October 2026 page, based on a fresh reading of 13 top-ranking Japanese and English articles and the primary sources. It is for business owners lost in the acronyms, and for web agencies that sell, or have been sold, \"GEO\" or \"LLMO\" services.",
        "AI answers change from day to day and with how a question is asked. The steps here make the information AI reads more accurate; they cannot guarantee that you will appear in an AI answer or hold any position.",
      ],
      sections: [
        {
          heading: "The terms at a glance: SEO, AEO, GEO, LLMO and AIO",
          paragraphs: [
            "Here is where each term comes from and what it aims at. Writers define them slightly differently, and there is no agreed standard definition.",
          ],
          table: {
            head: ["Acronym", "Stands for", "Where the term comes from", "What it usually means"],
            rows: [
              ["SEO", "Search Engine Optimization", "General term that spread with web search engines", "Ranking higher in the list of links on Google, Bing and other search engines"],
              ["AEO", "Answer Engine Optimization", "Before generative AI, it meant winning featured snippets and voice-assistant answers", "Being named or cited inside AI answers"],
              ["GEO", "Generative Engine Optimization", `Named in a research paper first published in 2023 ([Aggarwal et al., KDD 2024](${SRC.geoPaper}))`, "Having your content used and cited in generative AI answers"],
              ["LLMO", "Large Language Model Optimization", "Common in articles by Japanese SEO firms and agencies", "Getting LLMs such as ChatGPT to understand and describe you correctly"],
              ["AIO", "AI Optimization", "Used mostly in Japan. \"AIO\" is also short for Google AI Overviews", "AI search in general, or sometimes Google AI Overviews only"],
            ],
          },
          after: [
            "Watch out for AIO, because it has two meanings. When someone offers \"AIO optimization\", ask whether they mean AI search in general or Google AI Overviews only. The answer changes where you measure the results (see below).",
          ],
        },
        {
          heading: "Are AEO, GEO, LLMO and AIO the same thing?",
          paragraphs: [
            `For practical purposes, yes. Ahrefs' Japanese blog says GEO, LLMO and AEO all refer to the same thing ([Ahrefs: GEO is just SEO](${SRC.ahrefsJa})). A Japanese article on AIO versus LLMO notes that the definitions are not settled and then lists the same shared tactics for both ([Sungrove](${SRC.sungrove})).`,
            `Some English articles split them: AEO as being extracted as a direct answer, GEO as being summarized, synthesized and cited by generative AI ([NeuronWriter](${SRC.neuron})). That distinction does not create separate work on your website, though. Whatever the label, the work comes down to three things: make your site readable to AI, make the facts on your pages accurate and consistent, and measure whether you actually appear.`,
          ],
          after: [
            "Which word to use: whichever your customers and colleagues already use. In proposals and contracts, write down what will be fixed and what will be measured, and how, rather than the label. If the same work and deliverables are sold as separately priced \"AEO\", \"GEO\" and \"LLMO\" packages, compare what is actually in them.",
          ],
        },
        {
          heading: "SEO vs AI search optimization (AEO/GEO): comparison table",
          paragraphs: [
            "The real differences are in where results appear and how you measure them.",
          ],
          table: {
            head: ["Aspect", "SEO", "AEO / GEO (AI search)"],
            rows: [
              ["Where results appear", "The list of search results", "Inside answers from ChatGPT, Perplexity, Gemini, Claude, Microsoft Copilot, and Google AI Overviews and AI Mode"],
              ["What success looks like", "Rank, impressions, clicks", "Being named, being cited as a source, being described correctly"],
              ["Clicks", "A visit only happens when someone clicks", "The answer often satisfies the user without a click"],
              ["Stability", "Rankings move daily, but the same query gives a broadly similar order", "The same question can get a different answer on another run, day or wording. One result tells you little"],
              ["Where the AI gets information", "The search engine's index", "Search at answer time (each company's search crawlers or index) and the model's training data"],
              ["Official measurement", "Google Search Console, Bing Webmaster Tools", "Search Console's generative AI performance report (impressions) for Google's AI features; Bing's AI Performance report for Copilot and more. ChatGPT and Perplexity offer no official report for site owners"],
              ["Shared foundation", "Crawling and indexing, page content, structured data that matches the page", "The same, plus: AI search crawlers are not blocked, and your details on other sites do not contradict your own"],
            ],
          },
          after: [
            "As the table shows, AI search optimization adds to SEO rather than replacing it. A page that is not indexed, or that does not state its facts in the text, is unlikely to be used by either.",
          ],
        },
        {
          heading: "What research and official sources actually show",
          paragraphs: [
            "There is no shortage of claims about how to get cited by AI, but little that can be checked. These are the points we could trace to a source as of 23 November 2026.",
          ],
          table: {
            head: ["Question", "What is known", "Source"],
            rows: [
              ["Where GEO comes from, and what the research found", "Using GEO-bench, a set of 10,000 queries, the authors report that changing how content is written raised its visibility in generative engine answers by up to 40%, and by up to 37% on Perplexity.ai. These are results in a research setup and may not carry over directly to commercial AI search", `[Aggarwal et al., \"GEO: Generative Engine Optimization\" (KDD 2024)](${SRC.geoPaper})`],
              ["Do Google's AI features need special work?", "Google says there are no additional requirements, special markup or new AI text files needed to appear in AI Overviews or AI Mode, and that SEO best practices still apply", `[Google Search Central: AI features and your website](${SRC.googleAi})`],
              ["Can you measure Google AI features?", "Search Console's generative AI performance report shows impressions in AI Overviews and AI Mode (worldwide since 31 August 2026). Clicks are not in that report", "[How to see it in Search Console](/guide/search-console-ai-features)"],
              ["Can you measure citations in Copilot?", "Bing Webmaster Tools' AI Performance report (public preview from 10 February 2026) shows citations in Microsoft Copilot, AI-generated summaries in Bing and some partner integrations, cited pages, and a sample of the queries the AI searched with. On 16 June 2026 Bing added intents, topics, citation share and period comparison", `[Bing Webmaster blog (Feb)](${SRC.bingAiPerf}), [Bing Search blog (Jun)](${SRC.bingInsights})`],
              ["Do sites with higher on-site scores get mentioned more?", "Across 62 local businesses in Japan, we found no relationship between on-site scores (structured data, llms.txt, crawler access) and appearing in Perplexity (rho = 0.03)", "[Nurevo study](/guide/aeo-signals-ai-answers-study)"],
              ["How do ChatGPT and Perplexity choose sources?", "Neither publishes detailed selection criteria", "Public documentation from each company, as far as we could check while writing"],
            ],
          },
          after: [
            "In short: how content is written can change visibility in a research setting; Google says no special work is needed; and raising an on-site score does not by itself get you mentioned. That is why measuring whether you actually appear is a required step, not an extra.",
          ],
        },
        {
          heading: "Where to start: priorities for a small business",
          paragraphs: [
            "Whatever the label, do these in order, because each one builds on the one before.",
          ],
          list: [
            "Indexing and crawling: check in Search Console that your home page and key pages are indexed. Check that robots.txt, your CDN or your firewall does not block AI search crawlers such as OAI-SearchBot, ChatGPT-User, PerplexityBot and Claude-SearchBot ([how to check](/guide/agency-ai-crawler-blocking-audit))",
            "Facts on the page: state your business name, address, phone number, opening hours, prices, service area and what you offer in the text, not in images",
            "Structured data: publish those facts as JSON-LD, with the same values the page shows",
            "Consistency elsewhere: make your Google Business Profile, directory listings and social profiles match your website",
            "Pages that answer questions: answer what customers ask AI (how much it costs, whether booking is needed, where you are) with a clear heading and a short answer",
            "Measurement: pick questions that do not include your business name, ask them repeatedly under the same conditions, and record how often you are named or cited ([how to measure](/guide/measure-ai-visibility))",
          ],
          after: [
            "Treat llms.txt as something to add after these six. Its effect is unproven, but it costs little and there is no official statement that it does harm ([llms.txt explained](/guide/llms-txt)).",
          ],
        },
        {
          heading: "How measurement differs: what to look at, and where",
          table: {
            head: ["What you want to know", "Where to look", "What it shows", "What it does not show"],
            rows: [
              ["Google rankings and clicks (SEO)", "Search Console Performance report", "Impressions, clicks, average position", "What AI answers say"],
              ["Google AI Overviews and AI Mode (AIO/AEO)", "Search Console generative AI performance report", "Impressions in AI features, by page, country and device", "Clicks, or what the answer said about you"],
              ["Microsoft Copilot and Bing AI", "Bing Webmaster Tools AI Performance", "Citations, cited pages, a sample of the queries the AI used", "Other companies' AI tools, such as ChatGPT"],
              ["ChatGPT, Perplexity, Gemini, Claude (GEO/LLMO)", "Fixed questions you ask yourself, or a monitoring tool", "How often you are named or cited, and which competitors appear instead", "Every user's answer (you only ever see a sample)"],
              ["Visits from AI", "Referrers in your analytics (chatgpt.com, perplexity.ai and others)", "How many people clicked through and what they did next", "Answers that did not lead to a click"],
            ],
          },
          after: [
            "When someone reports \"LLMO results\" or \"GEO performance\", agree first on which row of this table they mean. That keeps a report about measurements rather than labels.",
          ],
        },
        {
          heading: "On WordPress: running an SEO plugin and AI search setup together",
          paragraphs: [
            "On WordPress, SEO plugins such as Yoast SEO, Rank Math, All in One SEO and SEO SIMPLE PACK handle titles, sitemaps and basic structured data. What tends to be missing for AI search is structured data for your business facts (address, hours, prices, services), llms.txt, and rules that allow AI search crawlers.",
          ],
          list: [
            "Keep your SEO plugin. Check titles and meta descriptions, the XML sitemap and noindex settings",
            `Install [Nurevo AEO](${WP_ORG}) (free) and enter your site type (local business, online shop, B2B and so on) and business details. It works alongside Yoast SEO, Rank Math, AIOSEO and Slim SEO, and from 0.9.1 also SEO SIMPLE PACK and VK All in One Expansion Unit, without duplicating structured data`,
            "Run the diagnosis on the AEO Score screen, read the 0–100 result and the list of fixes, and apply the free fixes",
            "Check robots.txt. Nurevo AEO allows the AI search crawlers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User) and leaves training crawlers (GPTBot, ClaudeBot, Google-Extended and others) to your existing robots.txt. Blocking training crawlers does not affect AI search or your AEO score",
            "Open /llms.txt and check that your facts appear with the same values as on your pages",
            "Use the free monthly AI check (three questions built from your business type and area are put to Perplexity, showing whether you were named or cited) to follow the trend. For ongoing measurement on fixed questions every month, there is Pro (from USD 99 per month; measurement currently runs on Perplexity)",
          ],
          after: [
            "The AEO score measures how readable your site is to AI, not whether AI recommends you. As the study above shows, a higher score does not guarantee more mentions, so treat the last step, measuring, as part of the same job.",
          ],
        },
        {
          heading: "Questions to ask when someone sells you \"GEO\" or \"LLMO\"",
          paragraphs: [
            "The newer the label, the more services there are whose contents are unclear. Whether you are buying or an agency selling, agreeing on these five points in writing prevents most misunderstandings.",
          ],
          table: {
            head: ["Ask", "A good answer", "A warning sign"],
            rows: [
              ["What will be fixed?", "A list of tasks: structured data, page facts, crawler settings, corrections on other sites", "\"We optimize you for AI\" with no tasks listed"],
              ["How will it be measured?", "Which AI tools, which questions, how many times and when", "No method, or a single screenshot"],
              ["Which results are reported?", "Agreed reports from Search Console, Bing, or their own measurement", "SEO rankings presented as AI search results"],
              ["Guarantees", "An explanation that AI answers change, so nothing can be guaranteed", "\"Guaranteed to appear in AI\" or \"guaranteed #1\""],
              ["Methods", "Accurate facts, and correct information on third-party sites", "Self-written reviews, hidden instructions to AI, mass-produced near-duplicate pages"],
            ],
          },
          after: [
            "For agencies: we list tactics to avoid in [the risks of manipulating AI search](/guide/agency-ai-search-manipulation-risks), and how to scope a monthly service in [turning AI search optimization into a monthly service](/guide/agency-aeo-monthly-service). If you manage many client sites, see the [Nurevo partner program](https://nurevo.jp/partner/).",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "Your team and your clients use the same terms (AEO, GEO, LLMO, AIO) and agree on what they mean",
            "It is clear whether \"AIO\" means AI search in general or Google AI Overviews only",
            "Key pages are indexed, and robots.txt, the CDN and the firewall do not block AI search crawlers",
            "Business name, address, phone, opening hours and prices are written in the page text",
            "Structured data values match what the page shows",
            "Google Business Profile and directory listings match your website",
            "There are pages that answer the questions customers ask AI, with clear headings and short answers",
            "You have fixed questions without your business name, ask them under the same conditions, and record the results",
            "Someone is responsible for checking Search Console's generative AI report and Bing's AI Performance, on a set schedule",
            "You are not paying for any service that promises guaranteed appearance or rankings",
          ],
        },
      ],
      faqs: [
        { q: "Should I say AEO or GEO?", a: "Either. The work and deliverables are almost the same. English-language marketers use both GEO and AEO; in Japan, LLMO and AIO are common too. On your own pages and in proposals, mention the terms your readers are likely to search for." },
        { q: "If I do AI search optimization, do I still need SEO?", a: "Yes. Most AI answers are built from pages that search crawlers and indexes have collected. Pages that are not indexed, or that do not state their facts, are unlikely to be used by AI either. Think of SEO as the foundation and AI search optimization as the layer on top." },
        { q: "Is LLMO about training data and GEO about search?", a: "Some articles say so, but it is not an agreed definition. Real AI answers can draw on both search at answer time and training data, and the work you can do on your site (accurate facts, crawler access, consistency with other sites) is the same either way. Whether to block training crawlers is a separate decision from AI search." },
        { q: "Does AIO mean Google AI Overviews?", a: "It is used both ways: AIO as short for AI Overviews, and AIO as AI Optimization. Ask which one is meant. If it is Google AI Overviews only, Search Console's generative AI performance report shows your impressions there." },
        { q: "How long does AI search optimization take to work?", a: "There is no fixed timeline. AI answers change easily, and how quickly search crawlers re-read your pages differs between services. Measure the same questions under the same conditions every month and judge by the trend, not a single result." },
        { q: "Does the GEO paper's \"up to 40%\" apply to ChatGPT?", a: "Not necessarily. The paper experimented with 10,000 research queries and a generative engine built for the study, and also tested Perplexity.ai, but each commercial AI search tool works and updates differently. Read it as evidence that writing choices can matter, and measure on your own site." },
        { q: "What should I install on WordPress?", a: "Keep your SEO plugin, and add what is missing: structured data for your business facts, llms.txt and rules that allow AI search crawlers. Nurevo AEO (free) provides all three and avoids duplicating structured data with the main SEO plugins. After installing, measure whether you actually appear in AI answers." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Before the acronyms, check whether AI can read your site",
        body: "The free check needs no sign-up and shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AEO fills the gaps for free. It cannot guarantee that you will appear in AI answers.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Try Nurevo AEO free on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Claude of Anthropic, Google and Gemini of Google LLC, and Microsoft Copilot and Bing of Microsoft. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit, WordPress, Ahrefs and NeuronWriter are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
