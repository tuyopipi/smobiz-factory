// Content page: AI search (AEO) for internal medicine and paediatric clinics
// (内科・小児科のクリニック・診療所). Industry page. Dentists have their own page
// (dental-clinic-ai-search); this one covers what primary care is asked:
// hours and reception cut-offs, same-day visits, fever / infectious-disease
// visits, vaccinations and check-ups, online consultations.
//
// Written 2026-11-14 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.1), the setup wizard (includes/setup-wizard.php: the "Clinic or dental"
// card sets MedicalBusiness; Physician is in the same family; the business
// type field takes any schema.org type name) or the plugin's tests for the
// opening-hours reader (scripts/test-wordpress-aeo-admin.php: "Mon-Fri
// 9:00-12:00 13:00-18:00" becomes two OpeningHoursSpecification rows; text
// with holidays, "最終受付", nth weekdays or "要予約" is left as written).
//
// Outside facts, checked on the primary pages linked in the copy:
// - schema.org (checked in schema-dts 2.1.0 on 2026-11-14; the schema.org
//   pages themselves could not be fetched from this run): MedicalClinic is a
//   LocalBusiness and MedicalOrganization, "a facility ... devoted to the
//   specific diagnosis and/or healthcare"; Physician has the subtypes
//   IndividualPhysician and PhysiciansOffice ("A doctor's office or clinic");
//   medicalSpecialty (values include PrimaryCare and Pediatric) and
//   availableService are on MedicalClinic and Physician; isAcceptingNewPatients
//   is on MedicalOrganization.
// - MHLW 医療機能情報提供制度 page (2026-11-14): 医療情報ネット (ナビイ) in
//   operation from April 2024, searchable by 診療日, 診療科目, 対応可能な疾患・
//   治療内容 and 提供しているサービス; URL www.iryou.teikyouseido.mhlw.go.jp.
//   Reporting frequency and the full item list were NOT verified: not stated.
// - Mayui press release (2026-09, via Kyodo News PR Wire, read 2026-11-14):
//   5,460 ChatGPT answers (546 prompts x 10), 19 specialties, 6 cities, July
//   2026; official clinic sites cited in 96% of answers to price questions,
//   31% to reputation questions (review/comparison sites 76%).
// - MGMA Stat (2026-06-17, read 2026-11-14): 218 responses, 55% of medical
//   groups have no AI-search strategy; an MGMA analysis of 200 independent
//   practices and about 4,950 ChatGPT prompts found none both named and cited.
// - Google "AI features and your website" and LocalBusiness docs, MHLW medical
//   advertising case book: as checked for dental-clinic-ai-search on
//   2026-10-29 (the Google page could not be fetched from this run, so no new
//   Google claim is made here).
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  medicalClinic: "https://schema.org/MedicalClinic",
  physiciansOffice: "https://schema.org/PhysiciansOffice",
  medicalSpecialty: "https://schema.org/medicalSpecialty",
  mhlwTeikyou: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/teikyouseido/index.html",
  navii: "https://www.iryou.teikyouseido.mhlw.go.jp/",
  mhlwCases: "https://www.mhlw.go.jp/content/10800000/001232587.pdf",
  mayui: "https://kyodonewsprwire.jp/release/202609166024",
  mgma: "https://www.mgma.com/mgma-stat/can-ai-find-your-practice-when-patients-ask",
};

export default {
  slug: "medical-clinic-ai-search",
  targetQueries: [
    "AI search optimization for medical clinics",
    "primary care practice ChatGPT visibility",
    "MedicalClinic schema markup",
    "クリニック AI検索対策",
    "内科 小児科 ChatGPT 表示",
    "診療所 構造化データ MedicalClinic",
  ],
  related: ["dental-clinic-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "appear-in-chatgpt"],
  locales: {
    ja: {
      title: "内科・小児科クリニックのAI検索対策：診療時間・発熱外来・予約 | Nurevo",
      description: "内科・小児科のAI検索対策は、受付終了の時刻、当日の受診方法、発熱時の受診の流れ、予防接種・健診の枠を、本文と構造化データで正確に出すこと。型の選び方と手順を解説。",
      h1: "内科・小児科クリニックのAI検索対策：診療時間・発熱時の受診・予防接種をAIに正しく読ませる手順",
      lead: "内科・小児科クリニックのAI検索対策の中心は、患者さんや保護者がAIに聞く「いま開いているか（受付は何時までか）」「今日診てもらえるか、予約は要るか」「熱があっても受診できるか、どうすればいいか」「予防接種や乳幼児健診はいつ受けられるか」に、ページ本文で曜日・時刻・条件まで書いて答えることです。そのうえで同じ事実を、構造化データ・llms.txt・Googleビジネスプロフィール・医療情報ネット（ナビイ）と矛盾なくそろえます。医療広告のルールはAI向けの文章にも同じようにかかります。",
      intro: [
        "作成日：2026年11月14日（JST）。厚生労働省の医療情報ネットのページ、schema.orgの型（schema-dts 2.1.0の型定義）、引用した調査は同日に確認しました。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがクリニックの事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "患者さんと保護者はAIに何を聞くか",
          paragraphs: [
            "内科や小児科は、「急に具合が悪くなった」ときに探されることが多い診療科です。そのため質問は、「◯◯駅の近くで今から診てもらえる内科」「土曜の午後に開いている小児科」「発熱しているけど予約なしで行ける？」「生後2か月の予防接種はどこで受けられる？」「オンライン診療をしているクリニック」のように、時間と条件が入ったものになりがちです。",
            "AIがこうした質問にクリニック名を挙げるには、その条件を満たすことが文字で読み取れる必要があります。診療時間が画像の表だけ、受付終了の時刻が書かれていない、「発熱の方はお電話ください」だけで受診できる時間帯がわからない、といったページは、条件つきの質問の答えに使いにくくなります。",
            `ChatGPTの回答5,460件を調べた民間の調査（Mayui社、2026年7月、19診療科・6都市）では、料金を聞く質問では医療機関の公式サイトが96%の回答で引用された一方、評判を聞く質問では公式サイトが31%、口コミ・比較サイトが76%でした。[調査のプレスリリース](${SRC.mayui})。事実を聞かれたときに公式サイトが出典になりやすいということで、診療時間や受診方法のような事実こそ自院のサイトに正確に書く価値があります（調査の数字は一事業者のもので、AIの回答は変わる点に注意してください）。`,
          ],
        },
        {
          heading: "内科・小児科で特に書いておきたい事実と、書き方",
          paragraphs: [
            "上位の記事の多くは「診療時間・診療科目・アクセスを正しく」で終わっていますが、内科・小児科では、時間と受診方法の条件をどこまで書くかで、AIが答えに使えるかが変わります。目安は次のとおりです。",
          ],
          table: {
            head: ["事実", "ページ本文での書き方", "注意点"],
            rows: [
              ["診療時間と受付時間", "曜日ごとの午前・午後の診療時間と、受付終了の時刻（例：午前は11:30まで受付）", "「9:00〜12:00」だけだと、12時直前に来てよいと読まれる"],
              ["休診日", "休診の曜日、午後休診の曜日、祝日の扱い", "「木曜午後・日曜・祝日休診」のように曜日と半日を分ける"],
              ["臨時休診・年末年始", "日付と、その間の代わりの受診先の案内", "お知らせ欄だけでなく、診療時間の近くにも書く"],
              ["予約と当日の受診", "予約制か、順番受付か、予約なしでも受診できるか。ウェブ予約・電話予約の受付時間", "「予約優先」なら、予約なしの人がどうなるかも書く"],
              ["発熱・感染症が疑われるとき", "事前の連絡が必要か、受診できる時間帯、入口や待合を分けているか、検査の可否", "「お電話ください」だけにせず、何時から何時まで、どの番号へかを書く"],
              ["小児の診療", "何歳から診るか、乳幼児健診・予防接種の曜日と時間、予約方法、持ち物", "一般の診療と時間を分けている場合は、その時間帯を表にする"],
              ["予防接種・健診", "扱っているワクチン・健診の種類、予約の要否、自費のものは料金", "定期接種・任意接種の区別をつけて書く"],
              ["オンライン診療", "している・していない、対象（再診のみ等）、予約方法、使うサービス", "対象の条件を書かないと、初診も受けられると読まれやすい"],
              ["診療科目と医師", "標榜している診療科名、医師の名前・専門・資格", "比較や誇張になる言葉は使わない（下のルール参照）"],
              ["支払い・設備", "マイナ保険証・キャッシュレス対応、駐車場、ベビーカー・車いすでの来院", "変わったら、サイトとGoogleビジネスプロフィールを同時に直す"],
              ["夜間・休日", "診療時間外の連絡先の案内（地域の休日当番医、小児なら#8000〔子ども医療電話相談〕など）", "自院で対応しない時間帯は、そう書いたうえで案内先を示す"],
            ],
            caption: "表は、内科・小児科でAIに聞かれやすい条件と、上位の記事で抜けていた項目をもとにしています。",
          },
          after: [
            "どの値も、ページ本文・構造化データ・Googleビジネスプロフィール・医療情報ネット・院内掲示で同じにします。Googleは、AIによる概要などの機能のためにも、ビジネスプロフィールを最新に保つことを勧めています。[Google：AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "診療時間は「画像の表」ではなく文字で",
          paragraphs: [
            "クリニックのサイトでは、診療時間を「○×」の画像の表で載せていることがよくあります。人には見やすい表でも、画像の中の文字はAIのクローラが確実に読めるとは限りません。HTMLの表か文章で、同じ内容を書いてください。",
            "書き方の例：「月・火・水・金 9:00〜12:00（受付11:30まで）、15:00〜18:00（受付17:30まで）。土 9:00〜12:00。木曜午後・日曜・祝日は休診。発熱の方は、診療時間内にお電話のうえ、指定の時間にお越しください。」のように、曜日・時刻・受付終了・休診・例外を1か所にまとめます。",
            "AIは「いま開いているか」を聞かれると、この情報をもとに答えます。祝日の扱いや受付終了の時刻が抜けていると、閉まっている時間に「開いている」と答えられてしまうおそれがあります。",
          ],
        },
        {
          heading: "医療情報ネット（ナビイ）と値をそろえる",
          paragraphs: [
            `厚生労働省は2024年4月から、全国の病院・診療所・薬局などを探せる「医療情報ネット（ナビイ）」を運用しています。診療日や診療科目のほか、対応できる病気や治療の内容、提供しているサービスでも探せる仕組みです。[厚生労働省：医療機能情報提供制度](${SRC.mhlwTeikyou})／[医療情報ネット](${SRC.navii})`,
            "医療情報ネットは、医療機関が都道府県に報告した情報をもとにした公的な情報です。AIや患者さんが自院のサイトと見比べたときに値が食い違っていると、どちらが正しいかわからなくなります。診療時間や診療科目を変えたときは、自院のサイト・Googleビジネスプロフィールとあわせて、報告している内容も確認してください。",
          ],
        },
        {
          heading: "医療広告のルール：AI向けでも書かないこと",
          paragraphs: [
            `日本では、医療機関のウェブサイトも医療広告規制の対象です。厚生労働省の事例解説書では、虚偽・誇大・比較優良の表示や、患者さんの体験談などが禁止される例として挙げられています。[厚生労働省：医療広告規制におけるウェブサイトの事例解説書（PDF）](${SRC.mhlwCases})。AIに選ばれるための文章やFAQ、構造化データでも同じです。`,
          ],
          list: [
            "「地域で一番」「必ず治る」「どこよりも早く診ます」のような最上級・比較・効果を約束する言葉は使わない。",
            "患者さんの体験談や感想を、FAQや構造化データのレビューとして載せない。",
            "症状のページを作るときは、「この症状ならこの病気」と決めつけず、受診の目安と、当院で何ができるか（検査・診療の範囲）を書く。",
            "自費の予防接種や検査は、内容と料金を一緒に書く。",
          ],
          after: [
            "細かな判断に迷う場合は、事例解説書や管轄の保健所で確認してください。歯科医院での具体例は[歯科医院のAI検索対策](/ja/guide/dental-clinic-ai-search/)でも解説しています。",
          ],
        },
        {
          heading: "構造化データ：MedicalClinic・Physicianの選び方",
          paragraphs: [
            "schema.orgには、クリニックを表す型が複数あります（2026年11月14日にschema-dts 2.1.0の型定義で確認）。どれもLocalBusinessの一種なので、住所・電話番号・営業時間をそのまま持てます。",
          ],
          table: {
            head: ["型・プロパティ", "意味", "内科・小児科での使い方"],
            rows: [
              [`[MedicalClinic](${SRC.medicalClinic})`, "診断や医療を行う施設", "複数の医師がいる診療所や、外来中心のクリニックに"],
              [`Physician／[PhysiciansOffice](${SRC.physiciansOffice})`, "医師、または医師の診療所（PhysiciansOfficeは「医院・クリニック」）", "院長が1人で診る医院に。Nurevo AEOの業種の候補にもPhysicianがあります"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "診療の分野", "内科ならPrimaryCare、小児科ならPediatricなどの値がある"],
              ["isAcceptingNewPatients", "新しい患者を受け付けているか（MedicalOrganizationのプロパティ）", "かかりつけのみの診療などで受け付けていない時期がある場合に"],
              ["openingHoursSpecification", "曜日ごとの営業時間", "午前・午後に分かれる診療時間は2行にする"],
            ],
          },
          after: [
            `Googleのローカルビジネスの構造化データでは、nameとaddressが必須で、できるだけ具体的な型を使うよう案内されています。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})。型より大切なのは、構造化データの値がページ本文と一致していることです。受付終了の時刻や発熱時の受診方法のように、決まった入れ場所がない事実は本文に書きます。`,
          ],
        },
        {
          heading: "WordPressのクリニックサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「クリニック・歯科」を選びます（型はMedicalBusinessになります）。医院として出したい場合は、設定画面の「業種（schema.org型）」欄をPhysicianなど、より具体的な型に変えます。",
            "クリニック名・住所・電話番号・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "営業時間の欄には、曜日と時刻だけを「月〜金 9:00-12:00 15:00-18:00 / 土 9:00-12:00」のように書きます。Nurevo AEOはこの形を曜日ごとの営業時間（午前・午後の2行）に変換します。祝日・「最終受付」・「第2火曜」などを入れた場合は、誤った時間を出さないよう変換せず書いたままの文字で出すため、受付終了や祝日の扱いは本文に書きます。",
            "設定画面で、一般内科・小児科・予防接種・乳幼児健診・オンライン診療など、行っている診療をサービスとして登録し、よく聞かれる質問（発熱時の受診方法、予約の要否、何歳から診るか）をFAQに入れます。FAQは、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置いたページのFAQPageに追加されます。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・営業時間と、より具体的な型だけを足します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/ja/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "診療時間が画像だけでなく文字で書かれ、受付終了の時刻・午後休診・祝日の扱いがある。",
            "予約制か順番受付か、予約なしでも受診できるかが書かれている。",
            "発熱・感染症が疑われるときの受診方法が、連絡先・時間帯つきで書かれている。",
            "小児科は対象年齢と、予防接種・乳幼児健診の曜日・時間・予約方法が書かれている。",
            "オンライン診療の有無と対象が書かれている。",
            "臨時休診・年末年始の日付が、診療時間の近くに書かれている。",
            "構造化データ・Googleビジネスプロフィール・医療情報ネットの名前・住所・電話番号・診療時間が本文と一致している。",
            "最上級・比較・体験談など、医療広告で禁止される表示がFAQや構造化データに入っていない。",
            "llms.txtに、診療案内・診療時間・アクセス・予約のページが載っている。[llms.txtとは](/ja/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、患者さんや保護者が聞きそうな質問を、地域・曜日や時間帯・症状の種類・予約の有無の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げます。クリニックが名前やURLで出るか、診療時間や受診方法が正しく書かれているかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。測り方の詳細は[AIでの登場率の測り方](/ja/guide/measure-ai-visibility/)にまとめています。",
            `米国の医療経営団体MGMAの分析では、独立系の診療所200件について約4,950の質問をChatGPTに投げたところ、名前が出て、かつサイトが引用された診療所はありませんでした。[MGMA Stat](${SRC.mgma})。国や条件は違いますが、「出ているつもり」で終わらせず、実際に質問して確かめることが大切です。`,
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（クリニック名は含めません）をPerplexityに投げ、回答にクリニックの名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答にクリニックが出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "内科・小児科のAI検索対策は、何から始めればいいですか？", a: "診療時間を文字で書き、受付終了の時刻・午後休診・祝日の扱いを添えることからです。次に、予約の要否、発熱時の受診方法、予防接種・健診の時間を本文に書き、名前・住所・電話番号・診療時間を構造化データ・Googleビジネスプロフィール・医療情報ネットとそろえます。" },
        { q: "構造化データの型はMedicalClinicとPhysicianのどちらがいいですか？", a: "どちらもLocalBusinessの一種で、住所や診療時間を持てます。複数の医師がいる診療所ならMedicalClinic、院長が1人で診る医院ならPhysician（医院を表すPhysiciansOfficeもあります）が目安です。型の違いより、値が本文と一致していることのほうが大切です。" },
        { q: "診療時間の画像の表は、やめたほうがいいですか？", a: "やめる必要はありませんが、同じ内容を文字（HTMLの表か文章）でも書いてください。画像の中の文字は、AIのクローラが確実に読めるとは限りません。" },
        { q: "発熱外来の情報は、どこまで書けばいいですか？", a: "事前の連絡が必要か、受診できる時間帯、連絡先、入口や待合を分けているか、検査ができるかを書きます。「お電話ください」だけだと、AIは受診できるかどうかを答えにくくなります。" },
        { q: "AIに選ばれるために、患者さんの口コミをFAQに載せてもいいですか？", a: "日本では、医療機関のウェブサイトも医療広告規制の対象で、患者さんの体験談は禁止される例として扱われています。AI向けのFAQや構造化データにも入れないでください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・診療時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTにクリニックが必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIがクリニックの事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがクリニックのサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的・医学的な助言ではありません。",
    },
    en: {
      title: "AI Search for Medical Clinics: Hours, Same-Day Visits | Nurevo",
      description: "AEO for primary care and paediatric clinics: publish check-in cut-offs, walk-in rules, how to visit with a fever and vaccination times as text and matching schema.",
      h1: "AI search for primary care and paediatric clinics: how to get AI to read your hours, same-day visits and vaccinations correctly",
      lead: "AI search optimization for a primary care or paediatric clinic comes down to answering, on the page and down to the day and the minute, the questions patients and parents now ask AI: are you open now and until when can I check in, can I be seen today and do I need an appointment, can I come in with a fever and what should I do first, and when can my child get vaccinated or have a check-up. Then you publish the same facts consistently in structured data, llms.txt, your Google Business Profile and any official health directory you are listed in. Healthcare advertising rules apply to text written for AI just as they do to the rest of your site.",
      intro: [
        "Written November 14, 2026 (JST). The Japanese Ministry of Health page on its national medical directory, schema.org's types (as defined in schema-dts 2.1.0) and the studies cited were checked that day. Examples of rules come from Japan; check the rules where you practise.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your clinic's facts readable to AI. They do not guarantee that an AI will mention your clinic or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What patients and parents ask AI",
          paragraphs: [
            "Primary care and paediatrics are what people look for when someone has just become unwell. So the questions carry time and conditions: \"a GP near [station] that can see me now\", \"a paediatrician open on Saturday afternoon\", \"I have a fever, can I walk in without booking?\", \"where can my two-month-old get vaccinated?\", \"a clinic that offers online consultations\".",
            "For an AI to name your clinic in an answer like that, it has to be able to read, as text, that you meet those conditions. Hours shown only as an image, no check-in cut-off, or a line saying only \"patients with a fever, please call\" with no times are hard to use when the question has conditions.",
            `A study of 5,460 ChatGPT answers by Mayui, a Japanese company (July 2026, 19 specialties, six cities), found that official clinic websites were cited in 96% of answers to questions about prices, but in only 31% of answers about reputation, where review and comparison sites appeared in 76%. [Press release (Japanese)](${SRC.mayui}). When AI is asked for facts, your own site is a likely source, so facts such as hours and how to visit are worth writing precisely there. These figures come from a single vendor, and AI answers change.`,
          ],
        },
        {
          heading: "The facts to publish, and how to write them",
          paragraphs: [
            "Most top-ranking articles stop at \"get your hours, specialties and location right\". For primary care and paediatrics, what decides whether AI can use them is how far you spell out times and conditions. This is a good baseline:",
          ],
          table: {
            head: ["Fact", "How to write it on the page", "Watch out for"],
            rows: [
              ["Hours and check-in times", "Morning and afternoon hours for each day, and the last check-in time (for example, morning check-in until 11:30)", "\"9:00-12:00\" alone reads as if arriving at 11:55 is fine"],
              ["Days closed", "Days closed, half days, and what happens on public holidays", "Separate full and half days: \"closed Thursday afternoon, Sunday and public holidays\""],
              ["Temporary closures and holidays", "The dates, and where patients can go instead", "Put them next to your hours, not only in a news feed"],
              ["Appointments and same-day visits", "Appointment only, queue on arrival, or walk-ins accepted; hours for online and phone booking", "If appointments take priority, say what happens to walk-ins"],
              ["Fever or suspected infection", "Whether to call first, the hours for these visits, separate entrance or waiting area, which tests you can do", "Do not stop at \"please call\": give the hours and the number"],
              ["Children", "From what age you see children, the days and hours for check-ups and vaccinations, how to book, what to bring", "If these run at separate times from general clinics, give them their own table"],
              ["Vaccinations and check-ups", "Which vaccines and check-ups you offer, whether booking is needed, and prices for anything self-paid", "Separate routine schedule vaccines from optional ones"],
              ["Online consultations", "Whether you offer them, for whom (for example, follow-up visits only), how to book, which service you use", "Without the conditions, readers assume first visits are possible too"],
              ["Specialties and doctors", "The specialties you are registered to show, and each doctor's name, field and qualifications", "No comparative or exaggerated wording (see the rules below)"],
              ["Payment and access", "Insurance cards and cashless payment, parking, buggy and wheelchair access", "When these change, update your site and Business Profile together"],
              ["Nights and weekends", "Where to turn outside your hours (the local out-of-hours service, a children's health phone line such as Japan's #8000)", "Say clearly when you do not see patients, then say where to go"],
            ],
            caption: "The list is based on the conditions AI is asked about for primary care and paediatrics, and the items the top-ranking articles left out.",
          },
          after: [
            "Keep every value the same across your page text, structured data, Google Business Profile, official directory listing and the notice at your door. Google recommends keeping your Business Profile up to date, including for its AI features. [Google: AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "Write your hours as text, not as an image",
          paragraphs: [
            "Clinic sites often show their hours as an image of a grid with ticks and crosses. People can read it, but AI crawlers cannot be relied on to read text inside an image. Put the same information in an HTML table or a sentence.",
            "For example: \"Mon, Tue, Wed, Fri 9:00-12:00 (check-in until 11:30) and 15:00-18:00 (check-in until 17:30). Sat 9:00-12:00. Closed Thursday afternoon, Sunday and public holidays. If you have a fever, please call during opening hours and come at the time we give you.\" Days, times, check-in cut-offs, closures and exceptions all in one place.",
            "When AI is asked whether you are open now, this is what it answers from. If public holidays or the check-in cut-off are missing, it may tell someone you are open when you are not.",
          ],
        },
        {
          heading: "Match the official medical directory",
          paragraphs: [
            `Many countries run an official directory of doctors and clinics. In Japan, the Ministry of Health, Labour and Welfare has operated the national directory 医療情報ネット (nicknamed ナビイ) since April 2024. It covers hospitals, clinics and pharmacies, and can be searched by consultation days and specialties as well as by the conditions and treatments a clinic handles and the services it offers. [MHLW: medical function information system (Japanese)](${SRC.mhlwTeikyou}) / [医療情報ネット](${SRC.navii})`,
            "Directory entries are built from what clinics report to the authorities. If an AI or a patient compares them with your website and finds different hours, neither can tell which is right. When you change your hours or specialties, check what you have reported as well as your site and Business Profile.",
          ],
        },
        {
          heading: "Healthcare advertising rules: what not to write for AI",
          paragraphs: [
            `In Japan, clinic websites are covered by medical advertising rules. The Ministry's case book lists false, exaggerated and comparative claims and patient testimonials among the prohibited examples. [MHLW website case book (PDF, Japanese)](${SRC.mhlwCases}). The same applies to text, FAQ and structured data written for AI. Other countries have their own rules; check the ones that apply to you.`,
          ],
          list: [
            "No superlatives, comparisons or promised outcomes: \"best in the area\", \"guaranteed cure\", \"seen faster than anywhere else\".",
            "No patient testimonials or comments in your FAQ, or as reviews in structured data.",
            "On symptom pages, do not map a symptom to a diagnosis. Say when to see a doctor and what your clinic can do (tests and treatment you offer).",
            "For self-paid vaccines and tests, give the content and the price together.",
          ],
          after: [
            "If you are unsure, check the case book or your local health authority. For dental examples, see [AI search for dental clinics](/guide/dental-clinic-ai-search/).",
          ],
        },
        {
          heading: "Structured data: MedicalClinic or Physician",
          paragraphs: [
            "schema.org has several types for a clinic (checked in schema-dts 2.1.0's type definitions on November 14, 2026). All of them are kinds of LocalBusiness, so they carry an address, phone number and opening hours.",
          ],
          table: {
            head: ["Type or property", "What it means", "How to use it in primary care"],
            rows: [
              [`[MedicalClinic](${SRC.medicalClinic})`, "A facility for diagnosis and healthcare", "A practice with several doctors, or an outpatient clinic"],
              [`Physician / [PhysiciansOffice](${SRC.physiciansOffice})`, "A physician or a physician's office (PhysiciansOffice is \"a doctor's office or clinic\")", "A practice run by a single doctor. Physician is also among Nurevo AEO's business types"],
              [`[medicalSpecialty](${SRC.medicalSpecialty})`, "The medical specialty of the provider", "Values include PrimaryCare and Pediatric"],
              ["isAcceptingNewPatients", "Whether new patients are accepted (a MedicalOrganization property)", "For periods when you only see registered patients"],
              ["openingHoursSpecification", "Opening hours by day of the week", "Split morning and afternoon sessions into two rows"],
            ],
          },
          after: [
            `Google's local business structured data requires name and address and asks you to use the most specific type you can. [Google: Local business structured data](${SRC.googleLocal}). More important than the type is that every value matches your page text. Facts that have no set place in structured data, such as check-in cut-offs and how to visit with a fever, belong in the page text.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress clinic site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Keep Yoast SEO, Rank Math, All in One SEO or Slim SEO. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.`,
            "In the setup wizard, choose \"Clinic or dental\" (this sets the type to MedicalBusiness). To publish a more specific type, change the \"Business type (schema.org type)\" field in Settings to Physician or another type.",
            "Check your clinic name, address, phone and description. Only blank fields are filled from your existing settings; values you typed are never overwritten.",
            "In the opening hours field, write only days and times, such as \"Mon-Fri 9:00-12:00 15:00-18:00 / Sat 9:00-12:00\". Nurevo AEO turns that into opening hours by day, with morning and afternoon as two rows. If the text includes public holidays, a \"last check-in\" note or \"second Tuesday\", it is published as written rather than converted, so that no wrong hours are published; put cut-offs and holidays in the page text instead.",
            "In Settings, add what you offer as services (general medicine, paediatrics, vaccinations, child check-ups, online consultations) and add common questions to the FAQ (how to visit with a fever, whether booking is needed, from what age you see children). The FAQ is added to the page's FAQPage where you place the Nurevo FAQ block or the [nurevo_faq] shortcode.",
            "Run the diagnosis on the AEO screen and apply the one-click fixes. To see how your site looks from outside, use the [free AI readability check](/check).",
          ],
          after: [
            "With an SEO plugin, Nurevo AEO does not publish a second set of structured data. It adds only what the SEO plugin's graph lacks: address, phone, opening hours and a more specific type. See [adding business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Your hours are written as text, not only as an image, with check-in cut-offs, half days and public holidays.",
            "You say whether visits are by appointment, by queue, or open to walk-ins.",
            "How to visit with a fever or suspected infection is written with the number to call and the hours.",
            "For children, the age you see them from and the days, hours and booking method for vaccinations and check-ups are written.",
            "Whether you offer online consultations, and for whom, is written.",
            "Temporary closures and holiday dates are next to your hours.",
            "Name, address, phone and hours in structured data, your Business Profile and the official directory match your page text.",
            "No superlatives, comparisons or testimonials in your FAQ or structured data.",
            "llms.txt lists your services, hours, access and booking pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, write five to ten questions a patient or parent would ask, combining area, day or time, type of symptom and booking. Put them to ChatGPT and Perplexity and record whether your clinic appears by name or URL, and whether your hours and how to visit are stated correctly. Answers vary from run to run, so ask the same questions again over time. See [how to measure AI visibility](/guide/measure-ai-visibility/) for the method.",
            `In the US, an MGMA analysis put about 4,950 prompts to ChatGPT about 200 independent practices and found none that was both named and cited. In an MGMA Stat poll of 218 medical groups, 55% said they had no AI search strategy. [MGMA Stat](${SRC.mgma}). Settings differ by country, but the point holds: do not assume you appear; ask and check.`,
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your clinic's name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, showing how often your clinic appears in AI answers, with competitor comparison and history (it currently measures Perplexity). Both look at a sample of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a primary care clinic start with AI search?", a: "Write your hours as text, with the check-in cut-off, half days and public holidays. Then put booking rules, how to visit with a fever and vaccination and check-up times in your page text, and make your name, address, phone and hours match across structured data, your Google Business Profile and any official directory." },
        { q: "Should a clinic use MedicalClinic or Physician structured data?", a: "Both are kinds of LocalBusiness and carry an address and opening hours. As a rule of thumb, use MedicalClinic for a practice with several doctors and Physician for a single-doctor practice (PhysiciansOffice also exists for a doctor's office). That the values match your page text matters more than which type you pick." },
        { q: "Should we remove the image of our opening hours?", a: "You do not need to remove it, but write the same information as text too, in an HTML table or a sentence. AI crawlers cannot be relied on to read text inside an image." },
        { q: "How much should we say about fever visits?", a: "Say whether patients should call first, the hours for these visits, the number to call, whether you have a separate entrance or waiting area, and which tests you can do. With only \"please call\", an AI cannot tell whether someone can be seen." },
        { q: "Can we add patient reviews to our FAQ to help AI pick us?", a: "Check your local rules first. In Japan, clinic websites are covered by medical advertising rules and patient testimonials are treated as prohibited. Do not put them in FAQ or structured data written for AI either." },
        { q: "Is Nurevo AEO free?", a: `Yes. Structured data for your business type, address, hours, services and FAQ, plus llms.txt, AI crawler rules and the AEO score, are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee our clinic appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your clinic's website",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal or medical advice.",
    },
  },
};
