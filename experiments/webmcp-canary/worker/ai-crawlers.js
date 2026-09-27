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

export function matchCrawler(uaString = "") {
  const ua = String(uaString).toLowerCase();
  return AI_CRAWLERS.find((crawler) => ua.includes(crawler.ua.toLowerCase())) || null;
}

export const isAICrawler = (ua) => !!matchCrawler(ua);
export function robotsBlock(allow = true) {
  const rule = allow ? "Allow: /" : "Disallow: /";
  return AI_CRAWLERS.map((crawler) => `User-agent: ${crawler.ua}\n${rule}`).join("\n\n") + "\n";
}

export function buildLlmsTxt(site = {}) {
  const lines = [
    `# ${site.name || site.url || "Store"}`,
    site.summary ? `> ${site.summary}` : null,
    "",
    "## 店舗情報",
    site.address ? `- 住所: ${site.address}` : null,
    site.tel ? `- 電話: ${site.tel}` : null,
    site.hours ? `- 営業時間: ${site.hours}` : null,
    site.reserve ? `- 予約: ${site.reserve}` : null,
    site.url ? `- サイト: https://${String(site.url).replace(/^https?:\/\//, "")}` : null,
    "",
    "## 対応AIクローラー（許可）",
    ...AI_CRAWLERS.map((crawler) => `- ${crawler.ua} — ${crawler.owner}（${crawler.engine}）`),
    "",
  ];
  return lines.filter((line) => line !== null).join("\n");
}
