// Content page: how to see visits that come from AI (ChatGPT, Perplexity,
// Gemini, Copilot, Claude...) in Google Analytics 4, and what GA4 cannot see.
//
// Written 2026-11-10 (JST). This page is about clicks (traffic). Mentions and
// citations inside AI answers are measure-ai-visibility; keep the two apart.
//
// Third-party facts, checked 2026-11-10 and linked in the copy:
//   - GA4 default channel group (support.google.com/analytics/answer/9756891):
//     the "AI Assistant" channel description ("sources like ChatGPT, Gemini,
//     Deepseek, Copilot, or Grok. It excludes Google's AI Overviews and AI
//     Mode."), Organic Search including AI Overviews and AI Mode, and the
//     Direct rule (source "(direct)" and medium "(not set)" / "(none)").
//     The page gives no date for the AI channel, so the copy gives none.
//     Third-party write-ups disagree on whether Perplexity and Claude land in
//     it, so the copy tells readers to check the source column instead.
//   - Custom channel groups (answer/13051316): Admin > Data display > Channel
//     groups, "matches regex", first matching channel wins, retroactive,
//     2 custom groups on standard properties (5 on 360), 50 channels a group,
//     not in the BigQuery export schema.
//   - GA4 regex is full match by default (answer/1034324).
//   - utm_source=chatgpt.com: OpenAI publishers and developers FAQ (sentence
//     confirmed in the search index; the help centre itself could not be
//     fetched from here, as for measure-ai-visibility).
//   - Crawler names: OpenAI and Perplexity crawler docs (as in
//     measure-ai-visibility). Claude crawler names are the ones in the plugin
//     readme's AI crawler rules.
//   - Site Kit by Google on wordpress.org.
// Product facts: plugin readme 0.9.1 (no third-party script, no visitor data
// sent; AI crawler rules; free AI check; Pro measurement on Perplexity).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  gaChannelsJa: "https://support.google.com/analytics/answer/9756891?hl=ja",
  gaChannelsEn: "https://support.google.com/analytics/answer/9756891?hl=en",
  gaCustomJa: "https://support.google.com/analytics/answer/13051316?hl=ja",
  gaCustomEn: "https://support.google.com/analytics/answer/13051316?hl=en",
  gaRegexJa: "https://support.google.com/analytics/answer/1034324?hl=ja",
  gaRegexEn: "https://support.google.com/analytics/answer/1034324?hl=en",
  openaiFaq: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  perplexityBots: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  siteKit: "https://wordpress.org/plugins/google-site-kit/",
};

const REGEX = "chatgpt\\.com|chat\\.openai\\.com|(www\\.)?perplexity\\.ai|claude\\.ai|gemini\\.google\\.com|copilot\\.microsoft\\.com|copilot\\.com|chat\\.deepseek\\.com|grok\\.com";

export default {
  slug: "ai-traffic-google-analytics",
  targetQueries: [
    "how to track AI traffic in GA4",
    "ChatGPT referral traffic Google Analytics",
    "GA4 AI assistant channel",
    "GA4 AI 流入 確認方法",
    "ChatGPT 流入 GA4",
    "Perplexity 参照元 GA4",
  ],
  related: ["measure-ai-visibility", "appear-in-chatgpt", "aeo-tools-comparison", "llms-txt", "aeo-wordpress"],
  locales: {
    ja: {
      title: "GA4でAIからの流入を見る方法：ChatGPT・Perplexityの見分け方 | Nurevo",
      description: "ChatGPTやPerplexityなどAIからの訪問をGA4で見る手順。標準の「AI アシスタント」チャネル、取りこぼしを拾うカスタムチャネルグループの正規表現、Directに埋もれる訪問、GA4では見えないものまで。",
      h1: "GA4でAIからの流入を見る方法：ChatGPT・Perplexityからの訪問の見分け方と、見えないもの",
      lead: "GA4では、まず「集客」＞「トラフィック獲得」の「AI アシスタント」チャネルを見ます。Googleはこのチャネルを、ChatGPT・Gemini・DeepSeek・Copilot・Grokなどから来た訪問としています。ここに入らないAI（Perplexityなど）は参照元の列で確かめ、必要ならAIサービスのドメインを並べたカスタムチャネルグループを作ると、過去の期間も含めて一つの行で追えます。ただし、GoogleのAIによる概要・AIモードからの訪問は「オーガニック検索」に入り、参照元を伝えない訪問は「ダイレクト」に入るため、GA4だけでAIの影響をすべて数えることはできません。",
      intro: [
        "作成日：2026年11月10日。Google アナリティクスのヘルプ、OpenAI・Perplexityの公式ドキュメントで、同日に確認した内容です。画面の名前や仕様は変わることがあるため、最新のヘルプもあわせてご確認ください。",
        "この記事で扱うのは「AIの回答からリンクをクリックしてサイトに来た訪問」です。AIの回答の中で名前が出たか、サイトが出典に使われたか（登場率）は、クリックされなければGA4には残りません。そちらの測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。なお、AIの回答は日や回によって変わり、どんな対策をしてもAIからの訪問が必ず増えるわけではありません。",
      ],
      sections: [
        {
          heading: "AIからの訪問は、GA4のどこに入るか",
          paragraphs: [
            "同じ「AIから来た人」でも、来かたによってGA4での入り先が変わります。最初にこの違いを知っておくと、数字の読み間違いを防げます。",
          ],
          table: {
            head: ["来かた", "GA4での入り先", "見分け方"],
            rows: [
              ["ChatGPT・Gemini・Copilot・DeepSeek・Grokの回答のリンクを、ブラウザでクリック", `「AI アシスタント」チャネル。Googleはこのチャネルの例としてこれらのサービスを挙げています（[Google アナリティクス ヘルプ：デフォルト チャネル グループ](${SRC.gaChannelsJa})）`, "トラフィック獲得レポートの「AI アシスタント」の行"],
              ["Perplexity・Claudeなど、Googleの例に名前がないAIからのクリック", "「AI アシスタント」に入るとは限らず、「参照（Referral）」に入ることがあります", "ディメンションを「セッションの参照元」に切り替えて、ドメイン（perplexity.ai など）で探す"],
              ["GoogleのAIによる概要（AI Overviews）・AIモードのリンク", `「オーガニック検索」。Googleは、AI アシスタントからは除き、オーガニック検索に含めると明記しています（[同ヘルプ](${SRC.gaChannelsJa})）`, "GA4では通常の検索と分けられません。Search Consoleを使います（後の章）"],
              ["アプリ内で開いた、URLをコピーして貼った、ブラウザが参照元を送らなかった", `参照元もキャンペーンの情報もなければ「ダイレクト」。Googleの定義では、参照元が「(direct)」の訪問がダイレクトです（[同ヘルプ](${SRC.gaChannelsJa})）`, "GA4では普通のダイレクトと区別できません。問い合わせフォームの「何で知りましたか」などで補います"],
              ["AIのクローラ（OAI-SearchBot、ChatGPT-User、PerplexityBot など）がページを読みに来た", "GA4の計測はページに入れたタグ（JavaScript）が訪問者のブラウザで動くことで記録されるため、ページを取得するだけのクローラは基本的に現れません", "サーバーのアクセスログで、ユーザーエージェント名を見る"],
            ],
            caption: "AI アシスタント チャネルに入るサービスの範囲は、Googleのヘルプでは「〜など」と例で書かれています。PerplexityやClaudeがどちらに入っているかは、自社のレポートの参照元の列で確かめてください。",
          },
          after: [
            `ChatGPTについては、OpenAIが「ChatGPTの検索結果からのリンクには utm_source=chatgpt.com を自動で付ける」としています（[OpenAI：パブリッシャー・開発者向けFAQ](${SRC.openaiFaq})）。そのため、ブラウザが参照元を送らない場合でも、このパラメータが残っていれば参照元は chatgpt.com として記録されます。URLをコピーしたときにパラメータが消えていれば、ダイレクトになります。`,
          ],
        },
        {
          heading: "手順1：GA4がサイトに正しく入っているか確認する（WordPressの場合）",
          list: [
            `WordPressなら、Google公式のプラグイン「Site Kit by Google」でGA4をつなぐのがわかりやすい方法です（[WordPress.org：Site Kit by Google](${SRC.siteKit})）。テーマの設定欄や別のプラグインですでにタグを入れている場合は、どちらか一方にします。二重に入っていると、訪問が二重に数えられます。`,
            "GA4の「レポート」＞「リアルタイム」を開いたまま、自分のスマホでサイトを開き、訪問が表示されることを確認します。",
            "キャッシュ系のプラグインやCDNを使っている場合は、変更後にキャッシュを消してから確認します。",
          ],
        },
        {
          heading: "手順2：標準の「AI アシスタント」チャネルを見る",
          list: [
            "GA4の「レポート」＞「集客」＞「トラフィック獲得」を開きます。",
            "表の最初の列が「セッションのデフォルト チャネル グループ」になっていることを確認し、「AI アシスタント」の行を探します。行がない場合は、その期間にこのチャネルに入った訪問がなかったということです。",
            "表の上の「＋」から、2つ目のディメンションに「セッションの参照元」を足すと、AI アシスタントの中身（chatgpt.com、gemini.google.com など）がわかります。",
            "続けて、最初の列を「セッションの参照元」に切り替え、検索窓に perplexity や claude と入れて、AI アシスタント以外の行に入っているAIがないかを見ます。",
          ],
        },
        {
          heading: "手順3：取りこぼしを拾うカスタムチャネルグループを作る",
          paragraphs: [
            `標準のチャネルに入らないAIがある、または過去の期間とも比べたい場合は、自分でチャネルグループを作ります。Googleのヘルプによると、カスタムチャネルグループは過去のデータにもさかのぼって適用できます（[Google アナリティクス ヘルプ：カスタム チャネル グループ](${SRC.gaCustomJa})）。`,
          ],
          list: [
            "「管理」＞「データの表示」＞「チャネルグループ」を開きます。",
            "「デフォルト チャネル グループ」の「コピーして新規作成」を選びます。ゼロから作るより、既存のチャネルがそのまま残るので安全です。",
            "グループ名を「AIを分けたチャネル」などにし、「新しいチャネルを追加」でチャネル名を「AI（すべて）」とします。",
            "条件に「参照元」「正規表現に一致」を選び、次の章の正規表現を貼り付けます。",
            "「並べ替え」で、このチャネルを「オーガニック検索」「参照」より上に移します。Googleのヘルプにあるとおり、訪問は上から順に見て最初に条件が合ったチャネルに入るため、下に置くと参照などに先に取られます。",
            "保存したら、トラフィック獲得レポートの最初の列の切り替えから、作ったグループを選びます。",
          ],
          after: [
            "カスタムチャネルグループは、通常のGA4プロパティでは2つまで（GA4 360では5つまで）、1つのグループにチャネルは50個までです。また、BigQueryへのエクスポートには含まれません（いずれも同ヘルプ）。",
          ],
        },
        {
          heading: "そのまま使える正規表現と、書くときの注意",
          paragraphs: [
            "参照元の条件に、次の正規表現を使えます（2026年11月時点で主なAIサービスのドメインを並べたもの）。",
            REGEX,
            `GA4の正規表現は、何も付けなければ「完全一致」で判定されます（[Google アナリティクス ヘルプ：正規表現](${SRC.gaRegexJa})）。そのため上の書き方では、chatgpt.com そのものには一致し、chatgpt.com を一部に含む別のドメインには一致しません。`,
          ],
          list: [
            "貼る前に、自社のレポートで実際に出ている参照元の値を見て、足りないドメインがあれば | で区切って足します。AIサービスのドメインは変わることがあります。",
            "openai.com は入れていません。開発者向けのドキュメントなど、AIの回答以外から来た訪問も混ざるためです。",
            "「ai を含む」「gpt を含む」のような広い書き方は、AIと関係ないサイトからの訪問まで拾うことがあるので、ドメインを並べる書き方をおすすめします。",
            "ドットは \\. と書きます。ただの . は「どの1文字でもよい」という意味になります。",
          ],
        },
        {
          heading: "手順4：AIから来た人が、どのページで何をしたかを見る",
          paragraphs: [
            "AIからの訪問は、件数よりも「どのページに着いたか」「問い合わせや予約につながったか」を見ると、サイトのどこがAIに使われているかがわかります。",
          ],
          list: [
            "「探索」＞「自由形式」を開き、ディメンションに「セッションの参照元」「ランディング ページ」、指標に「セッション」「キーイベント」を入れます。",
            "フィルタで「セッションの参照元」「正規表現に一致」に上の正規表現を入れると、AIからの訪問だけになります。",
            "着地が多いページは、AIがあなたのサイトのどこを回答に使っているかの手がかりです。そのページの事実（料金、営業時間、対応地域など）が最新か、まず確認しましょう。",
            "問い合わせ・予約・購入をキーイベントに設定していない場合は、先に設定します。設定前の期間の数は後から出せません。",
          ],
        },
        {
          heading: "毎月の記録表の例",
          table: {
            head: ["記録する数字", "見るところ", "読み方の注意"],
            rows: [
              ["AIからのセッション数", "カスタムチャネルグループの「AI（すべて）」の行", "数が少ない月は、数件の増減を「傾向」と読まない"],
              ["AIの内訳", "AIの行 × セッションの参照元", "サービスごとに分けて見る。合計だけだと何が動いたかわからない"],
              ["全体に占める割合", "AIのセッション ÷ 全セッション", "全体の訪問が減った月は、割合だけ上がって見えることがある"],
              ["着地ページの上位", "探索の「ランディング ページ」", "毎月の顔ぶれの変化を見る"],
              ["AIからのキーイベント", "探索の「キーイベント」", "問い合わせフォームの「何で知りましたか」の回答とも突き合わせる"],
              ["Googleの検索全体の動き", "Search Console の検索パフォーマンス", "AIによる概要・AIモードはGA4のAIの行には入らない"],
            ],
          },
        },
        {
          heading: "GA4で見えないものと、ほかの道具の分担",
          table: {
            head: ["道具", "わかること", "わからないこと"],
            rows: [
              ["GA4（標準の AI アシスタント）", "設定なしで、主なAIからのクリックを一つの行で見られる", "Googleの例にないAIの一部、AIによる概要・AIモード、参照元のない訪問"],
              ["GA4（カスタムチャネルグループ）", "自分で決めたAIの範囲で、過去の期間も含めて一つの行で見られる", "参照元のない訪問。ドメインの追加は自分で行う"],
              ["Search Console", `GoogleのAI機能（AIによる概要・AIモード）に表示されたサイトも、検索パフォーマンスの「ウェブ」の数字に含まれます（[Google：AI機能とウェブサイト](${SRC.googleAi})）`, "ChatGPTやPerplexityなど、Google以外のAI"],
              ["サーバーのアクセスログ", `AI検索のクローラが読みに来ているか。OpenAIは OAI-SearchBot と ChatGPT-User（[OpenAI：クローラ](${SRC.openaiBots})）、Perplexityは PerplexityBot と Perplexity-User（[Perplexity：クローラ](${SRC.perplexityBots})）を公開しています`, "読まれたことと、回答に出たこと・クリックされたことは別"],
              ["登場率の計測", "AIの回答に名前が出たか、サイトが出典になったか（クリックされなくても）", `クリック後の行動。[AIでの登場率の測り方](/guide/measure-ai-visibility)`],
            ],
          },
          after: [
            "AIの回答は、リンクをクリックされないまま読み終えられることも多い形式です。GA4のAIの行が少なくても、AIの回答に出ていないとは限りませんし、逆にAIの行が増えたことだけで「AIでの評価が上がった」とも言えません。クリック（GA4）と登場（回答の記録）を分けて追うのが確実です。",
          ],
        },
        {
          heading: "AIからの訪問が0のとき、先に確認すること",
          list: [
            "AI検索のクローラを robots.txt で止めていないか。止めていると、AIはページを読んで出典にすることができません。セキュリティ系のプラグインやCDNのボット対策が、意図せず止めていることもあります。",
            "期間が短すぎないか。小さなサイトでは、AIからの訪問は月に数件ということも普通です。3か月程度の期間で見ます。",
            "参照元の列で、AIのドメインが「参照」やほかのチャネルに入っていないか。",
            "GA4のタグが全ページに入っているか（手順1）。",
          ],
          after: [
            "参考までに、WordPressプラグインのNurevo AEOは、AI検索のクローラ（OAI-SearchBot、ChatGPT-User、Claude-SearchBot、Claude-User、PerplexityBot、Perplexity-User）にページを読ませるrobots.txtのルール、構造化データ、llms.txtをサーバー側で出力します。Nurevo AEOは公開ページに外部のスクリプトを加えず、訪問者のデータも送らないため、訪問数の計測はGA4などのアクセス解析で行います。AIの回答に名前が出ているかは、接続したFree・Standardのサイトなら、業種と地域から作った3つの質問を月1回Perplexityに聞く無料のAIチェックで確認でき、決めた質問を継続して測る計測はPro（月14,800円〜、現在はPerplexityで計測）にあります。",
          ],
        },
      ],
      faqs: [
        { q: "GA4に「AI アシスタント」の行が出てきません。設定が必要ですか？", a: "標準のチャネルなので設定は不要です。行がないのは、その期間にこのチャネルに入った訪問がなかったためです。参照元の列でAIのドメインがほかのチャネルに入っていないかも確認してください。" },
        { q: "Perplexityからの訪問はどこに入りますか？", a: "Googleのヘルプでは、AI アシスタント チャネルの例にPerplexityの名前はありません。「参照」に入っていることもあるため、セッションの参照元で perplexity.ai を探すか、カスタムチャネルグループで確実にAIの行にまとめてください。" },
        { q: "GoogleのAIによる概要（AI Overviews）からの訪問だけを数えられますか？", a: "GA4ではできません。Googleは、AIによる概要とAIモードからの訪問をオーガニック検索に含めるとしています。GoogleのAI機能での表示は、Search Consoleの検索パフォーマンスで、通常の検索とあわせて見ることになります。" },
        { q: "ChatGPTのアプリから来た人は数えられますか？", a: "ChatGPTの検索結果のリンクには utm_source=chatgpt.com が付くとOpenAIは説明しているので、それが残っていれば chatgpt.com として数えられます。参照元もパラメータも残らない開き方では、GA4ではダイレクトになり、区別できません。" },
        { q: "カスタムチャネルグループを作ると、元のレポートが変わってしまいますか？", a: "変わりません。デフォルト チャネル グループはそのまま残り、作ったグループはレポートの切り替えで選んだときだけ使われます。過去の期間にもさかのぼって適用できます。" },
        { q: "AIからの訪問を増やす方法はありますか？", a: "保証できる方法はありません。できるのは、AI検索のクローラがページを読める状態にし、料金・営業時間・対応地域などの事実をはっきり書き、構造化データやllms.txtで伝わりやすくすることです。そのうえで、GA4のAIの行と登場率を分けて、毎月同じ方法で記録していきます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIがあなたのサイトを読める状態か、まず確認",
        body: "登録不要の無料チェックで、構造化データ、llms.txt、AI検索のクローラへの対応など、AIが読む情報の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手（無料）", href: WP_ORG },
      },
      footnote: "Google、Google アナリティクス、Search Console、Gemini、Site Kit、ChatGPT、OpenAI、Perplexity、Claude、Anthropic、Microsoft Copilot、DeepSeek、Grok、WordPressおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "How to See AI Traffic in GA4: ChatGPT, Perplexity and More | Nurevo",
      description: "How to see visits from ChatGPT, Perplexity and other AI in GA4: the built-in AI Assistant channel, a custom channel group regex, Direct visits, and what GA4 cannot see.",
      h1: "How to see AI traffic in GA4: telling ChatGPT and Perplexity visits apart, and what stays hidden",
      lead: "In GA4, start with the AI Assistant channel under Reports > Acquisition > Traffic acquisition. Google describes it as visits from sources like ChatGPT, Gemini, DeepSeek, Copilot and Grok. For AI platforms that do not land there, such as Perplexity in some properties, check the source column, and if you need one clean row that also covers past dates, build a custom channel group that lists AI domains. Even then, GA4 cannot count everything: Google puts visits from AI Overviews and AI Mode in Organic Search, and visits that arrive without a referrer end up in Direct.",
      intro: [
        "Written November 10, 2026. Checked that day against the Google Analytics help center and OpenAI's and Perplexity's own documentation. Screen names and rules can change, so check the current help pages too.",
        "This guide is about visits: people who clicked a link in an AI answer and came to your site. Whether an AI named you or cited your site (your appearance rate) never reaches GA4 unless someone clicks. That is covered in [how to measure AI visibility](/guide/measure-ai-visibility). AI answers vary from day to day, and nothing you do can guarantee more visits from AI.",
      ],
      sections: [
        {
          heading: "Where AI visits land in GA4",
          paragraphs: [
            "Two people who both \"came from AI\" can end up in different places in GA4, depending on how they arrived. Knowing the difference first saves you from misreading the numbers.",
          ],
          table: {
            head: ["How the visitor arrived", "Where GA4 puts it", "How to find it"],
            rows: [
              ["Clicked a link in a ChatGPT, Gemini, Copilot, DeepSeek or Grok answer in a browser", `The AI Assistant channel. Google gives these services as examples of it ([Google Analytics Help: default channel group](${SRC.gaChannelsEn}))`, "The AI Assistant row in the Traffic acquisition report"],
              ["Clicked a link from an AI not named in Google's examples, such as Perplexity or Claude", "Not necessarily AI Assistant; it can land in Referral", "Switch the dimension to Session source and search for the domain, e.g. perplexity.ai"],
              ["Clicked a link in Google's AI Overviews or AI Mode", `Organic Search. Google states that these are excluded from AI Assistant and included in Organic Search ([same help page](${SRC.gaChannelsEn}))`, "GA4 cannot separate them from ordinary search. Use Search Console (see below)"],
              ["Opened inside an app, pasted a copied URL, or used a browser that sent no referrer", `With no referrer and no campaign data, Direct. Google defines Direct as visits whose source is "(direct)" ([same help page](${SRC.gaChannelsEn}))`, "Indistinguishable from other Direct visits in GA4. Add a \"How did you hear about us?\" field to your forms"],
              ["An AI crawler (OAI-SearchBot, ChatGPT-User, PerplexityBot and so on) fetched a page", "GA4 records a visit when its tag (JavaScript) runs in the visitor's browser, so crawlers that only fetch the page generally do not appear", "Server access logs, by user agent"],
            ],
            caption: "Google's help page lists the services in the AI Assistant channel as examples (\"sources like\"). Check your own report's source column to see where Perplexity and Claude visits land for you.",
          },
          after: [
            `For ChatGPT, OpenAI says it automatically adds utm_source=chatgpt.com to links from ChatGPT search results ([OpenAI: publishers and developers FAQ](${SRC.openaiFaq})). So even when the browser sends no referrer, the source is recorded as chatgpt.com as long as that parameter survives. If someone copies the URL and the parameter is lost, the visit becomes Direct.`,
          ],
        },
        {
          heading: "Step 1: make sure GA4 is installed correctly (on WordPress)",
          list: [
            `On WordPress, Google's own plugin, Site Kit by Google, is a simple way to connect GA4 ([WordPress.org: Site Kit by Google](${SRC.siteKit})). If your theme settings or another plugin already add the tag, keep only one. With two tags, every visit is counted twice.`,
            "Open Reports > Realtime in GA4, visit your site on your phone, and check that the visit appears.",
            "If you use a caching plugin or a CDN, clear the cache after any change before you check.",
          ],
        },
        {
          heading: "Step 2: look at the built-in AI Assistant channel",
          list: [
            "In GA4, open Reports > Acquisition > Traffic acquisition.",
            "Check that the first column is Session default channel group, and look for the AI Assistant row. If there is no row, no visits landed in that channel during the period.",
            "Use the + above the table to add Session source as a secondary dimension. That shows what is inside AI Assistant (chatgpt.com, gemini.google.com and so on).",
            "Then switch the first column to Session source and type perplexity or claude in the search box to see whether any AI traffic sits outside the AI Assistant row.",
          ],
        },
        {
          heading: "Step 3: build a custom channel group to catch what the default misses",
          paragraphs: [
            `If some AI traffic lands outside the built-in channel, or you want to compare with earlier periods, build your own channel group. According to Google, custom channel groups can be applied to your reports retroactively ([Google Analytics Help: custom channel groups](${SRC.gaCustomEn})).`,
          ],
          list: [
            "Go to Admin > Data display > Channel groups.",
            "On the Default channel group, choose Copy to create new. Starting from a copy keeps all the existing channels, which is safer than starting from scratch.",
            "Name the group something like \"Channels with AI split out\", click Add new channel and call the channel \"AI (all)\".",
            "Set the condition to Source, matches regex, and paste the pattern from the next section.",
            "Use Reorder to move this channel above Organic Search and Referral. As Google's help explains, traffic goes into the first channel whose definition it matches, top to bottom, so a channel placed lower loses visits to Referral and others.",
            "After saving, pick your new group from the first-column selector in the Traffic acquisition report.",
          ],
          after: [
            "A standard GA4 property can have 2 custom channel groups (5 on GA4 360), each with up to 50 channels. Custom channel groups are not included in the BigQuery export (all from the same help page).",
          ],
        },
        {
          heading: "A ready-to-use regex, and what to watch when writing your own",
          paragraphs: [
            "You can use this pattern in the source condition. It lists the main AI service domains as of November 2026.",
            REGEX,
            `GA4 regular expressions are full match by default ([Google Analytics Help: regular expressions](${SRC.gaRegexEn})). Written as above, the pattern matches chatgpt.com itself but not some other domain that merely contains chatgpt.com.`,
          ],
          list: [
            "Before you paste it, look at the source values that actually appear in your report and add any missing domains, separated by |. AI service domains do change.",
            "openai.com is deliberately left out. Visits from its developer documentation and other pages that are not AI answers would mix in.",
            "Broad patterns such as \"contains ai\" or \"contains gpt\" can catch sites that have nothing to do with AI. Listing domains is safer.",
            "Write a dot as \\. because a bare . means \"any single character\".",
          ],
        },
        {
          heading: "Step 4: see which pages AI visitors land on, and what they do",
          paragraphs: [
            "With AI traffic, where people land and whether they go on to contact or book you tells you more than the visit count. It shows which parts of your site AI is using.",
          ],
          list: [
            "Open Explore > Free form. Add Session source and Landing page as dimensions, and Sessions and Key events as metrics.",
            "Add a filter: Session source, matches regex, with the pattern above. Now only AI visits remain.",
            "The pages with the most landings are a clue to what AI takes from your site. Check first that the facts on them, such as prices, opening hours and service area, are current.",
            "If enquiries, bookings or purchases are not set up as key events yet, set them up now. Counts for the period before they were set up cannot be produced later.",
          ],
        },
        {
          heading: "An example monthly log",
          table: {
            head: ["What to record", "Where to find it", "How to read it"],
            rows: [
              ["Sessions from AI", "The \"AI (all)\" row in your custom channel group", "In months with few visits, do not read a change of a few sessions as a trend"],
              ["Breakdown by AI service", "AI row × Session source", "Look at each service separately; the total alone hides what moved"],
              ["Share of all sessions", "AI sessions ÷ all sessions", "When total traffic falls, the share can rise without any real change"],
              ["Top landing pages", "Landing page in your exploration", "Watch how the list changes month to month"],
              ["Key events from AI", "Key events in your exploration", "Cross-check against answers to \"How did you hear about us?\" on your forms"],
              ["Google search overall", "Search Console performance report", "AI Overviews and AI Mode are not in GA4's AI rows"],
            ],
          },
        },
        {
          heading: "What GA4 cannot see, and which tool covers it",
          table: {
            head: ["Tool", "What it tells you", "What it does not"],
            rows: [
              ["GA4 (built-in AI Assistant)", "Clicks from the main AI services in one row, with no setup", "Some AI services outside Google's examples, AI Overviews and AI Mode, and visits without a referrer"],
              ["GA4 (custom channel group)", "The AI services you choose, in one row, including past periods", "Visits without a referrer. You add new domains yourself"],
              ["Search Console", `Sites shown in Google's AI features (AI Overviews, AI Mode) are counted in the Performance report under the "Web" search type ([Google: AI features and your website](${SRC.googleAi}))`, "AI platforms other than Google's, such as ChatGPT or Perplexity"],
              ["Server access logs", `Whether AI search crawlers read your pages. OpenAI documents OAI-SearchBot and ChatGPT-User ([OpenAI: crawlers](${SRC.openaiBots})); Perplexity documents PerplexityBot and Perplexity-User ([Perplexity: crawlers](${SRC.perplexityBots}))`, "Being read is not the same as appearing in an answer or being clicked"],
              ["Appearance measurement", "Whether an AI named you or cited your site, even when nobody clicked", "What people did after clicking. See [how to measure AI visibility](/guide/measure-ai-visibility)"],
            ],
          },
          after: [
            "AI answers are often read to the end without anyone clicking a link. A small AI row in GA4 does not mean you are absent from AI answers, and a growing AI row alone does not prove that AI rates you more highly. Tracking clicks (GA4) and appearances (a record of answers) separately is the reliable approach.",
          ],
        },
        {
          heading: "If you see zero AI visits, check these first",
          list: [
            "Is robots.txt blocking AI search crawlers? If it is, AI cannot read your pages or cite them. Security plugins and CDN bot protection sometimes block them without you meaning to.",
            "Is the period too short? Small sites often get only a handful of AI visits a month. Look at around three months.",
            "Is AI traffic sitting in Referral or another channel? Check the source column.",
            "Is the GA4 tag on every page (Step 1)?",
          ],
          after: [
            "For reference: the Nurevo AEO WordPress plugin outputs, from your own server, robots.txt rules that let AI search crawlers read your pages (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User), structured data and llms.txt. Nurevo AEO adds no third-party script to your public pages and sends no visitor data, so visits are measured in GA4 or another analytics tool. To see whether AI names you, connected Free and Standard sites get a free AI check that asks Perplexity three questions built from your business type and area once a month; ongoing measurement of a fixed question set is part of Pro (from $99/month, currently measured on Perplexity).",
          ],
        },
      ],
      faqs: [
        { q: "There is no AI Assistant row in my GA4. Do I need to set something up?", a: "No. It is a built-in channel. If the row is missing, no visits landed in it during the period. Also check the source column for AI domains sitting in other channels." },
        { q: "Where do Perplexity visits go?", a: "Perplexity is not among the examples Google gives for the AI Assistant channel, and its visits can land in Referral. Look for perplexity.ai under Session source, or use a custom channel group to collect it in your AI row." },
        { q: "Can I count visits from Google's AI Overviews on their own?", a: "Not in GA4. Google includes visits from AI Overviews and AI Mode in Organic Search. Appearances in Google's AI features are counted together with ordinary search in the Search Console performance report." },
        { q: "Can I count people who came from the ChatGPT app?", a: "OpenAI says links from ChatGPT search results carry utm_source=chatgpt.com, so if that survives, the visit is counted as chatgpt.com. If neither a referrer nor the parameter survives, GA4 records the visit as Direct and it cannot be told apart." },
        { q: "Will a custom channel group change my existing reports?", a: "No. The default channel group stays as it is; your group is only used when you select it in a report. It can also be applied to past periods." },
        { q: "Is there a way to get more visits from AI?", a: "No method can guarantee it. What you can do is let AI search crawlers read your pages, state facts such as prices, hours and service area clearly, and make them easy to pick up with structured data and llms.txt. Then record GA4's AI rows and your appearance rate separately, the same way every month." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check that AI can read your site",
        body: "The free check shows the state of what AI reads, such as structured data, llms.txt and AI search crawler access, with no sign-up. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO free on WordPress.org", href: WP_ORG },
      },
      footnote: "Google, Google Analytics, Search Console, Gemini, Site Kit, ChatGPT, OpenAI, Perplexity, Claude, Anthropic, Microsoft Copilot, DeepSeek, Grok, WordPress and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
