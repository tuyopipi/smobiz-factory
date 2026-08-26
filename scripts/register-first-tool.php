<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

require_once dirname(__DIR__) . '/php-app/inc/db.php';
require_once dirname(__DIR__) . '/php-app/inc/logo.php';

$tool = [
    'slug' => 'csv-to-json-converter',
    'name' => 'CSV to JSON Converter',
    'description' => 'Convert pasted CSV into formatted JSON, infer basic field types, and copy export-ready output.',
    'category' => 'data',
    'target_keyword' => 'csv to json converter',
    'logo_color' => logo_color_for_category('data'),
    'pricing_model' => 'ads',
    'price_amount_cents' => null,
    'price_currency' => 'usd',
    'price_interval' => 'one_time',
    'price_id' => null,
    'stripe_price_id' => null,
    'stripe_product_id' => null,
];

$sql = 'INSERT INTO tools
  (slug, name, description, category, target_keyword, logo_color, pricing_model, price_amount_cents, price_currency, price_interval, price_id, stripe_price_id, stripe_product_id, is_active, created_at, updated_at)
  VALUES
  (:slug, :name, :description, :category, :target_keyword, :logo_color, :pricing_model, :price_amount_cents, :price_currency, :price_interval, :price_id, :stripe_price_id, :stripe_product_id, TRUE, NOW(), NOW())
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    target_keyword = EXCLUDED.target_keyword,
    logo_color = EXCLUDED.logo_color,
    pricing_model = EXCLUDED.pricing_model,
    price_amount_cents = EXCLUDED.price_amount_cents,
    price_currency = EXCLUDED.price_currency,
    price_interval = EXCLUDED.price_interval,
    price_id = EXCLUDED.price_id,
    stripe_price_id = EXCLUDED.stripe_price_id,
    stripe_product_id = EXCLUDED.stripe_product_id,
    is_active = TRUE,
    updated_at = NOW()
  RETURNING id, slug, name, target_keyword, pricing_model';

$stmt = db()->prepare($sql);
$stmt->execute($tool);
$saved = $stmt->fetch();
echo json_encode(['ok' => true, 'tool' => $saved], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
