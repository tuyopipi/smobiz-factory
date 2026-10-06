#!/usr/bin/env node
/**
 * Build the wordpress.org distribution zip.
 *
 * The published plugin is identified by the directory it lives in, so the zip
 * must unpack to `nurevo-webmcp/` with `nurevo-webmcp.php` directly inside it:
 * that pair is the plugin basename WordPress stores in `active_plugins`, and a
 * release that changes it silently deactivates the plugin on update.
 *
 * What ships is an allowlist, not an exclusion list. A denylist quietly ships
 * whatever nobody thought to exclude; an allowlist fails closed.
 *
 * The wordpress.org banner/icon PNGs are deliberately NOT here. Those belong in
 * the SVN `assets/` directory alongside `trunk/`, not inside the plugin - see
 * wordpress-plugin/wporg-assets/README.md. Shipping them in trunk only bloats
 * every user's download.
 *
 * Usage: npm run plugin:build
 */
import { createWriteStream } from "node:fs";
import { cp, mkdir, rm, readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "wordpress-plugin/webmcp-canary");
const DIST = path.join(ROOT, "dist");
/** The directory name wordpress.org serves the plugin under. */
const SLUG = "nurevo-webmcp";
const MAIN_FILE = `${SLUG}.php`;

/** Everything that ships, relative to the plugin directory. */
const INCLUDE = [
  MAIN_FILE,
  "uninstall.php",
  "readme.txt",
  "LICENSE",
  "assets/icon.svg",  // used by the admin screens at runtime
  "assets/logo.svg",
  "languages/nurevo-webmcp.pot",
  // Japanese only. The source strings are English, so an en_US catalogue could
  // only repeat them back.
  "languages/nurevo-webmcp-ja.po",
  "languages/nurevo-webmcp-ja.mo",
];

/**
 * Read the three places a version is written and insist they agree. They drift
 * easily, and wordpress.org serves whichever one it reads first - a mismatch
 * ships a version users cannot update to.
 */
async function resolveVersion() {
  const main = await readFile(path.join(SOURCE_DIR, MAIN_FILE), "utf8");
  const readme = await readFile(path.join(SOURCE_DIR, "readme.txt"), "utf8");

  const header = main.match(/^\s*\*\s*Version:\s*(\S+)\s*$/m)?.[1];
  const constant = main.match(/define\(\s*'WEBMCP_CANARY_VERSION'\s*,\s*'([^']+)'/)?.[1];
  const stable = readme.match(/^Stable tag:\s*(\S+)\s*$/m)?.[1];

  const found = { "plugin header Version": header, WEBMCP_CANARY_VERSION: constant, "readme Stable tag": stable };
  const missing = Object.entries(found).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`version not found in: ${missing.join(", ")}`);

  const unique = [...new Set(Object.values(found))];
  if (unique.length !== 1) {
    throw new Error(`version mismatch - ${Object.entries(found).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  }
  return unique[0];
}

/** Guard the one rename that silently deactivates the plugin for every user. */
async function assertMainFilePresent() {
  try {
    await stat(path.join(SOURCE_DIR, MAIN_FILE));
  } catch {
    throw new Error(`${MAIN_FILE} is missing. The published plugin basename is `
      + `${SLUG}/${MAIN_FILE}; renaming it deactivates the plugin on update.`);
  }
}

async function main() {
  await assertMainFilePresent();
  const version = await resolveVersion();

  const stage = path.join(DIST, SLUG);
  await rm(stage, { recursive: true, force: true });
  await mkdir(stage, { recursive: true });

  for (const entry of INCLUDE) {
    const from = path.join(SOURCE_DIR, entry);
    const to = path.join(stage, entry);
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to);
  }

  const zipPath = path.join(DIST, `${SLUG}-${version}.zip`);
  await rm(zipPath, { force: true });
  // Zip from dist/ so the archive contains the `nurevo-webmcp/` folder itself.
  // -X drops extended attributes; macOS otherwise adds __MACOSX entries.
  await run("zip", ["-r", "-X", "-q", zipPath, SLUG], { cwd: DIST });

  const { stdout } = await run("unzip", ["-l", zipPath]);
  const size = (await stat(zipPath)).size;
  console.log(stdout.trim());
  console.log(`\nbuilt ${path.relative(ROOT, zipPath)} (${size} bytes) - version ${version}`);
  console.log(`staged tree: ${path.relative(ROOT, stage)}`);
}

main().catch((error) => {
  console.error(`build-plugin-zip: ${error.message}`);
  process.exit(1);
});
