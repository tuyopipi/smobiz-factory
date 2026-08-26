<?php

function current_lang(): string
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    $requested = $_GET['lang'] ?? null;
    if (in_array($requested, ['en', 'ja'], true)) {
        $_SESSION['lang'] = $requested;
    }
    return $_SESSION['lang'] ?? 'en';
}

function translations(): array
{
    static $cache = [];
    $lang = current_lang();
    if (!isset($cache[$lang])) {
        $path = dirname(__DIR__) . '/lang/' . $lang . '.php';
        $cache[$lang] = is_file($path) ? require $path : require dirname(__DIR__) . '/lang/en.php';
    }
    return $cache[$lang];
}

function t(string $key): string
{
    $messages = translations();
    return $messages[$key] ?? $key;
}

function lang_url(string $lang): string
{
    $params = $_GET;
    $params['lang'] = $lang;
    $query = http_build_query($params);
    $path = strtok($_SERVER['REQUEST_URI'] ?? '/', '?') ?: '/';
    return $path . ($query ? '?' . $query : '');
}
