// Content page: AI search optimisation for WordPress sites built on the
// Japanese themes SWELL and Lightning, with SEO SIMPLE PACK and VK All in One
// Expansion Unit - what each one already publishes, how to check for duplicate
// structured data, what is missing for AI (business facts, llms.txt, AI crawler
// rules) and how to add it without a second graph.
//
// Written 2026-11-11 (JST).
// SWELL facts: swell-theme.com could not be fetched this run, so they come from
// Motoki Design's dated tests of SWELL 2.19.0 (verified 2026-09-30; pages
// updated 2026-11-01/03), linked in SRC. Readers are told to check their own
// site. Version-dependent; re-check when SWELL changes.
// Lightning facts: Vektor's own changelog (15.42.0, 2026-09-09; breadcrumb
// structured data via itemprop/itemscope = microdata) and features page.
// ExUnit, SEO SIMPLE PACK and every Nurevo behaviour: readme.txt 0.9.1 and the
// plugin source (webmcp_canary_seo_plugins_without_faq comments: SSP 3.7.0
// prints no JSON-LD; ExUnit 9.123.1 prints only WebSite and Article;
// suppression only when a supported SEO plugin is active; the rival-schema
// measurement reads the front page only; Nurevo emits BlogPosting on posts;
// filter webmcp_canary_schema_graph in docs/developers.md).
// Trademarks: no logos, footnote in every locale.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  swellTypes: "https://motoki-design.co.jp/wordpress/swell-structured-data-jsonld/",
  swellOff: "https://motoki-design.co.jp/wordpress/swell-disable-jsonld/",
  lightningLog: "https://www.vektor-inc.co.jp/product-update/lightning-update-change-log/",
  lightningFeatures: "https://lightning.vektor-inc.co.jp/features/",
  readme: WP_ORG,
  richTest: "https://search.google.com/test/rich-results",
  validator: "https://validator.schema.org/",
};

export default {
  slug: "swell-lightning-ai-search",
  targetQueries: [
    "SWELL AI検索 対策",
    "Lightning 構造化データ 重複",
    "SEO SIMPLE PACK 構造化データ llms.txt",
    "SWELL theme AI search optimization",
    "Lightning WordPress theme structured data",
    "SEO SIMPLE PACK schema AEO",
  ],
  related: ["local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility", "aeo-wordpress", "what-is-aeo"],
  locales: {
    ja: {
      title: "SWELL・LightningのAI検索対策：構造化データとllms.txt | Nurevo",
      description: "SWELL・Lightning・SEO SIMPLE PACK・VK ExUnitが出す構造化データ、重複の確かめ方、AIに足りない店舗情報・llms.txt・クローラ設定の足し方をまとめました。",
      h1: "SWELL・LightningのAI検索対策：テーマの構造化データを活かして、重複させずに足りない事実を足す手順",
      lead: "SWELLとLightning（＋VK All in One Expansion Unit）は、サイトと記事を説明する構造化データ（WebSite・Article など）を自動で出します。一方、AIが店や会社を説明するのに使う住所・電話・営業時間・サービス、llms.txt、AI検索のクローラの許可は出しません（この記事で確認した範囲）。SEO SIMPLE PACK は構造化データを出しません。テーマの出力は残し、足りない事実だけを同じ事業者の情報として足し、最後に重複がないことをページごとに確かめるのが基本の手順です。",
      intro: [
        "作成日：2026年11月11日（JST）。SWELLの出力内容は、SWELL 2.19.0 を2026年9月30日に検証した解説記事（出典を本文に記載）にもとづきます。今回はSWELL公式サイトを読み込めなかったため、テーマの版によって違う可能性があります。必ず後半の手順で、ご自分のサイトの実際の出力を確認してください。",
        "どんな設定をしても、ChatGPT・Perplexity・GoogleのAIに必ず表示される、順位が保証されるということはありません。AIの回答は日々変わります。この記事の目的は、AIがあなたのサイトの事実を「読み違えない」状態にすることです。",
      ],
      sections: [
        {
          heading: "構成ごとに、いま何が出ているか",
          paragraphs: [
            "国内のWordPressでよく見る組み合わせごとに、構造化データ（JSON-LD など）の出力をまとめました。左の列が自分のサイトの構成です。",
          ],
          table: {
            head: ["構成", "出している構造化データ", "AIに足りないもの"],
            rows: [
              ["SWELL（2.19.0）", `トップ：WebSite・Organization。投稿・固定ページ：WebSite・WebPage・Article・Organization。カテゴリーなど：CollectionPage。パンくずがあれば BreadcrumbList。FAQブロックは出力設定がオンのとき FAQPage（[解説記事](${SRC.swellTypes})）`, "Organization は名前・URL・ロゴ・SNSのリンクが中心で、住所・電話・営業時間は含まれない。llms.txt・AIクローラの許可もなし"],
              ["SEO SIMPLE PACK（3.7.0）", "なし。meta タグ・OGP・認証コードなどを出すプラグインで、JSON-LD は出さない", "構造化データ全般（テーマが出す分を除く）"],
              ["Lightning ＋ VK ExUnit（9.123.1）", `ExUnit がトップに WebSite、記事に Article を出す。Lightning のパンくずはHTMLに埋め込む形式（microdata）の構造化データ（[Lightning 変更履歴](${SRC.lightningLog})）`, "事業者の情報（ExUnit は事業者のノードを出さない）、FAQ、llms.txt、AIクローラの許可"],
              ["Lightning（ExUnit の構造化データをオフ）", "パンくずの microdata のみ", "上に加えて WebSite・Article"],
            ],
            caption: "SEO SIMPLE PACK・VK ExUnit の内容は、Nurevo AEO 0.9.1 の開発時に各プラグインのコードで確認したもの（版は表のとおり）。",
          },
          after: [
            "つまり、どの構成でも「ブログやサイトの説明」はある程度出ていて、「店や会社の事実」と「AI向けの入口（llms.txt・クローラの許可）」が抜けています。ここを埋めるのが、テーマを使ったサイトのAI検索対策の中心です。",
          ],
        },
        {
          heading: "テーマの構造化データだけでは足りない理由",
          paragraphs: [
            "「土曜も開いている近くの整骨院は？」「〇〇市でWordPressに強い制作会社は？」のような質問に答えるとき、AIが必要とするのは、業種・所在地・電話・営業時間・提供しているサービス・料金の目安といった事実です。テーマが出す Article や WebSite は「このページは誰がいつ書いた記事か」を説明するもので、これらの事実は入っていません。",
            "もちろん、ページの本文に住所や営業時間が書いてあればAIはそれを読めます。ただ、フッターやバナー画像の中に散らばっていると読み違えやすく、構造化データ・llms.txt で同じ事実をはっきり渡しておくと、本文とあわせて確かめられる材料が増えます。大事なのは、本文・構造化データ・Googleビジネスプロフィールで事実が食い違わないことです。",
          ],
        },
        {
          heading: "まず重複を確かめる：5分でできる手順",
          list: [
            "確かめるページを3種類決めます：トップページ、ふつうの投稿1本、FAQブロックを置いた固定ページ（あれば）。",
            `それぞれを[リッチリザルト テスト](${SRC.richTest})または[Schema Markup Validator](${SRC.validator})にかけ、検出された型（@type）を書き出します。`,
            "同じ型が2つ出ていないかを見ます。特に、事業者（Organization や LocalBusiness）が別々の @id で2つ、WebSite が2つ、Article と BlogPosting が別々に1つずつ、FAQPage が2つ、の4つに注意します。",
            "ブラウザでページのソースを開き「application/ld+json」で検索すると、出力の塊がいくつあるか、どれがテーマでどれがプラグインかを見分けやすくなります。",
            "重複があれば、どちらか一方を残すと決め、もう一方を止めます（次の章）。止めたら、同じ3ページでもう一度テストします。",
          ],
          after: [
            "重複そのものがすぐに大きな問題になるとは限りませんが、同じ会社が2社あるように見える、記事が2本あるように見える状態は、AIにも検索エンジンにも余計な判断をさせます。一度確かめておけば、テーマやプラグインを更新するまで同じ状態が続きます。",
          ],
        },
        {
          heading: "SWELL ＋ SEO SIMPLE PACK での整え方",
          paragraphs: [
            "いちばん多い組み合わせです。SEO SIMPLE PACK は meta と OGP のために残し、SWELL の構造化データも残したまま、足りない事実を足します。Nurevo AEO を使う場合の動きは次のとおりです（0.9.1）。",
          ],
          list: [
            "Nurevo AEO の設定で、業種（歯科・美容室など）、住所、電話、営業時間、メール、サービス、FAQを入力します。空欄は、SEOプラグインの設定やWordPressの設定から読める範囲で補われ、入力済みの値は上書きされません。",
            "SEO SIMPLE PACK が有効だと、Nurevo AEO はトップページを自分で読み込み（有効化時・保存時・プラグインの組み合わせが変わったとき・毎日）、他が出している型を記録します。SWELL の WebSite が見つかれば、自分の WebSite は出しません。",
            "SWELL の Organization に住所や電話がなければ、Nurevo AEO は同じ @id で事業者の情報を出し、1つの事業者として足し合わされるようにします（SWELL の Organization に @id がない場合は自分の @id を使います）。",
            "注意：この読み込みはトップページだけです。SWELL はトップに Article を出さないため、投稿ページでは SWELL の Article と Nurevo AEO の BlogPosting が両方出ることがあります。前の章の手順で投稿ページを確かめ、2つ出ていたらどちらかに寄せます。",
            "寄せ方の例：SWELL の Article を残す場合は、Nurevo AEO の開発者向けフィルター webmcp_canary_schema_graph で、core から BlogPosting と WebPage を外します。逆に Nurevo AEO に任せる場合は、SWELL設定 →「構造化データ」の「JSON-LDを自動生成する」をオフにできますが、SWELL の BreadcrumbList も止まる点に注意します（Nurevo AEO はパンくずを出しません）。",
            "FAQは1ページに1か所。SWELL のFAQブロックの構造化データは、共通のJSON-LDをオフにしても止まりません。同じページに Nurevo のFAQブロック（または [nurevo_faq]）を置くと FAQPage が2つになるので、どちらか一方にします。",
          ],
          after: [
            `SWELL の設定名と、FAQブロックが共通設定と別に動く点は、[解説記事（JSON-LDを止める方法）](${SRC.swellOff})の SWELL 2.19.0 での検証によるものです。SEOプラグインを何も入れずに SWELL だけで運用している場合、Nurevo AEO 0.9.1 は控える判断をせず自分の一式を出すため、WebSite などが重なりやすくなります。この場合も上の手順で確かめてください。`,
          ],
        },
        {
          heading: "Lightning ＋ VK ExUnit での整え方",
          paragraphs: [
            "Lightning では、構造化データは主に ExUnit が担当します。ExUnit の構造化データは「Structured data - WebSite」「Structured data - Article」の2つの機能で、ExUnit の有効化設定でそれぞれオン・オフできます。Nurevo AEO 0.9.1 は ExUnit に合わせて、次のように動きます。",
          ],
          list: [
            "ExUnit が WebSite や Article を出しているページでは、Nurevo AEO は自分の WebSite・記事のノードを出しません。",
            "ExUnit の Article には、足りない項目（事業者を指す publisher、説明文、言語）だけを ExUnit のフィルター（veu_article_structure_data）で足します。著者など ExUnit が設定した値は変えません。",
            "ExUnit は事業者のノードを出さないので、住所・電話・営業時間を持つ事業者の情報は Nurevo AEO の1つだけになります。",
            "ExUnit の構造化データをオフにしている場合は、Nurevo AEO が自分の WebSite・記事のノードを出します。",
            "Lightning のパンくずは microdata で、Nurevo AEO はパンくずを出さないため、ここは重なりません。",
          ],
          after: [
            `Lightning 本体は2026年9月9日の 15.42.0 まで更新が続いています（[変更履歴](${SRC.lightningLog})）。パンくずの表示位置の変更は Lightning G3 Pro Unit の機能です（[Lightning の特徴](${SRC.lightningFeatures})）。テーマや ExUnit を更新したあとは、重複の確認をもう一度行うと安心です。`,
          ],
        },
        {
          heading: "llms.txt と AIクローラの許可は、テーマとは別に用意する",
          paragraphs: [
            "この記事で確認した資料の範囲では、SWELL・Lightning・SEO SIMPLE PACK・ExUnit の機能として llms.txt の出力や、AI検索のクローラを名前で許可する設定は挙がっていません。テーマを替えても変わらない部分なので、プラグインか手作業で用意します。",
          ],
          table: {
            head: ["項目", "役割", "Nurevo AEO（無料）での扱い"],
            rows: [
              ["llms.txt", "サイトの概要と主なページの一覧を、AI向けにテキストでまとめたもの", "/llms.txt で配信。WordPressの内容からプラグイン内で作るため、サイトキーも通信も不要"],
              ["AI検索のクローラ", "ChatGPT・Claude・Perplexity が回答のためにページを読みに来るボット", "robots.txt で OAI-SearchBot・ChatGPT-User・Claude-SearchBot・Claude-User・PerplexityBot・Perplexity-User を許可。/wp-admin/ など既存のルールはそのまま"],
              ["AIの学習用クローラ", "AIモデルの学習のために集めるボット", "GPTBot・ClaudeBot・Google-Extended・Applebot-Extended・CCBot は既定で robots.txt に任せ、ワンクリックで許可・拒否を選べる。拒否してもAI検索やスコアには影響しない"],
            ],
            caption: "Nurevo AEO の内容は WordPress.org の readme（0.9.1）による。",
          },
          after: [
            `Nurevo AEO の詳しい仕様は[WordPress.org のプラグインページ](${SRC.readme})にあります。`,
            "robots.txt で許可していても、サーバーやCDNのボット対策の設定で止まっていることがあります。ホスティングの管理画面にボット対策の項目があれば、AI検索のクローラを止めていないかもあわせて確認します。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "トップ・投稿・FAQのある固定ページの3つで、事業者・WebSite・記事・FAQPage がそれぞれ1つずつになっている",
            "事業者の情報に、業種・住所・電話・営業時間が入っていて、本文・Googleビジネスプロフィールと同じ表記になっている",
            "FAQブロックは、SWELL か Nurevo のどちらか一方だけをページに置いている",
            "https://（自分のドメイン）/llms.txt が開き、主なページ（料金・サービス・会社情報・アクセス）が載っている",
            "robots.txt にAI検索のクローラの許可があり、学習用クローラの扱いを自分で決めている",
            "テーマ・SEO SIMPLE PACK・ExUnit を更新したら、3ページで重複の確認をやり直す",
          ],
        },
        {
          heading: "効果の確かめ方",
          paragraphs: [
            `設定直後は、まず[無料チェック](/check)で、構造化データ・llms.txt・AIクローラの許可が読める状態かを確かめます。Nurevo AEO をサイトとつないでいる場合、無料版とStandardでも月に1回、業種と地域から作った3つの質問を Perplexity に聞き、回答があなたの事業者名を挙げたか・サイトを出典にしたかを記録します（質問に事業者名は入れません）。Pro（月14,800円〜、ベータ）では、競合との比較と推移を測れます（現在は Perplexity。ChatGPT は設定され次第）。`,
            `AIの回答は同じ質問でも日によって変わるため、1回の結果で判断せず、同じ質問を続けて記録して傾向を見ます。測り方の詳細は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。`,
          ],
        },
      ],
      faqs: [
        { q: "SWELLを使っていれば、AI検索対策の構造化データは十分ですか？", a: "記事やサイトの説明（WebSite・Article・パンくずなど）は出ていますが、確認した範囲では住所・電話・営業時間を持つ事業者の情報、llms.txt、AIクローラの許可は含まれません。店舗や会社のサイトなら、これらを足すと AI が事実を確かめやすくなります。" },
        { q: "SEO SIMPLE PACK は構造化データを出しますか？", a: "出しません。meta タグ・OGP・認証コードなどを出すプラグインです（3.7.0 のコードで確認）。そのため SWELL と組み合わせた場合、構造化データは SWELL の出力が中心になります。" },
        { q: "SWELLのJSON-LDはオフにしたほうがいいですか？", a: "多くの場合は残して構いません。足りない事業者の情報だけを足し、投稿ページで Article が2つになっていないかを確かめれば十分です。オフにするとパンくずの構造化データも止まる点に注意してください。" },
        { q: "Lightning で Nurevo AEO を入れると、ExUnit と構造化データが重なりませんか？", a: "Nurevo AEO 0.9.1 は、ExUnit が WebSite・Article を出しているページでは自分の分を出さず、ExUnit の Article に足りない項目だけを足します。ExUnit は事業者のノードを出さないので、事業者の情報は1つになります。" },
        { q: "llms.txt を置けば ChatGPT に出るようになりますか？", a: "表示が保証されるものではありません。llms.txt はサイトの要点をAIが読みやすい形で渡す補助です。本文・構造化データ・Googleビジネスプロフィールの事実をそろえることとあわせて行います。" },
        { q: "テーマを SWELL から Lightning に変えたら、やり直すことはありますか？", a: "あります。テーマごとに出す構造化データが違うので、変更後にトップ・投稿・FAQのある固定ページの3つで重複の確認をやり直してください。llms.txt と robots.txt の設定はテーマに依存しないため、プラグインで出していればそのまま残ります。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトを読めるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AI検索のクローラの許可の状態がわかります。SWELL・Lightning のサイトなら、Nurevo AEO で足りない事実を無料で足せます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを無料で入れてみる", href: WP_ORG },
      },
      footnote: "SWELL、Lightning、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPress、Google、ChatGPT、Claude、Perplexityおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "AI Search for SWELL and Lightning WordPress Sites | Nurevo",
      description: "What SWELL, Lightning, SEO SIMPLE PACK and VK ExUnit already publish, how to check for duplicate schema, and how to add business facts, llms.txt and AI crawler rules.",
      h1: "AI search optimization for SWELL and Lightning sites: keep the theme's structured data, add the missing facts, avoid duplicates",
      lead: "SWELL and Lightning (with VK All in One Expansion Unit) publish structured data that describes the site and its articles, such as WebSite and Article. In what we checked, they do not publish the address, telephone, opening hours and services an AI uses to describe a business, nor llms.txt, nor rules that let AI search crawlers in. SEO SIMPLE PACK publishes no structured data at all. The working method is to keep the theme's output, add only the missing facts as part of the same business, and then check each page type once for duplicates.",
      intro: [
        "Written November 11, 2026 (JST). What SWELL publishes is taken from a Japanese write-up that tested SWELL 2.19.0 on September 30, 2026 (linked below). SWELL's own site could not be read for this guide, and the output can differ between theme versions, so use the checks later in this guide on your own site.",
        "No setting guarantees that ChatGPT, Perplexity or Google's AI will mention you, or at what position. AI answers change from day to day. The goal here is narrower: make sure AI reads your facts correctly.",
      ],
      sections: [
        {
          heading: "What each setup publishes today",
          paragraphs: [
            "SWELL and Lightning are two of the most used WordPress themes in Japan, usually paired with SEO SIMPLE PACK or VK All in One Expansion Unit (ExUnit). Here is what each common setup publishes as structured data. Find your setup in the left column.",
          ],
          table: {
            head: ["Setup", "Structured data it publishes", "What AI is missing"],
            rows: [
              ["SWELL (2.19.0)", `Front page: WebSite and Organization. Posts and pages: WebSite, WebPage, Article and Organization. Category and other archives: CollectionPage. BreadcrumbList wherever there is a breadcrumb. The FAQ block adds FAQPage when its output setting is on ([test write-up](${SRC.swellTypes}), in Japanese)`, "The Organization carries the name, URL, logo and social links, but no address, telephone or opening hours. No llms.txt and no AI crawler rules"],
              ["SEO SIMPLE PACK (3.7.0)", "None. It prints meta tags, OGP tags and verification codes, not JSON-LD", "All structured data beyond what the theme prints"],
              ["Lightning + VK ExUnit (9.123.1)", `ExUnit prints WebSite on the front page and Article on single posts. Lightning's breadcrumb carries structured data inside the HTML (microdata) ([Lightning changelog](${SRC.lightningLog}), in Japanese)`, "Business facts (ExUnit publishes no business node), FAQ, llms.txt, AI crawler rules"],
              ["Lightning (ExUnit structured data off)", "Only the breadcrumb microdata", "All of the above, plus WebSite and Article"],
            ],
            caption: "The SEO SIMPLE PACK and ExUnit rows were checked in each plugin's code while building Nurevo AEO 0.9.1 (versions as shown).",
          },
          after: [
            "In every setup, the site and its articles are already described to some degree. What is missing is the facts about the business and the entry points made for AI (llms.txt and crawler access). Filling those two gaps is most of the work on a themed site.",
          ],
        },
        {
          heading: "Why the theme's structured data is not enough",
          paragraphs: [
            "To answer \"which osteopath near me is open on Saturday?\" or \"which web agency in Osaka is good with WordPress?\", an AI needs facts: the kind of business, where it is, the telephone number, the opening hours, the services and a rough idea of price. A theme's Article and WebSite nodes describe something else: who wrote this page and when. They contain none of those facts.",
            "An AI can of course read an address or opening hours from the page text. But facts spread across a footer, a banner image and a contact page are easy to misread. Stating the same facts plainly in structured data and in llms.txt gives the AI more material to cross-check against the page. What matters most is that the page text, the structured data and your Google Business Profile all say the same thing.",
          ],
        },
        {
          heading: "First, check for duplicates: a five-minute test",
          list: [
            "Pick three pages: the front page, an ordinary blog post, and a page that has an FAQ block (if you have one).",
            `Run each one through Google's [Rich Results Test](${SRC.richTest}) or the [Schema Markup Validator](${SRC.validator}) and write down the types (@type) it finds.`,
            "Look for any type that appears twice. Watch four cases in particular: two business nodes (Organization or LocalBusiness) under different @id values, two WebSite nodes, an Article plus a separate BlogPosting, and two FAQPage nodes.",
            "Open the page source in your browser and search for \"application/ld+json\". This shows how many blocks there are and helps you tell which come from the theme and which from a plugin.",
            "Where there is a duplicate, decide which one to keep and switch off the other (next section). Then test the same three pages again.",
          ],
          after: [
            "A duplicate is not always an immediate problem. But a page that seems to describe two companies, or two articles, makes AI systems and search engines do extra guessing. Once you have checked, the result holds until you update the theme or a plugin.",
          ],
        },
        {
          heading: "SWELL with SEO SIMPLE PACK",
          paragraphs: [
            "This is the most common pairing. Keep SEO SIMPLE PACK for meta and OGP tags, keep SWELL's structured data, and add what is missing. With Nurevo AEO (version 0.9.1) it works like this:",
          ],
          list: [
            "In Nurevo AEO's settings, enter the business type (dentist, hair salon and so on), address, telephone, opening hours, email, services and FAQ. Blank fields are filled where your SEO plugin or WordPress settings already hold the value. Values you typed are never overwritten.",
            "With SEO SIMPLE PACK active, Nurevo AEO reads your own front page (on activation, when settings are saved, when the set of plugins changes, and daily) and records which types other code already publishes. If it sees SWELL's WebSite, it leaves its own WebSite out.",
            "If SWELL's Organization has no address or telephone, Nurevo AEO publishes the business facts under the same @id, so the two are read as one business. If SWELL's Organization has no @id, Nurevo AEO uses its own.",
            "Watch out: that check reads only the front page. SWELL prints no Article there, so on blog posts you may see both SWELL's Article and Nurevo AEO's BlogPosting. Test a post with the steps above and, if both appear, keep one.",
            "How to keep one: to keep SWELL's Article, remove the BlogPosting and WebPage nodes from core with Nurevo AEO's developer filter webmcp_canary_schema_graph. To hand everything to Nurevo AEO instead, turn off \"JSON-LDを自動生成する\" (generate JSON-LD automatically) under SWELL settings > 構造化データ (structured data). Note that this also stops SWELL's BreadcrumbList, and Nurevo AEO does not publish breadcrumbs.",
            "Use one FAQ source per page. The structured data from SWELL's FAQ block is not stopped by the general JSON-LD switch. If you also place the Nurevo FAQ block (or [nurevo_faq]) on the same page, there will be two FAQPage nodes, so choose one.",
          ],
          after: [
            `The SWELL setting name, and the fact that the FAQ block runs separately from it, come from [a write-up on turning off SWELL's JSON-LD](${SRC.swellOff}) (in Japanese), tested on SWELL 2.19.0. If you run SWELL with no SEO plugin at all, Nurevo AEO 0.9.1 does not stand down for anything and publishes its full set, so WebSite and similar nodes are more likely to overlap. Run the same check in that case too.`,
          ],
        },
        {
          heading: "Lightning with VK ExUnit",
          paragraphs: [
            "On Lightning, structured data is mostly ExUnit's job. It comes from two ExUnit functions, \"Structured data - WebSite\" and \"Structured data - Article\", each of which can be switched on or off in ExUnit's activation settings. Nurevo AEO 0.9.1 adapts to ExUnit as follows:",
          ],
          list: [
            "On pages where ExUnit prints its WebSite or Article, Nurevo AEO leaves its own WebSite and article nodes out.",
            "ExUnit's Article gets only what it lacks (a publisher pointing at your business, the description and the language), through ExUnit's veu_article_structure_data filter. Nothing ExUnit sets, the author included, is changed.",
            "ExUnit publishes no business node, so the one with your address, telephone and opening hours comes only from Nurevo AEO.",
            "If ExUnit's structured data is turned off, Nurevo AEO publishes its own WebSite and article nodes instead.",
            "Lightning's breadcrumb uses microdata and Nurevo AEO publishes no breadcrumbs, so there is no overlap there.",
          ],
          after: [
            `Lightning itself is still being updated; version 15.42.0 shipped on September 9, 2026 ([changelog](${SRC.lightningLog})). Moving the breadcrumb is a Lightning G3 Pro Unit feature, not part of the free theme ([Lightning features](${SRC.lightningFeatures})). After updating the theme or ExUnit, run the duplicate check again.`,
          ],
        },
        {
          heading: "llms.txt and AI crawler rules are separate from the theme",
          paragraphs: [
            "In the material checked for this guide, none of SWELL, Lightning, SEO SIMPLE PACK or ExUnit lists llms.txt output or a setting that allows AI search crawlers by name. This part does not change when you change theme, so set it up with a plugin or by hand.",
          ],
          table: {
            head: ["Item", "What it does", "In Nurevo AEO (free)"],
            rows: [
              ["llms.txt", "A plain-text summary of your site and its main pages, written for AI", "Served at /llms.txt. Built inside the plugin from your WordPress content, with no site key and no network access needed"],
              ["AI search crawlers", "The bots ChatGPT, Claude and Perplexity send to read pages for their answers", "robots.txt allows OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User. Existing rules such as /wp-admin/ still apply"],
              ["AI training crawlers", "Bots that collect content to train AI models", "GPTBot, ClaudeBot, Google-Extended, Applebot-Extended and CCBot are left to your robots.txt by default, with a one-click allow or block. Blocking them does not affect AI search or your score"],
            ],
            caption: "Nurevo AEO details from its WordPress.org readme (0.9.1).",
          },
          after: [
            `The full details are on [Nurevo AEO's WordPress.org page](${SRC.readme}).`,
            "Even when robots.txt allows a crawler, a bot-protection setting at your host or CDN can still block it. If your hosting control panel has bot protection, check that it is not stopping the AI search crawlers.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "On the front page, a post and a page with an FAQ, there is exactly one business node, one WebSite, one article node and at most one FAQPage",
            "The business node has the business type, address, telephone and opening hours, written the same way as on the page and in your Google Business Profile",
            "Each page uses either SWELL's FAQ block or Nurevo's, never both",
            "https://(your domain)/llms.txt opens and lists your main pages: pricing, services, company information and directions",
            "robots.txt allows the AI search crawlers, and you have decided yourself what to do with the training crawlers",
            "After updating the theme, SEO SIMPLE PACK or ExUnit, you repeat the three-page duplicate check",
          ],
        },
        {
          heading: "How to check that it worked",
          paragraphs: [
            `Right after setup, use the [free check](/check) to confirm that your structured data, llms.txt and crawler access can be read. When Nurevo AEO is connected to your site, the Free and Standard plans also ask Perplexity three questions once a month, built from your business type and area (never your business name), and record whether the answers named your business or cited your site. Pro (from USD 99 a month, beta) measures how often you appear, with competitor comparison and history. It currently runs on Perplexity, with ChatGPT to follow once it is configured.`,
            `AI answers to the same question vary from day to day, so do not judge from a single result. Ask the same questions over time and look at the trend. The method is explained in [how to measure AI visibility](/guide/measure-ai-visibility).`,
          ],
        },
      ],
      faqs: [
        { q: "If I use SWELL, is my structured data enough for AI search?", a: "SWELL describes your site and articles (WebSite, Article, breadcrumbs and so on). In what we checked, it does not include a business node with address, telephone and opening hours, llms.txt or AI crawler rules. For a shop or company site, adding those makes your facts easier for AI to confirm." },
        { q: "Does SEO SIMPLE PACK output structured data?", a: "No. It prints meta tags, OGP tags and verification codes (checked in version 3.7.0's code). Paired with SWELL, your structured data therefore comes mainly from SWELL." },
        { q: "Should I turn off SWELL's JSON-LD?", a: "Usually there is no need. Add the missing business facts and check that blog posts do not end up with two article nodes. If you do turn it off, remember that SWELL's breadcrumb structured data stops too." },
        { q: "Will Nurevo AEO duplicate ExUnit's structured data on Lightning?", a: "Nurevo AEO 0.9.1 leaves out its own WebSite and article nodes on pages where ExUnit prints them, and adds only what ExUnit's Article lacks. ExUnit publishes no business node, so there is a single business node." },
        { q: "Will adding llms.txt get me into ChatGPT's answers?", a: "Nothing guarantees that. llms.txt is a helper that hands AI a readable summary of your site. Use it together with consistent facts in your page text, structured data and Google Business Profile." },
        { q: "If I switch from SWELL to Lightning, what do I need to redo?", a: "The duplicate check. Each theme publishes different structured data, so test the front page, a post and a page with an FAQ again after switching. llms.txt and robots.txt do not depend on the theme, so if a plugin serves them they carry over." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your site",
        body: "The free check needs no sign-up and shows the state of your structured data, llms.txt and AI crawler access. On a SWELL or Lightning site, Nurevo AEO adds the missing facts for free.",
        label: "Check your AI readability free",
        href: "/check",
        secondary: { label: "Try Nurevo AEO free on WordPress.org", href: WP_ORG },
      },
      footnote: "SWELL, Lightning, SEO SIMPLE PACK, VK All in One Expansion Unit, WordPress, Google, ChatGPT, Claude, Perplexity and their product names are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
