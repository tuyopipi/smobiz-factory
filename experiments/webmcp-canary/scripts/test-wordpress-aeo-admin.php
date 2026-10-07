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
function wp_remote_post($url, $args) { $GLOBALS['webmcp_test_last_remote'] = array('url' => $url, 'args' => $args); return $GLOBALS['webmcp_test_remote'] ?? new WP_Error('offline', 'offline'); }
function wp_remote_retrieve_response_code($response) { return $response['status'] ?? 0; }
function wp_remote_retrieve_body($response) { return $response['body'] ?? ''; }
function is_plugin_active($plugin) { return in_array($plugin, $GLOBALS['webmcp_test_active_plugins'], true); }
function update_option($key, $value) { $GLOBALS['webmcp_test_options'][$key] = $value; return true; }
function wp_strip_all_tags($value) { return strip_tags((string) $value); }
function esc_textarea($value) { return htmlspecialchars((string) $value, ENT_QUOTES); }
function strip_shortcodes($value) { return preg_replace('/\[[^\]]+\]/', '', (string) $value); }
function get_posts() { return $GLOBALS['webmcp_test_posts']; }

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
function is_singular() { return false; }
function is_front_page() { return true; }
function is_home() { return false; }
function home_url($path = '') { return 'https://example.test' . ($path === '/' ? '/' : $path); }
function get_bloginfo($field) {
    $values = array('name' => 'Example Store', 'description' => 'Example description', 'language' => 'ja', 'charset' => 'UTF-8');
    return $values[$field] ?? '';
}
function get_theme_mod() { return false; }
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
function current_user_can() { return true; }
function admin_url($path = '') { return 'https://example.test/wp-admin/' . ltrim($path, '/'); }
function esc_html($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
function esc_html__($text) { return esc_html($text); }
function esc_attr($value) { return esc_html($value); }
function esc_url($value) { return esc_html($value); }
function wp_nonce_url($url, $action) { return $url . '&_wpnonce=' . md5($action); }
function wp_verify_nonce($nonce, $action) { return $nonce === md5($action); }
function wp_unslash($value) { return $value; }
function wp_next_scheduled() { return false; }
function wp_schedule_event($timestamp, $recurrence, $hook) { $GLOBALS['webmcp_test_scheduled'][] = $hook; return true; }
function wp_clear_scheduled_hook($hook) { $GLOBALS['webmcp_test_cleared'][] = $hook; return 1; }
function plugins_url($path = '', $plugin = '') { return 'https://example.test/wp-content/plugins/webmcp-canary/' . ltrim($path, '/'); }
function wp_date($format, $timestamp = null) { return gmdate($format, $timestamp ?? time()); }

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
expect($wp_autofilled['business_email'] === 'owner@example.test', 'WordPress administrator email fills an empty field');

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
expect(strpos($business_output, '"telephone":"03-1234-5678"') !== false, 'autofilled phone is included in server schema');
expect(strpos($business_output, '"openingHours":"09:00-18:00"') !== false, 'autofilled hours are included in server schema');

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
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['site_key'] = 'nrv_site';
$GLOBALS['webmcp_test_remote_get'] = array('api/llms.txt' => array('status' => 200, 'body' => "# Central\n"));
expect(webmcp_canary_llms_txt_body() === "# Central\n", 'a registered site prefers the central llms.txt');
$GLOBALS['webmcp_test_remote_get'] = array();
expect(webmcp_canary_llms_txt_body() === $local_llms, 'service failure still serves the local llms.txt');
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
expect(strpos($source, "add_action('wp_head', 'webmcp_canary_output_server_schema', 5)") !== false, 'server schema remains registered');

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
expect(strpos($source, 'from 14,800 JPY/month, beta') !== false, 'the upper plan price survives on the measurement screen');

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

expect(webmcp_canary_sov_view(array('configured' => false))['state'] === 'unconfigured', 'an unconfigured engine is reported as such');
expect(webmcp_canary_sov_view(array('configured' => true, 'latest' => null))['state'] === 'pending', 'a pro site with no run yet is pending');
expect(webmcp_canary_sov_view(array('configured' => true, 'latest' => array('status' => 'measured', 'appearance_rate' => null)))['state'] === 'no_answers', 'a run with no answers reports no rate');
expect(webmcp_canary_sov_view(null)['state'] === 'unavailable', 'a missing payload is unavailable, not zero');

expect(webmcp_canary_sov_percent(0.6) === '60%', 'rates render as percentages');
expect(webmcp_canary_sov_percent(null) === '—', 'a missing rate renders as an em dash, not 0%');
expect(webmcp_canary_sov_percent(0) === '0%', 'a measured zero still renders as 0%');

expect(webmcp_canary_sov_sparkline(array()) === '', 'no trend yields no chart');
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
expect(strpos($source, 'from 14,800 JPY/month, beta') !== false, 'the measurement upsell states the upper plan price and beta');
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
$emitter_start = strpos($source, 'function webmcp_canary_output_server_schema()');
expect($emitter_start !== false, 'the schema emitter was found');
$emitter = substr($source, $emitter_start);
$next_hook = strpos($emitter, "\nadd_action(");
$emitter = $next_hook === false ? $emitter : substr($emitter, 0, $next_hook);
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
expect($readme_lines[0] === '=== Nurevo AEO ===', 'readme declares the Nurevo AEO plugin name');

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

// The upsell link used to be a hardcoded https://nurevo.jp/dashboard, so a
// canary or local install sent the operator to production. Every dashboard URL
// now comes from the configured service instead.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array(
    'tag_url' => 'https://nurevo.jp/tag.js',
    'site_id' => 'abc123def456',
);
expect(webmcp_canary_dashboard_url() === 'https://nurevo.jp/dashboard', 'the dashboard URL comes from the service base');
expect(
    webmcp_canary_dashboard_url('abc123def456') === 'https://nurevo.jp/dashboard#site:abc123def456',
    'a site ID becomes a deep link'
);

// A canary or local service must be followed, not overridden by the host we
// happen to ship as the default.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['tag_url'] = 'http://localhost:8799/tag.js';
expect(
    webmcp_canary_dashboard_url('abc123def456') === 'http://localhost:8799/dashboard#site:abc123def456',
    'the deep link follows a local service'
);

// No service configured means no link at all.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION]['tag_url'] = '';
expect(webmcp_canary_dashboard_url() === '', 'an unconfigured service yields no URL');
expect(webmcp_canary_dashboard_url('abc123def456') === '', 'and no deep link');

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
expect($rules['FAQPage']['publishers'] === array('seo'), 'FAQPage is published by the SEO plugins');

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

// Published on the front page by default, and on a chosen page when set.
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
    'enabled' => '1', 'serve_schema' => '1', 'business_name' => 'Example', 'faq_page_id' => '0',
));
$GLOBALS['webmcp_test_options']['blog_public'] = 1;
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

// The input exists to type into, and the page selector with it.
expect(strpos($source, 'name="%2$s[faq][%3$d][q]"') !== false, 'there is a question input');
expect(strpos($source, 'name="%2$s[faq_page_id]"') !== false, 'and a page selector');
expect(strpos($source, 'webmcp_canary_faq_field') !== false, 'registered as a settings field');

// More pairs than the cap are not stored.
$many = array();
for ($i = 0; $i < WEBMCP_CANARY_MAX_FAQ + 5; $i++) { $many[] = array('q' => "q{$i}", 'a' => "a{$i}"); }
expect(count(webmcp_canary_save_faq_entries($many)) === WEBMCP_CANARY_MAX_FAQ, 'the cap is a cap');
delete_option(WEBMCP_CANARY_FAQ_OPTION);

echo "WordPress AEO admin tests passed\n";
