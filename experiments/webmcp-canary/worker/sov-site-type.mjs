/**
 * AI-visibility questions for an online shop (ec) and a B2B / SaaS /
 * professional-services site (b2b), in every language the measurement asks
 * in (SOV_LANGUAGES).
 *
 * A local business is asked "近くの◯◯でおすすめは？"; nobody looks for an
 * online shop or a payroll tool by neighbourhood. These ask what a buyer asks
 * instead:
 *   ec   「{カテゴリ}のおすすめ通販サイト」「{カテゴリ} おすすめ ブランド」...
 *   b2b  「{業務}におすすめの{ツール/サービス}」「{カテゴリ}を比較」...
 *
 * Discovery questions never contain the business name (that would measure the
 * question, not the site - see buildQuestionSet in aeo-sov.mjs). Terms that
 * contain the name are dropped before a question is built.
 */
import { normalizeSiteType } from "./site-types.mjs";

/** Category labels a shop uses for "no category". Never asked about. */
const UNCATEGORIZED = /^(uncategori[sz]ed|未分類|未分类|未分類|미분류|sin categoría|non classé|nicht kategorisiert|sem categoria|senza categoria|general|other|その他)$/i;

/** A schema.org enum ("OnlineStore") is not a word a buyer types. */
const isSchemaEnum = (value) => {
  const text = String(value || "");
  return (/^[A-Z][A-Za-z]+$/.test(text) && /[a-z][A-Z]/.test(text)) || ["Organization", "Corporation", "Store", "Service"].includes(text);
};

const fold = (value) => String(value || "").normalize("NFKC").toLowerCase().replace(/[\s　・·.\-_]+/g, "");

/** Drop a term that names the business (or that it is contained in). */
function unbranded(term, aliases = []) {
  const value = String(term || "").trim();
  if (!value) return "";
  const folded = fold(value);
  if (!folded) return "";
  return aliases.some((alias) => {
    const a = fold(alias);
    return a.length >= 2 && (folded.includes(a) || a.includes(folded));
  }) ? "" : value;
}

/** The most frequent value in a list, first seen wins a tie. */
function mostFrequent(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  let best = "";
  let bestCount = 0;
  for (const [value, count] of counts) if (count > bestCount) { best = value; bestCount = count; }
  return best;
}

/**
 * The words a typed site's questions are built from.
 *
 *   ec   category  the shop's most common product category, else the owner's
 *                  business label.
 *   b2b  category  the owner's business label ("勤怠管理システム"), else the
 *                  most common service category.
 *        task      the most common service category, else the category.
 *        software  true when any entered service is software (tool vs service).
 *
 * Everything comes from what the owner entered or the catalogue; an empty
 * result means the language's neutral fallback is used.
 */
export function typedQuestionTerms({ siteType, businessType = "", catalog = null, aliases = [] } = {}) {
  const type = normalizeSiteType(siteType);
  const label = isSchemaEnum(businessType) ? "" : unbranded(businessType, aliases);
  if (type === "ec") {
    const categories = (Array.isArray(catalog?.products) ? catalog.products : [])
      .flatMap((p) => (Array.isArray(p?.categories) ? p.categories : []))
      .map((c) => unbranded(String(c || "").trim(), aliases))
      .filter((c) => c && !UNCATEGORIZED.test(c));
    return { category: mostFrequent(categories) || label };
  }
  if (type === "b2b") {
    const services = Array.isArray(catalog?.services) ? catalog.services : [];
    const serviceCategory = mostFrequent(services.map((s) => unbranded(String(s?.category || "").trim(), aliases)).filter(Boolean));
    return {
      category: label || serviceCategory,
      task: serviceCategory || label,
      software: services.some((s) => s?.kind === "software"),
    };
  }
  return {};
}

const FALLBACK = {
  ja: { ec: "人気の商品", b2b: "法人向けサービス", task: "業務効率化", tool: "ツール", service: "サービス" },
  en: { ec: "popular products", b2b: "business services", task: "running a business", tool: "tool", service: "service" },
  "zh-Hans": { ec: "热门商品", b2b: "企业服务", task: "提高工作效率", tool: "工具", service: "服务" },
  "zh-Hant": { ec: "熱門商品", b2b: "企業服務", task: "提升工作效率", tool: "工具", service: "服務" },
  ko: { ec: "인기 상품", b2b: "기업용 서비스", task: "업무 효율화", tool: "툴", service: "서비스" },
  es: { ec: "productos populares", b2b: "servicios para empresas", task: "la gestión de una empresa", tool: "herramienta", service: "opción" },
  fr: { ec: "produits populaires", b2b: "services aux entreprises", task: "la gestion d’une entreprise", tool: "outil", service: "service" },
  de: { ec: "beliebte Produkte", b2b: "Unternehmensdienstleistungen", task: "die Unternehmensführung", tool: "Tool", service: "Angebot" },
  pt: { ec: "produtos populares", b2b: "serviços para empresas", task: "a gestão de uma empresa", tool: "ferramenta", service: "opção" },
  it: { ec: "prodotti popolari", b2b: "servizi per le aziende", task: "la gestione di un’azienda", tool: "strumento", service: "servizio" },
};

/* Ten discovery questions per language and type, and three branded controls. */
const EC = {
  ja: (c) => [
    `${c}のおすすめ通販サイトは？`,
    `${c}でおすすめのブランドを教えて。`,
    `${c}をネットで買うならどこがいい？`,
    `評判の良い${c}の通販ショップを3つ挙げて。`,
    `${c}を送料無料で買えるオンラインショップは？`,
    `${c}の人気商品と、買えるお店を教えて。`,
    `返品しやすい${c}の通販サイトは？`,
    `初めて${c}を買う人におすすめのショップは？`,
    `${c}の口コミが良い通販サイトは？`,
    `${c}を安く買えるオンラインストアは？`,
  ],
  en: (c) => [
    `What are the best online shops for ${c}?`,
    `Which ${c} brands do you recommend?`,
    `Where should I buy ${c} online?`,
    `Name 3 well-reviewed online stores for ${c}.`,
    `Which online shops sell ${c} with free shipping?`,
    `What are the popular ${c} right now, and where can I buy them?`,
    `Which online stores for ${c} have an easy return policy?`,
    `Which shop do you recommend for someone buying ${c} for the first time?`,
    `Which online shops for ${c} have the best customer reviews?`,
    `Where can I buy ${c} online at a good price?`,
  ],
  "zh-Hans": (c) => [
    `买${c}有哪些推荐的网店？`, `${c}有哪些推荐的品牌？`, `网上买${c}去哪里比较好？`, `列出3家口碑好的${c}网店。`, `哪些网店买${c}包邮？`,
    `${c}有哪些热门商品？在哪里能买到？`, `哪些${c}网店退货比较方便？`, `第一次买${c}，推荐哪家店？`, `哪些${c}网店的评价最好？`, `在哪里能便宜地网购${c}？`,
  ],
  "zh-Hant": (c) => [
    `買${c}有哪些推薦的網路商店？`, `${c}有哪些推薦的品牌？`, `網路上買${c}去哪裡比較好？`, `列出3家評價好的${c}網路商店。`, `哪些網路商店買${c}免運費？`,
    `${c}有哪些熱門商品？在哪裡買得到？`, `哪些${c}網路商店退貨比較方便？`, `第一次買${c}，推薦哪家店？`, `哪些${c}網路商店的評價最好？`, `在哪裡能便宜地網購${c}？`,
  ],
  ko: (c) => [
    `${c} 살 만한 온라인 쇼핑몰 추천해 주세요.`, `${c} 추천 브랜드를 알려 주세요.`, `${c}는 온라인에서 어디서 사는 게 좋아요?`, `평이 좋은 ${c} 쇼핑몰 3곳을 알려 주세요.`, `${c}를 무료 배송으로 살 수 있는 쇼핑몰은?`,
    `요즘 인기 있는 ${c}와 살 수 있는 곳을 알려 주세요.`, `반품이 쉬운 ${c} 쇼핑몰은 어디인가요?`, `${c}를 처음 사는 사람에게 추천하는 쇼핑몰은?`, `리뷰가 좋은 ${c} 쇼핑몰은 어디인가요?`, `${c}를 저렴하게 살 수 있는 온라인 스토어는?`,
  ],
  es: (c) => [
    `¿Cuáles son las mejores tiendas online de ${c}?`, `¿Qué marcas de ${c} me recomiendas?`, `¿Dónde conviene comprar ${c} por internet?`, `Dime 3 tiendas online de ${c} con buenas opiniones.`, `¿Qué tiendas online venden ${c} con envío gratis?`,
    `¿Qué ${c} son populares ahora y dónde puedo comprarlos?`, `¿Qué tiendas online de ${c} tienen devoluciones fáciles?`, `¿Qué tienda me recomiendas para comprar ${c} por primera vez?`, `¿Qué tiendas online de ${c} tienen las mejores reseñas?`, `¿Dónde puedo comprar ${c} online a buen precio?`,
  ],
  fr: (c) => [
    `Quelles sont les meilleures boutiques en ligne pour ${c} ?`, `Quelles marques de ${c} recommandes-tu ?`, `Où acheter ${c} en ligne ?`, `Cite 3 boutiques en ligne bien notées pour ${c}.`, `Quelles boutiques en ligne vendent ${c} avec la livraison gratuite ?`,
    `Quels sont les ${c} populaires en ce moment, et où les acheter ?`, `Quelles boutiques en ligne de ${c} ont une politique de retour simple ?`, `Quelle boutique recommandes-tu pour acheter ${c} pour la première fois ?`, `Quelles boutiques en ligne de ${c} ont les meilleurs avis clients ?`, `Où acheter ${c} en ligne à bon prix ?`,
  ],
  de: (c) => [
    `Welche Onlineshops für ${c} sind am besten?`, `Welche Marken für ${c} empfiehlst du?`, `Wo kauft man ${c} am besten online?`, `Nenne 3 gut bewertete Onlineshops für ${c}.`, `Welche Onlineshops verkaufen ${c} mit kostenlosem Versand?`,
    `Welche ${c} sind gerade beliebt, und wo kann man sie kaufen?`, `Welche Onlineshops für ${c} haben eine einfache Rückgabe?`, `Welchen Shop empfiehlst du, wenn man zum ersten Mal ${c} kauft?`, `Welche Onlineshops für ${c} haben die besten Kundenbewertungen?`, `Wo kann man ${c} günstig online kaufen?`,
  ],
  pt: (c) => [
    `Quais são as melhores lojas online de ${c}?`, `Quais marcas de ${c} você recomenda?`, `Onde comprar ${c} pela internet?`, `Cite 3 lojas online de ${c} bem avaliadas.`, `Quais lojas online vendem ${c} com frete grátis?`,
    `Quais ${c} estão populares agora e onde comprá-los?`, `Quais lojas online de ${c} têm troca e devolução fáceis?`, `Qual loja você recomenda para quem vai comprar ${c} pela primeira vez?`, `Quais lojas online de ${c} têm as melhores avaliações?`, `Onde comprar ${c} online com bom preço?`,
  ],
  it: (c) => [
    `Quali sono i migliori negozi online di ${c}?`, `Quali marche di ${c} consigli?`, `Dove conviene comprare ${c} online?`, `Indicami 3 negozi online di ${c} con buone recensioni.`, `Quali negozi online vendono ${c} con spedizione gratuita?`,
    `Quali ${c} sono popolari adesso e dove si comprano?`, `Quali negozi online di ${c} hanno un reso facile?`, `Quale negozio consigli a chi compra ${c} per la prima volta?`, `Quali negozi online di ${c} hanno le recensioni migliori?`, `Dove comprare ${c} online a un buon prezzo?`,
  ],
};

/*
 * The B2B wording before 2026-10 (kept only to recognise a stored default set
 * that was generated from it and never edited - see legacyTypedDiscoveryQuestions).
 * It stacked nouns when the category already named a kind of offering:
 * 「AI検索最適化（AEO）サービスの代表的なツールを3つ挙げて。」
 */
const B2B_V1 = {
  ja: ({ c, t, k }) => [
    `${t}におすすめの${k}は？`,
    `${c}を比較して。主な選択肢を教えて。`,
    `${c}の代表的な${k}を3つ挙げて。`,
    `中小企業向けの${c}でおすすめは？`,
    `${c}の料金相場と、おすすめの${k}を教えて。`,
    `${t}を効率化したい。どの${k}がいい？`,
    `導入事例が多い${c}は？`,
    `${c}を選ぶときのポイントと、おすすめの${k}は？`,
    `評判の良い${c}の会社を教えて。`,
    `${c}の乗り換え先としておすすめは？`,
  ],
  en: ({ c, t, k }) => [
    `What is the best ${k} for ${t}?`,
    `Compare the main ${c} options.`,
    `Name 3 leading ${c} providers.`,
    `Which ${c} do you recommend for a small business?`,
    `What does ${c} typically cost, and which ${k} do you recommend?`,
    `I want to make ${t} more efficient. Which ${k} should I use?`,
    `Which ${c} providers have the most customer case studies?`,
    `What should I look for when choosing ${c}, and which ${k} do you recommend?`,
    `Which ${c} companies have a good reputation?`,
    `What is a good alternative if I want to switch ${c} providers?`,
  ],
  "zh-Hans": ({ c, t, k }) => [
    `${t}有什么推荐的${k}？`, `比较一下主要的${c}。`, `列出3家主流的${c}提供商。`, `适合中小企业的${c}推荐哪个？`, `${c}一般多少钱？推荐哪个${k}？`,
    `想提高${t}的效率，用哪个${k}好？`, `哪些${c}的客户案例比较多？`, `选择${c}时要注意什么？推荐哪个${k}？`, `口碑好的${c}公司有哪些？`, `想更换${c}，有什么推荐的替代方案？`,
  ],
  "zh-Hant": ({ c, t, k }) => [
    `${t}有什麼推薦的${k}？`, `比較一下主要的${c}。`, `列出3家主流的${c}供應商。`, `適合中小企業的${c}推薦哪一個？`, `${c}一般多少錢？推薦哪個${k}？`,
    `想提升${t}的效率，用哪個${k}好？`, `哪些${c}的客戶案例比較多？`, `選擇${c}時要注意什麼？推薦哪個${k}？`, `口碑好的${c}公司有哪些？`, `想更換${c}，有什麼推薦的替代方案？`,
  ],
  ko: ({ c, t, k }) => [
    `${t}에 추천하는 ${k}는?`, `주요 ${c}를 비교해 주세요.`, `대표적인 ${c} 3곳을 알려 주세요.`, `중소기업에 추천하는 ${c}는?`, `${c}의 가격대와 추천 ${k}를 알려 주세요.`,
    `${t}를 효율화하고 싶어요. 어떤 ${k}가 좋을까요?`, `도입 사례가 많은 ${c}는?`, `${c}를 고를 때 포인트와 추천 ${k}는?`, `평판이 좋은 ${c} 회사를 알려 주세요.`, `${c}를 바꾸려면 어떤 대안이 좋을까요?`,
  ],
  es: ({ c, t, k }) => [
    `¿Cuál es la mejor ${k} para ${t}?`, `Compara las principales opciones de ${c}.`, `Dime 3 proveedores destacados de ${c}.`, `¿Qué ${c} recomiendas para una pyme?`, `¿Cuánto cuesta normalmente ${c} y qué ${k} recomiendas?`,
    `Quiero hacer más eficiente ${t}. ¿Qué ${k} debería usar?`, `¿Qué proveedores de ${c} tienen más casos de éxito?`, `¿En qué fijarse al elegir ${c} y qué ${k} recomiendas?`, `¿Qué empresas de ${c} tienen buena reputación?`, `¿Qué alternativa recomiendas para cambiar de proveedor de ${c}?`,
  ],
  fr: ({ c, t, k }) => [
    `Quel est le meilleur ${k} pour ${t} ?`, `Compare les principales offres de ${c}.`, `Cite 3 fournisseurs de référence en ${c}.`, `Quelle offre de ${c} recommandes-tu pour une PME ?`, `Combien coûte en général ${c}, et quel ${k} recommandes-tu ?`,
    `Je veux rendre ${t} plus efficace. Quel ${k} utiliser ?`, `Quels fournisseurs de ${c} ont le plus d’études de cas clients ?`, `Que regarder pour choisir ${c}, et quel ${k} recommandes-tu ?`, `Quelles entreprises de ${c} ont bonne réputation ?`, `Quelle alternative recommandes-tu pour changer de fournisseur de ${c} ?`,
  ],
  de: ({ c, t, k }) => [
    `Welches ${k} ist am besten für ${t}?`, `Vergleiche die wichtigsten Anbieter für ${c}.`, `Nenne 3 führende Anbieter für ${c}.`, `Welchen Anbieter für ${c} empfiehlst du für ein kleines Unternehmen?`, `Was kostet ${c} üblicherweise, und welches ${k} empfiehlst du?`,
    `Ich möchte ${t} effizienter machen. Welches ${k} sollte ich nutzen?`, `Welche Anbieter für ${c} haben die meisten Kundenreferenzen?`, `Worauf sollte man bei der Wahl von ${c} achten, und welches ${k} empfiehlst du?`, `Welche Anbieter für ${c} haben einen guten Ruf?`, `Welche Alternative empfiehlst du für einen Wechsel des Anbieters für ${c}?`,
  ],
  pt: ({ c, t, k }) => [
    `Qual é a melhor ${k} para ${t}?`, `Compare as principais opções de ${c}.`, `Cite 3 fornecedores de destaque de ${c}.`, `Qual ${c} você recomenda para uma pequena empresa?`, `Quanto custa em média ${c}, e qual ${k} você recomenda?`,
    `Quero tornar ${t} mais eficiente. Qual ${k} devo usar?`, `Quais fornecedores de ${c} têm mais casos de sucesso?`, `O que observar ao escolher ${c}, e qual ${k} você recomenda?`, `Quais empresas de ${c} têm boa reputação?`, `Qual alternativa você recomenda para trocar de fornecedor de ${c}?`,
  ],
  it: ({ c, t, k }) => [
    `Qual è il miglior ${k} per ${t}?`, `Confronta le principali offerte di ${c}.`, `Indicami 3 fornitori di riferimento di ${c}.`, `Quale ${c} consigli per una piccola impresa?`, `Quanto costa in media ${c}, e quale ${k} consigli?`,
    `Voglio rendere più efficiente ${t}. Quale ${k} dovrei usare?`, `Quali fornitori di ${c} hanno più casi di successo?`, `Cosa valutare nella scelta di ${c}, e quale ${k} consigli?`, `Quali aziende di ${c} hanno una buona reputazione?`, `Quale alternativa consigli per cambiare fornitore di ${c}?`,
  ],
};

/*
 * B2B questions. Each template gets:
 *   c  the category as entered ("勤怠管理システム", "AI検索最適化（AEO）サービス", "payroll")
 *   n  the offering as a noun phrase: the category itself when it already names
 *      a kind of offering (ends in サービス / ツール / SaaS / "software" ...,
 *      starts with "servicios de" ...), else the category plus the kind word
 *      ("勤怠管理ツール", "payroll tools", "herramientas de nómina")
 *   t  the task, with any kind word removed ("AI検索最適化（AEO）")
 *   k  the kind word: the category's own when it names one (the owner's word
 *      wins over the catalogue's software flag), else tool / service
 * so no template puts a kind word after a category that already ends in one.
 */
const B2B = {
  ja: ({ c, n, t, k }) => [
    `${t}におすすめの${k}は？`,
    `${n}を比較して。主な選択肢を教えて。`,
    `代表的な${n}を3つ挙げて。`,
    `中小企業向けの${n}でおすすめは？`,
    `${n}の料金相場と、おすすめを教えて。`,
    `${t}を効率化したい。どの${k}がいい？`,
    `導入事例が多い${n}は？`,
    `${n}を選ぶときのポイントと、おすすめは？`,
    `評判の良い${n}の提供会社を教えて。`,
    `${n}の乗り換え先としておすすめは？`,
  ],
  en: ({ n, t, k }) => [
    `What is the best ${k} for ${t}?`,
    `Compare the main ${n}.`,
    `Name 3 leading providers of ${n}.`,
    `Which ${n} do you recommend for a small business?`,
    `What is the typical price range for ${n}, and which ${k} do you recommend?`,
    `I want to make ${t} more efficient. Which ${k} should I use?`,
    `Which ${n} have the most customer case studies?`,
    `What should I look for when choosing ${n}, and which ${k} do you recommend?`,
    `Which companies offering ${n} have a good reputation?`,
    `What is a good alternative if I want to switch ${n}?`,
  ],
  "zh-Hans": ({ n, t, k }) => [
    `${t}有什么推荐的${k}？`, `比较一下主要的${n}。`, `列出3个主流的${n}。`, `适合中小企业的${n}推荐哪个？`, `${n}一般多少钱？推荐哪个？`,
    `想提高${t}的效率，用哪个${k}好？`, `哪些${n}的客户案例比较多？`, `选择${n}时要注意什么？推荐哪个？`, `口碑好的${n}提供商有哪些？`, `想更换${n}，有什么推荐的替代方案？`,
  ],
  "zh-Hant": ({ n, t, k }) => [
    `${t}有什麼推薦的${k}？`, `比較一下主要的${n}。`, `列出3個主流的${n}。`, `適合中小企業的${n}推薦哪一個？`, `${n}一般多少錢？推薦哪一個？`,
    `想提升${t}的效率，用哪個${k}好？`, `哪些${n}的客戶案例比較多？`, `選擇${n}時要注意什麼？推薦哪一個？`, `口碑好的${n}供應商有哪些？`, `想更換${n}，有什麼推薦的替代方案？`,
  ],
  ko: ({ n, t, k }) => [
    `${t}에 추천하는 ${k}는?`, `주요 ${n}를 비교해 주세요.`, `대표적인 ${n} 3곳을 알려 주세요.`, `중소기업에 추천하는 ${n}는?`, `${n}의 가격대와 추천할 만한 곳을 알려 주세요.`,
    `${t}를 효율화하고 싶어요. 어떤 ${k}가 좋을까요?`, `도입 사례가 많은 ${n}는?`, `${n}를 고를 때 포인트와 추천할 만한 곳은?`, `평판이 좋은 ${n} 회사를 알려 주세요.`, `${n}를 바꾸려면 어떤 대안이 좋을까요?`,
  ],
  es: ({ c, n, t, k }) => [
    `¿Cuál es la mejor ${k} para ${t}?`, `Compara las principales opciones de ${c}.`, `Dime 3 proveedores destacados de ${n}.`, `¿Qué ${n} recomiendas para una pyme?`, `¿Cuál es el precio habitual de ${n} y qué ${k} recomiendas?`,
    `Quiero hacer más eficiente ${t}. ¿Qué ${k} debería usar?`, `¿Qué proveedores de ${n} tienen más casos de éxito?`, `¿En qué fijarse al elegir ${n} y qué ${k} recomiendas?`, `¿Qué empresas de ${n} tienen buena reputación?`, `¿Qué alternativa recomiendas para cambiar de proveedor de ${n}?`,
  ],
  fr: ({ c, t, k }) => [
    `Quel est le meilleur ${k} pour ${t} ?`, `Compare les principales offres de ${c}.`, `Cite 3 fournisseurs de référence en ${c}.`, `Quelle offre de ${c} recommandes-tu pour une PME ?`, `Combien coûte en général ${c}, et quel ${k} recommandes-tu ?`,
    `Je veux rendre ${t} plus efficace. Quel ${k} utiliser ?`, `Quels fournisseurs de ${c} ont le plus d’études de cas clients ?`, `Que regarder pour choisir ${c}, et quel ${k} recommandes-tu ?`, `Quelles entreprises de ${c} ont bonne réputation ?`, `Quelle alternative recommandes-tu pour changer de fournisseur de ${c} ?`,
  ],
  de: ({ c, t, k }) => [
    `Welches ${k} ist am besten für ${t}?`, `Vergleiche die wichtigsten Anbieter für ${c}.`, `Nenne 3 führende Anbieter für ${c}.`, `Welchen Anbieter für ${c} empfiehlst du für ein kleines Unternehmen?`, `Was kostet ${c} üblicherweise, und welches ${k} empfiehlst du?`,
    `Ich möchte ${t} effizienter machen. Welches ${k} sollte ich nutzen?`, `Welche Anbieter für ${c} haben die meisten Kundenreferenzen?`, `Worauf sollte man bei der Wahl von ${c} achten, und welches ${k} empfiehlst du?`, `Welche Anbieter für ${c} haben einen guten Ruf?`, `Welche Alternative empfiehlst du für einen Wechsel des Anbieters für ${c}?`,
  ],
  pt: ({ c, n, t, k }) => [
    `Qual é a melhor ${k} para ${t}?`, `Compare as principais opções de ${c}.`, `Cite 3 fornecedores de destaque de ${n}.`, `Quais ${n} você recomenda para uma pequena empresa?`, `Quanto custa em média ${c}, e qual ${k} você recomenda?`,
    `Quero tornar ${t} mais eficiente. Qual ${k} devo usar?`, `Quais fornecedores de ${n} têm mais casos de sucesso?`, `O que observar ao escolher ${n}, e qual ${k} você recomenda?`, `Quais empresas de ${n} têm boa reputação?`, `Qual alternativa você recomenda para trocar de fornecedor de ${n}?`,
  ],
  it: ({ c, n, t, k }) => [
    `Qual è il miglior ${k} per ${t}?`, `Confronta le principali offerte di ${c}.`, `Indicami 3 fornitori di riferimento di ${n}.`, `Quali ${n} consigli per una piccola impresa?`, `Quanto costa in media ${c}, e quale ${k} consigli?`,
    `Voglio rendere più efficiente ${t}. Quale ${k} dovrei usare?`, `Quali fornitori di ${n} hanno più casi di successo?`, `Cosa valutare nella scelta di ${n}, e quale ${k} consigli?`, `Quali aziende di ${n} hanno una buona reputazione?`, `Quale alternativa consigli per cambiare fornitore di ${n}?`,
  ],
};

/*
 * Words that already name a kind of offering, per language, and which kind
 * (tool / service) they are. CJK and English put the kind word last
 * ("勤怠管理システム", "AEO services"); Spanish, French, Portuguese and Italian
 * put it first ("servicios de AEO"); German compounds it ("AEO-Software",
 * "Lohnabrechnungssoftware"). The English words are also recognised in every
 * language, since "SaaS" and "software" are used as is.
 */
const EN_TOOL = "tools?|software|platforms?|apps?|applications?|systems?|saas";
const EN_SERVICE = "services?|solutions?";
const SUFFIX_HEADS = {
  ja: { tool: ["ツール", "ソフトウェア", "ソフト", "システム", "アプリ", "プラットフォーム", "SaaS"], service: ["クラウドサービス", "サービス", "ソリューション"] },
  "zh-Hans": { tool: ["工具", "软件", "系统", "平台", "应用", "SaaS"], service: ["服务", "解决方案"] },
  "zh-Hant": { tool: ["工具", "軟體", "軟件", "系統", "平台", "應用", "SaaS"], service: ["服務", "解決方案"] },
  ko: { tool: ["툴", "도구", "소프트웨어", "시스템", "플랫폼", "앱", "SaaS"], service: ["서비스", "솔루션"] },
  de: { tool: ["software", "tools", "tool", "plattformen", "plattform", "systeme", "system", "apps", "app", "saas"], service: ["dienstleistungen", "dienstleistung", "dienste", "dienst", "services", "service", "lösungen", "lösung"] },
};
const PREFIX_HEADS = {
  es: { tool: "herramientas?|software|plataformas?|aplicaci(?:ón|on|ones)|sistemas?", service: "servicios?|soluci(?:ón|on|ones)", link: "de|para" },
  fr: { tool: "outils?|logiciels?|plateformes?|applications?|systèmes?", service: "services?|solutions?|prestations?", link: "de|pour" },
  pt: { tool: "ferramentas?|software|plataformas?|aplicativos?|sistemas?", service: "servi(?:ço|ços|co|cos)|solu(?:ção|ções|cao|coes)", link: "de|para" },
  it: { tool: "strument[oi]|software|piattaform[ae]|applicazion[ei]|sistem[ai]|app", service: "serviz[io]|servizi|soluzion[ei]", link: "di|per" },
};

/**
 * Split a category into { stem, kind }: the words before (or after) a kind
 * word, and which kind it is. { stem: category, kind: null } when the
 * category names no kind of offering.
 */
export function splitOfferingKind(value, language = "ja") {
  const text = String(value || "").trim();
  if (!text) return { stem: "", kind: null };
  const cut = (stem) => stem.replace(/[\s　・·\-–—/／]+$/u, "").replace(/^[\s　・·\-–—/／]+/u, "").trim();
  const heads = SUFFIX_HEADS[language];
  if (heads) {
    const folded = text.normalize("NFKC").toLowerCase();
    for (const kind of ["service", "tool"]) {
      for (const head of heads[kind]) {
        const h = head.normalize("NFKC").toLowerCase();
        if (folded.endsWith(h) && folded.length > h.length) {
          let stem = cut(text.slice(0, text.length - head.length));
          // German linking s: "Lohnabrechnungssoftware" -> "Lohnabrechnung".
          if (language === "de" && !/[\s-]$/.test(text.slice(0, text.length - head.length)) && /(ung|ion|tät|heit|keit)s$/i.test(stem)) stem = stem.slice(0, -1);
          return { stem, kind };
        }
        if (folded === h) return { stem: "", kind };
      }
    }
  }
  const prefix = PREFIX_HEADS[language];
  if (prefix) {
    for (const kind of ["service", "tool"]) {
      if (new RegExp(`^(?:${prefix[kind]})$`, "iu").test(text)) return { stem: "", kind };
      const match = text.match(new RegExp(`^(?:${prefix[kind]})\\s+(?:(?:${prefix.link})\\s+|d[’']\\s*)?(.+)$`, "iu"));
      if (match) return { stem: cut(match[1]), kind };
    }
  }
  // English kind words, at the end, in any language ("AEO services", "CRM SaaS").
  const english = text.match(new RegExp(`^(.*?)[\\s\\-]*\\b(?:(${EN_SERVICE})|(${EN_TOOL}))$`, "iu"));
  if (english) return { stem: cut(english[1]), kind: english[2] ? "service" : "tool" };
  return { stem: text, kind: null };
}

/** The category as a noun phrase that names an offering, in a language. */
function offeringPhrase(language, category, kindWord, kind) {
  switch (language) {
    case "ja": case "zh-Hans": case "zh-Hant": return `${category}${kindWord}`;
    case "ko": return `${category} ${kindWord}`;
    case "en": return `${category} ${kind === "tool" ? "tools" : "services"}`;
    case "es": return `${kind === "tool" ? "herramientas" : "servicios"} de ${category}`;
    case "pt": return `${kind === "tool" ? "ferramentas" : "serviços"} de ${category}`;
    case "it": return `${kind === "tool" ? "strumenti" : "servizi"} di ${category}`;
    default: return category; // fr, de: their templates build the phrase themselves
  }
}

/** The words a B2B template is filled with (see B2B above). */
export function b2bQuestionWords(profile = {}, language = "ja") {
  const fallback = FALLBACK[language] || FALLBACK.en;
  const c = profile.category || fallback.b2b;
  const own = splitOfferingKind(c, language);
  const taskSplit = splitOfferingKind(profile.task || profile.category || "", language);
  const kind = own.kind || taskSplit.kind || (profile.software ? "tool" : "service");
  const k = kind === "tool" ? fallback.tool : fallback.service;
  const t = (taskSplit.kind ? taskSplit.stem : profile.task || profile.category || "") || fallback.task;
  const n = own.kind ? c : offeringPhrase(language, c, k, kind);
  return { c, n, t, k, kind };
}

const BRANDED = {
  ja: { ec: (n) => [`${n}はどんな通販サイト？`, `${n}の送料と返品条件を教えて。`, `${n}の評判は？`], b2b: (n) => [`${n}はどんな会社？何を提供している？`, `${n}の料金は？`, `${n}の評判は？`] },
  en: { ec: (n) => [`What kind of online shop is ${n}?`, `What are ${n}'s shipping and return terms?`, `What do people say about ${n}?`], b2b: (n) => [`What does ${n} offer?`, `How much does ${n} cost?`, `What do people say about ${n}?`] },
  "zh-Hans": { ec: (n) => [`${n}是什么样的网店？`, `${n}的运费和退货条件是什么？`, `${n}的评价怎么样？`], b2b: (n) => [`${n}是什么公司？提供什么？`, `${n}的价格是多少？`, `${n}的评价怎么样？`] },
  "zh-Hant": { ec: (n) => [`${n}是什麼樣的網路商店？`, `${n}的運費和退貨條件是什麼？`, `${n}的評價如何？`], b2b: (n) => [`${n}是什麼公司？提供什麼？`, `${n}的價格是多少？`, `${n}的評價如何？`] },
  ko: { ec: (n) => [`${n}는 어떤 쇼핑몰인가요?`, `${n}의 배송비와 반품 조건을 알려 주세요.`, `${n} 평판은 어떤가요?`], b2b: (n) => [`${n}는 어떤 회사이고 무엇을 제공하나요?`, `${n}의 요금은 얼마인가요?`, `${n} 평판은 어떤가요?`] },
  es: { ec: (n) => [`¿Qué tipo de tienda online es ${n}?`, `¿Qué condiciones de envío y devolución tiene ${n}?`, `¿Qué opiniones tiene ${n}?`], b2b: (n) => [`¿Qué ofrece ${n}?`, `¿Cuánto cuesta ${n}?`, `¿Qué opiniones tiene ${n}?`] },
  fr: { ec: (n) => [`Quel type de boutique en ligne est ${n} ?`, `Quelles sont les conditions de livraison et de retour de ${n} ?`, `Que disent les avis sur ${n} ?`], b2b: (n) => [`Que propose ${n} ?`, `Combien coûte ${n} ?`, `Que disent les avis sur ${n} ?`] },
  de: { ec: (n) => [`Was für ein Onlineshop ist ${n}?`, `Welche Versand- und Rückgabebedingungen hat ${n}?`, `Wie wird ${n} bewertet?`], b2b: (n) => [`Was bietet ${n} an?`, `Was kostet ${n}?`, `Wie wird ${n} bewertet?`] },
  pt: { ec: (n) => [`Que tipo de loja online é ${n}?`, `Quais são as condições de frete e devolução de ${n}?`, `Quais são as avaliações de ${n}?`], b2b: (n) => [`O que ${n} oferece?`, `Quanto custa ${n}?`, `Quais são as avaliações de ${n}?`] },
  it: { ec: (n) => [`Che tipo di negozio online è ${n}?`, `Quali sono le condizioni di spedizione e reso di ${n}?`, `Che recensioni ha ${n}?`], b2b: (n) => [`Che cosa offre ${n}?`, `Quanto costa ${n}?`, `Che recensioni ha ${n}?`] },
};

export const TYPED_QUESTION_LANGUAGES = Object.freeze(Object.keys(EC));

/** Ten discovery questions for a typed profile, or null for a local one. */
export function typedDiscoveryQuestions(profile = {}) {
  const type = normalizeSiteType(profile.siteType);
  if (type === "local") return null;
  const language = EC[profile.language] ? profile.language : profile.language ? "en" : "ja";
  const fallback = FALLBACK[language];
  if (type === "ec") return EC[language](profile.category || fallback.ec);
  return B2B[language](b2bQuestionWords(profile, language));
}

/**
 * The B2B discovery questions as the wording before 2026-10 phrased them, for
 * recognising a stored default set that nobody edited (pro-report.mjs replaces
 * it with the current wording, keeping the owner's competitors). Null for any
 * other type.
 */
export function legacyTypedDiscoveryQuestions(profile = {}) {
  if (normalizeSiteType(profile.siteType) !== "b2b") return null;
  const language = B2B_V1[profile.language] ? profile.language : profile.language ? "en" : "ja";
  const fallback = FALLBACK[language];
  const c = profile.category || fallback.b2b;
  const t = profile.task || profile.category || fallback.task;
  return B2B_V1[language]({ c, t, k: profile.software ? fallback.tool : fallback.service });
}

/** Three branded control questions for a typed profile, or null for a local one. */
export function typedBrandedQuestions(profile = {}) {
  const type = normalizeSiteType(profile.siteType);
  if (type === "local") return null;
  const language = BRANDED[profile.language] ? profile.language : profile.language ? "en" : "ja";
  return BRANDED[language][type](profile.name);
}
