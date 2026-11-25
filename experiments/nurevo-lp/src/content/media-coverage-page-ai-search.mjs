// Content page: building a press coverage ("メディア掲載") page so AI search
// and people can find independent coverage of the business. All industries,
// plus a section for agencies. Separate from company-profile-page-ai-search
// (the about page), wikipedia-wikidata-ai-search (Wikipedia notability and
// sameAs) and agency-ai-search-manipulation-risks (refusing manipulation).
//
// Written 2026-11-25 8時 (JST).
//
// Outside facts and where they were read (2026-11-25):
// - Muck Rack, "What Is AI Reading?" (May 2026 PDF) and its press release
//   (GlobeNewswire, 2026-05-07, republished by AI Magazine): 25,000,000+
//   links, ChatGPT / Claude / Gemini, 17 industries; about 84% of citations
//   from earned media, about 27% journalism, paid and advertorial 0.3%,
//   about 99% non-paid; earned has ranged 82–89% and journalism 25–27% since
//   July 2025; 57% of dated journalism citations from the past 12 months.
//   Perplexity not included. Full methodology is on generativepulse.ai (not
//   read).
// - Muck Rack, "What is AI Reading?" (December 2025 PDF): 1,000,000+ links,
//   July–December 2025, Gemini / Perplexity / Claude / ChatGPT; journalism
//   just under 25%, earned 82%; press releases rose from 1.2% to about 6%.
// - LeadCoverage press release (GlobeNewswire 2026-03-30) headlines "earned
//   media 25%", which mixes up Muck Rack's journalism and earned figures —
//   mentioned as a caution, not used as data.
// - BuzzStream, 2026-03-09 (updated 2026-04-08): about 4 million citations,
//   3,600 prompts, 10 industries, one week from 2026-01-27, ChatGPT / Google
//   AI Mode / AI Overviews / Gemini; news publications 14.09% of citations;
//   7.26% for brand-awareness prompts vs about 18% for evaluative prompts;
//   syndicated pieces 6.2% of news citations; newswires 0.21% of all
//   citations; internal press releases / newsroom content 2.98% overall and
//   18.15% "on ChatGPT" (denominator not stated — written as such). The
//   author says the method is not foolproof.
// - Consumer Affairs Agency (消費者庁) stealth marketing page: from
//   2023-10-01, ads that consumers cannot tell are ads violate the Premiums
//   and Representations Act; covers SNS, reviews, TV, newspapers, radio,
//   magazines; the regulated party is the advertiser (事業者).
// - AdverTimes 2026-07-03 (interview with Asahi Shimbun): copying, scanning,
//   photographing, copy-and-paste and screen printouts are reproduction and
//   need the rights holder's permission in principle; a 2023 ruling ordered
//   about ¥6.96M (Nikkei) and ¥1.33M (Chunichi) for intranet posting.
// - Japan Newspaper Association Q&A on Article 47-5 (2021-12-10): for search
//   services, media name, date, headline, a very short snippet, URL and a
//   thumbnail, with the link to the original as the key point; some sites'
//   link policies ban commercial use. Written for search services, so the
//   article uses it only as a reference for what a listing contains.
// - Google: general structured data guidelines (don't mark up content that
//   is not visible); qualify outbound links (rel="sponsored" for paid
//   links).
// - schema.org (schema-dts 2.1.0): Thing.subjectOf (CreativeWork | Event),
//   Organization.award (Text).
// Not stated: any AI company's statement on how it weights coverage pages,
// how long new coverage takes to reach AI answers, TV/radio citation shares,
// Japanese-language shares (all three studies are English-centric).
//
// Nurevo facts: plugin source (llms.txt "## Pages" lists the 30 most
// recently modified published pages and posts; webmcp_canary_llms_txt_lines
// filter; per-page "leave out of llms.txt"); docs/developers.md
// (webmcp_canary_business_node, with Yoast SEO / Rank Math / AIOSEO / Slim
// SEO the node is merged and their values win); free AI check monthly with
// three Perplexity questions; Pro (from ¥14,800 / USD 99) on Perplexity,
// ChatGPT once configured; 0.9.1 coexists with SEO SIMPLE PACK and VK All in
// One Expansion Unit.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  muck2026: "https://media.muckrack.com/documents/What_Is_AI_Reading__May_2026.pdf",
  muck2026pr: "https://aimagazine.com/globenewswire/3290268",
  muck2025: "https://media.muckrack.com/static/reports/2025/MuckRack-GenerativePulse2025-1.pdf",
  leadcoverage: "https://www.globenewswire.com/news-release/2026/03/30/3264743/0/en/New-Research-Finds-Earned-Media-Accounts-for-25-of-All-Large-Language-Model-Citations.html",
  buzzstream: "https://www.buzzstream.com/blog/news-publications-ai-citations/",
  caa: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing",
  advertimes: "https://www.advertimes.com/20260703/article549597/",
  pressnet: "https://www.pressnet.or.jp/statement/20211210.pdf",
  sdPolicies: "https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=ja",
  sdPoliciesEn: "https://developers.google.com/search/docs/appearance/structured-data/sd-policies",
  sponsored: "https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=ja",
  sponsoredEn: "https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links",
};

const JSONLD = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://example.co.jp/#organization",
  "name": "株式会社サンプル",
  "url": "https://example.co.jp/",
  "award": "第10回 地域ものづくり大賞 優秀賞（2025年）",
  "subjectOf": [
    {
      "@type": "NewsArticle",
      "headline": "（記事の見出しをそのまま）",
      "datePublished": "2026-09-14",
      "url": "https://news.example.jp/articles/12345",
      "publisher": { "@type": "Organization", "name": "（媒体名）" }
    }
  ]
}
</script>`;

const JSONLD_EN = JSONLD
  .replace("株式会社サンプル", "Sample Co., Ltd.")
  .replace("第10回 地域ものづくり大賞 優秀賞（2025年）", "Regional Manufacturing Award, Merit Prize (2025)")
  .replace("（記事の見出しをそのまま）", "(the article's headline, exactly as published)")
  .replace("（媒体名）", "(publication name)");

const FILTER = `// 掲載実績のページを、更新日にかかわらず llms.txt に載せる
add_filter('webmcp_canary_llms_txt_lines', function (array $lines) {
    $lines[] = '## メディア掲載';
    $lines[] = '';
    $lines[] = '- [メディア掲載・受賞](https://example.co.jp/media/): 媒体名・日付・見出し・元の記事へのリンクの一覧';
    $lines[] = '';
    return $lines;
});`;

const FILTER_EN = FILTER
  .replace("// 掲載実績のページを、更新日にかかわらず llms.txt に載せる", "// Keep the press coverage page in llms.txt whatever its modified date")
  .replace("## メディア掲載", "## Press coverage")
  .replace("[メディア掲載・受賞](https://example.co.jp/media/): 媒体名・日付・見出し・元の記事へのリンクの一覧", "[Press coverage and awards](https://example.com/press/): publication, date, headline and a link to each original article");

export default {
  slug: "media-coverage-page-ai-search",
  targetQueries: [
    "press coverage page AI search",
    "earned media AI citations",
    "as seen in page ChatGPT",
    "メディア掲載 ページ 作り方",
    "メディア掲載実績 AI検索",
    "第三者 言及 AI 引用 PR",
  ],
  related: ["company-profile-page-ai-search", "wikipedia-wikidata-ai-search", "agency-ai-search-manipulation-risks", "measure-ai-visibility", "perplexity-citations"],
  locales: {
    ja: {
      title: "メディア掲載ページの作り方：AI検索に報道を見つけてもらう | Nurevo",
      description: "AIの回答の出典は、お金を払っていない第三者の記事が大半という調査があります。自社サイトの掲載実績ページに書く項目、著作権・ステマ規制の注意、構造化データとWordPressの手順をまとめました。",
      h1: "メディア掲載ページの作り方：AI検索と読者に、第三者の報道を正しく見つけてもらう手順",
      lead: "AIの回答の出典は、新聞・専門誌・比較記事など、お金を払っていない第三者のページが大半を占めるという調査があります。自社サイトの「メディア掲載」ページは、それ自体が第三者の評価になるわけではありませんが、媒体名・日付・見出し・元の記事へのリンクを1か所にまとめることで、AIと読者が独立した報道にたどり着く入り口になります。記事の画像を貼らずにリンクで紹介し、お金を払って載せた記事は「広告」とわかるように分けることが前提です。",
      intro: [
        "作成日：2026年11月25日（日本時間）。調査の数字は Muck Rack（2025年12月・2026年5月）と BuzzStream（2026年3月）の公開資料、著作権とステルスマーケティングの規制は日本新聞協会・消費者庁の資料と業界紙の記事を同日に読んで確認しました。",
        "メディア掲載のページを作っても、AIの回答に会社が必ず出る・順位が上がるということはありません。AIの回答は日々変わり、出典の選び方も公表されていません。この記事は、すでにある報道を正しく、規則を守って見せるための手順です。",
      ],
      sections: [
        {
          heading: "AIは何を出典にしているか：3つの調査",
          paragraphs: [
            "「アーンドメディア（お金を払わずに得た掲載）がAIの出典の多くを占める」という話はよく引用されますが、調査によって数え方が大きく違います。主な3つを並べます。",
          ],
          table: {
            head: ["調査", "対象", "わかったこと"],
            rows: [
              ["Muck Rack「What Is AI Reading?」2026年5月", "2,500万件超のリンク、ChatGPT・Claude・Gemini、17業種", "アーンドメディアが約84%、そのうち報道（ジャーナリズム）は全体の約27%。広告・記事広告は0.3%。日付のわかる報道の引用の57%は直近12か月の記事"],
              ["Muck Rack「What is AI Reading?」2025年12月", "100万件超のリンク、2025年7〜12月、Gemini・Perplexity・Claude・ChatGPT", "報道は25%弱、アーンドメディアは82%。プレスリリースは1.2%から約6%に増えた"],
              ["BuzzStream（2026-03-09、04-08更新）", "約400万件の引用、3,600の質問、10業種、2026年1月27日から1週間、ChatGPT・GoogleのAIモード・AIによる概要・Gemini", "ニュース媒体は引用の14.09%。ブランドを知る質問では7.26%、くらべて選ぶ質問では約18%。通信社の配信サイトは全体の0.21%、企業自身のプレスリリース・ニュースルームは全体の2.98%（ChatGPTでは18.15%）"],
            ],
          },
          after: [
            `出典：[Muck Rack 2026年5月](${SRC.muck2026}（[発表](${SRC.muck2026pr})）、[Muck Rack 2025年12月](${SRC.muck2025})、[BuzzStream](${SRC.buzzstream})。いずれも自社の製品を売る会社の調査で、Muck Rack の2026年5月版は Perplexity を含みません。BuzzStream の質問は大手ブランドが中心で、ChatGPTの18.15%が何を母数にした数字かは明記されていません。日本語の質問での割合を示した調査は見つかりませんでした。`,
            `「アーンドメディアは25%」という見出しの発表もありますが（[LeadCoverage の発表](${SRC.leadcoverage})）、Muck Rack の元の資料では25%弱は報道だけの割合で、アーンドメディア全体は82%です。数字を引用するときは元の資料まで確かめてください。`,
            "3つの調査から言えるのは、①AIは広告よりも第三者の記事を出典にしやすい、②その中で報道が占めるのは一部で、比較記事や口コミ、業界のサイトなども多い、③くらべて選ぶ質問ほど報道が使われやすい、という傾向までです。",
          ],
        },
        {
          heading: "自社のメディア掲載ページは何の役に立つか",
          paragraphs: [
            "自社サイトに「〇〇新聞に掲載されました」と書いても、それは会社自身の発信で、独立した評価にはなりません。役に立つのは次の3つです。",
          ],
          list: [
            "入り口になる：媒体名・日付・見出し・URLがそろっていれば、AIの検索や読者、記者、Wikipediaの編集者が元の記事にたどり着けます。",
            "事実をそろえる：記事に書かれた会社名・所在地・商品名が古くなっていても、掲載ページに「当時」の事実と今の事実を並べておけば、混同を防げます。",
            "確かめられる形にする：「テレビで話題」のような書き方は確かめようがありません。番組名と放送日があれば、AIも読者も裏付けを探せます。",
          ],
          after: [
            "BuzzStream の調査では、ChatGPTで企業自身のニュースルームが出典になる割合が他のAIより高く出ています。自社のページも読まれる可能性はありますが、中身が報道の一覧であることが前提です。",
          ],
        },
        {
          heading: "3つの置き場所の役割",
          table: {
            head: ["置き場所", "書く人", "AIにとっての意味", "注意"],
            rows: [
              ["第三者の記事（新聞・専門誌・Web媒体）", "媒体の記者・編集者", "独立した情報源。くらべる質問で使われやすい", "内容は会社が決められない"],
              ["プレスリリース（自社のお知らせ・配信サービス）", "会社", "会社自身の発表として読まれる。事実の一次情報", "配信しただけでは報道にはならない"],
              ["自社のメディア掲載ページ", "会社", "第三者の記事への入り口と、事実の対照表", "記事のコピーや誇張をしない"],
            ],
          },
        },
        {
          heading: "1件ごとに書く8つの項目",
          paragraphs: [
            `日本新聞協会のQ&Aは、記事を紹介する検索サービスについて、媒体名・日付・見出し・ごく短い抜粋・URLを表示し、元の記事へのリンクを付けることが重要だとしています（検索サービス向けの資料ですが、紹介の形の目安になります。[日本新聞協会](${SRC.pressnet})）。自社のページでは、次の8項目を文字で書きます。`,
          ],
          table: {
            head: ["項目", "書き方の例", "理由"],
            rows: [
              ["媒体名", "〇〇新聞（朝刊・地域面）", "どこが書いたかが独立性の判断材料"],
              ["掲載日・放送日", "2026年9月14日", "AIは新しい報道を多く引用する傾向"],
              ["見出し・番組名", "記事の見出しをそのまま", "検索で元の記事を見つけるため"],
              ["種類", "取材記事／インタビュー／寄稿／テレビ／ラジオ", "読者が中身を想像できる"],
              ["区分", "取材／広告・タイアップ／プレスリリースの転載", "広告を報道と混ぜないため"],
              ["取り上げられた内容", "新しい工場の稼働と地元雇用について（自分の言葉で1文）", "記事の文章を写さずに要点を伝える"],
              ["リンク", "元の記事のURL（紙面だけの場合は「紙面のみ」）", "裏付けにたどり着ける"],
              ["補足", "記事中の所在地は移転前のものです", "古い事実との混同を防ぐ"],
            ],
          },
          after: [
            "新しい順に並べ、年ごとに見出しを付けると、AIにも読者にも読みやすくなります。リンクが切れた記事は、消さずに「掲載元で公開終了」と書いて残します。",
          ],
        },
        {
          heading: "やってはいけないこと：著作権とステルスマーケティング",
          list: [
            `記事の画像・スキャン・スクリーンショットを貼らない：コピー、スキャン、撮影、ネット記事のコピー＆ペースト、画面の印刷は複製にあたり、原則として著作権者の許諾が必要です。社内のイントラネットへの掲載でも、2023年の判決で日本経済新聞に約696万円、中日新聞に約133万円の支払いが命じられています（[アドタイ 2026-07-03](${SRC.advertimes})）。載せたい場合は媒体に転載の許諾を申し込みます。`,
            "記事の文章を長く写さない：要点は自分の言葉で1〜2文にまとめ、詳しくは元の記事へのリンクで読んでもらいます。",
            "媒体のリンクの決まりを確かめる：媒体によっては、リンクの方針で商品の宣伝などの商用利用を断っている場合があります（日本新聞協会のQ&A）。媒体のロゴを並べる場合も、許可を取ってからにします。",
            `お金を払った記事は「広告」と書く：2023年10月1日から、一般の消費者が広告と気づけない広告は景品表示法違反です。対象には新聞・雑誌・テレビ・ラジオ・SNSも含まれ、責任を負うのは広告主の事業者です（[消費者庁](${SRC.caa})）。記事広告・タイアップ記事を掲載実績に並べるなら、「広告（タイアップ）」と区分を書き、取材記事と分けます。`,
            `記事広告から自社へのリンクは、媒体側で rel="sponsored" などを付けるようGoogleは求めています（[Google：外部リンクの属性](${SRC.sponsored})）。掲載を頼むときに確かめておきます。`,
            "誇張しない：「各メディアで話題」「テレビで紹介多数」のように、確かめられない書き方は避け、1件ずつ事実で書きます。",
          ],
        },
        {
          heading: "構造化データ：見えている一覧だけをマークアップする",
          paragraphs: [
            `schema.org では、会社（Organization）を取り上げた記事を subjectOf で、受賞を award（文字）で書けます。Googleのリッチリザルトの対象ではなく、AIがこの項目を使うと公表している会社もありません。書くなら、ページに見えている一覧と同じ内容だけにします。Googleの構造化データのガイドラインは、ページで見えない内容をマークアップしないよう求めています（[Google：構造化データの一般的なガイドライン](${SRC.sdPolicies})）。`,
          ],
          code: JSONLD,
          after: [
            "見出しと日付は記事のとおりに書き、媒体の記事ではない広告は入れません。会社の構造化データ全体の整え方は[会社概要ページのAI検索対策](/guide/company-profile-page-ai-search)にあります。",
          ],
        },
        {
          heading: "WordPressでの手順",
          list: [
            "固定ページで「メディア掲載」（または「掲載実績・受賞」）を作り、URLを /media/ などの短い英字にします。画像のギャラリーではなく、表かリストで8項目を文字で書きます。",
            "プレスリリースは投稿（お知らせ）に、第三者の記事はこのページに、と置き場所を分けます。会社概要のページとフッターからこのページにリンクします。",
            "外部の記事へのリンクは通常のリンクでかまいません。リンク切れはプラグインや定期的な目視で確かめ、切れたものに注記を付けます。",
            "Nurevo AEO（無料のWordPressプラグイン）の llms.txt は、最近更新した公開済みのページと投稿を30件まで並べます。掲載ページを長く更新しないと一覧から外れることがあるため、残したい場合はフィルター webmcp_canary_llms_txt_lines で「メディア掲載」の行を足します（下の例）。ページごとの設定で llms.txt から外すこともできます。",
            "subjectOf を会社の構造化データに足すときは、フィルター webmcp_canary_business_node を使います。Yoast SEO・Rank Math・All in One SEO・Slim SEO が有効な場合、値はそれらの会社の情報にまとめられ、プラグインがすでに出している値が優先されます。0.9.1 からは SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても構造化データは重複しません。",
            `入れたら、/llms.txt とページのソース（application/ld+json）で、一覧と同じ内容が出ているかを確かめます。[WordPress.orgで入手](${WP_ORG})`,
          ],
          code: FILTER,
        },
        {
          heading: "確かめ方",
          list: [
            "ChatGPT・Perplexity・GoogleのAIモードに「（社名）はどんな会社？」「（地域）で（業種）を選ぶならどこ？」「（社名）の評判は？」と聞き、答えと出典のURLを日付付きで記録します。",
            "出典に出てきた記事が掲載ページにあるか、逆に掲載ページの記事がまったく出ないかを見ます。出典が古い記事ばかりなら、補足欄で今の事実を書き足します。",
            "Googleアナリティクス4で、掲載ページへのAIのサービスからの流入と、元の記事のサイトからの流入を見ます。Search Consoleでは社名の検索の変化を見ます。",
            "AIの回答は日によって変わるため、同じ質問を毎月同じ日に聞きます。決めた質問のセットで記録する方法は[AIでの登場率の測り方](/guide/measure-ai-visibility)にあります。",
            "Nurevo AEO の無料のAIチェックは、接続したサイトに月1回、業種と地域から作った3つの質問を Perplexity に聞きます。継続して測る Pro（月14,800円〜）も現在は Perplexity で測っています（ChatGPTは設定され次第）。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "掲載ページに、媒体名・日付・見出し・種類・区分・内容・リンク・補足を文字で書いた",
            "記事の画像・スキャン・スクリーンショットを許諾なしに貼っていない",
            "記事の文章を長く写さず、要点を自分の言葉で書いた",
            "お金を払った記事は「広告（タイアップ）」と区分を書いた",
            "プレスリリースと第三者の記事を分けて置いた",
            "「話題」「多数」など確かめられない表現を使っていない",
            "リンク切れの記事に注記を付けた",
            "会社概要とフッターから掲載ページにリンクした",
            "構造化データを使うなら、見えている一覧と同じ内容だけにした",
            "AIへの質問と答え・出典を、日付を付けて記録した",
          ],
        },
        {
          heading: "制作会社が掲載実績の整理を保守に入れるには",
          paragraphs: [
            "多くのお客様のサイトには、紙面の写真を並べただけの「メディア掲載」ページがあります。保守の作業として、①写真の一覧を8項目の文字の表に直す、②広告と取材を分ける、③許諾のない画像を外してリンクに替える、④四半期ごとに新しい掲載とリンク切れを確かめる、を提案すると、作業の範囲が説明しやすくなります。",
            "記事広告を「報道」と書いてほしい、ランキングサイトに有料で載せたいといった依頼の判断と断り方は[AI検索の不正な手法を頼まれたら](/guide/agency-ai-search-manipulation-risks)にまとめています。AI検索の整備を月額の保守に入れる方法は[パートナーのページ](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "メディア掲載ページを作れば、AIに出やすくなりますか？", a: "必ずとは言えません。AIが出典にしやすいのは第三者の記事そのもので、自社の掲載ページはその入り口です。媒体名・日付・見出し・リンクがそろっていれば、AIや読者が元の記事を見つけやすくなります。" },
        { q: "新聞記事の写真を掲載ページに貼ってもいいですか？", a: "原則として著作権者の許諾が必要です。スキャンや撮影、スクリーンショットも複製にあたります。許諾がなければ、媒体名・日付・見出しを文字で書き、元の記事にリンクしてください。" },
        { q: "記事広告やタイアップ記事も掲載実績に載せていいですか？", a: "載せることはできますが、「広告（タイアップ）」とわかるように書き、取材記事と分けてください。2023年10月から、広告と気づけない広告は景品表示法違反になり、責任は広告主にあります。" },
        { q: "プレスリリースを配信すれば、メディア掲載になりますか？", a: "なりません。配信サービスのページは会社自身の発表です。記者が取材して書いた記事が出て、はじめてメディア掲載です。掲載ページでもプレスリリースは別に分けます。" },
        { q: "テレビやラジオの紹介はどう書けばいいですか？", a: "局名・番組名・放送日・コーナー名と、紹介された内容を1文で書きます。見逃し配信や番組のページがあればリンクし、なければ「放送のみ」と書きます。番組の画面の写真は許諾なしに使わないでください。" },
        { q: "古い記事は消したほうがいいですか？", a: "消す必要はありません。新しい順に並べ、記事中の所在地や商品が今と違う場合は補足欄に今の事実を書きます。リンクが切れたら「掲載元で公開終了」と注記して残します。" },
        { q: "構造化データは必須ですか？", a: "必須ではありません。まずページに文字で一覧を書くことが大切です。schema.org の subjectOf などで書くこともできますが、Googleのリッチリザルトの対象ではなく、AIが使うと公表された項目でもありません。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの会社のサイトを読めるか確認",
        body: "登録不要の無料チェックで、会社の構造化データ、llms.txt、AI検索のクローラーの許可の状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "Muck Rack、BuzzStream、LeadCoverage、Google、Googleアナリティクス、Search Console、ChatGPT、OpenAI、Claude、Anthropic、Gemini、Perplexity、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressおよび各製品名・媒体名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの団体・企業と提携・協賛関係にありません。",
    },
    en: {
      title: "Press Coverage Pages for AI Search: How to Build One | Nurevo",
      description: "Most AI citations come from unpaid third-party pages. What to list on a press coverage page, copyright and ad-disclosure rules, structured data and WordPress steps.",
      h1: "How to Build a Press Coverage Page That Helps AI Search and Readers Find Independent Coverage",
      lead: "Studies of AI answers find that most citations come from unpaid third-party pages: news, trade press, comparison articles and the like. A press coverage (\"as seen in\") page on your own site is not independent praise in itself, but listing each publication, date, headline and a link to the original in one place gives AI and readers a way in to that independent coverage. Link to articles rather than pasting images of them, and keep paid placements clearly labelled as ads.",
      intro: [
        "Written 2026-11-25 (JST). The figures come from the public reports of Muck Rack (December 2025 and May 2026) and BuzzStream (March 2026); the copyright and stealth-marketing points come from Japanese sources (the Japan Newspaper Association, the Consumer Affairs Agency and a trade publication), all read on the same day. If you are outside Japan, check the equivalent rules where you operate.",
        "A press page does not guarantee that AI will mention your business or rank it higher. AI answers change day to day, and no AI company publishes how it picks sources. This guide is about showing coverage you already have, accurately and within the rules.",
      ],
      sections: [
        {
          heading: "What AI cites: three studies",
          paragraphs: [
            "\"Earned media drives AI citations\" is widely repeated, but the studies count very different things. Here are the three main ones side by side.",
          ],
          table: {
            head: ["Study", "Scope", "Findings"],
            rows: [
              ["Muck Rack, \"What Is AI Reading?\" May 2026", "25 million+ links; ChatGPT, Claude, Gemini; 17 industries", "About 84% earned media; journalism about 27% of all citations; paid and advertorial 0.3%; 57% of dated journalism citations from the past 12 months"],
              ["Muck Rack, \"What is AI Reading?\" December 2025", "1 million+ links; July–December 2025; Gemini, Perplexity, Claude, ChatGPT", "Journalism just under 25%; earned media 82%; press releases rose from 1.2% to about 6%"],
              ["BuzzStream (2026-03-09, updated 04-08)", "About 4 million citations; 3,600 prompts; 10 industries; one week from 2026-01-27; ChatGPT, Google AI Mode, AI Overviews, Gemini", "News publications 14.09% of citations; 7.26% for brand-awareness prompts vs about 18% for evaluative prompts; newswires 0.21% of all citations; companies' own press releases and newsrooms 2.98% overall (18.15% on ChatGPT)"],
            ],
          },
          after: [
            `Sources: [Muck Rack, May 2026](${SRC.muck2026}) ([announcement](${SRC.muck2026pr})), [Muck Rack, December 2025](${SRC.muck2025}), [BuzzStream](${SRC.buzzstream}). All three come from companies that sell related products. Muck Rack's May 2026 edition does not include Perplexity. BuzzStream's prompts focus on major brands, and the article does not state what the 18.15% for ChatGPT is a share of. We found no study of the share for Japanese-language prompts.`,
            `One press release headlined \"earned media 25%\" ([LeadCoverage](${SRC.leadcoverage})), but in Muck Rack's source report the just-under-25% figure is journalism alone, while earned media overall is 82%. Check the original report before quoting any of these numbers.`,
            "What the three studies support is a tendency: (1) AI cites third-party pages far more than ads, (2) news is only part of that, alongside comparison articles, reviews and industry sites, and (3) news is used more for questions that compare and choose.",
          ],
        },
        {
          heading: "What your own press page is for",
          paragraphs: [
            "Writing \"featured in the Daily Example\" on your own site is still your own statement, not an independent assessment. The page earns its place in three ways.",
          ],
          list: [
            "A way in: with publication, date, headline and URL in place, AI search, readers, journalists and Wikipedia editors can reach the original article.",
            "Keeping facts straight: if an article shows an old address or product name, listing what was true then next to what is true now prevents mix-ups.",
            "Making claims checkable: \"as seen on TV\" can't be verified. A programme name and air date can.",
          ],
          after: [
            "In BuzzStream's study, companies' own newsroom content was cited more often by ChatGPT than by the other AI tools. Your own page can be read, then, but only if what it contains is a real list of coverage.",
          ],
        },
        {
          heading: "Three places and what each one does",
          table: {
            head: ["Place", "Written by", "What it means to AI", "Watch out for"],
            rows: [
              ["Third-party articles (newspapers, trade press, web media)", "The publication's journalists and editors", "An independent source; used more for comparison questions", "You don't control the content"],
              ["Press releases (your news page, distribution services)", "Your company", "Read as your own announcement; the primary source of the facts", "Distribution alone is not coverage"],
              ["Your press coverage page", "Your company", "A way in to third-party articles and a table of facts", "No copied articles, no exaggeration"],
            ],
          },
        },
        {
          heading: "Eight things to write for each item",
          paragraphs: [
            `The Japan Newspaper Association's Q&A says that search services presenting articles should show the publication name, date, headline, a very short snippet and the URL, and that linking to the original is the key point (it was written for search services, but it is a useful guide to what a listing contains; [Japan Newspaper Association](${SRC.pressnet})). On your own page, write these eight items as text.`,
          ],
          table: {
            head: ["Item", "Example", "Why"],
            rows: [
              ["Publication", "The Daily Example (print, regional section)", "Who wrote it is how independence is judged"],
              ["Date published or aired", "14 September 2026", "AI tends to cite recent coverage"],
              ["Headline or programme", "The headline exactly as published", "So the original can be found by search"],
              ["Format", "Reported article / interview / contributed piece / TV / radio", "Readers know what to expect"],
              ["Type", "Editorial / paid or sponsored / press release reprint", "Keeps ads apart from coverage"],
              ["What it covered", "The new plant opening and local hiring (one sentence in your words)", "Gives the gist without copying the text"],
              ["Link", "URL of the original (or \"print only\")", "Lets anyone check"],
              ["Note", "The address in the article is our former office", "Prevents confusion with outdated facts"],
            ],
          },
          after: [
            "List items newest first with a heading for each year; that is easier for both AI and readers. When a link dies, keep the item and note \"no longer available at the publisher\".",
          ],
        },
        {
          heading: "What not to do: copyright and hidden advertising",
          list: [
            `Don't paste images, scans or screenshots of articles. In Japan, copying, scanning, photographing, copy-and-pasting web articles and printing screens all count as reproduction and in principle need the rights holder's permission. Even for posting on an internal intranet, a 2023 ruling ordered payments of about ¥6.96 million to Nikkei and about ¥1.33 million to Chunichi Shimbun ([AdverTimes, 2026-07-03](${SRC.advertimes})). If you want to show an article, ask the publication for reprint permission.`,
            "Don't copy long passages. Summarise the point in one or two sentences of your own and link to the original for the rest.",
            "Check each publication's linking policy. Some refuse commercial use such as product promotion in their link policies (Japan Newspaper Association Q&A). Get permission before showing a publication's logo, too.",
            `Label paid articles as ads. In Japan, since 1 October 2023, advertising that ordinary consumers cannot recognise as advertising violates the Act against Unjustifiable Premiums and Misleading Representations. It covers newspapers, magazines, TV, radio and social media, and the advertiser is the party held responsible ([Consumer Affairs Agency](${SRC.caa})). If you list sponsored or advertorial pieces, mark them \"Advertisement (sponsored)\" and keep them separate from editorial coverage.`,
            `For links from a sponsored article to your site, Google asks for rel=\"sponsored\" or similar on the publisher's side ([Google: qualify outbound links](${SRC.sponsoredEn})). Confirm this when you book the placement.`,
            "Don't exaggerate. Avoid unverifiable lines such as \"featured everywhere\" or \"seen on TV many times\" and state each item as a fact.",
          ],
        },
        {
          heading: "Structured data: mark up only the list people can see",
          paragraphs: [
            `In schema.org, articles about your organization can be given with subjectOf and awards with award (text). Neither is a Google rich result, and no AI company has said it uses these properties. If you add them, include only what is visible in the list on the page: Google's structured data guidelines ask you not to mark up content that is hidden from readers ([Google: general structured data guidelines](${SRC.sdPoliciesEn})).`,
          ],
          code: JSONLD_EN,
          after: [
            "Write headlines and dates exactly as published, and leave out paid placements that are not the publication's own editorial. For the company's structured data as a whole, see [the about page and AI search](/guide/company-profile-page-ai-search).",
          ],
        },
        {
          heading: "Steps in WordPress",
          list: [
            "Create a page called \"Press\" (or \"Press and awards\") with a short URL such as /press/. Write the eight items as a table or list in text, not as an image gallery.",
            "Keep press releases as posts (news) and third-party coverage on this page. Link to the page from your about page and the footer.",
            "Ordinary links to outside articles are fine. Check for broken links with a plugin or by hand on a schedule, and add a note to any that have died.",
            "In Nurevo AEO (a free WordPress plugin), llms.txt lists up to 30 of the most recently modified published pages and posts. A press page that goes unedited for a long time can drop off that list, so to keep it there, add a \"Press coverage\" line with the webmcp_canary_llms_txt_lines filter (example below). You can also leave any page out of llms.txt in its per-page settings.",
            "To add subjectOf to the company's structured data, use the webmcp_canary_business_node filter. When Yoast SEO, Rank Math, All in One SEO or Slim SEO is active, the values are merged into that plugin's company data and the values it already publishes win. Since 0.9.1, using it alongside SEO SIMPLE PACK or VK All in One Expansion Unit does not duplicate structured data.",
            `Then check /llms.txt and the page source (application/ld+json) to confirm they match the list on the page. [Get it on WordPress.org](${WP_ORG})`,
          ],
          code: FILTER_EN,
        },
        {
          heading: "How to check",
          list: [
            "Ask ChatGPT, Perplexity and Google AI Mode questions such as \"What kind of company is (name)?\", \"Which (business type) should I choose in (area)?\" and \"What do people say about (name)?\". Record the answers and source URLs with the date.",
            "See whether the articles cited are on your press page, and whether articles on your page never appear. If the cited sources are mostly old, add current facts in the note column.",
            "In Google Analytics 4, look at visits to the press page from AI services and from the publications' sites. In Search Console, watch searches for your company name.",
            "AI answers vary from day to day, so ask the same questions on the same day each month. How to track a fixed question set is in [measuring AI visibility](/guide/measure-ai-visibility).",
            "Nurevo AEO's free AI check asks Perplexity three questions built from your business type and area, once a month, for each connected site. Pro (from USD 99/month), which measures continuously, also uses Perplexity today (ChatGPT once configured).",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "The press page gives publication, date, headline, format, type, what was covered, link and a note, as text",
            "No images, scans or screenshots of articles without permission",
            "No long copied passages; the point is summarised in our own words",
            "Paid articles are marked \"Advertisement (sponsored)\"",
            "Press releases and third-party coverage are kept apart",
            "No unverifiable wording such as \"featured everywhere\"",
            "Dead links carry a note",
            "The about page and footer link to the press page",
            "Any structured data matches the visible list only",
            "AI questions, answers and sources are recorded with dates",
          ],
        },
        {
          heading: "Adding press page clean-up to an agency's maintenance plan",
          paragraphs: [
            "Many client sites have a \"media\" page that is nothing but photos of newspaper pages. As a maintenance task you can offer to (1) turn the photo wall into an eight-item text table, (2) separate paid placements from editorial coverage, (3) replace unlicensed images with links, and (4) check for new coverage and dead links every quarter. That makes the scope easy to explain.",
            "For requests such as \"call our advertorial news coverage\" or \"buy us a spot on a ranking site\", see [when clients ask for AI search manipulation](/guide/agency-ai-search-manipulation-risks). To add AI search work to monthly maintenance, see the [partner page](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "Will a press page make AI mention us more?", a: "Not necessarily. What AI tends to cite is the third-party articles themselves; your press page is the way in to them. With publication, date, headline and link in place, AI and readers can find the originals more easily." },
        { q: "Can we post photos of newspaper articles on the page?", a: "In principle you need the rights holder's permission; scans, photos and screenshots all count as copies. Without permission, write the publication, date and headline as text and link to the original." },
        { q: "Can we list advertorials and sponsored articles?", a: "You can, but label them \"Advertisement (sponsored)\" and keep them apart from editorial coverage. In Japan, since October 2023, ads that consumers can't recognise as ads violate the law, and the advertiser is responsible." },
        { q: "Does distributing a press release count as coverage?", a: "No. A distribution service's page is your own announcement. It becomes coverage when a journalist reports and publishes a story. Keep press releases separate on your page too." },
        { q: "How should we list TV or radio appearances?", a: "Give the station, programme, air date, segment and one sentence on what was covered. Link to on-demand or programme pages if they exist; otherwise write \"broadcast only\". Don't use screenshots of the broadcast without permission." },
        { q: "Should we remove old articles?", a: "No need. List newest first, and if an article's address or products differ from today's, add the current facts in the note. When a link dies, keep the item with \"no longer available at the publisher\"." },
        { q: "Is structured data required?", a: "No. Writing the list as text on the page comes first. You can add schema.org subjectOf and the like, but it is not a Google rich result and no AI company has said it uses it." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, check whether AI can read your company site",
        body: "A free check with no sign-up shows the state of your company structured data, llms.txt and access for AI search crawlers. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Muck Rack, BuzzStream, LeadCoverage, Google, Google Analytics, Search Console, ChatGPT, OpenAI, Claude, Anthropic, Gemini, Perplexity, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit, WordPress and their product and publication names are trademarks of their respective owners. Nurevo is not affiliated with these organizations.",
    },
  },
};
