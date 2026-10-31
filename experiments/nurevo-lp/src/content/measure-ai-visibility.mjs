// Content page: how to measure how often a business appears in AI answers
// (AI visibility / appearance rate) - choosing questions, how many runs, how
// to record and how to read the numbers.
//
// Written 2026-10-31 (JST). The method follows the one Nurevo itself uses and
// documents: experiments/webmcp-canary/study/README.md (discovery vs named
// questions, repeated runs, name and citation recorded separately, failures
// left out of the denominator), docs/pro-measurement-implementation.md (fixed
// question set, same conditions for trends, citation order is the provider's
// source list order, SoV denominator) and the plugin readme (free AI check:
// three questions a month on Perplexity; Pro measurement in beta). The study
// figures are those of aeo-signals-ai-answers-study; do not add others.
//
// Third-party facts, checked 2026-10-31 and linked in the copy:
//   - OpenAI crawlers (developers.openai.com/api/docs/bots), Perplexity
//     crawlers (docs.perplexity.ai) - fetched and read.
//   - Google AI features in Search Console (the ai-features doc, version
//     updated 2025-12-31, read on its developers.google.cn mirror) and the
//     title/date of the June 2026 Search Central blog post (body not readable
//     from here, so the copy says nothing about what the new reports contain).
//   - utm_source=chatgpt.com: OpenAI's Publishers and Developers FAQ. The help
//     centre could not be fetched from here; the sentence was confirmed in the
//     search index. Re-check it when you update this page.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleBlog: "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports",
  openaiFaq: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  perplexityBots: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
};

export default {
  slug: "measure-ai-visibility",
  targetQueries: [
    "how to measure AI visibility",
    "how to track brand mentions in ChatGPT and Perplexity",
    "AI share of voice how to measure",
    "AI 登場率 測り方",
    "AI検索 可視性 計測 方法",
    "ChatGPT 自社 言及 確認 方法",
  ],
  related: ["aeo-tools-comparison", "aeo-signals-ai-answers-study", "appear-in-chatgpt", "what-is-aeo", "llms-txt"],
  locales: {
    ja: {
      title: "AIでの登場率の測り方：質問の選び方・回数・数字の読み方 | Nurevo",
      description: "ChatGPTやPerplexityの回答に自社が出ているかを測る手順。店名を含まない質問を固定し、同じ条件で複数回聞き、名前の登場と自社サイトの引用を分けて記録します。記録表と注意点も。",
      h1: "AIでの登場率（AI可視性）の測り方：質問の選び方・回数・数字の読み方",
      lead: "AIでの登場率は、「お客様が実際に聞きそうな質問を決めてAIに何回か聞き、回答に自社名が出た、または自社サイトが出典として引用された割合」で測ります。大事なのは、店名を含まない質問を固定すること、同じ質問を同じ条件で複数回聞くこと、そして1回の結果ではなく同じ条件での推移で読むことの3つです。",
      intro: [
        "作成日：2026年10月31日。OpenAI・Perplexity・Googleの仕様は、同日に各社の公式ドキュメントで確認したものです。仕様は変わることがあるため、最新の情報もあわせてご確認ください。",
        "AIの回答は、同じ質問でも日や回によって変わります。ここで紹介する方法で得られる数字は、すべての回答を見たものではなくサンプルです。また、どんな対策をしても、AIに必ず表示される・順位が保証されるということはありません。",
      ],
      sections: [
        {
          heading: "「AIでの登場率」とは：測る数字は4つ",
          paragraphs: [
            "AI可視性（AI visibility）という言葉は、ツールによって指す数字が少しずつ違います。自分で測るときは、次の4つを分けて記録すると、あとで比べやすくなります。",
          ],
          table: {
            head: ["数字", "数え方", "わかること"],
            rows: [
              ["名前の登場率", "回答の本文に自社名（よく使われる別名を含む）が出た回答 ÷ 正常に得られた回答", "AIがおすすめや候補として自社を挙げているか"],
              ["自社サイトの引用率", "出典（引用元のURL）に自社ドメインが入った回答 ÷ 正常に得られた回答", "AIが自社サイトを情報源として使っているか"],
              ["登場率", "名前の登場か自社サイトの引用の、どちらかがあった回答 ÷ 正常に得られた回答", "全体として回答に姿を見せているか"],
              ["競合との引用シェア", "自社ドメインの引用回数 ÷（自社＋指定した競合のドメインの引用回数の合計）", "決めた競合と比べて、出典としてどれだけ選ばれているか"],
            ],
            caption: "エラーで回答が得られなかった回は分母に入れません。1つの回答に複数のドメインが引用されるため、引用シェアの分母は回答数とは一致しません。",
          },
          after: [
            "名前が出ても自社サイトが引用されない（口コミサイトや地図サービスが出典になっている）こともあれば、その逆もあります。2つを混ぜずに記録するのがポイントです。",
          ],
        },
        {
          heading: "測り方の手順（6ステップ）",
          list: [
            "追うAIを決める：まずはお客様が使っていそうなAIを1つか2つ。結果はAIごとに分けて記録し、混ぜません。AIによって検索の仕組みも回答するモデルも違うため、あるAIの結果を別のAIに当てはめることはできません。",
            "質問を決める：店名を含まない「発見系」の質問を5〜20本。例：「梅田で歯医者のおすすめを教えてください」。店名を入れた「名指し」の質問は、登場率には入れず、AIが事実を正しく答えているかの確認に使います（次の章）。",
            "回数を決める：AIの回答は毎回変わるため、各質問を2〜3回聞きます。回数が少ないほど、たまたまの結果に左右されます。",
            "条件をそろえる：同じ文面、同じAIの同じモード、ログアウト状態など、毎回同じ条件で聞きます。一般向けのアプリは、ログイン・位置情報・会話の履歴で回答が変わることがあります。",
            "記録する：日時、AI、質問、名前が出たか、自社ドメインが出典に入ったか、代わりに出た会社やサイト、回答の抜粋を残します（記録表の例は後の章）。",
            "毎月、同じセットで繰り返す：推移は、同じ質問・同じAI・同じ条件で測ったものどうしでだけ比べます。質問を入れ替えたら、それは新しい系列として数え直します。",
          ],
        },
        {
          heading: "質問の選び方：発見系と名指しを分ける",
          table: {
            head: ["種類", "例（梅田の歯科医院の場合）", "使い方"],
            rows: [
              ["発見系", "梅田で歯医者のおすすめを教えてください。", "登場率の中心。店名を知らない人がAIに聞く場面"],
              ["発見系（ニーズ別）", "梅田で、痛みに配慮して治療してくれる歯医者を探しています。どこがいいですか？", "自社の強みに合う質問で出ているかを見る"],
              ["名指し", "「〇〇歯科」の所在地と診療時間を教えてください。", "登場率には入れない。住所・営業時間などの事実が正しいか、自社サイトが出典になるかの確認"],
            ],
            caption: "例は、Nurevoが2026年10月の調査で使った質問の形です。地名と業種を自社に合わせて置き換えてください。",
          },
          after: [
            "名指しの質問では、ほぼ毎回名前が出るのが普通です。これを登場率に混ぜると数字が高く見えるだけなので、別枠にします。発見系の質問は、お客様が実際に使う言葉で書くことと、自社が扱っていないサービスの質問を入れないことが大切です。",
          ],
        },
        {
          heading: "記録表の例",
          paragraphs: [
            "スプレッドシートで1回答1行にすると、あとで集計しやすくなります。",
          ],
          table: {
            head: ["列", "記入例"],
            rows: [
              ["日時・AI・モード", "2026-10-31 10:00／Perplexity／通常の検索"],
              ["質問ID・質問文・何回目か", "d1／梅田で歯医者のおすすめを教えてください。／2回目"],
              ["名前の登場", "あり／なし"],
              ["自社サイトの引用", "あり／なし（出典に自社ドメインが入ったか）"],
              ["代わりに出た会社・サイト", "競合A、口コミサイトB など"],
              ["回答の抜粋と確認メモ", "自社に触れた部分の抜粋。事実の誤りがあれば、正しい情報と出典をメモ"],
            ],
          },
          after: [
            "回答の誤りは、自動で「正しい」とは判定せず、人が自社の正しい情報と照らして確認します。誤りが見つかったら、サイト上の該当する事実（営業時間、住所、サービス内容など）がはっきり書かれているかを見直しましょう。[ChatGPTに自社が出る仕組み](/guide/appear-in-chatgpt)も参考になります。",
          ],
        },
        {
          heading: "数字を読むときの5つの注意",
          list: [
            "1回の結果で判断しない。同じ条件で測った推移を見ます。回答が2〜3件しかない質問の率は、ほとんど意味を持ちません。",
            "出典の並び順は順位ではありません。出典リストの順番は、そのAIが一覧を返した順で、検索順位や「おすすめ順」を表すものではありません。",
            "出ていない理由は、数字からは断定できません。わかるのは「観測した回答では引用されなかった」ことだけです。",
            "サイトの整備と登場率は、すぐには連動しないことがあります。Nurevoが62の地域事業者で調べたところ、サイト側のAEOスコアとPerplexityでの登場率には関係が見えませんでした（ρ＝0.03）。この規模で検出できるのは強めの関係だけなので「関係がない」とまでは言えませんが、整備だけで登場率が上がると決めつけないことが大切です。[調査の詳細](/guide/aeo-signals-ai-answers-study)",
            "AIごとに別々に読む。Perplexityで出ていても、ChatGPTやGoogleのAIで同じとは限りません。",
          ],
        },
        {
          heading: "手作業以外の測り方と、わかること・わからないこと",
          table: {
            head: ["方法", "わかること", "わからないこと"],
            rows: [
              ["アクセス解析（参照元）", `AIの回答からサイトに来た訪問。OpenAIは、ChatGPTの検索結果からのリンクに utm_source=chatgpt.com を自動で付けるとしています（[OpenAI：パブリッシャー向けFAQ](${SRC.openaiFaq})）`, "クリックされなかった登場（回答の中で名前が出ただけの場合）"],
              ["Google Search Console", `GoogleのAI機能（AI OverviewsやAI Mode）に表示されたサイトも、検索パフォーマンスの「ウェブ」の数字に含まれます（[Google：AI機能とウェブサイト](${SRC.googleAi})、2025年12月31日更新版で確認）。Googleは2026年6月に、生成AIに関するSearch Consoleのパフォーマンスレポートも発表しています（[Search Central ブログ](${SRC.googleBlog})）`, "ChatGPTやPerplexityなど、Google以外のAIでの見え方"],
              ["サーバーのアクセスログ", `AI検索のクローラがページを読みに来ているか。OpenAIはOAI-SearchBot（検索用）とChatGPT-User（利用者の質問に応じてページを開く）（[OpenAI：クローラの概要](${SRC.openaiBots})）、PerplexityはPerplexityBotとPerplexity-Userを公開しています（[Perplexity：クローラ](${SRC.perplexityBots})）`, "読まれたことと、回答に出たことは別。登場率はわからない"],
              ["計測ツール", "決めた質問をAIに定期的に投げ、言及・引用・競合・推移を自動で記録", `対象のAIや質問数はツールとプランで違います。[AEOツールの比較](/guide/aeo-tools-comparison)`],
            ],
          },
          after: [
            "参考までに、Nurevo AEOでは、接続したFree・Standardのサイトに、業種と地域から作った店名を含まない3つの質問を月1回Perplexityに聞き、名前が出たか・サイトが引用されたか・代わりに誰が出たかを表示する無料のAIチェックがあります。決めた質問のセットを同じ条件で繰り返し測り、競合との比較と推移を記録する継続計測はPro（月14,800円〜、ベータ）で、現在はPerplexityで測っています。",
          ],
        },
      ],
      faqs: [
        { q: "質問は何本、何回聞けば十分ですか？", a: "決まった正解はありませんが、まずは発見系の質問を5〜20本、各2〜3回から始めるのが現実的です。本数や回数が少ないほど、たまたまの結果に左右されます。大切なのは、毎月同じ質問・同じ条件で測り続けることです。" },
        { q: "自分でChatGPTに聞くだけではだめですか？", a: "確認の第一歩としては役に立ちます。ただ、ログイン状態・位置情報・会話の履歴で回答が変わることがあり、1回の結果は偶然の要素が大きくなります。記録表に残し、同じ条件で繰り返すと比べられる数字になります。" },
        { q: "名指しの質問で出ていれば大丈夫ですか？", a: "名指しの質問ではほぼ毎回名前が出るのが普通なので、登場率の目安にはなりません。名指しの質問は、住所や営業時間などの事実が正しいか、自社サイトが出典になっているかの確認に使い、登場率は店名を含まない質問で測りましょう。" },
        { q: "登場率が低いとき、まず何をすればいいですか？", a: "まずAIがサイトを読める状態か（構造化データ、llms.txt、AI検索のクローラを止めていないか）を確認します。そのうえで、代わりに出ている会社やサイトが何を書いているかを見ると、足りない情報の手がかりになります。ただし、整備をしても登場率がすぐ上がるとは限りません。" },
        { q: "測れば、AIに出るようになりますか？", a: "いいえ。測ることは現状を知る手段で、それだけで回答が変わるわけではありません。また、AIの回答は日々変わり、掲載や順位を保証できる方法はありません。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトを読めるか確認",
        body: "登録不要の無料チェックで、構造化データやllms.txtなど、AIが読む情報の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPT、OpenAI、Perplexity、Google、Search Consoleおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "How to Measure AI Visibility in ChatGPT and Perplexity | Nurevo",
      description: "How to measure whether ChatGPT or Perplexity mention your business: fix unbranded questions, ask each several times, and record name mentions and citations apart.",
      h1: "How to measure AI visibility: choosing questions, how many runs, and reading the numbers",
      lead: "You measure AI visibility by choosing the questions your customers would actually ask, putting each to an AI several times, and counting the share of answers that name your business or cite your site as a source. Three things matter most: keep a fixed set of questions that do not contain your name, ask them repeatedly under the same conditions, and read the trend across runs rather than any single answer.",
      intro: [
        "Written October 31, 2026. What OpenAI, Perplexity and Google say was checked in their own documentation that day. It can change, so check the current pages too.",
        "AI answers change between days and between runs of the same question. The numbers this method produces are a sample, not a view of every answer. And nothing you do can guarantee that an AI will mention you or rank you anywhere.",
      ],
      sections: [
        {
          heading: "What \"AI visibility\" means: four numbers to track",
          paragraphs: [
            "Different tools use \"AI visibility\" for slightly different numbers. If you measure it yourself, keeping these four apart makes your results much easier to compare later.",
          ],
          table: {
            head: ["Number", "How to count it", "What it tells you"],
            rows: [
              ["Mention rate", "Answers whose text names your business (including common alternative names) ÷ answers received", "Whether the AI suggests you as an option"],
              ["Citation rate", "Answers whose sources include your domain ÷ answers received", "Whether the AI uses your site as a source"],
              ["Appearance rate", "Answers with either a mention or a citation ÷ answers received", "Whether you show up in the answer at all"],
              ["Citation share against competitors", "Citations of your domain ÷ (citations of your domain + citations of the competitor domains you chose)", "How often you are chosen as a source compared with named competitors"],
            ],
            caption: "Runs that failed and returned no answer are left out of the denominator. One answer can cite several domains, so the share's denominator is not the number of answers.",
          },
          after: [
            "An AI may name you while citing a review site or a map service instead of your own site, and the reverse happens too. Record the two separately.",
          ],
        },
        {
          heading: "How to measure it, in six steps",
          list: [
            "Pick the AI platforms: start with the one or two your customers are most likely to use. Record each platform separately and never pool them. Each one uses its own search system and its own model, so a result on one does not carry over to another.",
            "Write the questions: 5 to 20 \"discovery\" questions that do not contain your name, such as \"Can you recommend a dentist in Umeda?\" Questions that name you are kept out of the rate and used to check whether the AI states your facts correctly (next section).",
            "Decide how many runs: answers change each time, so ask each question two or three times. The fewer runs, the more a lucky or unlucky answer moves the number.",
            "Keep the conditions the same: the same wording, the same platform and mode, signed out, every time. Consumer apps can change their answers with sign-in, location and chat history.",
            "Record each answer: date and time, platform, question, whether you were named, whether your domain was among the sources, who appeared instead, and an excerpt (see the sheet below).",
            "Repeat monthly with the same set: compare trends only between runs with the same questions, the same platform and the same conditions. If you change the questions, start a new series.",
          ],
        },
        {
          heading: "Choosing questions: keep discovery and named questions apart",
          table: {
            head: ["Type", "Example (a dental clinic in Umeda, Osaka)", "Use"],
            rows: [
              ["Discovery", "Can you recommend a dentist in Umeda?", "The core of the rate: someone who does not know your name asks an AI"],
              ["Discovery (specific need)", "I'm looking for a dentist in Umeda who is careful about pain. Where should I go?", "Shows whether you appear for the strengths you actually have"],
              ["Named", "What are the address and opening hours of \"XYZ Dental\"?", "Not part of the rate. Checks whether facts such as address and hours are correct and whether your site is cited"],
            ],
            caption: "These follow the form of the questions Nurevo used in its October 2026 study. Replace the place and business type with your own.",
          },
          after: [
            "Named questions return your name almost every time. Mixing them into the rate only makes it look higher, so keep them separate. Write discovery questions in the words your customers use, and leave out questions about services you do not offer.",
          ],
        },
        {
          heading: "An example recording sheet",
          paragraphs: [
            "One row per answer in a spreadsheet makes the counting easy later.",
          ],
          table: {
            head: ["Column", "Example"],
            rows: [
              ["Date, platform, mode", "2026-10-31 10:00 / Perplexity / standard search"],
              ["Question ID, wording, run number", "d1 / Can you recommend a dentist in Umeda? / run 2"],
              ["Named", "Yes / no"],
              ["Own site cited", "Yes / no (was your domain among the sources?)"],
              ["Who appeared instead", "Competitor A, review site B, etc."],
              ["Excerpt and check notes", "The part that mentions you. If a fact is wrong, note the correct fact and where it is published"],
            ],
          },
          after: [
            "Do not mark an answer as correct automatically: a person should check it against your own facts. If you find an error, check that the fact in question (hours, address, services) is stated clearly on your site. See also [how businesses appear in ChatGPT](/guide/appear-in-chatgpt).",
          ],
        },
        {
          heading: "Five things to keep in mind when reading the numbers",
          list: [
            "Do not act on a single run. Look at the trend under the same conditions. A rate based on two or three answers means very little.",
            "The order of sources is not a ranking. A source list comes back in the order the platform returns it; it is not a search ranking or a \"best first\" order.",
            "The numbers cannot tell you why you are missing. All they show is that the answers you observed did not cite you.",
            "Site improvements and appearance do not always move together quickly. When Nurevo studied 62 local businesses, its on-site AEO score showed no relationship with how often Perplexity named or cited them (ρ = 0.03). A study that size can only detect fairly strong relationships, so this does not prove there is none, but do not assume that fixing your site alone will raise the rate. [Read the study](/guide/aeo-signals-ai-answers-study)",
            "Read each platform on its own. Appearing on Perplexity does not mean you appear on ChatGPT or in Google's AI features.",
          ],
        },
        {
          heading: "Other ways to measure, and what each can and cannot show",
          table: {
            head: ["Method", "What it shows", "What it cannot show"],
            rows: [
              ["Web analytics (referrers)", `Visits that came from AI answers. OpenAI says ChatGPT automatically adds utm_source=chatgpt.com to links from ChatGPT search results ([OpenAI: publishers and developers FAQ](${SRC.openaiFaq}))`, "Appearances nobody clicked, such as a mention of your name in the answer"],
              ["Google Search Console", `Sites shown in Google's AI features (AI Overviews, AI Mode) are counted in the Performance report under the \"Web\" search type ([Google: AI features and your website](${SRC.googleAi}), version updated December 31, 2025). Google also announced generative AI performance reports in Search Console in June 2026 ([Search Central blog](${SRC.googleBlog}))`, "How you appear on AI platforms other than Google's, such as ChatGPT or Perplexity"],
              ["Server access logs", `Whether AI search crawlers read your pages. OpenAI documents OAI-SearchBot (for search) and ChatGPT-User (visits a page when a user asks) ([OpenAI: overview of crawlers](${SRC.openaiBots})); Perplexity documents PerplexityBot and Perplexity-User ([Perplexity: crawlers](${SRC.perplexityBots}))`, "Being read is not the same as appearing in an answer. It gives no appearance rate"],
              ["Monitoring tools", "Send a fixed set of questions to AI platforms on a schedule and record mentions, citations, competitors and trends automatically", "Platforms and question counts differ by tool and plan. [AEO tools compared](/guide/aeo-tools-comparison)"],
            ],
          },
          after: [
            "For reference: Nurevo AEO has a free AI check for connected Free and Standard sites. Once a month it asks Perplexity three questions built from your business type and area (never your name) and shows whether you were named, whether your site was cited and who appeared instead. Ongoing measurement of a fixed question set under the same conditions, with competitor comparison and history, is Pro (from $99/month, beta) and currently runs on Perplexity.",
          ],
        },
      ],
      faqs: [
        { q: "How many questions and runs are enough?", a: "There is no single right number, but 5 to 20 discovery questions asked two or three times each is a practical start. The fewer questions and runs, the more chance moves the result. What matters most is measuring the same questions under the same conditions every month." },
        { q: "Can't I just ask ChatGPT myself?", a: "It is a useful first look. But answers can change with sign-in, location and chat history, and one answer carries a lot of chance. Record what you see in a sheet and repeat it under the same conditions, and you get numbers you can compare." },
        { q: "If the AI names me when asked about me by name, am I fine?", a: "Named questions return your name almost every time, so they say little about visibility. Use them to check that facts such as your address and hours are right and that your site is cited, and measure visibility with questions that do not contain your name." },
        { q: "My rate is low. What should I do first?", a: "First check that AI can read your site: structured data, llms.txt, and that robots.txt is not blocking AI search crawlers. Then look at what the businesses and sites that appear instead say about themselves; it often shows which facts you are missing. Fixing your site does not guarantee the rate will rise quickly." },
        { q: "Will measuring make AI show my business?", a: "No. Measuring tells you where you stand; it does not change the answers. AI answers change daily, and no method can guarantee a mention or a position." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check that AI can read your site",
        body: "The free check shows the state of what AI reads, such as structured data and llms.txt, with no sign-up. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT, OpenAI, Perplexity, Google, Search Console and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
