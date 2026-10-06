/**
 * The domain a site is claimed under.
 *
 * Bind-on-license pairs a license with a domain, and `(org_id, domain_key)` is
 * UNIQUE, so this function decides which installs are "the same site". Two
 * people typing the same site differently - with https, with www, with a
 * trailing slash, in capitals - must land on one row, or the second one silently
 * creates a duplicate site and the seat count is wrong.
 *
 * Deliberately NOT collapsed:
 *
 *   Subdomains. shop.example.com is a different site from example.com. They are
 *   usually different businesses or at least different pages to diagnose, and
 *   collapsing them would let one license cover an unbounded number of stores.
 *
 *   Ports and paths. example.com/shop is not a site boundary we can police, and
 *   a port is a deployment detail, so both are discarded rather than kept.
 */

/** Hosts that are never a real public site; refused rather than normalised. */
const RESERVED_HOSTS = new Set(["localhost", "localhost.localdomain", "ip6-localhost", "ip6-loopback"]);

/**
 * Reduce any reasonable spelling of a site address to its domain key.
 *
 * Returns null when there is nothing usable, which callers must treat as "no
 * domain" rather than as an empty key: in SQL a NULL domain_key cannot collide,
 * an empty string collides with every other empty string under the same org.
 */
export function normalizeDomainKey(input, { allowReserved = false } = {}) {
  let value = String(input ?? "").trim();
  if (value === "") return null;

  // Strip a scheme, and anything that looks like credentials in front of the
  // host, before the URL parser sees it. A bare "example.com" has no scheme, so
  // one is added to give the parser something it can read.
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  if (value.startsWith("//")) value = value.slice(2);
  value = value.split(/[/?#]/, 1)[0];
  if (value === "") return null;

  let host;
  try {
    // The URL parser applies IDNA (Unicode to punycode) and lowercases for us,
    // which is the whole reason for routing through it rather than regexing.
    host = new URL(`http://${value}`).hostname;
  } catch {
    return null;
  }
  if (!host) return null;

  // An absolute DNS name ends in a dot; "example.com." is "example.com".
  host = host.replace(/\.+$/, "");
  // Exactly one leading www. www.www.example.com is somebody's real host.
  host = host.replace(/^www\./, "");
  host = host.toLowerCase();
  if (host === "") return null;

  // Bracketed IPv6 survives the parser; neither IP form is a site we can bind.
  if (host.startsWith("[") || isIpv4(host)) return null;
  if (!allowReserved && (RESERVED_HOSTS.has(host) || host.endsWith(".localhost"))) return null;
  // A domain key with no dot is a hostname, not a site, once reserved names are
  // out of the way. Keeping it would let "intranet" claim a seat.
  if (!allowReserved && !host.includes(".")) return null;

  return host;
}

function isIpv4(host) {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

/**
 * Do two addresses name the same site?
 *
 * Used to check that the domain a license is being redeemed against is the one
 * the install actually runs on, so a key cannot be bound to someone else's
 * domain from a third machine.
 */
export function sameDomain(a, b, options) {
  const left = normalizeDomainKey(a, options);
  const right = normalizeDomainKey(b, options);
  return left !== null && left === right;
}
