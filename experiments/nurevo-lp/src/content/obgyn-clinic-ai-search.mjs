// Content page: AI search (AEO) for obstetrics & gynecology clinics
// (産婦人科・婦人科・レディースクリニック). Industry page. Primary care is
// medical-clinic-ai-search; this one covers what is specific to OB/GYN:
// delivery booking timing, the childbirth lump-sum and the planned change to
// delivery costs, epidural (無痛分娩) disclosure in the JALA format, 出産なび and
// 産科医療補償制度 consistency, and the Obstetric / Gynecologic schema.org types.
//
// Written 2026-11-20 (JST). Every claim about Nurevo AIO comes from the plugin
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary) as already used in
// ent-clinic-ai-search (2026-11-19): wizard "クリニック・歯科" = MedicalBusiness;
// the business type field accepts any schema.org type name; priced services are
// Service + Offer; the business node passes through webmcp_canary_business_node;
// the plugin does not output medicalSpecialty; page-only FAQ and "leave out of
// llms.txt" per page. Display name Nurevo AIO since 0.9.2 (readme).
//
// Outside facts, read 2026-11-20:
// - 協会けんぽ 出産育児一時金: 50万円 per child for births on/after 2023-04-01 at a
//   facility in 産科医療補償制度 at 22 weeks or later; 48.8万円 under 22 weeks;
//   直接支払制度; 受取代理制度 (within 2 months of due date, notified facilities).
// - MHLW overview of 健康保険法等の一部を改正する法律（令和8年法律第31号, promulgated
//   2026-06-05): 分娩費 base unit price paid by insurers to the facility (現物給付),
//   plus a flat cash benefit; within 2 years of promulgation on a date set by
//   cabinet order; facilities may stay on the current system for the time being.
//   MHLW 検討会 doc 2026-10-01 confirms. Start date / amounts NOT confirmed: not written.
// - 出産なび leaflet + MHLW doc: launched 2024-05-30, 2,097 facilities as of
//   2026-02-20; facilities using 直接支払制度 with 21+ deliveries/yr (smaller opt in);
//   cost data updated quarterly from billing data.
// - MHLW 告示第226号 (2015): checkups ~14 times; MHLW survey: all municipalities
//   subsidise 14+ visits (2022-04-01).
// - MHLW 無痛分娩 self-inspection checklist (令和7年5月版): 9 disclosure items on the
//   facility site and JALA site, updated at least yearly.
// - 政府広報オンライン 産科医療補償制度: symbol mark, 加入分娩機関検索.
// - Hospital booking guidance: 愛育病院 FAQ (通常8〜9週), 日赤医療センター (20週まで).
// - Survey press release (2026-09-24, AtPress via excite): ChatGPT clinic search,
//   5,460 answers; for 料金 questions the clinic's own site was cited in 96%.
// - schema.org V30.1: Obstetric, Gynecologic are MedicalSpecialty values and
//   MedicalBusiness (LocalBusiness) subtypes.
// Not written: "popular hospitals fill up early" (no official source), the
// non-enrolled facility lump-sum amount, the new system's start date and amounts.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  lumpSum: "https://www.kyoukaikenpo.or.jp/benefit/childbirth/002",
  law2026: "https://www.mhlw.go.jp/content/12400000/001713111.pdf",
  mhlwMeeting: "https://www.mhlw.go.jp/content/12401000/001754832.pdf",
  birthNavi: "https://birth-navi.mhlw.go.jp/assets/leaflet-CWn72mWw.pdf",
  checkups: "https://www.mhlw.go.jp/web/t_doc?dataId=82ab4662&dataType=0&pageNo=1",
  checkupSurvey: "https://www.mhlw.go.jp/content/11908000/000552443.pdf",
  epiduralChecklist: "https://www.mhlw.go.jp/content/10800000/001488916.pdf",
  compensation: "https://www.gov-online.go.jp/article/201306/entry-9179.html",
  aiiku: "https://www.aiiku.net/clinic/files/sanka_question.pdf",
  jrc: "https://www.med.jrc.or.jp/Portals/0/resources/hospital/clinic/sanka/mternity_note/maternity_02_20250912.pdf",
  survey: "https://www.excite.co.jp/news/article/Atpress_633888/",
  mhlwQa: "https://www.mhlw.go.jp/content/001683595.pdf",
  mhlwCases: "https://www.mhlw.go.jp/content/10800000/001232587.pdf",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  obstetric: "https://schema.org/Obstetric",
  gynecologic: "https://schema.org/Gynecologic",
  medicalSpecialty: "https://schema.org/medicalSpecialty",
};

const FILTER_CODE = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // 本文に書いている診療分野だけを足す（分娩を扱わない婦人科は Obstetric を入れない）
    $org['medicalSpecialty'] = array('Obstetric', 'Gynecologic');
    return $org;
}, 10, 2);`;

const FILTER_CODE_EN = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // Add only specialties your pages describe (drop Obstetric if you do not deliver babies)
    $org['medicalSpecialty'] = array('Obstetric', 'Gynecologic');
    return $org;
}, 10, 2);`;

export default {
  slug: "obgyn-clinic-ai-search",
  targetQueries: [
    "AI search optimization for OB-GYN clinics",
    "obstetrics clinic ChatGPT visibility",
    "Obstetric Gynecologic schema markup",
    "産婦人科 AI検索対策",
    "婦人科 クリニック LLMO 対策",
    "産婦人科 ChatGPT 表示",
  ],
  related: ["medical-clinic-ai-search", "ent-clinic-ai-search", "dermatology-clinic-ai-search", "measure-ai-visibility", "local-business-schema-seo-plugins"],
  locales: {
    ja: {
      title: "産婦人科のAI検索対策：分娩予約・費用・無痛分娩の書き方 | Nurevo",
      description: "産婦人科のAI検索対策は、分娩予約の期限、費用と出産育児一時金、無痛分娩の体制を日付つきの文字で書くこと。出産なびとの一致、構造化データ、WordPressの手順を解説。",
      h1: "産婦人科・婦人科のAI検索対策：分娩予約の期限、費用、無痛分娩の情報をAIに正しく読ませる手順",
      lead: "産婦人科のAI検索対策でいちばん大切なのは、「何週までに、どうやって分娩を予約するか」「費用はいくらで、出産育児一時金とどう関係するか」「無痛分娩をどの体制で行うか」を、日付つきの文字でサイトに書くことです。妊娠が分かった人は、病院を選ぶ前にAIへ質問します。そのとき医院のサイトに条件が書かれていないと、AIは古い口コミや比較サイト、別の病院の情報で答えます。そのうえで、同じ事実を出産なび・産科医療補償制度の表示・構造化データ・Googleビジネスプロフィールにそろえます。",
      intro: [
        "作成日：2026年11月20日（JST）。出産育児一時金（協会けんぽ）、2026年の健康保険法等の改正（厚生労働省の概要資料）、出産なび（厚生労働省のリーフレットと検討会資料）、妊婦健診の回数（厚生労働省告示と調査）、無痛分娩の情報公開の項目（厚生労働省の自主点検表 令和7年5月版）、産科医療補償制度（政府広報オンライン）、schema.orgの型（V30.1）は同日に確認しました。厚生労働省の医療広告Q&Aの項目は2026年11月16日に確認した範囲です。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが医院の事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。この記事は法的・医学的な助言ではありません。個別の表現は管轄の保健所などで確認してください。",
      ],
      sections: [
        {
          heading: "妊娠中の人と家族が、AIに聞くこと",
          paragraphs: [
            "産婦人科の質問は、症状よりも「時期」「費用」「体制」が中心です。里帰り出産を考える人や、パートナー・親が代わりに調べることもあります。婦人科の外来では、検診やピル、更年期の相談が多くなります。よく出る質問の型は次の6つです。",
          ],
          table: {
            head: ["質問の型", "例", "AIが答えに使う情報"],
            rows: [
              ["分娩の予約", "「◯◯市で出産できる病院、何週までに予約が必要？」", "分娩を扱うか、予約の期限（週数）、予約の方法、予約金の有無、紹介状が必要か"],
              ["費用", "「◯◯クリニックの出産費用は？一時金でいくら足りる？」", "費用の目安と条件（個室・時間外など）、直接支払制度に対応しているか"],
              ["無痛分娩", "「無痛分娩ができる産院」「24時間対応？」", "実施しているか、計画分娩か、麻酔を担当する医師、実施件数、追加費用"],
              ["里帰り出産", "「里帰り出産は受け入れている？いつ転院すればいい？」", "受け入れの有無、連絡の時期、受診してほしい週数"],
              ["妊婦健診だけ", "「健診だけ通えて、出産は別の病院の産婦人科」", "健診のみの受け入れ、提携する分娩先、受診券が使えるか"],
              ["婦人科の外来", "「土曜に子宮がん検診を受けられる婦人科」「女性医師がいる？」", "曜日ごとの診療時間、検診の種類と予約の要否、医師の担当日"],
            ],
          },
          after: [
            `どの型も、AIが使えるのは条件が文字で書いてあるページです。ある会社がChatGPTのクリニック検索の回答5,460件を調べたプレスリリースでは、料金の質問の回答の96%で、クリニック自身のサイトが出典に使われていました（2026年9月、調査会社自身の調査）。[プレスリリース](${SRC.survey})。費用や予約の条件は、自院のサイトに書くほど答えに使われやすい情報です。`,
          ],
        },
        {
          heading: "上位の記事で抜けていたこと",
          paragraphs: [
            "「産婦人科 AI検索対策」「婦人科 LLMO」「OB-GYN AI search optimization」などで上位に出る記事を、日本語7本・英語6本読みました。日本語は、クリニック全般のAI対策の記事（医療広告のルールや医院情報の表記をそろえる話は実務的）と、AIに触れていない産婦人科の集患の記事に分かれ、産婦人科の項目は表の1行程度でした。英語は、ツールの紹介や6ステップの一般論が中心で、「口コミが50件あればよい」「Perplexityは30〜60日で反映」のような出典のない数字もありました。",
            "どの記事にもなかったのは、次の5点です。この記事はここを中心に書きます。",
          ],
          list: [
            "分娩予約の期限・方法を、AIが答えに使える形で書くこと。",
            "費用を、出産育児一時金（50万円）と、2026年に法改正された新しい仕組みに触れながら、正しい範囲で書くこと。",
            "無痛分娩の情報を、厚生労働省の自主点検表にある公開項目と同じ内容でサイトに書くこと。",
            "出産なび・産科医療補償制度の表示と、サイトの事実を一致させること。",
            "産婦人科を表すschema.orgの型（Obstetric・Gynecologic）と、WordPressでの設定、AIに出ているかの確かめ方。",
          ],
        },
        {
          heading: "分娩の予約：期限は「週数」と「方法」で書く",
          paragraphs: [
            `分娩予約の期限は施設によって大きく違います。たとえば愛育病院のFAQは「分娩予約は通常8〜9週」、日本赤十字社医療センターの案内は「20週まで」としています。[愛育病院（PDF）](${SRC.aiiku})、[日赤医療センター（PDF）](${SRC.jrc})。AIは「何週までに予約が必要か」をそのまま聞かれるので、「お早めに」ではなく週数で書きます。`,
          ],
          table: {
            head: ["書くこと", "書き方の例", "避けたい書き方"],
            rows: [
              ["予約の期限", "「分娩予約は妊娠20週までにお願いします」", "「お早めにご予約ください」だけ"],
              ["予約の方法", "「初診の際に外来で予約します。電話・Webでは受け付けていません」", "方法を書かない"],
              ["予約金", "「予約金◯円（分娩費用に充当）」のように、有無と扱い", "金額だけ書き、返金や充当の扱いを書かない"],
              ["受け入れの状況", "「2027年5月の分娩予定の方は受付を終了しました（2026年11月20日現在）」", "「現在混み合っています」だけ、日付なし"],
              ["里帰り出産", "受け入れの有無、連絡してほしい時期、受診してほしい週数", "「ご相談ください」だけ"],
            ],
          },
          after: [
            "受け入れの状況は、月ごとに変わる情報です。お知らせのページに日付を入れて書き、状況が変わったら書き換えます。終わった案内を残したままにすると、AIは数か月後も「受付終了」と答えかねません。",
          ],
        },
        {
          heading: "費用：一時金との関係と、変わる予定の制度を正しく書く",
          paragraphs: [
            `2023年4月1日以降の出産では、出産育児一時金は、産科医療補償制度に加入する医療機関で妊娠22週以降に出産した場合、子ども1人につき50万円です（22週未満は48.8万円）。医療機関が健康保険から直接受け取る「直接支払制度」を使うと、本人は一時金を超えた分だけを支払います。[協会けんぽ：出産育児一時金](${SRC.lumpSum})。`,
            `仕組みは変わる予定です。2026年6月5日に公布された健康保険法等の一部を改正する法律では、分娩の費用について全国一律の基本単価を決め、健康保険から医療機関に支払う形（現物給付）にし、あわせて妊婦に一律の現金給付を行うとしています。施行は公布から2年以内で政令で定める日で、当分の間は医療機関ごとに今の仕組みを続けることもできます。[厚生労働省：改正の概要（PDF）](${SRC.law2026})、[検討会資料（2026年10月1日、PDF）](${SRC.mhlwMeeting})。開始日や金額は、この記事の作成日の時点では決まっていません。`,
            "そのため、費用のページには次のように、条件と日付をつけて書きます。「出産は無料になります」のような、まだ決まっていない書き方はしません。",
          ],
          list: [
            "費用の目安と、その条件（経腟分娩・帝王切開、個室か大部屋、平日昼か夜間・休日、無痛分娩の追加費用）。",
            "直接支払制度に対応しているか。",
            "産科医療補償制度に加入しているか（一時金の金額に関わるため）。",
            "「◯年◯月時点の金額です」という日付。",
            "新しい制度について書くなら「施行日は未定。決まり次第このページを更新します」と書き、決まったら書き換える。",
          ],
        },
        {
          heading: "無痛分娩：自主点検表にある公開項目と同じ内容を書く",
          paragraphs: [
            `厚生労働省の無痛分娩の自主点検表（令和7年5月版）は、無痛分娩を行う施設が、自院のサイトと無痛分娩関係学会・団体連絡協議会（JALA）のサイトで公開し、少なくとも年1回更新する項目を挙げています。[自主点検表（PDF）](${SRC.epiduralChecklist})。この項目は、AIが「この産院の無痛分娩は安全か」と聞かれたときに答えに使える、具体的な事実でもあります。`,
          ],
          list: [
            "診療実績（実施件数など）。",
            "標準的な説明文書と、標準的な方法（計画分娩か、24時間対応か）。",
            "急変したときの体制と、危機対応のシミュレーションの実施歴。",
            "麻酔の管理者・担当医の研修歴や講習会の受講歴、救急蘇生コースの有効期限。",
            "日本産婦人科医会の偶発事例・妊産婦死亡報告事業への参画。",
            "ウェブサイトの更新日時。",
          ],
          after: [
            "「痛くない」「安心の無痛分娩」のような効果や安全を約束する言葉ではなく、これらの事実を書きます。JALAのサイトに載せた内容と、自院のサイトの内容は同じにします。",
          ],
        },
        {
          heading: "出産なび・産科医療補償制度と、サイトの事実をそろえる",
          paragraphs: [
            `出産なびは、厚生労働省が2024年5月30日に始めた、全国の分娩施設のサービスや費用を見られるサイトです。直接支払制度を使い年間21件以上の分娩を扱う施設が載り（それより少ない施設も希望すれば掲載）、2026年2月20日時点で2,097施設が載っています。費用の情報は請求のデータから四半期ごとに更新されます。[出産なびのリーフレット（PDF）](${SRC.birthNavi})、[検討会資料（PDF）](${SRC.mhlwMeeting})。AIは公的なサイトと医院のサイトの両方を読むので、食い違いがあると、どちらかが間違っていると判断されかねません。`,
          ],
          table: {
            head: ["どこに載る情報か", "サイトとそろえること", "確かめ方"],
            rows: [
              ["出産なび", "無痛分娩の有無、立ち会い・母子同室などのサービス、費用", "自院の掲載を開き、サイトの記載と1項目ずつ比べる。費用は四半期ごとに見直す"],
              ["産科医療補償制度", "加入していること（加入している施設はシンボルマークを表示）", `日本医療機能評価機構の加入分娩機関の検索で確かめる。[政府広報オンライン](${SRC.compensation})`],
              ["JALAのサイト", "無痛分娩の公開項目", "年1回以上の更新のたびに、サイトも同じ内容にする"],
              ["Googleビジネスプロフィール・医療情報ネット", "名前・住所・電話番号・診療時間・診療科", "変更したら同じ日にすべてを直す"],
            ],
          },
        },
        {
          heading: "妊婦健診と婦人科の外来：誰が、いつ、何を受けられるか",
          paragraphs: [
            `妊婦健診は、厚生労働省の告示で示された間隔で受けると全部で14回ほどになり、2022年4月1日時点ですべての市区町村が14回以上を公費で助成しています（多くは受診券の形）。[厚生労働省告示](${SRC.checkups})、[厚生労働省の調査（PDF）](${SRC.checkupSurvey})。助成の金額や使い方は自治体ごとに違うので、医院のサイトには「どの自治体の受診券が使えるか」を書き、金額は書きません。`,
          ],
          list: [
            "妊婦健診だけの受け入れを行うか、分娩はどこと連携しているか（「◯週以降は提携先で」など）。",
            "使える受診券の自治体（里帰りで他の自治体の受診券を使う場合の扱いも）。",
            "婦人科の外来は、曜日ごとの診療時間と、子宮がん検診などの検診の種類、予約が必要か。",
            "女性医師の担当日を書くなら、曜日と名前で書く。担当日が変わったら同じ日に直す。",
            "自費の診療（ピルの処方など）は、費用・主なリスクや副作用・問い合わせ先を同じページに書く（医療広告のルール）。",
          ],
        },
        {
          heading: "医療広告のルールと、一般的な「AI対策」の助言がぶつかるところ",
          paragraphs: [
            "AI検索対策の記事では「口コミを増やす」「実績を見せる」がよく勧められます。医療機関のサイトでは、厚生労働省の医療広告ガイドラインとQ&Aに沿って扱いを決めます。出産の体験は書きたくなる内容ですが、とくに注意が必要です。",
          ],
          table: {
            head: ["よくある助言", "医療機関での扱い（厚生労働省のQ&A）", "代わりにできること"],
            rows: [
              ["出産した人の声を載せる", "治療の内容や効果についての体験談は掲載できない（Q1-18、Q2-9）", "入院の流れ・日数・持ち物・費用の条件など、事実の説明を詳しくする"],
              ["「痛くない無痛分娩」「安心のお産」", "治療効果の表現には制限がある（Q2-8、Q3-14）", "無痛分娩の公開項目（実績・体制・研修歴）を事実として書く"],
              ["「地域で一番選ばれる産院」", "虚偽・誇大・比較優良の表示は禁止されている例として扱われる", "分娩件数など、事実で書ける範囲だけを書く"],
              ["自費の診療を詳しく書く", "自由診療は、治療の内容・費用、主なリスク・副作用、相談に答える問い合わせ先を書くことが条件（Q6-10〜6-12）", "条件を満たす形で、費用と主なリスクを同じページに書く"],
            ],
          },
          after: [
            `出典：[厚生労働省：医療広告等ガイドラインに関するQ&A（PDF）](${SRC.mhlwQa})、[事例解説書（PDF）](${SRC.mhlwCases})。FAQは「分娩の予約は何週までですか」「直接支払制度は使えますか」のような事実の質問にします。`,
          ],
        },
        {
          heading: "構造化データ：Obstetric・Gynecologicの型",
          paragraphs: [
            "schema.orgには、産科と婦人科を表す型があります（2026年11月20日にschema.org V30.1で確認）。",
          ],
          table: {
            head: ["型・プロパティ", "意味", "産婦人科での使い方"],
            rows: [
              [`[Obstetric](${SRC.obstetric})`, "妊娠・出産を扱う分野。MedicalBusinessの一種で、LocalBusinessの一種", "分娩を扱う医院の型に。住所・電話番号・診療時間をそのまま持てる"],
              [`[Gynecologic](${SRC.gynecologic})`, "女性の生殖器とその病気を扱う分野。MedicalBusinessの一種", "分娩を扱わない婦人科・レディースクリニックの型に"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "診療の分野。値に Obstetric・Gynecologic がある", "両方を診るなら、型を1つ選び、もう一方を medicalSpecialty に足す"],
              ["Service と offers", "提供するサービスと、その料金", "自費の検診・予約金など、料金を本文に書いているものだけを登録する"],
            ],
          },
          after: [
            `Googleは、AIによる概要などのために特別な構造化データは不要で、構造化データはページに見えている内容と一致させるよう案内しています。[Google：AI features and your website](${SRC.googleAi})。分娩費用は条件で変わるので、構造化データに1つの固定の料金として入れないでください。`,
          ],
        },
        {
          heading: "WordPressの産婦人科サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AIO（無料、旧表示名 Nurevo AEO）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「クリニック・歯科」を選びます（型はMedicalBusinessになります）。そのあと設定画面の「業種（schema.org型）」欄を Obstetric（分娩を扱わないなら Gynecologic）に変えます。この欄にはschema.orgの型名をそのまま入れられます。",
            "医院名・住所・電話番号・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "営業時間は「月〜金 9:00-12:00 14:00-17:00 / 土 9:00-12:00」のように外来の曜日と時刻だけを書きます。分娩は24時間対応であることや、時間外の連絡先は本文に書きます。",
            "自費の検診や予約金など、料金を本文に書いているものだけを設定画面のサービスに1つずつ登録します。名前・説明・料金・通貨を入れると、料金つきのサービス（Service と Offer）として出力されます。料金は本文と同じ値にします。",
            "分娩予約・費用・無痛分娩の各ページの編集画面のサイドバーで、そのページだけのFAQ（「分娩の予約は何週までですか」「直接支払制度は使えますか」「無痛分娩は24時間対応ですか」）を入れます。体験談や効果を約束する答えは入れません。終わった受付の案内は「このページをllms.txtに載せない」にします。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
        },
        {
          heading: "診療分野（medicalSpecialty）を足したいとき",
          paragraphs: [
            "Nurevo AIOは medicalSpecialty を自動では出しません。出したい場合は、テーマの functions.php か小さなプラグインで、事業の構造化データを変えるフィルター（webmcp_canary_business_node）を使います。",
          ],
          code: FILTER_CODE,
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "分娩予約の期限が週数で、予約の方法・予約金の扱いと一緒に書かれている。",
            "受け入れの状況（受付終了の月など）に日付があり、変わったら書き換えている。",
            "費用のページに、条件・日付・直接支払制度の対応・産科医療補償制度の加入が書かれている。",
            "新しい制度について、決まっていないことを決まったように書いていない。",
            "無痛分娩を行うなら、自主点検表の公開項目がサイトにあり、JALAのサイトと同じ内容になっている。",
            "出産なびの掲載内容と、サイトのサービス・費用が食い違っていない。",
            "妊婦健診だけの受け入れ、使える受診券、婦人科外来の曜日と時刻が書かれている。",
            "体験談・効果の約束・最上級や比較の言葉が、本文・FAQ・構造化データに入っていない。",
            "構造化データの型がObstetricかGynecologicで、料金は本文と一致している。",
            "名前・住所・電話番号・診療時間が、構造化データ・Googleビジネスプロフィール・医療情報ネットと一致し、llms.txtに分娩・費用・無痛分娩・アクセスのページが載っている。[クリニックの基本](/guide/medical-clinic-ai-search)、[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、妊娠中の人や家族が聞きそうな質問を「地域×出産×予約の期限」「地域×無痛分娩」「地域×里帰り出産」「地域×婦人科×土曜×検診」の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げます。医院が名前やURLで出るか、予約の期限・費用の条件・無痛分娩の体制が正しく書かれているかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。費用や制度を書き換えたあとは、古い金額が答えに残っていないかも見ます。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            "Nurevo AIOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（医院名は含めません）をPerplexityに投げ、回答に医院の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に医院が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "産婦人科のAI検索対策は、何から始めればいいですか？", a: "分娩予約の期限を週数で、予約の方法と一緒に書くことからです。次に費用のページに条件と日付を書き、無痛分娩を行うなら公開項目を載せます。最後に、名前・住所・電話番号・診療時間を構造化データ・Googleビジネスプロフィール・出産なびとそろえます。" },
        { q: "出産費用は、サイトにどう書けばいいですか？", a: "費用の目安を、分娩の方法・部屋・時間帯などの条件と「◯年◯月時点」の日付つきで書きます。直接支払制度に対応しているか、産科医療補償制度に加入しているかも書きます。2026年の法改正による新しい仕組みは、施行日が決まっていないことを明記し、決まったら更新します。" },
        { q: "「出産が無料になる」と書いてもいいですか？", a: "決まっていないことを決まったように書くのは避けます。2026年6月5日公布の改正法は、分娩の基本単価を健康保険から医療機関に払う形にするとしていますが、施行は公布から2年以内の政令で定める日で、当分の間は今の仕組みを選べる施設もあります。" },
        { q: "無痛分娩について、何を書けばいいですか？", a: "厚生労働省の自主点検表にある公開項目です。診療実績、標準的な説明文書と方法、急変時の体制、麻酔担当医の研修歴などを、JALAのサイトと同じ内容で書き、少なくとも年1回更新します。「痛くない」など効果を約束する言葉は使いません。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "分娩を扱うならschema.orgのObstetric、分娩を扱わない婦人科ならGynecologicです。どちらもMedicalBusinessとLocalBusinessの一種です。両方を診るなら、もう一方を medicalSpecialty に足せます。" },
        { q: "Nurevo AIOは無料で使えますか？", a: `はい。業種・住所・診療時間・サービスと料金・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AIO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに産婦人科が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが医院の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが産婦人科のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AIOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AIOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的・医学的な助言ではありません。",
    },
    en: {
      title: "AI Search for OB-GYN Clinics: Booking, Costs, Epidurals | Nurevo",
      description: "AEO for OB-GYN clinics: state the delivery booking deadline in weeks, costs with conditions and dates, epidural disclosure items, and use Obstetric or Gynecologic.",
      h1: "AI search for OB-GYN clinics: how to publish delivery booking deadlines, costs and epidural information so AI reads it correctly",
      lead: "The single most useful thing an obstetrics and gynecology clinic can do for AI search is to state, in dated text on its own site, by what week and how a delivery must be booked, what it costs and how that relates to public benefits, and how epidural (labor analgesia) care is organized. People who have just found out they are pregnant ask AI before they choose where to give birth. If the clinic's site does not state these conditions, AI answers from old reviews, comparison sites or another hospital's details. Then make the same facts match on public directories, insurance-scheme listings, structured data and Google Business Profile.",
      intro: [
        "Written November 20, 2026 (JST). The examples come from Japan, where Nurevo is based. The childbirth lump-sum benefit (Japan Health Insurance Association), the 2026 amendment to the Health Insurance Act (Ministry of Health, Labour and Welfare overview), the 出産なび directory (MHLW leaflet and committee document), prenatal checkup counts (MHLW notice and survey), epidural disclosure items (MHLW self-inspection checklist, May 2025 edition), the obstetric compensation scheme (Government of Japan public relations site) and the schema.org types (V30.1) were checked that day. The MHLW medical advertising Q&A items are as checked on November 16, 2026. Outside Japan, benefits, insurance and advertising rules differ: check your own country's rules.",
        "AI answers change by day and by how a question is asked. This guide makes your clinic's facts readable to AI. It does not guarantee that you will appear in AI answers or rank higher. It is not legal or medical advice.",
      ],
      sections: [
        {
          heading: "What pregnant people and their families ask AI",
          paragraphs: [
            "Obstetric questions are less about symptoms and more about timing, cost and how care is organized. People planning to give birth near their parents' home, partners and parents also do the research. In gynecology, checkups, contraception and menopause questions are common. Six question types come up most.",
          ],
          table: {
            head: ["Question type", "Example", "What AI uses to answer"],
            rows: [
              ["Booking a delivery", "\"Hospitals in X city where I can give birth: by what week do I need to book?\"", "Whether deliveries are offered, the booking deadline in weeks, how to book, any deposit, whether a referral is needed"],
              ["Cost", "\"How much does giving birth at X clinic cost? How much does the lump sum cover?\"", "Cost guide with conditions (private room, out-of-hours), whether direct payment to the clinic is available"],
              ["Epidurals", "\"A maternity clinic that offers epidurals\" \"Available 24 hours?\"", "Whether it is offered, planned or on demand, the anesthesia doctor, case numbers, extra cost"],
              ["Giving birth away from home", "\"Do you accept women coming home to give birth? When should I transfer?\"", "Whether accepted, when to contact, by what week to be seen"],
              ["Checkups only", "\"An OB-GYN for checkups only, delivering at another hospital\"", "Whether checkup-only patients are accepted, partner delivery hospital, whether municipal vouchers are accepted"],
              ["Gynecology outpatients", "\"A gynecologist for a cervical cancer screening on Saturday\" \"Is there a female doctor?\"", "Hours by day, types of screening and whether booking is needed, doctors' days"],
            ],
          },
          after: [
            `In every case, AI can only use pages that state the conditions in text. A press release on a company's own survey of 5,460 ChatGPT answers to clinic searches found that for price questions, the clinic's own website was cited in 96% of answers (September 2026). [Press release (Japanese)](${SRC.survey}). Costs and booking conditions are exactly the information AI tends to take from your own site.`,
          ],
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read the top results for queries such as \"産婦人科 AI検索対策\", \"婦人科 LLMO\" and \"OB-GYN AI search optimization\": seven in Japanese and six in English. The Japanese ones were either general clinic AI search articles (their points on advertising rules and consistent clinic details are practical) or OB-GYN marketing articles that do not mention AI; obstetrics got about one table row. The English ones were mostly tool round-ups or generic six-step playbooks, and some gave unsourced figures such as \"50 reviews is enough\" or \"Perplexity reflects changes in 30–60 days\".",
            "None of them covered these five points, which are the focus of this guide.",
          ],
          list: [
            "How to state delivery booking deadlines and methods so AI can use them in an answer.",
            "How to state costs correctly, with the childbirth lump sum (JPY 500,000 in Japan) and the new system set out in the 2026 law.",
            "How to publish epidural information with the same items as the MHLW self-inspection checklist.",
            "How to keep the site consistent with the national maternity directory and the obstetric compensation scheme.",
            "The schema.org types for OB-GYN (Obstetric, Gynecologic), concrete WordPress settings, and how to check whether you appear in AI answers.",
          ],
        },
        {
          heading: "Delivery booking: give the deadline in weeks, and the method",
          paragraphs: [
            `Booking deadlines vary widely. For example, Aiiku Hospital's FAQ says delivery booking is \"usually at 8–9 weeks\", and the Japanese Red Cross Medical Center asks for booking \"by week 20\". [Aiiku Hospital (PDF, Japanese)](${SRC.aiiku}), [Japanese Red Cross Medical Center (PDF, Japanese)](${SRC.jrc}). AI is asked \"by what week do I need to book?\" directly, so give a week number, not \"please book early\".`,
          ],
          table: {
            head: ["What to write", "Example", "Avoid"],
            rows: [
              ["The deadline", "\"Please book your delivery by week 20 of pregnancy\"", "Only \"please book early\""],
              ["How to book", "\"Book at your first outpatient visit. We do not take delivery bookings by phone or online\"", "No method given"],
              ["Deposit", "Whether there is one and how it is treated, such as \"deposit of X, deducted from the delivery fee\"", "An amount with no word on refunds or deduction"],
              ["Availability", "\"Bookings for due dates in May 2027 are closed (as of November 20, 2026)\"", "Only \"we are very busy\", with no date"],
              ["Giving birth away from home", "Whether accepted, when to contact you, by what week to be seen", "Only \"please ask us\""],
            ],
          },
          after: [
            "Availability changes month by month. Put it in a dated notice and rewrite it when it changes. If an ended notice stays online, AI may still answer \"bookings closed\" months later.",
          ],
        },
        {
          heading: "Costs: the lump sum, and the system that is due to change",
          paragraphs: [
            `In Japan, for births on or after April 1, 2023, the childbirth lump-sum benefit is JPY 500,000 per child when the birth is at 22 weeks or later at a facility enrolled in the obstetric compensation scheme (JPY 488,000 under 22 weeks). With the direct payment system, the facility receives it straight from the health insurer, and the patient pays only the amount above it. [Japan Health Insurance Association (Japanese)](${SRC.lumpSum}).`,
            `The system is due to change. The amendment to the Health Insurance Act promulgated on June 5, 2026 sets a national base unit price for delivery, paid by health insurance directly to the facility (benefit in kind), together with a flat cash benefit for every pregnant woman. It takes effect on a date set by cabinet order within two years of promulgation, and for the time being each facility may stay on the current system. [MHLW overview (PDF, Japanese)](${SRC.law2026}), [Committee document, October 1, 2026 (PDF, Japanese)](${SRC.mhlwMeeting}). As of the date of this guide, the start date and amounts have not been set.`,
            "So write the cost page with conditions and dates, as below. Do not write things that are not decided yet, such as \"giving birth is now free\".",
          ],
          list: [
            "A cost guide and its conditions (vaginal or caesarean, private or shared room, weekday daytime or night and holiday, extra cost for an epidural).",
            "Whether you accept the direct payment system.",
            "Whether you are enrolled in the obstetric compensation scheme (it affects the lump-sum amount).",
            "A date such as \"amounts as of month/year\".",
            "If you mention the new system, say \"the start date is not yet set; we will update this page when it is\", and update it when it is.",
          ],
        },
        {
          heading: "Epidurals: publish the same items as the self-inspection checklist",
          paragraphs: [
            `The MHLW epidural self-inspection checklist (May 2025 edition) lists the items facilities offering epidural labor analgesia should publish on their own website and on the site of the Japanese council of labor analgesia societies (JALA), updated at least once a year. [Self-inspection checklist (PDF, Japanese)](${SRC.epiduralChecklist}). These items are also the concrete facts AI can use when asked \"is the epidural at this clinic safe?\".`,
          ],
          list: [
            "Clinical record (such as the number of cases).",
            "The standard explanatory document and the standard method (planned or available 24 hours).",
            "The arrangements for emergencies, and the record of crisis-response simulations.",
            "Training and course records of the anesthesia manager and doctors, and the expiry dates of their resuscitation courses.",
            "Participation in the Japan Association of Obstetricians and Gynecologists' adverse event and maternal death reporting programme.",
            "The date and time the website was last updated.",
          ],
          after: [
            "Write these facts rather than words that promise an effect or safety, such as \"painless\" or \"worry-free epidural\". Keep your own site and the JALA site saying the same thing.",
          ],
        },
        {
          heading: "Match your site to the maternity directory and the compensation scheme",
          paragraphs: [
            `出産なび is a site the MHLW launched on May 30, 2024 that shows the services and costs of delivery facilities nationwide. It lists facilities that use direct payment and handle 21 or more deliveries a year (smaller facilities can opt in), and listed 2,097 facilities as of February 20, 2026. Cost information is updated quarterly from billing data. [出産なび leaflet (PDF, Japanese)](${SRC.birthNavi}), [Committee document (PDF, Japanese)](${SRC.mhlwMeeting}). AI reads both public sites and your site, so a mismatch can make one of them look wrong.`,
          ],
          table: {
            head: ["Where the information appears", "What to keep the same as your site", "How to check"],
            rows: [
              ["出産なび", "Whether epidurals are offered, services such as birth partners and rooming-in, costs", "Open your listing and compare it with your site item by item. Review costs every quarter"],
              ["Obstetric compensation scheme", "That you are enrolled (enrolled facilities display the scheme's symbol mark)", `Check the enrolled-facility search of the Japan Council for Quality Health Care. [Government of Japan (Japanese)](${SRC.compensation})`],
              ["JALA site", "The epidural disclosure items", "Each time you update it (at least yearly), update your site to match"],
              ["Google Business Profile and the official medical directory", "Name, address, phone, hours, departments", "When something changes, fix all of them the same day"],
            ],
          },
        },
        {
          heading: "Prenatal checkups and gynecology: who can get what, and when",
          paragraphs: [
            `Following the intervals in an MHLW notice, prenatal checkups come to about 14 visits, and as of April 1, 2022 every municipality subsidized 14 or more (most through vouchers). [MHLW notice (Japanese)](${SRC.checkups}), [MHLW survey (PDF, Japanese)](${SRC.checkupSurvey}). Subsidy amounts and rules vary by municipality, so state which municipalities' vouchers you accept, and do not quote amounts.`,
          ],
          list: [
            "Whether you accept checkup-only patients, and which hospital you work with for delivery (\"from week X at our partner hospital\" and so on).",
            "Which municipalities' vouchers you accept (and how you handle vouchers from another municipality for women coming home to give birth).",
            "For gynecology, hours by day, the types of screening such as cervical cancer screening, and whether booking is needed.",
            "If you list a female doctor's days, give the day and name, and update them the same day they change.",
            "For self-pay care (such as contraceptive pill prescriptions), give the fee, main risks and side effects, and a contact point on the same page (medical advertising rules).",
          ],
        },
        {
          heading: "Where common AI advice collides with medical advertising rules",
          paragraphs: [
            "AI search guides often say \"get more reviews\" and \"show results\". On a medical website in Japan, follow the MHLW medical advertising guidelines and their Q&A. Birth stories are tempting content, so take particular care.",
          ],
          table: {
            head: ["Common advice", "How it applies to clinics (MHLW Q&A)", "What to do instead"],
            rows: [
              ["Publish stories from mothers", "Testimonials about treatment content or effect cannot be published (Q1-18, Q2-9)", "Explain the facts in detail: the stay, number of days, what to bring, cost conditions"],
              ["\"Painless epidural\", \"worry-free birth\"", "Claims of treatment effect are restricted (Q2-8, Q3-14)", "Publish the epidural disclosure items (record, arrangements, training) as facts"],
              ["\"The most chosen maternity clinic in the area\"", "False, exaggerated or comparative claims are treated as prohibited examples", "State only what you can as fact, such as the number of deliveries"],
              ["Describe self-pay care in detail", "For self-pay care, the content and cost, main risks and side effects, and a contact point that answers questions must be given (Q6-10 to 6-12)", "Put the fee and main risks on the same page, meeting those conditions"],
            ],
          },
          after: [
            `Sources: [MHLW medical advertising guidelines Q&A (PDF, Japanese)](${SRC.mhlwQa}), [MHLW case book (PDF, Japanese)](${SRC.mhlwCases}). Keep FAQs to factual questions such as \"By what week should I book my delivery?\" and \"Do you accept direct payment?\".`,
          ],
        },
        {
          heading: "Structured data: the Obstetric and Gynecologic types",
          paragraphs: [
            "schema.org has types for obstetrics and gynecology (checked in schema.org V30.1 on November 20, 2026).",
          ],
          table: {
            head: ["Type or property", "Meaning", "How an OB-GYN clinic uses it"],
            rows: [
              [`[Obstetric](${SRC.obstetric})`, "The branch dealing with pregnancy and childbirth. A MedicalBusiness and a LocalBusiness", "The type for a clinic that delivers babies. It carries address, phone and opening hours directly"],
              [`[Gynecologic](${SRC.gynecologic})`, "The branch dealing with the female reproductive system and its diseases. A MedicalBusiness", "The type for a gynecology or women's clinic that does not deliver babies"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "The clinical specialty. Values include Obstetric and Gynecologic", "If you do both, choose one as the type and add the other as a medicalSpecialty"],
              ["Service and offers", "A service you provide and its price", "Register only items whose price appears on the page, such as self-pay screenings or the booking deposit"],
            ],
          },
          after: [
            `Google says no special structured data is needed for AI Overviews and similar features, and that structured data should match the visible content of the page. [Google: AI features and your website](${SRC.googleAi}). Delivery costs depend on conditions, so do not enter them as a single fixed price in structured data.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress OB-GYN clinic site",
          list: [
            `Install and activate Nurevo AIO (free, formerly shown as Nurevo AEO) from [WordPress.org](${WP_ORG}). It works alongside Yoast SEO, Rank Math, All in One SEO and Slim SEO. Since 0.9.1 it also works with SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.`,
            "In the setup wizard, choose \"Clinic or dental\" (the type becomes MedicalBusiness). Then change the \"Business type (schema.org type)\" field in settings to Obstetric (or Gynecologic if you do not deliver babies). The field accepts any schema.org type name.",
            "Check the clinic name, address, phone and description. Only empty fields are filled from existing settings; values you have entered are not overwritten.",
            "Enter opening hours as outpatient days and times only, such as \"Mon-Fri 9:00-12:00 14:00-17:00 / Sat 9:00-12:00\". Put 24-hour delivery care and the out-of-hours contact in the page text.",
            "Register as services only items whose price appears on the page, such as self-pay screenings or the booking deposit, one at a time. With a name, description, price and currency they are output as priced services (Service and Offer). Keep the price the same as the page.",
            "In the editor sidebar of the booking, cost and epidural pages, add page-only FAQs (\"By what week should I book?\", \"Do you accept direct payment?\", \"Are epidurals available 24 hours?\"). Do not add testimonials or promised results. Set ended booking notices to \"Leave this page out of llms.txt\".",
            "Run the check on the AEO score screen and fix gaps with one-click fixes. See how your site looks from outside with the [free AI readability check](/check).",
          ],
        },
        {
          heading: "Adding medicalSpecialty",
          paragraphs: [
            "Nurevo AIO does not output medicalSpecialty on its own. To add it, use the filter that changes the business structured data (webmcp_canary_business_node) in your theme's functions.php or a small plugin.",
          ],
          code: FILTER_CODE_EN,
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "The delivery booking deadline is given in weeks, with the booking method and how any deposit is treated.",
            "Availability (such as months that are closed) is dated and rewritten when it changes.",
            "The cost page gives conditions, a date, whether you accept direct payment and whether you are enrolled in the compensation scheme.",
            "Nothing about the new system is written as decided when it is not.",
            "If you offer epidurals, the checklist disclosure items are on your site and match the JALA site.",
            "Your 出産なび listing and your site agree on services and costs.",
            "Checkup-only acceptance, accepted vouchers, and gynecology days and hours are stated.",
            "No testimonials, promised results, superlatives or comparisons in the page text, FAQs or structured data.",
            "The structured data type is Obstetric or Gynecologic and prices match the page.",
            "Name, address, phone and hours match across structured data, Google Business Profile and the official medical directory, and llms.txt lists the delivery, cost, epidural and access pages. [Clinic basics](/guide/medical-clinic-ai-search), [What is llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the pages are in order, write five to ten questions pregnant people and their families might ask, combining area × giving birth × booking deadline, area × epidural, area × giving birth away from home and area × gynecology × Saturday × screening. Ask them in ChatGPT and Perplexity. Record whether your clinic appears by name or URL, and whether the booking deadline, cost conditions and epidural arrangements are stated correctly. AI answers change each time, so ask the same questions several times, spaced out. After you change costs or rules, also check that old amounts are not still in the answers. See [how to measure AI visibility](/guide/measure-ai-visibility).",
            "In Nurevo AIO, even the Free and Standard plans ask Perplexity three questions built from your business type and area (without your clinic's name) once a month, and record whether your name or site appeared. The Pro plan (from USD 99 per month) adds beta AI visibility measurement: how often your clinic appears in AI answers, compared with competitors and over time (Perplexity is measured today). Both look at samples of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should an OB-GYN clinic start with AI search?", a: "State the delivery booking deadline in weeks, together with how to book. Then add conditions and a date to your cost page, and publish the disclosure items if you offer epidurals. Finally, make your name, address, phone and hours match across structured data, Google Business Profile and the national maternity directory." },
        { q: "How should we write delivery costs on our site?", a: "Give a cost guide with conditions (delivery method, room, time of day) and an \"as of month/year\" date. Also say whether you accept direct payment and whether you are enrolled in the obstetric compensation scheme. For the new system in the 2026 law, say that the start date is not yet set, and update the page when it is." },
        { q: "Can we say \"giving birth is now free\"?", a: "Avoid writing undecided things as decided. The amendment promulgated on June 5, 2026 has health insurance pay a base delivery price to the facility, but it takes effect on a date set by cabinet order within two years, and for the time being facilities may choose to stay on the current system." },
        { q: "What should we publish about epidurals?", a: "The disclosure items in the MHLW self-inspection checklist: clinical record, the standard explanatory document and method, emergency arrangements, the anesthesia doctors' training and so on. Keep them the same as on the JALA site and update them at least once a year. Do not use words that promise an effect, such as \"painless\"." },
        { q: "Which structured data type should we use?", a: "schema.org's Obstetric if you deliver babies, or Gynecologic for a gynecology clinic that does not. Both are a MedicalBusiness and a LocalBusiness. If you do both, add the other as a medicalSpecialty." },
        { q: "Is Nurevo AIO free?", a: `Yes. Business type, address, hours, services with prices and FAQ structured data, llms.txt, AI crawler settings and the AEO score are in the free plan. Paid plans add the always-current ruleset (Standard, USD 20 per month) and beta AI visibility measurement (Pro, from USD 99 per month). [Nurevo AIO on WordPress.org](${WP_ORG})` },
        { q: "Will my clinic be guaranteed to appear in ChatGPT?", a: "No. AI answers vary, and no tool or method can guarantee appearance or ranking. What you can do is make your clinic's facts readable to AI and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your OB-GYN clinic's website",
        body: "The free check needs no sign-up and shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AIO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AIO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies. This guide is not legal or medical advice.",
    },
  },
};
