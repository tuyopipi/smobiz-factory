// Content page: AI search (AEO) for nurseries, preschools / kindergartens and
// certified centres for early childhood education and care (保育園・幼稚園・認定こども園).
// Industry page.
//
// Written 2026-11-13 (JST). Every claim about Nurevo AEO is one the plugin's
// readme or code makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// no setup-wizard card claims ChildCare or Preschool, so such a site picks
// "Other" (ja: その他) and a type no card claims is kept
// (webmcp_canary_wizard_business_type_for, includes/setup-wizard.php); Settings has
// the free-text "Business type (schema.org type)" field (ja: 業種（schema.org型）),
// one type name (/^[A-Za-z][A-Za-z0-9]*$/, webmcp_canary_business_schema_type);
// ChildCare is in webmcp_canary_local_business_types and a configured type is
// recognised as the business node either way (webmcp_canary_is_business_node).
// Opening hours: webmcp_canary_opening_hours_specification was run on 2026-11-13
// against the shipped code: "月〜金 7:00-19:00、土 7:30-18:00、日曜定休" and
// "Mon-Fri 7:00-19:00 / Sat 7:30-18:00" become openingHoursSpecification;
// anything mentioning 祝日 (public holidays) is left as written, by design
// (the docblock says it gives up on public holidays). Services, FAQ block,
// free monthly Perplexity check and Pro measurement as in the vet clinic page.
//
// Outside facts:
// - schema.org hierarchy, checked 2026-11-13 against schema-dts 2.1.0 (generated
//   from the schema.org vocabulary; schema.org itself could not be fetched from
//   this run): ChildCare is in the LocalBusiness union (ChildCareLeaf extends
//   LocalBusinessBase); Preschool extends EducationalOrganization, which extends
//   Organization and CivicStructure (a Place), not LocalBusiness.
// - Kumamoto Prefecture, 認可外保育施設について (updated 2026-07-08, read
//   2026-11-13): definition; 届出 under 児童福祉法第59条の2; from 令和6年10月,
//   facilities not meeting the national 認可外保育施設指導監督基準 are outside the
//   free-childcare scheme; links ここdeサーチ for parents.
// - Kumamoto City, 令和8年度 / 令和9年度 保育所等の入所について (both last updated
//   2026-10-01, read 2026-11-13): 保育所・認定こども園（保育部分）・地域型保育
//   applications go to the ward office 保健こども課 or the first-choice facility as
//   a window, with 利用調整 by points; 支給認定 1号/2号/3号; 幼稚園・認定こども園
//   （幼稚園部分）・認可外 apply to each facility directly.
// - Google "AI features and your website" (checked 2026-11-12), OpenAI crawlers
//   (checked 2026-10-31), Google LocalBusiness "most specific sub-type"
//   (checked 2026-10-29) — same as the other industry pages.
// - cfa.go.jp and wam.go.jp could not be fetched from this run, so the free
//   childcare amounts and the operator of ここdeサーチ are not stated.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  childCare: "https://schema.org/ChildCare",
  preschool: "https://schema.org/Preschool",
  localBusiness: "https://schema.org/LocalBusiness",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  kumamotoPref: "https://www.pref.kumamoto.jp/kiji_2334.html",
  kumamotoCity: "https://www.city.kumamoto.jp/kiji00364241/",
  kumamotoCityNext: "https://www.city.kumamoto.jp/kiji00371314/index.html",
  kokode: "https://www.wam.go.jp/kokodesearch/",
};

export default {
  slug: "nursery-preschool-ai-search",
  targetQueries: [
    "AI search optimization for daycare and preschools",
    "how to get my nursery recommended by ChatGPT",
    "ChildCare schema markup",
    "保育園 AI検索対策",
    "幼稚園 ChatGPT 表示",
    "保育園 構造化データ",
  ],
  related: ["dental-clinic-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "search-console-ai-features"],
  locales: {
    ja: {
      title: "保育園・幼稚園のAI検索対策：申込先・預かり時間・見学をAIに伝える | Nurevo",
      description: "保育園・幼稚園・認定こども園のAI検索対策。申込先が園か市区町村か、対象年齢・預かり時間・延長保育・見学をAIに正しく読ませる書き方、ChildCare・Preschoolの型、WordPressでの手順。",
      h1: "保育園・幼稚園・認定こども園のAI検索対策：申込先・対象年齢・預かり時間・見学をAIに正しく読ませる手順",
      lead: "保育園・幼稚園・認定こども園のAI検索対策は、保護者がAIに聞く事実（対象年齢、開園時間と延長保育、一時預かり、給食とアレルギー対応、見学の方法、そして「どこに申し込むか」）を、ページ本文と構造化データに正確に書くことです。園ならではの要点は申込先です。認可保育所の利用は市区町村の利用調整を通るため、AIが「園に申し込めば入れます」と答えないよう、園の種類ごとの申込先をはっきり書いておきます。",
      intro: [
        "作成日：2026年11月13日（JST）。schema.org・Google・OpenAI・熊本県・熊本市の情報は、本文に書いた日付に確認しました。申込の方法や無償化の扱いは自治体と年度で変わるため、必ずお住まいの自治体の最新の案内に合わせてください。",
        "ChatGPTやPerplexity、GoogleのAIによる概要は、「◯◯駅の近くで0歳から預けられる保育園」「延長保育が19時までの園」「見学できる幼稚園」のような質問に、園のサイトや自治体のページ、地図の情報を組み合わせて答えます。AIの回答は質問のたびに変わり、どの対策でも表示は保証できません。それでも、事実が文字で書かれ、ほかの掲載情報と一致している園のほうが、正しく紹介されやすくなります。",
      ],
      sections: [
        {
          heading: "保護者がAIに聞くことと、AIが間違えやすいこと",
          paragraphs: [
            "保護者の質問は「場所＋子どもの年齢＋時間の条件」で来ることが多く、答えに必要な事実はほぼ決まっています。下の表は、よくある質問ごとに、サイトに書いておくことと、書いていないとAIが間違えやすい点をまとめたものです。",
          ],
          table: {
            head: ["よくある質問", "サイトに書くこと", "書いていないと起きやすい間違い"],
            rows: [
              ["0歳から預けられる？", "受け入れ年齢（例：生後57日〜5歳児）とクラスごとの定員", "受け入れていない年齢の子を案内される"],
              ["何時まで預けられる？", "開園時間、標準時間・短時間の時間帯、延長保育の時間と申込方法", "延長保育の終わりの時刻を開園時間と取り違える"],
              ["土曜や祝日は？", "土曜保育の有無と時間、日曜・祝日・年末年始の休園", "祝日も開いていると答えられる"],
              ["どこに申し込む？", "園の種類と申込先（市区町村か園か）、受付の時期", "認可保育所なのに「園に直接申し込む」と案内される"],
              ["見学できる？", "見学の曜日・時間帯、予約の方法、所要時間", "見学できない時期に「いつでも可」と案内される"],
              ["給食とアレルギーは？", "自園調理か、アレルギー対応の範囲と相談の流れ", "対応していない除去食を「対応可」と答えられる"],
              ["一時預かりはある？", "一時保育の有無・対象年齢・予約方法・料金の決まり方", "やっていない一時保育を案内される"],
            ],
          },
          after: [
            "どの事実も、画像やPDFの中だけでなく、ページの本文に文字で書くのが基本です。園のしおりをPDFで載せている場合も、上の項目は本文に書き出しておきます。",
          ],
        },
        {
          heading: "申込先は、園の種類ごとに書き分ける",
          paragraphs: [
            `申込先は園の種類で違います。熊本市の例では、保育所・認定こども園（保育部分）・地域型保育事業の利用は、区役所の保健こども課（第1希望の園も窓口になる）やマイナポータルで申し込み、市が「申請内容」と「保育を必要とすることを証明する書類」を点数化して利用調整（選考）をします。一方、幼稚園・認定こども園（幼稚園部分）・認可外保育施設は、各施設へ直接申し込みます（[熊本市：令和8年度 保育所等の入所について](${SRC.kumamotoCity})、最終更新2026年10月1日、2026年11月13日確認）。細かな手順は自治体ごとに違うので、自分の園の所在地の自治体の案内で確かめて書きます。`,
            "AIは「◯◯保育園に入るには？」と聞かれると、園のサイトにある「お問い合わせはこちら」だけを手がかりに、園への直接申込を案内しがちです。園のサイトに次のような1文があるだけで、誤案内はぐっと減らせます。",
          ],
          table: {
            head: ["園の種類（例）", "申込先の書き方の例", "あわせて書くこと"],
            rows: [
              ["認可保育所", "「入園のお申し込みは◯◯市（区役所◯◯課）で受け付けています。当園では見学のご予約を受け付けています。」", "自治体の入所案内ページへのリンク、受付時期"],
              ["認定こども園", "「保育を希望する方（2号・3号認定）は◯◯市へ、教育を希望する方（1号認定）は当園へお申し込みください。」", "それぞれの対象年齢と預かり時間"],
              ["幼稚園", "「入園のお申し込みは当園で受け付けています。」", "願書の配布・受付の時期、説明会の日程"],
              ["認可外保育施設", "「お申し込みは当園へ直接お願いします。」", "届出の状況、月極・一時預かりの別、料金"],
            ],
          },
          after: [
            "空き状況は日々変わるため、本文に書くなら「2026年11月1日現在」のように日付を添え、更新できないなら自治体の空き状況のページへのリンクだけにします。古い空き情報がAIに読まれ続けるのがいちばん困るからです。",
          ],
        },
        {
          heading: "認可外保育施設が書いておくこと",
          paragraphs: [
            `認可外保育施設は、都道府県知事や市町村長の設置認可を受けていない保育施設の総称で、児童福祉法第59条の2に基づく届出の対象です。熊本県は、令和6年10月から、国の「認可外保育施設指導監督基準」を満たさない認可外保育施設は保育の無償化の対象外になったと案内しています（[熊本県：認可外保育施設について](${SRC.kumamotoPref})、更新日2026年7月8日、2026年11月13日確認）。`,
            "保護者がAIに「この園は無償化の対象？」と聞いたとき、園のサイトに答えがなければ、AIは一般論で答えるしかありません。届出の状況と無償化の扱いを、自治体に確認したうえで本文に書いておきます。確認できていないことを「対象です」と書かないことも同じくらい大切です。",
            `熊本県のページは、保護者向けに国の検索サイト「ここdeサーチ」（[子ども・子育て支援情報公表システム](${SRC.kokode})）を案内しています。認可・認可外を問わず、こうした公的な検索サイトや自治体の一覧に載っている園名・住所・電話番号・開所時間と、自園のサイトの値がそろっているかも確認します。`,
          ],
        },
        {
          heading: "構造化データの型：ChildCareとPreschool",
          paragraphs: [
            `schema.orgには、保育施設を表す[ChildCare](${SRC.childCare})と、幼稚園・就学前教育の施設を表す[Preschool](${SRC.preschool})があります。2026年11月13日にschema.orgの語彙から生成された型定義（schema-dts 2.1.0）で確かめたところ、ChildCareは[LocalBusiness](${SRC.localBusiness})の下位の型で、Preschoolは教育機関（EducationalOrganization）の下位の型です。EducationalOrganizationは組織であると同時に場所（CivicStructure）でもあるので、どちらの型でも住所・電話番号・開園時間を書けます。Googleは店舗情報の構造化データでは、できるだけ具体的な下位の型を使うよう案内しています（[Google：LocalBusiness](${SRC.googleLocal})）。`,
          ],
          table: {
            head: ["書き方", "向いている園", "注意"],
            rows: [
              ["ChildCare", "保育所、認可外保育施設、小規模保育、保育中心の認定こども園", "LocalBusinessの下位なので、店舗情報として扱われやすい"],
              ["Preschool", "幼稚園、教育中心の認定こども園", "LocalBusinessの下位ではない。地図や店舗情報の型としては読まれにくいことがある"],
              ["ChildCareとPreschoolの両方", "保育と教育の両方を受け入れる認定こども園", "型を複数書ける仕組みが必要。どちらの場合も本文に事実が書かれていることが前提"],
            ],
          },
          after: [
            "構造化データには、園児の名前や顔写真、行事の個人が特定できる情報を入れません。AIに読ませたいのは園の事実であり、子どもの情報ではありません。写真を使う場合も、園舎や園庭など個人が写らないものにします。",
          ],
        },
        {
          heading: "公開しておきたい事実の一覧",
          list: [
            "園の種類（認可保育所・認定こども園・幼稚園・小規模保育・認可外など）と、運営者の名称。",
            "受け入れ年齢と定員（クラスごと）。受け入れていない年齢も書く。",
            "開園時間、保育標準時間・短時間の時間帯、延長保育の時間と申込方法、土曜保育の有無。",
            "休園日（日曜・祝日・年末年始など）。",
            "申込先と受付時期（園の種類ごと）、見学の予約方法。",
            "給食（自園調理か）とアレルギー対応の範囲、相談の流れ。",
            "一時保育・預かり保育の有無と対象年齢、予約方法。",
            "持ち物や送迎の方法（駐車場・自転車置き場の有無）。",
            "住所・最寄り駅からの道順・電話番号。サイト・Googleビジネスプロフィール・自治体の一覧で同じ表記に。",
          ],
        },
        {
          heading: "WordPressの園のサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitはそのまま使えます。`,
            "初回の設定ウィザードで「その他」を選びます。そのあと設定画面の「業種（schema.org型）」に、保育所ならChildCare、幼稚園ならPreschoolと入力します。どのカードにも属さない型なので、あとでウィザードを開き直しても入力した型は保たれます。",
            "園名・住所・電話番号・開園時間・説明を確認します。開園時間は「月〜金 7:00-19:00、土 7:30-18:00、日曜定休」のような書き方なら、構造化データの営業時間（曜日ごとの開閉時刻）として出力されます。祝日や「第2土曜」のように曜日だけで表せない書き方は、読み間違いを避けるため推測せず、入力したまま出力されます。祝日・年末年始の休園と延長保育の時間は、説明と本文に書きます。",
            "説明（description）には、園の種類・受け入れ年齢・特徴・申込先を1〜2文で書きます。例：「◯◯駅徒歩5分の認可保育所。生後57日から5歳児まで、定員60名。延長保育は19時まで。入園のお申し込みは◯◯市で受け付けており、当園では見学のご予約を受け付けています。」",
            "設定画面で、通常保育・延長保育・一時保育・見学などをサービスとして1つずつ登録します。サービス名・説明・ページのURLを入れ、見学の予約ページがあれば予約URLに入れます。料金は決まった金額を公開しているものだけ入れます（空欄なら料金は出力されません）。サービスは園に紐づいたServiceとして出力され、llms.txtにも1行ずつ載ります。",
            "よくある質問（受け入れ年齢、申込先、延長保育、見学、給食とアレルギー、一時保育、駐車場）を入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールや自治体の一覧の開園時間・休園日と一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の園情報の構造化データを出さず、足りない住所・電話番号・開園時間・業種の型・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins)を参照してください。",
            `OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（2026年10月31日確認）。[OpenAI：クローラの概要](${SRC.openaiBots})。GoogleのAIによる概要やAIモードに出るための特別な設定はなく、通常の検索に表示できる状態であることが条件だとしています（2026年11月12日確認、[Google：AI機能とウェブサイト](${SRC.googleAi})）。robots.txtやセキュリティ系のプラグインで、気づかずにクローラを止めていないかを確認します。`,
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "園の種類と申込先が、本文に文字で書かれている（認可の場合は自治体の案内へのリンクがある）。",
            "受け入れ年齢と、受け入れていない年齢が書かれている。",
            "開園時間・延長保育・土曜保育・休園日が、画像ではなく文字で書かれている。",
            "空き状況を書く場合は日付が添えられている（または自治体のページへのリンクだけにしている）。",
            "園名・住所・電話番号・開園時間が、サイト・Googleビジネスプロフィール・自治体の一覧・公的な検索サイトで一致している。",
            "構造化データの業種が、LocalBusinessのままではなくChildCareまたはPreschoolになっている。",
            "構造化データや画像の説明に、園児の個人情報が入っていない。",
            "無償化や助成の扱いを書く場合は、自治体に確認した内容だけを書いている。",
            "llms.txtに、園の概要・入園案内・1日の流れ・見学・アクセス・よくある質問のページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、保護者が聞きそうな質問（地域＋年齢＋時間の条件。例：「◯◯駅の近くで0歳から預けられて、19時まで延長保育がある保育園は？」）を、園名を入れずにAIに投げて、自分の園が名前やURLで出てくるかを見ます。あわせて「◯◯保育園にはどこで申し込みますか？延長保育は何時までですか？」と園名で聞き、答えが今の事実と合っているかを確かめます。間違っていたら、AIが出典にしたページを見て、そのページや外部の掲載情報を直します。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて記録します。手順と記録表は[AIでの登場率の測り方](/guide/measure-ai-visibility)に、GoogleのAI機能での表示回数は[Search Consoleの見方](/guide/search-console-ai-features)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（園名は含めません）をPerplexityに投げ、回答に園の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に園が出る割合を周りの園と比べて推移で見られます（現在の計測先はPerplexity、ChatGPTは設定され次第）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "保育園のAI検索対策は、何から始めればいいですか？", a: "園の種類と申込先、受け入れ年齢、開園時間と延長保育、休園日、見学の方法を、ページ本文に文字で正しく書くことからです。そのうえで同じ事実を構造化データとllms.txtで公開し、Googleビジネスプロフィールや自治体の一覧と値をそろえます。" },
        { q: "保育園と幼稚園で、構造化データの型は変えたほうがいいですか？", a: "はい。保育所や認可外保育施設はChildCare（LocalBusinessの下位の型）、幼稚園はPreschool（教育機関の下位の型）が合います。保育と教育の両方を受け入れる認定こども園は、主にどちらとして紹介されたいかで選ぶか、型を複数書ける場合は両方を書きます。" },
        { q: "認可保育所のサイトに、空き状況を載せたほうがいいですか？", a: "載せるなら必ず日付を添えて、更新を続けられる場合だけにします。更新できないなら、自治体の空き状況のページへのリンクと「入園の申し込みは◯◯市で受け付けています」の1文にとどめるほうが、AIに古い情報を読まれる心配がありません。" },
        { q: "認可外保育施設は、無償化の対象かどうかを書くべきですか？", a: "保護者がよく聞くことなので、自治体に確認したうえで書くことをおすすめします。熊本県は、令和6年10月から国の指導監督基準を満たさない認可外保育施設は無償化の対象外になったと案内しています。確認できていないことは書かないでください。" },
        { q: "園児の写真を構造化データに使ってもいいですか？", a: "避けてください。AIに読ませたいのは園の事実です。園舎・園庭・給食など、子どもが特定されない写真を使い、園児の名前や顔が写った写真は構造化データにも画像の説明にも入れません。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（ChildCare・Preschool）・住所・開園時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）です。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "対策すればChatGPTに園が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが園の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが園のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Nurseries & Preschools: Ages, Hours, Enrolment | Nurevo",
      description: "AI search for nurseries and preschools: publish ages, hours, extended care, visits, where to apply in text and structured data. ChildCare vs Preschool, WordPress steps.",
      h1: "AI search for nurseries, daycares and preschools: getting AI to read your ages, hours, tours and enrolment route correctly",
      lead: "AI search optimization (AEO) for a nursery, daycare or preschool comes down to publishing the facts parents ask AI about — the ages you take, opening hours and extended care, occasional care, meals and allergy handling, how to book a visit, and where to apply — accurately, in the text of your pages and in structured data (schema.org's ChildCare or Preschool). The one fact that matters most for childcare is the enrolment route: where a place is allocated by the local authority rather than by you, say so plainly, so AI does not tell parents to \"just apply to the nursery\".",
      intro: [
        "Written November 13, 2026 (JST). Facts about schema.org, Google, OpenAI and the Japanese examples were checked on the dates given in the text. How places are allocated and funded differs by country and by local authority; check the current rules where your setting is.",
        "ChatGPT, Perplexity and Google's AI Overviews answer questions like \"a nursery near the station that takes babies under one\", \"daycare open until 7pm\" or \"a preschool I can visit this week\" by combining setting websites, local authority pages and map listings. AI answers change from one question to the next and no tool or tactic can guarantee you appear. But settings whose facts are written out in text, and match their other listings, are more likely to be described correctly.",
      ],
      sections: [
        {
          heading: "What parents ask AI, and what AI tends to get wrong",
          paragraphs: [
            "Parents' questions usually combine a place, a child's age and a time constraint, so the facts an answer needs are predictable. The table pairs common questions with what to write on your site and the mistake AI tends to make when it isn't there.",
          ],
          table: {
            head: ["Common question", "What to write on your site", "Typical mistake when it's missing"],
            rows: [
              ["Do you take babies?", "The age range you accept (e.g. from 8 weeks to age 5) and places per room", "Parents are sent to you for an age you don't take"],
              ["How late can I collect?", "Opening hours, core sessions, extended-care hours and how to book them", "Extended-care closing time is quoted as normal opening hours"],
              ["Saturdays and holidays?", "Whether you open on Saturdays and when; closures on Sundays, public holidays, year-end", "AI says you are open on a public holiday"],
              ["How do I apply?", "Your type of setting and where applications go (local authority or you), and when", "Parents are told to apply to you when places are allocated by the council"],
              ["Can I visit?", "Visit days and times, how to book, how long a visit takes", "\"Visit any time\" during a period when you don't take visits"],
              ["Meals and allergies?", "Whether meals are cooked on site, which allergies you can cater for, how to discuss them", "A diet you can't provide is described as available"],
              ["Occasional care?", "Whether you offer it, ages, booking, how fees are set", "Occasional care you don't offer is recommended"],
            ],
          },
          after: [
            "Write each of these in the text of the page, not only in an image or a PDF prospectus. If you publish a handbook as a PDF, copy these points into the page as well.",
          ],
        },
        {
          heading: "Spell out where to apply, by type of setting",
          paragraphs: [
            `In Japan, the route depends on the type of setting. Kumamoto City is a typical example: for licensed nurseries, the childcare part of certified centres and small-scale childcare, families apply through the ward office (the first-choice nursery also accepts forms) or online, and the city scores each application and the documents proving the need for childcare to allocate places. Kindergartens, the kindergarten part of certified centres and unlicensed childcare facilities take applications directly ([Kumamoto City: nursery admissions for FY2026](${SRC.kumamotoCity}), in Japanese, last updated October 1, 2026, read November 13, 2026). Many other countries have similar splits between council-allocated and directly-enrolled places, so check your own authority's rules.`,
            "Asked \"how do I get into X nursery?\", AI often goes by the only clue on the nursery's site — a contact form — and tells parents to apply to the nursery. One plain sentence on your site prevents most of that.",
          ],
          table: {
            head: ["Type of setting (Japanese example)", "How to say where to apply", "Also write"],
            rows: [
              ["Licensed nursery", "\"Applications are handled by X City (ward office, Y section). We take bookings for visits.\"", "A link to the city's admissions page and the application period"],
              ["Certified centre (kodomo-en)", "\"For childcare places (type 2 and 3), apply to X City; for education places (type 1), apply to us.\"", "Age range and hours for each"],
              ["Kindergarten", "\"Applications are made directly to us.\"", "When application forms are handed out and accepted, open-day dates"],
              ["Unlicensed facility", "\"Please apply to us directly.\"", "Notification status, monthly vs occasional care, fees"],
            ],
          },
          after: [
            "Vacancies change daily. If you publish them, date them (\"as of November 1, 2026\"); if you can't keep them current, link to the authority's vacancy page instead. Stale vacancy information that AI keeps repeating is the worst outcome.",
          ],
        },
        {
          heading: "What an unlicensed facility should state",
          paragraphs: [
            `In Japan, an unlicensed childcare facility (ninkagai hoiku shisetsu) is one without a licence from the prefectural governor or the municipality, and must notify the prefecture under Article 59-2 of the Child Welfare Act. Kumamoto Prefecture explains that from October 2024, unlicensed facilities that do not meet the national supervision standards are no longer covered by the free early-childhood education and care scheme ([Kumamoto Prefecture: unlicensed childcare facilities](${SRC.kumamotoPref}), in Japanese, updated July 8, 2026, read November 13, 2026).`,
            "When a parent asks AI \"is this nursery covered by free childcare?\" and your site doesn't say, AI can only give a general answer. Confirm your status with your local authority and state it in the text. Equally important: don't write \"covered\" if you haven't confirmed it.",
            `Kumamoto Prefecture points parents to the national search site \"Kokode Search\" ([childcare information disclosure system](${SRC.kokode}), in Japanese). Whatever your type, check that the name, address, phone number and hours listed on public search sites and your authority's list match your own site. Outside Japan, the equivalent is your regulator's or council's provider directory.`,
          ],
        },
        {
          heading: "Structured data types: ChildCare and Preschool",
          paragraphs: [
            `schema.org has [ChildCare](${SRC.childCare}) for childcare settings and [Preschool](${SRC.preschool}) for preschools and kindergartens. Checking the type definitions generated from the schema.org vocabulary (schema-dts 2.1.0) on November 13, 2026: ChildCare is a subtype of [LocalBusiness](${SRC.localBusiness}), while Preschool is a subtype of EducationalOrganization. EducationalOrganization is both an organization and a place (CivicStructure), so either type can carry an address, phone number and opening hours. Google recommends using the most specific LocalBusiness subtype you can ([Google: LocalBusiness](${SRC.googleLocal})).`,
          ],
          table: {
            head: ["Option", "Suits", "Caveat"],
            rows: [
              ["ChildCare", "Nurseries, daycares, unlicensed and small-scale childcare, centres that are mainly childcare", "A LocalBusiness subtype, so it is read as a local business listing"],
              ["Preschool", "Kindergartens and centres that are mainly education", "Not under LocalBusiness, so it may be read less readily as a map-style business listing"],
              ["Both ChildCare and Preschool", "Certified centres offering both childcare and education places", "Needs a setup that can output more than one type; either way the facts must be in the page text"],
            ],
          },
          after: [
            "Never put children's names, faces or anything that identifies a child into structured data. What you want AI to read are facts about the setting, not about the children. If you use images, choose the building, garden or meals, with no identifiable children.",
          ],
        },
        {
          heading: "Facts worth publishing",
          list: [
            "Your type of setting (licensed nursery, certified centre, kindergarten, small-scale, unlicensed, etc.) and the operator's name.",
            "The ages you accept and places per room — including ages you don't take.",
            "Opening hours, core and short sessions, extended-care hours and how to book, whether you open on Saturdays.",
            "Closures (Sundays, public holidays, year-end and so on).",
            "Where and when to apply, by type of place, and how to book a visit.",
            "Meals (cooked on site or not), which allergies you cater for, and how to discuss them.",
            "Occasional or extra care: whether you offer it, ages, booking.",
            "What to bring and drop-off arrangements (parking, bicycle space).",
            "Address, directions from the nearest station and phone number, written the same way on your site, your Google Business Profile and your authority's list.",
          ],
        },
        {
          heading: "Setting it up on a WordPress nursery or preschool site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working as they are.`,
            "In the setup wizard, choose \"Other\". Then, in Settings, enter ChildCare (for a nursery or daycare) or Preschool (for a kindergarten) in \"Business type (schema.org type)\". Because no wizard card claims these types, the type you entered is kept if you reopen the wizard later.",
            "Check the name, address, phone, hours and description. Hours written in a common form such as \"Mon-Fri 7:00-19:00 / Sat 7:30-18:00\" are published as structured opening hours (opening and closing times by weekday). Anything that can't be expressed by weekday — public holidays, \"the second Saturday\" — is not guessed at, to avoid publishing hours you don't keep, and is output as you typed it. Put holiday closures and extended-care hours in the description and page text.",
            "In the description, say in one or two sentences what type of setting you are, the ages you take, what's distinctive and where to apply. For example: \"Licensed nursery five minutes from X Station, taking children from 8 weeks to age 5, 60 places, extended care until 7pm. Applications are handled by X City; we take bookings for visits.\"",
            "In Settings, add core care, extended care, occasional care and visits as services, one at a time, with a name, description and page URL, plus a booking URL for visits if you have one. Only enter a price where you publish a fixed one (no price is output if it's blank). Services are published as Service linked to your setting and listed one per line in llms.txt.",
            "Enter FAQs (ages, where to apply, extended care, visits, meals and allergies, occasional care, parking) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on the page where you want them shown.",
            "Run the diagnosis on the AEO score screen and fix what the checklist flags with one-click fixes. Structured data, llms.txt and AI crawler rules are output on the free plan.",
            "Check how your site looks from outside with the [free AI readability check](/check), and confirm your hours and closures match your Google Business Profile and your authority's list.",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO doesn't output a second set of setting details; it only adds what's missing — address, phone, hours, the business type and services. See [adding local business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins).",
            `OpenAI says sites that block OAI-SearchBot won't be shown in ChatGPT search answers (checked October 31, 2026). [OpenAI: overview of crawlers](${SRC.openaiBots}). Google says there is no special setup for AI Overviews or AI Mode beyond being eligible to show in normal Search (checked November 12, 2026; [Google: AI features and your website](${SRC.googleAi})). Check that robots.txt or a security plugin isn't blocking crawlers without you knowing.`,
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Your type of setting and where to apply are written in the page text (with a link to the authority's admissions page if places are allocated there).",
            "The ages you take — and don't take — are stated.",
            "Opening hours, extended care, Saturday care and closures are in text, not only in images.",
            "Any vacancy information is dated (or replaced with a link to the authority's page).",
            "Name, address, phone and hours match across your site, Google Business Profile, your authority's list and public search sites.",
            "Your structured data type is ChildCare or Preschool, not plain LocalBusiness.",
            "No child's personal information is in structured data or image descriptions.",
            "Anything about free or subsidised places is limited to what your authority has confirmed.",
            "llms.txt lists your overview, admissions, daily routine, visits, access and FAQ pages. [What is llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you show up in AI answers",
          paragraphs: [
            "Once it's in place, ask AI the questions parents would ask (place + age + time constraint, e.g. \"a nursery near X Station that takes under-ones and has extended care until 7pm\") without your setting's name, and see whether you're named or linked. Then ask by name — \"Where do I apply for X Nursery? How late is extended care?\" — and check the answer matches today's facts. If it's wrong, look at the page AI cited and correct that page or the outside listing. AI answers change each time, so record the same questions several times, spread over time. The method and a log template are in [how to measure AI visibility](/guide/measure-ai-visibility); impressions in Google's AI features are covered in [the Search Console guide](/guide/search-console-ai-features).",
            "On the Free and Standard plans, Nurevo AEO asks Perplexity three questions built from your business type and area (without your name) once a month and records whether your setting or site appeared. The Pro plan (from $99/month) adds AI visibility measurement in beta, showing how often you appear in AI answers over time compared with nearby settings (currently measured on Perplexity; ChatGPT once configured). Both look at samples of answers; neither observes every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a nursery start with AI search optimization?", a: "Write your type of setting and where to apply, the ages you take, opening hours and extended care, closures and how to book a visit in the text of your pages. Then publish the same facts in structured data and llms.txt, and make them match your Google Business Profile and your local authority's list." },
        { q: "Should a nursery and a kindergarten use different structured data types?", a: "Yes. Nurseries, daycares and unlicensed childcare fit ChildCare (a LocalBusiness subtype); kindergartens fit Preschool (an EducationalOrganization subtype). A centre offering both can pick the one it mainly wants to be known as, or output both if its setup allows more than one type." },
        { q: "Should a licensed nursery publish vacancies on its site?", a: "Only with a date, and only if you'll keep them current. Otherwise, a link to your authority's vacancy page plus one sentence saying where applications go is safer — AI won't keep repeating out-of-date vacancies." },
        { q: "Should an unlicensed facility say whether it's covered by free childcare?", a: "Parents ask this often, so it's worth stating once you've confirmed it with your local authority. In Japan, Kumamoto Prefecture notes that since October 2024 unlicensed facilities that don't meet the national supervision standards are not covered. Don't state anything you haven't confirmed." },
        { q: "Can I use photos of the children in structured data?", a: "Avoid it. What AI should read are facts about the setting. Use photos of the building, garden or meals with no identifiable children, and keep children's names and faces out of structured data and image descriptions." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (ChildCare or Preschool), address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my nursery shows up in ChatGPT?", a: "No. AI answers vary, and no tool or tactic can guarantee placement or ranking. What you can do is make your setting's facts easy for AI to read correctly and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your setting's site",
        body: "The free check, no sign-up needed, shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
