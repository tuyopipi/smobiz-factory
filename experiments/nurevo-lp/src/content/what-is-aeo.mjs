export default {
  slug: "what-is-aeo",
  targetQueries: ["what is AEO", "answer engine optimization", "what is GEO", "AEO vs SEO"],
  related: ["aeo-for-wordpress", "llms-txt", "how-to-appear-in-chatgpt", "ai-visibility-check"],
  locales: {
    en: {
      title: "What Is AEO (Answer Engine Optimization)? | Nurevo",
      description: "Learn how Answer Engine Optimization helps your business get read, trusted and cited by ChatGPT, Perplexity, AI Overviews and Gemini.",
      h1: "What Is AEO (Answer Engine Optimization)?",
      lead: "AEO — Answer Engine Optimization — is the practice of making your website readable and citable by AI answer engines like ChatGPT, Perplexity, Google's AI Overviews, and Gemini, so your business is named when people ask AI for a recommendation.",
      intro: ["For twenty years, being found online meant ranking on a page of blue links. That era is ending. People increasingly ask an AI assistant “what's the best X near me?” and act on the short answer it gives — often without ever seeing a list of links. If the AI doesn't mention you, you don't exist in that moment. AEO is how you get into the answer."],
      sections: [
        { heading: "AEO in one sentence", paragraphs: ["SEO got you ranked on a page of links. AEO gets you named inside the AI's answer."] },
        { heading: "How AI answer engines actually work", paragraphs: ["AI answer engines don't browse your site the way a person does. Three things matter:"], list: ["They often don't run JavaScript. Many AI crawlers read the raw HTML your server returns. If your key information only appears after JavaScript runs in a browser, the AI may never see it.", "They rely on structure, not layout. A human reads a pretty page; an AI reads machine-readable signals — schema.org structured data, clean headings, and plain factual statements it can lift verbatim.", "They prefer sources they can trust and cite. Clear, consistent, well-structured pages — plus a file that explicitly describes your site to AI, like llms.txt — make you an easy, safe source to quote."], after: ["So a site can look perfect to visitors and still be invisible to AI. [See how to check whether AI can read your site](/check)."] },
        { heading: "AEO vs SEO vs GEO", list: ["SEO optimizes for a ranking algorithm that orders links.", "AEO (Answer Engine Optimization) optimizes to be cited inside an AI's answer.", "GEO (Generative Engine Optimization) is the term many English-speaking marketers use for the same idea as AEO."], after: ["In practice, AEO and GEO describe the same goal. Good SEO still helps — AI often pulls from well-ranked, trusted pages — but it is no longer sufficient on its own."] },
        { heading: "The four building blocks of AEO", list: ["Structured data (schema.org). Tell AI exactly what your business, products, services and FAQs are, in a format it parses reliably. [AEO for WordPress](/guide/aeo-wordpress)", "llms.txt. A simple file at your domain root that describes your site and points AI to your most important pages. [Learn about llms.txt](/guide/llms-txt)", "AI crawler access. Your robots.txt must actually allow the AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others). Many sites silently block them.", "Clear, extractable content. Short, factual, well-headed answers to the questions your customers actually ask AI. [How to appear in ChatGPT](/guide/appear-in-chatgpt)"] },
        { heading: "Why now", paragraphs: ["The shift is happening fast. Every month more buying journeys start with a question to an AI instead of a search box. Businesses that get cited early build a compounding advantage: AI tends to keep surfacing sources it already trusts. Being early to AEO is like being early to SEO in 2005 — the cost of waiting is being absent from the answer while a competitor owns it."] }
      ],
      faqs: [{ q: "Is AEO the same as GEO?", a: "Effectively yes. GEO (Generative Engine Optimization) is the term many marketers use; AEO (Answer Engine Optimization) is the same goal — being cited by AI answer engines." }, { q: "Does AEO replace SEO?", a: "No. SEO still helps, because AI often draws on well-ranked, trusted pages. AEO adds the structure and signals that let AI actually read and cite you. You want both." }, { q: "How do I know if AI can see my site?", a: "Run a free check: it looks at whether your structured data, llms.txt and crawler access let AI read you, and whether you currently appear in AI answers. [Run the free check](/check)." }, { q: "Do I need to be technical to do AEO?", a: "No. On WordPress, a plugin can output the right structured data, llms.txt and crawler settings automatically. [See AEO for WordPress](/guide/aeo-wordpress)." }],
      relatedHeading: "Related guides", cta: { heading: "Ready to see where you stand?", body: "Run a free AI-visibility check. No sign-up required.", label: "Run the free check", href: "/check" }
    },
    ja: {
      title: "AEO（アンサーエンジン最適化）とは？ | Nurevo",
      description: "ChatGPT、Perplexity、AI Overviews、Geminiに読まれ、信頼され、引用されるためのAEOを分かりやすく解説します。",
      h1: "AEO（アンサーエンジン最適化）とは？",
      lead: "AEO（Answer Engine Optimization＝アンサーエンジン最適化）とは、ChatGPT・Perplexity・GoogleのAI Overviews・GeminiといったAIの回答エンジンに、あなたのサイトを「読めて・引用できる」状態にする取り組みです。人がAIに「おすすめは？」と聞いたとき、あなたのお店や会社が答えの中で名前を出されるようにすることが目的です。",
      intro: ["20年間、ネットで見つかるとは「検索結果のリンク一覧で上位に出る」ことでした。その時代が終わりつつあります。人はAIに「近くでいい〇〇は？」と聞き、返ってきた短い答えで動く——リンク一覧を一度も見ずに。AIがあなたを挙げなければ、その瞬間あなたは存在しないのと同じ。AEOは、その答えの中に入るための最適化です。"],
      sections: [
        { heading: "ひとことで言うと", paragraphs: ["SEOは「リンク一覧で上位に出す」。AEOは「AIの答えの中で名前を出させる」。"] },
        { heading: "AIの回答エンジンの仕組み", paragraphs: ["AIは人と同じようにサイトを見ません。重要なのは3つ："], list: ["多くのAIクローラーはJavaScriptを実行しない。サーバーが返す生のHTMLを読む。重要情報がブラウザ上でJS実行後にしか出ないと、AIには見えない。", "見た目ではなく構造を読む。人は綺麗なページを読むが、AIは機械可読の信号——schema.orgの構造化データ、整った見出し、そのまま引用できる明快な事実——を読む。", "信頼して引用できる情報源を好む。明快で一貫し構造化されたページ＋llms.txtのようにAIへサイトを説明するファイルがあると、引用しやすい安全な情報源になる。"], after: ["だから、訪問者には完璧に見えても、AIには透明なサイトが起こりえます。[自分のサイトがAIに読まれているか確認](/check)。"] },
        { heading: "AEO / SEO / GEO の違い", list: ["SEO：リンクを並べるランキングアルゴリズム向けの最適化。", "AEO（アンサーエンジン最適化）：AIの答えの中で引用されるための最適化。", "GEO（Generative Engine Optimization）：英語圏のマーケターがAEOと同じ意味で使う語。"], after: ["実務上、AEOとGEOは同じゴール。良いSEOは今も役立つ（AIは上位の信頼されたページを引くことが多い）が、もうそれだけでは足りない。"] },
        { heading: "AEOの4つの構成要素", list: ["構造化データ（schema.org）：事業・商品・サービス・FAQが何かを、AIが確実に解釈できる形で伝える。[WordPressのAEO](/ja/guide/aeo-wordpress)", "llms.txt：ドメイン直下に置く、サイトを説明しAIを重要ページへ導くシンプルなファイル。[llms.txtガイド](/ja/guide/llms-txt)", "AIクローラの許可：robots.txtでAIクローラ（GPTBot・ClaudeBot・PerplexityBot・Google-Extended 等）を実際に許可しているか。多くのサイトが知らずにブロックしている。", "明快で抜き出しやすいコンテンツ：顧客が実際にAIに聞く問いへの、短く事実ベースで見出しの整った答え。[ChatGPTに表示される方法](/ja/guide/appear-in-chatgpt)"] },
        { heading: "なぜ今か", paragraphs: ["変化は速い。毎月、検索窓ではなくAIへの質問から始まる購買が増えています。早く引用された事業は複利の優位を築く——AIは一度信頼した情報源を繰り返し挙げる傾向があるから。AEOに早いことは、2005年にSEOに早かったのと同じ。待つコストは「競合が答えを独占する間、自分は答えに不在」になること。"] }
      ],
      faqs: [{ q: "AEOとGEOは同じ？", a: "実質同じ。GEO（Generative Engine Optimization）はマーケターがよく使う語で、AEO（アンサーエンジン最適化）と同じ「AIに引用される」ゴールを指す。" }, { q: "AEOはSEOの代わり？", a: "いいえ。SEOは今も役立つ（AIは上位・信頼ページを引くため）。AEOは、AIが実際に読んで引用できる構造と信号を足すもの。両方やるのが正解。" }, { q: "自分のサイトがAIに見えているか、どう分かる？", a: "無料チェックで分かる：構造化データ・llms.txt・クローラ許可がAIに読める状態か、今AIの答えに出ているかを確認。[無料チェックを実行](/check)。" }, { q: "技術者じゃないと無理？", a: "いいえ。WordPressならプラグインが、正しい構造化データ・llms.txt・クローラ設定を自動で出力する。[WordPressのAEO](/ja/guide/aeo-wordpress)。" }],
      relatedHeading: "関連ガイド", cta: { heading: "今どの位置にいるか見てみませんか？", body: "AI可視性を無料でチェックできます。登録は不要です。", label: "AI可視性を無料でチェック", href: "/check" }
    }
  }
};
