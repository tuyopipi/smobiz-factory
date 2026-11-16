// Content page: for web agencies / SEO firms / WordPress care companies - what
// to do with the AI search (AEO/GEO) work when a client contract ends or the
// site is handed to the client or to another agency: keep or stop the
// AI-facing output, hand over settings and records, close accounts and
// reports, and verify the site afterwards.
//
// Written 2026-11-16 (JST). Product facts come from the plugin readme
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt, 0.9.2),
// the plugin source and the partner page (public/partner/index.html):
// - Free output (JSON-LD, /llms.txt, AI crawler rules) is rendered on the
//   site's own server and needs no key or connection; llms.txt works with no
//   network access.
// - With Yoast / Rank Math / AIOSEO / Slim SEO, Nurevo adds missing facts
//   (address, phone, hours, specific type, FAQ, services) inside their graph.
// - robots.txt lines are added through WordPress's `robots_txt` filter
//   (nurevo-webmcp.php), i.e. the virtual robots.txt WordPress generates.
// - Settings > Tools / `wp nurevo export --file=` exports the keys in
//   webmcp_canary_exportable_setting_keys() plus faq and services; keys,
//   tokens, plan and connection are never exported and a file containing them
//   is refused. Per-page meta (_nurevo_exclude_llms, _nurevo_exclude_schema,
//   _nurevo_faq) is NOT in the export (webmcp_canary_export_settings()).
// - uninstall.php deletes every webmcp_canary_ option and the three per-page
//   meta keys on every site of a network.
// - Standard -> Free: the plugin keeps using the ruleset it shipped with;
//   existing output does not stop working or degrade. Pro measurement is a
//   beta (Perplexity). Free AI check: connected Free/Standard sites, monthly,
//   three questions without the business name.
// - Partner page: branded monthly reports (sent after the recipient consents;
//   printable to PDF), multi-site dashboard, Standard payment links; paid plans
//   only with the client's own consent; pairing codes are not carried by the
//   settings file.
// - Terms (public/terms.html, article 5): users can cancel at any time; the
//   cancellation takes effect at the end of the billing period and that
//   period's fee is not refunded.
// Outside facts:
// - Google "Do you need an SEO?" (ja last updated 2026-06-10), read
//   2026-11-15 for agency-aeo-first-audit-proposal: suggests asking whether
//   the SEO will share all changes they make to the site.
// Not stated on purpose: Search Console / GA4 / Business Profile role names,
// waiting periods and transfer steps (support.google.com could not be read in
// this run), ICANN transfer rules, market prices for handover work.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const TERMS = "https://nurevo.jp/terms";
const SRC = {
  hireEn: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo",
  hireJa: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo?hl=ja",
  richResults: "https://search.google.com/test/rich-results",
};

const CLI = `# 1. Settings, FAQ and services (no keys, tokens or plan)
wp nurevo export --file=nurevo-handover.json

# 2. Per-page settings are not in that file: list them
wp post list --post_type=any --meta_key=_nurevo_exclude_llms --fields=ID,post_title,post_type
wp post list --post_type=any --meta_key=_nurevo_exclude_schema --fields=ID,post_title,post_type
wp post list --post_type=any --meta_key=_nurevo_faq --fields=ID,post_title,post_type

# 3. What the site publishes right now (schema / llms.txt / AI crawler rules)
wp nurevo status`;

export default {
  slug: "agency-aeo-client-handover",
  targetQueries: [
    "AI検索対策 解約 引き継ぎ",
    "制作会社 解約 引き継ぎ 構造化データ llms.txt",
    "SEO 業者 乗り換え AI検索対策",
    "AEO client offboarding agency",
    "hand over SEO work to client checklist schema",
    "agency handover llms.txt structured data",
  ],
  related: ["agency-aeo-monthly-service", "agency-aeo-first-audit-proposal", "local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt"],
  locales: {
    ja: {
      title: "AI検索対策の解約・引き継ぎの手順：制作会社向け | Nurevo",
      description: "制作会社がAI検索対策（AEO・GEO）の契約を終えるとき、サイトを引き継ぐときの手順。構造化データ・llms.txt・robots.txtを残すか止めるか、渡す資料、止めるアカウントと報告、引き継ぎ後の確かめ方。",
      h1: "AI検索対策の契約を終える・引き継ぐときの手順：制作会社がお客様に渡すもの、止めるもの",
      lead: "AI検索対策の契約を終えるときは、①AI向けの出力（構造化データ・llms.txt・robots.txtの記述）を残すか止めるかをお客様と決め、②設定・ページごとの設定・自作のコード・計測の記録を渡し、③自社のアカウント・報告・支払いの関わりを外し、④最後に公開中のサイトで出力を確かめる、の順で進めます。ドメインやサーバーの引き継ぎの記事は多いのですが、AI向けの出力はプラグインやコードの中にあり、止め方を間違えると、会社の住所や営業時間が構造化データから黙って消えます。",
      intro: [
        "作成日：2026年11月16日（JST）。対象は、お客様のサイトでAI検索対策（AEO・GEO・LLMOとも呼ばれます）をしてきた制作会社・SEO会社・MEO会社・WordPress保守会社です。始め方は[初回診断と提案書の作り方](/guide/agency-aeo-first-audit-proposal)、続け方は[AI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)で扱っています。この記事はその終わり方です。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、引き継ぎで事実が消えたり食い違ったりしないようにするためのもので、引き継ぎ後もAIの回答に表示されることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれている引き継ぎの記事に書かれていないこと",
          paragraphs: [
            "「制作会社 乗り換え」「client offboarding checklist」で上位に出る日本語と英語の記事を12本読みました。ドメインの名義、サーバーの契約者、WordPressの管理者アカウント、ソースコードの著作権、引き継ぎのメールの書き方は、どの記事も丁寧に扱っています。一方で、AI検索に関わる次の項目は、ほとんど書かれていませんでした。",
          ],
          table: {
            head: ["抜けていた項目", "引き継ぎで起きること"],
            rows: [
              ["構造化データ（JSON-LD）を誰が出しているか", "プラグインを外すと、SEOプラグインの構造化データに足していた住所・電話・営業時間だけが消える。表示は何も変わらないので気づかれにくい"],
              ["/llms.txt", "プラグインが返していた場合、止めると返らなくなる。手で置いたファイルなら、中身が古いまま残る"],
              ["robots.txtのAI向けの記述", "AI検索のクローラを許可する行や、学習用クローラの扱いが、誰の判断で入ったのか分からなくなる"],
              ["ページごとの設定", "「このページをllms.txtに載せない」やページ専用のFAQは、全体の設定とは別に保存されていることが多く、書き出しから漏れる"],
              ["計測の記録", "毎月AIに聞いた質問と結果が制作会社の手元にしかなく、次の担当が同じ条件で比べられない"],
              ["自社ブランドの月次レポート", "契約が終わった後も、自動送信が止まらずに届き続ける"],
            ],
            caption: "2026年11月16日に読んだ記事での傾向です。記事ごとの良し悪しではなく、AI検索の項目が抜けやすいという点だけを挙げています。",
          },
          after: [
            `Googleの「SEO 業者の利用を検討する」は、業者を選ぶときの質問として、サイトに加えた変更をすべて共有するかを尋ねるよう勧めています（[Google 検索セントラル](${SRC.hireJa})）。引き継ぎの資料は、その約束を最後に果たす場でもあります。`,
          ],
        },
        {
          heading: "最初に決めること：AI向けの出力を「残す」「止める」「移す」",
          paragraphs: [
            "解約の連絡を受けたら、まず次の3つのどれにするかをお客様と決めます。決めないまま制作会社のアカウントやコードを外すと、意図せず「止める」になります。",
          ],
          table: {
            head: ["選ぶもの", "向いている場合", "やること"],
            rows: [
              ["残してお客様に渡す", "お客様が自分で（または次の会社が）同じ仕組みで続ける", "プラグインはそのまま。管理者・設定・記録をお客様に渡し、自社の関わりだけを外す"],
              ["止める", "お客様がAI向けの出力を望まない、サイトを閉じる・作り直す", "出力を止めてから、プラグインやコードを外す。外す前に設定を書き出して渡す"],
              ["別の仕組みに移す", "次の会社が別のプラグインや自作のコードで出す", "今の出力の一覧を渡し、切り替えの日を決める。同じ日に旧い出力を止め、二重や空白の期間を作らない"],
            ],
          },
          after: [
            "どれを選んでも、「何が、どこから、どのページに出ているか」の一覧が先に必要です。次の節の表を引き継ぎ資料の1ページ目にします。",
          ],
        },
        {
          heading: "引き継ぎ資料の1ページ目：AI向けの出力の一覧",
          table: {
            head: ["出力", "確認する場所", "資料に書くこと"],
            rows: [
              ["会社・店舗の構造化データ", "ページのソースの application/ld+json、リッチリザルトテスト", "どのプラグイン（またはテーマ・コード）が出しているか、どの項目を誰が足しているか"],
              ["FAQ・サービスの構造化データ", "FAQを表示しているページ", "FAQを置いたページのURL、質問の数"],
              ["/llms.txt", "ブラウザで https://ドメイン/llms.txt", "自動で作っているのか、手で置いたファイルか。載せないようにしたページ"],
              ["robots.txtのAI向けの記述", "https://ドメイン/robots.txt", "許可しているAI検索のクローラ、学習用クローラの扱い（そのまま・許可・拒否）と、決めた日・決めた人"],
              ["ページごとの設定", "各ページの編集画面、WP-CLI", "構造化データやllms.txtから外したページ、ページ専用のFAQ"],
              ["自作のコード", "子テーマの functions.php、mu-plugins、自社の小さなプラグイン", "何を変えるコードか、どのファイルにあるか"],
            ],
            caption: "「誰が足しているか」が重要です。表示されないデータなので、書いておかないと次の担当には分かりません。",
          },
          after: [
            "自作のコードは見落としやすい項目です。制作会社が自社の小さなプラグインや mu-plugins に構造化データやllms.txtを変えるコードを置いている場合、そのプラグインを外すと変更も消えます。お客様に残すなら、ファイルごと渡すか、お客様の子テーマに移してから外します。",
          ],
        },
        {
          heading: "外すと何が消えるか：Nurevo AEOの場合",
          paragraphs: [
            `自社の製品（[WordPress.orgの無料プラグイン](${WP_ORG})）について、実際の動きを書いておきます。他のプラグインでも、同じ観点で確かめてください。`,
          ],
          list: [
            "無料の出力（構造化データ・llms.txt・AI検索のクローラの許可）は、お客様のサイトのサーバーでプラグインが作っています。Nurevoのサービスへの接続やキーがなくても動くので、制作会社のアカウントとの接続を外しても出力は止まりません。",
            "Yoast SEO・Rank Math・All in One SEO・Slim SEOと併用している場合、Nurevo AEOはそれらの構造化データの中に、足りない住所・電話・営業時間・業種・FAQ・サービスを足しています。プラグインを止めると、SEOプラグインの構造化データは残りますが、足していた項目はなくなります。",
            "robots.txtの記述は、WordPressが自動で作るrobots.txtに行を足す仕組みです。プラグインを止めると足していた行はなくなります。サーバーに robots.txt のファイルを直接置いているサイトでは、そのファイルの中身が使われます。",
            "/llms.txt はプラグインが返しているので、止めると返らなくなります。",
            "プラグインを削除（アンインストール）すると、設定・FAQ・サービス・診断の記録の控え、ページごとの設定まで、プラグインが保存したものがすべて消えます。マルチサイトでは全サイト分です。削除の前に、次の節の書き出しを済ませます。",
            `Standardプランをやめると、プラグインは同梱の基準で動き続けます。今の出力が止まったり悪くなったりはしません。Proをやめると、AI登場率の計測（ベータ版、現在はPerplexityが対象）の画面が使えなくなります。有料プランはいつでも解約でき、解約はその請求期間の末日に効力を生じ、その期間の料金は返金されません（[利用規約 第5条](${TERMS})）。`,
          ],
        },
        {
          heading: "渡すもの：設定・ページごとの設定・記録",
          paragraphs: [
            "Nurevo AEOでは、管理画面のNurevoのメニューの「設定 › ツール」またはWP-CLIで設定をJSONファイルに書き出せます。入るのは、出力のオン・オフ、事業の情報（名前・説明・住所・電話・営業時間・業種・URL・メール）、サイトの種類と方針ページのURL、FAQ、サービスです。キー・トークン・プラン・接続の情報は入らず、それらを含むファイルは読み込めません。",
            "ページごとの設定（llms.txtや構造化データから外したページ、ページ専用のFAQ）はこのファイルに入りません。WP-CLIで一覧を出して、資料に貼ります。",
          ],
          code: CLI,
          after: [
            "計測の記録も渡します。毎月聞いた質問、聞いた日・AI・回数、名前が出たか・サイトが引用されたか、の表です。自社ブランドの月次レポートは印刷してPDFにできるので、契約期間の分をまとめて渡すと、次の担当が同じ条件で続けられます。測り方そのものは[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            "書き出したファイルには、住所・電話・メールなどお客様の事業の情報が入ります。メールに添付して終わりにせず、お客様が受け取ったことを確かめ、自社の手元の控えは契約に沿って削除します。",
          ],
        },
        {
          heading: "止めるもの：アカウント・報告・支払い",
          table: {
            head: ["項目", "やること", "注意"],
            rows: [
              ["WordPressの管理者", "お客様の管理者アカウントがあることを確かめてから、制作会社のアカウントを削除する。投稿の書き手になっている場合は、削除時にお客様のアカウントに付け替える", "最後の管理者を消さない"],
              ["Search Console・Googleアナリティクス・Googleビジネスプロフィール", "お客様のGoogleアカウントがいちばん上の権限を持っていることを確かめてから、制作会社のアカウントを外す", "権限の名前と手順は各サービスのヘルプで確認する。Search Consoleは確認用のファイルやタグが残っていないかも見る"],
              ["Nurevoのダッシュボード", "サイトを自社のダッシュボードから外す。お客様が続けるなら、お客様のアカウントでサイトを追加し、ペアリングコードを入れ直す", "ペアリングコードは設定ファイルでは引き継がれない"],
              ["自社ブランドの月次レポート", "契約の最終月の報告を送ったら、自動送信を止める", "止め忘れると、契約後も届き続ける"],
              ["有料プランの支払い", "お客様が自分で契約している場合、続けるか解約するかはお客様が決める", "制作会社の判断だけで解約・変更しない"],
              ["AI診断ウィジェット・紹介ページ", "お客様のサイトに自社のウィジェットを置いていた場合は外す", "自社サイトに置いているものはそのままでよい"],
            ],
          },
          after: [
            `有料プランは、もともとお客様ご本人の同意を得てお客様が契約するものです（[パートナープログラム](${PARTNER})）。解約や継続も、お客様の判断として案内します。`,
          ],
        },
        {
          heading: "引き継ぎ後の確かめ方",
          paragraphs: [
            "最後に、公開中のサイトで出力を確かめ、その結果を引き継ぎ資料の最後のページに残します。作業した日と、確かめた日を分けて書きます。",
          ],
          list: [
            `トップページ・会社概要・FAQのページを[リッチリザルトテスト](${SRC.richResults})にかけ、会社・店舗の情報が1つにまとまっているか、住所・電話・営業時間が残っているか（または止めたなら消えているか）を見る。`,
            "/llms.txt と /robots.txt をブラウザで開き、選んだとおりになっているか見る。",
            "wp nurevo status で、構造化データ・llms.txt・AIクローラの記述の出力が選んだとおりか確かめる（プラグインを残す場合）。",
            "別の仕組みに移した場合は、同じ会社の情報が2つの構造化データで出ていないかを確かめる。",
            "会社名を入れた質問をいくつかAIに聞き、住所・営業時間などが引き継ぎ前と食い違っていないかを記録する（回答は変わるので、結果は記録として渡す）。",
          ],
        },
        {
          heading: "次の契約のために：最初の契約書に入れておくこと",
          list: [
            "AI向けの出力に使うプラグインやコードと、その設定はお客様のものとし、契約の終わりに書き出して渡すこと。",
            "WordPress・Search Console・Googleビジネスプロフィールなどの最上位の権限はお客様のアカウントが持ち、制作会社は追加の利用者として入ること。",
            "robots.txtで学習用クローラを許可するか拒否するかは、お客様が決めること。",
            "毎月の計測の記録は、契約の終わりにまとめて渡すこと。",
            "契約が終わったら、制作会社のアカウント・自動の報告・ウィジェットを外す日を決めておくこと。",
          ],
        },
        {
          heading: "引き継ぎのチェックリスト",
          list: [
            "残す・止める・移すのどれにするか、お客様と決めて記録した。",
            "AI向けの出力の一覧（何が・どこから・どのページに）を作った。",
            "設定を書き出し、ページごとの設定の一覧を添えた。",
            "自作のコードを、ファイルごと渡すか、お客様の側に移した。",
            "計測の記録と月次レポートのPDFを渡した。",
            "お客様が最上位の権限を持っていることを確かめてから、制作会社のアカウントを外した。",
            "月次レポートの自動送信と、お客様のサイトの自社ウィジェットを止めた。",
            "有料プランの継続・解約はお客様が決めた。",
            "公開中のサイトで構造化データ・llms.txt・robots.txtを確かめ、結果を残した。",
            "書き出したファイルの自社の控えを、契約に沿って削除した。",
          ],
        },
      ],
      faqs: [
        { q: "解約したら、お客様のサイトのAI検索対策は止まりますか？", a: "仕組みによります。Nurevo AEOの無料の出力はお客様のサイトの中で作られているので、制作会社との接続やNurevoのアカウントを外しても止まりません。プラグインを止めるか削除したときに止まります。他の仕組みでは、制作会社のサーバーやアカウントに依存していないかを確かめてください。" },
        { q: "プラグインを消すだけで片付きますか？", a: "おすすめしません。SEOプラグインに足していた住所・営業時間などが構造化データから消え、設定やページごとの設定も削除されます。先に残すか止めるかを決め、設定を書き出してから外してください。" },
        { q: "次の制作会社が別のプラグインを使う場合は？", a: "切り替えの日を決め、新しい仕組みで出し始めた日に古い出力を止めます。両方が動く期間があると、同じ会社が2つの構造化データで出ることがあります。切り替えた後にリッチリザルトテストで確かめてください。" },
        { q: "書き出した設定ファイルを別のサイトに読み込めますか？", a: "できます。読み込み先にない項目は今の値が残り、キー・トークン・プランは入っていないので接続は引き継がれません。サイトごとに違う項目（店名・住所など）を確かめてから読み込みます。" },
        { q: "robots.txtの学習用クローラの設定は、元に戻すべきですか？", a: "決まりはありません。お客様が自分で判断できるよう、今どうなっているか、いつ誰が決めたかを資料に書いて渡します。Nurevo AEOでは、学習用クローラを拒否してもAI検索やAEOスコアには影響しません。" },
        { q: "引き継ぎの後、AIでの表示が下がったら制作会社の責任ですか？", a: "AIの回答は引き継ぎと関係なく変わるため、下がったことだけで原因は決められません。引き継ぎ資料に出力の一覧と確かめた結果を残しておけば、事実が消えたのか、AIの回答が変わったのかを切り分けられます。" },
        { q: "紹介したお客様が解約したら、紹介報酬はどうなりますか？", a: "紹介報酬は、紹介したお客様が有料プランを使っている間の支払いが対象です。細かい扱いはパートナー承認時の案内に従い、分からない点はNurevoに問い合わせてください。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "引き継ぎの前と後に、AIがサイトをどう読んでいるか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。引き継ぎ資料の「確かめた結果」に使えます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: PARTNER },
      },
      footnote: "PerplexityはPerplexity AI、Google・Search Console・GoogleアナリティクスはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、WordPressはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Ending or Handing Over AEO Work: A Guide for Agencies | Nurevo",
      description: "When an AI search (AEO/GEO) contract ends: keep or stop schema, llms.txt and robots.txt rules, what agencies hand over, what to close, and how to verify.",
      h1: "Ending or handing over AI search work: what agencies give the client and what they switch off",
      lead: "When an AI search optimization contract ends, work in this order: agree with the client whether the AI-facing output (structured data, llms.txt, robots.txt rules) is kept or stopped; hand over the settings, per-page settings, your own code and the measurement records; remove your accounts, reports and billing links; and finally check the output on the live site. Plenty of guides cover domains and hosting, but AI-facing output lives inside plugins and code, and removing it the wrong way silently drops the business address and opening hours from the structured data.",
      intro: [
        "Written November 16, 2026 (JST). This is for web agencies, SEO firms, local SEO firms and WordPress care companies that have run AI search optimization (also called AEO, GEO or LLMO) on a client's site. Starting is covered in [the first audit and proposal](/guide/agency-aeo-first-audit-proposal) and running it in [offering AEO as a monthly service](/guide/agency-aeo-monthly-service). This guide is about ending it.",
        "AI answers change from day to day and with the wording of the question. These steps are there so that facts do not disappear or conflict during a handover. They do not guarantee that the business keeps appearing in AI answers afterwards.",
      ],
      sections: [
        {
          heading: "What the popular handover guides leave out",
          paragraphs: [
            "We read twelve of the Japanese and English articles that rank for queries like \"switch web agency\" and \"client offboarding checklist\". They cover domain registration, the hosting contract, WordPress admin accounts, copyright in the code and the handover email well. Almost none of them cover the AI search items below.",
          ],
          table: {
            head: ["Missing item", "What happens in a handover"],
            rows: [
              ["Who outputs the structured data (JSON-LD)", "Remove the plugin and only the address, phone and hours it added to the SEO plugin's structured data disappear. Nothing changes on screen, so nobody notices"],
              ["/llms.txt", "If a plugin served it, it stops being served. If it was a hand-placed file, it stays and goes stale"],
              ["AI rules in robots.txt", "Nobody knows who decided to allow AI search crawlers or how training crawlers are handled"],
              ["Per-page settings", "\"Leave this page out of llms.txt\" and page-specific FAQs are often stored apart from the main settings and get missed in the export"],
              ["Measurement records", "The monthly AI questions and results sit only with the agency, so the next team cannot compare like with like"],
              ["Branded monthly reports", "Automatic sending keeps going after the contract has ended"],
            ],
            caption: "Based on articles read on November 16, 2026. This is a pattern across them, not a verdict on any single article: AI search items are the ones that tend to be missed.",
          },
          after: [
            `Google's "Do you need an SEO?" page suggests that site owners ask an SEO whether they will share all the changes they make to the site ([Google Search Central](${SRC.hireEn})). The handover document is where you keep that promise one last time.`,
          ],
        },
        {
          heading: "Decide first: keep, stop or move the AI-facing output",
          paragraphs: [
            "When the client gives notice, agree on one of these three. Removing your accounts or code before deciding turns the answer into \"stop\" by accident.",
          ],
          table: {
            head: ["Choice", "When it fits", "What to do"],
            rows: [
              ["Keep and hand to the client", "The client (or the next agency) carries on with the same setup", "Leave the plugin in place. Hand over admin, settings and records, and remove only your own involvement"],
              ["Stop", "The client does not want AI-facing output, or the site is closing or being rebuilt", "Switch the output off, then remove the plugin or code. Export the settings and hand them over first"],
              ["Move to another setup", "The next agency outputs it with another plugin or its own code", "Hand over the list of current output and set a switch-over date. Turn the old output off on the same day so there is no gap and no duplicate"],
            ],
          },
          after: [
            "Whichever you choose, you first need a list of what is output, from where, on which pages. The table in the next section is page one of the handover document.",
          ],
        },
        {
          heading: "Page one of the handover document: the AI-facing output",
          table: {
            head: ["Output", "Where to check", "What to write down"],
            rows: [
              ["Business structured data", "application/ld+json in the page source, the Rich Results Test", "Which plugin (or theme or code) outputs it, and who adds which property"],
              ["FAQ and service structured data", "The pages that show the FAQ", "URLs of the FAQ pages and the number of questions"],
              ["/llms.txt", "https://yourdomain/llms.txt in a browser", "Generated or hand-placed, and which pages were left out"],
              ["AI rules in robots.txt", "https://yourdomain/robots.txt", "Which AI search crawlers are allowed, how training crawlers are handled (default, allow, block), and when and by whom that was decided"],
              ["Per-page settings", "Each page's editor, WP-CLI", "Pages left out of structured data or llms.txt, page-specific FAQs"],
              ["Your own code", "The child theme's functions.php, mu-plugins, your agency's small plugin", "What each piece changes and which file it is in"],
            ],
            caption: "\"Who adds it\" matters most. This data is invisible on the page, so unless you write it down the next team cannot know.",
          },
          after: [
            "Your own code is the easiest item to miss. If your agency keeps code that changes the structured data or llms.txt in a small plugin of its own or in mu-plugins, removing that plugin removes the changes too. If the client is keeping them, hand over the files or move the code into the client's child theme before you remove it.",
          ],
        },
        {
          heading: "What disappears when it is removed: the Nurevo AEO case",
          paragraphs: [
            `Here is how our own product (the [free plugin on WordPress.org](${WP_ORG})) actually behaves. Check other plugins along the same lines.`,
          ],
          list: [
            "The free output (structured data, llms.txt, AI search crawler access) is built by the plugin on the client's own server. It works without a connection to the Nurevo service or a key, so disconnecting the site from your agency's account does not stop it.",
            "Alongside Yoast SEO, Rank Math, All in One SEO or Slim SEO, Nurevo AEO adds the missing address, phone, opening hours, business type, FAQ and services inside their structured data. Deactivate the plugin and the SEO plugin's structured data remains, but those added properties are gone.",
            "The robots.txt rules are added to the robots.txt WordPress generates. Deactivate the plugin and those lines go. On sites with a physical robots.txt file on the server, that file is what gets served.",
            "/llms.txt is served by the plugin, so it is no longer served once the plugin is off.",
            "Deleting (uninstalling) the plugin removes everything it stored: settings, FAQ, services, cached diagnosis data and per-page settings, on every site of a multisite network. Do the export in the next section before deleting.",
            `When a site leaves Standard, the plugin keeps running on the ruleset it shipped with; existing output does not stop or degrade. When it leaves Pro, the AI visibility measurement screen (beta, currently Perplexity) is no longer available. Paid plans can be cancelled at any time; cancellation takes effect at the end of the billing period and that period's fee is not refunded ([Terms of Service, article 5](${TERMS})).`,
          ],
        },
        {
          heading: "Hand over: settings, per-page settings and records",
          paragraphs: [
            "In Nurevo AEO, Settings > Tools in the Nurevo admin menu, or WP-CLI, exports the settings as a JSON file: the output switches, the business details (name, description, address, phone, hours, type, URL, email), the site type and policy page URLs, the FAQ and the services. Keys, tokens, the plan and the connection are never included, and a file containing them is refused on import.",
            "Per-page settings (pages left out of llms.txt or structured data, page-specific FAQs) are not in that file. List them with WP-CLI and paste the list into the handover document.",
          ],
          code: CLI,
          after: [
            "Hand over the measurement records too: the questions asked each month, the date, AI and number of runs, and whether the business was named or the site cited. Branded monthly reports can be printed to PDF, so give the client the whole contract period in one set, and the next team can carry on under the same conditions. How to measure is covered in [measuring AI visibility](/guide/measure-ai-visibility).",
            "The exported file contains the client's business details, such as address, phone and email. Don't stop at attaching it to an email: confirm the client has received it, and delete your own copy as your contract says.",
          ],
        },
        {
          heading: "Switch off: accounts, reports and billing",
          table: {
            head: ["Item", "What to do", "Watch out for"],
            rows: [
              ["WordPress admin", "Confirm the client has an administrator account, then delete yours. If your account authored posts, reassign them to the client's account when deleting", "Never delete the last administrator"],
              ["Search Console, Google Analytics, Google Business Profile", "Confirm the client's Google account holds the top-level permission, then remove your agency's accounts", "Check each service's help for the role names and steps. In Search Console, also look for leftover verification files or tags"],
              ["The Nurevo dashboard", "Remove the site from your agency's dashboard. If the client carries on, they add the site in their own account and enter a new pairing code", "Pairing codes are not carried by the settings file"],
              ["Branded monthly reports", "After sending the final month's report, stop automatic sending", "Forget this and reports keep arriving after the contract"],
              ["Paid plan billing", "If the client holds the subscription, continuing or cancelling is the client's decision", "Do not cancel or change it on your own judgement"],
              ["AI check widget and referral page", "Remove your widget if you placed it on the client's site", "Anything on your own site can stay"],
            ],
          },
          after: [
            `Paid plans are taken out by the client, with the client's own consent, in the first place ([partner program](${PARTNER})). Present continuing or cancelling as the client's decision too.`,
          ],
        },
        {
          heading: "How to verify after the handover",
          paragraphs: [
            "Finally, check the output on the live site and record the result on the last page of the handover document. Write the date of the work and the date of the check separately.",
          ],
          list: [
            `Run the home page, the company page and the FAQ page through the [Rich Results Test](${SRC.richResults}). Check that the business is described once, and that address, phone and hours are still there (or gone, if you chose to stop).`,
            "Open /llms.txt and /robots.txt in a browser and confirm they match what was agreed.",
            "If the plugin stays, run wp nurevo status and confirm the structured data, llms.txt and AI crawler output are as agreed.",
            "If the output moved to another setup, check that the same business is not output in two sets of structured data.",
            "Ask an AI a few questions that include the business name and record whether address, hours and the like now conflict with what they were before (answers vary, so hand the results over as a record).",
          ],
        },
        {
          heading: "For the next contract: what to put in the first agreement",
          list: [
            "The plugins and code used for AI-facing output, and their settings, belong to the client and are exported and handed over at the end.",
            "Top-level permission in WordPress, Search Console, Google Business Profile and similar stays with the client's accounts; the agency is added as an extra user.",
            "Whether training crawlers are allowed or blocked in robots.txt is the client's decision.",
            "Monthly measurement records are handed over in one set at the end.",
            "The date on which agency accounts, automatic reports and widgets are removed after the contract ends.",
          ],
        },
        {
          heading: "Handover checklist",
          list: [
            "Keep, stop or move was agreed with the client and recorded.",
            "There is a list of the AI-facing output: what, from where, on which pages.",
            "The settings are exported, with the list of per-page settings attached.",
            "Your own code was handed over as files or moved to the client's side.",
            "Measurement records and monthly report PDFs were handed over.",
            "You confirmed the client holds top-level permission before removing your accounts.",
            "Automatic monthly reports and your widget on the client's site are switched off.",
            "The client decided whether to keep or cancel the paid plan.",
            "Structured data, llms.txt and robots.txt were checked on the live site and the results recorded.",
            "Your own copy of the exported file was deleted as the contract says.",
          ],
        },
      ],
      faqs: [
        { q: "Does the client's AI search optimization stop when the contract ends?", a: "That depends on the setup. Nurevo AEO's free output is built inside the client's site, so removing your connection or the Nurevo account does not stop it. It stops when the plugin is deactivated or deleted. With other setups, check whether anything depends on the agency's servers or accounts." },
        { q: "Can we just delete the plugin?", a: "We advise against it. The address, hours and other properties it added to the SEO plugin's structured data disappear, and the settings and per-page settings are deleted. Decide keep or stop first, and export the settings before removing anything." },
        { q: "What if the next agency uses a different plugin?", a: "Agree a switch-over date and turn the old output off on the day the new setup starts. If both run at once, the same business can appear in two sets of structured data. Check with the Rich Results Test after the switch." },
        { q: "Can the exported settings file be imported into another site?", a: "Yes. Anything not in the file keeps the destination site's current value, and keys, tokens and the plan are not included, so the connection does not carry over. Check the site-specific items (name, address and so on) before importing." },
        { q: "Should the training crawler setting in robots.txt be put back?", a: "There is no rule. Write down the current state, and when and by whom it was decided, so the client can decide. In Nurevo AEO, blocking training crawlers does not affect AI search or the AEO score." },
        { q: "If AI visibility drops after the handover, is the agency responsible?", a: "AI answers change regardless of a handover, so a drop alone does not identify the cause. If the handover document records the output list and the verification results, you can tell whether facts went missing or the AI answers simply changed." },
        { q: "What happens to the referral commission if a referred client cancels?", a: "The commission is based on payments made while the referred client uses a paid plan. For the details, follow what you were told when your partner application was approved, and ask Nurevo if anything is unclear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Before and after the handover, see how AI reads the site",
        body: "The free check needs no sign-up: enter the URL to see the state of structured data, llms.txt and AI crawler access. Use it for the verification page of your handover document.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "Perplexity is a trademark of Perplexity AI, and Google, Search Console and Google Analytics of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO and WordPress are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
