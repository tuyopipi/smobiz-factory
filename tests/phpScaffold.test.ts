import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const phpApp = join(root, "php-app");

test("PHP scaffold files are syntactically valid", async () => {
  const files = await phpFiles(phpApp);
  files.push(join(root, "scripts", "ftp-upload.php"));
  files.push(join(root, "scripts", "check-lolipop.php"));
  files.push(join(root, "scripts", "register-first-tool.php"));
  files.push(join(root, "scripts", "automation-db.php"));
  assert.ok(files.length >= 10);
  for (const file of files) {
    const output = execFileSync("php", ["-l", file], { encoding: "utf8" });
    assert.match(output, /No syntax errors detected/);
  }
});

test("config sample contains required credential sections and no real nurevo.jp target", () => {
  const config = readFileSync(join(phpApp, "config.sample.php"), "utf8");
  for (const section of ["'postgres'", "'supabase'", "'stripe'", "'ftp'", "'app'"]) {
    assert.match(config, new RegExp(escapeRegExp(section)));
  }
  assert.doesNotMatch(config, /'mysql'/);
  assert.match(config, /service_role_key/);
  assert.match(config, /anon_key/);
  assert.match(config, /mmk\.tokyo/);
  assert.match(config, /public_base_url/);
  assert.match(config, /ftp_base_dir/);
  assert.match(config, /\/nurevo_online\//);
  assert.doesNotMatch(config, /nurevo\.jp/);
});

test("schema defines tools users and subscriptions tables", () => {
  const schema = readFileSync(join(phpApp, "db", "schema.sql"), "utf8");
  const migration = readFileSync(join(phpApp, "db", "migrations", "001_tool_price_fields.sql"), "utf8");
  assert.match(schema, /CREATE TABLE IF NOT EXISTS tools/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS "users"/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS subscriptions/);
  assert.match(schema, /BIGSERIAL/);
  assert.match(schema, /TIMESTAMPTZ/);
  assert.doesNotMatch(schema, /AUTO_INCREMENT|ENGINE=|ON UPDATE|UNSIGNED|ENUM\(/);
  assert.match(schema, /target_keyword/);
  assert.match(schema, /stripe_price_id/);
  assert.match(schema, /price_id VARCHAR\(190\)/);
  assert.match(schema, /stripe_product_id/);
  assert.match(schema, /price_interval/);
  assert.match(schema, /price_amount_cents/);
  assert.match(schema, /magic_token_hash/);
  assert.match(schema, /stripe_subscription_id/);
  assert.match(migration, /ALTER TABLE tools/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS price_id/);
});

test("logo generator emits dark category SVG with white initial", () => {
  const code = [
    `require ${JSON.stringify(join(phpApp, "inc", "logo.php"))};`,
    `echo generate_logo_svg("CSV Cleaner", "data");`
  ].join(" ");
  const svg = execFileSync("php", ["-r", code], { encoding: "utf8" });
  assert.match(svg, /^<svg /);
  assert.match(svg, /fill="#145A32"/);
  assert.match(svg, /fill="#fff"/);
  assert.match(svg, />C<\/text>/);
});

test("billing and auth endpoints use shared foundations", () => {
  const checkout = readFileSync(join(phpApp, "api", "checkout.php"), "utf8");
  const webhook = readFileSync(join(phpApp, "api", "webhook.php"), "utf8");
  const billing = readFileSync(join(phpApp, "inc", "billing.php"), "utf8");
  const auth = readFileSync(join(phpApp, "inc", "auth.php"), "utf8");
  const db = readFileSync(join(phpApp, "inc", "db.php"), "utf8");
  assert.match(db, /pgsql:host/);
  assert.match(db, /sslmode/);
  assert.match(db, /ON CONFLICT \(email\)/);
  assert.match(checkout, /billing_create_checkout_session/);
  assert.doesNotMatch(checkout, /\$_POST\['price_id'\]/);
  assert.match(webhook, /stripe_verify_webhook/);
  assert.match(billing, /billing_price_for_tool/);
  assert.match(billing, /billing_create_tool_price/);
  assert.match(billing, /SELECT \* FROM tools WHERE slug/);
  assert.match(billing, /price_id/);
  assert.match(billing, /public_url\('\?checkout=success'\)/);
  assert.match(billing, /\/v1\/prices/);
  assert.match(billing, /ON CONFLICT \(stripe_checkout_session_id\)/);
  assert.match(auth, /password_hash/);
  assert.match(auth, /password_verify/);
  assert.match(auth, /auth_request_supabase_magic_link/);
  assert.match(auth, /\/auth\/v1\/otp/);
});

test("template and index support bilingual UI and tool one-page layout", () => {
  const template = readFileSync(join(phpApp, "inc", "template.php"), "utf8");
  const index = readFileSync(join(phpApp, "index.php"), "utf8");
  const en = readFileSync(join(phpApp, "lang", "en.php"), "utf8");
  const ja = readFileSync(join(phpApp, "lang", "ja.php"), "utf8");
  assert.match(template, /require_once __DIR__ \. '\/i18n\.php'/);
  assert.match(template, /function render_tool_page/);
  assert.match(template, /function render_ad_slot/);
  assert.match(template, /adsense_publisher_id/);
  assert.match(template, /rel="canonical"/);
  assert.match(template, /public_url\('assets\/style\.css'\)/);
  assert.doesNotMatch(template, /api\/checkout\.php/);
  assert.match(template, /function render_trust_badges/);
  assert.match(template, /trust\.private_browser/);
  assert.match(template, /trust\.free_no_paywall/);
  assert.match(template, /tool\.code/);
  assert.match(index, /t\('search\.label'\)/);
  assert.match(index, /render_trust_badges/);
  assert.match(index, /no upload/);
  assert.match(index, /name, description, category, target_keyword/);
  assert.match(en, /Simple web tools/);
  assert.match(en, /Your data never leaves your browser/);
  assert.match(ja, /ツールを検索/);
  assert.match(ja, /データはブラウザ内で処理/);
});

test("ftp upload script reads config and supports dry run", () => {
  const script = readFileSync(join(root, "scripts", "ftp-upload.php"), "utf8");
  assert.match(script, /config\.php/);
  assert.match(script, /--dry-run/);
  assert.match(script, /--include-config/);
  assert.match(script, /ftp_base_dir/);
  assert.match(script, /ftp_ssl_connect|ftp_connect/);
  assert.doesNotMatch(script, /nurevo\.jp/);
});

async function phpFiles(dir: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...await phpFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".php") && entry.name !== "config.php") {
      output.push(path);
    }
  }
  return output.sort();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
