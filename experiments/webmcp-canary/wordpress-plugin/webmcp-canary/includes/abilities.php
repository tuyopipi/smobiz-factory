<?php
/**
 * WordPress Abilities API (WordPress 6.9+): four read-only abilities.
 *
 * They let an AI assistant the site owner already uses (through the Abilities
 * REST API or an MCP adapter) ask what Nurevo publishes and what is left to
 * fix. Every one of them:
 *
 *  - only reads what this site already stores; none writes a setting,
 *  - never contacts the Nurevo service or any other remote or paid API (the
 *    AEO score is the last stored result, never a new diagnosis),
 *  - is limited to users who can manage_options,
 *  - returns nothing secret: no site key, tokens, licence or unpublished email.
 *
 * On WordPress before 6.9 the API functions do not exist and this file
 * registers nothing.
 *
 * @see https://developer.wordpress.org/apis/abilities-api/
 * @package WebMCP_Canary
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Is the Abilities API available on this WordPress? */
function webmcp_canary_abilities_available() {
    return function_exists('wp_register_ability') && function_exists('wp_register_ability_category');
}

/**
 * Hook registration, when the API exists. Abilities must be registered on
 * wp_abilities_api_init and their category on
 * wp_abilities_api_categories_init; core reports anything else as doing it
 * wrong. Returns whether the hooks were added.
 */
function webmcp_canary_abilities_bootstrap() {
    if (!webmcp_canary_abilities_available()) {
        return false;
    }
    add_action('wp_abilities_api_categories_init', 'webmcp_canary_register_ability_category');
    add_action('wp_abilities_api_init', 'webmcp_canary_register_abilities');
    return true;
}
webmcp_canary_abilities_bootstrap();

function webmcp_canary_register_ability_category() {
    if (!function_exists('wp_register_ability_category')) {
        return;
    }
    wp_register_ability_category('nurevo', array(
        'label' => __('Nurevo AEO', 'nurevo-webmcp'),
        'description' => __('Read-only information about what Nurevo AEO publishes for AI on this site.', 'nurevo-webmcp'),
    ));
}

/** Only administrators may read any of this. */
function webmcp_canary_abilities_permission($input = null) {
    return current_user_can('manage_options');
}

/** None of the abilities takes input; an empty object (or nothing) is accepted. */
function webmcp_canary_abilities_empty_input_schema() {
    return array(
        'type' => 'object',
        'properties' => array(),
        'additionalProperties' => false,
        'default' => array(),
    );
}

/** Behaviour hints read by tooling (WP_Ability meta.annotations). */
function webmcp_canary_abilities_meta() {
    return array(
        'annotations' => array(
            'readonly' => true,
            'destructive' => false,
            'idempotent' => true,
        ),
        'show_in_rest' => true,
    );
}

/** Ability name => registration arguments. */
function webmcp_canary_ability_definitions() {
    $nullable_string = array('type' => array('string', 'null'));
    $checklist = array(
        'type' => 'object',
        'properties' => array(
            'total' => array('type' => 'integer'),
            'ok' => array('type' => 'integer'),
            'warn' => array('type' => 'integer'),
            'bad' => array('type' => 'integer'),
        ),
    );
    return array(
        'nurevo/get-status' => array(
            'label' => __('Get Nurevo AEO status', 'nurevo-webmcp'),
            'description' => __('Whether Nurevo AEO output is on, which outputs are active (JSON-LD, llms.txt, robots.txt rules), the AI training crawler choice, whether the site is connected to nurevo.jp, the plan, and whether diagnosis consent was given.', 'nurevo-webmcp'),
            'execute_callback' => 'webmcp_canary_ability_get_status',
            'output_schema' => array(
                'type' => 'object',
                'required' => array('output_enabled', 'outputs', 'ai_training', 'connected', 'plan', 'consent'),
                'properties' => array(
                    'output_enabled' => array('type' => 'boolean'),
                    'outputs' => array(
                        'type' => 'object',
                        'properties' => array(
                            'json_ld' => array('type' => 'boolean'),
                            'llms_txt' => array('type' => 'boolean'),
                            'robots_rules' => array('type' => 'boolean'),
                        ),
                    ),
                    'ai_training' => array('type' => 'string', 'enum' => array('default', 'allow', 'block')),
                    'search_engines_allowed' => array('type' => 'boolean'),
                    'llms_txt_url' => array('type' => 'string'),
                    'connected' => array('type' => 'boolean'),
                    'plan' => array('type' => 'string', 'enum' => array('free', 'standard', 'pro')),
                    'consent' => array('type' => 'boolean'),
                    'version' => array('type' => 'string'),
                ),
            ),
        ),
        'nurevo/get-aeo-score' => array(
            'label' => __('Get the last AEO score', 'nurevo-webmcp'),
            'description' => __('The last stored AEO diagnosis: score out of 100, band, date and a checklist summary. It never runs a new diagnosis.', 'nurevo-webmcp'),
            'execute_callback' => 'webmcp_canary_ability_get_aeo_score',
            'output_schema' => array(
                'type' => 'object',
                'required' => array('available', 'message'),
                'properties' => array(
                    'available' => array('type' => 'boolean'),
                    'score' => array('type' => array('integer', 'null')),
                    'band' => array('type' => array('string', 'null'), 'description' => 'green, yellow or red'),
                    'readiness' => array('type' => array('integer', 'null'), 'description' => 'AI readiness: the on-site part of the score'),
                    'visibility' => array('type' => array('integer', 'null'), 'description' => 'AI visibility measured from AI answers; null when not measured'),
                    'visibility_answers' => array('type' => 'integer', 'description' => 'AI answers the visibility is based on (0 = not measured)'),
                    'band_label' => $nullable_string,
                    'date' => array('type' => array('string', 'null'), 'format' => 'date-time'),
                    'checklist' => $checklist,
                    'checks' => array(
                        'type' => 'array',
                        'items' => array(
                            'type' => 'object',
                            'properties' => array(
                                'id' => array('type' => 'string'),
                                'label' => array('type' => 'string'),
                                'status' => array('type' => 'string', 'enum' => array('OK', 'WARN', 'BAD')),
                            ),
                        ),
                    ),
                    'message' => array('type' => 'string'),
                    'admin_url' => array('type' => 'string'),
                ),
            ),
        ),
        'nurevo/get-fixes' => array(
            'label' => __('Get AEO fixes', 'nurevo-webmcp'),
            'description' => __('The items in the last stored AEO diagnosis that need attention (WARN or BAD), each with a plain-language next step.', 'nurevo-webmcp'),
            'execute_callback' => 'webmcp_canary_ability_get_fixes',
            'output_schema' => array(
                'type' => 'object',
                'required' => array('available', 'fixes', 'message'),
                'properties' => array(
                    'available' => array('type' => 'boolean'),
                    'date' => array('type' => array('string', 'null'), 'format' => 'date-time'),
                    'fixes' => array(
                        'type' => 'array',
                        'items' => array(
                            'type' => 'object',
                            'required' => array('id', 'status', 'label', 'next_step'),
                            'properties' => array(
                                'id' => array('type' => 'string'),
                                'status' => array('type' => 'string', 'enum' => array('WARN', 'BAD')),
                                'label' => array('type' => 'string'),
                                'finding' => array('type' => 'string'),
                                'next_step' => array('type' => 'string'),
                                'where' => array('type' => 'string'),
                            ),
                        ),
                    ),
                    'message' => array('type' => 'string'),
                ),
            ),
        ),
        'nurevo/get-business-profile' => array(
            'label' => __('Get the published business profile', 'nurevo-webmcp'),
            'description' => __('The business facts Nurevo AEO publishes in this site’s JSON-LD: type, name, description, URL, address, phone, opening hours and any published email.', 'nurevo-webmcp'),
            'execute_callback' => 'webmcp_canary_ability_get_business_profile',
            'output_schema' => array(
                'type' => 'object',
                'required' => array('published', 'type', 'name'),
                'properties' => array(
                    'published' => array('type' => 'boolean'),
                    'type' => array('type' => 'string'),
                    'name' => array('type' => 'string'),
                    'description' => $nullable_string,
                    'url' => $nullable_string,
                    'address' => $nullable_string,
                    'telephone' => $nullable_string,
                    'email' => $nullable_string,
                    'opening_hours' => $nullable_string,
                    'opening_hours_specification' => array('type' => 'array', 'items' => array('type' => 'object')),
                    'json_ld' => array('type' => 'object'),
                    'message' => array('type' => 'string'),
                ),
            ),
        ),
    );
}

function webmcp_canary_register_abilities() {
    if (!function_exists('wp_register_ability')) {
        return;
    }
    foreach (webmcp_canary_ability_definitions() as $name => $definition) {
        wp_register_ability($name, array(
            'label' => $definition['label'],
            'description' => $definition['description'],
            'category' => 'nurevo',
            'input_schema' => webmcp_canary_abilities_empty_input_schema(),
            'output_schema' => $definition['output_schema'],
            'execute_callback' => $definition['execute_callback'],
            'permission_callback' => 'webmcp_canary_abilities_permission',
            'meta' => webmcp_canary_abilities_meta(),
        ));
    }
}

/* -----------------------------------------------------------------------
 * Callbacks. Local reads only.
 * --------------------------------------------------------------------- */

function webmcp_canary_ability_get_status($input = null) {
    $settings = webmcp_canary_settings();
    $enabled = $settings['enabled'] === '1';
    $training = in_array($settings['ai_training'], array('default', 'allow', 'block'), true) ? $settings['ai_training'] : 'default';
    $plan = in_array($settings['plan'], array('free', 'standard', 'pro'), true) ? $settings['plan'] : 'free';
    return array(
        'output_enabled' => $enabled,
        'outputs' => array(
            'json_ld' => $enabled && $settings['serve_schema'] === '1',
            'llms_txt' => $enabled && $settings['serve_llms_txt'] === '1',
            'robots_rules' => $enabled && $settings['allow_ai_crawlers'] === '1',
        ),
        'ai_training' => $training,
        'search_engines_allowed' => (bool) get_option('blog_public', true),
        'llms_txt_url' => home_url('/llms.txt'),
        'connected' => (string) $settings['site_id'] !== '',
        'plan' => $plan,
        'consent' => webmcp_canary_has_consent($settings),
        'version' => WEBMCP_CANARY_VERSION,
    );
}

/** The last diagnosis this site stored, or null. Never fetched here. */
function webmcp_canary_ability_stored_score() {
    $stored = get_option(WEBMCP_CANARY_AEO_SCORE_OPTION, array());
    if (!is_array($stored) || empty($stored['data']) || !webmcp_canary_validate_aeo_score($stored['data'])) {
        return null;
    }
    return $stored;
}

/** What to say when there is no stored diagnosis. */
function webmcp_canary_ability_no_score_message() {
    return webmcp_canary_has_consent()
        ? __('No AEO diagnosis is stored yet. In WordPress admin, open Nurevo AEO > AEO Score; the diagnosis runs there.', 'nurevo-webmcp')
        : __('No AEO diagnosis has been run yet. In WordPress admin, open Nurevo AEO > AEO Score and press Run diagnosis. Nothing is sent to the Nurevo service until you agree there.', 'nurevo-webmcp');
}

function webmcp_canary_ability_score_date($stored) {
    return !empty($stored['saved_at']) ? gmdate('c', (int) $stored['saved_at']) : null;
}

function webmcp_canary_ability_get_aeo_score($input = null) {
    $admin_url = admin_url('admin.php?page=webmcp-canary');
    $stored = webmcp_canary_ability_stored_score();
    if ($stored === null) {
        return array(
            'available' => false,
            'score' => null,
            'band' => null,
            'readiness' => null,
            'visibility' => null,
            'visibility_answers' => 0,
            'band_label' => null,
            'date' => null,
            'checklist' => array('total' => 0, 'ok' => 0, 'warn' => 0, 'bad' => 0),
            'checks' => array(),
            'message' => webmcp_canary_ability_no_score_message(),
            'admin_url' => $admin_url,
        );
    }
    $data = $stored['data'];
    $view = webmcp_canary_aeo_view($data);
    $counts = array('total' => 0, 'ok' => 0, 'warn' => 0, 'bad' => 0);
    $checks = array();
    foreach ($data['checks'] as $check) {
        $status = strtoupper((string) $check['status']);
        $counts['total']++;
        $counts[strtolower($status)]++;
        $wording = webmcp_canary_aeo_check_view($check);
        $checks[] = array('id' => (string) $check['id'], 'label' => (string) $wording['label'], 'status' => $status);
    }
    return array(
        'available' => true,
        'score' => $view['score'],
        'band' => $view['band'],
        'readiness' => is_array($view['breakdown']) ? $view['breakdown']['readiness'] : null,
        'visibility' => is_array($view['breakdown']) ? $view['breakdown']['visibility'] : null,
        'visibility_answers' => is_array($view['breakdown']) ? $view['breakdown']['answers'] : 0,
        'band_label' => $view['badge'],
        'date' => webmcp_canary_ability_score_date($stored),
        'checklist' => $counts,
        'checks' => $checks,
        'message' => $view['heading'],
        'admin_url' => $admin_url,
    );
}

/** A plain-language next step for one finding. */
function webmcp_canary_ability_next_step($check) {
    $status = strtoupper((string) $check['status']);
    $action = webmcp_canary_check_action((string) $check['id'], $status);
    if (is_array($action) && $action['mode'] === 'fix') {
        return array(
            'next_step' => trim(sprintf(
                /* translators: 1: button label, e.g. "Fix it". 2: what the button does. */
                __('On the Nurevo AEO > AEO Score screen, press "%1$s" next to this item. %2$s', 'nurevo-webmcp'),
                $action['label'],
                $action['hint']
            )),
            'where' => admin_url('admin.php?page=webmcp-canary'),
        );
    }
    if (is_array($action) && $action['mode'] === 'form') {
        return array(
            'next_step' => trim(__('Open Nurevo AEO > Settings and fill in the business details.', 'nurevo-webmcp') . ' ' . $action['hint']),
            'where' => admin_url('admin.php?page=webmcp-canary-settings'),
        );
    }
    if (is_array($action) && !empty($action['hint'])) {
        return array('next_step' => $action['hint'], 'where' => admin_url('admin.php?page=webmcp-canary'));
    }
    // A check this version does not know: the service's own hints, if any.
    $hints = isset($check['hints']) && is_array($check['hints']) ? array_filter(array_map('strval', $check['hints'])) : array();
    return array(
        'next_step' => !empty($hints) ? implode(' ', $hints) : __('See this item on the Nurevo AEO > AEO Score screen for details.', 'nurevo-webmcp'),
        'where' => admin_url('admin.php?page=webmcp-canary'),
    );
}

function webmcp_canary_ability_get_fixes($input = null) {
    $stored = webmcp_canary_ability_stored_score();
    if ($stored === null) {
        return array('available' => false, 'date' => null, 'fixes' => array(), 'message' => webmcp_canary_ability_no_score_message());
    }
    $fixes = array();
    foreach ($stored['data']['checks'] as $check) {
        $status = strtoupper((string) $check['status']);
        if ($status !== 'WARN' && $status !== 'BAD') {
            continue;
        }
        $wording = webmcp_canary_aeo_check_view($check);
        $fixes[] = array_merge(array(
            'id' => (string) $check['id'],
            'status' => $status,
            'label' => (string) $wording['label'],
            'finding' => (string) $wording['message'],
        ), webmcp_canary_ability_next_step($check));
    }
    return array(
        'available' => true,
        'date' => webmcp_canary_ability_score_date($stored),
        'fixes' => $fixes,
        'message' => empty($fixes)
            ? __('Nothing to fix: every item in the last diagnosis passed.', 'nurevo-webmcp')
            /* translators: %d: number of diagnosis items that need attention. */
            : sprintf(__('%d item(s) in the last diagnosis need attention.', 'nurevo-webmcp'), count($fixes)),
    );
}

/**
 * The business node exactly as the JSON-LD carries it, so this can only ever
 * return what is already public. Anything that is not a public schema.org
 * property of that node (site key, tokens, the owner's email) never enters it.
 */
function webmcp_canary_ability_get_business_profile($input = null) {
    $settings = webmcp_canary_settings();
    $bundle = webmcp_canary_own_schema_bundle();
    $node = array();
    foreach ($bundle['core'] as $candidate) {
        if (is_array($candidate) && isset($candidate['@id']) && $candidate['@id'] === $bundle['org_id']) {
            $node = $candidate;
            break;
        }
    }
    if (empty($node) && !empty($bundle['core'][0]) && is_array($bundle['core'][0])) {
        $node = $bundle['core'][0];
    }
    $scalar = function ($value) {
        return is_scalar($value) && (string) $value !== '' ? (string) $value : null;
    };
    $address = null;
    if (isset($node['address'])) {
        if (is_array($node['address'])) {
            $parts = array();
            foreach (array('streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry') as $part) {
                if (!empty($node['address'][$part]) && is_scalar($node['address'][$part])) {
                    $parts[] = (string) $node['address'][$part];
                }
            }
            $address = $parts ? implode(', ', $parts) : null;
        } else {
            $address = $scalar($node['address']);
        }
    }
    $type = isset($node['@type']) ? (is_array($node['@type']) ? implode(', ', array_map('strval', $node['@type'])) : (string) $node['@type']) : webmcp_canary_business_schema_type($settings);
    $published = $settings['enabled'] === '1' && $settings['serve_schema'] === '1';
    return array(
        'published' => $published,
        'type' => $type,
        'name' => (string) ($scalar($node['name'] ?? null) ?? ''),
        'description' => $scalar($node['description'] ?? null),
        'url' => $scalar($node['url'] ?? null),
        'address' => $address,
        'telephone' => $scalar($node['telephone'] ?? null),
        'email' => $scalar($node['email'] ?? null),
        'opening_hours' => $scalar($node['openingHours'] ?? null),
        'opening_hours_specification' => isset($node['openingHoursSpecification']) && is_array($node['openingHoursSpecification']) ? array_values($node['openingHoursSpecification']) : array(),
        'json_ld' => $node,
        'message' => $published
            ? __('These facts are published in this site’s JSON-LD.', 'nurevo-webmcp')
            : __('Output is off, so these facts are not published yet. Switch it on in Nurevo AEO > Settings.', 'nurevo-webmcp'),
    );
}
