CREATE TABLE IF NOT EXISTS aeo_ruleset_activations (
  id TEXT PRIMARY KEY,
  ruleset_version INTEGER NOT NULL,
  activated_at TEXT NOT NULL,
  activated_by TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (ruleset_version) REFERENCES aeo_rulesets(version)
);

CREATE INDEX IF NOT EXISTS idx_aeo_ruleset_activations_version_time
  ON aeo_ruleset_activations(ruleset_version, activated_at DESC);

INSERT INTO aeo_ruleset_activations (id, ruleset_version, activated_at, activated_by, notes)
SELECT 'activation-initial-v1', version, created_at, 'system:migration-0015', 'Initial active ruleset history'
  FROM aeo_rulesets
 WHERE version = 1 AND active = 1
   AND NOT EXISTS (SELECT 1 FROM aeo_ruleset_activations WHERE id = 'activation-initial-v1');
