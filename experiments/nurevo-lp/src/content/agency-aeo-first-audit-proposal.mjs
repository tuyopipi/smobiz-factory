// Content page: for web agencies / SEO firms - how to run the first AI search
// (AEO/GEO) check on a prospect's site before the meeting, and how to write
// the first proposal: what to show, what to contract for, what not to promise,
// how to answer the usual objections.
//
// Written 2026-11-15 (JST). Product facts come from the plugin readme
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt, 0.9.1)
// and the partner page (public/partner/index.html):
// - Free AEO score 0-100 with a checklist; nothing is sent until the admin
//   ticks consent and presses "Run diagnosis" (diagnosis sends home URL and
//   language, then fetches front page, /robots.txt, /llms.txt).
// - Free AI check (Free/Standard, connected sites): once a month three
//   questions built from business type and area (never the name) on
//   Perplexity; named / cited / who appeared instead; "Check now".
// - Pro measurement (beta, Perplexity) read as a direction of travel.
// - Settings export/import, WP-CLI `wp nurevo status|diagnose|export|import`.
// - Partner page: branded monthly reports, multi-site dashboard, Standard
//   payment links, AI check widget and referral page for approved partners;
//   40% of the client's payment net of Stripe fees, from the 2nd referred
//   client, approval required, Japan automated payouts use Stripe Connect; overseas Wise eligibility reviewed individually.
//   Tell the client before installing on their site; paid plans only with
//   the client's own consent. Agencies are referral partners only (see the
//   channel rule in scripts/check-static.mjs).
//
// Outside facts and where they were read:
// - Google "Do you need an SEO?" (en last updated 2026-06-05, ja 2026-06-10),
//   read 2026-11-15: "No one can guarantee a #1 ranking on Google" / ja
//   "Google で一番上に掲載されることは誰にも保証できません"; services listed
//   include "Optimizing for generative AI"; new section asks whether AEO/GEO
//   advice matches Google's generative AI optimization guidance and whether
//   the SEO cites official documentation; interview questions (results and
//   timeframe, how success is measured, share all changes and reasoning).
// - Google "guidance on using third-party SEO tools, services, and advice"
//   (no date shown, English only), read 2026-11-15: AEO/GEO tools listed;
//   Google doesn't evaluate third-party services; predictions may not happen;
//   using a tool doesn't guarantee ranking success; good advice labels claims
//   as opinion based on data/experience or cites official guidance.
// - Google "AI features and your website": indexed + snippet-eligible; SEO
//   best practices apply (read 2026-11-10). Search Console generative AI
//   performance report: all sites as of 2026-08-31, impressions (read
//   2026-11-10).
// - Pew Research Center 2025-07-22: 900 US adults, March 2025; traditional
//   link clicked in 8% of visits with an AI summary vs 15% without; link in
//   the summary 1%. Read 2026-11-15.
// - AI検索ドック (Stellagent) own study 2026-10-01: 1 run vs 10-run rate,
//   average gap 29.9 pts; 3 runs 16.5; 5 runs 10.7 (read 2026-11-14).
//   Stellagent comparison of 24 diagnosis services (prices checked on the
//   vendors' pages 2026-10-07): paid entry prices 10,000-900,000 JPY, most
//   common 100,000-165,000 JPY (read 2026-11-15). Vendor articles; say so.
// - OpenAI OAI-SearchBot / ChatGPT-User; Perplexity PerplexityBot /
//   Perplexity-User (read 2026-10-31).
// Not stated on purpose: market prices for agency retainers, "time to
// results" figures, the 30-115% GEO paper lift some vendors quote.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  hireEn: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo",
  hireJa: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo?hl=ja",
  thirdParty: "https://developers.google.com/search/docs/fundamentals/third-party-seo",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  gscReportJa: "https://support.google.com/webmasters/answer/16984139?hl=ja",
  gscReportEn: "https://support.google.com/webmasters/answer/16984139?hl=en",
  pew: "https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/",
  dock: "https://stellagent.ai/ja/ai-search-dock/blog/llmo-effect",
  dockCompare: "https://stellagent.ai/ja/ai-search-dock/blog/llmo-diagnosis",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  perplexityBots: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
};

export default {
  slug: "agency-aeo-first-audit-proposal",
  targetQueries: [
    "AEO proposal for clients",
    "how to pitch AI search optimization to a client",
    "GEO audit before sales meeting",
    "AI検索対策 提案書 制作会社",
    "LLMO 提案 初回診断",
    "AIO対策 提案 約束 保証",
  ],
  related: ["agency-aeo-monthly-service", "ai-visibility-drop-causes", "measure-ai-visibility", "aeo-tools-comparison", "search-console-ai-features"],
  locales: {
    ja: {
      title: "AI検索対策の初回診断と提案書の作り方：制作会社向け | Nurevo",
      description: "制作会社がAI検索対策（AEO・GEO・LLMO）を提案するときの、商談前の初回診断の手順、提案書7章の構成、約束してよいこと・いけないこと、よくある反論への答え方。2026年改訂のGoogleの基準に沿って。",
      h1: "AI検索対策の初回診断と提案書の作り方：制作会社が商談前に確かめること、約束してよいこと",
      lead: "AI検索対策の最初の提案は、①商談前にサイトを診断して「AIが読めていない事実」を具体的に示し、②直す作業・納期・報告の頻度と測り方を約束し、③AIに必ず出ることや順位は約束しない、の3つで組みます。Googleは2026年6月にSEO業者の選び方のガイドを改訂し、AEO・GEOの助言が公式の指針に沿っているかを確かめるよう依頼主に勧めています。提案書もその目で読まれる前提で作りましょう。",
      intro: [
        "作成日：2026年11月15日（JST）。対象は、お客様（店舗・クリニック・中小企業など）にAI検索対策を初めて提案する制作会社・SEO会社・MEO会社・WordPress保守会社です。月額サービスの組み立て方は[AI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)で扱っています。この記事はその手前、初回の診断と提案書に絞ります。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、お客様に正確な現状と作業の範囲を伝えるためのもので、AIの回答に表示されることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "2026年の前提：依頼主はGoogleのガイドで提案を確かめる",
          paragraphs: [
            `Googleの「SEO 業者の利用を検討する」（日本語版の最終更新 2026年6月10日）は、SEO業者が提供するサービスの例に「生成 AI 向けに最適化」を加え、業者の助言やツールを評価する節を新しく設けました。そこでは、AI 機能（AEO や GEO サービスとも呼ばれる）についての助言が、Googleの生成AI向けの最適化の指針に沿っているかを確かめるよう勧めています。同じページには「Google で一番上に掲載されることは誰にも保証できません」とあります（[Google 検索セントラル：SEO 業者の利用を検討する](${SRC.hireJa})）。`,
            `同時に公開された英語のページ「Google Search's guidance on using third-party SEO tools, services, and advice」は、AEO・GEOのツールを第三者サービスの例に挙げ、Googleは第三者のサービスを評価していないこと、ツールの予測は外れることがあること、ツールを使っても成功は保証されないことを書いています。よい助言とは、データや経験にもとづく意見だと明記しているか、Googleの公式の指針を引いているものだ、としています（[Google: third-party SEO tools, services, and advice](${SRC.thirdParty})）。`,
            "提案書に落とすと、次の3つになります。",
          ],
          list: [
            "Googleなど各社の公式文書に書いてあることと、自社の経験や意見を分けて書く。公式の話には出典を付ける。",
            "「Google公認」「AIに必ず載る」「順位が上がる」とは書かない。",
            `どんな結果を、いつまでに、どう測るかを書く。Googleのガイドが依頼主に勧める質問（結果と期間、成功の測り方、サイトへの変更をすべて共有するか）に、提案書の中で先に答えておく（[同ページ](${SRC.hireJa})）。`,
          ],
        },
        {
          heading: "商談前の初回診断：何を見て、提案書にどう書くか",
          paragraphs: [
            "初回診断は、公開されている情報だけで30〜60分あれば一通り見られます。目的は点数を出すことではなく、「AIがこのサイトから読めない事実」を、お客様が自分の目で確かめられる形で示すことです。",
          ],
          table: {
            head: ["確認する項目", "見る場所", "提案書での書き方の例"],
            rows: [
              ["検索のインデックスとスニペット", "Search ConsoleのURL検査（権限がなければ site: 検索）、noindex・nosnippet", "「トップページと料金ページはGoogleのAI機能の対象になる状態です」"],
              ["AI検索のクローラ", "/robots.txt で OAI-SearchBot・ChatGPT-User・PerplexityBot・Perplexity-User などが止められていないか", "「ChatGPTの検索用クローラが robots.txt で止まっています」"],
              ["会社・店舗の基本情報の構造化データ", "ページのJSON-LD（Organization・LocalBusiness などに住所・電話・営業時間があるか）", "「構造化データに会社名とロゴはありますが、住所と営業時間がありません」"],
              ["/llms.txt", "ルートに置かれているか、中身が今のページを指しているか", "「llms.txtはありません」のように事実だけ"],
              ["事実の食い違い", "サイト・Googleビジネスプロフィール・ポータルサイトの営業時間・住所・料金", "「定休日がサイトは水曜、ポータルは火曜です」"],
              ["文字で読める情報か", "料金表・営業時間・メニューが画像だけになっていないか", "「料金表が画像のみで、文字として読めません」"],
              ["AIの回答（サンプル）", "会社名を入れた質問と、業種と地域だけの質問をいくつか", "「この3問を本日2回ずつ聞いた結果です（回答は変動します）」"],
            ],
            caption: "診断した日付と、確認した方法を必ず添えます。お客様が後から同じ手順で確かめられるようにするためです。",
          },
          after: [
            `AI検索のクローラの名前と役割は、各社が公開しています（[OpenAI：クローラの概要](${SRC.openaiBots})、[Perplexity：クローラ](${SRC.perplexityBots})）。GoogleはAI機能に表示される条件を、インデックスされスニペット付きで表示できることとし、通常のSEOのベストプラクティスがそのまま当てはまるとしています（[Google：AI 機能とウェブサイト](${SRC.googleAiJa})）。お客様のSearch Consoleの権限をもらえれば、「生成AIパフォーマンスレポート（検索）」で、GoogleのAI機能での表示回数も見られます（2026年8月31日時点で全サイトに提供、[Search Console ヘルプ](${SRC.gscReportJa})）。`,
          ],
        },
        {
          heading: "AIの回答を診断に使うときの3つの注意",
          paragraphs: [
            `1回だけ聞いた結果は、当てになりません。AI検索ドック（ステラジェント社）の自社調査（2026年10月、30問×3つのAI×10回）では、1回だけの結果と10回の割合との差は平均29.9ポイント、3回で16.5ポイント、5回で10.7ポイントでした（[AI検索ドック](${SRC.dock})。ツール提供会社の調査です）。初回の商談で「出ていません」と言い切るのは避け、「本日この条件で聞いた結果」として見せます。`,
          ],
          list: [
            "会社名を入れた質問（指名）と、業種と地域だけの質問（発見）を分ける。指名の質問は名前が出て当然なので、見るのは内容が正しいかどうか。",
            "聞いた日・AIの種類・聞いた回数・ログインの有無を記録する。次の月に同じ条件で聞き直せるようにするため。",
            "競合の名前が出ても、競合を悪く言う材料にしない。「この質問ではこの会社が出典に使われている」と事実だけを書く。",
          ],
          after: [
            `AIの要約が出ると、従来の検索結果のリンクが押される割合は下がるという調査もあります。米Pew Research Centerが米国の成人900人の2025年3月の閲覧データを調べたところ、AIの要約が出た検索では従来の検索結果のリンクが押されたのは8%、出なかった検索では15%でした。要約の中のリンクが押されたのは1%です（[Pew Research Center](${SRC.pew})）。米国の調査で、日本や個別のサイトにそのまま当てはまるとは限らないことも添えて使ってください。`,
          ],
        },
        {
          heading: "提案書の構成：7つの章",
          paragraphs: [
            "初回の提案書は長くする必要はありません。お客様が社内で回覧して判断できるよう、次の7章に収めます。",
          ],
          table: {
            head: ["章", "書くこと", "書かないこと"],
            rows: [
              ["1. 要約", "診断で見つかった問題の上位3つと、提案する作業の一言説明", "業界の一般論だけの前置き"],
              ["2. 現状（診断結果）", "上の表の結果。日付・確認方法・スクリーンショット", "根拠を示さない独自の点数だけ"],
              ["3. なぜ直すのか", "お客様が実際に聞かれそうな質問と、AIが読めていない事実の対応", "出典のない市場の数字、他社の研究の改善率をお客様の見込みとして書くこと"],
              ["4. 作業の範囲", "直す項目、作業の担当（制作会社かお客様か）、サイトに加える変更の一覧", "「AI対策一式」のような中身の見えない書き方"],
              ["5. スケジュール", "初期の作業の週ごとの予定と、お客様に確認してもらう日", "「◯週間でAIに出る」のような結果の期限"],
              ["6. 報告と測り方", "毎月聞く質問の数、聞く回数、AIの種類、報告の項目と日", "1回の計測を成果として扱うこと"],
              ["7. 費用と契約", "初期費用と月額、含まれる作業、解約の条件、ツールの費用を誰が払うか", "成果報酬型の順位保証"],
            ],
            caption: "2章と4章は、お客様のサイトの具体的なページ名・URLで書くと、他社の提案と比べやすくなります。",
          },
          after: [
            "費用の相場について、制作会社の月額サービスの一次資料は見つけられなかったため、この記事では書きません。参考までに、診断だけのサービスについては、ステラジェント社が24件を比較し、有料の入口の料金は1万〜90万円、最も多いのは10万〜16.5万円だったとまとめています（2026年10月7日に各社の公式ページで確認、[AI検索ドック](" + SRC.dockCompare + ")。同社も診断サービスを提供しています）。",
          ],
        },
        {
          heading: "約束してよいこと・いけないこと",
          table: {
            head: ["約束してよいこと", "約束してはいけないこと"],
            rows: [
              ["決めた作業を、決めた日までに終える", "ChatGPTやGoogleのAIに必ず表示される"],
              ["毎月同じ条件で計測し、決めた日に報告する", "AIの回答で◯位に入る、◯%上がる"],
              ["サイトに加えた変更をすべて一覧で共有する", "Google公認・AI各社の認定を受けた方法"],
              ["公式文書の内容と、自社の経験・意見を分けて説明する", "研究で示された改善率が、お客様のサイトでも出る"],
              ["計測の結果が下がったときに原因を調べて報告する", "下がった数字を必ず戻す"],
            ],
            caption: "AIの回答は同じ質問でも変わるため、結果の数字は約束の対象にせず、計測した結果として報告します。",
          },
          after: [
            "下がったときの説明の仕方は、[AIでの登場率が下がったときの原因の切り分け](/guide/ai-visibility-drop-causes)にまとめています。初回の提案書の6章で「下がったときはこの順で調べて報告します」と書いておくと、後の説明が楽になります。",
          ],
        },
        {
          heading: "商談でよく出る質問と答え方",
          table: {
            head: ["お客様の質問", "答え方の例"],
            rows: [
              ["SEOとは別に必要ですか？", "作業の多くはSEOと重なります。GoogleはAI機能にも通常のSEOのやり方が当てはまるとしています。追加で行うのは、AIが読む事実の整理（構造化データ・llms.txt・クローラの許可）と、AIでの見え方の計測です。[違いの解説](/guide/aeo-vs-seo-vs-geo)"],
              ["いつ効果が出ますか？", "期間は約束できません。初期の作業がいつ終わるかと、いつから毎月同じ条件で測るかをお約束します。"],
              ["AIに出たかどうかはどう分かりますか？", "毎月決めた質問を決めた回数聞き、名前が出たか・サイトが引用されたかを記録します。Googleについては、Search Consoleの生成AIパフォーマンスレポートで表示回数も見られます。"],
              ["今のSEOプラグインはそのままでいいですか？", "多くの場合そのままで構いません。同じ会社の情報を2つの構造化データで出さないよう、今の出力を確認してから足します。"],
              ["llms.txtを置けば出ますか？", "置いただけで出るとは言えません。AIが読む案内の1つとして置き、他の作業と合わせて行います。[llms.txtの書き方](/guide/llms-txt)"],
            ],
          },
        },
        {
          heading: "WordPressで初回診断から実装まで進める手順（Nurevoの場合）",
          paragraphs: [
            "お客様のサイトがWordPressなら、Nurevo AEOの無料プラグインで、診断と初期の作業の多くを管理画面から進められます。ここでは制作会社の作業として進める順番を書きます。",
          ],
          list: [
            "商談前：登録不要の[無料チェック](/check)にお客様のURLを入れ、構造化データ・llms.txt・AIクローラの許可の状態を確認する。結果の画面を提案書の2章に使う。",
            `受注後、導入の前に：お客様のサイトに入れることを事前に知らせる（[パートナープログラム](${PARTNER})のページに、そのまま送れるお知らせの文面があります）。`,
            `導入：[WordPress.org](${WP_ORG})からプラグインを入れる。初期設定ウィザード（業種、基本情報、AIに公開する内容、診断）を進める。自動で読み取られた情報は空欄だけを埋めるので、内容を確かめて直す。`,
            "診断：「AEOスコア」の画面で、診断が送る内容（サイトのURLと言語）を読み、同意にチェックして「診断する」を押す。0〜100の点数と、直す項目の一覧が出る。この一覧を提案書の4章の作業の範囲と照らし合わせる。",
            "実装：llms.txt・基本の構造化データ・AI検索のクローラの許可は、管理画面からその場で直せる。Yoast SEO・Rank Math・All in One SEO・Slim SEOを使っているサイトでは、そのプラグインの構造化データに足りない事実だけを足すので、出力が二重になりません。",
            "計測の始まり：サイトを接続すると、Free・Standardのサイトでは月1回、業種と地域から作った3つの質問（会社名は含めない）をPerplexityに聞き、名前が出たか・サイトが引用されたか・代わりに誰が出たかを表示します。提案書の6章の最初の記録に使えます。",
            "複数のお客様に広げる：「設定 › ツール」またはWP-CLI（wp nurevo export / import）で設定をJSONに書き出し、ほかのサイトに読み込む。キー・トークン・プランは書き出されません。",
          ],
          after: [
            `制作会社向けには、社名・ロゴ入りの月次レポートの自動送信、複数サイトの管理画面、お客様に送れるStandardプランの支払いリンクがあります。有料プランはお客様ご本人の同意を得て、お客様が契約します。紹介したお客様の支払いからStripe手数料を引いた額の40%を月ごとに計算する紹介報酬もあります（2社目のご紹介から。承認制。海外パートナーも申請できます。海外への支払いはWiseの対応国・通貨・受取条件を個別確認し、支払方法・時期・手数料の扱いを事前に案内します。国内の自動支払いはStripe Connectを利用します）。詳しくは[パートナープログラム](${PARTNER})をご覧ください。`,
            "正直に言えば、追えるAIの数や質問の数では計測を専門にするツールのほうが多く、ProのAI登場率の計測は現在Perplexityが対象です（ベータ版）。計測は別のツールと組み合わせるのも選択肢です（[AEOツールの比較](/guide/aeo-tools-comparison)）。",
          ],
        },
        {
          heading: "提案前のチェックリスト",
          list: [
            "診断した日付・方法・画面のスクリーンショットを残した。",
            "インデックス・robots.txt・構造化データ・llms.txt・事実の食い違い・画像だけの情報を確認した。",
            "AIに聞いた質問を、指名と発見に分け、日付・AI・回数を記録した。",
            "公式文書の話には出典を付け、自社の意見は意見と書いた。",
            "作業の範囲を、ページ名・URLで書いた。",
            "毎月の計測の条件（質問・回数・AI）と報告の日を書いた。",
            "「必ず表示」「◯位」「Google公認」の表現が残っていない。",
            "導入前にお客様へ知らせることと、有料プランはお客様の同意で契約することを書いた。",
          ],
        },
      ],
      faqs: [
        { q: "初回の診断は無料にすべきですか？", a: "決まりはありません。公開情報だけで見られる範囲（この記事の表）を無料の商談資料にし、Search Consoleの権限を借りた詳しい診断や競合の調査を有料にする、という分け方もあります。どちらにしても、診断で何を見たかを書いておくと比べてもらいやすくなります。" },
        { q: "診断のためにお客様のサイトへプラグインを入れてもよいですか？", a: "受注前は、公開されている情報だけで診断するのが安全です。プラグインの導入は、お客様の了承を得てからにしてください。Nurevoの無料チェック（/check）はURLを入れるだけで使えます。" },
        { q: "AIの回答で競合が出ていることを、提案書に書いてもよいですか？", a: "事実として、聞いた日・質問・AIと一緒に書くのは問題ありません。ただし回答は変わるため、「競合に負けている」と言い切らず、「この条件ではこの会社が出典に使われていた」と書きます。競合を悪く言う書き方は避けます。" },
        { q: "AEO・GEO・LLMO・AIO、提案書ではどの言葉を使えばよいですか？", a: "お客様が聞いたことのある言葉を1つ選び、最初に「AI検索対策（AEO・GEOとも呼ばれます）」のように並べて書くのが分かりやすいです。Googleのガイドは「AI 機能（AEO や GEO サービスとも呼ばれる）」と書いています。" },
        { q: "成果報酬型の契約にしてもよいですか？", a: "AIの回答は同じ質問でも変わり、誰も表示や順位を保証できないため、AIに出たかどうかを成果条件にするのはおすすめしません。作業の完了と、決めた条件での計測と報告を契約の対象にしてください。" },
        { q: "WordPress以外のサイトでも同じ手順で提案できますか？", a: "できます。診断の項目（インデックス・robots.txt・構造化データ・llms.txt・事実の食い違い）はどのサイトでも同じです。Nurevoでは、WordPress以外のサイトはスニペット、サイトのないお店はホストページで対応しています。" },
        { q: "この手順で提案すれば、お客様はAIに表示されますか？", a: "保証はできません。AIの回答は日や聞き方で変わります。この手順は、現状と作業の範囲を正確に伝え、お客様が比べて判断できる提案にするためのものです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "商談の前に、お客様のサイトをAIがどう読んでいるか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。初回の提案書の「現状」の章に使えます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: PARTNER },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleとSearch ConsoleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、WordPressはそれぞれの権利者の商標です。AI検索ドックはステラジェント社のサービスです。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "First AEO Audit and Proposal: A Guide for Agencies | Nurevo",
      description: "How agencies can run a first AI search (AEO/GEO) audit before the sales meeting, structure a seven-part proposal, and know what they can and cannot promise.",
      h1: "The first AI search audit and proposal: what agencies should check before the meeting and what they can promise",
      lead: "Build the first AI search optimization proposal on three things: audit the site before the meeting and show the specific facts AI cannot read; commit to the work, the schedule, how often you report and how you measure; and do not promise mentions in AI answers or positions. In June 2026 Google revised its guide to hiring an SEO and now suggests that site owners check whether AEO and GEO advice follows Google's official guidance. Write the proposal expecting it to be read that way.",
      intro: [
        "Written November 15, 2026 (JST). This is for web agencies, SEO firms, local SEO firms and WordPress care companies pitching AI search optimization to a client (a shop, a clinic, a small company) for the first time. How to run it as a monthly service is covered in [offering AEO as a monthly service](/guide/agency-aeo-monthly-service); this guide stays with the step before that: the first audit and the first proposal.",
        "AI answers change from day to day and with the wording of the question. The steps here are for telling clients accurately where they stand and what the work covers. They do not guarantee that a business will appear in AI answers.",
      ],
      sections: [
        {
          heading: "The 2026 baseline: clients can check your pitch against Google's guide",
          paragraphs: [
            `Google's "Do you need an SEO?" page (last updated June 5, 2026) now lists "Optimizing for generative AI" among the services SEOs offer, and has a new section on evaluating an SEO's recommendations and tools. It suggests checking whether advice about AI experiences (AEO or GEO) matches Google's guidance on optimizing for generative AI. The same page says: "No one can guarantee a #1 ranking on Google" ([Google Search Central: Do you need an SEO?](${SRC.hireEn})).`,
            `A companion page, "Google Search's guidance on using third-party SEO tools, services, and advice", names AEO and GEO tools among third-party services and says Google doesn't evaluate third-party services, that any predictions such tools make may not happen, and that using a tool doesn't guarantee success. Good advice, it says, either labels its claims as opinion based on data or experience, or cites official Google guidance ([Google: third-party SEO tools, services, and advice](${SRC.thirdParty})).`,
            "In a proposal, that comes down to three rules.",
          ],
          list: [
            "Keep what Google and other vendors document apart from your own experience and opinion, and link the official sources.",
            "Do not write \"Google-approved\", \"guaranteed to appear in AI answers\" or \"will rank higher\".",
            `Say what results you expect, by when, and how you will measure them. Google's guide suggests owners ask about results and timeframe, how success is measured, and whether all site changes will be shared ([same page](${SRC.hireEn})); answer those in the proposal before you are asked.`,
          ],
        },
        {
          heading: "The pre-meeting audit: what to check and how to write it up",
          paragraphs: [
            "Using public information only, a first audit takes about 30 to 60 minutes. The goal is not a score. It is to show the facts AI cannot read from the site, in a way the client can verify with their own eyes.",
          ],
          table: {
            head: ["What to check", "Where to look", "How to word it in the proposal"],
            rows: [
              ["Indexing and snippets", "URL Inspection in Search Console (or a site: search without access); noindex and nosnippet", "\"The home page and pricing page are eligible for Google's AI features\""],
              ["AI search crawlers", "Whether /robots.txt blocks OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User and similar", "\"ChatGPT's search crawler is blocked in robots.txt\""],
              ["Business structured data", "The page's JSON-LD: does the Organization or LocalBusiness carry the address, phone and opening hours?", "\"The structured data names the company and logo but has no address or opening hours\""],
              ["/llms.txt", "Is it at the root, and does it point to current pages?", "State the fact only: \"There is no llms.txt\""],
              ["Conflicting facts", "Hours, address and prices on the site, the Google Business Profile and directory sites", "\"The site says closed Wednesdays; the directory says Tuesdays\""],
              ["Text AI can read", "Are prices, hours or menus only in images?", "\"The price list is an image and cannot be read as text\""],
              ["AI answers (a sample)", "A few questions with the business name, and a few with only the business type and area", "\"Results of these three questions, asked twice each today (answers vary)\""],
            ],
            caption: "Always add the date and the method, so the client can repeat the check later.",
          },
          after: [
            `OpenAI and Perplexity publish their crawler names and purposes ([OpenAI: overview of crawlers](${SRC.openaiBots}), [Perplexity: crawlers](${SRC.perplexityBots})). Google says a page needs to be indexed and eligible to be shown with a snippet to appear in its AI features, and that SEO best practices apply to them as usual ([Google: AI features and your website](${SRC.googleAi})). With access to the client's Search Console you can also read impressions in Google's AI features in the generative AI performance report, available to all sites as of August 31, 2026 ([Search Console Help](${SRC.gscReportEn})).`,
          ],
        },
        {
          heading: "Three cautions when you use AI answers in an audit",
          paragraphs: [
            `A single run tells you little. In a study by AI検索ドック (Stellagent) in October 2026 (30 questions, 3 AIs, 10 runs each), one run differed from the 10-run rate by 29.9 points on average, three runs by 16.5 and five runs by 10.7 ([AI検索ドック](${SRC.dock}), a study by a tool vendor). In the first meeting, avoid saying "you don't appear"; present it as "the result under these conditions today".`,
          ],
          list: [
            "Separate questions that include the business name from discovery questions with only the type and area. A named question will usually return the name; what matters there is whether the facts are right.",
            "Record the date, the AI, the number of runs and whether you were signed in, so you can repeat it under the same conditions next month.",
            "If a competitor shows up, do not use it against them. State the fact: \"for this question, this company was cited\".",
          ],
          after: [
            `There is research that AI summaries reduce clicks on regular results. Pew Research Center looked at the March 2025 browsing of 900 U.S. adults: when an AI summary appeared, a traditional result was clicked in 8% of visits, against 15% when none appeared, and a link inside the summary in 1% ([Pew Research Center](${SRC.pew})). It is a U.S. study; say that it may not carry over to another country or a particular site.`,
          ],
        },
        {
          heading: "The proposal in seven parts",
          paragraphs: [
            "A first proposal does not need to be long. Fit it into seven parts so the client can pass it around internally and decide.",
          ],
          table: {
            head: ["Part", "What goes in", "What stays out"],
            rows: [
              ["1. Summary", "The top three problems found and a one-line description of the work", "A preamble of industry generalities"],
              ["2. Where the site stands (audit)", "The results of the table above, with dates, methods and screenshots", "A proprietary score with no explanation"],
              ["3. Why fix it", "Questions the client is likely to be asked, matched to facts AI cannot read", "Unsourced market figures, or a study's uplift presented as the client's forecast"],
              ["4. Scope of work", "What will be fixed, who does each item (agency or client), the list of changes to the site", "\"Full AI optimization package\" with nothing behind it"],
              ["5. Schedule", "Week-by-week plan for the setup, and the dates the client reviews", "\"Appear in AI within X weeks\""],
              ["6. Reporting and measurement", "How many questions you track, how many runs, which AIs, what the report covers and when", "Treating one measurement as a result"],
              ["7. Fees and terms", "Setup fee and monthly fee, what is included, how to cancel, who pays for tools", "Pay-for-ranking guarantees"],
            ],
            caption: "Write parts 2 and 4 with the client's actual page names and URLs; it makes your proposal easier to compare with others.",
          },
          after: [
            "We found no primary source for what agencies charge for monthly AI search work, so this guide gives no market price. For audits alone, Stellagent compared 24 Japanese diagnosis services and found paid entry prices from 10,000 to 900,000 JPY, most often 100,000 to 165,000 JPY (checked on each vendor's page on October 7, 2026; [AI検索ドック](" + SRC.dockCompare + "), a company that also sells audits).",
          ],
        },
        {
          heading: "What you can promise, and what you cannot",
          table: {
            head: ["You can promise", "You cannot promise"],
            rows: [
              ["Finishing the agreed work by the agreed date", "Appearing in ChatGPT's or Google's AI answers"],
              ["Measuring under the same conditions every month and reporting on a set date", "A position in AI answers or an X% increase"],
              ["Sharing every change made to the site", "A method approved by Google or certified by an AI company"],
              ["Separating what official documentation says from your own experience", "That an uplift shown in a study will happen on the client's site"],
              ["Investigating and reporting the cause if the numbers drop", "Bringing a dropped number back"],
            ],
            caption: "AI answers vary for the same question, so keep result figures out of the promises and report them as measurements.",
          },
          after: [
            "How to explain a drop is covered in [why AI visibility dropped](/guide/ai-visibility-drop-causes). Writing \"if the numbers drop, we investigate in this order and report\" into part 6 of the first proposal makes that conversation easier later.",
          ],
        },
        {
          heading: "Common client questions and how to answer them",
          table: {
            head: ["The client asks", "A way to answer"],
            rows: [
              ["Is this separate from SEO?", "Much of the work overlaps; Google says SEO best practices apply to its AI features. What is added is organizing the facts AI reads (structured data, llms.txt, crawler access) and measuring how AI shows the business. [The differences](/guide/aeo-vs-seo-vs-geo)"],
              ["When will it work?", "We cannot promise a timeframe. We commit to when the setup is finished and from when we measure under the same conditions each month."],
              ["How will we know we appear in AI?", "Each month we ask a fixed set of questions a fixed number of times and record whether the name appeared and the site was cited. For Google, Search Console's generative AI performance report also shows impressions."],
              ["Can we keep our SEO plugin?", "Usually, yes. We check what it already publishes first, so the business is not described twice in structured data."],
              ["Will adding llms.txt get us cited?", "We cannot say it will on its own. It is one of the files AI can read, and we add it alongside the rest of the work. [Writing llms.txt](/guide/llms-txt)"],
            ],
          },
        },
        {
          heading: "Running the audit and setup on WordPress (with Nurevo)",
          paragraphs: [
            "If the client's site runs WordPress, the free Nurevo AEO plugin covers much of the audit and setup from the admin screen. Here is the order to work in as an agency.",
          ],
          list: [
            "Before the meeting: put the client's URL into the [free check](/check), which needs no sign-up, and see the state of structured data, llms.txt and AI crawler access. Use the result screen in part 2 of the proposal.",
            `After you win the work, before installing: tell the client you will install it on their site (the [partner program](${PARTNER}) page has a notice you can send as is).`,
            `Install: add the plugin from [WordPress.org](${WP_ORG}) and go through the setup wizard (business type, basic facts, what to publish for AI, diagnosis). Automatically extracted details only fill blank fields, so check and correct them.`,
            "Diagnose: on the AEO Score screen, read what the diagnosis sends (the site URL and language), tick the consent box and press Run diagnosis. You get a 0 to 100 score and a list of fixes; match it against the scope in part 4.",
            "Set up: llms.txt, basic structured data and access for AI search crawlers can be fixed right there. On sites with Yoast SEO, Rank Math, All in One SEO or Slim SEO, only the missing facts are added to that plugin's structured data, so nothing is published twice.",
            "Start measuring: once the site is connected, Free and Standard sites get a monthly check that asks Perplexity three questions built from the business type and area (never the business name) and shows whether the business was named, the site cited, and who appeared instead. Use it as the first record for part 6.",
            "Roll out to other clients: export the settings as JSON under Settings > Tools or with WP-CLI (wp nurevo export / import) and import them elsewhere. Keys, tokens and the plan are never exported.",
          ],
          after: [
            `For agencies there are monthly client reports under your name and logo sent automatically, a dashboard for several client sites, and Standard plan payment links to send clients. Paid plans are taken out by the client, with the client's own consent. A referral commission is calculated monthly: 40% of each referred client's payment net of Stripe fees (from the second referred client; approval required; overseas partners may also apply. For overseas payouts, Wise country, currency and recipient eligibility is reviewed individually; payment method, timing and fees are communicated in advance. Automated payouts in Japan use Stripe Connect). See the [partner program](${PARTNER}).`,
            "To be fair, dedicated measurement tools track more AIs and more questions, and Pro's AI visibility measurement currently covers Perplexity (beta). Pairing Nurevo with a measurement tool is a reasonable choice ([AEO tools compared](/guide/aeo-tools-comparison)).",
          ],
        },
        {
          heading: "Checklist before you send the proposal",
          list: [
            "The audit date, method and screenshots are kept.",
            "Indexing, robots.txt, structured data, llms.txt, conflicting facts and image-only information were checked.",
            "AI questions are split into named and discovery, with date, AI and number of runs recorded.",
            "Official facts have sources; your opinions are labeled as opinions.",
            "The scope is written with page names and URLs.",
            "The monthly measurement conditions (questions, runs, AIs) and the reporting date are written down.",
            "No \"guaranteed\", \"top position\" or \"Google-approved\" wording is left.",
            "It says you will tell the client before installing anything, and that paid plans are taken out with the client's consent.",
          ],
        },
      ],
      faqs: [
        { q: "Should the first audit be free?", a: "There is no rule. One split is to make the public-information audit (the table in this guide) a free sales document, and charge for a deeper audit with Search Console access or competitor research. Either way, writing down what you checked makes your audit easier to compare." },
        { q: "Can we install a plugin on the client's site to audit it?", a: "Before you win the work, auditing from public information only is the safe choice. Install anything only after the client agrees. Nurevo's free check (/check) needs only the URL." },
        { q: "Can the proposal mention that a competitor appears in AI answers?", a: "Yes, as a fact with the date, question and AI. Answers change, so instead of \"you are losing to them\", write \"under these conditions, this company was cited\". Avoid running the competitor down." },
        { q: "AEO, GEO, LLMO or AIO: which term should the proposal use?", a: "Pick the one the client has heard of and pair it once at the start, for example \"AI search optimization (also called AEO or GEO)\". Google's guide refers to \"AI experiences (sometimes called AEO or GEO)\"." },
        { q: "Can we offer a pay-for-results contract?", a: "Because AI answers vary for the same question and no one can guarantee a mention or position, we advise against making AI appearances the condition for payment. Contract for completed work and for measuring and reporting under agreed conditions." },
        { q: "Does this work for sites not built on WordPress?", a: "Yes. The audit items (indexing, robots.txt, structured data, llms.txt, conflicting facts) are the same on any site. Nurevo covers non-WordPress sites with a snippet and businesses without a website with a hosted page." },
        { q: "If we pitch this way, will the client appear in AI answers?", a: "That cannot be guaranteed; AI answers change by day and wording. These steps are for telling the client accurately where they stand and what the work covers, so they can compare and decide." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Before the meeting, see how AI reads your client's site",
        body: "The free check needs no sign-up: enter the URL to see the state of structured data, llms.txt and AI crawler access. Use it in the \"where the site stands\" part of your first proposal.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google and Search Console of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO and WordPress are trademarks of their respective owners. AI検索ドック is a service of Stellagent. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
