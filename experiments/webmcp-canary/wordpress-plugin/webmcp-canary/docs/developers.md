# Nurevo AEO for developers

Hooks, tools and per-post settings for themes and plugins that build on
Nurevo AEO. Every hook below is applied in exactly one place in
`nurevo-webmcp.php`; search for its name to find it.

## Filters

### `webmcp_canary_schema_graph`

Everything Nurevo would publish on the current request, before it is filtered
for coexistence with an SEO plugin or merged into that plugin's graph.

```php
add_filter('webmcp_canary_schema_graph', function (array $bundle) {
    // $bundle['core']  - business, WebSite and page nodes (subject to coexistence rules)
    // $bundle['extra'] - FAQPage and Service nodes (hand-entered, never suppressed)
    // $bundle['org_id'] - @id of the business node (read only)
    $bundle['extra'][] = array('@type' => 'Event', 'name' => 'Open day', 'organizer' => array('@id' => $bundle['org_id']));
    return $bundle;
});
```

Return the same shape. A result without `core` and `extra` node lists is
ignored. Not called on a page excluded from structured data (see below).

### `webmcp_canary_business_node`

The business node (Organization, LocalBusiness or the configured subtype),
after the telephone and opening hours have been normalised.

```php
add_filter('webmcp_canary_business_node', function (array $node, array $settings) {
    $node['priceRange'] = '$$';
    $node['sameAs'] = array('https://www.instagram.com/example');
    return $node;
}, 10, 2);
```

Return an array; anything else is ignored. With Yoast SEO, Rank Math, All in
One SEO or Slim SEO active, the node's properties are merged into their business
node as usual, so values that plugin already sets still win.

### `webmcp_canary_llms_txt_lines`

The lines of `/llms.txt` (Markdown, one string per line) before they are joined.

```php
add_filter('webmcp_canary_llms_txt_lines', function (array $lines) {
    $lines[] = '## Policies';
    $lines[] = '';
    $lines[] = '- [Returns](https://example.com/returns/)';
    return $lines;
});
```

Applied while the body is generated, so its result is cached with it (see
"Caching").

### `webmcp_canary_llms_txt`

The complete `/llms.txt` body as served, on every request, after the cache.

```php
add_filter('webmcp_canary_llms_txt', function ($body) {
    return $body . "\n> Last reviewed by the owner in 2026.\n";
});
```

Return a string; anything else is ignored.

### `webmcp_canary_robots_search_agents` / `webmcp_canary_robots_training_agents`

The crawler user-agent tokens Nurevo writes into the virtual robots.txt.
Search agents get an `Allow: /` group (repeating your `User-agent: *` rules);
training agents follow the "AI training crawlers" choice in Settings.

```php
add_filter('webmcp_canary_robots_search_agents', function (array $agents) {
    $agents[] = 'MistralAI-User';
    return $agents;
});
add_filter('webmcp_canary_robots_training_agents', function (array $agents) {
    return array_diff($agents, array('CCBot'));
});
```

Values are reduced to single-line tokens (letters, digits, `. _ - / *` and
spaces) and de-duplicated.

### `webmcp_canary_excluded_post_ids`

Post IDs left out of `/llms.txt` (`$context === 'llms'`) or given no Nurevo
structured data (`$context === 'schema'`). Starts from the posts whose editors
ticked the matching per-post setting.

```php
add_filter('webmcp_canary_excluded_post_ids', function (array $ids, $context) {
    if ($context === 'llms') {
        $ids = array_merge($ids, get_posts(array('post_type' => 'page', 'post_parent' => 42, 'fields' => 'ids')));
    }
    return $ids;
}, 10, 2);
```

## Per-post settings

Registered with `register_post_meta()` (`show_in_rest`, editable by users who
can `edit_post`), shown in the block editor sidebar and in a classic-editor
meta box. The block editor panel needs the post type to support
`custom-fields`.

| Meta key | Type | Effect |
| --- | --- | --- |
| `_nurevo_exclude_llms` | boolean | The post is not listed in `/llms.txt`. |
| `_nurevo_exclude_schema` | boolean | No Nurevo structured data on the post, standalone or merged. |
| `_nurevo_faq` | array of `{q, a}` | The post's own questions. Shown by the Nurevo FAQ block with "This page's own questions" or `[nurevo_faq source="post"]`, and published as FAQPage on that post only, and only where shown. |

## Caching

`/llms.txt` is cached in the `webmcp_canary_llms_txt` transient and served
with `Cache-Control: public, max-age=300`. The cache is cleared when a post is
saved or deleted, when the settings or the service list change, and when the
central ruleset is synced. To clear it yourself:

```php
webmcp_canary_flush_llms_cache();
```

## WP-CLI

```
wp nurevo status [--format=json]   # what this site publishes
wp nurevo diagnose [--consent]     # run the AEO diagnosis (needs --consent once)
wp nurevo export [--file=<path>]   # settings as JSON, without keys or tokens
wp nurevo import <file|->          # import an export; keys and unknown settings are refused
```

## REST

`GET /wp-json/nurevo/v1/status` returns the same report as `wp nurevo status`
to users with `manage_options`. It is read-only and contains no keys or tokens.

## Abilities API (WordPress 6.9+)

On WordPress 6.9 and later, `includes/abilities.php` registers a `nurevo`
ability category and four read-only abilities through the
[Abilities API](https://developer.wordpress.org/apis/abilities-api/). On older
WordPress, where `wp_register_ability()` does not exist, nothing is registered.

The category is registered on `wp_abilities_api_categories_init` and the
abilities on `wp_abilities_api_init`, as core requires. Every ability:

- needs `manage_options` (`permission_callback`);
- takes no input (an empty object, which is also the default);
- declares an `output_schema`;
- is annotated `readonly: true`, `destructive: false`, `idempotent: true` and
  has `show_in_rest: true` in its `meta`;
- only reads what the site already stores. None writes a setting, and none
  contacts the Nurevo service or any other remote or paid API.

| Ability | Returns |
| --- | --- |
| `nurevo/get-status` | `output_enabled`; `outputs` (`json_ld`, `llms_txt`, `robots_rules`); `ai_training` (`default`, `allow` or `block`); `search_engines_allowed`; `llms_txt_url`; `connected`; `plan`; `consent`; `version`. |
| `nurevo/get-aeo-score` | The last **stored** diagnosis: `available`, `score`, `band`, `band_label`, `date`, `checklist` (`total`, `ok`, `warn`, `bad`), `checks` (`id`, `label`, `status`), `message`, `admin_url`. It never runs a new diagnosis. Without a stored one, `available` is `false` and `message` says how to run one from wp-admin. |
| `nurevo/get-fixes` | The WARN and BAD items of that stored diagnosis, each with `id`, `status`, `label`, `finding`, a plain-language `next_step` and the admin screen to do it on (`where`). |
| `nurevo/get-business-profile` | The business node exactly as Nurevo's JSON-LD carries it (`json_ld`), plus flat `type`, `name`, `description`, `url`, `address`, `telephone`, `email`, `opening_hours` / `opening_hours_specification`, and `published` (whether output is on). Only published facts: never the site key, tokens, licence or the owner email. |

Running one in PHP:

```php
$ability = wp_get_ability('nurevo/get-status');
$status  = $ability ? $ability->execute() : null; // array, or WP_Error
```

Over REST (authenticated, as an administrator), a read-only ability runs with GET:

```
GET /wp-json/wp-abilities/v1/abilities/nurevo/get-aeo-score/run
```
