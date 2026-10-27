/**
 * Tell IndexNow engines (Bing, and the AI search built on Bing's index, plus
 * Yandex, Seznam, Naver and others) which nurevo.jp pages exist, right after a
 * landing-page deploy, instead of waiting for them to recrawl.
 *
 *   node scripts/indexnow-submit.mjs             submit every URL in public/sitemap-pages.xml
 *   node scripts/indexnow-submit.mjs --dry-run   print the request, send nothing
 *
 * Protocol: https://www.indexnow.org/documentation - one POST of
 * {host, key, keyLocation, urlList} to https://api.indexnow.org/indexnow. The
 * key is public by design and is served from public/<key>.txt (written by the
 * build from INDEXNOW_KEY in src/site.mjs).
 *
 * It submits every page, not a diff: the sitemap holds a few dozen URLs, well
 * under the 10,000 per request the protocol allows, and a manual deploy has no
 * reliable "previous" to diff against. Store pages (/s/...) are served by the
 * worker, not this build, and are not submitted here.
 *
 * Never fails a deploy: every problem is printed as a GitHub Actions warning
 * and the script exits 0. Only --dry-run on a broken build exits non-zero, so
 * the checks catch it before anything is deployed.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ORIGIN, INDEXNOW_KEY } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");
const ENDPOINT = "https://api.indexnow.org/indexnow";
const warn = (message) => console.log(`::warning title=IndexNow::${message}`);

/** The request body, from the built files. Throws when the build is not usable. */
export function buildPayload(root = ROOT) {
  const keyFile = join(root, "public", `${INDEXNOW_KEY}.txt`);
  if (!existsSync(keyFile)) throw new Error(`key file missing: public/${INDEXNOW_KEY}.txt (run npm run build)`);
  if (readFileSync(keyFile, "utf8").trim() !== INDEXNOW_KEY) throw new Error("key file does not contain INDEXNOW_KEY");
  const sitemap = readFileSync(join(root, "public", "sitemap-pages.xml"), "utf8");
  const host = new URL(ORIGIN).host;
  const urlList = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].replace(/&amp;/g, "&").trim()))]
    .filter((url) => new URL(url).host === host);
  if (!urlList.length) throw new Error("sitemap-pages.xml lists no URLs");
  if (urlList.length > 10000) throw new Error(`too many URLs for one request: ${urlList.length}`);
  return { host, key: INDEXNOW_KEY, keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`, urlList };
}

async function keyIsLive(payload) {
  // The engines fetch keyLocation to verify ownership; right after a deploy the
  // new file can take a moment to reach every edge, so wait for it briefly.
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(payload.keyLocation, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (response.ok && (await response.text()).trim() === payload.key) return true;
    } catch { /* retried below */ }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return false;
}

async function main() {
  let payload;
  try {
    payload = buildPayload();
  } catch (error) {
    if (DRY_RUN) { console.error(`indexnow: ${error.message}`); process.exit(1); }
    warn(`not submitted: ${error.message}`);
    return;
  }
  if (DRY_RUN) {
    console.log(JSON.stringify({ endpoint: ENDPOINT, ...payload }, null, 1));
    console.log(`indexnow dry run: ${payload.urlList.length} URLs, nothing sent`);
    return;
  }
  if (!(await keyIsLive(payload))) {
    warn(`not submitted: ${payload.keyLocation} is not serving the key yet`);
    return;
  }
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
    // 200 = accepted, 202 = accepted, key validation pending. Anything else
    // (400 bad request, 403 key not valid, 422 URLs not on host, 429 too many)
    // is reported and left for the next deploy.
    if (response.status === 200 || response.status === 202) {
      console.log(`indexnow: submitted ${payload.urlList.length} URLs (HTTP ${response.status})`);
    } else {
      const text = (await response.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ");
      warn(`HTTP ${response.status} for ${payload.urlList.length} URLs${text ? `: ${text}` : ""}`);
    }
  } catch (error) {
    warn(`request failed: ${error.message}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => warn(`unexpected error: ${error.message}`));
}
