import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const testDir = "dist/tests";
const testFiles = [];

async function collectTests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectTests(path);
    } else if (/\.test\.js$/.test(entry.name)) {
      testFiles.push(path);
    }
  }
}

await collectTests(testDir);
testFiles.sort();

if (testFiles.length === 0) {
  throw new Error(`No test files found under ${testDir}`);
}

const child = spawn(process.execPath, ["--test", ...testFiles], { stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
