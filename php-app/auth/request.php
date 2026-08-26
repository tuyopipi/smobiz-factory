<?php

session_start();
require_once __DIR__ . '/../inc/auth.php';
require_once __DIR__ . '/../inc/template.php';

$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim((string) ($_POST['email'] ?? ''));
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        auth_request_magic_link($email);
        $message = t('auth.check_email');
    } else {
        $message = t('auth.invalid_email');
    }
}

ob_start();
?>
<section class="tool-shell">
  <h1><?= h(t('auth.title')) ?></h1>
  <form method="post">
    <label for="email"><?= h(t('tool.email')) ?></label>
    <input id="email" name="email" type="email" autocomplete="email" required>
    <button type="submit"><?= h(t('auth.send_link')) ?></button>
  </form>
  <?php if ($message !== ''): ?><p><?= h($message) ?></p><?php endif; ?>
</section>
<?php

render_page([
    'title' => 'Sign in | Nurevo Tools',
    'description' => 'Sign in with a passwordless email link.',
    'content' => ob_get_clean(),
    'faq' => [
        ['question' => t('faq.account.q'), 'answer' => t('faq.account.a')],
    ],
]);
