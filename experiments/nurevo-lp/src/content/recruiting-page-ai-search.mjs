// Content page: AI search (AEO) for a company's own recruiting / careers pages
// (採用ページ・求人ページ). Applies to every industry: what job seekers ask AI
// about an employer and an opening, which facts to publish, the Japanese
// job-ad rules that also bind text written for AI, JobPosting structured data,
// and how to run it on WordPress with Nurevo AEO.
//
// Written 2026-11-14 (JST). Every claim about Nurevo AEO comes from the
// plugin's readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.1), docs/developers.md and nurevo-webmcp.php:
// - Nurevo publishes no JobPosting of its own. The generated llms.txt lists the
//   30 most recently modified published pages and posts (post types "page" and
//   "post" only, so a custom "job" post type is not listed), and a page can be
//   left out with the editor setting "このページをllms.txtに載せない"
//   (_nurevo_exclude_llms).
// - Per-page FAQ ("このページのよくある質問", _nurevo_faq) is published as
//   FAQPage on that page only, where the Nurevo FAQ block or
//   [nurevo_faq source="post"] is placed.
// - The filter webmcp_canary_schema_graph lets a developer add nodes to
//   $bundle['extra'] and read $bundle['org_id'] (the business node's @id).
//
// Outside facts, checked on 2026-11-14 on the pages linked in the copy:
// - Google JobPosting docs (last updated 2026-09-08 UTC): required datePosted,
//   description, hiringOrganization, jobLocation, title (jobLocation may be
//   replaced by applicantLocationRequirements for fully remote jobs);
//   recommended applicantLocationRequirements, baseSalary, directApply,
//   employmentType, identifier, jobLocationType, validThrough; no markup on
//   list pages; baseSalary is the actual salary from the employer, not an
//   estimate; expired jobs: validThrough in the past, 404/410, or remove the
//   markup, and failing to act "may result in a manual action"; Indexing API
//   recommended over sitemaps for job URLs. Which countries the job feature
//   covers was NOT verified, so it is not stated.
// - Google Search Central blog, 2021-07-13: directApply added; editorial
//   content policy for job postings from 2021-10-01.
// - MHLW: 2022 amendment of the Employment Security Act in force 2022-10-01,
//   making accurate display of job information mandatory; Hiroshima Labour
//   Bureau leaflet: employers must not show false or misleading information and
//   must keep it accurate and current, e.g. by updating their recruiting
//   website promptly when hiring ends or terms change; examples of false
//   display (another company's name, "正社員" that is part-time, higher wages
//   than real).
// - MHLW: from 2024-04-01, three items added to what must be shown when
//   recruiting: scope of changes to duties, scope of changes to place of work,
//   and the criteria for renewing fixed-term contracts (incl. caps).
// - TaTap survey (October 2026, n=334 workers and students aged 20-49; 247
//   generative-AI users): 18.6% would drop or deprioritise an employer whose AI
//   information is missing or wrong; 40.5% re-check official site or SNS. Vendor
//   survey with a small sample: say so in the copy.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleJob: "https://developers.google.com/search/docs/data-types/job-posting",
  googleJobBlog: "https://developers.google.com/search/blog/2021/07/job-posting-updates",
  mhlw2022: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000172497_00003.html",
  mhlwLeaflet: "https://jsite.mhlw.go.jp/hiroshima-roudoukyoku/content/contents/002425600.pdf",
  mhlw2024: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/haken-shoukai/r0604anteisokukaisei1.html",
  tatap: "https://tatap.jp/knowledge/recruitment-llmo-ai-search/",
};

export default {
  slug: "recruiting-page-ai-search",
  targetQueries: [
    "careers page AI search optimization",
    "JobPosting schema ChatGPT",
    "how to make job postings visible in AI search",
    "採用ページ AI検索対策",
    "求人 構造化データ JobPosting 書き方",
    "採用 LLMO ChatGPT 会社 出てこない",
  ],
  related: ["local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility", "appear-in-chatgpt", "what-is-aeo"],
  locales: {
    ja: {
      title: "採用ページのAI検索対策：求人情報をAIに正しく読ませる手順 | Nurevo",
      description: "採用ページのAI検索対策は、給与・勤務地・働き方・選考の流れを求人ごとのページに文字で書き、JobPostingと募集終了の処理をそろえること。職業安定法の注意点とWordPressの手順も解説。",
      h1: "採用ページのAI検索対策：給与・勤務地・働き方・選考をAIに正しく読ませる手順",
      lead: "採用ページのAI検索対策の中心は、求職者がAIに聞く「この会社の年収はいくらか」「リモートで働けるか、転勤はあるか」「未経験でも応募できるか」「選考は何回で、どれくらいかかるか」に、求人ごとのページで条件まで書いて答えることです。そのうえで、同じ事実をJobPostingの構造化データ・会社情報ページ・求人媒体とそろえ、募集が終わった求人はすぐに閉じます。日本では求人情報を正確・最新に保つことが法律で義務になっており、AI向けに書く文章も例外ではありません。",
      intro: [
        "作成日：2026年11月14日（JST）。GoogleのJobPostingのドキュメント、厚生労働省の職業安定法の改正に関するページ、引用した調査は同日に確認しました。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが自社の求人の事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・応募が増えることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "求職者はAIに何を聞くか",
          paragraphs: [
            "就職や転職の情報収集にAIを使う人は、求人サイトで検索するときより長い、条件の入った質問をします。たとえば「〇〇市でリモート週3日以上のWebデザイナーの求人」「株式会社〇〇の営業職の年収と残業」「未経験から応募できる施工管理の会社」「〇〇社の選考は何回？期間は？」といった形です。",
            "AIがこうした質問に会社名を挙げたり、正しく答えたりするには、その条件が文字で読める場所に書かれている必要があります。採用ページが「アットホームな職場です」「詳しくは面接で」のような文章と写真だけで、給与や勤務地が求人媒体にしか書かれていないと、AIは古い媒体の情報や口コミサイトをもとに答えることになります。",
            `民間の調査（TaTap社、2026年10月、20〜49歳の会社員・学生334人）では、生成AIを使っている247人のうち18.6%が、AIで調べた企業の情報がない・誤っている場合に、その企業を候補から外したり優先度を下げたりすると答え、40.5%が公式サイトやSNSで確かめ直すと答えています。[調査の記事](${SRC.tatap})。一事業者による小さな調査ですが、AIで見た内容を公式サイトで確かめる人が少なくないことは、採用ページに正確な事実を置く理由になります。`,
          ],
        },
        {
          heading: "採用ページに書いておきたい事実と、書き方",
          paragraphs: [
            "上位の記事の多くは「採用の情報を充実させる」「FAQを用意する」で終わっていますが、AIが答えに使えるかは、条件をどこまで具体的に書くかで決まります。求人ごとのページに、次の項目を文字で書いてください。",
          ],
          table: {
            head: ["事実", "ページ本文での書き方", "注意点"],
            rows: [
              ["職種名", "社内の呼び名ではなく、求職者が検索する一般的な職種名（例：「フロントエンドエンジニア」）", "「〇〇クリエイター」のような独自の名前だけにしない"],
              ["仕事の内容", "担当する業務、使う道具や技術、1日の流れ、配属先", "入社後に変わりうる範囲も書く（下の法律の項を参照）"],
              ["給与", "月給・年収の範囲、賞与・手当の有無、固定残業代を含むかとその内訳", "実際より高く見える書き方をしない。範囲の根拠（経験による等）を添える"],
              ["勤務地", "住所（市区町村まで以上）、最寄り駅、転勤の有無", "「全国」だけにせず、実際の事業所と変更の範囲を書く"],
              ["働き方", "勤務時間、休日、リモートワークの可否と条件（週何日、出社日）", "「リモート可」だけだと、フルリモートと読まれることがある"],
              ["雇用形態と契約", "正社員・契約社員・パートなどの区別、契約期間、更新の基準", "雇用形態は実態と同じ言葉で"],
              ["応募の条件", "必須の経験・資格、歓迎する経験、未経験の可否", "年齢や性別の条件は、法律で認められた場合を除いて書かない"],
              ["選考の流れ", "書類・面接の回数、オンラインか対面か、結果が出るまでの目安", "目安が変わったら更新する"],
              ["応募の方法", "応募フォームのURL、必要な書類、問い合わせ先", "求人媒体経由だけの場合も、どこから応募できるかを書く"],
              ["掲載日・募集の期限", "掲載日、更新日、募集を締め切る日（決まっていれば）", "締め切ったら、ページとJobPostingの両方を閉じる"],
            ],
            caption: "表は、求職者がAIに聞きやすい条件と、上位の記事で抜けていた項目をもとにしています。",
          },
          after: [
            "会社全体の事実（社名、所在地、事業内容、従業員数、設立年）は会社概要ページに書き、求人ページからリンクします。会社概要・採用ページ・求人媒体・Googleビジネスプロフィールで、社名や所在地の表記をそろえてください。表記が食い違うと、AIが別の会社と取り違えたり、古い値を答えたりする原因になります。",
          ],
        },
        {
          heading: "法律の確認：求人情報は「正確・最新」が義務",
          paragraphs: [
            `日本では、2022年10月1日に施行された改正職業安定法で、求人等に関する情報の的確な表示が義務になりました。[厚生労働省：令和4年職業安定法の改正について](${SRC.mhlw2022})。厚生労働省（広島労働局）のリーフレットでは、求人企業に対して、虚偽の表示や誤解を生じさせる表示をしないこと、募集を終了したときや内容が変わったときは採用ウェブサイトを速やかに更新するなどして、求人情報を正確・最新の内容に保つことが求められています。虚偽の表示の例として、実際と別の会社名での掲載、「正社員」とうたいながら実際はアルバイト・パートの求人、実際より高い賃金の表示が挙げられています。[リーフレット（PDF）](${SRC.mhlwLeaflet})`,
            `また2024年4月1日からは、募集のときに明示する事項に「従事すべき業務の変更の範囲」「就業の場所の変更の範囲」「有期労働契約を更新する場合の基準（通算契約期間または更新回数の上限を含む）」が加わりました。[厚生労働省：募集時等に明示すべき事項が追加されます](${SRC.mhlw2024})`,
          ],
          list: [
            "AIに読ませるためのFAQや構造化データでも、本文と違う給与や条件を書かない。",
            "「最大年収〇〇万円」のように例外的な値だけを目立たせない。範囲と条件を一緒に書く。",
            "募集を締め切った求人を、ページ・構造化データ・llms.txtに残さない。",
            "業務や勤務地の変更の範囲を、本文の募集要項に書く。",
          ],
          after: [
            "個別の判断に迷うときは、厚生労働省の資料や管轄の労働局・ハローワークで確認してください。",
          ],
        },
        {
          heading: "構造化データ：JobPostingの必須・推奨プロパティ",
          paragraphs: [
            `JobPostingは、求人を表すschema.orgの型です。Googleのドキュメント（2026年9月8日更新）では、Google検索の求人の機能に使われる構造化データとして、次のプロパティが挙げられています。[Google：求人情報（JobPosting）の構造化データ](${SRC.googleJob})`,
          ],
          table: {
            head: ["プロパティ", "区分", "書き方のポイント"],
            rows: [
              ["title", "必須", "職種名だけを入れる（勤務地や給与、記号を混ぜない）"],
              ["description", "必須", "仕事内容・条件など、ページに書いた募集要項の本文"],
              ["datePosted", "必須", "掲載日。実際の日付を入れる"],
              ["hiringOrganization", "必須", "採用する会社（会社概要と同じ社名）"],
              ["jobLocation", "必須", "勤務地の住所。フルリモートの求人は、applicantLocationRequirementsで代えられる"],
              ["validThrough", "推奨", "募集の期限。過ぎたら求人は閉じたものとして扱われる"],
              ["baseSalary", "推奨", "雇用主が示す実際の基本給（推定値は不可）。範囲はminValue・maxValue、単位はMONTH・YEARなど"],
              ["employmentType", "推奨", "FULL_TIME・PART_TIME・CONTRACTORなど"],
              ["jobLocationType・applicantLocationRequirements", "推奨", "完全在宅の求人はTELECOMMUTEとし、応募できる国を1つ以上指定する"],
              ["directApply", "推奨", "そのページから、余計な手順なしに応募できるか"],
              ["identifier", "推奨", "社内の求人番号など"],
            ],
          },
          after: [
            `Googleは、求人の一覧ページにはJobPostingを付けず、求職者が読める求人の詳細ページに付けるよう案内しています。募集が終わった求人は、validThroughを過去の日付にする、ページを削除して404か410を返す、JobPostingを外す、のいずれかで閉じます。期限切れの求人を放置すると、手動による対策（ペナルティ）の対象になりうると明記されています。また求人のURLの更新は、サイトマップよりIndexing APIでの通知が勧められています。2021年にはdirectApplyの追加と、求人ページの編集方針（邪魔な表示や広告の多いページなど）が発表されました。[Google検索セントラル ブログ（2021年7月）](${SRC.googleJobBlog})`,
            "JobPostingはGoogle検索の求人の機能のための構造化データです。ChatGPTやPerplexityがJobPostingをどう使うかは、公開されている資料では確認できませんでした。どのAIに対しても確実に効くのは、同じ事実がページ本文に文字で書かれていることです。構造化データは本文の内容と一致させてください。",
          ],
        },
        {
          heading: "WordPressの採用ページでの設定手順",
          list: [
            "求人は1件につき1ページにします。採用トップ（一覧）と、求人ごとの詳細ページを分け、一覧から詳細へリンクします。",
            "JobPostingは、求人用のプラグインかテーマの機能、または詳細ページに書いたJSON-LDで出します。リッチリザルトテストで、必須プロパティの不足とエラーがないか確かめます。JobPostingを付けるのは詳細ページだけにします。",
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）を入れると、会社（Organization）の名前・住所・電話番号・説明を構造化データとllms.txtに出せます。Nurevo AEOはJobPostingを自動では出しません。開発者は、Nurevoのフィルタ（webmcp_canary_schema_graph）で求人ページにだけJobPostingを足し、hiringOrganizationに会社のノードを指定することもできます。`,
            "llms.txtは、固定ページと投稿のうち更新日の新しい30件を自動で載せます。求人をカスタム投稿タイプで作っている場合は自動の一覧に入らないので、採用トップと募集要項を固定ページにするか、開発者向けのフィルタで行を足します。募集を締め切ったページは、編集画面の「このページをllms.txtに載せない」で外せます。",
            "採用ページの編集画面の「このページのよくある質問」に、選考の回数、リモートの条件、未経験の可否などの質問を入れ、Nurevo FAQブロックを置きます。そのページだけのFAQPageとして出力されます。答えは募集要項と同じ内容にします。",
            "AIクローラ設定で、ChatGPT（OAI-SearchBot・ChatGPT-User）やPerplexity（PerplexityBot・Perplexity-User）など、AI検索のクローラが採用ページを読めることを確認します。ログインが必要なページや、robots.txtで止めたページは読まれません。",
            "外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
          after: [
            "Yoast SEO・Rank Math・All in One SEO・Slim SEOと一緒に使う場合、Nurevo AEOは2つ目の会社のノードを出さず、足りない値だけを既存の構造化データに足します。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "求人ごとに詳細ページがあり、職種名・仕事内容・給与・勤務地・働き方・雇用形態・応募条件・選考の流れ・応募方法が文字で書かれている。",
            "給与は範囲と条件つきで、固定残業代を含む場合はその内訳がある。",
            "業務と勤務地の変更の範囲、有期契約なら更新の基準が書かれている。",
            "リモートワークの条件（週何日、対象の職種）が具体的に書かれている。",
            "JobPostingは詳細ページだけにあり、必須プロパティがそろい、本文と値が一致している。",
            "締め切った求人は、ページ・JobPosting・llms.txtから外れている。",
            "会社概要・採用ページ・求人媒体・Googleビジネスプロフィールで社名・所在地がそろっている。",
            "採用ページがログインなしで読め、robots.txtでAI検索のクローラを止めていない。",
            "llms.txtに採用トップ（と募集中の求人）が載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、求職者が聞きそうな質問を5〜10個つくり、ChatGPTやPerplexityに投げます。質問は「社名＋条件」（例：「株式会社〇〇の営業職の年収は？」）と、社名を含まない「地域＋職種＋条件」（例：「〇〇市 リモート可 経理 求人」）の両方を用意します。前者では答えの事実が正しいか、後者では社名やページが出るかを記録します。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、1回の結果で判断しないようにします。古い給与や締め切った求人が答えに出る場合は、自社のページと求人媒体のどちらに古い情報が残っているかを探して直します。測り方の詳細は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（社名は含めません）をPerplexityに投げ、回答に会社の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも事業の質問に対する計測で、求人の質問を専用に測る機能ではありません。採用の質問は、上の手順で手作業でも記録してください。",
          ],
        },
      ],
      faqs: [
        { q: "採用ページのAI検索対策は、何から始めればいいですか？", a: "求人ごとに詳細ページをつくり、給与・勤務地・働き方・雇用形態・選考の流れを文字で書くことからです。次に、会社概要や求人媒体と社名・所在地をそろえ、締め切った求人を閉じる運用を決めます。JobPostingの構造化データはその後で十分です。" },
        { q: "JobPostingを付ければ、ChatGPTに求人が出ますか？", a: "そうとは限りません。JobPostingはGoogle検索の求人の機能のための構造化データで、ChatGPTやPerplexityがどう使うかは公開資料では確認できませんでした。どのAIにも効くのは、同じ事実がページ本文に書かれていることです。" },
        { q: "求人の一覧ページにもJobPostingを付けてよいですか？", a: "Googleは、一覧ページには付けず、求人ごとの詳細ページに付けるよう案内しています。一覧ページには各詳細ページへのリンクを置きます。" },
        { q: "募集を締め切った求人ページは、どうすればいいですか？", a: "validThroughを過去の日付にする、ページを削除して404か410を返す、JobPostingを外す、のいずれかで閉じます。日本では募集を終了したら採用サイトを速やかに更新することも求められています。llms.txtからも外してください。" },
        { q: "給与は書かずに「面談で決定」としてもいいですか？", a: "書くかどうかは会社の判断ですが、給与が書かれていないと、AIは求人媒体や口コミサイトの値をもとに答えることがあります。書く場合は、実際より高く見える書き方を避け、範囲と条件を一緒に書いてください。JobPostingのbaseSalaryは、推定値ではなく雇用主が示す実際の値にします。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。会社の構造化データ、ページごとのFAQ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。JobPostingは自動では出さないため、求人用のプラグインやJSON-LDと組み合わせます。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればAIに自社の求人が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが求人の事実を正しく読める状態をつくり、出ているか・正しいかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが自社サイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで会社情報・FAQ・llms.txtを無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Careers Pages: Get AI to Read Your Jobs Right | Nurevo",
      description: "AEO for careers pages: publish pay, location, remote rules and hiring steps as text on one page per job, match your JobPosting markup, and close filled roles fast.",
      h1: "AI search for careers pages: how to get AI to read your pay, location, working pattern and hiring process correctly",
      lead: "AI search optimization for a careers page comes down to answering, on one page per job and with the conditions spelled out, the questions candidates now ask AI: what does this company pay, can I work remotely and will I be relocated, can I apply without experience, and how many interviews are there and how long does it take. Then you publish the same facts consistently in JobPosting structured data, on your company page and on the job boards you use, and you close filled roles promptly. In Japan, keeping job information accurate and current is a legal duty, and text written for AI is no exception.",
      intro: [
        "Written November 14, 2026 (JST). Google's JobPosting documentation, the Japanese Ministry of Health, Labour and Welfare pages on the Employment Security Act and the survey cited were checked that day. The legal examples come from Japan; check the rules where you hire.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your job facts readable to AI. They do not guarantee that an AI will mention your openings or that applications will rise.",
      ],
      sections: [
        {
          heading: "What candidates ask AI",
          paragraphs: [
            "People who research jobs with AI ask longer questions, with more conditions, than they type into a job board. For example: \"web designer jobs in [city] with at least three remote days a week\", \"what does [company] pay its sales staff, and how much overtime is there?\", \"construction site manager roles open to people with no experience\", \"how many interview rounds does [company] have, and how long does it take?\"",
            "For an AI to name your company in an answer like that, or to answer correctly about you, the conditions have to be written somewhere it can read them as text. If your careers page is a few lines about a friendly team plus photos, and pay and location appear only on job boards, AI will answer from old board listings or review sites instead.",
            `A survey by TaTap, a Japanese company (October 2026, 334 workers and students aged 20 to 49), found that of the 247 who use generative AI, 18.6% would drop an employer or move it down their list when the information AI gave them about it was missing or wrong, and 40.5% would check the official site or social accounts again. [Survey article (Japanese)](${SRC.tatap}). It is one vendor's small survey, but it suggests many people check what AI tells them against your own site, which is a reason to keep exact facts there.`,
          ],
        },
        {
          heading: "The facts to publish, and how to write them",
          paragraphs: [
            "Most top-ranking articles stop at \"add more hiring content\" and \"write an FAQ\". What decides whether AI can use your page is how concretely you write the conditions. Put these on each job's own page, as text:",
          ],
          table: {
            head: ["Fact", "How to write it on the page", "Watch out for"],
            rows: [
              ["Job title", "The common title candidates search for (for example, \"front-end engineer\"), not an internal name", "Do not rely on a made-up title such as \"digital experience creator\" alone"],
              ["What the work is", "Main tasks, tools and technologies, a typical day, the team", "Also state how far the duties may change after hiring (see the legal section)"],
              ["Pay", "Monthly or annual range, bonuses and allowances, whether fixed overtime pay is included and how much", "Do not make pay look higher than it is; say what the range depends on"],
              ["Location", "Address (at least the city), nearest station, whether relocation can happen", "Do not stop at \"nationwide\": list the real sites and the scope of changes"],
              ["Working pattern", "Hours, days off, whether remote work is allowed and on what terms (days a week, office days)", "\"Remote OK\" alone is often read as fully remote"],
              ["Contract type", "Permanent, fixed-term or part-time; contract length; renewal criteria", "Use the words that match the actual contract"],
              ["Requirements", "Required experience and qualifications, nice-to-haves, whether beginners can apply", "Leave out age or gender conditions unless the law allows them"],
              ["Hiring process", "Number of screening and interview rounds, online or in person, how long until a decision", "Update it when the timing changes"],
              ["How to apply", "Application form URL, documents needed, contact", "If you hire only through boards, say where to apply"],
              ["Posted and closing dates", "Date posted, date updated, closing date if there is one", "When a role closes, close both the page and its JobPosting"],
            ],
            caption: "The list is based on the conditions candidates ask AI about, and the items the top-ranking articles left out.",
          },
          after: [
            "Keep company-wide facts (legal name, address, what you do, headcount, year founded) on your company page and link to it from each job. Use the same name and address on the company page, careers pages, job boards and your Google Business Profile. When they differ, AI can confuse you with another company or repeat an old value.",
          ],
        },
        {
          heading: "The legal side: job information must be accurate and current",
          paragraphs: [
            `In Japan, the amended Employment Security Act, in force since October 1, 2022, made accurate display of job information mandatory. [MHLW: the 2022 amendment (Japanese)](${SRC.mhlw2022}). A leaflet from the ministry's Hiroshima Labour Bureau tells employers not to show false or misleading information, and to keep job information accurate and up to date, for example by updating their recruiting website promptly when hiring ends or the terms change. Its examples of false information include listing a job under a company other than the one hiring, calling a part-time job a permanent full-time one, and showing higher wages than the job pays. [Leaflet (PDF, Japanese)](${SRC.mhlwLeaflet})`,
            `Since April 1, 2024, employers in Japan must also state, when recruiting, the scope of possible changes to the duties, the scope of possible changes to the place of work, and, for fixed-term contracts, the criteria for renewal (including any cap on total length or number of renewals). [MHLW: items added to what must be shown when recruiting (Japanese)](${SRC.mhlw2024})`,
          ],
          list: [
            "Do not put pay or conditions in an FAQ or in structured data that differ from the job page.",
            "Do not headline an exceptional figure such as \"up to ¥10 million\" on its own; give the range and the conditions together.",
            "Remove closed roles from the page, the structured data and llms.txt.",
            "State the scope of changes to duties and location in the job description itself.",
          ],
          after: [
            "When you are unsure about a specific case, check the ministry's materials or ask your local labour bureau or public employment office (or the equivalent authority where you hire).",
          ],
        },
        {
          heading: "Structured data: required and recommended JobPosting properties",
          paragraphs: [
            `JobPosting is the schema.org type for a job opening. Google's documentation (updated September 8, 2026) lists these properties for the structured data its job features use. [Google: Job posting (JobPosting) structured data](${SRC.googleJob})`,
          ],
          table: {
            head: ["Property", "Status", "How to fill it in"],
            rows: [
              ["title", "Required", "The job title only (no location, pay or symbols mixed in)"],
              ["description", "Required", "The job description you show on the page: duties, conditions and so on"],
              ["datePosted", "Required", "The real date the job was posted"],
              ["hiringOrganization", "Required", "The company that is hiring (the same name as on your company page)"],
              ["jobLocation", "Required", "The workplace address. For fully remote jobs, applicantLocationRequirements can take its place"],
              ["validThrough", "Recommended", "The closing date. After it passes, the job is treated as closed"],
              ["baseSalary", "Recommended", "The actual base pay as provided by the employer, not an estimate. Use minValue and maxValue for a range and a unit such as MONTH or YEAR"],
              ["employmentType", "Recommended", "FULL_TIME, PART_TIME, CONTRACTOR and so on"],
              ["jobLocationType and applicantLocationRequirements", "Recommended", "For work-from-home jobs, use TELECOMMUTE and name at least one country where applicants can be"],
              ["directApply", "Recommended", "Whether candidates can apply on that page without unnecessary extra steps"],
              ["identifier", "Recommended", "Your internal requisition number, for example"],
            ],
          },
          after: [
            `Google asks you not to add JobPosting to pages that list jobs, only to each job's own page that candidates can read. To close a filled role, set validThrough to a past date, delete the page so it returns 404 or 410, or remove the JobPosting markup. Google states that not acting on expired jobs in time may result in a manual action. For job URLs it recommends notifying it through the Indexing API rather than relying on sitemaps alone. In 2021 Google added directApply and introduced an editorial content policy for job pages (covering things such as obstructive content and excessive ads). [Google Search Central blog, July 2021](${SRC.googleJobBlog})`,
            "JobPosting is markup for Google Search's job features. We found no public documentation on how ChatGPT or Perplexity use it. What works for every AI is having the same facts written as text on the page. Keep your structured data identical to what the page says.",
          ],
        },
        {
          heading: "Setting it up on a WordPress careers site",
          list: [
            "Give each job its own page. Keep a careers overview (the list) separate from the job pages, and link from the list to each job.",
            "Publish JobPosting with a jobs plugin or your theme, or as JSON-LD written on each job page. Run the Rich Results Test to check for missing required properties and errors. Add JobPosting to the job pages only.",
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) to publish your company (Organization) name, address, phone and description in structured data and llms.txt. Nurevo AEO does not publish JobPosting by itself. A developer can use Nurevo's filter (webmcp_canary_schema_graph) to add a JobPosting to job pages only, with hiringOrganization pointing at the company node.`,
            "The generated llms.txt lists your 30 most recently updated pages and posts. If your jobs are a custom post type, they are not in that automatic list, so make the careers overview and open roles regular pages, or add lines with the developer filter. To drop a closed role, tick \"Leave this page out of llms.txt\" on its edit screen.",
            "On the careers page's edit screen, add questions under \"Questions and answers for this page\" (number of interviews, remote terms, whether beginners can apply) and place the Nurevo FAQ block. They are published as an FAQPage on that page only. Keep the answers identical to the job description.",
            "In the AI crawler settings, check that AI search crawlers such as ChatGPT's (OAI-SearchBot, ChatGPT-User) and Perplexity's (PerplexityBot, Perplexity-User) can read your careers pages. Pages behind a login or blocked in robots.txt are not read.",
            "See how your site looks from outside with the [free AI readability check](/check).",
          ],
          after: [
            "Alongside Yoast SEO, Rank Math, All in One SEO or Slim SEO, Nurevo AEO does not publish a second company node; it adds only the missing values to their structured data. From 0.9.1 it also works with SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data. See [adding business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Every job has its own page with title, duties, pay, location, working pattern, contract type, requirements, hiring process and how to apply, written as text.",
            "Pay is a range with conditions, and any fixed overtime pay is broken out.",
            "The scope of changes to duties and location, and renewal criteria for fixed-term roles, are stated.",
            "Remote terms (days a week, which roles) are spelled out.",
            "JobPosting is on job pages only, has every required property and matches the page.",
            "Closed roles are gone from the page, the JobPosting markup and llms.txt.",
            "Company name and address match across the company page, careers pages, job boards and Google Business Profile.",
            "Careers pages can be read without logging in, and robots.txt does not block AI search crawlers.",
            "llms.txt lists the careers overview (and the open roles). [What llms.txt is](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the pages are in shape, write 5 to 10 questions a candidate might ask and put them to ChatGPT and Perplexity. Use both kinds: your name plus a condition (\"what does [company] pay sales staff?\") and, without your name, area plus role plus condition (\"remote-friendly accounting jobs in [city]\"). For the first kind, record whether the facts are right; for the second, whether your company or page appears.",
            "AI answers change from one run to the next, so ask the same questions several times over a few weeks rather than judging one result. If an old salary or a closed role shows up, find where the old information lives, your pages or a job board, and fix it there. See [how to measure AI visibility](/guide/measure-ai-visibility) for the method in detail.",
            "On the Free and Standard plans, Nurevo AEO puts three questions built from your business type and area (never your company name) to Perplexity once a month and records whether the answers named your business or cited your site. The Pro plan (from USD 99/month) adds beta AI visibility tracking, showing how often you appear alongside competitors and over time (currently measured on Perplexity). Both measure questions about your business, not job-specific questions, so track hiring questions by hand with the steps above.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a careers page start with AI search?", a: "Give each job its own page and write pay, location, working pattern, contract type and hiring process as text. Then match your company name and address with your company page and job boards, and decide how you will close filled roles. JobPosting markup can come after that." },
        { q: "If I add JobPosting, will my jobs show up in ChatGPT?", a: "Not necessarily. JobPosting is markup for Google Search's job features, and we found no public documentation on how ChatGPT or Perplexity use it. What helps with every AI is having the same facts written on the page." },
        { q: "Can I add JobPosting to my job listing page?", a: "Google asks you not to. Add it to each job's own page and link to those pages from the list." },
        { q: "What should I do with the page of a role that has closed?", a: "Set validThrough to a past date, delete the page so it returns 404 or 410, or remove the JobPosting markup. In Japan, employers are also expected to update their recruiting site promptly when hiring ends. Take the page out of llms.txt too." },
        { q: "Can I leave pay out and say \"to be discussed\"?", a: "That is your call, but without pay on your page, AI may answer from job boards or review sites. If you publish it, avoid making it look higher than it is and give the range with its conditions. In JobPosting, baseSalary must be the actual figure from the employer, not an estimate." },
        { q: "Is Nurevo AEO free?", a: `Yes. Company structured data, per-page FAQ, llms.txt, AI crawler settings and the AEO score are on the free plan. Paid plans add an always-current ruleset (Standard, USD 20/month) and beta AI visibility tracking (Pro, from USD 99/month). It does not publish JobPosting by itself, so pair it with a jobs plugin or your own JSON-LD. [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee our jobs appear in AI answers?", a: "No. AI answers vary, and no tool or method can guarantee that you appear or rank. What you can do is make your job facts readable to AI and keep checking whether you appear and whether the facts are right." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your site",
        body: "The free check needs no sign-up and shows the state of your structured data, llms.txt and AI crawler access. On WordPress, Nurevo AEO sets up company details, FAQ and llms.txt for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies. This article is not legal advice.",
    },
  },
};
