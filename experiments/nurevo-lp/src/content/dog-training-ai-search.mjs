// Content page: AI search (AEO) for dog trainers / dog training classes
// (ドッグトレーナー・犬のしつけ教室・出張トレーニング・預かり訓練). Industry page.
// Angle: the facts AI needs are the training format (visit / class / board-and-
// train), the service area for visiting trainers, which dogs and problems are
// accepted, price per session and what one session can and cannot do, the
// 第一種動物取扱業「訓練」 registration display (Japan, which explicitly covers
// visiting trainers), and avoiding "guaranteed results" wording. Separate from
// pet-salon-grooming-ai-search (保管・grooming) and the animal hospital PR #84.
//
// Written 2026-11-23 20時 (JST). Nurevo AEO facts come from the plugin source
// and readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2),
// same as pet-salon-grooming-ai-search: wizard "Other"（その他）→ LocalBusiness
// when address/phone/hours are present; services (up to 20) as Service + Offer
// + ReserveAction and an llms.txt line; FAQ block / [nurevo_faq]; monthly free
// check (three questions to Perplexity, never the business name); Pro
// measurement (beta) on Perplexity. The plugin has no areaServed field, so the
// service area goes in text and the description. Prices: Free 0, Standard
// 3,000 JPY / USD 20, Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-23):
// - 環境省 trader.html (no date): 訓練＝「顧客の動物を預かり訓練を行う業」, examples
//   動物の訓練・調教業者、出張訓練業者; 「出張訓練などのように、動物の所有や飼養施設
//   がない場合も、規制の対象」; registration per 事業所 and per 業種.
// - 東京都動物愛護相談センター (更新 2026-07-10): 訓練 examples 「動物の訓練・調教業者
//   （出張も含む）」; ads show 8 items (氏名・名称、事務所の名称、所在地、種別、登録
//   番号、登録年月日、有効期間の末日、動物取扱責任者の氏名); 事業所ごとに常勤の専属の
//   動物取扱責任者.
// - 福岡市 (更新 2026-11-11): 訓練 examples incl. 出張訓練業者; 訓練場 required only
//   for 「飼養施設において訓練を行う訓練業」; 責任者 yearly training.
// - 厚生労働省 狂犬病 page: owner duties = 市区町村への登録、年1回の予防注射、鑑札と
//   注射済票の装着; 4〜6月は予防注射月間.
// - schema-dts 2.1.0: no dog-training or pet-training type (checked: PetStore,
//   AnimalShelter, Course, Sports* only).
// - Google "AI features and your website" (checked earlier): no special markup.
// Top articles read 2026-11-23: uravation トリミングサロン (2026-08-08, upd 09-05),
// uravation スクール・教室 (2026-07-21, upd 09-05), GMO ローカルAIO (2026-08-07,
// upd 11-16), assist-all 2本 (not pet-related), くらしのマーケット 出張しつけ listing;
// Texta dog training (2025-03), NetRanks (2026-05-13), WebFX dog trainers SEO
// (mod 2026-07-28), Barketing (2026-05-29), BlogPaws (2025-05-15), SEJ local AI
// Overviews (2026-07-22). petscare.com failed; wagbar returned another page.
// Not verified, so not stated: whether group classes where the owner handles
// the dog need registration (page says ask the local office); trainer
// licensing outside Japan; private certification bodies' requirements; typical
// prices; 特定商取引法 coverage; share of owners who search via AI.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  env: "https://www.env.go.jp/nature/dobutsu/aigo/1_law/trader.html",
  tokyo: "https://www.hokeniryo.metro.tokyo.lg.jp/shisetsu/jigyosyo/douso/dt_gyou/dt_gyou",
  fukuoka: "https://www.city.fukuoka.lg.jp/hofuku/dobutsukanri/life/dealer.html",
  mhlw: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou/kekkaku-kansenshou18/kyokenbyou.html",
  sej: "https://www.searchenginejournal.com/ai-overviews-now-answer-most-local-searches-how-get-your-business-cited/580757/",
  localBusiness: "https://schema.org/LocalBusiness",
  course: "https://schema.org/Course",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  gbpArea: "https://support.google.com/business/answer/9157481",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#organization",
      "name": "例ドッグトレーニング（例）",
      "description": "犬の出張しつけ（◯◯市・◯◯市・◯◯町）と、週末のパピー教室を行っています。吠え・引っ張り・甘噛みなどのご相談に対応します。動物病院ではないため、病気の診断や薬の相談は行いません。第一種動物取扱業（訓練）登録番号：◯◯第◯◯号。",
      "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯市◯◯町1-2-3" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Mo-Sa 09:00-18:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "出張しつけ 60分（小型犬・中型犬）",
      "description": "ご自宅か近所の公園で、飼い主さんと一緒に練習します。◯◯市内は出張費無料、ほかの地域は1回1,100円。1回で直るものではなく、3〜6回を目安に、次回までの練習方法をお渡しします。人を噛んだことがある子は、予約のときにお知らせください。",
      "category": "犬のしつけ・トレーニング",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": { "@type": "Offer", "price": "6600", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/reserve" },
        "result": { "@type": "Reservation", "name": "出張しつけ 60分（小型犬・中型犬）" }
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
      "name": "Example Dog Training",
      "description": "In-home dog training in Example City, North Town and West Town, plus weekend puppy classes. We help with barking, leash pulling and puppy nipping. We are not a vet and do not diagnose illness or advise on medication.",
      "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Example St, Example City" },
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Mo-Sa 09:00-18:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "In-home training, 60 minutes (small and medium dogs)",
      "description": "We train with you at home or in a nearby park. No travel fee inside Example City; $10 per visit elsewhere. One session does not fix a problem: most owners book 3 to 6, and we leave you a practice plan for each week. Please tell us when booking if your dog has ever bitten a person.",
      "category": "Dog training",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": { "@type": "Offer", "price": "60", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/book" },
        "result": { "@type": "Reservation", "name": "In-home training, 60 minutes (small and medium dogs)" }
      }
    }
  ]
}`;

export default {
  slug: "dog-training-ai-search",
  targetQueries: [
    "dog trainer AI search optimization",
    "dog training business ChatGPT recommendation",
    "dog trainer schema markup LocalBusiness",
    "ドッグトレーナー AI検索対策",
    "犬のしつけ教室 LLMO 集客",
    "出張訓練 第一種動物取扱業 ホームページ 表示",
  ],
  related: ["pet-salon-grooming-ai-search", "lesson-studio-ai-search", "pricing-page-ai-search", "booking-page-ai-search", "faq-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "ドッグトレーナーのAI検索対策：出張・教室・登録表示 | Nurevo",
      description: "ドッグトレーナー・しつけ教室のAI検索対策は、教え方の形（出張・教室・預かり）、出張の範囲、受けられる犬と悩み、1回の料金と回数の目安、動物取扱業（訓練）の表示を本文と構造化データで正確に出すこと。",
      h1: "ドッグトレーナー・犬のしつけ教室のAI検索対策：出張の範囲、料金と回数、動物取扱業（訓練）の表示をAIに正しく読ませる",
      lead: "ドッグトレーナーのAI検索対策（AEO）の中心は、AIに「◯◯市で出張してくれるドッグトレーナーは？」「吠え癖を直すしつけ教室、何回くらい通う？」と聞かれたときに、自分のサイトが正確に答えられる状態にすることです。教え方の形（出張・教室・預かり）、出張する地域、受けられる犬と悩み、1回の料金と回数の目安、第一種動物取扱業（訓練）の登録の表示を本文に文字で書き、同じ事実を構造化データ（LocalBusinessとService）とllms.txtで公開します。「1回で必ず直る」のような言い切りは、AIにも飼い主にも信頼されにくくなります。",
      intro: [
        "作成日：2026年11月23日（JST）。法律・行政の情報は、本文に記した環境省・東京都・福岡市・厚生労働省のページで確認したものです。この記事は法的な助言ではありません。登録や表示の細かい扱いは自治体によって違うことがあるので、管轄の動物愛護センターや保健所に確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがトレーナーの事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。トリミングサロンは[トリミングサロンのAI検索対策](/guide/pet-salon-grooming-ai-search/)で扱っています。",
      ],
      sections: [
        {
          heading: "ドッグトレーナーについて、AIはどんな質問をされているか",
          paragraphs: [
            "しつけの相談は、店を選ぶ前に「何に困っているか」から始まります。吠え、引っ張り、甘噛み、トイレ、留守番、人や犬への攻撃など、悩みごとに合うトレーナーが違い、さらに「家に来てくれるか」「通えるか」「預けられるか」で候補が分かれます。AIは、サイトにこうした条件が書いてあれば、それを根拠に「◯◯市なら、出張で吠えの相談を受けている◯◯」と答えられます。書いていなければ、ポータルサイトの掲載や一般論から推測します。",
          ],
          table: {
            head: ["よくある質問の型", "質問の例", "AIが答えに必要な、トレーナー側の事実"],
            rows: [
              ["教え方の形", "「家に来てくれるしつけの先生はいる？」", "出張・教室（グループ・個別）・預かり訓練のどれをしているか"],
              ["地域", "「◯◯区まで出張してくれる？」", "出張する市区町村の名前、出張費がかかる地域と金額"],
              ["悩みと犬", "「噛む子でも見てもらえる？」「大型犬は？」", "対応する悩みの一覧、受けられる犬の大きさ・年齢、受けられない場合"],
              ["料金と回数", "「1回いくら？何回で直る？」", "1回の時間と税込料金、回数券、回数の目安（保証ではないこと）"],
              ["教え方", "「叱るしつけ？ほめるしつけ？」", "どんな方法で教えるか、使わない道具や方法"],
              ["信頼", "「ちゃんと登録している人？」", "第一種動物取扱業（訓練）の登録番号、動物取扱責任者、トレーナーの経歴"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            "2026年11月23日に、日本語と英語で「ドッグトレーナー AI検索対策」「dog trainer AI search」などの上位記事を14本選び、12本を読みました（1本は取得できず、1本は別の記事が表示）。日本語では、しつけ教室に絞ったAI検索対策の解説は見つからず、トリミングサロンや習い事の教室、地域の店全般の記事が上位でした。出張訓練が第一種動物取扱業の対象であることと、サイトに出す項目、WordPressでの設定、構造化データのコードをまとめた記事はありませんでした。",
            `英語の記事は、口コミの件数や星の数、Googleビジネスプロフィールの話が中心で、「口コミ50件以上」「平均4.0以上」のような数字には出典がありませんでした。「成果保証」をFAQに書くよう勧める記事もありました。出典のある調査では、Search Engine Journalの記事が、地域の検索の68%でAI Overviewsが表示されたというWhitesparkの調査を紹介しています（2026年7月22日）。[Search Engine Journal](${SRC.sej})。この記事では、出典を確かめられない数字は使わず、抜けている手順と表示の根拠を埋めます。`,
          ],
        },
        {
          heading: "法律で決まっている表示：第一種動物取扱業の「訓練」",
          paragraphs: [
            `日本では、動物愛護管理法により、お客さんの犬を預かって訓練する仕事は第一種動物取扱業の「訓練」にあたり、都道府県などへの登録が必要です。環境省は、訓練業の例として「動物の訓練・調教業者」と並べて「出張訓練業者」を挙げ、出張訓練のように飼養施設がない場合も規制の対象になると説明しています。[環境省：動物取扱業の適正化](${SRC.env})。東京都も「出張も含む」と書いています。[東京都動物愛護相談センター：動物取扱業](${SRC.tokyo})。`,
            `つまり「家に行くだけだから登録はいらない」とは言えません。一方で、福岡市の案内では、訓練場（施設）が必要になるのは「飼養施設において訓練を行う訓練業」だけです。[福岡市：動物取扱業](${SRC.fukuoka})。飼い主が自分の犬を連れて参加するグループレッスンや、オンラインの相談だけの形がどう扱われるかは、自治体の窓口に確認してください。`,
            "登録した業者は、広告に決まった項目を表示します。東京都の案内は、次の8つの項目を挙げています。",
          ],
          table: {
            head: ["サイトに表示する項目", "書き方の例", "AIにとっての意味"],
            rows: [
              ["氏名または名称", "◯◯ドッグトレーニング　◯◯ ◯◯", "運営者がはっきりする"],
              ["事業所の名称と所在地", "◯◯市◯◯町1-2-3（出張専門の場合も事業所の所在地）", "地図やポータルサイトの情報と結びつく"],
              ["第一種動物取扱業の種別", "訓練（預かりもする場合は保管も）", "訓練を仕事にしていることがわかる"],
              ["登録番号", "◯◯第◯◯号", "「登録している人か」の質問に答えられる"],
              ["登録年月日と有効期間の末日", "2024年4月1日／2029年3月31日", "更新されている現在の情報だとわかる"],
              ["動物取扱責任者の氏名", "◯◯ ◯◯", "誰が責任を持っているかがわかる"],
            ],
            caption: "東京都の案内にある8項目を、サイト用に6行にまとめた表です。項目の数え方や細かい書き方は管轄の自治体の案内に従ってください。登録は事業所ごと・種別ごとなので、預かりもするなら「保管」の登録も確かめます。",
          },
          after: [
            "表示は、全ページのフッターか「プロフィール」「会社概要」のページに文字で書きます。登録証の写真だけだと、AIや検索エンジンが文字として読めないことがあります。法律上の表示ですが、AI検索にとっても「実在して、きちんと登録しているトレーナー」を示す具体的な事実になります。",
          ],
        },
        {
          heading: "言い切らない書き方：「必ず直る」を事実に置きかえる",
          paragraphs: [
            "しつけの成果は、犬の性格や年齢、家での練習によって変わります。「1回で直る」「どんな犬でも」と書くと、飼い主にも誤解を生みますし、AIが条件をつけずにそのまま紹介してしまうと、問い合わせのあとの食い違いになります。成果ではなく、何をするか・何回くらいかかることが多いか・受けられない場合を事実として書くほうが、AIは条件つきの質問にも答えやすくなります。",
          ],
          table: {
            head: ["避けたい表現", "理由", "代わりに書く事実の例"],
            rows: [
              ["「1回で吠え癖が直ります」", "成果は犬と家庭によって変わる", "「1回60分。吠えの相談では3〜6回を目安にしています（保証ではありません）」"],
              ["「どんな犬でもOK」", "受けられない場合が書かれていないと、AIも判断できない", "「人を噛んだことがある子は、事前の面談のあとにお受けしています。体重◯kgまで」"],
              ["「成功率98%」", "数え方が書かれていない数字は、根拠として扱いにくい", "数字を出すなら、期間・件数・何を成功と数えたかを書く。書けないなら出さない"],
              ["「病気の相談もお任せ」", "診断や薬の判断は獣医師の領分", "「急に吠えるようになった・痛がる場合は、先に動物病院にご相談ください」"],
              ["「◯◯協会認定」だけ", "どの団体の、何の資格かがわからない", "資格の正式な名前と発行団体、取った年を書く（民間資格なら民間資格と書く）"],
            ],
            caption: "この記事が勧める書き換えです。広告の表現の法的な判断ではないので、迷う表現は専門家や管轄の窓口に確認してください。",
          },
        },
        {
          heading: "サービスと料金のページに書く8つの事実",
          list: [
            "教え方の形：出張・教室（グループ／個別）・預かり訓練・オンライン相談のうち、どれをしているか。",
            "出張する地域：市区町村の名前を文字で並べる。出張費が無料の地域と、かかる地域の金額。",
            "対応する悩み：吠え、引っ張り、甘噛み、トイレ、留守番、攻撃行動など。受けていない相談も書く。",
            "受けられる犬：大きさ・体重、年齢（パピー教室の月齢など）、噛んだことがある犬の扱い。",
            "料金と時間：1回の時間と税込料金、回数券、出張費、キャンセル料。",
            "回数の目安：よくある回数と、それが保証ではないこと。家での練習の渡し方。",
            "参加の条件：狂犬病の予防注射や混合ワクチンの証明など、教室として決めている条件。飼い主には市区町村への犬の登録、年1回の狂犬病予防注射、鑑札と注射済票の装着の義務があります。[厚生労働省：狂犬病](" + SRC.mhlw + ")",
            "登録とトレーナー：第一種動物取扱業の表示（上の表）と、トレーナーの経歴、資格の正式な名前。",
          ],
          after: [
            "料金表を画像やInstagramの投稿だけで載せているトレーナーは多いですが、画像の中の文字はAIに読まれないことがあるので、本文にも文字で書きます。料金ページの書き方全般は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)、教室型の書き方は[習い事・レッスン教室のAI検索対策](/guide/lesson-studio-ai-search/)にまとめています。",
          ],
        },
        {
          heading: "構造化データ：犬の訓練の型はないので、LocalBusinessとServiceで",
          paragraphs: [
            `schema.orgには、ドッグトレーナーや犬のしつけ教室を表す型はありません（schema-dts 2.1.0で確認、2026年11月23日）。[LocalBusiness](${SRC.localBusiness})を使い、何をするかは説明（description）とメニュー（Service）で伝えるのが正確です。出張専門で店舗がない場合も、事業所の住所・電話・営業時間を入れ、出張する地域は説明と本文に書きます。`,
            `[Course](${SRC.course})は学校や講座の授業を表す型で、犬のしつけ教室に使うと人の講座と読まれるおそれがあるため、この記事では勧めません。メニューは「出張しつけ60分」「パピー教室 全4回」のようにServiceとして出し、説明に場所・回数の目安・事前に知らせてほしい条件を入れます。Nurevo AEOで登録すると、次のような形になります（値は例です）。`,
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データには、本文に見えている事実だけを入れます。Googleは、AI OverviewsやAI Modeのための特別なschema.orgのマークアップは必要ないとしています。[Google：AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "WordPressのドッグトレーナーのサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「その他」を選びます。住所・電話番号・営業時間を入れると、LocalBusinessとして出力されます。「美容サロン」や「クリニック・歯科」は選びません。",
            "店の説明に、教え方の形（出張・教室・預かり）、出張する市区町村の名前、第一種動物取扱業の種別と登録番号を入れます。Nurevo AEOには出張エリア専用の欄がないので、地域は説明と本文に文字で書きます。",
            "メニューを1つずつサービスとして登録します（最大20件）。サービス名に形と時間（例：出張しつけ60分）、料金に税込の金額（数字だけ）、通貨にJPY、予約URL、説明に場所・回数の目安・事前に知らせてほしい条件を入れます。サービス・料金・予約のアクションとして出力され、llms.txtにも1行ずつ載ります。",
            "よくある質問（何回で変わるか、出張の範囲、噛む子、ワクチンの条件、雨の日、キャンセル）を入力し、料金のページなどにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search/)をご覧ください。",
            "/llms.txt を開き、料金・出張の範囲・プロフィール（登録の表示）・予約のページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。予約ページの書き方は[予約ページのAI検索対策](/guide/booking-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "Instagram・ポータルサイト・Googleビジネスプロフィールとそろえる",
          paragraphs: [
            "ドッグトレーナーは、Instagramの動画や、くらしのマーケットのようなポータルサイトで集客する人が多い仕事です。AIはそれらも読むので、サイトとポータルで料金や出張の範囲が違ったり、古い投稿に「1回で直る」が残っていたりすると、サイトを直しても古い情報が答えに使われることがあります。",
            "料金・出張の範囲・営業日・受けられる犬の条件は、サイト・ポータル・Googleビジネスプロフィールで同じにします。東京都の案内では登録の表示は広告が対象なので、Instagramのプロフィールやポータルの紹介文にも入れておくと確実です。出張専門でGoogleビジネスプロフィールを作るときは、住所を出さずに対応地域（サービス提供地域）を設定する形があります。[Googleビジネスプロフィール ヘルプ：サービス提供地域](" + SRC.gbpArea + ")。料金を変えたときや登録を更新したときは、同じ日に全部を直します。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "教え方の形（出張・教室・預かり・オンライン）が文字で書かれている。",
            "出張する市区町村の名前と、出張費の条件が書かれている。",
            "対応する悩みと、受けていない相談が書かれている。",
            "受けられる犬（大きさ、年齢、噛んだことがある犬）の条件が書かれている。",
            "1回の時間・税込料金・回数券・キャンセル料が書かれている。",
            "回数の目安が「保証ではない」と添えて書かれ、「必ず直る」「成功率◯%（根拠なし）」がない。",
            "第一種動物取扱業の表示（名称、所在地、種別、登録番号、登録年月日、有効期間の末日、動物取扱責任者）が全ページかプロフィールのページに文字である。",
            "構造化データの型がLocalBusinessで、CourseやVeterinaryCareではない。",
            "サイト・ポータル・Googleビジネスプロフィール・Instagramで、料金・地域・登録の表示がそろっている。",
            "llms.txtに料金・出張の範囲・プロフィール・予約のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、飼い主が聞きそうな質問をAIに投げます。「◯◯市 出張 ドッグトレーナー」「◯◯駅 パピー教室」「大型犬 引っ張り しつけ ◯◯区」のような地域＋悩みの質問で名前が出るかに加えて、名前を入れて「◯◯区にも来てくれる？」「1回いくら？」と聞き、答えがサイトの説明と合っているかを記録します。AIが出張していない地域を挙げたり、古い料金を答えたりする場合は、ポータルや古い投稿のどこかに古い情報が残っていないかを探します。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（名前は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "ドッグトレーナーのAI検索対策は、何から始めればいいですか？", a: "教え方の形（出張・教室・預かり）、出張する地域、対応する悩みと受けられる犬、1回の料金と回数の目安を本文に文字で書き、第一種動物取扱業（訓練）の表示をフッターかプロフィールのページに入れます。そのうえで同じ事実を構造化データ（LocalBusinessとService）とllms.txtで公開し、ポータルサイトやGoogleビジネスプロフィールとそろえます。" },
        { q: "出張だけのトレーナーでも、動物取扱業の登録は必要ですか？", a: "環境省は訓練業の例に「出張訓練業者」を挙げ、飼養施設がない場合も規制の対象になると説明しています。東京都も「出張も含む」としています。ただし、細かい扱い（グループレッスンやオンライン相談だけの場合など）は自治体の窓口に確認してください。" },
        { q: "「何回で直る」と書いてもいいですか？", a: "成果は犬と家庭によって変わるので、言い切りは避け、「吠えの相談では3〜6回を目安にしています（保証ではありません）」のように、よくある回数と保証ではないことを書くのがおすすめです。AIにも条件つきで紹介されやすくなります。" },
        { q: "出張する地域は、どう書けばAIに伝わりますか？", a: "「◯◯市・◯◯市・◯◯町」のように市区町村の名前を文字で並べ、出張費が無料の地域とかかる地域の金額を書きます。地図の画像だけでは読まれないことがあります。Nurevo AEOには出張エリア専用の欄がないので、店の説明とサービスの説明にも同じ地域を書きます。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgにはドッグトレーナーの型がないので、LocalBusinessを使い、メニューをServiceとして出します。Course（人の講座）やVeterinaryCare（動物病院）は使いません。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・メニュー（サービス）・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ず紹介されますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、事実をAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOで料金とメニューを無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleとGeminiはGoogle LLCの、InstagramはMeta Platforms, Inc.の商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、くらしのマーケットは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Dog Trainers: Areas, Prices, Honest Claims | Nurevo",
      description: "AEO for dog trainers: publish how you train (in-home, class, board-and-train), the areas you travel to, which dogs and problems you take, prices and typical sessions.",
      h1: "AI search for dog trainers and training classes: getting AI to read your service area, prices, typical number of sessions and registration correctly",
      lead: "AI search optimization (AEO) for a dog trainer comes down to making your own site able to answer what owners ask AI, such as \"Which dog trainers come to the house in [city]?\" or \"How many sessions does it take to stop barking?\" Write how you train (in-home, classes, board-and-train), the towns you travel to, which dogs and problems you take on, the price per session and the usual number of sessions as text on your pages, then publish the same facts as LocalBusiness and Service structured data and in llms.txt. Claims such as \"fixed in one session, guaranteed\" make a trainer harder to trust, for AI and for owners alike.",
      intro: [
        "Written November 23, 2026 (JST). The legal and government information comes from Japanese sources (the Ministry of the Environment, the Tokyo Metropolitan Government, Fukuoka City and the Ministry of Health, Labour and Welfare), as cited in the text. Rules differ by country and region, so check the ones that apply to you. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention you or rank you anywhere. Grooming salons are covered in [AI search for pet grooming salons](/guide/pet-salon-grooming-ai-search/).",
      ],
      sections: [
        {
          heading: "What owners ask AI about dog trainers",
          paragraphs: [
            "A training enquiry starts with the problem, not the business. Barking, pulling on the lead, puppy nipping, toilet training, being left alone and aggression towards people or dogs each suit different trainers, and owners then split the options by whether the trainer comes to them, runs a class they can attend, or takes the dog in. If your site states these conditions, AI can use them as evidence: \"In [city], [name] does in-home sessions for barking.\" If it does not, AI guesses from directory listings or general advice.",
          ],
          table: {
            head: ["Question type", "Example", "Facts AI needs from the trainer"],
            rows: [
              ["Format", "\"Is there a trainer who comes to my home?\"", "Whether you offer in-home visits, group or private classes, board-and-train, or online calls"],
              ["Area", "\"Do they travel to [district]?\"", "The towns you cover by name, and where a travel fee applies and how much"],
              ["Problem and dog", "\"Will they take a dog that bites?\" \"Large dogs?\"", "The problems you work on, the size and age of dogs you take, and what you do not take"],
              ["Price and sessions", "\"How much per session, and how many will we need?\"", "Session length and price, packages, the usual number of sessions (not a promise)"],
              ["Method", "\"Do they use punishment or rewards?\"", "How you teach, and the tools or methods you do not use"],
              ["Trust", "\"Are they properly registered or qualified?\"", "In Japan, your animal business registration; elsewhere, the exact names of your qualifications and who issued them"],
            ],
            caption: "The example questions illustrate the point. They are not a measurement of how often people ask them.",
          },
        },
        {
          heading: "What the top guides leave out",
          paragraphs: [
            "On November 23, 2026 we picked 14 top-ranking Japanese and English articles for searches such as \"dog trainer AI search\" and read 12 of them (one could not be fetched and one returned a different page). In Japanese we found no guide aimed at dog trainers; grooming salons, lesson schools and local businesses in general ranked instead. None set out that visiting trainers fall under Japan's animal business registration, what to show on the site, how to set it up on WordPress, or what the structured data looks like.",
            `The English articles focused on review counts, star ratings and Google Business Profile, and figures such as \"at least 50 reviews\" or \"4.0 stars or higher\" came without a source. One suggested adding \"success guarantees\" to your FAQ. Among sourced research, Search Engine Journal reported Whitespark's finding that AI Overviews appeared on 68% of local searches (July 22, 2026). [Search Engine Journal](${SRC.sej}). We leave out numbers we cannot check, and fill in the missing steps and the basis for what you display.`,
          ],
        },
        {
          heading: "The registration you must display in Japan: \"training\" businesses",
          paragraphs: [
            `In Japan, the Act on Welfare and Management of Animals makes training a customer's animal a Type 1 animal handling business in the \"training\" category, which needs registration with the prefecture or city. The Ministry of the Environment lists \"visiting trainers\" as an example alongside animal trainers, and says businesses without their own animal facilities, such as visiting trainers, are still covered. [Ministry of the Environment](${SRC.env}). Tokyo's guidance also says the category \"includes visiting\". [Tokyo Metropolitan Animal Care and Consultation Center](${SRC.tokyo})`,
            `So \"I only visit homes\" does not mean no registration. On the other hand, Fukuoka City requires a training ground only for training businesses that train at their own facility. [Fukuoka City](${SRC.fukuoka}). How group classes where owners handle their own dogs, or online-only advice, are treated is a question for your local office.`,
            "Registered businesses show set items in their advertising. Tokyo's guidance lists eight.",
          ],
          table: {
            head: ["Item to show on your site", "Example", "What it gives AI"],
            rows: [
              ["Name of the person or company", "Example Dog Training, Taro Example", "Who runs the business"],
              ["Business name and address", "1-2-3 Example St (the registered office, even for visit-only trainers)", "A link to maps and directory listings"],
              ["Category", "Training (and boarding, if you keep dogs overnight)", "That training is your registered business"],
              ["Registration number", "Example No. 123", "An answer to \"are they registered?\""],
              ["Date registered and expiry", "April 1, 2024 / March 31, 2029", "That the information is current"],
              ["Name of the animal handling manager", "Taro Example", "Who is responsible"],
            ],
            caption: "Tokyo's eight items condensed into six rows for a website. Follow your local office's guidance on the exact items and wording. Registration is per office and per category, so if you also board dogs, check the boarding category too.",
          },
          after: [
            "Put the display as text in the footer of every page or on your profile or about page. A photo of the certificate alone may not be read as text by AI or search engines. Outside Japan, the equivalent is to name your business, address and qualifications exactly. Either way, it gives AI specific evidence that you are a real, accountable trainer.",
          ],
        },
        {
          heading: "Replace promises with facts",
          paragraphs: [
            "Training results depend on the dog's temperament and age and on practice at home. Writing \"fixed in one session\" or \"any dog\" misleads owners, and if AI repeats it without conditions, the mismatch surfaces after the enquiry. Writing what you do, how many sessions it usually takes and which cases you do not take makes it easier for AI to answer conditional questions.",
          ],
          table: {
            head: ["Avoid", "Why", "Write this kind of fact instead"],
            rows: [
              ["\"Stops barking in one session\"", "Results vary by dog and household", "\"Sessions are 60 minutes. For barking, most owners book 3 to 6 (not a guarantee).\""],
              ["\"Any dog welcome\"", "Without limits, AI cannot judge fit", "\"Dogs that have bitten a person are welcome after an initial consultation. Up to [x] kg.\""],
              ["\"98% success rate\"", "A figure without a method is weak evidence", "If you give a number, state the period, the count and what counted as success. If you cannot, leave it out."],
              ["\"We can help with health problems too\"", "Diagnosis and medication are a vet's job", "\"If your dog has suddenly started barking or seems to be in pain, please see a vet first.\""],
              ["\"Certified\" with no detail", "It does not say who certified what", "Give the exact qualification name, the issuing body and the year."],
            ],
            caption: "These are rewrites this article recommends, not a legal judgment on advertising claims. Check wording you are unsure about with an adviser or the relevant authority.",
          },
        },
        {
          heading: "Eight facts for your services and prices page",
          list: [
            "Format: in-home visits, group or private classes, board-and-train, online calls — which ones you offer.",
            "Area: the towns or districts you travel to, written out, and where a travel fee applies and how much.",
            "Problems: barking, pulling, nipping, toilet training, separation, aggression and so on, plus the ones you do not take on.",
            "Dogs: size or weight, age (such as the age range for puppy classes), and how you handle dogs that have bitten.",
            "Price and length: session length and price, packages, travel fees and cancellation fees.",
            "Typical sessions: the usual number, a note that it is not a guarantee, and how you give homework.",
            "Entry conditions: the vaccination proof or other conditions your class sets. In Japan, owners must register their dog with the municipality, have a rabies vaccination once a year and attach the tag and vaccination tag. [Ministry of Health, Labour and Welfare](" + SRC.mhlw + ")",
            "Registration and trainer: the registration display above (in Japan), your background and the exact names of your qualifications.",
          ],
          after: [
            "Many trainers post prices only as images or Instagram posts. Text inside images may not be read by AI, so write it in the page body too. See [AI search for pricing pages](/guide/pricing-page-ai-search/) for pricing in general and [AI search for lesson studios](/guide/lesson-studio-ai-search/) for class-based businesses.",
          ],
        },
        {
          heading: "Structured data: there is no dog training type, so use LocalBusiness and Service",
          paragraphs: [
            `schema.org has no type for dog trainers or training classes (checked in schema-dts 2.1.0 on November 23, 2026). Use [LocalBusiness](${SRC.localBusiness}) and describe what you do in the description and in your services. If you only visit clients, still give your business address, phone and hours, and write the areas you cover in the description and the page.`,
            `[Course](${SRC.course}) describes courses at schools and similar providers, and could make your class read as a course for people, so we do not recommend it here. Publish each offer, such as \"In-home training, 60 minutes\" or \"Puppy class, 4 weeks\", as a Service, with the place, typical number of sessions and anything owners should tell you first in the description. With Nurevo AEO, it looks like this (values are examples).`,
          ],
          code: SCHEMA_EN,
          after: [
            "Only put facts in structured data that are visible on the page. Google says no special schema.org markup is needed for AI Overviews or AI Mode. [Google: AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "Setting it up on a WordPress site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Your SEO plugin, such as Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK or VK All in One Expansion Unit, keeps working (structured data is not duplicated).`,
            "In the setup wizard, choose \"Other\". Once you enter an address, phone number or hours, the plugin publishes LocalBusiness. Do not choose \"Beauty salon\" or \"Clinic or dental\".",
            "In the business description, write how you train (in-home, classes, board-and-train), the towns you travel to by name, and in Japan the category and registration number. Nurevo AEO has no dedicated service-area field, so write the areas as text in the description and on the page.",
            "Add each offer as a service (up to 20). Put the format and length in the name (for example \"In-home training, 60 minutes\"), the price as a number, the currency, the booking URL, and the place, typical sessions and conditions in the description. Each is published as a service with a price and a booking action, and gets its own line in llms.txt.",
            "Enter FAQs (how many sessions, travel area, dogs that bite, vaccination rules, rain, cancellations) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your prices page or similar. See [AI search for FAQ pages](/guide/faq-page-ai-search/).",
            "Open /llms.txt and check that your price, area, profile (registration display) and booking pages are listed. Run the check on the AEO score screen and fix what is missing.",
          ],
          after: [
            "On a site that is not WordPress, check the same things. The [free check](/check), with no sign-up, shows the state of your structured data, llms.txt and AI crawler access. See [AI search for booking pages](/guide/booking-page-ai-search/) for booking pages.",
          ],
        },
        {
          heading: "Keep Instagram, directories and Google Business Profile in step",
          paragraphs: [
            "Many trainers find clients through Instagram videos and service directories. AI reads those too, so if prices or areas differ between your site and a directory, or old posts still say \"fixed in one session\", old information can keep appearing in answers after you fix the site.",
            "Keep prices, areas, working days and which dogs you take the same on your site, directories and Google Business Profile. In Japan, Tokyo's guidance applies the registration display to advertising, so adding it to your Instagram profile and directory listings is the safe choice. A visit-only trainer can set up a Google Business Profile with a service area and no public address. [Google Business Profile Help: service areas](" + SRC.gbpArea + ") When you change prices or renew a registration, update everything on the same day.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "How you train (in-home, classes, board-and-train, online) is written as text.",
            "The towns you travel to and the travel fee rules are written.",
            "The problems you work on, and the ones you do not, are written.",
            "Which dogs you take (size, age, dogs that have bitten) is written.",
            "Session length, price, packages and cancellation fees are written.",
            "The usual number of sessions is given with \"not a guarantee\", and there is no \"guaranteed fix\" or unsourced success rate.",
            "In Japan, the registration display (name, address, category, number, date, expiry, manager) is on every page or the profile page as text.",
            "The structured data type is LocalBusiness, not Course or VeterinaryCare.",
            "Prices, areas and registration details match across your site, directories, Google Business Profile and Instagram.",
            "llms.txt lists your price, area, profile and booking pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI shows you, and whether it is right",
          paragraphs: [
            "Once the pages are in order, ask AI what owners would ask. Check whether you are named for local, problem-based questions such as \"in-home dog trainer [city]\", \"puppy class near [station]\" or \"large dog pulling on lead trainer [district]\", and also ask with your name, such as \"Do they travel to [district]?\" or \"How much is a session?\", and record whether the answers match your site. If AI lists areas you do not cover or quotes old prices, look for old information on directories or old posts.",
            "AI answers change between runs, so ask the same questions several times, spread over time. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a dog trainer start with AI search?", a: "Write how you train (in-home, classes, board-and-train), the towns you travel to, the problems and dogs you take, and your price and usual number of sessions as text on your pages, and (in Japan) put the animal business registration display in your footer or profile page. Then publish the same facts as LocalBusiness and Service structured data and in llms.txt, and make them match your directory listings and Google Business Profile." },
        { q: "Does a visit-only trainer in Japan need to register?", a: "The Ministry of the Environment lists visiting trainers as an example of a training business and says businesses without their own animal facilities are still covered. Tokyo's guidance says the category includes visiting. Check details, such as group classes or online-only advice, with your local office." },
        { q: "Can I say how many sessions it takes?", a: "Results vary by dog and household, so avoid promises. Write the usual number with a caveat, such as \"for barking, most owners book 3 to 6 sessions (not a guarantee)\". AI is then more likely to mention you with the right conditions." },
        { q: "How do I make my service area clear to AI?", a: "List the towns or districts by name as text and say where a travel fee applies and how much. A map image alone may not be read. Nurevo AEO has no dedicated service-area field, so write the same areas in the business description and in each service description." },
        { q: "Which structured data type should a dog trainer use?", a: "schema.org has no dog trainer type, so use LocalBusiness and publish your offers as Services. Do not use Course (courses for people) or VeterinaryCare (veterinary clinics)." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends me?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your prices and services for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Google and Gemini of Google LLC, and Instagram of Meta Platforms, Inc. Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
