<?php

session_start();
require_once __DIR__ . '/../inc/auth.php';

$email = (string) ($_GET['email'] ?? '');
$token = (string) ($_GET['token'] ?? '');
$ok = $email !== '' && $token !== '' && auth_consume_magic_link($email, $token);
header('Location: /?login=' . ($ok ? 'success' : 'failed'));
exit;
