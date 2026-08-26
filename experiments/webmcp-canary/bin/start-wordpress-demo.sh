#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

WORDPRESS_URL="${WORDPRESS_URL:-http://localhost:8080}"
WORDPRESS_TITLE="${WORDPRESS_TITLE:-WebMCP Canary WP Demo}"
WORDPRESS_ADMIN_USER="${WORDPRESS_ADMIN_USER:-admin}"
WORDPRESS_ADMIN_PASSWORD="${WORDPRESS_ADMIN_PASSWORD:-password}"
WORDPRESS_ADMIN_EMAIL="${WORDPRESS_ADMIN_EMAIL:-admin@example.com}"
WEBMCP_TAG_URL="${WEBMCP_TAG_URL:-http://localhost:8443/tag.js}"
WEBMCP_SITE_EMAIL="${WEBMCP_SITE_EMAIL:-admin@example.com}"
WEBMCP_ADMIN_TOKEN="${WEBMCP_ADMIN_TOKEN:-local-wordpress-demo-admin-token}"
CF7_FALLBACK_VERSION="${CF7_FALLBACK_VERSION:-5.9.8}"
WEBMCP_API_BASE="${WEBMCP_API_BASE:-$(node -e '
const raw = process.argv[1];
try {
  const url = new URL(raw);
  console.log(url.origin);
} catch {
  process.exit(1);
}
' "$WEBMCP_TAG_URL")}"

echo "Removing obsolete Docker services if they exist..."
docker compose down --remove-orphans >/dev/null 2>&1 || true

case "$WEBMCP_API_BASE" in
  http://localhost:*|http://127.0.0.1:*)
    echo "Applying local D1 migrations..."
    npm run d1:migrate:local

    WORKER_ALREADY_READY=0
    if curl -fsS "$WEBMCP_API_BASE/api/site-keys" -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN" >/dev/null 2>&1; then
      WORKER_ALREADY_READY=1
      echo "Local WebMCP Worker is already responding on $WEBMCP_API_BASE."
    fi

    if [ "$WORKER_ALREADY_READY" -eq 0 ] && [ -f .webmcp-dev.pid ]; then
      OLD_PID="$(cat .webmcp-dev.pid)"
      if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" >/dev/null 2>&1; then
        echo "Local WebMCP wrangler dev is already running as process $OLD_PID."
        WORKER_ALREADY_READY=1
      else
        rm -f .webmcp-dev.pid
      fi
    fi

    if [ "$WORKER_ALREADY_READY" -eq 0 ]; then
      echo "Starting local WebMCP Worker with wrangler dev..."
      nohup npx wrangler@latest dev --ip 127.0.0.1 --port 8443 --local --var "WEBMCP_ADMIN_TOKEN:$WEBMCP_ADMIN_TOKEN" --show-interactive-dev-session=false > .webmcp-dev.log 2>&1 < /dev/null &
      echo "$!" > .webmcp-dev.pid
    fi

    echo "Waiting for WebMCP Worker to be ready..."
    attempt=0
    until curl -fsS "$WEBMCP_API_BASE/api/site-keys" -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN" >/dev/null 2>&1; do
      attempt=$((attempt + 1))
      if [ -f .webmcp-dev.pid ]; then
        DEV_PID="$(cat .webmcp-dev.pid)"
        if [ -n "$DEV_PID" ] && ! kill -0 "$DEV_PID" >/dev/null 2>&1; then
          echo "WebMCP Worker process exited before becoming ready. Last log lines:" >&2
          tail -n 40 .webmcp-dev.log >&2 || true
          exit 1
        fi
      fi
      if [ "$attempt" -gt 60 ]; then
        echo "WebMCP Worker did not become ready in time. Last log lines:" >&2
        tail -n 40 .webmcp-dev.log >&2 || true
        exit 1
      fi
      sleep 1
    done
    ;;
  *)
    echo "Using remote WebMCP API at $WEBMCP_API_BASE."
    if ! curl -fsS "$WEBMCP_API_BASE/tag.js" >/dev/null 2>&1; then
      echo "Remote WebMCP tag is not reachable at $WEBMCP_API_BASE/tag.js." >&2
      exit 1
    fi
    ;;
esac

echo "Starting WordPress and MySQL..."
docker compose up -d --remove-orphans db wordpress

echo "Waiting for WordPress files to be ready..."
attempt=0
until docker compose run --rm wpcli wp core version >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -gt 60 ]; then
    echo "WordPress did not become ready in time." >&2
    exit 1
  fi
  sleep 2
done

echo "Ensuring writable WordPress upload directories..."
docker compose exec -u root wordpress sh -c '
  mkdir -p /var/www/html/wp-content/uploads /var/www/html/wp-content/upgrade /var/www/html/wp-content/cache /var/www/html/wp-content/plugins &&
  find /var/www/html -path /var/www/html/wp-content/plugins/webmcp-canary -prune -o -exec chown 82:82 {} + &&
  find /var/www/html -path /var/www/html/wp-content/plugins/webmcp-canary -prune -o -exec chmod a+rwX {} +
'

echo "Updating WordPress core files in the shared volume if needed..."
docker compose run --rm wpcli wp core update
docker compose run --rm wpcli wp core update-db
echo "WordPress core version: $(docker compose run --rm wpcli wp core version)"

if docker compose run --rm wpcli wp core is-installed >/dev/null 2>&1; then
  echo "WordPress is already installed."
else
  echo "Installing WordPress..."
  docker compose run --rm wpcli wp core install \
    --url="$WORDPRESS_URL" \
    --title="$WORDPRESS_TITLE" \
    --admin_user="$WORDPRESS_ADMIN_USER" \
    --admin_password="$WORDPRESS_ADMIN_PASSWORD" \
    --admin_email="$WORDPRESS_ADMIN_EMAIL" \
    --skip-email
fi

echo "Ensuring WordPress URL matches this demo run..."
docker compose run --rm wpcli wp option update home "$WORDPRESS_URL"
docker compose run --rm wpcli wp option update siteurl "$WORDPRESS_URL"

echo "Installing and activating Contact Form 7..."
if docker compose run --rm wpcli wp plugin install contact-form-7 --activate --force; then
  echo "Contact Form 7 latest installed."
else
  echo "Contact Form 7 latest is not compatible with this WordPress image; trying version $CF7_FALLBACK_VERSION..."
  docker compose run --rm wpcli wp plugin install contact-form-7 --version="$CF7_FALLBACK_VERSION" --activate --force
fi

echo "Re-checking upload directory permissions after plugin install..."
docker compose exec -u root wordpress sh -c '
  mkdir -p /var/www/html/wp-content/uploads /var/www/html/wp-content/upgrade /var/www/html/wp-content/cache &&
  chown 82:82 /var/www/html/wp-content /var/www/html/wp-content/plugins /var/www/html/wp-content/uploads /var/www/html/wp-content/upgrade /var/www/html/wp-content/cache &&
  if [ -d /var/www/html/wp-content/plugins/contact-form-7 ]; then chown -R 82:82 /var/www/html/wp-content/plugins/contact-form-7; fi &&
  chmod a+rwX /var/www/html/wp-content /var/www/html/wp-content/plugins &&
  chmod -R a+rwX /var/www/html/wp-content/uploads /var/www/html/wp-content/upgrade /var/www/html/wp-content/cache &&
  if [ -d /var/www/html/wp-content/plugins/contact-form-7 ]; then chmod -R a+rwX /var/www/html/wp-content/plugins/contact-form-7; fi
'

echo "Activating WebMCP Canary plugin..."
docker compose run --rm wpcli wp plugin activate webmcp-canary

echo "Issuing demo site key through the WebMCP API..."
SITE_KEY_RESPONSE="$(curl -sS -X POST "$WEBMCP_API_BASE/api/site-key" \
  -H "content-type: application/json" \
  --data "{\"siteUrl\":\"$WORDPRESS_URL\",\"email\":\"$WEBMCP_SITE_EMAIL\"}" || true)"
WEBMCP_SITE_KEY="$(node -e '
const body = process.argv[1] || "{}";
const parsed = JSON.parse(body);
if (parsed.ok && parsed.siteKey) {
  console.log(parsed.siteKey);
  process.exit(0);
}
console.error(JSON.stringify(parsed));
process.exit(1);
' "$SITE_KEY_RESPONSE" 2>/dev/null || true)"
if [ -z "$WEBMCP_SITE_KEY" ]; then
  SITE_KEYS_RESPONSE="$(curl -fsS "$WEBMCP_API_BASE/api/site-keys" -H "x-webmcp-admin-token: $WEBMCP_ADMIN_TOKEN")"
  WEBMCP_SITE_KEY="$(node -e '
const body = JSON.parse(process.argv[1] || "{}");
const expected = new URL(process.argv[2]).host;
const found = (body.siteKeys || []).find((item) => item.status === "active" && item.siteHost === expected);
if (!found) process.exit(1);
console.log(found.siteKey);
' "$SITE_KEYS_RESPONSE" "$WORDPRESS_URL")"
fi

echo "Configuring WebMCP Canary plugin..."
docker compose run --rm wpcli wp option update webmcp_canary_settings \
  "{\"enabled\":\"1\",\"tag_url\":\"$WEBMCP_TAG_URL\",\"site_key\":\"$WEBMCP_SITE_KEY\",\"site_email\":\"$WEBMCP_SITE_EMAIL\",\"admin_token\":\"$WEBMCP_ADMIN_TOKEN\"}" \
  --format=json

echo "Creating Contact Form 7 demo form if needed..."
FORM_ID="$(docker compose run --rm wpcli wp post list --post_type=wpcf7_contact_form --name=webmcp-demo-form --field=ID 2>/dev/null | tr -d '\r')"
if [ -z "$FORM_ID" ]; then
  FORM_ID="$(docker compose run --rm wpcli wp post create \
    --post_type=wpcf7_contact_form \
    --post_status=publish \
    --post_title='WebMCP Demo Form' \
    --post_name=webmcp-demo-form \
    --porcelain)"
  docker compose run --rm wpcli wp post meta update "$FORM_ID" _form '<label> お名前
    [text* your-name autocomplete:name] </label>

<label> メールアドレス
    [email* your-email autocomplete:email] </label>

<label> 電話番号
    [tel* your-tel placeholder "09012345678"] </label>

<label> お問い合わせ内容
    [textarea your-message] </label>

[submit "送信"]'
  docker compose run --rm wpcli wp post meta update "$FORM_ID" _mail '{"active":false}'
fi

echo "Creating demo page if needed..."
PAGE_ID="$(docker compose run --rm wpcli wp post list --post_type=page --name=webmcp-demo --field=ID 2>/dev/null | tr -d '\r')"
if [ -z "$PAGE_ID" ]; then
  docker compose run --rm wpcli wp post create \
    --post_type=page \
    --post_status=publish \
    --post_title='WebMCP Demo' \
    --post_name=webmcp-demo \
    --post_content="[contact-form-7 id=\"$FORM_ID\" title=\"WebMCP Demo Form\"]" \
    --porcelain >/dev/null
fi

cat <<EOF

Ready.

WordPress site:      $WORDPRESS_URL
Admin login:         $WORDPRESS_URL/wp-admin/
Admin user:          $WORDPRESS_ADMIN_USER
Admin password:      $WORDPRESS_ADMIN_PASSWORD
Demo form page:      $WORDPRESS_URL/webmcp-demo/
WebMCP tag URL:      $WEBMCP_TAG_URL
WebMCP site key:     $WEBMCP_SITE_KEY
WebMCP API results:  $WEBMCP_API_BASE/api/ab-results
WebMCP dev log:      $(pwd)/.webmcp-dev.log

EOF
