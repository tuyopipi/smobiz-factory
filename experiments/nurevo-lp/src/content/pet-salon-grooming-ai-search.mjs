// Content page: AI search (AEO) for pet grooming salons (トリミングサロン・
// ペットサロン, dogs and cats). Industry page. Angle: the facts AI needs are
// price by breed/weight, time and pick-up, which animals the salon accepts,
// what happens if an animal gets ill or hurt, the legally required animal
// business registration display (Japan), and a clear line between grooming
// and veterinary care. Separate from the animal hospital article (PR #84,
// not merged) — no clinic content here.
//
// Written 2026-11-23 11時 (JST). Nurevo AEO facts come from the plugin source
// and readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2):
// setup wizard cards (includes/setup-wizard.php ~l.360): "Other"（その他）sets
// no type, so the plugin publishes LocalBusiness when an address, phone or
// hours is present; "Retail shop"（小売店）family includes PetStore; "Clinic or
// dental" family includes VeterinaryCare; "Beauty salon" family is BeautySalon
// / HairSalon / NailSalon / DaySpa / HealthAndBeautyBusiness. Free-text field
// 「業種（schema.org型）」. Services (up to 20) as Service + Offer +
// ReserveAction and an llms.txt line; FAQ block / [nurevo_faq]; monthly free
// check (three questions to Perplexity, never the business name); Pro
// measurement (beta) on Perplexity. Prices: Free 0, Standard 3,000 JPY /
// USD 20, Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-23):
// - 環境省「動物取扱業の適正化」 trader.html (no date on page): seven kinds
//   (販売・保管・貸出し・訓練・展示・競りあっせん・譲受飼養); 保管 = 「保管を
//   目的に顧客の動物を預かる業」, examples ペットホテル業者・美容業者（動物を
//   預かる場合）・ペットのシッター; local governments may add own measures.
// - 広島県 第一種動物取扱業者の遵守事項 (掲載 2025-01-10): ads must show 8
//   items (氏名又は名称、事業所の名称、所在地、種別、登録番号、登録年月日、
//   有効期間の末日、動物取扱責任者の氏名); 「HPやSNS等も対象」; update the
//   number at renewal; 標識 at a visible place.
// - 埼玉県（狭山保健所）手引き 25.11.20版: same items for ads (example
//   「保管 61 - 9999」), validity 5 years (法第13条), renewal from 2 months
//   before expiry, no reminder usually; misleading content banned.
// - 熊本市 (最終更新 2025-01-14): トリミング・ペットホテル listed as needing
//   registration; 保管 examples as above.
// - 農林水産省「小動物獣医療等に関するよくある質問」(更新 2024-12-12): 飼育動物
//   の診療は獣医師でなければできない; トリミングサロンでは病気を治すことを目的
//   としたシャンプーはできない（被毛の洗浄は問題ない）; 歯石は歯磨きで取れない;
//   スケーラーによる歯石除去は診療行為; 歯ブラシ・ガーゼでの歯垢除去は一般的に
//   診療ではない.
// - 日本獣医師会 2019-04-15 (日獣会誌72(5)): not 診療 examples 爪切り、耳そうじ、
//   毛刈り（トリミング）、シャンプー、肛門しぼり、歯磨き; 診療 examples 採血、注射、
//   麻酔、投薬、疾病の診断 etc.
// - schema-dts 2.1.0: PetStore ("A pet store.") is a LocalBusiness subtype; no
//   grooming type exists; VeterinaryCare is a MedicalOrganization type.
// - Google "AI features and your website" (checked earlier, see
//   hair-salon-ai-search): no extra requirements or special markup.
// Top articles read 2026-11-23: uravation トリミングサロンのAI検索対策
// (2026-08-08, upd 09-05), uravation ペットトリミングサロンのAI活用 (2026-06-07,
// upd 10-23), GMO ローカルAIO (2026-08-07, upd 11-16); Texta dog grooming
// (2025-03), Netranks (2026-05-13), getseoforai dog groomers (no date),
// PetBizAI (2025-06-22, mod 2026-07-14), RefreshAI pet grooming (no date).
// adsx failed; aiofacts redirected (not read).
// Not verified, so not stated: the 省令 numeric standards (cage size, staff
// ratio) for 保管; whether grooming in front of the owner needs registration
// (the page says to ask the local office); rules outside Japan; typical prices;
// share of owners who choose a salon via AI; 無麻酔歯石除去 statements by
// veterinary bodies; penalties.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  env: "https://www.env.go.jp/nature/dobutsu/aigo/1_law/trader.html",
  hiroshima: "https://www.pref.hiroshima.lg.jp/soshiki/180/contents-daiissyujunsyu.html",
  saitama: "https://www.pref.saitama.lg.jp/documents/281787/doutoriminasamahe260831.pdf",
  maff: "https://www.maff.go.jp/j/syouan/tikusui/zyui/FAQ.html",
  jvma2019: "https://jvma-vet.jp/mag/07205/a4.pdf",
  localBusiness: "https://schema.org/LocalBusiness",
  petStore: "https://schema.org/PetStore",
  vet: "https://schema.org/VeterinaryCare",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#organization",
      "name": "例トリミングサロン（例）",
      "description": "犬と猫のトリミング・シャンプーの店です。動物病院ではなく、病気の診断や治療、歯石取りは行いません。第一種動物取扱業（保管）登録番号：◯◯第◯◯号。",
      "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯市◯◯町1-2-3" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Tu-Su 10:00-18:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "トイプードル カットコース（5kg未満）",
      "description": "シャンプー、カット、爪切り、耳そうじ、足裏のバリカンを含みます。所要時間は約2時間30分で、終わり次第お電話します。7歳以上の子や持病のある子は、予約のときにお知らせください。",
      "category": "トリミング",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": { "@type": "Offer", "price": "7700", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/reserve" },
        "result": { "@type": "Reservation", "name": "トイプードル カットコース（5kg未満）" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.com/#organization",
      "name": "Example Grooming Studio",
      "description": "Grooming and bathing for dogs and cats. We are not a veterinary clinic: we do not diagnose or treat illness and do not remove tartar.",
      "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Example St, Example City" },
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Tu-Su 10:00-18:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Toy poodle full groom (under 5 kg)",
      "description": "Bath, haircut, nail trim, ear cleaning and paw-pad trim. Takes about 2.5 hours; we call you when your dog is ready. Please tell us when booking if your dog is 7 or older or has a health condition.",
      "category": "Grooming",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": { "@type": "Offer", "price": "70", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/book" },
        "result": { "@type": "Reservation", "name": "Toy poodle full groom (under 5 kg)" }
      }
    }
  ]
}`;

export default {
  slug: "pet-salon-grooming-ai-search",
  targetQueries: [
    "dog grooming salon AI search optimization",
    "pet groomer ChatGPT recommendation",
    "grooming salon schema markup LocalBusiness",
    "トリミングサロン AI検索対策",
    "ペットサロン LLMO ChatGPT 集客",
    "第一種動物取扱業 ホームページ 表示",
  ],
  related: ["hair-salon-ai-search", "pricing-page-ai-search", "booking-page-ai-search", "business-hours-holidays-ai-search", "faq-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "トリミングサロンのAI検索対策：料金・登録表示・線引き | Nurevo",
      description: "トリミングサロンのAI検索対策は、犬種・体重別の料金と時間、受け入れ条件、動物取扱業の登録表示、動物病院との線引きを本文と構造化データで正確に出すこと。公的資料、言い換え表、WordPress手順つき。",
      h1: "トリミングサロン・ペットサロンのAI検索対策：犬種別の料金、動物取扱業の表示、動物病院との線引きをAIに正しく読ませる",
      lead: "トリミングサロンのAI検索対策（AEO）の中心は、AIに「◯◯市でトイプードルのカットはいくら？」「シニア犬でも受けてくれるトリミングサロンは？」と聞かれたときに、店のサイトが正確に答えられる状態にすることです。犬種・体重ごとの料金と所要時間、受け入れられる犬・猫の条件、預かり中に体調が変わったときの対応、第一種動物取扱業の登録の表示を本文に文字で書き、同じ事実を構造化データ（LocalBusinessとService）とllms.txtで公開します。「皮膚病が治る」「歯石取り」のような動物病院の領分の言葉は使わないほうが、AIにも飼い主にも信頼されやすくなります。",
      intro: [
        "作成日：2026年11月23日（JST）。法律・行政の情報は、本文に記した環境省・農林水産省・都道府県の資料と日本獣医師会の文書で確認したものです。この記事は法的な助言ではありません。登録や表示の細かい扱いは自治体によって違うことがあるので、管轄の動物愛護センターや保健所に確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが店の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。動物病院は、この記事の対象ではありません。",
      ],
      sections: [
        {
          heading: "トリミングサロンについて、AIはどんな質問をされているか",
          paragraphs: [
            "トリミングサロンを探す飼い主の質問は、人の美容室と違い「うちの子を受けてくれるか」が先に来ます。犬種や体重、年齢、性格（噛む・怖がり）、持病によって、受けられる店が変わるからです。AIはこうした条件つきの質問に答えるとき、店のサイトに条件が書いてあれば、それを根拠に使えます。書いていなければ、口コミや一般論から推測するか、条件のはっきりした別の店を挙げます。",
          ],
          table: {
            head: ["よくある質問の型", "質問の例", "AIが答えに必要な、店側の事実"],
            rows: [
              ["料金", "「トイプードルのカット、◯◯駅の近くでいくら？」", "犬種・体重ごとの税込料金、毛玉や大型犬の追加料金、猫の料金"],
              ["時間と送迎", "「何時間くらい預ける？送迎はある？」", "コースごとの所要時間、お迎えの連絡方法、送迎の範囲と料金"],
              ["受け入れ条件", "「シニア犬や噛む子でも大丈夫？」", "受けられる犬種・体重の上限、年齢や持病の扱い、ワクチン証明などの条件"],
              ["安全", "「トリミング中にけがをしたらどうなる？」", "体調が変わったときの対応、連絡の流れ、近くの動物病院への連れて行き方"],
              ["健康の相談", "「皮膚が赤いけどトリミングに行っていい？」", "動物病院の受診をすすめる条件、サロンでしないこと"],
              ["信頼", "「ちゃんと登録しているお店？」", "第一種動物取扱業の登録番号と動物取扱責任者、トリマーの経歴"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            "2026年11月23日に、日本語と英語で「トリミングサロン AI検索対策」「dog grooming AI search」などの上位記事を10本選び、8本を読みました（2本は取得できず）。日本語では、登録番号をサイトに出すことや犬種別の料金表を勧める記事がありましたが、表示する項目の根拠になる自治体の資料と「HPやSNSも対象」という点、動物病院との線引きの根拠（農林水産省の資料）、構造化データのコード、WordPressでの設定手順、AIの回答を確かめる方法まで書いた記事は見つかりませんでした。",
            "英語の記事は、口コミの件数や星の数、Googleビジネスプロフィールの話が中心で、「口コミ50件以上」「AI経由の客は成約率が23倍」のような数字の多くは出典がないか、AI可視化サービスを売る会社の主張でした。この記事では出典を確かめられない数字は使わず、抜けている手順と線引きを埋めます。",
          ],
        },
        {
          heading: "法律で決まっている表示：第一種動物取扱業の登録",
          paragraphs: [
            `日本では、動物愛護管理法により、ペットを預かる仕事は第一種動物取扱業の「保管」にあたり、都道府県などへの登録が必要です。環境省は保管業の例として、ペットホテル、ペットシッターと並べて「美容業者（動物を預かる場合）」を挙げています。[環境省：動物取扱業の適正化](${SRC.env})。飼い主の前でその場で仕上げるだけの形が対象になるかなど、細かい判断は自治体の窓口に確認してください。`,
            `登録した店は、店に標識を掲げ、広告にも決まった項目を表示します。広島県の案内は、広告に表示する項目を8つ挙げ、「新聞・チラシだけではなく、HPやSNS等も対象になります」としています。[広島県：第一種動物取扱業者の遵守事項](${SRC.hiroshima})。埼玉県の手引きも同じ項目を挙げ、登録の有効期間は5年で、更新しないと効力を失うとしています。[埼玉県（狭山保健所）：動物取扱業者の皆様へ](${SRC.saitama})`,
          ],
          table: {
            head: ["サイトに表示する項目", "書き方の例", "AIにとっての意味"],
            rows: [
              ["氏名または名称", "株式会社◯◯／◯◯ ◯◯", "運営者がはっきりする"],
              ["事業所の名称と所在地", "例トリミングサロン　◯◯市◯◯町1-2-3", "店名と住所が、地図やほかのサイトの情報と結びつく"],
              ["第一種動物取扱業の種別", "保管", "預かりができる店だとわかる"],
              ["登録番号", "◯◯第◯◯号", "「登録している店か」の質問に答えられる"],
              ["登録年月日と有効期間の末日", "2024年4月1日／2029年3月31日", "更新されている現在の情報だとわかる"],
              ["動物取扱責任者の氏名", "◯◯ ◯◯", "誰が責任を持っているかがわかる"],
            ],
            caption: "広島県・埼玉県の資料にある項目を、サイト用に6行にまとめた表です。項目の数え方や細かい書き方は自治体の案内に従ってください。更新で番号や期間が変わったら、サイト・SNS・予約サイトを同じ日に直します。",
          },
          after: [
            "表示は、全ページのフッターか「店舗情報」のページに文字で書きます。登録証の写真だけだと、AIや検索エンジンが文字として読めないことがあります。この表示は法律上の義務ですが、AI検索にとっても「実在して、きちんと登録している店」を示す具体的な事実になります。",
          ],
        },
        {
          heading: "動物病院との線引き：サロンでしてよいこと、書かないこと",
          paragraphs: [
            `飼育動物の診療は、獣医師でなければ仕事にできません。農林水産省のよくある質問は、トリミングサロンでは病気を治すことを目的としたシャンプーはできず、被毛を洗うためのシャンプーは問題ないこと、スケーラーを使う歯石除去は獣医師の判断と技術で行う診療行為であること、歯石は歯磨きでは取り除けないことを説明しています（2024年12月12日更新）。[農林水産省：小動物獣医療等に関するよくある質問](${SRC.maff})`,
            `日本獣医師会の2019年の文書は、診療にあたらない例として、爪切り、耳そうじ、毛刈り（トリミング）、シャンプー、肛門しぼり、歯磨きを挙げ、注射・麻酔・投薬・病気の診断などは診療にあたるとしています。[日本獣医師会（2019年4月15日）](${SRC.jvma2019})。つまり、トリミングサロンの通常のメニューは、書き方を気をつければそのまま載せられます。`,
          ],
          table: {
            head: ["避けたい表現", "理由", "代わりに書く事実の例"],
            rows: [
              ["「皮膚病が治る薬用シャンプー」", "病気を治す目的のシャンプーはサロンでできない（農林水産省）", "「低刺激のシャンプーで被毛と皮膚を洗います。皮膚に赤みやかゆみがある子は、先に動物病院にご相談ください」"],
              ["「歯石取り」「無麻酔で歯石除去」", "スケーラーでの歯石除去は診療行為。歯石は歯磨きで取れない", "「歯磨き（歯垢のケア）。歯石は取れないため、気になる場合は動物病院へ」"],
              ["「健康チェック」「診察」", "診断と読まれる", "「施術中に気づいたこと（皮膚、耳、爪など）をお伝えします。診断ではありません」"],
              ["「どんな子でも安心」「事故ゼロ」", "言い切れない。受けられない子の条件が書かれていないと、AIも判断できない", "「体重◯kgまで。持病のある子・7歳以上の子は予約のときにご相談ください」"],
              ["「アレルギー改善」「ストレス解消の効果」", "効果をうたう表現", "「炭酸泉（追加◯円）。汚れを落としやすくするための入浴です」"],
            ],
            caption: "この記事が勧める書き換えです。法律の条文の当てはめではないので、迷う表現は管轄の窓口に確認してください。",
          },
        },
        {
          heading: "料金とメニューのページに書く8つの事実",
          list: [
            "犬種・体重ごとの税込料金：「トイプードル 5kg未満 カットコース 7,700円（税込）」のように、犬種・体重・コース・総額をセットで。猫の料金も分けて書く。",
            "追加料金の条件：毛玉、大型犬、噛む子、オプション（炭酸泉、歯磨きなど）の金額。",
            "所要時間とお迎え：コースごとの目安時間、終わったときの連絡方法、お迎えの時間の決まり。",
            "受け入れ条件：体重の上限、猫の受け入れ、年齢や持病の扱い、ワクチンやノミ・ダニ予防の条件（店の方針として決めているもの）。",
            "体調が変わったときの対応：施術を中止する条件、飼い主への連絡、近くの動物病院への連れて行き方と費用の扱い。",
            "サロンでしないこと：病気の診断や治療、薬を使うこと、歯石取りはしないこと。",
            "予約・キャンセル・送迎：予約の方法、キャンセル料、送迎の範囲と料金、駐車場。",
            "登録とトリマー：第一種動物取扱業の表示（上の表）と、トリマーの経歴・資格の正確な名前（民間資格なら発行団体名）。",
          ],
          after: [
            "料金表を画像だけで載せている店はよくありますが、画像の中の文字はAIに読まれないことがあるので、本文にも文字で書きます。料金ページの書き方全般は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)、定休日や年末年始の書き方は[営業時間・定休日のAI検索対策](/guide/business-hours-holidays-ai-search/)にまとめています。",
          ],
        },
        {
          heading: "構造化データ：医療の型も、人の美容の型も使わない",
          paragraphs: [
            `schema.orgには、トリミングサロンだけを表す型はありません。schema-dts 2.1.0で確認すると、近いのは[PetStore](${SRC.petStore})（説明は「ペットショップ」）だけで、トリミングの型はありません（2026年11月23日確認）。トリミングとホテルが中心の店は[LocalBusiness](${SRC.localBusiness})を使い、何をする店かは説明（description）とメニュー（Service）で伝えるのが正確です。フードや用品の販売が主な店なら、PetStoreが合います。`,
            `使わないほうがよいのは2つです。[VeterinaryCare](${SRC.vet})は医療（MedicalOrganization）の型で、動物病院を表します。BeautySalonやHairSalonは人の美容室・ネイルと同じ分類（HealthAndBeautyBusiness）なので、AIに人の美容室と取り違えられるおそれがあります。`,
            "メニューは犬種・体重・コースごとにServiceとして出し、説明に含まれる作業と所要時間を入れます。Nurevo AEOで登録すると、次のような形になります（値は例です）。",
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データには、本文に見えている事実だけを入れます。Googleは、AI OverviewsやAI Modeのための特別なschema.orgのマークアップは必要ないとしています。[Google：AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "WordPressのトリミングサロンのサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACKなどのSEOプラグインはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「その他」を選びます。住所・電話番号・営業時間を入れると、LocalBusinessとして出力されます。用品やフードの販売が中心なら「小売店」を選び、設定画面の「業種（schema.org型）」にPetStoreと入れます。「美容サロン」と「クリニック・歯科」は選びません。",
            "店の説明に「動物病院ではなく、病気の診断や治療、歯石取りは行いません」と、第一種動物取扱業の種別と登録番号を入れます。",
            "メニューを1つずつサービスとして登録します（最大20件）。サービス名に犬種・体重・コース、料金に税込の金額（数字だけ）、通貨にJPY、予約URL、説明に含まれる作業・所要時間・事前に相談してほしい子の条件を入れます。サービス・料金・予約のアクションとして出力され、llms.txtにも1行ずつ載ります。",
            "よくある質問（受け入れ条件、所要時間、体調が変わったとき、歯石、猫の対応、送迎）を入力し、料金のページなどにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search/)をご覧ください。",
            "/llms.txt を開き、料金・受け入れ条件・店舗情報（登録の表示）・予約のページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。予約ページの書き方は[予約ページのAI検索対策](/guide/booking-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "Instagram・予約サイト・Googleビジネスプロフィールとそろえる",
          paragraphs: [
            "トリミングサロンは、Instagramの仕上がり写真と予約サイトで集客する店が多い業種です。AIはそれらも読むので、サイトと予約サイトで料金が違ったり、古い投稿に「歯石取り」「皮膚病に効く」が残っていたりすると、サイトを直しても古い情報が答えに使われることがあります。",
            "料金・営業時間・定休日・受け入れ条件は、サイト・予約サイト・Googleビジネスプロフィールで同じにします。広島県の案内のとおり、SNSも広告の表示の対象なので、Instagramのプロフィールにも登録の表示を入れておきます。料金を変えたときや登録を更新したときは、同じ日に全部を直します。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "犬種・体重・コースごとの税込料金と、猫の料金が文字で書かれている。",
            "追加料金（毛玉・大型犬・オプション）の条件が書かれている。",
            "コースごとの所要時間とお迎えの連絡方法が書かれている。",
            "受け入れられる犬・猫の条件（体重、年齢、持病、ワクチンなど）が書かれている。",
            "体調が変わったときの対応と、動物病院への連れて行き方が書かれている。",
            "「治る」「歯石取り」「診察」などの、動物病院の領分の言葉を使っていない。",
            "第一種動物取扱業の表示（名称、所在地、種別、登録番号、登録年月日、有効期間の末日、動物取扱責任者）が全ページか店舗情報のページに文字である。",
            "構造化データの型がLocalBusiness（販売が中心ならPetStore）で、VeterinaryCareやBeautySalonではない。",
            "サイト・予約サイト・Googleビジネスプロフィール・Instagramで、料金・営業時間・登録の表示がそろっている。",
            "llms.txtに料金・受け入れ条件・店舗情報・予約のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、飼い主が聞きそうな質問をAIに投げます。「◯◯市 トリミング トイプードル 料金」「◯◯駅 シニア犬 トリミングサロン」のような地域＋条件の質問で名前が出るかに加えて、店名を入れて「猫も受けてくれる？」「何時間かかる？」と聞き、答えがサイトの説明と合っているかを記録します。AIが店を動物病院のように説明している場合や、「歯石取りができる」と答える場合は、サイト・予約サイト・古い投稿のどこかに古い表現が残っていないかを探します。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（店の名前は含めません）をPerplexityに投げ、回答に店の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
          ],
        },
      ],
      faqs: [
        { q: "トリミングサロンのAI検索対策は、何から始めればいいですか？", a: "犬種・体重ごとの税込料金と所要時間、受け入れ条件、体調が変わったときの対応を本文に文字で書き、第一種動物取扱業の表示をフッターか店舗情報のページに入れることからです。そのうえで、同じ事実をLocalBusinessとServiceの構造化データとllms.txtで公開し、予約サイトやGoogleビジネスプロフィールとそろえます。" },
        { q: "登録番号はサイトに載せないといけませんか？", a: "日本では、第一種動物取扱業の登録をした店は、広告に登録番号などの項目を表示します。広島県の案内は、ホームページやSNSも対象としています。細かい扱いは管轄の自治体に確認してください。表示しておくと、AIが「登録している店か」の質問に答える根拠にもなります。" },
        { q: "トリミングサロンで「歯石取り」と書いてもいいですか？", a: "避けてください。農林水産省は、スケーラーを使う歯石除去は獣医師が行う診療行為で、歯石は歯磨きでは取れないと説明しています。サロンのメニューは「歯磨き（歯垢のケア）」とし、歯石が気になる場合は動物病院をすすめる書き方にします。" },
        { q: "薬用シャンプーのメニューは載せられますか？", a: "被毛を洗うためのシャンプーは問題ありませんが、農林水産省は、トリミングサロンでは病気を治すことを目的としたシャンプーはできないとしています。「皮膚病が治る」とは書かず、皮膚に症状がある子は先に動物病院へ、と書きます。" },
        { q: "トリミングサロンの構造化データにはどの型を使いますか？", a: "schema.orgにトリミングの型はないので、LocalBusinessを使い、メニューをServiceで出します。用品やフードの販売が中心ならPetStoreです。VeterinaryCare（動物病院）や、人の美容室の型（BeautySalonなど）は使いません。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・メニュー（サービス）・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコア、月1回の無料のAIチェックは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに店が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが店の事実を正しく読める状態をつくり、出ているか・正しく答えているかを続けて確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが店のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで料金とメニューの情報を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleとGeminiはGoogle LLC、InstagramはMeta Platforms, Inc.の商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACKはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Pet Grooming Salons: Prices, Rules, Lines | Nurevo",
      description: "AEO for pet grooming salons: publish prices by breed and weight, time and pick-up, which pets you accept, what happens if a pet falls ill, and a clear line from vet care.",
      h1: "AI search for pet grooming salons: getting AI to read your breed-based prices, acceptance rules, registration and the line between grooming and veterinary care",
      lead: "AI search optimization (AEO) for a pet grooming salon comes down to making your own site able to answer what owners ask AI, such as \"How much is a toy poodle groom near me?\" or \"Which groomers take senior dogs?\" Write your prices and times by breed and weight, which dogs and cats you can accept, what you do if a pet becomes unwell during grooming, and (in Japan) your animal business registration as text on your pages, then publish the same facts as LocalBusiness and Service structured data and in llms.txt. Words that belong to a vet, such as \"cures skin disease\" or \"tartar removal\", make a salon harder to trust, for AI and for owners alike.",
      intro: [
        "Written November 23, 2026 (JST). The legal and government information comes from Japanese sources (the Ministry of the Environment, the Ministry of Agriculture, Forestry and Fisheries, prefectural guides and the Japan Veterinary Medical Association), as cited in the text. Rules differ by country and region, so check the ones that apply to you. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your salon's facts readable to AI. They do not guarantee that an AI will mention your salon or rank it anywhere. Veterinary clinics are not covered here.",
      ],
      sections: [
        {
          heading: "What owners ask AI about grooming salons",
          paragraphs: [
            "Unlike a hair salon for people, the first question about a grooming salon is usually \"Will they take my pet?\" Breed, weight, age, temperament (biting, fear) and health conditions all change which salons can help. When a salon's site states these conditions, AI can use them as evidence. When it does not, AI guesses from reviews and general advice, or names another salon whose conditions are clear.",
          ],
          table: {
            head: ["Question type", "Example question", "Facts AI needs from your salon"],
            rows: [
              ["Price", "\"How much is a toy poodle groom near [station]?\"", "Prices by breed and weight including tax, extra charges for matting or large dogs, cat prices"],
              ["Time and pick-up", "\"How long will my dog be there? Do they pick up?\"", "Time per service, how you tell owners the pet is ready, pick-up area and fee"],
              ["Acceptance", "\"Do they take senior dogs or dogs that bite?\"", "Breed and weight limits, how you handle age and health conditions, vaccination requirements"],
              ["Safety", "\"What happens if my dog gets hurt during grooming?\"", "What you do if a pet becomes unwell, how you contact the owner, how you get the pet to a vet"],
              ["Health worries", "\"My dog's skin is red. Can I still book a groom?\"", "When you advise seeing a vet first, and what the salon does not do"],
              ["Trust", "\"Is this salon properly registered?\"", "Registration details (in Japan, the animal business registration number and responsible person), groomers' experience"],
            ],
            caption: "The example questions illustrate this article. They are not based on a study of how often they are asked.",
          },
        },
        {
          heading: "What the top-ranking guides leave out",
          paragraphs: [
            "On November 23, 2026 we picked ten top results in Japanese and English for searches such as \"dog grooming AI search\" and its Japanese equivalent, and read eight (two could not be fetched). The Japanese guides recommend showing the registration number and a price list by breed, but none showed the local-government source for which items to display or that websites and social media count as advertising, the source for the line between grooming and veterinary care, the structured data code, setup steps for WordPress, or how to check AI's answers.",
            "The English guides focus on review counts, star ratings and Google Business Profile. Many of their figures, such as \"at least 50 reviews\" or \"AI visitors convert 23 times better\", are unsourced or come from companies selling AI visibility services. This article uses no figure we could not check, and fills in the missing steps and the line from vet care.",
          ],
        },
        {
          heading: "Registration you must display (Japan)",
          paragraphs: [
            `In Japan, under the Act on Welfare and Management of Animals, a business that holds customers' animals counts as the \"keeping\" (hokan) category of a Type 1 animal handling business and must register with the prefecture or city. The Ministry of the Environment lists \"grooming businesses (when they hold the animal)\" as an example, alongside pet hotels and pet sitters. [Ministry of the Environment: animal handling businesses (Japanese)](${SRC.env}). Whether grooming done on the spot with the owner present is covered is a question for your local office.`,
            `Registered businesses post a sign at the premises and show set items in their advertising. Hiroshima Prefecture's guide lists eight items and says websites and social media count as advertising, not only newspapers and flyers. [Hiroshima Prefecture (Japanese)](${SRC.hiroshima}). Saitama Prefecture's guide lists the same items and says registration lasts five years and lapses if not renewed. [Saitama Prefecture, Sayama health office (Japanese)](${SRC.saitama})`,
          ],
          table: {
            head: ["Item to show on your site", "Example", "What it gives AI"],
            rows: [
              ["Name of the operator", "Example Co., Ltd. / owner's name", "Who runs the salon"],
              ["Name and address of the premises", "Example Grooming Studio, 1-2-3 Example St", "Links your name and address to maps and other sites"],
              ["Category of business", "Keeping (hokan)", "Shows that you can hold animals"],
              ["Registration number", "No. XX-XXXX", "Lets AI answer \"Is this salon registered?\""],
              ["Registration date and expiry", "April 1, 2024 / March 31, 2029", "Shows the information is current"],
              ["Name of the responsible person", "Full name", "Shows who is accountable"],
            ],
            caption: "The items in the Hiroshima and Saitama guides, grouped into six rows for a website. Follow your local office's guide for the exact wording. When you renew and the number or dates change, update your site, social media and booking sites on the same day.",
          },
          after: [
            "Put this in your site footer or on your \"About the salon\" page as text. A photo of the certificate alone may not be read as text by AI or search engines. The display is a legal duty in Japan, and it is also a concrete fact that shows AI your salon is real and registered. Outside Japan, show whatever licence or registration your local rules require in the same way.",
          ],
        },
        {
          heading: "The line from veterinary care: what a salon can do and what not to write",
          paragraphs: [
            `In Japan, only a veterinarian may treat animals as a business. The Ministry of Agriculture's FAQ says a grooming salon may not use a shampoo intended to treat disease (washing the coat is fine), that removing tartar with a scaler is veterinary treatment requiring a vet's judgement and skill, and that tartar cannot be removed by brushing (updated December 12, 2024). [MAFF: FAQ on small animal veterinary care (Japanese)](${SRC.maff})`,
            `A 2019 document from the Japan Veterinary Medical Association lists nail trimming, ear cleaning, clipping (grooming), shampooing, expressing anal glands and tooth brushing as not veterinary treatment, while injections, anaesthesia, giving medicine and diagnosing disease are. [JVMA, April 15, 2019 (Japanese)](${SRC.jvma2019}). So a salon's normal menu can stay on the page, as long as it is worded carefully.`,
          ],
          table: {
            head: ["Wording to avoid", "Why", "Facts to write instead"],
            rows: [
              ["\"Medicated shampoo that cures skin disease\"", "A salon may not shampoo to treat disease (MAFF)", "\"We wash coat and skin with a gentle shampoo. If your pet's skin is red or itchy, please see your vet first.\""],
              ["\"Tartar removal\", \"anaesthesia-free dental cleaning\"", "Removing tartar with a scaler is vet treatment; brushing cannot remove tartar", "\"Tooth brushing (plaque care). It does not remove tartar; please see a vet about tartar.\""],
              ["\"Health check\", \"examination\"", "Reads as a diagnosis", "\"We will tell you anything we notice during grooming (skin, ears, nails). This is not a diagnosis.\""],
              ["\"Safe for every pet\", \"zero accidents\"", "Cannot be promised, and AI cannot judge without your limits", "\"Up to XX kg. Please talk to us when booking if your pet is 7 or older or has a health condition.\""],
              ["\"Improves allergies\", \"relieves stress\"", "Claims a health effect", "\"Carbonated spa bath (extra fee). A bath that helps lift dirt from the coat.\""],
            ],
            caption: "These rewrites are this article's recommendation, not an application of the law. Check doubtful wording with your local office.",
          },
        },
        {
          heading: "Eight facts to put on your price and menu pages",
          list: [
            "Prices by breed and weight including tax: breed, weight, service and total together, such as \"Toy poodle under 5 kg, full groom, $70\". List cat prices separately.",
            "Extra charges: matting, large dogs, dogs that bite, add-ons (spa bath, tooth brushing) and their amounts.",
            "Time and pick-up: typical time per service, how you tell owners the pet is ready, pick-up time rules.",
            "Acceptance: weight limits, whether you take cats, how you handle age and health conditions, vaccination and flea/tick requirements (your own policy).",
            "If a pet becomes unwell: when you stop, how you contact the owner, how you get the pet to a nearby vet and who pays.",
            "What the salon does not do: diagnose or treat illness, give medicine, remove tartar.",
            "Booking, cancellation and pick-up service: how to book, cancellation fee, pick-up area and fee, parking.",
            "Registration and groomers: your registration display (above) and each groomer's experience and exact certificate names (for private certificates, the issuing body).",
          ],
          after: [
            "Many salons post their price list only as an image. Text inside images may not be read by AI, so write it as text too. See [AI search for pricing pages](/guide/pricing-page-ai-search/) for price pages in general and [business hours and holidays](/guide/business-hours-holidays-ai-search/) for closing days.",
          ],
        },
        {
          heading: "Structured data: neither a medical type nor a human beauty type",
          paragraphs: [
            `schema.org has no type for grooming salons. Checking schema-dts 2.1.0 on November 23, 2026, the closest is [PetStore](${SRC.petStore}) (described as \"A pet store\"), and there is no grooming type. For a salon that mainly grooms and boards, use [LocalBusiness](${SRC.localBusiness}) and say what you do in the description and in each Service. If selling food and supplies is your main business, PetStore fits.`,
            `Two types are best avoided. [VeterinaryCare](${SRC.vet}) is a medical type (MedicalOrganization) for veterinary clinics. BeautySalon and HairSalon sit in the same group as human hair and nail salons (HealthAndBeautyBusiness), so AI may mistake you for a salon for people.`,
            "Publish each menu item by breed, weight and service as a Service, and describe what is included and how long it takes. Entered in Nurevo AEO, it looks like this (values are examples).",
          ],
          code: SCHEMA_EN,
          after: [
            "Put only facts that appear on the page into structured data. Google says no special schema.org markup is needed for AI Overviews or AI Mode. [Google: AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "Setting it up on a WordPress grooming salon site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Keep your SEO plugin, such as Yoast SEO, Rank Math, All in One SEO or SEO SIMPLE PACK: structured data is not duplicated.`,
            "In the setup wizard, choose \"Other\". Once you enter an address, phone number and hours, the salon is published as LocalBusiness. If you mainly sell supplies and food, choose \"Retail shop\" and type PetStore in the \"Business type (schema.org type)\" field in Settings. Do not choose \"Beauty salon\" or \"Clinic or dental\".",
            "In the business description, write \"We are not a veterinary clinic: we do not diagnose or treat illness or remove tartar\", and, in Japan, your registration category and number.",
            "Add each menu item as a service (up to 20). Put breed, weight and service in the name, the price including tax (numbers only), the currency, the booking URL, and in the description what is included, how long it takes and which pets should talk to you first. It is published as a service, an offer and a booking action, and listed line by line in llms.txt.",
            "Add FAQs (acceptance, time, what happens if a pet is unwell, tartar, cats, pick-up) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your price page. See [AI search for FAQ pages](/guide/faq-page-ai-search/).",
            "Open /llms.txt and check that your price, acceptance, salon information (registration) and booking pages are listed. Run the diagnosis on the AEO score screen and fix what is missing.",
          ],
          after: [
            "On a site not built with WordPress, check the same things. Enter your URL in the [free check](/check), no sign-up required, to see the state of your structured data, llms.txt and AI crawler access. For booking pages, see [AI search for booking pages](/guide/booking-page-ai-search/).",
          ],
        },
        {
          heading: "Keep Instagram, booking sites and Google Business Profile in step",
          paragraphs: [
            "Many grooming salons find clients through Instagram photos and booking sites. AI reads those too, so if a booking site shows different prices, or an old post still says \"tartar removal\" or \"good for skin disease\", AI may keep using the old information after you fix your site.",
            "Keep prices, hours, closing days and acceptance rules the same on your site, booking sites and Google Business Profile. In Japan, social media counts as advertising for the registration display, as Hiroshima's guide says, so add it to your Instagram profile too. When you change prices or renew your registration, update everything on the same day.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Prices by breed, weight and service, and cat prices, are written as text.",
            "Extra charges (matting, large dogs, add-ons) are explained.",
            "Time per service and how you tell owners the pet is ready are written.",
            "Which dogs and cats you accept (weight, age, health, vaccinations) is written.",
            "What you do if a pet becomes unwell, and how you get it to a vet, is written.",
            "No vet words such as \"cures\", \"tartar removal\" or \"examination\".",
            "In Japan, the registration display (name, address, category, number, date, expiry, responsible person) is on every page or the salon information page as text.",
            "The structured data type is LocalBusiness (PetStore if retail is your main business), not VeterinaryCare or BeautySalon.",
            "Prices, hours and the registration display match across your site, booking sites, Google Business Profile and Instagram.",
            "llms.txt lists your price, acceptance, salon information and booking pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI shows you, and whether it is right",
          paragraphs: [
            "Once the pages are in order, ask AI what owners would ask. Check whether you are named for local, condition-based questions such as \"toy poodle grooming price in [city]\" or \"grooming salon for senior dogs near [station]\", and also ask with your salon's name, such as \"Do they take cats?\" or \"How long does it take?\", and record whether the answers match your site. If AI describes your salon as if it were a vet, or says you remove tartar, look for old wording on your site, booking sites or old posts.",
            "AI answers change between runs, so ask the same questions several times, spread over time. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your salon's name) are put to Perplexity, and the plugin records whether the answers named your salon or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a grooming salon start with AI search?", a: "Write your prices and times by breed and weight, which pets you accept, and what you do if a pet becomes unwell as text on your pages, and (in Japan) put the animal business registration display in your footer or salon information page. Then publish the same facts as LocalBusiness and Service structured data and in llms.txt, and make them match your booking sites and Google Business Profile." },
        { q: "Do I have to show my registration number on my website?", a: "In Japan, a registered Type 1 animal handling business shows its registration number and other set items in its advertising, and Hiroshima Prefecture's guide says websites and social media count. Check the details with your local office. Showing it also gives AI evidence when someone asks whether your salon is registered." },
        { q: "Can a grooming salon advertise \"tartar removal\"?", a: "Avoid it. Japan's Ministry of Agriculture says removing tartar with a scaler is veterinary treatment and that brushing cannot remove tartar. Call your menu item \"tooth brushing (plaque care)\" and advise seeing a vet about tartar." },
        { q: "Can I list a medicated shampoo?", a: "Washing the coat is fine, but the Ministry of Agriculture says a grooming salon may not use shampoo intended to treat disease. Do not write \"cures skin disease\". Write that pets with skin symptoms should see a vet first." },
        { q: "Which structured data type should a grooming salon use?", a: "schema.org has no grooming type, so use LocalBusiness and publish your menu as Services. Use PetStore if selling supplies and food is your main business. Do not use VeterinaryCare (veterinary clinics) or human beauty types such as BeautySalon." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, menus (services) and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my salon appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your salon's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your prices and menu for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Google and Gemini of Google LLC, and Instagram of Meta Platforms, Inc. Yoast SEO, Rank Math, All in One SEO and SEO SIMPLE PACK are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
