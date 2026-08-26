<?php

require_once __DIR__ . '/db.php';

function billing_user_has_access(int $userId, ?string $toolSlug = null): bool
{
    $sql = 'SELECT COUNT(*) FROM subscriptions WHERE user_id = :user_id AND status IN (\'active\', \'trialing\')';
    $params = ['user_id' => $userId];
    if ($toolSlug !== null) {
        $sql .= ' AND (tool_slug = :tool_slug OR tool_slug IS NULL)';
        $params['tool_slug'] = $toolSlug;
    }
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return (int) $stmt->fetchColumn() > 0;
}

function billing_find_tool(string $toolSlug): ?array
{
    $stmt = db()->prepare('SELECT * FROM tools WHERE slug = :slug AND is_active = 1 LIMIT 1');
    $stmt->execute(['slug' => $toolSlug]);
    $tool = $stmt->fetch();
    return $tool ?: null;
}

function billing_price_for_tool(?string $toolSlug): array
{
    if ($toolSlug !== null && $toolSlug !== '') {
        $tool = billing_find_tool($toolSlug);
        if (!$tool) {
            throw new RuntimeException('Unknown tool slug.');
        }
        $toolPriceId = $tool['price_id'] ?? $tool['stripe_price_id'] ?? null;
        if (!empty($toolPriceId)) {
            return [
                'price_id' => $toolPriceId,
                'mode' => $tool['price_interval'] === 'one_time' ? 'payment' : 'subscription',
                'tool' => $tool,
            ];
        }
    }

    $fallback = config_value('stripe.default_price_id');
    if (!$fallback) {
        throw new RuntimeException('Missing Stripe price id.');
    }
    return ['price_id' => $fallback, 'mode' => 'subscription', 'tool' => null];
}

function billing_create_tool_price(string $toolSlug, int $amountCents, string $currency = 'usd', string $interval = 'month'): array
{
    $tool = billing_find_tool($toolSlug);
    if (!$tool) {
        throw new RuntimeException('Unknown tool slug.');
    }
    if ($amountCents <= 0) {
        throw new RuntimeException('Tool price must be positive.');
    }
    if (!in_array($interval, ['one_time', 'month', 'year'], true)) {
        throw new RuntimeException('Invalid price interval.');
    }

    $product = stripe_request('POST', '/v1/products', [
        'name' => $tool['name'],
        'description' => $tool['description'],
        'metadata[tool_slug]' => $toolSlug,
    ]);
    $priceFields = [
        'product' => $product['id'],
        'unit_amount' => (string) $amountCents,
        'currency' => strtolower($currency),
        'metadata[tool_slug]' => $toolSlug,
    ];
    if ($interval !== 'one_time') {
        $priceFields['recurring[interval]'] = $interval;
    }
    $price = stripe_request('POST', '/v1/prices', $priceFields);

    db()->prepare(
        'UPDATE tools
         SET stripe_product_id = :product_id, price_id = :price_id, stripe_price_id = :price_id, price_amount_cents = :amount,
             price_currency = :currency, price_interval = :interval, updated_at = NOW()
         WHERE slug = :slug'
    )->execute([
        'product_id' => $product['id'] ?? null,
        'price_id' => $price['id'] ?? null,
        'amount' => $amountCents,
        'currency' => strtolower($currency),
        'interval' => $interval,
        'slug' => $toolSlug,
    ]);

    return ['product' => $product, 'price' => $price];
}

function billing_create_checkout_session(string $email, ?string $toolSlug = null): array
{
    $pricing = billing_price_for_tool($toolSlug);

    $userId = db_upsert_user($email);
    $payload = [
        'mode' => $pricing['mode'],
        'customer_email' => strtolower(trim($email)),
        'line_items[0][price]' => $pricing['price_id'],
        'line_items[0][quantity]' => '1',
        'success_url' => config_value('stripe.success_url', public_url('?checkout=success')),
        'cancel_url' => config_value('stripe.cancel_url', public_url('?checkout=cancel')),
        'metadata[user_id]' => (string) $userId,
        'metadata[tool_slug]' => (string) ($toolSlug ?? ''),
    ];

    $session = stripe_request('POST', '/v1/checkout/sessions', $payload);
    db()->prepare(
        'INSERT INTO subscriptions (user_id, tool_slug, stripe_checkout_session_id, status, created_at, updated_at)
         VALUES (:user_id, :tool_slug, :session_id, \'checkout_started\', NOW(), NOW())'
    )->execute([
        'user_id' => $userId,
        'tool_slug' => $toolSlug,
        'session_id' => $session['id'] ?? null,
    ]);

    return $session;
}

function billing_handle_checkout_completed(array $session): void
{
    $email = $session['customer_details']['email'] ?? $session['customer_email'] ?? null;
    if (!$email) {
        return;
    }
    $userId = db_upsert_user($email);
    $metadata = $session['metadata'] ?? [];
    $toolSlug = ($metadata['tool_slug'] ?? '') !== '' ? $metadata['tool_slug'] : null;
    db()->prepare(
        'INSERT INTO subscriptions
         (user_id, tool_slug, stripe_customer_id, stripe_subscription_id, stripe_checkout_session_id, status, created_at, updated_at)
         VALUES (:user_id, :tool_slug, :customer_id, :subscription_id, :session_id, \'active\', NOW(), NOW())
         ON CONFLICT (stripe_checkout_session_id) DO UPDATE SET status = \'active\', updated_at = NOW()'
    )->execute([
        'user_id' => $userId,
        'tool_slug' => $toolSlug,
        'customer_id' => $session['customer'] ?? null,
        'subscription_id' => $session['subscription'] ?? null,
        'session_id' => $session['id'] ?? null,
    ]);
}

function stripe_request(string $method, string $path, array $fields): array
{
    $secret = config_value('stripe.secret_key');
    if (!$secret) {
        throw new RuntimeException('Missing Stripe secret key.');
    }

    $curl = curl_init('https://api.stripe.com' . $path);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => $secret . ':',
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_POSTFIELDS => http_build_query($fields),
    ]);
    $raw = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    if ($raw === false) {
        throw new RuntimeException('Stripe request failed: ' . curl_error($curl));
    }
    curl_close($curl);
    $json = json_decode($raw, true);
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('Stripe request failed with HTTP ' . $status . ': ' . $raw);
    }
    return is_array($json) ? $json : [];
}

function stripe_verify_webhook(string $payload, string $signatureHeader, string $secret, int $tolerance = 300): bool
{
    $parts = [];
    foreach (explode(',', $signatureHeader) as $pair) {
        [$key, $value] = array_pad(explode('=', trim($pair), 2), 2, '');
        $parts[$key][] = $value;
    }
    $timestamp = isset($parts['t'][0]) ? (int) $parts['t'][0] : 0;
    if ($timestamp <= 0 || abs(time() - $timestamp) > $tolerance) {
        return false;
    }
    $signedPayload = $timestamp . '.' . $payload;
    $expected = hash_hmac('sha256', $signedPayload, $secret);
    foreach ($parts['v1'] ?? [] as $signature) {
        if (hash_equals($expected, $signature)) {
            return true;
        }
    }
    return false;
}
