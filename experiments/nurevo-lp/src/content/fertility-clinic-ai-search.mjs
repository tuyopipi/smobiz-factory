// Content page: AI search (AEO) for fertility clinics (不妊治療クリニック).
// Industry page. OB-GYN (delivery) is obgyn-clinic-ai-search; primary care is
// medical-clinic-ai-search. This one covers what is specific to fertility care
// in Japan: the insurance age/count conditions, 先進医療 (lists change, PGT-A is
// 先進医療B), how to publish outcome figures within the medical advertising
// rules, the visit burden, and structured data when schema.org has no
// fertility specialty.
//
// Written 2026-11-20 (JST). Every claim about Nurevo AIO comes from the plugin
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary) as already used in
// obgyn-clinic-ai-search (2026-11-20): wizard "クリニック・歯科" = MedicalBusiness;
// the business type field accepts any schema.org type name; priced services are
// Service + Offer; the business node passes through webmcp_canary_business_node
// (nurevo-webmcp.php apply_filters); no medicalSpecialty / availableService
// output by default; page-only FAQ; "leave out of llms.txt" per page.
//
// Outside facts, read 2026-11-20:
// - 栃木県 不妊治療の費用 (updated 2023-04-01): insurance from 2022-04 for 人工授精
//   and 生殖補助医療; 女性 43歳未満 at treatment start; 40歳未満 通算6回 / 40〜43歳未満
//   通算3回 (1子ごと); 3割負担; 事実婚も対象; scope list.
// - 札幌市 先進医療助成 (updated 2026-11-01, list as of R8-04-01) and 兵庫県 先進医療
//   助成 (updated 2026-11-06, list as of R8-03-01): age/count table; 先進医療 lists
//   (Hyogo: 先進医療A 11 techniques + PGT-A as 先進医療B; Sapporo adds tacrolimus,
//   microfluidic sperm sorting). Subsidy: Hyogo 3万円/クール flat, Sapporo 7割 up to 3.5万円.
// - 東海市 助成のしおり (R8-04): deducts 高額療養費・付加給付 from the subsidised amount.
// - 鹿児島県 (updated 2026-04-21, Q&A as of R4-03): only insured transfers count.
// - MHLW 令和4年度改定の概要 不妊 (2022-03-04): first transfer age = age on the day
//   the treatment plan for that egg retrieval was made; third-party gametes not covered.
// - MHLW 中医協資料 (2022-02): 生殖補助医療管理料 施設基準 = JSOG registered facility,
//   ART online registration, cooperation with information provision.
// - MHLW 先進医療技術審査部会 2025-12-15: PGT-A (大阪大学) summary report: primary
//   endpoint 継続妊娠率 48.6% did not exceed the threshold; needs comparative trials.
// - MHLW 医療広告等ガイドラインQ&A (令和8年3月改定): Q2-16/2-17 治療効果は広告不可、
//   ウェブサイトは限定解除の要件を満たせば可・根拠を示せること; Q3-16 医師個人の件数不可;
//   Q3-17 医療機関の手術件数は期間を併記、年ごと複数年が望ましい; Q1-18/Q2-9 体験談;
//   Q6-10〜6-12 限定解除の要件.
// - schema-dts 2.1.0 (schema.org): no fertility/reproductive MedicalSpecialty value;
//   Gynecologic and Urologic are values; MedicalClinic has availableService and
//   medicalSpecialty; Gynecologic (business) has no availableService.
// Not written: success-rate figures, fee amounts for treatments, egg-freezing
// subsidies, the current 先進医療 list as one national list (only municipal pages read).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  tochigi: "https://www.pref.tochigi.lg.jp/e06/funin/funinnchiryounohokenntekiyou.html",
  sapporo: "https://www.city.sapporo.jp/eisei/funin/josei.html",
  hyogo: "https://web.pref.hyogo.lg.jp/kf17/kf17/senshin.html",
  tokai: "https://www.city.tokai.aichi.jp/_res/projects/default_project/_page_/001/002/553/r08.04_funin_shiori.pdf",
  kagoshima: "https://www.pref.kagoshima.jp/ae32/funin-hoken/funin-hoken.html",
  mhlw2022: "https://www.mhlw.go.jp/content/12400000/000911818.pdf",
  mhlwSupport: "https://www.mhlw.go.jp/content/000901931.pdf",
  pgta: "https://www.mhlw.go.jp/content/10808000/001627557.pdf",
  mhlwQa: "https://www.mhlw.go.jp/content/001683595.pdf",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  medicalClinic: "https://schema.org/MedicalClinic",
  medicalSpecialty: "https://schema.org/medicalSpecialty",
  availableService: "https://schema.org/availableService",
};

const FILTER_CODE = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // 本文に書いている診療分野と治療だけを足す（男性不妊外来がなければ Urologic は入れない）
    $org['medicalSpecialty'] = array('Gynecologic', 'Urologic');
    $org['availableService'] = array(
        array('@type' => 'MedicalProcedure', 'name' => '人工授精'),
        array('@type' => 'MedicalProcedure', 'name' => '体外受精'),
        array('@type' => 'MedicalProcedure', 'name' => '顕微授精'),
    );
    return $org;
}, 10, 2);`;

const FILTER_CODE_EN = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // Add only specialties and treatments your pages describe (drop Urologic without a male clinic)
    $org['medicalSpecialty'] = array('Gynecologic', 'Urologic');
    $org['availableService'] = array(
        array('@type' => 'MedicalProcedure', 'name' => 'Intrauterine insemination'),
        array('@type' => 'MedicalProcedure', 'name' => 'In vitro fertilization'),
        array('@type' => 'MedicalProcedure', 'name' => 'ICSI'),
    );
    return $org;
}, 10, 2);`;

export default {
  slug: "fertility-clinic-ai-search",
  targetQueries: [
    "AI search optimization for fertility clinics",
    "IVF clinic ChatGPT visibility",
    "fertility clinic schema markup",
    "不妊治療 クリニック AI検索対策",
    "不妊治療 LLMO 対策",
    "体外受精 クリニック ChatGPT",
  ],
  related: ["obgyn-clinic-ai-search", "medical-clinic-ai-search", "pricing-page-ai-search", "faq-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "不妊治療クリニックのAI検索対策：保険の条件と先進医療の書き方 | Nurevo",
      description: "不妊治療クリニックのAI検索対策は、保険の年齢・回数の条件、実施する先進医療、自費の費用とリスク、治療実績の定義を日付つきで書くこと。構造化データとWordPressの手順も解説。",
      h1: "不妊治療クリニックのAI検索対策：保険の条件、先進医療、治療実績をAIに正しく読ませる手順",
      lead: "不妊治療クリニックのAI検索対策でいちばん大切なのは、「保険で受けられる条件（年齢と回数）」「当院で受けられる先進医療と自費の治療、その費用とリスク」「治療実績の数え方」を、公的な条件と同じ言葉と日付つきでサイトに書くことです。治療を考える人は、通院先を決める前にAIへ「43歳でも保険は使える？」「◯◯市でタイムラプスができるクリニックは？」と質問します。医院のサイトにこれが書かれていないと、AIは古い制度の解説や比較サイトで答えます。そのうえで、同じ事実を構造化データ・Googleビジネスプロフィール・自治体や学会の一覧とそろえます。",
      intro: [
        "作成日：2026年11月20日（JST）。保険適用の年齢・回数（栃木県・札幌市の案内）、先進医療の一覧と自治体の助成（兵庫県 令和8年3月1日現在・札幌市 令和8年4月1日現在）、高額療養費の扱い（東海市のしおり 令和8年4月改正）、回数の数え方（鹿児島県のQ&A）、厚生労働省の2022年の資料、PGT-Aの評価（先進医療技術審査部会 2025年12月15日）、医療広告等ガイドラインQ&A（令和8年3月改定）、schema.orgの型（schema-dts 2.1.0）は同日に確認しました。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが医院の事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。この記事は法的・医学的な助言ではありません。個別の表現は管轄の保健所などで確認してください。",
      ],
      sections: [
        {
          heading: "治療を考える人が、AIに聞くこと",
          paragraphs: [
            "不妊治療の質問は、症状よりも「条件」「費用」「通いやすさ」が中心です。年齢で保険の条件が変わるため、年齢を添えて聞く人が多く、パートナーと一緒に調べることもあります。よく出る質問の型は次の6つです。",
          ],
          table: {
            head: ["質問の型", "例", "AIが答えに使う情報"],
            rows: [
              ["保険の条件", "「41歳から体外受精を始めたら、保険で何回できる？」", "年齢と回数の条件、年齢をいつの時点で数えるか、当院で保険診療を行っているか"],
              ["先進医療", "「◯◯市でタイムラプスやPGT-Aができるクリニック」", "実施している先進医療の正式な名前、費用、保険診療と併用できるか"],
              ["費用", "「体外受精の自己負担はいくら？自費になるのは何？」", "保険診療の負担の考え方、自費の治療の費用と条件、日付"],
              ["男性不妊", "「男性不妊も診てもらえる不妊治療クリニック」", "男性の検査・外来の有無、泌尿器科との連携先"],
              ["通院の負担", "「仕事を続けながら通える？土日も診療？」", "曜日ごとの診療時間、採卵・移植の日の対応、夜間や土日の受付"],
              ["初めての受診", "「初診の予約はどうする？説明会はある？」", "初診の予約方法、紹介状の要否、説明会の日程と参加方法"],
            ],
          },
          after: [
            "どの型も、AIが使えるのは条件が文字で書いてあるページです。条件が画像の表やPDFの中だけにあると、AIが読めないことがあります。料金や条件の書き方の基本は[料金ページの書き方](/guide/pricing-page-ai-search)にまとめています。",
          ],
        },
        {
          heading: "上位の記事で抜けていたこと",
          paragraphs: [
            "「不妊治療 クリニック AI検索対策」「クリニック LLMO」「fertility clinic AI search optimization」「IVF clinic GEO」などで上位に出る記事を、日本語6本・英語7本読みました。日本語は、クリニック全般のAI対策の記事（診療時間や保険・自費の書き分け、医療広告のルールは実務的）と、AIに触れていない不妊治療のポータル掲載の記事で、不妊治療に固有の項目はありませんでした。ある記事は治療実績として「成功率」の掲載を勧めていましたが、医療広告のルールとの関係には触れていませんでした。英語は、ツールや代理店の紹介、自社の事例が中心で、「42%の検討がAIから始まる」のような出典のない数字や、例の数字は作ったものと断ったページもありました。",
            "どの記事にもなかったのは、次の5点です。この記事はここを中心に書きます。",
          ],
          list: [
            "保険の年齢・回数の条件を、公的な案内と同じ言葉で、当院の扱いと一緒に書くこと。",
            "先進医療は一覧が変わることを前提に、実施する技術を正式な名前と日付で書くこと。",
            "妊娠率などの治療実績を、医療広告のルールに沿って、定義をつけて載せること。",
            "schema.orgに不妊治療の分野がないときの構造化データの組み立て方と、WordPressでの設定。",
            "AIに出ているか、条件を正しく答えているかの確かめ方。",
          ],
        },
        {
          heading: "保険の条件：公的な案内と同じ言葉で書く",
          paragraphs: [
            `2022年4月から、人工授精などの一般不妊治療と、体外受精・顕微授精などの生殖補助医療が保険の対象になりました。体外受精・顕微授精は、治療を始めるときの女性の年齢が43歳未満であることが条件で、回数は40歳未満なら1子ごとに通算6回まで、40歳以上43歳未満なら通算3回までです。事実婚も対象で、窓口での負担は3割です。[栃木県：不妊治療の費用](${SRC.tochigi})、[札幌市の案内](${SRC.sapporo})。`,
            `回数は胚移植の回数で数えます。厚生労働省の2022年の資料では、初回の胚移植の年齢は、その採卵の治療計画を作った日の年齢で判断するとしています。鹿児島県のQ&Aは、数えるのは保険診療で行った胚移植だけとしています。[厚生労働省：令和4年度診療報酬改定の概要（不妊、PDF）](${SRC.mhlw2022})、[鹿児島県](${SRC.kagoshima})。第三者の精子・卵子を使う治療は保険の対象外です。`,
            "AIは「◯歳でも保険は使えるか」とそのまま聞かれます。サイトには次のように、条件と当院の扱いを分けて書きます。",
          ],
          table: {
            head: ["書くこと", "書き方の例", "避けたい書き方"],
            rows: [
              ["年齢と回数", "表で「40歳未満：1子ごとに通算6回／40歳以上43歳未満：通算3回／43歳以上：保険の対象外」", "「年齢制限があります」だけ"],
              ["年齢を数える時点", "「初回の胚移植の年齢は、治療計画を作った日の年齢で判断します」", "書かない"],
              ["回数の数え方", "「回数は胚移植の回数です。他院で保険診療の移植を受けた方は、初診でお知らせください」", "「回数は採卵の回数」など、制度と違う説明"],
              ["事実婚", "「事実婚の方も対象です。初診時に確認の書類をお願いすることがあります」", "「ご夫婦のみ」"],
              ["当院の対応", "「当院は保険診療と自費診療の両方を行っています」", "保険診療を行っているかを書かない"],
              ["日付", "「2026年11月時点の制度です。変わった場合は更新します」", "日付なし"],
            ],
          },
          after: [
            `高額療養費も確認しておきたい点です。東海市の助成のしおり（令和8年4月改正）は、高額療養費や付加給付で戻る額を差し引いて助成額を計算するとしています。[東海市のしおり（PDF）](${SRC.tokai})。サイトでは「保険診療の自己負担は高額療養費の対象です。詳しくは加入する健康保険にご確認ください」のように、制度の名前と問い合わせ先を書き、具体的な上限額は書かないほうが古くなりません。`,
          ],
        },
        {
          heading: "先進医療：一覧が変わる前提で、実施する技術を書く",
          paragraphs: [
            `先進医療は、保険診療と併用でき、先進医療の部分だけが自費になります。対象の技術は見直されます。たとえば兵庫県の助成の案内（令和8年3月1日現在）には、タイムラプス撮像法による受精卵・胚培養、PICSI、SEET法、ERA、子宮内膜スクラッチ、二段階胚移植法、IMSI、ERPeakなど11の技術が先進医療A、着床前胚異数性検査（PGT-A）が先進医療Bとして載っています。札幌市の案内（令和8年4月1日現在）には、反復着床不全に対するタクロリムスの投与や、マイクロ流体技術を用いた精子選別も載っています。[兵庫県](${SRC.hyogo})、[札幌市](${SRC.sapporo})。`,
            `PGT-Aは、とくに慎重に書く必要があります。先進医療技術審査部会の評価（2025年12月15日）では、ある臨床研究の総括報告書について、主要な評価項目（継続妊娠率）が設定した基準を上回らなかったとし、比較対照試験などでの検証が必要としています。[評価の資料（PDF）](${SRC.pgta})。「PGT-Aで妊娠率が上がる」のような書き方は避けます。`,
          ],
          list: [
            "技術は正式な名前で書き、よく使われる略称（タイムラプス、ERA など）を併記する。AIは両方の名前で聞かれる。",
            "当院で「実施している」「実施していない」をはっきり書く。届出が必要な技術は、実施できる医療機関が決まっている。",
            "費用は「◯円（自費、◯年◯月時点）」と日付つきで書く。",
            "自治体の先進医療の助成は、額や条件が自治体ごとに違う（兵庫県は1クール3万円の定額、札幌市は自己負担の7割で上限3万5千円）。サイトには「お住まいの自治体の助成をご確認ください」と書き、主な自治体の案内へリンクする。",
            "一覧が見直されたら、同じ日に技術名と費用を直す。終わった技術の案内は消すか、「現在は先進医療ではありません」と書き換える。",
          ],
        },
        {
          heading: "自費の治療と費用：限定解除の要件を同じページで満たす",
          paragraphs: [
            `先進医療の自己負担、卵子凍結、保険の条件から外れた治療などは自費になります。厚生労働省の医療広告等ガイドラインQ&Aでは、ウェブサイトで広告可能事項以外を書くための要件として、自由診療なら通常必要な治療の内容と費用、主なリスクや副作用を書くこと、相談に答える問い合わせ先を書くこと（予約専用の電話番号だけでは不可）、極端に小さな文字にしないことなどを挙げています（Q6-10〜6-12）。[医療広告等ガイドラインに関するQ&A（PDF）](${SRC.mhlwQa})。`,
            "これらは、AIが「自費の治療はいくら？リスクは？」と聞かれたときに答えに使える事実でもあります。費用とリスクを別のページや画像に分けず、同じページの文字で書きます。保険診療の費用は、点数の改定で変わるため「保険診療の自己負担は3割です」のように考え方を書き、金額を書くなら日付を入れます。",
          ],
        },
        {
          heading: "治療実績と妊娠率：載せるなら定義と期間をつける",
          paragraphs: [
            "AI検索対策の記事では「実績を数字で見せる」がよく勧められます。不妊治療の妊娠率は、医療広告のルールと重なるので、扱いを先に決めます。",
          ],
          table: {
            head: ["載せたいもの", "医療広告等ガイドラインQ&Aでの扱い", "書き方"],
            rows: [
              ["妊娠率などの治療の効果", "治療の効果は広告できない（Q2-16）。ウェブサイトは限定解除の要件を満たせば書けるが、求められれば根拠を示し、客観的に実証できる必要がある（Q2-17）", "限定解除の要件を満たすページに、根拠を示せる数字だけを書く"],
              ["治療の件数", "医療機関の手術の件数は、期間を併記すれば広告可能事項の範囲で書ける。年ごとに集計し複数年を示すことが望ましい（Q3-17）", "採卵・胚移植の件数を、年ごとに複数年で書く"],
              ["医師個人の件数", "医師個人が行った手術の件数は広告できない（Q3-16）", "医療機関としての件数にする"],
              ["患者の体験談", "治療の内容や効果についての体験談は掲載できない（Q1-18、Q2-9）", "通院の流れ・日数・費用の条件など、事実の説明を詳しくする"],
            ],
          },
          after: [
            "妊娠率を載せる場合、Q&Aは算出方法の書き方までは定めていませんが、数字の意味が分からないとAIも人も誤って受け取ります。この記事では、少なくとも次の4つを数字の横に書くことをすすめます：分母（胚移植1回あたりか、採卵1回あたりか）、妊娠の定義（胎嚢の確認など）、年齢の区分、集計した期間。年齢を分けずに1つの数字だけを載せると、年齢の違う人に当てはまらない数字になります。",
            `生殖補助医療の保険診療を行う医療機関は、2022年の中医協資料では、日本産科婦人科学会の体外受精・胚移植に関する登録施設であることや、ARTオンライン登録への症例データの入力などが施設基準として示されています。[厚生労働省：不妊治療に関する支援について（PDF）](${SRC.mhlwSupport})。登録施設であることは、サイトに事実として書けます。`,
          ],
        },
        {
          heading: "通院の負担と男性不妊：誰が、いつ、何を受けられるか",
          list: [
            "曜日ごとの診療時間に加えて、採卵・胚移植・人工授精の日の対応（日曜・祝日も行うか）を書く。「仕事と両立しやすい」ではなく、曜日と時刻で書く。",
            "初診の予約方法、紹介状の要否、パートナーの同席が必要な回、説明会の日程と参加方法（オンラインか）を書く。",
            "男性不妊の検査や外来を行うか、行わないなら連携する泌尿器科を書く。採精を院内で行うか、持参できるかも書く。",
            "通院の目安（体外受精の1周期で何回ほど来院するか）は、院内の実際の流れで書き、「◯回で済む」と約束する書き方はしない。",
            "院長・医師の資格は、認定した団体名と資格名を正確に書く。担当日が変わったら同じ日に直す。",
          ],
        },
        {
          heading: "外の一覧と、サイトの事実をそろえる",
          paragraphs: [
            "AIは医院のサイトだけでなく、自治体の案内や学会の一覧、ポータルも読みます。食い違いがあると、どちらかが間違っていると判断されかねません。",
          ],
          table: {
            head: ["どこに載る情報か", "サイトとそろえること", "確かめ方"],
            rows: [
              ["日本産科婦人科学会の登録施設の一覧", "医院名・登録の種類", "学会の一覧で自院の表記を確かめ、サイトの名前と合わせる"],
              ["自治体の先進医療の実施医療機関の一覧・助成の案内", "実施している先進医療の技術名", `一覧の時点（兵庫県は令和8年11月1日時点）とサイトの記載を比べる。[兵庫県](${SRC.hyogo})`],
              ["Googleビジネスプロフィール・医療情報ネット", "名前・住所・電話番号・診療時間・診療科", "変更したら同じ日にすべてを直す"],
              ["不妊治療のポータル・口コミサイト", "診療時間・実施する治療・費用", "掲載内容を定期的に見て、古い情報は運営者に更新を依頼する"],
            ],
          },
        },
        {
          heading: "構造化データ：不妊治療の分野がないときの組み立て方",
          paragraphs: [
            "schema.orgの診療分野（MedicalSpecialty）には、不妊治療や生殖医療を表す値がありません（2026年11月20日にschema-dts 2.1.0で確認）。そのため、次の組み合わせで表します。",
          ],
          table: {
            head: ["型・プロパティ", "意味", "不妊治療クリニックでの使い方"],
            rows: [
              [`[MedicalClinic](${SRC.medicalClinic})`, "診療所。MedicalBusinessとLocalBusinessの一種", "医院の型に。availableService と medicalSpecialty を持てる"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "診療の分野。値に Gynecologic（婦人科）・Urologic（泌尿器科）がある", "Gynecologic を入れ、男性不妊外来があれば Urologic も足す"],
              [`[availableService](${SRC.availableService})`, "提供する医療（MedicalProcedure など）", "人工授精・体外受精・顕微授精など、本文に書いている治療の名前を入れる"],
              ["Service と offers", "提供するサービスと、その料金", "自費の治療など、料金を本文に書いているものだけを登録する"],
            ],
          },
          after: [
            `Googleは、AIによる概要などのために特別な構造化データは不要で、構造化データはページに見えている内容と一致させるよう案内しています。[Google：AI features and your website](${SRC.googleAi})。保険診療の費用や妊娠率は、構造化データに入れないでください。条件で変わる数字を1つの値にすると、誤った答えの元になります。`,
          ],
        },
        {
          heading: "WordPressの不妊治療クリニックのサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AIO（無料、旧表示名 Nurevo AEO）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「クリニック・歯科」を選びます（型はMedicalBusinessになります）。そのあと設定画面の「業種（schema.org型）」欄を MedicalClinic に変えます。この欄にはschema.orgの型名をそのまま入れられます。",
            "医院名・住所・電話番号・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "営業時間は外来の曜日と時刻だけを書きます。採卵・移植の日の休日対応は本文に書きます。",
            "自費の治療や先進医療など、料金を本文に書いているものだけを設定画面のサービスに1つずつ登録します。名前・説明・料金・通貨を入れると、料金つきのサービス（Service と Offer）として出力されます。料金は本文と同じ値にします。",
            "保険の条件・先進医療・費用の各ページの編集画面のサイドバーで、そのページだけのFAQ（「43歳以上でも保険は使えますか」「回数は何で数えますか」「タイムラプスは受けられますか」）を入れます。効果を約束する答えや体験談は入れません。終わった案内は「このページをllms.txtに載せない」にします。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
        },
        {
          heading: "診療分野と治療（medicalSpecialty・availableService）を足したいとき",
          paragraphs: [
            "Nurevo AIOは medicalSpecialty と availableService を自動では出しません。出したい場合は、テーマの functions.php か小さなプラグインで、事業の構造化データを変えるフィルター（webmcp_canary_business_node）を使います。型を MedicalClinic にしたうえで使ってください。",
          ],
          code: FILTER_CODE,
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "保険の年齢・回数の条件が表で書かれ、年齢を数える時点と、回数は胚移植で数えることが書かれている。",
            "事実婚も対象であること、当院が保険診療を行っているかが書かれている。",
            "制度の説明に日付があり、制度が変わったら書き換えている。",
            "実施している先進医療が正式な名前と略称で書かれ、費用に日付がある。終わった技術の案内が残っていない。",
            "PGT-Aなどで、効果を約束する書き方をしていない。",
            "自費の治療は、内容・費用・主なリスクや副作用・相談できる問い合わせ先が同じページにある。",
            "妊娠率を載せるなら、分母・妊娠の定義・年齢の区分・期間が数字の横にあり、根拠を示せる。件数は年ごとに複数年で書いている。",
            "体験談・効果の約束・最上級や比較の言葉が、本文・FAQ・構造化データに入っていない。",
            "構造化データの型が MedicalClinic で、料金は本文と一致し、保険診療の費用や妊娠率を入れていない。",
            "名前・住所・電話番号・診療時間が、構造化データ・Googleビジネスプロフィール・医療情報ネット・学会や自治体の一覧と一致し、llms.txtに保険の条件・先進医療・費用・アクセスのページが載っている。[クリニックの基本](/guide/medical-clinic-ai-search)、[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、治療を考える人が聞きそうな質問を「地域×体外受精×年齢」「地域×先進医療の技術名」「地域×男性不妊」「地域×土日×不妊治療」の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げます。医院が名前やURLで出るかに加えて、保険の条件（年齢・回数）や先進医療の名前が正しく答えられているかを記録します。不妊治療では、出ることよりも、古い制度や間違った条件で答えられていないかのほうが大切です。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            "Nurevo AIOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（医院名は含めません）をPerplexityに投げ、回答に医院の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に医院が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。答えの中身が正しいかは、記録した回答を読んで確かめます。",
          ],
        },
      ],
      faqs: [
        { q: "不妊治療クリニックのAI検索対策は、何から始めればいいですか？", a: "保険の年齢・回数の条件を表で書き、年齢を数える時点と回数の数え方、当院が保険診療を行っているかを書くことからです。次に実施している先進医療と自費の治療を、費用・リスク・日付つきで書きます。最後に、名前・住所・診療時間を構造化データ・Googleビジネスプロフィール・学会や自治体の一覧とそろえます。" },
        { q: "保険の年齢と回数の条件は、どう書けばいいですか？", a: "体外受精・顕微授精は治療開始時の女性の年齢が43歳未満、回数は40歳未満なら1子ごとに通算6回、40歳以上43歳未満なら通算3回で、回数は胚移植の回数です。これを表で書き、「◯年◯月時点の制度です」と日付を入れます。" },
        { q: "妊娠率をサイトに載せてもいいですか？", a: "厚生労働省のQ&Aでは、治療の効果は広告できず、ウェブサイトでは限定解除の要件を満たせば書けますが、求められれば根拠を示し客観的に実証できる必要があります。載せるなら、分母・妊娠の定義・年齢の区分・期間を数字の横に書くことをすすめます。個別の判断は管轄の保健所などに確認してください。" },
        { q: "先進医療の情報は、どう書けばいいですか？", a: "実施している技術を正式な名前と略称で書き、費用に日付を入れます。先進医療の一覧は見直されるので、変わったら同じ日に直します。自治体の助成は自治体ごとに違うため、金額を言い切らず、主な自治体の案内へリンクします。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgには不妊治療の診療分野がないため、型は MedicalClinic にし、medicalSpecialty に Gynecologic（男性不妊外来があれば Urologic も）、availableService に人工授精・体外受精などの治療名を入れます。保険診療の費用や妊娠率は入れません。" },
        { q: "Nurevo AIOは無料で使えますか？", a: `はい。業種・住所・診療時間・サービスと料金・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AIO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTにクリニックが必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが医院の事実を正しく読める状態をつくり、出ているか・条件を正しく答えているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが不妊治療クリニックのサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AIOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AIOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的・医学的な助言ではありません。",
    },
    en: {
      title: "AI Search for Fertility Clinics: Coverage Rules and Add-ons | Nurevo",
      description: "AEO for fertility clinics: publish insurance age and cycle limits, the add-on treatments you offer, self-pay costs and risks, and defined outcome figures, with dates.",
      h1: "AI search for fertility clinics: how to publish coverage conditions, add-on treatments and outcome figures so AI reads them correctly",
      lead: "The most useful thing a fertility clinic can do for AI search is to state, in dated text on its own site and in the same words as the official rules, who is covered by insurance (age and number of attempts), which add-on and self-pay treatments the clinic offers with their costs and risks, and how its outcome figures are counted. People considering treatment ask AI questions like \"Can I still use insurance for IVF at 43?\" or \"Which clinics in X offer time-lapse embryo culture?\" before choosing a clinic. If the clinic's site does not say this, AI answers from explainers about old rules or from comparison sites. Then make the same facts match in structured data, Google Business Profile and public or professional listings.",
      intro: [
        "Written November 20, 2026 (JST). The examples come from Japan, where Nurevo is based. Insurance age and count conditions (Tochigi Prefecture and Sapporo City guidance), the list of advanced medical care (先進医療) and local subsidies (Hyogo Prefecture as of March 1, 2026; Sapporo as of April 1, 2026), the high-cost medical expense benefit (Tokai City leaflet, April 2026 revision), how attempts are counted (Kagoshima Prefecture Q&A), the 2022 Ministry of Health, Labour and Welfare (MHLW) documents, the PGT-A evaluation (MHLW expert panel, December 15, 2025), the MHLW medical advertising Q&A (March 2026 revision) and the schema.org types (schema-dts 2.1.0) were checked that day. Outside Japan, coverage, outcome reporting and advertising rules differ: check your own country's rules.",
        "AI answers change by day and by how a question is asked. This guide makes your clinic's facts readable to AI. It does not guarantee that you will appear in AI answers or rank higher. It is not legal or medical advice.",
      ],
      sections: [
        {
          heading: "What people considering treatment ask AI",
          paragraphs: [
            "Fertility questions are less about symptoms and more about conditions, cost and how easy the clinic is to attend. Because the insurance conditions depend on age, many people include their age in the question, and couples often research together. Six question types come up most.",
          ],
          table: {
            head: ["Question type", "Example", "What AI uses to answer"],
            rows: [
              ["Insurance conditions", "\"If I start IVF at 41, how many attempts does insurance cover?\"", "The age and count conditions, at what point age is judged, whether the clinic provides insured treatment"],
              ["Add-on treatments", "\"Clinics in X city that offer time-lapse culture or PGT-A\"", "The formal names of the advanced treatments offered, their cost, whether they can be combined with insured care"],
              ["Cost", "\"What do I pay for IVF? What is self-pay?\"", "How insured costs are shared, self-pay costs with conditions, a date"],
              ["Male infertility", "\"A fertility clinic that also sees men\"", "Whether male testing or a male clinic is offered, the partner urology clinic"],
              ["Visit burden", "\"Can I keep working? Are you open at weekends?\"", "Hours by day, what happens on retrieval and transfer days, evening and weekend reception"],
              ["First visit", "\"How do I book a first appointment? Is there an information session?\"", "How to book, whether a referral is needed, information session dates and format"],
            ],
          },
          after: [
            "In every case, AI can only use pages that state the conditions in text. If conditions exist only in an image table or inside a PDF, AI may not read them. The basics of writing prices and conditions are in [how to write a pricing page](/guide/pricing-page-ai-search).",
          ],
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read the top results for queries such as \"不妊治療 クリニック AI検索対策\", \"クリニック LLMO\", \"fertility clinic AI search optimization\" and \"IVF clinic GEO\": six in Japanese and seven in English. The Japanese ones were general clinic AI search articles (their points on hours, separating insured and self-pay care, and advertising rules are practical) and a fertility portal-listing article that does not mention AI; none had anything specific to fertility care. One recommended publishing \"success rates\" as a track record without discussing the advertising rules. The English ones were mostly tool or agency round-ups and case studies, with unsourced figures such as \"42% of journeys start in AI\", and one page said its example figures were made up.",
            "None of them covered these five points, which are the focus of this guide.",
          ],
          list: [
            "Stating the insurance age and count conditions in the same words as official guidance, alongside how your clinic handles them.",
            "Writing add-on treatments by formal name and date, on the assumption that the official list changes.",
            "Publishing outcome figures such as pregnancy rates within the medical advertising rules, with definitions.",
            "Building structured data when schema.org has no fertility specialty, and the WordPress settings.",
            "Checking whether you appear in AI answers and whether the conditions are answered correctly.",
          ],
        },
        {
          heading: "Insurance conditions: use the same words as official guidance",
          paragraphs: [
            `Since April 2022, general fertility treatment such as intrauterine insemination and assisted reproduction such as IVF and ICSI have been covered by health insurance in Japan. For IVF and ICSI, the woman must be under 43 when treatment starts. Insurance covers up to six attempts per child if she is under 40, and up to three if she is 40 to under 43. Couples in a de facto marriage are also covered, and patients pay 30% at the counter. [Tochigi Prefecture (Japanese)](${SRC.tochigi}), [Sapporo City (Japanese)](${SRC.sapporo}).`,
            `Attempts are counted as embryo transfers. A 2022 MHLW document says that for the first transfer, age is judged on the day the treatment plan for that egg retrieval was made. Kagoshima Prefecture's Q&A says only transfers done under insurance are counted. [MHLW 2022 revision overview, fertility (PDF, Japanese)](${SRC.mhlw2022}), [Kagoshima Prefecture (Japanese)](${SRC.kagoshima}). Treatment using donor sperm or eggs is not covered.`,
            "AI is asked \"can I still use insurance at age X?\" directly. Write the rule and your clinic's handling separately, as below.",
          ],
          table: {
            head: ["What to write", "Example", "Avoid"],
            rows: [
              ["Age and count", "A table: \"Under 40: up to 6 per child / 40 to under 43: up to 3 / 43 and over: not covered\"", "Only \"age limits apply\""],
              ["When age is judged", "\"For the first transfer, age is judged on the day the treatment plan is made\"", "Saying nothing"],
              ["How attempts are counted", "\"Attempts are embryo transfers. If you have had insured transfers elsewhere, tell us at your first visit\"", "Explanations that differ from the rules, such as \"attempts are egg retrievals\""],
              ["De facto couples", "\"De facto couples are covered. We may ask for documents at the first visit\"", "\"Married couples only\""],
              ["Your clinic", "\"We provide both insured and self-pay treatment\"", "Not saying whether you provide insured care"],
              ["Date", "\"Rules as of November 2026. We will update this page if they change\"", "No date"],
            ],
          },
          after: [
            `The high-cost medical expense benefit is also worth covering. Tokai City's subsidy leaflet (April 2026 revision) calculates its subsidy after deducting what is refunded through the high-cost medical expense benefit and additional benefits. [Tokai City leaflet (PDF, Japanese)](${SRC.tokai}). On your site, name the scheme and where to ask, for example \"Insured costs are eligible for the high-cost medical expense benefit; please check with your health insurer\", rather than quoting caps that will go out of date.`,
          ],
        },
        {
          heading: "Add-on treatments: write what you offer, assuming the list changes",
          paragraphs: [
            `Treatments designated as advanced medical care can be combined with insured treatment, with only the advanced part paid by the patient. The designated techniques are reviewed. For example, Hyogo Prefecture's subsidy page (as of March 1, 2026) lists eleven techniques as category A, including time-lapse embryo culture, PICSI, SEET, ERA, endometrial scratching, two-step embryo transfer, IMSI and ERPeak, and lists preimplantation genetic testing for aneuploidy (PGT-A) as category B. Sapporo City's page (as of April 1, 2026) also lists tacrolimus for repeated implantation failure and sperm sorting using microfluidics. [Hyogo Prefecture (Japanese)](${SRC.hyogo}), [Sapporo City (Japanese)](${SRC.sapporo}).`,
            `Write about PGT-A with particular care. An MHLW expert panel evaluation (December 15, 2025) of one clinical study's final report found that the primary endpoint (ongoing pregnancy rate) did not exceed the threshold set, and said the technique needs to be verified through comparative trials. [Evaluation document (PDF, Japanese)](${SRC.pgta}). Avoid wording such as \"PGT-A raises pregnancy rates\".`,
          ],
          list: [
            "Use formal names and add the common short names (time-lapse, ERA and so on). AI is asked with both.",
            "Say clearly whether your clinic offers each technique. Techniques that require notification can only be provided by approved facilities.",
            "Give the cost with a date, such as \"X yen (self-pay, as of month/year)\".",
            "Local subsidies for advanced care differ by municipality (Hyogo pays a flat JPY 30,000 per cycle; Sapporo pays 70% of the patient's cost up to JPY 35,000). Say \"check your local subsidy\" and link to the main municipalities' pages.",
            "When the list is reviewed, update technique names and costs the same day. Remove notices for techniques that are no longer designated, or say so.",
          ],
        },
        {
          heading: "Self-pay treatment and costs: meet the disclosure conditions on the same page",
          paragraphs: [
            `The patient's share of advanced care, egg freezing and treatment outside the insurance conditions are self-pay. The MHLW medical advertising Q&A sets conditions for publishing information beyond the permitted advertising items on a website: for self-pay care, the usual treatment content and cost and the main risks and side effects; a contact point that answers questions (a booking-only phone number is not enough); and text that is not hard to read (Q6-10 to 6-12). [MHLW medical advertising Q&A (PDF, Japanese)](${SRC.mhlwQa}).`,
            "These are also the facts AI can use when asked \"how much is self-pay treatment and what are the risks?\". Keep cost and risks in text on the same page, not on separate pages or in images. Insured costs change when fee schedules are revised, so explain the principle (\"you pay 30% of insured costs\") and add a date if you quote amounts.",
          ],
        },
        {
          heading: "Outcome figures and pregnancy rates: if you publish them, add definitions and periods",
          paragraphs: [
            "AI search guides often say \"show your results in numbers\". Fertility pregnancy rates overlap with medical advertising rules, so decide how to handle them first.",
          ],
          table: {
            head: ["What you want to publish", "How the MHLW Q&A treats it", "How to write it"],
            rows: [
              ["Treatment effect such as pregnancy rates", "Treatment effect cannot be advertised (Q2-16). A website can state it if the disclosure conditions are met, but must be able to show evidence and demonstrate it objectively on request (Q2-17)", "Only figures you can back up, on a page that meets the conditions"],
              ["Number of procedures", "A facility's number of operations can be stated with the period. Annual totals over several years are preferred (Q3-17)", "Egg retrievals and transfers per year, over several years"],
              ["An individual doctor's numbers", "Cannot be advertised (Q3-16)", "Use facility-level numbers"],
              ["Patient testimonials", "Testimonials about treatment content or effect cannot be published (Q1-18, Q2-9)", "Explain the facts in detail: the treatment flow, number of visits, cost conditions"],
            ],
          },
          after: [
            "The Q&A does not say how a rate must be calculated, but without its meaning, both AI and people misread a number. We recommend putting at least four things next to any pregnancy rate: the denominator (per transfer or per retrieval), the definition of pregnancy (such as a confirmed gestational sac), the age groups, and the period counted. A single rate across all ages does not apply to anyone of a different age.",
            `A 2022 Central Social Insurance Medical Council document set out, as facility standards for insured assisted reproduction, registration with the Japan Society of Obstetrics and Gynecology as an IVF-ET facility and entering case data into its ART online registry. [MHLW: support for fertility treatment (PDF, Japanese)](${SRC.mhlwSupport}). Being a registered facility is a fact you can state on your site.`,
          ],
        },
        {
          heading: "Visit burden and male infertility: who can get what, and when",
          list: [
            "Besides hours by day, state what happens on retrieval, transfer and insemination days (including Sundays and holidays). Give days and times, not \"easy to combine with work\".",
            "State how to book a first visit, whether a referral is needed, which visits need the partner, and information session dates and format (online or not).",
            "Say whether you offer male testing or a male clinic, and if not, which urology clinic you work with. Say whether semen collection is on site or can be brought from home.",
            "Describe the typical number of visits per IVF cycle from your actual process, without promising a number.",
            "Give doctors' qualifications with the exact certifying body and title. Update doctors' days the same day they change.",
          ],
        },
        {
          heading: "Match your site to outside listings",
          paragraphs: [
            "AI reads not only your site but also municipal guidance, professional listings and portals. A mismatch can make one of them look wrong.",
          ],
          table: {
            head: ["Where the information appears", "What to keep the same as your site", "How to check"],
            rows: [
              ["The Japan Society of Obstetrics and Gynecology registered facility list", "Clinic name and type of registration", "Check how your clinic is listed and match the name on your site"],
              ["Municipal lists of advanced care providers and subsidy pages", "The names of the advanced techniques you offer", `Compare the list's as-of date (Hyogo: November 1, 2026) with your site. [Hyogo Prefecture (Japanese)](${SRC.hyogo})`],
              ["Google Business Profile and the official medical directory", "Name, address, phone, hours, departments", "When something changes, fix all of them the same day"],
              ["Fertility portals and review sites", "Hours, treatments offered, costs", "Review listings regularly and ask operators to update old information"],
            ],
          },
        },
        {
          heading: "Structured data when there is no fertility specialty",
          paragraphs: [
            "schema.org's medical specialty values (MedicalSpecialty) have no value for fertility or reproductive medicine (checked in schema-dts 2.1.0 on November 20, 2026). Use this combination instead.",
          ],
          table: {
            head: ["Type or property", "Meaning", "How a fertility clinic uses it"],
            rows: [
              [`[MedicalClinic](${SRC.medicalClinic})`, "A clinic. A MedicalBusiness and a LocalBusiness", "The clinic's type. It can carry availableService and medicalSpecialty"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "The clinical specialty. Values include Gynecologic and Urologic", "Add Gynecologic, and Urologic if you run a male clinic"],
              [`[availableService](${SRC.availableService})`, "Care provided (MedicalProcedure and others)", "Names of treatments your pages describe, such as insemination, IVF and ICSI"],
              ["Service and offers", "A service you provide and its price", "Register only items whose price appears on the page, such as self-pay treatment"],
            ],
          },
          after: [
            `Google says no special structured data is needed for AI Overviews and similar features, and that structured data should match the visible content of the page. [Google: AI features and your website](${SRC.googleAi}). Do not put insured costs or pregnancy rates in structured data. Turning a number that depends on conditions into a single value invites wrong answers.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress fertility clinic site",
          list: [
            `Install and activate Nurevo AIO (free, formerly shown as Nurevo AEO) from [WordPress.org](${WP_ORG}). It works alongside Yoast SEO, Rank Math, All in One SEO and Slim SEO. Since 0.9.1 it also works with SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.`,
            "In the setup wizard, choose \"Clinic or dental\" (the type becomes MedicalBusiness). Then change the \"Business type (schema.org type)\" field in settings to MedicalClinic. The field accepts any schema.org type name.",
            "Check the clinic name, address, phone and description. Only empty fields are filled from existing settings; values you have entered are not overwritten.",
            "Enter opening hours as outpatient days and times only. Put weekend and holiday handling for retrieval and transfer days in the page text.",
            "Register as services only items whose price appears on the page, such as self-pay or advanced treatment, one at a time. With a name, description, price and currency they are output as priced services (Service and Offer). Keep the price the same as the page.",
            "In the editor sidebar of the insurance, advanced care and cost pages, add page-only FAQs (\"Can I use insurance at 43 or over?\", \"How are attempts counted?\", \"Do you offer time-lapse culture?\"). Do not add promised results or testimonials. Set ended notices to \"Leave this page out of llms.txt\".",
            "Run the check on the AEO score screen and fix gaps with one-click fixes. See how your site looks from outside with the [free AI readability check](/check).",
          ],
        },
        {
          heading: "Adding medicalSpecialty and availableService",
          paragraphs: [
            "Nurevo AIO does not output medicalSpecialty or availableService on its own. To add them, use the filter that changes the business structured data (webmcp_canary_business_node) in your theme's functions.php or a small plugin, with the type set to MedicalClinic.",
          ],
          code: FILTER_CODE_EN,
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "The insurance age and count conditions are in a table, with when age is judged and that attempts are counted as embryo transfers.",
            "It says de facto couples are covered and whether your clinic provides insured treatment.",
            "Rule explanations are dated and rewritten when the rules change.",
            "Advanced techniques you offer are listed by formal and short name, with dated costs. No notices remain for techniques no longer offered.",
            "Nothing promises an effect for PGT-A or other techniques.",
            "Self-pay treatment pages give content, cost, main risks and side effects, and a contact point that answers questions, on the same page.",
            "Any pregnancy rate has its denominator, definition, age groups and period beside it, and can be backed up. Procedure numbers are given per year over several years.",
            "No testimonials, promised results, superlatives or comparisons in the page text, FAQs or structured data.",
            "The structured data type is MedicalClinic, prices match the page, and there are no insured costs or pregnancy rates in it.",
            "Name, address, phone and hours match across structured data, Google Business Profile, the official medical directory and professional or municipal listings, and llms.txt lists the insurance, advanced care, cost and access pages. [Clinic basics](/guide/medical-clinic-ai-search), [What is llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear, and whether the answer is right",
          paragraphs: [
            "Once the pages are in order, write five to ten questions people considering treatment might ask, combining area × IVF × age, area × the name of an advanced technique, area × male infertility and area × weekends × fertility treatment. Ask them in ChatGPT and Perplexity. Record whether your clinic appears by name or URL, and also whether the insurance conditions (age and count) and the names of advanced techniques are stated correctly. For fertility care, not being described with old rules or wrong conditions matters more than simply appearing. AI answers change each time, so ask the same questions several times, spaced out. See [how to measure AI visibility](/guide/measure-ai-visibility).",
            "In Nurevo AIO, even the Free and Standard plans ask Perplexity three questions built from your business type and area (without your clinic's name) once a month, and record whether your name or site appeared. The Pro plan (from USD 99 per month) adds beta AI visibility measurement: how often your clinic appears in AI answers, compared with competitors and over time (Perplexity is measured today). Both look at samples of answers, not every answer. Whether the content of an answer is correct, you check by reading the recorded answers.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a fertility clinic start with AI search?", a: "Put the insurance age and count conditions in a table, with when age is judged, how attempts are counted and whether your clinic provides insured treatment. Then list the advanced and self-pay treatments you offer, with cost, risks and dates. Finally, make your name, address and hours match across structured data, Google Business Profile and professional or municipal listings." },
        { q: "How should we write the insurance age and count conditions?", a: "In Japan, IVF and ICSI require the woman to be under 43 when treatment starts; insurance covers up to six attempts per child under 40 and up to three from 40 to under 43, counted as embryo transfers. Put this in a table with an \"as of month/year\" date." },
        { q: "Can we publish pregnancy rates on our site?", a: "Under the MHLW Q&A, treatment effect cannot be advertised; a website can state it if the disclosure conditions are met, but must be able to show evidence and demonstrate it objectively on request. If you publish a rate, we recommend giving the denominator, the definition of pregnancy, the age groups and the period beside it. Check individual cases with your local health authority." },
        { q: "How should we write about advanced treatments?", a: "List the techniques you offer by formal name and short name, with dated costs. The official list is reviewed, so update the same day it changes. Local subsidies differ by municipality, so do not state amounts as fixed; link to the main municipalities' pages." },
        { q: "Which structured data type should we use?", a: "schema.org has no fertility specialty, so use MedicalClinic as the type, Gynecologic as the medicalSpecialty (plus Urologic if you run a male clinic) and treatment names such as insemination and IVF in availableService. Do not include insured costs or pregnancy rates." },
        { q: "Is Nurevo AIO free?", a: `Yes. Business type, address, hours, services with prices and FAQ structured data, llms.txt, AI crawler settings and the AEO score are in the free plan. Paid plans add the always-current ruleset (Standard, USD 20 per month) and beta AI visibility measurement (Pro, from USD 99 per month). [Nurevo AIO on WordPress.org](${WP_ORG})` },
        { q: "Will my clinic be guaranteed to appear in ChatGPT?", a: "No. AI answers vary, and no tool or method can guarantee appearance or ranking. What you can do is make your clinic's facts readable to AI and keep checking whether you appear and whether the conditions are answered correctly." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your fertility clinic's website",
        body: "The free check needs no sign-up and shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AIO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AIO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies. This guide is not legal or medical advice.",
    },
  },
};
