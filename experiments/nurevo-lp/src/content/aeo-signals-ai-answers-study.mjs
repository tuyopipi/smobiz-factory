// Content page: research article. Does Nurevo's on-site AEO score predict
// whether a local business appears in AI answers? 62 businesses, Perplexity.
//
// Every number here comes from the study run of 2026-10-24
// (experiments/webmcp-canary/study/: design in README.md, code in lib/, report
// from analyze-study.mjs). Do not add a figure that is not in that report, and
// do not publish the names or URLs of the businesses measured: the page gives
// aggregates only. The criteria quoted were fixed before the data was seen
// (lib/analysis.mjs, CRITERIA / verdict()).
//
// A Dataset JSON-LD node would suit this page, but content pages publish only
// the shared WebPage / Breadcrumb / FAQPage graph; add it here if the build
// grows per-page schema.

const STATS_EN = {
  head: ["Test", "Result", "p-value"],
  rows: [
    ["Score vs appearance rate (Spearman ρ, primary)", "0.03 (95% CI −0.23 to 0.28)", "0.834"],
    ["Same, adjusted for industry and city (partial correlation)", "0.03", "0.845"],
    ["Same, permutation test within strata", "0.03", "0.829"],
    ["Score vs name appearing (discovery questions)", "−0.04", "0.782"],
    ["Score vs own site cited (discovery questions)", "0.18", "0.149"],
    ["Score vs own site cited (named questions)", "−0.03", "0.813"],
    ["Logistic regression with industry/city fixed effects, quasi-binomial: odds per +1 SD of score (18.81 points)", "×1.01 (95% CI 0.62 to 1.64)", "0.972"],
  ],
  caption: "n = 62 businesses. Measured on Perplexity on 2026-10-24.",
};

const STATS_JA = {
  head: ["検定", "結果", "p値"],
  rows: [
    ["スコア×登場率（Spearmanの順位相関、主分析）", "0.03（95%信頼区間 −0.23〜0.28）", "0.834"],
    ["同上、業種・都市を調整した偏相関", "0.03", "0.845"],
    ["同上、層内での並べ替え検定", "0.03", "0.829"],
    ["スコア×名前の登場（発見系の質問）", "−0.04", "0.782"],
    ["スコア×自社サイトの引用（発見系の質問）", "0.18", "0.149"],
    ["スコア×自社サイトの引用（名指しの質問）", "−0.03", "0.813"],
    ["業種・都市の固定効果つきロジスティック回帰（準二項）：スコア1標準偏差（18.81点）あたりのオッズ", "×1.01（95%信頼区間 0.62〜1.64）", "0.972"],
  ],
  caption: "n＝62事業者。2026年10月24日にPerplexityで計測。",
};

export default {
  slug: "aeo-signals-ai-answers-study",
  targetQueries: [
    "does structured data help appear in AI answers",
    "AEO score correlation AI visibility study",
    "does schema markup get you cited by Perplexity",
    "構造化データ AI 回答 登場 関係",
    "AEO対策 効果 調査",
    "llms.txt 効果 データ",
  ],
  related: ["what-is-aeo", "appear-in-chatgpt", "llms-txt", "aeo-vs-seo-vs-geo"],
  locales: {
    en: {
      title: "Does On-site AEO Predict AI Answers? 62-Business Study | Nurevo",
      description: "We scored 62 local businesses in Japan with our AEO score and asked Perplexity about them. The score did not predict appearing in AI answers (ρ = 0.03).",
      h1: "Do on-site AEO signals predict appearing in AI answers? We measured 62 businesses",
      lead: "No, not in this study. Across 62 local businesses in Japan, our on-site AEO score (structured data, llms.txt, crawler access and similar signals) showed no relationship with how often Perplexity named or cited a business when asked for recommendations: Spearman ρ = 0.03 (95% CI −0.23 to 0.28, p = 0.834). With 62 businesses the study could reliably detect only correlations of about |ρ| ≥ 0.35, so a weaker relationship cannot be ruled out.",
      intro: [
        "Published 2026-10-28. Data measured 2026-10-24. Nurevo makes AEO tools, including the score tested here; see \"Our conflict of interest\" below.",
      ],
      sections: [
        {
          heading: "Summary",
          list: [
            "Question: do businesses whose websites score higher on Nurevo's AI-readability score (0 to 100) appear more often in AI answers to questions that do not name them?",
            "Answer: not supported. ρ = 0.03 overall, and still 0.03 after adjusting for industry and city.",
            "Overall, businesses appeared in 21.0% of answers to discovery questions; 25 of the 62 appeared at least once.",
            "No individual part of the score (structured data, llms.txt, coverage and so on) showed a relationship either, after correcting for multiple tests.",
            "What we take from it: structured data helps AI read a business's facts correctly, but on its own it does not decide whether a business is mentioned. Other factors, very likely including what other sites say about the business, matter more. That last point is a hypothesis this study did not test.",
          ],
        },
        {
          heading: "Why we ran this study",
          paragraphs: [
            "AEO (answer engine optimization) advice, including ours, says that making a website easy for AI to read (schema.org structured data, an llms.txt file, letting AI crawlers in, server-rendered content) helps a business show up in AI answers. Nurevo sells a score built on exactly those signals. We wanted honest evidence of whether the score tracks what owners actually care about: being named by AI. We fixed the hypothesis, the analysis and the decision criteria before collecting any answers, and committed to publishing the result either way.",
          ],
        },
        {
          heading: "Method",
          list: [
            "Sample: 72 local businesses with their own official websites, chosen by web search (portal sites excluded) across 5 industries (dental clinics, restaurants, beauty salons, tax accountants, lodging) and 4 Japanese cities (Tokyo, Osaka, Fukuoka, Sapporo). 10 were excluded because the score could not be computed for their site, leaving 62 for analysis.",
            "Score: each site's home page, robots.txt and llms.txt were scored with the same code as Nurevo's public score: structured data (30 points), coverage (25), legibility (20), llms.txt (15) and consistency (10), with a gate for crawler access, edge blocking and server rendering (failing it caps the score at 15).",
            "Engine: Perplexity, through its Agent API with the \"fast\" preset (one web search, then an answer), the same adapter Nurevo's paid plan uses for AI visibility. One engine only; see the limitations.",
            "Questions: three \"discovery\" questions per business that name the area and the kind of business but not the business (for example, \"Recommend a dentist in Umeda\"), shared by every business of the same industry in the same area, plus one \"named\" question asking for a business's address and opening hours. Each question was asked three times.",
            "Outcome: a business \"appeared\" in an answer if its name was in the answer or its own domain was among the cited sources. The appearance rate is the share of its discovery answers in which it appeared.",
            "Detector check: in answers to the named questions the business's name was detected 84.3% of the time, above the 70% threshold we set for trusting the detector.",
            "Analysis: Spearman rank correlation with a permutation p-value and bootstrap confidence interval; partial correlation with industry and city as fixed effects; a permutation test within strata; and a logistic regression with industry and city fixed effects and a quasi-binomial correction, because repeated answers to the same question are not independent. The six component tests are Holm-corrected.",
          ],
          after: [
            "The criterion for \"supported\" was set in advance: ρ ≥ 0.3, p < 0.05, a 95% CI above zero, and a positive adjusted correlation. Answer text was not stored; only whether a name appeared, whether the domain was cited, and the citation position.",
          ],
        },
        {
          heading: "Results",
          paragraphs: [
            "The verdict is \"not supported\". Every test of the score against appearance gives a correlation close to zero:",
          ],
          table: STATS_EN,
          after: [
            "The largest coefficient, 0.18 between the score and the business's own site being cited, is not distinguishable from zero (p = 0.149) and should not be read as a finding.",
          ],
        },
        {
          heading: "By score band",
          paragraphs: [
            "Nurevo shows the score as red, yellow or green. Most sites in the sample were red, and none reached green, so this study says nothing about very high scores.",
          ],
          table: {
            head: ["Band", "Businesses", "Mean appearance rate", "Appeared at least once"],
            rows: [
              ["Red", "54", "20.8%", "22"],
              ["Yellow", "8", "22.2%", "3"],
              ["Green", "0", "-", "-"],
            ],
          },
        },
        {
          heading: "By component of the score",
          paragraphs: [
            "None of the parts of the score was related to appearance. After Holm correction every p-value is 1.000. These tests were exploratory.",
          ],
          table: {
            head: ["Component", "Spearman ρ with appearance rate"],
            rows: [
              ["Structured data (schema)", "0.08"],
              ["Coverage", "0.12"],
              ["Legibility", "−0.17"],
              ["llms.txt", "−0.02 (odds ratio 1.41, 95% CI 0.79 to 2.52)"],
              ["Consistency", "0.06"],
              ["Gate (crawler access, edge, server rendering)", "61 passed: 21.3% appearance; 1 failed: 0%"],
            ],
            caption: "Holm-corrected p = 1.000 for every component.",
          },
        },
        {
          heading: "By industry and by city",
          paragraphs: [
            "Appearance varied by industry and by city more than by score. These are descriptive figures from small groups, not tested differences.",
          ],
          table: {
            head: ["Group", "Businesses", "Mean score", "Appearance rate"],
            rows: [
              ["Tax accountants", "13", "27.92", "10.3%"],
              ["Lodging", "13", "21.08", "23.9%"],
              ["Dental clinics", "13", "40.15", "25.6%"],
              ["Beauty salons", "8", "24.25", "8.3%"],
              ["Restaurants", "15", "24.20", "30.4%"],
              ["Osaka", "15", "26.27", "15.6%"],
              ["Sapporo", "17", "29.41", "9.8%"],
              ["Tokyo", "15", "25.53", "31.1%"],
              ["Fukuoka", "15", "29.27", "28.9%"],
            ],
            caption: "Industry rows and city rows each cover the same 62 businesses.",
          },
        },
        {
          heading: "Limitations",
          list: [
            "Cross-sectional: one measurement of many sites shows association, not cause. Whether improving a site changes its appearance needs a before-and-after study of the same sites.",
            "Statistical power: with 62 businesses, a correlation weaker than about |ρ| = 0.35 would often be missed. Businesses in the same area and industry share the same answers, so the effective sample is smaller still. \"Not found\" here does not mean \"does not exist\".",
            "One engine, one week: Perplexity with the \"fast\" preset, measured on 2026-10-24. ChatGPT, Gemini, Google's AI Overviews and Copilot use different search indexes and models; these results do not transfer to them.",
            "Unobserved confounders: reviews, brand recognition, advertising, years in business and listings on other sites were not measured. Only industry and city were adjusted for.",
            "Sample: businesses were found through web search, so they lean toward businesses that are already easy to find. No site scored green. 5 industries and 4 cities in Japan may not represent other industries, regions or languages.",
          ],
        },
        {
          heading: "What it means for a business website",
          paragraphs: [
            "Structured data, llms.txt and crawler access still do a job: they let an AI read a business's facts (address, opening hours, phone number, services) directly and correctly instead of guessing. That job is worth doing, and it is a different job from being recommended. In this study, a better-read site was not a more-mentioned one.",
            "Our working hypothesis is that sources outside the website (review and map listings, local media, directories, other sites that mention the business) weigh heavily in whether an AI names a business when it answers a recommendation question. This study did not measure those sources, so this is a hypothesis to test, not a result.",
            "In practice: keep the on-site basics in order because they make what AI says about you accurate, and measure whether AI actually mentions you rather than inferring it from a readability score.",
          ],
        },
        {
          heading: "Our conflict of interest, and what we are changing",
          paragraphs: [
            "Nurevo makes AEO tools, and the score tested here is one of our products. A result that the score does not predict appearance is not one we would have chosen, and we are publishing it because the criteria were set before the data came in and because owners should know what a score can and cannot tell them.",
            "What we are doing about it: we do not present the AI-readability score as a predictor of appearing in AI answers. We measure appearance directly instead: the Pro plan measures how often Perplexity names or cites a site (beta), and we are adding a small monthly appearance check for Free and Standard sites. We are also developing a second version of the score that blends measured AI visibility with the on-site signals, rather than relying on the on-site signals alone.",
            "The names and websites of the businesses measured are not published.",
          ],
        },
      ],
      faqs: [
        { q: "Does structured data make AI mention my business?", a: "In this study of 62 local businesses on Perplexity, no relationship was found between on-site signals such as structured data and how often a business was mentioned (ρ = 0.03). Structured data helps AI read your facts correctly, but on its own it did not predict being mentioned." },
        { q: "Does llms.txt help a business appear in AI answers?", a: "We found no relationship in this study: ρ = −0.02 between the llms.txt component and the appearance rate (Holm-corrected p = 1.000). The study was small and used one engine, so this is not proof that llms.txt never matters." },
        { q: "Does this mean AEO is pointless?", a: "No. On-site AEO makes what AI says about a business accurate. This study suggests it is not sufficient to be recommended, and that being mentioned should be measured directly rather than inferred from a readability score." },
        { q: "Which AI engine was measured?", a: "Perplexity only, through its Agent API with the \"fast\" preset, on 2026-10-24. The results do not transfer to ChatGPT, Gemini, Google's AI Overviews or Copilot." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See what AI reads from your site",
        body: "The free check shows whether AI can read your business's facts. It does not predict whether AI will mention you; that has to be measured.",
        label: "Run the free check",
        href: "/check",
      },
      footnote: "Study by Nurevo (Bestie.合同会社). Perplexity is a trademark of Perplexity AI, Inc. Nurevo is not affiliated with Perplexity.",
    },

    ja: {
      title: "サイトの中のAEO対策はAIの答えへの登場と関係するか：62事業者を計測 | Nurevo",
      description: "日本の地域事業者62件のサイトを当社のAEOスコアで採点し、Perplexityに質問しました。スコアはAIの回答への登場を予測しませんでした（ρ＝0.03）。方法・データ・限界。",
      h1: "サイトの中のAEO対策はAIの答えへの登場と関係するか：62事業者を計測",
      lead: "今回の調査では、関係は見られませんでした。日本の地域事業者62件で、サイトの中のAEO対策（構造化データ・llms.txt・クローラー許可など）を測る当社のスコアと、おすすめを尋ねる質問にPerplexityがその事業者の名前を挙げる・サイトを引用する割合との間に、関係は見つかりませんでした（Spearmanのρ＝0.03、95%信頼区間 −0.23〜0.28、p＝0.834）。62件で確実に検出できるのはおよそ|ρ|≥0.35の相関だけなので、それより弱い関係までは否定できません。",
      intro: [
        "公開：2026年10月28日。計測日：2026年10月24日。Nurevoはここで検証したスコアを含むAEOツールを作っています（下の「利益相反と、私たちの対応」を参照）。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "問い：NurevoのAI読みやすさスコア（0〜100点）が高いサイトの事業者ほど、店名を含まない質問へのAIの回答に登場しやすいか。",
            "答え：支持されませんでした。全体でρ＝0.03、業種・都市を調整しても0.03。",
            "発見系の質問への回答のうち、事業者が登場したのは全体で21.0%。62件中25件が少なくとも1回登場しました。",
            "スコアの構成要素（構造化データ・llms.txt・網羅性など）も、多重検定の補正後はどれも関係が見られませんでした。",
            "私たちの受け止め：構造化データはAIが事実を正しく読む助けになりますが、それだけで名前が挙がるかは決まりません。ほかの要因、おそらく他のサイトがその事業者について何を書いているかが、より大きく効いています。ただし最後の点は今回検証していない仮説です。",
          ],
        },
        {
          heading: "調査の目的",
          paragraphs: [
            "当社を含むAEO（回答エンジン最適化）の助言は、サイトをAIに読みやすくすれば（schema.orgの構造化データ、llms.txt、AIクローラーの許可、サーバー側での表示）、AIの回答に出やすくなると言ってきました。Nurevoはまさにその要素で作ったスコアを提供しています。そのスコアが、事業者が本当に気にしていること、つまりAIに名前を挙げてもらえるかと連動しているのか、正直な証拠を得るために調べました。仮説・分析方法・判定基準はAIの回答を集める前に決め、結果がどちらでも公開すると決めていました。",
          ],
        },
        {
          heading: "方法",
          list: [
            "対象：自社の公式サイトを持つ地域事業者72件。Web検索で（ポータルサイトを除いて）選び、5業種（歯科・飲食・美容・士業〈税理士〉・宿泊）×4都市（東京・大阪・福岡・札幌）に分けました。スコアを計算できなかった10件を除き、62件を分析しました。",
            "スコア：各サイトのトップページ・robots.txt・llms.txtを、Nurevoの公開スコアと同じコードで採点しました。構造化データ（30点）・網羅性（25）・読みやすさ（20）・llms.txt（15）・一貫性（10）と、クローラー許可・エッジでのブロック・サーバー側表示のゲート（不通過なら15点が上限）です。",
            "AI：PerplexityのAgent API、プリセット「fast」（Web検索1回のあと回答）。Nurevoの有料プランがAI表示状況の計測に使うのと同じアダプターです。エンジンは1つだけです（限界を参照）。",
            "質問：1事業者あたり、地域と業種は含むが店名は含まない「発見系」の質問を3問（例：「梅田で歯医者のおすすめを教えてください。」。同じ地域・同じ業種の事業者は同じ質問を共有）と、店名を挙げて所在地と営業時間を尋ねる「名指し」の質問を1問。各質問を3回ずつ尋ねました。",
            "指標：回答に名前が含まれる、または引用元に自社ドメインがあれば「登場」とし、発見系の回答のうち登場した割合を「登場率」としました。",
            "検出の確認：名指しの質問への回答で名前が検出された割合は84.3%で、検出器を信頼する目安として事前に決めた70%を上回りました。",
            "分析：Spearmanの順位相関（並べ替え検定のp値、ブートストラップの信頼区間）、業種・都市を固定効果とした偏相関、層内での並べ替え検定、業種・都市の固定効果つきロジスティック回帰（同じ質問への繰り返し回答は独立でないため準二項で補正）。構成要素の6つの検定はHolm法で補正しました。",
          ],
          after: [
            "「支持」の基準は事前に決めました：ρ≥0.3、p<0.05、95%信頼区間の下限が0より上、調整後の相関も正。回答本文は保存せず、名前が出たか・自社ドメインが引用されたか・引用順位だけを記録しました。",
          ],
        },
        {
          heading: "結果",
          paragraphs: ["判定は「支持されない」です。スコアと登場の関係を見たどの検定でも、相関は0に近い値でした。"],
          table: STATS_JA,
          after: [
            "最も大きい係数（スコアと自社サイトの引用の0.18）も0と区別できず（p＝0.149）、発見として読むべきではありません。",
          ],
        },
        {
          heading: "スコア帯ごとの結果",
          paragraphs: [
            "Nurevoはスコアを赤・黄・緑で示します。対象サイトの大半は赤で、緑に届いたサイトはなかったため、非常に高いスコアについては今回の調査から何も言えません。",
          ],
          table: {
            head: ["スコア帯", "事業者数", "平均登場率", "1回以上登場"],
            rows: [
              ["赤", "54", "20.8%", "22"],
              ["黄", "8", "22.2%", "3"],
              ["緑", "0", "-", "-"],
            ],
          },
        },
        {
          heading: "構成要素ごとの結果",
          paragraphs: ["スコアのどの要素も登場との関係は見られませんでした。Holm法で補正したp値はすべて1.000です。これらは探索的な分析です。"],
          table: {
            head: ["構成要素", "登場率とのSpearmanのρ"],
            rows: [
              ["構造化データ（schema）", "0.08"],
              ["網羅性（coverage）", "0.12"],
              ["読みやすさ（legibility）", "−0.17"],
              ["llms.txt", "−0.02（オッズ比1.41、95%信頼区間 0.79〜2.52）"],
              ["一貫性（consistency）", "0.06"],
              ["ゲート（クローラー許可・エッジ・サーバー側表示）", "通過61件：登場率21.3%／不通過1件：0%"],
            ],
            caption: "Holm法で補正したp値はすべての要素で1.000。",
          },
        },
        {
          heading: "業種別・都市別",
          paragraphs: ["登場率は、スコアよりも業種や都市によって大きく違いました。小さなグループの記述的な数字で、差を検定したものではありません。"],
          table: {
            head: ["グループ", "事業者数", "平均スコア", "登場率"],
            rows: [
              ["士業（税理士）", "13", "27.92", "10.3%"],
              ["宿泊", "13", "21.08", "23.9%"],
              ["歯科", "13", "40.15", "25.6%"],
              ["美容", "8", "24.25", "8.3%"],
              ["飲食", "15", "24.20", "30.4%"],
              ["大阪", "15", "26.27", "15.6%"],
              ["札幌", "17", "29.41", "9.8%"],
              ["東京", "15", "25.53", "31.1%"],
              ["福岡", "15", "29.27", "28.9%"],
            ],
            caption: "業種の行と都市の行は、それぞれ同じ62事業者を分けたものです。",
          },
        },
        {
          heading: "この調査の限界",
          list: [
            "横断研究：多くのサイトを1回測っただけなので、示せるのは関連であって因果ではありません。サイトを改善すると登場が変わるかは、同じサイトの改善前後を比べる研究が必要です。",
            "検出力：62件では、|ρ|がおよそ0.35より弱い相関は見逃すことが多くなります。同じ地域・業種の事業者は同じ回答を共有するため、実質的な情報量はさらに少なくなります。「見つからない」は「存在しない」という意味ではありません。",
            "1つのエンジン・1時点：Perplexity（プリセット「fast」）で2026年10月24日に計測した結果です。ChatGPT・Gemini・GoogleのAIによる概要・Copilotは検索インデックスもモデルも違うため、この結果は当てはまりません。",
            "観測していない交絡要因：口コミ、知名度、広告、開業年数、他サイトへの掲載状況は測っていません。調整できたのは業種と都市だけです。",
            "サンプル：事業者はWeb検索で選んだため、もともと見つかりやすい事業者に偏っています。緑のサイトはありませんでした。日本の5業種・4都市の結果で、他の業種・地域・言語に当てはまるとは限りません。",
          ],
        },
        {
          heading: "事業者のサイトにとっての意味",
          paragraphs: [
            "構造化データ・llms.txt・クローラー許可には、今も役割があります。AIが事業者の事実（住所・営業時間・電話番号・サービス）を推測せず、正しく読めるようにすることです。これはやる価値のある仕事ですが、「おすすめされること」とは別の仕事です。今回の調査では、よく読まれるサイトが、よく名前を挙げられるサイトではありませんでした。",
            "私たちの作業仮説は、AIがおすすめを答えるときに名前を挙げるかどうかには、サイトの外の情報源（口コミや地図の掲載、地域メディア、業種別のディレクトリ、その事業者に触れている他のサイト）が大きく効いている、というものです。今回の調査はこれらを測っていないので、これは検証すべき仮説であって結果ではありません。",
            "実務としては、AIが語る内容を正確にするためにサイトの中の基本は整えたうえで、AIに実際に名前を挙げられているかは、読みやすさのスコアから推測せず直接測ることをおすすめします。",
          ],
        },
        {
          heading: "利益相反と、私たちの対応",
          paragraphs: [
            "NurevoはAEOツールを作っており、ここで検証したスコアは当社の製品です。「スコアは登場を予測しない」は私たちが望んだ結果ではありませんが、判定基準をデータを見る前に決めていたこと、そしてスコアで分かること・分からないことを事業者が知るべきだと考えることから、公開します。",
            "対応として、AI読みやすさスコアを「AIの回答に登場するかの予測」としては示しません。代わりに登場を直接測ります。Proプランでは、Perplexityが名前を挙げる・サイトを引用する割合を計測しています（ベータ）。FreeとStandardのサイト向けにも、月1回の小さな登場チェックを追加しています。また、サイトの中の要素だけに頼らず、実際に計測したAIでの表示状況を組み合わせるスコアの第2版を開発しています。",
            "計測した事業者の名前とサイトは公開しません。",
          ],
        },
      ],
      faqs: [
        { q: "構造化データを入れるとAIに名前を挙げてもらえますか？", a: "Perplexityで地域事業者62件を調べた今回の調査では、構造化データなどサイトの中の要素と、名前が挙がる割合との間に関係は見られませんでした（ρ＝0.03）。構造化データはAIが事実を正しく読む助けになりますが、それだけで登場を予測するものではありませんでした。" },
        { q: "llms.txtはAIの回答への登場に効きますか？", a: "今回の調査では関係は見られませんでした（llms.txtの要素と登場率のρ＝−0.02、Holm補正後のp＝1.000）。小規模で1つのエンジンだけの調査なので、llms.txtが決して効かないことの証明ではありません。" },
        { q: "AEO対策は意味がないということですか？", a: "いいえ。サイトの中のAEO対策は、AIが事業者について語る内容を正確にします。今回の結果は、それだけではおすすめされるのに十分でないこと、そして登場しているかは読みやすさのスコアから推測せず直接測るべきことを示唆しています。" },
        { q: "どのAIで計測しましたか？", a: "PerplexityのみでAgent API・プリセット「fast」を使い、2026年10月24日に計測しました。ChatGPT・Gemini・GoogleのAIによる概要・Copilotには当てはまりません。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIがあなたのサイトから何を読んでいるか確認",
        body: "無料チェックでは、AIが事業者の事実を読めるかが分かります。AIに名前を挙げられるかを予測するものではなく、それは計測が必要です。",
        label: "無料でチェックする",
        href: "/check",
      },
      footnote: "調査：Nurevo（Bestie.合同会社）。PerplexityはPerplexity AI, Inc.の商標です。NurevoはPerplexityと提携関係にありません。",
    },
  },
};
