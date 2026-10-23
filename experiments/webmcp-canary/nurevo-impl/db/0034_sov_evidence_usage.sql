-- Additive. What each engine call consumed, as the provider reported it (token
-- counts, search context size, and its own cost breakdown when given), so the
-- real cost of a measurement can be summed instead of estimated. NULL for rows
-- written before this column existed and for calls that failed.
ALTER TABLE aeo_sov_evidence ADD COLUMN usage_json TEXT;
