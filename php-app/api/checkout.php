<?php

require_once __DIR__ . '/../inc/billing.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'method_not_allowed']);
        exit;
    }
    $email = trim((string) ($_POST['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['error' => 'valid_email_required']);
        exit;
    }
    $toolSlug = trim((string) ($_POST['tool_slug'] ?? '')) ?: null;
    $session = billing_create_checkout_session($email, $toolSlug);
    echo json_encode(['checkout_url' => $session['url'] ?? null, 'session_id' => $session['id'] ?? null]);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['error' => 'checkout_failed']);
}
