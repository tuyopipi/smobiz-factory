import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { ChromeAdapter } from "../dist/src/adapters/chrome.js";

const out = "artifacts/chrome-publication/remittance-advice-generator";
const unpacked = join(out, "extension");

const candidate = {
  name: "Remittance Advice Generator",
  slug: "remittance-advice-generator",
  platform: "chrome",
  niche: "remittance advice template",
  targetUser: "accountants, bookkeepers, and small business finance teams",
  problem: "Finance teams repeatedly draft remittance advice notes from payer names, payment amounts, invoice references, and payment notes before reconciling customer payments.",
  solution: "Generate a clean remittance advice draft from payer, amount, invoice, and notes fields, save the draft locally, and copy it for email, accounting notes, or payment reconciliation workflows.",
  keywords: ["remittance advice", "invoice reconciliation", "payment advice", "bookkeeping template"],
  permissions: ["storage"],
  monetization: { model: "freemium" }
};

const listing = `Remittance Advice Generator

Detailed description
Remittance Advice Generator is a focused Chrome extension for accountants, bookkeepers, and small business finance teams who repeatedly turn payment details into clear remittance advice notes. Instead of retyping the same structure for each received payment, open the extension popup, enter the payer or customer name, payment amount, invoice references, and optional payment notes, then generate a clean remittance advice draft that can be copied into email, accounting notes, spreadsheets, or reconciliation workflows.

The extension is intentionally narrow: it helps prepare the text of a remittance advice note from information you already have. It does not connect to bank accounts, accounting systems, payment processors, or external servers. Draft data is stored only in Chrome local storage so the latest draft is not lost when the popup closes. The Clear button removes the saved draft from local browser storage.

Typical uses include preparing payment allocation notes, documenting which invoices a payment should be matched against, drafting a short note for a customer account file, and standardizing wording during invoice reconciliation.

Category suggestion
Productivity

Language
English (United States) / en-US

Single purpose description
Generate and copy remittance advice drafts from payer, amount, invoice reference, and payment note fields, while saving the current draft locally in the browser.

Permission justification: storage
The storage permission is used only to save the current remittance advice draft locally in Chrome, including payer, amount, invoice references, notes, generated output, and update time. This prevents the draft from being lost when the popup closes. The extension does not transmit this data to any server.

Remote code declaration
No. The extension does not use remote code. All JavaScript, HTML, CSS, and image assets are packaged inside the extension zip, and no remotely hosted scripts are loaded or executed.

Data usage declaration
The extension stores draft remittance advice data locally using chrome.storage.local. Data stays on the user's device/browser profile and is used only to restore the current draft in the popup. The extension does not collect, sell, share, transfer, or send user data to external servers.
`;

await rm(unpacked, { recursive: true, force: true });
await mkdir(unpacked, { recursive: true });
await mkdir(out, { recursive: true });
await writeFile(join(out, "listing.txt"), listing);

const adapter = new ChromeAdapter();
const build = await adapter.build(candidate);
const packaged = await adapter.package(build, out);

for (const [filename, content] of Object.entries(build.files)) {
  const target = join(unpacked, filename);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

await writeFile(join(out, "icon-128.png"), build.files["icons/icon.png"]);

console.log(JSON.stringify({
  zipPath: packaged.zipPath,
  sizeBytes: packaged.sizeBytes,
  sha256: packaged.sha256,
  listing: join(out, "listing.txt"),
  unpacked,
  icon: join(out, "icon-128.png"),
  manifest: build.manifest
}, null, 2));
