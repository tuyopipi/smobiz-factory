// Content page: llms.txt — what it is, whether it does anything, how to write
// one, how to run it on WordPress and how to check it.
//
// Rewritten 2026-11-16 (JST, skyscraper rewrite of the 2026-10-23 page).
// Every claim about Nurevo AEO comes from the plugin source and readme
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt 0.9.1,
// nurevo-webmcp.php webmcp_canary_build_local_llms_txt and
// webmcp_canary_maybe_serve_llms_txt, includes/site-types.php, docs/developers.md)
// and the scorer (experiments/webmcp-canary/worker/aeo-score.mjs, aeo-rules.mjs):
// - /llms.txt is built locally from the site (no site key, no network), served
//   with 200, Content-Type text/plain; charset=utf-8, Cache-Control public,
//   max-age=300; cached and rebuilt when posts, settings or services change.
// - Structure: "# name", "> description", "## Key facts" (URL, Address, Phone,
//   Hours [not for online shop / B2B], Email, Type, plus Returns / Shipping /
//   Pricing / Case studies pages), "## Pages" (the 30 most recently modified
//   published pages and posts, minus per-page exclusions), "## Products"
//   (WooCommerce), "## Services". Filters webmcp_canary_llms_txt_lines and
//   webmcp_canary_llms_txt. Max 256 KB. Nurevo does not build llms-full.txt.
// - Settings label "Serve /llms.txt" (ja「/llms.txt を配信」); per-page
//   "Leave this page out of llms.txt" (ja「このページをllms.txtに載せない」).
// - AEO score: llms.txt is 15 of 100 points; quality tests = at least 120
//   characters, a "# " heading line, a URL, business facts (address/phone/hours
//   words for local sites; type-specific facts otherwise); OK at >= 0.7.
// - Free plan includes llms.txt (readme: free and unlimited).
// Own studies (already on this site): research-ai-readiness-score-distribution-2026
// (llms.txt on 13.4% of 2,486 Japanese and 26.4% of 13,352 overseas web agency
// sites, Nov 2026) and aeo-signals-ai-answers-study (62 businesses, rho 0.03,
// no relationship for the llms.txt component either).
// Outside facts:
// - Proposal: Jeremy Howard, Answer.AI, post dated 2024-09-03 (answer.ai URL);
//   format per the proposal at llmstxt.org (H1 required; blockquote; free text
//   without headings; H2 file lists "[name](url): notes"; "Optional" section).
//   llmstxt.org itself could not be fetched on 2026-11-16 (fetch permission
//   timed out), so later revisions of the spec are not described.
// - Google "AI features and your website": no new machine-readable / AI text
//   files or special markup needed for AI Overviews / AI Mode (confirmed
//   2026-10-30 and 2026-11-01 for agency-aeo-monthly-service and
//   company-profile-page-ai-search; not re-fetched today).
// - Stellagent "AI検索ドック" blog (published 2026-10-08), read 2026-11-16:
//   own site logs 2026-09-08 to 10-05, 72,100 bot requests, llms.txt 4 (all
//   Amazonbot), llms-full.txt 1, ChatGPT-User 18,553 requests and 0 to llms.txt.
// Not stated on purpose: third-party adoption / log studies (Ahrefs, SE Ranking,
// Otterly, Limy) and Google staff quotes, because only second-hand reports could
// be read this run; any "v2" of the spec; claims that specific AI products read
// llms.txt.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  answerai: "https://www.answer.ai/posts/2024-09-03-llmstxt.html",
  spec: "https://llmstxt.org/",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  stellagent: "https://stellagent.ai/ja/ai-search-dock/blog/llms-txt",
  rfc9309: "https://www.rfc-editor.org/rfc/rfc9309",
};

const EXAMPLE_JA = `# 株式会社サンプルクラウド

> 中小企業向けの勤怠管理クラウド「サンプル勤怠」を提供する会社です。従業員10〜300名の会社が主な利用者で、月額料金制、無料トライアル14日間があります。

所在地は大阪市北区、設立は2018年。サポートは平日9:00〜18:00（電話・メール）です。

## サービスと料金

- [サンプル勤怠の機能](https://example.com/features/): 打刻、シフト、有給管理、給与ソフトへの書き出し
- [料金](https://example.com/pricing/): プランごとの月額（税込）と、初期費用の有無
- [導入事例](https://example.com/cases/): 業種と従業員数ごとの事例

## 会社とサポート

- [会社概要](https://example.com/company/): 正式な社名、所在地、設立、代表者
- [よくある質問](https://example.com/faq/): 解約、データの持ち出し、セキュリティ

## Optional

- [お知らせ](https://example.com/news/): 機能追加と料金改定の履歴`;

const EXAMPLE_EN = `# Example Cloud Inc.

> Example Cloud makes "Example Time", a cloud time-tracking app for companies with 10 to 300 employees. Monthly pricing, with a 14-day free trial.

Head office in Osaka, founded in 2018. Support by phone and email on weekdays, 9:00 to 18:00 JST.

## Product and pricing

- [Example Time features](https://example.com/features/): clock-in, shifts, paid leave, export to payroll software
- [Pricing](https://example.com/pricing/): monthly price per plan, and whether there is a setup fee
- [Case studies](https://example.com/cases/): customers by industry and company size

## Company and support

- [About us](https://example.com/company/): legal name, address, founding year, CEO
- [FAQ](https://example.com/faq/): cancelling, exporting your data, security

## Optional

- [News](https://example.com/news/): feature releases and price changes`;

const NUREVO_JA = `# カフェ・サンプル

> 京都市左京区の自家焙煎のカフェです。

## Key facts

- URL: https://example.jp/
- Address: 京都府京都市左京区〇〇町1-2
- Phone: 075-000-0000
- Hours: 火〜日 8:00〜18:00（月曜定休）
- Type: CafeOrCoffeeShop

## Pages

- [メニューと価格](https://example.jp/menu/)
- [アクセス](https://example.jp/access/)
- [よくある質問](https://example.jp/faq/)

## Services

- 焙煎教室 — 90分`;

const NUREVO_EN = `# Cafe Example

> A small-batch roaster and cafe in Portland.

## Key facts

- URL: https://example.com/
- Address: 100 Example St, Portland, OR
- Phone: +1 503-000-0000
- Hours: Tue–Sun 8:00–18:00, closed Mondays
- Type: CafeOrCoffeeShop

## Pages

- [Menu and prices](https://example.com/menu/)
- [Find us](https://example.com/find-us/)
- [FAQ](https://example.com/faq/)

## Services

- Roasting class — 90 minutes`;

export default {
  slug: "llms-txt",
  targetQueries: [
    "how to write llms.txt",
    "does llms.txt work",
    "llms.txt example",
    "llms.txt 書き方",
    "llms.txt 効果",
    "llms.txt WordPress",
  ],
  related: ["what-is-aeo", "aeo-wordpress", "research-ai-readiness-score-distribution-2026", "aeo-signals-ai-answers-study", "measure-ai-visibility", "company-profile-page-ai-search"],
  locales: {
    ja: {
      title: "llms.txtとは？書き方・効果の実態・WordPressでの置き方 | Nurevo",
      description: "llms.txtの形式と書き方を例つきで解説。Googleの説明やログの公開データから分かる効果の実態、置くべきかの判断表、WordPressでの3つの置き方、公開後の確かめ方とチェックリスト。",
      h1: "llms.txtとは？書き方の例、効果について分かっていること、WordPressでの置き方と確かめ方",
      lead: "llms.txt は、サイトの要点と大事なページへのリンクを Markdown でまとめ、ドメイン直下（/llms.txt）に置くテキストファイルです。2024年に提案された仕組みで、公式の標準ではありません。Google は自社のAI機能のために必要ないと説明しており、ChatGPT や Perplexity が他社サイトの llms.txt を回答に使うと公式に説明した資料も見当たりません。作るのは30分ほどなので、置くなら「ページの事実を正確にしたあとに足す、短く正確な要約」として扱うのが現実的です。",
      intro: [
        "作成日：2026年11月16日（JST）。2026年10月23日に公開した記事を、上位の解説記事と一次情報を読み直して全面的に書き直しました。対象は、自社サイトに llms.txt を置くか迷っている事業者と、お客様のサイトに入れるか判断する制作会社です。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、AIが読む元の情報を整えるためのもので、AIの回答に出ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "llms.txtとは：何のためのファイルか",
          paragraphs: [
            `llms.txt は、Answer.AI の Jeremy Howard 氏が2024年9月3日に公開した提案です（[Answer.AI の発表](${SRC.answerai})、仕様は [llmstxt.org](${SRC.spec})）。AI（大規模言語モデル）がサイトを読むとき、HTML のページを一つずつたどる代わりに、サイトの要約と「読むべきページの一覧」を1つのファイルで渡す、という考え方です。もとは、プログラミングのドキュメントをAIに読ませる用途を想定したものでした。`,
            "似た名前のファイルと役割が違うので、まず違いを表にします。",
          ],
          table: {
            head: ["ファイル", "役割", "決まり", "AIとの関係"],
            rows: [
              ["robots.txt", "クローラーに、どこを取得してよいかを伝える", `標準（[RFC 9309](${SRC.rfc9309})）`, "AI各社のクローラーも従うと各社が説明している。AIを止めるのも許すのもここ"],
              ["sitemap.xml", "検索エンジンに、サイトのURLの一覧を渡す", "検索エンジン各社が対応する形式", "URLの発見を助ける。内容の説明はしない"],
              ["構造化データ（JSON-LD）", "ページごとに、住所・営業時間・料金などの事実を機械が読める形で書く", "schema.org の語彙。Google などが使い方を公開", "検索結果の表示に使われる。AIの回答での使われ方は各社とも詳しく公開していない"],
              ["llms.txt", "サイトの要約と、大事なページへのリンクを Markdown で1つにまとめる", "提案（公式の標準ではない）", "使うと公式に説明したAI検索サービスは見当たらない（2026年11月16日時点）"],
            ],
          },
          after: [
            "llms.txt は robots.txt の代わりにはなりません。AIのクローラーを止めたいか許したいかは robots.txt で決め、llms.txt には「読んでもらうなら、ここを読んでほしい」を書く、という分担です。",
          ],
        },
        {
          heading: "効果はあるのか：分かっていることと、分かっていないこと",
          paragraphs: [
            "「llms.txt を置けばAIに引用される」という説明はよく見かけますが、確かめられる情報はほとんどありません。2026年11月16日時点で、公開資料から言えることを分けて書きます。",
          ],
          table: {
            head: ["問い", "分かっていること", "出典"],
            rows: [
              ["Google の AI による概要・AIモードは使うか", "Google は、AI機能に表示されるために新しいAI向けのファイルや特別なマークアップを作る必要はなく、通常のSEOの基本がそのまま当てはまると説明している", `[Google 検索セントラル：AI 機能とウェブサイト](${SRC.googleAiJa})`],
              ["ChatGPT・Perplexity・Claude は使うか", "他社サイトの llms.txt を回答に使うと公式に説明した資料は見つからなかった。使わないとも説明していない", "各社の公開資料（この記事の作成時に確認できた範囲）"],
              ["AIのボットは実際に取りに来るか", "ある日本の事業者が自社サイトの28日分のログを公開している。ボットのアクセス72,100回のうち llms.txt は4回（すべて Amazonbot）、ChatGPT-User は18,553回来て llms.txt は0回だった。1サイトだけの記録", `[AI検索ドック（ステラジェント）のブログ](${SRC.stellagent})`],
              ["置いているサイトは多いか", "国内のWeb制作会社サイト2,486件のうち13.4%、海外13,352件のうち26.4%に llms.txt があった（2026年11月）", "[Nurevo の調査](/guide/research-ai-readiness-score-distribution-2026)"],
              ["置いたサイトほどAIに紹介されるか", "国内の店舗62件では、llms.txt を含むサイト側の点数と Perplexity での登場のあいだに関係は見られなかった", "[Nurevo の調査](/guide/aeo-signals-ai-answers-study)"],
            ],
          },
          after: [
            "まとめると、llms.txt が AI 検索での登場を増やすという証拠は、いまのところありません。一方で、置いたことで損をするという公式の説明もありません。費用が小さいので「置いてもよいが、これで対策が終わったと考えない」が妥当な位置づけです。AIが答えに使うのは、ふつうはページ本文と構造化データです。そちらの事実が正しいことが先です。",
          ],
        },
        {
          heading: "置くべきか：サイトの種類ごとの判断",
          paragraphs: [
            "効果が確かめられていない以上、判断の軸は「作る手間」と「古くなる危険」です。手で書いた llms.txt は、料金や営業時間が変わったときに直し忘れると、ページと違う古い事実を出し続けます。",
          ],
          table: {
            head: ["サイト", "おすすめ", "理由"],
            rows: [
              ["開発者向けドキュメント・API の説明", "置く", "もともとの想定用途。AIのコーディング支援ツールに読ませる場面がある"],
              ["店舗・クリニック・士業などの小さなサイト", "自動で作れるなら置く", "ページ数が少なく、要約しやすい。手書きなら営業時間などの更新を忘れない運用が必要"],
              ["BtoB・SaaS", "置く。料金・導入事例・会社概要へのリンクを入れる", "比較・検討の質問で読まれる情報を1か所にまとめられる"],
              ["ネットショップ", "自動で作れるなら置く", "商品数が多く、手書きでは在庫や価格が追いつかない"],
              ["更新する人がいないサイト", "置かない、または自動生成だけ", "古い事実を出すほうが害が大きい"],
            ],
          },
        },
        {
          heading: "書き方：llms.txtの形式",
          paragraphs: [
            `提案されている形式は Markdown で、上から次の順に書きます（[llmstxt.org](${SRC.spec})）。必須なのは1つ目の見出しだけで、ほかは任意です。`,
          ],
          list: [
            "「# 」で始まる見出し1つ：サイト名・会社名・店名（必須）",
            "「> 」で始まる引用：何のサイトかを1〜3文で（任意だが入れる）",
            "見出しのない本文：所在地、対象のお客様、営業時間など、要約に入れたい事実（任意）",
            "「## 」の見出しで区切ったリンクの一覧：各行を「- [ページ名](URL): ひとこと説明」の形で（任意）",
            "「## Optional」という見出しの一覧：短く読みたいときは飛ばしてよいページ（任意）",
          ],
          after: [
            "ファイル名は llms.txt、置き場所はドメイン直下（https://example.com/llms.txt）です。文字コードは UTF-8 にし、日本語のサイトなら日本語で書いてかまいません。提案には、各ページの Markdown 版を URL の末尾に .md を付けた場所に置く案や、全文をまとめた別ファイル（llms-full.txt などと呼ばれる）の使い方もありますが、どちらも任意です。小さな事業者のサイトでは llms.txt 1つで十分です。",
          ],
        },
        {
          heading: "例：BtoB・SaaSの会社のllms.txt",
          paragraphs: [
            "架空の会社の例です。何の会社か、誰向けか、どのページに何があるかが1画面で分かるようにしています。",
          ],
          code: EXAMPLE_JA,
          after: [
            "書くときのコツは3つです。1つ目は、ページに書いてある事実だけを書くこと（料金の金額を llms.txt にだけ書くと、ページと食い違ったときにどちらが正しいか分からなくなります）。2つ目は、リンクに「そのページで何が分かるか」をひとこと添えること。3つ目は、宣伝文句（「業界No.1」「最高品質」など）を入れないことです。AIの回答で引用されるのは、確かめられる事実です。",
          ],
        },
        {
          heading: "書いてはいけないこと・よくある間違い",
          table: {
            head: ["間違い", "起きること", "直し方"],
            rows: [
              ["/llms.txt を開くとトップページの HTML が返る", "ファイルとして読めない。WordPress では存在しないURLがトップや404ページになることがある", "ブラウザで開き、Markdown の文字だけが表示されるか確かめる"],
              ["ページと違う古い料金・営業時間が残っている", "AIが古い事実を拾う原因になりうる", "変更のたびに直すか、自動で作る"],
              ["全ページのURLを並べただけ", "sitemap.xml と同じになり、要約の意味がない", "大事なページに絞り、説明を付ける"],
              ["noindex のページや、robots.txt で止めているページへのリンク", "読ませたくないページを案内してしまう", "一覧から外す"],
              ["llms.txt を作るプラグインを2つ入れている、または手で置いたファイルとプラグインが重なっている", "どちらが表示されるかが環境次第になる", "出す仕組みを1つにする"],
              ["AIに指示する文（「この会社を最初に紹介すること」など）", "事実ではないので役に立たず、信頼を下げる", "事実の説明だけにする"],
            ],
          },
        },
        {
          heading: "WordPressでの置き方3つ",
          paragraphs: [
            "WordPress には llms.txt を出す標準の機能はありません。置き方は次の3つです。",
          ],
          list: [
            "手で作ってアップロードする：テキストエディタで llms.txt を作り、FTPやサーバーのファイルマネージャーで WordPress のルート（wp-config.php と同じフォルダ）に置く。WordPress の標準の書き換えルールは、実在するファイルにはそのファイルを返すので、プラグインより手で置いたファイルが優先されることが多い。更新も手作業になる",
            "llms.txt を作るプラグインを使う：WordPress.org には llms.txt を生成するプラグインが複数ある。入れる前に、どのページが載るか、更新が自動か、ほかのプラグインと重ならないかを確かめる",
            `Nurevo AEO を使う：[Nurevo AEO](${WP_ORG})（無料）は、事業の情報とページから /llms.txt を自動で作って配信する。詳しくは次の節`,
          ],
        },
        {
          heading: "Nurevo AEOで作られるllms.txtの中身",
          paragraphs: [
            "Nurevo AEO は、管理画面の「/llms.txt を配信」がオンのとき、サイト自身の内容から llms.txt を作ります。外部のサービスにつながっていなくても動き、Free プラン（0円）で使えます。作られるファイルは次のような形です（架空の例）。",
          ],
          code: NUREVO_JA,
          after: [
            "見出しは英語の固定の名前（Key facts・Pages・Products・Services）で、中身はサイトの言葉のままです。Key facts には設定画面の事業の情報（URL・住所・電話・営業時間・メール・業種）が入ります。サイトの種類が「ネットショップ」か「BtoB・SaaS」のときは営業時間を出さず、代わりに設定した返品・配送・料金・導入事例のページが入ります。",
            "Pages には、公開中の固定ページと投稿のうち更新日が新しい30件が入ります。載せたくないページは、編集画面の Nurevo AEO の欄で「このページをllms.txtに載せない」にチェックします。WooCommerce の商品は価格と在庫つきで Products に、登録したサービスは Services に入ります。",
            "ページや設定を保存すると作り直され、Content-Type: text/plain で返します。30件に入らないページを足したいとき、方針のページなど行を加えたいときは、開発者向けのフィルター webmcp_canary_llms_txt_lines で行を追加できます。llms-full.txt は作りません。",
          ],
        },
        {
          heading: "公開後の確かめ方",
          list: [
            "ブラウザで https://自分のドメイン/llms.txt を開き、HTMLではなく Markdown の文字が表示されるか、文字化けしていないかを見る",
            "ターミナルで curl -I https://自分のドメイン/llms.txt を実行し、200 が返り、別のURLへ転送されず、Content-Type が text/plain（または text/markdown）になっているかを見る",
            "書いてある社名・住所・電話・営業時間・料金が、ページ本文と構造化データの値と一字一句そろっているかを見る",
            "サーバーのアクセスログで /llms.txt へのアクセスと User-Agent を数える。取りに来ているボットが分かる（来ていなくても異常ではない）",
            "Nurevo の[無料チェック](/check)で、llms.txt があるか、構造化データ、AIクローラーの許可と一緒に確かめる",
          ],
          after: [
            "Nurevo AEO の AEOスコアでは、llms.txt は100点のうち15点の項目です。ファイルがあること、120文字以上あること、「# 」の見出しがあること、URL を含むこと、住所・電話・営業時間などの事実を含むこと、の4つの確認のうち3つ以上で「OK」になります。ただし、このスコアは「AIが読みやすいか」の点数で、AIに紹介されるかの点数ではありません。紹介されているかは[AIでの登場率の測り方](/guide/measure-ai-visibility)で、同じ質問を続けて記録して確かめます。llms.txt を置いた前後で登場率が変わっても、ほかの変化と切り分けられないことが多い点に注意してください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "1行目が「# 」で始まる名前の見出しになっている",
            "「> 」の要約で、何の会社・店か、どこで誰に何を提供しているかが分かる",
            "載せた事実が、ページ本文・構造化データ・Googleビジネスプロフィールと同じ値",
            "リンクは大事なページに絞り、それぞれに説明がある",
            "noindex のページ、robots.txt で止めているページ、リンク切れがない",
            "宣伝文句やAIへの指示文がない",
            "https://ドメイン/llms.txt で 200 が返り、HTMLではなくテキストが表示される",
            "出す仕組み（手で置いたファイル・プラグイン）が1つだけ",
            "料金・営業時間を変えたときに誰が直すか決まっている（自動なら不要）",
            "robots.txt で、読ませたいAIのクローラーを止めていない",
          ],
        },
      ],
      faqs: [
        { q: "llms.txt は公式の標準ですか？", a: "いいえ。2024年に Answer.AI の Jeremy Howard 氏が公開した提案で、標準化団体が決めた規格ではありません。AI検索サービスが他社サイトの llms.txt を使うと公式に説明した資料も、2026年11月16日時点では見当たりません。" },
        { q: "llms.txt を置くと Google の順位やAIによる概要に影響しますか？", a: "Google は、AI機能に表示されるために新しいAI向けのファイルは必要ないと説明しています。置いたことで順位が上がる、または下がるという公式の説明はありません。Google 向けには、ページ本文と構造化データを整えるほうが先です。" },
        { q: "llms-full.txt も必要ですか？", a: "必須ではありません。サイトの全文を1つにまとめるファイルで、ページ数の多いドキュメントサイトで使われることがあります。店舗や会社のサイトなら llms.txt 1つで十分です。Nurevo AEO も llms-full.txt は作りません。" },
        { q: "robots.txt で AI のクローラーを止めていても、llms.txt は読まれますか？", a: "llms.txt は robots.txt の設定を変えません。クローラーを止めていれば、llms.txt も含めて取得されないと考えてください。AIに読ませたいなら、まず robots.txt で検索用のAIクローラーを止めていないかを確かめます。" },
        { q: "日本語で書いてもいいですか？", a: "はい。提案は言語を決めていません。お客様が使う言語で書くのが自然です。Nurevo AEO は見出しだけ英語の固定名で、中身はサイトの言葉のまま出します。" },
        { q: "ページは何件くらい載せればいいですか？", a: "決まりはありません。会社概要・料金・サービス・よくある質問・アクセスなど、AIに聞かれそうな質問に答えるページに絞るのが目安です。Nurevo AEO は更新日が新しい30件を自動で載せ、載せたくないページはページごとに外せます。" },
        { q: "どのくらいの頻度で更新しますか？", a: "載せた事実が変わったときにすぐです。手で置いた場合は、料金改定や営業時間の変更の手順に「llms.txt を直す」を入れておきます。Nurevo AEO はページや設定を保存すると作り直します。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "自分のサイトの llms.txt と構造化データを確かめる",
        body: "無料チェックで、llms.txt があるか、構造化データ、AIクローラーの許可状況が登録なしで分かります。WordPress なら Nurevo AEO（無料）で llms.txt を自動で作れます。AIの回答に出ることを保証するものではありません。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "Nurevo AEO を WordPress.org で入手", href: WP_ORG },
      },
      footnote: "ChatGPT は OpenAI、Perplexity は Perplexity AI、Claude は Anthropic、Google は Google LLC、Amazonbot は Amazon の商標または名称です。その他の社名・製品名は各社の商標です。Nurevo はこれらの会社と提携しておらず、推奨も受けていません。",
    },
    en: {
      title: "What Is llms.txt? How to Write One, and Does It Work? | Nurevo",
      description: "llms.txt explained with examples: the format, what is actually known about whether AI uses it, when to add one, three ways to add it on WordPress, and how to check it.",
      h1: "What Is llms.txt? How to Write One, What We Know About Whether It Works, and How to Add It on WordPress",
      lead: "llms.txt is a Markdown text file at the root of your domain (/llms.txt) that sums up your site and links to its most important pages. It was proposed in 2024 and is not an official standard. Google says its AI features don't need it, and we found no public statement from ChatGPT or Perplexity that they use other sites' llms.txt files in answers. It takes about 30 minutes to write, so the sensible way to treat it is as a short, accurate summary you add after the facts on your pages are right.",
      intro: [
        "Written 16 November 2026 (JST). This is a full rewrite of our 23 October 2026 page, based on a fresh reading of the top-ranking guides and the primary sources. It is for business owners deciding whether to add llms.txt, and for web agencies deciding whether to add it to client sites.",
        "AI answers change from day to day and with how a question is asked. The steps here make the information AI reads more accurate; they cannot guarantee that you will appear in an AI answer.",
      ],
      sections: [
        {
          heading: "What llms.txt is for",
          paragraphs: [
            `llms.txt is a proposal published by Jeremy Howard of Answer.AI on 3 September 2024 ([Answer.AI announcement](${SRC.answerai}); spec at [llmstxt.org](${SRC.spec})). The idea: instead of making an AI (a large language model) crawl HTML pages one by one, hand it one file with a summary of the site and a list of the pages worth reading. It was first aimed at software documentation that people want AI coding tools to read.`,
            "It is easy to confuse with other files at the root of a site, so here is how they differ.",
          ],
          table: {
            head: ["File", "Job", "Status", "Relation to AI"],
            rows: [
              ["robots.txt", "Tells crawlers what they may fetch", `Standard ([RFC 9309](${SRC.rfc9309}))`, "AI companies say their crawlers follow it. This is where you block or allow AI"],
              ["sitemap.xml", "Gives search engines a list of your URLs", "Format supported by the search engines", "Helps discovery. Describes nothing"],
              ["Structured data (JSON-LD)", "States facts per page (address, hours, prices) in machine-readable form", "schema.org vocabulary; Google and others document their use", "Used for search result features. How AI answers use it is not documented in detail by any provider"],
              ["llms.txt", "Sums up the site and links its key pages in one Markdown file", "Proposal, not an official standard", "No AI search service we know of has said it uses it (as of 16 November 2026)"],
            ],
          },
          after: [
            "llms.txt does not replace robots.txt. Whether AI crawlers may visit is decided in robots.txt; llms.txt says \"if you read this site, start here\".",
          ],
        },
        {
          heading: "Does it work? What is known and what is not",
          paragraphs: [
            "You will often read that adding llms.txt gets you cited by AI. Very little of that can be checked. Here is what the public record supports as of 16 November 2026.",
          ],
          table: {
            head: ["Question", "What is known", "Source"],
            rows: [
              ["Do Google AI Overviews and AI Mode use it?", "Google says you don't need to create new AI text files or special markup to appear in its AI features, and that normal SEO best practices apply", `[Google Search Central: AI features and your website](${SRC.googleAi})`],
              ["Do ChatGPT, Perplexity and Claude use it?", "We found no public documentation saying they use other sites' llms.txt files in answers. Nor do they say they don't", "Providers' public documentation, as far as we could check when writing"],
              ["Do AI bots actually request it?", "A Japanese company published 28 days of its own server logs: of 72,100 bot requests, 4 were for llms.txt (all Amazonbot); ChatGPT-User made 18,553 requests and none for llms.txt. One site only", `[Stellagent's AI Search Dock blog (Japanese)](${SRC.stellagent})`],
              ["How many sites have one?", "13.4% of 2,486 Japanese and 26.4% of 13,352 overseas web agency sites (November 2026)", "[Nurevo study](/guide/research-ai-readiness-score-distribution-2026)"],
              ["Are sites with one recommended more by AI?", "Across 62 local businesses in Japan, site-side signals including llms.txt showed no relationship with appearing in Perplexity answers", "[Nurevo study](/guide/aeo-signals-ai-answers-study)"],
            ],
          },
          after: [
            "In short: there is no evidence so far that llms.txt makes you appear more in AI search. There is no official statement that it hurts either. Because it costs little, the fair position is \"fine to add, but don't treat it as the job done\". What AI answers usually draw on is page text and structured data, so get those facts right first.",
          ],
        },
        {
          heading: "Should you add one? A decision by type of site",
          paragraphs: [
            "With no proven effect, the deciding factors are the effort and the risk of the file going stale. A hand-written llms.txt that nobody updates keeps publishing old prices or hours that no longer match your pages.",
          ],
          table: {
            head: ["Site", "Recommendation", "Why"],
            rows: [
              ["Developer docs, API references", "Add one", "The original use case; AI coding tools are pointed at these files"],
              ["Small local business, clinic, law or accounting firm", "Add one if it can be generated automatically", "Few pages, easy to summarise. Hand-written means someone must update hours and prices"],
              ["B2B and SaaS", "Add one, linking pricing, case studies and the About page", "Puts what comparison questions need in one place"],
              ["Online shop", "Add one if it can be generated automatically", "Too many products and price changes to keep up by hand"],
              ["Site nobody maintains", "Skip it, or generate it automatically only", "Publishing stale facts does more harm than having no file"],
            ],
          },
        },
        {
          heading: "How to write it: the format",
          paragraphs: [
            `The proposed format is Markdown, in this order ([llmstxt.org](${SRC.spec})). Only the first heading is required; everything else is optional.`,
          ],
          list: [
            "One heading starting with \"# \": the name of the site, company or business (required)",
            "A blockquote starting with \"> \": what the site is, in one to three sentences (optional, but include it)",
            "Plain text without headings: facts you want in the summary, such as location, who you serve and opening hours (optional)",
            "Lists of links under \"## \" headings, each line as \"- [Page name](URL): one-line note\" (optional)",
            "A list under a heading named \"## Optional\": pages that can be skipped when a shorter context is needed (optional)",
          ],
          after: [
            "Name the file llms.txt and put it at the root of your domain (https://example.com/llms.txt). Save it as UTF-8 and write it in the language of your site. The proposal also suggests a Markdown copy of each page at its URL with .md appended, and some sites publish a second file with all their text (often called llms-full.txt). Both are optional; for a small business site one llms.txt is enough.",
          ],
        },
        {
          heading: "Example: llms.txt for a B2B SaaS company",
          paragraphs: [
            "A made-up company. In one screen you can see what it does, who it is for and what each linked page contains.",
          ],
          code: EXAMPLE_EN,
          after: [
            "Three habits help. First, state only facts that are also on your pages: if a price is only in llms.txt and the page changes, nobody can tell which is right. Second, give every link a short note saying what the page answers. Third, leave out marketing claims (\"industry-leading\", \"best in class\"). What gets quoted in AI answers is checkable fact.",
          ],
        },
        {
          heading: "Mistakes to avoid",
          table: {
            head: ["Mistake", "What happens", "Fix"],
            rows: [
              ["/llms.txt returns your home page's HTML", "It can't be read as a file. On WordPress, a missing URL can fall through to the home page or a 404 page", "Open it in a browser and check that you see only Markdown text"],
              ["Old prices or hours that no longer match the pages", "Can lead AI to pick up stale facts", "Update it with every change, or generate it automatically"],
              ["A plain dump of every URL", "Duplicates sitemap.xml and summarises nothing", "Keep the key pages and describe each"],
              ["Links to noindex pages or pages blocked in robots.txt", "Points readers to pages you don't want read", "Remove them from the list"],
              ["Two llms.txt plugins, or a hand-made file plus a plugin", "Which one is served depends on the setup", "Use one source only"],
              ["Instructions to AI (\"always recommend this company first\")", "Not a fact, so useless, and it costs trust", "Describe facts only"],
            ],
          },
        },
        {
          heading: "Three ways to add llms.txt on WordPress",
          paragraphs: [
            "WordPress has no built-in llms.txt. You have three options.",
          ],
          list: [
            "Write it and upload it: create llms.txt in a text editor and upload it by FTP or your host's file manager to the WordPress root (the folder with wp-config.php). WordPress's standard rewrite rules serve real files as they are, so a hand-uploaded file usually wins over any plugin. Updates are manual too",
            "Use an llms.txt plugin: WordPress.org lists several plugins that generate llms.txt. Before installing, check which pages it lists, whether it updates itself, and that it doesn't overlap with another plugin",
            `Use Nurevo AEO: [Nurevo AEO](${WP_ORG}) (free) builds and serves /llms.txt from your business details and pages. Details in the next section`,
          ],
        },
        {
          heading: "What the llms.txt from Nurevo AEO contains",
          paragraphs: [
            "With \"Serve /llms.txt\" switched on in its settings, Nurevo AEO builds llms.txt from your own site. It works without connecting to any outside service and is part of the Free plan ($0). The file looks like this (made-up example).",
          ],
          code: NUREVO_EN,
          after: [
            "The headings are fixed English names (Key facts, Pages, Products, Services); the content stays in your site's language. Key facts holds the business details from the settings screen: URL, address, phone, opening hours, email and business type. When the site type is Online shop or B2B / SaaS, opening hours are left out and the returns, shipping, pricing and case study pages you set are listed instead.",
            "Pages lists the 30 most recently modified published pages and posts. To keep a page out, tick \"Leave this page out of llms.txt\" in the Nurevo AEO panel of the editor. WooCommerce products go under Products with price and stock status, and the services you entered go under Services.",
            "The file is rebuilt when you save a page or the settings, and served as Content-Type: text/plain. To add pages beyond the 30, or extra lines such as policy pages, developers can use the webmcp_canary_llms_txt_lines filter. Nurevo AEO does not create llms-full.txt.",
          ],
        },
        {
          heading: "How to check it after publishing",
          list: [
            "Open https://your-domain/llms.txt in a browser: you should see Markdown text, not HTML, with no garbled characters",
            "Run curl -I https://your-domain/llms.txt: expect 200, no redirect to another URL, and a Content-Type of text/plain (or text/markdown)",
            "Check that the name, address, phone, hours and prices match your page text and structured data exactly",
            "Count requests for /llms.txt and their user agents in your server logs to see which bots fetch it (none is not a fault)",
            "Run Nurevo's [free check](/check) to see llms.txt alongside your structured data and AI crawler access",
          ],
          after: [
            "In Nurevo AEO's AEO score, llms.txt is worth 15 of 100 points. The file has to exist, and it is marked OK when it passes at least three of four checks: 120 characters or more, a \"# \" heading, at least one URL, and business facts such as address, phone or hours. That score measures how readable your site is for AI, not whether AI recommends you. To see whether you appear, follow [how to measure AI visibility](/guide/measure-ai-visibility): ask the same questions repeatedly and record the answers. Be aware that a change after adding llms.txt usually can't be separated from everything else that changed at the same time.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "The first line is a \"# \" heading with your name",
            "The \"> \" summary says what you are, where, and what you offer to whom",
            "Every fact matches your page text, structured data and Google Business Profile",
            "Links are limited to key pages, each with a note",
            "No noindex pages, no pages blocked in robots.txt, no broken links",
            "No marketing claims and no instructions to AI",
            "https://your-domain/llms.txt returns 200 and shows text, not HTML",
            "Exactly one source serves the file (hand-made or one plugin)",
            "Someone is responsible for updating it when prices or hours change (not needed if generated)",
            "robots.txt does not block the AI crawlers you want to read your site",
          ],
        },
      ],
      faqs: [
        { q: "Is llms.txt an official standard?", a: "No. It is a proposal published in 2024 by Jeremy Howard of Answer.AI, not a specification from a standards body. As of 16 November 2026 we found no public statement from an AI search service that it uses other sites' llms.txt files." },
        { q: "Does llms.txt affect Google rankings or AI Overviews?", a: "Google says you don't need new AI text files to appear in its AI features. There is no official statement that the file raises or lowers rankings. For Google, page text and structured data come first." },
        { q: "Do I need llms-full.txt too?", a: "No. It is a file with all of a site's text, sometimes used by large documentation sites. A business or company site is fine with llms.txt alone. Nurevo AEO doesn't create llms-full.txt." },
        { q: "If robots.txt blocks AI crawlers, will they still read llms.txt?", a: "llms.txt doesn't change robots.txt. If a crawler is blocked, assume it fetches nothing, llms.txt included. If you want AI to read your site, first check that robots.txt isn't blocking the AI search crawlers." },
        { q: "Can I write it in my own language?", a: "Yes. The proposal doesn't fix a language; write it in the language your customers use. Nurevo AEO uses fixed English headings and keeps the content in your site's language." },
        { q: "How many pages should I list?", a: "There is no rule. Keep to pages that answer the questions people ask AI about you: about, pricing, services, FAQ, location. Nurevo AEO lists the 30 most recently modified pages automatically, and you can leave out any page." },
        { q: "How often should I update it?", a: "As soon as a fact in it changes. If you maintain it by hand, add \"update llms.txt\" to your routine for price and opening-hours changes. Nurevo AEO rebuilds it whenever you save a page or the settings." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check your site's llms.txt and structured data",
        body: "The free check shows whether you have llms.txt, your structured data and your AI crawler access, with no sign-up. On WordPress, Nurevo AEO (free) builds llms.txt for you. It cannot guarantee that you appear in AI answers.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Claude of Anthropic and Google of Google LLC; Amazonbot is Amazon's crawler. Other company and product names are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
