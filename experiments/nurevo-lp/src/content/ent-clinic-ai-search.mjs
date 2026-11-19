// Content page: AI search (AEO) for ENT clinics (耳鼻咽喉科). Industry page.
// Primary care has medical-clinic-ai-search, eye care eye-clinic-ai-search and
// skin clinics dermatology-clinic-ai-search; this one covers what is specific
// to ENT: seasonal demand (pollen season), sublingual immunotherapy (start
// timing, ages, supply), hearing tests and hearing aids (補聴器相談医, the shop
// as a separate business, the tax deduction document), and children.
//
// Written 2026-11-19 (JST). Every claim about Nurevo AEO comes from the
// plugin itself (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// - setup wizard "Clinic or dental" card = MedicalBusiness (includes/setup-wizard.php ~l.376);
//   the business type setting accepts any schema.org type name, so
//   "Otolaryngologic" can be entered.
// - services with price are published as Service with an Offer; the business
//   node passes through the filter webmcp_canary_business_node ($org, $settings)
//   (nurevo-webmcp.php ~l.6618). The plugin does not output medicalSpecialty.
// - per-page settings (leave out of llms.txt, page-only FAQ), readme 0.9.1/0.9.2.
//
// Outside facts, checked 2026-11-19 unless noted:
// - 日本耳鼻咽喉科免疫アレルギー感染症学会 鼻アレルギー診療ガイドライン委員会,
//   パブコメ回答 (2023-07, info20230706.pdf): cedar SLIT should start outside the
//   season; mite SLIT has in general no start-time limit; シダトレン discontinued;
//   current drugs シダキュア/ミティキュア (hold 1 min) and アシテア (until dissolved).
// - 日本医事新報 (product_9114, updated 2026-02-21): SLIT for cedar and mite
//   allergic rhinitis insured from 2014.
// - 鳥居薬品 release 2017-09-27 (jpx 140120170927479966.pdf): シダキュア approved,
//   first sublingual tablet usable in adults and children; trial ages 5-64;
//   prescribing limited to doctors with sufficient experience.
// - 日刊薬業 2018-02-16 (nk.jiho.jp 130656): ミティキュア pediatric approval;
//   previously 12 and over, age restriction removed.
// - 薬事日報 2025-02-14 (entry115954): シダキュア on limited shipment since 2023;
//   staged increase from autumn 2025; capacity 年間50万人分. Current status NOT confirmed.
// - 国税庁 個人課税課情報 第3号 (2018-04-16): hearing aid cost deductible when a
//   補聴器相談医 certifies need with 「補聴器適合に関する診療情報提供書（2018）」;
//   only the part not significantly above the usual level.
// - 滋賀県 (4536, updated 2025-08-06), 島根県 hotyouki page, 宮城県地方部会 flyer:
//   補聴器相談医 = commissioned by 日本耳鼻咽喉科頭頸部外科学会 (名簿 on jibika.or.jp);
//   認定補聴器技能者 / 認定補聴器専門店 certified by テクノエイド協会.
// - MHLW 医療広告等ガイドラインに関するQ&A: items as read for
//   dermatology-clinic-ai-search on 2026-11-16.
// - schema.org via schema-dts 2.1.0 (read 2026-11-19): Otolaryngologic and
//   Audiology are MedicalBusiness subtypes (LocalBusiness); Otolaryngologic,
//   Audiology and Pediatric are MedicalSpecialty values.
// Not confirmed and not written: an exact pediatric age floor in the package
// inserts, the required treatment length (one hospital leaflet says 3+ years is
// recommended; written as one facility's guidance), today's シダキュア supply.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  slitGuideline: "https://plaza.umin.ac.jp/jiaio/common/pdf/info20230706.pdf",
  slitInsured: "https://www.jmedj.co.jp/blogs/product/product_9114",
  cedarApproval: "https://www2.jpx.co.jp/disc/45510/140120170927479966.pdf",
  mitePediatric: "https://nk.jiho.jp/article/130656",
  cedarSupply: "https://www.yakuji.co.jp/entry115954.html",
  slitLeaflet: "https://www.osaka-med.jrc.or.jp/aboutus/pdf/allergen_shouni.pdf",
  ntaHearing: "https://www.nta.go.jp/law/joho-zeikaishaku/shotoku/shinkoku/180416/index.htm",
  shigaHearing: "https://www.pref.shiga.lg.jp/ed00/4536.html",
  shimaneHearing: "https://www.pref.shimane.lg.jp/medical/fukushi/kourei/kourei_sien/hotyouki.html",
  hearingDoctors: "https://www.jibika.or.jp/modules/certification/index.php?content_id=39",
  mhlwQa: "https://www.mhlw.go.jp/content/001683595.pdf",
  mhlwCases: "https://www.mhlw.go.jp/content/10800000/001232587.pdf",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  otolaryngologic: "https://schema.org/Otolaryngologic",
  audiology: "https://schema.org/Audiology",
  medicalSpecialty: "https://schema.org/medicalSpecialty",
};

const FILTER_CODE = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // 本文に書いている診療分野だけを足す（小児を診ない医院は Pediatric を入れない）
    $org['medicalSpecialty'] = array('Otolaryngologic', 'Pediatric');
    return $org;
}, 10, 2);`;

const FILTER_CODE_EN = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // Add only specialties your pages describe (drop Pediatric if you do not see children)
    $org['medicalSpecialty'] = array('Otolaryngologic', 'Pediatric');
    return $org;
}, 10, 2);`;

export default {
  slug: "ent-clinic-ai-search",
  targetQueries: [
    "AI search optimization for ENT clinics",
    "otolaryngology practice ChatGPT visibility",
    "Otolaryngologic schema markup",
    "耳鼻科 AI検索対策",
    "耳鼻咽喉科 LLMO 対策",
    "耳鼻科 ChatGPT 表示",
  ],
  related: ["medical-clinic-ai-search", "eye-clinic-ai-search", "pharmacy-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "耳鼻咽喉科のAI検索対策：花粉症・舌下免疫療法・補聴器の書き方 | Nurevo",
      description: "耳鼻咽喉科のAI検索対策は、季節で変わる受付と、舌下免疫療法・補聴器の条件を文字で書くこと。開始時期・対象年齢・医療費控除、構造化データ、WordPressの手順を解説。",
      h1: "耳鼻咽喉科のAI検索対策：花粉症の時期の受付、舌下免疫療法、聞こえと補聴器の情報をAIに正しく読ませる手順",
      lead: "耳鼻咽喉科のAI検索対策でいちばん大切なのは、「いつ・誰が・どの条件で受けられるか」を、診療ごとのページに日付つきの文字で書くことです。耳鼻咽喉科は、花粉の季節に受付や予約の方法が変わり、舌下免疫療法には始められる時期があり、補聴器では医院と販売店の役割が分かれるため、AIが古い情報や別の事業者の情報を混ぜやすい分野です。そのうえで、子どもを何歳から診るかを書き、医療広告のルールを守ったまま、同じ事実を構造化データ・llms.txt・Googleビジネスプロフィールにそろえます。",
      intro: [
        "作成日：2026年11月19日（JST）。舌下免疫療法の開始時期（日本耳鼻咽喉科免疫アレルギー感染症学会の委員会資料）、保険適用の時期（日本医事新報）、薬の承認と年齢（鳥居薬品の発表、日刊薬業）、出荷の状況（薬事日報）、補聴器の医療費控除（国税庁）と補聴器相談医・認定補聴器専門店（県の案内）、schema.orgの型（schema-dts 2.1.0の型定義）は同日に確認しました。厚生労働省の医療広告Q&Aの項目は2026年11月16日に確認した範囲です。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが医院の事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。この記事は法的・医学的な助言ではありません。個別の表現は管轄の保健所などで、薬の扱いは添付文書で確認してください。",
      ],
      sections: [
        {
          heading: "耳鼻咽喉科で、患者さんがAIに聞くこと",
          paragraphs: [
            "耳鼻咽喉科の質問は、症状のほかに「季節」「年齢」「手続き」が入るのが特徴です。子どもの中耳炎や鼻水を調べる保護者、親の聞こえを心配する家族もAIに聞きます。よく出る質問の型は次の6つです。",
          ],
          table: {
            head: ["質問の型", "例", "AIが答えに使う情報"],
            rows: [
              ["地域×症状×時間", "「◯◯駅の近くで、土曜の午後に子どもの耳の痛みを診てもらえる耳鼻科」", "曜日ごとの診療時間、受付の締め切り、予約制か順番受付か、対象年齢"],
              ["花粉症の時期", "「花粉症の薬だけもらいに行ける耳鼻科」「2月は混んでる？」", "季節の受付方法、オンライン受付の有無、混雑する時間帯の案内（医院の案内として）"],
              ["舌下免疫療法", "「スギの舌下免疫療法はいつから始められる？子どもは何歳から？」", "スギとダニの違い、始められる時期、対象年齢、通院の頻度、新規の受付状況"],
              ["聞こえ・補聴器", "「補聴器を買う前に耳鼻科に行くべき？医療費控除は？」", "聴力検査の内容、補聴器相談医がいるか、販売店との関係、書類の発行"],
              ["めまい・耳鳴り", "「めまいの検査ができる耳鼻科」「耳鳴りは何科？」", "できる検査の名前、予約が必要か、所要時間"],
              ["手術・紹介", "「鼻の日帰り手術ができる耳鼻科」「扁桃の手術はどこで？」", "院内でする手術と紹介する手術の区別、紹介先の種類、入院の有無"],
            ],
          },
          after: [
            "どの型も、AIが使えるのは条件が文字で書いてあるページです。診療時間が画像だけ、「花粉症の方は混雑します」だけ、舌下免疫療法の開始時期が書かれていない、というページは出典になりにくくなります。",
          ],
        },
        {
          heading: "上位の記事で抜けていたこと",
          paragraphs: [
            "「耳鼻科 AI検索対策」「クリニック LLMO」「ENT practice AI search」などで上位に出る記事を、日本語3本・英語5本読みました。日本語で耳鼻咽喉科に絞った記事はなく、クリニック・歯科全般の記事（医療広告のルールや医院情報の表記をそろえる話は実務的）と、AIに触れていないMEOの記事が中心でした。英語では、耳鼻咽喉科向けのAI検索の記事は米国のレビューサイトや認定制度を前提にした一般論で、「AIが医療の質問の63〜84%に出る」のような数字を出典なしで挙げる記事もありました。米国の耳鼻咽喉科学会の会報の記事は診察・請求でのAIの使い方が中心で、サイトの書き方は扱っていません。",
            "どの記事にもなかったのは、次の4点です。この記事はここを中心に書きます。",
          ],
          list: [
            "花粉の季節に変わる受付・予約の情報を、AIに古い情報として残さない書き方。",
            "舌下免疫療法のページに書く条件（スギとダニの開始時期の違い、対象年齢、保険、新規の受付状況）。",
            "補聴器で、医院（検査・補聴器相談医）と販売店（販売・調整）を分け、医療費控除の書類を正しく案内する書き方。",
            "耳鼻咽喉科を表すschema.orgの型（Otolaryngologic）と、WordPressでの具体的な設定、AIに出ているかの確かめ方。",
          ],
        },
        {
          heading: "季節で変わる受付は「期間つき」で書く",
          paragraphs: [
            "耳鼻咽喉科では、花粉の多い時期にWeb受付だけにする、受付の締め切りを早める、といった変更がよくあります。お知らせのページに「当面の間」と書いたまま季節が終わると、AIは翌年の夏になっても「予約はWebのみ」と答えかねません。季節の変更は、必ず期間を入れて書きます。",
          ],
          table: {
            head: ["書くこと", "書き方の例", "避けたい書き方"],
            rows: [
              ["変更の期間", "「2027年2月1日〜4月10日は、午前の受付をWeb受付のみにします」", "「花粉の時期はWeb受付のみ」「当面の間」"],
              ["変わらない部分", "「診療時間・休診日は通常どおりです」", "変更点だけを書き、何が変わらないかを書かない"],
              ["終わったあと", "期間が終わったらお知らせを消すか「終了しました」と書き、llms.txtから外す", "終わったお知らせを残したままにする"],
              ["電話での相談", "電話の受付時間と、電話で答えられる内容（予約の可否など）", "「お電話でお問い合わせください」だけ"],
            ],
          },
          after: [
            "通常の診療時間は、お知らせとは別の固定のページに、曜日と時刻の表を文字で書きます。そこに季節の例外を混ぜないことで、AIが通常の時間と例外を区別しやすくなります。",
          ],
        },
        {
          heading: "舌下免疫療法のページ：開始時期・年齢・受付状況を書く",
          paragraphs: [
            `舌下免疫療法は、スギ花粉症とダニによるアレルギー性鼻炎に対して2014年から保険適用されています。[日本医事新報](${SRC.slitInsured})。AIに聞かれやすいのは「いつ始められるか」と「子どもは何歳からか」です。日本耳鼻咽喉科免疫アレルギー感染症学会の鼻アレルギー診療ガイドライン委員会は、スギはシーズンを外して始めること、ダニは原則として開始時期の制限がないことを示しています（2023年7月現在の資料）。[委員会の回答（PDF）](${SRC.slitGuideline})。`,
            `年齢については、スギの舌下錠（シダキュア）は2017年9月に承認され、成人と小児に使える国内初の舌下錠と発表されました（臨床試験の対象は5〜64歳）。[鳥居薬品の発表（PDF）](${SRC.cedarApproval})。ダニの舌下錠（ミティキュア）は2018年2月に小児の追加承認を受け、それまでの「12歳以上」という制限がなくなりました。[日刊薬業](${SRC.mitePediatric})。実際に何歳から始めるかは医院の方針や診察で決まるため、ページには「当院では◯歳から、診察で判断します」のように自院の扱いを書きます。`,
            `供給にも注意が必要です。スギの舌下錠は需要の増加で2023年から限定出荷となり、2025年秋から段階的に出荷を増やす予定と報じられています。[薬事日報（2025年2月14日）](${SRC.cedarSupply})。新規の受付を止めている・待ちがある場合は、そのことを日付つきで書き、再開したら書き換えます。`,
          ],
          list: [
            "治療の名前と、スギ・ダニのどちらに対応しているか（片方だけなら明記）。",
            "始められる時期：スギはシーズンを外して始める、ダニは時期を問わない、など自院の方針。",
            "対象年齢：自院で何歳から行うか、保護者の同伴が必要か。",
            "流れ：診察と検査（アレルギーの確定）、初回の服用は院内で行うか、通院の頻度。",
            "期間：自院が案内している治療の期間の目安（ある医療機関の資料では3年以上が推奨と案内されています。[資料（PDF）](" + SRC.slitLeaflet + ")）。",
            "費用：保険診療であること、自己負担の目安を書く場合は条件（負担割合・薬の日数）つきで。",
            "新規の受付状況と、その更新日。",
          ],
        },
        {
          heading: "聞こえと補聴器：医院と販売店を分けて書く",
          paragraphs: [
            `補聴器は、買う前に耳鼻咽喉科で検査を受けることが自治体や学会の地方部会の案内で勧められています。補聴器相談医は日本耳鼻咽喉科頭頸部外科学会が委嘱する医師で、学会のサイトに名簿があります。販売・調整をするのは、公益財団法人テクノエイド協会が認定する認定補聴器技能者や認定補聴器専門店です。[滋賀県：補聴器の購入をお考えの方へ](${SRC.shigaHearing})、[島根県の案内](${SRC.shimaneHearing})、[補聴器相談医名簿](${SRC.hearingDoctors})。`,
            `医療費控除についても、AIがよく聞かれます。国税庁の情報では、補聴器相談医が「補聴器適合に関する診療情報提供書（2018）」で治療のために直接必要と認めた補聴器の購入費用は、一般的な水準を著しく超えない部分が医療費控除の対象になります（2018年4月16日）。[国税庁：補聴器の購入費用に係る医療費控除の取扱い](${SRC.ntaHearing})。医院が書けるのは「当院には補聴器相談医がいて、この書類を発行できるか」です。控除が受けられるかの判断は税務署にあるので、「必ず控除される」とは書きません。`,
          ],
          list: [
            "聞こえのページに、聴力検査の種類と所要時間、予約が必要かを書く。",
            "補聴器相談医が在籍しているなら、その医師の名前と曜日を書く。在籍していないなら書かない。",
            "診療情報提供書を発行できるか、発行の費用（自費か）を書く。",
            "医院の中や近くの補聴器販売店と連携している場合、同じ事業者か別の事業者かを書く。別なら、営業時間・電話番号・料金も分けて書く。",
            "障害者手帳の補装具の制度は市区町村の窓口が扱うことを書き、金額は書かない。",
          ],
        },
        {
          heading: "子どもの受診：何歳から、誰と来るかを書く",
          paragraphs: [
            "耳鼻咽喉科は、中耳炎や鼻水で子どもが多く受診します。保護者がAIに「0歳でも診てもらえる耳鼻科」と聞いたとき、対象年齢が書かれていないと、AIは医院を候補から外すか、推測で答えます。",
          ],
          list: [
            "何歳から診るか（「0歳から」「乳児は要相談」など）。",
            "保護者の同伴、子どもだけで受診できるか（年齢の目安つき）。",
            "持ち物：保険証・医療証など、医院の案内として（医療費の助成の内容は自治体ごとなので、制度名と自治体の窓口を案内する）。",
            "子どもの舌下免疫療法を行うか、何歳から行うか（上の節と同じ値にそろえる）。",
          ],
        },
        {
          heading: "医療広告のルールと、一般的な「AI対策」の助言がぶつかるところ",
          paragraphs: [
            "AI検索対策の記事では「口コミを増やす」「実績を見せる」がよく勧められます。医療機関のサイトでは、厚生労働省の医療広告ガイドラインとQ&Aに沿って扱いを決めます。",
          ],
          table: {
            head: ["よくある助言", "医療機関での扱い（厚生労働省のQ&A）", "代わりにできること"],
            rows: [
              ["患者さんの声を載せる", "治療の内容や効果についての体験談は掲載できない（Q1-18、Q2-9）", "流れ・期間・通院回数・費用の条件など、事実の説明を詳しくする"],
              ["「花粉症が治る」「聞こえが戻る」と効果を見せる", "治療効果の表現には制限がある。術前・術後の写真も治療効果の表現として扱われる（Q2-8、Q3-14）", "何が書けるかは事例解説書と保健所で確認する"],
              ["「地域No.1」「待たない耳鼻科」", "虚偽・誇大・比較優良の表示は禁止されている例として扱われる", "受付の方法や時間など、事実で書ける範囲だけを書く"],
              ["自費の検査・手術を詳しく書く", "自由診療は、治療の内容・費用、主なリスク・副作用、相談に答える問い合わせ先を書くことが条件（Q6-10〜6-12）", "条件を満たす形で、費用と主なリスクを同じページに書く"],
            ],
          },
          after: [
            `出典：[厚生労働省：医療広告等ガイドラインに関するQ&A（PDF）](${SRC.mhlwQa})、[事例解説書（PDF）](${SRC.mhlwCases})。FAQは「スギの舌下免疫療法はいつから始められますか」「補聴器の書類は出せますか」のような事実の質問にします。`,
          ],
        },
        {
          heading: "構造化データ：Otolaryngologicの型と、販売店は別に",
          paragraphs: [
            "schema.orgには、耳鼻咽喉科を表す型があります（2026年11月19日にschema-dts 2.1.0の型定義で確認）。",
          ],
          table: {
            head: ["型・プロパティ", "意味", "耳鼻咽喉科での使い方"],
            rows: [
              [`[Otolaryngologic](${SRC.otolaryngologic})`, "耳・鼻・のどとその病気を扱う分野。MedicalBusinessの一種で、LocalBusinessの一種", "耳鼻咽喉科の医院の型に。住所・電話番号・診療時間をそのまま持てる"],
              [`[Audiology](${SRC.audiology})`, "聞こえ・平衡（バランス）などの診断と、手術以外の管理を扱う分野。MedicalBusinessの一種", "聞こえを専門にする施設向け。耳鼻咽喉科の医院はOtolaryngologicを使い、分野として足すなら medicalSpecialty に"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "診療の分野。値に Otolaryngologic・Audiology・Pediatric がある", "本文に書いている分野だけを入れる"],
              ["補聴器の販売店", "医院とは別の事業者なら別の情報", "医院の型や情報に混ぜない。販売店は自店のサイトや情報として扱う"],
              ["Service と offers", "提供するサービスと、その料金", "自費の検査・書類の発行など、料金を本文に書いているものだけを登録する"],
            ],
          },
          after: [
            `Googleは、AIによる概要などのために特別な構造化データは不要で、構造化データはページに見えている内容と一致させるよう案内しています。[Google：AI features and your website](${SRC.googleAi})。保険診療の自己負担は人によって変わるため、構造化データに固定の料金として入れないでください。`,
          ],
        },
        {
          heading: "WordPressの耳鼻咽喉科サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「クリニック・歯科」を選びます（型はMedicalBusinessになります）。そのあと設定画面の「業種（schema.org型）」欄を Otolaryngologic に変えます。この欄にはschema.orgの型名をそのまま入れられます。",
            "医院名・住所・電話番号・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "営業時間は「月〜金 9:00-12:30 15:00-18:30 / 土 9:00-12:30」のように曜日と時刻だけを書きます。受付の締め切り・季節の受付方法は、本文の表とお知らせに書きます。",
            "自費の検査や書類の発行など、料金を本文に書いているものだけを設定画面のサービスに1つずつ登録します。名前・説明・料金・通貨を入れると、料金つきのサービス（Service と Offer）として出力されます。料金は本文と同じ値にします。",
            "舌下免疫療法・聞こえ・子どもの受診の各ページの編集画面のサイドバーで、そのページだけのFAQ（「スギはいつから始められますか」「何歳から診てもらえますか」「補聴器の書類は出せますか」）を入れます。体験談や効果を約束する答えは入れません。終わった季節のお知らせは「このページをllms.txtに載せない」にします。",
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
            "曜日ごとの診療時間と受付の締め切りが、固定のページに文字で書かれている。",
            "季節の受付の変更に、開始日と終了日が書かれている。終わったお知らせは消すか「終了」と書き、llms.txtから外している。",
            "舌下免疫療法のページに、スギ・ダニのどちらか、始められる時期、対象年齢、新規の受付状況と更新日がある。",
            "聞こえのページに、検査の内容、補聴器相談医の有無、書類の発行の可否と費用がある。",
            "補聴器の販売店と医院が別の事業者なら、営業時間・電話番号・料金を分けて書いている。",
            "対象年齢と、保護者の同伴の決まりが書かれている。",
            "体験談・効果の約束・最上級や比較の言葉が、本文・FAQ・構造化データに入っていない。",
            "構造化データの型がOtolaryngologicで、料金は本文と一致している。保険の自己負担を固定の料金として入れていない。",
            "名前・住所・電話番号・診療時間が、構造化データ・Googleビジネスプロフィール・医療情報ネットと一致している。[クリニックの基本](/guide/medical-clinic-ai-search)",
            "llms.txtに、診療案内・舌下免疫療法・聞こえ・アクセスのページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、患者さんや保護者が聞きそうな質問を「地域×症状×曜日」「地域×舌下免疫療法×開始時期」「地域×子ども×耳の痛み」「地域×補聴器×相談」の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げます。医院が名前やURLで出るか、開始時期・対象年齢・受付方法が正しく書かれているかを記録します。花粉の時期と、それ以外の時期の両方で確かめると、季節の情報が古いまま残っていないかが分かります。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（医院名は含めません）をPerplexityに投げ、回答に医院の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に医院が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "耳鼻咽喉科のAI検索対策は、何から始めればいいですか？", a: "曜日ごとの診療時間と受付の締め切りを固定のページに文字で書き、季節の変更は期間つきのお知らせにすることからです。次に舌下免疫療法・聞こえ・子どもの受診のページに条件を書き、名前・住所・電話番号・診療時間を構造化データ・Googleビジネスプロフィールとそろえます。" },
        { q: "舌下免疫療法の開始時期は、どう書けばいいですか？", a: "スギとダニを分けて書きます。学会の委員会の資料では、スギはシーズンを外して始め、ダニは原則として開始時期の制限がないとされています。そのうえで、自院がいつ新規の受付をしているかを日付つきで書きます。" },
        { q: "子どもの舌下免疫療法は何歳から、と書いてもいいですか？", a: "自院の方針として書くのがよい方法です。ダニの舌下錠は2018年に「12歳以上」の制限がなくなり、スギの舌下錠は成人と小児に使える薬として承認されています。実際に始める年齢は診察で判断することも一緒に書きます。" },
        { q: "補聴器の医療費控除について、医院のサイトに何を書けますか？", a: "補聴器相談医が在籍しているか、「補聴器適合に関する診療情報提供書（2018）」を発行できるか、その費用です。控除が受けられるかは税務署の判断なので、「必ず控除される」とは書かず、国税庁の情報にリンクします。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgのOtolaryngologicが耳鼻咽喉科を表す型で、MedicalBusinessとLocalBusinessの一種です。小児も診るなら medicalSpecialty に Pediatric を足せます。補聴器の販売店が別の事業者なら、医院の情報に混ぜません。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・診療時間・サービスと料金・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに耳鼻科が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが医院の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが耳鼻咽喉科のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。シダキュア、ミティキュアは鳥居薬品株式会社の商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的・医学的な助言ではありません。",
    },
    en: {
      title: "AI Search for ENT Clinics: Allergy, Hearing, Schema | Nurevo",
      description: "AEO for ENT clinics: date your seasonal booking changes, state immunotherapy start timing, ages and intake, keep hearing aid shops separate, use Otolaryngologic.",
      h1: "AI search for ENT clinics: how to publish pollen-season booking, sublingual immunotherapy and hearing aid information so AI reads it correctly",
      lead: "The single most useful thing an ENT (ear, nose and throat) clinic can do for AI search is to state, in dated text on each service page, when, for whom and under what conditions a service is available. ENT clinics change how they take patients during pollen season, sublingual immunotherapy can only be started at certain times, and hearing aids split the work between the clinic and a shop, so AI tools easily mix in out-of-date notices or another business's details. Then say from what age you see children, follow the medical advertising rules, and publish the same facts in your structured data, llms.txt and Google Business Profile.",
      intro: [
        "Written November 19, 2026 (JST). The examples come from Japan, where Nurevo is based. Immunotherapy start timing (a guideline committee of 日本耳鼻咽喉科免疫アレルギー感染症学会), insurance coverage (Japan Medical Journal), drug approvals and ages (a Torii Pharmaceutical release and Nikkan Yakugyo), supply (Yakuji Nippo), the hearing aid tax deduction (National Tax Agency) and the hearing aid advisor and certified shop schemes (prefectural guides), and the schema.org types (schema-dts 2.1.0 type definitions) were checked that day. The Ministry of Health, Labour and Welfare (MHLW) medical advertising Q&A items are as checked on November 16, 2026. Outside Japan, insurance, tax and advertising rules differ: check your own country's rules.",
        "AI answers change by day and by how a question is asked. This guide makes your clinic's facts readable to AI. It does not guarantee that you will appear in AI answers or rank higher. It is not legal or medical advice. Check drug details against the package insert.",
      ],
      sections: [
        {
          heading: "What patients ask AI about ENT clinics",
          paragraphs: [
            "ENT questions are not only about symptoms. They carry season, age and process. Parents ask about a child's ear pain or runny nose, and adult children ask about a parent's hearing. Six question types come up most.",
          ],
          table: {
            head: ["Question type", "Example", "What AI uses to answer"],
            rows: [
              ["Area × symptom × time", "\"An ENT near X station that sees children with ear pain on Saturday afternoon\"", "Hours by day, last check-in time, appointments or queue, ages seen"],
              ["Pollen season", "\"An ENT where I can just get hay fever medicine\" \"Is it busy in February?\"", "Seasonal check-in rules, online check-in, busy times (as the clinic's own guidance)"],
              ["Sublingual immunotherapy", "\"When can I start cedar pollen immunotherapy? From what age for kids?\"", "Cedar vs dust mite, when you can start, ages, visit frequency, whether new patients are taken"],
              ["Hearing and hearing aids", "\"Should I see an ENT before buying a hearing aid? Is it tax deductible?\"", "Hearing tests offered, whether a hearing aid advisor doctor is on staff, the shop relationship, documents issued"],
              ["Dizziness and tinnitus", "\"An ENT that tests for dizziness\" \"Which doctor for ringing in the ears?\"", "Names of tests offered, whether booking is needed, how long it takes"],
              ["Surgery and referral", "\"An ENT that does day surgery on the nose\" \"Where do I get tonsil surgery?\"", "Which operations are done in-house and which are referred, referral destinations, inpatient or not"],
            ],
          },
          after: [
            "In every case, AI can only use pages that state the conditions in text. Hours shown only as an image, a notice that just says \"busy during hay fever season\", or an immunotherapy page with no start timing are unlikely to be cited.",
          ],
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read the top results for queries such as \"耳鼻科 AI検索対策\", \"クリニック LLMO\" and \"ENT practice AI search\": three in Japanese and five in English. None of the Japanese articles focused on ENT; they covered clinics and dentists in general (their points on advertising rules and consistent clinic details are practical) or MEO without mentioning AI. The English ENT-focused AI search pages were generic and built around US review sites and board certifications, and some quoted figures such as \"AI appears on 63–84% of healthcare queries\" with no source. An article in the US academy's bulletin covered AI in the exam room and billing, not how to write the website.",
            "None of them covered these four points, which are the focus of this guide.",
          ],
          list: [
            "How to write pollen-season booking changes so AI does not keep repeating them after the season.",
            "What an immunotherapy page needs: different start timing for cedar and dust mite, ages, insurance and whether new patients are accepted.",
            "How to keep the clinic (tests, hearing aid advisor doctor) apart from the shop (sales, fitting), and describe the tax deduction document correctly.",
            "The schema.org type for ENT (Otolaryngologic), concrete WordPress settings, and how to check whether you appear in AI answers.",
          ],
        },
        {
          heading: "Write seasonal changes with start and end dates",
          paragraphs: [
            "ENT clinics often switch to online check-in only or close check-in earlier during pollen season. If a notice says \"until further notice\" and stays up after the season, AI may still answer \"online check-in only\" the following summer. Always give seasonal changes a period.",
          ],
          table: {
            head: ["What to write", "Example", "Avoid"],
            rows: [
              ["The period", "\"From February 1 to April 10, 2027, morning check-in is online only\"", "\"Online only during pollen season\", \"until further notice\""],
              ["What stays the same", "\"Opening hours and closed days are unchanged\"", "Listing only the change, not what stays the same"],
              ["Afterwards", "Remove the notice or mark it \"ended\" once the period is over, and take it out of llms.txt", "Leaving ended notices online"],
              ["Phone enquiries", "Phone hours and what staff can answer by phone (such as availability)", "Only \"please call us\""],
            ],
          },
          after: [
            "Keep your regular hours on a fixed page as a text table of days and times, separate from notices. Not mixing seasonal exceptions into it helps AI tell the normal hours from the exceptions.",
          ],
        },
        {
          heading: "The immunotherapy page: start timing, ages and intake",
          paragraphs: [
            `In Japan, sublingual immunotherapy has been covered by insurance since 2014 for cedar pollen allergy and dust mite allergic rhinitis. [Japan Medical Journal (Japanese)](${SRC.slitInsured}). The questions AI hears most are \"when can I start?\" and \"from what age for children?\". The allergic rhinitis guideline committee of Japan's ENT immunology, allergy and infection society (日本耳鼻咽喉科免疫アレルギー感染症学会) says cedar treatment should be started outside the pollen season, and that dust mite treatment has, in general, no start-time restriction (document as of July 2023). [Committee answers (PDF, Japanese)](${SRC.slitGuideline}).`,
            `On ages: the cedar pollen tablet (シダキュア) was approved in September 2017 and announced as Japan's first sublingual tablet usable in both adults and children (the clinical trial enrolled ages 5 to 64). [Torii Pharmaceutical release (PDF, Japanese)](${SRC.cedarApproval}). The dust mite tablet (ミティキュア) received an additional approval for children in February 2018, removing the earlier \"12 and over\" restriction. [Nikkan Yakugyo (Japanese)](${SRC.mitePediatric}). The age at which a child actually starts depends on the clinic and the examination, so write your own practice: \"we start from age X, decided at the consultation\".`,
            `Supply matters too. Yakuji Nippo reported that the cedar tablet has been on limited shipment since 2023 because of rising demand, with shipments planned to increase in stages from autumn 2025. [Yakuji Nippo, February 14, 2025 (Japanese)](${SRC.cedarSupply}). If you have paused new patients or have a waiting list, say so with a date, and update it when you reopen.`,
          ],
          list: [
            "The treatment name and whether you treat cedar, dust mite or both (say so if only one).",
            "When patients can start: for example, cedar outside the season and dust mite at any time, as your clinic's practice.",
            "Ages: from what age you offer it, and whether a parent must attend.",
            "Process: consultation and tests to confirm the allergy, whether the first dose is taken at the clinic, visit frequency.",
            "Length: the treatment length your clinic advises (one hospital's leaflet says three years or more is recommended. [Leaflet (PDF, Japanese)](" + SRC.slitLeaflet + ")).",
            "Cost: that it is insured care; if you give an out-of-pocket estimate, state the conditions (co-payment rate, days of medicine).",
            "Whether you are taking new patients, and the date that was last updated.",
          ],
        },
        {
          heading: "Hearing and hearing aids: keep the clinic and the shop apart",
          paragraphs: [
            `Prefectural guides and a regional branch of the national ENT society advise having an ENT examination before buying a hearing aid. In Japan, a hearing aid advisor doctor (補聴器相談医) is commissioned by the Japan Society of Otorhinolaryngology-Head and Neck Surgery, which publishes a list on its site. Sales and fitting are done by certified hearing aid technicians and certified hearing aid shops, certified by the Association for Technical Aids. [Shiga Prefecture guide (Japanese)](${SRC.shigaHearing}), [Shimane Prefecture guide (Japanese)](${SRC.shimaneHearing}), [Hearing aid advisor doctor list (Japanese)](${SRC.hearingDoctors}).`,
            `AI is also often asked about the tax deduction. According to the National Tax Agency (April 16, 2018), when a hearing aid advisor doctor certifies, using the \"information document on hearing aid fitting (2018)\", that a hearing aid is directly necessary for medical care, its cost qualifies for the medical expense deduction, limited to the part that is not significantly above the usual level. [National Tax Agency (Japanese)](${SRC.ntaHearing}). What a clinic can state is whether it has a hearing aid advisor doctor and can issue this document. The tax office decides whether the deduction applies, so do not write \"you will get the deduction\".`,
          ],
          list: [
            "On the hearing page, list the hearing tests, how long they take and whether booking is needed.",
            "If a hearing aid advisor doctor works at the clinic, give their name and days. If not, do not say so.",
            "State whether you can issue the information document and what it costs (if self-pay).",
            "If you work with a hearing aid shop inside or near the clinic, say whether it is the same business or a separate one. If separate, give its own hours, phone number and prices.",
            "Say that disability benefits for assistive devices are handled by the local municipality, and do not quote amounts.",
          ],
        },
        {
          heading: "Children: from what age, and who comes with them",
          paragraphs: [
            "ENT clinics see many children for ear infections and runny noses. When a parent asks AI for \"an ENT that sees babies\", a page with no age information means AI either drops the clinic or guesses.",
          ],
          list: [
            "From what age you see children (\"from birth\", \"infants by arrangement\" and so on).",
            "Whether a parent must attend, and whether older children can come alone (with an age guide).",
            "What to bring, as the clinic's guidance (medical cost subsidies differ by municipality in Japan, so name the scheme and point to the local office).",
            "Whether you offer immunotherapy to children and from what age (the same value as in the section above).",
          ],
        },
        {
          heading: "Where common AI advice collides with medical advertising rules",
          paragraphs: [
            "AI search guides often say \"get more reviews\" and \"show results\". On a medical website in Japan, follow the MHLW medical advertising guidelines and their Q&A.",
          ],
          table: {
            head: ["Common advice", "How it applies to clinics (MHLW Q&A)", "What to do instead"],
            rows: [
              ["Publish patient testimonials", "Testimonials about treatment content or effect cannot be published (Q1-18, Q2-9)", "Explain the facts in detail: process, length, visit frequency, cost conditions"],
              ["Show results such as \"cures hay fever\" or \"restores hearing\"", "Claims of treatment effect are restricted; before/after photos count as effect claims (Q2-8, Q3-14)", "Check what you can say in the MHLW case book and with your public health centre"],
              ["\"No. 1 in the area\", \"the ENT with no wait\"", "False, exaggerated or comparative claims are treated as prohibited examples", "State only what you can as fact, such as check-in method and times"],
              ["Describe self-pay tests and surgery in detail", "For self-pay care, the content and cost, main risks and side effects, and a contact point that answers questions must be given (Q6-10 to 6-12)", "Put the fee and main risks on the same page, meeting those conditions"],
            ],
          },
          after: [
            `Sources: [MHLW medical advertising guidelines Q&A (PDF, Japanese)](${SRC.mhlwQa}), [MHLW case book (PDF, Japanese)](${SRC.mhlwCases}). Keep FAQs to factual questions such as \"When can I start cedar immunotherapy?\" and \"Can you issue the hearing aid document?\".`,
          ],
        },
        {
          heading: "Structured data: the Otolaryngologic type, and the shop kept separate",
          paragraphs: [
            "schema.org has a type for ENT practices (checked in the schema-dts 2.1.0 type definitions on November 19, 2026).",
          ],
          table: {
            head: ["Type or property", "Meaning", "How an ENT clinic uses it"],
            rows: [
              [`[Otolaryngologic](${SRC.otolaryngologic})`, "The branch dealing with the ear, nose and throat and their diseases. A MedicalBusiness and a LocalBusiness", "The type for an ENT clinic. It carries address, phone and opening hours directly"],
              [`[Audiology](${SRC.audiology})`, "Diagnosis and non-surgical management of hearing, balance and related disorders. A MedicalBusiness", "For facilities that specialise in hearing. An ENT clinic uses Otolaryngologic and can add Audiology as a medicalSpecialty"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "The clinical specialty. Values include Otolaryngologic, Audiology and Pediatric", "Add only specialties your pages describe"],
              ["Hearing aid shop", "A separate business has its own details", "Do not merge it into the clinic's type or details"],
              ["Service and offers", "A service you provide and its price", "Register only items whose price appears on the page, such as self-pay tests or documents"],
            ],
          },
          after: [
            `Google says no special structured data is needed for AI Overviews and similar features, and that structured data should match the visible content of the page. [Google: AI features and your website](${SRC.googleAi}). Insured out-of-pocket costs vary by patient, so do not enter them as a fixed price in structured data.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress ENT clinic site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). It works alongside Yoast SEO, Rank Math, All in One SEO and Slim SEO. Since 0.9.1 it also works with SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.`,
            "In the setup wizard, choose \"Clinic or dental\" (the type becomes MedicalBusiness). Then change the \"Business type (schema.org type)\" field in settings to Otolaryngologic. The field accepts any schema.org type name.",
            "Check the clinic name, address, phone and description. Only empty fields are filled from existing settings; values you have entered are not overwritten.",
            "Enter opening hours as days and times only, such as \"Mon-Fri 9:00-12:30 15:00-18:30 / Sat 9:00-12:30\". Put last check-in times and seasonal check-in rules in the page table and notices.",
            "Register as services only items whose price appears on the page, such as self-pay tests or document fees, one at a time. With a name, description, price and currency they are output as priced services (Service and Offer). Keep the price the same as the page.",
            "In the editor sidebar of the immunotherapy, hearing and children pages, add page-only FAQs (\"When can I start cedar treatment?\", \"From what age do you see children?\", \"Can you issue the hearing aid document?\"). Do not add testimonials or promised results. Set ended seasonal notices to \"Leave this page out of llms.txt\".",
            "Run the check on the AEO score screen and fix gaps with one-click fixes. See how your site looks from outside with the [free AI readability check](/check).",
          ],
        },
        {
          heading: "Adding medicalSpecialty",
          paragraphs: [
            "Nurevo AEO does not output medicalSpecialty on its own. To add it, use the filter that changes the business structured data (webmcp_canary_business_node) in your theme's functions.php or a small plugin.",
          ],
          code: FILTER_CODE_EN,
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Hours by day and last check-in times are on a fixed page as text.",
            "Seasonal check-in changes have a start and end date. Ended notices are removed or marked \"ended\" and taken out of llms.txt.",
            "The immunotherapy page states cedar, mite or both, when patients can start, ages, and whether new patients are taken, with the update date.",
            "The hearing page lists tests, whether a hearing aid advisor doctor is on staff, and whether you can issue the document and at what cost.",
            "If the hearing aid shop is a separate business, its hours, phone and prices are given separately.",
            "Ages seen and the rule on parents attending are stated.",
            "No testimonials, promised results, superlatives or comparisons in the page text, FAQs or structured data.",
            "The structured data type is Otolaryngologic and prices match the page. Insured out-of-pocket costs are not entered as fixed prices.",
            "Name, address, phone and hours match across structured data, Google Business Profile and the official medical directory. [Clinic basics](/guide/medical-clinic-ai-search)",
            "llms.txt lists the services, immunotherapy, hearing and access pages. [What is llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the pages are in order, write five to ten questions patients and parents might ask, combining area × symptom × day, area × immunotherapy × start timing, area × child × ear pain and area × hearing aid × consultation. Ask them in ChatGPT and Perplexity. Record whether your clinic appears by name or URL, and whether start timing, ages and check-in rules are stated correctly. Check both during pollen season and outside it to catch seasonal notices that have gone stale. AI answers change each time, so ask the same questions several times, spaced out. See [how to measure AI visibility](/guide/measure-ai-visibility).",
            "In Nurevo AEO, even the Free and Standard plans ask Perplexity three questions built from your business type and area (without your clinic's name) once a month, and record whether your name or site appeared. The Pro plan (from USD 99 per month) adds beta AI visibility measurement: how often your clinic appears in AI answers, compared with competitors and over time (Perplexity is measured today). Both look at samples of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should an ENT clinic start with AI search?", a: "Put hours by day and last check-in times on a fixed page as text, and publish seasonal changes as dated notices. Then add the conditions to your immunotherapy, hearing and children pages, and make your name, address, phone and hours match across structured data and Google Business Profile." },
        { q: "How should we describe immunotherapy start timing?", a: "Write cedar and dust mite separately. A guideline committee document in Japan says cedar treatment should start outside the pollen season and dust mite treatment has, in general, no start-time restriction. Then state, with a date, when your clinic takes new patients." },
        { q: "Can we say from what age children can start immunotherapy?", a: "Yes, as your clinic's practice. In Japan the dust mite tablet's \"12 and over\" restriction was removed in 2018, and the cedar tablet was approved for adults and children. Also say that the starting age is decided at the consultation." },
        { q: "What can a clinic website say about the hearing aid tax deduction?", a: "Whether a hearing aid advisor doctor is on staff, whether you can issue the information document on hearing aid fitting (2018), and its cost. The tax office decides whether the deduction applies, so do not promise it; link to the National Tax Agency's information." },
        { q: "Which structured data type should we use?", a: "schema.org's Otolaryngologic is the type for ENT practices; it is a MedicalBusiness and a LocalBusiness. If you see children, you can add Pediatric as a medicalSpecialty. If the hearing aid shop is a separate business, keep it out of the clinic's details." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services with prices and FAQ structured data, llms.txt, AI crawler settings and the AEO score are in the free plan. Paid plans add the always-current ruleset (Standard, USD 20 per month) and beta AI visibility measurement (Pro, from USD 99 per month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will my clinic be guaranteed to appear in ChatGPT?", a: "No. AI answers vary, and no tool or method can guarantee appearance or ranking. What you can do is make your clinic's facts readable to AI and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your ENT clinic's website",
        body: "The free check needs no sign-up and shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. シダキュア and ミティキュア are trademarks of Torii Pharmaceutical Co., Ltd. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies. This guide is not legal or medical advice.",
    },
  },
};
