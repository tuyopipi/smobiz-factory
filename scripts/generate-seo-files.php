<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

require_once dirname(__DIR__) . '/php-app/inc/db.php';

$root = dirname(__DIR__) . '/php-app';
$upload = in_array('--upload', $argv, true);

try {
    $baseUrl = public_base_url();
    $tools = sitemap_tools();
    $sitemapPath = $root . '/sitemap.xml';
    $robotsPath = $root . '/robots.txt';

    file_put_contents($sitemapPath, build_sitemap($baseUrl, $tools));
    file_put_contents($robotsPath, build_robots($baseUrl));

    $uploaded = [];
    if ($upload) {
        $uploaded = upload_seo_files([$sitemapPath, $robotsPath]);
    }

    echo json_encode([
        'ok' => true,
        'sitemap' => $sitemapPath,
        'robots' => $robotsPath,
        'tool_count' => count($tools),
        'uploaded' => $uploaded,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(0);
} catch (Throwable $error) {
    fwrite(STDERR, json_encode([
        'ok' => false,
        'error' => ['type' => get_class($error), 'message' => $error->getMessage()],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
    exit(1);
}

function sitemap_tools(): array
{
    $stmt = db()->query(
        "SELECT slug, COALESCE(updated_at, created_at, NOW()) AS lastmod
         FROM tools
         WHERE is_active = TRUE
         ORDER BY slug ASC"
    );
    return $stmt->fetchAll();
}

function build_sitemap(string $baseUrl, array $tools): string
{
    $baseUrl = rtrim($baseUrl, '/') . '/';
    $lastmod = latest_lastmod($tools);
    $urls = [
        sitemap_url($baseUrl, $lastmod, 'daily', '1.0'),
    ];

    foreach ($tools as $tool) {
        $urls[] = sitemap_url(
            $baseUrl . 'tools/' . rawurlencode((string) $tool['slug']) . '/',
            format_lastmod($tool['lastmod']),
            'weekly',
            '0.8'
        );
    }

    return '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
        . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n"
        . implode('', $urls)
        . '</urlset>' . "\n";
}

function sitemap_url(string $loc, string $lastmod, string $changefreq, string $priority): string
{
    return "  <url>\n"
        . '    <loc>' . xml_escape($loc) . "</loc>\n"
        . '    <lastmod>' . xml_escape($lastmod) . "</lastmod>\n"
        . '    <changefreq>' . xml_escape($changefreq) . "</changefreq>\n"
        . '    <priority>' . xml_escape($priority) . "</priority>\n"
        . "  </url>\n";
}

function latest_lastmod(array $tools): string
{
    $latest = null;
    foreach ($tools as $tool) {
        $date = new DateTimeImmutable((string) $tool['lastmod']);
        if ($latest === null || $date > $latest) {
            $latest = $date;
        }
    }
    return $latest ? $latest->format('Y-m-d') : gmdate('Y-m-d');
}

function format_lastmod(string $value): string
{
    return (new DateTimeImmutable($value))->format('Y-m-d');
}

function build_robots(string $baseUrl): string
{
    $baseUrl = rtrim($baseUrl, '/') . '/';
    return "User-agent: *\n"
        . "Allow: /\n"
        . "\n"
        . "Sitemap: {$baseUrl}sitemap.xml\n";
}

function upload_seo_files(array $files): array
{
    $config = app_config();
    $ftp = $config['ftp'] ?? [];
    $host = $ftp['host'] ?? '';
    $port = (int) ($ftp['port'] ?? 21);
    $connection = !empty($ftp['use_ssl'])
        ? ftp_ssl_connect($host, $port, 30)
        : ftp_connect($host, $port, 30);

    if (!$connection || !ftp_login($connection, $ftp['user'] ?? '', $ftp['password'] ?? '')) {
        throw new RuntimeException('FTP login failed.');
    }

    ftp_pasv($connection, (bool) ($ftp['passive'] ?? true));
    $remoteRoot = rtrim((string) ($ftp['ftp_base_dir'] ?? $ftp['remote_root'] ?? '/'), '/');
    $uploaded = [];

    foreach ($files as $file) {
        $remote = $remoteRoot . '/' . basename($file);
        if (!ftp_put($connection, $remote, $file, FTP_BINARY)) {
            ftp_close($connection);
            throw new RuntimeException("FTP upload failed: " . basename($file));
        }
        $uploaded[] = $remote;
    }

    ftp_close($connection);
    return $uploaded;
}

function xml_escape(string $value): string
{
    return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
}
