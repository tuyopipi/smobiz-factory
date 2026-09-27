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
  plan TEXT DEFAULT 'pro',
  contract TEXT DEFAULT 'trial',       -- active | trial | cancelled
  resale_price INTEGER DEFAULT 0,
  -- タグ/プラグインから確実に取れる実測値（フェイクなし）
  schema_types INTEGER DEFAULT 0,      -- 出力中の JSON-LD type 数
  crawler_allowed INTEGER DEFAULT 0,   -- llms.txt / robots で 8種を許可しているか
  last_seen_at INTEGER,                -- タグ最終ハートビート
  created_at INTEGER
);

-- 店舗情報（情報充足率の判定元。埋まっている項目数で充足率を出す）
CREATE TABLE IF NOT EXISTS site_settings (
  site_id TEXT PRIMARY KEY,
  business_type TEXT,
  name TEXT, tel TEXT, address TEXT, hours TEXT, hours_periods TEXT,
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
