// Content page: for web agencies / SEO firms that report AI visibility to
// clients every month - what to do when the number drops: confirm the drop
// is real, locate it (which AI, which question, mention vs citation), then
// check causes on the site, outside the site and on the AI side, and write
// the client report without guessing.
//
// Written 2026-11-14 (JST). Product facts come from the plugin readme
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt, 0.9.1),
// its Japanese translation (screen labels "AEOスコア", "もう一度診断する",
// "今すぐチェック", "測定（β）") and docs/pro-measurement-implementation.md:
// - Free AI check (Free/Standard): once a month, three questions built from
//   business type and area (never the business name) on Perplexity; whether
//   the business was named or the site cited, and who appeared instead.
// - Pro measurement (beta, Perplexity): samples answers, read as direction of
//   travel; trend only compares runs whose settings/brand profile/model/engine
//   conditions match; failures are not in the denominator; rates with fewer
//   than 2 answers are not shown; a gap shows "no citation observed" without
//   guessing the cause.
// - Diagnosis history held by the service; WP-CLI `wp nurevo status|diagnose|
//   export|import`; settings export under Settings > Tools.
// - Training crawlers (GPTBot etc.) are left to robots.txt; blocking them does
//   not affect AI search or the score. Search crawlers allowed: OAI-SearchBot,
//   ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User.
//
// Outside facts and where they were read:
// - SparkToro / Gumshoe study, as reported by Search Engine Land (read
//   2026-11-14; SparkToro's own page could not be fetched from here): ~600
//   volunteers, 12 prompts, ChatGPT/Claude/Google's AI, nearly 3,000 runs;
//   same list twice under 1 in 100; same order about 1 in 1,000; some brands
//   in 60-90% of answers for an intent.
// - AI検索ドック (Stellagent) own study, 2026-10-01, 30 questions x 3 AIs x 10
//   runs: average gap between one run and the 10-run rate 29.9 pts (1 run),
//   16.5 (3 runs), 10.7 (5 runs). Vendor study; say so. Read 2026-11-14.
// - Search Engine Journal 2026-08-19 (Promptwatch data): reddit.com share of
//   ChatGPT search citations 3.83% (Jul 18-Aug 7) to 0.52% (Aug 14-17);
//   Promptwatch calls it provisional and cannot rule out a data issue; cause
//   not explained. Read 2026-11-14.
// - GMO NIKKO survey (TRUE MARKETING, 2026-09-29; PRIZMA, 2026-08-10..12,
//   n=1,003): top challenge among implementers = measurement / KPI design,
//   37.9% (subset n not stated). Read 2026-11-14.
// - Google: AI features and your website; Search Console data anomalies
//   (Aug 13-17, 2026 logging issue, restored); Search generative AI control -
//   read 2026-11-10 for search-console-ai-features. OpenAI / Perplexity
//   crawler docs - read 2026-10-31 for measure-ai-visibility. The primary
//   pages could not be re-fetched on 2026-11-14; the copy says only what those
//   reads confirmed. Re-check them when you update this page.
// Not stated on purpose: any Cloudflare/CDN default, robots.txt propagation
// times, the arXiv study quoted by a vendor - not confirmed on a primary page.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  sel: "https://searchengineland.com/ai-recommendation-lists-rarely-repeat-study-468076",
  dock: "https://stellagent.ai/ja/ai-search-dock/blog/llmo-effect",
  sej: "https://www.searchenginejournal.com/why-reddits-chatgpt-citation-drop-isnt-fully-explained/534572/",
  gmo: "https://www.koukoku.jp/truemarketing/aio/20260929/",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  anomaliesJa: "https://support.google.com/webmasters/answer/6211453?hl=ja",
  anomaliesEn: "https://support.google.com/webmasters/answer/6211453?hl=en",
  controlJa: "https://support.google.com/webmasters/answer/16908024?hl=ja",
  controlEn: "https://support.google.com/webmasters/answer/16908024?hl=en",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  perplexityBots: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
};
const PARTNER = "https://nurevo.jp/partner/";

export default {
  slug: "ai-visibility-drop-causes",
  targetQueries: [
    "AI visibility dropped why",
    "ChatGPT stopped citing my client's site",
    "how to explain AI visibility drop to clients",
    "AI検索 登場率 下がった 原因",
    "LLMO 効果 下がった 報告",
    "ChatGPT 引用されなくなった 原因",
  ],
  related: ["measure-ai-visibility", "agency-aeo-monthly-service", "search-console-ai-features", "llms-txt", "aeo-tools-comparison"],
  locales: {
    ja: {
      title: "AI登場率が下がったときの原因の切り分け：制作会社の報告手順 | Nurevo",
      description: "AIでの登場率が下がったら、①本当に下がったか②どのAI・どの質問で下がったか③サイト側・外部・AI側のどれが原因かの順に確かめます。お客様への報告の書き方、WordPressでの確認手順も。",
      h1: "AIでの登場率が下がったときの原因の切り分け：制作会社がお客様に報告するまでの手順",
      lead: "AIでの登場率（AIの回答に名前が出る・サイトが引用される割合）が先月より下がったら、すぐに施策を変えるのではなく、①計測の条件が同じか、複数回測っても下がっているか、②どのAI・どの質問・言及と引用のどちらで下がったか、③原因はサイト側・サイトの外・AI側のどれか、の順に切り分けます。1回の計測での上下は珍しくなく、原因が確かめられないことも多いため、お客様への報告では「観測した事実」「確かめたこと」「わからないこと」「次に測ること」を分けて書きます。",
      intro: [
        "作成日：2026年11月14日（JST）。対象は、お客様のサイトのAI検索対策を月額で請け負い、毎月AIでの見え方を報告している制作会社・SEO会社・代理店です。",
        `AI検索対策に取り組む担当者が挙げる課題の1位は「効果測定・KPI設計の難しさ」（37.9%）だったという民間調査があります（GMO NIKKO、2026年8月、1,003人。[TRUE MARKETING](${SRC.gmo})）。測るのが難しい数字は、下がったときの説明はもっと難しくなります。この記事は、その場面のための手順です。`,
        "AIの回答は日や聞き方によって変わります。この記事の手順は、下がった理由を確かめ、お客様に正確に伝えるためのものです。AIの回答に必ず表示されることや、数字が戻ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "まず確かめる：1回の計測の上下は珍しくない",
          paragraphs: [
            `AIは同じ質問にも毎回少しずつ違う答えを返します。SparkToroとGumshoeの調査では、約600人のボランティアが12個の同じ質問をChatGPT・Claude・GoogleのAIに3,000回近く投げたところ、同じおすすめの一覧が2回返ってくる確率は100回に1回未満、同じ順番まで一致するのは約1,000回に1回でした。一方で、ある意図の質問に対して回答の60〜90%に登場するブランドもありました（[Search Engine Landの記事](${SRC.sel})）。順位ではなく「何回のうち何回出たか」で見るべき理由です。`,
            `回数による差も大きく出ます。AI検索ドック（ステラジェント社）の自社調査（2026年10月、30問×3つのAI×10回）では、1回だけ聞いた結果と10回の平均との差は平均29.9ポイント、3回で16.5ポイント、5回で10.7ポイントでした（[同社の記事](${SRC.dock})）。一事業者の調査ですが、毎月1回ずつ聞いて比べるだけでは、10〜30ポイントの上下が起きても不思議ではないことがわかります。`,
            "そこで、「下がった」と報告する前に、次の2つを確かめます。",
          ],
          list: [
            "同じ質問を同じ条件で、日を変えて複数回聞き直しても下がっているか。",
            "前月と今月で、計測の条件（次の項目）が同じか。",
          ],
        },
        {
          heading: "段階1：計測の条件が変わっていないか",
          paragraphs: [
            "数字が変わった原因が、サイトでもAIでもなく、測り方の変化だったということはよくあります。前月の記録と、次の項目を1つずつ照らし合わせてください。",
          ],
          table: {
            head: ["確かめる項目", "変わると何が起きるか"],
            rows: [
              ["質問の文言・本数", "1問の入れ替えや言い回しの違いで、出てくる会社が変わる。分母も変わる"],
              ["聞いた回数", "回数が減ると、上下の幅が大きくなる（上の調査を参照）"],
              ["AIの種類・モデル", "ChatGPTとPerplexityは別のもの。同じAIでもモデルや設定が変わると比べられない"],
              ["言語・地域・ログイン状態", "地域名を含む質問は、どこから聞いたかで答えが変わりうる"],
              ["計測ツールの仕様", "ツールの更新で、判定のしかたや取得元が変わることがある。更新履歴を確認する"],
              ["失敗した回の扱い", "取得に失敗した回を「出なかった」に数えると、率が下がって見える"],
            ],
            caption: "条件が違う月どうしは、そのまま並べて比べず、条件を変えた月として報告します。",
          },
          after: [
            `計測する側のデータの問題もありえます。Googleは、2026年8月13日〜17日にSearch Consoleで記録の不具合があり、後にデータを復元したと公表しています（[Search Console のデータ異常](${SRC.anomaliesJa})）。また、ChatGPTの検索でreddit.comが引用される割合が2026年8月に3.83%から0.52%に下がったという計測会社Promptwatchのデータについて、同社自身が暫定の値で、自社側の取得の問題も否定できないとしています（[Search Engine Journal](${SRC.sej})）。急な落ち込みを見たら、まず計測側を疑うのが安全です。`,
          ],
        },
        {
          heading: "段階2：どこで下がったかを絞り込む",
          paragraphs: [
            "本当に下がっているとわかったら、次は「どこで」を絞ります。AI別、質問別、そして「言及（名前が出た）」と「引用（サイトが出典に出た）」を分けて、前月と比べてください。下がり方の形で、疑う場所が変わります。",
          ],
          table: {
            head: ["下がり方の形", "まず疑うところ"],
            rows: [
              ["どのAIでも同時に下がった", "サイト側の変化（クローラを止めた、ページが消えた、インデックスから外れた）か、計測条件の変化"],
              ["1つのAIだけ下がった", "そのAIのクローラだけ止まっていないか。止まっていなければ、そのAI側の変化の可能性"],
              ["特定の質問だけ下がった", "その質問に答えるページの変更・削除、または競合の新しいページ"],
              ["名前は出るが、引用だけ減った", "出典がポータルサイトや口コミサイトなど別のサイトに移った"],
              ["自社は同じだが、競合が増えた", "自社が下がったのではなく、競合が上がった。比べる相手（分母）を確認する"],
              ["会社名で聞いた質問で、内容が間違っている", "登場率ではなく事実の問題。サイト・Googleビジネスプロフィール・ポータルの情報の食い違いを確認する"],
            ],
            caption: "会社名を入れた質問（指名）と入れない質問（発見）は分けて集計します。指名の質問はほぼ必ず名前が出るため、混ぜると率の動きが見えにくくなります。",
          },
        },
        {
          heading: "段階3：原因の候補と、確かめ方",
          paragraphs: [
            "絞り込んだ場所に合わせて、原因の候補を確かめます。自分で確かめられるサイト側から順に見ていくと、無駄がありません。",
          ],
          table: {
            head: ["原因の候補", "確かめ方"],
            rows: [
              ["AI検索のクローラを止めている", `/robots.txt を開き、OAI-SearchBot（ChatGPTの検索）やPerplexityBot（Perplexity）がDisallowになっていないか（[OpenAI：クローラ](${SRC.openaiBots})、[Perplexity：クローラ](${SRC.perplexityBots})）。セキュリティ系のプラグインやサーバーのボット対策の設定も確認する`],
              ["Googleでの表示条件を外れた", `GoogleはAI機能に出る条件を「インデックスされ、スニペット付きで表示できること」としている（[Google：AI機能とウェブサイト](${SRC.googleAi})）。noindex・nosnippetの追加、URL検査でのインデックス状態を確認する`],
              ["Search Consoleで除外した", `［設定］＞［検索の生成 AI］で、サイトがAI機能から除外されていないか（[Search Console ヘルプ](${SRC.controlJa})）`],
              ["ページの削除・URLの変更", "リニューアルやパーマリンクの変更で、引用されていたURLが404やリダイレクトになっていないか"],
              ["構造化データ・llms.txtが消えた", "テーマやSEOプラグインの変更・更新のあと、ページのソースにJSON-LDが残っているか、/llms.txt が開けるか"],
              ["事実が古い・食い違う", "営業時間・料金・所在地が、サイト・Googleビジネスプロフィール・ポータルで同じか"],
              ["競合や他のサイトが出典になった", "回答の出典に並ぶサイトを前月と比べ、新しく入ったサイトとそのページの内容を見る"],
              ["AI側の変化", "公式の発表や業界ニュースを確認する。確かめられなければ「AI側の変化の可能性」にとどめる"],
            ],
            caption: "AIの学習用クローラ（GPTBotなど）を止めても、AI検索での引用には直接関係しません。止めているクローラが学習用か検索用かを区別してください。",
          },
          after: [
            "原因がAI側にあるとき、制作会社がすぐにできることは多くありません。たとえば上のreddit.comの例でも、ChatGPTの検索の仕組みの変更と同じ時期に起きたものの、時期が完全には一致せず、原因は説明されていません（[Search Engine Journal](" + SRC.sej + ")）。根拠のないまま「AIのアルゴリズムが変わったため」と報告すると、次に別の理由で下がったときに説明がつかなくなります。",
          ],
        },
        {
          heading: "WordPressでの確認手順（Nurevo AEOを使っている場合）",
          paragraphs: [
            `お客様のサイトがWordPressでNurevo AEOを使っている場合は、段階3のサイト側の確認を次の順で短くできます。まだ入れていないサイトでも、[WordPress.org](${WP_ORG})から無料で入れて、診断だけ使うこともできます。`,
          ],
          list: [
            "管理画面の［Nurevo AEO］＞［AEOスコア］で［もう一度診断する］を押し、信号の色とチェックリストを前月と比べる。診断ではトップページ、/robots.txt、/llms.txt が確認されます。",
            "サイトをNurevoのサービスに接続している場合は、診断の履歴で、いつからスコアが変わったかを確かめる。",
            "設定の［ツール］から設定をJSONで書き出し（WP-CLIなら wp nurevo export）、前月に書き出したものと比べて、事業情報や出力の設定が変わっていないか確かめる。毎月の作業として書き出しておくと、比べる材料になります。",
            "SEOプラグインやテーマを入れ替えたときは、構造化データがどちらから出ているか、重複・消失がないかをページのソースで確かめる（Nurevo AEOはYoast SEO・Rank Math・AIOSEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitとの併用に対応しています）。",
            "ほかのプラグインやサーバーの設定で、AI検索のクローラが止められていないかを /robots.txt で確かめる。Nurevo AEOは検索用のクローラ（OAI-SearchBot、ChatGPT-User、Claude-SearchBot、Claude-User、PerplexityBot、Perplexity-User）を許可し、学習用のクローラはrobots.txtの設定に任せます。",
          ],
          after: [
            "無料プランとStandardプランの「無料AIチェック」は、月に1回、業種と地域から作った3つの質問（店名は入れません）をPerplexityに聞き、名前が出たか・サイトが引用されたか、代わりに誰が出たかを表示します。3問×1回の結果なので、月ごとの上下は大きく出ます。下がったときは［今すぐチェック］で今月分を早めに確かめつつ、1か月の結果だけで判断しないでください。",
          ],
        },
        {
          heading: "お客様への報告の書き方",
          paragraphs: [
            "下がった月の報告では、確かめたことと推測を混ぜないことがいちばん大切です。次の5つの欄に分けて書くと、お客様も判断しやすく、翌月以降の説明もぶれません。",
          ],
          table: {
            head: ["欄", "書くこと", "書き方の例"],
            rows: [
              ["観測した事実", "どの質問・どのAIで、何回中何回が、前月の何回からどう変わったか", "Perplexityで「〇〇市 歯医者 土曜」を5回聞き、名前が出たのは1回（前月は5回中3回）"],
              ["計測条件", "前月と同じか、違えば何が違うか", "質問・回数・AIは前月と同じ"],
              ["確かめたこと", "段階3で確認した項目と結果", "robots.txt・インデックス・構造化データ・llms.txtに問題なし。出典に新しく地域のポータルサイトが入った"],
              ["わからないこと", "確かめられなかった原因の候補", "AI側の仕組みの変化があったかは、公表された情報がなく不明"],
              ["次の対応と次の計測", "やること、やらないこと、次にいつ何を測るか", "ポータルの掲載情報をサイトと同じ内容に更新。来週に同じ条件で5回測り直す"],
            ],
          },
          list: [
            "「必ず戻ります」「順位を回復させます」と約束しない。",
            "1回の結果で、ページの書き直しなど大きな施策を決めない。下がりが続くことを確かめてから。",
            "原因がサイト側にあった場合（制作会社の作業によるものも含めて）は、そのまま書く。直した日を記録し、その後の計測で効果を確かめる。",
          ],
        },
        {
          heading: "次に下がったときに慌てないための、毎月の仕組み",
          list: [
            "質問・回数・AI・言語の計測条件を固定し、記録しておく。変えるときは、変えた月を明記する。",
            "1つの質問は、少なくとも数回聞いて率で見る。回数を増やすほど上下の幅は小さくなるが、費用と手間も増えるので、お客様と回数を決めておく。",
            "サイトの変更（テーマ・プラグインの更新、ページの追加・削除、URLの変更）を日付つきで記録する。変更の前後で測ると、原因を確かめやすい。",
            "指名と発見の質問、言及と引用を分けて集計する。",
            "契約書や提案書には、AIの回答が変動することと、掲載や順位を保証しないことを書いておく（[月額サービスにする方法](/guide/agency-aeo-monthly-service)）。",
          ],
          after: [
            "Nurevo AEOのProプラン（月14,800円〜、ベータ）の継続計測は、現在Perplexityで行い、設定・事業情報・モデル・AIの条件が同じ回どうしだけを推移として並べます。取得に失敗した回は分母に入れず、回答が2件未満のときは率を出しません。引用がなかった質問は「引用が観測されなかった」と示し、原因を推測して表示することはしません。サンプルにもとづく数字なので、正確な割合ではなく傾向として読んでください。",
            "制作会社向けには、複数のサイトを1つの画面で管理する機能と、社名・ロゴ入りの月次レポートがあります。正直に言えば、追えるAIの数や質問の数では計測専門のツールのほうが多く、計測は別のツールと組み合わせるのも選択肢です（[AEOツールの比較](/guide/aeo-tools-comparison)）。詳しくは[パートナープログラム](" + PARTNER + ")をご覧ください。",
          ],
        },
        {
          heading: "下がったときのチェックリスト",
          list: [
            "前月と同じ質問・回数・AI・言語で測ったか",
            "日を変えて複数回測り直しても下がっているか",
            "計測ツールの更新や取得の失敗がなかったか（Search Consoleのデータ異常のページも確認）",
            "どのAI・どの質問・言及と引用のどちらで下がったかを分けたか",
            "自社が下がったのか、競合が上がったのかを分けたか",
            "robots.txtで検索用のクローラが止められていないか",
            "noindex・nosnippet・Search Consoleの除外設定がないか",
            "引用されていたページが残っているか（404・リダイレクト）",
            "構造化データとllms.txtが出ているか",
            "サイト・Googleビジネスプロフィール・ポータルの事実が同じか",
            "報告で、観測した事実・確かめたこと・わからないことを分けたか",
          ],
        },
      ],
      faqs: [
        { q: "AIでの登場率が先月より下がりました。まず何をすればよいですか？", a: "施策を変える前に、前月と同じ質問・回数・AIで測ったかを確かめ、日を変えて何回か測り直してください。1回の計測では10〜30ポイントの上下が出ることもあります。下がりが続くときに、どのAI・どの質問で下がったかを絞り込みます。" },
        { q: "何回測れば「下がった」と言えますか？", a: "決まった回数はありません。回数が多いほど上下の幅は小さくなり、民間の調査では1回と10回の平均の差が平均約30ポイント、5回で約11ポイントでした。お客様と回数を決め、同じ回数で比べることが大切です。" },
        { q: "ChatGPTだけで下がりました。サイトの問題ですか？", a: "1つのAIだけで下がったときは、まずそのAIの検索用クローラ（ChatGPTならOAI-SearchBot）がrobots.txtやボット対策で止められていないかを確かめます。止まっていなければ、そのAI側の変化の可能性がありますが、確かめられないときは推測として報告します。" },
        { q: "原因がわからないとき、お客様にどう報告すればよいですか？", a: "観測した事実、計測条件、確かめたこと、わからないこと、次の対応と次の計測を分けて書きます。「AIのアルゴリズムが変わったため」と根拠なく書くより、確かめた範囲を正直に伝えるほうが、翌月以降の信頼につながります。" },
        { q: "GPTBotをブロックしたせいで下がったのでしょうか？", a: "GPTBotはAIの学習用のクローラで、ChatGPTの検索で使われるのはOAI-SearchBotです。学習用を止めても、AI検索での引用には直接関係しません。robots.txtで止めているのがどちらかを確かめてください。" },
        { q: "Nurevo AEOの無料AIチェックで「出なかった」と表示されました。", a: "無料AIチェックは月1回、3つの質問をPerplexityに聞いた結果です。回数が少ないため月ごとの上下は大きく出ます。［今すぐチェック］で確かめつつ、AEOスコアの診断でサイト側に問題がないかを見てください。" },
        { q: "この手順で数字は必ず戻りますか？", a: "いいえ。AIの回答は変動し、どのツールや方法でも表示や順位は保証できません。この手順は、下がった理由を確かめ、サイト側で直せることを直し、お客様に正確に伝えるためのものです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、お客様のサイトをAIがどう読んでいるか確認",
        body: "無料チェックは登録不要で、構造化データ・llms.txt・AIクローラの許可の状態がわかります。下がったときの最初の確認に使えます。制作会社向けの複数サイト管理と月次レポートはパートナープログラムで。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: PARTNER },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、ClaudeはAnthropic、GoogleとSearch ConsoleはGoogle LLC、Redditはreddit, Inc.の商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Why AI Visibility Dropped: A Diagnosis Guide for Agencies | Nurevo",
      description: "Client's AI visibility dropped? Check if the drop is real, where it happened, then whether the cause is the site, other sites or the AI. Report template included.",
      h1: "Why your client's AI visibility dropped: how to find the cause and report it",
      lead: "When the share of AI answers that name a client or cite their site falls from one month to the next, don't change the strategy straight away. Work in three steps: first check that you measured under the same conditions and that the drop holds across repeat runs; then locate it by AI, by question, and by mention versus citation; only then look for the cause on the site, outside the site or on the AI side. Swings between single runs are normal and the cause often can't be confirmed, so the client report should keep apart what you observed, what you checked, what you don't know and what you will measure next.",
      intro: [
        "Written November 14, 2026 (JST). This guide is for web agencies, SEO firms and consultants who run AI search optimization for clients on a retainer and report AI visibility every month.",
        `In a Japanese industry survey, the challenge most often named by people already working on AI search optimization was measurement and KPI design (37.9%) (GMO NIKKO, August 2026, 1,003 respondents; [TRUE MARKETING, in Japanese](${SRC.gmo})). A number that is hard to measure is even harder to explain when it goes down. This guide is for that moment.`,
        "AI answers change by day and by phrasing. The steps here are for finding out why a number fell and telling the client accurately. They do not guarantee that a business will appear in AI answers or that the number will recover.",
      ],
      sections: [
        {
          heading: "First, check: single-run swings are normal",
          paragraphs: [
            `AI tools give slightly different answers to the same question every time. In a study by SparkToro and Gumshoe, around 600 volunteers ran 12 identical prompts through ChatGPT, Claude and Google's AI nearly 3,000 times. The chance of getting the same list of recommendations twice was under 1 in 100, and the same list in the same order about 1 in 1,000. Yet some brands appeared in 60% to 90% of answers for a given intent ([Search Engine Land's write-up](${SRC.sel})). That is why you count how many runs out of how many named the client, rather than tracking a position.`,
            `The number of runs matters too. In its own study (October 2026, 30 questions, 3 AIs, 10 runs each), the Japanese vendor AI検索ドック (Stellagent) found that a single run differed from the 10-run average by 29.9 points on average, falling to 16.5 points with 3 runs and 10.7 points with 5 runs ([their article, in Japanese](${SRC.dock})). It is one vendor's study, but it shows that if you ask once a month and compare, a swing of 10 to 30 points is not surprising.`,
            "So before you report a drop, check two things:",
          ],
          list: [
            "Does the drop hold when you ask the same questions under the same conditions, several times, on different days?",
            "Were last month's and this month's measurements taken under the same conditions (listed below)?",
          ],
        },
        {
          heading: "Step 1: did the measurement conditions change?",
          paragraphs: [
            "Quite often, the number moved because the measurement changed, not the site or the AI. Compare last month's record with this month's, item by item.",
          ],
          table: {
            head: ["What to compare", "What happens if it changed"],
            rows: [
              ["Wording and number of questions", "Swapping one question or rephrasing it changes which businesses come up, and changes the denominator"],
              ["Number of runs", "Fewer runs mean wider swings (see the study above)"],
              ["Which AI and which model", "ChatGPT and Perplexity are different things. Even in one AI, a new model or setting breaks comparability"],
              ["Language, location, signed-in state", "Questions that name a place can be answered differently depending on where they are asked from"],
              ["Your measurement tool", "A tool update can change how answers are collected or judged. Read its changelog"],
              ["Failed runs", "Counting a failed run as \"did not appear\" makes the rate look lower"],
            ],
            caption: "Don't line up months measured under different conditions as if they were comparable; report them as months where the setup changed.",
          },
          after: [
            `The data itself can be the problem. Google has said that a logging issue affected Search Console from August 13 to 17, 2026, and that the data was later restored ([Search Console data anomalies](${SRC.anomaliesEn})). When the analytics firm Promptwatch reported that reddit.com's share of ChatGPT search citations fell from 3.83% to 0.52% in August 2026, it called the figure provisional and said it could not rule out a data collection issue on its own side ([Search Engine Journal](${SRC.sej})). When you see a sudden cliff, suspect the measurement first.`,
          ],
        },
        {
          heading: "Step 2: locate where it dropped",
          paragraphs: [
            "Once you know the drop is real, narrow down where. Compare with last month by AI, by question, and by mention (the name appeared) versus citation (the site was listed as a source). The shape of the drop tells you where to look.",
          ],
          table: {
            head: ["Shape of the drop", "Look here first"],
            rows: [
              ["Every AI dropped at once", "A change on the site (crawlers blocked, pages gone, pages dropped from the index) or a change in measurement"],
              ["Only one AI dropped", "Whether that AI's crawler alone is blocked. If not, possibly a change on that AI's side"],
              ["Only some questions dropped", "Changes to, or removal of, the page that answers them, or a new competitor page"],
              ["The name still appears, but citations fell", "The source moved to another site, such as a directory or review site"],
              ["The client held steady but competitors grew", "The client did not fall; competitors rose. Check who is in the denominator"],
              ["Questions naming the client get wrong facts", "A facts problem, not a visibility problem. Look for mismatches between the site, Google Business Profile and directories"],
            ],
            caption: "Count questions that include the business name (branded) separately from those that don't (discovery). Branded questions almost always surface the name, so mixing them hides movement in the rate.",
          },
        },
        {
          heading: "Step 3: candidate causes and how to check each",
          paragraphs: [
            "Check the candidate causes that fit where the drop happened. Start with what you can verify yourself on the site.",
          ],
          table: {
            head: ["Candidate cause", "How to check"],
            rows: [
              ["AI search crawlers are blocked", `Open /robots.txt and check that OAI-SearchBot (ChatGPT search) and PerplexityBot (Perplexity) are not disallowed ([OpenAI: crawlers](${SRC.openaiBots}), [Perplexity: crawlers](${SRC.perplexityBots})). Also check security plugins and the host's bot protection settings`],
              ["The page no longer qualifies on Google", `Google says a page needs to be indexed and eligible to be shown with a snippet to appear in its AI features ([Google: AI features and your website](${SRC.googleAi})). Look for new noindex or nosnippet tags and check the URL Inspection result`],
              ["The site was excluded in Search Console", `Check Settings > Search generative AI to see whether the site was excluded from AI features ([Search Console Help](${SRC.controlEn}))`],
              ["Pages removed or URLs changed", "After a redesign or a permalink change, a cited URL may now return 404 or redirect"],
              ["Structured data or llms.txt disappeared", "After a theme or SEO plugin change or update, check that JSON-LD is still in the page source and that /llms.txt opens"],
              ["Facts are out of date or inconsistent", "Check that hours, prices and address match across the site, Google Business Profile and directories"],
              ["A competitor or another site became the source", "Compare the sources listed in the answers with last month's, and read the pages that are new"],
              ["A change on the AI side", "Look for official announcements and industry news. If you can't confirm one, call it a possible AI-side change and no more"],
            ],
            caption: "Blocking AI training crawlers such as GPTBot has no direct bearing on citations in AI search. Check whether a blocked crawler is a training crawler or a search crawler.",
          },
          after: [
            "When the cause is on the AI side, there is usually little an agency can do quickly. In the reddit.com example above, the drop came around the same time as a change in how ChatGPT search runs its queries, but the timing does not fully match and the cause has not been explained ([Search Engine Journal](" + SRC.sej + ")). If you tell a client \"the AI algorithm changed\" without evidence, you will have nothing left to say the next time the number falls for a different reason.",
          ],
        },
        {
          heading: "Checking a WordPress site (with Nurevo AEO)",
          paragraphs: [
            `If the client's WordPress site runs Nurevo AEO, the site-side checks in step 3 can be shortened as follows. On a site that doesn't have it yet, you can install it free from [WordPress.org](${WP_ORG}) and use just the diagnosis.`,
          ],
          list: [
            "In the admin, go to Nurevo AEO > AEO Score, press \"Check again\" and compare the traffic-light status and checklist with last month. The diagnosis looks at the front page, /robots.txt and /llms.txt.",
            "If the site is connected to the Nurevo service, use the diagnosis history to see when the score changed.",
            "Export the settings as JSON under Settings > Tools (or with WP-CLI: wp nurevo export) and compare with last month's export to see whether business details or output settings changed. Exporting every month gives you something to compare against.",
            "After switching an SEO plugin or theme, check in the page source which plugin is emitting the structured data and that nothing is duplicated or missing. Nurevo AEO works alongside Yoast SEO, Rank Math, AIOSEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit.",
            "Check /robots.txt for AI search crawlers blocked by other plugins or server settings. Nurevo AEO allows the search crawlers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User) and leaves training crawlers to your robots.txt.",
          ],
          after: [
            "On the Free and Standard plans, the free AI check asks Perplexity three questions once a month, built from the business type and area (never the business name), and shows whether the business was named or the site cited, and who appeared instead. With three questions asked once, month-to-month swings will be large. When it shows a drop, press \"Check now\" to run this month's check early, and don't judge from one month's result.",
          ],
        },
        {
          heading: "How to write the client report",
          paragraphs: [
            "In a month where the number fell, the most important thing is not to mix what you checked with what you suspect. Splitting the report into these five parts makes it easier for the client to decide, and keeps your explanation consistent from month to month.",
          ],
          table: {
            head: ["Part", "What to write", "Example"],
            rows: [
              ["What we observed", "Which question and which AI, how many runs out of how many, and how that compares with last month", "Asked Perplexity \"dentist open Saturday in [city]\" 5 times; the client was named once (3 of 5 last month)"],
              ["Measurement conditions", "Same as last month, or what changed", "Same questions, run count and AI as last month"],
              ["What we checked", "The step 3 items and the result of each", "No problems with robots.txt, indexing, structured data or llms.txt. A local directory site is now among the sources"],
              ["What we don't know", "Candidate causes you could not confirm", "Whether the AI changed how it searches: no public information"],
              ["Next action and next measurement", "What you will do, what you won't, and when you will measure again", "Update the directory listing to match the site. Re-run the same 5 runs next week"],
            ],
          },
          list: [
            "Don't promise that the number will come back or that a position will be regained.",
            "Don't decide on large changes, such as rewriting pages, from one result. Confirm that the drop persists first.",
            "If the cause was on the site, including your own agency's work, say so. Record the date you fixed it and check the effect in later measurements.",
          ],
        },
        {
          heading: "A monthly routine so the next drop is less of a scramble",
          list: [
            "Fix the measurement conditions (questions, runs, AI, language) and write them down. When you change them, note the month.",
            "Ask each question several times and read a rate. More runs narrow the swings but cost more time and money, so agree the number of runs with the client.",
            "Log site changes with dates: theme and plugin updates, pages added or removed, URL changes. Measuring before and after a change makes causes easier to confirm.",
            "Count branded and discovery questions separately, and mentions and citations separately.",
            "State in the contract or proposal that AI answers vary and that appearance and position are not guaranteed ([turning AEO into a retainer](/guide/agency-aeo-monthly-service)).",
          ],
          after: [
            "Nurevo AEO's Pro plan (from USD 99/month, beta) measures on Perplexity today and only plots runs side by side as a trend when their settings, business details, model and AI conditions match. Failed runs stay out of the denominator, and no rate is shown when there are fewer than two answers. A question with no citation is shown as \"no citation observed\", without a guessed cause. The figures come from sampling, so read them as a direction of travel rather than an exact share.",
            "For agencies there is a dashboard for managing several client sites in one place and monthly reports with your company name and logo. To be fair, dedicated measurement tools track more AIs and more questions, and pairing Nurevo with one of them is a reasonable choice ([AEO tools compared](/guide/aeo-tools-comparison)). See the [partner program](" + PARTNER + ") for details.",
          ],
        },
        {
          heading: "Checklist for a drop",
          list: [
            "Measured with the same questions, runs, AI and language as last month",
            "Drop holds across several runs on different days",
            "No tool update or failed runs (and the Search Console data anomalies page checked)",
            "Drop located by AI, by question, and by mention versus citation",
            "Client falling separated from competitors rising",
            "Search crawlers not blocked in robots.txt",
            "No noindex, nosnippet or Search Console exclusion",
            "Previously cited pages still live (no 404 or redirect)",
            "Structured data and llms.txt still output",
            "Facts match across the site, Google Business Profile and directories",
            "Report separates what was observed, what was checked and what is unknown",
          ],
        },
      ],
      faqs: [
        { q: "My client's AI visibility fell this month. What should I do first?", a: "Before changing anything, confirm that you measured with the same questions, runs and AI as last month, and re-run a few times on different days. A single run can swing by 10 to 30 points. If the drop holds, narrow down which AI and which questions it is in." },
        { q: "How many runs before I can call it a drop?", a: "There is no fixed number. More runs mean smaller swings: in one vendor study, a single run differed from the 10-run average by about 30 points on average, and 5 runs by about 11. Agree a number of runs with the client and compare like with like." },
        { q: "It only dropped in ChatGPT. Is that the site's fault?", a: "When only one AI drops, first check that its search crawler (OAI-SearchBot for ChatGPT) is not blocked in robots.txt or by bot protection. If it isn't, the change may be on that AI's side, but if you can't confirm it, report it as a possibility." },
        { q: "How do I report a drop when I don't know the cause?", a: "Write what you observed, the measurement conditions, what you checked, what you don't know, and your next action and next measurement. Being clear about what you verified builds more trust than blaming \"the algorithm\" without evidence." },
        { q: "Did blocking GPTBot cause the drop?", a: "GPTBot is OpenAI's training crawler; ChatGPT search uses OAI-SearchBot. Blocking the training crawler has no direct bearing on citations in AI search. Check which of the two your robots.txt blocks." },
        { q: "Nurevo AEO's free AI check says the business did not appear.", a: "The free AI check asks Perplexity three questions once a month, so month-to-month swings are large. Press \"Check now\" to re-check, and run the AEO Score diagnosis to see whether anything changed on the site." },
        { q: "Will following these steps bring the number back?", a: "No. AI answers vary, and no tool or method can guarantee appearance or position. These steps are for finding out why the number fell, fixing what can be fixed on the site, and telling the client accurately." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your client's site",
        body: "The free check needs no sign-up and shows the state of structured data, llms.txt and AI crawler access, which makes it a good first step after a drop. Multi-site management and branded monthly reports for agencies are part of the partner program.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Claude of Anthropic, Google and Search Console of Google LLC, and Reddit of reddit, Inc. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
