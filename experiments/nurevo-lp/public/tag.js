(() => {
  const TAG_VERSION = "2026-08-20.2";
  const SCRIPT_ELEMENT = document.currentScript;
  const TAG_ORIGIN = new URL(SCRIPT_ELEMENT?.src || location.href, location.href).origin;
  const SITE_KEY = SCRIPT_ELEMENT?.dataset.webmcpSiteKey || SCRIPT_ELEMENT?.dataset.k || new URL(SCRIPT_ELEMENT?.src || location.href, location.href).searchParams.get("site_key") || "";
  const DEBUG = SCRIPT_ELEMENT?.dataset.webmcpDebug === "1" || new URLSearchParams(location.search).get("webmcp_debug") === "1";
  const toolControllers = new Map();
  const executionHistory = new Map();
  const startedAt = performance.now();
  const formStates = new Map();
  const excludedForms = [];
  const FOOTPRINT_EVENT_KEYS = new Set(["type", "selector", "key", "timestampOffsetMs", "errorText", "validity", "changed", "beforeLength", "afterLength", "errorName", "toolName"]);
  const VALIDITY_KEYS = new Set(["valueMissing", "typeMismatch", "patternMismatch", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "stepMismatch", "badInput", "customError", "valid"]);
  let latestMcpDefinitions = [];

  recordAiReferral();

  function recordAiReferral() {
    if (!SITE_KEY) return;
    let host = "";
    try { host = new URL(document.referrer).hostname.toLowerCase(); } catch (_) { return; }
    const engines = {
      "chatgpt.com":"chatgpt", "perplexity.ai":"perplexity", "gemini.google.com":"gemini",
      "copilot.microsoft.com":"copilot", "claude.ai":"claude", "you.com":"you",
      "phind.com":"phind", "kagi.com":"kagi", "duckduckgo.com":"duckduckgo-ai",
      "meta.ai":"meta-ai", "grok.com":"grok", "deepseek.com":"deepseek", "chat.mistral.ai":"mistral"
    };
    const engine = Object.entries(engines).find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1];
    if (!engine) return;
    const body = JSON.stringify({ site_key: SITE_KEY, engine });
    const endpoint = new URL("/api/site/ai-referral", TAG_ORIGIN).href;
    if (navigator.sendBeacon) navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }));
    else fetch(endpoint, { method: "POST", headers: { "content-type": "text/plain" }, body, mode: "cors", credentials: "omit", keepalive: true }).catch(() => {});
  }

  log(`tag.js loaded version=${TAG_VERSION}`);
  boot().catch((error) => log(`tag.js error: ${error?.stack || error}`));

  document.addEventListener("toolchange", async (event) => {
    log(`toolchange received: ${JSON.stringify(event.detail ?? {})}`);
    await registerTools({ reason: "toolchange" });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendFootprint("abandoned");
  });
  window.addEventListener("pagehide", () => sendFootprint("abandoned"));

  async function boot() {
    const auth = await checkAuthorization();
    if (auth.registered === true && auth.quality === "high") {
      await sendPageMeta();
      await fetchAndApplyAeoContentSchemas();
    }
    await registerTools({ reason: "initial-load", auth });
    attachFootprintListeners();
  }

  async function registerTools({ reason, auth: providedAuth = null }) {
    const modelContext = getModelContext();
    const detectedForms = collectEligibleFormStates();
    if (!detectedForms.length) {
      for (const name of [...toolControllers.keys()]) await unregisterTool(name, "no-form-on-page");
      formStates.clear();
      latestMcpDefinitions = [];
      window.__webmcpDemo = {
        available: false,
        noForm: true,
        reason: "no eligible form found",
        excludedForms,
        tagVersion: TAG_VERSION
      };
      log("no eligible form found; WebMCP tag is idle");
      return;
    }

    const auth = providedAuth || await checkAuthorization();
    const activeKeys = new Set(detectedForms.map((state) => state.formKey));
    for (const key of [...formStates.keys()]) {
      if (!activeKeys.has(key)) formStates.delete(key);
    }
    const definitions = [];
    for (const state of detectedForms) {
      formStates.set(state.formKey, {
        ...(formStates.get(state.formKey) || {}),
        ...state,
        events: formStates.get(state.formKey)?.events || [],
        terminalFootprintSent: formStates.get(state.formKey)?.terminalFootprintSent || false,
        lastFootprintSignature: formStates.get(state.formKey)?.lastFootprintSignature || ""
      });
      const storedState = formStates.get(state.formKey);
      const mcpDefinition = await fetchMcpDefinition(auth, storedState);
      storedState.mcpDefinition = mcpDefinition;
      definitions.push(mcpDefinition);
      applyDeclarativeMetadata(mcpDefinition.webmcp?.declarative || mcpDefinition.tools?.[0]?.xWebMcpClientHints?.declarative, storedState);
      applyAutofill(mcpDefinition.autofill ?? [], storedState);
    }
    latestMcpDefinitions = definitions;
    applyAeoMetadata(definitions.map((definition) => definition.aeo).filter(Boolean));
    attachFootprintListeners();
    if (!modelContext?.registerTool) {
      log("WebMCP unavailable: document.modelContext/registerTool not found; autofill still active");
      window.__webmcpDemo = {
        available: false,
        auth,
        mcpDefinition: definitions[0],
        mcpDefinitions: definitions,
        forms: [...formStates.values()].map(formStateForDebug),
        excludedForms,
        experiment: definitions[0]?.experiment,
        declarativeApplied: definitions.some((definition) => Boolean(definition.webmcp?.declarative)),
        tagVersion: TAG_VERSION
      };
      return;
    }

    const tools = [...formStates.values()].flatMap((state) => hydrateTools(state, state.mcpDefinition?.tools ?? []));
    const desiredNames = new Set(tools.map((tool) => tool.name));

    for (const name of [...toolControllers.keys()]) {
      if (!desiredNames.has(name)) await unregisterTool(name, "not-needed-after-refresh");
    }

    for (const tool of tools) {
      if (shouldSkipImperativeTool(tool)) {
        log(`skipped imperative registration for ${tool.name}; native/declarative conflict detected`);
        continue;
      }
      await registerOrReplaceTool(modelContext, tool, { reason, quality: auth.quality });
      log(`registered ${tool.name} quality=${auth.quality} reason=${reason}`);
    }

    window.__webmcpDemo = {
      available: true,
      api: document.modelContext ? "document.modelContext" : "navigator.modelContext",
      auth,
      mcpDefinition: definitions[0],
      mcpDefinitions: definitions,
      forms: [...formStates.values()].map(formStateForDebug),
      excludedForms,
      registeredTools: [...toolControllers.keys()],
      conflicts: detectNativeWebMcpConflicts(tools),
      tagVersion: TAG_VERSION
    };
  }

  async function registerOrReplaceTool(modelContext, tool, { reason, quality }) {
    await unregisterTool(tool.name, `replace-before-register:${reason}:${quality}`);

    const controller = new AbortController();
    try {
      await modelContext.registerTool(tool, { signal: controller.signal });
      toolControllers.set(tool.name, controller);
    } catch (error) {
      controller.abort();
      log(`register failed ${tool.name}: ${error?.name || "Error"} ${error?.message || error}`);
      recordClientEvent("webmcp-register-failed", {
        toolName: tool.name,
        errorName: error?.name || "Error",
        errorText: error?.message || String(error)
      });
    }
  }

  async function unregisterTool(name, reason) {
    const controller = toolControllers.get(name);
    if (controller) {
      controller.abort();
      toolControllers.delete(name);
      log(`unregistered ${name} via AbortController reason=${reason}`);
      await nextTask();
      return;
    }

    const modelContext = getModelContext();
    if (modelContext?.unregisterTool) {
      try {
        await modelContext.unregisterTool(name);
        log(`unregistered ${name} via deprecated unregisterTool reason=${reason}`);
        await nextTask();
      } catch (error) {
        log(`deprecated unregisterTool failed ${name}: ${error?.message || error}`);
      }
    }
  }

  function nextTask() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  function getModelContext() {
    return document.modelContext || navigator.modelContext;
  }

  function shouldSkipImperativeTool(tool) {
    const mode = tool.xWebMcpClientHints?.registrationMode || latestMcpDefinitions[0]?.webmcp?.registrationMode || "auto";
    if (mode === "imperative") return false;
    if (mode === "declarative") return true;
    return detectNativeWebMcpConflicts([tool]).length > 0;
  }

  function detectNativeWebMcpConflicts(tools) {
    const desired = new Set(tools.map((tool) => tool.name));
    return [...document.querySelectorAll("[toolname]")]
      .filter((element) => element.dataset.webmcpDeclarativeOwner !== TAG_VERSION)
      .map((element) => ({ selector: cssSelector(element), toolname: element.getAttribute("toolname") }))
      .filter((item) => item.toolname && desired.has(item.toolname));
  }

  async function checkAuthorization() {
    try {
      const response = await fetch(apiUrl("/api/agent-authorization"), { cache: "no-store" });
      if (!response.ok) throw new Error(`auth failed ${response.status}`);
      return await response.json();
    } catch (error) {
      log(`authorization fallback to basic: ${error.message}`);
      return { registered: false, quality: "basic", reason: "authorization request failed" };
    }
  }

  async function fetchMcpDefinition(auth, state) {
    const formStructure = state.formStructure;
    const response = await fetch(apiUrl("/api/mcp-definition"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        auth,
        site: {
          host: location.host,
          pathname: location.pathname,
          title: document.title
        },
        siteKey: SITE_KEY,
        formStructure
      })
    });
    if (!response.ok) throw new Error(`mcp-definition failed ${response.status}`);
    return response.json();
  }

  function collectPageMeta() {
    const metaContent = (selector) => document.querySelector(selector)?.getAttribute("content")?.trim() || "";
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || "";
    const headings = [...document.querySelectorAll("h1, h2, h3")]
      .slice(0, 30)
      .map((heading) => ({
        level: heading.tagName.toLowerCase(),
        text: String(heading.textContent || "").trim().slice(0, 200)
      }))
      .filter((heading) => heading.text);
    const jsonLd = [];
    let jsonLdBytes = 0;
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      const value = String(script.textContent || "").trim();
      if (!value) continue;
      const remaining = 10 * 1024 - jsonLdBytes;
      if (remaining <= 0) break;
      const truncated = truncateUtf8(value, remaining);
      if (truncated) {
        jsonLd.push(truncated);
        jsonLdBytes += new TextEncoder().encode(truncated).byteLength;
      }
    }
    return {
      title: String(document.title || "").slice(0, 300),
      description: metaContent('meta[name="description"]').slice(0, 500),
      openGraph: {
        title: metaContent('meta[property="og:title"]').slice(0, 300),
        description: metaContent('meta[property="og:description"]').slice(0, 500),
        type: metaContent('meta[property="og:type"]').slice(0, 100),
        siteName: metaContent('meta[property="og:site_name"]').slice(0, 300)
      },
      canonicalUrl: canonicalUrl.slice(0, 2048),
      lang: String(document.documentElement.lang || "").slice(0, 35),
      headings,
      jsonLd
    };
  }

  async function sendPageMeta() {
    try {
      const response = await fetch(apiUrl("/api/page-meta"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          siteKey: SITE_KEY,
          host: location.host,
          pathname: location.pathname,
          meta: collectPageMeta()
        })
      });
      if (!response.ok) throw new Error(`page-meta failed ${response.status}`);
      log("page metadata stored");
    } catch (error) {
      log(`page metadata was not stored: ${error?.message || error}`);
    }
  }

  async function fetchAndApplyAeoContentSchemas() {
    try {
      const url = new URL("/api/aeo-schemas", TAG_ORIGIN);
      url.searchParams.set("site_key", SITE_KEY);
      url.searchParams.set("host", location.host);
      url.searchParams.set("pathname", location.pathname);
      const response = await fetch(url.href, { cache: "no-store" });
      if (!response.ok) throw new Error(`aeo-schemas failed ${response.status}`);
      const payload = await response.json();
      applyAeoContentSchemas(payload.schemas);
    } catch (error) {
      log(`AEO content schemas were not applied: ${error?.message || error}`);
    }
  }

  function applyAeoContentSchemas(value) {
    const schemas = Array.isArray(value)
      ? value.filter((schema) => schema && typeof schema === "object" && !Array.isArray(schema))
      : [];
    const id = "webmcp-aeo-content";
    let script = document.getElementById(id);
    if (!schemas.length) {
      script?.remove();
      window.__webmcpAeoContent = [];
      log("AEO content schemas empty");
      return;
    }
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    const structuredData = schemas.length === 1
      ? schemas[0]
      : {
          "@context": "https://schema.org",
          "@graph": schemas.map((schema) => {
            const { "@context": _context, ...item } = schema;
            return item;
          })
        };
    script.textContent = JSON.stringify(structuredData);
    window.__webmcpAeoContent = schemas;
    log(`AEO content schemas applied count=${schemas.length}`);
  }

  function truncateUtf8(value, maxBytes) {
    const bytes = new TextEncoder().encode(String(value || ""));
    if (bytes.byteLength <= maxBytes) return String(value || "");
    return new TextDecoder().decode(bytes.slice(0, maxBytes));
  }

  function applyDeclarativeMetadata(declarative, state) {
    if (!declarative) return;
    try {
      const form = state?.form || document.querySelector(declarative.formSelector || "form");
      if (!form) return;
      if (!form.getAttribute("toolname") || form.dataset.webmcpDeclarativeOwner === TAG_VERSION) form.setAttribute("toolname", declarative.toolname);
      if (!form.getAttribute("tooldescription") || form.dataset.webmcpDeclarativeOwner === TAG_VERSION) form.setAttribute("tooldescription", declarative.tooldescription);
      form.dataset.webmcpDeclarativeOwner = TAG_VERSION;
      for (const param of declarative.parameters ?? []) {
        const element = queryWithinForm(form, param.selector);
        if (!element) continue;
        if (element.getAttribute("toolparamdescription") && element.dataset.webmcpDeclarativeOwner !== TAG_VERSION) continue;
        element.setAttribute("toolparamdescription", param.toolparamdescription);
        element.dataset.webmcpDeclarativeOwner = TAG_VERSION;
      }
      window.__webmcpDeclarative = declarative;
      log(`declarative WebMCP attributes applied toolname=${declarative.toolname}`);
    } catch (error) {
      recordClientEvent("webmcp-declarative-failed", { errorText: error?.message || String(error) });
      log(`declarative metadata failed: ${error?.message || error}`);
    }
  }

  function applyAeoMetadata(aeoItems) {
    const items = Array.isArray(aeoItems) ? aeoItems : [aeoItems].filter(Boolean);
    if (!items.length) return;
    const id = "webmcp-aeo-metadata";
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(items.length === 1 ? items[0].structuredData : { "@context": "https://schema.org", "@graph": items.map((item) => item.structuredData) });
    window.__webmcpAeo = items.length === 1 ? items[0] : items;
    log(`AEO metadata applied forms=${items.length}`);
  }

  function collectEligibleFormStates() {
    excludedForms.length = 0;
    return [...document.querySelectorAll("form")]
      .map((form, index) => {
        const eligibility = formEligibility(form);
        if (!eligibility.eligible) {
          excludedForms.push({
            selector: cssSelector(form),
            reason: eligibility.reason,
            visibleFieldCount: eligibility.visibleFieldCount
          });
          return null;
        }
        const formUid = form.id || form.getAttribute("name") || `webmcp_form_${index + 1}`;
        form.dataset.webmcpFormUid = formUid;
        const formKey = `${index}:${formUid}`;
        return {
          form,
          formKey,
          formUid,
          formIndex: index,
          formStructure: collectFormStructure(form, { formUid, formIndex: index })
        };
      })
      .filter(Boolean);
  }

  function collectFormStructure(form, { formUid, formIndex }) {
    const fields = form ? [...form.querySelectorAll("input, select, textarea, button")] : [];
    return {
      formId: form?.id || form?.getAttribute("name") || formUid || null,
      formName: form?.getAttribute("name") || form?.getAttribute("aria-label") || labelForForm(form) || null,
      formUid,
      formIndex,
      formSelector: cssSelector(form),
      nativeWebMcp: [...document.querySelectorAll("[toolname]")]
        .map((element) => ({
          selector: cssSelector(element),
          toolname: element.getAttribute("toolname"),
          tooldescription: element.getAttribute("tooldescription")
        })),
      fields: fields.map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const label = labelForElement(element);
        return {
          tag: element.tagName.toLowerCase(),
          selector: cssSelector(element),
          id: element.id || null,
          name: element.getAttribute("name"),
          type: element.getAttribute("type") || (element.tagName.toLowerCase() === "select" ? "select" : "text"),
          label,
          placeholder: element.getAttribute("placeholder"),
          hidden: element.hidden || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || rect.width === 0 || rect.height === 0,
          visible: style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0,
          options: element.tagName.toLowerCase() === "select"
            ? [...element.options].map((option) => ({ value: option.value, text: option.textContent?.trim() }))
            : undefined
        };
      }).filter((field) => field.selector && !field.hidden)
    };
  }

  function formEligibility(form) {
    if (form.closest("#wpadminbar, .screen-reader-response")) return { eligible: false, reason: "wordpress-admin-or-screen-reader-response", visibleFieldCount: 0 };
    if (!isVisibleElement(form) && ![...form.querySelectorAll("input, select, textarea, button")].some(isVisibleElement)) {
      return { eligible: false, reason: "hidden-form", visibleFieldCount: 0 };
    }
    const fields = [...form.querySelectorAll("input, select, textarea")]
      .filter((element) => element.type !== "hidden" && isVisibleElement(element));
    if (fields.some((element) => String(element.type || "").toLowerCase() === "password")) {
      return { eligible: false, reason: "login-password-form", visibleFieldCount: fields.length };
    }
    const meaningfulFields = fields.filter((element) => !["submit", "button", "reset", "image"].includes(String(element.type || "").toLowerCase()));
    if (isSearchOnlyForm(form, meaningfulFields)) {
      return { eligible: false, reason: "search-only-form", visibleFieldCount: meaningfulFields.length };
    }
    if (meaningfulFields.length <= 1) {
      return { eligible: false, reason: "too-few-fields", visibleFieldCount: meaningfulFields.length };
    }
    return { eligible: true, reason: "eligible", visibleFieldCount: meaningfulFields.length };
  }

  function isSearchOnlyForm(form, fields) {
    const text = [form.role, form.getAttribute("role"), form.getAttribute("aria-label"), form.id, form.getAttribute("name"), form.getAttribute("action")]
      .filter(Boolean)
      .join(" ");
    const formLooksSearch = /search|検索/i.test(text);
    const allSearchFields = fields.every((element) => {
      const fieldText = [element.type, element.name, element.id, element.placeholder, element.getAttribute("aria-label"), labelForElement(element)]
        .filter(Boolean)
        .join(" ");
      return element.type === "search" || /(^|[_-])(s|q)([_-]|$)/i.test(element.name || "") || /search|検索/i.test(fieldText);
    });
    return fields.length <= 2 && (formLooksSearch || allSearchFields) && allSearchFields;
  }

  function isVisibleElement(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return !element.hidden && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
  }

  function labelForForm(form) {
    if (!form) return "";
    const labelledBy = form.getAttribute("aria-labelledby");
    if (labelledBy) {
      return labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(" ");
    }
    const heading = form.querySelector("h1,h2,h3,legend");
    return heading?.textContent?.trim() || "";
  }

  function labelForElement(element) {
    const explicit = element.id ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent?.trim() : "";
    if (explicit) return explicit;
    const wrapped = element.closest("label")?.textContent?.trim();
    if (wrapped) return wrapped;
    const aria = element.getAttribute("aria-label") || "";
    if (aria) return aria.trim();
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      return labelledBy.split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim())
        .filter(Boolean)
        .join(" ");
    }
    return "";
  }

  function applyAutofill(helpers, state) {
    for (const helper of helpers) {
      const element = queryWithinForm(state.form, helper.selector);
      if (!element) continue;
      element.dataset.webmcpKey = helper.key;
      element.dataset.webmcpFormKey = state.formKey;
      element.dataset.webmcpTransform = helper.transform || "";
      element.dataset.webmcpFormat = helper.format || "";
      element.dataset.webmcpValueType = helper.valueType || "";
      if (helper.inputMode && "inputMode" in element) element.inputMode = helper.inputMode;
      if (helper.pattern && !element.getAttribute("pattern")) element.setAttribute("pattern", helper.pattern);
      if (helper.required) element.dataset.webmcpRequired = "1";
      if (helper.helperText) element.title = helper.helperText;
      if (helper.example) attachSuggestion(element, helper);
      element.removeEventListener("blur", normalizeOnBlur);
      element.addEventListener("blur", normalizeOnBlur);
    }
    log(`autofill helpers applied: ${helpers.length} form=${state.formUid}`);
  }

  function attachSuggestion(element, helper) {
    if (!helper.example || element.tagName.toLowerCase() === "select") return;
    const listId = `webmcp-suggest-${helper.key}`;
    let list = document.getElementById(listId);
    if (!list) {
      list = document.createElement("datalist");
      list.id = listId;
      document.body.appendChild(list);
    }
    list.replaceChildren(...[helper.example].map((value) => {
      const option = document.createElement("option");
      option.value = value;
      return option;
    }));
    element.setAttribute("list", listId);
  }

  function normalizeOnBlur(event) {
    const element = event.currentTarget;
    const beforeLength = element.value.length;
    const normalized = normalizeValue(element.value, element.dataset.webmcpTransform, element.dataset.webmcpValueType);
    if (normalized !== element.value) {
      element.value = normalized;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      recordEvent("autofill-normalized", element, {
        changed: true,
        beforeLength,
        afterLength: normalized.length
      });
    }
  }

  function normalizeValue(value, transform, valueType) {
    if (!transform) return value;
    if (transform === "digits_only" || transform === "number_digits") return String(value).replace(/\D/g, "");
    if (transform === "digits_only_if_numeric_error") {
      return /phone|tel|postal|zip|number/i.test(valueType) ? String(value).replace(/\D/g, "") : value;
    }
    if (transform === "date_iso") {
      const text = String(value).trim();
      const jp = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
      if (jp) return `${jp[1]}-${jp[2].padStart(2, "0")}-${jp[3].padStart(2, "0")}`;
      return text;
    }
    if (transform === "trim") return String(value).trim();
    return value;
  }

  function attachFootprintListeners() {
    for (const state of formStates.values()) attachFootprintListenersForForm(state);
  }

  function attachFootprintListenersForForm(state) {
    const form = state.form;
    if (!form) return;
    for (const element of form.querySelectorAll("input, select, textarea")) {
      if (element.dataset.webmcpFootprintAttached === "1") continue;
      element.dataset.webmcpFootprintAttached = "1";
      element.addEventListener("invalid", (event) => {
        recordEvent("invalid", event.currentTarget, { errorText: validationMessage(event.currentTarget), validity: validitySnapshot(event.currentTarget) });
      }, true);
      element.addEventListener("blur", (event) => {
        if (!event.currentTarget.checkValidity()) {
          recordEvent("invalid", event.currentTarget, { errorText: validationMessage(event.currentTarget), validity: validitySnapshot(event.currentTarget) });
        }
      });
    }
    if (form.dataset.webmcpFootprintSubmitAttached === "1") return;
    form.dataset.webmcpFootprintSubmitAttached = "1";
    if (form.classList.contains("wpcf7-form") || form.closest(".wpcf7")) {
      const root = form.closest(".wpcf7") || form;
      root.addEventListener("wpcf7mailsent", () => sendFootprint("success", state));
      root.addEventListener("wpcf7invalid", () => sendFootprint("failure", state));
      root.addEventListener("wpcf7mailfailed", () => sendFootprint("failure", state));
      root.addEventListener("wpcf7spam", () => sendFootprint("failure", state));
      return;
    }
    form.addEventListener("submit", () => {
      const result = document.querySelector("#result");
      setTimeout(() => {
        const status = result?.textContent?.includes("SUCCESS") ? "success" : result?.textContent?.includes("ERROR") ? "failure" : "unknown";
        sendFootprint(status, state);
      }, 0);
    });
  }

  function recordEvent(type, element, detail = {}) {
    const state = formStateForElement(element);
    if (!state) return;
    state.events.push(sanitizeFootprintEvent({
      type,
      selector: element.id ? `#${element.id}` : element.name ? `${element.tagName.toLowerCase()}[name="${element.name}"]` : "",
      key: element.dataset.webmcpKey || element.name || element.id || "",
      timestampOffsetMs: Math.round(performance.now() - startedAt),
      errorText: detail.errorText || "",
      validity: detail.validity || undefined,
      changed: detail.changed,
      beforeLength: detail.beforeLength,
      afterLength: detail.afterLength
    }));
    if (state.events.length > 100) state.events.shift();
  }

  function recordClientEvent(type, detail = {}) {
    const state = detail.formKey ? formStates.get(detail.formKey) : [...formStates.values()][0];
    if (!state) return;
    state.events.push(sanitizeFootprintEvent({
      type,
      selector: "",
      key: "",
      timestampOffsetMs: Math.round(performance.now() - startedAt),
      errorText: detail.errorText || "",
      errorName: detail.errorName,
      toolName: detail.toolName
    }));
    if (state.events.length > 100) state.events.shift();
  }

  function validitySnapshot(element) {
    const validity = element.validity;
    return {
      valueMissing: validity.valueMissing,
      typeMismatch: validity.typeMismatch,
      patternMismatch: validity.patternMismatch,
      tooShort: validity.tooShort,
      tooLong: validity.tooLong,
      rangeUnderflow: validity.rangeUnderflow,
      rangeOverflow: validity.rangeOverflow,
      stepMismatch: validity.stepMismatch,
      badInput: validity.badInput,
      customError: validity.customError,
      valid: validity.valid
    };
  }

  function validationMessage(element) {
    return element.validationMessage || element.getAttribute("aria-errormessage") || "";
  }

  function sendFootprint(status, state = null) {
    if (!state) {
      for (const candidate of formStates.values()) sendFootprint(status, candidate);
      return;
    }
    if (!state.formStructure || !state.mcpDefinition) return;
    if (state.terminalFootprintSent && status === "abandoned") return;
    const signature = `${status}:${state.mcpDefinition.formHash}:${state.events.length}`;
    if (signature === state.lastFootprintSignature) return;
    state.lastFootprintSignature = signature;
    if (status === "success" || status === "failure") state.terminalFootprintSent = true;
    const body = JSON.stringify({
      siteKey: SITE_KEY,
      site: { host: location.host, pathname: location.pathname },
      formHash: state.mcpDefinition.formHash,
      experiment: state.mcpDefinition.experiment,
      learnedRuleIds: state.mcpDefinition.webmcp?.learnedRuleIds || [],
      formStructure: state.formStructure,
      result: {
        status,
        completedStep: inferCompletedStep(state),
        durationMs: Math.round(performance.now() - startedAt)
      },
      events: state.events.map(sanitizeFootprintEvent)
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(apiUrl("/api/footprint"), new Blob([body], { type: "application/json" }));
      return;
    }
    fetch(apiUrl("/api/footprint"), { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  }

  function apiUrl(path) {
    const url = new URL(path, TAG_ORIGIN);
    if (SITE_KEY && path === "/api/agent-authorization") url.searchParams.set("site_key", SITE_KEY);
    return url.href;
  }

  function inferCompletedStep(state) {
    const form = state?.form;
    const required = [...(form?.querySelectorAll("input, select, textarea") || [])].filter((element) => element.required || element.dataset.webmcpRequired === "1" || element.getAttribute("aria-required") === "true");
    if (!required.length) return 0;
    return required.filter((element) => element.value).length;
  }

  function hydrateTools(state, definitions) {
    return definitions.map((definition) => ({
      ...definition,
      execute: async (args) => executeGeneratedTool(definition, args, state)
    }));
  }

  async function executeGeneratedTool(definition, args, state) {
    const duplicate = duplicateGuard(definition, args, state);
    if (duplicate) return duplicate;
    const strategy = definition.xWebMcpClientHints?.fillStrategy ?? [];
    const updated = [];
    for (const item of strategy) {
      if (!(item.key in args)) continue;
      if (setValue(state, item.selector, args[item.key])) updated.push(item.key);
    }
    const validationErrors = collectValidationErrors(state);
    const ok = validationErrors.length === 0;
    return mcpResult({
      ok,
      status: ok ? "filled" : "validation_error",
      message: ok ? `Executed ${definition.name}` : `Executed ${definition.name}, but validation errors remain.`,
      toolName: definition.name,
      state,
      updated,
      validationErrors
    });
  }

  function setValue(state, selector, value) {
    const element = queryWithinForm(state.form, selector);
    if (!element || value === undefined || value === null) return false;
    element.value = String(value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function duplicateGuard(definition, args, state) {
    const guard = definition.xWebMcpClientHints?.submissionGuard;
    if (!guard?.enabled) return null;
    const key = `${definition.name}:${stableStringify(args)}`;
    const now = Date.now();
    const previous = executionHistory.get(key);
    executionHistory.set(key, now);
    const duplicateWindowMs = Number(guard.duplicateWindowMs || 5000);
    if (previous && now - previous < duplicateWindowMs && definition.annotations?.destructiveHint && args?.__submit === true) {
      return mcpResult({
        ok: false,
        status: "duplicate_guarded",
        message: "Duplicate destructive execution was blocked by the WebMCP guard.",
        toolName: definition.name,
        state,
        validationErrors: [],
        isError: true
      });
    }
    if (definition.xWebMcpClientHints?.confirmationRequired && args?.__submit === true && args?.__confirmed !== true) {
      return mcpResult({
        ok: false,
        status: "confirmation_required",
        message: definition.xWebMcpClientHints?.confirmation?.prompt || "Confirmation is required before a destructive action.",
        toolName: definition.name,
        state,
        validationErrors: [],
        isError: true
      });
    }
    return null;
  }

  function mcpResult({ ok, status, message, toolName, state, updated = [], validationErrors = [], isError = false }) {
    const currentState = currentFormState(state);
    return {
      content: [{ type: "text", text: message }],
      structuredContent: {
        ok,
        status,
        toolName,
        formHash: state?.mcpDefinition?.formHash,
        formId: state?.formStructure?.formId,
        updatedFields: updated,
        formState: currentState,
        validationErrors,
        nextActions: nextActionsForState(currentState, validationErrors)
      },
      ...(isError || !ok ? { isError: true } : {})
    };
  }

  function currentFormState(state) {
    const controls = [];
    const form = state?.form;
    for (const element of form?.querySelectorAll("input, select, textarea") || []) {
      const key = element.dataset.webmcpKey || element.id || element.name;
      if (!key) continue;
      controls.push({
        key,
        selector: cssSelector(element),
        filled: Boolean(element.value),
        required: Boolean(element.required || element.dataset.webmcpRequired === "1"),
        valid: element.checkValidity(),
        validationMessage: element.checkValidity() ? "" : validationMessage(element),
        validity: validitySnapshot(element)
      });
    }
    return {
      requiredTotal: controls.filter((control) => control.required).length,
      requiredFilled: controls.filter((control) => control.required && control.filled).length,
      controls
    };
  }

  function collectValidationErrors(state) {
    const form = state?.form;
    return [...(form?.querySelectorAll("input, select, textarea") || [])]
      .filter((element) => !element.checkValidity())
      .map((element) => ({
        selector: cssSelector(element),
        key: element.dataset.webmcpKey || element.name || element.id || "",
        message: validationMessage(element),
        validity: validitySnapshot(element)
      }));
  }

  function nextActionsForState(state, validationErrors) {
    if (validationErrors.length) return ["fix_validation_errors"];
    if (state.requiredFilled < state.requiredTotal) return ["fill_required_fields"];
    return ["review_before_submit", "submit_only_after_user_confirmation"];
  }

  function stableStringify(value) {
    if (!value || typeof value !== "object") return JSON.stringify(value);
    return JSON.stringify(Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = value[key];
      return acc;
    }, {}));
  }

  function sanitizeFootprintEvent(event) {
    const clean = {};
    for (const [key, value] of Object.entries(event || {})) {
      if (!FOOTPRINT_EVENT_KEYS.has(key)) continue;
      if (/value|textContent|innerText|outerText|html/i.test(key)) continue;
      if (key === "errorText") {
        clean.errorText = sanitizePrivateText(value);
        continue;
      }
      if (key === "validity") {
        clean.validity = sanitizeValidityPayload(value);
        continue;
      }
      clean[key] = typeof value === "string" ? value.slice(0, 200) : value;
    }
    return clean;
  }

  function sanitizeValidityPayload(validity = {}) {
    const clean = {};
    for (const [key, value] of Object.entries(validity || {})) {
      if (VALIDITY_KEYS.has(key)) clean[key] = Boolean(value);
    }
    return clean;
  }

  function sanitizePrivateText(value) {
    return String(value || "")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
      .replace(/\d[\d\s\-()]{1,}\d/g, (match) => match.replace(/\D/g, "").length >= 3 ? "[NUM]" : match)
      .slice(0, 200);
  }

  function queryWithinForm(form, selector) {
    if (!selector) return null;
    try {
      if (selector.startsWith("#")) return document.querySelector(selector);
      return form?.querySelector(selector) || document.querySelector(selector);
    } catch {
      return null;
    }
  }

  function formStateForElement(element) {
    const form = element?.closest("form");
    if (!form) return null;
    return [...formStates.values()].find((state) => state.form === form) || null;
  }

  function formStateForDebug(state) {
    return {
      formKey: state.formKey,
      formId: state.formStructure?.formId,
      formName: state.formStructure?.formName,
      formHash: state.mcpDefinition?.formHash,
      fieldCount: state.formStructure?.fields?.length || 0,
      toolNames: (state.mcpDefinition?.tools || []).map((tool) => tool.name)
    };
  }

  function cssSelector(element) {
    if (element.id) return `#${CSS.escape(element.id)}`;
    if (element.name) return `${element.tagName.toLowerCase()}[name="${CSS.escape(element.name)}"]`;
    if (element.dataset?.webmcpFormUid) return `${element.tagName.toLowerCase()}[data-webmcp-form-uid="${CSS.escape(element.dataset.webmcpFormUid)}"]`;
    return element.tagName.toLowerCase();
  }

  function log(message) {
    if (DEBUG) console.log(`[webmcp-tag] ${message}`);
    const target = document.querySelector("#page-log");
    if (target) target.textContent = `${target.textContent || ""}\n[webmcp-tag] ${message}`.trim();
  }
})();
