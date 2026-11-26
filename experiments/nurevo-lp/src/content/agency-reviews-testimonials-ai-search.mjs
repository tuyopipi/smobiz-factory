// Content page (agencies): reviews and testimonials for AI search — how to
// ask for reviews without breaking Google's Maps policy, Japan's stealth
// marketing rule or the FTC rule, how to write a testimonial page, why
// self-serving review stars should not go into LocalBusiness/Organization
// structured data, and how to sell and measure it as agency work.
// Separate from media-coverage-page-ai-search (third-party press coverage),
// agency-ai-search-manipulation-risks (refusing manipulation in general),
// bing-places-ai-search and multi-location-business-ai-search.
//
// Written 2026-11-26 14時 (JST).
//
// Outside facts and where they were read (2026-11-26):
// - Seer Interactive (2026-05-14, Nick Haigler; white paper with Trustpilot):
//   804,491 AI responses, 15,783 prompts, 1,926 brands, 8 verticals,
//   ChatGPT / Google AI Mode / Gemini / Perplexity, mostly March 2026.
//   Trust+review share of citations: 1.51% (awareness) → 16.24%
//   (evaluation) → 24.27% (intent). Median citation rate: no Trustpilot
//   profile 1% vs 1–13 reviews 53.5%. ChatGPT used TrustScore or stars in 59%
//   of Trustpilot-citing responses.
// - Whitespark (2025-08-26, upd. 09-15): Bing Places review sources, 153
//   queries, 17 categories, 9 US cities: Facebook 716, Yelp 482, TripAdvisor
//   217. Measures Bing Places, not ChatGPT answers.
// - mov (訪日ラボ, 2026-10-29, upd. 11-13), own web survey: after AI
//   suggested a place, checked Google Maps: 飲食 46.0%, 宿泊 49.4%;
//   searched again to read reviews: 飲食 45.4%, 宿泊 62.9%.
// - Google review snippet (ja, last updated 2026-09-17): LocalBusiness and
//   Organization only for sites that collect reviews of other businesses /
//   organizations (self-serving review guideline); don't aggregate ratings
//   from other websites; marked-up reviews must be reachable from the page.
//   Search Central blog 2019-09-16: "self-serving" = review about entity A on
//   A's own site; includes third-party widgets embedded by the business.
// - Google Maps prohibited & restricted content (fake engagement):
//   incentives in exchange for any review or for revising/removing a negative
//   one; discouraging negative reviews or selectively soliciting positive
//   ones; staff asked to solicit reviews naming a staff member; conflicts of
//   interest (current/former employees etc.). Allowed: asking for genuine
//   experience without incentives or influencing rating/content.
// - Google Business Profile help 14114287: when the owner violates the fake
//   engagement policy, besides removal: no new reviews for a period, existing
//   reviews hidden for a period, a warning shown on the profile.
// - 消費者庁 stealth marketing page: from 2023-10-01 景品表示法違反; ads
//   whose ad nature consumers can't tell; includes what a business asks or
//   instructs third parties to post; review posts covered; individual
//   voluntary impressions not covered; regulated party is the business.
// - FTC: final rule announced 2024-08-14, effective 2024-10-21 (16 CFR 465):
//   fake reviews; compensation conditioned on sentiment (465.4); insider
//   reviews without disclosure (465.5); company-controlled review sites
//   (465.6); review suppression (465.7); fake social indicators (465.8).
//   Q&A (2024-11-08, mod. 2025-05-01): ad agencies, PR firms, review brokers
//   and reputation-management companies are not immune; generalized
//   solicitations are exempt. Warning letter template 2025-12-22: civil
//   penalties up to $53,088 per violation.
// - 厚労省 医療広告 事例解説書: patient testimonials (体験談) are a prohibited
//   example (read in the dental-clinic run; same link).
// - Top articles read (structure only): JA — 訪日ラボ/mov (2026-10-29),
//   GMO NIKKO AIかんたん集客 (2026-08-07, upd. 11-16), マイナビTECH+ LLMO
//   (2026-09-10), PRONIアイミツ お客様の声 (2025-01-17), キーワードマーケティング
//   (2022-10-25), Google Japan blog クチコミの仕組み (2022-02-02), ネットショップ
//   担当者フォーラム (2022-09-20). EN — Seer, Whitespark, Search Engine Land
//   (Amsive), Trustmary (2026; recommends surveying first and routing
//   satisfied customers to public sites = review gating), SEJ sponsored
//   (Reviewly, 2026-09-09), Birdeye (upd. 2026-08-17), eClincher
//   (2026-10-23), Trustpilot landing page.
// Not stated: how any AI company weights reviews; a minimum number of
// reviews or star rating; that review markup affects AI answers; the CAA
// 運用基準 examples (PDF not read).
//
// Nurevo facts (plugin source 0.9.2, docs/learning.md,
// docs/pro-measurement-implementation.md): Nurevo never adds a rating to the
// business node; for WooCommerce products, aggregateRating only when the
// product has reviews (count > 0 and average > 0, from WooCommerce itself).
// Nurevo does not collect or add reviews; reviews and Google Maps are treated
// only as context, never as a lever. Pro measurement keeps answer excerpts;
// the owner marks confirmed_error / checked_no_obvious_error / uncertain.
// Free AI check monthly with three Perplexity questions; Pro from ¥14,800 /
// USD 99 on Perplexity, ChatGPT once configured.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  seer: "https://www.seerinteractive.com/insights/study-of-800k-ai-responses-how-review-profiles-shape-brand-presence-in-ai-search",
  whitespark: "https://whitespark.ca/blog/want-to-rank-in-chatgpt-focus-on-these-review-sites-new-research/",
  mov: "https://honichi.com/news/2026/10/29/kcom-aiagent/",
  snippetJa: "https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=ja",
  snippetEn: "https://developers.google.com/search/docs/appearance/structured-data/review-snippet",
  blog2019: "https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful",
  blog2019Ja: "https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful?hl=ja",
  mapsJa: "https://support.google.com/contributionpolicy/answer/7400114?hl=ja",
  mapsEn: "https://support.google.com/contributionpolicy/answer/7400114?hl=en",
  gbpJa: "https://support.google.com/business/answer/14114287?hl=ja",
  gbpEn: "https://support.google.com/business/answer/14114287?hl=en",
  caa: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
  ftc: "https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials",
  ftcQa: "https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers",
  ftcWarn: "https://search.ftc.gov/system/files/ftc_gov/pdf/2025-Fake-Review-Warning-Template.pdf",
  mhlwCases: "https://www.mhlw.go.jp/content/10800000/001232587.pdf",
};

const ASK_JA = `件名：ご利用ありがとうございました（店名）

〇〇様

先日は（サービス名）をご利用いただき、ありがとうございました。
よろしければ、Googleマップにご感想をお寄せください。
良かった点も、直してほしい点も、そのまま書いていただければ助かります。

（Googleマップの口コミ投稿のリンク）

※ 投稿してもしなくても、料金や今後のご案内は変わりません。

（店名・担当者名）`;

const ASK_EN = `Subject: Thanks for choosing (business name)

Hi (name),

Thank you for using (service) last week.
If you have a minute, we'd appreciate a review on Google Maps.
Tell it as it was: what worked and what we could do better.

(link to your Google review form)

Whether or not you post makes no difference to your price or to how we treat you.

(Business name, your name)`;

const VOICE_JA = `【お客様】40代・会社員（大阪市）
【掲載の許可】2026年10月12日、メールで確認（イニシャル表記・写真なし）
【ご利用】リフォーム（浴室）、2026年9月、工期4日
【ご感想】（いただいた文章のまま。誤字だけ直しています）
【当社から】料金は浴室の広さで変わります。この例は（税込）〇〇円でした
【お礼】掲載のお礼はしていません／掲載のお礼として〇〇をお渡ししました`;

const VOICE_EN = `[Customer] Office worker, 40s (Springfield)
[Permission] Confirmed by email, 12 October 2026 (initials only, no photo)
[Service] Bathroom remodel, September 2026, four days on site
[In their words] (as sent to us; only typos corrected)
[From us] Prices depend on bathroom size; this job was $X including tax
[Thank-you] No gift was given / We gave a $X voucher as thanks for this testimonial`;

const CONSOLE = `// ブラウザの開発者ツールのコンソールで、お客様のサイトのページを開いて実行
[...document.querySelectorAll('script[type="application/ld+json"]')]
  .map((s) => s.textContent)
  .filter((t) => /aggregateRating|"Review"/.test(t))`;

const CONSOLE_EN = CONSOLE.replace(
  "// ブラウザの開発者ツールのコンソールで、お客様のサイトのページを開いて実行",
  "// Open a page of the client's site and run this in the browser's developer console",
);

export default {
  slug: "agency-reviews-testimonials-ai-search",
  targetQueries: [
    "reviews AI search visibility agency",
    "testimonials page AI search schema",
    "review gating Google policy AI search",
    "口コミ AI検索 対策 制作会社",
    "お客様の声 AI検索 構造化データ",
    "口コミ 依頼 ステマ規制 Googleマップ",
  ],
  related: ["agency-ai-search-manipulation-risks", "media-coverage-page-ai-search", "agency-aeo-monthly-service", "measure-ai-visibility", "bing-places-ai-search"],
  locales: {
    ja: {
      title: "口コミ・お客様の声とAI検索：制作会社が守るルールと整え方 | Nurevo",
      description: "AIは店や会社を紹介するとき口コミを材料にします。Googleの口コミポリシー、ステマ規制、自己言及レビューの構造化データの決まりを踏まえ、制作会社が入れる依頼の仕組み、お客様の声ページ、点検と測り方をまとめました。",
      h1: "口コミ・お客様の声とAI検索：制作会社が守るルール、依頼の仕組み、お客様の声ページの書き方",
      lead: "AIは店や会社をすすめるとき、Googleマップや口コミサイトの評価とその中身を材料にしています。制作会社ができるのは、利用した人全員に同じ形で口コミを頼む仕組みを作ること、自社サイトのお客様の声を「誰の・いつの・何についての」声か分かる形で載せること、そして特典と引き換えの依頼・良い評価だけを選んだ依頼・自社で集めた評価を星として構造化データに書くことを、お客様のサイトに入れないことです。",
      intro: [
        "作成日：2026年11月26日（日本時間）。Googleの構造化データのガイド（2026年9月17日更新）とGoogleマップのポリシー、消費者庁のステルスマーケティングのページ、米国FTCの規則と解説を同じ日に読んで確認しました。",
        "この記事は、お客様の店舗や会社のサイト、Googleビジネスプロフィール、MEOを任されている制作会社・代理店向けです。口コミを整えても、AIの回答にお客様の名前が必ず出るわけではありません。AIの回答は日や聞き方で変わり、口コミをどう重みづけているかを公表しているAIの会社もありません。ここで扱うのは、規約と法律に沿って本物の口コミが集まる形を作り、AIと人に正しい事実が伝わるようにする手順です。",
      ],
      sections: [
        {
          heading: "AIは口コミをどれくらい材料にしているか",
          paragraphs: [
            "公開されている調査は、口コミのサービスを売る会社によるものがほとんどで、測り方もそれぞれ違います。数字は「傾向を知る材料」として読み、お客様への約束には使わないでください。",
          ],
          table: {
            head: ["調査", "対象", "わかったこと"],
            rows: [
              ["Seer Interactive（2026-05-14、Trustpilotとの共同の白書）", "ChatGPT・GoogleのAIモード・Gemini・Perplexity の回答 804,491件、質問 15,783件、1,926ブランド（主に2026年3月）", "出典に占める口コミ・信頼性サイトの割合は、情報を集める段階の質問で1.51%、比べる段階で16.24%、買う直前で24.27%。Trustpilotのページがないブランドの引用率の中央値は1%、口コミ1〜13件のページがあると53.5%"],
              ["Whitespark（2025-08-26、09-15更新）", "米国9都市・17業種・153の検索で、Bing Places に表示される口コミの出どころ", "Facebook 716件、Yelp 482件、TripAdvisor 217件。ChatGPTの回答そのものを測ったものではない"],
              ["訪日ラボ（株式会社mov、2026-10-29、11-13更新）", "自社のWebアンケート", "AIに店を提案されたあとGoogleマップで確かめた人は飲食46.0%・宿泊49.4%。口コミを読むために検索し直した人は飲食45.4%・宿泊62.9%"],
            ],
          },
          after: [
            `出典：[Seer Interactive](${SRC.seer})、[Whitespark](${SRC.whitespark})、[訪日ラボ](${SRC.mov})。Seer の数字は Trustpilot のページの有無で比べた相関で、口コミを増やせば同じだけ出るという意味ではありません。それでも、どの調査も「比べる・選ぶ段階の質問ほど、AIも人も口コミを見る」という点では一致しています。`,
          ],
        },
        {
          heading: "上位の記事に書かれていなかったこと",
          paragraphs: [
            "「口コミ AI検索」「お客様の声 構造化データ」「reviews AI visibility」などで上位に出る日本語7本と英語8本を、2026年11月26日に読みました。口コミが大事だという点はどれも同じですが、制作会社が実際に作業するうえで必要なことが抜けていました。",
          ],
          table: {
            head: ["抜けていたこと", "この記事で書いたこと"],
            rows: [
              ["ステマ規制（2023年10月から）に触れた記事が日本語で1本もない", "第三者に頼んだ口コミも事業者の広告になること、規制されるのは事業者であること"],
              ["Googleマップの「虚偽のエンゲージメント」の決まり（特典・選別した依頼・スタッフ名の指定）が具体的に書かれていない。英語の1本は、先に満足度を聞いて満足した人だけを口コミサイトに案内する方法を勧めていた", "依頼の「してよい・いけない」の表と、全員に同じ形で頼む文例"],
              ["お客様の声ページに星の構造化データ（aggregateRating）を付けるよう勧める記事があり、Googleの自己言及レビューの決まりに触れていない", "店や会社の自社サイトの星は対象外であること、既存サイトの点検の方法"],
              ["謝礼を渡して集めたお客様の声に、そのことを書く話がない", "許可・時期・利用内容・謝礼の有無を書くお客様の声の型"],
              ["WordPressでの手順と、AIの答えの確かめ方がない", "WordPressでの作業、月1回の記録、制作会社のメニューの分け方"],
            ],
          },
        },
        {
          heading: "口コミの依頼で、してよいこと・いけないこと",
          paragraphs: [
            "AIが読む口コミの多くはGoogleマップと口コミサイトにあります。ここで規約に反すると、口コミが消されるだけでなく、店の情報そのものに制限がかかります。お客様に提案する前に、次の表をそのまま見せて合意しておくと安全です。",
          ],
          table: {
            head: ["してよいこと", "してはいけないこと", "根拠"],
            rows: [
              ["利用した人全員に、同じ文面で口コミを頼む", "満足した人だけに頼む、不満そうな人には頼まない", "Googleマップのポリシー（良い口コミだけを選んで頼むことの禁止）"],
              ["「良い点も直してほしい点も」と率直な感想を頼む", "割引・プレゼント・ポイントと引き換えに頼む。否定的な口コミの修正や削除を、特典と引き換えに頼む", "同上（特典と引き換えの依頼の禁止）"],
              ["スタッフが口頭で「よろしければ」と案内する", "スタッフの名前を書くように頼む。従業員や元従業員、家族が投稿する", "同上（特定の内容を頼むこと、利害関係のある人の投稿の禁止）"],
              ["否定的な口コミに、事実と対応を落ち着いて返信する", "法的措置をちらつかせて取り下げを迫る。悪い口コミを隠して「すべての口コミ」と見せる", "米国FTCの規則 465.7（口コミの抑え込み）"],
              ["自社が頼んだ投稿は、広告だと分かるようにする", "頼んだことを伏せた投稿を、一般の人の感想に見せる", "景品表示法のステルスマーケティングの告示（2023年10月1日から）"],
            ],
          },
          after: [
            `Googleは、ポリシーに反したと判断した事業者に対して、口コミの削除に加えて「一定期間、新しい口コミを受け取れない」「既存の口コミが非公開になる」「虚偽の口コミが削除されたという警告が表示される」といった制限を課すことがあると案内しています（[Googleマップの禁止コンテンツ](${SRC.mapsJa})、[ビジネスプロフィールの制限](${SRC.gbpJa})）。AIが店を紹介するときの材料がまとめて消える、ということです。`,
            `日本では2023年10月1日から、事業者の広告なのに一般の人には広告だと分からない表示が景品表示法違反になりました。消費者庁は、事業者がインフルエンサーなどの第三者に依頼・指示して書かせたものも広告に含まれ、SNSの投稿やレビューの投稿も対象になると説明しています。個人が自分で書いた感想は対象外で、規制を受けるのは事業者（広告主）です（[消費者庁：ステルスマーケティング](${SRC.caa})）。制作会社が依頼の仕組みを作るときも、お客様（事業者）が責任を負う形になる点を説明してください。`,
            `米国では、FTCの口コミと推薦の規則が2024年10月21日に施行されました。偽の口コミ、特定の評価を条件にした対価、役員・管理職やその家族による、関係を開示しない口コミ、独立を装った自社の口コミサイト、口コミの抑え込みなどを禁じています。FTCの解説は、広告代理店やPR会社、評判管理の会社も責任を免れないとしており、2025年12月の警告書のひな形には1件あたり最大53,088ドルの民事制裁金が書かれています（[FTCの発表](${SRC.ftc})、[FTCの解説](${SRC.ftcQa})、[警告書のひな形](${SRC.ftcWarn})）。海外のお客様がいる制作会社は、国ごとの決まりを確認してください。`,
          ],
        },
        {
          heading: "依頼の仕組みを作る：制作会社の作業",
          list: [
            "頼むタイミングを1つ決めます（施術や納品の当日、予約サイトの完了メールの翌日など）。人によって頼んだり頼まなかったりしないよう、仕組みで全員に送ります。",
            "Googleビジネスプロフィールの管理画面にある口コミの依頼用リンクを、完了メール・レシートのQRコード・サイトの「ご利用いただいた方へ」のページに置きます。",
            "文面は下の例のように、率直な感想を頼み、特典を付けず、投稿してもしなくても扱いが変わらないことを書きます。スタッフの名前を書くよう頼む一文は入れません。",
            "返信は事業者の名前で、事実と対応だけを書きます。否定的な口コミには、謝る点と事実が違う点を分けて書き、連絡先を示します。口コミの削除をGoogleに依頼するのは、ポリシーに反する口コミ（無関係な内容、個人攻撃など）に限ります。",
            "口コミで繰り返し聞かれていること（駐車場、料金の総額、予約の取り方など）は、サイトの本文やFAQに答えを書きます。AIは口コミとサイトの両方を読むので、サイトに答えがあると、口コミだけを頼りにした推測が減ります。",
          ],
          code: ASK_JA,
        },
        {
          heading: "お客様の声ページの書き方",
          paragraphs: [
            "自社サイトのお客様の声は、AIにとっても人にとっても「事業者が選んで載せた声」です。だからこそ、選んだことを隠さず、読む人が判断できる情報を添えると信頼されます。おすすめは、1件ごとに次の項目を書く形です。",
          ],
          code: VOICE_JA,
          after: [
            "許可は掲載前に、表記（実名・イニシャル・年代だけ）と写真の有無まで確かめ、日付と方法を記録します。文章は言い回しを整えすぎず、意味を変える編集はしません。料金や期間の数字は、条件つきで「当社から」に書き、声の中の数字だけが一人歩きしないようにします。",
            "謝礼を渡したときは、そのことを書きます。読む人が、声の重みを自分で判断できるようにするためです。Googleマップなど第三者の場に投稿してもらう場合は、前の章のとおり特典と引き換えにはできません。",
            `医療機関では、患者さんの体験談はウェブサイトでも広告が禁止される例として扱われています（[厚生労働省の事例解説書](${SRC.mhlwCases})）。歯科・皮膚科・美容医療などのお客様には、お客様の声のページを作らない、またはクリニックの事実の説明に置き換えるよう提案してください。士業・不動産・金融なども業界ごとの広告の決まりを先に確かめます。`,
          ],
        },
        {
          heading: "構造化データ：自社サイトのお客様の声に星を付けない",
          paragraphs: [
            `Googleの構造化データのガイドでは、店（LocalBusiness）と会社（Organization）の口コミの星は、他の店や組織の口コミを集めるサイトだけが対象です。店や会社が自分のサイトに自分の口コミを載せる「自己言及（セルフサービング）」のレビューは対象外で、ほかのサイトの評価を集計に含めないことも求められています（[Google：クチコミ抜粋の構造化データ](${SRC.snippetJa})）。この決まりは2019年9月に導入され、事業者が自分のサイトに埋め込んだ他社の口コミのウィジェットも、事業者が管理している口コミとして扱われます（[Google検索セントラルのブログ](${SRC.blog2019Ja})）。`,
            "テーマやレビューのプラグインが、店のノードに aggregateRating を出しているサイトはよくあります。マークアップを残しても罰があるわけではありませんが、星は表示されず、ページの見える内容と関係のない評価の数字を機械向けに出し続けることになります。点検では、下のコードで構造化データに評価が入っているページを探し、店や会社のノードに付いているものは外します。",
            "一方、ネットショップの商品（Product）は、実際にその商品に付いたレビューなら評価を書けます。Nurevo AEO（無料のWordPressプラグイン）は、店や会社のノードに評価を出しません。WooCommerceの商品では、その商品にレビューが1件以上あるときだけ、WooCommerceの平均評価と件数を aggregateRating として出します。レビューがない商品に評価を作ることはありません。",
          ],
          code: CONSOLE,
        },
        {
          heading: "WordPressでの手順",
          list: [
            "お客様の声は固定ページ1枚にまとめ、1件ごとに上の型（許可・時期・利用内容・お礼の有無）で書きます。カルーセルやスライダーだけで見せると、文章として読みにくくなることがあるため、本文として並べます。",
            "テーマやレビューのプラグインの設定で、店や会社の構造化データに評価（星）を出す項目があれば止めます。止めたら、上のコードで評価が消えたかを確かめます。",
            "Nurevo AEO を入れると、住所・電話・営業時間などの店の事実と、ページに置いたFAQの構造化データを出します。Yoast SEO・Rank Math・All in One SEO・Slim SEO と一緒に使え、0.9.1 からは SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても重複しません。",
            "口コミでよく聞かれる質問は、Nurevo AEO の設定でFAQに入れ、FAQブロックを置いたページにだけ FAQPage として出します。ページに表示されない質問は出しません。",
            `お客様の声のページを llms.txt に載せるかは、ページごとの設定で選べます。古い声だけのページなら外し、日付つきで更新しているページなら残します。[WordPress.orgで入手](${WP_ORG})`,
          ],
        },
        {
          heading: "制作会社のメニューにする",
          paragraphs: [
            "口コミの代筆や件数の約束はできませんが、ルールを守った仕組みづくりと点検は、月額の保守に組み込めます。料金は会社ごとに決めるものなので、ここでは作業の分け方だけを示します。",
          ],
          table: {
            head: ["作業", "頻度", "成果物", "確かめること"],
            rows: [
              ["ルールの合意", "最初に1回", "「してよい・いけない」の表への合意", "特典・選別した依頼・スタッフ名の指定をしない"],
              ["依頼の仕組み", "最初に1回", "依頼文、QRコード、完了メールの設定", "利用した人全員に届くか"],
              ["お客様の声ページ", "追加のたび", "型に沿ったページ、許可の記録", "許可の日付と表記、謝礼の有無"],
              ["構造化データの点検", "月1回", "評価のマークアップの一覧", "店や会社のノードに自己言及の星がないか"],
              ["AIの回答の記録", "月1回", "決めた質問の答えと出典の記録", "評価や口コミの要約が事実と合っているか"],
            ],
          },
          after: [
            "AI検索の整備全体を月額にする方法は[制作会社がAI対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)、お客様から不正な手法を頼まれたときの判断は[AI検索の不正な手法を頼まれたとき](/guide/agency-ai-search-manipulation-risks)にあります。パートナーの条件は[パートナーのページ](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
        {
          heading: "確かめ方",
          list: [
            "比べる・選ぶ段階の質問を3〜5個決めます（例：「（地域）で評判のいい（業種）は？」「（店名）の口コミは？」）。月1回、同じ質問をChatGPT・Perplexity・GoogleのAIモードに聞きます。",
            "答えに店名が出たか、評価や口コミの要約が今の口コミと合っているか、出典がGoogleマップ・口コミサイト・お客様のサイトのどれかを、日付と一緒に記録します。",
            "要約が古い・違う場合は、サイトの本文とFAQで事実を答え、口コミで繰り返し出る誤解に返信で事実を示します。AIの答えを直接直す方法はありません。",
            "Nurevo AEO の無料のAIチェックは、接続したサイトに月1回、業種と地域から作った3つの質問を Perplexity に聞きます。継続して測る Pro（月14,800円〜）も現在は Perplexity で測り（ChatGPTは設定され次第）、回答の抜粋を残して、内容の誤りを人が確かめて印を付けられます。Nurevo は口コミを集めたり増やしたりはしません。口コミとGoogleマップは、Nurevoが変えられない要因として、比べるときの条件にだけ使います。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "口コミの依頼を、利用した人全員に同じ文面で送っている",
            "依頼に特典を付けていない（否定的な口コミの修正・削除の依頼も含む）",
            "スタッフの名前を書くよう頼んでいない。従業員や家族が投稿していない",
            "頼んで書いてもらった投稿を、一般の人の感想に見せていない",
            "否定的な口コミに、事実と対応を返信している",
            "お客様の声に、許可・時期・利用内容・謝礼の有無を書いた",
            "医療など業界の広告の決まりを確かめた",
            "店や会社の構造化データに、自社サイトの口コミの星を出していない",
            "口コミでよく聞かれる質問の答えを、サイトの本文とFAQに書いた",
            "決めた質問の答えと出典を、月1回記録している",
          ],
        },
      ],
      faqs: [
        { q: "口コミの数が多いほど、AIに出やすくなりますか？", a: "口コミのページがあるブランドほどAIの回答に出やすいという調査はありますが、相関で、件数の基準を公表しているAIの会社はありません。件数を目標にするより、全員に頼む仕組みで新しい口コミが続けて集まる状態を作ってください。" },
        { q: "口コミを書いてくれた人に割引をしてもいいですか？", a: "Googleマップでは、割引や商品などの特典と引き換えに口コミを頼むことは禁止されています。良い評価を条件にしていなくても同じです。特典なしで、全員に率直な感想を頼んでください。" },
        { q: "満足度アンケートで高評価だった人にだけ、Googleの口コミを頼むのはだめですか？", a: "良い口コミだけを選んで頼むことは、Googleマップのポリシーで禁止されています。アンケートを取るのは自由ですが、口コミの依頼は回答の内容に関係なく全員に同じ形で送ります。" },
        { q: "お客様の声のページに星の構造化データを付けたいと言われました。", a: "店や会社が自分のサイトに載せた自分の口コミは、Googleの口コミの星の対象外です。付けても星は表示されません。お客様の声は本文として丁寧に書き、星はGoogleマップや口コミサイトでの評価に任せてください。" },
        { q: "悪い口コミを消してもらえますか？", a: "ポリシーに反する口コミ（無関係な内容、個人攻撃、利害関係者の投稿など）はGoogleに報告できますが、単に評価が低いだけの口コミは消せません。事実と対応を返信し、繰り返し出る誤解にはサイトで答えを書いてください。" },
        { q: "制作会社が依頼文を作っただけでも、ステマ規制の責任を問われますか？", a: "日本の景品表示法で規制されるのは事業者（広告主）です。ただ、依頼の仕組みを作る立場として、頼んだ投稿を一般の感想に見せない形にすることをお客様と合意しておくべきです。米国のFTCの規則では、代理店も責任を免れないとされています。" },
        { q: "口コミを整えれば、AIにすすめてもらえますか？", a: "保証はできません。AIの回答は日や聞き方で変わり、口コミの扱い方は公表されていません。できるのは、規約に沿った本物の口コミが集まり、サイトの事実と食い違わない状態を作ることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、お客様のサイトをAIがどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ、llms.txt、AI検索のクローラーの許可の状態がわかります。WordPressなら、Nurevo AEOで店の事実とFAQを無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "Google、Googleマップ、Googleビジネスプロフィール、Gemini はGoogle LLCの、ChatGPT はOpenAIの、Perplexity はPerplexity AIの商標です。Trustpilot、Yelp、Facebook、TripAdvisor、Bing、Seer Interactive、Whitespark、WooCommerce、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressおよび各製品名・サービス名は、それぞれの権利者の商標または登録商標です。調査の内容を紹介するためにだけ名前を挙げています。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },
    en: {
      title: "Reviews, Testimonials and AI Search: An Agency Playbook | Nurevo",
      description: "AI leans on reviews when it recommends a business. Google's review policy, the FTC rule, self-serving review markup, and what agencies should build, write and check.",
      h1: "Reviews, testimonials and AI search: the rules agencies must follow, a compliant request system, and testimonial pages that work",
      lead: "When AI recommends a business, it draws on ratings and review text from Google Maps and review sites. What an agency can do is build a system that asks every customer for a review in the same way, publish on-site testimonials that say whose experience it was, when and for what, and keep three things out of client sites: incentives for reviews, asking only happy customers, and marking up the business's own testimonials as star ratings in structured data.",
      intro: [
        "Written 26 November 2026 (JST). Google's review snippet guide (last updated 17 September 2026), Google Maps' prohibited content policy, the US FTC rule and its Q&A, and Japan's stealth marketing guidance were all read on the same day.",
        "This guide is for agencies that look after local businesses' websites, Google Business Profiles or local SEO. Better reviews do not guarantee that a client appears in AI answers. Answers change from day to day and with wording, and no AI company has published how it weighs reviews. What follows is how to get genuine reviews in a way that respects platform rules and the law, so that AI and people read accurate facts.",
      ],
      sections: [
        {
          heading: "How much AI relies on reviews",
          paragraphs: [
            "Most published studies come from companies that sell review products, and each measures something different. Treat the numbers as a sense of direction, never as a promise to a client.",
          ],
          table: {
            head: ["Study", "Scope", "Finding"],
            rows: [
              ["Seer Interactive (14 May 2026, white paper with Trustpilot)", "804,491 answers from ChatGPT, Google AI Mode, Gemini and Perplexity; 15,783 prompts; 1,926 brands (mostly March 2026)", "Review and trust sites' share of citations: 1.51% for awareness prompts, 16.24% for evaluation, 24.27% for purchase intent. Median citation rate: 1% for brands without a Trustpilot profile, 53.5% with 1–13 reviews"],
              ["Whitespark (26 Aug 2025, updated 15 Sep)", "Review sources shown on Bing Places listings: 153 searches, 17 categories, 9 US cities", "Facebook 716, Yelp 482, TripAdvisor 217. This measures Bing Places, not ChatGPT answers"],
              ["mov / Honichi Lab, Japan (29 Oct 2026, updated 13 Nov)", "The company's own online survey", "After AI suggested a place, 46.0% (restaurants) and 49.4% (hotels) checked Google Maps; 45.4% and 62.9% searched again to read reviews"],
            ],
          },
          after: [
            `Sources: [Seer Interactive](${SRC.seer}), [Whitespark](${SRC.whitespark}), [Honichi Lab](${SRC.mov}). Seer's figures compare brands with and without a Trustpilot profile; they are a correlation, not a promise that more reviews bring the same lift. Still, the studies agree on one thing: the closer a question is to a decision, the more both AI and people look at reviews.`,
          ],
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "On 26 November 2026 we read eight English and seven Japanese articles ranking for searches such as \"reviews AI visibility\" and \"testimonials schema\". All agree that reviews matter. What they leave out is what an agency needs to do the work safely.",
          ],
          table: {
            head: ["Missing", "Covered here"],
            rows: [
              ["The specific Google Maps rules on incentives, selective requests and naming staff. One English article recommended surveying customers first and sending only satisfied ones to review sites", "A do / don't table and a request template that goes to every customer"],
              ["The FTC rule (in force since October 2024) and the fact that agencies are not exempt", "What the rule bans and what the FTC says about agencies"],
              ["Google's self-serving review rule, while some articles suggest star markup on testimonial pages", "Why own-site stars are not eligible for a business, and how to audit existing sites"],
              ["Disclosing a thank-you gift on a testimonial", "A testimonial format with permission, date, service and gift"],
              ["WordPress steps and a way to check AI answers", "WordPress work, a monthly log, and how to package it as a service"],
            ],
          },
        },
        {
          heading: "Asking for reviews: what is allowed and what is not",
          paragraphs: [
            "Most of the reviews AI reads live on Google Maps and review sites. Break the rules there and you lose more than a few reviews: the business listing itself can be restricted. Show the client this table and get agreement before you build anything.",
          ],
          table: {
            head: ["Allowed", "Not allowed", "Basis"],
            rows: [
              ["Ask every customer, with the same message", "Ask only satisfied customers; skip unhappy ones", "Google Maps policy (no selective solicitation of positive reviews)"],
              ["Ask for an honest account, good and bad", "Offer discounts, gifts or points for a review, or for changing or removing a negative one", "Google Maps policy (no incentives); FTC rule 465.4 bans compensation conditioned on sentiment"],
              ["Staff mention it politely at the end of a visit", "Ask customers to name a staff member; let staff, former staff or relatives post", "Google Maps policy (no requested content, no conflicts of interest); FTC rule 465.5 on insider reviews"],
              ["Reply to negative reviews calmly, with facts and what you did", "Threaten legal action to get a review removed; hide bad reviews while presenting the rest as all reviews", "FTC rule 465.7 (review suppression)"],
              ["Make it clear when a post was requested by the business", "Present a commissioned post as an ordinary customer's view", "FTC rule; Japan's stealth marketing rule (since 1 October 2023)"],
            ],
          },
          after: [
            `Google says that when a business violates its fake engagement policy, it may, besides removing reviews, stop the profile receiving new reviews for a period, hide existing reviews for a period, and show customers a warning that fake reviews were removed ([Google Maps prohibited content](${SRC.mapsEn}), [Business Profile restrictions](${SRC.gbpEn})). In other words, the material AI uses to describe the business can disappear all at once.`,
            `In the US, the FTC's rule on consumer reviews and testimonials took effect on 21 October 2024. It bans fake reviews, compensation conditioned on a particular sentiment, undisclosed reviews by officers and managers and their relatives, company-controlled review sites posing as independent, review suppression, and fake social media indicators. The FTC's Q&A says advertising agencies, PR firms, review brokers and reputation-management companies are not immune, while generalized requests to all customers to leave a review are exempt. Its December 2025 warning letter template cites civil penalties of up to $53,088 per violation ([FTC announcement](${SRC.ftc}), [FTC Q&A](${SRC.ftcQa}), [warning letter template](${SRC.ftcWarn})).`,
            `In Japan, since 1 October 2023 it has been a violation of the Act against Unjustifiable Premiums and Misleading Representations to publish advertising that consumers cannot recognise as advertising. The Consumer Affairs Agency says this includes content a business asks or instructs third parties to post, review posts included; a person's own voluntary impressions are not covered, and the party regulated is the business ([Consumer Affairs Agency, Japanese](${SRC.caa})). Rules differ by country, so check the ones that apply to each client.`,
          ],
        },
        {
          heading: "Build the request system",
          list: [
            "Pick one moment to ask, such as the day of the appointment or the day after the booking confirmation. Send it through a system so that every customer gets it, rather than leaving staff to decide who to ask.",
            "Put the review link from the Google Business Profile dashboard in the confirmation email, as a QR code on the receipt, and on a short \"Thanks for visiting\" page on the site.",
            "Use wording like the example below: ask for an honest account, offer nothing in return, and say that posting or not changes nothing. Leave out any line asking people to mention a staff member.",
            "Reply in the business's name with facts and what was done. For negative reviews, separate what you apologise for from what is factually wrong, and give a contact. Report a review to Google only when it breaks the policy (off-topic, personal attacks and so on).",
            "Where reviews keep asking the same thing (parking, the full price, how to book), answer it in the site's text and FAQ. AI reads both reviews and the site; an answer on the site leaves less to guesswork based on reviews alone.",
          ],
          code: ASK_EN,
        },
        {
          heading: "Writing the testimonial page",
          paragraphs: [
            "Testimonials on a business's own site are, for AI and for people alike, voices the business chose to show. Say so openly and give readers what they need to judge them. We recommend recording the following for each one.",
          ],
          code: VOICE_EN,
          after: [
            "Get permission before publishing, including how the person is named (full name, initials or age group only) and whether a photo is used, and record the date and method. Don't over-polish the wording, and never edit in a way that changes the meaning. Put prices and timeframes, with their conditions, under \"From us\" so a number in a testimonial does not travel without its context.",
            "If you gave a thank-you gift, say so, so readers can weigh the testimonial themselves. For reviews posted on Google Maps or other third-party platforms, incentives are not allowed at all, as described above.",
            `Regulated sectors have their own rules. In Japan, for example, patient testimonials are listed as a prohibited form of advertising on medical websites ([Ministry of Health, Labour and Welfare case guide, Japanese](${SRC.mhlwCases})). For clinics, legal, financial and property clients, check the advertising rules for their sector and country before building a testimonial page.`,
          ],
        },
        {
          heading: "Structured data: no stars for your own testimonials",
          paragraphs: [
            `Google's review snippet guide says star ratings for LocalBusiness and Organization are only for sites that collect reviews about other businesses or organizations. Reviews a business publishes about itself on its own site are \"self-serving\" and not eligible, and ratings from other websites should not be included in the aggregate ([Google: review snippet structured data](${SRC.snippetEn})). Google introduced the rule in September 2019; a third-party review widget embedded by the business also counts as reviews the business controls ([Google Search Central blog](${SRC.blog2019})).`,
            "Many themes and review plugins add aggregateRating to the business node. Leaving it there is not penalised, but the stars won't show, and the site keeps publishing a rating that has nothing to do with what visitors see. When you audit a site, use the snippet below to find pages whose structured data contains ratings, and remove those attached to the business or organization.",
            "Products are different: an online shop can mark up ratings that genuinely belong to that product. Nurevo AEO (a free WordPress plugin) never adds a rating to the business node. For WooCommerce products it outputs aggregateRating only when the product has at least one review, using WooCommerce's own average and count. It never invents a rating for a product without reviews.",
          ],
          code: CONSOLE_EN,
        },
        {
          heading: "On WordPress",
          list: [
            "Keep testimonials on one page, each in the format above (permission, date, service, gift). Show them as text on the page rather than only in a carousel or slider, which can be harder to read as text.",
            "In the theme or review plugin settings, turn off any option that adds ratings to the business's structured data, then run the snippet again to confirm they are gone.",
            "Nurevo AEO publishes the business facts (address, phone, opening hours) and the FAQ on the pages where you place it. It works alongside Yoast SEO, Rank Math, All in One SEO and Slim SEO, and from 0.9.1 alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "Add the questions reviews keep raising to Nurevo AEO's FAQ and place the FAQ block; FAQPage is published only on the page where the questions are shown.",
            `Choose per page whether the testimonial page appears in llms.txt: leave out a page of old testimonials, keep one you update with dates. [Get Nurevo AEO on WordPress.org](${WP_ORG})`,
          ],
        },
        {
          heading: "Turning it into an agency service",
          paragraphs: [
            "You cannot write reviews or promise a number of them, but a compliant system and regular checks fit well into a monthly retainer. Pricing is yours to set; here is how the work divides.",
          ],
          table: {
            head: ["Task", "How often", "Deliverable", "What to check"],
            rows: [
              ["Agree the rules", "Once, at the start", "Signed-off do / don't table", "No incentives, no selective asks, no staff names"],
              ["Request system", "Once, at the start", "Message, QR code, confirmation email setup", "Does every customer receive it?"],
              ["Testimonial page", "With each addition", "Page in the standard format, permission log", "Permission date, naming, gift disclosed"],
              ["Structured data audit", "Monthly", "List of rating markup found", "No self-serving stars on the business node"],
              ["AI answer log", "Monthly", "Answers and sources for the chosen questions", "Do ratings and review summaries match reality?"],
            ],
          },
          after: [
            "For packaging AI search work as a retainer, see [how agencies turn AEO into a monthly service](/guide/agency-aeo-monthly-service); for clients who ask for manipulative tactics, see [when a client asks for AI search manipulation](/guide/agency-ai-search-manipulation-risks). Partner terms are on the [partner page](https://nurevo.jp/partner/).",
          ],
        },
        {
          heading: "How to check",
          list: [
            "Pick three to five decision-stage questions (\"best-reviewed (service) in (area)?\", \"what do reviews say about (business)?\"). Once a month, ask the same questions in ChatGPT, Perplexity and Google AI Mode.",
            "Log, with the date, whether the business was named, whether the rating and review summary match its current reviews, and whether the source was Google Maps, a review site or the business's own site.",
            "If a summary is out of date or wrong, answer the facts in the site's text and FAQ, and reply to recurring misunderstandings in reviews with the facts. There is no way to edit an AI answer directly.",
            "Nurevo AEO's free AI check asks Perplexity three questions built from the business type and area once a month for each connected site. Pro (from USD 99 a month), for ongoing measurement, currently also measures on Perplexity (ChatGPT once configured), keeps answer excerpts and lets a person mark errors in them. Nurevo does not collect or add reviews; it treats reviews and Google Maps as factors it cannot change and uses them only as context when comparing results.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "Every customer gets the same review request",
            "No incentive is offered for a review, or for changing or removing a negative one",
            "Nobody is asked to name a staff member; staff and relatives don't post",
            "Requested posts are not presented as ordinary customers' views",
            "Negative reviews get factual replies",
            "Each testimonial records permission, date, service and any gift",
            "Sector advertising rules (medical, legal, financial) have been checked",
            "No self-serving star rating in the business's structured data",
            "Questions that reviews keep raising are answered in the site's text and FAQ",
            "Answers and sources for the chosen questions are logged monthly",
          ],
        },
      ],
      faqs: [
        { q: "Do more reviews make AI mention a business more often?", a: "Studies find that brands with review profiles appear in AI answers more often, but that is a correlation, and no AI company has published a threshold. Rather than chasing a number, build a system that keeps fresh reviews coming from every customer." },
        { q: "Can we give a discount to customers who leave a review?", a: "Not on Google Maps: offering discounts, products or other incentives in exchange for a review is prohibited, even if you don't ask for a positive one. Ask every customer for an honest review, with nothing in return." },
        { q: "Can we send the Google review link only to people who rated us highly in a survey?", a: "No. Selectively asking for positive reviews is against Google Maps policy. You can run a survey, but the review request must go to everyone in the same way, whatever they answered." },
        { q: "The client wants star markup on the testimonial page.", a: "Reviews a business publishes about itself on its own site aren't eligible for Google's review stars, so the stars won't show. Write the testimonials well as page text and let ratings come from Google Maps and review sites." },
        { q: "Can you get a bad review removed?", a: "You can report reviews that break the policy (off-topic, personal attacks, conflicts of interest), but not a review simply because it is negative. Reply with facts and what was done, and answer recurring misunderstandings on the site." },
        { q: "Is the agency liable if it only wrote the review request?", a: "Under the FTC rule, the FTC says agencies are not immune. In Japan the stealth marketing rule regulates the business (the advertiser), but as the party designing the system, agree with the client that requested posts will never be passed off as ordinary customers' views." },
        { q: "If we fix reviews, will AI recommend the client?", a: "There is no guarantee. AI answers change by day and wording, and how reviews are weighed is not published. What you can do is make sure genuine, policy-compliant reviews keep coming and that they don't contradict the facts on the site." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your client's site",
        body: "The free check needs no sign-up: enter a URL to see the state of structured data, llms.txt and AI crawler access. On WordPress, the free plugin publishes the business facts and FAQ.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Google, Google Maps, Google Business Profile and Gemini are trademarks of Google LLC; ChatGPT is a trademark of OpenAI; Perplexity is a trademark of Perplexity AI. Trustpilot, Yelp, Facebook, TripAdvisor, Bing, Seer Interactive, Whitespark, WooCommerce, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks of their respective owners. Names are mentioned only to report published research. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
