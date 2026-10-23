import { resolveSitePlan } from "./billing-plan.mjs";
// Nurevo T-auth: server-side site-key authorization backed by D1.
export async function authorizeSiteKey(env, siteKey, { touch = true } = {}) {
  if (!siteKey) return { registered: false, plan: "free", quality: "basic" };

  const row = await env.DB
    .prepare("SELECT id, plan, manual_plan, status, delivery_status, (SELECT manual_plan FROM orgs WHERE orgs.id = sites.org_id) AS org_manual_plan FROM sites WHERE site_key = ?")
    .bind(siteKey)
    .first();
  if (!row) return { registered: false, plan: "free", quality: "basic" };
  // Billing writes row.plan; manual_plan is the tier granted without payment
  // (wholesale, demo, canary). resolveSitePlan is the single place that decides
  // between them, so the tag, MCP gating and the dashboard cannot disagree.
  // The org's grant counts too, so an org-comped Pro site is authorised as Pro.
  const plan = resolveSitePlan(row, { manual_plan: row.org_manual_plan });
  if (row.delivery_status === "stopped") return { registered: false, plan, quality: "basic", reason: "delivery_stopped" };

  if (touch) {
    await env.DB
      .prepare(
        "UPDATE sites SET last_seen_at = ?, status = CASE WHEN status IN ('pending','detected','error') THEN 'active' ELSE status END WHERE site_key = ?",
      )
      .bind(Date.now(), siteKey)
      .run();
  }
  return { registered: true, plan, quality: plan === "pro" ? "high" : "basic", siteId: row.id };
}
