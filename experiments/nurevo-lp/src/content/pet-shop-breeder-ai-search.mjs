// Content page: AI search (AEO) for pet shops and breeders (ペットショップ・
// ブリーダー, mainly dogs and cats). Industry page. Angle: the sale itself
// cannot be closed online in Japan (現物確認・対面説明 at the premises), so the
// site's job is to give AI correct facts about registration, breed and puppy
// details, the total price, hand-over age, microchips and the viewing
// process — and to stop AI from saying "you can buy online". Separate from
// pet-salon-grooming-ai-search (保管), dog-training-ai-search (訓練) and the
// unmerged animal hospital article (PR #84).
//
// Written 2026-11-28 17時 (JST). Nurevo AEO facts come from the plugin source
// and readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2):
// setup wizard "Retail shop"（小売店）card sets Store, family includes PetStore
// (includes/setup-wizard.php l.386-390); "Other" publishes LocalBusiness;
// free-text 業種（schema.org型）; services up to 20 as Service + Offer +
// ReserveAction and llms.txt lines; per-page settings: leave a page out of
// llms.txt / publish no Nurevo structured data / page-only FAQ (readme l.137);
// WooCommerce products reach llms.txt (readme l.303); FAQ block /
// [nurevo_faq]; monthly free check (three questions to Perplexity, never the
// business name); Pro measurement (beta) on Perplexity. 0.9.1+ coexists with
// SEO SIMPLE PACK / VK All in One Expansion Unit. Prices: Free 0, Standard
// 3,000 JPY / USD 20, Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-28):
// - 環境省 trader.html (no date): 販売 covers selling animals and breeding or
//   import/export for that purpose (definition quoted on the page), examples
//   include 「販売目的の繁殖または輸入を行う者」; 犬猫等販売業者 has extra
//   duties; 現物確認と対面説明（文書・電磁的記録）at the 事業所; 「例えばインター
//   ネット上のみで売買契約を成立させることは禁止されています」; B2B excepted;
//   56日齢以下の販売制限; 帳簿5年; unregistered business: 100万円以下の罰金.
// - 環境省 list_18.html (no date): the 18 items (quoted in sections below).
// - 東京都 販売業 page (更新 2022-03-23): 18項目を対面で文書等を用いて説明;
//   「カメラ等を使用した映像等による確認方法は、現物確認として認められません」;
//   own website ads must carry 登録情報; 56日 ban on sale, 引渡し, 展示 with an
//   exception for showing with parents/siblings; microchip from 2022-06-01.
// - 東京都 改正動物愛護管理法 (更新 2022-03-23): 公布 2019-06-19; 56日 rule and
//   遵守基準 from 2021-06-01; microchip from 2022-06-01; 販売場所を事業所に限定.
// - 環境省 chip.html (no date): microchip duty for dogs/cats sold by breeders
//   and pet shops from 令和4年6月1日; buyer does 変更登録; transfer must come
//   with the 登録証明書; online 変更登録 400円.
// - 広島県 遵守事項 (掲載 2025-01-10): 8 ad items, 「HPやSNS等も対象」.
// - 財務省 総額表示 guideline PDF (also used in restaurant-ai-search).
// - schema-dts 2.1.0 (checked 2026-11-23 for pet-salon): PetStore is a
//   LocalBusiness/Store subtype ("A pet store.").
// - UK: gov.uk dog breeding licence (published 2020-11-04, metadata update
//   2026-08-26): 3+ litters in 12 months and sell any, or business; display
//   licence number in any advertising. SI 2018/486 Sch 6 para 1: adverts must
//   include licence number, issuing local authority, recognisable photo, age;
//   buyer told age, sex, vet record; no sale under 8 weeks; shown with
//   biological mother. Statutory guidance (updated 2026-06-01 in body):
//   licence holder name + number prominently on any website (Part A 1.2).
// - US: AVMA JAVMA News (2013-10-02): APHIS retail pet store definition —
//   seller, buyer and animal physically present; sight-unseen sellers must be
//   licensed and inspected.
// - eMARKETER AI Visibility Index pet care Q3 2026: 1,140 ChatGPT
//   recommendations, brand-owned domains 56% of pet-care citations (July);
//   covers food/treats/litter only, not breeders.
// Top articles read 2026-11-28: サングローブ ペットショップのホームページ
// (2019-11-29, upd 2025-10-27), アシスト ブリーダー事例2本 (2024-09-06,
// 2024-09-09), お名前.com WEB学園 集客 (2026-06-22, upd 08-07), uravation
// トリミングサロン (2026-08-08, upd 09-05); Texta pet breeders (no date),
// Breeding Business (2018-01-31, upd 2023-05-09), Midwoofery (sales page),
// Wix breeder website (Nov 18, year not shown), American Breeder
// (2024-09-19, partly read), eMARKETER (Q3 2026). アシスト 20250221-3943
// failed; Breedpost URL returned its features page.
// Not verified, so not stated: Lucy's Law date (gov.uk page could not be
// read); whether a website listing of a puppy under 56 days counts as 展示
// (told to ask the local office); the APHIS four-breeding-female exemption;
// US state laws; 犬猫等健康安全計画 details; typical prices; share of buyers
// who use AI to find a breeder.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  env: "https://www.env.go.jp/nature/dobutsu/aigo/1_law/trader.html",
  env18: "https://www.env.go.jp/nature/dobutsu/aigo/pickup/list_18.html",
  envChip: "https://www.env.go.jp/nature/dobutsu/aigo/pickup/chip.html",
  tokyoSales: "https://www.hokeniryo.metro.tokyo.lg.jp/douso/dt_gyou/hannbai.html",
  tokyoLaw: "https://www.hokeniryo.metro.tokyo.lg.jp/douso/kaisei/kaiseiaigohou.html",
  hiroshima: "https://www.pref.hiroshima.lg.jp/soshiki/180/contents-daiissyujunsyu.html",
  mofSougaku: "https://www.mof.go.jp/tax_policy/summary/consumption/210107guideline_sougaku.pdf",
  petStore: "https://schema.org/PetStore",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  ukLicence: "https://www.gov.uk/guidance/dog-breeding-licence-england",
  ukSch6: "https://www.legislation.gov.uk/uksi/2018/486/schedule/6/paragraph/1/made",
  ukGuidance: "https://www.gov.uk/government/publications/animal-activities-licensing-guidance-for-local-authorities/dog-breeding-licensing-statutory-guidance-for-local-authorities",
  avma: "https://www.avma.org/javma-news/2013-10-15/usda-rule-expands-regulation-breeders-who-sell-online",
  emarketer: "https://www.emarketer.com/content/ai-visibility-index-pet-care-movers-leaders",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "PetStore",
      "@id": "https://example.jp/#organization",
      "name": "例ブリーダー（例）",
      "description": "柴犬とトイプードルの繁殖・販売をしています。子犬のお渡しは、犬舎での見学と対面でのご説明のあとで、生後56日を過ぎてからです。インターネットだけでのご契約はできません。第一種動物取扱業（販売）登録番号：◯◯第◯◯号。",
      "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯市◯◯町1-2-3" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Sa-Su 10:00-16:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "子犬の見学（予約制・無料）",
      "description": "犬舎で子犬と親犬をご覧いただき、品種の特徴・飼い方・健康の記録を書面でご説明します。所要時間は約60分です。ご契約は見学とご説明のあとです。",
      "category": "見学",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/visit" },
        "result": { "@type": "Reservation", "name": "子犬の見学" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "PetStore",
      "@id": "https://example.com/#organization",
      "name": "Example Shiba Breeder",
      "description": "We breed and sell Shiba Inu and Toy Poodles. Puppies go home after you have visited our kennel, met the puppy with its mother and received our care information in writing, and not before 8 weeks of age. We do not sell online or ship unseen. Licence number 000000, issued by Example Council.",
      "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Example St, Example Town" },
      "telephone": "+44-0000-000000",
      "url": "https://example.com/",
      "openingHours": "Sa-Su 10:00-16:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Puppy visit (by appointment, free)",
      "description": "Meet the puppies and their mother at our kennel. We go through the breed, care and the puppy's vet record with you in writing. About 60 minutes. Any sale happens only after the visit.",
      "category": "Visit",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/visit" },
        "result": { "@type": "Reservation", "name": "Puppy visit" }
      }
    }
  ]
}`;

export default {
  slug: "pet-shop-breeder-ai-search",
  targetQueries: [
    "dog breeder AI search optimization",
    "pet shop ChatGPT recommendation",
    "breeder website licence number advert",
    "ペットショップ AI検索対策",
    "ブリーダー LLMO ChatGPT 集客",
    "ブリーダー ホームページ 動物取扱業 表示",
  ],
  related: ["pet-salon-grooming-ai-search", "dog-training-ai-search", "pricing-page-ai-search", "booking-page-ai-search", "fix-business-listings-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "ペットショップ・ブリーダーのAI検索対策：登録表示と子犬情報 | Nurevo",
      description: "ペットショップ・ブリーダーのAI検索対策は、登録の表示、品種と子犬ごとの事実、総額、見学の流れを文字と構造化データで出し、ネットだけでは買えないことを正しく伝えること。法令の出典とWordPress手順つき。",
      h1: "ペットショップ・ブリーダーのAI検索対策：登録の表示、子犬の情報、見学と対面説明の流れをAIに正しく読ませる",
      lead: "ペットショップとブリーダーのAI検索対策（AEO）の中心は、AIに「◯◯県で柴犬のブリーダーは？」「子犬はネットで買える？」と聞かれたときに、店のサイトが正確な答えの材料になることです。そのために、第一種動物取扱業（販売）の登録の表示、品種ごとの特徴と子犬ごとの事実、税込の総額、引き渡しの時期、見学と対面説明の流れを、本文の文字と構造化データで出します。日本では、子犬・子猫をインターネットだけで売ることはできないので、「オンラインで購入できる」とAIに誤って答えさせない書き方も大切です。",
      intro: [
        "作成日：2026年11月28日（JST）。法律・行政の情報は、本文にリンクした環境省・東京都・広島県・財務省の資料で確認したものです。この記事は法的な助言ではありません。登録や広告の表示の細かい扱いは、管轄の都道府県・政令市の動物愛護の窓口に確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが店の事実を正しく読める状態をつくるもので、AIの回答に必ず表示されることや順位が上がることを保証するものではありません。トリミングやペットホテル（保管）は[トリミングサロンのAI検索対策](/guide/pet-salon-grooming-ai-search/)、しつけ教室（訓練）は[ドッグトレーナーのAI検索対策](/guide/dog-training-ai-search/)で扱っています。",
      ],
      sections: [
        {
          heading: "ペットショップ・ブリーダーについて、AIはどんな質問をされているか",
          paragraphs: [
            "子犬や子猫を迎えたい人の質問は、「いる子」「いくら」「いつ迎えられるか」「信頼できる相手か」に集まります。どれも、店のサイトに書かれていなければAIは答えられないか、ポータルサイトや古いSNSの投稿から推測して答えます。",
          ],
          table: {
            head: ["よくある質問の型", "質問の例", "AIが答えに必要な、店側の事実"],
            rows: [
              ["いる子と価格", "「◯◯市で柴犬の子犬がいるブリーダーは？いくら？」", "扱う品種、今いる子の一覧と更新日、税込の総額と含まれる費用"],
              ["見学", "「見学だけでもできる？予約はいる？」", "見学の予約方法、曜日と時間、所要時間、見学で見られるもの（親犬など）"],
              ["迎える時期", "「何か月から迎えられる？」", "引き渡しの時期（生後56日を過ぎてから）、予約金とその扱い"],
              ["買い方", "「ネットで買って送ってもらえる？」", "見学と対面説明のあとでの契約になること、遠方の人の受け渡し方法"],
              ["健康", "「ワクチンや健康の保証は？」", "ワクチン接種の状況、健康の記録、マイクロチップと登録、保証の条件"],
              ["信頼", "「ちゃんと登録しているところ？」", "第一種動物取扱業（販売）の登録番号と有効期間、動物取扱責任者、所在地"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            "2026年11月28日に、日本語と英語で「ペットショップ ホームページ 集客」「ブリーダー 集客」「dog breeder SEO」「pet breeders ChatGPT」などの上位記事を12本選び、10本を読みました（1本は取得できず、1本は別のページに転送）。日本語の記事は、店の思いや動画、SNSとGoogleマップの使い方が中心で、動物取扱業の広告の表示、ネットだけでは契約できないこと、構造化データ、WordPressでの手順、AIの答えの確かめ方を書いたものはありませんでした。ブリーダーの事例記事は、問い合わせが増えた数字が本人の申告によるものでした。",
            `英語の記事は、キーワード・被リンク・表示速度など従来のSEOの話か、ホームページ作成サービスや集客サービスの紹介が中心でした。AIでのおすすめを扱う記事は「口コミ50件以上」「星4.5以上」のような数字を出典なしで挙げていました。AIの回答を実際に数えた調査（[eMARKETER：AI Visibility Index（ペットケア）](${SRC.emarketer})、2026年第3四半期、ChatGPTのおすすめ1,140件）は、フード・おやつ・猫砂のブランドが対象で、ブリーダーやペットショップは含まれていません。この記事は、法令の一次情報、品種ページと子犬ページの分け方、構造化データのコード、WordPressの手順、確かめ方で、これらの抜けを埋めます。`,
          ],
        },
        {
          heading: "法律で決まっていること：販売業の登録・広告の表示・対面説明",
          paragraphs: [
            `日本では、動物愛護管理法により、動物の販売は第一種動物取扱業の「販売」にあたり、登録が必要です。環境省は、動物を売る業に加えて、売ることを目的に繁殖や輸出入を行う業も「販売」に含め、例に「販売目的の繁殖または輸入を行う者」を挙げています。つまり、自宅で繁殖して売るブリーダーも登録の対象です。犬や猫を扱う場合は「犬猫等販売業者」として、追加の義務があります。[環境省：動物取扱業の適正化](${SRC.env})`,
            "サイトの書き方に関わる決まりは、次の表のとおりです。",
          ],
          table: {
            head: ["決まり", "内容（出典の要点）", "サイトに書くこと"],
            rows: [
              ["広告の表示", "広告に、氏名または名称、事業所の名称と所在地、種別、登録番号、登録年月日、有効期間の末日、動物取扱責任者の氏名を表示する。「HPやSNS等も対象」（広島県）。自分で開設するウェブサイトで販売する動物を広告する場合も登録情報を載せる（東京都）", "8項目をフッターか「店舗情報」のページに文字で書く。Instagramのプロフィールにも"],
              ["現物確認と対面説明", "事業所で、動物を直接見せ、特徴や飼い方などを文書を使って対面で説明する。「インターネット上のみで売買契約を成立させることは禁止」（環境省）。カメラなどの映像での確認は現物確認として認められない（東京都）", "契約は見学と対面説明のあとであること。「オンライン購入」「全国発送」と書かない"],
              ["販売場所", "2019年の改正で、販売の場所が事業所に限定された（東京都）", "見学と契約の場所（事業所の住所）"],
              ["生後56日", "繁殖を行う犬猫等販売業者は、出生後56日を経過しない犬猫の販売、販売のための引渡し、展示ができない（2021年6月1日から。東京都）", "引き渡しの時期を「生後56日を過ぎてから」と書く。56日前の子をどう載せるかは管轄の窓口に確認"],
              ["マイクロチップ", "2022年6月1日から、ブリーダーやペットショップで販売される犬・猫はマイクロチップの装着が義務。譲渡は登録証明書とともに行い、飼い主が変更登録をする（環境省）", "装着と登録済みであること、引き渡し時に登録証明書を渡すこと、変更登録の方法"],
            ],
            caption: "出典：環境省「動物取扱業の適正化」「犬と猫のマイクロチップ情報登録」、東京都「第一種動物取扱業者（販売業）のみなさまへ」「改正動物愛護管理法について」（いずれも更新2022年3月23日）、広島県「第一種動物取扱業者の遵守事項」（掲載2025年1月10日）。自治体によって案内の書き方が異なるため、細部は管轄の窓口に確認してください。",
          },
          after: [
            `出典：[環境省：動物取扱業の適正化](${SRC.env})・[環境省：犬と猫のマイクロチップ情報登録](${SRC.envChip})・[東京都：第一種動物取扱業者（販売業）のみなさまへ](${SRC.tokyoSales})・[東京都：改正動物愛護管理法について](${SRC.tokyoLaw})・[広島県：第一種動物取扱業者の遵守事項](${SRC.hiroshima})`,
            "登録証の写真だけでは、AIや検索エンジンが文字として読めないことがあります。表示は文字で書き、更新で番号や有効期間が変わったら、サイト・SNS・ポータルサイトを同じ日に直します。",
          ],
        },
        {
          heading: "「ネットで買える」とAIに言わせない書き方",
          paragraphs: [
            "AIは、サイトの言葉をそのまま要約します。「オンラインで購入」「全国にお届け」「ビデオ通話で見学OK」のような言葉があると、「この店はネットで子犬を買える」と答えるおそれがあります。これは事実と違い、法律の決まりとも合いません。次のように、手順がはっきりわかる言葉に置き換えます。",
          ],
          table: {
            head: ["避けたい書き方", "置き換えの例", "理由"],
            rows: [
              ["オンラインで購入できます", "ご契約は、犬舎での見学と対面でのご説明のあとです", "インターネット上のみでの契約は禁止（環境省）"],
              ["全国発送・空輸でお届け", "遠方の方も、一度◯◯（事業所）にお越しいただきます", "販売の場所は事業所に限られる（東京都）"],
              ["ビデオ通話で見学OK", "写真・動画は事前の参考です。ご契約前に必ず実際にご覧いただきます", "映像は現物確認として認められない（東京都）"],
              ["生後40日からお渡し", "お渡しは生後56日を過ぎてからです", "56日を経過しない犬猫の引渡しは禁止"],
              ["健康を保証します（条件なし）", "◯日以内に獣医師が先天性の病気と診断した場合は◯◯します（条件は契約書のとおり）", "条件のない言葉は、AIが「無条件の保証」と要約しやすい"],
            ],
            caption: "置き換えの例の◯は、店の実際の条件を入れてください。",
          },
          after: [
            "WordPressのサイトでWooCommerceを使っている場合、子犬・子猫を「カートに入れる」商品として登録しないでください。カートと決済の画面は、ネットで売買が完結するように読めます。WooCommerceの商品はNurevo AEOのllms.txtにも載るため、AIに「ネットで買える」と伝わりやすくなります。予約金を受け付ける場合も、見学と対面説明のあとに店頭で行う流れにして、サイトでは「見学の予約」だけを受け付けます。",
          ],
        },
        {
          heading: "品種ページと子犬ページに分ける：対面説明の18項目の使い分け",
          paragraphs: [
            `環境省は、販売のときに対面で説明する18項目を示しています。[環境省：対面説明が必要な18項目](${SRC.env18}) サイトは対面説明の代わりにはなりませんが、この18項目は「飼い主が知りたいこと」そのものなので、AIが答えに使う材料としても役に立ちます。ポイントは、品種で決まることと、1頭ごとに違うことを別のページに書くことです。`,
          ],
          table: {
            head: ["ページ", "18項目のうち対応するもの", "書き方"],
            rows: [
              ["品種ページ（例：柴犬）", "1 品種の名称、2 成長したときの標準の体重・体長、3 平均寿命など、4 飼うのに合う施設の広さ、5 食事と水、6 運動と休養、7 人と動物の共通感染症と予防、8 不妊・去勢の方法と費用、10 関係する法令の決まり", "一般的な情報として書き、出典（犬種団体や獣医師の資料など）があれば添える。更新が少ないので、AIに長く使われる"],
              ["子犬・子猫のページ", "11 性別、12 生年月日、13 不妊・去勢をしているか、14 繁殖者の名前と登録番号（または所在地）、15 所有者の名前（自分の動物でない場合）、16 病歴とワクチン接種、17 親と同じ腹の子の遺伝性の病気", "1頭ごとに事実だけを書き、ページに更新日を入れる。お迎えが決まったら表示を変える"],
              ["見学・購入の流れのページ", "9 むやみに繁殖させないための措置、18 そのほか適切な飼い方に必要なこと", "見学から契約・引き渡しまでの順番、持ち物、マイクロチップの変更登録の方法"],
            ],
            caption: "番号は環境省の18項目の番号です。言葉は短くまとめています。正確な文言は環境省のページを見てください。",
          },
          after: [
            "子犬のページは、売れたあとも古い情報が残りがちです。お迎えが決まった子は、すぐに「ご家族が決まりました」と書き換えるか非公開にし、一覧ページの更新日を直します。残しておく場合は、Nurevo AEOのページごとの設定で「llms.txtから外す」を選ぶと、AIが読む一覧に売れた子が載らなくなります。1頭ごとの子犬は、在庫が数日で変わるため、構造化データ（ProductやOffer）にはしないほうが安全です。古い「在庫あり」がAIに使われるのを防げます。",
          ],
        },
        {
          heading: "価格は税込の総額で、何が含まれるかを書く",
          paragraphs: [
            `消費者に価格を示すときは、消費税を含めた総額で表示します（総額表示）。[財務省：総額表示の義務付け（ガイドライン）](${SRC.mofSougaku}) 子犬・子猫の価格は、生体の価格に、ワクチン、マイクロチップ、健康診断、血統書などの費用が別に加わる店もあります。AIは「柴犬の子犬は◯万円」と一つの数字で答えがちなので、ページには「お支払いの総額」と「含まれるもの・別にかかるもの」を並べて書きます。`,
            "例：「お支払いの総額 ◯◯万円（税込）。含まれるもの：ワクチン1回目、マイクロチップの装着と登録、健康診断。別にかかるもの：血統書の発行手数料◯円（希望される方）」。価格を変えたら、ポータルサイトの掲載も同じ日に直します。",
          ],
        },
        {
          heading: "構造化データ：店はPetStore、見学はServiceで出す",
          paragraphs: [
            `schema.orgの[PetStore](${SRC.petStore})は「ペットショップ」を表すLocalBusinessの下位の型です。繁殖専門のブリーダーを表す型はないので、ペットショップもブリーダーもPetStoreを使い、何をしているかは説明（description）に書くのが近い形です。説明には、扱う品種、見学と対面説明のあとに契約すること、引き渡しの時期、登録番号を入れます。`,
            "見学は、無料でも1つのサービス（Service）として出し、予約のURLをReserveActionで示します。これで、AIが「見学の予約はどこから？」に答えられます。値は例です。",
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データには、本文に見えている事実だけを入れます。Googleは、AI OverviewsやAI Modeのための特別なschema.orgのマークアップは必要ないとしています。[Google：AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "WordPressのペットショップ・ブリーダーのサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unit（0.9.1以降）などはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「小売店」を選び、設定画面の「業種（schema.org型）」にPetStoreと入れます。住所・電話番号・見学できる曜日と時間を入れます。",
            "店の説明に、扱う品種、「ご契約は見学と対面でのご説明のあと」「お渡しは生後56日を過ぎてから」、第一種動物取扱業（販売）の登録番号を入れます。",
            "サービスに「子犬の見学（予約制）」を登録し、料金に0、通貨にJPY、予約URL、説明に所要時間と見学で見られるものを入れます。サービスは最大20件で、llms.txtにも1行ずつ載ります。",
            "よくある質問（ネットで買えるか、何日から迎えられるか、遠方からの見学、予約金、マイクロチップの変更登録、健康の保証の条件）を入力し、見学・購入の流れのページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "お迎えが決まった子犬のページは、ブロックエディターのNurevo AEOパネルで「llms.txtから外す」を選ぶか、非公開にします。子犬をWooCommerceのカートの商品にはしません。",
            "/llms.txt を開き、品種ページ・見学と購入の流れ・店舗情報（登録の表示）・見学予約のページが載っていて、売れた子のページが載っていないことを確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。予約ページの書き方は[予約ページのAI検索対策](/guide/booking-page-ai-search/)、価格ページは[料金ページのAI検索対策](/guide/pricing-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "ポータルサイト・SNS・Googleビジネスプロフィールとそろえる",
          paragraphs: [
            "子犬・子猫は、ブリーダーの紹介サイトやペットのポータルサイト、Instagramで探されることが多く、AIもそれらを読みます。サイトでは「お迎えが決まりました」になっている子がポータルサイトでは掲載中のまま、価格が違う、登録番号が古い、といったずれがあると、AIが古い方の情報で答えることがあります。",
            "登録の表示、品種、価格の総額、見学の曜日と時間は、サイト・ポータルサイト・Googleビジネスプロフィール・Instagramで同じにし、子犬が売れたときと登録を更新したときは同じ日に全部を直します。東京都は、ブリーダーの紹介サイトに載せる場合も登録情報の表示が必要としています。掲載先の直し方は[ポータル・地図アプリの自社情報の直し方](/guide/fix-business-listings-ai-search/)にまとめています。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "第一種動物取扱業の表示（氏名または名称、事業所の名称と所在地、種別、登録番号、登録年月日、有効期間の末日、動物取扱責任者）が全ページか店舗情報のページに文字である。",
            "「オンライン購入」「全国発送」「ビデオ通話で見学OK」などの言葉がサイト・SNSに残っていない。",
            "契約は見学と対面説明のあと、引き渡しは生後56日を過ぎてから、と書かれている。",
            "品種ページに、体の大きさ・寿命・飼う環境・食事・運動・感染症・不妊去勢の費用などの一般的な情報がある。",
            "子犬・子猫のページに、性別・生年月日・ワクチン・繁殖者の登録番号などの事実と、更新日がある。",
            "価格は税込の総額で、含まれるもの・別にかかるものが書かれている。",
            "マイクロチップの装着と登録、登録証明書の受け渡し、変更登録の方法が書かれている。",
            "構造化データの型がPetStoreで、見学がServiceと予約URLで出ている。子犬1頭ごとをProduct・Offerにしていない。",
            "お迎えが決まった子のページが、非公開かllms.txtから外されている。",
            "サイト・ポータルサイト・Googleビジネスプロフィール・Instagramで、登録の表示・価格・見学の時間がそろっている。",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、迎えたい人が聞きそうな質問をAIに投げます。「◯◯県 柴犬 ブリーダー」「◯◯市 ペットショップ トイプードル」のような地域＋品種の質問で名前が出るかに加えて、店名を入れて「ネットで買える？」「何日から迎えられる？」「登録番号は？」と聞き、答えがサイトと合っているかを記録します。AIが「オンラインで購入できる」「全国発送」と答える場合は、サイト・ポータルサイト・古い投稿のどこかに古い言葉が残っていないかを探します。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（店の名前は含めません）をPerplexityに投げ、回答に店の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
          ],
        },
      ],
      faqs: [
        { q: "ペットショップ・ブリーダーのAI検索対策は、何から始めればいいですか？", a: "第一種動物取扱業（販売）の表示をフッターか店舗情報のページに文字で入れ、「契約は見学と対面説明のあと」「引き渡しは生後56日を過ぎてから」を店の説明に書くことからです。そのうえで、品種ページと子犬ページを分け、価格を税込の総額で書き、同じ事実をPetStoreとServiceの構造化データとllms.txtで公開します。" },
        { q: "ブリーダーも動物取扱業の登録が必要ですか？", a: "環境省は、第一種動物取扱業の「販売」の例に「販売目的の繁殖または輸入を行う者」を挙げています。販売のために繁殖するブリーダーは登録の対象で、広告（ホームページやSNSを含む）に登録番号などを表示します。細かい扱いは管轄の自治体に確認してください。" },
        { q: "子犬をネットで販売してもいいですか？", a: "日本では、事業所で動物を直接見せ（現物確認）、文書を使って対面で説明（対面説明）する必要があり、環境省は「インターネット上のみで売買契約を成立させることは禁止」としています。東京都は、カメラなどの映像での確認は現物確認として認められないとしています。サイトでは子犬の紹介と見学の予約までにします。" },
        { q: "生後56日前の子犬をサイトに載せてもいいですか？", a: "繁殖を行う犬猫等販売業者は、出生後56日を経過しない犬猫の販売、販売のための引渡し、展示ができません（東京都の案内）。サイトへの掲載がどう扱われるかは、管轄の動物愛護の窓口に確認してください。どの場合も、引き渡しの時期は「生後56日を過ぎてから」と書きます。" },
        { q: "子犬1頭ごとに構造化データを付けたほうがいいですか？", a: "おすすめしません。子犬は数日でお迎えが決まり、ProductやOfferの「在庫あり」が古いままAIに使われるおそれがあるからです。店はPetStore、見学はServiceで出し、子犬のページは本文に事実と更新日を書きます。売れた子のページは非公開にするか、llms.txtから外します。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・サービス・FAQの構造化データ、llms.txt、ページごとの設定、AIクローラ設定、AEOスコア、月1回の無料のAIチェックは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに店が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが店の事実を正しく読める状態をつくり、出ているか・正しく答えているかを続けて確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが店のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで店の情報と見学予約を無料で公開できます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLC、InstagramはMeta Platforms, Inc.の商標です。WordPressはWordPress Foundation、WooCommerceはAutomatticの商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、EMARKETERは、それぞれの権利者の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Pet Shops and Breeders: Licences, Puppies | Nurevo",
      description: "How pet shops and breeders get AI to answer right: licence details, breed and puppy facts, total price, hand-over age and visit-first sales, with WordPress steps.",
      h1: "AI search for pet shops and breeders: get your licence details, puppy facts and visit-first process right in AI answers",
      lead: "For a pet shop or breeder, AI search optimisation (AEO) means that when someone asks an AI \"Which Shiba Inu breeders are near me?\" or \"Can I buy a puppy online?\", your own site supplies the correct facts. Put your licence or registration details, breed facts and per-puppy facts, the total price, the hand-over age and how viewing works into plain text on the page and into structured data. In Japan a sale must follow an in-person viewing, England sets rules on how puppies are advertised and shown, and in the United States sight-unseen sellers need a federal licence, so it also matters that AI does not describe you as selling puppies online when you do not.",
      intro: [
        "Written November 28, 2026 (JST). Legal and regulatory facts come from the government pages linked in the text (Japan's Ministry of the Environment and the Tokyo and Hiroshima governments, GOV.UK and legislation.gov.uk) and, for the United States, from the AVMA's report on the 2013 USDA rule. This article is not legal advice; check the details with your licensing authority.",
        "AI answers change by the day and by how a question is asked. The steps below make your facts readable to AI. They do not guarantee that you will appear in an answer or rank higher. Grooming and boarding are covered in [AI search for pet grooming salons](/guide/pet-salon-grooming-ai-search/), and training in [AI search for dog trainers](/guide/dog-training-ai-search/).",
      ],
      sections: [
        {
          heading: "What people ask AI about pet shops and breeders",
          paragraphs: [
            "People looking for a puppy or kitten ask about four things: which animals are available, what it costs, when they can take one home, and whether the seller can be trusted. If your site does not state these facts, AI either cannot answer or guesses from listing sites and old social posts.",
          ],
          table: {
            head: ["Question type", "Example", "Facts AI needs from you"],
            rows: [
              ["Availability and price", "\"Shiba Inu breeders near Leeds with puppies now — how much?\"", "Breeds you keep, current puppies with an updated date, total price and what it includes"],
              ["Visiting", "\"Can I just visit? Do I need to book?\"", "How to book, days and times, how long a visit takes, what you will see (the mother, for example)"],
              ["Hand-over age", "\"How old are puppies when they go home?\"", "The age you hand over at, and how deposits work"],
              ["Buying process", "\"Can I buy online and have the puppy delivered?\"", "That any sale follows a visit; how buyers from far away collect"],
              ["Health", "\"Are puppies vaccinated? Is there a health guarantee?\"", "Vaccinations, vet record, microchip and registration, the terms of any guarantee"],
              ["Trust", "\"Is this breeder licensed?\"", "Licence or registration number, who issued it and when it expires, your address"],
            ],
            caption: "The example questions illustrate the point. They are not measured question frequencies.",
          },
        },
        {
          heading: "What the top-ranking guides leave out",
          paragraphs: [
            "On November 28, 2026 we picked twelve top results in English and Japanese for searches such as \"dog breeder SEO\", \"pet breeders ChatGPT\" and their Japanese equivalents, and read ten (one failed and one redirected elsewhere). The English guides are mostly classic SEO (keywords, backlinks, page speed) or promote a website builder or marketing service. The one guide aimed at AI recommendations gives figures such as \"at least 50 reviews\" and \"4.5 stars\" without any source. None set out what the law says a breeder's advert must show, none show structured data code or WordPress steps, and none explain how to check what AI says about you.",
            `The only study we found that actually counted AI answers in pet care ([EMARKETER: AI Visibility Index, pet care](${SRC.emarketer}), Q3 2026, 1,140 ChatGPT recommendations) covers food, treats and litter brands, not breeders or pet shops. This guide fills the gaps with primary legal sources, a split between breed pages and puppy pages, schema code, WordPress steps and a checking routine.`,
          ],
        },
        {
          heading: "The rules that shape what your site should say",
          paragraphs: [
            "Three jurisdictions illustrate the pattern. Each has more rules than these; the table lists only the ones that change how you write your website.",
          ],
          table: {
            head: ["Where", "Rule (summary of the source)", "What to put on your site"],
            rows: [
              ["England", "You need a licence if you breed 3 or more litters in any 12-month period and sell any of the puppies, or run a business that breeds and advertises dogs for sale. Any advert for a dog must include the licence number, the local authority that issued it, a recognisable photo of the dog and its age. No puppy under 8 weeks may be sold; a puppy may only be shown to a buyer together with its biological mother. The buyer must be told the dog's age, sex and veterinary record. The statutory guidance asks for the licence holder's name and licence number to be shown clearly on any website used for the activity.", "Licence number and issuing council on every page and every puppy listing; a real photo and age for each puppy; \"puppies go home at 8 weeks or older\"; \"you will meet the puppy with its mother\""],
              ["Japan", "Breeding for sale is registered animal-handling business (\"sales\"). Adverts, including websites and social media, show the operator's name, premises name and address, business type, registration number, registration date, expiry date and the responsible person. The seller must show the animal in person and explain 18 items face to face with a document at the premises; a contract made only online is prohibited, and video does not count as seeing the animal (Tokyo). Breeders may not sell, hand over or display dogs and cats under 56 days old. Since June 1, 2022 dogs and cats sold by breeders and pet shops must be microchipped.", "All registration items in text; \"contracts are made after a visit and an in-person explanation\"; \"puppies go home after 56 days\"; microchip and how the new owner updates the registration"],
              ["United States (federal)", "Under the 2013 USDA rule, a \"retail pet store\" is a place where seller, buyer and animal are physically present, so the buyer can personally observe the animal. Sellers who sell sight unseen, such as over the internet, must be licensed and inspected by USDA APHIS. State and local laws add their own rules.", "Whether buyers visit before buying; if you do ship, your USDA licence status. Check state law separately"],
            ],
            caption: "Sources: England — GOV.UK dog breeding licence guidance, SI 2018/486 Schedule 6 paragraph 1, and the dog breeding statutory guidance for local authorities. Japan — Ministry of the Environment, Tokyo and Hiroshima pages. United States — AVMA (JAVMA News, October 2013). Scotland, Wales, Northern Ireland and other countries have their own rules.",
          },
          after: [
            `Sources: [GOV.UK: Dog breeding licence (England)](${SRC.ukLicence}) · [SI 2018/486, Schedule 6, paragraph 1](${SRC.ukSch6}) · [GOV.UK: Dog breeding statutory guidance](${SRC.ukGuidance}) · [Japan Ministry of the Environment: animal handling business](${SRC.env}) · [Ministry of the Environment: microchips](${SRC.envChip}) · [Tokyo: sales businesses](${SRC.tokyoSales}) · [Hiroshima: business obligations](${SRC.hiroshima}) · [AVMA: USDA rule on online sales](${SRC.avma})`,
            "Write these details as text. A photo of your licence certificate may not be readable as text to AI or search engines. When your licence is renewed and the number or expiry date changes, update your site, social profiles and listing sites on the same day.",
          ],
        },
        {
          heading: "Wording that stops AI saying \"buy online\"",
          paragraphs: [
            "AI summarises the words it finds. Phrases such as \"buy online\", \"nationwide delivery\" or \"video viewing available\" can lead it to tell people you sell puppies online — which may be untrue and, depending on where you are, may also conflict with the rules above. Replace them with wording that states the process.",
          ],
          table: {
            head: ["Avoid", "Write instead", "Why"],
            rows: [
              ["Buy your puppy online", "Puppies are sold after you visit us and we go through their care with you", "Online-only sale is prohibited in Japan; USDA licensing applies to sight-unseen sales in the US"],
              ["We deliver nationwide", "Families from further away visit us once to meet the puppy", "Japan limits sales to the seller's premises; in the US, sight-unseen sellers need a USDA licence"],
              ["Video viewings available", "Photos and videos help you choose; you will always meet the puppy before buying", "Video does not count as seeing the animal in Japan; England requires showing the puppy with its mother"],
              ["Puppies ready from 6 weeks", "Puppies go home at 8 weeks or older", "England: no sale under 8 weeks. Japan: 56 days"],
              ["Fully health guaranteed", "If a vet diagnoses a congenital condition within [N] days, we will [remedy] (see the contract)", "Unconditional words get summarised as an unconditional guarantee"],
            ],
            caption: "Replace the bracketed parts with your actual terms.",
          },
          after: [
            "If your WordPress site runs WooCommerce, do not list puppies or kittens as products with an add-to-cart button. A cart and checkout read as an online sale, and WooCommerce products also appear in the llms.txt that Nurevo AEO builds, which makes the message even stronger for AI. On the site, take bookings for visits only.",
          ],
        },
        {
          heading: "Split breed pages from puppy pages",
          paragraphs: [
            `Japan's list of the 18 items a seller must explain in person is a useful map of what buyers want to know. [Ministry of the Environment: the 18 items](${SRC.env18}) Your website does not replace that conversation, but the same facts help AI answer questions. Put the facts that belong to the breed on one page and the facts that belong to one animal on another.`,
          ],
          table: {
            head: ["Page", "Facts (from the Japanese list; similar to what buyers ask elsewhere)", "How to write it"],
            rows: [
              ["Breed page (for example, Shiba Inu)", "Breed name, adult weight and size, typical lifespan, space and housing, feeding and water, exercise and rest, common diseases shared with people and how to prevent them, neutering methods and cost, relevant laws", "General information, with a source (breed club or veterinary material) where you have one. It rarely changes, so AI can use it for a long time"],
              ["Puppy or kitten page", "Sex, date of birth, whether neutered, breeder's name and registration number, owner (if not yours), medical and vaccination history, inherited conditions in the parents and litter", "Facts only, with an updated date. Change the page as soon as the animal is reserved"],
              ["Visit and buying page", "Steps to prevent unplanned breeding, anything else needed for proper care", "The order from visit to hand-over, what to bring, how microchip registration changes to the new owner"],
            ],
            caption: "Items are shortened from the Ministry of the Environment's list. In England, adverts also need a recognisable photo and the age of the dog.",
          },
          after: [
            "Puppy pages go out of date fast. When a puppy is reserved, mark it as \"reserved\" or unpublish it and update the date on the listing page. If you keep the page, use Nurevo AEO's per-page setting to leave it out of llms.txt so AI's reading list does not include animals that are gone. Because availability changes within days, it is safer not to mark up individual puppies as Product or Offer; that avoids an old \"in stock\" being used in an answer.",
          ],
        },
        {
          heading: "State the total price and what it includes",
          paragraphs: [
            "AI tends to answer \"Shiba puppies cost X\" with a single number. Some sellers add vaccinations, microchipping, a vet check or pedigree papers on top of the puppy's price. State the total you charge and list what is included and what costs extra, for example: \"Total price [amount] including tax. Includes first vaccination, microchip and registration, vet check. Extra: pedigree papers [amount], if you want them.\" In Japan, prices shown to consumers must include consumption tax. When you change a price, change it on listing sites the same day.",
          ],
        },
        {
          heading: "Structured data: PetStore for the business, Service for visits",
          paragraphs: [
            `schema.org's [PetStore](${SRC.petStore}) (\"A pet store\") is a LocalBusiness subtype. There is no separate type for breeders, so both shops and breeders can use PetStore and say what they do in the description: breeds, visit-first sales, hand-over age and licence number.`,
            "Publish the visit as a Service, even if it is free, with a ReserveAction pointing to your booking page. AI can then answer \"How do I book a visit?\". Values below are examples.",
          ],
          code: SCHEMA_EN,
          after: [
            "Only mark up facts that are visible on the page. Google says no special schema.org markup is needed for AI Overviews or AI Mode. [Google: AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "Setting it up on a WordPress pet shop or breeder site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit (from 0.9.1) keep working; structured data is not duplicated.`,
            "In the setup wizard choose \"Retail shop\", then enter PetStore in the business type (schema.org type) field. Add your address, phone and visiting days and hours.",
            "In the business description, name your breeds and write \"sold after a visit\", your hand-over age and your licence or registration number.",
            "Add a service \"Puppy visit (by appointment)\" with price 0, your currency, the booking URL and a description of how long it takes and what you will see. You can add up to 20 services; each also gets a line in llms.txt.",
            "Add FAQs (can I buy online, how old are puppies at hand-over, visiting from far away, deposits, microchip registration, guarantee terms) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your visit and buying page.",
            "For reserved puppies, open the Nurevo AEO panel in the block editor and leave the page out of llms.txt, or unpublish it. Do not sell puppies as WooCommerce cart products.",
            "Open /llms.txt and check that breed pages, the buying process, your business details and the visit booking page are listed and reserved puppies are not. Run the diagnosis on the AEO score screen and fix what is missing.",
          ],
          after: [
            "The same checks apply to sites not on WordPress. Enter your URL in the [free check](/check), no sign-up required, to see your structured data, llms.txt and AI crawler access. For booking and price pages, see [AI search for booking pages](/guide/booking-page-ai-search/) and [AI search for pricing pages](/guide/pricing-page-ai-search/).",
          ],
        },
        {
          heading: "Keep listing sites, social media and Google Business Profile in step",
          paragraphs: [
            "Puppies are often found through breeder directories, pet classifieds and Instagram, and AI reads those too. If a puppy is reserved on your site but still listed elsewhere, or the price or licence number differs, AI may answer from the older source.",
            "Keep licence details, breeds, total price and visiting hours the same on your site, listing sites, Google Business Profile and Instagram, and update all of them on the day a puppy is reserved or your licence is renewed. For how to correct listings, see [fixing your business details on listing sites and maps](/guide/fix-business-listings-ai-search/).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Licence or registration details are in text on every page or on a business details page linked from every page.",
            "No \"buy online\", \"nationwide delivery\" or \"video viewing\" wording remains on the site or social profiles (unless it is accurate and lawful where you are).",
            "The site says any sale follows a visit and states the hand-over age (8 weeks in England, after 56 days in Japan).",
            "Breed pages cover adult size, lifespan, housing, feeding, exercise, health and neutering cost.",
            "Puppy pages show sex, date of birth, vaccinations, breeder registration, a real photo and age, and an updated date.",
            "The price is a total, with what is included and what costs extra.",
            "Microchipping and how registration passes to the new owner are explained.",
            "Structured data uses PetStore and a Service with a booking URL; individual puppies are not marked up as Product or Offer.",
            "Reserved puppies are unpublished or left out of llms.txt.",
            "Licence details, prices and visiting hours match across your site, listing sites, Google Business Profile and Instagram.",
          ],
        },
        {
          heading: "Check whether AI shows you, and whether it is right",
          paragraphs: [
            "Once the facts are in place, ask AI the questions buyers ask. Try area-plus-breed questions such as \"Shiba Inu breeder in [county]\" to see whether you appear, then ask with your name: \"Can I buy a puppy online from [name]?\", \"How old are their puppies at hand-over?\", \"Are they licensed?\". Record whether the answers match your site. If AI says you sell online or deliver nationwide, look for old wording on your site, listing sites or old posts.",
            "AI answers vary between runs, so ask the same questions several times over a few weeks. With Nurevo AEO, the Free and Standard plans run a monthly check: three questions built from your business type and area (never your business name) are sent to Perplexity, and the plugin records whether your name or site appears. The Pro plan (from USD 99 a month) adds beta AI visibility measurement with competitor comparison and trends (Perplexity at present). Both look at samples of answers, not every answer. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a pet shop or breeder start with AI search optimisation?", a: "Put your licence or registration details in text on every page and write in your business description that sales follow a visit and what age puppies go home. Then split breed pages from puppy pages, state the total price, and publish the same facts as PetStore and Service structured data and in llms.txt." },
        { q: "Do breeders need a licence?", a: "In England, you need one if you breed 3 or more litters in any 12-month period and sell any of the puppies, or run a business that breeds and advertises dogs for sale, and every advert must show the licence number and issuing council. In Japan, breeding for sale counts as a registered sales business. In the US, federal USDA licensing applies to sight-unseen sales, and states add their own rules. Check with your local authority." },
        { q: "Can I sell puppies online?", a: "It depends on where you are. In Japan a contract made only online is prohibited and the animal must be seen in person. In England a puppy may only be shown to a buyer with its biological mother. In the US, selling sight unseen requires a USDA licence, and state law may add more. In all cases, write your actual process clearly so AI does not describe it wrongly." },
        { q: "Should I add structured data for each puppy?", a: "We do not recommend it. Puppies are reserved within days, and an old Product or Offer marked in stock can be used by AI after the puppy is gone. Use PetStore for the business and Service for visits, and keep puppy facts in the page text with an updated date." },
        { q: "What must a breeder's advert show in England?", a: "Under Schedule 6 of SI 2018/486, any advert for the sale of a dog must include the licence number, the local authority that issued the licence, a recognisable photograph of the dog and the dog's age. The statutory guidance also asks for the licence holder's name and number to be shown clearly on any website used for the activity." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business, service and FAQ structured data, llms.txt, per-page settings, AI crawler settings, the AEO score and a free monthly AI check are all in the free plan. Paid plans add the always-current ruleset (Standard, USD 20 a month) and beta AI visibility measurement (Pro, from USD 99 a month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee that ChatGPT recommends us?", a: "No. AI answers vary, and no tool or method can guarantee appearance or position. What you can do is make your facts easy for AI to read correctly and keep checking whether you appear and whether the answer is right." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your business details and visit booking for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Google of Google LLC, and Instagram of Meta Platforms, Inc. WordPress is a trademark of the WordPress Foundation and WooCommerce of Automattic. Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and EMARKETER are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies. This article is not legal advice.",
    },
  },
};
