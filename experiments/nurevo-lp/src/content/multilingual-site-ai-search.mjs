// Content page: for web agencies that build or maintain multilingual sites
// (inbound tourism, exporters, hotels, restaurants, clinics with foreign
// patients) - how to design and check a multilingual WordPress site so that
// search engines and AI answers read each language version correctly:
// URL structure, one language per page, no automatic redirects, hreflang,
// facts kept identical across languages, structured data, llms.txt,
// Polylang/WPML, measuring per language, and contract scope.
//
// Written 2026-11-24 14時 (JST).
//
// Nurevo AEO facts (plugin source nurevo-webmcp.php, readme 0.9.x):
// - WebPage / BlogPosting nodes carry inLanguage = get_bloginfo('language');
//   the plugin has no Polylang/WPML-specific code, so whether the value changes
//   per language depends on the multilingual plugin - check the output.
// - One business node per site (the settings are one set of values).
// - /llms.txt is one file built from the site "in your site's language".
// - The diagnosis sends the home URL and the WordPress language.
// - Plugin UI translated into 59 locales.
// - nurevo.jp itself: 41 languages; hreflang lists only versions that exist
//   (ja/en-only articles list ja, en, en-GB/AU/CA/NZ/ZA and x-default), html
//   lang per language; verified in public/ on 2026-11-24.
//
// Outside facts and where they were read (2026-11-24):
// - Google, managing multi-regional sites (ja, updated 2025-12-18): language
//   from visible content, not lang attribute or URL; separate URL per language;
//   no cookie/browser-setting switching; avoid automatic redirects, link to
//   other versions; Googlebot usually from US without Accept-Language; one
//   language per page, avoid side-by-side translation; template-only
//   translation causes duplicates; URL structure table (ccTLD, subdomain,
//   subdirectory, parameters not recommended).
// - Google, localized versions (updated 2026-09-21): three equivalent methods;
//   "Google doesn't use hreflang or the HTML lang attribute to detect the
//   language"; each version lists itself and all others; if two pages don't
//   point to each other the tags are ignored; ISO 639-1 / ISO 3166-1 Alpha 2,
//   ISO 15924 scripts (zh-Hant); country code alone not allowed; es-419 not
//   supported; fully-qualified URLs; x-default; duplicates only if main
//   content untranslated.
// - Google spam policies (updated 2026-11-23): scaled content abuse examples
//   include "automated transformations like synonymizing, translating".
// - SERoundtable 2025-06-12 / SEJ 2025-06-11 / GSQi 2025-05-05 (upd. 06-11):
//   Google statement "our policies do not strictly define content that has
//   been translated by AI as spam"; robots.txt guidance for auto-translated
//   pages removed, docs-only change.
// - SERoundtable 2020-09-11: Fabrice Canel (Bing) "hreflang is indeed a far
//   weaker signal than content-language at Bing" (old statement).
// - GSQi 2025-12-01 (Glenn Gabe): anecdotal tests, French/Italian/Spanish.
// - Polylang docs (no date): automatic hreflang, x-default only on the
//   homepage by default, pll_rel_hreflang_attributes filter.
// - WPML docs (updated 2025-01-07): automatic hreflang, region code field in
//   Languages settings, no warning for invalid format.
// Top articles read 2026-11-24: uravation (2026-07-18, 09-05 update), DeepL /
// Weglot (2026-06-19, noindex), GOOD LUCK TRIP (2025-03-21), JNTO
// (2026-09-30), Digima (2026-03-11); funnel-ai redirected to another host and
// was not read / GSQi (2025-12-01), Weglot (2026-08-10), RWS (2026-04-28),
// Lokalise (2026-11-16), eSEOspace (2026-10-13, reviewed 11-16), MultiLipi
// (2026-05-27).
// Not stated on purpose: vendor citation-uplift figures (Weglot 327%/431%,
// no method), whether ChatGPT/Perplexity/Claude read hreflang (no official
// documentation found), hreflang-for-polylang details (page not read),
// Search Console's AI report country breakdown (not re-read), translation
// prices.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  multiJa: "https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites?hl=ja",
  multiEn: "https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites",
  localizedJa: "https://developers.google.com/search/docs/specialty/international/localized-versions?hl=ja",
  localizedEn: "https://developers.google.com/search/docs/specialty/international/localized-versions",
  spam: "https://developers.google.com/search/docs/essentials/spam-policies",
  serTranslate: "https://www.seroundtable.com/google-softens-automated-translation-stance-39579.html",
  gsqiTranslate: "https://www.gsqi.com/marketing-blog/auto-translating-content-google-scaled-content-abuse/",
  gsqiAi: "https://www.gsqi.com/marketing-blog/ai-search-hreflang-multilingual-queries/",
  bing: "https://www.seroundtable.com/bing-hreflang-weak-signal-30099.html",
  polylang: "https://polylang.pro/?p=345039",
  wpml: "https://wpml.org/documentation/support/adding-hreflang-wordpress/",
  jnto: "https://www.jnto.go.jp/projects/regional-support/resources/3952.html",
};

const HREFLANG = `<!-- 例：アクセスのページ（日本語・英語・繁体字・韓国語）。
     4つの言語のページすべてに、同じ5行を入れる（自分自身の行も入れる） -->
<link rel="alternate" hreflang="ja" href="https://example.jp/ja/access/">
<link rel="alternate" hreflang="en" href="https://example.jp/en/access/">
<link rel="alternate" hreflang="zh-Hant" href="https://example.jp/zh-hant/access/">
<link rel="alternate" hreflang="ko" href="https://example.jp/ko/access/">
<link rel="alternate" hreflang="x-default" href="https://example.jp/en/access/">`;

const HREFLANG_EN = `<!-- Example: the access page in Japanese, English, Traditional Chinese, Korean.
     Put the same five lines on all four pages (each page lists itself too) -->
<link rel="alternate" hreflang="ja" href="https://example.jp/ja/access/">
<link rel="alternate" hreflang="en" href="https://example.jp/en/access/">
<link rel="alternate" hreflang="zh-Hant" href="https://example.jp/zh-hant/access/">
<link rel="alternate" hreflang="ko" href="https://example.jp/ko/access/">
<link rel="alternate" hreflang="x-default" href="https://example.jp/en/access/">`;

const SCRIPT_BODY = `import re, sys, urllib.request

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (hreflang-check)"})
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.geturl(), res.status, res.read().decode("utf-8", "replace")

def alternates(html):
    found = {}
    for tag in re.findall(r"<link\\b[^>]*>", html, re.I):
        if not re.search(r'rel=["\\']?alternate', tag, re.I):
            continue
        lang = re.search(r'hreflang=["\\']([^"\\']+)', tag, re.I)
        href = re.search(r'href=["\\']([^"\\']+)', tag, re.I)
        if lang and href:
            found[lang.group(1).lower()] = href.group(1)
    return found

def html_lang(html):
    m = re.search(r"<html\\b[^>]*\\blang=[\\"']([^\\"']+)", html, re.I)
    return m.group(1) if m else ""

start = sys.argv[1]
final, status, html = fetch(start)
base = alternates(html)
if not base:
    sys.exit(f"{start}: no hreflang links found")
print("hreflang\\turl\\tstatus\\thtml_lang\\tlists_itself\\tlists_start\\tresult")
for lang, url in sorted(base.items()):
    if not url.startswith(("http://", "https://")):
        print(f"{lang}\\t{url}\\t\\t\\t\\t\\tNOT_ABSOLUTE")
        continue
    try:
        got, code, page = fetch(url)
    except Exception as e:
        print(f"{lang}\\t{url}\\tERROR {e}\\t\\t\\t\\tFETCH_ERROR")
        continue
    alt = alternates(page)
    self_ok = url in alt.values()
    back_ok = final in alt.values() or start in alt.values()
    result = "OK"
    if got != url:
        result = "REDIRECTED"
    elif not (self_ok and back_ok):
        result = "NOT_RECIPROCAL"
    print(f"{lang}\\t{url}\\t{code}\\t{html_lang(page)}\\t{self_ok}\\t{back_ok}\\t{result}")`;

const SCRIPT = `# 使い方：python3 check_hreflang.py https://example.jp/ja/access/
# 指定したページの hreflang に載っている各言語のページを開き、
# そのページも「自分自身」と「指定したページ」を載せているかを確かめる。
# 結果：OK／NOT_RECIPROCAL＝相互に載っていない（Googleはこの組を無視する）
#       REDIRECTED＝載っているURLが転送される／NOT_ABSOLUTE＝完全なURLでない
#       html_lang の列で、<html lang> がその言語になっているかも見る
${SCRIPT_BODY}`;

const SCRIPT_EN = `# Usage: python3 check_hreflang.py https://example.jp/en/access/
# Opens every language version listed in the page's hreflang and checks that
# each one lists itself and the page you started from.
# Result: OK / NOT_RECIPROCAL = the pair does not point both ways (Google ignores it)
#         REDIRECTED = the listed URL redirects / NOT_ABSOLUTE = not a full URL
#         The html_lang column shows whether <html lang> matches the language
${SCRIPT_BODY}`;

export default {
  slug: "multilingual-site-ai-search",
  targetQueries: [
    "多言語サイト AI検索 対策",
    "インバウンド 多言語サイト LLMO 制作会社",
    "hreflang AI検索 ChatGPT",
    "multilingual website AI search optimization",
    "hreflang ChatGPT Perplexity AI Overviews",
    "multilingual site GEO agency checklist",
  ],
  related: ["agency-new-site-build-ai-search", "site-renewal-ai-search", "llms-txt", "agency-aeo-monthly-service", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "多言語サイトのAI検索対策：制作会社の設計と確認の手順 | Nurevo",
      description: "インバウンドや海外向けの多言語サイトを、検索とAIに言語ごとに正しく読ませる手順。URLの分け方、hreflang、言語でそろえる事実、機械翻訳の扱い、WordPressでの確かめ方、契約の範囲。",
      h1: "多言語サイトのAI検索対策：言語ごとに正しく読ませるための、制作会社の設計と確認の手順",
      lead: "多言語サイトをAIや検索に正しく読ませるには、「1つのページに1つの言語」「言語ごとに別のURL」「hreflang で各言語のページを相互に結ぶ」「営業時間・価格・住所などの事実をすべての言語で同じにする」の4つを、作るときと毎月の保守で確かめるのが基本です。Googleは、ページの言語を lang 属性や hreflang ではなく、見えている本文から判断すると説明しています。ChatGPTやPerplexityが hreflang をどう扱うかは公式の説明がなく、試した例では英語版を出典にすることも多いため、どの言語のページを出典にされても事実が正しいことが大事です。",
      intro: [
        "作成日：2026年11月24日（JST）。対象は、インバウンド向けの宿泊・飲食・観光、海外の取引先がある製造業、外国人の患者さんを受け入れる医院などの多言語サイトを作る・保守する制作会社とフリーランスの方です。Googleの説明は、この記事の作成時点の Search Central の文書に合わせています。",
        "AIの回答は日や聞き方、使う人の言語の設定によって変わります。この記事の手順は、AIや検索に正しく読まれるための前提を整えるもので、AIの回答に出ることや順位を保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれている記事と、足りないこと",
          paragraphs: [
            "「多言語サイト AI検索」「インバウンド 多言語 LLMO」「multilingual GEO」などで上位に出る日本語6本・英語6本を、2026年11月24日に読みました（日本語1本は別のサイトに転送されたため読んでいません）。日本語では、uravation（2026年9月5日更新）、DeepLのブログに載ったWeglotの記事（6月19日更新）、GOOD LUCK TRIP（2025年3月21日更新）、JNTO（日本政府観光局）のインタビュー（9月30日）、Digima（3月11日）。英語では、GSQi（Glenn Gabe、2025年12月1日）、Weglot（8月10日更新）、RWS（4月28日）、Lokalise（11月16日）、eSEOspace（10月13日）、MultiLipi（5月27日）です。",
            "英語の上位記事の多くは翻訳ツールの会社のもので、「翻訳するとAIでの引用が数百％増える」といった数字が、調べ方の説明なしに載っていました。日本語の記事はAI検索に触れていないものも多く、次の点はほとんど書かれていませんでした。",
          ],
          table: {
            head: ["足りない点", "この記事で書いていること"],
            rows: [
              ["「hreflang を入れる」とだけあり、書き方の例と、相互に結ばれているかの確かめ方がない", "コードの例と、相互の結びつきを確かめるスクリプト"],
              ["Googleの説明と、AIについて分かっていないことが分けて書かれていない", "公式の説明・観察の例・分かっていないことの表"],
              ["言語ごとにずれやすい事実（営業時間・価格・電話番号など）の扱いがない", "言語でそろえる事実と、言語ごとに変えるものの表"],
              ["WordPress（Polylang・WPML）での手順がない", "プラグインごとの hreflang の出方と、公開前に見る場所"],
              ["制作会社の見積もり・保守での扱いがない", "見積もりに書く範囲の表と、毎月の確認の項目"],
            ],
            caption: "翻訳ツールの会社による引用の増加率などの数字は、件数や調べ方が書かれていないため使っていません。",
          },
        },
        {
          heading: "わかっていること・わかっていないこと",
          paragraphs: [
            "多言語サイトのAI対策では、検索エンジンの公式の説明と、AIについての推測が混ざって語られがちです。お客様への説明では、次のように分けておくと誤解がありません。",
          ],
          table: {
            head: ["内容", "分類と出典"],
            rows: [
              ["Googleはページの言語を、見えている本文から判断する。lang 属性やURLは使わない", `Googleの説明（[多言語・多地域のサイトの管理](${SRC.multiJa})）`],
              ["Googleは hreflang や lang 属性を言語の判定には使わない。hreflang は、同じ内容の各言語版をGoogleに知らせるためのもの", `Googleの説明（[ローカライズ版について知らせる](${SRC.localizedJa})）`],
              ["2つのページが互いを指していないと、その hreflang は無視される", `Googleの説明（[ローカライズ版について知らせる](${SRC.localizedJa})）`],
              ["AIで訳した内容は、それだけでスパムとはされない。ただし、価値の少ないページを大量に作ることはスパムのポリシーの対象で、その例に「翻訳などの自動の変換」が入っている", `Googleの説明（[スパムに関するポリシー](${SRC.spam})、Googleのコメントは[Search Engine Roundtable](${SRC.serTranslate})・[GSQi](${SRC.gsqiTranslate})、2025年6月）`],
              ["Bingでは、hreflang は content-language よりずっと弱い手がかり", `Bingの担当者の発言（[Search Engine Roundtable](${SRC.bing})、2020年9月。古い発言なので今も同じかは不明）`],
              ["ChatGPT・Perplexity・Claude が hreflang を読むか、どの言語のページを出典に選ぶか", "公式の説明は見つからず、分かっていない"],
            ],
          },
          after: [
            `参考になる観察の例として、SEOコンサルタントの Glenn Gabe が、Googleの文書やCloudflareの記事など、各言語版があるページについてフランス語・イタリア語・スペイン語で各AIに質問し、出典のURLの言語を記録しています（[GSQi](${SRC.gsqiAi})、2025年12月）。GoogleのAIモードとAIによる概要、Copilotは質問の言語に合ったページを出すことが多く、ChatGPTとClaudeは3つの例すべてで米国の英語版を出典にしていました。Perplexityは1つの例だけ正しい言語でした。例は3つだけで、本人も「完璧な方法ではない」と書いているので、傾向の参考にとどめてください。`,
            "このため、制作会社としては「AIに各言語のページを選ばせる」ことより、「どの言語のページが出典にされても、事実が正しく、ほかの言語のページへたどれる」状態を作ることを目標にするのが現実的です。",
          ],
        },
        {
          heading: "設計で決めること：URLの分け方と、言語の切り替え",
          paragraphs: [
            "Googleは、言語ごとに別のURLを使うことをすすめ、Cookieやブラウザの設定でページの言語を切り替えることはすすめていません。URLの分け方には次の選択肢があります。",
          ],
          table: {
            head: ["分け方", "向いている場合と注意"],
            rows: [
              ["サブディレクトリ（example.jp/en/）", "1つのドメインで管理でき、WordPressの多言語プラグインでも作りやすい。中小のサイトではまずこれを検討する"],
              ["サブドメイン（en.example.jp）", "言語ごとに別のサーバーやシステムを使う場合。URLだけでは対象の国が分かりにくい"],
              ["国別のドメイン（example.de など）", "国ごとに会社や在庫が違う場合。費用と管理の手間が大きく、ドメインごとの条件もある"],
              ["URLのパラメータ（?lang=en）", "Googleは非推奨としている。新しく作るサイトでは使わない"],
            ],
            caption: "Googleの「多言語・多地域のサイトの管理」の表をもとに、制作会社の判断の目安を足しています。",
          },
          after: [
            "言語の自動の切り替え（IPアドレスやブラウザの言語を見て別の言語のページへ転送すること）は避け、各ページに他の言語へのリンクを置きます。Googleは、Googlebotは通常米国から、Accept-Language を送らずにクロールすると説明しており、自動の転送があると一部の言語のページが読まれないおそれがあります。AIのクローラーも同じように、決まった場所から言語の指定なしで来ることが多いと考えておくと安全です。",
            "1つのページには1つの言語だけを書き、原文と訳を並べる形は避けます。ナビゲーションやフッターだけを訳して本文が日本語のままのページは、Googleでは重複として扱われやすくなります。訳していない本文のページは、その言語のページとして作らない方が安全です。",
          ],
        },
        {
          heading: "どの言語でもそろえる事実と、言語ごとに変えるもの",
          paragraphs: [
            "AIが英語版を出典にして日本語で答えることもありえます。言語ごとに更新の時期がずれると、古い営業時間や価格が別の言語で答えられます。次の表のうち「そろえる」ものは、すべての言語で同じ値にします。",
          ],
          table: {
            head: ["項目", "そろえる／変える"],
            rows: [
              ["営業時間・定休日・臨時休業", "そろえる。日本語だけ更新して他の言語が古いままになりやすいので、更新の手順に全言語を入れる"],
              ["価格・税込か税抜か・通貨", "金額はそろえる。日本円の価格は他の言語でも円で書き、参考の外貨は「目安」と書く"],
              ["電話番号", "そろえる。海外からかける人のために +81 の形も書く"],
              ["住所・地図", "同じ場所を指す。英語では番地・町名・市区町村・都道府県・郵便番号の順など、その言語で通じる書き方にする"],
              ["店名・会社名", "正式な表記を1つ決め、他の言語ではローマ字や訳の名前を添える（例：Sakura Soba（さくら蕎麦））"],
              ["予約・問い合わせの方法", "そろえる。外国語で受けられない窓口は、その旨を書く"],
              ["対応できる言語・支払い方法・アレルギー表示など", "その言語の利用者が知りたいことを足す。事実は日本語のページにも書く"],
              ["見出し・説明の言い回し", "変える。直訳ではなく、その言語で検索される言い方にする"],
            ],
          },
          after: [
            `JNTOのインタビュー記事でも、訪日旅行者が生成AIで情報を集めるようになり、多言語サイトでは事実を分かりやすく書くことが大事だと述べられています（[JNTO](${SRC.jnto})、2026年9月30日）。`,
          ],
        },
        {
          heading: "hreflang の書き方と、よくある間違い",
          paragraphs: [
            "hreflang は、HTMLの link 要素、HTTPヘッダー、サイトマップのどれで書いてもよく、Googleはこの3つを同じものとして扱います。WordPressでは、多言語プラグインが head に link 要素を出すのが一般的です。書き方の例は次のとおりです。",
          ],
          code: HREFLANG,
          table: {
            head: ["よくある間違い", "正しい形"],
            rows: [
              ["日本語のページだけに入れ、英語のページには入れていない", "すべての言語のページに、自分自身を含めた全言語の行を入れる（相互に指していないと無視される）"],
              ["相対パス（/en/access/）で書いている", "https から始まる完全なURLで書く"],
              ["jp・en-UK・es-419 などの誤ったコード", "言語は ISO 639-1（ja・en）、地域は ISO 3166-1（en-GB）。国のコードだけは使えない。中国語の繁体字は zh-Hant または zh-TW"],
              ["転送されるURLや、noindex のページを載せている", "そのまま表示される、検索に出してよいページだけを載せる"],
              ["翻訳していないページにも全言語の行を出している", "訳したページだけを載せる。訳が後から増えるなら、増えたときに行を足す"],
            ],
          },
          after: [
            "x-default は、どの言語にも当てはまらない人に見せるページです。言語を選ぶページや、海外の人の多くが読める英語版を指定するのが一般的です。",
            "このサイト（nurevo.jp）も41の言語で記事を出していますが、日本語と英語しかない記事では、hreflang に日本語・英語（と英語の地域）・x-default だけを載せ、訳を足したときにその言語の行を足しています。存在しない言語のページを載せないためです。",
          ],
        },
        {
          heading: "相互に結ばれているかを確かめるスクリプト",
          paragraphs: [
            "プラグインが hreflang を出していても、一部のページだけ訳がない、URLを変えた、転送を入れたといった理由で、相互の結びつきが切れることがあります。次のスクリプトは、1つのページから各言語のページを開き、互いに載せているかと、html の lang 属性を一覧にします（Python 3 の標準ライブラリだけで動きます）。",
          ],
          code: SCRIPT,
          after: [
            "公開前にはトップ・アクセス・料金・よくある質問など事実の多いページで、保守では毎月数ページを選んで動かします。NOT_RECIPROCAL や REDIRECTED が出たら、そのページの翻訳の紐づけ（プラグインの「翻訳」の設定）とURLを確かめます。Googleは lang 属性を言語の判定に使わないとしていますが、画面の読み上げや他のツールのために、言語ごとに正しい値にしておきます。",
          ],
        },
        {
          heading: "構造化データと llms.txt：言語ごとに何を変えるか",
          paragraphs: [
            "会社や店の構造化データ（LocalBusiness や Organization）は、どの言語のページでも同じ1つの会社・店を表します。言語ごとに別の会社のように見えないよう、次のようにするのがおすすめです（これはGoogleの決まりではなく、この記事のすすめ方です）。",
          ],
          list: [
            "会社・店のノードの @id は全言語で同じにする（例：https://example.jp/#business）。電話番号・住所・営業時間の値も同じにする。",
            "name はその言語のページで通じる表記にし、正式な日本語の表記を alternateName に入れる（逆でもよいが、全言語で同じ方針にする）。",
            "ページのノード（WebPage など）の inLanguage を、そのページの言語にする（ja・en・zh-Hant など）。",
            "FAQPage などの質問と答えは、そのページに見えている言語の文章で書く。見えていない言語の質問を構造化データだけに入れない。",
            "llms.txt はサイトの直下に1つ置くのが一般的です。主な言語で書き、他の言語のトップページへのリンクを載せておくと、どの言語の入口があるかが伝わります。",
          ],
        },
        {
          heading: "WordPressでの手順（Polylang・WPML と Nurevo AEO）",
          paragraphs: [
            `WordPressの多言語プラグインの代表は Polylang と WPML で、どちらも hreflang を自動で出します（[Polylang の説明](${SRC.polylang})、[WPML の説明](${SRC.wpml})）。違いと確かめる場所は次のとおりです。`,
          ],
          list: [
            "Polylang：WordPressの言語の設定（en_US など）を hreflang の形（en-US）に変えて出します。x-default は初期設定ではトップページだけで、他のページにも出したい場合はフィルター（pll_rel_hreflang_attributes）で足すと説明されています。",
            "WPML：言語の設定の画面で、言語ごとに hreflang のコードを変えられます（地域を付けるなど）。WPMLは誤った形式のコードを警告できないと説明しているので、入力したコードを上の表で確かめます。",
            "SEOプラグインやテーマが別に hreflang を出していないか、ページのソースで hreflang の行が1組だけかを確かめます。",
            "言語ごとのページで、ブラウザの「ページのソースを表示」から html の lang 属性と hreflang を見て、上のスクリプトでも確かめます。",
            `無料のプラグイン[Nurevo AEO](${WP_ORG})は、ページの構造化データの inLanguage に WordPress の言語の設定（get_bloginfo('language')）を入れます。Polylang・WPML 専用の処理はないので、言語ごとのページで inLanguage がその言語になっているかを確かめてください。会社・店の情報は1組の設定なので、全言語で同じ事実が出ます。llms.txt はサイトの言語で1つ作ります。`,
            "公開の前に、全言語の主要なページについて、営業時間・価格・電話番号を日本語のページと見比べます。",
          ],
        },
        {
          heading: "言語ごとの確かめ方",
          list: [
            "質問の一覧を言語ごとに作る（例：「◯◯駅 近く そば 英語メニュー」を英語・中国語・韓国語で）。直訳ではなく、その言語の人が実際に聞きそうな言い方にする。",
            "AIの設定の言語や、使うアカウントの言語を変えて聞き、回答の言語・出典のURLの言語・事実が正しいかを記録する。",
            "Search Console の検索パフォーマンスで、ページを /en/ などのディレクトリで絞り、国ごとの表示回数を見る。",
            "アクセス解析で、AIのサービスからの流入を言語のディレクトリごとに見る。",
            "誤った事実が出たら、出典のページの言語と更新日を確かめ、その言語のページを直す。",
          ],
          after: [
            "AIの回答は聞くたびに変わるので、1回の結果で判断せず、月ごとの記録で比べます。測り方の全体は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
          ],
        },
        {
          heading: "見積もりと保守契約に書くこと",
          table: {
            head: ["項目", "書いておくこと"],
            rows: [
              ["翻訳", "誰が訳すか（お客様・翻訳会社・機械翻訳＋確認）。機械翻訳だけで公開しないこと、確認する人"],
              ["訳すページの範囲", "全ページか、トップ・アクセス・料金・FAQなど事実の多いページだけか。訳さないページの扱い"],
              ["事実の更新", "営業時間や価格を変えたとき、全言語をいつまでに更新するか。更新を頼む窓口"],
              ["技術の範囲", "URLの分け方、hreflang、言語の切り替えのリンク、構造化データ、llms.txt の設定"],
              ["毎月の確認", "hreflang の相互の確認（数ページ）、言語ごとの事実の見比べ、言語ごとのAIの質問の記録"],
            ],
          },
          after: [
            "新しくサイトを作るときの工程全体は[新規制作でAI検索に対応する手順](/guide/agency-new-site-build-ai-search)、月額のサービスの組み立て方は[AI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)にまとめています。",
          ],
        },
        {
          heading: "公開前と毎月のチェックリスト",
          list: [
            "言語ごとに別のURLがあり、1つのページには1つの言語だけが書かれている",
            "IPアドレスやブラウザの言語による自動の転送をしていない。各ページに他の言語へのリンクがある",
            "hreflang が全言語のページで相互に載っていて、完全なURL・正しいコードで書かれている",
            "訳していないページや、転送・noindex のページを hreflang に載せていない",
            "x-default を決めている（言語を選ぶページか英語版）",
            "html の lang 属性と、構造化データの inLanguage がページの言語になっている",
            "会社・店の構造化データが全言語で同じ @id・同じ電話番号・住所・営業時間",
            "営業時間・価格・予約の方法が、全言語で日本語のページと同じ",
            "機械翻訳した文章を、その言語が分かる人が確認している",
            "言語ごとのAIへの質問と回答を、日付つきで記録している",
          ],
        },
        {
          heading: "制作会社がNurevoを使う場合",
          paragraphs: [
            `お客様のサイトごとに無料のプラグインを入れると、構造化データ・llms.txt・AIのクローラーの許可を整えたうえで、言語ごとの確認を保守の項目にできます。Standardは月3,000円です。パートナー制度は[パートナーのページ](${PARTNER})をご覧ください。`,
          ],
        },
      ],
      faqs: [
        { q: "hreflang を入れれば、ChatGPTやPerplexityで各言語のページが出典になりますか？", a: "分かりません。ChatGPT・Perplexity・Claude が hreflang を使うという公式の説明は見つかっていません。試した例では英語版を出典にすることも多かったので、どの言語のページが出典になっても事実が正しい状態にしておくことを優先してください。" },
        { q: "機械翻訳で多言語のページを作ってもいいですか？", a: "GoogleはAIで訳した内容をそれだけでスパムとはしていませんが、価値の少ないページを大量に作ることはスパムのポリシーの対象です。機械翻訳を使う場合も、その言語が分かる人が事実と表現を確かめてから公開してください。" },
        { q: "全ページを翻訳しないといけませんか？", a: "いいえ。トップ、アクセス、料金、予約、よくある質問など、その言語の利用者が必要とするページから始めて構いません。訳していないページは、その言語のページとして作らず、hreflang にも載せません。" },
        { q: "ブラウザの言語で自動的に英語のページへ切り替えるのはだめですか？", a: "Googleは自動の転送を避け、他の言語へのリンクを置くことをすすめています。クローラーは言語の指定なしで来ることが多く、自動の転送があると一部の言語のページが読まれないおそれがあります。" },
        { q: "日本語の店名と英語の店名、どちらを構造化データに入れればいいですか？", a: "そのページの言語で通じる表記を name に、もう一方を alternateName に入れる形がおすすめです。全言語で会社・店のノードの @id と、電話番号・住所・営業時間の値は同じにします。" },
        { q: "中国語は簡体字と繁体字の両方が必要ですか？", a: "お客様の利用者によります。台湾・香港からの利用者が多い場合は繁体字（zh-Hant や zh-TW）、中国本土からが多い場合は簡体字（zh-Hans や zh-CN）を用意し、両方作るならそれぞれ別のURLにして hreflang で結びます。" },
        { q: "多言語にすれば、海外の人のAIの回答に出るようになりますか？", a: "保証はできません。AIの回答は日や聞き方、使う人の言語で変わります。多言語のページを整えることは、出たときに正しい事実で紹介され、その言語のページへたどれるようにするための前提です。" },
      ],
      relatedHeading: "関連するガイド",
      cta: {
        heading: "お客様のサイトを、AIがどう読んでいるか確認",
        body: "無料のチェックは登録不要です。URLを入れると、構造化データ・llms.txt・AIのクローラーの許可の状態が分かります。言語ごとのページのURLでも試せます。",
        label: "AIへの読まれ方を無料でチェック",
        href: "/check",
        secondary: { label: "パートナー制度を見る", href: PARTNER },
      },
      footnote: "Google・Gemini はGoogle LLC、ChatGPTはOpenAI、PerplexityはPerplexity AI、ClaudeはAnthropic、Bing・CopilotはMicrosoft Corporationの商標です。WordPressはWordPress Foundationの商標です。Polylang・WPML・DeepL・Weglotは、それぞれの権利者の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "AI search for multilingual sites: an agency checklist | Nurevo",
      description: "How agencies make search engines and AI read each language of a multilingual site correctly: URLs, hreflang, identical facts, machine translation, WordPress checks.",
      h1: "AI search for multilingual sites: how agencies design and check each language version",
      lead: "To have AI and search engines read a multilingual site correctly, check four things when you build it and every month after: one language per page, a separate URL for each language, hreflang linking every language version both ways, and the same facts - opening hours, prices, address - in every language. Google says it decides a page's language from its visible content, not from the lang attribute or hreflang. ChatGPT and Perplexity have published nothing on how they treat hreflang, and in one set of tests they often cited the English version, so the facts must be right in whichever language version gets cited.",
      intro: [
        "Written 24 November 2026 (JST). For agencies and freelancers who build or maintain multilingual sites: hotels, restaurants and attractions serving overseas visitors, manufacturers with foreign buyers, clinics that see international patients. Google's guidance is as published in Search Central when this was written.",
        "AI answers change by day, by wording and by the user's language settings. These steps set up the conditions for being read correctly; they do not guarantee an appearance in AI answers or any ranking.",
      ],
      sections: [
        {
          heading: "What the top-ranking guides cover, and what they leave out",
          paragraphs: [
            "On 24 November 2026 we read six Japanese and six English pages that rank for queries such as \"multilingual website AI search\" and \"multilingual GEO\" (one Japanese page redirected to another site and was not read). In Japanese: uravation (updated 5 September 2026), a Weglot article on DeepL's blog (updated 19 June), GOOD LUCK TRIP (updated 21 March 2025), an interview by JNTO, the Japan National Tourism Organization (30 September), and Digima (11 March). In English: GSQi by Glenn Gabe (1 December 2025), Weglot (updated 10 August), RWS (28 April), Lokalise (16 November), eSEOspace (13 October) and MultiLipi (27 May).",
            "Most of the English pages come from companies that sell translation tools, and several quote figures like \"hundreds of percent more AI citations after translating\" with no method. Many Japanese pages do not mention AI search at all. These points were mostly missing:",
          ],
          table: {
            head: ["What was missing", "What this guide covers"],
            rows: [
              ["\"Add hreflang\", with no example and no way to check that versions point to each other", "A code example and a script that checks reciprocity"],
              ["Google's guidance and unknowns about AI mixed together", "A table separating official guidance, observations and unknowns"],
              ["Nothing on facts that drift between languages (hours, prices, phone numbers)", "A table of facts to keep identical and things to localise"],
              ["No WordPress steps (Polylang, WPML)", "How each plugin outputs hreflang and where to check before launch"],
              ["Nothing on quotes or care plans", "A scope table for quotes and a monthly check list"],
            ],
            caption: "Citation-uplift figures from translation vendors are left out because they do not state how many sites were checked or how.",
          },
        },
        {
          heading: "What is known, and what is not",
          paragraphs: [
            "Advice on multilingual AI optimisation often mixes official search-engine guidance with guesses about AI. Separating them avoids misleading clients.",
          ],
          table: {
            head: ["Statement", "Type and source"],
            rows: [
              ["Google decides a page's language from its visible content, not the lang attribute or the URL", `Google guidance ([Managing multi-regional and multilingual sites](${SRC.multiEn}))`],
              ["Google does not use hreflang or the lang attribute to detect language; hreflang tells Google about the language versions of the same content", `Google guidance ([Tell Google about localized versions](${SRC.localizedEn}))`],
              ["If two pages do not both point to each other, the tags are ignored", `Google guidance ([Tell Google about localized versions](${SRC.localizedEn}))`],
              ["Content translated by AI is not spam in itself, but mass-producing low-value pages is covered by the spam policy, whose examples include \"automated transformations\" such as translating", `Google guidance ([Spam policies](${SRC.spam}); Google's comment via [Search Engine Roundtable](${SRC.serTranslate}) and [GSQi](${SRC.gsqiTranslate}), June 2025)`],
              ["At Bing, hreflang is a far weaker signal than content-language", `A Bing engineer's remark ([Search Engine Roundtable](${SRC.bing}), September 2020; old, may have changed)`],
              ["Whether ChatGPT, Perplexity or Claude read hreflang, and which language version they cite", "No official documentation found; unknown"],
            ],
          },
          after: [
            `One useful set of observations: SEO consultant Glenn Gabe asked several AI tools questions in French, Italian and Spanish about pages that exist in many languages (Google documentation, a Cloudflare post) and recorded the language of the cited URL ([GSQi](${SRC.gsqiAi}), December 2025). Google's AI Mode and AI Overviews and Copilot mostly cited the version in the question's language; ChatGPT and Claude cited the US English version in all three examples; Perplexity got the language right in one. With three examples, and the author calling it \"not a perfect science\", treat this as a hint, not a rule.`,
            "So rather than trying to make AI pick each language version, a realistic agency goal is a site where whichever language version is cited has correct facts and links to the other languages.",
          ],
        },
        {
          heading: "Design decisions: URL structure and language switching",
          paragraphs: [
            "Google recommends a separate URL for each language and advises against switching the page language with cookies or browser settings. The options:",
          ],
          table: {
            head: ["Structure", "When it fits, and cautions"],
            rows: [
              ["Subdirectory (example.jp/en/)", "One domain to manage and easy with WordPress multilingual plugins. The first option to consider for small and mid-sized sites"],
              ["Subdomain (en.example.jp)", "When each language runs on a different server or system. The target country is not obvious from the URL"],
              ["Country domain (example.de)", "When each country has its own company or stock. Costly to run, and each domain has its own rules"],
              ["URL parameter (?lang=en)", "Google does not recommend it. Do not use it on new sites"],
            ],
            caption: "Based on the table in Google's guide to multi-regional sites, with our notes for agencies.",
          },
          after: [
            "Avoid automatic switching - redirecting visitors to another language based on IP address or browser language - and put links to the other languages on every page. Google says Googlebot usually crawls from the US without sending Accept-Language, so automatic redirects can stop some language versions being read. It is safest to assume AI crawlers also arrive from fixed locations without a language preference.",
            "Write one language per page and avoid side-by-side original and translation. Pages where only the navigation and footer are translated while the main text stays in Japanese tend to be treated as duplicates by Google; it is safer not to publish an untranslated page as a language version.",
          ],
        },
        {
          heading: "Facts to keep identical, and what to localise",
          paragraphs: [
            "An AI may cite the English page and answer in Japanese, or the other way round. If languages are updated at different times, old hours or prices get quoted in another language. Everything marked \"keep identical\" below must have the same value in every language.",
          ],
          table: {
            head: ["Item", "Keep identical / localise"],
            rows: [
              ["Opening hours, closing days, temporary closures", "Keep identical. Japanese often gets updated while other languages lag, so put every language into the update routine"],
              ["Prices, tax-inclusive or not, currency", "Keep the amount identical. Show yen prices in yen in every language and label any foreign-currency figure as approximate"],
              ["Phone number", "Keep identical, and add the +81 form for callers from abroad"],
              ["Address and map", "The same place, written in the order readers of that language expect"],
              ["Business name", "Decide one official form and add a romanised or translated name in other languages, e.g. Sakura Soba (さくら蕎麦)"],
              ["How to book or contact", "Keep identical. If a channel cannot handle a language, say so"],
              ["Languages spoken, payment methods, allergen information", "Add what visitors in that language need, and put the facts on the Japanese page too"],
              ["Headings and wording", "Localise: write what people in that language actually search for, not a literal translation"],
            ],
          },
          after: [
            `JNTO's interview also notes that overseas visitors increasingly gather travel information with generative AI, and that multilingual sites should state facts clearly ([JNTO](${SRC.jnto}), 30 September 2026, in Japanese).`,
          ],
        },
        {
          heading: "Writing hreflang, and common mistakes",
          paragraphs: [
            "hreflang can go in HTML link elements, HTTP headers or the sitemap; Google treats the three as equivalent. On WordPress, multilingual plugins usually print link elements in the head. An example:",
          ],
          code: HREFLANG_EN,
          table: {
            head: ["Common mistake", "Correct form"],
            rows: [
              ["Tags on the Japanese page only, none on the English page", "Every language version lists all versions including itself (tags that do not point both ways are ignored)"],
              ["Relative paths (/en/access/)", "Full URLs starting with https"],
              ["Wrong codes such as jp, en-UK or es-419", "Language in ISO 639-1 (ja, en), region in ISO 3166-1 (en-GB). A country code alone is not valid. Traditional Chinese: zh-Hant or zh-TW"],
              ["Listing URLs that redirect or are noindex", "List only pages that load directly and may appear in search"],
              ["Printing every language on pages that are not translated", "List only translated versions, and add a line when a translation is added"],
            ],
          },
          after: [
            "x-default is the page for people whose language matches none of the versions - usually a language selector or the English version.",
            "This site, nurevo.jp, publishes guides in 41 languages. Articles that exist only in Japanese and English list only Japanese, English (with its regional variants) and x-default in hreflang, and a language is added when its translation is published, so no tag ever points to a page that does not exist.",
          ],
        },
        {
          heading: "A script to check that versions point to each other",
          paragraphs: [
            "Even when a plugin prints hreflang, reciprocity breaks when some pages lack a translation, a URL changes or a redirect is added. This script opens every language version listed on one page, checks that each lists itself and the starting page, and shows the html lang attribute. It needs only Python 3's standard library.",
          ],
          code: SCRIPT_EN,
          after: [
            "Before launch, run it on pages full of facts: home, access, prices, FAQ. In maintenance, run it on a few pages each month. On NOT_RECIPROCAL or REDIRECTED, check the page's translation link in the plugin and its URL. Google does not use the lang attribute to detect language, but screen readers and other tools do, so keep it correct for each language.",
          ],
        },
        {
          heading: "Structured data and llms.txt: what changes per language",
          paragraphs: [
            "Business structured data (LocalBusiness or Organization) describes the same single business on every language version. So it does not look like a different business per language, we suggest the following (this is our recommendation, not a Google rule):",
          ],
          list: [
            "Use the same @id for the business node in every language (e.g. https://example.jp/#business), with the same phone number, address and opening hours.",
            "Put the name readers of that page understand in name, and the official Japanese form in alternateName (or the other way round, but the same rule in every language).",
            "Set inLanguage on the page node (WebPage etc.) to that page's language: ja, en, zh-Hant and so on.",
            "Write FAQPage questions and answers in the language visible on the page. Do not put questions in structured data in a language the page does not show.",
            "llms.txt usually sits once at the site root. Write it in the main language and link to the home page of each other language so readers can see which language entrances exist.",
          ],
        },
        {
          heading: "WordPress steps (Polylang, WPML and Nurevo AEO)",
          paragraphs: [
            `The two main WordPress multilingual plugins, Polylang and WPML, both print hreflang automatically ([Polylang documentation](${SRC.polylang}), [WPML documentation](${SRC.wpml})). Differences and where to check:`,
          ],
          list: [
            "Polylang converts the WordPress locale (en_US) into hreflang form (en-US). By default it prints x-default on the home page only; to add it elsewhere, its documentation shows a filter (pll_rel_hreflang_attributes).",
            "WPML lets you change each language's hreflang code (for example to add a region) in its language settings. WPML says it cannot warn you about an invalid format, so check the codes against the table above.",
            "Make sure no SEO plugin or theme prints a second set of hreflang tags: view the page source and look for exactly one set.",
            "On each language version, use View Source to check the html lang attribute and hreflang, then run the script above.",
            `The free plugin [Nurevo AEO](${WP_ORG}) sets inLanguage in the page's structured data from the WordPress language setting (get_bloginfo('language')). It has no Polylang- or WPML-specific code, so check that inLanguage matches the language on each version. Business details are one set of settings, so every language shows the same facts. llms.txt is built once, in the site's language.`,
            "Before launch, compare opening hours, prices and phone numbers on the key pages of every language with the Japanese pages.",
          ],
        },
        {
          heading: "Checking each language",
          list: [
            "Write a question list per language, e.g. \"soba near X station English menu\" in English, Chinese and Korean - phrased the way people in that language would ask, not translated word for word.",
            "Ask with the AI tool's language setting (or the account's language) changed, and record the answer's language, the cited URL's language and whether the facts are right.",
            "In Search Console's performance report, filter pages by directory such as /en/ and look at impressions by country.",
            "In your analytics, look at visits from AI services per language directory.",
            "When a wrong fact appears, check the cited page's language and last update, and fix that language version.",
          ],
          after: [
            "AI answers change every time, so compare monthly records rather than one result. The full method is in [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "What to put in the quote and the care plan",
          table: {
            head: ["Item", "What to state"],
            rows: [
              ["Translation", "Who translates (the client, a translation agency, or machine translation plus review). That nothing goes live on machine translation alone, and who reviews"],
              ["Pages to translate", "All pages, or only fact-heavy ones such as home, access, prices and FAQ. What happens to untranslated pages"],
              ["Fact updates", "How soon every language is updated when hours or prices change, and who to ask"],
              ["Technical scope", "URL structure, hreflang, language-switch links, structured data, llms.txt"],
              ["Monthly checks", "hreflang reciprocity on a few pages, comparing facts across languages, recording AI questions per language"],
            ],
          },
          after: [
            "The whole build process is in [building a new site for AI search](/guide/agency-new-site-build-ai-search), and how to package a retainer is in [turning AI search work into a monthly service](/guide/agency-aeo-monthly-service).",
          ],
        },
        {
          heading: "Launch and monthly checklist",
          list: [
            "Each language has its own URL, and each page contains one language",
            "No automatic redirects by IP or browser language; every page links to the other languages",
            "hreflang is reciprocal on every language version, with full URLs and valid codes",
            "No untranslated, redirected or noindex pages in hreflang",
            "x-default is decided (a language selector or the English version)",
            "The html lang attribute and structured data inLanguage match the page's language",
            "The business node has the same @id, phone, address and hours in every language",
            "Hours, prices and booking method match the Japanese pages in every language",
            "Machine-translated text has been reviewed by someone who knows the language",
            "AI questions and answers per language are recorded with dates",
          ],
        },
        {
          heading: "If your agency uses Nurevo",
          paragraphs: [
            `Install the free plugin on each client site to set up structured data, llms.txt and AI crawler access, then add the per-language checks to your care plan. Standard is USD 20 a month. See the [partner page](${PARTNER}) for the partner programme.`,
          ],
        },
      ],
      faqs: [
        { q: "If I add hreflang, will ChatGPT and Perplexity cite each language version?", a: "Unknown. We found no official statement that ChatGPT, Perplexity or Claude use hreflang, and in published tests they often cited the English version. Make sure the facts are correct whichever language version gets cited." },
        { q: "Can I build the language versions with machine translation?", a: "Google does not treat AI-translated content as spam in itself, but mass-producing low-value pages is covered by its spam policy. If you use machine translation, have someone who knows the language check facts and wording before publishing." },
        { q: "Do I have to translate every page?", a: "No. Start with what visitors in that language need: home, access, prices, booking and FAQ. Do not publish untranslated pages as language versions, and leave them out of hreflang." },
        { q: "Is it wrong to switch to English automatically based on the browser language?", a: "Google recommends avoiding automatic redirects and linking to the other languages instead. Crawlers often arrive without a language preference, so redirects can stop some versions being read." },
        { q: "Should structured data use the Japanese or the English business name?", a: "We suggest the name readers of that page understand in name and the other form in alternateName. Keep the business node's @id, phone number, address and hours the same in every language." },
        { q: "Do I need both Simplified and Traditional Chinese?", a: "It depends on the client's visitors. Many from Taiwan or Hong Kong call for Traditional (zh-Hant or zh-TW), many from mainland China for Simplified (zh-Hans or zh-CN). If you make both, give each its own URL and link them with hreflang." },
        { q: "Will a multilingual site appear in AI answers for overseas users?", a: "That cannot be guaranteed. AI answers vary by day, wording and the user's language. A well-built multilingual site makes sure that when it does appear, the facts are right and people can reach the page in their language." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads your client's site",
        body: "The free check needs no sign-up. Enter a URL to see the state of structured data, llms.txt and AI crawler access. You can test each language version's URL too.",
        label: "Check how AI reads a site - free",
        href: "/check",
        secondary: { label: "See the partner programme", href: PARTNER },
      },
      footnote: "Google and Gemini are trademarks of Google LLC; ChatGPT of OpenAI; Perplexity of Perplexity AI; Claude of Anthropic; Bing and Copilot of Microsoft Corporation. WordPress is a trademark of the WordPress Foundation. Polylang, WPML, DeepL and Weglot are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies.",
    },
  },
};
