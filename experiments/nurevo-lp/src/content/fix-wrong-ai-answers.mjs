// Content page: what to do when ChatGPT, Perplexity or Google's AI Overviews
// state wrong facts about a business (hours, closure, prices, services, a
// mix-up with a namesake) - record, trace the source, sort by cause, fix the
// source in the right order, report, and re-measure.
//
// Written 2026-11-12 (JST). Third-party facts and where they were checked:
//   - Google AI Overviews feedback (thumbs down -> "Report a problem", the
//     feedback includes the latest query and its results; "AI responses may
//     include mistakes"): Google Search Help 14901683, read 2026-11-12.
//   - Google Business Profile: verified owners edit the profile; Google reviews
//     changes before they go live (no timeframe given): GBP Help 3039617, read
//     2026-11-12.
//   - Perplexity: answers include numbered citations linking to the sources:
//     Perplexity Help Center 10352895, read 2026-11-12.
//   - OpenAI OAI-SearchBot (sites that opt out are not shown in ChatGPT search
//     answers) and Google "AI features and your website" (no special
//     optimization; structured data should match visible text; keep Business
//     Profile up to date): same sentences as agency-aeo-monthly-service /
//     hair-salon-ai-search, checked on the official pages 2026-10-31 and
//     2026-11-01. They could not be re-fetched on 2026-11-12.
// Deliberately not stated: how long a correction takes (no official page we
// read gives a period), any business-facing correction form at OpenAI or
// Perplexity (not found on official pages), third-party accuracy statistics
// (the ones in top-ranking articles are vendor tests we could not verify).
// Product facts: readme.txt 0.9.1 (fills blanks only; free AI check: three
// questions a month on Perplexity, named / cited / who appeared instead; Pro
// measurement on Perplexity, beta).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  aioHelpJa: "https://support.google.com/websearch/answer/14901683?hl=ja",
  aioHelpEn: "https://support.google.com/websearch/answer/14901683?hl=en",
  gbpJa: "https://support.google.com/business/answer/3039617?hl=ja",
  gbpEn: "https://support.google.com/business/answer/3039617?hl=en",
  perplexity: "https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  openaiBots: "https://developers.openai.com/api/docs/bots",
};

export default {
  slug: "fix-wrong-ai-answers",
  targetQueries: [
    "AI gives wrong information about my business how to fix",
    "ChatGPT wrong information about my company",
    "Google AI Overview wrong business hours",
    "AI 間違った情報 自社 直し方",
    "ChatGPT 会社 情報 間違い 修正",
    "AIによる概要 間違い 店舗 報告",
  ],
  related: ["measure-ai-visibility", "appear-in-chatgpt", "local-business-schema-seo-plugins", "llms-txt", "search-console-ai-features"],
  locales: {
    ja: {
      title: "AIが自社の情報を間違えるときの直し方：原因別の手順 | Nurevo",
      description: "ChatGPT・Perplexity・GoogleのAIによる概要が営業時間や閉業、料金を間違えるときに、原因を見分けて直す順番、WordPressで直す場所、報告と測り直しの方法をまとめました。",
      h1: "AIが自社について間違った情報を答えるときの直し方：原因の見分け方と、直す順番",
      lead: "AIの回答そのものを、会社や店が直接書き換える方法はありません。直せるのは、AIが答えを作るときに読んでいる「元の情報」です。間違いを記録して出典をたどり、原因に合わせて自社サイト → Googleビジネスプロフィールなどの掲載情報 → 第三者のページの順に直し、そのうえで報告し、同じ質問で測り直します。",
      intro: [
        "作成日：2026年11月12日。Google・Perplexityの仕様は、同日に各社の公式ヘルプで確認したものです（本文にリンク）。画面や仕様は変わることがあるため、最新の公式ページもあわせてご確認ください。",
        "この記事は「営業時間が違う」「閉店したと言われる」「やっていないサービスを紹介される」「同じ名前の別の会社と混ざる」といった、事実の間違いを直すための手順です。AIの回答は質問のたびに変わり、どんな対策でも、正しい内容で必ず表示されると保証することはできません。目指すのは、AIが読む情報をそろえて、間違いが出にくい状態にすることです。",
      ],
      sections: [
        {
          heading: "まず押さえること：直す場所は「AIが読む元の情報」",
          paragraphs: [
            "ChatGPTの検索、Perplexity、GoogleのAIによる概要のような検索型のAIは、質問を受けるとウェブを検索し、見つけたページをもとに答えを書きます。Perplexityは、答えに番号付きの出典を付け、元のページへのリンクで確かめられるようにしていると説明しています（[Perplexity ヘルプセンター](" + SRC.perplexity + ")）。Googleも、AIによる概要には間違いが含まれることがあると明記しています（[Google 検索ヘルプ](" + SRC.aioHelpJa + ")）。",
            "つまり、間違いの多くには「どこかにそう読めるページがある」か「答えに必要な事実がどこにも書かれていない」という原因があります。前者なら元のページを直す、後者なら正しい事実をはっきり書いて公開する、が基本です。報告のボタンは補助で、元の情報が古いままだと、報告しても同じ間違いが出続けることがあります。",
          ],
        },
        {
          heading: "手順1：間違いを記録する（1回だけで判断しない）",
          paragraphs: [
            "最初に、何が・どのAIで・どんな質問のときに間違っているかを記録します。同じ質問でも回答は変わるため、日を変えて2〜3回聞き、毎回同じ間違いが出るのか、たまに出るのかを分けておきます。記録は、あとで「直ったか」を確かめるときの比較の基準にもなります。",
          ],
          table: {
            head: ["記録する項目", "記入例"],
            rows: [
              ["日時・AI・モード", "2026-11-12 10:00／Perplexity／通常の検索"],
              ["質問文（そのまま）", "〇〇市の△△歯科は日曜も診療していますか"],
              ["間違っている内容", "「日曜も10時から診療」と回答。実際は日曜休診"],
              ["正しい事実と根拠", "日曜休診（自社サイトの診療時間ページ、2026年4月改定）"],
              ["回答に付いた出典URL", "出典1：ポータルサイトの古い掲載ページ／出典2：自社サイト"],
              ["何回中何回出たか", "3回中2回"],
            ],
          },
          after: [
            "社名を入れた質問（「△△歯科の診療時間は」）と、社名を入れない質問（「〇〇市で日曜に開いている歯医者は」）の両方で確かめると、間違いの広がり方がわかります。質問の選び方と回数の決め方は[AIでの登場率の測り方](/guide/measure-ai-visibility)で詳しく説明しています。",
          ],
        },
        {
          heading: "手順2：出典をたどって、原因を6つに分ける",
          paragraphs: [
            "記録した出典URLを開き、間違った内容がどこに書かれているかを探します。Perplexityは出典が番号で示されるのでたどりやすく、GoogleのAIによる概要も回答の横や下にリンクが出ます。出典に間違いが見つからない場合も、それ自体が手がかりです。次の表で、原因の型と直す場所を決めます。",
          ],
          table: {
            head: ["原因の型", "見分け方", "直す場所"],
            rows: [
              ["①自社サイトが古い・ページ間で食い違う", "出典が自社ページ。古いお知らせ、旧料金表、ページごとに違う営業時間が残っている", "自社サイト（手順3・4）"],
              ["②構造化データだけが古い", "ページの文章は正しいが、構造化データ（JSON-LD）の営業時間や住所が古い", "SEOプラグイン・テーマの設定（手順4）"],
              ["③掲載情報が古い", "出典がGoogleビジネスプロフィール、地図、予約・ポータルサイト", "各掲載先の管理画面（手順5）"],
              ["④第三者のページ", "古いニュース、まとめ記事、口コミサイト、退職者のブログなど", "掲載元への修正依頼（手順5）"],
              ["⑤同じ名前の別の会社・店", "別の地域や業種の、同名の会社の情報が混ざっている", "自社サイトで正式名称・所在地・業種をはっきり書く（手順3）"],
              ["⑥出典なしの推測", "どの出典にも書かれていない。答えに必要な事実が公開されていない", "その事実を自社サイトに書く（手順3）"],
            ],
          },
          after: [
            "もう一つ、AIがそもそも自社サイトを読めていない可能性も確かめます。robots.txtでAI検索のクローラを止めていると、自社の正しいページが出典に使われず、古い第三者のページだけが読まれることがあります。OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないと説明しています（[OpenAI：クローラの概要](" + SRC.openaiBots + ")）。",
          ],
        },
        {
          heading: "手順3：自社サイトを「いちばん正しい情報源」にする",
          paragraphs: [
            "どの原因でも、まず自社サイトに正しい事実が一か所にまとまっていることが土台になります。AIが複数のページを比べたとき、自社の公式ページがはっきりしていれば、それが選ばれやすくなります（選ばれることの保証ではありません）。",
          ],
          list: [
            "会社概要・店舗情報のページに、正式名称、住所、電話番号、営業時間（定休日・祝日・季節の例外も）、対応エリア、主なサービスを文章で書く。画像だけで書かない。",
            "「最終更新日」をページに書く。営業時間や料金を変えたら日付も更新する。",
            "古い情報が残るページを片付ける。終わったキャンペーン、旧料金表、移転前の地図は、削除するか、冒頭に「この情報は〇年〇月で終了しました」と書く。",
            "閉業・移転・休業は、トップページと会社概要の両方にはっきり書く。一時休業なら再開予定日も書く。",
            "同名の会社と混ざるときは、「〇〇県〇〇市の△△（〇年創業、□□業）です。△△株式会社（東京都）とは別の会社です」のように、区別できる事実を書く。",
            "やっていないサービスを紹介されるときは、よくある質問に「〇〇は行っていません。代わりに□□を行っています」と、否定の答えを書く。AIは書かれていないことを推測で埋めることがあるため、「やっていない」も事実として書く価値があります。",
          ],
        },
        {
          heading: "手順4：WordPressで確かめる場所",
          paragraphs: [
            "WordPressのサイトでは、同じ事実が複数の場所から出力されていることがよくあります。文章だけ直して、構造化データやllms.txtが古いまま、ということがないよう、次の場所を順に確かめます。Googleは、構造化データはページの見える内容と一致させるよう求めています（[Google 検索セントラル：AI機能とウェブサイト](" + SRC.googleAi + ")）。",
          ],
          table: {
            head: ["場所", "確かめること"],
            rows: [
              ["固定ページ（会社概要・店舗情報・料金・よくある質問）", "手順3の事実が正しく、ページ間で同じ値になっているか"],
              ["SEOプラグインの組織・店舗設定（Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACKなど）", "会社名、住所、電話番号、営業時間、ロゴが最新か"],
              ["テーマの構造化データ（SWELL、Lightningなど）", "テーマ側でも組織情報を出していないか。出しているなら同じ値か"],
              ["ページのソース（ブラウザで「ページのソースを表示」→ application/ld+json を検索）", "実際に公開されている構造化データの値。古い営業時間が残っていないか"],
              ["/llms.txt", "会社の説明、主なページ、サービスの一覧が最新か。古いページを載せていないか"],
              ["/robots.txt", "OAI-SearchBot、PerplexityBotなどAI検索のクローラを止めていないか"],
              ["キャッシュ（キャッシュ系プラグイン・CDN）", "直したあとにキャッシュを消し、公開ページに新しい値が出ているか"],
            ],
          },
          after: [
            "Nurevo AEOを入れている場合は、AEOスコアの画面で診断を実行すると、構造化データ・llms.txt・AIクローラの許可の状態をまとめて確かめられます。Nurevo AEOは空欄だけを埋め、SEOプラグインに入力済みの値は上書きしません。そのため、元の値が古いときは、SEOプラグイン側の設定を直してください。Nurevoの設定画面で自動で読み取った店舗情報も、間違いがないか見直します。",
          ],
        },
        {
          heading: "手順5：掲載情報と第三者のページを直す",
          paragraphs: [
            "Googleビジネスプロフィールは、オーナー確認済みのビジネスなら、Google検索やマップのプロフィールから「プロフィールを編集」で直せます。Googleは、変更を審査してから公開すると説明しています（[Googleビジネスプロフィール ヘルプ](" + SRC.gbpJa + ")）。営業時間・臨時休業・住所・電話番号・ウェブサイトのURLを、自社サイトと同じ値にそろえます。Googleは、AI機能に出るための特別な対策はなく、ビジネスプロフィールの情報を最新にすることなど、通常の基本が大切だとしています（[Google 検索セントラル](" + SRC.googleAi + ")）。",
            "予約サイト、ポータルサイト、業界団体の名簿などは、それぞれの管理画面か問い合わせ窓口から直します。自分で直せない第三者の記事や口コミサイトは、掲載元に「どこが・何に・なぜ変わったか」を、根拠のページ（自社の公式ページ）のURLを添えて依頼します。依頼しても直らないことはあるため、自社サイトの記述をはっきりさせる（手順3）ことと並行して進めます。",
          ],
        },
        {
          heading: "手順6：各AIに報告する",
          paragraphs: [
            "GoogleのAIによる概要は、回答の下にある低評価（よくない）のアイコンから「問題を報告」を選び、当てはまる項目を選んで送信できます。送ったフィードバックには、直近の検索語句とその検索結果が含まれるとGoogleは説明しています（[Google 検索ヘルプ](" + SRC.aioHelpJa + ")）。報告するときは、間違いが出た質問で検索した直後に送ると、どの回答の話かが伝わります。",
            "ChatGPTやPerplexityにも回答への評価の機能がありますが、会社や店が自社の情報の訂正を申し込む専用の窓口は、この記事の作成時点で両社の公式ページから確認できませんでした。そのため、報告は「気づいたときに送る」補助と考え、効果の中心は手順3〜5の元の情報の修正に置きます。",
          ],
        },
        {
          heading: "手順7：同じ質問で測り直す",
          paragraphs: [
            "直したあとは、手順1と同じ質問・同じAI・同じモードで聞き直し、記録を並べます。どのくらいで反映されるかは、AIや検索エンジンがページを読み直す時期によって違い、各社の公式ページで決まった期間は示されていません。1〜2週間ごとなど、間隔を決めて同じ形で記録し、「3回中2回」が「3回中0回」になったか、出典が古いページから自社ページに変わったかを見ます。",
            "Googleについては、Search Consoleの生成AIパフォーマンスレポートで、AI機能に自社のページがどれだけ表示されているかも確認できます（[Search ConsoleでAIによる概要を見る方法](/guide/search-console-ai-features)）。ただし表示回数であり、回答の中身が正しいかどうかはわかりません。中身は、記録した回答で確かめます。",
          ],
        },
        {
          heading: "よくある間違いの種類別の対処",
          table: {
            head: ["間違い", "まず確かめる場所", "直し方の要点"],
            rows: [
              ["閉店した・休業中と言われる", "Googleビジネスプロフィールの状態、古い休業のお知らせ、同名の店の閉店ニュース", "プロフィールの営業中の状態と営業時間を確認。休業のお知らせを終了表示に。自社サイトに「現在営業しています」と所在地を明記"],
              ["営業時間・定休日が違う", "自社サイトの複数ページ、構造化データ、プロフィール、予約サイト", "すべてを同じ値にそろえる。祝日・季節の例外も文章で書く"],
              ["料金が古い", "旧料金表のページ、PDF、ポータルの掲載", "古いページを削除または終了表示。料金ページに改定日を書く"],
              ["やっていないサービスを紹介される", "似た業種の一般的な説明、他店の情報", "よくある質問に「行っていません」と書き、実際に行うサービスを一覧にする"],
              ["同名の別の会社と混ざる", "出典のドメインと所在地", "正式名称・所在地・創業年・業種を会社概要に書き、別の会社であることを明記"],
              ["住所・電話番号が古い", "移転前のページ、名簿、地図サービス", "掲載先を一つずつ直す。自社サイトの全ページのフッターも確認"],
            ],
          },
        },
        {
          heading: "やってはいけないこと",
          list: [
            "AIだけに読ませる隠しテキストや、ページの内容と違う構造化データを書くこと。Googleは構造化データを見える内容と一致させるよう求めています。",
            "自作自演の口コミや、事実と違う比較記事を作ること。間違いを別の間違いで上書きすることになり、景品表示法などの問題にもなり得ます。",
            "robots.txtでAIのクローラをすべて止めること。間違いは消えず、正しい自社ページが読まれなくなるおそれがあります。学習用と検索用のクローラは別の名前なので、止めるなら学習用だけにするなど、目的に合わせて選びます。",
            "1回の回答だけで「直った」「直らない」と判断すること。必ず同じ条件で何回か確かめます。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "間違いを、日時・AI・質問文・回答・出典URL・出た回数で記録した",
            "出典を開き、原因を6つの型のどれかに分けた",
            "自社サイトの会社概要・店舗情報に、正しい事実を文章で書き、最終更新日を入れた",
            "古いお知らせ・料金表・地図を削除または終了表示にした",
            "構造化データ（SEOプラグイン・テーマ）とllms.txtの値を、ページの文章と同じにした",
            "robots.txtでAI検索のクローラを止めていないことを確かめた",
            "キャッシュを消し、公開ページで新しい値を確認した",
            "Googleビジネスプロフィールと主な掲載先を同じ値にそろえた",
            "直せない第三者のページには、根拠URLを添えて修正を依頼した",
            "GoogleのAIによる概要で、間違いが出た回答を報告した",
            "1〜2週間ごとに同じ質問で測り直す予定を決めた",
          ],
        },
        {
          heading: "Nurevo AEOでできること",
          paragraphs: [
            "Nurevo AEOは、WordPressのサイトの事実（会社・店舗の情報、サービス、よくある質問）を、AIが読む形式（構造化データ、llms.txt、AIクローラのルール）で公開する無料のプラグインです。SEOプラグインが出している構造化データに足りない事実を足し、二重に出力しません。",
            "サイトを接続したFree・Standardプランでは、無料のAIチェックとして、月に1回、業種と地域から作ったお客さまが聞きそうな3つの質問（社名は入れません）をPerplexityに聞き、自社の名前が出たか、自社サイトが引用されたか、代わりにどこが出たかを表示します。Pro（月14,800円〜、ベータ版）では、決めた質問のセットで登場率を続けて測れます（現在はPerplexityで計測）。回答の正しさの判断は自動では行わないため、間違いの確認は、この記事の手順1の記録とあわせて行ってください。",
          ],
        },
      ],
      faqs: [
        { q: "AIの運営会社に頼めば、自社の情報を直してもらえますか？", a: "回答そのものを会社の依頼で書き換えてもらう仕組みは、この記事の作成時点で各社の公式ページから確認できませんでした。GoogleのAIによる概要には「問題を報告」の機能がありますが、確実に直す手段ではありません。効果の中心は、AIが読む元の情報（自社サイト、ビジネスプロフィール、掲載先）を直すことです。" },
        { q: "直してから、どのくらいで反映されますか？", a: "AIや検索エンジンがページを読み直す時期によって違い、決まった期間は公式に示されていません。1〜2週間ごとなど間隔を決めて、同じ質問で記録し、変化を確かめてください。" },
        { q: "自社サイトは正しいのに、AIが間違えます。なぜですか？", a: "出典が第三者のページ（古い掲載情報、同名の別の会社など）になっているか、答えに必要な事実がサイトに書かれていないことが多い原因です。出典URLを開いて原因を分け、構造化データとrobots.txtも確かめてください。" },
        { q: "llms.txtを置けば、間違いは直りますか？", a: "llms.txtはサイトの要点と主なページをAIに伝える補助のファイルで、それだけで回答が直るとは限りません。ページの文章、構造化データ、掲載情報とあわせて、同じ正しい事実を出すことが大切です。" },
        { q: "閉店したと表示されてしまいます。いちばん先にやることは？", a: "Googleビジネスプロフィールの営業状態と営業時間を確認し、自社サイトのトップページと会社概要に、営業中であることと所在地をはっきり書きます。同名の店の閉店ニュースが出典になっていないかも確かめてください。" },
        { q: "ChatGPTとPerplexityとGoogleで、やることは違いますか？", a: "元の情報を直すという基本は同じです。違いは確かめ方で、Perplexityは番号付きの出典で元のページをたどりやすく、Googleは報告の機能とSearch Consoleの表示回数が使えます。ChatGPTの検索に出るには、robots.txtでOAI-SearchBotを止めていないことが前提です。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトの事実を読めるか確認",
        body: "登録不要の無料チェックで、構造化データやllms.txt、AI検索のクローラの許可など、AIが読む情報の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを無料で入れてみる", href: WP_ORG },
      },
      footnote: "Google、Googleビジネスプロフィール、Search Console、ChatGPT、OpenAI、Perplexity、WordPress、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、SWELL、Lightningおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "AI Gets Your Business Facts Wrong? How to Fix It | Nurevo",
      description: "When ChatGPT, Perplexity or Google's AI Overviews get your hours, prices or status wrong: trace the cause, fix it in the right order on WordPress, report it, re-check.",
      h1: "When AI states wrong facts about your business: find the cause, then fix it in the right order",
      lead: "There is no way for a business to edit an AI's answer directly. What you can fix is the information the AI reads when it writes that answer. Record the error, trace its sources, then fix things by cause: your own website first, then listings such as your Google Business Profile, then third-party pages. After that, report the answer and re-ask the same questions to see whether it changed.",
      intro: [
        "Written November 12, 2026 (JST). The Google and Perplexity details were checked that day on their official help pages, linked below. Screens and policies change, so check the current official pages as well.",
        "This guide is for factual errors: wrong opening hours, being described as closed, being credited with services you do not offer, or being mixed up with a business of the same name. AI answers change every time a question is asked, and no fix can guarantee that an AI will always describe you correctly. The goal is to make the facts AI reads consistent, so errors become less likely.",
      ],
      sections: [
        {
          heading: "The key idea: fix what the AI reads, not the answer",
          paragraphs: [
            "Search-based AI such as ChatGPT search, Perplexity and Google's AI Overviews searches the web when it gets a question and writes its answer from the pages it finds. Perplexity says each answer includes numbered citations that link to the original sources so you can verify them ([Perplexity Help Center](" + SRC.perplexity + ")). Google states plainly that AI responses may include mistakes ([Google Search Help](" + SRC.aioHelpEn + ")).",
            "So most errors have one of two causes: some page somewhere can be read that way, or the fact the answer needs is not written down anywhere. In the first case you fix the source page; in the second you publish the correct fact clearly. Feedback buttons help, but if the source stays out of date the same error can keep coming back.",
          ],
        },
        {
          heading: "Step 1: Record the error (do not judge from one answer)",
          paragraphs: [
            "Start by writing down what is wrong, on which AI, and for which question. Answers vary even for the same question, so ask two or three times on different days and note whether the error appears every time or only sometimes. This record is also your baseline for checking later whether the fix worked.",
          ],
          table: {
            head: ["Field", "Example"],
            rows: [
              ["Date, AI and mode", "2026-11-12 10:00 / Perplexity / standard search"],
              ["Question (exact wording)", "Is Smith Dental in Springfield open on Sundays?"],
              ["What was wrong", "Said \"open Sundays from 10 am\". The practice is closed on Sundays"],
              ["Correct fact and evidence", "Closed on Sundays (opening hours page on our site, changed April 2026)"],
              ["Source URLs shown with the answer", "Source 1: an old directory listing / Source 2: our site"],
              ["How often it appeared", "2 out of 3 answers"],
            ],
          },
          after: [
            "Check with questions that include your name (\"What are Smith Dental's hours?\") and questions that do not (\"Which dentists in Springfield are open on Sunday?\") to see how far the error has spread. [How to measure AI visibility](/guide/measure-ai-visibility) explains how to choose questions and how many times to ask.",
          ],
        },
        {
          heading: "Step 2: Follow the sources and sort the cause into one of six types",
          paragraphs: [
            "Open the source URLs you recorded and look for where the wrong statement is written. Perplexity numbers its sources, which makes them easy to trace, and Google's AI Overviews show links beside or below the answer. If none of the sources contains the error, that is a clue too. Use the table to decide what kind of cause it is and where to fix it.",
          ],
          table: {
            head: ["Cause", "How to recognise it", "Where to fix it"],
            rows: [
              ["1. Your site is out of date or inconsistent", "The source is your own page: an old announcement, an old price list, different hours on different pages", "Your website (steps 3 and 4)"],
              ["2. Only the structured data is out of date", "The page text is right, but the hours or address in the JSON-LD are old", "SEO plugin or theme settings (step 4)"],
              ["3. A listing is out of date", "The source is your Google Business Profile, a map, a booking site or a directory", "Each listing's dashboard (step 5)"],
              ["4. A third-party page", "An old news story, a roundup article, a review site, a former employee's blog", "Ask the publisher to correct it (step 5)"],
              ["5. A business with the same name", "Facts from a namesake in another area or trade are mixed in", "State your legal name, location and trade clearly on your site (step 3)"],
              ["6. A guess with no source", "None of the sources says it. The fact the answer needs is not published", "Publish that fact on your site (step 3)"],
            ],
          },
          after: [
            "Also check whether AI can read your site at all. If robots.txt blocks AI search crawlers, your correct pages may not be used as sources while old third-party pages still are. OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers ([OpenAI: overview of crawlers](" + SRC.openaiBots + ")).",
          ],
        },
        {
          heading: "Step 3: Make your own site the most reliable source",
          paragraphs: [
            "Whatever the cause, the foundation is having the correct facts in one clear place on your own site. When an AI compares several pages, a clear official page makes it more likely that yours is the one used (it is not a guarantee).",
          ],
          list: [
            "On your About or Location page, write out in text your legal name, address, phone number, opening hours (including closing days, public holidays and seasonal exceptions), service area and main services. Do not put them only in an image.",
            "Show a \"last updated\" date on the page and change it whenever hours or prices change.",
            "Clean up pages that keep old facts alive. Remove finished promotions, old price lists and maps from before a move, or add a note at the top such as \"This offer ended in March 2026\".",
            "If you have closed, moved or paused trading, say so clearly on both the home page and the About page. For a temporary closure, give the reopening date.",
            "If you are confused with a namesake, write facts that tell you apart: \"Smith Dental in Springfield, Illinois (founded 2009, general dentistry). We are not connected with Smith Dental Group in Ohio.\"",
            "If AI says you offer a service you do not, answer it in your FAQ: \"We do not offer X. We do offer Y.\" AI sometimes fills gaps with guesses, so \"we don't do this\" is a fact worth publishing.",
          ],
        },
        {
          heading: "Step 4: Where to look on WordPress",
          paragraphs: [
            "On WordPress the same fact is often output from several places. To avoid fixing the text while the structured data or llms.txt still says the old thing, check each of these in turn. Google asks that structured data match what is visible on the page ([Google Search Central: AI features and your website](" + SRC.googleAi + ")).",
          ],
          table: {
            head: ["Where", "What to check"],
            rows: [
              ["Pages (About, Location, Prices, FAQ)", "The facts from step 3 are correct and identical across pages"],
              ["Your SEO plugin's organisation or local settings (Yoast SEO, Rank Math, All in One SEO and others)", "Name, address, phone number, opening hours and logo are current"],
              ["Your theme's structured data", "Whether the theme also outputs organisation details, and if so whether they match"],
              ["The page source (View Page Source, search for application/ld+json)", "The values actually published. Look for old hours left behind"],
              ["/llms.txt", "Your description, key pages and services are current, with no outdated pages listed"],
              ["/robots.txt", "AI search crawlers such as OAI-SearchBot and PerplexityBot are not blocked"],
              ["Caches (caching plugin, CDN)", "Clear them after the fix and confirm the new values on the live page"],
            ],
          },
          after: [
            "If you use Nurevo AEO, running the diagnosis on the AEO Score screen checks structured data, llms.txt and AI crawler access together. Nurevo AEO only fills in blanks and never overwrites values already set in your SEO plugin, so if an old value comes from there, correct it in the SEO plugin. Also review the business details Nurevo extracted automatically in its settings.",
          ],
        },
        {
          heading: "Step 5: Fix listings and third-party pages",
          paragraphs: [
            "If your Google Business Profile is verified, you can correct it with Edit profile from your profile in Google Search or Maps. Google says it reviews changes before they go live on your profile ([Google Business Profile Help](" + SRC.gbpEn + ")). Make opening hours, temporary closures, address, phone number and website URL match your site exactly. Google says there are no special optimizations for its AI features and that the usual basics matter, such as keeping your Business Profile information up to date ([Google Search Central](" + SRC.googleAi + ")).",
            "Booking sites, directories and trade association lists are corrected through their own dashboards or contact forms. For third-party articles and review sites you cannot edit, ask the publisher, stating what is wrong, what it should say and why, with a link to your official page as evidence. Requests are not always granted, so keep making your own site clearer (step 3) at the same time.",
          ],
        },
        {
          heading: "Step 6: Report the answer to each AI",
          paragraphs: [
            "In Google's AI Overviews, choose the thumbs down icon below the overview, then Report a problem, pick the category that fits and submit. Google says the feedback you send includes your most recent search query and its results ([Google Search Help](" + SRC.aioHelpEn + ")), so send it right after searching the question that produced the error, so it is clear which answer you mean.",
            "ChatGPT and Perplexity also let you rate answers, but at the time of writing we could not find on their official pages a dedicated channel for businesses to request corrections to facts about themselves. Treat reporting as something to do when you notice an error, and put most of the effort into fixing the sources in steps 3 to 5.",
          ],
        },
        {
          heading: "Step 7: Re-ask the same questions",
          paragraphs: [
            "After fixing, ask the same questions on the same AI in the same mode as in step 1, and put the records side by side. How long changes take depends on when the AI or search engine re-reads your pages, and none of the official pages we read gives a set period. Pick an interval, such as every one or two weeks, record in the same format, and look for \"2 out of 3\" becoming \"0 out of 3\", or for the source changing from an old page to yours.",
            "For Google, the Generative AI performance report in Search Console shows how often your pages appear in AI features ([How to see AI Overviews in Search Console](/guide/search-console-ai-features)). Those are impressions, though: they do not tell you whether the answer was correct. Check the content with your recorded answers.",
          ],
        },
        {
          heading: "What to do for common types of error",
          table: {
            head: ["Error", "Check first", "How to fix it"],
            rows: [
              ["Described as closed or paused", "Business Profile status, old closure notices, news of a namesake closing", "Confirm the open status and hours on your profile. Mark old notices as ended. State on your site that you are open, with your location"],
              ["Wrong hours or closing days", "Several pages on your site, structured data, your profile, booking sites", "Make every one the same. Write holiday and seasonal exceptions in text"],
              ["Old prices", "Old price pages, PDFs, directory listings", "Remove old pages or mark them as ended. Show the date prices were changed"],
              ["Credited with a service you do not offer", "Generic descriptions of your trade, other businesses' pages", "Say \"we do not offer this\" in your FAQ and list what you do offer"],
              ["Mixed up with a namesake", "The source's domain and location", "Put your legal name, location, founding year and trade on your About page and say you are a separate business"],
              ["Old address or phone number", "Pages from before a move, directories, map services", "Correct each listing one by one, and check the footer on every page of your site"],
            ],
          },
        },
        {
          heading: "What not to do",
          list: [
            "Do not hide text meant only for AI, or publish structured data that differs from the page. Google asks that structured data match the visible content.",
            "Do not write fake reviews or misleading comparison pages. You would be replacing one error with another, and it may break consumer protection rules.",
            "Do not block every AI crawler in robots.txt. The error will not go away, and your correct pages may stop being read. Training crawlers and search crawlers have different names, so if you block anything, choose by purpose, for example training crawlers only.",
            "Do not decide that a fix worked, or failed, from a single answer. Always check several times under the same conditions.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "Recorded the error with date, AI, exact question, answer, source URLs and how often it appeared",
            "Opened the sources and sorted the cause into one of the six types",
            "Wrote the correct facts in text on the About or Location page, with a last updated date",
            "Removed or marked as ended old announcements, price lists and maps",
            "Made structured data (SEO plugin and theme) and llms.txt match the page text",
            "Confirmed robots.txt does not block AI search crawlers",
            "Cleared caches and checked the new values on the live page",
            "Made your Google Business Profile and main listings match",
            "Asked publishers of third-party pages to correct them, with an evidence URL",
            "Reported the wrong answer in Google's AI Overviews",
            "Scheduled a re-check with the same questions every one or two weeks",
          ],
        },
        {
          heading: "What Nurevo AEO does",
          paragraphs: [
            "Nurevo AEO is a free WordPress plugin that publishes your site's facts (business details, services and FAQ) in the formats AI reads: structured data, llms.txt and AI crawler rules. It adds the facts your SEO plugin's structured data leaves out, without publishing a second copy.",
            "On connected Free and Standard sites, the free AI check asks Perplexity, once a month, three questions a customer might ask, built from your trade and area (never your name), and shows whether your business was named, whether your site was cited and who appeared instead. Pro (from USD 99 a month, in beta) keeps measuring a fixed set of questions, currently on Perplexity. It does not judge automatically whether an answer is correct, so check accuracy with the record from step 1.",
          ],
        },
      ],
      faqs: [
        { q: "Can I ask the AI company to correct facts about my business?", a: "At the time of writing we could not find, on the companies' official pages, a way for a business to have an answer rewritten on request. Google's AI Overviews have a Report a problem option, but it is not a guaranteed fix. The main lever is correcting what the AI reads: your website, your Business Profile and your listings." },
        { q: "How long does a fix take to show up?", a: "It depends on when the AI or search engine re-reads your pages, and no official page gives a set period. Pick an interval, such as every one or two weeks, re-ask the same questions and record the results." },
        { q: "My site is correct but the AI is still wrong. Why?", a: "Usually the source is a third-party page (an old listing, a namesake business) or the fact the answer needs is not written on your site. Open the source URLs to find the cause, and check your structured data and robots.txt too." },
        { q: "Will adding llms.txt fix the error?", a: "llms.txt is a helper file that tells AI your site's essentials and key pages; on its own it may not change the answer. What matters is that page text, structured data and listings all give the same correct facts." },
        { q: "AI says we are closed. What should I do first?", a: "Check the status and hours on your Google Business Profile, then state clearly on your home page and About page that you are open, with your location. Also check whether news of a namesake closing is being used as a source." },
        { q: "Is the fix different for ChatGPT, Perplexity and Google?", a: "The basics are the same: fix the sources. What differs is how you check. Perplexity's numbered citations make sources easy to trace; Google offers Report a problem and impressions in Search Console. To appear in ChatGPT search at all, robots.txt must not block OAI-SearchBot." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your site's facts",
        body: "A free check with no sign-up shows the state of what AI reads on your site: structured data, llms.txt and access for AI search crawlers. On WordPress, Nurevo AEO fills in what is missing for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Try Nurevo AEO free on WordPress.org", href: WP_ORG },
      },
      footnote: "Google, Google Business Profile, Search Console, ChatGPT, OpenAI, Perplexity, WordPress, Yoast SEO, Rank Math, All in One SEO and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
