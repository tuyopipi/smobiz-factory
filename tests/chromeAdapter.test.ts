import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { mock } from "node:test";
import { buildExtensionCodePrompt, ChromeAdapter } from "../src/adapters/chrome.js";
import { ExtensionBuild, ProductCandidate } from "../src/types.js";

const candidate: ProductCandidate = {
  name: "Receipt Focus Mode",
  slug: "receipt-focus-mode",
  platform: "chrome",
  niche: "receipt review",
  targetUser: "bookkeepers",
  problem: "receipt tabs distract",
  solution: "dim unrelated receipt tabs",
  keywords: ["receipt review"],
  permissions: ["tabs", "storage"],
  monetization: { model: "freemium" }
};

test("ChromeAdapter builds and packages manifest v3 extensions", async () => {
  const adapter = new ChromeAdapter();
  const build = await adapter.build(candidate);
  assert.equal(build.manifest.manifest_version, 3);
  assert.deepEqual(build.manifest.icons, { "128": "icons/icon.png" });
  assert.ok(build.files["manifest.json"]);
  assert.ok(build.files["popup.css"]);

  const dir = await mkdtemp(join(tmpdir(), "smobiz-chrome-"));
  const packaged = await adapter.package(build, dir);
  const file = await stat(packaged.zipPath);
  const bytes = await readFile(packaged.zipPath);
  assert.equal(file.size, packaged.sizeBytes);
  assert.equal(bytes.readUInt32LE(0), 0x04034b50);
  assert.equal(bytes.readUInt32LE(bytes.length - 22), 0x06054b50);
});

test("ChromeAdapter rejects broad permissions", async () => {
  const adapter = new ChromeAdapter();
  await assert.rejects(
    () => adapter.build({ ...candidate, permissions: ["<all_urls>"] }),
    /Forbidden Chrome permission/
  );
});

test("ChromeAdapter generates functional bookmark filtering code for bookmark candidates", async () => {
  const adapter = new ChromeAdapter();
  const build = await adapter.build({
    name: "QuickBookmarkFilter",
    slug: "quick-bookmark-filter",
    platform: "chrome",
    niche: "bookmark productivity",
    targetUser: "bookmark-heavy Chrome users",
    problem: "saved bookmarks are hard to scan",
    solution: "filter bookmarks quickly from a popup",
    keywords: ["bookmark filter"],
    permissions: ["bookmarks", "storage"],
    monetization: { model: "freemium" }
  });

  const js = String(build.files["popup.js"]);
  assert.match(js, /chrome\.bookmarks\.search/);
  assert.match(js, /chrome\.bookmarks\.getTree/);
  assert.match(js, /chrome\.storage\.local/);
  assert.match(js, /addEventListener/);
  assert.match(String(build.files["popup.html"]), /<input id="search"/);
});

test("ChromeAdapter generates a functional remittance advice template tool", async () => {
  const adapter = new ChromeAdapter();
  const build = await adapter.build({
    name: "Remittance Advice Generator",
    slug: "remittance-advice-generator",
    platform: "chrome",
    niche: "remittance advice template",
    targetUser: "accountants",
    problem: "accountants repeatedly draft remittance advice notes from invoice references",
    solution: "generate and save remittance advice drafts from payer, amount, invoice, and note fields",
    keywords: ["remittance advice template", "remittance advice excel"],
    permissions: ["storage"],
    monetization: { model: "freemium" }
  });

  const html = String(build.files["popup.html"]);
  const js = String(build.files["popup.js"]);
  assert.match(html, /id="payer"/);
  assert.match(html, /id="amount"/);
  assert.match(html, /id="invoice"/);
  assert.match(js, /chrome\.storage\.local\.set/);
  assert.match(js, /Remittance advice for/);
  assert.match(js, /addEventListener/);
});

test("ChromeAdapter retries and rejects builds that do not use declared permission APIs", async () => {
  const generate = mock.fn(async (): Promise<ExtensionBuild> => {
    const manifest = {
      manifest_version: 3,
      name: "Bookmark Skeleton",
      version: "0.1.0",
      permissions: ["bookmarks"],
      icons: { "128": "icons/icon.png" },
      action: { default_popup: "popup.html", default_icon: { "128": "icons/icon.png" } }
    };
    return {
      manifest,
      files: {
        "manifest.json": JSON.stringify(manifest),
        "popup.html": "<main id=\"app\"></main><script src=\"popup.js\"></script>",
        "popup.js": "document.querySelector('#app').textContent = 'Bookmark filter';",
        "icons/icon.png": Buffer.from([137, 80, 78, 71])
      },
      storeListing: { title: "Bookmark Skeleton", summary: "summary", description: "description", category: "productivity" }
    };
  });
  const adapter = new ChromeAdapter({ generate });

  await assert.rejects(() => adapter.build({ ...candidate, permissions: ["bookmarks"] }), /Functionality unimplemented/);
  assert.equal(generate.mock.callCount(), 3);
});

test("ChromeAdapter does not read Chrome publish credentials during build", async () => {
  const credentials = mock.fn(async () => {
    throw new Error("credentials should only be read during submit");
  });
  const adapter = new ChromeAdapter(undefined, credentials);

  const build = await adapter.build(candidate);

  assert.equal(build.manifest.name, candidate.name);
  assert.equal(credentials.mock.callCount(), 0);
});

test("ChromeAdapter uploadDraft uploads without publishing", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  const dir = await mkdtemp(join(tmpdir(), "smobiz-chrome-draft-"));
  const adapter = new ChromeAdapter(undefined, {
    clientId: "client",
    clientSecret: "secret",
    refreshToken: "refresh",
    publisherId: "publisher"
  });
  const build = await adapter.build(candidate);
  const packaged = await adapter.package(build, dir);
  globalThis.fetch = mock.fn(async (url: string | URL | Request) => {
    const value = String(url);
    calls.push(value);
    if (value === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "token" }), { status: 200 });
    }
    if (value.startsWith("https://www.googleapis.com/upload/chromewebstore/v1.1/items")) {
      return new Response(JSON.stringify({ id: "draft-id", uploadState: "SUCCESS" }), { status: 200 });
    }
    throw new Error(`unexpected fetch: ${value}`);
  }) as typeof fetch;

  try {
    const draft = await adapter.uploadDraft(packaged);
    assert.equal(draft.itemId, "draft-id");
    assert.equal(draft.status, "draft_uploaded");
    assert.equal(calls.some((url) => url.includes("/publish")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ChromeAdapter updateDraft uploads a new package to an existing item", async () => {
  const originalFetch = globalThis.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  const dir = await mkdtemp(join(tmpdir(), "smobiz-chrome-update-"));
  const adapter = new ChromeAdapter(undefined, {
    clientId: "client",
    clientSecret: "secret",
    refreshToken: "refresh",
    publisherId: "publisher"
  });
  const build = await adapter.build(candidate);
  const packaged = await adapter.package(build, dir);
  globalThis.fetch = mock.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const value = String(url);
    calls.push({ url: value, init });
    if (value === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "token" }), { status: 200 });
    }
    if (value === "https://www.googleapis.com/upload/chromewebstore/v1.1/items/existing-id?uploadType=media") {
      return new Response(JSON.stringify({ id: "existing-id", uploadState: "SUCCESS" }), { status: 200 });
    }
    throw new Error(`unexpected fetch: ${value}`);
  }) as typeof fetch;

  try {
    const draft = await adapter.updateDraft("existing-id", packaged);
    assert.equal(draft.itemId, "existing-id");
    assert.equal(draft.status, "draft_updated");
    assert.equal(calls.at(-1)?.init?.method, "PUT");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("buildExtensionCodePrompt forbids static skeleton output", () => {
  const prompt = buildExtensionCodePrompt(candidate);
  assert.match(prompt, /complete, working Chrome Manifest V3 extension/);
  assert.match(prompt, /Do not generate a placeholder, skeleton, static description page/);
  assert.match(prompt, /Every permission declared in manifest\.permissions must be used/);
});
