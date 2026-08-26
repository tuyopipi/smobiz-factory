<?php

require_once __DIR__ . '/db.php';

function auth_request_magic_link(string $email): string
{
    if (config_value('supabase.url') && config_value('supabase.anon_key')) {
        return auth_request_supabase_magic_link($email);
    }

    $userId = db_upsert_user($email);
    $token = bin2hex(random_bytes(32));
    $hash = password_hash($token, PASSWORD_DEFAULT);
    $ttl = (int) config_value('app.magic_link_ttl_minutes', 20);
    $expiresAt = gmdate('Y-m-d H:i:s', time() + $ttl * 60);

    db()->prepare(
        'UPDATE "users" SET magic_token_hash = :hash, magic_token_expires_at = :expires_at, updated_at = NOW() WHERE id = :id'
    )->execute([
        'hash' => $hash,
        'expires_at' => $expiresAt,
        'id' => $userId,
    ]);

    $baseUrl = rtrim(config_value('app.base_url'), '/');
    $link = $baseUrl . '/auth/callback.php?email=' . rawurlencode(strtolower(trim($email))) . '&token=' . rawurlencode($token);
    auth_send_magic_link($email, $link);
    return $link;
}

function auth_request_supabase_magic_link(string $email): string
{
    $baseUrl = rtrim(config_value('app.base_url'), '/');
    $redirectTo = $baseUrl . '/auth/callback.php';
    $response = auth_supabase_request('/auth/v1/otp', [
        'email' => strtolower(trim($email)),
        'create_user' => true,
        'options' => ['email_redirect_to' => $redirectTo],
    ]);
    db_upsert_user($email);
    return $response['action_link'] ?? $redirectTo;
}

function auth_supabase_request(string $path, array $payload): array
{
    $url = rtrim(config_value('supabase.url'), '/') . $path;
    $key = config_value('supabase.anon_key');
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'apikey: ' . $key,
            'Authorization: Bearer ' . $key,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);
    $raw = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    if ($raw === false) {
        throw new RuntimeException('Supabase Auth request failed: ' . curl_error($curl));
    }
    curl_close($curl);
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('Supabase Auth request failed with HTTP ' . $status . ': ' . $raw);
    }
    $json = json_decode($raw, true);
    return is_array($json) ? $json : [];
}

function auth_send_magic_link(string $email, string $link): void
{
    $subject = 'Your sign-in link';
    $message = "Use this link to sign in:\n\n" . $link . "\n\nThe link expires soon.";
    $headers = 'From: ' . config_value('app.support_email', 'support@example.com');
    mail($email, $subject, $message, $headers);
}

function auth_consume_magic_link(string $email, string $token): bool
{
    $user = db_find_user_by_email($email);
    if (!$user || empty($user['magic_token_hash']) || empty($user['magic_token_expires_at'])) {
        return false;
    }
    if (strtotime($user['magic_token_expires_at']) < time()) {
        return false;
    }
    if (!password_verify($token, $user['magic_token_hash'])) {
        return false;
    }
    db()->prepare(
        'UPDATE "users" SET magic_token_hash = NULL, magic_token_expires_at = NULL, last_login_at = NOW(), updated_at = NOW() WHERE id = :id'
    )->execute(['id' => $user['id']]);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['email'] = $user['email'];
    return true;
}

function auth_current_user_id(): ?int
{
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}
