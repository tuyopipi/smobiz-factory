# WebMCP Canary

WebMCP Canary is a Cloudflare Workers + D1 + WordPress plugin demo for adding server-generated MCP form metadata, privacy-safe form footprints, AEO metadata, A/B testing, and a WordPress admin dashboard.

## Canonical Local Setup

Use one local architecture:

- WebMCP API and `tag.js`: `npm start`, running `wrangler dev --local` from `wrangler.jsonc` on `http://127.0.0.1:8443`.
- WebMCP data: local D1 via the `WEBMCP_DB` binding. `npm run wp:demo` applies local migrations before starting the Worker.
- WordPress: Docker Compose `wordpress` + `db` services, available at `http://localhost:8080`.
- WordPress data: Docker MySQL volume `wp_db`; WordPress files in Docker volume `wp_html`.
- Plugin source: mounted read-only from `wordpress-plugin/webmcp-canary`.
- WordPress admin API calls: derived from the configured `tag.js` URL, with Docker fallback to `host.docker.internal`. `WEBMCP_API_BASE` can override the API origin for unusual setups.

There is no supported standalone Node or Vercel server path. Local development, demo seeding, and smoke/headless checks all go through the Worker API.

## Local Demo

From this directory:

```bash
npm install
npm run wp:demo
npm run seed:demo
```

`npm run wp:demo` starts the local Worker when `WEBMCP_TAG_URL` points at localhost, starts WordPress/MySQL, installs WordPress if needed, installs Contact Form 7, activates WebMCP Canary, issues a free site key through the API origin derived from `WEBMCP_TAG_URL`, saves it to the plugin settings, and creates a demo form page.

`npm run seed:demo` finds the active local site key automatically and posts realistic privacy-safe footprints. After that, open:

```text
http://localhost:8080/wp-admin/admin.php?page=webmcp-canary&webmcp_refresh=1
```

Admin login:

```text
URL:      http://localhost:8080/wp-admin/
User:     admin
Password: password
```

Expected dashboard state after seeding:

- basic stats are visible
- benchmark panel is visible but locked
- improvement suggestions are visible
- later suggestions are locked as Pro-plan upsell content

Stop local services:

```bash
npm run wp:down
```

Reset WordPress/MySQL volumes:

```bash
npm run wp:reset
```

## WordPress Plugin

The plugin lives in:

```text
wordpress-plugin/webmcp-canary/
```

Settings page capabilities:

- enable or disable tag injection
- configure the external `tag.js` URL
- issue a free site key with one button
- save the issued key automatically
- regenerate the current key when the admin token is configured
- disable the current key when the admin token is configured
- show a readable admin error when the WebMCP server is unavailable

The plugin does not bundle `tag.js`. Installed sites load the hosted tag from the configured URL. The default setting points at `https://webmcp-canary.nurevo.workers.dev/tag.js`; `npm run wp:demo` overrides it to the local Worker unless `WEBMCP_TAG_URL` is set.

## Site Key API

Public key issuance:

```bash
curl -X POST "http://127.0.0.1:8443/api/site-key" \
  -H "content-type: application/json" \
  -d '{"siteUrl":"https://example.com","email":"owner@example.com"}'
```

Response includes a free-plan `nrv_...` site key. Active duplicate keys for the same domain are rejected with `duplicate_site_host`.

Regenerate:

```bash
curl -X POST "http://127.0.0.1:8443/api/site-key/regenerate" \
  -H "content-type: application/json" \
  -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN" \
  -d '{"siteKey":"nrv_..."}'
```

Disable:

```bash
curl -X POST "http://127.0.0.1:8443/api/site-key/disable" \
  -H "content-type: application/json" \
  -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN" \
  -d '{"siteKey":"nrv_..."}'
```

List managed keys:

```bash
curl "http://127.0.0.1:8443/api/site-keys"
```

Set `WEBMCP_ADMIN_TOKEN` in production so management APIs require `x-webmcp-admin-token`:

```bash
npx wrangler@latest secret put WEBMCP_ADMIN_TOKEN
curl "https://webmcp-canary.nurevo.workers.dev/api/site-keys" \
  -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN"
```

Protected management APIs:

```text
GET  /api/insights
GET  /api/ab-results
GET  /api/traffic-health
GET  /api/site-keys
GET  /api/learned-rules
POST /api/site-key/regenerate
POST /api/site-key/plan
POST /api/site-key/disable
POST /api/repair-insights
POST /api/learning/run
```

### Turning Pro On

Pro is enabled per `site_key`. The Worker reads `site_keys.plan`; when the value is `pro`, the
dashboard unlocks the Pro state and the server can deliver automatically improved MCP guidance to
agents. This does not edit the customer's WordPress form or theme.

Manual admin toggle:

```bash
PUBLIC_ORIGIN="https://webmcp-canary.nurevo.workers.dev"
SITE_KEY="nrv_..."
curl -X POST "$PUBLIC_ORIGIN/api/site-key/plan" \
  -H "content-type: application/json" \
  -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN" \
  -d "{\"siteKey\":\"$SITE_KEY\",\"plan\":\"pro\"}"
```

Turn it back to free:

```bash
curl -X POST "$PUBLIC_ORIGIN/api/site-key/plan" \
  -H "content-type: application/json" \
  -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN" \
  -d "{\"siteKey\":\"$SITE_KEY\",\"plan\":\"free\"}"
```

Production billing should call the same plan update path from a Stripe webhook after
`checkout.session.completed` or `customer.subscription.updated`.

## Public APIs

Public APIs:

```text
/tag.js
/api/agent-authorization
/api/mcp-definition
/api/footprint
/api/site-insights
/api/site-key
```

Protected management APIs:

```text
/api/insights
/api/ab-results
/api/traffic-health
/api/learned-rules
/api/learning/run
/api/repair-insights
/api/site-key/regenerate
/api/site-key/plan
/api/site-key/disable
/api/site-keys
```

The implementation keeps:

- MCP injection and automatic tool updates
- high/basic quality delivery by site authorization
- AEO metadata
- A/B exposure/result tracking
- privacy filter for footprints
- WordPress admin dashboard
- locked benchmark and Pro-plan suggestion panels
- cross-site learned validation rules generated from privacy-safe footprints

## Multiple Forms and Exclusions

`tag.js` scans every `<form>` on the page. Each eligible form is registered independently, receives its own generated MCP tool, declarative attributes, autofill helpers, form hash, A/B exposure, and privacy-safe footprint stream. Tool names include the form identifier (`id`, `name`, or a stable page-order fallback such as `webmcp_form_2`) to avoid collisions on pages with multiple forms.

Forms are excluded before contacting the Worker when any of these rules match:

- Hidden form: the form and its controls are not visibly rendered.
- Login form: at least one visible password field is present.
- Too few fields: one or fewer visible non-hidden input/select/textarea controls.
- Search-only form: one or two visible controls where the form and fields are identifiable as search (`type="search"`, `role="search"`, `name="s"`/`q`, or search/検索 labels).
- WordPress admin or screen-reader response forms such as `#wpadminbar` and `.screen-reader-response`.

The current page-level debug object exposes `window.__webmcpDemo.forms` for eligible forms and `window.__webmcpDemo.excludedForms` with the exclusion reason. The local demo page contains three forms: contact, newsletter signup, and a search form. The contact and newsletter forms should register as separate tools; the search form should be excluded.

## Cross-Site Learning

The Worker runs a daily Scheduled Worker job (`17 18 * * *`, UTC) that analyzes D1 footprints and updates `learned_rules`.

Learning only creates rules when real data crosses the configured thresholds:

```text
WEBMCP_LEARNING_MIN_SUBMISSIONS=20
WEBMCP_LEARNING_MIN_FAILURES=3
WEBMCP_LEARNING_MIN_SUPPORT_RATE=0.12
WEBMCP_LEARNING_DISABLE_LIFT_THRESHOLD=-2
```

Rules are limited to safe known categories such as phone digits-only, 7-digit postal code, ISO date, email format, and required fields. Free-form error messages are sanitized and are not copied directly into executable rules.

Manual run:

```bash
curl -X POST "$PUBLIC_ORIGIN/api/learning/run" \
  -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN"
```

List current rules and recent learning runs:

```bash
curl "$PUBLIC_ORIGIN/api/learned-rules" \
  -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN"
```

Each rule includes source sample count, failure count, support rate, confidence, source site count, applied count, and pre/post success-rate effect. Rules with enough post-application samples and negative lift below the configured threshold are disabled automatically and logged in `learned_rule_disable_history`.

## Cloudflare Production Deploy

Production target:

```text
https://webmcp-canary.nurevo.workers.dev
```

Create D1 if needed:

```bash
npm run d1:create
```

Paste the returned `database_id` into `wrangler.jsonc` under `WEBMCP_DB.database_id`.

Create KV if needed:

```bash
npm run cf:kv:create
```

Paste the returned namespace `id` into `wrangler.jsonc` under `WEBMCP_KV.id`.

Set the admin token secret before exposing the management list:

```bash
npx wrangler@latest secret put WEBMCP_ADMIN_TOKEN
```

Apply production migrations:

```bash
npm run d1:migrate:remote
```

Deploy:

```bash
npm run cf:deploy
```

Verify production:

```bash
PUBLIC_ORIGIN="https://webmcp-canary.nurevo.workers.dev"
curl -I "$PUBLIC_ORIGIN/tag.js"
curl "$PUBLIC_ORIGIN/api/ab-results" -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN"
curl "$PUBLIC_ORIGIN/api/traffic-health" -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN"
curl -X POST "$PUBLIC_ORIGIN/api/site-key" \
  -H "content-type: application/json" \
  -d '{"siteUrl":"https://example.com","email":"owner@example.com"}'
```

Use the issued key for authorization checks:

```bash
SITE_KEY="nrv_..."
curl "$PUBLIC_ORIGIN/api/agent-authorization?site_key=$SITE_KEY"
curl "$PUBLIC_ORIGIN/api/site-insights?site_key=$SITE_KEY&host=localhost"
curl "$PUBLIC_ORIGIN/api/site-keys" -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN"
```

## Local WordPress Against Production

Run the local WordPress demo while pointing the plugin at production:

```bash
WEBMCP_TAG_URL="https://webmcp-canary.nurevo.workers.dev/tag.js" npm run wp:demo
```

If `http://localhost:8080` is already used, run it on another port and make the WordPress URL match
that port:

```bash
WEBMCP_WORDPRESS_PORT=8081 \
WORDPRESS_URL=http://localhost:8081 \
WEBMCP_TAG_URL="https://webmcp-canary.nurevo.workers.dev/tag.js" \
npm run wp:demo
```

Open `http://localhost:8081/wp-admin/` in that case. The setup script updates WordPress `home` and
`siteurl` on every run so the login screen does not redirect to an old port.

This skips local Worker startup for WebMCP and issues the demo key against production. You can also use **WebMCP > Settings** to issue or rotate the key against production. Visit the demo form page and confirm the rendered script tag includes:

```html
<script src="https://webmcp-canary.nurevo.workers.dev/tag.js" data-webmcp-site-key="nrv_..." async></script>
```

Open:

```text
http://localhost:8080/wp-admin/admin.php?page=webmcp-canary&webmcp_refresh=1
```

The dashboard should show either seeded/real metrics or a readable setup/connectivity message. It must not fatal if the Worker is unavailable.

Admin dashboard API behavior:

- WordPress derives the API origin from the configured `tag.js` URL and calls `/api/site-insights`.
- The WordPress HTTP timeout is 10 seconds.
- Successful site-insights responses are cached for 10 minutes.
- The last successful response is kept as a stale fallback. If the Worker temporarily times out or
  becomes unreachable, the dashboard shows the previous data with a warning instead of becoming
  unusable.
- If the URL is missing, DNS/HTTPS fails, or the site key is rejected, the admin notice names the
  likely cause and shows the checked API origin.

## Checks

Local syntax checks:

```bash
node --check public/tag.js
node --check worker/index.mjs
node --check scripts/seed-demo.mjs
```

Local D1 migration:

```bash
npm run d1:migrate:local
```

Smoke checks:

```bash
npm run test:smoke
npm run test:webmcp-headless
```

WordPress.org Plugin Check:

```bash
npm run wp:demo
docker compose run --rm wpcli wp plugin install plugin-check --activate --force
npm run wp:plugin-check
```

The `wp:plugin-check` script runs the official Plugin Check through WP-CLI with experimental checks and low-severity findings included:

```bash
docker compose run --rm wpcli wp plugin check webmcp-canary --include-experimental --include-low-severity-errors --include-low-severity-warnings
```

Expected result before submission: `Success: Checks complete. No errors found.` Re-run this after changing `wordpress-plugin/webmcp-canary/`, `wordpress-plugin/assets/`, or `wordpress-plugin/webmcp-canary/readme.txt`.

The MCP regression check requires `OPENAI_API_KEY`:

```bash
npm run test:mcp-regression
```

## Privacy

Footprints save form metadata, field selectors/keys, validity flags, sanitized error text, success/failure status, completed step, duration, form hash, host/path, and experiment metadata.

Footprints do not save input values, names, email addresses, phone numbers, postal codes, message bodies, `value`, `textContent`, `innerText`, `outerText`, or HTML content.
