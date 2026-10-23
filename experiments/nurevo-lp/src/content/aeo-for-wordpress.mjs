export default {
  "slug": "aeo-wordpress",
  "targetQueries": [
    "AEO for WordPress: How to Make Your Site Readable by AI",
    "WordPressのAEO：サイトをAIに読ませる方法"
  ],
  "related": [
    "what-is-aeo",
    "appear-in-chatgpt",
    "llms-txt",
    "aeo-vs-seo-vs-geo"
  ],
  "locales": {
    "en": {
      "title": "AEO for WordPress: How to Make Your Site Readable by AI | Nurevo",
      "description": "Make your WordPress site readable by AI with structured data, llms.txt and crawler access. Learn how a server-side plugin handles the essentials.",
      "h1": "AEO for WordPress: How to Make Your Site Readable by AI",
      "lead": "WordPress powers a huge share of the web, which makes it the easiest place to get AEO right — if you know what AI answer engines actually need. Here are the exact pieces, and how to do them on WordPress without touching code.",
      "sections": [
        {
          "heading": "What AI needs from a WordPress site",
          "paragraphs": [
            "AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Gemini) read your site as raw, server-rendered data. On WordPress, three things decide whether they can read and cite you:"
          ],
          "list": [
            "Structured data (schema.org JSON-LD) — your business, services, products and FAQs, in a format AI parses.",
            "llms.txt — a file at your domain root telling AI what your site is and which pages matter. [What is llms.txt?](/guide/llms-txt)",
            "AI crawler access — robots.txt must allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others."
          ]
        },
        {
          "heading": "The problem with doing it by hand",
          "paragraphs": [
            "Each can be done manually, but it drifts: schema breaks when you change themes, llms.txt goes stale, crawler lists change. For an agency managing many client sites, per-site by hand doesn't scale."
          ]
        },
        {
          "heading": "The WordPress way: a plugin that outputs it server-side",
          "paragraphs": [
            "A plugin can emit correct schema.org data, generate llms.txt, and set AI-crawler access automatically — server-side, so AI reads it even without running JavaScript. That is what Nurevo AEO does: install, connect, the plumbing is handled, with a score that shows where you stand."
          ]
        },
        {
          "heading": "For agencies",
          "paragraphs": [
            "If you build WordPress sites, AEO is a new service you can offer every client without building your own tooling — and earn recurring revenue doing it. [How to appear in ChatGPT](/guide/appear-in-chatgpt)"
          ]
        }
      ],
      "faqs": [
        {
          "q": "Does my theme or page builder matter for AEO?",
          "a": "What matters is server-rendered HTML and structured data, not the visual builder. A plugin that outputs schema server-side works regardless of theme."
        },
        {
          "q": "Will AEO slow my site down?",
          "a": "No. Structured data and llms.txt are tiny text files; they don't meaningfully affect page speed."
        },
        {
          "q": "Do I still need SEO on WordPress?",
          "a": "Yes — keep your SEO plugin. AEO adds the AI-readability layer on top. [AEO vs SEO vs GEO](/guide/aeo-vs-seo-vs-geo)"
        }
      ],
      "relatedHeading": "Related guides",
      "cta": {
        "heading": "See how AI reads your WordPress site",
        "body": "No sign-up required.",
        "label": "See how AI reads your WordPress site",
        "href": "/check"
      }
    },
    "ja": {
      "title": "WordPressのAEO：サイトをAIに読ませる方法 | Nurevo",
      "description": "WordPressサイトをAIに読ませるための構造化データ・llms.txt・クローラ許可と、コードを触らずに導入する方法を解説します。",
      "h1": "WordPressのAEO：サイトをAIに読ませる方法",
      "lead": "WordPressはウェブの大きな割合を占めるので、AEOを正しくやるのが一番ラクな場所です——AIの回答エンジンが何を必要とするか分かっていれば。ここでは、その要素と、コードを触らずWordPressでやる方法を。",
      "sections": [
        {
          "heading": "AIがWordPressサイトに求めるもの",
          "paragraphs": [
            "AIの回答エンジン（ChatGPT・Perplexity・Google AI Overviews・Gemini）は、サイトをサーバーが返す生のデータとして読みます。WordPressでは次の3つが読めるかどうかを決めます："
          ],
          "list": [
            "構造化データ（schema.org JSON-LD）— 事業・サービス・商品・FAQを、AIが解釈できる形で。",
            "llms.txt — ドメイン直下のファイルで、サイトが何か・どのページが重要かをAIに伝える。[llms.txtとは](/ja/guide/llms-txt)",
            "AIクローラの許可 — robots.txtで GPTBot・ClaudeBot・PerplexityBot・Google-Extended 等を通す。"
          ]
        },
        {
          "heading": "手作業の問題",
          "paragraphs": [
            "どれも手でできますが、ズレます：テーマ変更でスキーマが壊れ、llms.txtは古くなり、クローラ一覧は変わる。多数のクライアントサイトを1件ずつ手でやるのは現実的でない。"
          ]
        },
        {
          "heading": "WordPress流：サーバー側で出力するプラグイン",
          "paragraphs": [
            "プラグインなら、正しいschema.org・llms.txt・クローラ設定を自動でサーバー側出力できます——AIはJSを実行しなくても読める。Nurevo AEOはこれを行う：入れて繋ぐだけで配管完了、スコアで現在地が分かる。"
          ]
        },
        {
          "heading": "制作会社へ",
          "paragraphs": [
            "WordPressを作るなら、AEOは自前でツールを作らずに全クライアントに出せる新サービス＋継続収益になります。[ChatGPTに載る方法](/ja/guide/appear-in-chatgpt)"
          ]
        }
      ],
      "faqs": [
        {
          "q": "テーマやページビルダーはAEOに関係ある？",
          "a": "重要なのはサーバーが返すHTMLと構造化データで、見た目のビルダーではない。サーバー側でスキーマを出すプラグインならテーマ問わず効く。"
        },
        {
          "q": "AEOでサイトは遅くなる？",
          "a": "ならない。構造化データとllms.txtは極小のテキストで、表示速度にほぼ影響しない。"
        },
        {
          "q": "WordPressでもSEOは必要？",
          "a": "必要。SEOプラグインは残す。AEOはその上にAI可読性の層を足すもの。[AEO vs SEO vs GEO](/ja/guide/aeo-vs-seo-vs-geo)"
        }
      ],
      "relatedHeading": "関連ガイド",
      "cta": {
        "heading": "AIがあなたのWordPressをどう読んでいるか確認",
        "body": "登録は不要です。",
        "label": "AIがあなたのWordPressをどう読んでいるか確認",
        "href": "/check"
      }
    }
  }
};
