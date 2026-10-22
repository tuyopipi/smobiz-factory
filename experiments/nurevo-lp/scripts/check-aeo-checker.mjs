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
const externalScripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
assert.deepEqual(externalScripts, ['/assets/ai-referral.js'], 'only the existing referral measurement script is allowed');
assert.doesNotMatch(html, /react|vue|angular/i);
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, "checker must have one inline script");
new Function(scripts[0][1]);

// The next step is an account, for every site, and the steps follow the site:
// a plugin for WordPress, the paste-in copy for everything else.
assert.ok(html.includes('id="signup-cta" href="/signup.html?lang=ja"'), "a primary sign-up button");
assert.match(html, /signup-cta'\)\.href = '\/signup\.html\?lang=' \+ encodeURIComponent\(LANG\)/, "carrying the page language");
assert.ok(html.includes('data-platform="wp"') && html.includes('data-platform="other"'), "a WordPress / not-WordPress toggle");
assert.ok(html.includes('role="radiogroup"'), "announced as a choice");
assert.match(html, /stepsOther:\[/, "with steps for sites that are not WordPress");
assert.match(html, /\[\[ダッシュボード\]\]/, "and the pairing step links to the dashboard");
assert.match(html, /var DASHBOARD = '\/dashboard\?lang='/);
// A green result is not told to fix red and amber items.
assert.match(html, /ctaHeadings:\{red:'赤や黄色の項目を直しましょう',yellow:'[^']+',green:'この状態を保ちましょう'\}/);
assert.match(html, /function ctaFor\(body\)/);
for (const lang of ["ja", "en", "zh", "'zh-tw'", "ko", "es", "fr", "de"]) {
  assert.ok(html.includes(`        ${lang}: {`), `the page speaks ${lang}`);
}

console.log("Nurevo AEO checker static tests passed");
