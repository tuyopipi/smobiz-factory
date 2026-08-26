<?php

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/i18n.php';
require_once __DIR__ . '/logo.php';

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function render_page(array $page): void
{
    $appName = config_value('app.name', 'Nurevo Tools');
    $title = $page['title'] ?? $appName;
    $description = $page['description'] ?? 'Simple web tools for document, data, image, scheduling, and workflow tasks.';
    $content = $page['content'] ?? '';
    $faq = $page['faq'] ?? [];
    $inlineHelp = $page['inline_help'] ?? '';
    $keyword = $page['keyword'] ?? '';
    $canonicalPath = $page['canonical_path'] ?? ($_SERVER['REQUEST_URI'] ?? '/');
    $canonicalUrl = public_url(strtok((string) $canonicalPath, '?') ?: '/');
    $isToolPage = isset($page['is_tool_page'])
        ? (bool) $page['is_tool_page']
        : strpos((string) $canonicalPath, '/tools/') === 0;
    $lang = current_lang();
    $logoPath = dirname(__DIR__) . '/assets/logo.png';
    $hasLogoImage = is_file($logoPath);
    $appInitial = strtoupper(substr(trim($appName), 0, 1)) ?: 'N';

    ?><!doctype html>
<html lang="<?= h($lang) ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= h($title) ?></title>
  <meta name="description" content="<?= h($description) ?>">
  <?php if ($keyword !== ''): ?><meta name="keywords" content="<?= h($keyword) ?>"><?php endif; ?>
  <link rel="canonical" href="<?= h($canonicalUrl) ?>">
  <link rel="stylesheet" href="<?= h(public_url('assets/style.css')) ?>">
  <?php if (adsense_publisher_id() !== ''): ?>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=<?= h(adsense_publisher_id()) ?>" crossorigin="anonymous"></script>
  <?php endif; ?>
</head>
<body>
  <header class="site-header">
    <div class="header-left">
      <a class="brand" href="/">
        <?php if ($hasLogoImage): ?>
          <img class="brand-logo brand-logo-image" src="<?= h(public_url('assets/logo.png')) ?>" alt="<?= h($appName) ?>">
        <?php else: ?>
          <span class="brand-logo brand-logo-fallback" aria-hidden="true"><?= h($appInitial) ?></span>
        <?php endif; ?>
        <span><?= h($appName) ?></span>
      </a>
      <?php if ($isToolPage): ?>
        <a class="back-link" href="/"><?= h(t('nav.back_to_top')) ?></a>
      <?php endif; ?>
    </div>
    <nav>
      <span><?= h(t('nav.language')) ?>:</span>
      <a href="<?= h(lang_url('en')) ?>">EN</a>
      <a href="<?= h(lang_url('ja')) ?>">JA</a>
      <a href="/auth/request.php"><?= h(t('nav.sign_in')) ?></a>
    </nav>
  </header>
  <main>
    <?= render_ad_slot('top') ?>
    <?php if ($inlineHelp !== ''): ?><p class="inline-help"><?= h($inlineHelp) ?></p><?php endif; ?>
    <?= $content ?>
    <?php if (count($faq) > 0): ?>
      <section class="faq" aria-labelledby="faq-title">
        <h2 id="faq-title"><?= h(t('tool.faq')) ?></h2>
        <?php foreach ($faq as $item): ?>
          <details>
            <summary><?= h($item['question']) ?></summary>
            <p><?= h($item['answer']) ?></p>
          </details>
        <?php endforeach; ?>
      </section>
    <?php endif; ?>
    <?= render_ad_slot('bottom') ?>
  </main>
  <footer>
    <span><?= h($appName) ?></span>
    <span><?= h(t('footer.support')) ?></span>
  </footer>
</body>
</html><?php
}

function render_trust_badges(): string
{
    $items = [
        t('trust.no_signup'),
        t('trust.private_browser'),
        t('trust.free_no_paywall'),
    ];
    $html = '<ul class="trust-badges" aria-label="' . h(t('trust.label')) . '">';
    foreach ($items as $item) {
        $html .= '<li><span aria-hidden="true">✓</span>' . h($item) . '</li>';
    }
    return $html . '</ul>';
}

function adsense_publisher_id(): string
{
    return trim((string) config_value('app.adsense_publisher_id', config_value('adsense_publisher_id', '')));
}

function render_ad_slot(string $slot): string
{
    $publisher = adsense_publisher_id();
    if ($publisher === '') {
        return '<aside class="ad-slot ad-slot-empty" aria-hidden="true"></aside>';
    }
    return '<aside class="ad-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="' .
        h($publisher) .
        '" data-ad-slot="' . h($slot) .
        '" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></aside>';
}

function localized_value(array $values, string $fallback = ''): string
{
    $lang = current_lang();
    if (isset($values[$lang]) && $values[$lang] !== '') {
        return (string) $values[$lang];
    }
    if (isset($values['en']) && $values['en'] !== '') {
        return (string) $values['en'];
    }
    return $fallback;
}

function render_tool_page(array $tool, array $body): void
{
    $title = localized_value($body['seo_title'] ?? [], $tool['name'] . ' | Nurevo Tools');
    $description = trim(localized_value($body['seo_description'] ?? [], $tool['description']));
    $privacyDescription = localized_value([
        'en' => ' Free, private, no login, no sign up, and no upload required.',
        'ja' => ' 無料、ログイン不要、アップロード不要で、入力データはブラウザ内で処理します。',
    ]);
    if (!str_contains(strtolower($description), 'no login') && !str_contains($description, 'ログイン不要')) {
        $description .= $privacyDescription;
    }
    $h1 = localized_value($body['h1'] ?? [], $tool['target_keyword']);
    $explanation = localized_value($body['explanation'] ?? [], $tool['description']);
    $inlineHelp = localized_value($body['inline_help'] ?? [], 'Use the fields below, then copy or export the result.');
    $toolHtml = $body['tool_html'] ?? '<textarea rows="8" placeholder="Paste input here"></textarea><button type="button">Run</button><textarea rows="8" placeholder="Output"></textarea>';
    $codeHtml = $body['code_html'] ?? '<textarea rows="7" readonly placeholder="Generated output or export code will appear here."></textarea>';
    $faq = $body['faq'] ?? [];

    ob_start();
    ?>
    <section class="hero tool-hero">
      <span class="tool-logo"><?= generate_logo_svg($tool['name'], $tool['category'], $tool['logo_color'] ?? null) ?></span>
      <div>
        <h1><?= h($h1) ?></h1>
        <p><?= h($description) ?></p>
        <?= render_trust_badges() ?>
      </div>
    </section>
    <section class="tool-layout">
      <section class="tool-shell" aria-labelledby="tool-input-title">
        <h2 id="tool-input-title"><?= h(t('tool.input')) ?></h2>
        <p class="inline-help"><?= h($inlineHelp) ?></p>
        <?= $toolHtml ?>
      </section>
      <aside class="tool-side">
        <section class="tool-shell trust-panel">
          <h2><?= h(t('trust.panel_title')) ?></h2>
          <?= render_trust_badges() ?>
        </section>
        <section class="tool-shell">
          <h2><?= h(t('tool.code')) ?></h2>
          <?= $codeHtml ?>
        </section>
      </aside>
    </section>
    <section class="tool-shell">
      <h2><?= h(t('tool.how_it_works')) ?></h2>
      <p><?= h($explanation) ?></p>
    </section>
    <?php

    render_page([
        'title' => $title,
        'description' => $description,
        'keyword' => $tool['target_keyword'],
        'canonical_path' => '/tools/' . $tool['slug'],
        'inline_help' => $inlineHelp,
        'content' => ob_get_clean(),
        'faq' => $faq,
    ]);
}

function render_tool_card(array $tool): string
{
    $svg = generate_logo_svg($tool['name'], $tool['category'], $tool['logo_color'] ?? null);
    $slug = h($tool['slug']);
    return '<article class="tool-card"><a href="/tools/' . $slug . '">' .
        '<span class="tool-logo">' . $svg . '</span>' .
        '<span><strong>' . h($tool['name']) . '</strong><em>' . h($tool['target_keyword']) . '</em><small>' .
        h($tool['description']) . '</small></span></a></article>';
}
