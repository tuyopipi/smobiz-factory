import { execFile } from "node:child_process";
import dns from "node:dns/promises";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import tls from "node:tls";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const UA = "PublicInfoObserver/1.0 (+https://nurevo.jp/public-info-observer)";
const outDir = new URL("../results/public-info-observer/", import.meta.url);
const jsonPath = new URL("observation.json", outDir);
const pdfPath = new URL("observation.pdf", outDir);
const rawDir = new URL("raw/", outDir);
const delayState = new Map();

const targets = [
  { id: "saas_notion", group: "A_BIG_SAAS", url: "https://www.notion.so/", evidence: "major SaaS" },
  { id: "saas_slack", group: "A_BIG_SAAS", url: "https://slack.com/", evidence: "major SaaS" },
  { id: "small_plausible", group: "B_SMALL_APP", url: "https://plausible.io/", evidence: "Product Hunt small/open-source analytics app" },
  { id: "small_buttondown", group: "B_SMALL_APP", url: "https://buttondown.email/", evidence: "Product Hunt small newsletter app" },
  { id: "ai_lovaround", group: "C_AI_BUILDER", url: "https://lovaround.com/", evidence: "Product Hunt: built with Lovable" },
  { id: "ai_usecrow", group: "C_AI_BUILDER", url: "https://usecrow.org/", evidence: "Product Hunt: built-with Lovable" }
];

const validationTargets = ["saas_notion", "ai_lovaround"];

async function main() {
  await mkdir(outDir, { recursive: true });
  await mkdir(rawDir, { recursive: true });
  const observations = [];
  for (const target of targets) {
    console.error(`observe ${target.id} ${target.url}`);
    observations.push(await observe(target));
  }
  const validations = [];
  for (const id of validationTargets) {
    const observation = observations.find((entry) => entry.id === id);
    if (observation) validations.push(await validate(observation));
  }
  const result = {
    generatedAt: new Date().toISOString(),
    userAgent: UA,
    safety: {
      removedChecks: ["/.env", "/.git/config"],
      retainedChecks: ["/robots.txt", "/.well-known/security.txt", "/security.txt"],
      sameOriginHttpDelayMs: 1000,
      robotsDisallowRespected: true
    },
    targets,
    observations,
    validations,
    falsePositiveReview: reviewFalsePositives(observations)
  };
  await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  await writeSimplePdf(pdfPath, buildPdfLines(result));
  console.log(jsonPath.pathname);
  console.log(pdfPath.pathname);
}

async function observe(target) {
  const url = new URL(target.url);
  const robots = await fetchPolicyText(new URL("/robots.txt", url.origin), url.origin, false);
  const robotsRules = parseRobots(robots.body || "");
  const rootAllowed = isAllowed(url.pathname || "/", robotsRules);
  const securityWellKnownAllowed = isAllowed("/.well-known/security.txt", robotsRules);
  const securityRootAllowed = isAllowed("/security.txt", robotsRules);

  const [dnsRecords, tlsCertificate] = await Promise.all([collectDns(url.hostname), collectTls(url.hostname)]);
  const headResponse = rootAllowed
    ? await fetchHeaders(url, url.origin)
    : { ok: false, status: 0, finalUrl: target.url, headers: {}, setCookies: [], skipped: "robots_disallow" };
  const page = rootAllowed
    ? await fetchText(url, url.origin)
    : { ok: false, status: 0, finalUrl: target.url, headers: {}, body: "", skipped: "robots_disallow" };
  const securityWellKnown = securityWellKnownAllowed
    ? await fetchPolicyText(new URL("/.well-known/security.txt", url.origin), url.origin, true)
    : { ok: false, status: 0, headers: {}, body: "", skipped: "robots_disallow" };
  const securityRoot = securityRootAllowed
    ? await fetchPolicyText(new URL("/security.txt", url.origin), url.origin, true)
    : { ok: false, status: 0, headers: {}, body: "", skipped: "robots_disallow" };

  const htmlHead = extractHead(page.body || "");
  const jsFiles = extractJsFiles(htmlHead);
  const sourcemaps = rootAllowed ? await collectSourcemaps(url, jsFiles, url.origin, robotsRules) : [];
  const cookies = parseSetCookies(page.setCookies || page.headers["set-cookie"]);
  const headCookies = parseSetCookies(headResponse.setCookies || headResponse.headers["set-cookie"]);
  const policyLinks = extractPolicyLinks(htmlHead, page.body || "", url);
  const policyChecks = await checkPolicyPages(policyLinks, url.origin, robotsRules);

  return {
    ...target,
    hostname: url.hostname,
    robots: {
      url: new URL("/robots.txt", url.origin).href,
      status: robots.status,
      ok: robots.ok,
      disallowRules: robotsRules.disallow,
      rootAllowed,
      securityWellKnownAllowed,
      securityRootAllowed
    },
    dns: dnsRecords,
    tls: tlsCertificate,
    http: {
      status: page.status,
      ok: page.ok,
      finalUrl: page.finalUrl,
      headers: page.headers,
      skipped: page.skipped
    },
    httpHead: {
      status: headResponse.status,
      ok: headResponse.ok,
      finalUrl: headResponse.finalUrl,
      headers: headResponse.headers,
      cookies: headCookies,
      skipped: headResponse.skipped
    },
    cookies,
    htmlHead,
    jsFiles,
    jsFilePatterns: jsFiles.map(patternOf),
    sourcemaps,
    securityTxt: {
      wellKnown: summarizePolicyFetch(securityWellKnown),
      root: summarizePolicyFetch(securityRoot)
    },
    policyPages: policyChecks,
    findings: makeFindings({ target, page, htmlHead, jsFiles, cookies, securityWellKnown, securityRoot, policyChecks })
  };
}

async function validate(observation) {
  const host = observation.hostname;
  const origin = new URL(observation.url).origin;
  const baseName = observation.id;
  const raw = {};

  raw.curlHeaders = await runAndSave(baseName, "curl-I.txt", "curl", ["-L", "-I", "-A", UA, observation.url]);
  raw.digCname = await runAndSave(baseName, "dig-cname.txt", "dig", [host, "CNAME"]);
  raw.digA = await runAndSave(baseName, "dig-a.txt", "dig", [host, "A"]);
  raw.digNs = await runAndSave(baseName, "dig-ns.txt", "dig", [host, "NS"]);
  raw.openssl = await runAndSave(baseName, "openssl.txt", "openssl", ["s_client", "-connect", `${host}:443`, "-servername", host, "-showcerts"], "\n");
  raw.securityHtml = await runAndSave(baseName, "curl-security.txt", "curl", ["-L", "-i", "-A", UA, `${origin}/.well-known/security.txt`]);

  const headerComparison = compareHeaders(observation.httpHead?.headers || observation.http.headers, raw.curlHeaders.output);
  const dnsComparison = compareDns(observation.dns, raw);
  const tlsComparison = compareTls(observation.tls, raw.openssl.output);
  const cookieComparison = compareCookies(observation.httpHead?.cookies || observation.cookies, raw.curlHeaders.output);
  const policyComparison = comparePolicy(observation.securityTxt.wellKnown, raw.securityHtml.output);

  return {
    id: observation.id,
    url: observation.url,
    rawFiles: Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value.path])),
    comparisons: {
      httpHeaders: headerComparison,
      dns: dnsComparison,
      tls: tlsComparison,
      cookies: cookieComparison,
      policyPage: policyComparison
    }
  };
}

async function runAndSave(baseName, fileName, command, args, input = undefined) {
  const path = new URL(`${baseName}-${fileName}`, rawDir);
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { input, timeout: 20000, maxBuffer: 1024 * 1024 * 8 });
    const output = `${stdout}${stderr ? `\n[stderr]\n${stderr}` : ""}`;
    await writeFile(path, output);
    return { ok: true, path: path.pathname, output };
  } catch (error) {
    const output = `${error.stdout || ""}${error.stderr ? `\n[stderr]\n${error.stderr}` : ""}\n[error]\n${error.message}`;
    await writeFile(path, output);
    return { ok: false, path: path.pathname, output };
  }
}

async function collectDns(hostname) {
  const out = {};
  for (const type of ["CNAME", "A", "NS"]) {
    try {
      out[type] = await dns.resolve(hostname, type);
    } catch (error) {
      out[type] = { error: error.code || error.message };
    }
  }
  return out;
}

function collectTls(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, timeout: 8000 }, () => {
      const cert = socket.getPeerCertificate(true);
      socket.end();
      resolve({
        issuer: cert?.issuer || null,
        subjectaltname: cert?.subjectaltname || "",
        valid_from: cert?.valid_from || "",
        valid_to: cert?.valid_to || ""
      });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ error: "timeout" });
    });
    socket.on("error", (error) => resolve({ error: error.code || error.message }));
  });
}

async function fetchText(url, origin) {
  await respectDelay(origin);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,text/plain,*/*" }
    });
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      headers: headersObject(response.headers),
      setCookies: getSetCookies(response.headers),
      body: await response.text()
    };
  } catch (error) {
    return { ok: false, status: 0, finalUrl: url.href, headers: {}, body: "", error: error.name === "AbortError" ? "timeout" : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHeaders(url, origin) {
  await respectDelay(origin);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,text/plain,*/*" }
    });
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      headers: headersObject(response.headers),
      setCookies: getSetCookies(response.headers)
    };
  } catch (error) {
    return { ok: false, status: 0, finalUrl: url.href, headers: {}, setCookies: [], error: error.name === "AbortError" ? "timeout" : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function headersObject(headers) {
  const out = Object.fromEntries(headers.entries());
  const setCookies = getSetCookies(headers);
  if (setCookies.length) out["set-cookie"] = setCookies;
  return out;
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const value = headers.get("set-cookie");
  return value ? splitCombinedSetCookie(value) : [];
}

async function fetchPolicyText(url, origin, tolerateMissing) {
  const result = await fetchText(url, origin);
  if (tolerateMissing && [404, 403, 410].includes(result.status)) return result;
  return result;
}

async function respectDelay(origin) {
  const last = delayState.get(origin) || 0;
  const waitMs = Math.max(0, 1000 - (Date.now() - last));
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
  delayState.set(origin, Date.now());
}

function parseRobots(text) {
  const groups = [];
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "user-agent") {
      current = { agents: [value.toLowerCase()], disallow: [] };
      groups.push(current);
    } else if (current && key === "disallow") {
      current.disallow.push(value);
    }
  }
  const our = UA.split("/")[0].toLowerCase();
  const selected = groups.filter((group) => group.agents.includes("*") || group.agents.includes(our));
  return { disallow: selected.flatMap((group) => group.disallow).filter(Boolean) };
}

function isAllowed(pathname, rules) {
  for (const rule of rules.disallow || []) {
    if (rule === "/") return false;
    if (rule && pathname.startsWith(rule)) return false;
  }
  return true;
}

function extractHead(html) {
  const match = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  return match ? match[0] : "";
}

function extractJsFiles(headHtml) {
  return [...headHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
}

async function collectSourcemaps(baseUrl, jsFiles, origin, robotsRules) {
  const out = [];
  for (const src of jsFiles.slice(0, 8)) {
    const jsUrl = new URL(src, baseUrl);
    const mapUrl = new URL(`${jsUrl.href}.map`);
    if (mapUrl.origin === origin && !isAllowed(mapUrl.pathname, robotsRules)) {
      out.push({ js: jsUrl.href, map: mapUrl.href, exists: false, skipped: "robots_disallow" });
      continue;
    }
    if (mapUrl.origin === origin) await respectDelay(origin);
    try {
      const response = await fetch(mapUrl, { method: "HEAD", redirect: "follow", headers: { "user-agent": UA } });
      out.push({ js: jsUrl.href, map: mapUrl.href, exists: response.ok, status: response.status });
    } catch (error) {
      out.push({ js: jsUrl.href, map: mapUrl.href, exists: false, error: error.message });
    }
  }
  return out;
}

function parseSetCookies(headerValue) {
  if (!headerValue) return [];
  const rawCookies = Array.isArray(headerValue) ? headerValue : splitCombinedSetCookie(String(headerValue));
  return rawCookies.map((raw) => {
    const parts = raw.split(";").map((part) => part.trim());
    const [nameValue, ...attrs] = parts;
    const [name] = nameValue.split("=");
    return {
      name,
      raw,
      secure: attrs.some((attr) => /^secure$/i.test(attr)),
      httpOnly: attrs.some((attr) => /^httponly$/i.test(attr)),
      sameSite: attrs.find((attr) => /^samesite=/i.test(attr))?.split("=")[1] || null,
      domain: attrs.find((attr) => /^domain=/i.test(attr))?.split("=")[1] || null,
      path: attrs.find((attr) => /^path=/i.test(attr))?.split("=")[1] || null
    };
  });
}

function splitCombinedSetCookie(value) {
  return value.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map((part) => part.trim()).filter(Boolean);
}

function extractPolicyLinks(headHtml, body, baseUrl) {
  const html = `${headHtml}\n${body.slice(0, 200000)}`;
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ href: new URL(match[1], baseUrl).href, text: stripTags(match[2]).toLowerCase() }))
    .filter((link) => /privacy|policy|terms|security|legal|利用規約|プライバシー/.test(`${link.href} ${link.text}`));
  const deduped = new Map();
  for (const link of links) deduped.set(link.href, link);
  return [...deduped.values()].slice(0, 8);
}

async function checkPolicyPages(links, origin, robotsRules) {
  const out = [];
  for (const link of links.slice(0, 4)) {
    const url = new URL(link.href);
    if (url.origin === origin && !isAllowed(url.pathname, robotsRules)) {
      out.push({ ...link, ok: false, skipped: "robots_disallow" });
      continue;
    }
    const result = await fetchText(url, url.origin);
    out.push({ ...link, ok: result.ok, status: result.status, finalUrl: result.finalUrl, title: extractTitle(result.body || "") });
  }
  return out;
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTitle(html) {
  return stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").slice(0, 160);
}

function summarizePolicyFetch(fetchResult) {
  return {
    ok: fetchResult.ok,
    status: fetchResult.status,
    finalUrl: fetchResult.finalUrl,
    skipped: fetchResult.skipped,
    hasContact: /contact:/i.test(fetchResult.body || ""),
    hasExpires: /expires:/i.test(fetchResult.body || "")
  };
}

function makeFindings({ page, htmlHead, jsFiles, cookies, securityWellKnown, securityRoot, policyChecks }) {
  const findings = [];
  if (!page.ok) findings.push({ id: "page_fetch_failed", severity: "info", evidence: `status=${page.status || page.error || page.skipped}` });
  if (cookies.some((cookie) => !cookie.secure)) findings.push({ id: "cookie_without_secure", severity: "medium", evidence: cookies.filter((cookie) => !cookie.secure).map((cookie) => cookie.name) });
  if (cookies.some((cookie) => !cookie.httpOnly)) findings.push({ id: "cookie_without_httponly", severity: "low", evidence: cookies.filter((cookie) => !cookie.httpOnly).map((cookie) => cookie.name) });
  if (securityWellKnown.ok || securityRoot.ok) findings.push({ id: "security_txt_present", severity: "positive", evidence: { wellKnown: securityWellKnown.status, root: securityRoot.status } });
  if (policyChecks.some((check) => check.ok)) findings.push({ id: "policy_pages_present", severity: "positive", evidence: policyChecks.filter((check) => check.ok).map((check) => check.href) });
  if (htmlHead.toLowerCase().includes("lovable") || jsFiles.includes("/~flock.js")) findings.push({ id: "ai_builder_lovable_signal", severity: "info", evidence: { headLovable: htmlHead.toLowerCase().includes("lovable"), flock: jsFiles.includes("/~flock.js") } });
  return findings;
}

function patternOf(src) {
  return src
    .replace(/^https?:\/\/[^/]+/i, "{origin}")
    .replace(/[A-Za-z0-9_-]{12,}(?=\.js|\?|$)/g, "{hash}")
    .replace(/[a-f0-9]{8,}/gi, "{hash}")
    .replace(/\d+(?:\.\d+)+/g, "{version}");
}

function compareHeaders(observed, curlOutput) {
  const curlHeaders = parseCurlHeaders(curlOutput);
  const mismatches = [];
  for (const key of ["server", "content-type", "set-cookie", "location"]) {
    const observedValue = normalizeHeader(observed[key]);
    const curlValue = normalizeHeader(curlHeaders[key]);
    if (observedValue || curlValue) {
      const match = key === "set-cookie" ? Boolean(observedValue) === Boolean(curlValue) : observedValue === curlValue;
      if (!match) mismatches.push({ key, observed: observedValue, raw: curlValue });
    }
  }
  return { status: mismatches.length ? "mismatch" : "match", mismatches };
}

function parseCurlHeaders(output) {
  const blocks = output.split(/\r?\n\r?\n/).filter((block) => /^HTTP\//i.test(block.trim()));
  const last = blocks.at(-1) || "";
  const headers = {};
  for (const line of last.split(/\r?\n/).slice(1)) {
    const index = line.indexOf(":");
    if (index < 0) continue;
    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    headers[key] = headers[key] ? `${headers[key]}, ${value}` : value;
  }
  return headers;
}

function normalizeHeader(value) {
  if (!value) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function compareDns(observed, raw) {
  return {
    CNAME: compareRecord(observed.CNAME, raw.digCname.output),
    A: compareRecord(observed.A, raw.digA.output),
    NS: compareRecord(observed.NS, raw.digNs.output)
  };
}

function compareRecord(observedRecord, digOutput) {
  const observed = Array.isArray(observedRecord) ? observedRecord.map((v) => v.replace(/\.$/, "")).sort() : [];
  const raw = extractDigAnswers(digOutput);
  if (!observed.length && !raw.length) return { status: "match", observed, raw };
  return { status: JSON.stringify(observed) === JSON.stringify(raw) ? "match" : "mismatch", observed, raw };
}

function extractDigAnswers(output) {
  const lines = output.split(/\r?\n/);
  const answers = [];
  let inAnswer = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === ";; ANSWER SECTION:") {
      inAnswer = true;
      continue;
    }
    if (inAnswer && line.startsWith(";; ")) break;
    if (!inAnswer || !line || line.startsWith(";")) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 5) answers.push(parts.slice(4).join(" ").replace(/\.$/, ""));
  }
  return answers.sort();
}

function compareTls(observed, opensslOutput) {
  const issuerCn = observed.issuer?.CN || "";
  const issuerFound = issuerCn ? opensslOutput.includes(issuerCn) : false;
  const sanHosts = String(observed.subjectaltname || "")
    .split(/,\s*/)
    .map((entry) => entry.replace(/^DNS:/, ""))
    .filter(Boolean);
  const sanFound = sanHosts.length ? sanHosts.some((host) => opensslOutput.includes(host)) : false;
  return { status: issuerFound || sanFound ? "match" : "mismatch", issuerCn, issuerFound, sanSample: sanHosts.slice(0, 5), sanFound };
}

function compareCookies(observedCookies, curlOutput) {
  const finalHeaderBlock = curlOutput.split(/\r?\n\r?\n/).filter((block) => /^HTTP\//i.test(block.trim())).at(-1) || "";
  const rawSetCookies = finalHeaderBlock.split(/\r?\n/).filter((line) => /^set-cookie:/i.test(line));
  const rawNames = rawSetCookies.map((line) => line.replace(/^set-cookie:\s*/i, "").split("=")[0]);
  const observedNames = observedCookies.map((cookie) => cookie.name);
  return {
    status: JSON.stringify([...observedNames].sort()) === JSON.stringify([...rawNames].sort()) ? "match" : "mismatch",
    observedNames,
    rawNames
  };
}

function comparePolicy(observedPolicy, curlOutput) {
  const rawStatus = curlOutput.match(/^HTTP\/\S+\s+(\d+)/im)?.[1] || "";
  const rawHasContact = /contact:/i.test(curlOutput);
  const statusMatch = rawStatus ? Number(rawStatus) === observedPolicy.status : false;
  const contactMatch = rawHasContact === observedPolicy.hasContact;
  return { status: statusMatch && contactMatch ? "match" : "mismatch", observed: observedPolicy, rawStatus, rawHasContact };
}

function reviewFalsePositives(observations) {
  const bigSaas = observations.filter((entry) => entry.group === "A_BIG_SAAS");
  return bigSaas.map((entry) => ({
    id: entry.id,
    findings: entry.findings,
    potentiallyUnnecessaryFindings: entry.findings.filter((finding) => finding.severity !== "positive")
  }));
}

function buildPdfLines(result) {
  const lines = [
    "Public Info Observer Accuracy Check",
    `Generated: ${result.generatedAt}`,
    `User-Agent: ${result.userAgent}`,
    "",
    "Targets"
  ];
  for (const obs of result.observations) {
    lines.push(`${obs.id} ${obs.group} ${obs.url} status=${obs.http.status} final=${obs.http.finalUrl || ""}`);
    lines.push(`  findings=${obs.findings.map((finding) => finding.id).join(", ") || "none"}`);
  }
  lines.push("", "Validation");
  for (const validation of result.validations) {
    lines.push(`${validation.id} ${validation.url}`);
    for (const [key, value] of Object.entries(validation.comparisons)) {
      lines.push(`  ${key}: ${JSON.stringify(value).slice(0, 900)}`);
    }
  }
  return lines;
}

async function writeSimplePdf(path, lines) {
  const escapedLines = lines.flatMap((line) => wrapPdfLine(line, 110));
  const content = ["BT", "/F1 8 Tf", "36 800 Td", "10 TL"];
  for (const line of escapedLines.slice(0, 240)) {
    content.push(`(${escapePdf(line)}) Tj`, "T*");
  }
  content.push("ET");
  const stream = content.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  await writeFile(path, pdf);
}

function wrapPdfLine(line, width) {
  const out = [];
  let value = line;
  while (value.length > width) {
    out.push(value.slice(0, width));
    value = `  ${value.slice(width)}`;
  }
  out.push(value);
  return out;
}

function escapePdf(value) {
  return value.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7E]/g, "?");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
