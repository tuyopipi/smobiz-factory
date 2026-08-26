<?php

require_once __DIR__ . '/inc/db.php';
require_once __DIR__ . '/inc/template.php';

$tools = [];
$query = trim((string) ($_GET['q'] ?? ''));
try {
    if ($query !== '') {
        $stmt = db()->prepare(
            'SELECT slug, name, description, category, target_keyword, logo_color, pricing_model
             FROM tools
             WHERE is_active = 1 AND (name LIKE :q OR description LIKE :q OR target_keyword LIKE :q OR category LIKE :q)
             ORDER BY created_at DESC'
        );
        $stmt->execute(['q' => '%' . $query . '%']);
    } else {
        $stmt = db()->query('SELECT slug, name, description, category, target_keyword, logo_color, pricing_model FROM tools WHERE is_active = 1 ORDER BY created_at DESC');
    }
    $tools = $stmt->fetchAll();
} catch (Throwable $error) {
    $tools = [];
}

if (count($tools) === 0) {
    $registry = __DIR__ . '/tools/registry.php';
    $tools = is_file($registry) ? require $registry : [];
}

ob_start();
?>
<section class="hero">
  <h1><?= h(t('site.tagline')) ?></h1>
  <p>Free private business tools with no login, no sign up, no upload, and no paywall for the core workflow.</p>
  <?= render_trust_badges() ?>
</section>
<form class="search-box" method="get">
  <label for="q"><?= h(t('search.label')) ?></label>
  <input id="q" name="q" type="search" value="<?= h($query) ?>" placeholder="<?= h(t('search.placeholder')) ?>">
  <button type="submit"><?= h(t('search.label')) ?></button>
</form>
<section class="tool-grid" aria-label="Available tools">
  <?php if (count($tools) === 0): ?>
    <p><?= h(t('tools.empty')) ?></p>
  <?php else: ?>
    <?php foreach ($tools as $tool): ?>
      <?= render_tool_card($tool) ?>
    <?php endforeach; ?>
  <?php endif; ?>
</section>
<?php

render_page([
    'title' => 'Nurevo Tools | Simple Business Web Tools',
    'description' => 'Free private business web tools for documents, data, images, scheduling, and workflows. No login, no sign up, no upload, and no paywall for core use.',
    'keyword' => 'free private web tools, no login tools, no sign up tools, no upload tools, business tools, document tools, data tools',
    'canonical_path' => '/',
    'inline_help' => 'Use the tools directly in your browser. No account is required and core inputs are not uploaded.',
    'content' => ob_get_clean(),
    'faq' => [
        ['question' => t('faq.account.q'), 'answer' => t('faq.account.a')],
        ['question' => t('faq.support.q'), 'answer' => t('faq.support.a')],
    ],
]);
