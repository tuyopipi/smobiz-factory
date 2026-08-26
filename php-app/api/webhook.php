<?php

require_once __DIR__ . '/../inc/billing.php';

$payload = file_get_contents('php://input') ?: '';
$signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$secret = config_value('stripe.webhook_secret');

if (!$secret || !stripe_verify_webhook($payload, $signature, $secret)) {
    http_response_code(400);
    echo 'invalid signature';
    exit;
}

$event = json_decode($payload, true);
if (!is_array($event)) {
    http_response_code(400);
    echo 'invalid payload';
    exit;
}

if (($event['type'] ?? '') === 'checkout.session.completed') {
    billing_handle_checkout_completed($event['data']['object'] ?? []);
}

http_response_code(200);
echo 'ok';
