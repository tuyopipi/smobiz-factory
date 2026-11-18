// Content page: AI search (AEO) for private investigation offices
// (探偵事務所・興信所). Industry page. Japan-first: the 探偵業法 rules on the
// 標識 (sign) that replaced the 届出証明書 in April 2024, the pre-contract
// explanation and contract documents, what the office will not take on, fee
// estimates, confidentiality and anonymised case studies.
//
// Written 2026-11-18 11時 (JST). Every claim about Nurevo AEO is one the
// plugin's readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.2) or its source, the same facts used in marriage-agency-ai-search
// (written the same day): wizard "Other" sets no type and "Professional
// services" sets ProfessionalService; with no type the business node is a
// LocalBusiness when address, phone or hours is filled; services (up to 20)
// are published as Service + Offer + duration PropertyValue + ReserveAction
// and an llms.txt line; FAQ block / [nurevo_faq] shortcode; per-page FAQ and
// llms.txt exclusion in the block editor panel. Monthly free check: three
// questions from business type and area (never the name) put to Perplexity.
//
// Outside facts and where they were read (all 2026-11-18):
// - 探偵業の業務の適正化に関する法律 (平成18年法律第60号), enacted text on
//   shugiin.go.jp: 第2条 definition (聞込み・尾行・張込み等の実地調査と報告;
//   報道機関の依頼で報道目的のものは除く), 第4条 届出 to the 公安委員会 per
//   営業所, 第5条 名義貸し禁止, 第6条, 第7条 written undertaking from the
//   client, 第8条1項 nine pre-contract items and 2項 eight contract-document
//   items, 第9条 (知ったら行わない／探偵業者以外に委託しない), 第10条 秘密,
//   第11条 教育. Later amendments are not shown on that page.
// - Kanagawa (updated 2024-03-15), Nagano (2024-03-18), Ibaraki (2024-07-12),
//   Osaka police pages on the amendment in force 2024-04-01: 届出証明書
//   abolished; the operator makes its own 標識 (A4, black on white), shows it
//   at the office and on its website (top page shrunk, or a "標識はこちら"
//   link to a PDF); exempt from the website duty if 常時使用する従業者 5人以下
//   (officers and sole proprietors not counted; sales and office staff
//   counted) or no website; outsourcing the site does not exempt (Nagano);
//   第8条1項2号 item became 届出をした公安委員会の名称 and the 8-digit number
//   is now 届出書の受理番号, written on the 標識 (Kanagawa). Ibaraki writes
//   主たる営業所 and the top page.
// - 国民生活センター 2016-12-15: detective firms advertising "adult-site
//   trouble resolution"; consultations 205 (FY2011) to 4,543 (FY2015);
//   firms using names like 消費生活センター, saying "警察と連携" untruthfully,
//   high cancellation fees an hour after ordering.
// - Top articles read: uravation 探偵事務所 LLMO (2026-09-04/05), Texta PI
//   GEO guide (last updated 2025-03, unsourced "100+ reviews"), ClickSlice
//   NPI AEO case study (modified 2026-05-28, self-reported 3.9%→30.6%
//   visibility with no method), seolocal.it.com AI Overviews local guide
//   (2026-09, unsourced figures), Insites (2026-01-22, generic local).
// - schema-dts 2.1.0 read 2026-11-18: no investigator/detective type;
//   ProfessionalService deprecated.
// - Google "AI features and your website" and NTA tax answer 6902 were
//   checked 2026-11-01 (not re-fetched this run).
// Not verified, so not stated: cooling-off for detective contracts, any legal
// rule on displaying the number in ads, advertising rules specific to
// detectives, statistics on how many people use AI to choose an investigator.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  law: "https://www.shugiin.go.jp/Internet/itdb_housei.nsf/html/housei/16420060608060.htm",
  kanagawa: "https://www.police.pref.kanagawa.jp/tetsuzuki/eigyokankei/tantei/mesd0175.html",
  nagano: "https://www.pref.nagano.lg.jp/police/shinsei/seian/seianki/tantei/r60401tanteikaisei.html",
  ibaraki: "https://www.pref.ibaraki.jp/kenkei/a06_shinsei/detective/r06itibukaisei.html",
  kokusen: "https://www.kokusen.go.jp/news/data/n-20161215_1.html",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
  professionalService: "https://schema.org/ProfessionalService",
  uravation: "https://uravation.com/llmo/tantei-jimusho-llmo-taisaku/",
  texta: "https://www.texta.ai/how-to-rank-business-on-ai/business-and-professional-services/private-investigation",
  clickslice: "https://www.clickslice.co.uk/case-studies/npi-aeo/",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#business",
      "name": "探偵事務所例（例）",
      "address": "◯◯県◯◯市◯◯町1-2-3 ◯◯ビル3階",
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Mo-Su 09:00-21:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "無料相談（60分・来所またはオンライン）",
      "description": "調査の可否、方法、概算の見積もりを説明します。相談だけで契約する必要はありません。",
      "category": "探偵業務（所在調査・行動調査）",
      "provider": { "@id": "https://example.jp/#business" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 60, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/consultation" },
        "result": { "@type": "Reservation", "name": "無料相談（60分・来所またはオンライン）" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.com/#business",
      "name": "Example Investigations",
      "address": "3F, 1-2-3 Example St, Example City",
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Mo-Su 09:00-21:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Free consultation (60 min, in person or online)",
      "description": "We explain whether we can take the case, how we would work and an estimated fee. No obligation to sign.",
      "category": "Private investigation (locating people, surveillance)",
      "provider": { "@id": "https://example.com/#business" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 60, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/consultation" },
        "result": { "@type": "Reservation", "name": "Free consultation (60 min, in person or online)" }
      }
    }
  ]
}`;

export default {
  slug: "detective-agency-ai-search",
  targetQueries: [
    "private investigator AI search optimization",
    "private investigator ChatGPT recommendations",
    "private investigation schema markup",
    "探偵事務所 AI検索対策",
    "探偵 ChatGPT 集客",
    "探偵事務所 LLMO 標識",
  ],
  related: ["marriage-agency-ai-search", "local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility", "aeo-for-wordpress"],
  locales: {
    ja: {
      title: "探偵事務所・興信所のAI検索対策：標識・料金・契約書面 | Nurevo",
      description: "探偵事務所のAI検索対策は、サイトの標識（届出の受理番号）、調査1件の総額の見積もり方、引き受けない依頼、契約前の書面の流れを本文に書くこと。構造化データとWordPressの手順、確かめ方も解説。",
      h1: "探偵事務所・興信所のAI検索対策：標識・料金の見積もり・引き受けない依頼・契約の流れをAIに正しく読ませる手順",
      lead: "探偵事務所のAI検索対策の中心は、依頼を考える人がAIに聞く「ちゃんと届出をしている探偵？」「浮気調査はいくらかかる？」「頼んだらどんな書類をもらえる？」「途中でやめられる？」に、自社のページの本文で答えることです。2024年4月からは、届出証明書に代わって自社で作る「標識」をサイトに掲示する義務（従業者5人以下などは免除）もでき、この標識と料金の書き方が、AIにも人にも信頼できる事務所かどうかを判断する材料になります。そのうえで同じ事実を構造化データ・llms.txt・Googleビジネスプロフィールとそろえます。",
      intro: [
        "作成日：2026年11月18日（JST）。探偵業法の条文（衆議院の制定法律ページ）、神奈川県警・長野県警・茨城県警の改正の案内、国民生活センターの注意喚起、上位の比較記事は同日に確認しました。schema.orgの型は同日に schema-dts 2.1.0 で確認。Google・国税庁のページは2026年11月1日に確認した内容です。",
        "この記事は、探偵業の届出をして調査を行う探偵事務所・興信所向けです。AIの回答は日や聞き方によって変わり、どの対策でも表示は保証できません。この記事の対策は、AIが事務所の事実を取り違えないようにし、選ばれる材料をそろえるためのものです。法的な判断が必要な点は、管轄の警察署や弁護士に確かめてください。この記事は法的な助言ではありません。",
      ],
      sections: [
        {
          heading: "依頼を考える人はAIに何を聞くか",
          paragraphs: [
            "探偵を探す人は、身近な人に相談しにくい事情を抱えていることが多く、検索窓より先にAIに相談することもあります。質問は「◯◯市で浮気調査を頼める探偵。費用の相場と、証拠は裁判に使える？」「家出した家族を探したい。警察に届けたあとでも探偵に頼める？」「怪しい探偵の見分け方は？」のように、調査の種類・地域・お金・安心が重なった形になります。",
            "Googleは、AI OverviewsやAI Modeに出るための特別な要件や専用の構造化データはなく、通常のSEOの基本、本文と一致した構造化データ、最新のビジネスプロフィールが大切だとしています。[Google：AI features and your website](" + SRC.googleAi + ")。探偵事務所でも、裏技より、依頼する前に確かめたい事実が本文にあるかどうかが土台です。",
          ],
          table: {
            head: ["質問の型", "例", "答えに必要な事実"],
            rows: [
              ["調査の種類×地域", "◯◯市で浮気調査を頼める？　県外にも行ける？", "扱う調査の種類、対応地域と遠方の扱い、相談の場所（来所・オンライン・出張）"],
              ["料金", "浮気調査はいくら？　追加でかかるお金は？", "料金の決まり方、経費の扱い、見積もりの例、支払いの時期（税込）"],
              ["届出・信頼", "ちゃんと届出している？　怪しい探偵の見分け方は？", "標識（届出をした公安委員会・受理番号）、事務所の所在地、代表者"],
              ["引き受ける範囲", "相手の住所だけ調べてもらえる？", "引き受けない依頼、依頼者に書いてもらう書面"],
              ["報告と書類", "報告書はどんな形？　契約のとき何をもらえる？", "契約前の説明の書面、契約書面、報告の方法と期限、資料の処分"],
              ["秘密・解約", "相談したことは家族にばれない？　途中でやめたら？", "秘密の扱い、連絡の方法、契約の解除のルール"],
            ],
          },
        },
        {
          heading: "上位の記事に足りない点",
          paragraphs: [
            "「探偵事務所 AI検索対策」「探偵 LLMO」「private investigator ChatGPT」で上位に出るページを日本語・英語で読みました。日本語では、探偵事務所向けのLLMOの解説が、標識のサイト掲載・料金の透明化・匿名の事例という3本柱を挙げていて、法律の要点にも触れています。[Uravation：探偵事務所のLLMO設計（2026年9月）](" + SRC.uravation + ")。英語では、探偵向けのGEOガイド（2025年3月更新）、英国の探偵会社のAEOの事例、地域ビジネス全般のAI Overviews対策の記事が上位でした。",
            "一方で、次の点はどのページにもありませんでした。法律が契約の前に書面で説明するよう定めている9項目を、サイトの本文にどう対応させるか。料金の「概算額」を出すときの見積もりの例の作り方。構造化データの具体的な形と、探偵専用の型がないことへの対処。WordPressでの設定手順。AIに出ているかを時期を分けて確かめる方法です。英語のガイドには「口コミ100件以上」のような出典のない目安があり、英国の事例は可視性が3.9%から30.6%に上がったと書く一方で、質問の数や測り方を示していません。[Texta](" + SRC.texta + ")、[ClickSlice](" + SRC.clickslice + ")。この記事では、出典を確かめられることだけを書き、足りない部分を埋めます。",
          ],
        },
        {
          heading: "標識（届出の受理番号）をサイトに載せる",
          paragraphs: [
            "2024年4月1日に改正された探偵業法が施行され、公安委員会が交付していた「探偵業届出証明書」は廃止されました。代わりに、探偵業者が自分で作った「標識」を営業所の見やすい場所と、管理するウェブサイトに掲示する義務ができています。標識はA4の白い用紙に黒い文字で作り、開始の届出をしたときの「届出書の受理番号」（以前の8桁の証明書番号の名前が変わったもの）を書きます。[神奈川県警：探偵業法の一部改正](" + SRC.kanagawa + ")",
            "サイトへの掲示は、トップページに縮小して表示するか、「標識はこちら」などのリンクからPDFなどで表示する方法が例として示されています。常時使用する従業者が5人以下の事業者と、ウェブサイトを持っていない事業者は、サイトへの掲示が免除されます。従業者に会社の役員や個人事業主本人は含まれませんが、調査員以外の営業担当や事務員は含まれます。サイトの運営を外部に任せていても免除にはなりません。[長野県警：探偵業法の一部改正](" + SRC.nagano + ")、[茨城県警](" + SRC.ibaraki + ")",
            "免除される規模の事務所でも、標識を載せておくと、AIに「届出をしている探偵か」と聞かれたときの手がかりになります。載せ方は次のようにします。",
          ],
          table: {
            head: ["書くもの", "書き方の例", "注意点"],
            rows: [
              ["標識", "トップページの下部に縮小画像、または「標識はこちら」からPDF", "画像やPDFだけだとAIが読みにくい。同じ内容を会社概要ページに文字でも書く"],
              ["届出をした公安委員会と受理番号", "◯◯県公安委員会 届出 受理番号 第◯◯◯◯◯◯◯◯号", "以前の「届出証明書番号」という書き方は改める"],
              ["営業所", "主たる営業所の所在地（建物名と階まで）、ほかの営業所", "営業所ごとに届出がある。サイト・Googleビジネスプロフィールと住所をそろえる"],
              ["商号・代表者", "株式会社◯◯（屋号 ◯◯探偵事務所）代表 ◯◯", "広告で使う屋号も届出事項。屋号と商号の関係を書く"],
            ],
          },
          after: [
            "届出の内容が変わったら変更の届出が必要で、標識の記載事項が変わる場合は標識も作り直します。サイトの標識と会社概要の文字を同じ日に直すと、古い番号や住所がAIの答えに残りにくくなります。",
          ],
        },
        {
          heading: "料金は「調査1件の総額の見積もり」で書く",
          paragraphs: [
            "探偵業法は、契約の前に「対価その他依頼者が支払うべき金銭の概算額及び支払時期」を書面で説明するよう定めています。[探偵業法 第8条（制定時の条文）](" + SRC.law + ")。サイトでも同じ考え方で、時間あたりの単価だけでなく、調査1件でいくらくらいになるかを、条件つきの例で示すと、AIも「◯円から」だけでなく条件ごとに答えやすくなります。",
            "料金を時間で計算するか、決まった時間をまとめた料金にするか、結果に応じた報酬を入れるかは事務所ごとに違います。どの形でも、次の項目を料金ページに表で書いてください。",
          ],
          table: {
            head: ["書く項目", "書き方の例", "注意点"],
            rows: [
              ["料金の決まり方", "調査員2名1時間 ◯円（税込）／◯時間のプラン ◯円（税込）", "最低の契約時間、調査員の人数の考え方"],
              ["経費", "交通費・車両費・宿泊費は実費／料金に含む", "含むか別か、上限や事前の承認の有無"],
              ["報告書", "写真つき報告書の作成費 込み／◯円", "動画やデータの受け渡しの費用"],
              ["結果に応じた報酬", "ある場合は、何を「結果」とするかの定義", "定義のない「成功報酬」は誤解のもと"],
              ["見積もりの例", "平日夜に4時間×3日、調査員2名、車両1台：合計 ◯円（税込）", "よくある依頼で2〜3通り。経費を含めた総額で"],
              ["支払いの時期", "契約時に◯割、報告後に残額", "前払いの範囲と、途中で終えたときの精算"],
            ],
          },
          after: [
            "料金は税込で書きます。国税庁は、消費者に対してあらかじめ価格を表示する場合は、媒体を問わず消費税込みの総額を表示するよう定めています。[国税庁：総額表示の義務](" + SRC.ntaTotal + ")",
            "「業界最安値」「必ず証拠が取れる」のような言い方は、根拠を示せないなら書かないでください。AIはこうした言い回しをそのまま引用することがあり、事実と違えば依頼者とのトラブルのもとになります。",
          ],
        },
        {
          heading: "扱う調査と、引き受けない依頼を書く",
          paragraphs: [
            "探偵業法の「探偵業務」は、依頼を受けて、特定の人の所在や行動についての情報を、聞込み・尾行・張込みなどの実地の調査で集めて報告する業務です。[探偵業法 第2条](" + SRC.law + ")。サイトには、浮気・不倫の調査、所在の調査（家出・人探し）、素行の調査、企業からの依頼など、自社で扱う調査をページを分けて書き、それぞれに「調べられること」「調べられないこと」「必要な情報」「期間の目安」を書きます。",
            "法律は、調査の結果を犯罪や違法な差別的取扱いなどに使わない旨の書面を依頼者から受け取ること（第7条）、結果が違法な目的に使われると知ったときは業務を行わないこと（第9条）を定めています。依頼を考える人もAIも「どこまで頼めるのか」を知りたいので、受付の方針として、引き受けない依頼の種類と、契約のときにこの書面を書いてもらうことを本文に書いておきます。",
          ],
          list: [
            "扱う調査の種類ごとのページ（調べられること・調べられないこと・期間の目安）。",
            "引き受けない依頼の方針（違法な目的・差別につながる目的と分かった依頼は受けない、など自社の基準）。",
            "契約のときに、調査結果を違法な目的に使わない旨の書面を書いてもらうこと。",
            "調査を他社に任せる場合があるか（法律上、探偵業者以外には任せられません）。",
          ],
        },
        {
          heading: "相談から報告までの流れと書面を書く",
          paragraphs: [
            "探偵業法は、契約の前に書面を渡して説明する事項（第8条第1項）と、契約したあとに渡す書面の記載事項（第8条第2項）を定めています。この項目を「ご依頼の流れ」のページの見出しにそのまま対応させると、依頼を考える人にもAIにも、何をいつ受け取れるのかが伝わります。",
          ],
          table: {
            head: ["流れ", "法律で決まっていること（要旨）", "サイトに書くこと"],
            rows: [
              ["相談・見積もり", "—", "相談の方法と時間、無料か、相談だけで終われるか"],
              ["契約の前の説明", "商号・住所、届出をした公安委員会の名称、個人情報保護法などの法令を守ること、秘密の保持、業務の内容、委託、概算額と支払時期、契約の解除、資料の処分を書面で説明", "この書面を渡して説明すること、説明にかかる時間"],
              ["依頼者の書面", "調査結果を違法な目的に使わない旨の書面を受け取る", "契約のときに書いてもらう書面があること"],
              ["契約書面", "担当者・契約日、調査の内容・期間・方法、報告の方法と期限、委託、金額と支払時期・方法、解除、資料の処分", "契約書の控えを渡すこと、電子で渡すかどうか"],
              ["調査・報告", "—", "途中経過の連絡の方法、報告書の形（写真・動画・データ）"],
              ["資料の処分", "資料の不正な利用を防ぐ措置をとる", "報告のあと資料をいつどう処分するか"],
            ],
          },
          after: [
            "第8条第1項第2号は、2024年の改正で「届出をした公安委員会の名称」になりました。[神奈川県警](" + SRC.kanagawa + ")。条文の要旨は衆議院の制定法律ページで確かめ、改正後の内容は警察の案内で補っています。書面の作り方は、管轄の警察署の案内で最新の内容を確かめてください。",
            "契約の解除のルールは、自社の契約書と同じ内容をサイトに書きます。いつまでなら費用がかからないか、調査を始めたあとはどう精算するかを、例を添えて書いてください。",
          ],
        },
        {
          heading: "秘密の守り方と、まぎらわしい名乗りを避ける",
          paragraphs: [
            "探偵業法は、業務で知った人の秘密を、正当な理由なく漏らしてはならないこと（辞めたあとも同じ）と、調査で作った文書や写真などの資料の不正な利用を防ぐ措置をとることを定めています。[探偵業法 第10条](" + SRC.law + ")。サイトには、相談の内容をどう扱うか、郵便や電話の連絡で家族に知られないための配慮（事務所名を出さない、連絡してよい時間を決めるなど、自社でしていること）を書きます。",
            "事例を載せる場合は、依頼者や調査の対象の人が特定されないよう、地域・時期・人物の特徴を変えるか、ぼかしたうえで、依頼者の同意を取ります。数字の実績を書くなら、何を数えたか・期間・件数を同じ段落に書いてください。",
            "国民生活センターは2016年、「アダルトサイトとのトラブル解決」をうたう探偵業者への相談が増えていると注意を呼びかけました。自治体の消費生活センターに似た名前を名乗る、「警察と連携している」と事実と違う説明をする、依頼の1時間後に取り消そうとしたら高額な解約料を求められた、といった例が挙がっています。[国民生活センター（2016年12月15日）](" + SRC.kokusen + ")。こうした例があるので、AIや依頼者に誤解されないよう、公的な窓口と取り違えられる名前や表現は使わず、自社が民間の探偵業者であることをはっきり書いてください。",
          ],
        },
        {
          heading: "構造化データ：探偵専用の型はない",
          paragraphs: [
            `schema.orgには、探偵事務所や調査会社のための専用の型はありません。「専門サービス」にあたる ProfessionalService は、Service と混同されるため非推奨になっています。[schema.org：ProfessionalService](${SRC.professionalService})。事務所は LocalBusiness として出し、無料相談や調査のプランを Service と Offer で紐づけます。`,
            `Nurevo AEOで無料相談をサービスに入れると、次のような形で出力されます（値は例です）。`,
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データの値はページ本文と一致させます。Offerに入るのは1つの金額だけなので、調査のプランを入れるときは代表的な料金を金額に入れ、経費や報告書の扱いはサービスの説明と本文の表に書いてください。標識や受理番号は構造化データではなく、本文（会社概要）に文字で書きます。",
          ],
        },
        {
          heading: "WordPressの探偵事務所サイトでの設定手順",
          list: [
            "[WordPress.org](" + WP_ORG + ")からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。",
            "初回の設定ウィザードで「その他」を選びます。「専門サービス」はschema.orgで非推奨の ProfessionalService になるため選びません。「その他」は業種の型を指定しない設定で、住所・電話番号・営業時間のどれかが入っていればLocalBusinessとして出力されます。",
            "事務所の名前・住所（主たる営業所）・電話番号・受付時間・説明を確認します。説明には、扱う調査の種類、対応地域、相談の方法を書きます。",
            "設定画面のサービスに、無料相談と主な調査のプランを1つずつ登録します（最大20件）。名前、時間（分）、税込の料金と通貨（JPY）、カテゴリ、予約ページのURL、説明を入れると、Service・Offer・予約の操作（ReserveAction）として出力され、llms.txtにも1行ずつ載ります。",
            "よく聞かれる質問（届出の確かめ方、料金に含まれるもの、報告書の形、秘密の扱い、契約の解除、引き受けない依頼）をFAQに入れます。FAQは、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置いたページのFAQPageに追加されます。料金ページだけの質問は、ブロックエディタのNurevo AEOパネルでそのページ専用のFAQにできます。",
            "標識（画像またはPDFと、同じ内容の文字）、料金の表と見積もりの例、ご依頼の流れ、引き受けない依頼の方針は、固定ページの本文に書きます。依頼者の事情が分かるような古い事例のページは、ブロックエディタのNurevo AEOパネルでllms.txtに載せない設定にできます。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・営業時間・サービス・FAQだけを足します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "標識がトップページか「標識はこちら」のリンクから見られ、同じ内容（公安委員会・受理番号・営業所）が会社概要に文字でも書かれている。",
            "古い「届出証明書番号」の書き方や、変わる前の住所が残っていない。",
            "扱う調査の種類ごとに、調べられること・調べられないこと・期間の目安が書かれている。",
            "料金の決まり方、経費、報告書、支払いの時期が税込で表になっていて、見積もりの例が2〜3通りある。",
            "「必ず」「業界最安値」など、根拠を示せない言い方がない。",
            "引き受けない依頼の方針と、契約のときに書いてもらう書面のことが書かれている。",
            "契約の前の説明、契約書面、報告、資料の処分までの流れが書かれている。",
            "秘密の扱いと連絡の配慮、事例の匿名化と同意が書かれている。公的な窓口と取り違えられる名前を使っていない。",
            "名前・住所・電話番号・受付時間が、サイト・構造化データ・Googleビジネスプロフィール・ポータルの掲載でそろっている。",
            "llms.txtに、料金・ご依頼の流れ・会社概要（標識）・無料相談のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、依頼を考える人が聞きそうな質問を、調査の種類・地域・予算・不安（届出、秘密、報告書）の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げて、事務所が名前やURLで出るか、料金や届出の情報が正しく書かれているか、引用元が自社サイトかポータルかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。標識や料金のページを直した月の前後で分けて記録すると、どの変更が効いたかを見やすくなります。測り方の詳細は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（事務所の名前は含めません）をPerplexityに投げ、回答に事務所の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に事務所が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "探偵事務所のAI検索対策は、何から始めればいいですか？", a: "標識（届出をした公安委員会・受理番号・営業所）をサイトに載せて会社概要にも文字で書くこと、料金の決まり方と経費を含めた見積もりの例を税込で表にすること、扱う調査と引き受けない依頼、契約の流れを本文に書くことからです。そのうえで、名前・住所・電話番号をサイト・構造化データ・Googleビジネスプロフィールでそろえます。" },
        { q: "標識はサイトに載せないといけませんか？", a: "2024年4月1日から、探偵業者は自分で作った標識を営業所とウェブサイトに掲示する義務があります。常時使用する従業者が5人以下の場合や、ウェブサイトを持たない場合はサイトへの掲示が免除されます。免除される場合でも、載せておくとAIや依頼者が届出を確かめる手がかりになります。細かい扱いは管轄の警察署で確かめてください。" },
        { q: "料金は「1時間◯円から」だけでは足りませんか？", a: "足りないことが多いです。法律は契約前に概算額と支払時期を書面で説明するよう定めています。サイトでも、調査員の人数・時間・日数・経費を含めた見積もりの例を2〜3通り書くと、AIも条件つきで答えやすくなります。" },
        { q: "事例を載せても大丈夫ですか？", a: "依頼者や調査の対象の人が特定されないよう、地域・時期・特徴を変えるかぼかし、依頼者の同意を取ってください。探偵業法は業務で知った秘密を漏らさないことを定めています。実績の数字を書く場合は、数えたもの・期間・件数を添えます。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgには探偵事務所専用の型がなく、ProfessionalServiceは非推奨です。LocalBusinessとして出し、無料相談や調査のプランをServiceとOfferで紐づけるのがおすすめです。受理番号は本文に文字で書きます。" },
        { q: "Nurevo AEOは無料で使えますか？", a: "はい。事務所の連絡先・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](" + WP_ORG + ")" },
        { q: "対策すればChatGPTに事務所が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが事務所の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが事務所のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業や、記事で触れた会社・団体と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Private Investigators: Licence, Fees, Contracts | Nurevo",
      description: "How a private investigator gets described correctly by AI search: show your registration, estimate a full case cost, state what you refuse, explain contract steps.",
      h1: "AI search for private investigators: getting your registration, fee estimates, the cases you refuse and your contract steps read correctly",
      lead: "For a private investigation office, AI search optimization mostly means answering, in the text of your own pages, what a prospective client asks an AI assistant: \"Is this investigator properly registered?\", \"How much does a surveillance case cost?\", \"What paperwork will I get?\" and \"Can I stop the job halfway?\". In Japan, since April 2024 an investigator must also display a self-made registration sign (標識) on its website unless it has five or fewer regular employees, and how you present that sign and your fees is much of what AI and people use to judge whether you can be trusted. Then keep the same facts consistent across structured data, llms.txt and your Google Business Profile.",
      intro: [
        "Written 18 November 2026 (JST). Japan's Detective Business Act (enacted text on the House of Representatives site), police guidance on the 2024 amendment (Kanagawa, Nagano, Ibaraki), the National Consumer Affairs Center warning and the top-ranking articles were read that day. schema.org types were checked that day in schema-dts 2.1.0. The Google and National Tax Agency pages reflect what we checked on 1 November 2026.",
        "This guide is written for investigation offices in Japan, where Nurevo is based; the legal sections describe Japanese rules. If you work elsewhere, the same pattern applies to whatever licence or registration your jurisdiction requires. AI answers change with the day and the wording, and nothing can guarantee you will appear. The aim is that AI does not get your facts wrong and has what it needs to recommend you. This is not legal advice; check details with your local police or a lawyer.",
      ],
      sections: [
        {
          heading: "What prospective clients ask AI",
          paragraphs: [
            "People looking for an investigator are often dealing with something they cannot easily talk about, so some ask an AI assistant before they search. Their questions combine the type of case, the area, money and trust: \"An investigator in [city] for an infidelity case. What does it usually cost, and can the evidence be used in court?\", \"My relative has gone missing. Can I hire an investigator after reporting it to the police?\", \"How do I spot a dodgy investigator?\"",
            "Google says there are no extra requirements or special structured data for AI Overviews and AI Mode: the usual SEO basics, structured data that matches the page and an up-to-date Business Profile are what matter. [Google: AI features and your website](" + SRC.googleAi + "). For an investigator, the foundation is the same: whether the facts a client wants before calling are in your page text.",
          ],
          table: {
            head: ["Question type", "Example", "Facts the answer needs"],
            rows: [
              ["Case type × area", "Can you do an infidelity case in [city]? Do you travel?", "Case types you handle, areas covered and travel terms, where consultations happen (office, online, visit)"],
              ["Fees", "How much is it? What extra costs are there?", "How fees are calculated, expenses, worked estimates, payment timing (tax included)"],
              ["Registration and trust", "Are you registered? How do I spot a bad investigator?", "Registration sign (authority and number), office address, representative"],
              ["Scope", "Can you just find someone's address for me?", "Cases you refuse, the written undertaking you ask clients to sign"],
              ["Reports and paperwork", "What does the report look like? What do I get when I sign?", "Pre-contract explanation, contract document, how and when you report, disposal of materials"],
              ["Confidentiality and cancelling", "Will my family find out? What if I stop halfway?", "How you handle confidentiality and contact, cancellation terms"],
            ],
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read the pages ranking for \"private investigator ChatGPT\", \"private investigator AI search\" and the Japanese equivalents. In Japanese, an LLMO guide for investigation offices covers three pillars, showing the registration sign online, transparent pricing and anonymised case studies, and touches on the law. [Uravation (September 2026, Japanese)](" + SRC.uravation + "). In English, the top results were a GEO guide for investigators last updated in March 2025, a UK agency's AEO case study for an investigation firm, and general local-business guides to AI Overviews.",
            "None of them showed how to map the nine items Japanese law requires you to explain in writing before a contract onto your website, how to build a worked fee estimate, what structured data to use when there is no investigator type, how to set it up in WordPress, or how to check AI visibility in a way that separates before and after a change. The English GEO guide gives unsourced rules of thumb such as \"over 100 reviews\", and the UK case study reports visibility rising from 3.9% to 30.6% without saying how many prompts were tracked or how. [Texta](" + SRC.texta + "), [ClickSlice](" + SRC.clickslice + "). This guide sticks to what we could verify and fills those gaps.",
          ],
        },
        {
          heading: "Show your registration sign on the website",
          paragraphs: [
            "The amended Detective Business Act came into force in Japan on 1 April 2024. The notification certificate the Public Safety Commission used to issue was abolished. Instead, investigators make their own sign (標識) and display it in a visible place at the office and on any website they manage. It is printed black on white A4 and carries the receipt number of the business's start notification (the old eight-digit certificate number, renamed). [Kanagawa Prefectural Police](" + SRC.kanagawa + ")",
            "On the website, the examples given are a reduced image on the top page, or a link such as \"View our sign\" that opens it as a PDF. Businesses with five or fewer regular employees, and businesses with no website, are exempt from the website duty. Company officers and sole proprietors themselves do not count as employees, but sales and office staff do, not just investigators. Having someone else run the site does not exempt you. [Nagano Prefectural Police](" + SRC.nagano + "), [Ibaraki Prefectural Police](" + SRC.ibaraki + ")",
            "Even if you are exempt, publishing the sign gives AI something concrete when it is asked whether you are registered. Present it like this:",
          ],
          table: {
            head: ["What to publish", "Example", "Notes"],
            rows: [
              ["The sign", "Small image at the foot of the top page, or a link to a PDF", "AI reads images and PDFs poorly. Repeat the same details as text on your About page"],
              ["Authority and receipt number", "Notified to [Prefecture] Public Safety Commission, receipt no. ********", "Drop the old \"certificate number\" wording"],
              ["Offices", "Main office address (building and floor), other offices", "Each office is notified separately. Keep addresses identical on site and Business Profile"],
              ["Legal name and representative", "[Company] (trading as [Name] Investigations), representative [Name]", "The trading name used in ads is part of the notification. Explain how the names relate"],
            ],
          },
          after: [
            "When notified details change you must file a change notification, and if the sign's details change you must remake the sign. Updating the sign and the About page text on the same day keeps old numbers and addresses out of AI answers.",
          ],
        },
        {
          heading: "Publish fees as an estimate for a whole case",
          paragraphs: [
            "Japan's Act requires an investigator to explain in writing, before the contract, an approximate amount of the fee and other money the client must pay, and when it is due. [Detective Business Act, Article 8 (enacted text)](" + SRC.law + "). Apply the same idea on your website: rather than an hourly rate alone, show what a typical case comes to under stated conditions, so AI can answer with conditions instead of just \"from X\".",
            "Offices differ in whether they charge by the hour, sell packages of hours or include a result-based fee. Whatever your model, put these items in a table on your fees page:",
          ],
          table: {
            head: ["Item", "Example", "Notes"],
            rows: [
              ["How fees are set", "Two investigators, per hour: X (tax incl.) / X-hour package: X (tax incl.)", "Minimum hours, how many investigators"],
              ["Expenses", "Travel, vehicle and lodging at cost / included", "Included or extra, any cap or prior approval"],
              ["Report", "Photo report included / X", "Cost of video or data hand-over"],
              ["Result-based fee", "If you have one, define what counts as a result", "An undefined \"success fee\" invites disputes"],
              ["Worked estimates", "Weekday evenings, 4 hours × 3 days, two investigators, one car: total X (tax incl.)", "Two or three common cases, expenses included"],
              ["Payment timing", "X% on signing, balance after the report", "What is paid up front and how an early stop is settled"],
            ],
          },
          after: [
            "In Japan, prices shown to consumers in advance must include consumption tax, whatever the medium. [National Tax Agency: total price display (Japanese)](" + SRC.ntaTotal + ")",
            "Avoid claims such as \"cheapest in the industry\" or \"evidence guaranteed\" unless you can back them up. AI may quote such phrases verbatim, and if they turn out to be untrue they become a source of disputes with clients.",
          ],
        },
        {
          heading: "State what you investigate, and what you won't take on",
          paragraphs: [
            "Under Japan's Act, investigation work means collecting, at a client's request, information on a specific person's whereabouts or conduct through field work such as interviews, tailing and stake-outs, and reporting the results. [Detective Business Act, Article 2](" + SRC.law + "). On your site, give each case type you handle (infidelity, locating people, background on conduct, corporate requests and so on) its own page, with what you can find out, what you cannot, what information you need and a typical duration.",
            "The Act requires you to obtain a written statement from the client that the results will not be used for crime, unlawful discrimination or other illegal acts (Article 7), and not to carry out work you know will be used for such purposes (Article 9). Clients and AI both want to know how far you will go, so state your intake policy on the page: the kinds of request you refuse, and that you ask clients to sign this statement.",
          ],
          list: [
            "A page per case type (what you can and cannot find out, typical duration).",
            "Your policy on refusing requests (for example, any request you learn is for an illegal or discriminatory purpose).",
            "That clients sign a statement, when contracting, not to use the results for illegal purposes.",
            "Whether you ever subcontract work (under the Act, only to other registered investigators).",
          ],
        },
        {
          heading: "Explain the steps from enquiry to report, and the documents",
          paragraphs: [
            "Japan's Act sets out what must be explained in writing before a contract (Article 8(1)) and what the contract document handed over afterwards must contain (Article 8(2)). Using those items as the headings of your \"How it works\" page tells clients and AI what they will receive, and when.",
          ],
          table: {
            head: ["Step", "What the law requires (summary)", "What to write on your site"],
            rows: [
              ["Enquiry and estimate", "—", "How consultations work, length, whether free, and that a consultation alone is fine"],
              ["Pre-contract explanation", "Written explanation of: name and address, the Public Safety Commission notified, compliance with the Personal Information Protection Act and other laws, confidentiality, services offered, subcontracting, approximate fees and timing, cancellation, disposal of materials", "That you explain using this document, and how long it takes"],
              ["Client's statement", "Obtain a written statement that results won't be used illegally", "That clients sign this when contracting"],
              ["Contract document", "Person who handled the contract and date, scope, period and methods, how and when results are reported, subcontracting, amount and payment terms, cancellation, disposal of materials", "That clients get a copy, and whether it can be electronic"],
              ["Investigation and report", "—", "How you give progress updates, report format (photos, video, data)"],
              ["Disposal of materials", "Take measures to prevent misuse of materials", "When and how you dispose of materials after reporting"],
            ],
          },
          after: [
            "Item 2 of Article 8(1) became \"the name of the Public Safety Commission notified\" in the 2024 amendment. [Kanagawa Prefectural Police](" + SRC.kanagawa + "). We summarised the enacted text from the House of Representatives site and filled in the amendment from police guidance; check your local police guidance for how to prepare the documents today.",
            "Write your cancellation terms on the site exactly as they are in your contract: until when cancelling costs nothing, and how fees are settled once work has started, with an example.",
          ],
        },
        {
          heading: "Confidentiality, and names that could mislead",
          paragraphs: [
            "Japan's Act forbids disclosing secrets learned in the work without good reason, even after leaving the job, and requires measures against misuse of documents, photos and other materials produced in an investigation. [Detective Business Act, Article 10](" + SRC.law + "). On your site, say how you handle what clients tell you and what you do so that letters or calls do not reveal the matter to family (for example, not using the office name, agreeing on contact times), describing only what you actually do.",
            "For case studies, change or blur the area, timing and personal details so neither the client nor the person investigated can be identified, and get the client's consent. If you publish figures, state what was counted, the period and the number of cases in the same paragraph.",
            "In 2016 Japan's National Consumer Affairs Center warned about a rise in complaints involving investigators advertising help with adult-website billing disputes. Examples included firms using names similar to local consumer centres, falsely claiming to work with the police, and charging high cancellation fees to a client who tried to cancel an hour after ordering. [National Consumer Affairs Center, 15 December 2016 (Japanese)](" + SRC.kokusen + "). With that history, avoid any name or wording that could be mistaken for a public office, and make clear that you are a private investigation business.",
          ],
        },
        {
          heading: "Structured data: there is no investigator type",
          paragraphs: [
            `schema.org has no type for private investigators or investigation firms. ProfessionalService "was deprecated due to confusion with Service". [schema.org: ProfessionalService](${SRC.professionalService}). Publish the office as a LocalBusiness and link your free consultation and case plans as Service with Offer.`,
            `When you add a free consultation as a service in Nurevo AEO, it is published like this (values are examples):`,
          ],
          code: SCHEMA_EN,
          after: [
            "Keep structured data identical to the page text. An Offer carries a single price, so for a case plan use a representative fee and put expenses and report terms in the service description and your fee table. Put your registration number in the page text (the About page), not in structured data.",
          ],
        },
        {
          heading: "Setting it up on a WordPress site",
          list: [
            "Install and activate Nurevo AEO (free) from [WordPress.org](" + WP_ORG + "). It works alongside Yoast SEO, Rank Math, All in One SEO and Slim SEO; from 0.9.1 it also works with SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "In the setup wizard, choose \"Other\". Don't choose \"Professional services\", which sets the deprecated ProfessionalService type. \"Other\" sets no business type; if any of address, phone or hours is filled in, the business is published as a LocalBusiness.",
            "Check the office name, address (main office), phone, opening hours and description. In the description, state the case types you handle, the areas you cover and how consultations work.",
            "Under Services, add the free consultation and your main case plans, one each (up to 20). With a name, duration in minutes, price including tax and currency, category, booking URL and description, each is published as Service, Offer and a ReserveAction, and gets its own line in llms.txt.",
            "Add the questions people ask (how to check your registration, what fees include, what the report looks like, confidentiality, cancellation, cases you refuse) as FAQs. FAQs are added to the FAQPage of any page with the Nurevo FAQ block (or the [nurevo_faq] shortcode). Questions only for the fees page can be made page-specific in the Nurevo AEO panel in the block editor.",
            "Put the registration sign (image or PDF plus the same details as text), the fee table and worked estimates, the steps and your intake policy in the body of regular pages. Old case-study pages that could reveal a client's situation can be left out of llms.txt from the Nurevo AEO panel in the block editor.",
            "Run the check on the AEO score screen and apply the one-click fixes. To see how your site looks from outside, use the [free AI readability check](/check).",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not output a second set of structured data; it adds only the address, phone, hours, services and FAQs the SEO plugin's graph is missing. See [How to add local business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Pre-publication checklist",
          list: [
            "The registration sign is visible on the top page or through a link, and the same details (authority, number, offices) appear as text on the About page.",
            "No old \"certificate number\" wording or outdated addresses remain.",
            "Each case type has what you can find out, what you cannot and a typical duration.",
            "How fees are set, expenses, report costs and payment timing are in a table including tax, with two or three worked estimates.",
            "No unsupported claims such as \"guaranteed\" or \"cheapest in the industry\".",
            "Your intake policy and the client's written statement are described.",
            "The steps from pre-contract explanation to contract document, report and disposal of materials are described.",
            "Confidentiality and contact arrangements are explained; case studies are anonymised with consent; no name could be mistaken for a public office.",
            "Name, address, phone and hours match across your site, structured data, Google Business Profile and directory listings.",
            "llms.txt lists your fees, how-it-works, About (registration) and free consultation pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, write five to ten questions a prospective client would ask, combining case type, area, budget and concerns (registration, confidentiality, reports). Put them to ChatGPT and Perplexity and record whether your office appears by name or URL, whether fees and registration details are right, and whether the cited source is your site or a directory. AI answers vary from one run to the next, so repeat the same questions at intervals. Recording before and after the month you changed your sign or fees page makes it easier to see which change helped. See [How to measure AI visibility](/guide/measure-ai-visibility/) for the method.",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your office's name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta, showing how often AI answers include you, compared with competitors and over time (currently measured on Perplexity). Both look at samples of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a private investigator start with AI search?", a: "Publish your registration (authority, number, offices) on the site and as text on your About page, put how fees are set and worked estimates including expenses and tax in a table, and describe the cases you handle, the ones you refuse and your contract steps. Then make your name, address and phone identical across your site, structured data and Google Business Profile." },
        { q: "Do we have to show the registration sign on our website?", a: "In Japan, since 1 April 2024 investigators must display a self-made sign at the office and on their website. Businesses with five or fewer regular employees, or no website, are exempt from the website part. Even if exempt, publishing it helps AI and clients confirm your registration. Check the details with your local police." },
        { q: "Is \"from X per hour\" enough on the fees page?", a: "Usually not. Japanese law requires an approximate amount and payment timing to be explained in writing before a contract. On your site, two or three worked estimates covering investigators, hours, days and expenses let AI answer with conditions." },
        { q: "Can we publish case studies?", a: "Yes, if neither the client nor the person investigated can be identified: change or blur the area, timing and details, and get the client's consent. The Act forbids disclosing secrets learned in the work. Give what was counted, the period and the number of cases with any figures." },
        { q: "Which structured data type should an investigator use?", a: "schema.org has no investigator type, and ProfessionalService is deprecated. Publish the office as a LocalBusiness and link your free consultation and case plans as Service with Offer. Put your registration number in the page text." },
        { q: "Is Nurevo AEO free?", a: "Yes. Structured data for your contact details, hours, services and FAQ, plus llms.txt, AI crawler rules and the AEO score, are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](" + WP_ORG + ")" },
        { q: "Will this guarantee our office appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your office's website",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them, or with any company or organisation mentioned in this guide. This is not legal advice.",
    },
  },
};
