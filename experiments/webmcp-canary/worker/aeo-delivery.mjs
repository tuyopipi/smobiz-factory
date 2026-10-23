// A fetched configuration is an expectation, never proof of public delivery.
export async function recordFetched(env, siteId, version, payload) {
  await env.DB.prepare(`INSERT INTO aeo_delivery_expectations(site_id,ruleset_version,payload_json,fetched_at)
    VALUES(?,?,?,?) ON CONFLICT(site_id,ruleset_version) DO UPDATE SET
    payload_json=excluded.payload_json,fetched_at=excluded.fetched_at
    WHERE aeo_delivery_expectations.payload_json<>excluded.payload_json`).bind(siteId,version,JSON.stringify(payload),new Date().toISOString()).run();
}
export function containsExpected(actual, expected) {
  if (expected === null || typeof expected !== 'object') return actual === expected;
  if (Array.isArray(expected)) return Array.isArray(actual) && expected.length === actual.length && expected.every((v,i)=>containsExpected(actual[i],v));
  return actual && typeof actual === 'object' && Object.keys(expected).every(k=>containsExpected(actual[k],expected[k]));
}
export async function verifyDelivery(env, siteId, result, {persist=true} = {}) {
  const evidence = result.deliveryEvidence;
  if (!Number.isSafeInteger(evidence?.version) || evidence.robotsVersion !== evidence.version || evidence.llmsVersion !== evidence.version || !result.gatePassed) return null;
  const expected = await env.DB.prepare('SELECT payload_json FROM aeo_delivery_expectations WHERE site_id=? AND ruleset_version=?').bind(siteId,evidence.version).first();
  if (!expected) return null;
  const payload = JSON.parse(expected.payload_json);
  if (!payload || !evidence.nodes.some(node=>containsExpected(node,payload))) return null;
  if (persist) {
    const statements = deliveryStatements(env, siteId, evidence.version, result);
    if (env.DB.batch) await env.DB.batch(statements);
    else for (const statement of statements) await statement.run();
  }
  return evidence.version;
}

export function deliveryStatements(env, siteId, version, result) {
  const statements = [env.DB.prepare(`INSERT INTO aeo_site_delivery(site_id,delivered_version,verified_at) VALUES(?,?,?)
    ON CONFLICT(site_id) DO UPDATE SET delivered_version=excluded.delivered_version,verified_at=excluded.verified_at
    WHERE aeo_site_delivery.verified_at<=excluded.verified_at`)
    .bind(siteId,version,result.scannedAt)];
  if ((result.checks || []).filter(c=>c.fixable).every(c=>c.status==='OK')) {
    statements.push(env.DB.prepare("UPDATE aeo_autofix_jobs SET status='verified' WHERE site_id=? AND ruleset_version=? AND requested_at<=?")
      .bind(siteId,version,result.scannedAt));
  }
  return statements;
}
