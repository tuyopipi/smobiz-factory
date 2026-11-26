// Content page: AI search (AEO) for Buddhist altar shops (仏壇店) and
// gravestone / monument shops (石材店). Industry page.
// Angle: the shop, not the cemetery. What AI needs to answer is the total price
// of a gravestone split into stone, carving, foundation and installation, which
// cemeteries the shop can build in, the steps and costs of 墓じまい (closing a
// grave) and moving remains, after-care (repairs, guarantees), and for altars:
// size, material, where it was made (伝統的工芸品 / 伝統証紙 only when true),
// delivery and taking back the old altar. Separate from uravation's 霊園・墓石
// article (cemetery plots), from funeral homes (PR #88, unmerged) and from
// online-shop-ai-search.
//
// Written 2026-11-26 11時 (JST). Nurevo AEO facts from the plugin source
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2): the wizard
// card "小売店" (retail) sets Store; any schema.org type name can be entered in
// the business type setting and is published as is
// (webmcp_canary_business_schema_type); Services up to 20 as Service + Offer and
// llms.txt lines; webmcp_canary_business_node filter for extra properties.
// Free monthly check: three questions to Perplexity built from type and area,
// never the name. Pro measurement (beta) on Perplexity. Prices: Free 0,
// Standard 3,000 JPY / USD 20, Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-26):
// - 国民生活センター「墓・葬儀サービス」(更新 2026-07-31): PIO-NET 墓 2023年度
//   1,046 / 2024年度 1,018 / 2025年度 1,077 (2026-05-31現在). Recent cases are all
//   about temples: 宗派の違いによる解約料, 永代供養墓からの移転での高額な離檀料,
//   墓じまいでの離檀料. No 墓石・石材店・仏壇 specific item.
// - 総務省 東北管区行政評価局「墓じまいに関する情報収集結果」(別添1): 改葬件数は
//   平成26年度 約8万4千件 → 令和6年度 約17万6千件 (衛生行政報告例). 埋蔵証明書
//   に代わる書面 / 昭和30年の回答. Publication date not in the extracted text.
// - 滋賀県「滋賀県の伝統的工芸品について」(更新 2026-06-11): 全国で伝統的工芸品
//   241品目 (令和7年10月27日時点); 彦根仏壇 is one of Shiga's three; 伝統証紙が
//   貼られている工芸品は、産地組合等が実施する検査に合格した伝統的工芸品.
// - 伝産協会 2025年度 伝統証紙運用実証事業 公募 (2025-06): 伝統証紙 shows the
//   product meets the designation requirements; attached to products that
//   passed the 産地's inspection.
// - 大阪府 (2022-11-15): 大阪仏壇 経済産業大臣指定 昭和57年11月1日.
//   愛知県: 三河仏壇 昭和51年12月15日 (第6次). 広島市 (2025-08-27): 広島仏壇
//   昭和53年に指定.
// - 中部経済産業局: 名古屋仏壇 地域団体商標 第5098956号.
// - FTC "The FTC Funeral Rule" (updated 2024-03-04): the Rule does not apply to
//   third-party sellers such as casket and monument dealers. "Buying a Cemetery
//   Site" (updated 2024-03-04): check the type of monuments or memorials a
//   cemetery allows; opening a grave usually costs hundreds of dollars.
// - schema-dts 2.1.0: no altar / monument / memorial type. Store subtypes
//   include HomeGoodsStore and FurnitureStore. Cemetery extends CivicStructure
//   (a place, not a business).
// Top articles read 2026-11-26: uravation 霊園・墓石 (2026-09-27), sungrove
// 石材店の集客 (2019-03-25, upd 2025-10-29), GMO AIかんたん集客 ローカルAIO
// (2026-08-07, upd 11-16), sungrove MEO×AI (2026-04-10, upd 09-25), uravation
// 買取・リユース (2026-08-15, no 仏壇); coloradowebimpressions (Colorado
// Springs page under a "monument" URL), Stone World (2025-06-02), Texta
// stonemasons, Texta memorial garden stones, Funeral Guide UK (2025-11-04),
// 5W Funeral & End-of-Life AI Visibility Index (2026-04, no monument finding).
// Not verified, so not stated: 墓石の価格の相場, 石材の産地の表示の決まり, 霊園の
// 指定石材店の割合, 仏壇の国内生産の割合, 仏壇の処分の宗教上の作法, the share of
// people who use AI to find these shops, US/UK monument regulations beyond the
// FTC lines above.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  kokusenGrave: "https://www.kokusen.go.jp/soudan_topics/data/sougi.html",
  soumuHakajimai: "https://www.soumu.go.jp/main_content/001053400.pdf",
  shigaCraft: "https://www.pref.shiga.lg.jp/fd00/6498.html",
  dentoShoshi: "https://kyokai.kougeihin.jp/wp/wp-content/uploads/2025/06/20250604_dento-shoushi_koubo.pdf",
  osakaButsudan: "https://www.pref.osaka.lg.jp/o110070/mono/dento/dento04.html",
  mikawaButsudan: "https://www.pref.aichi.jp/sangyoshinko/jibasangyo/industry/mikawabutudan.html",
  hiroshimaButsudan: "https://www.city.hiroshima.lg.jp/hiroshima-brand/tokusan/1026508/1026509/1014728.html",
  nagoyaTrademark: "https://www.chubu.meti.go.jp/b36tokkyo/sesaku/chiiki_dantai_shohyo/pdf/aichi/nagoya_butsudan.pdf",
  ftcFuneralRule: "https://consumer.ftc.gov/articles/ftc-funeral-rule",
  ftcCemetery: "https://consumer.ftc.gov/articles/buying-cemetery-site",
  gbpGuidelines: "https://support.google.com/business/answer/3038177?hl=ja",
  gbpGuidelinesEn: "https://support.google.com/business/answer/3038177?hl=en",
  store: "https://schema.org/Store",
  cemetery: "https://schema.org/Cemetery",
  uravation: "https://uravation.com/llmo/reien-boseki-llmo-taisaku/",
  sungrove: "https://www.sungrove.co.jp/boseki-web/",
  gmo: "https://www.koukoku.jp/service/suketto/marketer/?p=29451",
  stoneworld: "https://www.stoneworld.com/articles/94813-seo-isnt-dead-but-ai-visibility-is-your-new-competitive-edge",
  texta: "https://www.texta.ai/api/md/how-to-rank-business-on-ai/home-services/stonemasons",
  funeralGuide: "https://www.funeralguide.co.uk/blog/how-funeral-directors-can-appear-ai-assistants",
  fiveW: "https://www.5wpr.com/research/funeral-services-ai-visibility-index-2026/funeral-services-ai-visibility-index-2026.pdf",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Store",
      "@id": "https://example.jp/#organization",
      "name": "例石材店（例）",
      "description": "◯◯市の石材店です。墓石の新規建立・リフォーム・墓じまい（墓石の撤去と更地への工事）と、仏壇・仏具の販売を行います。工事ができる霊園の一覧と、墓石の総額の内訳を料金ページに載せています。",
      "url": "https://example.jp/",
      "telephone": "+81-00-0000-0000",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "◯◯県",
        "addressLocality": "◯◯市",
        "streetAddress": "◯◯町1-2-3"
      },
      "areaServed": [
        { "@type": "City", "name": "◯◯市" },
        { "@type": "City", "name": "△△市" }
      ]
    },
    {
      "@type": "Service",
      "name": "墓じまい（墓石の撤去・処分・更地への工事）",
      "serviceType": "墓じまい工事",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": {
        "@type": "Offer",
        "price": "330000",
        "priceCurrency": "JPY",
        "description": "1㎡あたり110,000円（税込）、3㎡の区画で330,000円の例。墓石の撤去・運搬・処分と整地を含みます。重機が入れない区画は事前の現地確認で金額をお伝えします。改葬許可の申請とお寺への閉眼供養の依頼は含みません。"
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Store",
      "@id": "https://example.com/#organization",
      "name": "Example Memorials",
      "description": "Monument mason in Example City. New headstones, additional inscriptions, cleaning and repairs, and removal of old memorials. Our pricing page splits every headstone price into stone, lettering, foundation and installation, and lists the cemeteries we work in.",
      "url": "https://example.com/",
      "telephone": "+1-000-000-0000",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "Example State",
        "addressLocality": "Example City",
        "streetAddress": "1 Example Road"
      },
      "areaServed": [
        { "@type": "City", "name": "Example City" },
        { "@type": "City", "name": "North Town" }
      ]
    },
    {
      "@type": "Service",
      "name": "Additional inscription on an existing headstone",
      "serviceType": "Memorial inscription",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": {
        "@type": "Offer",
        "price": "450",
        "priceCurrency": "USD",
        "description": "$450 including tax for up to 40 letters, carved on site where the cemetery allows it. Includes the cemetery permit application we handle for you; any permit fee charged by the cemetery is passed on at cost and quoted in advance."
      }
    }
  ]
}`;

const PHP_JA = `// テーマの functions.php か、子テーマ・コードスニペットのプラグインに追加します。
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'City', 'name' => '◯◯市'),
        array('@type' => 'City', 'name' => '△△市'),
    );
    return $node;
}, 10, 2);`;

const PHP_EN = `// Add to your child theme's functions.php or a code-snippets plugin.
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'City', 'name' => 'Example City'),
        array('@type' => 'City', 'name' => 'North Town'),
    );
    return $node;
}, 10, 2);`;

export default {
  slug: "butsudan-gravestone-shop-ai-search",
  targetQueries: [
    "石材店 AI検索対策",
    "仏壇店 集客 ChatGPT",
    "墓石 墓じまい LLMO 石材店",
    "monument company AI search optimization",
    "headstone company get recommended by ChatGPT",
    "memorial mason schema markup",
  ],
  related: ["pricing-page-ai-search", "faq-page-ai-search", "business-hours-holidays-ai-search", "online-shop-ai-search", "multi-location-business-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "仏壇店・石材店のAI検索対策：墓石の総額・墓じまい・仏壇 | Nurevo",
      description: "仏壇店・石材店のAI検索対策。墓石の総額の内訳、工事できる霊園、墓じまいの手順と費用、仏壇の大きさ・産地・引き取りを、AIに正しく読ませる書き方と構造化データ・WordPressの設定例。",
      h1: "仏壇店・石材店のAI検索対策：墓石の総額、工事できる霊園、墓じまい、仏壇の産地をAIに正しく読ませる手順",
      lead: "仏壇店・石材店のAI検索対策（AEO）で一番大事なのは、お客様が見積もりを取る前に知りたいことを、店のサイトに文字で書いておくことです。墓石なら、石の代金・彫刻・基礎工事・据え付けに分けた税込みの総額と、工事ができる霊園や墓地、墓じまいでお店がする作業としない作業。仏壇なら、大きさ・材料・どこで作られたか（伝統的工芸品なら産地名）、配達と古い仏壇の引き取りです。そのうえで、同じ事実をGoogleビジネスプロフィールと構造化データ（Store＋Service）に出します。",
      intro: [
        "作成日：2026年11月26日（JST）。国民生活センター・総務省・滋賀県などのページは、本文に記したリンク先で2026年11月26日に確認しました。この記事は法的な助言ではありません。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがあなたの店の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "石材店・仏壇店がAIに聞かれること",
          paragraphs: [
            "お墓や仏壇は、多くの人にとって一生に何度も買うものではありません。そのため、AIには「いくらかかるのか」「どこまで頼めるのか」「この霊園で工事してもらえるのか」という、基本の質問が多くなります。霊園や墓地の区画そのものは霊園の運営者が答えることなので、この記事では、墓石を建てる・直す・片付ける石材店と、仏壇を売る店が答えるべきことに絞ります。",
          ],
          table: {
            head: ["質問の型", "質問の例", "AIが答えに必要な事実"],
            rows: [
              ["墓石の総額", "「◯◯市でお墓を建てるといくら？何が含まれる？」", "石・彫刻・基礎・据え付けに分けた税込みの金額、含まれないもの"],
              ["工事できる場所", "「◯◯霊園で工事できる石材店は？」", "工事の実績や許可がある霊園・墓地の名前、霊園の規則で業者が決まっている場合の扱い"],
              ["墓じまい", "「墓じまいを頼むといくら？手続きもしてくれる？」", "撤去・処分・整地の料金、1㎡あたりなどの単位、手続きの代行の有無"],
              ["修理・追加彫刻", "「戒名を追加で彫ってもらえる？傾いた墓石は直せる？」", "追加彫刻・クリーニング・修理の料金と日数、保証の内容"],
              ["仏壇の選び方", "「マンションに置ける小さな仏壇はある？」", "大きさ（高さ・幅・奥行き）、材料、価格、置き場所の例"],
              ["仏壇の産地・引き取り", "「国産の仏壇はある？古い仏壇は引き取ってくれる？」", "製造地、伝統的工芸品かどうか、配達と古い仏壇の引き取りの料金"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            `2026年11月26日に、日本語と英語で「石材店 AI検索対策」「monument company AI search」などの上位記事を11本読みました。日本語では、[uravationの霊園・墓石の記事](${SRC.uravation})が、総額の内訳・改葬の手続き・宗派の書き方を詳しく扱っていますが、中心は霊園の区画で、構造化データは型の名前に触れるだけ、WordPressでの手順はありません。統計も出典の名前だけで、リンクはありません。[サングローブの石材店の集客の記事](${SRC.sungrove})は2025年10月に更新されていますが、AI検索には触れておらず、市場規模の数字に出典がありません。[GMOのローカルAIOの記事](${SRC.gmo})は地域の店全般の内容で、数字の多くに出典がありません。仏壇店に絞った記事は見つかりませんでした。`,
            `英語では、石材の業界誌[Stone World](${SRC.stoneworld})の記事（2025年6月）が「AIに聞いて結果を記録する」ことを勧めていますが、数字や手順はありません。[Texta](${SRC.texta})は出典のない「50件以上の口コミ」を基準に挙げています。葬儀の分野のAI登場率を調べた[5Wのレポート](${SRC.fiveW})（2026年4月）にも、墓石の店についての結果はありませんでした。どの記事にも、墓石の総額を分けて書く表、工事できる霊園の書き方、伝統的工芸品の表示の確かめ方、WordPressの設定はありません。この記事は、これらを埋めます。`,
          ],
        },
        {
          heading: "墓石の料金は「総額の内訳」と「含まれないもの」で書く",
          paragraphs: [
            "墓石の値段は、石の代金だけを大きく書くと、AIもお客様も総額を取り違えます。お墓の工事には、石の加工、文字の彫刻、基礎工事、据え付け、古い墓石の撤去などが重なるからです。料金ページには、セットの価格を出す場合でも、何が入っていて何が入っていないかを文字で書きます。",
          ],
          table: {
            head: ["書く項目", "書き方の例"],
            rows: [
              ["石の代金", "和型8寸角・国産の◯◯石で◯◯万円、外国産の◯◯石で◯◯万円（税込）。石の名前と産地を書く"],
              ["彫刻", "家名・建立者名・建立年月の彫刻を含む。戒名の追加彫刻は1名◯万円"],
              ["基礎工事", "1.5㎡までの区画のコンクリート基礎を含む。それより広い区画は1㎡あたり◯万円"],
              ["据え付け・運搬", "◯◯市内の霊園は含む。市外は距離で◯万円から（見積もりで先にお伝えします）"],
              ["含まれないもの", "区画の使用料・管理料（霊園に払うもの）、開眼供養のお布施、古い墓石の撤去"],
              ["総額の例", "1.5㎡の区画に和型の墓石を建てる場合：◯◯万円（税込、上の内訳の合計）"],
            ],
            caption: "金額は書き方の例です。自分の店の実際の料金と石の名前を書いてください。",
          },
          after: [
            "霊園に払う使用料・管理料と、石材店に払う工事の代金は、払う相手が違います。この2つを分けて書くと、AIが「お墓の総額」を聞かれたときに、取り違えが起きにくくなります。料金ページの書き方全般は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "工事ができる霊園・墓地を名前で書く",
          paragraphs: [
            "お客様は、すでに区画を持っている霊園で工事を頼めるかどうかを知りたがります。霊園によっては、規則で工事のできる石材店が決まっていることがあります。その場合は、お客様がまず霊園の規則を確かめることになるので、店のサイトには「工事の実績がある霊園・墓地」と「指定を受けている霊園」を分けて、名前で書きます。",
          ],
          list: [
            "工事の実績がある霊園・墓地・寺院墓地の名前を、市区町村ごとに一覧にします。お寺の墓地は、お寺の了承を得てから載せます。",
            "霊園から指定を受けている場合は、その霊園の名前と「指定石材店」であることを書きます。指定を受けていない霊園を指定と書かないでください。",
            "工事の前に、霊園の管理事務所への届け出が必要な場合は、店が代わりに出すのか、お客様が出すのかを書きます。",
            "対応エリアを市区町村名で書き、そこから遠い霊園は出張の料金の考え方を書きます。",
          ],
        },
        {
          heading: "墓じまい：店がする作業と、しない手続きを分けて書く",
          paragraphs: [
            `墓じまいと、遺骨をほかのお墓や納骨堂に移す改葬は増えています。総務省東北管区行政評価局のまとめでは、厚生労働省の衛生行政報告例による改葬の件数は、2014年度（平成26年度）の約8万4千件から、2024年度（令和6年度）には約17万6千件に増えています。[総務省 東北管区行政評価局「墓じまいに関する情報収集結果」（PDF）](${SRC.soumuHakajimai})`,
            `国民生活センターに寄せられた「墓」の相談は、2023年度1,046件、2024年度1,018件、2025年度1,077件です（2026年5月31日現在）。最近の事例として紹介されているのは、墓じまいや遺骨の移転のときにお寺から高額な離檀料を求められた、宗派が違うとわかった墓地の解約で解約料を求められた、といった内容です。[国民生活センター：墓・葬儀サービス（2026年7月31日更新）](${SRC.kokusenGrave})。石材店が離檀料を決める立場にはありませんが、お客様は「誰に、何を、いくら払うのか」がわからずに困っています。`,
          ],
          table: {
            head: ["分けて書くこと", "書き方の例"],
            rows: [
              ["店がする工事", "墓石の撤去・運搬・処分、基礎の撤去、整地（更地にして霊園に返す）"],
              ["料金の単位", "1㎡あたり◯万円（税込）。重機が入れない区画は現地を見てからお伝えします"],
              ["店がしない手続き", "改葬許可の申請（今のお墓がある市区町村に出します）、お寺への閉眼供養の依頼、離檀の相談"],
              ["手続きの手伝い", "申請書の書き方の案内は無料。代行が必要な場合は、行政書士をご紹介します（例）"],
              ["遺骨の取り出し", "取り出しは工事の日に立ち会いのもとで行います。新しい納骨先までの運び方の相談"],
              ["期間の目安", "現地確認から工事まで◯週間ほど。霊園の届け出の受付日によって変わります"],
            ],
            caption: "書き方の例です。手続きの代行の可否や料金は、自分の店の実際の対応を書いてください。",
          },
          after: [
            "改葬の手続きの流れや必要な書類は自治体によって違うので、店のサイトでは「どこに申請するか」と「店が手伝えること」を書き、細かい要件は自治体の案内へのリンクにします。",
          ],
        },
        {
          heading: "仏壇：大きさ・材料・製造地を、事実どおりに書く",
          paragraphs: [
            `仏壇で書くべきことは、大きさ（高さ・幅・奥行き）、材料（木の種類、合板か無垢か、塗りの仕上げ）、どこで作られたか、価格です。とくに「国産」「伝統的工芸品」は、お客様が比べるときの大事な事実なので、正確に書きます。経済産業大臣が指定する伝統的工芸品は、全国で241品目あり（2025年10月27日時点）、彦根仏壇などの仏壇も含まれます。[滋賀県：滋賀県の伝統的工芸品について](${SRC.shigaCraft})。大阪仏壇は1982年11月1日、三河仏壇は1976年12月15日、広島仏壇は1978年に指定されています。[大阪府](${SRC.osakaButsudan})・[愛知県](${SRC.mikawaButsudan})・[広島市](${SRC.hiroshimaButsudan})`,
            `伝統的工芸品には「伝統証紙」があり、滋賀県の説明では、伝統証紙が貼られている工芸品は、産地組合などが行う検査に合格したものです。[滋賀県](${SRC.shigaCraft})・[伝統的工芸品産業振興協会の資料（PDF）](${SRC.dentoShoshi})。また「名古屋仏壇」は地域団体商標（商標登録第5098956号）になっています。[中部経済産業局（PDF）](${SRC.nagoyaTrademark})`,
          ],
          list: [
            "産地の名前（◯◯仏壇）は、その産地で作られ、証紙など確かめられる根拠があるものにだけ使います。「◯◯仏壇風」「◯◯仕立て」のような書き方で産地と誤解されないようにします。",
            "海外で作った仏壇や、部品を海外で作って国内で仕上げた仏壇は、そのことをそのまま書きます。どの工程をどこでしたかを書くと、AIが条件つきで答えられます。",
            "モダン仏壇・小型仏壇は、置き場所の例（リビングの棚の上、幅◯cmの家具の上など）と寸法を書きます。",
            "配達・据え付け、古い仏壇の引き取りの料金を書きます。引き取りの前にお寺に相談する人が多い場合は、「お寺へのご相談はお客様からお願いしています」のように、店がすることとしないことを書きます。",
          ],
        },
        {
          heading: "修理・追加彫刻・保証を、料金と日数で書く",
          paragraphs: [
            "お墓と仏壇は、買ったあとの相談も多い商品です。追加の彫刻、墓石のクリーニング、傾きや目地の補修、仏壇の洗浄（お洗濯）や修復などを、料金と日数で書いておくと、「◯◯市 墓石 修理」のような質問にもAIが答えやすくなります。",
          ],
          list: [
            "追加彫刻：1名あたりの料金、霊園で彫るか持ち帰って彫るか、日数。",
            "クリーニング・補修：1基あたりの料金の例、作業前の写真と作業後の報告の有無。",
            "保証：何年、何が対象か（石の割れ、目地、基礎の沈み など）、地震などの災害のときの扱い。「永久保証」のような書き方より、条件を書きます。",
            "仏壇の修復：洗浄・塗り直し・金箔の押し直しの料金の目安と、見積もりの方法（写真か、お店へ持ち込みか、出張か）。",
          ],
        },
        {
          heading: "店舗の情報とGoogleビジネスプロフィールをそろえる",
          paragraphs: [
            `石材店と仏壇店には、展示場やショールームを持つ店が多いので、住所・営業時間・定休日、駐車場、展示している墓石や仏壇の数を、サイトとGoogleビジネスプロフィールで同じにします。Googleのガイドラインでは、ビジネス名に地域名やサービス名を足すことは認められていません。[Google：ビジネス情報のガイドライン](${SRC.gbpGuidelines})。お盆・お彼岸・年末年始の営業も、決まったら早めに両方に書きます。くわしくは[営業時間と休業日のAI検索対策](/guide/business-hours-holidays-ai-search/)をご覧ください。`,
          ],
          list: [
            "石材店と仏壇店を両方している場合は、会社の情報は1つにまとめ、墓石のページと仏壇のページを分けます。",
            "展示場が複数ある場合は、展示場ごとのページを作ります。[複数店舗のAI検索対策](/guide/multi-location-business-ai-search/)",
            "ネットで仏壇・仏具を売っている場合は、送料・返品の条件を商品のページに書きます。[ネットショップのAI検索対策](/guide/online-shop-ai-search/)",
          ],
        },
        {
          heading: "構造化データ：仏壇や墓石の専用の型はない。Store＋Service",
          paragraphs: [
            `schema.orgには、仏壇店や石材店のための専用の型はありません（schema-dts 2.1.0で確認、2026年11月26日）。[Cemetery](${SRC.cemetery})は墓地という「場所」を表す型で、お店の型ではありません。店は[Store](${SRC.store})（または LocalBusiness）で出し、墓石の建立・墓じまい・追加彫刻・仏壇の修復などを Service と Offer で、対応エリアを areaServed で書きます。Store の下には HomeGoodsStore（生活用品の店）や FurnitureStore（家具店）もありますが、仏壇店にぴったり合うものではないので、迷ったら Store で十分です。`,
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データは本文に書いた料金と同じ内容にします。お布施や霊園の使用料のように、店が受け取らないお金を Offer の価格に入れないでください。",
          ],
        },
        {
          heading: "WordPressの石材店・仏壇店のサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「小売店」を選びます。業種（schema.org型）は Store になります。別の型にしたい場合は、設定画面の「業種（schema.org型）」に型の名前を入力すると、その型で出力されます。",
            "店名・住所・電話番号・営業時間を、Googleビジネスプロフィールと同じ表記で入れます。",
            "墓石の建立・リフォーム・墓じまい・追加彫刻・クリーニング・仏壇の修復などを「サービス」に登録します（最大20件）。名前・料金・予約や問い合わせのURL・説明を入れ、説明に「含まれるもの・含まれないもの」を書きます。サービスは構造化データ（Service）とllms.txtに載ります。",
            "対応エリア（areaServed）の入力欄はないので、構造化データにも入れたい場合は、下の webmcp_canary_business_node フィルターで足します。Yoast SEOなどが有効な場合は、そのプラグインがすでに出している値が優先されます。",
            "墓じまいの手続き・工事できる霊園・仏壇の引き取り・保証の答えをよくある質問に入力し、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を料金ページに置きます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search/)をご覧ください。",
            "/llms.txt を開き、料金・霊園の一覧・墓じまい・仏壇・よくある質問のページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "墓石の料金が、石・彫刻・基礎・据え付けに分けて税込みで書かれ、総額の例がある。",
            "霊園に払うお金（使用料・管理料）と、店に払うお金が分けて書かれている。",
            "石の名前と産地が書かれている。",
            "工事の実績がある霊園と、指定を受けている霊園が、分けて名前で書かれている。",
            "墓じまいで店がする工事と、店がしない手続き（改葬許可の申請、お寺への依頼）が分けて書かれている。",
            "仏壇の寸法・材料・製造地が事実どおりに書かれ、産地名や伝統的工芸品は根拠があるものだけに使っている。",
            "配達・古い仏壇の引き取り・修理・追加彫刻の料金と日数が書かれている。",
            "保証の年数と対象が、条件つきで書かれている。",
            "住所・営業時間・お盆とお彼岸の営業が、サイトとGoogleビジネスプロフィールで同じ。",
            "構造化データが Store（または LocalBusiness）＋Service で、料金が本文と同じ。llms.txtに主なページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、お客様が聞きそうな質問をAIに投げます。「◯◯市 墓じまい 石材店」「◯◯霊園 墓石 工事」「◯◯市 小さい仏壇 店」のような地域＋サービスの質問で名前が出るかに加えて、店の名前を入れて「墓じまいの料金は？」「手続きもしてくれる？」「古い仏壇を引き取ってくれる？」と聞き、答えがサイトの事実と合っているかを見ます。霊園の使用料が店の料金として答えられていないか、やめたサービスが出ていないかも確かめます。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、結果を記録します。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（店の名前は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在はPerplexity）。どちらも回答の一部を見本として調べるもので、すべての回答を見ているわけではありません。くわしくは[AIでの登場率の測り方](/guide/measure-ai-visibility/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "石材店のAI検索対策は、何から始めればいいですか？", a: "まず、墓石の料金を石・彫刻・基礎・据え付けに分けた税込みの総額で書き、霊園に払うお金と分けます。次に、工事の実績がある霊園の名前と、墓じまいで店がする工事・しない手続きを書きます。そのうえで、Googleビジネスプロフィールとそろえ、構造化データとllms.txtで出します。" },
        { q: "墓石の価格をサイトに載せると不利になりませんか？", a: "価格を載せると紹介されにくくなる、という公式の情報はありません。総額の例と内訳が書かれていれば、AIは「何が含まれていくらか」を条件つきで答えられます。区画の大きさや石で変わる場合は、条件と例を書きます。" },
        { q: "墓じまいの手続きも、石材店のサイトに書くべきですか？", a: "店が代わりにする作業と、お客様や他の人がする手続き（改葬許可の申請、お寺への依頼）を分けて書くことをおすすめします。手続きの細かい要件は自治体によって違うので、自治体の案内へのリンクを付けます。" },
        { q: "仏壇の構造化データの型は何にすればいいですか？", a: "schema.orgに仏壇店や石材店の専用の型はないので、Store か LocalBusiness にし、墓石の工事や仏壇の修復を Service で表します。Cemetery は墓地という場所の型で、お店には使いません。" },
        { q: "海外で作った仏壇は、正直に書くと売れにくくなりませんか？", a: "製造地を書くことでAIに紹介されにくくなる、という公式の情報はありません。どの工程をどこでしたかを事実どおりに書くと、AIは「国産を探している人」「価格を抑えたい人」それぞれに条件つきで答えられます。産地名や伝統的工芸品と誤解される書き方は避けてください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ず紹介されますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、墓石の総額・工事できる霊園・墓じまい・仏壇の事実をAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの店のサイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOで墓石の工事・墓じまい・仏壇の修復のサービスとよくある質問を無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Monument Masons & Altar Shops | Nurevo",
      description: "AEO for headstone, monument and Buddhist altar shops: write itemised memorial prices, the cemeteries you work in, removals, repairs and origin so AI can answer.",
      h1: "AI search for monument masons and Buddhist altar shops: getting AI to read your headstone prices, cemeteries, removals and product origin correctly",
      lead: "AI search optimization (AEO) for a headstone or monument business, or a shop selling Buddhist home altars, comes down to writing, as text on your own site, what people want to know before they ask for a quote. For memorials: the tax-inclusive total split into stone, lettering, foundation and installation, what is not included, the cemeteries you work in, and exactly which parts of a removal or reinstatement you do. For altars: size, materials, where it was made, delivery and taking back an old one. Then publish the same facts in your Google Business Profile and in structured data (Store with Service).",
      intro: [
        "Written November 26, 2026 (JST). Several examples here come from Japan, where Buddhist altar shops and stonemasons are often the same business and where we checked the public records on November 26, 2026. Cemetery, permit and consumer rules differ by country and by cemetery, so check the ones that apply to you. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention you or rank you anywhere.",
      ],
      sections: [
        {
          heading: "What people ask AI about memorials and altars",
          paragraphs: [
            "Most people buy a headstone or a home altar once or twice in their lives, often soon after a death. So the questions they put to AI are basic and practical: how much will it really cost, what exactly will you do, and can you work in the cemetery where we already have a plot. Plots, burial rights and cemetery fees are for the cemetery to answer; this article covers what the monument mason or altar shop should answer.",
          ],
          table: {
            head: ["Question type", "Example question", "Facts AI needs from you"],
            rows: [
              ["Total price", "\"How much does a headstone cost in [town], and what's included?\"", "Tax-inclusive price split into stone, lettering, foundation and fixing; what is excluded"],
              ["Where you work", "\"Which masons can work in [cemetery]?\"", "Named cemeteries you work in, and how you handle cemetery permits"],
              ["Inscriptions and repairs", "\"Can you add a name to an existing headstone? Can a leaning stone be fixed?\"", "Prices and lead times for added lettering, cleaning, re-fixing; guarantee terms"],
              ["Removal", "\"What does it cost to remove an old memorial?\"", "What you remove and dispose of, the price unit, which permits you do not handle"],
              ["Altar size", "\"Is there a small Buddhist altar for a flat?\"", "Height, width, depth, materials, price and placement examples"],
              ["Origin and take-back", "\"Is it handmade in Japan? Will you take the old altar?\"", "Where and how it was made, any official designation, delivery and take-back charges"],
            ],
            caption: "The example questions illustrate the article. They are not measured question frequencies.",
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            `On November 26, 2026 we read 11 top-ranking articles in English and Japanese. In English, the stone trade magazine [Stone World](${SRC.stoneworld}) (June 2025) recommends asking AI tools about your services and recording the results, but gives no data or concrete steps. [Texta's stonemason page](${SRC.texta}) states an unsourced threshold of more than 50 reviews. [Funeral Guide](${SRC.funeralGuide}) (November 2025) is short and mainly promotes its own directory. [5W's AI visibility index for funeral and end-of-life brands](${SRC.fiveW}) (April 2026) has no finding about monument businesses.`,
            `In Japanese, [uravation's article on cemeteries and gravestones](${SRC.uravation}) covers price breakdowns and procedures in depth but centres on cemetery plots, only names structured data types and has no WordPress steps; its statistics name their sources without links. None of the 11 showed a table that splits a memorial price, explained how to list the cemeteries you work in, covered checking claims of origin for altars, or gave WordPress setup. This article fills those gaps.`,
          ],
        },
        {
          heading: "Write memorial prices as an itemised total, with exclusions",
          paragraphs: [
            "If only the stone price is prominent, both customers and AI get the total wrong, because a memorial also involves cutting, lettering, a foundation, fixing and sometimes removing an old stone. Even if you sell packages, say in words what is in and what is out.",
          ],
          table: {
            head: ["Item", "Example wording"],
            rows: [
              ["Stone", "Upright headstone in [named granite] from [country], $X; in [named stone] from [country], $Y (including tax)"],
              ["Lettering", "Up to 60 letters included; additional letters $Z each"],
              ["Foundation", "Concrete foundation for a standard lawn plot included"],
              ["Fixing and delivery", "Included for cemeteries within our area; outside it, quoted by distance before you commit"],
              ["Not included", "Cemetery permit or installation fees charged by the cemetery, plot purchase, removal of an old memorial"],
              ["Total example", "Upright headstone with 60 letters on a lawn plot in [town]: $X (sum of the items above)"],
            ],
            caption: "Amounts are placeholders. Write your real prices and the real names of your stones.",
          },
          after: [
            `In the United States, the FTC says its Funeral Rule does not apply to third-party sellers such as monument dealers, or to cemeteries that lack an on-site funeral home, so price-list rules written for funeral homes may not cover you. [FTC: The FTC Funeral Rule](${SRC.ftcFuneralRule}). Writing an itemised price anyway answers the question customers actually ask. For pricing pages in general, see [pricing pages and AI search](/guide/pricing-page-ai-search/).`,
          ],
        },
        {
          heading: "Name the cemeteries you work in",
          paragraphs: [
            `Families usually already have a plot, so the first practical question is whether you can work there. The FTC's guide to buying a cemetery site tells consumers to check the type of monuments or memorials a cemetery allows. [FTC: Buying a Cemetery Site](${SRC.ftcCemetery}). Cemetery rules on size, material and who may install vary, so your site should say where you have worked and what you handle.`,
          ],
          list: [
            "List the cemeteries, churchyards or temple graveyards you have worked in, grouped by town. Ask private or religious grounds before naming them.",
            "If a cemetery approves or registers masons and you are approved there, say so. Never claim an approval you do not hold.",
            "Say whether you apply for the cemetery's permit on the customer's behalf, and how any fee the cemetery charges is passed on.",
            "Name the towns you cover, and how you price work in cemeteries further away.",
          ],
        },
        {
          heading: "Removals and moves: split your work from other people's steps",
          paragraphs: [
            `In Japan, closing a family grave and moving the remains (改葬) has become far more common: a regional office of the Ministry of Internal Affairs reports that relocation permits rose from about 84,000 in fiscal 2014 to about 176,000 in fiscal 2024, based on the health ministry's administrative statistics. [MIC Tohoku Regional Bureau (PDF, Japanese)](${SRC.soumuHakajimai}). Japan's National Consumer Affairs Center recorded 1,046, 1,018 and 1,077 consultations about graves in fiscal 2023, 2024 and 2025 (as of May 31, 2026); its recent examples involve temples asking for large fees when a family leaves. [National Consumer Affairs Center (Japanese)](${SRC.kokusenGrave})`,
            "A mason does not set those fees, but the lesson travels: customers struggle to see who they pay, for what. Whatever the local process, write it as two lists.",
          ],
          table: {
            head: ["Split out", "Example wording"],
            rows: [
              ["Work we do", "Remove and dispose of the memorial and foundation, level the plot and hand it back to the cemetery"],
              ["Price unit", "$X per memorial for a standard plot; plots without vehicle access are quoted after a site visit"],
              ["Steps we do not handle", "Exhumation or relocation permits, religious services, the cemetery's own fees"],
              ["Help we give", "We explain the forms for free and can introduce a specialist if you need one (example)"],
              ["Lead time", "About X weeks from site visit to work, depending on the cemetery's booking days"],
            ],
            caption: "Wording is an example. Write what you actually do and charge.",
          },
        },
        {
          heading: "Buddhist altars: size, materials and origin, exactly as they are",
          paragraphs: [
            `For a home altar, write the height, width and depth, the materials (wood, solid or veneer, lacquer finish), where it was made and the price. Origin matters most when customers compare. In Japan, 241 crafts are designated as traditional crafts by the Minister of Economy, Trade and Industry (as of October 27, 2025), including several regional altar traditions such as Hikone. [Shiga Prefecture (Japanese)](${SRC.shigaCraft}). Osaka altars were designated on November 1, 1982, Mikawa altars on December 15, 1976 and Hiroshima altars in 1978. [Osaka](${SRC.osakaButsudan}) · [Aichi](${SRC.mikawaButsudan}) · [Hiroshima](${SRC.hiroshimaButsudan})`,
            `Designated crafts can carry a certification label; Shiga Prefecture explains that a product with the label has passed an inspection carried out by the production-area cooperative or a similar body. [Shiga Prefecture](${SRC.shigaCraft}) · [Association for the Promotion of Traditional Craft Industries (PDF, Japanese)](${SRC.dentoShoshi}). \"Nagoya Butsudan\" is also a registered regional collective trademark (No. 5098956). [Chubu Bureau of Economy, Trade and Industry (PDF, Japanese)](${SRC.nagoyaTrademark})`,
          ],
          list: [
            "Use a regional name only for altars made there and backed by something checkable, such as the certification label. Avoid wording like \"[region] style\" that reads as a claim of origin.",
            "If an altar was made abroad, or made abroad and finished locally, say which steps happened where. AI can then answer both \"made in Japan\" and \"best value\" questions accurately.",
            "For compact modern altars, give dimensions and placement examples (on a shelf, on a cabinet X cm wide).",
            "State delivery, set-up and take-back charges. If customers usually consult their temple before an old altar is removed, say what you do and what they arrange themselves.",
          ],
        },
        {
          heading: "Inscriptions, repairs and guarantees: price and lead time",
          list: [
            "Additional inscriptions: price per name or per letter, whether carved in the cemetery or in the workshop, and how long it takes.",
            "Cleaning and re-fixing: an example price per memorial, and whether you send before-and-after photos.",
            "Guarantee: how many years and what it covers (cracks, joints, settling), and what happens after storms or earthquakes. Conditions are more useful to AI than \"lifetime guarantee\".",
            "Altar restoration: typical prices for cleaning, re-lacquering or re-gilding, and how you quote (photos, in store or a home visit).",
          ],
        },
        {
          heading: "Keep showroom details identical on your site and Google Business Profile",
          paragraphs: [
            `Many monument and altar businesses have a showroom or display yard, so keep the address, hours, closing days, parking and what is on display the same on your site and your Google Business Profile. Google's guidelines do not allow adding places or service keywords to the business name. [Google: Guidelines for representing your business](${SRC.gbpGuidelinesEn}). Publish holiday and seasonal hours on both as soon as they are set; see [business hours and holidays](/guide/business-hours-holidays-ai-search/).`,
          ],
          list: [
            "If you sell memorials and altars, keep one set of business details and give each its own page.",
            "With several showrooms, give each one a page. [Multi-location businesses](/guide/multi-location-business-ai-search/)",
            "If you sell altars or fittings online, put shipping and returns on each product page. [Online shops and AI search](/guide/online-shop-ai-search/)",
          ],
        },
        {
          heading: "Structured data: no memorial or altar type, so use Store with Service",
          paragraphs: [
            `schema.org has no dedicated type for monument masons or altar shops (checked in schema-dts 2.1.0 on November 26, 2026). [Cemetery](${SRC.cemetery}) describes the burial ground as a place, not a business. Publish the business as [Store](${SRC.store}) (or LocalBusiness), describe each job, such as a new memorial, an added inscription, a removal or an altar restoration, as a Service with an Offer, and put your area in areaServed. Store has subtypes such as HomeGoodsStore and FurnitureStore, but none fits an altar shop closely; Store is enough.`,
          ],
          code: SCHEMA_EN,
          after: [
            "Keep structured data identical to the prices on the page, and never put money you do not receive, such as cemetery fees or religious offerings, into an Offer price.",
          ],
        },
        {
          heading: "Setting it up on a WordPress site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working, without duplicate structured data.`,
            "In the setup wizard choose \"Retail shop\", which sets the business type to Store. To use another type, enter its schema.org name in the \"Business type (schema.org type)\" setting and it is published as is.",
            "Enter your name, address, phone and opening hours exactly as in your Google Business Profile.",
            "Add new memorials, inscriptions, cleaning, removals and altar restoration as Services (up to 20) with name, price, enquiry URL and a description stating what is and is not included. Services appear as Service structured data and in llms.txt.",
            "There is no service-area (areaServed) field. To add it to the structured data, use the webmcp_canary_business_node filter below. If Yoast SEO or a similar plugin is active, values that plugin already sets take precedence.",
            "Enter your answers on cemeteries, removals, take-back and guarantees as FAQs, and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your pricing page. See [FAQ pages and AI search](/guide/faq-page-ai-search/).",
            "Open /llms.txt and check that pricing, cemeteries, removals, altars and FAQ pages are listed. Run the diagnosis on the AEO score screen and fix what it finds.",
          ],
          code: PHP_EN,
          after: [
            "The same checks apply to sites not on WordPress. Enter your URL in the [free check](/check), no sign-up required, to see the state of your structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Memorial prices are split into stone, lettering, foundation and fixing, including tax, with a total example.",
            "Money paid to the cemetery is separated from money paid to you.",
            "Stones are named, with their country or quarry of origin.",
            "Cemeteries you work in, and any where you are approved, are listed by name and kept separate.",
            "Removal work you do is separated from permits and steps you do not handle.",
            "Altar dimensions, materials and origin are accurate, and regional or designated-craft names are used only with evidence.",
            "Delivery, take-back, inscription and repair prices and lead times are written.",
            "Guarantee length and coverage are written with conditions.",
            "Address, hours and seasonal hours match your Google Business Profile.",
            "Structured data is Store (or LocalBusiness) with Service, prices match the page, and llms.txt lists the main pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI mentions you, and whether it is right",
          paragraphs: [
            "Once your pages are in order, ask AI what customers would ask. Check whether you are named for questions such as \"headstone removal in [town]\", \"masons who work in [cemetery]\" or \"small Buddhist altar shop in [town]\", and ask with your name, such as \"What does an extra inscription cost?\" or \"Do they take old altars?\", to see whether the answers match your site. Watch for cemetery fees being presented as your price, and for services you no longer offer.",
            "AI answers change between runs, so ask the same questions several times, spread over time, and keep a record. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a monument mason start with AI search?", a: "First, write memorial prices as a tax-inclusive total split into stone, lettering, foundation and fixing, and separate them from cemetery fees. Then list the cemeteries you work in and what you do and do not handle for removals. After that, match your Google Business Profile and publish the same facts in structured data and llms.txt." },
        { q: "Will publishing headstone prices hurt me?", a: "There is no official information that publishing prices makes AI less likely to mention a business. An itemised total with an example lets AI answer what is included and at what cost. Where prices depend on plot or stone, give the conditions and an example." },
        { q: "Should I explain permits for removing or moving a grave?", a: "Separate the work you do from the permits and steps others handle, and link to the official guidance for the details, because the rules differ by place and cemetery." },
        { q: "Which structured data type fits a monument or altar shop?", a: "schema.org has no dedicated type, so use Store or LocalBusiness and describe each job as a Service. Cemetery is a type for the burial ground itself, not for a shop." },
        { q: "Will saying an altar was made abroad cost me sales?", a: "There is no official information that stating origin makes AI less likely to mention you. Saying which steps happened where lets AI answer both buyers looking for domestic craftsmanship and buyers looking for value. Avoid wording that suggests a regional or designated origin you cannot back up." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends me?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your prices, cemeteries, removal work and product facts easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your memorial services, altar services and FAQs for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
