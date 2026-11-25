// Content page: AI search (AEO) for house cleaning (ハウスクリーニング) and
// housekeeping (家事代行) businesses. Industry page.
// Angle: both are service-area businesses that enter the customer's home, so
// the facts AI needs are the price per item and the conditions for extra
// charges, what happens if something is damaged (補償・保険), how keys and
// absence are handled, who the staff are (資格・研修・認証), and the
// cancellation terms. Separate from emergency-home-repair-ai-search (水回り・
// 鍵・害虫の緊急対応), moving-company-ai-search and
// on-location-photographer-ai-search (service area / GBP rules in depth).
//
// Written 2026-11-25 17時 (JST). Nurevo AEO facts come from the plugin source
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2): the
// address is published only when the address field is filled; the
// "専門サービス" wizard card sets ProfessionalService, so a cleaning business
// picks "その他" and enters HomeAndConstructionBusiness as the schema type
// (HomeAndConstructionBusiness is in webmcp_canary_local_business_types);
// no areaServed field, added via the webmcp_canary_business_node filter
// (Yoast/Rank Math/AIOSEO/Slim SEO values win when active); Services up to 20
// as Service + Offer + ReserveAction and an llms.txt line. Free monthly check:
// three questions to Perplexity from type and area, never the name. Pro
// measurement (beta) on Perplexity. Prices: Free 0, Standard 3,000 JPY / USD 20,
// Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-25):
// - 国民生活センター「ハウスクリーニングのトラブルにご注意」(公表 2025-02-28):
//   cases: aircon cleaning broke a part and the firm became unreachable;
//   換気扇 cleaning quoted 5,000円 by phone led to bathroom/washroom/toilet being
//   added, a contract of about 60万円 (2024年11月受付, 60歳代女性). Advice: 複数社
//   から見積もり; 故障や損傷があったときの補償 (補償の内容や保険に加入しているか)
//   を契約前に確認; 一定の要件に該当する場合にはクーリング・オフ等が適用できる場合.
// - 国民生活センター エアコン修理 (公表 2026-06-03): PIO-NET 2021年度 451件 →
//   2025年度 1,251件; 見積もり額の提示がないまま作業が開始; advice to confirm
//   content and price before work and to check together before the worker
//   leaves. Repair, not cleaning: used only as a related example.
// - 厚生労働省 技のとびら ハウスクリーニング技能士: 職種内容 (在宅家屋や不動産
//   物件を対象に、浴室、台所等…設備機器の清掃); 指定試験機関 page linked is
//   公益社団法人全国ハウスクリーニング協会. Grades / start year NOT read.
// - 内閣官房 資料3 (家事代行サービス認証): 一般社団法人全国家事代行サービス協会
//   operates, 日本規格協会 reviews, 第三者認証, 2016年に創設; 安全・安心, 品質,
//   接遇. Undated page.
// - 経済産業省 令和6年度 家事支援サービス業 調査報告書 (令和7年2月, デロイト
//   トーマツ FA): 2025年1月末日現在 認証事業者は19社 (p.47).
// - 介護関連サービス事業協会「生活支援サービス提供事業者が遵守すべきガイドライン」
//   (策定 2025-03-30, on METI's site): scope includes 掃除・洗濯等の家事支援
//   outside public insurance; publish サービス内容や費用; 解約・キャンセル料等の
//   予定金額; 賠償に関するルール; keys only やむを得ず with 鍵預り証・マニュアル・
//   持出記録; 研修; 苦情窓口. Written mainly with elderly users in mind.
// - Google Business Profile 3038177 / 9157481 (read 2026-11-25 for
//   on-location-photographer-ai-search): hide address for SABs, up to 20
//   areas, about 2 hours' drive, no radius, no keywords in name.
// - schema-dts 2.1.0: HomeAndConstructionBusiness subtypes = Electrician,
//   GeneralContractor, HousePainter, HVACBusiness, Locksmith, MovingCompany,
//   Plumber, RoofingContractor. No cleaning / housekeeping type.
//   DryCleaningOrLaundry is for laundries, not home cleaning.
// Top articles read 2026-11-25: uravation ハウスクリーニング・家事代行
// (2026-08-13, mod 09-05), @SOHO AI集客ツール (2026-05-21, upd 08-19),
// sungrove 集客方法 (2025-10-28, upd 2026-07-15), yoshikazunomori (2026-08),
// GMO AIかんたん集客 AIO (2026-09-11, upd 11-16), stock-sun (no date);
// Texta house cleaning (2025-03), ThinkProfits cleaning, Marchex (2025-08-15),
// Jobber (2026-08-27, mod 11-04), Servgrow, Netpeak (2026-04-10), eSEOspace
// (2026-10-13). (FirstSales URL returned an index page; @SOHO 損害保険 failed.)
// Not verified, so not stated: 技能検定の級・開始年, 家事代行の市場規模の金額,
// 損害保険の補償額の相場, whether 特定商取引法 applies to a given contract,
// US/UK bonding or licensing rules, any figure for how people use AI to find
// cleaners.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  kokusenCleaning: "https://www.kokusen.go.jp/news/data/n-20250228_1.html",
  kokusenAircon: "https://www.kokusen.go.jp/news/data/n-20260603_1.html",
  mhlwSkill: "https://waza.mhlw.go.jp/shokushu/list/housecleaning.html",
  casCert: "https://www.cas.go.jp/jp/seisaku/nipponseichosenryaku/kaji/dai3/shiryou3.pdf",
  metiReport: "https://www.meti.go.jp/meti_lib/report/2024FY/000712.pdf",
  csbaGuideline: "https://www.meti.go.jp/policy/mono_info_service/healthcare/downloadfiles/CSBAseikatsusienngaidorain.pdf",
  gbpGuidelines: "https://support.google.com/business/answer/3038177?hl=ja",
  gbpServiceArea: "https://support.google.com/business/answer/9157481?hl=ja",
  gbpGuidelinesEn: "https://support.google.com/business/answer/3038177?hl=en",
  gbpServiceAreaEn: "https://support.google.com/business/answer/9157481?hl=en",
  homeConstruction: "https://schema.org/HomeAndConstructionBusiness",
  areaServed: "https://schema.org/areaServed",
  uravation: "https://uravation.com/llmo/house-cleaning-kaji-daiko-llmo-taisaku/",
  sungrove: "https://www.sungrove.co.jp/housecleaning-marketing/",
  gmo: "https://www.koukoku.jp/service/suketto/marketer/?p=33462",
  marchex: "https://www.marchex.com/chatgpt-recommended-you-guys-why-ai-search-results-are-the-new-word-of-mouth-for-home-services/",
  jobber: "https://www.getjobber.com/academy/how-do-i-get-my-business-to-appear-in-ai/",
  eseospace: "https://eseospace.com/blog/geo-for-home-service-businesses/",
  texta: "https://www.texta.ai/how-to-rank-business-on-ai/cleaning-and-maintenance/house-cleaning",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HomeAndConstructionBusiness",
      "@id": "https://example.jp/#organization",
      "name": "例クリーン（例）",
      "description": "さいたま市を拠点にしたハウスクリーニングと家事代行です。エアコン・浴室・キッチンなどの箇所別クリーニングと、週1回からの定期の家事代行を行います。作業中の破損は賠償責任保険で補償します（補償の条件は料金ページに記載）。",
      "url": "https://example.jp/",
      "telephone": "+81-00-0000-0000",
      "areaServed": [
        { "@type": "City", "name": "さいたま市" },
        { "@type": "City", "name": "川口市" },
        { "@type": "City", "name": "戸田市" }
      ]
    },
    {
      "@type": "Service",
      "name": "壁掛けエアコンクリーニング（お掃除機能なし）",
      "serviceType": "ハウスクリーニング",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": {
        "@type": "Offer",
        "price": "11000",
        "priceCurrency": "JPY",
        "description": "1台11,000円（税込）、作業時間の目安90分。お掃除機能付きは1台19,800円。防カビ仕上げは1台1,650円の追加で、作業前にご希望を確認します。それ以外の追加料金はかかりません。"
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HomeAndConstructionBusiness",
      "@id": "https://example.com/#organization",
      "name": "Example Clean",
      "description": "House cleaning and housekeeping based in Example City. One-off deep cleans by area (oven, bathroom, kitchen) and recurring housekeeping from once a week. Accidental damage during work is covered by our liability insurance (terms on the pricing page).",
      "url": "https://example.com/",
      "telephone": "+1-000-000-0000",
      "areaServed": [
        { "@type": "City", "name": "Example City" },
        { "@type": "City", "name": "North Town" },
        { "@type": "City", "name": "Riverside" }
      ]
    },
    {
      "@type": "Service",
      "name": "Bathroom deep clean (one bathroom)",
      "serviceType": "House cleaning",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": {
        "@type": "Offer",
        "price": "120",
        "priceCurrency": "USD",
        "description": "$120 per bathroom including tax, about 2 hours. Mould treatment on grout is $25 extra and is agreed before work starts. No other extra charges."
      }
    }
  ]
}`;

const PHP_JA = `// テーマの functions.php か、子テーマ・コードスニペットのプラグインに追加します。
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'City', 'name' => 'さいたま市'),
        array('@type' => 'City', 'name' => '川口市'),
        array('@type' => 'City', 'name' => '戸田市'),
    );
    return $node;
}, 10, 2);`;

const PHP_EN = `// Add to your child theme's functions.php or a code-snippets plugin.
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'City', 'name' => 'Example City'),
        array('@type' => 'City', 'name' => 'North Town'),
        array('@type' => 'City', 'name' => 'Riverside'),
    );
    return $node;
}, 10, 2);`;

export default {
  slug: "house-cleaning-housekeeping-ai-search",
  targetQueries: [
    "ハウスクリーニング AI検索対策",
    "家事代行 LLMO 集客",
    "ハウスクリーニング ChatGPT 紹介される",
    "house cleaning business AI search optimization",
    "cleaning company get recommended by ChatGPT",
    "housekeeping service schema markup service area",
  ],
  related: ["emergency-home-repair-ai-search", "on-location-photographer-ai-search", "pricing-page-ai-search", "booking-page-ai-search", "faq-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "ハウスクリーニング・家事代行のAI検索対策：料金・補償・鍵 | Nurevo",
      description: "ハウスクリーニング・家事代行のAI検索対策。箇所別の料金と追加料金の条件、破損時の補償と保険、鍵の預かり、資格と認証、キャンセル規定をAIに正しく読ませる手順と、構造化データ・WordPressの設定例。",
      h1: "ハウスクリーニング・家事代行のAI検索対策：料金と追加料金、破損の補償、鍵の預かりをAIに正しく読ませる手順",
      lead: "ハウスクリーニングと家事代行のAI検索対策（AEO）で一番大事なのは、お客様が家に人を入れる前に気にすることを、サイトに文字で書いておくことです。具体的には、箇所ごと・時間ごとの税込みの料金と「追加料金がかかる条件」、作業中に物が壊れたときの補償と保険、鍵を預かるかどうかとその管理の仕方、スタッフの研修や資格、キャンセル規定です。そのうえで、対応エリアを市区町村名で書き、Googleビジネスプロフィールと構造化データ（HomeAndConstructionBusiness＋Service＋areaServed）に同じ事実を出します。",
      intro: [
        "作成日：2026年11月25日（JST）。国民生活センター・厚生労働省・内閣官房・経済産業省のページは、本文に記したリンク先で2026年11月25日に確認しました。この記事は法的な助言ではありません。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがあなたのサービスの条件を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。水回りや鍵の緊急対応は[緊急の住まいの修理のAI検索対策](/guide/emergency-home-repair-ai-search/)をご覧ください。",
      ],
      sections: [
        {
          heading: "ハウスクリーニングと家事代行で、AIに聞かれることは違う",
          paragraphs: [
            "ハウスクリーニングは、エアコンや浴室などの箇所を、道具と洗剤を持ったスタッフが単発で掃除するサービスです。家事代行は、掃除・洗濯・料理などの家事を、時間単位で定期的に任せるサービスです。同じ会社が両方を出していることも多いのですが、お客様がAIに聞く質問は違うので、サイトではページを分け、それぞれの質問に答えます。",
          ],
          table: {
            head: ["質問の型", "質問の例", "AIが答えに必要な事実"],
            rows: [
              ["料金（ハウスクリーニング）", "「◯◯市でエアコンクリーニング、お掃除機能付きはいくら？」", "機種・台数ごとの税込み料金、追加料金の条件、作業時間の目安"],
              ["料金（家事代行）", "「家事代行を週1回2時間頼むと月いくら？」", "1時間あたりの料金、最低の時間、交通費、契約期間、入会金の有無"],
              ["補償", "「作業中に壊されたらどうなる？保険はある？」", "賠償責任保険の加入、補償の範囲と対象外、連絡の期限"],
              ["鍵と留守", "「留守のあいだに来てもらえる？鍵は？」", "留守中の作業の可否、鍵の預かりの方法と記録、返し方"],
              ["スタッフ", "「どんな人が来る？毎回同じ人？」", "雇用か委託か、研修、資格や認証、担当の固定の有無"],
              ["キャンセル", "「前日にキャンセルしたら料金はかかる？」", "キャンセル料の時期と割合、日程変更の扱い"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            `2026年11月25日に、日本語と英語で「ハウスクリーニング AI検索対策」「cleaning business AI search」などの上位記事を14本読みました。日本語では[uravationの記事](${SRC.uravation})が、料金を即答できる形で書くこと、損害保険と補償を載せること、対応エリアを市区町村で書くことを勧めていて、方向はこの記事と同じです。ただ、構造化データは名前を挙げるだけで、WordPressでの手順と、AIに出ているかの確かめ方はありません。[サングローブの記事](${SRC.sungrove})などの集客の解説は、SEO・MEO・チラシなどの手段の一覧が中心で、AI検索の具体的な手順はありませんでした。出典のない反応率や広告費の相場が書かれている記事も複数ありました。`,
            `英語では、[Marchex](${SRC.marchex})や[Jobber](${SRC.jobber})が保険や身元確認を「信頼の材料」として載せることを勧め、[eSEOspace](${SRC.eseospace})はGoogleのサービス提供地域の決まりを出典つきで説明しています。一方で、「口コミが50〜100件必要」のような出典のない基準を書いている記事もありました（[Texta](${SRC.texta})）。どの記事にも、追加料金のトラブルの公的な事例、鍵の預かりの具体的な決め方、キャンセル規定の書き方、WordPressでの設定はありませんでした。この記事は、これらを埋めます。`,
          ],
        },
        {
          heading: "料金は「箇所ごとの税込み料金」と「追加料金がかかる条件」で書く",
          paragraphs: [
            `国民生活センターは2025年2月に、ハウスクリーニングのトラブルについて注意を呼びかけました。電話で5,000円と聞いて換気扇の掃除を頼んだところ、浴室・洗面所・トイレの掃除を次々に追加され、約60万円の契約になった事例や、エアコンの掃除で部品が壊れたあと業者と連絡が取れなくなった事例が紹介されています。消費者へのアドバイスは、複数の会社から見積もりを取ってサービス内容と料金を比べること、壊れたときの補償を契約前に確かめることです。[国民生活センター：ハウスクリーニングのトラブルにご注意（2025年2月28日）](${SRC.kokusenCleaning})`,
            "お客様が見積もりを比べ、AIが「いくらか」に答えるには、料金の本体だけでなく、何をすると追加になるかが文字で書かれている必要があります。消費者に前もって示す価格は、税込みの総額で書きます。",
          ],
          table: {
            head: ["書く項目", "書き方の例"],
            rows: [
              ["箇所・機種ごとの料金", "壁掛けエアコン（お掃除機能なし）1台11,000円、お掃除機能付き19,800円（税込）"],
              ["作業時間の目安", "1台90分前後。2台目からは1台あたり60分前後"],
              ["追加料金の条件", "防カビ仕上げ1台1,650円。汚れの状態で追加になる作業は、作業前に金額をお伝えし、ご了承いただいてから行います"],
              ["かからないもの", "出張費・駐車場代（対応エリア内）、洗剤・道具代はかかりません"],
              ["家事代行の料金", "1時間3,300円（税込）、1回2時間から。交通費1回550円。入会金なし、定期は月4回から"],
              ["総額の例", "お掃除機能なしのエアコン2台なら22,000円（防カビ仕上げなし）"],
            ],
            caption: "金額は説明のための例です。自分の実際の料金を書いてください。",
          },
          after: [
            "料金を画像だけで出している場合は、同じ内容を本文に文字でも書きます。料金ページの書き方全般は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "破損したときの補償：保険の有無、範囲、連絡の期限を書く",
          paragraphs: [
            "国民生活センターのアドバイスにあるとおり、お客様は「壊れたらどうなるか」を契約前に知りたいと考えています。AIに「保険に入っている業者は？」と聞かれたときに答えられるように、補償について次の項目を書きます。「万全の補償」のようなあいまいな言葉ではなく、条件を書くのがポイントです。",
          ],
          table: {
            head: ["書く項目", "書き方の例"],
            rows: [
              ["保険の加入", "作業中の事故に備えて、賠償責任保険に加入しています（保険会社名は任意）"],
              ["補償の範囲", "作業中に当社のスタッフがお客様の物を壊したり汚したりした場合"],
              ["対象外", "作業前からあった不具合、経年劣化による故障、現金・貴金属など"],
              ["連絡の期限", "作業後7日以内にご連絡ください。写真をいただくと手続きが早く進みます"],
              ["作業前の確認", "エアコンは作業前に動作を確認し、気になる点があれば作業前にお伝えします"],
            ],
            caption: "書き方は例です。補償の範囲や条件は、加入している保険の内容に合わせて書いてください。",
          },
          after: [
            `関連して、国民生活センターは2026年6月に、エアコンの修理のトラブルの相談が2021年度の451件から2025年度の1,251件に増えたと公表し、作業の前に内容と費用を確かめること、業者が帰る前に一緒に動作を確かめることを勧めています。[国民生活センター：エアコン修理のトラブルに注意（2026年6月3日）](${SRC.kokusenAircon})。これは修理の話ですが、「作業前に金額を伝える」「帰る前に一緒に確認する」を自社の手順として書いておくことは、エアコンクリーニングでもお客様の不安に直接答えます。`,
          ],
        },
        {
          heading: "鍵の預かりと留守中の作業：するか・しないか、どう管理するか",
          paragraphs: [
            `家事代行では「留守のあいだに来てもらえるか」がよく聞かれます。介護関連サービス事業協会の「生活支援サービス提供事業者が遵守すべきガイドライン」（2025年3月30日策定、経済産業省のサイトに掲載）は、掃除や洗濯などの家事支援も対象に含め、鍵はやむを得ない場合にだけ預かり、預かり証・マニュアル・持ち出しの記録で管理するよう求めています。[ガイドライン（PDF）](${SRC.csbaGuideline})。主に高齢の利用者を念頭に置いたガイドラインですが、鍵の扱いを書くときの項目として参考になります。`,
          ],
          list: [
            "留守中の作業を受けるか受けないかを、はっきり書きます（例：「初回は在宅をお願いしています。2回目以降は、鍵をお預かりして留守中に作業できます」）。",
            "鍵を預かる場合は、預かり証を出すこと、保管の方法、持ち出しの記録、契約が終わったときの返し方を書きます。",
            "スマートロックやキーボックスを使う場合は、その方法と、暗証番号の扱いを書きます。",
            "作業中の写真の撮影や、終わったあとの報告（チャット・メール）の有無を書きます。",
          ],
        },
        {
          heading: "スタッフ・資格・認証：あるものだけを、正確な名前で書く",
          paragraphs: [
            `ハウスクリーニングには、厚生労働省の技能検定の職種として「ハウスクリーニング」があり、合格するとハウスクリーニング技能士と名乗れます。厚生労働省のページでは、在宅の家屋や不動産物件を対象に、浴室・台所などや設備機器を清掃する職種と説明され、試験の案内は指定試験機関の公益社団法人全国ハウスクリーニング協会のサイトに案内されています。[厚生労働省：ハウスクリーニング技能士](${SRC.mhlwSkill})`,
            `家事代行には、一般社団法人全国家事代行サービス協会が運営し、日本規格協会が審査する「家事代行サービス認証」があります。2016年に作られた第三者の認証で、安全・安心、サービスの品質、接遇の3つの観点で審査します。[内閣官房 資料（PDF）](${SRC.casCert})。経済産業省の調査報告書によると、2025年1月末時点の認証事業者は19社です。[経済産業省 令和6年度 調査報告書（PDF）](${SRC.metiReport})`,
          ],
          list: [
            "資格や認証は、持っているものだけを正式な名前で書きます。級、取得した人数、認証の取得日など、自社の事実を添えると、AIがそのまま答えに使えます。",
            "スタッフが社員か業務委託か、採用のときに何を確認しているか、研修の時間や内容を、言える範囲で書きます。",
            "「毎回同じスタッフか」「スタッフを変えられるか」を書きます。家事代行では、とくによく聞かれます。",
            "スタッフの顔写真や名前を出す場合は、本人の同意を取ってから載せます。",
          ],
        },
        {
          heading: "キャンセルと日程変更：時期と割合で書く",
          paragraphs: [
            "「前日のキャンセルは料金がかかるか」に答えられるように、キャンセル料を時期と割合で書きます。上のガイドラインも、契約の前に解約・キャンセル料などの予定金額を示すよう求めていて、キャンセル料は事業者の損害を超えないこと（消費者契約法第9条）にも触れています。",
          ],
          table: {
            head: ["決めて書くこと", "書き方の例"],
            rows: [
              ["キャンセル料", "前々日まで無料、前日は料金の50%、当日は100%"],
              ["日程変更", "前日の18時までなら無料で変更できます"],
              ["家事代行の定期の解約", "解約は前月末までにご連絡ください。違約金はありません"],
              ["天候や災害", "台風などで伺えない場合は、無料で日程を変更します"],
            ],
            caption: "時期と割合は説明のための例です。自分の実際の規定を書いてください。",
          },
          after: [
            "国民生活センターは、一定の要件にあてはまる場合にはクーリング・オフなどが使える場合があると案内しています。自宅で契約を結ぶ場合など、自社の契約にどの決まりがあてはまるかは、専門家に確認してください。規定は料金ページと予約ページに同じ文で書きます。予約の流れは[予約ページのAI検索対策](/guide/booking-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "対応エリア：市区町村名で書き、Googleビジネスプロフィールとそろえる",
          paragraphs: [
            `ハウスクリーニングと家事代行は、お客様の家に行くサービスなので、「◯◯市に来てくれるか」に答えられるよう、対応エリアを市区町村名で書きます。エリア外の交通費の計算の仕方も書いておきます。店舗で客を迎えない場合、Googleビジネスプロフィールでは「サービス提供地域」のビジネスとして住所を表示しない決まりで、地域は最大20件、拠点から車でおよそ2時間を超えない範囲とされています。ビジネス名に地域名やサービス名を足すことは認められていません。[Google：ビジネス情報のガイドライン](${SRC.gbpGuidelines})・[サービス提供地域の管理](${SRC.gbpServiceArea})。くわしい設定は[出張撮影のAI検索対策](/guide/on-location-photographer-ai-search/)でも説明しています。`,
          ],
          list: [
            "サイトの対応エリア、Googleビジネスプロフィールのサービス提供地域、くらしのマーケットなどのポータルの対応地域を、同じ地域にします。",
            "料金・補償・キャンセル規定も、ポータルとサイトで同じ内容にします。場所ごとに違うと、AIが古い情報を使うことがあります。",
            "フランチャイズの加盟店は、本部のサイトの店舗ページと自店のサイトで、エリアと料金が食い違わないようにします。",
          ],
        },
        {
          heading: "構造化データ：清掃の専用の型はない。HomeAndConstructionBusiness＋Service",
          paragraphs: [
            `schema.orgには、ハウスクリーニングや家事代行のための専用の型はありません。住宅関係の事業者を表す[HomeAndConstructionBusiness](${SRC.homeConstruction})の下にあるのは、電気工事・設備工事・塗装・空調・鍵・引越し・水道・屋根の型です（schema-dts 2.1.0で確認、2026年11月25日）。DryCleaningOrLaundry は衣類のクリーニング店の型なので使いません。事業者は HomeAndConstructionBusiness（または LocalBusiness）で出し、箇所ごとのクリーニングや家事代行のプランを Service と Offer で、対応エリアを[areaServed](${SRC.areaServed})で書きます。自宅や事務所の住所を公開しないなら、address は入れません。`,
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データは、本文に書いた料金・エリア・補償の写しとして使い、本文と同じ内容にします。構造化データだけに書いた事実は、お客様にもAIにも伝わりにくくなります。",
          ],
        },
        {
          heading: "WordPressのハウスクリーニング・家事代行サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「その他」を選び、設定画面の「業種（schema.org型）」に HomeAndConstructionBusiness と入力します。「専門サービス」を選ぶと ProfessionalService になるため選びません。",
            "名前・電話番号・受付時間を入れます。店舗がなく住所を公開しない場合は、住所の欄を空のままにします。住所が空なら、Nurevo AEOは address を出力しません（AEOスコアの診断では住所が不足として数えられますが、公開しない方針なら空欄のままで構いません）。",
            "箇所ごとのクリーニングと家事代行のプランを「サービス」に登録します（最大20件）。名前・時間（分）・料金・予約のURL・説明を入れ、説明に追加料金の条件を書きます。サービスは構造化データ（Service）とllms.txtに載ります。",
            "Nurevo AEOには対応エリア（areaServed）の入力欄がありません。構造化データにも入れたい場合は、下の webmcp_canary_business_node フィルターで足します。Yoast SEOなどが有効な場合は、そのプラグインがすでに出している値が優先されます。",
            "補償・鍵の預かり・スタッフ・キャンセルの答えをよくある質問に入力し、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を料金ページか予約ページに置きます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search/)をご覧ください。",
            "/llms.txt を開き、料金・エリア・補償・予約・よくある質問のページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "ハウスクリーニングと家事代行のページが分かれ、それぞれの料金が税込みで書かれている。",
            "追加料金がかかる条件と、作業前に金額を伝える手順が書かれている。",
            "出張費・駐車場代・洗剤代など、かからないものが書かれている。",
            "賠償責任保険の加入、補償の範囲と対象外、連絡の期限が書かれている。",
            "留守中の作業を受けるかどうかと、鍵の預かり・記録・返し方が書かれている。",
            "スタッフの雇用の形・研修・資格や認証が、正式な名前で、持っているものだけ書かれている。",
            "キャンセル料と日程変更の規定が、料金ページと予約ページで同じ文になっている。",
            "対応エリアが市区町村名で書かれ、Googleビジネスプロフィールとポータルの対応地域と同じ。",
            "構造化データの型が HomeAndConstructionBusiness か LocalBusiness で、料金とエリアが本文と同じ。",
            "llms.txtに料金・エリア・補償・予約・よくある質問のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、お客様が聞きそうな質問をAIに投げます。「◯◯市 エアコンクリーニング お掃除機能付き」「◯◯市 家事代行 週1回」のような地域＋サービスの質問で名前が出るかに加えて、自分の会社の名前を入れて「保険には入っている？」「キャンセル料は？」「留守中でも頼める？」と聞き、答えがサイトの事実と合っているかを見ます。古い料金や、やめたサービスが答えに出ていないかも確かめます。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、結果を記録します。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（事業の名前は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在はPerplexity）。どちらも回答の一部を見本として調べるもので、すべての回答を見ているわけではありません。くわしくは[AIでの登場率の測り方](/guide/measure-ai-visibility/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "ハウスクリーニングのAI検索対策は、何から始めればいいですか？", a: "まず、箇所ごとの税込み料金と、追加料金がかかる条件を料金ページに文字で書きます。次に、破損したときの補償と保険、キャンセル規定を書きます。そのうえで、対応エリアを市区町村名で書き、Googleビジネスプロフィールとそろえ、構造化データとllms.txtで出します。" },
        { q: "ハウスクリーニングと家事代行は、同じページでいいですか？", a: "ページを分けることをおすすめします。ハウスクリーニングは箇所ごとの単発の料金、家事代行は時間あたりの料金と定期の契約が中心で、お客様がAIに聞く質問も違います。会社の情報は1つにまとめ、サービスごとのページを分けます。" },
        { q: "料金を高めに書くと、AIに紹介されにくくなりますか？", a: "料金の高さで紹介されるかどうかが決まる、という公式の情報はありません。大事なのは、料金と追加料金の条件が正確に書かれていて、AIが条件つきで答えられることです。安さを強調した広告と実際の請求の違いは、国民生活センターが注意を呼びかけているトラブルの一つです。" },
        { q: "構造化データの型は何にすればいいですか？", a: "schema.orgに清掃や家事代行の専用の型はないので、HomeAndConstructionBusiness か LocalBusiness にし、箇所ごとのクリーニングや家事代行のプランを Service で表します。DryCleaningOrLaundry は衣類のクリーニング店の型です。" },
        { q: "資格や認証がないと、AIに紹介されませんか？", a: "資格や認証がないと紹介されない、という公式の情報はありません。持っている資格や認証は正式な名前で書き、ない場合は、研修の内容や補償の条件など、確かめられる事実を書きます。持っていない資格や認証を書かないでください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・連絡先・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ず紹介されますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、料金・補償・鍵・キャンセルの事実をAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOでクリーニングや家事代行のプランとよくある質問を無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleはGoogle LLCの商標です。くらしのマーケット、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for House Cleaning & Housekeeping Services | Nurevo",
      description: "AEO for house cleaning and housekeeping: write prices, extra-charge rules, damage cover, insurance, key handling, staff and cancellation terms so AI can answer.",
      h1: "AI search for house cleaning and housekeeping services: getting AI to read your prices, extra charges, damage cover and key policy correctly",
      lead: "AI search optimization (AEO) for a house cleaning or housekeeping business comes down to writing, as text on your site, what people worry about before they let someone into their home: the tax-inclusive price per job or per hour and the exact conditions for extra charges, what happens if something gets damaged and whether you are insured, whether you hold keys and how, who your staff are, and your cancellation terms. Then name the towns you cover, and publish the same facts in your Google Business Profile and in structured data (HomeAndConstructionBusiness, Service and areaServed).",
      intro: [
        "Written November 25, 2026 (JST). The consumer-agency, ministry and certification examples in this article are from Japan, because that is where we checked them on November 25, 2026; insurance, licensing and consumer rules differ by country, so check the ones that apply where you work. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your terms readable to AI. They do not guarantee that an AI will mention you or rank you anywhere. For plumbing, locks and other urgent call-outs, see [AI search for emergency home repairs](/guide/emergency-home-repair-ai-search/).",
      ],
      sections: [
        {
          heading: "House cleaning and housekeeping get different questions",
          paragraphs: [
            "House cleaning here means one-off jobs on specific areas, such as an oven, a bathroom or an air conditioner, done by staff who bring their own tools and products. Housekeeping means recurring help with cleaning, laundry or cooking, billed by the hour. Many businesses offer both, but customers ask AI different questions about each, so give each its own page.",
          ],
          table: {
            head: ["Question type", "Example question", "Facts AI needs from you"],
            rows: [
              ["Price (cleaning)", "\"How much is an oven deep clean in [town]?\"", "Tax-inclusive price per item, conditions for extra charges, typical time"],
              ["Price (housekeeping)", "\"What does a weekly 2-hour housekeeper cost per month?\"", "Hourly rate, minimum hours, travel charge, contract length, sign-up fee"],
              ["Damage", "\"What if they break something? Are they insured?\"", "Liability insurance, what is and is not covered, how soon to report"],
              ["Keys and absence", "\"Can they clean while I'm out? What about keys?\"", "Whether you work in an empty home, how keys are held, logged and returned"],
              ["Staff", "\"Who comes? Is it the same person each time?\"", "Employees or contractors, training, qualifications, fixed cleaner or not"],
              ["Cancellation", "\"Is there a fee if I cancel the day before?\"", "Cancellation fees by date, rescheduling rules"],
            ],
            caption: "The example questions illustrate the article. They are not measured question frequencies.",
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            `On November 25, 2026 we read 14 top-ranking articles in English and Japanese for searches such as \"cleaning business AI search\" and the Japanese equivalents. In English, [Marchex](${SRC.marchex}) and [Jobber](${SRC.jobber}) recommend showing insurance and background checks as trust signals, and [eSEOspace](${SRC.eseospace}) explains Google's service-area rules with sources, although it is written for trades rather than cleaners. Some pages state thresholds without any source, such as needing 50 to 100 reviews ([Texta](${SRC.texta})).`,
            `In Japanese, [uravation's article](${SRC.uravation}) makes the same core points as this one (answerable prices, insurance, towns as the service area) but only names structured data and gives no WordPress steps or way to check results. None of the 14 used a public record of extra-charge disputes, explained how to set and write a key policy, showed how to word cancellation terms, or covered WordPress setup. This article fills those gaps.`,
          ],
        },
        {
          heading: "Write the price per item, and exactly when extras apply",
          paragraphs: [
            `In February 2025 Japan's National Consumer Affairs Center warned about house cleaning disputes. In one case a customer was quoted 5,000 yen by phone to clean a kitchen extractor fan, then had the bathroom, washroom and toilet added one after another, ending with a contract of about 600,000 yen; in another, a part broke during air-conditioner cleaning and the company could no longer be reached. Its advice to consumers: get quotes from several companies and compare the work and price, and check what compensation is offered for damage before signing. [National Consumer Affairs Center, February 28, 2025 (Japanese)](${SRC.kokusenCleaning})`,
            "For customers to compare quotes, and for AI to answer \"how much?\", your site needs the base price and, in words, what makes the price go up. Show tax-inclusive prices where consumers expect or the law requires them.",
          ],
          table: {
            head: ["Item", "Example wording"],
            rows: [
              ["Price per item", "Bathroom deep clean $120 per bathroom; oven $95 (including tax)"],
              ["Typical time", "About 2 hours per bathroom"],
              ["When extras apply", "Grout mould treatment $25. Any extra work is priced and agreed with you before it starts"],
              ["What is included", "No travel or parking charge inside our area; products and equipment included"],
              ["Housekeeping rate", "$38 per hour including tax, 2-hour minimum, $5 travel per visit, no sign-up fee"],
              ["Total example", "Two bathrooms without mould treatment: $240"],
            ],
            caption: "Amounts are examples. Write your real prices.",
          },
          after: [
            "If your prices are in an image, write them in the page text as well. For pricing pages in general, see [pricing pages and AI search](/guide/pricing-page-ai-search/).",
          ],
        },
        {
          heading: "Damage cover: insurance, scope and reporting deadline",
          paragraphs: [
            "As the consumer agency's advice shows, customers want to know what happens if something breaks before they book. To let AI answer \"Which cleaners are insured?\", write the following. Conditions, not phrases like \"fully covered\", are what AI can use.",
          ],
          table: {
            head: ["Item", "Example wording"],
            rows: [
              ["Insurance", "We carry liability insurance for accidents during work (naming the insurer is optional)"],
              ["What is covered", "Damage to or staining of your belongings caused by our staff during work"],
              ["What is not", "Faults present before the job, wear and tear, cash and jewellery"],
              ["Reporting deadline", "Tell us within 7 days of the job; photos speed things up"],
              ["Pre-job check", "We test appliances before cleaning and tell you about any existing problem first"],
            ],
            caption: "Wording is an example. Match the scope and conditions to your actual policy.",
          },
          after: [
            `On a related note, the same agency reported in June 2026 that consultations about air-conditioner repair rose from 451 in fiscal 2021 to 1,251 in fiscal 2025, and advised checking the work and price before it starts and testing the unit together before the technician leaves. [National Consumer Affairs Center, June 3, 2026 (Japanese)](${SRC.kokusenAircon}). That notice is about repairs, but writing \"we tell you the price before work\" and \"we check with you before we leave\" as your own procedure answers the same worry for cleaning.`,
          ],
        },
        {
          heading: "Keys and empty-home visits: whether you do it, and how",
          paragraphs: [
            `\"Can they come while I'm out?\" is a common housekeeping question. A Japanese industry guideline for home-support services (published March 30, 2025 by an association of care-related service providers and hosted on the Ministry of Economy, Trade and Industry's site) covers cleaning and laundry help and says keys should be held only when unavoidable, with a key receipt, a written procedure and a log of each time a key is taken out. [Guideline (PDF, Japanese)](${SRC.csbaGuideline}). It was written mainly with older customers in mind, but its items make a useful checklist for any key policy.`,
          ],
          list: [
            "Say clearly whether you clean an empty home (for example: \"We ask you to be home for the first visit. From the second visit we can hold a key and clean while you are out.\").",
            "If you hold keys, say that you issue a receipt, how keys are stored, that each use is logged, and how they are returned when the contract ends.",
            "If you use smart locks or key boxes, explain how, and how access codes are handled.",
            "Say whether staff take photos during work and how you report when the job is done (chat or email).",
          ],
        },
        {
          heading: "Staff, qualifications and certification: only what you hold, by its exact name",
          paragraphs: [
            `In Japan, house cleaning is one of the national trade skills tests run under the Ministry of Health, Labour and Welfare; people who pass may call themselves certified house cleaning technicians. The ministry describes the trade as cleaning occupied homes and real-estate properties, including bathrooms, kitchens and fixed equipment, and points to the designated testing body, the All Japan House Cleaning Association. [Ministry of Health, Labour and Welfare (Japanese)](${SRC.mhlwSkill})`,
            `For housekeeping, Japan has a third-party certification created in 2016, run by the national housekeeping services association and reviewed by the Japanese Standards Association, that assesses safety, service quality and customer manners. [Cabinet Secretariat paper (PDF, Japanese)](${SRC.casCert}). A ministry-commissioned report says 19 companies held it at the end of January 2025. [METI report (PDF, Japanese)](${SRC.metiReport}). Other countries have their own schemes; use the ones that exist where you work.`,
          ],
          list: [
            "List only qualifications and certifications you actually hold, by their official names. Add your own facts, such as the level, how many staff hold it, or when you were certified, so AI can use them as they are.",
            "Say whether staff are employees or contractors, what you check when hiring (background checks, if you do them and the law allows), and how long and what kind of training they get.",
            "Say whether the same cleaner comes each time and whether a customer can ask for a change. Housekeeping customers ask this often.",
            "Publish staff names and photos only with their consent.",
          ],
        },
        {
          heading: "Cancellation and rescheduling: dates and percentages",
          paragraphs: [
            "To let AI answer \"Is there a fee if I cancel the day before?\", write cancellation fees by date and percentage. The guideline above also asks providers to show expected cancellation fees before the contract, and notes that in Japan such fees may not exceed the provider's actual loss (Consumer Contract Act, Article 9).",
          ],
          table: {
            head: ["Decide and write", "Example wording"],
            rows: [
              ["Cancellation fee", "Free up to two days before; 50% the day before; 100% on the day"],
              ["Rescheduling", "Free if you tell us by 6 pm the day before"],
              ["Ending a recurring plan", "Tell us by the end of the previous month; no penalty"],
              ["Weather and emergencies", "If we cannot come because of a storm, we reschedule free of charge"],
            ],
            caption: "Dates and percentages are examples. Write your real terms.",
          },
          after: [
            "The Japanese consumer agency notes that a cooling-off right may apply when certain conditions are met. Which consumer rules apply to your contracts, for example ones signed in the customer's home, depends on the country; ask a professional. Use the same wording on your pricing and booking pages. See [booking pages and AI search](/guide/booking-page-ai-search/).",
          ],
        },
        {
          heading: "Service area: named towns, matched to Google Business Profile",
          paragraphs: [
            `You go to the customer, so name the towns you cover so AI can answer \"Do they come to [town]?\", and say how travel is charged outside that area. If you do not receive customers at your address, Google Business Profile treats you as a service-area business: hide the address, list up to 20 areas, keep within about 2 hours' drive of your base, and do not add keywords or places to the business name. [Google: Guidelines](${SRC.gbpGuidelinesEn}) · [Manage service areas](${SRC.gbpServiceAreaEn}). More detail is in [AI search for on-location photographers](/guide/on-location-photographer-ai-search/).`,
          ],
          list: [
            "Make the area on your site, your Google Business Profile service areas and your listings on booking marketplaces the same.",
            "Keep prices, damage cover and cancellation terms the same on marketplaces and on your site. If they differ, AI may use the oldest version.",
            "Franchisees should check that the head office's location page and their own site do not disagree on area or price.",
          ],
        },
        {
          heading: "Structured data: there is no cleaning type, so use HomeAndConstructionBusiness with Service",
          paragraphs: [
            `schema.org has no dedicated type for house cleaning or housekeeping. The subtypes of [HomeAndConstructionBusiness](${SRC.homeConstruction}) are for electricians, general contractors, painters, HVAC, locksmiths, movers, plumbers and roofers (checked in schema-dts 2.1.0 on November 25, 2026). DryCleaningOrLaundry is for laundries, not home cleaning. Publish the business as HomeAndConstructionBusiness (or LocalBusiness), describe each cleaning job or housekeeping plan as a Service with an Offer, and put your area in [areaServed](${SRC.areaServed}). If you do not publish an address, leave address out.`,
          ],
          code: SCHEMA_EN,
          after: [
            "Treat structured data as a copy of the prices, area and cover in your page text, and keep them identical. A fact that exists only in structured data reaches neither customers nor AI well.",
          ],
        },
        {
          heading: "Setting it up on a WordPress cleaning site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working, without duplicate structured data.`,
            "In the setup wizard choose \"Other\", then enter HomeAndConstructionBusiness in the \"Business type (schema.org type)\" setting. Do not pick \"Professional services\", which sets ProfessionalService.",
            "Enter your name, phone and enquiry hours. If you have no premises and keep your address private, leave the address field empty: Nurevo AEO then publishes no address (the AEO score's diagnosis counts it as missing; if privacy is your policy, leave it empty anyway).",
            "Add each cleaning job and housekeeping plan as a Service (up to 20) with name, length in minutes, price, booking URL and a description that states when extras apply. Services appear as Service structured data and in llms.txt.",
            "Nurevo AEO has no service-area (areaServed) field. To add it to the structured data, use the webmcp_canary_business_node filter below. If Yoast SEO or a similar plugin is active, values that plugin already sets take precedence.",
            "Enter your damage, key, staff and cancellation answers as FAQs, and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your pricing or booking page. See [FAQ pages and AI search](/guide/faq-page-ai-search/).",
            "Open /llms.txt and check that your pricing, area, cover, booking and FAQ pages are listed. Run the diagnosis on the AEO score screen and fix what it finds.",
          ],
          code: PHP_EN,
          after: [
            "The same checks apply to sites not on WordPress. Enter your URL in the [free check](/check), no sign-up required, to see the state of your structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "House cleaning and housekeeping have separate pages, each with tax-inclusive prices.",
            "The conditions for extra charges, and that you price extras before starting, are written.",
            "What is included (travel, parking, products) is written.",
            "Liability insurance, what is and is not covered, and the reporting deadline are written.",
            "Whether you clean empty homes, and how keys are held, logged and returned, is written.",
            "Staff employment, training and any qualifications or certifications are written, by official name, only if held.",
            "Cancellation and rescheduling terms use the same wording on the pricing and booking pages.",
            "Your area is written as named towns and matches your Google Business Profile and marketplace listings.",
            "The structured data type is HomeAndConstructionBusiness or LocalBusiness, with prices and area matching the page text.",
            "llms.txt lists your pricing, area, cover, booking and FAQ pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI mentions you, and whether it is right",
          paragraphs: [
            "Once your pages are in order, ask AI the questions customers would ask. Check whether your name comes up for area-plus-service questions such as \"oven cleaning in [town]\" or \"weekly housekeeper in [town]\", and also ask with your name, such as \"Are they insured?\", \"What is their cancellation fee?\" or \"Can they clean while I'm out?\", to see whether the answers match your site. Look out for old prices or services you no longer offer.",
            "AI answers change between runs, so ask the same questions several times, spread over time, and keep a record. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a cleaning business start with AI search?", a: "First, write tax-inclusive prices per item and the conditions for extra charges on your pricing page as text. Then add your damage cover, insurance and cancellation terms. After that, name the towns you cover, match your Google Business Profile, and publish the same facts in structured data and llms.txt." },
        { q: "Should house cleaning and housekeeping share one page?", a: "Separate pages work better. House cleaning is priced per one-off job and housekeeping per hour on a recurring plan, and customers ask AI different questions about each. Keep one set of business details and give each service its own page." },
        { q: "Will higher prices make AI less likely to recommend me?", a: "There is no official information that price level decides whether AI mentions a business. What matters is that prices and extra-charge conditions are accurate and written so AI can answer with the conditions. A gap between a cheap advertised price and the final bill is one of the problems consumer agencies warn about." },
        { q: "Which structured data type should a cleaning business use?", a: "schema.org has no cleaning or housekeeping type, so use HomeAndConstructionBusiness or LocalBusiness, and describe each job or plan as a Service. DryCleaningOrLaundry is for laundries." },
        { q: "Do I need a certification to be recommended by AI?", a: "There is no official information that a certification is required. List the qualifications and certifications you hold by their official names; if you have none, write facts that can be checked, such as your training and the terms of your damage cover. Never claim one you do not hold." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, contact details, hours, services and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends me?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your prices, cover, key policy and cancellation terms easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your cleaning site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your cleaning jobs, housekeeping plans and FAQs for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
