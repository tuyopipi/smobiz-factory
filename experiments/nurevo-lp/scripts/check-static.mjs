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
// There is no wholesale / reseller channel and no OEM offer: agencies, web
// studios and individuals all join as referral partners and earn a referral
// commission. No page we publish may offer one: every text file under public/
// (all languages' pages, guides, scripts, llms.txt, sitemaps) and the guide
// sources under src/. 卸 is allowed only inside 棚卸し ("inventory").
const WHOLESALE = /(?<!棚)卸|\bwhole-?sale|\bre-?sell(?:er|ers|ing)?\b|\bOEM\b|批发|批發|도매|mayorista|Großhandel/iu;
for (const [name, page] of [["partner", partner], ["index.html", index]]) {
  if (WHOLESALE.test(page)) throw new Error(`${name} must not offer wholesale, reselling or OEM`);
}
{
  const { readdir } = await import("node:fs/promises");
  const TEXT = /\.(?:html|js|mjs|json|txt|xml|md|astro|css)$/u;
  async function scan(dir) {
    let entries;
    try { entries = await readdir(new URL(`../${dir}/`, import.meta.url), { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) await scan(rel);
      else if (TEXT.test(entry.name)) {
        const match = (await readFile(new URL(`../${rel}`, import.meta.url), "utf8")).match(WHOLESALE);
        if (match) throw new Error(`${rel} must not offer wholesale, reselling or OEM (found "${match[0]}")`);
      }
    }
  }
  await scan("public");
  await scan("src");
}
if (!/40%/u.test(partner) || !/Stripe/u.test(partner)) throw new Error("partner page must state the 40% commission net of Stripe fees");

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
// Agencies apply as referral partners (role=referrer); there is no agency role.
if (/value=["']agency["']/u.test(memberRegister)) throw new Error("member registration must not offer an agency role; agencies apply as referral partners");
if (!/value=["']referrer["']/u.test(memberRegister)) throw new Error("member registration must offer the referral partner role");

console.log("nurevo-lp static check: ok");
