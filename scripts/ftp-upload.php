<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

$root = dirname(__DIR__) . '/php-app';
$configPath = $root . '/config.php';
if (!is_file($configPath)) {
    fwrite(STDERR, "Missing php-app/config.php. Copy config.sample.php and fill FTP settings.\n");
    exit(1);
}

$config = require $configPath;
$ftp = $config['ftp'] ?? [];
$dryRun = in_array('--dry-run', $argv, true);
$includeConfig = in_array('--include-config', $argv, true);

$connection = null;
if (!$dryRun) {
    $host = $ftp['host'] ?? '';
    $port = (int) ($ftp['port'] ?? 21);
    $timeout = 30;
    $connection = !empty($ftp['use_ssl']) ? ftp_ssl_connect($host, $port, $timeout) : ftp_connect($host, $port, $timeout);
    if (!$connection || !ftp_login($connection, $ftp['user'] ?? '', $ftp['password'] ?? '')) {
        fwrite(STDERR, "FTP login failed.\n");
        exit(1);
    }
    ftp_pasv($connection, (bool) ($ftp['passive'] ?? true));
}

$remoteRoot = rtrim((string) ($ftp['ftp_base_dir'] ?? $ftp['remote_root'] ?? '/'), '/');
$files = uploadable_files($root);
foreach ($files as $local) {
    $relative = ltrim(substr($local, strlen($root)), DIRECTORY_SEPARATOR);
    if ($relative === 'config.sample.php' || ($relative === 'config.php' && !$includeConfig)) {
        continue;
    }
    $remote = $remoteRoot . '/' . str_replace(DIRECTORY_SEPARATOR, '/', $relative);
    if ($dryRun) {
        echo "DRY RUN upload {$relative} -> {$remote}\n";
        continue;
    }
    ftp_mkdirs($connection, dirname($remote));
    if (!ftp_put($connection, $remote, $local, FTP_BINARY)) {
        fwrite(STDERR, "FTP upload failed: {$relative}\n");
        exit(1);
    }
    echo "uploaded {$relative}\n";
}

if ($connection) {
    ftp_close($connection);
}

function uploadable_files(string $root): array
{
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
    );
    $files = [];
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $files[] = $file->getPathname();
        }
    }
    sort($files);
    return $files;
}

function ftp_mkdirs($connection, string $path): void
{
    $parts = array_filter(explode('/', str_replace('\\', '/', $path)));
    $current = str_starts_with($path, '/') ? '/' : '';
    foreach ($parts as $part) {
        $current = rtrim($current, '/') . '/' . $part;
        @ftp_mkdir($connection, $current);
    }
}
