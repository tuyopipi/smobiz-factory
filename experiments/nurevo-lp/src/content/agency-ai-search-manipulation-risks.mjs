// Content page: for web agencies / SEO firms / WordPress care companies - what
// to do when a client asks for AI search "tricks" (hidden instructions for AI,
// AI-only pages, self-ranking "best of" lists, fake reviews, networks of
// sites posing as independent, mass location pages, structured data that the
// page does not show). Judgement table, grey-zone lines, a refusal email, a
// contract clause, an audit of an existing site and the WordPress steps.
//
// Written 2026-11-21 14時 (JST).
//
// Nurevo AEO facts (experiments/webmcp-canary/wordpress-plugin/webmcp-canary,
// 0.9.2, readme.txt and source):
// - The plugin never reads HTTP_USER_AGENT (grep, 2026-11-21): every visitor
//   and crawler gets the same HTML; JSON-LD is server-rendered into the page.
//   robots.txt groups per crawler are the normal, documented exception.
// - FAQPage is published only on the page where the Nurevo FAQ block or
//   [nurevo_faq] is placed and shown; nothing for an FAQ not shown (readme).
// - Business data extraction fills blanks only; typed values never overwritten.
// - Product aggregateRating only when the WooCommerce product has a rating
//   above 0 and at least one review (includes/site-types.php).
// - Per-page panel: leave out of llms.txt, no Nurevo structured data.
// - Free AI check: three questions a month on Perplexity built from business
//   type and area, never the business name. Pro measurement (beta) on
//   Perplexity, numbers indicative; no plugin can guarantee a mention.
// - Partner page: agencies join as referral partners.
//
// Outside facts and where they were read (2026-11-21):
// - Search Engine Roundtable 41331 (2026-05-15): Google updated Search Central
//   documentation to state the Google Search spam policies also apply to
//   generative AI responses in Google Search; changelog anchor linked.
//   Search Engine Land 477657: new intro line adds "attempting to manipulate
//   generative AI responses in Google Search". PPC Land (2026-05-16): no new
//   rules introduced. Google's own spam-policies page and changelog could not
//   be fetched in this run (permission timeout), so the article links them as
//   the originals and attributes the wording to the two reports.
// - Anthropic Usage Policy (anthropic.com/aup, effective 2026-11-12), under
//   "Do Not Engage in Deceptive Campaigns or Artificial Activity": do not
//   manipulate the sources search engines or AI systems draw answers from by
//   seeding content that misrepresents its origin, authorship or independence
//   (e.g. networks of sites posing as unaffiliated sources); sockpuppets,
//   astroturfing, fake reviews; and do not market or sell any of the above as
//   a service. It applies to use of Claude.
// - 消費者庁 ステルスマーケティング page and Q&A: from 2023-10-01 an ad that
//   consumers cannot tell is an ad violates 景品表示法 (令和5年内閣府告示第19号);
//   the business (advertiser) is regulated, not the influencer; Q2 措置命令;
//   Q3 employee posts depend on role; Q6 review-for-discount normally not
//   covered, covered if a 5-star rating or recommending comment is required;
//   Q10 quoting only favourable survey answers is covered; Q11 labels
//   「広告」「宣伝」「プロモーション」「PR」 or a sentence; Q20 old posts.
// - Lily Ray (Substack, 2026-06-17): her sample of 100 B2B "best [category]
//   software" queries via Ahrefs Brand Radar (Apr-Jun 2026): 224 of 323
//   self-promoting listicle citations (69%) were not recommended in the AI
//   Overview answer. Her own sample, cause not proven - stated as such.
// - Search Engine Land (Myriam Jessier), hidden prompt injection: an informal
//   test where hidden prompts had no visible effect in ChatGPT and Perplexity.
//   Used only to say such tests exist, not as proof.
// Top articles read 2026-11-21: uravation aio-taisaku-ng-patterns
// (2026-07-13), jinrai geo-prohibited-practices (2026-11-18), sungrove
// aio-dont-no (2026-11-16 update), mynavi llmo_guide-3 (2026-09-16),
// biz-journal (2025-07), onamae (2025-07); Similarweb black-hat-geo
// (2026-02-26, mod. 2026-05-20), Lily Ray (2026-06-17), Citable (2026-06-25),
// Search Engine Land hidden prompt injection. searchengineland 463684 and
// emarketed could not be fetched. BBC 2026-05-19 not read.
// Not stated on purpose: Google's exact list of policy names from its own page,
// recovery times, traffic-loss percentages (unsourced in the top articles),
// legal conclusions (the clause sample says to have a lawyer check it).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  spam: "https://developers.google.com/search/docs/essentials/spam-policies",
  spamJa: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja",
  updates: "https://developers.google.com/search/updates",
  ser: "https://www.seroundtable.com/google-spam-policies-apply-ai-responses-41331.html",
  sel: "https://searchengineland.com/google-updates-search-spam-policies-to-clarify-it-applies-to-generative-ai-responses-477657",
  aup: "https://www.anthropic.com/legal/aup",
  caa: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
  caaFaq: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/faq/stealth_marketing/",
  lily: "https://lilyraynyc.substack.com/p/why-calling-yourself-the-best-could",
  selInjection: "https://searchengineland.com/hidden-prompt-injection-black-hat-trick-ai-outgrew-462331",
  manualJa: "https://support.google.com/webmasters/answer/9044175?hl=ja",
  manualEn: "https://support.google.com/webmasters/answer/9044175?hl=en",
  richResults: "https://search.google.com/test/rich-results",
};

const MAIL = `件名：AI検索対策のご相談について（ご提案の変更）

◯◯様

先日ご相談いただいた「AIに向けた隠しテキスト」と「当社を1位にしたおすすめ記事」の件、
社内で確認しましたので、ご報告します。

結論から申し上げると、この2つは当社では実施しません。理由は次のとおりです。
1. Googleは2026年5月15日に、スパムに関するポリシーがAIによる概要などの
   AIの回答にも適用されることを、ドキュメントで明確にしました。
   違反と判断されると、検索での表示が下がったり、表示されなくなったりします。
2. 中立の比較に見せた自社の宣伝は、景品表示法のステルスマーケティング規制
   （2023年10月1日から）に触れるおそれがあります。対象になるのは御社です。

代わりに、同じ目的（AIに御社の強みを正しく伝える）のために、次を提案します。
・料金・対応エリア・実績の数字を、根拠と時点つきで本文に書く
・「◯◯と△△の違い」のページを、自社のページであると明記して作る
・お客様の声を、条件をつけずに集める仕組みを作る

お見積もりは、この内容で作り直してお送りします。
ご不明な点があれば、お気軽にお問い合わせください。`;

const MAIL_EN = `Subject: Your AI search request - a change to our proposal

Hi <name>,

We looked at the two ideas you raised: hidden text written for AI, and a
"best providers" article that ranks your company first.

We won't do either, for two reasons:
1. On 15 May 2026 Google updated its documentation to make clear that its
   spam policies also apply to AI responses in Google Search, such as AI
   Overviews. Sites found in breach can rank lower or drop out of results.
2. Advertising made to look like a neutral review can break consumer-protection
   or advertising-disclosure rules, and the advertiser is usually the one held
   responsible.

Here is what we suggest instead, for the same goal (AI describing your
strengths accurately):
- State prices, service areas and results on the page, with sources and dates
- Publish a comparison page that says clearly it is written by you
- Set up a way to collect customer reviews without conditions attached

We'll send a revised quote on this basis. Happy to talk it through.`;

const CLAUSE = `（AI検索対策の実施方針）
第◯条　乙（制作会社）は、本業務において、次の手法を用いない。
  (1) 閲覧者に見えない文字・指示をページに置くこと
  (2) 検索エンジンやAIのクローラーにだけ、閲覧者と異なる内容を返すこと
  (3) 第三者の中立な評価に見える形で、甲（お客様）の広告を表示すること
      （広告である旨を明示する場合を除く）
  (4) 実在しない人物・利用者による口コミ・紹介を作成すること
  (5) ページに表示されていない事実を構造化データに記載すること
2　甲が前項の手法の実施を求めた場合、乙はこれを断ることができ、
   断ったことを理由に本契約の債務不履行とはならない。
3　AIの回答は日や質問により変わるため、乙はAIの回答への表示・順位を保証しない。
※この条文は例です。実際の契約書は弁護士に確認してください。`;

const CLAUSE_EN = `(AI search methods)
1. In performing the services, the Agency will not:
   (a) place text or instructions on a page that visitors cannot see;
   (b) return different content to search engine or AI crawlers than to visitors;
   (c) present the Client's advertising as an independent, neutral review,
       unless it is clearly labelled as advertising;
   (d) create reviews or endorsements from people who do not exist or are not
       real customers;
   (e) put facts in structured data that the page does not show.
2. If the Client asks for any of the above, the Agency may decline, and
   declining is not a breach of this agreement.
3. AI answers vary by day and by question; the Agency does not guarantee
   appearance or position in any AI answer.
Note: this is a sample. Have a lawyer review the wording for your contract.`;

const AUDIT = `# 1. 見えない文字やAIへの指示がないか（トップと主なページで）
curl -s https://www.example.jp/ | grep -inE 'display: ?none|visibility: ?hidden|font-size: ?0|ChatGPT|Perplexity|AI assistant|ignore (all|previous)'

# 2. AIのクローラーとブラウザに同じ内容を返しているか（行数と差分）
curl -s -A 'Mozilla/5.0' https://www.example.jp/ > browser.html
curl -s -A 'OAI-SearchBot' https://www.example.jp/ > bot.html
wc -c browser.html bot.html; diff <(sed 's/nonce="[^"]*"//g' browser.html) <(sed 's/nonce="[^"]*"//g' bot.html) | head

# 3. WordPressの投稿の中に隠しの書き方がないか
wp post list --post_type=any --post_status=publish --s='display:none' --fields=ID,post_title,post_type
wp db query "SELECT ID, post_title FROM $(wp db prefix)posts WHERE post_status='publish' AND post_content REGEXP 'visibility:[ ]*hidden|font-size:[ ]*0'"

# 4. 短期間に量産されたページがないか（月ごとの公開数）
wp db query "SELECT DATE_FORMAT(post_date,'%Y-%m') m, COUNT(*) FROM $(wp db prefix)posts WHERE post_status='publish' AND post_type IN ('post','page') GROUP BY m ORDER BY m DESC LIMIT 12"

# 5. 構造化データの型と評価（AggregateRating・Review）がどこに出ているか
curl -s https://www.example.jp/ | grep -o '"@type": *"[A-Za-z]*"' | sort | uniq -c`;

const AUDIT_EN = `# 1. Hidden text or instructions aimed at AI (home page and key pages)
curl -s https://www.example.com/ | grep -inE 'display: ?none|visibility: ?hidden|font-size: ?0|ChatGPT|Perplexity|AI assistant|ignore (all|previous)'

# 2. Do AI crawlers and browsers get the same content? (size and diff)
curl -s -A 'Mozilla/5.0' https://www.example.com/ > browser.html
curl -s -A 'OAI-SearchBot' https://www.example.com/ > bot.html
wc -c browser.html bot.html; diff <(sed 's/nonce="[^"]*"//g' browser.html) <(sed 's/nonce="[^"]*"//g' bot.html) | head

# 3. Hidden styling inside WordPress posts
wp post list --post_type=any --post_status=publish --s='display:none' --fields=ID,post_title,post_type
wp db query "SELECT ID, post_title FROM $(wp db prefix)posts WHERE post_status='publish' AND post_content REGEXP 'visibility:[ ]*hidden|font-size:[ ]*0'"

# 4. Pages mass-produced in a short time (published per month)
wp db query "SELECT DATE_FORMAT(post_date,'%Y-%m') m, COUNT(*) FROM $(wp db prefix)posts WHERE post_status='publish' AND post_type IN ('post','page') GROUP BY m ORDER BY m DESC LIMIT 12"

# 5. Which structured data types and ratings (AggregateRating, Review) appear
curl -s https://www.example.com/ | grep -o '"@type": *"[A-Za-z]*"' | sort | uniq -c`;

export default {
  slug: "agency-ai-search-manipulation-risks",
  targetQueries: [
    "AI検索対策 やってはいけない 制作会社",
    "LLMO 不正 手法 リスク 断り方",
    "GEO ブラックハット スパムポリシー AI",
    "black hat GEO risks agency client",
    "Google spam policy AI Overviews manipulation",
    "self-promotional listicle AI search risk",
  ],
  related: ["agency-aeo-first-audit-proposal", "agency-aeo-monthly-service", "faq-page-ai-search", "agency-content-refresh-service", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "AI検索の不正な手法を頼まれたら：制作会社の判断表と断り方 | Nurevo",
      description: "お客様に「AI向けの隠しテキスト」「自社1位のおすすめ記事」などを頼まれたときの、制作会社向けの判断表。2026年のGoogle・Anthropic・ステマ規制、断りのメール文例、契約の条文例、既存サイトの点検手順。",
      h1: "AI検索の不正な手法をお客様に頼まれたとき：制作会社の判断表・断り方・点検の手順",
      lead: "お客様から「AIにだけ見える文字を入れてほしい」「自社を1位にしたおすすめ記事を作ってほしい」と頼まれたら、制作会社は断り、同じ目的に効く正攻法を代わりに出すのが安全です。Googleは2026年5月15日に、スパムに関するポリシーがAIによる概要などのAIの回答にも適用されることをドキュメントで明確にし、日本では2023年10月からステルスマーケティングが景品表示法の規制対象です。この記事では、依頼されやすい手法ごとの判断表、グレーな依頼の線引き、断りのメールと契約の条文の例、既存サイトの点検コマンドをまとめます。",
      intro: [
        "作成日：2026年11月21日（JST）。対象は、お客様のサイトを作る・保守する制作会社、SEO会社、WordPressの保守会社、フリーランスのWeb担当者です。法律の判断が必要な場面では、弁護士や所管の窓口に確認してください。この記事は法的な助言ではありません。",
        "AIの回答は日や聞き方によって変わります。この記事は、お客様のサイトを検索とAIの両方で安全に保つためのもので、AIの回答に出ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれている記事と、足りないこと",
          paragraphs: [
            "「AI検索対策 やってはいけない」「LLMO 不正」「black hat GEO」などで上位に出る日本語6本と英語4本を、2026年11月21日に読みました。日本語では、Uravation（2026年7月13日）、仁頼（2026年11月18日）、サングローブ（2026年11月16日更新）がNGの一覧を載せ、マイナビの連載とお名前.comの記事はLLMOの進め方の中で注意点に触れています。英語では、Similarweb（2026年2月26日、5月20日更新）、Lily Ray（2026年6月17日）、Citable（2026年6月25日）、Search Engine Land の隠しプロンプトの記事を読みました。",
            "隠しテキスト・低品質な記事の量産・自作自演の口コミをやめる、という結論はほぼすべての記事で一致しています。一方で、制作会社がお客様の依頼に答える場面に必要な次の点は、ほとんど書かれていませんでした。",
          ],
          table: {
            head: ["足りない点", "この記事で書いていること"],
            rows: [
              ["NGの一覧はあるが、「お客様に頼まれたとき、どう断るか」がない", "断りのメールの文例と、代わりに出す提案"],
              ["Googleのポリシーの名前は出るが、2026年5月の変更と日本のステマ規制を一緒に整理した記事が少ない", "Google・Anthropic・消費者庁の3つの決まりを1つの表に"],
              ["「自社比較はダメ」か「OK」か、記事によって書き方が違う", "グレーな依頼の線引きの表（明記すればよいこと・条件つきで注意すること）"],
              ["契約書・作業範囲に何を書くかがない（Citableが1行触れるだけ）", "契約の条文の例"],
              ["既存のサイトに、前の業者が入れた手法が残っていないかの調べ方がない", "curl と WP-CLI の点検コマンド"],
              ["WordPressでの扱いがない", "WordPressで出力が「見えている内容と同じ」になっているかの確かめ方"],
            ],
            caption: "上位の記事には「数日で流入が60〜80%減る」「回復に3〜6か月」といった数字もありましたが、出典が書かれていないため、この記事では使っていません。",
          },
        },
        {
          heading: "2026年の前提：3つの決まり",
          paragraphs: [
            "AI検索のための「裏技」を断る根拠として、制作会社がお客様に示せる決まりは、主に次の3つです。どれも新しい禁止事項を一から作ったというより、これまでの決まりがAIの回答にも及ぶことをはっきりさせたものです。",
          ],
          table: {
            head: ["決まり", "いつから", "中身", "誰が対象か"],
            rows: [
              [`Googleのスパムに関するポリシー（[原文](${SRC.spamJa})）`, "2026年5月15日に明確化", `Search Engine Roundtable の報道によると、Googleはドキュメントを更新し、スパムに関するポリシーがGoogle検索の生成AIの回答（AIによる概要・AIモード）にも適用されると書きました（[記事](${SRC.ser})、[更新履歴の原文](${SRC.updates})）。Search Engine Land は、ポリシーの冒頭に「生成AIの回答を操作しようとすること」が加わったと伝えています（[記事](${SRC.sel})）`, "サイト（違反と判断されると、検索での表示が下がる、または表示されなくなる）"],
              [`Anthropicの利用ポリシー（[原文](${SRC.aup})）`, "2026年11月12日から", "検索エンジンやAIが答えに使う情報源に、出どころ・書き手・独立性を偽った内容（無関係を装った複数のサイトが同じ主張を裏づけ合う、など）を流して操作すること、サクラ・なりすまし・偽の口コミ、そしてそれらをサービスとして売ることを禁止", "Claudeを使う人と会社（制作会社がClaudeで原稿を書く場合も含む）"],
              [`景品表示法のステルスマーケティング規制（[消費者庁](${SRC.caa})）`, "2023年10月1日から", "広告なのに、広告だと一般の消費者が分からない表示を規制", "広告を出す事業者（お客様）。依頼を受けたインフルエンサーなどは対象外"],
            ],
            caption: "Googleのポリシーの原文は、この記事の作成時に取得できなかったため、文言は2本の報道の記述によります。判断に使う前に、原文と更新履歴を読んでください。",
          },
          after: [
            "ステマ規制で対象になるのは、広告を出すお客様のほうで、記事を作った制作会社ではありません（消費者庁のQ&A Q1）。だからこそ、お客様に説明しておく価値があります。違反すると、消費者庁から措置命令（やめること・再発防止などの命令）を受けることがあります（同 Q2）。",
          ],
        },
        {
          heading: "依頼されやすい手法の判断表",
          paragraphs: [
            "お客様から実際に頼まれやすい手法を、根拠と代わりにやることと一緒に並べます。左の列の言い方は、お客様がよく使う言い方に近づけています。",
          ],
          table: {
            head: ["頼まれる手法", "判断", "なぜ", "代わりにやること"],
            rows: [
              ["「AIにだけ伝わる文字」を白文字・display:none・極小の文字で入れる。「AIへの指示」をHTMLのコメントに書く", "断る", "Googleのスパムに関するポリシーの隠しテキストに当たる。AIに向けた隠し指示が効かなかったという検証も出ている（[Search Engine Land](" + SRC.selInjection + ")、個人の簡単な検証）", "伝えたいことを本文の見える場所に書く。冒頭の2文で答える"],
              ["AIのクローラーにだけ、別の内容のページを返す（クローキング）", "断る", "閲覧者と検索エンジンで違う内容を見せるのは、スパムに関するポリシーのクローキングに当たる", "誰が見ても同じHTMLにする。AI向けの要約は llms.txt に本文と同じ事実で"],
              ["自社を1位にした「◯◯のおすすめ10選」を、中立の比較に見せて載せる", "そのままでは断る", "広告だと分からない形なら、ステマ規制のおそれ。Lily Rayの100の質問の調査では、自社を推す一覧記事の引用323件のうち224件（69%）は、AIの答えの中では推薦されていなかった（[記事](" + SRC.lily + ")、本人の標本で原因は未証明）", "自社のページだと明記し、比べる基準と他社の強みも書いた比較ページにする"],
              ["社員やその家族に口コミを書いてもらう／星5を条件に割引する", "断る", "事業者が内容を決めた口コミは広告になりうる。星5や推薦のコメントを条件にした割引はステマ規制の対象（消費者庁 Q&A Q6）", "条件をつけずに口コミを頼む。悪い評価にも返信する"],
              ["独立した紹介サイトやブログを何個も作り、互いにお客様を推す", "断る", "Anthropicの利用ポリシーが例に挙げる「無関係を装ったサイトのネットワーク」そのもの。Googleのリンクのスパムにも当たりうる", "業界団体・取引先・メディアなど、実在する第三者に載る理由（実績・データ）を作る"],
              ["地域名だけ変えた「◯◯市の△△」ページを何十枚も作る", "断る", "大量のページを中身なく作るのは、スパムに関するポリシーの大量生成コンテンツや誘導ページに当たりうる", "実際に対応している地域を1ページにまとめ、地域ごとに違う事実（到着時間・料金・事例）があるときだけ分ける"],
              ["ページに書いていないFAQや評価（星の数）を構造化データにだけ入れる", "断る", "構造化データはページに見えている内容と一致させるのがGoogleの決まり", "FAQは見えるページに置き、評価は実際のレビューがあるときだけ出す"],
              ["「AIで1位にします」という外部の業者・ツールに頼む", "勧めない", "AIの回答は変わるため保証できない。上の手法を使っていることが多い", "決めた質問で表示を記録し、事実の追加で改善を確かめる"],
            ],
            caption: "「判断」は制作会社としてのこの記事のすすめです。法律の当てはまりは、個別の事情で変わります。",
          },
        },
        {
          heading: "グレーな依頼の線引き",
          paragraphs: [
            "すべてを断る必要はありません。次のような依頼は、書き方を変えれば受けられます。境目は「読む人が、誰が書いたか・広告かどうかを分かるか」と「ページに見えている事実と同じか」の2点です。",
          ],
          table: {
            head: ["依頼", "受けてよい形", "注意すること"],
            rows: [
              ["自社と他社の比較ページ", "自社のページだと分かる場所に置き、比べた基準・時点・他社が向いている場合も書く", "「業界No.1」などの数字は根拠と時点を書く。根拠がなければ書かない"],
              ["メディアや紹介サイトへの掲載（料金を払うもの）", "「広告」「PR」「プロモーション」と分かる表示をしてもらう（消費者庁 Q&A Q11）", "表示がコメント欄だけ、動画の冒頭だけでは足りないことがある（同 Q14・Q15）"],
              ["お客様の声を載せる", "条件をつけずに集めた声を載せる", "良い声だけを選んで載せると規制の対象になりうる（同 Q10）。インフルエンサーの投稿を「お客様の声」にしない（同 Q16）"],
              ["社員のSNSでの紹介", "会社の人だと分かる形で投稿する", "役職によっては会社の表示とみなされる（同 Q3）。肩書だけでは広告の表示として足りない（同 Q12）"],
              ["AIを使った記事づくり", "事実の確認と、人の手での編集を入れる。自社の事実・データを足す", "本数を目標にしない。似た記事を言い回しだけ変えて増やさない"],
              ["llms.txt を置く", "本文と同じ事実を、本文へのリンクつきで", "本文にない宣伝文句をAI向けにだけ書かない"],
            ],
          },
        },
        {
          heading: "お客様への断り方：メールの文例",
          paragraphs: [
            "断るときは、①結論、②理由（決まりの名前と日付）、③同じ目的に効く代わりの提案、の順に書くと、お客様も社内で説明しやすくなります。「リスクがあるのでやめましょう」だけだと、別の業者に頼まれて終わることが多いからです。",
          ],
          code: MAIL,
          after: [
            "理由には、制作会社の好みではなく、外の決まり（Googleのポリシー、消費者庁の規制）を書きます。お客様が上司に説明するとき、そのまま使えるからです。代わりの提案は、お客様の本当の目的（「AIに推薦されたい」「競合より強く見せたい」）に合わせて選びます。",
          ],
        },
        {
          heading: "契約と作業範囲に書いておくこと",
          paragraphs: [
            "あとで「前の担当者はやってくれた」「契約に含まれるはずだ」と言われないように、使わない手法を契約や作業範囲の書類に書いておきます。次は条文の例です。",
          ],
          code: CLAUSE,
          after: [
            "月額の保守やAI検索対策のサービスで、「AIに表示される回数」を成果として約束する契約は、上の手法を使う動機になります。成果には、事実の整備（何を足したか）と、決めた質問での記録を使うのが安全です（[月額サービスにする方法](/guide/agency-aeo-monthly-service)）。",
          ],
        },
        {
          heading: "引き継いだサイトの点検：前の業者が入れたものを探す",
          paragraphs: [
            "保守や作り直しを引き継いだサイトには、前の業者やプラグインが入れた手法が残っていることがあります。次のコマンドで、隠しの書き方、クローラーにだけ違う内容、量産の跡、構造化データの型を確かめます。結果はあくまで手がかりで、display:none はメニューやアコーディオンでも普通に使われるため、見つかったものを1つずつ目で確かめます。",
          ],
          code: AUDIT,
          after: [
            "2番で大きさや中身が大きく違う場合は、プラグインやサーバーの設定でユーザーエージェントによる出し分けがないかを確かめます。キャッシュや広告で多少の差は出ます。Search Consoleでは、「セキュリティと手動による対策」の「手動による対策」レポートに、Googleが人の手で判断した違反が出ます（[ヘルプ](" + SRC.manualJa + ")）。違反が出ていたら、原因を直してから再審査をリクエストします。",
            "量産されたページが見つかったら、中身のあるページに統合する、残す価値のないものは外す、のどちらかにします。判断の進め方は[既存記事の見直しを月額サービスにする方法](/guide/agency-content-refresh-service)にまとめています。",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEOを使う場合）",
          paragraphs: [
            `ここでは、無料のプラグイン[Nurevo AEO](${WP_ORG})を使う場合に、AI向けの出力が「見えている内容と同じ」になっているかの確かめ方を書きます。別のプラグインや手作業でも、見るところは同じです。`,
          ],
          list: [
            "Nurevo AEOは、訪問者のユーザーエージェントを読みません。構造化データはページのHTMLの中にサーバーで出力されるので、ブラウザもAIのクローラーも同じものを受け取ります。robots.txt のクローラーごとの行は、この例外ではなく通常の設定です。",
            "FAQの構造化データ（FAQPage）は、「Nurevo FAQ」ブロックか [nurevo_faq] を置いて、質問が画面に出ているページにだけ出ます。見えていないFAQの構造化データは出ません。",
            "商品の評価（AggregateRating）は、WooCommerceの商品にレビューがあるときだけ出ます。評価の数字を手で入れる欄はありません。",
            "会社の情報は、SEOプラグインの設定や公開されている内容から空欄だけを埋め、入力した値は上書きしません。管理画面の値と本文が食い違っていないかを、診断の結果と合わせて確かめます。",
            "量産されたページや広告のページは、投稿ごとの「Nurevo AEO」パネルで llms.txt から外し、構造化データも止められます。ただし、ページそのものを残すかどうかは別に判断します。",
            "無料のAIチェックは、毎月3つの質問を業種と地域から作り、会社の名前を入れずにPerplexityに聞きます。社名で聞けば出るのは当たり前なので、操作ではなく事実の整備で変わったかを見るのに使えます。Proの計測（ベータ）の数字も目安として読みます。",
            `点検のあと、主なページを[リッチリザルト テスト](${SRC.richResults})で開き、構造化データの値がページの文字と同じかを確かめます。`,
          ],
        },
        {
          heading: "断ったあとのチェックリスト",
          list: [
            "お客様に、結論・決まりの名前と日付・代わりの提案をメールで送った。",
            "見積もりと作業範囲を、代わりの提案の内容で作り直した。",
            "契約に、使わない手法と保証しないことを書いた（弁護士の確認つき）。",
            "トップと主なページで、見えない文字やAIへの指示がないことを確かめた。",
            "ブラウザとAIのクローラーで同じHTMLが返ることを確かめた。",
            "短期間に量産されたページがないか、月ごとの公開数を見た。",
            "FAQや評価の構造化データが、見えている内容と同じことを確かめた。",
            "比較ページ・PR記事に、自社のページ・広告であることが分かる表示がある。",
            "口コミの依頼に、星5などの条件をつけていない。",
            "成果の報告を、社名なしの決めた質問の記録で行う形にした。",
          ],
        },
      ],
      faqs: [
        { q: "隠しテキストは、Googleにはばれなくても、ChatGPTやPerplexityには効きませんか？", a: "効くという確かな資料は見つかりませんでした。各社はAIへの隠し指示を防ぐ仕組みを公開しており、効かなかったという検証もあります。効いたとしても一時的で、Googleの検索では隠しテキストとして違反になるため、割に合いません。" },
        { q: "自社のサイトで、自社を含めた比較記事を書くのは全部だめですか？", a: "だめではありません。自社のページだと分かること、比べた基準と時点を書くこと、他社が向いている場合も書くことが条件です。中立の第三者の評価に見せる形にしないことが境目です。" },
        { q: "ステマ規制で罰せられるのは制作会社ですか？", a: "消費者庁のQ&Aでは、対象になるのは表示の内容を決めた事業者（広告主）で、依頼を受けた第三者は対象外とされています。そのため、お客様に説明して、お客様自身が判断できるようにすることが大切です。" },
        { q: "Googleの2026年5月の変更で、新しく禁止された手法はありますか？", a: "報道によると、新しいルールを作ったのではなく、これまでのスパムに関するポリシーがAIによる概要やAIモードの回答にも適用されることを明確にしたものです。原文の更新履歴で確かめてください。" },
        { q: "Anthropicの利用ポリシーは、Claudeを使わない制作会社にも関係しますか？", a: "ポリシーが直接決めるのはClaudeの使い方です。ただ、どんな手法をAIの会社が「欺く行為」と見ているかが分かるので、ChatGPTなど別のAIを使う場合も、断る理由の説明に使えます。" },
        { q: "前の業者が入れた隠しテキストを見つけました。どうすればよいですか？", a: "お客様に見せて、消してよいかを確認してから外します。Search Consoleの手動による対策レポートも確かめ、違反が出ていれば直したあとに再審査をリクエストします。外した日を記録しておくと、あとで変化を比べられます。" },
        { q: "正攻法だけで、AIに推薦されるようになりますか？", a: "保証はできません。AIの回答は日や聞き方で変わります。できるのは、料金・対応エリア・実績などの事実を根拠つきでページに書き、AIが正しく読める状態にすることと、その変化を同じ質問で記録することです。" },
      ],
      relatedHeading: "あわせて読みたい",
      cta: {
        heading: "引き継いだサイトを、AIがどう読んでいるか確認",
        body: "無料のチェックは登録不要です。URLを入れると、構造化データ・llms.txt・AIのクローラーの扱いを確かめられます。点検の最初の一歩に使えます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: PARTNER },
      },
      footnote: "ChatGPT・OAI-SearchBotはOpenAI、PerplexityはPerplexity AI、ClaudeはAnthropic、Google・Search ConsoleはGoogle LLCの商標です。WordPress、WooCommerceはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Clients Asking for AI Search Tricks: An Agency Guide | Nurevo",
      description: "When a client asks for hidden text for AI, self-ranking lists or fake reviews: a judgement table, the 2026 rules, a refusal email, a contract clause and an audit.",
      h1: "When a client asks for AI search tricks: a judgement table, a refusal script and an audit for agencies",
      lead: "When a client asks you to add text only AI can see, or to publish a \"best providers\" list that ranks them first, the safe answer for an agency is to decline and offer a legitimate way to reach the same goal. On 15 May 2026 Google updated its documentation to make clear that its spam policies also apply to AI responses in Google Search, such as AI Overviews and AI Mode, and disguised advertising is regulated in many markets. This guide gives a table of commonly requested tactics, where the grey zone ends, a refusal email, a contract clause and commands to audit a site you inherit.",
      intro: [
        "Written 21 November 2026 (JST). For agencies, SEO firms, WordPress care companies and freelancers who build or maintain client sites. Where a legal judgement is needed, ask a lawyer or the regulator. This guide is not legal advice.",
        "AI answers change by day and by wording. The steps here keep a client's site safe in both search and AI; they do not guarantee an appearance in any AI answer.",
      ],
      sections: [
        {
          heading: "What the top-ranking guides cover, and what they leave out",
          paragraphs: [
            "On 21 November 2026 we read the pages ranking for \"black hat GEO\", \"AI search what not to do\" and similar queries: four in English (Similarweb, 26 February 2026, updated 20 May; Lily Ray, 17 June 2026; Citable, 25 June 2026; and a Search Engine Land piece on hidden prompt injection) and six in Japanese, three of which list tactics to avoid (Uravation, Jinrai, Sungrove).",
            "They agree on the basics: no hidden text, no mass-produced thin content, no fake reviews. What an agency needs when a client actually asks for one of these was mostly missing.",
          ],
          table: {
            head: ["Gap", "What this guide adds"],
            rows: [
              ["Lists of tactics, but nothing on how to say no to a client", "A refusal email and the alternatives to offer"],
              ["Google's policies are named, but the May 2026 change and advertising-disclosure rules are rarely set side by side", "Three rules from Google, Anthropic and Japan's Consumer Affairs Agency in one table"],
              ["Guides disagree on whether comparison pages that include yourself are allowed", "A grey-zone table: what is fine if disclosed, what needs care"],
              ["Nothing on contracts or scope documents (Citable mentions it in one line)", "A sample contract clause"],
              ["No way to check whether a previous vendor left these tactics on a site", "curl and WP-CLI audit commands"],
              ["No WordPress specifics", "How to confirm that AI-facing output matches what visitors see"],
            ],
            caption: "Some of the top pages quote figures such as \"60-80% traffic loss within days\" or \"3-6 months to recover\" with no source, so we do not use them here.",
          },
        },
        {
          heading: "The 2026 baseline: three rules",
          paragraphs: [
            "These are the rules an agency can point to when declining. None of them invents a brand-new ban; each makes clear that existing standards reach AI answers too.",
          ],
          table: {
            head: ["Rule", "Since", "What it says", "Who it applies to"],
            rows: [
              [`Google Search spam policies ([original](${SRC.spam}))`, "Clarified 15 May 2026", `According to Search Engine Roundtable, Google updated its documentation to say the spam policies also apply to generative AI responses in Google Search, i.e. AI Overviews and AI Mode ([report](${SRC.ser}), [Google's changelog](${SRC.updates})). Search Engine Land reports that the policy's opening line now includes attempts to manipulate generative AI responses ([report](${SRC.sel}))`, "Sites (if found in breach, they can rank lower or not appear at all)"],
              [`Anthropic Usage Policy ([original](${SRC.aup}))`, "In effect from 12 November 2026", "Bans manipulating the sources search engines or AI systems draw answers from by seeding content that misrepresents its origin, authorship or independence (for example networks of sites posing as unaffiliated sources), sockpuppets, astroturfing and fake reviews, and selling any of these as a service", "People and companies using Claude, including agencies drafting copy with it"],
              [`Japan's stealth marketing rule under the Act against Unjustifiable Premiums and Misleading Representations ([Consumer Affairs Agency](${SRC.caa}))`, "From 1 October 2023", "Regulates advertising that ordinary consumers cannot tell is advertising", "The advertiser (your client), not the influencer hired to post"],
            ],
            caption: "We could not fetch Google's own policy page while writing, so the wording above follows the two reports. Read the original and the changelog before relying on it. Outside Japan, check your own market's advertising-disclosure and fake-review rules.",
          },
          after: [
            "Under the Japanese rule, the party held responsible is the advertiser, not the agency that produced the content (Consumer Affairs Agency Q&A, Q1). That is exactly why it is worth explaining to the client. A breach can lead to a cease-and-desist order (Q2).",
          ],
        },
        {
          heading: "A judgement table for commonly requested tactics",
          paragraphs: [
            "Here are the tactics clients actually ask for, phrased roughly as they ask, with the reason and what to do instead.",
          ],
          table: {
            head: ["Request", "Call", "Why", "Do this instead"],
            rows: [
              ["\"Text only AI can read\" in white, display:none or tiny type; \"instructions for AI\" in HTML comments", "Decline", "This is hidden text under Google's spam policies. Informal tests have found hidden prompts had no visible effect ([Search Engine Land](" + SRC.selInjection + "), a single author's test)", "Put the message in visible copy. Answer the question in the first two sentences"],
              ["Serve AI crawlers a different page (cloaking)", "Decline", "Showing search engines different content from users is cloaking under the spam policies", "Serve everyone the same HTML. Put an AI-friendly summary in llms.txt with the same facts"],
              ["A \"10 best X\" list ranking the client first, dressed as a neutral review", "Decline as asked", "If readers cannot tell it is advertising, disclosure rules may apply. In Lily Ray's sample of 100 queries, 224 of 323 citations of self-promoting lists (69%) were not recommended in the AI answer itself ([article](" + SRC.lily + "); her own sample, cause not proven)", "A comparison page clearly labelled as the client's own, with criteria and competitors' strengths"],
              ["Reviews by staff or relatives; a discount for five stars", "Decline", "Reviews whose content the business controls can count as advertising; a discount conditional on five stars or a recommendation is covered by the Japanese rule (Q&A Q6)", "Ask for reviews with no conditions, and reply to the bad ones too"],
              ["Several \"independent\" review sites or blogs that recommend the client", "Decline", "This is the very example in Anthropic's policy: networks of sites posing as unaffiliated. It can also be link spam for Google", "Give real third parties (associations, partners, media) a reason to mention the client: results, data"],
              ["Dozens of pages that only swap the city name", "Decline", "Large numbers of pages with no substance can fall under scaled content abuse or doorway abuse", "One service-area page; separate pages only where an area has its own facts (arrival time, prices, cases)"],
              ["FAQ or star ratings in structured data that the page does not show", "Decline", "Google requires structured data to match visible content", "Put the FAQ on a visible page; output ratings only when real reviews exist"],
              ["Hiring a vendor or tool that promises \"No. 1 in AI\"", "Advise against", "AI answers vary, so nobody can guarantee it; such vendors often rely on the tactics above", "Record a fixed set of questions and check improvements from added facts"],
            ],
            caption: "The \"call\" column is this guide's recommendation for an agency. Whether a law applies depends on the facts of each case.",
          },
        },
        {
          heading: "Where the grey zone ends",
          paragraphs: [
            "Not every request needs a no. The ones below are fine once the format changes. The test has two parts: can readers tell who wrote it and whether it is advertising, and does it match the facts visible on the page?",
          ],
          table: {
            head: ["Request", "Acceptable form", "Watch out for"],
            rows: [
              ["A comparison page including the client", "Clearly on the client's own site, with criteria, a date and cases where a competitor fits better", "Claims like \"industry No. 1\" need a source and a date, or should not appear"],
              ["Paid placement in media or review sites", "Labelled \"Ad\", \"PR\", \"Sponsored\" or similar (Q&A Q11)", "A label only in the comments, or only at the start of a video, may not be enough (Q14, Q15)"],
              ["Customer testimonials", "Testimonials collected without conditions", "Picking only the favourable ones can be covered (Q10). Do not relabel influencer posts as customer reviews (Q16)"],
              ["Staff promoting on social media", "Posts that make the employment clear", "Depending on role, posts may count as the company's own (Q3); a job title alone is not a sufficient label (Q12)"],
              ["Articles drafted with AI", "Fact-checked and edited by a person, with the client's own facts and data added", "Do not set article-count targets or reword the same piece into many"],
              ["Publishing llms.txt", "The same facts as the pages, with links to them", "No promotional claims written only for AI"],
            ],
          },
        },
        {
          heading: "How to say no: a sample email",
          paragraphs: [
            "Write it in three parts: the decision, the reason (the rule's name and date), and an alternative that serves the same goal. \"It's risky, let's not\" on its own usually ends with the client hiring someone else to do it.",
          ],
          code: MAIL_EN,
          after: [
            "Give outside rules as the reason, not your agency's taste; the client can forward them to a manager as they are. Pick the alternative to fit what the client actually wants, such as being recommended by AI or looking stronger than a competitor.",
          ],
        },
        {
          heading: "What to put in the contract and scope",
          paragraphs: [
            "To avoid \"the last agency did it\" or \"that was in the contract\" later, write the excluded methods into the agreement or the statement of work. A sample:",
          ],
          code: CLAUSE_EN,
          after: [
            "A retainer that promises a number of AI mentions as its outcome gives everyone a reason to reach for the tactics above. Report on what facts were added and on a fixed set of recorded questions instead ([selling AI search as a monthly service](/guide/agency-aeo-monthly-service)).",
          ],
        },
        {
          heading: "Auditing an inherited site",
          paragraphs: [
            "Sites you take over for care or a rebuild can carry tactics added by a previous vendor or plugin. These commands look for hidden styling, crawler-specific content, signs of mass production and the structured data types in use. Treat matches as leads only: display:none is normal in menus and accordions, so check each one by eye.",
          ],
          code: AUDIT_EN,
          after: [
            "If step 2 shows a large difference in size or content, look for user-agent switching in plugins or server settings; caching and ads cause small differences. In Search Console, the Manual actions report under Security & Manual Actions shows violations a Google reviewer has found ([help](" + SRC.manualEn + ")). Fix the cause, then request a review.",
            "If you find mass-produced pages, either merge them into a page with substance or remove the ones not worth keeping. The decision process is in [selling content refresh as a monthly service](/guide/agency-content-refresh-service).",
          ],
        },
        {
          heading: "Steps in WordPress (with Nurevo AEO)",
          paragraphs: [
            `Here is how to confirm, with the free plugin [Nurevo AEO](${WP_ORG}), that the AI-facing output matches what visitors see. With another plugin or by hand, check the same things.`,
          ],
          list: [
            "Nurevo AEO does not read the visitor's user agent. Structured data is rendered on the server into the page HTML, so browsers and AI crawlers receive the same thing. Per-crawler groups in robots.txt are ordinary configuration, not an exception to this.",
            "FAQ structured data (FAQPage) is output only on a page where the Nurevo FAQ block or [nurevo_faq] is placed and the questions are shown. Nothing is output for an FAQ that is not visible.",
            "Product ratings (AggregateRating) are output only when the WooCommerce product has reviews. There is no field to type a rating in.",
            "Business details are filled from your SEO plugin's settings and public content into empty fields only; values you typed are never overwritten. Check against the diagnosis that the admin values and the page copy agree.",
            "Mass-produced or advertising pages can be left out of llms.txt and have Nurevo's structured data switched off in the per-post Nurevo AEO panel. Whether to keep the page itself is a separate decision.",
            "The free AI check asks Perplexity three questions a month, built from business type and area and never the business name. A business appears when asked by name anyway, so this shows whether facts, not manipulation, changed anything. Read Pro measurement (beta) numbers as indicative too.",
            `After the audit, open key pages in the [Rich Results Test](${SRC.richResults}) and confirm structured data values match the visible text.`,
          ],
        },
        {
          heading: "Checklist after declining",
          list: [
            "The client received the decision, the rule's name and date, and an alternative by email.",
            "The quote and scope were redone around the alternative.",
            "The contract lists excluded methods and what is not guaranteed (reviewed by a lawyer).",
            "The home page and key pages carry no invisible text or instructions for AI.",
            "Browsers and AI crawlers receive the same HTML.",
            "Monthly publishing counts show no burst of mass-produced pages.",
            "FAQ and rating structured data match visible content.",
            "Comparison pages and paid placements are clearly labelled as the client's own or as advertising.",
            "Review requests carry no conditions such as five stars.",
            "Results are reported from a fixed set of recorded questions without the business name.",
          ],
        },
      ],
      faqs: [
        { q: "Even if Google catches hidden text, doesn't it still work on ChatGPT or Perplexity?", a: "We found no reliable evidence that it does. AI companies publish defences against hidden instructions, and informal tests found no effect. Even if it worked briefly, Google Search treats it as hidden text, so it is not worth the risk." },
        { q: "Is any comparison article that includes our own company off-limits?", a: "No. Make clear it is your own page, state the criteria and date, and say where competitors fit better. The line is presenting it as a neutral third-party review." },
        { q: "Under Japan's stealth marketing rule, is the agency the one penalised?", a: "The Consumer Affairs Agency Q&A says the rule covers the business that decided the content (the advertiser), not third parties asked to post. That is why the client needs the explanation, so they can decide for themselves." },
        { q: "Did Google's May 2026 change ban any new tactic?", a: "According to reports, it did not add new rules; it made clear that the existing spam policies apply to answers in AI Overviews and AI Mode. Check Google's changelog for the original wording." },
        { q: "Does Anthropic's Usage Policy matter to agencies that do not use Claude?", a: "It directly governs use of Claude. It is still useful when explaining a refusal, because it shows what an AI company treats as deceptive, whichever AI tool you use." },
        { q: "We found hidden text left by a previous vendor. What now?", a: "Show it to the client and remove it with their agreement. Check the Manual actions report in Search Console; if a violation is listed, request a review after fixing it. Record the date you removed it so you can compare later." },
        { q: "Will legitimate work alone get the client recommended by AI?", a: "That cannot be guaranteed. AI answers change by day and wording. What you can do is put facts such as prices, areas and results on the pages with sources, make sure AI can read them, and track changes with the same questions." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads a site you have just inherited",
        body: "The free check needs no sign-up: enter a URL to see the state of its structured data, llms.txt and AI crawler access. A good first step for an audit.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "ChatGPT and OAI-SearchBot are trademarks of OpenAI, Perplexity of Perplexity AI, Claude of Anthropic, and Google and Search Console of Google LLC. WordPress and WooCommerce are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies.",
    },
  },
};
