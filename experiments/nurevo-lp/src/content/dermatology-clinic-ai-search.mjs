// Content page: AI search (AEO) for dermatology and cosmetic dermatology
// clinics (皮膚科・美容皮膚科). Industry page. Primary care has its own page
// (medical-clinic-ai-search) and dentists theirs (dental-clinic-ai-search);
// this one covers what is specific to skin clinics: telling insured and
// self-pay (自由診療) care apart, publishing self-pay fees with the main risks
// and side effects on the same page, and the advertising limits on
// testimonials and before/after photos.
//
// Written 2026-11-16 (JST). Every claim about Nurevo AEO comes from the
// plugin itself (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// - setup wizard "Clinic or dental" card = MedicalBusiness (includes/setup-wizard.php);
//   the business type setting accepts any schema.org type name
//   (webmcp_canary_business_schema_type), so "Dermatology" can be entered.
// - services carry name, description, duration and price/currency and are
//   published as Service with an Offer (nurevo-webmcp.php, ~line 200-260).
// - the business node passes through the filter webmcp_canary_business_node
//   ($org, $settings) and llms.txt through webmcp_canary_llms_txt_lines.
// - per-page settings (leave out of llms.txt, no Nurevo schema, page-only FAQ),
//   readme 0.9.1/0.9.2. The plugin does not output medicalSpecialty itself.
//
// Outside facts, checked 2026-11-16:
// - MHLW 「医療広告等ガイドラインに関するQ&A」 (https://www.mhlw.go.jp/content/001683595.pdf,
//   first written 2018-08, latest revision listed 令和8年3月): A6-10 the
//   contact point must be a real enquiry line (an appointments-only number or
//   auto-reply does not count); A6-11 required items must be easy to see (no
//   tiny or background-coloured text); A6-12 self-pay sites must give the
//   usual treatment content and fees and the main risks and side effects - a
//   couple of generic drawbacks is not enough; A1-18 / A2-9 testimonials on
//   treatment content or effect may not be published; A2-8 / A3-14 before-only
//   or after-only photos are treatment-effect claims; A2-11 independent
//   personal SNS / review sites not paid or requested by the clinic are not
//   advertising; A2-14 off-label use is treated like unapproved drugs;
//   A3-9 / A3-18 approved-product self-pay treatment must state it is
//   self-pay and its standard fee. The four 限定解除 conditions as a full list
//   were NOT read from the guideline body in this run: the page does not list
//   them verbatim, it names only the items confirmed above.
// - 国民生活センター 美容医療 (https://www.kokusen.go.jp/soudan_topics/data/biyo.html,
//   updated 2026-07-31, PIO-NET as of 2026-05-31): 2023 6,281 / 2024 10,744 /
//   2025 7,944.
// - MHLW 美容医療の適切な実施に関する検討会 報告書 (令和6年11月22日,
//   https://www.mhlw.go.jp/content/11201250/001337817.pdf): annual reporting of
//   safety measures to prefectures with publication of items such as contact
//   points; stronger net patrol of medical advertising; clinics should set up a
//   contact for post-treatment problems.
// - schema.org via schema-dts 2.1.0 (installed and read 2026-11-16; the
//   schema.org pages themselves could not be fetched from this run):
//   Dermatology and PlasticSurgery are both MedicalBusiness subtypes and
//   MedicalSpecialty values; availableService on MedicalClinic/Physician;
//   isAcceptingNewPatients on MedicalOrganization.
// - Google "AI features and your website" and LocalBusiness docs: as checked
//   for dental-clinic-ai-search on 2026-10-29 (not re-fetched in this run).
// - MGMA article 2026-05-20 (Nathan Woo, founder of Halcy): 200 independent
//   practices, none named by ChatGPT in the author's May 2026 sample.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  mhlwQa: "https://www.mhlw.go.jp/content/001683595.pdf",
  mhlwCases: "https://www.mhlw.go.jp/content/10800000/001232587.pdf",
  mhlwBiyo: "https://www.mhlw.go.jp/content/11201250/001337817.pdf",
  kokusen: "https://www.kokusen.go.jp/soudan_topics/data/biyo.html",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  dermatology: "https://schema.org/Dermatology",
  medicalSpecialty: "https://schema.org/medicalSpecialty",
  mgma: "https://www.mgma.com/articles/why-chatgpt-has-probably-never-named-your-practice",
};

const FILTER_CODE = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // 本文に書いている診療分野だけを足す（例：一般皮膚科と美容皮膚科）
    $org['medicalSpecialty'] = array('Dermatology', 'PlasticSurgery');
    return $org;
}, 10, 2);`;

const FILTER_CODE_EN = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // Add only the specialties your pages actually describe
    $org['medicalSpecialty'] = array('Dermatology', 'PlasticSurgery');
    return $org;
}, 10, 2);`;

export default {
  slug: "dermatology-clinic-ai-search",
  targetQueries: [
    "AI search optimization for dermatology clinics",
    "dermatologist ChatGPT visibility",
    "Dermatology schema markup",
    "皮膚科 AI検索対策",
    "美容皮膚科 LLMO 対策",
    "美容クリニック ChatGPT 表示",
  ],
  related: ["medical-clinic-ai-search", "dental-clinic-ai-search", "hair-salon-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "皮膚科・美容皮膚科のAI検索対策：保険と自費、料金とリスクの書き方 | Nurevo",
      description: "皮膚科・美容皮膚科のAI検索対策は、保険診療と自費診療を分けて書き、自費の施術は料金・主なリスクと副作用を同じページに書くこと。医療広告のQ&A、構造化データ、WordPressの手順を解説。",
      h1: "皮膚科・美容皮膚科のAI検索対策：保険診療と自費診療を分け、料金とリスクをAIに正しく読ませる手順",
      lead: "皮膚科・美容皮膚科のAI検索対策でいちばん効くのは、「その治療は保険がきくのか、自費ならいくらで、どんなリスクがあるのか」を、施術ごとのページに文字で書くことです。AIは「◯◯駅の近くでニキビを保険で診てもらえる皮膚科」「シミ取りレーザーの料金とダウンタイム」のような条件つきの質問に答えるとき、条件が読み取れるページを使います。そのうえで、医療広告のルール（体験談・治療前後の写真の制限、自費診療の料金とリスクの表示）を守り、同じ事実を構造化データ・llms.txt・Googleビジネスプロフィールにそろえます。",
      intro: [
        "作成日：2026年11月16日（JST）。厚生労働省の「医療広告等ガイドラインに関するQ&A」、美容医療の検討会の報告書、国民生活センターの相談件数、schema.orgの型（schema-dts 2.1.0の型定義）は同日に確認しました。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがクリニックの事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。この記事は法的な助言ではありません。個別の表現は、管轄の保健所などで確認してください。",
      ],
      sections: [
        {
          heading: "皮膚科・美容皮膚科で、患者さんがAIに聞くこと",
          paragraphs: [
            "皮膚科の質問は、大きく2つに分かれます。1つは一般皮膚科の質問で、「子どものアトピーを診てもらえる皮膚科」「土曜に開いている皮膚科」「水虫は保険で治療できる？」のように、症状・対象・時間・保険の有無が入ります。もう1つは美容皮膚科の質問で、「シミ取りレーザーの料金の相場」「医療脱毛は何回で終わる？」「ダウンタイムが短いニキビ跡の治療」のように、料金・回数・ダウンタイム・リスクが入ります。",
            "どちらも、AIが答えに使えるのは「条件が文字で書いてあるページ」です。料金表が画像だけ、保険か自費かが書かれていない、「カウンセリングでご案内します」だけで料金の目安がない、というページは、条件つきの質問の出典になりにくくなります。",
            `美容医療は相談の多い分野でもあります。国民生活センターに寄せられた美容医療の相談は、2023年が6,281件、2024年が10,744件、2025年が7,944件でした（PIO-NETの件数、2026年5月31日現在、2026年7月31日更新）。[国民生活センター：美容医療](${SRC.kokusen})。患者さんは料金やリスクを事前に確かめたいと考えており、AIにもそれを聞きます。正確な料金とリスクを書いておくことは、AI対策である前に、患者さんへの説明そのものです。`,
          ],
        },
        {
          heading: "上位の記事で抜けていたこと",
          paragraphs: [
            "「クリニック AI検索対策」「美容クリニック LLMO」などで上位に出る記事を日本語・英語で読むと、多くは「診療科・住所・診療時間を正しく」「構造化データを入れる」「口コミを増やす」で終わっていました。英語の記事の中には、出典のない「レビュー50件以上」のような目安を挙げるものもあります。",
            "皮膚科・美容皮膚科で特に大切な次の4点は、ほとんど扱われていませんでした。この記事ではこれを中心に書きます。",
          ],
          list: [
            "保険診療と自費診療を、ページ上でどう書き分けるか。",
            "自費の施術で、料金と主なリスク・副作用をどこにどう書くか（医療広告のルールとの関係）。",
            "「口コミを増やす」「症例写真を載せる」という一般的な助言が、日本の医療広告のルールとぶつかる点。",
            "WordPressでの具体的な設定（型・サービスと料金・ページ専用のFAQ）と、出ているかの確かめ方。",
          ],
        },
        {
          heading: "保険診療と自費診療を分けて書く",
          paragraphs: [
            "AIに誤解されやすいのは、同じ「ニキビ治療」「シミ治療」でも、保険でできるものと自費のものが混ざっている場合です。施術や症状のページで、保険か自費かを1行目近くに書いてください。厚生労働省のQ&Aでも、承認された機器や薬を使う自費の治療（例：インプラント、ホワイトニング）について、自由診療であることと標準的な費用を書くよう示されています。[厚生労働省：医療広告等ガイドラインに関するQ&A（PDF）](" + SRC.mhlwQa + ")",
          ],
          table: {
            head: ["ページ", "書いておくこと", "AIに誤解されやすい書き方"],
            rows: [
              ["症状のページ（ニキビ・アトピー・湿疹・水虫・いぼなど）", "保険で行う診療の範囲、自費の選択肢があればその名前と自費である旨、受診の目安", "保険と自費の治療を区別せずに並べる"],
              ["施術のページ（レーザー・ピーリング・注入・脱毛など）", "自費であること、1回あたり・コースの料金（税込か税別か）、回数の目安、主なリスク・副作用、ダウンタイム", "「料金はカウンセリングで」だけ"],
              ["料金表のページ", "保険と自費を分けた表、更新日、初診料・再診料・薬代の扱い", "画像だけの料金表、キャンペーン価格だけ"],
              ["診療案内（トップ・アクセス）", "一般皮膚科と美容皮膚科の診療時間・予約方法が違うならそれぞれ、対象年齢", "美容の予約時間を一般の診療時間として書く"],
              ["医師紹介", "医師の名前、専門分野、資格（広告できる範囲で）", "比較や最上級の言葉（下の節を参照）"],
            ],
            caption: "表は、皮膚科・美容皮膚科で聞かれやすい質問と、上位の記事に足りなかった点をもとにしています。",
          },
          after: [
            "一般皮膚科と美容皮膚科で受付時間や予約の仕方が違う場合は、AIが混同しないよう、診療時間の表を分けて書きます。予約制か、予約なしで受診できるかも、それぞれに書きます。",
          ],
        },
        {
          heading: "自費の施術ページ：料金と主なリスク・副作用を同じページに",
          paragraphs: [
            "日本の医療広告のルールでは、患者さんが自ら調べて見るウェブサイトであれば、一定の条件を満たすことで、通常は広告できない内容も詳しく説明できます（「限定解除」）。厚生労働省のQ&Aでは、自由診療の場合の条件として、通常必要とされる治療の内容・費用と、主なリスク・副作用に関する事項を書くことが挙げられ、一般的な短所を1〜2個並べるだけでは足りないとされています（Q6-12）。また、問い合わせ先が書かれていることも条件の1つで、予約専用の番号や自動応答だけの番号では満たさないとされています（Q6-10）。条件の項目は見やすく書く必要があり、極端に小さい文字や背景と同じ色の文字は認められません（Q6-11）。[厚生労働省：Q&A（PDF）](" + SRC.mhlwQa + ")",
            "これはAI検索対策とも同じ方向です。AIが「料金」「ダウンタイム」「リスク」を聞かれたときに使えるのは、それが本文に書いてあるページです。施術ページの型は、次の順番にすると読みやすくなります。",
          ],
          list: [
            "施術の名前と、自費診療であること。",
            "どんな悩みに対して行うか（効果を約束する書き方はしない）。",
            "施術の流れ、1回の時間、通常必要な回数の目安と間隔。",
            "料金（1回・コース、税込か税別か、麻酔・薬・再診など別にかかるもの）。",
            "主なリスク・副作用と、ダウンタイムの目安。",
            "受けられない方・注意が必要な方。",
            "問い合わせ先（相談に答える窓口の電話番号や受付時間）と、施術後に困ったときの連絡先。",
            "ページの最終更新日。",
          ],
          after: [
            "承認されていない医薬品・機器を使う施術や、承認された薬を承認外の目的で使う施術には、追加の説明が必要です。Q&Aでは、承認外の使い方も未承認医薬品と同じ扱いになるとされています（Q2-14）。書くべき項目は医療広告ガイドライン本体で確かめてください。",
            `美容医療については、厚生労働省の検討会の報告書（2024年11月22日）が、医療広告のネットパトロールの強化や、施術後のトラブルの相談窓口を設けて患者さんに伝えることなどを求めています。[厚生労働省：美容医療の適切な実施に関する検討会 報告書（PDF）](${SRC.mhlwBiyo})。施術後の連絡先をページに書いておくことは、この流れにも合っています。`,
          ],
        },
        {
          heading: "口コミ・症例写真：一般的な「AI対策」の助言とぶつかるところ",
          paragraphs: [
            "AI検索対策の記事では「口コミを増やす」「症例写真で実績を見せる」がよく勧められます。医療機関では、ここに注意が必要です。",
          ],
          table: {
            head: ["よくある助言", "医療機関での扱い（厚生労働省のQ&A）", "代わりにできること"],
            rows: [
              ["患者さんの声をサイトに載せる", "治療の内容や効果についての体験談は掲載できない（Q1-18、Q2-9）", "施術の流れ・料金・リスクなど、事実の説明を詳しくする"],
              ["口コミをFAQや構造化データのレビューに入れる", "同上。クリニックが費用を出したり、依頼・編集したりした口コミも対象になりうる", "FAQは「保険はきくか」「何回かかるか」など、事実の質問と答えにする"],
              ["ビフォーアフター写真で効果を見せる", "術前だけ・術後だけの写真も、治療効果の表現として広告できない（Q2-8、Q3-14）", "写真を使う場合の条件は、ガイドラインと事例解説書で確認する"],
              ["「地域No.1」「痛くない」「必ずきれいに」", "虚偽・誇大・比較優良の表示は禁止されている例として扱われる", "数字や事実で書ける範囲だけを書く"],
            ],
          },
          after: [
            `一方で、クリニックが費用を出したり依頼したりしていない、患者さん個人のSNSや第三者の口コミサイトの投稿は、広告にあたらないとされています（Q2-11）。AIがそれを読むかどうかはクリニックが決められないので、自院のサイトでは事実を正確に書くことに集中するのが確実です。事例は[事例解説書（PDF）](${SRC.mhlwCases})にもまとまっています。`,
          ],
        },
        {
          heading: "構造化データ：Dermatologyの型と、施術ごとのサービス",
          paragraphs: [
            "schema.orgには、皮膚科を表す型があります（2026年11月16日にschema-dts 2.1.0の型定義で確認）。",
          ],
          table: {
            head: ["型・プロパティ", "意味", "皮膚科・美容皮膚科での使い方"],
            rows: [
              [`[Dermatology](${SRC.dermatology})`, "皮膚の病気の診断・治療を扱う分野。MedicalBusiness（医療のビジネス）の一種で、LocalBusinessの一種", "皮膚科の医院・クリニックの型に。住所・電話番号・営業時間をそのまま持てる"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "診療の分野。値にDermatologyやPlasticSurgery（形成・美容の分野）がある", "一般皮膚科と美容皮膚科の両方を行うなら、本文に書いている分野だけを入れる"],
              ["Service と offers", "提供するサービスと、その料金", "自費の施術を1つずつ登録し、本文と同じ料金を入れる"],
              ["openingHoursSpecification", "曜日ごとの営業時間", "一般と美容で時間が違うなら、本文の表を正とし、構造化データは代表の時間にする"],
              ["isAcceptingNewPatients", "新しい患者を受け付けているか（MedicalOrganizationのプロパティ）", "新規の受け付けを止めている時期があるときに"],
            ],
          },
          after: [
            `Googleは、AIによる概要などのために特別な構造化データは不要で、構造化データはページに見えている内容と一致させるよう案内しています。[Google：AI features and your website](${SRC.googleAi})／[ローカルビジネスの構造化データ](${SRC.googleLocal})。料金を構造化データにだけ書く、本文と違う料金を入れる、ということは避けてください。`,
          ],
        },
        {
          heading: "WordPressの皮膚科サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「クリニック・歯科」を選びます（型はMedicalBusinessになります）。そのあと設定画面の「業種（schema.org型）」欄を Dermatology に変えます。この欄にはschema.orgの型名をそのまま入れられます。",
            "クリニック名・住所・電話番号・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "営業時間は「月〜金 9:00-12:00 15:00-18:00 / 土 9:00-13:00」のように曜日と時刻だけを書きます。一般と美容で時間が違う場合や、祝日・最終受付などの条件は、本文の表に書きます。",
            "設定画面のサービスに、自費の施術を1つずつ登録します。名前・説明・所要時間・料金・通貨を入れると、料金つきのサービス（Service と Offer）として出力されます。料金は本文と同じ値にし、本文を変えたら同時に直します。",
            "各施術ページの編集画面のサイドバーで、そのページだけのFAQ（「保険はききますか」「何回くらい必要ですか」「ダウンタイムはどのくらいですか」）を入れます。体験談や効果を約束する答えは入れません。キャンペーンページなど載せたくないページは「このページをllms.txtに載せない」にします。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
        },
        {
          heading: "診療分野（medicalSpecialty）を足したいとき",
          paragraphs: [
            "Nurevo AEOは medicalSpecialty を自動では出しません。出したい場合は、テーマの functions.php か小さなプラグインで、事業の構造化データを変えるフィルター（webmcp_canary_business_node）を使います。本文に書いている分野だけにしてください。",
          ],
          code: FILTER_CODE,
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "症状・施術のページごとに、保険診療か自費診療かが書かれている。",
            "自費の施術ページに、料金（税込か税別か・別にかかるもの）、回数の目安、主なリスク・副作用、ダウンタイムがある。",
            "相談に答える問い合わせ先が、予約専用ではない形で、見やすく書かれている。",
            "料金表が画像だけでなく文字で書かれ、更新日がある。",
            "一般皮膚科と美容皮膚科で診療時間・予約方法が違う場合、それぞれ書かれている。",
            "体験談・治療前後の写真・最上級や比較の言葉が、本文・FAQ・構造化データに入っていない。",
            "未承認の医薬品・機器や承認外の使い方をする施術に、ガイドラインで求められる説明がある。",
            "構造化データのサービスの料金と、本文の料金が一致している。",
            "名前・住所・電話番号・診療時間が、構造化データ・Googleビジネスプロフィール・医療情報ネットと一致している。",
            "llms.txtに、診療案内・料金表・主な施術・アクセスのページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、患者さんが聞きそうな質問を「地域×症状×保険」「地域×施術×料金」「施術×ダウンタイム」の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げます。クリニックが名前やURLで出るか、保険か自費か・料金・リスクが正しく書かれているかを記録します。料金を間違えて答えられていたら、料金表と施術ページの書き方、古いキャンペーンページが残っていないかを見直します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            `米国の医療経営団体MGMAに掲載された分析（2026年5月、AI検索サービス会社の創業者による寄稿）では、独立系の診療所200件のうち、ChatGPTで名前が挙がったところはありませんでした。[MGMA](${SRC.mgma})。国や条件は違いますが、実際に質問して確かめることが出発点です。`,
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（クリニック名は含めません）をPerplexityに投げ、回答にクリニックの名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答にクリニックが出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "皮膚科のAI検索対策は、何から始めればいいですか？", a: "症状と施術のページごとに、保険診療か自費診療かを書くことからです。次に自費の施術ページに料金・回数の目安・主なリスクと副作用・ダウンタイムを書き、名前・住所・電話番号・診療時間を構造化データ・Googleビジネスプロフィールとそろえます。" },
        { q: "美容皮膚科の料金は、サイトに載せたほうがいいですか？", a: "はい。AIは料金を聞かれたとき、料金が本文に書いてあるページを使います。厚生労働省のQ&Aでも、自費診療を詳しく説明するウェブサイトでは、通常必要な治療の内容・費用と主なリスク・副作用を書くことが条件の1つとされています。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgのDermatologyが皮膚科を表す型で、MedicalBusinessとLocalBusinessの一種です。美容皮膚科も行う場合は、medicalSpecialtyにDermatologyとPlasticSurgeryを入れる方法があります。型より、値が本文と一致していることが大切です。" },
        { q: "症例写真（ビフォーアフター）を載せると、AIに選ばれやすくなりますか？", a: "AIへの効果は確かめられていません。日本の医療広告のルールでは、治療前後の写真は治療効果の表現として扱われ、制限があります。載せる場合の条件は、医療広告ガイドラインと事例解説書、管轄の保健所で確認してください。" },
        { q: "口コミサイトの評価が低いと、AIに出なくなりますか？", a: "AIがどの情報をどれだけ使うかは公表されておらず、断定はできません。クリニックが依頼していない第三者の口コミは広告にあたりませんが、クリニックが費用を出したり依頼したりした口コミを自院のサイトに載せることはできません。自院のサイトでは事実を正確に書くことに集中してください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・診療時間・サービスと料金・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTにクリニックが必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIがクリニックの事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが皮膚科のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的・医学的な助言ではありません。",
    },
    en: {
      title: "AI Search for Dermatology Clinics: Fees, Risks, Schema | Nurevo",
      description: "AEO for dermatology and cosmetic skin clinics: separate insured from self-pay care, publish fees with the main risks on each treatment page, and match your schema.",
      h1: "AI search for dermatology and cosmetic skin clinics: how to get AI to read insured vs self-pay care, fees and risks correctly",
      lead: "The single most effective thing a dermatology or cosmetic skin clinic can do for AI search is to state, in text on each treatment page, whether the treatment is covered by insurance, what it costs if it is not, and what the main risks and downtime are. When AI answers a question with conditions in it — \"a dermatologist near the station who treats acne on insurance\", \"how much does laser spot removal cost and how long is the downtime\" — it relies on pages where those conditions can be read. Then you follow your medical advertising rules (limits on testimonials and before/after photos, fee and risk disclosure for self-pay care) and publish the same facts in structured data, llms.txt and your Google Business Profile.",
      intro: [
        "Written November 16, 2026 (JST). The Japanese Ministry of Health, Labour and Welfare's Q&A on its medical advertising guidelines, its expert panel report on cosmetic medicine, the National Consumer Affairs Center figures and schema.org's types (as defined in schema-dts 2.1.0) were checked that day. The rules quoted are Japan's; check the rules where you practise.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your clinic's facts readable to AI. They do not guarantee that an AI will mention your clinic or rank it anywhere. This article is not legal advice.",
      ],
      sections: [
        {
          heading: "What patients ask AI about skin clinics",
          paragraphs: [
            "Dermatology questions fall into two groups. General dermatology questions carry a symptom, a patient, a time and the insurance question: \"a dermatologist who sees children with eczema\", \"a skin clinic open on Saturday\", \"is athlete's foot treatment covered by insurance?\". Cosmetic questions carry price, number of sessions, downtime and risk: \"typical price of laser spot removal\", \"how many sessions does medical hair removal take?\", \"acne scar treatment with short downtime\".",
            "In both cases, AI can only use a page where those conditions are written down. A price list that exists only as an image, a treatment page that never says whether it is insured or self-pay, or a page that only says \"we will explain fees at your consultation\" gives AI nothing to cite for a question with conditions in it.",
            `Cosmetic medicine also draws a lot of complaints. Japan's National Consumer Affairs Center recorded 6,281 consultations about cosmetic medicine in 2023, 10,744 in 2024 and 7,944 in 2025 (PIO-NET figures as of May 31, 2026, page updated July 31, 2026). [National Consumer Affairs Center: cosmetic medicine (Japanese)](${SRC.kokusen}). Patients want to check prices and risks before they book, and they ask AI about them. Publishing accurate fees and risks is patient information first and AI optimisation second.`,
          ],
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "Reading the articles that rank for \"AI search optimization for dermatology\", \"medical spa ChatGPT\" and their Japanese equivalents, most stop at \"keep your specialties, address and hours accurate\", \"add structured data\" and \"get more reviews\". Some English-language guides give thresholds such as \"50+ reviews\" with no source.",
            "Four points that matter most for skin clinics were barely covered, so they are the core of this guide:",
          ],
          list: [
            "How to separate insured and self-pay care on the page.",
            "Where and how to publish fees and the main risks and side effects for self-pay treatments, and how that relates to advertising rules.",
            "Where the generic advice to \"collect reviews\" and \"show case photos\" collides with Japan's medical advertising rules.",
            "Concrete WordPress settings (type, services with prices, page-only FAQ) and how to check whether you appear.",
          ],
        },
        {
          heading: "Separate insured and self-pay care",
          paragraphs: [
            "AI most often gets a skin clinic wrong when the same label — \"acne treatment\", \"pigmentation treatment\" — covers both insured and self-pay options. State near the top of each symptom or treatment page whether it is insured or self-pay. The Ministry's Q&A also says that self-pay treatments using approved products (it gives dental implants and whitening as examples) must state that they are self-pay and give the standard fee. [MHLW: Q&A on the medical advertising guidelines (PDF, Japanese)](" + SRC.mhlwQa + ")",
          ],
          table: {
            head: ["Page", "What to write", "What AI tends to misread"],
            rows: [
              ["Symptom pages (acne, eczema, dermatitis, athlete's foot, warts)", "What is treated on insurance, any self-pay options named as self-pay, when to see a doctor", "Insured and self-pay treatments listed together with no distinction"],
              ["Treatment pages (laser, peels, injectables, hair removal)", "That it is self-pay, price per session and per course (tax included or not), usual number of sessions, main risks and side effects, downtime", "\"Fees explained at consultation\" and nothing else"],
              ["Price list", "Separate insured and self-pay tables, last-updated date, how consultation, follow-up and medication fees work", "An image-only price list, or campaign prices only"],
              ["Clinic information (home, access)", "Separate hours and booking rules for general and cosmetic dermatology if they differ, age range seen", "Cosmetic appointment hours shown as general clinic hours"],
              ["Doctor profiles", "Name, field and qualifications (within what may be advertised)", "Superlatives and comparisons (see below)"],
            ],
            caption: "Based on the questions patients ask about skin clinics and the gaps found in the top-ranking articles.",
          },
          after: [
            "If general and cosmetic dermatology have different hours or booking rules, give each its own hours table so AI does not merge them, and say for each whether walk-ins are seen.",
          ],
        },
        {
          heading: "Self-pay treatment pages: fees and main risks on the same page",
          paragraphs: [
            "Under Japan's medical advertising rules, a website that patients seek out themselves may explain in detail things that cannot normally be advertised, provided certain conditions are met (known as \"lifting the limit\"). The Ministry's Q&A says that for self-pay care these conditions include describing the treatment normally required and its fees, and its main risks and side effects — and that listing one or two generic drawbacks is not enough (Q6-12). Another condition is a contact point for enquiries; a booking-only number or an auto-reply line does not meet it (Q6-10). These items must be easy to see: very small text or text the same colour as the background does not count (Q6-11). [MHLW: Q&A (PDF, Japanese)](" + SRC.mhlwQa + ")",
            "This points the same way as AI search. When AI is asked about price, downtime or risk, it can use only pages where those are written in the body text. A treatment page reads well in this order:",
          ],
          list: [
            "The treatment's name, and that it is self-pay.",
            "What concern it addresses (without promising results).",
            "How it is done, time per session, usual number of sessions and interval.",
            "Fees (per session and per course, tax included or not, extras such as anaesthetic, medication or follow-up).",
            "Main risks and side effects, and typical downtime.",
            "Who cannot have it or should take care.",
            "A contact point that answers questions (phone number and hours), and who to call if there is a problem afterwards.",
            "The date the page was last updated.",
          ],
          after: [
            "Treatments that use unapproved drugs or devices, or approved drugs for unapproved purposes, need additional explanation. The Q&A says off-label use is treated the same way as unapproved drugs (Q2-14). Check the items required in the guidelines themselves.",
            `On cosmetic medicine specifically, the Ministry's expert panel report (November 22, 2024) calls for stronger online monitoring of medical advertising and for clinics to set up a contact for problems after treatment and tell patients about it. [MHLW: report of the panel on the appropriate practice of cosmetic medicine (PDF, Japanese)](${SRC.mhlwBiyo}). Putting an after-care contact on each treatment page fits that direction too.`,
          ],
        },
        {
          heading: "Reviews and case photos: where generic AI advice collides with the rules",
          paragraphs: [
            "AI search guides often recommend collecting reviews and showing before/after photos as proof. For medical institutions in Japan, these need care.",
          ],
          table: {
            head: ["Common advice", "How Japan's Q&A treats it", "What to do instead"],
            rows: [
              ["Publish patient testimonials", "Testimonials about the content or effect of treatment may not be published (Q1-18, Q2-9)", "Explain the facts in more detail: process, fees, risks"],
              ["Put reviews in your FAQ or review schema", "Same rule; reviews the clinic paid for, requested or edited can also fall under it", "Make FAQs factual: \"Is it covered by insurance?\", \"How many sessions?\""],
              ["Show before/after photos", "Even before-only or after-only photos count as claims about treatment effect and may not be advertised (Q2-8, Q3-14)", "Check the guidelines and the case book for when photos may be used"],
              ["\"Best in the area\", \"painless\", \"guaranteed results\"", "False, exaggerated and comparative claims are treated as prohibited", "Write only what you can state as fact or figures"],
            ],
          },
          after: [
            `On the other hand, posts on patients' own social media or independent review sites that the clinic did not pay for or request are not advertising (Q2-11). Whether AI reads them is not something a clinic controls, so the reliable move is to make the facts on your own site accurate. Examples are collected in the [Ministry's case book (PDF, Japanese)](${SRC.mhlwCases}).`,
          ],
        },
        {
          heading: "Structured data: the Dermatology type and one service per treatment",
          paragraphs: [
            "schema.org has a type for dermatology (checked in the schema-dts 2.1.0 type definitions on November 16, 2026).",
          ],
          table: {
            head: ["Type / property", "Meaning", "Use for a skin clinic"],
            rows: [
              [`[Dermatology](${SRC.dermatology})`, "The branch of medicine dealing with skin disorders. A MedicalBusiness, and so a LocalBusiness", "The type for a dermatology practice; it carries address, phone and opening hours"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "Field of practice. Values include Dermatology and PlasticSurgery", "If you offer both general and cosmetic dermatology, list only the fields your pages describe"],
              ["Service with offers", "A service you provide and its price", "Register each self-pay treatment with the same price as the page"],
              ["openingHoursSpecification", "Opening hours by day", "If general and cosmetic hours differ, the page table is the reference and the markup gives the main hours"],
              ["isAcceptingNewPatients", "Whether new patients are accepted (a MedicalOrganization property)", "For periods when you are not taking new patients"],
            ],
          },
          after: [
            `Google says no special structured data is needed for AI Overviews and similar features, and that structured data should match what is visible on the page. [Google: AI features and your website](${SRC.googleAi}) / [LocalBusiness structured data](${SRC.googleLocal}). Do not put a price only in the markup, or a price that differs from the page.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress skin clinic site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO and Slim SEO keep working as they are. From 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.`,
            "In the first-run setup wizard, choose \"Clinic or dental\" (this sets MedicalBusiness). Then change the business type field in Settings to Dermatology. The field accepts any schema.org type name.",
            "Check the clinic name, address, phone and description. Only empty fields are filled in from your existing settings; values you have entered are never overwritten.",
            "Write opening hours as days and times only, such as \"Mon-Fri 9:00-12:00 15:00-18:00 / Sat 9:00-13:00\". Separate cosmetic hours, public holidays and last check-in times belong in the page's own table.",
            "Under services in Settings, register each self-pay treatment. With a name, description, duration, price and currency, each is published as a Service with an Offer. Keep the price identical to the page and change both together.",
            "In each treatment page's editor sidebar, add questions for that page only (\"Is it covered by insurance?\", \"How many sessions?\", \"How long is the downtime?\"). Leave out testimonials and answers that promise results. Mark campaign pages you do not want listed as \"leave this page out of llms.txt\".",
            "Run the diagnosis on the AEO score screen and apply the one-click fixes. Check how the site looks from outside with the [free AI readability check](/check).",
          ],
        },
        {
          heading: "Adding medicalSpecialty",
          paragraphs: [
            "Nurevo AEO does not output medicalSpecialty on its own. To add it, use the filter that changes the business structured data (webmcp_canary_business_node), in your theme's functions.php or a small plugin. Add only the fields your pages describe.",
          ],
          code: FILTER_CODE_EN,
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Every symptom and treatment page says whether it is insured or self-pay.",
            "Self-pay treatment pages give the fee (tax included or not, extras), usual number of sessions, main risks and side effects, and downtime.",
            "A contact point that answers questions — not booking-only — is shown clearly.",
            "The price list is text, not only an image, and has a last-updated date.",
            "If general and cosmetic dermatology differ in hours or booking, each is written out.",
            "No testimonials, before/after photos, superlatives or comparisons appear in the body, FAQ or structured data.",
            "Treatments using unapproved products or off-label use carry the explanation the guidelines require.",
            "Service prices in the structured data match the prices on the page.",
            "Name, address, phone and hours match across structured data, Google Business Profile and any official health directory.",
            "llms.txt lists your clinic information, price list, main treatments and access pages. [What is llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the pages are in order, write five to ten questions a patient might ask, combining area × symptom × insurance, area × treatment × price, and treatment × downtime, and put them to ChatGPT and Perplexity. Record whether your clinic appears by name or URL, and whether insurance status, fees and risks are stated correctly. If AI quotes a wrong price, check how your price list and treatment page are written and whether an old campaign page is still live. AI answers change between runs, so ask the same questions again over several weeks. The method is set out in [how to measure AI visibility](/guide/measure-ai-visibility).",
            `An analysis published by MGMA, the US medical practice management association (May 2026, written by the founder of an AI search company), found that none of the 200 independent practices in its sample was named by ChatGPT. [MGMA](${SRC.mgma}). Countries and conditions differ, but actually asking the questions is the place to start.`,
            "With Nurevo AEO, Free and Standard plans also ask Perplexity three questions built from your business type and area once a month (without your clinic's name) and record whether your clinic was named or your site cited. The Pro plan (from USD 99 per month) adds beta AI visibility measurement: the share of AI answers your clinic appears in, compared with competitors and tracked over time (currently measured on Perplexity). Both look at samples of answers; neither observes every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a dermatology clinic start with AI search?", a: "Start by stating on each symptom and treatment page whether care is insured or self-pay. Then give each self-pay treatment page its fee, usual number of sessions, main risks and side effects and downtime, and make your name, address, phone and hours match across structured data and your Google Business Profile." },
        { q: "Should a cosmetic skin clinic publish its prices?", a: "Yes. When AI is asked about price, it uses pages where the price is written in the text. In Japan, the Ministry's Q&A also lists the usual treatment, its fees and its main risks and side effects among the conditions for explaining self-pay care in detail on a website." },
        { q: "Which structured data type should I use?", a: "schema.org's Dermatology type represents a dermatology practice and is a kind of MedicalBusiness and LocalBusiness. If you also offer cosmetic treatments, you can add Dermatology and PlasticSurgery as medicalSpecialty values. Matching the page matters more than the type." },
        { q: "Do before/after photos help a clinic get chosen by AI?", a: "There is no verified evidence that they do. Under Japan's medical advertising rules, before and after photos are treated as claims about treatment effect and are restricted. Check the guidelines, the case book and your local health centre for when they may be used." },
        { q: "Will low ratings on review sites keep my clinic out of AI answers?", a: "AI providers do not publish how much weight they give such information, so no one can say for certain. Independent reviews the clinic did not request are not advertising, but the clinic may not publish reviews it paid for or requested on its own site. Focus on making your own site's facts accurate." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services with prices and FAQ structured data, llms.txt, AI crawler settings and the AEO score are in the free plan. Paid plans add the always-current ruleset (Standard, USD 20 per month) and beta AI visibility measurement (Pro, from USD 99 per month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will my clinic be guaranteed to appear in ChatGPT?", a: "No. AI answers vary, and no tool or method can guarantee appearance or ranking. What you can do is make your clinic's facts readable to AI and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your skin clinic's website",
        body: "The free check needs no sign-up and shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies. This article is not legal or medical advice.",
    },
  },
};
