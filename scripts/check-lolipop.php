<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

$root = dirname(__DIR__);
$appRoot = $root . '/php-app';
require_once $appRoot . '/inc/db.php';

$result = [
    'postgres' => ['ok' => false],
    'schema' => ['ok' => false],
    'ftp' => ['ok' => false],
];

try {
    $pdo = db();
    $database = $pdo->query('SELECT current_database()')->fetchColumn();
    $version = $pdo->query('SELECT VERSION()')->fetchColumn();
    $result['postgres'] = [
        'ok' => true,
        'database' => $database,
        'version' => $version,
    ];

    db_install_schema($pdo);
    $tables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")->fetchAll(PDO::FETCH_COLUMN);
    $required = ['tools', 'users', 'subscriptions'];
    $missing = array_values(array_diff($required, $tables));
    $result['schema'] = [
        'ok' => count($missing) === 0,
        'created_or_existing' => array_values(array_intersect($required, $tables)),
        'missing' => $missing,
    ];
} catch (Throwable $error) {
    $result['postgres']['error'] = [
        'type' => get_class($error),
        'message' => sanitize_error($error->getMessage()),
    ];
    $result['schema']['error'] = 'skipped because PostgreSQL connection or schema execution failed';
}

try {
    $ftp = config_value('ftp');
    $host = (string) ($ftp['host'] ?? '');
    $port = (int) ($ftp['port'] ?? 21);
    $timeout = 30;
    $connection = !empty($ftp['use_ssl']) ? ftp_ssl_connect($host, $port, $timeout) : ftp_connect($host, $port, $timeout);
    if (!$connection) {
        throw new RuntimeException('FTP connection failed before login.');
    }
    if (!ftp_login($connection, (string) ($ftp['user'] ?? ''), (string) ($ftp['password'] ?? ''))) {
        throw new RuntimeException('FTP login failed.');
    }
    ftp_pasv($connection, (bool) ($ftp['passive'] ?? true));
    $baseDir = (string) ($ftp['ftp_base_dir'] ?? $ftp['remote_root'] ?? '/');
    if (!ftp_chdir($connection, $baseDir)) {
        throw new RuntimeException('FTP base directory is not accessible: ' . $baseDir);
    }
    $result['ftp'] = [
        'ok' => true,
        'base_dir' => $baseDir,
        'pwd' => ftp_pwd($connection),
    ];
    ftp_close($connection);
} catch (Throwable $error) {
    $result['ftp']['error'] = [
        'type' => get_class($error),
        'message' => sanitize_error($error->getMessage()),
    ];
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
exit(($result['postgres']['ok'] ?? false) && ($result['schema']['ok'] ?? false) && ($result['ftp']['ok'] ?? false) ? 0 : 1);

function sanitize_error(string $message): string
{
    return preg_replace('/password=([^;\s]+)/i', 'password=***', $message) ?? $message;
}
