// Content page: Bing Places for Business — registering, importing from Google
// Business Profile, verifying, choosing which listing is the "source of
// truth", fixing duplicates, and keeping the facts identical to the website's
// structured data, for Bing, Bing Maps and Microsoft's AI experiences
// (Copilot). Store-focused (all local businesses). Separate from
// bing-webmaster-ai-performance (which is about measuring citations).
//
// Written 2026-11-24 8時 (JST).
//
// Outside facts and where they were read (2026-11-24):
// - Bing Search Blog, 2025-10-03, "Introducing the New Bing Places for
//   Business": free platform for listings in Bing search results and Bing
//   Maps; moved from bingplaces.com to bing.com/forbusiness; existing listings
//   migrated automatically; improved Google import (name, hours, contact
//   details); Recommendation Tool (photos, website, hours, social links; menu
//   or online-order links for restaurants); bulk editing; real-time status.
//   "What's next": continuing to invest in deeper integrations with Bing Maps
//   and Copilot (future tense — not a statement that Copilot uses listings
//   today).
// - Search Engine Journal, 2025-10-03 (secondary): same; live at
//   bing.com/forbusiness; no country list.
// - Bing Webmaster Blog, 2026-02-10 (AI Performance launch): recommends
//   IndexNow and Bing Places (already used in bing-webmaster-ai-performance).
// - Microsoft Q&A 2289915 (Bing Places Support Specialist, 2023-08, before the
//   redesign): import is manual and links the GBP account; sync manual or
//   automatic (weekly/biweekly/monthly); matched listings: GBP data overwrites
//   Bing; Bing edits overwritten by conflicting GBP changes regardless of
//   which is newer; cannot update GBP from Bing; verified GBP needs no Bing
//   re-verification; publish cycle "normally around ten days", each edit
//   restarts it; categories not imported; address required; for chains only
//   verified GBP listings import.
// - Microsoft Q&A 5632446 (France, 2025-11-23, Microsoft external staff):
//   "Import from Google" under "Add a business", "could take up to two days";
//   only Bing Places Support can override verification;
//   bing.com/forbusiness/contactSupport.
// - Microsoft Q&A 5927863 (Greece, 2026-06-24, Microsoft external staff):
//   duplicate "likely created automatically from a different data source";
//   contact support (region, language, "Chat now"), keep the Google-synced
//   listing; fallback "Suggest an edit" on Bing Maps "sometimes works".
// - Whitespark guide (2025-09-11, modified 2025-10-30, secondary): up to 100
//   photos; min 480x360 px, up to 10 MB; up to 10 categories; PIN by phone,
//   email or mail; address can be hidden.
// Not stated, because no page we read says it: whether Japan addresses are
// supported and which verification is offered there (bing.com/forbusiness and
// Bing's help were blocked from our fetch), current publish times after the
// redesign, sign-in account types, any Microsoft statement that Copilot reads
// Bing Places today. Third-party claims to that effect are reported as claims.
//
// Nurevo facts: readme.txt 0.9.x (address as PostalAddress; Japanese phone in
// international form in structured data, entered number unchanged; common
// hour formats to openingHoursSpecification, unreadable hours published as
// typed; fills missing facts into the SEO plugin's graph under the same @id;
// 0.9.1 coexists with SEO SIMPLE PACK and VK All in One Expansion Unit; free
// AI check monthly with three Perplexity questions; Pro on Perplexity, ChatGPT
// once configured).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  blog: "https://blogs.bing.com/search/October-2025/Introducing-the-New-Bing-Places-for-Business-Built-for-Business-Owners,-Powered-by-Research",
  sej: "https://www.searchenginejournal.com/microsoft-launches-new-bing-places-for-business/557520/",
  aiperf: "https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview",
  sync: "https://learn.microsoft.com/en-us/answers/questions/2289915/cannot-sync-my-webpages-with-google-as-bing-inform",
  france: "https://learn.microsoft.com/en-us/answers/questions/5632446/bing-places-manual-verification-needed-for-busines",
  dup: "https://learn.microsoft.com/en-us/answers/questions/5927863/duplicate-bing-places-listing-cannot-be-verified-o",
  whitespark: "https://whitespark.ca/guides/the-ultimate-guide-to-your-bing-places-listing/",
  places: "https://www.bing.com/forbusiness",
  support: "https://www.bing.com/forbusiness/contactSupport",
};

export default {
  slug: "bing-places-ai-search",
  targetQueries: [
    "Bing Places for Business setup Copilot",
    "Bing Places import from Google Business Profile",
    "Bing Places duplicate listing verification",
    "Bing Places 登録 方法",
    "Copilot 店舗情報 表示",
    "Bing Places Googleビジネスプロフィール 同期",
  ],
  related: ["bing-webmaster-ai-performance", "business-hours-holidays-ai-search", "multi-location-business-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "Bing Placesの登録とCopilotでの店舗情報のそろえ方 | Nurevo",
      description: "Bing・Bingマップの店舗情報を管理するBing Places。Googleからの取り込みと同期の注意、重複の直し方、サイトの構造化データとそろえる手順を、Microsoftの説明をもとにまとめました。",
      h1: "Bing Places for Businessの登録と、Copilot・Bingでの店舗情報のそろえ方：Googleからの取り込み、同期の向き、重複の直し方",
      lead: "Bing Places for Businessは、BingとBingマップに出る店舗情報を無料で管理するMicrosoftのサービスです。Googleビジネスプロフィール（GBP）を使っているなら、取り込むのがいちばん早く、同期を有効にすると「GBPがBingを上書きする」ため、直すのはGBPとサイトの2か所です。MicrosoftはCopilotとの連携を深めると言っていますが、今のCopilotの回答がBing Placesをどう使っているかは公表していません。だからこそ、Bing Places・GBP・サイトの店名・住所・電話番号・営業時間を同じにしておくことが、いちばん確かな準備です。",
      intro: [
        "作成日：2026年11月24日（日本時間）。Bing Placesの仕様は、同日にMicrosoftの公式ブログと、Microsoftのフォーラム（Microsoft Q&A）での担当者の回答で確認しました。Bing Placesの画面とヘルプはこの日の取得で読めなかったため、画面の名前や手順は変わっている可能性があります。登録するときは画面の表示に従ってください。",
        "どんな登録をしても、CopilotやほかのAIの回答に必ず店が出る・順位が上がるということはありません。AIの回答は日々変わります。この記事は、AIに店の事実を正しく伝えるための準備をまとめたものです。",
      ],
      sections: [
        {
          heading: "Bing Placesとは：2025年10月の作り直しで何が変わったか",
          paragraphs: [
            `Microsoftは2025年10月3日に、Bing Places for Businessを作り直したと発表しました（[Bing Search Blog](${SRC.blog})）。Bingの検索結果とBingマップに出る店舗情報を、無料で作成・管理するサービスです。`,
          ],
          table: {
            head: ["変わったこと", "内容"],
            rows: [
              ["場所（URL）", `bingplaces.com から [bing.com/forbusiness](${SRC.places}) へ。既存の掲載は新しいアカウントへ自動で移り、以前のログイン情報で入ると転送される`],
              ["Googleからの取り込み", "速く確実になり、店名・営業時間・連絡先などを保ったまま取り込める"],
              ["おすすめ機能（Recommendation Tool）", "写真・ウェブサイトのリンク・営業時間・SNSのリンクの追加を提案する。飲食店にはメニューやネット注文のリンクも"],
              ["複数店舗", "まとめて編集する機能と、掲載の状態をすぐ確かめられる表示"],
              ["今後", "BingマップとCopilotとの連携を深めることに投資を続ける（予定として書かれている）"],
            ],
            caption: `Bing Search Blog（2025-10-03）と Search Engine Journal（同日）をもとに作成。`,
          },
          after: [
            `Bingは2026年2月にAIでの引用を見るAI Performanceを公開したときも、店舗ならBing Placesを整えるよう勧めています（[Bing Webmaster Blog](${SRC.aiperf})）。見方は[Bing Webmaster ToolsのAI Performanceの見方](/guide/bing-webmaster-ai-performance)にまとめています。`,
          ],
        },
        {
          heading: "CopilotはBing Placesを使っているのか：わかっていること・いないこと",
          paragraphs: [
            "「CopilotはBing Placesの情報で店を答える」と書く記事は多いのですが、今回読んだMicrosoftの資料には、その仕組みを説明したものはありませんでした。わかっていることと、わかっていないことを分けておきます。",
          ],
          table: {
            head: ["項目", "状態", "根拠"],
            rows: [
              ["Bing Placesの情報がBingの検索結果とBingマップに出る", "Microsoftが説明している", `[Bing Search Blog](${SRC.blog})`],
              ["Copilotとの連携を深める", "予定として発表されている", `[Bing Search Blog](${SRC.blog})`],
              ["店舗はBing Placesを整えるよう勧める", "AI Performanceの発表の中でMicrosoftが勧めている", `[Bing Webmaster Blog](${SRC.aiperf})`],
              ["今のCopilotの回答がBing Placesのどの項目を使うか", "公表されていない", "—"],
              ["Bing PlacesがWindowsの検索やEdgeにも出る", "一部の制作会社の記事の主張。Microsoftの資料では確認できなかった", "—"],
            ],
          },
          after: [
            "使われ方がわからない以上、特定の項目に賭けるより、店の基本の事実をどこで見ても同じにしておくのが現実的です。Copilotは回答の出典にウェブのページも使うため、サイトの側の情報も同じくらい大切です。",
          ],
        },
        {
          heading: "登録の手順：既存の掲載を探す → 取り込む → 確認する",
          list: [
            `[bing.com/forbusiness](${SRC.places})にMicrosoftアカウントでログインします。`,
            "先に、自分の店がすでに載っていないか探します。Bingは公開されている情報から掲載を自動で作ることがあり、新しく作ると重複の原因になります。",
            `GBPを使っているなら「Googleから取り込む（Import from Google）」を選び、GBPのアカウントでログインして店を選びます。Microsoftのフォーラムの担当者は、取り込みは「最大2日かかることがある」と答えています（[Microsoft Q&A、2025-11](${SRC.france})）。`,
            `取り込んだら、業種（カテゴリ）を必ず確かめます。2023年のサポート担当者の回答では、カテゴリは取り込まれず手で設定するとされていました（[Microsoft Q&A](${SRC.sync})）。2025年の作り直しで変わった可能性があるため、画面で確認します。`,
            "GBPを使っていないなら、店名・住所・電話番号・業種・営業時間・ウェブサイトを手で入れ、表示される方法で所有者の確認をします。確認の方法（電話・メール・郵送のはがきなど）は、国や店の情報によって出るものが違います。",
            "おすすめ機能が出す提案（写真・営業時間・SNSのリンクなど）を埋め、サイトと同じ表記になっているかを最後に見直します。",
          ],
          after: [
            `日本の住所での登録の可否や、日本で選べる確認の方法は、今回読めた資料では確かめられませんでした。フランスでは「確認がはがきだけで、届かない」という相談があり、Microsoftの担当者は、Googleからの取り込みを試し、だめならサポートに連絡するよう答えています。手で公開できるのはサポートだけだそうです（[Microsoft Q&A](${SRC.france})、[問い合わせ先](${SRC.support})）。`,
            `写真は最大100枚、カテゴリは最大10個などの上限は、Whitespark のガイド（2025-10-30更新）がBingのヘルプをもとに書いています（[Whitespark](${SRC.whitespark})、二次情報）。`,
          ],
        },
        {
          heading: "GBPと同期するときの注意：上書きの向きを決めておく",
          paragraphs: [
            `2023年のBing Placesのサポート担当者の回答には、同期の向きがはっきり書かれています（[Microsoft Q&A](${SRC.sync})）。作り直しの前の説明なので細部は変わっている可能性がありますが、考え方は今も役に立ちます。`,
          ],
          table: {
            head: ["項目", "2023年の担当者の説明", "やること"],
            rows: [
              ["同期の方法", "手動か、自動（毎週・隔週・毎月）", "営業時間を季節や祝日で変える店は自動にする"],
              ["上書きの向き", "GBPのデータがBingの掲載を上書きする。Bingで直しても、GBPと食い違えば、どちらが新しくてもGBPの値になる", "同期中はBingで直さず、GBPを直す"],
              ["Bing→Google", "Bingの画面からGBPは直せない", "正本はGBPとサイトの2つにする"],
              ["公開までの時間", "通常の公開の周期はおよそ10日。確認や編集のたびに周期がやり直しになる", "急ぎの変更は一度にまとめ、何度も直さない"],
              ["住所", "Bingは住所が必須。GBPに住所がない（訪問型など）と警告が出る", "訪問型の店は、住所の扱いを画面で確かめる"],
            ],
          },
          after: [
            "つまり、同期をしている店にとって、Bing Placesは「GBPの写し」です。間違いを見つけたら、まずGBPとサイトを直し、Bingには同期で届くのを待ちます。同期をしていない店は、GBP・Bing・サイトの3か所をそれぞれ直す必要があり、ずれが起きやすくなります。",
          ],
        },
        {
          heading: "重複した掲載・知らない掲載を見つけたとき",
          list: [
            "Bingマップで店名・電話番号・住所で検索し、自分の店の掲載がいくつあるかを数えます。移転前の住所や、昔の店名の掲載も探します。",
            `重複は、別のデータの出どころから自動で作られた可能性があるとMicrosoftの担当者は答えています（[Microsoft Q&A、2026-06](${SRC.dup})）。`,
            "重複した方の確認（所有者の確認）は進めないでください。2つとも自分のものにすると、どちらが正しいかがかえってわかりにくくなります。",
            `[サポート](${SRC.support})に、残したい掲載（Googleと同期している方など）と消したい掲載の両方の情報、所有者であることがわかる資料、GBPのリンク、画面の写しを送り、統合か削除を頼みます。地域と言語を選ぶとチャットで問い合わせられると担当者は案内しています。`,
            "あわせてBingマップの掲載の「編集を提案」や「フィードバック」で重複を報告します。担当者は「うまくいくこともある」という書き方で、確実ではありません。",
          ],
        },
        {
          heading: "そろえる項目：Bing Places・GBP・サイトの対照表",
          paragraphs: [
            "AIは複数の出どころを読みます。同じ店の情報が場所によって違うと、どれを答えるかが揺れます。次の表の項目を、3か所で同じにします。",
          ],
          table: {
            head: ["項目", "Bing Places・GBP", "サイト（本文と構造化データ）", "よくあるずれ"],
            rows: [
              ["店名", "看板・登記と同じ正式名。宣伝文句を足さない", "会社概要・フッター・構造化データの name", "「駅前店」の有無、全角と半角、旧店名"],
              ["住所", "建物名・階まで同じ書き方", "本文の住所と PostalAddress", "移転前の住所、丁目の書き方、建物名の省略"],
              ["電話番号", "予約を受ける番号", "本文は 03-… のまま。構造化データは +81-3-… の形でもよい", "代表番号と店の番号の混在、使わなくなった番号"],
              ["営業時間・休み", "通常の時間と、祝日・年末年始の特別な時間", "本文の表と openingHoursSpecification", "サイトだけ直して、Bing・GBPが古いまま"],
              ["業種（カテゴリ）", "店の中心の業種を1つ目に", "構造化データの型（Dentist、HairSalon など）", "取り込みでカテゴリが入っていない"],
              ["ウェブサイト", "トップページか、その店舗のページのURL", "正規のURL（https、www の有無をそろえる）", "閉じたキャンペーンのページ、古いドメイン"],
            ],
          },
          after: [
            "祝日や年末年始の営業時間の書き方は[営業時間・定休日・臨時休業のAI検索対策](/guide/business-hours-holidays-ai-search)、複数の店舗がある場合は[複数店舗のAI検索対策](/guide/multi-location-business-ai-search)にまとめています。",
          ],
        },
        {
          heading: "WordPressでの手順：サイト側の事実をそろえる",
          list: [
            "会社概要やアクセスのページに、店名・住所・電話番号・営業時間を画像ではなく文字で書きます。Bing PlacesとGBPに入れた表記をそのまま使います。",
            "使っているSEOプラグインやテーマが構造化データに出している店名・住所・電話番号を確かめます。無料版では住所や営業時間が出ていないことがよくあります。調べ方は[SEOプラグインと店舗の構造化データ](/guide/local-business-schema-seo-plugins)にあります。",
            `Nurevo AEO（無料のWordPressプラグイン）を使う場合は、設定に店名・住所・電話番号・営業時間を入れます。住所は schema.org の PostalAddress として、日本の電話番号は構造化データでは +81 の国際表記で出します（入力した番号は変えません）。「10:00-19:00 火曜定休」のようなよくある書き方の営業時間は openingHoursSpecification に変換し、読み取れない書き方はそのまま出して推測はしません。SEOプラグインがすでに出している値は上書きせず、同じ @id に足りない事実だけを足します。0.9.1からはSEO SIMPLE PACK・VK All in One Expansion Unitと一緒に使っても重複しません。[WordPress.orgで入手](${WP_ORG})`,
            "Bingがサイトを読めるようにします。［設定］＞［表示設定］の「検索エンジンでの表示」のチェックが外れているか、/robots.txt で Bingbot を止めていないかを確かめます。",
            "営業時間を変えたら、サイト・GBP（同期していない場合はBing Placesも）を同じ日に直し、日付を記録します。",
          ],
        },
        {
          heading: "登録したあとの確かめ方",
          list: [
            "Bingで店名を検索し、Bingマップの掲載の店名・住所・電話番号・営業時間が、サイトと同じかを見ます。",
            "Copilotに「（地域）の（業種）で（条件）のお店」「（店名）の営業時間は？」と聞き、答えと出典を記録します。回答は日によって変わるため、同じ質問を毎月同じ日に聞きます。",
            "Bing Webmaster ToolsのAI Performanceで、自社のページがMicrosoftのAIで出典になった回数と語句を見ます。",
            "アクセス解析の参照元で copilot.microsoft.com からの訪問を見ます。",
            "ChatGPTやPerplexityはBingとは別の仕組みです。[AIでの登場率の測り方](/guide/measure-ai-visibility)のように、決めた質問のセットで別に記録します。Nurevo AEOの無料のAIチェックは、接続したサイトに月1回、業種と地域から作った3つの質問をPerplexityに聞きます。継続して測るPro（月14,800円〜）も現在はPerplexityで測っています（ChatGPTは設定され次第）。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "bing.com/forbusiness で、自分の店がすでに載っていないか探した",
            "GBPを使っていれば取り込み、使っていなければ手で登録して確認を済ませた",
            "業種（カテゴリ）が入っているか画面で確かめた",
            "同期の有無と、どこを正本にするか（GBPとサイト）を決めて記録した",
            "Bingマップで重複・旧住所・旧店名の掲載を探した",
            "重複があれば、確認を進めずにサポートへ統合・削除を頼んだ",
            "店名・住所・電話番号・営業時間・業種・URLを、Bing・GBP・サイトで同じにした",
            "サイトの構造化データの値も本文と同じにした",
            "Bingbot を robots.txt で止めていないか確かめた",
            "Copilotへの質問と答えを、日付を付けて記録した",
          ],
        },
        {
          heading: "制作会社・MEO会社が代わりに登録するとき",
          paragraphs: [
            "お客様の代わりに登録するときは、ログインに使うMicrosoftアカウントを誰のものにするかを最初に決めます。担当者が辞めても店が自分で入れるよう、店のアカウントで作り、制作会社は管理者として加えてもらう形が安全です。",
            "毎月の保守では、GBP・Bing Places・サイトの対照表を1枚作り、ずれがないかを見る作業を足すと、AI検索への備えを報告に入れられます。月額のサービスにする方法は[制作会社がAI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)、パートナー制度は[パートナーのページ](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "Bing Placesは無料ですか？", a: "はい。MicrosoftはBing Places for Businessを、BingとBingマップの掲載を作成・管理する無料のサービスとして説明しています。" },
        { q: "Googleビジネスプロフィールがあれば、Bing Placesの登録は要りませんか？", a: "自動では載りません。Bing Placesで「Googleから取り込む」を使うと、GBPの情報を元に掲載を作れます。同期を有効にすれば、その後のGBPの変更もBingに届きます。" },
        { q: "Bing Placesで直したのに、元に戻ってしまいます。", a: "GBPと同期していると、食い違う項目はGBPの値で上書きされると、2023年にBingのサポート担当者が説明しています。同期中は、GBPの側を直してください。" },
        { q: "変更が反映されるまでどれくらいかかりますか？", a: "2023年の担当者の回答では、公開の周期は通常およそ10日で、編集のたびにやり直しになるとされていました。2025年には、Googleからの取り込みは最大2日かかることがあると答えています。今の時間は画面の表示で確かめてください。" },
        { q: "CopilotはBing Placesの情報を使って答えますか？", a: "MicrosoftはCopilotとの連携を深めると発表していますが、今の回答でBing Placesがどう使われているかは公表していません。Bing Places・GBP・サイトの事実をそろえておくのが確かな準備です。" },
        { q: "日本の店でも登録できますか？", a: "今回読めたMicrosoftの資料には、対応する国の一覧も、日本での確認の方法も書かれていませんでした。登録の画面で国と住所を選べるか、どの確認の方法が出るかを確かめてください。" },
        { q: "重複した掲載は自分で消せますか？", a: "Microsoftのフォーラムの担当者は、サポートへの問い合わせを案内しています。残したい掲載と消したい掲載の情報、所有者であることを示す資料を送り、統合か削除を頼みます。重複した方の確認は進めないでください。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの店のサイトを読めるか確認",
        body: "登録不要の無料チェックで、構造化データの住所・電話番号・営業時間や、llms.txt、AI検索のクローラーの許可の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "Microsoft、Bing、Bing Places、Bingマップ、Copilot、Bing Webmaster Tools、Edge、Windows、Google、Googleビジネスプロフィール、ChatGPT、OpenAI、Perplexity、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "Bing Places Setup and Keeping Store Facts Straight for Copilot | Nurevo",
      description: "Bing Places manages your listing on Bing and Bing Maps. How Google import and sync work, how to fix duplicates, and how to match your site's structured data.",
      h1: "Bing Places for Business setup for Copilot and Bing: importing from Google, which way sync overwrites, and fixing duplicates",
      lead: "Bing Places for Business is Microsoft's free service for managing the business listing shown in Bing and Bing Maps. If you already have a Google Business Profile (GBP), importing it is the fastest route, and once sync is on, GBP overwrites Bing, so the two places you edit are GBP and your website. Microsoft says it is deepening integration with Copilot, but it has not published how today's Copilot answers use Bing Places. That is why the most reliable preparation is keeping your name, address, phone number and hours identical in Bing Places, GBP and your site.",
      intro: [
        "Written November 24, 2026 (JST). Bing Places behaviour was checked that day on Microsoft's official blogs and in answers from Microsoft staff on Microsoft Q&A. Bing Places' own screens and help pages could not be read in our fetch that day, so screen names and steps may have changed. Follow what the screen shows when you sign up.",
        "No listing can guarantee that Copilot or any other AI will show your business or rank it higher. AI answers change from day to day. This guide is about preparing your facts so AI can describe your business correctly.",
      ],
      sections: [
        {
          heading: "What Bing Places is, and what the October 2025 rebuild changed",
          paragraphs: [
            `On October 3, 2025, Microsoft announced a rebuilt Bing Places for Business ([Bing Search Blog](${SRC.blog})). It is a free service to create and manage the business listings that appear in Bing search results and Bing Maps.`,
          ],
          table: {
            head: ["What changed", "Details"],
            rows: [
              ["Address (URL)", `From bingplaces.com to [bing.com/forbusiness](${SRC.places}). Existing listings moved to the new account automatically; signing in with old credentials redirects you`],
              ["Google import", "Faster and more reliable, and keeps name, hours and contact details"],
              ["Recommendation Tool", "Suggests adding photos, a website link, hours and social links; menu or online-order links for restaurants"],
              ["Multiple locations", "Bulk editing and real-time listing status"],
              ["What's next", "Continued investment in deeper integration with Bing Maps and Copilot (stated as a plan)"],
            ],
            caption: `Based on the Bing Search Blog (2025-10-03) and Search Engine Journal (same day).`,
          },
          after: [
            `When Bing launched AI Performance for AI citations in February 2026, it also recommended that local businesses keep Bing Places up to date ([Bing Webmaster Blog](${SRC.aiperf})). See [how to read Bing Webmaster Tools' AI Performance report](/guide/bing-webmaster-ai-performance).`,
          ],
        },
        {
          heading: "Does Copilot use Bing Places? What is known and what is not",
          paragraphs: [
            "Many articles say Copilot answers local questions from Bing Places data. None of the Microsoft material we read explains such a mechanism. Here is what is known, kept apart from what is not.",
          ],
          table: {
            head: ["Item", "Status", "Source"],
            rows: [
              ["Bing Places data appears in Bing search results and Bing Maps", "Described by Microsoft", `[Bing Search Blog](${SRC.blog})`],
              ["Deeper integration with Copilot", "Announced as a plan", `[Bing Search Blog](${SRC.blog})`],
              ["Local businesses should keep Bing Places accurate", "Recommended by Microsoft in the AI Performance launch post", `[Bing Webmaster Blog](${SRC.aiperf})`],
              ["Which Bing Places fields today's Copilot answers use", "Not published", "—"],
              ["Bing Places also appears in Windows search or Edge", "Claimed by some agency articles; not found in Microsoft's material", "—"],
            ],
          },
          after: [
            "Since the mechanism is not published, betting on any one field makes less sense than keeping your basic facts the same wherever they appear. Copilot also uses web pages as sources for its answers, so your website matters just as much.",
          ],
        },
        {
          heading: "Setup: find an existing listing, import, verify",
          list: [
            `Sign in at [bing.com/forbusiness](${SRC.places}) with a Microsoft account.`,
            "First search for your business. Bing can create listings automatically from public data, and creating a new one on top of that causes duplicates.",
            `If you use GBP, choose "Import from Google", sign in with the GBP account and pick the location. A Microsoft staff answer on the forum says the import "could take up to two days" ([Microsoft Q&A, Nov 2025](${SRC.france})).`,
            `After importing, check the category. A 2023 support answer said categories are not imported and must be set by hand ([Microsoft Q&A](${SRC.sync})). This may have changed with the 2025 rebuild, so check on screen.`,
            "Without GBP, enter name, address, phone, category, hours and website by hand and verify ownership with the method offered. Which methods appear (phone, email, a mailed postcard and so on) depends on the country and the business details.",
            "Work through the Recommendation Tool's suggestions (photos, hours, social links) and finish by checking that everything matches your site.",
          ],
          after: [
            `The material we could read did not say whether every country's addresses are supported or which verification methods are offered where. In France, one owner reported that the only option was a postcard that never arrived; Microsoft staff suggested trying the Google import and, failing that, contacting support, which is the only team that can publish a listing manually ([Microsoft Q&A](${SRC.france}), [contact support](${SRC.support})).`,
            `Limits such as up to 100 photos and up to 10 categories are given in Whitespark's guide (updated 2025-10-30), based on Bing's help pages ([Whitespark](${SRC.whitespark}), secondary source).`,
          ],
        },
        {
          heading: "Syncing with GBP: decide which way overwrites",
          paragraphs: [
            `A 2023 answer from a Bing Places support specialist spells out the direction of sync ([Microsoft Q&A](${SRC.sync})). It predates the rebuild, so details may have changed, but the principle is still useful.`,
          ],
          table: {
            head: ["Item", "2023 support explanation", "What to do"],
            rows: [
              ["Sync method", "Manual, or automatic (weekly, biweekly or monthly)", "Use automatic if your hours change with seasons or holidays"],
              ["Overwrite direction", "GBP data overwrites the Bing listing. A Bing edit that conflicts with GBP becomes the GBP value, whichever is newer", "While syncing, edit GBP, not Bing"],
              ["Bing to Google", "You cannot update GBP from the Bing dashboard", "Treat GBP and your site as the two sources of truth"],
              ["Time to publish", "The standard publish cycle normally lasts around ten days, and each verification or edit restarts it", "Batch urgent changes instead of editing repeatedly"],
              ["Address", "Bing requires an address; GBP listings without one (service-area businesses) are flagged", "Service-area businesses should check how the address is handled"],
            ],
          },
          after: [
            "For a business that syncs, Bing Places is a copy of GBP. When you find an error, fix GBP and your site first, then let sync carry it to Bing. Without sync, you must fix GBP, Bing and the site separately, and drift is much more likely.",
          ],
        },
        {
          heading: "When you find a duplicate or a listing you did not create",
          list: [
            "Search Bing Maps by name, phone and address and count how many listings exist for your business. Look for pre-move addresses and old names too.",
            `Microsoft staff say a duplicate was "likely created automatically from a different data source" ([Microsoft Q&A, Jun 2026](${SRC.dup})).`,
            "Do not verify the duplicate. Owning both makes it harder to tell which one is correct.",
            `Send [support](${SRC.support}) the details of both listings (the one to keep, such as the Google-synced one, and the one to remove), proof of ownership, your GBP link and screenshots, and ask for a merge or removal. Staff say you can chat with support after choosing region and language.`,
            "Also report the duplicate through \"Suggest an edit\" or \"Feedback\" on the Bing Maps listing. Staff describe this as something that \"sometimes works\", so it is not a guarantee.",
          ],
        },
        {
          heading: "What to match: Bing Places, GBP and your site side by side",
          paragraphs: [
            "AI reads several sources. When the same business is described differently in different places, which version it gives can waver. Make the items below identical in all three places.",
          ],
          table: {
            head: ["Item", "Bing Places and GBP", "Website (text and structured data)", "Common mismatch"],
            rows: [
              ["Name", "The official name on your sign and registration, no marketing words added", "About page, footer, structured data name", "Branch suffix present in one place only, old names"],
              ["Address", "Same building name and floor, written the same way", "The address in the text and the PostalAddress", "Pre-move address, abbreviated building name"],
              ["Phone", "The number that takes bookings", "Local format in the text; international format (+81-3-…, +1-…) is fine in structured data", "Head-office and branch numbers mixed, retired numbers"],
              ["Hours and closures", "Regular hours plus holiday and special hours", "The hours table and openingHoursSpecification", "Site updated, Bing and GBP left stale"],
              ["Category", "Your main business type first", "Structured data type (Dentist, HairSalon and so on)", "Category missing after import"],
              ["Website", "Home page or that location's page", "The canonical URL (https, with or without www, consistently)", "Expired campaign pages, old domains"],
            ],
          },
          after: [
            "For holiday and special hours, see [business hours, holidays and closures for AI search](/guide/business-hours-holidays-ai-search). With several locations, see [AI search for multi-location businesses](/guide/multi-location-business-ai-search).",
          ],
        },
        {
          heading: "WordPress steps: match the facts on your site",
          list: [
            "Write your name, address, phone and hours as text, not an image, on your About or Access page, using exactly the wording you entered in Bing Places and GBP.",
            "Check the name, address and phone your SEO plugin or theme puts into structured data. Free tiers often leave out the address and hours. See [SEO plugins and local business structured data](/guide/local-business-schema-seo-plugins).",
            `With Nurevo AEO (a free WordPress plugin), enter name, address, phone and hours in Settings. The address is published as a schema.org PostalAddress; on a Japanese site a Japanese phone number is published in international form in structured data (the number you entered is not changed). Common hour formats such as "Mon-Fri 9:00-18:00 / Sat 10:00-15:00" become openingHoursSpecification; hours it cannot read with certainty are published as typed, never guessed. Values your SEO plugin already sets are never overwritten; only missing facts are added under the same @id. From 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicates. [Get it on WordPress.org](${WP_ORG})`,
            "Make sure Bing can read your site: in Settings > Reading, \"Search engine visibility\" should be unchecked, and /robots.txt should not block Bingbot.",
            "When hours change, update the site and GBP (and Bing Places too if you do not sync) on the same day and note the date.",
          ],
        },
        {
          heading: "How to check after setup",
          list: [
            "Search your business name on Bing and confirm the Bing Maps listing shows the same name, address, phone and hours as your site.",
            "Ask Copilot questions like \"a [business type] in [area] that [condition]\" and \"What are [business name]'s opening hours?\", and record the answer and its sources. Answers change from day to day, so ask the same questions on the same day each month.",
            "In Bing Webmaster Tools' AI Performance, see how often your pages were sources in Microsoft's AI and for which phrases.",
            "In your analytics, look at visits referred by copilot.microsoft.com.",
            "ChatGPT and Perplexity work separately from Bing. Record them with a fixed set of questions, as in [how to measure AI visibility](/guide/measure-ai-visibility). Nurevo AEO's free AI check asks Perplexity three questions built from your business type and area once a month for connected sites. The Pro plan (from $99/month) measures continuously, currently on Perplexity (ChatGPT once configured).",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "Searched bing.com/forbusiness for an existing listing",
            "Imported from GBP, or registered by hand and completed verification",
            "Confirmed the category is set",
            "Decided and noted whether you sync, and that GBP and the site are the sources of truth",
            "Searched Bing Maps for duplicates, old addresses and old names",
            "For any duplicate, asked support to merge or remove it instead of verifying it",
            "Name, address, phone, hours, category and URL match across Bing, GBP and the site",
            "Structured data values match the text on the site",
            "Confirmed robots.txt does not block Bingbot",
            "Recorded Copilot questions and answers with dates",
          ],
        },
        {
          heading: "For agencies and local SEO companies registering on a client's behalf",
          paragraphs: [
            "Decide first whose Microsoft account owns the listing. Creating it under the business's own account and adding the agency as a manager is safer: the business keeps access even if staff change.",
            "Adding a one-page comparison of GBP, Bing Places and the site to monthly maintenance lets you include AI search readiness in your reports. See [how agencies turn AI search work into a monthly service](/guide/agency-aeo-monthly-service) and the [partner page](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "Is Bing Places free?", a: "Yes. Microsoft describes Bing Places for Business as a free service to create and manage listings in Bing and Bing Maps." },
        { q: "If I have a Google Business Profile, do I still need Bing Places?", a: "Your GBP does not appear in Bing Places automatically. Use \"Import from Google\" in Bing Places to create a listing from it. With sync on, later GBP changes also reach Bing." },
        { q: "I fixed something in Bing Places and it changed back.", a: "With GBP sync on, conflicting fields are overwritten with GBP's values, as a Bing support specialist explained in 2023. While syncing, fix the GBP side." },
        { q: "How long do changes take to show?", a: "A 2023 support answer said the publish cycle normally lasts around ten days and restarts with each edit. In 2025, staff said a Google import could take up to two days. Check the screen for current timing." },
        { q: "Does Copilot answer from Bing Places data?", a: "Microsoft has announced deeper integration with Copilot but has not published how today's answers use Bing Places. Keeping your facts identical in Bing Places, GBP and your site is the reliable preparation." },
        { q: "Can businesses in every country register?", a: "The Microsoft material we could read lists neither supported countries nor verification methods by country. Check on the sign-up screen whether your country and address can be selected and which verification methods appear." },
        { q: "Can I delete a duplicate listing myself?", a: "Microsoft forum staff point to Bing Places support. Send details of the listing to keep and the one to remove, plus proof of ownership, and ask for a merge or removal. Do not verify the duplicate." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your business site",
        body: "A free check with no sign-up shows the state of your structured data (address, phone, hours), llms.txt and access for AI search crawlers. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Microsoft, Bing, Bing Places, Bing Maps, Copilot, Bing Webmaster Tools, Edge, Windows, Google, Google Business Profile, ChatGPT, OpenAI, Perplexity, SEO SIMPLE PACK, VK All in One Expansion Unit, WordPress and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
