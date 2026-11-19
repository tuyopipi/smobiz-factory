// Content page: do FAQ pages and FAQPage structured data help in AI search
// after Google ended FAQ rich results (2026)? What changed and what did not,
// claims in top articles and their evidence, how to choose and write
// questions AI can use, where to put them, FAQPage rules, whether to remove
// existing markup, WordPress steps with Nurevo AIO, and how to measure.
//
// Written 2026-11-19 (JST). Product facts come from the plugin:
// - readme.txt (0.9.2): FAQ entered under Settings is shown by the Nurevo
//   FAQ block or [nurevo_faq] and published as FAQPage on that page only;
//   a page's own questions via the editor panel + block set to "This page's
//   own questions" / [nurevo_faq source="post"]; with Yoast SEO, Rank Math,
//   All in One SEO or Slim SEO the questions are added to the existing graph /
//   FAQPage, skipping questions it already answers; SEO SIMPLE PACK prints no
//   JSON-LD, so Nurevo publishes its own graph, FAQ included. 0.9.2 renamed the
//   screens to "Nurevo AIO" (block title "Nurevo AIO FAQ").
// - nurevo-webmcp.php: webmcp_canary_faq_schema_node() = FAQPage with
//   mainEntity Question{name, acceptedAnswer Answer{text}}, @id <url>/#nurevo-faq.
// - Study (aeo-signals-ai-answers-study, 2026-10-24, n=62, Perplexity):
//   on-site AEO score vs appearance rate Spearman rho 0.03.
// - Free AI check: three unbranded questions a month on Perplexity; Pro
//   (beta) measures Perplexity. Google / ChatGPT not measured by the free check.
//
// Outside facts and where they were read (2026-11-19):
// - Search Engine Journal (Matt G. Southern, 2026-05-10): FAQ rich results
//   stopped appearing on May 7 (2026); Google's doc notice (as quoted by SEJ):
//   dropping the FAQ search appearance, rich result report and Rich Results
//   Test support in June 2026; Search Console API support removed in August
//   2026; no blog post or reason; FAQPage still a valid schema.org type;
//   markup can stay.
// - TechWyse (2026-05-11, modified 2026-07-31): same notice; changelog entry
//   "Added a deprecation notice ... starting May 7, 2026"; FAQPage type not
//   deprecated; leaving markup does not create Search Console errors.
// - Search Engine Land (Jenn Mathews): Aug 2023 FAQ rich results restricted to
//   authoritative government and health sites; FAQPage should not be used for
//   advertising.
// - Google "AI features and your website" (read 2026-11-18 for
//   google-ai-overviews-citations): no special schema.org needed for AI
//   features; structured data must match visible text.
// - developers.google.com FAQ doc / updates page / 2023 blog could NOT be read
//   this run (permission timeout) - linked as the place to check, and the
//   June / August 2026 removals are stated as announced, not as confirmed.
// Not stated on purpose: answer word counts as rules, "x times more citations"
// figures, the 2019 launch date, any claim that ChatGPT / Perplexity / Claude
// use FAQPage when choosing sources.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  sej: "https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/",
  techwyse: "https://www.techwyse.com/news/ai-search/google-faq-rich-results-deprecated-2026",
  sel: "https://searchengineland.com/faq-schema-rise-fall-seo-today-463993",
  googleFaq: "https://developers.google.com/search/docs/appearance/structured-data/faqpage",
  googleBlog2023: "https://developers.google.com/search/blog/2023/08/howto-faq-changes",
  aiFeatures: "https://developers.google.com/search/docs/appearance/ai-features",
  aiFeaturesJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  schemaFaq: "https://schema.org/FAQPage",
  validator: "https://validator.schema.org/",
};

const JSONLD_JA = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "土曜日も診療していますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい。土曜日は9時〜13時に診療しています（受付は12時30分まで）。日曜・祝日は休診です。"
      }
    },
    {
      "@type": "Question",
      "name": "駐車場はありますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "建物の裏に3台分あります（無料）。満車のときは向かいのコインパーキングをご利用ください。"
      }
    }
  ]
}
</script>
<!-- 質問と答えは、ページの本文に表示されているものと同じ文にする -->`;

const JSONLD_EN = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Are you open on Saturdays?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. On Saturdays we are open 9:00 to 13:00 (last check-in 12:30). We are closed on Sundays and public holidays."
      }
    },
    {
      "@type": "Question",
      "name": "Is there parking?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "There are 3 free spaces behind the building. If they are full, use the pay car park across the street."
      }
    }
  ]
}
</script>
<!-- The questions and answers must be the same text that is shown on the page -->`;

const FOOT_JA = "Google、Google 検索、Search ConsoleはGoogle LLC、ChatGPTはOpenAI、PerplexityはPerplexity AI、ClaudeはAnthropic, PBCの商標です。WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACKはそれぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。";
const FOOT_EN = "Google, Google Search and Search Console are trademarks of Google LLC, ChatGPT of OpenAI, Perplexity of Perplexity AI and Claude of Anthropic, PBC. WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO and SEO SIMPLE PACK are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.";

export default {
  slug: "faq-page-ai-search",
  targetQueries: [
    "FAQ schema AI search 2026",
    "is FAQ schema still worth it after Google removed FAQ rich results",
    "how to write FAQs that AI cites",
    "FAQ 構造化データ AI検索 効果",
    "FAQリッチリザルト 終了 FAQPage 削除",
    "よくある質問 ページ AI 引用 書き方",
  ],
  related: ["blog-articles-ai-citations", "google-ai-overviews-citations", "local-business-schema-seo-plugins", "aeo-signals-ai-answers-study", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "FAQページはAI検索に効く？FAQ構造化データの今と書き方 | Nurevo",
      description: "GoogleのFAQリッチリザルトは2026年5月に表示終了。FAQPageを消すべきか、AIに使われる質問の選び方と答え方、置き場所、WordPressでの手順と測り方を整理。",
      h1: "FAQページとFAQ構造化データはAI検索に効くか：2026年の扱いと、AIに使われる書き方",
      lead: "GoogleのFAQリッチリザルト（検索結果に質問と答えが折りたたみで出る表示）は、2026年5月7日から表示されなくなったと報じられています。ただし FAQPage は schema.org の型として今も有効で、すでに付けているマークアップを急いで消す必要はありません。一方、FAQPage を付けるとChatGPTやPerplexity、GoogleのAIによる概要の出典に選ばれやすくなる、と公式に説明した資料は確認できませんでした。AI検索のために効くのは、マークアップより先に、実際に聞かれる質問に本文で短く正確に答えるFAQそのものです。",
      intro: [
        "作成日：2026年11月19日（JST）。ブログ記事の書き方は[ブログ記事をAIに引用される形にする方法](/guide/blog-articles-ai-citations)、店舗の構造化データ全体は[SEOプラグインとローカルビジネスの構造化データ](/guide/local-business-schema-seo-plugins)で扱いました。この記事は「よくある質問」に絞り、Googleの変更で何が変わり何が変わっていないか、どんな質問をどう書けばAIの回答に使われやすいか、WordPressでどう載せて確かめるかを書きます。",
        "AIの回答は日・聞き方・使うサービスによって変わります。この記事の手順は、AIが答えを見つけやすいFAQを作り、正しく確かめるためのもので、回答に出ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "まず結論：2026年に変わったこと・変わっていないこと",
          table: {
            head: ["項目", "いまの状態", "出典"],
            rows: [
              ["Google検索のFAQリッチリザルト", "2026年5月7日から表示されない。2023年8月からは、よく知られた政府・保健医療のサイトに限られていた", `[Search Engine Journal（2026-05-10）](${SRC.sej})、[Search Engine Land](${SRC.sel})`],
              ["Search ConsoleのFAQレポート・リッチリザルトテスト", "2026年6月に終了、Search Console APIは8月に終了、とGoogleのドキュメントで予告（実施の確認は各ツールで）", `[TechWyse（2026-05-11）](${SRC.techwyse})が引用するGoogleの告知`],
              ["FAQPage という型", "schema.org の型として有効。マークアップを残しても問題は起きない、と報じられている", `[schema.org/FAQPage](${SRC.schemaFaq})、SEJ・TechWyse`],
              ["GoogleのAIによる概要・AIモード", "AI機能のために特別な構造化データは要らない。構造化データは表示されている本文と一致させる", `[AI機能とウェブサイト](${SRC.aiFeaturesJa})（2026-11-18に確認）`],
              ["ChatGPT・Perplexity・Claude", "FAQPage を出典選びに使うと明記した公式の資料は、この記事のために調べた範囲では見つからない", "—"],
              ["FAQの本文（質問と答えの文章）", "どのAIも読むのはページの本文。ここは何も変わっていない", "—"],
            ],
          },
          after: [
            `Googleは今回の終了についてブログ記事や理由を出していない、とSEJとTechWyseは書いています。最新の状態は[GoogleのFAQのドキュメント](${SRC.googleFaq})と2023年の[変更のお知らせ](${SRC.googleBlog2023})で確かめてください（この記事を書いた回は、Googleのドキュメントのページを直接は読めず、報道が引用した告知の文で書いています）。`,
          ],
        },
        {
          heading: "上位の記事でよく見る主張と、根拠の強さ",
          paragraphs: [
            "「FAQ 構造化データ AI検索」「FAQ schema AI search 2026」などで上位の日本語4本・英語4本を読みました。8本のうち4本（日本語1本・英語3本）は2026年5月の終了に触れておらず、FAQPage を「最優先」のまま勧めているものもありました。終了を書いた記事でも、リッチリザルトテストを確認方法として勧めたまま、同じ記事でそのテストの終了を書いている、という食い違いがありました。WordPressでの具体的な手順と、AIの回答での確かめ方を両方書いた記事はありませんでした。",
          ],
          table: {
            head: ["よく見る主張", "根拠の強さ", "この記事での扱い"],
            rows: [
              ["「FAQPage を付けるとAIに引用される回数が◯倍になる」", "多くは書いた会社の集計か、出典をたどれない数字。記事どうしで倍率が食い違う", "使わない"],
              ["「答えは40〜60語（100〜200字）がよい」", "経験則として書かれ、根拠の調査は示されていない", "長さではなく「1文目で答える」を基準にする"],
              ["「FAQのマークアップは今すぐ消すべき」", "Googleは型を廃止しておらず、残しても問題はないと報じられている", "消さなくてよい。表示していない質問と重複は直す"],
              ["「FAQのマークアップはもう意味がない」", "Googleの表示はなくなったが、型は有効。AIが使うかは公開されていない", "本文と同じ内容なら付けておいてよい補助"],
              ["「AIは新しい情報を好む」", "公式の説明は見当たらない", "日付は「事実が変わったら直す」ために書く"],
            ],
          },
        },
        {
          heading: "AIに使われやすい質問の選び方",
          paragraphs: [
            "FAQに入れるべき質問は、作り手が答えたい質問ではなく、お客さまが実際に聞いてくる質問です。AIに聞かれる質問も、同じ人が同じ迷いを入れて聞くので、ほぼ重なります。次の場所から集めると、外れが少なくなります。",
          ],
          list: [
            "電話・メール・問い合わせフォーム・LINEで、この3か月に2回以上来た質問",
            "予約や購入の直前に聞かれること（料金に含まれるもの、キャンセル、支払い方法、駐車場、所要時間）",
            "Search Console の「検索結果のパフォーマンス」で、自社サイトが表示されている「〜できる」「〜いくら」「〜違い」などの検索語句",
            "スタッフが口頭で毎回説明していること（初回の流れ、持ち物、対象外のケース）",
            "口コミや比較サイトで誤解されていること（実際はやっていないサービス、古い料金）",
          ],
          after: [
            "反対に、「当社の強みは何ですか？」のような、誰も聞かない宣伝の質問は入れません。FAQPage を広告や宣伝の目的で使うべきではない、という点はGoogleも示しています（[Search Engine Land](" + SRC.sel + ")による整理）。",
          ],
        },
        {
          heading: "答えの書き方：1文目で答え、条件と数字を添える",
          paragraphs: [
            "AIは質問に合う部分をページから抜き出して答えを組み立てます。前置きが長いと、答えの部分が見つかりにくくなります。決まりは3つです。1文目で「はい／いいえ」や金額・時間を言い切る。2文目以降に条件や例外を書く。詳しい説明は別のページに任せてリンクする。",
          ],
          table: {
            head: ["質問", "AIに使われにくい答え", "AIに使われやすい答え"],
            rows: [
              ["土曜日も営業していますか？", "当店ではお客さまのご都合に合わせられるよう、柔軟な営業を心がけております。", "はい。土曜日は9時〜13時に営業しています。日曜・祝日は休みです。"],
              ["料金はいくらですか？", "内容によって異なりますので、お気軽にお問い合わせください。", "基本プランは税込11,000円です。出張が必要な場合は、市外で税込2,200円を追加します。"],
              ["キャンセル料はかかりますか？", "キャンセルポリシーをご確認ください。", "前日までのキャンセルは無料です。当日のキャンセルは料金の50%をいただきます。"],
              ["◯◯には対応していますか？", "幅広いご要望にお応えしています。", "いいえ、◯◯は扱っていません。近い内容として△△を行っています。"],
            ],
          },
          after: [
            "表の金額や条件は書き方の例です。自社の実際の値を書いてください。「やっていないこと」をはっきり書くのも大切です。書いていないと、AIが他社の情報や古い情報で補ってしまうことがあります。",
            "答えを変えたら、同じ事実が載っている他のページ（料金表、会社概要、予約ページ）も同じ日に直します。ページどうしで値が違うと、AIがどちらを使うかは分かりません。",
          ],
        },
        {
          heading: "FAQをどこに置くか：専用ページと各ページの使い分け",
          table: {
            head: ["置き場所", "向いている質問", "注意すること"],
            rows: [
              ["FAQ専用ページ（/faq/ など）", "サイト全体に関わる質問（営業時間、支払い、予約の流れ、対応地域）", "50問を超えるなら、テーマごとに見出しで分ける。1つの答えに1つの話題"],
              ["サービス・商品のページ", "そのサービスだけの質問（所要時間、対象、含まれるもの）", "同じ質問を専用ページにも置くなら、答えを一字一句そろえる"],
              ["料金ページ", "追加料金、キャンセル、支払い方法", "金額は税込か税抜かを必ず書く"],
              ["ブログ記事", "その記事のテーマで次に聞かれること", "記事の内容が古くなったら、FAQも一緒に直すか外す"],
            ],
          },
        },
        {
          heading: "FAQPage を付けるときの決まり",
          paragraphs: [
            "付けるなら、守ることは多くありません。いちばん大事なのは、マークアップの質問と答えが、ページに表示されている文と同じであることです。表示していない質問をマークアップだけに書くのは、Googleの決まりに反します。GoogleはAI機能についても、構造化データは表示されている本文と一致させるよう求めています（[AI機能とウェブサイト](" + SRC.aiFeaturesJa + ")）。",
          ],
          code: JSONLD_JA,
          after: [
            "1つのページに FAQPage が2つ出ると、どちらが正しいか分かりにくくなります。SEOプラグインのFAQブロック、テーマの機能、手で貼ったコードなど、FAQを出すものを1つに決めてください。",
          ],
        },
        {
          heading: "今あるFAQのマークアップは消すべきか",
          paragraphs: [
            "消す必要はありません。リッチリザルトが出なくなっただけで、FAQPage の型は廃止されておらず、残しても Search Console のエラーにはならないと報じられています（[TechWyse](" + SRC.techwyse + ")）。ただし、この機会に次の3つは直してください。",
          ],
          list: [
            "表示していない質問がマークアップに入っている（以前、リッチリザルトのためだけに足したもの）→ 本文に出すか、マークアップから外す",
            "同じページに FAQPage が2つ以上ある → 出すものを1つにする",
            "答えが古い（料金・営業時間・担当者が変わった）→ 本文とマークアップを同時に直す",
          ],
          after: [
            "逆に、リッチリザルトが出なくなったからといって、FAQの本文そのものを消すのは損です。お客さまとAIが読むのは本文です。",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AIO を使う場合）",
          paragraphs: [
            `[Nurevo AIO（無料、旧表示名 Nurevo AEO）](${WP_ORG})では、FAQを「表示しているページにだけ」FAQPage として出します。表示していない質問は出しません。`,
          ],
          list: [
            "「Nurevo AIO」の「設定」で、サイト全体の質問と答えを入れる",
            "FAQを見せたい固定ページに「Nurevo AIO FAQ」ブロック（またはショートコード [nurevo_faq]）を置く。質問は開閉式で表示され、そのページにだけ FAQPage が出る",
            "ページだけの質問は、編集画面の右側の「Nurevo AIO」パネルで入れ、ブロックを「このページ専用の質問」に設定する（ショートコードは [nurevo_faq source=\"post\"]）",
            "Yoast SEO・Rank Math・All in One SEO・Slim SEO を使っている場合、Nurevoの質問はSEOプラグインの構造化データに足され、すでにある質問は重ねない。SEO SIMPLE PACK は構造化データを出さないので、Nurevo が FAQPage を出す",
            "公開後、ページのソースで application/ld+json を探し、FAQPage が1つだけで、質問と答えが表示と同じかを確かめる。構造の確認には [Schema Markup Validator](" + SRC.validator + ") も使える",
          ],
          after: [
            "Nurevo が出す FAQPage は、質問（Question の name）と答え（acceptedAnswer の Answer の text）だけのシンプルな形で、入れた文をそのまま使います。文を作り足したり、要約したりはしません。",
          ],
        },
        {
          heading: "効果の測り方：FAQを足す前と後で、同じ質問を聞く",
          paragraphs: [
            "FAQのリッチリザルトがなくなったので、Search Console の表示回数でFAQの効果を見ることはできなくなりました。AI検索での効果は、FAQに入れた質問を社名なしでAIに聞き、出典に自社のURLが出るかを、足す前と後で同じ条件で記録します。",
          ],
          table: {
            head: ["記録すること", "理由"],
            rows: [
              ["FAQに入れた質問を、社名なし・地域ありの形で5〜10個（例：「◯◯市で土曜に開いている歯医者は？」）", "社名を入れると、出て当たり前になる"],
              ["日付・使ったAI・ログインの有無", "条件が変わると答えも変わる"],
              ["名前が出たか、出典に自社のURLがあったか、FAQページか別のページか", "どのページが使われたかで、直す場所が分かる"],
              ["同じ質問を2〜3回", "1回の結果は偶然のことがある"],
              ["FAQを公開・更新した日", "前後を比べるため"],
            ],
          },
          after: [
            "Nurevoの無料プランとStandardでは、月に1回、業種と地域から作った社名なしの質問3つをNurevoのサービスがPerplexityに聞き、名前が出たか・サイトが引用されたかを表示します。Pro（月14,800円〜、ベータ）は最大20問をPerplexityで計測します（ChatGPTは設定され次第）。Googleは計測しないので、手で記録してください。詳しくは[AIでの登場率の測り方](/guide/measure-ai-visibility)へ。",
            "なお、Nurevoが2026年10月に62事業者で調べたところ、構造化データなどサイト側の対応の点数と、Perplexityの回答に出る率との間に、はっきりした関係は見られませんでした（順位相関 0.03、[調査の詳細](/guide/aeo-signals-ai-answers-study)）。マークアップだけで結果が変わると期待せず、質問の選び方と答えの中身で比べてください。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "FAQの質問は、実際に問い合わせで来た質問から選んだ",
            "どの答えも1文目で言い切っている（はい／いいえ・金額・時間）",
            "やっていないこと・対象外のことも書いた",
            "金額は税込か税抜かを書いた",
            "同じ質問の答えが、ページどうしで一字一句そろっている",
            "マークアップの質問と答えが、表示されている文と同じ",
            "1つのページに FAQPage は1つだけ",
            "表示していない質問をマークアップから外した",
            "FAQを足す前に、社名なしの質問でAIの回答を記録した",
            "料金・営業時間が変わったら、FAQも同じ日に直す決まりにした",
          ],
        },
      ],
      faqs: [
        { q: "GoogleのFAQリッチリザルトはいつ終わりましたか？", a: "2026年5月7日から表示されなくなったと報じられています。2023年8月からは、よく知られた政府・保健医療のサイトに限られていました。Search Console のFAQレポートとリッチリザルトテストは2026年6月に、Search Console API は8月に終了するとGoogleのドキュメントで予告されていました。" },
        { q: "FAQの構造化データは消したほうがいいですか？", a: "消す必要はありません。FAQPage は schema.org の型として有効で、残しても問題は起きないと報じられています。表示していない質問が入っている場合と、同じページに2つ出ている場合だけ直してください。" },
        { q: "FAQPage を付けるとChatGPTやPerplexityに引用されやすくなりますか？", a: "そう明記した公式の資料は、この記事のために調べた範囲では見つかりませんでした。AIが読むのはページの本文なので、まず本文の質問と答えを良くし、マークアップは本文と同じ内容で付ける補助と考えてください。" },
        { q: "GoogleのAIによる概要に出るためにFAQのマークアップは必要ですか？", a: "Googleは、AI機能のために特別な構造化データは必要ないと説明しています。構造化データを使う場合は、表示されている本文と一致させることを求めています。" },
        { q: "FAQは何問くらい書けばいいですか？", a: "決まった数はありません。実際に問い合わせで繰り返し来る質問をすべて入れ、誰も聞かない宣伝の質問は入れない、が基準です。多くなったらテーマごとに見出しで分けてください。" },
        { q: "FAQ専用ページと各サービスのページ、どちらに書くべきですか？", a: "サイト全体に関わる質問は専用ページ、そのサービスだけの質問はサービスのページに置きます。両方に置くなら、答えの文をそろえてください。値が違うと、AIがどちらを使うか分かりません。" },
        { q: "FAQを直したら、すぐAIの答えに反映されますか？", a: "反映までの時間は、どのAIも公開していません。直した日を記録し、数日から数週間あけて同じ質問・同じ条件で確かめてください。出典に選ばれるかはAIが決めるもので、保証はできません。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIがサイトを読める状態かを確かめる",
        body: "無料チェックは登録不要です。URLを入れると、AIクローラーの許可、構造化データ、llms.txtの状態が分かります。WordPressなら無料のプラグインで、表示しているFAQだけを FAQPage として出し、SEOプラグインと重ならないように整えられます。",
        label: "AI対応を無料でチェック",
        href: "/check",
        secondary: { label: "無料のWordPressプラグインを入れてみる", href: WP_ORG },
      },
      footnote: FOOT_JA,
    },
    en: {
      title: "Do FAQ Pages Help in AI Search? FAQ Schema in 2026 | Nurevo",
      description: "Google stopped showing FAQ rich results in May 2026. Whether to remove FAQPage, how to pick and write questions AI can use, WordPress steps and how to measure.",
      h1: "Do FAQ pages and FAQ structured data help in AI search? Where things stand in 2026, and how to write FAQs AI can use",
      lead: "Google's FAQ rich results (questions and answers shown as expandable rows in search results) were reported to have stopped appearing on May 7, 2026. FAQPage is still a valid schema.org type, though, so there is no need to rush to remove markup you already have. At the same time, we found no official documentation saying FAQPage makes a page more likely to be chosen as a source by ChatGPT, Perplexity or Google's AI Overviews. What helps in AI search is the FAQ itself: short, accurate answers, in the page text, to questions people actually ask. The markup comes second.",
      intro: [
        "Written November 19, 2026 (JST). We covered blog posts in [how to get blog articles cited by AI](/guide/blog-articles-ai-citations) and business structured data in general in [SEO plugins and local business schema](/guide/local-business-schema-seo-plugins). This guide is only about FAQs: what Google's change did and did not change, which questions to include and how to answer them so AI can use them, and how to publish and check them on WordPress.",
        "AI answers change with the day, the wording and the service. The steps here help you build FAQs that AI can find answers in and measure them properly. They do not guarantee that you will appear in any answer.",
      ],
      sections: [
        {
          heading: "The short answer: what changed in 2026 and what didn't",
          table: {
            head: ["Item", "Current state", "Source"],
            rows: [
              ["FAQ rich results in Google Search", "Not shown since May 7, 2026. Since August 2023 they had been limited to well-known government and health websites", `[Search Engine Journal (2026-05-10)](${SRC.sej}), [Search Engine Land](${SRC.sel})`],
              ["Search Console FAQ report and the Rich Results Test", "Google's documentation announced their removal in June 2026, and Search Console API support in August 2026 (check each tool for the current state)", `Google's notice as quoted by [TechWyse (2026-05-11)](${SRC.techwyse})`],
              ["The FAQPage type", "Still a valid schema.org type. Leaving the markup in place is reported to cause no problems", `[schema.org/FAQPage](${SRC.schemaFaq}), SEJ, TechWyse`],
              ["Google AI Overviews and AI Mode", "No special structured data is needed for AI features. Structured data must match the visible text", `[AI features and your website](${SRC.aiFeatures}) (checked 2026-11-18)`],
              ["ChatGPT, Perplexity, Claude", "In our research for this guide we found no official documentation saying they use FAQPage to choose sources", "—"],
              ["The FAQ text itself", "Every AI reads the page text. Nothing has changed here", "—"],
            ],
          },
          after: [
            `SEJ and TechWyse both note that Google published no blog post and gave no reason for the change. Check the latest state in [Google's FAQ documentation](${SRC.googleFaq}) and the 2023 [announcement](${SRC.googleBlog2023}). (We could not open Google's documentation pages directly while writing this, so the notice is described as the news articles quoted it.)`,
          ],
        },
        {
          heading: "Common claims in top articles, and how strong the evidence is",
          paragraphs: [
            "We read the top four Japanese and four English articles for searches such as \"FAQ schema AI search 2026\" and \"FAQ 構造化データ AI検索\". Four of the eight (one Japanese, three English) did not mention the May 2026 change, and one still ranked FAQPage as the top priority. One article that did mention the change still recommended the Rich Results Test as the way to check, while reporting in the same article that the test was being withdrawn. None gave both concrete WordPress steps and a way to check AI answers.",
          ],
          table: {
            head: ["Common claim", "Strength of evidence", "How this guide treats it"],
            rows: [
              ["\"FAQPage gets you x times more AI citations\"", "Mostly the author's own counts or figures that can't be traced; the multipliers differ between articles", "Not used"],
              ["\"Answers should be 40 to 60 words\"", "Presented as a rule of thumb with no study behind it", "We use \"answer in the first sentence\" instead of a length"],
              ["\"Remove your FAQ markup now\"", "Google has not retired the type, and leaving it is reported to be harmless", "No need to remove it. Fix hidden questions and duplicates"],
              ["\"FAQ markup is now pointless\"", "Google no longer shows it, but the type is valid. Whether AI uses it is not published", "A harmless extra when it matches the page"],
              ["\"AI prefers fresh content\"", "No official statement found", "Dates are for keeping facts correct"],
            ],
          },
        },
        {
          heading: "Choosing questions AI is likely to use",
          paragraphs: [
            "The questions that belong in an FAQ are the ones customers actually ask, not the ones you would like to answer. The questions people put to AI come from the same people with the same doubts, so they overlap heavily. These are good places to collect them:",
          ],
          list: [
            "Questions that came in at least twice in the last three months by phone, email, contact form or chat",
            "What people ask just before booking or buying (what the price includes, cancellation, payment, parking, how long it takes)",
            "Search terms in Search Console's performance report that show your site for \"can I\", \"how much\" or \"difference between\" questions",
            "Things your staff explain out loud every time (what happens on a first visit, what to bring, what is not covered)",
            "Misunderstandings in reviews and on listing sites (services you don't offer, old prices)",
          ],
          after: [
            "Leave out promotional questions nobody asks, such as \"What makes us special?\". FAQPage should not be used for advertising or promotion, a point Google has made (as summarised by [Search Engine Land](" + SRC.sel + ")).",
          ],
        },
        {
          heading: "How to write answers: answer in the first sentence, then add conditions",
          paragraphs: [
            "AI builds its answer by pulling the parts of a page that match the question. A long preamble makes the answer harder to find. Three rules: state the answer (yes or no, a price, a time) in the first sentence. Put conditions and exceptions after it. Leave the long explanation to another page and link to it.",
          ],
          table: {
            head: ["Question", "Answer AI is unlikely to use", "Answer AI can use"],
            rows: [
              ["Are you open on Saturdays?", "We aim to be flexible so we can fit around our customers' schedules.", "Yes. On Saturdays we are open 9:00 to 13:00. We are closed on Sundays and public holidays."],
              ["How much does it cost?", "It depends on the job, so please get in touch.", "The basic plan is $80 including tax. Visits outside the city add $15."],
              ["Is there a cancellation fee?", "Please see our cancellation policy.", "Cancelling up to the day before is free. Same-day cancellations are charged 50% of the price."],
              ["Do you handle X?", "We meet a wide range of needs.", "No, we don't handle X. The closest thing we offer is Y."],
            ],
          },
          after: [
            "The prices and conditions in the table are examples of the wording. Use your own real values. Saying clearly what you don't do matters too: if you don't say it, AI may fill the gap with another business's details or old information.",
            "When you change an answer, update every other page with the same fact (price list, about page, booking page) on the same day. If pages disagree, there is no telling which value AI will use.",
          ],
        },
        {
          heading: "Where to put FAQs: one FAQ page or on each page",
          table: {
            head: ["Location", "Best for", "Watch out for"],
            rows: [
              ["A dedicated FAQ page (/faq/ etc.)", "Questions about the whole business (hours, payment, how booking works, service area)", "Beyond about 50 questions, group them under headings. One topic per answer"],
              ["Service or product pages", "Questions about that service only (duration, who it's for, what's included)", "If the same question is also on the FAQ page, use exactly the same answer"],
              ["Pricing page", "Extra charges, cancellation, payment methods", "Always say whether prices include tax"],
              ["Blog posts", "What readers ask next about the post's topic", "When the post goes out of date, update or remove its FAQ too"],
            ],
          },
        },
        {
          heading: "Rules for adding FAQPage",
          paragraphs: [
            "If you add it, there isn't much to remember. The most important rule is that the questions and answers in the markup are the same text that is shown on the page. Putting questions only in the markup goes against Google's rules. For AI features too, Google asks that structured data match the visible text ([AI features and your website](" + SRC.aiFeatures + ")).",
          ],
          code: JSONLD_EN,
          after: [
            "Two FAQPage items on one page make it unclear which one is right. Choose one thing to output the FAQ: your SEO plugin's FAQ block, your theme's feature, or hand-written code.",
          ],
        },
        {
          heading: "Should you remove the FAQ markup you already have?",
          paragraphs: [
            "No. Only the rich result has gone; the FAQPage type has not been retired, and leaving it is reported not to create Search Console errors ([TechWyse](" + SRC.techwyse + ")). Use the moment to fix three things:",
          ],
          list: [
            "Questions in the markup that aren't shown on the page (added only for the rich result) → show them on the page or take them out of the markup",
            "Two or more FAQPage items on the same page → keep one source",
            "Out-of-date answers (prices, hours or staff changed) → fix the text and the markup together",
          ],
          after: [
            "On the other hand, deleting the FAQ text itself because the rich result is gone would be a loss. Customers and AI both read the text.",
          ],
        },
        {
          heading: "WordPress steps (with Nurevo AIO)",
          paragraphs: [
            `[Nurevo AIO (free, formerly shown as Nurevo AEO)](${WP_ORG}) publishes your FAQ as FAQPage only on pages where it is shown. Questions that aren't on any page are not published.`,
          ],
          list: [
            "Enter site-wide questions and answers under Nurevo AIO > Settings",
            "Add the \"Nurevo AIO FAQ\" block (or the [nurevo_faq] shortcode) to the page where the FAQ should appear. The questions are shown as expandable items, and FAQPage is published on that page only",
            "For questions about one page, enter them in the Nurevo AIO panel on the right of the editor and set the block to \"This page's own questions\" (shortcode: [nurevo_faq source=\"post\"])",
            "With Yoast SEO, Rank Math, All in One SEO or Slim SEO, Nurevo adds its questions to the SEO plugin's structured data and skips questions already there. SEO SIMPLE PACK publishes no structured data, so Nurevo publishes the FAQPage",
            "After publishing, search the page source for application/ld+json and check there is exactly one FAQPage and that its questions and answers match the page. The [Schema Markup Validator](" + SRC.validator + ") also checks the structure",
          ],
          after: [
            "The FAQPage Nurevo publishes is a simple one: the question (Question name) and the answer (acceptedAnswer Answer text), using exactly the text you entered. It does not add to or summarise your text.",
          ],
        },
        {
          heading: "How to measure: ask the same questions before and after",
          paragraphs: [
            "With FAQ rich results gone, Search Console impressions can no longer show what your FAQ does. To see the effect in AI search, ask AI the questions from your FAQ without your business name, and record whether your URL is among the sources, before and after, under the same conditions.",
          ],
          table: {
            head: ["What to record", "Why"],
            rows: [
              ["5 to 10 questions from your FAQ, without your name but with your area (e.g. \"Which dentist in [city] is open on Saturdays?\")", "With your name in the question, appearing proves nothing"],
              ["Date, which AI, signed in or not", "Answers change when conditions change"],
              ["Whether your name appeared, whether your URL was a source, and whether it was the FAQ page or another page", "Which page was used tells you where to make fixes"],
              ["Ask each question 2 or 3 times", "One result can be chance"],
              ["The date you published or updated the FAQ", "To compare before and after"],
            ],
          },
          after: [
            "On Nurevo's Free and Standard plans, once a month the Nurevo service asks Perplexity three unbranded questions built from your business type and area, and shows whether your name appeared and whether your site was cited. Pro ($99/month and up, beta) measures up to 20 questions on Perplexity (ChatGPT once configured). Google is not measured, so record it by hand. See [measuring AI visibility](/guide/measure-ai-visibility) for more.",
            "When Nurevo looked at 62 businesses in October 2026, there was no clear link between a site's on-site score (structured data and similar) and how often it appeared in Perplexity's answers (rank correlation 0.03; [study details](/guide/aeo-signals-ai-answers-study)). Don't expect markup alone to change results; compare question choice and answer content instead.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "FAQ questions were chosen from questions customers actually asked",
            "Every answer states the answer in the first sentence (yes or no, a price, a time)",
            "You also wrote what you don't do or don't cover",
            "Prices say whether tax is included",
            "Answers to the same question are word-for-word the same on every page",
            "Questions and answers in the markup match the text on the page",
            "There is only one FAQPage per page",
            "Questions not shown on the page are out of the markup",
            "You recorded AI answers to unbranded questions before adding the FAQ",
            "When prices or hours change, the FAQ is updated the same day",
          ],
        },
      ],
      faqs: [
        { q: "When did Google's FAQ rich results end?", a: "They were reported to have stopped appearing on May 7, 2026. Since August 2023 they had been limited to well-known government and health websites. Google's documentation announced that the Search Console FAQ report and Rich Results Test support would end in June 2026, and Search Console API support in August 2026." },
        { q: "Should I remove my FAQ structured data?", a: "There is no need. FAQPage is still a valid schema.org type, and leaving it is reported to cause no problems. Fix it only if it contains questions not shown on the page or appears twice on the same page." },
        { q: "Does FAQPage make ChatGPT or Perplexity more likely to cite me?", a: "In our research for this guide we found no official documentation that says so. AI reads the page text, so improve the questions and answers on the page first, and treat markup with the same content as an extra." },
        { q: "Do I need FAQ markup to appear in Google's AI Overviews?", a: "Google says no special structured data is needed for AI features. If you use structured data, Google asks that it match the visible text." },
        { q: "How many questions should an FAQ have?", a: "There is no set number. Include every question customers ask repeatedly, and leave out promotional questions nobody asks. When there are many, group them under headings." },
        { q: "Should FAQs go on one FAQ page or on each service page?", a: "Questions about the whole business go on the FAQ page; questions about one service go on that service's page. If a question is in both places, use the same answer. If values differ, there is no telling which one AI will use." },
        { q: "If I update the FAQ, will AI answers change right away?", a: "No AI service publishes how long it takes. Note the date of the change and check again a few days to a few weeks later with the same questions and conditions. Whether you are chosen as a source is up to the AI and cannot be guaranteed." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See whether AI can read your site",
        body: "The free check needs no sign-up: enter a URL to see AI crawler access, structured data and llms.txt. On WordPress, the free plugin publishes only the FAQs shown on a page as FAQPage, without duplicating your SEO plugin's output.",
        label: "Check your AI readiness for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: FOOT_EN,
    },
  },
};
