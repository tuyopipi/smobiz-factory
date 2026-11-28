// Content page (agencies): how a web agency estimates AI search (AEO/GEO/
// LLMO) work — split the work into four parts, list what drives the hours
// for each task, measure your own hours on the first clients, build the
// price from hours × rate + tools + contingency, write the assumptions and
// exclusions on the quote, and (Japan) what 取適法 / フリーランス法 require
// when the work is subcontracted. Separate from agency-aeo-monthly-service
// (what a retainer covers; one paragraph on pricing) and
// agency-aeo-first-audit-proposal (the pre-sale audit and proposal).
//
// Written 2026-11-28 11時 (JST).
//
// Outside facts and where they were read (2026-11-28):
// - stellagent.ai AI検索ドック「AIO対策・LLMO対策の費用相場は？ 公開料金95件」
//   (2026-10-07, updated 11-08; prices checked 2026-10-06): 対策支援（月額）
//   27 public, min 1万 / median 27.5万 / max 70万; 国内計測ツール 10 public,
//   5,990円 / 39,900円 / 10万円; 海外ツール 5 public 29–300 USD, median 95;
//   診断 17 public, 1万 / 15万 / 90万; 一括支援 6 public, 10万 / 30万 / 90万;
//   記事 1本 5 public, 1万 / 3.3万 / 8万; 最低契約期間: 27 monthly entries —
//   6か月 10, 3か月 1, 1か月〜 3, 記載なし 13.
// - 0120.co.jp aio-37 (2026-04-01, updated 10-22): PRIZMA survey 418 people
//   (2026-07-23〜27, PR TIMES 2026-08-06): over half answered 月30〜50万円.
//   Self-run estimate (the vendor's own assumption): 63〜120時間/月; content
//   20〜40h, technical/JSON-LD 10〜20h, analysis/report 10〜15h, citation
//   15〜30h, PM 5〜10h, llms.txt 3〜5h.
// - shopowner-support.net (Zenken, 2026-09-03): vendor public prices checked
//   2026-09-03; measurement tools 無料〜月109,780円; spot diagnosis 110,000円;
//   implementation 330,000円〜; ongoing 月55,000円〜550,000円以上 (税込換算).
// - HubSpot "How much does AEO cost?" (updated 2026-09-08): one-time audit or
//   sprint from about $3,000; ongoing programs about $9,000–$15,000+/mo;
//   self-serve monitoring tools about $29–$489/mo. HubSpot's own estimate.
// - Stackmatix (2026-03-12): audit 10–20 hrs, strategy 15–30 hrs, monthly
//   implementation 5–10 hrs, training 4–8 hrs (consulting engagements).
// - Nutshell (2026-04-17, updated 09-28) and WebFX (2026-10-15, modified
//   10-22): agency $1,500–$50,000+/mo; hourly $50–$300.
// - 内閣府政府広報 entry-9983 / 中小企業庁 ミラサポplus 30416 (2025-11-18,
//   updated 2026-04-16): 取適法 施行 2026-01-01; 下請法の名称変更; 情報成果物
//   作成委託・役務提供委託 (general) 資本金5千万円超→5千万円以下 (or 1千万超
//   5千万以下→1千万以下), or 従業員100人超→100人以下; 発注内容（給付の内容、
//   代金の額、支払期日、支払方法等）を書面又は電磁的方法で明示 (email possible
//   without consent); 支払期日 受領日から60日以内のできる限り短い期間; 手形払
//   禁止; 協議に応じない一方的な代金決定の禁止; 振込手数料を負担させない;
//   取引記録2年保存; 不当な給付内容の変更・やり直しの禁止.
// - 公正取引委員会 取適法 運用基準 (全部改正 令和7年10月1日 通達第13号, 改正
//   令和8年10月1日 通達第14号): 法第4条第1項の明示; 第4 受領拒否 違反行為事例
//   1－8: 「ホームページの制作を委託していたが、発注元からの仕様の変更を理由に
//   …」. 中小企業庁セミナー資料 (令和8年4月28日) slide 17: 明示事項12項目,
//   未定事項は理由と予定期日.
// - 公正取引委員会 フリーランス法特設サイト: 施行 2024-11-01; 従業員を使用
//   しない事業者; 書面またはメール・SNSのメッセージ等, 口頭NG; 9 items;
//   支払期日 受領日から60日以内 (再委託は30日以内の例外).
// Not stated: market hourly rates in Japan; whether a specific AI search
// task falls under 情報成果物作成委託 or 役務提供委託 (we say to check);
// unverified survey numbers in the dev.to/ThatDevPro piece (Credo, Pulse,
// SparkToro) — not used; 310 Creative's ranges (internally inconsistent) —
// not used.
//
// Nurevo facts (readme 0.9.x, LP): Free 0円 (score, one-click fixes,
// server-rendered JSON-LD, llms.txt, AI crawler rules, SEO plugin
// coexistence); Standard 月3,000円 / USD 20; Pro 月14,800円〜 / USD 99 (beta,
// Perplexity now, ChatGPT when configured); Free AI check: once a month,
// three questions to Perplexity; settings export/import JSON (Settings >
// Tools) excluding keys/tokens; WP-CLI wp nurevo status|diagnose|export|
// import; multisite network activation; 0.9.1 coexists with SEO SIMPLE PACK
// and VK All in One Expansion Unit. Partner program: branded reports,
// multi-site dashboard, 40% referral after Stripe fees (approval required).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  stellagent: "https://stellagent.ai/ja/ai-search-dock/blog/ai-search-cost",
  kadai: "https://0120.co.jp/blog/aio-37/",
  zenken: "https://www.shopowner-support.net/customer_attraction_information/online/seo/aio-cost/",
  hubspot: "https://blog.hubspot.com/marketing/how-much-does-aeo-cost",
  stackmatix: "https://www.stackmatix.com/blog/aeo-services-pricing",
  nutshell: "https://www.nutshell.com/blog/geo-costs",
  webfx: "https://www.webfx.com/blog/seo/geo-pricing/",
  govOnline: "https://www.gov-online.go.jp/article/202511/entry-9983.html",
  mirasapo: "https://mirasapo-plus.go.jp/infomation/30416/",
  jftcUnyou: "https://www.jftc.go.jp/toriteki/legislation/unyou.html",
  chushoSeminar: "https://www.chusho.meti.go.jp/keiei/torihiki/toriteki_shinko_seminar/jftc.pdf",
  freelance: "https://www.jftc.go.jp/freelancelaw_2024/",
};

const SHEET_JA = `【AI検索対策 見積もりの計算表（自社の数字を入れて使う）】
区分        作業                         数量の単位        1単位の工数  数量  工数
初回診断    サイトとAIの回答の確認       質問の数              ◯分     ◯    ◯時間
初期実装    事実の台帳（事業者情報）     拠点の数              ◯分     ◯    ◯時間
初期実装    構造化データ                 ページの種類          ◯分     ◯    ◯時間
初期実装    llms.txt                     サイト                ◯分     1    ◯時間
初期実装    FAQの作成と確認              質問の数              ◯分     ◯    ◯時間
初期実装    AIクローラーの設定           サイト                ◯分     1    ◯時間
初期実装    掲載先（地図・ポータル）     掲載先の数            ◯分     ◯    ◯時間
月次運用    変更の反映と確認             月                    ◯分     1    ◯時間
計測と報告  AIの回答の記録               質問×AI×回数          ◯分     ◯    ◯時間
計測と報告  報告書と打ち合わせ           月                    ◯分     1    ◯時間
------------------------------------------------------------------------------
作業時間の合計 × 時間単価 ＋ ツール代（実費）＋ 予備（合計の◯%）＝ 見積額
※ 1単位の工数は、最初の3件で記録した実測の中央値を入れる。`;

const SHEET_EN = `[AI search estimate sheet: fill in your own numbers]
Phase        Task                          Unit                    Time/unit  Qty  Hours
Audit        Site and AI answer check      prompts                 X min      X    X h
Setup        Fact sheet (business data)    locations               X min      X    X h
Setup        Structured data               page templates          X min      X    X h
Setup        llms.txt                      site                    X min      1    X h
Setup        FAQ drafting and review       questions               X min      X    X h
Setup        AI crawler rules              site                    X min      1    X h
Setup        Listings (maps, directories)  listings                X min      X    X h
Monthly      Apply changes and re-check    month                   X min      1    X h
Measurement  Record AI answers             prompts x engines x runs X min     X    X h
Measurement  Report and call               month                   X min      1    X h
-----------------------------------------------------------------------------------
Total hours x hourly rate + tools (at cost) + contingency (X% of total) = quote
* Time per unit = the median of what you logged on your first three clients.`;

const TERMS_JA = `【見積書・発注書に書く前提条件の例】
1. 対象：〇〇（サイトのURL）の本文・FAQ・構造化データ・llms.txt・robots.txt。
   対象ページは別紙の一覧のとおり（◯ページ）。拠点は◯か所。
2. 含まない作業：記事の新規作成、デザインの変更、広告、口コミの依頼、
   別紙にない掲載先の更新。必要な場合は別途お見積もりします。
3. 事実の提供：料金・営業時間・資格などの事実は、お客様が出典とともに提供します。
   確認の返事が◯営業日を超えた場合、納期はその分ずれます。
4. 成果について：AIの回答は日や聞き方で変わるため、AIに表示されること・順位は
   保証しません。お見積もりは作業と成果物（一覧の作業、月次の記録と報告）に対するものです。
5. 計測：毎月、決めた◯個の質問を◯つのAIに◯回ずつ聞き、回答と出典を記録します。
6. ツール代：〇〇（ツール名）は、お客様の名義で契約し、お客様が直接支払います。
7. 変更：対象ページ・質問・拠点の追加は、計算表の単価で再見積もりし、
   合意してから着手します。
8. 契約期間と解約：最低◯か月。解約は◯日前までに通知。解約後もサイトに入れた
   設定と記録はお客様のものとして残ります。`;

const TERMS_EN = `[Assumptions to put on the quote or statement of work — example]
1. Scope: copy, FAQ, structured data, llms.txt and robots.txt on [site URL].
   Pages as listed in Schedule A (X pages). X locations.
2. Not included: new articles, design changes, ads, review requests, listings not
   in Schedule A. Quoted separately if needed.
3. Client inputs: the Client supplies prices, hours, licences and other facts with
   a source. If a review takes longer than X business days, deadlines move by the same.
4. Results: AI answers change by day and by wording. We do not guarantee that an AI
   will show the business or rank it. This quote covers the listed work and
   deliverables (the monthly record and report).
5. Measurement: each month we ask X agreed prompts on X AI engines, X runs each,
   and record the answers and the sources cited.
6. Tools: [tool] is contracted in the Client's name and paid by the Client directly.
7. Changes: added pages, prompts or locations are priced at the unit rates in the
   estimate sheet and started only after written agreement.
8. Term and exit: minimum X months, X days' notice. Settings and records placed on
   the site remain the Client's after the contract ends.`;

export default {
  slug: "agency-aeo-estimate-work-hours",
  targetQueries: [
    "AI検索対策 見積もり 工数",
    "LLMO 対策 見積書 書き方 制作会社",
    "AIO対策 料金 決め方 代理店",
    "how to price AEO services agency hours",
    "GEO service estimate scope of work template",
    "AI search optimization quote agency",
  ],
  related: ["agency-aeo-monthly-service", "agency-aeo-first-audit-proposal", "agency-aeo-client-handover", "measure-ai-visibility", "aeo-tools-comparison"],
  locales: {
    ja: {
      title: "AI検索対策の見積もりの出し方：作業ごとの工数表と見積書に書くこと | Nurevo",
      description: "AI検索対策（AEO・LLMO）の見積もりを、相場ではなく作業ごとの工数から積み上げる手順。工数が増える要因の表、計算表、見積書の前提条件の例、下請けに出すときの取適法の注意をまとめました。",
      h1: "AI検索対策の見積もりの出し方：作業ごとの工数表と、見積書・発注書に書くこと",
      lead: "AI検索対策（AEO・GEO・LLMO）の見積もりは、相場から逆算するのではなく、作業を「初回診断・初期実装・月次運用・計測と報告」の4つに分け、作業ごとに「何で工数が増えるか」を数量にして、自社で測った時間と時間単価を掛けて積み上げるのが確実です。AIに表示されることは保証できないため、金額は成果ではなく作業と成果物に対して出し、対象・含まない作業・変更の扱いを見積書に書きます。他社や個人に作業を出すときは、2026年1月1日に施行された取適法（改正下請法）やフリーランス法の明示事項も確かめてください。",
      intro: [
        "作成日：2026年11月28日（日本時間）。公開されている料金の調査と、公正取引委員会・中小企業庁・政府広報の資料を同じ日に読んで確認しました。",
        "この記事は、AI検索対策をサービスにしたい、またはすでに頼まれて見積もりに困っているWeb制作会社・代理店・フリーランス向けです。サービスの中身（月額で何をするか）は[制作会社がAI対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)、商談前の診断と提案書は[初回診断と提案書の作り方](/guide/agency-aeo-first-audit-proposal)にあります。ここでは金額の出し方だけを扱います。法律の判断は専門家と所管の窓口で確かめてください。この記事は法的な助言ではありません。",
      ],
      sections: [
        {
          heading: "上位の記事に書かれていなかったこと",
          paragraphs: [
            "「AIO対策 費用」「LLMO 見積もり」「AEO pricing agency」などで上位に出る日本語5本・英語7本を、2026年11月28日に読みました。日本語では公開料金を95件数えた調査や、見積書で確かめる項目の一覧があり、英語では予算の段階ごとの金額がよくまとまっていました。ただし、どれも「依頼する側」が相場を知るための記事で、見積もりを作る制作会社の側から見ると、次のことがありませんでした。",
          ],
          list: [
            "作業ごとに、何が増えると工数が増えるのか（ページ数・拠点数・FAQの数・入っているSEOプラグインなど）",
            "自社の工数を測って単価にする方法と、そのまま使える計算表",
            "見積書に書く前提条件（含まない作業、変更の扱い、成果を約束しない書き方）",
            "下請けやフリーランスに出すときの取適法・フリーランス法の決まり",
            "WordPressでの作業時間を減らせるところ",
          ],
          after: [
            "以下では、この5つを埋めます。",
          ],
        },
        {
          heading: "公開されている料金の数字（相場は「売値」で、あなたの原価ではない）",
          paragraphs: [
            "まず、外から見える数字を確かめておきます。これは各社の売値で、制作会社の工数や原価を示すものではありません。自社の価格が高いか安いかを話すときの参考にとどめてください。",
          ],
          table: {
            head: ["分かっていること", "出典"],
            rows: [
              ["公開料金95件のうち、月額の対策支援（27件）は最安1万円・中央値27.5万円・最高70万円。1回の診断（17件）は中央値15万円、国内の計測ツール（10件）は中央値39,900円", "AI検索ドック（ステラジェント、2026年10月6日に確認、11月8日更新）"],
              ["月額の27件のうち、最低契約期間は6か月が10件、3か月が1件、1か月からが3件、記載なしが13件", "同上"],
              ["LLMO対策を外注している従業員30人以上の企業の担当者418人のうち、半数以上が月30万〜50万円と回答", "課題解決プラットフォーム（PRIZMA調査、2026年7月）"],
              ["公式に料金を出している各社の例：計測ツールは無料〜月109,780円、スポット診断110,000円、実装パッケージ330,000円〜、継続支援は月55,000円〜550,000円以上（税込換算）", "キャククル（Zenken、2026年9月3日に確認）"],
              ["英語圏では、1回の監査や短期集中が約3,000ドルから、継続の支援が月約9,000〜15,000ドル以上（HubSpot の目安）。代理店の時間単価は50〜300ドル（Nutshell・WebFX）", "HubSpot（2026年9月8日更新）、Nutshell（9月28日更新）、WebFX（10月22日更新）"],
            ],
          },
          after: [
            `出典：[AI検索ドック 公開料金95件](${SRC.stellagent})、[課題解決プラットフォーム AIO対策の費用相場](${SRC.kadai})、[キャククル AIO対策の費用相場](${SRC.zenken})、[HubSpot](${SRC.hubspot})、[Nutshell](${SRC.nutshell})、[WebFX](${SRC.webfx})。`,
            "幅が大きいのは、記事の制作や広報まで含むかどうかで中身がまったく違うからです。中小の店舗や会社のサイトで、構造化データ・llms.txt・FAQ・掲載先の整合を中心にする場合、記事の量産を含む月30万〜50万円の支援とは作業量が違います。相場に合わせるのではなく、自社がやる作業から金額を出すほうが、お客様にも説明しやすくなります。",
          ],
        },
        {
          heading: "作業を4つに分け、工数が増える要因を数量にする",
          paragraphs: [
            "見積もりの最初の一歩は、作業を分けることです。下の表は、作業ごとに「何が増えると時間が増えるか」と「何があると時間が減るか」をまとめたものです。時間の数字はあえて入れていません。サイトの作り方やチームの慣れで大きく変わるため、次の章の方法で自社の数字を測ってください。",
          ],
          table: {
            head: ["区分と作業", "成果物", "工数が増える要因（数量の単位）", "工数が減る要因"],
            rows: [
              ["初回診断：サイトとAIの回答の確認", "診断の結果と直す箇所の一覧", "確かめる質問の数、AIの数、拠点の数", "無料の診断ツールで技術面を先に確かめる"],
              ["初期実装：事実の台帳", "事業者名・住所・電話・営業時間・料金・資格を出典つきでまとめた表", "拠点の数、料金表の行数、事業者からの返事の速さ", "事業者が最新の料金表や登記の情報を持っている"],
              ["初期実装：構造化データ", "LocalBusiness などのJSON-LDと、その確認の記録", "ページの種類（トップ・サービス・店舗・記事）、既存のテーマやSEOプラグインの出力との重なり", "重複を自動で避けるプラグイン、ページの種類がテンプレートでそろっている"],
              ["初期実装：llms.txt", "サイトの要約と主要ページの一覧", "載せる・外すページの判断の数", "自動で作り、外すページだけ選べる仕組み"],
              ["初期実装：FAQ", "質問と答え（本文とFAQPage）", "質問の数、事業者の確認の回数、規制業種かどうか", "問い合わせ・電話で多い質問の記録がある"],
              ["初期実装：AIクローラーの設定", "robots.txt とサーバー側の設定の確認", "CDNやWAF（不正アクセス対策）がボットを止めているか", "サーバーの管理画面に入れる"],
              ["初期実装：掲載先の整合", "Googleビジネスプロフィール・地図・ポータルの情報をサイトに合わせた記録", "掲載先の数、ログインできない掲載先の数", "事業者が各掲載先の管理権限を持っている"],
              ["月次運用：変更の反映", "変更の記録", "料金・営業時間・スタッフの変更の頻度", "事業者が変更を決まった窓口に送ってくれる"],
              ["計測と報告：AIの回答の記録", "質問ごとの回答・出典の記録", "質問の数 × AIの数 × 回数", "計測ツールでの自動の記録"],
              ["計測と報告：報告と打ち合わせ", "月次の報告書", "打ち合わせの回数、報告の言語・形式", "報告の型が決まっている"],
            ],
          },
          after: [
            "この表の「数量の単位」が、見積書の明細の単位になります。たとえば「FAQの作成」を一式にせず「質問◯問」と書けば、お客様が質問を増やしたいときにそのまま追加の金額を出せます。",
          ],
        },
        {
          heading: "自社の工数を測る：最初の3件で記録する",
          paragraphs: [
            "工数の数字は、他社の記事からではなく、自社の記録から作ります。公開されている目安もありますが、前提が違います。課題解決プラットフォームは自社で運用する場合を月63〜120時間（記事の制作20〜40時間、技術面とJSON-LD 10〜20時間、llms.txt 3〜5時間など）と見積もり、Stackmatix はコンサルティングの監査を10〜20時間、月々の実装を5〜10時間としています。どちらも記事の制作やコンサルティングを含む前提で、中小のサイトの技術的な整備だけを請け負う場合の数字ではありません。",
            `出典：[課題解決プラットフォーム](${SRC.kadai})（同社の想定）、[Stackmatix](${SRC.stackmatix})（2026年3月12日）。`,
          ],
          list: [
            "上の表の作業に、短いコード（診断＝D、台帳＝F、構造化データ＝S、llms.txt＝L、FAQ＝Q、クローラー＝C、掲載先＝P、計測＝M、報告＝R）を付ける",
            "最初の3件は、作業ごとに開始と終了の時刻を記録する。事業者の返事を待つ時間は入れず、「待ち」として別に記録する",
            "作業ごとに、数量（質問の数、拠点の数、ページの種類の数）も一緒に記録する",
            "3件そろったら、作業ごとに「1単位あたりの時間」を出し、中央値を使う（1件だけ極端に長いものに引っ張られないため）",
            "3か月ごとに見直す。慣れや道具で時間が減ったら、価格を下げるか、作業を足して同じ価格にするかを決める",
          ],
          after: [
            "時間単価は、相場ではなく自社の原価から出します。人件費・家賃・ツール代などの年間の固定費を、年間で実際に売上につながる作業時間で割ると、最低限の単価が分かります。その上に利益を乗せたものが、見積もりに使う単価です。",
          ],
        },
        {
          heading: "計算表：工数 × 単価 ＋ ツール代 ＋ 予備",
          paragraphs: [
            "上の記録を、次の計算表に入れます。◯の部分が、自社で測った数字とお客様ごとの数量です。",
          ],
          code: SHEET_JA,
          after: [
            "予備は、事業者の確認が長引く・掲載先にログインできないなど、読めない作業のための上乗せです。上乗せの割合は、最初の数件の「見積もり」と「実際」の差から決めると根拠が説明できます。",
            "ツール代は、作業代と分けて書きます。計測ツールなどはお客様の名義で契約してもらうと、解約後もお客様が記録を持ち続けられ、費用の内訳も明確になります。AI検索ドックの集計では、国内の計測ツールの中央値は月39,900円でした。",
            "初期実装と月額は分けて出します。初期実装は一度きりの作業（台帳・構造化データ・llms.txt・FAQ・クローラー・掲載先）、月額は変更の反映と計測と報告です。月額に初期の作業を薄めて入れると、半年で解約されたときに赤字になります。",
          ],
        },
        {
          heading: "見積書・発注書に書く前提条件",
          paragraphs: [
            "AI検索対策の見積もりでもめやすいのは、「どこまでが含まれるか」と「AIに出なかったらどうするか」です。次の例を、自社の契約に合わせて使ってください。契約書に入れる前に、弁護士に確認してください。",
          ],
          code: TERMS_JA,
          after: [
            "4番の「成果について」は必ず入れます。AIの回答は日や聞き方で変わり、どの制作会社も表示を保証できません。成果報酬（AIに表示されたら支払う）を求められた場合は、どの質問を・どのAIに・何回聞いて・何を「表示」とみなすかを先に決めないと、測り方でもめます。作業と記録に対して料金をいただき、記録で変化を一緒に見る形にしておくのが安全です。",
            "最低契約期間は、AI検索ドックの集計では月額の支援の半数近くが記載していませんでした。書かないと、解約の時期でもめる原因になります。自社の期間と、解約後に何が残るかを見積書の段階で書いておきます。",
          ],
        },
        {
          heading: "作業を他社やフリーランスに出す・受けるとき（取適法とフリーランス法）",
          paragraphs: [
            "広告代理店からAI対策の作業を受ける、あるいは構造化データの実装やFAQの下書きを外部のフリーランスに出す場合は、見積もりと発注の段階で守ることがあります。読んだ資料で確かめられたことは次のとおりです。",
          ],
          table: {
            head: ["分かっていること", "出典"],
            rows: [
              ["下請法は2026年1月1日から「中小受託取引適正化法（取適法）」になった。親事業者は「委託事業者」、下請事業者は「中小受託事業者」と呼び方が変わった", "政府広報オンライン、中小企業庁 ミラサポplus"],
              ["情報成果物作成委託・役務提供委託（一般）では、委託する側が資本金5千万円超で受ける側が5千万円以下（または1千万円超5千万円以下と1千万円以下）、もしくは従業員100人超と100人以下の関係が対象。個人も含む", "政府広報オンライン"],
              ["公正取引委員会の運用基準には、ホームページの制作を委託していた事業者が、発注元からの仕様の変更を理由に受け取りを拒んだ例が、受領拒否の違反行為の事例として載っている", "取適法 運用基準（令和7年10月1日全部改正、令和8年10月1日改正）"],
              ["発注のときに、給付の内容・代金の額・支払期日・支払方法などを書面か電子メールなどで明示する（法第4条）。決まっていない事項は、理由と決める予定の日を書く", "運用基準、中小企業庁セミナー資料（令和8年4月28日）"],
              ["支払期日は受け取った日から60日以内のできる限り短い期間で決める。手形での支払いは禁止。振込手数料を受ける側に負担させるのは減額に当たる", "政府広報オンライン、ミラサポplus"],
              ["受ける側が価格の協議を求めたのに、応じない・必要な説明をしないで一方的に代金を決めることは禁止", "同上"],
              ["フリーランス法（2024年11月1日施行）：従業員を使わない個人などに業務を出すときは、給付の内容・報酬の額・支払期日など9項目を書面かメール・SNSのメッセージなどで明示する。口頭だけは不可。支払期日は受け取った日から60日以内", "公正取引委員会 フリーランス法特設サイト"],
            ],
          },
          after: [
            `出典：[政府広報オンライン](${SRC.govOnline})、[ミラサポplus](${SRC.mirasapo})、[取適法 運用基準](${SRC.jftcUnyou})、[中小企業庁セミナー資料](${SRC.chushoSeminar})、[フリーランス法特設サイト](${SRC.freelance})。`,
            "AI検索対策の作業の一つひとつ（構造化データの実装、FAQの作成、計測など）が情報成果物作成委託と役務提供委託のどちらに当たるか、対象になるかは、取引の形と資本金・従業員の数で変わります。読んだ資料はAI対策を名指ししていないため、迷う場合は公正取引委員会の相談窓口で確かめてください。",
            "見積もりの実務では、上の計算表の明細がそのまま「給付の内容」になります。「AI対策一式」ではなく「構造化データ（ページの種類◯）、FAQ◯問、月次の計測（質問◯×AI◯×◯回）」と書いておくと、明示の義務を満たしやすく、仕様の変更があったときにどこが変わったのかも示せます。発注元の都合で対象が増えたときは、計算表の単価で再見積もりし、合意してから作業します。",
          ],
        },
        {
          heading: "WordPressで工数を減らせるところ（Nurevo AEOを使う場合）",
          paragraphs: [
            "作業時間が単価を決めるので、繰り返しの作業を道具に任せると、同じ価格で利益が残るか、同じ利益で価格を下げられます。無料のNurevo AEOで減らせる作業は次のとおりです。",
          ],
          list: [
            "初回診断：0〜100のAEOスコアと、直す箇所のチェックリストが管理画面に出ます。技術面の確認をここで済ませ、人の時間はAIの回答の確認と事業者への説明に使えます。",
            "構造化データ：事業者情報から JSON-LD をサーバー側で出力します。Yoast SEO・Rank Math・All in One SEO が入っていれば、そのプラグインの構造化データに足りない事実だけを足し、0.9.1 からは SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても重なりません。重複の調査にかかる時間が減ります。",
            "llms.txt：事業者情報と最近更新したページから自動で作られ、載せたくないページは編集画面のサイドバーで外せます。",
            "AIクローラー：AI検索のクローラーは許可し、学習用のクローラーはrobots.txtの設定に任せる既定値になっていて、ワンクリックで切り替えられます。",
            "2件目以降：「Nurevo AEO > 設定 > ツール」で、設定（出力の切り替え・事業者情報・FAQ・サービス）をJSONで書き出し・読み込みできます。キーや接続の情報は含まれません。同じ業種の型を作っておけば、台帳と FAQ の作業の出発点にできます。",
            "複数サイト：WP-CLI の wp nurevo status・diagnose・export・import で、保守しているサイトの状態の確認や設定の書き出しをまとめて行えます。",
            "計測：接続した無料・Standard のサイトでは、月に1回、業種と地域から作った3つの質問を Perplexity に聞き、名前が出たか・サイトが引用されたかを残します。Pro（月14,800円〜、ベータ）では Perplexity での登場を続けて測り（ChatGPT は設定され次第）、競合との比較と履歴を残します。",
          ],
          after: [
            `プラグインは[WordPress.orgから無料で入れられます](${WP_ORG})。見積もりのツール代の行には、Free（0円）、Standard（月3,000円：評価基準の自動更新）、Pro（月14,800円〜：AI登場率の計測、ベータ）のどれを使うかを書きます。`,
            "制作会社向けには、社名・ロゴ入りの月次レポート、複数サイトをまとめて見るダッシュボード、紹介したお客様の月額の40%（Stripe手数料控除後、承認制）の紹介報酬があります。報告書の作業時間を減らす手段として、[パートナープログラム](/partner/)も比べてみてください。",
          ],
        },
        {
          heading: "避けたい見積もり",
          list: [
            "「AIに表示されることを保証」「◯位以内」など、成果を約束する見積もり。AIの回答は変動し、根拠を示せません",
            "「AI対策一式」だけの明細。何が含まれるか分からず、追加の作業でもめます",
            "ツール代を作業代に混ぜる。解約後にお客様が記録を失い、内訳も説明できません",
            "AIの名前を付けただけの上乗せ。中身がふつうのSEOやサイト保守と同じなら、同じ単価で出します",
            "最低契約期間と解約後に残るものを書かない",
          ],
        },
        {
          heading: "見積もりを出す前のチェックリスト",
          list: [
            "作業を初回診断・初期実装・月次運用・計測と報告に分けた",
            "作業ごとに、数量の単位（質問・拠点・ページの種類・掲載先）を決めた",
            "1単位の工数は、自社の実測（最初の3件の中央値）を使った",
            "時間単価を、自社の固定費と売上につながる作業時間から出した",
            "ツール代を作業代と分け、契約の名義を決めた",
            "予備の割合を、見積もりと実際の差から決めた",
            "対象・含まない作業・事実の提供・変更の扱いを見積書に書いた",
            "AIへの表示を保証しないこと、計測の方法を書いた",
            "外部に出す作業は、取適法・フリーランス法の明示事項と支払期日を確かめた",
            "最低契約期間と、解約後に残るものを書いた",
          ],
        },
      ],
      faqs: [
        { q: "AI検索対策の見積もりは、相場に合わせればよいですか？", a: "相場は各社の売値で、作業の中身がまちまちです。公開料金95件の集計では月額の支援の中央値は27.5万円でしたが、記事の制作を含むかどうかで作業量は大きく違います。自社の作業と工数から積み上げ、相場は説明のときの参考にしてください。" },
        { q: "工数の目安を教えてください。", a: "サイトの作り方やチームの慣れで大きく変わるため、この記事では数字を示していません。最初の3件で作業ごとの時間と数量を記録し、1単位あたりの時間の中央値を使ってください。公開されている目安は、記事の制作やコンサルティングを含む前提のものが多いです。" },
        { q: "成果報酬で受けてもよいですか？", a: "AIの回答は日や聞き方で変わるため、成果の定義（どの質問を、どのAIに、何回聞き、何を表示とみなすか）を先に決めないと測り方でもめます。作業と記録に対して料金をいただき、記録で変化を一緒に見る形が安全です。" },
        { q: "初期費用なしの月額だけにできますか？", a: "できますが、初期実装の時間を月額に薄めて入れると、早く解約されたときに赤字になります。初期なしにするなら、最低契約期間を決めて見積書に書いてください。" },
        { q: "広告代理店から受ける場合、何に気をつければよいですか？", a: "資本金や従業員の数の条件に当てはまれば取適法の対象になりえます。発注の内容・代金・支払期日・支払方法を書面かメールで明示してもらい、支払期日は受け取りから60日以内か、仕様の変更で作業が増えたら協議できるかを確かめてください。" },
        { q: "計測ツールの代金は誰が払うべきですか？", a: "お客様の名義で契約してもらうと、解約後もお客様が記録を持ち続けられ、内訳も明確です。制作会社が立て替える場合は、作業代と分けて実費として書きます。" },
        { q: "2件目からは安くできますか？", a: "同じ業種なら、設定の書き出し・読み込みや FAQ の型で台帳と FAQ の時間が減ることがあります。減った分は実測で確かめてから、価格を下げるか作業を足すかを決めてください。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "見積もりの前に、お客様のサイトがAIにどう読まれているかを見る",
        body: "無料のAI診断は登録不要で、構造化データ・llms.txt・AI検索のクローラーを許可しているかを確かめられます。初回診断の時間を減らし、見積もりの数量（直す箇所）を先に数えられます。",
        label: "AIへの読まれやすさを無料で診断",
        href: "/check",
        secondary: { label: "WordPress.orgから無料で入れる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの商標、PerplexityはPerplexity AIの商標、GoogleはGoogle LLCの商標です。HubSpot、WordPress、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、Stripeはそれぞれの権利者の商標です。名称は公開情報を伝えるためにだけ使っており、Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "How to Estimate AI Search (AEO/GEO) Work: Hours, Rates, Scope | Nurevo",
      description: "Price AEO and GEO work from your own hours, not from market ranges: what drives the hours for each task, an estimate sheet, and the assumptions to put on a quote.",
      h1: "How to estimate AI search (AEO/GEO) work: hours per task, the estimate sheet and what goes on the quote",
      lead: "Estimate AI search work (AEO, GEO, LLMO) by building it up, not by working back from market ranges. Split the work into four phases (audit, setup, monthly upkeep, measurement and reporting), turn whatever drives the hours for each task into a quantity, and multiply your own measured time per unit by your hourly rate. Because no one can guarantee that an AI will mention a business, price the work and the deliverables, not the outcome, and write the scope, the exclusions and how changes are handled on the quote.",
      intro: [
        "Written November 28, 2026 (JST). We read the published pricing guides listed below on the same day.",
        "This guide is for web agencies, SEO consultants and freelancers who want to sell AI search work, or who have been asked for a quote and are not sure how to price it. What a retainer should cover is in [turning AI search into a monthly service](/guide/agency-aeo-monthly-service), and the pre-sale audit and proposal are in [the first audit and proposal](/guide/agency-aeo-first-audit-proposal). This page covers only how to get to a number. It is not legal or tax advice.",
      ],
      sections: [
        {
          heading: "What the top-ranking pricing guides leave out",
          paragraphs: [
            "On November 28, 2026 we read seven English and five Japanese pages that rank for searches like \"AEO pricing\", \"GEO cost\" and \"how to price AEO services\". They are good at budget tiers and at red flags for buyers. But almost all of them are written for the buyer. From the agency's side, these were missing:",
          ],
          list: [
            "For each task, what makes it take longer (pages, locations, FAQ items, the SEO plugin already on the site)",
            "How to measure your own hours and turn them into unit rates, with a sheet you can reuse",
            "The assumptions to put on the quote: exclusions, change handling, and wording that does not promise results",
            "How to cut hours on WordPress",
          ],
          after: [
            "The sections below fill those gaps.",
          ],
        },
        {
          heading: "Published price ranges (they are selling prices, not your costs)",
          paragraphs: [
            "Start with the numbers anyone can see. They are what vendors charge, not what the work costs you, so use them only as context when a client asks whether your price is high or low.",
          ],
          table: {
            head: ["What is published", "Source"],
            rows: [
              ["One-time audit or sprint from about $3,000; ongoing agency programs about $9,000–$15,000+ per month; self-serve monitoring tools about $29–$489 per month (HubSpot's own estimate)", "HubSpot (updated Sep 8, 2026)"],
              ["Agency retainers $1,500–$50,000+ per month depending on business size; hourly consulting $50–$300", "Nutshell (updated Sep 28, 2026), WebFX (Oct 22, 2026)"],
              ["Consulting engagements: audit 10–20 hours, strategy 15–30 hours, monthly implementation 5–10 hours, training 4–8 hours", "Stackmatix (Mar 12, 2026)"],
              ["Of 95 published Japanese price lists, the median monthly support plan was ¥275,000 (27 plans); five overseas tracking tools ranged from $29 to $300 a month (median $95)", "AI Search Dock by Stellagent (prices checked Oct 6, 2026)"],
              ["Of 27 published monthly plans, 10 stated a six-month minimum, 1 three months, 3 one month, and 13 stated no minimum", "Same"],
            ],
          },
          after: [
            `Sources: [HubSpot](${SRC.hubspot}), [Nutshell](${SRC.nutshell}), [WebFX](${SRC.webfx}), [Stackmatix](${SRC.stackmatix}), [AI Search Dock](${SRC.stellagent}).`,
            "The ranges are wide because the bundles differ. A program that includes content production and digital PR is a different job from tightening the structured data, llms.txt, FAQ and listings for a local business. Pricing from your own tasks is also easier to explain to the client than \"that is the market rate\".",
          ],
        },
        {
          heading: "Split the work in four, and turn each cost driver into a quantity",
          paragraphs: [
            "The first step is to break the work down. The table lists, for each task, what makes it take longer and what makes it quicker. It deliberately has no hour figures: they depend on how the site is built and how practised your team is. The next section shows how to measure your own.",
          ],
          table: {
            head: ["Phase and task", "Deliverable", "Drives hours up (unit)", "Brings hours down"],
            rows: [
              ["Audit: site and AI answer check", "Findings and a fix list", "Prompts, AI engines, locations", "Running a free technical check first"],
              ["Setup: fact sheet", "Name, address, phone, hours, prices, licences, each with a source", "Locations, price-list rows, how quickly the client replies", "The client already has a current price list and registration details"],
              ["Setup: structured data", "LocalBusiness and related JSON-LD, with a validation record", "Page templates (home, service, location, article); overlap with the theme's or SEO plugin's output", "A plugin that avoids duplicates; consistent templates"],
              ["Setup: llms.txt", "Site summary and key pages", "Decisions on which pages to include or leave out", "Automatic generation with per-page opt-out"],
              ["Setup: FAQ", "Questions and answers (on the page and as FAQPage)", "Number of questions, review rounds, whether the client is regulated", "A log of common calls and emails"],
              ["Setup: AI crawler rules", "robots.txt and server-side checks", "Whether a CDN or firewall blocks bots", "Access to the hosting panel"],
              ["Setup: listings", "Google Business Profile, maps and directories aligned with the site", "Number of listings, listings nobody can log in to", "The client holds admin access to each listing"],
              ["Monthly: apply changes", "Change log", "How often prices, hours or staff change", "One agreed channel for the client to send changes"],
              ["Measurement: record AI answers", "Answers and cited sources per prompt", "Prompts × engines × runs", "A tracking tool that records automatically"],
              ["Reporting: report and call", "Monthly report", "Meetings, languages and formats", "A fixed report template"],
            ],
          },
          after: [
            "The units in the third column become the line items on the quote. Write \"FAQ, X questions\" rather than \"FAQ, lump sum\", and when the client wants more questions you can price them on the spot.",
          ],
        },
        {
          heading: "Measure your own hours on the first three clients",
          paragraphs: [
            "Build the hour figures from your own logs, not from someone else's article. The published hour ranges assume different work: Stackmatix's 10–20 hour audit and 5–10 hours of monthly implementation describe consulting engagements, and a Japanese vendor's estimate of 63–120 hours a month for in-house work includes 20–40 hours of content production. Neither describes the technical setup of a small business site.",
            `Sources: [Stackmatix](${SRC.stackmatix}); [Kadai Kaiketsu Platform](${SRC.kadai}) (the vendor's own assumption, in Japanese).`,
          ],
          list: [
            "Give each task in the table a short code (Audit = A, Fact sheet = F, Schema = S, llms.txt = L, FAQ = Q, Crawlers = C, Listings = P, Measurement = M, Reporting = R)",
            "On the first three clients, log start and end times per task. Log time spent waiting for the client separately as \"waiting\"",
            "Log the quantity alongside the time (prompts, locations, page templates)",
            "After three clients, work out the time per unit for each task and use the median, so one unusual job does not skew it",
            "Review every three months. If tooling or practice cuts the time, decide whether to lower the price or add work at the same price",
          ],
          after: [
            "Set the hourly rate from your own costs, not from the market. Divide your yearly fixed costs (salaries, rent, tools) by the billable hours you actually sell in a year to get the floor, then add your margin.",
          ],
        },
        {
          heading: "The estimate sheet: hours × rate + tools + contingency",
          paragraphs: [
            "Put the logs into a sheet like this. Replace each X with your measured figure or the client's quantity.",
          ],
          code: SHEET_EN,
          after: [
            "Contingency covers what you cannot predict: slow reviews, listings nobody can log in to. Set the percentage from the gap between estimated and actual hours on your first jobs, so you can explain it.",
            "Keep tools on their own line. When the client holds the tracking tool account, they keep the history after the contract ends and the cost split is clear.",
            "Quote setup and the monthly fee separately. Setup is one-off work (fact sheet, schema, llms.txt, FAQ, crawler rules, listings); the monthly fee is changes, measurement and reporting. Spreading setup into the monthly fee loses money when a client leaves after a few months.",
          ],
        },
        {
          heading: "Assumptions to write on the quote",
          paragraphs: [
            "AI search quotes usually go wrong on two points: what is included, and what happens if the AI does not mention the client. Adapt the example below to your own terms, and have a lawyer check it before it goes into a contract.",
          ],
          code: TERMS_EN,
          after: [
            "Always keep item 4. AI answers change by day and by wording, and no agency can guarantee a mention. If a client asks for payment on results, agree first which prompts, which engines, how many runs and what counts as an appearance, or you will argue about the measurement. Charging for the work and the record, and reading the trend together, is the safer model.",
            "Item 8 matters too: almost half of the published monthly plans in the Japanese count above stated no minimum term, which is how cancellation disputes start.",
            "If you subcontract the work, or take it from a larger agency, check the payment-term and written-terms rules where you operate. In Japan, for example, the Act on Ensuring Proper Transactions with Small and Medium-sized Contractors took effect on January 1, 2026: when it applies, the commissioning business must state the work, the price, the payment date and the payment method in writing or by email, and pay within 60 days of receipt. Freelancers there are covered by a separate act in force since November 1, 2024.",
            `Sources: [Japan Government Public Relations Online](${SRC.govOnline}) and [Japan Fair Trade Commission, freelance act](${SRC.freelance}) (both in Japanese).`,
          ],
        },
        {
          heading: "Cutting hours on WordPress (with Nurevo AEO)",
          paragraphs: [
            "Because time sets the price, every repeated task you hand to a tool either keeps margin at the same price or lets you lower the price. These are the steps the free Nurevo AEO plugin shortens:",
          ],
          list: [
            "Audit: a 0–100 AEO score and a fix checklist in wp-admin. Do the technical check there and spend people's time on reading AI answers and explaining them to the client.",
            "Structured data: server-rendered JSON-LD from the business details. With Yoast SEO, Rank Math or All in One SEO it adds only the facts their schema lacks, and since 0.9.1 it also coexists with SEO SIMPLE PACK and VK All in One Expansion Unit without duplicates. Less time spent debugging duplicate schema.",
            "llms.txt: generated from the business details and recently updated pages; leave out any page from the editor sidebar.",
            "AI crawlers: AI search crawlers are allowed and training crawlers are left to your robots.txt by default, with a one-click switch.",
            "Second and later clients: Nurevo AEO > Settings > Tools exports and imports the settings (output switches, business details, FAQ and services) as JSON, without keys or connection data. A template for one industry gives you a head start on the fact sheet and FAQ.",
            "Many sites: WP-CLI commands wp nurevo status, diagnose, export and import let you check or export the sites you maintain in one pass.",
            "Measurement: once a month, connected Free and Standard sites ask Perplexity three questions built from the business type and area and record whether the business was named or the site cited. Pro (from USD 99 a month, beta) keeps measuring appearances in Perplexity (ChatGPT once configured), with competitor comparison and history.",
          ],
          after: [
            `The plugin is [free on WordPress.org](${WP_ORG}). On the tools line of the quote, state which plan you use: Free (USD 0), Standard (USD 20 a month, always-current criteria) or Pro (from USD 99 a month, AI visibility measurement in beta).`,
            "For agencies there are branded monthly reports, a multi-site dashboard and a referral share of 40% of each referred customer's monthly fee (after Stripe fees, approval required). If reporting is a large part of your hours, compare it with the [partner program](/partner/).",
          ],
        },
        {
          heading: "Quotes to avoid",
          list: [
            "Promising results (\"guaranteed AI mentions\", \"top 3 in ChatGPT\"). AI answers change and you cannot back it up",
            "A single \"AI optimization package\" line. Nobody knows what is included, and extra work turns into a dispute",
            "Hiding tool costs in the labour price. The client loses its history when it leaves, and you cannot explain the split",
            "Charging a premium for the AI label alone. If the work is the same as ordinary SEO or site maintenance, price it at the same rate",
            "Leaving out the minimum term and what stays with the client after exit",
          ],
        },
        {
          heading: "Checklist before you send the quote",
          list: [
            "The work is split into audit, setup, monthly upkeep, and measurement and reporting",
            "Each task has a unit (prompts, locations, page templates, listings)",
            "Time per unit comes from your own logs (median of the first three clients)",
            "The hourly rate comes from your fixed costs and billable hours",
            "Tools are on their own line, with the account holder agreed",
            "Contingency is set from the gap between estimated and actual hours",
            "Scope, exclusions, client inputs and change handling are on the quote",
            "The quote says results are not guaranteed and describes how you measure",
            "For subcontracted work, you checked the written-terms and payment rules that apply",
            "The minimum term and what stays with the client after exit are written down",
          ],
        },
      ],
      faqs: [
        { q: "Should I just match the market rate for AEO?", a: "Market ranges are selling prices for very different bundles, from tracking only to content and PR. Build your price from your own tasks and hours, and use the ranges only as context when you explain it." },
        { q: "How many hours does AEO setup take?", a: "It depends on how the site is built and how practised your team is, so this guide gives no figure. Log time and quantity per task on your first three clients and use the median time per unit. Most published hour ranges assume consulting or content production." },
        { q: "Can I price AEO on results?", a: "Only if you first agree which prompts, which engines, how many runs and what counts as an appearance, because AI answers change by day and wording. Charging for the work and the record is safer." },
        { q: "Can I drop the setup fee and charge monthly only?", a: "You can, but setup hours spread into the monthly fee lose money if the client leaves early. If you waive setup, state a minimum term on the quote." },
        { q: "Who should pay for the tracking tool?", a: "Ideally the client, in its own name, so it keeps the history after the contract ends. If you pay, list it separately at cost." },
        { q: "Can the second client in the same industry be cheaper?", a: "Often, because exported settings and FAQ templates cut the fact-sheet and FAQ time. Confirm the saving in your logs before you lower the price or add work." },
        { q: "What if a larger agency subcontracts the work to us?", a: "Ask for the work, the price, the payment date and the payment method in writing, check the payment term and how scope changes will be priced, and check the subcontracting rules where you operate. In Japan these are set by a law in force since January 1, 2026." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Before you quote, see how AI reads your client's site",
        body: "The free check needs no sign-up and shows structured data, llms.txt and whether AI search crawlers are allowed. It shortens the audit and lets you count the fixes, the quantities on your quote, before you price.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Install free from WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI; Perplexity is a trademark of Perplexity AI; Google is a trademark of Google LLC. HubSpot, WordPress, Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and Stripe are trademarks of their respective owners. Names are mentioned only to report published information. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
