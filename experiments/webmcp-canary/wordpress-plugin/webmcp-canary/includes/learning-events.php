<?php
/**
 * Learning events: a compact record of what changed on this site, and when.
 *
 * The Nurevo service uses it, aggregated across sites, to learn which changes
 * make a business appear in AI answers (see readme.txt, "External services").
 * Each event says WHICH setting changed, never a value someone typed:
 *
 *   snapshot              the state at the first observation once the site is
 *                         connected: which outputs are on, which business
 *                         fields are filled in (names only), the site type,
 *                         the SEO plugin, the plugin version and the number
 *                         of FAQ entries, services and products.
 *   output_toggled        an output switch was turned on or off.
 *   ai_training_changed   the AI training crawler choice changed.
 *   fields_changed        business fields were filled in or cleared (names).
 *   site_type_changed     the site type changed.
 *   fix_applied           a one-click fix or a suggested change was applied.
 *   plugin_version_changed, seo_plugin_changed, counts_changed.
 *
 * Nothing is sent before the site is connected and the owner has agreed, the
 * same rule as the profile and catalogue sync: until then nothing is even
 * recorded. Events wait in an option (at most WEBMCP_CANARY_LEARNING_QUEUE_MAX,
 * oldest dropped first) and go to the service with the twice-daily sync, in
 * batches, each with its own id, so a batch re-sent after a lost reply is
 * stored once. While the service cannot be reached they simply stay queued.
 *
 * @package WebMCP_Canary
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('WEBMCP_CANARY_LEARNING_QUEUE_OPTION')) {
    define('WEBMCP_CANARY_LEARNING_QUEUE_OPTION', 'webmcp_canary_learning_queue');
}
if (!defined('WEBMCP_CANARY_LEARNING_STATE_OPTION')) {
    define('WEBMCP_CANARY_LEARNING_STATE_OPTION', 'webmcp_canary_learning_state');
}
if (!defined('WEBMCP_CANARY_INSTALLED_OPTION')) {
    define('WEBMCP_CANARY_INSTALLED_OPTION', 'webmcp_canary_installed_at');
}
if (!defined('WEBMCP_CANARY_LEARNING_QUEUE_MAX')) {
    define('WEBMCP_CANARY_LEARNING_QUEUE_MAX', 200);
}
if (!defined('WEBMCP_CANARY_LEARNING_BATCH')) {
    define('WEBMCP_CANARY_LEARNING_BATCH', 50);
}

/** Whether events may be recorded and sent: connected (site ID and profile token) and agreed. */
function webmcp_canary_learning_enabled($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    return webmcp_canary_profile_sync_enabled($settings) && webmcp_canary_has_consent($settings);
}

/** When the plugin was first seen running here (set on activation, or on the first observation). */
function webmcp_canary_installed_at() {
    $at = (int) get_option(WEBMCP_CANARY_INSTALLED_OPTION, 0);
    if ($at <= 0) {
        $at = time();
        update_option(WEBMCP_CANARY_INSTALLED_OPTION, $at, false);
    }
    return $at;
}

/** The SEO plugins that are active, as short ids. */
function webmcp_canary_learning_seo_plugins() {
    $ids = array(
        'wordpress-seo/wp-seo.php' => 'yoast',
        'seo-by-rank-math/rank-math.php' => 'rankmath',
        'all-in-one-seo-pack/all_in_one_seo_pack.php' => 'aioseo',
        'slim-seo/slim-seo.php' => 'slimseo',
        'wp-seopress/seopress.php' => 'seopress',
        'autodescription/autodescription.php' => 'tsf',
    );
    $active = array();
    foreach (array_keys(webmcp_canary_detect_active_seo_plugins()) as $file) {
        if (isset($ids[$file])) {
            $active[] = $ids[$file];
        }
    }
    sort($active);
    return $active ? $active : array('none');
}

/**
 * What the events describe, read from the settings. Flags, names and counts
 * only: no field value ever leaves this function.
 */
function webmcp_canary_learning_state($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $on = function ($key) use ($settings) {
        return isset($settings[$key]) && (string) $settings[$key] === '1';
    };
    $filled = array();
    foreach (webmcp_canary_profile_field_map() as $field => $option_key) {
        if (trim((string) ($settings[$option_key] ?? '')) !== '') {
            $filled[] = $field;
        }
    }
    $facts = array('name', 'address', 'phone', 'hours', 'business_type_schema');
    $catalog = get_option(WEBMCP_CANARY_CATALOG_OPTION, null);
    $site_type = (string) ($settings['site_type'] ?? '');
    return array(
        'switches' => array(
            'enabled' => $on('enabled'),
            'schema' => $on('serve_schema'),
            'llms_txt' => $on('serve_llms_txt'),
            'crawlers' => $on('allow_ai_crawlers'),
            'browser_tag' => $on('load_tag'),
            'schema_dedupe' => $on('avoid_schema_duplicates'),
        ),
        'ai_training' => in_array($settings['ai_training'] ?? '', array('default', 'allow', 'block'), true) ? $settings['ai_training'] : 'default',
        'fields_filled' => $filled,
        'facts_complete' => count(array_diff($facts, $filled)) === 0,
        'site_type' => in_array($site_type, array('local', 'ec', 'b2b'), true) ? $site_type : 'unset',
        'seo_plugins' => webmcp_canary_learning_seo_plugins(),
        'plugin_version' => WEBMCP_CANARY_VERSION,
        'counts' => array(
            'faq' => count(webmcp_canary_faq_entries()),
            'services' => count(webmcp_canary_service_entries()),
            'products' => is_array($catalog) && isset($catalog['products']) && is_array($catalog['products']) ? count($catalog['products']) : 0,
        ),
        'woocommerce' => webmcp_canary_woocommerce_active(),
    );
}

/** A random event id (uuid v4 shape). */
function webmcp_canary_learning_event_id() {
    if (function_exists('wp_generate_uuid4')) {
        return wp_generate_uuid4();
    }
    $hex = bin2hex(random_bytes(16));
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-4' . substr($hex, 13, 3) . '-a' . substr($hex, 17, 3) . '-' . substr($hex, 20, 12);
}

function webmcp_canary_learning_queue() {
    $queue = get_option(WEBMCP_CANARY_LEARNING_QUEUE_OPTION, array());
    return is_array($queue) ? array_values($queue) : array();
}

/** Queue one event. Never sends anything itself. */
function webmcp_canary_learning_record($type, $data = array(), $at = null) {
    if (!webmcp_canary_learning_enabled()) {
        return false;
    }
    $queue = webmcp_canary_learning_queue();
    $queue[] = array(
        'id' => webmcp_canary_learning_event_id(),
        'type' => (string) $type,
        'at' => gmdate('Y-m-d\TH:i:s\Z', $at === null ? time() : (int) $at),
        'data' => is_array($data) ? $data : array(),
    );
    if (count($queue) > WEBMCP_CANARY_LEARNING_QUEUE_MAX) {
        $queue = array_slice($queue, -WEBMCP_CANARY_LEARNING_QUEUE_MAX);
    }
    update_option(WEBMCP_CANARY_LEARNING_QUEUE_OPTION, $queue, false);
    return true;
}

/**
 * Compare the current state with the last one seen and queue an event for
 * each difference. The first observation once connected queues a snapshot.
 * Local only: no request is made here.
 */
function webmcp_canary_learning_observe($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    if (!webmcp_canary_learning_enabled($settings)) {
        return array();
    }
    $installed_at = webmcp_canary_installed_at();
    $now = webmcp_canary_learning_state($settings);
    $stored = get_option(WEBMCP_CANARY_LEARNING_STATE_OPTION, array());
    $before = is_array($stored) && isset($stored['state']) && is_array($stored['state']) ? $stored['state'] : null;
    $queued = array();
    if ($before === null) {
        $snapshot = $now;
        $snapshot['installed_days'] = max(0, (int) floor((time() - $installed_at) / DAY_IN_SECONDS));
        webmcp_canary_learning_record('snapshot', $snapshot);
        $queued[] = 'snapshot';
    } else {
        foreach ($now['switches'] as $name => $value) {
            if (!array_key_exists($name, $before['switches'] ?? array()) || $before['switches'][$name] !== $value) {
                webmcp_canary_learning_record('output_toggled', array('switch' => $name, 'on' => $value));
                $queued[] = 'output_toggled';
            }
        }
        if (($before['ai_training'] ?? 'default') !== $now['ai_training']) {
            webmcp_canary_learning_record('ai_training_changed', array('from' => $before['ai_training'] ?? 'default', 'to' => $now['ai_training']));
            $queued[] = 'ai_training_changed';
        }
        $was = isset($before['fields_filled']) && is_array($before['fields_filled']) ? $before['fields_filled'] : array();
        $filled = array_values(array_diff($now['fields_filled'], $was));
        $cleared = array_values(array_diff($was, $now['fields_filled']));
        if ($filled || $cleared) {
            webmcp_canary_learning_record('fields_changed', array(
                'filled' => $filled,
                'cleared' => $cleared,
                'facts_complete' => $now['facts_complete'],
                'became_complete' => $now['facts_complete'] && empty($before['facts_complete']),
            ));
            $queued[] = 'fields_changed';
        }
        if (($before['site_type'] ?? 'unset') !== $now['site_type']) {
            webmcp_canary_learning_record('site_type_changed', array('from' => $before['site_type'] ?? 'unset', 'to' => $now['site_type']));
            $queued[] = 'site_type_changed';
        }
        if (($before['plugin_version'] ?? '') !== $now['plugin_version']) {
            webmcp_canary_learning_record('plugin_version_changed', array('from' => (string) ($before['plugin_version'] ?? ''), 'to' => $now['plugin_version']));
            $queued[] = 'plugin_version_changed';
        }
        if (($before['seo_plugins'] ?? array()) !== $now['seo_plugins']) {
            webmcp_canary_learning_record('seo_plugin_changed', array('from' => $before['seo_plugins'] ?? array(), 'to' => $now['seo_plugins']));
            $queued[] = 'seo_plugin_changed';
        }
        $changes = array();
        foreach ($now['counts'] as $key => $value) {
            $old = (int) ($before['counts'][$key] ?? 0);
            if ($old !== $value) {
                $changes[$key] = array('from' => $old, 'to' => $value);
            }
        }
        if ($changes) {
            webmcp_canary_learning_record('counts_changed', $changes);
            $queued[] = 'counts_changed';
        }
    }
    update_option(WEBMCP_CANARY_LEARNING_STATE_OPTION, array('state' => $now, 'observed_at' => time()), false);
    return $queued;
}

/** A one-click fix or an applied suggestion: what was applied (an id), recorded with the state change it made. */
function webmcp_canary_learning_record_fix($check, $via = 'one_click', $actions = array()) {
    if (!webmcp_canary_learning_enabled()) {
        return false;
    }
    $check = preg_replace('/[^a-z0-9_.-]/', '', strtolower((string) $check));
    $clean = array();
    foreach ((array) $actions as $action) {
        $action = preg_replace('/[^a-z0-9_.-]/', '', strtolower((string) $action));
        if ($action !== '') {
            $clean[] = $action;
        }
    }
    webmcp_canary_learning_record('fix_applied', array('check' => $check !== '' ? $check : 'unknown', 'via' => $via === 'autofix' ? 'autofix' : 'one_click', 'actions' => array_slice($clean, 0, 10)));
    webmcp_canary_learning_observe();
    return true;
}

/**
 * Send queued events in batches with the profile token. Events the service
 * acknowledged (stored, or refused for good) leave the queue; on any failure
 * they stay for the next sync. Returns the number sent, or WP_Error.
 */
function webmcp_canary_learning_flush($max_batches = 4) {
    $settings = webmcp_canary_settings();
    if (!webmcp_canary_learning_enabled($settings)) {
        return 0;
    }
    $sent = 0;
    for ($batch = 0; $batch < $max_batches; $batch++) {
        $queue = webmcp_canary_learning_queue();
        if (!$queue) {
            break;
        }
        $chunk = array_slice($queue, 0, WEBMCP_CANARY_LEARNING_BATCH);
        $result = null;
        foreach (webmcp_canary_api_base_candidates() as $api_base) {
            $response = wp_remote_post(trailingslashit($api_base) . 'api/sites/' . rawurlencode($settings['site_id']) . '/events', array(
                'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
                'headers' => array(
                    'accept' => 'application/json',
                    'content-type' => 'application/json',
                    'authorization' => 'Bearer ' . $settings['profile_token'],
                ),
                'body' => wp_json_encode(array('events' => $chunk)),
            ));
            if (is_wp_error($response)) {
                $result = $response;
                continue;
            }
            $status = (int) wp_remote_retrieve_response_code($response);
            $body = json_decode(wp_remote_retrieve_body($response), true);
            $result = ($status >= 200 && $status < 300 && is_array($body))
                ? $body
                : new WP_Error('webmcp_learning_http_' . $status, 'refused');
            break;
        }
        if (!is_array($result)) {
            return $sent > 0 ? $sent : ($result instanceof WP_Error ? $result : new WP_Error('webmcp_learning_unreachable', 'unreachable'));
        }
        $done = array();
        foreach ((array) ($result['accepted'] ?? array()) as $id) {
            $done[(string) $id] = true;
        }
        foreach ((array) ($result['rejected'] ?? array()) as $row) {
            $id = is_array($row) ? ($row['id'] ?? '') : $row;
            $done[(string) $id] = true;
        }
        if (!$done) {
            break;
        }
        // Re-read: something may have been queued while the request was out.
        $remaining = array_values(array_filter(webmcp_canary_learning_queue(), function ($event) use ($done) {
            return !isset($done[(string) ($event['id'] ?? '')]);
        }));
        update_option(WEBMCP_CANARY_LEARNING_QUEUE_OPTION, $remaining, false);
        $sent += count($chunk);
    }
    return $sent;
}

/* Observation points: every settings write, and the FAQ / service lists. Local only. */
add_action('update_option_' . WEBMCP_CANARY_OPTION, 'webmcp_canary_learning_settings_changed', 30, 2);
add_action('update_option_' . WEBMCP_CANARY_FAQ_OPTION, 'webmcp_canary_learning_settings_changed', 30, 2);
add_action('update_option_' . WEBMCP_CANARY_SERVICES_OPTION, 'webmcp_canary_learning_settings_changed', 30, 2);
function webmcp_canary_learning_settings_changed($old_value = null, $value = null) {
    webmcp_canary_learning_observe();
}

/* The twice-daily sync: observe (versions, SEO plugins, products), then send. */
add_action(WEBMCP_CANARY_RULESET_CRON, 'webmcp_canary_learning_cron', 20);
function webmcp_canary_learning_cron() {
    webmcp_canary_learning_observe();
    webmcp_canary_learning_flush();
}
