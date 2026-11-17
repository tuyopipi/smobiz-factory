// Content page: AI search (AEO) for franchise headquarters (フランチャイズ本部).
// Two kinds of question reach AI about a franchise brand: customers asking
// about one store, and prospective franchisees asking about joining. This page
// covers what is different from a chain of company-owned stores
// (multi-location-business-ai-search): who operates each store, what differs
// between franchisee stores, how to describe the relationship in structured
// data without calling the franchisee a subsidiary, the franchise-recruitment
// page, who updates what (HQ / franchisee / agency), and measuring both kinds
// of question.
//
// Written 2026-11-17 (JST). Nurevo facts come from
// experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt (0.9.2)
// and its docs/developers.md:
// - "One graph, one business": the settings describe one business.
// - webmcp_canary_schema_graph: $bundle['core'] / ['extra'] / ['org_id']
//   (read only); not called on a page excluded from structured data.
// - Per-page settings: "このページをllms.txtに載せない", "このページではNurevoの
//   構造化データを出力しない", page-only FAQ ("このページ専用の質問").
// - llms.txt: 30 most recently updated pages/posts; webmcp_canary_llms_txt_lines.
// - Settings > Tools export/import, wp nurevo export / import; keys, tokens,
//   plan and connection never exported.
// - Free AI check: questions from business type and area, without the name.
// - Pro measurement (beta): Perplexity.
//
// Outside facts and where they were read:
// - schema.org definitions read in schema-dts 2.1.0 on 2026-11-17 (schema.org
//   pages could not be fetched from this run): subOrganization "A relationship
//   between two organizations where the first includes the second, e.g., as a
//   subsidiary"; parentOrganization "The larger organization that this
//   organization is a subOrganization of"; brand "the brand(s) maintained by an
//   organization or business person"; legalName "the registered company name";
//   branchCode "store code". No property named franchise/franchisee exists.
// - Google LocalBusiness / AI features: as checked 2026-10-29 for
//   dental-clinic-ai-search (structured data should match visible content; no
//   special markup for AI features). Not re-fetched today.
// - PR TIMES, Branding Works, 2026-10-12: ChatGPT (gpt-5.1) and Gemini
//   (gemini-3.1-pro) API, one question, 9 days x 3, 54 valid answers, web
//   search on. ChatGPT named no specific brand in 89% of answers; citation
//   share web-repo.jp 8.8%, entrenet.jp 7.7%, fc-hikaku.net / prtimes.jp /
//   fc-kamei.net 6.6% each; angles: low start-up cost 35.2%, high margin 16.7%,
//   stable demand 14.8%. The company sells LLMO services (stated as such).
// - Franchising.com, Evan Hackel, 2025-11-30: prospects arrive informed by AI,
//   so franchisors should make materials readable and be transparent.
// - Law / JFTC: the 中小小売商業振興法 (e-Gov) and the JFTC franchise
//   guidelines could NOT be fetched today. No article numbers, disclosure items
//   or price-restriction rules are stated; readers are pointed to the texts.
// - Google Business Profile help could not be fetched: no ownership or
//   verification rule is stated.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  prtimes: "https://prtimes.jp/main/html/rd/p/000000012.000155520.html",
  hackel: "https://www.franchising.com/amp/articles/20251207_the_naked_salesperson_ai_informs_prospects_making_transparency_paramoun.html",
  subOrg: "https://schema.org/subOrganization",
  parentOrg: "https://schema.org/parentOrganization",
  brand: "https://schema.org/brand",
  legalName: "https://schema.org/legalName",
  branchCode: "https://schema.org/branchCode",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  law: "https://laws.e-gov.go.jp/law/348AC0000000101",
  jftc: "https://www.jftc.go.jp/dk/guideline/unyoukijun/franchise.html",
  gbpHelpJa: "https://support.google.com/business/?hl=ja",
  gbpHelp: "https://support.google.com/business/",
};

const JSON_JA = `{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": "https://example.jp/stores/umeda/#store",
  "name": "サンプル食堂 梅田店",
  "branchCode": "0123",
  "url": "https://example.jp/stores/umeda/",
  "telephone": "06-0000-0000",
  "address": { "@type": "PostalAddress", "addressRegion": "大阪府", "addressLocality": "大阪市北区", "streetAddress": "梅田1-1-1", "addressCountry": "JP" },
  "brand": { "@id": "https://example.jp/#organization" },
  "parentOrganization": {
    "@type": "Organization",
    "name": "株式会社サンプルフーズ",
    "legalName": "株式会社サンプルフーズ",
    "url": "https://sample-foods.example/"
  }
}`;

const JSON_EN = `{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": "https://example.com/locations/riverside/#store",
  "name": "Sample Diner Riverside",
  "branchCode": "0123",
  "url": "https://example.com/locations/riverside/",
  "telephone": "+1-555-000-0000",
  "address": { "@type": "PostalAddress", "streetAddress": "1 River St", "addressLocality": "Springfield", "addressRegion": "IL", "addressCountry": "US" },
  "brand": { "@id": "https://example.com/#organization" },
  "parentOrganization": {
    "@type": "Organization",
    "name": "Riverside Foods LLC",
    "legalName": "Riverside Foods LLC",
    "url": "https://riverside-foods.example/"
  }
}`;

const PHP_JA = `// 加盟店の店舗ページにだけ、店のノードを足す（値は店舗ページの本文と同じカスタムフィールドから）
add_filter('webmcp_canary_schema_graph', function (array $bundle) {
    if (!is_singular('store')) {
        return $bundle;
    }
    $id    = get_queried_object_id();
    $store = array(
        '@type'      => 'Restaurant',
        '@id'        => get_permalink($id) . '#store',
        'name'       => get_the_title($id),
        'url'        => get_permalink($id),
        'branchCode' => get_post_meta($id, 'store_code', true),
        'telephone'  => get_post_meta($id, 'store_tel', true),
        'brand'      => array('@id' => $bundle['org_id']), // 本部のブランド
    );
    $operator = get_post_meta($id, 'operator_name', true); // 例：株式会社サンプルフーズ
    if ($operator) {
        // 加盟店：運営会社を parentOrganization に（本部は brand のまま）
        $store['parentOrganization'] = array('@type' => 'Organization', 'name' => $operator, 'legalName' => $operator);
    } else {
        // 直営店：本部が運営会社
        $store['parentOrganization'] = array('@id' => $bundle['org_id']);
    }
    $bundle['extra'][] = $store;
    return $bundle;
});`;

const PHP_EN = `// Add a store node only on location pages (values from the same custom fields the page shows)
add_filter('webmcp_canary_schema_graph', function (array $bundle) {
    if (!is_singular('store')) {
        return $bundle;
    }
    $id    = get_queried_object_id();
    $store = array(
        '@type'      => 'Restaurant',
        '@id'        => get_permalink($id) . '#store',
        'name'       => get_the_title($id),
        'url'        => get_permalink($id),
        'branchCode' => get_post_meta($id, 'store_code', true),
        'telephone'  => get_post_meta($id, 'store_tel', true),
        'brand'      => array('@id' => $bundle['org_id']), // the franchise brand
    );
    $operator = get_post_meta($id, 'operator_name', true); // e.g. Riverside Foods LLC
    if ($operator) {
        // Franchisee-run: the operating company is the parentOrganization; HQ stays the brand
        $store['parentOrganization'] = array('@type' => 'Organization', 'name' => $operator, 'legalName' => $operator);
    } else {
        // Company-owned: HQ runs the store
        $store['parentOrganization'] = array('@id' => $bundle['org_id']);
    }
    $bundle['extra'][] = $store;
    return $bundle;
});`;

export default {
  slug: "franchise-headquarters-ai-search",
  targetQueries: [
    "franchise AI search optimization",
    "franchisor GEO franchise development AI",
    "franchise location schema franchisee",
    "フランチャイズ AI検索 対策",
    "フランチャイズ本部 LLMO",
    "加盟店募集 AI 対策",
  ],
  related: ["multi-location-business-ai-search", "company-profile-page-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility", "agency-aeo-monthly-service"],
  locales: {
    ja: {
      title: "フランチャイズ本部のAI検索対策：加盟店と加盟募集の書き方 | Nurevo",
      description: "AIはフランチャイズについて「この店は誰が運営？」「加盟金はいくら？」の2種類の質問に答えます。直営店と加盟店の書き分け、子会社と誤読させない構造化データ、加盟募集ページの項目、本部・加盟店・制作会社の役割分担と測り方。",
      h1: "フランチャイズ本部のAI検索対策：加盟店の店舗情報と加盟募集ページを、AIに正しく読ませる手順",
      lead: "フランチャイズのブランドについてAIに届く質問は、お客様の「この店は何時まで？誰が運営している？」と、加盟を考える人の「加盟金や開業資金はいくら？どんな支援がある？」の2種類です。本部がやることは、店ごとに運営会社と店ごとの違いを文字で書くこと、加盟店を「本部の子会社」と読ませない形で構造化データをつなぐこと、加盟募集ページに日付つきの数字と前提を書き、社外に出ている数字と同じ値にそろえることの3つです。",
      intro: [
        "作成日：2026年11月17日（JST）。対象は、フランチャイズ本部の担当者と、本部のサイトを作る制作会社です。直営の多店舗チェーンに共通する店舗ページの作り方（1店1ページ、閉店・移転、Googleビジネスプロフィールとの同期）は[多店舗・チェーンのAI検索対策](/guide/multi-location-business-ai-search)にまとめています。この記事は、店を別の会社（加盟店）が運営していることで起きる問題と、加盟募集の質問に絞ります。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、AIが読む元の情報を正確にするためのもので、AIの回答に出ることや順位を保証するものではありません。",
      ],
      sections: [
        {
          heading: "フランチャイズについて、AIに届く質問は2種類ある",
          paragraphs: [
            "直営のチェーンと違い、フランチャイズには「店を使う人」と「店を持ちたい人」という、まったく違う読み手がいます。同じブランド名で検索されても、必要な事実が別です。",
          ],
          table: {
            head: ["誰が聞くか", "質問の例", "答えの元になる場所"],
            rows: [
              ["お客様（店名あり）", "「〇〇の梅田店は日曜もやっている？」", "その店の店舗ページ、Googleビジネスプロフィール"],
              ["お客様（店名なし）", "「梅田で日曜に開いている定食屋は？」", "店舗ページの地域・営業時間・業種"],
              ["お客様（困りごと）", "「〇〇で買った商品の返品はどこに連絡？」", "店舗ページの運営会社と問い合わせ先"],
              ["加盟検討者（ブランド名あり）", "「〇〇のフランチャイズの加盟金とロイヤルティは？」", "本部の加盟募集ページ、比較サイト"],
              ["加盟検討者（ブランド名なし）", "「低資金で始められる飲食のフランチャイズは？」", "比較サイト・ニュース記事・本部のページ"],
              ["加盟検討者（比較）", "「〇〇と△△のフランチャイズの違いは？」", "両社の加盟募集ページ、比較サイト"],
            ],
          },
          after: [
            `加盟検討者の質問では、比較サイトの影響が大きいことを示す調査があります。株式会社ブランディングワークスが2026年10月12日に公表した調査（ChatGPTとGeminiのAPIに同じ質問を9日間・各3回、有効な回答54件）では、ChatGPTの回答の89%が特定のブランド名を挙げず、引用元の上位はフランチャイズの比較・ポータルサイトでした（web-repo.jp 8.8%、entrenet.jp 7.7%など）。紹介の切り口は「初期費用の安さ」が35.2%で最多でした（[PR TIMES](${SRC.prtimes})）。質問1種・54件の小さな調査で、調査した会社はAI検索対策のサービスを販売しています。それでも「本部のサイトだけでなく、比較サイトに出ている数字もAIに読まれる」ことは、本部の対策の前提になります。`,
          ],
        },
        {
          heading: "上位の記事で答えられていなかったこと",
          paragraphs: [
            "「フランチャイズ SEO」「franchise AI search」などで上位に出る日本語・英語の記事を読むと、多くは直営チェーンと同じ一般論（店舗ページ・口コミ・Googleビジネスプロフィール）か、自社サービスの案内でした。次の点は、ほとんど扱われていません。",
          ],
          table: {
            head: ["よく見る内容", "足りない点", "この記事で書くこと"],
            rows: [
              ["店舗ごとのページを作る", "その店を誰が運営しているかの書き方がない", "店舗ページに運営会社を書く欄と、直営店との書き分け"],
              ["LocalBusinessの構造化データ", "加盟店と本部の関係をどのプロパティで表すかがない", "brand と parentOrganization の使い分けとコード例"],
              ["ブランドの統一と地域の自由のバランス", "誰がどの値を直すかが決まっていない", "本部・加盟店・制作会社の役割の表"],
              ["加盟募集の集客", "AIが読む数字（加盟金・開業資金）の書き方がない", "加盟募集ページの項目表と、日付・前提の書き方"],
              ["出典のない数字（「口コミが16%」など）", "元の調査が示されていない", "確かめられた調査だけを、規模と限界つきで紹介"],
              ["効果の確かめ方", "ツールの名前が並ぶだけ", "お客様の質問と加盟検討者の質問を分けた記録表"],
            ],
          },
        },
        {
          heading: "直営店と加盟店で、店舗ページに書き分けること",
          paragraphs: [
            "お客様は、店を本部が運営しているか加盟店が運営しているかを気にしません。ただ、支払い・返品・予約・苦情の窓口は運営会社によって変わることがあり、そこをAIが取り違えると、お客様が間違った窓口に連絡することになります。店舗ページには、次の項目を「全店共通」か「この店だけ」かがわかる形で書きます。",
          ],
          table: {
            head: ["項目", "書き方の例", "加盟店で特に気をつけること"],
            rows: [
              ["運営会社", "「この店は株式会社サンプルフーズが運営しています（フランチャイズ加盟店）」", "会社名は登記どおりに。直営店は「本部直営」と書く"],
              ["価格・メニュー", "「価格は店舗により異なる場合があります。この店の価格表」", "本部の共通メニューと、その店の価格・限定品を分ける"],
              ["支払い方法・ポイント", "「この店で使える支払い方法」", "全店共通のアプリ・ポイントと、店ごとの対応を分ける"],
              ["予約・問い合わせ", "店の電話番号と、本部のお客様窓口の役割", "どの質問はどちらへ、を1行で書く"],
              ["返品・苦情", "窓口と受付時間", "本部が受けるのか、店が受けるのかを決めておく"],
              ["求人", "「この店の求人は運営会社が募集しています」", "雇用主が加盟店であることを書く"],
            ],
          },
          after: [
            "価格を店ごとに変えられるかどうかは、本部と加盟店の契約と、独占禁止法の考え方によります。本部が加盟店の販売価格をどこまで決められるかは、公正取引委員会の[フランチャイズ・システムに関する独占禁止法上の考え方](" + SRC.jftc + ")で確かめてください（この記事では、その内容は書いていません）。サイトに書くのは、決まった事実だけです。",
          ],
        },
        {
          heading: "構造化データ：加盟店を「本部の子会社」と読ませない",
          paragraphs: [
            `直営チェーンでは、店舗の LocalBusiness から本部を [parentOrganization](${SRC.parentOrg}) で指すのが基本です。ところが schema.org の定義では、parentOrganization は「この組織が [subOrganization](${SRC.subOrg}) になっている、より大きな組織」で、subOrganization は「子会社など、1つめの組織が2つめを含む関係」と説明されています。加盟店の店から本部を parentOrganization で指すと、加盟店が本部の一部（子会社）であるように読めてしまいます。`,
            `schema.org には「フランチャイズ」や「加盟店」を表すプロパティはありません（2026年11月17日、schema-dts 2.1.0 の定義で確認）。そこでこの記事では、次の書き分けをおすすめします。これは schema.org の定義から考えた書き方で、Googleが決めた方法ではありません。`,
          ],
          list: [
            `本部（ブランド）は、トップページか会社概要に Organization として1つ置き、固定の @id を付ける。店舗からは [brand](${SRC.brand})（「組織が保持しているブランド」）でこの @id を指す。`,
            `加盟店が運営する店は、parentOrganization に運営会社（加盟店の会社）を入れ、[legalName](${SRC.legalName})（登記上の名前）を書く。本部は brand のまま。`,
            "直営店は、parentOrganization に本部の @id を入れる（多店舗の記事と同じ）。",
            `店舗コードは [branchCode](${SRC.branchCode}) に入れ、本部・サイト・Googleビジネスプロフィールで同じ番号にする。`,
            "運営会社の名前は、店舗ページの本文にも書く。本文にない値を構造化データだけに入れない。",
          ],
          code: JSON_JA,
          after: [
            `Googleは、構造化データをページに見えている内容と一致させることを求め、AI機能のために特別なマークアップは要らないとしています（[AI 機能とウェブサイト](${SRC.googleAiJa})、2026年10月29日確認）。構造化データは本文の「答え合わせ」で、加盟店の関係も、まず本文の1行で伝えます。`,
          ],
        },
        {
          heading: "加盟募集ページ：AIが読む数字を、日付と前提つきで書く",
          paragraphs: [
            "加盟検討者の質問に答えるとき、AIは本部の加盟募集ページと、比較サイトやニュース記事の数字を一緒に読みます。どこかに古い数字が残っていると、新しいページより古い数字で答えられることがあります。本部のページを「いちばん新しく、いちばん詳しい元」にし、社外の掲載もその値に合わせます。",
          ],
          table: {
            head: ["項目", "書き方", "書かないこと"],
            rows: [
              ["開業に必要な費用", "加盟金・保証金・研修費・内装・設備などの内訳と合計。税込か税別か", "「〇〇万円〜」だけ（何が含まれないか不明）"],
              ["ロイヤルティ", "定額か売上の何%か、計算の元になる売上の範囲", "「業界最安」など比べた根拠のない言い方"],
              ["契約期間・更新・中途解約", "期間、更新の条件、解約時の費用の考え方", "契約書と違う簡単な説明"],
              ["店舗数", "加盟店と直営店を分け、「2026年10月末時点」のように日付を書く", "日付のない「全国〇〇店舗」"],
              ["モデル収支", "前提（立地・席数・客単価・人件費）と、実績か試算かの区別", "前提のない月商・利益の数字"],
              ["支援の内容", "研修の期間、開業前後の支援、本部の担当の役割", "「手厚いサポート」だけ"],
              ["募集エリア・条件", "募集している地域、法人か個人か、必要な経験", "すべての地域で募集しているような書き方"],
            ],
          },
          after: [
            `加盟を勧誘する本部には、加盟金・ロイヤルティなどを書面で説明する決まりがあります。書くべき項目は[中小小売商業振興法](${SRC.law})と公正取引委員会のガイドラインで確かめ、加盟募集ページの数字を、その書面（いわゆる法定開示書面）と同じ値にしてください（この記事では条文の項目は書いていません）。`,
            `英語圏でも、加盟検討者は説明会の前にAIで調べてから来るので、本部の資料を読みやすく、隠しごとのない形にすることが大切だという指摘があります（[Franchising.com、2025年11月30日](${SRC.hackel})）。数字はPDFだけに置かず、ページの本文に文字で書きます。よくある質問（加盟金・資金・未経験・兼業など）は、加盟募集ページにそのページだけのFAQとして置きます。`,
          ],
        },
        {
          heading: "本部・加盟店・制作会社で、誰が何を直すか",
          paragraphs: [
            "フランチャイズで情報がずれる一番の原因は、同じ値を複数の人が別々に直すことです。店舗の一覧表（マスタ）を本部が持ち、すべての掲載先をそこから更新する順番を決めます。",
          ],
          table: {
            head: ["情報", "決める人", "直す人", "確かめる頻度"],
            rows: [
              ["店名の形・ロゴ・共通メニュー", "本部", "本部（制作会社）", "変更のたび"],
              ["店の営業時間・臨時休業", "加盟店", "加盟店が本部に連絡→本部がサイトを更新", "月1回と変更のたび"],
              ["店の価格・限定品", "加盟店（契約の範囲で）", "本部がサイトに反映", "変更のたび"],
              ["運営会社・問い合わせ先", "加盟店", "本部が店舗ページに反映", "契約・譲渡のとき"],
              ["Googleビジネスプロフィール", "契約で決める", "決めた側", "月1回"],
              ["加盟募集ページの数字", "本部", "本部（比較サイトにも連絡）", "四半期ごとと改定のたび"],
            ],
          },
          after: [
            `Googleビジネスプロフィールのオーナーを本部と加盟店のどちらにするか、複数の店舗をまとめて管理する方法には、Googleの条件があります。条件は変わることがあるので、[Googleビジネスプロフィール ヘルプ](${SRC.gbpHelpJa})で確かめ、加盟契約か運用ルールに書いておきます。加盟店が自分でSNSや独自のサイトを持つ場合は、店名の書き方・本部の店舗ページへのリンク・載せてよい数字を、短いルールにして渡します。`,
            "加盟店が別の会社に店を譲ったときは、運営会社の欄・求人・問い合わせ先を同じ日に変えます。古い運営会社の名前が残ると、AIが今も前の会社の店として答えることがあります。",
            `制作会社が本部のサイトを保守している場合は、この表を保守契約の作業範囲に入れておくと、誰が直すかで迷いません。本部や加盟店のサイトを月額で支援する制作会社向けには、[パートナー制度](${PARTNER})があります。`,
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AIOの場合）",
          paragraphs: [
            `本部のサイトがWordPressなら、[Nurevo AIO（無料）](${WP_ORG})で本部の情報を構造化データとllms.txtに出し、店舗ページと加盟募集ページを次のように扱います。Nurevoの設定に入る事業者は1つ（1つのサイトに1つの事業者）なので、そこには本部（ブランド）の情報を入れます。`,
          ],
          list: [
            "店舗ページは1店1ページにし、本文に運営会社（加盟店は会社名、直営店は「本部直営」）を書く。運営会社の名前はカスタムフィールドに入れ、本文と構造化データの両方をそこから出す。",
            "Nurevoの基本情報には本部の名前・住所・電話・URLを入れる。1店舗の営業時間は入れない（全店の値のように見えるため）。",
            "店舗ごとの店のノードは、開発者向けの webmcp_canary_schema_graph フィルターで店舗ページにだけ extra に足す。本部の @id は $bundle['org_id'] で受け取れるので、brand に入れる。運営会社が入っている店は parentOrganization を運営会社に、空なら本部にする（下のコード）。",
            "加盟募集ページには、編集画面の「Nurevo」パネルでそのページだけの質問（加盟金・資金・未経験など）を入れ、Nurevo FAQブロックを「このページ専用の質問」にして置く。そのページにだけFAQPageとして出ます。",
            "Yoast SEO・Rank Math・All in One SEO・Slim SEOを使っている場合、Nurevoはそのプラグインの構造化データに足りない事実だけを足し、店のノードはその構造化データに追加されます。SEO SIMPLE PACK、VK All in One Expansion Unitとも併用できます（0.9.1から）。店舗検索のプラグインが店ごとの構造化データを出しているなら、二重にしないよう、どちらか一方にする。",
            "/llms.txt を開き、加盟募集ページと店舗一覧が載っているか確かめる。llms.txtには更新日の新しい固定ページ・投稿30件が載るため、載らないときは webmcp_canary_llms_txt_lines フィルターで行を足せます。募集を終えた地域のページや閉店した店のページは「このページをllms.txtに載せない」で外せます。",
            "加盟店が別のWordPressサイトを持つ場合は、本部のサイトで設定を書き出し（設定 → ツール、または wp nurevo export）、加盟店のサイトで読み込んでから、店の名前・住所・電話・営業時間だけを直してもらう。キーやトークン、プラン、接続は書き出されません。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態を、本部のトップ・店舗ページ・加盟募集ページそれぞれで確かめられます。",
          ],
        },
        {
          heading: "確かめ方：お客様の質問と、加盟検討者の質問を分けて記録する",
          paragraphs: [
            "2種類の質問は、答えの元になるページが違うので、記録も分けます。同じ質問を同じAIに、日を変えて何回か聞き、1回の答えで判断しないでください。",
          ],
          table: {
            head: ["種類", "聞く質問の例", "記録すること"],
            rows: [
              ["お客様・店名あり", "「〇〇の梅田店の営業時間は？」", "その店の値か、別の店の値か。出典"],
              ["お客様・困りごと", "「〇〇梅田店の予約の変更はどこに連絡？」", "運営会社・窓口が正しいか"],
              ["お客様・店名なし", "「梅田で日曜に開いている定食屋は？」", "店が出るか、どの店か"],
              ["加盟検討者・ブランド名あり", "「〇〇のフランチャイズの開業資金は？」", "数字が今の値か、出典が本部か比較サイトか"],
              ["加盟検討者・ブランド名なし", "「未経験で始められる飲食のフランチャイズは？」", "ブランドが出るか、どの切り口で紹介されたか"],
            ],
          },
          after: [
            "古い数字で答えられていたら、出典になったページ（本部の古いページ、比較サイト、PDF）を直すか、掲載先に更新を頼みます。Nurevoの無料のAIチェック（サイトを接続したFree・Standardのサイトで月1回）は、設定の業種と地域から作った質問を、名前を入れずに聞きます。加盟検討者の質問は自動の対象ではないので、上の表で手で記録します。Proの登場率の計測（ベータ版）は現在Perplexityが対象です。測り方の全体は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
          ],
        },
        {
          heading: "フランチャイズ本部のチェックリスト",
          list: [
            "店舗ページに、運営会社（加盟店は会社名、直営店は「本部直営」）が文字で書いてある。",
            "全店共通の情報と、その店だけの情報（価格・限定品・支払い方法）が分けてある。",
            "予約・返品・苦情の窓口が、本部と店のどちらかを1行で書いてある。",
            "加盟店の店のノードは brand で本部につながり、parentOrganization は運営会社になっている。",
            "直営店の店のノードは parentOrganization で本部につながっている。",
            "店舗コードが、本部・サイト・Googleビジネスプロフィールで同じ。",
            "加盟募集ページの費用は内訳・税込/税別・日付つきで、法定開示書面と同じ値。",
            "店舗数は加盟店と直営店を分け、時点が書いてある。モデル収支には前提と、実績か試算かが書いてある。",
            "比較サイトなど社外に出している数字を、改定のたびに直している。",
            "誰がどの値を直すかの表があり、譲渡・閉店のときに同じ日に直す手順がある。",
            "お客様の質問と加盟検討者の質問を、日を変えて記録した。",
          ],
        },
      ],
      faqs: [
        { q: "直営店と加盟店が混ざっています。店舗ページの形を変えるべきですか？", a: "ページの形は同じでかまいません。運営会社の欄だけを用意し、加盟店は会社名、直営店は「本部直営」と書きます。構造化データでは、直営店は parentOrganization に本部、加盟店は parentOrganization に運営会社、どちらも brand に本部を入れると、関係の違いが伝わります。" },
        { q: "加盟店の会社名を出すと、ブランドの統一感がなくなりませんか？", a: "店名やロゴはブランドの形のままで、運営会社はページの下のほうに1行書くだけで十分です。返品や苦情の窓口、求人の雇用主が加盟店になる場合、運営会社が書いていないとお客様もAIも取り違えます。" },
        { q: "parentOrganization に本部を入れてしまっていました。問題になりますか？", a: "大きな問題が起きるとは限りませんが、schema.org の定義では「子会社など、本部に含まれる組織」という意味になります。加盟店が運営する店は、brand を本部にし、parentOrganization を運営会社に直すことをおすすめします。" },
        { q: "加盟金や開業資金をサイトに書くと、比べられて不利になりませんか？", a: "書かない場合、AIは比較サイトや古い記事の数字で答えることがあります。内訳と前提、日付をつけて本部のページに書いておくほうが、間違った数字で比べられるのを減らせます。どの数字を出すかは、法定開示書面の内容と合わせて本部で決めてください。" },
        { q: "比較サイトに古い数字が残っています。どうすればいいですか？", a: "掲載している会社に、日付つきの新しい数字を送って更新を頼みます。本部の加盟募集ページには「2026年10月改定」のように改定日を書き、AIや人がどちらが新しいかわかるようにします。" },
        { q: "加盟店が独自のサイトでAI検索対策をしたいと言っています。", a: "本部の店舗一覧表の値（店名・住所・電話・営業時間・運営会社）と同じにすること、本部の店舗ページとお互いにリンクすること、加盟募集の数字は載せないことなどを、短いルールにして渡します。WordPressでNurevo AIOを使うなら、本部で書き出した設定を読み込んでから、店の値だけを直すとそろえやすくなります。" },
        { q: "この手順で、ブランドがAIのおすすめに出るようになりますか？", a: "保証はできません。AIの回答は日や聞き方で変わり、加盟検討者向けの質問では比較サイトの影響も大きいと見られます。この手順は、AIが読む元の情報を正確にし、店と店、本部と加盟店の情報が混ざる原因を減らすためのものです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "本部・店舗・加盟募集のページを、AIがどう読んでいるか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。WordPressなら、無料のプラグインで本部の情報を構造化データに出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPressプラグインを無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、GeminiとGoogleはGoogle LLC、PerplexityはPerplexity AIの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標です。記事中のサイト名・ブランド名は調査結果の記述のために挙げたもので、Nurevoはこれらの企業と提携・協賛関係にありません。",
    },
    en: {
      title: "Franchise AI Search: Franchisee Locations & Recruiting | Nurevo",
      description: "Franchise AI questions come from customers and prospects. Show franchisee operators, use schema that doesn't make them subsidiaries, and date recruiting figures.",
      h1: "AI search for franchisors: get franchisee locations and franchise-recruiting pages read correctly",
      lead: "Two kinds of questions about a franchise brand reach AI: customers asking \"is this location open on Sunday, and who runs it?\" and prospective franchisees asking \"what are the fees and the start-up cost, and what support do I get?\". The franchisor's job is threefold: state each location's operator and what differs there in plain text, link locations to the brand in structured data without making franchisees look like subsidiaries, and publish dated figures with their assumptions on the recruiting page, kept identical to the figures published elsewhere.",
      intro: [
        "Written November 17, 2026 (JST). This guide is for franchisor marketing teams and the agencies that build franchisor sites. The location-page basics shared with any chain (one page per location, closures and moves, keeping Google Business Profile in step) are in [AI search for multi-location businesses](/guide/multi-location-business-ai-search). This guide covers what changes when another company (a franchisee) runs the location, and the questions prospective franchisees ask.",
        "AI answers change from day to day and with the wording of the question. These steps make the source information AI reads accurate; they do not guarantee that you appear in AI answers or at any position.",
      ],
      sections: [
        {
          heading: "Two kinds of franchise question reach AI",
          paragraphs: [
            "Unlike a company-owned chain, a franchise has two very different readers: people who use the locations and people who want to own one. They may type the same brand name and need completely different facts.",
          ],
          table: {
            head: ["Who asks", "Example question", "Where the answer comes from"],
            rows: [
              ["Customer (location named)", "\"Is Sample Diner Riverside open on Sunday?\"", "That location's page, Google Business Profile"],
              ["Customer (no name)", "\"Which diners near the river are open on Sunday?\"", "Area, hours and category on location pages"],
              ["Customer (problem)", "\"Who do I contact about a refund from Sample Diner Riverside?\"", "Operator and contact details on the location page"],
              ["Prospect (brand named)", "\"What are the franchise fee and royalty for Sample Diner?\"", "The franchisor's recruiting page, franchise directories"],
              ["Prospect (no brand)", "\"Which food franchises can I start with little capital?\"", "Directories, news articles, franchisor pages"],
              ["Prospect (comparison)", "\"How does the Sample Diner franchise compare with X?\"", "Both recruiting pages, directories"],
            ],
          },
          after: [
            `For prospect questions, one study points to the weight of franchise directories. Branding Works, a Japanese company, published a survey on October 12, 2026 (the same question sent to the ChatGPT and Gemini APIs three times a day for nine days, 54 valid answers): 89% of ChatGPT's answers named no specific brand, and the most cited sources were Japanese franchise directory and portal sites (web-repo.jp 8.8%, entrenet.jp 7.7% and others). The most common angle was low start-up cost, at 35.2% ([PR TIMES](${SRC.prtimes}), in Japanese). It is a small study (one question, 54 answers) by a company that sells AI search services, and it covers Japan. Still, the working assumption for a franchisor is clear: AI reads the figures on directories, not only on your own site.`,
          ],
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "The Japanese and English articles that rank for \"franchise SEO\" and \"franchise AI search\" mostly repeat the advice for any chain (location pages, reviews, Google Business Profile) or promote a service. These points are rarely covered:",
          ],
          table: {
            head: ["Common advice", "What is missing", "What this guide adds"],
            rows: [
              ["Build a page for every location", "How to show who operates the location", "An operator field on location pages and how it differs for company-owned ones"],
              ["Add LocalBusiness schema", "Which property expresses the franchisee–franchisor relationship", "brand vs parentOrganization, with code"],
              ["Balance brand control and local freedom", "Who updates which value", "A roles table for franchisor, franchisee and agency"],
              ["Market franchise development", "How to publish the figures AI quotes (fees, start-up cost)", "A recruiting-page table with dates and assumptions"],
              ["Statistics such as \"reviews are 16% of ranking\"", "No original study is named", "Only studies we could read, with their size and limits"],
              ["Measure results", "Mostly a list of tools", "A log that separates customer and prospect questions"],
            ],
          },
        },
        {
          heading: "What to state differently on franchisee and company-owned location pages",
          paragraphs: [
            "Customers don't care who runs the location. But payments, refunds, bookings and complaints may be handled differently by each operator, and when AI mixes them up, customers contact the wrong place. On each location page, write the following so it is clear what applies to every location and what applies only here.",
          ],
          table: {
            head: ["Item", "Example wording", "What to watch for franchisee locations"],
            rows: [
              ["Operator", "\"This location is independently owned and operated by Riverside Foods LLC, a Sample Diner franchisee.\"", "Use the registered company name. For company-owned: \"Operated by Sample Diner\""],
              ["Prices and menu", "\"Prices may vary by location. See this location's prices.\"", "Separate the brand-wide menu from this location's prices and specials"],
              ["Payment and loyalty", "\"Payment methods accepted here\"", "Separate the brand app or loyalty scheme from what this location takes"],
              ["Bookings and enquiries", "Location phone, and what the brand's customer line handles", "One line on which questions go where"],
              ["Refunds and complaints", "Contact and hours", "Decide whether the franchisor or the location handles them"],
              ["Jobs", "\"Jobs at this location are offered by Riverside Foods LLC\"", "Make clear the franchisee is the employer"],
            ],
          },
          after: [
            "Whether prices can differ by location depends on the franchise agreement and on competition law in your country, which limits how far a franchisor can set franchisees' resale prices. Check with your legal adviser (in Japan, the Japan Fair Trade Commission's franchise guidelines; this guide does not summarise them). The site should state only what has been decided.",
          ],
        },
        {
          heading: "Structured data: don't make a franchisee look like a subsidiary",
          paragraphs: [
            `In a company-owned chain, each location's LocalBusiness points to the company with [parentOrganization](${SRC.parentOrg}). But schema.org defines parentOrganization as "the larger organization that this organization is a [subOrganization](${SRC.subOrg}) of", and subOrganization as "a relationship between two organizations where the first includes the second, e.g., as a subsidiary". Point a franchisee's location at the franchisor with parentOrganization and it reads as part of the franchisor.`,
            "schema.org has no property for \"franchise\" or \"franchisee\" (checked against the schema-dts 2.1.0 definitions on November 17, 2026). This guide recommends the following split. It is our reading of the schema.org definitions, not a method Google prescribes.",
          ],
          list: [
            `Publish the franchisor (the brand) once as an Organization on the home or About page with a fixed @id. From each location, point to it with [brand](${SRC.brand}) ("the brand(s) maintained by an organization").`,
            `For a franchisee-run location, set parentOrganization to the operating company (the franchisee) and give its [legalName](${SRC.legalName}) (the registered company name). The franchisor stays as brand.`,
            "For a company-owned location, set parentOrganization to the franchisor's @id (as in the multi-location guide).",
            `Put the store code in [branchCode](${SRC.branchCode}) and use the same number in your records, on the site and in Google Business Profile.`,
            "Write the operator's name in the page text as well. Never put a value only in structured data.",
          ],
          code: JSON_EN,
          after: [
            `Google asks for structured data to match what is visible on the page and says AI features need no special markup ([AI features and your website](${SRC.googleAi}), checked October 29, 2026). Structured data confirms the text; state the franchise relationship in a line of text first.`,
          ],
        },
        {
          heading: "The recruiting page: publish the figures AI quotes, with dates and assumptions",
          paragraphs: [
            "When answering a prospect, AI reads your recruiting page together with figures on directories and in news articles. An old figure left anywhere can be quoted instead of the new one. Make your own page the newest and most detailed source, and keep outside listings on the same values.",
          ],
          table: {
            head: ["Item", "How to write it", "Avoid"],
            rows: [
              ["Start-up cost", "Breakdown and total: franchise fee, deposit, training, fit-out, equipment; tax included or not", "\"From $X\" with no list of what is excluded"],
              ["Royalty", "Flat or a percentage, and which sales it is calculated on", "\"Lowest in the industry\" with nothing to compare against"],
              ["Term, renewal, early exit", "Length, renewal conditions, how exit costs are worked out", "A simplified version that differs from the agreement"],
              ["Number of locations", "Franchised and company-owned separately, with a date (\"as of October 31, 2026\")", "An undated \"500 locations nationwide\""],
              ["Unit economics", "Assumptions (site, seats, average spend, staff cost), and whether the figure is actual or projected", "Sales or profit figures without assumptions"],
              ["Support", "Training length, help before and after opening, what the franchisor's staff do", "\"Full support\" on its own"],
              ["Territories and requirements", "Where you are recruiting, company or individual, experience needed", "Implying every region is open"],
            ],
          },
          after: [
            `Franchisors usually have to give prospects a legal disclosure document: in Japan under the Act on the Promotion of Small and Medium Retail Business ([e-Gov](${SRC.law}), in Japanese), in the US the Franchise Disclosure Document. Check the required items in your own country's rules and keep the recruiting page's figures identical to that document (this guide does not list the legal items).`,
            `Prospects now arrive having researched the brand with AI, so franchisors are urged to make their materials readable and transparent ([Franchising.com, November 30, 2025](${SRC.hackel})). Put the figures in the page text, not only in a PDF, and add the common questions (fees, capital, no experience, running it alongside another job) as an FAQ for that page only.`,
          ],
        },
        {
          heading: "Franchisor, franchisee, agency: who updates what",
          paragraphs: [
            "In a franchise, information drifts mostly because several people edit the same value separately. Keep one location master owned by the franchisor, and fix the order in which every listing is updated from it.",
          ],
          table: {
            head: ["Information", "Decided by", "Updated by", "Checked"],
            rows: [
              ["Name format, logo, brand-wide menu", "Franchisor", "Franchisor (or agency)", "On every change"],
              ["Location hours and closures", "Franchisee", "Franchisee tells franchisor → franchisor updates the site", "Monthly and on change"],
              ["Location prices and specials", "Franchisee (within the agreement)", "Franchisor publishes on the site", "On change"],
              ["Operator and contact details", "Franchisee", "Franchisor updates the location page", "On contract change or resale"],
              ["Google Business Profile", "Set in the agreement", "Whoever the agreement names", "Monthly"],
              ["Recruiting-page figures", "Franchisor", "Franchisor (and tells directories)", "Quarterly and on every revision"],
            ],
          },
          after: [
            `Whether the franchisor or the franchisee owns each Google Business Profile, and how to manage many locations together, follow Google's own conditions, which change; check the [Google Business Profile Help Center](${SRC.gbpHelp}) and write the choice into the agreement or your operating rules. If franchisees run their own social accounts or sites, give them a short rule sheet: the name format, a link back to the brand's location page, and which figures they may publish.`,
            "When a franchisee sells its location to another company, change the operator, jobs and contact details on the same day. If the old operator's name stays, AI may keep describing the location as theirs.",
            `If an agency maintains the franchisor's site, put this table into the maintenance scope so there is no doubt about who updates what. Agencies that support franchisors or franchisees monthly can join the [partner program](${PARTNER}).`,
          ],
        },
        {
          heading: "On WordPress (with Nurevo AIO)",
          paragraphs: [
            `If the franchisor's site runs on WordPress, [Nurevo AIO (free)](${WP_ORG}) publishes the franchisor's facts in structured data and llms.txt, and location and recruiting pages are handled like this. Nurevo's settings describe one business per site, so enter the franchisor (the brand) there.`,
          ],
          list: [
            "Give each location one page and write its operator in the text (the company name for franchisees, \"Operated by [brand]\" for company-owned). Store the operator in a custom field and output both the text and the structured data from it.",
            "In Nurevo's business details, enter the franchisor's name, address, phone and URL. Don't enter one location's opening hours; they would read as every location's hours.",
            "Add a store node only on location pages with the developer filter webmcp_canary_schema_graph, in extra. The franchisor's @id is available as $bundle['org_id']; put it in brand. If the operator field is filled, parentOrganization is the operator; if empty, the franchisor (code below).",
            "On the recruiting page, enter questions for that page only (fees, capital, no experience) in the Nurevo panel of the editor and place the Nurevo FAQ block set to \"This page's own questions\". It is published as FAQPage on that page only.",
            "With Yoast SEO, Rank Math, All in One SEO or Slim SEO, Nurevo adds only the missing facts to that plugin's structured data, and the store node is appended to its graph. It also runs alongside SEO SIMPLE PACK and VK All in One Expansion Unit (from 0.9.1). If a store-locator plugin already outputs per-location structured data, keep only one of the two.",
            "Open /llms.txt and check that the recruiting page and the location list appear. llms.txt lists the 30 most recently updated pages and posts; if they are missing, add lines with the webmcp_canary_llms_txt_lines filter. Pages for closed territories or closed locations can be removed with \"Don't list this page in llms.txt\".",
            "If franchisees run their own WordPress sites, export the settings on the franchisor's site (Settings → Tools, or wp nurevo export), import them on the franchisee's site, and have them change only the location name, address, phone and hours. Keys, tokens, plan and connection are never exported.",
          ],
          code: PHP_EN,
          after: [
            "The checks are the same on other platforms. Enter a URL in the [free check](/check), no sign-up, to see the state of structured data, llms.txt and AI crawler access for the home page, a location page and the recruiting page in turn.",
          ],
        },
        {
          heading: "How to check: log customer and prospect questions separately",
          paragraphs: [
            "The two kinds of question draw on different pages, so log them separately. Ask the same question to the same AI on different days, and don't judge from a single answer.",
          ],
          table: {
            head: ["Type", "Example question", "What to record"],
            rows: [
              ["Customer, location named", "\"What are Sample Diner Riverside's hours?\"", "This location's value or another's; the source"],
              ["Customer, problem", "\"Who do I contact to change a booking at Sample Diner Riverside?\"", "Whether the operator and contact are right"],
              ["Customer, no name", "\"Which diners near the river are open on Sunday?\"", "Whether a location appears, and which"],
              ["Prospect, brand named", "\"How much does it cost to open a Sample Diner franchise?\"", "Whether the figure is current; source is you or a directory"],
              ["Prospect, no brand", "\"Which food franchises can I start without experience?\"", "Whether the brand appears, and on what angle"],
            ],
          },
          after: [
            "If an old figure is quoted, fix the page it came from (your old page, a directory, a PDF) or ask the listing to update. Nurevo's free AI check (monthly on connected Free and Standard sites) asks questions built from the business type and area in your settings, without your name. Prospect questions are not covered automatically, so log them by hand with the table above. Pro measurement (beta) currently covers Perplexity. The full method is in [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "Franchisor checklist",
          list: [
            "Each location page states its operator in text (company name for franchisees, \"operated by the brand\" for company-owned).",
            "Brand-wide information and location-only information (prices, specials, payment) are separated.",
            "One line says whether bookings, refunds and complaints go to the brand or the location.",
            "Franchisee store nodes link to the franchisor with brand; their parentOrganization is the operator.",
            "Company-owned store nodes link to the franchisor with parentOrganization.",
            "Store codes match across your records, the site and Google Business Profile.",
            "Recruiting-page costs show a breakdown, tax treatment and a date, and match the disclosure document.",
            "Location counts separate franchised and company-owned and carry a date; unit economics state assumptions and whether they are actual or projected.",
            "Figures on directories and other outside listings are corrected on every revision.",
            "There is a table of who updates what, and a same-day procedure for resales and closures.",
            "Customer and prospect questions were logged on different days.",
          ],
        },
      ],
      faqs: [
        { q: "We have both franchisee-run and company-owned locations. Do the location pages need different layouts?", a: "No. Use the same layout with an operator field: the company name for franchisees, \"operated by [brand]\" for company-owned. In structured data, give both brand = franchisor; set parentOrganization to the franchisor for company-owned locations and to the operator for franchisee locations. That expresses the difference." },
        { q: "Won't naming the franchisee hurt brand consistency?", a: "Keep the location name and logo in the brand format and put the operator in one line lower on the page. Where refunds, complaints or hiring are handled by the franchisee, leaving the operator out leads customers and AI to the wrong place." },
        { q: "We set parentOrganization to the franchisor for every location. Is that a problem?", a: "It may not cause visible problems, but by the schema.org definitions it describes an organization included in the franchisor, such as a subsidiary. For franchisee-run locations we recommend brand = franchisor and parentOrganization = the operating company." },
        { q: "If we publish our fees and start-up cost, won't we lose out in comparisons?", a: "If you don't, AI may answer with figures from directories or old articles. Publishing a dated breakdown with assumptions on your own page reduces the chance of being compared on wrong figures. Decide which figures to publish together with your disclosure document." },
        { q: "A directory still shows our old figures. What can we do?", a: "Send the listing owner the new figures with their date and ask for an update. On your recruiting page, show the revision date (\"revised October 2026\") so AI and people can tell which is newer." },
        { q: "A franchisee wants to do its own AI search work on its own site.", a: "Give it a short rule sheet: use the same name, address, phone, hours and operator as the franchisor's location master, link to and from the brand's location page, and don't publish recruiting figures. If it uses Nurevo AIO on WordPress, importing the franchisor's exported settings and changing only the location's values keeps the sites aligned." },
        { q: "Will these steps make AI recommend our brand?", a: "There is no guarantee. AI answers vary by day and wording, and directories appear to weigh heavily in prospect questions. These steps make the information AI reads accurate and reduce the mix-ups between locations, and between franchisor and franchisee." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads your brand, location and recruiting pages",
        body: "The free check needs no sign-up: enter a URL to see the state of structured data, llms.txt and AI crawler access. On WordPress, the free plugin publishes the franchisor's facts in structured data.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Install the free WordPress plugin", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI; Gemini and Google are trademarks of Google LLC; Perplexity is a trademark of Perplexity AI. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks of their respective owners. Site and brand names are mentioned only to report survey results. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
