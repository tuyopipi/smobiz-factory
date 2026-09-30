// Nurevo T-auth: server-side site-key authorization backed by D1.
export async function authorizeSiteKey(env, siteKey, { touch = true } = {}) {
  if (!siteKey) return { registered: false, plan: "basic", quality: "basic" };

  const row = await env.DB
    .prepare("SELECT id, plan, status, delivery_status FROM sites WHERE site_key = ?")
    .bind(siteKey)
    .first();
  if (!row) return { registered: false, plan: "basic", quality: "basic" };
  if (row.delivery_status === "stopped") return { registered: false, plan: row.plan || "basic", quality: "basic", reason: "delivery_stopped" };

  if (touch) {
    await env.DB
      .prepare(
        "UPDATE sites SET last_seen_at = ?, status = CASE WHEN status IN ('pending','detected','error') THEN 'active' ELSE status END WHERE site_key = ?",
      )
      .bind(Date.now(), siteKey)
      .run();
  }
  const plan = row.plan || "basic";
  return { registered: true, plan, quality: plan === "pro" ? "high" : "basic", siteId: row.id };
}
