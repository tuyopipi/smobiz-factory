<?php

require_once __DIR__ . '/config.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $postgres = config_value('postgres', config_value('mysql'));
    if (!is_array($postgres)) {
        throw new RuntimeException('Missing postgres config.');
    }
    $dsn = sprintf(
        'pgsql:host=%s;port=%d;dbname=%s;sslmode=%s',
        $postgres['host'],
        $postgres['port'] ?? 5432,
        $postgres['database'],
        $postgres['sslmode'] ?? 'require'
    );

    $pdo = new PDO($dsn, $postgres['user'], $postgres['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}

function db_schema_sql(): string
{
    return file_get_contents(dirname(__DIR__) . '/db/schema.sql');
}

function db_install_schema(?PDO $pdo = null): void
{
    $pdo = $pdo ?: db();
    foreach (db_split_sql(db_schema_sql()) as $statement) {
        $pdo->exec($statement);
    }
}

function db_split_sql(string $sql): array
{
    return array_values(array_filter(array_map('trim', explode(';', $sql))));
}

function db_find_user_by_email(string $email): ?array
{
    $stmt = db()->prepare('SELECT * FROM "users" WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => strtolower(trim($email))]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function db_upsert_user(string $email): int
{
    $email = strtolower(trim($email));
    db()->prepare('INSERT INTO "users" (email, created_at, updated_at) VALUES (:email, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()')
        ->execute(['email' => $email]);
    $user = db_find_user_by_email($email);
    return (int) $user['id'];
}
