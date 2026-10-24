-- The dashboard language a member chose, one of the dashboard's locale codes
-- (worker/dashboard-locales.mjs: ja, en, zh, tw, ko, es, fr, de and the
-- plugin's codes such as pt_BR, he_IL, es_MX). Additive and nullable.
--
-- member_email_preferences.language keeps its CHECK of the eight email
-- languages and stays the email language; POST /api/me/language now writes
-- both. The worker reads and writes this column only when it exists, so the
-- code may ship before this runs.
ALTER TABLE member_email_preferences ADD COLUMN dashboard_locale TEXT;
