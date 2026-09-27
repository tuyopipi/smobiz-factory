ALTER TABLE sites ADD COLUMN install_type TEXT NOT NULL DEFAULT 'tag';
ALTER TABLE sites ADD COLUMN gbp_linked INTEGER NOT NULL DEFAULT 0;
UPDATE sites SET install_type = CASE WHEN trim(COALESCE(url, '')) = '' THEN 'hosted' ELSE 'tag' END;
