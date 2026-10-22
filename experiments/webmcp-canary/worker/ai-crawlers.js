import { INITIAL_AEO_RULESET } from "./aeo-rules.mjs";
export const AI_CRAWLERS = [
  { id: "gptbot", ua: "GPTBot", owner: "OpenAI", engine: "ChatGPT", purpose: "学習・インデックス" },
  { id: "oai-search", ua: "OAI-SearchBot", owner: "OpenAI", engine: "ChatGPT Search", purpose: "検索インデックス" },
  { id: "chatgpt-user", ua: "ChatGPT-User", owner: "OpenAI", engine: "ChatGPT（ブラウズ）", purpose: "ユーザー操作での取得" },
  { id: "claudebot", ua: "ClaudeBot", owner: "Anthropic", engine: "Claude", purpose: "学習・インデックス" },
  { id: "perplexity", ua: "PerplexityBot", owner: "Perplexity", engine: "Perplexity", purpose: "検索・回答" },
  { id: "google-ext", ua: "Google-Extended", owner: "Google", engine: "Gemini / AI Overviews", purpose: "AI用途の学習許可" },
  { id: "applebot-ext", ua: "Applebot-Extended", owner: "Apple", engine: "Apple Intelligence", purpose: "AI用途の学習許可" },
  { id: "bytespider", ua: "Bytespider", owner: "ByteDance", engine: "Doubao 等", purpose: "学習・インデックス" },
];

// The crawlers that fetch pages to answer a search or a user's question, as
// opposed to the ones collecting training data. Owners who have not decided
// about training can still let these in; the robots lines Nurevo recommends
// for a non-WordPress site name only these and leave every other group alone.
export const AI_SEARCH_CRAWLERS = Object.freeze([
  "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User",
]);

/** robots.txt lines that allow the AI search crawlers and nothing else. */
export function searchCrawlerRobotsLines() {
  return [
    "# Nurevo AEO: allow AI search crawlers (training crawlers are not changed)",
    ...AI_SEARCH_CRAWLERS.map((ua) => `User-agent: ${ua}`),
    "Allow: /",
    "",
  ].join("\n");
}

export function matchCrawler(uaString = "") {
  const ua = String(uaString).toLowerCase();
  return AI_CRAWLERS.find((crawler) => ua.includes(crawler.ua.toLowerCase())) || null;
}

export const isAICrawler = (ua) => !!matchCrawler(ua);
export function robotsBlock(allow = true, definition = INITIAL_AEO_RULESET.definition) {
  const rule = allow && definition.robots.defaultAllow ? "Allow: /" : "Disallow: /";
  return AI_CRAWLERS.filter(c=>definition.robots.aiCrawlerIds.includes(c.id)).map(c=>`User-agent: ${c.ua}\n${rule}`).join("\n\n") + "\n";
}

export function buildLlmsTxt(site = {}, definition = INITIAL_AEO_RULESET.definition) {
  let canonical = site.url;
  try { if (canonical) canonical = new URL(/^https?:\/\//i.test(canonical) ? canonical : `https://${canonical}`).href; } catch { canonical = null; }
  const values = {...site,url:canonical,name:site.name || site.url,description:site.description || site.summary,
    reserve_url:site.reserve_url || site.reserve,
    crawlerNames:AI_CRAWLERS.filter(c=>definition.robots.aiCrawlerIds.includes(c.id)).map(c=>`- ${c.ua}`).join('\n')};
  const clean = value => String(value ?? '').replace(/[\r\n]+/g,' ');
  return definition.llmsTxt.sections.map(section=>(definition.generation.llmsSections[section] || []).map(spec=>{
    if (spec.literal) return spec.literal;
    const value = values[spec.source];
    return value ? spec.template.replace('{value}',spec.source === 'crawlerNames' ? value : clean(value)) : null;
  }).filter(Boolean).join('\n')).filter(Boolean).join('\n\n') + '\n';
}
