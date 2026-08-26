import { ExtensionBuild, ProductCandidate } from "../types.js";

export interface AutoApprovalReview {
  passed: boolean;
  reasons: string[];
}

const forbiddenPermissions = new Set(["<all_urls>", "webRequestBlocking", "debugger", "nativeMessaging"]);

const permissionApiPatterns: Record<string, RegExp> = {
  bookmarks: /\bchrome\.bookmarks\./,
  storage: /\bchrome\.storage\./,
  tabs: /\bchrome\.tabs\./,
  activeTab: /\bchrome\.tabs\./,
  scripting: /\bchrome\.scripting\./,
  notifications: /\bchrome\.notifications\./,
  alarms: /\bchrome\.alarms\./,
  history: /\bchrome\.history\./,
  downloads: /\bchrome\.downloads\./,
  contextMenus: /\bchrome\.contextMenus\./
};

const protectedMarks = [
  "google",
  "chrome",
  "notion",
  "slack",
  "salesforce",
  "quickbooks",
  "greenhouse",
  "workday",
  "linkedin",
  "microsoft",
  "zoom",
  "stripe",
  "shopify"
];

export function reviewShipCandidate(candidate: ProductCandidate, build: ExtensionBuild): AutoApprovalReview {
  const reasons = [
    ...manifestReasons(build),
    ...permissionReasons(build),
    ...implementationReasons(build),
    ...trademarkReasons(candidate, build)
  ];
  return { passed: reasons.length === 0, reasons };
}

function manifestReasons(build: ExtensionBuild): string[] {
  const manifest = build.manifest;
  const reasons: string[] = [];
  if (manifest.manifest_version !== 3) reasons.push("manifest-version-not-v3");
  if (!manifest.name || typeof manifest.name !== "string") reasons.push("manifest-name-missing");
  const action = manifest.action as Record<string, unknown> | undefined;
  if (action?.default_popup !== "popup.html") reasons.push("manifest-popup-missing");
  const icons = manifest.icons as Record<string, unknown> | undefined;
  if (icons?.["128"] !== "icons/icon.png") reasons.push("manifest-icon-missing");
  const defaultIcon = action?.default_icon as Record<string, unknown> | undefined;
  if (defaultIcon?.["128"] !== "icons/icon.png") reasons.push("manifest-action-icon-missing");
  if (!build.files["manifest.json"]) reasons.push("manifest-file-missing");
  if (!build.files["popup.html"] || !build.files["popup.js"]) reasons.push("popup-files-missing");
  return reasons;
}

function permissionReasons(build: ExtensionBuild): string[] {
  const permissions = Array.isArray(build.manifest.permissions) ? build.manifest.permissions.map(String) : [];
  return permissions
    .filter((permission) => forbiddenPermissions.has(permission))
    .map((permission) => `forbidden-permission:${permission}`);
}

function implementationReasons(build: ExtensionBuild): string[] {
  const source = sourceText(build);
  const permissions = Array.isArray(build.manifest.permissions) ? build.manifest.permissions.map(String) : [];
  const reasons: string[] = [];
  for (const permission of permissions) {
    const pattern = permissionApiPatterns[permission];
    if (pattern && !pattern.test(source)) reasons.push(`unused-permission-api:${permission}`);
  }
  if (!/addEventListener|onclick|oninput|onsubmit/.test(source)) reasons.push("no-user-interaction-handler");
  if (/textContent\s*=\s*["'`][^"'`]*(?:filter|quick|bookmark|tabs?|extension)[^"'`]*["'`]\s*;?\s*$/i.test(source.trim())) {
    reasons.push("static-description-only");
  }
  return reasons;
}

function trademarkReasons(candidate: ProductCandidate, build: ExtensionBuild): string[] {
  const name = candidate.name.toLowerCase();
  const icon = String(build.files["icons/icon.svg"] ?? build.files["icons/icon.png"] ?? "").toLowerCase();
  const reasons: string[] = [];
  for (const mark of protectedMarks) {
    if (hasWord(name, mark)) reasons.push(`protected-mark-in-name:${mark}`);
    if (hasWord(icon, mark)) reasons.push(`protected-mark-in-logo:${mark}`);
  }
  return reasons;
}

function sourceText(build: ExtensionBuild): string {
  return Object.entries(build.files)
    .filter(([filename]) => /\.(js|html|css)$/i.test(filename))
    .map(([, content]) => String(content))
    .join("\n");
}

function hasWord(value: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`).test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
