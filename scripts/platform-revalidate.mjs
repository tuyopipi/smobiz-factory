import dns from "node:dns/promises";
import { mkdir, writeFile } from "node:fs/promises";
import tls from "node:tls";

const outDir = new URL("../results/platform-fingerprint-recheck/", import.meta.url);
const outPath = new URL("observation.json", outDir);

const sites = [
  { id: "lovable_01", group: "A_LOVABLE", kind: "custom-domain", url: "https://lovaround.com/", evidence: "Product Hunt built-with: Lovable" },
  { id: "lovable_02", group: "A_LOVABLE", kind: "custom-domain", url: "https://commenteasy.com/", evidence: "Product Hunt built-with: Lovable" },
  { id: "lovable_03", group: "A_LOVABLE", kind: "custom-domain", url: "https://theinfinite.bar/", evidence: "Product Hunt built-with: Lovable" },
  { id: "lovable_04", group: "A_LOVABLE", kind: "custom-domain", url: "https://usecrow.org/", evidence: "Product Hunt built-with: Lovable" },
  { id: "lovable_05", group: "A_LOVABLE", kind: "custom-domain", url: "https://uisnapper.xyz/", evidence: "Product Hunt built-with: Lovable" },
  { id: "lovable_06", group: "A_LOVABLE", kind: "custom-domain", url: "https://gateway-io.com/", evidence: "Product Hunt built-with: Lovable" },
  { id: "lovable_07", group: "A_LOVABLE", kind: "custom-domain", url: "https://shockvueapp.com/", evidence: "Product Hunt built-with: Lovable" },
  { id: "lovable_08", group: "A_LOVABLE", kind: "custom-domain", url: "https://moop.to/", evidence: "Product Hunt built-with: Lovable" },
  { id: "lovable_09", group: "A_LOVABLE", kind: "custom-domain", url: "https://konfide.ai/", evidence: "Product Hunt built-with: Lovable" },
  { id: "lovable_10", group: "A_LOVABLE", kind: "custom-domain", url: "https://kidboost.app/", evidence: "Product Hunt Lovable review says used for KidBoost.app" },
  { id: "lovable_11", group: "A_LOVABLE", kind: "custom-domain", url: "https://familycash.app/", evidence: "Product Hunt Lovable review says used for FamilyCash.app" },
  { id: "lovable_12", group: "A_LOVABLE", kind: "custom-domain", url: "https://mindpal.space/", evidence: "Product Hunt Lovable customers: demo hub built with Lovable" },
  { id: "lovable_13", group: "A_LOVABLE", kind: "custom-domain", url: "https://draftboard.com/", evidence: "Product Hunt Lovable customers: original vision off the ground" },
  { id: "lovable_14", group: "A_LOVABLE", kind: "custom-domain", url: "https://jinna.ai/", evidence: "Product Hunt Lovable customers: working prototype of Jinna" },
  { id: "lovable_15", group: "A_LOVABLE", kind: "custom-domain", url: "https://aden.agency/", evidence: "Product Hunt Lovable customers: working prototype" },

  { id: "bolt_custom_01", group: "A_BOLT", kind: "custom-domain", url: "https://blakebill.com/", evidence: "Product Hunt bolt.new founder review" },
  { id: "bolt_custom_02", group: "A_BOLT", kind: "custom-domain", url: "https://we0.ai/", evidence: "Product Hunt bolt.new founder review" },
  { id: "bolt_custom_03", group: "A_BOLT", kind: "custom-domain", url: "https://yofounder.com/", evidence: "Product Hunt bolt.new founder review" },
  { id: "bolt_custom_04", group: "A_BOLT", kind: "custom-domain", url: "https://unveilengine.com/", evidence: "Product Hunt built-with: bolt.new" },
  { id: "bolt_custom_05", group: "A_BOLT", kind: "custom-domain", url: "https://pg-reader.netlify.app/", evidence: "Product Hunt built-with: bolt.new" },
  { id: "bolt_sub_01", group: "A_BOLT", kind: "subdomain", url: "https://tbh-market-steam-ite-y1s4.bolt.host/marketplace", evidence: "URL search result; excluded from conclusion if unsafe/unavailable" },
  { id: "bolt_sub_02", group: "A_BOLT", kind: "subdomain", url: "https://website-redirection-c0h5.bolt.host/", evidence: "URL search result; excluded from conclusion if unsafe/unavailable" },
  { id: "bolt_sub_03", group: "A_BOLT", kind: "subdomain", url: "https://amazon-pr.bolt.host/", evidence: "URL search result; excluded from conclusion if unsafe/unavailable" },
  { id: "bolt_sub_04", group: "A_BOLT", kind: "subdomain", url: "https://chipotle-250rev.bolt.host/", evidence: "URL search result; excluded from conclusion if unsafe/unavailable" },
  { id: "bolt_sub_05", group: "A_BOLT", kind: "subdomain", url: "https://kamla-hijazi-gaza-su-0eua.bolt.host/", evidence: "URL search result; excluded from conclusion if unsafe/unavailable" },

  { id: "replit_custom_01", group: "A_REPLIT", kind: "custom-domain", url: "https://cloudworldmodel.ai/", evidence: "Product Hunt built-with: Replit" },
  { id: "replit_custom_02", group: "A_REPLIT", kind: "custom-domain", url: "https://sanota.app/", evidence: "Product Hunt built-with: Replit" },
  { id: "replit_custom_03", group: "A_REPLIT", kind: "custom-domain", url: "https://seerplatform.dev/", evidence: "Product Hunt built-with: Replit" },
  { id: "replit_custom_04", group: "A_REPLIT", kind: "custom-domain", url: "https://ai-pact.com/", evidence: "Product Hunt built-with: Replit" },
  { id: "replit_custom_05", group: "A_REPLIT", kind: "custom-domain", url: "https://groupcard.urbanalgorithm.com/", evidence: "Product Hunt built-with: Replit" },
  { id: "replit_sub_01", group: "A_REPLIT", kind: "subdomain", url: "https://replit-brasil.replit.app/", evidence: "public replit.app URL from search" },
  { id: "replit_sub_02", group: "A_REPLIT", kind: "subdomain", url: "https://support-bot-template.replit.app/faq", evidence: "public replit.app URL from search" },
  { id: "replit_sub_03", group: "A_REPLIT", kind: "subdomain", url: "https://reglens-database.replit.app/replit-guide", evidence: "public replit.app URL from search" },
  { id: "replit_sub_04", group: "A_REPLIT", kind: "subdomain", url: "https://lennypm.replit.app/", evidence: "public replit.app URL from search" },
  { id: "replit_sub_05", group: "A_REPLIT", kind: "subdomain", url: "https://podpixel.replit.app/", evidence: "public replit.app URL from search" },

  { id: "b_01", group: "B", kind: "control-small-app", url: "https://www.bannerbear.com/", evidence: "Product Hunt; small team SaaS, no AI-builder evidence in source" },
  { id: "b_02", group: "B", kind: "control-small-app", url: "https://tinybird.co/", evidence: "Product Hunt; general stack" },
  { id: "b_03", group: "B", kind: "control-small-app", url: "https://plausible.io/", evidence: "indie/open-source analytics app" },
  { id: "b_04", group: "B", kind: "control-small-app", url: "https://umami.is/", evidence: "open-source analytics app" },
  { id: "b_05", group: "B", kind: "control-small-app", url: "https://cal.com/", evidence: "open-source scheduling app" },
  { id: "b_06", group: "B", kind: "control-small-app", url: "https://dub.co/", evidence: "small web app, open-source Next.js" },
  { id: "b_07", group: "B", kind: "control-small-app", url: "https://documenso.com/", evidence: "open-source document signing app" },
  { id: "b_08", group: "B", kind: "control-small-app", url: "https://formbricks.com/", evidence: "open-source survey app" },
  { id: "b_09", group: "B", kind: "control-small-app", url: "https://plane.so/", evidence: "open-source project management app" },
  { id: "b_10", group: "B", kind: "control-small-app", url: "https://appwrite.io/", evidence: "developer tool site" },
  { id: "b_11", group: "B", kind: "control-small-app", url: "https://posthog.com/", evidence: "startup app site" },
  { id: "b_12", group: "B", kind: "control-small-app", url: "https://www.tella.tv/", evidence: "Product Hunt video app" },
  { id: "b_13", group: "B", kind: "control-small-app", url: "https://screen.studio/", evidence: "small-team app" },
  { id: "b_14", group: "B", kind: "control-small-app", url: "https://www.usefathom.com/", evidence: "indie analytics app" },
  { id: "b_15", group: "B", kind: "control-small-app", url: "https://buttondown.email/", evidence: "indie newsletter app" },
  { id: "b_16", group: "B", kind: "control-small-app", url: "https://readwise.io/", evidence: "small productivity app" },
  { id: "b_17", group: "B", kind: "control-small-app", url: "https://micro.blog/", evidence: "indie web app" },
  { id: "b_18", group: "B", kind: "control-small-app", url: "https://www.indiehackers.com/", evidence: "community web app" },
  { id: "b_19", group: "B", kind: "control-small-app", url: "https://linear.app/", evidence: "SaaS app, general stack" },
  { id: "b_20", group: "B", kind: "control-small-app", url: "https://www.raycast.com/", evidence: "small-team app, general stack" }
];

const signalDefs = [
  { name: "hostname_lovable_app", test: (o) => o.hostname.endsWith(".lovable.app") },
  { name: "hostname_bolt_host", test: (o) => o.hostname.endsWith(".bolt.host") },
  { name: "hostname_replit_app", test: (o) => o.hostname.endsWith(".replit.app") },
  { name: "script_flock_js", test: (o) => o.jsFilePatterns.includes("/~flock.js") },
  { name: "head_lovable", test: (o) => o.htmlHeadLower.includes("lovable") },
  { name: "head_bolt", test: (o) => o.htmlHeadLower.includes("bolt") || o.htmlHeadLower.includes("stackblitz") },
  { name: "head_replit", test: (o) => o.htmlHeadLower.includes("replit") },
  { name: "server_cloudflare", test: (o) => String(o.http.headers.server || "").toLowerCase().includes("cloudflare") },
  { name: "server_google_frontend", test: (o) => String(o.http.headers.server || "").toLowerCase().includes("google frontend") },
  { name: "header_replit_cluster", test: (o) => Object.keys(o.http.headers).some((k) => k.toLowerCase() === "replit-cluster") },
  { name: "header_x_vercel", test: (o) => Object.keys(o.http.headers).some((k) => k.toLowerCase().startsWith("x-vercel")) },
  { name: "tls_san_lovable", test: (o) => String(o.tls.subjectaltname || "").includes("lovable.app") },
  { name: "tls_san_bolt", test: (o) => String(o.tls.subjectaltname || "").includes("bolt.host") },
  { name: "tls_san_replit", test: (o) => String(o.tls.subjectaltname || "").includes("replit.app") },
  { name: "sourcemap_exists", test: (o) => o.sourcemaps.some((m) => m.exists) }
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const observations = [];
  for (const site of sites) {
    console.error(`observe ${site.id} ${site.url}`);
    observations.push(await observeSite(site));
  }
  const result = {
    generatedAt: new Date().toISOString(),
    notes: [
      "Bolt subdomain examples found in public search were security-report-derived and should not be treated as healthy product examples.",
      "B controls are small/smaller web apps or open-source SaaS/control sites, replacing the previous famous-framework-docs controls."
    ],
    observations,
    features: summarizeFeatures(observations)
  };
  await writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(outPath.pathname);
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
      headers: http.headers,
      error: http.error
    },
    tls: tlsCertificate,
    htmlHead: headHtml,
    htmlHeadLower: headHtml.toLowerCase(),
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
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, timeout: 7000 }, () => {
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Nurevo-Platform-Recheck/0.1" }
    });
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text()
    };
  } catch (error) {
    return { ok: false, status: 0, finalUrl: url, headers: {}, body: "", error: error.name === "AbortError" ? "timeout" : error.message };
  } finally {
    clearTimeout(timeout);
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
  for (const src of jsFiles.slice(0, 12)) {
    const jsUrl = new URL(src, baseUrl).href;
    const mapUrl = `${jsUrl}.map`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(mapUrl, { method: "HEAD", redirect: "follow", signal: controller.signal });
      out.push({ js: jsUrl, map: mapUrl, exists: response.ok, status: response.status });
    } catch (error) {
      out.push({ js: jsUrl, map: mapUrl, exists: false, error: error.name === "AbortError" ? "timeout" : error.message });
    } finally {
      clearTimeout(timeout);
    }
  }
  return out;
}

function patternOf(src) {
  return src
    .replace(/^https?:\/\/[^/]+/i, "{origin}")
    .replace(/[A-Za-z0-9_-]{12,}(?=\.js|\?|$)/g, "{hash}")
    .replace(/[a-f0-9]{8,}/gi, "{hash}")
    .replace(/\d+(?:\.\d+)+/g, "{version}");
}

function summarizeFeatures(observations) {
  const groups = ["A_LOVABLE", "A_BOLT", "A_REPLIT", "B"];
  return signalDefs.map((signal) => {
    const row = { name: signal.name };
    for (const group of groups) {
      const sample = observations.filter((o) => o.group === group);
      const matches = sample.filter(signal.test);
      row[group] = matches.length;
      row[`${group}_total`] = sample.length;
      row[`${group}_ids`] = matches.map((o) => o.id);
    }
    return row;
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
