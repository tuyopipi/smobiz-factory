// Content page: AI search (AEO) for community pharmacies and drugstores
// (調剤薬局・ドラッグストア). Industry page. Clinics have their own page
// (medical-clinic-ai-search); this one covers what pharmacies are asked:
// opening hours and when a pharmacist is on duty, out-of-hours consultation,
// prescriptions from which clinics, home visits, certified-pharmacy status.
//
// Written 2026-11-15 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.1), the setup wizard (includes/setup-wizard.php: the "Retail shop" card
// sets Store and its family includes Pharmacy; Pharmacy is in
// webmcp_canary_local_business_types() in nurevo-webmcp.php, so it can be
// chosen in the business type field) or the opening-hours reader tests
// (scripts/test-wordpress-aeo-admin.php: text with holidays or "最終受付" is
// left as written), as already cited by medical-clinic-ai-search.
//
// Outside facts, checked on the primary pages linked in the copy:
// - Tokyo Metropolitan Government, 薬局機能情報提供制度 page (updated
//   2026-03-09, read 2026-11-15): legal basis 医薬品医療機器等法 第8条の2;
//   reports through G-MIS from January 2024, published on 医療情報ネット
//   (ナビイ) from April 2024; annual report of the status on 31 December
//   (period usually early January to late February), even with no change;
//   prompt report on change of items incl. 営業日, 開店時間, 開店時間外で相談
//   できる時間, 健康サポート薬局の表示, 地域連携薬局 / 専門医療機関連携薬局の
//   認定, 薬剤師不在時間の有無.
// - Saitama Prefecture page (2026-09-07, read 2026-11-15): same items, plus
//   suspension / reopening / closure; detailed list in 施行規則 第11条の3.
// - schema.org Pharmacy (checked in schema-dts 2.1.0 on 2026-11-15; the
//   schema.org page itself could not be fetched from this run): "A pharmacy
//   or drugstore", a MedicalBusiness that extends LocalBusiness and
//   MedicalOrganization; NOT a subtype of Store. specialOpeningHoursSpecification
//   is on Place; knowsLanguage and hasOfferCatalog on Organization;
//   paymentAccepted on LocalBusiness.
// - MHLW pages on certified pharmacies, advertising standards, OTC sales and
//   online medication guidance could NOT be fetched from this run (permission
//   prompt unanswered). The copy therefore makes no claim about their dates,
//   requirements or the 2025 law changes; it only names the rules and says
//   to check them. The advertising standard is linked by name only.
// - Google "AI features and your website" and LocalBusiness docs: as checked
//   for dental-clinic-ai-search (2026-10-29); no new Google claim is made.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  pharmacy: "https://schema.org/Pharmacy",
  specialHours: "https://schema.org/specialOpeningHoursSpecification",
  tokyo: "https://www.hokeniryo.metro.tokyo.lg.jp/anzen/iyaku/yakkyokuinfo.html",
  saitama: "https://www.pref.saitama.lg.jp/a0707/y-kinou.html",
  navii: "https://www.iryou.teikyouseido.mhlw.go.jp/",
  mhlwAds: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/koukokukisei/index.html",
};

export default {
  slug: "pharmacy-ai-search",
  targetQueries: [
    "AI search optimization for pharmacies",
    "pharmacy ChatGPT visibility",
    "Pharmacy schema markup",
    "薬局 AI検索対策",
    "調剤薬局 ChatGPT 表示",
    "ドラッグストア 構造化データ Pharmacy",
  ],
  related: ["medical-clinic-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "online-shop-ai-search"],
  locales: {
    ja: {
      title: "薬局・ドラッグストアのAI検索対策：営業時間・薬剤師・在宅 | Nurevo",
      description: "薬局のAI検索対策は、開店時間と薬剤師がいる時間、時間外の相談、処方箋の受付、在宅訪問、認定の有無を、本文・構造化データ・医療情報ネットで同じ値にそろえること。手順を解説。",
      h1: "薬局・ドラッグストアのAI検索対策：営業時間・薬剤師のいる時間・在宅対応をAIに正しく読ませる手順",
      lead: "薬局・ドラッグストアのAI検索対策の中心は、AIに聞かれる「いま開いているか」「薬剤師はいるか（第1類の薬を買えるか）」「この病院の処方箋を受け付けてくれるか」「時間外に相談できるか」「家まで来てくれるか」に、ページ本文で曜日・時刻・条件まで書いて答えることです。そのうえで同じ事実を、構造化データ・llms.txt・Googleビジネスプロフィール、そして薬局が都道府県に報告している薬局機能情報（医療情報ネット〔ナビイ〕で公開）と矛盾なくそろえます。",
      intro: [
        "作成日：2026年11月15日（JST）。東京都・埼玉県の薬局機能情報提供制度のページ、schema.orgの型（schema-dts 2.1.0の型定義）は同日に確認しました。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが薬局の事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "薬局について、AIはどんな質問を受けるか",
          paragraphs: [
            "薬局は、病院の帰りや夜・休日の急な不調のときに探されます。そのためAIへの質問は、「◯◯クリニックの近くで、19時以降も開いている薬局」「日曜に処方箋を出せる薬局」「いま薬剤師がいて、第1類の薬を買えるドラッグストア」「家族の薬を家まで届けてくれる薬局」「英語で相談できる薬局」のように、時間と条件が入ったものになりがちです。",
            "AIがこうした質問に薬局の名前を挙げるには、その条件を満たすことが文字で読み取れる必要があります。営業時間が画像だけ、調剤の受付時間と店の営業時間の違いが書かれていない、在宅訪問は「ご相談ください」だけ、というページは、条件つきの質問の答えに使いにくくなります。",
            "上位に出てくる記事を日本語・英語で読み比べると、「Googleビジネスプロフィールを整える」「口コミを増やす」「構造化データを入れる」といった一般論が中心で、薬局ならではの公的な報告（薬局機能情報）との整合、薬剤師がいない時間の書き方、WordPressでの具体的な設定、出ているかの確かめ方まで書いたものはほとんどありませんでした。この記事はそこを埋めます。",
          ],
        },
        {
          heading: "薬局で特に書いておきたい事実と、書き方",
          paragraphs: [
            "目安は次のとおりです。調剤を中心とする薬局と、一般用医薬品や日用品を広く扱うドラッグストアでは重みが違いますが、どちらも「時間」と「誰が対応するか」の書き方でAIが答えに使えるかが変わります。",
          ],
          table: {
            head: ["事実", "ページ本文での書き方", "注意点"],
            rows: [
              ["営業日・開店時間", "曜日ごとの開店時間、休業日、祝日の扱い", "店舗と調剤の受付時間が違う場合は分けて書く"],
              ["調剤の受付時間", "処方箋を受け付ける時間と、受付終了の時刻", "「閉店30分前まで」のような条件は、時刻に直して書く"],
              ["薬剤師がいる時間・いない時間", "薬剤師が不在になる曜日・時間帯と、その間にできないこと", "第1類の医薬品の販売や調剤ができない時間をはっきりさせる"],
              ["開店時間外の相談", "時間外に相談できるか、連絡先、受けられる時間帯", "「24時間」と書くなら、電話相談だけか調剤もできるかを分ける"],
              ["処方箋の受付", "どこの医療機関の処方箋でも受け付けるか、近くのどの医療機関からの処方が多いか、事前送信（FAX・アプリ）の方法", "特定の医療機関とだけ取引しているように読める書き方は避ける"],
              ["在宅訪問", "訪問する地域、対象（個人宅・施設）、頼み方、費用の目安の案内先", "「ご相談ください」だけにせず、範囲と条件を書く"],
              ["認定・表示", "地域連携薬局・専門医療機関連携薬局の認定、健康サポート薬局の表示の有無", "認定や届出がないものは書かない。制度名と自局の状態をセットで"],
              ["取り扱い", "扱っている薬の区分、介護用品・医療材料・ベビー用品など、取り寄せの可否と日数", "在庫の有無は変わるので、「在庫は電話で確認」のように書く"],
              ["支払い・設備・言語", "マイナ保険証・キャッシュレス、駐車場、車いす、相談できる言語", "変わったら、サイトとGoogleビジネスプロフィールを同時に直す"],
              ["臨時休業・年末年始", "日付と、その間の近くの薬局や当番の案内", "お知らせ欄だけでなく、営業時間の近くにも書く"],
            ],
            caption: "表は、薬局でAIに聞かれやすい条件と、上位の記事で抜けていた項目をもとにしています。",
          },
          after: [
            "どの値も、ページ本文・構造化データ・Googleビジネスプロフィール・医療情報ネット・店頭の掲示で同じにします。Googleは、AIによる概要などの機能のためにも、ビジネスプロフィールを最新に保つことを勧めています。[Google：AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "薬局機能情報（医療情報ネット）と値をそろえる",
          paragraphs: [
            `薬局には、医薬品医療機器等法 第8条の2にもとづき、薬局の機能を都道府県に報告する仕組みがあります（薬局機能情報提供制度）。東京都のページによると、報告は2024年1月からG-MIS（オンラインの報告システム）で行い、2024年4月から医療情報ネット（ナビイ）で公開されています。[東京都：薬局機能情報提供制度](${SRC.tokyo})／[医療情報ネット](${SRC.navii})`,
            "報告は年に1回の定期報告（12月31日時点の内容。東京都では例年1月初旬から2月下旬）に加えて、決められた項目に変更があったときは速やかに報告することになっています。変更時に報告する項目には、営業日、開店時間、開店時間外で相談できる時間、健康サポート薬局の表示の有無、地域連携薬局・専門医療機関連携薬局の認定の有無、薬剤師不在時間の有無などが含まれます。埼玉県のページでは、休止・再開・廃止もこの項目に入っています。[埼玉県：薬局機能情報提供制度について](" + SRC.saitama + ")",
            "これはAI検索対策の点でも役に立ちます。AIに聞かれやすい「何時まで開いているか」「時間外に相談できるか」「薬剤師がいない時間はあるか」「認定薬局か」は、ちょうど薬局が公的に報告している項目と重なります。報告した値と自局のサイトの値が食い違っていると、AIも利用者もどちらが正しいか判断できません。営業時間を変えたときは、報告・サイト・Googleビジネスプロフィール・店頭掲示を同じ日に直す、と決めておくのが確実です。",
          ],
        },
        {
          heading: "「薬剤師がいない時間」と「時間外の相談」の書き方",
          paragraphs: [
            "ドラッグストアでは、店は開いていても薬剤師がいない時間帯があります。AIに「今から第1類の薬を買える店」と聞かれたとき、店の営業時間しか書かれていないと、買えない時間に「買える」と答えられるおそれがあります。",
            "書き方の例：「営業時間 9:00〜22:00（年中無休）。調剤の受付 月〜金 9:00〜19:00（受付18:45まで）、土 9:00〜13:00。薬剤師の不在時間：火曜 19:00〜22:00。この時間は第1類医薬品の販売と調剤ができません。開店時間外の相談：かかりつけの方は 0X-XXXX-XXXX で 22:00〜翌9:00 も電話で受け付けます。」のように、店・調剤・薬剤師・時間外を1か所にまとめます（番号は例です）。",
            "要指導医薬品や第1類医薬品の扱い、ネットでの販売（特定販売）の表示には別のルールがあり、改正も続いています。具体的な表示項目は、最新の法令と都道府県の薬務担当の案内で確認してください。",
          ],
        },
        {
          heading: "広告のルール：AI向けの文章でも書かないこと",
          paragraphs: [
            `医薬品の広告は、医薬品医療機器等法の広告の規定と、厚生労働省の「医薬品等適正広告基準」の対象です。[厚生労働省：医薬品等の広告規制について](${SRC.mhlwAds})。AIに選ばれるためのFAQや構造化データ、ブログ記事でも同じ扱いになります。`,
          ],
          list: [
            "「必ず効く」「副作用がない」のように効き目や安全を約束する言葉、「地域で一番」のような最上級・比較の言葉は使わない。",
            "症状の記事は、「この症状にはこの薬」と決めつけず、受診をすすめる目安と、薬局で相談できることを書く。",
            "処方箋が必要な薬を、商品のように価格つきで並べない。",
            "利用者の感想を、効果の裏づけとしてFAQや構造化データのレビューに載せない。",
          ],
          after: [
            "細かな判断に迷う場合は、都道府県の薬務担当や業界団体のガイドで確認してください。医療機関側の例は[内科・小児科クリニックのAI検索対策](/ja/guide/medical-clinic-ai-search/)で解説しています。",
          ],
        },
        {
          heading: "構造化データ：Pharmacyの型と、使えるプロパティ",
          paragraphs: [
            "schema.orgには、薬局を表すPharmacyという型があります（説明は「A pharmacy or drugstore」。2026年11月15日にschema-dts 2.1.0の型定義で確認）。PharmacyはMedicalBusinessの一種で、LocalBusinessとMedicalOrganizationの両方の性質を持ちます。ドラッグストアでもStore（小売店）ではなくPharmacyを使えます。",
          ],
          table: {
            head: ["型・プロパティ", "意味", "薬局での使い方"],
            rows: [
              [`[Pharmacy](${SRC.pharmacy})`, "薬局・ドラッグストア", "調剤薬局にもドラッグストアにも。住所・電話・営業時間をそのまま持てる"],
              ["openingHoursSpecification", "曜日ごとの営業時間", "店の営業時間を入れる。調剤の受付時間や薬剤師の不在時間は本文に書く"],
              [`[specialOpeningHoursSpecification](${SRC.specialHours})`, "通常と違う営業時間", "年末年始・臨時休業の日付に"],
              ["knowsLanguage", "対応できる言語", "英語・中国語などで相談できる場合に"],
              ["paymentAccepted", "使える支払い方法", "キャッシュレス対応を書く場合に"],
              ["hasOfferCatalog", "提供しているサービスの一覧", "調剤・在宅訪問・健康相談などのサービスを並べる"],
            ],
          },
          after: [
            `Googleのローカルビジネスの構造化データでは、nameとaddressが必須で、できるだけ具体的な型を使うよう案内されています。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})。薬剤師の不在時間や時間外の相談のように、決まった入れ場所がない事実は、本文に書くのがいちばん確実です。`,
          ],
        },
        {
          heading: "WordPressの薬局サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「小売店」を選びます（型はStoreになります）。続けて設定画面の「業種（schema.org型）」欄をPharmacyに変えます。Pharmacyは業種の候補に入っており、ウィザードでも「小売店」の仲間として扱われます。",
            "薬局名・住所・電話番号・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "営業時間の欄には、店の営業時間を曜日と時刻だけで「月〜土 9:00-22:00 / 日 10:00-20:00」のように書きます。祝日・「最終受付」などを入れると、誤った時間を出さないよう変換せず書いたままの文字で出すため、調剤の受付時間・薬剤師の不在時間・祝日の扱いは本文に書きます。",
            "設定画面で、調剤・在宅訪問・健康相談・一般用医薬品の販売など、行っていることをサービスとして登録し、よく聞かれる質問（処方箋の事前送信、時間外の相談、在宅訪問の頼み方）をFAQに入れます。FAQは、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置いたページのFAQPageに追加されます。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・営業時間と、より具体的な型だけを足します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/ja/guide/local-business-schema-seo-plugins/)をご覧ください。複数の店舗がある場合は、店舗ごとのページに、その店の営業時間・薬剤師の時間・在宅の範囲を書きます。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "営業時間が画像だけでなく文字で書かれ、休業日・祝日の扱いがある。",
            "調剤の受付時間と受付終了の時刻が、店の営業時間と分けて書かれている。",
            "薬剤師の不在時間がある場合、その曜日・時間と、その間にできないことが書かれている。",
            "開店時間外の相談の可否・連絡先・時間帯が書かれている。",
            "処方箋の受付と事前送信の方法、在宅訪問の範囲・対象・頼み方が書かれている。",
            "地域連携薬局などの認定・健康サポート薬局の表示は、実際の状態だけが書かれている。",
            "サイト・構造化データ・Googleビジネスプロフィール・薬局機能情報（医療情報ネット）の名前・住所・電話・営業時間が一致している。",
            "効き目を約束する言葉、最上級・比較の言葉、効果の裏づけとしての感想が、FAQや構造化データに入っていない。",
            "llms.txtに、営業時間・アクセス・処方箋・在宅訪問のページが載っている。[llms.txtとは](/ja/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、利用者が聞きそうな質問を、地域・時間帯・条件（処方箋、薬剤師、在宅、言語）の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げます。例：「◯◯駅の近くで、平日20時に処方箋を出せる薬局は？」「◯◯市で在宅訪問をしている薬局は？」。薬局が名前やURLで出るか、営業時間や条件が正しく書かれているかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。測り方の詳細は[AIでの登場率の測り方](/ja/guide/measure-ai-visibility/)にまとめています。",
            "間違った営業時間が出ていた場合は、どこから来た値かを見ます。出典のリンクが付いていれば、そのページ（自局のサイト、Googleビジネスプロフィール、医療情報ネット、地図や口コミのサイト）の値を確かめ、食い違っているところを直します。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（薬局名は含めません）をPerplexityに投げ、回答に薬局の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に薬局が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "薬局のAI検索対策は、何から始めればいいですか？", a: "店の営業時間と調剤の受付時間を分けて文字で書き、薬剤師の不在時間と開店時間外の相談の可否を添えることからです。次に、その値を構造化データ・Googleビジネスプロフィール・薬局機能情報（医療情報ネット）とそろえます。" },
        { q: "ドラッグストアの構造化データは、StoreとPharmacyのどちらがいいですか？", a: "医薬品を扱い薬剤師がいる店なら、Pharmacyが目安です。schema.orgではPharmacyは「薬局・ドラッグストア」を表す型で、LocalBusinessの一種なので住所や営業時間をそのまま持てます。型より大切なのは、値が本文と一致していることです。" },
        { q: "医療情報ネットに載っている情報と、サイトの情報が違うとどうなりますか？", a: "AIや利用者がどちらを信じればいいかわからなくなります。営業日・開店時間・時間外の相談・薬剤師の不在時間などは、変更があったら速やかに都道府県へ報告する項目です。報告とサイトとGoogleビジネスプロフィールを同じ日に直すと、食い違いを防げます。" },
        { q: "薬剤師がいない時間は、書かないほうが印象がよいのでは？", a: "書いたほうが安全です。書かないと、AIが第1類医薬品を買えない時間に「買える」と答えるおそれがあり、来店した人の不満につながります。薬剤師不在時間の有無は、薬局機能情報で報告する項目でもあります。" },
        { q: "AIに選ばれるために、症状と効く薬の記事を書いてもいいですか？", a: "医薬品の広告は医薬品医療機器等法と医薬品等適正広告基準の対象です。効き目を約束する書き方や最上級の表現は避け、受診の目安と、薬局で相談できることを中心に書いてください。判断に迷う場合は都道府県の薬務担当に確認してください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに薬局が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが薬局の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが薬局のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Pharmacies: Hours, Pharmacist on Duty | Nurevo",
      description: "AEO for community pharmacies and drugstores: publish store and dispensing hours, pharmacist absences, out-of-hours help and home visits as text and matching schema.",
      h1: "AI search for pharmacies and drugstores: how to get AI to read your hours, pharmacist availability and home visits correctly",
      lead: "AI search optimization for a pharmacy comes down to answering, on the page and down to the day and the minute, the questions people now ask AI: are you open now, is a pharmacist on duty (can I buy pharmacist-only medicines), will you fill a prescription from this clinic, can I get advice out of hours, and will you deliver or visit at home. Then you publish the same facts consistently in structured data, llms.txt, your Google Business Profile and any official pharmacy directory you report to. In Japan that directory is the national medical information site (Navii), fed by the pharmacy function reports every pharmacy files with its prefecture.",
      intro: [
        "Written November 15, 2026 (JST). The Tokyo and Saitama pages on Japan's pharmacy function reporting system and schema.org's types (as defined in schema-dts 2.1.0) were checked that day. Examples of rules come from Japan; check the rules where you practise.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your pharmacy's facts readable to AI. They do not guarantee that an AI will mention your pharmacy or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What people ask AI about pharmacies",
          paragraphs: [
            "People look for a pharmacy on the way back from a doctor, or when someone falls ill in the evening or at the weekend. So the questions carry times and conditions: \"a pharmacy near [clinic] open after 7pm\", \"where can I fill a prescription on Sunday\", \"a drugstore with a pharmacist on duty right now\", \"a pharmacy that delivers medicine to my parent's home\", \"a pharmacy where I can ask in English\".",
            "For an AI to name your pharmacy in answer to one of these, it has to be able to read, as text, that you meet the condition. A page with opening hours only in an image, no difference between store hours and dispensing hours, or home visits described only as \"please ask us\" is hard to use for a conditional question.",
            "We read the top-ranking pages on this topic in Japanese and English. Most stop at general advice: update your Google Business Profile, collect reviews, add structured data. Almost none cover matching your site to the official reports a pharmacy already files, how to write the hours when no pharmacist is present, a concrete WordPress setup, or how to check whether you appear. This guide fills those gaps.",
          ],
        },
        {
          heading: "The facts worth publishing, and how to write them",
          paragraphs: [
            "Use the table as a guide. A dispensing pharmacy and a drugstore with a wide range of over-the-counter products weigh these differently, but for both, how you write the hours and who is available decides whether an AI can use your page.",
          ],
          table: {
            head: ["Fact", "How to write it on the page", "Watch out for"],
            rows: [
              ["Opening days and hours", "Hours for each day, closed days, how public holidays are handled", "If dispensing hours differ from store hours, list them separately"],
              ["Dispensing hours", "When you accept prescriptions, and the last time to hand one in", "Turn \"until 30 minutes before closing\" into a clock time"],
              ["When a pharmacist is present or absent", "The days and times with no pharmacist, and what cannot be done then", "Make clear when pharmacist-only medicines and dispensing are unavailable"],
              ["Out-of-hours advice", "Whether people can get advice after closing, the number and the hours", "If you say \"24 hours\", say whether that is phone advice only or dispensing too"],
              ["Prescriptions", "Whether you accept prescriptions from any clinic, which nearby clinics you often fill for, how to send one ahead (fax or app)", "Avoid wording that suggests you only serve one clinic"],
              ["Home visits", "The area covered, who you visit (homes, care facilities), how to request, where to find costs", "Do not stop at \"please ask\"; give the area and conditions"],
              ["Certifications and designations", "Official certifications or designations you hold (in Japan: community-cooperation or specialist-cooperation pharmacy, health support pharmacy)", "Never claim one you do not hold. State the scheme name and your status together"],
              ["Range", "Medicine categories, care supplies, medical materials, baby products, whether you can order in and how long it takes", "Stock changes, so write \"call to check stock\""],
              ["Payment, access and languages", "Accepted payments, parking, wheelchair access, languages you can advise in", "When one changes, update the site and your Google Business Profile together"],
              ["Temporary closures and holidays", "The dates, and nearby or on-duty pharmacies to use instead", "Put them next to the opening hours, not only in a news post"],
            ],
            caption: "Built from the conditions people attach to pharmacy questions, and the items the top-ranking pages left out.",
          },
          after: [
            "Keep every value identical on the page, in structured data, on your Google Business Profile, in the official directory and on the sign at the door. Google recommends keeping your Business Profile up to date for its AI features too. [Google: AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "Match the official pharmacy reports (Japan: Navii)",
          paragraphs: [
            `In Japan, Article 8-2 of the Pharmaceuticals and Medical Devices Act requires each pharmacy to report its functions to its prefecture (the pharmacy function information system). According to the Tokyo Metropolitan Government, reports have been filed online through G-MIS since January 2024 and published on the national medical information site, Navii, since April 2024. [Tokyo Metropolitan Government (Japanese)](${SRC.tokyo}) / [Navii (Japanese)](${SRC.navii})`,
            "There is an annual report of the situation as of 31 December (in Tokyo, usually filed between early January and late February), and some items must be reported promptly whenever they change. Those items include opening days, opening hours, hours when advice is available outside opening hours, whether the pharmacy displays health support pharmacy status, whether it holds community-cooperation or specialist-cooperation certification, and whether there are hours with no pharmacist present. Saitama Prefecture's page adds suspension, reopening and closure to that list. [Saitama Prefecture (Japanese)](" + SRC.saitama + ")",
            "This is useful for AI search. The things AI is asked about a pharmacy (how late it is open, whether advice is available after hours, whether a pharmacist is there, whether it is certified) are almost exactly the items a pharmacy already reports. If the reported values and your website disagree, neither AI nor the patient can tell which is right. Make it a rule to change the report, the website, your Google Business Profile and the sign on the same day. Outside Japan, apply the same idea to whichever official register or health-service directory lists your pharmacy.",
          ],
        },
        {
          heading: "How to write \"no pharmacist on duty\" and out-of-hours advice",
          paragraphs: [
            "A drugstore can be open while no pharmacist is on duty. If an AI is asked for \"a shop where I can buy a pharmacist-only medicine now\" and your page only lists store hours, it may say yes at a time when you cannot sell it.",
            "An example: \"Store open 9:00-22:00, every day. Prescriptions Mon-Fri 9:00-19:00 (last prescription 18:45), Sat 9:00-13:00. No pharmacist on Tuesdays 19:00-22:00: we cannot dispense or sell pharmacist-only medicines then. Out-of-hours advice: registered patients can call 0X-XXXX-XXXX from 22:00 to 9:00.\" Put store, dispensing, pharmacist and out-of-hours information in one place (the number is a placeholder).",
            "Separate rules govern pharmacist-only medicines and what an online pharmacy shop must display, and they keep changing. Check the current law and your regulator's guidance for the exact items.",
          ],
        },
        {
          heading: "Advertising rules apply to text written for AI",
          paragraphs: [
            `In Japan, medicine advertising falls under the advertising provisions of the Pharmaceuticals and Medical Devices Act and the Ministry of Health's standards for appropriate advertising of medicines. [Ministry of Health, Labour and Welfare (Japanese)](${SRC.mhlwAds}). FAQ, structured data and blog posts written to be picked by AI are covered the same way. Most countries have comparable rules.`,
          ],
          list: [
            "Do not promise results or safety (\"always works\", \"no side effects\"), and do not use superlatives or comparisons (\"the best in town\").",
            "In symptom articles, do not say \"for this symptom, take this medicine\". Say when to see a doctor, and what you can help with at the pharmacy.",
            "Do not list prescription-only medicines like products with prices.",
            "Do not put customer comments in FAQ or review markup as evidence that something works.",
          ],
          after: [
            "If you are unsure, ask your regulator or check your professional body's guidance. For the clinic side, see [AI search for primary care and paediatric clinics](/guide/medical-clinic-ai-search/).",
          ],
        },
        {
          heading: "Structured data: the Pharmacy type and useful properties",
          paragraphs: [
            "schema.org has a Pharmacy type, described as \"A pharmacy or drugstore\" (checked in the schema-dts 2.1.0 type definitions on November 15, 2026). Pharmacy is a kind of MedicalBusiness and carries the properties of both LocalBusiness and MedicalOrganization. A drugstore can use Pharmacy rather than Store.",
          ],
          table: {
            head: ["Type or property", "Meaning", "Use at a pharmacy"],
            rows: [
              [`[Pharmacy](${SRC.pharmacy})`, "A pharmacy or drugstore", "Both dispensing pharmacies and drugstores. Holds address, phone and hours directly"],
              ["openingHoursSpecification", "Opening hours by day", "Store hours. Write dispensing hours and pharmacist absences in the page text"],
              [`[specialOpeningHoursSpecification](${SRC.specialHours})`, "Hours that differ from normal", "Holiday and temporary closure dates"],
              ["knowsLanguage", "Languages the business can use", "If you can advise in English, Chinese or other languages"],
              ["paymentAccepted", "Payment methods", "If you list card or mobile payments"],
              ["hasOfferCatalog", "A list of services offered", "Dispensing, home visits, health advice and similar services"],
            ],
          },
          after: [
            `Google's local business structured data requires name and address and recommends the most specific type you can use. [Google: Local business structured data](${SRC.googleLocal}). Facts with no obvious property, such as pharmacist absences or out-of-hours advice, are safest in the page text.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress pharmacy site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO and Slim SEO keep working as they are. From 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.`,
            "In the setup wizard, choose \"Retail shop\" (this sets the type to Store). Then change the \"Business type (schema.org type)\" field in Settings to Pharmacy. Pharmacy is one of the listed business types, and the wizard treats it as part of the retail family.",
            "Check the pharmacy name, address, phone and description. Only empty fields are filled from your existing settings; values you have entered are never overwritten.",
            "In the opening hours field, write only days and times for the store, such as \"Mon-Sat 9:00-22:00 / Sun 10:00-20:00\". If you add holidays or a \"last prescription\" note, the plugin publishes your text as written rather than risk wrong hours, so put dispensing hours, pharmacist absences and holiday rules in the page text.",
            "In Settings, add what you offer as services (dispensing, home visits, health advice, over-the-counter medicines), and add common questions (sending a prescription ahead, out-of-hours advice, how to request a home visit) as FAQ. FAQ entries are added to the FAQPage of the page where you place the Nurevo FAQ block (or the [nurevo_faq] shortcode).",
            "Run a check on the AEO score screen and apply the one-click fixes. To see how your site looks from outside, use the [free AI readability check](/check).",
          ],
          after: [
            "With an SEO plugin, Nurevo AEO does not print a second set of structured data. It adds only the missing address, phone, opening hours and the more specific type to the graph your SEO plugin already publishes. See [How to add local business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/). If you have several branches, give each branch its own page with its own hours, pharmacist times and home-visit area.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Opening hours are written as text, not only in an image, with closed days and holiday handling.",
            "Dispensing hours and the last time to hand in a prescription are listed separately from store hours.",
            "If there are hours with no pharmacist, the days, times and what cannot be done then are stated.",
            "Whether out-of-hours advice is available, the number and the hours are stated.",
            "How to hand in or send a prescription ahead, and the area, recipients and request method for home visits, are stated.",
            "Certifications and designations are stated only as they actually are.",
            "Name, address, phone and hours match across the site, structured data, Google Business Profile and the official pharmacy directory.",
            "No promises of results, no superlatives or comparisons, and no customer comments used as evidence in FAQ or structured data.",
            "llms.txt lists your hours, access, prescription and home-visit pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI mentions you",
          paragraphs: [
            "Once the facts are in place, write 5 to 10 questions people might ask, combining area, time of day and a condition (prescription, pharmacist, home visit, language), and put them to ChatGPT and Perplexity. For example: \"Which pharmacy near [station] can fill a prescription at 8pm on a weekday?\" or \"Which pharmacies in [city] do home visits?\" Record whether your pharmacy is named or linked, and whether the hours and conditions are right. AI answers change from run to run, so repeat the same questions over time. See [How to measure AI visibility](/guide/measure-ai-visibility/) for the method.",
            "If an AI shows the wrong hours, find where the value came from. If the answer cites a source, check that page (your site, Google Business Profile, the official directory, a map or review site) and fix whichever one disagrees.",
            "With Nurevo AEO, even the Free and Standard plans put three questions built from your business type and area (never your pharmacy's name) to Perplexity once a month and record whether the answers named your pharmacy or cited your site. On the Pro plan (from $99/month), AI visibility measurement in beta shows how often your pharmacy appears in AI answers, with competitor comparison and trends (currently measured on Perplexity). Both look at a sample of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a pharmacy start with AI search?", a: "Write store hours and dispensing hours separately as text, and add when no pharmacist is present and whether advice is available out of hours. Then make those values match your structured data, Google Business Profile and the official pharmacy directory." },
        { q: "Should a drugstore use Store or Pharmacy in structured data?", a: "If you sell medicines and have a pharmacist, Pharmacy is the better fit. schema.org describes Pharmacy as \"A pharmacy or drugstore\", and as a kind of LocalBusiness it holds address and hours directly. That the values match your page matters more than the type." },
        { q: "What happens if the official directory and our website disagree?", a: "AI and patients cannot tell which to trust. In Japan, opening days and hours, out-of-hours advice and pharmacist absences are items a pharmacy must report promptly when they change. Updating the report, the site and your Google Business Profile on the same day prevents the mismatch." },
        { q: "Isn't it better not to mention hours with no pharmacist?", a: "It is safer to mention them. Otherwise an AI may say people can buy pharmacist-only medicines at a time when they cannot, and they arrive disappointed. In Japan, whether there are hours without a pharmacist is also a reported item." },
        { q: "Can we write articles on symptoms and the medicines that treat them, to get picked by AI?", a: "Medicine advertising is regulated (in Japan, by the Pharmaceuticals and Medical Devices Act and the Ministry of Health's advertising standards). Avoid promising results or using superlatives; focus on when to see a doctor and what the pharmacy can help with. Ask your regulator if unsure." },
        { q: "Is Nurevo AEO free?", a: `Yes. Structured data for your business type, address, hours, services and FAQ, plus llms.txt, AI crawler rules and the AEO score, are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee our pharmacy appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your pharmacy's website",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
