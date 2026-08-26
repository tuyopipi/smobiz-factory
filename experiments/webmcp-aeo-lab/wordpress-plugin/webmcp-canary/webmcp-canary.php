<?php
/**
 * Plugin Name: Nurevo WebMCP
 * Plugin URI: https://nurevo.jp/
 * Description: Loads the Nurevo WebMCP tag for agent-readable forms, autofill helpers, privacy-safe footprints, and A/B-tested MCP/AEO delivery.
 * Version: 0.1.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Nurevo
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: nurevo-webmcp
 * Domain Path: /languages
 *
 * @package WebMCP_Canary
 */

if (!defined('ABSPATH')) {
    exit;
}

define('WEBMCP_CANARY_VERSION', '0.1.0');
define('WEBMCP_CANARY_OPTION', 'webmcp_canary_settings');
define('WEBMCP_CANARY_HTTP_TIMEOUT', 10);
define('WEBMCP_CANARY_INSIGHTS_CACHE_TTL', 10 * MINUTE_IN_SECONDS);
define('WEBMCP_CANARY_LLMS_TXT_MAX_BYTES', 256 * 1024);

function webmcp_canary_default_settings() {
    return array(
        'enabled' => '0',
        'allow_ai_crawlers' => '1',
        'serve_llms_txt' => '1',
        'tag_url' => 'https://nurevo.jp/tag.js',
        'site_key' => '',
        'site_email' => get_option('admin_email'),
        'admin_token' => '',
    );
}

function webmcp_canary_settings() {
    $settings = get_option(WEBMCP_CANARY_OPTION, array());
    return wp_parse_args(is_array($settings) ? $settings : array(), webmcp_canary_default_settings());
}

add_filter('robots_txt', 'webmcp_canary_allow_ai_crawlers_robots_txt', 10, 2);
function webmcp_canary_allow_ai_crawlers_robots_txt($output, $public) {
    $output = (string) $output;
    $settings = webmcp_canary_settings();
    if (!$public || $settings['enabled'] !== '1' || $settings['allow_ai_crawlers'] !== '1') {
        return $output;
    }

    $marker = '# Nurevo WebMCP AI crawler access';
    if (strpos($output, $marker) !== false) {
        return $output;
    }

    $agents = array(
        'GPTBot',
        'OAI-SearchBot',
        'ChatGPT-User',
        'ClaudeBot',
        'anthropic-ai',
        'PerplexityBot',
        'Google-Extended',
        'CCBot',
        'Applebot-Extended',
    );
    $rules = array($marker);
    foreach ($agents as $agent) {
        $rules[] = 'User-agent: ' . $agent;
        $rules[] = 'Allow: /';
        $rules[] = '';
    }

    $separator = '';
    if ($output !== '') {
        $separator = substr($output, -1) === "\n" ? "\n" : "\n\n";
    }
    return $output . $separator . implode("\n", $rules) . "\n";
}

add_action('admin_init', 'webmcp_canary_register_settings');
function webmcp_canary_register_settings() {
    register_setting('webmcp_canary', WEBMCP_CANARY_OPTION, array(
        'type' => 'array',
        'sanitize_callback' => 'webmcp_canary_sanitize_settings',
        'default' => webmcp_canary_default_settings(),
    ));

    add_settings_section(
        'webmcp_canary_main',
        __('WebMCP tag settings', 'nurevo-webmcp'),
        '__return_false',
        'webmcp_canary'
    );

    add_settings_field('enabled', __('Enable tag', 'nurevo-webmcp'), 'webmcp_canary_enabled_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('allow_ai_crawlers', __('Allow AI crawlers in robots.txt', 'nurevo-webmcp'), 'webmcp_canary_allow_ai_crawlers_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('serve_llms_txt', __('Serve /llms.txt', 'nurevo-webmcp'), 'webmcp_canary_serve_llms_txt_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('tag_url', __('External tag.js URL', 'nurevo-webmcp'), 'webmcp_canary_tag_url_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('site_key', __('API key / site key', 'nurevo-webmcp'), 'webmcp_canary_site_key_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('site_email', __('Owner email', 'nurevo-webmcp'), 'webmcp_canary_site_email_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('admin_token', __('Admin token', 'nurevo-webmcp'), 'webmcp_canary_admin_token_field', 'webmcp_canary', 'webmcp_canary_main');
}

function webmcp_canary_sanitize_settings($input) {
    $input = is_array($input) ? $input : array();
    return array(
        'enabled' => !empty($input['enabled']) ? '1' : '0',
        'allow_ai_crawlers' => !empty($input['allow_ai_crawlers']) ? '1' : '0',
        'serve_llms_txt' => !empty($input['serve_llms_txt']) ? '1' : '0',
        'tag_url' => isset($input['tag_url']) ? esc_url_raw($input['tag_url']) : '',
        'site_key' => isset($input['site_key']) ? sanitize_text_field($input['site_key']) : '',
        'site_email' => isset($input['site_email']) ? sanitize_email($input['site_email']) : '',
        'admin_token' => isset($input['admin_token']) ? sanitize_text_field($input['admin_token']) : '',
    );
}

function webmcp_canary_enabled_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<label><input type="checkbox" name="%1$s[enabled]" value="1" %2$s> %3$s</label>',
        esc_attr(WEBMCP_CANARY_OPTION),
        checked('1', $settings['enabled'], false),
        esc_html__('Load WebMCP tag on public pages', 'nurevo-webmcp')
    );
}

function webmcp_canary_allow_ai_crawlers_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<label><input type="checkbox" name="%1$s[allow_ai_crawlers]" value="1" %2$s> %3$s</label>',
        esc_attr(WEBMCP_CANARY_OPTION),
        checked('1', $settings['allow_ai_crawlers'], false),
        esc_html__('Explicitly allow major AI search and training crawlers in the virtual robots.txt file', 'nurevo-webmcp')
    );
    echo '<p class="description">' . esc_html__('Applied only while the WebMCP tag is enabled and the site is visible to search engines.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_serve_llms_txt_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<label><input type="checkbox" name="%1$s[serve_llms_txt]" value="1" %2$s> %3$s</label>',
        esc_attr(WEBMCP_CANARY_OPTION),
        checked('1', $settings['serve_llms_txt'], false),
        esc_html__('Serve the Worker-generated llms.txt at this site’s /llms.txt URL', 'nurevo-webmcp')
    );
    echo '<p class="description">' . esc_html__('Requires the WebMCP tag to be enabled and a site key to be configured.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_tag_url_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="url" class="regular-text code" name="%1$s[tag_url]" value="%2$s" placeholder="https://cdn.example.com/tag.js">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['tag_url'])
    );
    echo '<p class="description">' . esc_html__('The plugin does not bundle tag.js. Updating this hosted file updates all installed sites.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_site_key_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="text" class="regular-text code" name="%1$s[site_key]" value="%2$s" autocomplete="off">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['site_key'])
    );
    echo '<p class="description">' . esc_html__('Sent to the WebMCP server as a site authorization key. Do not use a privileged server secret here.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_site_email_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="email" class="regular-text" name="%1$s[site_email]" value="%2$s" autocomplete="email">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['site_email'])
    );
    echo '<p class="description">' . esc_html__('Used only when issuing a site key from the WebMCP server.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_admin_token_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="password" class="regular-text code" name="%1$s[admin_token]" value="%2$s" autocomplete="off">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['admin_token'])
    );
    echo '<p class="description">' . esc_html__('Only used by this WordPress admin screen for protected management actions such as key rotation and disablement. It is never printed on public pages.', 'nurevo-webmcp') . '</p>';
}

add_action('admin_menu', 'webmcp_canary_admin_menu');
function webmcp_canary_admin_menu() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $badge_count = webmcp_canary_dashboard_badge_count();
    $menu_title = __('WebMCP', 'nurevo-webmcp');
    if ($badge_count > 0) {
        $menu_title .= sprintf(
            ' <span class="awaiting-mod"><span class="pending-count">%d</span></span>',
            intval($badge_count)
        );
    }

    add_menu_page(
        __('WebMCP', 'nurevo-webmcp'),
        $menu_title,
        'manage_options',
        'webmcp-canary',
        'webmcp_canary_dashboard_page',
        'dashicons-forms',
        58
    );

    add_submenu_page(
        'webmcp-canary',
        __('Dashboard', 'nurevo-webmcp'),
        __('Dashboard', 'nurevo-webmcp'),
        'manage_options',
        'webmcp-canary',
        'webmcp_canary_dashboard_page'
    );

    add_submenu_page(
        'webmcp-canary',
        __('Settings', 'nurevo-webmcp'),
        __('Settings', 'nurevo-webmcp'),
        'manage_options',
        'webmcp-canary-settings',
        'webmcp_canary_settings_page'
    );
}

add_action('admin_enqueue_scripts', 'webmcp_canary_admin_enqueue_styles');
function webmcp_canary_admin_enqueue_styles($hook_suffix) {
    if ($hook_suffix !== 'toplevel_page_webmcp-canary') {
        return;
    }

    wp_register_style('webmcp-canary-admin', false, array(), WEBMCP_CANARY_VERSION);
    wp_enqueue_style('webmcp-canary-admin');
    wp_add_inline_style('webmcp-canary-admin', webmcp_canary_dashboard_styles());
}

function webmcp_canary_dashboard_badge_count() {
    $settings = webmcp_canary_settings();
    if (empty($settings['site_key'])) {
        return 0;
    }
    $api_bases = webmcp_canary_api_base_candidates();
    if (empty($api_bases)) {
        return 0;
    }
    $cache_key = 'webmcp_canary_site_insights_' . md5(implode(',', $api_bases) . '|' . $settings['site_key'] . '|' . home_url());
    $insights = get_transient($cache_key);
    if (is_wp_error($insights) || empty($insights['dataSufficiency']['sufficient'])) {
        return 0;
    }
    return isset($insights['newSuggestionCount']) ? max(0, intval($insights['newSuggestionCount'])) : 0;
}

function webmcp_canary_api_base() {
    $settings = webmcp_canary_settings();
    if (empty($settings['tag_url'])) {
        return '';
    }
    $parts = wp_parse_url($settings['tag_url']);
    if (empty($parts['scheme']) || empty($parts['host'])) {
        return '';
    }
    $port = !empty($parts['port']) ? ':' . $parts['port'] : '';
    return $parts['scheme'] . '://' . $parts['host'] . $port;
}

function webmcp_canary_api_base_candidates() {
    $api_base = webmcp_canary_api_base();
    if (empty($api_base)) {
        return array();
    }
    $candidates = array($api_base);
    $parts = wp_parse_url($api_base);
    $host = isset($parts['host']) ? strtolower($parts['host']) : '';
    if ($host === 'localhost' || $host === '127.0.0.1') {
        $scheme = !empty($parts['scheme']) ? $parts['scheme'] : 'http';
        $port = !empty($parts['port']) ? ':' . $parts['port'] : '';
        $candidates[] = $scheme . '://webmcp' . $port;
        $candidates[] = $scheme . '://host.docker.internal' . $port;
    }
    return array_values(array_unique($candidates));
}

function webmcp_canary_fetch_llms_txt() {
    $settings = webmcp_canary_settings();
    if ($settings['enabled'] !== '1' || $settings['serve_llms_txt'] !== '1' || empty($settings['site_key'])) {
        return null;
    }

    $host = wp_parse_url(home_url(), PHP_URL_HOST);
    $api_bases = webmcp_canary_api_base_candidates();
    if (empty($host) || empty($api_bases)) {
        return null;
    }

    foreach ($api_bases as $api_base) {
        $url = add_query_arg(
            array(
                'site_key' => $settings['site_key'],
                'host' => $host,
            ),
            trailingslashit($api_base) . 'api/llms.txt'
        );
        $response = wp_remote_get($url, array(
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => array('accept' => 'text/plain'),
            'limit_response_size' => WEBMCP_CANARY_LLMS_TXT_MAX_BYTES + 1,
        ));
        if (is_wp_error($response)) {
            continue;
        }
        $status = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        if ($status >= 200 && $status < 300 && is_string($body) && $body !== '' && strlen($body) <= WEBMCP_CANARY_LLMS_TXT_MAX_BYTES) {
            return $body;
        }
    }

    return null;
}

add_action('template_redirect', 'webmcp_canary_maybe_serve_llms_txt', 0);
function webmcp_canary_maybe_serve_llms_txt() {
    if (empty($_SERVER['REQUEST_URI'])) {
        return;
    }
    $request_path = wp_parse_url(wp_unslash($_SERVER['REQUEST_URI']), PHP_URL_PATH);
    $llms_path = wp_parse_url(home_url('/llms.txt'), PHP_URL_PATH);
    if (!is_string($request_path) || !is_string($llms_path) || $request_path !== $llms_path) {
        return;
    }

    $body = webmcp_canary_fetch_llms_txt();
    if (!is_string($body)) {
        return;
    }

    status_header(200);
    nocache_headers();
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    // The body is trusted plain text fetched from the configured WebMCP Worker.
    echo $body; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    exit;
}

function webmcp_canary_cache_key($suffix = '') {
    $settings = webmcp_canary_settings();
    return 'webmcp_canary_site_insights_' . md5(implode(',', webmcp_canary_api_base_candidates()) . '|' . $settings['site_key'] . '|' . home_url() . '|' . $suffix);
}

function webmcp_canary_last_good_cache_key() {
    return webmcp_canary_cache_key('last_good');
}

function webmcp_canary_api_request($path, $body) {
    $api_bases = webmcp_canary_api_base_candidates();
    if (empty($api_bases)) {
        return new WP_Error('webmcp_missing_api_base', __('The tag.js URL is not configured. Open WebMCP > Settings and configure it.', 'nurevo-webmcp'));
    }

    $last_error = null;
    foreach ($api_bases as $api_base) {
        $settings = webmcp_canary_settings();
        $headers = array(
            'accept' => 'application/json',
            'content-type' => 'application/json',
        );
        if (!empty($settings['admin_token'])) {
            $headers['x-webmcp-admin-token'] = $settings['admin_token'];
        }
        $response = wp_remote_post(trailingslashit($api_base) . ltrim($path, '/'), array(
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => $headers,
            'body' => wp_json_encode($body),
        ));
        if (is_wp_error($response)) {
            $last_error = $response;
            continue;
        }
        $status = wp_remote_retrieve_response_code($response);
        $raw_body = wp_remote_retrieve_body($response);
        $decoded = json_decode($raw_body, true);
        if (!is_array($decoded)) {
            $last_error = new WP_Error('webmcp_api_invalid_json', __('The WebMCP server returned invalid JSON.', 'nurevo-webmcp'));
            continue;
        }
        if ($status < 200 || $status >= 300 || empty($decoded['ok'])) {
            /* translators: %d: HTTP status code returned by the WebMCP server. */
            $message = !empty($decoded['message']) ? $decoded['message'] : (!empty($decoded['error']) ? $decoded['error'] : sprintf(__('HTTP %d', 'nurevo-webmcp'), $status));
            /* translators: %s: Error message returned by the WebMCP server. */
            return new WP_Error('webmcp_api_error', sprintf(__('The WebMCP server returned an error: %s', 'nurevo-webmcp'), $message), $decoded);
        }
        return $decoded;
    }

    return new WP_Error(
        'webmcp_api_unreachable',
        webmcp_canary_connection_error_message($last_error),
        is_wp_error($last_error) ? array('detail' => $last_error->get_error_message(), 'checked_urls' => $api_bases) : array('checked_urls' => $api_bases)
    );
}

function webmcp_canary_redirect_settings($status, $message) {
    $url = add_query_arg(
        array(
            'page' => 'webmcp-canary-settings',
            'webmcp_status' => sanitize_key($status),
            'webmcp_message' => rawurlencode($message),
        ),
        admin_url('admin.php')
    );
    $url = wp_nonce_url($url, 'webmcp_canary_notice');
    wp_safe_redirect($url);
    exit;
}

add_action('admin_post_webmcp_canary_issue_site_key', 'webmcp_canary_issue_site_key_action');
function webmcp_canary_issue_site_key_action() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to perform this action.', 'nurevo-webmcp'));
    }
    check_admin_referer('webmcp_canary_issue_site_key');
    $settings = webmcp_canary_settings();
    $result = webmcp_canary_api_request('api/site-key', array(
        'siteUrl' => home_url(),
        'email' => $settings['site_email'],
    ));
    if (is_wp_error($result)) {
        $data = $result->get_error_data();
        if (is_array($data) && isset($data['error']) && $data['error'] === 'duplicate_site_host') {
            webmcp_canary_redirect_settings('error', __('This site is already registered. Regenerate the key with an administrator token if the existing key is unavailable.', 'nurevo-webmcp'));
        }
        webmcp_canary_redirect_settings('error', $result->get_error_message());
    }
    $settings['site_key'] = sanitize_text_field($result['siteKey']);
    $settings['enabled'] = '1';
    update_option(WEBMCP_CANARY_OPTION, $settings);
    webmcp_canary_clear_insights_cache();
    webmcp_canary_redirect_settings('updated', __('Issued and saved the site key.', 'nurevo-webmcp'));
}

add_action('admin_post_webmcp_canary_regenerate_site_key', 'webmcp_canary_regenerate_site_key_action');
function webmcp_canary_regenerate_site_key_action() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to perform this action.', 'nurevo-webmcp'));
    }
    check_admin_referer('webmcp_canary_regenerate_site_key');
    $settings = webmcp_canary_settings();
    if (empty($settings['site_key'])) {
        webmcp_canary_redirect_settings('error', __('There is no site key to regenerate.', 'nurevo-webmcp'));
    }
    $result = webmcp_canary_api_request('api/site-key/regenerate', array(
        'siteKey' => $settings['site_key'],
    ));
    if (is_wp_error($result)) {
        webmcp_canary_redirect_settings('error', $result->get_error_message());
    }
    $settings['site_key'] = sanitize_text_field($result['siteKey']);
    update_option(WEBMCP_CANARY_OPTION, $settings);
    webmcp_canary_clear_insights_cache();
    webmcp_canary_redirect_settings('updated', __('Regenerated and saved the site key. The old key has been disabled.', 'nurevo-webmcp'));
}

add_action('admin_post_webmcp_canary_disable_site_key', 'webmcp_canary_disable_site_key_action');
function webmcp_canary_disable_site_key_action() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to perform this action.', 'nurevo-webmcp'));
    }
    check_admin_referer('webmcp_canary_disable_site_key');
    $settings = webmcp_canary_settings();
    if (empty($settings['site_key'])) {
        webmcp_canary_redirect_settings('error', __('There is no site key to disable.', 'nurevo-webmcp'));
    }
    $result = webmcp_canary_api_request('api/site-key/disable', array(
        'siteKey' => $settings['site_key'],
    ));
    if (is_wp_error($result)) {
        webmcp_canary_redirect_settings('error', $result->get_error_message());
    }
    $settings['site_key'] = '';
    $settings['enabled'] = '0';
    update_option(WEBMCP_CANARY_OPTION, $settings);
    webmcp_canary_clear_insights_cache();
    webmcp_canary_redirect_settings('updated', __('Disabled the site key.', 'nurevo-webmcp'));
}

function webmcp_canary_clear_insights_cache() {
    delete_transient(webmcp_canary_cache_key());
    delete_option(webmcp_canary_last_good_cache_key());
}

function webmcp_canary_get_site_insights($force_refresh = false) {
    $settings = webmcp_canary_settings();
    if (empty($settings['site_key'])) {
        return new WP_Error('webmcp_missing_site_key', __('The site key is not configured. Open WebMCP > Settings and configure it.', 'nurevo-webmcp'));
    }
    $api_bases = webmcp_canary_api_base_candidates();
    if (empty($api_bases)) {
        return new WP_Error('webmcp_missing_api_base', __('The tag.js URL is not configured. Open WebMCP > Settings and configure it.', 'nurevo-webmcp'));
    }

    $cache_key = webmcp_canary_cache_key();
    if (!$force_refresh) {
        $cached = get_transient($cache_key);
        if (is_array($cached)) {
            return $cached;
        }
    }

    $host = wp_parse_url(home_url(), PHP_URL_HOST);
    $last_error = null;
    foreach ($api_bases as $api_base) {
        $url = add_query_arg(
            array(
                'site_key' => $settings['site_key'],
                'host' => $host,
            ),
            trailingslashit($api_base) . 'api/site-insights'
        );
        $headers = array(
            'accept' => 'application/json',
        );
        if (!empty($settings['admin_token'])) {
            $headers['x-webmcp-admin-token'] = $settings['admin_token'];
        }
        $response = wp_remote_get($url, array(
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => $headers,
        ));
        if (is_wp_error($response)) {
            $last_error = $response;
            continue;
        }
        $status = wp_remote_retrieve_response_code($response);
        $raw_body = wp_remote_retrieve_body($response);
        $body = json_decode($raw_body, true);
        if ($status < 200 || $status >= 300) {
            /* translators: %d: HTTP status code returned by the WebMCP server. */
            $message = is_array($body) && !empty($body['error']) ? $body['error'] : sprintf(__('HTTP %d', 'nurevo-webmcp'), $status);
            /* translators: %s: Error message returned by the WebMCP server. */
            $last_error = new WP_Error('webmcp_insights_http_error', webmcp_canary_http_status_error_message($status, $message), array('status' => $status, 'url' => $url));
            continue;
        }
        if (!is_array($body)) {
            $last_error = new WP_Error('webmcp_insights_invalid_json', __('The WebMCP server returned invalid JSON.', 'nurevo-webmcp'));
            continue;
        }
        if (!webmcp_canary_validate_site_insights($body)) {
            $last_error = new WP_Error('webmcp_insights_invalid_shape', __('The WebMCP server response did not match the expected format.', 'nurevo-webmcp'));
            continue;
        }
        set_transient($cache_key, $body, WEBMCP_CANARY_INSIGHTS_CACHE_TTL);
        update_option(webmcp_canary_last_good_cache_key(), array(
            'saved_at' => time(),
            'body' => $body,
        ), false);
        return $body;
    }

    $fallback = webmcp_canary_cached_insights_fallback($last_error);
    if (is_array($fallback)) {
        return $fallback;
    }

    if (is_wp_error($last_error)) {
        return new WP_Error(
            'webmcp_insights_unreachable',
            webmcp_canary_connection_error_message($last_error),
            array('detail' => $last_error->get_error_message(), 'checked_urls' => $api_bases)
        );
    }
    return new WP_Error('webmcp_insights_unreachable', __('Could not connect to the WebMCP server. No response was received from any configured API URL.', 'nurevo-webmcp'), array('checked_urls' => $api_bases));
}

function webmcp_canary_cached_insights_fallback($last_error) {
    $cached = get_option(webmcp_canary_last_good_cache_key(), array());
    if (empty($cached['body']) || !is_array($cached['body']) || !webmcp_canary_validate_site_insights($cached['body'])) {
        return null;
    }
    $body = $cached['body'];
    $body['_webmcpWarning'] = array(
        'message' => __('Showing the last successfully fetched WebMCP data because the server is currently unreachable.', 'nurevo-webmcp'),
        'detail' => is_wp_error($last_error) ? $last_error->get_error_message() : '',
        'savedAt' => !empty($cached['saved_at']) ? intval($cached['saved_at']) : 0,
    );
    return $body;
}

function webmcp_canary_connection_error_message($last_error) {
    $settings = webmcp_canary_settings();
    if (empty($settings['tag_url'])) {
        return __('The tag.js URL is not configured. Open WebMCP > Settings and enter the public tag.js URL.', 'nurevo-webmcp');
    }
    if (empty($settings['site_key'])) {
        return __('The site key is not configured. Open WebMCP > Settings and issue or paste a site key.', 'nurevo-webmcp');
    }
    if (is_wp_error($last_error)) {
        $message = $last_error->get_error_message();
        if (stripos($message, 'timed out') !== false || stripos($message, 'cURL error 28') !== false) {
            return sprintf(
                /* translators: %d: HTTP timeout in seconds. */
                __('The WebMCP server did not respond within %d seconds. The URL may be unreachable from WordPress, the Worker may be slow, or Docker/network egress may be blocked.', 'nurevo-webmcp'),
                WEBMCP_CANARY_HTTP_TIMEOUT
            );
        }
        if (stripos($message, 'Could not resolve host') !== false || stripos($message, 'Name or service not known') !== false) {
            return __('WordPress could not resolve the WebMCP host name. Check the tag.js URL and DNS/network settings.', 'nurevo-webmcp');
        }
        if (stripos($message, 'SSL') !== false || stripos($message, 'certificate') !== false) {
            return __('WordPress could not verify the WebMCP HTTPS certificate. Check the public Worker URL and server certificate.', 'nurevo-webmcp');
        }
    }
    return __('Could not connect to the WebMCP server. Check the tag.js URL, site key, Docker network, and production Worker status.', 'nurevo-webmcp');
}

function webmcp_canary_http_status_error_message($status, $message) {
    if (intval($status) === 403 || intval($status) === 401) {
        return sprintf(
            /* translators: %s: Server error message. */
            __('The WebMCP server rejected the site key or admin token: %s', 'nurevo-webmcp'),
            $message
        );
    }
    if (intval($status) === 404) {
        return sprintf(
            /* translators: %s: Server error message. */
            __('The configured WebMCP URL responded, but the expected API endpoint was not found: %s', 'nurevo-webmcp'),
            $message
        );
    }
    return sprintf(
        /* translators: %s: Server error message. */
        __('The WebMCP server returned an error: %s', 'nurevo-webmcp'),
        $message
    );
}

function webmcp_canary_validate_site_insights($body) {
    if (!is_array($body)) {
        return false;
    }
    if (!array_key_exists('dataSufficiency', $body) || !is_array($body['dataSufficiency'])) {
        return false;
    }
    $required_keys = array('currentSubmissions', 'requiredSubmissions', 'remainingSubmissions', 'sufficient');
    foreach ($required_keys as $key) {
        if (!array_key_exists($key, $body['dataSufficiency'])) {
            return false;
        }
    }
    if (!array_key_exists('suggestions', $body) || !is_array($body['suggestions'])) {
        return false;
    }
    if (array_key_exists('basicStats', $body) && !is_null($body['basicStats']) && !is_array($body['basicStats'])) {
        return false;
    }
    if (array_key_exists('benchmark', $body) && !is_null($body['benchmark']) && !is_array($body['benchmark'])) {
        return false;
    }
    if (array_key_exists('forms', $body) && !is_array($body['forms'])) {
        return false;
    }
    return true;
}

function webmcp_canary_percent($value) {
    return number_format_i18n(round(floatval($value) * 100, 1), 1) . '%';
}

function webmcp_canary_should_force_refresh() {
    if (empty($_GET['webmcp_refresh'])) {
        return false;
    }
    $nonce = isset($_GET['_wpnonce']) ? sanitize_text_field(wp_unslash($_GET['_wpnonce'])) : '';
    return wp_verify_nonce($nonce, 'webmcp_canary_refresh');
}

function webmcp_canary_dashboard_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $insights = webmcp_canary_get_site_insights(webmcp_canary_should_force_refresh());
    ?>
    <div class="wrap webmcp-dashboard">
        <h1><?php echo esc_html__('WebMCP', 'nurevo-webmcp'); ?></h1>
        <p>
            <a class="button" href="<?php echo esc_url(wp_nonce_url(add_query_arg('webmcp_refresh', '1', menu_page_url('webmcp-canary', false)), 'webmcp_canary_refresh')); ?>">
                <?php echo esc_html__('Refresh data', 'nurevo-webmcp'); ?>
            </a>
        </p>
        <?php if (is_wp_error($insights)) : ?>
            <div class="notice notice-warning">
                <p><?php echo esc_html($insights->get_error_message()); ?></p>
                <?php $detail = $insights->get_error_data('webmcp_insights_unreachable'); ?>
                <?php if (!empty($detail['detail'])) : ?>
                    <p class="description"><?php echo esc_html($detail['detail']); ?></p>
                <?php endif; ?>
                <?php if (!empty($detail['checked_urls']) && is_array($detail['checked_urls'])) : ?>
                    <p class="description">
                        <?php echo esc_html__('Checked API origins:', 'nurevo-webmcp'); ?>
                        <?php echo esc_html(implode(', ', $detail['checked_urls'])); ?>
                    </p>
                <?php endif; ?>
                <p><?php echo esc_html__('Open WebMCP > Settings and configure the public tag.js URL and site key.', 'nurevo-webmcp'); ?></p>
            </div>
        <?php else : ?>
            <?php if (!empty($insights['_webmcpWarning'])) : ?>
                <div class="notice notice-warning">
                    <p><?php echo esc_html($insights['_webmcpWarning']['message']); ?></p>
                    <?php if (!empty($insights['_webmcpWarning']['savedAt'])) : ?>
                        <p class="description">
                            <?php
                            echo esc_html(
                                sprintf(
                                    /* translators: %s: Date/time of cached data. */
                                    __('Last successful fetch: %s', 'nurevo-webmcp'),
                                    wp_date(get_option('date_format') . ' ' . get_option('time_format'), intval($insights['_webmcpWarning']['savedAt']))
                                )
                            );
                            ?>
                        </p>
                    <?php endif; ?>
                    <?php if (!empty($insights['_webmcpWarning']['detail'])) : ?>
                        <p class="description"><?php echo esc_html($insights['_webmcpWarning']['detail']); ?></p>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
            <?php if (empty($insights['dataSufficiency']['sufficient'])) : ?>
            <?php webmcp_canary_render_collecting($insights); ?>
            <?php else : ?>
            <?php webmcp_canary_render_ready_dashboard($insights); ?>
            <?php endif; ?>
        <?php endif; ?>
        <div class="webmcp-service-link">
            <a href="https://nurevo.jp/dashboard"><?php echo esc_html__('Manage plans and view detailed analytics at nurevo.jp', 'nurevo-webmcp'); ?></a>
        </div>
    </div>
    <?php
}

function webmcp_canary_render_collecting($insights) {
    $current = intval($insights['dataSufficiency']['currentSubmissions'] ?? 0);
    $required = intval($insights['dataSufficiency']['requiredSubmissions'] ?? 20);
    $remaining = intval($insights['dataSufficiency']['remainingSubmissions'] ?? max(0, $required - $current));
    ?>
    <div class="webmcp-panel">
        <h2><?php echo esc_html__('Collecting data', 'nurevo-webmcp'); ?></h2>
        <p class="webmcp-large">
            <?php
            echo esc_html(
                sprintf(
                    /* translators: 1: Current submission count. 2: Remaining submission count before analysis starts. */
                    __('%1$d form submissions collected / %2$d remaining before analysis starts', 'nurevo-webmcp'),
                    intval($current),
                    intval($remaining)
                )
            );
            ?>
        </p>
        <progress class="webmcp-progress" value="<?php echo esc_attr($current); ?>" max="<?php echo esc_attr($required); ?>"></progress>
        <h3><?php echo esc_html__('What appears after data is collected', 'nurevo-webmcp'); ?></h3>
        <ul class="webmcp-list">
            <li><?php echo esc_html__('Form completion rate and fields with frequent drop-off.', 'nurevo-webmcp'); ?></li>
            <li><?php echo esc_html__('Improvement points based on real validation errors.', 'nurevo-webmcp'); ?></li>
            <li><?php echo esc_html__('Estimated completion-rate change after applying improvements.', 'nurevo-webmcp'); ?></li>
        </ul>
        <p class="description"><?php echo esc_html__('When the sample size is too low, the dashboard does not show guessed suggestions or inflated numbers.', 'nurevo-webmcp'); ?></p>
    </div>
    <?php webmcp_canary_render_form_sections($insights); ?>
    <?php
}

function webmcp_canary_render_ready_dashboard($insights) {
    if (!empty($insights['forms']) && is_array($insights['forms'])) {
        webmcp_canary_render_form_sections($insights);
        return;
    }
    $stats = $insights['basicStats'];
    $suggestions = is_array($insights['suggestions'] ?? null) ? $insights['suggestions'] : array();
    ?>
    <div class="webmcp-grid">
        <div class="webmcp-card">
            <span class="webmcp-label"><?php echo esc_html__('Form submissions this month', 'nurevo-webmcp'); ?></span>
            <strong><?php echo esc_html(number_format_i18n(intval($stats['monthlySubmissions'] ?? 0))); ?></strong>
        </div>
        <div class="webmcp-card">
            <span class="webmcp-label"><?php echo esc_html__('Completion rate', 'nurevo-webmcp'); ?></span>
            <strong><?php echo esc_html(webmcp_canary_percent($stats['completionRate'] ?? 0)); ?></strong>
        </div>
        <div class="webmcp-card">
            <span class="webmcp-label"><?php echo esc_html__('Top 3 drop-off fields', 'nurevo-webmcp'); ?></span>
            <?php webmcp_canary_render_dropoff_fields($stats['topDropoffFields'] ?? array()); ?>
        </div>
    </div>

    <?php webmcp_canary_render_benchmark($insights['benchmark'] ?? null); ?>

    <div class="webmcp-panel">
        <h2><?php echo esc_html__('Improvement suggestions', 'nurevo-webmcp'); ?></h2>
        <?php if (empty($suggestions)) : ?>
            <p><?php echo esc_html__('There are enough submissions, but no real-data-based improvement suggestions yet.', 'nurevo-webmcp'); ?></p>
        <?php else : ?>
            <ol class="webmcp-suggestions">
                <?php foreach ($suggestions as $suggestion) : ?>
                    <?php webmcp_canary_render_suggestion($suggestion); ?>
                <?php endforeach; ?>
            </ol>
        <?php endif; ?>
    </div>
    <?php
}

function webmcp_canary_render_form_sections($insights) {
    $forms = is_array($insights['forms'] ?? null) ? $insights['forms'] : array();
    if (empty($forms)) {
        return;
    }
    ?>
    <div class="webmcp-panel">
        <h2><?php echo esc_html__('Forms', 'nurevo-webmcp'); ?></h2>
        <?php foreach ($forms as $form) : ?>
            <?php webmcp_canary_render_form_section($form); ?>
        <?php endforeach; ?>
    </div>
    <?php
}

function webmcp_canary_render_form_section($form) {
    $label = $form['formName'] ?? $form['formId'] ?? $form['formHash'] ?? __('Unnamed form', 'nurevo-webmcp');
    $page = $form['page']['host'] ?? '';
    if (!empty($form['page']['pathname'])) {
        $page .= $form['page']['pathname'];
    }
    $sufficient = !empty($form['dataSufficiency']['sufficient']);
    $stats = is_array($form['basicStats'] ?? null) ? $form['basicStats'] : array();
    $suggestions = is_array($form['suggestions'] ?? null) ? $form['suggestions'] : array();
    ?>
    <section class="webmcp-form-section">
        <h3><?php echo esc_html($label); ?></h3>
        <p class="description">
            <?php echo esc_html($page); ?>
            <?php if (!empty($form['formHash'])) : ?>
                <span class="webmcp-hash"><?php echo esc_html($form['formHash']); ?></span>
            <?php endif; ?>
        </p>
        <?php if (!$sufficient) : ?>
            <p>
                <?php
                echo esc_html(
                    sprintf(
                        /* translators: 1: Current submission count. 2: Required submission count. */
                        __('%1$d / %2$d submissions collected for this form.', 'nurevo-webmcp'),
                        intval($form['dataSufficiency']['currentSubmissions'] ?? 0),
                        intval($form['dataSufficiency']['requiredSubmissions'] ?? 20)
                    )
                );
                ?>
            </p>
        <?php else : ?>
            <div class="webmcp-grid">
                <div class="webmcp-card">
                    <span class="webmcp-label"><?php echo esc_html__('Form submissions this month', 'nurevo-webmcp'); ?></span>
                    <strong><?php echo esc_html(number_format_i18n(intval($stats['monthlySubmissions'] ?? 0))); ?></strong>
                </div>
                <div class="webmcp-card">
                    <span class="webmcp-label"><?php echo esc_html__('Completion rate', 'nurevo-webmcp'); ?></span>
                    <strong><?php echo esc_html(webmcp_canary_percent($stats['completionRate'] ?? 0)); ?></strong>
                </div>
                <div class="webmcp-card">
                    <span class="webmcp-label"><?php echo esc_html__('Top 3 drop-off fields', 'nurevo-webmcp'); ?></span>
                    <?php webmcp_canary_render_dropoff_fields($stats['topDropoffFields'] ?? array()); ?>
                </div>
            </div>
            <?php webmcp_canary_render_benchmark($form['benchmark'] ?? null); ?>
            <?php if (empty($suggestions)) : ?>
                <p><?php echo esc_html__('There are enough submissions, but no real-data-based improvement suggestions yet.', 'nurevo-webmcp'); ?></p>
            <?php else : ?>
                <ol class="webmcp-suggestions">
                    <?php foreach ($suggestions as $suggestion) : ?>
                        <?php webmcp_canary_render_suggestion($suggestion); ?>
                    <?php endforeach; ?>
                </ol>
            <?php endif; ?>
        <?php endif; ?>
    </section>
    <?php
}

function webmcp_canary_render_dropoff_fields($fields) {
    if (empty($fields)) {
        echo '<p>' . esc_html__('No notable drop-off fields yet.', 'nurevo-webmcp') . '</p>';
        return;
    }
    echo '<ol class="webmcp-compact-list">';
    foreach (array_slice($fields, 0, 3) as $field) {
        printf(
            '<li><strong>%1$s</strong> <span>%2$s</span></li>',
            esc_html($field['key'] ?? $field['selector'] ?? ''),
            esc_html(
                sprintf(
                    /* translators: %d: Number of validation issues for a field. */
                    _n('%d issue', '%d issues', intval($field['failures'] ?? 0), 'nurevo-webmcp'),
                    intval($field['failures'] ?? 0)
                )
            )
        );
    }
    echo '</ol>';
}

function webmcp_canary_render_benchmark($benchmark) {
    if (!is_array($benchmark)) {
        return;
    }
    ?>
    <div class="webmcp-panel">
        <h2><?php echo esc_html__('Industry benchmark', 'nurevo-webmcp'); ?></h2>
        <?php if (isset($benchmark['currentCompletionRate'])) : ?>
            <p><?php echo esc_html__('Your completion rate', 'nurevo-webmcp'); ?>: <strong><?php echo esc_html(webmcp_canary_percent($benchmark['currentCompletionRate'])); ?></strong></p>
        <?php endif; ?>
        <?php if (isset($benchmark['peerAverageCompletionRate'])) : ?>
            <p><?php echo esc_html__('Peer average completion rate', 'nurevo-webmcp'); ?>: <strong><?php echo esc_html(webmcp_canary_percent($benchmark['peerAverageCompletionRate'])); ?></strong></p>
        <?php endif; ?>
        <?php if (isset($benchmark['rankPercentile'])) : ?>
            <p><?php echo esc_html__('Rank percentile', 'nurevo-webmcp'); ?>: <strong><?php echo esc_html(number_format_i18n(floatval($benchmark['rankPercentile']))); ?></strong></p>
        <?php endif; ?>
    </div>
    <?php
}

function webmcp_canary_render_suggestion($suggestion) {
    $has_effect = isset($suggestion['expectedEffect']['value']);
    $effect = $has_effect ? intval($suggestion['expectedEffect']['value']) : 0;
    $basis = $suggestion['expectedEffect']['basis'] ?? '';
    ?>
    <li class="webmcp-suggestion">
        <div>
            <h3><?php echo esc_html($suggestion['title'] ?? __('Improvement suggestion', 'nurevo-webmcp')); ?></h3>
            <?php if ($has_effect) : ?>
            <p class="webmcp-effect">
                <?php
                echo esc_html(
                    sprintf(
                        /* translators: %d: Expected completion-rate lift in percentage points. */
                        __('Expected effect: completion rate +%dpt', 'nurevo-webmcp'),
                        intval($effect)
                    )
                );
                ?>
            </p>
            <?php endif; ?>
            <?php if (!empty($suggestion['reason'])) : ?>
                <p><?php echo esc_html($suggestion['reason']); ?></p>
            <?php endif; ?>
            <?php if (!empty($basis)) : ?>
                <p class="description"><?php echo esc_html($basis); ?></p>
            <?php endif; ?>
        </div>
    </li>
    <?php
}

function webmcp_canary_dashboard_styles() {
    return <<<'CSS'
        .webmcp-dashboard {
            max-width: 1180px;
            color: #1d1d1f;
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
        }
        .webmcp-dashboard h1 {
            font-size: 40px;
            line-height: 1.08;
            letter-spacing: 0;
            margin: 28px 0 10px;
            font-weight: 700;
        }
        .webmcp-dashboard h2 {
            color: #1d1d1f;
            font-size: 24px;
            letter-spacing: 0;
            margin: 0 0 14px;
            font-weight: 700;
        }
        .webmcp-dashboard h3 {
            color: #1d1d1f;
            font-size: 17px;
            letter-spacing: 0;
            margin: 0 0 8px;
            font-weight: 700;
        }
        .webmcp-dashboard > p:first-of-type {
            display: flex;
            justify-content: flex-end;
            margin: -38px 0 22px;
        }
        .webmcp-dashboard .button {
            border-radius: 999px;
            border-color: transparent;
            background: #0071e3;
            color: #fff;
            box-shadow: none;
            font-weight: 600;
            min-height: 34px;
            padding: 0 16px;
        }
        .webmcp-dashboard .button:hover,
        .webmcp-dashboard .button:focus {
            background: #0077ed;
            color: #fff;
        }
        .webmcp-dashboard .button[aria-disabled="true"],
        .webmcp-dashboard .button:disabled {
            background: #f5f5f7;
            color: #6e6e73;
            border: 1px solid #e5e5ea;
        }
        .webmcp-dashboard .webmcp-panel,
        .webmcp-dashboard .webmcp-card {
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid rgba(0, 0, 0, 0.06);
            border-radius: 22px;
            box-shadow: 0 18px 45px rgba(0, 0, 0, 0.07);
            padding: 24px;
            margin: 18px 0;
        }
        .webmcp-dashboard .webmcp-panel {
            background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,250,252,0.94));
        }
        .webmcp-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
        }
        .webmcp-card {
            min-height: 132px;
        }
        .webmcp-card strong {
            display: block;
            font-size: 36px;
            line-height: 1;
            margin-top: 8px;
            letter-spacing: 0;
        }
        .webmcp-label {
            color: #6e6e73;
            font-size: 13px;
            font-weight: 600;
        }
        .webmcp-large {
            font-size: 22px;
            color: #1d1d1f;
            font-weight: 650;
        }
        .webmcp-progress {
            width: 100%;
            height: 10px;
            border: 0;
            border-radius: 999px;
            overflow: hidden;
            accent-color: #0071e3;
        }
        .webmcp-list {
            list-style: disc;
            margin-left: 20px;
            color: #424245;
        }
        .webmcp-compact-list {
            margin: 8px 0 0 18px;
            color: #424245;
        }
        .webmcp-suggestions {
            margin-left: 0;
            padding-left: 0;
        }
        .webmcp-suggestion {
            list-style: none;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            padding: 18px 0;
        }
        .webmcp-suggestion:first-child {
            border-top: 0;
        }
        .webmcp-form-section {
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            padding: 22px 0;
        }
        .webmcp-form-section:first-of-type {
            border-top: 0;
        }
        .webmcp-hash {
            display: inline-block;
            margin-left: 8px;
            font-family: monospace;
            color: #86868b;
            background: #f5f5f7;
            border-radius: 999px;
            padding: 2px 8px;
        }
        .webmcp-effect {
            color: #0071e3;
            font-weight: 600;
        }
        .webmcp-service-link {
            margin: 20px 0;
            text-align: right;
        }
        .webmcp-dashboard .notice {
            border-left-color: #0071e3;
            border-radius: 14px;
            box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
        }
        .webmcp-dashboard .description {
            color: #6e6e73;
        }
        @media (max-width: 900px) {
            .webmcp-grid {
                grid-template-columns: 1fr;
            }
            .webmcp-dashboard > p:first-of-type {
                justify-content: flex-start;
                margin: 12px 0 20px;
            }
            .webmcp-dashboard h1 {
                font-size: 32px;
            }
        }
CSS;
}

function webmcp_canary_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $settings = webmcp_canary_settings();
    ?>
    <div class="wrap">
        <h1><?php echo esc_html__('Nurevo WebMCP Canary', 'nurevo-webmcp'); ?></h1>
        <p><?php echo esc_html__('Loads an external WebMCP tag for standard HTML forms and common WordPress form plugins.', 'nurevo-webmcp'); ?></p>
        <?php if (!empty($_GET['webmcp_message']) && !empty($_GET['_wpnonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_wpnonce'])), 'webmcp_canary_notice')) : ?>
            <?php $webmcp_status = isset($_GET['webmcp_status']) ? sanitize_key(wp_unslash($_GET['webmcp_status'])) : ''; ?>
            <?php $webmcp_message = sanitize_text_field(wp_unslash($_GET['webmcp_message'])); ?>
            <?php $notice_class = ($webmcp_status === 'error') ? 'notice-error' : 'notice-success'; ?>
            <div class="notice <?php echo esc_attr($notice_class); ?> is-dismissible">
                <p><?php echo esc_html($webmcp_message); ?></p>
            </div>
        <?php endif; ?>
        <form action="options.php" method="post">
            <?php
            settings_fields('webmcp_canary');
            do_settings_sections('webmcp_canary');
            submit_button();
            ?>
        </form>
        <hr>
        <h2><?php echo esc_html__('Site key actions', 'nurevo-webmcp'); ?></h2>
        <p><?php echo esc_html__('Issue a site key for this WordPress domain, save it automatically, or rotate/disable the current key.', 'nurevo-webmcp'); ?></p>
        <div>
            <?php if (empty($settings['site_key'])) : ?>
                <form action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post" style="display:inline-block">
                    <?php wp_nonce_field('webmcp_canary_issue_site_key'); ?>
                    <input type="hidden" name="action" value="webmcp_canary_issue_site_key">
                    <?php submit_button(__('Issue site key', 'nurevo-webmcp'), 'primary', 'submit', false); ?>
                </form>
            <?php else : ?>
                <form action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post" style="display:inline-block;margin-right:8px">
                    <?php wp_nonce_field('webmcp_canary_regenerate_site_key'); ?>
                    <input type="hidden" name="action" value="webmcp_canary_regenerate_site_key">
                    <?php submit_button(__('Regenerate site key', 'nurevo-webmcp'), 'secondary', 'submit', false); ?>
                </form>
                <form action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post" style="display:inline-block">
                    <?php wp_nonce_field('webmcp_canary_disable_site_key'); ?>
                    <input type="hidden" name="action" value="webmcp_canary_disable_site_key">
                    <?php submit_button(__('Disable site key', 'nurevo-webmcp'), 'delete', 'submit', false); ?>
                </form>
            <?php endif; ?>
        </div>
    </div>
    <?php
}

add_action('wp_enqueue_scripts', 'webmcp_canary_enqueue_tag');
function webmcp_canary_enqueue_tag() {
    if (is_admin()) {
        return;
    }
    $settings = webmcp_canary_settings();
    if ($settings['enabled'] !== '1' || empty($settings['tag_url'])) {
        return;
    }

    wp_register_script(
        'webmcp-canary-tag',
        esc_url_raw($settings['tag_url']),
        array(),
        WEBMCP_CANARY_VERSION,
        false
    );
    wp_enqueue_script('webmcp-canary-tag');
}

add_filter('script_loader_tag', 'webmcp_canary_script_loader_tag', 10, 2);
function webmcp_canary_script_loader_tag($tag, $handle) {
    if ($handle !== 'webmcp-canary-tag') {
        return $tag;
    }
    $settings = webmcp_canary_settings();
    $site_key = $settings['site_key'];
    $attributes = ' async data-webmcp-platform="wordpress"';
    if (!empty($site_key)) {
        $attributes .= ' data-webmcp-site-key="' . esc_attr($site_key) . '"';
    }

    return preg_replace(sprintf('/<%s\b/', 'script'), '$0' . $attributes, $tag, 1);
}
