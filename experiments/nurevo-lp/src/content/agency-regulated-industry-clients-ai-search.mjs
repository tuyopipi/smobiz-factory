// Content page (agencies): taking on AI search work (FAQ, structured data,
// llms.txt, page copy) for clients in regulated industries — medical and
// dental, health foods and cosmetics, insurance and finance, licensed
// professions. Covers why the AI-facing parts are reviewed like the rest of
// the site, what to check in each part, a review workflow with owners, the
// contract terms, AI drafts, and how to do it in WordPress with Nurevo.
// Separate from insurance-agency-ai-search (the insurance agency's own
// facts and its insurer review), dental/medical clinic guides (what a clinic
// publishes) and agency-review-reply-service-ai-search (review replies).
//
// Written 2026-11-27 20時 (JST).
//
// Outside facts and where they were read (2026-11-27):
// - MHLW 医療広告等ガイドライン (001683594.pdf, 令和8年3月30日最終改正):
//   広告 = 誘引性・特定性・医療に関する内容; websites covered since the 2017
//   amendment (平成29年法律第57号); 「これは広告ではありません」 does not take
//   a page out of scope; paid stealth posts are 広告; p.7 第2 6: 何人も —
//   広告代理店・アフィリエイター etc.; agencies that create ads on commission
//   can be subject to 指導 together with the advertiser; p.11: requested or
//   paid 口コミ/体験談 are 広告. AI is not mentioned.
// - MHLW 事例解説書 第6版 (001683116.pdf, 令和8年3月作成): p.4 限定解除 four
//   conditions (情報を求めて閲覧するウェブサイト等; 問い合わせ先; 自由診療の
//   通常必要な治療内容・費用; 主なリスク・副作用); p.23 体験談 ban (法6条の5
//   第2項第4号, 規則1条の9第1号), pp.24–27 incl. staff-written, copied from
//   review sites, questionnaires; pp.29–31 before/after photos need content,
//   fees, risks near the photo.
// - CAA stealth marketing page: illegal from 2023-10-01; the regulated party
//   is the business supplying the goods, not the influencer.
// - CAA いわゆる健康食品 留意事項 (平成25年12月24日, 一部改定 平成27年1月13日,
//   hosted by 関東信越厚生局): 健康増進法 applies to 何人も incl. 広告代理店
//   and media (p.7); 景品表示法 applies to 商品等供給主体 (p.5). A later
//   revision exists (not read), so the article says to check the current one
//   and gives no article numbers.
// - FTC Health Products Compliance Guidance (Dec 2022): applies to any
//   health-related claim; competent and reliable scientific evidence, RCTs
//   generally; anecdotal evidence never sufficient; "Anyone participating in
//   deceptive marketing is potentially liable", FTC has acted against ad
//   agencies.
// - FINRA Rule 2210: (a) retail communication >25 retail investors in 30
//   days; (b)(1)(A) principal approval before use or filing; (b)(4) records
//   per SEA 17a-4(b); (d)(1) fair and balanced, no false/exaggerated/
//   promissory claims, no projections. Regulatory Notice 26-14 (2026-07-09,
//   comments to 09-11): proposal to replace pre-use approval with risk-based
//   procedures; discusses AI-generated communications. 2026 Oversight Report:
//   GenAI communications must comply; supervise and retain chatbot
//   communications; describe AI use accurately.
// Not stated: that any regulator has named llms.txt or structured data;
// 限定解除 text in the guideline itself (taken from the casebook); 薬機法
// article numbers and the list of cosmetic claims; penalties; FTC consumer
// review rule (page not read); 士業 association rules in detail.
//
// Nurevo facts (readme 0.9.2): suggestions from the service are applied only
// when an administrator clicks Apply; per-page: leave out of llms.txt, stop
// Nurevo structured data, page-only FAQ; FAQPage only on the page that shows
// the FAQ; llms.txt = business name, description, key facts, titles and URLs
// of the 30 most recently updated posts/pages, products, services; settings
// export/import JSON (Settings > Tools, wp nurevo export); 0.9.1 coexists with
// SEO SIMPLE PACK and VK All in One Expansion Unit. Pro measurement keeps
// answer excerpts (docs/pro-measurement-implementation.md). Partner program:
// branded reports, multi-site dashboard, 40% referral (approval required).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  mhlwGuideline: "https://www.mhlw.go.jp/content/001683594.pdf",
  mhlwCasebook: "https://www.mhlw.go.jp/content/001683116.pdf",
  caaStema: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing",
  healthFood: "https://kouseikyoku.mhlw.go.jp/kantoshinetsu/gyomu/bu_ka/shokuhin/documents/kenkoshokuhinryuijikoh.pdf",
  ftcHealth: "https://www.ftc.gov/system/files/ftc_gov/pdf/Health-Products-Compliance-Guidance.pdf",
  finra2210: "https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210",
  finra2614: "https://www.finra.org/rules-guidance/notices/26-14",
  finraReport: "https://www.finra.org/rules-guidance/guidance/reports/2026-finra-annual-regulatory-oversight-report/communication-with-public",
};

const CONTRACT_JA = `【規制業種のAI対策：契約・発注書に足す条項の例】
1. 対象：サイトの本文・FAQ・構造化データ（JSON-LD）・llms.txt・画像の代替テキスト・
   ページのタイトル。AIに読ませるためだけの部分も、公開ページと同じ確認の対象とする。
2. 事実の出典：料金・治療や商品の内容・リスク・資格・取扱商品などの事実は、
   甲（事業者）が出典（院内の料金表、承認書、約款など）とともに提供する。
   乙（制作会社）は出典のない事実を書かない。
3. 確認と承認：乙は公開前に下書きと差分を甲に送り、甲の確認者（氏名・役職を別紙に記載）
   が承認したものだけを公開する。承認がない場合は公開しない。
4. 法令の判断：広告規制に当たるかの最終判断は甲が行う。乙は気づいた点を指摘する。
   必要に応じ、甲は専門家（弁護士、所属団体、保険会社・所管の窓口など）に確認する。
5. 生成AIの利用：乙が生成AIで下書きを作る場合は事前に伝え、出力は人が確かめてから
   甲に送る。患者・顧客の個人情報や相談内容はAIに入力しない。
6. 記録：承認した版（日付・承認者・対象ページ）を乙が◯年保存し、甲の求めで提出する。
7. 見直し：料金・制度・商品が変わったとき、および◯か月ごとに、対象の部分を見直す。
8. 指摘を受けたとき：行政・保険会社・所属団体から指摘があれば、乙は◯営業日以内に
   該当箇所を非公開または修正できるよう協力する。`;

const CONTRACT_EN = `[Clauses to add to the agreement or statement of work — example]
1. Scope: site copy, FAQ, structured data (JSON-LD), llms.txt, image alt text and page
   titles. Parts written only for AI systems are reviewed to the same standard as visible pages.
2. Sources of facts: the Client supplies prices, treatment or product details, risks,
   licences and product lists with a source (price list, approval, policy wording, etc.).
   The Agency does not publish a fact without a source.
3. Review and approval: before publishing, the Agency sends the draft and the diff to the
   Client's named reviewer (name and role in Schedule A). Nothing goes live without approval.
4. Regulatory judgement: the Client makes the final call on whether content meets the rules
   that apply to it. The Agency flags concerns. The Client consults counsel, its compliance
   function, or its regulator or carrier where needed.
5. Generative AI: the Agency tells the Client before using AI to draft. A person checks every
   draft before it is sent. No patient or customer personal data goes into an AI tool.
6. Records: the Agency keeps each approved version (date, approver, pages) for X years and
   provides it on request.
7. Review cycle: affected content is reviewed whenever prices, rules or products change,
   and at least every X months.
8. Regulator or partner findings: if a regulator, carrier or professional body raises an
   issue, the Agency helps unpublish or correct the content within X business days.`;

export default {
  slug: "agency-regulated-industry-clients-ai-search",
  targetQueries: [
    "regulated industry AEO agency compliance review",
    "AI search optimization healthcare financial services compliance",
    "GEO content approval workflow agency client",
    "医療広告ガイドライン AI検索対策 制作会社",
    "規制業種 AIO LLMO 対策 注意点",
    "薬機法 景品表示法 AI検索 FAQ 構造化データ",
  ],
  related: ["agency-ai-search-manipulation-risks", "agency-review-reply-service-ai-search", "insurance-agency-ai-search", "medical-clinic-ai-search", "agency-aeo-monthly-service"],
  locales: {
    ja: {
      title: "規制業種のAI検索対策を制作会社が受けるとき：確認の流れと責任の分け方 | Nurevo",
      description: "医療・健康食品・保険など広告規制のある業種では、FAQ・構造化データ・llms.txtもサイトの一部として確認が要ります。制作会社が受ける前に決める確認の流れ、責任の分け方、契約の条項例、WordPressでの手順をまとめました。",
      h1: "規制業種のクライアントのAI検索対策を制作会社が受けるとき：確認の流れと責任の分け方",
      lead: "医療・歯科、健康食品・化粧品、保険・金融、士業など広告の決まりがある業種では、AIに読ませるために足すFAQ・構造化データ・llms.txtも、ふつうのページと同じ基準で確かめてください。医療広告ガイドラインはウェブサイトを規制の対象とし、依頼を受けて広告を作った広告代理店も依頼主とともに指導の対象になりうると書いています。制作会社は受ける前に、事実の出典は事業者が出す、公開前に事業者の確認者が承認する、承認した版を残す、の3点を契約に書いておくのが安全です。",
      intro: [
        "作成日：2026年11月27日（日本時間）。厚生労働省の医療広告等ガイドライン（2026年3月30日最終改正）と事例解説書（第6版）、消費者庁のステルスマーケティングと健康食品の資料を同じ日に読んで確認しました。",
        "この記事は、医療機関・健康食品のメーカー・保険代理店・士業事務所などのサイトを作り、AI検索対策を頼まれた制作会社・代理店向けです。法律の判断は事業者と専門家が行うもので、この記事は法的な助言ではありません。また、AIの回答は日や聞き方で変わり、確認を丁寧にしてもAIに必ず出るわけではありません。",
      ],
      sections: [
        {
          heading: "上位の記事に書かれていなかったこと",
          paragraphs: [
            "「医療広告ガイドライン AI検索対策」「規制業種 AIO」「regulated industries AEO compliance」などで上位に出る日本語4本・英語7本を、2026年11月27日に読みました。医療の記事は「構造化データを入れても、ガイドラインで禁止されたことを書いてよいわけではない」と書いており、英語の記事には段階ごとの承認の流れを示したものもありました。一方で、次のことはどの記事にもありませんでした。",
          ],
          list: [
            "制作会社と事業者のどちらが何に責任を持つか、契約にどう書くか",
            "FAQ・構造化データ・llms.txt・代替テキストのそれぞれで、何を確かめるか",
            "WordPressで、承認していない内容を出さない・載せたくないページを外す手順",
            "承認した版をどう残すか、AIの回答をどう確かめるか",
          ],
          after: [
            "以下では、この4つを埋めます。",
          ],
        },
        {
          heading: "AIに読ませる部分も、サイトの一部として見られる",
          paragraphs: [
            "AI向けの部分は「人が見ない裏側」と考えがちですが、FAQはページに表示され、構造化データとllms.txtも誰でも開ける公開ファイルです。行政の資料で確かめられたことは次のとおりです。",
          ],
          table: {
            head: ["分かっていること", "出典"],
            rows: [
              ["医療の広告は「誘引性（受診を誘う意図）」「特定性（病院・診療所の名前が分かる）」「医療に関する内容」の3つで判断する。ウェブサイトも規制の対象", "医療広告等ガイドライン（2026-03-30最終改正）"],
              ["「これは広告ではありません」と書いても、病院名や連絡先で特定できれば広告に当たりうる。費用を出したステルスマーケティングも広告として扱う", "同上"],
              ["規制は「何人も」が対象で、広告代理店やアフィリエイターも含む。依頼を受けて広告を作った広告代理店などは、違反があれば依頼主とともに指導の対象になりうる", "同上（第2の6）"],
              ["病院が頼んだり費用を出したりした口コミ・体験談は広告として扱う。患者の主観による体験談の広告は禁止（職員が書いたもの、口コミサイトから写したものも含む）", "同上、事例解説書（第6版）p.23〜27"],
              ["広告できる事項の制限を外す「限定解除」には、自ら情報を求めて見るサイトであること、問い合わせ先、自由診療なら通常必要な治療内容と費用、主なリスクと副作用の4つが要る", "事例解説書（第6版）p.4"],
              ["治療前後の写真には、治療内容・費用・主なリスクと副作用を写真の近くに書く（リンク先だけは不可）", "事例解説書（第6版）p.29〜31"],
              ["ステルスマーケティングは2023年10月1日から景品表示法違反。規制されるのは商品・サービスを提供する事業者（依頼を受けたインフルエンサーではない）", "消費者庁"],
              ["健康食品の誇大な表示を禁じる健康増進法の規定は「何人も」が対象で、広告代理店や媒体も含みうる。景品表示法の対象は商品を提供する事業者", "消費者庁「いわゆる健康食品に関する景品表示法及び健康増進法上の留意事項」（2013年作成・2015年一部改定の版。最新版は消費者庁で確認）"],
            ],
          },
          after: [
            `出典：[医療広告等ガイドライン](${SRC.mhlwGuideline})、[医療広告規制におけるウェブサイト等の事例解説書（第6版）](${SRC.mhlwCasebook})、[消費者庁 ステルスマーケティング](${SRC.caaStema})、[健康食品の留意事項](${SRC.healthFood})。`,
            "llms.txtや構造化データを名指しした行政の説明は、読んだ資料には見当たりませんでした。それでも、病院名が入り受診を誘う内容である以上、ページと同じ基準で確かめておくのが安全です。少なくとも「AI向けだから書いてよい」という扱いはどこにも書かれていません。",
          ],
        },
        {
          heading: "AI対策で足す部分ごとに、確かめること",
          paragraphs: [
            "AI対策の作業で手を入れる場所ごとに、規制業種で問題になりやすい点をまとめました。業種を問わず、まず事実が出典と合っているか、次に誇大・比較・体験談に当たらないかを見ます。",
          ],
          table: {
            head: ["手を入れる場所", "問題になりやすいこと", "確かめ方"],
            rows: [
              ["FAQの質問と答え（本文とFAQPage）", "「痛くない」「必ず治る」「業界最安」のような断定。答えを短くしたために、条件やリスクが抜ける", "答えの条件（対象・回数・費用・リスク）を本文と同じだけ書く。短くするなら本文の詳しいページへのリンクを残す"],
              ["構造化データの説明文・サービス名・料金", "本文にない効果の説明、古い料金、自由診療の料金だけでリスクがない", "本文と同じ文言・同じ料金にする。本文を直したら構造化データも同じ日に直す"],
              ["llms.txt", "事業の説明文・サービスの説明に、本文より強い言い方が入る。ブログ記事のタイトルがそのまま並ぶ", "説明文は本文から写す。載せたくない記事は外す（下のWordPressの手順）"],
              ["画像の代替テキスト", "治療前後の写真に「劇的に改善」などと書く。写真の近くに必要な説明がない", "写真の内容だけを書き、治療内容・費用・リスクは写真の近くの本文に書く"],
              ["口コミ・お客様の声", "Googleの口コミをサイトに埋め込む・写す、星の評価の構造化データを付ける", "医療では体験談の広告が禁止。サイトには載せない。ほかの業種も、頼んだ口コミは広告として扱う"],
              ["比較表・「おすすめ」", "他院・他社より優れていると読める表現、根拠のない「No.1」", "比較は事実（取扱商品、対応時間など）に限り、出典と調べた日を書く"],
              ["著者・監修者（Person）", "監修していない人の名前、資格の書き方の誤り", "監修した範囲と日付を本人に確かめ、資格は登録どおりに書く"],
            ],
          },
          after: [
            "医療・歯科の詳しい書き方は[クリニックのAI検索対策](/guide/medical-clinic-ai-search)と[歯科医院のAI検索対策](/guide/dental-clinic-ai-search)、保険代理店の取扱保険会社や比較推奨の書き方は[保険代理店のAI検索対策](/guide/insurance-agency-ai-search)にまとめています。",
          ],
        },
        {
          heading: "業種ごとの確認先",
          paragraphs: [
            "業種によって、最後に確かめる相手が違います。制作会社が決めるのではなく、事業者に「誰が確認するか」を最初に聞いてください。",
          ],
          table: {
            head: ["業種", "主な決まり", "事業者側の確認者の例"],
            rows: [
              ["病院・診療所・歯科・美容医療", "医療法と医療広告等ガイドライン", "院長、事務長。迷う点は都道府県などの医療広告の窓口"],
              ["健康食品・サプリメント", "健康増進法、景品表示法、医薬品医療機器等法（薬機法）", "品質保証・薬事の担当者"],
              ["化粧品・医薬部外品", "医薬品医療機器等法、景品表示法", "薬事の担当者"],
              ["保険代理店", "保険業法と保険会社の募集文書の審査", "代理店の責任者と、取り扱う保険会社の審査部署"],
              ["弁護士・税理士などの士業", "各士業の法律と、所属する会の広告に関する規程", "事務所の代表者"],
              ["すべての業種", "景品表示法（優良誤認・有利誤認・ステルスマーケティング）", "事業者の代表者または法務"],
            ],
          },
        },
        {
          heading: "確認の流れ：6つの段階と、それぞれの担当",
          paragraphs: [
            "上位の記事の承認の流れは、担当が「コンプライアンス」「法務」とだけ書かれ、制作会社と事業者の分担がありませんでした。制作会社が受ける場合の分担は次のとおりです。",
          ],
          list: [
            "分類する（制作会社）：手を入れるページと部分を一覧にし、料金・効果・リスク・比較・体験談を含むものに印を付ける。印のないもの（住所・営業時間・アクセスなど）は確認を軽くしてよいか、事業者と決める。",
            "事実の台帳を作る（事業者が出し、制作会社がまとめる）：料金、治療・商品・サービスの内容、リスクと副作用、資格・登録番号、取扱商品を、出典の書類と日付つきで1つの表にする。AI対策の文章は、この台帳にある事実だけで書く。",
            "下書きする（制作会社）：本文・FAQ・構造化データ・llms.txtの説明文を、台帳の言葉で書く。AIに下書きさせた場合はそのことを記録し、人が台帳と1行ずつ照らす。",
            "確認と承認（事業者の確認者）：画面のスクリーンショットだけでなく、構造化データとllms.txtの中身も送る。変わった箇所が分かる差分にすると確認が速い。",
            "公開する（制作会社）：承認された版だけを公開する。公開後にページ・構造化データ・llms.txtが承認した内容と同じかを確かめる。",
            "記録と見直し（制作会社が保存、事業者が見直しを決める）：承認日・承認者・対象ページ・公開した版を残す。料金や制度が変わったとき、決めた周期ごとに見直す。",
          ],
        },
        {
          heading: "契約・発注書に書いておくこと",
          paragraphs: [
            "責任の分け方は、口約束ではなく契約か発注書に書いておきます。次は条項の例です。自社の契約に入れる前に、弁護士に確認してください。",
          ],
          code: CONTRACT_JA,
          after: [
            "ポイントは、事実と法令の最終判断は事業者、文章にすることと記録は制作会社、と分けることです。医療広告等ガイドラインは、依頼を受けて広告を作った代理店にも虚偽・誇大にならないよう注意を求めているため、「事業者が承認したから制作会社は無関係」とは言い切れません。おかしいと思った点を指摘した記録も残してください。",
          ],
        },
        {
          heading: "生成AIで下書きを作るとき",
          list: [
            "患者・顧客の名前や相談内容をAIに入れない。台帳の事実だけを渡す",
            "AIは条件を省いて言い切る文章を書きやすい。「必ず」「絶対」「最安」「No.1」「痛くない」などを検索して確かめる",
            "AIが足した事実（統計、症例数、他社との比較）は、台帳になければ消す",
            "医療ではAIが書いた「患者の声」風の文章も体験談に当たりうる。作らない",
            "AIで下書きしたことと、確かめた人を記録に残す",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEOを使う場合）",
          paragraphs: [
            "無料のNurevo AEOには、承認していない内容を出さないために使える機能があります。",
          ],
          list: [
            "Nurevo のサービスからの提案は管理画面に表示され、管理者が「適用」を押すまで反映されません。承認を待つ間は押さないでください。",
            "llms.txtに載るのは、事業者名と説明文、住所などの基本情報、最近更新した投稿・固定ページ30件のタイトルとURL、商品、サービスです。説明文とサービスの説明は本文から写し、載せたくない記事は編集画面のサイドバー「Nurevo AEO」で llms.txt から外せます。",
            "同じサイドバーで、そのページに Nurevo の構造化データを出さない設定もできます。確認が済んでいないページは、承認まで外しておけます。",
            "FAQは「Nurevo FAQ」ブロック（または [nurevo_faq] ショートコード）を置いたページにだけ表示され、そのページにだけ FAQPage として出ます。ページに見えない質問が構造化データだけに入ることはありません。",
            "「Nurevo AEO > 設定 > ツール」（または wp nurevo export）で、事業者情報・FAQ・サービスをJSONで書き出せます。承認した日の版として保存しておくと、あとで何を出していたかを示せます。",
            "0.9.1 から SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても構造化データは重なりません。Yoast SEO・Rank Math・All in One SEO では、そのプラグインの構造化データに足りない事実だけを足します。",
          ],
          after: [
            `プラグインは[WordPress.orgから無料で入れられます](${WP_ORG})。Nurevo は文章の適法性を判断しません。確かめるのは事業者と専門家です。`,
          ],
        },
        {
          heading: "AIの回答を確かめる",
          paragraphs: [
            "規制業種で気をつけたいのは、AIが自社について誤った効果や古い料金を答えることです。月に1回、患者や顧客が聞きそうな質問（「〇〇市でインプラントの費用は」「〇〇保険の相談ができる代理店は」など）でAIに聞き、答えと出典を記録します。誤りがあれば、まず自社サイトと掲載先の情報を直します。掲載先の直し方は[ポータル・比較サイトの自社情報の直し方](/guide/fix-business-listings-ai-search)を参照してください。",
            "Nurevo の無料のAI診断では、月に1回、Perplexity に3つの質問をして結果を残せます。Pro（月14,800円〜）では Perplexity での登場を続けて測り（ChatGPT は設定され次第）、回答の抜粋を残します。抜粋は、誤った説明が出ていないかを事業者と一緒に確かめる材料になります。",
            "制作会社向けには、社名・ロゴ入りの月次レポート、複数サイトをまとめて見るダッシュボード、紹介したお客様の月額の40%（Stripe手数料控除後、承認制）の紹介報酬があります。詳しくは[パートナープログラム](/partner/)をご覧ください。",
          ],
        },
        {
          heading: "受ける前のチェックリスト",
          list: [
            "事業者の業種に当てはまる決まりと、確認者（氏名・役職）が決まっている",
            "料金・内容・リスク・資格の事実が、出典つきの台帳になっている",
            "FAQ・構造化データ・llms.txt・代替テキストも確認の対象だと契約に書いた",
            "事実と法令の最終判断は事業者、文章と記録は制作会社と分けて書いた",
            "承認していない内容は公開しない、と決めた",
            "生成AIを使うことを伝え、個人情報を入れないと決めた",
            "医療では口コミ・体験談・星の評価をサイトに載せない",
            "治療前後の写真には、近くに治療内容・費用・リスクを書いた",
            "承認した版（日付・承認者・ページ）を残す場所を決めた",
            "料金や制度が変わったときと、決めた周期で見直す",
          ],
        },
      ],
      faqs: [
        { q: "llms.txtや構造化データも広告規制の対象ですか？", a: "読んだ行政の資料に、llms.txtや構造化データを名指しした説明はありませんでした。ただし誰でも開ける公開ファイルで、病院名が入り受診を誘う内容なら、ページと同じ基準で確かめるのが安全です。" },
        { q: "事業者が承認すれば、制作会社に責任はありませんか？", a: "そうとは言い切れません。医療広告等ガイドラインは、依頼を受けて広告を作った広告代理店などに虚偽・誇大にならないよう注意を求め、違反があれば依頼主とともに指導の対象になりうると書いています。気づいた点を指摘した記録を残してください。" },
        { q: "クリニックのサイトにGoogleの口コミを載せてもよいですか？", a: "医療では、患者の主観による体験談の広告は禁止されており、事例解説書は口コミサイトから写したものも含めています。サイトへの埋め込みや星の評価の構造化データは避けてください。" },
        { q: "FAQを短くすると条件が抜けてしまいます。", a: "答えには対象・費用・回数・リスクなどの条件を残し、長くなる部分は詳しいページへのリンクにしてください。AIは短い答えを抜き出しやすいので、条件のない断定は避けます。" },
        { q: "生成AIで書いたFAQは使えますか？", a: "使えますが、事業者の台帳にある事実だけを渡し、人が1行ずつ照らしてから事業者に承認してもらってください。AIが足した統計や比較は、出典がなければ消します。" },
        { q: "確認に時間がかかり、月額の作業が進みません。", a: "住所・営業時間・アクセスなど料金や効果を含まない部分は確認を軽くする、と最初に事業者と決めておくと進みます。料金・効果・リスク・比較・体験談を含む部分だけ、必ず承認を取ります。" },
        { q: "AIが誤った効果を答えていたら、どうすればよいですか？", a: "まず自社サイトと掲載先の情報が正しいかを確かめて直し、回答と出典を記録してください。AIの回答は変動するため、直してもすぐ変わるとは限りません。月に1回、同じ質問で確かめます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、お客様のサイトがAIにどう読まれているかを見る",
        body: "無料のAI診断は登録不要で、構造化データ・llms.txt・AI検索のクローラーを許可しているかを確かめられます。WordPressなら、Nurevo AEOで事業者情報とFAQを無料で整えられます。",
        label: "AIへの読まれやすさを無料で診断",
        href: "/check",
        secondary: { label: "WordPress.orgから無料で入れる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの商標、PerplexityはPerplexity AIの商標、GoogleはGoogle LLCの商標です。WordPress、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、Stripeはそれぞれの権利者の商標です。名称は公開情報を伝えるためにだけ使っており、Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "AI Search for Regulated Clients: An Agency Review Process | Nurevo",
      description: "In healthcare, supplements and finance, the FAQ, schema and llms.txt you add for AI are still marketing. How agencies split responsibility and run reviews.",
      h1: "AI search work for regulated clients: an agency review process and who is responsible for what",
      lead: "When a client works in a regulated industry (healthcare, dietary supplements, cosmetics, insurance, financial services, law), review the FAQ, structured data and llms.txt you add for AI to the same standard as the rest of the site. The FTC says anyone who takes part in deceptive marketing is potentially liable and has acted against ad agencies, and FINRA requires a principal to approve retail communications before use. Before taking the work, put three things in the contract: the client supplies the facts and their sources, the client's named reviewer approves every change before it goes live, and the agency keeps the approved versions.",
      intro: [
        "Written November 27, 2026 (JST). We read the FTC's Health Products Compliance Guidance, FINRA Rule 2210, FINRA Regulatory Notice 26-14 and the 2026 FINRA oversight report on communications, plus Japan's medical advertising guideline, on the same day.",
        "This guide is for web, SEO and marketing agencies asked to do AI search work for clinics, supplement and cosmetics brands, insurance agencies, financial firms or law firms. It is not legal advice: whether content meets the rules is for the client and its counsel or compliance team to decide. AI answers also change from day to day, and careful review does not guarantee that an AI will mention the client.",
      ],
      sections: [
        {
          heading: "What the top articles leave out",
          paragraphs: [
            "On November 27, 2026 we read seven English and four Japanese articles that rank for searches such as \"regulated industries AEO compliance\" and \"GEO healthcare financial services\". The best of them set out risk tiers and a step-by-step approval workflow, and one Japanese clinic article warns that structured data does not make prohibited claims acceptable. None of them covered:",
          ],
          list: [
            "how responsibility is split between the agency and the client, and how to write that into a contract",
            "what to check in each AI-facing part: FAQ, structured data, llms.txt and alt text",
            "how to keep unapproved content off the site, and leave pages out, in WordPress",
            "how to keep approved versions and how to check what AI answers say",
          ],
          after: ["The rest of this guide fills those four gaps."],
        },
        {
          heading: "AI-facing content is still marketing",
          paragraphs: [
            "It is easy to think of AI-facing content as a hidden back end. It isn't: the FAQ is shown on the page, and structured data and llms.txt are public files anyone can open. Here is what the primary sources say.",
          ],
          table: {
            head: ["What the source says", "Source"],
            rows: [
              ["FTC advertising law applies to any health-related product and claim, not just supplements. Health benefit claims generally need competent and reliable scientific evidence, usually randomized controlled trials. Anecdotal evidence, including surveys of consumer experiences, is never enough", "FTC Health Products Compliance Guidance (December 2022)"],
              ["\"Anyone participating in deceptive marketing is potentially liable\". The FTC has brought actions against ad agencies as well as the companies selling the product", "Same"],
              ["Testimonials showing better results than buyers can generally expect are likely deceptive, and \"results not typical\" does not fix that", "Same"],
              ["A retail communication is one sent or made available to more than 25 retail investors within 30 days. A qualified registered principal must approve each one before it is used or filed. Communications must be fair and balanced, with no false, exaggerated, promissory or misleading claims and no performance projections", "FINRA Rule 2210 (a), (b)(1)(A), (d)(1)"],
              ["Communications records are kept for the period SEA Rule 17a-4(b) requires, with the approving principal and the approval date", "FINRA Rule 2210 (b)(4)"],
              ["FINRA proposed replacing pre-use principal approval with risk-based written procedures, noting that pre-use approval is hard to apply to AI-generated communications. Content standards would not change", "FINRA Regulatory Notice 26-14 (July 9, 2026; comments closed September 11, 2026)"],
              ["Firms should make sure GenAI-generated communications comply with the rules, supervise and keep chatbot communications, and describe their own use of AI accurately", "FINRA 2026 Annual Regulatory Oversight Report"],
              ["Japan: websites are covered by the medical advertising rules, a \"this is not an advertisement\" line does not take a page out of scope, and ad agencies that create a non-compliant ad on commission can be subject to guidance together with the advertiser", "Japan MHLW medical advertising guideline (last amended March 30, 2026)"],
            ],
          },
          after: [
            `Sources: [FTC Health Products Compliance Guidance](${SRC.ftcHealth}), [FINRA Rule 2210](${SRC.finra2210}), [FINRA Regulatory Notice 26-14](${SRC.finra2614}), [FINRA 2026 oversight report: communications with the public](${SRC.finraReport}), [MHLW medical advertising guideline (Japanese)](${SRC.mhlwGuideline}).`,
            "None of the sources we read names llms.txt or structured data. But a public file that names the business and promotes its services looks like marketing, so review it to the same standard as the page. Nothing we read treats \"it's only for AI\" as an exception.",
          ],
        },
        {
          heading: "What to check in each part you add for AI",
          paragraphs: [
            "These are the places AI search work touches and what tends to go wrong in regulated industries. In every industry, check first that each fact matches its source, then that nothing reads as exaggerated, as a comparison or as a testimonial.",
          ],
          table: {
            head: ["Where you work", "What tends to go wrong", "How to check"],
            rows: [
              ["FAQ questions and answers (page and FAQPage)", "Absolute claims (\"painless\", \"guaranteed\", \"lowest price\"). Shortened answers that drop conditions or risks", "Keep the conditions (who it's for, how many sessions, cost, risks) in the answer. If it has to be short, link to the full page"],
              ["Structured data descriptions, service names, prices", "Benefit claims that are not on the page, old prices, a price with no risk information", "Use the same wording and prices as the page. When the page changes, update the structured data the same day"],
              ["llms.txt", "A business or service description stronger than the page copy. Blog post titles listed as they are", "Copy descriptions from the page. Leave out posts that should not be listed (see the WordPress steps)"],
              ["Image alt text", "\"Dramatic results\" on before-and-after photos, with the needed details nowhere near", "Describe only what the image shows. Put the treatment, cost and risks in the text next to it"],
              ["Reviews and testimonials", "Embedding or copying Google reviews, adding star-rating markup", "Testimonials need the same substantiation as any claim. In healthcare, check the rules (Japan bans patient testimonials in medical advertising outright). Treat reviews the client asked for as advertising"],
              ["Comparison tables, \"best\" lists", "Superiority claims with no basis, unsupported \"No. 1\"", "Compare facts only (products carried, hours, licences), with a source and the date checked"],
              ["Authors and reviewers (Person)", "Names of people who did not review the page, licences written wrongly", "Confirm what each person reviewed and when; write licences as registered"],
            ],
          },
          after: [
            "For what a clinic or an insurance agency should publish, see the [medical clinic guide](/guide/medical-clinic-ai-search), the [dental clinic guide](/guide/dental-clinic-ai-search) and the [insurance agency guide](/guide/insurance-agency-ai-search).",
          ],
        },
        {
          heading: "Who reviews, by industry",
          paragraphs: [
            "The final reviewer depends on the industry. Don't decide it yourself: ask the client who signs off before you start.",
          ],
          table: {
            head: ["Industry", "Main rules (U.S. examples)", "Client-side reviewer"],
            rows: [
              ["Clinics, dental, aesthetics", "FTC Act and health-claims guidance; state medical and dental board advertising rules; HIPAA for anything involving patients", "Practice owner or medical director, with counsel for difficult cases"],
              ["Dietary supplements, cosmetics", "FTC health-claims guidance; FDA labeling rules", "Regulatory or quality lead"],
              ["Broker-dealers", "FINRA Rule 2210", "Registered principal"],
              ["Insurance agencies", "State insurance laws and carrier marketing review", "Agency principal and each carrier's marketing review"],
              ["Law firms", "State bar advertising rules", "Managing partner"],
              ["All industries", "Rules against deceptive advertising and undisclosed endorsements", "Owner or legal counsel"],
            ],
          },
          after: [
            "The rules vary by state and country. Treat this table as a list of questions to ask the client, not as a statement of what applies to them.",
          ],
        },
        {
          heading: "The review workflow: six steps and who owns each",
          paragraphs: [
            "The workflows in the top articles name owners such as \"compliance\" or \"legal\" but don't say what the agency does and what the client does. Here is the split when an agency does the work.",
          ],
          list: [
            "Classify (agency): list every page and part you will touch, and flag anything that mentions prices, outcomes, risks, comparisons or testimonials. Agree with the client whether unflagged facts (address, hours, directions) can go through a lighter review.",
            "Build a fact sheet (client supplies, agency compiles): prices, what the service or product is, risks and side effects, licences and registration numbers, products carried, each with its source document and date. AI search copy uses only facts on this sheet.",
            "Draft (agency): write page copy, FAQ, structured data and llms.txt descriptions in the fact sheet's wording. If AI wrote the first draft, record that, and have a person check it line by line against the sheet.",
            "Review and approve (client's named reviewer): send the structured data and llms.txt content as well as screenshots. A diff showing what changed makes review faster.",
            "Publish (agency): publish only the approved version, then check that the page, structured data and llms.txt match what was approved.",
            "Record and review (agency keeps records, client sets the review cycle): keep the approval date, approver, pages and published version. Review when prices or rules change, and on the agreed cycle.",
          ],
        },
        {
          heading: "What to put in the contract",
          paragraphs: [
            "Write the split of responsibility into the agreement or statement of work, not just an email thread. These are example clauses. Have counsel review them before you use them.",
          ],
          code: CONTRACT_EN,
          after: [
            "The key is the split: the client owns the facts and the final regulatory call, and the agency owns the wording and the records. Since the FTC can act against anyone who takes part in deceptive marketing, \"the client approved it\" does not fully protect the agency. Keep a record of the concerns you raised as well.",
          ],
        },
        {
          heading: "Using generative AI for drafts",
          list: [
            "Never paste patient or customer names or case details into an AI tool; give it only facts from the fact sheet",
            "AI tends to drop conditions and state things absolutely. Search drafts for \"guaranteed\", \"always\", \"best\", \"No. 1\", \"painless\" and similar words",
            "Delete any fact the AI added (statistics, case counts, comparisons) that is not on the fact sheet",
            "Don't let AI write anything that reads like a customer or patient testimonial",
            "Record that AI produced the draft and who checked it",
          ],
        },
        {
          heading: "WordPress steps (with Nurevo AEO)",
          paragraphs: [
            "The free Nurevo AEO plugin has several features that help keep unapproved content off a site.",
          ],
          list: [
            "Suggestions from the Nurevo service appear in wp-admin and change nothing until an administrator clicks Apply. Don't click it until the client has approved.",
            "llms.txt lists the business name and description, basic facts such as the address, the titles and URLs of the 30 most recently updated posts and pages, products and services. Copy descriptions from the page copy. In the editor sidebar, the Nurevo AEO panel can leave a post out of llms.txt.",
            "The same panel can stop Nurevo publishing structured data on a page, so pages that are still in review can stay out until they are approved.",
            "The FAQ is shown only where you place the Nurevo FAQ block (or the [nurevo_faq] shortcode) and is published as FAQPage on that page only. A question can't end up in structured data without being visible on the page.",
            "Nurevo AEO > Settings > Tools (or wp nurevo export) exports the business details, FAQ and services as JSON. Save one on each approval date so you can show what was published.",
            "With Yoast SEO, Rank Math or All in One SEO, Nurevo AEO adds only the facts missing from that plugin's structured data, without a second graph.",
          ],
          after: [
            `The plugin is [free on WordPress.org](${WP_ORG}). Nurevo does not judge whether content complies with any rule. That is for the client and its advisers.`,
          ],
        },
        {
          heading: "Checking what AI answers say",
          paragraphs: [
            "In regulated industries the real risk is an AI stating a wrong benefit or an old price for the client. Once a month, ask AI assistants the questions customers ask (\"what does a dental implant cost in [city]\", \"which agencies in [city] sell [insurer] policies\") and record each answer and its sources. If something is wrong, fix the client's own site and listings first; see [how to fix business listings that AI reads](/guide/fix-business-listings-ai-search).",
            "Nurevo's free AI check asks Perplexity three questions once a month and keeps the results. Pro (from USD 99/month) measures appearances on Perplexity continuously (ChatGPT once configured) and keeps answer excerpts, which you can review with the client for wrong statements.",
            "Nurevo partners get monthly reports under their own name and logo, a dashboard covering all client sites, and a referral commission of 40% of each referred customer's monthly fee, net of Stripe fees (approval required). See the [partner program](/partner/?lang=en).",
          ],
        },
        {
          heading: "Checklist before you take the work",
          list: [
            "The rules that apply and the client's reviewer (name and role) are agreed",
            "Prices, service details, risks and licences are on a fact sheet with sources",
            "The contract says FAQ, structured data, llms.txt and alt text are in scope for review",
            "The contract gives the facts and the regulatory call to the client, and the wording and records to the agency",
            "Nothing goes live without approval",
            "The client knows when you use generative AI, and no personal data goes into it",
            "Testimonial and review content has been checked against the rules for the industry",
            "Before-and-after images have the treatment, cost and risks next to them",
            "There is a place to keep approved versions (date, approver, pages)",
            "Content is reviewed when prices or rules change, and on a fixed cycle",
          ],
        },
      ],
      faqs: [
        { q: "Do advertising rules apply to llms.txt and structured data?", a: "None of the regulator documents we read names them. They are public files that name the business and promote its services, so the safe course is to review them to the same standard as the page." },
        { q: "If the client approves everything, is the agency off the hook?", a: "Not necessarily. The FTC says anyone who takes part in deceptive marketing is potentially liable and has brought cases against ad agencies. Keep records of the concerns you raised as well as the approvals." },
        { q: "Can a clinic show Google reviews on its website?", a: "It depends on where the clinic is and which rules apply. Testimonials need the same substantiation as any claim, and some countries, Japan among them, ban patient testimonials in medical advertising. Ask the client's counsel before you embed reviews or add rating markup." },
        { q: "Short FAQ answers lose the conditions. What should we do?", a: "Keep the conditions (who it's for, cost, sessions, risks) in the answer and link to the full page for the rest. AI systems often lift short answers word for word, so avoid unconditional statements." },
        { q: "Can we use AI to draft the FAQ?", a: "Yes, if you give it only facts from the client's fact sheet, a person checks every line, and the client approves before anything is published. Delete any statistic or comparison the AI added that has no source." },
        { q: "Review is slowing down our monthly work.", a: "Agree at the start that facts with no prices or outcomes (address, hours, directions) get a lighter review. Require full approval only for content that covers prices, outcomes, risks, comparisons or testimonials." },
        { q: "An AI is stating a wrong benefit about our client. What now?", a: "Check and fix the client's site and listings first, then record the answer and its sources. AI answers change over time, so a fix may not show up straight away. Re-ask the same questions monthly." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your client's site",
        body: "The free check needs no sign-up and shows structured data, llms.txt and whether AI search crawlers are allowed. On WordPress, Nurevo AEO sets up the business facts and FAQ for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Install free from WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI; Perplexity is a trademark of Perplexity AI; Google is a trademark of Google LLC. WordPress, Yoast SEO, Rank Math, All in One SEO and Stripe are trademarks of their respective owners. Names are mentioned only to report published information. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
