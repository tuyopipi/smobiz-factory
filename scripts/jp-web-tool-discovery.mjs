import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const count = Number(process.env.COUNT ?? process.env.DRY_RUN_COUNT ?? 5);
const keywordLimit = Number(process.env.KEYWORD_LIMIT ?? 40);
const outDir = "artifacts/jp-web-tool-discovery";

const seeds = [
  "請求書 作成",
  "請求書 インボイス 作成",
  "見積書 テンプレート",
  "納品書 作成",
  "領収書 作成",
  "契約書 テンプレート",
  "業務委託契約書 テンプレート",
  "PDF 変換",
  "PDF 結合",
  "PDF 圧縮",
  "CSV 変換",
  "CSV 整形",
  "JSON 変換",
  "画像 圧縮",
  "スクリーンショット 連結",
  "源泉徴収 計算 ツール",
  "消費税 計算 インボイス",
  "和暦 西暦 変換",
  "議事録 テンプレート",
  "稟議書 テンプレート"
];

const winningCategoryTerms = [
  "pdf",
  "請求書",
  "見積書",
  "契約書",
  "テンプレート",
  "csv",
  "json",
  "画像",
  "スクリーンショット",
  "議事録",
  "稟議",
  "ワークフロー"
];

const purchaseIntentTerms = [
  "ツール",
  "作成",
  "変換",
  "テンプレート",
  "無料",
  "自動",
  "クラウド",
  "ソフト",
  "アプリ",
  "サービス",
  "料金",
  "比較",
  "ダウンロード",
  "エクセル",
  "excel"
];

const b2bTerms = [
  "請求書",
  "見積書",
  "納品書",
  "領収書",
  "契約書",
  "業務委託",
  "源泉徴収",
  "消費税",
  "インボイス",
  "適格請求書",
  "議事録",
  "稟議",
  "経費",
  "会計",
  "給与",
  "取引先",
  "発注",
  "納期"
];

const japanSpecificTerms = [
  "インボイス",
  "適格請求書",
  "登録番号",
  "源泉徴収",
  "消費税",
  "軽減税率",
  "和暦",
  "令和",
  "平成",
  "印紙",
  "電子帳簿",
  "マイナンバー"
];

const easyTerms = [
  "作成",
  "変換",
  "テンプレート",
  "整形",
  "圧縮",
  "結合",
  "分割",
  "計算",
  "チェック",
  "生成",
  "コピー",
  "csv",
  "json",
  "pdf",
  "画像"
];

const hardTerms = [
  "電子契約",
  "会計ソフト連携",
  "銀行",
  "API",
  "ログイン",
  "マイナンバー",
  "医療",
  "法務相談",
  "税務申告",
  "e-tax",
  "決済"
];

const competitorToolTerms = [
  "無料",
  "ツール",
  "作成",
  "変換",
  "テンプレート",
  "クラウド",
  "アプリ",
  "ソフト",
  "オンライン",
  "自動"
];

const knownCompetitorTerms = [
  "freee",
  "マネーフォワード",
  "misoca",
  "弥生",
  "board",
  "makeleaps",
  "請求quick",
  "adobe",
  "smallpdf",
  "ilovepdf",
  "canva",
  "pdf24",
  "notion",
  "google",
  "microsoft"
];

await mkdir(outDir, { recursive: true });

const keywords = await collectKeywords();
const scored = [];
for (const keyword of keywords) {
  const suggestions = await googleSuggest(keyword);
  const competition = await webToolCompetition(keyword);
  scored.push(scoreKeyword(keyword, suggestions, competition));
  await delay(250);
}

const ranked = uniqueByCandidate(scored
  .filter((item) => item.demandScore > 0 && item.gapScore > 0.25)
  .sort((a, b) => b.gapScore - a.gapScore)
  .map((item) => ({ ...item, candidate: candidateFor(item) })))
  .slice(0, count);

const payload = {
  generatedAt: new Date().toISOString(),
  count,
  source: {
    searchDemand: "Google Suggest hl=ja gl=jp",
    competition: "Yahoo Japan web search",
    categoryBias: "buildmvpfast-style proven MVP categories: documents, converters, images/screenshots, internal workflow"
  },
  results: ranked
};

await writeFile(join(outDir, "latest.json"), JSON.stringify(payload, null, 2));
console.log(JSON.stringify(payload, null, 2));

async function collectKeywords() {
  const output = new Set(seeds);
  for (const seed of seeds) {
    for (const suggestion of await googleSuggest(seed)) {
      const normalized = normalizeKeyword(suggestion);
      if (normalized) output.add(normalized);
    }
  }
  return [...output].slice(0, keywordLimit);
}

async function googleSuggest(keyword) {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=${encodeURIComponent(keyword)}`;
  const response = await fetch(url, { headers: { "User-Agent": "smobiz-factory/0.1" } });
  if (!response.ok) throw new Error(`Google suggest failed for ${keyword}: ${response.status}`);
  const text = new TextDecoder("shift_jis").decode(await response.arrayBuffer());
  const body = JSON.parse(text);
  return Array.isArray(body?.[1]) ? body[1].map(String).slice(0, 10) : [];
}

async function webToolCompetition(keyword) {
  const url = `https://search.yahoo.co.jp/search?p=${encodeURIComponent(`${keyword} ツール`)}`;
  const response = await retryFetch(url, { headers: { "User-Agent": "Mozilla/5.0 smobiz-factory/0.1" } });
  if (!response.ok) {
    return {
      query: `${keyword} ツール`,
      resultCount: 0,
      topToolResults: 4,
      toolMentions: 20,
      knownCompetitorMentions: 2,
      examples: [`competition check unavailable: HTTP ${response.status}`],
      unavailable: true
    };
  }
  const html = await response.text();
  const lower = normalizeText(stripTags(html));
  const resultBlocks = [...html.matchAll(/<a[^>]+href="[^"]+"[^>]*>[\s\S]{0,180}?<\/a>/g)]
    .map((match) => stripTags(match[0]).replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 12 && !block.includes("簡易版検索結果ページ"))
    .slice(0, 10);
  const toolMentions = competitorToolTerms.reduce((sum, term) => sum + occurrences(lower, normalizeText(term)), 0);
  const knownMentions = knownCompetitorTerms.reduce((sum, term) => sum + occurrences(lower, normalizeText(term)), 0);
  const topToolResults = resultBlocks.filter((block) => {
    const value = normalizeText(block);
    return competitorToolTerms.some((term) => value.includes(normalizeText(term))) || knownCompetitorTerms.some((term) => value.includes(normalizeText(term)));
  }).length;
  return {
    query: `${keyword} ツール`,
    resultCount: resultBlocks.length,
    topToolResults,
    toolMentions,
    knownCompetitorMentions: knownMentions,
    examples: resultBlocks.slice(0, 4).map((block) => block.replace(/\s+/g, " ").trim().slice(0, 140))
  };
}

async function retryFetch(url, init) {
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(url, init);
    if (![429, 500, 502, 503].includes(response.status)) return response;
    await delay(1000 * attempt);
  }
  return response;
}

function scoreKeyword(keyword, suggestions, competition) {
  const context = normalizeText([keyword, ...suggestions].join(" "));
  const demandScore = clamp((suggestions.length / 10) * 0.7 + exactSuggestionBoost(keyword, suggestions) * 0.3, 0, 1);
  const purchaseIntentScore = termScore(context, purchaseIntentTerms);
  const b2bScore = termScore(context, b2bTerms);
  const categoryScore = termScore(context, winningCategoryTerms);
  const japanFitScore = termScore(context, japanSpecificTerms);
  const implementationEaseScore = clamp(0.45 + termScore(context, easyTerms) * 0.55 - termScore(context, hardTerms) * 0.45, 0, 1);
  const competitionFullness = clamp(
    competition.topToolResults / 7 * 0.45 +
      competition.knownCompetitorMentions / 10 * 0.35 +
      competition.toolMentions / 50 * 0.2,
    0,
    1
  );
  const competitionThinnessScore = 1 - competitionFullness;
  const gapScore = clamp(
    demandScore *
      (0.35 + purchaseIntentScore * 0.25 + b2bScore * 0.15 + categoryScore * 0.15 + japanFitScore * 0.1) *
      (0.45 + implementationEaseScore * 0.55) *
      (0.35 + competitionThinnessScore * 0.65),
    0,
    1
  );
  return {
    keyword,
    suggestions,
    searchDemand: suggestions.length,
    demandScore: round(demandScore),
    purchaseIntentScore: round(purchaseIntentScore),
    b2bScore: round(b2bScore),
    categoryScore: round(categoryScore),
    japanFitScore: round(japanFitScore),
    implementationEaseScore: round(implementationEaseScore),
    competitionThinnessScore: round(competitionThinnessScore),
    gapScore: round(gapScore),
    competition,
    regulatoryRisk: regulatoryRisk(keyword, suggestions)
  };
}

function candidateFor(item) {
  const keyword = item.keyword;
  if (keyword.includes("源泉徴収")) {
    return {
      name: "源泉徴収つき請求額メーカー",
      targetUser: "個人事業主に報酬を支払う中小企業の経理担当者",
      concept: "報酬額・税率・消費税・インボイス登録有無を入力し、源泉徴収込みの支払明細とコピペ用文面を生成するWebツール"
    };
  }
  if (keyword.includes("和暦")) {
    return {
      name: "和暦入り書類日付チェッカー",
      targetUser: "契約書・見積書・申請書を作るバックオフィス担当者",
      concept: "西暦/和暦の相互変換、令和表記、年度表記、書類向け日付文言を一括生成するWebツール"
    };
  }
  if (keyword.includes("csv")) {
    return {
      name: "日本語CSV整形くん",
      targetUser: "EC運営・営業事務・経理担当者",
      concept: "文字化け、全角半角、郵便番号、電話番号、日付、金額列を日本向けに整形してダウンロードするWebツール"
    };
  }
  if (keyword.includes("インボイス") || keyword.includes("請求書")) {
    return {
      name: "インボイス請求書ミニ作成",
      targetUser: "副業・個人事業主・小規模法人",
      concept: "登録番号、消費税、源泉徴収、振込先を含む日本向け請求書PDFをブラウザだけで作成するWebツール"
    };
  }
  if (keyword.includes("契約書") || keyword.includes("業務委託")) {
    return {
      name: "業務委託契約書たたき台メーカー",
      targetUser: "フリーランスへ発注する小規模事業者",
      concept: "報酬、納期、検収、著作権、再委託、秘密保持の選択肢から契約書たたき台を生成するWebツール"
    };
  }
  return {
    name: `${keyword} ミニツール`,
    targetUser: "日本のバックオフィス担当者",
    concept: `${keyword}の定型処理をブラウザ上で完結させる軽量Webツール`
  };
}

function regulatoryRisk(keyword, suggestions) {
  const context = normalizeText([keyword, ...suggestions].join(" "));
  if (["マイナンバー", "医療", "税務申告", "電子契約", "銀行", "決済"].some((term) => context.includes(normalizeText(term)))) return "high";
  if (["契約書", "源泉徴収", "インボイス", "電子帳簿", "法務"].some((term) => context.includes(normalizeText(term)))) return "medium";
  return "low";
}

function uniqueByCandidate(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    if (seen.has(item.candidate.name)) continue;
    seen.add(item.candidate.name);
    output.push(item);
  }
  return output;
}

function exactSuggestionBoost(keyword, suggestions) {
  const normalized = normalizeText(keyword);
  return suggestions.some((suggestion) => normalizeText(suggestion) === normalized) ? 1 : 0.4;
}

function termScore(context, terms) {
  const hits = terms.filter((term) => context.includes(normalizeText(term))).length;
  return clamp(hits / Math.min(5, terms.length), 0, 1);
}

function normalizeKeyword(value) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value).normalize("NFKC").toLowerCase();
}

function stripTags(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

function occurrences(value, needle) {
  if (!needle) return 0;
  return value.split(needle).length - 1;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function round(value) {
  return Number(value.toFixed(3));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
