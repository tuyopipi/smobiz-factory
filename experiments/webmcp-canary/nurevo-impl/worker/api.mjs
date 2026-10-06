// nurevo / worker / api.mjs
// 代理店ダッシュボード ⇄ タグ を結ぶ API。webmcp-canary(Worker) に載せる。
// 依存: env.DB (D1), ../shared/ai-crawlers.js
import { authorizeSiteKey } from "./agent-authorization.mjs";
import { AI_CRAWLERS, buildLlmsTxt, robotsBlock, matchCrawler } from "../shared/ai-crawlers.js";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const uid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const newKey = () => "nrv_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);

// 必須7項目の充足判定（ダッシュボードの「情報充足率」と一致させる）
const REQ = ["name", "tel", "address", "hours", "geo", "image", "reserve"];
function completeness(st = {}) {
  const has = {
    name: !!st.name, tel: !!st.tel, address: !!st.address, hours: !!st.hours,
    geo: st.lat != null && st.lng != null, image: !!st.image, reserve: !!st.reserve_url,
  };
  const filled = REQ.filter((k) => has[k]).length;
  return { filled, total: REQ.length, pct: Math.round((filled / REQ.length) * 100), has };
}

// 店舗情報 → schema.org LocalBusiness JSON-LD（タグが注入する中身）
function buildJsonLd(site, st) {
  const ld = { "@context": "https://schema.org", "@type": "LocalBusiness", name: st.name || site.url };
  if (st.address) ld.address = { "@type": "PostalAddress", streetAddress: st.address };
  if (st.tel) ld.telephone = st.tel;
  if (st.hours) ld.openingHours = st.hours;
  if (st.lat != null && st.lng != null) ld.geo = { "@type": "GeoCoordinates", latitude: st.lat, longitude: st.lng };
  if (st.image) ld.image = st.image;
  if (st.reserve_url) ld.potentialAction = { "@type": "ReserveAction", target: st.reserve_url };
  return ld;
}

export async function handleApi(request, env) {
  const url = new URL(request.url);
  const p = url.pathname;
  const m = request.method;

  // ── タグ ⇄ サーバー：キーで設定を引き、ハートビートを記録 ──────────────
  // GET /api/tag/config?k=nrv_xxx   → tag.js が毎ロード時に叩く
  if (p === "/api/tag/config" && m === "GET") {
    const key = url.searchParams.get("k");
    const auth = await authorizeSiteKey(env, key); // ← last_seen 更新（設置検証）
    if (!auth.registered) return json({ ok: false }, 404);
    const st = (await env.DB.prepare("SELECT * FROM site_settings WHERE site_id = ?").bind(auth.siteId).first()) || {};
    const site = await env.DB.prepare("SELECT url FROM sites WHERE id = ?").bind(auth.siteId).first();
    const jsonld = st.serve_schema ? buildJsonLd(site, st) : null;
    return json({ ok: true, quality: auth.quality, crawlerAllowed: !!st.allow_crawlers, jsonld });
  }

  // ── サイト登録（＝稼働スイッチON）: POST /api/sites {url} ──────────────
  if (p === "/api/sites" && m === "POST") {
    const me = await requireMember(request, env); if (!me) return json({ error: "unauthorized" }, 401);
    const { url: siteUrl } = await request.json();
    if (!siteUrl) return json({ error: "url required" }, 400);
    const id = uid(), key = newKey();
    await env.DB.prepare(
      "INSERT INTO sites (id, org_id, url, site_key, status, plan, contract, created_at) VALUES (?,?,?,?,'pending','free','free',?)"
    ).bind(id, me.org_id, siteUrl.replace(/^https?:\/\//, ""), key, Date.now()).run();
    const snippet = `<script src="https://nurevo.jp/tag.js" data-webmcp-site-key="${key}" defer></` + `script>`;
    return json({ id, siteKey: key, snippet });
  }

  // ── 一覧（4指標つき）: GET /api/sites ──────────────────────────────
  if (p === "/api/sites" && m === "GET") {
    const me = await requireMember(request, env); if (!me) return json({ error: "unauthorized" }, 401);
    const { results } = await env.DB.prepare(
      `SELECT s.*, ss.name AS s_name, ss.tel, ss.address, ss.hours, ss.lat, ss.lng, ss.image, ss.reserve_url, ss.business_type
       FROM sites s LEFT JOIN site_settings ss ON ss.site_id = s.id WHERE s.org_id = ?`
    ).bind(me.org_id).all();
    const now = Date.now();
    const sites = results.map((r) => {
      const c = completeness({ name: r.s_name, tel: r.tel, address: r.address, hours: r.hours, lat: r.lat, lng: r.lng, image: r.image, reserve_url: r.reserve_url });
      const stale = r.last_seen_at && now - r.last_seen_at > 24 * 3600e3;
      return {
        id: r.id, url: r.url, key: r.site_key, type: r.business_type || "other",
        status: stale ? "error" : r.status,          // 稼働（last_seen 由来）
        schema: r.schema_types || 0,                  // schema出力（種類数）
        crawler: !!r.crawler_allowed,                 // クローラー許可
        fill: c.filled, fillTotal: c.total, fillPct: c.pct, // 情報充足率
        lastSeen: r.last_seen_at, contract: r.contract, price: r.resale_price,
      };
    });
    return json({ sites });
  }

  // ── AEO設定保存: PUT /api/sites/:id ─────────────────────────────────
  // 封鎖済み。店情報の正本は worker/api.mjs の writeSiteProfile() →
  // worker/site-profile.mjs の mergeProfile() が一手に管理する（SSOT）。
  //
  // ここにあった site_settings への直書きは、マージャを通らないため
  //   ・フィールド単位の出所(provenance)が記録されない
  //   ・Places が人間の入力を上書きしない規則が効かない
  //   ・updated_at がサーバ時刻で刻まれない
  // という形で SSOT を壊す。参照実装としてルート形状だけ残し、実行は拒否する。
  //
  // 将来この実装を有効化する場合は、必ず mergeProfile() 経由に書き換えること。
  // 直書きを復活させてはならない。
  const mm = p.match(/^\/api\/sites\/([a-z0-9]+)$/i);
  if (mm && m === "PUT") {
    throw new Error(
      "nurevo-impl: direct site_settings write is sealed. " +
      "Store profile writes must go through mergeProfile() in worker/site-profile.mjs.",
    );
  }

  // ── 8種クローラー一覧（ダッシュボード表示用）: GET /api/crawlers ──────
  if (p === "/api/crawlers" && m === "GET") {
    return json({ crawlers: AI_CRAWLERS });
  }

  return null; // 該当なし
}


// セッションから member を取得（マジックリンク発行済み想定）
async function requireMember(request, env) {
  const cookie = request.headers.get("cookie") || "";
  const tok = (cookie.match(/nrv_session=([^;]+)/) || [])[1];
  if (!tok) return null;
  const s = await env.DB.prepare("SELECT member_id, org_id, expires_at FROM sessions WHERE token=?").bind(tok).first();
  if (!s || s.expires_at < Date.now()) return null;
  return { member_id: s.member_id, org_id: s.org_id };
}

export { matchCrawler, robotsBlock, buildLlmsTxt };
