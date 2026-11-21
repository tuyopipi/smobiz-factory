// Content page: AI search (AEO) for call-out home repair businesses in Japan
// (水道修理・トイレのつまり・鍵開け・害虫駆除など「駆けつけ」の修理業者).
// Industry page. Angle: the consumer-protection record that AI also reads
// (くらしのレスキューサービス), so the fix is a price page that survives it:
// call-out fee, estimate fee, cancellation, total before work, designation
// numbers, and Plumber / Locksmith structured data.
//
// Written 2026-11-21 11時 (JST). Nurevo AEO facts come from the plugin source
// and readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2):
// free-text "業種（schema.org型）" field (business_type) used as @type; Plumber
// and Electrician are in webmcp_canary_local_business_types(); filter
// webmcp_canary_business_node documented in docs/developers.md; services up to
// 20 published as Service + Offer + ReserveAction and an llms.txt line, the
// price field is emitted as typed (so numbers only); FAQ block / [nurevo_faq];
// monthly free check to Perplexity; Pro measurement (beta) on Perplexity.
//
// Outside facts and where they were read (2026-11-21):
// - 国民生活センター n-20211007_2 (2021-10-07): PIO-NET consultations on
//   暮らしのレスキューサービス FY2016 2,437 / FY2017 2,805 / FY2018 3,386 /
//   FY2019 3,771 / FY2020 5,882; share involving 電子広告 19.2% (FY2016) to
//   41.1% (FY2020); ads 「950円～」 with bills of several hundred thousand yen
//   (case of about 55万円); advice: don't take ad prices at face value, find a
//   trusted local business or 管工事組合 in advance, refuse if rushed, don't pay
//   on the spot if not convinced, 188.
// - 消費者委員会「レスキューサービスに関する消費者問題についての意見」
//   (2025-08-04): 電子広告 share about 15% (FY2014) to about 55% (FY2024);
//   survey n=700 (2025-03-14〜19): reason for choosing: low price in ad ~39%,
//   「見積り無料」 36%, top of search results 33%; most common trouble: repaired
//   but billed high 37%, 「見積もり無料」 but actually charged 24%; trust in
//   top search results about 7割 before trouble to 4割 after.
// - 埼玉県 press releases 2024-02-09 and 2025-03-06: 景品表示法 措置命令 against
//   two 水回り修繕 businesses (2024-02-08, 2025-03-05), with 特定商取引法
//   actions the same day. 優良誤認: annual / monthly job counts the staff could
//   not handle, 「お客様満足度99％」 without an objective survey, competitor
//   figures guessed; 有利誤認: 「350円（税込）～」, 「基本料金3,000円」「0円
//   完全無料 現地見積り」 while added work led to bills of 数万円〜数十万円;
//   「今月だけのWEB限定割引」 actually applied continuously.
// - 大阪府 FAQ recid=220 (updated 2026-04-01): visiting the home and contracting
//   is 訪問販売 under 特定商取引法; クーリング・オフ within 8 days of receiving the
//   legal document; even if the consumer called, it can apply when the ad price
//   and the bill differ greatly or a different contract was solicited; advice:
//   say clearly "come for an estimate", ask in advance whether the estimate and
//   cancellation are charged, get several estimates.
// - 千葉市 06rescue (updated 2026-10-07): cases incl. 「見積もり無料」 but charged,
//   解錠「2,000円～」 then about 10万円, 害虫 「基本料金約500円、追加料金なし」 then
//   about 7万円; advice incl. 特定商取引法 クーリング・オフ may apply.
// - Water bureaus: 柏市 (2025-12-17) unregistered contractors lead to high
//   bills, 現地調査・見積書だけでも料金がかかる可能性; 静岡市 (2026-03-10) work by
//   non-designated contractors is prohibited by ordinance; 福岡市 (2026-11-01)
//   requirements (主任技術者, equipment, pledge) and district lists; 札幌市
//   (2025-09-08) the contract is between the customer and the contractor,
//   lists published. 千葉県 (2024-03-05) and 日本水道協会 Q&A: designation valid
//   5 years since the revised 水道法 came into force on 2019-10-01.
// - schema-dts 2.1.0: Plumber, Locksmith, Electrician, HVACBusiness,
//   RoofingContractor are HomeAndConstructionBusiness subtypes; no pest
//   control type.
// - Top articles read 2026-11-21: uravation 水道修理・鍵開け (2026-08-29),
//   uravation 害虫駆除 (2026-08-31), uravation 家電修理・出張 (2026-10-25),
//   assist-all 修繕工事 (2026-01-30), assist-all 建設 (2026-01-31); Marchex
//   (2025-08-15), High Level Marketing (undated), Sagnik Bhattacharya
//   (2026-10-29), Web Tonic (2026-10-09), PHCP Pros (2026-06-01).
// Not verified, so not stated: rules for locksmith qualifications, pest
// control registrations (secondary source only), which minor repairs need no
// designated contractor (no water bureau page read said), the share of people
// who find a repair business through AI, any typical price.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  kokusen: "https://www.kokusen.go.jp/news/data/n-20211007_2.html",
  cao: "https://www.cao.go.jp/consumer/content/20250804_iken1.pdf",
  saitama2024: "https://www.pref.saitama.lg.jp/a0310/news/page/news2024020902.html",
  saitama2025: "https://www.pref.saitama.lg.jp/a0310/news/page/news2025030601.html",
  osaka: "https://www.pref.osaka.lg.jp/annai/qa/detail.php?recid=220",
  chiba: "https://www.city.chiba.jp/shimin/seikatsubunka/shohi/06rescue.html",
  kashiwa: "https://www.city.kashiwa.lg.jp/kyuhaisui/living_environment/1.html",
  shizuoka: "https://www.city.shizuoka.lg.jp/s4283/s000921.html",
  fukuoka: "https://www.city.fukuoka.lg.jp/mizu/sessui/machi/suidousiteigyousya/index.html",
  chibaPref: "https://www.pref.chiba.lg.jp/suidou/kyuusui/shiteikouji/kousinseidounyuu.html",
  jwwa: "https://www.jwrc-net.or.jp/docs/publication-outreach/qa/07-100.pdf",
  plumber: "https://schema.org/Plumber",
  locksmith: "https://schema.org/Locksmith",
  homeConstruction: "https://schema.org/HomeAndConstructionBusiness",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  uravation: "https://uravation.com/llmo/suido-kagi-kaketsuke-service-llmo-taisaku/",
  uravationPest: "https://uravation.com/llmo/gaichu-kujo-llmo-taisaku/",
  sagnik: "https://sagnikbhattacharya.com/blog/plumbers-ai-search-visibility-chatgpt",
  hlm: "https://highlevelmarketing.com/blog/use-our-research-for-more-plumbing-business-leads-from-chatgpt",
  webtonic: "https://www.webtonic.io/blog/plumbing-generative-engine-optimization-aeo-statistics",
  marchex: "https://www.marchex.com/chatgpt-recommended-you-guys-why-ai-search-results-are-the-new-word-of-mouth-for-home-services/",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Plumber",
      "@id": "https://example.jp/#organization",
      "name": "例水道設備（例）",
      "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯市◯◯町1-2-3" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Mo-Sa 08:00-20:00",
      "areaServed": [
        { "@type": "AdministrativeArea", "name": "◯◯県◯◯市" },
        { "@type": "AdministrativeArea", "name": "◯◯県◯◯町" }
      ]
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "現地調査と見積もり（市内は出張費・見積もり無料）",
      "description": "現地で原因を確かめ、作業内容と税込の総額を書いた見積書をお渡しします。了承をいただくまで作業はしません。見積もりだけで断っても費用はかかりません。",
      "category": "水道修理",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/contact" },
        "result": { "@type": "Reservation", "name": "現地調査と見積もり" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Plumber",
      "@id": "https://example.com/#organization",
      "name": "Example Plumbing",
      "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Example St, Example City" },
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Mo-Sa 08:00-20:00",
      "areaServed": [
        { "@type": "AdministrativeArea", "name": "Example City" },
        { "@type": "AdministrativeArea", "name": "Example Town" }
      ]
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "On-site inspection and estimate (no call-out or estimate fee within the city)",
      "description": "We find the cause on site and give you a written estimate with the work and the total including tax. We start no work until you agree. If you decline after the estimate, there is no charge.",
      "category": "Plumbing repair",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/contact" },
        "result": { "@type": "Reservation", "name": "On-site inspection and estimate" }
      }
    }
  ]
}`;

const PHP_JA = `// 対応エリアと指定の情報を業者のノードに足す（値は本文と同じにする）
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'AdministrativeArea', 'name' => '◯◯県◯◯市'),
        array('@type' => 'AdministrativeArea', 'name' => '◯◯県◯◯町'),
    );
    $node['hasCredential'] = array(
        '@type' => 'EducationalOccupationalCredential',
        'name' => '◯◯市指定給水装置工事事業者（指定番号 第◯◯号）',
        'recognizedBy' => array('@type' => 'GovernmentOrganization', 'name' => '◯◯市上下水道局'),
    );
    return $node;
}, 10, 2);`;

const PHP_EN = `// Add the service area and the designation to the business node (same values as the page text)
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'AdministrativeArea', 'name' => 'Example City'),
        array('@type' => 'AdministrativeArea', 'name' => 'Example Town'),
    );
    $node['hasCredential'] = array(
        '@type' => 'EducationalOccupationalCredential',
        'name' => 'Designated water supply contractor of Example City (No. 000)',
        'recognizedBy' => array('@type' => 'GovernmentOrganization', 'name' => 'Example City Waterworks Bureau'),
    );
    return $node;
}, 10, 2);`;

export default {
  slug: "emergency-home-repair-ai-search",
  targetQueries: [
    "plumber AI search optimization",
    "locksmith ChatGPT recommendations",
    "Plumber schema markup emergency repair",
    "水道修理 AI検索対策",
    "鍵開け 業者 ChatGPT 集客",
    "駆けつけ 修理 LLMO 料金表示",
  ],
  related: ["pricing-page-ai-search", "business-hours-holidays-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility", "moving-company-ai-search"],
  locales: {
    ja: {
      title: "水道修理・鍵開けのAI検索対策：料金表示・出張費・指定業者 | Nurevo",
      description: "水道修理・鍵開け・害虫駆除など駆けつけ修理の業者は、出張費・見積もり費・キャンセル料・作業前の総額提示・指定番号を本文に書くことがAI検索対策の中心。行政処分の事例と構造化データ、WordPressの手順。",
      h1: "水道修理・鍵開けなど駆けつけ修理のAI検索対策：料金の書き方・出張費・指定業者の番号をAIに正しく読ませる手順",
      lead: "水道修理・トイレのつまり・鍵開け・害虫駆除のような駆けつけ修理の業者のAI検索対策は、「◯円～」の安さを見せることではなく、出張費と見積もり費がかかるか、キャンセルはいくらか、作業の前に税込の総額を書面で示すか、市の指定を受けているか（指定番号と有効期間）を、ページ本文に条件まで書いて答えることです。この業種は国民生活センターや自治体が高額請求の注意を繰り返し出していて、AIもそれを読んで答えます。注意喚起に当てはまらないことを事実で示せるページが、AIにも人にも選ばれやすくなります。",
      intro: [
        "作成日：2026年11月21日（JST）。国民生活センター、消費者委員会、埼玉県・大阪府・千葉市、各市の上下水道局のページと、上位の記事はこの日に読みました。schema.org の型は同じ日に schema-dts 2.1.0 で確認しました。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが業者の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。また、法的な助言ではありません。表示や契約の扱いは、管轄の消費生活センターや弁護士に確かめてください。",
      ],
      sections: [
        {
          heading: "困っている人はAIに何を聞くか",
          paragraphs: [
            "駆けつけ修理の相談は、急いでいて、しかもだまされたくない、という状況で来ます。「夜10時にトイレが詰まった。◯◯市で今から来てくれる業者は？」「鍵をなくして家に入れない。鍵開けはいくらぐらい？」「水道屋に頼むとき、ぼったくりを避けるには？」「ベランダに蜂の巣。駆除を頼むと高い？」といった質問です。",
            "AIはこうした質問に、業者の名前を挙げるだけでなく、注意点を添えて答えることがよくあります。注意点の材料は、国民生活センターや自治体の注意喚起です。だから業者のサイトに、出張費・見積もり費・キャンセル料・作業前の総額提示・支払い方法・指定番号が書かれていないと、AIは一般論の注意だけを返し、業者を推す根拠を持てません。",
            `Googleは、AIによる概要やAIモードに出るための特別な構造化データや追加の要件はなく、構造化データを見える文章と一致させることなど通常の基本が大切だとしています。[Google：AI features and your website](${SRC.googleAi})`,
          ],
          table: {
            head: ["よく聞かれること", "ページに書くこと", "置く場所"],
            rows: [
              ["今から来てくれるか", "受付時間と出動できる時間帯、夜間・休日の扱い、対応エリア（市区町村名）、到着までの目安とその根拠", "トップ、対応エリアのページ"],
              ["いくらかかるか", "出張費・見積もり費・キャンセル料の有無と金額、作業別の総額の例（条件つき・税込・作成年月）、夜間の割増", "料金のページ"],
              ["高額請求されないか", "作業前に総額を書面で示し、了承まで作業しないこと、追加作業の扱い、支払い方法と領収書", "料金のページ、FAQ"],
              ["ちゃんとした業者か", "市の指定給水装置工事事業者の指定番号と有効期間、会社の所在地と代表者、事業の年数", "会社概要、料金のページ"],
              ["あとで困ったら", "作業後の保証の範囲と期間、相談の窓口、クーリング・オフの案内", "保証のページ、FAQ"],
            ],
            caption: "質問の例は、この記事の作成時に整理したものです。どの質問がどれだけ聞かれているかの統計ではありません。",
          },
        },
        {
          heading: "上位の記事に足りなかったこと",
          paragraphs: [
            `「水道修理 AI検索対策」「plumber AI search」で上位の記事を日本語5本・英語5本読みました。日本語では [uravation の水道修理・鍵開けの記事（2026年8月29日）](${SRC.uravation}) が、料金表・指定番号・到着時間を実測で書くこと・注意喚起への答え方まで扱っていて、いちばん具体的でした。同じサイトの [害虫駆除の記事（2026年8月31日）](${SRC.uravationPest}) は害虫ごとにページを分ける考え方が参考になります。英語では [Sagnik Bhattacharya（2026年10月29日）](${SRC.sagnik}) が確かめ方と Plumber の構造化データの例まで載せていました。`,
            `一方で、どの記事にも、実際に行政処分の対象になった表示の具体例、特定商取引法の訪問販売の扱い、WordPressでの設定手順はありませんでした。英語の記事の数字は、[High Level Marketing](${SRC.hlm}) の「BBBが70%」のように自社の非公開の分析によるものが多く、[Web Tonic（2026年10月9日更新）](${SRC.webtonic}) は「多くの配管の問い合わせが従来の検索を通らない」という主張を裏づける調査はないと自ら書いています。[Marchex（2025年8月15日）](${SRC.marchex}) は住まいのサービス全般の戦略の一覧で、数字はありません。`,
          ],
          table: {
            head: ["記事", "強いところ", "足りないところ"],
            rows: [
              ["uravation 水道修理・鍵開け", "料金表、指定番号と更新、到着時間の実測、注意喚起への答え方", "構造化データの例、WordPressの手順、景品表示法の処分の例"],
              ["uravation 害虫駆除", "害虫別のページ、総額が決まる式、保証の定義", "構造化データの例、価格表示のルール"],
              ["assist-all 修繕工事・建設", "FAQ・施工事例の書き方、期間ごとの進め方", "出典のある数字、法令、構造化データの例"],
              ["Sagnik Bhattacharya", "確かめ方、Plumber の JSON-LD、30日の計画", "日本の法令、WordPress"],
              ["High Level Marketing・Web Tonic・Marchex・PHCP Pros", "AIが参照する掲載先の傾向、統計の出典の整理", "多くが自社の分析か一般論で、手順や価格表示の具体例がない"],
            ],
            caption: "2026年11月21日に読んだ時点の内容です。",
          },
        },
        {
          heading: "なぜこの業種は「料金の書き方」がいちばん大事か",
          paragraphs: [
            `国民生活センターは2021年10月7日、トイレ修理・水漏れ・鍵・害虫駆除・給湯器などの「暮らしのレスキューサービス」の相談が増えていると発表しました。全国の相談は2016年度の2,437件から2020年度の5,882件に増え、ネット広告などの電子広告が関わる割合は19.2%から41.1%になりました。「950円～」の広告を見て頼んだら数十万円を請求された、という事例も載っています。[国民生活センター（2021年10月7日）](${SRC.kokusen})`,
            `消費者委員会の2025年8月4日の意見では、電子広告が関わる割合は2014年度の約15%から2024年度の約55%になっています。同じ資料のアンケート（700人、2025年3月）では、業者を選んだ決め手は「広告で安い金額を提示していたから」が約39%、「見積り無料との記載があったから」が36%、「検索結果の一番上に表示されていたから」が33%でした。トラブルの内容は「修理はされたが高額な請求をされた」が37%、「見積もり無料と書かれていたが実際は有料だった」が24%です。[消費者委員会：レスキューサービスに関する消費者問題についての意見（PDF）](${SRC.cao})`,
            "つまり、困った人が最初に見る「安さ」と「見積もり無料」の表示そのものが、トラブルの入口になってきました。AIはこうした公的な資料も読むので、下限の金額だけを大きく出すページは、AIにとっても推しにくい業者に見えます。逆に、総額の決まり方と、見積もりだけで断れることを書いたページは、注意喚起への答えになります。",
          ],
        },
        {
          heading: "行政処分で問題になった表示と、代わりの書き方",
          paragraphs: [
            `埼玉県は、水回り修繕の業者に景品表示法の措置命令を出しています（2024年2月8日付と2025年3月5日付。どちらも同じ日に特定商取引法の行政処分もあり）。問題とされたのは、実際より安く見える料金の表示と、根拠のない実績の表示でした。[埼玉県（2024年2月9日発表）](${SRC.saitama2024})・[埼玉県（2025年3月6日発表）](${SRC.saitama2025})`,
          ],
          table: {
            head: ["処分で問題とされた表示（要旨）", "何が問題とされたか", "代わりの書き方"],
            rows: [
              ["「350円（税込）～」などの下限の料金", "追加の作業で数万円〜数十万円の代金を請求していた", "作業別に、条件と税込の総額の例を書く。下限を書くなら、その金額で終わる作業の中身も書く"],
              ["「基本料金3,000円」「現地見積り 0円 完全無料」", "同上。追加の料金で実際の支払いが大きくなった", "出張費・見積もり費・キャンセル料を別々に書き、見積もりだけで断ったときの費用を書く"],
              ["「今月だけのWEB限定割引」", "期間限定に見えて、実際は期間を限らず続けていた", "割引には始まりと終わりの日付を書き、終わったら消す"],
              ["年間・月間の対応件数", "人員の体制では対応できない件数だった", "数えられる実数だけを、数えた期間と一緒に書く"],
              ["「お客様満足度99％」", "客観的な調査によらず、苦情もあった", "調査の方法と人数を書けないなら書かない"],
              ["他社の料金・件数との比較", "推測によるもので調査に基づかなかった", "他社の数字は出さない"],
            ],
            caption: "埼玉県の発表資料の要旨です（2026年11月21日確認）。業者名は省いています。",
          },
          after: [
            `千葉市も、「見積もり無料」の広告で見てもらったら見積もりの費用を請求された、解錠「2,000円～」の広告で約10万円になった、害虫駆除で「追加料金なし」の広告から約7万円を請求された、といった相談を紹介しています。[千葉市（2026年10月7日更新）](${SRC.chiba})。自社の広告や紹介サイトの掲載文にこうした表現が残っていないかも、サイトと一緒に見直します。`,
          ],
        },
        {
          heading: "料金のページに書く7つのこと",
          list: [
            "出張費：かかるか、いくらか、エリアや時間帯で変わるか。「市内は無料、◯◯町は◯円」のように地名で書く。",
            "見積もり費：現地で原因を調べて見積書を出すまでにかかる費用。「見積もりだけで断っても無料」なら、そう書く。",
            "キャンセル料：出発後・到着後・見積もり後のそれぞれでいくらか。",
            "作業前の総額提示：作業内容と税込の総額を書いた見積書を渡し、了承をもらうまで作業しないこと。作業中に追加が必要になったら、作業を止めて改めて金額を示すこと。",
            "作業別の総額の例：「トイレのつまり（ラバーカップなどで解消、30分程度）：税込◯円」のように、作業の中身・時間・部品の有無を条件として書き、作成した年月を添える。例は実際の請求から作り、作った数字を書かない。",
            "夜間・休日の割増：時間帯と金額か割合。",
            "支払い方法と書面：現金以外の方法、領収書・作業報告書を渡すこと。",
          ],
          after: [
            `大阪府は、呼ぶときに「見積もりのために来てほしい」とはっきり伝え、見積もりに料金がかかるか、キャンセル料がかかるかを前もって確かめるよう案内しています。[大阪府 お問合せ集（2026年4月1日更新）](${SRC.osaka})。困った人が確かめたいことを先にページに書いておけば、AIも「この業者は見積もりだけなら無料と明記している」のように答えられます。料金の書き方の全体は[料金ページをAIに正しく読ませる書き方](/guide/pricing-page-ai-search/)もご覧ください。`,
          ],
        },
        {
          heading: "訪問販売とクーリング・オフの案内",
          paragraphs: [
            `業者が消費者の家に行って契約するのは、特定商取引法の「訪問販売」に当たります。法律で決められた書面を受け取ってから8日以内ならクーリング・オフできます。消費者が自分で呼んだ場合は認められないことがありますが、大阪府は、広告の金額と実際の請求に明らかに大きな開きがある場合や、頼んだ修理と違う契約を勧められた場合はクーリング・オフできる可能性があると説明しています。[大阪府](${SRC.osaka})`,
            "業者のサイトには、法律の解説を長く書く必要はありません。「契約のときに、特定商取引法に基づく書面をお渡しします」「クーリング・オフの扱いは書面に書いてあります」と、自社がしていることを短く書きます。どの場合に当たるかの判断を自社のサイトで言い切ることは避け、消費生活センター（消費者ホットライン188）を案内しておくと、AIが「業者自身が相談先を示している」と読める材料になります。",
          ],
        },
        {
          heading: "指定給水装置工事事業者の番号と有効期間を書く",
          paragraphs: [
            `水道の給水管や蛇口などの給水装置の工事は、各市の上下水道局が指定した「指定給水装置工事事業者」が行います。静岡市は、指定を受けていない者が工事をすることは条例で禁止されているとし、柏市は、指定を受けていない業者を使うと高額な請求や施工不良のトラブルにあうおそれがあると注意しています。[静岡市（2026年3月10日更新）](${SRC.shizuoka})・[柏市（2025年12月17日更新）](${SRC.kashiwa})。指定の要件には、給水装置工事主任技術者がいることなどがあり、市は指定業者の一覧を公開しています。[福岡市（2026年11月1日更新）](${SRC.fukuoka})`,
            `指定には有効期間があります。2019年10月1日に施行された改正水道法で、指定は5年ごとの更新制になりました。[千葉県](${SRC.chibaPref})・[日本水道協会（PDF）](${SRC.jwwa})`,
            "AIは、市が公開する指定業者の一覧と業者のサイトを照らし合わせられます。会社概要と料金のページに「◯◯市指定給水装置工事事業者　指定番号 第◯号（有効期間 ◯年◯月まで）」と、市ごとに文字で書きます。指定を受けていない市町村には、受けていないことと、その場合にできる作業・できない作業の自社の扱いを書きます。どの作業に指定が必要かは市によって案内が違うので、市の上下水道局で確かめた範囲だけを書きます。鍵や害虫駆除の業者も、持っている登録や団体の会員資格があれば、名前・番号・有効期間を同じように書き、持っていないものは書きません。",
          ],
        },
        {
          heading: "対応エリアと到着までの目安",
          paragraphs: [
            "対応エリアは地図の画像だけにせず、市区町村の名前を文字で書きます。到着までの目安は「最短15分」のような一番よい値だけではなく、「昼間の市内でおおむね30〜60分（◯年◯月〜◯月の実績）」のように、条件と根拠を添えます。混む時間帯や天気で遅れることも書いておきます。",
            "24時間受付と24時間出動は違います。電話を受けるだけの時間帯と、実際に人が行ける時間帯を分けて書きます。営業時間の構造化データの書き方は[営業時間・定休日・臨時休業をAIに正しく読ませる書き方](/guide/business-hours-holidays-ai-search/)にまとめています。",
          ],
        },
        {
          heading: "構造化データ：Plumber・Locksmith と見積もりのサービス",
          paragraphs: [
            `schema.org には、水道修理の [Plumber](${SRC.plumber})、鍵の [Locksmith](${SRC.locksmith})、電気工事の Electrician、空調の HVACBusiness があり、どれも住宅・建設関係の [HomeAndConstructionBusiness](${SRC.homeConstruction}) の下にあります。害虫駆除のための型はないので、HomeAndConstructionBusiness か LocalBusiness にして、駆除の作業を Service で表します。`,
            "Nurevo AEOで業種を Plumber にし、現地調査と見積もりをサービスに登録すると、次のような形になります（値は例です）。",
          ],
          code: SCHEMA_JA,
          after: [
            "Offer に 0 を入れてよいのは、本当に費用がかからない場合だけです。エリアや時間帯で出張費が変わるなら、サービスの名前と説明にその条件を書くか、金額を入れずに本文で説明します。修理の料金は作業で変わるので、構造化データには入れず、本文の総額の例に書きます。指定の情報は、下のフィルターで hasCredential として足せます。",
          ],
        },
        {
          heading: "WordPressの修理業者サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「その他」を選び、設定画面の「業種（schema.org型）」に Plumber（鍵なら Locksmith、電気工事なら Electrician、害虫駆除なら HomeAndConstructionBusiness）と入力します。",
            "会社名・住所・電話番号・受付時間・説明を確認します。説明には、対応する作業、対応エリア、作業前に総額を示すことを短く書きます。",
            "サービスに、現地調査と見積もり、主な作業（トイレのつまり、蛇口の水漏れ、解錠など）を1つずつ登録します（最大20件）。料金の欄は入れた文字がそのまま price になるので、数字だけを入れます。作業で金額が変わるものは料金を空にして、説明に条件を書きます。予約ページのURLを入れると、予約の操作（ReserveAction）としても出力され、llms.txtにも1行ずつ載ります。",
            "対応エリアと指定番号は、開発者向けの webmcp_canary_business_node フィルターで足します（下のコード。子テーマの functions.php かコードスニペットのプラグインに）。SEOプラグインを使っている場合は、そのプラグインの会社のノードにまとめられ、プラグイン側にすでにある値が優先されます。",
            "よく聞かれる質問（出張費、見積もりだけで断ったときの費用、キャンセル料、作業前の総額提示、夜間の割増、支払い方法、指定番号、クーリング・オフ）をFAQに入れ、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "/llms.txt を開き、料金・対応エリア・会社概要・保証のページが載っているか確かめます。終わったキャンペーンのページは、Nurevo AEOパネルでllms.txtに載せない設定にできます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態を確かめられます。SEOプラグインとの併用は[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "紹介サイト・検索広告・Googleビジネスプロフィールとそろえる",
          paragraphs: [
            "AIは、業者のサイトだけでなく、紹介サイトや比較記事、Googleビジネスプロフィールも読みます。会社名・住所・電話・対応エリア・受付時間・料金の書き方が場所ごとに違うと、どれが正しいか判断できません。掲載先を一覧にして、自社サイトの値に合わせます。とくに、紹介サイトや検索広告の文に「◯円～」「見積もり無料」だけが残っていると、サイトで条件を丁寧に書いても食い違いになります。",
            `消費者委員会の意見は、被害の多くが検索連動型広告から始まっているとして、消費者に「検索結果の上位に表示されているということだけで信用しない」「可能な場合は相見積もりを入手する」よう呼びかけています。[消費者委員会（PDF）](${SRC.cao})。相見積もりされることを前提に、比べやすい形で書くのが近道です。`,
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "出張費・見積もり費・キャンセル料が、それぞれ金額か「無料」で、条件つきで書かれている。",
            "作業の前に税込の総額を書面で示し、了承まで作業しないことが書かれている。",
            "作業別の総額の例が、作業の中身・時間・作成年月つきで載っていて、下限の金額だけを大きく見せていない。",
            "割引に始まりと終わりの日付があり、終わったものは消してある。",
            "件数・満足度・他社との比較など、根拠を示せない数字がない。",
            "指定給水装置工事事業者の指定番号と有効期間が市ごとに文字で書かれている（受けていない指定は書かない）。",
            "対応エリアが市区町村名で書かれ、到着の目安に条件と根拠がある。受付と出動の時間を分けている。",
            "特定商取引法の書面を渡すこと、相談先（188）が書かれている。",
            "業種が Plumber などになっていて、名前・住所・電話・受付時間がサイト・構造化データ・Googleビジネスプロフィール・紹介サイトでそろっている。",
            "llms.txtに、料金・対応エリア・会社概要・保証のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIでどう説明されているかを確かめる",
          paragraphs: [
            "「◯◯市 夜 トイレ つまり 業者」「◯◯市 鍵開け 料金」「水道修理 ぼったくり 見分け方 ◯◯市」のように、地域・作業・不安の組み合わせで5〜10個の質問をつくり、ChatGPTやPerplexityに投げて記録します。見るのは、自社の名前やURLが出るかに加えて、出張費や見積もりの扱いが正しく説明されているか、注意点の中で自社がどう扱われているか、引用元が自社サイトか紹介サイトかです。回答は回ごとに変わるので、料金のページを直す前と後で、期間をあけて何度か確かめます。[AIでの登場率の測り方](/guide/measure-ai-visibility/)",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（会社名は含めません）をPerplexityに投げ、回答に会社の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に会社が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "水道修理・鍵開けの業者のAI検索対策は、何から始めればいいですか？", a: "料金のページに、出張費・見積もり費・キャンセル料と、作業前に税込の総額を示すことを書くことからです。次に、指定番号と有効期間、対応エリアを文字で書き、業種を Plumber などにした構造化データと、Googleビジネスプロフィール・紹介サイトの値をそろえます。" },
        { q: "「◯円～」と書くのはだめですか？", a: "下限を書くこと自体が禁じられているわけではありませんが、埼玉県の措置命令では、下限の料金を示しながら追加の作業で数万円〜数十万円を請求していた表示が問題とされました。下限を書くなら、その金額で終わる作業の中身を書き、作業別の総額の例を並べてください。" },
        { q: "料金を細かく書くと、他社に比べられて不利になりませんか？", a: "比べられることを前提にしたほうが安全です。消費者委員会の資料では、トラブルにあった人の多くが広告の安い金額や「見積り無料」の表示を決め手にしていました。条件まで書いた料金は、AIが注意点と一緒に自社を説明するときの根拠になります。" },
        { q: "指定給水装置工事事業者の番号はどこに書けばいいですか？", a: "会社概要と料金のページに、市ごとに「◯◯市指定給水装置工事事業者 指定番号 第◯号（有効期間 ◯年◯月まで）」と文字で書きます。指定は2019年10月1日施行の改正水道法で5年ごとの更新制になったので、更新したら書き直します。" },
        { q: "害虫駆除の業者は、構造化データの型を何にすればいいですか？", a: "schema.org に害虫駆除のための型はないので、HomeAndConstructionBusiness か LocalBusiness にして、駆除の作業を害虫ごとに Service で表します。値はページ本文と同じにしてください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。会社の連絡先・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに必ず推薦されますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが業者の事実を正しく読める状態をつくり、どう説明されているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが自社のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業や、記事で触れた会社・団体と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Plumbers and Locksmiths: Fees, Licences | Nurevo",
      description: "AI search for plumbers, locksmiths and pest control: state call-out, estimate and cancellation fees, the total before work, and licence numbers in text.",
      h1: "AI search for plumbers, locksmiths and other call-out repair businesses: getting AI to read your fees, estimates and licence numbers correctly",
      lead: "For call-out repair businesses such as plumbers, locksmiths and pest control, AI search optimization is not about advertising the lowest \"from\" price. It is about answering, in the page text and with conditions, whether there is a call-out fee or an estimate fee, what cancelling costs, whether you give a written total including tax before starting work, and which official designation you hold (number and expiry). In Japan, consumer agencies and local governments keep warning about surprise bills in this trade, and AI reads those warnings too. A page that shows with facts that the warnings do not apply to you is easier for both AI and people to choose.",
      intro: [
        "Written 21 November 2026 (JST). The pages of Japan's National Consumer Affairs Center, the Consumer Commission, Saitama and Osaka prefectures, Chiba City and several city water bureaus, and the top-ranking articles, were read that day. The schema.org types were checked the same day with schema-dts 2.1.0.",
        "AI answers change by day and by wording. This guide helps AI read a repair business's facts correctly; it does not guarantee that you will appear in AI answers or rank higher. It is not legal advice: check the rules for your area with a consumer affairs office or a lawyer. The examples are from Japan; the page structure applies anywhere.",
      ],
      sections: [
        {
          heading: "What people in a hurry ask AI",
          paragraphs: [
            "Call-out repair questions arrive when someone is in a hurry and also afraid of being overcharged: \"My toilet is blocked at 10 pm. Who can come now in [city]?\", \"I'm locked out. How much does a locksmith cost?\", \"How do I avoid being ripped off by a plumber?\", \"There's a wasp nest on my balcony. Is removal expensive?\"",
            "AI often answers with names and with warnings. The warnings come from consumer agencies and local governments. If your site does not state the call-out fee, the estimate fee, cancellation charges, a total before work, payment methods and your designation number, AI can only repeat the general warnings and has no grounds to recommend you.",
            `Google says there are no additional requirements or special structured data for appearing in AI Overviews or AI Mode, and that the usual basics, such as structured data that matches the visible text, still matter. [Google: AI features and your website](${SRC.googleAi})`,
          ],
          table: {
            head: ["Common question", "What to write", "Where"],
            rows: [
              ["Can you come now?", "Hours you take calls and hours you can actually send someone, nights and holidays, service area by city name, typical arrival time and its basis", "Home page, service area page"],
              ["How much will it cost?", "Whether there is a call-out fee, estimate fee or cancellation charge and how much; worked totals per job (with conditions, tax included, month written); night surcharges", "Prices page"],
              ["Will I get a surprise bill?", "That you give a written total before work and start only after the customer agrees; how extra work is handled; payment methods and receipts", "Prices page, FAQ"],
              ["Are you a legitimate business?", "Designation number and expiry (for example a city's designated water supply contractor), address, representative, years in business", "About page, prices page"],
              ["What if something goes wrong later?", "Scope and length of your guarantee, contact point, how cooling-off works", "Guarantee page, FAQ"],
            ],
            caption: "The example questions were compiled for this guide. They are not statistics on how often each is asked.",
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            `We read five Japanese and five English top results for "plumber AI search" and its Japanese equivalents. In Japanese, [uravation's plumbing and lockout article (29 August 2026)](${SRC.uravation}) was the most concrete, covering price tables, designation numbers, measured arrival times and how to answer consumer warnings; its [pest control article (31 August 2026)](${SRC.uravationPest}) is useful on splitting pages by pest. In English, [Sagnik Bhattacharya (29 October 2026)](${SRC.sagnik}) included a testing method and a Plumber JSON-LD example.`,
            `None of them showed the actual advertising claims that regulators have acted against, how door-to-door sales rules apply, or WordPress steps. Many English figures come from the publishers' own unpublished analyses, such as [High Level Marketing](${SRC.hlm})'s "BBB 70%", and [Web Tonic (updated 9 October 2026)](${SRC.webtonic}) states itself that no study supports the claim that most plumbing leads bypass traditional search. [Marchex (15 August 2025)](${SRC.marchex}) is a list of strategies for home services in general, with no figures.`,
          ],
          table: {
            head: ["Article", "Strengths", "Gaps"],
            rows: [
              ["uravation plumbing and lockouts", "Price table, designation numbers and renewal, measured arrival times, answering warnings", "Structured data example, WordPress steps, enforcement examples"],
              ["uravation pest control", "Pages per pest, how the total is built, guarantee definitions", "Structured data example, price display rules"],
              ["assist-all repair and construction", "Writing FAQs and case studies, phased plans", "Sourced figures, regulations, structured data"],
              ["Sagnik Bhattacharya", "Testing method, Plumber JSON-LD, 30-day plan", "Japanese regulations, WordPress"],
              ["High Level Marketing, Web Tonic, Marchex, PHCP Pros", "Which listings AI tends to cite, sorting out statistics and their sources", "Mostly own analyses or general advice; no steps or price display examples"],
            ],
            caption: "As read on 21 November 2026.",
          },
        },
        {
          heading: "Why the way you show prices matters most in this trade",
          paragraphs: [
            `On 7 October 2021, Japan's National Consumer Affairs Center reported rising complaints about "household rescue services": toilet repair, leaks, locks, pest control, water heaters and similar. Complaints rose from 2,437 in fiscal 2016 to 5,882 in fiscal 2020, and the share involving online and other electronic ads rose from 19.2% to 41.1%. One case: an ad said \"from 950 yen\" and the bill was several hundred thousand yen. [National Consumer Affairs Center (7 October 2021, Japanese)](${SRC.kokusen})`,
            `The Consumer Commission's opinion of 4 August 2025 puts the electronic-ad share at about 15% in fiscal 2014 and about 55% in fiscal 2024. Its survey of 700 people (March 2025) found that the deciding reasons for choosing a business were a low price in the ad (about 39%), \"free estimate\" in the ad (36%) and being at the top of the search results (33%). The most common problems were a high bill after the repair (37%) and being charged for an estimate advertised as free (24%). [Consumer Commission opinion (PDF, Japanese)](${SRC.cao})`,
            "In other words, the low price and the \"free estimate\" that people see first have been the entry point to trouble. AI reads these public documents, so a page that shows only a big minimum price looks like a business AI would hesitate to recommend. A page that explains how the total is set and that you can decline after the estimate is an answer to the warnings.",
          ],
        },
        {
          heading: "Claims regulators acted against, and what to write instead",
          paragraphs: [
            `Saitama Prefecture has issued orders under Japan's Act against Unjustifiable Premiums and Misleading Representations to plumbing repair businesses (dated 8 February 2024 and 5 March 2025, each with an action under the Act on Specified Commercial Transactions the same day). The problems were prices that looked lower than reality and track records with no basis. [Saitama (9 February 2024)](${SRC.saitama2024}) · [Saitama (6 March 2025)](${SRC.saitama2025})`,
          ],
          table: {
            head: ["Claim found misleading (summary)", "Why", "Write instead"],
            rows: [
              ["A minimum price such as \"from 350 yen (incl. tax)\"", "Added work led to bills of tens to hundreds of thousands of yen", "Worked totals per job with conditions, tax included. If you give a minimum, describe the job that actually ends at that price"],
              ["\"Base fee 3,000 yen\", \"on-site estimate 0 yen, completely free\"", "Same: extra charges made the real payment much larger", "State call-out fee, estimate fee and cancellation charge separately, and what it costs to decline after the estimate"],
              ["\"Web-only discount, this month only\"", "Looked time-limited but was applied continuously", "Give a start and end date for discounts and remove them when they end"],
              ["Annual or monthly job counts", "More jobs than the staff could handle", "Only real counts, with the period counted"],
              ["\"99% customer satisfaction\"", "No objective survey, and there were complaints", "If you cannot state the method and sample size, leave it out"],
              ["Comparisons with competitors' prices or counts", "Based on guesses, not surveys", "Do not publish other businesses' figures"],
            ],
            caption: "Summary of Saitama Prefecture's announcements (checked 21 November 2026). Business names omitted.",
          },
          after: [
            `Chiba City lists similar complaints: charged for an estimate advertised as free, a lockout advertised \"from 2,000 yen\" that became about 100,000 yen, and pest control advertised with \"no extra charges\" that became about 70,000 yen. [Chiba City (updated 7 October 2026, Japanese)](${SRC.chiba}). Check your ads and listing-site copy for such wording at the same time as your site.`,
          ],
        },
        {
          heading: "Seven things to put on your prices page",
          list: [
            "Call-out fee: whether there is one, how much, and whether it changes by area or time. Name the places: \"free within the city, ¥X to Y town\".",
            "Estimate fee: the cost of finding the cause on site and writing an estimate. If declining after the estimate is free, say so.",
            "Cancellation charge: after you set off, after arrival, and after the estimate.",
            "Total before work: you give a written estimate with the work and the total including tax, and start only after the customer agrees. If extra work turns out to be needed, you stop and give a new price.",
            "Worked totals per job: for example \"blocked toilet (cleared with a plunger or similar, about 30 minutes): ¥X incl. tax\", with the work, time and parts as conditions and the month written. Build examples from real invoices; never invent figures.",
            "Night and holiday surcharges: hours and amount or percentage.",
            "Payment and paperwork: payment methods other than cash, and that you give a receipt and a work report.",
          ],
          after: [
            `Osaka Prefecture advises people to say clearly that they want someone to come \"for an estimate\" and to check beforehand whether the estimate and cancelling are charged. [Osaka Prefecture FAQ (updated 1 April 2026, Japanese)](${SRC.osaka}). If your page answers those checks first, AI can say things like \"this business states that estimates are free if you decline\". For prices pages in general, see [How to write a prices page AI reads correctly](/guide/pricing-page-ai-search/).`,
          ],
        },
        {
          heading: "Door-to-door sales rules and cooling-off",
          paragraphs: [
            `In Japan, a business visiting a consumer's home and signing a contract there counts as door-to-door sales under the Act on Specified Commercial Transactions, and the consumer can cancel within 8 days of receiving the legally required document. It may not apply when the consumer called the business, but Osaka Prefecture explains that cooling-off may still be possible when the advertised price and the bill differ greatly, or when the customer was pushed into a different contract from the repair requested. [Osaka Prefecture](${SRC.osaka})`,
            "Your site does not need a long legal explanation. State briefly what you do: \"we give you the document required by law when you sign\" and \"the document explains cooling-off\". Avoid deciding on your site which cases qualify, and point to the consumer hotline (188 in Japan, or your local equivalent). It gives AI something to read: the business itself names where to get advice.",
          ],
        },
        {
          heading: "Publish your designation number and its expiry",
          paragraphs: [
            `In Japan, work on water supply pipes and fittings is done by \"designated water supply contractors\" approved by each city's water bureau. Shizuoka City says work by non-designated contractors is prohibited by ordinance, and Kashiwa City warns that using one can lead to high bills and poor work. [Shizuoka City (updated 10 March 2026)](${SRC.shizuoka}) · [Kashiwa City (updated 17 December 2025)](${SRC.kashiwa}). Requirements include having a chief engineer for water supply work, and cities publish lists of designated contractors. [Fukuoka City (updated 1 November 2026)](${SRC.fukuoka})`,
            `Designations expire. Under the revised Water Supply Act in force from 1 October 2019, they are renewed every five years. [Chiba Prefecture](${SRC.chibaPref}) · [Japan Water Works Association (PDF)](${SRC.jwwa})`,
            "AI can compare the city's public list with your site. On your about and prices pages, write per city: \"Designated water supply contractor of [city], No. X (valid until [month year])\". For towns where you are not designated, say so and state how you handle work there. Which jobs need a designated contractor varies by city, so write only what the city's water bureau has confirmed. Locksmiths and pest control businesses can do the same with any registration or association membership they hold (name, number, expiry), and should not mention ones they do not hold. Outside Japan, the equivalent is your licence number and the authority that issued it.",
          ],
        },
        {
          heading: "Service area and arrival times",
          paragraphs: [
            "List your service area by city name in text, not only as a map image. Do not give only your best arrival time (\"as fast as 15 minutes\"); give a range with conditions and a basis, such as \"within the city in the daytime, usually 30 to 60 minutes (our records, [months])\", and say that rush hour or weather can cause delays.",
            "Taking calls 24 hours is not the same as attending 24 hours. Separate the hours you answer the phone from the hours someone can actually come. For hours in structured data, see [Getting AI to read your opening hours, holidays and closures](/guide/business-hours-holidays-ai-search/).",
          ],
        },
        {
          heading: "Structured data: Plumber, Locksmith and an estimate service",
          paragraphs: [
            `schema.org has [Plumber](${SRC.plumber}), [Locksmith](${SRC.locksmith}), Electrician and HVACBusiness, all under [HomeAndConstructionBusiness](${SRC.homeConstruction}). There is no type for pest control, so use HomeAndConstructionBusiness or LocalBusiness and describe each treatment as a Service.`,
            "With the business type set to Plumber in Nurevo AEO and the on-site estimate registered as a service, the output looks like this (values are examples).",
          ],
          code: SCHEMA_EN,
          after: [
            "Put 0 in the Offer only if it really costs nothing. If the call-out fee changes by area or time, state the condition in the service name and description, or leave the price empty and explain in the text. Repair prices vary with the job, so keep them out of structured data and put worked totals in the page text. The designation can be added as hasCredential with the filter below.",
          ],
        },
        {
          heading: "Setting it up on a WordPress repair business site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO and Slim SEO keep working. From 0.9.1 it also runs alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicate structured data.`,
            "In the setup wizard, choose \"Other\", then enter Plumber in the \"Business type (schema.org type)\" setting (Locksmith for locksmiths, Electrician for electricians, HomeAndConstructionBusiness for pest control).",
            "Check the business name, address, phone, hours and description. In the description, briefly state the jobs you do, your service area and that you give a total before work.",
            "Register the on-site estimate and your main jobs (blocked toilet, leaking tap, lockout and so on) as services, one each (up to 20). The price field is output exactly as typed, so enter numbers only. For jobs whose price varies, leave the price empty and put the conditions in the description. Add a booking page URL to output a ReserveAction too; each service also gets a line in llms.txt.",
            "Add the service area and designation number with the developer filter webmcp_canary_business_node (code below; in a child theme's functions.php or a code snippets plugin). With an SEO plugin active, the values are merged into that plugin's business node, and values the plugin already has take priority.",
            "Put common questions (call-out fee, cost of declining after the estimate, cancellation, total before work, night surcharge, payment, designation number, cooling-off) in the FAQ and place the Nurevo FAQ block (or the [nurevo_faq] shortcode).",
            "Open /llms.txt and check that the prices, service area, about and guarantee pages are listed. Finished campaign pages can be excluded from llms.txt in the Nurevo AEO panel. Run the check on the AEO score screen and fix what is missing.",
          ],
          code: PHP_EN,
          after: [
            "On sites not built with WordPress, check the same items. Enter your URL in the [free check](/check), no sign-up needed, to see the state of your structured data, llms.txt and AI crawler access. For SEO plugins, see [Adding local business data to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Align listing sites, search ads and your Google Business Profile",
          paragraphs: [
            "AI reads listing sites, comparison articles and your Google Business Profile as well as your site. If your name, address, phone, service area, hours or price wording differ between them, AI cannot tell which is right. Keep a list of where you are listed and align them with your site. Ads or listings that still say only \"from ¥X\" or \"free estimate\" contradict a site that states conditions carefully.",
            `The Consumer Commission notes that much of the harm starts from search ads and advises consumers not to trust a business \"just because it appears at the top of the search results\" and to get several estimates where possible. [Consumer Commission (PDF)](${SRC.cao}). Writing in a form that is easy to compare is the shortest route.`,
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Call-out fee, estimate fee and cancellation charge are each given as an amount or \"free\", with conditions.",
            "The page says you give a written total including tax before work and start only after the customer agrees.",
            "Worked totals per job are shown with the work, time and month written, and no minimum price is made to stand out alone.",
            "Discounts have start and end dates, and finished ones are removed.",
            "There are no figures you cannot back up: job counts, satisfaction rates, comparisons with competitors.",
            "Designation numbers and expiry dates are written per city in text (none you do not hold).",
            "The service area is listed by city name, arrival times have conditions and a basis, and call-taking hours are separate from attending hours.",
            "The page says you give the legally required document and names a consumer advice line.",
            "The business type is Plumber or similar, and name, address, phone and hours match across the site, structured data, Google Business Profile and listings.",
            "llms.txt lists the prices, service area, about and guarantee pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking how AI describes you",
          paragraphs: [
            "Write 5 to 10 questions that combine an area, a job and a worry (\"blocked toilet at night [city]\", \"lockout price [city]\", \"how to avoid plumber rip-offs [city]\"), ask ChatGPT and Perplexity, and record the answers. Look at whether your name or URL appears, whether your call-out and estimate terms are described correctly, how you are treated within the warnings, and whether the source is your site or a listing site. Answers change each time, so check several times, spaced out, before and after you fix your prices page. [How to measure AI visibility](/guide/measure-ai-visibility/)",
            "On the Free and Standard plans, Nurevo AEO puts three questions built from your business type and area (never your business name) to Perplexity once a month and records whether your name or site appears. On Pro ($99/month and up), the beta AI visibility measurement shows how often you appear, with competitor comparison and trend (currently measured on Perplexity). Both look at a sample of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a plumber or locksmith start with AI search?", a: "On your prices page, state the call-out fee, estimate fee and cancellation charge, and that you give a total including tax before work. Then write your designation or licence number and expiry and your service area in text, publish structured data with a type such as Plumber, and align your Google Business Profile and listing sites." },
        { q: "Is it wrong to write \"from ¥X\"?", a: "Giving a minimum is not banned in itself, but in Saitama Prefecture's orders the problem was showing a minimum price while added work led to bills of tens to hundreds of thousands of yen. If you give a minimum, describe the job that ends at that price and show worked totals per job." },
        { q: "Won't detailed prices put us at a disadvantage against competitors?", a: "It is safer to assume you will be compared. In the Consumer Commission's survey, many people who ran into trouble chose a business because of a low advertised price or \"free estimate\". Prices with conditions give AI grounds to describe you alongside the warnings." },
        { q: "Where should we write the designated contractor number?", a: "On your about and prices pages, per city: \"Designated water supply contractor of [city], No. X (valid until [month year])\". Since the revised Water Supply Act in force from 1 October 2019, designations are renewed every five years, so update it when you renew." },
        { q: "What structured data type should a pest control business use?", a: "schema.org has no pest control type, so use HomeAndConstructionBusiness or LocalBusiness and describe each treatment as a Service. Keep the values identical to the page text." },
        { q: "Can I use Nurevo AEO for free?", a: "Yes. Structured data for your contact details, hours, services and FAQ, llms.txt, AI crawler rules and the AEO score are on the free plan. Paid plans add the always-current ruleset (Standard, $20/month) and the beta AI visibility measurement (Pro, $99/month and up). [Nurevo AEO on WordPress.org](" + WP_ORG + ")" },
        { q: "Will this guarantee ChatGPT recommends us?", a: "No. AI answers vary, and no tool or method can guarantee appearance or ranking. What you can do is make sure AI reads your facts correctly and keep checking how it describes you." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your site",
        body: "The free check, no sign-up needed, shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them, or with any company or organisation mentioned in this guide. This is not legal advice.",
    },
  },
};
