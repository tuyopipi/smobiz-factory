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
for (const needle of ["そのフォーム、入力途中で何人が諦めていますか", "site-key-form", "privacy.html", "terms.html"]) {
  if (!index.includes(needle)) throw new Error(`index.html missing: ${needle}`);
}

console.log("nurevo-lp static check: ok");
