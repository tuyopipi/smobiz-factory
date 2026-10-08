/**
 * Where to actually fix this site.
 *
 * A score tells an operator they have a problem. This tells them which thing
 * to go and change, in the order worth changing it. That ordering is the whole
 * value: eight checks all saying "needs work" is not advice.
 *
 * Every item here comes from something measured or stored - a diagnosis that
 * ran, a profile field that is empty, a property the current criteria score and
 * this site's schema does not carry. Nothing is generated to fill the list. A
 * site with nothing wrong gets an empty list, which is the correct answer and
 * reads better than invented busywork.
 *
 * Pure. The caller supplies the diagnosis, the profile and the criteria.
 */

/**
 * Severity of each source, highest first.
 *
 * A gate check is first because failing one caps the score at 15 however good
 * everything else is - fixing anything else first is wasted work. Then the
 * things that block being understood at all, then the things that improve an
 * answer that already works.
 */
const PRIORITY = Object.freeze({
  gate_blocked: 100,
  schema_missing: 80,
  check_bad: 70,
  criteria_lag: 60,
  profile_missing: 50,
  check_warn: 30,
  stored: 20,
});

/** Checks that cap the score until they pass. Mirrors AEO_CHECKS[].gate. */
const GATE_CHECKS = Object.freeze(["ai_crawlers_allowed", "edge_access", "server_rendered_html"]);

/**
 * What each scored property is called, and what filling it actually does.
 *
 * Keyed by the lowercase property name the scorer tests for. A property with
 * no entry still produces an item - it just carries the raw name, which is
 * better than silently dropping a criterion the site is being marked down on.
 */
const PROPERTY_GUIDE = Object.freeze({
  name: { field: "name", ja: "店舗名", why: "AIが店を特定できません。" },
  url: { field: "url", ja: "サイトURL", why: "回答からサイトへ誘導できません。" },
  address: { field: "address", ja: "住所", why: "場所を尋ねられても答えられません。" },
  streetaddress: {
    field: "address",
    ja: "住所の構造化（PostalAddress）",
    why: "住所が文字列のままだと、AIは番地を文章から推測するしかありません。",
  },
  telephone: { field: "phone", ja: "電話番号", why: "連絡手段を答えられません。" },
  openinghours: { field: "hours", ja: "営業時間", why: "「今開いていますか」に答えられません。" },
  geo: { field: "geo", ja: "緯度・経度", why: "「近くの店」として検索されにくくなります。" },
  description: { field: "description", ja: "紹介文", why: "どんな店かを説明できません。" },
  email: { field: "email", ja: "メールアドレス", why: "電話以外の連絡手段を答えられません。" },
});

const text = (value) => String(value == null ? "" : value).trim();

/**
 * Which scored properties this site's published schema does not carry.
 *
 * `publishedProps` is what the diagnosis found. Anything the criteria score and
 * the page does not publish is a concrete, named gap - and the most useful kind
 * of advice we can give, because it is exactly what the score deducted for.
 */
export function missingScoredProps(scoredProps = [], publishedProps = []) {
  const published = new Set((publishedProps || []).map((p) => text(p).toLowerCase()));
  return (scoredProps || [])
    .map((p) => text(p).toLowerCase())
    .filter(Boolean)
    .filter((p) => !published.has(p));
}

/**
 * Build the list.
 *
 * checks        - the latest diagnosis, localised: [{ id, status, label, message }]
 * profile       - the canonical store profile, to say whether a gap is a
 *                 missing value or a missing output
 * scoredProps   - what the criteria in force score
 * publishedProps- what this site's schema was found to publish
 * plan          - the site's tier, so criteria lag can be named as such
 * stored        - rows from aeo_site_recommendations
 */
export function buildSiteRecommendations({
  checks = [],
  profile = {},
  scoredProps = [],
  publishedProps = [],
  plan = "free",
  stored = [],
} = {}) {
  const items = [];
  const seen = new Set();
  const push = (item) => {
    const key = `${item.kind}:${item.target || item.id || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  /* -------- failing checks, gates first -------- */

  for (const check of Array.isArray(checks) ? checks : []) {
    const id = text(check?.id);
    const status = text(check?.status).toUpperCase();
    if (!id || (status !== "BAD" && status !== "WARN")) continue;
    const gate = GATE_CHECKS.includes(id);
    push({
      kind: gate && status === "BAD" ? "gate_blocked" : status === "BAD" ? "check_bad" : "check_warn",
      id,
      target: id,
      priority: gate && status === "BAD" ? PRIORITY.gate_blocked : status === "BAD" ? PRIORITY.check_bad : PRIORITY.check_warn,
      title: text(check?.label) || id,
      detail: text(check?.message),
      // A gate failure is worth saying out loud: nothing else moves the score
      // until it passes.
      blocking: gate && status === "BAD",
      status,
    });
  }

  /* -------- properties the criteria score and the page does not publish -------- */

  for (const prop of missingScoredProps(scoredProps, publishedProps)) {
    const guide = PROPERTY_GUIDE[prop];
    const field = guide?.field;
    const value = field ? profile?.[field] : undefined;
    const hasValue = field === "geo"
      ? profile?.lat != null && profile?.lng != null
      : text(value) !== "";
    // Two quite different problems wearing the same symptom. If the operator
    // never entered the value, telling them to "publish it" is useless; if
    // they did, the value is sitting in the profile and the site is simply not
    // entitled to publish it yet.
    if (!hasValue) {
      push({
        kind: "profile_missing",
        id: `profile:${prop}`,
        target: prop,
        priority: PRIORITY.profile_missing,
        title: `${guide?.ja || prop}を入力`,
        detail: guide?.why ? `${guide.why} 店舗情報に入力すると出力されます。` : "店舗情報に入力すると出力されます。",
        field: field || null,
        status: "BAD",
      });
    } else if (plan === "free") {
      push({
        kind: "criteria_lag",
        id: `criteria:${prop}`,
        target: prop,
        priority: PRIORITY.criteria_lag,
        title: `${guide?.ja || prop}が最新基準で出力されていません`,
        detail: `${guide?.why || ""} 値は入力済みです。Standardにすると最新の判定基準に自動追従して出力されます。`.trim(),
        field: field || null,
        upgrade: "standard",
        status: "WARN",
      });
    } else {
      push({
        kind: "schema_missing",
        id: `schema:${prop}`,
        target: prop,
        priority: PRIORITY.schema_missing,
        title: `${guide?.ja || prop}がschemaに出力されていません`,
        detail: `${guide?.why || ""} 値は入力済みです。出力設定を確認してください。`.trim(),
        field: field || null,
        status: "BAD",
      });
    }
  }

  /* -------- what the learning job recorded -------- */

  for (const row of Array.isArray(stored) ? stored : []) {
    let detail = {};
    try { detail = typeof row?.detail_json === "string" ? JSON.parse(row.detail_json) : (row?.detail_json || {}); } catch { detail = {}; }
    const missing = Array.isArray(detail.missing_fields) ? detail.missing_fields : [];
    // Everything this row names is already covered, item by item, by the two
    // passes above - so adding it again would pad the list rather than inform
    // it. It only earns a place when it says something they did not.
    if (missing.length && missing.every((field) => seen.has(`profile_missing:${text(field?.schema).toLowerCase()}`))) continue;
    push({
      kind: "stored",
      id: `stored:${text(row?.kind) || "recommendation"}`,
      target: text(row?.kind),
      priority: PRIORITY.stored,
      title: text(row?.kind) === "missing_customer_data" ? "店舗情報の確認が必要です" : text(row?.kind),
      detail: text(detail.reason),
      fields: missing.map((field) => text(field?.label) || text(field?.key)).filter(Boolean),
      status: "WARN",
    });
  }

  items.sort((a, b) => b.priority - a.priority || String(a.id).localeCompare(String(b.id)));
  return {
    plan,
    count: items.length,
    blocking: items.filter((item) => item.blocking).length,
    scored_props: (scoredProps || []).map((p) => text(p).toLowerCase()).filter(Boolean),
    items,
  };
}
