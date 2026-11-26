// Content page: images and video in AI search. What AI answer engines can
// actually take from photos, price/menu images, charts and videos (mostly the
// text around them), how to write alt text and captions, how to put video
// summaries and transcripts on the page, YouTube descriptions and chapters,
// VideoObject, WordPress steps, how to check. General / all industries.
//
// Separate from ai-crawlers-javascript-rendering (initial HTML vs JavaScript;
// it touches image text and ::before in one table row only), photo-studio-ai-
// search and on-location-photographer-ai-search (portfolio alt text for one
// industry), blog-articles-ai-citations (ordinary articles).
//
// Written 2026-11-26 20時 (JST).
//
// Nurevo AEO facts (wordpress-plugin/webmcp-canary/nurevo-webmcp.php, readme
// 0.9.2, docs/developers.md):
// - On a single post/page, the BlogPosting/WebPage node gets `image` from the
//   featured image (get_the_post_thumbnail_url, 'full') when one is set.
// - WooCommerce products: main product image as `image`.
// - Nurevo does NOT output VideoObject or ImageObject by itself. Developers can
//   add nodes through the `webmcp_canary_schema_graph` filter ($bundle['extra'],
//   $bundle['org_id']).
// - Coexists with Yoast/Rank Math/AIOSEO/SEO SIMPLE PACK/VK ExUnit (0.9.1+).
// - Pro AI-visibility measurement on Perplexity (beta). Prices as usual.
//
// Outside facts and where they were read (2026-11-26):
// - Google "Image SEO best practices" (last updated 2026-03-02): finds images
//   in <img src> (also inside <picture>); CSS background images not indexed;
//   alt text is the most important image metadata, used together with computer
//   vision and the page content; alt ladder (missing/stuffed bad, "puppy"
//   better, "Dalmatian puppy playing fetch" best); descriptive filenames;
//   captions and nearby text used; preferred image via primaryImageOfPage,
//   mainEntity image or og:image; formats BMP GIF JPEG PNG WebP SVG AVIF;
//   always keep a fallback src for srcset/picture.
// - Google "Video SEO best practices": finds video in <video>, <embed>,
//   <iframe>, <object>; watch page = a page whose main purpose is one video
//   (a blog post reviewing an embedded video is not a watch page); valid
//   thumbnail at a stable URL; Clip supported in all Search languages,
//   SeekToAction in a listed set including Japanese; YouTube description
//   timestamps work in all languages; structured data still recommended with
//   third-party players. The page does not address transcripts.
// - Google VideoObject structured data: required name, thumbnailUrl,
//   uploadDate (also stated by pamxy citing the same page); recommended
//   description, duration, contentUrl/embedUrl, hasPart (Clip). No transcript
//   property is listed by Google (it exists on schema.org, not used here).
// - YouTube Help "Video chapters": first timestamp 00:00, at least three in
//   ascending order, each chapter at least 10 seconds; manual chapters override
//   automatic ones.
// - OtterlyAI "The YouTube Citation Study 2026" (2026-03-02): 100M+ citations,
//   30 days, ChatGPT, AI Overviews, AI Mode, Perplexity, Copilot, Gemini. Long
//   form 94%, Shorts 5.7%; views r=-0.03, subscribers r=-0.03, description
//   length r=0.31; 40.83% of cited videos under 1,000 views; YouTube share by
//   platform: Perplexity 38.7%, AI Overviews 36.6%, AI Mode 19.6%, ChatGPT
//   4.4%, Copilot 0.5%, Gemini 0.2%; timestamped citations only on Google
//   surfaces (73% AIO, 27% AI Mode); 10-20 min 32.1%, 5-10 min 26.1%, >20 min
//   17.6%; authors: correlation not causation, only already-cited videos.
// - Vercel (2024-12-17) and Writesonic (2026-03) already read for
//   ai-crawlers-javascript-rendering: major AI crawlers do not run JS;
//   ::before/::after text read by 0/6 assistants.
// Not stated on purpose: whether ChatGPT/Perplexity crawlers OCR or "see" page
// images (no vendor documentation found); Texta's "3.2x / 5.3x" multipliers
// (no method); BrightEdge "200x" (source page failed); thumbnail minimum size
// (only in a model summary); any file-size target.
// Top articles read 2026-11-26: Uravation alt (2026-08-04, upd. 09-05),
// Uravation video (2026-07-19, upd. 09-05), Ahrefs JA AI Overviews
// (2026-02-01, upd. 07-10), pamxy マーケドリブン YouTube AI (2026-11-26);
// Search Engine Land/BrightEdge (undated), Texta, Wistia (2026-01-23),
// iPullRank (upd. 2026-11-18), VEED on OtterlyAI, AltText.ai (2026-06-15),
// Digiday (2026-09-23). media-radar and SEL 462830 failed to load.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  gImages: "https://developers.google.com/search/docs/appearance/google-images",
  gImagesJa: "https://developers.google.com/search/docs/appearance/google-images?hl=ja",
  gVideo: "https://developers.google.com/search/docs/appearance/video",
  gVideoJa: "https://developers.google.com/search/docs/appearance/video?hl=ja",
  gVideoSd: "https://developers.google.com/search/docs/appearance/structured-data/video",
  gVideoSdJa: "https://developers.google.com/search/docs/appearance/structured-data/video?hl=ja",
  ytChapters: "https://support.google.com/youtube/answer/9884579?hl=en",
  ytChaptersJa: "https://support.google.com/youtube/answer/9884579?hl=ja",
  otterly: "https://otterly.ai/blog/youtube-ai-citation-study-2026/",
  vercel: "https://vercel.com/blog/the-rise-of-the-ai-crawler",
  writesonic: "https://writesonic.com/blog/ai-crawler-study-what-llms-see-on-your-website",
  uravationAlt: "https://uravation.com/llmo/gazo-alt-ai-search-design/",
  uravationVideo: "https://uravation.com/llmo/video-content-ai-search/",
  ahrefsJa: "https://ahrefs.com/ja/blog/how-to-rank-in-ai-overviews/",
  pamxy: "https://pamxy.co.jp/marke-driven/sns-marketing/youtube/youtube-ai-taisaku/",
  sel: "https://searchengineland.com/youtube-citations-google-ai-overviews-surge-2025-451852",
  texta: "https://www.texta.ai/blog/how-to-optimize-images-and-videos-for-ai-complete-guide",
  wistia: "https://wistia.com/blog/optimize-videos-for-llms",
  ipullrank: "https://ipullrank.com/ai-search-manual/youtube",
  alttext: "https://alttext.ai/blog/ai-search-visibility-guide",
  digiday: "https://digiday.com/marketing/in-graphic-detail-llms-keep-citing-youtube-in-search-results/",
};

const CHECK = `# 1) ページの画像のうち、alt が無いもの・空のものを数える
URL="https://example.com/menu/"
curl -sS -L --compressed "$URL" -o page.html
echo "画像の数:   $(grep -o '<img[^>]*>' page.html | wc -l)"
echo "alt なし:   $(grep -o '<img[^>]*>' page.html | grep -vc 'alt=')"
echo "alt が空:   $(grep -o '<img[^>]*>' page.html | grep -c 'alt=""')"

# 2) alt の中身を一覧にする（「画像1」「IMG_0023」などが無いか見る）
grep -o '<img[^>]*>' page.html | grep -o 'alt="[^"]*"' | sort | uniq -c | sort -rn | head -30

# 3) 画像に入れていた料金や時間が、本文の文字にもあるか
for WORD in "カット 4,400円" "最終受付 19:00" "駐車場 3台"; do
  if grep -qF "$WORD" page.html; then echo "あり  $WORD"; else echo "なし  $WORD"; fi
done

# 4) 動画のページに、要約・文字起こし・VideoObject が入っているか
grep -c 'VideoObject' page.html
grep -o '<iframe[^>]*youtube[^>]*>' page.html | head -5`;

const CHECK_EN = `# 1) Count images on the page with no alt or an empty alt
URL="https://example.com/menu/"
curl -sS -L --compressed "$URL" -o page.html
echo "images:     $(grep -o '<img[^>]*>' page.html | wc -l)"
echo "no alt:     $(grep -o '<img[^>]*>' page.html | grep -vc 'alt=')"
echo "empty alt:  $(grep -o '<img[^>]*>' page.html | grep -c 'alt=""')"

# 2) List the alt text in use (look for "image1", "IMG_0023" and the like)
grep -o '<img[^>]*>' page.html | grep -o 'alt="[^"]*"' | sort | uniq -c | sort -rn | head -30

# 3) Are the prices and times that sit in images also in the body text?
for WORD in 'Haircut $45' 'Last booking 7pm' '3 parking spaces'; do
  if grep -qF "$WORD" page.html; then echo "found    $WORD"; else echo "MISSING  $WORD"; fi
done

# 4) Does the video page carry a summary, a transcript and VideoObject?
grep -c 'VideoObject' page.html
grep -o '<iframe[^>]*youtube[^>]*>' page.html | head -5`;

const PHP = `<?php
// 動画を載せた固定ページ（ID 123）に VideoObject を足す例。
// 子テーマの functions.php か、小さなプラグインに書きます。
add_filter('webmcp_canary_schema_graph', function (array $bundle) {
    if (!is_page(123)) {
        return $bundle;
    }
    $bundle['extra'][] = array(
        '@type'        => 'VideoObject',
        'name'         => '初めての方へ：カウンセリングから仕上げまで（6分）',
        'description'  => '予約から会計までの流れ、所要時間、料金に含まれるものを説明します。',
        'thumbnailUrl' => 'https://example.com/wp-content/uploads/2026/11/flow-thumb.jpg',
        'uploadDate'   => '2026-11-20T10:00:00+09:00',
        'duration'     => 'PT6M30S',
        'embedUrl'     => 'https://www.youtube.com/embed/XXXXXXXXXXX',
        'publisher'    => array('@id' => $bundle['org_id']),
    );
    return $bundle;
});`;

const PHP_EN = `<?php
// Add a VideoObject to the page (ID 123) that carries the video.
// Put this in a child theme's functions.php or a small plugin.
add_filter('webmcp_canary_schema_graph', function (array $bundle) {
    if (!is_page(123)) {
        return $bundle;
    }
    $bundle['extra'][] = array(
        '@type'        => 'VideoObject',
        'name'         => 'Your first visit: from consultation to finish (6 min)',
        'description'  => 'How booking, timing and payment work, and what the price includes.',
        'thumbnailUrl' => 'https://example.com/wp-content/uploads/2026/11/flow-thumb.jpg',
        'uploadDate'   => '2026-11-20T10:00:00+09:00',
        'duration'     => 'PT6M30S',
        'embedUrl'     => 'https://www.youtube.com/embed/XXXXXXXXXXX',
        'publisher'    => array('@id' => $bundle['org_id']),
    );
    return $bundle;
});`;

export default {
  slug: "images-video-ai-search",
  targetQueries: [
    "画像 動画 AI検索 対策",
    "代替テキスト AI 引用 書き方",
    "YouTube AI検索 引用 文字起こし",
    "optimize images and videos for AI search",
    "does ChatGPT read alt text",
    "video transcript AI citations",
  ],
  related: ["ai-crawlers-javascript-rendering", "blog-articles-ai-citations", "google-ai-overviews-citations", "perplexity-citations", "faq-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "画像・動画のAI検索対策：代替テキストと文字起こしの手順 | Nurevo",
      description: "AI検索は画像や動画の中身より、周りの文字を手がかりにします。代替テキスト・キャプション・本文の表・動画の要約と文字起こし・YouTubeの説明欄とチャプター・VideoObjectの手順。",
      h1: "画像・動画とAI検索：代替テキスト、キャプション、動画の文字起こしをAIに読ませる手順",
      lead: "ChatGPT・Perplexity・GoogleのAIに画像や動画の情報を使ってもらうには、その中身を「文字」でもページに書いておくことが基本です。Googleは画像の内容を代替テキスト（alt）・周りの文章・画像認識を合わせて理解すると説明していますが、ほかのAIがページの画像をどこまで読み取るかは公開されていません。料金表やメニューを画像だけで載せず本文にも書き、写真には何の写真かが分かる代替テキストを、動画には要約と文字起こしをページに付けてください。YouTubeの動画は、OtterlyAIの調査ではPerplexityとGoogleのAIで多く引用されていました。",
      intro: [
        "作成日：2026年11月26日（JST）。対象は、写真や動画を多く使う店・会社のサイト運営者と、サイトを作る制作会社の方です。WordPressでの手順と、コマンドを使った確かめ方も書いています。",
        "AIの仕組みは各社が予告なく変えることがあり、AIの回答は日や聞き方によっても変わります。この記事の手順は、画像や動画の情報が読まれるための準備で、AIの回答に出ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれている記事と、足りないこと",
          paragraphs: [
            "「画像 AI検索 代替テキスト」「YouTube AI検索 引用」「optimize images and videos for AI search」などで上位に出る日本語4本・英語7本を、2026年11月26日に読みました。日本語は、[Uravation（画像）](" + SRC.uravationAlt + ")（2026年9月5日更新）、[Uravation（動画）](" + SRC.uravationVideo + ")（9月5日更新）、[Ahrefs](" + SRC.ahrefsJa + ")（7月10日更新）、[マーケドリブン](" + SRC.pamxy + ")（11月26日）。英語は、[Search Engine Land](" + SRC.sel + ")、[Texta](" + SRC.texta + ")、[Wistia](" + SRC.wistia + ")（1月23日）、[iPullRank](" + SRC.ipullrank + ")（11月18日更新）、[AltText.ai](" + SRC.alttext + ")（6月15日）、[Digiday](" + SRC.digiday + ")（9月23日）と、OtterlyAIの調査の[元の記事](" + SRC.otterly + ")です。",
            "「AIは画像や動画を見ているのではなく、周りの文字を読んでいる」「動画は文字起こしが大事」という方向はほぼ共通でした。一方で、次の点はあまり書かれていませんでした。",
          ],
          table: {
            head: ["足りない点", "この記事で書いていること"],
            rows: [
              ["「◯倍引用されやすい」などの数字に、調べ方が書かれていないものがある", "調べ方が公開されている調査（Googleの説明、OtterlyAIの1億件超の調査）の数字だけを使い、分からないことは分からないと書く"],
              ["YouTubeの話と、自社サイトの画像・動画の話が分かれていない", "「自社サイトの画像」「自社サイトの動画」「YouTube」に分けて手順を書く"],
              ["店や会社のサイトでよくある画像（料金表・メニュー・地図・施工事例）ごとの扱いがない", "画像の種類ごとに、代替テキストに書くことと、本文に書くことを表にした"],
              ["WordPressでどこに書くかがない", "メディアライブラリ・画像ブロック・埋め込みブロック・アイキャッチでの手順と、VideoObjectを足すコード"],
              ["直したかどうかの確かめ方がない", "代替テキストの抜けと、画像の中だけにある事実を見つけるコマンド"],
            ],
          },
        },
        {
          heading: "答え：AIは画像と動画から何を受け取っているか（分かっている範囲）",
          table: {
            head: ["分かっていること", "出典", "サイトでやること"],
            rows: [
              ["Googleは、画像の内容を代替テキスト・画像認識・ページの内容を合わせて理解する。代替テキストは画像の情報の中でいちばん大事、と説明している", "[Google：画像SEOのベストプラクティス](" + SRC.gImagesJa + ")（2026年3月2日更新）", "意味のある画像には、何が写っているかが分かる代替テキストを付ける"],
              ["Googleは <img> の src にある画像を見つけるが、CSSの背景画像は索引に入れない", "同上", "大事な写真を背景画像にしない"],
              ["ChatGPT・Claude・Perplexityの主なクローラーはJavaScriptを実行しない。CSSの ::before・::after の文字はテストした6つのAIのどれにも読まれなかった", "[Vercel](" + SRC.vercel + ")（2024年12月）、[Writesonic](" + SRC.writesonic + ")（2026年3月）", "後から読み込む画像ギャラリーや装飾の中に事実を置かない"],
              ["ChatGPTやPerplexityが、検索のときにページの画像の中の文字を読み取っているかどうかは、各社の説明に書かれていない", "（各社の公開情報で確認できず）", "画像の中の料金・時間・条件は、読まれない前提で本文にも書く"],
              ["Googleは、<video>・<embed>・<iframe>・<object> で置かれた動画を見つける。1本の動画を見せるのが主な目的のページ（再生ページ）を作るよう勧めている", "[Google：動画SEOのベストプラクティス](" + SRC.gVideoJa + ")", "大事な動画は、その動画のためのページを作る"],
              ["YouTubeの引用の多くはPerplexity（38.7%）とGoogleのAI Overviews（36.6%）・AI Mode（19.6%）で、ChatGPTは4.4%だった", "[OtterlyAI](" + SRC.otterly + ")（2026年3月2日、6つのAI・30日間・1億件超の引用）", "YouTubeに出す動画も、説明欄に要点を文字で書く"],
            ],
          },
          after: [
            "まとめると、どのAIにも確実に届くのは、ページの最初のHTMLに入っている文字です。画像や動画は、その文字を補うものとして考えるのが安全です。",
          ],
        },
        {
          heading: "自社サイトの画像：種類ごとに、代替テキストと本文に書くこと",
          paragraphs: [
            "すべての画像に長い代替テキストを付ける必要はありません。飾りの画像は代替テキストを空（alt=\"\"）にし、意味のある画像に、何が写っているかを短く書きます。料金や時間などAIに答えてほしい事実は、代替テキストではなく本文に書くのが基本です。",
          ],
          table: {
            head: ["画像の種類", "代替テキストに書くこと（例）", "本文にも書くこと"],
            rows: [
              ["料金表・メニュー表の画像", "「カットとカラーの料金表（税込み）」など、何の表か", "表の中身をすべて。WordPressならテーブルブロックで書く"],
              ["商品・料理の写真", "「季節の野菜のランチプレート（スープ付き）」", "名前・価格・量・アレルギーなど"],
              ["施工事例・作例の写真", "「築30年の戸建て、浴室をユニットバスに交換した後」", "工事の内容・期間・費用の目安・地域"],
              ["地図・アクセスの図", "「駅の東口から店までの道順の図」", "住所・駅からの道順・駐車場の台数と場所"],
              ["グラフ・図解", "「2025年と2026年の問い合わせ件数の比較のグラフ」", "グラフの数字を本文か表に。出典と時期も"],
              ["スタッフ・院長の写真", "「院長 山田太郎」", "名前・資格・経歴（[人物のページの作り方](/guide/person-profile-page-ai-search)）"],
              ["ロゴ", "会社名・店名", "（会社名は本文と構造化データに入っていればよい）"],
              ["飾り・背景・区切りの画像", "空にする（alt=\"\"）", "なし"],
            ],
          },
          after: [
            "代替テキストは、目の見えない方が画面読み上げで聞くための文でもあります。キーワードを並べるのではなく、写真を見ていない人に一言で伝える文にしてください。Googleも、代替テキストにキーワードを詰め込むことを悪い例として挙げています（[Google：画像SEO](" + SRC.gImagesJa + ")）。",
          ],
        },
        {
          heading: "画像で、ほかに整えること",
          list: [
            "キャプション：写真の下に一文を付けると、本文の一部として読まれます。施工事例なら「工期5日・費用は約80万円（税込み）」など、事実を入れます。",
            "ファイル名：「IMG_0023.jpg」より「bathroom-unit-after.jpg」のように、何の画像かが分かる名前にします（Googleも説明的なファイル名を勧めています）。",
            "画像の近くに説明の文章を置く：Googleは、画像の周りの文章やキャプションからも内容を読み取ると説明しています。",
            "ページの代表の画像：Googleは、og:image や構造化データの画像から、ページを代表する画像を選ぶと説明しています。ロゴや文字ばかりの画像ではなく、内容が分かる写真を設定します。",
            "形式とサイズ：Googleが対応している形式は BMP・GIF・JPEG・PNG・WebP・SVG・AVIF です。srcset や picture を使うときも、通常の src を残します。",
          ],
        },
        {
          heading: "自社サイトの動画：要約と文字起こしをページに書く",
          paragraphs: [
            "YouTubeの動画を埋め込んでも、その動画の字幕や説明欄の文字は、あなたのページのHTMLには入りません。埋め込みは iframe で、中身はYouTubeのページにあるからです。動画で伝えている事実を自社のページでも読んでほしいなら、動画の下に文字で書きます。",
          ],
          list: [
            "大事な動画（初めての方への流れ、施術・工事の説明、商品の使い方など）は、その動画のためのページを作る。Googleは、1本の動画を見せることが主な目的のページを「再生ページ」と呼び、作るよう勧めています。動画を紹介するブログ記事は再生ページには当たりません（[Google：動画SEO](" + SRC.gVideoJa + ")）。",
            "動画の下に、3〜5行の要約を書く。料金・所要時間・対象・注意点など、動画の中で言っている事実を文章にします。",
            "その下に文字起こしを載せる。YouTubeの自動字幕を元にしてもよいですが、店名・商品名・数字の聞き間違いを必ず直します。長い場合は「詳細」ブロックなどで開閉にしても、文字がHTMLに入っていれば読まれます（[JavaScriptとAIのクローラー](/guide/ai-crawlers-javascript-rendering)）。",
            "動画に料金や電話番号のテロップを出しているなら、その数字が本文にもあるか確かめる。動画の中だけの文字は、読まれない前提で考えます。",
            "VideoObject の構造化データを付ける。Googleが必須としているのは name（題名）・thumbnailUrl（サムネイル）・uploadDate（公開日）で、description・duration・embedUrl なども勧めています（[Google：動画の構造化データ](" + SRC.gVideoSdJa + ")）。YouTubeなど他社のプレーヤーを使う場合も、構造化データは勧められています。",
            "見どころの時刻（キーモーメント）を伝えたい場合は、Clip の構造化データか、YouTubeの説明欄の時刻を使う。Clip はGoogle検索のすべての言語で、YouTubeの説明欄の時刻もすべての言語で使われます。",
          ],
        },
        {
          heading: "YouTubeに出す動画：説明欄とチャプター",
          paragraphs: [
            "OtterlyAIは、ChatGPT・AI Overviews・AI Mode・Perplexity・Copilot・Gemini の6つで、30日間に集めた1億件を超える引用を調べ、YouTubeの動画が引用されるときの傾向をまとめています（[OtterlyAI：The YouTube Citation Study 2026](" + SRC.otterly + ")、2026年3月2日）。",
          ],
          table: {
            head: ["調査で分かったこと", "数字"],
            rows: [
              ["引用されたYouTubeのうち、通常の長さの動画と、ショート動画", "94%と5.7%"],
              ["引用された動画の長さ", "10〜20分が32.1%、5〜10分が26.1%、20分超が17.6%"],
              ["再生回数・登録者数と、引用の多さの相関", "どちらも r = -0.03（ほぼ関係なし）"],
              ["説明欄の長さと、引用の多さの相関", "r = 0.31（弱い〜中くらい）"],
              ["引用された動画のうち、再生回数が1,000回未満のもの", "40.83%"],
              ["時刻付きの引用が出たAI", "Googleだけ（AI Overviews 73%・AI Mode 27%）"],
            ],
          },
          after: [
            "調査した側も、相関は原因を示すものではなく、すでに引用された動画だけを調べたので「最初に引用されるかどうか」より「繰り返し引用されるか」の傾向だ、と書いています。それでも、再生回数が少ない小さな店や会社の動画でも引用されうること、説明欄の文字が手がかりになりうることは、準備の方針として使えます。",
            "説明欄には、動画で答えている質問と答えの要点、店名・地域・料金などの事実、自社サイトの該当ページのURLを書きます。チャプターを付けるときは、YouTubeの決まり（最初の時刻は 00:00、3つ以上を時刻の順に、1つのチャプターは10秒以上）に従います（[YouTubeヘルプ：動画のチャプター](" + SRC.ytChaptersJa + ")）。字幕は自動字幕のまま使わず、固有名詞と数字を直しておきます。",
          ],
        },
        {
          heading: "WordPressでの手順",
          list: [
            "代替テキスト：メディアライブラリで画像を開き、「代替テキスト」欄に書きます。画像ブロックを選んだ右側の設定にも同じ欄があります。飾りの画像は空のままにします。",
            "キャプション：画像ブロックの下の「キャプションを追加」に、事実を一文で書きます。",
            "料金表・メニュー：画像で作った表を載せている場合は、同じ内容をテーブルブロックでも書きます。画像は残してかまいません。",
            "動画：YouTubeは「埋め込み」ブロック（YouTube）で置き、その下に段落ブロックで要約、「詳細」ブロックか段落で文字起こしを書きます。",
            "アイキャッチ：投稿・固定ページに内容の分かるアイキャッチ画像を設定します。無料のプラグイン[Nurevo AEO](" + WP_ORG + ")は、アイキャッチがあれば、そのページの構造化データ（WebPage・BlogPosting）に image として入れます。WooCommerceの商品は、商品のメイン画像を入れます。",
            "VideoObject：Nurevo AEO は VideoObject を自動では出しません。動画のページに足したい場合は、次のように開発者向けのフィルター webmcp_canary_schema_graph で追加できます。Yoast SEO・Rank Math・AIOSEO・SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても、構造化データは重複しません。動画用のプラグインやSEOプラグインがすでに VideoObject を出している場合は、二重にしないでください。",
          ],
          code: PHP,
          after: [
            "題名・説明・サムネイルのURL・公開日・長さ（PT6M30S は6分30秒）は、実際の動画に合わせて書き換えます。足したら、ページのソースで VideoObject が入っていることを確かめ、Googleのリッチリザルト テストで誤りがないかを見ます。",
          ],
        },
        {
          heading: "確かめ方",
          paragraphs: [
            "パソコンの「ターミナル」で、ページの画像と文字を確かめられます。料金表やメニューなど、画像の多いページで試してください。",
          ],
          code: CHECK,
          after: [
            "「alt なし」が多いときは、メディアライブラリで代替テキストを入れます。「alt が空」は飾りの画像なら問題ありません。3で「なし」と出た事実は、画像や動画の中にしかない可能性が高いので、本文に書き足します。",
            "コマンドを使わない場合は、ページを開いて右クリックの「ページのソースを表示」で、料金や時間を Ctrl＋F（Mac は Command＋F）で探します。画像の中にしかない文字は、ここでは見つかりません。",
            "直したあとは、AIに同じ質問をして変化を見ます。1回の結果で判断せず、同じ質問を何度か、日を変えて測ってください（[AIでの登場率の測り方](/guide/measure-ai-visibility)）。Nurevo の Pro では、AIの回答に自社が出ているかを測れます（いまは Perplexity で計測、ベータ）。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "料金表・メニュー・営業時間の画像と同じ内容が、本文の文字（表）にもある",
            "意味のある画像に、何が写っているかが分かる短い代替テキストがある",
            "飾りの画像の代替テキストは空にしてある",
            "代替テキストにキーワードを並べていない",
            "施工事例・作例の写真に、事実の入ったキャプションがある",
            "大事な写真を、CSSの背景画像や後から読み込むギャラリーだけに置いていない",
            "大事な動画には、その動画のためのページがあり、要約と文字起こしが本文にある",
            "動画のテロップの料金・電話番号が、本文にもある",
            "動画のページに VideoObject（name・thumbnailUrl・uploadDate）がある",
            "YouTubeの説明欄に要点と自社ページのURLがあり、チャプターは決まりに沿っている",
          ],
        },
      ],
      faqs: [
        { q: "ChatGPTやPerplexityは、ページの画像の中の文字を読みますか？", a: "各社の公開情報には書かれておらず、分かりません。ChatGPTは送った画像を読み取れますが、検索のときにページの画像まで読むかは別の話です。料金や時間などの事実は、読まれない前提で本文にも書いてください。" },
        { q: "すべての画像に代替テキストを付けるべきですか？", a: "意味のある画像には付け、飾りの画像は空にします。全部を埋めると、画面読み上げで聞く人にとって邪魔になり、大事な画像の説明も目立たなくなります。" },
        { q: "代替テキストは何文字くらいがよいですか？", a: "決まった文字数はありません。写真を見ていない人に一言で何の写真かが伝わる長さにします。料金などの細かい事実は、代替テキストではなく本文に書きます。" },
        { q: "YouTubeに動画を出していれば、自社サイトに載せなくてもよいですか？", a: "YouTubeの動画も引用されることがありますが、そのときの出典はYouTubeのページです。自社のページを出典にしてほしいなら、自社サイトにも動画のページを作り、要約と文字起こしを書いてください。" },
        { q: "再生回数が少ない動画でも引用されますか？", a: "OtterlyAIの調査では、引用された動画の40.83%が再生回数1,000回未満でした。再生回数より、何の質問に答えている動画かが文字で分かることが大事だと考えられます。ただし、引用されることを保証するものではありません。" },
        { q: "ショート動画は作らないほうがよいですか？", a: "OtterlyAIの調査では引用の94%が通常の長さの動画でしたが、ショート動画を作る意味がないとまでは言えません。AIの引用を狙うなら、質問に答える数分以上の動画を優先し、ショートは別の目的で使うのが無理のない分け方です。" },
        { q: "VideoObject を付ければ、AIの回答に動画が出ますか？", a: "保証はできません。VideoObject はGoogleが動画を理解する手がかりで、ほかのAIがどう使うかは公開されていません。要約と文字起こしを本文に書くことのほうが、どのAIにも届きやすい準備です。" },
      ],
      relatedHeading: "あわせて読みたい",
      cta: {
        heading: "画像や動画の多いページを、AIに読める形に",
        body: "無料のチェックは登録不要です。URLを入れると、構造化データ・llms.txt・AIのクローラーの扱いを確かめられます。WordPressなら、無料のプラグインでアイキャッチ画像も含めた構造化データを出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "無料でプラグインを入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPT はOpenAIの、Claude はAnthropicの、Perplexity はPerplexity AIの、Google・Gemini・YouTube はGoogle LLCの、Microsoft Copilot はMicrosoftの商標です。WordPress はWordPress Foundationの、WooCommerce はAutomatticの商標です。その他の製品名・調査の名称は各社の商標です。Nurevoはこれらの会社と提携していません。",
    },
    en: {
      title: "Images and Video in AI Search: Alt Text and Transcripts | Nurevo",
      description: "AI search relies on the text around images and videos. Alt text, captions, body tables, video summaries and transcripts, YouTube descriptions and chapters, VideoObject.",
      h1: "Images and video in AI search: how to get alt text, captions and video transcripts read by AI",
      lead: "If you want ChatGPT, Perplexity or Google's AI features to use what your photos and videos show, the basic rule is to say it in text on the page as well. Google says it understands images through alt text, the surrounding page and computer vision together, but other AI companies do not publish how far they read the images on a page. Don't publish price lists or menus only as images, give meaningful photos alt text that says what they show, and put a summary and transcript next to each important video. In OtterlyAI's study, YouTube videos were cited most often by Perplexity and Google's AI features.",
      intro: [
        "Written 26 November 2026 (JST). It is for people who run sites heavy on photos and video, and for the agencies that build them. It includes WordPress steps and a command-line check.",
        "AI companies change their systems without notice, and AI answers vary by day and wording. These steps prepare your images and video to be read; they do not guarantee that you appear in AI answers.",
      ],
      sections: [
        {
          heading: "What the top articles cover, and what they miss",
          paragraphs: [
            "On 26 November 2026 we read four Japanese and seven English articles that rank for queries such as \"optimize images and videos for AI search\" and \"YouTube AI citations\": in Japanese, [Uravation on images](" + SRC.uravationAlt + ") (updated 5 Sep 2026), [Uravation on video](" + SRC.uravationVideo + ") (updated 5 Sep), [Ahrefs](" + SRC.ahrefsJa + ") (updated 10 Jul) and [Marke Driven](" + SRC.pamxy + ") (26 Nov); in English, [Search Engine Land](" + SRC.sel + "), [Texta](" + SRC.texta + "), [Wistia](" + SRC.wistia + ") (23 Jan), [iPullRank](" + SRC.ipullrank + ") (updated 18 Nov), [AltText.ai](" + SRC.alttext + ") (15 Jun) and [Digiday](" + SRC.digiday + ") (23 Sep), plus OtterlyAI's [original study](" + SRC.otterly + ").",
            "They broadly agree that AI reads the text around images and videos rather than \"seeing\" them, and that transcripts matter. Several things are thin or missing:",
          ],
          table: {
            head: ["What is missing", "What this guide adds"],
            rows: [
              ["Some \"x times more likely to be cited\" figures come with no method", "Only figures with a published method (Google's documentation, OtterlyAI's study of 100M+ citations), and a plain \"not known\" where nothing is published"],
              ["YouTube and on-site images and video are mixed together", "Separate steps for images on your site, video on your site, and YouTube"],
              ["No guidance for the images small business sites actually use (price lists, menus, maps, project photos)", "A table of what goes in the alt text and what goes in the body for each kind of image"],
              ["No WordPress specifics", "Steps for the Media Library, Image block, Embed block and featured image, plus code to add VideoObject"],
              ["No way to check the result", "Commands that find missing alt text and facts that exist only inside images"],
            ],
          },
        },
        {
          heading: "The answer: what AI gets from images and video (as far as is known)",
          table: {
            head: ["What is known", "Source", "What to do on your site"],
            rows: [
              ["Google understands images through alt text, computer vision and the page content together, and calls alt text the most important image metadata", "[Google: Image SEO best practices](" + SRC.gImages + ") (updated 2 Mar 2026)", "Give meaningful images alt text that says what they show"],
              ["Google finds images in the src of <img>; it does not index CSS background images", "Same page", "Don't put important photos in CSS backgrounds"],
              ["The main ChatGPT, Claude and Perplexity crawlers do not run JavaScript. Text drawn with CSS ::before/::after was read by none of six assistants tested", "[Vercel](" + SRC.vercel + ") (Dec 2024), [Writesonic](" + SRC.writesonic + ") (Mar 2026)", "Don't keep facts inside late-loading galleries or decoration"],
              ["Whether ChatGPT or Perplexity read the text inside page images when searching is not described in their documentation", "(not found in any vendor documentation)", "Assume text in images is not read; repeat prices, times and conditions in the body"],
              ["Google finds video placed with <video>, <embed>, <iframe> or <object>, and recommends a watch page whose main purpose is one video", "[Google: Video SEO best practices](" + SRC.gVideo + ")", "Give important videos a page of their own"],
              ["Most YouTube citations came from Perplexity (38.7%), Google AI Overviews (36.6%) and AI Mode (19.6%); ChatGPT accounted for 4.4%", "[OtterlyAI](" + SRC.otterly + ") (2 Mar 2026; six AI tools, 30 days, 100M+ citations)", "On YouTube too, write the key points in the description"],
            ],
          },
          after: [
            "In short, the one thing every AI tool reliably gets is the text in your page's initial HTML. Treat images and video as support for that text.",
          ],
        },
        {
          heading: "Images on your site: what goes in the alt text and what goes in the body",
          paragraphs: [
            "Not every image needs long alt text. Leave decorative images empty (alt=\"\") and give meaningful ones a short description of what they show. Facts you want AI to answer with, such as prices and hours, belong in the body text rather than the alt text.",
          ],
          table: {
            head: ["Kind of image", "Alt text (example)", "Also write in the body"],
            rows: [
              ["Price list or menu as an image", "\"Haircut and colour price list (tax included)\": what the table is", "Everything in the table. On WordPress, use a Table block"],
              ["Product or dish photos", "\"Seasonal vegetable lunch plate with soup\"", "Name, price, portion, allergens"],
              ["Project or portfolio photos", "\"30-year-old house, bathroom after replacement with a modular unit\"", "What was done, how long it took, rough cost, area"],
              ["Map or directions graphic", "\"Walking route from the station's east exit to the shop\"", "Address, directions from the station, number and location of parking spaces"],
              ["Charts and diagrams", "\"Chart comparing enquiries in 2025 and 2026\"", "The chart's numbers in text or a table, with source and period"],
              ["Staff or owner photos", "\"Dr Jane Smith, clinic director\"", "Name, qualifications, background ([person profile pages](/guide/person-profile-page-ai-search))"],
              ["Logo", "Company or shop name", "(enough if the name is in the body and structured data)"],
              ["Decorative, background or divider images", "Leave empty (alt=\"\")", "Nothing"],
            ],
          },
          after: [
            "Alt text is also what screen reader users hear. Write a sentence that tells someone who cannot see the photo what it shows, not a list of keywords. Google also lists keyword-stuffed alt text as a bad example ([Google: Image SEO](" + SRC.gImages + ")).",
          ],
        },
        {
          heading: "Other things to tidy up for images",
          list: [
            "Captions: a sentence under a photo is read as part of the page. For a project photo, include facts such as \"5 days on site, about $6,000 including tax\".",
            "File names: use names that say what the image is, such as bathroom-unit-after.jpg rather than IMG_0023.jpg (Google recommends descriptive file names too).",
            "Put explanatory text near the image: Google says it also uses captions and the text around an image.",
            "The page's main image: Google says it picks a representative image from og:image or structured data. Set a photo that shows the content, not a logo or a text-heavy graphic.",
            "Formats: Google supports BMP, GIF, JPEG, PNG, WebP, SVG and AVIF. When you use srcset or picture, keep a normal src as a fallback.",
          ],
        },
        {
          heading: "Video on your site: put a summary and transcript on the page",
          paragraphs: [
            "Embedding a YouTube video does not put its captions or description into your page's HTML. The embed is an iframe, and the content lives on YouTube's page. If you want the facts in a video to be read on your own page, write them below the video.",
          ],
          list: [
            "Give important videos (what to expect on a first visit, how a treatment or job works, how to use a product) a page of their own. Google calls a page whose main purpose is showing one video a watch page and recommends creating them; a blog post that discusses an embedded video is not a watch page ([Google: Video SEO](" + SRC.gVideo + ")).",
            "Write a three-to-five-line summary below the video: the prices, timings, who it is for and any cautions the video mentions.",
            "Add a transcript below that. You can start from YouTube's automatic captions, but always fix misheard names, product names and numbers. If it is long, you can put it in a Details block; text inside it is still in the HTML ([AI crawlers and JavaScript](/guide/ai-crawlers-javascript-rendering)).",
            "If the video shows prices or phone numbers on screen, check those numbers are in the body too. Assume on-screen text is not read.",
            "Add VideoObject structured data. Google requires name, thumbnailUrl and uploadDate, and recommends description, duration, embedUrl and others ([Google: Video structured data](" + SRC.gVideoSd + ")). It still recommends structured data when you use a third-party player such as YouTube.",
            "To point to key moments, use Clip structured data or timestamps in the YouTube description. Google supports Clip in all Search languages, and YouTube description timestamps work in all languages.",
          ],
        },
        {
          heading: "Videos on YouTube: descriptions and chapters",
          paragraphs: [
            "OtterlyAI analysed more than 100 million citations collected over 30 days across ChatGPT, AI Overviews, AI Mode, Perplexity, Copilot and Gemini, and summarised patterns in how YouTube videos are cited ([OtterlyAI: The YouTube Citation Study 2026](" + SRC.otterly + "), 2 March 2026).",
          ],
          table: {
            head: ["Finding", "Figure"],
            rows: [
              ["Share of cited YouTube items that were regular videos vs Shorts", "94% vs 5.7%"],
              ["Length of cited videos", "10-20 min 32.1%, 5-10 min 26.1%, over 20 min 17.6%"],
              ["Correlation of views and subscribers with citation frequency", "r = -0.03 for both (almost none)"],
              ["Correlation of description length with citation frequency", "r = 0.31 (weak to moderate)"],
              ["Cited videos with fewer than 1,000 views", "40.83%"],
              ["Where timestamped citations appeared", "Google only (AI Overviews 73%, AI Mode 27%)"],
            ],
          },
          after: [
            "The authors note that correlation is not causation, and that because they studied only videos already cited, the results describe repeat citation more than first selection. Even so, two working assumptions follow: small businesses' low-view videos can be cited, and description text can be a useful signal.",
            "In the description, write the question the video answers and the key points of the answer, facts such as your name, area and prices, and the URL of the matching page on your site. For chapters, follow YouTube's rules: the first timestamp is 00:00, at least three in ascending order, and each chapter at least 10 seconds long ([YouTube Help: Video chapters](" + SRC.ytChapters + ")). Don't leave automatic captions as they are; correct names and numbers.",
          ],
        },
        {
          heading: "WordPress steps",
          list: [
            "Alt text: open the image in the Media Library and fill in \"Alternative Text\". The same field appears in the Image block's sidebar settings. Leave decorative images empty.",
            "Captions: write a one-sentence fact under the image with the Image block's \"Add caption\".",
            "Price lists and menus: if you publish a table as an image, write the same content in a Table block as well. You can keep the image.",
            "Video: place YouTube with the Embed block (YouTube), then add the summary in a Paragraph block and the transcript in a Details block or paragraphs below it.",
            "Featured image: set a featured image that shows the content on posts and pages. The free [Nurevo AEO](" + WP_ORG + ") plugin adds the featured image as image in that page's structured data (WebPage or BlogPosting), and the main product image for WooCommerce products.",
            "VideoObject: Nurevo AEO does not output VideoObject on its own. To add one to a video page, use the developer filter webmcp_canary_schema_graph as below. It works alongside Yoast SEO, Rank Math, AIOSEO, SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data. If a video or SEO plugin already outputs VideoObject, don't add a second one.",
          ],
          code: PHP_EN,
          after: [
            "Change the title, description, thumbnail URL, upload date and duration (PT6M30S means 6 minutes 30 seconds) to match the real video. Then confirm VideoObject appears in the page source and check it in Google's Rich Results Test.",
          ],
        },
        {
          heading: "How to check",
          paragraphs: [
            "You can check a page's images and text from a terminal. Try it on image-heavy pages such as price lists and menus.",
          ],
          code: CHECK_EN,
          after: [
            "If many images have no alt, add alt text in the Media Library. An empty alt is fine for decorative images. Facts that step 3 reports as MISSING probably exist only inside images or video, so add them to the body.",
            "Without the command line, open the page, right-click \"View page source\" and search for your prices or hours with Ctrl+F (Command+F on Mac). Text that exists only inside an image will not be found there.",
            "After fixing, ask AI tools the same questions and watch for changes. Don't judge from one answer; repeat the same questions on different days ([how to measure AI visibility](/guide/measure-ai-visibility)). Nurevo Pro measures whether you appear in AI answers (currently on Perplexity, in beta).",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "Everything in price list, menu and opening-hours images is also in the body as text (a table)",
            "Meaningful images have short alt text that says what they show",
            "Decorative images have an empty alt",
            "Alt text is not a list of keywords",
            "Project and portfolio photos have captions with facts",
            "Important photos are not only in CSS backgrounds or late-loading galleries",
            "Important videos have their own page, with a summary and transcript in the body",
            "Prices and phone numbers shown on screen in videos are also in the body",
            "Video pages carry VideoObject (name, thumbnailUrl, uploadDate)",
            "YouTube descriptions carry the key points and your page URL, and chapters follow the rules",
          ],
        },
      ],
      faqs: [
        { q: "Do ChatGPT and Perplexity read text inside the images on a page?", a: "Their documentation does not say, so it is not known. ChatGPT can read an image you send it, but whether it reads images on pages when searching is a separate question. Assume it does not, and put prices, hours and other facts in the body." },
        { q: "Should every image have alt text?", a: "Give it to meaningful images and leave decorative ones empty. Filling every image gets in the way of screen reader users and makes the important descriptions harder to find." },
        { q: "How long should alt text be?", a: "There is no fixed length. Make it long enough to tell someone who cannot see the photo what it shows in a phrase. Put detailed facts such as prices in the body, not the alt text." },
        { q: "If my videos are on YouTube, do I need them on my site?", a: "YouTube videos can be cited, but the source shown is then YouTube's page. If you want your own page to be the source, create a video page on your site with a summary and transcript." },
        { q: "Can videos with few views be cited?", a: "In OtterlyAI's study, 40.83% of cited videos had fewer than 1,000 views. Making clear in text which question a video answers appears to matter more than views, though nothing guarantees a citation." },
        { q: "Should I stop making Shorts?", a: "In OtterlyAI's study 94% of citations went to regular-length videos, but that does not make Shorts pointless. If AI citations are the goal, prioritise videos of several minutes that answer a question, and use Shorts for other purposes." },
        { q: "Will VideoObject get my video into AI answers?", a: "That cannot be guaranteed. VideoObject helps Google understand a video; how other AI tools use it is not published. A summary and transcript in the body reach every AI tool more reliably." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Make image- and video-heavy pages readable by AI",
        body: "The free check needs no sign-up: enter a URL to see the state of its structured data, llms.txt and AI crawler access. On WordPress, the free plugin outputs structured data that includes your featured images.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Try the free plugin", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI; Claude of Anthropic; Perplexity of Perplexity AI; Google, Gemini and YouTube of Google LLC; Microsoft Copilot of Microsoft. WordPress is a trademark of the WordPress Foundation and WooCommerce of Automattic. Other product and study names are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies.",
    },
  },
};
