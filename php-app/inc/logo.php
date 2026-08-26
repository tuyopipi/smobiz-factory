<?php

function logo_color_for_category(string $category): string
{
    $key = strtolower(trim($category));
    $colors = [
        'documents' => '#12355B',
        'document' => '#12355B',
        'data' => '#145A32',
        'images' => '#9A4D00',
        'image' => '#9A4D00',
        'scheduling' => '#4A235A',
        'booking' => '#4A235A',
        'workflow' => '#7B241C',
    ];
    return $colors[$key] ?? '#1F3A5F';
}

function logo_initial(string $name): string
{
    $trimmed = trim($name);
    if ($trimmed === '') {
        return 'N';
    }
    if (function_exists('mb_substr')) {
        return strtoupper(mb_substr($trimmed, 0, 1, 'UTF-8'));
    }
    return strtoupper(substr($trimmed, 0, 1));
}

function generate_logo_svg(string $name, string $category, ?string $color = null): string
{
    $initial = htmlspecialchars(logo_initial($name), ENT_QUOTES, 'UTF-8');
    $fill = htmlspecialchars($color ?: logo_color_for_category($category), ENT_QUOTES, 'UTF-8');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="' .
        htmlspecialchars($name, ENT_QUOTES, 'UTF-8') .
        ' logo"><rect width="128" height="128" rx="18" fill="' . $fill .
        '"/><text x="64" y="80" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700" fill="#fff">' .
        $initial .
        '</text></svg>';
}
