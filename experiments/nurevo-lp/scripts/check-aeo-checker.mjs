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
  "診断できませんでした。時間をおいて再試行",
  // The install route, which is the whole point of showing someone a bad score.
  "https://wordpress.org/plugins/nurevo-webmcp/",
  "ペアリングコード",
  'href="/guide/integration"',
  "new URLSearchParams(location.search).get('url')",
]) assert.ok(html.includes(required), `checker missing: ${required}`);

// The AI sample block is gone and must stay gone. Measurement is a Pro feature
// and is not live, so a free diagnosis showing a box headed "what ChatGPT
// answered" implies a result about this site that nothing measured.
for (const forbidden of [
  "ChatGPTに質問した結果",
  "What ChatGPT answered",
  "AIサンプル",
  "sample-placeholder",
  "準備中（近日公開）",
]) assert.ok(!html.includes(forbidden), `checker must not show an AI sample: ${forbidden}`);

// And no bundled plugin copy: it went stale the moment the plugin reached the
// directory, and the download attribute made the link save a file rather than
// go anywhere.
assert.ok(!html.includes("nurevo-webmcp.zip"), "the checker must not hand out a bundled plugin");
assert.doesNotMatch(html, /<a[^>]+\sdownload[\s>]/i, "and must not carry a download attribute");

// Sharing belongs at the foot of the page, after the advice on what to fix -
// a result is worth sharing once it has been read.
assert.ok(html.indexOf('class="panel share"') > html.indexOf('class="cta"'), "share comes after the fix advice");

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
