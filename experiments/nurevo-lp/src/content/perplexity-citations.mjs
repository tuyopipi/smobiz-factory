// Content page: how Perplexity reads and cites websites, and how a site owner
// can check it - the two documented crawlers (PerplexityBot / Perplexity-User),
// robots.txt and WAF rules, the 2025 Cloudflare report, what is and is not
// published about source selection, common claims in top articles and how
// strong their evidence is, WordPress steps with Nurevo AEO, and measuring.
//
// Written 2026-11-18 (JST). Product facts come from the plugin and service:
// - readme.txt (0.9.2): AI crawler rules allow PerplexityBot and
//   Perplexity-User (with OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
//   Claude-User) in the virtual robots.txt; the site's own rules such as
//   Disallow: /wp-admin/ are repeated in those groups; training crawlers are
//   left to the owner. The free AI check asks Perplexity three unbranded
//   questions a month (built from business type and area) and records whether
//   the business was named or the site cited; the plugin itself never
//   contacts Perplexity. Pro AI visibility (beta) measures Perplexity.
// - nurevo-webmcp.php: setting label "Allow AI search crawlers ... in the
//   virtual robots.txt file".
// - docs/pro-measurement-implementation.md: up to 20 fixed questions, N = 1..3
//   (default 2), up to 10 competitor domains; citation order is the order of
//   the provider's source list, not a ranking; failures are not in the
//   denominator; rates with fewer than 2 answers are null; mention and error
//   review are separate.
// - worker/aeo-sov.mjs analyzeAnswer: "named" = the business name (aliases)
//   in the answer text; "cited" = own host among the engine's citations or
//   URLs in the text; competitor hosts exclude aggregators.
// - aeo-signals-ai-answers-study (published guide): 62 local businesses,
//   Spearman rho = 0.03 between on-site score and Perplexity appearance.
//
// Outside facts and where they were read (2026-11-18):
// - Perplexity crawlers docs (two pages): PerplexityBot surfaces and links
//   websites in Perplexity search results and is not used to crawl content
//   for AI foundation models; Perplexity-User fetches pages when a user asks
//   and "generally ignores robots.txt rules"; IP range JSON files; changes may
//   take up to 24 hours; WAF rules match user agent and IP ranges.
// - Cloudflare blog, 2025-08-04: reported undeclared crawling of test domains
//   that disallowed crawling, and removed Perplexity as a verified bot.
//   Request counts came from a summary of a truncated page, so not stated.
//   PC Gamer 2025-08-05: Perplexity disputed the report.
// - Top articles read: fyve, alejandrorioja (ja), jinrai, 0120.co.jp x2,
//   koukoku.jp (GMO) / pepper.inc, Discovered Labs, LLM Pulse, Texta,
//   Fuel Online, Wix Studio, NAV43.
// Not stated on purpose: candidate-pool sizes, scoring weights, Reddit
// shares, "time to first citation", Bing dependence (no primary source).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  pplxCrawlers: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  pplxBotGuide: "https://docs.perplexity.ai/guides/perplexitybot",
  pplxBotIps: "https://www.perplexity.com/perplexitybot.json",
  pplxUserIps: "https://www.perplexity.com/perplexity-user.json",
  cloudflare: "https://blog.cloudflare.com/perplexity-is-using-stealth-undeclared-crawlers-to-evade-website-no-crawl-directives/",
  pcgamer: "https://www.pcgamer.com/software/ai/cloudflare-calls-out-perplexity-for-hiding-crawling-activity-as-ai-bot-scrapes-websites-that-explicitly-disallow-it-perplexity-responds-by-calling-them-more-flair-than-cloud",
};

const ROBOTS_ALLOW = `# Perplexity の検索・回答に使われるクローラーを通す例
User-agent: PerplexityBot
Allow: /
Disallow: /wp-admin/

User-agent: Perplexity-User
Allow: /
Disallow: /wp-admin/`;

const ROBOTS_ALLOW_EN = `# Allow the crawlers Perplexity uses for search and answers
User-agent: PerplexityBot
Allow: /
Disallow: /wp-admin/

User-agent: Perplexity-User
Allow: /
Disallow: /wp-admin/`;

const CURL = `# 1) robots.txt に2つのクローラーの行があるか
curl -s https://example.jp/robots.txt | grep -i -A3 perplexity

# 2) PerplexityBot を名乗ったアクセスが 200 で返るか（403・503・確認画面は要注意）
curl -s -o /dev/null -w "%{http_code}\\n" \\
  -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" \\
  https://example.jp/

# 3) アクセスログで実際に来ているか（ログの場所はサーバーによって違う）
grep -E "PerplexityBot|Perplexity-User" access.log | tail -20`;

const CURL_EN = `# 1) Does robots.txt have lines for both crawlers?
curl -s https://example.com/robots.txt | grep -i -A3 perplexity

# 2) Does a request with the PerplexityBot user agent get a 200? (403, 503 or a challenge page is a problem)
curl -s -o /dev/null -w "%{http_code}\\n" \\
  -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" \\
  https://example.com/

# 3) Are they actually visiting? (the log location depends on your server)
grep -E "PerplexityBot|Perplexity-User" access.log | tail -20`;

const FOOT_JA = "PerplexityはPerplexity AI、ChatGPTはOpenAI、GoogleはGoogle LLC、CloudflareはCloudflare, Inc.の商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。";
const FOOT_EN = "Perplexity is a trademark of Perplexity AI, ChatGPT of OpenAI, Google of Google LLC and Cloudflare of Cloudflare, Inc. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.";

export default {
  slug: "perplexity-citations",
  targetQueries: [
    "how to get cited by Perplexity",
    "PerplexityBot Perplexity-User robots.txt",
    "how does Perplexity choose sources",
    "Perplexity 引用される 方法",
    "Perplexity 対策 robots.txt PerplexityBot",
    "Perplexity 自社サイト 表示されない",
  ],
  related: ["measure-ai-visibility", "appear-in-chatgpt", "aeo-signals-ai-answers-study", "blog-articles-ai-citations", "llms-txt"],
  locales: {
    ja: {
      title: "Perplexityに引用される仕組みと確かめ方：2つのクローラー | Nurevo",
      description: "Perplexityがサイトを読む2つのクローラー（PerplexityBotとPerplexity-User）の違い、robots.txtとWAFの設定、公式に分かっていること・いないこと、WordPressの手順と引用の確かめ方。",
      h1: "Perplexityに自社サイトが引用される仕組みと、引用されているかの確かめ方",
      lead: "Perplexityは、質問を受けるとウェブを検索し、読んだページを回答の出典として番号付きで示します。サイト側でできることは、①Perplexityの2つのクローラー（検索用のPerplexityBotと、質問に応じてページを読むPerplexity-User）を robots.txt とWAF（ファイアウォール）で止めていないかを確かめ、②質問への答えと事実を本文の文字で書き、③社名を入れない質問で実際に引用されているかを繰り返し記録することです。どのページを出典に選ぶかの基準は、Perplexityから公開されていません。",
      intro: [
        "作成日：2026年11月18日（JST）。ChatGPTを中心にした手順は[ChatGPTに載る方法](/guide/appear-in-chatgpt)、AIでの登場率の測り方全般は[AIでの登場率の測り方](/guide/measure-ai-visibility)で扱っています。この記事は、Perplexityに絞って、公式の資料で確かめられることと、サイト側で確かめる手順を書きます。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、Perplexityがサイトを読める状態にし、引用されているかを正しく測るためのもので、回答に出ることや順位を保証するものではありません。",
      ],
      sections: [
        {
          heading: "Perplexityについて、公式に分かっていること・分かっていないこと",
          paragraphs: [
            "Perplexityの回答には、多くの場合、本文の中の番号と、出典のリンクの一覧が付きます。どのページがどこで使われたかが見えるため、他のAIより「引用されたか」を確かめやすいのが特徴です。一方で、候補のページをどう集め、どう順位を付け、何件を出典にするかは公開されていません。",
            "上位の記事には「候補を5〜10件集めて3〜4件を引用する」「候補は20〜50件」など具体的な数字がありますが、記事によって食い違い、Perplexityの資料に根拠を確認できませんでした。この記事では、Perplexityが自社の資料に書いていることだけを事実として扱います。",
          ],
          table: {
            head: ["項目", "公式の資料にあるか", "内容"],
            rows: [
              ["使うクローラーの名前と目的", "ある", `PerplexityBot（検索結果にサイトを出してリンクするため）と Perplexity-User（ユーザーの質問に応じてページを読むため）の2つ（[Perplexity：クローラーの説明](${SRC.pplxCrawlers})）`],
              ["AIモデルの学習に使うか", "ある", "どちらも、AIの基盤モデルの学習のためにコンテンツを集めるものではない、としています"],
              ["robots.txt に従うか", "一部ある", "Perplexity-User は「ユーザーが求めた取得なので、robots.txt の決まりを一般に無視する」と書かれています。PerplexityBot は robots.txt で管理する前提で説明されています"],
              ["設定の反映にかかる時間", "ある", "変更がシステムに反映されるまで最大24時間かかることがある、としています"],
              ["クローラーのIPアドレスの範囲", "ある", `JSONで公開（[PerplexityBot](${SRC.pplxBotIps})・[Perplexity-User](${SRC.pplxUserIps})）`],
              ["出典を選ぶ基準・件数・順番", "ない", "公開されていません。記事に出てくる「重み付け」「候補の件数」は推測です"],
              ["Bingなど他の検索エンジンの結果を使うか", "確認できず", "「一部Bingを使う」と書く記事がありますが、一次情報を確認できませんでした"],
            ],
          },
        },
        {
          heading: "上位の記事でよく見る主張と、根拠の強さ",
          paragraphs: [
            "「Perplexity 引用される 方法」「how to get cited by Perplexity」で上位に出る日本語6本・英語7本を読みました。「質問への答えを先に書く」「一次情報と日付を書く」「PerplexityBotを止めない」は、ほぼすべてに共通します。一方で、数字の多くは出典がないか、書いた会社自身の観察でした。",
          ],
          table: {
            head: ["よく見る主張", "根拠の強さ", "この記事での扱い"],
            rows: [
              ["「PerplexityBotを許可すれば引用される」", "許可は必要条件。許可だけで引用されるという根拠はない", "止めていないかを確かめる手順として書く"],
              ["「候補は◯件、引用は◯件」", "記事によって5〜10件、約10件、20〜50件とばらばら", "使わない"],
              ["「関連性30%・品質25%…」のような採点の重み", "Perplexityは公開していない", "使わない"],
              ["「Redditが引用の46.7%」", "記事によって出典の会社も、対象（全体か、特定のモードか）も違う", "使わない"],
              ["「変更から引用まで平均◯日」", "著者自身の、件数の書かれていない試し", "使わない。反映は最大24時間という公式の記述だけを書く"],
              ["「FAQの構造化データで引用が増える」", "支援会社の観察が中心。公式の説明はない", "本文の質問と答えを機械にも分かる形で添えるもの、として扱う"],
              ["「robots.txtで許可すれば全部通る」", "Perplexity-User は robots.txt を一般に無視する。逆に、WAFやCDNのボット対策で止まることがある", "robots.txt とWAFの両方を確かめる"],
            ],
          },
          after: [
            "13本のうち、2つのクローラーの違いを説明していたのは数本だけで、robots.txt が Perplexity-User には効かないことまで書いた記事、WAFでの確かめ方、WordPressでの手順、2025年のCloudflareの報告に触れた記事はほとんどありませんでした。以下はそこを中心に書きます。",
          ],
        },
        {
          heading: "2つのクローラー：PerplexityBot と Perplexity-User の違い",
          paragraphs: [
            "Perplexityの資料に書かれている2つのクローラーは、役割も robots.txt との関係も違います。片方だけ許可していると、引用の確かめ方を誤ります。",
          ],
          table: {
            head: ["", "PerplexityBot", "Perplexity-User"],
            rows: [
              ["目的", "Perplexityの検索結果にサイトを出し、リンクするためにページを集める", "ユーザーが質問したときに、正確に答えるためにページを読み、回答にリンクを付ける"],
              ["来るタイミング", "質問とは関係なく、定期的に", "誰かが質問したとき"],
              ["robots.txt", "robots.txt で許可・不許可を管理する前提", "ユーザーが求めた取得なので、robots.txt の決まりを一般に無視する"],
              ["止めたいとき", "robots.txt の Disallow", "robots.txt では止まらないことがある。WAFでユーザーエージェントとIP範囲を見て止める"],
              ["通したいとき", "robots.txt で止めない＋WAFで公開IP範囲を許可", "WAFで公開IP範囲を許可"],
              ["AIモデルの学習", "使わない、と説明", "使わない、と説明"],
            ],
          },
          after: [
            `ユーザーエージェントの書き方とIP範囲は、[クローラーの説明](${SRC.pplxCrawlers})と[PerplexityBotのガイド](${SRC.pplxBotGuide})に載っています。2つのページで例の書き方とIP範囲のファイルのドメインが少し違うため、WAFに登録するときは最新のページで確かめてください。`,
          ],
        },
        {
          heading: "robots.txt とWAFの設定：通したい場合・止めたい場合",
          paragraphs: [
            "Perplexityの回答に自社サイトを出典として出したい場合は、2つのクローラーを止めないことが前提です。robots.txt で個別のグループを作る場合は、サイト全体に効かせている決まり（例：/wp-admin/ を読ませない）も、そのグループの中に書き直します。クローラーは自分の名前のグループがあると、そのグループの決まりだけを見るためです。",
          ],
          code: ROBOTS_ALLOW,
          after: [
            "robots.txt を直しても、サーバーやCDNのボット対策（WAF、レンタルサーバーの「海外からのアクセス制限」、セキュリティ用のプラグインなど）が先にアクセスを拒否していることがあります。Perplexityの資料は、WAFではユーザーエージェントとIP範囲の両方で見分けるよう説明しています。名前だけで許可すると、名前をまねた別のアクセスまで通ってしまうためです。",
            "反対に、Perplexityに読まれたくない場合は、PerplexityBot を robots.txt で Disallow にし、Perplexity-User はWAFで止めます。止めても、他のサイトに書かれた自社の情報をもとに回答が作られることはあります。どちらの場合も、設定の反映には最大24時間かかることがあるとされています。",
          ],
        },
        {
          heading: "2025年のCloudflareの報告：知っておくべきこと",
          paragraphs: [
            `Cloudflareは2025年8月4日、Perplexityが、クロールを禁止したテスト用のドメインに対して、名乗らないクローラーでアクセスしていたと報告し、Perplexityを「確認済みのボット」の一覧から外したと公表しました（[Cloudflareのブログ](${SRC.cloudflare})）。Perplexityはこの報告に反論しています（[PC Gamer、2025年8月5日](${SRC.pcgamer})）。`,
            "サイト運営者にとっての意味は2つです。1つ目は、CloudflareなどのCDNを使っている場合、AIボットを止める設定がPerplexityにも効いている可能性があることです。引用されたいのに止めていないか、管理画面のボット対策の設定を確かめてください。2つ目は、読まれたくない場合に robots.txt だけに頼らず、WAFで止める設定もあわせて検討することです。どちらの主張が正しいかを、この記事では判断していません。",
          ],
        },
        {
          heading: "出典に選ばれやすくするために、ページ側でできること",
          paragraphs: [
            "Perplexityは選び方の基準を公開していませんが、出典として使える情報がページにないと、引用はされません。次は、Perplexityに限らず、AIが答えの根拠として使いやすいページにするための手入れです。記事の書き方の詳細は[AIに引用される記事の書き方](/guide/blog-articles-ai-citations)にまとめています。",
          ],
          list: [
            "質問に対する答えを、見出しのすぐ下の1〜2文で書く（「◯◯市で土曜に診療している歯科は？」なら、診療日と時間をそのまま書く）。",
            "料金・営業時間・対応地域・対象など、答えになる事実を画像やPDFだけにせず、HTMLの文字や表で書く。",
            "数字には、いつの時点の値か（「2026年11月改定」）と、他社の数字なら出典のリンクを付ける。",
            "1ページで扱う質問を絞る。サービスや店舗ごとにページを分け、ページ同士で事実を食い違わせない。",
            "社名・所在地・連絡先を、会社概要や構造化データ、外部のプロフィール（Googleビジネスプロフィールなど）とそろえる。",
            "JavaScriptを動かさないと本文が出ないページは、サーバー側で本文を出す形にする（クローラーがJavaScriptを動かすかは公開されていないため）。",
          ],
          after: [
            "Nurevoが日本の地域事業者62件で行った調査では、サイトの中のAEO対策を測るスコアと、Perplexityに名前を挙げられる・引用される割合の間に、関係は見られませんでした（[調査の詳細](/guide/aeo-signals-ai-answers-study)）。構造化データやllms.txtは、読める状態にするための土台で、それだけで引用が増えると考えないほうが安全です。",
          ],
        },
        {
          heading: "WordPressでの手順",
          paragraphs: [
            "WordPressは、サイトの直下に robots.txt のファイルがない場合、WordPress自身が robots.txt を作って返します（仮想の robots.txt）。プラグインで追加する決まりは、この仮想の robots.txt に入ります。サーバーに robots.txt のファイルを置いていると、そちらが優先され、プラグインの設定は反映されません。",
          ],
          list: [
            "ブラウザで https://自社のドメイン/robots.txt を開き、PerplexityBot と Perplexity-User の行があるか、User-agent: * で全体を Disallow にしていないかを見る。",
            `[Nurevo AEO（無料）](${WP_ORG})を入れると、AI検索のクローラーを仮想の robots.txt で許可する設定で、PerplexityBot と Perplexity-User（ChatGPT・Claudeの検索用クローラーも）を許可する行が入ります。サイトで使っている /wp-admin/ などの決まりは、そのグループにも書き直されます。AIの学習用クローラーは、初期設定では変えません。`,
            "サーバーに robots.txt のファイルがある場合は、そのファイルに上の例の行を足すか、ファイルを消して仮想の robots.txt を使う（消す前に中身を控える）。",
            "セキュリティ用のプラグインやレンタルサーバーのWAF、CDNで、ボットや海外のIPを止めていないかを確かめる。止めているなら、Perplexityが公開しているIP範囲を許可に足す。",
            "本文：答えになる事実を固定ページの文字で書く。Nurevo AEOは店舗・会社・サービスの事実を構造化データとllms.txtに出しますが、本文に書いていない事実を足すものではありません。",
            "下のコマンドで、robots.txt と、PerplexityBot を名乗ったアクセスへの応答を確かめる。",
          ],
          code: CURL,
          after: [
            "2つ目のコマンドは「名前で止めていないか」だけを確かめるものです。IP範囲で許可・拒否する設定の確認にはならないので、本当に来ているかは3つ目のアクセスログで見ます。ログに PerplexityBot が来ていて 403 や 503 が返っていれば、WAFなどで止まっています。",
          ],
        },
        {
          heading: "引用されているかの確かめ方",
          paragraphs: [
            "Perplexityの回答は聞くたびに変わるため、1回聞いて出た・出なかったで判断しないでください。次の3つを組み合わせます。",
          ],
          table: {
            head: ["方法", "分かること", "分からないこと・注意"],
            rows: [
              ["手で聞いて記録する", "社名を入れない質問（「◯◯市 歯科 土曜」など）で、名前が出たか、出典の一覧に自社のURLがあるか、何番目か", "1回では偶然が大きい。同じ質問を日を変えて複数回聞き、ログインの有無や地域の設定もそろえる"],
              ["アクセス解析の参照元", "回答のリンクから来た訪問（参照元に perplexity.ai などが残る場合）", "リンクをクリックされなかった引用や、名前だけの登場は分からない。アプリによっては参照元が残らないことがある"],
              ["サーバーのアクセスログ", "PerplexityBot・Perplexity-User が来ているか、どのページを読んだか、エラーになっていないか", "読まれたことと、回答に使われたことは別"],
            ],
          },
          after: [
            "社名を入れた質問（「◯◯歯科の土曜の診療時間は？」）は、事実を正しく読めているかの確認に使い、登場率の計算からは外します。社名を入れると出るのが当たり前で、新しいお客様が実際に聞く質問とは違うためです。",
            "Nurevo AEO の無料プランとStandardでは、月に1回、業種と地域から作った社名なしの質問3つをNurevoのサービスがPerplexityに聞き、名前が出たか・サイトが引用されたか・代わりに誰が出たかを管理画面に表示します（プラグイン自体はPerplexityに接続しません）。Pro（月14,800円〜、ベータ）では、最大20の質問を1〜3回ずつ聞き、競合のドメインと引用の回数を比べます。出典の順番はPerplexityが返した出典一覧の順で、検索順位やおすすめの順位ではありません。失敗した回は分母に入れず、回答が2件未満のときは率を出しません。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "robots.txt に PerplexityBot と Perplexity-User を止める行がない（User-agent: * の Disallow: / も含めて）",
            "個別のグループを作った場合、/wp-admin/ など全体の決まりもそのグループに書いた",
            "WAF・CDN・セキュリティ用プラグインで、Perplexityの公開IP範囲を止めていない",
            "PerplexityBot を名乗ったアクセスに 200 が返る",
            "アクセスログに PerplexityBot が来ていて、エラーになっていない",
            "答えになる事実（料金・時間・地域・対象）が本文の文字にある",
            "数字に時点と、他社の数字なら出典がある",
            "社名・所在地・連絡先が、サイト内と外部のプロフィールでそろっている",
            "社名なしの質問を決め、同じ条件で複数回聞いて記録している",
            "設定を変えた日を記録し、最大24時間後以降に確かめている",
          ],
        },
      ],
      faqs: [
        { q: "PerplexityBot を許可すれば、Perplexityに引用されますか？", a: "引用されるとは限りません。許可は読まれるための前提で、どのページを出典にするかはPerplexityが決め、その基準は公開されていません。" },
        { q: "robots.txt で Perplexity-User を Disallow にすれば、読まれなくなりますか？", a: "Perplexityの資料では、Perplexity-User はユーザーが求めた取得なので robots.txt の決まりを一般に無視するとされています。止めたい場合は、WAFでユーザーエージェントとIP範囲を見て止める方法を検討してください。" },
        { q: "Perplexityは読んだページをAIの学習に使いますか？", a: "Perplexityの資料では、PerplexityBot も Perplexity-User も、AIの基盤モデルの学習のためにコンテンツを集めるものではないと説明されています。" },
        { q: "robots.txt を直したら、すぐ反映されますか？", a: "Perplexityの資料では、変更が反映されるまで最大24時間かかることがあるとされています。確かめるのは翌日以降にしてください。回答に出るかどうかは、また別の話です。" },
        { q: "Perplexityで有料版を使うと、出典が変わりますか？", a: "プランやモードで回答の作り方が違う可能性はありますが、出典の選び方の違いは公開されていません。記録するときは、プラン・モード・ログインの有無をそろえてください。" },
        { q: "llms.txt を置くとPerplexityに引用されやすくなりますか？", a: "Perplexityがサイトの llms.txt を出典選びに使うという公式の説明は見つかりませんでした。置く場合は、主なページへの入口と事実の要約として扱ってください。詳しくは[llms.txtのガイド](/guide/llms-txt)にあります。" },
        { q: "Perplexityが自社について間違ったことを答えます。どうすればいいですか？", a: "回答の出典をたどり、自社サイトの古い記述なら直し、他のサイトの記述なら掲載元に更新を頼みます。AIの回答そのものを直接書き換えることはできず、反映までの時間も決まっていません。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIが自社サイトを読めるか確かめる",
        body: "無料チェックは登録不要です。URLを入れると、AIクローラーの許可、構造化データ、llms.txtの状態が分かります。WordPressなら無料のプラグインで、PerplexityBot と Perplexity-User を許可する設定と、事業の事実の構造化データをまとめて整えられます。",
        label: "AI対応を無料でチェック",
        href: "/check",
        secondary: { label: "無料のWordPressプラグインを入れてみる", href: WP_ORG },
      },
      footnote: FOOT_JA,
    },
    en: {
      title: "How Perplexity Cites Websites: Crawlers and Checks | Nurevo",
      description: "How Perplexity reads and cites sites: PerplexityBot vs Perplexity-User, robots.txt and WAF rules, what is and isn't published, WordPress steps and how to check citations.",
      h1: "How Perplexity cites websites, and how to check whether it cites yours",
      lead: "Perplexity searches the web when it gets a question and lists the pages it read as numbered sources. What a site owner can do is (1) make sure robots.txt and the firewall (WAF) do not block Perplexity's two crawlers, PerplexityBot for search and Perplexity-User for fetching pages when someone asks; (2) state answers and facts in the page text; and (3) record, again and again, whether unbranded questions actually cite you. Perplexity has not published how it chooses which pages to cite.",
      intro: [
        "Written 18 November 2026 (JST). For a ChatGPT-focused walkthrough see [How to appear in ChatGPT](/guide/appear-in-chatgpt); for measuring AI visibility in general see [How to measure AI visibility](/guide/measure-ai-visibility). This guide covers Perplexity only: what can be confirmed from Perplexity's own documentation, and the checks you can run on your site.",
        "AI answers change with the day and the wording. These steps make your site readable by Perplexity and help you measure citations correctly; they do not guarantee an appearance or a position in any answer.",
      ],
      sections: [
        {
          heading: "What Perplexity has published, and what it hasn't",
          paragraphs: [
            "Perplexity answers usually carry numbers in the text and a list of source links, so you can see which page was used where. That makes \"were we cited?\" easier to check than on most AI products. What is not public is how it gathers candidate pages, how it ranks them and how many it cites.",
            "Top-ranking articles quote specific figures, such as \"5-10 candidates, 3-4 cited\" or \"20-50 candidates\". They contradict each other, and none could be traced to Perplexity's documentation. This guide treats only what Perplexity documents as fact.",
          ],
          table: {
            head: ["Topic", "In Perplexity's docs?", "What they say"],
            rows: [
              ["Crawler names and purpose", "Yes", `PerplexityBot (to surface and link websites in Perplexity search results) and Perplexity-User (to read pages when a user asks) ([Perplexity crawlers](${SRC.pplxCrawlers}))`],
              ["Used to train AI models?", "Yes", "Neither is used to collect content for training AI foundation models, according to Perplexity"],
              ["Does it follow robots.txt?", "Partly", "Perplexity-User \"generally ignores robots.txt rules\" because a user requested the fetch. PerplexityBot is described as managed through robots.txt"],
              ["How long changes take", "Yes", "Up to 24 hours for its systems to reflect changes"],
              ["IP ranges", "Yes", `Published as JSON ([PerplexityBot](${SRC.pplxBotIps}), [Perplexity-User](${SRC.pplxUserIps}))`],
              ["How sources are chosen, how many, in what order", "No", "Not published. \"Weights\" and \"candidate counts\" in articles are guesses"],
              ["Whether it uses Bing or another engine's results", "Could not confirm", "Some articles say Perplexity partly uses Bing; no primary source was found"],
            ],
          },
        },
        {
          heading: "Common claims in top articles, and how strong the evidence is",
          paragraphs: [
            "We read 13 top results for \"how to get cited by Perplexity\" and its Japanese equivalent (6 Japanese, 7 English). Nearly all agree on putting the answer first, stating first-hand facts with dates, and not blocking PerplexityBot. Most of the numbers, though, have no source or come from the author's own observations.",
          ],
          table: {
            head: ["Common claim", "Strength of evidence", "How this guide treats it"],
            rows: [
              ["\"Allow PerplexityBot and you will be cited\"", "Allowing it is necessary, not sufficient. Nothing shows that allowing alone leads to citations", "Covered as a check that you are not blocking it"],
              ["\"It retrieves N candidates and cites M\"", "5-10, about 10 or 20-50, depending on the article", "Not used"],
              ["Scoring weights such as \"relevance 30%, quality 25%\"", "Perplexity has not published any", "Not used"],
              ["\"Reddit is 46.7% of citations\"", "Articles credit different companies and different scopes (all citations vs one mode)", "Not used"],
              ["\"On average it takes N days to get cited\"", "The author's own test, sample size not given", "Not used. Only the documented \"up to 24 hours\" for settings"],
              ["\"FAQ structured data increases citations\"", "Mostly agency observations; no official statement", "Treated as a machine-readable copy of questions and answers already on the page"],
              ["\"Allow it in robots.txt and everything gets through\"", "Perplexity-User generally ignores robots.txt, and WAF or CDN bot rules can still block both", "Check robots.txt and the WAF"],
            ],
          },
          after: [
            "Only a few of the 13 explained the difference between the two crawlers. Almost none said that robots.txt does not reliably apply to Perplexity-User, showed how to check a WAF, gave WordPress steps, or mentioned Cloudflare's 2025 report. Those are the focus below.",
          ],
        },
        {
          heading: "Two crawlers: PerplexityBot and Perplexity-User",
          paragraphs: [
            "The two crawlers in Perplexity's documentation have different jobs and a different relationship with robots.txt. If you allow only one, you can misread what is happening.",
          ],
          table: {
            head: ["", "PerplexityBot", "Perplexity-User"],
            rows: [
              ["Purpose", "Collects pages so Perplexity search can surface and link them", "Reads a page when a user asks a question, to answer accurately and link the page in the answer"],
              ["When it visits", "On its own schedule, regardless of questions", "When someone asks"],
              ["robots.txt", "Managed through robots.txt", "Generally ignores robots.txt rules, because a user requested the fetch"],
              ["To block it", "Disallow in robots.txt", "robots.txt may not stop it. Block it in the WAF by user agent and IP range"],
              ["To let it in", "Don't disallow it, and allow its published IP ranges in the WAF", "Allow its published IP ranges in the WAF"],
              ["AI model training", "Not used for it, per Perplexity", "Not used for it, per Perplexity"],
            ],
          },
          after: [
            `User-agent strings and IP ranges are in [Perplexity's crawler page](${SRC.pplxCrawlers}) and its [PerplexityBot guide](${SRC.pplxBotGuide}). The two pages show the user agent differently and host the IP files on slightly different domains, so check the current page when you add WAF rules.`,
          ],
        },
        {
          heading: "robots.txt and WAF rules: letting Perplexity in, or keeping it out",
          paragraphs: [
            "If you want Perplexity to cite your site, the starting point is not blocking either crawler. If you give them their own robots.txt groups, repeat the rules you apply site-wide (for example, keeping /wp-admin/ out) inside those groups: a crawler that finds a group with its own name follows only that group.",
          ],
          code: ROBOTS_ALLOW_EN,
          after: [
            "Even with robots.txt fixed, a server or CDN rule can refuse the request first: a WAF, a hosting provider's foreign-IP restriction, or a security plugin. Perplexity's documentation recommends WAF rules that match both the user agent and the IP range, because a rule based on the name alone also lets in anything that copies the name.",
            "If you do not want Perplexity to read your site, disallow PerplexityBot in robots.txt and block Perplexity-User in the WAF. Perplexity can still build answers about you from other sites. Either way, Perplexity says changes can take up to 24 hours to apply.",
          ],
        },
        {
          heading: "Cloudflare's 2025 report: what it means for you",
          paragraphs: [
            `On 4 August 2025, Cloudflare reported that Perplexity had used undeclared crawlers to access test domains that disallowed crawling, and said it had removed Perplexity from its list of verified bots ([Cloudflare blog](${SRC.cloudflare})). Perplexity disputed the report ([PC Gamer, 5 August 2025](${SRC.pcgamer})).`,
            "For site owners this means two things. First, if you use Cloudflare or another CDN, a setting that blocks AI bots may also be blocking Perplexity. If you want to be cited, check the bot settings in your dashboard. Second, if you want to keep Perplexity out, consider a WAF rule rather than relying on robots.txt alone. This guide does not judge which side of the dispute is right.",
          ],
        },
        {
          heading: "What you can do on the page to be a usable source",
          paragraphs: [
            "Perplexity does not publish its selection criteria, but a page without usable facts will not be cited. The points below make a page easier for any AI to use as evidence, not just Perplexity. For writing in detail, see [How to write articles AI cites](/guide/blog-articles-ai-citations).",
          ],
          list: [
            "Answer the question in the first one or two sentences under the heading (for \"Which dentists in X are open on Saturday?\", state the days and hours).",
            "Put the facts that answer questions (prices, hours, service area, who it is for) in HTML text or tables, not only in images or PDFs.",
            "Give every number a date (\"revised November 2026\") and, for other people's numbers, a source link.",
            "Keep each page to a narrow set of questions. Split services or locations into their own pages, and keep facts consistent between pages.",
            "Keep your name, address and contact details the same across your about page, structured data and outside profiles such as Google Business Profile.",
            "If the main text only appears after JavaScript runs, render it on the server (whether the crawlers run JavaScript is not published).",
          ],
          after: [
            "In Nurevo's study of 62 local businesses in Japan, our on-site AEO score showed no relationship with how often Perplexity named or cited a business ([study details](/guide/aeo-signals-ai-answers-study)). Structured data and llms.txt are groundwork that makes a site readable; it is safer not to expect them to raise citations on their own.",
          ],
        },
        {
          heading: "Steps in WordPress",
          paragraphs: [
            "When there is no robots.txt file in the site root, WordPress generates robots.txt itself (a virtual robots.txt). Rules added by plugins go into that virtual file. If a real robots.txt file exists on the server, it takes priority and plugin settings do not show up.",
          ],
          list: [
            "Open https://your-domain/robots.txt in a browser. Check for PerplexityBot and Perplexity-User lines, and that User-agent: * does not disallow the whole site.",
            `With [Nurevo AEO (free)](${WP_ORG}), the setting that allows AI search crawlers in the virtual robots.txt adds lines allowing PerplexityBot and Perplexity-User (and the ChatGPT and Claude search crawlers). Your existing rules, such as /wp-admin/, are repeated inside those groups. AI training crawlers are left as they are by default.`,
            "If a robots.txt file exists on the server, add the lines from the example above to it, or remove the file to use the virtual one (copy its contents first).",
            "Check that your security plugin, hosting WAF or CDN is not blocking bots or foreign IPs. If it is, add Perplexity's published IP ranges to the allow list.",
            "Content: write the facts that answer questions as text on your pages. Nurevo AEO publishes your business, company and service facts as structured data and in llms.txt, but it does not add facts your pages don't state.",
            "Run the commands below to check robots.txt and the response to a request with the PerplexityBot user agent.",
          ],
          code: CURL_EN,
          after: [
            "The second command only checks whether you block by name. It does not test rules based on IP ranges, so use the access log (the third command) to see whether the crawlers really visit. If PerplexityBot shows up with 403 or 503 responses, a WAF or similar rule is stopping it.",
          ],
        },
        {
          heading: "How to check whether Perplexity cites you",
          paragraphs: [
            "Perplexity answers change from one ask to the next, so don't judge from a single try. Combine these three methods.",
          ],
          table: {
            head: ["Method", "What it shows", "What it misses, and cautions"],
            rows: [
              ["Ask by hand and record", "For unbranded questions (\"Saturday dentist in X\"), whether your name appears, whether your URL is in the source list, and where", "One try is mostly chance. Ask the same questions on different days, with the same login state and location settings"],
              ["Analytics referrers", "Visits from links in answers (when a referrer such as perplexity.ai is kept)", "Citations nobody clicked and name-only mentions are invisible. Some apps do not pass a referrer"],
              ["Server access logs", "Whether PerplexityBot and Perplexity-User visit, which pages they read, and whether they get errors", "Being read is not the same as being used in an answer"],
            ],
          },
          after: [
            "Use branded questions (\"What are X Dental's Saturday hours?\") to check whether facts are read correctly, and leave them out of the appearance rate. A branded question almost always returns you, and it is not what a new customer asks.",
            "On Nurevo AEO's Free and Standard plans, the Nurevo service asks Perplexity three unbranded questions a month, built from your business type and area, and shows in wp-admin whether you were named, whether your site was cited and who appeared instead (the plugin itself never contacts Perplexity). Pro (from USD 99 a month, beta) asks up to 20 questions one to three times each and compares citation counts with competitor domains. The source order it shows is the order of Perplexity's source list, not a search ranking or a recommendation order. Failed runs are left out of the denominator, and no rate is shown with fewer than two answers.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "robots.txt has no line blocking PerplexityBot or Perplexity-User (including User-agent: * with Disallow: /)",
            "If they have their own groups, site-wide rules such as /wp-admin/ are repeated in them",
            "The WAF, CDN and security plugins do not block Perplexity's published IP ranges",
            "A request with the PerplexityBot user agent gets a 200",
            "The access log shows PerplexityBot visits without errors",
            "The facts that answer questions (prices, hours, area, who it is for) are in the page text",
            "Numbers have a date, and other people's numbers have a source",
            "Name, address and contact details match on your site and outside profiles",
            "You have a fixed set of unbranded questions and ask them several times under the same conditions",
            "You note the date of each setting change and check no earlier than 24 hours later",
          ],
        },
      ],
      faqs: [
        { q: "If I allow PerplexityBot, will Perplexity cite me?", a: "Not necessarily. Allowing it is what lets Perplexity read your pages; Perplexity decides which pages to cite, and its criteria are not public." },
        { q: "If I disallow Perplexity-User in robots.txt, will it stop reading my site?", a: "Perplexity's documentation says Perplexity-User generally ignores robots.txt rules because a user requested the fetch. To block it, consider a WAF rule that matches its user agent and IP ranges." },
        { q: "Does Perplexity use pages it reads to train AI models?", a: "Perplexity's documentation says neither PerplexityBot nor Perplexity-User is used to collect content for training AI foundation models." },
        { q: "Do robots.txt changes apply immediately?", a: "Perplexity says changes can take up to 24 hours to apply, so check the next day. Whether you then appear in answers is a separate question." },
        { q: "Do paid Perplexity plans cite different sources?", a: "Plans and modes may build answers differently, but differences in how sources are chosen are not published. When you record results, keep the plan, mode and login state the same." },
        { q: "Does an llms.txt file help with Perplexity citations?", a: "We found no official statement that Perplexity uses a site's llms.txt to choose sources. If you publish one, treat it as an entry point to your main pages and a summary of facts. See the [llms.txt guide](/guide/llms-txt)." },
        { q: "Perplexity says something wrong about us. What can we do?", a: "Trace the sources in the answer. Fix outdated text on your own site, and ask other publishers to update theirs. You cannot edit AI answers directly, and there is no set time for changes to show." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See whether AI can read your site",
        body: "The free check needs no sign-up: enter a URL to see AI crawler access, structured data and llms.txt. On WordPress, the free plugin sets up PerplexityBot and Perplexity-User access and publishes your business facts as structured data in one place.",
        label: "Check your AI readiness for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: FOOT_EN,
    },
  },
};
