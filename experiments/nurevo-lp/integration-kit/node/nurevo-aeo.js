/**
 * nurevo-aeo.js — Nurevo サーバーサイドAEO連携（Node.js / Express 向け）
 * ------------------------------------------------------------------
 * サーバー側で中央設定(ruleset反映済みJSON-LD)を取得し、HTMLの <head> に
 * <script type="application/ld+json"> を埋め込むためのヘルパー。
 *
 * ⚠️ クライアント側 <script src> ではAIに読まれません。必ずサーバー側で描画に含めること。
 *
 * Node 18+ は fetch 内蔵。それ未満は `npm i node-fetch` して globalThis.fetch に割り当て。
 *
 * 使い方（テンプレートに文字列を差し込む例）:
 *   const { nurevoJsonLdTag } = require('./nurevo-aeo');
 *   app.get('/', async (req, res) => {
 *     const ld = await nurevoJsonLdTag('nrv_あなたのサイトキー');
 *     res.send(`<!doctype html><html><head>${ld}</head><body>...</body></html>`);
 *   });
 */

const NUREVO_BASE = 'https://nurevo.jp';
const _cache = new Map(); // siteKey -> { jsonld: object, at: number }

async function _fetchConfig(siteKey, ttlMs) {
  const hit = _cache.get(siteKey);
  if (hit && Date.now() - hit.at < ttlMs) return hit.jsonld;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch(
      `${NUREVO_BASE}/api/tag/config?k=${encodeURIComponent(siteKey)}`,
      { signal: ctrl.signal, headers: { 'User-Agent': 'nurevo-server-integration/1.0' } }
    );
    clearTimeout(timer);
    if (r.ok) {
      const cfg = await r.json();
      if (cfg && cfg.ok && cfg.jsonld === null) {
        _cache.delete(siteKey); // Explicit withdrawal is not a transport failure.
        return null;
      }
      if (cfg && cfg.ok && cfg.jsonld) {
        _cache.set(siteKey, { jsonld: cfg.jsonld, at: Date.now() });
        return cfg.jsonld;
      }
    }
  } catch (_) {
    /* fail open — 店のページは壊さない */
  }
  return hit ? hit.jsonld : null; // API障害時は期限切れでも返す
}

/**
 * <script type="application/ld+json"> 文字列を返す（失敗時は空文字）。
 * @param {string} siteKey nrv_xxx
 * @param {{ttlMs?:number}} [opts] キャッシュTTL（既定10分）
 * @returns {Promise<string>}
 */
async function nurevoJsonLdTag(siteKey, opts = {}) {
  if (!siteKey) return '';
  const ttlMs = opts.ttlMs ?? 600000; // 10分
  const jsonld = await _fetchConfig(siteKey, ttlMs);
  if (!jsonld) return '';
  const safe = JSON.stringify(jsonld).replace(/</g, '\\u003c'); // </script>混入対策
  return `<script type="application/ld+json">${safe}</script>`;
}

/**
 * Express ミドルウェア版。res.locals.nurevoJsonLd にタグ文字列を入れる。
 * テンプレート側で {{{nurevoJsonLd}}} 等で <head> に出力する。
 */
function nurevoMiddleware(siteKey, opts = {}) {
  return async function (req, res, next) {
    try { res.locals.nurevoJsonLd = await nurevoJsonLdTag(siteKey, opts); }
    catch { res.locals.nurevoJsonLd = ''; }
    next();
  };
}

module.exports = { nurevoJsonLdTag, nurevoMiddleware };
