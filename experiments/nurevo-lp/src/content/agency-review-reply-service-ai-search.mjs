// Content page (agencies): running a review-reply service for clients with AI
// search in mind — what is known about replies and AI answers, the rules to
// agree before replying on a client's behalf, reply patterns, industry
// cautions (medical, legal and other confidential work), AI-drafted replies,
// feeding repeated questions back into the site, and how to measure it.
// Separate from agency-reviews-testimonials-ai-search (asking for reviews,
// testimonial pages, review markup; replies were one bullet there) and
// agency-ai-search-manipulation-risks (refusing manipulation in general).
//
// Written 2026-11-27 11時 (JST).
//
// Outside facts and where they were read (2026-11-27):
// - Google Business Profile help 3474050 (ja; hl=en served the same Japanese
//   page; no update date shown): owner must be verified; Google reviews
//   replies against the content policy, usually within 10 minutes, up to
//   about 30 days; replies not approved can be edited; the reply shows as the
//   business's response, the person's name is not shown; the reviewer is
//   notified and can edit the review afterwards (the review date updates);
//   replies can be edited or deleted.
// - Google help 3474122 (ja; same for hl=en): reply tips — polite and
//   professional and within policy; concise; reply as needed (no need to
//   publicly thank every reviewer); no need to offer deals or promotions;
//   negative reviews: protect privacy, no personal attacks, ask the reviewer
//   to contact you by email or phone; check records of the visit; apologise
//   for real mistakes and explain limits; empathy; add a name or initials;
//   reply promptly. Incentives for posting/changing/removing reviews are
//   fake engagement.
// - Google help 17142585 (en): Gemini web app can draft or delete replies to
//   customer feedback and summarise reviews; only for an owner/manager of one
//   verified Business Profile, 18+, personal Google Account, at
//   gemini.google.com.
// - Search Engine Roundtable (2026-03-24, Barry Schwartz): Google testing
//   "Reply to reviews with AI" in the Business Profile dashboard for some
//   businesses; based on a screenshot, no official statement.
// - Scalevise (2026-10-14): reports Search Engine Land testing in which
//   ChatGPT and Google AI Mode did not directly show owner replies from
//   Google Business Profiles, Bing Places or Yelp, and instead surfaced
//   third-party content discussing problematic reviews or replies. Secondhand;
//   method and sample not stated; the SEL page failed to load.
// - Revfer press release (EIN Presswire, 2026-11-08, upd. 11-21): Revfer
//   sells review reply tools; 400 businesses in Greater Boston/MetroWest,
//   about 88,000 Google reviews 2019–2026; em dash in owner replies 0.1% →
//   4.2%; in reviews 0.2% → 2.9%; markers are hints, not proof.
// - HHS OCR: Manasa Health Center (NJ, psychiatric), 2023-06-05, $30,000 and
//   a two-year corrective action plan, reply to a negative online review
//   included diagnosis and treatment details; three other patients' PHI also
//   disclosed in replies. New Vision Dental (CA), 2022-12-14, $23,000 and a
//   two-year CAP, PHI in replies to online reviews.
// - 刑法134条1項 (law-lib.jp text, linked to e-Gov): 医師、薬剤師、医薬品販売業者、
//   助産師、弁護士、弁護人、公証人; 6月以下の拘禁刑又は10万円以下の罰金. Dentists
//   are not listed (日本歯科医師会 2012 submission, MHLW 001356107.pdf);
//   nurses are under 保助看法 42条の2 (same PDF). Not stated in the article:
//   other professions' article numbers.
// - Top articles read (structure only): JA — アシスト 返信テンプレ（日付なし）,
//   S-LINE 返信ルール（2026-11-03）, サングローブ（2025-01-30, 2026-03-02更新）,
//   訪日ラボ（2022-04-27, 会員限定）, ネットショップ担当者フォーラム（2022-07-04）,
//   エキサイト AIレビュー自動化くん（2025-06-04）, 0120.co.jp（2026-06-26,
//   10-20更新）, アシスト 自動返信ツール（2026-01-29）. EN — Thrive Agency
//   (2026-02-03), AskNicely (2026-08-23), SEJ sponsored by GatherUp
//   (2025-07-17, upd. 10-06), Widewail (undated), HubSpot (upd. 2025-01-24),
//   Scalevise (2026-10-14), GatherUp (2024-07-29). SEL 455637 and the
//   ScienceDirect paper failed to load.
// Not stated: that replying raises AI visibility or rankings; a reply-rate or
// reply-time target; BrightLocal survey figures (page not read); reply
// character limits.
//
// Nurevo facts (readme 0.9.2, docs/learning.md, docs/pro-measurement-
// implementation.md): Nurevo does not write or post review replies and
// treats reviews and Google Maps only as context; FAQ entered in Settings is
// shown by the Nurevo FAQ block / [nurevo_faq] and published as FAQPage only
// on that page; per-page FAQ in the editor sidebar. Pro keeps answer
// excerpts; the owner marks confirmed_error / checked_no_obvious_error /
// uncertain. Free AI check monthly with three Perplexity questions; Pro from
// ¥14,800 / USD 99 on Perplexity, ChatGPT once configured. Partner: branded
// monthly reports, multi-site dashboard, 40% referral (approval required).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  gbpReply: "https://support.google.com/business/answer/3474050?hl=ja",
  gbpReplyEn: "https://support.google.com/business/answer/3474050?hl=en",
  gbpTips: "https://support.google.com/business/answer/3474122?hl=ja",
  gbpTipsEn: "https://support.google.com/business/answer/3474122?hl=en",
  gemini: "https://support.google.com/business/answer/17142585?hl=en",
  ser: "https://www.seroundtable.com/google-reply-to-reviews-with-al-41095.html",
  scalevise: "https://scalevise.com/resources/ai-search-business-review-replies-third-party-coverage/",
  revfer: "https://www.einpresswire.com/article/954865327/businesses-adopted-ai-writing-faster-than-customers-google-review-study-finds",
  hhsManasa: "https://www.hhs.gov/about/news/2023/06/05/hhs-office-civil-rights-reaches-agreement-health-care-provider-new-jersey-disclosed-phi-response-negative-online-reviews.html",
  hhsDental: "https://www.hhs.gov/about/news/2022/12/14/hhs-civil-rights-office-enters-settlement-with-dental-practice-over-disclosures-of-patients-protected-health-information.html",
  keiho: "https://laws.e-gov.go.jp/law/140AC0000000045",
  mhlwDental: "https://www.mhlw.go.jp/content/12600000/001356107.pdf",
  mapsJa: "https://support.google.com/contributionpolicy/answer/7400114?hl=ja",
  mapsEn: "https://support.google.com/contributionpolicy/answer/7400114?hl=en",
};

const RULES_JA = `【口コミ返信の取り決め（お客様と合意する1枚）】
返信の名前：店名＋役職（例「〇〇店 店長」）。個人の氏名は書かない
制作会社がそのまま返信してよい口コミ：★4〜5で、個人の事情に触れていないもの
事業者の承認が要る口コミ：★1〜3／返金・補償・事故・けが・体調・法律の話／
  従業員の名前が出るもの／事実と違う内容／取材・SNSで広がっているもの
返信の期限：通常は届いてから◯営業日以内、承認が要るものは承認から1営業日以内
書かないこと：利用の有無、予約日・部屋番号・注文番号、症状・相談内容、
  割引や特典の案内、相手を責める言葉、事業者が決めていない約束
記録：口コミの日付・星・話題・返信日・承認した人・サイトに反映したか`;

const RULES_EN = `[Review reply agreement: one page signed off with the client]
Signed as: business name + role (e.g. "Store manager, Main St.") — never a person's full name
We reply without asking: 4–5 star reviews that mention nothing personal
Client approves first: 1–3 stars; refunds, compensation, accidents, injury,
  health or legal matters; staff named; factual errors; anything in the press or going viral
Deadline: within X business days of the review; 1 business day after approval
Never write: whether the person is a customer or patient, dates, room or order numbers,
  symptoms or case details, discounts or offers, blame, promises the client has not made
Log: review date, stars, topic, reply date, who approved, whether the site was updated`;

const REPLY_JA = `【良い口コミ】
（触れられた点）についてのお言葉、ありがとうございます。
（次に来る人にも役立つ事実を1つ。例：平日18時以降は予約なしでもご案内できます）
またのお越しをお待ちしております。（店名 店長）

【店に非がある不満】
ご不便をおかけし、申し訳ありません。ご指摘の（待ち時間）について、
（11月から予約枠を見直しました）。詳しくお聞きしたいので、
お手数ですが（電話番号／メール）までご連絡ください。（店名 店長）

【事実と違う内容】
ご意見ありがとうございます。（駐車場）は、現在（提携駐車場を2時間無料）でご案内しています。
サイトの「アクセス」にも載せています。分かりにくかった点は見直します。（店名）

【医療・士業など、利用の有無を答えられない業種】
ご意見をお寄せいただき、ありがとうございます。
個別のご相談やご利用については、この場ではお答えしておりません。
（窓口の電話番号）までご連絡いただければ、担当者がお話を伺います。（院名／事務所名）`;

const REPLY_EN = `[Positive review]
Thank you for the kind words about (what they mentioned).
(One fact the next customer can use, e.g. "After 6 pm on weekdays we can usually seat you without a booking.")
We hope to see you again. (Business name, store manager)

[Complaint where the business was at fault]
We're sorry for the trouble. About the (wait time) you mentioned: (since November we have changed
how many bookings we take per hour). We'd like to hear more — please contact us at (phone / email).
(Business name, store manager)

[Review with a factual error]
Thanks for your feedback. (Parking): we currently offer (two hours free at the partner car park),
and it's listed on the Directions page of our website. We'll make that clearer. (Business name)

[Medical, legal and other confidential services]
Thank you for taking the time to write. We don't discuss individual visits or cases here.
Please call (front desk number) and a member of our team will be glad to talk with you.
(Practice / firm name)`;

export default {
  slug: "agency-review-reply-service-ai-search",
  targetQueries: [
    "review response service agency AI search",
    "responding to reviews healthcare HIPAA online reviews",
    "AI generated review replies Google Business Profile",
    "口コミ 返信 代行 制作会社 AI検索",
    "口コミ 返信 例文 医療 守秘義務",
    "口コミ返信 AI 下書き 注意点",
  ],
  related: ["agency-reviews-testimonials-ai-search", "agency-ai-search-manipulation-risks", "agency-aeo-monthly-service", "faq-page-ai-search", "dental-clinic-ai-search"],
  locales: {
    ja: {
      title: "口コミ返信の代行とAI検索：制作会社の返信の型と業種別の注意 | Nurevo",
      description: "AIの回答に店の返信がそのまま出る場面は確認されていませんが、返信は口コミと並んで残り、事実の訂正と対応の記録になります。制作会社が返信を代行するときの取り決め、返信の型、医療・士業の注意、AI下書きの確認、測り方をまとめました。",
      h1: "口コミ返信の代行とAI検索：制作会社が決めておく取り決め、返信の型、業種別の注意",
      lead: "口コミへの返信がAIの回答にそのまま引用される場面は、公開されているテストでは確認されていません。それでも返信は口コミと並んでGoogleマップに残り、人もAIも読む「事実の訂正」と「対応の記録」になります。制作会社が返信を代行するなら、まず事業者と取り決め（誰の名前で、どの口コミは承認が要るか、何を書かないか）を1枚にまとめ、医療・士業では利用の有無に触れない型を使い、AIの下書きは人が確かめ、口コミで繰り返し出る質問はサイトの本文とFAQに答えを書いてください。",
      intro: [
        "作成日：2026年11月27日（日本時間）。Googleビジネスプロフィールのヘルプ（口コミの管理・返信のヒント・Geminiでの管理）、米国保健福祉省（HHS）の発表、刑法の条文を同じ日に読んで確認しました。",
        "この記事は、お客様のGoogleビジネスプロフィールやMEOを任されている制作会社・代理店向けです。口コミの頼み方とお客様の声ページは[口コミ・お客様の声とAI検索](/guide/agency-reviews-testimonials-ai-search)にまとめたので、ここでは返信だけを扱います。返信を続けても、AIの回答にお客様の名前が必ず出るわけではありません。AIの回答は日や聞き方で変わり、返信をどう扱っているかを公表しているAIの会社もありません。",
      ],
      sections: [
        {
          heading: "返信とAIの回答について、分かっていること",
          paragraphs: [
            "「返信するとAIに選ばれやすくなる」と書く記事は多いのですが、出典を示しているものはほとんどありませんでした。確かめられたのは次のことだけです。",
          ],
          table: {
            head: ["分かっていること", "出典"],
            rows: [
              ["返信はGoogleがコンテンツポリシーに沿って審査してから公開される。通常は10分以内、長いと約30日かかる。承認されなかった返信は直して出し直せる", "Googleビジネスプロフィール ヘルプ「クチコミを管理する」"],
              ["返信は「オーナーからの返信」として表示され、担当者個人の名前は出ない。投稿者に通知が届き、投稿者はそのあと口コミを書き直せる（日付も更新される）", "同上"],
              ["Googleの返信のヒント：簡潔に、必要に応じて返信（全員に公開でお礼を言う必要はない）、特典やセールの案内は不要、否定的な口コミでは個人情報を出さず、メールや電話で直接連絡してもらう、非があれば謝り、できないことは説明する、速やかに返信する", "Googleビジネスプロフィール ヘルプ（返信のヒント）"],
              ["Gemini のウェブアプリで、口コミの要約と返信の下書き・削除ができる。ただし確認済みのビジネスプロフィールを1つだけ管理する個人のGoogleアカウント（18歳以上）に限られる", "Googleビジネスプロフィール ヘルプ（Gemini、英語）"],
              ["Googleは一部のビジネスの管理画面で「AIで口コミに返信」を試している（2026年3月、スクリーンショットにもとづく報道。Googleの発表はない）", "Search Engine Roundtable（2026-03-24）"],
              ["ChatGPT と GoogleのAIモードは、Googleビジネスプロフィール・Bing Places・Yelp の店の返信をそのまま表示せず、問題になった口コミや返信を取り上げた第三者の記事を出す傾向があった", "Search Engine Land のテストを紹介した Scalevise（2026-10-14。元の記事は読めておらず、件数や方法は書かれていない）"],
              ["米国ボストン周辺の400件・約88,000件の口コミ（2019〜2026年）で、店の返信にダッシュ（—）が使われる割合が0.1%から4.2%に増えた。AIで書いた返信が広がっている兆しとしているが、証拠ではないと断っている", "Revfer（返信ツールの会社）の発表（2026-11-08）"],
            ],
          },
          after: [
            `出典：[クチコミを管理する](${SRC.gbpReply})、[返信のヒント](${SRC.gbpTips})、[Gemini でビジネスプロフィールを管理](${SRC.gemini})、[Search Engine Roundtable](${SRC.ser})、[Scalevise](${SRC.scalevise})、[Revfer の発表](${SRC.revfer})。`,
            "ここから言えるのは、返信の役割は「AIに引用される文章」より、「口コミを読んだ人とAIに、いまの事実と店の対応を見せること」と「問題のある返信で第三者に取り上げられないこと」だ、ということです。荒い返信は、返信そのものより、それを取り上げた記事やSNSの投稿としてAIの回答に残りかねません。",
          ],
        },
        {
          heading: "上位の記事に書かれていなかったこと",
          paragraphs: [
            "「口コミ 返信 例文」「口コミ 返信 代行」「review response AI search」などで上位に出る日本語8本と英語7本を、2026年11月27日に読みました。例文は豊富ですが、代行する側に必要なことが抜けていました。",
          ],
          table: {
            head: ["抜けていたこと", "この記事で書いたこと"],
            rows: [
              ["「返信率80%」「24時間以内」などの目標や「返信で順位が上がる」に出典がない", "Googleの公式ヘルプで確かめられたことだけの表。目標の数字は書かない"],
              ["医療・士業の守秘義務に触れた日本語の記事がない。英語でも詳しいのは1〜2本", "利用の有無に触れない返信の型と、HHS の2件・刑法134条"],
              ["誰が承認するか、どの口コミを事業者に回すかが「人が最終確認」程度", "お客様と合意する取り決め1枚（承認が要る口コミ、期限、書かないこと、記録）"],
              ["AIの回答に返信がどう出るかを確かめた記事が少なく、確かめた記事も方法が書かれていない", "分かっていることと分かっていないことを分け、月1回の確かめ方を書いた"],
              ["返信で終わり、サイトに戻す話がない", "繰り返し出る質問をサイトの本文とFAQに書く手順（WordPress）"],
            ],
          },
        },
        {
          heading: "代行を始める前に、お客様と決めること",
          paragraphs: [
            "返信はお客様の店の名前で公開されます。書いた内容の責任はお客様にあり、制作会社が独断で謝罪や補償を書くと、お客様が決めていない約束になります。最初に次の1枚を作って合意しておくと、急ぎの返信でも迷いません。",
            "ログインは、お客様のパスワードを預かるのではなく、ビジネスプロフィールのユーザーとして制作会社のアカウントを追加してもらいます（権限の種類はGoogleのヘルプで確認してください）。契約が終わったら外してもらうことも、取り決めに書いておきます。",
          ],
          code: RULES_JA,
        },
        {
          heading: "返信の型",
          paragraphs: [
            "型は「書き出しを毎回同じにする」ためではなく、「入れる要素をそろえる」ために使います。同じ文が並ぶと、人にも機械にも定型文に見えます。どの型も、口コミで触れられた具体的な点に1回は触れてください。",
          ],
          code: REPLY_JA,
          after: [
            "良い口コミへの返信には、次に来る人の役に立つ事実（予約の要否、駐車場、支払い方法など）を1つだけ入れます。Googleのヒントにあるとおり、特典やセールの案内は入れません。",
            "不満の口コミでは、謝る点と事実が違う点を分けます。何を変えたかを書けるなら書き、書けないなら「詳しく伺いたい」と直接の連絡先を示します。言い争いは続けず、返信は1回にします。",
            "事実と違う内容（休業日、料金、駐車場など）は、いまの事実を短く書き、サイトのどのページに載っているかを示します。サイトにまだ書いていなければ、返信と同じ日にサイトにも書きます。",
            "星だけの口コミや短いお礼の口コミは、返信しなくても構いません（Googleのヒントでも、全員に公開でお礼を言う必要はないとしています）。",
          ],
        },
        {
          heading: "業種別の注意：返信で書いてはいけないこと",
          paragraphs: [
            "口コミを書いた人が自分で利用を明かしていても、店の側が「あなたはいつ来た、何をした」と書けば、店がその人の情報を公開したことになります。特に医療と士業では、利用したかどうかも書かない型にしてください。",
          ],
          table: {
            head: ["業種", "返信に書かない", "理由・例"],
            rows: [
              ["医療（病院・クリニック・歯科・薬局）", "その人が患者かどうか、来院日、症状、診断、治療の内容、保険", "米国では、精神科のクリニックが否定的な口コミへの返信に診断と治療の内容を書き、ほかの患者3人の情報も返信で出していたとして30,000ドルで和解（2023-06-05）。歯科医院も口コミへの返信で患者の情報を出し23,000ドルで和解（2022-12-14）。日本では、医師・薬剤師などが業務上知った秘密を正当な理由なく漏らすと刑法134条の対象"],
              ["士業（弁護士・税理士・行政書士など）", "依頼や相談があったか、案件の中身、相手方", "刑法134条は弁護士も対象。ほかの士業も、それぞれの法律や個人情報の決まりで秘密を守る義務がある"],
              ["美容・整体・エステ", "施術の効果の約束、体の状態", "「必ず良くなる」は返信でも広告と同じ表現になる。体の話は来店時に聞く"],
              ["飲食", "その人の注文や同席者、異物・体調の原因の断定", "事実を調べる前に認めることも否定することもしない。連絡をもらって調べる"],
              ["宿泊", "宿泊日、部屋番号、同行者", "その人がいつ誰と泊まったかが分かってしまう"],
              ["EC・通販", "注文番号、住所、配送の詳細", "直接の連絡で確認する"],
              ["不動産", "物件の所在地、取引の条件、相手方", "物件や取引の当事者が特定される"],
            ],
          },
          after: [
            `出典：[HHS：精神科クリニック（2023-06-05）](${SRC.hhsManasa})、[HHS：歯科医院（2022-12-14）](${SRC.hhsDental})、[刑法（e-Gov法令検索）](${SRC.keiho})。刑法134条1項に挙がるのは医師・薬剤師・医薬品販売業者・助産師・弁護士・弁護人・公証人で、歯科医師は挙がっていません（[日本歯科医師会の2012年の資料](${SRC.mhlwDental})）。挙がっていない職種でも、患者や依頼者の情報は個人情報で、返信に書かないのは同じです。法律の判断が要るときは、お客様の顧問の専門家に確認してください。`,
          ],
        },
        {
          heading: "AIで下書きを作るとき",
          paragraphs: [
            "AIで下書きを作ること自体は、Googleも Gemini のウェブアプリで用意しています。ただ、Gemini のウェブアプリは確認済みのプロフィールを1つだけ管理する個人のアカウントに限られ、たくさんのお客様を受け持つ制作会社の作業には向きません。どの道具を使っても、公開する前に人が次を確かめてください。",
          ],
          list: [
            "事実：営業時間、料金、駐車場、予約の方法が、サイトとビジネスプロフィールのいまの情報と合っているか。AIは古い情報やもっともらしい作り話を書くことがあります。",
            "個人情報：利用の有無、日付、注文番号、症状などが入っていないか（上の表）。",
            "約束：返金、無料、次回の割引など、お客様が決めていないことを書いていないか。",
            "繰り返し：同じ書き出し・同じ締めが続いていないか。口コミの具体的な点に触れているか。",
            "承認：★1〜3や体調・事故・法律の話は、取り決めどおり事業者の承認を取ったか。",
          ],
          after: [
            "口コミの内容をAIのサービスに入れるときは、そのサービスが入力をどう扱うかも確認してください。医療や士業のお客様では、口コミの文章に病名や相談の内容が書かれていることがあります。",
          ],
        },
        {
          heading: "返信で終わらせず、サイトに戻す",
          paragraphs: [
            "口コミで繰り返し出る話題（駐車場がない、料金の総額が分からない、予約が取りにくいなど）は、返信だけで答えても、次の人はまた同じことで迷います。AIも口コミとサイトの両方を読むので、サイトに答えがあれば、口コミだけを頼りにした推測が減ります。",
          ],
          list: [
            "月に1回、記録から「同じ話題が2回以上出たもの」を拾います。",
            "その答えを、サイトの該当ページ（アクセス、料金、予約）の本文に書きます。返信で示したページと同じ場所にします。",
            "よく聞かれる形の質問は、FAQにも足します。WordPressで Nurevo AEO を使っている場合は、設定画面に質問と答えを入れ、そのページに Nurevo FAQ ブロック（または [nurevo_faq] ショートコード）を置くと、画面に表示され、そのページだけに FAQPage の構造化データが出ます。ページごとの質問は、編集画面の Nurevo AEO パネルで入れられます。",
            "ビジネスプロフィールの情報（営業時間、属性など）も同じ日に直し、サイトと食い違わないようにします。",
            "直したことを記録の「サイトに反映」の欄に書き、月次の報告に入れます。",
          ],
          after: [
            "Nurevo は口コミの返信を書いたり投稿したりはしません。口コミやGoogleマップは、AIでの登場に影響しうる「Nurevo が変えられない要因」として扱っています。Nurevo が整えるのは、サイトの事実・FAQ・構造化データ・llms.txt の側です。",
          ],
        },
        {
          heading: "制作会社のメニューにする",
          table: {
            head: ["作業", "頻度", "お客様に渡すもの", "注意"],
            rows: [
              ["取り決めを作る", "最初に1回、年1回見直し", "合意した取り決め1枚", "承認が要る口コミ、書かないこと、権限の外し方"],
              ["未返信の口コミに返信", "週1〜2回", "返信と記録", "★4〜5で個人の事情に触れないものだけ"],
              ["承認が要る口コミ", "届いた日", "下書きと、確かめた事実", "謝罪・補償は事業者が決める"],
              ["サイトに戻す", "月1回", "本文・FAQ・ビジネスプロフィールの更新", "返信で示したページと同じ場所に"],
              ["報告", "月1回", "件数、繰り返し出た話題、直したこと、AIの回答の抜粋", "AIの回答は変動する。順位や登場を約束しない"],
            ],
          },
          after: [
            "料金は作業量（店舗数と口コミの件数）で決めるのが一般的ですが、相場を示す公的な資料は見つかりませんでした。返信の件数だけで成果を報告すると、定型文を量産する動機になります。報告は「何を直したか」を中心にしてください。",
            "Nurevo のパートナー向けには、社名・ロゴ入りの月次レポート、複数サイトをまとめて見るダッシュボード、紹介したお客様の月額の40%（Stripe手数料控除後、承認制）の紹介報酬があります。詳しくは[パートナープログラム](/partner/)をご覧ください。",
          ],
        },
        {
          heading: "確かめ方",
          list: [
            "記録の表（口コミの日付・星・話題・返信日・承認した人・サイトに反映したか）を月に1回見て、未返信のまま承認待ちになっている口コミがないか確かめます。",
            "同じ質問を毎月同じ言い方でAIに聞きます（例：「（店名）の評判は？」「（地域）で（業種）を探している。（店名）の駐車場は？」）。回答の抜粋と日付を残し、すでに直した不満や古い事実が繰り返されていないかを見ます。",
            "Googleマップで店名を検索し、返信が公開されているか（審査中のままになっていないか）を確かめます。",
            "店名と「口コミ」「返信」で検索し、返信が第三者の記事やSNSで取り上げられていないかを見ます。",
            "Nurevo の無料のAI診断では、月に1回、Perplexity に3つの質問をして結果を残せます。Pro（月14,800円〜）では Perplexity での登場を続けて測り（ChatGPT は設定され次第）、回答の抜粋を残して、誤りがあれば人が「誤りあり」「目立つ誤りなし」「判断できない」と印を付けます。口コミの返信の効果だけを切り分けて測ることはできません。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "取り決め1枚をお客様と合意している",
            "パスワードではなく、ユーザーの追加でアクセスしている",
            "返信は店名と役職で、個人の氏名を書いていない",
            "★1〜3と体調・事故・法律の話は、事業者の承認を取ってから返信している",
            "医療・士業では、利用の有無や内容に触れない型を使っている",
            "返信に特典・割引の案内を入れていない",
            "AIの下書きを、事実・個人情報・約束・繰り返しの点で人が確かめている",
            "事実と違う口コミには、いまの事実とサイトのページを示している",
            "繰り返し出る話題を、月に1回サイトの本文とFAQに反映している",
            "報告は件数より「何を直したか」を中心にしている",
          ],
        },
      ],
      faqs: [
        { q: "口コミに返信すると、AIに出やすくなりますか？", a: "それを示す公開された調査は見つかりませんでした。公開されたテストでは、ChatGPT や GoogleのAIモードは店の返信をそのまま表示していませんでした。返信の役割は、口コミを読む人とAIに、いまの事実と店の対応を見せることだと考えてください。" },
        { q: "すべての口コミに返信する必要がありますか？", a: "Googleの返信のヒントでは、必要に応じて返信すればよく、全員に公開でお礼を言う必要はないとしています。不満の口コミ、事実と違う口コミ、具体的な質問がある口コミを優先してください。" },
        { q: "制作会社の名前で返信してもいいですか？", a: "返信は「オーナーからの返信」として店の名前で表示されます。文中も店名と役職で書き、制作会社の名前や担当者の氏名は出さないのが自然です。誰が書いたかは記録に残します。" },
        { q: "クリニックの口コミに「ご来院ありがとうございました」と書くのはだめですか？", a: "その人が患者だと店の側が認めることになるので避けてください。米国では口コミへの返信で患者の情報を出した医療機関が和解金を払っています。「個別のご相談やご利用についてはこの場ではお答えしていません」という型を使ってください。" },
        { q: "AIに返信を自動で投稿させてもいいですか？", a: "★4〜5の短いお礼など、取り決めで決めた範囲に限るのが安全です。不満の口コミ、体調・事故・法律の話、医療・士業の口コミは、AIの下書きを人が確かめ、事業者の承認を取ってから公開してください。" },
        { q: "悪い口コミに反論したいと言われました。", a: "事実が違う点は、いまの事実とサイトのページを短く示せば十分です。言い争いを続けると、その返信が第三者に取り上げられ、AIの回答の材料になりかねません。返信は1回にして、直接の連絡先を示してください。" },
        { q: "返信が公開されないのはなぜですか？", a: "Googleは返信をコンテンツポリシーに沿って審査してから公開します。通常は10分以内ですが、約30日かかることもあります。承認されなかった返信は、直して出し直せます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、お客様のサイトをAIがどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ、llms.txt、AI検索のクローラーの許可の状態がわかります。WordPressなら、Nurevo AEOで店の事実とFAQを無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "Google、Googleマップ、Googleビジネスプロフィール、Gemini、GoogleのAIモードはGoogle LLCの、ChatGPT はOpenAIの、Perplexity はPerplexity AIの商標です。Bing、Yelp、Search Engine Land、Search Engine Roundtable、Scalevise、Revfer、WordPressおよび各製品名・サービス名は、それぞれの権利者の商標または登録商標です。公開された情報を紹介するためにだけ名前を挙げています。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },
    en: {
      title: "Review Reply Services and AI Search: A Guide for Agencies | Nurevo",
      description: "How agencies should run review replies for clients: the client agreement, reply patterns, healthcare and legal cautions, AI drafts, and what replies do in AI search.",
      h1: "Running review replies for clients in the AI search era: the agreement, reply patterns and industry cautions",
      lead: "In the public tests we could find, ChatGPT and Google's AI Mode did not quote business owners' review replies directly. Replies still matter: they sit next to the review on Google Maps, where people and AI systems read them as a correction of facts and a record of how the business responds. If your agency replies on a client's behalf, put the rules on one page first (whose name, which reviews need the client's approval, what never goes in a reply), use a pattern that never confirms someone was a patient or client in healthcare and legal work, have a person check every AI draft, and answer recurring questions on the client's website, not only in replies.",
      intro: [
        "Written 27 November 2026 (JST). We read Google Business Profile Help (managing reviews, reply tips, managing a profile with Gemini), the U.S. Department of Health and Human Services (HHS) announcements and the Japanese Penal Code on the same day.",
        "This guide is for web and local SEO agencies that manage clients' Google Business Profiles. Asking for reviews and building testimonial pages are covered in [Reviews, testimonials and AI search](/guide/agency-reviews-testimonials-ai-search); this page is only about replies. Replying consistently does not guarantee a client will appear in AI answers. Answers change by day and by wording, and no AI company has published how it treats owner replies.",
      ],
      sections: [
        {
          heading: "What is actually known about replies and AI answers",
          paragraphs: [
            "Many articles claim that replying makes AI more likely to recommend you. Almost none cite evidence. This is what we could verify.",
          ],
          table: {
            head: ["What is known", "Source"],
            rows: [
              ["Google reviews each reply against its content policy before publishing it: usually within 10 minutes, sometimes up to about 30 days. A reply that is not approved can be edited and resubmitted", "Google Business Profile Help, \"Manage customer reviews\""],
              ["The reply shows as a response from the owner; the individual's name is not shown. The reviewer is notified and can edit the review afterwards (its date updates)", "Same page"],
              ["Google's reply tips: be concise; reply as needed (no need to thank every reviewer publicly); no need to offer deals; on negative reviews, don't reveal personal information, ask the reviewer to contact you by email or phone, apologise for real mistakes and explain what you can't do; reply promptly", "Google Business Profile Help (reply tips)"],
              ["The Gemini web app can summarise reviews and draft or delete replies, but only for a personal Google Account (18+) that owns or manages exactly one verified Business Profile", "Google Business Profile Help (Gemini)"],
              ["Google has been testing \"Reply to reviews with AI\" in some businesses' dashboards (March 2026, reported from a screenshot; no announcement from Google)", "Search Engine Roundtable (2026-03-24)"],
              ["ChatGPT and Google AI Mode did not display owner replies from Google Business Profiles, Bing Places or Yelp directly; they tended to surface third-party content about problematic reviews or replies", "Scalevise (2026-10-14), reporting Search Engine Land testing; we could not read the original and no sample or method is given"],
              ["Across 400 businesses and about 88,000 Google reviews in the Boston area (2019–2026), the share of owner replies containing an em dash rose from 0.1% to 4.2%. The authors call this a hint of AI-written replies, not proof", "Revfer (sells review reply tools), press release 2026-11-08"],
            ],
          },
          after: [
            `Sources: [Manage customer reviews](${SRC.gbpReplyEn}), [reply tips](${SRC.gbpTipsEn}), [Manage your Business Profile with Gemini](${SRC.gemini}), [Search Engine Roundtable](${SRC.ser}), [Scalevise](${SRC.scalevise}), [Revfer release](${SRC.revfer}). Google served the Japanese version of the first two help pages when we requested English, so we checked their wording in Japanese.`,
            "The practical reading: a reply's job is less \"text an AI will quote\" and more \"show readers, human or machine, the current facts and how the business handles problems\" — and never to become the story. A hostile reply is more likely to reach an AI answer through the blog post or thread that criticises it than through the reply itself.",
          ],
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "On 27 November 2026 we read the top results for queries such as \"review response AI search\", \"respond to Google reviews\" and their Japanese equivalents: seven in English and eight in Japanese. Templates are plentiful. What an agency needs to run the work is not.",
          ],
          table: {
            head: ["Missing", "What this guide adds"],
            rows: [
              ["Targets such as \"reply to 80% within 24 hours\" and claims that replies lift rankings, without sources", "Only what Google's own help pages confirm; no invented targets"],
              ["Confidentiality for healthcare and legal clients: covered in depth by one or two English articles and none of the Japanese ones", "A reply pattern that never confirms a visit, plus two HHS settlements"],
              ["Who approves what. Most stop at \"have a human check\"", "A one-page agreement: which reviews need approval, deadlines, what never goes in a reply, the log"],
              ["How replies show up in AI answers. Few articles test it, and those that do don't show their method", "What is and isn't known, and a monthly check you can run"],
              ["Nothing after the reply", "Feeding recurring questions back into the site and FAQ (with WordPress steps)"],
            ],
          },
        },
        {
          heading: "Agree the rules with the client before you reply",
          paragraphs: [
            "Replies are published under the client's business name. The client is responsible for what they say, and an apology or refund your team writes on its own becomes a promise the client never made. Agree one page like this at the start and urgent replies stop being a judgement call.",
            "Ask the client to add your agency's account as a user on the Business Profile rather than sharing their password (check Google's help for the role types), and write down that access is removed when the contract ends.",
          ],
          code: RULES_EN,
        },
        {
          heading: "Reply patterns",
          paragraphs: [
            "Patterns are there to make sure the right elements go in, not to make every reply start the same way. Identical replies read as boilerplate to people and machines alike. Every reply should mention at least one specific thing from the review.",
          ],
          code: REPLY_EN,
          after: [
            "On a positive review, add one fact the next customer can use (booking, parking, payment). As Google's tips say, leave out offers and promotions.",
            "On a complaint, separate what you apologise for from what is factually wrong. Say what changed if you can; if not, invite the reviewer to contact you directly. Reply once and don't argue.",
            "When a review gets a fact wrong (closing days, prices, parking), state the current fact briefly and name the page on the website where it is published. If the site doesn't say it yet, add it the same day.",
            "Star-only reviews and short thank-yous don't need a reply; Google's tips say there is no need to thank every reviewer publicly.",
          ],
        },
        {
          heading: "Industry cautions: what never goes in a reply",
          paragraphs: [
            "Even when reviewers reveal that they used a service, a reply that says \"when you came in for X\" means the business has published that person's information. In healthcare and legal work, use a pattern that doesn't even confirm the person was a patient or client.",
          ],
          table: {
            head: ["Industry", "Keep out of replies", "Why / example"],
            rows: [
              ["Healthcare (clinics, dentists, pharmacies)", "Whether the person is a patient, visit dates, symptoms, diagnosis, treatment, insurance", "HHS settled with a New Jersey psychiatric practice for $30,000 (2023-06-05) after a reply to a negative review included diagnosis and treatment details, and three other patients' information appeared in replies. A California dental practice paid $23,000 (2022-12-14) over patient information in replies to online reviews. HHS: \"This is a clear NO.\""],
              ["Legal and other professional services", "Whether someone consulted you, case details, the other party", "Lawyers and other professionals have confidentiality duties under their own rules; in Japan, the Penal Code (Article 134) covers lawyers as well as doctors and pharmacists"],
              ["Beauty, wellness, physical therapy", "Promised results, the person's body or condition", "\"Guaranteed results\" is still an advertising claim when it appears in a reply. Discuss conditions in person"],
              ["Restaurants", "What the person ordered or who they were with; conclusions about foreign objects or illness", "Neither admit nor deny before you have investigated. Ask them to contact you"],
              ["Hotels", "Stay dates, room numbers, companions", "It reveals when and with whom someone stayed"],
              ["Online shops", "Order numbers, addresses, delivery details", "Confirm through direct contact"],
              ["Real estate", "Property addresses, deal terms, the other party", "It identifies the property or the parties"],
            ],
          },
          after: [
            `Sources: [HHS, psychiatric practice (2023-06-05)](${SRC.hhsManasa}), [HHS, dental practice (2022-12-14)](${SRC.hhsDental}), [Japanese Penal Code (e-Gov)](${SRC.keiho}). Rules differ by country and profession; when a legal judgement is needed, ask the client's own counsel.`,
          ],
        },
        {
          heading: "When AI writes the first draft",
          paragraphs: [
            "Google itself offers AI drafting through the Gemini web app, but only for a personal account managing a single verified profile, which doesn't fit an agency handling many clients. Whatever tool you use, a person should check these before anything is published:",
          ],
          list: [
            "Facts: hours, prices, parking and booking match the client's current website and Business Profile. AI tools can repeat outdated details or invent plausible ones.",
            "Personal information: no confirmation of a visit, dates, order numbers or symptoms (see the table above).",
            "Promises: no refunds, free services or discounts the client hasn't agreed.",
            "Repetition: openings and sign-offs vary, and the reply mentions something specific from the review.",
            "Approval: 1–3 star reviews and anything about health, accidents or legal matters were approved by the client as agreed.",
          ],
          after: [
            "Before pasting reviews into any AI service, check how that service handles what you enter. Reviews of medical and legal clients often contain diagnoses or case details.",
          ],
        },
        {
          heading: "Don't stop at the reply: fix the site",
          paragraphs: [
            "If the same issue keeps coming up (no parking, unclear total price, hard to book), answering it in replies leaves the next customer just as confused. AI systems read both reviews and the website; when the site answers the question, there is less room for guesses based on reviews alone.",
          ],
          list: [
            "Once a month, pull every topic that appeared twice or more in the log.",
            "Write the answer in the body of the relevant page (directions, pricing, booking) — the same page your replies point to.",
            "Add common questions to the FAQ. On WordPress with Nurevo AEO, enter the question and answer in Settings and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on the page: the questions are displayed there and published as FAQPage structured data on that page only. Page-specific questions go in the Nurevo AEO panel in the editor.",
            "Update the Business Profile (hours, attributes) the same day so it doesn't contradict the site.",
            "Mark the change in the log and include it in the monthly report.",
          ],
          after: [
            "Nurevo does not write or post review replies. It treats reviews and Google Maps as factors it cannot change that can still affect AI visibility. What Nurevo looks after is the site side: facts, FAQ, structured data and llms.txt.",
          ],
        },
        {
          heading: "Turning it into an agency service",
          table: {
            head: ["Task", "How often", "Deliverable", "Watch out for"],
            rows: [
              ["Write the agreement", "Once, reviewed yearly", "Signed one-page agreement", "Which reviews need approval, what never goes in, removing access"],
              ["Reply to unanswered reviews", "Once or twice a week", "Replies and log entries", "Only 4–5 stars with nothing personal"],
              ["Reviews that need approval", "The day they arrive", "Draft plus the facts you checked", "Apologies and compensation are the client's decision"],
              ["Feed back into the site", "Monthly", "Page, FAQ and Business Profile updates", "Same page your replies point to"],
              ["Report", "Monthly", "Counts, recurring topics, what was fixed, AI answer excerpts", "AI answers vary; promise no ranking or appearance"],
            ],
          },
          after: [
            "Pricing usually follows the workload (locations and review volume); we found no public benchmark. Reporting only the number of replies rewards boilerplate, so make \"what we fixed\" the centre of the report.",
            "Nurevo partners get monthly reports under their own name and logo, a dashboard covering all client sites, and a referral commission of 40% of each referred customer's monthly fee, net of Stripe fees (approval required). See the [partner program](/partner/?lang=en).",
          ],
        },
        {
          heading: "How to check",
          list: [
            "Review the log (date, stars, topic, reply date, approver, site updated) monthly and look for reviews stuck waiting for approval.",
            "Ask AI assistants the same questions in the same words each month (for example \"What do people say about (business)?\" or \"Does (business) in (area) have parking?\"). Keep the excerpts and dates, and look for complaints you have already fixed or outdated facts being repeated.",
            "Search the business on Google Maps and confirm replies are live, not stuck in review.",
            "Search the business name with \"review\" and \"reply\" to see whether any reply has been picked up by third-party articles or social posts.",
            "Nurevo's free AI check asks Perplexity three questions once a month and keeps the results. Pro (from USD 99/month) measures appearances on Perplexity continuously (ChatGPT once configured), keeps answer excerpts, and lets a person mark each as \"confirmed error\", \"no obvious error\" or \"uncertain\". It cannot isolate the effect of review replies alone.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "The one-page agreement is signed off by the client",
            "You access the profile as an added user, not with the client's password",
            "Replies are signed with the business name and a role, never a full name",
            "1–3 star reviews and anything about health, accidents or legal matters are approved first",
            "Healthcare and legal clients use a pattern that never confirms a visit or case",
            "No offers or discounts in replies",
            "A person checks every AI draft for facts, personal information, promises and repetition",
            "Replies to factual errors give the current fact and the page where it is published",
            "Recurring topics are added to the site and FAQ every month",
            "Reports centre on what was fixed, not on reply counts",
          ],
        },
      ],
      faqs: [
        { q: "Does replying to reviews make AI more likely to recommend a business?", a: "We found no published study showing that. In the public testing we could find, ChatGPT and Google AI Mode did not display owner replies directly. Treat replies as a way to show readers, people and AI systems, the current facts and how the business responds." },
        { q: "Do we need to reply to every review?", a: "Google's reply tips say to reply as needed and that there is no need to thank every reviewer publicly. Prioritise complaints, reviews with factual errors and reviews that ask a question." },
        { q: "Can we sign replies with the agency's name?", a: "Replies appear as a response from the owner under the business name. Sign them with the business name and a role; keep the agency's and staff members' names out. Record who wrote each reply in the log." },
        { q: "Is \"Thanks for visiting our clinic\" a safe reply?", a: "No. It confirms the reviewer is a patient. U.S. providers have paid settlements over patient information in review replies. Use a pattern such as \"We don't discuss individual visits here; please call our front desk.\"" },
        { q: "Can we let AI post replies automatically?", a: "Limit it to what the agreement allows, such as short thank-yous on 4–5 star reviews. Complaints, health, accident or legal matters, and all healthcare and legal clients need a person to check the draft and the client to approve it." },
        { q: "The client wants to argue with a bad review.", a: "For factual errors, a short statement of the current fact and a link to the relevant page is enough. Arguing invites third parties to write about the exchange, and that coverage can end up in AI answers. Reply once and give a direct contact." },
        { q: "Why hasn't our reply appeared yet?", a: "Google reviews replies against its content policy before publishing them. It usually takes under 10 minutes but can take up to about 30 days. A reply that is not approved can be edited and resubmitted." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your client's site",
        body: "The free check needs no sign-up and shows structured data, llms.txt and whether AI search crawlers are allowed. On WordPress, Nurevo AEO sets up the business facts and FAQ for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Install free from WordPress.org", href: WP_ORG },
      },
      footnote: "Google, Google Maps, Google Business Profile, Gemini and Google AI Mode are trademarks of Google LLC; ChatGPT is a trademark of OpenAI; Perplexity is a trademark of Perplexity AI. Bing, Yelp, Search Engine Land, Search Engine Roundtable, Scalevise, Revfer and WordPress are trademarks of their respective owners. Names are mentioned only to report published information. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
