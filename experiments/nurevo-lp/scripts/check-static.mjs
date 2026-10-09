import { readFile } from "node:fs/promises";

const requiredFiles = [
  "public/index.html",
  "public/privacy.html",
  "public/terms.html",
  "public/tokushoho.html",
  "public/config.js",
  "public/assets/styles.css",
  "public/assets/app.js"
];

for (const file of requiredFiles) {
  const text = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  if (!text.trim()) throw new Error(`${file} is empty`);
}

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
for (const needle of [
  "あなたのお店は、",            // hero promise
  "AIにちゃんと読まれているか",   // the free diagnosis offer
  "Yoast/Rank Mathと併用OK",    // coexistence, the main objection handled
  "正直",                       // the honest-measurement position
  "heroCheck",                  // the URL diagnosis form
  "data-webmcp-site-key"        // the tag snippet visitors copy
]) {
  if (!index.includes(needle)) throw new Error(`index.html missing: ${needle}`);
}

const partner = await readFile(new URL("../public/partner/index.html", import.meta.url), "utf8");
if (/name=["']invite["']/u.test(partner)) throw new Error("partner registration must not require an invite code");
if (/Invitation only|招待制/u.test(partner)) throw new Error("partner registration must not be described as invitation-only");

// Both registration pages hand the submit to one shared script; a page that
// grows its own handler again brings back the double submit and the raw codes.
const registerForm = await readFile(new URL("../public/register-form.js", import.meta.url), "utf8");
if (!registerForm.includes("NurevoRegister")) throw new Error("register-form.js is missing its entry point");
const memberRegister = await readFile(new URL("../public/member-register.html", import.meta.url), "utf8");
for (const [name, page] of [["partner", partner], ["member-register", memberRegister]]) {
  if (!page.includes('<script src="/register-form.js"></script>')) throw new Error(`${name} must load register-form.js`);
  if (/fetch\(['"]\/api\/members\/register/u.test(page)) throw new Error(`${name} must not post the registration itself`);
}
if (/name=["']invite["']\s+required/u.test(memberRegister)) throw new Error("member registration must not require an invite code");

console.log("nurevo-lp static check: ok");
