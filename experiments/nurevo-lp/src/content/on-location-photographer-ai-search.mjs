// Content page: AI search (AEO) for on-location photographers (出張撮影・
// フリーランスのカメラマン・ロケーションフォト). Industry page.
// Angle: a photographer with no studio is a service-area business. The facts
// AI needs are where they travel (named cities, not "近郊"), the travel fee,
// the total a customer pays, who arranges and pays for location permits, and
// the rain / postponement / cancellation rules — plus how to publish all that
// without putting a home address on the web. Separate from
// photo-studio-ai-search (studio-based: 持ち帰る総額, 衣装, 時期のページ).
//
// Written 2026-11-25 11時 (JST). Nurevo AEO facts come from the plugin source
// and readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2):
// the address is published only when the address field is filled
// (webmcp_canary_own_schema_bundle); the type is LocalBusiness when any of
// address / phone / hours is set and no type is configured
// (webmcp_canary_business_schema_type); the AEO diagnosis counts name, url,
// address, telephone, openingHours as the business properties it reads
// (webmcp_canary_business_required_properties); Nurevo has no areaServed field,
// so it is added with the webmcp_canary_business_node filter (docs/developers.md:
// with Yoast/Rank Math/AIOSEO/Slim SEO active, values they already set win).
// Services: name, minutes, price, currency, category, reservation URL,
// description, URL, up to 20, as Service + Offer + ReserveAction and an
// llms.txt line. Free monthly check: three questions to Perplexity built from
// type and area, never the business name. Pro measurement (beta) on Perplexity.
// Prices: Free 0, Standard 3,000 JPY / USD 20, Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-25):
// - Google Business Profile guidelines (support 3038177, no date shown):
//   service-area businesses should hide the address; a business that travels
//   to customers without a storefront with signage is allowed one service-area
//   profile; overall area should not extend farther than about 2 hours of
//   driving time from where the business is based ("For some businesses,
//   larger service areas may be appropriate"); P.O. boxes / virtual offices not
//   eligible; name = real-world name, no taglines or location info.
// - Manage service areas (9157481): if you don't serve customers at the
//   address, remove it; up to 20 service areas, by cities, postal codes or
//   other areas; no radius; edits can take up to 48 hours.
// - 杉並区 公園で撮影をする場合 (更新 2026-10-09): TV, CM, 販売ビデオ, 業としての
//   SNS, 雑誌等掲載写真 need prior application; 個人利用（家族や友人等のスナップ）
//   does not; weekdays 8:30-17:00, up to 3 hours, handheld only; 写真 1,997円/時;
//   apply at the counter 3 days before; no refund on cancellation.
// - 世田谷区 (最終更新 2026-05-01): 商用目的は規模にかかわらず申請; 個人や家族は
//   不要; weekdays 9-17 (5 parks allow weekend photo shoots); up to 4 hours;
//   写真 1,997円/時; 5 business days before; pay at a bank counter.
// - 港区 区立公園内での商業撮影 (更新 2026-04-13): 簡易な撮影 only; 9-21, 4 hours;
//   walk-in, first come, no reservations; 静止画 6,757円/時 (令和7年4月1日現在).
// - 東京都 井の頭恩賜公園での撮影等について (2023.6.14 改定): weekdays only, no
//   weekends/holidays/桜花期/GW/年末年始; stills 100円/時 for 30㎡ or less.
// - 消費者庁 検討会資料（山下純司「キャンセル料条項についての考え方についての
//   意見」）: quotes 消費者契約法9条1項1号 — the part of a cancellation fee above
//   the 平均的な損害 is void; draft options under discussion (not adopted).
// - ECのミカタ 2023-12-26: CAA 第1回解約料の実態に関する研究会 (2023-12-11);
//   about 6 in 10 people who cancelled in the past year were dissatisfied
//   with paying the fee (survey shown at the meeting; firm not named).
// - NTA tax answer 6902 (checked 2026-11-01 for photo-studio-ai-search, not
//   re-read this run): prices shown to consumers in advance include tax.
// - schema-dts 2.1.0: areaServed on Organization (so LocalBusiness), Service,
//   Offer; "The geographic area where a service or offered item is provided";
//   no Photographer type; Photograph is a CreativeWork.
// Top articles read 2026-11-25: uravation 写真館 (2026-08-12), a-x.inc LLMO
// (2025-11-14), クラウドワークス 費用相場 (2020-07-08, upd 2026-09-29), @SOHO 2本
// (2026-05-29 upd 08-29 / 2026-06-28 upd 07-31), くらしのマーケット 出張撮影一覧,
// stock-sun LLMO; Format (2026-09-01, mod 10-09), PhotoBiz 2本 (2025-09-05 /
// 2026-07-27), PhotoWorkout (2026), DEV Community wedding (mod 2026-11-23),
// Semrush wedding SEO (2024-03-25, noindex), Texta wedding GEO (no date).
// Not verified, so not stated: shrine / temple / commercial-facility photo
// rules, the legal status of portrait rights, how other prefectures' parks
// treat paid family sessions, Google's AI-features page (permission timeout
// this run; cited as checked earlier), any figure for how people use AI to
// find photographers in Japan.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  gbpGuidelines: "https://support.google.com/business/answer/3038177?hl=ja",
  gbpServiceArea: "https://support.google.com/business/answer/9157481?hl=ja",
  gbpGuidelinesEn: "https://support.google.com/business/answer/3038177?hl=en",
  gbpServiceAreaEn: "https://support.google.com/business/answer/9157481?hl=en",
  suginami: "https://www.city.suginami.tokyo.jp/guide/machi/kouen/1005025.html",
  setagaya: "https://www.city.setagaya.lg.jp/02075/23566.html",
  minato: "https://www.city.minato.tokyo.jp/kansashidou/kouen2.html",
  inokashira: "https://www.kensetsu.metro.tokyo.lg.jp/content/000063593.pdf",
  caaCancel: "https://www.caa.go.jp/policies/policy/consumer_system/meeting_materials/assets/consumer_system_cms205_260710_04.pdf",
  ecnomikata: "https://ecnomikata.com/ecnews/41455/",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  areaServed: "https://schema.org/areaServed",
  uravation: "https://uravation.com/llmo/photo-studio-llmo-taisaku/",
  crowdworks: "https://crowdworks.jp/times/know-how/5410/",
  atsoho: "https://atsoho.com/blog/on-location-photography-cost",
  curama: "https://curama.jp/cameraman/business/",
  format: "https://www.format.com/magazine/resources/photography/ai-search-optimization-photographers",
  photobiz: "https://blog.photobiz.com/ai/ai-search-visibility-what-photographers-need-to-know-how-to-take-advantage",
  devto: "https://dev.to/gyubinkim/why-couples-find-another-wedding-photographer-when-they-ask-ai-and-how-to-fix-it-2026-l32",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#organization",
      "name": "例フォト（例）",
      "description": "横浜市を拠点にした出張撮影です。家族写真・七五三・お宮参りを、公園・神社・ご自宅で撮影します。スタジオはありません。横浜市・川崎市は出張費無料、それ以外の神奈川県内と東京都23区は出張費3,300円（税込）です。",
      "url": "https://example.jp/",
      "telephone": "+81-00-0000-0000",
      "areaServed": [
        { "@type": "City", "name": "横浜市" },
        { "@type": "City", "name": "川崎市" },
        { "@type": "AdministrativeArea", "name": "神奈川県" },
        { "@type": "AdministrativeArea", "name": "東京都23区" }
      ]
    },
    {
      "@type": "Service",
      "name": "家族写真の出張撮影（60分）",
      "provider": { "@id": "https://example.jp/#organization" },
      "areaServed": "横浜市・川崎市（出張費無料）",
      "offers": {
        "@type": "Offer",
        "price": "33000",
        "priceCurrency": "JPY",
        "description": "撮影料33,000円（税込）。補正済みデータ60枚以上をオンラインで納品（撮影から14日以内）。横浜市・川崎市は出張費込み。撮影場所の許可が必要な場合の申請と使用料は別途。"
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.com/#organization",
      "name": "Example Photo",
      "description": "On-location family photographer based in Example City. Family, newborn and milestone sessions in parks, at venues or at your home. No studio. No travel fee within Example City and North County; $40 elsewhere in the county.",
      "url": "https://example.com/",
      "telephone": "+1-000-000-0000",
      "areaServed": [
        { "@type": "City", "name": "Example City" },
        { "@type": "AdministrativeArea", "name": "North County" },
        { "@type": "AdministrativeArea", "name": "Example County" }
      ]
    },
    {
      "@type": "Service",
      "name": "On-location family session (60 minutes)",
      "provider": { "@id": "https://example.com/#organization" },
      "areaServed": "Example City and North County (no travel fee)",
      "offers": {
        "@type": "Offer",
        "price": "350",
        "priceCurrency": "USD",
        "description": "Session fee $350 including tax. At least 60 edited images delivered online within 14 days. Travel included within Example City and North County. Location permit fees, where a location needs one, are extra."
      }
    }
  ]
}`;

const PHP_JA = `// テーマの functions.php か、子テーマ・コードスニペットのプラグインに追加します。
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'City', 'name' => '横浜市'),
        array('@type' => 'City', 'name' => '川崎市'),
        array('@type' => 'AdministrativeArea', 'name' => '神奈川県'),
        array('@type' => 'AdministrativeArea', 'name' => '東京都23区'),
    );
    return $node;
}, 10, 2);`;

const PHP_EN = `// Add to your child theme's functions.php or a code-snippets plugin.
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'City', 'name' => 'Example City'),
        array('@type' => 'AdministrativeArea', 'name' => 'North County'),
        array('@type' => 'AdministrativeArea', 'name' => 'Example County'),
    );
    return $node;
}, 10, 2);`;

export default {
  slug: "on-location-photographer-ai-search",
  targetQueries: [
    "出張撮影 AI検索対策",
    "出張カメラマン LLMO 集客 ホームページ",
    "フリーランス カメラマン ChatGPT 紹介される",
    "on-location photographer AI search optimization",
    "photographer get recommended by ChatGPT",
    "photographer service area Google Business Profile schema",
  ],
  related: ["photo-studio-ai-search", "pricing-page-ai-search", "booking-page-ai-search", "faq-page-ai-search", "bing-places-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "出張撮影のAI検索対策：撮影エリア・出張費・雨天時 | Nurevo",
      description: "出張撮影・フリーランスのカメラマンのAI検索対策。自宅の住所を出さずに撮影エリアを市区町村名で書き、出張費込みの総額、撮影場所の許可、雨天・キャンセルの規定をAIに正しく読ませる手順と構造化データの例。",
      h1: "出張撮影のAI検索対策：撮影エリア、出張費、撮影場所の許可、雨天時の扱いをAIに正しく読ませる手順",
      lead: "出張撮影のカメラマンのAI検索対策（AEO）で一番大事なのは、「どこまで来てくれるか」「全部でいくらか」「雨ならどうなるか」をAIが答えられるように、サイトに文字で書くことです。具体的には、撮影エリアを「近郊」ではなく市区町村名で書き、出張費を含めた総額の例を1つ示し、撮影場所の許可を誰が取って誰が払うかを書き、雨天・延期・キャンセルの規定を条件つきで載せます。スタジオがない場合は、自宅の住所を出さずに、Googleビジネスプロフィールを「サービス提供地域」で作り、サイトの構造化データには areaServed で地域を入れます。",
      intro: [
        "作成日：2026年11月25日（JST）。Googleビジネスプロフィールの決まりと、公園での撮影の決まり（杉並区・世田谷区・港区・東京都）は、本文に記した公式のページで2026年11月25日に確認しました。この記事は法的な助言ではありません。撮影場所の扱いは、その場所の管理者に確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがあなたの撮影の条件を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。写真館（スタジオ）の場合は[写真館のAI検索対策](/guide/photo-studio-ai-search/)をご覧ください。",
      ],
      sections: [
        {
          heading: "出張撮影について、AIにどんな質問がされるか",
          paragraphs: [
            "出張撮影を探す人は、撮りたい場面（家族写真・七五三・お宮参り・前撮り・会社のプロフィール写真など）と場所から入り、そのあと「来てもらえるか」「総額はいくらか」「当日雨ならどうなるか」で候補を絞ります。スタジオに来てもらう写真館と違い、出張撮影では、撮影する場所と移動の条件が答えの中心になります。",
          ],
          table: {
            head: ["よくある質問の型", "質問の例", "AIが答えに必要な、カメラマン側の事実"],
            rows: [
              ["エリア", "「◯◯市で出張撮影してくれるカメラマンは？」", "撮影エリアの市区町村名、出張費が無料の範囲と、かかる範囲の金額"],
              ["総額", "「七五三の出張撮影、出張費込みでいくら？」", "撮影料・出張費・データの枚数・追加料金の有無と、総額の例"],
              ["場所", "「◯◯公園で撮ってもらえる？許可はいる？」", "撮影した実績のある場所、許可が必要な場所の扱い（誰が申請・誰が払う）"],
              ["天気", "「雨の日はどうなる？延期できる？」", "雨天時の判断の時間、延期の回数と期限、延期・中止の費用"],
              ["キャンセル", "「子どもが熱を出したらキャンセル料は？」", "キャンセル料の時期と割合、体調不良などの扱い"],
              ["納品", "「データは何枚、いつもらえる？」", "納品の枚数・形式・受け取り方・期限・保存期間"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            `2026年11月25日に、日本語と英語で「出張撮影 AI検索対策」「photographer AI search」などの上位記事を14本読みました。日本語でカメラマン向けのAI検索の記事は、写真館（スタジオ）を前提にした[uravationの記事](${SRC.uravation})が中心で、料金を「持ち帰る総額」で書くことや行事ごとのページの更新は具体的ですが、出張撮影の撮影エリアや撮影場所の許可は扱っていません。[クラウドワークス](${SRC.crowdworks})や[@SOHO](${SRC.atsoho})の記事は、拘束時間・出張費・データ・キャンセル料の相場を依頼する側に向けて説明していて、見積もりの項目を知るのに役立ちますが、相場の数字に出典はなく、AI検索の話はありません。`,
            `英語では、[Format](${SRC.format})や[PhotoBiz](${SRC.photobiz})の記事が、ポートフォリオの文章や口コミ、外部のサイトでの言及を勧めていて、方向は妥当です。ただ、どちらも自社のサービスの宣伝を含み、構造化データは型の名前を挙げるだけでした。[DEV Communityの記事](${SRC.devto})は結婚式のカメラマン向けの JSON-LD の例と、出張費の書き方に触れている点が参考になります。一方で、どの記事にも、自宅の住所を出さずにエリアを示す方法（Googleの決まり）、撮影場所の許可の書き方、雨天とキャンセルの規定の書き方、WordPressでの手順、出ているかの確かめ方はありませんでした。この記事は、これらの抜けを埋めます。`,
          ],
        },
        {
          heading: "撮影エリアは「近郊」ではなく、市区町村名と出張費で書く",
          paragraphs: [
            "「首都圏どこでも」「近郊は出張費無料」のような書き方では、AIは「◯◯市に来てくれるか」に答えられません。市区町村名を並べ、出張費を範囲ごとに金額で書きます。範囲の外も「応相談」だけでなく、交通費の計算の仕方を書いておくと、条件つきで紹介されやすくなります。",
          ],
          table: {
            head: ["書き方", "AIにとっての読みやすさ", "直し方の例"],
            rows: [
              ["「近郊は出張費無料」", "どこが近郊か判断できない", "「横浜市・川崎市は出張費無料」"],
              ["「関東一円対応」", "範囲が広く、出張費がわからない", "「神奈川県内と東京都23区は出張費3,300円（税込）、それ以外は交通費の実費」"],
              ["「遠方応相談」だけ", "来てもらえるか判断できない", "「上記以外は、横浜駅からの往復の交通費（実費）と、片道2時間を超える場合は宿泊費をいただきます」"],
              ["地図の画像だけ", "画像の文字は読まれないことがある", "地図の下に、同じ地域を文字で並べる"],
              ["エリアのページが何枚もある", "同じ内容の地域ページは評価されにくい", "エリアは1ページにまとめ、地域ごとのページは撮影例など中身があるときだけ作る"],
            ],
            caption: "金額は説明のための例です。",
          },
          after: [
            "撮影できる曜日や時間帯（平日のみの場所、日の出・夕方の撮影の可否）、移動の手段（車か電車か、駐車場が必要か）も、同じページに書いておくと、AIが条件つきで答えられます。",
          ],
        },
        {
          heading: "スタジオがないなら：Googleビジネスプロフィールは「サービス提供地域」で",
          paragraphs: [
            `お客様のところへ行って撮影し、自宅などで客を迎えない場合、Googleビジネスプロフィールでは「サービス提供地域」のビジネスとして扱われます。Googleのガイドラインは、こうした事業者は住所をお客様に表示しないよう求めていて、自宅で事業をしている配管業者を例に挙げています。看板のある店舗がなく、お客様のもとへ出向く事業は、サービス提供地域のプロフィールを1つ持てます。[Google：ビジネス情報のガイドライン](${SRC.gbpGuidelines})`,
            `サービス提供地域は、市区町村や郵便番号などで最大20件まで設定できます。半径での指定はできず、範囲は拠点から車でおよそ2時間を超えないこととされています（業種によっては、より広い範囲が適切な場合もあると書かれています）。変更が表示されるまで最大48時間かかることがあります。[Google：サービス提供地域の管理](${SRC.gbpServiceArea})`,
          ],
          list: [
            "看板を出して客を迎える撮影スペースがある場合は、住所とサービス提供地域の両方を入れる「ハイブリッド」の扱いになります。看板がない場所は店舗として扱われません。",
            "私書箱や、実際に仕事をしていないバーチャルオフィスの住所は使えません。",
            "ビジネス名は、サイトや名刺で使っている実際の名前にします。「◯◯市 出張撮影 七五三」のように地域名やサービス名を足すことは認められておらず、プロフィールの停止につながることがあります。",
            "サイトに書く撮影エリアと、プロフィールのサービス提供地域を同じ地域にします。どちらかだけを変えると、AIがどちらを使うか定まりません。",
          ],
        },
        {
          heading: "料金は「撮影料＋出張費＋データ」の総額の例を1つ書く",
          paragraphs: [
            `依頼する側向けの記事では、出張撮影の見積もりは、拘束時間、出張費・交通費、データの枚数やレタッチ、商用利用の範囲で決まると説明されています。[@SOHO：出張撮影の相場](${SRC.atsoho})。AIに「出張費込みでいくら？」と聞かれたときに答えられるように、プランごとに次の項目を文字で書き、よくある条件での総額の例を1つ示します。消費者に前もって示す価格は、税込みの総額で表示する必要があります。[国税庁：総額表示](${SRC.ntaTotal})`,
          ],
          table: {
            head: ["書く項目", "書き方の例"],
            rows: [
              ["撮影料と撮影時間", "家族写真60分 33,000円（税込）。準備と移動の時間は含みません"],
              ["出張費", "横浜市・川崎市は無料、神奈川県内と東京都23区は3,300円（税込）"],
              ["データ", "補正済みデータ60枚以上、JPEG、オンラインで納品、撮影から14日以内、ダウンロードの期限は30日"],
              ["追加料金", "延長30分ごとに8,800円、2か所目の撮影場所は5,500円、撮影場所の使用料は実費"],
              ["総額の例", "横浜市内の公園で60分、延長なしなら33,000円（使用料のかかる場所は別途）"],
            ],
            caption: "金額は説明のための例です。プランが複数あるなら、プランごとに同じ項目で書きます。",
          },
          after: [
            "料金の画像だけでなく、本文に同じ内容を文字で書きます。料金ページの書き方全般は[料金ページのAI検索対策](/guide/pricing-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "撮影場所の許可：誰が申請し、誰が払うかを書く",
          paragraphs: [
            "出張撮影で多いのが「この公園で撮ってもらえる？」という質問です。公園などで撮るときの決まりは管理者ごとに違い、同じ東京都内でも区ごとに異なります。2026年11月25日に確認した例は次のとおりです。",
          ],
          table: {
            head: ["管理者（確認したページ）", "申請がいる撮影", "写真の使用料（1時間）", "申請の時期"],
            rows: [
              [`杉並区の区立公園（[2026-10-09更新](${SRC.suginami})）`, "テレビ・CM・販売ビデオ・業としてのSNS・雑誌等の掲載写真など。家族や友人のスナップなど個人利用は不要", "1,997円", "利用日の3日前までに窓口で。平日8:30〜17:00、3時間まで"],
              [`世田谷区の区立公園（[2026-05-01更新](${SRC.setagaya})）`, "商用目的の撮影は規模にかかわらず。個人や家族の撮影は不要", "1,997円", "5営業日前まで。原則平日9:00〜17:00、4時間まで"],
              [`港区の区立公園（[2026-04-13更新](${SRC.minato})）`, "商業撮影（簡易な撮影に限る）", "6,757円", "当日に窓口で先着順、予約はできない"],
              [`東京都 井の頭恩賜公園（[2023-06-14改定](${SRC.inokashira})）`, "撮影等（土日祝・桜の時期などは不可）", "100円（30㎡以下の場合）", "西部公園緑地事務所に問い合わせ"],
            ],
            caption: "公式のページの記載を要約したものです。お金を受け取って家族を撮る出張撮影が「商用」や「業として」にあたるかは、これらのページには書かれていません。撮る前に、その場所の管理者に確認してください。",
          },
          after: [
            "サイトに書くのは、法律や区の決まりの解説ではなく、自分の運用です。たとえば「公園・神社・商業施設での撮影は、管理者の決まりに従います。許可が必要な場所は、撮影者が事前に確認して申請し、使用料はお客様にご負担いただきます（金額は事前にお知らせします）」のように、誰が確認し、誰が申請し、費用を誰が持つかを書きます。撮影した実績のある場所を一覧にしておくと、「◯◯公園で撮れる？」に答えやすくなります。",
            "神社やお寺、商業施設、結婚式場などは、それぞれ独自の決まりがあります。この記事では確認していないので、場所ごとに管理者に確かめ、サイトには確かめた事実だけを書いてください。",
          ],
        },
        {
          heading: "雨天・延期・キャンセルは、時期と割合で書く",
          paragraphs: [
            "屋外の出張撮影では、雨と子どもの体調不良による変更が避けられません。「雨天の場合はご相談」だけでは、AIは「雨なら無料で延期できるか」に答えられません。判断の時刻、延期の回数と期限、費用を書きます。",
          ],
          table: {
            head: ["決めて書くこと", "書き方の例"],
            rows: [
              ["雨天の判断", "前日の18時に、撮影者からメールで実施か延期かをご連絡します"],
              ["雨天の延期", "雨天による延期は2回まで無料。最初の予約日から3か月以内に撮影します"],
              ["小雨のとき", "小雨で実施する場合は、屋根のある場所かご自宅での撮影に切り替えられます"],
              ["お客様都合のキャンセル", "8日前まで無料、7〜2日前は撮影料の30%、前日・当日は50%"],
              ["体調不良", "お子さまの発熱などは、当日でも延期として扱います（1回まで）"],
            ],
            caption: "時期と割合は説明のための例です。自分の実際の規定を書いてください。",
          },
          after: [
            `キャンセル料の決め方には法律の決まりもあります。消費者契約法第9条第1項第1号は、キャンセル料のうち、同じ種類の契約の解除で事業者に生じる「平均的な損害」を超える部分を無効としています（消費者庁の検討会の資料での引用による）。[消費者庁 検討会資料（PDF）](${SRC.caaCancel})。消費者庁は2023年12月から解約料の実態に関する研究会を開いており、その場では、過去1年にキャンセルをした人の約6割がキャンセル料の支払いに不満と答えた調査が示されたと報じられています。[ECのミカタ（2023年12月26日）](${SRC.ecnomikata})。割合を決めるときは、実際にかかる費用（予約で断った撮影の機会、準備の費用など）をもとにし、迷う場合は専門家に相談してください。`,
            "規定は料金ページと予約ページの両方に同じ文で書きます。予約の流れの書き方は[予約ページのAI検索対策](/guide/booking-page-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "作例とお客様の写真：文章をそえて、掲載の同意を取る",
          list: [
            "作例のギャラリーは、写真だけでなく、撮影の場面・場所・季節・時間帯を短い文章で書きます（例：「11月の山下公園、午後3時、七五三の家族写真」）。AIや検索エンジンは、写真の中身よりも、まわりの文章とalt属性から読み取ります。",
            "お客様の写真をサイトやSNSに載せるときは、撮影の前に、掲載してよいか・どこに載せるか・顔をぼかすかを書面かメールで確認し、記録を残します。予約ページに「作例として掲載をお願いすることがあります。お断りいただいても料金は変わりません」のように書いておくと、トラブルを防げます。",
            "口コミは、お客様に書いてもらうよう頼むことはできますが、星の数を条件にしたり、謝礼と引き換えにしたりしないでください。くらしのマーケットのようなポータルでは、口コミの規約にも従います。",
          ],
        },
        {
          heading: "構造化データ：カメラマン専用の型はない。LocalBusiness＋areaServed",
          paragraphs: [
            `schema.orgにはカメラマンや写真の撮影業を表す専用の型はありません（Photographは写真の作品を表す CreativeWork の型です）。事業者は LocalBusiness で出し、撮影エリアは[areaServed](${SRC.areaServed})で書きます。areaServed は「サービスや商品が提供される地域」を表す項目で、LocalBusiness（Organization）、Service、Offer に使えます（schema-dts 2.1.0で確認、2026年11月25日）。自宅の住所を公開しないなら、address は入れません。`,
          ],
          code: SCHEMA_JA,
          after: [
            `GoogleはAI OverviewsやAI Modeのために特別なマークアップは必要ないとしています。[Google：AI features and your website](${SRC.googleAi})。構造化データは、本文に書いた撮影エリアと料金を、機械が読める形にした写しとして使い、本文と同じ内容にします。`,
          ],
        },
        {
          heading: "WordPressの出張撮影サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「その他」を選び、名前・電話番号・受付時間を入れます。スタジオがなく自宅を公開しない場合は、住所の欄を空のままにします。住所が空なら、Nurevo AEOは address を出力しません。電話か受付時間が入っていれば、型は LocalBusiness になります。AEOスコアの診断では住所が不足として数えられますが、自宅を公開しない方針なら空欄のままで構いません。",
            "事業の説明に、拠点の市、スタジオがないこと、撮影エリアと出張費、撮影する場面を書きます。",
            "撮影のプランを「サービス」に登録します（最大20件）。名前・時間（分）・料金・予約のURL・説明を入れ、説明に出張費が無料の範囲、データの枚数と納品の期限、撮影場所の使用料の扱いを書きます。サービスは構造化データ（Service）とllms.txtに載ります。",
            "Nurevo AEOには撮影エリア（areaServed）の入力欄がありません。構造化データにも入れたい場合は、下の webmcp_canary_business_node フィルターで足します。Yoast SEOなどが有効な場合は、そのプラグインがすでに出している値が優先されます。",
            "雨天・延期・キャンセル、撮影場所の許可、データの受け取り方などをよくある質問に入力し、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を料金ページか予約ページに置きます。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search/)をご覧ください。",
            "/llms.txt を開き、料金・撮影エリア・予約・作例・よくある質問のページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。",
          ],
        },
        {
          heading: "Googleビジネスプロフィール・ポータル・SNSとそろえる",
          paragraphs: [
            `出張撮影は、自社サイトのほかに、Googleビジネスプロフィール、[くらしのマーケット](${SRC.curama})のような出張サービスのポータル、Instagramなどにも情報があることが多い業種です。AIはこれらも読むので、エリアや料金が場所ごとに違うと、どれが正しいか定まらず、古い情報が答えに使われることがあります。`,
          ],
          table: {
            head: ["そろえる事実", "自社サイト", "Googleビジネスプロフィール", "ポータル・SNS"],
            rows: [
              ["撮影エリア", "エリアのページ（市区町村名）", "サービス提供地域（最大20件）", "対応地域の欄・プロフィール文"],
              ["料金・出張費", "料金ページ（総額の例つき）", "サービスと説明", "メニューの料金と出張費の欄"],
              ["雨天・キャンセル", "料金ページと予約ページ", "（説明やQ&Aに書く場合）", "キャンセル規定の欄"],
              ["ビジネス名", "サイトの名前", "実際の名前（地域名を足さない）", "同じ名前"],
              ["受付時間・連絡先", "フッターと予約ページ", "営業時間と電話", "同じもの"],
            ],
            caption: "ポータルやSNSの欄の名前と有無は、サービスによって違います。この表はそろえる項目の考え方を示すものです。",
          },
          after: [
            "Bingで使われる情報はBing Placesにもそろえます。手順は[Bing PlacesのAI検索対策](/guide/bing-places-ai-search/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "撮影エリアが市区町村名で書かれ、出張費が範囲ごとに金額で書かれている。",
            "範囲の外の交通費・宿泊費の計算の仕方が書かれている。",
            "プランごとに撮影料・時間・データの枚数と期限・追加料金が税込みで書かれ、総額の例が1つある。",
            "撮影場所の許可を誰が確認・申請し、使用料を誰が持つかが書かれている。",
            "雨天の判断の時刻、延期の回数と期限、キャンセル料の時期と割合が、料金ページと予約ページで同じ文になっている。",
            "作例に、場面・場所・季節の短い文章とaltがある。",
            "お客様の写真の掲載について、事前の確認の文が予約ページにある。",
            "自宅を公開しない場合、サイト・構造化データ・Googleビジネスプロフィールのどこにも自宅の住所が出ていない。",
            "サイトの撮影エリアと、Googleビジネスプロフィールのサービス提供地域・ポータルの対応地域が同じ。",
            "llms.txtに料金・撮影エリア・予約・よくある質問のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、依頼する人が聞きそうな質問をAIに投げます。「◯◯市 出張撮影 七五三」「◯◯公園で家族写真を撮ってくれるカメラマン」のような地域＋場面の質問で名前が出るかに加えて、自分の名前を入れて「出張費はいくら？」「雨の日はどうなる？」と聞き、答えがサイトの事実と合っているかも見ます。エリアの外の地域で紹介されていないかも確かめます。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、結果を記録します。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（事業の名前は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在はPerplexity）。どちらも回答の一部を見本として調べるもので、すべての回答を見ているわけではありません。くわしくは[AIでの登場率の測り方](/guide/measure-ai-visibility/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "出張撮影のAI検索対策は、何から始めればいいですか？", a: "まず、撮影エリアを市区町村名で書き、出張費を範囲ごとに金額で書きます。次に、プランごとの総額の例と、雨天・延期・キャンセルの規定を料金ページに文字で書きます。そのうえで、Googleビジネスプロフィールのサービス提供地域をサイトと同じ地域にそろえ、構造化データとllms.txtで出します。" },
        { q: "自宅で仕事をしています。住所を出さないとAIに紹介されませんか？", a: "住所を出さなくても、撮影エリアを市区町村名で書けば、地域の質問に答えるための事実はそろいます。Googleのガイドラインも、客を迎えないサービス提供地域の事業者には住所を表示しないよう求めています。サイトと構造化データでは areaServed で地域を示し、自宅の住所はどこにも書かないようにします。" },
        { q: "撮影エリアはいくつまで書けますか？", a: "サイトには制限はありませんが、実際に行ける範囲だけを書きます。Googleビジネスプロフィールのサービス提供地域は最大20件で、拠点から車でおよそ2時間を超えない範囲とされています。半径での指定はできません。" },
        { q: "公園での撮影に許可はいりますか？", a: "管理者によって違います。たとえば杉並区は業としてのSNSや雑誌の掲載写真などに事前の申請を求め、家族や友人のスナップなど個人利用は不要としています。世田谷区は商用目的の撮影は規模にかかわらず申請が必要としています。お金を受け取る出張撮影がどちらにあたるかは、撮る前に管理者に確認してください。" },
        { q: "キャンセル料は何％にすればいいですか？", a: "決まった割合はありません。消費者契約法では、同じ種類の契約の解除で生じる平均的な損害を超える部分は無効とされています。実際にかかる費用をもとに決め、時期と割合をサイトに書き、迷う場合は専門家に相談してください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・連絡先・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ず紹介されますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、撮影エリアと料金・規定の事実をAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの撮影サイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOで撮影のプランとよくある質問を無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleはGoogle LLCの、BingはMicrosoft Corporationの、InstagramはMeta Platforms, Inc.の商標です。くらしのマーケット、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for On-Location Photographers: Area, Fees | Nurevo",
      description: "AEO for on-location photographers: list the towns you cover without showing a home address, show an all-in price with travel, and state location-permit and rain rules.",
      h1: "AI search for on-location photographers: getting AI to read your service area, travel fees, location permits and rain policy correctly",
      lead: "AI search optimization (AEO) for an on-location photographer comes down to writing, as text on your site, the three things people ask AI before they book: how far you travel, what it costs in total, and what happens if it rains. Name the towns you cover instead of writing \"and surrounding areas\", give one worked example of the total including travel, say who arranges and pays for location permits, and state your rain, postponement and cancellation terms with dates and percentages. If you have no studio, keep your home address off the web: set up your Google Business Profile as a service-area business and put your area in your site's structured data with areaServed.",
      intro: [
        "Written November 25, 2026 (JST). The Google Business Profile rules were checked on Google's help pages on November 25, 2026. The park-permit and cancellation-fee examples are from Japan (Tokyo wards and Japanese consumer law), because that is where we checked them; rules differ by country, city and venue, so check the ones that apply where you shoot. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your terms readable to AI. They do not guarantee that an AI will mention you or rank you anywhere. If you run a studio, see [AI search for photo studios](/guide/photo-studio-ai-search/).",
      ],
      sections: [
        {
          heading: "What people ask AI before booking an on-location photographer",
          paragraphs: [
            "People looking for an on-location photographer usually start with the occasion (a family session, a newborn shoot, an engagement, a company headshot day) and the place, then narrow the list by three things: will you come to them, what is the total, and what happens if the weather turns. Unlike a studio, where the customer comes to you, the place and the travel terms are at the centre of every answer.",
          ],
          table: {
            head: ["Question type", "Example question", "Facts AI needs from you"],
            rows: [
              ["Area", "\"Which photographers do on-location shoots in [town]?\"", "The towns you cover, where travel is free, and what it costs elsewhere"],
              ["Total", "\"How much is a family session including travel?\"", "Session fee, travel fee, number of images, extras, and one total example"],
              ["Location", "\"Can you shoot in [park]? Do we need a permit?\"", "Places you have shot, how permits are handled (who applies, who pays)"],
              ["Weather", "\"What if it rains? Can we reschedule?\"", "When you decide, how many reschedules and by when, any fee"],
              ["Cancellation", "\"What if my child is sick on the day?\"", "Cancellation fees by date, and how illness is treated"],
              ["Delivery", "\"How many photos, and when?\"", "Number, format, delivery method, deadline and how long files stay available"],
            ],
            caption: "The example questions illustrate the article. They are not measured question frequencies.",
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            `On November 25, 2026 we read 14 top-ranking articles in English and Japanese for searches such as \"photographer AI search\" and the Japanese equivalents. In English, [Format](${SRC.format}) and [PhotoBiz](${SRC.photobiz}) recommend descriptive portfolio text, reviews and mentions on other sites, which is sound advice, but both promote their own platforms and only name schema types without showing any. [A DEV Community post](${SRC.devto}) is the most practical: it includes a JSON-LD template for a wedding photographer and mentions travel fees. Several other English pages repeat figures with no source.`,
            `In Japanese, [uravation's article](${SRC.uravation}) is specific about pricing \"the total a family takes home\" but assumes a studio, and the pricing guides by freelance marketplaces such as [CrowdWorks](${SRC.crowdworks}) explain session length, travel, image counts and cancellation fees from the buyer's side, without sources for their figures and without AI search. None of the 14 explained how to show an area without a public address (Google's rules), how to word location permits, how to write rain and cancellation terms, the WordPress steps, or how to check the result. This article fills those gaps.`,
          ],
        },
        {
          heading: "Write your service area as named towns, with the travel fee for each",
          paragraphs: [
            "\"Anywhere in the metro area\" or \"free travel to nearby areas\" leaves AI unable to answer \"Will they come to [town]?\" List the towns or districts, and give the travel fee for each band as an amount. For places outside your bands, say how travel is calculated rather than only \"ask us\"; a clear rule lets AI mention you with the right condition.",
          ],
          table: {
            head: ["How it is written", "What AI can make of it", "Better"],
            rows: [
              ["\"Free travel to nearby areas\"", "It cannot tell what \"nearby\" means", "\"No travel fee within Example City and North County\""],
              ["\"Serving the whole region\"", "Too broad, and the fee is unknown", "\"$40 travel fee elsewhere in Example County; beyond that, actual travel costs\""],
              ["Only \"Travel available on request\"", "It cannot tell whether you would come", "\"Beyond the county: round-trip travel from Example City at cost, plus lodging if it is more than 2 hours each way\""],
              ["A map image only", "Text inside images may not be read", "List the same areas as text under the map"],
              ["Dozens of near-identical town pages", "Thin location pages tend to be ignored", "Keep the area on one page; make a town page only when it has real content, such as shoots done there"],
            ],
            caption: "Amounts are examples.",
          },
          after: [
            "Put the days and times you can shoot (some places allow weekdays only, sunrise or golden-hour sessions), and how you travel (car or public transport, whether you need parking) on the same page, so AI can answer with the conditions attached.",
          ],
        },
        {
          heading: "No studio? Set up Google Business Profile as a service-area business",
          paragraphs: [
            `If you travel to customers and do not receive them at your own address, Google Business Profile treats you as a service-area business. Google's guidelines say such businesses should hide their address from customers, and give a plumber running the business from home as the example. A business that travels to customers and has no storefront with clear signage is allowed one service-area profile. [Google: Guidelines for representing your business](${SRC.gbpGuidelinesEn})`,
            `You can set up to 20 service areas, by city, postal code or other areas. A radius is not allowed, and the overall area should not extend farther than about 2 hours of driving time from where you are based (Google adds that larger areas may be appropriate for some businesses). Changes can take up to 48 hours to show. [Google: Manage your service areas](${SRC.gbpServiceAreaEn})`,
          ],
          list: [
            "If you do have a space with permanent signage where you receive clients, you are a hybrid business: enter both the address and the service areas. A place without signage does not count as a storefront.",
            "P.O. boxes, and virtual-office addresses you do not actually work from, are not eligible.",
            "Use your real business name as it appears on your site and cards. Adding keywords such as \"[Town] Family Photographer Newborn\" is not permitted and can get the profile suspended.",
            "Make the areas on your site and the service areas on your profile the same. Change one without the other and AI cannot tell which to trust.",
          ],
        },
        {
          heading: "Give one all-in example: session + travel + images",
          paragraphs: [
            `Buyer-side pricing guides break an on-location quote into time on site, travel, the number of images and editing, and the usage rights. [@SOHO: on-location photography prices (Japanese)](${SRC.atsoho}). Write the same items for each package as text, and add one worked total for a common case so AI can answer \"How much including travel?\" If local law requires tax-inclusive pricing for consumers, as Japan does, show the tax-inclusive amount.`,
          ],
          table: {
            head: ["Item", "Example wording"],
            rows: [
              ["Session fee and length", "Family session, 60 minutes, $350 including tax. Travel and set-up time not counted"],
              ["Travel fee", "Free within Example City and North County, $40 elsewhere in Example County"],
              ["Images", "At least 60 edited images, JPEG, delivered online within 14 days, download link open for 30 days"],
              ["Extras", "$90 per extra 30 minutes, $50 for a second location, location fees at cost"],
              ["Total example", "60 minutes in a park in Example City, no extension: $350 (locations with a fee are extra)"],
            ],
            caption: "Amounts are examples. If you have several packages, use the same items for each.",
          },
          after: [
            "Write this in the page text as well as in any price graphic. For pricing pages in general, see [pricing pages and AI search](/guide/pricing-page-ai-search/).",
          ],
        },
        {
          heading: "Location permits: say who applies and who pays",
          paragraphs: [
            "\"Can you shoot at [park]?\" is one of the most common questions an on-location photographer gets. The rules depend on who manages the place, and they differ even between neighbouring districts. Here is what four Tokyo park managers said on November 25, 2026, as an illustration of how much they vary.",
          ],
          table: {
            head: ["Manager (page checked)", "Shoots that need an application", "Stills fee (per hour)", "When to apply"],
            rows: [
              [`Suginami ward parks ([updated 2026-10-09](${SRC.suginami}))`, "TV, adverts, sales video, social media \"as a business\", magazine photos and similar; personal snapshots of family or friends do not", "¥1,997", "At the counter at least 3 days before; weekdays 8:30–17:00, up to 3 hours"],
              [`Setagaya ward parks ([updated 2026-05-01](${SRC.setagaya}))`, "Any commercial shoot, whatever its size; personal or family photos do not", "¥1,997", "At least 5 business days before; mainly weekdays 9:00–17:00, up to 4 hours"],
              [`Minato ward parks ([updated 2026-04-13](${SRC.minato}))`, "Commercial shoots (simple shoots only)", "¥6,757", "On the day at the counter, first come, no reservations"],
              [`Tokyo Metropolitan Government, Inokashira Park ([revised 2023-06-14](${SRC.inokashira}))`, "Shoots (not on weekends, holidays or cherry-blossom season)", "¥100 (30 m² or less)", "Ask the park office"],
            ],
            caption: "Summarised from the official pages, in Japanese. None of them says whether a paid family session counts as \"commercial\" or \"as a business\". Ask the manager of the place before you shoot.",
          },
          after: [
            "What goes on your site is not a summary of the law but your own practice. For example: \"We follow the rules of each park, shrine or venue. Where a location needs a permit, we check and apply in advance, and the location fee is passed on to you at cost; we will tell you the amount before you book.\" Say who checks, who applies and who pays. A list of places where you have shot helps AI answer \"Can they shoot at [park]?\"",
            "Religious sites, shopping centres and wedding venues have their own rules, which we did not check for this article. Confirm each with its manager and put only what you have confirmed on your site.",
          ],
        },
        {
          heading: "Rain, rescheduling and cancellation: dates and percentages",
          paragraphs: [
            "Outdoor sessions get moved for rain and for sick children; that cannot be avoided. \"Contact us if it rains\" does not let AI answer \"Can we reschedule for free if it rains?\" Write when you decide, how many free reschedules there are and by when, and what costs what.",
          ],
          table: {
            head: ["Decide and write", "Example wording"],
            rows: [
              ["Rain call", "We email you by 6 pm the day before to confirm or reschedule"],
              ["Rain reschedule", "Up to two free reschedules for rain, within 3 months of the original date"],
              ["Light rain", "In light rain we can move to a covered spot or to your home"],
              ["Client cancellation", "Free up to 8 days before; 30% of the session fee 7–2 days before; 50% the day before or on the day"],
              ["Illness", "A child's fever on the day is treated as a reschedule (once)"],
            ],
            caption: "Dates and percentages are examples. Write your real terms.",
          },
          after: [
            `Cancellation fees can be limited by law. In Japan, Article 9(1)(i) of the Consumer Contract Act voids the part of a cancellation fee that exceeds the \"average damage\" the business suffers from cancellations of that type of contract (as quoted in a Consumer Affairs Agency study-group paper). [Consumer Affairs Agency study-group paper (PDF, Japanese)](${SRC.caaCancel}). The agency began a study group on cancellation fees in December 2023, where a survey was reported in which about 6 in 10 people who had cancelled something in the past year were unhappy about paying the fee. [ECのミカタ, December 26, 2023 (Japanese)](${SRC.ecnomikata}). Base your percentages on what a cancellation actually costs you (the bookings you turned away, preparation), and ask a professional if you are unsure. Other countries have their own consumer rules.`,
            "Put the same wording on both your pricing page and your booking page. For booking pages, see [booking pages and AI search](/guide/booking-page-ai-search/).",
          ],
        },
        {
          heading: "Portfolio and client photos: add words, and get consent",
          list: [
            "Caption gallery images with the occasion, place, season and time of day (for example, \"Family session, Example Park, November, 3 pm\"). AI and search engines understand a photo mostly from the text around it and its alt attribute.",
            "Before you publish a client's photos on your site or social media, confirm in writing or by email whether you may, where, and whether faces should be blurred, and keep the record. A line on the booking page such as \"We may ask to use some images in our portfolio; saying no does not change the price\" prevents most disputes.",
            "You may ask clients for reviews, but do not make them conditional on a star rating or offer something in return. On marketplaces, follow their review rules too.",
          ],
        },
        {
          heading: "Structured data: there is no photographer type, so use LocalBusiness with areaServed",
          paragraphs: [
            `schema.org has no dedicated type for a photographer or a photography business (Photograph is a CreativeWork type for the work itself). Publish the business as LocalBusiness and put your area in [areaServed](${SRC.areaServed}), described as \"the geographic area where a service or offered item is provided\" and available on LocalBusiness (Organization), Service and Offer (checked in schema-dts 2.1.0 on November 25, 2026). If you do not publish your home address, leave address out.`,
          ],
          code: SCHEMA_EN,
          after: [
            `Google says AI Overviews and AI Mode need no special markup. [Google: AI features and your website](${SRC.googleAi}). Treat structured data as a machine-readable copy of the area and prices in your page text, and keep the two identical.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress photography site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working, without duplicate structured data.`,
            "In the setup wizard choose \"Other\" and enter your name, phone and enquiry hours. If you have no studio and keep your home private, leave the address field empty: with no address, Nurevo AEO publishes no address, and with a phone number or hours the type is LocalBusiness. The AEO score's diagnosis counts the address as missing; if keeping your home private is your policy, leave it empty anyway.",
            "In the business description, write your base town, that you have no studio, your area and travel fees, and the occasions you shoot.",
            "Add your packages as Services (up to 20) with name, length in minutes, price, booking URL and description. Put the free-travel area, image count and delivery deadline, and how location fees are handled in the description. Services appear as Service structured data and in llms.txt.",
            "Nurevo AEO has no service-area (areaServed) field. To add it to the structured data, use the webmcp_canary_business_node filter below. If Yoast SEO or a similar plugin is active, values that plugin already sets take precedence.",
            "Enter your rain, rescheduling, cancellation, location-permit and delivery answers as FAQs, and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your pricing or booking page. See [FAQ pages and AI search](/guide/faq-page-ai-search/).",
            "Open /llms.txt and check that your pricing, area, booking, portfolio and FAQ pages are listed. Run the diagnosis on the AEO score screen and fix what it finds.",
          ],
          code: PHP_EN,
          after: [
            "The same checks apply to sites not on WordPress. Enter your URL in the [free check](/check), no sign-up required, to see the state of your structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "Keep Google Business Profile, marketplaces and social profiles in step",
          paragraphs: [
            "On-location photographers usually have their details in several places besides their own site: Google Business Profile, local-services marketplaces, and Instagram or other social profiles. AI reads those too. If your area or prices differ between them, AI cannot tell which is right and may use the oldest.",
          ],
          table: {
            head: ["Fact", "Your site", "Google Business Profile", "Marketplaces and social"],
            rows: [
              ["Service area", "Area page (named towns)", "Service areas (up to 20)", "Coverage field and bio"],
              ["Prices and travel", "Pricing page with a total example", "Services and descriptions", "Package price and travel fields"],
              ["Rain and cancellation", "Pricing and booking pages", "(If you add them to descriptions or Q&A)", "Cancellation policy field"],
              ["Business name", "Site name", "Real name, no keywords added", "Same name"],
              ["Hours and contact", "Footer and booking page", "Hours and phone", "Same"],
            ],
            caption: "Field names and availability vary by service. The table shows which facts to align.",
          },
          after: [
            "Align Bing Places too. See [Bing Places and AI search](/guide/bing-places-ai-search/).",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Your area is written as named towns, with a travel fee amount for each band.",
            "How travel and lodging are charged outside your bands is written.",
            "Each package states session fee, length, image count and deadline, and extras (tax-inclusive where required), with one total example.",
            "Who checks and applies for location permits, and who pays the fee, is written.",
            "The rain call time, number and window of reschedules, and cancellation fees by date use the same wording on the pricing and booking pages.",
            "Portfolio images have a short caption (occasion, place, season) and alt text.",
            "The booking page says you will ask before publishing a client's photos.",
            "If you keep your home private, the address appears nowhere: not on the site, in the structured data or on your profile.",
            "The area on your site matches your Google Business Profile service areas and marketplace coverage.",
            "llms.txt lists your pricing, area, booking and FAQ pages. [What is llms.txt](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Check whether AI mentions you, and whether it is right",
          paragraphs: [
            "Once your pages are in order, put the questions clients would ask to AI. Check whether your name comes up for area-plus-occasion questions such as \"on-location family photographer in [town]\" or \"photographer who shoots at [park]\", and also ask with your name, such as \"What is their travel fee?\" or \"What happens if it rains?\", to see whether the answers match your site. Check too that AI does not recommend you for places outside your area.",
            "AI answers change between runs, so ask the same questions several times, spread over time, and keep a record. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility/).",
          ],
        },
      ],
      faqs: [
        { q: "Where should an on-location photographer start with AI search?", a: "First, write your area as named towns with a travel fee for each band. Then add a total example for each package and your rain, rescheduling and cancellation terms to your pricing page as text. After that, match your Google Business Profile service areas to your site, and publish the same facts in structured data and llms.txt." },
        { q: "I work from home. Will AI ignore me if I do not show an address?", a: "No address is needed to answer area questions if your site names the towns you cover. Google's guidelines ask service-area businesses that do not receive customers to hide their address. Show your area with areaServed on the site and in structured data, and keep your home address off everything." },
        { q: "How many areas can I list?", a: "Your site has no limit, but list only places you actually travel to. Google Business Profile allows up to 20 service areas, within about 2 hours of driving from your base, and does not allow a radius." },
        { q: "Do I need a permit to shoot in a park?", a: "It depends on who manages the park. In Tokyo, for example, Suginami ward requires an application for business social media or magazine photos but not for personal snapshots, and Setagaya ward requires one for any commercial shoot. Whether a paid family session counts is not stated, so ask the manager before you shoot." },
        { q: "What cancellation percentage should I charge?", a: "There is no set figure. In Japan, the Consumer Contract Act voids the part of a cancellation fee above the average damage such cancellations cause; other countries have their own rules. Base your fees on real costs, write the dates and percentages on your site, and ask a professional if unsure." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, contact details, hours, services and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends me?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your area, prices and terms easy for AI to read, and keep checking whether you appear and whether the answers are correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your photography site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your packages and FAQs for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Google of Google LLC, Bing of Microsoft Corporation, and Instagram of Meta Platforms, Inc. Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
