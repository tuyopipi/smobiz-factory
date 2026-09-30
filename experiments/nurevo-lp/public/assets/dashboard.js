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
    "site.upgrade": "Proにする（$20/月）",
    "checkout.success": "Proプランのお申し込みが完了しました。反映まで少し時間がかかる場合があります。",
    "checkout.cancelled": "Proプランのお申し込みをキャンセルしました。",
    "checkout.error": "決済を開始できませんでした。",
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
    "site.upgrade": "Upgrade to Pro ($20/mo)",
    "checkout.success": "Your Pro plan purchase is complete. It may take a moment to appear here.",
    "checkout.cancelled": "Your Pro plan purchase was cancelled.",
    "checkout.error": "Could not start checkout.",
    "error.load": "Could not load the dashboard."
  }
};

const config = window.NUREVO_CONFIG || {};
const dashboardState = { lang: localStorage.getItem("nurevo-lang") || "en", sites: [] };
const apiBase = (config.apiBase || "").replace(/\/$/, "");

document.addEventListener("DOMContentLoaded", async () => {
  applyDashboardLanguage(dashboardState.lang);
  showCheckoutStatus();
  document.querySelector("[data-lang-toggle]").addEventListener("click", () => {
    applyDashboardLanguage(dashboardState.lang === "ja" ? "en" : "ja");
    renderSites();
  });
  document.querySelector("[data-add-site]")?.addEventListener("click", openPlacesRegistration);
  document.querySelector("[data-auth-form]").addEventListener("submit", requestMagicLink);
  document.querySelector("[data-logout]").addEventListener("click", logout);
  await consumeToken();
  await loadSession();
});

function text(key) {
  return dashboardI18n[dashboardState.lang][key] || key;
}

function openPlacesRegistration() {
  if (document.querySelector("[data-places-modal]")) return;
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.dataset.placesModal = "1";
  modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="places-title"><h2 id="places-title">店舗を登録</h2><p class="note">店名＋エリアで検索（例: ○○美容室 渋谷）。Googleマップの情報から自動取得します。</p><form data-places-search><label>店名＋エリア<input type="search" name="q" required minlength="2" placeholder="例：○○美容室 渋谷" aria-describedby="places-search-help"><small id="places-search-help" class="field-help">候補を選ぶと、店舗情報が自動入力されます。</small></label><button class="button primary" type="submit">候補を検索</button></form><div data-places-results role="listbox" aria-live="polite"></div><form data-places-register hidden><p class="note">選択した店舗情報</p><strong data-places-name></strong><p data-places-info></p><p class="field-help">業種・住所・電話・営業時間・価格帯：Googleマップから自動取得</p><fieldset class="install-options"><legend>導入タイプ</legend><label class="option-card"><span><input type="radio" name="install_type" value="hosted" checked> <b>ホスト</b></span><small>自分のサイトが無い店。URL不要。Nurevoが nurevo.jp/s/slug にページを作成。</small></label><label class="option-card"><span><input type="radio" name="install_type" value="wp"> <b>ワードプレス</b></span><small>WordPressサイトがある店。URL必要。プラグインでschema出力。</small></label><label class="option-card"><span><input type="radio" name="install_type" value="tag"> <b>タグ設置</b></span><small>一般的なサイトがある店。URL必要。JSタグを設置。</small></label></fieldset><label>URL <span class="field-help">店舗が持つ自分のサイトのアドレス。ホストの場合は不要</span><input name="url" type="url" placeholder="https://example.jp" autocomplete="url"><small data-url-error class="validation-error" role="alert"></small></label><button class="button primary" type="submit">この店舗を登録</button><p data-places-status class="form-status" aria-live="polite"></p></form><button type="button" class="button" data-places-close>閉じる</button></div>`;
  document.body.append(modal);
  let selected = null;
  modal.querySelector("[data-places-close]").onclick = () => modal.remove();
  modal.querySelector("[data-places-search]").onsubmit = async (event) => {
    event.preventDefault();
    const results = modal.querySelector("[data-places-results]");
    results.textContent = "検索中…";
    try {
      const q = String(new FormData(event.currentTarget).get("q") || "").trim();
      const response = await fetch(`${apiBase}/api/places/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.error || "候補を取得できませんでした");
      results.replaceChildren(...(body.places || []).map((place) => {
        const button = document.createElement("button");
        button.type = "button"; button.className = "button"; button.style.display = "block"; button.style.margin = "8px 0";
        button.textContent = `${place.name} — ${place.type || ""} / ${place.address || ""}`;
        button.setAttribute("role", "option");
        button.onclick = () => { selected = place; modal.querySelector("[data-places-name]").textContent = place.name; modal.querySelector("[data-places-info]").textContent = [place.type, place.address].filter(Boolean).join(" / "); modal.querySelector("[data-places-register]").hidden = false; modal.querySelector("[data-places-register]").scrollIntoView({ behavior: "smooth", block: "nearest" }); };
        return button;
      }));
      if (!(body.places || []).length) results.textContent = "候補を取得できませんでした。検索語を変えて再試行してください。";
    } catch (error) { results.textContent = error.message; }
  };
  modal.querySelector("[data-places-register]").onsubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget); const status = modal.querySelector("[data-places-status]"); const url = String(form.get("url") || "").trim(); const installType = String(form.get("install_type") || ""); const urlError = modal.querySelector("[data-url-error]");
    urlError.textContent = "";
    if (!selected) { status.textContent = "Googleマップの候補を1件選択してください。"; return; }
    if (!installType) { status.textContent = "導入タイプを選択してください。"; return; }
    if (installType !== "hosted" && !url) { urlError.textContent = "ワードプレス／タグ設置では店舗サイトのURLが必要です。"; return; }
    if (url && !/^https?:\/\//i.test(url)) { urlError.textContent = "URLは https:// または http:// から入力してください。"; return; }
    status.textContent = "登録中…";
    try {
      const response = await fetch(`${apiBase}/api/sites`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: selected.name, place_id: selected.id, install_type: installType, url }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "登録に失敗しました");
      status.textContent = "登録しました"; setTimeout(() => { modal.remove(); loadSession(); }, 500);
    } catch (error) { status.textContent = error.message; }
  };
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
    const meResponse = await fetch(`${apiBase}/api/me`, { credentials: "include", cache: "no-store" });
    if (meResponse.status === 401) return showSignedOut();
    const me = await meResponse.json();
    if (!meResponse.ok || !me.email) return showSignedOut();
    document.querySelector("[data-email]").textContent = me.email;
    document.querySelector("[data-logout]").hidden = false;
    const response = await fetch(`${apiBase}/api/auth/session`, { credentials: "include" });
    if (response.status === 401) return showSignedOut();
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "session_failed");
    document.querySelector("[data-auth-panel]").hidden = true;
    document.querySelector("[data-dashboard]").hidden = false;
    document.querySelector("[data-logout]").hidden = false;
    document.querySelector("[data-email]").textContent = me.email;
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
  location.href = "https://nurevo.jp/";
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
  if (site.plan !== "pro") {
    const actions = element("div", "site-actions");
    const button = element("button", "button primary", text("site.upgrade"));
    const status = element("p", "form-status");
    button.type = "button";
    button.addEventListener("click", () => startCheckout(site, button, status));
    status.setAttribute("aria-live", "polite");
    actions.append(button, status);
    article.append(actions);
  }
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

async function startCheckout(site, button, status) {
  button.disabled = true;
  status.className = "form-status";
  status.textContent = "";
  try {
    const response = await fetch(`${apiBase}/api/billing/checkout`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteKey: site.siteKey })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok || !payload.url) {
      throw new Error(payload.error || "checkout_failed");
    }
    location.href = payload.url;
  } catch (error) {
    status.className = "form-status error";
    status.textContent = `${text("checkout.error")} ${error.message}`;
    button.disabled = false;
  }
}

function showCheckoutStatus() {
  const checkout = new URL(location.href).searchParams.get("checkout");
  if (checkout !== "success" && checkout !== "cancelled") return;
  const messageKey = `checkout.${checkout}`;
  const notice = element(
    "p",
    `form-status ${checkout === "success" ? "success" : ""}`,
    text(messageKey)
  );
  notice.dataset.i18n = messageKey;
  notice.setAttribute("role", "status");
  document.querySelector(".dashboard-intro").append(notice);
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
