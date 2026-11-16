-- Agency-entered sales progress; not billing or permission to contact.
ALTER TABLE agency_leads ADD COLUMN sales_status TEXT NOT NULL DEFAULT 'new'
  CHECK (sales_status IN ('new','proposed','trial','won','lost'));
ALTER TABLE agency_leads ADD COLUMN sales_updated_at INTEGER;
