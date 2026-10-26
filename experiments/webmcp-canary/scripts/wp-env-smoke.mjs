#!/usr/bin/env node
/**
 * Real-WordPress smoke test for the Nurevo AEO plugin, next to Yoast SEO and Slim SEO.
 *
 * Starts WordPress with @wordpress/env (Docker) from tests/wp-env/.wp-env.json:
 *   - Yoast SEO and Slim SEO from wordpress.org (Slim SEO is deactivated at the
 *     start and only switched on, in place of Yoast, for step 5);
 *   - the BUILT plugin, dist/nurevo-webmcp, mapped in as wp-content/plugins/nurevo-webmcp
 *     (the slug users get) but not activated, so activation is part of the test;
 *   - tests/wp-env/mu-plugins/nurevo-ci-probe.php, which records outbound HTTP,
 *     blocks anything external, and adds the `wp nurevo-ci` helper command.
 *
 * Then, in order:
 *   1. activate Nurevo with Yoast active; Nurevo must make no external HTTP
 *      request while activating, must store its options and schedule its cron;
 *   2. with Nurevo's output still off (the default), the home page carries only
 *      Yoast's JSON-LD and /llms.txt is not served;
 *   3. turn output on with fixture business data and a service; the home page
 *      must carry exactly one application/ld+json block: Yoast's graph, with the
 *      fixture's telephone/address merged into one business node and the
 *      service added, and no separate Nurevo graph; no external HTTP from Nurevo
 *      while serving public pages;
 *   4. /llms.txt is served as text/plain with the fixture's name and phone;
 *   5. Slim SEO instead of Yoast: the home page carries exactly one JSON-LD
 *      block, Slim SEO's (id=slim-seo-schema, printed in wp_footer), with the
 *      fixture facts in its one Organization and the service added; with Slim
 *      SEO's Schema feature off, exactly one block again: Nurevo's own graph in
 *      <head>. Yoast is switched back on afterwards;
 *   6. deactivate (cron cleared), uninstall (every webmcp_canary_* option gone);
 *   7. debug.log has no PHP fatal error, parse error or warning (from any plugin).
 *
 * Every check runs even when an earlier one fails; the summary at the end lists
 * all failures and the exit code is 1 if there were any.
 *
 * Usage (from experiments/webmcp-canary, Docker running):
 *   npm run plugin:build && npm run test:wp-env
 *   WP_ENV_PHP_VERSION=7.4 npm run test:wp-env     # any PHP wp-env supports
 *   npm run test:wp-env -- --stop                  # stop the containers afterwards
 *
 * Against an already running WordPress instead of wp-env (no Docker), with the
 * plugin at wp-content/plugins/nurevo-webmcp and the probe in mu-plugins:
 *   SMOKE_WP_CLI="wp --path=/srv/wp" SMOKE_BASE_URL=http://127.0.0.1:8080 npm run test:wp-env
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_DIR = path.join(ROOT, "tests/wp-env");
const PLUGIN_DIR = path.join(ROOT, "dist/nurevo-webmcp");
const PLUGIN = "nurevo-webmcp";
/** Pinned: wp-env changes its CLI between majors. */
const WP_ENV_PACKAGE = "@wordpress/env@11.17.0";
const DIRECT_WP = process.env.SMOKE_WP_CLI ? process.env.SMOKE_WP_CLI.split(/\s+/).filter(Boolean) : null;
const PORT = process.env.WP_ENV_PORT || "8892"; // tests/wp-env/.wp-env.json "port"
const BASE_URL = (process.env.SMOKE_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const STOP = process.argv.includes("--stop");

const failures = [];
let checks = 0;

/**
 * A GitHub Actions error annotation, so a failure can be read from the check
 * run without the job log. Newlines are encoded as %0A and the text is cut to
 * stay under the annotation size limit. Outside Actions it is just a log line.
 */
function annotate(message, detail) {
  let text = String(message);
  if (detail !== undefined) {
    text += `\n${typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)}`;
  }
  if (text.length > 3500) text = `${text.slice(0, 3500)}\n[... truncated]`;
  const encoded = text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  console.log(`::error title=smoke::${encoded}`);
}

function check(ok, message, detail) {
  checks += 1;
  if (ok) {
    console.log(`  ok   ${message}`);
  } else {
    failures.push(message);
    annotate(`FAIL ${message}`, detail);
    console.log(`  FAIL ${message}`);
    if (detail !== undefined) {
      console.log(`       ${typeof detail === "string" ? detail : JSON.stringify(detail, null, 2).replace(/\n/g, "\n       ")}`);
    }
  }
  return ok;
}

function section(title) {
  console.log(`\n== ${title}`);
}

/** Run a command; throws with its output when it fails. */
function sh(cmd, args, { cwd = ENV_DIR, allowFail = false } = {}) {
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: process.env });
  const out = `${result.stdout || ""}${result.stderr || ""}`;
  if (!allowFail && (result.error || result.status !== 0)) {
    throw new Error(`\`${[cmd, ...args].join(" ")}\` failed (exit ${result.status}):\n${out}${result.error ? `\n${result.error.message}` : ""}`);
  }
  return { status: result.status, stdout: result.stdout || "", out };
}

function wpEnv(args, opts) {
  return sh("npx", ["--yes", WP_ENV_PACKAGE, ...args], opts);
}

/** WP-CLI inside the wp-env cli container (or the SMOKE_WP_CLI command). */
function wp(args, opts = {}) {
  if (DIRECT_WP) {
    return sh(DIRECT_WP[0], [...DIRECT_WP.slice(1), ...args], { cwd: ROOT, ...opts });
  }
  // wp-env parses --options itself unless they come after a "--", which it
  // appends to the command unchanged. WP-CLI accepts flags in any position.
  const flags = args.filter((a) => a.startsWith("-"));
  const positional = args.filter((a) => !a.startsWith("-"));
  return wpEnv(["run", "cli", "wp", ...positional, ...(flags.length ? ["--", ...flags] : [])], opts);
}

/** `wp nurevo-ci <sub>` and its NUREVO_CI_JSON payload. */
function probe(sub) {
  const { out } = wp(["nurevo-ci", sub]);
  const line = out.split("\n").find((l) => l.startsWith("NUREVO_CI_JSON "));
  if (!line) {
    throw new Error(`wp nurevo-ci ${sub}: no NUREVO_CI_JSON line. Is the mu-plugin mounted?\n${out}`);
  }
  return JSON.parse(line.slice("NUREVO_CI_JSON ".length));
}

/**
 * GET a path on the site, following redirects by hand so that a failure can
 * say which hop failed and why (fetch only says "fetch failed").
 */
async function get(urlPath) {
  let url = `${BASE_URL}${urlPath}`;
  const hops = [];
  for (let i = 0; i < 6; i += 1) {
    let response;
    try {
      response = await fetch(url, { redirect: "manual", headers: { "cache-control": "no-cache" } });
    } catch (error) {
      const cause = error.cause ? `${error.cause.code || ""} ${error.cause.message || error.cause}`.trim() : "";
      throw new Error(`GET ${url} failed: ${error.message}${cause ? ` (${cause})` : ""}${hops.length ? `; redirects: ${hops.join(" -> ")}` : ""}`);
    }
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      hops.push(`${response.status} ${url}`);
      url = new URL(location, url).toString();
      continue;
    }
    return { status: response.status, type: response.headers.get("content-type") || "", body: await response.text(), redirects: hops };
  }
  throw new Error(`GET ${BASE_URL}${urlPath}: too many redirects: ${hops.join(" -> ")} -> ${url}`);
}

/** The last lines of the web server's log (wp-env), for a request that got no response. */
function serverLogTail(lines = 40) {
  if (DIRECT_WP) return "";
  // Bounded: if this wp-env ever ignores --watch=false, it must not hang the job.
  const result = spawnSync("npx", ["--yes", WP_ENV_PACKAGE, "logs", "development", "--watch=false"],
    { cwd: ENV_DIR, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: process.env, timeout: 90000 });
  const out = `${result.stdout || ""}${result.stderr || ""}`;
  return out.split("\n").filter((l) => l.trim() && !/^\s*[✔ℹ]/.test(l)).slice(-lines).join("\n");
}

/** get(), but a failed request becomes a failed check (with the server log) instead of an abort. */
async function tryGet(label, urlPath) {
  try {
    return await get(urlPath);
  } catch (error) {
    check(false, `${label}: ${error.message}`, serverLogTail());
    return null;
  }
}

/** Every <script type="application/ld+json"> on a page, parsed. */
function jsonLdBlocks(html) {
  const blocks = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    if (!/\btype\s*=\s*["']?application\/ld\+json/i.test(attrs)) continue;
    let data = null;
    let error = null;
    try {
      data = JSON.parse(match[2]);
    } catch (e) {
      error = e.message;
    }
    blocks.push({ attrs: attrs.trim(), data, error });
  }
  return blocks;
}

function types(node) {
  const t = node && node["@type"];
  return Array.isArray(t) ? t : t ? [t] : [];
}

function graphOf(block) {
  if (!block || !block.data) return [];
  if (Array.isArray(block.data["@graph"])) return block.data["@graph"];
  return Array.isArray(block.data) ? block.data : [block.data];
}

function externalFromNurevo(entries) {
  return entries.filter((e) => e.external && e.nurevo);
}

function summarizeHttp(label, entries) {
  console.log(`  ${label}: ${entries.length} outbound request(s) recorded`);
  for (const e of entries) {
    console.log(`    ${e.context} ${e.method} ${e.url}${e.external ? " [external, blocked]" : " [loopback]"}${e.nurevo ? " (from nurevo-webmcp)" : ""}`);
  }
}

async function main() {
  if (!existsSync(path.join(PLUGIN_DIR, `${PLUGIN}.php`))) {
    console.log("dist/nurevo-webmcp is missing; building the plugin first.");
    sh("node", ["scripts/build-plugin-zip.mjs"], { cwd: ROOT });
  }

  section("Environment");
  if (!DIRECT_WP) {
    // A first start pulls images and downloads WordPress and Yoast; retry once
    // for registry/network hiccups.
    const first = wpEnv(["start", "--update"], { allowFail: true });
    if (first.status !== 0) {
      console.log(first.out);
      console.log("wp-env start failed; retrying once.");
      wpEnv(["start", "--update"]);
    }
    // Fresh database, so a local re-run starts from the same state as CI.
    wpEnv(["reset", "development"]);
  }
  probe("reset");
  wp(["plugin", "deactivate", "slim-seo"], { allowFail: true });
  wp(["plugin", "activate", "wordpress-seo"]);
  wp(["plugin", "deactivate", PLUGIN], { allowFail: true });
  const perma = probe("permalinks");
  console.log(`  permalinks ${perma.permalinks}${perma.wrote_htaccess ? " (wrote .htaccess)" : ""}`);
  const before = probe("state");
  console.log(`  PHP ${before.php}, WordPress ${before.wp}, Yoast SEO ${before.yoast}, home ${before.home}`);
  check(before.yoast_active === true, "Yoast SEO is active");
  check(before.slim_seo_active === false, "Slim SEO is installed but inactive");
  check(before.nurevo_active === false, "Nurevo starts inactive");
  check(before.options.length === 0, "no webmcp_canary_* options before activation", before.options);

  section("1. Activation (Yoast active)");
  probe("reset");
  wp(["plugin", "activate", PLUGIN]);
  const activated = probe("state");
  const activationHttp = probe("http");
  summarizeHttp("during activation", activationHttp);
  check(activated.nurevo_active === true, "Nurevo is active");
  check(activated.nurevo_version !== null, `plugin loaded (version ${activated.nurevo_version})`);
  check(externalFromNurevo(activationHttp).length === 0,
    "activation made no external HTTP request (WordPress.org guideline 7: no calls home without consent)",
    externalFromNurevo(activationHttp).map((e) => `${e.method} ${e.url}`));
  check(activated.options.length > 0, `activation stored options: ${activated.options.join(", ") || "(none)"}`);
  check(Boolean(activated.cron), "activation scheduled webmcp_canary_ruleset_check");

  section("2. Output off (default): Yoast's graph only, no /llms.txt");
  {
    const home = await get("/");
    check(home.status === 200, `GET / -> ${home.status}`);
    const blocks = jsonLdBlocks(home.body);
    check(blocks.length === 1, `exactly one application/ld+json block (found ${blocks.length})`, blocks.map((b) => b.attrs));
    check(!home.body.includes("nurevo-aeo-server"), "no Nurevo graph while output is off");
    const llms = await get("/llms.txt");
    check(!(llms.status === 200 && llms.body.startsWith("# ")), `/llms.txt not served while output is off (status ${llms.status})`);
  }

  section("3. Output on: one merged graph");
  const configured = probe("configure");
  const fx = configured.fixture;
  check(configured.yoast_org === true, "Yoast organization set to the fixture business");
  probe("reset");
  {
    const home = await get("/");
    check(home.status === 200, `GET / -> ${home.status}`);
    const blocks = jsonLdBlocks(home.body);
    check(blocks.length === 1, `exactly one application/ld+json block (found ${blocks.length})`, blocks.map((b) => b.attrs));
    const block = blocks[0];
    check(Boolean(block && block.data && !block.error), "the block is valid JSON", block && block.error);
    check(Boolean(block && /yoast-schema-graph/.test(block.attrs)), "the block is Yoast's (class=yoast-schema-graph)", block && block.attrs);
    check(!home.body.includes('id="nurevo-aeo-server"'), "Nurevo printed no graph of its own (it merged instead)");
    const graph = graphOf(block);
    console.log(`  graph: ${graph.map((n) => `${types(n).join("/")}${n["@id"] ? ` ${n["@id"]}` : ""}`).join(" | ")}`);
    check(graph.some((n) => types(n).includes("WebSite")), "Yoast's WebSite node is present");
    check(graph.some((n) => types(n).includes("BreadcrumbList")), "Yoast's BreadcrumbList node is present (Nurevo never emits one)");
    const withPhone = graph.filter((n) => n.telephone === fx.business_phone);
    check(withPhone.length === 1, `exactly one node carries the fixture telephone (found ${withPhone.length})`);
    const business = withPhone[0] || {};
    check(business.address && business.address.streetAddress === fx.business_address, "that node carries the fixture address", business.address);
    const businessNodes = graph.filter((n) => types(n).some((t) => ["Organization", "LocalBusiness", fx.business_type].includes(t)));
    check(businessNodes.length === 1, `one business node in the graph (found ${businessNodes.length})`, businessNodes.map((n) => n["@id"]));
    const services = graph.filter((n) => types(n).includes("Service") && n.name === fx.service_name);
    check(services.length === 1, `the fixture service is in the graph once (found ${services.length})`);
    check(Boolean(services[0] && business["@id"] && services[0].provider && services[0].provider["@id"] === business["@id"]),
      "the service's provider is the business node", services[0] && services[0].provider);
    const ids = graph.map((n) => n["@id"]).filter(Boolean);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    check(dupes.length === 0, "no @id appears twice in the graph", dupes);
  }

  section("4. /llms.txt");
  {
    const llms = await get("/llms.txt");
    check(llms.status === 200, `GET /llms.txt -> ${llms.status}`);
    check(/^text\/plain/i.test(llms.type), `served as text/plain (${llms.type})`);
    check(llms.body.startsWith(`# ${fx.business_name}`), "starts with '# <business name>'", llms.body.slice(0, 200));
    check(llms.body.includes(`- Phone: ${fx.business_phone}`), "lists the fixture phone");
  }
  const publicHttp = probe("http");
  summarizeHttp("while serving / and /llms.txt", publicHttp);
  check(externalFromNurevo(publicHttp).length === 0, "no external HTTP from Nurevo while serving public pages",
    externalFromNurevo(publicHttp).map((e) => `${e.context} ${e.method} ${e.url}`));

  section("5. Slim SEO instead of Yoast: one merged graph, or ours when its schema is off");
  wp(["plugin", "deactivate", "wordpress-seo"]);
  wp(["plugin", "activate", "slim-seo"]);
  probe("slimseo-schema-on");
  const slim = probe("state");
  console.log(`  Slim SEO ${slim.slim_seo}`);
  check(slim.slim_seo_active === true && slim.yoast_active === false, "Slim SEO is active, Yoast SEO is not");
  probe("reset");
  // Slim SEO on its own first (Nurevo's schema output off), so a failure here
  // is told apart from one in the merge.
  probe("nurevo-schema-off");
  {
    const home = await tryGet("Slim SEO alone: GET /", "/");
    if (home) {
      check(home.status === 200, `Slim SEO alone: GET / -> ${home.status}`, home.status === 200 ? undefined : home.body.slice(0, 1500));
      const blocks = jsonLdBlocks(home.body);
      check(blocks.length === 1 && /slim-seo-schema/.test(blocks[0].attrs), `Slim SEO alone: its one block (found ${blocks.length})`, blocks.map((b) => b.attrs));
    }
  }
  probe("nurevo-schema-on");
  {
    const home = await tryGet("Slim SEO + Nurevo: GET /", "/");
    if (!home) {
      const log = probe("debuglog");
      check(false, "Slim SEO + Nurevo: debug.log after the failed request", log.content.split("\n").filter(Boolean).slice(-20).join("\n") || "(empty)");
    }
    const page = home || { status: 0, body: "" };
    check(page.status === 200, `GET / -> ${page.status}`);
    const blocks = jsonLdBlocks(page.body);
    check(blocks.length === 1, `exactly one application/ld+json block (found ${blocks.length})`, blocks.map((b) => b.attrs));
    const block = blocks[0];
    check(Boolean(block && block.data && !block.error), "the block is valid JSON", block && block.error);
    check(Boolean(block && /id=["']slim-seo-schema["']/.test(block.attrs)), "the block is Slim SEO's (id=slim-seo-schema)", blocks.map((b) => ({ attrs: b.attrs, data: b.data })));
    check(!page.body.includes('id="nurevo-aeo-server"'), "Nurevo printed no graph of its own (it merged instead)", blocks.map((b) => b.attrs));
    const graph = graphOf(block);
    console.log(`  graph: ${graph.map((n) => `${types(n).join("/")}${n["@id"] ? ` ${n["@id"]}` : ""}`).join(" | ")}`);
    check(graph.filter((n) => types(n).includes("WebSite")).length === 1, "Slim SEO's WebSite node is present once", graph);
    const withPhone = graph.filter((n) => n.telephone === fx.business_phone);
    check(withPhone.length === 1, `exactly one node carries the fixture telephone (found ${withPhone.length})`, graph);
    const business = withPhone[0] || {};
    check(typeof business["@id"] === "string" && business["@id"].endsWith("/#organization"), "it is Slim SEO's Organization (@id .../#organization)", business["@id"]);
    check(types(business).includes("Organization") && types(business).includes(fx.business_type), `its type is Organization + ${fx.business_type}`, business["@type"]);
    check(business.address && business.address.streetAddress === fx.business_address, "that node carries the fixture address", business.address);
    const businessNodes = graph.filter((n) => types(n).some((t) => ["Organization", "LocalBusiness", fx.business_type].includes(t)));
    check(businessNodes.length === 1, `one business node in the graph (found ${businessNodes.length})`, businessNodes.map((n) => n["@id"]));
    const services = graph.filter((n) => types(n).includes("Service") && n.name === fx.service_name);
    check(services.length === 1, `the fixture service is in the graph once (found ${services.length})`);
    check(Boolean(services[0] && services[0].provider && services[0].provider["@id"] === business["@id"]),
      "the service's provider is Slim SEO's Organization", services[0] && services[0].provider);
    const ids = graph.map((n) => n["@id"]).filter(Boolean);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    check(dupes.length === 0, "no @id appears twice in the graph", dupes);
  }
  probe("slimseo-schema-off");
  {
    const home = (await tryGet("Slim SEO schema off: GET /", "/")) || { status: 0, body: "" };
    check(home.status === 200, `GET / (Slim SEO schema off) -> ${home.status}`);
    const blocks = jsonLdBlocks(home.body);
    check(blocks.length === 1, `Slim SEO schema off: exactly one application/ld+json block (found ${blocks.length})`, blocks.map((b) => b.attrs));
    const block = blocks[0];
    check(Boolean(block && /nurevo-aeo-server/.test(block.attrs)), "Slim SEO schema off: the block is Nurevo's own graph", blocks.map((b) => ({ attrs: b.attrs, data: b.data })));
    const head = home.body.split(/<\/head>/i)[0];
    check(head.includes('id="nurevo-aeo-server"'), "Slim SEO schema off: printed in <head>, as with any other setup");
    const graph = graphOf(block);
    check(graph.filter((n) => n.telephone === fx.business_phone).length === 1, "Slim SEO schema off: the fixture telephone is published once");
  }
  const slimHttp = probe("http");
  summarizeHttp("while serving / with Slim SEO", slimHttp);
  check(externalFromNurevo(slimHttp).length === 0, "no external HTTP from Nurevo while serving public pages with Slim SEO",
    externalFromNurevo(slimHttp).map((e) => `${e.context} ${e.method} ${e.url}`));
  probe("slimseo-schema-on");
  wp(["plugin", "deactivate", "slim-seo"]);
  wp(["plugin", "activate", "wordpress-seo"]);

  section("6. Deactivate and uninstall");
  wp(["plugin", "deactivate", PLUGIN]);
  const deactivated = probe("state");
  check(deactivated.nurevo_active === false, "Nurevo is inactive");
  check(!deactivated.cron, "deactivation cleared webmcp_canary_ruleset_check");
  // --skip-delete: run uninstall.php but keep the files, which are a mount of dist/.
  wp(["plugin", "uninstall", PLUGIN, "--skip-delete"]);
  const uninstalled = probe("state");
  check(uninstalled.options.length === 0, "uninstall removed every webmcp_canary_* option and transient", uninstalled.options);
  check(!uninstalled.cron, "no Nurevo cron event left");

  section("7. debug.log");
  {
    const log = probe("debuglog");
    const lines = log.content.split("\n").filter(Boolean);
    const bad = lines.filter((l) => /PHP (Fatal error|Parse error|Recoverable fatal error|Warning)/i.test(l));
    const notices = lines.filter((l) => /PHP (Notice|Deprecated)/i.test(l));
    const ours = lines.filter((l) => l.includes(`/plugins/${PLUGIN}/`));
    console.log(`  ${log.path}: ${lines.length} line(s), ${bad.length} fatal/warning, ${notices.length} notice/deprecated, ${ours.length} mentioning ${PLUGIN}`);
    for (const l of ours.slice(0, 20)) console.log(`    ${l}`);
    check(bad.length === 0, "no PHP fatal error, parse error or warning in debug.log", bad.slice(0, 20).join("\n       "));
  }
}

let crashed = null;
try {
  await main();
} catch (error) {
  crashed = error;
} finally {
  if (STOP && !DIRECT_WP) {
    wpEnv(["stop"], { allowFail: true });
  }
}

console.log("");
if (crashed) {
  console.error(`wp-env smoke: aborted after ${checks} check(s): ${crashed.message}`);
  let context = crashed.stack ? crashed.stack.split("\n").slice(0, 6).join("\n") : "";
  try {
    // What PHP said, if anything: the usual reason a page stops answering.
    const log = probe("debuglog");
    const tail = log.content.split("\n").filter(Boolean).slice(-15).join("\n");
    if (tail) context += `\ndebug.log (last lines):\n${tail}`;
  } catch (error) {
    context += `\n(debug.log unavailable: ${String(error.message).slice(0, 300)})`;
  }
  annotate(`aborted after ${checks} check(s): ${crashed.message}`, context);
  process.exit(1);
}
if (failures.length) {
  console.error(`wp-env smoke: ${failures.length} of ${checks} check(s) failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`wp-env smoke: all ${checks} checks passed`);
