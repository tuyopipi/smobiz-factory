<?php
/**
 * Plugin Name: Nurevo AEO
 * Plugin URI: https://nurevo.jp/
 * Description: Diagnoses AI readability (AEO) and publishes basic schema.org JSON-LD, llms.txt, and AI crawler rules server-side. Free to run, and compatible with Yoast SEO and Rank Math.
 * Version: 0.7.1
 * Requires at least: 6.1
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

define('WEBMCP_CANARY_VERSION', '0.7.1');
define('WEBMCP_CANARY_OPTION', 'webmcp_canary_settings');
define('WEBMCP_CANARY_HTTP_TIMEOUT', 10);
define('WEBMCP_CANARY_INSIGHTS_CACHE_TTL', 10 * MINUTE_IN_SECONDS);
define('WEBMCP_CANARY_LLMS_TXT_MAX_BYTES', 256 * 1024);
define('WEBMCP_CANARY_AEO_SCORE_OPTION', 'webmcp_canary_aeo_score');
define('WEBMCP_CANARY_AEO_SCORE_TTL', 10 * MINUTE_IN_SECONDS);
define('WEBMCP_CANARY_EXTRACTION_OPTION', 'webmcp_canary_extraction_report');
define('WEBMCP_CANARY_RULESET_OPTION', 'webmcp_canary_ruleset_state');
define('WEBMCP_CANARY_RULESET_TTL', 6 * HOUR_IN_SECONDS);
define('WEBMCP_CANARY_RULESET_CRON', 'webmcp_canary_ruleset_check');
define('WEBMCP_CANARY_PROFILE_OPTION', 'webmcp_canary_profile_sync');
define('WEBMCP_CANARY_PROFILE_TTL', 10 * MINUTE_IN_SECONDS);
define('WEBMCP_CANARY_SOV_OPTION', 'webmcp_canary_sov_state');
define('WEBMCP_CANARY_SOV_TTL', 6 * HOUR_IN_SECONDS);

/*
 * Translations load themselves. The bundled Japanese catalogue in languages/ is
 * picked up just in time via the Domain Path header, which is why the plugin
 * requires WordPress 6.1: that is the release where automatic loading started
 * looking inside a plugin's own directory rather than only in the shared
 * languages folder. Calling load_plugin_textdomain() here would be redundant,
 * and Plugin Check rightly flags it.
 */

function webmcp_canary_default_settings() {
    return array(
        'enabled' => '0',
        'allow_ai_crawlers' => '1',
        'serve_llms_txt' => '1',
        'serve_schema' => '1',
        'avoid_schema_duplicates' => '1',
        'tag_url' => 'https://nurevo.jp/tag.js',
        // The browser tag is the only part of this plugin that puts a remote
        // script on public pages and sends visitor-side data. It is therefore
        // opt-in: AEO output and diagnosis never need it. tag_url is still used
        // without it, to derive the API base for admin-side requests.
        'load_tag' => '0',
        'site_key' => '',
        'site_id' => '',
        'license_key' => '',
        // Issued per site in the dashboard, typed in here once. See 0023.
        'pairing_code' => '',
        // Page that carries the hand-entered FAQ. 0 = front page.
        'faq_page_id' => '0',
        'plan' => 'free',
        'business_name' => '',
        'business_description' => '',
        'business_address' => '',
        'business_phone' => '',
        'business_hours' => '',
        'business_type' => '',
        'business_url' => '',
        'business_email' => '',
        'site_email' => get_option('admin_email'),
        'admin_token' => '',
        // Per-site write credential for the profile sync. Never printed publicly.
        'profile_token' => '',
    );
}

/**
 * Where a person goes to manage their sites.
 *
 * Fixed, and deliberately not derived from the configured service URL. The
 * dashboard links used to be built from the tag URL, which is a technical
 * endpoint: pointing it at a development worker is a legitimate thing to do,
 * and it made the admin screen offer "View this site on the nurevo.jp
 * dashboard" as a link to a machine that only exists on the developer's laptop.
 *
 * API calls still follow the configured service - they have to, or local
 * development could not talk to a local worker. Links a human clicks do not.
 *
 * Overridable from wp-config.php for development, so nothing has to be edited
 * here to work against a staging dashboard.
 */
if (!defined('WEBMCP_CANARY_DASHBOARD_BASE')) {
    define('WEBMCP_CANARY_DASHBOARD_BASE', 'https://nurevo.jp');
}

/** Where the hand-entered service list lives. */
if (!defined('WEBMCP_CANARY_SERVICES_OPTION')) {
    define('WEBMCP_CANARY_SERVICES_OPTION', 'webmcp_canary_services');
}

/** How many services are kept. */
if (!defined('WEBMCP_CANARY_MAX_SERVICES')) {
    define('WEBMCP_CANARY_MAX_SERVICES', 20);
}

/**
 * The bookable services the operator typed in.
 *
 * Hand-entered rather than read from a booking plugin. Amelia and the others
 * expose no documented API for third parties, so reading them would mean
 * querying undocumented tables and guessing at whether a duration is stored in
 * seconds or minutes - and a wrong duration published as fact is worse than no
 * duration at all. Everything here is a value someone entered, including the
 * unit and the booking URL, so nothing is inferred.
 */
function webmcp_canary_service_entries() {
    $stored = get_option(WEBMCP_CANARY_SERVICES_OPTION, array());
    if (!is_array($stored)) {
        return array();
    }
    $entries = array();
    foreach ($stored as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $name = trim((string) ($entry['name'] ?? ''));
        // A service with no name is nothing to publish.
        if ($name === '') {
            continue;
        }
        $entries[] = array(
            'name' => $name,
            // Minutes, because the field says minutes. 0 means not stated.
            'minutes' => max(0, (int) ($entry['minutes'] ?? 0)),
            'price' => trim((string) ($entry['price'] ?? '')),
            'currency' => strtoupper(trim((string) ($entry['currency'] ?? ''))),
            'category' => trim((string) ($entry['category'] ?? '')),
            'reserve_url' => trim((string) ($entry['reserve_url'] ?? '')),
        );
        if (count($entries) >= WEBMCP_CANARY_MAX_SERVICES) {
            break;
        }
    }
    return $entries;
}

/** Store a submitted list, dropping anything with no name. */
function webmcp_canary_save_service_entries($input) {
    $clean = array();
    if (is_array($input)) {
        foreach ($input as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $name = sanitize_text_field((string) ($entry['name'] ?? ''));
            if ($name === '') {
                continue;
            }
            $clean[] = array(
                'name' => $name,
                'minutes' => max(0, (int) ($entry['minutes'] ?? 0)),
                'price' => sanitize_text_field((string) ($entry['price'] ?? '')),
                'currency' => strtoupper(sanitize_text_field((string) ($entry['currency'] ?? ''))),
                'category' => sanitize_text_field((string) ($entry['category'] ?? '')),
                'reserve_url' => esc_url_raw((string) ($entry['reserve_url'] ?? '')),
            );
            if (count($clean) >= WEBMCP_CANARY_MAX_SERVICES) {
                break;
            }
        }
    }
    update_option(WEBMCP_CANARY_SERVICES_OPTION, $clean, false);
    return $clean;
}

/**
 * Service nodes, each offered by the business and bookable at its own URL.
 *
 * `potentialAction` is a ReserveAction whose target is the URL the operator
 * gave and whose result is a Reservation - which is how schema.org says "this
 * action produces a booking". A bare Reservation node would claim a booking
 * already exists, which is a different and untrue statement.
 *
 * Duration goes in `additionalProperty`: Service has no duration term, and
 * additionalProperty with a unit is the sanctioned way to state a value that
 * has no dedicated property, rather than inventing one.
 */
function webmcp_canary_service_schema_nodes($page_url, $provider_id) {
    $entries = webmcp_canary_service_entries();
    if (empty($entries)) {
        return array();
    }
    $base = rtrim((string) $page_url, '/');
    $nodes = array();
    foreach ($entries as $index => $entry) {
        $node = array(
            '@type' => 'Service',
            // Namespaced to this plugin: a booking plugin publishing its own
            // Service some day would be a different document.
            '@id' => $base . '/#nurevo-service-' . ($index + 1),
            'name' => $entry['name'],
            'provider' => array('@id' => $provider_id),
        );
        if ($entry['category'] !== '') {
            $node['category'] = $entry['category'];
        }
        if ($entry['minutes'] > 0) {
            $node['additionalProperty'] = array(
                '@type' => 'PropertyValue',
                'name' => 'duration',
                'value' => $entry['minutes'],
                'unitCode' => 'MIN',
                'unitText' => 'minutes',
            );
        }
        if ($entry['price'] !== '') {
            $offer = array('@type' => 'Offer', 'price' => $entry['price']);
            if ($entry['currency'] !== '') {
                $offer['priceCurrency'] = $entry['currency'];
            }
            $node['offers'] = $offer;
        }
        if ($entry['reserve_url'] !== '') {
            $node['potentialAction'] = array(
                '@type' => 'ReserveAction',
                'target' => array(
                    '@type' => 'EntryPoint',
                    'urlTemplate' => $entry['reserve_url'],
                ),
                'result' => array('@type' => 'Reservation', 'name' => $entry['name']),
            );
        }
        $nodes[] = $node;
    }
    return $nodes;
}

/** One service as an llms.txt line. */
function webmcp_canary_service_llms_line($entry) {
    $label = $entry['name'];
    if ($entry['reserve_url'] !== '') {
        $label = '[' . $entry['name'] . '](' . $entry['reserve_url'] . ')';
    }
    $notes = array();
    if ($entry['minutes'] > 0) {
        $notes[] = $entry['minutes'] . ' min';
    }
    if ($entry['price'] !== '') {
        $notes[] = trim($entry['currency'] . ' ' . $entry['price']);
    }
    if ($entry['category'] !== '') {
        $notes[] = $entry['category'];
    }
    return '- ' . $label . (empty($notes) ? '' : ' — ' . implode(' · ', $notes));
}

/** Where the hand-entered Q&A lives. */
if (!defined('WEBMCP_CANARY_FAQ_OPTION')) {
    define('WEBMCP_CANARY_FAQ_OPTION', 'webmcp_canary_faq');
}

/** How many pairs are kept. An FAQ is not a knowledge base. */
if (!defined('WEBMCP_CANARY_MAX_FAQ')) {
    define('WEBMCP_CANARY_MAX_FAQ', 20);
}

/**
 * The questions and answers the operator typed in.
 *
 * This is content they entered into Nurevo, not something read off their pages,
 * which is why it is published even where an SEO plugin's own FAQ block would
 * have made us stand down: that rule is about not repeating *their* FAQ, and
 * this is not theirs. See webmcp_canary_schema_type_rules().
 */
function webmcp_canary_faq_entries() {
    $stored = get_option(WEBMCP_CANARY_FAQ_OPTION, array());
    if (!is_array($stored)) {
        return array();
    }
    $entries = array();
    foreach ($stored as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $question = trim((string) ($entry['q'] ?? ''));
        $answer = trim((string) ($entry['a'] ?? ''));
        // Half a pair answers nothing, so it is not published.
        if ($question === '' || $answer === '') {
            continue;
        }
        $entries[] = array('q' => $question, 'a' => $answer);
        if (count($entries) >= WEBMCP_CANARY_MAX_FAQ) {
            break;
        }
    }
    return $entries;
}

/** Store a submitted list, dropping anything incomplete. */
function webmcp_canary_save_faq_entries($input) {
    $clean = array();
    if (is_array($input)) {
        foreach ($input as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $question = sanitize_text_field((string) ($entry['q'] ?? ''));
            $answer = sanitize_textarea_field((string) ($entry['a'] ?? ''));
            if ($question === '' || $answer === '') {
                continue;
            }
            $clean[] = array('q' => $question, 'a' => $answer);
            if (count($clean) >= WEBMCP_CANARY_MAX_FAQ) {
                break;
            }
        }
    }
    update_option(WEBMCP_CANARY_FAQ_OPTION, $clean, false);
    return $clean;
}

/**
 * The FAQPage node, under an id of ours.
 *
 * The id is namespaced to this plugin rather than the bare page id, because an
 * SEO plugin's FAQ block may publish its own FAQPage on the same page and the
 * two are different documents. Merging them under one id would claim their
 * questions are ours.
 */
function webmcp_canary_faq_schema_node($page_url) {
    $entries = webmcp_canary_faq_entries();
    if (empty($entries)) {
        return null;
    }
    $main = array();
    foreach ($entries as $entry) {
        $main[] = array(
            '@type' => 'Question',
            'name' => $entry['q'],
            'acceptedAnswer' => array('@type' => 'Answer', 'text' => $entry['a']),
        );
    }
    return array(
        '@type' => 'FAQPage',
        '@id' => rtrim((string) $page_url, '/') . '/#nurevo-faq',
        'mainEntity' => $main,
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

    // Operator-facing settings.
    add_settings_section('webmcp_canary_main', '__return_false', '__return_false', 'webmcp_canary');
    add_settings_field('enabled', __('Enable Nurevo AEO', 'nurevo-webmcp'), 'webmcp_canary_enabled_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('allow_ai_crawlers', __('Allow AI crawlers in robots.txt', 'nurevo-webmcp'), 'webmcp_canary_allow_ai_crawlers_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('serve_llms_txt', __('Serve /llms.txt', 'nurevo-webmcp'), 'webmcp_canary_serve_llms_txt_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('serve_schema', __('Output JSON-LD schema (server-side)', 'nurevo-webmcp'), 'webmcp_canary_serve_schema_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('avoid_schema_duplicates', __('SEO plugin compatibility', 'nurevo-webmcp'), 'webmcp_canary_avoid_schema_duplicates_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('business_details', __('Store / organization information', 'nurevo-webmcp'), 'webmcp_canary_business_details_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('pairing_code', __('Pairing code', 'nurevo-webmcp'), 'webmcp_canary_pairing_code_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('faq', __('Frequently asked questions', 'nurevo-webmcp'), 'webmcp_canary_faq_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('services', __('Bookable services', 'nurevo-webmcp'), 'webmcp_canary_services_field', 'webmcp_canary', 'webmcp_canary_main');
    add_settings_field('license_key', __('License key', 'nurevo-webmcp'), 'webmcp_canary_license_key_field', 'webmcp_canary', 'webmcp_canary_main');

    // Connection and debug settings, rendered inside the collapsed developer block.
    add_settings_section('webmcp_canary_advanced', '__return_false', '__return_false', 'webmcp_canary');
    add_settings_field('tag_url', __('Nurevo service URL', 'nurevo-webmcp'), 'webmcp_canary_tag_url_field', 'webmcp_canary', 'webmcp_canary_advanced');
    add_settings_field('load_tag', __('Browser tag (optional)', 'nurevo-webmcp'), 'webmcp_canary_load_tag_field', 'webmcp_canary', 'webmcp_canary_advanced');
    add_settings_field('site_key', __('Site key', 'nurevo-webmcp'), 'webmcp_canary_site_key_field', 'webmcp_canary', 'webmcp_canary_advanced');
    add_settings_field('site_id', __('Nurevo site ID', 'nurevo-webmcp'), 'webmcp_canary_site_id_field', 'webmcp_canary', 'webmcp_canary_advanced');
    add_settings_field('site_email', __('Owner email', 'nurevo-webmcp'), 'webmcp_canary_site_email_field', 'webmcp_canary', 'webmcp_canary_advanced');
    add_settings_field('admin_token', __('Admin token', 'nurevo-webmcp'), 'webmcp_canary_admin_token_field', 'webmcp_canary', 'webmcp_canary_advanced');
}

add_action('update_option_' . WEBMCP_CANARY_OPTION, 'webmcp_canary_settings_changed', 10, 2);
/**
 * Re-check the central ruleset as soon as the plan or site key changes, so a
 * freshly verified Standard license starts following it without waiting for
 * the next cron run.
 */
function webmcp_canary_settings_changed($old_value, $value) {
    $old_value = is_array($old_value) ? $old_value : array();
    $value = is_array($value) ? $value : array();
    $plan_changed = ($old_value['plan'] ?? '') !== ($value['plan'] ?? '');
    $key_changed = ($old_value['site_key'] ?? '') !== ($value['site_key'] ?? '');

    // Anything that changes what this site publishes invalidates the picture we
    // hold of what the other plugins publish alongside it.
    foreach (array('serve_schema', 'avoid_schema_duplicates', 'business_type', 'business_url', 'enabled') as $field) {
        if (($old_value[$field] ?? null) !== ($value[$field] ?? null)) {
            delete_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION);
            break;
        }
    }

    if (!$plan_changed && !$key_changed) {
        return;
    }
    $state = webmcp_canary_ruleset_state();
    $state['checked_at'] = 0;
    update_option(WEBMCP_CANARY_RULESET_OPTION, $state, false);
    delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
    // A plan change also changes whether measurement applies at all.
    delete_option(WEBMCP_CANARY_SOV_OPTION);
}

add_action('update_option_' . WEBMCP_CANARY_OPTION, 'webmcp_canary_store_info_changed', 20, 2);
/**
 * Push store information to the service whenever it is saved.
 *
 * The local save has already happened by the time this runs, so schema and
 * llms.txt are correct regardless of whether the push succeeds. A failure is
 * recorded as pending and retried on the next save, admin view or cron run.
 */
function webmcp_canary_store_info_changed($old_value, $value) {
    if (!webmcp_canary_profile_sync_enabled()) {
        return;
    }
    $old_value = is_array($old_value) ? $old_value : array();
    $value = is_array($value) ? $value : array();
    $dirty = false;
    foreach (webmcp_canary_profile_field_map() as $option_key) {
        if (($old_value[$option_key] ?? '') !== ($value[$option_key] ?? '')) {
            $dirty = true;
            break;
        }
    }
    if (!$dirty) {
        return;
    }
    webmcp_canary_refresh_catalog();
    webmcp_canary_push_catalog();
    $pushed = webmcp_canary_push_profile();
    if (!is_wp_error($pushed)) {
        // The merged record may differ from what was sent, so re-diagnose.
        delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
    }
}

function webmcp_canary_sanitize_settings($input) {
    $input = is_array($input) ? $input : array();
    $current = webmcp_canary_settings();
    $license_key = isset($input['license_key']) ? sanitize_text_field($input['license_key']) : $current['license_key'];
    $pairing_code = isset($input['pairing_code']) ? sanitize_text_field($input['pairing_code']) : $current['pairing_code'];
    $faq_page_id = isset($input['faq_page_id']) ? (string) max(0, (int) $input['faq_page_id']) : $current['faq_page_id'];
    $site_key = isset($input['site_key']) ? sanitize_text_field($input['site_key']) : '';
    $tag_url = isset($input['tag_url']) ? esc_url_raw($input['tag_url']) : '';
    $site_id = isset($input['site_id']) ? sanitize_text_field($input['site_id']) : $current['site_id'];
    $profile_token = isset($input['profile_token']) ? sanitize_text_field($input['profile_token']) : $current['profile_token'];

    // No license means no account: the plugin stays entirely local and contacts
    // nothing. Every free feature works in that state, so there is nothing to
    // ask the service about.
    if (isset($input['faq'])) {
        webmcp_canary_save_faq_entries($input['faq']);
    }
    if (isset($input['services'])) {
        webmcp_canary_save_service_entries($input['services']);
    }

    $plan = 'free';
    $paired = false;
    if ($pairing_code !== '') {
        $result = webmcp_canary_pair_site($pairing_code, $tag_url);
        if (is_wp_error($result)) {
            add_settings_error(WEBMCP_CANARY_OPTION, $result->get_error_code(), $result->get_error_message(), 'error');
        } else {
            $paired = true;
            $plan = $result['plan'];
            // Sent below, once the identifiers are stored - a freshly connected
            // site should not look empty in the dashboard until a cron run.
            $push_catalog_after_save = true;
            if (!empty($result['site_id'])) $site_id = sanitize_text_field($result['site_id']);
            if (!empty($result['site_key'])) $site_key = sanitize_text_field($result['site_key']);
            if (!empty($result['profile_token'])) $profile_token = sanitize_text_field($result['profile_token']);
            add_settings_error(
                WEBMCP_CANARY_OPTION,
                'webmcp_paired',
                /* translators: 1: the domain this site was paired as. 2: plan name, e.g. "Free" or "Pro". */
                sprintf(__('Paired. This site is registered as %1$s. Plan: %2$s.', 'nurevo-webmcp'), (string) $result['domain'], $plan),
                'updated'
            );
        }
    }
    // The licence route stays live for installs that were set up before pairing
    // existed. A paired install has nothing left for a key to do, so it is not
    // consulted once pairing has succeeded.
    if (!$paired && $license_key !== '') {
        // Redeeming the license is what registers this site, so this replaces
        // the old verify call: verify only answered "which plan", which left a
        // self-installed plugin with no site_id and therefore no profile sync,
        // no diagnosis history and no measurement.
        $bound = webmcp_canary_bind_license($license_key, $tag_url);
        if (is_wp_error($bound)) {
            if ($bound->get_error_code() === 'webmcp_license_unreachable') {
                // An unreachable service is not evidence that the license went
                // bad, so the previously confirmed plan is kept.
                $plan = in_array($current['plan'], array('standard', 'pro'), true) ? $current['plan'] : 'free';
            }
            add_settings_error(WEBMCP_CANARY_OPTION, $bound->get_error_code(), $bound->get_error_message(), 'error');
        } else {
            $plan = $bound['plan'];
            // Adopt what the service issued. These are what let the site sync
            // its profile and carry a diagnosis history.
            if (!empty($bound['site_id'])) $site_id = sanitize_text_field($bound['site_id']);
            if (!empty($bound['site_key'])) $site_key = sanitize_text_field($bound['site_key']);
            if (!empty($bound['profile_token'])) $profile_token = sanitize_text_field($bound['profile_token']);
            add_settings_error(
                WEBMCP_CANARY_OPTION,
                'webmcp_license_verified',
                /* translators: 1: plan name, e.g. "Standard" or "Pro". 2: the domain the license was registered against. */
                sprintf(__('License active. Plan: %1$s. This site is registered as %2$s.', 'nurevo-webmcp'), $plan, (string) $bound['domain']),
                'updated'
            );
        }
    }
    if (!empty($push_catalog_after_save)) {
        // The identifiers are returned below but are not in the option yet, so
        // the push is deferred to the next request rather than guessed at here.
        update_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION, 1, false);
    }
    return array(
        'enabled' => !empty($input['enabled']) ? '1' : '0',
        'allow_ai_crawlers' => !empty($input['allow_ai_crawlers']) ? '1' : '0',
        'serve_llms_txt' => !empty($input['serve_llms_txt']) ? '1' : '0',
        'serve_schema' => !empty($input['serve_schema']) ? '1' : '0',
        'avoid_schema_duplicates' => !empty($input['avoid_schema_duplicates']) ? '1' : '0',
        'tag_url' => $tag_url,
        'load_tag' => !empty($input['load_tag']) ? '1' : '0',
        'site_key' => $site_key,
        'site_id' => $site_id,
        'license_key' => $license_key,
        'pairing_code' => $pairing_code,
        'faq_page_id' => $faq_page_id,
        'plan' => $plan,
        'business_name' => isset($input['business_name']) ? sanitize_text_field($input['business_name']) : $current['business_name'],
        'business_description' => isset($input['business_description']) ? sanitize_textarea_field($input['business_description']) : $current['business_description'],
        'business_address' => isset($input['business_address']) ? sanitize_text_field($input['business_address']) : $current['business_address'],
        'business_phone' => isset($input['business_phone']) ? sanitize_text_field($input['business_phone']) : $current['business_phone'],
        'business_hours' => isset($input['business_hours']) ? sanitize_textarea_field($input['business_hours']) : $current['business_hours'],
        'business_type' => isset($input['business_type']) ? sanitize_text_field($input['business_type']) : $current['business_type'],
        'business_url' => isset($input['business_url']) ? esc_url_raw($input['business_url']) : $current['business_url'],
        'business_email' => isset($input['business_email']) ? sanitize_email($input['business_email']) : $current['business_email'],
        'site_email' => isset($input['site_email']) ? sanitize_email($input['site_email']) : '',
        'admin_token' => isset($input['admin_token']) ? sanitize_text_field($input['admin_token']) : '',
        'profile_token' => $profile_token,
    );
}

function webmcp_canary_enabled_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<label><input type="checkbox" name="%1$s[enabled]" value="1" %2$s> %3$s</label>',
        esc_attr(WEBMCP_CANARY_OPTION),
        checked('1', $settings['enabled'], false),
        esc_html__('Output AI-facing information for this site', 'nurevo-webmcp')
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
    echo '<p class="description">' . esc_html__('Applied only while Nurevo AEO is enabled and the site is visible to search engines.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_serve_llms_txt_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<label><input type="checkbox" name="%1$s[serve_llms_txt]" value="1" %2$s> %3$s</label>',
        esc_attr(WEBMCP_CANARY_OPTION),
        checked('1', $settings['serve_llms_txt'], false),
        esc_html__('Serve llms.txt at this site’s /llms.txt URL (generated locally; no license required)', 'nurevo-webmcp')
    );
    echo '<p class="description">' . esc_html__('Requires Nurevo AEO to be enabled.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_serve_schema_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<label><input type="checkbox" name="%1$s[serve_schema]" value="1" %2$s> %3$s</label>',
        esc_attr(WEBMCP_CANARY_OPTION),
        checked('1', $settings['serve_schema'], false),
        esc_html__('Output schema.org JSON-LD (Organization, WebSite, and the current page) in the page head so AI crawlers that do not run JavaScript can read it', 'nurevo-webmcp')
    );
    echo '<p class="description">' . esc_html__('Built from this site content. Requires Nurevo AEO to be enabled.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_avoid_schema_duplicates_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<label><input type="checkbox" name="%1$s[avoid_schema_duplicates]" value="1" %2$s> %3$s</label>',
        esc_attr(WEBMCP_CANARY_OPTION),
        checked('1', $settings['avoid_schema_duplicates'], false),
        esc_html__('Avoid schema types already emitted by an active SEO plugin (recommended)', 'nurevo-webmcp')
    );
    $detected = webmcp_canary_detect_active_seo_plugins();
    if (!empty($detected)) {
        echo '<p class="description">' . esc_html(
            /* translators: %s: comma-separated list of active SEO plugins, e.g. "Yoast SEO, Rank Math". */
            sprintf(__('Detected: %s', 'nurevo-webmcp'), implode(', ', array_values($detected)))
        ) . '</p>';
    }
}

/**
 * Return the supported SEO plugins that are currently active.
 *
 * Keys are plugin basenames so callers can make deterministic decisions while
 * values are the human-readable names shown in wp-admin.
 */
/**
 * Other plugins that publish schema, by what they publish.
 *
 * WooCommerce emits Product JSON-LD from WC_Structured_Data with no SEO plugin
 * involved, so a store running it already has Product covered. Detection is
 * enough to know that: unlike the business node, where the question is whether
 * their node is *complete*, "does anyone else publish Product here" has a
 * yes/no answer the moment the plugin is active. That is what lets this avoid
 * fetching pages - Product and FAQ live on inner pages the front-page
 * measurement never sees.
 */
function webmcp_canary_detect_active_commerce_plugins() {
    if (!function_exists('is_plugin_active') && defined('ABSPATH')) {
        $plugin_api = ABSPATH . 'wp-admin/includes/plugin.php';
        if (file_exists($plugin_api)) {
            require_once $plugin_api;
        }
    }
    if (!function_exists('is_plugin_active')) {
        return array();
    }
    $supported = array('woocommerce/woocommerce.php' => 'WooCommerce');
    $active = array();
    foreach ($supported as $plugin_file => $plugin_name) {
        if (is_plugin_active($plugin_file)) {
            $active[$plugin_file] = $plugin_name;
        }
    }
    return $active;
}

function webmcp_canary_detect_active_seo_plugins() {
    if (!function_exists('is_plugin_active') && defined('ABSPATH')) {
        $plugin_api = ABSPATH . 'wp-admin/includes/plugin.php';
        if (file_exists($plugin_api)) {
            require_once $plugin_api;
        }
    }

    if (!function_exists('is_plugin_active')) {
        return array();
    }

    $supported = array(
        'wordpress-seo/wp-seo.php'                    => 'Yoast SEO',
        'seo-by-rank-math/rank-math.php'              => 'Rank Math SEO',
        'all-in-one-seo-pack/all_in_one_seo_pack.php' => 'All in One SEO',
    );
    $active = array();
    foreach ($supported as $plugin_file => $plugin_name) {
        if (is_plugin_active($plugin_file)) {
            $active[$plugin_file] = $plugin_name;
        }
    }
    return $active;
}

/**
 * Who else publishes each schema type, and how we decide whether to stand down.
 *
 * A flat list of "types an SEO plugin might emit" could not express what Phase 4
 * needs, because the right answer differs by type in two opposite directions.
 * Article is ours only when nobody else publishes one. Product is theirs the
 * moment WooCommerce is active. FAQPage is ours unless a plugin with an FAQ
 * block is installed. One list cannot say all three, so each type carries its
 * own rule.
 *
 * `publishers` is which other plugins emit the type: 'seo' for the supported SEO
 * plugins, 'commerce' for WooCommerce. `basis` is how the decision is made:
 *
 *   measured  only stand down for what their page was actually seen to publish.
 *             Used for the graph roots the front page carries, where we can see
 *             the answer and a presence check would hide our node on sites where
 *             their free tier emits nothing.
 *   detected  the plugin being active is the answer. Used where measurement
 *             cannot reach: Product lives on shop pages and FAQPage on inner
 *             pages, and the measurement only ever reads the front page.
 *   always    nobody else publishes it, so it is ours unconditionally.
 */
function webmcp_canary_schema_type_rules() {
    $rules = array(
        'WebSite'        => array('publishers' => array('seo'), 'basis' => 'measured'),
        'WebPage'        => array('publishers' => array('seo'), 'basis' => 'measured'),
        'BreadcrumbList' => array('publishers' => array('seo'), 'basis' => 'measured'),
        'Article'        => array('publishers' => array('seo'), 'basis' => 'measured'),
        'NewsArticle'    => array('publishers' => array('seo'), 'basis' => 'measured'),
        'BlogPosting'    => array('publishers' => array('seo'), 'basis' => 'measured'),
        // Both Yoast and Rank Math ship an FAQ block that emits FAQPage. It was
        // previously exempt from suppression entirely, which would have produced
        // two FAQPage nodes on every site using one of those blocks.
        'FAQPage'        => array('publishers' => array('seo'), 'basis' => 'detected'),
        // WooCommerce publishes this itself, SEO plugin or not.
        'Product'        => array('publishers' => array('commerce'), 'basis' => 'detected'),
        'Offer'          => array('publishers' => array('commerce'), 'basis' => 'detected'),
        // Booking plugins publish no schema at all, so these are open ground.
        'Service'        => array('publishers' => array(), 'basis' => 'always'),
        'Reservation'    => array('publishers' => array(), 'basis' => 'always'),
        'OpeningHoursSpecification' => array('publishers' => array(), 'basis' => 'always'),
    );
    // The business node is measured rather than detected: an SEO plugin's free
    // tier usually emits an Organization with a name and a logo and nothing
    // else, and standing down for that would lose the address and hours that are
    // the entire point.
    foreach (webmcp_canary_local_business_types() as $type) {
        $rules[$type] = array('publishers' => array('seo'), 'basis' => 'measured');
    }
    return $rules;
}

/** Which publisher groups are active on this site. */
function webmcp_canary_active_publishers($active_plugins = null, $commerce_plugins = null) {
    if ($active_plugins === null) {
        $active_plugins = webmcp_canary_detect_active_seo_plugins();
    }
    if ($commerce_plugins === null) {
        $commerce_plugins = webmcp_canary_detect_active_commerce_plugins();
    }
    $groups = array();
    if (!empty($active_plugins)) {
        $groups[] = 'seo';
    }
    if (!empty($commerce_plugins)) {
        $groups[] = 'commerce';
    }
    return $groups;
}

/**
 * Types another plugin on this site may be publishing.
 *
 * Kept as a function of its own because the measured path still needs to know
 * which types are even candidates before asking what the page showed.
 */
function webmcp_canary_duplicate_schema_types($active_plugins = null, $commerce_plugins = null) {
    $groups = webmcp_canary_active_publishers($active_plugins, $commerce_plugins);
    if (empty($groups)) {
        return array();
    }
    $candidates = array();
    foreach (webmcp_canary_schema_type_rules() as $type => $rule) {
        if (array_intersect($rule['publishers'], $groups)) {
            $candidates[] = $type;
        }
    }
    return $candidates;
}

/* -----------------------------------------------------------------------
 * Coexistence by measurement.
 *
 * Suppressing a node because a supported SEO plugin is installed assumes that
 * plugin publishes it. The free tiers often do not: Yoast without Local SEO
 * emits an Organization with a name, url and logo and no address, telephone or
 * opening hours at all. Suppressing on presence alone therefore produced pages
 * where neither plugin published the facts, which is worse than a duplicate -
 * a duplicate is visible and fixable, a gap is silent.
 *
 * So the decision is made from what the site actually serves, not from which
 * plugins are installed: fetch the front page, read every JSON-LD block that is
 * not ours, and record per slot whether the other plugin publishes it
 * completely, partially, or not at all. Only "completely" suppresses.
 *
 * When it is partial, Nurevo fills the gap under the OTHER plugin's @id, so the
 * two nodes describe one entity rather than two. Inventing our own id there
 * would produce exactly the duplicate this is meant to avoid.
 * --------------------------------------------------------------------- */

define('WEBMCP_CANARY_RIVAL_SCHEMA_OPTION', 'webmcp_canary_rival_schema');
define('WEBMCP_CANARY_RIVAL_SCHEMA_TTL', DAY_IN_SECONDS);

/** Our own block, so measurement never mistakes our output for theirs. */
define('WEBMCP_CANARY_SCHEMA_SCRIPT_ID', 'nurevo-aeo-server');

/**
 * Properties a business node must carry before we treat it as complete.
 *
 * These are the ones the AEO diagnosis reads for coverage. Optional extras such
 * as email, geo or priceRange are deliberately excluded: requiring them would
 * mark almost every rival node incomplete and make coexistence meaningless.
 */
function webmcp_canary_business_required_properties() {
    return array('name', 'url', 'address', 'telephone', 'openingHours');
}

/** Common LocalBusiness subtypes, so a HairSalon node is recognised as one. */
function webmcp_canary_local_business_types() {
    return array(
        'LocalBusiness', 'Organization', 'Store', 'Restaurant', 'CafeOrCoffeeShop', 'Bakery',
        'BarOrPub', 'HairSalon', 'BeautySalon', 'DaySpa', 'NailSalon', 'HealthAndBeautyBusiness',
        'MedicalBusiness', 'Dentist', 'Physician', 'Hospital', 'VeterinaryCare',
        'LodgingBusiness', 'Hotel', 'RealEstateAgent', 'AutoRepair', 'AutomotiveBusiness',
        'ProfessionalService', 'LegalService', 'AccountingService', 'FinancialService',
        'HomeAndConstructionBusiness', 'Plumber', 'Electrician', 'GeneralContractor',
        'SportsActivityLocation', 'ExerciseGym', 'EntertainmentBusiness', 'ChildCare',
        'EducationalOrganization', 'School', 'Library', 'TravelAgency', 'ShoppingCenter',
        'ClothingStore', 'GroceryStore', 'Pharmacy', 'PetStore', 'FurnitureStore',
    );
}

/**
 * Does this node occupy the business slot - the entity Nurevo describes?
 *
 * Matched by declared type, by the type this site is configured as, or by the
 * node simply carrying business facts, so an unusual subtype is not missed.
 */
function webmcp_canary_is_business_node($node, $configured_type = '') {
    $types = webmcp_canary_schema_node_types($node);
    if (empty($types)) {
        return false;
    }
    $known = webmcp_canary_local_business_types();
    if ($configured_type !== '') {
        $known[] = $configured_type;
    }
    foreach ($types as $type) {
        if (in_array($type, $known, true)) {
            return true;
        }
    }
    foreach (array('address', 'telephone', 'openingHours', 'openingHoursSpecification') as $property) {
        if (!empty($node[$property])) {
            return true;
        }
    }
    return false;
}

/** Is a property present and non-empty, allowing openingHours' two spellings? */
function webmcp_canary_schema_has_property($node, $property) {
    if ($property === 'openingHours') {
        return !empty($node['openingHours']) || !empty($node['openingHoursSpecification']);
    }
    if (!isset($node[$property])) {
        return false;
    }
    $value = $node[$property];
    if (is_array($value)) {
        return !empty($value);
    }
    return trim((string) $value) !== '';
}

/**
 * Read every JSON-LD block in the markup that is not ours.
 *
 * Pure: takes markup, returns findings. The caller decides what to do with it.
 */
function webmcp_canary_parse_rival_schema($html, $configured_type = '') {
    $result = array('business' => array('state' => 'none', 'id' => ''), 'types' => array(), 'conflict' => false);
    if (!is_string($html) || $html === '') {
        return $result;
    }

    if (!preg_match_all('#<script\b([^>]*)type=["\']application/ld\+json["\']([^>]*)>(.*?)</script>#is', $html, $blocks, PREG_SET_ORDER)) {
        return $result;
    }

    $complete_business_ids = array();
    foreach ($blocks as $block) {
        $attributes = $block[1] . $block[2];
        // Skip our own output.
        if (strpos($attributes, WEBMCP_CANARY_SCHEMA_SCRIPT_ID) !== false) {
            continue;
        }
        $decoded = json_decode(trim($block[3]), true);
        if (!is_array($decoded)) {
            continue; // Malformed JSON-LD from someone else is not our problem to fix.
        }
        $nodes = isset($decoded['@graph']) && is_array($decoded['@graph']) ? $decoded['@graph'] : array($decoded);

        foreach ($nodes as $node) {
            if (!is_array($node)) {
                continue;
            }
            foreach (webmcp_canary_schema_node_types($node) as $type) {
                $result['types'][$type] = true;
            }
            if (!webmcp_canary_is_business_node($node, $configured_type)) {
                continue;
            }

            $complete = true;
            foreach (webmcp_canary_business_required_properties() as $property) {
                if (!webmcp_canary_schema_has_property($node, $property)) {
                    $complete = false;
                    break;
                }
            }
            $node_id = isset($node['@id']) ? trim((string) $node['@id']) : '';
            if ($complete) {
                $complete_business_ids[$node_id] = true;
                $result['business'] = array('state' => 'complete', 'id' => $node_id);
            } elseif ($result['business']['state'] !== 'complete') {
                // Keep the first id we see, so the gap-filling node merges with it.
                $result['business'] = array('state' => 'partial', 'id' => $result['business']['id'] !== '' ? $result['business']['id'] : $node_id);
            }
        }
    }

    // Self-check: two complete business nodes under different ids are a real
    // duplicate. Whatever produced it, we stay out of the way from now on.
    $result['conflict'] = count($complete_business_ids) > 1;
    $result['types'] = array_keys($result['types']);
    return $result;
}

/**
 * Re-measure when the picture is stale or no longer describes this site.
 *
 * Hooked to the existing maintenance cron and to admin page loads, never to a
 * front-end request: visitors must not pay for this.
 */
add_action(WEBMCP_CANARY_RULESET_CRON, 'webmcp_canary_refresh_rival_schema');
add_action('admin_init', 'webmcp_canary_refresh_rival_schema');
function webmcp_canary_refresh_rival_schema() {
    $settings = webmcp_canary_settings();
    if ($settings['enabled'] !== '1' || $settings['serve_schema'] !== '1') {
        return;
    }
    $stored = get_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array());
    $signature = webmcp_canary_rival_signature();
    $fresh = is_array($stored)
        && !empty($stored['measured_at'])
        && (time() - intval($stored['measured_at'])) < WEBMCP_CANARY_RIVAL_SCHEMA_TTL
        && isset($stored['signature'])
        && $stored['signature'] === $signature;
    if ($fresh) {
        return;
    }
    webmcp_canary_measure_rival_schema();
}

/**
 * What the measurement is valid for: change the set of SEO plugins and the
 * stored picture is about a different site.
 */
function webmcp_canary_rival_signature() {
    return md5(implode(',', array_keys(webmcp_canary_detect_active_seo_plugins())) . '|' . home_url('/'));
}

/** The measurement we are acting on, or null before the first one lands. */
function webmcp_canary_rival_schema_state() {
    $stored = get_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, array());
    if (!is_array($stored) || empty($stored['measured_at']) || !isset($stored['business'])) {
        return null;
    }
    return $stored;
}

/**
 * Fetch this site's own front page and record what the other plugins publish.
 *
 * Runs on activation, when settings are saved, when the set of active SEO
 * plugins changes, and daily, so the fail-open window below is short.
 */
function webmcp_canary_measure_rival_schema() {
    $settings = webmcp_canary_settings();
    $response = wp_remote_get(home_url('/'), array(
        'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
        'headers' => array('accept' => 'text/html'),
    ));
    if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
        return false;
    }
    $parsed = webmcp_canary_parse_rival_schema(
        wp_remote_retrieve_body($response),
        (string) $settings['business_type']
    );
    $parsed['measured_at'] = time();
    $parsed['signature'] = webmcp_canary_rival_signature();
    update_option(WEBMCP_CANARY_RIVAL_SCHEMA_OPTION, $parsed, false);
    return true;
}

/**
 * Which types Nurevo must not emit.
 *
 * Before the first measurement, and when it could not be taken, nothing is
 * suppressed. That errs towards a duplicate rather than a gap: a duplicate is
 * visible in the schema table and in the diagnosis, a missing address is not.
 */
function webmcp_canary_suppressed_schema_types($state = null, $active_plugins = null, $commerce_plugins = null) {
    $groups = webmcp_canary_active_publishers($active_plugins, $commerce_plugins);
    if (empty($groups)) {
        return array();
    }
    $rules = webmcp_canary_schema_type_rules();
    $state = $state === null ? webmcp_canary_rival_schema_state() : $state;
    $published = is_array($state) && isset($state['types']) && is_array($state['types']) ? $state['types'] : array();
    $business_state = is_array($state) && isset($state['business']['state']) ? $state['business']['state'] : 'none';
    $business_types = webmcp_canary_local_business_types();
    $conflict = is_array($state) && !empty($state['conflict']);

    $suppressed = array();
    foreach ($rules as $type => $rule) {
        if (!array_intersect($rule['publishers'], $groups)) {
            continue;   // nobody else publishes it here
        }
        if ($rule['basis'] === 'always') {
            continue;
        }
        if ($rule['basis'] === 'detected') {
            // The plugin is active, so it publishes this type. No page is
            // fetched: the types this covers live where the front-page
            // measurement cannot see them.
            $suppressed[] = $type;
            continue;
        }
        // measured. Without a measurement yet, publish rather than hide - a
        // missing node is worse than a duplicate, and the measurement runs on
        // activation, on save, on a plugin change and daily.
        if (!is_array($state)) {
            continue;
        }
        if (in_array($type, $business_types, true)) {
            // The business slot is suppressed only when theirs is complete, or
            // when two complete ones already exist and we would be a third.
            if ($business_state === 'complete' || $conflict) {
                $suppressed[] = $type;
            }
            continue;
        }
        if (in_array($type, $published, true)) {
            $suppressed[] = $type;
        }
    }
    return $suppressed;
}

/**
 * The @id to publish the business node under.
 *
 * When the other plugin publishes an incomplete business node, we reuse its id
 * so the two merge into one entity. Only when there is nothing to merge with do
 * we use our own.
 */
function webmcp_canary_business_node_id($fallback_id, $state = null) {
    $state = $state === null ? webmcp_canary_rival_schema_state() : $state;
    if (!is_array($state) || empty($state['business']['id'])) {
        return $fallback_id;
    }
    if (($state['business']['state'] ?? '') !== 'partial') {
        return $fallback_id;
    }
    return (string) $state['business']['id'];
}

function webmcp_canary_schema_node_types($node) {
    if (!is_array($node) || !isset($node['@type'])) {
        return array();
    }
    $types = is_array($node['@type']) ? $node['@type'] : array($node['@type']);
    return array_values(array_filter(array_map('strval', $types)));
}

function webmcp_canary_filter_schema_graph($graph, $settings = null, $active_plugins = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    if (($settings['avoid_schema_duplicates'] ?? '1') !== '1') {
        return $graph;
    }
    if ($active_plugins === null) {
        $active_plugins = webmcp_canary_detect_active_seo_plugins();
    }
    $duplicates = webmcp_canary_suppressed_schema_types(null, $active_plugins);
    if (empty($duplicates)) {
        return $graph;
    }

    $business_suppressed = (bool) array_intersect(webmcp_canary_local_business_types(), $duplicates);
    $configured_type = isset($settings['business_type']) ? (string) $settings['business_type'] : '';

    return array_values(array_filter($graph, function ($node) use ($duplicates, $business_suppressed, $configured_type) {
        // This graph is ours, so any business-slot node in it is our business
        // node. Matching on the slot rather than on an @id suffix keeps this
        // correct when the id is borrowed from the other plugin to merge with it.
        if (webmcp_canary_is_business_node($node, $configured_type)) {
            return !$business_suppressed;
        }
        return empty(array_intersect(webmcp_canary_schema_node_types($node), $duplicates));
    }));
}

/* -----------------------------------------------------------------------
 * Branding assets.
 *
 * Both files are placeholders. Dropping a new assets/logo.svg or
 * assets/icon.svg into the plugin folder is all that is needed to rebrand -
 * no code change, because every screen resolves them through these helpers.
 * --------------------------------------------------------------------- */

/** URL of a file in the plugin's assets/ directory. */
function webmcp_canary_asset_url($file) {
    return plugins_url('assets/' . ltrim((string) $file, '/'), __FILE__);
}

/**
 * <img> for the screen-title logo. Swap assets/logo.svg to change it.
 *
 * Height is fixed and width is left to the file's own aspect ratio, so a
 * square mark and a wide wordmark both render without distortion.
 */
function webmcp_canary_logo_img() {
    return sprintf(
        '<img class="webmcp-logo" src="%s" alt="" aria-hidden="true">',
        esc_url(webmcp_canary_asset_url('logo.svg'))
    );
}

/* -----------------------------------------------------------------------
 * Plan badge shown beside every screen title.
 * --------------------------------------------------------------------- */

function webmcp_canary_plan_label($plan = null) {
    $plan = $plan === null ? webmcp_canary_settings()['plan'] : $plan;
    // Display names only. The internal keys stay free/standard/pro.
    $labels = array('free' => 'Free', 'standard' => 'Standard', 'pro' => 'Pro');
    return isset($labels[$plan]) ? $labels[$plan] : $labels['free'];
}

function webmcp_canary_plan_badge($plan = null) {
    $plan = $plan === null ? webmcp_canary_settings()['plan'] : $plan;
    $plan = in_array($plan, array('free', 'standard', 'pro'), true) ? $plan : 'free';
    return sprintf(
        '<span class="webmcp-plan-badge is-%1$s">%2$s</span>',
        esc_attr($plan),
        esc_html(webmcp_canary_plan_label($plan))
    );
}

/** Screen title: logo + name + plan badge. Used by every Nurevo AEO screen. */
function webmcp_canary_screen_title($title, $extra = '') {
    return sprintf(
        '<h1 class="webmcp-screen-title">%1$s<span class="webmcp-screen-name">%2$s</span>%3$s%4$s</h1>',
        webmcp_canary_logo_img(),
        esc_html($title),
        $extra,
        webmcp_canary_plan_badge()
    );
}

/* -----------------------------------------------------------------------
 * Schema ownership: which plugin emits which schema.org type.
 *
 * Stated as fact, not as a selling point. The suppressed list is the same one
 * webmcp_canary_filter_schema_graph() applies, so the table cannot drift from
 * what is actually output.
 * --------------------------------------------------------------------- */

/** Types Nurevo emits when nothing else claims them. */
/**
 * The @type Nurevo publishes its business node as.
 *
 * Shared by the output path and the schema table: when these drifted apart the
 * table said "Organization" while the page carried "HairSalon".
 */
function webmcp_canary_business_schema_type($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $configured = isset($settings['business_type']) ? (string) $settings['business_type'] : '';
    if (preg_match('/^[A-Za-z][A-Za-z0-9]*$/', $configured)) {
        return $configured;
    }
    $has_business_facts = !empty($settings['business_address'])
        || !empty($settings['business_phone'])
        || !empty($settings['business_hours']);
    return $has_business_facts ? 'LocalBusiness' : 'Organization';
}

/**
 * The types webmcp_canary_output_server_schema() actually publishes.
 *
 * The ownership table is built from this, so anything listed here has to be
 * something the output path emits. A type we merely intend to support does
 * not belong in it - see the FAQPage note below.
 */
function webmcp_canary_nurevo_schema_types($settings = null) {
    $types = array(webmcp_canary_business_schema_type($settings), 'WebSite', 'WebPage', 'BlogPosting');
    // Listed only when there is an FAQ to publish, because the table states what
    // this site does rather than what the plugin can do.
    if (!empty(webmcp_canary_faq_entries())) {
        $types[] = 'FAQPage';
    }
    if (!empty(webmcp_canary_service_entries())) {
        $types[] = 'Service';
    }
    return $types;
}

/**
 * Rows for the schema ownership table: type => owner.
 *
 * owner is 'seo' (an SEO plugin emits it and Nurevo stands down), or 'nurevo'.
 */
function webmcp_canary_schema_ownership($settings = null, $active_plugins = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    if ($active_plugins === null) {
        $active_plugins = webmcp_canary_detect_active_seo_plugins();
    }
    $commerce_plugins = webmcp_canary_detect_active_commerce_plugins();
    $avoiding = ($settings['avoid_schema_duplicates'] ?? '1') === '1'
        && !empty(webmcp_canary_active_publishers($active_plugins, $commerce_plugins));
    // Read the same decision the output path reads, so the table can never
    // claim something the page does not actually do.
    $state = webmcp_canary_rival_schema_state();
    $suppressed = $avoiding ? webmcp_canary_suppressed_schema_types($state, $active_plugins, $commerce_plugins) : array();
    $business_types = webmcp_canary_local_business_types();
    $business_state = is_array($state) && isset($state['business']['state']) ? $state['business']['state'] : 'none';

    $rows = array();
    foreach (webmcp_canary_nurevo_schema_types($settings) as $type) {
        if (in_array($type, $suppressed, true)) {
            $owner = 'seo';
        } elseif ($avoiding && in_array($type, $business_types, true) && $business_state !== 'none') {
            // They publish this entity but not completely, so Nurevo supplies
            // the missing facts under their id instead of standing aside.
            $owner = 'nurevo_gap';
        } else {
            $owner = 'nurevo';
        }
        $rows[] = array('type' => $type, 'owner' => $owner);
    }
    return array(
        'rows' => $rows,
        'seo_plugins' => array_values($active_plugins),
        'avoiding' => $avoiding,
        'measured' => is_array($state),
        'business_state' => $business_state,
    );
}

/* -----------------------------------------------------------------------
 * Checklist wording.
 *
 * The diagnosis arrives from the service as a list of {id, status, ...}. Its
 * label and message come back in one language, so rendering them directly would
 * put that language in front of every operator whatever their site language is.
 *
 * The ids and statuses are the stable part of that response - the machine
 * contract - so the wording is looked up here from the id and translated like
 * any other string in this plugin. A status the service invents, or a check it
 * adds before this table knows about it, still renders: the service's own label
 * and message are the fallback.
 * --------------------------------------------------------------------- */

/**
 * Localised wording for every check the service currently reports.
 *
 * Each entry carries a label plus a message per status, because "we found this"
 * and "this is fine" are different sentences, and the service sends the same
 * message either way.
 */
function webmcp_canary_aeo_check_labels() {
    return array(
        'ai_crawlers_allowed' => array(
            'label' => __('AI crawler access', 'nurevo-webmcp'),
            'OK' => __('The major AI crawlers are allowed in robots.txt.', 'nurevo-webmcp'),
            'WARN' => __('Some AI crawlers are not clearly allowed in robots.txt.', 'nurevo-webmcp'),
            'BAD' => __('AI crawlers are not allowed in robots.txt, so they will not read this site.', 'nurevo-webmcp'),
        ),
        'edge_access' => array(
            'label' => __('CDN and edge access', 'nurevo-webmcp'),
            'OK' => __('Your CDN or WAF is letting AI bots through.', 'nurevo-webmcp'),
            'WARN' => __('Something at the edge may be slowing AI bots down.', 'nurevo-webmcp'),
            'BAD' => __('AI bots are being blocked before they reach your site.', 'nurevo-webmcp'),
        ),
        'server_rendered_html' => array(
            'label' => __('Server-rendered HTML', 'nurevo-webmcp'),
            'OK' => __('Your content and schema are in the raw HTML.', 'nurevo-webmcp'),
            'WARN' => __('Only part of your content is in the raw HTML.', 'nurevo-webmcp'),
            'BAD' => __('The raw HTML carries neither your content nor your schema, so crawlers that skip JavaScript see an empty page.', 'nurevo-webmcp'),
        ),
        'schema' => array(
            'label' => __('Structured data', 'nurevo-webmcp'),
            'OK' => __('Valid JSON-LD with the right type and the key properties filled in.', 'nurevo-webmcp'),
            'WARN' => __('Your JSON-LD is missing some of the properties AI looks for.', 'nurevo-webmcp'),
            'BAD' => __('No usable JSON-LD was found in the raw HTML.', 'nurevo-webmcp'),
        ),
        'coverage' => array(
            'label' => __('Key information coverage', 'nurevo-webmcp'),
            'OK' => __('Name, address, phone, hours, location and URL are all published.', 'nurevo-webmcp'),
            'WARN' => __('Some of your name, address, phone, hours, location or URL is missing.', 'nurevo-webmcp'),
            'BAD' => __('The basics AI needs - name, address, phone, hours, location, URL - are mostly missing.', 'nurevo-webmcp'),
        ),
        'legibility' => array(
            'label' => __('Readable page text', 'nurevo-webmcp'),
            'OK' => __('Your key facts, headings and FAQ are readable in the page text.', 'nurevo-webmcp'),
            'WARN' => __('Your key facts are hard to find in the page text.', 'nurevo-webmcp'),
            'BAD' => __('The page text does not state your key facts, so AI has only your markup to go on.', 'nurevo-webmcp'),
        ),
        'llms' => array(
            'label' => __('llms.txt', 'nurevo-webmcp'),
            'OK' => __('llms.txt is published and describes this site.', 'nurevo-webmcp'),
            'WARN' => __('llms.txt is published but thin on detail.', 'nurevo-webmcp'),
            'BAD' => __('No llms.txt is published.', 'nurevo-webmcp'),
        ),
        'consistency' => array(
            'label' => __('Consistency and freshness', 'nurevo-webmcp'),
            'OK' => __('Your schema agrees with your page text and carries a freshness signal.', 'nurevo-webmcp'),
            'WARN' => __('Your schema and page text disagree in places, or the freshness signal is missing.', 'nurevo-webmcp'),
            'BAD' => __('Your schema contradicts your page text, which makes AI distrust both.', 'nurevo-webmcp'),
        ),
    );
}

/**
 * Resolve one check from the service into the wording to display.
 *
 * Falls back to whatever the service sent for an id this version does not know,
 * so a new check appears in the list rather than vanishing from it.
 */
function webmcp_canary_aeo_check_view($check) {
    $id = isset($check['id']) ? (string) $check['id'] : '';
    $status = strtoupper((string) (isset($check['status']) ? $check['status'] : ''));
    $known = webmcp_canary_aeo_check_labels();

    if (!isset($known[$id])) {
        return array(
            'label' => isset($check['label']) && $check['label'] !== '' ? (string) $check['label'] : $id,
            'message' => isset($check['message']) ? (string) $check['message'] : '',
            'known' => false,
        );
    }

    $entry = $known[$id];
    if (isset($entry[$status])) {
        $message = $entry[$status];
    } elseif (isset($entry['WARN'])) {
        $message = $entry['WARN']; // An unrecognised status is a finding, not a pass.
    } else {
        $message = isset($check['message']) ? (string) $check['message'] : '';
    }

    return array('label' => $entry['label'], 'message' => $message, 'known' => true);
}

/* -----------------------------------------------------------------------
 * Checklist actions: what the operator should actually do per finding.
 *
 * Three kinds, deliberately distinct:
 *   fix  - the plugin can switch it on itself, in place
 *   form - it needs business information only the owner has
 *   hint - it needs an editorial change, so we explain rather than offer a button
 * --------------------------------------------------------------------- */

function webmcp_canary_check_action($check_id, $status = '') {
    $status = strtoupper((string) $status);
    if ($status === 'OK') {
        return null;
    }

    $form_url = admin_url('admin.php?page=webmcp-canary-settings#webmcp-business');
    $actions = array(
        // Switched on by the plugin itself.
        'ai_crawlers_allowed' => array(
            'mode' => 'fix', 'label' => __('Fix it', 'nurevo-webmcp'),
            'hint' => __('Adds the major AI crawlers to robots.txt.', 'nurevo-webmcp'),
        ),
        'server_rendered_html' => array(
            'mode' => 'fix', 'label' => __('Fix it', 'nurevo-webmcp'),
            'hint' => __('Turns on server-side output of the information AI reads.', 'nurevo-webmcp'),
        ),
        'llms' => array(
            'mode' => 'fix', 'label' => __('Create it', 'nurevo-webmcp'),
            'hint' => __('Generates /llms.txt for this site and serves it.', 'nurevo-webmcp'),
        ),
        // Needs information only the owner has.
        'schema' => array(
            'mode' => 'form', 'label' => __('Add business details', 'nurevo-webmcp'), 'url' => $form_url,
            'hint' => __('Fill these in and the full schema is generated for you, turning this green.', 'nurevo-webmcp'),
        ),
        'coverage' => array(
            'mode' => 'form', 'label' => __('Add business details', 'nurevo-webmcp'), 'url' => $form_url,
            'hint' => __('Fill these in and the full schema is generated for you, turning this green.', 'nurevo-webmcp'),
        ),
        // Editorial: no button can do this correctly.
        'consistency' => array(
            'mode' => 'hint',
            'hint' => __('Make your schema agree with your page text, and show a freshness signal such as a visible updated date or dateModified.', 'nurevo-webmcp'),
        ),
        'legibility' => array(
            'mode' => 'hint',
            'hint' => __('Put your hours, address, phone and prices in the page text too, and tidy up your headings and FAQ.', 'nurevo-webmcp'),
        ),
        'edge_access' => array(
            'mode' => 'hint',
            'hint' => __('Check with whoever runs your CDN or WAF that AI bots are not being blocked.', 'nurevo-webmcp'),
        ),
    );
    return isset($actions[$check_id]) ? $actions[$check_id] : null;
}

function webmcp_canary_seo_coexistence_message() {
    $message = __('🤝 Works alongside Yoast and Rank Math. They do SEO, Nurevo AEO does AI. Duplicate schema is avoided automatically.', 'nurevo-webmcp');
    $active = webmcp_canary_detect_active_seo_plugins();
    if (!empty($active)) {
        /* translators: %s: comma-separated list of active SEO plugins, e.g. "Yoast SEO, Rank Math". */
        $message .= ' ' . sprintf(__('(detected: %s)', 'nurevo-webmcp'), implode(', ', array_values($active)));
    }
    return $message;
}

function webmcp_canary_business_details_field() {
    $settings = webmcp_canary_settings();
    $fields = array(
        'business_name'    => array(__('Name', 'nurevo-webmcp'), 'text'),
        'business_description' => array(__('Description', 'nurevo-webmcp'), 'text'),
        'business_address' => array(__('Address', 'nurevo-webmcp'), 'text'),
        'business_phone'   => array(__('Phone', 'nurevo-webmcp'), 'tel'),
        'business_hours'   => array(__('Opening hours', 'nurevo-webmcp'), 'text'),
        'business_type'    => array(__('Business type (schema.org type)', 'nurevo-webmcp'), 'text'),
        'business_url'     => array(__('URL', 'nurevo-webmcp'), 'url'),
        'business_email'   => array(__('Email', 'nurevo-webmcp'), 'email'),
    );
    // Anchor target for the checklist's "Add business details" action.
    echo '<fieldset id="webmcp-business">';
    foreach ($fields as $key => $definition) {
        printf(
            '<p><label>%1$s<br><input type="%2$s" class="regular-text" name="%3$s[%4$s]" value="%5$s"></label></p>',
            esc_html($definition[0]),
            esc_attr($definition[1]),
            esc_attr(WEBMCP_CANARY_OPTION),
            esc_attr($key),
            esc_attr($settings[$key])
        );
    }
    echo '<p class="description">' . esc_html__('Values are inferred from existing local SEO settings, WordPress settings, and clearly labelled public content. Automatic extraction is an estimate; verify before relying on it. Existing Nurevo values are never overwritten.', 'nurevo-webmcp') . '</p>';
    echo '</fieldset>';
}

function webmcp_canary_extraction_scalar($value) {
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $value = $decoded;
        }
    }
    if (is_scalar($value)) {
        return trim(wp_strip_all_tags((string) $value));
    }
    if (!is_array($value)) {
        return '';
    }
    $parts = array();
    array_walk_recursive($value, function ($item) use (&$parts) {
        if (is_scalar($item) && trim((string) $item) !== '') {
            $parts[] = trim(wp_strip_all_tags((string) $item));
        }
    });
    return implode(' / ', array_values(array_unique($parts)));
}

function webmcp_canary_normalize_extraction_key($key) {
    return strtolower(preg_replace('/[^a-z0-9]/i', '', (string) $key));
}

function webmcp_canary_find_extraction_value($data, $aliases) {
    if (!is_array($data)) {
        return '';
    }
    $wanted = array_map('webmcp_canary_normalize_extraction_key', $aliases);
    foreach ($data as $key => $value) {
        if (in_array(webmcp_canary_normalize_extraction_key($key), $wanted, true)) {
            $candidate = webmcp_canary_extraction_scalar($value);
            if ($candidate !== '') {
                return $candidate;
            }
        }
    }
    foreach ($data as $value) {
        if (is_array($value)) {
            $candidate = webmcp_canary_find_extraction_value($value, $aliases);
            if ($candidate !== '') {
                return $candidate;
            }
        }
    }
    return '';
}

function webmcp_canary_collect_extraction_values($data, $prefixes) {
    if (!is_array($data)) {
        return array();
    }
    $prefixes = array_map('webmcp_canary_normalize_extraction_key', $prefixes);
    $result = array();
    foreach ($data as $key => $value) {
        $normalized = webmcp_canary_normalize_extraction_key($key);
        foreach ($prefixes as $prefix) {
            if (strpos($normalized, $prefix) === 0 && is_scalar($value) && !is_bool($value) && trim((string) $value) !== '') {
                $result[] = trim((string) $key) . ': ' . trim(wp_strip_all_tags((string) $value));
                break;
            }
        }
        if (is_array($value)) {
            $result = array_merge($result, webmcp_canary_collect_extraction_values($value, $prefixes));
        }
    }
    return array_values(array_unique($result));
}

function webmcp_canary_extract_from_seo_plugins() {
    $active = webmcp_canary_detect_active_seo_plugins();
    $sources = array(
        'wordpress-seo/wp-seo.php' => array('wpseo_local', 'wpseo_titles'),
        'seo-by-rank-math/rank-math.php' => array('rank-math-options-titles', 'rank_math_options_titles'),
        'all-in-one-seo-pack/all_in_one_seo_pack.php' => array('aioseo_options_local_business', 'aioseo_options'),
    );
    $aliases = array(
        'business_name' => array('location_name', 'company_name', 'knowledgegraph_name', 'business_name', 'organization_name'),
        'business_description' => array('business_description', 'organization_description', 'company_description'),
        'business_address' => array('location_address', 'local_address', 'business_address', 'organization_address'),
        'business_phone' => array('location_phone', 'phone_number', 'business_phone', 'telephone'),
        'business_hours' => array('opening_hours', 'openinghours', 'business_hours'),
        'business_type' => array('location_business_type', 'local_business_type', 'business_type', 'organization_type'),
        'business_url' => array('location_url', 'business_url', 'organization_url'),
        'business_email' => array('location_email', 'business_email', 'organization_email'),
    );
    $result = array();
    foreach ($sources as $plugin_file => $option_names) {
        if (!isset($active[$plugin_file])) {
            continue;
        }
        foreach ($option_names as $option_name) {
            $option = get_option($option_name, array());
            if (is_string($option)) {
                $decoded = json_decode($option, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $option = $decoded;
                }
            }
            if (!is_array($option)) {
                continue;
            }
            foreach ($aliases as $field => $field_aliases) {
                if (!empty($result[$field])) {
                    continue;
                }
                $value = webmcp_canary_find_extraction_value($option, $field_aliases);
                if ($value !== '') {
                    $result[$field] = $value;
                }
            }
            if (empty($result['business_hours'])) {
                $hours = webmcp_canary_collect_extraction_values($option, array('opening_hours', 'openinghours'));
                if (!empty($hours)) {
                    $result['business_hours'] = implode('; ', $hours);
                }
            }
        }
    }
    return $result;
}

function webmcp_canary_extract_from_wordpress() {
    return array_filter(array(
        'business_name' => get_option('blogname', get_bloginfo('name')),
        'business_description' => get_option('blogdescription', get_bloginfo('description')),
        'business_url' => home_url('/'),
        'business_email' => get_option('admin_email', ''),
    ), function ($value) {
        return trim((string) $value) !== '';
    });
}

function webmcp_canary_extract_from_content() {
    if (!function_exists('get_posts')) {
        return array();
    }
    $posts = get_posts(array(
        'post_type' => array('page', 'post'),
        'post_status' => 'publish',
        'posts_per_page' => 20,
        'orderby' => 'modified',
        'order' => 'DESC',
        'no_found_rows' => true,
    ));
    $text = '';
    foreach ($posts as $post) {
        if (is_object($post) && isset($post->post_content)) {
            $text .= "\n" . wp_strip_all_tags(strip_shortcodes($post->post_content));
        }
    }
    $text = html_entity_decode($text, ENT_QUOTES, get_bloginfo('charset') ?: 'UTF-8');
    $result = array();
    if (preg_match('/(?:電話|TEL|Tel|tel)\s*[:：]?\s*(\+?\d[\d\s()\-]{7,}\d)/u', $text, $match)) {
        $result['business_phone'] = trim($match[1]);
    }
    if (preg_match('/(?:住所|所在地|アクセス)\s*[:：]?\s*((?:〒\s*)?\d{3}-\d{4}\s*[^\r\n<>]{3,80})/u', $text, $match)) {
        $result['business_address'] = trim($match[1]);
    }
    if (preg_match('/(?:営業時間|受付時間|診療時間|Opening Hours)\s*[:：]?\s*([^\r\n<>]{3,100})/iu', $text, $match)) {
        $result['business_hours'] = trim($match[1]);
    }
    return $result;
}

/** Fill only empty Nurevo fields and return the fields populated this run. */
function webmcp_canary_autofill_business_data() {
    $stored = get_option(WEBMCP_CANARY_OPTION, array());
    $settings = wp_parse_args(is_array($stored) ? $stored : array(), webmcp_canary_default_settings());
    $fields = array('business_name', 'business_description', 'business_address', 'business_phone', 'business_hours', 'business_type', 'business_url', 'business_email');
    $filled = array();
    $sources = array(
        webmcp_canary_extract_from_seo_plugins(),
        webmcp_canary_extract_from_wordpress(),
        webmcp_canary_extract_from_content(),
    );
    foreach ($sources as $source) {
        foreach ($fields as $field) {
            if (trim((string) $settings[$field]) !== '' || empty($source[$field])) {
                continue;
            }
            $value = $source[$field];
            if ($field === 'business_url') {
                $value = esc_url_raw($value);
            } elseif ($field === 'business_email') {
                $value = sanitize_email($value);
            } elseif (in_array($field, array('business_hours', 'business_description'), true)) {
                $value = sanitize_textarea_field($value);
            } else {
                $value = sanitize_text_field($value);
            }
            if ($value !== '') {
                $settings[$field] = $value;
                $filled[] = $field;
            }
        }
    }
    if (!empty($filled)) {
        update_option(WEBMCP_CANARY_OPTION, $settings, false);
        update_option(WEBMCP_CANARY_EXTRACTION_OPTION, array(
            'count' => count($filled),
            'fields' => $filled,
            'saved_at' => time(),
        ), false);
    }
    return $filled;
}

function webmcp_canary_tag_url_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="url" class="regular-text code" name="%1$s[tag_url]" value="%2$s" placeholder="https://cdn.example.com/tag.js">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['tag_url'])
    );
    echo '<p class="description">' . esc_html__('Base URL of the Nurevo service this site talks to. Change only when instructed.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_load_tag_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<label><input type="checkbox" name="%1$s[load_tag]" value="1" %2$s> %3$s</label>',
        esc_attr(WEBMCP_CANARY_OPTION),
        checked('1', $settings['load_tag'], false),
        esc_html__('Load the Nurevo browser tag on public pages', 'nurevo-webmcp')
    );
    echo '<p class="description">' . esc_html__('Off by default, and not needed for AEO. The AEO score, schema.org output, llms.txt and AI crawler rules all work with this off. Turning it on loads a script from the service URL above on every public page and reports public form structure and privacy-safe outcomes; values your visitors type are not sent. Leave it off unless Nurevo support asked you to enable it.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_site_key_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="text" class="regular-text code" name="%1$s[site_key]" value="%2$s" autocomplete="off">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['site_key'])
    );
    echo '<p class="description">' . esc_html__('Identifies this site to the Nurevo service. Not a privileged secret.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_site_id_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="text" class="regular-text code" name="%1$s[site_id]" value="%2$s" autocomplete="off">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['site_id'])
    );
    echo '<p class="description">' . esc_html__('Site ID used by the registered-site AEO score endpoint. It is separate from the site key.', 'nurevo-webmcp') . '</p>';
}

/**
 * The pairing code, issued per site in the dashboard.
 *
 * This is how an install is attached to a site now: the site is created by the
 * person who owns the account, and the code only links this WordPress to it. A
 * licence key could do neither - it created the site as a side effect of being
 * redeemed, and nothing issues retail keys in the first place.
 */
/**
 * Hand-entered questions and answers.
 *
 * Published as FAQPage on the page chosen below. This is the operator's own
 * content, so it is published whether or not an SEO plugin ships an FAQ block -
 * that block holds different questions, and standing down for it would mean
 * their FAQ replaces one the operator wrote here.
 */
/**
 * Hand-entered bookable services.
 *
 * Every value here is typed by the operator, including the unit on the duration
 * and the booking URL. Nothing is read from a booking plugin: Amelia and the
 * others expose no documented API, so reading them would mean querying
 * undocumented tables and guessing at units - and a wrong duration published as
 * fact is worse than none.
 */
function webmcp_canary_services_field() {
    $entries = webmcp_canary_service_entries();
    // One spare row so there is always somewhere to type.
    $entries[] = array('name' => '', 'minutes' => 0, 'price' => '', 'currency' => '', 'category' => '', 'reserve_url' => '');
    echo '<fieldset id="webmcp-services">';
    foreach ($entries as $index => $entry) {
        printf(
            '<p><label>%1$s<br><input type="text" class="regular-text" name="%2$s[services][%3$d][name]" value="%4$s"></label></p>'
            . '<p><label>%5$s <input type="number" min="0" step="1" class="small-text" name="%2$s[services][%3$d][minutes]" value="%6$s"></label> '
            . '<label>%7$s <input type="text" class="small-text" name="%2$s[services][%3$d][price]" value="%8$s"></label> '
            . '<label>%9$s <input type="text" class="small-text" name="%2$s[services][%3$d][currency]" value="%10$s" placeholder="JPY"></label></p>'
            . '<p><label>%11$s <input type="text" class="regular-text" name="%2$s[services][%3$d][category]" value="%12$s"></label></p>'
            . '<p><label>%13$s<br><input type="url" class="regular-text" name="%2$s[services][%3$d][reserve_url]" value="%14$s"></label></p>',
            esc_html__('Service name', 'nurevo-webmcp'),
            esc_attr(WEBMCP_CANARY_OPTION),
            (int) $index,
            esc_attr($entry['name']),
            esc_html__('Duration (minutes)', 'nurevo-webmcp'),
            esc_attr((string) $entry['minutes']),
            esc_html__('Price', 'nurevo-webmcp'),
            esc_attr($entry['price']),
            esc_html__('Currency', 'nurevo-webmcp'),
            esc_attr($entry['currency']),
            esc_html__('Category (optional)', 'nurevo-webmcp'),
            esc_attr($entry['category']),
            esc_html__('Booking URL', 'nurevo-webmcp'),
            esc_attr($entry['reserve_url'])
        );
    }
    echo '<p class="description">' . esc_html__('Published as Service structured data with a ReserveAction pointing at the booking URL you enter. Leave the name blank to remove a service. Save to add another row.', 'nurevo-webmcp') . '</p>';
    echo '</fieldset>';
}

function webmcp_canary_faq_field() {
    $entries = webmcp_canary_faq_entries();
    // One spare row so there is always somewhere to type.
    $entries[] = array('q' => '', 'a' => '');
    echo '<fieldset id="webmcp-faq">';
    foreach ($entries as $index => $entry) {
        printf(
            '<p><label>%1$s<br><input type="text" class="regular-text" name="%2$s[faq][%3$d][q]" value="%4$s"></label></p>'
            . '<p><label>%5$s<br><textarea class="large-text" rows="2" name="%2$s[faq][%3$d][a]">%6$s</textarea></label></p>',
            esc_html__('Question', 'nurevo-webmcp'),
            esc_attr(WEBMCP_CANARY_OPTION),
            (int) $index,
            esc_attr($entry['q']),
            esc_html__('Answer', 'nurevo-webmcp'),
            esc_textarea($entry['a'])
        );
    }
    echo '<p class="description">' . esc_html__('Published as FAQPage structured data. Leave a question or its answer blank to remove the pair. Save to add another row.', 'nurevo-webmcp') . '</p>';

    $settings = webmcp_canary_settings();
    printf(
        '<p><label>%1$s <input type="number" min="0" step="1" class="small-text" name="%2$s[faq_page_id]" value="%3$s"></label></p>',
        esc_html__('Page ID that carries the FAQ (0 = front page)', 'nurevo-webmcp'),
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['faq_page_id'])
    );
    echo '</fieldset>';
}

function webmcp_canary_pairing_code_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="text" class="regular-text code" name="%1$s[pairing_code]" value="%2$s" autocomplete="off" placeholder="NRV-XXXXX-XXXXX-XXXXX-XXXXX">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['pairing_code'])
    );
    echo '<p class="description">' . esc_html__('Add the site on the nurevo.jp dashboard, then paste the pairing code it shows here. The code is used once; re-issue it from the dashboard if you need another.', 'nurevo-webmcp') . '</p>';
}

function webmcp_canary_license_key_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="password" class="regular-text code" name="%1$s[license_key]" value="%2$s" autocomplete="off">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['license_key'])
    );
    printf(
        '<p class="description">%1$s <strong>%2$s</strong></p>',
        esc_html__('Separate from the site key. It is verified when these settings are saved. Current plan:', 'nurevo-webmcp'),
        esc_html($settings['plan'])
    );
}

function webmcp_canary_site_email_field() {
    $settings = webmcp_canary_settings();
    printf(
        '<input type="email" class="regular-text" name="%1$s[site_email]" value="%2$s" autocomplete="email">',
        esc_attr(WEBMCP_CANARY_OPTION),
        esc_attr($settings['site_email'])
    );
    echo '<p class="description">' . esc_html__('Used only when issuing a site key from the Nurevo service.', 'nurevo-webmcp') . '</p>';
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
    // Three screens only: score, measurement, settings. Developer and tag
    // internals live in the collapsed section on the settings screen.
    add_menu_page(
        __('Nurevo AEO', 'nurevo-webmcp'),
        __('Nurevo AEO', 'nurevo-webmcp'),
        'manage_options',
        'webmcp-canary',
        'webmcp_canary_aeo_page',
        webmcp_canary_asset_url('icon.svg'),
        58
    );

    add_submenu_page(
        'webmcp-canary',
        __('AEO Score', 'nurevo-webmcp'),
        __('AEO Score', 'nurevo-webmcp'),
        'manage_options',
        'webmcp-canary',
        'webmcp_canary_aeo_page'
    );

    add_submenu_page(
        'webmcp-canary',
        __('AI visibility', 'nurevo-webmcp'),
        __('AI visibility', 'nurevo-webmcp'),
        'manage_options',
        'webmcp-canary-sov',
        'webmcp_canary_sov_page'
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
    if (strpos($hook_suffix, 'webmcp-canary') === false) {
        return;
    }

    wp_register_style('webmcp-canary-admin', false, array(), WEBMCP_CANARY_VERSION);
    wp_enqueue_style('webmcp-canary-admin');
    // Screen title, logo and plan badge appear on every Nurevo AEO screen.
    wp_add_inline_style('webmcp-canary-admin', webmcp_canary_chrome_styles());
    // The AEO score screen and the AI visibility screen share the same styles.
    if ($hook_suffix === 'toplevel_page_webmcp-canary' || strpos($hook_suffix, 'webmcp-canary-sov') !== false) {
        wp_add_inline_style('webmcp-canary-admin', webmcp_canary_aeo_styles());
    }
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

/**
 * URL of the nurevo.jp dashboard.
 *
 * Built from WEBMCP_CANARY_DASHBOARD_BASE, never from the configured service.
 * It used to derive from the tag URL, so an install pointed at a development
 * worker rendered this link as http://host.docker.internal:8799/dashboard -
 * an address that exists on one laptop - in the admin screen of a real site.
 *
 * `$site_id` deep-links to that site's detail view. The dashboard reads the
 * fragment on load, so the link lands on the site rather than the summary.
 * Returns '' when a deep link was asked for and this install has no site ID
 * yet - a link to the wrong place is worse than no link.
 */
function webmcp_canary_dashboard_url($site_id = '') {
    $base = rtrim((string) WEBMCP_CANARY_DASHBOARD_BASE, '/');
    if ($base === '') {
        return '';
    }
    $url = trailingslashit($base) . 'dashboard';
    $site_id = trim((string) $site_id);
    if ($site_id === '') {
        return $url;
    }
    // Site IDs are hex from the service; anything else is not one of ours and
    // must not be pasted into a URL.
    if (!preg_match('/^[a-z0-9]{1,64}$/i', $site_id)) {
        return '';
    }
    return $url . '#site:' . rawurlencode($site_id);
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

/**
 * Redeem the license against this site's domain.
 *
 * This is the one call that turns a self-installed plugin into a registered
 * site. It replaces the old verify call, which answered only "which plan" and
 * left the install with no site_id - and therefore no profile sync, no stored
 * diagnosis history and no measurement.
 *
 * Safe to repeat: the service keys the binding on (org, domain), so saving the
 * settings again re-binds the same site rather than claiming another seat.
 *
 * Returns array{plan,site_id,site_key,profile_token,domain} or a WP_Error.
 */
/**
 * Attach this install to a site the operator already created.
 *
 * Mirrors webmcp_canary_bind_license(), but the code only ever links: the site
 * exists before the code does, so there is nothing for a mistyped or leaked one
 * to create. The service answers with the site id, key and write token, which
 * are what let this install sync its profile and carry a diagnosis history.
 *
 * Returns array{plan,site_id,site_key,profile_token,domain} or a WP_Error.
 */
function webmcp_canary_pair_site($code, $tag_url = '') {
    $code = sanitize_text_field($code);
    if ($code === '') {
        return new WP_Error('webmcp_pair_invalid', __('The pairing code is invalid or has expired.', 'nurevo-webmcp'));
    }
    $api_bases = array();
    if ($tag_url !== '') {
        $parts = wp_parse_url($tag_url);
        if (!empty($parts['scheme']) && !empty($parts['host'])) {
            $api_bases[] = $parts['scheme'] . '://' . $parts['host'] . (!empty($parts['port']) ? ':' . $parts['port'] : '');
        }
    }
    if (empty($api_bases)) {
        $api_bases = webmcp_canary_api_base_candidates();
    }
    if (empty($api_bases)) {
        return new WP_Error('webmcp_pair_unreachable', __('The Nurevo service is not configured.', 'nurevo-webmcp'));
    }

    $site_url = home_url('/');
    $last_error = null;
    foreach (array_values(array_unique($api_bases)) as $api_base) {
        $response = wp_remote_post(trailingslashit($api_base) . 'api/pair', array(
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => array('accept' => 'application/json', 'content-type' => 'application/json'),
            'body' => wp_json_encode(array(
                'code' => $code,
                'domain' => $site_url,
                'site_url' => $site_url,
                'install_type' => 'wp',
            )),
        ));
        if (is_wp_error($response)) {
            $last_error = $response;
            continue;
        }
        $status = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if ($status >= 200 && $status < 300 && is_array($body) && !empty($body['ok'])) {
            // Unlike the licence path, the plan is not checked here. Pairing
            // links an install and grants nothing, so "free" is a perfectly
            // ordinary answer - the licence path treating it as a failure is
            // why a retail key could never be redeemed successfully.
            return array(
                'plan' => isset($body['plan']) ? (string) $body['plan'] : 'free',
                'site_id' => isset($body['site_id']) ? (string) $body['site_id'] : '',
                'site_key' => isset($body['site_key']) ? (string) $body['site_key'] : '',
                'profile_token' => isset($body['profile_token']) ? (string) $body['profile_token'] : '',
                'domain' => isset($body['domain']) ? (string) $body['domain'] : '',
            );
        }
        // A reachable service that refuses is an answer, not a transport
        // failure: say what it refused rather than retrying the next base.
        $error = is_array($body) && isset($body['error']) ? (string) $body['error'] : '';
        if ($error === 'domain_mismatch') {
            $expected = is_array($body) && isset($body['expected']) ? (string) $body['expected'] : '';
            return new WP_Error('webmcp_pair_domain', sprintf(
                /* translators: %s: the domain the site was registered under on the dashboard. */
                __('This code belongs to a site registered as %s. Pair it from that site, or correct the site address on the dashboard.', 'nurevo-webmcp'),
                $expected
            ));
        }
        if ($error === 'code_already_used') {
            return new WP_Error('webmcp_pair_used', __('This pairing code has already been used by another site. Issue a new one from the dashboard.', 'nurevo-webmcp'));
        }
        if ($error === 'domain_already_paired') {
            return new WP_Error('webmcp_pair_taken', __('Another site in this account is already paired with this domain.', 'nurevo-webmcp'));
        }
        if ($error === 'rate_limited') {
            return new WP_Error('webmcp_pair_rate', __('Too many attempts. Please wait and try again.', 'nurevo-webmcp'));
        }
        if ($error !== '') {
            return new WP_Error('webmcp_pair_invalid', __('The pairing code is invalid or has expired.', 'nurevo-webmcp'));
        }
        $last_error = new WP_Error('webmcp_pair_unreachable', __('The Nurevo service could not be reached.', 'nurevo-webmcp'));
    }
    // A transport failure carries WordPress's own error code, which tells the
    // caller nothing about pairing. Normalising it here is what lets the screen
    // distinguish "that code is wrong" from "we could not ask".
    if ($last_error instanceof WP_Error && strpos($last_error->get_error_code(), 'webmcp_') === 0) {
        return $last_error;
    }
    return new WP_Error('webmcp_pair_unreachable', __('The Nurevo service could not be reached.', 'nurevo-webmcp'));
}

function webmcp_canary_bind_license($license, $tag_url = '') {
    $license = sanitize_text_field($license);
    if ($license === '') {
        return new WP_Error('webmcp_license_invalid', __('The license key is invalid or inactive.', 'nurevo-webmcp'));
    }
    $api_bases = array();
    if ($tag_url !== '') {
        $parts = wp_parse_url($tag_url);
        if (!empty($parts['scheme']) && !empty($parts['host'])) {
            $api_bases[] = $parts['scheme'] . '://' . $parts['host'] . (!empty($parts['port']) ? ':' . $parts['port'] : '');
        }
    }
    if (empty($api_bases)) {
        $api_bases = webmcp_canary_api_base_candidates();
    }
    if (empty($api_bases)) {
        return new WP_Error('webmcp_license_unreachable', __('The license server is not configured.', 'nurevo-webmcp'));
    }

    $site_url = home_url('/');
    $last_error = null;
    foreach (array_values(array_unique($api_bases)) as $api_base) {
        $response = wp_remote_post(trailingslashit($api_base) . 'api/license/bind', array(
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => array('accept' => 'application/json', 'content-type' => 'application/json'),
            'body' => wp_json_encode(array(
                'license' => $license,
                'domain' => $site_url,
                'site_url' => $site_url,
                'install_type' => 'wp',
            )),
        ));
        if (is_wp_error($response)) {
            $last_error = $response;
            continue;
        }
        $status = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if ($status >= 200 && $status < 300 && is_array($body) && !empty($body['ok'])
            && in_array($body['plan'] ?? '', array('standard', 'pro'), true)) {
            return array(
                'plan' => $body['plan'],
                'site_id' => isset($body['site_id']) ? (string) $body['site_id'] : '',
                'site_key' => isset($body['site_key']) ? (string) $body['site_key'] : '',
                'profile_token' => isset($body['profile_token']) ? (string) $body['profile_token'] : '',
                'domain' => isset($body['domain']) ? (string) $body['domain'] : '',
            );
        }
        // A reachable service that refuses is an answer, not a transport
        // failure: say what it refused rather than retrying the next base.
        $error = is_array($body) && isset($body['error']) ? (string) $body['error'] : '';
        if ($error === 'seat_limit_reached') {
            return new WP_Error('webmcp_license_seats', __('This license has no seats left. Release another site from the Nurevo dashboard, or use a license with more seats.', 'nurevo-webmcp'));
        }
        if ($error === 'license_not_provisioned') {
            return new WP_Error('webmcp_license_not_provisioned', __('This license is not attached to an account yet. Please contact Nurevo support.', 'nurevo-webmcp'));
        }
        if ($error === 'invalid_domain') {
            return new WP_Error('webmcp_license_domain', __('This site has no public domain to register. A license can only be activated on a publicly reachable site.', 'nurevo-webmcp'));
        }
        if ($error === 'rate_limited') {
            return new WP_Error('webmcp_license_rate_limited', __('Too many activation attempts. Please wait and try again.', 'nurevo-webmcp'));
        }
        return new WP_Error('webmcp_license_invalid', __('The license key is invalid or inactive.', 'nurevo-webmcp'));
    }
    return new WP_Error(
        'webmcp_license_unreachable',
        __('The license could not be verified. The previously verified plan remains active.', 'nurevo-webmcp'),
        is_wp_error($last_error) ? $last_error->get_error_message() : ''
    );
}

/**
 * Build llms.txt from this WordPress install alone.
 *
 * This is the free baseline: it never contacts the Nurevo service, so the
 * /llms.txt output keeps working with no site key and no license.
 */
/* -----------------------------------------------------------------------
 * WooCommerce.
 *
 * A store already publishes Product JSON-LD of its own (WC_Structured_Data), so
 * there is nothing to add there and emitting our own would duplicate it - see
 * the per-type coexistence rules, where Product is theirs on detection alone.
 *
 * What WooCommerce does not publish is an llms.txt. A model reading one gets the
 * catalogue as text with prices and availability, which is pure gain and cannot
 * collide with anything. The same list is what the measurement needs to ask
 * questions about the things this shop actually sells, rather than about the
 * shop in the abstract.
 * --------------------------------------------------------------------- */

/** How many products are read. A catalogue is not a sitemap. */
if (!defined('WEBMCP_CANARY_MAX_PRODUCTS')) {
    define('WEBMCP_CANARY_MAX_PRODUCTS', 50);
}

function webmcp_canary_woocommerce_active() {
    return !empty(webmcp_canary_detect_active_commerce_plugins());
}

/**
 * The catalogue, as plain arrays.
 *
 * Deliberately returns data and nothing else: the llms.txt builder and the
 * measurement feed both read it, and neither should have to know what a
 * WC_Product is. Only published, visible, purchasable products are included -
 * a draft or a hidden product is not something to tell a model about.
 */
function webmcp_canary_woocommerce_products($limit = null) {
    $limit = $limit === null ? WEBMCP_CANARY_MAX_PRODUCTS : max(1, (int) $limit);
    if (!webmcp_canary_woocommerce_active() || !function_exists('wc_get_products')) {
        return array();
    }
    $found = wc_get_products(array(
        'status' => 'publish',
        'limit' => $limit,
        'orderby' => 'date',
        'order' => 'DESC',
        'visibility' => 'visible',
        'return' => 'objects',
    ));
    if (!is_array($found)) {
        return array();
    }
    $products = array();
    foreach ($found as $product) {
        if (!is_object($product) || !method_exists($product, 'get_name')) {
            continue;
        }
        $name = webmcp_canary_llms_line($product->get_name());
        if ($name === '') {
            continue;
        }
        $products[] = array(
            'name' => $name,
            'url' => method_exists($product, 'get_permalink') ? (string) $product->get_permalink() : '',
            'sku' => method_exists($product, 'get_sku') ? webmcp_canary_llms_line($product->get_sku()) : '',
            // The displayed price, not the raw meta: a sale price is what a
            // customer is actually asked for, and what a model should quote.
            'price' => method_exists($product, 'get_price') ? webmcp_canary_llms_line($product->get_price()) : '',
            'currency' => function_exists('get_woocommerce_currency') ? (string) get_woocommerce_currency() : '',
            'in_stock' => method_exists($product, 'is_in_stock') ? (bool) $product->is_in_stock() : null,
            'categories' => webmcp_canary_woocommerce_product_categories($product),
        );
    }
    return $products;
}

function webmcp_canary_woocommerce_product_categories($product) {
    if (!method_exists($product, 'get_id') || !function_exists('wp_get_post_terms')) {
        return array();
    }
    $terms = wp_get_post_terms($product->get_id(), 'product_cat', array('fields' => 'names'));
    if (!is_array($terms)) {
        return array();
    }
    $names = array();
    foreach ($terms as $term) {
        $name = webmcp_canary_llms_line($term);
        if ($name !== '') {
            $names[] = $name;
        }
    }
    return $names;
}

/** One product as an llms.txt line: what it is, what it costs, can it be had. */
function webmcp_canary_product_llms_line($product) {
    $label = $product['name'];
    if (!empty($product['url'])) {
        $label = '[' . $product['name'] . '](' . $product['url'] . ')';
    }
    $notes = array();
    if ($product['price'] !== '') {
        $notes[] = trim($product['currency'] . ' ' . $product['price']);
    }
    if ($product['in_stock'] === true) {
        $notes[] = 'in stock';
    } elseif ($product['in_stock'] === false) {
        $notes[] = 'out of stock';
    }
    if (!empty($product['sku'])) {
        $notes[] = 'SKU ' . $product['sku'];
    }
    if (!empty($product['categories'])) {
        $notes[] = implode(' / ', $product['categories']);
    }
    return '- ' . $label . (empty($notes) ? '' : ' — ' . implode(' · ', $notes));
}

/**
 * The catalogue as the measurement sees it.
 *
 * Share-of-voice asks an engine questions and looks for this business in the
 * answers. Without a catalogue the questions can only be about the business in
 * general; with one they can be about what it actually sells, which is what
 * someone searching for a product would ask. This is the supply side only - the
 * engines, the budget and the scoring live in the service.
 */
/** Set when pairing just stored new identifiers and the catalogue is unsent. */
if (!defined('WEBMCP_CANARY_CATALOG_PENDING_OPTION')) {
    define('WEBMCP_CANARY_CATALOG_PENDING_OPTION', 'webmcp_canary_catalog_pending');
}

/** Where the catalogue snapshot is kept between refreshes. */
if (!defined('WEBMCP_CANARY_CATALOG_OPTION')) {
    define('WEBMCP_CANARY_CATALOG_OPTION', 'webmcp_canary_catalog');
}

/**
 * Refresh the stored catalogue snapshot.
 *
 * wc_get_products() is a database query per call, so the feed is built on a
 * schedule and on save rather than on every request that wants it. The snapshot
 * is what the measurement reads; the service consuming it is a separate piece
 * of work, so nothing is transmitted here - this is the supply side only, and
 * sending data the service would discard would be worse than not sending it.
 */
function webmcp_canary_refresh_catalog() {
    if (!webmcp_canary_woocommerce_active()) {
        delete_option(WEBMCP_CANARY_CATALOG_OPTION);
        return array();
    }
    $feed = webmcp_canary_measurement_feed();
    $feed['refreshed_at'] = time();
    update_option(WEBMCP_CANARY_CATALOG_OPTION, $feed, false);
    return $feed;
}

/** The stored snapshot, or a freshly built one when there is none. */
function webmcp_canary_stored_catalog() {
    $stored = get_option(WEBMCP_CANARY_CATALOG_OPTION, null);
    return is_array($stored) ? $stored : webmcp_canary_refresh_catalog();
}

function webmcp_canary_measurement_feed() {
    $settings = webmcp_canary_settings();
    $products = webmcp_canary_woocommerce_products();
    return array(
        'business_type' => $settings['business_type'],
        'products' => array_map(function ($product) {
            return array(
                'name' => $product['name'],
                'url' => $product['url'],
                'price' => $product['price'],
                'currency' => $product['currency'],
                'categories' => $product['categories'],
            );
        }, $products),
        'product_count' => count($products),
        // Named so the service can tell a shop with no products from a site
        // that has no shop at all.
        'source' => webmcp_canary_woocommerce_active() ? 'woocommerce' : 'none',
    );
}

function webmcp_canary_build_local_llms_txt() {
    $settings = webmcp_canary_settings();
    $name = $settings['business_name'] !== '' ? $settings['business_name'] : get_bloginfo('name');
    $description = $settings['business_description'] !== '' ? $settings['business_description'] : get_bloginfo('description');
    $home = home_url('/');

    $lines = array('# ' . webmcp_canary_llms_line($name !== '' ? $name : $home), '');
    if ($description !== '') {
        $lines[] = '> ' . webmcp_canary_llms_line($description);
        $lines[] = '';
    }

    $facts = array(
        'URL' => $settings['business_url'] !== '' ? $settings['business_url'] : $home,
        'Address' => $settings['business_address'],
        'Phone' => $settings['business_phone'],
        'Hours' => $settings['business_hours'],
        'Email' => $settings['business_email'],
        'Type' => $settings['business_type'],
    );
    $details = array();
    foreach ($facts as $label => $value) {
        $value = webmcp_canary_llms_line($value);
        if ($value !== '') {
            $details[] = '- ' . $label . ': ' . $value;
        }
    }
    if (!empty($details)) {
        $lines[] = '## Key facts';
        $lines[] = '';
        $lines = array_merge($lines, $details);
        $lines[] = '';
    }

    $pages = function_exists('get_posts') ? get_posts(array(
        'post_type' => array('page', 'post'),
        'post_status' => 'publish',
        'posts_per_page' => 30,
        'orderby' => 'modified',
        'order' => 'DESC',
        'no_found_rows' => true,
    )) : array();
    $entries = array();
    foreach ($pages as $page) {
        if (!is_object($page) || empty($page->ID)) {
            continue;
        }
        $title = webmcp_canary_llms_line(get_the_title($page));
        $permalink = get_permalink($page);
        if ($title === '' || !is_string($permalink) || $permalink === '') {
            continue;
        }
        $entries[] = '- [' . $title . '](' . $permalink . ')';
    }
    if (!empty($entries)) {
        $lines[] = '## Pages';
        $lines[] = '';
        $lines = array_merge($lines, $entries);
        $lines[] = '';
    }

    // The catalogue. WooCommerce publishes Product JSON-LD but no llms.txt, so
    // this is the one place a model can read what the shop sells as text, with
    // the price and whether it can be bought.
    $products = webmcp_canary_woocommerce_products();
    if (!empty($products)) {
        $lines[] = '## Products';
        $lines[] = '';
        foreach ($products as $product) {
            $lines[] = webmcp_canary_product_llms_line($product);
        }
        $lines[] = '';
    }

    // Services, for the same reason as products: a model reading the file learns
    // what can be booked, how long it takes and what it costs.
    $services = webmcp_canary_service_entries();
    if (!empty($services)) {
        $lines[] = '## Services';
        $lines[] = '';
        foreach ($services as $service) {
            $lines[] = webmcp_canary_service_llms_line($service);
        }
        $lines[] = '';
    }

    $body = implode("\n", $lines);
    return strlen($body) > WEBMCP_CANARY_LLMS_TXT_MAX_BYTES ? substr($body, 0, WEBMCP_CANARY_LLMS_TXT_MAX_BYTES) : $body;
}

/** Collapse a value to a single safe llms.txt line. */
function webmcp_canary_llms_line($value) {
    return trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags((string) $value)));
}

/**
 * Resolve the llms.txt body to serve.
 *
 * Registered sites prefer the service response so a Standard license keeps the
 * output aligned with the current central ruleset. Everything else - and any
 * service failure - uses the locally generated baseline.
 */
function webmcp_canary_llms_txt_body() {
    $settings = webmcp_canary_settings();
    if ($settings['enabled'] !== '1' || $settings['serve_llms_txt'] !== '1') {
        return null;
    }
    $remote = webmcp_canary_fetch_llms_txt();
    return is_string($remote) && $remote !== '' ? $remote : webmcp_canary_build_local_llms_txt();
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
    $request_uri = sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI']));
    $request_path = wp_parse_url($request_uri, PHP_URL_PATH);
    $llms_path = wp_parse_url(home_url('/llms.txt'), PHP_URL_PATH);
    if (!is_string($request_path) || !is_string($llms_path) || $request_path !== $llms_path) {
        return;
    }

    $body = webmcp_canary_llms_txt_body();
    if (!is_string($body) || $body === '') {
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
    $settings = webmcp_canary_adopt_connection($settings, $result);
    $settings['enabled'] = '1';
    update_option(WEBMCP_CANARY_OPTION, $settings);
    webmcp_canary_clear_insights_cache();
    webmcp_canary_redirect_settings('updated', __('Issued and saved the site key.', 'nurevo-webmcp'));
}

add_action('admin_post_webmcp_canary_regenerate_site_key', 'webmcp_canary_regenerate_site_key_action');
/**
 * Take the connection details out of an issuance response.
 *
 * site_id and profile_token arrive with the site key, so connecting a site
 * needs no copy-and-paste. The token is stored in the plugin options and is
 * never printed on a public page - unlike the site key, which the tag emits
 * into the markup by design.
 */
function webmcp_canary_adopt_connection($settings, $result) {
    if (!is_array($result)) {
        return $settings;
    }
    if (!empty($result['siteKey'])) {
        $settings['site_key'] = sanitize_text_field($result['siteKey']);
    }
    if (!empty($result['id'])) {
        $settings['site_id'] = sanitize_text_field($result['id']);
    }
    if (!empty($result['profile_token'])) {
        $settings['profile_token'] = sanitize_text_field($result['profile_token']);
    }
    return $settings;
}

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
    $settings = webmcp_canary_adopt_connection($settings, $result);
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
    delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
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


function webmcp_canary_should_force_refresh() {
    if (empty($_GET['webmcp_refresh'])) {
        return false;
    }
    $nonce = isset($_GET['_wpnonce']) ? sanitize_text_field(wp_unslash($_GET['_wpnonce'])) : '';
    return wp_verify_nonce($nonce, 'webmcp_canary_refresh');
}

register_activation_hook(__FILE__, 'webmcp_canary_activate_aeo_score');
function webmcp_canary_activate_aeo_score() {
    webmcp_canary_autofill_business_data();
    // Measure before the diagnosis, and before the first page is served: until
    // this lands nothing is suppressed, so the sooner it runs the shorter the
    // window in which a duplicate could appear.
    webmcp_canary_measure_rival_schema();
    webmcp_canary_get_aeo_score(true);
    if (function_exists('wp_next_scheduled') && !wp_next_scheduled(WEBMCP_CANARY_RULESET_CRON)) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'twicedaily', WEBMCP_CANARY_RULESET_CRON);
    }
}

register_deactivation_hook(__FILE__, 'webmcp_canary_deactivate_ruleset_cron');
function webmcp_canary_deactivate_ruleset_cron() {
    if (function_exists('wp_clear_scheduled_hook')) {
        wp_clear_scheduled_hook(WEBMCP_CANARY_RULESET_CRON);
    }
}

/* -----------------------------------------------------------------------
 * "Always current" (paid): central ruleset tracking and re-notification.
 *
 * Nothing here unlocks a bundled premium feature. The Nurevo service decides
 * which ruleset version a site key receives - free keys stay on the baseline
 * version, Standard and above follow the central ruleset - and this code only
 * records the version it was given and tells wp-admin when it moved.
 * --------------------------------------------------------------------- */

function webmcp_canary_ruleset_state() {
    $state = get_option(WEBMCP_CANARY_RULESET_OPTION, array());
    return wp_parse_args(is_array($state) ? $state : array(), array(
        'version' => 0,
        'previous_version' => 0,
        'plan' => 'free',
        'checked_at' => 0,
        'changed_at' => 0,
        'notice_version' => 0,
        'dismissed_version' => 0,
        // Which optional schema properties this site is entitled to publish.
        // Empty means "whatever the plugin shipped with", which is what a free
        // site keeps: following the central criteria is the paid part, and
        // until this is populated the output is exactly as it has always been.
        'fields' => array(),
    ));
}

/**
 * Is this site entitled to publish an optional schema property?
 *
 * The answer comes from the central ruleset, which only a site that follows it
 * receives. A free site has no stored switches and so keeps publishing exactly
 * what the plugin shipped with - it never loses a field, it simply does not
 * gain the ones the criteria added after it installed.
 *
 * Default false, deliberately. "On unless switched off" would hand every
 * future property to every site the moment it was invented, which is how the
 * plan model becomes a label again.
 */
function webmcp_canary_ruleset_allows($field, $state = null) {
    $state = is_array($state) ? $state : webmcp_canary_ruleset_state();
    if (!webmcp_canary_auto_follow_enabled()) {
        return false;
    }
    $fields = isset($state['fields']) && is_array($state['fields']) ? $state['fields'] : array();
    return !empty($fields[sanitize_key($field)]);
}

/** Standard and above follow the central ruleset; free stays on the baseline. */
function webmcp_canary_auto_follow_enabled($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    return in_array($settings['plan'], array('standard', 'pro'), true) && $settings['site_key'] !== '';
}

add_action(WEBMCP_CANARY_RULESET_CRON, 'webmcp_canary_sync_ruleset');
/**
 * Ask the service which ruleset applies to this site key and remember it.
 *
 * Returns the stored state. A version increase is recorded as a pending
 * wp-admin notice and drops the cached score so the next view re-diagnoses
 * against the new criteria.
 */
function webmcp_canary_sync_ruleset($force = false) {
    $state = webmcp_canary_ruleset_state();
    $settings = webmcp_canary_settings();
    if (!webmcp_canary_auto_follow_enabled($settings)) {
        return $state;
    }
    if (!$force && $state['checked_at'] > 0 && time() - intval($state['checked_at']) < WEBMCP_CANARY_RULESET_TTL) {
        return $state;
    }

    $version = null;
    $plan = $settings['plan'];
    foreach (webmcp_canary_api_base_candidates() as $api_base) {
        $url = add_query_arg(array('k' => $settings['site_key']), trailingslashit($api_base) . 'api/tag/config');
        $response = wp_remote_get($url, array(
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => array('accept' => 'application/json'),
        ));
        if (is_wp_error($response)) {
            continue;
        }
        $status = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if ($status < 200 || $status >= 300 || !is_array($body) || empty($body['ok'])) {
            continue;
        }
        $reported = isset($body['ruleset_version']) ? intval($body['ruleset_version']) : 0;
        if ($reported <= 0) {
            continue;
        }
        $version = $reported;
        // The field switches, not just the version. Storing only the number is
        // why "always current" used to move nothing: the plugin knew the
        // criteria had advanced and had no idea what had changed.
        if (isset($body['schema_fields']) && is_array($body['schema_fields'])) {
            $fields = array();
            foreach ($body['schema_fields'] as $field_key => $field_on) {
                $clean_key = sanitize_key($field_key);
                if ($clean_key !== '') {
                    $fields[$clean_key] = !empty($field_on);
                }
            }
            $state['fields'] = $fields;
        }
        if (isset($body['plan']) && in_array($body['plan'], array('free', 'standard', 'pro'), true)) {
            $plan = $body['plan'];
        }
        break;
    }

    $state['checked_at'] = time();
    if ($version === null) {
        update_option(WEBMCP_CANARY_RULESET_OPTION, $state, false);
        return $state;
    }

    $state['plan'] = $plan;

    // Billing decides the plan now, so the service is the authority on it and
    // this periodic call is how a change reaches the site. Writing it only into
    // the ruleset state left it unread: the plan badge, the always-current
    // banner and the measurement screen all read the settings copy, so a
    // cancelled subscription went on showing the paid tier until the operator
    // happened to re-save the licence field.
    $settings = webmcp_canary_settings();
    if ($plan !== $settings['plan']) {
        $settings['plan'] = $plan;
        update_option(WEBMCP_CANARY_OPTION, $settings);
        // The diagnosis is cached per plan-dependent ruleset, so drop it and let
        // the next screen view re-run against whatever the site is entitled to.
        delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
    }
    if ($version > intval($state['version'])) {
        $state['previous_version'] = intval($state['version']);
        $state['version'] = $version;
        $state['changed_at'] = time();
        // Only re-notify on a genuine move, and only once this version is new
        // to the operator. A first sync on a fresh install is not a change.
        if ($state['previous_version'] > 0) {
            $state['notice_version'] = $version;
        }
    } else {
        $state['version'] = $version;
    }
    update_option(WEBMCP_CANARY_RULESET_OPTION, $state, false);

    if (!empty($state['notice_version'])) {
        delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
    }
    return $state;
}

add_action('admin_notices', 'webmcp_canary_ruleset_notice');
function webmcp_canary_ruleset_notice() {
    if (!current_user_can('manage_options')) {
        return;
    }
    // Only a site that actually follows the central ruleset can have been moved
    // by a criteria change. A pending notice left over from a downgrade must not
    // tell a free site it is following a version it no longer receives.
    if (!webmcp_canary_auto_follow_enabled()) {
        return;
    }
    $state = webmcp_canary_ruleset_state();
    $version = intval($state['notice_version']);
    if ($version <= 0 || $version <= intval($state['dismissed_version'])) {
        return;
    }
    $dismiss_url = wp_nonce_url(
        add_query_arg(array('webmcp_dismiss_ruleset' => $version), admin_url('admin.php?page=webmcp-canary')),
        'webmcp_canary_dismiss_ruleset'
    );
    printf(
        '<div class="notice notice-warning"><p><strong>%1$s</strong> %2$s <a href="%3$s">%4$s</a> <a href="%5$s">%6$s</a></p></div>',
        esc_html__('AEO criteria were updated.', 'nurevo-webmcp'),
        esc_html(sprintf(
            /* translators: 1: previous ruleset version, 2: new ruleset version. */
            __('Your site now follows central ruleset v%2$d (was v%1$d). The diagnosis was re-run against the new criteria.', 'nurevo-webmcp'),
            intval($state['previous_version']),
            $version
        )),
        esc_url(admin_url('admin.php?page=webmcp-canary')),
        esc_html__('View the updated diagnosis', 'nurevo-webmcp'),
        esc_url($dismiss_url),
        esc_html__('Dismiss', 'nurevo-webmcp')
    );
}

add_action('admin_init', 'webmcp_canary_maybe_dismiss_ruleset_notice');
function webmcp_canary_maybe_dismiss_ruleset_notice() {
    if (empty($_GET['webmcp_dismiss_ruleset']) || !current_user_can('manage_options')) {
        return;
    }
    $nonce = isset($_GET['_wpnonce']) ? sanitize_text_field(wp_unslash($_GET['_wpnonce'])) : '';
    if (!wp_verify_nonce($nonce, 'webmcp_canary_dismiss_ruleset')) {
        return;
    }
    $state = webmcp_canary_ruleset_state();
    $state['dismissed_version'] = intval(wp_unslash($_GET['webmcp_dismiss_ruleset']));
    $state['notice_version'] = 0;
    update_option(WEBMCP_CANARY_RULESET_OPTION, $state, false);
}

/* -----------------------------------------------------------------------
 * Store profile sync.
 *
 * The Nurevo service holds the canonical record; WordPress keeps a mirror so
 * schema and llms.txt keep working with no network and no licence, which is
 * what lets the free plugin stand alone. Saving pushes, and the admin screens
 * plus the twice-daily cron pull.
 *
 * Every local read goes through the mirror, so a sync failure can never stop
 * this site from publishing.
 * --------------------------------------------------------------------- */

/** Canonical field name => WordPress option key. Mirrors PROFILE_FIELDS. */
function webmcp_canary_profile_field_map() {
    return array(
        'name'                 => 'business_name',
        'description'          => 'business_description',
        'address'              => 'business_address',
        'phone'                => 'business_phone',
        'hours'                => 'business_hours',
        'business_type_schema' => 'business_type',
        'email'                => 'business_email',
        'url'                  => 'business_url',
    );
}

function webmcp_canary_profile_state() {
    $state = get_option(WEBMCP_CANARY_PROFILE_OPTION, array());
    return wp_parse_args(is_array($state) ? $state : array(), array(
        'synced_at' => 0,
        'remote_updated_at' => 0,
        'pending' => false,
        'last_error' => '',
        'field_sources' => array(),
    ));
}

function webmcp_canary_profile_sync_enabled($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    return $settings['site_id'] !== '' && $settings['profile_token'] !== '' && !empty(webmcp_canary_api_base_candidates());
}

/** Build the canonical payload from the local mirror. */
function webmcp_canary_local_profile($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $profile = array();
    foreach (webmcp_canary_profile_field_map() as $field => $option_key) {
        $value = trim((string) $settings[$option_key]);
        // "" means "not filled in" on both sides; it never clears a stored value.
        $profile[$field] = $value === '' ? '' : $value;
    }
    return $profile;
}

/** Apply a canonical record from the service onto the local mirror. */
function webmcp_canary_apply_remote_profile($remote) {
    if (!is_array($remote) || !isset($remote['profile']) || !is_array($remote['profile'])) {
        return array('changed' => array());
    }
    $stored = get_option(WEBMCP_CANARY_OPTION, array());
    $settings = wp_parse_args(is_array($stored) ? $stored : array(), webmcp_canary_default_settings());
    $changed = array();
    foreach (webmcp_canary_profile_field_map() as $field => $option_key) {
        if (!array_key_exists($field, $remote['profile'])) {
            continue;
        }
        $value = $remote['profile'][$field];
        $value = $value === null ? '' : trim((string) $value);
        // An empty canonical value means "not filled in there", not "clear it
        // here" - the same rule mergeProfile applies on the way up, where "" is
        // never allowed to overwrite a stored value.
        //
        // Without this, the first pull after pairing wiped the shop: a site the
        // dashboard has just created has an empty profile, so every field this
        // plugin had extracted locally was overwritten with "" and then pushed
        // back up as empty. The install lost its own data by connecting.
        if ($value === '' && trim((string) $settings[$option_key]) !== '') {
            continue;
        }
        if ((string) $settings[$option_key] === $value) {
            continue;
        }
        $settings[$option_key] = $value;
        $changed[] = $option_key;
    }
    if (!empty($changed)) {
        update_option(WEBMCP_CANARY_OPTION, $settings);
        // The diagnosis describes published output, so re-run it after a change.
        delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
    }

    $state = webmcp_canary_profile_state();
    $state['synced_at'] = time();
    $state['remote_updated_at'] = isset($remote['updated_at']) ? intval($remote['updated_at']) : $state['remote_updated_at'];
    $state['field_sources'] = isset($remote['field_sources']) && is_array($remote['field_sources']) ? $remote['field_sources'] : array();
    $state['pending'] = false;
    $state['last_error'] = '';
    update_option(WEBMCP_CANARY_PROFILE_OPTION, $state, false);
    return array('changed' => $changed);
}

/** One request to the profile endpoint. Returns the decoded body or WP_Error. */
function webmcp_canary_profile_request($method, $body = null) {
    $settings = webmcp_canary_settings();
    if (!webmcp_canary_profile_sync_enabled($settings)) {
        return new WP_Error('webmcp_profile_sync_disabled', __('Profile sync needs a site ID and a profile token.', 'nurevo-webmcp'));
    }
    $last_error = null;
    foreach (webmcp_canary_api_base_candidates() as $api_base) {
        $args = array(
            'method' => $method,
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => array(
                'accept' => 'application/json',
                // Bearer, not a query parameter: a URL would end up in access logs.
                'authorization' => 'Bearer ' . $settings['profile_token'],
            ),
        );
        if ($body !== null) {
            $args['headers']['content-type'] = 'application/json';
            $args['body'] = wp_json_encode($body);
        }
        $response = wp_remote_request(
            trailingslashit($api_base) . 'api/sites/' . rawurlencode($settings['site_id']) . '/profile',
            $args
        );
        if (is_wp_error($response)) {
            $last_error = $response;
            continue;
        }
        $status = wp_remote_retrieve_response_code($response);
        $decoded = json_decode(wp_remote_retrieve_body($response), true);
        if ($status >= 200 && $status < 300 && is_array($decoded)) {
            return $decoded;
        }
        return new WP_Error('webmcp_profile_http_' . intval($status), __('The profile sync was rejected by the service.', 'nurevo-webmcp'));
    }
    return is_wp_error($last_error) ? $last_error : new WP_Error('webmcp_profile_unreachable', __('The Nurevo service could not be reached.', 'nurevo-webmcp'));
}

/** Push the local mirror, then adopt the merged record the service returns. */
/**
 * Everything this install knows about what the site offers.
 *
 * Products come from WooCommerce, services and the FAQ from what the operator
 * typed in, and the pages from the same scan that already looks for store
 * facts. All four were read locally and went nowhere; the service could show an
 * operator their phone number and nothing about the shop it belongs to.
 *
 * Lists are always complete - the plugin is the only writer - so the service
 * replaces what it holds. A list this install genuinely has none of is sent as
 * an empty array, which is a fact ("no products here"), not an omission.
 */
function webmcp_canary_catalog_payload() {
    $products = array();
    foreach (webmcp_canary_woocommerce_products() as $product) {
        $products[] = array(
            'name' => $product['name'],
            'url' => $product['url'],
            'sku' => $product['sku'],
            'price' => $product['price'],
            'currency' => $product['currency'],
            'in_stock' => $product['in_stock'],
            'categories' => $product['categories'],
        );
    }

    $services = array();
    foreach (webmcp_canary_service_entries() as $service) {
        $services[] = array(
            'name' => $service['name'],
            'minutes' => $service['minutes'],
            'price' => $service['price'],
            'currency' => $service['currency'],
            'category' => $service['category'],
            'reserve_url' => $service['reserve_url'],
        );
    }

    $faqs = array();
    foreach (webmcp_canary_faq_entries() as $faq) {
        $faqs[] = array('question' => $faq['q'], 'answer' => $faq['a']);
    }

    return array(
        'products' => $products,
        'services' => $services,
        'faqs' => $faqs,
        'pages' => webmcp_canary_catalog_pages(),
        // Named so the service can tell a shop with no products from a site with
        // no shop at all.
        'product_source' => webmcp_canary_woocommerce_active() ? 'woocommerce' : 'none',
    );
}

/** The published pages worth telling a model about. */
function webmcp_canary_catalog_pages($limit = 30) {
    if (!function_exists('get_posts')) {
        return array();
    }
    $posts = get_posts(array(
        'post_type' => array('page', 'post'),
        'post_status' => 'publish',
        'posts_per_page' => max(1, (int) $limit),
        'orderby' => 'modified',
        'order' => 'DESC',
        'no_found_rows' => true,
    ));
    $pages = array();
    foreach ($posts as $post) {
        if (!is_object($post) || empty($post->ID)) {
            continue;
        }
        $title = webmcp_canary_llms_line(get_the_title($post));
        if ($title === '') {
            continue;
        }
        $permalink = get_permalink($post);
        $pages[] = array('title' => $title, 'url' => is_string($permalink) ? $permalink : '');
    }
    return $pages;
}

/**
 * Send the catalogue.
 *
 * Separate from the profile push because the two fail independently: a shop
 * with a thousand products should not stop an address reaching the service, and
 * an unreachable service should not lose the catalogue either.
 */
/**
 * Send a catalogue that pairing deferred.
 *
 * Pairing stores the identifiers inside the settings sanitiser, before they are
 * in the option, so the push cannot happen there. The flag is drained on the
 * next admin view, which is the very next request after a save.
 */
function webmcp_canary_drain_pending_catalog() {
    if (!get_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION, 0)) {
        return;
    }
    delete_option(WEBMCP_CANARY_CATALOG_PENDING_OPTION);
    if (webmcp_canary_profile_sync_enabled()) {
        webmcp_canary_push_catalog();
    }
}

function webmcp_canary_push_catalog() {
    $settings = webmcp_canary_settings();
    if (!webmcp_canary_profile_sync_enabled($settings)) {
        return new WP_Error('webmcp_profile_sync_disabled', __('Catalogue sync needs a site ID and a profile token.', 'nurevo-webmcp'));
    }
    $last_error = null;
    foreach (webmcp_canary_api_base_candidates() as $api_base) {
        $response = wp_remote_post(trailingslashit($api_base) . 'api/sites/' . rawurlencode($settings['site_id']) . '/catalog', array(
            'method' => 'PUT',
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => array(
                'accept' => 'application/json',
                'content-type' => 'application/json',
                'authorization' => 'Bearer ' . $settings['profile_token'],
            ),
            'body' => wp_json_encode(webmcp_canary_catalog_payload()),
        ));
        if (is_wp_error($response)) {
            $last_error = $response;
            continue;
        }
        $status = wp_remote_retrieve_response_code($response);
        if ($status >= 200 && $status < 300) {
            return json_decode(wp_remote_retrieve_body($response), true);
        }
        $last_error = new WP_Error('webmcp_catalog_refused', sprintf('HTTP %d', $status));
    }
    return $last_error instanceof WP_Error
        ? $last_error
        : new WP_Error('webmcp_catalog_unreachable', __('The Nurevo service could not be reached.', 'nurevo-webmcp'));
}

function webmcp_canary_push_profile() {
    $result = webmcp_canary_profile_request('PUT', webmcp_canary_local_profile());
    if (is_wp_error($result)) {
        $state = webmcp_canary_profile_state();
        $state['pending'] = true;
        $state['last_error'] = $result->get_error_code();
        update_option(WEBMCP_CANARY_PROFILE_OPTION, $state, false);
        return $result;
    }
    return webmcp_canary_apply_remote_profile($result);
}

/** Pull the canonical record. Skipped while a recent sync is still fresh. */
function webmcp_canary_pull_profile($force = false) {
    $state = webmcp_canary_profile_state();
    if (!$force && empty($state['pending']) && $state['synced_at'] > 0
        && time() - intval($state['synced_at']) < WEBMCP_CANARY_PROFILE_TTL) {
        return array('changed' => array(), 'skipped' => true);
    }
    // A failed push is retried before pulling, so a queued local edit is not
    // silently replaced by the older remote copy.
    if (!empty($state['pending'])) {
        $pushed = webmcp_canary_push_profile();
        if (!is_wp_error($pushed)) {
            return $pushed;
        }
    }
    $result = webmcp_canary_profile_request('GET');
    if (is_wp_error($result)) {
        $state['last_error'] = $result->get_error_code();
        update_option(WEBMCP_CANARY_PROFILE_OPTION, $state, false);
        return $result;
    }
    return webmcp_canary_apply_remote_profile($result);
}

add_action(WEBMCP_CANARY_RULESET_CRON, 'webmcp_canary_cron_sync_profile');
function webmcp_canary_cron_sync_profile() {
    if (webmcp_canary_profile_sync_enabled()) {
        webmcp_canary_pull_profile(true);
    }
    webmcp_canary_refresh_catalog();
    if (webmcp_canary_profile_sync_enabled()) {
        webmcp_canary_push_catalog();
    }
}

/* -----------------------------------------------------------------------
 * U2 "AI visibility": share-of-voice. Upper plan (pro) only.
 *
 * The plugin only displays what the Nurevo service returns. It contains no
 * measurement implementation, and a non-pro site is shown the upgrade link
 * rather than a locked screen.
 * --------------------------------------------------------------------- */

function webmcp_canary_sov_enabled($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    return $settings['plan'] === 'pro' && $settings['site_key'] !== '' && $settings['site_id'] !== '';
}

function webmcp_canary_cached_sov() {
    $cached = get_option(WEBMCP_CANARY_SOV_OPTION, array());
    if (empty($cached['data']) || empty($cached['identity'])) {
        return null;
    }
    return hash_equals(webmcp_canary_aeo_score_identity(), $cached['identity']) ? $cached : null;
}

/**
 * Fetch the measurement summary for this site.
 *
 * A 402 is the documented non-pro answer, not a failure: it carries the
 * upgrade information this screen renders.
 */
function webmcp_canary_get_sov($force_refresh = false) {
    $settings = webmcp_canary_settings();
    if (!webmcp_canary_sov_enabled($settings)) {
        return new WP_Error('webmcp_sov_not_pro', __('AI visibility measurement requires the upper plan.', 'nurevo-webmcp'));
    }
    $cached = webmcp_canary_cached_sov();
    if (!$force_refresh && is_array($cached) && !empty($cached['saved_at']) && time() - intval($cached['saved_at']) < WEBMCP_CANARY_SOV_TTL) {
        return $cached['data'];
    }

    $last_error = null;
    foreach (webmcp_canary_api_base_candidates() as $api_base) {
        $url = add_query_arg(
            array('site_key' => $settings['site_key']),
            trailingslashit($api_base) . 'api/sites/' . rawurlencode($settings['site_id']) . '/sov'
        );
        $response = wp_remote_get($url, array(
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => array('accept' => 'application/json'),
        ));
        if (is_wp_error($response)) {
            $last_error = $response;
            continue;
        }
        $status = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if ($status === 402 && is_array($body)) {
            return new WP_Error('webmcp_sov_upgrade_required', __('AI visibility measurement requires the upper plan.', 'nurevo-webmcp'), $body);
        }
        if ($status < 200 || $status >= 300 || !is_array($body)) {
            $last_error = new WP_Error('webmcp_sov_unavailable', __('AI visibility measurement is not available yet.', 'nurevo-webmcp'));
            continue;
        }
        update_option(WEBMCP_CANARY_SOV_OPTION, array(
            'saved_at' => time(),
            'identity' => webmcp_canary_aeo_score_identity(),
            'data' => $body,
        ), false);
        return $body;
    }
    return is_wp_error($last_error) ? $last_error : new WP_Error('webmcp_sov_unavailable', __('AI visibility measurement is not available yet.', 'nurevo-webmcp'));
}

/** Format a 0-1 rate for display, or an em dash when there is no rate. */
function webmcp_canary_sov_percent($rate) {
    return $rate === null || $rate === '' ? '—' : round(floatval($rate) * 100) . '%';
}

/**
 * Normalize the SoV payload into what the page renders.
 *
 * Every "not available" case is distinguished so the screen can say which one
 * applies instead of showing an empty gauge.
 */
function webmcp_canary_sov_view($payload) {
    if (!is_array($payload)) {
        return array('state' => 'unavailable', 'message' => __('No AI appearance rate has been retrieved yet.', 'nurevo-webmcp'));
    }
    if (empty($payload['configured'])) {
        return array('state' => 'unconfigured', 'message' => __('No AI engine is configured yet, so nothing has been measured. Once one is set up, measurement runs automatically every week.', 'nurevo-webmcp'));
    }
    $latest = isset($payload['latest']) && is_array($payload['latest']) ? $payload['latest'] : null;
    if (!$latest) {
        return array('state' => 'pending', 'message' => __('Waiting for the first measurement. This runs automatically once a week.', 'nurevo-webmcp'));
    }
    if (($latest['status'] ?? '') !== 'measured' || !isset($latest['appearance_rate']) || $latest['appearance_rate'] === null) {
        return array('state' => 'no_answers', 'message' => __('The AI engines returned no answers this time, so an appearance rate could not be calculated.', 'nurevo-webmcp'));
    }
    $trend = isset($payload['trend']) && is_array($payload['trend']) ? $payload['trend'] : array();
    $previous = count($trend) > 1 ? $trend[count($trend) - 2] : null;
    return array(
        'state' => 'measured',
        'rate' => floatval($latest['appearance_rate']),
        'citation_rate' => isset($latest['citation_rate']) ? $latest['citation_rate'] : null,
        'delta' => isset($previous['appearance_rate']) && $previous['appearance_rate'] !== null
            ? floatval($latest['appearance_rate']) - floatval($previous['appearance_rate'])
            : null,
        'confidence' => $latest['confidence'] ?? '',
        'answers' => intval($latest['answers_received'] ?? 0),
        'questions' => intval($latest['questions_asked'] ?? 0),
        'competitors' => isset($latest['competitors']) && is_array($latest['competitors']) ? $latest['competitors'] : array(),
        'trend' => $trend,
        'measured_at' => $latest['ran_at'] ?? '',
    );
}

/** Inline sparkline for the appearance-rate trend. No external chart library. */
function webmcp_canary_sov_sparkline($trend) {
    $points = array();
    foreach ($trend as $entry) {
        if (isset($entry['appearance_rate']) && $entry['appearance_rate'] !== null) {
            $points[] = max(0, min(1, floatval($entry['appearance_rate'])));
        }
    }
    if (count($points) < 2) {
        return '';
    }
    $width = 520;
    $height = 120;
    $step = $width / (count($points) - 1);
    $coords = array();
    foreach ($points as $index => $value) {
        $coords[] = round($index * $step, 1) . ',' . round($height - ($value * $height), 1);
    }
    $path = implode(' ', $coords);
    return sprintf(
        '<svg class="webmcp-sov-chart" viewBox="0 0 %1$d %2$d" role="img" aria-label="%3$s" preserveAspectRatio="none">'
        . '<polyline fill="none" stroke="#1a9c6b" stroke-width="3" points="%4$s"></polyline></svg>',
        $width,
        $height,
        /* translators: %d: number of measurements plotted on the trend chart. */
        esc_attr(sprintf(__('AI appearance rate over the last %d measurements', 'nurevo-webmcp'), count($points))),
        esc_attr($path)
    );
}

function webmcp_canary_sov_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $settings = webmcp_canary_settings();
    $result = webmcp_canary_sov_enabled($settings) ? webmcp_canary_get_sov(false) : null;
    $payload = is_wp_error($result) || $result === null ? null : $result;
    ?>
    <div class="wrap webmcp-aeo-dashboard">
        <?php echo webmcp_canary_screen_title(__('AI visibility', 'nurevo-webmcp'), '<span class="webmcp-sov-beta">β</span>'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in webmcp_canary_screen_title() ?>

        <?php if (!webmcp_canary_sov_enabled($settings)) : ?>
            <section class="webmcp-aeo-follow is-off">
                <h2><?php esc_html_e('Measuring your visibility in AI answers is a Pro feature (beta, coming soon)', 'nurevo-webmcp'); ?></h2>
                <p><?php esc_html_e('We put representative questions to the AI engines and measure how often your business is mentioned or cited in the answers, how that compares with competitors, and how it moves over time.', 'nurevo-webmcp'); ?></p>
                <p>
                    <?php if ($settings['plan'] === 'pro') : ?>
                        <?php esc_html_e('Your Pro plan is active. Measurement needs a site key and site ID to be configured.', 'nurevo-webmcp'); ?>
                        <a href="<?php echo esc_url(admin_url('admin.php?page=webmcp-canary-settings')); ?>"><?php esc_html_e('Open settings', 'nurevo-webmcp'); ?></a>
                    <?php else : ?>
                        <?php esc_html_e('Pro is not on sale yet. There is nothing to buy and nothing to set up - this screen will start working once measurement opens.', 'nurevo-webmcp'); ?>
                        <a href="https://nurevo.jp/#pro-detail" target="_blank" rel="noopener"><?php esc_html_e('See what Pro will do', 'nurevo-webmcp'); ?></a>
                    <?php endif; ?>
                </p>
            </section>
            <p class="webmcp-aeo-free-note"><?php esc_html_e('Your free diagnosis, basic schema, llms.txt and AI crawler access carry on exactly as before.', 'nurevo-webmcp'); ?></p>
        <?php else : ?>
            <?php $view = webmcp_canary_sov_view($payload); ?>
            <?php if ($view['state'] !== 'measured') : ?>
                <section class="webmcp-aeo-follow">
                    <h2><?php esc_html_e('AI appearance rate', 'nurevo-webmcp'); ?></h2>
                    <p><?php echo esc_html($view['message']); ?></p>
                </section>
            <?php else : ?>
                <?php $degrees = round(max(0, min(1, $view['rate'])) * 360); ?>
                <section class="webmcp-aeo-hero">
                    <div class="webmcp-aeo-gauge" style="--aeo-color:#1a9c6b;--aeo-degrees:<?php echo esc_attr($degrees); ?>deg">
                        <div><strong><?php echo esc_html(webmcp_canary_sov_percent($view['rate'])); ?></strong><span><?php esc_html_e('AI appearance rate', 'nurevo-webmcp'); ?></span></div>
                    </div>
                    <div class="webmcp-aeo-summary">
                        <span class="webmcp-aeo-badge is-green"><?php esc_html_e('beta measurement', 'nurevo-webmcp'); ?></span>
                        <h2><?php esc_html_e('How often you appear in AI answers', 'nurevo-webmcp'); ?></h2>
                        <p class="description">
                            <?php esc_html_e('Citation rate', 'nurevo-webmcp'); ?> <?php echo esc_html(webmcp_canary_sov_percent($view['citation_rate'])); ?>
                            <?php if ($view['delta'] !== null) : ?>
                                / <?php esc_html_e('vs previous', 'nurevo-webmcp'); ?> <?php echo esc_html(($view['delta'] > 0 ? '+' : '') . round($view['delta'] * 100) . 'pt'); ?>
                            <?php endif; ?>
                        </p>
                        <p class="description">
                            <?php
                            /* translators: 1: number of answers received, 2: number of questions asked, 3: confidence label. */
                            echo esc_html(sprintf(__('%1$d answers across %2$d questions (confidence: %3$s)', 'nurevo-webmcp'), $view['answers'], $view['questions'], $view['confidence']));
                            ?>
                        </p>
                    </div>
                </section>

                <section class="webmcp-aeo-section">
                    <h2><?php esc_html_e('Trend', 'nurevo-webmcp'); ?></h2>
                    <?php $sparkline = webmcp_canary_sov_sparkline($view['trend']); ?>
                    <?php if ($sparkline === '') : ?>
                        <p class="webmcp-aeo-pending"><?php esc_html_e('The trend appears once a second measurement has run.', 'nurevo-webmcp'); ?></p>
                    <?php else : ?>
                        <?php echo $sparkline; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built and escaped in webmcp_canary_sov_sparkline() ?>
                        <p class="description"><?php
                        /* translators: %d: number of recent measurements shown in the chart. */
                        echo esc_html(sprintf(__('The last %d measurements, oldest on the left', 'nurevo-webmcp'), count($view['trend'])));
                        ?></p>
                    <?php endif; ?>
                </section>

                <section class="webmcp-aeo-section">
                    <h2><?php esc_html_e('Competitors (sites the AI cited for the same questions)', 'nurevo-webmcp'); ?></h2>
                    <?php if (empty($view['competitors'])) : ?>
                        <p class="webmcp-aeo-pending"><?php esc_html_e('No citations of other sites were detected.', 'nurevo-webmcp'); ?></p>
                    <?php else : ?>
                        <table class="widefat striped">
                            <thead><tr><th><?php esc_html_e('Site', 'nurevo-webmcp'); ?></th><th><?php esc_html_e('Appearance rate', 'nurevo-webmcp'); ?></th><th><?php esc_html_e('Appearances', 'nurevo-webmcp'); ?></th></tr></thead>
                            <tbody>
                            <?php foreach ($view['competitors'] as $competitor) : ?>
                                <tr>
                                    <td><?php echo esc_html($competitor['host'] ?? ''); ?></td>
                                    <td><?php echo esc_html(webmcp_canary_sov_percent($competitor['appearance_rate'] ?? null)); ?></td>
                                    <td><?php echo esc_html(intval($competitor['appearances'] ?? 0)); ?></td>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                    <p class="description"><?php esc_html_e('Counts of the domains the AI engines actually cited. Nothing here is inferred.', 'nurevo-webmcp'); ?></p>
                </section>
            <?php endif; ?>

            <p class="webmcp-aeo-js-note"><?php esc_html_e('This is a beta feature. AI answers vary from run to run, so judge by the trend rather than any single result.', 'nurevo-webmcp'); ?></p>
        <?php endif; ?>
    </div>
    <?php
}

/** Describe the "always current" state for the AEO dashboard. */
function webmcp_canary_auto_follow_view($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $state = webmcp_canary_ruleset_state();
    if (webmcp_canary_auto_follow_enabled($settings)) {
        $version = intval($state['version']);
        return array(
            'enabled' => true,
            'label' => __('Always current: ON', 'nurevo-webmcp'),
            'detail' => $version > 0
                /* translators: %d: version number of the central AEO ruleset being followed. */
                ? sprintf(__('Following central ruleset v%d. When the criteria change we re-run the diagnosis and tell you here.', 'nurevo-webmcp'), $version)
                : __('Following the central ruleset. When the criteria change we re-run the diagnosis and tell you here.', 'nurevo-webmcp'),
        );
    }
    return array(
        'enabled' => false,
        'label' => __('Always current: OFF', 'nurevo-webmcp'),
        'detail' => __('The free plan runs on the criteria bundled with the plugin. Your diagnosis, basic schema, llms.txt and AI crawler access all keep working.', 'nurevo-webmcp'),
    );
}

function webmcp_canary_validate_aeo_score($body) {
    if (!is_array($body) || !isset($body['score'], $body['band'], $body['gatePassed'], $body['checks'])) {
        return false;
    }
    if (!is_numeric($body['score']) || !in_array($body['band'], array('green', 'yellow', 'red'), true) || !is_array($body['checks'])) {
        return false;
    }
    foreach ($body['checks'] as $check) {
        if (!is_array($check) || !isset($check['id'], $check['label'], $check['status'], $check['message']) || !array_key_exists('fixable', $check)) {
            return false;
        }
        if (!in_array(strtoupper((string) $check['status']), array('OK', 'WARN', 'BAD'), true)) {
            return false;
        }
    }
    return true;
}

function webmcp_canary_aeo_score_identity() {
    $settings = webmcp_canary_settings();
    return md5($settings['site_id'] . '|' . $settings['site_key'] . '|' . home_url('/') . '|' . webmcp_canary_aeo_lang() . '|' . implode(',', webmcp_canary_api_base_candidates()));
}

function webmcp_canary_cached_aeo_score() {
    $cached = get_option(WEBMCP_CANARY_AEO_SCORE_OPTION, array());
    $identity = webmcp_canary_aeo_score_identity();
    return !empty($cached['data']) && !empty($cached['identity']) && hash_equals($identity, $cached['identity']) && webmcp_canary_validate_aeo_score($cached['data']) ? $cached : null;
}

/**
 * Build the AEO diagnosis endpoints to try, most specific first.
 *
 * A registered site (site ID + site key) gets the per-site endpoint so the
 * result is stored against its history. Every other install - including every
 * free install that never issued a site key - falls back to the public
 * URL-based diagnosis so the checklist always works without registration.
 */
/**
 * The language the diagnosis should come back in.
 *
 * The checks are worded by the service, not here, so without this the
 * checklist arrived in English however the site was set up - the admin screens
 * around it were translated and the diagnosis in the middle of them was not.
 */
function webmcp_canary_aeo_lang() {
    $locale = function_exists('determine_locale') ? determine_locale() : get_locale();
    return strtolower(str_replace('_', '-', (string) $locale));
}

function webmcp_canary_aeo_score_endpoints() {
    $settings = webmcp_canary_settings();
    $registered = $settings['site_key'] !== '' && $settings['site_id'] !== '';
    $lang = webmcp_canary_aeo_lang();
    $endpoints = array();
    foreach (webmcp_canary_api_base_candidates() as $api_base) {
        if ($registered) {
            $endpoints[] = add_query_arg(
                array('site_key' => $settings['site_key'], 'lang' => $lang),
                trailingslashit($api_base) . 'api/sites/' . rawurlencode($settings['site_id']) . '/aeo-score'
            );
        }
        $endpoints[] = add_query_arg(
            array('url' => home_url('/'), 'lang' => $lang),
            trailingslashit($api_base) . 'api/aeo/score'
        );
    }
    return $endpoints;
}

function webmcp_canary_get_aeo_score($force_refresh = false) {
    $cached = webmcp_canary_cached_aeo_score();
    if (!$force_refresh && is_array($cached) && !empty($cached['saved_at']) && time() - intval($cached['saved_at']) < WEBMCP_CANARY_AEO_SCORE_TTL) {
        return $cached['data'];
    }
    $endpoints = webmcp_canary_aeo_score_endpoints();
    if (empty($endpoints)) {
        return new WP_Error('webmcp_aeo_not_configured', __('AEO diagnosis needs the service URL. Open Nurevo AEO > Settings and confirm it.', 'nurevo-webmcp'));
    }
    $last_error = null;
    foreach ($endpoints as $url) {
        $response = wp_remote_get($url, array(
            'timeout' => WEBMCP_CANARY_HTTP_TIMEOUT,
            'headers' => array('accept' => 'application/json'),
        ));
        if (is_wp_error($response)) {
            $last_error = $response;
            continue;
        }
        $body = json_decode(wp_remote_retrieve_body($response), true);
        $status = wp_remote_retrieve_response_code($response);
        if ($status < 200 || $status >= 300 || !webmcp_canary_validate_aeo_score($body)) {
            $last_error = new WP_Error('webmcp_aeo_invalid_response', __('AEO diagnosis is not available yet.', 'nurevo-webmcp'));
            continue;
        }
        update_option(WEBMCP_CANARY_AEO_SCORE_OPTION, array(
            'saved_at' => time(),
            'identity' => webmcp_canary_aeo_score_identity(),
            'data' => $body,
        ), false);
        return $body;
    }
    return is_wp_error($last_error) ? $last_error : new WP_Error('webmcp_aeo_unreachable', __('AEO diagnosis is not available yet.', 'nurevo-webmcp'));
}

/**
 * Turn a diagnosis - or the reason there isn't one - into something to show.
 *
 * The page used to discard the WP_Error and render "Checking" whenever the
 * score was missing, so a diagnosis that had actually failed was
 * indistinguishable from one still in flight: the badge said Checking for ever
 * and offered nothing to do about it. The reason is now carried through and
 * shown, with the retry that makes it actionable.
 */
function webmcp_canary_aeo_view($score, $error = null) {
    if (!is_array($score)) {
        if (is_wp_error($error)) {
            return array(
                'score' => null,
                'band' => 'error',
                'color' => '#d13b3b',
                'badge' => __('Could not diagnose', 'nurevo-webmcp'),
                'heading' => $error->get_error_message(),
                'error_code' => $error->get_error_code(),
            );
        }
        return array('score' => null, 'band' => 'pending', 'color' => '#8c8f94', 'badge' => __('Checking', 'nurevo-webmcp'), 'heading' => __('Checking how AI reads your site', 'nurevo-webmcp'));
    }
    $band = in_array($score['band'], array('green', 'yellow', 'red'), true) ? $score['band'] : 'red';
    $views = array(
        'green' => array('#1a9c6b', __('Good', 'nurevo-webmcp'), __('AI is reading your site correctly', 'nurevo-webmcp')),
        'yellow' => array('#b7791f', __('Needs work', 'nurevo-webmcp'), __('Nearly there - a little more and you are green', 'nurevo-webmcp')),
        'red' => array('#d13b3b', __('At risk', 'nurevo-webmcp'), __('AI is barely reading your site', 'nurevo-webmcp')),
    );
    return array('score' => max(0, min(100, intval($score['score']))), 'band' => $band, 'color' => $views[$band][0], 'badge' => $views[$band][1], 'heading' => $views[$band][2]);
}

/**
 * Build the warning banner from the checks that actually failed.
 *
 * Only measured findings are shown. No sample AI answer is invented when there
 * is nothing to report - actual answer measurement is a later (upper plan)
 * capability, so claiming it here would be a fabricated signal.
 */
function webmcp_canary_aeo_alert($score) {
    if (!is_array($score) || empty($score['checks'])) {
        return null;
    }
    $labels = array();
    foreach ($score['checks'] as $check) {
        $status = strtoupper((string) $check['status']);
        if ($status === 'BAD' || $status === 'WARN') {
            $wording = webmcp_canary_aeo_check_view($check);
            $labels[] = $wording['label'];
        }
    }
    if (empty($labels)) {
        return null;
    }
    $shown = array_slice($labels, 0, 3);
    /* translators: separator between the names of failed checks. Japanese uses the ideographic comma. */
    $separator = __(', ', 'nurevo-webmcp');
    /* translators: %s: comma-separated names of the checks that failed. */
    $summary = sprintf(__('What AI cannot read from this site: %s', 'nurevo-webmcp'), implode($separator, $shown));
    if (count($labels) > count($shown)) {
        /* translators: %d: number of further failed checks not listed by name. */
        $summary .= ' ' . sprintf(__('(and %d more)', 'nurevo-webmcp'), count($labels) - count($shown));
    }
    return array(
        'summary' => $summary,
        'note' => __('Based on the diagnosis. You can fix these from the checklist below.', 'nurevo-webmcp'),
    );
}

function webmcp_canary_aeo_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    webmcp_canary_autofill_business_data();
    webmcp_canary_pull_profile();
    webmcp_canary_drain_pending_catalog();
    webmcp_canary_sync_ruleset();
    // A retry is a deliberate request for a fresh diagnosis, so it bypasses the
    // cached copy; without it the button would re-show the same stale failure.
    $retry = isset($_GET['nurevo_recheck']) && check_admin_referer('nurevo_recheck');
    $result = webmcp_canary_get_aeo_score($retry);
    $score = is_wp_error($result) ? null : $result;
    $view = webmcp_canary_aeo_view($score, is_wp_error($result) ? $result : null);
    $settings = webmcp_canary_settings();
    $auto_follow = webmcp_canary_auto_follow_view($settings);
    $degrees = is_null($view['score']) ? 0 : round($view['score'] * 3.6);
    ?>
    <div class="wrap webmcp-aeo-dashboard">
        <?php echo webmcp_canary_screen_title('Nurevo AEO'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in webmcp_canary_screen_title() ?>
        <?php $nurevo_site_link = webmcp_canary_dashboard_url($settings['site_id']); ?>
        <?php if ($nurevo_site_link !== '') : ?>
            <p class="webmcp-aeo-dashboard-link">
                <a href="<?php echo esc_url($nurevo_site_link); ?>" target="_blank" rel="noopener">
                    <?php esc_html_e('View this site on the nurevo.jp dashboard', 'nurevo-webmcp'); ?> &#8599;
                </a>
            </p>
        <?php endif; ?>
        <?php $extraction_report = get_option(WEBMCP_CANARY_EXTRACTION_OPTION, array()); ?>
        <?php if (!empty($extraction_report['count'])) : ?>
            <div class="notice notice-info inline"><p>
                <?php
                /* translators: %d: number of business-detail fields filled in automatically. */
                echo esc_html(sprintf(__('Filled in %d field(s) automatically - please check them', 'nurevo-webmcp'), intval($extraction_report['count'])));
                ?>
                <a href="<?php echo esc_url(admin_url('admin.php?page=webmcp-canary-settings')); ?>"><?php esc_html_e('Review and correct', 'nurevo-webmcp'); ?></a>
            </p><p><small><?php esc_html_e('These were inferred from your existing settings and published content. Only blank fields were filled, so please check that the values are right.', 'nurevo-webmcp'); ?></small></p></div>
        <?php endif; ?>
        <section class="webmcp-aeo-hero">
            <div class="webmcp-aeo-gauge" style="--aeo-color:<?php echo esc_attr($view['color']); ?>;--aeo-degrees:<?php echo esc_attr($degrees); ?>deg">
                <div><strong><?php echo is_null($view['score']) ? '—' : esc_html($view['score']); ?></strong><span>/100</span></div>
            </div>
            <div class="webmcp-aeo-summary">
                <span class="webmcp-aeo-badge is-<?php echo esc_attr($view['band']); ?>"><?php echo esc_html($view['badge']); ?></span>
                <h2><?php echo esc_html($view['heading']); ?></h2>
                <?php if (is_null($view['score'])) : ?>
                    <p class="description">
                        <?php if ($view['band'] === 'error') : ?>
                            <?php esc_html_e('The service could not diagnose this site. This usually means it is not reachable from the internet yet - a local or password-protected site cannot be read.', 'nurevo-webmcp'); ?>
                        <?php else : ?>
                            <?php esc_html_e('Checking. The score appears automatically once your settings are complete.', 'nurevo-webmcp'); ?>
                        <?php endif; ?>
                    </p>
                    <p>
                        <a class="button" href="<?php echo esc_url(wp_nonce_url(add_query_arg('nurevo_recheck', '1'), 'nurevo_recheck')); ?>">
                            <?php esc_html_e('Check again', 'nurevo-webmcp'); ?>
                        </a>
                    </p>
                <?php endif; ?>
            </div>
        </section>

        <?php $alert = webmcp_canary_aeo_alert($score); ?>
        <?php if ($alert !== null) : ?>
        <section class="webmcp-aeo-alert">
            <h2><?php esc_html_e('⚠ This is how AI sees your business', 'nurevo-webmcp'); ?></h2>
            <p><?php echo esc_html($alert['summary']); ?></p>
            <small><?php echo esc_html($alert['note']); ?></small>
        </section>
        <?php endif; ?>

        <section class="webmcp-aeo-section">
            <h2><?php esc_html_e('Diagnosis checklist', 'nurevo-webmcp'); ?></h2>
            <p class="webmcp-aeo-free-note"><?php esc_html_e('The diagnosis and the fixes (basic schema, llms.txt, AI crawler access) all run on the free plan.', 'nurevo-webmcp'); ?></p>
            <?php if (empty($score['checks'])) : ?>
                <p class="webmcp-aeo-pending"><?php esc_html_e('Checking', 'nurevo-webmcp'); ?></p>
            <?php else : ?>
                <ol class="webmcp-aeo-checks">
                <?php foreach ($score['checks'] as $check) : ?>
                    <?php
                    $status = strtoupper((string) $check['status']);
                    $icon = $status === 'OK' ? '✓' : ($status === 'WARN' ? '!' : '×');
                    $action = webmcp_canary_check_action($check['id'], $status);
                    $wording = webmcp_canary_aeo_check_view($check);
                    ?>
                    <li class="is-<?php echo esc_attr(strtolower($status)); ?>">
                        <span class="webmcp-aeo-check-icon" aria-hidden="true"><?php echo esc_html($icon); ?></span>
                        <div>
                            <strong><?php echo esc_html($wording['label']); ?></strong>
                            <p><?php echo esc_html($wording['message']); ?></p>
                            <?php if ($action && !empty($action['hint'])) : ?>
                                <p class="webmcp-aeo-howto"><?php echo esc_html($action['hint']); ?></p>
                            <?php endif; ?>
                        </div>
                        <?php if ($action && $action['mode'] === 'fix' && !empty($check['fixable'])) : ?>
                            <button class="button webmcp-aeo-fix" data-check-id="<?php echo esc_attr($check['id']); ?>"><?php echo esc_html($action['label']); ?></button>
                        <?php elseif ($action && $action['mode'] === 'form') : ?>
                            <a class="button button-primary webmcp-aeo-form-link" href="<?php echo esc_url($action['url']); ?>"><?php echo esc_html($action['label']); ?></a>
                        <?php endif; ?>
                    </li>
                <?php endforeach; ?>
                </ol>
            <?php endif; ?>
        </section>

        <?php $ownership = webmcp_canary_schema_ownership($settings); ?>
        <section class="webmcp-aeo-section webmcp-schema-owners">
            <h2><?php esc_html_e('Which plugin outputs each schema type', 'nurevo-webmcp'); ?></h2>
            <table class="widefat striped">
                <thead><tr><th><?php esc_html_e('schema.org type', 'nurevo-webmcp'); ?></th><th><?php esc_html_e('Output by', 'nurevo-webmcp'); ?></th></tr></thead>
                <tbody>
                <?php foreach ($ownership['rows'] as $row) : ?>
                    <tr>
                        <td><code><?php echo esc_html($row['type']); ?></code></td>
                        <td>
                            <?php if ($row['owner'] === 'seo') : ?>
                                <?php
                                /* translators: %s: names of the SEO plugins that own this schema type. */
                                echo esc_html(sprintf(__('%s (Nurevo suppressed)', 'nurevo-webmcp'), implode(' / ', $ownership['seo_plugins'])));
                                ?>
                            <?php elseif ($row['owner'] === 'nurevo_gap') : ?>
                                <?php
                                /* translators: %s: names of the active SEO plugins. */
                                echo esc_html(sprintf(__('Nurevo AEO (filling what %s leaves out)', 'nurevo-webmcp'), implode(' / ', $ownership['seo_plugins'])));
                                ?>
                            <?php else : ?>
                                Nurevo AEO
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
            <?php if (!empty($ownership['seo_plugins'])) : ?>
                <p class="description"><?php
                /* translators: %s: comma-separated list of detected SEO plugins. */
                echo esc_html(sprintf(__('Detected SEO plugins: %s', 'nurevo-webmcp'), implode(', ', $ownership['seo_plugins'])));
                ?></p>
            <?php else : ?>
                <p class="description"><?php esc_html_e('No SEO plugin was detected.', 'nurevo-webmcp'); ?></p>
            <?php endif; ?>
        </section>

        <section class="webmcp-aeo-follow is-<?php echo $auto_follow['enabled'] ? 'on' : 'off'; ?>">
            <h2><?php echo esc_html($auto_follow['label']); ?></h2>
            <p><?php echo esc_html($auto_follow['detail']); ?></p>
        </section>
    </div>
    <script>
    (function () {
        document.querySelectorAll('.webmcp-aeo-fix[data-check-id]').forEach(function (button) {
            button.addEventListener('click', function () {
                button.disabled = true;
                button.textContent = <?php echo wp_json_encode(__('Fixing...', 'nurevo-webmcp')); ?>;
                var body = new URLSearchParams({action: 'webmcp_canary_fix_aeo', nonce: <?php echo wp_json_encode(wp_create_nonce('webmcp_canary_fix_aeo')); ?>, check_id: button.dataset.checkId});
                fetch(ajaxurl, {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: body.toString()})
                    .then(function (response) { return response.json(); })
                    .then(function (payload) { if (!payload.success) throw new Error('fix_failed'); window.location.reload(); })
                    .catch(function () { button.disabled = false; button.textContent = <?php echo wp_json_encode(__('Try again', 'nurevo-webmcp')); ?>; });
            });
        });
    }());
    </script>
    <?php
}

add_action('wp_ajax_webmcp_canary_fix_aeo', 'webmcp_canary_fix_aeo');
function webmcp_canary_apply_aeo_fix($settings, $check_id) {
    $mapping = array(
        'ai_crawlers_allowed' => array('enabled', 'allow_ai_crawlers'),
        'server_rendered_html' => array('enabled', 'serve_schema'),
        'schema' => array('enabled', 'serve_schema'),
        'coverage' => array('enabled', 'serve_schema'),
        'llms' => array('enabled', 'serve_llms_txt'),
    );
    if (empty($mapping[$check_id])) {
        return new WP_Error('webmcp_aeo_not_fixable', 'not_fixable');
    }
    foreach ($mapping[$check_id] as $key) {
        $settings[$key] = '1';
    }
    return $settings;
}

function webmcp_canary_fix_aeo() {
    check_ajax_referer('webmcp_canary_fix_aeo', 'nonce');
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'forbidden'), 403);
    }
    $settings = webmcp_canary_settings();
    $check_id = isset($_POST['check_id']) ? sanitize_key(wp_unslash($_POST['check_id'])) : '';
    $settings = webmcp_canary_apply_aeo_fix($settings, $check_id);
    if (is_wp_error($settings)) {
        wp_send_json_error(array('message' => 'not_fixable'), 400);
    }
    update_option(WEBMCP_CANARY_OPTION, $settings);
    delete_option(WEBMCP_CANARY_AEO_SCORE_OPTION);
    $result = webmcp_canary_get_aeo_score(true);
    wp_send_json_success(array('score' => is_wp_error($result) ? null : $result));
}

add_action('admin_bar_menu', 'webmcp_canary_admin_bar_score', 90);
function webmcp_canary_admin_bar_score($wp_admin_bar) {
    if (!current_user_can('manage_options')) {
        return;
    }
    $cached = webmcp_canary_cached_aeo_score();
    $score = is_array($cached) ? $cached['data'] : null;
    $view = webmcp_canary_aeo_view($score);
    /* translators: %s: AEO score out of 100, or a "checking" label while it is being calculated. */
    $label = sprintf(__('AEO %s', 'nurevo-webmcp'), is_null($view['score']) ? __('Checking', 'nurevo-webmcp') : $view['score']);
    $wp_admin_bar->add_node(array(
        'id' => 'webmcp-canary-aeo-score',
        'title' => '<span class="webmcp-aeo-admin-dot" style="background:' . esc_attr($view['color']) . '"></span>' . esc_html($label),
        'href' => admin_url('admin.php?page=webmcp-canary'),
        'meta' => array('class' => 'webmcp-aeo-admin-score'),
    ));
}

add_action('wp_dashboard_setup', 'webmcp_canary_register_aeo_widget');
function webmcp_canary_register_aeo_widget() {
    if (current_user_can('manage_options')) {
        wp_add_dashboard_widget('webmcp_canary_aeo_widget', 'Nurevo AEO', 'webmcp_canary_aeo_widget');
    }
}

function webmcp_canary_aeo_widget() {
    $cached = webmcp_canary_cached_aeo_score();
    $score = is_array($cached) ? $cached['data'] : null;
    $view = webmcp_canary_aeo_view($score);
    echo '<p style="font-size:30px;font-weight:700;margin:8px 0;color:' . esc_attr($view['color']) . '">' . (is_null($view['score']) ? esc_html__('Checking', 'nurevo-webmcp') : esc_html($view['score'] . ' / 100')) . '</p>';
    echo '<p>' . esc_html($view['heading']) . '</p><p><a href="' . esc_url(admin_url('admin.php?page=webmcp-canary')) . '">' . esc_html__('See the full diagnosis', 'nurevo-webmcp') . '</a></p>';
}

/** Styles shared by every Nurevo AEO screen: title, logo, plan badge, dev block. */
function webmcp_canary_chrome_styles() {
    return <<<'CSS'
        .webmcp-screen-title{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
        .webmcp-screen-title .webmcp-logo{height:30px;width:auto;max-width:200px;display:block;flex:none}
        .webmcp-screen-title .webmcp-screen-name{font-weight:inherit}
        .webmcp-plan-badge{display:inline-block;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700;line-height:1.6;letter-spacing:.02em}
        .webmcp-plan-badge.is-free{background:#eef0f2;color:#50575e}
        .webmcp-plan-badge.is-standard{background:#e6f5ee;color:#116a4a}
        .webmcp-plan-badge.is-pro{background:#efe9ff;color:#4b31c6}
        .webmcp-dev-details{margin:26px 0 0;max-width:860px}
        .webmcp-dev-details>summary{cursor:pointer;font-weight:600;padding:9px 0;color:#50575e}
        .webmcp-dev-details>summary:hover{color:#1d2327}
        .webmcp-dev-details table{margin-top:10px}
        .webmcp-dev-details th{width:230px;font-weight:600}
CSS;
}

function webmcp_canary_aeo_styles() {
    return <<<'CSS'
        .webmcp-aeo-dashboard{max-width:1120px;color:#1f2937}.webmcp-aeo-dashboard>h1{font-size:32px;margin:28px 0 20px}
        .webmcp-aeo-hero{display:flex;align-items:center;gap:40px;padding:34px;background:#fff;border:1px solid #e5e7eb;border-radius:24px;box-shadow:0 14px 35px rgba(15,23,42,.07)}
        .webmcp-aeo-gauge{width:190px;height:190px;flex:0 0 190px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--aeo-color) var(--aeo-degrees),#e8eaed 0)}
        .webmcp-aeo-gauge:before{content:"";grid-area:1/1;width:150px;height:150px;border-radius:50%;background:#fff}.webmcp-aeo-gauge>div{grid-area:1/1;z-index:1;text-align:center}
        .webmcp-aeo-gauge strong{font-size:58px;line-height:1}.webmcp-aeo-gauge span{display:block;color:#6b7280;font-weight:600}.webmcp-aeo-summary h2{font-size:30px;margin:13px 0 6px}
        .webmcp-aeo-badge{display:inline-block;padding:6px 13px;border-radius:999px;color:#fff;font-weight:700}.webmcp-aeo-badge.is-green{background:#1a9c6b}.webmcp-aeo-badge.is-yellow{background:#b7791f}.webmcp-aeo-badge.is-red{background:#d13b3b}.webmcp-aeo-badge.is-pending{background:#8c8f94}
        .webmcp-aeo-alert{margin:22px 0;padding:22px 24px;background:#fff1f1;border:1px solid #f4b7b7;border-left:5px solid #d13b3b;border-radius:14px}.webmcp-aeo-alert h2{color:#9f2525;margin:0 0 8px}.webmcp-aeo-alert p{font-size:17px;margin:8px 0}
        .webmcp-aeo-section{background:#fff;padding:26px;border:1px solid #e5e7eb;border-radius:20px}.webmcp-aeo-section>h2{margin-top:0}.webmcp-aeo-checks{margin:0;padding:0;list-style:none}.webmcp-aeo-checks li{display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:start;gap:12px;padding:17px 2px;border-top:1px solid #edf0f2}.webmcp-aeo-checks li:first-child{border-top:0}.webmcp-aeo-checks p{margin:4px 0 0;color:#5f6875}.webmcp-aeo-check-icon{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;color:#fff;font-size:18px;font-weight:800}.webmcp-aeo-checks .is-ok .webmcp-aeo-check-icon{background:#1a9c6b}.webmcp-aeo-checks .is-warn .webmcp-aeo-check-icon{background:#b7791f}.webmcp-aeo-checks .is-bad .webmcp-aeo-check-icon{background:#d13b3b}.webmcp-aeo-fix,.webmcp-aeo-form-link{min-width:68px;text-align:center;white-space:nowrap}.webmcp-aeo-howto{margin:6px 0 0!important;color:#1d2327!important;font-weight:600;font-size:13px}.webmcp-schema-owners{margin-top:22px}.webmcp-schema-owners table{margin-top:6px;max-width:720px}.webmcp-schema-owners code{background:transparent;padding:0}
        .webmcp-aeo-js-note{color:#6b7280;margin:8px 0 22px}.webmcp-aeo-free-note{margin:0 0 14px;color:#116a4a;font-weight:600}
        .webmcp-aeo-follow{margin:0 0 18px;padding:18px 22px;border:1px solid #dfe3e8;border-left:5px solid #8c8f94;border-radius:14px;background:#fff}.webmcp-aeo-follow.is-on{border-left-color:#1a9c6b}.webmcp-aeo-follow h2{margin:0 0 6px;font-size:19px}.webmcp-aeo-follow p{margin:0;color:#5f6875}.webmcp-aeo-plan-state{margin:10px 0 0;color:#116a4a;font-weight:700}
        .webmcp-sov-beta{display:inline-block;vertical-align:4px;padding:3px 10px;border-radius:999px;background:#b7791f;color:#fff;font-size:13px;font-weight:700}
        .webmcp-sov-chart{display:block;width:100%;height:120px;margin:6px 0 10px;overflow:visible}
        @media(max-width:782px){.webmcp-aeo-hero{align-items:flex-start;flex-direction:column}.webmcp-aeo-checks li{grid-template-columns:38px minmax(0,1fr)}.webmcp-aeo-fix{grid-column:2;justify-self:start}}
CSS;
}

add_action('admin_head', 'webmcp_canary_admin_bar_styles');
add_action('wp_head', 'webmcp_canary_admin_bar_styles');
function webmcp_canary_admin_bar_styles() {
    // The menu icon shows on every admin screen, not just the plugin's own, so
    // its sizing must not depend on the plugin stylesheet being enqueued.
    // WordPress dims menu images to 60%; the brand mark is shown at full
    // strength so it does not read as a disabled item.
    echo '<style>.webmcp-aeo-admin-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:1px}'
        . '#adminmenu #toplevel_page_webmcp-canary .wp-menu-image img{width:20px;height:20px;padding:7px 0 0;opacity:1}'
        . '</style>';
}

/**
 * Read-only diagnostic state, rendered inside the settings screen's
 * collapsed "Advanced (for developers)" block.
 *
 * This is where the technical state lives now that the separate report screen
 * is gone. It reports only what this install actually holds - no tag or MCP
 * surface is presented to the operator.
 */
function webmcp_canary_developer_state_table($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $ruleset = webmcp_canary_ruleset_state();
    $cached_score = get_option(WEBMCP_CANARY_AEO_SCORE_OPTION, array());
    $seo_plugins = webmcp_canary_detect_active_seo_plugins();
    $api_bases = webmcp_canary_api_base_candidates();
    $never = __('(none)', 'nurevo-webmcp');

    $rows = array(
        __('Plan', 'nurevo-webmcp') => $settings['plan'],
        __('Nurevo site ID', 'nurevo-webmcp') => $settings['site_id'] !== '' ? $settings['site_id'] : $never,
        __('Site key configured', 'nurevo-webmcp') => $settings['site_key'] !== '' ? __('yes', 'nurevo-webmcp') : __('no', 'nurevo-webmcp'),
        __('License key configured', 'nurevo-webmcp') => $settings['license_key'] !== '' ? __('yes', 'nurevo-webmcp') : __('no', 'nurevo-webmcp'),
        __('Service endpoints', 'nurevo-webmcp') => !empty($api_bases) ? implode(', ', $api_bases) : $never,
        __('Central ruleset version', 'nurevo-webmcp') => intval($ruleset['version']) > 0 ? 'v' . intval($ruleset['version']) : $never,
        __('Ruleset last checked', 'nurevo-webmcp') => intval($ruleset['checked_at']) > 0
            ? wp_date('Y-m-d H:i', intval($ruleset['checked_at'])) : $never,
        __('Diagnosis cached at', 'nurevo-webmcp') => !empty($cached_score['saved_at'])
            ? wp_date('Y-m-d H:i', intval($cached_score['saved_at'])) : $never,
        __('Server-side schema output', 'nurevo-webmcp') => $settings['serve_schema'] === '1' ? __('on', 'nurevo-webmcp') : __('off', 'nurevo-webmcp'),
        __('llms.txt output', 'nurevo-webmcp') => $settings['serve_llms_txt'] === '1' ? __('on', 'nurevo-webmcp') : __('off', 'nurevo-webmcp'),
        __('AI crawler rules', 'nurevo-webmcp') => $settings['allow_ai_crawlers'] === '1' ? __('on', 'nurevo-webmcp') : __('off', 'nurevo-webmcp'),
        __('Detected SEO plugins', 'nurevo-webmcp') => !empty($seo_plugins) ? implode(', ', array_values($seo_plugins)) : $never,
        __('Plugin version', 'nurevo-webmcp') => WEBMCP_CANARY_VERSION,
    );

    $profile_state = webmcp_canary_profile_state();
    $rows[__('Store profile sync', 'nurevo-webmcp')] = webmcp_canary_profile_sync_enabled($settings)
        ? __('on', 'nurevo-webmcp') : __('off', 'nurevo-webmcp');
    $rows[__('Profile last synced', 'nurevo-webmcp')] = intval($profile_state['synced_at']) > 0
        ? wp_date('Y-m-d H:i', intval($profile_state['synced_at'])) : $never;
    $rows[__('Profile sync pending', 'nurevo-webmcp')] = !empty($profile_state['pending'])
        ? __('yes', 'nurevo-webmcp') : __('no', 'nurevo-webmcp');
    if (!empty($profile_state['last_error'])) {
        $rows[__('Profile last error', 'nurevo-webmcp')] = $profile_state['last_error'];
    }

    $html = '<table class="widefat striped webmcp-dev-state"><tbody>';
    foreach ($rows as $label => $value) {
        $html .= sprintf(
            '<tr><th scope="row">%1$s</th><td><code>%2$s</code></td></tr>',
            esc_html($label),
            esc_html((string) $value)
        );
    }
    $html .= '</tbody></table>';
    $html .= '<p class="description">' . esc_html__('Diagnostic state for this install. Nothing here needs to be changed for normal use.', 'nurevo-webmcp') . '</p>';
    return $html;
}

function webmcp_canary_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    webmcp_canary_pull_profile();
    $settings = webmcp_canary_settings();
    ?>
    <div class="wrap webmcp-settings">
        <?php echo webmcp_canary_screen_title(__('Nurevo AEO settings', 'nurevo-webmcp')); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in webmcp_canary_screen_title() ?>
        <p><?php echo esc_html__('AI readability diagnosis, structured data, llms.txt and AI crawler rules for this site.', 'nurevo-webmcp'); ?></p>
        <?php
        /*
         * The three steps, at the top, until the site is connected.
         *
         * The pairing instruction used to live only in the description under
         * the code field, which is halfway down a long form - so the one thing
         * a new install has to do was the easiest thing to miss. It disappears
         * once connected rather than nagging.
         */
        ?>
        <?php if ($settings['site_id'] === '' || $settings['profile_token'] === '') : ?>
            <div class="notice notice-info">
                <p><strong><?php esc_html_e('Connect this site to Nurevo', 'nurevo-webmcp'); ?></strong></p>
                <ol style="margin:6px 0 6px 22px">
                    <li><?php esc_html_e('Open the nurevo.jp dashboard and add this site.', 'nurevo-webmcp'); ?></li>
                    <li><?php esc_html_e('Press "Issue a pairing code" and copy the code.', 'nurevo-webmcp'); ?></li>
                    <li><?php esc_html_e('Paste it into the Pairing code field below and save.', 'nurevo-webmcp'); ?></li>
                </ol>
                <p>
                    <a class="button button-primary" href="<?php echo esc_url(webmcp_canary_dashboard_url()); ?>" target="_blank" rel="noopener">
                        <?php esc_html_e('Open the dashboard', 'nurevo-webmcp'); ?> &#8599;
                    </a>
                </p>
                <p class="description"><?php esc_html_e('Diagnosis, structured data and llms.txt already work without connecting. Connecting is what lets the dashboard show this site and keep its output current.', 'nurevo-webmcp'); ?></p>
            </div>
        <?php endif; ?>
        <?php if (!empty($_GET['webmcp_message']) && !empty($_GET['_wpnonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_wpnonce'])), 'webmcp_canary_notice')) : ?>
            <?php $webmcp_status = isset($_GET['webmcp_status']) ? sanitize_key(wp_unslash($_GET['webmcp_status'])) : ''; ?>
            <?php $webmcp_message = sanitize_text_field(wp_unslash($_GET['webmcp_message'])); ?>
            <?php $notice_class = ($webmcp_status === 'error') ? 'notice-error' : 'notice-success'; ?>
            <div class="notice <?php echo esc_attr($notice_class); ?> is-dismissible">
                <p><?php echo esc_html($webmcp_message); ?></p>
            </div>
        <?php endif; ?>
        <form action="options.php" method="post">
            <?php settings_fields('webmcp_canary'); ?>
            <table class="form-table" role="presentation">
                <?php do_settings_fields('webmcp_canary', 'webmcp_canary_main'); ?>
            </table>

            <details class="webmcp-dev-details">
                <summary><?php echo esc_html__('Advanced (for developers)', 'nurevo-webmcp'); ?></summary>
                <table class="form-table" role="presentation">
                    <?php do_settings_fields('webmcp_canary', 'webmcp_canary_advanced'); ?>
                </table>
                <?php echo webmcp_canary_developer_state_table($settings); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in webmcp_canary_developer_state_table() ?>
            </details>

            <?php submit_button(); ?>
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

add_action('wp_head', 'webmcp_canary_output_server_schema', 5);
function webmcp_canary_output_server_schema() {
    if (is_admin() || is_feed() || is_404() || is_search()) {
        return;
    }
    $settings = webmcp_canary_settings();
    if ($settings['enabled'] !== '1' || $settings['serve_schema'] !== '1') {
        return;
    }
    if (!get_option('blog_public')) {
        return;
    }

    $site_url  = !empty($settings['business_url']) ? $settings['business_url'] : home_url('/');
    $site_name = !empty($settings['business_name']) ? $settings['business_name'] : get_bloginfo('name');
    $site_desc = !empty($settings['business_description']) ? $settings['business_description'] : get_bloginfo('description');
    $org_id    = webmcp_canary_business_node_id($site_url . '#organization');
    $web_id    = $site_url . '#website';

    $graph = array();

    $org = array(
        '@type' => webmcp_canary_business_schema_type($settings),
        '@id'   => $org_id,
        'name'  => $site_name,
        'url'   => $site_url,
    );
    if ($site_desc !== '') {
        $org['description'] = $site_desc;
    }
    if (!empty($settings['business_address'])) {
        // A bare string is what this has always published, and a free site
        // keeps it. schema.org documents PostalAddress as the form for an
        // address, and an engine reading streetAddress does not have to parse
        // it out of prose - so following the criteria upgrades the shape.
        $org['address'] = webmcp_canary_ruleset_allows('postaladdress')
            ? array('@type' => 'PostalAddress', 'streetAddress' => $settings['business_address'])
            : $settings['business_address'];
    }
    if (!empty($settings['business_phone'])) {
        $org['telephone'] = $settings['business_phone'];
    }
    if (!empty($settings['business_hours'])) {
        $org['openingHours'] = $settings['business_hours'];
    }
    if (!empty($settings['business_email'])) {
        $org['email'] = $settings['business_email'];
    }
    $logo_id = get_theme_mod('custom_logo');
    if ($logo_id) {
        $logo_url = wp_get_attachment_image_url($logo_id, 'full');
        if ($logo_url) {
            $org['logo'] = $logo_url;
        }
    }
    $graph[] = $org;

    $graph[] = array(
        '@type'       => 'WebSite',
        '@id'         => $web_id,
        'url'         => $site_url,
        'name'        => $site_name,
        'description' => $site_desc,
        'publisher'   => array('@id' => $org_id),
    );

    if (is_singular()) {
        $post = get_queried_object();
        if ($post instanceof WP_Post) {
            $url       = get_permalink($post);
            $title     = get_the_title($post);
            $excerpt   = has_excerpt($post)
                ? get_the_excerpt($post)
                : wp_trim_words(wp_strip_all_tags($post->post_content), 40, '');
            $published = get_the_date('c', $post);
            $modified  = get_the_modified_date('c', $post);
            $is_post   = (get_post_type($post) === 'post');

            $node = array(
                '@type'            => $is_post ? 'BlogPosting' : 'WebPage',
                '@id'              => $url . '#' . ($is_post ? 'article' : 'webpage'),
                'url'              => $url,
                'name'             => $title,
                'headline'         => $title,
                'description'      => $excerpt,
                'datePublished'    => $published,
                'dateModified'     => $modified,
                'inLanguage'       => get_bloginfo('language'),
                'isPartOf'         => array('@id' => $web_id),
                'publisher'        => array('@id' => $org_id),
                'mainEntityOfPage' => $url,
            );
            if ($is_post) {
                $author = get_the_author_meta('display_name', $post->post_author);
                if ($author) {
                    $node['author'] = array('@type' => 'Person', 'name' => $author);
                }
            }
            $img = get_the_post_thumbnail_url($post, 'full');
            if ($img) {
                $node['image'] = $img;
            }
            $graph[] = $node;
        }
    } elseif (is_front_page() || is_home()) {
        $graph[] = array(
            '@type'       => 'WebPage',
            '@id'         => $site_url . '#webpage',
            'url'         => $site_url,
            'name'        => $site_name,
            'description' => $site_desc,
            'inLanguage'  => get_bloginfo('language'),
            'isPartOf'    => array('@id' => $web_id),
        );
    }

    $graph = webmcp_canary_filter_schema_graph($graph, $settings);

    // The hand-entered FAQ is content the operator typed into Nurevo, not
    // something read off their pages, so the FAQPage rule - which is about not
    // repeating an SEO plugin's own FAQ block - does not apply to it. It is
    // added after the filter for that reason, under an id of ours, so the two
    // documents stay separate if both appear.
    $faq_page_id = (int) ($settings['faq_page_id'] ?? 0);
    $on_faq_page = $faq_page_id > 0
        ? (is_singular() && get_queried_object_id() === $faq_page_id)
        : (is_front_page() || is_home());
    if ($on_faq_page) {
        $faq_node = webmcp_canary_faq_schema_node($faq_page_id > 0 ? get_permalink($faq_page_id) : $site_url);
        if ($faq_node !== null) {
            $graph[] = $faq_node;
        }
    }

    // Services are open ground - no booking plugin publishes schema at all, so
    // basis=always and there is nothing to stand down for. Published on the same
    // page as the FAQ, offered by the business node, under ids of ours.
    if ($on_faq_page) {
        foreach (webmcp_canary_service_schema_nodes($faq_page_id > 0 ? get_permalink($faq_page_id) : $site_url, $org_id) as $service_node) {
            $graph[] = $service_node;
        }
    }

    if (empty($graph)) {
        return;
    }

    $data = array(
        '@context' => 'https://schema.org',
        '@graph'   => $graph,
    );

    // Trusted JSON generated from this site's own data.
    echo "\n" . '<script type="application/ld+json" id="nurevo-aeo-server">' . wp_json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

add_action('wp_enqueue_scripts', 'webmcp_canary_enqueue_tag');
function webmcp_canary_enqueue_tag() {
    // Opt-in only. This is the one feature that loads a third-party script on
    // public pages and reports visitor-side activity to the service, and none of
    // the AEO output depends on it: schema is rendered by
    // webmcp_canary_output_server_schema(), llms.txt by
    // webmcp_canary_maybe_serve_llms_txt(), crawler rules by
    // webmcp_canary_allow_ai_crawlers_robots_txt(), and the diagnosis runs from
    // wp-admin. With load_tag off nothing is enqueued and no visitor data leaves
    // the site, so merely enabling the plugin never starts that traffic.
    if (is_admin()) {
        return;
    }
    $settings = webmcp_canary_settings();
    if ($settings['enabled'] !== '1' || $settings['load_tag'] !== '1' || empty($settings['tag_url'])) {
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
