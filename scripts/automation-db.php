<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

require_once dirname(__DIR__) . '/php-app/inc/db.php';

$action = $argv[1] ?? '';

try {
    if ($action === 'ensure-schema') {
        db_install_schema();
        echo json_encode(['ok' => true], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        exit(0);
    }

    if ($action === 'list-tools') {
        $rows = db()->query('SELECT slug, name, target_keyword FROM tools WHERE is_active = TRUE ORDER BY created_at DESC')->fetchAll();
        echo json_encode(['ok' => true, 'tools' => $rows], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        exit(0);
    }

    if ($action === 'today-status') {
        $stmt = db()->prepare("SELECT * FROM automation_runs WHERE run_date = CURRENT_DATE AND status = 'published' ORDER BY created_at DESC LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();
        echo json_encode(['ok' => true, 'published_today' => (bool) $row, 'run' => $row ?: null], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        exit(0);
    }

    if ($action === 'recent-runs') {
        $limit = max(1, min(50, (int) ($argv[2] ?? 10)));
        $stmt = db()->prepare('SELECT id, run_date, status, slug, name, target_keyword, gap_score, reason, created_at FROM automation_runs ORDER BY created_at DESC LIMIT :limit');
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        echo json_encode(['ok' => true, 'runs' => $stmt->fetchAll()], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        exit(0);
    }

    if ($action === 'upsert-tool') {
        $payload = read_json_arg($argv[2] ?? null);
        $tool = $payload['tool'];
        $stmt = db()->prepare(
            'INSERT INTO tools
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
             RETURNING id, slug, name, target_keyword'
        );
        $stmt->execute([
            'slug' => $tool['slug'],
            'name' => $tool['name'],
            'description' => $tool['description'],
            'category' => $tool['category'],
            'target_keyword' => $tool['target_keyword'],
            'logo_color' => $tool['logo_color'],
            'pricing_model' => $tool['pricing_model'] ?? 'ads',
            'price_amount_cents' => $tool['price_amount_cents'] ?? null,
            'price_currency' => $tool['price_currency'] ?? 'usd',
            'price_interval' => $tool['price_interval'] ?? 'one_time',
            'price_id' => $tool['price_id'] ?? null,
            'stripe_price_id' => $tool['stripe_price_id'] ?? null,
            'stripe_product_id' => $tool['stripe_product_id'] ?? null,
        ]);
        echo json_encode(['ok' => true, 'tool' => $stmt->fetch()], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        exit(0);
    }

    if ($action === 'log-run') {
        $payload = read_json_arg($argv[2] ?? null);
        $stmt = db()->prepare(
            'INSERT INTO automation_runs
             (run_date, status, slug, name, target_keyword, gap_score, reason, details, created_at)
             VALUES (CURRENT_DATE, :status, :slug, :name, :target_keyword, :gap_score, :reason, :details::jsonb, NOW())
             RETURNING id, run_date, status, slug, name, target_keyword, gap_score, reason'
        );
        $stmt->execute([
            'status' => $payload['status'],
            'slug' => $payload['slug'] ?? null,
            'name' => $payload['name'] ?? null,
            'target_keyword' => $payload['target_keyword'] ?? null,
            'gap_score' => $payload['gap_score'] ?? null,
            'reason' => $payload['reason'] ?? null,
            'details' => json_encode($payload['details'] ?? [], JSON_UNESCAPED_SLASHES),
        ]);
        echo json_encode(['ok' => true, 'run' => $stmt->fetch()], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        exit(0);
    }

    fwrite(STDERR, "Unknown action: {$action}\n");
    exit(2);
} catch (Throwable $error) {
    fwrite(STDERR, json_encode([
        'ok' => false,
        'error' => ['type' => get_class($error), 'message' => $error->getMessage()],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
    exit(1);
}

function read_json_arg(?string $path): array
{
    if (!$path || !is_file($path)) {
        throw new RuntimeException('JSON file argument is required.');
    }
    $json = json_decode(file_get_contents($path), true);
    if (!is_array($json)) {
        throw new RuntimeException('Invalid JSON file.');
    }
    return $json;
}
