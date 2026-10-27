/**
 * IndexNow and crawler access: the key file the deploy relies on is built and
 * matches the key, the submit request can be built from the sitemap, and
 * robots.txt keeps the AI search crawlers in and points at the sitemap.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN, INDEXNOW_KEY } from "../src/site.mjs";
import { buildPayload } from "./indexnow-submit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

assert.match(INDEXNOW_KEY, /^[a-f0-9]{32}$/, "INDEXNOW_KEY is 32 lower-case hex characters");
assert.equal(readFileSync(join(PUBLIC, `${INDEXNOW_KEY}.txt`), "utf8"), INDEXNOW_KEY, "public/<key>.txt holds exactly the key");
// One key file only: a stale one left behind would keep an old key valid.
const keyFiles = readdirSync(PUBLIC).filter((name) => /^[a-f0-9]{32}\.txt$/.test(name));
assert.deepEqual(keyFiles, [`${INDEXNOW_KEY}.txt`], "exactly one IndexNow key file in public/");

const payload = buildPayload(ROOT);
assert.equal(payload.host, "nurevo.jp");
assert.equal(payload.keyLocation, `${ORIGIN}/${INDEXNOW_KEY}.txt`);
assert.ok(payload.urlList.length > 0 && payload.urlList.every((url) => url.startsWith(`${ORIGIN}/`)), "every URL is on nurevo.jp");
assert.ok(payload.urlList.includes(`${ORIGIN}/`), "the home page is submitted");

// robots.txt is served by the worker (worker/site-seo.mjs); public/robots.txt is
// the build's copy of the same output.
const robots = readFileSync(join(PUBLIC, "robots.txt"), "utf8");
const groups = robots.split(/\n\s*\n/);
for (const agent of ["Bingbot", "OAI-SearchBot", "PerplexityBot", "Claude-SearchBot", "ClaudeBot"]) {
  const group = groups.find((block) => block.split("\n").some((line) => line.trim() === `User-agent: ${agent}`));
  assert.ok(group, `robots.txt names ${agent}`);
  assert.match(group, /^Allow: \/$/m, `${agent} is allowed`);
  assert.doesNotMatch(group, /^Disallow: \/$/m, `${agent} is not blocked`);
}
assert.match(robots, /^Sitemap: https:\/\/nurevo\.jp\/sitemap\.xml$/m, "robots.txt points to the sitemap");

console.log(`indexnow check: key file ok, ${payload.urlList.length} URLs ready to submit, robots.txt ok`);
