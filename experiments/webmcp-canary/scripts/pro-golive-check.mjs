/**
 * Pro go-live check. Read-only. Run by the owner on a machine logged in to
 * wrangler:
 *
 *   npm run pro:check                  # full check, flag must be on
 *   npm run pro:check -- --before-flag # everything except the flag being on
 *
 * Optional live Stripe price check (nothing is printed but the verdict):
 *
 *   STRIPE_SECRET_KEY=rk_live_... STRIPE_PRICE_ID_PRO=price_... npm run pro:check
 *
 * It never prints a secret value. It reads secret NAMES from
 * `wrangler secret list`, the vars from wrangler.jsonc, and (optionally) GETs
 * one Stripe price with a key you put in your own shell. It writes nothing.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Secrets the deployed Worker needs before Pro can be sold. */
export const REQUIRED_SECRETS = Object.freeze([
  // stripeSecret() in worker/api.mjs reads this name.
  { name: "STRIPE_SECRET_KEY", why: "Stripe API key used by checkout/portal" },
  { name: "STRIPE_WEBHOOK_SECRET", why: "without it the subscription webhook is refused and a paid Pro site never becomes pro" },
  { name: "STRIPE_PRICE_ID_PRO", why: "the Pro price; checkout and the webhook both map it to plan=pro" },
  { name: "PERPLEXITY_API_KEY", why: "the only engine the Pro SoV measurement uses" },
]);
export const FLAG = "PRO_CHECKOUT_ENABLED";
export const EXPECTED_PRICE = Object.freeze({ currency: "jpy", unit_amount: 14800, interval: "month", interval_count: 1 });
export const DAILY_CRON = "17 18 * * *";

/** Strip // and /* *\/ comments from JSONC without touching string contents. */
export function stripJsonc(text) {
  let out = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (inString) {
      out += ch;
      if (ch === "\\") { out += next ?? ""; i += 2; continue; }
      if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") { inString = true; out += ch; i += 1; continue; }
    if (ch === "/" && next === "/") { while (i < text.length && text[i] !== "\n") i += 1; continue; }
    if (ch === "/" && next === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i += 1; i += 2; continue; }
    out += ch;
    i += 1;
  }
  // Trailing commas are legal in JSONC.
  return out.replace(/,(\s*[}\]])/g, "$1");
}

export function parseWranglerConfig(text) {
  return JSON.parse(stripJsonc(text));
}

/**
 * Parse `wrangler secret list --format json` output into a set of names.
 * Wrangler may print a banner or warnings around the JSON, so the array is
 * located rather than assumed to be the whole output. Values are never part of
 * this output, and nothing but `name` is read from it.
 */
export function parseSecretList(output) {
  const text = String(output || "");
  const end = text.lastIndexOf("]");
  let parsed;
  // "[WARNING]" style log prefixes also start with "[", so try each candidate
  // from the left until one parses as the array.
  for (let start = text.indexOf("["); start >= 0 && start < end; start = text.indexOf("[", start + 1)) {
    try { parsed = JSON.parse(text.slice(start, end + 1)); break; } catch { /* next candidate */ }
  }
  if (parsed === undefined) throw new Error("secret_list_not_json");
  if (!Array.isArray(parsed)) throw new Error("secret_list_not_array");
  return new Set(parsed.map((entry) => String(entry?.name || "").trim()).filter(Boolean));
}

/** Which required secrets exist. Names only. */
export function evaluateSecrets(names) {
  return REQUIRED_SECRETS.map((secret) => ({ ...secret, present: names.has(secret.name) }));
}

/**
 * Where PRO_CHECKOUT_ENABLED comes from and whether it is on.
 *  - a var in wrangler.jsonc: value is readable, on only when exactly "1"
 *  - a secret: value is not readable; reported as "set, unverified"
 *  - neither: off
 * A var in wrangler.jsonc overrides nothing if a secret of the same name exists
 * (wrangler refuses that combination), so both is reported as a conflict.
 */
export function evaluateFlag(config, secretNames) {
  const vars = config?.vars || {};
  const inVars = Object.prototype.hasOwnProperty.call(vars, FLAG);
  const inSecrets = secretNames.has(FLAG);
  if (inVars && inSecrets) return { status: "conflict", source: "both", on: null };
  if (inVars) {
    const value = String(vars[FLAG]).trim();
    return { status: value === "1" ? "on" : "off", source: "wrangler.jsonc vars", on: value === "1", value };
  }
  if (inSecrets) return { status: "set_unverified", source: "secret", on: null };
  return { status: "off", source: "unset", on: false };
}

/** Check a Stripe Price object against what the LP and the worker charge. */
export function evaluatePrice(price, { keyMode = null } = {}) {
  const problems = [];
  const warnings = [];
  if (!price || typeof price !== "object") return { ok: false, problems: ["no price object"], warnings };
  if (price.error) return { ok: false, problems: [`Stripe error: ${String(price.error.code || price.error.type || "unknown")}`], warnings };
  if (price.object !== "price") problems.push(`object is ${JSON.stringify(price.object)}, not "price"`);
  if (price.active !== true) problems.push("price is not active");
  if (price.type !== "recurring") problems.push(`type is ${JSON.stringify(price.type)}, not "recurring"`);
  if (String(price.currency || "").toLowerCase() !== EXPECTED_PRICE.currency) problems.push(`currency is ${JSON.stringify(price.currency)}, not "jpy"`);
  // JPY is zero-decimal in Stripe: 14800 means ¥14,800.
  if (price.unit_amount !== EXPECTED_PRICE.unit_amount) problems.push(`unit_amount is ${JSON.stringify(price.unit_amount)}, not ${EXPECTED_PRICE.unit_amount}`);
  if (price.billing_scheme && price.billing_scheme !== "per_unit") problems.push(`billing_scheme is ${JSON.stringify(price.billing_scheme)}, not "per_unit"`);
  const recurring = price.recurring || {};
  if (recurring.interval !== EXPECTED_PRICE.interval) problems.push(`interval is ${JSON.stringify(recurring.interval)}, not "month"`);
  if ((recurring.interval_count ?? 1) !== EXPECTED_PRICE.interval_count) problems.push(`interval_count is ${JSON.stringify(recurring.interval_count)}, not 1`);
  if (recurring.usage_type && recurring.usage_type !== "licensed") problems.push(`usage_type is ${JSON.stringify(recurring.usage_type)}, not "licensed"`);
  if (keyMode === "live" && price.livemode !== true) problems.push("checked with a live key but the price is not livemode");
  if (keyMode === "test") warnings.push("checked with a TEST key: this proves the test-mode price only, not production");
  if (price.livemode === false && keyMode !== "test") warnings.push("price is test mode");
  return { ok: problems.length === 0, problems, warnings };
}

export function stripeKeyMode(key) {
  const value = String(key || "").trim();
  if (/^(sk|rk)_live_/.test(value)) return "live";
  if (/^(sk|rk)_test_/.test(value)) return "test";
  return null;
}

/** price_abc...wxyz -> "price_…wxyz": enough to recognise, not to reuse. */
export function maskId(id) {
  const value = String(id || "");
  return value.length > 10 ? `${value.slice(0, value.indexOf("_") + 1)}…${value.slice(-4)}` : "(set)";
}

/** The most useful line of a wrangler failure, without colour codes. */
export function wranglerErrorLine(text) {
  const lines = String(text || "").replace(/\u001b\[[0-9;]*m/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  return (lines.find((line) => /ERROR|✘/.test(line)) || lines.find((line) => !/WARNING|▲/.test(line)) || "failed").slice(0, 200);
}

/* ------------------------------------------------------------------ */

async function main(argv) {
  const beforeFlag = argv.includes("--before-flag");
  const results = [];
  const record = (status, label, detail = "") => {
    results.push({ status, label });
    console.log(`${status.padEnd(4)}  ${label}${detail ? ` - ${detail}` : ""}`);
  };

  console.log("Nurevo Pro go-live check (read-only; no secret values are printed)\n");

  // wrangler.jsonc
  let config;
  try {
    config = parseWranglerConfig(readFileSync(join(ROOT, "wrangler.jsonc"), "utf8"));
  } catch (error) {
    record("FAIL", "read wrangler.jsonc", String(error?.message || error));
    return finish(results);
  }
  const workerName = String(config.name || "").trim();
  if (!workerName) { record("FAIL", "worker name in wrangler.jsonc"); return finish(results); }
  console.log(`Worker: ${workerName}\n`);

  const crons = config?.triggers?.crons || [];
  record(crons.includes(DAILY_CRON) ? "PASS" : "FAIL", `daily cron ${DAILY_CRON} (runs the SoV batch)`);

  // (a) secret names
  let names = new Set();
  let listed = false;
  try {
    const output = execFileSync("npx", ["wrangler", "secret", "list", "--format", "json", "--name", workerName], {
      cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000,
    });
    names = parseSecretList(output);
    listed = true;
  } catch (error) {
    const reason = error?.code === "ENOENT" ? "npx not found" : wranglerErrorLine(String(error?.stderr || "") + "\n" + String(error?.stdout || "") + "\n" + String(error?.message || error));
    record("FAIL", "wrangler secret list", `${reason} (are you logged in? try: npx wrangler login)`);
  }
  for (const secret of evaluateSecrets(names)) {
    if (!listed) { record("FAIL", `secret ${secret.name}`, "unknown (secret list unavailable)"); continue; }
    record(secret.present ? "PASS" : "FAIL", `secret ${secret.name}`, secret.present ? "present" : `MISSING: ${secret.why}`);
  }

  // (b) the sale switch
  const flag = evaluateFlag(config, names);
  if (flag.status === "on") record("PASS", `${FLAG}`, `"1" in ${flag.source}`);
  else if (flag.status === "set_unverified") record("WARN", `${FLAG}`, "set as a secret; value cannot be read back - it must be exactly 1");
  else if (flag.status === "conflict") record("FAIL", `${FLAG}`, "defined both in wrangler.jsonc vars and as a secret; keep one");
  else if (beforeFlag) record("INFO", `${FLAG}`, `off (${flag.source}); expected with --before-flag`);
  else record("FAIL", `${FLAG}`, `off (${flag.source}${flag.value !== undefined ? `, value ${JSON.stringify(flag.value)}` : ""}); Pro checkout stays "coming soon"`);

  // (c) optional live price check
  const key = String(process.env.STRIPE_SECRET_KEY || "").trim();
  const priceId = String(process.env.STRIPE_PRICE_ID_PRO || "").trim();
  if (key && priceId) {
    const mode = stripeKeyMode(key);
    if (!mode) {
      record("FAIL", "Stripe price check", "STRIPE_SECRET_KEY in this shell is not an sk_/rk_ test/live key");
    } else if (!/^price_[A-Za-z0-9]+$/.test(priceId)) {
      record("FAIL", "Stripe price check", "STRIPE_PRICE_ID_PRO in this shell does not look like a price id");
    } else {
      try {
        const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
          headers: { authorization: `Bearer ${key}` },
        });
        const body = await response.json().catch(() => ({}));
        const verdict = evaluatePrice(body, { keyMode: mode });
        for (const warning of verdict.warnings) record("WARN", `Stripe price ${maskId(priceId)}`, warning);
        record(verdict.ok ? "PASS" : "FAIL", `Stripe price ${maskId(priceId)} (${mode} key)`,
          verdict.ok ? "active, recurring monthly, JPY 14,800" : verdict.problems.join("; "));
        console.log("      note: this checks the id in YOUR shell; make sure it is the same value as the Worker secret.");
      } catch (error) {
        record("FAIL", "Stripe price check", `request failed: ${String(error?.message || error).slice(0, 120)}`);
      }
    }
  } else {
    record("SKIP", "Stripe price check", "set STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO in this shell to verify the price");
  }

  // (d) live engine check is separate and costs a few Perplexity calls.
  console.log("\nLive engine check (separate, spends ~6 Perplexity calls): npm run smoke:sov");
  return finish(results);
}

function finish(results) {
  const failed = results.filter((result) => result.status === "FAIL");
  console.log(`\n${failed.length ? "FAIL" : "PASS"}: ${results.filter((r) => r.status === "PASS").length} passed, ${failed.length} failed, `
    + `${results.filter((r) => r.status === "WARN").length} warnings, ${results.filter((r) => r.status === "SKIP").length} skipped`);
  if (failed.length) console.log(`Fix: ${failed.map((r) => r.label).join(", ")}`);
  return failed.length ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (error) => {
    console.error(`FAIL  unexpected error: ${String(error?.message || error)}`);
    process.exitCode = 1;
  });
}
