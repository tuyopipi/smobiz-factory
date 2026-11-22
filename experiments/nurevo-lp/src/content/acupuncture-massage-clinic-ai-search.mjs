// Content page: AI search (AEO) for licensed acupuncture, moxibustion and
// massage clinics in Japan (鍼灸院・はり灸院・マッサージ院・指圧院, run by
// あん摩マッサージ指圧師・はり師・きゅう師). Industry page. Angle: unlike
// unlicensed bodywork (seitai-relaxation-salon-ai-search), these practitioners
// hold national licences and are bound by あはき法 第7条 and the 2025-02-18
// あはき・柔整広告ガイドライン. The guideline treats a clinic's own website as
// in principle not 広告, but SNS posts, search ads, portal/紹介 pages and paid
// review sites can be; and it still lists what a website should and should not
// carry (Ⅵ-3, Ⅵ-4). Those website items are exactly the facts AI needs.
//
// Written 2026-11-22 11時 (JST). Nurevo AEO facts come from the plugin source and
// readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2): the
// setup wizard "Clinic or dental" card sets MedicalBusiness and keeps the family
// MedicalBusiness / Dentist / Physician / Hospital / VeterinaryCare; the "Beauty
// salon" card sets BeautySalon (family includes HealthAndBeautyBusiness)
// (includes/setup-wizard.php); free-text "Business type (schema.org type)"
// field; services (up to 20) published as Service + Offer + ReserveAction and
// an llms.txt line; FAQ block / [nurevo_faq]; per-page llms.txt exclusion;
// monthly free check with three questions to Perplexity (never the business
// name); Pro measurement (beta) on Perplexity. Prices: Free 0, Standard 3,000
// JPY / USD 20, Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-22):
// - あはき・柔整広告ガイドライン, 医政発0218第1号, 2025-02-18 (令和7年), 厚生労働省
//   医政局長, 技術的助言 (copy hosted by 荒川区, read in full): three tests
//   誘引性・特定性・認知性; Ⅱ-6(6) websites "引き続き原則として広告とは見なさない",
//   but banner ads and SNS posts are 広告 when all three tests are met; Ⅵ-1(1)
//   sponsored/paid search results, listing ads, 施術所紹介サイトの紹介ページ and
//   paid 口コミサイト/rankings are 広告; Ⅵ-3 自費 clinics' websites should carry
//   問い合わせ先, 施術内容と通常必要とされる費用 (range min–max if no standard
//   fee; prepaid tickets' terms), 主なリスク・副作用 (with 標準的な費用や施術期間・
//   回数), not hidden in tiny text; Ⅵ-4 websites should not carry 虚偽 (絶対安全,
//   治ります, 根本治療, 加工した前後写真, ○%の満足度, 改善率), 比較優良 (日本一,
//   No.1, 口コミサイトで1位, 著名人), paying/asking for comments on web mapping
//   services, cherry-picked testimonials, 費用の安さの過度な強調, 不安をあおる;
//   Ⅲ-2(2)/Ⅲ-4(2) 療養費 wording incl. "医療保険により利用者は施術費用の一部負担で
//   施術を受けることができます" (with doctor's consent stated); 各種保険取扱い・
//   労災保険取扱い・自賠責保険取扱い・交通事故取扱い not allowed; names: 診療所,
//   クリニック, メディカル, リハビリ etc. not allowed in ads, "○○鍼灸治療院" allowed;
//   国家資格保有 allowed, 民間資格 not; 整骨院 name left undecided. Comment period
//   2024-08-30 to 09-28, 72 comments.
// - MHLW slide 001412682.pdf (2025-02-18): summary; 検討会 2018-05-10 to
//   2024-07-12 (11 meetings).
// - あはき法 第7条 (quoted in the guideline): 施術者である旨・氏名・住所, 業務の種類,
//   施術所の名称・電話番号・所在, 施術日又は施術時間, 大臣が指定する事項; 第2項 no
//   技能・施術方法・経歴. 告示 (平成11年厚生省告示第69号): もみりょうじ, やいと・えつ,
//   小児鍼, 届出をした旨, 療養費支給申請ができる旨 (医師の同意が必要な旨を明示),
//   予約, 休日・夜間, 出張, 駐車設備.
// - MHLW 支給基準及び同意書の在り方 (2026-04-30, 001696854.pdf) and 東北厚生局
//   slides (000502582.pdf, 2026): はり・きゅう療養費 six diseases (神経痛・
//   リウマチ・頸腕症候群・五十肩・腰痛症・頸椎捻挫後遺症) and other chronic pain
//   judged by the insurer; consent from the doctor actually treating, after an
//   examination, not via online consultation; 6 months; not combined with
//   insurance-covered medical treatment of the same condition; マッサージ for
//   筋麻痺・筋萎縮・関節拘縮等, not 疲労回復・慰安・予防; 一部負担金 cannot be waived;
//   明細書・領収証 free; 往療 only when attending is hard for a sudden reason.
// - MHLW 受領委任 page (2018): 受領委任 planned from 2019-01-01; 同意書 validity
//   6 months from 2018-10-01 (previously 3).
// - St. Pete Catalyst (2026-07-30): author's audit of 28 independent acupuncture
//   practices in the Tampa Bay area, ChatGPT / Google AI Overviews / Gemini; 11
//   never mentioned; condition pages on 53% of cited vs 9% of uncited. One
//   author's small sample (stated).
// - MGMA (2026-05-20, Nathan Woo, Halcy founder, disclosed): 200 US independent
//   practices, ~4,950 prompts via the GPT-5.5 API, May 2026: none mentioned or
//   cited. Vendor-authored, API test (stated).
// - schema-dts 2.1.0: MedicalBusiness "businesses run by health professionals";
//   Physiotherapy "treatment of disease, injury, or deformity by physical
//   methods such as massage".
// Top articles read 2026-11-22: uravation 整骨院・整体院 (2026-09-05), Sungrove
// 鍼灸院の広告規制 (2026-06-12), GMO ローカルAIO (2026-11-16), assist-all エステ
// (2026-01-30), assist-all 脱毛 (2026-01-30); Texta acupuncture (2025-03), MGMA
// Woo (2026-05-20), MGMA Stat (2026-06-17), WebPT (2026-01-14), Birdeye
// healthcare (2026-07-04), St. Pete Catalyst (2026-07-30).
// Not verified, so not stated: the 往療料 amount, the copayment rate, how a
// Google Business Profile is classified under the guideline (it does not name
// it; only paid/solicited comments on web mapping services are addressed),
// prefecture-level stricter readings beyond noting that they exist, rules
// outside Japan, typical prices, the share of people who choose a clinic via AI.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  guideline: "https://www.city.arakawa.tokyo.jp/documents/4191/20240218-1_ahakijuseikokokuguideline.pdf",
  mhlwSummary: "https://www.mhlw.go.jp/content/10800000/001412682.pdf",
  ryoyohi2026: "https://www.mhlw.go.jp/content/12404000/001696854.pdf",
  tohoku: "https://kouseikyoku.mhlw.go.jp/tohoku/000502582.pdf",
  juryo: "https://www.mhlw.go.jp/bunya/iryouhoken/jyuudou/oshirase.html",
  stpete: "https://stpetecatalyst.com/w/most-st-pete-small-businesses-are-invisible-to-ai-and-their-owners-have-no-idea/",
  mgma: "https://www.mgma.com/articles/why-chatgpt-has-probably-never-named-your-practice",
  medBiz: "https://schema.org/MedicalBusiness",
  physio: "https://schema.org/Physiotherapy",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalBusiness",
      "@id": "https://example.jp/#organization",
      "name": "例鍼灸治療院（例）",
      "description": "はり師・きゅう師・あん摩マッサージ指圧師（いずれも国家資格）が施術する施術所です。はり・きゅうは、医師の同意がある場合に医療保険（療養費）の対象になることがあります。自費の施術もあります。",
      "address": { "@type": "PostalAddress", "streetAddress": "◯◯県◯◯市◯◯町1-2-3 ◯◯ビル1階" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": ["Mo-Fr 09:00-20:00", "Sa 09:00-13:00"]
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "はり・きゅう 自費 45分",
      "description": "問診のあと、はりときゅうを行います。使い捨てのはりを使います。施術のあとに、だるさや、はりを刺した所の内出血が出ることがあります。",
      "category": "はり・きゅう",
      "provider": { "@id": "https://example.jp/#organization" },
      "offers": { "@type": "Offer", "price": "5500", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/reserve" },
        "result": { "@type": "Reservation", "name": "はり・きゅう 自費 45分" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalBusiness",
      "@id": "https://example.com/#organization",
      "name": "Example Acupuncture Practice",
      "description": "Treatment by nationally licensed acupuncturists, moxibustion practitioners and anma-massage-shiatsu practitioners. In Japan, acupuncture and moxibustion may be covered by health insurance (ryoyohi) with a doctor's consent. Self-pay treatment is also available.",
      "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Example St, 1st floor, Example City" },
      "telephone": "+81-00-0000-0000",
      "url": "https://example.com/",
      "openingHours": ["Mo-Fr 09:00-20:00", "Sa 09:00-13:00"]
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Acupuncture and moxibustion, self-pay, 45 minutes",
      "description": "An intake interview, then acupuncture and moxibustion with single-use needles. Tiredness or a small bruise where a needle went in can occur afterwards.",
      "category": "Acupuncture and moxibustion",
      "provider": { "@id": "https://example.com/#organization" },
      "offers": { "@type": "Offer", "price": "5500", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/book" },
        "result": { "@type": "Reservation", "name": "Acupuncture and moxibustion, self-pay, 45 minutes" }
      }
    }
  ]
}`;

export default {
  slug: "acupuncture-massage-clinic-ai-search",
  targetQueries: [
    "acupuncture clinic AI search optimization",
    "acupuncture practice ChatGPT visibility",
    "Japan acupuncture advertising guideline 2025 website",
    "鍼灸院 AI検索対策",
    "鍼灸院 ホームページ 広告ガイドライン 書き方",
    "マッサージ院 療養費 ホームページ 書き方",
  ],
  related: ["seitai-relaxation-salon-ai-search", "medical-clinic-ai-search", "pricing-page-ai-search", "person-profile-page-ai-search", "booking-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "鍼灸院・マッサージ院のAI検索対策：広告ガイドラインと書き方 | Nurevo",
      description: "鍼灸院・マッサージ院のAI検索対策は、2025年の広告ガイドラインがサイトに求める費用・施術内容・リスクと、療養費の条件を正確に書くこと。SNSや紹介サイトとの違い、手順つき。",
      h1: "鍼灸院・マッサージ院のAI検索対策：2025年の広告ガイドラインに沿って、費用・施術内容・リスク・療養費の条件をAIに正しく読ませる",
      lead: "鍼灸院・マッサージ院（はり師・きゅう師・あん摩マッサージ指圧師の施術所）のAI検索対策（AEO）は、AIに「鍼は保険がきく？」「◯◯駅の鍼灸院、1回いくらで何回通う？」と聞かれたときに、院のサイトが正確に答えられる状態にすることです。2025年2月18日の厚生労働省の広告ガイドラインは、院のウェブサイトを原則として広告とは見なさない一方で、自費の施術をするならサイトに「施術の内容と費用」「主なリスク・副作用」「問い合わせ先」を載せるよう求めています。これはそのまま、AIが答えに使う材料です。効果をうたう言葉を増やしても、AIに選ばれやすくなるわけではありません。",
      intro: [
        "作成日：2026年11月22日（JST）。法律・行政の情報は、本文に記した厚生労働省の広告ガイドライン（2025年2月18日）と、療養費に関する厚生労働省・東北厚生局の資料で確認したものです。この記事は法的な助言ではありません。表現の判断は、管轄の保健所に確認してください。都道府県によっては、ガイドラインより厳しく案内している資料もあります。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが院の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。国家資格のない整体・リラクゼーションの店は[整体院・リラクゼーションサロンのAI検索対策](/guide/seitai-relaxation-salon-ai-search/)、医師の診療所は[クリニックのAI検索対策](/guide/medical-clinic-ai-search/)をご覧ください。",
      ],
      sections: [
        {
          heading: "鍼灸院・マッサージ院について、AIはどんな質問をされているか",
          paragraphs: [
            "鍼灸やマッサージを探す人の質問は、「痛くないか」「保険がきくか」「何回、いくらかかるか」という、通う前の不安に集中します。整体の店と違うのは、国家資格の施術所なので、保険（療養費）や訪問の施術という、制度に関わる質問が多いことです。制度の話は条件が細かいので、院のサイトに書かれていなければ、AIは一般論で答えるか、条件を省いて答えます。",
          ],
          table: {
            head: ["よくある質問の型", "質問の例", "AIが答えに必要な、院の事実"],
            rows: [
              ["保険", "「腰痛の鍼は保険がきく？」", "療養費の取り扱いの有無、医師の同意が必要なこと、対象になる病名、自費との違い"],
              ["費用と回数", "「◯◯駅の鍼灸院、1回いくら？何回通う？」", "自費の施術ごとの時間と税込料金（決まっていなければ最低〜最高の幅）、標準的な回数と期間、回数券の条件"],
              ["痛み・リスク", "「鍼は痛い？副作用は？」", "使うはり（使い捨てか）、施術後に起こりうること、施術を控えてほしい場合"],
              ["施術者", "「国家資格の人がやってる？」", "施術者の免許の種類（はり師・きゅう師・あん摩マッサージ指圧師）"],
              ["訪問", "「家に来てもらえる？」", "出張・訪問の施術の有無、範囲の地域、対応時間、保険の往療の条件"],
              ["予約と時間", "「土曜や夜も開いてる？」", "施術日・施術時間、予約制かどうか、休日・夜間の施術、駐車場"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
          after: [
            `海外の例ですが、AIが個人の院をあまり挙げないことを示す調べもあります。アメリカのフロリダ州タンパ湾周辺で、個人の鍼灸院28院について、患者が聞きそうな9つの質問をChatGPT・GoogleのAI Overviews・Geminiに投げたところ、11院は一度も挙がらず、症状ごとのページを持っていたのは、挙がった院の53%、挙がらなかった院の9%だったと、地元紙のコラムが報告しています（2026年7月30日）。[St. Pete Catalyst](${SRC.stpete})。書き手1人による小さな標本で、日本にそのまま当てはまるものではありません。日本では、症状のページに効果をうたうことはガイドラインで避けるべきとされているので、この後の「書いていい事実」の形で作ります。`,
          ],
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            "2026年11月22日に、日本語と英語で「鍼灸院 AI検索対策」「鍼灸院 広告規制」「acupuncture clinic AI search」などの上位記事を11本読みました。日本語で鍼灸院とAI検索を一緒に扱う記事は見つからず、整骨院・整体を扱うAI検索の記事か、鍼灸院の広告規制だけを扱う記事に分かれていました。広告規制の記事も、2025年2月18日のガイドラインの番号・日付や、ウェブサイトが原則として広告に当たらない一方でSNSや紹介サイトは広告になりうる、という区別まで書いたものは少なく、療養費の条件を出典つきで書いた記事、構造化データの例、WordPressでの手順、AIの答えを確かめる方法を書いた記事はありませんでした。",
            `英語の記事は、口コミの数や星の数を挙げるものが多く、根拠の標本や方法が示されていないものもありました。比較的大きな標本としては、アメリカの医療コンサルタント団体MGMAのサイトに、AI集客の会社の創業者が書いた記事があり、個人の医療機関200院について約4,950の質問をGPT-5.5のAPIに投げたところ、どの院も名前が挙がらなかったとしています（2026年5月20日、筆者が自社の利害を明記）。[MGMA](${SRC.mgma})。この記事では、日本の制度に沿った書き方で、これらの抜けを埋めます。`,
          ],
        },
        {
          heading: "2025年2月18日の広告ガイドラインで、何が変わったか",
          paragraphs: [
            `厚生労働省は2025年2月18日、あん摩マッサージ指圧・はり・きゅう・柔道整復の施術所の広告について、都道府県・保健所向けの指針（医政発0218第1号、いわゆる「あはき・柔整広告ガイドライン」）を出しました。2018年5月から2024年7月まで11回開かれた検討会と、2024年8月30日〜9月28日の意見募集（72件）を経たものです。法律そのものではなく、自治体への技術的な助言という位置づけですが、保健所の指導はこれに沿って行われます。[ガイドライン本文（荒川区の掲載）](${SRC.guideline})・[厚生労働省：ガイドラインの概要](${SRC.mhlwSummary})`,
            "ガイドラインは、「人を呼び込む目的がある（誘引性）」「どの施術所のことかわかる（特定性）」「一般の人が知ることができる（認知性）」の3つがそろったものを広告として扱います。院のウェブサイトは、見る人が自分でURLを入れたり検索したりして訪れるものなので、認知性を満たさず、引き続き原則として広告とは見なさない、とされています。一方で、次のものは広告として扱われることがあります。",
          ],
          table: {
            head: ["媒体", "ガイドラインでの扱い", "書けること"],
            rows: [
              ["院のウェブサイト", "原則として広告とは見なさない。ただし載せるべき事項・載せるべきでない事項がある（次の章）", "施術内容・費用・リスクなどの事実。効果・比較・誇大はだめ"],
              ["SNSの投稿", "3つの要件を満たせば広告。見る人を限っても、拡散されれば当たることがある", "法律と告示で広告できる事項だけ"],
              ["検索の広告・費用を払って上位に出す結果", "広告（スポンサー表示、リスティング広告など）", "同上"],
              ["施術所の紹介サイト（ポータル）の紹介ページ", "広告の媒体として扱う", "同上"],
              ["費用を払った口コミサイト・ランキング", "広告。地図サービスなどで、謝礼を払って、または頼んで良い口コミを書いてもらうのもだめ", "—"],
              ["患者が自分から書いた口コミ", "院が頼んだり謝礼を払ったりしていなければ広告ではない", "—"],
            ],
            caption: "ガイドライン Ⅱ-6、Ⅵ-1、Ⅵ-4 をもとにこの記事でまとめた表です。Googleビジネスプロフィールは名前を挙げて扱われていないので、迷う場合は保健所に確認してください。",
          },
          after: [
            "AI検索の目線で見ると、ここが大事な点です。AIはサイトもSNSも紹介サイトも読みます。広告として書ける事項が限られているSNSや紹介サイトには、費用や施術内容の詳しい情報が載せにくいので、AIが詳しい事実を拾えるのは、ほぼ院のサイトだけになります。サイトに事実を書いておくことが、AIに正しく答えてもらう一番の近道です。",
          ],
        },
        {
          heading: "院のサイトに載せるべきこと（ガイドライン Ⅵ-3）と、AIの質問との対応",
          paragraphs: [
            "ガイドラインは、自費の施術をする施術所がウェブサイトに載せるべき事項として、次の3つを挙げています。小さな文字にしたり、見つけにくいリンクの先に置いたりしないことも求めています。",
          ],
          list: [
            "問い合わせ先：利用者がすぐに問い合わせられる連絡先。→ AIの「予約は？」「電話番号は？」に対応。",
            "自費の施術の内容と、通常必要な費用：標準の料金がなければ、最低額から最高額までの幅で示す。回数券・プリペイドカードは、中身と契約の条件を示す。→ AIの「1回いくら？」「回数券は？」に対応。",
            "主なリスク・副作用：標準的な費用、施術の期間・回数もあわせて示す。→ AIの「痛い？副作用は？」「何回通う？」に対応。",
          ],
          after: [
            "ガイドラインに沿ってこの3つを書くと、そのまま、AIがいちばん聞かれる質問への答えの材料がそろいます。料金を画像の料金表だけで載せている院は多いですが、画像の中の文字はAIに読まれないことがあるので、本文にも文字で書きます。料金ページ全般の書き方は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)にまとめています。",
          ],
        },
        {
          heading: "サイトに載せない表現（ガイドライン Ⅵ-4）と、代わりに書く事実",
          paragraphs: [
            "ガイドラインは、ウェブサイトにも載せるべきでない内容を挙げています。次の表は、その例と、この記事が勧める書き換えです。最終的な判断は保健所に確認してください。",
          ],
          table: {
            head: ["載せない表現の例", "ガイドラインでの区分", "代わりに書く事実の例"],
            rows: [
              ["「絶対に治る」「根本治療」「絶対安全」", "虚偽・証明できないもの", "「腰痛症は、医師の同意があれば療養費の対象になる病名の1つです」「施術後に、だるさや内出血が出ることがあります」"],
              ["「満足度98%」「改善率◯%以上」", "虚偽として扱うべきもの", "「1回の施術時間は約45分、初回は問診を含め約60分」"],
              ["「地域No.1」「口コミサイトで1位」「著名人も来院」", "他との比較・誇大", "施術者の免許の種類と施術歴（国家資格の表示は可）"],
              ["院に都合のよい感想だけを選んだ「患者さまの声」", "誇大・都合の良い情報の強調", "施術の流れ、初回の所要時間、よくある質問"],
              ["「今なら初回半額」を大きく強調", "費用の安さの過度な強調", "初回料金と通常料金、条件を同じ大きさで書く"],
              ["「放っておくと大変なことに」", "不安をあおる内容", "「強い痛みやしびれがある場合は、先に医療機関を受診してください」"],
            ],
            caption: "例はガイドライン Ⅵ-4 の区分をもとにこの記事で作ったものです。加工した施術前後の写真は虚偽、効果を強く見せるために条件を変えて撮った写真は誇大とされています。",
          },
          after: [
            "AIに対しても、この書き換えは不利になりません。「どれだけ効くか」を言い切るページより、「何をして、いくらで、どんなリスクがあり、どんな人は先に医師へ行くべきか」を書いたページのほうが、AIが体の不安の質問に答えるときの根拠として使いやすいからです。",
          ],
        },
        {
          heading: "療養費（はり・きゅう、マッサージの保険）の書き方",
          paragraphs: [
            `「鍼は保険がきく？」はAIによく聞かれる質問ですが、条件が多いので、院のサイトに条件をそのまま書いておくのが確実です。厚生労働省の資料（2026年4月30日）と東北厚生局の説明資料（2026年）では、はり・きゅうの療養費の対象は、神経痛・リウマチ・頸腕症候群・五十肩・腰痛症・頸椎捻挫後遺症の6つと、それ以外の慢性的な痛みが主な症状の病気（保険者が個別に判断）です。[厚生労働省：支給基準及び同意書の在り方について（2026年4月30日）](${SRC.ryoyohi2026})・[東北厚生局：説明資料](${SRC.tohoku})`,
            "同じ資料によると、療養費には、その病気で実際に診察を受けている主治医の同意が必要で、医師が診察したうえでの同意に限られ、オンライン診療で同意書を出すことはできません。同意の期間は、施術を始めた日か再同意の日から6か月までです（2018年10月1日に3か月から6か月に変わりました）。同じ病気で保険の医療（診察・検査と同意書の交付を除く）を受けている間は、療養費は使えません。マッサージの療養費は、筋麻痺・筋萎縮・関節拘縮などで医療上マッサージが必要な場合が対象で、疲労回復や慰安、病気の予防のためのものは対象外です。",
            `受領委任の仕組み（2019年1月から）を使う院では、患者は窓口で一部負担金だけを払い、残りは院が保険者に請求します。[厚生労働省：受領委任の取扱い](${SRC.juryo})。院は一部負担金を減らしたり免除したりできず、明細書と領収証は無料で出すことになっています。訪問の施術の往療料は、急に歩けなくなったなど、通うことが難しいやむを得ない理由がある場合に限られます。`,
          ],
          after: [
            "サイトには、次のような形で、院の取り扱いの事実を書きます。ガイドラインは、広告で療養費に触れる場合、医師の同意が必要なことを示すよう求めており、「医療保険により利用者は施術費用の一部負担で施術を受けることができます」という言い換えの例を挙げています。「各種保険取扱い」「交通事故取扱い」「労災保険取扱い」「自賠責保険取扱い」という書き方は、広告では認められていません。",
            "書き方の例：「当院は、はり・きゅうの療養費の受領委任を取り扱っています。対象は神経痛・リウマチ・頸腕症候群・五十肩・腰痛症・頸椎捻挫後遺症などで、主治医の同意書が必要です（同意の期間は6か月まで）。同じ病気で病院の保険診療を受けている間は使えません。肩こりや疲れをとる目的の施術は自費です。」",
          ],
        },
        {
          heading: "院の名前と、SNS・紹介サイトの書き方をそろえる",
          paragraphs: [
            "ガイドラインは、広告で使える施術所の名前も示しています。「◯◯鍼灸治療院」「◯◯はり灸院」のように業態が入った名前は使え、「クリニック」「メディカル」「診療所」「リハビリ」「整体」「サロン」などは使えません。業態の入っていない「◯◯治療院」も認められていません。広告として書ける事項は、あはき法第7条と告示で決まっていて、施術者の氏名・住所、業務の種類、施術所の名前・電話番号・所在地、施術日・施術時間のほか、予約による施術、休日・夜間の施術、出張による施術、駐車場、療養費の申請ができる旨（医師の同意が必要と示す場合）などです。施術者の技能・施術方法・経歴は書けません（国家資格を持っている旨は可）。",
            "AIにとって大事なのは、名前と基本情報が、サイト・Googleビジネスプロフィール・紹介サイト・SNSで同じであることです。サイトでは「◯◯鍼灸院」、紹介サイトでは「◯◯治療院」、SNSでは「◯◯鍼灸クリニック」のように名前が違うと、AIが同じ院だと判断できないことがあります。広告で使える名前に合わせて、全部の場所で1つの名前にそろえます。料金や効果の詳しい説明はサイトに置き、SNSや紹介サイトには広告で書ける事項だけを書いて、サイトへの案内にします。",
          ],
        },
        {
          heading: "構造化データ：型の選び方と例",
          paragraphs: [
            `schema.orgには鍼灸院だけを表す型はありません。schema-dts 2.1.0で確認すると、[MedicalBusiness](${SRC.medBiz})は「医療の目的の事業。例として、医療の専門職が営む事業」と説明されており、国家資格の施術者が営む鍼灸院・マッサージ院はこの型がいちばん近いと、この記事では考えます（2026年11月22日確認）。MedicalClinic（診療所）やPhysician（医師）は、医師の診療所と誤解されるので使いません。[Physiotherapy](${SRC.physio})は「マッサージなどの物理的な方法による病気・けが・変形の治療」と説明されており、治療をうたう形になるので、この記事では勧めません。美容鍼やリラクゼーションが中心で療養費を扱わない院は、HealthAndBeautyBusinessも選べます。`,
            "構造化データの型は画面に表示される名前ではありませんが、院の説明（description）には、医療機関と誤解されない書き方で、国家資格の施術所であることと療養費の取り扱いを書きます。施術は1つずつServiceとして出し、説明に施術の内容と、起こりうることを入れます。Nurevo AEOで登録すると、次のような形になります（値は例です）。",
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データには、本文に見えている事実だけを入れます。効果や「満足度◯%」を入れても、AIや検索での評価が上がるわけではありません。Googleは、AI OverviewsやAI Modeのための特別なschema.orgのマークアップは必要ないとしています。[Google：AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "WordPressの鍼灸院・マッサージ院サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACKなどのSEOプラグインはそのまま使えます。`,
            "初回の設定ウィザードで「クリニック・歯科」を選ぶと、業種がMedicalBusinessになります。この型のまま使い、PhysicianやMedicalClinicには変えません。美容鍼・リラクゼーション中心で療養費を扱わない院は「美容サロン」を選び、「業種（schema.org型）」をHealthAndBeautyBusinessにします。",
            "院の名前は、広告で使える名前（例：◯◯鍼灸治療院）にし、Googleビジネスプロフィール・紹介サイトと同じ表記にします。説明に、施術者の免許の種類と療養費の取り扱いを書き、住所・電話番号・施術時間を確認します。",
            "自費の施術を1つずつサービスとして登録します（最大20件）。サービス名に施術と時間、料金に税込の金額（数字だけ）、通貨にJPY、予約URL、説明に施術の内容と起こりうること（だるさ・内出血など）を入れます。サービス・料金・予約のアクションとして出力され、llms.txtにも1行ずつ載ります。料金に幅がある施術は、本文に最低〜最高の幅を書きます。",
            "よくある質問（保険の条件、痛み、回数と期間、訪問の施術、施術を控えてほしい場合）を入力し、料金や施術のページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "/llms.txt を開き、施術・料金・療養費・アクセス・施術者のページが載っているか確かめます。「◯◯が治った」のような古いブログ記事や、選んだ感想だけを並べたページは、書き直すか、Nurevo AEOパネルでllms.txtに載せない設定にします。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。施術者の紹介ページの書き方は[人物プロフィールのページのAI検索対策](/guide/person-profile-page-ai-search/)、予約ページは[予約ページのAI検索対策](/guide/booking-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "自費の施術ごとに、内容と税込料金（決まっていなければ最低〜最高の幅）が文字で書かれている。",
            "主なリスク・副作用と、標準的な回数・期間が書かれている。",
            "回数券・プリペイドカードの中身と条件が書かれている。",
            "療養費の取り扱いの有無、対象の病名、医師の同意が必要なこと、自費との違いが書かれている。",
            "「治る」「根本治療」「絶対安全」「満足度◯%」「No.1」を使っていない。",
            "選んだ感想だけを並べた「患者さまの声」や、加工した施術前後の写真を載せていない。",
            "施術者の免許の種類が正確に書かれている（民間資格を国家資格のように見せていない）。",
            "院の名前が、サイト・Googleビジネスプロフィール・紹介サイト・SNSで同じで、「クリニック」などを使っていない。",
            "構造化データの型がMedicalBusiness（またはHealthAndBeautyBusiness）で、MedicalClinic・Physician・Physiotherapyではない。",
            "llms.txtに施術・料金・療養費・アクセス・施術者のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、患者さんが聞きそうな質問をAIに投げます。「◯◯駅 鍼灸院 土曜」「◯◯市 訪問マッサージ」のような地域＋条件の質問で名前が出るかに加えて、院の名前を入れて「保険は使える？」「1回いくら？」「何回通う？」と聞き、答えがサイトの説明と合っているかを記録します。AIが療養費の条件を省いて「保険がききます」とだけ答えている場合は、サイトや紹介サイトに条件のない書き方が残っていないかを探します。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（院の名前は含めません）をPerplexityに投げ、回答に院の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
          ],
        },
      ],
      faqs: [
        { q: "鍼灸院のホームページは広告規制の対象ですか？", a: "2025年2月18日の厚生労働省の広告ガイドラインでは、院のウェブサイトは原則として広告とは見なさないとされています。ただし、自費の施術の内容・費用・リスクなど載せるべき事項と、効果の断定や比較など載せるべきでない事項が示されています。SNSの投稿、検索の広告、紹介サイトの紹介ページは広告として扱われることがあります。" },
        { q: "鍼灸院のAI検索対策は、何から始めればいいですか？", a: "ガイドラインがサイトに求める3つ（問い合わせ先、自費の施術の内容と費用、主なリスク・副作用と標準的な回数・期間）と、療養費の取り扱いの条件を文字で書くことからです。そのうえで、同じ事実を構造化データとllms.txtで公開し、院の名前をGoogleビジネスプロフィールや紹介サイトとそろえます。" },
        { q: "サイトに料金を書いてもいいですか？", a: "ガイドラインは、自費の施術をする施術所のウェブサイトに、通常必要な費用を載せるよう求めています（標準の料金がなければ最低〜最高の幅）。安さを過度に強調することは避けます。SNSや紹介サイトなど広告に当たる場所では、書ける事項が法律と告示で限られているので、保健所に確認してください。" },
        { q: "「腰痛」などの症状のページを作ってもいいですか？", a: "効果をうたわず、事実を書く形なら作れます。たとえば、腰痛症が療養費の対象の病名の1つであること、医師の同意が必要なこと、施術の内容と回数の目安、先に医療機関を受診してほしい場合を書きます。「治る」「改善率◯%」は載せません。" },
        { q: "構造化データにはどの型を使いますか？", a: "国家資格の施術者が営む院なら、この記事ではMedicalBusinessを勧めます。MedicalClinicやPhysicianは医師の診療所と誤解され、Physiotherapyは治療をうたう説明の型なので使いません。美容鍼やリラクゼーション中心で療養費を扱わない院は、HealthAndBeautyBusinessも選べます。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（MedicalBusinessなど）・住所・施術時間・施術（サービス）・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコア、月1回の無料のAIチェックは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに院が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが院の事実を正しく読める状態をつくり、出ているか・正しく答えているかを続けて確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが院のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで施術と料金の情報を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleとGeminiはGoogle LLC、ClaudeはAnthropicの商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACKはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Acupuncture & Massage Clinics in Japan | Nurevo",
      description: "AEO for licensed acupuncture and massage clinics in Japan: publish the fees, treatments and risks the 2025 ad guideline asks sites to carry, plus insurance rules.",
      h1: "AI search for acupuncture and massage clinics in Japan: following the 2025 advertising guideline to get AI to read your fees, treatments, risks and insurance conditions correctly",
      lead: "AI search optimization (AEO) for an acupuncture, moxibustion or massage clinic in Japan (run by licensed hari-shi, kyu-shi or anma-massage-shiatsu practitioners) means making your own site able to answer what people ask AI, such as \"Does insurance cover acupuncture?\" or \"How much is acupuncture near the station, and how many visits will I need?\" The health ministry's advertising guideline of February 18, 2025 treats a clinic's own website as, in principle, not advertising, but asks clinics that offer self-pay treatment to put the treatment and its usual cost, the main risks and side effects, and a contact point on the site. Those are exactly the facts AI uses in its answers. Adding claims about results does not make AI more likely to pick you.",
      intro: [
        "Written November 22, 2026 (JST). The legal and government information comes from the Ministry of Health, Labour and Welfare's advertising guideline (February 18, 2025) and from ministry and Tohoku Regional Bureau material on insurance (ryoyohi), as cited in the text. It describes Japanese rules; other countries regulate acupuncture and massage differently, so check the ones that apply to you. This article is not legal advice, and some prefectures give stricter guidance than the national guideline, so check wording with your local public health centre.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your clinic's facts readable to AI. They do not guarantee that an AI will mention your clinic or rank it anywhere. For unlicensed bodywork shops see [AI search for bodywork and relaxation salons](/guide/seitai-relaxation-salon-ai-search/), and for doctors' clinics see [AI search for medical clinics](/guide/medical-clinic-ai-search/).",
      ],
      sections: [
        {
          heading: "What people ask AI about acupuncture and massage clinics",
          paragraphs: [
            "Questions about acupuncture and massage cluster around worries before the first visit: will it hurt, does insurance cover it, how many visits and how much? The difference from unlicensed bodywork is that these are licensed clinics, so many questions involve the insurance system (ryoyohi) and home-visit treatment. Those rules come with detailed conditions. If your site does not state them, AI answers from general explanations or leaves the conditions out.",
          ],
          table: {
            head: ["Type of question", "Example", "Facts the AI needs from the clinic"],
            rows: [
              ["Insurance", "\"Does insurance cover acupuncture for back pain?\"", "Whether you handle ryoyohi, that a doctor's consent is needed, which conditions qualify, how it differs from self-pay"],
              ["Cost and visits", "\"How much is acupuncture near the station? How many visits?\"", "Length and price including tax for each self-pay treatment (a minimum-to-maximum range if there is no set fee), the usual number of visits and period, terms of multi-visit tickets"],
              ["Pain and risks", "\"Does acupuncture hurt? Any side effects?\"", "The needles you use (single-use or not), what can happen after treatment, when to hold off"],
              ["Practitioners", "\"Is the practitioner nationally licensed?\"", "The licence each practitioner holds (hari-shi, kyu-shi, anma-massage-shiatsu)"],
              ["Home visits", "\"Can someone come to my home?\"", "Whether you do home visits, the area covered, the hours, and the insurance conditions for visits"],
              ["Booking and hours", "\"Are you open on Saturdays or evenings?\"", "Treatment days and hours, whether booking is required, weekend and evening treatment, parking"],
            ],
            caption: "The examples illustrate the article. They are not a measurement of how often these questions are asked.",
          },
          after: [
            `One example from abroad shows how rarely AI names independent clinics. A local newspaper column (July 30, 2026) reports that, when nine patient-style questions about 28 independent acupuncture practices around Tampa Bay, Florida were put to ChatGPT, Google AI Overviews and Gemini, 11 practices were never named, and condition-specific pages existed on 53% of the practices that were named against 9% of those that were not. [St. Pete Catalyst](${SRC.stpete}). It is one writer's small sample and does not transfer directly to Japan. In Japan the guideline says pages should not claim results, so condition pages are built from the permitted facts described below.`,
          ],
        },
        {
          heading: "What the top-ranking guides leave out",
          paragraphs: [
            "On November 22, 2026, we read 11 top-ranking articles in Japanese and English for searches such as \"acupuncture clinic AI search\" and \"acupuncture clinic advertising rules\". We found no Japanese article covering acupuncture clinics and AI search together: they split into AI-search articles about bodywork and judo-therapy clinics, and articles on acupuncture advertising rules only. Few of the advertising articles gave the February 18, 2025 guideline's number and date, or the distinction that a clinic's website is in principle not advertising while SNS posts and listing sites can be. None set out the insurance conditions with sources, gave a structured data example, WordPress steps, or a way to check AI answers.",
            `Many of the English articles cite review counts and star thresholds, some without showing the sample or method. One with a larger sample, published on the US medical group association MGMA's site by the founder of an AI marketing company, reports that about 4,950 questions about 200 independent practices, sent to the GPT-5.5 API, did not name any of them (May 20, 2026; the author discloses his company's interest). [MGMA](${SRC.mgma}). This article fills those gaps with wording that follows the Japanese rules.`,
          ],
        },
        {
          heading: "What the February 18, 2025 advertising guideline changed",
          paragraphs: [
            `On February 18, 2025, the health ministry issued a guideline for prefectures and public health centres on advertising by anma-massage-shiatsu, acupuncture, moxibustion and judo-therapy clinics (notice 医政発0218第1号, known as the ahaki-jusei advertising guideline). It followed 11 meetings of an expert panel between May 2018 and July 2024 and a public consultation from August 30 to September 28, 2024 (72 comments). It is not a law but technical advice to local governments; public health centres guide clinics along its lines. [Guideline text (copy on Arakawa City's site)](${SRC.guideline}) · [MHLW: guideline overview](${SRC.mhlwSummary})`,
            "The guideline treats something as advertising when three conditions are met: it aims to draw people in, it identifies a specific clinic, and the general public can come across it. A clinic's website is visited by people who type the URL or search for it, so it does not meet the third condition and is still, in principle, not treated as advertising. The following, however, can be.",
          ],
          table: {
            head: ["Channel", "How the guideline treats it", "What you can say there"],
            rows: [
              ["Your clinic's website", "In principle not advertising, but there are things it should and should not carry (next section)", "Facts such as treatments, fees and risks. No result claims, comparisons or exaggeration"],
              ["SNS posts", "Advertising when the three conditions are met. Even posts to a limited audience can count if they are shared on", "Only the items the act and the ministry notice allow in ads"],
              ["Search ads and paid placement in results", "Advertising (sponsored results, listing ads and similar)", "Same as above"],
              ["Clinic pages on listing or referral sites", "Treated as an advertising medium", "Same as above"],
              ["Paid review sites and rankings", "Advertising. Paying for, or asking for, favourable comments on map services is also ruled out", "—"],
              ["Reviews patients write on their own", "Not advertising if the clinic did not ask or pay for them", "—"],
            ],
            caption: "This table summarises sections II-6, VI-1 and VI-4 of the guideline. Google Business Profile is not named, so check with your public health centre if unsure.",
          },
          after: [
            "From an AI-search point of view, this is the key point. AI reads your site, your SNS and listing sites. SNS and listing sites can only carry the limited advertising items, so detailed fees and treatment descriptions are hard to put there. The only place AI can find your detailed facts is, in practice, your own site. Writing them there is the most direct way to get AI to answer correctly.",
          ],
        },
        {
          heading: "What your site should carry (guideline VI-3), and the AI questions each item answers",
          paragraphs: [
            "The guideline lists three things that clinics offering self-pay treatment should put on their website. It also asks that they not be hidden in small print or behind hard-to-find links.",
          ],
          list: [
            "A contact point that people can reach easily. Answers AI questions such as \"How do I book?\" and \"What is the phone number?\"",
            "The self-pay treatments and their usual cost: if there is no set fee, a range from the minimum to the maximum; for multi-visit tickets and prepaid cards, what they include and the contract terms. Answers \"How much per visit?\" and \"Do you sell multi-visit tickets?\"",
            "The main risks and side effects, together with the standard cost, treatment period and number of visits. Answers \"Does it hurt? Any side effects?\" and \"How many visits will I need?\"",
          ],
          after: [
            "Write these three as the guideline asks and you have the material for the questions AI is asked most. Many clinics post their prices only as an image of a price list. Text inside an image may not be read by AI, so put it in the page text too. For pricing pages in general, see [AI search for pricing pages](/guide/pricing-page-ai-search/).",
          ],
        },
        {
          heading: "Wording your site should not carry (guideline VI-4), and the facts to write instead",
          paragraphs: [
            "The guideline also lists content that websites should not carry. The table gives examples and this article's suggested rewording. Check final decisions with your public health centre.",
          ],
          table: {
            head: ["Wording to avoid (examples)", "Guideline category", "Facts to write instead (examples)"],
            rows: [
              ["\"Guaranteed cure\", \"treats the root cause\", \"completely safe\"", "False or unprovable", "\"Lumbago is one of the conditions that can qualify for ryoyohi with a doctor's consent\", \"Tiredness or a small bruise can occur after treatment\""],
              ["\"98% satisfaction\", \"over X% improvement\"", "To be treated as false", "\"Each session takes about 45 minutes; the first, with the intake interview, about 60\""],
              ["\"No. 1 in the area\", \"top-rated on review sites\", \"celebrities come here\"", "Comparison or exaggeration", "Each practitioner's licence and years of practice (stating a national licence is allowed)"],
              ["A \"patient voices\" page of hand-picked praise", "Exaggeration and over-emphasis of favourable information", "How a session runs, how long the first visit takes, FAQs"],
              ["A huge \"half price first visit\" banner", "Over-emphasis on low cost", "The first-visit and regular prices and their conditions, in the same size"],
              ["\"Leave it and it will get serious\"", "Content that stokes fear", "\"If you have severe pain or numbness, please see a doctor first\""],
            ],
            caption: "The examples are this article's, built on the categories in guideline VI-4. Retouched before-and-after photos are treated as false, and photos taken under altered conditions to exaggerate results as exaggeration.",
          },
          after: [
            "This rewording does not hurt you with AI either. A page that says what you do, what it costs, what the risks are and who should see a doctor first is easier for AI to use as a source than a page that asserts how well treatment works.",
          ],
        },
        {
          heading: "How to describe insurance (ryoyohi) for acupuncture, moxibustion and massage",
          paragraphs: [
            `\"Does insurance cover acupuncture?\" is a common AI question, and the conditions are many, so the safest course is to state them on your site. According to ministry material (April 30, 2026) and Tohoku Regional Bureau slides (2026), acupuncture and moxibustion ryoyohi covers six conditions (neuralgia, rheumatism, cervico-brachial syndrome, frozen shoulder, lumbago and after-effects of cervical sprain) plus other diseases whose main symptom is chronic pain, judged case by case by the insurer. [MHLW: payment criteria and consent forms (April 30, 2026)](${SRC.ryoyohi2026}) · [Tohoku Regional Bureau: briefing slides](${SRC.tohoku})`,
            "The same material says ryoyohi needs the consent of the doctor actually treating the patient for that condition, given after an examination; consent cannot be issued through an online consultation. Consent lasts up to six months from the first treatment or re-consent (it changed from three months to six on October 1, 2018). While the patient receives insurance-covered medical care for the same condition (other than examination, tests and issuing the consent form), ryoyohi cannot be used. Massage ryoyohi covers cases where massage is medically needed for muscle paralysis, muscle atrophy, joint contracture and similar; massage for fatigue, relaxation or prevention is not covered.",
            `At clinics using the proxy-receipt system (juryo-inin, from January 2019), patients pay only their share at the clinic and the clinic claims the rest from the insurer. [MHLW: proxy-receipt handling](${SRC.juryo}). Clinics may not reduce or waive the patient's share, and must issue itemised statements and receipts free of charge. The home-visit fee applies only when there is an unavoidable reason the patient cannot attend, such as suddenly being unable to walk.`,
          ],
          after: [
            "On your site, state how your clinic handles this, along the lines below. The guideline asks that any advertising mention of ryoyohi show that a doctor's consent is needed, and gives a plain-language example along the lines of \"With health insurance, you pay only part of the treatment cost.\" Wording such as \"all insurance accepted\", \"traffic accidents handled\", \"workers' compensation handled\" or \"compulsory car insurance handled\" is not allowed in advertising.",
            "Example: \"We handle acupuncture and moxibustion ryoyohi under the proxy-receipt system. It covers conditions such as neuralgia, rheumatism, cervico-brachial syndrome, frozen shoulder, lumbago and after-effects of cervical sprain, and needs a consent form from your treating doctor (valid for up to six months). It cannot be used while you receive insurance-covered hospital care for the same condition. Treatment for stiff shoulders or fatigue is self-pay.\"",
          ],
        },
        {
          heading: "Keep your clinic name and your SNS and listing-site wording consistent",
          paragraphs: [
            "The guideline also sets out which clinic names can be used in advertising. Names that include the type of practice, such as \"[Name] Acupuncture Treatment Clinic\" (○○鍼灸治療院) or \"[Name] Hari-Kyu-in\", are allowed; words such as \"clinic\" (クリニック), \"medical\", \"medical office\" (診療所), \"rehab\", \"seitai\" and \"salon\" are not, nor is a bare \"treatment clinic\" (治療院) without the type of practice. The items allowed in advertising are set by Article 7 of the act and a ministry notice: the practitioner's name and address, the type of practice, the clinic's name, phone number and location, treatment days and hours, and items such as treatment by appointment, weekend and evening treatment, home visits, parking, and that ryoyohi can be claimed (when the need for a doctor's consent is shown). Practitioners' skill, methods and career cannot be advertised (holding a national licence can be).",
            "What matters for AI is that your name and basic details are the same on your site, Google Business Profile, listing sites and SNS. If the site says \"[Name] Acupuncture\", a listing site \"[Name] Treatment Clinic\" and SNS \"[Name] Acupuncture Clinic\", AI may not recognise them as one clinic. Pick one name that is allowed in advertising and use it everywhere. Keep detailed fees and explanations on your site, and use SNS and listing sites only for the permitted items and a link to the site.",
          ],
        },
        {
          heading: "Structured data: choosing a type, with an example",
          paragraphs: [
            `schema.org has no type just for acupuncture clinics. In schema-dts 2.1.0, [MedicalBusiness](${SRC.medBiz}) is described as a business for medical purposes, with businesses run by health professionals as an example. This article considers it the closest fit for clinics run by nationally licensed practitioners (checked November 22, 2026). Do not use MedicalClinic or Physician, which suggest a doctor's practice. [Physiotherapy](${SRC.physio}) is described as the treatment of disease, injury or deformity by physical methods such as massage, which reads as a treatment claim, so this article does not recommend it. Clinics centred on cosmetic acupuncture or relaxation that do not handle ryoyohi can use HealthAndBeautyBusiness.`,
            "The type is not a name shown on screen, but in the description, write that you are a clinic of nationally licensed practitioners and how you handle ryoyohi, in a way that does not suggest a medical institution. Publish each treatment as its own Service, with what it involves and what can happen afterwards. Registered in Nurevo AEO, it looks like this (the values are examples):",
          ],
          code: SCHEMA_EN,
          after: [
            "Put only facts that are visible on the page into structured data. Adding results or values such as \"satisfaction X%\" does not raise how AI or search rates you. Google says no special schema.org markup is needed for AI Overviews or AI Mode. [Google: AI features and your website](" + SRC.googleAi + ")",
          ],
        },
        {
          heading: "Setting it up on a WordPress acupuncture or massage clinic site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Your SEO plugin, such as Yoast SEO, Rank Math or All in One SEO, keeps working.`,
            "In the setup wizard, choose \"Clinic or dental\": the business type becomes MedicalBusiness. Keep it, and do not change it to Physician or MedicalClinic. A clinic centred on cosmetic acupuncture or relaxation that does not handle ryoyohi can choose \"Beauty salon\" and set \"Business type (schema.org type)\" to HealthAndBeautyBusiness.",
            "Use a clinic name that is allowed in advertising, spelled the same as on your Google Business Profile and listing sites. In the description, state each practitioner's licence and how you handle ryoyohi, and check the address, phone and treatment hours.",
            "Register each self-pay treatment as a service (up to 20): the treatment and length in the name, the price including tax (number only), currency, booking URL, and in the description what it involves and what can happen afterwards (tiredness, small bruises). They are published as Service, Offer and a booking action, and each gets a line in llms.txt. For treatments with a price range, write the minimum-to-maximum range in the page text.",
            "Add FAQs (insurance conditions, pain, number of visits and period, home visits, when to hold off) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your fees or treatment pages.",
            "Open /llms.txt and check that your treatment, fees, insurance, access and practitioner pages are listed. Rewrite old blog posts such as \"How we cured X\" and pages of hand-picked praise, or exclude them from llms.txt in the Nurevo AEO panel. Run the check on the AEO score screen and fix what it finds.",
          ],
          after: [
            "On sites that are not WordPress, the points to check are the same. Enter your URL in the [free check](/check), no sign-up needed, to see the state of your structured data, llms.txt and AI crawler access. For practitioner pages see [AI search for person profile pages](/guide/person-profile-page-ai-search/), and for booking pages [AI search for booking pages](/guide/booking-page-ai-search/).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Each self-pay treatment has its content and price including tax (or a minimum-to-maximum range) in text.",
            "The main risks and side effects, and the usual number of visits and period, are stated.",
            "What multi-visit tickets and prepaid cards include, and their terms, are stated.",
            "Whether you handle ryoyohi, the qualifying conditions, the need for a doctor's consent and how it differs from self-pay are stated.",
            "No \"cure\", \"root cause\", \"completely safe\", \"X% satisfaction\" or \"No. 1\".",
            "No page of hand-picked praise and no retouched before-and-after photos.",
            "Each practitioner's licence is stated accurately (no private certificate presented as a national licence).",
            "The clinic name is the same on your site, Google Business Profile, listing sites and SNS, and does not use words such as \"clinic\" (クリニック).",
            "The structured data type is MedicalBusiness (or HealthAndBeautyBusiness), not MedicalClinic, Physician or Physiotherapy.",
            "llms.txt lists your treatment, fees, insurance, access and practitioner pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI shows you, and whether it is right",
          paragraphs: [
            "Once the pages are in order, ask AI what your patients would ask. Check whether you are named for local, condition-based questions such as \"acupuncture near [station], Saturday\" or \"home-visit massage in [city]\", and also ask with your clinic's name, such as \"Does insurance apply?\", \"How much per visit?\" and \"How many visits?\", noting whether the answers match your site. If AI says simply \"insurance applies\" without the conditions, look for wording without conditions still on your site or listing sites.",
            "AI answers change between runs, so ask the same questions several times, spread over time. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your clinic's name) are sent to Perplexity, and the result records whether your name or site appeared. The Pro plan (from USD 99 a month) adds beta AI visibility measurement, with competitor comparison and trends (currently measured on Perplexity). Both look at samples of answers, not every answer. See [how to measure AI visibility](/guide/measure-ai-visibility/) for methods.",
          ],
        },
      ],
      faqs: [
        { q: "Does advertising regulation apply to an acupuncture clinic's website in Japan?", a: "Under the health ministry's advertising guideline of February 18, 2025, a clinic's website is, in principle, not treated as advertising. The guideline does list things the site should carry (self-pay treatments, their cost and risks) and things it should not (result claims, comparisons). SNS posts, search ads and pages on listing sites can be treated as advertising." },
        { q: "Where should an acupuncture clinic start with AI search?", a: "Write the three things the guideline asks websites to carry (a contact point, self-pay treatments and their cost, main risks and side effects with the usual number of visits and period) and the conditions for insurance (ryoyohi) as text. Then publish the same facts as structured data and in llms.txt, and use the same clinic name as on your Google Business Profile and listing sites." },
        { q: "Can I put prices on my site?", a: "The guideline asks clinics that offer self-pay treatment to show the usual cost on their website (a minimum-to-maximum range if there is no set fee). Avoid over-emphasising low prices. Where something counts as advertising, such as SNS or listing sites, the permitted items are limited by law and a ministry notice, so check with your public health centre." },
        { q: "Can I make pages for symptoms such as back pain?", a: "Yes, if they state facts rather than claim results: for example, that lumbago is one of the conditions that can qualify for ryoyohi, that a doctor's consent is needed, what treatment involves and a guide to the number of visits, and when to see a doctor first. Leave out \"cure\" and \"X% improvement\"." },
        { q: "Which structured data type should an acupuncture clinic use?", a: "For clinics run by nationally licensed practitioners, this article recommends MedicalBusiness. MedicalClinic and Physician suggest a doctor's practice, and Physiotherapy is defined as treating disease, so avoid them. Clinics centred on cosmetic acupuncture or relaxation that do not handle ryoyohi can use HealthAndBeautyBusiness." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (MedicalBusiness and others), address, hours, treatments (services) and FAQ structured data, llms.txt, AI crawler rules, the AEO score and a monthly free AI check are in the free plan. Paid plans add an always-current rule set (Standard, USD 20 a month) and beta AI visibility measurement (Pro, from USD 99 a month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my clinic appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your clinic's facts easy for AI to read correctly, and keep checking whether it shows you and whether its answers are right." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your clinic's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your treatments and fees for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Google and Gemini of Google LLC, and Claude of Anthropic. Yoast SEO, Rank Math and All in One SEO are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies. This article is not legal advice.",
    },
  },
};
