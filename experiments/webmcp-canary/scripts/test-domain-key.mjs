/**
 * Domain normalisation: the function that decides which installs are the same
 * site. (org_id, domain_key) is UNIQUE, so a wrong answer here either merges two
 * businesses into one row or lets one license claim unlimited seats.
 */
import assert from "node:assert/strict";
import { normalizeDomainKey, sameDomain } from "../worker/domain-key.mjs";

/* ---------------- the same site, spelled differently ---------------- */

const equivalent = [
  "example.com",
  "EXAMPLE.COM",
  "https://example.com",
  "http://example.com",
  "https://example.com/",
  "https://example.com/shop/index.php?a=1#top",
  "https://www.example.com",
  "WWW.Example.Com",
  "https://example.com:8443",
  "example.com.",
  "  example.com  ",
  "//example.com",
];
for (const input of equivalent) {
  assert.equal(normalizeDomainKey(input), "example.com", `normalises to example.com: ${input}`);
}

/* ---------------- deliberately distinct ---------------- */

assert.equal(normalizeDomainKey("shop.example.com"), "shop.example.com", "a subdomain is its own site");
assert.notEqual(normalizeDomainKey("shop.example.com"), normalizeDomainKey("example.com"), "a subdomain is not the apex");
assert.equal(normalizeDomainKey("example.co.jp"), "example.co.jp", "a multi-label suffix is kept whole");
assert.equal(normalizeDomainKey("example.org"), "example.org", "a different TLD is a different site");
assert.notEqual(normalizeDomainKey("example.org"), normalizeDomainKey("example.com"), "TLDs are not interchangeable");

// Only the first www. is cosmetic; the rest is somebody's real host.
assert.equal(normalizeDomainKey("www.www.example.com"), "www.example.com", "only one leading www. is stripped");

/* ---------------- IDNA ---------------- */

assert.equal(normalizeDomainKey("日本語.jp"), "xn--wgv71a119e.jp", "a Unicode host becomes punycode");
assert.equal(normalizeDomainKey("https://日本語.jp/path"), "xn--wgv71a119e.jp", "IDNA survives a full URL");
assert.equal(
  normalizeDomainKey("日本語.jp"),
  normalizeDomainKey("xn--wgv71a119e.jp"),
  "the Unicode and punycode spellings are one site",
);
assert.equal(normalizeDomainKey("CAFÉ.example.com"), "xn--caf-dma.example.com", "a Unicode label is lowercased and encoded");

/* ---------------- nothing usable ---------------- */

for (const input of [null, undefined, "", "   ", "https://", "//", "/just/a/path", "?query=1"]) {
  assert.equal(normalizeDomainKey(input), null, `no domain to extract: ${JSON.stringify(input)}`);
}

// null, not "": in SQL a NULL domain_key cannot collide, an empty string
// collides with every other empty string under the same org.
assert.equal(normalizeDomainKey(""), null, "an empty address yields null rather than an empty key");

/* ---------------- not bindable sites ---------------- */

for (const input of ["localhost", "http://localhost:8080", "foo.localhost", "LOCALHOST"]) {
  assert.equal(normalizeDomainKey(input), null, `a loopback name is not a bindable site: ${input}`);
}
for (const input of ["127.0.0.1", "192.168.1.10", "8.8.8.8", "http://10.0.0.1:8080"]) {
  assert.equal(normalizeDomainKey(input), null, `an IPv4 literal is not a bindable site: ${input}`);
}
assert.equal(normalizeDomainKey("[::1]"), null, "an IPv6 literal is not a bindable site");
assert.equal(normalizeDomainKey("intranet"), null, "a bare hostname with no dot is not a bindable site");

// Local development still needs to exercise the path, so the refusal is opt-out
// rather than absolute - but only for callers that ask explicitly.
assert.equal(normalizeDomainKey("localhost", { allowReserved: true }), "localhost", "loopback is allowed when explicitly permitted");
assert.equal(normalizeDomainKey("http://localhost:8080/wp", { allowReserved: true }), "localhost", "a loopback URL normalises when permitted");

/* ---------------- comparing two addresses ---------------- */

assert.equal(sameDomain("https://www.example.com/wp-admin/", "example.com"), true, "the same site spelled two ways matches");
assert.equal(sameDomain("https://shop.example.com", "example.com"), false, "a subdomain does not match the apex");
assert.equal(sameDomain("", "example.com"), false, "an empty address matches nothing");
assert.equal(sameDomain("", ""), false, "two empty addresses do not match each other");
assert.equal(sameDomain("localhost", "localhost"), false, "unbindable hosts do not match by default");
assert.equal(sameDomain("localhost", "http://localhost:8080", { allowReserved: true }), true, "loopback matches when permitted");

/* ---------------- stability ---------------- */

// Normalising an already-normalised key must not change it, or a re-bind would
// compute a different key from the one stored and create a second row.
for (const input of ["example.com", "shop.example.com", "xn--wgv71a119e.jp", "example.co.jp"]) {
  assert.equal(normalizeDomainKey(normalizeDomainKey(input)), normalizeDomainKey(input), `idempotent: ${input}`);
}

console.log("domain key tests passed");
