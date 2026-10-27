<?php
define('ABSPATH', __DIR__);
define('MINUTE_IN_SECONDS', 60);
define('DAY_IN_SECONDS', 86400);
define('HOUR_IN_SECONDS', 3600);

$GLOBALS['webmcp_test_options'] = array('admin_email' => 'owner@example.test');
$GLOBALS['webmcp_test_hooks'] = array();
$GLOBALS['webmcp_test_active_plugins'] = array();
$GLOBALS['webmcp_test_posts'] = array();
$GLOBALS['webmcp_test_remote_get'] = array();
$GLOBALS['webmcp_test_remote_get_log'] = array();

class WP_Error {
    public $code;
    public $message;
    public function __construct($code = '', $message = '') { $this->code = $code; $this->message = $message; }
    public function get_error_code() { return $this->code; }
    public function get_error_message() { return $this->message; }
}
function is_wp_error($value) { return $value instanceof WP_Error; }
function get_option($key, $default = false) { return array_key_exists($key, $GLOBALS['webmcp_test_options']) ? $GLOBALS['webmcp_test_options'][$key] : $default; }
function wp_parse_args($args, $defaults = array()) { return array_merge($defaults, is_array($args) ? $args : array()); }
function add_action($hook, $callback, $priority = 10) { $GLOBALS['webmcp_test_hooks'][$hook][] = $callback; }
function add_filter($hook, $callback, $priority = 10) { $GLOBALS['webmcp_test_hooks'][$hook][] = $callback; }
function register_activation_hook($file, $callback) { $GLOBALS['webmcp_test_hooks']['activation'][] = $callback; }
function __($text) { return $text; }
function sanitize_key($value) { return preg_replace('/[^a-z0-9_\-]/', '', strtolower((string) $value)); }
function sanitize_text_field($value) { return trim(strip_tags((string) $value)); }
function sanitize_textarea_field($value) { return trim(strip_tags((string) $value)); }
function sanitize_email($value) { return filter_var($value, FILTER_SANITIZE_EMAIL); }
function esc_url_raw($value) { return filter_var($value, FILTER_SANITIZE_URL); }
function wp_parse_url($value, $component = -1) { return parse_url($value, $component); }
function trailingslashit($value) { return rtrim($value, '/') . '/'; }
function wp_json_encode($value, $flags = 0, $depth = 512) { return json_encode($value, $flags, $depth); }
function add_settings_error() {}
function wp_remote_post($url, $args) { $GLOBALS['webmcp_test_last_remote'] = array('url' => $url, 'args' => $args); $GLOBALS['webmcp_test_remote_log'][] = $GLOBALS['webmcp_test_last_remote']; return $GLOBALS['webmcp_test_remote'] ?? new WP_Error('offline', 'offline'); }
function wp_remote_retrieve_response_code($response) { return $response['status'] ?? 0; }
function wp_remote_retrieve_body($response) { return $response['body'] ?? ''; }
function is_plugin_active($plugin) { return in_array($plugin, $GLOBALS['webmcp_test_active_plugins'], true); }
function update_option($key, $value) { $GLOBALS['webmcp_test_options'][$key] = $value; return true; }
function wp_strip_all_tags($value) { return strip_tags((string) $value); }
function esc_textarea($value) { return htmlspecialchars((string) $value, ENT_QUOTES); }
function strip_shortcodes($value) { return preg_replace('/\[[^\]]+\]/', '', (string) $value); }
function get_posts($args = array()) {
    $posts = $GLOBALS['webmcp_test_posts'];
    if (!empty($args['meta_key'])) {
        $posts = array_values(array_filter($posts, function ($post) use ($args) {
            return is_object($post) && !empty($post->ID) && !empty(get_post_meta($post->ID, $args['meta_key'], true));
        }));
    }
    if (!empty($args['post__not_in'])) {
        $posts = array_values(array_filter($posts, function ($post) use ($args) {
            return !is_object($post) || empty($post->ID) || !in_array((int) $post->ID, $args['post__not_in'], true);
        }));
    }
    if (($args['fields'] ?? '') === 'ids') {
        return array_map(function ($post) { return (int) $post->ID; }, $posts);
    }
    return $posts;
}
$GLOBALS['webmcp_test_post_meta'] = array();
function get_post_meta($post_id, $key = '', $single = false) {
    $value = $GLOBALS['webmcp_test_post_meta'][(int) $post_id][$key] ?? null;
    if ($value === null) { return $single ? '' : array(); }
    return $single ? $value : array($value);
}
function update_post_meta($post_id, $key, $value) { $GLOBALS['webmcp_test_post_meta'][(int) $post_id][$key] = $value; return true; }
function delete_post_meta($post_id, $key) { unset($GLOBALS['webmcp_test_post_meta'][(int) $post_id][$key]); return true; }
function register_post_meta($type, $key, $args) { $GLOBALS['webmcp_test_post_meta_registered'][$key] = array('type' => $type, 'args' => $args); return true; }
function get_the_ID() { return $GLOBALS['webmcp_test_the_id'] ?? (isset($GLOBALS['webmcp_test_queried']) && $GLOBALS['webmcp_test_queried'] ? (int) $GLOBALS['webmcp_test_queried']->ID : 0); }
function wp_is_post_revision($post_id) { return false; }
function checked($checked, $current = true, $echo = true) { $result = ((string) $checked === (string) $current) ? ' checked="checked"' : ''; if ($echo) { echo $result; } return $result; }
function selected($selected, $current = true, $echo = true) { $result = ((string) $selected === (string) $current) ? ' selected="selected"' : ''; if ($echo) { echo $result; } return $result; }
function wp_enqueue_script($handle, $src = '', $deps = array(), $ver = false, $in_footer = false) { $GLOBALS['webmcp_test_enqueued'][$handle] = array('src' => $src, 'deps' => $deps); }
function get_post_types($args = array()) { return array('post' => 'post', 'page' => 'page', 'attachment' => 'attachment'); }
function add_meta_box($id, $title, $callback, $screen = null, $context = 'advanced', $priority = 'default', $args = null) { $GLOBALS['webmcp_test_meta_boxes'][$screen] = array('id' => $id, 'args' => $args); }

/* ------------------------------------------------------------------ *
 * WooCommerce stubs
 *
 * Only the handful of methods the adapter calls. A real WC_Product has
 * hundreds; standing in for the ones actually used keeps the test honest about
 * what the plugin depends on.
 * ------------------------------------------------------------------ */
$GLOBALS['webmcp_test_products'] = array();
$GLOBALS['webmcp_test_currency'] = 'JPY';
$GLOBALS['webmcp_test_product_terms'] = array();

class WebmcpTestProduct {
    private $data;
    public function __construct($data) { $this->data = $data; }
    public function get_id() { return $this->data['id'] ?? 0; }
    public function get_name() { return $this->data['name'] ?? ''; }
    public function get_permalink() { return $this->data['url'] ?? ''; }
    public function get_sku() { return $this->data['sku'] ?? ''; }
    public function get_price() { return $this->data['price'] ?? ''; }
    public function is_in_stock() { return array_key_exists('in_stock', $this->data) ? $this->data['in_stock'] : true; }
}
function wc_get_products($args) {
    $limit = isset($args['limit']) ? (int) $args['limit'] : 10;
    return array_slice($GLOBALS['webmcp_test_products'], 0, $limit);
}
function get_woocommerce_currency() { return $GLOBALS['webmcp_test_currency']; }
function wp_get_post_terms($post_id, $taxonomy, $args = array()) {
    return $GLOBALS['webmcp_test_product_terms'][$post_id] ?? array();
}
function is_admin() { return false; }
function is_feed() { return false; }
function is_404() { return false; }
function is_search() { return false; }
// The queried post, for singular-page tests. null means an archive/front page.
$GLOBALS['webmcp_test_queried'] = null;
$GLOBALS['webmcp_test_front_page'] = true;
function is_singular() { return $GLOBALS['webmcp_test_queried'] !== null; }
function is_front_page() { return $GLOBALS['webmcp_test_front_page']; }
function get_queried_object() { return $GLOBALS['webmcp_test_queried']; }
function get_queried_object_id() { return $GLOBALS['webmcp_test_queried'] ? (int) $GLOBALS['webmcp_test_queried']->ID : 0; }
function has_shortcode($content, $tag) { return strpos((string) $content, '[' . $tag) !== false; }
function has_block($name, $content) { return strpos((string) $content, '<!-- wp:' . $name) !== false; }
function add_shortcode($tag, $callback) { $GLOBALS['webmcp_test_shortcodes'][$tag] = $callback; }
function register_block_type($name, $args = array()) { $GLOBALS['webmcp_test_blocks'][$name] = $args; return true; }
function wp_add_inline_script($handle, $data) { $GLOBALS['webmcp_test_inline_scripts'][$handle] = $data; return true; }
function is_home() { return false; }
function home_url($path = '') { return 'https://example.test' . ($path === '/' ? '/' : $path); }
function get_bloginfo($field) {
    $values = array('name' => 'Example Store', 'description' => 'Example description', 'language' => 'ja', 'charset' => 'UTF-8');
    return $values[$field] ?? '';
}
function get_theme_mod() { return false; }
// The diagnosis is worded by the service, so the plugin has to tell it which
// language to answer in. Settable per test.
$GLOBALS['webmcp_test_locale'] = 'ja';
function get_locale() { return $GLOBALS['webmcp_test_locale']; }
function register_deactivation_hook($file, $callback) { $GLOBALS['webmcp_test_hooks']['deactivation'][] = $callback; }
function delete_option($key) { unset($GLOBALS['webmcp_test_options'][$key]); return true; }
function add_query_arg($args, $url) {
    $separator = strpos($url, '?') === false ? '?' : '&';
    return $url . $separator . http_build_query($args);
}
function wp_remote_get($url, $args = array()) {
    $GLOBALS['webmcp_test_remote_get_log'][] = $url;
    foreach ($GLOBALS['webmcp_test_remote_get'] as $needle => $response) {
        if (strpos($url, $needle) !== false) { return $response; }
    }
    return new WP_Error('offline', 'offline');
}
function get_the_title($post) { return is_object($post) ? ($post->post_title ?? '') : ''; }
function get_permalink($post) { return is_object($post) ? ($post->permalink ?? '') : ''; }
function current_user_can($cap = '', ...$args) { return !in_array($cap, $GLOBALS['webmcp_test_denied_caps'] ?? array(), true); }
function admin_url($path = '') { return 'https://example.test/wp-admin/' . ltrim($path, '/'); }
if (!function_exists('do_action')) { function do_action(...$args) {} }
if (!function_exists('get_current_screen')) { function get_current_screen() { return $GLOBALS['webmcp_test_screen'] ?? null; } }
function esc_html($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
function esc_html__($text) { return esc_html($text); }
function esc_html_e($text) { echo esc_html($text); }
function esc_attr($value) { return esc_html($value); }
function esc_url($value) { return esc_html($value); }
function wp_nonce_url($url, $action) { return $url . '&_wpnonce=' . md5($action); }
function wp_verify_nonce($nonce, $action) { return $nonce === md5($action); }
function wp_unslash($value) { return $value; }
function wp_next_scheduled() { return false; }
function wp_schedule_event($timestamp, $recurrence, $hook) { $GLOBALS['webmcp_test_scheduled'][] = $hook; $GLOBALS['webmcp_test_scheduled_by_blog'][$GLOBALS['webmcp_test_blog']][] = $hook; return true; }
function wp_clear_scheduled_hook($hook) { $GLOBALS['webmcp_test_cleared'][] = $hook; $GLOBALS['webmcp_test_cleared_by_blog'][$GLOBALS['webmcp_test_blog']][] = $hook; return 1; }
// Multisite stand-ins: a network of three sites, off unless a test turns it on.
$GLOBALS['webmcp_test_blog'] = 1;
$GLOBALS['webmcp_test_multisite'] = false;
$GLOBALS['webmcp_test_network_active'] = false;
function is_multisite() { return $GLOBALS['webmcp_test_multisite']; }
function get_sites($args = array()) { return array(1, 2, 3); }
function switch_to_blog($id) { $GLOBALS['webmcp_test_blog_stack'][] = $GLOBALS['webmcp_test_blog']; $GLOBALS['webmcp_test_blog'] = (int) $id; return true; }
function restore_current_blog() { $GLOBALS['webmcp_test_blog'] = array_pop($GLOBALS['webmcp_test_blog_stack']); return true; }
function is_plugin_active_for_network($plugin) { return $GLOBALS['webmcp_test_network_active'] && $plugin === 'nurevo-webmcp/nurevo-webmcp.php'; }
function plugin_basename($file) { return 'nurevo-webmcp/' . basename($file); }
function plugins_url($path = '', $plugin = '') { return 'https://example.test/wp-content/plugins/webmcp-canary/' . ltrim($path, '/'); }
function wp_date($format, $timestamp = null) { return gmdate($format, $timestamp ?? time()); }
function get_current_user_id() { return $GLOBALS['webmcp_test_user_id'] ?? 1; }
$GLOBALS['webmcp_test_user_meta'] = array();
function get_user_meta($user_id, $key = '', $single = false) { return $GLOBALS['webmcp_test_user_meta'][$user_id][$key] ?? ($single ? '' : array()); }
function update_user_meta($user_id, $key, $value) { $GLOBALS['webmcp_test_user_meta'][$user_id][$key] = $value; return true; }
function wp_create_nonce($action = -1) { return md5($action); }
function wp_add_dashboard_widget($id, $title, $callback) { $GLOBALS['webmcp_test_widgets'][$id] = $title; }
function wp_kses_post($html) { return $html; }
function wp_add_privacy_policy_content($name, $text) { $GLOBALS['webmcp_test_privacy'][$name] = $text; }
$GLOBALS['webmcp_test_transients'] = array();
function get_transient($key) { return $GLOBALS['webmcp_test_transients'][$key] ?? false; }
function set_transient($key, $value, $ttl = 0) { $GLOBALS['webmcp_test_transients'][$key] = $value; return true; }
function delete_transient($key) { unset($GLOBALS['webmcp_test_transients'][$key]); return true; }
function apply_filters($hook, $value, ...$args) {
    foreach ($GLOBALS['webmcp_test_hooks'][$hook] ?? array() as $callback) { $value = $callback($value, ...$args); }
    return $value;
}
function wp_nonce_field($action = -1, $name = '_wpnonce') { echo '<input type="hidden" name="' . $name . '" value="' . md5($action) . '">'; }
function esc_attr_e($text) { echo esc_attr($text); }
function add_submenu_page($parent, $page_title, $menu_title, $capability, $slug, $callback = '') { $GLOBALS['webmcp_test_submenus'][$slug] = array('parent' => $parent, 'title' => $menu_title, 'capability' => $capability, 'callback' => $callback); return $slug; }

// WP-CLI and REST stand-ins, so includes/cli.php and includes/rest.php load.
define('WP_CLI', true);
class WebmcpTestCliError extends Exception {}
class WP_CLI {
    public static $commands = array();
    public static $out = array();
    public static function add_command($name, $class) { self::$commands[$name] = $class; }
    public static function line($message = '') { self::$out[] = $message; }
    public static function success($message) { self::$out[] = 'Success: ' . $message; }
    public static function error($message) { throw new WebmcpTestCliError($message); }
}
function register_rest_route($namespace, $route, $args) { $GLOBALS['webmcp_test_rest_routes'][$namespace . $route] = $args; return true; }

require dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/nurevo-webmcp.php';

function expect($condition, $message) {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

/**
 * Source text of one top-level function, for assertions about what a specific
 * function may or may not reference. Brace-counted rather than regex-matched so
 * that nested blocks do not end the body early.
 */
function webmcp_test_function_body($source, $name) {
    $start = strpos($source, "function {$name}(");
    if ($start === false) {
        return '';
    }
    $open = strpos($source, '{', $start);
    if ($open === false) {
        return '';
    }
    $depth = 0;
    for ($i = $open, $len = strlen($source); $i < $len; $i++) {
        if ($source[$i] === '{') {
            $depth++;
        } elseif ($source[$i] === '}') {
            $depth--;
            if ($depth === 0) {
                return substr($source, $start, $i - $start + 1);
            }
        }
    }
    return '';
}

$defaults = webmcp_canary_default_settings();
expect($defaults['site_id'] === '', 'site_id default');
expect($defaults['plan'] === 'free', 'free plan default');
expect($defaults['license_key'] === '', 'license key is separate and empty by default');
expect($defaults['avoid_schema_duplicates'] === '1', 'SEO schema duplicate avoidance defaults to on');

/* Saving a license binds it to this domain, which is what registers the site.
 * The old call only asked "which plan", so a self-installed plugin never got a
 * site_id and could not sync its profile or keep a diagnosis history. */
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array('site_id' => 'site-1'));
$GLOBALS['webmcp_test_remote'] = array('status' => 200, 'body' => '{"ok":true,"plan":"standard","site_id":"bound01","site_key":"nrv_issued","profile_token":"nrvp_issued","domain":"example.test","bound":true}');
$sanitized = webmcp_canary_sanitize_settings(array('enabled' => '1', 'tag_url' => 'https://nurevo.jp/tag.js', 'site_key' => 'nrv_site', 'license_key' => 'nrv_canary_standard_3000'));
expect($sanitized['license_key'] === 'nrv_canary_standard_3000', 'license is stored separately from site key');
expect($sanitized['plan'] === 'standard', 'a bound license sets the standard plan');

// The credentials the service issued are adopted, or the site stays unregistered.
expect($sanitized['site_id'] === 'bound01', 'the issued site_id is adopted');
expect($sanitized['site_key'] === 'nrv_issued', 'the issued site_key is adopted');
expect($sanitized['profile_token'] === 'nrvp_issued', 'the issued profile token is adopted');

// What goes up is the license and this site's own address - never a site_key,
// which is public and proves nothing.
$sent = json_decode($GLOBALS['webmcp_test_last_remote']['args']['body'], true);
expect(strpos($GLOBALS['webmcp_test_last_remote']['url'], '/api/license/bind') !== false, 'the plugin calls the bind endpoint');
expect($sent['license'] === 'nrv_canary_standard_3000', 'the license is what authenticates the call');
expect($sent['domain'] === home_url('/'), 'this site\'s own address is what gets bound');
expect($sent['install_type'] === 'wp', 'the install type is declared');
expect(!isset($sent['site_key']), 'the public site key is not sent as a credential');

$GLOBALS['webmcp_test_remote'] = array('status' => 404, 'body' => '{"ok":false,"error":"invalid_license"}');
$invalid = webmcp_canary_sanitize_settings(array('tag_url' => 'https://nurevo.jp/tag.js', 'site_key' => 'nrv_site', 'license_key' => 'invalid'));
expect($invalid['plan'] === 'free', 'invalid license falls back to free');

// A refusal that is about seats, not about the key, must say so: telling the
// operator the key is invalid would send them hunting for the wrong problem.
$GLOBALS['webmcp_test_remote'] = array('status' => 409, 'body' => '{"ok":false,"error":"seat_limit_reached"}');
$seats = webmcp_canary_bind_license('nrv_canary_standard_3000', 'https://nurevo.jp/tag.js');
expect(is_wp_error($seats) && $seats->get_error_code() === 'webmcp_license_seats', 'a seat limit is reported as a seat limit');
$GLOBALS['webmcp_test_remote'] = array('status' => 409, 'body' => '{"ok":false,"error":"license_not_provisioned"}');
$unprovisioned = webmcp_canary_bind_license('nrv_canary_standard_3000', 'https://nurevo.jp/tag.js');
expect(is_wp_error($unprovisioned) && $unprovisioned->get_error_code() === 'webmcp_license_not_provisioned', 'an unprovisioned license is reported distinctly');

// No license means no account: nothing is sent at all.
$GLOBALS['webmcp_test_last_remote'] = null;
$free = webmcp_canary_sanitize_settings(array('enabled' => '1', 'tag_url' => 'https://nurevo.jp/tag.js', 'license_key' => ''));
expect($free['plan'] === 'free', 'no license means the free plan');
expect($GLOBALS['webmcp_test_last_remote'] === null, 'a site with no license contacts nothing');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $sanitized;
$GLOBALS['webmcp_test_remote'] = new WP_Error('offline', 'offline');
$offline = webmcp_canary_sanitize_settings(array('tag_url' => 'https://nurevo.jp/tag.js', 'site_key' => 'nrv_site', 'license_key' => 'nrv_canary_standard_3000'));
expect($offline['plan'] === 'standard', 'network failure preserves previously verified plan');

$score = array(
    'score' => 82,
    'band' => 'green',
    'gatePassed' => true,
    'checks' => array(array('id' => 'schema', 'label' => 'Schema', 'status' => 'OK', 'message' => 'Good', 'fixable' => true)),
);
expect(webmcp_canary_validate_aeo_score($score), 'valid U1 response');
expect(webmcp_canary_aeo_view($score)['color'] === '#1a9c6b', 'green band color');
expect(webmcp_canary_aeo_view(array_merge($score, array('band' => 'yellow')))['heading'] === 'Nearly there - a little more and you are green', 'yellow heading');
expect(webmcp_canary_aeo_view(array_merge($score, array('band' => 'red')))['heading'] === 'AI is barely reading your site', 'red heading');

/* --- Score v2: the AEO score with its two sub-scores, from the service ----- */
$legacy_view = webmcp_canary_aeo_view($score);
expect($legacy_view['breakdown']['readiness'] === 82 && $legacy_view['breakdown']['measured'] === false, 'a response without score v2 is the readiness score alone');
$legacy_html = webmcp_canary_aeo_breakdown_html($legacy_view['breakdown']);
expect(strpos($legacy_html, 'AI readiness (on-site): 82 / 100') !== false, 'labelled as AI readiness');
expect(strpos($legacy_html, 'AI visibility not measured yet. This score is your AI readiness only.') !== false, 'and says visibility was not measured');
$v2_score = array_merge($score, array(
    'score' => 83, 'band' => 'green', 'score_version' => 'aeo-v2', 'basis' => 'combined',
    'readiness' => array('score' => 97, 'band' => 'green'),
    'visibility' => array('measured' => true, 'score' => 14, 'answers' => 10, 'named' => 0, 'cited' => 0, 'appeared' => 0, 'share' => 0.167, 'window_days' => 90),
));
expect(webmcp_canary_validate_aeo_score($v2_score), 'a score v2 response is still a valid diagnosis');
$v2_view = webmcp_canary_aeo_view($v2_score);
expect($v2_view['score'] === 83 && $v2_view['band'] === 'green', 'the gauge shows the AEO score the dashboard shows');
expect($v2_view['breakdown'] === array('readiness' => 97, 'measured' => true, 'visibility' => 14, 'answers' => 10, 'appeared' => 0, 'window_days' => 90), 'with both sub-scores and what they rest on');
$v2_html = webmcp_canary_aeo_breakdown_html($v2_view['breakdown']);
expect(strpos($v2_html, 'AI readiness (on-site): 97 / 100') !== false && strpos($v2_html, 'AI visibility (measured): 14 / 100') !== false, 'both sub-scores are shown');
expect(strpos($v2_html, 'Based on 10 AI answers (0 named or cited, last 90 days).') !== false, 'based on N AI answers');
expect(strpos($v2_html, 'AI answers vary with the time of the run and the model.') !== false, 'with the variability notice');
expect(strpos($v2_html, 'NaN') === false && strpos($v2_html, '<script') === false, 'clean markup');
$unmeasured = webmcp_canary_aeo_view(array_merge($score, array('score' => 64, 'band' => 'yellow', 'score_version' => 'aeo-v2', 'basis' => 'readiness_only', 'readiness' => array('score' => 64, 'band' => 'yellow'), 'visibility' => array('measured' => false, 'score' => null, 'answers' => 0))));
expect($unmeasured['breakdown']['measured'] === false && $unmeasured['breakdown']['visibility'] === null, 'an unmeasured visibility is not invented');
expect(strpos(webmcp_canary_aeo_breakdown_html($unmeasured['breakdown']), 'AI visibility not measured yet') !== false, 'and is said to be unmeasured');
$hostile = webmcp_canary_aeo_breakdown(array_merge($v2_score, array('readiness' => array('score' => '<b>'), 'visibility' => array('measured' => true, 'score' => 500, 'answers' => -4, 'window_days' => 'x'))));
expect($hostile['readiness'] === 83 && $hostile['visibility'] === 100 && $hostile['answers'] === 0 && $hostile['window_days'] === 90, 'odd values from the service are clamped, not echoed');
expect(webmcp_canary_aeo_breakdown(null) === null && webmcp_canary_aeo_breakdown_html(null) === '', 'no diagnosis, no breakdown');

expect(webmcp_canary_aeo_alert(null) === null, 'no alert is invented before a diagnosis exists');
expect(webmcp_canary_aeo_alert($score) === null, 'an all-OK diagnosis shows no warning');
$alert = webmcp_canary_aeo_alert(array('checks' => array(
    array('id' => 'schema', 'label' => 'Structured data', 'status' => 'BAD', 'message' => '', 'fixable' => true),
    array('id' => 'coverage', 'label' => 'Key information coverage', 'status' => 'WARN', 'message' => '', 'fixable' => true),
    array('id' => 'llms', 'label' => 'llms.txt', 'status' => 'OK', 'message' => '', 'fixable' => true),
)));
expect(strpos($alert['summary'], 'Structured data, Key information coverage') !== false, 'the warning names the checks that actually failed');
expect(strpos($alert['summary'], 'llms.txt') === false, 'passing checks are not reported as problems');
$alert = webmcp_canary_aeo_alert(array('checks' => array_map(function ($index) {
    return array('id' => "c{$index}", 'label' => "Check {$index}", 'status' => 'BAD', 'message' => '', 'fixable' => false);
}, range(1, 5))));
expect(strpos($alert['summary'], '(and 2 more)') !== false, 'the warning summarizes the remaining findings');

$fixed = webmcp_canary_apply_aeo_fix(array('enabled' => '0', 'serve_schema' => '0'), 'schema');
expect($fixed['enabled'] === '1' && $fixed['serve_schema'] === '1', 'schema fix enables server output');
$fixed = webmcp_canary_apply_aeo_fix(array('enabled' => '0', 'serve_llms_txt' => '0'), 'llms');
expect($fixed['enabled'] === '1' && $fixed['serve_llms_txt'] === '1', 'llms fix enables llms.txt');
$fixed = webmcp_canary_apply_aeo_fix(array('enabled' => '0', 'allow_ai_crawlers' => '0'), 'ai_crawlers_allowed');
expect($fixed['enabled'] === '1' && $fixed['allow_ai_crawlers'] === '1', 'crawler fix enables robots rule');
expect(is_wp_error(webmcp_canary_apply_aeo_fix(array(), 'edge_access')), 'non-fixable check rejected');

$schema_graph = array(
    array('@type' => 'Organization', 'name' => 'Example'),
    array('@type' => 'WebSite', 'name' => 'Example'),
    array('@type' => array('WebPage', 'FAQPage'), 'name' => 'Mixed duplicate root'),
    array('@type' => 'FAQPage', 'mainEntity' => array()),
    array('@type' => 'OpeningHoursSpecification', 'opens' => '09:00'),
);
$compat_on = array('avoid_schema_duplicates' => '1');
$compat_off = array('avoid_schema_duplicates' => '0');
expect(webmcp_canary_filter_schema_graph($schema_graph, $compat_on, array()) === $schema_graph, 'no SEO plugin keeps the full Nurevo schema graph');
$yoast = array('wordpress-seo/wp-seo.php' => 'Yoast SEO');

/* Types the front page carries follow what the other plugin was actually
 * measured publishing, not merely whether it is installed. Until that
 * measurement exists they are not suppressed, because a gap is worse than a
 * duplicate: a duplicate shows up in the schema table and the diagnosis, a
 * missing address does not.
 *
 * FAQPage is the exception, and deliberately so. Yoast and Rank Math both ship
 * an FAQ block, and the FAQ it emits lives on an inner page the front-page
 * measurement never reads - so waiting for a measurement would mean waiting
 * forever while publishing a second FAQPage on every page that has one. */
$unmeasured = webmcp_canary_filter_schema_graph($schema_graph, $compat_on, $yoast);
$unmeasured_types = array();
foreach ($unmeasured as $node) {
    foreach (webmcp_canary_schema_node_types($node) as $node_type) { $unmeasured_types[$node_type] = true; }
}
expect(isset($unmeasured_types['Organization']) && isset($unmeasured_types['WebSite']),
    'with Yoast active but nothing measured yet, the measured types are still published');
expect(!isset($unmeasured_types['FAQPage']),
    'but FAQPage stands down on detection, because their FAQ is never on the front page');
expect(isset($unmeasured_types['OpeningHoursSpecification']),
    'and a type nobody else publishes is untouched');

/* Measured: Yoast publishes Organization, WebSite and WebPage completely. */
$measured_complete = array(
    'business' => array('state' => 'complete', 'id' => 'https://example.test/#rival'),
    'types' => array('Organization', 'WebSite', 'WebPage'),
    'conflict' => false,
    'measured_at' => time(),
    'signature' => 'test',
);
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, $measured_complete);
$filtered = webmcp_canary_filter_schema_graph($schema_graph, $compat_on, $yoast);
expect(count($filtered) === 1, 'a complete rival removes every overlapping Nurevo schema root');
expect($filtered[0]['@type'] === 'OpeningHoursSpecification',
    'only a type nobody else publishes survives a complete rival');
expect(webmcp_canary_filter_schema_graph($schema_graph, $compat_off, $yoast) === $schema_graph, 'compatibility toggle off preserves the full graph');
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);

$GLOBALS['webmcp_test_active_plugins'] = array('wordpress-seo/wp-seo.php');
$GLOBALS['webmcp_test_options']['wpseo_local'] = array(
    'location_name' => 'SEO Coffee',
    'location_address' => '東京都渋谷区神宮前1-2-3',
    'location_phone' => '03-0000-1111',
    'opening_hours' => '月-金 09:00-18:00',
    'location_business_type' => 'CafeOrCoffeeShop',
    'location_url' => 'https://coffee.example.test/',
);
$GLOBALS['webmcp_test_options']['blogdescription'] = 'WordPress description';
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array('business_phone' => '03-9999-9999'));
$filled = webmcp_canary_autofill_business_data();
$autofilled = $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION];
expect($autofilled['business_name'] === 'SEO Coffee', 'SEO local business name has first priority');
expect($autofilled['business_address'] === '東京都渋谷区神宮前1-2-3', 'SEO local business address is extracted');
expect($autofilled['business_hours'] === '月-金 09:00-18:00', 'SEO opening hours are extracted');
expect($autofilled['business_type'] === 'CafeOrCoffeeShop', 'SEO business type is extracted');
expect($autofilled['business_phone'] === '03-9999-9999', 'existing Nurevo value is never overwritten');
expect(in_array('business_name', $filled, true) && !in_array('business_phone', $filled, true), 'autofill reports only newly populated fields');
expect(webmcp_canary_autofill_business_data() === array(), 'autofill is idempotent after fields are populated');

$GLOBALS['webmcp_test_active_plugins'] = array();
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array('business_name' => 'Manual Name'));
$filled = webmcp_canary_autofill_business_data();
$wp_autofilled = $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION];
expect($wp_autofilled['business_name'] === 'Manual Name', 'WordPress site name does not replace a manual Nurevo name');
expect($wp_autofilled['business_description'] === 'WordPress description', 'WordPress description fills an empty field');
expect($wp_autofilled['business_url'] === 'https://example.test/', 'WordPress site URL fills an empty field');
// 0.7.4: the admin email is usually the installer's or agency's own address and
// would be published in JSON-LD and llms.txt, so it is never autofilled.
expect($wp_autofilled['business_email'] === '', 'the WordPress administrator email is not autofilled as the business email');

$GLOBALS['webmcp_test_posts'] = array((object) array('post_content' => "電話: 06-1234-5678\n住所: 〒530-0001 大阪府大阪市北区梅田1-1-1\n営業時間: 10:00〜19:00"));
$content_values = webmcp_canary_extract_from_content();
expect($content_values['business_phone'] === '06-1234-5678', 'clearly labelled phone is inferred from content');
expect(strpos($content_values['business_address'], '〒530-0001') === 0, 'postal-code address is inferred from content');
expect($content_values['business_hours'] === '10:00〜19:00', 'clearly labelled hours are inferred from content');
$GLOBALS['webmcp_test_posts'] = array((object) array('post_content' => 'お問い合わせは 06-0000-0000 まで'));
expect(webmcp_canary_extract_from_content() === array(), 'unlabelled content is not invented as business data');
$GLOBALS['webmcp_test_posts'] = array();

$GLOBALS['webmcp_test_active_plugins'] = array(
    'wordpress-seo/wp-seo.php',
    'seo-by-rank-math/rank-math.php',
    'all-in-one-seo-pack/all_in_one_seo_pack.php',
);
expect(webmcp_canary_detect_active_seo_plugins()['wordpress-seo/wp-seo.php'] === 'Yoast SEO', 'Yoast is detected through is_plugin_active');
expect(webmcp_canary_detect_active_seo_plugins()['seo-by-rank-math/rank-math.php'] === 'Rank Math SEO', 'Rank Math is detected through is_plugin_active');
expect(webmcp_canary_detect_active_seo_plugins()['all-in-one-seo-pack/all_in_one_seo_pack.php'] === 'All in One SEO', 'All in One SEO is detected through is_plugin_active');
$GLOBALS['webmcp_test_options']['blog_public'] = 1;
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, $compat_on, array('enabled' => '1', 'serve_schema' => '1'));
ob_start();
webmcp_canary_output_server_schema();
$yoast_output = ob_get_clean();
/* End to end, through the real output path rather than the filter alone.
 *
 * Unmeasured, or measured as incomplete, Nurevo publishes the business facts;
 * measured as complete, it stands aside. This is the behaviour the old
 * presence-only rule got wrong: free Yoast publishes an Organization with no
 * address, telephone or opening hours, and Nurevo used to suppress anyway. */
expect(strpos($yoast_output, '"telephone"') !== false || strpos($yoast_output, '"@type"') !== false,
    'with SEO plugins active but nothing measured, Nurevo still publishes');

/* Yoast, Rank Math and AIOSEO are merged into, not measured. When one of them
 * took our facts into its graph on this request, nothing else is printed. When
 * none did, that plugin published no graph here, so there is nothing to clash
 * with and the full graph is printed - even if a stale measurement says it
 * publishes a complete business elsewhere. */
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array(
    'business' => array('state' => 'complete', 'id' => 'https://example.test/#rival-biz'),
    'types' => array('Organization', 'WebSite', 'WebPage', 'BreadcrumbList'),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
));
webmcp_canary_schema_merged(true);
ob_start();
webmcp_canary_output_server_schema();
$merged_output = ob_get_clean();
expect($merged_output === '', 'after merging into the SEO plugin graph, no second graph is printed');
webmcp_canary_schema_merged(false);
ob_start();
webmcp_canary_output_server_schema();
$unmerged_output = ob_get_clean();
expect(strpos($unmerged_output, '"@type":"WebSite"') !== false,
    'a merge-capable SEO plugin that printed no graph here does not suppress anything');

/* Plugins with no graph filter (SEOPress, The SEO Framework) are still handled
 * by measuring what the page serves. */
$GLOBALS['webmcp_test_active_plugins'] = array('wp-seopress/seopress.php');
expect(webmcp_canary_detect_active_seo_plugins()['wp-seopress/seopress.php'] === 'SEOPress', 'SEOPress is detected through is_plugin_active');
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array(
    'business' => array('state' => 'partial', 'id' => 'https://example.test/#rival-org'),
    'types' => array('Organization', 'WebSite', 'WebPage', 'BreadcrumbList'),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
));
ob_start();
webmcp_canary_output_server_schema();
$gap_output = ob_get_clean();
expect($gap_output !== '', 'an incomplete rival leaves Nurevo publishing the business node');
expect(strpos($gap_output, 'https://example.test/#rival-org') !== false,
    'the gap-filling node carries the rival @id so the two merge into one entity');
expect(strpos($gap_output, '"@type":"WebSite"') === false, 'page-level nodes they publish are still left to them');

update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array(
    'business' => array('state' => 'complete', 'id' => 'https://example.test/#rival-biz'),
    'types' => array('Organization', 'WebSite', 'WebPage', 'BreadcrumbList'),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
));
ob_start();
webmcp_canary_output_server_schema();
$suppressed_output = ob_get_clean();
expect($suppressed_output === '', 'a complete rival prevents duplicate Nurevo schema output');

/* Slim SEO: merged like Yoast, Rank Math and AIOSEO, but it prints its graph in
 * wp_footer (SlimSEO\Schema\Manager::output), so the <head> output waits for it.
 * The stand-ins below mirror what Slim SEO registers: the SLIM_SEO_VER constant
 * and its Manager::output hooked to wp_footer while the Schema feature is on. */
eval('namespace SlimSEO\Schema; class Manager { public function output() {} }');
if (!defined('SLIM_SEO_VER')) {
    define('SLIM_SEO_VER', '4.11.4');
}
$slim_footer_hook = (object) array('callbacks' => array(10 => array('slim' => array('function' => array(new \SlimSEO\Schema\Manager(), 'output'), 'accepted_args' => 1))));
$slim_saved_settings = $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION];
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($slim_saved_settings, array(
    'business_name' => 'Slim Bakery', 'business_type' => 'Bakery', 'business_phone' => '03-1234-5678', 'business_address' => '東京都千代田区丸の内1-1-1',
));
$GLOBALS['webmcp_test_active_plugins'] = array('slim-seo/slim-seo.php');
expect(webmcp_canary_detect_active_seo_plugins() === array('slim-seo/slim-seo.php' => 'Slim SEO'), 'Slim SEO is detected through is_plugin_active');
expect(in_array('slim-seo/slim-seo.php', webmcp_canary_graph_integrations(), true), 'Slim SEO is a graph Nurevo merges into');
expect(strpos(webmcp_canary_seo_coexistence_message(), 'Slim SEO') !== false, 'the coexistence notice names Slim SEO');
expect(!in_array('FAQPage', webmcp_canary_suppressed_schema_types(null, array('slim-seo/slim-seo.php' => 'Slim SEO'), array()), true),
    'Slim SEO has no FAQ block, so it never suppresses the Nurevo FAQ');
expect(in_array('FAQPage', webmcp_canary_suppressed_schema_types(null, array('wordpress-seo/wp-seo.php' => 'Yoast SEO'), array()), true),
    'Yoast still does (it ships an FAQ block)');
expect(webmcp_canary_slim_seo_prints_schema() === false, 'Slim SEO schema printer not hooked: nothing to wait for');
// The daily loopback measurement reads Slim SEO's block, printed in the footer
// (pretty-printed outside production) with id="slim-seo-schema".
$slim_html = '<html><head><title>x</title></head><body><p>Hi</p><script type="application/ld+json" id="slim-seo-schema">' . json_encode(array('@context' => 'https://schema.org', '@graph' => array(
    array('@type' => 'WebSite', '@id' => 'https://example.test/#website', 'url' => 'https://example.test/', 'name' => 'Example'),
    array('@type' => 'Organization', '@id' => 'https://example.test/#organization', 'url' => 'https://example.test/', 'name' => 'Example'),
)), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . '</script></body></html>';
$slim_measured = webmcp_canary_parse_rival_schema($slim_html);
expect($slim_measured['business'] === array('state' => 'partial', 'id' => 'https://example.test/#organization'), 'the measurement reads Slim SEO\'s footer graph: an incomplete Organization');
expect(in_array('WebSite', $slim_measured['types'], true), 'and the types it publishes');
$GLOBALS['webmcp_test_active_plugins'] = array();
$slim_signature_without = webmcp_canary_rival_signature();
$GLOBALS['webmcp_test_active_plugins'] = array('slim-seo/slim-seo.php');
expect(webmcp_canary_rival_signature() !== $slim_signature_without, 'activating Slim SEO invalidates the stored measurement');

// Slim SEO's real front-page graph, keyed by entity context as its filter gets it.
$slim_graph = array(
    'website' => array('@type' => 'WebSite', '@id' => 'https://example.test/#website', 'url' => 'https://example.test/', 'name' => 'Example',
        'inLanguage' => 'ja', 'potentialAction' => array('@id' => 'https://example.test/#searchaction'), 'publisher' => array('@id' => 'https://example.test/#organization')),
    'searchaction' => array('@type' => 'SearchAction', '@id' => 'https://example.test/#searchaction', 'target' => 'https://example.test/?s={search_term_string}', 'query-input' => 'required name=search_term_string'),
    'webpage' => array('@type' => 'WebPage', '@id' => 'https://example.test/#webpage', 'url' => 'https://example.test/', 'inLanguage' => 'ja', 'name' => 'Example',
        'isPartOf' => array('@id' => 'https://example.test/#website'), 'about' => array('@id' => 'https://example.test/#organization')),
    'organization' => array('@type' => 'Organization', '@id' => 'https://example.test/#organization', 'url' => 'https://example.test/', 'name' => 'Example'),
);

// 1. Schema feature on: <head> stands aside, Slim SEO's filter merges, the footer prints nothing more.
$GLOBALS['wp_filter']['wp_footer'] = $slim_footer_hook;
expect(webmcp_canary_slim_seo_prints_schema() === true, 'Slim SEO schema printer hooked to wp_footer is recognised');
webmcp_canary_schema_merged(false);
ob_start();
webmcp_canary_output_server_schema();
$slim_head = ob_get_clean();
expect($slim_head === '', 'with Slim SEO printing in the footer, nothing is printed in <head>');
expect(webmcp_canary_schema_deferred() === true, 'the output is deferred to the footer');
$slim_merged = array_values(apply_filters('slim_seo_schema_graph', $slim_graph));
$slim_orgs = array_values(array_filter($slim_merged, function ($node) { return webmcp_canary_is_business_node($node); }));
expect(count($slim_orgs) === 1 && $slim_orgs[0]['@id'] === 'https://example.test/#organization', 'one business node, under Slim SEO\'s @id');
expect(isset($slim_orgs[0]['telephone'], $slim_orgs[0]['address']) && $slim_orgs[0]['name'] === 'Example', 'Nurevo facts added, Slim SEO\'s name kept');
expect($slim_orgs[0]['@type'] === array('Organization', 'Bakery'), 'the configured Bakery type is added to Slim SEO\'s Organization');
expect(count(array_filter($slim_merged, function ($node) { return ($node['@type'] ?? '') === 'WebSite'; })) === 1, 'one WebSite');
ob_start();
webmcp_canary_output_deferred_server_schema();
$slim_footer = ob_get_clean();
expect(strpos($slim_footer, 'application/ld+json') === false, 'after the merge, no second graph is printed in the footer');
expect(webmcp_canary_schema_deferred() === false, 'the deferral is used once');

// 2. Hooked, but Slim SEO's graph came out empty (every entity filtered away): ours is printed in the footer.
webmcp_canary_schema_merged(false);
ob_start();
webmcp_canary_output_server_schema();
expect(ob_get_clean() === '', 'deferred again on the next request');
expect(apply_filters('slim_seo_schema_graph', array()) === array(), 'an empty Slim SEO graph is left empty');
ob_start();
webmcp_canary_output_deferred_server_schema();
$slim_fallback = ob_get_clean();
expect(strpos($slim_fallback, 'id="nurevo-aeo-server"') !== false && strpos($slim_fallback, '"@type":"WebSite"') !== false,
    'when Slim SEO printed no graph, the full Nurevo graph is printed in the footer');
expect(webmcp_canary_output_deferred_server_schema() === null && webmcp_canary_schema_deferred() === false, 'and only once');

// 3. Two SEO plugins at once: Yoast already merged in <head>, Slim SEO's graph is left alone.
webmcp_canary_schema_merged(true);
expect(apply_filters('slim_seo_schema_graph', $slim_graph) === $slim_graph, 'facts already merged into another graph are not merged a second time');
webmcp_canary_schema_merged(false);

// 4. Schema feature off (or the service disabled): no footer printer, so Nurevo prints its
//    own graph in <head> like any other setup - and Slim SEO, publishing nothing, suppresses nothing,
//    whatever a stale measurement says (a complete rival is still stored from above).
unset($GLOBALS['wp_filter']['wp_footer']);
ob_start();
webmcp_canary_output_server_schema();
$slim_off = ob_get_clean();
expect(webmcp_canary_schema_deferred() === false, 'Slim SEO schema off: nothing is deferred');
expect(strpos($slim_off, 'id="nurevo-aeo-server"') !== false && strpos($slim_off, '"telephone"') !== false && strpos($slim_off, '"@type":"WebSite"') !== false,
    'Slim SEO schema off: Nurevo prints its full graph in <head>');

// 5. A request that carries no Nurevo schema is not merged either.
$GLOBALS['webmcp_test_options']['blog_public'] = 0;
expect(apply_filters('slim_seo_schema_graph', $slim_graph) === $slim_graph, 'a request without Nurevo schema leaves Slim SEO\'s graph untouched');
$GLOBALS['webmcp_test_options']['blog_public'] = 1;
webmcp_canary_schema_merged(false);
$GLOBALS['webmcp_test_active_plugins'] = array();
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $slim_saved_settings;
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);
$GLOBALS['webmcp_test_active_plugins'] = array();
ob_start();
webmcp_canary_output_server_schema();
$standalone_output = ob_get_clean();
expect(strpos($standalone_output, '"@type":"Organization"') !== false, 'standalone mode still outputs Organization');
expect(strpos($standalone_output, '"@type":"WebSite"') !== false, 'standalone mode still outputs WebSite');
expect(strpos($standalone_output, '"@type":"WebPage"') !== false, 'standalone mode still outputs WebPage');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, $compat_on, array(
    'enabled' => '1',
    'serve_schema' => '1',
    'business_name' => 'Schema Coffee',
    'business_address' => '東京都千代田区丸の内1-1-1',
    'business_phone' => '03-1234-5678',
    'business_hours' => '09:00-18:00',
));
ob_start();
webmcp_canary_output_server_schema();
$business_output = ob_get_clean();
expect(strpos($business_output, '"@type":"LocalBusiness"') !== false, 'autofilled store details select LocalBusiness schema');
// A Japanese number on a Japanese site is published in international form.
expect(strpos($business_output, '"telephone":"+81-3-1234-5678"') !== false, 'autofilled phone is included in server schema');
expect(webmcp_canary_settings()['business_phone'] === '03-1234-5678', 'the stored phone stays as typed');
// "09:00-18:00" does not say which days, so it stays text.
expect(strpos($business_output, 'openingHoursSpecification') === false, 'hours without days are not turned into a specification');
expect(strpos($business_output, '"openingHours":"09:00-18:00"') !== false, 'autofilled hours are included in server schema');

/* --- Opening hours as OpeningHoursSpecification ----------------------- */

// The free text is read into a specification only when it says plainly which
// days and which hours; anything else stays text, exactly as typed.
function webmcp_test_hours($text) {
    $specs = webmcp_canary_opening_hours_specification($text);
    if ($specs === null) {
        return null;
    }
    $short = array();
    foreach ($specs as $spec) {
        expect($spec['@type'] === 'OpeningHoursSpecification', 'each entry is an OpeningHoursSpecification');
        $days = array();
        foreach ((array) $spec['dayOfWeek'] as $url) {
            expect(strpos($url, 'https://schema.org/') === 0, 'dayOfWeek is a schema.org day URL');
            $days[] = substr($url, strlen('https://schema.org/'), 2);
        }
        $short[] = implode(',', $days) . ' ' . $spec['opens'] . '-' . $spec['closes'];
    }
    return $short;
}
$hours_cases = array(
    '10:00〜19:00 火曜定休' => array('Mo,We,Th,Fr,Sa,Su 10:00-19:00'),
    'Tu-Su 11-20' => array('Tu,We,Th,Fr,Sa,Su 11:00-20:00'),
    '月〜金 9:00-18:00 / 土 10:00-15:00' => array('Mo,Tu,We,Th,Fr 09:00-18:00', 'Sa 10:00-15:00'),
    'Mon-Fri 9am-5pm, Sat 10am-2pm' => array('Mo,Tu,We,Th,Fr 09:00-17:00', 'Sa 10:00-14:00'),
    '１０：００～１９：００（水曜定休）' => array('Mo,Tu,Th,Fr,Sa,Su 10:00-19:00'),
    '11:30-14:00 17:00-22:00 月曜定休' => array('Tu,We,Th,Fr,Sa,Su 11:30-14:00', 'Tu,We,Th,Fr,Sa,Su 17:00-22:00'),
    '毎日 10:00-20:00' => array('Mo,Tu,We,Th,Fr,Sa,Su 10:00-20:00'),
    '営業時間 10時〜19時 定休日 水曜日' => array('Mo,Tu,Th,Fr,Sa,Su 10:00-19:00'),
    '月・水・金 10:00-18:00' => array('Mo,We,Fr 10:00-18:00'),
    '平日 9:00-18:00' => array('Mo,Tu,We,Th,Fr 09:00-18:00'),
    'Mon-Sat 18:00-02:00' => array('Mo,Tu,We,Th,Fr,Sa 18:00-02:00'),
    'Daily 11-20' => array('Mo,Tu,We,Th,Fr,Sa,Su 11:00-20:00'),
    '火〜日 11:00–20:00' => array('Tu,We,Th,Fr,Sa,Su 11:00-20:00'),
    '月~土 10時から19時' => array('Mo,Tu,We,Th,Fr,Sa 10:00-19:00'),
    'Fr-Mo 10-18' => array('Mo,Fr,Sa,Su 10:00-18:00'),
    '9:00-18:00 Mon-Fri' => array('Mo,Tu,We,Th,Fr 09:00-18:00'),
    'Mon-Fri: 9-17; Sat: 10-14' => array('Mo,Tu,We,Th,Fr 09:00-17:00', 'Sa 10:00-14:00'),
    'Tue-Sun 11am to 8pm, closed Mon' => array('Tu,We,Th,Fr,Sa,Su 11:00-20:00'),
    '定休日：火曜 / 10:00-19:00' => array('Mo,We,Th,Fr,Sa,Su 10:00-19:00'),
    '10:00-19:00 火曜日定休 水曜日定休' => array('Mo,Th,Fr,Sa,Su 10:00-19:00'),
    'Mon-Fri 9:00-12:00 13:00-18:00' => array('Mo,Tu,We,Th,Fr 09:00-12:00', 'Mo,Tu,We,Th,Fr 13:00-18:00'),
    '0:00-24:00 毎日' => array('Mo,Tu,We,Th,Fr,Sa,Su 00:00-23:59'),
);
foreach ($hours_cases as $text => $expected) {
    $got = webmcp_test_hours($text);
    expect($got === $expected, "hours parsed: {$text} => " . json_encode($got));
}
// Failures: no days, unknown words, holidays, nth weekdays, ambiguous clocks,
// a closed day that is also given hours. None of these may invent hours.
foreach (array(
    '', '10:00-19:00', '09:00-18:00', '9-5', 'Closed Mondays', '平日 9:00-18:00 土日祝休み',
    '10:00-19:00 (L.O. 18:30)', '第2火曜定休 10:00-19:00', '10:00〜19:00（最終受付18:00）', 'open 24 hours',
    '10:00-19:00 月曜定休 月-金 9-18', '日曜・祝日休み 10:00-18:00', 'Mon-Fri 25:00-26:00', 'Mon 10:75-12:00',
    'Mon-Fri 9am-17', 'By appointment', '要予約', 'Mon-Fri 10:00-10:00',
) as $text) {
    expect(webmcp_canary_opening_hours_specification($text) === null, "hours not guessed: {$text}");
}

// Published as a specification, without the text beside it, when it parses.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array(
    'enabled' => '1', 'serve_schema' => '1', 'business_name' => 'Hours Cafe', 'business_hours' => '10:00〜19:00 火曜定休',
));
$hours_bundle = webmcp_canary_own_schema_bundle();
$hours_org = $hours_bundle['core'][0];
expect(!isset($hours_org['openingHours']), 'parsed hours drop the free-text openingHours');
expect($hours_org['openingHoursSpecification'][0]['opens'] === '10:00' && count($hours_org['openingHoursSpecification'][0]['dayOfWeek']) === 6,
    'and publish openingHoursSpecification');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['business_hours'] = '10:00-19:00（祝日は17時まで）';
$hours_org = webmcp_canary_own_schema_bundle()['core'][0];
expect($hours_org['openingHours'] === '10:00-19:00（祝日は17時まで）' && !isset($hours_org['openingHoursSpecification']),
    'unparsed hours are published as typed');

// The merge into an SEO plugin's node carries the specification as the one
// hours fact; a node with hours of its own keeps them.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['business_hours'] = 'Tu-Su 11-20';
$merged_hours = array_values(webmcp_canary_merge_graph(array(
    array('@type' => 'Organization', '@id' => 'https://example.test/#org', 'name' => 'Hours Cafe', 'url' => 'https://example.test/'),
)));
expect(!empty($merged_hours[0]['openingHoursSpecification']) && !isset($merged_hours[0]['openingHours']),
    'the merge adds the specification, not the text');
$merged_hours = array_values(webmcp_canary_merge_graph(array(
    array('@type' => 'Organization', '@id' => 'https://example.test/#org', 'name' => 'Hours Cafe', 'openingHours' => 'Mo-Fr 9-5'),
)));
expect($merged_hours[0]['openingHours'] === 'Mo-Fr 9-5' && !isset($merged_hours[0]['openingHoursSpecification']),
    'their own hours are not doubled by ours');
webmcp_canary_schema_merged(false);

/* --- Telephone in international form ------------------------------------ */

foreach (array(
    array('03-1234-5678', 'ja', '', '+81-3-1234-5678'),
    array('090-1234-5678', 'ja', '', '+81-90-1234-5678'),
    array('０３－１２３４－５６７８', 'ja', '', '+81-3-1234-5678'),
    array('03 (1234) 5678', 'ja', '', '+81-3-1234-5678'),
    array('0120-123-456', 'ja', '', '+81-120-123-456'),
    array('0312345678', 'ja', '', '+81-312345678'),
    array('03-1234-5678', 'en_US', '〒100-0001 Chiyoda', '+81-3-1234-5678'),
    array('03-1234-5678', 'en_US', '東京都千代田区丸の内1-1-1', '+81-3-1234-5678'),
    array('03-1234-5678', 'en_US', '1 Main St, Springfield', '03-1234-5678'),
    array('+81 3 1234 5678', 'ja', '', '+81 3 1234 5678'),
    array('+1 415 555 0100', 'ja', '', '+1 415 555 0100'),
    array('123-4567', 'ja', '', '123-4567'),
    array('00-1234-5678', 'ja', '', '00-1234-5678'),
    array('03-1234-56789-1', 'ja', '', '03-1234-56789-1'),
    array('03-1234-5678 (代表)', 'ja', '', '03-1234-5678 (代表)'),
) as $case) {
    expect(webmcp_canary_schema_telephone($case[0], $case[1], $case[2]) === $case[3],
        "telephone {$case[0]} ({$case[1]}) => " . webmcp_canary_schema_telephone($case[0], $case[1], $case[2]));
}

/* --- additionalType is a URL or nothing ---------------------------------- */

expect(webmcp_canary_schema_type_url('Hair salon') === null, 'a free label is not an additionalType');
expect(webmcp_canary_schema_type_url('https://www.wikidata.org/wiki/Q1056228') === 'https://www.wikidata.org/wiki/Q1056228', 'a URL is kept');
expect(webmcp_canary_schema_type_url(array('Cafe', 'https://schema.org/CafeOrCoffeeShop')) === 'https://schema.org/CafeOrCoffeeShop', 'a list keeps only its URLs');
expect(webmcp_canary_schema_type_url(null) === null, 'nothing stays nothing');
$normalized = webmcp_canary_normalize_business_facts(
    array('@type' => 'CafeOrCoffeeShop', 'additionalType' => 'カフェ', 'telephone' => '03-1234-5678', 'openingHours' => 'Tu-Su 11-20'),
    array('business_address' => '東京都渋谷区')
);
expect(!isset($normalized['additionalType']), 'a label in additionalType is dropped from the business node');
expect($normalized['telephone'] === '+81-3-1234-5678' && !isset($normalized['openingHours']) && count($normalized['openingHoursSpecification']) === 1,
    'the business node is normalised in one place');
$normalized = webmcp_canary_normalize_business_facts(array('additionalType' => 'https://schema.org/CafeOrCoffeeShop'), array());
expect($normalized['additionalType'] === 'https://schema.org/CafeOrCoffeeShop', 'a URL additionalType is kept');
// The central template's node is published as the service generated it, since
// delivery is verified by matching it value for value on the page.
expect(strpos(webmcp_test_function_body(file_get_contents(__DIR__ . '/../wordpress-plugin/webmcp-canary/nurevo-webmcp.php'), 'webmcp_canary_own_schema_bundle'), 'webmcp_canary_normalize_business_facts') !== false,
    'the local business node is normalised');

/* --- 0.8.0: consent before contacting the service --------------------- */

// Activation does local work only: no request to the service and no loopback.
delete_option(WEBMCP_CANARY_CONSENT_OPTION);
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array('tag_url' => 'https://nurevo.jp/tag.js'));
$GLOBALS['webmcp_test_remote_get_log'] = array();
$GLOBALS['webmcp_test_last_remote'] = null;
$GLOBALS['webmcp_test_remote_get'] = array('' => array('status' => 200, 'body' => '{}'));
webmcp_canary_activate_aeo_score();
expect($GLOBALS['webmcp_test_remote_get_log'] === array() && $GLOBALS['webmcp_test_last_remote'] === null, 'activation makes no HTTP request at all');
expect(!webmcp_canary_has_consent(), 'a fresh install has not consented');
$activation_body = webmcp_test_function_body(file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/nurevo-webmcp.php'), 'webmcp_canary_activate_aeo_score');
expect(strpos($activation_body, 'get_aeo_score') === false && strpos($activation_body, 'measure_rival_schema') === false, 'activation no longer diagnoses or measures');

// Before consent the diagnosis refuses without sending anything.
$no_consent = webmcp_canary_get_aeo_score(true);
expect(is_wp_error($no_consent) && $no_consent->get_error_code() === 'webmcp_aeo_no_consent', 'no diagnosis before consent');
expect($GLOBALS['webmcp_test_remote_get_log'] === array(), 'and no request before consent');
$GLOBALS['webmcp_test_remote_get'] = array();

// The consent form needs the box ticked.
expect(webmcp_canary_handle_consent_submit(array()) === false, 'pressing Run diagnosis without the box records nothing');
expect(!webmcp_canary_has_consent(), 'so there is still no consent');
expect(webmcp_canary_handle_consent_submit(array('nurevo_consent' => '1')) === true, 'ticking the box records consent');
expect(webmcp_canary_has_consent(), 'consent is stored');
expect(get_option(WEBMCP_CANARY_CONSENT_OPTION)['via'] === 'diagnosis', 'with how it was given');
$consent_panel = webmcp_canary_consent_panel();
expect(strpos($consent_panel, 'name="nurevo_consent"') !== false && strpos($consent_panel, 'Run diagnosis') !== false, 'the first-run panel has a consent box and a Run diagnosis button');
expect(strpos($consent_panel, 'webmcp_canary_consent') !== false, 'and posts to the consent action');

// A connected site consented when it was connected.
delete_option(WEBMCP_CANARY_CONSENT_OPTION);
expect(webmcp_canary_has_consent(array('site_key' => 'nrv_x', 'site_id' => '')), 'a site key implies consent');
expect(webmcp_canary_has_consent(array('site_key' => '', 'site_id' => 'abc')), 'so does a site ID');

// Pairing with a code is consent.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array('tag_url' => 'https://nurevo.jp/tag.js'));
$GLOBALS['webmcp_test_remote'] = array('status' => 200, 'body' => '{"ok":true,"plan":"free","site_id":"c1","site_key":"nrv_c1","profile_token":"t","domain":"example.test"}');
webmcp_canary_sanitize_settings(array('tag_url' => 'https://nurevo.jp/tag.js', 'pairing_code' => 'NRV-CONSE-NTCON-SENTC-ONSEN'));
expect(get_option(WEBMCP_CANARY_CONSENT_OPTION)['via'] === 'pairing', 'pairing records consent');
unset($GLOBALS['webmcp_test_remote']);
delete_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION);
$readme_consent = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/readme.txt');
expect(strpos($readme_consent, 'Nothing is sent until you agree.') !== false && strpos($readme_consent, 'On activation, without a key') === false, 'the readme says nothing is sent before consent');

/* --- Free plan completeness: diagnosis works with no site key ----------- */

$aeo_body = json_encode(array(
    'score' => 64,
    'band' => 'yellow',
    'gatePassed' => true,
    'checks' => array(array('id' => 'llms', 'label' => 'llms.txt', 'status' => 'BAD', 'message' => 'missing', 'fixable' => true)),
));
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array('enabled' => '1', 'tag_url' => 'https://nurevo.jp/tag.js'));
delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
$GLOBALS['webmcp_test_remote_get'] = array('api/aeo/score' => array('status' => 200, 'body' => $aeo_body));
$GLOBALS['webmcp_test_remote_get_log'] = array();
$free_score = webmcp_canary_get_aeo_score(true);
expect(!is_wp_error($free_score) && $free_score['score'] === 64, 'free install with no site key still gets a diagnosis');
expect(count($GLOBALS['webmcp_test_remote_get_log']) === 1, 'free install only calls the public diagnosis endpoint');
expect(strpos($GLOBALS['webmcp_test_remote_get_log'][0], 'api/aeo/score') !== false, 'free install uses the public URL-based endpoint');
expect(strpos($GLOBALS['webmcp_test_remote_get_log'][0], rawurlencode('https://example.test/')) !== false, 'public diagnosis targets this site home URL');

$endpoints = webmcp_canary_aeo_score_endpoints();
expect(count($endpoints) === 1 && strpos($endpoints[0], 'api/aeo/score') !== false, 'unregistered sites only expose the public endpoint');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array(
    'enabled' => '1',
    'tag_url' => 'https://nurevo.jp/tag.js',
    'site_key' => 'nrv_site',
    'site_id' => 'site-1',
));
$endpoints = webmcp_canary_aeo_score_endpoints();
expect(strpos($endpoints[0], 'api/sites/site-1/aeo-score') !== false, 'registered sites prefer the per-site endpoint');
expect(strpos($endpoints[1], 'api/aeo/score') !== false, 'registered sites still fall back to the public endpoint');

/* --- Free plan completeness: llms.txt is generated locally -------------- */

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array(
    'enabled' => '1',
    'serve_llms_txt' => '1',
    'business_name' => 'Local Coffee',
    'business_description' => 'A small roastery',
    'business_address' => '東京都千代田区丸の内1-1-1',
    'business_phone' => '03-1234-5678',
    'business_hours' => '09:00-18:00',
));
$GLOBALS['webmcp_test_posts'] = array((object) array(
    'ID' => 12,
    'post_title' => 'Menu',
    'permalink' => 'https://example.test/menu/',
    'post_content' => 'Menu page',
));
$local_llms = webmcp_canary_build_local_llms_txt();
expect(strpos($local_llms, '# Local Coffee') === 0, 'local llms.txt starts with the business name heading');
expect(strpos($local_llms, '> A small roastery') !== false, 'local llms.txt includes the description');
expect(strpos($local_llms, '- Phone: 03-1234-5678') !== false, 'local llms.txt includes key facts');
expect(strpos($local_llms, '- Hours: 09:00-18:00') !== false, 'local llms.txt includes opening hours');
expect(strpos($local_llms, '- [Menu](https://example.test/menu/)') !== false, 'local llms.txt links published pages');

$GLOBALS['webmcp_test_remote_get'] = array();
expect(webmcp_canary_fetch_llms_txt() === null, 'no site key means no service request for llms.txt');
expect(webmcp_canary_llms_txt_body() === $local_llms, 'free llms.txt falls back to local generation');
// 0.7.4: a connected site serves the same locally built llms.txt. The hosted
// version had fewer sections and fixed Japanese headings, so connecting a site
// used to make its llms.txt worse; a public request also no longer waits on a
// remote call.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['site_key'] = 'nrv_site';
$GLOBALS['webmcp_test_remote_get'] = array('api/llms.txt' => array('status' => 200, 'body' => "# Central\n"));
$llms_request_count = count($GLOBALS['webmcp_test_remote_get_log']);
expect(webmcp_canary_llms_txt_body() === $local_llms, 'a connected site still serves the locally built llms.txt');
expect(count($GLOBALS['webmcp_test_remote_get_log']) === $llms_request_count, 'serving llms.txt makes no service request');
$GLOBALS['webmcp_test_remote_get'] = array();
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['serve_llms_txt'] = '0';
expect(webmcp_canary_llms_txt_body() === null, 'disabling llms.txt stops all output');
$GLOBALS['webmcp_test_posts'] = array();

/* --- Paid value: central ruleset follow and re-notification ------------- */

$config_body = function ($plan, $version) {
    return array('status' => 200, 'body' => json_encode(array('ok' => true, 'plan' => $plan, 'ruleset_version' => $version)));
};
delete_option(WEBMCP_CANARY_RULESET_OPTION);
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array(
    'enabled' => '1',
    'tag_url' => 'https://nurevo.jp/tag.js',
    'site_key' => 'nrv_site',
    'plan' => 'free',
));
$GLOBALS['webmcp_test_remote_get'] = array('api/tag/config' => $config_body('free', 1));
$GLOBALS['webmcp_test_remote_get_log'] = array();
expect(webmcp_canary_auto_follow_enabled() === false, 'free plan does not follow the central ruleset');
webmcp_canary_sync_ruleset(true);
expect($GLOBALS['webmcp_test_remote_get_log'] === array(), 'free plan never polls the central ruleset');
expect(webmcp_canary_auto_follow_view()['label'] === 'Always current: OFF', 'free plan reports always-current off');
expect(strpos(webmcp_canary_auto_follow_view()['detail'], 'basic schema, llms.txt and AI crawler access all keep working') !== false, 'free plan keeps the basic output');

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['plan'] = 'standard';
expect(webmcp_canary_auto_follow_enabled() === true, 'standard plan follows the central ruleset');
$GLOBALS['webmcp_test_remote_get'] = array('api/tag/config' => $config_body('standard', 7));
$state = webmcp_canary_sync_ruleset(true);
expect($state['version'] === 7, 'standard plan records the central ruleset version');
expect($state['notice_version'] === 0, 'the first sync is not reported as a criteria change');
expect(webmcp_canary_auto_follow_view()['label'] === 'Always current: ON', 'standard plan reports always-current on');
expect(strpos(webmcp_canary_auto_follow_view()['detail'], 'v7') !== false, 'the followed ruleset version is shown');

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_AEO_SCORE_OPTION] = array('saved_at' => time(), 'identity' => 'stale', 'data' => $score);
$GLOBALS['webmcp_test_remote_get'] = array('api/tag/config' => $config_body('standard', 8));
$state = webmcp_canary_sync_ruleset(true);
expect($state['version'] === 8 && $state['previous_version'] === 7, 'a ruleset change records both versions');
expect($state['notice_version'] === 8, 'a ruleset change queues a wp-admin re-notification');
expect(!isset($GLOBALS['webmcp_test_options'][WEBMCP_CANARY_AEO_SCORE_OPTION]), 'a ruleset change drops the cached score so the site is re-diagnosed');
ob_start();
webmcp_canary_ruleset_notice();
$notice = ob_get_clean();
expect(strpos($notice, 'AEO criteria were updated.') !== false, 'the criteria change is announced in wp-admin');
expect(strpos($notice, 'v8') !== false && strpos($notice, 'v7') !== false, 'the notice names the old and new ruleset versions');

// A downgrade must silence a pending notice: a free site no longer follows the
// central ruleset, so it cannot be told which version it moved to.
$plan_before_downgrade = $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['plan'];
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['plan'] = 'free';
ob_start();
webmcp_canary_ruleset_notice();
expect(ob_get_clean() === '', 'a free site is not shown the central-ruleset change notice');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['plan'] = $plan_before_downgrade;
ob_start();
webmcp_canary_ruleset_notice();
expect(strpos(ob_get_clean(), 'AEO criteria were updated.') !== false, 'restoring the plan restores the pending notice');

$_GET = array('webmcp_dismiss_ruleset' => '8', '_wpnonce' => md5('webmcp_canary_dismiss_ruleset'));
webmcp_canary_maybe_dismiss_ruleset_notice();
ob_start();
webmcp_canary_ruleset_notice();
expect(ob_get_clean() === '', 'a dismissed notice stays dismissed');
$_GET = array();

$GLOBALS['webmcp_test_remote_get'] = array('api/tag/config' => $config_body('standard', 8));
$GLOBALS['webmcp_test_remote_get_log'] = array();
webmcp_canary_sync_ruleset();
expect($GLOBALS['webmcp_test_remote_get_log'] === array(), 'a fresh ruleset check is not repeated within its TTL');
webmcp_canary_settings_changed(array('plan' => 'standard', 'site_key' => 'nrv_site'), array('plan' => 'pro', 'site_key' => 'nrv_site'));
webmcp_canary_sync_ruleset();
expect(count($GLOBALS['webmcp_test_remote_get_log']) === 1, 'a plan change forces an immediate ruleset re-check');
$GLOBALS['webmcp_test_remote_get'] = array();
delete_option(WEBMCP_CANARY_RULESET_OPTION);

expect(in_array('webmcp_canary_activate_aeo_score', $GLOBALS['webmcp_test_hooks']['activation'], true), 'activation diagnosis hook');
expect(in_array('webmcp_canary_deactivate_ruleset_cron', $GLOBALS['webmcp_test_hooks']['deactivation'], true), 'deactivation clears the ruleset cron');
expect(in_array('webmcp_canary_sync_ruleset', $GLOBALS['webmcp_test_hooks'][WEBMCP_CANARY_RULESET_CRON], true), 'ruleset cron hook');
expect(in_array('webmcp_canary_ruleset_notice', $GLOBALS['webmcp_test_hooks']['admin_notices'], true), 'ruleset notice hook');
expect(in_array('webmcp_canary_admin_bar_score', $GLOBALS['webmcp_test_hooks']['admin_bar_menu'], true), 'admin bar hook');
expect(in_array('webmcp_canary_register_aeo_widget', $GLOBALS['webmcp_test_hooks']['wp_dashboard_setup'], true), 'dashboard widget hook');
expect(in_array('webmcp_canary_fix_aeo', $GLOBALS['webmcp_test_hooks']['wp_ajax_webmcp_canary_fix_aeo'], true), 'fix AJAX hook');

$source = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/nurevo-webmcp.php');
foreach (array(
    'conic-gradient',
    '⚠ This is how AI sees your business',
    'Filled in %d field(s) automatically',
    'Which plugin outputs each schema type',
    'Advanced (for developers)',
) as $required_markup) {
    expect(strpos($source, $required_markup) !== false, 'required UI: ' . $required_markup);
}
/* --- Coexistence by measurement -----------------------------------------
 *
 * Suppressing on plugin presence left pages where neither plugin published the
 * address, phone or hours. These cover the three states the measurement can
 * report, plus the cases that previously went wrong silently. */

$yoast_free_markup = '<html><head>'
    . '<script type="application/ld+json">' . json_encode(array('@graph' => array(
        array('@type' => 'Organization', '@id' => 'https://example.test/#org-yoast', 'name' => 'Lumina', 'url' => 'https://example.test/', 'logo' => 'https://example.test/l.png'),
        array('@type' => 'WebSite', '@id' => 'https://example.test/#web-yoast', 'url' => 'https://example.test/'),
        array('@type' => 'BreadcrumbList', '@id' => 'https://example.test/#bc'),
    ))) . '</script></head><body></body></html>';

$complete_rival_markup = '<html><head>'
    . '<script type="application/ld+json">' . json_encode(array('@graph' => array(
        array('@type' => 'LocalBusiness', '@id' => 'https://example.test/#biz-rival', 'name' => 'Lumina',
              'url' => 'https://example.test/', 'address' => '1-1-1 Tokyo', 'telephone' => '03-1234-5678',
              'openingHours' => 'Tu-Su 11:00-20:00'),
        array('@type' => 'WebSite', '@id' => 'https://example.test/#web-rival', 'url' => 'https://example.test/'),
    ))) . '</script></head><body></body></html>';

/* 1. A complete rival business node: suppress, so no duplicate is published. */
$complete = webmcp_canary_parse_rival_schema($complete_rival_markup, 'HairSalon');
expect($complete['business']['state'] === 'complete', 'a rival node with every required property reads as complete');
expect($complete['business']['id'] === 'https://example.test/#biz-rival', 'the rival business id is captured');
$suppressed = webmcp_canary_suppressed_schema_types($complete, array('wordpress-seo/wp-seo.php' => 'Yoast SEO'));
expect(in_array('LocalBusiness', $suppressed, true), 'a complete rival business suppresses ours');
expect(in_array('WebSite', $suppressed, true), 'a published page-level node is still suppressed on presence');

/* 2. Yoast free: Organization only, no address/telephone/hours. This is the
 *    case that used to leave the page with no business facts at all. */
$partial = webmcp_canary_parse_rival_schema($yoast_free_markup, 'HairSalon');
expect($partial['business']['state'] === 'partial', 'an Organization without contact facts reads as partial');
expect($partial['business']['id'] === 'https://example.test/#org-yoast', 'the rival organization id is captured for merging');
$suppressed = webmcp_canary_suppressed_schema_types($partial, array('wordpress-seo/wp-seo.php' => 'Yoast SEO'));
expect(!in_array('LocalBusiness', $suppressed, true), 'a partial rival does NOT suppress ours: the gap gets filled');
expect(!in_array('Organization', $suppressed, true), 'the business slot stays ours while theirs is incomplete');
expect(in_array('BreadcrumbList', $suppressed, true), 'page-level nodes they do publish are still left to them');

/* 3. Missing one required property is still partial. */
$no_phone = str_replace('"telephone":"03-1234-5678",', '', $complete_rival_markup);
$missing = webmcp_canary_parse_rival_schema($no_phone, 'HairSalon');
expect($missing['business']['state'] === 'partial', 'a business node missing telephone is not complete');

/* 4. Nothing published at all: nothing suppressed. */
$empty = webmcp_canary_parse_rival_schema('<html><head></head><body></body></html>', 'HairSalon');
expect($empty['business']['state'] === 'none', 'no rival schema reads as none');
$empty_suppressed = webmcp_canary_suppressed_schema_types($empty, array('wordpress-seo/wp-seo.php' => 'Yoast SEO'));
expect(!in_array('Organization', $empty_suppressed, true) && !in_array('WebPage', $empty_suppressed, true),
    'nothing measured means nothing measured is suppressed');
expect($empty_suppressed === array('FAQPage'),
    'except FAQPage, which stands down on detection alone');

/* 5. No SEO plugin: unchanged behaviour. */
expect(webmcp_canary_suppressed_schema_types($complete, array()) === array(), 'with no SEO plugin active nothing is suppressed');

/* 6. Before the first measurement we publish rather than hide: a duplicate is
 *    visible and fixable, a missing address is not. FAQPage is decided by
 *    detection and so is unaffected by whether a measurement exists. */
$unmeasured_suppressed = webmcp_canary_suppressed_schema_types(null, array('wordpress-seo/wp-seo.php' => 'Yoast SEO'));
expect($unmeasured_suppressed === array('FAQPage'), 'an unmeasured site suppresses nothing it would have measured (fail open)');

/* 7. Our own block must never be read as a rival. */
$ours = '<html><head><script type="application/ld+json" id="' . WEBMCP_CANARY_SCHEMA_SCRIPT_ID . '">'
    . json_encode(array('@graph' => array(array('@type' => 'HairSalon', '@id' => 'https://example.test/#organization',
        'name' => 'Lumina', 'url' => 'https://example.test/', 'address' => 'a', 'telephone' => 'b', 'openingHours' => 'c'))))
    . '</script></head><body></body></html>';
$self = webmcp_canary_parse_rival_schema($ours, 'HairSalon');
expect($self['business']['state'] === 'none', 'our own JSON-LD block is not mistaken for a rival');

/* 8. Two complete business nodes under different ids is a real duplicate
 *    already on the page; stand aside rather than add a third. */
$two = str_replace('#biz-rival', '#biz-rival-2', $complete_rival_markup);
$conflicted = webmcp_canary_parse_rival_schema($complete_rival_markup . $two, 'HairSalon');
expect($conflicted['conflict'] === true, 'two complete business nodes under different ids is reported as a conflict');
expect(in_array('LocalBusiness', webmcp_canary_suppressed_schema_types($conflicted, array('wordpress-seo/wp-seo.php' => 'Yoast SEO')), true), 'a detected duplicate forces suppression');

/* 9. Malformed JSON-LD from another plugin must not throw or create a gap. */
$broken = webmcp_canary_parse_rival_schema('<html><head><script type="application/ld+json">{not json</script></head></html>', '');
expect($broken['business']['state'] === 'none', 'malformed rival JSON-LD is ignored safely');

/* 10. The gap-filling node must carry THEIR id, or the two will not merge. */
expect(webmcp_canary_business_node_id('https://example.test/#organization', $partial) === 'https://example.test/#org-yoast',
    'a gap-filling business node reuses the rival id so the two merge into one entity');
expect(webmcp_canary_business_node_id('https://example.test/#organization', $empty) === 'https://example.test/#organization',
    'with no rival node we use our own id');
expect(webmcp_canary_business_node_id('https://example.test/#organization', $complete) === 'https://example.test/#organization',
    'when theirs is complete we are suppressed anyway, so our own id is kept');

/* 11. The table and the output path must agree, or the screen lies. */
$ownership = webmcp_canary_schema_ownership(
    array_merge(webmcp_canary_default_settings(), array('avoid_schema_duplicates' => '1', 'business_type' => 'HairSalon')),
    array('wordpress-seo/wp-seo.php' => 'Yoast SEO')
);
foreach ($ownership['rows'] as $row) {
    $claimed_suppressed = $row['owner'] === 'seo';
    $actually_suppressed = in_array($row['type'], webmcp_canary_suppressed_schema_types(null, array('wordpress-seo/wp-seo.php' => 'Yoast SEO')), true);
    expect($claimed_suppressed === $actually_suppressed, "the schema table agrees with the output path for {$row['type']}");
}

/* 12. A partial rival must leave the business facts in our graph. */
$gap_settings = array_merge(webmcp_canary_default_settings(), array(
    'avoid_schema_duplicates' => '1', 'business_type' => 'HairSalon',
    'business_address' => '1-1-1 Tokyo', 'business_phone' => '03-0000-0000', 'business_hours' => 'Tu-Su 11-20',
));
$graph = array(
    array('@type' => 'HairSalon', '@id' => 'https://example.test/#organization', 'name' => 'Lumina',
          'address' => '1-1-1 Tokyo', 'telephone' => '03-0000-0000', 'openingHours' => 'Tu-Su 11-20'),
    array('@type' => 'WebSite', '@id' => 'https://example.test/#website'),
);
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array_merge($partial, array('measured_at' => time(), 'signature' => 'x')));
$filtered = webmcp_canary_filter_schema_graph($graph, $gap_settings, array('wordpress-seo/wp-seo.php' => 'Yoast SEO'));
$kept_types = array();
foreach ($filtered as $node) { $kept_types = array_merge($kept_types, webmcp_canary_schema_node_types($node)); }
expect(in_array('HairSalon', $kept_types, true), 'the business node survives when the rival node is incomplete');
expect(!in_array('WebSite', $kept_types, true), 'the page-level node they publish is still dropped');

/* And a complete rival must remove it again. */
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array_merge($complete, array('measured_at' => time(), 'signature' => 'x')));
$filtered = webmcp_canary_filter_schema_graph($graph, $gap_settings, array('wordpress-seo/wp-seo.php' => 'Yoast SEO'));
$kept_types = array();
foreach ($filtered as $node) { $kept_types = array_merge($kept_types, webmcp_canary_schema_node_types($node)); }
expect(!in_array('HairSalon', $kept_types, true), 'the business node is dropped when the rival publishes a complete one');
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);

/* 13. The duplicate-avoidance switch still means what it says. */
$off = array_merge($gap_settings, array('avoid_schema_duplicates' => '0'));
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array_merge($complete, array('measured_at' => time(), 'signature' => 'x')));
expect(count(webmcp_canary_filter_schema_graph($graph, $off, array('wordpress-seo/wp-seo.php' => 'Yoast SEO'))) === count($graph),
    'turning duplicate avoidance off publishes everything regardless of measurement');
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);

/* The schema table must name the @type the page actually publishes. It used to
 * hardcode "Organization" while the page carried the configured business type,
 * so the headline row of the coexistence story named a node that was not there. */
$typed = array_merge(webmcp_canary_default_settings(), array(
    'enabled' => '1', 'serve_schema' => '1', 'business_type' => 'HairSalon',
    'business_address' => '1-1-1 Tokyo', 'business_phone' => '03-0000-0000', 'business_hours' => 'Tu-Su 11-20',
));
expect(webmcp_canary_business_schema_type($typed) === 'HairSalon', 'the configured business type is used');
expect(in_array('HairSalon', webmcp_canary_nurevo_schema_types($typed), true), 'the table lists the configured business type');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $typed;
$GLOBALS['webmcp_test_options']['blog_public'] = 1;
ob_start();
webmcp_canary_output_server_schema();
$typed_output = ob_get_clean();
$business_row = webmcp_canary_business_schema_type($typed);
expect(strpos($typed_output, '"@type":"' . $business_row . '"') !== false,
    "the table's business row names a type the page publishes: {$business_row}");
/* With no business facts at all it falls back to Organization. */
$bare = array_merge(webmcp_canary_default_settings(), array('enabled' => '1', 'serve_schema' => '1'));
expect(webmcp_canary_business_schema_type($bare) === 'Organization', 'with no business facts the type is Organization');
/* Facts but no explicit type gives LocalBusiness. */
$implied = array_merge($bare, array('business_address' => '1-1-1 Tokyo'));
expect(webmcp_canary_business_schema_type($implied) === 'LocalBusiness', 'business facts without a type imply LocalBusiness');
/* A junk type is not echoed into @type. */
$junk = array_merge($bare, array('business_type' => 'Hair Salon; DROP'));
expect(webmcp_canary_business_schema_type($junk) === 'Organization', 'an invalid business type is not published');

/* 14. The measurement itself, with the HTTP response mocked.
 *
 * Everything above tests the pure parser and the decision it feeds. These drive
 * webmcp_canary_measure_rival_schema() end to end - fetch, parse, store - with
 * wp_remote_get answered from a fixture, so no network is involved. */

$GLOBALS['webmcp_test_active_plugins'] = array('wordpress-seo/wp-seo.php');

$mock_response = static function ($body, $status = 200) {
    $GLOBALS['webmcp_test_remote_get'] = array('example.test' => array('status' => $status, 'body' => $body));
};

/* 14a. Yoast publishing an Organization and nothing else: the cache must record
 *      partial, keep their id for merging, and suppress only what they publish. */
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);
$mock_response($yoast_free_markup);
expect(webmcp_canary_measure_rival_schema() === true, 'a successful fetch reports success');
$cached = webmcp_canary_rival_schema_state();
expect(is_array($cached), 'the measurement is cached');
expect($cached['business']['state'] === 'partial', 'an Organization-only rival is cached as partial');
expect($cached['business']['id'] === 'https://example.test/#org-yoast', 'their id is cached so our node can merge with it');
expect(in_array('WebSite', $cached['types'], true) && in_array('BreadcrumbList', $cached['types'], true), 'the types they publish are cached');
expect(!empty($cached['measured_at']) && !empty($cached['signature']), 'the cache is stamped and signed');
expect(!in_array('Organization', webmcp_canary_suppressed_schema_types(), true), 'after measuring a partial rival we still publish the business node');
expect(in_array('WebSite', webmcp_canary_suppressed_schema_types(), true), 'after measuring, a node they do publish is suppressed');

/* 14b. A complete LocalBusiness: the cache flips to complete and we stand aside. */
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);
$mock_response($complete_rival_markup);
expect(webmcp_canary_measure_rival_schema() === true, 'the complete-rival fixture is fetched');
$cached = webmcp_canary_rival_schema_state();
expect($cached['business']['state'] === 'complete', 'a complete LocalBusiness is cached as complete');
expect(in_array('LocalBusiness', webmcp_canary_suppressed_schema_types(), true), 'a measured complete rival suppresses our business node');

/* 14c. Malformed JSON-LD must not throw, and must not be read as coverage we
 *      can rely on: it is cached as "none", which keeps us publishing. */
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);
$mock_response('<html><head><script type="application/ld+json">{"@graph":[{"@type":"LocalBusiness",}</script></head><body></body></html>');
$threw = false;
try {
    $ok = webmcp_canary_measure_rival_schema();
} catch (Throwable $error) {
    $threw = true;
}
expect(!$threw, 'malformed rival JSON-LD does not throw');
expect($ok === true, 'a 200 with unusable JSON-LD is still a completed measurement');
$cached = webmcp_canary_rival_schema_state();
expect($cached['business']['state'] === 'none', 'unparseable rival schema is treated as nothing published');
$unreadable_suppressed = webmcp_canary_suppressed_schema_types();
expect(!in_array('Organization', $unreadable_suppressed, true) && !in_array('WebPage', $unreadable_suppressed, true),
    'nothing measured is suppressed on the strength of schema we could not read');

/* 14d. A failed fetch must leave no cache behind, so the fail-open path holds
 *      rather than a half-written picture being trusted. */
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);
$GLOBALS['webmcp_test_remote_get'] = array();
expect(webmcp_canary_measure_rival_schema() === false, 'an unreachable site reports failure');
expect(webmcp_canary_rival_schema_state() === null, 'a failed measurement writes no cache');
$no_cache_suppressed = webmcp_canary_suppressed_schema_types();
expect(!in_array('Organization', $no_cache_suppressed, true) && !in_array('WebPage', $no_cache_suppressed, true),
    'with no measurement nothing measured is suppressed');

/* 14e. A non-200 is a failure too: an error page is not evidence of anything. */
$mock_response($complete_rival_markup, 503);
expect(webmcp_canary_measure_rival_schema() === false, 'a non-200 response is not treated as a measurement');
expect(webmcp_canary_rival_schema_state() === null, 'a non-200 response writes no cache');

/* 14f. The signature ties the cache to the SEO plugins it was taken under, so
 *      activating another one invalidates it instead of being acted on. */
$mock_response($yoast_free_markup);
webmcp_canary_measure_rival_schema();
$signed_with_yoast = webmcp_canary_rival_schema_state()['signature'];
$GLOBALS['webmcp_test_active_plugins'] = array('wordpress-seo/wp-seo.php', 'seo-by-rank-math/rank-math.php');
expect(webmcp_canary_rival_signature() !== $signed_with_yoast, 'activating another SEO plugin changes the signature');

$GLOBALS['webmcp_test_remote_get'] = array();
$GLOBALS['webmcp_test_active_plugins'] = array();
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);

/* The checklist wording is looked up from the check id, so that the service's
 * single-language label and message never reach the screen. Every check the
 * service currently emits must therefore have an entry here: if the worker gains
 * a check and this table is not updated, that row silently falls back to the
 * service's own language, which is the bug this replaced. The id list is read
 * from the worker source so the two cannot drift apart unnoticed. */
/* AEO_CHECKS is the worker's canonical id list - the machine contract the
 * service and this plugin both key off. Reading it directly is why a check
 * added upstream shows up here as a failure rather than as a row that silently
 * renders in the service's own language. */
$worker_source = file_get_contents(dirname(__DIR__) . '/worker/aeo-score.mjs');
$start = strpos($worker_source, 'export const AEO_CHECKS');
expect($start !== false, 'the worker still declares AEO_CHECKS');
$end = strpos($worker_source, ']);', $start);
expect($end !== false, 'the AEO_CHECKS declaration is readable');
preg_match_all('/id:\s*"([a-z_]+)"/', substr($worker_source, $start, $end - $start), $parsed_ids);
$service_ids = array_values(array_unique($parsed_ids[1]));
expect(count($service_ids) >= 8, 'the worker check ids were parsed: ' . implode(',', $service_ids));
$translated = webmcp_canary_aeo_check_labels();
foreach ($service_ids as $service_id) {
    expect(isset($translated[$service_id]), "checklist wording exists for service check: {$service_id}");
    foreach (array('label', 'OK', 'WARN', 'BAD') as $part) {
        expect(!empty($translated[$service_id][$part]), "check {$service_id} has {$part} wording");
    }
}

/* An id this version has never seen must still render, using what the service
 * sent, rather than disappearing from the checklist. */
$unknown = webmcp_canary_aeo_check_view(array('id' => 'future_check', 'status' => 'BAD', 'label' => 'Service label', 'message' => 'Service message'));
expect($unknown['known'] === false, 'an unknown check id is reported as unknown');
expect($unknown['label'] === 'Service label' && $unknown['message'] === 'Service message', 'an unknown check falls back to the service wording');

/* A known id with an unrecognised status must not be presented as a pass. */
$odd = webmcp_canary_aeo_check_view(array('id' => 'schema', 'status' => 'WEIRD', 'label' => 'x', 'message' => 'y'));
expect($odd['message'] === $translated['schema']['WARN'], 'an unrecognised status is treated as a finding, not a pass');

/* The machine contract is what the plugin keys off, so it must stay untouched. */
$contract = webmcp_canary_aeo_check_view(array('id' => 'schema', 'status' => 'BAD', 'label' => 'JA label', 'message' => 'JA message'));
expect($contract['label'] === $translated['schema']['label'], 'a known check ignores the service label');
expect($contract['message'] === $translated['schema']['BAD'], 'a known check uses the status-specific message');

/* The admin UI must stay translatable: source strings in English, Japanese in
 * the catalogue. Hardcoded Japanese shipped a Japanese-only interface to every
 * locale, which is what 0.5.1 fixed, so it must not creep back.
 *
 * The three Japanese regular expressions are deliberate: they match Japanese
 * labels in the site's own content when extracting business details, so
 * translating them would break extraction. They are matched and excluded by
 * their preg_ call, not by an allowlist of their text. */
$japanese = '/[\x{3040}-\x{30ff}\x{4e00}-\x{9fff}]/u';
$scannable = preg_replace('/preg_match\w*\(\s*([\x27"]).*?\1/su', '', $source);
$offenders = array();
foreach (explode("\n", $scannable) as $number => $line) {
    if (preg_match($japanese, $line)) {
        $offenders[] = ($number + 1) . ': ' . trim($line);
    }
}
expect(empty($offenders), 'no hardcoded Japanese in the plugin source: ' . implode(' | ', array_slice($offenders, 0, 3)));
expect(substr_count($source, 'preg_match') >= 3, 'the business-detail extraction patterns are still present');

/* English source strings only: a Japanese msgid cannot be translated by
 * translate.wordpress.org, which only translates from English. */
$pot = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/languages/nurevo-webmcp.pot');
preg_match_all('/^msgid "(.+)"$/m', $pot, $msgids);
$japanese_msgids = array_filter($msgids[1], static function ($msgid) use ($japanese) {
    return (bool) preg_match($japanese, $msgid);
});
expect(empty($japanese_msgids), 'every msgid is English: ' . implode(' | ', array_slice($japanese_msgids, 0, 3)));

/* Translations are loaded just in time from the bundled languages/ directory,
 * which is why the floor is 6.1. Calling load_plugin_textdomain() would be
 * redundant there and Plugin Check flags it, so it must stay absent - and the
 * floor must stay at or above 6.1, or Japanese would silently stop loading. */
expect(!preg_match('/^\s*load_plugin_textdomain\s*\(/m', $source), 'load_plugin_textdomain() is not called');
expect(strpos($source, 'phpcs:ignore PluginCheck') === false, 'no Plugin Check finding is suppressed');
if (preg_match('/^ \* Requires at least:\s*(\d+)\.(\d+)/m', $source, $floor)) {
    $supports_jit = ((int) $floor[1] > 6) || ((int) $floor[1] === 6 && (int) $floor[2] >= 1);
    expect($supports_jit, 'the WordPress floor is 6.1+, where bundled translations load automatically');
} else {
    expect(false, 'the plugin header declares a minimum WordPress version');
}

expect(strpos($source, "add_filter('robots_txt', 'webmcp_canary_allow_ai_crawlers_robots_txt'") !== false, 'robots output remains registered');
expect(strpos($source, "add_action('template_redirect', 'webmcp_canary_maybe_serve_llms_txt'") !== false, 'llms.txt output remains registered');
// 99: after every SEO plugin has printed its graph (they print at 1), so a merge into theirs is known.
expect(strpos($source, "add_action('wp_head', 'webmcp_canary_output_server_schema', 99)") !== false, 'server schema remains registered');
expect(strpos($source, "add_filter('wpseo_schema_graph', 'webmcp_canary_merge_into_list_graph'") !== false, 'Yoast graph merge is registered');
expect(strpos($source, "add_filter('rank_math/schema/validated_data', 'webmcp_canary_merge_into_keyed_graph'") !== false, 'Rank Math graph merge is registered');
expect(strpos($source, "add_filter('aioseo_schema_output', 'webmcp_canary_merge_into_list_graph'") !== false, 'AIOSEO graph merge is registered');
expect(strpos($source, "add_filter('slim_seo_schema_graph', 'webmcp_canary_merge_into_slim_seo_graph', 99)") !== false, 'Slim SEO graph merge is registered');
expect(strpos($source, "add_action('wp_footer', 'webmcp_canary_output_deferred_server_schema', 99)") !== false, 'the output deferred for Slim SEO is printed in wp_footer');

/* The browser tag is the only code path that puts a third-party script on public
 * pages and reports visitor-side activity, so it must stay opt-in: enabling the
 * plugin must never start that traffic by itself. */
$defaults = webmcp_canary_default_settings();
expect(isset($defaults['load_tag']) && $defaults['load_tag'] === '0', 'browser tag is off by default');
expect(strpos($source, "\$settings['load_tag'] !== '1'") !== false, 'tag enqueue is gated on the opt-in');
/* AEO output must not be reachable only via the tag: each of these runs from its
 * own hook and is gated on its own toggle, never on load_tag. */
foreach (array(
    'webmcp_canary_output_server_schema',
    'webmcp_canary_maybe_serve_llms_txt',
    'webmcp_canary_allow_ai_crawlers_robots_txt',
) as $core_fn) {
    $body = webmcp_test_function_body($source, $core_fn);
    expect($body !== '' && strpos($body, 'load_tag') === false, "AEO core does not depend on the tag: {$core_fn}");
}
/* No locked paid PHP ships in the plugin: the free output paths must never
 * branch on the plan or on an upgrade requirement, and the plan must only ever
 * select a ruleset server-side. Paid-plan *display* code (the measurement
 * screen) may reference upgrade state; these free paths may not. */
foreach (array(
    'webmcp_canary_apply_aeo_fix',
    'webmcp_canary_fix_aeo',
    'webmcp_canary_output_server_schema',
    'webmcp_canary_allow_ai_crawlers_robots_txt',
    'webmcp_canary_build_local_llms_txt',
    'webmcp_canary_llms_txt_body',
    'webmcp_canary_maybe_serve_llms_txt',
    'webmcp_canary_get_aeo_score',
    'webmcp_canary_aeo_score_endpoints',
) as $free_function) {
    $start = strpos($source, "\nfunction {$free_function}(");
    expect($start !== false, "free function exists: {$free_function}");
    $end = strpos($source, "\n}\n", $start);
    $body = substr($source, $start, $end - $start);
    expect(
        strpos($body, "'plan'") === false
        && strpos($body, 'auto_follow') === false
        && strpos($body, 'upgrade_required') === false
        && strpos($body, 'sov_enabled') === false,
        "free output path is not plan-gated: {$free_function}"
    );
}
expect(strpos($source, 'webmcp_canary_auto_follow_enabled') !== false, 'plan state is reported, not enforced, in the plugin');
expect(strpos($source, '<button class="button webmcp-aeo-fix" data-check-id=') !== false, 'free and paid plans render the same fix action');
expect(strpos($source, 'webmcp-aeo-plans') === false, 'the bottom plan cards are gone from the score screen');
expect(strpos($source, 'Always current:') !== false, 'standard value is still described as server-side ruleset freshness');
// P: no price, and no purchase, beside a plan that is not on sale. A price
// next to Pro reads as one you could pay today, and the plugin may not carry a
// payment route of any kind under the directory's rules anyway.
expect(strpos($source, 'from 14,800 JPY/month') === false, 'the Pro price is gone from the measurement screen');
expect(strpos($source, '14,800') === false, 'and from the plugin entirely');
// 0.7.4: worded so it stays true whether or not Pro is on sale: Pro is set up
// on the Nurevo dashboard, never bought inside the plugin.
expect(strpos($source, 'beta, coming soon') === false && strpos($source, 'Pro is not on sale yet') === false,
    'the plugin no longer claims Pro is not on sale');
expect(strpos($source, 'Pro is set up on the Nurevo dashboard, not in WordPress.') !== false, 'Pro points to the dashboard instead');
expect(strpos($source, 'billing/checkout') === false && strpos($source, 'checkout.stripe') === false, 'the plugin still offers no purchase route');

// T: the one thing a new install has to do, where it cannot be missed. It used
// to appear only in the description under the code field, halfway down a long
// form, and vanishes once the site is connected rather than nagging.
expect(strpos($source, 'Connect this site to Nurevo') !== false, 'an unconnected install is told how to connect');
expect(strpos($source, 'Press "Issue a pairing code" and copy the code.') !== false, 'including where the code comes from');
expect(strpos($source, "\$settings['site_id'] === '' || \$settings['profile_token'] === ''") !== false, 'and only while it is unconnected');
expect(strpos($source, 'Once this site is on Pro, this screen shows its measurements automatically.') !== false, 'and says so in words');

/* --- U2 measurement screen: pro only, display-only ---------------------- */

$sov_defaults = array_merge($defaults, array(
    'enabled' => '1',
    'tag_url' => 'https://nurevo.jp/tag.js',
    'site_key' => 'nrv_site',
    'site_id' => 'site-1',
));
foreach (array('free', 'standard') as $plan_without_measurement) {
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($sov_defaults, array('plan' => $plan_without_measurement));
    expect(webmcp_canary_sov_enabled() === false, "{$plan_without_measurement} has no measurement");
    $GLOBALS['webmcp_test_remote_get_log'] = array();
    $refused = webmcp_canary_get_sov(true);
    expect(is_wp_error($refused) && $refused->get_error_code() === 'webmcp_sov_not_pro', "{$plan_without_measurement} is refused measurement");
    expect($GLOBALS['webmcp_test_remote_get_log'] === array(), "{$plan_without_measurement} never calls the measurement API");
}

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($sov_defaults, array('plan' => 'pro'));
expect(webmcp_canary_sov_enabled() === true, 'pro with a site key and site ID has measurement');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($sov_defaults, array('plan' => 'pro', 'site_id' => ''));
expect(webmcp_canary_sov_enabled() === false, 'pro without a site ID cannot be measured yet');

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($sov_defaults, array('plan' => 'pro'));
delete_option(WEBMCP_CANARY_SOV_OPTION);
$sov_payload = array(
    'configured' => true,
    'beta' => true,
    'engines' => array(array('id' => 'perplexity')),
    'latest' => array(
        'status' => 'measured', 'ran_at' => '2026-03-21T00:00:00.000Z',
        'appearance_rate' => 0.6, 'citation_rate' => 0.2, 'confidence' => 'normal',
        'answers_received' => 20, 'questions_asked' => 20,
        'competitors' => array(array('host' => 'rival.example.net', 'appearances' => 9, 'appearance_rate' => 0.45)),
    ),
    'trend' => array(
        array('ran_at' => '2026-03-14T00:00:00.000Z', 'appearance_rate' => 0.4),
        array('ran_at' => '2026-03-21T00:00:00.000Z', 'appearance_rate' => 0.6),
    ),
    'limits' => array('questions_per_run' => 20, 'engines_per_run' => 2, 'monthly_queries' => 200),
    'usage' => array('used' => 40, 'remaining' => 160),
);
$GLOBALS['webmcp_test_remote_get'] = array('/sov' => array('status' => 200, 'body' => json_encode($sov_payload)));
$GLOBALS['webmcp_test_remote_get_log'] = array();
$fetched = webmcp_canary_get_sov(true);
expect(!is_wp_error($fetched) && $fetched['latest']['appearance_rate'] === 0.6, 'pro fetches the measurement summary');
expect(strpos($GLOBALS['webmcp_test_remote_get_log'][0], 'api/sites/site-1/sov') !== false, 'the per-site measurement endpoint is used');
expect(strpos($GLOBALS['webmcp_test_remote_get_log'][0], 'site_key=nrv_site') !== false, 'the plugin authenticates with its site key');

$GLOBALS['webmcp_test_remote_get_log'] = array();
webmcp_canary_get_sov(false);
expect($GLOBALS['webmcp_test_remote_get_log'] === array(), 'a fresh measurement is served from cache within its TTL');

$measured_view = webmcp_canary_sov_view($sov_payload);
expect($measured_view['state'] === 'measured', 'a measured payload renders as measured');
expect($measured_view['rate'] === 0.6, 'the appearance rate is carried through');
expect(round($measured_view['delta'] * 100) === 20.0, 'the change against the previous run is computed');
expect($measured_view['competitors'][0]['host'] === 'rival.example.net', 'competitors are carried through');
expect($measured_view['distinct_questions'] === 0 && $measured_view['repetitions'] === 0, 'an older payload has no question breakdown');
$split_payload = $sov_payload;
$split_payload['latest']['questions_asked'] = 10;
$split_payload['latest']['distinct_questions'] = 5;
$split_payload['latest']['repetitions'] = 2;
$split_view = webmcp_canary_sov_view($split_payload);
expect($split_view['questions'] === 10 && $split_view['distinct_questions'] === 5 && $split_view['repetitions'] === 2, 'questions_asked is kept and the 5 x 2 breakdown is carried through');

expect(webmcp_canary_sov_view(array('configured' => false))['state'] === 'unconfigured', 'an unconfigured engine is reported as such');
expect(webmcp_canary_sov_view(array('configured' => true, 'latest' => null))['state'] === 'pending', 'a pro site with no run yet is pending');
expect(webmcp_canary_sov_view(array('configured' => true, 'latest' => array('status' => 'measured', 'appearance_rate' => null)))['state'] === 'no_answers', 'a run with no answers reports no rate');
expect(webmcp_canary_sov_view(null)['state'] === 'unavailable', 'a missing payload is unavailable, not zero');

expect(webmcp_canary_sov_percent(0.6) === '60%', 'rates render as percentages');
expect(webmcp_canary_sov_percent(null) === '—', 'a missing rate renders as an em dash, not 0%');
expect(webmcp_canary_sov_percent(0) === '0%', 'a measured zero still renders as 0%');

expect(webmcp_canary_sov_sparkline(array()) === '', 'no trend yields no chart');
// Free AI check card (Free / Standard): what the service says, escaped, never a rate.
if (!function_exists('date_i18n')) { function date_i18n($format, $time, $gmt = false) { return gmdate('Y-m-d', $time); } }
expect(webmcp_canary_free_check_card(array('status' => 'pro')) === '', 'a Pro site gets no free card');
expect(webmcp_canary_free_check_card(null) === '', 'no payload, no card');
$free_used_up = webmcp_canary_free_check_card(array('status' => 'used_up', 'next_check_on' => '2026-11-09', 'questions_per_check' => 3));
expect(strpos($free_used_up, "This month&#039;s free checks are used up. Next check on 2026-11-09.") !== false, 'used up says when the next check is');
expect(strpos($free_used_up, 'webmcp_canary_free_check') === false, 'no run button when used up');
$free_done = webmcp_canary_free_check_card(array('status' => 'done', 'next_check_on' => '2026-11-09', 'questions_per_check' => 3, 'result' => array(
    'appeared' => 1, 'answered' => 3,
    'questions' => array(
        array('question' => 'Best cafe in Shibuya?', 'answered' => true, 'named' => true, 'cited' => false, 'others' => array(array('label' => '<b>Rival</b>', 'kind' => 'name'))),
        array('question' => 'q2', 'answered' => true, 'named' => false, 'cited' => false, 'others' => array()),
        array('question' => 'q3', 'answered' => false),
    ),
)));
expect(strpos($free_done, 'Named or cited in 1 of 3 answers') !== false, 'the free card counts answers, not a rate');
expect(strpos($free_done, '%') === false, 'no percentage from three answers');
expect(strpos($free_done, '&lt;b&gt;Rival&lt;/b&gt;') !== false && strpos($free_done, '<b>Rival') === false, 'names from answers are escaped');
expect(strpos($free_done, 'Not mentioned') !== false && strpos($free_done, 'No answer') !== false, 'each question says what happened');
expect(strpos($free_done, 'not a rate') !== false, 'the variability notice is shown');
expect(strpos($free_done, 'Pro tracks this every week') !== false, 'the Pro upsell line is shown');

expect(webmcp_canary_sov_sparkline(array(array('appearance_rate' => 0.4))) === '', 'a single point yields no chart');
$chart = webmcp_canary_sov_sparkline($sov_payload['trend']);
expect(strpos($chart, '<svg') === 0 && strpos($chart, '<polyline') !== false, 'two or more points yield an inline SVG chart');
expect(strpos($chart, 'http') === false, 'the chart uses no external resource');

$GLOBALS['webmcp_test_remote_get'] = array('/sov' => array('status' => 402, 'body' => json_encode(array(
    'error' => 'upgrade_required',
    'upgrade' => array('required_plan' => 'pro', 'price_label' => '¥14,800/月〜'),
))));
delete_option(WEBMCP_CANARY_SOV_OPTION);
$downgraded = webmcp_canary_get_sov(true);
expect(is_wp_error($downgraded) && $downgraded->get_error_code() === 'webmcp_sov_upgrade_required', 'a 402 from the service is surfaced as an upgrade requirement');

// A plan or key change must drop the cached measurement as well as the score.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_SOV_OPTION] = array('saved_at' => time(), 'identity' => 'x', 'data' => $sov_payload);
webmcp_canary_settings_changed(array('plan' => 'pro', 'site_key' => 'nrv_site'), array('plan' => 'free', 'site_key' => 'nrv_site'));
expect(!isset($GLOBALS['webmcp_test_options'][WEBMCP_CANARY_SOV_OPTION]), 'a plan change clears the cached measurement');

$GLOBALS['webmcp_test_remote_get'] = array();
delete_option(WEBMCP_CANARY_SOV_OPTION);

expect(strpos($source, "'webmcp-canary-sov'") !== false, 'the measurement screen is registered');
/* The tab is labelled "AI visibility" in English and the beta marker rides in
 * the screen title badge; Japanese keeps the β inside the menu label itself. */
expect(strpos($source, "__('AI visibility', 'nurevo-webmcp')") !== false, 'the measurement tab is registered');
$ja_catalogue = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/languages/nurevo-webmcp-ja.po');
expect(strpos($ja_catalogue, '測定（β）') !== false, 'the measurement tab carries the beta label in Japanese');
expect(strpos($source, 'webmcp-sov-beta') !== false, 'the measurement screen renders a beta badge');
expect(strpos($source, 'is a Pro feature (beta)') !== false && strpos($source, '14,800') === false, 'the measurement screen states Pro and beta, with no price');
// Display only: the plugin must not contain a measurement implementation.
expect(strpos($source, 'api.perplexity.ai') === false && strpos($source, 'api.openai.com') === false, 'the plugin never calls an AI engine directly');
expect(strpos($source, 'PERPLEXITY_API_KEY') === false && strpos($source, 'OPENAI_API_KEY') === false, 'no engine API key is referenced in the plugin');

/* --- UI: menu, plan badge, logo, schema ownership, checklist actions ----- */

// Exactly three screens: score, measurement, settings.
$submenu_slugs = array();
foreach (array('webmcp-canary', 'webmcp-canary-sov', 'webmcp-canary-settings', 'webmcp-canary-technical') as $slug) {
    if (strpos($source, "'" . $slug . "',") !== false) { $submenu_slugs[] = $slug; }
}
expect(in_array('webmcp-canary', $submenu_slugs, true), 'the score screen is registered');
expect(in_array('webmcp-canary-sov', $submenu_slugs, true), 'the measurement screen is registered');
expect(in_array('webmcp-canary-settings', $submenu_slugs, true), 'the settings screen is registered');
expect(!in_array('webmcp-canary-technical', $submenu_slugs, true), 'the technical report screen is gone');
expect(strpos($source, 'webmcp_canary_dashboard_page') === false, 'the technical report page function is removed');
expect(strpos($source, 'dashicons-chart-pie') === false, 'the dashicon placeholder is replaced by the plugin logo');
expect(strpos($source, "webmcp_canary_asset_url('icon.svg')") !== false, 'the menu icon comes from assets/icon.svg');

// MCP / WebMCP must not surface as wording on an operator-facing screen.
// The internal webmcp_* namespace and webmcp-* CSS classes are implementation
// detail and are stripped before checking, so only rendered text is judged.
function webmcp_test_visible_text($body) {
    $stripped = preg_replace('/WEBMCP_CANARY_[A-Z0-9_]+/', '', $body);
    $stripped = preg_replace('/webmcp_canary_[a-z0-9_]+/', '', $stripped);
    $stripped = preg_replace('/webmcp[-a-z0-9]*/', '', $stripped);
    return $stripped;
}
foreach (array('webmcp_canary_aeo_page', 'webmcp_canary_sov_page', 'webmcp_canary_settings_page', 'webmcp_canary_developer_state_table', 'webmcp_canary_register_settings', 'webmcp_canary_enabled_field', 'webmcp_canary_tag_url_field', 'webmcp_canary_site_key_field', 'webmcp_canary_serve_llms_txt_field', 'webmcp_canary_serve_schema_field', 'webmcp_canary_site_email_field') as $screen) {
    $start = strpos($source, "\nfunction {$screen}(");
    expect($start !== false, "screen exists: {$screen}");
    $end = strpos($source, "\n}\n", $start);
    $body = webmcp_test_visible_text(substr($source, $start, $end - $start));
    expect(stripos($body, 'mcp') === false, "no MCP wording on screen: {$screen}");
}
// The admin menu labels must not mention MCP either.
$menu_start = strpos($source, "\nfunction webmcp_canary_admin_menu(");
$menu_body = webmcp_test_visible_text(substr($source, $menu_start, strpos($source, "\n}\n", $menu_start) - $menu_start));
expect(stripos($menu_body, 'mcp') === false, 'no MCP wording in the admin menu');

// Logo and plan badge resolve from the plugin's assets/ directory.
expect(strpos(webmcp_canary_asset_url('logo.svg'), 'assets/logo.svg') !== false, 'logo resolves under assets/');
expect(strpos(webmcp_canary_logo_img(), 'assets/logo.svg') !== false, 'the header logo uses assets/logo.svg');
expect(file_exists(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/assets/logo.svg'), 'assets/logo.svg ships with the plugin');
expect(file_exists(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/assets/icon.svg'), 'assets/icon.svg ships with the plugin');

// Display names are Free/Standard/Pro; the internal keys must not change.
foreach (array('free' => 'Free', 'standard' => 'Standard', 'pro' => 'Pro') as $plan => $label) {
    expect(webmcp_canary_plan_label($plan) === $label, "plan label: {$plan} => {$label}");
    expect(strpos(webmcp_canary_plan_badge($plan), $label) !== false, "plan badge renders: {$plan}");
    expect(strpos(webmcp_canary_plan_badge($plan), 'is-' . $plan) !== false, "plan badge is styled per plan: {$plan}");
}
expect(strpos(webmcp_canary_plan_badge('nonsense'), 'is-free') !== false, 'an unknown plan falls back to the free badge');
expect($defaults['plan'] === 'free', 'the internal plan key stays free');
expect(strpos($source, "'free' => 'Free', 'standard' => 'Standard', 'pro' => 'Pro'") !== false, 'only the display names were renamed');
foreach (array('無料', '標準', '上位') as $retired) {
    expect(strpos(webmcp_canary_plan_badge('free') . webmcp_canary_plan_badge('standard') . webmcp_canary_plan_badge('pro'), $retired) === false, "retired plan label is gone: {$retired}");
}
expect(strpos($source, '上位プラン') === false && strpos($source, '標準プラン') === false, 'no retired plan name remains in the plugin UI');
$title = webmcp_canary_screen_title('Nurevo AEO');
expect(strpos($title, 'assets/logo.svg') !== false && strpos($title, 'webmcp-plan-badge') !== false, 'the screen title carries the logo and the plan badge');

// Schema ownership is stated as fact, per detected SEO plugin.
$GLOBALS['webmcp_test_active_plugins'] = array();
$solo = webmcp_canary_schema_ownership(array('avoid_schema_duplicates' => '1'));
foreach ($solo['rows'] as $row) { expect($row['owner'] === 'nurevo', 'with no SEO plugin Nurevo owns every type'); }
expect($solo['seo_plugins'] === array(), 'no SEO plugin is listed when none is active');

$GLOBALS['webmcp_test_active_plugins'] = array('wordpress-seo/wp-seo.php');

// Measured as publishing all three completely: Yoast owns them.
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array(
    'business' => array('state' => 'complete', 'id' => 'https://example.test/#rival'),
    'types' => array('Organization', 'WebSite', 'WebPage'),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
));
$shared = webmcp_canary_schema_ownership(array('avoid_schema_duplicates' => '1'));
$owner_by_type = array();
foreach ($shared['rows'] as $row) { $owner_by_type[$row['type']] = $row['owner']; }
expect($owner_by_type['Organization'] === 'seo', 'Yoast owns Organization when it publishes one completely');
expect($owner_by_type['WebSite'] === 'seo', 'Yoast owns WebSite');
expect($owner_by_type['WebPage'] === 'seo', 'Yoast owns WebPage');
expect(!isset($owner_by_type['FAQPage']), 'a type nothing emits is not listed as published');
expect(!isset($owner_by_type['OpeningHoursSpecification']), 'nor is OpeningHoursSpecification');
expect($owner_by_type['BlogPosting'] === 'nurevo',
    'BlogPosting stays ours while the measurement has not seen one');

update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array(
    'business' => array('state' => 'complete', 'id' => 'https://example.test/#rival'),
    'types' => array('Organization', 'WebSite', 'WebPage', 'BlogPosting'),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
));
$with_article = webmcp_canary_schema_ownership(array('avoid_schema_duplicates' => '1'));
$article_owner = array();
foreach ($with_article['rows'] as $row) { $article_owner[$row['type']] = $row['owner']; }
expect($article_owner['BlogPosting'] === 'seo', 'once an article node is measured, Yoast owns it');
expect($shared['seo_plugins'] === array('Yoast SEO'), 'the detected SEO plugin is named as a fact');

// Measured as publishing an incomplete business node: the table must say so,
// rather than claiming Yoast owns a node it does not fully publish.
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array(
    'business' => array('state' => 'partial', 'id' => 'https://example.test/#rival-org'),
    'types' => array('Organization', 'WebSite', 'WebPage'),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
));
$gap = webmcp_canary_schema_ownership(array('avoid_schema_duplicates' => '1'));
$gap_owner = array();
foreach ($gap['rows'] as $row) { $gap_owner[$row['type']] = $row['owner']; }
expect($gap_owner['Organization'] === 'nurevo_gap', 'an incomplete rival is reported as Nurevo filling the gap');
expect($gap_owner['WebSite'] === 'seo', 'page-level nodes they publish are still theirs');
expect($gap['business_state'] === 'partial', 'the measured business state is reported to the screen');

$off = webmcp_canary_schema_ownership(array('avoid_schema_duplicates' => '0'));
foreach ($off['rows'] as $row) { expect($row['owner'] === 'nurevo', 'with avoidance off Nurevo owns every type again'); }

// Every type the table calls suppressed must be one the filter actually drops.
foreach (array('complete', 'partial') as $measured_state) {
    update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array(
        'business' => array('state' => $measured_state, 'id' => 'https://example.test/#rival'),
        'types' => array('Organization', 'WebSite', 'WebPage'),
        'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
    ));
    $table = webmcp_canary_schema_ownership(array('avoid_schema_duplicates' => '1'));
    $dropped = webmcp_canary_suppressed_schema_types(null, array('wordpress-seo/wp-seo.php' => 'Yoast SEO'));
    foreach ($table['rows'] as $row) {
        $claims_theirs = $row['owner'] === 'seo';
        expect($claims_theirs === in_array($row['type'], $dropped, true),
            "ownership table matches the filter ({$measured_state}): {$row['type']}");
    }
}
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);

/* ------------------------------------------------------------------ *
 * The ownership table may only name types the page actually emits
 * ------------------------------------------------------------------ */

// The table exists to state what this site publishes, but it listed FAQPage and
// OpeningHoursSpecification unconditionally while the output path emitted
// neither - the one thing it promised not to do. This reads the emitter and
// holds the table to it, so a type cannot be announced before it is published.
// The nodes are built in one place for both outputs: the standalone graph and
// the merge into an SEO plugin's graph.
$emitter_start = strpos($source, 'function webmcp_canary_own_schema_bundle()');
expect($emitter_start !== false, 'the schema emitter was found');
$emitter = substr($source, $emitter_start);
$next_function = strpos($emitter, "\nfunction ", 1);
$emitter = $next_function === false ? $emitter : substr($emitter, 0, $next_function);
// Nodes the emitter appends are built in helpers, so those count as emitted
// too - otherwise a type could be listed in the table and built in a helper
// without this noticing.
$faq_builder_start = strpos($source, 'function webmcp_canary_faq_schema_node(');
if ($faq_builder_start !== false) {
    $emitter .= substr($source, $faq_builder_start, 1200);
}

preg_match_all("/'@type'\s*=>\s*'([A-Za-z]+)'/", $emitter, $literal_types);
preg_match_all("/\?\s*'([A-Za-z]+)'\s*:\s*'([A-Za-z]+)'/", $emitter, $ternary_types);
$emitted = array_merge($literal_types[1], $ternary_types[1], $ternary_types[2]);
// The business node's type is computed rather than written as a literal.
$emitted[] = webmcp_canary_business_schema_type(array('business_type' => ''));
$emitted = array_values(array_unique(array_filter($emitted)));
expect(in_array('WebSite', $emitted, true) && in_array('BlogPosting', $emitted, true),
    'the emitter scan found the expected types');

$GLOBALS['webmcp_test_active_plugins'] = array();
$listed = webmcp_canary_schema_ownership(array('avoid_schema_duplicates' => '1', 'business_type' => ''));
foreach ($listed['rows'] as $row) {
    expect(in_array($row['type'], $emitted, true),
        "the ownership table only names types the page emits: {$row['type']}");
}

// And the reverse for the node most sites publish most often, which the list
// had simply forgotten.
$types_listed = array_map(function ($row) { return $row['type']; }, $listed['rows']);
expect(in_array('BlogPosting', $types_listed, true), 'BlogPosting is listed as a type Nurevo publishes');

// The conditional row has to satisfy the same rule.
webmcp_canary_save_faq_entries(array(array('q' => 'Q', 'a' => 'A')));
$with_faq = webmcp_canary_schema_ownership(array('avoid_schema_duplicates' => '1', 'business_type' => ''));
foreach ($with_faq['rows'] as $row) {
    expect(in_array($row['type'], $emitted, true),
        "a conditionally listed type is still one the page emits: {$row['type']}");
}
delete_option(WEBMCP_CANARY_FAQ_OPTION);
expect(count($types_listed) === count(array_unique($types_listed)), 'no type is listed twice');

$GLOBALS['webmcp_test_active_plugins'] = array();

// Checklist actions: fix in place, send to the form, or explain.
expect(webmcp_canary_check_action('schema', 'OK') === null, 'a passing check offers no action');
foreach (array('ai_crawlers_allowed', 'server_rendered_html', 'llms') as $id) {
    $action = webmcp_canary_check_action($id, 'BAD');
    expect($action['mode'] === 'fix', "{$id} is fixed in place");
    expect(!empty($action['label']) && !empty($action['hint']), "{$id} has a button label and a hint");
}
foreach (array('schema' => 'BAD', 'coverage' => 'WARN') as $id => $status) {
    $action = webmcp_canary_check_action($id, $status);
    expect($action['mode'] === 'form', "{$id} sends the operator to the business form");
    expect($action['label'] === 'Add business details', "{$id} button reads Add business details");
    expect(strpos($action['url'], 'page=webmcp-canary-settings') !== false, "{$id} links to settings");
    expect(strpos($action['url'], '#webmcp-business') !== false, "{$id} anchors at the business fields");
    expect($action['hint'] === 'Fill these in and the full schema is generated for you, turning this green.', "{$id} explains what filling it in achieves");
}
$consistency = webmcp_canary_check_action('consistency', 'WARN');
expect($consistency['mode'] === 'hint', 'consistency is editorial, not a button');
expect(stripos($consistency['hint'], 'schema agree with your page text') !== false, 'consistency hint names the schema/body mismatch');
expect(stripos($consistency['hint'], 'freshness signal') !== false, 'consistency hint names the freshness signal');
expect(strpos($source, 'id="webmcp-business"') !== false, 'the settings form exposes the business anchor');

// Developer details live on the settings screen, collapsed.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array(
    'plan' => 'standard', 'site_key' => 'nrv_site', 'site_id' => 'site-1', 'tag_url' => 'https://nurevo.jp/tag.js',
));
$details = webmcp_canary_developer_state_table();
expect(strpos($details, '<table') === 0, 'developer info renders as a state table');
expect(strpos($source, '<details class="webmcp-dev-details">') !== false, 'the settings form wraps developer info in a collapsed block');
expect(strpos($source, 'Advanced (for developers)') !== false, 'the block is labelled Advanced (for developers)');
expect(strpos($source, "do_settings_fields('webmcp_canary', 'webmcp_canary_advanced')") !== false, 'connection fields render inside the developer block');
expect(strpos($source, "do_settings_fields('webmcp_canary', 'webmcp_canary_main')") !== false, 'operator fields render above it');
expect(strpos($details, 'standard') !== false, 'the block reports the current plan');
expect(strpos($details, 'site-1') !== false, 'the block reports the site ID');
expect(strpos($details, WEBMCP_CANARY_VERSION) !== false, 'the block reports the plugin version');
expect(stripos($details, 'webmcp tag') === false, 'the developer block does not advertise the tag feature');

// The measurement screen no longer states the measurement limits.
$sov_start = strpos($source, "\nfunction webmcp_canary_sov_page(");
$sov_body = substr($source, $sov_start, strpos($source, "\n}\n", $sov_start) - $sov_start);
expect(stripos($sov_body, 'measurement conditions') === false, 'the measurement-conditions block is removed');
expect(stripos($sov_body, 'monthly limit') === false, 'the monthly quota is no longer shown');
foreach (array('AI appearance rate', 'Citation rate', 'vs previous', 'Trend', 'Competitors') as $kept) {
    expect(strpos($sov_body, $kept) !== false, "measurement still shows: {$kept}");
}

/* --- readme.txt: wordpress.org format and required W1 content ------------ */

$readme = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/readme.txt');
$readme_lines = explode("\n", $readme);
// wordpress.org shows this line as the listing title; it may add a descriptive subtitle after the plugin name.
expect($readme_lines[0] === '=== Nurevo AEO ===' || strpos($readme_lines[0], '=== Nurevo AEO – ') === 0, 'readme declares the Nurevo AEO plugin name');
expect(substr($readme_lines[0], -4) === ' ===' && mb_strlen($readme_lines[0]) <= 80, 'readme title is well formed and not overlong');

$headers = array();
foreach (array_slice($readme_lines, 1) as $line) {
    if (trim($line) === '') { break; }
    $parts = explode(':', $line, 2);
    if (count($parts) === 2) { $headers[trim($parts[0])] = trim($parts[1]); }
}
foreach (array('Contributors', 'Tags', 'Requires at least', 'Tested up to', 'Requires PHP', 'Stable tag', 'License', 'License URI') as $required_header) {
    expect(isset($headers[$required_header]), "readme header present: {$required_header}");
}
expect($headers['Stable tag'] === WEBMCP_CANARY_VERSION, 'readme stable tag matches the plugin version');

$tags = array_values(array_filter(array_map('trim', explode(',', $headers['Tags']))));
expect(count($tags) <= 5, 'readme uses at most five tags (wordpress.org limit)');
foreach ($tags as $tag) {
    expect(stripos($tag, 'yoast') === false && stripos($tag, 'rank math') === false && stripos($tag, 'rankmath') === false, "no third-party trademark in tag: {$tag}");
}
expect(stripos($readme_lines[0], 'yoast') === false && stripos($readme_lines[0], 'rank math') === false, 'no third-party trademark in the plugin title');

// The short description is the first non-empty line after the header block.
$short_description = '';
$in_header = true;
foreach (array_slice($readme_lines, 1) as $line) {
    if ($in_header) { if (trim($line) === '') { $in_header = false; } continue; }
    if (trim($line) !== '') { $short_description = trim($line); break; }
}
expect($short_description !== '', 'readme has a short description');
expect(mb_strlen($short_description) <= 150, 'readme short description fits the 150-character limit');

// Screenshots are listed here only because the matching screenshot-N.png files
// are committed to the SVN assets directory; a caption with no image behind it
// renders as a broken entry on wordpress.org.
foreach (array('== Description ==', '== Installation ==', '== Frequently Asked Questions ==', '== Screenshots ==', '== Changelog ==', '== Upgrade Notice ==') as $section) {
    expect(strpos($readme, $section) !== false, "readme section present: {$section}");
}

// readme.txt must be English: wordpress.org has required it since July 2025.
// The Japanese copy lives in languages/, not here, so these assertions check the
// English wording. See https://make.wordpress.org/plugins/2025/07/28/
expect(preg_match('/[\x{3040}-\x{30ff}\x{4e00}-\x{9fff}]/u', $readme) === 0, 'readme is written in English');

// AEO keywords appear naturally in the prose.
foreach (array('AEO', 'llms.txt', 'AI search', 'ChatGPT', 'Perplexity', 'Google AI', 'structured data', 'schema') as $keyword) {
    expect(stripos($readme, $keyword) !== false, "readme mentions AEO keyword: {$keyword}");
}
// Coexistence promise and pricing.
expect(strpos($readme, 'Yoast SEO') !== false && strpos($readme, 'Rank Math') !== false, 'readme states Yoast / Rank Math coexistence');
expect(stripos($readme, 'duplicate schema') !== false, 'readme states automatic duplicate-schema avoidance');
expect(strpos($readme, '0 JPY') !== false, 'readme lists the free price');
expect(strpos($readme, '3,000 JPY/month') !== false, 'readme lists the standard price');
expect(strpos($readme, '14,800 JPY/month') !== false, 'readme lists the upper plan price');
expect(stripos($readme, 'beta') !== false, 'readme marks the upper plan as beta');
expect(strpos($readme, 'No paid PHP is bundled') !== false, 'readme states no locked paid PHP is bundled');
expect(strpos($readme, 'Privacy Policy: https://nurevo.jp/privacy') !== false, 'readme discloses the privacy policy URL');
expect(strpos($readme, 'Terms of Service: https://nurevo.jp/terms') !== false, 'readme discloses the terms URL');

/* ------------------------------------------------------------------ *
 * Dashboard deep link (#7)
 * ------------------------------------------------------------------ */

// Where a person goes to manage their sites is fixed, and deliberately not
// derived from the configured service.
//
// This reverses an earlier decision. The link was once derived from the tag URL
// so that a canary install would not send its operator to production - a fair
// concern, but the tag URL is a technical endpoint, and pointing it at a
// development worker is a legitimate thing to do. The result was a real site's
// admin screen offering "View this site on the nurevo.jp dashboard" as a link
// to http://host.docker.internal:8799 - a machine that exists on one laptop.
//
// A link a human clicks now always goes to the product. API calls still follow
// the configured service, which is what actually needs to vary.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array(
    'tag_url' => 'https://nurevo.jp/tag.js',
    'site_id' => 'abc123def456',
);
expect(webmcp_canary_dashboard_url() === 'https://nurevo.jp/dashboard', 'the dashboard URL is the product');
expect(
    webmcp_canary_dashboard_url('abc123def456') === 'https://nurevo.jp/dashboard#site:abc123def456',
    'a site ID becomes a deep link'
);

// The case the change exists for: a development service must not drag the
// human-facing link onto a development host.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['tag_url'] = 'http://host.docker.internal:8799/tag.js';
expect(
    webmcp_canary_dashboard_url('abc123def456') === 'https://nurevo.jp/dashboard#site:abc123def456',
    'a development service does not move the dashboard link'
);
expect(
    strpos(webmcp_canary_dashboard_url('abc123def456'), 'host.docker.internal') === false,
    'and no development host can reach the link at all'
);

// Nor does an unconfigured service remove it. There is still a dashboard to
// send someone to, and this link is how they reach it in order to pair.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['tag_url'] = '';
expect(webmcp_canary_dashboard_url() === 'https://nurevo.jp/dashboard', 'an unconfigured service still has a dashboard');
expect(
    webmcp_canary_dashboard_url('abc123def456') === 'https://nurevo.jp/dashboard#site:abc123def456',
    'and still deep-links'
);

// API calls are the thing that must follow the service, and still do.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['tag_url'] = 'http://host.docker.internal:8799/tag.js';
expect(
    webmcp_canary_api_base() === 'http://host.docker.internal:8799',
    'the API base still follows the configured service'
);

// A site ID this plugin never received, or one that is not shaped like ours,
// must not be pasted into a URL - a link to the wrong site is worse than none.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['tag_url'] = 'https://nurevo.jp/tag.js';
expect(webmcp_canary_dashboard_url('') === 'https://nurevo.jp/dashboard', 'an empty site ID gives the plain dashboard');
expect(webmcp_canary_dashboard_url('   ') === 'https://nurevo.jp/dashboard', 'so does whitespace');
foreach (array('../../etc/passwd', '<script>alert(1)</script>', 'abc 123', 'abc-123', 'a#b', str_repeat('a', 65)) as $bad) {
    expect(webmcp_canary_dashboard_url($bad) === '', "a malformed site ID yields no URL: {$bad}");
}

/* ------------------------------------------------------------------ *
 * Pairing code (Phase 2)
 * ------------------------------------------------------------------ */

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array('tag_url' => 'https://nurevo.jp/tag.js');

// An empty code contacts nothing: a plugin with no code is a local-only install
// and has no reason to talk to the service.
unset($GLOBALS['webmcp_test_last_remote']);
$empty = webmcp_canary_pair_site('');
expect(is_wp_error($empty) && $empty->get_error_code() === 'webmcp_pair_invalid', 'an empty pairing code is refused locally');
expect(!isset($GLOBALS['webmcp_test_last_remote']), 'and sends no request');

// The successful case adopts what the service issued.
$GLOBALS['webmcp_test_remote'] = array('status' => 200, 'body' => wp_json_encode(array(
    'ok' => true, 'site_id' => 'abc123', 'site_key' => 'nrv_paired',
    'profile_token' => 'nrvp_token', 'plan' => 'free', 'domain' => 'example.test', 'paired' => true,
)));
$paired = webmcp_canary_pair_site('NRV-ABCDE-FGHJK-MNPQR-STUVW', 'https://nurevo.jp/tag.js');
expect(!is_wp_error($paired), 'a valid code pairs');
expect($paired['site_id'] === 'abc123' && $paired['site_key'] === 'nrv_paired', 'the site identifiers are adopted');
expect($paired['profile_token'] === 'nrvp_token', 'and the write token');
// Pairing links an install and grants nothing, so free is an ordinary answer.
// The licence path treats a free answer as a failure, which is exactly why a
// retail key could never be redeemed successfully.
expect($paired['plan'] === 'free', 'a free plan is a successful pairing, not a failure');

$sent = $GLOBALS['webmcp_test_last_remote'];
expect(strpos($sent['url'], '/api/pair') !== false, 'it is sent to the pairing endpoint');
$sent_body = json_decode($sent['args']['body'], true);
expect($sent_body['code'] === 'NRV-ABCDE-FGHJK-MNPQR-STUVW', 'the code is sent as typed');
expect(!empty($sent_body['domain']) && !empty($sent_body['site_url']), 'with this site’s own address');
expect($sent_body['install_type'] === 'wp', 'and its install type');

// A service that refuses says why, and the reason is actionable.
foreach (array(
    'domain_mismatch' => 'webmcp_pair_domain',
    'code_already_used' => 'webmcp_pair_used',
    'domain_already_paired' => 'webmcp_pair_taken',
    'rate_limited' => 'webmcp_pair_rate',
    'invalid_code' => 'webmcp_pair_invalid',
) as $service_error => $expected_code) {
    $GLOBALS['webmcp_test_remote'] = array('status' => 409, 'body' => wp_json_encode(array(
        'ok' => false, 'error' => $service_error, 'expected' => 'registered.test',
    )));
    $refused = webmcp_canary_pair_site('NRV-ABCDE-FGHJK-MNPQR-STUVW', 'https://nurevo.jp/tag.js');
    expect(is_wp_error($refused) && $refused->get_error_code() === $expected_code,
        "a refusal is reported as itself: {$service_error}");
}

// Saving the settings again must not re-send a code that was already redeemed.
// The sanitizer runs on every write of the option (cron, ruleset sync, autofill),
// and re-sending used to come back "code_already_used" and drop the plan to Free.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'tag_url' => 'https://nurevo.jp/tag.js', 'plan' => 'standard', 'site_id' => 'abc123',
    'site_key' => 'nrv_paired', 'profile_token' => 'nrvp_token',
    'pairing_code' => 'NRV-ABCDE-FGHJK-MNPQR-STUVW', // stored by 0.7.2 and earlier
));
$GLOBALS['webmcp_test_remote'] = array('status' => 409, 'body' => wp_json_encode(array('ok' => false, 'error' => 'code_already_used')));
unset($GLOBALS['webmcp_test_last_remote']);
$resaved = webmcp_canary_sanitize_settings(array_merge(webmcp_canary_settings(), array('business_name' => 'Renamed')));
expect(!isset($GLOBALS['webmcp_test_last_remote']), 'a re-submitted, already redeemed pairing code is not sent again');
expect($resaved['plan'] === 'standard', 'an unrelated save keeps the paid plan');
expect($resaved['pairing_code'] === '', 'the spent pairing code is not kept');
expect($resaved['site_id'] === 'abc123' && $resaved['site_key'] === 'nrv_paired', 'the site identifiers are kept');

// A plan written by the ruleset sync survives the sanitizer.
$synced = webmcp_canary_sanitize_settings(array_merge(webmcp_canary_settings(), array('plan' => 'pro', 'pairing_code' => '')));
expect($synced['plan'] === 'pro', 'a plan set by the service sync is kept through the sanitizer');

// The same licence key, already bound, is not redeemed again on every save.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['license_key'] = 'NRV-LIC-KEY';
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['pairing_code'] = '';
unset($GLOBALS['webmcp_test_last_remote']);
$relicensed = webmcp_canary_sanitize_settings(array_merge(webmcp_canary_settings(), array('business_name' => 'Again')));
expect(!isset($GLOBALS['webmcp_test_last_remote']), 'an already bound licence key is not sent again');
expect($relicensed['plan'] === 'standard', 'and the plan is kept');

// A new code is still sent.
$GLOBALS['webmcp_test_remote'] = array('status' => 200, 'body' => wp_json_encode(array(
    'ok' => true, 'site_id' => 'new1', 'site_key' => 'nrv_new', 'profile_token' => 'nrvp_new', 'plan' => 'pro', 'domain' => 'example.test', 'paired' => true,
)));
$fresh = webmcp_canary_sanitize_settings(array_merge(webmcp_canary_settings(), array('pairing_code' => 'NRV-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ')));
expect(isset($GLOBALS['webmcp_test_last_remote']) && strpos($GLOBALS['webmcp_test_last_remote']['url'], '/api/pair') !== false, 'a new pairing code is sent');
expect($fresh['plan'] === 'pro' && $fresh['site_id'] === 'new1', 'and its result is adopted');
expect($fresh['pairing_code'] === '', 'and the code is not kept afterwards');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array('tag_url' => 'https://nurevo.jp/tag.js');

// The domain mismatch names the domain to fix, because that is the one error
// the operator can do something about without contacting anyone.
$GLOBALS['webmcp_test_remote'] = array('status' => 409, 'body' => wp_json_encode(array(
    'ok' => false, 'error' => 'domain_mismatch', 'expected' => 'registered.test',
)));
$mismatch = webmcp_canary_pair_site('NRV-ABCDE-FGHJK-MNPQR-STUVW', 'https://nurevo.jp/tag.js');
expect(strpos($mismatch->get_error_message(), 'registered.test') !== false, 'the expected domain is named');

// An unreachable service is a transport failure, not a bad code.
$GLOBALS['webmcp_test_remote'] = new WP_Error('offline', 'offline');
$offline = webmcp_canary_pair_site('NRV-ABCDE-FGHJK-MNPQR-STUVW', 'https://nurevo.jp/tag.js');
expect(is_wp_error($offline) && $offline->get_error_code() === 'webmcp_pair_unreachable',
    'an unreachable service is not reported as an invalid code');

// The setting and its field exist, so the code can actually be entered.
$defaults = webmcp_canary_default_settings();
expect(array_key_exists('pairing_code', $defaults), 'the pairing code is a stored setting');
expect(strpos($source, "name=\"%1\$s[pairing_code]\"") !== false, 'and has an input to type it into');
expect(strpos($source, 'webmcp_canary_pairing_code_field') !== false, 'registered as a settings field');

// The licence route is still there for installs that predate pairing.
expect(array_key_exists('license_key', $defaults), 'the licence key setting is kept for existing installs');
expect(strpos($source, 'webmcp_canary_bind_license') !== false, 'and the licence path still exists');

unset($GLOBALS['webmcp_test_remote']);

/* ------------------------------------------------------------------ *
 * Per-type coexistence (Phase 4)
 * ------------------------------------------------------------------ */

// One flat list of "types an SEO plugin might emit" could not express what is
// needed, because the right answer runs in opposite directions by type. Article
// is ours only when nobody else publishes one; Product is theirs the moment
// WooCommerce is active; Service is ours unconditionally. Each type carries its
// own rule now, and these hold the three apart.

$rules = webmcp_canary_schema_type_rules();
foreach (array('WebSite', 'WebPage', 'Article', 'BlogPosting', 'FAQPage', 'Product', 'Service', 'Reservation') as $type) {
    expect(isset($rules[$type]), "every type carries a rule: {$type}");
}
expect($rules['Article']['basis'] === 'measured', 'Article is decided by what their page shows');
expect($rules['FAQPage']['basis'] === 'detected', 'FAQPage is decided by detection');
expect($rules['Product']['basis'] === 'detected', 'so is Product');
expect($rules['Service']['basis'] === 'always', 'Service is ours unconditionally');
expect($rules['Product']['publishers'] === array('commerce'), 'Product is published by the store plugin, not the SEO one');
expect($rules['FAQPage']['publishers'] === array('faq'), 'FAQPage is published by the SEO plugins that have an FAQ block');

$yoast_only = array('wordpress-seo/wp-seo.php' => 'Yoast SEO');
$woo_only = array('woocommerce/woocommerce.php' => 'WooCommerce');
$measured_nothing = array(
    'business' => array('state' => 'none', 'id' => ''), 'types' => array(),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
);

// WooCommerce publishes Product itself from WC_Structured_Data, so a store
// running it already has Product covered and must not get a second one. No page
// is read to find that out: a shop page is not the front page.
$with_woo = webmcp_canary_suppressed_schema_types($measured_nothing, array(), $woo_only);
expect(in_array('Product', $with_woo, true), 'WooCommerce active means Product is theirs');
expect(!in_array('FAQPage', $with_woo, true), 'and WooCommerce says nothing about FAQ');
expect(!in_array('Service', $with_woo, true), 'nor about Service');

$without_woo = webmcp_canary_suppressed_schema_types($measured_nothing, array(), array());
expect(!in_array('Product', $without_woo, true), 'without WooCommerce, Product is ours to publish');

// Yoast and Rank Math both ship an FAQ block. Their FAQ lives on inner pages
// the front-page measurement never reads, so waiting for a measurement would
// mean publishing a second FAQPage forever.
$with_yoast = webmcp_canary_suppressed_schema_types($measured_nothing, $yoast_only, array());
expect(in_array('FAQPage', $with_yoast, true), 'an SEO plugin with an FAQ block means FAQPage is theirs');
expect(!in_array('Product', $with_yoast, true), 'but an SEO plugin does not publish Product');

// The two opposite policies coexist on one site.
$both = webmcp_canary_suppressed_schema_types($measured_nothing, $yoast_only, $woo_only);
expect(in_array('Product', $both, true) && in_array('FAQPage', $both, true), 'both stand down when both publishers are present');
expect(!in_array('Service', $both, true), 'and Service still does not');
expect(!in_array('Article', $both, true), 'nor Article, which they were not measured publishing');

// Article is the opposite policy and must stay that way: measured, not detected.
$measured_article = array(
    'business' => array('state' => 'none', 'id' => ''), 'types' => array('Article', 'BlogPosting'),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
);
$article_seen = webmcp_canary_suppressed_schema_types($measured_article, $yoast_only, array());
expect(in_array('Article', $article_seen, true), 'an article node they were seen publishing is theirs');
expect(in_array('BlogPosting', $article_seen, true), 'and so is the post node');

// Nothing is suppressed for a site with no other plugin at all, whatever the
// measurement says.
$solo = webmcp_canary_suppressed_schema_types($measured_article, array(), array());
expect($solo === array(), 'with no other publisher active nothing stands down');

// The graph filter honours all of it, which is where it actually matters.
$mixed_graph = array(
    array('@type' => 'Product', 'name' => 'Bag'),
    array('@type' => 'FAQPage', 'mainEntity' => array()),
    array('@type' => 'Service', 'name' => 'Cut'),
    array('@type' => 'OpeningHoursSpecification', 'opens' => '09:00'),
);
$GLOBALS['webmcp_test_active_plugins'] = array('woocommerce/woocommerce.php');
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, $measured_nothing);
$woo_filtered = webmcp_canary_filter_schema_graph($mixed_graph, array('avoid_schema_duplicates' => '1'));
$woo_types = array();
foreach ($woo_filtered as $node) { foreach (webmcp_canary_schema_node_types($node) as $t) { $woo_types[$t] = true; } }
expect(!isset($woo_types['Product']), 'a WooCommerce store publishes no second Product from us');
expect(isset($woo_types['Service']) && isset($woo_types['OpeningHoursSpecification']), 'and keeps what nobody else publishes');
expect(isset($woo_types['FAQPage']), 'WooCommerce alone does not take the FAQ');

// Turning compatibility off still publishes everything, as it always did.
$off = webmcp_canary_filter_schema_graph($mixed_graph, array('avoid_schema_duplicates' => '0'));
expect($off === $mixed_graph, 'the compatibility toggle still overrides every per-type rule');

$GLOBALS['webmcp_test_active_plugins'] = array();
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);

// No page is fetched to reach any of these decisions.
$GLOBALS['webmcp_test_remote_get_log'] = array();
webmcp_canary_suppressed_schema_types($measured_nothing, $yoast_only, $woo_only);
expect(empty($GLOBALS['webmcp_test_remote_get_log']), 'deciding per-type coexistence fetches nothing');

/* ------------------------------------------------------------------ *
 * WooCommerce catalogue (Phase 5)
 * ------------------------------------------------------------------ */

// WooCommerce publishes Product JSON-LD itself and no llms.txt. So the schema
// is left alone - a second Product node would be a duplicate - and the
// catalogue is published as text, where nothing of theirs can collide with it.

$GLOBALS['webmcp_test_active_plugins'] = array();
$GLOBALS['webmcp_test_products'] = array();
expect(webmcp_canary_woocommerce_active() === false, 'no WooCommerce means no store');
expect(webmcp_canary_woocommerce_products() === array(), 'and no products to read');

$GLOBALS['webmcp_test_active_plugins'] = array('woocommerce/woocommerce.php');
$GLOBALS['webmcp_test_product_terms'] = array(11 => array('Coffee', 'Beans'));
$GLOBALS['webmcp_test_products'] = array(
    new WebmcpTestProduct(array('id' => 11, 'name' => 'Ethiopia Yirgacheffe', 'url' => 'https://example.test/p/yirgacheffe', 'sku' => 'ETH-001', 'price' => '1800', 'in_stock' => true)),
    new WebmcpTestProduct(array('id' => 12, 'name' => 'Decaf Blend', 'url' => 'https://example.test/p/decaf', 'sku' => '', 'price' => '1200', 'in_stock' => false)),
    new WebmcpTestProduct(array('id' => 13, 'name' => '', 'url' => 'https://example.test/p/unnamed', 'price' => '900')),
);
expect(webmcp_canary_woocommerce_active() === true, 'WooCommerce is detected');

$products = webmcp_canary_woocommerce_products();
expect(count($products) === 2, 'a product with no name is not something to tell a model about');
expect($products[0]['name'] === 'Ethiopia Yirgacheffe', 'the name is read');
expect($products[0]['sku'] === 'ETH-001' && $products[0]['price'] === '1800', 'with its SKU and price');
expect($products[0]['currency'] === 'JPY', 'and the store currency');
expect($products[0]['in_stock'] === true && $products[1]['in_stock'] === false, 'availability is read as a fact, not assumed');
expect($products[0]['categories'] === array('Coffee', 'Beans'), 'categories come through');

// The llms.txt line says what it is, what it costs and whether it can be had -
// the three things someone asking a model about a product wants.
$line = webmcp_canary_product_llms_line($products[0]);
expect(strpos($line, '[Ethiopia Yirgacheffe](https://example.test/p/yirgacheffe)') !== false, 'the product links to itself');
expect(strpos($line, 'JPY 1800') !== false, 'the price carries its currency');
expect(strpos($line, 'in stock') !== false, 'availability is stated');
expect(strpos($line, 'SKU ETH-001') !== false, 'the SKU is stated');
expect(strpos(webmcp_canary_product_llms_line($products[1]), 'out of stock') !== false, 'and so is being unavailable');

// The catalogue reaches llms.txt.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'enabled' => '1', 'business_name' => 'Example Coffee',
));
$llms = webmcp_canary_build_local_llms_txt();
expect(strpos($llms, '## Products') !== false, 'llms.txt gains a product section');
expect(strpos($llms, 'Ethiopia Yirgacheffe') !== false, 'with the products in it');
expect(strpos($llms, 'out of stock') !== false, 'and their availability');

// A site with no shop gets no empty section.
$GLOBALS['webmcp_test_active_plugins'] = array();
$no_shop = webmcp_canary_build_local_llms_txt();
expect(strpos($no_shop, '## Products') === false, 'a site with no shop has no product section');

// Product schema stays theirs. This is the whole coexistence decision for
// WooCommerce: they publish it, so we publish none.
$GLOBALS['webmcp_test_active_plugins'] = array('woocommerce/woocommerce.php');
expect(!in_array('Product', webmcp_canary_nurevo_schema_types(), true),
    'Product is not a type this plugin publishes');
$product_graph = array(array('@type' => 'Product', 'name' => 'Ethiopia Yirgacheffe'));
expect(webmcp_canary_filter_schema_graph($product_graph, array('avoid_schema_duplicates' => '1')) === array(),
    'and a Product node would be dropped before it reached the page');

// The measurement feed: the supply side only. Nothing is transmitted here.
$feed = webmcp_canary_measurement_feed();
expect($feed['source'] === 'woocommerce', 'the feed says where the catalogue came from');
expect($feed['product_count'] === 2, 'and how much of it there is');
expect($feed['products'][0]['name'] === 'Ethiopia Yirgacheffe', 'with the products the questions would be about');
expect(!isset($feed['products'][0]['in_stock']), 'stock is not part of what a question is asked about');

$GLOBALS['webmcp_test_active_plugins'] = array();
$empty_feed = webmcp_canary_measurement_feed();
expect($empty_feed['source'] === 'none', 'a site with no shop is distinguishable from a shop with no products');
expect($empty_feed['product_count'] === 0, 'and reports nothing to ask about');

// The snapshot is stored rather than rebuilt per request, and cleared when the
// shop goes away so a stale catalogue cannot outlive it.
$GLOBALS['webmcp_test_active_plugins'] = array('woocommerce/woocommerce.php');
$refreshed = webmcp_canary_refresh_catalog();
expect($refreshed['product_count'] === 2 && !empty($refreshed['refreshed_at']), 'the snapshot is stamped');
expect(get_option(WEBMCP_CANARY_CATALOG_OPTION)['product_count'] === 2, 'and stored');
$GLOBALS['webmcp_test_active_plugins'] = array();
webmcp_canary_refresh_catalog();
expect(get_option(WEBMCP_CANARY_CATALOG_OPTION, null) === null, 'deactivating the shop clears the snapshot');

$GLOBALS['webmcp_test_products'] = array();
$GLOBALS['webmcp_test_product_terms'] = array();

/* ------------------------------------------------------------------ *
 * Hand-entered FAQ (Phase 6)
 * ------------------------------------------------------------------ */

// This is content the operator typed into Nurevo. The per-type rule that makes
// FAQPage theirs is about not repeating an SEO plugin's own FAQ block, which
// holds different questions - so it does not apply here, and this is published
// whether or not such a plugin is active.

delete_option(WEBMCP_CANARY_FAQ_OPTION);
expect(webmcp_canary_faq_entries() === array(), 'no FAQ by default');
expect(webmcp_canary_faq_schema_node('https://example.test/') === null, 'and no node to publish');

$saved = webmcp_canary_save_faq_entries(array(
    array('q' => '駐車場はありますか？', 'a' => '店舗横に3台分あります。'),
    array('q' => '  予約は必要ですか？  ', 'a' => " 当日席もご用意しています。 "),
    array('q' => 'Half a pair', 'a' => ''),
    array('q' => '', 'a' => 'Orphan answer'),
    'not an entry',
));
expect(count($saved) === 2, 'half a pair answers nothing, so it is not stored');
$entries = webmcp_canary_faq_entries();
expect($entries[1]['q'] === '予約は必要ですか？', 'surrounding space is trimmed');

// The read side filters too, not only the save side: the option can be written
// by hand, by an older build, or by anything else that touches wp_options, and
// half a pair must not reach a page from any of those routes.
update_option(WEBMCP_CANARY_FAQ_OPTION, array(
    array('q' => 'Good', 'a' => 'Pair'),
    array('q' => 'Question with no answer', 'a' => ''),
    array('q' => '', 'a' => 'Answer with no question'),
    array('q' => '   ', 'a' => '   '),
));
$from_dirty = webmcp_canary_faq_entries();
expect(count($from_dirty) === 1, 'a hand-written option is filtered on the way out as well');
expect($from_dirty[0]['q'] === 'Good', 'and the usable pair survives');
$dirty_node = webmcp_canary_faq_schema_node('https://example.test/');
expect(count($dirty_node['mainEntity']) === 1, 'so the node carries only complete pairs');

webmcp_canary_save_faq_entries(array(
    array('q' => '駐車場はありますか？', 'a' => '店舗横に3台分あります。'),
    array('q' => '予約は必要ですか？', 'a' => '当日席もご用意しています。'),
));
$node = webmcp_canary_faq_schema_node('https://example.test/');
expect($node['@type'] === 'FAQPage', 'the node is an FAQPage');
expect(count($node['mainEntity']) === 2, 'with one entry per pair');
expect($node['mainEntity'][0]['@type'] === 'Question', 'each is a Question');
expect($node['mainEntity'][0]['name'] === '駐車場はありますか？', 'carrying the question');
expect($node['mainEntity'][0]['acceptedAnswer']['@type'] === 'Answer', 'and an Answer');
expect($node['mainEntity'][0]['acceptedAnswer']['text'] === '店舗横に3台分あります。', 'carrying the answer');

// The id is ours. An SEO plugin's FAQ block may publish its own FAQPage on the
// same page; the two are different documents and merging them under one id
// would claim their questions are ours.
expect($node['@id'] === 'https://example.test/#nurevo-faq', 'the id is namespaced to this plugin');
expect(strpos($node['@id'], 'nurevo') !== false, 'and says so');

// Google accepts FAQPage markup only for questions a visitor can read on the
// page. The FAQ is therefore published only on a page that renders it with
// the block or the shortcode - not on the front page by default any more.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'enabled' => '1', 'serve_schema' => '1', 'business_name' => 'Example', 'faq_page_id' => '0',
));
$GLOBALS['webmcp_test_options']['blog_public'] = 1;
ob_start();
webmcp_canary_output_server_schema();
$front_without_faq = ob_get_clean();
expect(strpos($front_without_faq, '"FAQPage"') === false, 'the front page alone no longer publishes an FAQ nobody can see');

// A page that does not render the FAQ publishes none.
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 12, 'post_content' => '<p>About us</p>', 'post_title' => 'About', 'permalink' => 'https://example.test/about/');
$GLOBALS['webmcp_test_front_page'] = false;
expect(webmcp_canary_faq_visible_post() === null, 'a page without the shortcode or block does not show the FAQ');
// Choosing it as the faq page does not change that.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['faq_page_id'] = '12';
ob_start();
webmcp_canary_output_server_schema();
$chosen_without_faq = ob_get_clean();
expect(strpos($chosen_without_faq, '"FAQPage"') === false, 'the chosen faq page publishes no FAQ unless it renders it');

// With the shortcode it does, under that page's URL.
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 12, 'post_content' => "<p>Questions</p>\n[nurevo_faq]", 'post_title' => 'FAQ', 'permalink' => 'https://example.test/faq/');
expect(webmcp_canary_faq_visible_post() !== null, 'the shortcode makes the FAQ visible');
ob_start();
webmcp_canary_output_server_schema();
$faq_output = ob_get_clean();
expect(strpos($faq_output, 'https://example.test/faq/#nurevo-faq') !== false, 'the FAQ is published under the page that shows it');

// Any singular page with the block counts, chosen or not.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['faq_page_id'] = '0';
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 40, 'post_content' => '<!-- wp:nurevo/faq /-->', 'post_title' => 'Help', 'permalink' => 'https://example.test/help/');
ob_start();
webmcp_canary_output_server_schema();
$block_output = ob_get_clean();
expect(strpos($block_output, '"FAQPage"') !== false && strpos($block_output, 'https://example.test/help/#nurevo-faq') !== false,
    'the block publishes the FAQ on its page');

// The rendered FAQ is accessible HTML and escapes what was typed.
update_option(WEBMCP_CANARY_FAQ_OPTION, array(array('q' => '駐車場はありますか？', 'a' => "店舗横に3台分あります。"), array('q' => 'Tags <b>?', 'a' => "Line one\n<script>x</script>")));
$rendered = webmcp_canary_render_faq();
expect(substr_count($rendered, '<details') === 2 && substr_count($rendered, '<summary') === 2, 'one <details>/<summary> per question');
expect(strpos($rendered, '<script>') === false && strpos($rendered, '&lt;script&gt;') !== false, 'the answer is escaped');
expect(strpos($rendered, 'Tags &lt;b&gt;?') !== false, 'and so is the question');
expect(strpos($rendered, '<br') !== false, 'line breaks in an answer are kept');
expect(isset($GLOBALS['webmcp_test_shortcodes']['nurevo_faq']), 'the [nurevo_faq] shortcode is registered');
delete_option(WEBMCP_CANARY_FAQ_OPTION);
expect(webmcp_canary_render_faq() === '', 'no FAQ renders nothing');
webmcp_canary_save_faq_entries(array(array('q' => '駐車場はありますか？', 'a' => '店舗横に3台分あります。')));

// The block is server-rendered by the same function, with no build step.
$GLOBALS['webmcp_test_blocks'] = array();
webmcp_canary_register_faq_block();
expect(isset($GLOBALS['webmcp_test_blocks']['nurevo/faq']), 'the nurevo/faq block is registered');
expect($GLOBALS['webmcp_test_blocks']['nurevo/faq']['render_callback'] === 'webmcp_canary_render_faq', 'and rendered on the server');
expect(strpos(webmcp_canary_faq_block_editor_js(), "registerBlockType('nurevo/faq'") !== false, 'with a plain-JS editor registration');

// The settings screen tells the owner how to show it.
expect(strpos($source, '[nurevo_faq]') !== false && strpos($source, 'place the %1$s block or the %2$s shortcode') !== false,
    'the settings help names the block and the shortcode');

// The rest of this section runs on the FAQ page.
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 12, 'post_content' => '[nurevo_faq]', 'post_title' => 'FAQ', 'permalink' => 'https://example.test/faq/');
ob_start();
webmcp_canary_output_server_schema();
$faq_output = ob_get_clean();
expect(strpos($faq_output, '"FAQPage"') !== false, 'the FAQ reaches the page');
expect(strpos($faq_output, '駐車場はありますか？') !== false, 'with the operator\'s own question');
expect(strpos($faq_output, '#nurevo-faq') !== false, 'under our id');

// And it survives an SEO plugin being active, which is the whole point.
$GLOBALS['webmcp_test_active_plugins'] = array('wordpress-seo/wp-seo.php');
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array(
    'business' => array('state' => 'complete', 'id' => 'https://example.test/#rival'),
    'types' => array('Organization', 'WebSite', 'WebPage', 'FAQPage'),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
));
ob_start();
webmcp_canary_output_server_schema();
$with_yoast = ob_get_clean();
expect(strpos($with_yoast, '"FAQPage"') !== false, 'a hand-entered FAQ is published even with Yoast active');
expect(strpos($with_yoast, '駐車場はありますか？') !== false, 'because it is the operator\'s content, not a repeat of theirs');

// A Nurevo-generated FAQPage node - as opposed to this hand-entered one - is
// still filtered, so the rule itself is intact.
expect(in_array('FAQPage', webmcp_canary_suppressed_schema_types(null, array('wordpress-seo/wp-seo.php' => 'Yoast SEO')), true),
    'the FAQPage coexistence rule is unchanged');

// The ownership table reports it, now that it is really published.
expect(in_array('FAQPage', webmcp_canary_nurevo_schema_types(), true), 'FAQPage is listed once there is an FAQ');
delete_option(WEBMCP_CANARY_FAQ_OPTION);
expect(!in_array('FAQPage', webmcp_canary_nurevo_schema_types(), true), 'and not listed when there is none');

// An empty FAQ publishes nothing rather than an empty node.
ob_start();
webmcp_canary_output_server_schema();
$no_faq = ob_get_clean();
expect(strpos($no_faq, '"FAQPage"') === false, 'no FAQ means no FAQPage node');

$GLOBALS['webmcp_test_active_plugins'] = array();
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);
$GLOBALS['webmcp_test_queried'] = null;
$GLOBALS['webmcp_test_front_page'] = true;

// The input exists to type into, and the services page selector with it.
expect(strpos($source, 'name="%2$s[faq][%3$d][q]"') !== false, 'there is a question input');
expect(strpos($source, 'name="%2$s[faq_page_id]"') !== false, 'and a page selector');
expect(strpos($source, 'webmcp_canary_faq_field') !== false, 'registered as a settings field');

// More pairs than the cap are not stored.
$many = array();
for ($i = 0; $i < WEBMCP_CANARY_MAX_FAQ + 5; $i++) { $many[] = array('q' => "q{$i}", 'a' => "a{$i}"); }
expect(count(webmcp_canary_save_faq_entries($many)) === WEBMCP_CANARY_MAX_FAQ, 'the cap is a cap');
delete_option(WEBMCP_CANARY_FAQ_OPTION);

/* ------------------------------------------------------------------ *
 * Hand-entered services (Phase 7)
 * ------------------------------------------------------------------ */

// Hand-entered rather than read from a booking plugin. Amelia and the others
// expose no documented API for third parties, so reading them would mean
// querying undocumented tables and guessing at whether a duration is stored in
// seconds or minutes. Everything here is a value someone typed, including the
// unit and the booking URL, so nothing is inferred.

delete_option(WEBMCP_CANARY_SERVICES_OPTION);
expect(webmcp_canary_service_entries() === array(), 'no services by default');
expect(webmcp_canary_service_schema_nodes('https://example.test/', 'https://example.test/#organization') === array(),
    'and nothing to publish');

$saved_services = webmcp_canary_save_service_entries(array(
    array('name' => 'カット', 'minutes' => '45', 'price' => '4500', 'currency' => 'jpy', 'category' => 'ヘア', 'reserve_url' => 'https://example.test/book/cut'),
    array('name' => 'ヘッドスパ', 'minutes' => '30', 'price' => '', 'currency' => '', 'category' => '', 'reserve_url' => ''),
    array('name' => '', 'minutes' => '60', 'price' => '9000'),
    'not an entry',
));
expect(count($saved_services) === 2, 'a service with no name is not published');
$services = webmcp_canary_service_entries();
expect($services[0]['minutes'] === 45, 'the duration is kept as the number of minutes it says it is');
expect($services[0]['currency'] === 'JPY', 'the currency is normalised to its usual case');

// The read side filters too: the option can be written by hand or by an older
// build, and a nameless service must not reach a page from any route.
update_option(WEBMCP_CANARY_SERVICES_OPTION, array(
    array('name' => 'Good', 'minutes' => 10),
    array('name' => '', 'minutes' => 20),
    array('name' => '   ', 'price' => '1'),
));
expect(count(webmcp_canary_service_entries()) === 1, 'a hand-written option is filtered on the way out as well');

webmcp_canary_save_service_entries($saved_services);
$nodes = webmcp_canary_service_schema_nodes('https://example.test/', 'https://example.test/#organization');
expect(count($nodes) === 2, 'one node per service');
expect($nodes[0]['@type'] === 'Service', 'each is a Service');
expect($nodes[0]['name'] === 'カット', 'carrying the name');
expect($nodes[0]['provider']['@id'] === 'https://example.test/#organization', 'offered by the business node');
expect($nodes[0]['category'] === 'ヘア', 'with its category when there is one');
expect(!isset($nodes[1]['category']), 'and none when there is not');

// Service has no duration term, so the minutes go in additionalProperty with a
// unit rather than into an invented property.
expect($nodes[0]['additionalProperty']['value'] === 45, 'the duration is published');
expect($nodes[0]['additionalProperty']['unitCode'] === 'MIN', 'in minutes, stated as a unit');
expect($nodes[0]['additionalProperty']['unitText'] === 'minutes', 'and in words');

expect($nodes[0]['offers']['@type'] === 'Offer' && $nodes[0]['offers']['price'] === '4500', 'the price is an Offer');
expect($nodes[0]['offers']['priceCurrency'] === 'JPY', 'with its currency');
expect(!isset($nodes[1]['offers']), 'a service with no price carries no Offer rather than a blank one');

// ReserveAction points at the URL the operator entered - nothing is derived.
expect($nodes[0]['potentialAction']['@type'] === 'ReserveAction', 'the service is bookable');
expect($nodes[0]['potentialAction']['target']['@type'] === 'EntryPoint', 'through an entry point');
expect($nodes[0]['potentialAction']['target']['urlTemplate'] === 'https://example.test/book/cut',
    'at the exact URL that was entered');
// result is a Reservation because that is what the action produces. A bare
// Reservation node would claim a booking already exists.
expect($nodes[0]['potentialAction']['result']['@type'] === 'Reservation', 'and produces a Reservation');
expect(!isset($nodes[1]['potentialAction']), 'a service with no booking URL is not claimed to be bookable');

// The ids are ours, and distinct per service.
expect($nodes[0]['@id'] === 'https://example.test/#nurevo-service-1', 'the id is namespaced to this plugin');
expect($nodes[1]['@id'] === 'https://example.test/#nurevo-service-2', 'and unique per service');

// They reach the page.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'enabled' => '1', 'serve_schema' => '1', 'business_name' => 'Example', 'faq_page_id' => '0',
));
$GLOBALS['webmcp_test_options']['blog_public'] = 1;
ob_start();
webmcp_canary_output_server_schema();
$service_output = ob_get_clean();
expect(strpos($service_output, '"Service"') !== false, 'the services reach the page');
expect(strpos($service_output, '"ReserveAction"') !== false, 'with their booking action');
expect(strpos($service_output, '"Reservation"') !== false, 'and the reservation it produces');
expect(strpos($service_output, 'https://example.test/book/cut') !== false, 'pointing at the entered URL');
expect(strpos($service_output, '#nurevo-service-1') !== false, 'under our id');
expect(strpos($service_output, '"FAQPage"') === false, 'services stay on the front page without the FAQ riding along');

// With a chosen page, services move there - whether or not it shows the FAQ.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['faq_page_id'] = '12';
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 12, 'post_content' => '<p>Menu</p>', 'post_title' => 'Menu', 'permalink' => 'https://example.test/menu/');
$GLOBALS['webmcp_test_front_page'] = false;
ob_start();
webmcp_canary_output_server_schema();
$chosen_services = ob_get_clean();
expect(strpos($chosen_services, 'https://example.test/menu/#nurevo-service-1') !== false, 'services are published on the chosen page');
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 13, 'post_content' => '', 'post_title' => 'Other', 'permalink' => 'https://example.test/other/');
ob_start();
webmcp_canary_output_server_schema();
expect(strpos(ob_get_clean(), '"Service"') === false, 'and not on other pages');
$GLOBALS['webmcp_test_queried'] = null;
$GLOBALS['webmcp_test_front_page'] = true;
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['faq_page_id'] = '0';

// Nobody else publishes Service, so an SEO plugin changes nothing here.
$GLOBALS['webmcp_test_active_plugins'] = array('wordpress-seo/wp-seo.php', 'woocommerce/woocommerce.php');
update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array(
    'business' => array('state' => 'complete', 'id' => 'https://example.test/#rival'),
    'types' => array('Organization', 'WebSite', 'WebPage'),
    'conflict' => false, 'measured_at' => time(), 'signature' => 'test',
));
ob_start();
webmcp_canary_output_server_schema();
$with_others = ob_get_clean();
expect(strpos($with_others, '"Service"') !== false, 'services survive every other plugin, because none of them publish Service');
$GLOBALS['webmcp_test_active_plugins'] = array();
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);

// llms.txt lists them.
$service_llms = webmcp_canary_build_local_llms_txt();
expect(strpos($service_llms, '## Services') !== false, 'llms.txt gains a service section');
expect(strpos($service_llms, '45 min') !== false, 'with the duration in the unit it was entered in');
expect(strpos($service_llms, 'JPY 4500') !== false, 'and the price with its currency');

// The ownership table reports it only once there is one.
expect(in_array('Service', webmcp_canary_nurevo_schema_types(), true), 'Service is listed once there is a service');
delete_option(WEBMCP_CANARY_SERVICES_OPTION);
expect(!in_array('Service', webmcp_canary_nurevo_schema_types(), true), 'and not listed when there is none');
$no_service_llms = webmcp_canary_build_local_llms_txt();
expect(strpos($no_service_llms, '## Services') === false, 'nor does llms.txt carry an empty section');

// The inputs exist to type into.
foreach (array('[name]', '[minutes]', '[price]', '[currency]', '[category]', '[reserve_url]') as $input_name) {
    expect(strpos($source, '[services][%3$d]' . $input_name) !== false, "there is an input for {$input_name}");
}
expect(strpos($source, 'webmcp_canary_services_field') !== false, 'registered as a settings field');

$many_services = array();
for ($i = 0; $i < WEBMCP_CANARY_MAX_SERVICES + 5; $i++) { $many_services[] = array('name' => "s{$i}"); }
expect(count(webmcp_canary_save_service_entries($many_services)) === WEBMCP_CANARY_MAX_SERVICES, 'the cap is a cap');
delete_option(WEBMCP_CANARY_SERVICES_OPTION);

/* ------------------------------------------------------------------ *
 * A pull must not clear what this site already knows
 * ------------------------------------------------------------------ */

// The first pull after pairing wiped the shop. A site the dashboard has just
// created has an empty profile, so every field extracted locally was
// overwritten with "" and then pushed back up as empty - the install lost its
// own data by connecting. Empty means "not filled in there", which is the same
// rule mergeProfile applies on the way up.

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'business_name' => 'Lumina Omotesando',
    'business_address' => '3-2-6 Kanda-Misakicho, Chiyoda-ku, Tokyo',
    'business_phone' => '03-1234-5678',
    'business_hours' => 'Tue-Sun 11:00-20:00',
    'business_type' => 'HairSalon',
));
// Exactly what a freshly created site answers: every canonical field null.
webmcp_canary_apply_remote_profile(array('profile' => array(
    'name' => null, 'description' => null, 'address' => null, 'phone' => null,
    'hours' => null, 'business_type_schema' => null, 'email' => null, 'url' => null,
), 'field_sources' => array(), 'updated_at' => 0));
$after_empty_pull = webmcp_canary_settings();
expect($after_empty_pull['business_name'] === 'Lumina Omotesando', 'an empty remote does not clear the local name');
expect($after_empty_pull['business_address'] !== '', 'nor the address');
expect($after_empty_pull['business_phone'] === '03-1234-5678', 'nor the phone');
expect($after_empty_pull['business_hours'] !== '', 'nor the hours');
expect($after_empty_pull['business_type'] === 'HairSalon', 'nor the business type');

// What the push would then send - the bug ended with empty values going up.
$payload = webmcp_canary_local_profile();
expect($payload['name'] === 'Lumina Omotesando', 'so the push still carries the real values');
expect($payload['address'] !== '', 'and the real address');

// A remote value that is actually set still wins: the service is the canonical
// record, and this is a mirror.
webmcp_canary_apply_remote_profile(array('profile' => array(
    'name' => 'Renamed From Dashboard', 'phone' => null,
), 'field_sources' => array(), 'updated_at' => 0));
$after_real_pull = webmcp_canary_settings();
expect($after_real_pull['business_name'] === 'Renamed From Dashboard', 'a real remote value is adopted');
expect($after_real_pull['business_phone'] === '03-1234-5678', 'while an empty one beside it changes nothing');

// An empty remote may still fill a field that is empty here.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['business_email'] = '';
webmcp_canary_apply_remote_profile(array('profile' => array('email' => 'hello@example.test'), 'field_sources' => array(), 'updated_at' => 0));
expect(webmcp_canary_settings()['business_email'] === 'hello@example.test', 'an empty local field is still filled from the service');

/* ------------------------------------------------------------------ *
 * The catalogue payload the plugin sends
 * ------------------------------------------------------------------ */

$GLOBALS['webmcp_test_active_plugins'] = array('woocommerce/woocommerce.php');
$GLOBALS['webmcp_test_product_terms'] = array(21 => array('Coffee'));
$GLOBALS['webmcp_test_products'] = array(
    new WebmcpTestProduct(array('id' => 21, 'name' => 'Yirgacheffe', 'url' => 'https://x.test/p', 'sku' => 'E1', 'price' => '1800', 'in_stock' => true)),
);
webmcp_canary_save_service_entries(array(array('name' => 'Cut', 'minutes' => 45, 'price' => '4500', 'currency' => 'JPY', 'reserve_url' => 'https://x.test/book')));
webmcp_canary_save_faq_entries(array(array('q' => 'Parking?', 'a' => 'Three spaces.')));
$GLOBALS['webmcp_test_posts'] = array((object) array('ID' => 9, 'post_content' => 'x'));

$catalog = webmcp_canary_catalog_payload();
expect(count($catalog['products']) === 1, 'the catalogue carries the shop');
expect($catalog['products'][0]['name'] === 'Yirgacheffe', 'with product names');
expect($catalog['products'][0]['in_stock'] === true, 'and availability as a fact');
expect($catalog['products'][0]['categories'] === array('Coffee'), 'and categories');
expect($catalog['product_source'] === 'woocommerce', 'naming where the products came from');
expect(count($catalog['services']) === 1 && $catalog['services'][0]['minutes'] === 45, 'services carry their duration in minutes');
expect($catalog['services'][0]['reserve_url'] === 'https://x.test/book', 'and the entered booking URL');
expect(count($catalog['faqs']) === 1 && $catalog['faqs'][0]['question'] === 'Parking?', 'the FAQ is carried as question/answer');
expect(array_key_exists('pages', $catalog), 'and the pages');

// A site with no shop says so rather than omitting the key, because an absent
// list means "not supplied" to the service and would leave a stale catalogue.
$GLOBALS['webmcp_test_active_plugins'] = array();
$no_shop = webmcp_canary_catalog_payload();
expect($no_shop['products'] === array(), 'a site with no shop sends an empty product list');
expect($no_shop['product_source'] === 'none', 'and says the shop is absent');
expect(array_key_exists('products', $no_shop), 'the key is present, so the service clears what it held');

// Not configured: nothing is sent at all.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('site_id' => '', 'profile_token' => ''));
$unconfigured = webmcp_canary_push_catalog();
expect(is_wp_error($unconfigured), 'an unpaired install sends no catalogue');

/* ------------------------------------------------------------------ *
 * A freshly paired site must not look empty
 *
 * Pairing happens inside the settings sanitiser, where the site ID and write
 * token exist only as local variables - they reach the option when WordPress
 * stores the sanitiser's return value, which is after the sanitiser has run.
 * So the push is deferred by a flag that the next admin request drains.
 *
 * The flag assignment and the flag write were in different functions: the
 * sanitiser set $push_catalog_after_save and webmcp_canary_default_settings()
 * read it, where it was always undefined. The deferred push therefore never
 * happened, and a site stayed blank in the dashboard until a cron run. This
 * pins the flag to the function that actually knows pairing succeeded.
 * ------------------------------------------------------------------ */

delete_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION);
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('site_id' => '', 'profile_token' => ''));
$GLOBALS['webmcp_test_remote'] = array('status' => 200, 'body' => wp_json_encode(array(
    'ok' => true, 'plan' => 'free', 'site_id' => 'paired01',
    'site_key' => 'nrv_paired', 'profile_token' => 'nrvp_paired', 'domain' => 'example.test',
)));
$paired = webmcp_canary_sanitize_settings(array(
    'enabled' => '1', 'tag_url' => 'https://nurevo.jp/tag.js', 'pairing_code' => 'NRV-AAAAA-BBBBB-CCCCC-DDDDD',
));
expect($paired['site_id'] === 'paired01', 'pairing adopts the issued site ID');
expect($paired['profile_token'] === 'nrvp_paired', 'and the write token');
expect(get_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION, 0) == 1, 'pairing leaves the catalogue push pending');

// The next request stores what the sanitiser returned, then drains the flag.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $paired;
unset($GLOBALS['webmcp_test_last_remote']);
$GLOBALS['webmcp_test_remote_log'] = array();
webmcp_canary_drain_pending_catalog();
expect(!get_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION, 0), 'draining clears the flag so it fires once');
// The catalogue goes first; the learning snapshot follows it in the same sync.
expect(
    isset($GLOBALS['webmcp_test_remote_log'][0]) && strpos($GLOBALS['webmcp_test_remote_log'][0]['url'], '/api/sites/paired01/catalog') !== false,
    'and the catalogue is sent for the site pairing just issued'
);

// Nothing pending means nothing sent: the drain is not a second sync path.
unset($GLOBALS['webmcp_test_last_remote']);
webmcp_canary_drain_pending_catalog();
expect(!isset($GLOBALS['webmcp_test_last_remote']), 'a drain with no flag sends nothing');

// A pairing that failed leaves nothing pending - there is no site to send to.
delete_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION);
$GLOBALS['webmcp_test_remote'] = array('status' => 404, 'body' => '{"ok":false,"error":"invalid_code"}');
webmcp_canary_sanitize_settings(array('tag_url' => 'https://nurevo.jp/tag.js', 'pairing_code' => 'NRV-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ'));
expect(!get_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION, 0), 'a rejected code leaves no pending push');

// And an ordinary save with no code does not queue one either.
delete_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION);
webmcp_canary_sanitize_settings(array('enabled' => '1', 'tag_url' => 'https://nurevo.jp/tag.js'));
expect(!get_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION, 0), 'saving settings without pairing queues nothing');

/* ------------------------------------------------------------------ *
 * The diagnosis speaks the site's language
 *
 * The checks are worded by the service, not here. The plugin never said which
 * language it wanted, so the checklist came back in English and sat in the
 * middle of admin screens that were otherwise translated - which is what "the
 * diagnosis page is not in Japanese" actually was.
 * ------------------------------------------------------------------ */

$GLOBALS['webmcp_test_locale'] = 'ja';
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'tag_url' => 'https://nurevo.jp/tag.js', 'site_id' => 'site1', 'site_key' => 'nrv_k',
));
$lang_endpoints = webmcp_canary_aeo_score_endpoints();
expect(count($lang_endpoints) > 0, 'a configured site has diagnosis endpoints');
foreach ($lang_endpoints as $endpoint) {
    expect(strpos($endpoint, 'lang=ja') !== false, 'every endpoint asks for the site language: ' . $endpoint);
}

$GLOBALS['webmcp_test_locale'] = 'en_US';
foreach (webmcp_canary_aeo_score_endpoints() as $endpoint) {
    expect(strpos($endpoint, 'lang=en-us') !== false, 'and follows the site when it changes');
}

// A cached diagnosis is wording in one language. Switching the site language
// must fetch again rather than keep showing the previous one.
$GLOBALS['webmcp_test_locale'] = 'ja';
$ja_identity = webmcp_canary_aeo_score_identity();
$GLOBALS['webmcp_test_locale'] = 'en_US';
expect(webmcp_canary_aeo_score_identity() !== $ja_identity, 'the cache is not shared across languages');
$GLOBALS['webmcp_test_locale'] = 'ja';

/* ------------------------------------------------------------------ *
 * A failed diagnosis says so, instead of "Checking" for ever
 *
 * The page discarded the WP_Error and rendered the pending badge whenever the
 * score was missing, so a diagnosis that had actually failed was
 * indistinguishable from one still in flight - and there was nothing to press.
 * ------------------------------------------------------------------ */

$pending = webmcp_canary_aeo_view(null);
expect($pending['band'] === 'pending', 'no score and no error is still pending');
expect($pending['badge'] === 'Checking', 'and keeps the pending badge');

$failed = webmcp_canary_aeo_view(null, new WP_Error('webmcp_aeo_unreachable', 'AEO diagnosis is not available yet.'));
expect($failed['band'] === 'error', 'a failure is its own state, not pending');
expect($failed['badge'] === 'Could not diagnose', 'and says so');
expect($failed['heading'] === 'AEO diagnosis is not available yet.', 'carrying the reason it failed');
expect($failed['error_code'] === 'webmcp_aeo_unreachable', 'and the code, for the page to act on');
expect($failed['score'] === null, 'with no score invented');

// An unreachable service is the common case: a site that is not yet public.
$GLOBALS['webmcp_test_remote_get'] = array();
delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
$unreachable = webmcp_canary_get_aeo_score(true);
expect(is_wp_error($unreachable), 'an unreachable service returns the error rather than a score');
expect(webmcp_canary_aeo_view(null, $unreachable)['band'] === 'error', 'which the page can show');

// And a real answer still wins.
$GLOBALS['webmcp_test_remote_get'] = array('api/sites/site1/aeo-score' => array('status' => 200, 'body' => $aeo_body));
delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
$ok = webmcp_canary_get_aeo_score(true);
expect(!is_wp_error($ok), 'a registered site is diagnosed through its own endpoint');
expect(webmcp_canary_aeo_view($ok, null)['score'] !== null, 'and the score renders');
$GLOBALS['webmcp_test_remote_get'] = array();

$GLOBALS['webmcp_test_products'] = array();
$GLOBALS['webmcp_test_product_terms'] = array();
delete_option(WEBMCP_CANARY_SERVICES_OPTION);
delete_option(WEBMCP_CANARY_FAQ_OPTION);

$field_view = webmcp_canary_aeo_check_view(array(
    'id' => 'schema', 'status' => 'WARN', 'message' => '1/2 fields published.',
    'fields' => array(array('present' => true), array('present' => false)),
));
expect(strpos($field_view['label'], '(1/2)') !== false, 'plugin heading shows the published field count');
expect($field_view['message'] === '1/2 fields published.', 'plugin preserves the field diagnosis message');

/* --- 0.7.4: robots.txt splits search and training crawlers ------------- */

$wp_robots = "User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\n\nSitemap: https://example.test/wp-sitemap.xml\n";
expect(webmcp_canary_robots_wildcard_rules($wp_robots) === array('Disallow: /wp-admin/', 'Allow: /wp-admin/admin-ajax.php'),
    'the site\'s "*" rules are read from robots.txt');
expect(webmcp_canary_robots_wildcard_rules("User-agent: Googlebot\nUser-agent: *\nDisallow: /private/\n\nUser-agent: Bingbot\nDisallow: /bing-only/\n") === array('Disallow: /private/'),
    'a "*" sharing a group with another agent is read, other groups are not');
expect(webmcp_canary_robots_wildcard_rules("User-agent: *\nDisallow:\nAllow: /\n") === array(),
    'empty and root rules add nothing to copy');

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array('enabled' => '1', 'allow_ai_crawlers' => '1'));
$robots = webmcp_canary_allow_ai_crawlers_robots_txt($wp_robots, true);
foreach (webmcp_canary_ai_search_agents() as $agent) {
    expect(strpos($robots, "User-agent: {$agent}\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nAllow: /\n") !== false,
        "{$agent} is allowed and keeps the site's /wp-admin/ rules");
}
expect(strpos($robots, 'GPTBot') === false && strpos($robots, 'ClaudeBot') === false && strpos($robots, 'Google-Extended') === false,
    'training crawlers are left to the site\'s robots.txt by default');
expect(strpos($robots, "Disallow: /\n") === false, 'nothing is blocked by default');

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['ai_training'] = 'block';
$robots = webmcp_canary_allow_ai_crawlers_robots_txt($wp_robots, true);
foreach (webmcp_canary_ai_training_agents() as $agent) {
    expect(strpos($robots, "User-agent: {$agent}\nDisallow: /\n") !== false, "{$agent} is blocked when the owner chooses to block training");
}
expect(strpos($robots, "User-agent: OAI-SearchBot\nDisallow: /wp-admin/") !== false, 'blocking training leaves search crawlers allowed');

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['ai_training'] = 'allow';
$robots = webmcp_canary_allow_ai_crawlers_robots_txt($wp_robots, true);
expect(strpos($robots, "User-agent: GPTBot\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nAllow: /\n") !== false,
    'allowing training also keeps the site\'s /wp-admin/ rules');

// The service can no longer switch the site to Disallow: a paid ruleset that
// says crawlers are not allowed only means Nurevo adds nothing.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array(
    'enabled' => '1', 'allow_ai_crawlers' => '1', 'plan' => 'standard', 'site_key' => 'nrv_site',
));
$paid_state = webmcp_canary_ruleset_state();
$paid_state['crawler_allowed'] = false;
$paid_state['crawler_agents'] = array('GPTBot', 'OAI-SearchBot');
update_option(WEBMCP_CANARY_RULESET_OPTION, $paid_state);
$robots = webmcp_canary_allow_ai_crawlers_robots_txt($wp_robots, true);
expect(strpos($robots, "Disallow: /\n") === false, 'a service response cannot turn robots.txt into Disallow: /');
delete_option(WEBMCP_CANARY_RULESET_OPTION);

$sanitized = webmcp_canary_sanitize_settings(array_merge(webmcp_canary_settings(), array('ai_training' => 'block')));
expect($sanitized['ai_training'] === 'block', 'the training choice is saved');
$sanitized = webmcp_canary_sanitize_settings(array_merge(webmcp_canary_settings(), array('ai_training' => 'everything')));
expect($sanitized['ai_training'] === 'default', 'an unknown training choice falls back to the site\'s robots.txt');

/* --- 0.7.4: the autofilled admin email is withdrawn -------------------- */

$GLOBALS['webmcp_test_options']['admin_email'] = 'installer@agency.test';
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array('business_email' => 'Installer@Agency.test'));
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_EXTRACTION_OPTION] = array('fields' => array('business_name', 'business_email'));
delete_option('webmcp_canary_migrated_074');
delete_option(WEBMCP_CANARY_WITHDRAWN_EMAIL_OPTION);
webmcp_canary_withdraw_autofilled_admin_email();
expect(webmcp_canary_settings()['business_email'] === '', 'an autofilled admin email is withdrawn on upgrade');
expect(webmcp_canary_is_withdrawn_email('installer@agency.test'), 'and remembered as withdrawn');
$pulled = webmcp_canary_apply_remote_profile(array('profile' => array('email' => 'installer@agency.test', 'name' => 'Shop')));
expect(webmcp_canary_settings()['business_email'] === '' && !in_array('business_email', $pulled['changed'], true),
    'the profile sync does not bring the withdrawn address back');
$pulled = webmcp_canary_apply_remote_profile(array('profile' => array('email' => 'hello@shop.test')));
expect(webmcp_canary_settings()['business_email'] === 'hello@shop.test', 'a different business email from the service is still taken');

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array('business_email' => 'installer@agency.test'));
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_EXTRACTION_OPTION] = array('fields' => array('business_name'));
delete_option('webmcp_canary_migrated_074');
webmcp_canary_withdraw_autofilled_admin_email();
expect(webmcp_canary_settings()['business_email'] === 'installer@agency.test', 'an address the owner typed is kept, even if it is the admin email');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['business_email'] = '';
webmcp_canary_withdraw_autofilled_admin_email();
expect(get_option('webmcp_canary_migrated_074') == 1, 'the withdrawal runs once');
delete_option(WEBMCP_CANARY_WITHDRAWN_EMAIL_OPTION);
unset($GLOBALS['webmcp_test_options']['admin_email']);

/* --- 0.7.4: PostalAddress on every plan -------------------------------- */

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, $compat_on, array(
    'enabled' => '1', 'serve_schema' => '1', 'plan' => 'free',
    'business_name' => 'Free Shop', 'business_address' => '1-1-1 Marunouchi',
));
$GLOBALS['webmcp_test_active_plugins'] = array();
delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);
webmcp_canary_schema_merged(false);
ob_start();
webmcp_canary_output_server_schema();
$free_schema = ob_get_clean();
expect(strpos($free_schema, '"address":{"@type":"PostalAddress","streetAddress":"1-1-1 Marunouchi"}') !== false,
    'a free site publishes its address as PostalAddress');

/* --- 0.7.4: service autofix is a proposal, applied by an administrator - */

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($defaults, array(
    'enabled' => '1', 'tag_url' => 'https://nurevo.jp/tag.js', 'plan' => 'standard', 'site_key' => 'nrv_site',
    'serve_schema' => '0', 'serve_llms_txt' => '0', 'allow_ai_crawlers' => '0',
));
delete_option(WEBMCP_CANARY_RULESET_OPTION);
delete_option('webmcp_canary_autofix_state');
$GLOBALS['webmcp_test_remote_get'] = array('api/tag/config' => array('status' => 200, 'body' => json_encode(array(
    'ok' => true, 'plan' => 'standard', 'ruleset_version' => 3,
    'autofix' => array('requested_at' => '2026-10-22T00:00:00Z', 'actions_json' => json_encode(array('publish_schema', 'publish_llms', 'allow_crawlers'))),
))));
webmcp_canary_sync_ruleset(true);
$after_sync = webmcp_canary_settings();
expect($after_sync['serve_schema'] === '0' && $after_sync['serve_llms_txt'] === '0' && $after_sync['allow_ai_crawlers'] === '0',
    'a service autofix does not change settings by itself');
$pending = webmcp_canary_pending_autofix();
expect(is_array($pending) && count(webmcp_canary_autofix_action_labels($pending)) === 3, 'it is held as a proposal with readable actions');
webmcp_canary_apply_autofix($pending);
$after_apply = webmcp_canary_settings();
expect($after_apply['serve_schema'] === '1' && $after_apply['serve_llms_txt'] === '1' && $after_apply['allow_ai_crawlers'] === '1',
    'applying the proposal turns the outputs on');
expect(webmcp_canary_pending_autofix() === null, 'an applied proposal is not offered again');
expect(strpos(file_get_contents(__DIR__ . '/../wordpress-plugin/webmcp-canary/nurevo-webmcp.php'), 'wp_cache_flush()') === false,
    'the whole object cache is never flushed');
$GLOBALS['webmcp_test_remote_get'] = array();
delete_option(WEBMCP_CANARY_RULESET_OPTION);
delete_option('webmcp_canary_autofix_state');

/* --- 0.7.4: first-run fixes ------------------------------------------- */

// Pairing and licence results are shown: settings_errors() must be called on
// this top-level page, where WordPress does not print them by itself.
expect(strpos($source, "settings_errors(WEBMCP_CANARY_OPTION);") !== false, 'the settings page prints pairing and licence results');

// Pairing switches output on.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('tag_url' => 'https://nurevo.jp/tag.js', 'enabled' => '0'));
$GLOBALS['webmcp_test_remote'] = array('status' => 200, 'body' => wp_json_encode(array(
    'ok' => true, 'site_id' => 'p1', 'site_key' => 'nrv_p1', 'profile_token' => 'nrvp_p1', 'plan' => 'free', 'domain' => 'example.test', 'paired' => true,
)));
$paired_settings = webmcp_canary_sanitize_settings(array_merge(webmcp_canary_settings(), array('enabled' => '', 'pairing_code' => 'NRV-PAIRS-PAIRS-PAIRS-PAIRS')));
expect($paired_settings['enabled'] === '1', 'a successful pairing switches output on');
$GLOBALS['webmcp_test_remote'] = array('status' => 409, 'body' => wp_json_encode(array('ok' => false, 'error' => 'invalid_code')));
$failed_settings = webmcp_canary_sanitize_settings(array_merge(webmcp_canary_settings(), array('enabled' => '', 'pairing_code' => 'NRV-WRONG-WRONG-WRONG-WRONG')));
expect($failed_settings['enabled'] === '0', 'a failed pairing does not switch output on');

// The off notice appears on this plugin's screens and the Plugins list only.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('enabled' => '0'));
$_GET['page'] = 'webmcp-canary';
ob_start(); webmcp_canary_output_off_notice(); $off_notice = ob_get_clean();
expect(strpos($off_notice, 'Nurevo AEO is off') !== false, 'the plugin screen says output is off');
$_GET['page'] = 'some-other-plugin';
ob_start(); webmcp_canary_output_off_notice(); $elsewhere = ob_get_clean();
expect($elsewhere === '', 'other admin screens are not nagged');
$GLOBALS['webmcp_test_screen'] = (object) array('id' => 'plugins');
ob_start(); webmcp_canary_output_off_notice(); $plugins_screen = ob_get_clean();
expect(strpos($plugins_screen, 'Nurevo AEO is off') !== false, 'the Plugins list says output is off');
// 0.8.0: information, not an error, and dismissible per user on the Plugins screen.
expect(strpos($off_notice, 'notice-error') === false && strpos($off_notice, 'notice-info') !== false, 'on Nurevo screens it is an informational notice');
expect(strpos($off_notice, 'is-dismissible') === false, 'which stays on Nurevo screens, where the switch is');
expect(strpos($plugins_screen, 'notice-error') === false && strpos($plugins_screen, 'notice-info') !== false, 'on the Plugins screen it is informational');
expect(strpos($plugins_screen, 'is-dismissible') !== false && strpos($plugins_screen, 'webmcp_canary_dismiss_off_notice') !== false, 'and dismissible, with the dismissal sent to the server');
expect(webmcp_canary_dismiss_off_notice_for_user(0) === false, 'a dismissal needs a user');
$GLOBALS['webmcp_test_user_id'] = 7;
expect(webmcp_canary_dismiss_off_notice_for_user(7) === true, 'a user can dismiss it');
ob_start(); webmcp_canary_output_off_notice(); $after_dismiss = ob_get_clean();
expect($after_dismiss === '', 'once dismissed it no longer shows on the Plugins screen for that user');
$GLOBALS['webmcp_test_user_id'] = 8;
ob_start(); webmcp_canary_output_off_notice(); $other_user = ob_get_clean();
expect(strpos($other_user, 'Nurevo AEO is off') !== false, 'the dismissal is stored per user');
$GLOBALS['webmcp_test_user_id'] = 7;
unset($GLOBALS['webmcp_test_screen']);
$_GET['page'] = 'webmcp-canary';
ob_start(); webmcp_canary_output_off_notice(); $nurevo_after_dismiss = ob_get_clean();
expect(strpos($nurevo_after_dismiss, 'Nurevo AEO is off') !== false, 'dismissing on the Plugins screen does not hide it on Nurevo screens');
unset($GLOBALS['webmcp_test_user_id']);
expect(in_array('webmcp_canary_dismiss_off_notice_ajax', $GLOBALS['webmcp_test_hooks']['wp_ajax_webmcp_canary_dismiss_off_notice'], true), 'the dismissal endpoint is registered');
unset($GLOBALS['webmcp_test_screen'], $_GET['page']);
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['enabled'] = '1';
$_GET['page'] = 'webmcp-canary';
ob_start(); webmcp_canary_output_off_notice(); $on_notice = ob_get_clean();
expect($on_notice === '', 'no off notice once output is on');
unset($_GET['page']);

// A forced check asks the service to rescan; a normal view does not.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('tag_url' => 'https://nurevo.jp/tag.js'));
expect(strpos(webmcp_canary_aeo_score_endpoints(true)[0], 'fresh=1') !== false, 'Check again requests a fresh scan');
expect(strpos(webmcp_canary_aeo_score_endpoints(false)[0], 'fresh=') === false, 'a normal view may use the cache');

// A key the service no longer serves (cancelled, unpaid, deleted) drops to Free.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'tag_url' => 'https://nurevo.jp/tag.js', 'plan' => 'standard', 'site_key' => 'nrv_gone',
));
delete_option(WEBMCP_CANARY_RULESET_OPTION);
$GLOBALS['webmcp_test_remote_get'] = array('api/tag/config' => array('status' => 404, 'body' => '{"error":"not_found"}'));
webmcp_canary_sync_ruleset(true);
expect(webmcp_canary_settings()['plan'] === 'free', 'a revoked site key drops the plan to free');

// "Refresh plan" checks a site the plugin still thinks is Free.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'tag_url' => 'https://nurevo.jp/tag.js', 'plan' => 'free', 'site_key' => 'nrv_up',
));
delete_option(WEBMCP_CANARY_RULESET_OPTION);
$GLOBALS['webmcp_test_remote_get'] = array('api/tag/config' => array('status' => 200, 'body' => json_encode(array('ok' => true, 'plan' => 'standard', 'ruleset_version' => 3))));
webmcp_canary_sync_ruleset(true);
expect(webmcp_canary_settings()['plan'] === 'free', 'the scheduled sync still skips a free site');
webmcp_canary_sync_ruleset_now();
expect(webmcp_canary_settings()['plan'] === 'standard', 'Refresh plan picks up a purchase immediately');
expect(empty($GLOBALS['webmcp_canary_force_follow']), 'the one-off check does not leave paid behaviour switched on');
$GLOBALS['webmcp_test_remote_get'] = array();
delete_option(WEBMCP_CANARY_RULESET_OPTION);

/* --- 0.8.0: per-post controls ----------------------------------------- */

$GLOBALS['webmcp_test_post_meta_registered'] = array();
webmcp_canary_register_post_meta();
foreach (array('_nurevo_exclude_llms' => 'boolean', '_nurevo_exclude_schema' => 'boolean', '_nurevo_faq' => 'array') as $meta_key => $meta_type) {
    $registered = $GLOBALS['webmcp_test_post_meta_registered'][$meta_key] ?? null;
    expect($registered !== null, "post meta is registered: {$meta_key}");
    expect($registered['args']['type'] === $meta_type && $registered['args']['single'] === true, "{$meta_key} is a single {$meta_type}");
    expect(!empty($registered['args']['show_in_rest']), "{$meta_key} is exposed to the block editor");
    expect($registered['args']['auth_callback'] === 'webmcp_canary_post_meta_auth', "{$meta_key} is guarded by an auth callback");
}
expect(isset($GLOBALS['webmcp_test_post_meta_registered']['_nurevo_faq']['args']['show_in_rest']['schema']['items']['properties']['q']), 'the FAQ meta declares its {q,a} schema');
expect(webmcp_canary_post_meta_auth(false, '_nurevo_faq', 5) === true, 'an editor of the post may change its Nurevo meta');
$GLOBALS['webmcp_test_denied_caps'] = array('edit_post');
expect(webmcp_canary_post_meta_auth(false, '_nurevo_faq', 5) === false, 'someone who cannot edit the post may not');
$GLOBALS['webmcp_test_denied_caps'] = array();

$clean_post_faq = webmcp_canary_sanitize_post_faq(array(
    array('q' => ' <b>Parking?</b> ', 'a' => "Two spaces.\nBehind the shop."),
    array('q' => 'Half', 'a' => ''),
    'junk',
    array('q' => 'Q2', 'a' => 'A2', 'extra' => 'dropped'),
));
expect(count($clean_post_faq) === 2 && $clean_post_faq[0]['q'] === 'Parking?', 'the page FAQ keeps complete, plain-text pairs only');
expect(!isset($clean_post_faq[1]['extra']), 'and only the q and a fields');
expect(webmcp_canary_sanitize_post_faq('not a list') === array(), 'anything else is dropped');
expect(webmcp_canary_sanitize_post_flag('1') === true && webmcp_canary_sanitize_post_flag('') === false && webmcp_canary_sanitize_post_flag('false') === false, 'flags are booleans');

// llms.txt skips posts their editor excluded.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('enabled' => '1', 'serve_llms_txt' => '1', 'business_name' => 'Meta Shop'));
$GLOBALS['webmcp_test_posts'] = array(
    (object) array('ID' => 31, 'post_title' => 'Kept page', 'permalink' => 'https://example.test/kept/', 'post_content' => ''),
    (object) array('ID' => 32, 'post_title' => 'Hidden page', 'permalink' => 'https://example.test/hidden/', 'post_content' => ''),
);
update_post_meta(32, '_nurevo_exclude_llms', true);
$meta_llms = webmcp_canary_build_local_llms_txt();
expect(strpos($meta_llms, 'Kept page') !== false, 'llms.txt lists the other posts');
expect(strpos($meta_llms, 'Hidden page') === false, 'llms.txt skips a post excluded from it');
expect(webmcp_canary_excluded_post_ids('llms') === array(32), 'the excluded ids are read from the meta');
expect(webmcp_canary_excluded_post_ids('schema') === array(), 'and per purpose');
$GLOBALS['webmcp_test_posts'] = array();

// Schema output and the graph merge skip a singular page excluded from it.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('enabled' => '1', 'serve_schema' => '1', 'business_name' => 'Meta Shop'));
$GLOBALS['webmcp_test_options']['blog_public'] = 1;
$GLOBALS['webmcp_test_active_plugins'] = array();
webmcp_canary_schema_merged(false);
$excluded_page = (object) array('ID' => 50, 'post_content' => 'x', 'post_title' => 'No schema', 'permalink' => 'https://example.test/no-schema/');
$GLOBALS['webmcp_test_posts'] = array($excluded_page);
update_post_meta(50, '_nurevo_exclude_schema', true);
$GLOBALS['webmcp_test_queried'] = $excluded_page;
$GLOBALS['webmcp_test_front_page'] = false;
ob_start(); webmcp_canary_output_server_schema(); $excluded_output = ob_get_clean();
expect($excluded_output === '', 'an excluded page prints no Nurevo structured data');
$their_graph = array(array('@type' => 'Organization', '@id' => 'https://example.test/#org', 'name' => 'Theirs'));
expect(webmcp_canary_merge_into_list_graph($their_graph) === $their_graph, 'nor merges anything into an SEO plugin graph');
expect(webmcp_canary_merge_into_keyed_graph(array('org' => $their_graph[0])) === array('org' => $their_graph[0]), 'in either graph shape');
webmcp_canary_schema_merged(false);
delete_post_meta(50, '_nurevo_exclude_schema');
ob_start(); webmcp_canary_output_server_schema(); $included_output = ob_get_clean();
expect(strpos($included_output, 'application/ld+json') !== false, 'the same page publishes again once the exclusion is removed');
$GLOBALS['webmcp_test_posts'] = array();

// A page-level FAQ is published only on that page, and only where it is shown.
delete_option(WEBMCP_CANARY_FAQ_OPTION);
update_post_meta(60, '_nurevo_faq', array(array('q' => 'Page-only question?', 'a' => 'Page-only answer.')));
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 60, 'post_content' => '<p>Intro</p>[nurevo_faq source="post"]', 'post_title' => 'P60', 'permalink' => 'https://example.test/p60/');
expect(webmcp_canary_faq_sources_in_content($GLOBALS['webmcp_test_queried']->post_content) === array('site' => false, 'post' => true), 'the shortcode with source="post" shows the page FAQ');
ob_start(); webmcp_canary_output_server_schema(); $page_faq_output = ob_get_clean();
expect(strpos($page_faq_output, '"FAQPage"') !== false && strpos($page_faq_output, 'Page-only question?') !== false, 'the page FAQ is published on its page');
expect(strpos($page_faq_output, 'https://example.test/p60/#nurevo-faq') !== false, 'under that page');
$rendered_page_faq = webmcp_canary_render_faq(array('source' => 'post'));
expect(strpos($rendered_page_faq, 'Page-only question?') !== false, 'and the shortcode renders the same questions');
expect(webmcp_canary_render_faq('') === '', 'the default shortcode still shows the (empty) site-wide FAQ');
// Meta alone, with nothing on the page to show it, publishes nothing.
update_post_meta(61, '_nurevo_faq', array(array('q' => 'Invisible?', 'a' => 'Yes.')));
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 61, 'post_content' => '<p>No FAQ here</p>', 'post_title' => 'P61', 'permalink' => 'https://example.test/p61/');
ob_start(); webmcp_canary_output_server_schema(); $hidden_faq_output = ob_get_clean();
expect(strpos($hidden_faq_output, '"FAQPage"') === false && strpos($hidden_faq_output, 'Invisible?') === false, 'a page FAQ that is not shown is not published');
// The default shortcode shows the site-wide FAQ, not the page's own.
webmcp_canary_save_faq_entries(array(array('q' => 'Site question?', 'a' => 'Site answer.')));
update_post_meta(62, '_nurevo_faq', array(array('q' => 'Not shown here?', 'a' => 'Right.')));
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 62, 'post_content' => '[nurevo_faq]', 'post_title' => 'P62', 'permalink' => 'https://example.test/p62/');
ob_start(); webmcp_canary_output_server_schema(); $site_faq_output = ob_get_clean();
expect(strpos($site_faq_output, 'Site question?') !== false && strpos($site_faq_output, 'Not shown here?') === false, 'the site-wide shortcode publishes only the site-wide questions');
// The block with source "post" counts too, and both sources can be on one page.
$GLOBALS['webmcp_test_queried'] = (object) array('ID' => 60, 'post_content' => "<!-- wp:nurevo/faq /-->\n<!-- wp:nurevo/faq {\"source\":\"post\"} /-->", 'post_title' => 'P60', 'permalink' => 'https://example.test/p60/');
ob_start(); webmcp_canary_output_server_schema(); $both_faq_output = ob_get_clean();
expect(strpos($both_faq_output, 'Site question?') !== false && strpos($both_faq_output, 'Page-only question?') !== false, 'both FAQs on one page make one FAQPage with both');
expect(substr_count($both_faq_output, '"FAQPage"') === 1, 'still a single FAQPage node');
delete_option(WEBMCP_CANARY_FAQ_OPTION);
$GLOBALS['webmcp_test_queried'] = null;
$GLOBALS['webmcp_test_front_page'] = true;
$GLOBALS['webmcp_test_blocks'] = array();
webmcp_canary_register_faq_block();
expect($GLOBALS['webmcp_test_blocks']['nurevo/faq']['attributes']['source']['default'] === 'site', 'the FAQ block has a source attribute');

// The classic editor meta box saves with a nonce and an edit_post check.
$_POST = array(
    'nurevo_post_meta_nonce' => md5('webmcp_canary_post_meta'),
    'nurevo_exclude_llms' => '1',
    'nurevo_faq' => array(array('q' => 'Box Q', 'a' => 'Box A'), array('q' => '', 'a' => '')),
);
webmcp_canary_save_post_meta_box(70);
expect(get_post_meta(70, '_nurevo_exclude_llms', true) === true, 'the meta box saves the llms.txt exclusion');
expect(get_post_meta(70, '_nurevo_exclude_schema', true) === '', 'an unticked box saves nothing');
expect(get_post_meta(70, '_nurevo_faq', true) === array(array('q' => 'Box Q', 'a' => 'Box A')), 'and the page FAQ, without empty rows');
$_POST['nurevo_post_meta_nonce'] = 'forged';
$_POST['nurevo_exclude_schema'] = '1';
webmcp_canary_save_post_meta_box(71);
expect(get_post_meta(71, '_nurevo_exclude_schema', true) === '', 'a bad nonce saves nothing');
$_POST['nurevo_post_meta_nonce'] = md5('webmcp_canary_post_meta');
$GLOBALS['webmcp_test_denied_caps'] = array('edit_post');
webmcp_canary_save_post_meta_box(72);
expect(get_post_meta(72, '_nurevo_exclude_schema', true) === '', 'a user who cannot edit the post saves nothing');
$GLOBALS['webmcp_test_denied_caps'] = array();
$_POST = array();
webmcp_canary_save_post_meta_box(70);
expect(get_post_meta(70, '_nurevo_exclude_llms', true) === true, 'a save without the meta box (block editor, REST) leaves the meta alone');
$GLOBALS['webmcp_test_meta_boxes'] = array();
webmcp_canary_add_meta_box();
expect(isset($GLOBALS['webmcp_test_meta_boxes']['post'], $GLOBALS['webmcp_test_meta_boxes']['page']) && !isset($GLOBALS['webmcp_test_meta_boxes']['attachment']), 'the meta box is on public post types');
expect(!empty($GLOBALS['webmcp_test_meta_boxes']['post']['args']['__back_compat_meta_box']), 'and only in the classic editor');
ob_start(); webmcp_canary_render_meta_box((object) array('ID' => 70)); $meta_box_html = ob_get_clean();
expect(strpos($meta_box_html, 'nurevo_post_meta_nonce') !== false && strpos($meta_box_html, 'Box Q') !== false, 'the meta box renders its nonce and the saved FAQ');

// The block editor panel: a separate plain-JS file, enqueued on the editor only.
$GLOBALS['webmcp_test_enqueued'] = array();
$GLOBALS['webmcp_test_screen'] = (object) array('base' => 'post', 'id' => 'post');
webmcp_canary_enqueue_editor_panel();
$panel = $GLOBALS['webmcp_test_enqueued']['nurevo-editor-panel'] ?? null;
expect($panel !== null && strpos($panel['src'], 'assets/editor-panel.js') !== false, 'the editor panel script is enqueued from assets/');
foreach (array('wp-plugins', 'wp-edit-post', 'wp-components', 'wp-data') as $dep) {
    expect(in_array($dep, $panel['deps'], true), "the editor panel depends on {$dep}");
}
$GLOBALS['webmcp_test_enqueued'] = array();
$GLOBALS['webmcp_test_screen'] = (object) array('base' => 'site-editor', 'id' => 'site-editor');
webmcp_canary_enqueue_editor_panel();
expect(empty($GLOBALS['webmcp_test_enqueued']), 'and not in the site editor');
unset($GLOBALS['webmcp_test_screen']);
$panel_js = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/assets/editor-panel.js');
expect(strpos($panel_js, 'PluginDocumentSettingPanel') !== false && strpos($panel_js, 'wp.element.createElement') !== false, 'the panel is a PluginDocumentSettingPanel built with createElement');
foreach (array('_nurevo_exclude_llms', '_nurevo_exclude_schema', '_nurevo_faq') as $meta_key) {
    expect(strpos($panel_js, $meta_key) !== false, "the panel edits {$meta_key}");
}
expect(strpos($panel_js, 'import ') === false && strpos($panel_js, 'require(') === false, 'and needs no build step');

/* --- 0.8.0: tools: export/import, WP-CLI, REST status ----------------- */

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'enabled' => '1', 'business_name' => 'Export Shop', 'business_phone' => '03-0000-0000',
    'site_key' => 'nrv_secret_key', 'site_id' => 'sid123', 'license_key' => 'LIC-SECRET', 'admin_token' => 'tok-secret',
    'profile_token' => 'nrvp_secret', 'plan' => 'standard', 'tag_url' => 'https://nurevo.jp/tag.js',
));
webmcp_canary_save_faq_entries(array(array('q' => 'Export Q', 'a' => 'Export A')));
$export = webmcp_canary_export_settings();
$export_json = wp_json_encode($export);
expect($export['plugin'] === 'nurevo-aeo' && $export['settings']['business_name'] === 'Export Shop', 'the export carries the settings');
expect($export['faq'][0]['q'] === 'Export Q', 'and the FAQ');
foreach (array('nrv_secret_key', 'sid123', 'LIC-SECRET', 'tok-secret', 'nrvp_secret') as $secret) {
    expect(strpos($export_json, $secret) === false, "the export never contains a key or token: {$secret}");
}
foreach (webmcp_canary_secret_setting_keys() as $secret_key) {
    expect(!array_key_exists($secret_key, $export['settings']), "the export leaves out {$secret_key}");
}

$import_ok = function ($settings, $extra = array()) {
    return wp_json_encode(array_merge(array('plugin' => 'nurevo-aeo', 'format' => 1, 'settings' => $settings), $extra));
};
expect(webmcp_canary_import_settings_json('{nope')->get_error_code() === 'webmcp_import_invalid', 'invalid JSON is refused');
expect(webmcp_canary_import_settings_json('{"plugin":"other","settings":{}}')->get_error_code() === 'webmcp_import_invalid', 'another plugin\'s file is refused');
$unknown_import = webmcp_canary_import_settings_json($import_ok(array('business_name' => 'X', 'surprise' => '1')));
expect(is_wp_error($unknown_import) && $unknown_import->get_error_code() === 'webmcp_import_unknown_key', 'an unknown setting is refused');
expect(strpos($unknown_import->get_error_message(), 'surprise') !== false, 'and named');
expect(webmcp_canary_import_settings_json($import_ok(array(), array('extra_top' => 1)))->get_error_code() === 'webmcp_import_unknown_key', 'an unknown top-level key is refused');
foreach (array('site_key', 'license_key', 'admin_token', 'profile_token', 'plan', 'tag_url', 'pairing_code') as $secret_key) {
    $secret_import = webmcp_canary_import_settings_json($import_ok(array('business_name' => 'X', $secret_key => 'attacker')));
    expect(is_wp_error($secret_import) && $secret_import->get_error_code() === 'webmcp_import_secret', "importing {$secret_key} is refused");
}
expect(webmcp_canary_settings()['business_name'] === 'Export Shop', 'a refused file changes nothing');
expect(webmcp_canary_import_settings_json($import_ok(array('business_name' => array('nested'))))->get_error_code() === 'webmcp_import_invalid', 'a non-scalar value is refused');

$GLOBALS['webmcp_test_remote_get_log'] = array();
$GLOBALS['webmcp_test_last_remote'] = null;
$imported = webmcp_canary_import_settings_json($import_ok(
    array('business_name' => '<b>Imported</b> Shop', 'ai_training' => 'everything', 'serve_llms_txt' => '0', 'business_url' => 'https://imported.example/'),
    array('faq' => array(array('q' => 'Imported Q', 'a' => 'Imported A'), array('q' => 'half', 'a' => '')))
));
expect(is_array($imported), 'a valid file is imported');
$after_import = webmcp_canary_settings();
expect($after_import['business_name'] === 'Imported Shop', 'imported values go through the sanitize callback');
expect($after_import['ai_training'] === 'default', 'an invalid choice falls back as on the form');
expect($after_import['serve_llms_txt'] === '0' && $after_import['enabled'] === '1', 'switches are imported, others kept');
expect($after_import['site_key'] === 'nrv_secret_key' && $after_import['license_key'] === 'LIC-SECRET' && $after_import['plan'] === 'standard', 'this site\'s keys and plan are kept');
expect(webmcp_canary_faq_entries() === array(array('q' => 'Imported Q', 'a' => 'Imported A')), 'the FAQ is imported, incomplete pairs dropped');
expect($GLOBALS['webmcp_test_remote_get_log'] === array() && $GLOBALS['webmcp_test_last_remote'] === null, 'importing contacts nothing');
$roundtrip = webmcp_canary_import_settings_json(wp_json_encode(webmcp_canary_export_settings()));
expect(is_array($roundtrip), 'an export imports cleanly');
delete_option(WEBMCP_CANARY_FAQ_OPTION);
expect(strpos($source_now = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/nurevo-webmcp.php'), "check_admin_referer('webmcp_canary_import_settings')") !== false, 'the import form is nonce-checked');
expect(strpos(webmcp_test_function_body($source_now, 'webmcp_canary_import_settings_action'), "current_user_can('manage_options')") !== false, 'and needs manage_options');
expect(strpos(webmcp_test_function_body($source_now, 'webmcp_canary_export_settings_action'), "current_user_can('manage_options')") !== false, 'so does the export');

// REST: read-only status for administrators.
$GLOBALS['webmcp_test_rest_routes'] = array();
webmcp_canary_register_rest_routes();
$route = $GLOBALS['webmcp_test_rest_routes']['nurevo/v1/status'] ?? null;
expect($route !== null && $route['methods'] === 'GET', 'GET nurevo/v1/status is registered');
expect(in_array('webmcp_canary_register_rest_routes', $GLOBALS['webmcp_test_hooks']['rest_api_init'], true), 'on rest_api_init');
expect(call_user_func($route['permission_callback']) === true, 'an administrator may read it');
$GLOBALS['webmcp_test_denied_caps'] = array('manage_options');
expect(call_user_func($route['permission_callback']) === false, 'nobody else may');
$GLOBALS['webmcp_test_denied_caps'] = array();
$status = call_user_func($route['callback']);
expect($status['version'] === WEBMCP_CANARY_VERSION && $status['enabled'] === true, 'the status reports the version and switch');
expect($status['outputs']['llms_txt'] === false && $status['outputs']['schema'] === true, 'and each output');
expect($status['connected'] === true && $status['consent'] === true, 'and the connection');
$status_json = wp_json_encode($status);
foreach (array('nrv_secret_key', 'LIC-SECRET', 'tok-secret', 'nrvp_secret') as $secret) {
    expect(strpos($status_json, $secret) === false, "the status never contains a key or token: {$secret}");
}

// WP-CLI.
expect((WP_CLI::$commands['nurevo'] ?? '') === 'Webmcp_Canary_CLI_Command', 'wp nurevo is registered under WP-CLI');
$cli = new Webmcp_Canary_CLI_Command();
WP_CLI::$out = array();
$cli->status(array(), array());
expect(in_array('enabled: yes', WP_CLI::$out, true) && in_array('outputs.llms_txt: no', WP_CLI::$out, true), 'wp nurevo status prints the output state');
WP_CLI::$out = array();
$cli->status(array(), array('format' => 'json'));
expect(json_decode(WP_CLI::$out[0], true)['version'] === WEBMCP_CANARY_VERSION, 'and as JSON');
WP_CLI::$out = array();
$cli->export(array(), array());
$cli_export = WP_CLI::$out[0];
expect(json_decode($cli_export, true)['plugin'] === 'nurevo-aeo' && strpos($cli_export, 'LIC-SECRET') === false, 'wp nurevo export prints the settings without secrets');
$tmp_import = tempnam(sys_get_temp_dir(), 'nurevo');
file_put_contents($tmp_import, $import_ok(array('business_name' => 'CLI Shop')));
$cli->import(array($tmp_import), array());
expect(webmcp_canary_settings()['business_name'] === 'CLI Shop', 'wp nurevo import applies a file');
file_put_contents($tmp_import, $import_ok(array('site_key' => 'x')));
$cli_threw = false;
try { $cli->import(array($tmp_import), array()); } catch (WebmcpTestCliError $error) { $cli_threw = true; }
expect($cli_threw, 'and refuses one with keys');
unlink($tmp_import);
// diagnose needs consent, given with --consent.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('tag_url' => 'https://nurevo.jp/tag.js'));
delete_option(WEBMCP_CANARY_CONSENT_OPTION);
$GLOBALS['webmcp_test_remote_get_log'] = array();
$cli_threw = false;
try { $cli->diagnose(array(), array()); } catch (WebmcpTestCliError $error) { $cli_threw = strpos($error->getMessage(), '--consent') !== false; }
expect($cli_threw && $GLOBALS['webmcp_test_remote_get_log'] === array(), 'wp nurevo diagnose asks for --consent and sends nothing without it');
$GLOBALS['webmcp_test_remote_get'] = array('api/aeo/score' => array('status' => 200, 'body' => $aeo_body));
WP_CLI::$out = array();
$cli->diagnose(array(), array('consent' => true));
expect(get_option(WEBMCP_CANARY_CONSENT_OPTION)['via'] === 'cli' && strpos(end(WP_CLI::$out), 'AEO score: 64/100') !== false, 'with --consent it records consent and runs');
$GLOBALS['webmcp_test_remote_get'] = array();

/* --- 0.8.0: developer filters ----------------------------------------- */

$filter_source = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/nurevo-webmcp.php');
$developers_md = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/docs/developers.md');
foreach (array('webmcp_canary_schema_graph', 'webmcp_canary_business_node', 'webmcp_canary_llms_txt', 'webmcp_canary_llms_txt_lines', 'webmcp_canary_robots_search_agents', 'webmcp_canary_robots_training_agents', 'webmcp_canary_excluded_post_ids') as $filter_name) {
    expect(substr_count($filter_source, "apply_filters('{$filter_name}'") === 1, "{$filter_name} is applied in exactly one place");
    expect(strpos($developers_md, '`' . $filter_name . '`') !== false, "{$filter_name} is documented in docs/developers.md");
}

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'enabled' => '1', 'serve_schema' => '1', 'serve_llms_txt' => '1', 'allow_ai_crawlers' => '1', 'ai_training' => 'block', 'business_name' => 'Filter Shop',
));
$GLOBALS['webmcp_test_options']['blog_public'] = 1;
$GLOBALS['webmcp_test_active_plugins'] = array();
$GLOBALS['webmcp_test_queried'] = null;
$GLOBALS['webmcp_test_front_page'] = true;
webmcp_canary_schema_merged(false);

add_filter('webmcp_canary_business_node', function ($node, $settings) { $node['priceRange'] = '$$-filtered'; return $node; });
add_filter('webmcp_canary_schema_graph', function ($bundle) { $bundle['extra'][] = array('@type' => 'Event', 'name' => 'Filtered event'); return $bundle; });
ob_start(); webmcp_canary_output_server_schema(); $filtered_schema = ob_get_clean();
expect(strpos($filtered_schema, '$$-filtered') !== false, 'webmcp_canary_business_node changes the business node');
expect(strpos($filtered_schema, 'Filtered event') !== false, 'webmcp_canary_schema_graph changes the published graph');
$merged_filtered = webmcp_canary_merge_into_list_graph(array(array('@type' => 'Organization', '@id' => 'https://example.test/#o', 'name' => 'Theirs')));
expect(strpos(wp_json_encode($merged_filtered), '$$-filtered') !== false && strpos(wp_json_encode($merged_filtered), 'Filtered event') !== false, 'and the graph merged into an SEO plugin');
webmcp_canary_schema_merged(false);
$GLOBALS['webmcp_test_hooks']['webmcp_canary_schema_graph'] = array(function () { return 'broken'; });
ob_start(); webmcp_canary_output_server_schema(); $broken_filter_schema = ob_get_clean();
expect(strpos($broken_filter_schema, 'Filter Shop') !== false, 'a filter returning the wrong shape is ignored');
unset($GLOBALS['webmcp_test_hooks']['webmcp_canary_schema_graph'], $GLOBALS['webmcp_test_hooks']['webmcp_canary_business_node']);

add_filter('webmcp_canary_llms_txt_lines', function ($lines) { $lines[] = '## Added by a filter'; return $lines; });
expect(strpos(webmcp_canary_build_local_llms_txt(), '## Added by a filter') !== false, 'webmcp_canary_llms_txt_lines changes the lines');
add_filter('webmcp_canary_llms_txt', function ($body) { return $body . "\nBODY-FILTER\n"; });
expect(strpos((string) webmcp_canary_llms_txt_body(), 'BODY-FILTER') !== false, 'webmcp_canary_llms_txt changes the served body');
unset($GLOBALS['webmcp_test_hooks']['webmcp_canary_llms_txt_lines'], $GLOBALS['webmcp_test_hooks']['webmcp_canary_llms_txt']);

add_filter('webmcp_canary_robots_search_agents', function ($agents) { $agents[] = "NewSearchBot\nDisallow: /"; return $agents; });
add_filter('webmcp_canary_robots_training_agents', function ($agents) { return array_values(array_diff($agents, array('CCBot'))); });
$filtered_robots = webmcp_canary_allow_ai_crawlers_robots_txt("User-agent: *\nDisallow:\n", true);
expect(strpos($filtered_robots, 'User-agent: NewSearchBotDisallow /') !== false, 'webmcp_canary_robots_search_agents adds an agent, reduced to one line');
expect(strpos($filtered_robots, "\nDisallow: /\nAllow") === false, 'a filtered agent cannot inject a rule');
expect(strpos($filtered_robots, 'CCBot') === false && strpos($filtered_robots, 'User-agent: GPTBot') !== false, 'webmcp_canary_robots_training_agents changes the training list');
unset($GLOBALS['webmcp_test_hooks']['webmcp_canary_robots_search_agents'], $GLOBALS['webmcp_test_hooks']['webmcp_canary_robots_training_agents']);

$GLOBALS['webmcp_test_posts'] = array(
    (object) array('ID' => 81, 'post_title' => 'Filtered out', 'permalink' => 'https://example.test/f81/', 'post_content' => ''),
    (object) array('ID' => 82, 'post_title' => 'Still listed', 'permalink' => 'https://example.test/f82/', 'post_content' => ''),
);
add_filter('webmcp_canary_excluded_post_ids', function ($ids, $context) { if ($context === 'llms') { $ids[] = 81; } return $ids; });
$filtered_llms = webmcp_canary_build_local_llms_txt();
expect(strpos($filtered_llms, 'Filtered out') === false && strpos($filtered_llms, 'Still listed') !== false, 'webmcp_canary_excluded_post_ids excludes posts from llms.txt');
expect(webmcp_canary_excluded_post_ids('schema') === array(), 'per context');
unset($GLOBALS['webmcp_test_hooks']['webmcp_canary_excluded_post_ids']);
$GLOBALS['webmcp_test_posts'] = array();

/* --- 0.8.0: no developer jargon in messages the owner sees ------------- */

$jargon_source = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/nurevo-webmcp.php');
preg_match_all("/(?:__|esc_html__|esc_html_e|_e)\(\s*'((?:[^'\\\\]|\\\\.)*)'\s*,\s*'nurevo-webmcp'/", $jargon_source, $visible_strings);
expect(count($visible_strings[1]) > 200, 'the owner-facing strings were found: ' . count($visible_strings[1]));
foreach ($visible_strings[1] as $visible) {
    foreach (array('WebMCP', 'Docker', 'Worker', 'tag.js URL') as $jargon) {
        expect(strpos($visible, $jargon) === false, "no '{$jargon}' in an owner-facing string: {$visible}");
    }
}
expect(strpos($jargon_source, 'fetched from the configured WebMCP Worker') === false, 'the stale llms.txt comment is gone');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('tag_url' => 'https://nurevo.jp/tag.js', 'site_key' => 'k'));
$timeout_message = webmcp_canary_connection_error_message(new WP_Error('http_request_failed', 'cURL error 28: Operation timed out'));
expect(strpos($timeout_message, 'Nurevo service') !== false && strpos($timeout_message, (string) WEBMCP_CANARY_HTTP_TIMEOUT) !== false, 'a timeout is explained in plain words');
expect(strpos(webmcp_canary_connection_error_message(null), 'hosting provider') !== false, 'and the generic failure says what to do');

/* --- 0.8.0: multisite cron -------------------------------------------- */

$GLOBALS['webmcp_test_multisite'] = true;
$GLOBALS['webmcp_test_scheduled_by_blog'] = array();
$GLOBALS['webmcp_test_remote_get_log'] = array();
webmcp_canary_activate_aeo_score(true);
foreach (array(1, 2, 3) as $blog) {
    expect(in_array(WEBMCP_CANARY_RULESET_CRON, $GLOBALS['webmcp_test_scheduled_by_blog'][$blog] ?? array(), true), "network activation schedules the sync on site {$blog}");
}
expect($GLOBALS['webmcp_test_blog'] === 1 && empty($GLOBALS['webmcp_test_blog_stack']), 'and returns to the current site');
expect($GLOBALS['webmcp_test_remote_get_log'] === array(), 'network activation makes no request either');

$GLOBALS['webmcp_test_scheduled_by_blog'] = array();
webmcp_canary_activate_aeo_score(false);
expect(array_keys($GLOBALS['webmcp_test_scheduled_by_blog']) === array(1), 'activating on one site schedules that site only');

expect(in_array('webmcp_canary_initialize_site', $GLOBALS['webmcp_test_hooks']['wp_initialize_site'], true), 'new sites are hooked');
$GLOBALS['webmcp_test_scheduled_by_blog'] = array();
webmcp_canary_initialize_site((object) array('blog_id' => 9));
expect(empty($GLOBALS['webmcp_test_scheduled_by_blog']), 'a new site gets nothing while the plugin is not network-active');
$GLOBALS['webmcp_test_network_active'] = true;
webmcp_canary_initialize_site((object) array('blog_id' => 9));
expect(in_array(WEBMCP_CANARY_RULESET_CRON, $GLOBALS['webmcp_test_scheduled_by_blog'][9] ?? array(), true), 'a new site on a network-active install gets its sync');
expect($GLOBALS['webmcp_test_blog'] === 1, 'and the current site is restored');

$GLOBALS['webmcp_test_cleared_by_blog'] = array();
webmcp_canary_deactivate_ruleset_cron(true);
foreach (array(1, 2, 3) as $blog) {
    expect(in_array(WEBMCP_CANARY_RULESET_CRON, $GLOBALS['webmcp_test_cleared_by_blog'][$blog] ?? array(), true), "network deactivation clears the sync on site {$blog}");
}
$GLOBALS['webmcp_test_cleared_by_blog'] = array();
webmcp_canary_deactivate_ruleset_cron(false);
expect(array_keys($GLOBALS['webmcp_test_cleared_by_blog']) === array(1), 'deactivating one site clears that site only');
$GLOBALS['webmcp_test_multisite'] = false;
$GLOBALS['webmcp_test_network_active'] = false;

/* --- 0.8.0: llms.txt cache -------------------------------------------- */

$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array('enabled' => '1', 'serve_llms_txt' => '1', 'business_name' => 'Cache Shop'));
delete_option(WEBMCP_CANARY_RULESET_OPTION);
webmcp_canary_flush_llms_cache();
$GLOBALS['webmcp_test_posts'] = array((object) array('ID' => 91, 'post_title' => 'First post', 'permalink' => 'https://example.test/first/', 'post_content' => ''));
$cached_first = webmcp_canary_llms_txt_body();
expect(strpos($cached_first, 'First post') !== false, 'the first request builds llms.txt');
expect(is_array(get_transient(WEBMCP_CANARY_LLMS_TRANSIENT)), 'and caches it in a transient');
$GLOBALS['webmcp_test_posts'][] = (object) array('ID' => 92, 'post_title' => 'Second post', 'permalink' => 'https://example.test/second/', 'post_content' => '');
expect(webmcp_canary_llms_txt_body() === $cached_first, 'later requests are served from the cache');
foreach (array('save_post', 'deleted_post', 'update_option_' . WEBMCP_CANARY_OPTION, 'update_option_' . WEBMCP_CANARY_SERVICES_OPTION, 'update_option_' . WEBMCP_CANARY_RULESET_OPTION) as $invalidating_hook) {
    expect(in_array('webmcp_canary_flush_llms_cache', $GLOBALS['webmcp_test_hooks'][$invalidating_hook] ?? array(), true), "the cache is cleared on {$invalidating_hook}");
}
foreach ($GLOBALS['webmcp_test_hooks']['save_post'] as $save_callback) {
    if ($save_callback === 'webmcp_canary_flush_llms_cache') { call_user_func($save_callback, 92, null, true); }
}
expect(strpos(webmcp_canary_llms_txt_body(), 'Second post') !== false, 'saving a post brings it into llms.txt');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['business_name'] = 'Renamed Cache Shop';
expect(strpos(webmcp_canary_llms_txt_body(), '# Renamed Cache Shop') === 0, 'a settings change is never served stale');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['serve_llms_txt'] = '0';
expect(webmcp_canary_llms_txt_body() === null, 'switching llms.txt off stops it even with a cached body');
$GLOBALS['webmcp_test_posts'] = array();
webmcp_canary_flush_llms_cache();
$serve_body = webmcp_test_function_body(file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/nurevo-webmcp.php'), 'webmcp_canary_maybe_serve_llms_txt');
expect(strpos($serve_body, "header('Cache-Control: public, max-age=300')") !== false, 'llms.txt is served with Cache-Control: public, max-age=300');
expect(strpos($serve_body, 'nocache_headers') === false, 'and no longer as uncacheable');

/* --- 0.8.0: suggested privacy policy text ------------------------------ */

$GLOBALS['webmcp_test_privacy'] = array();
webmcp_canary_add_privacy_policy_content();
expect(in_array('webmcp_canary_add_privacy_policy_content', $GLOBALS['webmcp_test_hooks']['admin_init'], true), 'the privacy text is offered from admin_init');
$privacy = $GLOBALS['webmcp_test_privacy']['Nurevo AEO'] ?? '';
expect($privacy !== '', 'privacy policy text is suggested to WordPress');
foreach (array('nurevo.jp', 'Only after a site administrator agrees', 'pairing code', 'home page address', 'business details', 'no visitor data', 'https://nurevo.jp/privacy') as $disclosed) {
    expect(strpos($privacy, $disclosed) !== false, "the privacy text states: {$disclosed}");
}

/* --- 0.8.0: wp-admin display switches, FAQ block title, version -------- */

$display_defaults = webmcp_canary_default_settings();
expect($display_defaults['show_admin_bar_score'] === '1' && $display_defaults['show_dashboard_widget'] === '1', 'the admin bar score and the Dashboard widget are on by default');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($display_defaults, array('enabled' => '1'));
$admin_bar = new class { public $nodes = array(); public function add_node($node) { $this->nodes[] = $node; } };
webmcp_canary_admin_bar_score($admin_bar);
expect(count($admin_bar->nodes) === 1, 'the admin bar shows the score by default');
$GLOBALS['webmcp_test_widgets'] = array();
webmcp_canary_register_aeo_widget();
expect(isset($GLOBALS['webmcp_test_widgets']['webmcp_canary_aeo_widget']), 'the Dashboard widget is registered by default');
// The widget and the admin bar show the same AEO score as the dashboard, and
// the widget its two sub-scores.
update_option(WEBMCP_CANARY_CONSENT_OPTION, array('at' => time(), 'via' => 'diagnosis'));
update_option(WEBMCP_CANARY_AEO_SCORE_OPTION, array('saved_at' => time(), 'identity' => webmcp_canary_aeo_score_identity(), 'data' => $v2_score));
ob_start();
webmcp_canary_aeo_widget();
$widget_html = ob_get_clean();
expect(strpos($widget_html, '83 / 100') !== false && strpos($widget_html, 'AI readiness (on-site): 97 / 100') !== false && strpos($widget_html, 'AI visibility (measured): 14 / 100') !== false, 'the widget shows the AEO score and both sub-scores');
$admin_bar->nodes = array();
webmcp_canary_admin_bar_score($admin_bar);
expect(strpos($admin_bar->nodes[0]['title'], 'AEO 83') !== false, 'the admin bar shows the same AEO score');
delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);

$hidden = webmcp_canary_sanitize_settings(array_merge(webmcp_canary_settings(), array('admin_display_submitted' => '1', 'show_admin_bar_score' => '', 'show_dashboard_widget' => '')));
expect($hidden['show_admin_bar_score'] === '0' && $hidden['show_dashboard_widget'] === '0', 'unticking both on the form turns them off');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $hidden;
$admin_bar->nodes = array();
webmcp_canary_admin_bar_score($admin_bar);
expect($admin_bar->nodes === array(), 'the admin bar score can be hidden');
$GLOBALS['webmcp_test_widgets'] = array();
webmcp_canary_register_aeo_widget();
expect(empty($GLOBALS['webmcp_test_widgets']), 'the Dashboard widget can be hidden');
$kept_hidden = webmcp_canary_sanitize_settings(array('enabled' => '1'));
expect($kept_hidden['show_admin_bar_score'] === '0', 'a write that does not come from the form keeps the choice');
$stored_before_080 = $display_defaults;
unset($stored_before_080['show_admin_bar_score'], $stored_before_080['show_dashboard_widget']);
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $stored_before_080;
$upgraded = webmcp_canary_sanitize_settings($stored_before_080);
expect($upgraded['show_admin_bar_score'] === '1' && $upgraded['show_dashboard_widget'] === '1', 'an install upgraded from 0.7 keeps both on');
$shown_again = webmcp_canary_sanitize_settings(array('admin_display_submitted' => '1', 'show_admin_bar_score' => '1', 'show_dashboard_widget' => '1'));
expect($shown_again['show_admin_bar_score'] === '1' && $shown_again['show_dashboard_widget'] === '1', 'ticking them turns them back on');
expect(in_array('show_admin_bar_score', webmcp_canary_exportable_setting_keys(), true), 'the switches travel with an export');

$block_js = webmcp_canary_faq_block_editor_js();
expect(strpos($block_js, "title:'Nurevo FAQ'") === false && strpos($block_js, 'title:t.title') !== false, 'the FAQ block title comes from a translated string');
expect(strpos($block_js, '"title":"Nurevo FAQ"') !== false, 'which is passed in from PHP');

$main_source = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/nurevo-webmcp.php');
expect(WEBMCP_CANARY_VERSION === '0.9.0' && strpos($main_source, " * Version: 0.9.0\n") !== false, 'the version is 0.9.0 in the header and the constant');
$readme_081 = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/readme.txt');
expect(strpos($readme_081, "Stable tag: 0.9.0") !== false, 'and in the readme stable tag');
expect(substr_count($readme_081, "= 0.9.0 =") === 2 && substr_count($readme_081, "= 0.8.1 =") === 2 && substr_count($readme_081, "= 0.8.0 =") === 2, 'with a changelog entry and an upgrade notice, keeping 0.8.1 and 0.8.0');
expect(strpos($readme_081, '= Does the AI integration cost anything? =') !== false, 'the readme answers whether the AI integration costs anything');

/* --- Free is never scored down for data it holds: optIn fields publish unless retired --- */
$optin_local = array('@type' => 'Restaurant', 'name' => 'Sakura', 'url' => 'https://example.test/', 'description' => 'Small bistro.', 'email' => 'shop@example.test');
$optin_settings = webmcp_canary_default_settings();
$optin_template = array(
    'description' => array('optIn' => true, 'source' => 'description'),
    'email' => array('optIn' => true, 'source' => 'email'),
);
$node = webmcp_canary_central_business_node($optin_local, $optin_settings, array('central_jsonld' => array(), 'business_template' => $optin_template, 'business_fields' => array()));
expect(($node['description'] ?? null) === 'Small bistro.', 'an entered description is published even when the plan names no optIn fields');
expect(($node['email'] ?? null) === 'shop@example.test', 'an entered email is published on every plan');
$node = webmcp_canary_central_business_node($optin_local, $optin_settings, array('central_jsonld' => array(), 'business_template' => $optin_template, 'business_fields' => array('email' => false)));
expect(!isset($node['email']), 'a ruleset can still retire an optIn field explicitly');

/* --- 0.8.1: first-run setup wizard ---------------------------------------- */

$wizard_reset = function ($settings = array()) {
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), $settings);
    delete_option(WEBMCP_CANARY_WIZARD_OPTION);
    delete_option(WEBMCP_CANARY_CONSENT_OPTION);
    delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
    $GLOBALS['webmcp_test_transients'] = array();
    $GLOBALS['webmcp_test_denied_caps'] = array();
    $GLOBALS['webmcp_test_user_id'] = 1;
    $GLOBALS['webmcp_test_active_plugins'] = array();
};
$interactive = array('cli' => false, 'ajax' => false, 'rest' => false, 'network' => false, 'bulk' => false);
$wizard_url = webmcp_canary_wizard_url();
expect(strpos($wizard_url, 'page=webmcp-canary-setup') !== false, 'the wizard lives at Nurevo AEO > Setup');

// Reachable later from the Nurevo menu.
$GLOBALS['webmcp_test_submenus'] = array();
webmcp_canary_wizard_menu();
expect(($GLOBALS['webmcp_test_submenus']['webmcp-canary-setup']['parent'] ?? '') === 'webmcp-canary', 'Setup is a submenu of Nurevo AEO');
expect($GLOBALS['webmcp_test_submenus']['webmcp-canary-setup']['title'] === 'Setup' && $GLOBALS['webmcp_test_submenus']['webmcp-canary-setup']['capability'] === 'manage_options', 'labelled Setup, for administrators');

// The activation hook asks for the redirect, and passes on whether it was network-wide.
$activate_body = webmcp_test_function_body(file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/nurevo-webmcp.php'), 'webmcp_canary_activate_aeo_score');
expect(strpos($activate_body, 'webmcp_canary_wizard_flag_redirect($network_wide)') !== false, 'activation flags the wizard redirect');
expect(strpos($activate_body, 'return;') < strpos($activate_body, 'webmcp_canary_wizard_flag_redirect'), 'and a network activation returns before it');

// A single interactive activation by an administrator: redirected once.
$wizard_reset();
expect(webmcp_canary_wizard_flag_redirect(false, $interactive) === true, 'a single interactive activation flags the redirect');
expect(get_transient(WEBMCP_CANARY_WIZARD_REDIRECT_TRANSIENT) === 1, 'the flag is a transient naming the activating user');
expect(webmcp_canary_wizard_redirect_target($interactive) === $wizard_url, 'the next admin_init redirects to the wizard');
expect(get_transient(WEBMCP_CANARY_WIZARD_REDIRECT_TRANSIENT) === false, 'and consumes the flag');
expect(webmcp_canary_wizard_redirect_target($interactive) === '', 'so it fires once only');
$redirect_hooks = array_filter($GLOBALS['webmcp_test_hooks']['admin_init'], function ($cb) { return $cb === 'webmcp_canary_wizard_maybe_redirect'; });
expect(count($redirect_hooks) === 1, 'the redirect runs on admin_init');

// Never under WP-CLI (this harness runs with WP_CLI defined), in bulk, network-wide, AJAX or REST.
$wizard_reset();
expect(webmcp_canary_wizard_flag_redirect(false) === false && get_transient(WEBMCP_CANARY_WIZARD_REDIRECT_TRANSIENT) === false, 'a WP-CLI activation flags nothing');
foreach (array('bulk', 'network', 'ajax', 'rest', 'cli') as $blocked) {
    $context = array_merge($interactive, array($blocked => true));
    $wizard_reset();
    expect(webmcp_canary_wizard_flag_redirect(false, $context) === false, "no redirect is flagged for a {$blocked} activation");
    // Flagged by an earlier request, but consumed on a request of this kind.
    webmcp_canary_wizard_flag_redirect(false, $interactive);
    expect(webmcp_canary_wizard_redirect_target($context) === '', "a {$blocked} request is never redirected");
    expect(get_transient(WEBMCP_CANARY_WIZARD_REDIRECT_TRANSIENT) === false, "and the flag is spent there ({$blocked})");
}
$wizard_reset();
expect(webmcp_canary_wizard_flag_redirect(true, $interactive) === false, 'a network activation flags nothing');
$_GET['activate-multi'] = 'true';
expect(webmcp_canary_wizard_request_context()['bulk'] === true, 'the activate-multi screen is recognised as a bulk activation');
unset($_GET['activate-multi']);
$_POST['action'] = 'activate-selected';
expect(webmcp_canary_wizard_request_context()['bulk'] === true, 'and so is the bulk action itself');
unset($_POST['action']);
expect(webmcp_canary_wizard_request_context()['cli'] === true, 'WP-CLI is read from the environment');

// Never on a site that is already configured.
$wizard_reset(array('site_key' => 'nrv_existing'));
expect(webmcp_canary_wizard_flag_redirect(false, $interactive) === false, 'a site with a site key is not redirected');
$wizard_reset(array('business_name' => 'Sakura', 'business_address' => 'Tokyo'));
expect(webmcp_canary_wizard_flag_redirect(false, $interactive) === false, 'a site with name and address is not redirected');
$wizard_reset(array('business_name' => 'Sakura'));
expect(webmcp_canary_wizard_flag_redirect(false, $interactive) === true, 'a name alone (the site title autofill) does not count as configured');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['business_address'] = 'Tokyo';
expect(webmcp_canary_wizard_redirect_target($interactive) === '', 'configured between activation and the redirect: not redirected');
// Not for someone without manage_options, nor for a different user.
$wizard_reset();
$GLOBALS['webmcp_test_denied_caps'] = array('manage_options');
expect(webmcp_canary_wizard_flag_redirect(false, $interactive) === false, 'a user without manage_options flags nothing');
$wizard_reset();
webmcp_canary_wizard_flag_redirect(false, $interactive);
$GLOBALS['webmcp_test_user_id'] = 2;
expect(webmcp_canary_wizard_redirect_target($interactive) === '', 'another user is not redirected');
// Not again once the wizard was finished or skipped.
$wizard_reset();
update_option(WEBMCP_CANARY_WIZARD_OPTION, array('step' => 3, 'status' => 'done'));
expect(webmcp_canary_wizard_flag_redirect(false, $interactive) === false, 'a finished wizard is not reopened by a later activation');

// Step 1: the cards map onto the existing business_type values.
$known_types = webmcp_canary_local_business_types();
foreach (webmcp_canary_wizard_site_types() as $key => $card) {
    expect($card['type'] === '' || in_array($card['type'], $known_types, true), "card {$key} sets a known schema.org type");
    foreach ($card['family'] as $member) {
        expect(in_array($member, $known_types, true), "card {$key} only claims known types ({$member})");
    }
}
expect(array_keys(webmcp_canary_wizard_site_types()) === array('restaurant', 'beauty', 'clinic', 'professional', 'retail', 'lodging', 'ec', 'b2b', 'other'), 'the nine categories, in order (online shop and B2B before Other)');
expect(webmcp_canary_wizard_current_site_type(array('business_type' => 'Dentist')) === 'clinic', 'a Dentist shows as Clinic or dental');
expect(webmcp_canary_wizard_current_site_type(array('business_type' => 'Library')) === 'other', 'an unclaimed type shows as Other');
expect(webmcp_canary_wizard_current_site_type(array('business_type' => '')) === '', 'nothing is preselected when no type is set');

$nonce = md5('webmcp_canary_wizard');
$wizard_reset();
$log_before = count($GLOBALS['webmcp_test_remote_get_log']);
$GLOBALS['webmcp_test_last_remote'] = null;
$result = webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '1', 'site_type' => 'beauty'));
expect($result['ok'] && webmcp_canary_settings()['business_type'] === 'BeautySalon', 'step 1 saves the business type');
expect(strpos($result['redirect'], 'step=2') !== false, 'and continues to step 2');
expect(webmcp_canary_wizard_state()['step'] === 1 && webmcp_canary_wizard_state()['status'] === 'in_progress', 'and records the progress');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['business_type'] = 'HairSalon';
webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '1', 'site_type' => 'beauty'));
expect(webmcp_canary_settings()['business_type'] === 'HairSalon', 'a more specific type in the same category is kept');
webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '1', 'site_type' => 'restaurant'));
expect(webmcp_canary_settings()['business_type'] === 'Restaurant', 'another category replaces it');
webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '1', 'site_type' => 'other'));
expect(webmcp_canary_settings()['business_type'] === '', 'Other leaves the type to the plugin (Organization or LocalBusiness)');
$bad_card = webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '1', 'site_type' => 'spaceship'));
expect(!$bad_card['ok'] && $bad_card['error'] === 'site_type' && strpos($bad_card['redirect'], 'step=1') !== false, 'an unknown category is rejected back to step 1');

// The SEO plugin line on step 1.
$GLOBALS['webmcp_test_active_plugins'] = array('wordpress-seo/wp-seo.php');
ob_start(); webmcp_canary_wizard_render_step_1(webmcp_canary_settings()); $step1 = ob_get_clean();
expect(strpos($step1, 'Yoast SEO is active. Nurevo adds only the facts missing') !== false, 'step 1 says Nurevo only fills gaps in the SEO plugin graph');
expect(strpos($step1, '<fieldset>') !== false && strpos($step1, '<legend>') !== false && substr_count($step1, 'type="radio"') === 9, 'step 1 is a fieldset of nine radio cards');
expect(strpos($step1, 'id="webmcp-wizard-heading" tabindex="-1"') !== false, 'the step heading can take focus');
$GLOBALS['webmcp_test_active_plugins'] = array();
ob_start(); webmcp_canary_wizard_render_step_1(webmcp_canary_settings()); $step1_plain = ob_get_clean();
expect(strpos($step1_plain, 'is active. Nurevo adds only') === false, 'and says nothing when no SEO plugin is active');

// Step 2: prefill from Nurevo, then the SEO plugin, then the site title and tagline.
$wizard_reset(array('business_phone' => '03-1111-2222'));
$GLOBALS['webmcp_test_options']['blogname'] = 'Sakura Bistro';
$GLOBALS['webmcp_test_options']['blogdescription'] = 'Seasonal French cooking';
$GLOBALS['webmcp_test_active_plugins'] = array('wordpress-seo/wp-seo.php');
$saved_wpseo_local = $GLOBALS['webmcp_test_options']['wpseo_local'] ?? null;
$GLOBALS['webmcp_test_options']['wpseo_local'] = array('location_address' => '1-2-3 Jingumae, Tokyo');
$prefill = webmcp_canary_wizard_prefill();
expect($prefill['business_phone'] === array('value' => '03-1111-2222', 'source' => 'saved'), 'a saved value comes first');
expect($prefill['business_address'] === array('value' => '1-2-3 Jingumae, Tokyo', 'source' => 'seo'), 'then the SEO plugin');
expect($prefill['business_name'] === array('value' => 'Sakura Bistro', 'source' => 'site'), 'then the site title');
expect($prefill['business_description']['source'] === 'site', 'and the tagline');
expect($prefill['business_hours'] === array('value' => '', 'source' => ''), 'an unknown field stays empty');
ob_start(); webmcp_canary_wizard_render_step_2(webmcp_canary_settings()); $step2 = ob_get_clean();
expect(substr_count($step2, 'webmcp-wizard-field is-missing') === 1 && strpos($step2, 'id="webmcp-wizard-business-hours"') !== false, 'the empty field is highlighted');
expect(strpos($step2, '1 field(s) are still empty') !== false, 'and counted');
expect(strpos($step2, 'Suggested from your SEO plugin') !== false && strpos($step2, 'Suggested from your site title and tagline') !== false, 'suggested values say where they came from');
expect(strpos($step2, '<label for="webmcp-wizard-business-name">') !== false, 'every field has a label');
$GLOBALS['webmcp_test_active_plugins'] = array();
if ($saved_wpseo_local === null) { unset($GLOBALS['webmcp_test_options']['wpseo_local']); } else { $GLOBALS['webmcp_test_options']['wpseo_local'] = $saved_wpseo_local; }

$result = webmcp_canary_wizard_process(array(
    '_wpnonce' => $nonce, 'step' => '2',
    'business_name' => '<b>Sakura Bistro</b>', 'business_address' => '1-2-3 Jingumae, Tokyo', 'business_phone' => '03-1111-2222',
    'business_hours' => 'Mon-Fri 9:00-18:00, Sat 10:00-15:00', 'business_description' => 'Seasonal French cooking',
));
$after2 = webmcp_canary_settings();
expect($result['ok'] && $after2['business_name'] === 'Sakura Bistro', 'step 2 saves through the sanitize callback (tags stripped)');
expect($after2['business_address'] === '1-2-3 Jingumae, Tokyo' && $after2['business_hours'] === 'Mon-Fri 9:00-18:00, Sat 10:00-15:00', 'step 2 saves address and hours');
expect($after2['enabled'] === '0' && $after2['serve_schema'] === '1' && $after2['allow_ai_crawlers'] === '1', 'and leaves the switches it does not show alone');
expect(webmcp_canary_wizard_state()['step'] === 2, 'progress moves to step 2');
$hours_lines = webmcp_canary_wizard_hours_lines($after2['business_hours']);
expect($hours_lines === array('Mon–Fri 09:00–18:00', 'Sat 10:00–15:00'), 'the hours are read back through the existing parser: ' . json_encode($hours_lines, JSON_UNESCAPED_UNICODE));
expect(webmcp_canary_wizard_hours_lines('by appointment') === null, 'unreadable hours are reported as published as written');
ob_start(); webmcp_canary_wizard_render_step_2(webmcp_canary_settings()); $step2_saved = ob_get_clean();
expect(strpos($step2_saved, 'Read as:') !== false && strpos($step2_saved, '<li>Mon–Fri 09:00–18:00</li>') !== false, 'step 2 shows the parsed hours');
expect(strpos($step2_saved, 'is-missing') === false, 'and no field is flagged once all are filled');
$check = webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '2', 'business_hours' => 'Daily 11:00-22:00', 'nurevo_wizard_check_hours' => '1'));
expect(strpos($check['redirect'], 'step=2') !== false && webmcp_canary_settings()['business_hours'] === 'Daily 11:00-22:00', 'Save and check the hours stays on step 2');

// Step 3: one switch, the training choice, and consent that is off by default.
ob_start(); webmcp_canary_wizard_render_step_3(webmcp_canary_settings()); $step3 = ob_get_clean();
expect(preg_match('/name="nurevo_publish" value="1" checked/', $step3) === 1, 'the recommended switch is on the first time');
expect(preg_match('/name="nurevo_consent" value="1"\s*>/', $step3) === 1, 'the consent box is unticked');
expect(substr_count($step3, 'name="ai_training"') === 3 && strpos($step3, 'value="default" checked') !== false, 'the three training choices, default selected');
expect(substr_count($step3, '<legend>') === 3, 'each group has a legend');
$result = webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '3', 'nurevo_publish' => '1', 'ai_training' => 'block'));
$after3 = webmcp_canary_settings();
expect($result['ok'] && $after3['enabled'] === '1' && $after3['serve_schema'] === '1' && $after3['serve_llms_txt'] === '1' && $after3['allow_ai_crawlers'] === '1', 'the switch turns on JSON-LD, llms.txt and AI search crawlers');
expect($after3['ai_training'] === 'block', 'the training choice is saved');
expect(!webmcp_canary_has_consent(), 'no consent is recorded without the box');
expect(webmcp_canary_wizard_state()['status'] === 'done' && strpos($result['redirect'], 'step=4') !== false, 'step 3 finishes the wizard');
webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '3', 'ai_training' => 'nonsense'));
expect(webmcp_canary_settings()['enabled'] === '0' && webmcp_canary_settings()['ai_training'] === 'block', 'unticking turns output off; an invalid choice keeps the last one');

// No HTTP anywhere in steps 1-3, and none on step 4 without consent.
ob_start(); webmcp_canary_wizard_render_step_4(webmcp_canary_settings()); $step4 = ob_get_clean();
expect(strpos($step4, 'nothing has been sent') !== false, 'step 4 says nothing was sent');
expect(count($GLOBALS['webmcp_test_remote_get_log']) === $log_before && $GLOBALS['webmcp_test_last_remote'] === null, 'the wizard makes no HTTP request before consent');
expect(strpos($step4, 'Add the Nurevo FAQ block to a page') !== false && strpos($step4, 'Connect to nurevo.jp') !== false && strpos($step4, 'Per-page settings:') !== false, 'step 4 lists the next steps');
expect(substr_count($step4, 'Standard') <= 1, 'at most one line about Standard');

// With consent, step 4 shows the score through the existing function and cache.
webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '3', 'nurevo_publish' => '1', 'ai_training' => 'default', 'nurevo_consent' => '1'));
$consent = get_option(WEBMCP_CANARY_CONSENT_OPTION);
expect(webmcp_canary_has_consent() && $consent['via'] === 'setup', 'ticking the box records consent in the existing store');
expect(count($GLOBALS['webmcp_test_remote_get_log']) === $log_before, 'recording consent sends nothing by itself');
$GLOBALS['webmcp_test_remote_get']['api/aeo/score'] = array('status' => 200, 'body' => json_encode(array('score' => 74, 'band' => 'yellow', 'gatePassed' => true, 'checks' => array(array('id' => 'llms', 'label' => 'llms', 'status' => 'OK', 'message' => '', 'fixable' => false)))));
ob_start(); webmcp_canary_wizard_render_step_4(webmcp_canary_settings()); $step4_scored = ob_get_clean();
expect(strpos($step4_scored, '>74</strong>') !== false, 'step 4 shows the score');
expect(count($GLOBALS['webmcp_test_remote_get_log']) === $log_before + 1, 'with one diagnosis request');
ob_start(); webmcp_canary_wizard_render_step_4(webmcp_canary_settings()); ob_get_clean();
expect(count($GLOBALS['webmcp_test_remote_get_log']) === $log_before + 1, 'and a reload answers from the existing cache');
unset($GLOBALS['webmcp_test_remote_get']['api/aeo/score']);

// Skip and resume.
$wizard_reset();
webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '1', 'site_type' => 'retail'));
$skip = webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '2', 'business_name' => 'Not saved', 'nurevo_wizard_skip' => '1'));
expect($skip['ok'] && !empty($skip['skipped']) && strpos($skip['redirect'], 'page=webmcp-canary') !== false, 'Skip leaves the wizard for the AEO screen');
expect(webmcp_canary_settings()['business_name'] === '', 'a skipped step saves nothing');
expect(webmcp_canary_wizard_state()['status'] === 'skipped' && webmcp_canary_wizard_state()['step'] === 1, 'earlier progress is kept');
expect(webmcp_canary_wizard_resume_step() === 2, 'and the wizard resumes at the step after it');
$_GET = array('page' => 'webmcp-canary-setup');
ob_start(); webmcp_canary_wizard_page(); $resumed = ob_get_clean();
expect(strpos($resumed, 'Your business information') !== false && strpos($resumed, 'aria-current="step"') !== false, 'opening Setup again resumes at step 2 with the step marked');
expect(strpos($resumed, 'Step 2 of 4') !== false, 'with a visible step indicator');
expect(substr_count($resumed, 'nurevo_wizard_skip') === 1, 'every step offers Skip');
webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '2', 'business_name' => 'Back again'));
expect(webmcp_canary_wizard_state()['status'] === 'in_progress' && webmcp_canary_settings()['business_name'] === 'Back again', 'continuing after a skip saves and clears the skipped state');

// The skipped notice: once, on Nurevo screens only, dismissible.
update_option(WEBMCP_CANARY_WIZARD_OPTION, array('step' => 1, 'status' => 'skipped'));
$GLOBALS['webmcp_test_user_meta'] = array();
$_GET = array('page' => 'webmcp-canary');
ob_start(); webmcp_canary_wizard_skipped_notice(); $skip_notice = ob_get_clean();
expect(strpos($skip_notice, 'id="nurevo-setup-notice" class="notice notice-info is-dismissible"') !== false, 'a skipped setup shows one dismissible info notice');
expect(strpos($skip_notice, 'Resume setup') !== false && strpos($skip_notice, 'webmcp_canary_dismiss_setup_notice') !== false, 'with a resume link and a server-side dismissal');
$_GET = array();
ob_start(); webmcp_canary_wizard_skipped_notice(); $elsewhere_notice = ob_get_clean();
expect($elsewhere_notice === '', 'not outside Nurevo screens');
$_GET = array('page' => 'webmcp-canary-setup');
ob_start(); webmcp_canary_wizard_skipped_notice(); $on_wizard = ob_get_clean();
expect($on_wizard === '', 'nor on the wizard itself');
$_GET = array('page' => 'webmcp-canary-settings', 'nurevo_dismiss_setup' => '1', '_wpnonce' => 'forged');
expect(webmcp_canary_wizard_maybe_dismiss_notice() === false, 'a forged dismissal is ignored');
$_GET['_wpnonce'] = md5('webmcp_canary_dismiss_setup');
expect(webmcp_canary_wizard_maybe_dismiss_notice() === true, 'the Do not show again link dismisses it');
ob_start(); webmcp_canary_wizard_skipped_notice(); $dismissed = ob_get_clean();
expect($dismissed === '', 'and it stays dismissed for that user');
$GLOBALS['webmcp_test_user_id'] = 3;
$_GET = array('page' => 'webmcp-canary');
ob_start(); webmcp_canary_wizard_skipped_notice(); $other_admin = ob_get_clean();
expect($other_admin !== '', 'another administrator still sees it once');
expect(webmcp_canary_wizard_dismiss_notice_for_user(3) && get_user_meta(3, WEBMCP_CANARY_WIZARD_NOTICE_META, true) === 1, 'the AJAX close button stores the same per-user dismissal');
$GLOBALS['webmcp_test_user_id'] = 1;
update_option(WEBMCP_CANARY_WIZARD_OPTION, array('step' => 3, 'status' => 'done'));
$GLOBALS['webmcp_test_user_meta'] = array();
ob_start(); webmcp_canary_wizard_skipped_notice(); $finished = ob_get_clean();
expect($finished === '', 'no notice once setup is finished');
$_GET = array();

// The "output is off" notice stays off the wizard, which has the switch itself.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['enabled'] = '0';
$_GET = array('page' => 'webmcp-canary-setup');
ob_start(); webmcp_canary_output_off_notice(); $off_on_wizard = ob_get_clean();
expect($off_on_wizard === '', 'the output-off notice is not shown on the wizard');
$_GET = array();

// An invalid nonce or a missing capability is rejected, and nothing is saved.
$wizard_reset();
$forged = webmcp_canary_wizard_process(array('_wpnonce' => 'forged', 'step' => '1', 'site_type' => 'lodging'));
expect(!$forged['ok'] && $forged['error'] === 'nonce' && webmcp_canary_settings()['business_type'] === '', 'an invalid nonce is rejected');
$GLOBALS['webmcp_test_denied_caps'] = array('manage_options');
$denied = webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '1', 'site_type' => 'lodging'));
expect(!$denied['ok'] && $denied['error'] === 'forbidden' && webmcp_canary_settings()['business_type'] === '', 'a user without manage_options is rejected');
ob_start(); webmcp_canary_wizard_page(); $denied_page = ob_get_clean();
expect($denied_page === '', 'and sees no wizard');
$GLOBALS['webmcp_test_denied_caps'] = array();
$outside = webmcp_canary_wizard_process(array('_wpnonce' => $nonce, 'step' => '9'));
expect(!$outside['ok'] && $outside['error'] === 'step', 'an unknown step is rejected');
$wizard_source = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/includes/setup-wizard.php');
$action_body = webmcp_test_function_body($wizard_source, 'webmcp_canary_wizard_action');
expect(strpos($action_body, "current_user_can('manage_options')") !== false && strpos($action_body, "check_admin_referer('webmcp_canary_wizard')") !== false, 'the admin-post handler checks the capability and the nonce');
expect(strpos($wizard_source, 'wp_remote_') === false, 'the wizard has no HTTP calls of its own');
expect(strpos($wizard_source, "register_setting") === false && strpos($wizard_source, "update_option(WEBMCP_CANARY_OPTION, \$clean)") !== false, 'settings go into the one existing option');
$wizard_reset();

/* --- 0.8.1: WordPress Abilities API (read-only) --------------------------- */

// Without the API (WordPress before 6.9): nothing is hooked and nothing breaks.
expect(!function_exists('wp_register_ability'), 'the harness starts without the Abilities API');
expect(webmcp_canary_abilities_bootstrap() === false, 'bootstrap reports the API is missing');
expect(empty($GLOBALS['webmcp_test_hooks']['wp_abilities_api_init']) && empty($GLOBALS['webmcp_test_hooks']['wp_abilities_api_categories_init']), 'no ability hooks are added');
webmcp_canary_register_ability_category();
webmcp_canary_register_abilities();
expect(empty($GLOBALS['webmcp_test_abilities']), 'calling the registrars directly registers nothing');

// With the API (stand-ins for the WordPress 6.9 functions).
if (!function_exists('wp_register_ability')) {
    function wp_register_ability($name, $args) {
        if (!preg_match('/^[a-z0-9-]+\/[a-z0-9-]+$/', $name)) {
            return null;
        }
        $GLOBALS['webmcp_test_abilities'][$name] = $args;
        return (object) array('name' => $name);
    }
    function wp_register_ability_category($slug, $args) {
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            return null;
        }
        $GLOBALS['webmcp_test_ability_categories'][$slug] = $args;
        return (object) array('slug' => $slug);
    }
}
expect(webmcp_canary_abilities_bootstrap() === true, 'bootstrap hooks registration when the API exists');
foreach ($GLOBALS['webmcp_test_hooks']['wp_abilities_api_categories_init'] as $callback) { $callback(); }
foreach ($GLOBALS['webmcp_test_hooks']['wp_abilities_api_init'] as $callback) { $callback(); }
$category = $GLOBALS['webmcp_test_ability_categories']['nurevo'] ?? null;
expect(is_array($category) && $category['label'] !== '' && $category['description'] !== '', 'the nurevo category is registered with a label and description');
$abilities = $GLOBALS['webmcp_test_abilities'] ?? array();
expect(array_keys($abilities) === array('nurevo/get-status', 'nurevo/get-aeo-score', 'nurevo/get-fixes', 'nurevo/get-business-profile'), 'the four abilities are registered');

/** A small JSON Schema check: types (incl. null), required keys, nested properties and items. */
function webmcp_test_schema_errors($value, $schema, $path = '$') {
    $errors = array();
    $types = isset($schema['type']) ? (array) $schema['type'] : array();
    $type_ok = empty($types);
    foreach ($types as $type) {
        if (($type === 'object' && is_array($value) && (empty($value) || array_keys($value) !== range(0, count($value) - 1)))
            || ($type === 'array' && is_array($value) && (empty($value) || array_keys($value) === range(0, count($value) - 1)))
            || ($type === 'string' && is_string($value))
            || ($type === 'integer' && is_int($value))
            || ($type === 'number' && (is_int($value) || is_float($value)))
            || ($type === 'boolean' && is_bool($value))
            || ($type === 'null' && $value === null)) {
            $type_ok = true;
        }
    }
    if (!$type_ok) {
        return array("{$path}: expected " . implode('|', $types) . ', got ' . gettype($value));
    }
    if (isset($schema['enum']) && !in_array($value, $schema['enum'], true)) {
        $errors[] = "{$path}: " . var_export($value, true) . ' not in enum';
    }
    if (is_array($value) && in_array('object', $types, true)) {
        foreach ($schema['required'] ?? array() as $key) {
            if (!array_key_exists($key, $value)) {
                $errors[] = "{$path}.{$key}: required";
            }
        }
        foreach ($schema['properties'] ?? array() as $key => $sub) {
            if (array_key_exists($key, $value)) {
                $errors = array_merge($errors, webmcp_test_schema_errors($value[$key], $sub, "{$path}.{$key}"));
            }
        }
    }
    if (is_array($value) && in_array('array', $types, true) && isset($schema['items'])) {
        foreach ($value as $index => $item) {
            $errors = array_merge($errors, webmcp_test_schema_errors($item, $schema['items'], "{$path}[{$index}]"));
        }
    }
    return $errors;
}

foreach ($abilities as $name => $args) {
    foreach (array('label', 'description', 'category', 'input_schema', 'output_schema', 'execute_callback', 'permission_callback', 'meta') as $key) {
        expect(isset($args[$key]), "{$name} has {$key}");
    }
    expect(is_string($args['label']) && $args['label'] !== '' && is_string($args['description']) && $args['description'] !== '', "{$name} has a label and a description");
    expect($args['category'] === 'nurevo', "{$name} is in the nurevo category");
    expect($args['input_schema']['type'] === 'object' && $args['input_schema']['properties'] === array() && $args['input_schema']['additionalProperties'] === false, "{$name} takes no input");
    expect(array_key_exists('default', $args['input_schema']), "{$name} gives its input a default so a call with no input validates");
    expect($args['output_schema']['type'] === 'object' && !empty($args['output_schema']['properties']), "{$name} declares an output schema");
    expect($args['meta']['annotations']['readonly'] === true && $args['meta']['annotations']['destructive'] === false, "{$name} is annotated read-only");
    expect($args['meta']['show_in_rest'] === true, "{$name} is available through the Abilities REST API");
    expect(is_callable($args['execute_callback']) && is_callable($args['permission_callback']), "{$name} has callable callbacks");
    // Only administrators.
    $GLOBALS['webmcp_test_denied_caps'] = array('manage_options');
    expect(call_user_func($args['permission_callback'], array()) === false, "{$name} denies users without manage_options");
    $GLOBALS['webmcp_test_denied_caps'] = array();
    expect(call_user_func($args['permission_callback'], array()) === true, "{$name} allows administrators");
}

// Executing them: local reads only. No remote calls, no writes.
$wizard_reset(array(
    'enabled' => '1', 'serve_schema' => '1', 'serve_llms_txt' => '1', 'allow_ai_crawlers' => '1', 'ai_training' => 'block',
    'site_key' => 'nrv_secret_site_key', 'site_id' => 'site01', 'profile_token' => 'nrvp_secret_token', 'admin_token' => 'adm_secret',
    'license_key' => 'nrv_secret_licence', 'site_email' => 'owner-private@example.test', 'plan' => 'standard',
    'business_name' => 'Sakura Bistro', 'business_type' => 'Restaurant', 'business_address' => '1-2-3 Jingumae, Tokyo',
    'business_phone' => '+81-3-1111-2222', 'business_hours' => 'Mon-Fri 9:00-18:00', 'business_description' => 'Seasonal French cooking',
    'business_url' => 'https://example.test/', 'business_email' => '',
));
$GLOBALS['webmcp_test_queried'] = null;
$GLOBALS['webmcp_test_front_page'] = true;
$log_before = count($GLOBALS['webmcp_test_remote_get_log']);
$GLOBALS['webmcp_test_last_remote'] = null;
$options_before = serialize($GLOBALS['webmcp_test_options']);
$run = function ($name) use ($abilities) {
    $args = $abilities[$name];
    $output = call_user_func($args['execute_callback'], $args['input_schema']['default']);
    $errors = webmcp_test_schema_errors($output, $args['output_schema']);
    expect($errors === array(), "{$name} output matches its schema: " . implode('; ', $errors));
    return $output;
};

$status = $run('nurevo/get-status');
expect($status['output_enabled'] === true && $status['outputs'] === array('json_ld' => true, 'llms_txt' => true, 'robots_rules' => true), 'get-status reports the active outputs');
expect($status['ai_training'] === 'block' && $status['connected'] === true && $status['plan'] === 'standard' && $status['consent'] === true, 'get-status reports training, connection, plan and consent');

$no_score = $run('nurevo/get-aeo-score');
expect($no_score['available'] === false && $no_score['score'] === null, 'get-aeo-score says when no diagnosis is stored');
expect(strpos($no_score['message'], 'Nurevo AEO > AEO Score') !== false, 'and tells the user where to run one');
$no_fixes = $run('nurevo/get-fixes');
expect($no_fixes['available'] === false && $no_fixes['fixes'] === array(), 'get-fixes has nothing to list without a diagnosis');
delete_option(WEBMCP_CANARY_CONSENT_OPTION);
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['site_key'] = '';
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['site_id'] = '';
$unconsented = $run('nurevo/get-aeo-score');
expect(strpos($unconsented['message'], 'press Run diagnosis') !== false, 'without consent it explains how to agree and run one');
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['site_key'] = 'nrv_secret_site_key';
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['site_id'] = 'site01';

$stored_at = 1760000000;
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_AEO_SCORE_OPTION] = array('saved_at' => $stored_at, 'identity' => 'stale-or-not', 'data' => array(
    'score' => 58, 'band' => 'yellow', 'gatePassed' => true, 'checks' => array(
        array('id' => 'schema', 'label' => 'Schema', 'status' => 'OK', 'message' => '', 'fixable' => true),
        array('id' => 'llms', 'label' => 'llms.txt', 'status' => 'BAD', 'message' => '', 'fixable' => true),
        array('id' => 'coverage', 'label' => 'Coverage', 'status' => 'WARN', 'message' => '', 'fixable' => true),
        array('id' => 'legibility', 'label' => 'Legibility', 'status' => 'WARN', 'message' => '', 'fixable' => false),
        array('id' => 'brand_new_check', 'label' => 'Brand new', 'status' => 'BAD', 'message' => 'Something new', 'fixable' => false, 'hints' => array('Do the new thing.')),
    ),
));
$options_before = serialize($GLOBALS['webmcp_test_options']);
$score_out = $run('nurevo/get-aeo-score');
expect($score_out['available'] === true && $score_out['score'] === 58 && $score_out['band'] === 'yellow', 'get-aeo-score returns the stored score and band');
expect($score_out['readiness'] === 58 && $score_out['visibility'] === null && $score_out['visibility_answers'] === 0, 'and, without score v2 data, the readiness score with no visibility invented');
expect($score_out['date'] === gmdate('c', $stored_at), 'with the date it was stored');
expect($score_out['checklist'] === array('total' => 5, 'ok' => 1, 'warn' => 2, 'bad' => 2), 'and a checklist summary');
$fixes = $run('nurevo/get-fixes');
expect(count($fixes['fixes']) === 4 && $fixes['fixes'][0]['id'] === 'llms', 'get-fixes lists only the WARN and BAD items');
expect(strpos($fixes['fixes'][0]['next_step'], 'press "Create it"') !== false, 'a one-click fix says which button to press');
expect(strpos($fixes['fixes'][1]['next_step'], 'Open Nurevo AEO > Settings') !== false, 'a missing-facts item points to the business details');
expect(strpos($fixes['fixes'][2]['next_step'], 'headings') !== false, 'an editorial item gets the editorial advice');
expect($fixes['fixes'][3]['next_step'] === 'Do the new thing.', 'an unknown check falls back to the service hints');

$profile = $run('nurevo/get-business-profile');
expect($profile['published'] === true && $profile['name'] === 'Sakura Bistro' && $profile['type'] === 'Restaurant', 'get-business-profile returns the published business node');
expect($profile['address'] === '1-2-3 Jingumae, Tokyo' && $profile['telephone'] === '+81-3-1111-2222', 'with the address and phone as published');
expect(!empty($profile['opening_hours_specification']) && $profile['opening_hours'] === null, 'and the hours as the JSON-LD carries them');
expect($profile['email'] === null, 'an email that is not published is not returned');
$everything = json_encode(array($status, $score_out, $fixes, $profile));
foreach (array('nrv_secret_site_key', 'nrvp_secret_token', 'adm_secret', 'nrv_secret_licence', 'owner-private@example.test', 'owner@example.test') as $secret) {
    expect(strpos($everything, $secret) === false, "no ability returns {$secret}");
}
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['business_email'] = 'hello@sakura.example';
$options_before = serialize($GLOBALS['webmcp_test_options']);
$published_email = $run('nurevo/get-business-profile');
expect($published_email['email'] === 'hello@sakura.example', 'a business email the owner chose to publish is returned');
expect(serialize($GLOBALS['webmcp_test_options']) === $options_before, 'running the abilities writes no option');
expect(count($GLOBALS['webmcp_test_remote_get_log']) === $log_before && $GLOBALS['webmcp_test_last_remote'] === null, 'running the abilities makes no remote call');
$abilities_source = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/includes/abilities.php');
foreach (array('wp_remote_', 'update_option', 'webmcp_canary_get_aeo_score(', 'set_transient', 'delete_option') as $forbidden) {
    expect(strpos($abilities_source, $forbidden) === false, "abilities.php never calls {$forbidden}");
}
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['enabled'] = '0';
expect($run('nurevo/get-business-profile')['published'] === false, 'with output off the profile says it is not published');
$wizard_reset();


/* ---------------- Site types: local (default), online shop, B2B ---------------- */
{
    $GLOBALS['webmcp_test_queried'] = null;
    $GLOBALS['webmcp_test_front_page'] = true;
    $GLOBALS['webmcp_test_active_plugins'] = array();
    $GLOBALS['webmcp_test_products'] = array();
    $base = array_merge(webmcp_canary_default_settings(), array(
        'enabled' => '1', 'serve_schema' => '1', 'business_name' => 'Example Co', 'business_url' => 'https://example.test/',
        'business_address' => '東京都渋谷区1-1', 'business_phone' => '03-1234-5678', 'business_hours' => 'Mo-Fr 09:00-18:00',
    ));
    update_option(WEBMCP_CANARY_SERVICES_OPTION, array());

    // Unset is local, and a local site publishes exactly what it did.
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $base;
    expect(webmcp_canary_site_type() === 'local' && webmcp_canary_site_type_choice() === '', 'no choice means local');
    $local_org = webmcp_canary_own_schema_bundle()['core'][0];
    expect($local_org['@type'] === 'LocalBusiness', 'a local site with an address stays LocalBusiness');
    expect(isset($local_org['openingHoursSpecification']) || isset($local_org['openingHours']), 'and keeps its opening hours');
    expect(!isset($local_org['hasMerchantReturnPolicy']) && !isset($local_org['hasOfferCatalog']), 'and gains nothing');
    expect(webmcp_canary_typed_business_node($local_org, $base) === $local_org, 'the typed transform leaves a local node untouched');

    // WooCommerce suggests an online shop, but does not choose it.
    $GLOBALS['webmcp_test_active_plugins'] = array('woocommerce/woocommerce.php');
    expect(webmcp_canary_suggested_site_type() === 'ec', 'WooCommerce suggests Online shop');
    expect(webmcp_canary_site_type() === 'local', 'but the type stays local until it is saved');
    ob_start(); webmcp_canary_site_type_field(); $field = ob_get_clean();
    expect(strpos($field, 'value="ec" selected') !== false, 'the settings field preselects the suggestion');
    expect(strpos($field, 'WooCommerce is active, so Online shop is suggested') !== false, 'and says why');

    // Online shop: OnlineStore, no hours/geo, return policy link, OfferCatalog.
    $GLOBALS['webmcp_test_product_terms'] = array(21 => array('Tea'));
    $GLOBALS['webmcp_test_products'] = array(
        new WebmcpTestProduct(array('id' => 21, 'name' => 'Sencha', 'url' => 'https://example.test/p/sencha', 'sku' => 'S1', 'price' => '1200', 'in_stock' => true)),
        new WebmcpTestProduct(array('id' => 22, 'name' => 'Gift box', 'url' => 'https://example.test/p/gift', 'price' => '', 'in_stock' => false)),
    );
    $ec = array_merge($base, array('site_type' => 'ec', 'return_policy_url' => 'https://example.test/returns', 'shipping_policy_url' => 'https://example.test/shipping'));
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $ec;
    $bundle = webmcp_canary_own_schema_bundle();
    $org = $bundle['core'][0];
    expect($org['@type'] === 'OnlineStore', 'an online shop is an OnlineStore');
    foreach (array('openingHours', 'openingHoursSpecification', 'geo', 'priceRange') as $gone) {
        expect(!isset($org[$gone]), "an online shop publishes no {$gone}");
    }
    expect(isset($org['address']) && isset($org['telephone']), 'an address and phone it has are still real facts and kept');
    expect(($org['hasMerchantReturnPolicy']['merchantReturnLink'] ?? '') === 'https://example.test/returns', 'the return policy page is linked');
    $catalog_nodes = array_values(array_filter($bundle['extra'], function ($node) { return ($node['@type'] ?? '') === 'OfferCatalog'; }));
    expect(count($catalog_nodes) === 1 && ($org['hasOfferCatalog']['@id'] ?? '') === $catalog_nodes[0]['@id'], 'the front page carries the catalogue, referenced by the store');
    $items = $catalog_nodes[0]['itemListElement'];
    expect($items[0]['offers']['price'] === '1200' && $items[0]['offers']['priceCurrency'] === 'JPY' && $items[0]['offers']['availability'] === 'https://schema.org/InStock', 'a product carries price, currency and availability');
    expect(!isset($items[1]['offers']), 'a product without a price gets no Offer');
    expect(!isset($items[0]['aggregateRating']) && !isset($items[0]['brand']), 'no rating or brand is invented');
    $rated = webmcp_canary_product_schema_node(array('name' => 'X', 'price' => '1', 'currency' => 'jpy', 'in_stock' => null, 'rating_value' => 4.5, 'review_count' => 3, 'brand' => 'Acme'));
    expect($rated['aggregateRating']['reviewCount'] === 3 && $rated['brand']['name'] === 'Acme' && !isset($rated['offers']['availability']), 'a real rating and brand are published; unknown stock is not');
    expect(!isset(webmcp_canary_product_schema_node(array('name' => 'Y', 'rating_value' => 4.5, 'review_count' => 0))['aggregateRating']), 'a rating with no reviews behind it is not');
    $GLOBALS['webmcp_test_front_page'] = false;
    expect(empty(array_filter(webmcp_canary_own_schema_bundle()['extra'], function ($node) { return ($node['@type'] ?? '') === 'OfferCatalog'; })), 'the catalogue is on the front page only');
    $GLOBALS['webmcp_test_front_page'] = true;
    $ec_llms = webmcp_canary_build_local_llms_txt();
    expect(strpos($ec_llms, '- Returns: https://example.test/returns') !== false && strpos($ec_llms, '- Shipping: https://example.test/shipping') !== false, 'llms.txt lists the shop policies');
    expect(strpos($ec_llms, 'Hours:') === false, 'and no opening hours');
    $payload = webmcp_canary_catalog_payload();
    $roles = array_values(array_filter(array_map(function ($page) { return $page['role'] ?? null; }, $payload['pages'])));
    expect($roles === array('return_policy', 'shipping_policy'), 'the policy pages are synced with their role');

    // B2B: Organization, Service / SoftwareApplication from the entered services.
    $GLOBALS['webmcp_test_active_plugins'] = array();
    $GLOBALS['webmcp_test_products'] = array();
    $b2b = array_merge($base, array('site_type' => 'b2b', 'business_type' => '', 'pricing_url' => 'https://example.test/pricing'));
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $b2b;
    webmcp_canary_save_service_entries(array(
        array('name' => 'Payroll Cloud', 'description' => 'Payroll for SMEs.', 'url' => 'https://example.test/payroll', 'kind' => 'software', 'category' => 'BusinessApplication', 'price' => '3000', 'currency' => 'jpy'),
        array('name' => 'Implementation support', 'description' => '', 'category' => 'Consulting'),
    ));
    $bundle = webmcp_canary_own_schema_bundle();
    expect($bundle['core'][0]['@type'] === 'Organization', 'a B2B site is an Organization even with an address');
    expect(!isset($bundle['core'][0]['openingHoursSpecification']) && !isset($bundle['core'][0]['openingHours']), 'with no opening hours');
    $services = array_values(array_filter($bundle['extra'], function ($node) { return in_array($node['@type'] ?? '', array('Service', 'SoftwareApplication'), true); }));
    expect(count($services) === 2 && $services[0]['@type'] === 'SoftwareApplication' && $services[1]['@type'] === 'Service', 'software is a SoftwareApplication, the rest Services');
    expect($services[0]['description'] === 'Payroll for SMEs.' && $services[0]['url'] === 'https://example.test/payroll' && $services[0]['applicationCategory'] === 'BusinessApplication', 'with the description, page and category entered');
    expect(!isset($services[1]['description']), 'an empty description is not published');
    $b2b_llms = webmcp_canary_build_local_llms_txt();
    expect(strpos($b2b_llms, '- Pricing: https://example.test/pricing') !== false && strpos($b2b_llms, 'Payroll for SMEs.') !== false, 'llms.txt lists pricing and the service descriptions');
    $payload = webmcp_canary_catalog_payload();
    expect($payload['services'][0]['kind'] === 'software' && $payload['services'][1]['kind'] === 'service' && $payload['services'][0]['description'] === 'Payroll for SMEs.', 'the services sync with kind and description');
    update_option(WEBMCP_CANARY_SERVICES_OPTION, array());

    // The type is sent with the profile only when chosen; a remote choice is adopted.
    expect(webmcp_canary_sanitize_site_type_settings(array('site_type' => 'spaceship'), array())['site_type'] === '', 'an unknown type is not stored');
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($base, array('site_type' => ''));
    webmcp_canary_apply_remote_profile(array('profile' => array(), 'site_type' => 'local'));
    expect(webmcp_canary_settings()['site_type'] === '', 'the service default "local" does not count as a choice');
    webmcp_canary_apply_remote_profile(array('profile' => array(), 'site_type' => 'b2b'));
    expect(webmcp_canary_settings()['site_type'] === 'b2b', 'a type chosen in the dashboard reaches wp-admin');

    // The wizard: the two new cards set the site type; every other card is local.
    $wizard_reset();
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $base;
    webmcp_canary_wizard_process(array('_wpnonce' => md5('webmcp_canary_wizard'), 'step' => '1', 'site_type' => 'ec'));
    expect(webmcp_canary_settings()['site_type'] === 'ec' && webmcp_canary_settings()['business_type'] === 'OnlineStore', 'the Online shop card sets ec and OnlineStore');
    expect(webmcp_canary_wizard_current_site_type() === 'ec', 'and shows as chosen');
    expect(!array_key_exists('business_hours', webmcp_canary_wizard_business_fields()) && !array_key_exists('business_address', webmcp_canary_wizard_business_fields()), 'step 2 asks an online shop for no address or hours');
    webmcp_canary_wizard_process(array('_wpnonce' => md5('webmcp_canary_wizard'), 'step' => '1', 'site_type' => 'b2b'));
    expect(webmcp_canary_settings()['site_type'] === 'b2b' && webmcp_canary_settings()['business_type'] === 'Organization', 'the B2B card sets b2b and Organization');
    webmcp_canary_wizard_process(array('_wpnonce' => md5('webmcp_canary_wizard'), 'step' => '1', 'site_type' => 'beauty'));
    expect(webmcp_canary_settings()['site_type'] === 'local' && webmcp_canary_settings()['business_type'] === 'BeautySalon', 'a local card makes it local again');
    expect(array_key_exists('business_hours', webmcp_canary_wizard_business_fields()), 'and step 2 asks for opening hours again');
    $GLOBALS['webmcp_test_active_plugins'] = array('woocommerce/woocommerce.php');
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge($base, array('site_type' => '', 'business_type' => ''));
    ob_start(); webmcp_canary_wizard_render_step_1(webmcp_canary_settings()); $step1_wc = ob_get_clean();
    expect(strpos($step1_wc, 'value="ec" checked') !== false && strpos($step1_wc, 'WooCommerce is active, so Online shop is suggested') !== false, 'with WooCommerce the wizard suggests Online shop');
    $GLOBALS['webmcp_test_active_plugins'] = array();
    $wizard_reset();
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $base;
}

/* ------------------------------------------------------------------ *
 * Learning events (includes/learning-events.php, docs/learning.md):
 * what changed and when, as flags, field names and counts - never values;
 * nothing before the site is connected; queued while offline; sent in
 * batches with ids; acknowledged ids leave the queue.
 * ------------------------------------------------------------------ */
{
    $reset = function ($settings) {
        delete_option(WEBMCP_CANARY_LEARNING_QUEUE_OPTION);
        delete_option(WEBMCP_CANARY_LEARNING_STATE_OPTION);
        delete_option(WEBMCP_CANARY_FAQ_OPTION);
        delete_option(WEBMCP_CANARY_SERVICES_OPTION);
        delete_option(WEBMCP_CANARY_CONSENT_OPTION);
        $GLOBALS['webmcp_test_active_plugins'] = array();
        $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $settings;
    };
    $secret_address = '東京都渋谷区神南1-2-3 秘密ビル';
    $secret_phone = '03-9999-1234';
    $base = array_merge(webmcp_canary_default_settings(), array(
        'enabled' => '1', 'serve_llms_txt' => '1', 'serve_schema' => '1', 'allow_ai_crawlers' => '1',
        'business_name' => 'Cafe Learn', 'business_address' => '', 'business_phone' => $secret_phone,
        'business_hours' => 'Mon-Fri 9:00-18:00', 'business_type' => 'CafeOrCoffeeShop',
    ));

    // 1. Not connected: nothing is recorded, nothing is sent.
    $reset($base);
    $GLOBALS['webmcp_test_remote_log'] = array();
    expect(!webmcp_canary_learning_enabled(), 'learning events are off until the site is connected');
    expect(webmcp_canary_learning_observe() === array(), 'an unconnected site records nothing');
    expect(webmcp_canary_learning_queue() === array(), 'and queues nothing');
    expect(webmcp_canary_learning_flush() === 0 && empty($GLOBALS['webmcp_test_remote_log']), 'and sends nothing');
    // A site ID without the write token (not paired) is not enough either.
    $reset(array_merge($base, array('site_id' => 'learn01', 'profile_token' => '')));
    expect(!webmcp_canary_learning_enabled() && webmcp_canary_learning_observe() === array(), 'no token, no events');

    // 2. Connected (pairing records consent): the first observation is a snapshot.
    $connected = array_merge($base, array('site_id' => 'learn01', 'site_key' => 'nrv_learn', 'profile_token' => 'nrvp_learn'));
    $reset($connected);
    webmcp_canary_record_consent('pairing');
    update_option(WEBMCP_CANARY_INSTALLED_OPTION, time() - 3 * DAY_IN_SECONDS);
    expect(webmcp_canary_learning_enabled(), 'connected and agreed: events are on');
    expect(webmcp_canary_learning_observe() === array('snapshot'), 'the first observation queues a snapshot');
    $queue = webmcp_canary_learning_queue();
    expect(count($queue) === 1 && $queue[0]['type'] === 'snapshot', 'one snapshot');
    $snap = $queue[0]['data'];
    expect($snap['switches']['llms_txt'] === true && $snap['switches']['schema'] === true && $snap['switches']['browser_tag'] === false, 'with the output switches');
    expect(in_array('phone', $snap['fields_filled'], true) && !in_array('address', $snap['fields_filled'], true), 'and which fields are filled (names)');
    expect($snap['facts_complete'] === false && $snap['installed_days'] === 3 && $snap['plugin_version'] === WEBMCP_CANARY_VERSION, 'facts incomplete, a 3-day-old install, the version');
    expect($snap['seo_plugins'] === array('none') && $snap['counts'] === array('faq' => 0, 'services' => 0, 'products' => 0), 'no SEO plugin, no FAQ/services/products');
    expect(preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/', $queue[0]['id']) === 1, 'each event has its own id');
    expect(preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $queue[0]['at']) === 1, 'and a UTC timestamp');
    expect(webmcp_canary_learning_observe() === array(), 'nothing changed, nothing queued');

    // 3. Changes: a switch, a field, the FAQ, an SEO plugin, the site type.
    $changed = array_merge($connected, array('serve_llms_txt' => '0', 'business_address' => $secret_address, 'site_type' => 'local'));
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $changed;
    update_option(WEBMCP_CANARY_FAQ_OPTION, array(array('q' => 'Do you have Wi-Fi?', 'a' => 'Yes, free Wi-Fi.')));
    $GLOBALS['webmcp_test_active_plugins'] = array('wordpress-seo/wp-seo.php');
    $types = webmcp_canary_learning_observe();
    sort($types);
    expect($types === array('counts_changed', 'fields_changed', 'output_toggled', 'seo_plugin_changed', 'site_type_changed'), 'each change is its own event: ' . implode(',', $types));
    $by_type = array();
    foreach (webmcp_canary_learning_queue() as $event) { $by_type[$event['type']] = $event['data']; }
    expect($by_type['output_toggled'] === array('switch' => 'llms_txt', 'on' => false), 'llms.txt switched off');
    expect($by_type['fields_changed']['filled'] === array('address') && $by_type['fields_changed']['became_complete'] === true, 'the address was filled in, which completed the facts');
    expect($by_type['counts_changed'] === array('faq' => array('from' => 0, 'to' => 1)), 'one FAQ entry added');
    expect($by_type['seo_plugin_changed'] === array('from' => array('none'), 'to' => array('yoast')), 'Yoast detected');
    expect($by_type['site_type_changed'] === array('from' => 'unset', 'to' => 'local'), 'the site type chosen');
    // No personal data: no value anyone typed is in the queue.
    $wire = wp_json_encode(webmcp_canary_learning_queue(), JSON_UNESCAPED_UNICODE);
    foreach (array($secret_address, '渋谷', $secret_phone, '9999', 'Cafe Learn', 'Wi-Fi', 'Mon-Fri', 'owner@example.test') as $needle) {
        expect(strpos($wire, $needle) === false, "no value leaves the site in an event ({$needle})");
    }

    // 4. A one-click fix: what was applied, with the switch it turned on.
    $before = count(webmcp_canary_learning_queue());
    $fixed = webmcp_canary_apply_aeo_fix(webmcp_canary_settings(), 'llms');
    $GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = $fixed;
    webmcp_canary_learning_record_fix('llms', 'one_click');
    $tail = array_slice(webmcp_canary_learning_queue(), $before);
    expect($tail[0]['type'] === 'fix_applied' && $tail[0]['data'] === array('check' => 'llms', 'via' => 'one_click', 'actions' => array()), 'the fix is recorded');
    expect($tail[1]['type'] === 'output_toggled' && $tail[1]['data'] === array('switch' => 'llms_txt', 'on' => true), 'with the switch it turned on');
    // An update: the version change is noticed by the next observation.
    $stored_state = get_option(WEBMCP_CANARY_LEARNING_STATE_OPTION);
    $stored_state['state']['plugin_version'] = '0.8.1';
    update_option(WEBMCP_CANARY_LEARNING_STATE_OPTION, $stored_state);
    expect(webmcp_canary_learning_observe() === array('plugin_version_changed'), 'a plugin update is an event');

    // 5. Offline: the queue stays, nothing is lost.
    $queued = webmcp_canary_learning_queue();
    $GLOBALS['webmcp_test_remote'] = new WP_Error('offline', 'offline');
    $GLOBALS['webmcp_test_remote_log'] = array();
    $offline = webmcp_canary_learning_flush();
    expect(is_wp_error($offline), 'an unreachable service is an error');
    expect(webmcp_canary_learning_queue() === $queued, 'and the queue is kept for the next sync');
    $request = $GLOBALS['webmcp_test_remote_log'][0];
    expect(strpos($request['url'], '/api/sites/learn01/events') !== false, 'sent to the events endpoint of this site');
    expect($request['args']['headers']['authorization'] === 'Bearer nrvp_learn', 'with the profile token, like the profile sync');
    $sent_body = json_decode($request['args']['body'], true);
    expect(count($sent_body['events']) === count($queued) && $sent_body['events'][0]['id'] === $queued[0]['id'], 'the batch carries the queued events with their ids');

    // 6. A partial acknowledgement removes only what was acknowledged (stored or refused).
    $ids = array_map(function ($event) { return $event['id']; }, $queued);
    $GLOBALS['webmcp_test_remote'] = array('status' => 200, 'body' => wp_json_encode(array('ok' => true, 'accepted' => array($ids[0], $ids[1]), 'rejected' => array(array('id' => $ids[2], 'reason' => 'unknown_type')))));
    webmcp_canary_learning_flush(1);
    $left = array_map(function ($event) { return $event['id']; }, webmcp_canary_learning_queue());
    expect($left === array_slice($ids, 3), 'acknowledged ids leave the queue; the rest stay');
    // A refusal (e.g. 503 before the migration) keeps them too.
    $GLOBALS['webmcp_test_remote'] = array('status' => 503, 'body' => '{"error":"migration_pending"}');
    expect(is_wp_error(webmcp_canary_learning_flush()) && count(webmcp_canary_learning_queue()) === count($left), 'a refused batch stays queued');
    // Everything acknowledged: the queue is empty.
    $GLOBALS['webmcp_test_remote'] = array('status' => 200, 'body' => wp_json_encode(array('ok' => true, 'accepted' => $left, 'rejected' => array())));
    expect(webmcp_canary_learning_flush() === count($left) && webmcp_canary_learning_queue() === array(), 'all sent, queue empty');

    // 7. The queue is bounded: the oldest events go first.
    for ($i = 0; $i < WEBMCP_CANARY_LEARNING_QUEUE_MAX + 15; $i++) {
        webmcp_canary_learning_record('output_toggled', array('switch' => 'schema', 'on' => ($i % 2) === 0));
    }
    expect(count(webmcp_canary_learning_queue()) === WEBMCP_CANARY_LEARNING_QUEUE_MAX, 'at most the cap is kept offline');
    $ids = array_map(function ($event) { return $event['id']; }, webmcp_canary_learning_queue());
    expect(count(array_unique($ids)) === count($ids), 'every id is unique');

    // 8. The hooks: settings writes and the FAQ/service lists observe; the twice-daily sync sends.
    expect(in_array('webmcp_canary_learning_settings_changed', $GLOBALS['webmcp_test_hooks']['update_option_' . WEBMCP_CANARY_OPTION], true), 'every settings write is observed');
    expect(in_array('webmcp_canary_learning_settings_changed', $GLOBALS['webmcp_test_hooks']['update_option_' . WEBMCP_CANARY_FAQ_OPTION], true), 'and the FAQ list');
    expect(in_array('webmcp_canary_learning_cron', $GLOBALS['webmcp_test_hooks'][WEBMCP_CANARY_RULESET_CRON], true), 'the twice-daily sync sends them');
    // Disclosed: the privacy policy suggestion says it.
    expect(strpos(webmcp_canary_privacy_policy_text(), 'a record of changes to its own settings') !== false, 'the privacy policy text discloses the change record');
    $readme = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/webmcp-canary/readme.txt');
    expect(strpos($readme, '/api/sites/{id}/events') !== false, 'the readme lists the events endpoint under External services');

    delete_option(WEBMCP_CANARY_LEARNING_QUEUE_OPTION);
    delete_option(WEBMCP_CANARY_LEARNING_STATE_OPTION);
    delete_option(WEBMCP_CANARY_FAQ_OPTION);
    delete_option(WEBMCP_CANARY_CONSENT_OPTION);
    $GLOBALS['webmcp_test_active_plugins'] = array();
    unset($GLOBALS['webmcp_test_remote']);
}

echo "WordPress AEO admin tests passed\n";
