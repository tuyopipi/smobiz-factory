// Content page: AI search (AEO) for eye clinics (眼科). Industry page.
// Primary care has medical-clinic-ai-search and skin clinics
// dermatology-clinic-ai-search; this one covers what is specific to eye care:
// the three payment categories (insured / 選定療養 / self-pay) that sit side by
// side in one clinic, cataract surgery with multifocal lenses, contact lens
// prescriptions versus lens sales, and myopia control for children.
//
// Written 2026-11-17 (JST). Every claim about Nurevo AEO comes from the
// plugin itself (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// - setup wizard "Clinic or dental" card = MedicalBusiness (includes/setup-wizard.php ~l.374);
//   the business type setting accepts any schema.org type name
//   (webmcp_canary_business_schema_type, nurevo-webmcp.php ~l.1905), so
//   "Ophthalmology" can be entered.
// - services with price are published as Service with an Offer; the business
//   node passes through the filter webmcp_canary_business_node ($org, $settings).
// - per-page settings (leave out of llms.txt, page-only FAQ), readme 0.9.1/0.9.2.
//   The plugin does not output medicalSpecialty itself.
//
// Outside facts, checked 2026-11-17 unless noted:
// - 藤沢市民病院 お知らせ (2026-06-03, multifocal_iol_2026_1.pdf): 選定療養 for
//   multifocal IOL cataract surgery since 令和2年4月; the extra cost is paid on
//   top of normal fees and is fully self-paid; per-lens prices per eye incl. tax
//   (e.g. 234,300 to 272,800 yen); hospital has notified the regional bureau.
//   The MHLW notice itself was NOT read; the page names no notice number.
// - 薬事日報 2025-01-09: リジュセアミニ点眼液 approved 2024-12-27 as the first
//   drug to slow myopia progression. One hospital's patient leaflet
//   (tch.or.jp ryjusea.pdf): ages 5-15, exams insured, the drops self-paid at
//   5,000 yen (tax incl.) per 30 days; with orthokeratology everything is self-pay.
//   Treated as one facility's handling, not a national rule.
// - 消費者庁 注意喚起 (2021-09-10, caution_054): contact lenses incl. colour
//   lenses are 高度管理医療機器; see an eye doctor and get a prescription first.
// - 政府広報オンライン (entry-9540): 104 reports Aug 2014-Dec 2022 to the
//   National Consumer Affairs Center's doctor reporting line, over half bought online.
// - MHLW 薬食発0718第16号 (2012-07-18): sellers should check whether the buyer
//   has seen a doctor, recommend it if not, and record the clinic's name.
// - MHLW 医療広告等ガイドラインに関するQ&A: items A6-10/11/12, A1-18/A2-9,
//   A2-8/A3-14, A3-9/A3-18 as read for dermatology-clinic-ai-search on 2026-11-16.
// - schema.org via schema-dts 2.1.0 (read 2026-11-17): Ophthalmology, Optometric
//   and Optician are MedicalBusiness subtypes; Ophthalmology and Optometric are
//   also MedicalSpecialty values. Optician = "a store that sells reading glasses
//   and similar devices".
// - Google AI features: as checked for dental-clinic-ai-search on 2026-10-29.
// LASIK consumer warnings (消費者庁 2013) were NOT confirmed in this run and are
// not mentioned. Re-check all of the above when you update the page.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  mhlwQa: "https://www.mhlw.go.jp/content/001683595.pdf",
  mhlwCases: "https://www.mhlw.go.jp/content/10800000/001232587.pdf",
  multifocal: "https://fujisawacity-hosp.jp/data/media/fujisawa-hospital/page/diseases/cataract/multifocal_iol_2026_1.pdf",
  atropine: "https://tch.or.jp/asset/00032/shinryo_ka/ganka/ryjusea.pdf",
  yakuji: "https://www.yakuji.co.jp/entry115192.html",
  caaLens: "https://www.caa.go.jp/policies/policy/consumer_safety/caution/caution_054/",
  govLens: "https://www.gov-online.go.jp/article/201712/entry-9540.html",
  mhlwLens: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000093771.html",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  ophthalmology: "https://schema.org/Ophthalmology",
  optician: "https://schema.org/Optician",
  medicalSpecialty: "https://schema.org/medicalSpecialty",
};

const FILTER_CODE = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // 本文に書いている診療分野だけを足す
    $org['medicalSpecialty'] = array('Ophthalmology');
    return $org;
}, 10, 2);`;

const FILTER_CODE_EN = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // Add only the specialty your pages actually describe
    $org['medicalSpecialty'] = array('Ophthalmology');
    return $org;
}, 10, 2);`;

export default {
  slug: "eye-clinic-ai-search",
  targetQueries: [
    "AI search optimization for eye clinics",
    "ophthalmology practice ChatGPT visibility",
    "Ophthalmology schema markup",
    "眼科 AI検索対策",
    "眼科 LLMO 対策",
    "眼科クリニック ChatGPT 表示",
  ],
  related: ["medical-clinic-ai-search", "dermatology-clinic-ai-search", "pharmacy-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "眼科のAI検索対策：保険・選定療養・自費、白内障とコンタクトの書き方 | Nurevo",
      description: "眼科のAI検索対策は、保険・選定療養・自費の3つを治療ごとに書き分けること。多焦点眼内レンズ、コンタクトの処方と販売、子どもの近視、構造化データ、WordPressの手順を解説。",
      h1: "眼科のAI検索対策：保険・選定療養・自費を書き分け、白内障・コンタクト・近視の情報をAIに正しく読ませる手順",
      lead: "眼科のAI検索対策でいちばん大切なのは、「その検査・治療は保険か、選定療養か、自費か。自分で払う分はいくらか」を、治療ごとのページに文字で書くことです。眼科は1つの医院の中で、保険の白内障手術、選定療養の多焦点眼内レンズ、自費の屈折矯正手術やオルソケラトロジーが並ぶため、AIが取り違えやすい分野です。そのうえで、コンタクトレンズの「処方（医院）」と「販売（販売店）」を分けて書き、医療広告のルールを守ったまま、同じ事実を構造化データ・llms.txt・Googleビジネスプロフィールにそろえます。",
      intro: [
        "作成日：2026年11月17日（JST）。多焦点眼内レンズの選定療養（病院のお知らせ）、低濃度アトロピン点眼薬の承認（薬事日報）と医療機関の説明資料、コンタクトレンズについての消費者庁・政府広報・厚生労働省の資料、schema.orgの型（schema-dts 2.1.0の型定義）は同日に確認しました。厚生労働省の医療広告Q&Aの項目は2026年11月16日に確認した範囲です。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが医院の事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。この記事は法的・医学的な助言ではありません。個別の表現や費用の扱いは、管轄の保健所・地方厚生局などで確認してください。",
      ],
      sections: [
        {
          heading: "眼科で、患者さんがAIに聞くこと",
          paragraphs: [
            "眼科の質問は、症状の相談だけでなく「お金」と「手続き」が入るのが特徴です。患者さん本人だけでなく、高齢の親の白内障や子どもの近視を調べる家族もAIに聞きます。よく出る質問の型は次の6つです。",
          ],
          table: {
            head: ["質問の型", "例", "AIが答えに使う情報"],
            rows: [
              ["地域×症状", "「◯◯駅の近くで、土曜に目の充血を診てもらえる眼科」", "診療時間（曜日ごと）、予約なしで受診できるか、対象年齢"],
              ["コンタクト", "「コンタクトの処方箋だけもらえる眼科」「初めてのコンタクトは何が必要？」", "処方の流れ、所要時間、持ち物、医院と販売店の関係"],
              ["白内障", "「多焦点眼内レンズの費用は保険でいくら？」", "単焦点・多焦点の違い、選定療養の追加費用（片眼・税込）、届出の有無"],
              ["子どもの近視", "「子どもの近視の進行を抑える治療はある？費用は？」", "治療の種類、対象年齢、保険と自費の分け方、通院の頻度"],
              ["屈折矯正", "「ICLとレーシックの違いと料金」", "自費であること、費用、主なリスク・副作用、適応検査"],
              ["検査と予約", "「眼底検査の後は運転できる？」「手術の相談は予約制？」", "検査の所要時間、当日の注意、予約の方法と電話の受付時間"],
            ],
          },
          after: [
            "どの型も、AIが使えるのは条件が文字で書いてあるページです。料金表が画像だけ、「費用はご相談ください」だけ、保険か自費かが書かれていない、というページは出典になりにくくなります。",
          ],
        },
        {
          heading: "上位の記事で抜けていたこと",
          paragraphs: [
            "「眼科 AI検索対策」「クリニック LLMO」「ophthalmology AEO」などで上位に出る記事を、日本語5本・英語6本読みました。日本語で眼科に絞った記事はなく、クリニック全般・歯科・眼鏡店向けの記事が中心でした。英語の眼科向け記事は、多くが支援会社の紹介ページで、「レビュー50件以上・星4.5以上がAIに好まれる」「約40%の改善」のような数字を、根拠を示さずに、または別の研究の数字をそのまま当てはめて挙げていました。",
            "どの記事にもなかったのは、次の4点です。この記事はここを中心に書きます。",
          ],
          list: [
            "保険・選定療養・自費の3つを、治療ごとにどう書き分けるか（多焦点眼内レンズ、子どもの近視治療を含む）。",
            "コンタクトレンズの処方（医院）と販売（販売店）を、サイトと構造化データでどう分けるか。",
            "眼科を表すschema.orgの型（Ophthalmology）と、眼鏡店の型（Optician）の使い分け。",
            "WordPressでの具体的な設定と、AIに出ているかの確かめ方。",
          ],
        },
        {
          heading: "保険・選定療養・自費の3つを書き分ける",
          paragraphs: [
            "眼科でAIがいちばん間違えやすいのは費用です。「白内障手術は保険がきく」と「多焦点眼内レンズは追加の費用がかかる」が同じページに混ざって書かれていると、AIは「多焦点も保険でできる」「白内障手術は30万円かかる」のような、どちらも不正確な答えを作りかねません。治療ごとに、次の3つのどれにあたるかを1行目近くに書きます。",
          ],
          table: {
            head: ["治療・サービス", "書いておくこと", "誤解されやすい書き方"],
            rows: [
              ["白内障手術（単焦点眼内レンズ）", "保険診療であること、入院か日帰りか、術前検査と通院の回数", "多焦点の費用と同じ表に並べる"],
              ["多焦点眼内レンズを使う白内障手術", "選定療養であること、保険の診療費とは別に払うレンズの追加費用（レンズごと・片眼・税込）、医院が届出をしていること", "「自費で約◯万円」と全額自費のように書く"],
              ["子どもの近視の進行を抑える治療", "治療の名前、対象年齢、検査と薬代のどちらが保険・自費か、1か月あたりの費用、通院の頻度、近視が止まる・視力が戻るものではないこと", "「近視が治る」「視力回復」"],
              ["オルソケラトロジー・屈折矯正手術（ICLなど）", "自由診療で行うならその旨、費用（片眼・両眼、検査代・再診代を含むか）、主なリスク・副作用、適応検査", "「料金はカウンセリングで」だけ"],
              ["コンタクトレンズの検査・処方", "処方の流れ、所要時間、持ち物、レンズ代はどこに払うか", "医院と販売店の料金を区別せずに書く"],
            ],
          },
          after: [
            `多焦点眼内レンズを使う白内障手術は、2020年（令和2年）4月から選定療養の対象になりました。選定療養は、患者さんが選んで受ける追加の医療で、その分の費用は全額自己負担になり、通常の診療費とは別に払います。ある市立病院のお知らせでは、レンズごとの追加費用（税込・片眼）が234,300円〜272,800円と示され、地方厚生局に届け出ていることも書かれています。[藤沢市民病院：多焦点眼内レンズのお知らせ（PDF）](${SRC.multifocal})。費用は医院やレンズで変わるため、自院の金額をレンズごとに書いてください。`,
            `子どもの近視では、近視の進行を抑える初めての薬として、参天製薬の「リジュセアミニ点眼液」が2024年12月27日付で承認されました。[薬事日報（2025年1月9日）](${SRC.yakuji})。ある医療機関の説明資料では、対象は5〜15歳、診察・検査は保険診療で、点眼薬は自費（30日分5,000円・税込）、オルソケラトロジーと併用する場合はすべて自費とされています。[医療機関の説明資料（PDF）](${SRC.atropine})。これは1つの医療機関の扱いです。自院でどう扱うかを、その通りに書いてください。`,
          ],
        },
        {
          heading: "自費の手術・治療ページ：費用と主なリスクを同じページに",
          paragraphs: [
            "日本の医療広告のルールでは、患者さんが自ら調べて見るウェブサイトなら、一定の条件を満たすことで、通常は広告できない内容も詳しく説明できます（「限定解除」）。厚生労働省のQ&Aでは、自由診療の場合の条件として、通常必要とされる治療の内容・費用と、主なリスク・副作用を書くこと（一般的な短所を1〜2個並べるだけでは足りない、Q6-12）、相談に答える問い合わせ先を書くこと（予約専用の番号や自動応答だけでは満たさない、Q6-10）、見やすく書くこと（Q6-11）が示されています。承認された機器・薬を使う自費の治療では、自由診療であることと標準的な費用を書くようにも示されています。[厚生労働省：医療広告等ガイドラインに関するQ&A（PDF）](" + SRC.mhlwQa + ")",
            "これはAIが「費用」「リスク」「何回通う？」を聞かれたときに使える情報と同じです。屈折矯正手術・多焦点眼内レンズ・近視治療のページは、次の順番にすると読みやすくなります。",
          ],
          list: [
            "治療の名前と、保険・選定療養・自費のどれか。",
            "どんな方に向くか、受けられない方・適応検査の内容（見え方を約束する書き方はしない）。",
            "流れ：適応検査、手術・治療の日、術後の通院の回数と時期。",
            "費用：片眼か両眼か、税込か税別か、検査代・薬代・再診代を含むか、保険の部分と自己負担の部分。",
            "主なリスク・副作用と、術後の生活の注意（運転・洗顔・仕事など、医院の案内として）。",
            "相談に答える問い合わせ先（受付時間つき）と、術後に困ったときの連絡先。",
            "ページの最終更新日。レンズの種類や費用を変えたら、日付も変える。",
          ],
        },
        {
          heading: "コンタクトレンズ：処方は医院、販売は販売店と分けて書く",
          paragraphs: [
            `コンタクトレンズは、視力補正を目的としないカラーコンタクトも含めて高度管理医療機器です。消費者庁は、購入する前にまず眼科医を受診して処方してもらい、定期検診の頻度を決めてもらうよう呼びかけています（2021年9月10日）。[消費者庁：コンタクトレンズによる眼障害について](${SRC.caaLens})。政府広報オンラインによると、国民生活センターの「医師からの事故情報受付窓口」には2014年8月〜2022年12月に104件の事故情報が寄せられ、購入先はインターネット通販が半数以上でした。[政府広報オンライン](${SRC.govLens})。`,
            `販売店の側でも、厚生労働省の通知（2012年7月18日）で、販売時に医療機関への受診状況を確かめ、受診していない人には受診を勧め、受診した医療機関の名前を記録することとされています。[厚生労働省：コンタクトレンズの販売時における取扱いについて](${SRC.mhlwLens})。患者さんがAIに「コンタクトはどこで作れる？」と聞いたとき、医院が「検査と処方をするところ」だと分かる書き方が役に立ちます。`,
          ],
          list: [
            "コンタクトのページに、初めての方と継続の方それぞれの流れ・所要時間・持ち物（使っているレンズの箱など、医院の案内として）を書く。",
            "医院の中や隣に販売店がある場合、医院と販売店が同じ事業者か別の事業者かを書く。別なら、営業時間・電話番号・料金も分けて書く。",
            "「処方箋だけ」に応じるか、他の店で買う人にどう案内するかを、医院の方針としてFAQに書く。",
            "定期検査の目安は、医院の方針として書く（期間の数字を一般論として断定しない）。",
          ],
        },
        {
          heading: "口コミ・術後の見え方：一般的な「AI対策」の助言とぶつかるところ",
          paragraphs: [
            "AI検索対策の記事では「口コミを増やす」「実績を見せる」がよく勧められます。眼科の手術や近視治療では、ここに注意が必要です。",
          ],
          table: {
            head: ["よくある助言", "医療機関での扱い（厚生労働省のQ&A）", "代わりにできること"],
            rows: [
              ["患者さんの声をサイトに載せる", "治療の内容や効果についての体験談は掲載できない（Q1-18、Q2-9）", "流れ・費用・リスク・通院回数など、事実の説明を詳しくする"],
              ["「術後に裸眼で見えるように」と効果を見せる", "治療効果の表現には制限がある。術前・術後の写真も治療効果の表現として扱われる（Q2-8、Q3-14）", "何が書けるかは事例解説書と保健所で確認する"],
              ["「地域No.1」「痛くない」「日帰りで安心」", "虚偽・誇大・比較優良の表示は禁止されている例として扱われる", "手術時間や通院回数など、数字や事実で書ける範囲だけを書く"],
              ["口コミをFAQや構造化データのレビューに入れる", "上と同じ。医院が依頼・編集した口コミも対象になりうる", "FAQは「保険はききますか」「何日後に運転できますか」など事実の質問にする"],
            ],
          },
          after: [
            `事例は[事例解説書（PDF）](${SRC.mhlwCases})にもまとまっています。医院が依頼していない第三者の口コミをAIが読むかどうかは医院が決められないので、自院のサイトでは事実を正確に書くことに集中するのが確実です。`,
          ],
        },
        {
          heading: "構造化データ：Ophthalmologyの型と、併設の眼鏡店の型",
          paragraphs: [
            "schema.orgには、眼科と眼鏡店をそれぞれ表す型があります（2026年11月17日にschema-dts 2.1.0の型定義で確認）。",
          ],
          table: {
            head: ["型・プロパティ", "意味", "眼科での使い方"],
            rows: [
              [`[Ophthalmology](${SRC.ophthalmology})`, "目と視覚にかかわる病気の診断・治療（内科的・外科的な治療を含む）。MedicalBusinessの一種で、LocalBusinessの一種", "眼科の医院・クリニックの型に。住所・電話番号・営業時間をそのまま持てる"],
              ["Optometric", "視力を測り、矯正用のレンズを処方する分野", "米国の検眼（オプトメトリスト）を想定した型。日本の眼科医院にはOphthalmologyが合う"],
              [`[Optician](${SRC.optician})`, "眼鏡などを販売する店", "医院とは別の事業者の眼鏡・コンタクト販売店に。医院の型には使わない"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "診療の分野。値にOphthalmologyがある", "本文に書いている分野だけを入れる"],
              ["Service と offers", "提供するサービスと、その料金", "自費の治療や選定療養のレンズ代を1つずつ登録し、本文と同じ料金を入れる"],
            ],
          },
          after: [
            `Googleは、AIによる概要などのために特別な構造化データは不要で、構造化データはページに見えている内容と一致させるよう案内しています。[Google：AI features and your website](${SRC.googleAi})。料金を構造化データにだけ書く、本文と違う料金を入れる、医院と販売店を1つの事業者として出す、ということは避けてください。`,
          ],
        },
        {
          heading: "WordPressの眼科サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「クリニック・歯科」を選びます（型はMedicalBusinessになります）。そのあと設定画面の「業種（schema.org型）」欄を Ophthalmology に変えます。この欄にはschema.orgの型名をそのまま入れられます。",
            "医院名・住所・電話番号・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "営業時間は「月〜金 9:00-12:00 14:00-18:00 / 土 9:00-13:00」のように曜日と時刻だけを書きます。手術日・コンタクトの受付終了時刻・検査の予約枠などの条件は、本文の表に書きます。",
            "設定画面のサービスに、自費の治療や選定療養のレンズ代を1つずつ登録します（例：「多焦点眼内レンズ（◯◯）追加費用・片眼」）。名前・説明・料金・通貨を入れると、料金つきのサービス（Service と Offer）として出力されます。料金は本文と同じ値にし、本文を変えたら同時に直します。",
            "白内障・コンタクト・近視治療の各ページの編集画面のサイドバーで、そのページだけのFAQ（「多焦点は保険がききますか」「処方箋だけもらえますか」「何歳から始められますか」）を入れます。体験談や見え方を約束する答えは入れません。終わったキャンペーンや古い料金のページは「このページをllms.txtに載せない」にします。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
        },
        {
          heading: "診療分野（medicalSpecialty）を足したいとき",
          paragraphs: [
            "Nurevo AEOは medicalSpecialty を自動では出しません。出したい場合は、テーマの functions.php か小さなプラグインで、事業の構造化データを変えるフィルター（webmcp_canary_business_node）を使います。",
          ],
          code: FILTER_CODE,
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "治療・検査のページごとに、保険・選定療養・自費のどれかが書かれている。",
            "多焦点眼内レンズのページに、レンズごとの追加費用（片眼・税込）と、保険の診療費は別であることが書かれている。",
            "近視治療のページに、対象年齢、保険と自費の分け方、1か月あたりの費用、通院の頻度がある。",
            "自費の手術ページに、費用・主なリスク・副作用・適応検査・相談に答える問い合わせ先がある。",
            "コンタクトのページに、処方の流れ・所要時間・持ち物があり、医院と販売店の関係が書かれている。",
            "体験談・術前術後の写真・最上級や比較の言葉が、本文・FAQ・構造化データに入っていない。",
            "料金表が画像だけでなく文字で書かれ、更新日がある。",
            "構造化データの型がOphthalmologyで、サービスの料金が本文と一致している。別事業者の販売店を医院の情報に混ぜていない。",
            "名前・住所・電話番号・診療時間が、構造化データ・Googleビジネスプロフィール・医療情報ネットと一致している。",
            "llms.txtに、診療案内・料金表・白内障・コンタクト・アクセスのページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、患者さんや家族が聞きそうな質問を「地域×症状×曜日」「地域×白内障×多焦点の費用」「子どもの近視×治療×費用」「地域×コンタクト×処方」の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げます。医院が名前やURLで出るか、保険・選定療養・自費の区別と金額が正しく書かれているかを記録します。費用を間違えて答えられていたら、料金表と治療ページの書き方、古い料金のページやPDFが残っていないかを見直します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（医院名は含めません）をPerplexityに投げ、回答に医院の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に医院が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "眼科のAI検索対策は、何から始めればいいですか？", a: "治療・検査のページごとに、保険・選定療養・自費のどれかを書くことからです。次に多焦点眼内レンズや自費の治療のページに費用・主なリスク・問い合わせ先を書き、名前・住所・電話番号・診療時間を構造化データ・Googleビジネスプロフィールとそろえます。" },
        { q: "多焦点眼内レンズの費用は、どう書けばいいですか？", a: "選定療養であること、保険の診療費とは別に払う追加費用であることを書き、レンズごとの金額を片眼・税込などの条件つきで表にします。2020年4月から多焦点眼内レンズを使う白内障手術は選定療養の対象で、追加分は全額自己負担です。" },
        { q: "コンタクトレンズの販売店が併設されています。構造化データはどうしますか？", a: "医院と販売店が別の事業者なら、医院はOphthalmology、販売店はOpticianなど別の型・別の情報として扱い、1つにまとめないでください。サイトの本文でも、営業時間・電話番号・料金を分けて書きます。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgのOphthalmologyが眼科を表す型で、MedicalBusinessとLocalBusinessの一種です。Optometricは米国の検眼を想定した型、Opticianは眼鏡などの販売店の型です。型より、値が本文と一致していることが大切です。" },
        { q: "手術の症例数や術後の視力を載せると、AIに選ばれやすくなりますか？", a: "AIへの効果は確かめられていません。日本の医療広告のルールでは、治療効果の表現や術前術後の写真に制限があります。載せる場合の条件は、医療広告ガイドラインと事例解説書、管轄の保健所で確認してください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・診療時間・サービスと料金・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに眼科が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが医院の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが眼科のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的・医学的な助言ではありません。",
    },
    en: {
      title: "AI Search for Eye Clinics: Insured vs Self-Pay, Lenses, Schema | Nurevo",
      description: "AEO for eye clinics: label each treatment as insured, selected (top-up) care or self-pay, keep contact lens prescribing apart from lens sales, use Ophthalmology.",
      h1: "AI search for eye clinics: how to label insured, top-up and self-pay care so AI reads cataract, contact lens and myopia information correctly",
      lead: "The single most useful thing an eye clinic can do for AI search is to state, in text on each treatment page, whether the test or treatment is covered by insurance, partly covered, or self-pay, and what the patient pays themselves. One eye clinic often offers insured cataract surgery, multifocal lenses billed as a top-up on insured care, and self-pay refractive surgery or orthokeratology side by side, so AI tools mix them up easily. Then keep contact lens prescribing (the clinic) separate from lens sales (the shop), follow the medical advertising rules, and publish the same facts in your structured data, llms.txt and Google Business Profile.",
      intro: [
        "Written November 17, 2026 (JST). The examples come from Japan, where Nurevo is based. The multifocal lens top-up scheme (a hospital notice), the approval of a low-dose atropine eye drop (Yakuji Nippo) and a clinic's patient leaflet, contact lens notices from Japan's Consumer Affairs Agency, the Government Public Relations Online and the Ministry of Health, Labour and Welfare (MHLW), and the schema.org types (schema-dts 2.1.0 type definitions) were checked that day. The MHLW medical advertising Q&A items are as checked on November 16, 2026. Outside Japan, insurance and advertising rules differ: check your own country's rules.",
        "AI answers change by day and by how a question is asked. This guide makes your clinic's facts readable to AI. It does not guarantee that you will appear in AI answers or rank higher. It is not legal or medical advice.",
      ],
      sections: [
        {
          heading: "What patients ask AI about eye clinics",
          paragraphs: [
            "Eye care questions are not only about symptoms. They carry money and process. Family members ask too: adult children researching a parent's cataract surgery, parents researching a child's myopia. Six question types come up again and again.",
          ],
          table: {
            head: ["Question type", "Example", "What AI uses to answer"],
            rows: [
              ["Area × symptom", "\"An eye clinic near X station that can see red eyes on Saturday\"", "Hours by day, walk-ins or appointments, ages seen"],
              ["Contact lenses", "\"An eye doctor who will just write a contact lens prescription\" \"What do I need for my first contacts?\"", "Prescribing steps, time needed, what to bring, how the clinic relates to the lens shop"],
              ["Cataract", "\"How much do multifocal lenses cost with insurance?\"", "Monofocal vs multifocal, the top-up cost per eye including tax, whether the clinic has notified the authorities"],
              ["Child myopia", "\"Is there treatment to slow my child's myopia? What does it cost?\"", "Treatment types, ages, what is insured and what is self-pay, visit frequency"],
              ["Refractive surgery", "\"ICL vs LASIK: difference and price\"", "That it is self-pay, the fee, main risks and side effects, eligibility tests"],
              ["Tests and booking", "\"Can I drive after a dilated eye exam?\" \"Do I need an appointment to discuss surgery?\"", "How long tests take, same-day cautions, how to book and phone hours"],
            ],
          },
          after: [
            "In every case AI can only use a page where the conditions are written as text. A price list that is only an image, \"please ask about fees\", or a page that never says whether something is insured is unlikely to be cited.",
          ],
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read five Japanese and six English articles that rank for queries such as \"eye clinic AI search\", \"clinic LLMO\" and \"ophthalmology AEO\". None of the Japanese ones focused on eye clinics; they covered clinics in general, dentists or optical shops. Most English ophthalmology pages were agency service pages, and several quoted figures such as \"50+ reviews and 4.5 stars are favoured by AI\" or \"about a 40% lift\" without evidence, or borrowed a number from an unrelated study.",
            "None of them covered these four points, so this guide centres on them.",
          ],
          list: [
            "How to label insured, top-up and self-pay care per treatment, including multifocal lenses and child myopia treatment.",
            "How to keep contact lens prescribing (the clinic) apart from lens sales (the shop) on the site and in structured data.",
            "The schema.org type for eye clinics (Ophthalmology) versus the type for optical shops (Optician).",
            "Concrete WordPress settings, and how to check whether you appear in AI answers.",
          ],
        },
        {
          heading: "Label each treatment: insured, top-up or self-pay",
          paragraphs: [
            "Cost is where AI gets eye clinics wrong most often. If \"cataract surgery is covered by insurance\" and \"multifocal lenses cost extra\" are mixed on one page, AI may say \"multifocal lenses are covered\" or \"cataract surgery costs 300,000 yen\", both inaccurate. Put the category near the top of each treatment page.",
          ],
          table: {
            head: ["Treatment or service", "What to state", "Wording AI misreads"],
            rows: [
              ["Cataract surgery (monofocal lens)", "That it is insured, day surgery or inpatient, number of pre-op tests and follow-up visits", "Listing it in the same table as multifocal prices"],
              ["Cataract surgery with a multifocal lens", "That it is selected (top-up) care, the extra lens cost paid on top of the insured fees (per lens, per eye, tax included), and that the clinic has notified the authorities", "\"Self-pay, about X yen\" as if the whole surgery were self-pay"],
              ["Treatment to slow child myopia", "Name, ages, whether tests and drops are insured or self-pay, monthly cost, visit frequency, and that it does not stop myopia or restore vision", "\"Cures myopia\", \"restores eyesight\""],
              ["Orthokeratology, refractive surgery (ICL etc.)", "That it is self-pay if so, the fee (one or both eyes, whether tests and follow-ups are included), main risks and side effects, eligibility tests", "Only \"fees explained at consultation\""],
              ["Contact lens exam and prescription", "Steps, time needed, what to bring, and where the lenses are paid for", "Mixing clinic fees and shop prices"],
            ],
          },
          after: [
            `In Japan, cataract surgery using a multifocal lens has been \"selected care\" (senteiryoyo) since April 2020. Selected care is additional care the patient chooses; that part is fully self-paid, on top of the normal insured fees. One city hospital's notice lists extra costs of 234,300 to 272,800 yen per eye (tax included) depending on the lens, and states that the hospital has notified the regional health bureau. [Fujisawa City Hospital: multifocal lens notice (PDF, Japanese)](${SRC.multifocal}). Costs vary by clinic and lens, so publish your own figure for each lens.`,
            `For child myopia, a low-dose atropine eye drop from Santen was approved on December 27, 2024 as Japan's first drug to slow myopia progression. [Yakuji Nippo, January 9, 2025 (Japanese)](${SRC.yakuji}). One medical institution's patient leaflet says it is for ages 5 to 15, exams are insured, the drops are self-pay (5,000 yen including tax for 30 days), and everything becomes self-pay when combined with orthokeratology. [Patient leaflet (PDF, Japanese)](${SRC.atropine}). That is one institution's handling; write down exactly how your clinic handles it.`,
          ],
        },
        {
          heading: "Self-pay surgery and treatment pages: fees and main risks on the same page",
          paragraphs: [
            "Under Japan's medical advertising rules, a website that patients look up themselves may explain things normally barred from advertising if certain conditions are met (\"genteikaijo\", lifting of limits). For self-pay care, the MHLW Q&A says the site must give the usual treatment content and fees and the main risks and side effects (listing one or two generic drawbacks is not enough, Q6-12), a contact point that answers questions (an appointments-only number or auto-reply does not count, Q6-10), and must present these clearly (Q6-11). For self-pay treatment using approved devices or drugs, it should also state that it is self-pay and give the standard fee. [MHLW: Q&A on the medical advertising guidelines (PDF, Japanese)](" + SRC.mhlwQa + ")",
            "This is also exactly what AI needs when asked about cost, risk or the number of visits. Refractive surgery, multifocal lens and myopia pages read well in this order.",
          ],
          list: [
            "Treatment name, and whether it is insured, top-up or self-pay.",
            "Who it suits, who cannot have it, and what the eligibility tests are (without promising how well the patient will see).",
            "The process: eligibility tests, treatment day, number and timing of follow-up visits.",
            "Fees: one eye or both, tax included or not, whether tests, drops and follow-ups are included, which part is insured and which is self-paid.",
            "Main risks and side effects, and after-care instructions (driving, face washing, work) as your clinic's guidance.",
            "A contact point that answers questions (with hours), and who to call if there is a problem after treatment.",
            "The page's last-updated date. Change it when lenses or fees change.",
          ],
        },
        {
          heading: "Contact lenses: the clinic prescribes, the shop sells",
          paragraphs: [
            `In Japan, contact lenses, including coloured lenses with no vision correction, are classed as highly controlled medical devices. The Consumer Affairs Agency advises people to see an eye doctor first, get a prescription and agree how often to have check-ups (September 10, 2021). [Consumer Affairs Agency: eye injuries from contact lenses (Japanese)](${SRC.caaLens}). According to Government Public Relations Online, the National Consumer Affairs Center's reporting line for doctors received 104 accident reports between August 2014 and December 2022, and more than half of the lenses had been bought online. [Government Public Relations Online (Japanese)](${SRC.govLens}).`,
            `On the shop side, an MHLW notice (July 18, 2012) says sellers should check whether the buyer has seen a doctor, recommend a visit if not, and record the name of the clinic. [MHLW: handling at the time of contact lens sale (Japanese)](${SRC.mhlwLens}). When a patient asks AI \"where can I get contacts?\", it helps if your site makes clear that the clinic is where the exam and prescription happen.`,
          ],
          list: [
            "On the contact lens page, give the steps, time needed and what to bring (such as the box of the lenses in use, as your clinic's guidance) for first-time and returning patients.",
            "If there is a lens shop in or next to the clinic, say whether it is the same business or a separate one. If separate, give its own hours, phone number and prices.",
            "State in an FAQ, as clinic policy, whether you write prescriptions only and how you guide people who buy elsewhere.",
            "Give check-up intervals as your clinic's policy, not as a general rule.",
          ],
        },
        {
          heading: "Reviews and post-surgery results: where common AI advice collides with the rules",
          paragraphs: [
            "AI optimisation articles often recommend collecting reviews and showing results. For eye surgery and myopia treatment, take care.",
          ],
          table: {
            head: ["Common advice", "How Japan's MHLW Q&A treats it", "What to do instead"],
            rows: [
              ["Publish patient testimonials", "Testimonials about the content or effect of treatment may not be published (Q1-18, Q2-9)", "Explain the facts in more detail: process, fees, risks, visits"],
              ["Show that patients \"see without glasses after surgery\"", "Claims of treatment effect are restricted; before/after photos count as effect claims (Q2-8, Q3-14)", "Check what you may say in the MHLW case book and with your public health centre"],
              ["\"No. 1 in the area\", \"painless\", \"safe day surgery\"", "Treated as examples of false, exaggerated or comparative claims", "Write only what numbers and facts support, such as surgery time or visit count"],
              ["Put reviews into FAQs or review markup", "As above; reviews the clinic requested or edited may also count", "Make FAQs factual: \"Is it insured?\", \"When can I drive?\""],
            ],
          },
          after: [
            `More examples are in the [MHLW case book (PDF, Japanese)](${SRC.mhlwCases}). You cannot control whether AI reads third-party reviews you did not request, so the dependable approach is to state facts accurately on your own site.`,
          ],
        },
        {
          heading: "Structured data: the Ophthalmology type and the type for a lens shop",
          paragraphs: [
            "schema.org has separate types for an eye clinic and an optical shop (checked against the schema-dts 2.1.0 type definitions on November 17, 2026).",
          ],
          table: {
            head: ["Type or property", "Meaning", "How an eye clinic uses it"],
            rows: [
              [`[Ophthalmology](${SRC.ophthalmology})`, "Diagnosis and treatment of disorders of the eye and visual structures, including medical and surgical treatment. A MedicalBusiness, and so a LocalBusiness", "The type for an eye clinic. It carries address, phone and opening hours directly"],
              ["Optometric", "Testing visual acuity and prescribing corrective lenses", "Fits optometry practices (common in the US). A physician-led eye clinic fits Ophthalmology"],
              [`[Optician](${SRC.optician})`, "A store that sells glasses and similar devices", "For a separately run glasses or lens shop, not for the clinic"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "The medical field; Ophthalmology is one of its values", "Include only what your pages describe"],
              ["Service and offers", "A service and its price", "Register each self-pay treatment or top-up lens fee with the same price as the page"],
            ],
          },
          after: [
            `Google says no special structured data is needed for AI features such as AI Overviews, and that structured data should match what is visible on the page. [Google: AI features and your website](${SRC.googleAi}). Do not put prices only in structured data, do not use prices that differ from the page, and do not publish the clinic and a separate shop as one business.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress eye clinic site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO and Slim SEO keep working. From 0.9.1 it also runs alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.`,
            "In the setup wizard choose \"Clinic or dental\" (the type becomes MedicalBusiness). Then change \"Business type (schema.org type)\" in Settings to Ophthalmology. The field accepts any schema.org type name.",
            "Check the clinic name, address, phone and description. Only empty fields are filled from existing settings; values you entered are not overwritten.",
            "Enter opening hours as days and times only, for example \"Mon-Fri 9:00-12:00 14:00-18:00 / Sat 9:00-13:00\". Put surgery days, contact lens cut-off times and test slots in a table in the page text.",
            "Under services in Settings, register each self-pay treatment or top-up lens fee (for example \"Multifocal lens (X) top-up, per eye\"). With a name, description, price and currency, each is published as a Service with an Offer. Keep the price identical to the page and change both together.",
            "In the sidebar of each cataract, contact lens and myopia page, add page-only FAQs (\"Are multifocal lenses insured?\", \"Can I get just a prescription?\", \"From what age can treatment start?\"). Do not add testimonials or answers that promise results. Set finished campaigns and old price pages to \"Leave this page out of llms.txt\".",
            "Run the diagnosis on the AEO score screen and apply the one-click fixes. Check how the site looks from outside with the [free AI readability check](/check).",
          ],
        },
        {
          heading: "Adding medicalSpecialty",
          paragraphs: [
            "Nurevo AEO does not output medicalSpecialty by itself. To add it, use the filter that edits the business structured data (webmcp_canary_business_node) in your theme's functions.php or a small plugin.",
          ],
          code: FILTER_CODE_EN,
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Every treatment and test page says whether it is insured, top-up or self-pay.",
            "The multifocal lens page gives the extra cost per lens (per eye, tax included) and says the insured fees are separate.",
            "The myopia page gives ages, what is insured and what is self-pay, the monthly cost and visit frequency.",
            "Self-pay surgery pages give fees, main risks and side effects, eligibility tests and a contact point that answers questions.",
            "The contact lens page gives steps, time needed and what to bring, and explains how the clinic and the lens shop relate.",
            "No testimonials, before/after photos, superlatives or comparisons in the text, FAQs or structured data.",
            "The price list is text, not only an image, and has a last-updated date.",
            "The structured data type is Ophthalmology, service prices match the page, and a separate shop is not mixed into the clinic's data.",
            "Name, address, phone and hours match across structured data, Google Business Profile and official medical directories.",
            "llms.txt lists the clinic information, price list, cataract, contact lens and access pages. [What is llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the pages are in order, write five to ten questions patients and families might ask, combining area × symptom × day, area × cataract × multifocal cost, child myopia × treatment × cost and area × contact lens × prescription. Ask them in ChatGPT and Perplexity. Record whether your clinic appears by name or URL, and whether the insured / top-up / self-pay split and the amounts are right. If costs are wrong, review the price list and treatment pages, and look for old price pages or PDFs still online. AI answers change from run to run, so ask the same questions again over time. [How to measure AI visibility](/guide/measure-ai-visibility) explains the method.",
            "In Nurevo AEO, even the Free and Standard plans ask Perplexity three questions built from your business type and area (without your clinic's name) once a month, and record whether your name or site appeared. The Pro plan (from USD 99 per month) adds beta AI visibility measurement: how often your clinic appears in AI answers, compared with competitors and tracked over time (currently measured on Perplexity). Both look at samples of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should an eye clinic start with AI search?", a: "Label every treatment and test page as insured, top-up or self-pay. Then add fees, main risks and a contact point to multifocal lens and self-pay pages, and make your name, address, phone and hours match across structured data and Google Business Profile." },
        { q: "How should we present multifocal lens costs?", a: "Say that it is selected (top-up) care, that the extra cost is paid on top of the insured fees, and give a table of amounts per lens with conditions such as per eye and tax included. In Japan, cataract surgery using a multifocal lens has been selected care since April 2020, with the extra part fully self-paid." },
        { q: "We have a contact lens shop attached. How do we handle structured data?", a: "If the clinic and the shop are separate businesses, describe the clinic as Ophthalmology and the shop with its own type such as Optician, and do not merge them. In the page text, give each its own hours, phone number and prices." },
        { q: "Which structured data type should we use?", a: "schema.org's Ophthalmology is the type for eye clinics; it is a MedicalBusiness and a LocalBusiness. Optometric fits optometry practices and Optician fits glasses shops. Matching the values to your page matters more than the type." },
        { q: "Will publishing surgery numbers or post-op vision results help AI pick us?", a: "Any AI effect is unproven. Under Japan's medical advertising rules, claims of treatment effect and before/after photos are restricted. Check the conditions in the guidelines, the MHLW case book and with your public health centre, or your own country's rules." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services with prices and FAQ structured data, llms.txt, AI crawler settings and the AEO score are in the free plan. Paid plans add the always-current ruleset (Standard, USD 20 per month) and beta AI visibility measurement (Pro, from USD 99 per month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will my clinic be guaranteed to appear in ChatGPT?", a: "No. AI answers vary, and no tool or method can guarantee appearance or ranking. What you can do is make your clinic's facts readable to AI and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your eye clinic's website",
        body: "The free check needs no sign-up and shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies. This article is not legal or medical advice.",
    },
  },
};
