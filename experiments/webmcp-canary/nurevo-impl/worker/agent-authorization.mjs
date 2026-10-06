// nurevo / worker / agent-authorization.mjs
// 稼働スイッチの中核。従来 env.WEBMCP_REGISTERED_SITE_KEYS(環境変数)で見ていた許可判定を
// D1 の sites テーブル参照に変更する。これで「代理店がダッシュボードでURL登録した瞬間、
// そのサイトのタグが本稼働」する。

/**
 * site_key が D1 に登録されているか判定し、登録済みなら last_seen を更新（＝設置検証）。
 * @returns {{ registered:boolean, plan:string, quality:"high"|"basic", siteId?:string }}
 */
export async function authorizeSiteKey(env, siteKey, { touch = true } = {}) {
  if (!siteKey) return { registered: false, plan: "free", quality: "basic" };

  const row = await env.DB
    .prepare("SELECT id, plan, status FROM sites WHERE site_key = ?")
    .bind(siteKey)
    .first();

  if (!row) {
    // 未登録キーは basic（＝タグは動くが high 機能はオフ）。旧: 許可リストに無い扱い。
    return { registered: false, plan: "free", quality: "basic" };
  }

  // 設置検証：来た時点で last_seen を更新し、pending/detected/error → active に昇格。
  if (touch) {
    await env.DB
      .prepare(
        "UPDATE sites SET last_seen_at = ?, status = CASE WHEN status IN ('pending','detected','error') THEN 'active' ELSE status END WHERE site_key = ?"
      )
      .bind(Date.now(), siteKey)
      .run();
  }

  const plan = ["standard", "pro"].includes(row.plan) ? row.plan : "free";
  const quality = plan === "pro" ? "high" : "basic"; // pro かつ登録済み → high
  return { registered: true, plan, quality, siteId: row.id };
}

// 受け入れ条件（Codex）:
//  - 未登録キー: registered=false, quality='basic'
//  - 登録キー(plan=pro): registered=true, quality='high'
//  - 呼ぶたび sites.last_seen_at が更新され、status が active になる
