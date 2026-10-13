-- Language preferences are per recipient, independent of org and billing.
CREATE TABLE IF NOT EXISTS member_email_preferences (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  language TEXT CHECK(language IN ('ja','en','zh','zh-tw','ko','es','fr','de')),
  registration_locale TEXT CHECK(registration_locale IN ('ja','en','zh','zh-tw','ko','es','fr','de'))
);
