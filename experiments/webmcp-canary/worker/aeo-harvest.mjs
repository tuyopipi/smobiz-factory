// Reuse the diagnosis response: no additional crawl, model call or geocoding fee.
// Only explicit facts on a node identifying this same business are eligible.
export function observedBusinessFacts(nodes, site, current = {}) {
  const host = raw => {try {return new URL(/^https?:\/\//i.test(raw)?raw:`https://${raw}`).hostname.replace(/^www\./,'').toLowerCase();} catch {return null;}};
  const expectedHost = host(site.website_uri || site.url);
  if (!expectedHost) return {};
  const excluded = ['website','webpage','product','service','article','blogposting','newsarticle','faqpage'];
  const candidates = (nodes || []).filter(n=>[n['@type']].flat().some(t=>typeof t==='string' && !excluded.includes(t.toLowerCase())) && host(n.url) === expectedHost && (!current.name || n.name === current.name));
  if (candidates.length !== 1) return {}; // ambiguous locations need owner confirmation
  const n = candidates[0], facts = {};
  if (!current.address && n.address) {
    const address = typeof n.address === 'string' ? n.address : n.address.streetAddress;
    if (typeof address === 'string' && address.trim()) facts.address = address.trim().slice(0,500);
  }
  const coordinate = v => (typeof v==='number' || typeof v==='string') && String(v).trim()!=='';
  const nodeAddress = typeof n.address === 'string' ? n.address : n.address?.streetAddress;
  const addressMatches = !current.address || nodeAddress === current.address;
  const lat = Number(n.geo?.latitude), lng = Number(n.geo?.longitude);
  if (addressMatches && current.lat == null && current.lng == null && coordinate(n.geo?.latitude) && coordinate(n.geo?.longitude) && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat)<=90 && Math.abs(lng)<=180) {facts.lat=lat;facts.lng=lng;}
  const urls = [n.sameAs].flat().filter(u=>{
    try {const v=new URL(u);return v.protocol==='https:' && !v.username && !v.password && /(^|\.)(instagram\.com|facebook\.com|x\.com|twitter\.com|linkedin\.com|youtube\.com|tiktok\.com)$/.test(v.hostname);} catch {return false;}
  });
  if (urls.length) facts.sameAs=[...new Set(urls)].slice(0,20);
  return facts;
}
