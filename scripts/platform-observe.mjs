import dns from "node:dns/promises";
import { mkdir, writeFile } from "node:fs/promises";
import tls from "node:tls";

const outDir = new URL("../results/platform-fingerprint/", import.meta.url);
const outPath = new URL("observation.json", outDir);

const wappalyzerFiles = {
  Lovable: "l",
  Bolt: "b",
  Replit: "r",
  v0: "v",
  Vercel: "v"
};

const sites = [
  { id: "a_lovable_1", group: "A", platform: "Lovable", kind: "subdomain", url: "https://termwise-insight.lovable.app/dashboard" },
  { id: "a_lovable_2", group: "A", platform: "Lovable", kind: "subdomain", url: "https://knowledge-blaze-hub.lovable.app/dashboard" },
  { id: "a_lovable_3", group: "A", platform: "Lovable", kind: "subdomain", url: "https://task-event-buddy.lovable.app/" },
  { id: "a_lovable_4", group: "A", platform: "Lovable", kind: "subdomain", url: "https://annual-impact-dashboard.lovable.app/" },
  { id: "a_lovable_5", group: "A", platform: "Lovable", kind: "subdomain", url: "https://pulsewatch.lovable.app/" },
  { id: "a_lovable_custom_1", group: "A", platform: "Lovable", kind: "custom-domain", url: "https://aplicativos.poker/", evidence: "https://madewithlovable.com/" },
  { id: "a_lovable_custom_2", group: "A", platform: "Lovable", kind: "custom-domain", url: "https://gradloom.app/", evidence: "https://madewithlovable.com/" },
  { id: "a_lovable_custom_3", group: "A", platform: "Lovable", kind: "custom-domain", url: "https://consile.app/", evidence: "https://madewithlovable.com/" },
  { id: "a_lovable_custom_4", group: "A", platform: "Lovable", kind: "custom-domain", url: "https://phillipohren.com/", evidence: "https://madewithlovable.com/" },
  { id: "a_lovable_custom_5", group: "A", platform: "Lovable", kind: "custom-domain", url: "https://launchin48.co/", evidence: "https://madewithlovable.com/" },
  { id: "b_1", group: "B", platform: "control", kind: "control", url: "https://example.com/" },
  { id: "b_2", group: "B", platform: "control", kind: "control", url: "https://www.iana.org/" },
  { id: "b_3", group: "B", platform: "control", kind: "control", url: "https://www.gov.uk/" },
  { id: "b_4", group: "B", platform: "control", kind: "control", url: "https://www.wikipedia.org/" },
  { id: "b_5", group: "B", platform: "control", kind: "control", url: "https://astro.build/" },
  { id: "b_6", group: "B", platform: "control", kind: "control", url: "https://tailwindcss.com/" },
  { id: "b_7", group: "B", platform: "control", kind: "control", url: "https://react.dev/" },
  { id: "b_8", group: "B", platform: "control", kind: "control", url: "https://vite.dev/" },
  { id: "b_9", group: "B", platform: "control", kind: "control", url: "https://www.python.org/" },
  { id: "b_10", group: "B", platform: "control", kind: "control", url: "https://www.ruby-lang.org/en/" }
];

const customDomainGap = {
  required: 5,
  collected: 5,
  reason: "Custom-domain examples were taken from a public Lovable-built directory, not generated or guessed."
};

async function main() {
  await mkdir(outDir, { recursive: true });
  const wappalyzer = await collectWappalyzer();
  const observations = [];
  for (const site of sites) {
    observations.push(await observeSite(site));
  }
  const features = summarizeFeatures(observations);
  const result = {
    generatedAt: new Date().toISOString(),
    wappalyzer,
    task2: {
      customDomainGap,
      sites
    },
    observations,
    features
  };
  await writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(outPath.pathname);
}

async function collectWappalyzer() {
  const cache = {};
  const result = {};
  for (const [name, letter] of Object.entries(wappalyzerFiles)) {
    cache[letter] ??= await fetchJson(`https://raw.githubusercontent.com/tomnomnom/wappalyzer/master/src/technologies/${letter}.json`);
    result[name] = cache[letter][name] ? { exists: true, definition: cache[letter][name] } : { exists: false, definition: null };
  }
  return result;
}

async function observeSite(site) {
  const url = new URL(site.url);
  const hostname = url.hostname;
  const [dnsRecords, tlsCertificate, http] = await Promise.all([
    collectDns(hostname),
    collectTls(hostname),
    collectHttp(site.url)
  ]);
  const headHtml = extractHead(http.body || "");
  const jsFiles = extractJsFiles(headHtml);
  const sourcemaps = await collectSourcemaps(url, jsFiles);
  return {
    ...site,
    hostname,
    live: http.ok,
    dns: dnsRecords,
    http: {
      status: http.status,
      finalUrl: http.finalUrl,
      headers: http.headers
    },
    tls: tlsCertificate,
    htmlHead: headHtml,
    jsFiles,
    jsFilePatterns: jsFiles.map((src) => patternOf(src)),
    sourcemaps
  };
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

async function collectHttp(url) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Nurevo-Platform-Fingerprint/0.1" }
    });
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text()
    };
  } catch (error) {
    return { ok: false, status: 0, finalUrl: url, headers: {}, body: "", error: error.message };
  }
}

function extractHead(html) {
  const match = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  return match ? match[0] : "";
}

function extractJsFiles(headHtml) {
  return [...headHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
}

async function collectSourcemaps(baseUrl, jsFiles) {
  const out = [];
  for (const src of jsFiles.slice(0, 20)) {
    const jsUrl = new URL(src, baseUrl).href;
    const mapUrl = `${jsUrl}.map`;
    try {
      const response = await fetch(mapUrl, { method: "HEAD", redirect: "follow" });
      out.push({ js: jsUrl, map: mapUrl, exists: response.ok, status: response.status });
    } catch (error) {
      out.push({ js: jsUrl, map: mapUrl, exists: false, error: error.message });
    }
  }
  return out;
}

function patternOf(src) {
  return src
    .replace(/^https?:\/\/[^/]+/i, "{origin}")
    .replace(/[a-f0-9]{8,}/gi, "{hash}")
    .replace(/\d+(?:\.\d+)+/g, "{version}");
}

function summarizeFeatures(observations) {
  const signals = [
    { name: "hostname_suffix_lovable_app", test: (o) => o.hostname.endsWith(".lovable.app") },
    { name: "hostname_suffix_replit_app", test: (o) => o.hostname.endsWith(".replit.app") },
    { name: "cname_contains_lovable", test: (o) => JSON.stringify(o.dns.CNAME || []).includes("lovable") },
    { name: "cname_contains_replit", test: (o) => JSON.stringify(o.dns.CNAME || []).includes("replit") },
    { name: "header_server_vercel", test: (o) => String(o.http.headers.server || "").toLowerCase().includes("vercel") },
    { name: "header_x_vercel", test: (o) => Object.keys(o.http.headers).some((key) => key.toLowerCase().startsWith("x-vercel")) },
    { name: "html_contains_lovable", test: (o) => o.htmlHead.toLowerCase().includes("lovable") },
    { name: "html_contains_replit", test: (o) => o.htmlHead.toLowerCase().includes("replit") },
    { name: "script_flock_js", test: (o) => o.jsFilePatterns.some((p) => p.includes("/~flock.js")) },
    { name: "script_assets_index_hash_js", test: (o) => o.jsFilePatterns.some((p) => /\/assets\/index[-.].*\{hash\}.*\.js/.test(p)) },
    { name: "sourcemap_exists", test: (o) => o.sourcemaps.some((m) => m.exists) }
  ];
  return signals.map((signal) => {
    const a = observations.filter((o) => o.group === "A");
    const b = observations.filter((o) => o.group === "B");
    return {
      name: signal.name,
      A: a.filter(signal.test).length,
      A_total: a.length,
      B: b.filter(signal.test).length,
      B_total: b.length,
      A_ids: a.filter(signal.test).map((o) => o.id),
      B_ids: b.filter(signal.test).map((o) => o.id)
    };
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.json();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
