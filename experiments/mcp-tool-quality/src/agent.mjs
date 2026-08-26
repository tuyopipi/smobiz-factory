import { readFile } from "node:fs/promises";
import { mockAction } from "./mock-agent.mjs";
import { completeAction } from "./providers.mjs";

export async function runAgentOnForm({ page, form, quality, mcpDefinition, task, maxSteps, provider, mock }) {
  const log = [];
  let totalTokens = 0;
  const previousCorrectSelectors = new Set();

  for (let step = 1; step <= maxSteps; step += 1) {
    const resultText = await readResult(page);
    if (resultText === "SUCCESS" || resultText === "ERROR") {
      return finish({ form, quality, log, totalTokens, steps: step - 1, resultText });
    }

    const dom = await snapshotDom(page);
    const plannedAction = planRequiredFieldAction({ dom, mcpDefinition, previousCorrectSelectors });
    const llm = plannedAction
      ? { action: plannedAction, tokens: estimateTokens(JSON.stringify({ planner: plannedAction, dom })) }
      : mock
      ? { action: mockAction({ formId: form.id, quality, step, mcpDefinition }), tokens: estimateTokens(JSON.stringify(dom)) }
      : await askModel({ provider, mcpDefinition, task, dom, log });

    totalTokens += llm.tokens;
    const action = llm.action;
    const entry = { step, dom, action, execution: null };
    entry.execution = await executeAction(page, action);
    entry.domAfter = await snapshotDom(page);
    markCorrectSelectors(entry.domAfter, mcpDefinition, previousCorrectSelectors);
    log.push(entry);
  }

  return finish({ form, quality, log, totalTokens, steps: maxSteps, resultText: await readResult(page) || "TIMEOUT" });
}

function planRequiredFieldAction({ dom, mcpDefinition, previousCorrectSelectors }) {
  const targets = requiredTargetsFromMcp(mcpDefinition);
  if (targets.length === 0) return null;
  const controlsBySelector = new Map(dom.controls.map((control) => [control.selector, control]));
  const actionableTargets = targets.filter((target) => {
    const control = controlsBySelector.get(target.selector);
    return control?.visible && !control.disabled;
  });

  for (const target of actionableTargets) {
    const control = controlsBySelector.get(target.selector);
    if (String(control.value) === String(target.value)) {
      previousCorrectSelectors.add(target.selector);
      continue;
    }
    if (previousCorrectSelectors.has(target.selector)) continue;
    return {
      action: control.tag === "select" ? "select" : "fill",
      selector: target.selector,
      value: target.value,
      reason: `planner: fill required ${target.selector} from MCP target map`
    };
  }

  if (actionableTargets.length > 0 && actionableTargets.every((target) => String(controlsBySelector.get(target.selector)?.value) === String(target.value))) {
    const submit = dom.controls.find((control) => control.visible && !control.disabled && (control.selector === "#submit" || /登録を完了|submit|送信/i.test(control.text ?? "")));
    if (submit) {
      return {
        action: "click",
        selector: submit.selector,
        reason: "planner: all visible required MCP targets are correct, submit is now preferred"
      };
    }
  }

  return null;
}

function markCorrectSelectors(dom, mcpDefinition, previousCorrectSelectors) {
  const controlsBySelector = new Map(dom.controls.map((control) => [control.selector, control]));
  for (const target of requiredTargetsFromMcp(mcpDefinition)) {
    const control = controlsBySelector.get(target.selector);
    if (control && String(control.value) === String(target.value)) previousCorrectSelectors.add(target.selector);
  }
}

function requiredTargetsFromMcp(mcpDefinition) {
  if (Array.isArray(mcpDefinition?.agent_targets)) return mcpDefinition.agent_targets;
  if (Array.isArray(mcpDefinition?.repair_plan)) {
    return mcpDefinition.repair_plan
      .filter(([action]) => action === "fill" || action === "select")
      .map(([, selector, value]) => ({ selector, value }));
  }

  const schema = mcpDefinition?.input_schema ?? {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  const properties = schema.properties ?? {};
  const aliases = selectorAliasesFromDescription(mcpDefinition?.description ?? "");
  const targets = [];
  for (const key of required) {
    const property = properties[key] ?? {};
    const value = property.examples?.[0] ?? property.enum?.[0];
    if (value === undefined) continue;
    const selector = aliases[key] ?? `#${key}`;
    targets.push({ selector, value: String(value) });
  }
  return targets;
}

function selectorAliasesFromDescription(description) {
  const aliases = {};
  const patterns = [
    [/#([A-Za-z0-9_-]+)\s+company/i, "company"],
    [/#([A-Za-z0-9_-]+)\s+job title/i, "jobTitle"],
    [/#([A-Za-z0-9_-]+)\s+family name/i, "familyName"],
    [/#([A-Za-z0-9_-]+)\s+given name/i, "givenName"],
    [/#([A-Za-z0-9_-]+)\s+email/i, "email"],
    [/#([A-Za-z0-9_-]+)\s+phone/i, "phone"],
    [/#([A-Za-z0-9_-]+)\s+YYYY-MM-DD/i, "birth"]
  ];
  for (const [pattern, key] of patterns) {
    const match = description.match(pattern);
    if (match) aliases[key] = `#${match[1]}`;
  }
  return aliases;
}

async function askModel({ provider, mcpDefinition, task, dom, log }) {
  const callDelayMs = Number(process.env.OPENAI_CALL_DELAY_MS || "0");

  const messages = [
    {
      role: "system",
      content: [
        "You are a browser form-filling agent.",
        "Return only JSON with this shape:",
        "{\"action\":\"fill|select|click|check|done\",\"selector\":\"CSS selector\",\"value\":\"value if needed\",\"reason\":\"short reason\"}",
        "Use only visible, interactable controls from the DOM snapshot unless the MCP definition explicitly identifies a safe hidden field.",
        "Your goal is to make the page show SUCCESS."
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({
        task,
        mcp_definition: mcpDefinition,
        dom_snapshot: dom,
        recent_actions: log.slice(-6).map((entry) => ({ action: entry.action, execution: entry.execution }))
      }, null, 2)
    }
  ];

  const result = await completeAction({ provider, messages });
  if (callDelayMs > 0) await sleep(callDelayMs);
  return result;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeAction(page, action) {
  try {
    if (!action || action.action === "done") return { ok: true, note: "done" };
    if (!action.selector) return { ok: false, error: "missing selector" };
    const locator = page.locator(action.selector).first();
    if (action.action === "fill") {
      await locator.fill(String(action.value ?? ""), { timeout: 3000 });
    } else if (action.action === "select") {
      await locator.selectOption(String(action.value ?? ""), { timeout: 3000 });
    } else if (action.action === "check") {
      await locator.check({ timeout: 3000 });
    } else if (action.action === "click") {
      await locator.click({ timeout: 3000 });
    } else {
      return { ok: false, error: `unknown action: ${action.action}` };
    }
    await page.waitForTimeout(80);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function snapshotDom(page) {
  return page.evaluate(() => {
    const controls = [...document.querySelectorAll("input, select, textarea, button")].map((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const label = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent?.trim() : "";
      return {
        tag: el.tagName.toLowerCase(),
        selector: el.id ? `#${el.id}` : el.name ? `${el.tagName.toLowerCase()}[name="${el.name}"]` : el.tagName.toLowerCase(),
        id: el.id || null,
        name: el.getAttribute("name"),
        type: el.getAttribute("type"),
        label,
        placeholder: el.getAttribute("placeholder"),
        value: "value" in el ? el.value : "",
        text: el.textContent?.trim().slice(0, 80),
        visible: style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0,
        disabled: Boolean(el.disabled),
        options: el.tagName.toLowerCase() === "select" ? [...el.options].map((option) => ({ value: option.value, text: option.textContent?.trim() })) : undefined
      };
    });
    return {
      title: document.title,
      result: document.querySelector("#result")?.textContent?.trim() || "",
      visibleErrors: [...document.querySelectorAll('.field-error, .error, [role="alert"], .invalid-feedback')]
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return el.textContent?.trim() && style.display !== "none" && style.visibility !== "hidden" && rect.width >= 0 && rect.height >= 0;
        })
        .map((el) => ({
          selector: el.dataset?.selector || null,
          text: el.textContent.trim()
        })),
      controls
    };
  });
}

async function readResult(page) {
  return page.locator("#result").textContent({ timeout: 500 }).then((text) => text.trim()).catch(() => "");
}

function finish({ form, quality, log, totalTokens, steps, resultText }) {
  const failureReason = resultText === "SUCCESS" ? null : inferFailureReason({ resultText, log });
  return {
    form: form.id,
    formName: form.name,
    quality,
    success: resultText === "SUCCESS",
    finalResult: resultText,
    failureReason,
    steps,
    tokens: totalTokens,
    log
  };
}

function inferFailureReason({ resultText, log }) {
  if (resultText === "TIMEOUT") return "timeout";
  const last = log.at(-1);
  const visibleErrors = last?.domAfter?.visibleErrors ?? last?.dom?.visibleErrors ?? [];
  if (visibleErrors.length > 0) return "validation_error";
  const failedExecution = [...log].reverse().find((entry) => entry.execution && !entry.execution.ok);
  if (failedExecution?.execution?.error?.includes("Timeout")) return "element_timeout";
  if (failedExecution) return "execution_error";
  if (resultText === "ERROR") return "submitted_error";
  return "unknown";
}

function estimateTokens(text) {
  return Math.ceil(String(text).length / 4);
}

export async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
