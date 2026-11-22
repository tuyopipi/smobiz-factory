// Content page: AI search (AEO) for unlicensed bodywork shops in Japan
// (整体院・リラクゼーションサロン・もみほぐし・カイロプラクティック). Industry
// page. Angle: these shops have no national licence, so the facts AI needs
// most are what the shop does and does not do (not medical treatment, no
// insurance, who should see a doctor first), plus menu, time, price and the
// practitioner's real training. Separate from 整骨院・接骨院 (柔道整復師, a
// national licence), which has its own article.
//
// Written 2026-11-22 8時 (JST). Nurevo AEO facts come from the plugin source and
// readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2): the
// setup wizard "Beauty salon" card sets BeautySalon and keeps the family
// BeautySalon / HairSalon / NailSalon / DaySpa / HealthAndBeautyBusiness
// (includes/setup-wizard.php, line ~368); the "Clinic or dental" card sets
// MedicalBusiness; free-text "Business type (schema.org type)" field; services
// (up to 20) published as Service + Offer + ReserveAction and an llms.txt
// line; FAQ block / [nurevo_faq]; per-page llms.txt exclusion; monthly free
// check with three questions to Perplexity (never the business name); Pro
// measurement (beta) on Perplexity. Prices: Free 0, Standard 3,000 JPY /
// USD 20, Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-22):
// - 国民生活センター press release 2012-08-02 「手技による医業類似行為の危害」
//   (PDF on mhlw.go.jp): 4,330 consultations, 825 harm reports (PIO-NET, FY2007
//   to 2012-06); マッサージ 281 (34.1%), 整体 240 (29.1%), カイロ 110 (13.3%);
//   神経・脊髄の損傷 177 (21.6%), 骨折 79 (9.6%); 114 of 365 (31.2%) chose the
//   shop from ads/listings; flags ads with 適応症 and 「安全」「無痛」 claims;
//   quotes あはき法 第1条・第12条, 1960-01-27 Supreme Court (only acts that may
//   harm health are banned) and 医発第247号, 1991-06-28 医事第58号 (chiropractic:
//   exclude 椎間板ヘルニア・脊柱管狭窄症・骨粗しょう症 etc., ban high-velocity
//   cervical thrust, stop and refer to medical care if symptoms persist,
//   exaggerated ads regulated), and a 2012-02-29 MHLW 医事課 statement that
//   calling a place that does not do あん摩・マッサージ・指圧 「マッサージ」 may
//   mislead, asking prefectures to stop such advertising.
// - 消費者庁 2017-05-26 「法的な資格制度がない医業類似行為の手技による施術は
//   慎重に」 (copy on 大阪市's site): 1,483 reports 2009-09 to 2017-03; 240
//   (about 16%) needed 1 month+ treatment; mostly 整体・リラクゼーション
//   マッサージ・カイロ; 神経・脊髄の損傷 290, 擦過傷等 229, 骨折 122; ~80% women;
//   advice: see a doctor first if ill, tell the practitioner your condition,
//   say at once if it hurts, don't continue because of 「好転反応」, 188.
// - 総務省 行政評価・監視 2020-11-17 (医業類似行為等による事故): recommendations
//   to 消費者庁 (notification system) and 厚労省 (tell prefectures their powers,
//   guidance); 2nd follow-up 2023-03-27.
// - schema-dts 2.1.0: HealthAndBeautyBusiness subtypes BeautySalon, DaySpa,
//   HairSalon, HealthClub, NailSalon, TattooParlor; Physiotherapy is a
//   MedicalBusiness subtype described as treatment of disease, injury or
//   deformity by physical methods such as massage; Chiropractic exists only as
//   a MedicineSystem enumeration value.
// - Chirovant press release 2026-11-04 (MarTech Edge): Plano TX test
//   2026-10-25, five ChatGPT runs, same clinic named each time; a 5.0-star,
//   45-review practice never named. Vendor test, small sample (stated).
// - Google "AI features and your website" (checked 2026-11-01 for
//   hair-salon-ai-search): no extra requirements or special markup.
// Top articles read 2026-11-22: uravation 整骨院・整体院 (2026-09-05),
// uravation 整体予約AI (2026-09-22), assist-all エステ (2026-01-30), @SOHO 整体師
// AI活用 (2026-08-13), GMO ローカルAIO (2026-11-16), キャククル 整体院の広告
// (2020-05-14), uravation 美容室・サロン (2026-09-05); MASSAGE Magazine
// (2026-08-26), Sagnik Bhattacharya chiropractors (2026-11-04), MassageBook
// (2026-08-18), Zenoti (2025-06-30), Chirovant/MarTech Edge (2026-11-04),
// Perfect Patients GEO, Semrush local AI (2026-07-15).
// Not verified, so not stated: the 総務省 report body (only the press release
// was read), the MHLW leaflet 0000118514.pdf, whether 療養費 can ever apply to
// an unlicensed shop (the page only advises stating the shop's own policy),
// rules outside Japan, any typical price, the share of people who choose a
// shop via AI, penalties and amounts.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  kokusen2012: "https://www.mhlw.go.jp/stf/shingi/2r9852000002lamn-att/2r9852000002latt.pdf",
  caa2017: "https://www.city.osaka.lg.jp/lnet/cmsfiles/contents/0000432/432229/20710526.pdf",
  soumu2020: "https://www.soumu.go.jp/menu_news/s-news/hyouka_021117000145332.html",
  soumu2023: "https://www.soumu.go.jp/menu_news/s-news/hyouka_230327000164379.html",
  chirovant: "https://martechedge.com/news/chirovant-report-examines-how-ai-search-is-changing-chiropractic-marketing",
  hab: "https://schema.org/HealthAndBeautyBusiness",
  daySpa: "https://schema.org/DaySpa",
  physio: "https://schema.org/Physiotherapy",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HealthAndBeautyBusiness",
      "@id": "https://example.jp/#organization",
      "name": "例ボディケア整体（例）",
      "description": "肩・首・腰まわりの手技によるボディケアと、もみほぐしの店です。医療機関ではなく、病気の診断や治療は行いません。健康保険は使えません。",
      "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯市◯◯町1-2-3 ◯◯ビル2階" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Mo-Sa 10:00-21:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "全身ボディケア 60分",
      "description": "着衣のまま、手技で全身をほぐします。強さは施術中に調整できます。妊娠中の方、治療中の病気がある方は、事前に医師に相談のうえご予約ください。",
      "category": "ボディケア",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": { "@type": "Offer", "price": "6600", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/reserve" },
        "result": { "@type": "Reservation", "name": "全身ボディケア 60分" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HealthAndBeautyBusiness",
      "@id": "https://example.com/#organization",
      "name": "Example Body Care Studio",
      "description": "Hands-on body care and relaxation for the neck, shoulders and back. We are not a medical provider: we do not diagnose or treat illness, and health insurance does not apply.",
      "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Example St, 2nd floor, Example City" },
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Mo-Sa 10:00-21:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Full-body care, 60 minutes",
      "description": "Fully clothed, hands-on work over the whole body. Pressure can be adjusted during the session. If you are pregnant or being treated for an illness, please check with your doctor before booking.",
      "category": "Body care",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": { "@type": "Offer", "price": "45", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/book" },
        "result": { "@type": "Reservation", "name": "Full-body care, 60 minutes" }
      }
    }
  ]
}`;

export default {
  slug: "seitai-relaxation-salon-ai-search",
  targetQueries: [
    "bodywork relaxation salon AI search optimization",
    "massage shop ChatGPT visibility without medical claims",
    "HealthAndBeautyBusiness schema relaxation salon",
    "整体院 AI検索対策",
    "リラクゼーションサロン ChatGPT 集客 LLMO",
    "整体 広告表現 治る 書き方",
  ],
  related: ["esthetic-salon-ai-search", "hair-salon-ai-search", "pricing-page-ai-search", "person-profile-page-ai-search", "booking-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "整体院・リラクゼーションサロンのAI検索対策：線引きと書き方 | Nurevo",
      description: "整体・リラクゼーションのAI検索対策は、医療ではないこと、メニューの時間と料金、施術者の経歴、医師に相談すべき人を本文と構造化データで正確に出すこと。公的資料、表現の言い換え表、手順つき。",
      h1: "整体院・リラクゼーションサロンのAI検索対策：「治療ではない」線引きと、メニュー・料金・施術者の情報をAIに正しく読ませる",
      lead: "整体院・リラクゼーションサロンのAI検索対策（AEO）の中心は、AIに「腰がつらいけど整体と病院どっちがいい？」「◯◯駅で60分いくらのもみほぐし」と聞かれたときに、店のサイトが正確に答えられる状態にすることです。何をする店で、何をしない店か（医療ではない、保険は使えない、どんな人は先に医師に相談すべきか）、メニューごとの時間と税込料金、施術者の実際の経歴を本文に文字で書き、同じ事実をHealthAndBeautyBusinessの構造化データとllms.txtで公開します。「治る」「改善」と強く言うほどAIに選ばれる、ということはありません。",
      intro: [
        "作成日：2026年11月22日（JST）。法律・行政の情報は、本文に記した国民生活センター・消費者庁・総務省の資料で確認したものです。この記事は法的な助言ではありません。広告の表現は、管轄の保健所などに確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが店の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。国家資格（柔道整復師）の整骨院・接骨院は、この記事の対象ではありません。",
      ],
      sections: [
        {
          heading: "整体・リラクゼーションについて、AIはどんな質問をされているか",
          paragraphs: [
            "整体やもみほぐしを探す人の質問には、場所と時間の質問（「駅の近くで夜9時まで」）と、体の不安の質問（「ぎっくり腰でも行っていい？」「整体と整骨院の違いは？」）が混ざります。後者は、医療に近い話題なので、AIは慎重に答えようとします。店のサイトに「何をして、何をしない店か」が書かれていないと、AIは店を答えに使いにくくなるか、一般論や口コミから推測して答えます。",
            "つまり、この業種では、上手な宣伝文よりも「線引きがはっきりした事実」のほうが、AIにとって使いやすい材料になります。",
          ],
          table: {
            head: ["よくある質問の型", "質問の例", "AIが答えに必要な、店側の事実"],
            rows: [
              ["何をする店か", "「整体とリラクゼーションと整骨院、何が違う？」", "施術の内容（手技、着衣かどうか）、医療機関ではないこと、国家資格の有無"],
              ["行っていいか", "「腰痛がひどいけど整体に行っていい？」", "医師に先に相談してほしい人（強い痛み、しびれ、治療中、妊娠中など）、その場合の案内"],
              ["料金と時間", "「◯◯駅でもみほぐし60分いくら？」", "メニューごとの時間と税込料金、延長、指名料、キャンセル料"],
              ["保険", "「整体は保険がきく？」", "健康保険が使えるかどうか（使えないなら、そう書く）"],
              ["施術者", "「資格を持っている人がやってる？」", "施術者の経歴、持っている資格の正確な名前（民間資格なら団体名）"],
              ["予約と当日", "「当日予約できる？女性スタッフは？」", "予約の方法、当日枠、スタッフの指定、支払い方法"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
          after: [
            `口コミの数だけでは足りないことを示す例として、アメリカのカイロプラクティックの集客会社 Chirovant が、テキサス州プレイノで「坐骨神経痛に強いカイロプラクター」をChatGPTに5回聞いたところ、毎回同じ院が挙がり、星5.0・口コミ45件の院は一度も挙がらなかったと公表しています（2026年10月25日の自社テスト、2026年11月4日のプレスリリース）。[MarTech Edge：Chirovant Report](${SRC.chirovant})。集客サービスを売る会社の小さな標本で、日本にそのまま当てはまるものではありませんが、AIが評価の星だけで店を選んでいるわけではないことを示す一例です。`,
          ],
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            "2026年11月22日に、日本語と英語で「整体 AI検索対策」「massage chiropractic AI search」などの上位記事を13本読みました。整体を直接扱う日本語の記事は少なく、多くは整骨院（国家資格）と整体を一緒に扱うか、エステや美容室の話でした。整体が国家資格ではないことと、言ってはいけない表現の対比をはっきり書いた記事はありましたが、その根拠になる公的資料（国民生活センターや消費者庁の危害の件数、厚生労働省の通知）まで示した記事、WordPressでの設定手順、構造化データの型を何にするか、AIの回答を確かめる方法まで書いた記事は見つかりませんでした。",
            "英語の記事は、Googleビジネスプロフィールと口コミの話が中心で、施術の効果をどう書くかの注意はほとんどありませんでした。この記事では、その抜けを埋めます。",
          ],
        },
        {
          heading: "公的な資料で決まっている線引き",
          paragraphs: [
            `整体・カイロプラクティック・リラクゼーションの手技には、法律で決められた資格がありません。国民生活センターの2012年8月2日の発表は、あん摩マッサージ指圧師・はり師・きゅう師の法律（あはき法）の第1条で、医師以外の人があん摩・マッサージ・指圧を仕事にするには免許が必要とされていること、第12条で、それ以外の医業類似行為を仕事にすることが原則として禁じられていることを紹介しています。そのうえで、1960年1月27日の最高裁判決により、禁止の対象は人の健康に害を及ぼすおそれのある行為に限られると解釈されている、と説明しています。[国民生活センター：手技による医業類似行為の危害（2012年8月2日）](${SRC.kokusen2012})`,
            "同じ資料が紹介している厚生労働省の1991年6月28日の通知（医事第58号）は、カイロプラクティックについて、椎間板ヘルニア・脊柱管狭窄症・骨粗しょう症などの人には施術しないこと、首を急にひねるような危険な手技を禁じること、症状が続く・悪くなる場合は施術をやめて医療を受けさせること、がんが治るといった誇大な広告を規制することを挙げています。また、2012年2月29日の厚生労働省の会議では、あん摩・マッサージ・指圧をしない施設が「マッサージ」と名乗ることは誤解を招くおそれがあるとして、都道府県に広告の是正を求めています。",
            `危害の数も公表されています。消費者庁は2017年5月26日、法的な資格制度がない手技による施術で、2009年9月から2017年3月までに1,483件の危害の報告があり、そのうち240件（約16%）は治療に1か月以上かかったと発表しました。報告が多かったのは整体・リラクゼーションマッサージ・カイロプラクティックで、神経・脊髄の損傷が290件、骨折が122件ありました。[消費者庁 2017年5月26日（大阪市の掲載）](${SRC.caa2017})。総務省も2020年11月17日、こうした事故の対策について、消費者庁と厚生労働省に勧告しています。[総務省：医業類似行為等による事故の対策（2020年11月17日）](${SRC.soumu2020})`,
          ],
          after: [
            "店にとっての意味ははっきりしています。AIは、こうした公的な資料も読んだうえで答えをつくります。医療と読める表現や、安全を言い切る表現が店のページにあると、AIの答えの中で店がどう扱われるかは予想できません。反対に、「医療ではない」「こういう人は先に医師へ」と自分から書いている店は、AIが体の不安の質問に答えるときに、根拠として使いやすくなります。",
          ],
        },
        {
          heading: "書かない表現と、代わりに書く事実",
          paragraphs: [
            "次の表は、上の公的資料と、国民生活センターが問題として挙げた広告の例をもとに、この記事が勧める書き換えです。法律の条文の当てはめではないので、迷う表現は管轄の保健所に確認してください。",
          ],
          table: {
            head: ["避けたい表現", "理由", "代わりに書く事実の例"],
            rows: [
              ["「腰痛が治る」「ヘルニアを治療」", "医療と読める。1991年の通知は、ヘルニアなどの人には施術しないよう求めている", "「腰まわりの張りをほぐす60分のコース」「椎間板ヘルニアなどの診断を受けている方は、医師にご相談ください」"],
              ["「患者さま」「診察」「治療院」", "医療機関と誤解される", "「お客さま」「カウンセリング」「施術」"],
              ["「マッサージ」（免許を持つ施術者がいない場合）", "2012年の厚生労働省の会議で、誤解を招くおそれがあるとされた", "「もみほぐし」「ボディケア」「リラクゼーション」"],
              ["「国家資格の技術」（実際は民間資格）", "事実と違う", "「◯◯協会の認定（民間資格）」「施術歴◯年」"],
              ["「安全」「痛みゼロ」「副作用なし」", "国民生活センターが危害につながる広告の例として挙げている", "「強さは施術中に調整します」「痛みを感じたらすぐにお知らせください」"],
              ["「好転反応なので続けて」", "消費者庁は、好転反応と言われても無理に続けないよう呼びかけている", "「施術後に痛みが続く場合は、医療機関を受診してください」"],
            ],
            caption: "国家資格を持つあん摩マッサージ指圧師がいる場合も、広告できる事項はあはき法第7条で限られています。具体的な表現は保健所などに確認してください。",
          },
        },
        {
          heading: "メニューと店のページに書く8つの事実",
          list: [
            "施術の内容：手技か、器具を使うか、着衣のままか、オイルを使うか。",
            "メニューごとの時間と税込料金：「60分 6,600円（税込）」のように、時間と総額をセットで。延長・指名料・初回料金の条件も。",
            "医療機関ではないこと：「病気の診断や治療は行いません」の一文。",
            "健康保険：使えないなら「健康保険は使えません」と書く。",
            "先に医師に相談してほしい人：強い痛みやしびれがある、治療中の病気がある、妊娠中、手術の後など、店の方針として決めている条件。",
            "施術者の経歴：施術歴、研修、資格の正確な名前（民間資格なら発行団体と「民間資格」）。国家資格者がいるなら免許の種類。",
            "予約とキャンセル：予約の方法、当日枠、キャンセル料、支払い方法。",
            "店の基本情報：住所（ビル名・階）、営業時間、定休日、最寄り駅からの道順。",
          ],
          after: [
            "この8つは、AIが「行っていいか」「いくらか」「誰がやるか」に答えるための最低限の材料です。料金表を画像だけで載せている店はよくありますが、画像の中の文字はAIに読まれないことがあるので、本文にも文字で書きます。料金ページの書き方全般は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)、施術者のプロフィールは[人物プロフィールのページのAI検索対策](/guide/person-profile-page-ai-search/)にまとめています。",
          ],
        },
        {
          heading: "構造化データ：医療の型を使わない",
          paragraphs: [
            `schema.orgには、整体やリラクゼーションだけを表す型はありません。schema-dts 2.1.0で確認すると、[HealthAndBeautyBusiness](${SRC.hab})の下にあるのは BeautySalon・DaySpa・HairSalon・HealthClub・NailSalon・TattooParlor です（2026年11月22日確認）。整体・もみほぐしの店はHealthAndBeautyBusiness、温浴やスパの施設が中心なら[DaySpa](${SRC.daySpa})が近い型です。`,
            `注意したいのは[Physiotherapy](${SRC.physio})です。名前は手技療法に近く見えますが、MedicalBusiness（医療）の下の型で、「マッサージなどの物理的な方法による病気・けが・変形の治療」と説明されています。国家資格のない店がこの型を使うと、構造化データの上で医療機関を名乗ることになります。カイロプラクティックも、schema.orgでは医療の体系（MedicineSystem）の値としてあるだけで、店の型ではありません。`,
            "メニューは1つずつServiceとして出し、説明に施術の内容と、医師に相談してほしい人の案内を入れます。Nurevo AEOで登録すると、次のような形になります（値は例です）。",
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データには、本文に見えている事実だけを入れます。効果や「満足度◯%」のような値を入れても、AIや検索での評価が上がるわけではありません。Googleは、AI OverviewsやAI Modeのための特別なschema.orgのマークアップは必要ないとしています。[Google：AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "WordPressの整体・リラクゼーションサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACKなどのSEOプラグインはそのまま使えます。`,
            "初回の設定ウィザードで「美容サロン」を選び、設定画面の「業種（schema.org型）」をHealthAndBeautyBusinessに変えます（スパ施設ならDaySpa）。「クリニック・歯科」は医療の型（MedicalBusiness）になるので選びません。",
            "店の説明に「医療機関ではなく、病気の診断や治療は行いません」「健康保険は使えません」を入れ、住所（ビル名と階まで）・電話番号・営業時間を確認します。",
            "メニューを1つずつサービスとして登録します（最大20件）。サービス名に時間、料金に税込の金額（数字だけ）、通貨にJPY、予約URL、説明に施術の内容と医師に相談してほしい人の案内を入れます。サービス・料金・予約のアクションとして出力され、llms.txtにも1行ずつ載ります。",
            "よくある質問（整骨院との違い、保険、行ってはいけない人、強さの調整、当日予約）を入力し、メニューのページなどにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "/llms.txt を開き、メニュー・料金・アクセス・施術者のページが載っているか確かめます。「◯◯が治った」のような古いブログ記事は、書き直すか、Nurevo AEOパネルでllms.txtに載せない設定にします。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。予約ページの書き方は[予約ページのAI検索対策](/guide/booking-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "予約サイト・Googleビジネスプロフィールとそろえる",
          paragraphs: [
            "リラクゼーションの店は、予約サイトやクーポンの掲載が多い業種です。AIはそれらのページも読むので、サイトと予約サイトでメニューの時間・料金が違ったり、予約サイトだけに「肩こり改善」のような言葉が残っていたりすると、サイトを直しても古い表現が答えに使われることがあります。",
            "メニュー名・時間・税込料金・営業時間は、サイト・予約サイト・Googleビジネスプロフィールで同じにします。料金を変えたときは同じ日に全部を更新し、キャンペーン価格には期間を書いて、終わったら消します。表現の言い換え（上の表）も、予約サイトの紹介文やGoogleビジネスプロフィールの説明に同じように当てはめます。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "「病気の診断や治療は行いません」「健康保険は使えません」が文字で書かれている。",
            "先に医師に相談してほしい人の条件が書かれている。",
            "「治る」「治療」「患者」などの医療と読める言葉を使っていない。",
            "免許を持つ施術者がいないのに「マッサージ」と書いていない。",
            "「安全」「痛みゼロ」「好転反応」を使っていない。",
            "メニューごとに時間と税込料金、延長・指名料・キャンセル料が書かれている。",
            "施術者の資格の名前が正確（民間資格は団体名と「民間資格」）。",
            "構造化データの型がHealthAndBeautyBusiness（またはDaySpa）で、PhysiotherapyやMedicalBusinessではない。",
            "サイト・予約サイト・Googleビジネスプロフィールで、メニュー・料金・営業時間・表現がそろっている。",
            "llms.txtにメニュー・料金・アクセス・施術者のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、お客さんが聞きそうな質問をAIに投げます。「◯◯駅 もみほぐし 夜遅くまで」「◯◯市 整体 女性スタッフ」のような地域＋条件の質問で名前が出るかに加えて、店名を入れて「保険は使える？」「腰痛で行っても大丈夫？」と聞き、答えがサイトの説明と合っているかを記録します。AIが店を医療機関のように説明している場合は、サイトや予約サイトのどこかに医療と読める表現が残っていないかを探します。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（店の名前は含めません）をPerplexityに投げ、回答に店の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
          ],
        },
      ],
      faqs: [
        { q: "整体院のAI検索対策は、何から始めればいいですか？", a: "店のページに「医療機関ではなく、診断や治療は行いません」「健康保険は使えません」と、先に医師に相談してほしい人の条件を書き、メニューごとの時間と税込料金を文字で書くことからです。そのうえで、同じ事実をHealthAndBeautyBusinessの構造化データとllms.txtで公開し、予約サイトやGoogleビジネスプロフィールとそろえます。" },
        { q: "「医療ではない」と書くと、お客さんが来なくなりませんか？", a: "そうとは限りません。AIは体の不安の質問に慎重に答えるので、線引きがはっきりした店のほうが答えの根拠として使いやすくなります。書かずにいると、AIは一般論や口コミから推測して店を説明します。" },
        { q: "整体の店が「マッサージ」と書いてもいいですか？", a: "あん摩マッサージ指圧師の免許を持つ施術者がいない場合は、避けてください。2012年の厚生労働省の会議で、あん摩・マッサージ・指圧をしない施設が「マッサージ」と名乗ることは誤解を招くおそれがあるとされています。「もみほぐし」「ボディケア」などの言葉を使います。" },
        { q: "整体の構造化データにはどの型を使いますか？", a: "HealthAndBeautyBusinessが最も近い型です。スパ施設が中心ならDaySpaを使います。Physiotherapyは医療（MedicalBusiness）の下の型なので、国家資格のない店では使いません。" },
        { q: "お客さんの「腰痛が治った」という口コミを載せてもいいですか？", a: "店のページに効果の体験談として載せると、店が治ると言っているのと同じに読まれます。体験談は施術の雰囲気や接客の内容にとどめ、効果をうたう部分は載せないのが安全です。具体的な扱いは保健所などに確認してください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（HealthAndBeautyBusinessなど）・住所・営業時間・メニュー（サービス）・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコア、月1回の無料のAIチェックは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに店が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが店の事実を正しく読める状態をつくり、出ているか・正しく答えているかを続けて確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが店のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOでメニューと料金の情報を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleとGeminiはGoogle LLC、ClaudeはAnthropicの商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACKはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Bodywork & Relaxation Salons: Clear Lines | Nurevo",
      description: "AEO for bodywork and relaxation salons: state that you are not medical, list session times and prices, practitioners' real training and who should see a doctor first.",
      h1: "AI search for bodywork and relaxation salons: drawing the \"not medical treatment\" line and getting AI to read your menu, prices and practitioners correctly",
      lead: "AI search optimization (AEO) for a bodywork or relaxation salon comes down to making your own site able to answer what people ask AI, such as \"My back hurts: should I see a bodywork shop or a doctor?\" or \"60-minute body care near the station, how much?\" Write what you do and what you do not do (not medical treatment, no health insurance, who should see a doctor first), the length and price of each session, and your practitioners' real training as text on your pages, then publish the same facts as HealthAndBeautyBusiness structured data and in llms.txt. Bold claims that you \"fix\" or \"cure\" things do not make AI more likely to pick you.",
      intro: [
        "Written November 22, 2026 (JST). The legal and government information comes from Japanese sources (the National Consumer Affairs Center, the Consumer Affairs Agency and the Ministry of Internal Affairs and Communications), as cited in the text. In Japan, seitai, chiropractic and relaxation bodywork have no national licence. Rules differ by country, so check the ones that apply to you. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your shop's facts readable to AI. They do not guarantee that an AI will mention your shop or rank it anywhere. Licensed clinics (in Japan, judo therapists' seikotsuin) are not covered here.",
      ],
      sections: [
        {
          heading: "What people ask AI about bodywork and relaxation salons",
          paragraphs: [
            "Questions about bodywork mix place and time (\"near the station, open until 9 pm\") with worries about the body (\"Can I go with a pulled back?\", \"What is the difference between bodywork and a licensed clinic?\"). The second kind is close to medicine, so AI answers it carefully. If your site does not say what you do and what you do not do, AI either finds your shop hard to use in an answer or guesses from general explanations and reviews.",
            "In this trade, facts with a clear line are more useful to AI than clever marketing copy.",
          ],
          table: {
            head: ["Type of question", "Example", "Facts the AI needs from the shop"],
            rows: [
              ["What the shop does", "\"What is the difference between bodywork, relaxation and a licensed clinic?\"", "What the session involves (hands-on, clothed or not), that you are not a medical provider, whether anyone holds a national licence"],
              ["Whether to go", "\"My back pain is bad. Is it OK to go to a bodywork shop?\"", "Who should see a doctor first (severe pain, numbness, under treatment, pregnant) and what you tell them"],
              ["Price and time", "\"60-minute body care near the station, how much?\"", "Length and price including tax for each menu, extensions, nomination and cancellation fees"],
              ["Insurance", "\"Does health insurance cover bodywork?\"", "Whether health insurance applies (if not, say so)"],
              ["Practitioners", "\"Are the staff qualified?\"", "Practitioners' experience and the exact names of their qualifications (for private certificates, the issuing body)"],
              ["Booking", "\"Can I book same day? Can I ask for a female practitioner?\"", "How to book, same-day slots, choosing a practitioner, payment methods"],
            ],
            caption: "The examples illustrate the article. They are not a measurement of how often these questions are asked.",
          },
          after: [
            `As one example of reviews alone not being enough: Chirovant, a US chiropractic marketing firm, asked ChatGPT five times for the best chiropractor for sciatica in Plano, Texas. The same clinic was named every time, and a practice with a 5.0 rating and 45 reviews was never named (its own test on October 25, 2026, press release of November 4, 2026). [MarTech Edge: Chirovant Report](${SRC.chirovant}). It is a small sample from a firm that sells marketing services, but it shows that AI is not choosing shops by star rating alone.`,
          ],
        },
        {
          heading: "What the top-ranking guides leave out",
          paragraphs: [
            "On November 22, 2026, we read 13 top-ranking articles in Japanese and English for searches such as \"seitai AI search\" and \"massage chiropractic AI search\". Few Japanese articles dealt with bodywork shops directly; most lumped them in with licensed clinics or were about esthetic and hair salons. One did state clearly that bodywork has no national licence and contrasted wording to avoid with wording to use, but none cited the public sources behind that line (harm reports from consumer agencies, the health ministry's notices), gave WordPress steps, said which structured data type to use, or explained how to check what AI says.",
            "The English articles focused on Google Business Profile and reviews, and said almost nothing about how to describe results. This article fills those gaps.",
          ],
        },
        {
          heading: "The line drawn by Japan's public sources",
          paragraphs: [
            `In Japan there is no statutory licence for seitai, chiropractic or relaxation bodywork. A National Consumer Affairs Center release of August 2, 2012 explains that Article 1 of the act on massage, acupuncture and moxibustion practitioners requires anyone other than a doctor to hold a licence to practise anma, massage or shiatsu as a business, and that Article 12 in principle bans other medical-like practices as a business. It adds that, following a Supreme Court judgment of January 27, 1960, the ban is read as covering only practices that may harm health. [National Consumer Affairs Center: harm from hands-on medical-like practices, August 2, 2012 (Japanese)](${SRC.kokusen2012})`,
            "The same release cites a health ministry notice of June 28, 1991 on chiropractic: do not treat people with conditions such as herniated discs, spinal stenosis or osteoporosis; ban dangerous techniques such as sudden twisting thrusts to the neck; stop and send the person for medical care if symptoms persist or worsen; and regulate exaggerated advertising such as claims to cure cancer. It also reports that at a ministry meeting on February 29, 2012, calling a place that does not offer anma, massage or shiatsu a \"massage\" shop was described as possibly misleading, and prefectures were asked to correct such advertising.",
            `The harm figures are public too. On May 26, 2017, the Consumer Affairs Agency reported 1,483 harm cases from hands-on practices with no statutory licence between September 2009 and March 2017, of which 240 (about 16%) needed treatment for a month or more. Most reports involved seitai, relaxation massage and chiropractic, with 290 cases of nerve or spinal cord injury and 122 fractures. [Consumer Affairs Agency, May 26, 2017 (Japanese, copy on Osaka City's site)](${SRC.caa2017}). The Ministry of Internal Affairs and Communications also issued recommendations on preventing these accidents to the Consumer Affairs Agency and the health ministry on November 17, 2020. [MIC: accidents from medical-like practices, November 17, 2020 (Japanese)](${SRC.soumu2020})`,
          ],
          after: [
            "For a shop, the meaning is plain. AI writes its answers having read sources like these. If your pages contain wording that reads as medical or that promises safety, you cannot predict how AI will present you. A shop that says \"we are not medical\" and \"these people should see a doctor first\" is easier for AI to use as a source when it answers questions about the body.",
          ],
        },
        {
          heading: "Wording to avoid, and the facts to write instead",
          paragraphs: [
            "The table below is this article's suggested rewording, based on the public sources above and the advertising examples the National Consumer Affairs Center flagged. It is not a reading of the law, so check doubtful wording with your local health authority.",
          ],
          table: {
            head: ["Wording to avoid", "Why", "Facts to write instead (examples)"],
            rows: [
              ["\"Cures back pain\", \"treats herniated discs\"", "Reads as medical. The 1991 notice asks practitioners not to treat people with herniated discs and similar conditions", "\"A 60-minute session to loosen tension around the lower back\", \"If you have been diagnosed with a herniated disc or similar condition, please ask your doctor first\""],
              ["\"Patients\", \"examination\", \"clinic\"", "Suggests a medical provider", "\"Clients\", \"consultation\", \"session\""],
              ["\"Massage\" (in Japan, when no licensed practitioner works there)", "Described as possibly misleading at the 2012 ministry meeting", "\"Body care\", \"relaxation\", \"bodywork\""],
              ["\"Nationally licensed technique\" (when it is a private certificate)", "Not true", "\"Certified by [association] (private certificate)\", \"[n] years of practice\""],
              ["\"Safe\", \"zero pain\", \"no side effects\"", "The National Consumer Affairs Center lists these as examples of ads linked to harm", "\"We adjust the pressure during the session\", \"Tell us straight away if anything hurts\""],
              ["\"That's a healing reaction, keep coming\"", "The Consumer Affairs Agency advises people not to continue just because they are told it is a healing reaction", "\"If pain continues after a session, please see a doctor\""],
            ],
            caption: "In Japan, even licensed anma-massage-shiatsu practitioners may only advertise the items listed in Article 7 of their act. Check specific wording with your local health authority.",
          },
        },
        {
          heading: "Eight facts to put on your menu and shop pages",
          list: [
            "What the session involves: hands-on or with tools, clothed or not, with or without oil.",
            "Length and price for each menu, including tax: pair them, as in \"60 minutes, $45\". Add extension, nomination and first-visit terms.",
            "That you are not a medical provider: one sentence such as \"We do not diagnose or treat illness.\"",
            "Health insurance: if it does not apply, write \"Health insurance does not apply.\"",
            "Who should see a doctor first: the conditions your shop has set, such as severe pain or numbness, illness under treatment, pregnancy or recent surgery.",
            "Practitioners' background: years of practice, training, the exact names of qualifications (for a private certificate, the issuing body and the words \"private certificate\"). If anyone holds a national licence, say which.",
            "Booking and cancellation: how to book, same-day slots, cancellation fees, payment methods.",
            "Basic shop details: address (building and floor), opening hours, closing days, directions from the nearest station.",
          ],
          after: [
            "These eight are the minimum AI needs to answer \"Should I go?\", \"How much?\" and \"Who will do it?\". Many shops post their price list only as an image. Text inside an image may not be read by AI, so put it in the page text as well. For pricing pages in general see [AI search for pricing pages](/guide/pricing-page-ai-search/), and for practitioner profiles see [AI search for person profile pages](/guide/person-profile-page-ai-search/).",
          ],
        },
        {
          heading: "Structured data: do not use a medical type",
          paragraphs: [
            `schema.org has no type just for bodywork or relaxation. Checked in schema-dts 2.1.0, the subtypes of [HealthAndBeautyBusiness](${SRC.hab}) are BeautySalon, DaySpa, HairSalon, HealthClub, NailSalon and TattooParlor (checked November 22, 2026). A bodywork or body-care shop fits HealthAndBeautyBusiness; a spa or bathing facility fits [DaySpa](${SRC.daySpa}).`,
            `Be careful with [Physiotherapy](${SRC.physio}). The name sounds close to hands-on work, but it sits under MedicalBusiness and is described as the treatment of disease, injury or deformity by physical methods such as massage. A shop without a licence that uses it is calling itself a medical provider in its structured data. Chiropractic, too, exists in schema.org only as a value of MedicineSystem, not as a business type.`,
            "Publish each menu as its own Service, with a description of the session and a note on who should see a doctor first. Registered in Nurevo AEO, it looks like this (the values are examples):",
          ],
          code: SCHEMA_EN,
          after: [
            "Put only facts that are visible on the page into structured data. Adding effects or values such as \"satisfaction 98%\" does not raise how AI or search rates you. Google says no special schema.org markup is needed for AI Overviews or AI Mode. [Google: AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "Setting it up on a WordPress bodywork or relaxation site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Your SEO plugin, such as Yoast SEO, Rank Math or All in One SEO, keeps working.`,
            "In the setup wizard, choose \"Beauty salon\", then change \"Business type (schema.org type)\" in the settings to HealthAndBeautyBusiness (DaySpa for a spa facility). Do not choose \"Clinic or dental\": that sets a medical type (MedicalBusiness).",
            "Add \"We are not a medical provider and do not diagnose or treat illness\" and \"Health insurance does not apply\" to the business description, and check the address (with building and floor), phone and hours.",
            "Register each menu as a service (up to 20): the length in the name, the price including tax (number only), currency, booking URL, and in the description what the session involves and who should see a doctor first. They are published as Service, Offer and a booking action, and each gets a line in llms.txt.",
            "Add FAQs (the difference from a licensed clinic, insurance, who should not come, adjusting pressure, same-day booking) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your menu page.",
            "Open /llms.txt and check that your menu, prices, access and practitioner pages are listed. Rewrite old blog posts such as \"How we cured X\", or exclude them from llms.txt in the Nurevo AEO panel. Run the check on the AEO score screen and fix what it finds.",
          ],
          after: [
            "On sites that are not WordPress, the points to check are the same. Enter your URL in the [free check](/check), no sign-up needed, to see the state of your structured data, llms.txt and AI crawler access. For booking pages, see [AI search for booking pages](/guide/booking-page-ai-search/).",
          ],
        },
        {
          heading: "Keep booking sites and Google Business Profile in step",
          paragraphs: [
            "Relaxation shops are often listed on booking and coupon sites. AI reads those pages too, so if menu lengths or prices differ between your site and a booking site, or a booking site still says something like \"fixes stiff shoulders\", the old wording can end up in answers even after you fix your own site.",
            "Keep menu names, lengths, prices including tax and opening hours the same on your site, booking sites and Google Business Profile. When a price changes, update all of them on the same day; give campaign prices an end date and remove them when they end. Apply the rewording from the table above to booking-site descriptions and your Business Profile as well.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "\"We do not diagnose or treat illness\" and \"Health insurance does not apply\" are written as text.",
            "The conditions for seeing a doctor first are written.",
            "No medical-sounding words such as \"cure\", \"treatment\" or \"patients\".",
            "In Japan, no \"massage\" unless a licensed practitioner works there.",
            "No \"safe\", \"zero pain\" or \"healing reaction\".",
            "Each menu has its length and price including tax, plus extension, nomination and cancellation fees.",
            "Practitioners' qualifications are named exactly (private certificates with the issuing body and the words \"private certificate\").",
            "The structured data type is HealthAndBeautyBusiness (or DaySpa), not Physiotherapy or MedicalBusiness.",
            "Menu, prices, hours and wording match across your site, booking sites and Google Business Profile.",
            "llms.txt lists your menu, prices, access and practitioner pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI shows you, and whether it is right",
          paragraphs: [
            "Once the pages are in order, ask AI what your clients would ask. Check whether you are named for local, condition-based questions such as \"body care near [station], open late\" or \"bodywork in [city] with female staff\", and also ask with your shop's name, such as \"Does insurance cover it?\" or \"Is it OK to go with back pain?\", and record whether the answers match your site. If AI describes your shop as if it were a medical provider, look for medical-sounding wording left on your site or a booking site.",
            "AI answers change between runs, so ask the same questions several times, spread over time. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your shop's name) are put to Perplexity, and the plugin records whether the answers named your shop or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a bodywork shop start with AI search?", a: "Write \"We are not a medical provider and do not diagnose or treat illness\", \"Health insurance does not apply\" and the conditions for seeing a doctor first on your pages, along with the length and price of each menu as text. Then publish the same facts as HealthAndBeautyBusiness structured data and in llms.txt, and make them match your booking sites and Google Business Profile." },
        { q: "Won't saying \"not medical\" put clients off?", a: "Not necessarily. AI answers questions about the body carefully, so a shop with a clear line is easier for it to use as a source. If you leave it out, AI describes your shop by guessing from general explanations and reviews." },
        { q: "Can a bodywork shop in Japan call its service \"massage\"?", a: "Avoid it unless a licensed anma-massage-shiatsu practitioner works there. At a 2012 health ministry meeting, calling a place that does not offer anma, massage or shiatsu a \"massage\" shop was described as possibly misleading. Use words such as \"body care\" or \"relaxation\"." },
        { q: "Which structured data type should a bodywork shop use?", a: "HealthAndBeautyBusiness is the closest. Use DaySpa for a spa facility. Physiotherapy is a medical type under MedicalBusiness, so an unlicensed shop should not use it." },
        { q: "Can I post client reviews saying \"my back pain is gone\"?", a: "Posted on your own pages as testimonials about results, they read as if the shop claims to cure. It is safer to keep testimonials to the atmosphere and service and leave out claims about effects. Check specific cases with your local health authority." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (HealthAndBeautyBusiness and others), address, hours, menus (services) and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my shop appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your shop's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your menus and prices for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Google and Gemini of Google LLC, and Claude of Anthropic. Yoast SEO, Rank Math and All in One SEO are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
