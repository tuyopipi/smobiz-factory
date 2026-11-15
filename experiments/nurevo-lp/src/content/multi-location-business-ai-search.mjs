// Content page: AI search (AEO) for businesses with several locations
// (多店舗・チェーン・複数拠点). Applies to every industry: what people ask AI
// about one branch of a brand, how the site should split brand page, store
// list and store pages, which facts each store page needs, closures and moves,
// how the brand and the stores are tied together in structured data, keeping
// Google Business Profile and the site in step, and how to run it on WordPress
// with Nurevo AEO.
//
// Written 2026-11-15 (JST). Every claim about Nurevo AEO comes from the
// plugin's readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.1), docs/developers.md and nurevo-webmcp.php:
// - Settings describe one business ("One graph, one business"); the business
//   node is published from them.
// - webmcp_canary_schema_graph: $bundle['core'] / ['extra'] / ['org_id'];
//   extra nodes are hand-added and never suppressed; with Yoast SEO / Rank
//   Math / AIOSEO / Slim SEO, nodes that are new are appended to that plugin's
//   graph (webmcp_canary_merge_graph). Not called on a page excluded from
//   structured data.
// - Per-page settings: "このページをllms.txtに載せない", "このページではNurevoの
//   構造化データを出力しない", the page's own FAQ (Nurevo FAQ block set to
//   "This page's own questions" / [nurevo_faq source="post"]).
// - llms.txt: 30 most recently updated pages/posts; webmcp_canary_llms_txt_lines.
// - wp nurevo export / import (settings as JSON, without keys or tokens).
// - Free AI check: three questions from business type and area, never the name.
// - Pro measurement (beta): Perplexity.
//
// Outside facts and where they were read:
// - Google LocalBusiness structured data (checked 2026-10-29 for
//   dental-clinic-ai-search): name and address required; openingHoursSpecification,
//   telephone, url, geo, department among the recommended; use the most
//   specific subtype. Google "AI features and your website": no special markup
//   for AI features; structured data should match visible text; keep Business
//   Profile up to date. Google pages could NOT be re-fetched on 2026-11-15
//   (permission prompt unanswered), so nothing beyond those checked points is said.
// - schema.org definitions checked in schema-dts 2.1.0 on 2026-11-15 (the
//   schema.org pages themselves could not be fetched from this run):
//   branchOf "the larger organization that this local business is a branch of"
//   and deprecated, "Consider using parentOrganization instead"; parentOrganization
//   "the larger organization that this organization is a subOrganization of";
//   department "a store with a pharmacy, or a bakery with a cafe", described as
//   an organization with its own url, logo, opening hours; branchCode is the
//   "store code" that identifies a place of business.
// - Google Business Profile help pages (bulk verification, business groups,
//   guidelines) could NOT be fetched, so no threshold, count or rule from them
//   is stated; the copy points readers to the help centre.
// Not stated on purpose: statistics about chains in AI answers (the top
// articles quote vendor or second-hand figures with no primary source).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleLocalJa: "https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=ja",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  parentOrg: "https://schema.org/parentOrganization",
  branchOf: "https://schema.org/branchOf",
  branchCode: "https://schema.org/branchCode",
  department: "https://schema.org/department",
  gbpHelpJa: "https://support.google.com/business/?hl=ja",
  gbpHelp: "https://support.google.com/business/",
};

export default {
  slug: "multi-location-business-ai-search",
  targetQueries: [
    "multi-location business AI search",
    "location pages for AI answers",
    "chain store schema parentOrganization",
    "多店舗 AI検索 対策",
    "チェーン店 店舗ページ 構造化データ",
    "複数店舗 LLMO",
  ],
  related: ["local-business-schema-seo-plugins", "company-profile-page-ai-search", "aeo-for-wordpress", "llms-txt", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "多店舗・チェーンのAI検索対策：店舗ごとの事実を正しく読ませる | Nurevo",
      description: "AIに「〇〇の梅田店は日曜も開いている？」と聞かれたときに、別の店の情報で答えられないための手順。店舗ページの項目表、閉店・移転の扱い、本部と店舗をつなぐ構造化データ、WordPressでの実装と確かめ方。",
      h1: "多店舗・チェーンのAI検索対策：店舗ごとの営業時間・住所・サービスをAIに取り違えさせない手順",
      lead: "店舗が複数ある会社でAIの答えが間違う原因の多くは、店と店の情報が混ざることです。1店舗に1ページを用意して、その店の事実（住所・電話・営業時間・臨時休業・店ごとの違い）を文字で書き、構造化データで本部とつなぎ、Googleビジネスプロフィールなど社外の情報と同じ値にそろえる。対策の中心はこの3つです。",
      intro: [
        "作成日：2026年11月15日（JST）。対象は、飲食・美容・クリニック・小売・教室・不動産など、2店舗以上（または複数の拠点）を持つ会社と、そのサイトを作る制作会社です。会社そのものの説明（社名・設立・代表者）は[会社概要ページのAI検索対策](/guide/company-profile-page-ai-search)、1店舗の構造化データの基本は[店舗の構造化データとSEOプラグイン](/guide/local-business-schema-seo-plugins)で扱っています。この記事は「店がいくつもある」ことで起きる問題に絞ります。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、AIが読む元の情報を正確にするためのもので、AIの回答に出ることや順位を保証するものではありません。",
      ],
      sections: [
        {
          heading: "多店舗の会社で、AIの答えはどう間違うのか",
          paragraphs: [
            "ChatGPTの検索、Perplexity、GoogleのAIによる概要は、ウェブのページを読んで答えを組み立て、出典を示します。店舗が1つなら「その会社の情報」はほぼ1つですが、店舗が複数あると、AIが読むページの中に、違う店の住所・営業時間・電話番号が並びます。どの値がどの店のものかが文字ではっきりしていないと、ほかの店の値で答えが組み立てられることがあります。",
            "多店舗の会社がAIに聞かれる質問は、ブランド全体の質問と、1つの店の質問に分かれます。",
          ],
          list: [
            "「〇〇（ブランド名）の梅田店は日曜も開いている？」（その店の営業時間・定休日）",
            "「〇〇で駐車場があるのはどの店？」（店ごとの設備の違い）",
            "「〇〇の新宿店はまだある？移転した？」（閉店・移転）",
            "「京都駅の近くに〇〇はある？」（地域と店舗の対応）",
            "「〇〇はどの店でも同じメニュー（施術・診療）を受けられる？」（店ごとのサービスの違い）",
            "「〇〇の本部（運営会社）はどこ？」（ブランドと会社の関係）",
          ],
          after: [
            "よくある間違いは、本店や旗艦店の営業時間を全店の値として答える、閉店した店を今もあるように答える、代表番号を店の電話として答える、一部の店にしかないサービスを全店にあるように答える、の4つです。どれも、店ごとの事実が店ごとのページに書かれていれば起きにくくなります。",
            `Googleは、AIによる概要やAIモードに出るための特別な構造化データや追加の要件はなく、通常のSEOの基本がそのまま当てはまるとしています（[Google 検索セントラル：AI 機能とウェブサイト](${SRC.googleAiJa})）。多店舗の対策も、AI向けの特別な書き方ではなく、店ごとの事実を正しく、読める形で、どこでも同じ値で出すことが本体です。`,
          ],
        },
        {
          heading: "サイトの形：ブランドページ・店舗一覧・店舗ページの役割を分ける",
          paragraphs: [
            "まず、どの質問をどのページで受けるかを決めます。1ページにすべての店を並べるだけでは、AIはどの段落がどの店の話かを取り違えやすくなります。",
          ],
          table: {
            head: ["ページ", "受ける質問", "書くこと", "構造化データ"],
            rows: [
              ["ブランド（トップ・会社概要）", "「〇〇はどんな会社？」「運営会社は？」", "ブランドと運営会社の関係、全店共通のサービス、店舗数（時点つき）", "Organization（本部）"],
              ["店舗一覧", "「〇〇は大阪に何店ある？」「京都駅の近くにある？」", "都道府県・市区町村ごとの店名と住所、各店舗ページへのリンク", "なくてもよい（各店舗ページに置く）"],
              ["店舗ページ（1店1ページ）", "「梅田店は日曜も開いている？」「駐車場は？」", "その店だけの事実（次の表）", "LocalBusinessの具体的な型（1店に1つ）"],
              ["閉店・移転のお知らせ", "「新宿店はまだある？」", "閉店日・移転先・近くの店へのリンク", "店舗の構造化データは外す"],
            ],
          },
          after: [
            "URLは「/stores/osaka/umeda/」のように、店ごとに変わらない形にします。店名やURLを途中で変えると、古いURLを読んだAIや外部サイトとの食い違いが増えます。変えるときは、古いURLから新しいURLへ転送します。",
            "店舗がない地域のページ（「〇〇市の△△なら当社へ」のような、地名だけを入れ替えたページ）は作らないでください。店舗がない地域のことを聞かれたときに、AIが存在しない店を答える原因にもなります。",
          ],
        },
        {
          heading: "店舗ページに書く項目と、構造化データとの対応",
          paragraphs: [
            `次の表は、店舗ページに文字で書いておきたい項目と、対応するschema.orgのプロパティです。Googleのローカルビジネスの説明では、name と address が必須、openingHoursSpecification・telephone・url・geo・department などが推奨とされ、いちばん具体的な型（Dentist、HairSalon、Restaurant など）を使うよう勧めています（[Google：ローカル ビジネスの構造化データ](${SRC.googleLocalJa})）。`,
          ],
          table: {
            head: ["項目", "書き方", "AIで起きやすい間違い", "プロパティ"],
            rows: [
              ["店名", "「ブランド名＋地名＋店」の決まった形（例：サンプル歯科 梅田院）。全店で同じ形にする", "ほかの店と混ざる、略称だけで呼ばれる", "name"],
              ["住所", "郵便番号から建物名・階まで。最寄り駅と出口も文で書く", "移転前の住所、近くの別の店の住所", "address、geo、hasMap"],
              ["電話", "店の直通か、予約センター（代表）かを明記する", "代表番号を店の番号として答える", "telephone"],
              ["営業時間・定休日", "店ごとに書く。全店共通でも、各店のページに書く", "本店の営業時間を全店の値として答える", "openingHoursSpecification"],
              ["臨時休業・年末年始", "期間を日付で書き、終わったら消す", "臨時休業の情報が古いまま残る", "specialOpeningHoursSpecification"],
              ["その店のサービス・設備", "全店共通のものと、その店だけのものを分けて書く（例：「この店では土曜の矯正相談を受けていません」）", "一部の店のサービスを全店にあると答える", "本文、FAQ、department（店内の別部門）"],
              ["駐車場・支払い・言語", "台数や提携駐車場、使える支払い方法、対応できる言語", "ほかの店の設備で答える", "本文（paymentAccepted など）"],
              ["店舗コード", "社内とGoogleビジネスプロフィールで使っている番号", "同じ名前の店の取り違え", "branchCode"],
              ["本部との関係", "「運営：株式会社〇〇」と書き、会社概要へリンク", "フランチャイズの運営会社と本部の混同", "parentOrganization"],
              ["開店日・最終更新日", "ページの最後に「〇年〇月〇日更新」", "いつの情報か判断できない", "本文"],
            ],
          },
          after: [
            "店舗ページは、店名と住所だけを差し替えた同じ文章になりがちです。それでも構いませんが、その店にしかない事実（設備、担当できるサービス、混みやすい時間、アクセスの説明など）を最低3つは書くと、AIが店を区別する手がかりになります。",
            "店ごとのよくある質問は、全店共通の質問と分けて、その店のページに置きます。「この店に駐車場はありますか」「この店で〇〇はできますか」のように、その店の名前で答えられる質問にします。",
          ],
        },
        {
          heading: "閉店・移転・一時休業の扱い",
          paragraphs: [
            "多店舗の会社でいちばん長く残る間違いは、閉店した店の情報です。店のページを消すだけでは、外部のサイトやAIが以前に読んだ情報が残ります。次の順で片付けます。",
          ],
          list: [
            "閉店した店のページは、すぐに消さず「20XX年〇月〇日に閉店しました」と書き換え、近くの店へのリンクを置く。移転なら移転先の店舗ページへ転送するか、移転先を明記する。",
            "店舗一覧から外し、その店の構造化データを外す（閉店した店をLocalBusinessとして出し続けない）。",
            "Googleビジネスプロフィールで、閉業や移転の扱いに更新する。",
            "サイト内のほかの場所（フッター、採用ページ、キャンペーンのページ、PDFのチラシ）に残っていないか探す。",
            "社外の掲載先（予約サイト、ポータル、自治体や団体の名簿）に更新を依頼する。",
            "一時休業は、期間を日付で書き、specialOpeningHoursSpecification や臨時のお知らせで示す。再開したら必ず消す。",
          ],
        },
        {
          heading: "構造化データ：本部と店舗をつなぐ",
          paragraphs: [
            "多店舗の構造化データでは、「どの会社の、どの店か」を機械にもわかる形にします。考え方は次のとおりです。",
          ],
          list: [
            "本部（ブランド・運営会社）は、トップページか会社概要に Organization として1つ置き、固定の @id（例：https://example.jp/#organization）を付ける。",
            "各店舗ページには、その店のLocalBusiness（具体的な型）を1つだけ置き、店ごとに違う @id（例：https://example.jp/stores/osaka/umeda/#store）を付ける。",
            `店舗から本部へは parentOrganization で本部の @id を指す。schema.orgでは、以前の [branchOf](${SRC.branchOf}) は非推奨で、[parentOrganization](${SRC.parentOrg}) を使うよう案内されています。`,
            `店舗コードは [branchCode](${SRC.branchCode})（schema.orgの説明でも「store code」）に入れる。`,
            `1つの店の中に別の部門がある場合（schema.orgの例では、薬局のある店、カフェのあるパン屋）は、[department](${SRC.department}) でつなぎ、部門ごとの営業時間を分けて書ける。`,
            "店舗一覧ページに全店のLocalBusinessをまとめて並べるより、各店の値は各店のページに置く。本文に書いていない値を構造化データだけに入れない。",
          ],
          after: [
            `Googleは、構造化データをページに見えている内容と一致させることを基本の1つに挙げ、Googleビジネスプロフィールの情報も最新にしておくよう勧めています（[AI 機能とウェブサイト](${SRC.googleAiJa})）。構造化データは、店舗ページの本文の「答え合わせの表」です。`,
          ],
        },
        {
          heading: "Googleビジネスプロフィールとサイトを同じ値にする",
          paragraphs: [
            "店舗ごとのGoogleビジネスプロフィールと、店舗ページの値が違うと、どちらが正しいかAIにも人にもわかりません。いちばん効くのは、全店の事実を1つの「店舗の一覧表（マスタ）」で管理し、サイト・Googleビジネスプロフィール・予約サイトを同じ表から更新することです。",
          ],
          table: {
            head: ["一覧表の列", "決めておくこと"],
            rows: [
              ["店舗コード", "社内・サイト・Googleビジネスプロフィールで同じ番号"],
              ["店名", "「ブランド名＋地名＋店」の決まった形"],
              ["住所・電話", "番地やハイフンの書き方を1つに決める"],
              ["営業時間・定休日・臨時休業", "変更日と、誰が直すか"],
              ["店ごとのサービス・設備", "全店共通とその店だけを分ける"],
              ["店舗ページのURL", "変えない。変えたら転送"],
              ["状態", "営業中・一時休業・閉店（日付つき）"],
              ["最終確認日", "月1回など、決めた周期で確認"],
            ],
          },
          after: [
            `店舗が多い場合の一括でのオーナー確認や、複数の店舗をまとめて管理する機能、店舗コードの扱いには、Googleが決めた条件があります。条件は変わることがあるので、[Googleビジネスプロフィール ヘルプ](${SRC.gbpHelpJa})で最新の内容を確かめてください。店長が各自でプロフィールを直せる運用にする場合も、一覧表の値とずれないよう、直す前に一覧表を更新する順番を決めておきます。`,
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEOの場合）",
          paragraphs: [
            `WordPressのサイトなら、[Nurevo AEO（無料）](${WP_ORG})で本部の情報を構造化データとllms.txtに出し、店舗ページは次のように組み合わせます。Nurevoの設定に入る事業者は1つ（1つのサイトに1つの事業者）なので、そこには本部（ブランド）の情報を入れます。`,
          ],
          list: [
            "店舗ページの本文を、上の表に沿って先に書く（構造化データより先に本文）。店舗は固定ページか、店舗用の投稿タイプで1店1ページにする。",
            "Nurevoの基本情報には、本部（ブランド・運営会社）の名前・説明・住所・電話番号・URL・メールを入れる。店舗が1つしかない地域ビジネスと違い、ここに1店舗の営業時間を入れると、全店の値のように見えるので注意する。",
            "店ごとのよくある質問は、その店舗ページの編集画面の「Nurevo AEO」パネルで、そのページだけの質問として入力し、Nurevo FAQブロックを「このページ専用の質問」に設定して置く。そのページにだけFAQPageとして出ます。",
            "店舗ごとのLocalBusinessを出したい場合は、開発者向けの webmcp_canary_schema_graph フィルターで、店舗ページにだけ店のノードを extra に足す。本部の @id は $bundle['org_id'] で受け取れるので、parentOrganization にその @id を入れる。店の値は、店舗ページの本文と同じ値（カスタムフィールドなど）から作る。",
            "Yoast SEO・Rank Math・All in One SEO・Slim SEOを使っている場合、Nurevoはそのプラグインの構造化データに足りない事実だけを足し、新しいノード（店のノードなど）はその構造化データに追加されます。SEO SIMPLE PACK、VK All in One Expansion Unitとも併用できます（0.9.1から）。",
            "店舗検索のプラグインなど、別の仕組みがすでに店舗ごとの構造化データを出している場合は、二重にならないよう、店舗ページの「このページではNurevoの構造化データを出力しない」を使うか、どちらか一方に決める。",
            "/llms.txt を開いて店舗一覧と主な店舗ページが載っているか確かめる。llms.txtには更新日の新しい固定ページ・投稿30件が載るため、店舗が多いと載らないページが出ます。webmcp_canary_llms_txt_lines フィルターで店舗一覧への行を足せます。閉店した店のページは「このページをllms.txtに載せない」で外せます。",
            "フランチャイズなどで店ごとに別のWordPressサイトがある場合は、wp nurevo export で設定を書き出し、wp nurevo import でほかのサイトに読み込んでから、店の名前・住所・電話・営業時間だけを直す（キーやトークンは書き出されません）。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態を確認できます。店舗ページのURLも1つずつ入れて確かめられます。",
          ],
        },
        {
          heading: "確かめ方：店ごとに、店名を入れた質問と入れない質問",
          paragraphs: [
            "多店舗の確かめ方は、店を選んで、店ごとに記録することです。全店を毎回聞く必要はありません。営業時間や住所が変わった店、閉店・移転した店、問い合わせの多い店から始めます。同じ質問を、同じAIに、日を変えて何回か聞き、1回の答えだけで判断しないでください。",
          ],
          table: {
            head: ["記録すること", "例"],
            rows: [
              ["日付・AI・質問", "11/15、Perplexity、「サンプル歯科の梅田院は日曜も診療している？」"],
              ["答えの中の事実", "営業時間・住所・電話・サービスが、その店の値か、ほかの店の値か"],
              ["出典", "その店の店舗ページか、店舗一覧か、外部の予約サイトか"],
              ["店名を入れない質問", "「梅田で日曜に開いている歯医者は？」で店が出るか"],
              ["閉店した店", "閉店した店を今もあるように答えていないか"],
            ],
          },
          after: [
            "Nurevoの無料のAIチェック（サイトを接続したFree・Standardのサイトで月1回）は、設定の業種と地域から作った質問で、名前を入れずに聞きます。地域は設定に入れた1つなので、ほかの店の地域は上の表で手で確かめます。Proの登場率の計測（ベータ版）は現在Perplexityが対象です。測り方の全体は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
          ],
        },
        {
          heading: "多店舗のチェックリスト",
          list: [
            "1店舗に1ページあり、URLは店ごとに変わらない形になっている。",
            "店名の書き方（ブランド名＋地名＋店）が全店で同じ。",
            "各店のページに、その店の住所・電話（直通か代表か）・営業時間・定休日が文字で書いてある。",
            "臨時休業・年末年始は日付つきで書き、終わったら消している。",
            "全店共通のサービスと、その店だけのサービスが分けて書いてある。",
            "閉店・移転した店は、お知らせに書き換え、店舗一覧と構造化データから外している。",
            "各店のLocalBusinessは店ごとに違う @id を持ち、parentOrganization で本部につながっている。",
            "構造化データの値が、店舗ページの本文と一致している。",
            "サイトとGoogleビジネスプロフィールの値が、同じ一覧表から更新されている。",
            "店舗が地域ごとに一覧でき、各店舗ページへリンクしている。",
            "店を選び、店名を入れた質問と入れない質問で、日を変えて確かめ、記録した。",
          ],
        },
      ],
      faqs: [
        { q: "店舗ごとにページを作るべきですか？店舗一覧の1ページではだめですか？", a: "店舗ごとの質問（その店の営業時間や設備）に答えるには、1店1ページのほうが確実です。一覧の1ページだけだと、どの値がどの店のものかをAIが取り違えやすくなります。店舗が少ない場合でも、各店に見出しと住所・営業時間をまとめた区切りを作ってください。" },
        { q: "全店の営業時間が同じなら、各店のページに書かなくてもいいですか？", a: "各店のページにも書くことをおすすめします。AIは店舗ページだけを読んで答えることがあるので、そのページに営業時間がないと、ほかのページや外部のサイトの値が使われます。" },
        { q: "branchOf と parentOrganization はどちらを使えばいいですか？", a: "schema.orgでは branchOf は非推奨で、parentOrganization を使うよう案内されています。店舗のLocalBusinessから、本部のOrganizationの @id を parentOrganization で指してください。" },
        { q: "閉店した店のページはすぐ消すべきですか？", a: "すぐ消すより、閉店日と近くの店へのリンクを書いたお知らせにして、店舗一覧と構造化データから外すほうが、閉店したことが伝わります。移転の場合は、移転先の店舗ページへ転送するか、移転先を明記します。" },
        { q: "フランチャイズ店が独自のサイトやSNSを持っています。どうそろえればいいですか？", a: "本部の店舗の一覧表を正として、店名・住所・電話・営業時間の書き方を加盟店と共有し、加盟店のサイトやプロフィールも同じ値にしてもらいます。加盟店のサイトから本部のサイトへ、本部の店舗ページから加盟店のサイトへ、お互いにリンクしておくと関係がわかりやすくなります。" },
        { q: "店舗が多くてllms.txtに全部載りません。全店を載せるべきですか？", a: "全店を並べる必要はありません。店舗一覧のページと、主な店舗ページが載っていれば、そこから各店のページへたどれます。Nurevo AEOでは、webmcp_canary_llms_txt_lines フィルターで店舗一覧への行を足せます。" },
        { q: "この手順で、すべての店がAIの答えに正しく出ますか？", a: "保証はできません。AIの回答は日や聞き方で変わります。この手順は、店と店の情報が混ざる原因を減らし、AIが読む元の情報を正確にそろえるためのものです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "店舗ページをAIがどう読んでいるか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。店舗ページのURLも1つずつ確かめられます。WordPressなら、無料のプラグインで本部の情報を構造化データに出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPressプラグインを無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },
    en: {
      title: "Multi-Location Business AI Search: Keep Each Branch Right | Nurevo",
      description: "Stop AI answers mixing up your locations: one page per location, the facts each needs, closures and moves, branch-to-brand schema and WordPress steps.",
      h1: "AI search for multi-location businesses: keep each location's hours, address and services from being mixed up",
      lead: "When a business has several locations, most wrong AI answers come from one location's facts being used for another. Give each location its own page with its facts in plain text (address, phone, hours, temporary closures, what differs there), tie it to the brand in structured data, and keep the same values in Google Business Profile and your other listings. Those three steps are the core of the work.",
      intro: [
        "Written November 15, 2026 (JST). This guide is for any business with two or more locations or offices (restaurants, salons, clinics, shops, schools, estate agents) and for the agencies that build their sites. The company itself (legal name, founding date, leadership) is covered in [About page AI search optimization](/guide/company-profile-page-ai-search), and the basics of one location's markup in [local business schema and SEO plugins](/guide/local-business-schema-seo-plugins). This guide is about the problems that come from having many locations.",
        "AI answers change by day and by wording. These steps make the information AI reads accurate; they do not guarantee that you will appear in an answer or in any position.",
      ],
      sections: [
        {
          heading: "How AI answers go wrong for multi-location businesses",
          paragraphs: [
            "ChatGPT search, Perplexity and Google's AI Overviews read web pages, build an answer and show their sources. With one location, \"the business's facts\" are a single set. With several, the pages an AI reads contain several addresses, several sets of hours and several phone numbers. If the text does not make clear which value belongs to which location, the answer can be built from the wrong one.",
            "The questions people ask split into questions about the brand and questions about one location:",
          ],
          list: [
            "\"Is the Umeda branch of [brand] open on Sundays?\" (that location's hours and closing days)",
            "\"Which [brand] locations have parking?\" (facilities that differ by location)",
            "\"Is the Shinjuku [brand] still open, or did it move?\" (closures and moves)",
            "\"Is there a [brand] near Kyoto Station?\" (which location serves which area)",
            "\"Can I get the same menu / treatment / service at every [brand]?\" (services that differ by location)",
            "\"Who runs [brand]?\" (brand and operating company)",
          ],
          after: [
            "Four mistakes come up again and again: the flagship's hours given as every location's hours, a closed location described as open, the central booking number given as a location's phone, and a service only some locations offer described as available everywhere. Each becomes less likely once every location's facts are written on that location's own page.",
            `Google says there are no additional requirements and no special structured data for appearing in AI Overviews or AI Mode, and that the usual SEO basics apply ([Google Search Central: AI features and your website](${SRC.googleAi})). Multi-location work is the same: not a special way of writing for AI, but each location's facts published accurately, readably and with the same values everywhere.`,
          ],
        },
        {
          heading: "Site structure: separate the brand page, the location list and the location pages",
          paragraphs: [
            "First decide which page answers which question. A single page that lists every location makes it easy for an AI to attach a paragraph to the wrong location.",
          ],
          table: {
            head: ["Page", "Questions it answers", "What to write", "Structured data"],
            rows: [
              ["Brand (home or About)", "\"What is [brand]?\" \"Who runs it?\"", "Brand and operating company, services common to all locations, number of locations (with a date)", "Organization (head office)"],
              ["Location list", "\"How many [brand] locations in Osaka?\" \"Is there one near Kyoto Station?\"", "Names and addresses by region and city, linking to each location page", "Optional (put it on each location page)"],
              ["Location page (one per location)", "\"Is Umeda open on Sundays?\" \"Is there parking?\"", "Facts that belong to that location only (next table)", "One specific LocalBusiness type per location"],
              ["Closure or move notice", "\"Is Shinjuku still open?\"", "Closing date, new address, links to nearby locations", "Remove the location's structured data"],
            ],
          },
          after: [
            "Give each location a URL that will not change, such as /stores/osaka/umeda/. Renaming locations or URLs midway creates more mismatches with what AIs and other sites read before. If you must change one, redirect the old URL to the new one.",
            "Do not create pages for areas where you have no location (pages that only swap the place name, \"looking for X in [town]? Choose us\"). They can also lead an AI to describe a location that does not exist.",
          ],
        },
        {
          heading: "What each location page needs, and the matching properties",
          paragraphs: [
            `The table lists what to write in plain text on each location page and the matching schema.org property. Google's local business documentation lists name and address as required, with openingHoursSpecification, telephone, url, geo and department among the recommended properties, and recommends the most specific type available, such as Dentist, HairSalon or Restaurant ([Google: Local business structured data](${SRC.googleLocal})).`,
          ],
          table: {
            head: ["Item", "How to write it", "Typical AI mistake", "Property"],
            rows: [
              ["Location name", "A fixed pattern, brand + place (e.g. Sample Dental Umeda), the same for every location", "Mixed with another location, known only by a nickname", "name"],
              ["Address", "Postcode to building and floor, plus the nearest station and exit in a sentence", "A previous address, or a nearby location's address", "address, geo, hasMap"],
              ["Phone", "Say whether it is the location's direct line or a central booking line", "The central number given as the location's", "telephone"],
              ["Hours and closing days", "Per location, on each location's page, even if they are the same everywhere", "The flagship's hours given for every location", "openingHoursSpecification"],
              ["Temporary closures and holidays", "With dates; remove them when they are over", "Old closure notices left in place", "specialOpeningHoursSpecification"],
              ["Services and facilities", "Separate what every location offers from what this one offers (\"This location does not offer Saturday orthodontic consultations\")", "One location's service described as available everywhere", "Body text, FAQ, department (a section inside the location)"],
              ["Parking, payment, languages", "Spaces or partner car parks, payment methods, languages spoken", "Another location's facilities", "Body text (paymentAccepted and others)"],
              ["Store code", "The number used internally and in Google Business Profile", "Two locations with similar names confused", "branchCode"],
              ["Link to the brand", "\"Operated by Sample Co., Ltd.\" with a link to the About page", "Franchisee and franchisor confused", "parentOrganization"],
              ["Opening date, last updated", "\"Updated on [date]\" at the end of the page", "No way to tell how current the facts are", "Body text"],
            ],
          },
          after: [
            "Location pages often end up as the same text with only the name and address swapped. That is acceptable, but writing at least three facts that only apply to that location (facilities, which services it handles, busy times, directions) gives an AI something to tell the locations apart by.",
            "Keep each location's FAQ on that location's page, separate from brand-wide questions: questions that can be answered with the location's name in them, such as \"Is there parking at this location?\" or \"Can I get X at this location?\"",
          ],
        },
        {
          heading: "Closures, moves and temporary closures",
          paragraphs: [
            "The wrong fact that lasts longest for multi-location businesses is a closed location. Deleting its page does not remove what other sites and AIs have already read. Clean up in this order:",
          ],
          list: [
            "Do not delete the closed location's page straight away. Rewrite it as \"This location closed on [date]\" with links to nearby locations. For a move, redirect to the new location's page or state the new address clearly.",
            "Remove it from the location list and remove its structured data (do not keep publishing a closed location as a LocalBusiness).",
            "Update its Google Business Profile to show the closure or move.",
            "Search the rest of the site (footer, recruitment page, campaign pages, PDF flyers) for mentions.",
            "Ask other publishers (booking sites, portals, local directories) to update their listings.",
            "For a temporary closure, give dates and show it with specialOpeningHoursSpecification or a notice. Remove it when you reopen.",
          ],
        },
        {
          heading: "Structured data: tie each location to the brand",
          paragraphs: [
            "For several locations, structured data should make \"which company, which location\" readable by machines. The approach:",
          ],
          list: [
            "Publish the head office (brand or operating company) once as an Organization on the home page or About page, with a fixed @id such as https://example.com/#organization.",
            "On each location page, publish exactly one LocalBusiness of the most specific type, with an @id unique to that location such as https://example.com/stores/osaka/umeda/#store.",
            `Point from each location to the head office with parentOrganization. schema.org marks the older [branchOf](${SRC.branchOf}) as deprecated and recommends [parentOrganization](${SRC.parentOrg}) instead.`,
            `Put the store code in [branchCode](${SRC.branchCode}), which schema.org itself describes as the \"store code\".`,
            `If a location contains a separate section (schema.org's examples are a store with a pharmacy and a bakery with a cafe), connect it with [department](${SRC.department}), which lets each section have its own hours.`,
            "Put each location's values on its own page rather than listing every LocalBusiness on the location list. Do not put values in structured data that the page text does not show.",
          ],
          after: [
            `Google lists matching structured data to the visible page content as one of the basics and recommends keeping Business Profile information up to date ([AI features and your website](${SRC.googleAi})). Treat structured data as the answer key for what the location page already says.`,
          ],
        },
        {
          heading: "Keep Google Business Profile and the site on the same values",
          paragraphs: [
            "When a location's Business Profile and its page disagree, neither people nor AIs can tell which is right. What helps most is one master sheet of every location's facts, from which the site, Google Business Profile and booking sites are all updated.",
          ],
          table: {
            head: ["Column", "What to decide"],
            rows: [
              ["Store code", "The same number internally, on the site and in Business Profile"],
              ["Location name", "The fixed brand + place pattern"],
              ["Address and phone", "One way of writing numbers and separators"],
              ["Hours, closing days, temporary closures", "When they change and who updates them"],
              ["Services and facilities", "Common to all vs this location only"],
              ["Location page URL", "Never changes; redirect if it does"],
              ["Status", "Open, temporarily closed, closed (with dates)"],
              ["Last checked", "On a fixed cycle, such as monthly"],
            ],
          },
          after: [
            `Bulk verification for businesses with many locations, tools for managing several locations together and the handling of store codes all come with conditions Google sets, and those conditions change. Check the current version in the [Google Business Profile Help Center](${SRC.gbpHelp}). If location managers edit their own profiles, agree that the master sheet is updated first so the two do not drift apart.`,
          ],
        },
        {
          heading: "On WordPress (with Nurevo AEO)",
          paragraphs: [
            `On WordPress, [Nurevo AEO (free)](${WP_ORG}) publishes the head office's facts as structured data and in llms.txt; combine it with your location pages as below. Nurevo's settings describe one business per site, so enter the head office (brand) there.`,
          ],
          list: [
            "Write the location pages first, following the table above (text before structured data). Use one page or one entry of a location post type per location.",
            "In Nurevo's business details, enter the head office's name, description, address, phone, URL and email. Unlike a single-location business, entering one location's opening hours here makes them look like every location's hours.",
            "Enter each location's own questions in the Nurevo AEO panel of that page's editor as this page's own questions, and place the Nurevo FAQ block set to \"This page's own questions\". They are published as FAQPage on that page only.",
            "To publish a LocalBusiness per location, use the developer filter webmcp_canary_schema_graph to add the location's node to extra on location pages only. The head office's @id is available as $bundle['org_id']; put it in parentOrganization. Build the location's values from the same source as the page text (custom fields, for example).",
            "With Yoast SEO, Rank Math, All in One SEO or Slim SEO, Nurevo adds only the facts that plugin's structured data lacks, and new nodes (such as a location node) are appended to that plugin's graph. Nurevo also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit (from 0.9.1).",
            "If something else, such as a store-locator plugin, already publishes structured data per location, avoid duplicates: tick \"Publish no Nurevo structured data on this page\" on those pages, or choose one source.",
            "Open /llms.txt and check that the location list and your main location pages are there. llms.txt lists the 30 most recently updated pages and posts, so with many locations some pages will be missing. The webmcp_canary_llms_txt_lines filter can add a line for the location list, and a closed location's page can be removed with \"Leave this page out of llms.txt\".",
            "If franchise locations run separate WordPress sites, export the settings with wp nurevo export, import them on the other site with wp nurevo import, then change only the name, address, phone and hours (keys and tokens are not exported).",
          ],
          after: [
            "The same checks apply to sites not built on WordPress. Enter a URL in the [free check](/check), no sign-up needed, to see the state of structured data, llms.txt and AI crawler access. You can check location pages one URL at a time.",
          ],
        },
        {
          heading: "How to check: per location, with and without the name",
          paragraphs: [
            "Check by picking locations and recording results per location. You do not need to ask about every location every time: start with locations whose hours or address changed, those that closed or moved, and those that get the most enquiries. Ask the same question of the same AI on different days, and do not judge from one answer.",
          ],
          table: {
            head: ["What to record", "Example"],
            rows: [
              ["Date, AI, question", "Nov 15, Perplexity, \"Is Sample Dental Umeda open on Sundays?\""],
              ["Facts in the answer", "Are the hours, address, phone and services this location's, or another's?"],
              ["Sources", "This location's page, the location list, or an outside booking site?"],
              ["Question without the name", "Does the location appear for \"dentist open on Sunday in Umeda\"?"],
              ["Closed locations", "Is a closed location described as open?"],
            ],
          },
          after: [
            "Nurevo's free AI check (once a month, for connected Free and Standard sites) asks questions built from the business type and area in your settings, without your name. There is one area in the settings, so check your other locations' areas by hand with the table above. Pro's visibility measurement (beta) currently covers Perplexity. The full method is in [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "Multi-location checklist",
          list: [
            "Every location has its own page, at a URL that will not change.",
            "Location names follow the same brand + place pattern everywhere.",
            "Each location page states that location's address, phone (direct or central), hours and closing days in text.",
            "Temporary closures and holidays have dates and are removed when over.",
            "Services common to all locations are written separately from those only this location offers.",
            "Closed or moved locations show a notice and are removed from the location list and structured data.",
            "Each location's LocalBusiness has its own @id and points to the head office with parentOrganization.",
            "Structured data values match the location page text.",
            "The site and Google Business Profile are updated from the same master sheet.",
            "Locations can be browsed by region, with links to each location page.",
            "You picked locations and checked questions with and without the name on different days, and recorded the results.",
          ],
        },
      ],
      faqs: [
        { q: "Do we need a page for every location, or is one location list enough?", a: "To answer questions about one location (its hours, its facilities), one page per location is more reliable. With only a list, an AI can easily attach a value to the wrong location. Even with few locations, give each one its own heading with its address and hours together." },
        { q: "If every location has the same hours, do we still need them on each page?", a: "We recommend it. An AI may answer from the location page alone, and if the hours are not there it will use values from other pages or other sites." },
        { q: "Should we use branchOf or parentOrganization?", a: "schema.org marks branchOf as deprecated and recommends parentOrganization. Point from each location's LocalBusiness to the head office Organization's @id with parentOrganization." },
        { q: "Should we delete a closed location's page straight away?", a: "Turning it into a notice with the closing date and links to nearby locations, and removing it from the location list and structured data, communicates the closure better than deleting it. For a move, redirect to the new location's page or state the new address." },
        { q: "Our franchisees run their own sites and social accounts. How do we keep them consistent?", a: "Treat the head office's master sheet as the source of truth, share the agreed spelling of names, addresses, phone numbers and hours with franchisees, and ask them to use the same values. Linking both ways, from the franchisee's site to the brand's location page and back, also makes the relationship clear." },
        { q: "We have too many locations for llms.txt. Should all of them be listed?", a: "No. If the location list and your main location pages are there, the rest can be reached from them. In Nurevo AEO, the webmcp_canary_llms_txt_lines filter can add a line for the location list." },
        { q: "Will these steps make every location appear correctly in AI answers?", a: "That cannot be guaranteed; AI answers change by day and wording. These steps reduce the causes of one location's facts being mixed with another's and make the information AI reads accurate and consistent." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads your location pages",
        body: "The free check needs no sign-up: enter a URL to see the state of structured data, llms.txt and AI crawler access, one location page at a time if you like. On WordPress, the free plugin publishes your head office's facts as structured data.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
