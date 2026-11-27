// Content page: AI search (AEO) for insurance agencies (保険代理店). Industry page.
// Angle: what AI needs to describe an agency correctly and what the agency may
// lawfully say: its standing (which insurers it represents, single or multiple
// insurers, a separate business from the insurer even under a shared brand),
// how it narrows and recommends products (the three explanation patterns in the
// FSA checklist), premium examples with their calculation conditions in the same
// sentence, the insurer's review of solicitation material (and how AEO work fits
// into it), the consultation flow, complaint contact, staff and shops. The 2025
// Insurance Business Act amendment (施行 2026-06-01) is covered as context.
// Separate from 士業 (PR #63), FP 事務所 (uravation) and person-profile-page.
//
// Written 2026-11-27 14時 (JST). Nurevo AEO facts from the plugin source (0.9.2):
// the business type field (業種（schema.org型）) takes any schema.org type name and
// publishes it for a local business; wizard card 専門サービス (ProfessionalService)
// family does not list InsuranceAgency, so the type is typed in Settings; Services
// up to 20 (WEBMCP_CANARY_MAX_SERVICES); webmcp_canary_business_node filter; the B2B
// site type accepts InsuranceAgency too. Free monthly check: three questions to
// Perplexity built from type and area, never the name. Pro measurement (beta) on
// Perplexity. Prices: Free 0, Standard 3,000 JPY / USD 20, Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-27):
// - 金融庁 20260330: 令和7年保険業法改正 内閣府令等の公布 (2026-03-30), 施行 2026-06-01.
//   Act 成立 2025-05-30 (令和7年法律第54号). 特定大規模乗合保険募集人の体制整備
//   (営業所ごとの法令等遵守責任者、統括責任者、苦情処理), 便宜供与の禁止の拡充 (保険会社等),
//   比較推奨販売の情報提供の規定の改正 was published separately on 2026-08-28 (that page
//   was NOT read). 176 comments.
// - 金融庁 20251219: 政令 公布 2025-12-19, 施行 2026-06-01; 法 公布 2025-06-06.
// - 金融庁 20251217-3: 比較説明・推奨販売に係る施行規則の改正を予定、監督指針も整備.
// - 金融庁「保険募集管理態勢の確認検査用チェックリスト」(06.pdf, no date): Ⅲ.1.⑫(ⅶ)
//   イ 比較可能な商品の概要を明示 / ロ 提示・推奨理由を分かりやすく、絞り込みは客観的な基準
//   / ハ 客観的な基準によらない場合は基準や理由 (資本関係・事務手続・経営方針を含む);
//   ⑫(ⅴ) 立場を誤解させる表示; ⑫(ⅵ) 商号の使用許諾→別の主体であること; Ⅱ.1.⑦ 募集資料の
//   事前のリーガル・チェック、代理店が作る資料も本社で集中管理; Ⅱ.2.⑤ 全ての資料の審査;
//   Ⅲ.1.⑤ 著しく優良・有利との誤解; Ⅲ.1.⑦(ⅱ) インターネットでも重要な事項の情報提供;
//   Ⅲ.1.④ 意向把握・意向確認、契約概要・注意喚起情報.
// - 金融庁 h006 (生命保険募集関係 2-2(4) 法第300条第1項第6号関係): 客観的事実に基づかない
//   事項又は数値、一部のみの表示; 他社比較は保険期間・担保内容・引受条件・保険料率等、
//   算出条件を併記.
// - Conductor (updated 2026-08-13): US, 3.6M+ insurance citations, Jan–May 2026,
//   178,000+ prompts: AI Mode 43.9%, Perplexity 33.6%, ChatGPT 11.9%, Gemini 6.9%,
//   Copilot 2.1%, Claude 1.6%; intents education 33.2%, pricing 17.6%, comparison
//   9.5%, recommendations 6.7%; AIO on 40.7% of 2.9M searches; 53.3% of AIO citations
//   outside organic top 10; product/policy pages 57.5% (carriers) and 77.8% (brokers)
//   of AIO page types.
// - Wellows (2026-08-13): 1,960 prompts, 34,238 citations; insurer-owned domains 4.6%.
// - California Ins. Code §1725.5 (public.law) and CDI notice (2022-12-22): licence
//   number on business cards, written price quotations, print ads in CA; emails from
//   2023-01-01 (SB 1242); NPN or a link to a licence list is not a substitute; websites
//   are not in the text.
// - schema-dts 2.1.0: InsuranceAgency ⊂ FinancialService ⊂ LocalBusiness;
//   FinancialService has feesAndCommissionsSpecification; Organization has knowsAbout.
// Top articles read 2026-11-27: uravation 金融・保険 (2026-07-28, upd 09-05),
// uravation FP相談 (2026-10-15); Conductor, Nationwide Agency Forward (2026-03-04,
// upd 09-15), Metricus (2026-04-15), BrightFire (2026-03-26, upd 05-14), Wellows,
// Trusted Choice (2025-12-18). PropertyCasualty360 (body not returned).
// Not verified, so not stated: the content of the 2026-08-28 比較推奨 rule, the
// article numbers for agent registration, how many people use AI to choose an
// agency in Japan, NAIC model law wording, state rules other than California, and
// whether insurers review structured data or llms.txt.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  fsaReform: "https://www.fsa.go.jp/news/r7/hoken/20260330/20260330.html",
  fsaSeirei: "https://www.fsa.go.jp/news/r7/hoken/20251219/20251219.html",
  fsaCompareDraft: "https://www.fsa.go.jp/news/r7/hoken/20251217-3/20251217-3.html",
  fsaCompare0828: "https://www.fsa.go.jp/news/r8/hoken/20260828/20260828.html",
  fsaChecklist: "https://www.fsa.go.jp/manual/manualj/hoken/06.pdf",
  fsaGuide300: "https://www.fsa.go.jp/p_fsa/guide/guidej/hoken/h006.html",
  conductor: "https://www.conductor.com/academy/2026-insurance-ai-search-benchmarks/",
  wellows: "https://wellows.com/blog/ai-visibility-for-insurance-marketing-agencies/",
  nationwide: "https://agentblog.nationwide.com/agency-growth/marketing/seo-for-insurance-agents/",
  metricus: "https://metricusapp.com/blog/insurance-agent-ai-visibility-2026/",
  brightfire: "https://www.brightfire.com/get-found-in-age-ai/",
  trustedChoice: "https://trustedchoice.independentagent.com/blog/market-like-an-ai-pro-even-if-youre-not-one/",
  uravation: "https://uravation.com/llmo/kinyu-hoken-llmo-taisaku/",
  uravationFp: "https://uravation.com/llmo/fp-jimusho-dokuritsu-llmo-taisaku/",
  ca1725: "https://california.public.law/codes/ca_ins_code_section_1725.5",
  cdiEmail: "https://www.insurance.ca.gov/0200-industry/0110-whats-new/upload/New-Law-Requires-Licensees-to-Include-Their-License-Number-on-Emails.pdf",
  gbpGuidelines: "https://support.google.com/business/answer/3038177?hl=ja",
  gbpGuidelinesEn: "https://support.google.com/business/answer/3038177?hl=en",
  insuranceAgency: "https://schema.org/InsuranceAgency",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "InsuranceAgency",
      "@id": "https://example.jp/#organization",
      "name": "例ほけん相談室（例）",
      "description": "◯◯市の保険代理店です。生命保険◯社・損害保険◯社の保険を扱う乗合代理店で、保険会社とは別の会社です。おすすめする保険の選び方と理由は「保険の選び方」のページに書いています。",
      "url": "https://example.jp/",
      "telephone": "+81-00-0000-0000",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "◯◯県",
        "addressLocality": "◯◯市",
        "streetAddress": "◯◯町1-2-3"
      },
      "openingHours": "Mo-Sa 10:00-18:00",
      "areaServed": { "@type": "City", "name": "◯◯市" },
      "knowsAbout": ["生命保険", "医療保険", "自動車保険", "火災保険"]
    },
    {
      "@type": "Service",
      "name": "生命保険・医療保険の相談",
      "serviceType": "保険の相談",
      "provider": { "@id": "https://example.jp/#organization" },
      "description": "相談は無料です。ご意向をうかがってから、扱っている保険会社の商品のうちご意向に合うものを比べてご案内します。"
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "InsuranceAgency",
      "@id": "https://example.com/#organization",
      "name": "Example Insurance Group (example)",
      "description": "Independent insurance agency in Example City. We represent 9 home and auto carriers and 4 life carriers, and we are a separate business from each of them. California license No. 0000000.",
      "url": "https://example.com/",
      "telephone": "+1-000-000-0000",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "CA",
        "addressLocality": "Example City",
        "streetAddress": "123 Example St"
      },
      "openingHours": "Mo-Fr 09:00-17:00",
      "areaServed": { "@type": "State", "name": "California" },
      "knowsAbout": ["Auto insurance", "Homeowners insurance", "Life insurance", "Commercial insurance"]
    },
    {
      "@type": "Service",
      "name": "Home and auto insurance quotes",
      "serviceType": "Insurance quote and review",
      "provider": { "@id": "https://example.com/#organization" },
      "description": "We compare quotes from the carriers we represent and explain why we recommend one. Coverage is subject to each carrier's underwriting."
    }
  ]
}`;

const PHP_JA = `// 対応エリアと扱う保険の種類を事業者のノードに足す（値は本文と同じにする）
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'City', 'name' => '◯◯市'),
        array('@type' => 'City', 'name' => '△△市'),
    );
    $node['knowsAbout'] = array('生命保険', '医療保険', '自動車保険', '火災保険');
    return $node;
}, 10, 2);`;

const PHP_EN = `// Add the service area and the lines you write to the business node (same values as the page text)
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['areaServed'] = array(
        array('@type' => 'State', 'name' => 'California'),
    );
    $node['knowsAbout'] = array('Auto insurance', 'Homeowners insurance', 'Life insurance');
    return $node;
}, 10, 2);`;

export default {
  slug: "insurance-agency-ai-search",
  targetQueries: [
    "保険代理店 AI検索対策",
    "保険代理店 ChatGPT 集客",
    "保険代理店 LLMO ホームページ 比較推奨",
    "insurance agency AI search optimization",
    "how to get an insurance agency recommended by ChatGPT",
    "insurance agency schema markup",
  ],
  related: ["person-profile-page-ai-search", "company-profile-page-ai-search", "faq-page-ai-search", "multi-location-business-ai-search", "agency-reviews-testimonials-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "保険代理店のAI検索対策：取扱保険会社・比較推奨の書き方 | Nurevo",
      description: "保険代理店のAI検索対策。取扱保険会社と代理店の立場、商品の絞り込みと推奨理由、保険料の例と条件、保険会社の審査との進め方、相談の流れを、AIに正しく読ませる手順と構造化データ・WordPressの例。",
      h1: "保険代理店のAI検索対策：取扱保険会社、比較と推奨の理由、相談の流れをAIに正しく読ませる手順",
      lead: "保険代理店のAI検索対策（AEO）で一番大事なのは、AIが「この代理店はどの保険会社の保険を扱い、どんな立場で、どう選んで勧めるのか」を答えられる事実を、サイトに文字で書くことです。具体的には、取扱保険会社の一覧、1社専属か乗合か、保険会社とは別の会社であること、商品を絞り込んで勧めるときの基準と理由、保険料の例を出すときの条件、相談の流れと苦情の窓口です。保険の説明は所属保険会社の審査を受けることが多いので、その流れの中でサイトの文言・よくある質問・構造化データを整えます。",
      intro: [
        "作成日：2026年11月27日（JST）。金融庁のページは、本文に記したリンク先で2026年11月27日に確認しました。この記事は法的な助言ではありません。表示の判断は、所属保険会社の担当部門と、必要に応じて専門家に確かめてください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがあなたの代理店の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "保険代理店でAIに聞かれること",
          paragraphs: [
            "保険の相談先をAIに聞く人は、「近くの保険ショップ」だけでなく、「どこの保険会社を扱っているか」「勧められる保険に偏りはないか」「相談しても入らなくていいか」を知りたがります。AIがこうした質問に答えるには、代理店の立場と選び方が、どこかに文字で書かれている必要があります。",
          ],
          table: {
            head: ["質問の型", "質問の例", "AIが答えに必要な事実"],
            rows: [
              ["扱う保険会社", "「◯◯市でA社とB社の医療保険を比べられる代理店は？」", "取扱保険会社の一覧（生命保険・損害保険に分けて）、扱う保険の種類"],
              ["立場", "「この保険ショップは保険会社の直営？」", "保険会社とは別の会社か、1社専属か乗合か、同じ看板の店との関係"],
              ["選び方", "「勧められる保険はどうやって決めているの？」", "商品を絞り込む基準、勧める理由の説明のしかた"],
              ["保険料", "「30代で月いくらくらい？」", "例を出す場合の算出条件（年齢・性別・保障内容・払い方）、例であることの説明"],
              ["相談", "「相談だけでもいい？何回でも無料？オンラインは？」", "相談料、相談の流れ、オンライン・訪問の可否、予約の方法"],
              ["契約後", "「事故のときや保険金の請求は手伝ってくれる？」", "契約後の手続きの窓口、受付時間、苦情の窓口"],
            ],
            caption: "質問の例は、この記事の説明のための例です。実際の質問の頻度を調べたものではありません。",
          },
          after: [
            `米国の保険分野のデータですが、[Conductor](${SRC.conductor})（2026年8月13日更新）は、2026年1〜5月にAIの回答が保険のサイトを出典にした360万件以上を調べ、きっかけの質問は「仕組みを知りたい（education）」が33.2%、「保険料（pricing）」が17.6%、「比較（comparison）」が9.5%だったとしています。Googleの検索では、AIによる概要が出典にしたページの53.3%が自然検索の上位10件の外にあり、出典のページの種類は商品・保険の説明ページが一番多かったとしています。日本の代理店にそのまま当てはまる数字ではありませんが、「仕組み」と「保険料」と「比較」の質問に答えるページが出典になりやすい、という見方の参考になります。`,
          ],
        },
        {
          heading: "上位の解説記事に足りないこと",
          paragraphs: [
            `2026年11月27日に、日本語と英語で「保険代理店 AI検索対策」「insurance agency AI search」などの上位記事を9本読みました。日本語では、[uravationの金融・保険の記事](${SRC.uravation})（2026年7月28日、9月5日更新）が、注記が落ちても誤解されない書き方を、関係する法令の一覧と一緒に説明しています。ただし、代理店の立場や取扱保険会社の書き方、商品の絞り込みの説明、保険会社の審査とどう進めるかは扱っておらず、構造化データの例とWordPressでの手順もありません。同じサイトの[FP相談の記事](${SRC.uravationFp})（2026年10月15日）は、「独立系」「無料」と資格を分けて書く考え方がくわしい一方、保険代理店の決まりには触れていません。`,
            `英語では、[Nationwideの代理店向けの記事](${SRC.nationwide})（2026年9月更新）が構造化データの型名（InsuranceAgency など）を挙げますが、例のコードはありません。[Metricus](${SRC.metricus})（2026年4月）は数字が多いものの、出どころの書き方が箇所によって食い違います。[BrightFire](${SRC.brightfire})（2026年5月更新）はllms.txtを勧めますが、ファイルの例はありません。[Wellows](${SRC.wellows})（2026年8月）は、資格のある担当者の署名や、承認の記録を残すことに触れている点が他より進んでいますが、州の決まりの具体例はありません。[Trusted Choice](${SRC.trustedChoice})（2025年12月）は、開発者なしでできる見直しの手順です。どの記事にも、取扱保険会社と立場の書き方、絞り込みと推奨の理由の書き方、保険料の例の条件、WordPressでの設定はありません。この記事は、これらを埋めます。`,
          ],
        },
        {
          heading: "2026年の制度の変化：改正保険業法の施行と、比較推奨販売の見直し",
          paragraphs: [
            `2025年5月30日に成立した改正保険業法（令和7年法律第54号）は、政令・内閣府令とあわせて2026年6月1日に施行されました。規模の大きい乗合代理店には、営業所ごとの法令等遵守責任者、本店などの統括責任者、苦情を処理する体制などが求められます。保険会社などによる、取引上の社会通念から見て相当と認められない便宜供与の禁止も広がりました。[金融庁：内閣府令等の公布（2026年3月30日）](${SRC.fsaReform})／[金融庁：政令の公布（2025年12月19日）](${SRC.fsaSeirei})`,
            `乗合代理店の比較説明・推奨販売については、保険業法施行規則と監督指針の改正が別に進められ、[2025年12月17日に案が公表](${SRC.fsaCompareDraft})され、2026年8月28日に改正の公表がありました（[金融庁のお知らせ](${SRC.fsaCompare0828})）。この記事では8月28日の改正の中身を読めていないため、細かい要件は書いていません。乗合代理店は、この改正の原文と、所属保険会社からの案内で確かめてください。`,
          ],
          after: [
            "AI検索対策の目で見ると、制度の変化は「サイトに書くべき事実」を増やします。苦情の窓口、代理店の立場、商品を勧める理由は、AIに聞かれる質問とも重なります。体制を整えたら、その事実をサイトにも同じ言葉で書くのが近道です。",
          ],
        },
        {
          heading: "まず書く：代理店の立場と取扱保険会社",
          paragraphs: [
            `金融庁の「保険募集管理態勢の確認検査用チェックリスト」は、代理店が保険会社のために契約の締結の代理・媒介をする立場を誤解させる表示をしていないか、を確認の項目にしています。他社に商号の使用を許している場合は、両者が別の主体であることなどを説明しているかも項目にあります。[金融庁：確認検査用チェックリスト](${SRC.fsaChecklist})`,
            "AIは「◯◯保険ショップ」と保険会社の名前が似ていると、直営だと答えてしまうことがあります。立場は、トップページの一行と会社概要に、次の項目を書きます。",
          ],
          table: {
            head: ["書く項目", "書き方の例"],
            rows: [
              ["代理店であること", "当社は保険代理店です。保険会社とは別の会社で、保険会社から委託を受けて保険の募集を行います"],
              ["1社専属か乗合か", "生命保険◯社・損害保険◯社の保険を扱う乗合代理店です（1社専属の場合は、その保険会社の名前と、他社の保険は扱わないこと）"],
              ["取扱保険会社の一覧", "生命保険と損害保険に分けて、会社の正式な名前で一覧にする。更新した日も書く"],
              ["代理か媒介か", "所属保険会社との契約に沿って、契約の締結の代理を行うのか、媒介を行うのかを書く（保険会社によって違う場合は会社ごとに）"],
              ["同じ看板の店", "フランチャイズなどで同じ名前の店がある場合は、それぞれが別の会社であることと、扱う保険会社の違い"],
            ],
            caption: "書き方は例です。自社の契約の内容と、所属保険会社の決まりに合わせて書いてください。",
          },
          after: [
            "取扱保険会社の数は、トップページ・会社概要・Googleビジネスプロフィール・比較サイトの掲載で同じにします。数が違うと、AIはどれが正しいか判断できません。店舗が複数ある場合は、[複数店舗のAI検索対策](/guide/multi-location-business-ai-search)もご覧ください。",
          ],
        },
        {
          heading: "比較と「おすすめ」の書き方：絞り込みの基準と推奨の理由",
          paragraphs: [
            `同じチェックリストは、2社以上の保険会社の保険を扱う代理店が比べて勧めるときに、次のことを確かめるとしています。顧客の意向に沿った比較できる商品の概要を示すこと、勧める理由を分かりやすく説明すること、代理店がさらに絞り込むときは商品の特性や保険料の水準などの客観的な基準や理由を説明すること、そして客観的な基準によらないときは、その基準や理由（特定の保険会社との資本関係や、事務手続・経営方針の理由を含む）を説明することです。[金融庁：確認検査用チェックリスト Ⅲ.1.⑫](${SRC.fsaChecklist})`,
            "これは店頭やオンラインの相談の決まりですが、サイトに「当社の保険の選び方」のページを置くと、AIにもお客様にも同じ説明を渡せます。AIに「この代理店は特定の会社を勧めがち？」と聞かれたときに答えられるのは、このページだけです。",
          ],
          table: {
            head: ["勧め方", "説明すること", "サイトでの書き方の例"],
            rows: [
              ["意向に合う商品を並べて、お客様が選ぶ", "比べられる商品の概要と、勧める理由", "「ご意向をうかがい、扱っている商品のうち条件に合うものを並べてご案内します」"],
              ["客観的な基準で絞り込む", "商品の特性や保険料の水準などの基準と理由", "「保障の内容が同じ商品の中から、保険料の安い順に3つをご案内します」のように、基準を言葉で書く"],
              ["客観的な基準によらずに絞り込む", "その基準や理由（資本関係、事務手続、経営方針など）", "「当社は◯◯保険のグループ会社のため、◯◯の保険を中心にご案内します」のように、理由をそのまま書く"],
            ],
            caption: "金融庁のチェックリスト（Ⅲ.1.⑫（ⅶ））の項目を、この記事が表にしたものです。2026年8月28日の改正の後の要件は、原文で確かめてください。",
          },
          after: [
            `保険を比べて見せるときの表示にも決まりがあります。金融庁のガイドライン（生命保険募集関係、法第300条第1項第6号関係）は、客観的な事実に基づかない事項や数値の表示や、一部だけを表示することを不適切な比較の例に挙げ、他社の商品と比べるときは、保険期間・保障の内容・引き受けの条件・保険料などを書き、算出の条件を書き添えるとしています。[金融庁：生命保険募集関係のガイドライン](${SRC.fsaGuide300})「人気ランキング」「おすすめNo.1」のような書き方は、何を基準にした順位かを書けないなら使わないほうが安全です。`,
          ],
        },
        {
          heading: "保険料の例は、条件を同じ文に書く",
          paragraphs: [
            "AIは、ページの一文だけを抜き出して答えに使うことがあります。「月々1,500円から」と書いて条件をページの下の注記に置くと、AIの答えには金額だけが残るかもしれません。保険料の例を出すなら、年齢・性別・保障の内容・保険期間・払い方を、金額と同じ文に書きます。",
          ],
          list: [
            "悪い例：「医療保険が月々1,500円から。」（条件は注記に）",
            "良い例：「◯◯生命の医療保険◯◯の場合、30歳男性・入院日額5,000円・終身払いで、月々◯◯円です（2026年◯月◯日時点の保険料。保障の内容や年齢で変わります）。」",
            "例の保険料を載せる日と、見直す日を決めておきます。保険料が改定されたのに古い金額が残っていると、AIは古い金額を答えます。",
            "「必ず安くなる」「誰でも入れる」のように、著しく有利だと誤解させる書き方はしません。チェックリストは、著しく優良・有利との誤解を与える表示になっていないかを確認の項目にしています。",
          ],
        },
        {
          heading: "保険会社の審査とAI検索対策の進め方",
          paragraphs: [
            `チェックリストは、保険会社が保険募集の資料について事前にリーガル・チェックなどを行い、代理店が作った資料も本社で集中管理するなどの方法で管理しているかを確認の項目にしています。[金融庁：確認検査用チェックリスト Ⅱ.1.⑦](${SRC.fsaChecklist}) 実務では、代理店のサイトの保険の説明も、所属保険会社の審査を受けていることが多いはずです。AI検索対策でよくある質問を足したり、説明文を書き直したりするときは、この流れに乗せます。`,
          ],
          list: [
            "直す前に分ける：代理店そのものの事実（会社名・住所・受付時間・相談の流れ・担当者・取扱保険会社の一覧）と、保険の商品の説明（保障の内容・保険料・比較）を分けます。どこまでが審査の対象かは、所属保険会社の担当部門に確かめます。",
            "よくある質問・構造化データの説明文・llms.txtの説明も、お客様やAIに読まれる文です。サイトの本文と同じ文を使い、審査を受けた文を変えずに使うのが安全です。これらが審査の対象かどうかは保険会社によって違う可能性があるので、確かめてください。",
            "商品のくわしい説明は、保険会社のページへのリンクにまかせ、代理店のページには「どんな人向けの保険を扱っているか」と「どう選ぶか」を書く、という分け方もあります。",
            "審査を受けた文には、保険会社が決めた番号などの表示を、決まりのとおりに残します。",
            "変えた日・変えた文・審査の記録を、一つの表に残します。AIの答えがいつの文を元にしているかを後から確かめるときにも役に立ちます。",
          ],
        },
        {
          heading: "相談の流れ・担当者・店舗・契約後の窓口を書く",
          paragraphs: [
            "AIに「相談だけでもいい？」と聞かれて答えられるように、相談の流れを、お客様が体験する順番で書きます。保険の募集では、お客様の意向を把握し、最後に申し込む内容が意向に合っているかを確かめることが求められ、契約概要と注意喚起情報を渡すことも決まっています（チェックリスト Ⅲ.1.④）。この流れを、そのまま相談の流れのページの見出しにすると、AIにも伝わりやすくなります。",
          ],
          list: [
            "相談料（無料の場合はそのことと、何回でも無料か）、1回の時間の目安、予約の方法、来店・オンライン・訪問のどれができるか。",
            "流れ：ご意向をうかがう → 条件に合う商品を比べてご案内 → 勧める理由のご説明 → 申し込みの内容とご意向の確認 → 契約概要・注意喚起情報のお渡し。",
            "相談しても契約しなくてよいこと、しつこい連絡をしないなどの方針（実際にしていることだけ）。",
            "担当者のプロフィール：名前、扱える保険の種類、保険の仕事の年数、持っている資格（民間の資格は、国の登録とは別のものとして書く）。書き方は[担当者プロフィールのAI検索対策](/guide/person-profile-page-ai-search)をご覧ください。",
            "契約後の窓口：住所や名義の変更、事故の連絡、保険金の請求のときにどこに連絡するか（代理店か保険会社の窓口か）、受付時間。",
            "苦情の窓口：連絡先と受付時間。",
          ],
        },
        {
          heading: "Googleビジネスプロフィールと比較サイトの掲載をそろえる",
          list: [
            `Googleビジネスプロフィールの名前は実際の店名にします。「◯◯市 保険相談 無料」のような地域名やサービス名を足すことは、ガイドラインで認められていません。[Google：ビジネス情報のガイドライン](${SRC.gbpGuidelines})`,
            "カテゴリ・受付時間・説明文の取扱保険会社の数を、サイトと同じにします。",
            "保険の比較サイトや相談の予約サイトに載っている場合は、店名・住所・取扱保険会社・相談の方法を、自社サイトと同じにします。",
            "口コミの依頼のしかたには決まりがあります。来店や契約の特典と口コミを結びつける前に、[口コミ・お客様の声とAI検索](/guide/agency-reviews-testimonials-ai-search)を読んでください。",
          ],
        },
        {
          heading: "構造化データ：InsuranceAgency＋Service",
          paragraphs: [
            `schema.orgには保険代理店のための[InsuranceAgency](${SRC.insuranceAgency})という型があり、FinancialService（金融サービス）を通じて LocalBusiness の仲間です（schema-dts 2.1.0で確認、2026年11月27日）。店舗の事実は InsuranceAgency に、相談などのサービスは Service に書きます。扱う保険の種類は knowsAbout、対応エリアは areaServed で書けます。`,
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データの説明文は、サイトの本文と同じ文にします。商品ごとの保険料は構造化データに入れず、本文で条件と一緒に説明するほうが、古い金額や条件のない金額が残る心配がありません。",
          ],
        },
        {
          heading: "WordPressの保険代理店のサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「専門サービス」を選び、設定画面の「業種（schema.org型）」に InsuranceAgency と入れます。この欄には schema.org の型の名前を入れられ、その型で出力されます。",
            "代理店名・住所・電話番号・受付時間を、Googleビジネスプロフィールと同じ表記で入れます。説明文の最初の一文に「保険代理店であること」「1社専属か乗合か」を書きます。",
            "保険の相談・自動車保険の見積もり・法人の保険の相談など、代理店が行うサービスを「サービス」に登録します（最大20件）。サービスは構造化データ（Service）とllms.txtに載ります。保険の商品そのものを並べるより、相談の種類で登録するほうが、審査とのすり合わせも少なくなります。",
            "対応エリア（areaServed）と扱う保険の種類（knowsAbout）の入力欄はないので、下の webmcp_canary_business_node フィルターで足します。値は本文と同じにします。Yoast SEOなどが有効な場合は、そのプラグインがすでに出している値が優先されます。",
            "立場・取扱保険会社・選び方・相談料・契約後の窓口の答えをよくある質問に入力し、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を相談の流れのページに置きます。文は審査を受けた本文と同じにします。書き方は[FAQページのAI検索対策](/guide/faq-page-ai-search)をご覧ください。",
            "/llms.txt を開き、会社概要・取扱保険会社・保険の選び方・相談の流れのページが載っているか確かめます。AEOスコアの画面で診断を実行し、不足を直します。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態がわかります。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "トップページと会社概要に、保険代理店であること、保険会社とは別の会社であることが書かれている。",
            "1社専属か乗合かと、取扱保険会社の一覧（生命保険・損害保険別、更新日つき）がある。",
            "取扱保険会社の数が、サイト・Googleビジネスプロフィール・比較サイトで同じ。",
            "同じ看板の店がある場合、それぞれが別の会社であることが書かれている。",
            "「保険の選び方」のページに、絞り込みの基準と勧める理由の説明のしかたが書かれている。",
            "保険料の例は、条件と時点が金額と同じ文に書かれている。ランキングやNo.1の表示は、基準を書けるものだけ。",
            "相談料・相談の流れ・相談の方法・契約しなくてよいことが書かれている。",
            "契約後の手続きの窓口と苦情の窓口が書かれている。",
            "よくある質問・構造化データ・llms.txtの文が本文と同じで、保険会社の審査の扱いを確かめてある。",
            "構造化データが InsuranceAgency＋Service で、llms.txtに主なページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているか、正しく答えているかを確かめる",
          paragraphs: [
            "整えたあとは、お客様が聞きそうな質問をAIに投げます。「◯◯市 保険相談 乗合代理店」のような地域＋サービスの質問で名前が出るかに加えて、代理店の名前を入れて「どこの保険会社を扱っている？」「保険会社の直営？」「相談だけでもいい？」と聞き、答えの事実がサイトと合っているかを見ます。間違っていたら、どのページのどの文が元になったかを探して直します。",
            "AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめ、結果を記録します。Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（代理店の名前は含めません）をPerplexityに投げ、回答に名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、競合との比較と推移を見られます（現在はPerplexity）。どちらも回答の一部を見本として調べるもので、すべての回答を見ているわけではありません。くわしくは[AIでの登場率の測り方](/guide/measure-ai-visibility)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "保険代理店のAI検索対策は、何から始めればいいですか？", a: "まず、トップページと会社概要に、保険代理店であること、1社専属か乗合か、取扱保険会社の一覧を書きます。次に、「保険の選び方」のページで、商品を絞り込む基準と勧める理由の説明のしかたを書き、相談の流れと契約後の窓口を書きます。そのうえで、同じ事実をGoogleビジネスプロフィールと構造化データ（InsuranceAgency）にそろえます。" },
        { q: "AI対策でよくある質問を増やすとき、保険会社の審査は必要ですか？", a: "保険の商品の説明を含む文は、所属保険会社の審査を受けることが多いはずです。どこまでが対象かは保険会社によって違う可能性があるので、担当部門に確かめてください。よくある質問・構造化データ・llms.txtは、審査を受けた本文と同じ文を使うのが安全です。" },
        { q: "「おすすめの保険ランキング」を載せてもいいですか？", a: "何を基準にした順位かを書けないなら、載せないほうが安全です。金融庁のガイドラインは、客観的な事実に基づかない数値の表示や、一部だけを表示する比較を不適切な例に挙げています。乗合代理店は、絞り込みの基準と勧める理由を書く形がおすすめです。" },
        { q: "1社専属の代理店でも、AI検索対策の意味はありますか？", a: "あります。AIが「この店はどこの保険会社の代理店か」「他社の保険も比べられるか」を正しく答えられるように、専属であることと、その保険会社の名前を書きます。立場がはっきりしていれば、合う質問のときに名前が挙がりやすくなる可能性があります。" },
        { q: "保険料を構造化データに入れるべきですか？", a: "おすすめしません。保険料は年齢や保障の内容で変わり、改定もあります。構造化データには代理店と相談のサービスの事実を書き、保険料の例は本文に、条件と時点と一緒に書いてください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコア、月1回の無料AIチェックは無料プランで使えます。有料プランでは、常に最新のルール（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）が加わります。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "この対策で、ChatGPTに必ず紹介されますか？", a: "いいえ。AIの回答は変わるもので、どの道具や方法でも、表示や順位は保証できません。できるのは、代理店の立場・取扱保険会社・選び方・相談の流れをAIが読みやすい形で出し、出ているか・正しいかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたの代理店のサイトをどう読んでいるか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラの許可の状態が、登録なしでわかります。WordPressなら、Nurevo AEOで保険代理店の情報・相談のサービス・よくある質問を無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、GoogleとGeminiはGoogle LLCの商標です。Conductor、Nationwide、Metricus、BrightFire、Wellows、Trusted Choice、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitは、それぞれの権利者の商標です。Nurevoはこれらの会社と提携していません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Insurance Agencies: Carriers and Licences | Nurevo",
      description: "AEO for insurance agencies: state the carriers you represent, your licence, how you recommend policies, premium examples with conditions, and how consultations work.",
      h1: "AI search for insurance agencies: getting AI to read your carriers, your licence, how you recommend and how you work correctly",
      lead: "AI search optimization (AEO) for an insurance agency comes down to writing, as text on your own site, the facts AI needs to answer one question well: which insurers does this agency represent, in what role, and how does it choose what to recommend. That means the list of carriers you are appointed with, whether you are captive or independent, that you are a separate business from those carriers, your licence number where the law asks for it, the basis on which you narrow down and recommend policies, the conditions behind any premium example, and how a consultation and a claim work. Much of what agencies publish goes through carrier or compliance review, so make these changes inside that process, then put the same facts in your Google Business Profile and structured data.",
      intro: [
        "Written November 27, 2026 (JST). We read the California statute and California Department of Insurance notice, and Japan's Financial Services Agency pages, on November 27, 2026. Insurance advertising and licensing rules differ by country and state, so check the ones that apply to you with your carriers and your compliance adviser. This article is not legal advice.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention you or rank you anywhere.",
      ],
      sections: [
        {
          heading: "What people ask AI about insurance agencies",
          paragraphs: [
            "People who ask AI for an insurance agent do not only want the closest office. They want to know which companies an agent can quote, whether the recommendation is biased toward one carrier, and whether they can ask questions without buying. AI can only answer those questions if your role and your way of choosing are written down somewhere it can read.",
          ],
          table: {
            head: ["Question type", "Example question", "Facts AI needs from you"],
            rows: [
              ["Carriers", "\"Which agents in [city] can quote both [carrier A] and [carrier B]?\"", "The carriers you represent, by line (auto, home, life, commercial)"],
              ["Role", "\"Is this agency part of the insurance company?\"", "Captive or independent, a separate business from the carriers, how branded offices relate to each other"],
              ["Recommendations", "\"How does this agent decide what to recommend?\"", "Your criteria for narrowing options and how you explain the reason"],
              ["Price", "\"Roughly how much is renters insurance here?\"", "Any example premium with its conditions (coverage, limits, deductible, driver or home details, date)"],
              ["Consultation", "\"Can I get a review without switching? Is it free?\"", "Fees, the steps of a review, phone, video or in person, how to book"],
              ["After the sale", "\"Will they help me with a claim?\"", "Who handles changes and claims (you or the carrier), hours, how to complain"],
            ],
            caption: "These are illustrative examples for this article, not measured question frequencies.",
          },
          after: [
            `[Conductor](${SRC.conductor}) (updated August 13, 2026) studied more than 3.6 million citations of insurance sites in US AI answers from January to May 2026, across more than 178,000 prompts. AI Mode accounted for 43.9% of the citations, Perplexity 33.6%, ChatGPT 11.9%, Gemini 6.9%, Copilot 2.1% and Claude 1.6%. The prompts behind the citations were mostly about understanding insurance (33.2%), price (17.6%) and comparison (9.5%). In Google's AI Overviews, 53.3% of cited pages were outside the organic top 10, and product and policy pages were the most cited page type. These figures are for insurance brands and aggregators, not small agencies, but they point the same way: pages that explain, price and compare are the ones AI cites.`,
          ],
        },
        {
          heading: "What the top guides leave out",
          paragraphs: [
            `On November 27, 2026 we read nine top results for searches such as "insurance agency AI search" and the Japanese equivalents. [Nationwide's agent article](${SRC.nationwide}) (updated September 2026) names the schema types (InsuranceAgency and others) but shows no markup. [Metricus](${SRC.metricus}) (April 2026) has many statistics, though some are attributed to different sources in different places. [BrightFire](${SRC.brightfire}) (updated May 2026) recommends an llms.txt file without showing one. [Wellows](${SRC.wellows}) (August 2026) goes further than most on compliance, suggesting a licensed author byline and archived approvals, but cites no state rules. [Trusted Choice](${SRC.trustedChoice}) (December 2025) is a do-it-yourself checklist.`,
            `In Japanese, [uravation's finance and insurance article](${SRC.uravation}) (July 2026, updated September) explains how to write sentences that stay accurate when AI drops the footnotes. None of the nine shows how to state the carriers you represent and your role, how to explain why you recommend a policy, how to keep premium examples safe, how to work AEO changes through carrier review, or how to set this up on WordPress. This article fills those gaps.`,
          ],
        },
        {
          heading: "State your role and the carriers you represent",
          paragraphs: [
            "AI easily confuses an agency with the carrier it sells for, especially when the agency carries the carrier's brand. Put your role in one sentence on the home page and in full on your About page.",
          ],
          table: {
            head: ["What to write", "Example"],
            rows: [
              ["That you are an agency", "We are an independent insurance agency. We are a separate business from the insurance companies we represent."],
              ["Captive or independent", "Captive: the one carrier you represent and that you do not quote others. Independent: how many carriers, by line."],
              ["The carrier list", "Each carrier's full legal name, grouped by line, with the date the list was last updated"],
              ["Licence", "Your agency and producer licence numbers in the states where the law asks for them (see the California example below)"],
              ["Shared brands", "If other offices use the same name, that each is a separate business and may represent different carriers"],
            ],
            caption: "Examples only. Write what matches your own appointments and contracts.",
          },
          after: [
            "Keep the number of carriers the same on your site, your Google Business Profile and any directory listings. When the numbers differ, AI cannot tell which is right. If you run several offices, see [AI search for multi-location businesses](/guide/multi-location-business-ai-search).",
          ],
        },
        {
          heading: "Licence numbers: the California example",
          paragraphs: [
            `Some states set out where a licence number must appear. California Insurance Code section 1725.5 requires licensees to print their licence number on business cards, written price quotations and print advertisements distributed in the state, in a type size at least as large as the phone number, address or fax number shown, or 12-point (8-point on business cards), whichever is larger. [California Insurance Code §1725.5](${SRC.ca1725})`,
            `Since January 1, 2023 (SB 1242), the licence number must also appear in emails that involve an activity requiring a licence, next to or on the line below the person's or organization's name. The California Department of Insurance says the National Producer Number, or a link to a licence list, does not replace the licence number. [California Department of Insurance notice](${SRC.cdiEmail})`,
          ],
          after: [
            "The statute text we read does not name websites. Even so, putting the licence number in your site footer and on your About page, in the same format as your emails, gives AI one consistent fact to repeat. Check your own state's rules before deciding what is required.",
          ],
        },
        {
          heading: "Explain how you compare and recommend",
          paragraphs: [
            `Japan offers a useful model for writing this down. The Financial Services Agency's inspection checklist asks agencies that represent two or more insurers to show an overview of comparable products that fit the customer's needs, to explain clearly why they recommend one, to explain objective criteria (such as product features or premium level) when they narrow the choice, and, when the narrowing is not objective, to explain the reason, including a capital tie to one insurer or business policy. [FSA checklist, III.1.⑫](${SRC.fsaChecklist})`,
            "Whatever your jurisdiction, a short \"How we choose a policy for you\" page lets you give AI and customers the same answer. It is the only place AI can find an answer to \"does this agent push one company?\"",
          ],
          table: {
            head: ["How you recommend", "What to explain", "Example wording"],
            rows: [
              ["Show the options that fit, the customer chooses", "An overview of the options and why you suggest them", "\"We ask about your needs, then show the quotes from our carriers that fit them.\""],
              ["Narrow by objective criteria", "The criteria and the reason", "\"Among policies with the same coverage, we show the three lowest premiums.\""],
              ["Narrow for business reasons", "The reason itself", "\"We are owned by [carrier], so we mainly offer its policies.\""],
            ],
            caption: "Our summary of the FSA checklist items (III.1.⑫(vii)). Japan published a further revision on August 28, 2026, which we have not read.",
          },
          after: [
            "Avoid \"best\" rankings and \"No. 1\" claims unless you can state what they are based on. Japan's FSA guidelines list showing figures not based on objective facts, and showing only part of a comparison, as examples of misleading comparisons, and ask that comparisons state the policy term, coverage, underwriting conditions and premium along with how the premium was calculated. [FSA guidelines on life insurance solicitation](" + SRC.fsaGuide300 + ")",
          ],
        },
        {
          heading: "Put the conditions in the same sentence as the premium",
          paragraphs: [
            "AI often lifts a single sentence from a page. If you write \"Auto insurance from $45 a month\" and put the conditions in a footnote, the AI answer may keep only the price. When you give a premium example, put the coverage, limits, deductible, the driver or property details and the date in the same sentence.",
          ],
          list: [
            "Weak: \"Renters insurance from $12 a month.\" (conditions in a footnote)",
            "Better: \"With [carrier], a renter in [ZIP] with $20,000 of personal property cover and a $500 deductible paid $12 a month as of [date]; your price depends on your details and the carrier's underwriting.\"",
            "Set a date to review every example. When rates change and the old figure stays on the page, AI repeats the old figure.",
            "Do not write \"guaranteed savings\" or \"anyone qualifies\". Japan's FSA checklist, for example, flags any display that leads customers to think a policy is far better or far more favourable than it is.",
          ],
        },
        {
          heading: "Working AEO changes through carrier and compliance review",
          paragraphs: [
            "Many carriers review the marketing their agents publish, and many agencies keep an approval record. Japan's FSA checklist, for example, asks insurers to run a legal check on solicitation material in advance and to manage material made by agents as well. Adding FAQs or rewriting descriptions for AI is new marketing copy, so plan it inside the same process.",
          ],
          list: [
            "Separate agency facts (name, address, hours, consultation steps, staff, the carrier list) from policy descriptions (coverage, premiums, comparisons). Ask your carriers which of these they need to approve.",
            "FAQs, structured data descriptions and llms.txt descriptions are also read by customers and AI. Reuse approved page text in them instead of writing new claims. Whether carriers review these files varies, so ask.",
            "Link to each carrier's own pages for detailed policy terms, and keep your pages to who you serve and how you choose.",
            "Keep any approval codes or disclosures your carriers require exactly as specified.",
            "Log the date, the changed text and the approval for each change. It also helps when you later need to work out which version an AI answer came from.",
          ],
        },
        {
          heading: "Describe the consultation, your people, your office and after-sale help",
          list: [
            "Fees (if free, say so, and whether reviews are always free), how long a meeting takes, how to book, and whether you meet by phone, video or in person.",
            "The steps: we ask about your needs, compare the options that fit, explain why we recommend one, confirm the application matches what you asked for, and give you the policy documents.",
            "That a review does not oblige anyone to buy or switch, and how you follow up (only what you actually do).",
            "Staff profiles: name, licence number where required, the lines they write, years in insurance, and any designations, shown as private designations, not as a licence. See [AI search for person profile pages](/guide/person-profile-page-ai-search).",
            "After the sale: who to contact for changes, accidents and claims (you or the carrier's claim line), and your hours.",
            "How to complain, and to whom.",
          ],
        },
        {
          heading: "Align your Google Business Profile and directory listings",
          list: [
            `Use your real business name in your Google Business Profile. Adding a city or service to the name (\"Example Insurance | Cheap Auto Insurance [City]\") is not allowed by the guidelines. [Google: Business Profile guidelines](${SRC.gbpGuidelinesEn})`,
            "Keep categories, hours and the number of carriers in your description the same as your site.",
            "If you appear on comparison or agent-finder sites, keep your name, address, carriers and consultation options the same as your site.",
            "Rules apply to asking for reviews. Before tying a reward to a review, read [reviews, testimonials and AI search](/guide/agency-reviews-testimonials-ai-search).",
          ],
        },
        {
          heading: "Structured data: InsuranceAgency plus Service",
          paragraphs: [
            `schema.org has an [InsuranceAgency](${SRC.insuranceAgency}) type, a kind of FinancialService and so of LocalBusiness (checked in schema-dts 2.1.0 on November 27, 2026). Put your office facts in InsuranceAgency and your consultations and quotes in Service. knowsAbout can list the lines you write and areaServed where you are licensed and work.`,
          ],
          code: SCHEMA_EN,
          after: [
            "Keep structured data descriptions identical to your page text. Leave premiums out of structured data and explain them in the page text with their conditions, so an old or unconditioned price is not left behind.",
          ],
        },
        {
          heading: "Setting it up on a WordPress site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working, without duplicate structured data.`,
            "In the setup wizard choose \"Professional services\", then enter InsuranceAgency in Settings under \"Business type (schema.org type)\". The field takes any schema.org type name and publishes your business as that type.",
            "Enter your agency name, address, phone and hours exactly as in your Google Business Profile. Start the description with your role: an agency, captive or independent, and your licence number where required.",
            "Add what you do as Services (up to 20): personal lines review, commercial insurance quotes, life insurance consultation. Services are published as structured data (Service) and in llms.txt. Listing consultation types rather than individual policies also keeps carrier review simpler.",
            "There are no fields for areaServed or knowsAbout. Add them with the webmcp_canary_business_node filter below, using the same values as your pages. If Yoast SEO or a similar plugin is active, values that plugin already sets take precedence.",
            "Enter answers about your role, carriers, how you recommend, fees and claim help as FAQs, and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your consultation page, using approved page text. See [AI search for FAQ pages](/guide/faq-page-ai-search).",
            "Open /llms.txt and check that your About, carriers, how-we-choose and consultation pages are listed. Run the diagnosis on the AEO score screen and fix what it finds.",
          ],
          code: PHP_EN,
          after: [
            "The same checks apply to sites not on WordPress. Enter your URL in the [free check](/check), no sign-up required, to see the state of your structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Your home and About pages say you are an agency and a separate business from the carriers.",
            "Captive or independent is stated, with the carrier list by line and an update date.",
            "The number of carriers matches across your site, Google Business Profile and directories.",
            "Licence numbers appear where your state requires them, in the same format everywhere.",
            "A \"how we choose\" page explains your criteria and how you give the reason for a recommendation.",
            "Premium examples carry their conditions and date in the same sentence; no rankings without a stated basis.",
            "Fees, the consultation steps, meeting options and \"no obligation\" are written down.",
            "Who to contact for changes, claims and complaints is written down.",
            "FAQ, structured data and llms.txt text matches the approved page text, and you have checked how your carriers treat it.",
            "Structured data uses InsuranceAgency plus Service, and llms.txt lists the main pages. [What is llms.txt?](/guide/llms-txt)",
          ],
        },
        {
          heading: "Check whether AI mentions you, and whether it is right",
          paragraphs: [
            "Once your pages are in order, ask AI what customers would ask. Check whether you are named for questions such as \"independent insurance agent in [city] for home and auto\", then ask with your name: \"Which carriers does [agency] represent?\", \"Is [agency] part of [carrier]?\", \"Can I get a free policy review?\" Compare the facts in the answers with your site. When something is wrong, find the page and sentence it came from and fix that.",
            "AI answers change between runs, so ask the same questions several times, spread over time, and keep a record. Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response. See [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
      ],
      faqs: [
        { q: "Where should an insurance agency start with AI search?", a: "First, say on your home and About pages that you are an agency, whether you are captive or independent, and which carriers you represent. Then add a page on how you choose and recommend policies, your consultation steps and who handles claims. After that, align the same facts in your Google Business Profile and structured data (InsuranceAgency)." },
        { q: "Do new FAQs for AI need carrier approval?", a: "Copy that describes policies often goes through carrier or compliance review. Which items need approval differs between carriers, so ask yours. Reusing approved page text in FAQs, structured data and llms.txt is the safest approach." },
        { q: "Can we publish a \"best insurance\" ranking?", a: "Only if you can state what the ranking is based on. Comparisons built on figures without an objective basis, or on part of the picture, are listed as misleading in Japan's FSA guidelines. Writing your criteria and the reason for each recommendation is a better approach." },
        { q: "Is AI search worth it for a captive agent?", a: "Yes. State that you are captive and name the carrier, so AI can answer \"which company is this agent with?\" and \"can they quote others?\" correctly. A clear role may make it more likely you are named for questions that fit you." },
        { q: "Should premiums go in structured data?", a: "We do not recommend it. Premiums depend on personal details and change with rate filings. Put agency and consultation facts in structured data, and give premium examples in the page text with their conditions and date." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services and FAQ structured data, llms.txt, AI crawler rules, the AEO score and the monthly free AI check are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee ChatGPT recommends us?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your role, carriers, way of recommending and consultation process easy for AI to read, and keep checking whether it is mentioned and correct." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your agency's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your agency facts, consultation services and FAQs for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google and Gemini of Google LLC. Conductor, Nationwide, Metricus, BrightFire, Wellows, Trusted Choice, Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
