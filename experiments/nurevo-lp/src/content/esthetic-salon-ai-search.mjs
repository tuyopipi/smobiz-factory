// Content page: AI search (AEO) for esthetic and hair-removal salons in Japan
// (エステサロン・脱毛サロン・痩身・フェイシャル). Industry page. Angle: the
// questions people ask AI before signing a course contract (total price,
// sessions and expiry, cancellation and refunds, prepayment risk, and the
// line between salon and medical hair removal), and how to publish those
// facts so AI reads them correctly. Hair salons (menus) and dermatology
// clinics (medical) have their own pages.
//
// Written 2026-11-21 17時 (JST). Nurevo AEO facts come from the plugin source
// and readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2):
// the setup wizard "Beauty salon" card sets BeautySalon and keeps the family
// BeautySalon / HairSalon / NailSalon / DaySpa / HealthAndBeautyBusiness
// (includes/setup-wizard.php); free-text "Business type (schema.org type)"
// field; services (up to 20) published as Service + Offer + ReserveAction and
// an llms.txt line; FAQ block / [nurevo_faq]; monthly free check with three
// questions to Perplexity (never the business name); Pro measurement (beta)
// on Perplexity. Prices: Free 0, Standard 3,000 JPY / USD 20, Pro from
// 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-21):
// - 大阪府 FAQ faq_002096 (updated 2026-11-13): エステ over 1 month and over
//   50,000 yen is 特定継続的役務提供; cooling-off 8 days from receiving the
//   legal documents; 関連商品 (health food, underwear) are covered by
//   cooling-off; 中途解約 for any reason after that; limits: before service
//   2万円; after service a+b, a = value of services provided, b = lower of
//   2万円 or 1割 of the unused amount.
// - 広島県 消費生活センター 中途解約 (updated 2024-08-01): table of limits;
//   エステティック: free / 2万円 / lower of 2万円 or 10% of the balance;
//   美容医療 (contracts from 2017-12-01, incl. 脱毛): after service lower of
//   5万円 or 20% of the balance; 契約金額 includes 入会金 and 関連商品.
// - 厚生労働省 医政医発第105号 (2001-11-08, copy on 那覇市's site): irradiating
//   the hair root with a laser or other strong light, whether or not the device
//   is medical, to destroy the papilla etc. is an act that only doctors may do;
//   non-doctors doing it as a business violate 医師法第17条.
// - 消費者庁 caution_041 (no date shown): check 前受金保全措置 before paying a
//   large lump sum in advance for esthetic, 美容医療, language and cram school
//   services; prefer non-lump-sum payment; installment credit lets you refuse
//   future payments but not reclaim what was paid; 188.
// - 福岡市 消費生活センター column 2025-07-10 「脱毛サロンの倒産」: refunds of
//   unused sessions follow the contract's cancellation clause; 通い放題 /
//   永久保証 courses are often split into paid and free periods; little chance
//   of refunds in bankruptcy; pay per visit recommended.
// - J-CAST 2024-11-28 reporting 東京商工リサーチ (2024-11-26): エステ業 bankruptcies
//   88 in 2023 (record), 87 in Jan–Oct 2024.
// - 5W Public Relations, Med Spa AI Visibility Index 2.0 (updated 2026-11-03):
//   24 questions x 3 runs on ChatGPT, Claude, Gemini, Perplexity = 288
//   answers, run 2026-10-30; BOTOX Cosmetic named in 84/288 (29.2%); 46/55
//   Google searches showed an AI Overview. US market, vendor research.
// - schema-dts 2.1.0: HealthAndBeautyBusiness subtypes are BeautySalon,
//   DaySpa, HairSalon, HealthClub, NailSalon, TattooParlor; no hair-removal
//   or esthetic type.
// - Google "AI features and your website" (checked 2026-11-01 for
//   hair-salon-ai-search): no extra requirements or special markup.
// Top articles read 2026-11-21: uravation エステ・脱毛 (2026-09-05), uravation
// 美容室・サロン (2026-09-05), 0120.co.jp aio-156 (2026-10-22), assist-all
// エステ (2026-01-30), assist-all 脱毛 (2026-01-30), GMO ローカルAIO
// (2026-11-16); AestheticsPro (2026-05), AmSpa (2026-03-31), dev.to Gyubin Kim
// (2026-06), 5W index (2026-11-03), Growth99 (2026-10).
// Not verified, so not stated: the 2026-03-25 CAA order mentioned by
// uravation, specific 景品表示法 / 薬機法 wording rules for slimming or skin
// claims, the content of the 概要書面 rules in the ordinance, rules outside
// Japan, any typical price, the share of people who choose a salon via AI.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  osaka: "https://www.pref.osaka.lg.jp/faq/o070120/faq_002096.html",
  hiroshima: "https://www.pref.hiroshima.lg.jp/site/syouhiseikatsucenter/chuutokaiyaku.html",
  mhlw105: "https://www.city.naha.okinawa.jp/_res/projects/default_project/_page_/001/008/817/h131108_105.pdf",
  caaPrepay: "https://www.caa.go.jp/policies/policy/consumer_policy/caution/caution_041",
  fukuoka: "https://www.city.fukuoka.lg.jp/shimin/shohiseikatsu/life/syouhiseikatusentauhoumupeiji/kurashinohint2025/kurashinohinto20250710.html",
  jcast: "https://www.j-cast.com/2024/11/28498946.html?p=3",
  fiveW: "https://www.5wpr.com/research/med-spa-ai-visibility-index-2026/",
  beautySalon: "https://schema.org/BeautySalon",
  daySpa: "https://schema.org/DaySpa",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BeautySalon",
      "@id": "https://example.jp/#organization",
      "name": "例エステサロン（例）",
      "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯市◯◯町1-2-3 ◯◯ビル3階" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Tu-Su 10:00-20:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "光脱毛 両ワキ 6回コース（有効期限1年）",
      "description": "6回・有効期限は契約日から1年。総額は税込、追加料金なし。1回ごとの都度払いも選べます。中途解約の計算方法とクーリング・オフは料金ページに記載しています。医療脱毛ではありません。",
      "category": "脱毛",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": { "@type": "Offer", "price": "33000", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/reserve" },
        "result": { "@type": "Reservation", "name": "光脱毛 両ワキ 6回コース" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BeautySalon",
      "@id": "https://example.com/#organization",
      "name": "Example Beauty Studio",
      "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Example St, 3rd floor, Example City" },
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Tu-Su 10:00-20:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Light-based hair removal, underarms, 6-session course (valid 1 year)",
      "description": "6 sessions, valid for 1 year from the contract date. Total price including tax, no extra charges. Pay-per-visit is also available. How cancellation and refunds are calculated is on our pricing page. This is not medical hair removal.",
      "category": "Hair removal",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": { "@type": "Offer", "price": "240", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/book" },
        "result": { "@type": "Reservation", "name": "Underarm hair removal, 6-session course" }
      }
    }
  ]
}`;

export default {
  slug: "esthetic-salon-ai-search",
  targetQueries: [
    "esthetic salon AI search optimization",
    "hair removal salon ChatGPT visibility",
    "beauty spa BeautySalon schema markup",
    "エステサロン AI検索対策",
    "脱毛サロン ChatGPT 集客 LLMO",
    "エステ 中途解約 料金ページ 書き方",
  ],
  related: ["hair-salon-ai-search", "dermatology-clinic-ai-search", "pricing-page-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "エステ・脱毛サロンのAI検索対策：コース料金と解約の書き方 | Nurevo",
      description: "エステ・脱毛サロンのAI検索対策は、コースの総額・回数・期限、解約と返金、支払い方法、医療脱毛との違いを本文と構造化データで正確に出すこと。法律の上限表、手順、チェック表つき。",
      h1: "エステ・脱毛サロンのAI検索対策：コース料金・解約・医療脱毛との違いをAIに正しく読ませる",
      lead: "エステ・脱毛サロンのAI検索対策（AEO）の中心は、契約の前にお客さんがAIに聞く「総額はいくら？」「途中でやめたらいくら返る？」「医療脱毛と何が違う？」に、サロンのサイトがそのまま答えられる状態にすることです。コースの税込総額・回数・有効期限・支払い方法、クーリング・オフと中途解約の計算方法、医療脱毛ではないことを本文に文字で書き、同じ事実をBeautySalonの構造化データとllms.txtで公開します。効果を強く言い切るほどAIに選ばれる、ということはありません。",
      intro: [
        "作成日：2026年11月21日（JST）。法律・行政の情報は、本文に記した日付の各自治体・省庁のページで確認したものです。この記事は法的な助言ではありません。契約書面の内容は、消費生活センターや専門家に確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがサロンの事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "エステ・脱毛サロンについて、AIはどんな質問をされているか",
          paragraphs: [
            "美容室を探す質問は「駅の近くで日曜に空いている店」のような場所と時間の質問が中心ですが、エステや脱毛サロンでは、契約の前の不安がそのまま質問になります。コースは数万円から数十万円の前払いになることが多く、回数・期限・解約の条件で実際の負担が大きく変わるからです。",
            "そのため、AIがサロンを答えに使うには、メニュー名と料金だけでは足りません。何回で、いつまでに、合計いくらで、途中でやめたらどう計算され、どの支払い方法が選べるのかが、サイトに文字で書かれている必要があります。書かれていなければ、AIは口コミや比較サイト、一般的な説明から推測して答えます。",
          ],
          table: {
            head: ["よくある質問の型", "質問の例", "AIが答えに必要な、サロン側の事実"],
            rows: [
              ["総額", "「◯◯市で全身脱毛、総額いくらくらいのサロン？」", "コースごとの税込総額、回数、追加料金の有無（シェービング代・キャンセル料など）"],
              ["回数と期限", "「6回コースの有効期限は？予約が取れなかったら？」", "有効期限の起点（契約日・初回）、期限切れの扱い、予約の取り方と目安"],
              ["解約・返金", "「途中でやめたら返金される？」", "クーリング・オフの案内、中途解約の計算方法、関連商品の扱い"],
              ["支払いと倒産の不安", "「一括払いしか選べないサロンは避けるべき？」", "都度払い・月払いの有無、前受金の保全措置の有無、ローンの扱い"],
              ["医療脱毛との違い", "「サロン脱毛と医療脱毛、どっちがいい？」", "医療脱毛ではないこと、施術の方法、医療機関を案内する場合の説明"],
              ["勧誘・体験", "「体験に行ったら勧誘される？」", "体験の料金と内容、当日契約しなくてよいこと、勧誘の方針"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
          after: [
            `アメリカの美容医療（メドスパ）の分野では、PR会社の5W Public Relationsが、ChatGPT・Claude・Gemini・Perplexityに24の質問を3回ずつ（計288回答、2026年10月30日実施）聞いた調査で、最も多く名前が出たブランドが288回答中84回（29.2%）だったと公表しています（2026年11月3日更新）。[5W：Med Spa AI Visibility Index 2.0](${SRC.fiveW})。AI可視化のサービスを売る会社の調査で、日本のサロンにそのまま当てはまるものではありませんが、AIの答えが「よく知られた名前」に寄りやすいことを示す一例です。小さなサロンが入り込めるのは、名前の知名度ではなく、具体的な条件の質問に正確に答えられる事実を持っていることです。`,
          ],
        },
        {
          heading: "コース契約のルールを、料金ページにそのまま書く",
          paragraphs: [
            `日本では、エステの契約のうち、期間が1か月を超え、金額が5万円を超えるものは、特定商取引法の「特定継続的役務提供」に当たります。法律で決められた書面を受け取った日から8日間はクーリング・オフができ、健康食品や下着など「施術に必要」として一緒に買った関連商品も対象になります。その後も、契約期間内なら理由を問わず中途解約ができます（大阪府、2026年11月13日更新）。[大阪府：脱毛エステの中途解約](${SRC.osaka})`,
            `中途解約のときにサロンが請求できる額には、上限があります。広島県の消費生活センターの表（2024年8月1日更新）をもとにすると、次のとおりです。[広島県：中途解約](${SRC.hiroshima})`,
          ],
          table: {
            head: ["契約の種類", "サービスを受ける前の解約", "サービスを受けた後の解約"],
            rows: [
              ["エステティック（1か月超・5万円超）", "2万円まで", "受けたサービスの対価＋「2万円」か「契約残額の10%」の低いほうまで"],
              ["美容医療（脱毛など。2017年12月1日以降の契約）", "（広島県の表から読み取れず）", "受けたサービスの対価＋「5万円」か「契約残額の20%」の低いほうまで"],
            ],
            caption: "出典：広島県消費生活センター（2024年8月1日更新）、大阪府FAQ（2026年11月13日更新）。契約金額には入会金や関連商品の代金も含まれます。クーリング・オフ期間中の解約は無料です。",
          },
          after: [
            "上位のAI対策記事の多くは「解約条件を明記しましょう」で止まっていますが、お客さんとAIが知りたいのは計算の仕方です。料金ページには、法律の言葉をそのまま貼るのではなく、自分のサロンのコースに当てはめた例を書くと伝わります。たとえば「6回33,000円（税込）のコースを2回受けたあとに解約する場合、受けた2回分の料金と、残りの金額の10%（上限2万円）を差し引いた額を返金します」のように、計算の順番がわかる形にします。1回あたりの料金をどう決めるか（契約時の単価か、通常料金か）は契約書の決め方によるので、契約書と同じ内容を書いてください。",
            "書いておきたいのは、クーリング・オフの期間と方法、中途解約の計算方法と返金までの日数、関連商品の扱い、有効期限が切れたときの扱いの4つです。「解約できません」「返金しません」のように、法律の扱いと違って読める書き方は、AIにそのまま引用されるとお客さんの誤解を生みます。",
          ],
        },
        {
          heading: "前払いと倒産の不安に、先に答えておく",
          paragraphs: [
            `お客さんが一括の前払いを不安に思うのには理由があります。東京商工リサーチの調査では、脱毛サロンなどのエステティック業の倒産は2023年に88件で過去最多となり、2024年は1〜10月で87件に達しました（J-CASTの2024年11月28日の報道による）。[J-CAST](${SRC.jcast})`,
            `消費者庁は、エステや美容医療などで高額の料金を一括で前払いする前に、契約書面で「前受金保全措置」の有無を確かめること、一括以外の支払い方法がないか検討することを呼びかけています。[消費者庁：高額料金の一括前払い](${SRC.caaPrepay})。福岡市の消費生活センターは、「通い放題」「永久保証」のコースが有償の期間と無償の期間に分かれていることが多く、返金の対象は契約の中途解約の条項によることを案内しています（2025年7月10日）。[福岡市：脱毛サロンの倒産](${SRC.fukuoka})`,
            "サロン側にできるのは、隠さずに書くことです。都度払い・月払いが選べるならそれを料金ページに書き、前受金の保全措置があるならその内容を、ないならないとわかる形で書きます。「通い放題」「保証期間」のコースは、有償の回数と期間、無償になった後の条件を分けて書きます。これらはAIが「一括払いしか選べない？」「保証期間が終わったら？」と聞かれたときに、サロンのページを答えの根拠にできる材料になります。",
          ],
        },
        {
          heading: "医療脱毛との違いを、正直に書く",
          paragraphs: [
            `厚生労働省は2001年の通知（医政医発第105号）で、機器が医療用かどうかにかかわらず、レーザーなどの強いエネルギーを持つ光を毛根に照射して毛乳頭などを破壊する行為を、医師でない者が業として行えば医師法第17条違反になるとしています。[厚生労働省 医政医発第105号（那覇市の掲載）](${SRC.mhlw105})`,
            "サロンのページでは、この通知が医師以外に禁じている行為をしていると読める表現を使わないことが前提です。「毛根を破壊」「医療と同じ効果」「永久に生えない」のような言い方は、AIがそのまま引用すると、サロンが何をしているのかを誤って伝えます。代わりに、「医療脱毛ではありません」「医療機関での脱毛を希望する方には、その旨をご案内します」のように、何をしていて、何をしていないかを書きます。",
            "「サロン脱毛と医療脱毛はどちらがいいか」とAIに聞く人は多いはずです。違いを公平に書いたサロンのページは、比較の答えの中で根拠として扱いやすくなります。医療脱毛を行うクリニックの場合は、BeautySalonではなく医療機関として整えます。[皮膚科・美容皮膚科のAI検索対策](/guide/dermatology-clinic-ai-search/)",
          ],
        },
        {
          heading: "構造化データ：BeautySalonとコースのService",
          paragraphs: [
            `schema.orgには、エステや脱毛だけを表す型はありません。schema-dts 2.1.0で確認すると、HealthAndBeautyBusinessの下にあるのはBeautySalon・DaySpa・HairSalon・HealthClub・NailSalon・TattooParlorです（2026年11月21日確認）。エステ・脱毛サロンは[BeautySalon](${SRC.beautySalon})、温浴やスパの施設が中心なら[DaySpa](${SRC.daySpa})がいちばん近い型です。`,
            "コースは、1つずつServiceとして出します。名前に回数と期限を入れ、料金（Offer）は税込の総額、説明に支払い方法と解約のページの案内を入れます。Nurevo AEOでサロンを登録すると、次のような形になります（値は例です）。",
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データには、本文に見えている事実だけを入れます。効果の大きさや「満足度◯%」のような値を入れても、AIや検索での評価が上がるわけではありません。自分のサイトに載せた口コミを評価の構造化データにしないこと、ステルスマーケティングの扱いは[美容室・サロンのAI検索対策](/guide/hair-salon-ai-search/)にまとめています。Googleは、AI OverviewsやAI Modeのための特別なschema.orgのマークアップは必要ないとしています。[Google：AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "WordPressのエステ・脱毛サロンサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACKなどのSEOプラグインはそのまま使えます。`,
            "初回の設定ウィザードで「美容サロン」を選びます。業種はBeautySalonになります。スパ施設なら、設定画面の「業種（schema.org型）」をDaySpaにします。サロン名・住所（ビル名と階まで）・電話番号・営業時間を確認します。",
            "設定画面で、コースを1つずつサービスとして登録します（最大20件）。サービス名に回数と期限、料金に税込の総額（数字だけ）、通貨にJPY、予約URL、説明に支払い方法と「医療脱毛ではありません」などの事実を入れます。サロンに紐づくService・Offer・予約のアクションとして出力され、llms.txtにも1行ずつ載ります。",
            "料金ページに、総額・回数・期限・支払い方法・クーリング・オフ・中途解約の計算例・関連商品の扱いを文字で書きます。料金表を画像だけにしないでください。",
            "よくある質問（解約・返金、医療脱毛との違い、体験と勧誘、予約の取りやすさ）を入力し、料金ページなどにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "/llms.txt を開き、料金・解約のページ、アクセス、会社情報が載っているか確かめます。終わったキャンペーンのページは、Nurevo AEOパネルでllms.txtに載せない設定にできます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。SEOプラグインとの併用は[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins/)を、料金ページ全般の書き方は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "予約サイト・Googleビジネスプロフィールとそろえる",
          paragraphs: [
            "エステや脱毛サロンは、予約サイトやクーポンの掲載が多い業種です。AIはそれらのページも読むので、サイトと予約サイトでコースの回数・総額・期限が違うと、どちらが正しいかAIには判断できません。初回限定の価格だけが予約サイトに載っていて、通常の総額がどこにも書かれていない、という状態もよくある抜けです。",
            "料金を変えたとき、コースを終了したときは、サイトの本文・構造化データ（サービスの登録）・Googleビジネスプロフィール・予約サイトを同じ日に更新します。キャンペーン価格には期間を書き、終わったら消します。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "コースごとに、税込総額・回数・有効期限（起点も）が文字で書かれている。",
            "シェービング代・キャンセル料など、総額以外にかかる費用の有無が書かれている。",
            "都度払い・月払い・一括払い・ローンなど、選べる支払い方法が書かれている。",
            "クーリング・オフの期間と方法、中途解約の計算方法（自分のコースでの例）、関連商品の扱いが書かれている。",
            "前受金の保全措置の有無、「通い放題」「保証」の有償・無償の期間が書かれている。",
            "医療脱毛ではないことが書かれ、医療行為と読める表現（毛根の破壊、永久など）を使っていない。",
            "体験の料金と内容、当日契約しなくてよいことが書かれている。",
            "構造化データの型がBeautySalon（またはDaySpa）で、コースのServiceの料金が本文と同じ。",
            "サイト・予約サイト・Googleビジネスプロフィールで、回数・総額・期限・営業時間が一致している。",
            "llms.txtに料金・解約のページとアクセスのページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、お客さんが聞きそうな質問をAIに投げます。「◯◯市 光脱毛 都度払いできるサロン」「◯◯駅 フェイシャルエステ 勧誘なし」のような地域＋条件の質問で名前が出るかに加えて、サロン名を入れて「解約したらいくら返る？」「医療脱毛との違いは？」と聞き、答えの内容が料金ページと合っているかも記録します。間違って答えている場合は、その質問に答えている部分がサイトのどこにもないか、予約サイトなどと食い違っていることが多いです。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（サロン名は含めません）をPerplexityに投げ、回答にサロンの名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
          ],
        },
      ],
      faqs: [
        { q: "エステサロンのAI検索対策は、何から始めればいいですか？", a: "料金ページに、コースごとの税込総額・回数・有効期限・支払い方法と、クーリング・オフ・中途解約の計算方法を文字で書くことからです。そのうえで、同じ事実をBeautySalonの構造化データとllms.txtで公開し、予約サイトやGoogleビジネスプロフィールと値をそろえます。" },
        { q: "解約や返金の条件を書くと、解約が増えませんか？", a: "法律で決まっている条件は、書かなくてもお客さんの権利として変わりません。書いていないと、AIは一般的な説明や他の情報から推測して答えます。自分のサロンの条件と計算の例を正しく書いておくほうが、誤解によるトラブルを減らせます。" },
        { q: "エステの中途解約で請求できる額の上限はいくらですか？", a: "期間1か月超・金額5万円超のエステ契約では、サービスを受ける前の解約は2万円まで、受けた後は受けたサービスの対価に「2万円」か「契約残額の10%」の低いほうを足した額までです（大阪府・広島県の消費生活センターの案内による）。具体的な契約は消費生活センター（188）などに確認してください。" },
        { q: "サロン脱毛のページに「医療脱毛と同じ効果」と書いてもいいですか？", a: "避けてください。厚生労働省の通知では、毛根に強い光を当てて毛乳頭などを破壊する行為は医師でなければ行えないとされています。そう読める表現はサロンの施術を誤って伝えます。医療脱毛ではないこと、何をしているかを事実として書きます。" },
        { q: "エステにはどの構造化データの型を使いますか？", a: "schema.orgにエステや脱毛だけの型はないため、BeautySalonが最も近い型です。スパ施設が中心ならDaySpaを使います。医療脱毛を行うクリニックは、BeautySalonではなく医療機関の型で整えます。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（BeautySalonなど）・住所・営業時間・コース（サービス）・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコア、月1回の無料のAIチェックは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTにサロンが必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIがサロンの事実を正しく読める状態をつくり、出ているか・正しく答えているかを続けて確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがサロンのサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOでコースと料金の情報を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleとGeminiはGoogle LLC、ClaudeはAnthropicの商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACKはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "Esthetic & Hair Removal Salon AI Search: Courses, Refunds | Nurevo",
      description: "AEO for esthetic and hair-removal salons: publish course totals, sessions, expiry, refunds, payment options and the medical line in page text and BeautySalon schema.",
      h1: "AI search for esthetic and hair-removal salons: getting AI to read your course prices, refunds and the medical line correctly",
      lead: "AI search optimization (AEO) for an esthetic or hair-removal salon comes down to one thing: making your own site able to answer the questions people ask AI before they sign a course contract. \"What is the total?\", \"What do I get back if I stop halfway?\" and \"How is this different from medical hair removal?\" Write each course's total price, number of sessions, expiry and payment options, your cooling-off and cancellation terms, and the fact that you are not a medical provider as text on your pages, then publish the same facts as BeautySalon structured data and in llms.txt. Bold claims about results do not make AI more likely to pick you.",
      intro: [
        "Written November 21, 2026 (JST). Legal and government information is from Japanese prefectural, city and ministry pages, checked on the dates given in the text. Rules differ by country, so check the ones that apply to you. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your salon's facts readable to AI. They do not guarantee that an AI will mention your salon or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What people ask AI about esthetic and hair-removal salons",
          paragraphs: [
            "Hair salon questions are mostly about place and time: \"a salon near the station open on Sunday\". With esthetic and hair-removal salons, the worries people have before signing a contract become the questions. Courses are often prepaid, from hundreds to thousands of dollars, and the number of sessions, the expiry and the cancellation terms change what a client really pays.",
            "So a menu name and a price are not enough for an AI to use your salon in an answer. It needs to read, as text on your site, how many sessions a course has, by when they must be used, what the total is, how a cancellation is calculated, and which payment options exist. Where that is missing, the AI guesses from reviews, comparison sites and general explanations.",
          ],
          table: {
            head: ["Type of question", "Example", "Facts the AI needs from the salon"],
            rows: [
              ["Total price", "\"Which salons in my city do full-body hair removal, and what does it cost in total?\"", "Total per course including tax, number of sessions, any extra charges (shaving, late cancellation)"],
              ["Sessions and expiry", "\"How long is a 6-session course valid? What if I can't get appointments?\"", "When the expiry starts (contract date or first visit), what happens at expiry, how booking works"],
              ["Cancellation and refunds", "\"Do I get money back if I stop halfway?\"", "Cooling-off terms, how a mid-term cancellation is calculated, what happens to products bought with the course"],
              ["Payment and closure risk", "\"Should I avoid salons that only take full prepayment?\"", "Pay-per-visit or monthly options, whether prepayments are protected, how finance plans work"],
              ["Medical vs salon hair removal", "\"Salon or medical hair removal: which is better?\"", "That you are not a medical provider, the method you use, how you refer clients who want a clinic"],
              ["Trial and sales pressure", "\"Will I get a hard sell at the trial session?\"", "Trial price and content, that no same-day contract is required, your sales policy"],
            ],
            caption: "The examples illustrate the article. They are not a measurement of how often these questions are asked.",
          },
          after: [
            `In the US med spa market, the PR firm 5W Public Relations asked ChatGPT, Claude, Gemini and Perplexity 24 questions three times each (288 answers, run October 30, 2026) and reported that the most-named brand appeared in 84 of the 288 answers (29.2%) (updated November 3, 2026). [5W: Med Spa AI Visibility Index 2.0](${SRC.fiveW}). It is research by a firm that sells AI visibility services and it covers medical aesthetics in the US, but it is one example of AI answers leaning toward well-known names. Where a small salon can get in is not fame but having accurate facts that answer specific, condition-heavy questions.`,
          ],
        },
        {
          heading: "Put the course contract rules on your pricing page",
          paragraphs: [
            `In Japan, esthetic contracts that run longer than one month and cost more than 50,000 yen are \"specified continuous services\" under the Act on Specified Commercial Transactions. Clients can cancel within 8 days of receiving the legally required documents (cooling-off), and related products sold as \"needed for the treatment\", such as supplements or underwear, are covered too. After that, they can still cancel for any reason within the contract period (Osaka Prefecture, updated November 13, 2026). [Osaka Prefecture: cancelling a hair-removal contract (Japanese)](${SRC.osaka})`,
            `What a salon may charge on a mid-term cancellation is capped. Based on the Hiroshima Prefecture consumer centre's table (updated August 1, 2024): [Hiroshima Prefecture: mid-term cancellation (Japanese)](${SRC.hiroshima})`,
          ],
          table: {
            head: ["Contract type (Japan)", "Cancelled before any service", "Cancelled after services began"],
            rows: [
              ["Esthetic services (over 1 month and over 50,000 yen)", "Up to 20,000 yen", "Value of services received, plus up to the lower of 20,000 yen or 10% of the unused balance"],
              ["Cosmetic medical treatment, including hair removal (contracts from December 1, 2017)", "(not readable from the Hiroshima table)", "Value of services received, plus up to the lower of 50,000 yen or 20% of the unused balance"],
            ],
            caption: "Sources: Hiroshima Prefecture consumer centre (updated August 1, 2024), Osaka Prefecture FAQ (updated November 13, 2026). The contract amount includes joining fees and related products. Cancelling during cooling-off is free.",
          },
          after: [
            "Most AI search articles for salons stop at \"state your cancellation terms\". What clients and AI want is how the calculation works. On your pricing page, rather than pasting the wording of the law, apply it to one of your own courses: \"If you cancel a 6-session course of 33,000 yen (tax included) after 2 sessions, we refund the balance after deducting the 2 sessions you received and 10% of the remaining amount (no more than 20,000 yen).\" How the per-session value is set (the contract rate or the regular price) depends on your contract, so write exactly what your contract says.",
            "Four things are worth writing down: the cooling-off period and how to use it, how a mid-term cancellation is calculated and how long a refund takes, what happens to related products, and what happens when a course expires. Wording that reads as if it contradicts the law, such as \"no cancellations\" or \"no refunds\", misleads clients when an AI quotes it. Outside Japan, put your own local rules and your own terms in the same place.",
          ],
        },
        {
          heading: "Answer the prepayment and closure worry before it is asked",
          paragraphs: [
            `Clients have reasons to worry about paying a lump sum up front. In Japan, Tokyo Shoko Research counted 88 bankruptcies of esthetic businesses, including hair-removal salons, in 2023 (a record) and 87 in January to October 2024 (as reported by J-CAST on November 28, 2024). [J-CAST (Japanese)](${SRC.jcast})`,
            `Japan's Consumer Affairs Agency asks people to check the contract documents for whether prepayments are protected before paying a large sum up front for esthetic, cosmetic medical and similar services, and to consider payment methods other than a lump sum. [Consumer Affairs Agency: lump-sum prepayment (Japanese)](${SRC.caaPrepay}). Fukuoka City's consumer centre notes that \"unlimited\" and \"lifetime guarantee\" courses are often split into a paid period and a free period, and that refunds follow the contract's cancellation clause (July 10, 2025). [Fukuoka City: hair-removal salon closures (Japanese)](${SRC.fukuoka})`,
            "What a salon can do is say it openly. If pay-per-visit or monthly payment is available, write it on the pricing page. If prepayments are protected, say how; if they are not, do not imply that they are. For \"unlimited\" or \"guaranteed\" courses, write the paid sessions and period separately from the conditions after the course becomes free. These are the facts an AI can point to when someone asks \"Can I avoid paying everything up front?\" or \"What happens after the guarantee period?\".",
          ],
        },
        {
          heading: "Be honest about the line with medical hair removal",
          paragraphs: [
            `In Japan, a 2001 notice from the Ministry of Health, Labour and Welfare (医政医発第105号) says that irradiating the hair root with a laser or other high-energy light to destroy the papilla and similar structures, whether or not the device is a medical one, is an act that a non-doctor may not perform as a business under Article 17 of the Medical Practitioners Act. [MHLW notice 105, as posted by Naha City (Japanese PDF)](${SRC.mhlw105}). Other countries draw this line differently, so check your own rules.`,
            "On a salon's pages, the starting point is not to use wording that reads as if you perform what that rule reserves for doctors. Phrases like \"destroys the hair root\", \"the same results as a clinic\" or \"never grows back\", quoted by an AI, misdescribe what your salon does. Instead, write what you do and what you do not: \"This is not medical hair removal. If you would like treatment at a medical clinic, we will tell you so.\"",
            "Many people ask AI whether salon or medical hair removal is better. A salon page that sets out the difference fairly is easier for an AI to use as a source in that comparison. If you are a clinic that offers medical hair removal, describe yourself as a medical provider, not a BeautySalon. [AI search for dermatology clinics](/guide/dermatology-clinic-ai-search/)",
          ],
        },
        {
          heading: "Structured data: BeautySalon and a Service per course",
          paragraphs: [
            `schema.org has no type just for esthetic or hair-removal salons. Checked in schema-dts 2.1.0 on November 21, 2026, the subtypes of HealthAndBeautyBusiness are BeautySalon, DaySpa, HairSalon, HealthClub, NailSalon and TattooParlor. The closest type for an esthetic or hair-removal salon is [BeautySalon](${SRC.beautySalon}); for a spa facility, [DaySpa](${SRC.daySpa}).`,
            "Publish each course as its own Service. Put the number of sessions and the expiry in the name, the total including tax in the Offer, and the payment options and a pointer to your cancellation terms in the description. With the salon set up in Nurevo AEO, the output looks like this (values are examples).",
          ],
          code: SCHEMA_EN,
          after: [
            "Put only facts that are visible on the page into structured data. Adding claims about results or \"98% satisfaction\" does not improve how AI or search treats you. For why reviews on your own site should not be marked up as ratings, and the rules on undisclosed sponsored posts, see [AI search for hair and beauty salons](/guide/hair-salon-ai-search/). Google says no special schema.org markup is needed for AI Overviews or AI Mode. [Google: AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "Setting it up on a WordPress esthetic or hair-removal salon site",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO or another SEO plugin if you use one.`,
            "In the setup wizard, choose \"Beauty salon\". The business type becomes BeautySalon; for a spa facility, change \"Business type (schema.org type)\" in Settings to DaySpa. Confirm the name, address (building and floor), phone and opening hours.",
            "Under Settings, add each course as a service (up to 20). Put the sessions and expiry in the service name, the total including tax in the price (digits only), the currency, the booking URL, and in the description the payment options and facts such as \"not medical hair removal\". Each is published as a Service with an Offer and a reservation action linked to your salon, and listed as a line in llms.txt.",
            "On your pricing page, write the totals, sessions, expiry, payment options, cooling-off, a worked cancellation example and how related products are handled, as text. Do not publish the price list only as an image.",
            "Enter your FAQ (cancellation and refunds, the medical line, trials and sales pressure, how easy booking is) and place the Nurevo FAQ block or the [nurevo_faq] shortcode on the pricing page or wherever you want it shown.",
            "Open /llms.txt and check that the pricing and cancellation page, directions and about page are listed. Finished campaign pages can be excluded from llms.txt in the Nurevo AEO panel. Run the diagnosis on the AEO score screen and fix what is missing.",
          ],
          after: [
            "On sites not built with WordPress, check the same items. Enter your URL in the [free check](/check), no sign-up needed, to see the state of your structured data, llms.txt and AI crawler access. For SEO plugins, see [adding local business schema to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/); for pricing pages in general, see [pricing pages and AI search](/guide/pricing-page-ai-search/).",
          ],
        },
        {
          heading: "Keep booking sites and your Google Business Profile in line",
          paragraphs: [
            "Esthetic and hair-removal salons are often listed on booking and coupon sites. AI reads those pages too, so if your site and a booking site show different sessions, totals or expiry for the same course, the AI cannot tell which is right. A common gap is a booking site that shows only an introductory price, with the regular course total written nowhere.",
            "When you change prices or end a course, update your page text, your structured data (the registered services), your Google Business Profile and your booking sites on the same day. Give campaign prices an end date, and remove them when they end.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Each course has its total including tax, number of sessions and expiry (and when the expiry starts) written as text.",
            "Any costs beyond the total, such as shaving or late cancellation fees, are stated.",
            "The payment options (pay-per-visit, monthly, lump sum, finance) are stated.",
            "The cooling-off period and method, how a cancellation is calculated (with an example from your own course) and how related products are handled are stated.",
            "Whether prepayments are protected, and the paid and free periods of \"unlimited\" or \"guaranteed\" courses, are stated.",
            "The page says it is not medical hair removal and uses no wording that reads as a medical procedure (destroying the root, permanent results).",
            "The trial price and content, and that no same-day contract is required, are stated.",
            "The structured data type is BeautySalon (or DaySpa), and course prices in the Services match the page text.",
            "Sessions, totals, expiry and opening hours match across your site, booking sites and Google Business Profile.",
            "llms.txt lists your pricing and cancellation page and your directions page. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI mentions you, and whether it gets you right",
          paragraphs: [
            "Once the facts are in place, ask AI what your clients would ask. As well as area-plus-condition questions (\"salons in my city that offer pay-per-visit hair removal\", \"facials near the station with no hard sell\") to see whether your name comes up, ask with your salon's name included (\"What do I get back if I cancel?\", \"How is it different from medical hair removal?\") and record whether the answer matches your pricing page. When an AI gets it wrong, usually nothing on your site answers that question, or your site and a booking site disagree.",
            "AI answers change between runs, so ask the same questions several times, spread over time. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your salon's name) are put to Perplexity, and the plugin records whether the answers named your salon or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should an esthetic salon start with AI search?", a: "Write each course's total including tax, sessions, expiry and payment options, plus your cooling-off and cancellation calculation, as text on your pricing page. Then publish the same facts as BeautySalon structured data and in llms.txt, and make them match your booking sites and Google Business Profile." },
        { q: "Won't publishing cancellation and refund terms lead to more cancellations?", a: "Terms set by law are the client's rights whether you publish them or not. If they are not on your site, AI guesses from general explanations and other sources. Writing your own terms and a worked example correctly is the better way to avoid disputes caused by misunderstanding." },
        { q: "In Japan, what is the most a salon can charge on a mid-term cancellation?", a: "For esthetic contracts over one month and over 50,000 yen: up to 20,000 yen before any service, and after services begin, the value of the services received plus the lower of 20,000 yen or 10% of the unused balance (per the Osaka and Hiroshima prefectural consumer centres). For a specific contract, check with a consumer centre (188 in Japan)." },
        { q: "Can a salon page say \"the same results as medical hair removal\"?", a: "Avoid it. In Japan, the health ministry's notice says that irradiating the hair root with strong light to destroy the papilla may only be done by doctors. Wording that reads that way misdescribes your treatment. State as fact that it is not medical hair removal, and what you do." },
        { q: "Which structured data type should an esthetic salon use?", a: "schema.org has no esthetic or hair-removal type, so BeautySalon is the closest. Use DaySpa for a spa facility. A clinic offering medical hair removal should use a medical type, not BeautySalon." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (BeautySalon and others), address, hours, courses (services) and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my salon appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your salon's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your courses and prices for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Google and Gemini of Google LLC, and Claude of Anthropic. Yoast SEO, Rank Math and All in One SEO are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
