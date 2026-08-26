const dashboardI18n = {
  ja: {
    "dashboard.eyebrow": "ダッシュボード",
    "dashboard.title": "フォームのパフォーマンス",
    "dashboard.copy": "完了率を確認し、離脱を引き起こすフィールドと改善案を見つけましょう。",
    "dashboard.signedIn": "ログイン中:",
    "dashboard.emptyTitle": "サイトがまだありません",
    "dashboard.emptyCopy": "このメールアドレスを使い、Nurevo トップページからサイトキーを発行してください。",
    "dashboard.install": "Nurevo を導入",
    "auth.title": "メールでログイン",
    "auth.copy": "15分間有効なワンタイムログインリンクを送信します。",
    "auth.legacyNote": "以前発行したキーでログインできない場合は、キーを再発行してください。",
    "auth.email": "メールアドレス",
    "auth.submit": "ログインリンクを送る",
    "auth.sent": "該当するアカウントがある場合、ログインリンクを送信しました。",
    "auth.logout": "ログアウト",
    "site.submissions": "フォーム送信数",
    "site.completion": "完了率",
    "site.dropoff": "離脱の多いフィールド",
    "site.suggestions": "改善提案",
    "site.noDropoff": "十分な離脱データがありません",
    "site.noSuggestions": "改善提案はまだありません",
    "site.plan": "現在のプラン",
    "site.loading": "統計を読み込み中…",
    "error.load": "ダッシュボードを読み込めませんでした。"
  },
  en: {
    "dashboard.eyebrow": "Dashboard",
    "dashboard.title": "Your form performance",
    "dashboard.copy": "Track completion, find the fields causing abandonment, and act on improvement suggestions.",
    "dashboard.signedIn": "Signed in as",
    "dashboard.emptyTitle": "No sites yet",
    "dashboard.emptyCopy": "Issue a site key from the Nurevo home page using this email address.",
    "dashboard.install": "Install Nurevo",
    "auth.title": "Sign in with email",
    "auth.copy": "We will send a one-time sign-in link. It expires in 15 minutes.",
    "auth.legacyNote": "If you cannot sign in with a previously issued key, please reissue the key.",
    "auth.email": "Email",
    "auth.submit": "Send sign-in link",
    "auth.sent": "If an account exists for that email, a sign-in link has been sent.",
    "auth.logout": "Log out",
    "site.submissions": "Form submissions",
    "site.completion": "Completion rate",
    "site.dropoff": "Highest-drop-off fields",
    "site.suggestions": "Improvement suggestions",
    "site.noDropoff": "Not enough drop-off data yet",
    "site.noSuggestions": "No suggestions yet",
    "site.plan": "Current plan",
    "site.loading": "Loading analytics…",
    "error.load": "Could not load the dashboard."
  }
};

const config = window.NUREVO_CONFIG || {};
const dashboardState = { lang: localStorage.getItem("nurevo-lang") || "en", sites: [] };
const apiBase = (config.apiBase || "").replace(/\/$/, "");

document.addEventListener("DOMContentLoaded", async () => {
  applyDashboardLanguage(dashboardState.lang);
  document.querySelector("[data-lang-toggle]").addEventListener("click", () => {
    applyDashboardLanguage(dashboardState.lang === "ja" ? "en" : "ja");
    renderSites();
  });
  document.querySelector("[data-auth-form]").addEventListener("submit", requestMagicLink);
  document.querySelector("[data-logout]").addEventListener("click", logout);
  await consumeToken();
  await loadSession();
});

function text(key) {
  return dashboardI18n[dashboardState.lang][key] || key;
}

function applyDashboardLanguage(lang) {
  dashboardState.lang = dashboardI18n[lang] ? lang : "en";
  document.documentElement.lang = dashboardState.lang;
  localStorage.setItem("nurevo-lang", dashboardState.lang);
  document.querySelector("[data-lang-toggle]").textContent = dashboardState.lang === "ja" ? "English" : "日本語";
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = text(element.dataset.i18n);
  }
}

async function consumeToken() {
  const url = new URL(location.href);
  const token = url.searchParams.get("token");
  if (!token) return;
  location.replace(`${apiBase}/api/auth/verify?token=${encodeURIComponent(token)}`);
  await new Promise(() => {});
}

async function loadSession() {
  try {
    const response = await fetch(`${apiBase}/api/auth/session`, { credentials: "include" });
    if (response.status === 401) return showSignedOut();
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "session_failed");
    document.querySelector("[data-auth-panel]").hidden = true;
    document.querySelector("[data-dashboard]").hidden = false;
    document.querySelector("[data-logout]").hidden = false;
    document.querySelector("[data-email]").textContent = payload.emailMasked;
    dashboardState.sites = payload.siteKeys.map((site) => ({ ...site, insights: null }));
    renderSites();
    await Promise.all(dashboardState.sites.map(loadInsights));
  } catch (error) {
    showPageError(`${text("error.load")} ${error.message}`);
  }
}

function showSignedOut() {
  document.querySelector("[data-auth-panel]").hidden = false;
  document.querySelector("[data-dashboard]").hidden = true;
  document.querySelector("[data-logout]").hidden = true;
}

async function requestMagicLink(event) {
  event.preventDefault();
  const status = document.querySelector("[data-auth-status]");
  status.textContent = "";
  try {
    const response = await fetch(`${apiBase}/api/auth/request`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: new FormData(event.currentTarget).get("email") })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "request_failed");
    status.className = "form-status success";
    status.textContent = text("auth.sent");
  } catch (error) {
    status.className = "form-status error";
    status.textContent = error.message;
  }
}

async function logout() {
  await fetch(`${apiBase}/api/auth/logout`, { method: "POST", credentials: "include" });
  dashboardState.sites = [];
  showSignedOut();
}

async function loadInsights(site) {
  try {
    const query = new URLSearchParams({ site_key: site.siteKey, host: site.siteHost });
    const response = await fetch(`${apiBase}/api/site-insights?${query}`, { credentials: "include" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "insights_failed");
    site.insights = payload;
  } catch (error) {
    site.insights = { error: error.message };
  }
  renderSites();
}

function renderSites() {
  const container = document.querySelector("[data-sites]");
  const empty = document.querySelector("[data-empty]");
  empty.hidden = dashboardState.sites.length > 0;
  container.replaceChildren(...dashboardState.sites.map(renderSite));
}

function renderSite(site) {
  const article = document.createElement("article");
  article.className = "site-card";
  const header = element("div", "site-card-header");
  const heading = element("div");
  heading.append(element("h2", "", site.siteHost), element("p", "site-url", site.siteUrl));
  const plan = element("span", `plan-badge ${site.plan === "pro" ? "pro" : ""}`, site.plan.toUpperCase());
  header.append(heading, plan);
  article.append(header);
  if (!site.insights) {
    article.append(element("p", "form-status", text("site.loading")));
    return article;
  }
  if (site.insights.error) {
    article.append(element("p", "form-status error", site.insights.error));
    return article;
  }
  const metrics = element("div", "metric-grid");
  const basicStats = site.insights.basicStats || {};
  metrics.append(
    metric(text("site.submissions"), number(basicStats.monthlySubmissions)),
    metric(text("site.completion"), percent(basicStats.completionRate))
  );
  article.append(metrics);

  const dropoffs = deriveDropoffs(site.insights);
  article.append(sectionList(text("site.dropoff"), dropoffs, text("site.noDropoff")));
  const allSuggestions = deriveSuggestions(site.insights);
  article.append(sectionList(text("site.suggestions"), allSuggestions, text("site.noSuggestions")));
  return article;
}

function metric(label, value) {
  const box = element("div", "dashboard-metric");
  box.append(element("span", "", label), element("strong", "", value));
  return box;
}

function sectionList(title, items, emptyText) {
  const section = element("section", "site-detail");
  section.append(element("h3", "", title));
  if (!items.length) {
    section.append(element("p", "form-status", emptyText));
    return section;
  }
  const list = element("ul");
  for (const item of items) list.append(element("li", "", item));
  section.append(list);
  return section;
}

function deriveDropoffs(insights) {
  const fields = [
    ...(Array.isArray(insights.basicStats?.topDropoffFields) ? insights.basicStats.topDropoffFields : []),
    ...(Array.isArray(insights.forms)
      ? insights.forms.flatMap((form) => form.basicStats?.topDropoffFields || [])
      : [])
  ];
  return fields
    .map((field) => ({
      label: field.label || field.selector || field.name || "Field",
      count: Number(field.count ?? field.failures ?? field.dropoffs ?? field.abandons ?? 0)
    }))
    .filter((field) => field.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((field) => `${field.label} — ${number(field.count)}`);
}

function deriveSuggestions(insights) {
  const suggestions = [
    ...(Array.isArray(insights.suggestions) ? insights.suggestions : []),
    ...(Array.isArray(insights.forms) ? insights.forms.flatMap((form) => form.suggestions || []) : [])
  ];
  return suggestions.map((item) => item.title || item.reason || item.message || item.summary).filter(Boolean);
}

function element(tag, className = "", content = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== "") node.textContent = content;
  return node;
}

function number(value) {
  return new Intl.NumberFormat(dashboardState.lang).format(Number(value || 0));
}

function percent(value) {
  const numeric = Number(value || 0);
  return `${Math.round((numeric <= 1 ? numeric * 100 : numeric) * 10) / 10}%`;
}

function showPageError(message) {
  document.querySelector("[data-page-error]").textContent = message;
}
