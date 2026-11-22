// Content page: for ad agencies, web agencies and SEO firms - how ads inside AI
// answers (ChatGPT ads, Google ads in AI Overviews / AI Mode) differ from being
// cited in the answer itself (AEO), what is available as of November 2026,
// how to explain it to clients, how to prepare the site and how to measure the
// two separately.
//
// Written 2026-11-22 (JST). Outside facts (all read 2026-11-22):
// - OpenAI "Our approach to advertising and expanding access" (2026-01-16):
//   "Ads do not influence the answers ChatGPT gives you"; ads separate and
//   clearly labeled; conversations private from advertisers; Free and Go only
//   (Plus/Pro/Business/Enterprise no ads); no ads to users under 18 (stated or
//   predicted); not eligible near sensitive/regulated topics like health,
//   mental health or politics; users can turn off personalization.
// - OpenAI "Testing ads in ChatGPT" (2026-02-09; updates 03-26, 05-07,
//   08-11): ads matched to the topic of the conversation, past chats and past
//   interactions with ads; advertisers get aggregate data (views, clicks);
//   08-11 update: launched in the UK, Mexico, Brazil, Japan, South Korea.
// - Impress Watch 2026-05-09: Japan pilot announced 05-07 for Free and Go.
// - PPC Land 2026-10-21: OpenAI post adds 26 countries, total 89.
// - OpenAI help 20001243 (advertiser guidance for crawlers): must allow
//   OAI-AdsBot, recommends OAI-SearchBot too; robots.txt alone may not be
//   enough (firewall/CDN/bot protection); fixing access does not guarantee
//   approval. OpenAI bots doc: OAI-AdsBot only visits pages submitted as ads,
//   data not used for training; OAI-SearchBot decides ChatGPT search results.
// - Google Ads help 16297775: ads within AI Overviews in English in 12
//   countries (AU, CA, IN, ID, KE, MY, NZ, NG, PK, PH, SG, US) - Japan not
//   listed; ads above/below AI Overviews in all 200+ AI Overviews markets;
//   no opt-out; reported as Top ads; excluded verticals (adult, alcohol,
//   gambling, finance, healthcare, politics and more).
// - Google blog 2026-10-28: ads in AI Mode scaling in AU, CA, IN, KE, MY, NZ,
//   NG, PK, PH, SG; Q4 2026 BR, MX, UK; labeled "Sponsored". Japan not named.
// - MacRumors 2026-02-18 (citing the Financial Times): Perplexity stepped
//   away from advertising over user trust.
// Product facts: plugin readme 0.9.2 and nurevo-webmcp.php
// (webmcp_canary_ai_search_agents(): OAI-SearchBot, ChatGPT-User,
// Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User; filter
// webmcp_canary_robots_search_agents). OAI-AdsBot is not in the default list.
// Pro AI visibility measurement: Perplexity (ChatGPT once configured).
// Not stated on purpose: CPC/CPM benchmarks, minimum spend in Japan, CTRs
// (only agency/vendor figures found), Microsoft Copilot ad status (only a 2024
// source), Gemini app ads (primary source not read), whether ad spend changes
// citations (no public test found).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  oaiApproach: "https://openai.com/index/our-approach-to-advertising-and-expanding-access/",
  oaiTesting: "https://openai.com/index/testing-ads-in-chatgpt/",
  oaiCrawlers: "https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers",
  oaiBots: "https://developers.openai.com/api/docs/bots",
  impress: "https://www.watch.impress.co.jp/docs/news/2107354.html",
  ppc89: "https://ppc.land/advertisers-in-26-more-countries-gain-chatgpt-ads-bringing-the-total-to-89/",
  gAio: "https://support.google.com/google-ads/answer/16297775?hl=en",
  gAiMode: "https://blog.google/products/ads-commerce/ads-in-ai-mode-global/",
  pplx: "https://www.macrumors.com/2026/02/18/perplexity-abandons-ai-advertising/",
};

const FILTER = `// 子テーマの functions.php か mu-plugins に置く例
// （ChatGPT広告を出すお客様のサイトだけ）
add_filter('webmcp_canary_robots_search_agents', function ($agents) {
    $agents[] = 'OAI-AdsBot';
    return $agents;
});`;

const FILTER_EN = `// Example for a child theme's functions.php or an mu-plugin
// (only on sites that run ChatGPT ads)
add_filter('webmcp_canary_robots_search_agents', function ($agents) {
    $agents[] = 'OAI-AdsBot';
    return $agents;
});`;

const CHECK = `# robots.txt に OAI-AdsBot / OAI-SearchBot を止める行がないか
curl -s https://example.jp/robots.txt | grep -i -A3 "oai-\\|user-agent: \\*"

# 広告の飛び先がボット対策で弾かれていないか（403 や確認画面が返らないか）
curl -s -o /dev/null -w "%{http_code}\\n" \\
  -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-AdsBot/1.0; +https://openai.com/adsbot" \\
  https://example.jp/lp/`;

const CHECK_EN = `# Does robots.txt block OAI-AdsBot or OAI-SearchBot?
curl -s https://example.com/robots.txt | grep -i -A3 "oai-\\|user-agent: \\*"

# Does bot protection turn the landing page away (403 or a challenge page)?
curl -s -o /dev/null -w "%{http_code}\\n" \\
  -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-AdsBot/1.0; +https://openai.com/adsbot" \\
  https://example.com/lp/`;

export default {
  slug: "ai-search-ads-vs-aeo",
  targetQueries: [
    "ChatGPT広告 AI検索対策 違い",
    "ChatGPT広告 回答 影響",
    "AI Overviews 広告 LLMO 違い 代理店",
    "ChatGPT ads vs AEO",
    "do ChatGPT ads affect answers citations",
    "AI Overviews ads vs organic citations agency",
  ],
  related: ["agency-aeo-monthly-service", "agency-aeo-first-audit-proposal", "how-to-appear-in-chatgpt", "measure-ai-visibility", "google-ai-overviews-citations"],
  locales: {
    ja: {
      title: "ChatGPT広告とAI検索対策の違い：代理店の説明と準備 | Nurevo",
      description: "ChatGPT広告・AI Overviews広告と、AIの回答に出典として選ばれるAI検索対策（AEO）の違い。2026年11月時点の提供状況、お客様への説明、サイト側の準備、測り方の分け方を代理店向けにまとめました。",
      h1: "ChatGPT広告・AI Overviews広告とAI検索対策（AEO）の違い：代理店がお客様に説明すること、準備すること",
      lead: "ChatGPT広告は、回答の下に「広告」と表示される枠をお金で買うもので、回答の本文や出典は買えません。OpenAIは「広告はChatGPTの回答に影響しない」と明言しています。AI検索対策（AEO）は、回答そのものに会社や店が名前や出典として選ばれるようにする作業です。2つは別の作業なので、代理店は見積もり・サイトの準備・測り方・報告を分けて扱うのが基本です。",
      intro: [
        "作成日：2026年11月22日（JST）。対象は、リスティング広告やSNS広告を運用する広告代理店、AI検索対策を提供する制作会社・SEO会社です。お客様から「ChatGPTに広告が出せるなら、AI対策はいらないのでは」「広告を出せばAIに勧めてもらえるのか」と聞かれたときに、そのまま使える説明を目指しました。",
        "AIの回答も広告の表示も、日・聞き方・利用者のプランや国によって変わります。この記事は表示を保証する方法ではなく、2つの違いを正しく説明し、混ぜずに準備・測定するための手順です。提供状況は2026年11月22日に公式の資料で確かめた内容で、今後変わります。",
      ],
      sections: [
        {
          heading: "よく読まれているChatGPT広告の記事に足りないこと",
          paragraphs: [
            "「ChatGPT広告 日本」「AIモード 広告」「ChatGPT ads」で上位に出る日本語7本・英語7本を読みました。仕組み・対象プラン・入稿規定・始め方は、どの記事もよく整理されています。一方で、AI検索対策の担当者が知りたい次の点は、ほとんどの記事で抜けていました。",
          ],
          table: {
            head: ["抜けていた点", "この記事で扱うこと"],
            rows: [
              ["一次情報へのリンクがない、日付が古い", "OpenAI・Googleの公式ページだけで、2026年11月時点の状況を表にした"],
              ["広告と「回答の中の出典」の違いが1〜2行", "表示される場所・決め方・止めたとき・測り方を、1つの表で並べた"],
              ["広告が出せない業種の扱い", "医療・金融などで広告が出ない場合、AI検索対策だけが手段になることを書いた"],
              ["サイト側の準備", "OAI-AdsBot と OAI-SearchBot の違い、robots.txt とボット対策の確かめ方、WordPressでの設定"],
              ["測り方を分ける方法", "広告の成果とAIの回答への登場を、同じ数字に混ぜない記録の仕方"],
              ["見積もり・報告の分け方", "広告費と作業費、2つの報告を分ける契約の書き方"],
            ],
            caption: "2026年11月22日に読んだ記事の傾向です。記事ごとの良し悪しではありません。多くは広告の運用会社による解説で、運用の細かい点はそちらのほうが詳しく書かれています。",
          },
        },
        {
          heading: "2026年11月時点：AIの回答画面の広告の提供状況",
          table: {
            head: ["サービス", "広告の状況", "日本", "出典"],
            rows: [
              ["ChatGPT", "無料プランとGoプランの、ログインした大人の利用者に表示。Plus・Pro・Business・Enterpriseには表示しない。18歳未満（本人の申告またはOpenAIの推定）には表示しない", "提供あり（OpenAIの2026年8月11日の追記に日本での開始が明記）", `[OpenAI 広告の方針](${SRC.oaiApproach})、[広告のテスト](${SRC.oaiTesting})`],
              ["ChatGPT（国の数）", "2026年10月21日のOpenAIの発表で26か国が加わり、計89か国と報じられた", "—", `[PPC Land](${SRC.ppc89})`],
              ["Google AI Overviews の中の広告", "英語で、米国・カナダ・オーストラリア・インドなど12か国", "日本・日本語は対象一覧になし。AI Overviews の上下に出る通常の広告は、AI Overviews のある200以上の市場で対象", `[Google 広告ヘルプ](${SRC.gAio})`],
              ["Google AI モードの広告", "2026年10月28日に10か国で拡大と発表。第4四半期にブラジル・メキシコ・英国へ。「スポンサー」と表示", "発表に日本の記載なし", `[Google のブログ](${SRC.gAiMode})`],
              ["Perplexity", "広告から手を引いたと報じられた（2026年2月、Financial Times の報道を引用）", "—", `[MacRumors](${SRC.pplx})`],
            ],
            caption: "日本での最初の表示日は報道により6月とするものがあります（Impress Watch は2026年5月9日に「近日中に開始」と報道）。この記事では、日付はOpenAIの公式の追記に合わせました。Microsoft Copilot・Geminiアプリの広告は、今回は一次情報を確認できず載せていません。",
          },
          after: [
            `日本の広告主から見ると、2026年11月時点でAIの回答画面に広告を出せるのは、主にChatGPTです（[Impress Watch](${SRC.impress})）。GoogleのAI Overviews の「中」に出る広告は、日本ではまだ対象になっていません。`,
          ],
        },
        {
          heading: "広告と「回答の中の出典」は何が違うか",
          table: {
            head: ["比べる点", "AIの回答画面の広告", "回答の中の名前・出典（AI検索対策）"],
            rows: [
              ["出る場所", "ChatGPTでは回答の下に、回答と分けて「広告」と表示", "回答の本文、出典のリンク、おすすめの一覧"],
              ["何で決まるか", "広告主の入札と、会話の話題・過去のチャット・広告とのやり取り（OpenAIの説明）", "AIがその質問に役立つと判断した情報。費用では決まらない"],
              ["お金", "表示・クリックに応じた広告費", "サイトの整備・記事・計測の作業費。表示ごとの費用はない"],
              ["出せない場面", "健康・メンタルヘルス・政治などの話題の近くには出ない（ChatGPT）。Googleは医療・金融・酒類などを AI Overviews の中の広告から除外", "業種による一律の除外はない。ただしAIは医療などで慎重に答えることが多い"],
              ["表示される人", "ChatGPTの無料・Goのログイン利用者（大人）", "プランに関係なく、検索を使った回答を見るすべての人"],
              ["止めたとき", "出稿を止めた時点で表示はなくなる", "サイトの事実が正しく残っていれば、すぐには消えない（変動はある）"],
              ["サイトに必要なこと", "飛び先のページを OAI-AdsBot が読めること", "OAI-SearchBot などAI検索のクローラが読めること、事実が正確でそろっていること"],
              ["結果の見え方", "広告の管理画面で表示回数・クリック", "自分で質問して記録する。専用の公式レポートは限られる"],
            ],
          },
          after: [
            `OpenAIは「広告はChatGPTの回答に影響しない」「会話の内容は広告主に渡さない」と書いています（[OpenAI](${SRC.oaiApproach})）。つまり、広告費を増やして回答の中の推薦や出典を増やす、という説明はできません。逆に、広告費と出典の関係を外部から検証した公開データも、今回は見つかりませんでした。お客様には「公式の説明ではそうなっている」と伝えるのが正確です。`,
          ],
        },
        {
          heading: "お客様によく聞かれる3つの質問と答え方",
          list: [
            "「ChatGPTに広告を出せば、AIに勧めてもらえますか？」→いいえ。広告は回答の下の別の枠に「広告」として出ます。回答の中で勧められるかどうかは、広告とは別に決まるとOpenAIは説明しています。",
            "「広告を出せるなら、AI検索対策はいりませんか？」→役割が違います。広告は無料・Goプランの利用者にだけ、出稿している間だけ表示されます。回答の中の名前や出典は、有料プランの利用者や、広告のないAI（Perplexity など）にも届き、出稿を止めてもすぐには消えません。",
            "「どちらから始めればいいですか？」→まず、サイトの事実（店名・住所・料金・営業時間・サービス）が正確でそろっているかを確かめます。広告の飛び先もAIの回答も、同じサイトの情報を読むからです。そのうえで、すぐに見込み客を集めたい商品があれば広告を、名前を聞かれたときに正しく答えてほしい情報はAI検索対策で整えます。",
          ],
          after: [
            "業種によっては、答えが変わります。歯科・クリニックなどの医療、金融、酒類のように、AIの回答画面の広告が出せない・出しにくい業種では、AIの回答に名前が出るかどうかはAI検索対策だけで決まります。広告の提案と同時に、その旨を一言添えると誤解が起きません。",
          ],
        },
        {
          heading: "業種ごとの判断表",
          table: {
            head: ["お客様", "AIの回答画面の広告", "AI検索対策で先に整えること"],
            rows: [
              ["医療（歯科・クリニック・整骨院など）", "ChatGPTは健康の話題の近くに出ない。Googleも AI Overviews の中の広告から医療を除外", "診療内容・診療時間・料金の表示を、広告の規則に沿って正確に。[歯科の記事](/guide/dental-clinic-ai-search)"],
              ["金融・保険", "Google は AI Overviews の中の広告から金融を除外", "会社情報・登録番号・商品の条件を公式の表記どおりに"],
              ["地域の店舗（飲食・美容室など）", "ChatGPTでは出せる。地域の絞り込みは広告の管理画面の仕様を確認", "住所・営業時間・予約方法を、サイト・Googleビジネスプロフィールとそろえる"],
              ["ネットショップ", "ChatGPT・Google とも対象になりうる", "商品の価格・在庫・送料・返品を構造化データとページでそろえる。[ネットショップの記事](/guide/online-shop-ai-search)"],
              ["BtoB・SaaS", "ChatGPTでは出せる", "料金・機能・導入事例・比較の質問に答えるページ。[BtoB・SaaSの記事](/guide/b2b-saas-ai-search)"],
            ],
            caption: "広告の対象業種は変わることがあります。出稿の前に、各社の最新の広告ポリシーを確かめてください。",
          },
        },
        {
          heading: "サイト側の準備：OAI-AdsBot と OAI-SearchBot は別のボット",
          paragraphs: [
            `OpenAIのクローラは目的ごとに分かれています（[OpenAIのボットの説明](${SRC.oaiBots})）。OAI-SearchBot はChatGPTの検索の回答にサイトを出すためのもので、これを止めたサイトはChatGPTの検索の回答に出ません。OAI-AdsBot は広告として登録されたページだけを読み、規約に合っているかの確認と、広告をいつ出すかの判断に使われます。OAI-AdsBot が集めたデータは、AIの学習には使われないと書かれています。`,
            `広告主向けの案内では、OAI-AdsBot は「許可しなければならない」、OAI-SearchBot も許可を推奨、とされています。さらに、robots.txt だけでは足りない場合があり、ファイアウォールやCDNのボット対策で弾かれていないかも確かめるよう書かれています（[OpenAI ヘルプ](${SRC.oaiCrawlers})）。アクセスを直しても、広告の審査に通ることは保証されません。`,
          ],
          code: CHECK,
          after: [
            "上のコマンドは確かめ方の例です。example.jp と /lp/ をお客様のドメインと広告の飛び先に置き換えます。ボット対策のサービスは、名乗るユーザーエージェントだけでなくIPアドレスなども見ていることが多いので、200が返っても本物のボットが通る保証にはなりません。ボット対策の管理画面の記録も確かめてください。",
          ],
        },
        {
          heading: "WordPressでの設定：Nurevo AEO を使っている場合",
          paragraphs: [
            `[Nurevo AEO（WordPress.orgの無料プラグイン）](${WP_ORG})は、AI検索のクローラ（OAI-SearchBot・ChatGPT-User・Claude-SearchBot・Claude-User・PerplexityBot・Perplexity-User）を robots.txt で許可します。お客様が /wp-admin/ などに書いている既存の制限は、そのまま適用されます。学習用のクローラ（GPTBot など）はお客様の robots.txt に任せ、ワンクリックで許可・拒否を選べます。学習用を拒否しても、AI検索やAEOスコアには影響しません。`,
            "OAI-AdsBot は初期の一覧に入っていません。広告として登録したページしか読まないボットで、広告を出さないサイトには関係がないためです。ChatGPT広告を出すお客様のサイトで、robots.txt に明示しておきたい場合は、フィルターで足せます。",
          ],
          code: FILTER,
          after: [
            "足したあとは https://ドメイン/robots.txt を開き、許可のグループに OAI-AdsBot が入っていることを確かめます。サーバーに robots.txt のファイルを直接置いているサイトでは、WordPressの自動の robots.txt は使われないので、そのファイルを直接書き換えます。",
            "広告の飛び先ページの内容は、広告をいつ出すかの判断にも使われます。飛び先の料金・条件が、サイトの構造化データや料金ページと食い違っていないかも同時に確かめます。AIの回答の材料と広告の材料が同じサイトなので、ここをそろえることが両方に効きます。",
          ],
        },
        {
          heading: "測り方を分ける：広告の数字とAIの回答への登場を混ぜない",
          list: [
            "広告の成果は、広告の管理画面と、飛び先のページのタグ・URLのパラメータで測ります。AI検索対策の報告には入れません。",
            "AIの回答への登場は、決まった質問を決まった日にAIに聞き、回答の本文や出典に名前・URLが出たかを記録します。[AIでの登場率の測り方](/guide/measure-ai-visibility)の手順が使えます。",
            "ChatGPTの無料プランで確かめると、回答の下に広告が出ることがあります。広告として出たものは「登場」に数えず、記録に「広告あり」と別に書きます。",
            `Google の AI Overviews の中に出る広告は、Google 広告の報告では「上部の広告」として報告され、AI Overviews の枠だけを狙って配信することもできません（[Google 広告ヘルプ](${SRC.gAio})）。「AI Overviews の広告の成果」を、別の数字のように報告しないようにします。`,
            "Perplexity は報道によれば広告から手を引いており、回答に出るかどうかは広告と関係ありません。Nurevo の Pro プランのAI登場率の計測は現在 Perplexity が対象（ChatGPTは設定され次第）なので、広告の影響を受けない数字として扱えます。",
          ],
        },
        {
          heading: "見積もりと報告の分け方",
          paragraphs: [
            `広告とAI検索対策を両方受けるときは、見積もりを「広告費（媒体に払うお金）」「広告の運用費」「AI検索対策の作業費」に分けます。報告書も2つに分け、広告の表示回数・クリックと、AIの回答への登場を同じグラフに載せません。AI検索対策を月額で続ける作業範囲は[AI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)で扱っています。`,
            "契約書や提案書では、「広告を出すとAIに推薦される」「AIの回答で上位に出る」とは書きません。OpenAI自身が広告は回答に影響しないと説明しており、AIの回答は変わるからです。書けるのは「広告は回答の下の広告枠に表示される」「AI検索対策はサイトの事実を正確にし、AIが読める形にする作業」という事実です。",
            `制作会社・代理店向けには、社名・ロゴ入りの月次レポートを毎月自動で送る機能と、複数のお客様のサイトを1つの画面で見る機能があります。詳しくは[パートナープログラム](${PARTNER})をご覧ください。料金は Free 0円、Standard 月3,000円、Pro 月14,800円〜です。`,
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "お客様に、広告は回答の下の別枠で、回答の中身や出典は買えないと説明した。",
            "お客様の業種が、ChatGPT・Google の広告の対象外になっていないか、最新のポリシーで確かめた。",
            "広告の対象外の業種では、AIの回答に出る手段はAI検索対策だけだと伝えた。",
            "サイトの店名・住所・料金・営業時間を、広告の飛び先・構造化データ・Googleビジネスプロフィールでそろえた。",
            "robots.txt で OAI-SearchBot と OAI-AdsBot を止めていないことを確かめた。",
            "CDN・ファイアウォールのボット対策で、広告の飛び先が弾かれていないことを確かめた。",
            "AIの回答への登場の記録で、広告として出たものを別に書く欄を作った。",
            "見積もりを広告費・運用費・AI検索対策の作業費に分けた。",
            "提案書・契約書に「AIに推薦される」「上位に出る」などの約束を書いていない。",
            "提供状況（国・プラン・広告の場所）を、提案の前に公式のページで確かめ直した。",
          ],
        },
      ],
      faqs: [
        { q: "ChatGPT広告を出すと、回答の中で自社が勧められやすくなりますか？", a: "OpenAIは、広告はChatGPTの回答に影響しないと説明しています。広告は回答の下に「広告」と分けて表示されるもので、回答の中で勧められるかどうかとは別です。広告費と回答の関係を外部から検証した公開データは、今回は見つかりませんでした。" },
        { q: "日本でChatGPT広告は出せますか？", a: "出せます。OpenAIの2026年8月11日の追記に、日本での開始が明記されています。表示されるのは無料プランとGoプランの、ログインした大人の利用者で、Plus・Pro・Business・Enterpriseには表示されません。" },
        { q: "GoogleのAI Overviewsの中に、日本で広告を出せますか？", a: "2026年11月22日時点の Google 広告ヘルプでは、AI Overviews の中の広告は英語で12か国が対象で、日本は入っていません。AI Overviews の上下に出る通常の検索広告は、日本でも対象です。AI モードの広告も、2026年10月28日の発表に日本の記載はありません。" },
        { q: "歯科やクリニックはChatGPT広告を出せますか？", a: "OpenAIは、健康・メンタルヘルス・政治などの話題の近くには広告を出さないとしています。医療の質問への回答に広告で出るのは難しいと考え、診療内容や診療時間を正確に載せるAI検索対策を先に進めるのが現実的です。" },
        { q: "OAI-AdsBot を robots.txt で許可すると、学習に使われますか？", a: "OpenAIの説明では、OAI-AdsBot は広告として登録されたページだけを読み、集めたデータはAIの学習に使われません。学習に使われるのは GPTBot で、別に扱えます。" },
        { q: "AIの回答への登場率を測るとき、広告はどう扱えばいいですか？", a: "広告として出たものは登場に数えず、「広告あり」と別に記録します。広告の成果は広告の管理画面で測り、AI検索対策の報告と混ぜないのが基本です。" },
        { q: "広告とAI検索対策、予算が少ないならどちらですか？", a: "まず、サイトの事実を正確にそろえることです。広告の飛び先もAIの回答も同じサイトを読むので、ここは両方に効きます。そのうえで、すぐに集客したい商品があれば広告、名前を聞かれたときに正しく答えてほしい情報はAI検索対策で整えます。どちらの場合もAIの回答は変わるため、結果は記録しながら判断します。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "広告の飛び先とサイトを、AIがどう読んでいるか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。広告の提案の前に、サイトの事実がそろっているかを確かめられます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: PARTNER },
      },
      footnote: "ChatGPTはOpenAI、Google・Google 広告・AI Overviews はGoogle LLC、PerplexityはPerplexity AI、ClaudeはAnthropic, PBCの商標です。WordPressはWordPress Foundationの商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "ChatGPT Ads vs AEO: What Agencies Should Tell Clients | Nurevo",
      description: "How ChatGPT ads and AI Overviews ads differ from being cited in AI answers (AEO): November 2026 status, client talking points, site setup and measurement.",
      h1: "ChatGPT ads, AI Overviews ads and AEO: what agencies should explain to clients and set up on the site",
      lead: "A ChatGPT ad buys a labeled slot below the answer. It does not buy the answer or its sources: OpenAI states that ads do not influence the answers ChatGPT gives. AI search optimization (AEO) is the work of getting a business named or cited inside the answer itself. They are separate jobs, so agencies should quote, prepare, measure and report them separately.",
      intro: [
        "Written November 22, 2026 (JST). This is for ad agencies running search and social campaigns, and for web agencies and SEO firms that offer AI search optimization. The goal is an explanation you can use as-is when a client asks \"If we can advertise in ChatGPT, do we still need AEO?\" or \"Will ads make the AI recommend us?\"",
        "AI answers and ad delivery both vary by day, wording, the user's plan and country. This is not a way to guarantee placement. It is a way to explain the difference accurately and keep the preparation and measurement apart. Availability below was checked against official pages on November 22, 2026 and will change.",
      ],
      sections: [
        {
          heading: "What the popular ChatGPT ads articles leave out",
          paragraphs: [
            "We read seven Japanese and seven English articles that rank for \"ChatGPT ads\", \"AI Mode ads\" and their Japanese equivalents. They explain the format, eligible plans, ad specs and setup well. Most of them miss the points that matter to whoever runs AI search optimization:",
          ],
          table: {
            head: ["Missing point", "What this guide covers"],
            rows: [
              ["No links to primary sources, or out-of-date status", "A November 2026 status table built only from OpenAI and Google pages"],
              ["Ads vs citations in the answer get one or two lines", "One table comparing placement, selection, what happens when you stop, and measurement"],
              ["Industries where ads can't run", "In healthcare and finance, AEO may be the only route into the answer"],
              ["Site-side setup", "OAI-AdsBot vs OAI-SearchBot, checking robots.txt and bot protection, WordPress settings"],
              ["Separate measurement", "How to record AI answer appearances without mixing in ad results"],
              ["Quotes and reports", "Splitting media spend, management fees and AEO work"],
            ],
            caption: "Trends in the articles read on November 22, 2026, not a judgment of any single article. Many are written by ad agencies and go deeper on campaign operations than this guide does.",
          },
        },
        {
          heading: "Status in November 2026: ads on AI answer screens",
          table: {
            head: ["Service", "Ad status", "Japan", "Source"],
            rows: [
              ["ChatGPT", "Shown to logged-in adult users on Free and Go. Not shown on Plus, Pro, Business or Enterprise, or to users under 18 (stated or predicted by OpenAI)", "Available (OpenAI's August 11, 2026 update says it launched in Japan)", `[OpenAI's ad principles](${SRC.oaiApproach}), [Testing ads](${SRC.oaiTesting})`],
              ["ChatGPT (country count)", "An October 21, 2026 OpenAI post added 26 countries, reported as 89 in total", "—", `[PPC Land](${SRC.ppc89})`],
              ["Ads within Google AI Overviews", "In English in 12 countries, including the US, Canada, Australia and India", "Japan and Japanese are not listed. Regular ads above and below AI Overviews are eligible in all 200+ AI Overviews markets", `[Google Ads Help](${SRC.gAio})`],
              ["Ads in Google AI Mode", "Scaling in 10 countries announced October 28, 2026; Brazil, Mexico and the UK in Q4. Labeled \"Sponsored\"", "Japan not named in the announcement", `[Google blog](${SRC.gAiMode})`],
              ["Perplexity", "Reported to have stepped away from advertising (February 2026, citing the Financial Times)", "—", `[MacRumors](${SRC.pplx})`],
            ],
            caption: "Some Japanese reports date the first ads in Japan to June (Impress Watch reported on May 9, 2026 that a pilot would start shortly). This guide uses the date in OpenAI's own update. Microsoft Copilot and Gemini app ads are left out because we could not confirm them from a primary source this time.",
          },
          after: [
            `For an advertiser in Japan, the AI answer screen where ads can run in November 2026 is mainly ChatGPT ([Impress Watch](${SRC.impress})). Ads inside Google AI Overviews are not yet offered in Japan. Outside Japan, check the country lists above before promising a client anything.`,
          ],
        },
        {
          heading: "How an ad differs from a citation in the answer",
          table: {
            head: ["Point", "Ad on the AI answer screen", "Name or citation in the answer (AEO)"],
            rows: [
              ["Placement", "In ChatGPT, below the answer, separated and labeled as an ad", "In the answer text, the source links, recommendation lists"],
              ["What decides it", "The advertiser's bid plus the conversation topic, past chats and past ad interactions (OpenAI)", "What the AI judges useful for the question. Not money"],
              ["Cost", "Media spend per view or click", "Work on the site, content and measurement. No per-view cost"],
              ["Where it can't appear", "Not near sensitive topics such as health, mental health or politics (ChatGPT). Google excludes healthcare, finance, alcohol and more from ads within AI Overviews", "No blanket industry exclusion, though AI tends to answer medical questions cautiously"],
              ["Who sees it", "Logged-in adult ChatGPT users on Free and Go", "Anyone who sees a search-backed answer, on any plan"],
              ["When you stop", "It disappears when the campaign stops", "Does not vanish right away if the site's facts stay correct (answers still vary)"],
              ["What the site needs", "OAI-AdsBot can read the landing page", "AI search crawlers such as OAI-SearchBot can read the site, and its facts are accurate and consistent"],
              ["How results show", "Impressions and clicks in the ads manager", "You ask and record. Official reporting is limited"],
            ],
          },
          after: [
            `OpenAI writes that \"Ads do not influence the answers ChatGPT gives you\" and that conversations are kept private from advertisers ([OpenAI](${SRC.oaiApproach})). So you cannot tell a client that more ad spend will earn more recommendations or citations inside the answer. We also found no public, independent test of ad spend versus citations, so the accurate wording is \"that is how OpenAI describes it.\"`,
          ],
        },
        {
          heading: "Three client questions and how to answer them",
          list: [
            "\"If we advertise in ChatGPT, will it recommend us?\" No. The ad appears in a separate, labeled slot below the answer. OpenAI says whether the answer recommends you is decided apart from ads.",
            "\"If we can run ads, do we still need AEO?\" They do different jobs. Ads reach only Free and Go users, and only while the campaign runs. A name or citation in the answer also reaches paid-plan users and AI tools without ads (such as Perplexity), and does not disappear the day you stop paying.",
            "\"Which should we start with?\" First check that the site's facts (name, address, prices, hours, services) are accurate and consistent, because both the ad landing page and the AI answer read the same site. Then use ads for products you need leads for now, and AEO for the facts you want the AI to get right when someone asks about you.",
          ],
          after: [
            "The answer changes by industry. In healthcare (dentists, clinics), finance and alcohol, ads on AI answer screens are restricted or excluded, so whether the business appears in the answer depends on AEO alone. Saying so when you pitch ads avoids misunderstandings later.",
          ],
        },
        {
          heading: "Decision table by client type",
          table: {
            head: ["Client", "Ads on AI answer screens", "What AEO should fix first"],
            rows: [
              ["Healthcare (dentists, clinics, physical therapy)", "ChatGPT ads don't appear near health topics; Google excludes healthcare from ads within AI Overviews", "Accurate services, hours and fees, within your market's advertising rules. [Dental guide](/guide/dental-clinic-ai-search)"],
              ["Finance and insurance", "Google excludes finance from ads within AI Overviews", "Company details, registration numbers and product terms exactly as officially stated"],
              ["Local businesses (restaurants, salons)", "Possible in ChatGPT; check the ads manager for location targeting", "Address, hours and booking method consistent across the site and Google Business Profile"],
              ["Online shops", "Potentially eligible on ChatGPT and Google", "Price, stock, shipping and returns consistent in structured data and on the page. [Online shop guide](/guide/online-shop-ai-search)"],
              ["B2B and SaaS", "Possible in ChatGPT", "Pages that answer pricing, feature, case-study and comparison questions. [B2B SaaS guide](/guide/b2b-saas-ai-search)"],
            ],
            caption: "Eligible industries can change. Check each platform's current ad policy before you launch.",
          },
        },
        {
          heading: "Site setup: OAI-AdsBot and OAI-SearchBot are different bots",
          paragraphs: [
            `OpenAI splits its crawlers by purpose ([OpenAI bots documentation](${SRC.oaiBots})). OAI-SearchBot surfaces sites in ChatGPT's search answers; sites that opt out of it are not shown in ChatGPT search answers. OAI-AdsBot only visits pages submitted as ads, checks them against policy and helps decide when the ad is relevant. OpenAI says the data OAI-AdsBot collects is not used to train its foundation models.`,
            `OpenAI's advertiser guidance says you must allow OAI-AdsBot and recommends allowing OAI-SearchBot too. It also warns that a robots.txt rule alone may not be enough: firewall, CDN and bot-protection rules can block it as well ([OpenAI Help](${SRC.oaiCrawlers})). Fixing access does not guarantee the ad will be approved.`,
          ],
          code: CHECK_EN,
          after: [
            "These commands are examples: replace example.com and /lp/ with the client's domain and landing page. Bot-protection services often check IP addresses as well as the user agent, so a 200 here does not prove the real bot gets through. Check the bot-protection logs too.",
          ],
        },
        {
          heading: "WordPress settings with Nurevo AEO",
          paragraphs: [
            `[Nurevo AEO (a free plugin on WordPress.org)](${WP_ORG}) allows the AI search crawlers in robots.txt: OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User. The client's existing rules, such as /wp-admin/, keep applying to them. Training crawlers (GPTBot and others) are left to the client's robots.txt, with a one-click allow or block. Blocking training crawlers does not affect AI search or the AEO score.`,
            "OAI-AdsBot is not in the default list: it only reads pages submitted as ads, so it is irrelevant to sites that don't advertise. On a site that runs ChatGPT ads, you can add it with a filter if you want it named in robots.txt.",
          ],
          code: FILTER_EN,
          after: [
            "Afterwards, open https://your-domain/robots.txt and check that OAI-AdsBot is in the allow group. If the site has a physical robots.txt file on the server, WordPress's generated robots.txt is not used, so edit that file directly.",
            "OpenAI also uses landing page content to decide when an ad is relevant. Check that the prices and terms on the landing page match the site's structured data and pricing page. The AI answer and the ad read the same site, so consistent facts help both.",
          ],
        },
        {
          heading: "Measure them separately: don't mix ad numbers with answer appearances",
          list: [
            "Measure ad results in the ads manager and with tags and URL parameters on the landing page. Keep them out of the AEO report.",
            "Measure answer appearances by asking fixed questions on fixed dates and recording whether the name or URL appears in the answer text or sources. The steps in [measuring AI visibility](/guide/measure-ai-visibility) work for this.",
            "If you check on ChatGPT's Free plan, an ad may appear below the answer. Do not count an ad as an appearance; note \"ad shown\" separately.",
            `Google says ads within AI Overviews are reported as Top ads, and advertisers cannot target the AI Overviews placement on its own ([Google Ads Help](${SRC.gAio})). Don't report an \"AI Overviews ads\" result as if it were a separate number.`,
            "Perplexity is reported to have stepped away from ads, so appearing there has nothing to do with ad spend. Nurevo's Pro AI visibility measurement currently covers Perplexity (ChatGPT once configured), so you can treat it as a number unaffected by ads.",
          ],
        },
        {
          heading: "Splitting quotes and reports",
          paragraphs: [
            `When you handle both, split the quote into media spend (paid to the platform), ad management fees and AEO work. Split the reports too: don't put ad impressions and clicks on the same chart as AI answer appearances. Scoping AEO as an ongoing service is covered in [offering AEO as a monthly service](/guide/agency-aeo-monthly-service).`,
            "In proposals and contracts, don't write \"ads will get you recommended by AI\" or \"you'll rank at the top of AI answers.\" OpenAI itself says ads don't influence answers, and AI answers change. What you can write is fact: ads appear in an ad slot below the answer, and AEO makes the site's facts accurate and readable by AI.",
            `For agencies there are monthly reports under your own name and logo, sent automatically, and a dashboard for all client sites. See the [partner program](${PARTNER}?lang=en). Pricing outside Japan: Free USD 0, Standard USD 20 per month, Pro from USD 99 per month.`,
          ],
        },
        {
          heading: "Checklist",
          list: [
            "Told the client that ads sit in a separate slot below the answer and can't buy the answer or its sources.",
            "Checked the client's industry against the current ChatGPT and Google ad policies.",
            "For excluded industries, told the client that AEO is the only route into the answer.",
            "Made name, address, prices and hours consistent across the landing page, structured data and Google Business Profile.",
            "Confirmed robots.txt does not block OAI-SearchBot or OAI-AdsBot.",
            "Confirmed CDN or firewall bot protection does not turn the landing page away.",
            "Added a separate \"ad shown\" column to the AI answer appearance log.",
            "Split the quote into media spend, management fees and AEO work.",
            "Kept promises like \"recommended by AI\" or \"top of AI answers\" out of proposals and contracts.",
            "Rechecked availability (countries, plans, placements) on the official pages before pitching.",
          ],
        },
      ],
      faqs: [
        { q: "Will ChatGPT ads make the answer recommend us more often?", a: "OpenAI says ads do not influence ChatGPT's answers. The ad is shown separately below the answer and labeled, apart from whether the answer recommends you. We found no public, independent test of ad spend versus answers." },
        { q: "Can we run ChatGPT ads in Japan?", a: "Yes. OpenAI's August 11, 2026 update says ChatGPT ads launched in Japan. They show to logged-in adult users on Free and Go, not on Plus, Pro, Business or Enterprise." },
        { q: "Can we run ads inside Google AI Overviews?", a: "As of November 22, 2026, Google Ads Help lists ads within AI Overviews in English in 12 countries, including the US, Canada, Australia and India. Japan is not listed. Regular search ads above and below AI Overviews are eligible in all 200+ AI Overviews markets." },
        { q: "Can a dental practice or clinic advertise in ChatGPT?", a: "OpenAI says ads are not eligible near sensitive topics such as health, mental health or politics. Expect ads to be hard to show next to medical answers, and start with AEO that publishes accurate services and hours." },
        { q: "If we allow OAI-AdsBot, is our content used for training?", a: "According to OpenAI, OAI-AdsBot only visits pages submitted as ads and its data is not used to train foundation models. Training is GPTBot, which you can handle separately." },
        { q: "How should ads be handled when measuring AI visibility?", a: "Don't count an ad as an appearance; record \"ad shown\" separately. Measure ad results in the ads manager and keep them out of the AEO report." },
        { q: "With a small budget, ads or AEO?", a: "Start by making the site's facts accurate and consistent: both the ad landing page and the AI answer read the same site. Then use ads for products that need leads now, and AEO for facts you want the AI to get right. AI answers change either way, so record results and decide from them." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check how AI reads the site behind your ads",
        body: "The free check needs no sign-up: enter a URL to see structured data, llms.txt and AI crawler access. Use it before an ad pitch to confirm the site's facts are in order.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "ChatGPT is a trademark of OpenAI; Google, Google Ads and AI Overviews of Google LLC; Perplexity of Perplexity AI; Claude of Anthropic, PBC. WordPress is a trademark of the WordPress Foundation. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
