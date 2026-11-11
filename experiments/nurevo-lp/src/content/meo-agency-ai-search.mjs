// Content page: AI search (AEO) for MEO / local SEO companies that manage
// Google Business Profiles for local businesses. Agency page.
//
// Written 2026-11-11 17:00 (JST). Every claim about Nurevo AEO is one the
// plugin's readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt):
// setup wizard (kind of business, name, address, phone, opening hours,
// description), server-rendered JSON-LD, llms.txt built locally, AI search
// crawler rules (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User,
// PerplexityBot, Perplexity-User), coexistence with Yoast SEO, Rank Math,
// AIOSEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit (0.9.1),
// the monthly free AI check (three questions built from business type and
// area, never the business name, asked to Perplexity; shows whether the
// business was named or the site cited, and who appeared instead). Pro
// measurement runs on Perplexity (docs/pro-measurement-implementation.md).
// Partner terms are from public/partner/index.html (referral partners only,
// 40% net of Stripe fees, approval required, payouts to partners in Japan).
// The plugin does not take a Business Profile URL or publish sameAs from the
// admin screen, so the copy does not say it does.
//
// Outside facts. The official Google / OpenAI / CAA pages refused the fetch
// in this run (permission request not answered), so the copy only uses facts
// already checked on those pages for earlier guides, with those dates:
// - Google "AI features and your website" (checked 2026-11-01): no extra
//   requirements or special schema.org markup for AI Overviews / AI Mode;
//   SEO basics apply, incl. structured data matching visible text and keeping
//   Business Profile information up to date.
// - Google LocalBusiness structured data (checked 2026-10-29): name + address
//   required; openingHoursSpecification, telephone, url recommended.
// - OpenAI crawlers (checked 2026-10-31): sites that opt out of OAI-SearchBot
//   are not shown in ChatGPT search answers.
// - Google Search Central blog 2019-09-16: self-serving reviews aren't
//   eligible for LocalBusiness / Organization review snippets.
// - Consumer Affairs Agency: stealth marketing regulated from 2023-10-01.
// Studies read in this run (2026-11-11):
// - BrightLocal, "AI Search Makes Local Listings More Important Than Ever"
//   (published 2025-07-22, updated 2025-10-24): 20 searches across 10
//   niches on Google AI Mode, Gemini, Perplexity and ChatGPT Search; Yelp a
//   source in 33% of searches; AI Mode relied on Business Profile as a primary
//   source; business websites the vast majority of sources in their sample.
// - Insites, "What AI uses to choose local businesses and what it ignores"
//   (2026-05-05): 10,000 businesses on ChatGPT and Perplexity; 93% known by at
//   least one AI platform, 55% had accurate information; Local Pack businesses
//   recommended 3.5x more often; structured data and llms.txt showed no
//   meaningful correlation. Correlation study, query set not published.
// - innovatopia (2026-08-04) on GMO TECH "Local GEO Dash! byGMO" (launched
//   2026-08-03): GBP-centred consulting for getting store info cited by
//   ChatGPT / Gemini. Used only as a sign that MEO companies are adding this.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  reviews2019: "https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
  brightlocal: "https://www.brightlocal.com/blog/ai-search-using-listings-sources/",
  insites: "https://insites.com/blog/what-ai-uses-to-choose-local-businesses-and-what-it-ignores/",
  gmoNews: "https://innovatopia.jp/ai/ai-news/115001/",
};

export default {
  slug: "meo-agency-ai-search",
  targetQueries: [
    "local SEO agency AI search optimization",
    "Google Business Profile AI search ChatGPT",
    "how to add AI visibility to local SEO services",
    "MEO会社 AI検索対策",
    "MEO LLMO 対策 違い",
    "MEO AIO対策 サービス",
  ],
  related: ["agency-aeo-monthly-service", "local-business-schema-seo-plugins", "measure-ai-visibility", "search-console-ai-features"],
  locales: {
    ja: {
      title: "MEO会社のAI検索対策：ビジネスプロフィールとサイトの事実をそろえる | Nurevo",
      description: "MEO会社がAI検索対策を始めるなら、Googleビジネスプロフィールと店舗サイト・ポータルの事実を1つの台帳でそろえ、サイト側の構造化データと計測を足すのが近道。作業表・契約・測り方を解説。",
      h1: "MEO会社のAI検索対策：Googleビジネスプロフィールとサイトの事実をそろえ、MEOの契約に足す手順",
      lead: "MEO会社がAI検索対策（AEO・LLMO・GEO）を始めるときの近道は、新しい施策を増やすことではなく、いま管理しているGoogleビジネスプロフィール（GBP）の事実を「店舗サイト」「主要ポータル」とそろえ、サイト側に構造化データ・llms.txt・AIクローラの許可を足すことです。ChatGPTやPerplexityはGBPだけでなく、店舗サイトや口コミサイトも読んで答えるため、GBPの外に事実の食い違いがあると、AIは古い情報や他社を答えます。",
      intro: [
        "作成日：2026年11月11日（JST）。外部の調査は同日に読んだもの、Google・OpenAI・消費者庁の情報は本文に記した日に各公式ページで確認したものです（今回は公式ページを再取得できなかったため、以前の確認日を書いています）。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが店舗の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "MEOとAI検索対策は、どこが同じでどこが違うか",
          paragraphs: [
            "MEO（マップ検索の最適化）は、Googleマップとローカル検索での見え方を、主にGBPの運用で良くする仕事です。AI検索対策は、ChatGPT・Perplexity・GoogleのAI Overviews／AI Modeなどが「◯◯駅の近くで土曜も開いている歯医者は？」と聞かれたときに、店舗の事実を正しく読める状態をつくる仕事です。どちらも「店舗の事実を正確に、新しく保つ」点は同じで、MEO会社がすでに持っている作業手順の多くがそのまま使えます。",
            "違いは、読まれる場所の広さです。BrightLocalがGoogle AI Mode・Gemini・Perplexity・ChatGPT Searchで10業種・20通りの検索を調べた結果では、AI ModeはGBPを主な情報源にしていた一方、どのAIでも出典の大半は店舗のWebサイトで、Yelpなどのポータルも検索の33%で使われていました（[BrightLocal、2025年7月公開・10月更新](" + SRC.brightlocal + ")。小さな標本で日本の調査ではありません）。GBPが完璧でも、店舗サイトの営業時間が古い、ポータルの電話番号が違う、という状態ならAIはそちらを読みます。",
            "Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別な構造化データはなく、構造化データを見える文章と一致させる、ビジネスプロフィールの情報を最新に保つ、といった通常の基本が大切だとしています（2026年11月1日確認）。[Google：AI features and your website](" + SRC.googleAi + ")。MEOで培った「正しい情報を最新に保つ」作業は、AI検索でもそのまま土台になります。",
          ],
          table: {
            head: ["観点", "MEO（これまで）", "AI検索対策（足す部分）"],
            rows: [
              ["主な場所", "Googleビジネスプロフィール、Googleマップ", "GBPに加えて店舗サイト、主要ポータル・口コミサイト"],
              ["見られ方", "マップの表示順位、ローカルパック", "AIの回答で店名が出るか、サイトが出典になるか"],
              ["作業の中心", "カテゴリ・営業時間・写真・投稿・口コミ返信", "サイト本文と構造化データ、llms.txt、AIクローラの許可、各所の事実の一致"],
              ["測り方", "順位計測、GBPのインサイト", "決めた質問をAIに定期的に聞いて記録、Search Consoleの生成AIレポート"],
              ["約束できること", "作業内容と報告", "作業内容と報告（表示や順位は約束しない）"],
            ],
          },
        },
        {
          heading: "最初にやること：店舗ごとの「事実の台帳」をつくる",
          paragraphs: [
            "AI検索対策で一番効くのに見落とされがちなのが、同じ事実がすべての場所で同じ値になっているかの確認です。Insitesが1万の店舗・事業者をChatGPTとPerplexityで調べた調査では、93%は少なくとも1つのAIに知られていた一方、正しい情報で答えられていたのは55%でした（[Insites、2026年5月](" + SRC.insites + ")。質問の作り方は公開されていない相関の調査です）。「AIに知られているが、間違って伝わっている」状態を直すのは、MEO会社が得意な仕事です。",
            "おすすめは、契約店舗ごとに1枚の台帳（スプレッドシートで十分）をつくり、正しい値を1か所に決めることです。そのうえで、各掲載先を台帳に合わせます。",
          ],
          table: {
            head: ["項目", "台帳に書く正しい値", "そろえる場所"],
            rows: [
              ["店名", "看板と同じ正式表記（支店名の付け方も統一）", "GBP、サイトのヘッダー・会社概要、構造化データのname、ポータル"],
              ["住所", "番地・建物名・階まで", "GBP、サイトのアクセスページ、構造化データのaddress、ポータル"],
              ["電話番号", "代表番号を1つ（計測用の番号を使うならその扱いも決める）", "GBP、サイト本文、構造化データのtelephone、ポータル"],
              ["営業時間・定休日", "曜日ごとの時間、祝日・年末年始・臨時休業の扱い", "GBP（特別営業時間）、サイト本文、構造化データ、llms.txt"],
              ["業種・扱うサービス", "何の店か、主なメニュー・施術・取扱いを短く", "GBPのカテゴリ・サービス、サイトのサービスページ、構造化データの種類"],
              ["予約・問い合わせ", "予約ページのURL、電話受付の時間", "GBPの予約リンク、サイト、構造化データ"],
            ],
          },
          after: [
            "台帳には「最後に確認した日」の列も付けます。営業時間が変わったときに、GBPだけ直してサイトとポータルが古いまま、という事故を防げます。",
          ],
        },
        {
          heading: "サイト側に足す3つ：構造化データ・llms.txt・AIクローラの許可",
          paragraphs: [
            "MEO会社が店舗サイトの制作や保守まで持っていない場合でも、次の3つは短時間で入れられ、MEOの月額に足しやすい作業です。",
          ],
          list: [
            "構造化データ（schema.orgのJSON-LD）：店舗をLocalBusiness、またはDentist・HairSalon・Restaurantなどのより具体的な種類で表し、台帳と同じ店名・住所・電話・営業時間を出します。Googleのローカルビジネスの構造化データでは、nameとaddressが必須、openingHoursSpecification・telephone・urlなどが推奨です（2026年10月29日確認）。[Google：ローカルビジネスの構造化データ](" + SRC.googleLocal + ")",
            "llms.txt：サイトの要点（何の店か、どこにあるか、主なページ）を、AIが読みやすいテキストで /llms.txt に置きます。効果を示す確かなデータはまだないため、「入れれば出る」ではなく、読みやすさを整える作業の1つとして扱います。[llms.txtの書き方](/guide/llms-txt)",
            "AIクローラの許可：robots.txtでAI検索のクローラを止めていないか確認します。OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索の回答に表示されないとしています（2026年10月31日確認）。[OpenAI：クローラの説明](" + SRC.openaiBots + ")",
          ],
          after: [
            "公平のために書くと、Insitesの調査では構造化データやllms.txtとAIでの見え方に、はっきりした相関は見られませんでした。一方で、ローカルパックに出ている店舗は3.5倍多くAIに推薦されていました（[Insites](" + SRC.insites + ")）。つまり、構造化データは「それだけで順位を上げる施策」ではなく、台帳の事実を機械が読める形で出し、食い違いをなくすための部品と考えるのが現実的です。MEOの本業（GBPの充実、口コミ、ローカルパック）は、AI検索でも引き続き大事です。",
          ],
        },
        {
          heading: "WordPressの店舗サイトでの手順（Nurevo AEOを使う場合）",
          list: [
            "[WordPress.orgからNurevo AEO（無料）](" + WP_ORG + ")を入れて有効化すると、初期設定が開きます。業種（ローカルビジネス）、店名・住所・電話・営業時間・説明を、台帳の値どおりに入れます。営業時間は、公開される形で読み上げて確認できます。",
            "構造化データ（JSON-LD）・llms.txt・AIクローラの許可（OAI-SearchBot、ChatGPT-User、Claude-SearchBot、Claude-User、PerplexityBot、Perplexity-User）が、サーバー側で出力されます。JavaScriptを実行しないクローラにも読めます。",
            "すでにYoast SEO・Rank Math・All in One SEO・Slim SEOを使っているサイトでは、足りない部分だけを足し、置き換えません。0.9.1からはSEO SIMPLE PACKとVK All in One Expansion Unitとも併用でき、構造化データが二重になりません。",
            "管理画面の診断で足りない項目を確認し、ワンクリックの修正で埋めます。最後に[無料のAI可読性チェック](/check)で、外からどう読めるかを見ます。",
            "WordPress以外のサイトは、構造化データとllms.txtを手で置くか、店舗サイトの制作会社に依頼します。サイトのない店舗は、まずサイト（1ページでも）をつくる提案から始めます。",
          ],
          after: [
            "テーマ・SEOプラグインごとの構造化データの重なり方は[店舗の構造化データとSEOプラグイン](/guide/local-business-schema-seo-plugins)にまとめています。",
          ],
        },
        {
          heading: "口コミの扱い：MEOのやり方をそのままAIに持ち込まない",
          paragraphs: [
            "口コミはAIが店舗を選ぶときの強い材料です。Insitesの調査では、ChatGPTとPerplexityの両方で見つかった事業者の平均Google口コミ数は133件、どちらにも出なかった事業者は11件でした（[Insites](" + SRC.insites + ")、相関の調査）。ただし、口コミを増やす方法には法律と規約の線があります。",
            "日本では2023年10月1日から、広告であることを隠したステルスマーケティングが景品表示法の不当表示として規制されています（2026年11月1日確認）。[消費者庁：ステルスマーケティング](" + SRC.caaStealth + ")。特典と引き換えの投稿依頼、関係者による投稿、良い評価だけを集める誘導は、ステマ規制やGoogleの規約の面から避け、来店客に自由な感想を頼む形にします。また、サイトに載せた自店の口コミを自分で構造化データにしても、GoogleはLocalBusinessとOrganizationの自己言及的なレビューをレビューのリッチリザルトの対象外にしています（[Google検索セントラル、2019年9月16日](" + SRC.reviews2019 + ")）。",
          ],
        },
        {
          heading: "測り方：順位レポートに「AIでの見え方」を1枚足す",
          paragraphs: [
            "MEOの順位レポートに、AIでの見え方を足します。やり方は、店舗の見込み客が聞きそうな質問（業種＋地域＋条件。例：「◯◯市で日曜に診てくれる歯医者」）を数個に決め、毎月同じ条件でAIに聞き、店名が出たか・サイトが出典になったか・代わりに出た店はどこかを記録することです。1回の結果では判断せず、同じ質問の推移で見ます。[AIでの登場率の測り方](/guide/measure-ai-visibility)",
            "Google側は、Search Consoleの生成AIパフォーマンスレポートで、AIによる概要・AIモードでの表示回数を見られます。[Search ConsoleでAIの表示を見る方法](/guide/search-console-ai-features)。サイトへのAIからの流入は、アクセス解析で参照元（chatgpt.com、perplexity.ai など）を分けて見ます。",
            "Nurevo AEOを接続したサイトでは、毎月1回、業種と地域から作った3つの質問（店名は含めません）をNurevoのサービスがPerplexityに聞き、店名が出たか・サイトが引用されたか・代わりに誰が出たかを管理画面に表示します（Free・Standard）。継続的な計測はPro（月14,800円〜、現在はPerplexity）です。専用の計測ツールは、より多くのAIと質問を追えるので、店舗数が多い場合は併用も選択肢です。[AEOツールの比較](/guide/aeo-tools-comparison)",
          ],
        },
        {
          heading: "MEOの契約に足すときのメニュー例",
          table: {
            head: ["区分", "作業", "頻度", "納品物"],
            rows: [
              ["初回", "事実の台帳づくり、GBP・サイト・主要ポータルの食い違いの洗い出しと修正、サイトへの構造化データ・llms.txt・AIクローラ許可の設置", "1回", "台帳、修正前後の一覧、AI可読性チェックの結果"],
              ["毎月", "営業時間・休業日・メニュー変更をすべての掲載先に反映、台帳の確認日を更新", "毎月", "変更記録"],
              ["毎月", "決めた質問でAIでの見え方を記録、前月との比較", "毎月", "MEOレポートに1ページ追加"],
              ["随時", "新しいサービス・店舗の追加、ポータルの掲載内容の見直し", "必要時", "作業報告"],
            ],
          },
          after: [
            "契約書と提案書では「AIに必ず表示」「AIで1位」は約束せず、作業内容と報告の中身を約束します。MEO会社がこの分野に乗り出す動きはすでにあり、GMO TECHは2026年8月3日に、GBPを軸に店舗情報をChatGPTやGeminiの回答に引用されやすくするサービスを始めています（[innovatopiaの記事、2026年8月4日](" + SRC.gmoNews + ")）。月額の設計は[制作会社がAI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)をご覧ください。",
            "Nurevoには制作会社・MEO会社向けのパートナープログラムがあります。お客様はご自身でNurevoのプランを持ち、御社は自社の作業料をいただく形です。社名・ロゴ入りの月次レポート、複数サイトの一括管理があり、紹介したお客様の月額の40%（Stripe手数料控除後）を紹介報酬としてお支払いします（承認制・国内の事業者が対象）。[パートナープログラム](https://nurevo.jp/partner/)",
          ],
        },
        {
          heading: "MEO会社向けチェックリスト",
          list: [
            "契約店舗ごとに、店名・住所・電話・営業時間・業種・予約URLの台帳があり、確認日が入っている。",
            "GBP・店舗サイト・主要ポータルの値が台帳と一致している。",
            "店舗サイトの本文に、営業時間・住所・電話が画像ではなく文字で書かれている。",
            "構造化データの種類が業種に合っていて（LocalBusinessまたはより具体的な種類）、値が本文と一致している。",
            "robots.txtでOAI-SearchBotやPerplexityBotなどAI検索のクローラを止めていない。",
            "llms.txtがあり、主なページと店舗の要点が書かれている。",
            "口コミの依頼は特典なし・選別なしで、ステマ規制とGoogleの規約に沿っている。",
            "AIに聞く質問を決め、毎月同じ条件で記録している。",
            "契約書で表示・順位を保証していない。",
          ],
        },
      ],
      faqs: [
        { q: "MEO対策をしていれば、AI検索対策は不要ですか？", a: "土台は共通ですが、それだけでは足りないことがあります。AIはGBPだけでなく店舗サイトやポータルも読むため、GBPの外の情報が古いとAIはそちらを答えます。事実をすべての場所でそろえ、サイト側に構造化データとllms.txtを足すのが追加の作業です。" },
        { q: "MEOとLLMO・GEO・AIOは何が違いますか？", a: "MEOはGoogleマップとローカル検索での見え方の最適化、LLMO・GEO・AIO・AEOはChatGPTなどのAIの回答で正しく取り上げられるための最適化を指す呼び方です。呼び方の違いは[AEO・GEO・SEOの違い](/guide/aeo-vs-seo-vs-geo)で整理しています。" },
        { q: "店舗サイトを持っていないお客様はどうすればいいですか？", a: "AIの出典の多くは店舗のWebサイトなので、1ページでもよいので店舗の事実を文字で書いたサイトをつくる提案から始めるのがおすすめです。" },
        { q: "成果はどれくらいで出ますか？", a: "決まった期間は言えません。AIの回答は日や聞き方によって変わり、反映の時期もAIごとに違います。毎月同じ質問で記録し、推移で判断します。" },
        { q: "Nurevoの料金は？", a: `WordPressプラグインと診断・構造化データ・llms.txt・AIクローラ設定は無料（Free 0円）です。採点基準の自動更新はStandard（月3,000円）、継続的なAIでの登場率の計測はPro（月14,800円〜、現在はPerplexity）です。[WordPress.org](${WP_ORG})` },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、担当店舗のサイトがAIにどう読まれているかを確認",
        body: "無料のチェックで、構造化データ・llms.txt・AIクローラの許可の状態が登録なしでわかります。提案前の初回診断にもお使いください。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPressプラグインを無料で入れてみる", href: WP_ORG },
      },
      footnote: "Google、Googleビジネスプロフィール、Googleマップ、ChatGPT、OpenAI、Perplexity、Gemini、Yelp、WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、BrightLocal、Insites、GMO TECHおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携していません。",
    },
    en: {
      title: "AI Search for Local SEO Agencies: Align Profile and Site Facts",
      description: "How a local SEO agency can add AI search optimization: one fact sheet per location, matching listings, schema and llms.txt on the site, and a simple way to measure.",
      h1: "AI search for local SEO agencies: align Business Profile and website facts, then add it to your contract",
      lead: "The fastest way for a local SEO agency to add AI search optimization (AEO, also called GEO or LLMO) is not a new set of tactics. It is making the Google Business Profile facts you already manage match the client's website and main directory listings, then adding structured data, llms.txt and AI crawler access on the website. ChatGPT and Perplexity read the website and review sites as well as the Business Profile, so when the facts disagree outside the profile, AI can repeat the old ones or name someone else.",
      intro: [
        "Written November 11, 2026 (JST). The outside studies were read that day; the Google, OpenAI and Japanese Consumer Affairs Agency information was checked on their official pages on the dates given in the text (the official pages could not be fetched again for this update, so the earlier check dates are shown).",
        "AI answers change by day and by how the question is asked. The steps here make a business's facts readable for AI. They do not guarantee that a business appears in an AI answer or ranks higher.",
      ],
      sections: [
        {
          heading: "What local SEO and AI search optimization share, and where they differ",
          paragraphs: [
            "Local SEO (called MEO in Japan) improves how a business shows up in Google Maps and local results, mostly by managing its Google Business Profile. AI search optimization makes sure ChatGPT, Perplexity and Google's AI Overviews and AI Mode can read the business's facts correctly when someone asks, say, \"which dentist near the station is open on Saturday?\" Both come down to keeping a business's facts accurate and current, so most of an agency's existing routines carry over.",
            "The difference is how many places get read. BrightLocal ran 20 searches across 10 industries on Google AI Mode, Gemini, Perplexity and ChatGPT Search. AI Mode used the Business Profile as a primary source, but across every tool most sources were business websites, and directories such as Yelp were used in 33% of searches ([BrightLocal, published July 2025, updated October 2025](" + SRC.brightlocal + "); a small US sample). A perfect profile does not help much if the website still shows last year's hours or a directory lists the wrong phone number: AI reads those too.",
            "Google says there are no additional requirements and no special schema.org markup needed to appear in AI Overviews or AI Mode, and that the usual basics still matter, such as structured data that matches the visible text and an up-to-date Business Profile (checked November 1, 2026). [Google: AI features and your website](" + SRC.googleAi + "). The habit of keeping facts right that local SEO teams already have is the foundation for AI search as well.",
          ],
          table: {
            head: ["Aspect", "Local SEO (today)", "AI search (what you add)"],
            rows: [
              ["Main surfaces", "Google Business Profile, Google Maps", "The profile plus the website, main directories and review sites"],
              ["What counts as visible", "Map ranking, the Local Pack", "Whether AI answers name the business or cite its website"],
              ["Core work", "Categories, hours, photos, posts, review replies", "Website text and structured data, llms.txt, AI crawler access, matching facts everywhere"],
              ["Measurement", "Rank tracking, profile insights", "A fixed set of questions asked to AI on a schedule; Search Console's generative AI report"],
              ["What you can promise", "The work and the reporting", "The work and the reporting (never appearances or positions)"],
            ],
          },
        },
        {
          heading: "Step one: a fact sheet for every location",
          paragraphs: [
            "The step that matters most, and gets skipped most, is checking that each fact has the same value everywhere. Insites looked at 10,000 businesses on ChatGPT and Perplexity: 93% were known by at least one AI platform, but only 55% were described with accurate information ([Insites, May 2026](" + SRC.insites + "); a correlation study whose query set is not published). Fixing \"known, but described wrongly\" is exactly the kind of work local SEO agencies are good at.",
            "Keep one fact sheet per client location (a spreadsheet is enough) and decide the correct value once. Then bring every listing in line with it.",
          ],
          table: {
            head: ["Field", "Correct value on the sheet", "Where it must match"],
            rows: [
              ["Business name", "The official name as on the sign, with one rule for branch names", "Profile, website header and about page, structured data name, directories"],
              ["Address", "Street, number, building and floor", "Profile, website directions page, structured data address, directories"],
              ["Phone", "One main number (decide how any tracking number is handled)", "Profile, website text, structured data telephone, directories"],
              ["Hours and closed days", "Hours per weekday, plus public holidays and temporary closures", "Profile (special hours), website text, structured data, llms.txt"],
              ["Business type and services", "What the business is and its main services, briefly", "Profile categories and services, website service pages, structured data type"],
              ["Booking and contact", "Booking page URL, hours the phone is answered", "Profile booking link, website, structured data"],
            ],
          },
          after: [
            "Add a \"last checked\" column. It stops the classic mistake of updating the hours on the profile while the website and directories keep the old ones.",
          ],
        },
        {
          heading: "Three things to add on the website: structured data, llms.txt, AI crawler access",
          paragraphs: [
            "Even if your agency does not build or maintain the client's website, these three are quick to set up and easy to add to a monthly local SEO plan.",
          ],
          list: [
            "Structured data (schema.org JSON-LD): describe the business as a LocalBusiness or a more specific type such as Dentist, HairSalon or Restaurant, with the same name, address, phone and hours as the fact sheet. Google's local business structured data requires name and address and recommends openingHoursSpecification, telephone and url, among others (checked October 29, 2026). [Google: local business structured data](" + SRC.googleLocal + ")",
            "llms.txt: a plain-text summary of the site at /llms.txt (what the business is, where it is, the main pages) that AI can read easily. There is no solid data yet showing it moves results, so treat it as one more readability step, not a switch that makes a business appear. [How to write llms.txt](/guide/llms-txt)",
            "AI crawler access: check that robots.txt does not block AI search crawlers. OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers (checked October 31, 2026). [OpenAI: crawlers](" + SRC.openaiBots + ")",
          ],
          after: [
            "In fairness: the Insites study found no meaningful correlation between structured data or llms.txt and AI visibility, while businesses in the Local Pack were recommended 3.5 times more often ([Insites](" + SRC.insites + ")). So structured data is not a ranking lever on its own. Think of it as the part that publishes the fact sheet in a machine-readable form and removes contradictions. Your core local SEO work (a complete profile, reviews, the Local Pack) still matters for AI search.",
          ],
        },
        {
          heading: "Steps for a WordPress site (with Nurevo AEO)",
          list: [
            "Install and activate [Nurevo AEO (free) from WordPress.org](" + WP_ORG + "). A setup wizard opens: choose Local business and enter the name, address, phone, opening hours and description exactly as on the fact sheet. The wizard reads the hours back to you as they will be published.",
            "Structured data (JSON-LD), llms.txt and AI crawler rules (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User) are then output from the server, so crawlers that never run JavaScript can still read them.",
            "On sites that already run Yoast SEO, Rank Math, All in One SEO or Slim SEO, it adds only what is missing instead of replacing their output. From 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "Use the diagnosis in wp-admin to see what is missing and the one-click fixes to fill it. Finish with the [free AI readability check](/check) to see the site the way a crawler does.",
            "For sites not on WordPress, add the structured data and llms.txt by hand or ask the site's developer. For businesses with no website, start by proposing one, even a single page.",
          ],
          after: [
            "How themes and SEO plugins overlap in structured data is covered in [Local business schema and SEO plugins](/guide/local-business-schema-seo-plugins).",
          ],
        },
        {
          heading: "Reviews: don't carry every local SEO habit over",
          paragraphs: [
            "Reviews are a strong input when AI picks a business. In the Insites study, businesses found by both ChatGPT and Perplexity averaged 133 Google reviews, while those found by neither averaged 11 ([Insites](" + SRC.insites + "), correlation only). But there are legal and policy lines on how reviews are gathered.",
            "In Japan, stealth marketing (advertising that hides that it is advertising) has been regulated as a misleading representation under the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023 (checked November 1, 2026). [Consumer Affairs Agency: stealth marketing](" + SRC.caaStealth + "). Avoid rewards for reviews, reviews from staff or related parties, and steering only happy customers to post; ask customers for their honest opinion instead. And marking up a business's own reviews on its website does not help with Google: self-serving reviews about a LocalBusiness or Organization are not eligible for review rich results ([Google Search Central, September 16, 2019](" + SRC.reviews2019 + ")).",
          ],
        },
        {
          heading: "Measurement: add one page on AI visibility to the rank report",
          paragraphs: [
            "Add AI visibility to the local rank report you already send. Pick a few questions a client's prospects are likely to ask (business type + area + a condition, such as \"a dentist in [city] open on Sundays\"), ask them under the same conditions every month, and record whether the business was named, whether its website was cited, and who appeared instead. Don't judge from one run; look at the trend for the same questions. [How to measure AI visibility](/guide/measure-ai-visibility)",
            "On Google's side, Search Console's generative AI performance report shows impressions in AI Overviews and AI Mode. [Seeing AI features in Search Console](/guide/search-console-ai-features). Visits from AI can be separated in your analytics by referrer (chatgpt.com, perplexity.ai and so on).",
            "For sites connected to Nurevo AEO, once a month the Nurevo service asks Perplexity three questions built from the business type and area (never the business name) and shows in wp-admin whether the business was named, whether the site was cited and who appeared instead (Free and Standard). Ongoing measurement is Pro (from $99/month, currently on Perplexity). Dedicated monitoring tools track more AI platforms and questions, so agencies with many locations may want to use one alongside. [AEO tools compared](/guide/aeo-tools-comparison)",
          ],
        },
        {
          heading: "Example menu to add to a local SEO contract",
          table: {
            head: ["Part", "Work", "Frequency", "Deliverable"],
            rows: [
              ["Onboarding", "Build the fact sheet; find and fix mismatches across the profile, website and main directories; add structured data, llms.txt and AI crawler access to the website", "Once", "Fact sheet, before/after list, AI readability check result"],
              ["Monthly", "Push hours, closures and service changes to every listing; update the last-checked dates", "Monthly", "Change log"],
              ["Monthly", "Record AI visibility for the agreed questions and compare with last month", "Monthly", "One extra page in the local SEO report"],
              ["As needed", "Add new services or locations; review directory listings", "When needed", "Work report"],
            ],
          },
          after: [
            "Don't promise \"guaranteed in ChatGPT\" or \"number one in AI\" in proposals or contracts; promise the work and what the report covers. Local SEO companies are already moving into this: in Japan, GMO TECH launched a service on August 3, 2026 that centres on the Business Profile and aims to get store information cited in ChatGPT and Gemini answers ([innovatopia, August 4, 2026](" + SRC.gmoNews + ")). For scoping and pricing a retainer, see [Offering AI search optimization as a monthly service](/guide/agency-aeo-monthly-service).",
            "Nurevo has a partner program for web and local SEO agencies. Clients hold their own Nurevo plan and you charge for your own work. Partners get monthly client reports under their own name and logo and every client site in one dashboard, and earn a referral commission of 40% of each referred customer's monthly fee, net of Stripe fees (approval required; payouts currently only to partners based in Japan). [Partner program](https://nurevo.jp/partner/)",
          ],
        },
        {
          heading: "Checklist for local SEO agencies",
          list: [
            "Every client location has a fact sheet (name, address, phone, hours, business type, booking URL) with last-checked dates.",
            "The profile, website and main directories match the fact sheet.",
            "The website states hours, address and phone as text, not only in images.",
            "The structured data type fits the business (LocalBusiness or a more specific type) and its values match the page text.",
            "robots.txt does not block AI search crawlers such as OAI-SearchBot and PerplexityBot.",
            "There is an llms.txt with the main pages and the key facts.",
            "Review requests carry no rewards and no filtering, in line with stealth marketing rules and Google's policies.",
            "A fixed set of AI questions is recorded every month under the same conditions.",
            "No contract guarantees appearances or positions.",
          ],
        },
      ],
      faqs: [
        { q: "If a client already has local SEO, do they need AI search optimization?", a: "The foundation is shared, but it may not be enough. AI reads the website and directories as well as the Business Profile, so if information outside the profile is out of date, AI can repeat it. The added work is matching facts everywhere and adding structured data and llms.txt to the website." },
        { q: "How do local SEO, AEO, GEO and LLMO differ?", a: "Local SEO targets Google Maps and local results. AEO, GEO, LLMO and AIO are different names for making sure AI answers such as ChatGPT's describe a business correctly. See [AEO vs SEO vs GEO](/guide/aeo-vs-seo-vs-geo)." },
        { q: "What about clients with no website?", a: "Most AI sources for local questions are business websites, so start by proposing a site that states the business's facts as text, even a single page." },
        { q: "How long until we see results?", a: "No fixed timeline can be given. AI answers vary by day and by how the question is asked, and each AI picks up changes on its own schedule. Record the same questions monthly and judge by the trend." },
        { q: "What does Nurevo cost?", a: `The WordPress plugin, diagnosis, structured data, llms.txt and AI crawler settings are free (Free, $0). Automatic updates to the scoring criteria are Standard ($20/month), and ongoing AI visibility measurement is Pro (from $99/month, currently on Perplexity). [WordPress.org](${WP_ORG})` },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your client's website",
        body: "The free check shows the state of structured data, llms.txt and AI crawler access, no sign-up required. Use it as a first audit before you pitch.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Google, Google Business Profile, Google Maps, ChatGPT, OpenAI, Perplexity, Gemini, Yelp, WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit, BrightLocal, Insites, GMO TECH and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
