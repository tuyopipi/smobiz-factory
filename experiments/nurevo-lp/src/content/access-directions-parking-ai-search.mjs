// Content page: how to write the access / directions / parking page (アクセス
// ページ) so AI search (Google AI Overviews / AI Mode, ChatGPT, Perplexity,
// Gemini) answers "how do I get there?", "is there parking?", "which exit?"
// correctly. For every business with a place people visit; the industry pages
// link here for the access mechanics (hours: business-hours-holidays-ai-search,
// booking: booking-page-ai-search).
//
// Written 2026-11-21 (JST). Product facts come from the plugin (0.9.2):
// - nurevo-webmcp.php: one free-text "住所" field (business_address), published
//   as {"@type":"PostalAddress","streetAddress":"<as typed>"} on every plan
//   (not split into locality/region/postal code). llms.txt "## Key facts" has
//   "- Address: <as typed>".
// - The plugin does not turn an address into coordinates (no geocoding). The
//   service may reuse geo only when the site's own public JSON-LD already gave
//   it for the same address (docs/standard-continuous-optimization.md, "住所
//   だけから座標を推測しない") - the article says only "does not guess
//   coordinates from the address".
// - Diagnosis "Key information coverage": name, address, phone, hours,
//   location and URL.
// - Online shop / B2B site types publish no opening hours, geo, priceRange,
//   potentialAction (includes/site-types.php).
// - Filter webmcp_canary_business_node ($org, $settings) before coexistence;
//   if the SEO plugin/theme publishes a complete business node, Nurevo
//   publishes none (filter has no effect).
// - Nurevo publishes no amenityFeature / hasMap / parking data itself.
//
// Outside facts and where they were read (2026-11-21):
// - Google Search Central LocalBusiness structured data (updated 2026-09-08):
//   required name, address; recommended geo, telephone, url,
//   openingHoursSpecification, department ...; PostalAddress with
//   streetAddress/addressLocality/addressRegion/postalCode/addressCountry;
//   geo latitude/longitude "at least 5 decimal places". hasMap and
//   amenityFeature are not mentioned.
// - schema.org (V30.1, 2026-09-16) / schema-dts 2.1.0: Place.hasMap "A URL to
//   a map of the place" (Map or URL; Map.mapType includes ParkingMap,
//   TransitMap, VenueMap); Place.amenityFeature -> LocationFeatureSpecification
//   (name/value, hoursAvailable); Place.publicAccess "open to public visitors.
//   If omitted there is no assumed default"; ParkingFacility type exists.
// - GBP help 9049526 (Manage your business attributes): some attributes owner
//   edited (Yes/No), others from customer input; Accessibility includes
//   Wheelchair-accessible parking ("a parking spot reserved for people with
//   accessibility needs"), entrance, restroom, seating, elevator; review
//   usually ~10 minutes, up to 30 days.
// - 不動産の表示に関する公正競争規約 施行規則 (as summarised by 三菱地所ハウス
//   ネット glossary mec-h.com n=59): walking time = road distance, 80 m per
//   minute, fractions rounded up, signal waiting not counted.
// - Top articles read 2026-11-21: uravation local-business (2026-09-05),
//   cafe-kojin (2026-10-09), multi-tenpo-chain (2026-08-15), chushajo coin
//   parking (2026-10-24), assist-all real estate roadmap (2026-07-31), issoh
//   16350 (2026-08-09), sungrove meo-trends-2027 (2026-11-04); Semrush
//   (2026-07-15), Birdeye (2026-08-17), Yext (2025-01-24), Straight North
//   (no date), SEO.com (2026-11-20), SEJ GBP attributes (2021-06-28).
// Not stated on purpose: how ChatGPT uses the user's location or which map
// data it uses (OpenAI help could not be read), any "x% of customers check
// parking" figures, GMO TECH study numbers (vendor study, not about access),
// whether any AI reads hasMap/amenityFeature (no official statement found).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  gLocalJa: "https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=ja",
  gLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  hasMap: "https://schema.org/hasMap",
  amenity: "https://schema.org/amenityFeature",
  lfs: "https://schema.org/LocationFeatureSpecification",
  publicAccess: "https://schema.org/publicAccess",
  gbpAttrJa: "https://support.google.com/business/answer/9049526?hl=ja",
  gbpAttr: "https://support.google.com/business/answer/9049526?hl=en",
  walk: "https://www.mec-h.com/words/detail?n=59",
  uravationLocal: "https://uravation.com/llmo/local-business-aio-taisaku/",
  uravationCafe: "https://uravation.com/llmo/cafe-kojin-inshokuten-llmo-taisaku/",
  uravationChain: "https://uravation.com/llmo/multi-tenpo-chain-ai-search-sekkei/",
  uravationParking: "https://uravation.com/llmo/chushajo-unei-coin-parking-llmo-taisaku/",
  issoh: "https://www.issoh.co.jp/column/details/16350/",
  sungrove: "https://www.sungrove.co.jp/meo-trends-2027/",
  semrush: "https://www.semrush.com/blog/ai-search-optimization-for-local-businesses/",
  birdeye: "https://birdeye.com/blog/get-found-on-ai-tools-search-local-business",
  yext: "https://www.yext.com/blog/maximize-smb-clients-search-visibility-chatgpt",
  straightnorth: "https://www.straightnorth.com/blog/ai-search-optimization-for-local-businesses-gbp-reviews-and-citations/",
  rich: "https://search.google.com/test/rich-results",
  validator: "https://validator.schema.org/",
};

const JSONLD_JA = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "@id": "https://example.jp/#business",
  "name": "例デンタルクリニック",
  "url": "https://example.jp/",
  "address": {
    "@type": "PostalAddress",
    "postalCode": "150-0000",
    "addressRegion": "東京都",
    "addressLocality": "渋谷区",
    "streetAddress": "例町1-2-3 例ビル3階",
    "addressCountry": "JP"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 35.65812,
    "longitude": 139.70164
  },
  "hasMap": "https://example.jp/access/",
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "専用駐車場（2台）", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "エレベーター", "value": true }
  ]
}
</script>
<!-- 座標・台数は例。自分の入口の座標を地図アプリで確かめ、本文と同じ値にする -->`;

const JSONLD_EN = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "@id": "https://example.com/#business",
  "name": "Example Dental",
  "url": "https://example.com/",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Example Street, Suite 300",
    "addressLocality": "Springfield",
    "addressRegion": "IL",
    "postalCode": "62701",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 39.79817,
    "longitude": -89.64407
  },
  "hasMap": "https://example.com/directions/",
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Free patient parking (2 spaces)", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Elevator", "value": true }
  ]
}
</script>
<!-- Coordinates and counts are examples. Take your own entrance's coordinates from a
     map app and use the same values as the page text -->`;

const FILTER_JA = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // 入口の座標とアクセスのページ。本文と同じ値にする
    $org['geo'] = array(
        '@type'     => 'GeoCoordinates',
        'latitude'  => 35.65812,
        'longitude' => 139.70164,
    );
    $org['hasMap'] = home_url('/access/');
    $org['amenityFeature'] = array(
        array('@type' => 'LocationFeatureSpecification', 'name' => '専用駐車場（2台）', 'value' => true),
    );
    return $org;
}, 10, 2);`;

const FILTER_EN = `add_filter('webmcp_canary_business_node', function ($org, $settings) {
    // Entrance coordinates and the directions page. Same values as the page text
    $org['geo'] = array(
        '@type'     => 'GeoCoordinates',
        'latitude'  => 39.79817,
        'longitude' => -89.64407,
    );
    $org['hasMap'] = home_url('/directions/');
    $org['amenityFeature'] = array(
        array('@type' => 'LocationFeatureSpecification', 'name' => 'Free patient parking (2 spaces)', 'value' => true),
    );
    return $org;
}, 10, 2);`;

const FOOT_JA = "Google、Google 検索、Google マップ、Gemini はGoogle LLC、ChatGPTはOpenAI、PerplexityはPerplexity AIの商標です。WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、ならびに本文で紹介した各社の名称は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。";
const FOOT_EN = "Google, Google Search, Google Maps and Gemini are trademarks of Google LLC, ChatGPT of OpenAI and Perplexity of Perplexity AI. WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and the names of the companies cited in this guide are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.";

export default {
  slug: "access-directions-parking-ai-search",
  targetQueries: [
    "directions page parking AI search local business",
    "amenityFeature parking hasMap geo schema",
    "how to get AI to give correct directions to my business",
    "アクセス 駐車場 AI検索 書き方",
    "アクセスページ 構造化データ geo hasMap",
    "最寄り駅 徒歩 分 書き方 AIO",
  ],
  related: ["business-hours-holidays-ai-search", "booking-page-ai-search", "multi-location-business-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "アクセス・駐車場・行き方をAIに正しく読ませる書き方 | Nurevo",
      description: "「駐車場はある？」「何番出口？」にAIが間違えずに答えるためのアクセスページの書き方。住所・最寄り駅・徒歩分数・入口・駐車場、構造化データ、Googleビジネスプロフィール、WordPressの手順。",
      h1: "アクセス・駐車場・行き方のページをAIに正しく読ませる書き方：住所の表記から入口・駐車場まで",
      lead: "AIに行き方や駐車場を正しく答えてもらうには、アクセスのページに「住所（建物名・階まで）」「最寄り駅と出口・徒歩分数とその測り方」「入口の目印」「駐車場の有無・台数・場所・料金」「自転車・バイク・バリアフリー」を、地図や写真だけでなくHTMLの文字で書きます。そのうえで、住所の表記をサイト・Googleビジネスプロフィール・ポータルで1つにそろえ、構造化データには本文と同じ住所と入口の座標を入れます。駐車場がない場合も「駐車場はありません。近くのコインパーキングをご利用ください」と書くと、AIが推測で答えにくくなります。",
      intro: [
        "作成日：2026年11月21日（JST）。営業時間は[営業時間・定休日・臨時休業の書き方](/guide/business-hours-holidays-ai-search)、予約は[予約ページの書き方](/guide/booking-page-ai-search)で扱いました。この記事は、店舗・クリニック・教室・事務所・宿など、人が訪れる場所を持つ事業者に向けて、「どうやって行くか」「車で行けるか」をAIに正しく伝える方法に絞ります。",
        "AIの回答は日・聞き方・使うサービスによって変わります。この記事の手順は、AIがアクセス情報を読み違えにくい状態を作り、確かめるためのもので、回答に出ることや正しく答えられることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "まず結論：アクセス情報でAIが間違える5つの原因と直し方",
          table: {
            head: ["原因", "AIの答えに起きること", "直し方"],
            rows: [
              ["アクセスが埋め込み地図・画像の案内図だけ", "最寄り駅や駐車場を答えられない、または外部サイトの古い情報を答える", "地図の下に、駅・出口・徒歩分数・入口・駐車場を文字で書く"],
              ["住所の表記がサイト・Googleビジネスプロフィール・ポータルでばらばら（「1-2-3」「1丁目2番3号」、建物名や階の有無）", "同じ店を別の場所と扱う、または建物名・階を落として答える", "1つの表記に決め、建物名と階まで同じ書き方で全部の掲載先に書く"],
              ["駐車場について何も書いていない", "「駐車場あり」「なし」を推測で答える", "ない場合も「ありません」と書き、近くの駐車場の探し方を書く"],
              ["「駅近」「駅からすぐ」だけ", "どの駅・どの出口かを答えられない", "駅名・路線・出口・徒歩分数と、その測り方を書く"],
              ["移転・駐車場の変更のあと、古いページやPDFが残っている", "移転前の住所や、契約が終わった駐車場を答える", "古いアクセスのページ・チラシPDF・ブログ記事を探して直すか消す"],
            ],
          },
          after: [
            "訪れる人が実際にAIに聞くのは、「◯◯の近くに駐車場はある？」「◯◯駅から何分？」「ベビーカーで行ける？」のような、条件のついた質問です。AIはアクセスのページの文章を抜き出して答えるので、文章で書かれていない情報は、ほかのサイトの情報や推測で埋められやすくなります。",
          ],
        },
        {
          heading: "上位の記事で分かったこと・足りなかったこと",
          paragraphs: [
            "「アクセス 駐車場 AI検索」「LLMO 最寄り駅 徒歩」「directions page parking AI search」「local business AI search optimization」などで上位の日本語と英語の記事を読みました（2026-11-21）。日本語の記事は「駅名と徒歩分数を具体的に」「駐車場の有無を書く」「住所の表記をそろえる」までは共通していました。英語の記事はほぼ「NAP（名前・住所・電話）をそろえる」に留まり、行き方や駐車場のページについてはほとんど触れていませんでした。どの記事にも、アクセス情報の構造化データの例（geo・hasMap・amenityFeature）、WordPressでの手順、直したあとの確かめ方はありませんでした。",
          ],
          table: {
            head: ["記事", "よく書けている点", "足りなかった点"],
            rows: [
              [`[Uravation 店舗のAIO対策](${SRC.uravationLocal})（2026-09-05更新）`, "店舗ページに最寄り駅・徒歩経路・駐車場・入口を置く。口コミで「駐車場が分かりにくい」と出たらアクセスのページを足す", "構造化データはプロパティ名の列挙だけでコード例がない"],
              [`[Uravation 個人経営カフェ](${SRC.uravationCafe})（2026-10-09）`, "建物名・階・出口・入口の目印・駐輪の有無。「駅徒歩3分」は起点が分からないので地図と文章を並べる", "徒歩分数の測り方の基準、WordPressの手順がない"],
              [`[Uravation 多店舗チェーン](${SRC.uravationChain})（2026-08-15）`, "店長に「口頭で道案内する言い方」を書いてもらう運用、1店舗1ページ", "「緯度経度は5桁以上」に出典がない（Googleのドキュメントにある内容）。コード例がない"],
              [`[一創 MEOとAI検索](${SRC.issoh})（2026-08-09）`, "住所の表記ゆれの例（丁目・番地、全角半角のハイフン）、駐車場などの属性", "アクセスのページの書き方、構造化データの例がない"],
              [`[サングローブ 2027年のMEO](${SRC.sungrove})（2026-11-04更新）`, "駐車場・Wi-Fiなどの属性をGoogleビジネスプロフィールで設定し、条件はWebで補う", "サイト側の書き方と構造化データには触れていない"],
              [`[Semrush](${SRC.semrush})（2026-07-15）・[Straight North](${SRC.straightnorth})`, "NAPを掲載先でそろえる。GA4でAIからの流入を見る（Straight North）", "行き方・駐車場・バリアフリーの話がない。geo の例がない"],
              [`[Yext](${SRC.yext})（2025-01-24）・[Birdeye](${SRC.birdeye})`, "「駐車場は無料？」のような店舗ごとのFAQ、AIが近さを扱うのが苦手という指摘", "具体的な書き方・構造化データのコードがない。自社製品の宣伝が中心"],
            ],
          },
          after: [
            "この記事では、上の記事が答えている質問（何を書くか・表記をそろえる・属性）をすべて扱ったうえで、徒歩分数の測り方の基準、駐車場の書き方の型、Googleの資料に沿った住所と座標の書き方、Nurevo を使ったWordPressの手順、AIへの確かめ方を足します。",
          ],
        },
        {
          heading: "アクセスのページに書く8つのこと",
          paragraphs: [
            "店舗情報のページか、独立した「アクセス」のページに、次の8つを書きます。地図を埋め込む場合も、地図の中身はAIが読めるとは限らないので、文字で同じことを書きます。",
          ],
          table: {
            head: ["書くこと", "書く例", "抜けると起きること"],
            rows: [
              ["住所（郵便番号・建物名・階）", "〒150-0000 東京都渋谷区例町1-2-3 例ビル3階", "建物名や階のない住所が広まり、入口で迷う人が出る"],
              ["最寄り駅・路線・出口・徒歩分数", "JR山手線「例駅」東口から徒歩4分（約300m）", "別の駅や出口で案内される"],
              ["道順（目印を2〜3個）", "東口を出て右へ。コンビニの角を左に曲がり、2つ目の信号の手前、1階が薬局のビルです", "近くまで来て迷う。電話の問い合わせが増える"],
              ["入口と階", "入口はビルの正面ではなく、左側の通路の奥です。エレベーターで3階へ", "ビルは分かっても入口が分からない"],
              ["駐車場", "専用駐車場2台（ビル裏、番号7・8）。満車のときは近くのコインパーキングをご利用ください（料金の補助はありません）", "AIが「駐車場あり」「なし」を推測する"],
              ["自転車・バイク", "自転車はビル前の駐輪スペースに停められます。バイクは停められません", "停められない場所に停める人が出る"],
              ["バリアフリー・ベビーカー", "エレベーターあり。入口に2cmの段差があります。車いすの方は事前にお電話ください", "行けるかどうか判断できない"],
              ["バス・タクシー・車での行き方", "例バス「例町」停留所から徒歩1分。車は例通りから入れます（一方通行のため反対側からは入れません）", "車で来る人が入口の道を間違える"],
            ],
          },
          after: [
            "悪い例：「駅近！駐車場あり。詳しくは地図をご覧ください」。良い例：「JR例駅 東口から徒歩4分（約300m）。〒150-0000 東京都渋谷区例町1-2-3 例ビル3階。入口はビル左側の通路の奥です。専用駐車場2台（ビル裏、番号7・8）。満車のときは近くのコインパーキングをご利用ください」。",
            "「駐車場あり」だけでは、台数・場所・無料かどうか・提携かどうかが分かりません。提携駐車場なら、駐車場の名前・住所・割引の条件（「◯円以上のご利用で1時間無料」など）を書きます。条件が変わったら、その日にページを直します。",
          ],
        },
        {
          heading: "「徒歩◯分」の書き方：測り方を決めて書き添える",
          paragraphs: [
            `徒歩分数は、書く人によって測り方がばらばらになりやすい数字です。日本の不動産広告には決まった基準があり、道路に沿った距離で80mを徒歩1分とし、80mに満たない端数は1分に切り上げます。信号の待ち時間や坂道は考えません（不動産の表示に関する公正競争規約の施行規則。[三菱地所ハウスネットの用語集](${SRC.walk})の説明による）。店舗やクリニックがこの基準に従う決まりはありませんが、基準をそろえておくと、ポータルの表示とサイトの表示が食い違いにくくなります。`,
          ],
          list: [
            "どの出口から、建物のどの入口までを測ったかを決める（「東口改札から、ビルの入口まで」）",
            "道に沿った距離を地図アプリで測り、80mで1分として計算し、端数は切り上げる。「約300m」と距離も書くと、AIも人も確かめやすい",
            "出口が複数ある大きな駅では、いちばん近い出口を書き、ほかの出口から来る場合の目安も1行添える",
            "ポータル・Googleビジネスプロフィールの説明文に別の分数が書かれていないか確かめ、同じ数字にそろえる",
          ],
          after: [
            "「駅から徒歩1分」と書くのは、本当に駅の出口の目の前にある場合だけにします。誇張した分数は、来た人の口コミで食い違いとして表に出ます。",
          ],
        },
        {
          heading: "住所の表記を1つにそろえる",
          paragraphs: [
            "AIは、サイト・Googleビジネスプロフィール・ポータル・SNSの情報を合わせて、同じ事業者かどうかを判断していると考えられています（どの情報をどう突き合わせているかは公開されていません）。住所の書き方が掲載先ごとに違うと、同じ店として結び付かなかったり、建物名や階を落とした住所が答えに使われたりします。次の5つを決め、全部の掲載先で同じにします。",
          ],
          list: [
            "番地の書き方（「1-2-3」か「1丁目2番3号」か）。どちらでもよいので1つに決める",
            "ハイフンの文字（半角の「-」に統一するなど）と、数字の全角・半角",
            "建物名と階（「例ビル3階」）。建物名が変わったら、その日に全部の掲載先を直す",
            "都道府県から書くかどうか（構造化データには都道府県まで入れる）",
            "英語の住所を載せる場合は、日本語の住所と同じ場所だと分かる書き方（建物名のローマ字を含める）",
          ],
          after: [
            "移転したときは、新しい住所をアクセスのページに書き、「2026年◯月◯日に移転しました（旧住所：…）」と1行残します。旧住所のページを消すだけでは、外部サイトに残った旧住所とサイトの情報が結び付かず、AIが古い住所を答え続けることがあります。",
          ],
        },
        {
          heading: "Googleビジネスプロフィールの属性で駐車場とバリアフリーを設定する",
          paragraphs: [
            `Googleビジネスプロフィールには「属性」という項目があり、Google検索・Googleマップなどに表示されます。属性には事業者が自分で編集できるものと、来店した人の情報をもとに入るものがあります。バリアフリーの属性には、車いすで入れる入口・トイレ・席・エレベーター、車いすに対応した駐車場があり、「車いすに対応した駐車場」は、障がいのある方のための駐車スペースがある場合に「はい」を選ぶものです。編集後の確認には通常10分ほど、長い場合は30日かかることがあると書かれています（[ビジネスの属性を管理する](${SRC.gbpAttrJa})、2026-11-21確認）。表示される属性は業種によって違います。`,
            "GoogleのAIによる概要やAIモードがプロフィールの属性をどう使うかは公開されていません。ただ、プロフィールはGoogleマップと検索に表示される情報そのものなので、サイトの駐車場・バリアフリーの記述と同じ内容にしておきます。台数・料金・提携の条件のように属性で表せないことは、サイトの本文と、プロフィールの説明文に書きます。",
          ],
        },
        {
          heading: "構造化データ：住所・座標・地図・設備",
          paragraphs: [
            `Googleの[ローカルビジネスの構造化データのドキュメント](${SRC.gLocalJa})（2026年9月更新）では、name と address が必須、geo（緯度・経度）は推奨のプロパティです。住所は PostalAddress の streetAddress・addressLocality・addressRegion・postalCode・addressCountry に分けて書く例が載っており、緯度・経度は小数点以下5桁以上の精度が必要とされています。座標は地図アプリで入口の位置を確かめて入れます（ビルの中心ではなく、人が入る入口のほうが道案内に合います）。`,
            `Googleのドキュメントには載っていませんが、schema.org には地図のURLを示す [hasMap](${SRC.hasMap})、設備を表す [amenityFeature](${SRC.amenity})（[LocationFeatureSpecification](${SRC.lfs}) で名前と値を書く）、一般の人が訪れられるかを示す [publicAccess](${SRC.publicAccess}) があります。hasMap や amenityFeature をGoogleや他のAIが使うと明記した公式の資料は、調べた範囲では見つかりませんでした。付けても害はありませんが、本文に書いたことの言い換えとして付けるものです。`,
          ],
          code: JSONLD_JA,
          after: [
            "構造化データの住所・座標・駐車場の台数は、本文と同じ値にします。書いたら [リッチリザルトテスト](" + SRC.rich + ") や [Schema Markup Validator](" + SRC.validator + ") で文法を確かめます。複数の店舗がある場合は、店舗ごとのページに、その店舗の住所と座標を1つずつ書きます（[複数拠点の事業者のAI検索対策](/guide/multi-location-business-ai-search)）。",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AIOの場合）",
          paragraphs: [
            `[Nurevo AIO（無料、旧表示名 Nurevo AEO）](${WP_ORG})では、設定画面の「住所」に入れた文字が、店の構造化データ（PostalAddress の streetAddress）と llms.txt の「Address」の行に、入れたとおりに出ます。次の順で進めます。`,
          ],
          list: [
            "先にアクセスのページの本文を、この記事の8つのことで整える（構造化データより本文が先）",
            "「住所」の欄には、サイトの本文・Googleビジネスプロフィールと同じ表記で、郵便番号・建物名・階まで入れる。欄の文字は分割されず、1つの文字列として出る",
            "Nurevo は住所から緯度・経度を推測して出すことはしない。座標を出したい場合は、開発者向けの webmcp_canary_business_node フィルターで geo を足す（下のコード）。hasMap・amenityFeature も同じフィルターで足せる",
            "SEOプラグインやテーマが店の名前・住所・電話・営業時間まで出している場合、Nurevo は店の情報を重ねて出さないので、フィルターは効かない。そのときはそのプラグインやテーマの設定で座標を入れる。Yoast SEO・Rank Math・All in One SEO・Slim SEO と一緒でも二重にならず、0.9.1からは SEO SIMPLE PACK・VK All in One Expansion Unit とも併用できる",
            "プラグインの診断の「重要情報の網羅」では、名前・住所・電話・営業時間・位置・URLがそろっているかを確かめられる",
            "ネットショップやBtoBとして設定したサイトでは、営業時間と位置（geo）は出ない（訪れる場所がないため）",
          ],
          code: FILTER_JA,
          after: [
            "子テーマの functions.php や、コードを追加するプラグインに書きます。書いたら、ページのソースかリッチリザルトテストで、店の情報に geo が入っていることを確かめます。移転や駐車場の変更のときは、欄・フィルター・本文の3か所を同じ日に直します。",
            "お客様のサイトを保守している制作会社は、移転・駐車場の契約変更・建物名の変更を「その日に全掲載先を直す」作業として保守に入れておくと、直し忘れを防げます。月額で支援する制作会社向けに[パートナー制度](" + PARTNER + ")があります。",
          ],
        },
        {
          heading: "直したあとの確かめ方",
          paragraphs: [
            "直した日と、2〜4週間後に、同じ質問をAIに聞いて記録します。反映までの日数はどのAIも公開していません。",
          ],
          table: {
            head: ["聞く質問", "正しい答えの条件"],
            rows: [
              ["「（事業者名）の住所は？」", "建物名・階まで今の住所。移転前の住所でない"],
              ["「（事業者名）に（最寄り駅）から行くには？」", "サイトに書いた出口と徒歩分数"],
              ["「（事業者名）に駐車場はある？」", "サイトに書いた有無・台数・提携の条件"],
              ["「（事業者名）は車いすで入れる？」", "サイトとGoogleビジネスプロフィールの記述と同じ"],
              ["「（地域）で駐車場のある（業種）は？」", "名前が出たか、出たならアクセスのページが引用されたか"],
            ],
          },
          after: [
            "記録するのは、日付・AIのサービス名・質問・答え・出典のURLです。出典がポータルや古いチラシなら、そこを直します。Nurevoの無料プランとStandardでは、月に1回、業種と地域から作った社名なしの質問3つをNurevoのサービスがPerplexityに聞き、名前が出たか・サイトが引用されたかを表示します。Pro（月14,800円〜、ベータ）は最大20問をPerplexityで計測します（ChatGPTは設定され次第）。駐車場や行き方の質問は手で記録してください。詳しくは[AIでの登場率の測り方](/guide/measure-ai-visibility)へ。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "住所が郵便番号・建物名・階まで、HTMLの文字で書いてある",
            "最寄り駅・路線・出口・徒歩分数と距離が書いてあり、測り方（どこからどこまで）を決めた",
            "目印を2〜3個入れた道順と、入口の場所・階が書いてある",
            "駐車場の有無・台数・場所・料金（提携なら条件）が書いてある。ない場合も「ありません」と書いた",
            "自転車・バイク・バリアフリー・ベビーカーについて書いてある",
            "住所の表記がサイト・Googleビジネスプロフィール・ポータル・SNSで同じ",
            "Googleビジネスプロフィールの属性（駐車場・バリアフリー）がサイトの記述と同じ",
            "構造化データの住所・座標（小数点以下5桁以上）が本文と同じ",
            "移転前の住所・終わった駐車場の情報がページ・PDF・ブログに残っていない",
            "AIへの質問を決め、直した日と2〜4週間後に記録した",
          ],
        },
      ],
      faqs: [
        { q: "地図を埋め込んでいれば、文字で書かなくてもいいですか？", a: "文字でも書いてください。埋め込み地図の中身や画像の案内図をAIが読めるかは、サービスごとに違い、公開されていません。地図は人のための補助と考え、駅・出口・徒歩分数・入口・駐車場を本文に書きます。" },
        { q: "駐車場がありません。書かないほうがいいですか？", a: "「駐車場はありません」と書くほうが確実です。書かないと、AIがほかのサイトの情報や推測で答えることがあります。近くのコインパーキングの探し方や、公共交通での来方を添えます。" },
        { q: "「徒歩◯分」はどう計算すればいいですか？", a: "決まりはありませんが、日本の不動産広告の基準（道に沿った距離で80mを1分、端数は切り上げ）にそろえると、ポータルの表示と食い違いにくくなります。どの出口から入口までを測ったかも書き、距離も添えます。" },
        { q: "構造化データに座標を入れないとAIに出ませんか？", a: "そうとは限りません。Googleのドキュメントでは geo は推奨のプロパティで、必須は name と address です。ChatGPTやPerplexityが座標を使うかは公開されていません。まず本文と住所の表記を整え、座標は入口の位置を確かめて入れます。" },
        { q: "hasMap や amenityFeature は付けるべきですか？", a: "付けても構いませんが、Googleのドキュメントには載っておらず、AIが使うと明記した公式の資料も見つかりませんでした。本文に書いた地図のページや駐車場の情報を、同じ内容で言い換えるものとして付けます。" },
        { q: "移転しました。古い住所がAIに出続けます。", a: "サイト・Googleビジネスプロフィール・ポータル・SNSの住所を同じ日に直し、アクセスのページに移転日と旧住所を1行残します。AIが出典として示したURLを確かめ、古いページやPDFなら直すか消します。反映までの日数は公開されていないので、数週間後に同じ質問で確かめます。" },
        { q: "Nurevoの「住所」の欄には、建物名や階まで入れていいですか？", a: "入れてください。欄の文字はそのまま構造化データの streetAddress と llms.txt の「Address」に出ます。サイトの本文・Googleビジネスプロフィールと同じ表記にそろえます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIが読める状態か、無料で確かめる",
        body: "無料の診断は登録不要で、URLを入れるだけでAIのクローラーの許可・構造化データ・llms.txt を確認できます。WordPressなら無料のプラグインで、住所・電話・営業時間を構造化データと llms.txt に出せます。SEOプラグインの出力とは重複しません。",
        label: "無料でAI対応を診断する",
        href: "/check",
        secondary: { label: "無料のWordPressプラグインを入れてみる", href: WP_ORG },
      },
      footnote: FOOT_JA,
    },
    en: {
      title: "Directions and Parking Pages AI Reads Correctly | Nurevo",
      description: "How to write a directions page so AI answers \"is there parking?\" and \"how do I get there?\" correctly: address, transit, entrance, parking, schema, WordPress.",
      h1: "How to write your directions, access and parking page so AI search gets it right",
      lead: "To get AI to give correct directions and parking information, write these on your directions page as HTML text, not only as a map or an image: your full address (including suite or floor), the nearest station or stop with the exit and walking time (and how you measured it), landmarks to the entrance, and parking (whether you have it, how many spaces, where, and the cost). Then use one address format everywhere — your site, Google Business Profile and directories — and put the same address and your entrance's coordinates in your structured data. If you have no parking, say so: \"We have no parking; please use the public garage on Example Street.\" That leaves AI less room to guess.",
      intro: [
        "Written November 21, 2026 (JST). Opening hours are covered in [How to publish hours and closures](/guide/business-hours-holidays-ai-search) and booking in [How to write your booking page](/guide/booking-page-ai-search). This guide is for any business people visit — shops, clinics, studios, offices, guesthouses — and focuses on one thing: getting AI to say correctly how to reach you and whether you can come by car.",
        "AI answers change with the day, the wording of the question and the service. The steps here make your access details harder for AI to misread and show you how to check; they don't guarantee that you will appear in an answer or that it will be correct.",
      ],
      sections: [
        {
          heading: "The short answer: five reasons AI gets your access details wrong",
          table: {
            head: ["Cause", "What happens in AI answers", "Fix"],
            rows: [
              ["Directions exist only as an embedded map or an image", "AI can't say which station or where to park, or repeats old details from another site", "Under the map, write the station, exit, walking time, entrance and parking as text"],
              ["The address is written differently on your site, Google Business Profile and directories (\"Ste 300\" vs \"Suite 300\", floor missing)", "AI treats you as two places, or drops the suite or floor", "Pick one format, including suite and floor, and use it on every listing"],
              ["Nothing is said about parking", "AI guesses \"parking available\" or \"no parking\"", "Say so even if you have none, and say where to park instead"],
              ["Only \"close to the station\" or \"easy to find\"", "AI can't say which station or which exit", "Name the station, line, exit and walking time, and how you measured it"],
              ["After a move or a parking change, old pages or PDFs are still online", "AI gives your old address or a car park you no longer use", "Find old directions pages, flyer PDFs and blog posts, and fix or remove them"],
            ],
          },
          after: [
            "What visitors actually ask AI comes with conditions: \"Is there parking near (business)?\", \"How far is it from (station)?\", \"Can I get there with a stroller?\" AI answers by pulling sentences from your directions page, so anything not written as text is more likely to be filled in from other sites or by guessing.",
          ],
        },
        {
          heading: "What the top articles cover, and what they miss",
          paragraphs: [
            "We read the top Japanese and English results for searches such as \"directions page parking AI search\", \"local business AI search optimization\" and their Japanese equivalents (November 21, 2026). The Japanese articles agree on naming the station and walking time, stating whether you have parking and keeping the address consistent. Most English articles stop at \"keep your NAP (name, address, phone) consistent\" and barely mention directions or parking. None gave a structured-data example for access details (geo, hasMap, amenityFeature), WordPress steps, or a way to check the result.",
          ],
          table: {
            head: ["Article", "What it does well", "What it misses"],
            rows: [
              [`[Semrush (2026-07-15)](${SRC.semrush})`, "NAP consistency across Google Business Profile and directories; a LocalBusiness JSON-LD example with an address", "No directions, parking or accessibility; no geo"],
              [`[Straight North](${SRC.straightnorth})`, "Verify address or service area in the profile; track AI referrals in GA4 and spot-check prompts monthly", "No directions page guidance; no schema code"],
              [`[Yext (2025-01-24)](${SRC.yext})`, "Location-specific FAQs such as whether a location has free parking", "No markup, no directions page, mostly product-led"],
              [`[Birdeye (updated 2026-08-17)](${SRC.birdeye})`, "Points out that AI handles proximity poorly; consistent listings on Google, Bing and Yelp", "No schema code, no directions page"],
              [`[Uravation, local business (Japanese, updated 2026-09-05)](${SRC.uravationLocal}) and [independent cafés (2026-10-09)](${SRC.uravationCafe})`, "Station, walking route, parking and entrance on the location page; \"3 minutes from the station\" needs a stated starting point", "Properties listed without code; no WordPress steps"],
              [`[Issoh (Japanese, 2026-08-09)](${SRC.issoh})`, "Examples of address variants to unify; parking and accessibility attributes", "No directions-page template or schema example"],
            ],
          },
          after: [
            "This guide answers every question those articles answer and adds a rule for walking times, a template for parking details, address and coordinates written the way Google's documentation shows them, WordPress steps with Nurevo, and a set of questions to check AI with.",
          ],
        },
        {
          heading: "Eight things to put on your directions page",
          paragraphs: [
            "Put these on your location page or a separate \"Directions\" page. If you embed a map, still write the same details as text: AI may not be able to read what's inside the map.",
          ],
          table: {
            head: ["What to write", "Example", "What goes wrong without it"],
            rows: [
              ["Full address with suite or floor and postal code", "123 Example Street, Suite 300, Springfield, IL 62701", "An address without the suite spreads, and people get lost at the door"],
              ["Nearest station or stop, line, exit, walking time", "Springfield Station (Blue Line), north exit, 4-minute walk (about 300 m / 0.2 mi)", "Visitors are directed to the wrong station or exit"],
              ["Route with two or three landmarks", "Turn right out of the north exit, left at the corner café, and we're in the building with the pharmacy on the ground floor, before the second light", "People get close and then get lost; more phone calls"],
              ["Entrance and floor", "The entrance is down the passage on the left of the building, not the front door. Take the elevator to the 3rd floor", "People find the building but not the way in"],
              ["Parking", "Two reserved spaces behind the building (numbers 7 and 8). When full, use the public garage on Oak Street (we don't validate)", "AI guesses whether you have parking"],
              ["Bicycles and motorbikes", "Bike rack in front of the building; no motorbike parking", "People park where they shouldn't"],
              ["Accessibility and strollers", "Elevator available. There is a 2 cm step at the entrance; wheelchair users, please call ahead", "Visitors can't tell whether they can get in"],
              ["Bus, taxi and driving", "Bus 12, Oak Street stop, 1-minute walk. Drivers enter from Main Street (one-way street)", "Drivers take the wrong approach"],
            ],
          },
          after: [
            "Bad: \"Near the station! Parking available. See the map.\" Good: \"4-minute walk (about 300 m) from the north exit of Springfield Station. 123 Example Street, Suite 300. The entrance is down the passage on the left of the building. Two reserved spaces behind the building (7 and 8); when they're full, use the public garage on Oak Street.\"",
            "\"Parking available\" alone doesn't say how many spaces, where, whether it's free or whether it's a partner car park. For a partner car park, give its name, address and the discount terms (for example \"one hour free with a purchase over $20\"). When the terms change, update the page that day.",
          ],
        },
        {
          heading: "Walking times: decide how you measure, and say so",
          paragraphs: [
            `Walking times are easy to get inconsistent. Japanese real-estate advertising has a fixed rule: road distance along the route, 80 m per minute, any remainder rounded up to a full minute, with no allowance for traffic lights or slopes (the enforcement rules of Japan's fair competition code for real-estate advertising, as explained in [Mitsubishi Jisho House Net's glossary](${SRC.walk}), Japanese). Shops and clinics aren't bound by it, and other countries have no common rule, but picking one rule and sticking to it keeps your site and directory listings from disagreeing.`,
          ],
          list: [
            "Decide the start and end points (\"from the north exit gates to our building entrance\")",
            "Measure the walking distance along the route in a map app and convert it with your rule. Adding the distance (\"about 300 m\") lets both AI and people check it",
            "At large stations with several exits, name the closest exit and add one line for people arriving from another",
            "Check your directory listings and Google Business Profile description for a different number, and make them match",
          ],
          after: [
            "Only write \"1 minute from the station\" if you really are at the exit. An exaggerated walking time shows up in reviews as a mismatch.",
          ],
        },
        {
          heading: "Use one address format everywhere",
          paragraphs: [
            "AI services are generally thought to combine your site, Google Business Profile, directories and social profiles to decide whether they describe the same business; how they match them isn't published. When the address is written differently from listing to listing, the listings may not be linked, or an address without the suite or floor ends up in answers. Decide these five things and use them on every listing.",
          ],
          list: [
            "Abbreviations: \"Street\" or \"St\", \"Suite\" or \"Ste\". Either is fine; pick one",
            "Characters: plain hyphens, consistent numbering, no decorative symbols",
            "Building name, suite and floor. If the building is renamed, update every listing that day",
            "Whether to include the state or region (always include it in structured data)",
            "If you also publish an address in another language, write it so it is recognisably the same place (include the building name)",
          ],
          after: [
            "After a move, put the new address on your directions page with one line such as \"We moved on (date); our previous address was …\". Simply deleting the old page leaves the old address on other sites unconnected to your site, and AI may keep giving it.",
          ],
        },
        {
          heading: "Set parking and accessibility attributes in Google Business Profile",
          paragraphs: [
            `Google Business Profile has \"attributes\", shown on Google Search, Maps and other Google services. Some attributes you edit yourself; others may be filled in from customers who visit. Accessibility attributes include a wheelchair-accessible entrance, restroom, seating, elevator and wheelchair-accessible parking — choose Yes for the last one if you have a parking spot reserved for people with accessibility needs. Google says review of an edit usually takes about 10 minutes but can take up to 30 days ([Manage your business attributes](${SRC.gbpAttr}), checked November 21, 2026). Which attributes you see depends on your business category.`,
            "How Google's AI Overviews and AI Mode use profile attributes isn't published. But the profile is the information shown in Google Maps and Search, so make it say the same as your site. Details attributes can't express — number of spaces, cost, partner terms — go in your page text and the profile description.",
          ],
        },
        {
          heading: "Structured data: address, coordinates, map and amenities",
          paragraphs: [
            `In Google's [LocalBusiness structured data documentation](${SRC.gLocal}) (updated September 2026), name and address are required and geo (latitude and longitude) is recommended. The examples split the address into PostalAddress streetAddress, addressLocality, addressRegion, postalCode and addressCountry, and the coordinates must have a precision of at least five decimal places. Take the coordinates from a map app at your entrance: for directions, the door people use is more useful than the middle of the building.`,
            `Google's documentation doesn't mention them, but schema.org also has [hasMap](${SRC.hasMap}) (a URL to a map of the place), [amenityFeature](${SRC.amenity}) (amenities written as [LocationFeatureSpecification](${SRC.lfs}) name/value pairs) and [publicAccess](${SRC.publicAccess}) (whether the place is open to public visitors). In our research we found no official statement that Google or any other AI service uses hasMap or amenityFeature. Adding them does no harm, but treat them as a restatement of what your page text already says.`,
          ],
          code: JSONLD_EN,
          after: [
            "The address, coordinates and number of spaces in your structured data must match the page text. Check the syntax with the [Rich Results Test](" + SRC.rich + ") or the [Schema Markup Validator](" + SRC.validator + "). With several locations, give each location its own page with its own address and coordinates (see [AI search for multi-location businesses](/guide/multi-location-business-ai-search)).",
          ],
        },
        {
          heading: "WordPress steps (with Nurevo AIO)",
          paragraphs: [
            `In [Nurevo AIO (free, formerly shown as Nurevo AEO)](${WP_ORG}), what you type in the Address field is published as typed in your business structured data (PostalAddress streetAddress) and on the \"Address\" line of llms.txt. Work in this order.`,
          ],
          list: [
            "Fix the text of your directions page first, using the eight items above (page text before structured data)",
            "In the Address field, use the same format as your page and Google Business Profile, including suite, floor and postal code. The field is published as one string, not split into parts",
            "Nurevo doesn't guess coordinates from your address. To publish them, add geo with the developer filter webmcp_canary_business_node (code below); hasMap and amenityFeature can be added the same way",
            "If your SEO plugin or theme already publishes your business name, address, phone and hours, Nurevo doesn't publish a second business node, so the filter has no effect; add coordinates in that plugin or theme instead. Nurevo doesn't duplicate Yoast SEO, Rank Math, All in One SEO or Slim SEO, and since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit",
            "The plugin diagnosis's \"Key information coverage\" item shows whether your name, address, phone, hours, location and URL are all published",
            "Sites set up as an online shop or B2B site publish no opening hours or location (geo), as there is no place to visit",
          ],
          code: FILTER_EN,
          after: [
            "Add it to your child theme's functions.php or a code snippets plugin, then check the page source or the Rich Results Test to confirm geo appears on your business. When you move or your parking changes, update the field, the filter and the page text on the same day.",
            "Agencies that maintain client sites can make \"update every listing the same day\" a standard task for moves, parking contract changes and building renames. Nurevo has a [partner program](" + PARTNER + ") for agencies offering monthly support.",
          ],
        },
        {
          heading: "How to check after you've made changes",
          paragraphs: [
            "Ask AI the same questions on the day you make changes and again two to four weeks later, and record the answers. No AI service publishes how long updates take.",
          ],
          table: {
            head: ["Question", "A correct answer"],
            rows: [
              ["\"What is (business)'s address?\"", "Your current address with suite or floor, not the old one"],
              ["\"How do I get to (business) from (station)?\"", "The exit and walking time on your site"],
              ["\"Is there parking at (business)?\"", "Whether you have it, how many spaces and the partner terms, as on your site"],
              ["\"Is (business) wheelchair accessible?\"", "The same as your site and Google Business Profile"],
              ["\"(Business type) with parking in (area)\"", "Whether your name appears, and whether your directions page is cited"],
            ],
          },
          after: [
            "Record the date, the AI service, the question, the answer and the cited URLs. If the source is a directory or an old flyer, fix that. On Nurevo's Free and Standard plans, the Nurevo service asks Perplexity three unbranded questions built from your business type and area once a month and shows whether your name appeared and your site was cited. Pro (beta, from USD 99 a month) tracks up to 20 questions on Perplexity (ChatGPT once it is set up). Record parking and directions questions by hand. See [How to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Your address, with suite or floor and postal code, is written as HTML text",
            "The nearest station or stop, line, exit, walking time and distance are written, and you decided where you measured from and to",
            "A route with two or three landmarks, plus the entrance and floor, is written",
            "Parking — whether you have it, spaces, location, cost, partner terms — is written; if you have none, it says so",
            "Bicycles, motorbikes, accessibility and strollers are covered",
            "The address is written the same way on your site, Google Business Profile, directories and social profiles",
            "Google Business Profile attributes (parking, accessibility) match your site",
            "The address and coordinates (at least five decimal places) in structured data match the page text",
            "No page, PDF or blog post still shows an old address or a car park you no longer use",
            "You chose your questions and recorded AI's answers on the day and two to four weeks later",
          ],
        },
      ],
      faqs: [
        { q: "We embed a map. Do we still need to write directions as text?", a: "Yes. Whether AI can read an embedded map or a directions image differs by service and isn't published. Treat the map as help for people, and write the station, exit, walking time, entrance and parking in the page text." },
        { q: "We have no parking. Should we just leave it out?", a: "Saying \"We have no parking\" is safer. If you say nothing, AI may answer from other sites or guess. Add where to park nearby and how to come by public transport." },
        { q: "How should we work out walking time?", a: "There is no universal rule. Japan's real-estate advertising standard (road distance, 80 m per minute, round up) is one clear option. Whatever you choose, say where you measured from and to, and add the distance." },
        { q: "Do we need coordinates in structured data to appear in AI answers?", a: "Not necessarily. In Google's documentation geo is recommended and only name and address are required. Whether ChatGPT or Perplexity use coordinates isn't published. Fix the page text and address format first, then add coordinates taken at your entrance." },
        { q: "Should we add hasMap or amenityFeature?", a: "You can, but they aren't in Google's documentation and we found no official statement that any AI service uses them. Add them as a restatement of the map page and parking details already on your page." },
        { q: "We moved, and AI keeps giving our old address.", a: "Update your site, Google Business Profile, directories and social profiles on the same day, and keep one line on your directions page with the move date and the previous address. Check the URLs AI cites; if they're old pages or PDFs, fix or remove them. Update times aren't published, so ask again a few weeks later." },
        { q: "Can I include the suite and floor in Nurevo's Address field?", a: "Yes, please do. The field is published as typed in streetAddress and on the llms.txt \"Address\" line. Use the same format as your page and Google Business Profile." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See whether AI can read your site",
        body: "The free check needs no sign-up: enter a URL to see AI crawler access, structured data and llms.txt. On WordPress, the free plugin publishes your address, phone and hours in structured data and llms.txt, without duplicating your SEO plugin's output.",
        label: "Check your AI readiness for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: FOOT_EN,
    },
  },
};
