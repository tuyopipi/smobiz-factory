/**
 * The dashboard's word dictionary, read from the real dashboard.html.
 *
 * The inline script builds `I` (one object per language) from its I, I2, I3
 * and I4 blocks. Tests that load a dashboard module on its own use `tFor` to
 * give that module the same t() it gets on the page.
 */
import { readFileSync } from "node:fs";

export const LANGS = ["ja", "en", "zh", "tw", "ko", "es", "fr", "de"];

export function loadDictionary() {
  const html = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
  const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((b) => b.includes("function render"));
  const merge = source.indexOf("I.ja=Object.assign");
  if (merge < 0) throw new Error("dashboard.html: dictionary merge line not found");
  const head = source.slice(0, source.indexOf("\n", merge));
  return new Function(`${head}\n;return { I, I2, I3, I4, I5, LANGS };`)();
}

/** t() for one language, as the dashboard defines it. */
export function tFor(lang = "ja") {
  const { I } = loadDictionary();
  return (k) => (I[lang] || I.ja)[k] || I.ja[k] || k;
}
