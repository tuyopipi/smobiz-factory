#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const target = process.argv[2];
if (!target) {
  console.error("Usage: npm run standards:rollback -- <git-ref>");
  console.error("Example: npm run standards:rollback -- HEAD~1");
  process.exit(1);
}

const files = [
  "public/tag.js",
  "worker/index.mjs",
  "wrangler.jsonc"
];

for (const file of files) {
  execFileSync("git", ["checkout", target, "--", file], { stdio: "inherit" });
}

execFileSync("npm", ["run", "test:smoke"], { stdio: "inherit" });
execFileSync("npm", ["run", "test:webmcp-headless"], { stdio: "inherit" });

if (process.env.CLOUDFLARE_API_TOKEN) {
  execFileSync("npm", ["run", "cf:deploy"], { stdio: "inherit" });
  console.log(`Rolled back and deployed files from ${target}.`);
} else {
  console.log(`Rolled back files from ${target}. Set CLOUDFLARE_API_TOKEN and run npm run cf:deploy to publish.`);
}
