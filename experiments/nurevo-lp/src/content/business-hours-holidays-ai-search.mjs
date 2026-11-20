// Content page: how to publish opening hours, regular closing days, public
// holidays, year-end/New Year closures and temporary closures so AI search
// (Google AI Overviews / AI Mode, ChatGPT, Perplexity, Gemini) answers "is it
// open?" correctly. For every business with a place people visit; the
// industry pages (pharmacy, clinics, restaurants) link here for the hours
// mechanics.
//
// Written 2026-11-20 (JST). Product facts come from the plugin (0.9.2):
// - nurevo-webmcp.php: one free-text "営業時間" field (business_hours).
//   webmcp_canary_opening_hours_specification(): conservative parser; common
//   Japanese/English forms ("10:00-19:00 火曜定休", "Tu-Su 11-20",
//   "Mon-Fri 9:00-18:00 / Sat 10:00-15:00", Japanese day names, wave dashes,
//   full-width digits) become openingHoursSpecification; anything else
//   (public holidays, "第2火曜", last-order notes, unknown words, a time with no
//   days) is published as openingHours text exactly as typed - never both.
//   "24:00" closes -> 23:59; "18:00-02:00" kept as overnight; "9-5" with no
//   am/pm is rejected (kept as typed); "9-5pm" = 9am-5pm. No specialOpeningHoursSpecification output.
// - llms.txt "## Key facts" has "- Hours: <field as typed>" for a local site;
//   online shop / B2B site types publish no hours (includes/site-types.php).
// - Filter webmcp_canary_business_node ($org, $settings) runs before
//   coexistence; openingHoursSpecification from the parser is a list.
// - Coexistence by measurement: if the SEO plugin/theme publishes a complete
//   business node (name, url, address, telephone, hours), Nurevo publishes no
//   business node of its own (so the filter has no effect); partial -> fills
//   gaps under the other plugin's @id. Rival measurement cached for a day.
// - Connected sites send the business details twice a day to the service.
// - Free AI check: 3 unbranded questions a month on Perplexity; Pro (beta,
//   月14,800円〜 / USD 99) up to 20 questions on Perplexity (ChatGPT once set up).
//
// Outside facts and where they were read (2026-11-20):
// - Google Search Central, LocalBusiness structured data (ja updated
//   2026-09-12, en 2026-09-08): openingHoursSpecification recommended;
//   opens/closes hh:mm(:ss), dayOfWeek, validFrom/validThrough; overnight =
//   one spec Saturday 18:00-03:00; 24h = 00:00-23:59; closed all day =
//   00:00-00:00; holiday closure = validFrom/validThrough with 00:00-00:00
//   (example 2015-12-23..2016-01-05, labelled 年末年始 in ja).
//   specialOpeningHoursSpecification is not mentioned.
// - schema.org V30.1 (2026-09-16): specialOpeningHoursSpecification "override
//   general opening hours"; OpeningHoursSpecification: "open if the opens
//   property is specified, and closed otherwise"; closes earlier than opens =
//   next day. schema-dts 2.1.0: DayOfWeek includes PublicHolidays (no country
//   is defined for it).
// - GBP help 6303076 Special hours: up to 6 days in a row; 7+ days or unknown
//   -> Temporarily closed; "confirm your hours for official holidays, even if
//   they're the same"; overnight split across two dates; must be "Open with
//   main hours" for special hours to show. 15300196: >7 days -> Temporarily
//   closed, <=7 days -> special hours (the two pages differ at exactly 7);
//   "temporarily-closed businesses can rank after open businesses" for broad
//   queries. 15300571: reopen = 決まった営業時間で営業している. 6333474: on listed
//   holidays the profile shows a note that hours may differ (2025-2027 list).
//   3038177 guidelines: seasonal hours as regular hours in season, off-season
//   temporarily closed; no hours in the business name. Seroundtable
//   2025-01-28: special hours "Copy Hours" to other locations (overwrites,
//   includes old entries, <=100 locations - per a LinkedIn post).
// - SEJ (Matt G. Southern, 2026-07-20): Searchable (vendor) test, 64% of UK
//   high-street retailers had at least one false fact; inaccuracy Perplexity
//   10%, Gemini 5%, ChatGPT 4% (as reported by SEJ).
// - Local Search Forum thread (2026-10-12..28): AI Overview showed old hours
//   from 2023 spreadsheet files while GBP was correct; no resolution posted.
// - Top articles read 2026-11-20: uravation local-business (2026-09-05) and
//   inshoku-chain (2026-09-05), GMO koukoku.jp (2026-11-16, no hours),
//   0120.co.jp shobai-ai-131 (2026-10-20, GBP only, no AI), 訪日ラボ x3
//   (paywalled bodies not read), alejandrorioja ja (2026-10-23); SEJ, Cloutly
//   (2026-09-06), PushLeads (2026-10-27), Texta, PinMeTo (2023), Seybold
//   (2015), Locafy x2 (one URL returned another article).
// Not stated on purpose: how fast each AI reflects new hours, any "x% more"
// figures, PushLeads/Locafy statistics, Yext 2024 figures (not verified),
// how ChatGPT/Perplexity use GBP (not published).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  gLocalJa: "https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=ja",
  gLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  schemaOHS: "https://schema.org/OpeningHoursSpecification",
  schemaSpecial: "https://schema.org/specialOpeningHoursSpecification",
  gbpSpecialJa: "https://support.google.com/business/answer/6303076?hl=ja",
  gbpSpecial: "https://support.google.com/business/answer/6303076?hl=en",
  gbpClosedJa: "https://support.google.com/business/answer/15300196?hl=ja",
  gbpClosed: "https://support.google.com/business/answer/15300196?hl=en",
  gbpReopenJa: "https://support.google.com/business/answer/15300571?hl=ja",
  gbpReopen: "https://support.google.com/business/answer/15300571?hl=en",
  gbpHolidaysJa: "https://support.google.com/business/answer/6333474?hl=ja",
  gbpHolidays: "https://support.google.com/business/answer/6333474?hl=en",
  gbpGuideJa: "https://support.google.com/business/answer/3038177?hl=ja",
  gbpGuide: "https://support.google.com/business/answer/3038177?hl=en",
  copyHours: "https://www.seroundtable.com/bulk-manage-special-hours-google-business-profiles-38801.html",
  sej: "https://www.searchenginejournal.com/ai-answers-about-your-locations-are-often-wrong-check-before-customers-do/582205/",
  forum: "https://localsearchforum.com/threads/g-ai-overview-sourcing-old-hoo.63434/post-203933",
  uravationLocal: "https://uravation.com/llmo/local-business-aio-taisaku/",
  uravationChain: "https://uravation.com/llmo/inshoku-chain-llmo-taisaku/",
  kadai: "https://0120.co.jp/blog/shobai-ai-131/",
  rioja: "https://alejandrorioja.com/ja/geo-for-local-business-getting-a-brick-and-mortar-cited-by-ai-search/",
  cloutly: "https://cloutly.com/blog/when-ai-gets-your-business-details-wrong/",
  pushleads: "https://pushleads.com/how-to-fix-business-info-in-ai-search-results-before-wrong-data-costs-you-custom/",
  rich: "https://search.google.com/test/rich-results",
  validator: "https://validator.schema.org/",
};

const JSONLD_JA = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HairSalon",
  "@id": "https://example.jp/#business",
  "name": "ヘアサロン例",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Wednesday", "Thursday", "Friday"],
      "opens": "10:00",
      "closes": "19:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "opens": "00:00",
      "closes": "00:00",
      "validFrom": "2026-12-30",
      "validThrough": "2027-01-03"
    }
  ]
}
</script>
<!-- 火曜は書かない＝定休日。3つ目は年末年始の休業（Googleの例と同じ書き方）。
     本文のお知らせと同じ日付にし、1月4日を過ぎたら消す -->`;

const JSONLD_EN = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HairSalon",
  "@id": "https://example.com/#business",
  "name": "Example Hair Studio",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Wednesday", "Thursday", "Friday"],
      "opens": "10:00",
      "closes": "19:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "opens": "00:00",
      "closes": "00:00",
      "validFrom": "2026-12-24",
      "validThrough": "2026-12-26"
    }
  ]
}
</script>
<!-- Tuesday is left out = closed. The third entry is a holiday closure, written the way
     Google's own example writes it. Use the same dates as the notice on the page and
     delete it once the dates have passed -->`;

const FILTER_JA = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // 年末年始の休業。本文のお知らせと同じ日付にし、期間が過ぎたら消す
    if (!empty($org['openingHoursSpecification']) && is_array($org['openingHoursSpecification'])) {
        $org['openingHoursSpecification'][] = array(
            '@type'        => 'OpeningHoursSpecification',
            'opens'        => '00:00',
            'closes'       => '00:00',
            'validFrom'    => '2026-12-30',
            'validThrough' => '2027-01-03',
        );
    }
    return $org;
}, 10, 2);`;

const FILTER_EN = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // Holiday closure. Same dates as the notice on the page; delete once they have passed
    if (!empty($org['openingHoursSpecification']) && is_array($org['openingHoursSpecification'])) {
        $org['openingHoursSpecification'][] = array(
            '@type'        => 'OpeningHoursSpecification',
            'opens'        => '00:00',
            'closes'       => '00:00',
            'validFrom'    => '2026-12-24',
            'validThrough' => '2026-12-26',
        );
    }
    return $org;
}, 10, 2);`;

const FOOT_JA = "Google、Google 検索、Google マップ、Gemini はGoogle LLC、ChatGPTはOpenAI、PerplexityはPerplexity AIの商標です。WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、ならびに本文で紹介した各社の名称は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。";
const FOOT_EN = "Google, Google Search, Google Maps and Gemini are trademarks of Google LLC, ChatGPT of OpenAI and Perplexity of Perplexity AI. WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and the names of the companies cited in this guide are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.";

export default {
  slug: "business-hours-holidays-ai-search",
  targetQueries: [
    "AI search wrong business hours holiday hours",
    "openingHoursSpecification holiday closure schema",
    "temporarily closed Google Business Profile AI Overviews",
    "営業時間 AI検索 間違える 臨時休業",
    "年末年始 営業時間 構造化データ",
    "定休日 祝日 AIに正しく伝える",
  ],
  related: ["pricing-page-ai-search", "local-business-schema-seo-plugins", "multi-location-business-ai-search", "faq-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "営業時間・定休日・臨時休業をAIに正しく読ませる書き方 | Nurevo",
      description: "AIが「今日は営業していますか」に間違えて答える原因と直し方。定休日・祝日・年末年始・臨時休業の書き方、構造化データ、Googleビジネスプロフィール、WordPressの手順。",
      h1: "営業時間・定休日・祝日・臨時休業をAIに正しく読ませる書き方：年末年始の前にやること",
      lead: "AIに営業時間を正しく答えてもらうには、ふだんの営業時間・定休日・祝日の扱いをHTMLの文字で1か所にまとめて書き、年末年始や臨時休業は「何月何日から何月何日まで、休み（または何時から何時）」と日付つきで、サイト・Googleビジネスプロフィール・構造化データの3か所を同じ日に直します。休みが7日以上続くときや、いつまで休むか決まっていないときは、Googleビジネスプロフィールでは特別営業時間ではなく「臨時休業」を使います。期間が過ぎたお知らせは消すか「終了しました」と書き換え、古い日付を残しません。",
      intro: [
        "作成日：2026年11月20日（JST）。料金の書き方は[料金ページをAIに正しく読ませる書き方](/guide/pricing-page-ai-search)で扱いました。この記事は、店舗・クリニック・教室・事務所など、人が訪れる場所を持つすべての事業者に向けて、「営業しているか」「何時までか」をAIに正しく伝える方法に絞ります。年末年始の休みを決める前に読める形で書きます。",
        "AIの回答は日・聞き方・使うサービスによって変わります。この記事の手順は、AIが営業時間を読み違えにくい状態を作り、正しく確かめるためのもので、回答に出ることや正しく答えられることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "まず結論：AIが営業時間を間違える5つの原因と直し方",
          table: {
            head: ["原因", "AIの答えに起きること", "直し方"],
            rows: [
              ["営業時間が画像・PDF・フッターの小さな文字だけにある", "営業時間を答えられない、または外部サイトの古い値を答える", "店舗情報のページにHTMLの文字で書く。画像は補助にする"],
              ["祝日の扱いが書いていない", "「祝日も営業」「祝日は休み」のどちらかを推測で答える", "「祝日は営業（火曜が祝日の場合も営業）」のように1行で書く"],
              ["年末年始・臨時休業を画像のお知らせやSNSだけで出した", "休みの日に「営業中」と答える", "日付つきの文字のお知らせをサイトに出し、Googleビジネスプロフィールの特別営業時間も設定する"],
              ["期間が過ぎたお知らせ・古い営業時間が残っている", "去年の年末年始や、変更前の営業時間を答える", "期限が過ぎたら消すか「終了しました」に。古いPDF・チラシ・ブログ記事も探す"],
              ["サイト・Googleビジネスプロフィール・ポータルで営業時間が違う", "どれかの値を答える。どれを使うかは分からない", "サイトを基準に決め、他の掲載先を同じ日に直す"],
            ],
          },
          after: [
            `AIの営業時間の間違いは珍しくありません。Search Engine Journal（2026-07-20）は、AI検索の計測会社 Searchable のテストとして、英国の商店街の小売店の64%で、AIの答えに少なくとも1つ誤った事実があったと紹介しています。同じ記事は、間違いが特に問題になるものとして、営業時間と「閉店した」という誤りを挙げています（[Search Engine Journal](${SRC.sej})、調査会社のテストを記事が紹介したもので、対象は英国）。`,
            `Googleビジネスプロフィールを正しくしていても、別の古い資料が使われることがあります。海外のローカル検索の掲示板では、プロフィールとGoogle検索の営業時間は正しいのに、GoogleのAIによる概要が2023年の表計算ファイルにある古い営業時間を答えていた、という報告がありました（[Local Search Forum（2026-10）](${SRC.forum})、解決したという書き込みはありません）。サイトの中や外に残った古い資料も、直す対象に入ります。`,
          ],
        },
        {
          heading: "上位の記事で分かったこと・足りなかったこと",
          paragraphs: [
            "「営業時間 AI検索」「臨時休業 Googleビジネスプロフィール」「AI wrong business hours」「holiday hours schema」などで上位の日本語と英語の記事を読みました（2026-11-20）。どの記事も「サイトとGoogleビジネスプロフィールの情報をそろえる」は共通でした。一方、祝日・年末年始・深夜営業を構造化データでどう書くかの例、特別営業時間と臨時休業の使い分けの基準（7日）、WordPressでの手順、直したあとの確かめ方は、ほとんどの記事にありませんでした。",
          ],
          table: {
            head: ["記事", "よく書けている点", "足りなかった点"],
            rows: [
              [`[Uravation 店舗のAIO対策](${SRC.uravationLocal})・[飲食チェーン](${SRC.uravationChain})（ともに2026-09-05更新）`, "臨時休業・祝日・受付終了をGoogleビジネスプロフィールに書く、「不定休」だけにしない、本文と構造化データの食い違いの例", "年末年始の書き方、構造化データの例、WordPressの手順"],
              [`[課題解決プラットフォーム 特別営業時間の設定ミス](${SRC.kadai})（2026-10-20更新）`, "連休前のチェックリスト、特別営業時間と臨時休業の違い、祝日の設定の例", "AI検索には触れていない。構造化データとサイトの書き方がない"],
              [`[Alejandro Rioja（日本語版、2026-10-23）](${SRC.rioja})`, "openingHoursSpecification のJSON-LDの例", "祝日・休業の例がない。米国向けで日本の祝日の扱いがない"],
              [`[Search Engine Journal（2026-07-20）](${SRC.sej})・[Cloutly（2026-09-06）](${SRC.cloutly})`, "AIの答えの確かめ方（同じ質問を繰り返す、出典を見る）、「閉業」と誤って表示されたときの戻し方", "特別営業時間・臨時休業の設定、構造化データの例"],
              [`[PushLeads（2026-10-27更新）](${SRC.pushleads})`, "祝日の営業時間をプロフィールとサイトでそろえる、直したあと数週間で再確認", "出典のはっきりしない数字が多い。構造化データの例がない"],
            ],
          },
          after: [
            "英語の記事の多くは、掲載管理ツールや診断サービスの宣伝を兼ねていました。日本の祝日・年末年始を、サイト・Googleビジネスプロフィール・構造化データの3か所で同時に扱った記事は見つかりませんでした。この記事はそこを埋めます。",
          ],
        },
        {
          heading: "サイトに書く：営業時間のブロックに入れる6つのこと",
          paragraphs: [
            "AIは「◯◯は日曜に開いている？」「今から行ける？」と聞かれると、ページの営業時間の部分を抜き出して答えます。曜日ごとの時間と例外が離れた場所にあると、例外を落として答えやすくなります。店舗情報のページ（アクセスや会社概要のページ）に、次の6つを1か所にまとめて書きます。",
          ],
          table: {
            head: ["書くこと", "書く例", "抜けると起きること"],
            rows: [
              ["曜日ごとの時間", "月・水〜金 10:00〜19:00／土・日 9:00〜18:00", "平日の時間を土日にも当てはめられる"],
              ["定休日", "火曜定休", "休みの日に「営業中」と答えられる"],
              ["祝日の扱い", "祝日は営業（火曜が祝日の場合も営業し、翌日休み）", "祝日に開いているかを推測で答えられる"],
              ["受付終了・ラストオーダー", "最終受付 18:00", "閉店時刻の直前に行ってよいと伝わる"],
              ["昼休み・時間帯の分け方", "13:00〜14:00 は休み", "昼休みの時間に「営業中」と答えられる"],
              ["深夜をまたぐ時間", "金・土 18:00〜翌2:00", "「2時に開く」と読まれる"],
            ],
          },
          after: [
            "悪い例：「営業時間 10時〜（不定休）」。良い例：「営業時間：月・水〜金 10:00〜19:00、土・日 9:00〜18:00（最終受付は閉店の1時間前）。定休日：火曜。祝日は営業します（火曜が祝日の場合も営業し、翌水曜が休み）。臨時休業はこのページの『お知らせ』に日付つきで書きます。」",
            "「不定休」の店は、決まり方を書きます。「月2回、前の月の25日までにこのページでお知らせします」のように、どこを見れば分かるかを書くと、AIも「公式サイトで確認を」と案内しやすくなります。営業時間を画像で見せている場合も、同じ内容を文字で書き添えます。",
          ],
        },
        {
          heading: "年末年始・お盆・臨時休業のお知らせの書き方",
          paragraphs: [
            "期間のある休みは、日付と曜日と「休み」か「時間の変更」かを、1行ずつ書きます。「年末年始はお休みをいただきます」だけでは、AIはいつからいつまでかを答えられません。",
          ],
          list: [
            "書く場所：店舗情報のページの営業時間のすぐ近くと、お知らせの記事の両方。トップページだけのバナー画像にしない",
            "書き方：「2026年12月30日（水）〜2027年1月3日（日）は休業します。1月4日（月）から通常どおり営業します。12月29日（火）は17:00で閉店します。」",
            "年を省かない：「12/30〜1/3」だけだと、翌年になってから去年のお知らせとして読まれても区別できない",
            "期間が過ぎたら：その日のうちにお知らせを消すか、冒頭に「この休業は終了しました」と書く。営業時間のブロックの横に出した一言も消す",
            "臨時休業（急な休み）：理由は短くてよいので、日付と再開日を書く。再開日が決まっていなければ「再開日はこのページでお知らせします」と書く",
            "長い休業や移転：休業の期間、移転先、問い合わせ先を書く。移転で住所が変わるときは、古い住所のページを残さない",
          ],
          after: [
            "お知らせの記事は、年ごとに新しく作るより、同じURLの「年末年始の営業のお知らせ」を毎年書き換えるほうが、古い年のページが残りません。新しく作る場合は、前の年の記事に「この記事は2025年のものです」と書いてリンクします。",
          ],
        },
        {
          heading: "Googleビジネスプロフィール：特別営業時間と臨時休業の使い分け",
          paragraphs: [
            `GoogleのAIによる概要やAIモードがGoogleビジネスプロフィールをどう使うかは公開されていません。ただ、Googleマップと検索の店の情報には直接出るので、サイトと同じ日に直します。Googleのヘルプでは、次のように使い分けます（[特別営業時間](${SRC.gbpSpecialJa})・[閉業・臨時休業](${SRC.gbpClosedJa})、2026-11-20に確認）。`,
          ],
          table: {
            head: ["状況", "使う設定", "ヘルプにある注意"],
            rows: [
              ["祝日・年末年始・イベントで時間が変わる、または休む（6日まで続けて）", "特別営業時間", "通常の営業時間と同じでも、祝日の営業時間を確認しておくようすすめている"],
              ["7日以上続けて休む、季節で休む、再開が未定", "臨時休業", "広い検索では、営業中の店のあとに表示されることがある"],
              ["深夜をまたぐ特別営業時間", "2日に分けて入れる（19:00〜24:00 と翌日 0:00〜）", "翌日の通常の時間は使われなくなるので、翌日分も入れ直す"],
              ["再開したとき", "「決まった営業時間で営業している」に戻す", "臨時休業の表示が消える"],
            ],
          },
          after: [
            "ちょうど7日の休みは、ヘルプのページによって書き方が少し違います（特別営業時間のページは「7日以上は臨時休業」、閉業のページは「7日を超える場合は臨時休業」）。7日ちょうどになるときは、どちらでも済むように、特別営業時間を入れたうえでサイトに日付つきのお知らせを出しておくのが無難です。",
            `特別営業時間の手順：business.google.com で「プロフィールを編集」→「営業時間」→「特別営業時間」の編集。提案された日付を確認するか、日付を追加し、休みなら「休業」にチェック、営業するなら時間を入れて保存します。特別営業時間は、プロフィールが「決まった営業時間で営業している」になっていないと表示されません。Googleが使う祝日の一覧には、その日に「営業時間が通常と異なる可能性がある」と表示される日が国ごとに載っています（[Google で使用する祝日のリスト](${SRC.gbpHolidaysJa})）。`,
            `店舗が複数ある場合、Googleビジネスプロフィールには特別営業時間を他の店舗にコピーする機能が加わったと報じられています。コピーは上書きで、古い特別営業時間も一緒に写る、という注意も紹介されています（[Search Engine Roundtable（2025-01-28）](${SRC.copyHours})）。店舗ごとの設定の考え方は[多店舗のAI検索対策](/guide/multi-location-business-ai-search)へ。`,
          ],
        },
        {
          heading: "構造化データ：定休日・深夜・年末年始の書き方",
          paragraphs: [
            `構造化データは、本文に書いた営業時間を機械が読みやすい形でも示すものです。本文の代わりにはならず、本文と一致させます。Googleのローカルビジネスの構造化データのドキュメント（[日本語版](${SRC.gLocalJa})、2026-09-12更新）では、openingHoursSpecification は推奨のプロパティで、次の書き方が例として載っています。`,
          ],
          table: {
            head: ["書きたいこと", "書き方（Googleのドキュメントの例）"],
            rows: [
              ["ふだんの営業時間", "dayOfWeek に曜日、opens と closes に時刻（10:00 など）。曜日ごとに時間が違えば、まとまりごとに分ける"],
              ["定休日", "その曜日を書かない。または、その曜日の opens と closes を両方 00:00 にする"],
              ["24時間営業", "opens を 00:00、closes を 23:59"],
              ["深夜をまたぐ営業", "1つにまとめて書く（土曜 opens 18:00・closes 03:00 で、土曜18時から日曜3時まで）"],
              ["年末年始などの休業", "validFrom と validThrough に日付、opens と closes を 00:00"],
            ],
          },
          code: JSONLD_JA,
          after: [
            `schema.org には、ふだんの営業時間を上書きする specialOpeningHoursSpecification というプロパティもあります（[schema.org](${SRC.schemaSpecial})）。ただ、Googleのドキュメントには載っておらず、Googleが例に使っているのは上の validFrom・validThrough の書き方です。また schema.org の説明では「opens が書いてあれば営業、なければ休み」となっていて、「00:00〜00:00で休み」というGoogleの書き方と表現が違います（[OpeningHoursSpecification](${SRC.schemaOHS})）。迷ったら、Googleの例の書き方にそろえます。`,
            "曜日の値には PublicHolidays（祝日）もありますが、どの国の祝日かは定義されておらず、Googleのドキュメントの例にもありません。祝日の時間が違う場合は、祝日ごとに日付で書くか、本文の文章で書きます。書いたら [リッチリザルトテスト](" + SRC.rich + ") や [Schema Markup Validator](" + SRC.validator + ") で文法を確かめます。ChatGPTやPerplexityが営業時間の構造化データを使うと明記した公式の資料は、調べた範囲では見つかりませんでした。",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AIOの場合）",
          paragraphs: [
            `[Nurevo AIO（無料、旧表示名 Nurevo AEO）](${WP_ORG})では、設定画面の「営業時間」に入れた文字が、店の構造化データと llms.txt の「Hours」の行に出ます。次の順で進めます。`,
          ],
          list: [
            "先に店舗情報のページの本文を、この記事の6つのことで整える（構造化データより本文が先）",
            "「営業時間」の欄には、毎週決まっている時間と定休日だけを書く（例：「月・水〜金 10:00-19:00 / 土・日 9:00-18:00 火曜定休」）。よくある日本語・英語の書き方なら、曜日ごとの openingHoursSpecification として出る",
            "祝日・「第2火曜」・ラストオーダーなどを欄に書くと、読み違えを避けるため曜日ごとの形には直さず、入れた文字のまま（openingHours の文字列として）出る。推測で時間を作ることはない。例外は本文に書き、欄は毎週の形にしておくと、曜日ごとの形で出る",
            "「24:00まで」は 23:59 として、「18:00-02:00」は深夜をまたぐ時間として出る。「9-5」のように午前・午後がはっきりしない書き方は曜日ごとの形にせず、入れた文字のまま出る（「9:00-17:00」と24時間制で書く）",
            "年末年始の休業を構造化データにも出したい場合は、開発者向けの webmcp_canary_business_node フィルターで、Googleの例と同じ形の1行を足せる（下のコード）。期間が過ぎたら消す",
            "SEOプラグインやテーマが店の名前・住所・電話・営業時間まで出している場合、Nurevoは店の情報を重ねて出さないので、フィルターは効かない。そのときは、そのプラグインやテーマの営業時間の設定で直す。Yoast SEO・Rank Math・All in One SEO・Slim SEO と一緒でも二重にならず、0.9.1からは SEO SIMPLE PACK・VK All in One Expansion Unit とも併用できる",
            "ネットショップやBtoBとして設定したサイトでは、営業時間は構造化データにも llms.txt にも出ない（訪れる場所がないため）",
          ],
          code: FILTER_JA,
          after: [
            "子テーマの functions.php や、コードを追加するプラグインに書きます。書いたら、ページのソースかリッチリザルトテストで、店の情報に休業の1行が入っていることを確かめます。llms.txt の「Hours」の行は「営業時間」の欄の文字がそのまま出るので、年末年始の一言を欄に足した場合は、期間が過ぎたら欄からも消します。",
            "お客様のサイトを保守している制作会社は、年末年始・お盆・ゴールデンウィークの前に「休みの日程を聞く→サイト・プロフィール・構造化データを直す→期間後に戻す」を保守の作業に入れておくと、直し忘れを防げます。月額で支援する制作会社向けに[パートナー制度](" + PARTNER + ")があります。",
          ],
        },
        {
          heading: "年末年始の前のスケジュール",
          table: {
            head: ["いつ", "やること"],
            rows: [
              ["休みの日程が決まったらすぐ", "サイトの営業時間のブロックとお知らせに日付つきで書く。Googleビジネスプロフィールの特別営業時間を入れる"],
              ["同じ日", "予約サイト・ポータル・SNSのプロフィールの営業時間を直す。構造化データに休業の1行を足す場合はここで"],
              ["休みの数日前", "同じ質問をAIに聞き、休みの日について何と答えるかを記録する（下の確かめ方）"],
              ["休みの最終日の翌日", "お知らせを消すか「終了しました」に。構造化データの休業の1行と、営業時間の欄に足した一言を消す"],
              ["その1〜2週間後", "同じ質問でもう一度確かめ、古い休みの情報を答えていないかを見る"],
            ],
          },
          after: [
            "各AIが新しい営業時間を反映するまでの日数は公開されていません。休みの直前に直しても間に合うとは限らないので、日程が決まった時点で直すのが確実です。",
          ],
        },
        {
          heading: "確かめ方：営業時間の質問を決めて記録する",
          paragraphs: [
            "営業時間が正しく伝わっているかは、同じ質問を同じAIに、日を変えて何回か聞いて記録します。1回の答えだけで判断しないでください。",
          ],
          table: {
            head: ["質問の例", "見ること"],
            rows: [
              ["「（店名）は何時まで？」", "曜日ごとの時間と受付終了が合っているか"],
              ["「（店名）は祝日に開いている？」", "祝日の扱いを推測ではなく、書いたとおりに答えるか"],
              ["「（店名）の年末年始の営業は？」", "今年の日付で答えるか。去年のお知らせを答えていないか"],
              ["「（地域）で日曜の夜に開いている（業種）は？」", "社名なしの質問で、時間の条件に合う店として出るか"],
            ],
          },
          after: [
            "記録するのは、日付・AIのサービス名・質問・答え・出典のURLです。出典が古いPDF、ポータル、去年のお知らせなら、そこを直します。Nurevoの無料プランとStandardでは、月に1回、業種と地域から作った社名なしの質問3つをNurevoのサービスがPerplexityに聞き、名前が出たか・サイトが引用されたかを表示します。Pro（月14,800円〜、ベータ）は最大20問をPerplexityで計測します（ChatGPTは設定され次第）。営業時間の質問は手で記録してください。詳しくは[AIでの登場率の測り方](/guide/measure-ai-visibility)へ。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "営業時間・定休日・祝日の扱いが、店舗情報のページにHTMLの文字で1か所にまとまっている",
            "受付終了・昼休み・深夜をまたぐ時間が書いてある",
            "「不定休」の場合は、決まり方とお知らせを出す場所が書いてある",
            "年末年始・臨時休業のお知らせに、年・日付・曜日・再開日が書いてある",
            "期間が過ぎたお知らせ・古い営業時間のPDFやチラシが残っていない",
            "Googleビジネスプロフィールの通常の営業時間・特別営業時間がサイトと同じ",
            "7日以上の休み・再開未定の休みは「臨時休業」にしている。再開したら戻した",
            "構造化データの営業時間が本文と同じ。休業の1行は期間後に消す予定を決めた",
            "予約サイト・ポータル・SNSの営業時間もサイトと同じ",
            "AIへの質問を決め、休みの前と後に記録した",
          ],
        },
      ],
      faqs: [
        { q: "Googleビジネスプロフィールを直せば、ChatGPTやPerplexityの答えも直りますか？", a: "そうとは限りません。ChatGPTやPerplexityがGoogleビジネスプロフィールをどう使うかは公開されていません。サイト・ポータル・SNSも同じ日に直し、出典として表示されたページを確かめてください。" },
        { q: "定休日は構造化データにどう書きますか？", a: "その曜日を書かないか、その曜日の opens と closes を両方 00:00 にします。Googleのドキュメントはどちらの例も載せています。本文にも「火曜定休」と書きます。" },
        { q: "祝日だけ時間が違います。構造化データで書けますか？", a: "曜日の値に PublicHolidays はありますが、どの国の祝日かは定義されておらず、Googleの例にもありません。祝日ごとに validFrom・validThrough で日付を書くか、本文に文章で書くのが確実です。Googleビジネスプロフィールでは祝日ごとに特別営業時間を入れます。" },
        { q: "臨時休業にすると検索で不利になりますか？", a: "Googleのヘルプには、広い検索では臨時休業の店が営業中の店のあとに表示されることがある、と書かれています。休みが6日までなら特別営業時間を使い、再開したらすぐ「決まった営業時間で営業している」に戻します。" },
        { q: "AIが去年の年末年始の休みを答えます。", a: "表示された出典のURLを確かめ、去年のお知らせなら消すか「終了しました」と書き換えます。お知らせに年を書いていなかった場合は、年を書き足します。反映までの日数は公開されていないので、数日〜数週間後に同じ質問で確かめます。" },
        { q: "営業時間を画像で見せています。問題ですか？", a: "画像を読めるかどうかはAIのサービスごとに違い、公開されていません。デザインのために画像を残す場合も、同じ内容をHTMLの文字で書き添えてください。" },
        { q: "Nurevoの「営業時間」の欄に祝日のことも書いていいですか？", a: "書けますが、その場合は読み違えを避けるため、入れた文字のまま出て曜日ごとの形にはなりません。欄には毎週決まった時間と定休日だけを書き、祝日や臨時休業は本文に書くと、曜日ごとの形で出ます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIが読める状態か、無料で確かめる",
        body: "無料の診断は登録不要で、URLを入れるだけでAIのクローラーの許可・構造化データ・llms.txt を確認できます。WordPressなら無料のプラグインで、営業時間・住所・電話を構造化データと llms.txt に出せます。SEOプラグインの出力とは重複しません。",
        label: "無料でAI対応を診断する",
        href: "/check",
        secondary: { label: "無料のWordPressプラグインを入れてみる", href: WP_ORG },
      },
      footnote: FOOT_JA,
    },
    en: {
      title: "How to Publish Opening Hours and Holiday Closures for AI | Nurevo",
      description: "Why AI gets your opening hours wrong and how to fix it: closing days, public holidays, holiday and temporary closures on your site, Business Profile and schema.",
      h1: "Opening Hours, Closing Days, Holidays and Temporary Closures: How to Make AI Answer Correctly",
      lead: "To get AI to state your hours correctly, write your regular hours, your closing days and how you handle public holidays as HTML text in one place on your site. Give every holiday or temporary closure exact dates (\"closed from December 24 to December 26\" or the changed hours) and update your site, Google Business Profile and structured data on the same day. If you will be closed for seven days or more, or don't know when you'll reopen, use \"Temporarily closed\" in Google Business Profile rather than special hours. Once a closure has passed, delete the notice or mark it as ended so old dates don't linger.",
      intro: [
        "Written November 20, 2026 (JST). How to write prices is covered in [How to write a pricing page AI reads correctly](/guide/pricing-page-ai-search). This guide is for every business people visit, such as shops, clinics, studios and offices, and focuses on one thing: telling AI whether you are open and until when. It is written so you can act on it before the holiday season.",
        "AI answers change from day to day, between phrasings and between services. These steps make your hours harder for AI to misread and show you how to check the answers. They don't guarantee that you'll appear in an answer or that it will be correct.",
      ],
      sections: [
        {
          heading: "The short answer: five reasons AI gets your hours wrong, and the fixes",
          table: {
            head: ["Cause", "What happens in AI answers", "Fix"],
            rows: [
              ["Hours exist only in an image, a PDF or small footer text", "AI can't state your hours, or quotes an old value from another site", "Write them as HTML text on your location page; keep images as extras"],
              ["Public holidays aren't mentioned", "AI guesses whether you open on public holidays", "Say it in one line: \"Open on public holidays, including when they fall on a Tuesday\""],
              ["Holiday and temporary closures were announced only as an image or on social media", "AI says you're open on a day you're closed", "Post a dated text notice on your site and set special hours in Google Business Profile"],
              ["Expired notices and old hours are still around", "AI quotes last year's holiday closure or your hours before a change", "Delete or mark notices as ended; look for old PDFs, flyers and blog posts"],
              ["Site, Google Business Profile and directories disagree", "AI picks one of them, and you can't tell which", "Treat your site as the reference and update every other listing the same day"],
            ],
          },
          after: [
            `Wrong hours in AI answers are common. Search Engine Journal (July 20, 2026) reported a test by the AI visibility company Searchable in which 64% of UK high-street retailers had at least one false fact in AI answers, and singled out wrong hours and a branch "reported as closed" as errors to fix first ([Search Engine Journal](${SRC.sej}); a vendor test as reported by the article, covering the UK).`,
            `A correct Google Business Profile doesn't rule out old sources. On a local search forum, a business owner reported that their profile and Google Search showed the right hours while Google's AI Overview quoted old hours from spreadsheet files dating back to 2023 ([Local Search Forum, October 2026](${SRC.forum}); no fix was posted). Old documents on your own site and elsewhere are part of what you need to clean up.`,
          ],
        },
        {
          heading: "What the top-ranking articles cover, and what they miss",
          paragraphs: [
            "We read the top Japanese and English results for queries such as \"AI wrong business hours\", \"holiday hours schema\" and their Japanese equivalents (November 20, 2026). They all agree that your site and Google Business Profile should match. Almost none of them show how to mark up holidays, holiday closures or past-midnight hours, explain the seven-day line between special hours and \"Temporarily closed\", give WordPress steps, or say how to check the answers after a fix.",
          ],
          table: {
            head: ["Article", "Strengths", "Gaps"],
            rows: [
              [`[Search Engine Journal (2026-07-20)](${SRC.sej})`, "A way to test AI answers: a fixed question list, repeated runs, checking cited sources", "No special-hours or temporary-closure setup, no schema example"],
              [`[Cloutly (2026-09-06)](${SRC.cloutly})`, "Recovering from being shown as permanently closed; a monthly fact check", "No holiday-hours setup, no schema example, vendor pitch"],
              [`[PushLeads (updated 2026-10-27)](${SRC.pushleads})`, "Match holiday hours between profile and site; re-test a few weeks later", "Many figures without clear sources; no schema example"],
              [`[Uravation (Japanese, updated 2026-09-05)](${SRC.uravationLocal})`, "Temporary closures, holidays and last entry belong in the profile; don't write just \"irregular holidays\"", "No holiday-season example, no schema code, no WordPress steps"],
              [`[Alejandro Rioja (2026-10-23)](${SRC.rioja})`, "A JSON-LD openingHoursSpecification example", "No holiday or closure examples"],
            ],
          },
          after: [
            "Most of the English articles double as pitches for listing-management or audit tools. We found none that handles holidays across all three places at once: the site text, Google Business Profile and structured data. This guide fills that gap.",
          ],
        },
        {
          heading: "On your site: six things the hours block needs",
          paragraphs: [
            "When asked \"Is it open on Sunday?\" or \"Can I go now?\", AI pulls the hours section out of your page. If the exceptions sit somewhere else, they tend to be dropped. Put these six things together on your location page (your contact or about page).",
          ],
          table: {
            head: ["What to write", "Example", "What happens if it's missing"],
            rows: [
              ["Hours for each day", "Mon, Wed–Fri 10:00–19:00; Sat–Sun 9:00–18:00", "Weekday hours get applied to weekends"],
              ["Closing days", "Closed Tuesdays", "AI says you're open on your day off"],
              ["Public holidays", "Open on public holidays (if a holiday falls on a Tuesday we open and close the next day)", "AI guesses"],
              ["Last entry or last order", "Last appointment 18:00", "People are told they can arrive just before closing"],
              ["Breaks and split hours", "Closed 13:00–14:00", "AI says you're open during your break"],
              ["Hours past midnight", "Fri–Sat 18:00–02:00 (next day)", "Read as opening at 2 a.m."],
            ],
          },
          after: [
            "Bad: \"Open from 10, closed irregularly.\" Good: \"Hours: Mon and Wed–Fri 10:00–19:00, Sat–Sun 9:00–18:00 (last appointment one hour before closing). Closed Tuesdays. Open on public holidays; if a holiday falls on a Tuesday we open and close on the Wednesday. Temporary closures are posted with dates under News on this page.\"",
            "If you close irregularly, say how it is decided: \"Twice a month, announced on this page by the 25th of the previous month.\" Telling people where to look also helps AI point them to your site. If your hours are shown as an image, add the same content as text.",
          ],
        },
        {
          heading: "How to write holiday and temporary closure notices",
          paragraphs: [
            "For a closure with a start and an end, write the dates, the weekdays, and whether you are closed or on changed hours, one line each. \"We'll be closed over the holidays\" leaves AI unable to say when.",
          ],
          list: [
            "Where: next to the hours block on your location page, and in a news post. Not only as a banner image on the home page",
            "How: \"Closed Thursday December 24 to Saturday December 26, 2026. Open as usual from Sunday December 27. Closing at 17:00 on Wednesday December 23.\"",
            "Include the year: \"12/24–12/26\" alone can't be told apart from last year's notice",
            "When it's over: delete the notice that day, or add \"This closure has ended\" at the top. Remove any line you added next to the hours block too",
            "Sudden closures: a short reason is enough, but give the date and the reopening date. If you don't know yet, say \"We'll announce the reopening date on this page\"",
            "Long closures or moves: give the period, the new address and how to reach you. Don't leave a page with the old address up after a move",
          ],
          after: [
            "Rewriting the same \"Holiday opening hours\" page every year leaves fewer stale pages than creating a new post each year. If you do create a new one, mark last year's post with \"This notice is from 2025\" and link to the current one.",
          ],
        },
        {
          heading: "Google Business Profile: special hours or \"Temporarily closed\"",
          paragraphs: [
            `How Google's AI Overviews and AI Mode use Google Business Profile isn't published. But the profile feeds the business details in Google Maps and Search directly, so update it the same day as your site. Google's help pages draw the line like this ([Special hours](${SRC.gbpSpecial}), [Mark your business as closed](${SRC.gbpClosed}), checked November 20, 2026).`,
          ],
          table: {
            head: ["Situation", "Setting", "What the help pages note"],
            rows: [
              ["Changed hours or a closure for a holiday or event, up to six days in a row", "Special hours", "Google suggests confirming hours for official holidays even if they're the same as usual"],
              ["Closed for seven days or more, for the off-season, or with no reopening date", "Temporarily closed", "For broad searches, temporarily closed businesses can rank after open ones"],
              ["Special hours past midnight", "Split across two dates (19:00–24:00 and 00:00– the next day)", "The next day's regular hours are then ignored, so re-enter them"],
              ["Reopening", "Switch back to \"Open with main hours\"", "The temporarily closed label disappears"],
            ],
          },
          after: [
            "The two help pages word the seven-day line slightly differently: the special hours page says seven days or more means \"Temporarily closed\", the closure page says more than seven days. For a closure of exactly seven days, setting special hours and posting a dated notice on your site covers both readings.",
            `Special hours step by step: at business.google.com choose Edit profile, then Hours, then edit Special hours. Review a suggested date or add a date, tick Closed or enter the hours, and save. Special hours only show if the profile is set to "Open with main hours". Google's [list of holidays](${SRC.gbpHolidays}) shows, country by country, the days on which a profile displays a note that hours may differ.`,
            `For several locations, Search Engine Roundtable reported a feature that copies special hours from one location to others; it overwrites and copies old special hours as well ([Search Engine Roundtable, 2025-01-28](${SRC.copyHours})). See [AI search for multi-location businesses](/guide/multi-location-business-ai-search) for managing locations.`,
          ],
        },
        {
          heading: "Structured data: closing days, past-midnight hours and holiday closures",
          paragraphs: [
            `Structured data restates the hours on your page in a machine-readable form. It doesn't replace the page text and must match it. In Google's [LocalBusiness structured data documentation](${SRC.gLocal}) (updated September 2026), openingHoursSpecification is a recommended property, with these patterns in its examples.`,
          ],
          table: {
            head: ["What you want to say", "How (from Google's examples)"],
            rows: [
              ["Regular hours", "Days in dayOfWeek, times in opens and closes (10:00); one entry per group of days with the same hours"],
              ["Closing day", "Leave the day out, or give it opens and closes of 00:00"],
              ["Open 24 hours", "opens 00:00, closes 23:59"],
              ["Past midnight", "One entry: Saturday, opens 18:00, closes 03:00 means Saturday 6 p.m. to Sunday 3 a.m."],
              ["Holiday closure", "Dates in validFrom and validThrough, opens and closes 00:00"],
            ],
          },
          code: JSONLD_EN,
          after: [
            `schema.org also has specialOpeningHoursSpecification, meant to override regular hours ([schema.org](${SRC.schemaSpecial})). Google's documentation doesn't mention it, and Google's own holiday example uses validFrom and validThrough as above. schema.org also describes a place as "open if the opens property is specified, and closed otherwise", which is worded differently from Google's 00:00–00:00 for closed ([OpeningHoursSpecification](${SRC.schemaOHS})). When in doubt, follow Google's examples.`,
            "The day values include PublicHolidays, but schema.org doesn't say which country's holidays it means, and Google's examples don't use it. If your holiday hours differ, give each holiday its own dated entry or say it in the page text. Check the syntax with the [Rich Results Test](" + SRC.rich + ") or the [Schema Markup Validator](" + SRC.validator + "). In our research we found no official statement that ChatGPT or Perplexity use opening-hours structured data.",
          ],
        },
        {
          heading: "WordPress steps (with Nurevo AIO)",
          paragraphs: [
            `In [Nurevo AIO (free, formerly listed as Nurevo AEO)](${WP_ORG}), what you type in the Opening hours setting is published in your business's structured data and on the "Hours" line of llms.txt. Work in this order.`,
          ],
          list: [
            "Fix the page text first, using the six things above (page text before structured data)",
            "In Opening hours, enter only your weekly pattern and closing days (\"Mon, Wed-Fri 10:00-19:00 / Sat-Sun 9:00-18:00, closed Tuesdays\"). Common English and Japanese forms are published as day-by-day openingHoursSpecification",
            "If you add public holidays, \"second Tuesday\" or last-order notes, the plugin doesn't risk a misreading: it publishes the text exactly as typed (as an openingHours string) and never invents hours. Keep exceptions in the page text and the field in weekly form to get the day-by-day output",
            "\"Until 24:00\" is published as 23:59 and \"18:00-02:00\" as past-midnight hours. An ambiguous range such as \"9-5\" with no a.m./p.m. is published as typed; write \"9:00-17:00\" or \"9am-5pm\" instead",
            "To put a holiday closure into structured data, the developer filter webmcp_canary_business_node can add one entry in Google's format (code below). Delete it when the dates have passed",
            "If your SEO plugin or theme already publishes your business's name, address, phone and hours, Nurevo doesn't publish a second business entity, so the filter has no effect; change the hours in that plugin or theme instead. Nurevo works without duplicates alongside Yoast SEO, Rank Math, All in One SEO and Slim SEO, and since 0.9.1 alongside SEO SIMPLE PACK and VK All in One Expansion Unit",
            "Sites set up as an online shop or B2B publish no hours in structured data or llms.txt, since there is no place to visit",
          ],
          code: FILTER_EN,
          after: [
            "Add it to your child theme's functions.php or a code snippets plugin. Then check the page source or the Rich Results Test to confirm the closure entry appears on your business. The llms.txt \"Hours\" line repeats the Opening hours field as typed, so if you added a holiday note to the field, remove it there too once it has passed.",
            "Agencies that maintain client sites can make \"ask for the holiday dates, update site, profile and structured data, revert afterwards\" a standard task before each holiday season. Nurevo has a [partner program](" + PARTNER + ") for agencies offering monthly support.",
          ],
        },
        {
          heading: "A timeline for the holiday season",
          table: {
            head: ["When", "What to do"],
            rows: [
              ["As soon as the dates are set", "Add dated text to the hours block and a news post; set special hours in Google Business Profile"],
              ["The same day", "Update booking sites, directories and social profiles; add the closure entry to structured data if you use one"],
              ["A few days before the closure", "Ask AI the same questions and record what it says about the closed days (see below)"],
              ["The day after the closure ends", "Delete the notice or mark it as ended; remove the structured data entry and any note in the hours field"],
              ["One to two weeks later", "Ask again and check that AI no longer quotes the old closure"],
            ],
          },
          after: [
            "No AI service publishes how long it takes to pick up new hours. A fix made the day before may not be reflected in time, so update as soon as your dates are decided.",
          ],
        },
        {
          heading: "How to check: fix your questions and keep a record",
          paragraphs: [
            "Ask the same questions to the same AI on different days and record the answers. Don't judge from a single answer.",
          ],
          table: {
            head: ["Example question", "What to look for"],
            rows: [
              ["\"What time does (business) close?\"", "Hours per day and last entry are right"],
              ["\"Is (business) open on public holidays?\"", "It repeats what you wrote rather than guessing"],
              ["\"What are (business)'s holiday hours?\"", "It gives this year's dates, not last year's"],
              ["\"Which (type of business) in (area) is open on Sunday evening?\"", "Whether you appear for an unbranded question with a time condition"],
            ],
          },
          after: [
            "Record the date, the AI service, the question, the answer and the cited URLs. If the source is an old PDF, a directory or last year's notice, fix that page. On Nurevo's Free and Standard plans, the Nurevo service asks Perplexity three unbranded questions built from your business type and area once a month and shows whether your name appeared and your site was cited. Pro (beta, from USD 99 a month) tracks up to 20 questions on Perplexity (ChatGPT once it is set up). Record opening-hours questions by hand. See [How to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Hours, closing days and public-holiday handling are in one place on your location page, as HTML text",
            "Last entry, breaks and past-midnight hours are stated",
            "If you close irregularly, the page says how it's decided and where it's announced",
            "Holiday and temporary closure notices include the year, dates, weekdays and the reopening date",
            "No expired notices or old hours remain in PDFs, flyers or posts",
            "Google Business Profile regular and special hours match the site",
            "Closures of seven days or more, or with no reopening date, use \"Temporarily closed\", and you switched back on reopening",
            "Structured data hours match the page; you've planned when to remove the closure entry",
            "Booking sites, directories and social profiles match the site",
            "You've chosen questions to ask AI and recorded the answers before and after the closure",
          ],
        },
      ],
      faqs: [
        { q: "If I fix Google Business Profile, will ChatGPT and Perplexity be fixed too?", a: "Not necessarily. How ChatGPT and Perplexity use Google Business Profile isn't published. Update your site, directories and social profiles the same day and check the pages cited as sources." },
        { q: "How do I mark a closing day in structured data?", a: "Leave that day out, or give it opens and closes of 00:00. Google's documentation shows both. Say \"Closed Tuesdays\" in the page text too." },
        { q: "Our hours differ on public holidays. Can structured data say that?", a: "There is a PublicHolidays day value, but schema.org doesn't say which country's holidays it covers and Google's examples don't use it. Give each holiday a dated entry with validFrom and validThrough, or say it in the page text. In Google Business Profile, set special hours for each holiday." },
        { q: "Does \"Temporarily closed\" hurt us in search?", a: "Google's help says temporarily closed businesses can rank after open ones for broad searches. For closures of up to six days use special hours, and switch back to \"Open with main hours\" as soon as you reopen." },
        { q: "AI keeps quoting last year's holiday closure.", a: "Check the source URL it shows. If it's last year's notice, delete it or mark it as ended, and add the year if it was missing. How long updates take isn't published, so ask the same question again a few days to a few weeks later." },
        { q: "Our hours are shown as an image. Is that a problem?", a: "Whether an image can be read differs by AI service and isn't published. Keep the image if you like, but add the same content as HTML text." },
        { q: "Can I put public holidays in Nurevo's Opening hours field?", a: "You can, but then the field is published exactly as typed rather than day by day, to avoid a misreading. Keep the field to your weekly hours and closing days and put holidays and closures in the page text to get the day-by-day output." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See whether AI can read your site",
        body: "The free check needs no sign-up: enter a URL to see AI crawler access, structured data and llms.txt. On WordPress, the free plugin publishes your hours, address and phone in structured data and llms.txt, without duplicating your SEO plugin's output.",
        label: "Check your AI readiness for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: FOOT_EN,
    },
  },
};
