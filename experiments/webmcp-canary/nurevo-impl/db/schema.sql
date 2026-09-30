-- nurevo / db / schema.sql
-- Cloudflare D1 (SQLite)。webmcp-canary で検証 → 本番反映。
-- 適用: wrangler d1 execute nurevo-db --file=db/schema.sql

CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  name TEXT,
  plan TEXT DEFAULT 'pro',
  wholesale_price INTEGER DEFAULT 1500,
  wholesale_min INTEGER NOT NULL DEFAULT 50,
  created_at INTEGER
  ,channel TEXT NOT NULL DEFAULT 'direct'
  ,referred_by TEXT
  ,stripe_customer_id TEXT
  ,stripe_subscription_id TEXT
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'operator',        -- admin | operator | viewer
  status TEXT DEFAULT 'invited',       -- active | invited | disabled
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,              -- ログインセッション / マジックリンク
  member_id TEXT,
  org_id TEXT,
  kind TEXT DEFAULT 'session',         -- magic | session
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS invites (
  token TEXT PRIMARY KEY,
  org_id TEXT, email TEXT, role TEXT,
  expires_at INTEGER
);

-- ★中核：登録した瞬間に「稼働スイッチ」が入るテーブル
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  url TEXT NOT NULL,
  site_key TEXT UNIQUE NOT NULL,       -- タグが名乗るキー = 稼働スイッチ
  install_type TEXT NOT NULL DEFAULT 'tag', -- wp | tag | hosted
  gbp_linked INTEGER NOT NULL DEFAULT 0,
  tag_detected INTEGER,
  schema_in_html INTEGER,
  scanned_at INTEGER,
  scan_error TEXT,
  status TEXT DEFAULT 'pending',       -- pending | detected | active | error
  delivery_status TEXT NOT NULL DEFAULT 'active', -- active | stopped
  plan TEXT DEFAULT 'pro',
  contract TEXT DEFAULT 'trial',       -- active | trial | cancelled
  resale_price INTEGER DEFAULT 0,
  -- タグ/プラグインから確実に取れる実測値（フェイクなし）
  schema_types INTEGER DEFAULT 0,      -- 出力中の JSON-LD type 数
  crawler_allowed INTEGER DEFAULT 0,   -- llms.txt / robots で 8種を許可しているか
  last_seen_at INTEGER,                -- タグ最終ハートビート
  place_id TEXT,
  fetched_at INTEGER,
  slug TEXT,
  channel TEXT NOT NULL DEFAULT 'direct',
  referred_by TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  website_uri TEXT,
  website_fingerprint TEXT,
  recommended_install_type TEXT,
  owner_member_id TEXT,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sites_owner_member ON sites(owner_member_id);

-- 店舗情報（情報充足率の判定元。埋まっている項目数で充足率を出す）
CREATE TABLE IF NOT EXISTS site_settings (
  site_id TEXT PRIMARY KEY,
  business_type TEXT,
  name TEXT, tel TEXT, address TEXT, hours TEXT, hours_periods TEXT,
  price_level TEXT,
  price TEXT,
  lat REAL, lng REAL,                  -- 緯度経度（両方あって geo 充足）
  image TEXT, reserve_url TEXT,
  serve_schema INTEGER DEFAULT 1,      -- schema 出力 ON/OFF
  allow_crawlers INTEGER DEFAULT 1     -- AIクローラー許可 ON/OFF
);

-- 将来：AIクローラーの実アクセス数（サーバー/CDNログ or WPプラグインから日次集計）
CREATE TABLE IF NOT EXISTS crawler_hits (
  site_id TEXT NOT NULL,
  date TEXT NOT NULL,                  -- YYYY-MM-DD
  crawler_id TEXT NOT NULL,            -- ai-crawlers.js の id（gptbot 等）
  hits INTEGER DEFAULT 0,
  PRIMARY KEY (site_id, date, crawler_id)
);

CREATE INDEX IF NOT EXISTS idx_sites_org  ON sites(org_id);
CREATE INDEX IF NOT EXISTS idx_sites_key  ON sites(site_key);
CREATE INDEX IF NOT EXISTS idx_sites_places_refresh ON sites(fetched_at, place_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
CREATE INDEX IF NOT EXISTS idx_members_org ON members(org_id);
CREATE INDEX IF NOT EXISTS idx_hits_site  ON crawler_hits(site_id, date);

CREATE TABLE IF NOT EXISTS referrers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'individual',
  email TEXT,
  stripe_account_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_events (
  event_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS aeo_rulesets (
  version INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_aeo_rulesets_one_active
  ON aeo_rulesets(active) WHERE active = 1;

INSERT OR IGNORE INTO aeo_rulesets (version, created_at, definition_json, active, notes)
VALUES (
  1,
  '2026-09-30T00:00:00.000Z',
  '{"schema":{"context":"https://schema.org","type":"LocalBusiness","required":["@context","@type","name"],"recommended":["url","additionalType","address","telephone","openingHours","openingHoursSpecification","geo","priceRange","image","potentialAction"],"fields":{"url":true,"additionalType":true,"address":true,"telephone":true,"openingHours":true,"openingHoursSpecification":true,"geo":true,"priceRange":true,"image":true,"potentialAction":true},"hostedFields":["address","openingHoursSpecification","geo","telephone","priceRange"],"priceLevelMap":{"PRICE_LEVEL_FREE":"Free","PRICE_LEVEL_INEXPENSIVE":"¥","PRICE_LEVEL_MODERATE":"¥¥","PRICE_LEVEL_EXPENSIVE":"¥¥¥","PRICE_LEVEL_VERY_EXPENSIVE":"¥¥¥¥"},"hostedPriceLevelMap":{"PRICE_LEVEL_FREE":"¥","PRICE_LEVEL_INEXPENSIVE":"¥","PRICE_LEVEL_MODERATE":"¥¥","PRICE_LEVEL_EXPENSIVE":"¥¥¥","PRICE_LEVEL_VERY_EXPENSIVE":"¥¥¥"}},"llmsTxt":{"format":"markdown","sections":["identity","store_information","supported_ai_crawlers"]},"robots":{"defaultAllow":true,"aiCrawlerIds":["gptbot","oai-search","chatgpt-user","claudebot","perplexity","google-ext","applebot-ext","bytespider"]},"defaults":{"schemaType":"LocalBusiness","nameSource":"settings.name_or_site.url","hostedBaseUrl":"https://nurevo.jp/s/"}}',
  1,
  'Initial ruleset matching the pre-AEO-brain JSON-LD output.'
);

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

INSERT OR IGNORE INTO aeo_ruleset_activations (id, ruleset_version, activated_at, activated_by, notes)
SELECT 'activation-initial-v1', version, created_at, 'system:migration-0015', 'Initial active ruleset history'
  FROM aeo_rulesets
 WHERE version = 1 AND active = 1;

CREATE TABLE IF NOT EXISTS aeo_scores (
  site_id TEXT NOT NULL,
  scanned_at TEXT NOT NULL,
  host TEXT,
  score INTEGER,
  verdict TEXT,
  checks_json TEXT,
  ruleset_version INTEGER,
  PRIMARY KEY (site_id, scanned_at)
);

CREATE INDEX IF NOT EXISTS idx_aeo_scores_site_scanned_at
  ON aeo_scores(site_id, scanned_at);

CREATE TABLE IF NOT EXISTS aeo_site_recommendations (
  site_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  ruleset_version INTEGER,
  learning_run_id TEXT,
  PRIMARY KEY (site_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_aeo_site_recommendations_status
  ON aeo_site_recommendations(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS aeo_learning_runs (
  id TEXT PRIMARY KEY,
  ran_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  trigger TEXT NOT NULL,
  sites_analyzed INTEGER NOT NULL DEFAULT 0,
  recommendations_created INTEGER NOT NULL DEFAULT 0,
  candidate_version INTEGER,
  mode TEXT NOT NULL,
  summary TEXT NOT NULL,
  input_materials_json TEXT NOT NULL,
  citation_samples_used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_aeo_learning_runs_ran_at
  ON aeo_learning_runs(ran_at DESC);
