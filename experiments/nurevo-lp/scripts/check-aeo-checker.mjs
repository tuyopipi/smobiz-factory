import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/check/index.html", import.meta.url), "utf8");
for (const required of [
  "https://nurevo.jp/api/aeo/score",
  "conic-gradient",
  "#1a9c6b",
  "#b7791f",
  "#d13b3b",
  "良好",
  "要改善",
  "危険",
  "準備中（近日公開）",
  "診断できませんでした。時間をおいて再試行",
  "直す → Nurevo AEO（WordPressプラグイン）",
  'href="/guide/integration"',
  "new URLSearchParams(location.search).get('url')",
]) assert.ok(html.includes(required), `checker missing: ${required}`);

assert.match(html, /fetch\(api\.href/);
assert.match(html, /history\.replaceState/);
assert.match(html, /body\.checks\.forEach/);
assert.match(html, /@media\(max-width:760px\)/);
assert.doesNotMatch(html, /<script[^>]+src=/i);
assert.doesNotMatch(html, /react|vue|angular/i);
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, "checker must have one inline script");
new Function(scripts[0][1]);

console.log("Nurevo AEO checker static tests passed");
