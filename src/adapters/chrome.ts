import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { ExtensionBuild, PackagedExtension, ProductCandidate } from "../types.js";
import { PlatformAdapter } from "./platform.js";

export interface ExtensionCodeGenerator {
  generate(candidate: ProductCandidate, context?: ExtensionGenerationContext): Promise<ExtensionBuild>;
}

export interface ExtensionGenerationContext {
  prompt: string;
  attempt: number;
  previousErrors: string[];
}

export interface ChromePublishCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  publisherId: string;
}

export type ChromePublishCredentialProvider = ChromePublishCredentials | (() => Promise<ChromePublishCredentials>);

export interface ChromeDraftUpload {
  itemId: string;
  status: string;
  uploadState?: string;
  itemError?: unknown[];
  raw: Record<string, unknown>;
}

export class TemplateExtensionCodeGenerator implements ExtensionCodeGenerator {
  async generate(candidate: ProductCandidate): Promise<ExtensionBuild> {
    const manifest = {
      manifest_version: 3,
      name: candidate.name,
      version: "0.1.0",
      description: candidate.solution.slice(0, 132),
      permissions: candidate.permissions,
      icons: {
        "128": "icons/icon.png"
      },
      action: {
        default_title: candidate.name,
        default_popup: "popup.html",
        default_icon: {
          "128": "icons/icon.png"
        }
      }
    };
    const app = functionalPopup(candidate);
    return {
      manifest,
      files: {
        "manifest.json": JSON.stringify(manifest, null, 2),
        "popup.html": app.html,
        "popup.js": app.js,
        "popup.css": app.css,
        "icons/icon.png": iconPng()
      },
      storeListing: {
        title: candidate.name,
        summary: candidate.solution.slice(0, 132),
        description: `${candidate.problem}\n\n${candidate.solution}`,
        category: "productivity"
      }
    };
  }
}

export class ChromeAdapter implements PlatformAdapter {
  readonly platform = "chrome" as const;
  private readonly forbiddenPermissions = new Set(["<all_urls>", "webRequestBlocking", "debugger", "nativeMessaging"]);
  private readonly maxBuildAttempts = 3;

  constructor(
    private readonly codeGenerator: ExtensionCodeGenerator = new TemplateExtensionCodeGenerator(),
    private readonly credentials?: ChromePublishCredentialProvider
  ) {}

  async build(candidate: ProductCandidate): Promise<ExtensionBuild> {
    this.validateCandidate(candidate);
    const errors: string[] = [];
    for (let attempt = 1; attempt <= this.maxBuildAttempts; attempt += 1) {
      const prompt = buildExtensionCodePrompt(candidate, errors);
      const build = await this.codeGenerator.generate(candidate, { prompt, attempt, previousErrors: [...errors] });
      if (!build.files["manifest.json"]) {
        build.files["manifest.json"] = JSON.stringify(build.manifest, null, 2);
      }
      try {
        this.validateManifest(build.manifest);
        this.validateFunctionalBuild(build);
        return build;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    throw new Error(`Feature implementation validation failed after ${this.maxBuildAttempts} attempts: ${errors.at(-1) ?? "unknown error"}`);
  }

  async package(build: ExtensionBuild, outputDir: string): Promise<PackagedExtension> {
    await mkdir(outputDir, { recursive: true });
    const name = String(build.manifest.name ?? "extension").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "extension";
    const zipPath = join(outputDir, `${name}.zip`);
    const zip = createZip(build.files);
    await writeFile(zipPath, zip);
    return {
      zipPath,
      sizeBytes: zip.byteLength,
      sha256: createHash("sha256").update(zip).digest("hex")
    };
  }

  async submit(packageInfo: PackagedExtension, listing: ExtensionBuild["storeListing"]): Promise<{ submissionId: string; status: string }> {
    const draft = await this.uploadDraft(packageInfo);
    return this.publishDraft(draft.itemId, listing);
  }

  async publishDraft(itemId: string, _listing?: ExtensionBuild["storeListing"]): Promise<{ submissionId: string; status: string; raw: Record<string, unknown> }> {
    const credentials = await this.resolveCredentials();
    const accessToken = await this.exchangeRefreshToken(credentials);
    const publish = await fetch(`https://www.googleapis.com/chromewebstore/v1.1/items/${itemId}/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ target: "default" })
    });
    if (!publish.ok) throw new Error(`Chrome publish failed: ${publish.status} ${await publish.text()}`);
    const body = (await publish.json()) as { status?: string[]; statusDetail?: string[] };
    if (Array.isArray(body.status) && body.status.length > 0 && !body.status.includes("OK")) {
      throw new Error(`Chrome publish rejected: ${body.status.join(",")} ${(body.statusDetail ?? []).join("; ")}`);
    }
    return { submissionId: itemId, status: "submitted", raw: body as Record<string, unknown> };
  }

  async uploadDraft(packageInfo: PackagedExtension): Promise<ChromeDraftUpload> {
    const credentials = await this.resolveCredentials();
    const accessToken = await this.exchangeRefreshToken(credentials);
    const zip = await readFile(packageInfo.zipPath);
    const upload = await fetch("https://www.googleapis.com/upload/chromewebstore/v1.1/items?uploadType=media", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-goog-publisher-id": credentials.publisherId,
        "content-type": "application/zip"
      },
      body: new Uint8Array(zip)
    });
    const uploadText = await upload.text();
    if (!upload.ok) throw new Error(`Chrome upload failed: ${upload.status} ${uploadText}`);
    const uploadBody = JSON.parse(uploadText) as { id?: string; uploadState?: string; itemError?: unknown[] };
    const itemId = uploadBody.id;
    if (!itemId) throw new Error("Chrome upload response did not include item id");
    return {
      itemId,
      status: uploadBody.uploadState === "FAILURE" ? "failed" : "draft_uploaded",
      uploadState: uploadBody.uploadState,
      itemError: uploadBody.itemError,
      raw: uploadBody as Record<string, unknown>
    };
  }

  async updateDraft(itemId: string, packageInfo: PackagedExtension): Promise<ChromeDraftUpload> {
    const credentials = await this.resolveCredentials();
    const accessToken = await this.exchangeRefreshToken(credentials);
    const zip = await readFile(packageInfo.zipPath);
    const upload = await fetch(`https://www.googleapis.com/upload/chromewebstore/v1.1/items/${itemId}?uploadType=media`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/zip"
      },
      body: new Uint8Array(zip)
    });
    const uploadText = await upload.text();
    if (!upload.ok) throw new Error(`Chrome update upload failed: ${upload.status} ${uploadText}`);
    const uploadBody = JSON.parse(uploadText) as { id?: string; uploadState?: string; itemError?: unknown[] };
    const responseItemId = uploadBody.id ?? itemId;
    return {
      itemId: responseItemId,
      status: uploadBody.uploadState === "FAILURE" ? "failed" : "draft_updated",
      uploadState: uploadBody.uploadState,
      itemError: uploadBody.itemError,
      raw: uploadBody as Record<string, unknown>
    };
  }

  private validateCandidate(candidate: ProductCandidate): void {
    if (candidate.platform !== "chrome") throw new Error(`Unsupported platform: ${candidate.platform}`);
    for (const permission of candidate.permissions) {
      if (this.forbiddenPermissions.has(permission)) {
        throw new Error(`Forbidden Chrome permission: ${permission}`);
      }
    }
  }

  private validateManifest(manifest: Record<string, unknown>): void {
    if (manifest.manifest_version !== 3) throw new Error("Chrome manifest_version must be 3");
    const permissions = Array.isArray(manifest.permissions) ? manifest.permissions.map(String) : [];
    for (const permission of permissions) {
      if (this.forbiddenPermissions.has(permission)) {
        throw new Error(`Forbidden Chrome manifest permission: ${permission}`);
      }
    }
    const icons = manifest.icons as Record<string, unknown> | undefined;
    const action = manifest.action as Record<string, unknown> | undefined;
    if (icons?.["128"] !== "icons/icon.png") throw new Error("Chrome manifest must reference icons/icon.png in icons.128");
    const defaultIcon = action?.default_icon as Record<string, unknown> | undefined;
    if (defaultIcon?.["128"] !== "icons/icon.png") throw new Error("Chrome manifest action must reference icons/icon.png");
  }

  private validateFunctionalBuild(build: ExtensionBuild): void {
    const source = Object.entries(build.files)
      .filter(([filename]) => /\.(js|html|css)$/i.test(filename))
      .map(([, content]) => String(content))
      .join("\n");
    const permissions = Array.isArray(build.manifest.permissions) ? build.manifest.permissions.map(String) : [];
    const missing = permissions.filter((permission) => {
      const pattern = permissionApiPatterns[permission];
      return pattern ? !pattern.test(source) : false;
    });
    if (missing.length > 0) {
      throw new Error(`Functionality unimplemented: declared permission APIs are unused (${missing.join(", ")})`);
    }
    if (!/addEventListener|onclick|oninput|onsubmit/.test(source)) {
      throw new Error("Functionality unimplemented: popup has no user interaction handlers");
    }
    if (/textContent\s*=\s*["'`][^"'`]*(?:filter|quick|bookmark|tabs?|extension)[^"'`]*["'`]\s*;?\s*$/i.test(source.trim())) {
      throw new Error("Functionality unimplemented: popup only renders descriptive text");
    }
  }

  private async exchangeRefreshToken(credentials: ChromePublishCredentials): Promise<string> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: "refresh_token"
      })
    });
    if (!response.ok) throw new Error(`Chrome OAuth refresh failed: ${response.status}`);
    const body = (await response.json()) as { access_token?: string };
    if (!body.access_token) throw new Error("Chrome OAuth response missing access_token");
    return body.access_token;
  }

  private async resolveCredentials(): Promise<ChromePublishCredentials> {
    if (!this.credentials) throw new Error("Chrome publish credentials are required");
    return typeof this.credentials === "function" ? this.credentials() : this.credentials;
  }
}

const permissionApiPatterns: Record<string, RegExp> = {
  bookmarks: /\bchrome\.bookmarks\./,
  storage: /\bchrome\.storage\./,
  tabs: /\bchrome\.tabs\./,
  activeTab: /\bchrome\.tabs\./,
  notifications: /\bchrome\.notifications\./,
  alarms: /\bchrome\.alarms\./,
  history: /\bchrome\.history\./,
  downloads: /\bchrome\.downloads\./,
  contextMenus: /\bchrome\.contextMenus\./
};

export function buildExtensionCodePrompt(candidate: ProductCandidate, previousErrors: string[] = []): string {
  return [
    "Generate a complete, working Chrome Manifest V3 extension for the candidate below.",
    "Do not generate a placeholder, skeleton, static description page, or popup that only explains the idea.",
    "The extension must implement the candidate's actual purpose end-to-end with a usable popup UI, event handlers, state/error handling, and the relevant chrome.* API calls.",
    "Every permission declared in manifest.permissions must be used by matching runtime code. If a permission is unnecessary, omit it from the manifest.",
    "Include manifest.json, popup.html, popup.js, popup.css, and icons/icon.png. Reference icons/icon.png from both manifest.icons and action.default_icon.",
    "Return files only; code must be self-contained and loadable as an unpacked Chrome extension.",
    `Candidate name: ${candidate.name}`,
    `Niche: ${candidate.niche}`,
    `Target user: ${candidate.targetUser}`,
    `Problem: ${candidate.problem}`,
    `Solution: ${candidate.solution}`,
    `Keywords: ${candidate.keywords.join(", ")}`,
    `Requested permissions: ${candidate.permissions.join(", ") || "none"}`,
    previousErrors.length > 0 ? `Fix these validation failures from previous attempts: ${previousErrors.join(" | ")}` : "No previous validation failures."
  ].join("\n");
}

function functionalPopup(candidate: ProductCandidate): { html: string; js: string; css: string } {
  if (isRemittanceAdviceCandidate(candidate)) return remittanceAdvicePopup(candidate);
  if (candidate.permissions.includes("bookmarks")) return bookmarkFilterPopup(candidate);
  if (candidate.permissions.includes("tabs")) return tabFilterPopup(candidate);
  return basicTaskPopup(candidate);
}

function isRemittanceAdviceCandidate(candidate: ProductCandidate): boolean {
  return [candidate.name, candidate.niche, candidate.problem, candidate.solution, ...candidate.keywords]
    .join(" ")
    .toLowerCase()
    .includes("remittance advice");
}

function remittanceAdvicePopup(candidate: ProductCandidate): { html: string; js: string; css: string } {
  return {
    html: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(candidate.name)}</title>
    <link rel="stylesheet" href="popup.css">
  </head>
  <body>
    <main>
      <header>
        <h1>${escapeHtml(candidate.name)}</h1>
        <button id="clear" type="button" title="Clear saved draft">Clear</button>
      </header>
      <label for="payer">Payer or customer</label>
      <input id="payer" autocomplete="organization" placeholder="Acme Ltd">
      <label for="amount">Payment amount</label>
      <input id="amount" inputmode="decimal" placeholder="1250.00">
      <label for="invoice">Invoice references</label>
      <textarea id="invoice" rows="3" placeholder="INV-1042, INV-1043"></textarea>
      <label for="notes">Payment notes</label>
      <textarea id="notes" rows="3" placeholder="Bank transfer received, partial payment, deductions, etc."></textarea>
      <div class="actions">
        <button id="generate" type="button">Generate</button>
        <button id="copy" type="button">Copy</button>
      </div>
      <p id="status" role="status"></p>
      <textarea id="output" rows="9" readonly></textarea>
    </main>
    <script type="module" src="popup.js"></script>
  </body>
</html>
`,
    css: popupCss(),
    js: `"use strict";

const fields = {
  payer: document.querySelector("#payer"),
  amount: document.querySelector("#amount"),
  invoice: document.querySelector("#invoice"),
  notes: document.querySelector("#notes")
};
const output = document.querySelector("#output");
const statusEl = document.querySelector("#status");
const generateButton = document.querySelector("#generate");
const copyButton = document.querySelector("#copy");
const clearButton = document.querySelector("#clear");

async function restoreDraft() {
  const saved = await chrome.storage.local.get({ remittanceDraft: {} });
  for (const [key, element] of Object.entries(fields)) {
    element.value = saved.remittanceDraft[key] || "";
  }
  output.value = saved.remittanceDraft.output || "";
}

async function saveDraft() {
  await chrome.storage.local.set({
    remittanceDraft: {
      payer: fields.payer.value,
      amount: fields.amount.value,
      invoice: fields.invoice.value,
      notes: fields.notes.value,
      output: output.value,
      updatedAt: new Date().toISOString()
    }
  });
}

function generateAdvice() {
  const payer = fields.payer.value.trim() || "the payer";
  const amount = fields.amount.value.trim() || "[amount]";
  const invoices = fields.invoice.value.trim() || "[invoice references]";
  const notes = fields.notes.value.trim();
  output.value = [
    \`Remittance advice for \${payer}\`,
    \`Payment amount: \${amount}\`,
    \`Applied to invoice(s): \${invoices}\`,
    notes ? \`Notes: \${notes}\` : "",
    "Please match this payment against the listed invoice references and flag any remaining balance or deduction."
  ].filter(Boolean).join("\\n");
  statusEl.textContent = "Draft generated and saved.";
}

for (const element of Object.values(fields)) {
  element.addEventListener("input", () => {
    void saveDraft();
  });
}

generateButton.addEventListener("click", async () => {
  generateAdvice();
  await saveDraft();
});

copyButton.addEventListener("click", async () => {
  if (!output.value) generateAdvice();
  await navigator.clipboard.writeText(output.value);
  statusEl.textContent = "Copied remittance advice.";
});

clearButton.addEventListener("click", async () => {
  for (const element of Object.values(fields)) element.value = "";
  output.value = "";
  await chrome.storage.local.remove("remittanceDraft");
  statusEl.textContent = "Draft cleared.";
});

await restoreDraft();
`
  };
}

function bookmarkFilterPopup(candidate: ProductCandidate): { html: string; js: string; css: string } {
  return {
    html: popupHtml(candidate),
    css: popupCss(),
    js: `"use strict";

const searchInput = document.querySelector("#search");
const statusEl = document.querySelector("#status");
const listEl = document.querySelector("#results");
const clearButton = document.querySelector("#clear");
const emptyEl = document.querySelector("#empty");

async function readLastQuery() {
  const stored = await chrome.storage.local.get({ lastQuery: "" });
  return String(stored.lastQuery || "");
}

async function saveLastQuery(value) {
  await chrome.storage.local.set({ lastQuery: value });
}

function flattenBookmarks(nodes, output = []) {
  for (const node of nodes) {
    if (node.url) output.push(node);
    if (node.children) flattenBookmarks(node.children, output);
  }
  return output;
}

async function loadBookmarks(query) {
  const trimmed = query.trim();
  if (trimmed) {
    const matches = await chrome.bookmarks.search(trimmed);
    return matches.filter((bookmark) => bookmark.url);
  }
  const tree = await chrome.bookmarks.getTree();
  return flattenBookmarks(tree).slice(0, 100);
}

function render(bookmarks, query) {
  listEl.replaceChildren();
  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? bookmarks.filter((bookmark) => \`\${bookmark.title || ""} \${bookmark.url || ""}\`.toLowerCase().includes(normalized))
    : bookmarks;
  statusEl.textContent = normalized ? \`\${filtered.length} matching bookmarks\` : \`\${filtered.length} recent bookmarks\`;
  emptyEl.hidden = filtered.length !== 0;
  for (const bookmark of filtered.slice(0, 50)) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = bookmark.url;
    link.textContent = bookmark.title || bookmark.url;
    link.title = bookmark.url;
    link.addEventListener("click", () => window.close());
    const url = document.createElement("span");
    url.textContent = bookmark.url || "";
    item.append(link, url);
    listEl.append(item);
  }
}

let pending;
async function refresh() {
  const query = searchInput.value;
  await saveLastQuery(query);
  statusEl.textContent = "Searching bookmarks...";
  try {
    const bookmarks = await loadBookmarks(query);
    render(bookmarks, query);
  } catch (error) {
    statusEl.textContent = "Could not read bookmarks";
    emptyEl.hidden = false;
    emptyEl.textContent = error instanceof Error ? error.message : String(error);
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(pending);
  pending = setTimeout(refresh, 120);
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  void refresh();
});

searchInput.value = await readLastQuery();
searchInput.focus();
await refresh();
`
  };
}

function tabFilterPopup(candidate: ProductCandidate): { html: string; js: string; css: string } {
  return {
    html: popupHtml(candidate),
    css: popupCss(),
    js: `"use strict";

const searchInput = document.querySelector("#search");
const statusEl = document.querySelector("#status");
const listEl = document.querySelector("#results");
const clearButton = document.querySelector("#clear");
const emptyEl = document.querySelector("#empty");

async function persistQuery(value) {
  if (chrome.storage) await chrome.storage.local.set({ lastQuery: value });
}

async function restoreQuery() {
  if (!chrome.storage) return "";
  const stored = await chrome.storage.local.get({ lastQuery: "" });
  return String(stored.lastQuery || "");
}

async function refresh() {
  const query = searchInput.value.trim().toLowerCase();
  await persistQuery(searchInput.value);
  const tabs = await chrome.tabs.query({});
  const filtered = tabs.filter((tab) => \`\${tab.title || ""} \${tab.url || ""}\`.toLowerCase().includes(query));
  listEl.replaceChildren();
  statusEl.textContent = query ? \`\${filtered.length} matching tabs\` : \`\${filtered.length} open tabs\`;
  emptyEl.hidden = filtered.length !== 0;
  for (const tab of filtered.slice(0, 50)) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.textContent = tab.title || tab.url || "Untitled tab";
    button.addEventListener("click", async () => {
      await chrome.tabs.update(tab.id, { active: true });
      if (tab.windowId) await chrome.windows.update(tab.windowId, { focused: true });
      window.close();
    });
    item.append(button);
    listEl.append(item);
  }
}

let pending;
searchInput.addEventListener("input", () => {
  clearTimeout(pending);
  pending = setTimeout(refresh, 120);
});
clearButton.addEventListener("click", () => {
  searchInput.value = "";
  void refresh();
});

searchInput.value = await restoreQuery();
await refresh();
`
  };
}

function basicTaskPopup(candidate: ProductCandidate): { html: string; js: string; css: string } {
  return {
    html: popupHtml(candidate),
    css: popupCss(),
    js: `"use strict";

const searchInput = document.querySelector("#search");
const statusEl = document.querySelector("#status");
const listEl = document.querySelector("#results");
const clearButton = document.querySelector("#clear");
const emptyEl = document.querySelector("#empty");
const entries = ${JSON.stringify(candidate.keywords.length > 0 ? candidate.keywords : [candidate.niche, candidate.solution])};

function refresh() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = entries.filter((entry) => entry.toLowerCase().includes(query));
  listEl.replaceChildren();
  statusEl.textContent = \`\${filtered.length} matching items\`;
  emptyEl.hidden = filtered.length !== 0;
  for (const entry of filtered) {
    const item = document.createElement("li");
    item.textContent = entry;
    listEl.append(item);
  }
}

searchInput.addEventListener("input", refresh);
clearButton.addEventListener("click", () => {
  searchInput.value = "";
  refresh();
});
refresh();
`
  };
}

function popupHtml(candidate: ProductCandidate): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(candidate.name)}</title>
    <link rel="stylesheet" href="popup.css">
  </head>
  <body>
    <main>
      <header>
        <h1>${escapeHtml(candidate.name)}</h1>
        <button id="clear" type="button" title="Clear search">Clear</button>
      </header>
      <label for="search">Filter</label>
      <input id="search" type="search" autocomplete="off" placeholder="${escapeHtml(searchPlaceholder(candidate))}">
      <p id="status" role="status"></p>
      <p id="empty" hidden>No matches found.</p>
      <ul id="results"></ul>
    </main>
    <script type="module" src="popup.js"></script>
  </body>
</html>
`;
}

function popupCss(): string {
  return `:root {
  color-scheme: light;
  font-family: Arial, sans-serif;
}

body {
  width: 360px;
  margin: 0;
  background: #f7f8fb;
  color: #18202a;
}

main {
  padding: 14px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

h1 {
  margin: 0;
  font-size: 16px;
}

label {
  display: block;
  margin-top: 12px;
  font-size: 12px;
  font-weight: 700;
}

input,
textarea {
  box-sizing: border-box;
  width: 100%;
  margin-top: 6px;
  padding: 9px 10px;
  border: 1px solid #b8c2cc;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

textarea {
  resize: vertical;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

button {
  border: 1px solid #9aa6b2;
  border-radius: 6px;
  background: #ffffff;
  color: #18202a;
  cursor: pointer;
  font-size: 12px;
  padding: 6px 9px;
}

#status,
#empty {
  margin: 10px 0;
  color: #52606d;
  font-size: 12px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 360px;
  overflow: auto;
}

li {
  border-top: 1px solid #d8dee6;
  padding: 9px 0;
}

a,
li > button {
  display: block;
  overflow-wrap: anywhere;
  color: #0b5cad;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  text-decoration: none;
}

span {
  display: block;
  margin-top: 3px;
  overflow-wrap: anywhere;
  color: #667381;
  font-size: 11px;
}
`;
}

function searchPlaceholder(candidate: ProductCandidate): string {
  return candidate.permissions.includes("bookmarks") ? "Search saved bookmarks" : "Search";
}

function iconPng(): Buffer {
  const size = 128;
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const inReceipt = x >= 30 && x <= 98 && y >= 18 && y <= 110;
      const line = inReceipt && x >= 42 && x <= 86 && (Math.abs(y - 44) <= 2 || Math.abs(y - 61) <= 2 || Math.abs(y - 78) <= 2);
      const total = inReceipt && x >= 54 && x <= 88 && y >= 92 && y <= 98;
      const fold = x >= 82 && x <= 98 && y >= 18 && y <= 34 && x + y >= 116;
      const [r, g, b] = total || line ? [31, 122, 92] : fold ? [219, 244, 235] : inReceipt ? [255, 255, 255] : [31, 122, 92];
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = 255;
    }
  }
  return pngBuffer(size, size, pixels);
}

function pngBuffer(width: number, height: number, rgba: Buffer): Buffer {
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    scanlines[rowStart] = 0;
    rgba.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const name = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return chunk;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

function createZip(files: Record<string, string | Buffer>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const [filename, content] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const name = Buffer.from(filename);
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    localParts.push(local, data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(centralParts.length, 8);
  end.writeUInt16LE(centralParts.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
