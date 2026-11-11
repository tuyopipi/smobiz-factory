// Content page: AI search (AEO) for restaurants, cafés and bars. Industry page.
//
// Written 2026-11-03 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or its code: the "Restaurant or café" wizard card sets Restaurant and keeps
// CafeOrCoffeeShop / Bakery / BarOrPub (includes/setup-wizard.php); Settings
// has a free "Business type (schema.org type)" field; each service takes a
// name, duration (minutes), price, currency, category, booking URL and
// description, published as a Service with an Offer, a ReserveAction and an
// llms.txt line (nurevo-webmcp.php). The plugin does not publish servesCuisine,
// menu / hasMenu or acceptsReservations (0.9.1), and the copy says so.
// Pro measurement runs on Perplexity (docs/pro-measurement-implementation.md).
//
// Outside facts, checked 2026-11-03 on the primary pages linked in the copy:
// - Google LocalBusiness structured data (last updated 2026-09-08): name +
//   address required; recommended include menu ("the fully-qualified URL of the
//   menu" for food establishments), servesCuisine, priceRange (under 100
//   characters), openingHoursSpecification, telephone, url, geo. The doc's
//   example is a Restaurant. acceptsReservations is not in the doc.
// - schema.org FoodEstablishment: acceptsReservations (Boolean/Text/URL),
//   hasMenu (Menu/Text/URL, supersedes menu), servesCuisine, starRating;
//   subtypes Bakery, BarOrPub, Brewery, CafeOrCoffeeShop, Distillery,
//   FastFoodRestaurant, IceCreamShop, Restaurant, Winery.
// - Google "Optimizing for generative AI features" (last updated 2026-07-10):
//   no special schema.org markup needed; Business Profiles can help visibility
//   in AI responses; llms.txt is ignored by Google Search.
// - Google Business Profile help, "About the menu editor": food and drink
//   businesses; sections, items, prices; a separate menu link; Google may
//   transcribe menu data from your website and you can edit or opt out.
// - OpenAI help "Searching the web with ChatGPT": general location from IP;
//   answers show inline citations and a Sources button.
// - 外食・中食におけるアレルゲン情報の提供に向けた手引き (外食・中食産業等食品表示
//   適正化推進協議会, 2017, revised 2019-09-19 and 2023-03-09): eating-out is
//   outside the Food Labeling Act's mandatory labeling; tell customers about
//   cross-contact risk; keep web information current.
// - National Tax Agency tax answer 6902 (total price display incl. tax).
// - Google Search Central blog 2019-09-16 (self-serving reviews).
// - Consumer Affairs Agency, stealth marketing (since 2023-10-01).
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  googleAiGuide: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  foodEst: "https://schema.org/FoodEstablishment",
  gbpMenu: "https://support.google.com/business/answer/9455840?hl=en",
  chatgptSearch: "https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt",
  allergenGuide: "https://www.jfnet.or.jp/wp/wp-content/uploads/2025/08/%E3%80%90%E9%A3%9F%E3%81%AE%E5%AE%89%E5%85%A8%E3%83%BB%E5%AE%89%E5%BF%83%E9%96%A2%E9%80%A3%E3%82%A2%E3%83%AC%E3%83%AB%E3%82%B2%E3%83%B3%E3%80%91%E5%A4%96%E9%A3%9F%E3%83%BB%E4%B8%AD%E9%A3%9F%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E3%82%A2%E3%83%AC%E3%83%AB%E3%82%B2%E3%83%B3%E6%83%85%E5%A0%B1%E3%81%AE%E6%8F%90%E4%BE%9B%E3%81%AB%E5%90%91%E3%81%91%E3%81%9F%E6%89%8B%E5%BC%95%E3%81%8D.pdf",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
  reviews2019: "https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
};

export default {
  slug: "restaurant-ai-search",
  targetQueries: [
    "AI search optimization for restaurants",
    "how to get ChatGPT to recommend my restaurant",
    "restaurant schema markup servesCuisine menu",
    "飲食店 AI検索対策",
    "飲食店 ChatGPT おすすめ 表示 対策",
    "飲食店 構造化データ Restaurant",
  ],
  related: ["local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "appear-in-chatgpt", "hair-salon-ai-search"],
  locales: {
    ja: {
      title: "飲食店のAI検索対策：メニュー・営業時間・予約をAIに伝える | Nurevo",
      description: "飲食店のAI検索対策は、メニュー・税込価格・営業時間・予約方法・料理のジャンルを文字と構造化データ（Restaurant）で正確に公開し、Googleビジネスプロフィールとそろえること。アレルギー情報の注意点と手順も。",
      h1: "飲食店のAI検索対策：メニュー・営業時間・予約・アレルギー情報をAIに正しく読ませる手順",
      lead: "飲食店・カフェ・バーのAI検索対策（AEO）は、メニューと税込価格、営業時間とラストオーダー、定休日、料理のジャンル、席や個室、予約の方法を、公式サイトに文字で書き、同じ内容を構造化データ（schema.orgのRestaurantなど）とGoogleビジネスプロフィールにそろえて出すことです。「駅の近くで22時以降も入れる個室のある居酒屋」のような質問に、AIが推測せずに答えられる材料を用意します。アレルギーの情報は、出すなら正確で最新に保てる範囲だけを、混入の可能性とあわせて書きます。",
      intro: [
        "作成日：2026年11月3日（JST）。Google・schema.org・OpenAI・国税庁・消費者庁などの情報は、同日に各公式ページで確認したものです。",
        "AIの回答は日や聞き方、聞く人の場所によって変わります。この記事の対策は、AIがお店の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・おすすめの上位に入ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "お客さんがAIに聞く質問と、答えに必要な事実",
          paragraphs: [
            "飲食店を探す質問は、場所・時間・人数・目的・予算・食事の制限が一度に入るのが特徴です。AIはその条件を一つずつ確かめられる情報を探すので、お店がどの条件に当てはまるかを、文字で読める形にしておくことが出発点になります。質問の型ごとに、必要な事実と書く場所を整理すると次のとおりです。",
          ],
          table: {
            head: ["よくある質問の型", "答えに必要な事実", "書く場所"],
            rows: [
              ["「◯◯駅の近くで今から入れる店」", "住所、最寄り駅からの徒歩分数、曜日ごとの営業時間、ラストオーダー、定休日", "店舗情報のページ本文、構造化データ（address・openingHoursSpecification）、Googleビジネスプロフィール"],
              ["「接待に使える個室のある和食」", "料理のジャンル、個室の有無と人数、席数、雰囲気が分かる説明", "本文（席・個室の説明）、構造化データ（servesCuisine）"],
              ["「予算5,000円で飲み放題つきの宴会」", "コースの内容・税込価格・時間・最少人数、飲み放題の条件", "コース・宴会のページ本文、価格の目安（priceRange）"],
              ["「子ども連れで行けるカフェ」「ベビーカーで入れる店」", "子ども用の椅子や食器、ベビーカーでの入店、段差、禁煙・喫煙", "よくある質問、店舗情報の本文、Googleビジネスプロフィールの属性"],
              ["「卵を使わないメニューがある店」「ベジタリアン向けの料理」", "対応できる範囲、原材料の確認方法、混入の可能性、事前相談の窓口", "アレルギー・食事制限のページ（後述の注意点に沿って）"],
              ["「予約できる？」「テイクアウトはある？」", "予約の方法（電話・ウェブ）と受付時間、テイクアウトやデリバリーの有無", "本文、予約ページへのリンク、Googleビジネスプロフィール"],
            ],
            caption: "質問の例は説明のために作ったものです。構造化データの項目名はschema.orgとGoogleのドキュメントによります（2026年11月3日確認）。",
          },
          after: [
            "この表で「書く場所」に本文が必ず入っているのは、構造化データだけで伝えようとしないためです。Googleは、生成AIの機能に出るために特別なschema.orgのマークアップは必要ないとしています（2026年7月10日更新のガイド）。[Google：生成AI機能向けの最適化ガイド](" + SRC.googleAiGuide + ")",
          ],
        },
        {
          heading: "AIはどこからお店の情報を読んでいるか",
          paragraphs: [
            `飲食店について答えるとき、AIが読む情報は大きく分けて、お店の公式サイト、Googleビジネスプロフィール（Googleマップの店舗情報）、グルメサイトや予約サイト、口コミやSNS、ニュースやまとめ記事です。Googleは、ビジネスプロフィールがAIの回答とほかの検索結果の両方で見つけてもらう助けになるとしています。[Google：生成AI機能向けの最適化ガイド](${SRC.googleAiGuide})`,
            `ChatGPTは、ウェブ検索を使うときにIPアドレスからおおよその位置を判断し、回答には出典のリンクと「Sources（情報源）」の一覧を付けます。[OpenAI：Searching the web with ChatGPT](${SRC.chatgptSearch})。「近くの店」のような質問では、聞いた人の場所によって答えが変わるということです。自分で確かめるときは、お店の地域名を質問に入れると比べやすくなります。`,
            "どのAIも、どの情報をどれだけ重く見るかは公開していません。確かに言えるのは、公式サイト・ビジネスプロフィール・グルメサイトで営業時間や価格が食い違っていると、AIはどれが正しいか判断できず、古い情報や間違った情報を答えてしまう可能性がある、ということです。対策の中心は、公式サイトを「正しい情報の元」にして、ほかの場所をそれに合わせることです。",
          ],
        },
        {
          heading: "メニューは画像やPDFだけにせず、文字で載せる",
          paragraphs: [
            "メニューが写真やPDFだけだと、AIや検索エンジンが料理名と価格を正しく読み取れるとは限りません。公式サイトには、料理名・税込価格・簡単な説明を文字で書いたメニューのページを用意し、写真はそれに添えるのが確実です。季節で変わるメニューは「冬のコース（12月〜2月）」のように期間を書き、終わったものは消します。",
            `価格は税込の総額で書きます。国税庁は、消費者に対してあらかじめ価格を表示する場合、表示する媒体を問わず消費税込みの総額を表示するよう定めています。[国税庁：総額表示の義務](${SRC.ntaTotal})。テイクアウトとイートインで税込価格が違う場合は、両方を書いておくと誤解されにくくなります。`,
            `Googleビジネスプロフィールには、飲食店向けのメニュー作成機能があり、セクション・料理名・価格・説明を入れられます。メニューのリンク（URL）は別の欄で設定します。Googleはお店のウェブサイトからメニューの情報を読み取って載せることがあり、間違っていれば編集・削除、または読み取りをやめる設定ができます。[Googleビジネスプロフィール ヘルプ：メニュー エディタについて](${SRC.gbpMenu})。公式サイトのメニューを正しく保つことが、ここでも効いてきます。`,
          ],
        },
        {
          heading: "構造化データ：Restaurantに何を書くか",
          paragraphs: [
            `構造化データでは、お店を[schema.orgのFoodEstablishment](${SRC.foodEst})の種類で表します。FoodEstablishmentはLocalBusinessの一種で、下にRestaurant、CafeOrCoffeeShop（カフェ）、BarOrPub（バー・居酒屋）、Bakery（パン屋）、FastFoodRestaurant、IceCreamShopなどがあります。Googleはローカルビジネスの構造化データで、できるだけ具体的な種類を使うよう案内しており、例にもRestaurantを使っています（2026年9月8日更新のドキュメントを11月3日に確認）。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})`,
          ],
          table: {
            head: ["項目", "書く内容", "Googleでの扱い"],
            rows: [
              ["name / address", "店名（看板・ビジネスプロフィールと同じ表記）と住所", "必須"],
              ["openingHoursSpecification", "曜日ごとの開店・閉店時刻。ランチとディナーで分かれる場合は2つに分ける", "推奨"],
              ["telephone / url / geo", "電話番号、公式サイトのURL、緯度経度", "推奨"],
              ["servesCuisine", "料理のジャンル（例：和食、イタリア料理、焼き鳥）", "推奨"],
              ["menu", "メニューのページのURL（完全なURL）", "推奨"],
              ["priceRange", "価格帯の目安（例：「¥3,000〜¥5,000」）。100文字未満", "推奨"],
              ["acceptsReservations / hasMenu", "予約を受けるか（はい・いいえ、または予約ページのURL）／メニューそのものを構造化したもの", "schema.orgの項目。Googleのドキュメントには載っていない"],
            ],
            caption: "「Googleでの扱い」は、2026年11月3日に確認したGoogleのローカルビジネスのドキュメントによります。acceptsReservationsとhasMenuは、schema.orgのFoodEstablishmentで定義されている項目です。",
          },
          after: [
            "hasMenuを使うと、Menu・MenuSection・MenuItemで料理一つずつを構造化でき、schema.orgの例では食事制限（suitableForDiet）も書けます。ただし、Googleのドキュメントで推奨されているのはメニューのURL（menu）までです。料理一つずつの構造化は、メニューが頻繁に変わる店では更新漏れの原因にもなるので、まずは本文のメニューを正しく保つことを優先してください。",
            "構造化データに書く値は、ページに見えている内容と同じにします。本文にない料理や、実際とは違う価格帯を構造化データだけに書くのはやめましょう。",
          ],
        },
        {
          heading: "アレルギー・食事制限の情報：AIに伝える前に決めておくこと",
          paragraphs: [
            `日本では、飲食店で提供する料理（外食）は、食品表示法によるアレルギー表示の義務の対象ではありません。そのうえで業界の手引きは、情報を出す場合は原材料を仕入れ先の規格書などで確認して最新に保つこと、同じ厨房で調理するため意図しない混入（コンタミネーション）の可能性があることを伝えること、正確な情報を把握できない場合は「提供しない」ことを事前に伝えることなどを求めています。ウェブサイトでの情報提供は来店前に確認できて便利な反面、更新を怠ると誤食の原因になるとも書かれています。[外食・中食におけるアレルゲン情報の提供に向けた手引き（外食・中食産業等食品表示適正化推進協議会、2023年3月9日修正版）](${SRC.allergenGuide})`,
            "AIは、サイトに書かれた文章を要約して答えます。「アレルギー対応」「グルテンフリーで安心」のような短い言葉だけを書くと、条件や例外が落ちたまま伝わるおそれがあります。書くなら、対応できる範囲（例：「卵・乳を使わない料理を3品ご用意しています」）、混入の可能性（「同じ厨房で卵・乳を扱っています」）、確認の方法（「ご予約時に電話でご相談ください」）を、同じ段落にまとめて書きます。対応できないなら、そう書くのも大切な情報です。",
            "構造化データでは、確かめられないことを書かないのが原則です。schema.orgには食事制限を表す項目がありますが、混入の可能性を表せないため、アレルギーに関わる内容は本文で条件ごと説明するほうが安全です。",
          ],
        },
        {
          heading: "口コミとグルメサイト：AI向けにしてはいけないこと",
          paragraphs: [
            `自分のサイトに載せた口コミや星の評価を構造化データにしても、Googleの検索結果で星としては表示されません。Googleは2019年に、事業者についての口コミをその事業者自身のサイトに載せるもの（自己言及的なレビュー）は、LocalBusinessとOrganizationでは認めないとしています。[Google検索セントラル ブログ（2019年9月16日）](${SRC.reviews2019})`,
            `日本では2023年10月1日から、ステルスマーケティングが景品表示法違反になりました。お店が第三者に依頼・指示して書かせた口コミや投稿は、そのお店の広告として扱われます。[消費者庁：ステルスマーケティング](${SRC.caaStealth})。AIに良く書いてもらうために、広告であることを隠した口コミや「地域No.1」のような根拠のない表現を増やすのはやめましょう。`,
            "グルメサイトや予約サイトのページは、AIの出典として使われることがあります。自分で編集できるサイトは、公式サイトと同じ営業時間・価格・定休日に直し、編集できないサイトは運営会社に修正を依頼します。",
          ],
        },
        {
          heading: "WordPressの飲食店サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます。`,
            "初回の設定ウィザードで「飲食店・カフェ」を選びます。業種はRestaurantになります。カフェ・バー・パン屋なら、設定画面の「業種（schema.org型）」をCafeOrCoffeeShop・BarOrPub・Bakeryにします。店名・住所・電話番号・営業時間・お店の説明を確認します。説明文には料理のジャンルと特徴（例：「炭火焼き鳥と日本酒の店。個室あり、最大12名」）を入れます。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "コース料理・宴会プラン・貸切プランなど、予約して申し込むものは、設定画面のサービスとして1つずつ登録します。名前・所要時間（分）・料金（数字だけ）・通貨（JPY）・カテゴリ・予約URL・説明を入れると、お店に紐づいたService（料金はOffer、予約URLは予約のアクション）として出力され、llms.txtにも1行ずつ載ります。",
            "駐車場・子ども連れ・喫煙・持ち込み・キャンセルの扱いなど、実際によく聞かれることをよくある質問に入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可（OAI-SearchBot、PerplexityBot、Claude-SearchBotなど）は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールとグルメサイトの営業時間・価格と一致しているかを見直します。",
          ],
          after: [
            "現在のNurevo AEO（0.9.1）は、servesCuisine・menu（hasMenu）・acceptsReservationsを出力しません。料理のジャンルはお店の説明と本文に、メニューは文字で書いたメニューのページに書いておけば、AIは本文から読めます。構造化データにも入れたい場合は、テーマやほかの方法で追加してください（いずれもGoogleでは必須ではなく推奨の項目です）。SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、足りない住所・電話番号・営業時間・Restaurantなどの種類・サービスだけを追加します。[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/ja/guide/local-business-schema-seo-plugins/)",
          ],
        },
        {
          heading: "AIの回答が間違っていたときの直し方",
          list: [
            "AIの回答に付いている出典のリンクを開き、間違った情報がどのページから来ているかを確かめます。",
            "出典が公式サイトなら、本文と構造化データを直します。ビジネスプロフィールなら、Googleの管理画面で直します。",
            "出典がグルメサイトやまとめ記事なら、自分で編集するか、運営者に修正を依頼します。閉店した旧店舗のページや古い移転前の情報が残っていないかも確かめます。",
            "臨時休業・営業時間の変更・価格改定のときは、公式サイト・ビジネスプロフィール・グルメサイト・llms.txtを同じ日に更新します。",
            "直したあとも、AIの回答にすぐ反映されるとは限りません。数日〜数週間あけて、同じ質問で確かめ直します。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "メニューが文字で書かれ、料理名と税込価格が読める。季節メニューには期間が書かれている。",
            "曜日ごとの営業時間・ラストオーダー・定休日が、公式サイト・ビジネスプロフィール・グルメサイトで一致している。",
            "構造化データの種類がRestaurant・CafeOrCoffeeShop・BarOrPubなど実態に合ったもので、住所・電話番号・営業時間が入っている。",
            "料理のジャンル、席数や個室、子ども連れ・喫煙などの条件が本文に書かれている。",
            "コース・宴会プランの内容・税込価格・時間・予約方法が書かれている。",
            "アレルギーの情報は、出すなら範囲・混入の可能性・確認方法を一緒に書いている。出さないならその旨を書いている。",
            "自分のサイトの口コミを評価の構造化データにしていない。広告であることを隠した口コミを使っていない。",
            "llms.txtに、お店の概要・メニュー・アクセス・予約のページが載っている。[llms.txtとは](/ja/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "お客さんが聞きそうな質問を、地域・ジャンル・場面（ランチ、接待、子ども連れ、深夜など）の組み合わせで10個ほど決め、ChatGPT・Perplexity・GoogleのAI機能に聞いて、お店が名前やURLで出てくるか、営業時間や価格が正しいかを記録します。回答は回ごとに変わるので、同じ質問を期間をあけて繰り返します。やり方は[AIでの登場率の測り方](/ja/guide/measure-ai-visibility/)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（店名は含めません）をPerplexityに投げ、回答にお店の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答にお店が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "飲食店のAI検索対策は、何から始めればいいですか？", a: "公式サイトに、メニュー（料理名と税込価格）・営業時間・ラストオーダー・定休日・住所・予約方法を文字で正しく書くことからです。次に、同じ内容をGoogleビジネスプロフィールとグルメサイトにそろえ、Restaurantなどの構造化データとllms.txtで公開します。" },
        { q: "グルメサイトに載っていれば、公式サイトは要りませんか？", a: "グルメサイトのページもAIの出典になりますが、公式サイトはお店がいちばん詳しく正しく情報を出せる場所で、ほかのサイトを直すときの基準にもなります。両方の値をそろえておくのが確実です。" },
        { q: "メニューの写真を載せていれば十分ですか？", a: "写真やPDFだけだと、料理名や価格が正しく読み取られるとは限りません。料理名・税込価格・説明を文字で書いたメニューのページを用意し、写真はそれに添えるのがおすすめです。" },
        { q: "アレルギー対応をAIに伝えるべきですか？", a: "正確で最新の情報を出し続けられる場合に限ります。日本では外食にアレルギー表示の義務はありませんが、出すなら対応範囲・混入の可能性・確認方法を一緒に書きます。把握しきれない場合は、提供していないことを書くのも大切です。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（Restaurantなど）・住所・営業時間・コースなどのサービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTのおすすめに必ず入りますか？", a: "いいえ。AIの回答は聞き方や聞く人の場所によって変わり、どのツールや対策でも表示や順位は保証できません。できるのは、お店の事実をAIが正しく読める状態にし、出ているか・正しく答えているかを続けて確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがお店のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的・税務上の助言や、食物アレルギーに関する医学的な助言ではありません。",
    },

    en: {
      title: "AI Search for Restaurants: Menus, Hours, Booking & Allergens | Nurevo",
      description: "Restaurant AEO: publish your menu, prices, hours, cuisine and booking as text and Restaurant structured data, match your Business Profile, and handle allergens with care.",
      h1: "AI search for restaurants, cafés and bars: getting AI to read your menu, hours, booking and allergen information correctly",
      lead: "AI search optimization (AEO) for a restaurant, café or bar means writing your menu and prices, opening hours and last orders, days closed, cuisine, seating and private rooms, and how to book as text on your own site, then publishing the same facts in structured data (schema.org Restaurant and its relatives) and in your Google Business Profile. That gives ChatGPT, Perplexity and Google's AI what they need to answer \"a bar near the station with a private room that's open after 10pm\" without guessing. If you publish allergen information, publish only what you can keep accurate and current, together with the risk of cross-contact.",
      intro: [
        "Written November 3, 2026 (JST). Information from Google, schema.org, OpenAI and Japanese public bodies was checked on each official page that day.",
        "AI answers change with the day, the wording of a question and where the person asking is. The steps here make your restaurant's facts readable to AI. They do not guarantee that an AI will recommend you or list you near the top.",
      ],
      sections: [
        {
          heading: "What diners ask AI, and the facts an answer needs",
          paragraphs: [
            "Restaurant questions pack place, time, party size, occasion, budget and dietary needs into one sentence. An AI looks for information that lets it check each condition, so the starting point is to make it readable, as text, which conditions your restaurant meets. Here is how question types map to the facts they need and where to publish them.",
          ],
          table: {
            head: ["Typical question", "Facts needed to answer", "Where to publish"],
            rows: [
              ["\"Somewhere near the station I can walk into now\"", "Address, walking time from the station, hours for each day, last orders, days closed", "Your location page text, structured data (address, openingHoursSpecification), Google Business Profile"],
              ["\"A quiet place with a private room for a client dinner\"", "Cuisine, private rooms and their size, number of seats, a description of the atmosphere", "Page text (seating and rooms), structured data (servesCuisine)"],
              ["\"A group dinner with drinks included for about $40 a head\"", "Set menus with contents, price, duration and minimum party size; drinks package terms", "Set menu or events page, price range (priceRange)"],
              ["\"A café that's easy with kids\" or \"step-free with a stroller\"", "High chairs and kids' tableware, stroller access, steps, smoking policy", "FAQ, location page, Google Business Profile attributes"],
              ["\"Places with egg-free dishes\" or \"vegetarian options\"", "What you can and can't accommodate, how ingredients are checked, cross-contact risk, who to ask", "An allergens and dietary page, following the cautions below"],
              ["\"Can I book?\" \"Do they do takeaway?\"", "How to book (phone or online) and when, takeaway and delivery", "Page text, link to your booking page, Google Business Profile"],
            ],
            caption: "The questions are examples written for this guide. Property names come from schema.org and Google's documentation (checked November 3, 2026).",
          },
          after: [
            "Every row lists page text as a place to publish, because structured data alone is not enough. Google says no special schema.org markup is needed to appear in its generative AI features (guide last updated July 10, 2026). [Google: optimizing for generative AI features](" + SRC.googleAiGuide + ")",
          ],
        },
        {
          heading: "Where AI reads about your restaurant",
          paragraphs: [
            `When an AI answers about restaurants, its sources fall into a few groups: your own website, your Google Business Profile (your listing on Google Maps), restaurant guides and booking sites, reviews and social media, and news or list articles. Google says Business Profiles can help your business be found in both AI responses and other Google Search results. [Google: optimizing for generative AI features](${SRC.googleAiGuide})`,
            `When ChatGPT searches the web, it uses general location information based on your IP address, and its answers include inline citations and a Sources list. [OpenAI: Searching the web with ChatGPT](${SRC.chatgptSearch}). For \"near me\" questions, then, the answer depends on where the person asking is. When you test for yourself, put your area's name in the question so your results are comparable.`,
            "No AI service publishes how much weight it gives each source. What is certain is that when your website, Business Profile and guide listings disagree on hours or prices, an AI cannot tell which is right and may repeat outdated or wrong information. The core of the work is to make your own website the reference for correct information and bring every other listing into line with it.",
          ],
        },
        {
          heading: "Put your menu on the page as text, not only as images or PDFs",
          paragraphs: [
            "If your menu exists only as photos or a PDF, there is no guarantee that AI or search engines read dish names and prices correctly. Give your site a menu page with dish names, prices and short descriptions written as text, and add photos alongside. For seasonal menus, state the period (\"Winter set menu, December to February\") and remove items once they end.",
            `Show prices the way local rules require. In Japan, for example, the National Tax Agency requires prices shown to consumers in advance to include consumption tax, whatever the medium. [National Tax Agency: total price display (Japanese)](${SRC.ntaTotal}). If eat-in and takeaway prices differ, list both so neither people nor AI misread them.`,
            `Google Business Profile has a menu editor for food and drink businesses, with sections, dish names, prices and descriptions, and a separate field for a menu link. Google may also transcribe menu data from your website; you can edit or delete wrong items, or opt out of transcription. [Google Business Profile Help: About the menu editor](${SRC.gbpMenu}). Keeping the menu on your own site accurate pays off here too.`,
          ],
        },
        {
          heading: "Structured data: what to put in Restaurant",
          paragraphs: [
            `In structured data, your business is a kind of [schema.org FoodEstablishment](${SRC.foodEst}), which is a kind of LocalBusiness. Its sub-types include Restaurant, CafeOrCoffeeShop, BarOrPub, Bakery, FastFoodRestaurant and IceCreamShop. Google's local business documentation asks you to use the most specific type possible, and its own example uses Restaurant (document last updated September 8, 2026, checked November 3). [Google: Local business structured data](${SRC.googleLocal})`,
          ],
          table: {
            head: ["Property", "What to put in it", "Status in Google's documentation"],
            rows: [
              ["name / address", "Your name exactly as on your sign and Business Profile, and your address", "Required"],
              ["openingHoursSpecification", "Opening and closing times for each day; split lunch and dinner into two entries if you close in between", "Recommended"],
              ["telephone / url / geo", "Phone number, website URL, latitude and longitude", "Recommended"],
              ["servesCuisine", "The cuisine you serve (for example Japanese, Italian, yakitori)", "Recommended"],
              ["menu", "The full URL of your menu page", "Recommended"],
              ["priceRange", "An indication of prices (for example \"$20–40\"), under 100 characters", "Recommended"],
              ["acceptsReservations / hasMenu", "Whether you take bookings (yes or no, or your booking page URL) / the menu itself as structured data", "schema.org properties, not in Google's documentation"],
            ],
            caption: "Status as listed in Google's local business documentation on November 3, 2026. acceptsReservations and hasMenu are defined on schema.org FoodEstablishment.",
          },
          after: [
            "With hasMenu you can describe each dish using Menu, MenuSection and MenuItem, and schema.org's examples also show dietary suitability (suitableForDiet). Google's documentation, however, only recommends the menu URL (menu). Marking up every dish can also fall out of date quickly when your menu changes often, so make the text menu on your page right first.",
            "Values in structured data should match what the page shows. Do not put dishes that are not on the page, or a price range that does not reflect reality, into your markup alone.",
          ],
        },
        {
          heading: "Allergen and dietary information: decide this before telling AI",
          paragraphs: [
            `Rules differ by country, so check the ones that apply to you. In Japan, food served in restaurants is outside the mandatory allergen labeling of the Food Labeling Act. An industry guide on providing allergen information when eating out asks restaurants that do publish it to check ingredients against suppliers' specifications and keep the information current, to tell customers that unintended cross-contact can happen because dishes share a kitchen, and to say in advance when they cannot provide reliable information. It also notes that information on a website is convenient because diners can check it before visiting, but becomes a cause of accidental exposure if it is not kept up to date. [Guide to providing allergen information in eating-out and ready-meal businesses (Japanese; industry council, revised March 9, 2023)](${SRC.allergenGuide})`,
            "AI summarizes the text on your site. If all you write is a short label such as \"allergy friendly\" or \"gluten-free, worry-free\", the conditions and exceptions can be lost in the summary. If you publish this information, put the scope (\"we offer three dishes made without egg or dairy\"), the cross-contact risk (\"egg and dairy are handled in the same kitchen\") and how to confirm (\"please call us when booking\") in the same paragraph. If you cannot accommodate allergies, saying so is useful information too.",
            "In structured data, do not state what you cannot verify. schema.org has a property for dietary suitability, but it cannot express cross-contact risk, so anything that touches on allergies is safer explained in your page text, with its conditions.",
          ],
        },
        {
          heading: "Reviews and restaurant guides: what not to do for AI",
          paragraphs: [
            `Marking up reviews or star ratings that you post on your own site will not get you review stars in Google. In 2019 Google said that self-serving reviews, meaning reviews about a business placed on that business's own website, aren't allowed for LocalBusiness and Organization. [Google Search Central blog, September 16, 2019](${SRC.reviews2019})`,
            `Rules on undisclosed advertising differ by country. In Japan, stealth marketing has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023, and posts or reviews a business asks or instructs third parties to make count as that business's advertising. [Consumer Affairs Agency: stealth marketing (Japanese)](${SRC.caaStealth}). Do not grow undisclosed sponsored reviews, or claims you cannot back up such as \"No. 1 in town\", in the hope that AI will speak well of you.`,
            "Restaurant guides and booking sites are sometimes used as sources by AI. Where you can edit your listing, update it to the same hours, prices and days closed as your website; where you cannot, ask the site to correct it.",
          ],
        },
        {
          heading: "Setting it up on a WordPress restaurant site",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK or VK All in One Expansion Unit if you use one.`,
            "In the setup wizard, choose \"Restaurant or café\". The business type becomes Restaurant; for a café, bar or bakery, change \"Business type (schema.org type)\" in Settings to CafeOrCoffeeShop, BarOrPub or Bakery. Confirm the name, address, phone, opening hours and description, and use the description to say what you serve and what sets you apart (for example \"Charcoal-grilled yakitori and sake. Private room for up to 12.\"). Only blank fields are filled in from your existing settings; nothing you typed is overwritten.",
            "Add anything people book in advance, such as set menus, party plans or private hire, as services under Settings. With a name, duration (minutes), price (digits only), currency, category, booking URL and description, each is published as a Service linked to your restaurant (the price as an Offer, the booking URL as a reservation action) and listed as a line in llms.txt.",
            "Enter the questions you really get, about parking, children, smoking, bringing your own and cancellations, as FAQ, and place the Nurevo FAQ block or the [nurevo_faq] shortcode on the page where you want it shown.",
            "Run the diagnosis on the AEO Score screen and apply the one-click fixes the checklist offers. Structured data, llms.txt and AI crawler access (OAI-SearchBot, PerplexityBot, Claude-SearchBot and others) are all on the free plan.",
            "See what AI reads from the outside with the [free AI readability check](/check), and confirm that hours and prices match your Google Business Profile and guide listings.",
          ],
          after: [
            "The current version of Nurevo AEO (0.9.1) does not publish servesCuisine, menu (hasMenu) or acceptsReservations. If your cuisine is in your description and page text and your menu is on a text menu page, AI can read them from the page. If you also want them in structured data, add them through your theme or another method (Google lists them as recommended, not required). With an SEO plugin active, Nurevo AEO does not print a second set of structured data; it adds only the missing address, phone, hours, a specific type such as Restaurant, and your services. [Adding local business schema to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/)",
          ],
        },
        {
          heading: "When an AI answer gets your restaurant wrong",
          list: [
            "Open the source links in the AI's answer and find which page the wrong information came from.",
            "If the source is your website, fix the page text and structured data. If it is your Business Profile, fix it in Google's dashboard.",
            "If the source is a restaurant guide or a list article, edit your listing or ask the publisher to correct it. Check for leftover pages about a closed branch or your address before a move.",
            "When you close temporarily, change hours or change prices, update your website, Business Profile, guide listings and llms.txt on the same day.",
            "Corrections are not always reflected in AI answers right away. Ask the same question again after a few days to a few weeks.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Your menu is written as text with dish names and prices; seasonal items show their period.",
            "Hours for each day, last orders and days closed match across your website, Business Profile and guide listings.",
            "The structured data type fits the business (Restaurant, CafeOrCoffeeShop, BarOrPub and so on) and includes address, phone and opening hours.",
            "Your page text says what cuisine you serve, your seating and private rooms, and conditions such as children and smoking.",
            "Set menus and party plans show their contents, price, duration and how to book.",
            "Allergen information, if published, states the scope, the cross-contact risk and how to confirm; if not published, the page says so.",
            "Reviews on your own site are not marked up as ratings, and no undisclosed sponsored reviews are used.",
            "llms.txt lists your overview, menu, directions and booking pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Pick around ten questions your diners would ask, combining area, cuisine and occasion (lunch, business dinner, with kids, late night). Ask ChatGPT, Perplexity and Google's AI features, and record whether your restaurant comes up by name or URL and whether the hours and prices it gives are right. Answers change between runs, so repeat the same questions over time. The method is set out in [how to measure AI visibility](/guide/measure-ai-visibility/).",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your restaurant's name) are put to Perplexity, and the plugin records whether the answers named your restaurant or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your restaurant appears in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a restaurant start with AI search?", a: "Write your menu (dish names and prices), opening hours, last orders, days closed, address and how to book as text on your own site. Then bring your Google Business Profile and guide listings into line with it, and publish the same facts in Restaurant structured data and llms.txt." },
        { q: "If I am on restaurant guide sites, do I still need my own website?", a: "Guide listings can be used as sources by AI, but your own site is where you can publish your restaurant's information in the most detail and most accurately, and it is the reference you use when correcting other listings. Keeping them in agreement is the safest approach." },
        { q: "Is a photo of my menu enough?", a: "With only photos or a PDF, there is no guarantee that dish names and prices are read correctly. A menu page with dish names, prices and descriptions written as text, with photos alongside, is the better choice." },
        { q: "Should I tell AI about allergen options?", a: "Only if you can keep the information accurate and current. Where you publish it, give the scope, the cross-contact risk and how to confirm together. If you cannot be sure, saying that you do not provide allergen information is also important." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (Restaurant and others), address, hours, services such as set menus, FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends my restaurant?", a: "No. AI answers change with the wording of a question and where the person asking is, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear and whether the answers are right." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your restaurant's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal or tax advice, nor medical advice about food allergies.",
    },
  },
};
