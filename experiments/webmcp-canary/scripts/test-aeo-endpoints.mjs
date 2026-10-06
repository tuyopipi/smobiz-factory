import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

const fixtureHtml = `<!doctype html><html><head><title>Fixture</title></head><body><h1>Fixture</h1><p>This server-rendered fixture contains enough readable text for endpoint contract testing.</p></body></html>`;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  if (init.method === "HEAD") return new Response(null, { status: 200 });
  if (url.pathname === "/robots.txt") return new Response("User-agent: *\nAllow: /", { status: 200 });
  if (url.pathname === "/llms.txt") return new Response("not found", { status: 404 });
  return new Response(fixtureHtml, { status: 200, headers: { "content-type": "text/html" } });
};

class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key, type) {
    const value = this.values.get(key) ?? null;
    return type === "json" && value ? JSON.parse(value) : value;
  }
  async put(key, value) { this.values.set(key, value); }
}

const waitUntilTasks = [];
const ctx = { waitUntil(task) { waitUntilTasks.push(task); } };
const kv = new MemoryKv();
const env = { WEBMCP_KV: kv };
const publicUrl = "https://worker.test/api/aeo/score?url=https%3A%2F%2Fexample.com";
const first = await handleApi(new Request(publicUrl, { headers: { "cf-connecting-ip": "198.51.100.10" } }), env, ctx);
await Promise.all(waitUntilTasks);
const firstBody = await first.json();
assert.equal(first.status, 200);
assert.equal(first.headers.get("x-aeo-cache"), "miss");
assert.equal(first.headers.get("cache-control"), "public, max-age=604800");
assert.deepEqual(Object.keys(firstBody), ["score", "band", "gatePassed", "checks"]);

const second = await handleApi(new Request(publicUrl, { headers: { "cf-connecting-ip": "198.51.100.10" } }), env, ctx);
assert.equal(second.status, 200);
assert.equal(second.headers.get("x-aeo-cache"), "hit");

const limitedKv = new MemoryKv();
let last;
for (let index = 0; index < 21; index++) {
  last = await handleApi(new Request("https://worker.test/api/aeo/score?url=invalid", {
    headers: { "cf-connecting-ip": "198.51.100.20" },
  }), { WEBMCP_KV: limitedKv }, ctx);
}
assert.equal(last.status, 429);

const siteId = "site-1";
const statements = [];
const db = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async first() {
            if (sql.includes("FROM sites WHERE site_key")) return { id: siteId, plan: "free", status: "active", delivery_status: "active" };
            if (sql.includes("FROM sites WHERE id")) return { id: siteId, url: "https://example.com", website_uri: null, slug: null };
            if (sql.includes("FROM aeo_rulesets")) return { version: 1 };
            return null;
          },
          async run() { statements.push({ sql, values }); return { success: true }; },
        };
      },
      async first() { return null; },
    };
  },
};
const registered = await handleApi(new Request(`https://worker.test/api/sites/${siteId}/aeo-score?site_key=nrv_test`), { DB: db }, ctx);
const registeredBody = await registered.json();
assert.equal(registered.status, 200);
assert.deepEqual(Object.keys(registeredBody), ["score", "band", "gatePassed", "checks"]);
assert.ok(statements.some(({ sql }) => sql.includes("INSERT INTO aeo_scores")));

const denied = await handleApi(new Request(`https://worker.test/api/sites/${siteId}/aeo-score?site_key=`), { DB: db }, ctx);
assert.equal(denied.status, 404);

console.log("AEO endpoint tests passed");
