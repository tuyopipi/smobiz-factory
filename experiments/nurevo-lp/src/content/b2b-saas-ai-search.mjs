// Content page: AI search (AEO) for B2B companies and SaaS vendors - what
// buyers ask AI while they shortlist tools and vendors, which pages answer
// each kind of question (pricing, case studies, comparison / alternatives,
// integrations and security), outside sources (review sites), crawler access,
// structured data (Organization + SoftwareApplication / Service), llms.txt,
// WordPress steps with Nurevo AEO, and how to measure.
//
// Written 2026-11-17 (JST). Product facts come from the plugin and service:
// - readme.txt (0.9.2): "B2B, SaaS and professional services - an
//   Organization with the services or software you offer, plus your pricing,
//   case study and FAQ pages in llms.txt"; online shops and B2B sites do not
//   need an address or opening hours.
// - includes/site-types.php: b2b => Organization (owner's type kept when it is
//   one of Organization, Corporation, OnlineBusiness, ProfessionalService,
//   LegalService, AccountingService, FinancialService, EmploymentAgency,
//   InsuranceAgency, NGO, EducationalOrganization, ResearchOrganization);
//   openingHours / geo / priceRange / potentialAction dropped from the
//   business node; pricing_url and case_studies_url ("料金ページ（BtoB）",
//   "導入事例ページ（BtoB）") go to llms.txt Key facts as "- Pricing: URL" /
//   "- Case studies: URL".
// - nurevo-webmcp.php: services (max 20) with name, price, currency,
//   category, booking URL, description (one sentence), service page URL and
//   "ソフトウェア（SaaS・アプリ）です" -> SoftwareApplication (category ->
//   applicationCategory) else Service (category); provider -> the business
//   node (home_url + '#organization'); @id page base + '/#nurevo-service-N';
//   price -> Offer price / priceCurrency. llms.txt service line:
//   "- [name](url) — description · CURRENCY price · category".
// - worker/site-types.mjs: B2B diagnosis requirements service_descriptions
//   (Service/SoftwareApplication with description, or catalogue), pricing
//   (pricing page role or a link whose text/href matches 料金/価格/プラン/
//   pricing ...), proof (FAQPage, case studies page role, or a link matching
//   導入事例/事例/実績/お客様の声/case study/testimonial/FAQ), identity
//   (Organization name+url+logo or sameAs, or a link to 会社概要/about).
//   Schema fields checked: Organization name/url/description/contactPoint/
//   logo; Service name/description/provider or SoftwareApplication
//   name/description/applicationCategory; WebSite; FAQPage.
// - worker/sov-site-type.mjs: B2B measurement questions (ja) are
//   category-based and unbranded, e.g. "{t}におすすめの{k}は？",
//   "{n}を比較して。主な選択肢を教えて。", "中小企業向けの{n}でおすすめは？",
//   "{n}の料金相場と、おすすめを教えて。", "導入事例が多い{n}は？",
//   "{n}の乗り換え先としておすすめは？"; the category is the business type
//   label when it is free text, else the most frequent service category.
// - free-ai-check.mjs: monthly, the first 3 unbranded questions, Perplexity.
//   Pro measurement (beta): Perplexity.
//
// Outside facts and where they were read:
// - schema.org via schema-dts 2.1.0 (2026-11-17): SoftwareApplication is a
//   CreativeWork with applicationCategory, operatingSystem, featureList,
//   softwareVersion, releaseNotes, offers; WebApplication is its subtype with
//   browserRequirements; UnitPriceSpecification has billingDuration and
//   referenceQuantity.
// - TaTap "BtoB企業がLLMO対策会社に頼むと..." (2026-11-10), read 2026-11-17:
//   own survey, 2026-11; of 135 executives who found a vendor themselves,
//   62.2% asked a generative AI for recommended companies; 27.4% dropped or
//   deprioritised companies whose names did not appear. Vendor survey: say so.
// - Google "AI features and your website": no extra requirements or special
//   markup/files (read 2026-11-01..11-10 for earlier guides; not re-fetched).
// - OpenAI crawlers (OAI-SearchBot opt-out = not shown in ChatGPT search
//   answers) and utm_source=chatgpt.com; Perplexity crawlers (read 2026-10-31
//   for measure-ai-visibility; not re-fetched).
// - Consumer Affairs Agency stealth marketing (from 2023-10-01), read
//   2026-11-01 for hair-salon-ai-search.
// - Search Console generative AI performance report (2026-06 blog; all sites
//   from 2026-08-31), read 2026-11-10.
// Could not be read this run (WebFetch permission not answered): Google's
// SoftwareApplication rich result page, Google AI features, OpenAI /
// Perplexity crawler pages, schema.org, the CAA page. Nothing new is stated
// from them; the rich result requirements are left to Google's page.
// Not stated on purpose: the conversion-rate and "x% of buyers start with AI"
// figures repeated in top articles (no primary source given or checked).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  googleSoftware: "https://developers.google.com/search/docs/appearance/structured-data/software-app",
  googleSoftwareJa: "https://developers.google.com/search/docs/appearance/structured-data/software-app?hl=ja",
  googleGenAiReport: "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  openaiFaq: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
  perplexityBots: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  schemaSoftware: "https://schema.org/SoftwareApplication",
  schemaWebApp: "https://schema.org/WebApplication",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
  tatap: "https://tatap.jp/knowledge/btob-llmo-agency/",
};

const JSONLD = `{
  "@type": "SoftwareApplication",
  "@id": "https://example.jp/#nurevo-service-1",
  "name": "勤怠クラウド・サンプル",
  "provider": { "@id": "https://example.jp/#organization" },
  "description": "従業員50〜300人の会社向けの、打刻・シフト・有給管理をまとめたクラウドの勤怠管理システム。",
  "url": "https://example.jp/product/",
  "applicationCategory": "勤怠管理システム",
  "offers": { "@type": "Offer", "price": "300", "priceCurrency": "JPY" }
}`;

const JSONLD_EN = `{
  "@type": "SoftwareApplication",
  "@id": "https://example.com/#nurevo-service-1",
  "name": "Example Timesheets",
  "provider": { "@id": "https://example.com/#organization" },
  "description": "Cloud time tracking for companies with 50 to 300 employees: clock-in, shifts and leave in one place.",
  "url": "https://example.com/product/",
  "applicationCategory": "Time tracking software",
  "offers": { "@type": "Offer", "price": "4", "priceCurrency": "USD" }
}`;

const LLMS_JA = `# 勤怠クラウド・サンプル

> 株式会社サンプルが提供する、従業員50〜300人の会社向けのクラウド勤怠管理システムです。

## Key facts

- URL: https://example.jp/
- Email: info@example.jp
- Type: Corporation
- Pricing: https://example.jp/pricing/
- Case studies: https://example.jp/cases/

## Pages

- [料金プラン](https://example.jp/pricing/)
- [導入事例](https://example.jp/cases/)
- [他の勤怠管理システムとの違い](https://example.jp/compare/)
- [連携できるサービス](https://example.jp/integrations/)

## Services

- [勤怠クラウド・サンプル](https://example.jp/product/) — 打刻・シフト・有給管理をまとめたクラウドの勤怠管理システム · JPY 300 · 勤怠管理システム`;

const LLMS_EN = `# Example Timesheets

> Cloud time tracking for companies with 50 to 300 employees, made by Example Inc.

## Key facts

- URL: https://example.com/
- Email: info@example.com
- Type: Corporation
- Pricing: https://example.com/pricing/
- Case studies: https://example.com/customers/

## Pages

- [Pricing](https://example.com/pricing/)
- [Customer stories](https://example.com/customers/)
- [How we compare](https://example.com/compare/)
- [Integrations](https://example.com/integrations/)

## Services

- [Example Timesheets](https://example.com/product/) — Clock-in, shifts and leave in one place · USD 4 · Time tracking software`;

export default {
  slug: "b2b-saas-ai-search",
  targetQueries: [
    "B2B SaaS AI search optimization",
    "how to get SaaS recommended by ChatGPT",
    "SoftwareApplication schema SaaS",
    "BtoB SaaS LLMO 対策",
    "BtoB AI検索 対策 料金ページ 導入事例",
    "SaaS ChatGPT おすすめ 出る",
  ],
  related: ["company-profile-page-ai-search", "llms-txt", "measure-ai-visibility", "blog-articles-ai-citations", "aeo-tools-comparison"],
  locales: {
    ja: {
      title: "BtoB・SaaSのAI検索対策：料金・導入事例・比較ページの作り方 | Nurevo",
      description: "「〇〇管理システムのおすすめは？」とAIに聞く買い手に、自社のサービスを正しく伝える方法。質問の型と答えるページ、料金・導入事例・比較ページの項目表、レビューサイト、構造化データ、llms.txt、WordPressの手順と測り方。",
      h1: "BtoB・SaaSのAI検索対策：料金・導入事例・比較ページをAIに正しく読ませる手順",
      lead: "BtoB・SaaSの買い手は、AIに「〇〇におすすめのツールは？」「AとBの違いは？」「料金相場は？」と聞いて候補を絞ります。対策の中心は、その質問に答えるページ（料金、導入事例、比較・乗り換え、連携とセキュリティ）を文字で用意し、条件と日付つきの事実を書き、社外のレビューやプロフィールと内容をそろえることです。構造化データとllms.txtは、そのページの事実を機械にも読める形で添えるものです。",
      intro: [
        "作成日：2026年11月17日（JST）。対象は、法人向けのソフトウェア（SaaS）、業務の受託、コンサルティングなどを提供する会社と、そのサイトを作る制作会社です。会社概要ページの書き方は[会社概要ページのAI検索対策](/guide/company-profile-page-ai-search)、記事・ブログの書き方は[AIに引用される記事の書き方](/guide/blog-articles-ai-citations)で扱っています。この記事は「サービスを選ぶ質問」に答えるページに絞ります。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、AIが読む元の情報を正確にそろえるためのもので、AIの回答に出ることや順位を保証するものではありません。",
      ],
      sections: [
        {
          heading: "BtoBの買い手は、AIに何を聞いているか",
          paragraphs: [
            "店舗なら「地域＋業種」の質問が中心ですが、BtoBでは「何をしたいか」「どんな条件か」から聞かれます。社名を知らない段階の質問が多く、AIの答えに名前が出なければ、そもそも比較の候補に入りません。TaTapが2026年11月に行った自社調査では、自分で依頼先を探した経営者135人のうち62.2%が生成AIに「おすすめの会社」を聞き、27.4%がAIの答えに名前が出なかった会社を候補から外すか優先度を下げたと答えています（[TaTap](" + SRC.tatap + ")、支援会社による小規模な調査です）。",
            "質問は、おおむね次の6つの型に分けられます。型ごとに、答えになるページが違います。",
          ],
          table: {
            head: ["質問の型", "質問の例", "答えになるページ", "AIの答えで起きやすい間違い"],
            rows: [
              ["カテゴリで探す", "「勤怠管理におすすめのツールは？」「代表的な勤怠管理システムを3つ」", "製品ページ（何を・誰に・どの規模に）", "対象の規模や業種を取り違える、別カテゴリの製品として紹介される"],
              ["条件で絞る", "「50人規模で、給与ソフトと連携できる勤怠管理は？」", "連携・機能・対応環境のページ", "連携していない製品を連携できると答える（またはその逆）"],
              ["比べる", "「AとBの違いは？」「勤怠管理システムを比較して」", "比較ページ（選び方の条件つき）", "古い機能や料金で比べられる"],
              ["料金を知る", "「勤怠管理システムの料金相場は？」", "料金ページ", "旧料金、税込・税抜の混同、最低利用人数の見落とし"],
              ["乗り換える", "「〇〇の乗り換え先は？」", "乗り換え・移行のページ", "移行の手間やデータ移行の可否が抜ける"],
              ["社名で確かめる", "「〇〇の評判は？」「〇〇の料金は？」", "導入事例、会社概要、社外のレビュー", "レビューサイトの古い情報や、同名の別製品と混ざる"],
            ],
          },
          after: [
            "Nurevoの計測でBtoB・SaaSのサイトに使う質問も、この型に沿っています（「〇〇におすすめのツールは？」「〇〇を比較して」「中小企業向けの〇〇でおすすめは？」「〇〇の料金相場は？」「導入事例が多い〇〇は？」「〇〇の乗り換え先は？」など、社名を入れない質問）。社名を入れた質問は別に手で確かめます（後述）。",
          ],
        },
        {
          heading: "上位の記事でよく見る主張と、この記事での扱い",
          paragraphs: [
            "「BtoB SaaS LLMO」「B2B SaaS AI search」で上位に出る日本語・英語の記事を13本読みました。比較ページ・導入事例・レビューサイトが大事、という点はほぼ共通しています。一方で、数字の多くは出典が示されていないか、支援会社自身の顧客の結果でした。この記事では、確かめられない数字は使いません。",
          ],
          table: {
            head: ["よく見る主張", "根拠の強さ", "この記事での扱い"],
            rows: [
              ["「AI経由の訪問はGoogle検索の何倍もコンバージョンする」", "記事によって数字が数倍〜20倍以上とばらばら。元の調査をたどれないものが多い", "使わない。自社のGA4で確かめる方法を書く"],
              ["「B2Bの買い手の7割がAIで調べ始める」", "出典が書かれていないか「業界資料」とだけある", "使わない。出典と人数が分かる調査だけを使う"],
              ["「比較ページ・代替ページがよく引用される」", "支援会社の観察。公式の説明はない", "AIが答える質問の型に合うので作る価値がある、とだけ書く"],
              ["「SoftwareApplicationやFAQの構造化データでAIに出やすくなる」", "記事によって正反対（効果あり／ほぼない）。Googleは、AI機能のための特別なマークアップは不要としている", "本文の事実を添えるもの、として扱う"],
              ["「レビューサイトの件数が多いほど推薦される」", "出典名のない調査が中心", "件数より、料金・機能が今の情報か、自社サイトと一致しているかを確かめる"],
              ["「llms.txtを置けばAIに読まれる」", "Googleは新しいAI向けファイルは不要としている。他のAIは公式の説明なし", "置くなら、料金・事例ページへの入口として"],
            ],
          },
          after: [
            "上位の記事にほとんどなかったのは、料金ページと導入事例ページに何を書くかの具体的な項目、WordPressでの手順、社名なしの質問と社名ありの質問を分けた測り方です。以下はそこを中心に書きます。",
          ],
        },
        {
          heading: "料金ページ：金額を全部出せなくても、判断できる材料を出す",
          paragraphs: [
            "「料金相場は？」「〇〇の料金は？」という質問に、AIは料金ページか、なければレビューサイトや比較記事の数字で答えます。古い数字や他社が書いた数字で答えられるより、自社の料金ページに今の条件を書いておくほうが安全です。見積もり制でも、何で金額が決まるかは書けます。",
          ],
          table: {
            head: ["書く項目", "書き方の例", "抜けると起きること"],
            rows: [
              ["課金の単位", "「1ユーザーあたり月額」「1拠点あたり」「従量（1,000件ごと）」", "総額を何倍にも読み違える"],
              ["プランごとの違い", "プラン名・含まれる機能・上限（ユーザー数、保存期間）を表で", "上位プランの機能が全プランにあると答えられる"],
              ["初期費用・最低契約", "初期費用の有無、最低利用人数、最低契約期間、年払いと月払いの違い", "月額だけが広まり、契約時に食い違う"],
              ["税込・税抜", "表の上に「表示はすべて税抜」など1回はっきり", "税込と税抜の数字が混ざって比べられる"],
              ["無料トライアル・無料プラン", "期間、使える機能、終了後に自動で課金されるか", "「無料で使える」とだけ伝わる"],
              ["オプション・別料金", "導入支援、追加ストレージ、API、サポートの上位プラン", "必要な費用が答えから抜ける"],
              ["見積もり制の場合", "「金額は〇〇と〇〇で決まります。目安は月〇万円から」と決まり方と下限", "「料金非公開」とだけ答えられ、候補から外れる"],
              ["更新日", "「2026年11月1日改定」とページに日付", "旧料金と新料金のどちらが正しいか分からない"],
            ],
          },
          after: [
            "料金を改定したら、料金ページだけでなく、比較ページ、よくある質問、ブログの古い記事、レビューサイトの掲載情報も同じ日に直します。AIは、自社のページ同士が食い違っていると、どちらかを選んで答えます。",
            "金額を画像やPDFだけで載せるのは避けてください。HTMLの表か、ラベル付きのリストで書きます。",
          ],
        },
        {
          heading: "導入事例ページ：条件で探されたときに当てはまる形にする",
          paragraphs: [
            "「製造業で使われている勤怠管理は？」「導入事例が多い〇〇は？」のように、BtoBの質問には条件が付きます。導入事例は、読み物としての面白さより、条件が分かる項目がそろっていることが大事です。1ページの最初に次の項目を表で置き、その後に本文を書きます。",
          ],
          table: {
            head: ["項目", "書き方の例"],
            rows: [
              ["業種・規模", "「食品製造業／従業員約250人／工場2拠点」"],
              ["使っている部署", "「人事部と各工場の管理者」"],
              ["導入前の課題", "「紙のタイムカードを月末に手で集計していた」"],
              ["選んだ理由・比べた条件", "「シフト制に対応し、既存の給与ソフトと連携できること」（他社名は出さなくてよい）"],
              ["使った機能・連携", "「打刻、シフト管理、給与ソフトへの連携」"],
              ["導入にかかった期間", "「契約から本番まで約2か月」"],
              ["結果と測り方", "「集計作業が月3日から半日に（人事部の作業記録、導入6か月後）」のように、何を・いつ・どう測ったか"],
              ["掲載日・情報の時点", "「2026年10月取材。役職・数字は取材時点」"],
            ],
          },
          after: [
            "結果の数字は、お客様が確かめられる範囲だけを、測り方と時点と一緒に書きます。大きく見せた数字はAIがそのまま引用し、後から直すのが難しくなります。お客様の社名・ロゴ・発言の掲載は、書面で許可を取っておきます。",
            "事例が少ないうちは、業種別・規模別の一覧ページを作り、1件ずつのページへリンクします。「導入事例」というページ名と、トップページからのリンクがあると、人にもAIにも見つけやすくなります。",
          ],
        },
        {
          heading: "比較ページと乗り換えページ：自社が向かない条件も書く",
          paragraphs: [
            "「AとBの違いは？」と聞かれたとき、自社サイトに比較の材料がなければ、AIは他社や比較サイトの記事で答えます。比較ページは、勝ち負けの表ではなく「どんな会社にどれが合うか」を判断する材料として作ります。",
          ],
          list: [
            "比べる条件（対象の規模、課金の単位、連携先、サポート、データの保管場所など）を先に決め、すべての製品を同じ条件で並べる。",
            "他社の機能や料金は、相手の公式ページで確かめた日付と出典リンクを付ける。確かめられないことは書かない。",
            "自社が向かない条件もはっきり書く（「100人未満ならA社の無料プランのほうが合う場合があります」など）。偏った比較は、読む人にも信用されません。",
            "乗り換えページには、移行できるデータ、移行の手順と期間、並行運用の期間、移行の支援が有料か無料かを書く。",
            "比較ページにも更新日を書き、自社や他社の料金改定のたびに見直す。",
          ],
          after: [
            "他社名を使うときは、事実の記述にとどめ、ロゴや画面の画像を無断で使わないでください。",
          ],
        },
        {
          heading: "連携・機能・セキュリティ・サポート：条件の質問に答えるページ",
          paragraphs: [
            "「〇〇と連携できる」「ISMSを取っている」「土日もサポートしている」といった条件は、AIが候補を絞るときに使われやすい事実です。機能一覧に1行あるだけだと、答えの材料になりにくいので、条件ごとにページか見出しを分けます。",
          ],
          list: [
            "連携先：連携できるサービス名、連携の方法（標準機能・API・CSV）、追加料金の有無。",
            "対応環境：ブラウザ、スマートフォンアプリの有無と対応OS、オフラインでの動き。",
            "セキュリティ：取得している認証は、認証の名前・対象範囲・登録番号や取得日まで。取っていない認証は書かない。データの保管場所（国・地域）。",
            "サポート：受付時間、窓口（電話・メール・チャット）、プランによる違い、導入支援の内容。",
            "契約と解約：解約の手続き、解約後のデータの扱い。",
          ],
        },
        {
          heading: "社外の情報：レビューサイトとプロフィールを自社サイトとそろえる",
          paragraphs: [
            "社名を入れた質問（「〇〇の評判は？」）では、ITreview・BOXIL・G2・Capterraなどのレビューサイト、プレスリリース、比較記事が出典に使われることがよくあります。自社では直せないページなので、次の2つに絞って手を入れます。",
          ],
          list: [
            "掲載情報を今の内容にする：製品の説明、料金、機能、会社情報を、自社サイトと同じ表記と数字にそろえる。各サイトの掲載ルールに沿って、運営元に更新を依頼する。",
            "レビューは正直に集める：日本では2023年10月1日からステルスマーケティングが景品表示法違反になり、事業者が第三者に依頼・指示して投稿させた口コミも事業者の広告に含まれるとされています（[消費者庁：ステルスマーケティング](" + SRC.caaStealth + ")）。謝礼をつけてレビューを頼む場合は、各レビューサイトのルールと表示のしかたを必ず確認してください。",
          ],
          after: [
            "レビューの点数を自社サイトに載せるときは、どのサイトの・いつ時点の・何件の評価かを書きます。自社で集めた評価を、出どころを示さずに構造化データの評価（aggregateRating）として出すのは避けてください。",
          ],
        },
        {
          heading: "AIがページを読めるか：クローラーとJavaScript",
          paragraphs: [
            "SaaSのサイトは、料金表や機能比較をJavaScriptで後から表示していることがあります。ブラウザで見えていても、HTMLを取得しただけでは中身が空のことがあります。料金や事例の本文は、最初に返すHTMLに入っているのが安全です。curl コマンドなどでページのHTMLを取得して、料金の数字や事例の本文が含まれているかを確かめてください。",
            "AIの検索用のクローラーをrobots.txtで止めていないかも確かめます。OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索の回答に表示されないと説明しています（[OpenAI のクローラー](" + SRC.openaiBots + ")）。学習用のGPTBotとは別のボットです。PerplexityもPerplexityBotとPerplexity-Userを分けて説明しています（[Perplexity のクローラー](" + SRC.perplexityBots + ")）。WAFやボット対策のサービスが、知らないうちにこれらを止めていることもあります。",
          ],
        },
        {
          heading: "構造化データ：会社はOrganization、製品はSoftwareApplicationかService",
          paragraphs: [
            "Googleは、AI Overviews・AI モードのために特別な構造化データやファイルは必要ないとしています。構造化データは、ページに見えている事実と一致させることが前提です（[AI 機能とウェブサイト](" + SRC.googleAiJa + ")）。そのうえで、BtoB・SaaSでは次の組み合わせが基本になります。",
          ],
          list: [
            "会社：Organization（またはCorporationなどの下位の型）。名前・URL・ロゴ・説明・連絡先。書き方は[会社概要ページのAI検索対策](/guide/company-profile-page-ai-search)。",
            "ソフトウェア：SoftwareApplication。schema.orgではCreativeWork（作品）の一種で、applicationCategory（種類）、operatingSystem（対応OS）、featureList（機能）、softwareVersion、offers（料金）などを持ちます。ブラウザで使うものには下位の型WebApplicationもあります（[schema.org SoftwareApplication](" + SRC.schemaSoftware + ")）。",
            "受託・コンサルティングなどのサービス：Service。provider（提供する会社）で会社とつなげます。",
            "よくある質問：FAQPageは、その質問と答えがページに表示されているページだけに入れます。",
          ],
          code: JSONLD,
          after: [
            "上の例は、Nurevo AEOでサービスに「ソフトウェア（SaaS・アプリ）です」と印を付けたときの出力の形です（値は架空）。提供元は会社のノードを指し、カテゴリがapplicationCategoryになり、価格と通貨はOfferになります。「1ユーザーあたり月額」のような課金の単位は、料金ページの本文に書いてください。",
            "Googleの検索結果に出るソフトウェアアプリのリッチリザルトには、評価やレビューなど別の要件があります。リッチリザルトを狙う場合は、[Google のソフトウェア アプリの構造化データ](" + SRC.googleSoftwareJa + ")の最新の要件を確かめてください。Nurevo AEOは、実際のレビューがない評価を作って出すことはしません。",
          ],
        },
        {
          heading: "llms.txt：料金・事例・比較ページへの入口にする",
          paragraphs: [
            "llms.txtは、サイトの要点と主なページへのリンクを1つのテキストにまとめるファイルです。効果について公式に説明しているAIはなく、Googleは必要ないとしています（詳しくは[llms.txtの書き方](/guide/llms-txt)）。置く場合、BtoB・SaaSでは料金・導入事例・比較・連携のページを確実に載せることが大事です。Nurevo AEOでサイトの種類を「BtoB・SaaS」にすると、次のような形で作られます（値は架空）。",
          ],
          code: LLMS_JA,
          after: [
            "Key facts の Pricing と Case studies は、設定画面の「料金ページ（BtoB）」「導入事例ページ（BtoB）」に入れたURLです。BtoB・SaaSのサイトでは営業時間は出しません。Pages には更新日の新しい固定ページと投稿30件が入るので、ブログが多いサイトでは比較ページが押し出されることがあります。その場合は、載せなくてよい記事に「このページをllms.txtに載せない」を付けるか、開発者向けの webmcp_canary_llms_txt_lines フィルターで行を足します。",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEOの場合）",
          paragraphs: [
            "WordPressのサイトなら、[Nurevo AEO（無料）](" + WP_ORG + ")で、会社と製品の情報を構造化データとllms.txtに出せます。次の順に進めます。",
          ],
          list: [
            "料金・導入事例・比較・連携のページの本文を、この記事の表に沿って先に整える（構造化データより先に本文）。",
            "初期設定ウィザード（または設定画面）でサイトの種類を「BtoB・SaaS」にする。会社はOrganizationとして出ます。業種の欄でCorporation、ProfessionalService、AccountingServiceなど合う型を選べばその型が使われ、BtoBに合わない型ならOrganizationになります。住所と営業時間は必須ではありません。",
            "サービスを登録する（最大20件）。名前、1文の説明、サービスページのURL、カテゴリ、価格と通貨を入れ、ソフトウェアなら「ソフトウェア（SaaS・アプリ）です」に印を付ける。印があればSoftwareApplication、なければServiceとして出ます。",
            "カテゴリには、買い手がAIに聞くときの言葉（「勤怠管理システム」「経費精算」など）を入れる。Nurevoの計測の質問は、このカテゴリから作られます。",
            "「料金ページ（BtoB）」「導入事例ページ（BtoB）」にURLを入れる。llms.txtの Key facts に載り、診断でも確認されます。",
            "よくある質問は、Nurevo FAQ ブロックか [nurevo_faq] ショートコードで質問を表示しているページにだけFAQPageとして出ます。料金ページの質問は、そのページ専用のFAQにします。",
            "Yoast SEO・Rank Math・All in One SEO・Slim SEOを使っている場合、Nurevoはそのプラグインの構造化データに足りない事実とサービスだけを足すので、会社の情報が二重になりません。SEO SIMPLE PACK、VK All in One Expansion Unitとも併用できます（0.9.1から）。",
            "「AEOスコア」の画面で診断する。BtoB・SaaSのサイトでは、サービスの説明、料金ページ、導入事例（またはよくある質問）、会社情報の4つがそろっているかが確認されます。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態を確認できます。",
            "BtoBのお客様のサイトを制作・保守している制作会社は、料金改定の日の更新手順（料金ページ・比較ページ・FAQ・レビューサイト）を保守の範囲に入れておくと、食い違いを防げます。月額で支援する制作会社向けに[パートナー制度](" + PARTNER + ")があります。",
          ],
        },
        {
          heading: "確かめ方：社名なしの質問と、社名ありの質問を分ける",
          paragraphs: [
            "BtoBでは、2種類の質問を分けて記録します。社名なしの質問は「知らない人の候補に入るか」、社名ありの質問は「知っている人に正しく伝わるか」を見るものです。同じ質問を同じAIに、日を変えて何回か聞き、1回の答えだけで判断しないでください。",
          ],
          table: {
            head: ["種類", "質問の例", "記録すること"],
            rows: [
              ["社名なし（カテゴリ）", "「中小企業向けの勤怠管理システムでおすすめは？」", "自社の名前が出たか、自社サイトが出典に入ったか、ほかに出た製品"],
              ["社名なし（条件）", "「給与ソフトと連携できる勤怠管理は？」", "条件が正しく当てはめられたか"],
              ["社名あり（料金）", "「勤怠クラウド・サンプルの料金は？」", "金額・課金の単位・税込税抜が今の料金ページと一致するか、出典はどこか"],
              ["社名あり（評判）", "「勤怠クラウド・サンプルの評判は？」", "どのレビューサイトや記事が出典か、古い情報が混ざっていないか"],
            ],
          },
          after: [
            "Nurevoの無料のAIチェック（サイトを接続したFree・Standardのサイトで月1回）は、社名を入れない質問を3つ、Perplexityに聞きます。Proの登場率の計測（ベータ版）は現在Perplexityが対象です（ChatGPTは設定され次第）。社名ありの質問は上の表で手で確かめます。",
            "サイトへの流入は、GA4で参照元を見ます。ChatGPTからのリンクには utm_source=chatgpt.com が付くことがあります（[OpenAI のよくある質問](" + SRC.openaiFaq + ")）。Search Consoleの生成AIのパフォーマンスレポートも使えます（[Google 検索セントラル ブログ](" + SRC.googleGenAiReport + ")）。BtoBは検討期間が長いので、問い合わせフォームに「何で知りましたか（AIの答えを含む）」の欄を置くと、数字に出ない影響も拾えます。測り方の全体は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
          ],
        },
        {
          heading: "BtoB・SaaSサイトのチェックリスト",
          list: [
            "製品ページの最初の文に「何を・誰に（業種・規模）・どう提供するか」がある。",
            "料金ページに、課金の単位・プランの違い・初期費用・最低契約・税込税抜・更新日がある（見積もり制なら決まり方と目安）。",
            "料金や事例の本文が、JavaScriptを実行しなくてもHTMLに入っている。",
            "導入事例に、業種・規模・部署・課題・使った機能・期間・結果の測り方と時点がある。",
            "比較ページは同じ条件で並べ、他社の情報に確認日と出典があり、自社が向かない条件も書いてある。",
            "連携・対応環境・セキュリティ・サポートが、条件ごとに見出しかページになっている。",
            "料金改定の日に、比較ページ・FAQ・古い記事・レビューサイトの掲載情報も直す手順がある。",
            "OAI-SearchBot・PerplexityBotなど検索用のクローラーをrobots.txtやWAFで止めていない。",
            "OrganizationとSoftwareApplication（またはService）の値が本文と一致し、作った評価を出していない。",
            "llms.txtに料金・導入事例・比較のページが載っている。",
            "社名なしと社名ありの質問を分けて、日を変えて記録している。",
          ],
        },
      ],
      faqs: [
        { q: "料金を公開していないと、AIの候補に入りませんか？", a: "公開していなくても候補に入ることはあります。ただ、料金の質問に答える材料がないと、AIは他のサイトの古い数字で答えたり「料金非公開」とだけ答えたりします。金額を出せない場合も、何で金額が決まるかと目安の下限を書くことをおすすめします。" },
        { q: "比較ページで他社の名前を出してもいいですか？", a: "事実を正確に書くなら、比較に他社名を使う会社は多くあります。相手の公式ページで確かめた日付と出典を付け、確かめられないことは書かず、ロゴや画面を無断で使わないでください。比較の表示に関する法令や業界のルールは、自社の状況に合わせて確認してください。" },
        { q: "SaaSの構造化データは、SoftwareApplicationとProductのどちらですか？", a: "schema.orgでは、ソフトウェアにはSoftwareApplication（ブラウザで使うものはWebApplication）が用意されています。Nurevo AEOは、ソフトウェアに印を付けたサービスをSoftwareApplicationとして出します。Googleのリッチリザルトを狙う場合は、Googleのドキュメントで要件を確認してください。" },
        { q: "レビューサイトの評価が低いと、AIに推薦されませんか？", a: "評価がAIの答えにどう使われるかについて、AI各社の公式の説明はありません。できることは、掲載情報を今の内容にそろえ、レビューを正直に集めることです。謝礼つきの依頼は、ステルスマーケティングの規制と各サイトのルールを確認してください。" },
        { q: "受託開発やコンサルティングの会社でも、この手順で同じですか？", a: "基本は同じです。製品の代わりにサービスごとのページ（対象・進め方・期間・費用の決まり方・事例）を作り、構造化データはServiceを使います。Nurevo AEOでは「ソフトウェア」の印を付けずにサービスを登録します。" },
        { q: "AIの答えで、自社の料金が古いまま出てきます。どうすればいいですか？", a: "答えの出典をたどり、自社サイトなら料金ページ以外に残っている古い数字（比較ページ、FAQ、古い記事）を直し、社外のサイトなら掲載元に更新を依頼します。AIの答えを直接書き換えることはできず、反映の時期も決まっていません。" },
        { q: "この手順で、AIのおすすめに必ず出ますか？", a: "保証はできません。AIの回答は日や聞き方で変わり、どの製品を挙げるかはAIが決めます。この手順は、AIが読む元の情報を正確にそろえ、選ばれるための材料を自社サイトに用意するためのものです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "自社サイトがAIにどう読まれているか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。WordPressなら、無料のプラグインで会社と製品の情報を構造化データとllms.txtに出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPressプラグインを無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。ITreview、BOXIL、G2、Capterra、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },
    en: {
      title: "B2B & SaaS AI Search: Pricing, Case Studies, Comparisons | Nurevo",
      description: "How B2B and SaaS buyers use AI to shortlist vendors, and the pages that answer them: pricing, case studies, comparisons. Field tables, schema, llms.txt, WordPress steps.",
      h1: "AI search for B2B and SaaS: make your pricing, case study and comparison pages readable to AI",
      lead: "B2B and SaaS buyers shortlist vendors by asking AI things like \"What is the best tool for X?\", \"How does A compare with B?\" and \"What does this usually cost?\". The core of the work is to have pages that answer those questions in text (pricing, case studies, comparisons and alternatives, integrations and security), with conditions and dates attached, and to keep review sites and outside profiles consistent with them. Structured data and llms.txt then restate the facts on those pages in a form machines can read.",
      intro: [
        "Written November 17, 2026 (JST). schema.org types were checked that day in schema-dts 2.1.0. Statements from Google, OpenAI and Perplexity come from their pages as read between October 31 and November 10, 2026 for earlier Nurevo guides. Examples of consumer rules come from Japan; check the rules where you operate.",
        "This guide is for companies that sell software (SaaS), outsourced work or consulting to other businesses, and for the agencies that build their sites. How to write the About page is covered in [AI search for your About page](/guide/company-profile-page-ai-search), and how to write blog posts in [how to write articles AI can cite](/guide/blog-articles-ai-citations). This guide covers the pages that answer \"which vendor should we choose?\". AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention you or rank you anywhere.",
      ],
      sections: [
        {
          heading: "What B2B buyers ask AI",
          paragraphs: [
            "A local business is found with \"business type + area\". A B2B vendor is found from what the buyer wants to get done and under which conditions. Many of these questions come before the buyer knows your name, so if your name is missing from the answer you never make the shortlist. In a survey run by the Japanese agency TaTap in November 2026, 62.2% of 135 executives who had looked for a vendor themselves said they asked a generative AI for recommended companies, and 27.4% said they dropped or deprioritised companies whose names did not appear ([TaTap](" + SRC.tatap + "), a small survey by a firm that sells this work).",
            "The questions fall into roughly six kinds, and each kind is answered by a different page.",
          ],
          table: {
            head: ["Kind of question", "Example", "Page that answers it", "Typical mistake in AI answers"],
            rows: [
              ["Category search", "\"Best time tracking tool?\" \"Name 3 leading time tracking systems\"", "Product page (what, for whom, what size)", "Wrong company size or industry, listed under the wrong category"],
              ["Filtering by condition", "\"Time tracking for 50 people that integrates with our payroll software?\"", "Integrations, features and requirements pages", "Says an integration exists when it does not, or the reverse"],
              ["Comparing", "\"A vs B?\" \"Compare time tracking systems\"", "Comparison page with selection criteria", "Compared on old features or old prices"],
              ["Price", "\"What does time tracking software usually cost?\"", "Pricing page", "Old prices, tax confusion, minimum seats missed"],
              ["Switching", "\"Alternatives to X?\"", "Migration / switching page", "Migration effort and data import left out"],
              ["Checking a name", "\"What do people say about X?\" \"How much is X?\"", "Customer stories, About page, review sites", "Old review-site data, or mixed up with a product of the same name"],
            ],
          },
          after: [
            "The questions Nurevo's measurement asks for B2B / SaaS sites follow these kinds too (\"What is the best tool for ...?\", \"Compare the main ...\", \"Which ... do you recommend for a small business?\", \"What is the typical price range for ...?\", \"Which ... have the most customer case studies?\", \"What is a good alternative if I want to switch ...?\"), all without your name. Questions with your name are checked by hand, as described below.",
          ],
        },
        {
          heading: "What the top articles claim, and how this guide treats it",
          paragraphs: [
            "We read 13 Japanese and English articles that rank for \"B2B SaaS AI search\" and similar queries. Almost all agree that comparison pages, case studies and review sites matter. Most of their numbers, though, either name no source or come from the author's own clients. This guide does not use numbers that cannot be checked.",
          ],
          table: {
            head: ["Common claim", "How strong the evidence is", "How this guide treats it"],
            rows: [
              ["\"AI visitors convert many times better than Google visitors\"", "Figures range from a few times to over 20 times between articles; the underlying studies often cannot be traced", "Not used. We show how to check it in your own GA4"],
              ["\"Seven in ten B2B buyers start research with AI\"", "No source, or just \"industry data\"", "Not used. Only surveys with a named source and sample size"],
              ["\"Comparison and alternatives pages get cited a lot\"", "Agency observations; no official statement", "Worth building because they match the questions AI is asked; nothing more"],
              ["\"SoftwareApplication or FAQ markup gets you into AI answers\"", "Articles say opposite things. Google says AI features need no special markup", "Treated as a restatement of the facts on the page"],
              ["\"More reviews on review sites means more recommendations\"", "Mostly studies that are not named", "Check that prices and features there are current and match your site, rather than chase counts"],
              ["\"Add llms.txt and AI will read you\"", "Google says no new AI file is needed; other AI companies have not said", "If you add it, use it as a way in to pricing and case study pages"],
            ],
          },
          after: [
            "What the top articles mostly lacked: concrete fields for pricing and case study pages, WordPress steps, and a way of measuring that separates unbranded from branded questions. That is where this guide spends its time.",
          ],
        },
        {
          heading: "Pricing page: give the inputs for a decision, even without every number",
          paragraphs: [
            "For \"How much does it cost?\" or \"How much is X?\", AI answers from your pricing page or, without one, from numbers on review sites and comparison articles. Current terms on your own page are safer than old numbers written by someone else. Even with quote-based pricing you can say what the price depends on.",
          ],
          table: {
            head: ["Field", "Example", "What happens without it"],
            rows: [
              ["Billing unit", "\"Per user per month\", \"per location\", \"usage-based, per 1,000 records\"", "Totals misread by a large factor"],
              ["Plan differences", "Plan names, included features and limits (users, retention) in a table", "Top-plan features described as included in every plan"],
              ["Setup fees and minimums", "Setup fee, minimum seats, minimum term, annual vs monthly billing", "Only the monthly price spreads, and the contract surprises people"],
              ["Tax", "One clear line above the table, such as \"All prices exclude tax\"", "Prices with and without tax compared side by side"],
              ["Free trial or free plan", "Length, what is included, whether billing starts automatically", "Reported simply as \"free\""],
              ["Add-ons", "Onboarding, extra storage, API access, premium support", "Necessary costs missing from the answer"],
              ["Quote-based pricing", "\"Pricing depends on X and Y. Plans start from about Z per month.\"", "Reported only as \"pricing not public\", and you drop off the list"],
              ["Last updated", "\"Prices revised November 1, 2026\" on the page", "No way to tell old from new prices"],
            ],
          },
          after: [
            "When you change prices, update the comparison page, the FAQ, old blog posts and your review-site listings on the same day as the pricing page. When your own pages disagree, AI picks one of them.",
            "Do not publish prices only as an image or a PDF. Use an HTML table or a labelled list.",
          ],
        },
        {
          heading: "Case study pages: match the conditions buyers search with",
          paragraphs: [
            "B2B questions carry conditions: \"Which time tracking tools do manufacturers use?\", \"Which ... have the most case studies?\". What matters in a case study is that these conditions are easy to find, more than that it reads well. Put the following fields in a table at the top of each story, then the narrative.",
          ],
          table: {
            head: ["Field", "Example"],
            rows: [
              ["Industry and size", "\"Food manufacturer, about 250 employees, 2 plants\""],
              ["Who uses it", "\"HR and the managers at each plant\""],
              ["Problem before", "\"Paper time cards tallied by hand at month end\""],
              ["Why they chose it, and the criteria", "\"Shift support and an integration with their existing payroll software\" (no need to name competitors)"],
              ["Features and integrations used", "\"Clock-in, shift planning, payroll export\""],
              ["Time to go live", "\"About 2 months from contract to production\""],
              ["Result, and how it was measured", "\"Monthly tally went from 3 days to half a day (HR work log, 6 months after launch)\": what, when, how measured"],
              ["Date and point in time", "\"Interviewed October 2026. Titles and figures as of the interview\""],
            ],
          },
          after: [
            "Publish only results the customer can stand behind, with the method and the date. Inflated figures get quoted by AI as they are, and are hard to correct later. Get written permission to show the customer's name, logo and quotes.",
            "While you have few stories, add an index page by industry and company size that links to each story. A page called \"Customer stories\" or \"Case studies\", linked from the home page, is easy for people and AI to find.",
          ],
        },
        {
          heading: "Comparison and switching pages: say when you are not the right fit",
          paragraphs: [
            "Asked \"A vs B?\", an AI with nothing to go on from your site answers from competitors' pages or comparison sites. Build a comparison page as material for deciding which product suits which company, not as a scoreboard.",
          ],
          list: [
            "Decide the criteria first (company size, billing unit, integrations, support, data location and so on) and compare every product on the same criteria.",
            "For competitors' features and prices, give the date you checked their official page and a link. Leave out anything you cannot check.",
            "Say plainly when you are not the right fit (\"Under 100 people, A's free plan may suit you better\"). A one-sided comparison is not trusted by readers either.",
            "On a switching page, state what data can be imported, the steps and time involved, how long to run both in parallel, and whether migration help is paid or free.",
            "Date the comparison page and review it whenever you or a competitor change prices.",
          ],
          after: [
            "When you name competitors, stick to statements of fact, and do not use their logos or screenshots without permission.",
          ],
        },
        {
          heading: "Integrations, requirements, security and support: answer the condition questions",
          paragraphs: [
            "Conditions such as \"integrates with X\", \"holds ISO/IEC 27001\" or \"support on weekends\" are facts AI tends to use when narrowing a list. A single line in a feature list is weak material, so give each condition its own page or heading.",
          ],
          list: [
            "Integrations: the services you connect to, how (built-in, API, CSV) and whether it costs extra.",
            "Requirements: browsers, whether there is a mobile app and for which OS, how it behaves offline.",
            "Security: for each certification you hold, its name, scope and registration number or date. Do not list ones you do not hold. Where data is stored (country or region).",
            "Support: hours, channels (phone, email, chat), differences by plan, what onboarding includes.",
            "Contract and cancellation: how to cancel and what happens to the data afterwards.",
          ],
        },
        {
          heading: "Outside sources: keep review sites and profiles in line with your site",
          paragraphs: [
            "For questions with your name (\"What do people say about X?\"), review sites such as G2, Capterra, ITreview and BOXIL, press releases and comparison articles are often used as sources. You cannot edit those pages, so focus on two things.",
          ],
          list: [
            "Keep the listing current: product description, prices, features and company facts written the same way and with the same numbers as your site. Ask each site's operator for updates under its own listing rules.",
            "Collect reviews honestly: in Japan, stealth marketing has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023, and reviews a business asks or instructs third parties to post count as that business's advertising ([Consumer Affairs Agency](" + SRC.caaStealth + ")). If you offer an incentive for reviews, check each review site's rules and how the incentive must be disclosed, and the rules where you operate.",
          ],
          after: [
            "When you show a review score on your site, say which site, as of when and from how many reviews. Do not publish ratings you collected yourself as an aggregateRating in structured data without saying where they come from.",
          ],
        },
        {
          heading: "Can AI read the page? Crawlers and JavaScript",
          paragraphs: [
            "SaaS sites sometimes render pricing tables or feature comparisons with JavaScript after the page loads. What you see in a browser may be missing from the HTML a crawler receives. It is safer to have the pricing and case study text in the HTML the server returns first. Fetch the page's HTML (with curl, for example) and check that the prices and the story text are there.",
            "Also check that robots.txt does not block the search crawlers of AI services. OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers ([OpenAI crawlers](" + SRC.openaiBots + ")); this is a different bot from GPTBot, which is for training. Perplexity also documents PerplexityBot and Perplexity-User separately ([Perplexity crawlers](" + SRC.perplexityBots + ")). A WAF or bot-protection service can block them without anyone noticing.",
          ],
        },
        {
          heading: "Structured data: Organization for the company, SoftwareApplication or Service for what you sell",
          paragraphs: [
            "Google says AI Overviews and AI Mode need no special structured data or files, and that structured data should match what is visible on the page ([AI features and your website](" + SRC.googleAi + ")). With that in mind, the usual combination for B2B and SaaS is:",
          ],
          list: [
            "The company: Organization (or a subtype such as Corporation), with name, URL, logo, description and contact. See [AI search for your About page](/guide/company-profile-page-ai-search).",
            "Software: SoftwareApplication. In schema.org it is a kind of CreativeWork, with applicationCategory, operatingSystem, featureList, softwareVersion and offers among its properties. Browser-based software also has the subtype WebApplication ([schema.org SoftwareApplication](" + SRC.schemaSoftware + ")).",
            "Services such as outsourced work or consulting: Service, linked to the company through provider.",
            "FAQ: FAQPage only on a page that shows those questions and answers.",
          ],
          code: JSONLD_EN,
          after: [
            "The example is the shape Nurevo AEO publishes when a service is marked \"This is software (SaaS or an app)\" (values are made up). The provider points at the company node, the category becomes applicationCategory, and price and currency become an Offer. State the billing unit, such as \"per user per month\", in the text of the pricing page.",
            "Google's software app rich result in search results has its own requirements, such as ratings or reviews. If you want that rich result, check the current requirements in [Google's software app structured data](" + SRC.googleSoftware + ") documentation. Nurevo AEO never publishes a rating that has no real reviews behind it.",
          ],
        },
        {
          heading: "llms.txt: a way in to pricing, case study and comparison pages",
          paragraphs: [
            "llms.txt is a single text file with a summary of the site and links to its main pages. No AI company has officially described an effect, and Google says it is not needed (see [how to write llms.txt](/guide/llms-txt)). If you add one, for B2B and SaaS the point is to make sure it lists your pricing, case study, comparison and integration pages. With the site type set to \"B2B / SaaS\", Nurevo AEO builds it like this (values are made up):",
          ],
          code: LLMS_EN,
          after: [
            "Pricing and Case studies under Key facts are the URLs entered in Settings as \"Pricing page (B2B)\" and \"Case studies page (B2B)\". B2B / SaaS sites do not publish opening hours. Pages lists the 30 most recently updated pages and posts, so on a site with a busy blog the comparison page can be pushed out. In that case, mark posts that do not need to be there with \"leave this page out of llms.txt\", or add lines with the developer filter webmcp_canary_llms_txt_lines.",
          ],
        },
        {
          heading: "Steps on WordPress (with Nurevo AEO)",
          paragraphs: [
            "On WordPress, [Nurevo AEO (free)](" + WP_ORG + ") publishes your company and product facts as structured data and in llms.txt. Work in this order.",
          ],
          list: [
            "Fix the text of the pricing, case study, comparison and integration pages first, following the tables above. Text before structured data.",
            "In the setup wizard (or Settings), set the site type to \"B2B / SaaS\". The company is published as an Organization. If you choose a fitting type in the business type field, such as Corporation, ProfessionalService or AccountingService, that type is used; a type that does not fit a B2B site falls back to Organization. Address and opening hours are not required.",
            "Add your services (up to 20): name, a one-sentence description, the service page URL, a category, price and currency. Tick \"This is software (SaaS or an app)\" for software. Ticked entries are published as SoftwareApplication, the rest as Service.",
            "For the category, use the words buyers use when they ask AI (\"time tracking software\", \"expense management\"). Nurevo's measurement questions are built from this category.",
            "Enter the \"Pricing page (B2B)\" and \"Case studies page (B2B)\" URLs. They go into Key facts in llms.txt and are checked by the diagnosis.",
            "FAQ entries are published as FAQPage only on pages that show them with the Nurevo FAQ block or the [nurevo_faq] shortcode. Give the pricing page its own FAQ for pricing questions.",
            "With Yoast SEO, Rank Math, All in One SEO or Slim SEO, Nurevo adds only the missing facts and services into that plugin's structured data, so the company is not described twice. It also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit (from 0.9.1).",
            "Run the diagnosis on the AEO score screen. For B2B / SaaS sites it checks four things: service descriptions, a pricing page, case studies (or an FAQ), and company identity.",
          ],
          after: [
            "On sites not built with WordPress the checks are the same. Enter your URL in the [free check](/check), no sign-up needed, to see the state of your structured data, llms.txt and AI crawler access.",
            "Agencies that build or maintain sites for B2B clients can put the price-change routine (pricing page, comparison pages, FAQ, review-site listings) into the maintenance scope so the facts do not drift apart. Agencies that support clients monthly can join the [partner program](" + PARTNER + ").",
          ],
        },
        {
          heading: "How to check: separate unbranded and branded questions",
          paragraphs: [
            "For B2B, record two kinds of question separately. Unbranded questions tell you whether you make the shortlist of people who do not know you. Branded questions tell you whether people who do know you get the right facts. Ask the same question of the same AI on different days, and never judge from a single answer.",
          ],
          table: {
            head: ["Kind", "Example", "What to record"],
            rows: [
              ["Unbranded (category)", "\"Which time tracking software do you recommend for a small business?\"", "Whether you were named, whether your site was cited, which other products appeared"],
              ["Unbranded (condition)", "\"Time tracking that integrates with our payroll software?\"", "Whether the condition was applied correctly"],
              ["Branded (price)", "\"How much is Example Timesheets?\"", "Whether price, billing unit and tax match your pricing page today, and what the source was"],
              ["Branded (reputation)", "\"What do people say about Example Timesheets?\"", "Which review site or article was the source, and whether old information crept in"],
            ],
          },
          after: [
            "Nurevo's free AI check (once a month, for connected Free and Standard sites) asks Perplexity three unbranded questions. Pro's visibility measurement (beta) currently covers Perplexity, with ChatGPT to follow once it is set up. Check branded questions by hand with the table above.",
            "For visits, look at the source in GA4. Links from ChatGPT can carry utm_source=chatgpt.com ([OpenAI publishers FAQ](" + SRC.openaiFaq + ")). Search Console's generative AI performance report is another view ([Google Search Central blog](" + SRC.googleGenAiReport + ")). B2B buying takes time, so a \"How did you hear about us (including AI answers)?\" field on the contact form catches influence that never shows up as a click. The full method is in [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "B2B and SaaS site checklist",
          list: [
            "The first sentence of the product page says what it is, for whom (industry and size) and how it is delivered.",
            "The pricing page states the billing unit, plan differences, setup fee, minimums, tax and a last-updated date (or, for quotes, what the price depends on and a starting point).",
            "Pricing and case study text is in the HTML without running JavaScript.",
            "Case studies give industry, size, team, problem, features used, time to go live, and how and when results were measured.",
            "Comparison pages use the same criteria for every product, date and source competitor facts, and say when you are not the right fit.",
            "Integrations, requirements, security and support each have their own heading or page.",
            "On the day prices change, there is a routine to update comparison pages, the FAQ, old posts and review-site listings too.",
            "robots.txt and the WAF do not block search crawlers such as OAI-SearchBot and PerplexityBot.",
            "Organization and SoftwareApplication (or Service) values match the page text, and no made-up rating is published.",
            "llms.txt lists the pricing, case study and comparison pages.",
            "Unbranded and branded questions are recorded separately, on different days.",
          ],
        },
      ],
      faqs: [
        { q: "If we do not publish prices, will AI leave us out?", a: "You can still be mentioned. But without material for pricing questions, AI answers from old numbers on other sites or just says pricing is not public. Even if you cannot show amounts, say what the price depends on and give a starting point." },
        { q: "Can we name competitors on a comparison page?", a: "Many companies do, as long as the facts are accurate. Give the date you checked each competitor's official page and a link, leave out what you cannot check, and do not use their logos or screenshots without permission. Check the laws and industry rules on comparative advertising that apply to you." },
        { q: "Should SaaS use SoftwareApplication or Product markup?", a: "schema.org provides SoftwareApplication for software (and WebApplication for browser-based software). Nurevo AEO publishes services marked as software as SoftwareApplication. If you want Google's rich result, check the requirements in Google's documentation." },
        { q: "Will a low score on review sites keep AI from recommending us?", a: "No AI company has officially explained how review scores are used in answers. What you can do is keep listings current and collect reviews honestly. If you offer incentives, check the stealth marketing rules where you operate and each site's rules." },
        { q: "Does this apply to development agencies and consultancies too?", a: "The basics are the same. Instead of a product page, write a page per service (who it is for, how it works, how long it takes, how the price is set, case studies) and use Service markup. In Nurevo AEO, add the services without ticking the software box." },
        { q: "AI keeps quoting our old prices. What can we do?", a: "Trace the sources in the answer. On your own site, fix old numbers outside the pricing page (comparison pages, FAQ, old posts); on other sites, ask the publisher to update. You cannot edit AI answers directly, and there is no set time for changes to show." },
        { q: "Will these steps get us into AI recommendations?", a: "There is no guarantee. AI answers change with the day and the wording, and the AI decides which products to name. These steps make the facts AI reads accurate and give it material on your own site to choose you from." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads your site",
        body: "The free check needs no sign-up: enter a URL to see the state of your structured data, llms.txt and AI crawler access. On WordPress, the free plugin publishes your company and product facts as structured data and in llms.txt.",
        label: "Check your AI readiness for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. G2, Capterra, ITreview, BOXIL, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
