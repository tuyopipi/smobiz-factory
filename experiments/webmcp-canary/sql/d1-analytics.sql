-- Same-form field error rates.
SELECT
  fo.form_id,
  fe.selector,
  fe.key,
  COUNT(*) AS error_count,
  COUNT(DISTINCT fp.id) AS affected_submissions,
  ROUND(COUNT(DISTINCT fp.id) * 1.0 / NULLIF(total.total_submissions, 0), 4) AS affected_rate
FROM footprint_events fe
JOIN footprints fp ON fp.id = fe.footprint_id
JOIN forms fo ON fo.form_hash = fp.form_hash
JOIN (
  SELECT form_hash, COUNT(*) AS total_submissions
  FROM footprints
  GROUP BY form_hash
) total ON total.form_hash = fp.form_hash
WHERE fe.error_text IS NOT NULL AND fe.error_text <> ''
GROUP BY fo.form_id, fe.selector, fe.key, total.total_submissions
ORDER BY affected_rate DESC, error_count DESC;

-- Site completion benchmark.
SELECT
  s.host,
  COUNT(*) AS submissions,
  ROUND(SUM(CASE WHEN fp.status = 'success' THEN 1 ELSE 0 END) * 1.0 / COUNT(*), 4) AS completion_rate
FROM footprints fp
JOIN sites s ON s.id = fp.site_id
GROUP BY s.host
HAVING submissions >= 20
ORDER BY completion_rate DESC;

-- Cross-site field pain by key.
SELECT
  fe.key,
  COUNT(*) AS error_count,
  COUNT(DISTINCT fp.site_id) AS sites_affected,
  COUNT(DISTINCT fp.form_hash) AS forms_affected
FROM footprint_events fe
JOIN footprints fp ON fp.id = fe.footprint_id
WHERE fe.error_text IS NOT NULL AND fe.error_text <> ''
GROUP BY fe.key
ORDER BY sites_affected DESC, error_count DESC;

-- A/B success rates by site and variant.
SELECT
  s.host,
  ab.experiment_name,
  ab.variant,
  COUNT(*) AS results,
  SUM(CASE WHEN ab.result_status = 'success' THEN 1 ELSE 0 END) AS successes,
  ROUND(SUM(CASE WHEN ab.result_status = 'success' THEN 1 ELSE 0 END) * 1.0 / NULLIF(COUNT(*), 0), 4) AS success_rate
FROM ab_events ab
JOIN sites s ON s.id = ab.site_id
WHERE ab.type = 'result'
GROUP BY s.host, ab.experiment_name, ab.variant;
