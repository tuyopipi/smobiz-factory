<?php
/**
 * First-run setup wizard: Nurevo AEO > Setup.
 *
 * Four short steps from install to "readable by AI": what kind of business
 * this is, its basic facts, what to publish, and a summary. Everything is a
 * server-rendered form posted to admin-post.php; assets/setup-wizard.js only
 * moves focus and highlights the chosen card.
 *
 * Nothing here has a store of its own for settings: every value goes through
 * webmcp_canary_sanitize_settings() into the plugin's one settings option. The
 * only extra state is the wizard's progress (which step was last saved, and
 * whether it was finished or skipped), so it can resume.
 *
 * Nothing here contacts the Nurevo service before the diagnosis consent is
 * given, and the diagnosis on the last step goes through the same function
 * (and the same cache) as the AEO Score screen.
 *
 * @package WebMCP_Canary
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Wizard progress: array{step:int, status:string, updated_at:int}. */
if (!defined('WEBMCP_CANARY_WIZARD_OPTION')) {
    define('WEBMCP_CANARY_WIZARD_OPTION', 'webmcp_canary_setup_wizard');
}
/** Set on a single interactive activation, consumed on the next admin_init. */
if (!defined('WEBMCP_CANARY_WIZARD_REDIRECT_TRANSIENT')) {
    define('WEBMCP_CANARY_WIZARD_REDIRECT_TRANSIENT', 'webmcp_canary_setup_redirect');
}
/** User meta: this user dismissed the "setup is not finished" notice. */
if (!defined('WEBMCP_CANARY_WIZARD_NOTICE_META')) {
    define('WEBMCP_CANARY_WIZARD_NOTICE_META', 'webmcp_canary_setup_notice_dismissed');
}
/** The admin page slug. Starts with webmcp-canary so the shared styles apply. */
if (!defined('WEBMCP_CANARY_WIZARD_PAGE')) {
    define('WEBMCP_CANARY_WIZARD_PAGE', 'webmcp-canary-setup');
}
define('WEBMCP_CANARY_WIZARD_STEPS', 4);

/** The wizard's URL, optionally at a given step. */
function webmcp_canary_wizard_url($step = 0, $args = array()) {
    $query = array('page' => WEBMCP_CANARY_WIZARD_PAGE);
    if ((int) $step > 0) {
        $query['step'] = (int) $step;
    }
    return add_query_arg(array_merge($query, $args), admin_url('admin.php'));
}

/** Stored progress, with defaults. */
function webmcp_canary_wizard_state() {
    $state = get_option(WEBMCP_CANARY_WIZARD_OPTION, array());
    $state = wp_parse_args(is_array($state) ? $state : array(), array('step' => 0, 'status' => '', 'updated_at' => 0));
    $state['step'] = max(0, min(WEBMCP_CANARY_WIZARD_STEPS, (int) $state['step']));
    $state['status'] = in_array($state['status'], array('', 'in_progress', 'skipped', 'done'), true) ? $state['status'] : '';
    return $state;
}

function webmcp_canary_wizard_save_state($step, $status) {
    $current = webmcp_canary_wizard_state();
    update_option(WEBMCP_CANARY_WIZARD_OPTION, array(
        'step' => max($current['step'], max(0, min(WEBMCP_CANARY_WIZARD_STEPS, (int) $step))),
        'status' => $status,
        'updated_at' => time(),
    ), false);
}

/** The step to open when none is asked for: the one after the last saved. */
function webmcp_canary_wizard_resume_step($state = null) {
    $state = is_array($state) ? $state : webmcp_canary_wizard_state();
    return max(1, min(WEBMCP_CANARY_WIZARD_STEPS, $state['step'] + 1));
}

/**
 * Already set up: connected (a site key), or the business name and address
 * are both filled in. Such a site is never sent to the wizard automatically.
 */
function webmcp_canary_wizard_site_configured($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    if (trim((string) ($settings['site_key'] ?? '')) !== '') {
        return true;
    }
    return trim((string) ($settings['business_name'] ?? '')) !== ''
        && trim((string) ($settings['business_address'] ?? '')) !== '';
}

/* -----------------------------------------------------------------------
 * The one-time redirect after activation.
 * --------------------------------------------------------------------- */

/**
 * How the current request was made, for the redirect decision. Tests pass
 * their own; in WordPress it is read from the request.
 */
function webmcp_canary_wizard_request_context() {
    // phpcs:disable WordPress.Security.NonceVerification.Recommended, WordPress.Security.NonceVerification.Missing -- read-only checks of how this request was made; nothing is saved from them.
    $actions = array();
    foreach (array('action', 'action2') as $key) {
        if (isset($_POST[$key])) {
            $actions[] = sanitize_key(wp_unslash($_POST[$key]));
        }
        if (isset($_GET[$key])) {
            $actions[] = sanitize_key(wp_unslash($_GET[$key]));
        }
    }
    $bulk = isset($_GET['activate-multi']) || in_array('activate-selected', $actions, true);
    // phpcs:enable
    return array(
        'cli' => defined('WP_CLI') && WP_CLI,
        'ajax' => function_exists('wp_doing_ajax') ? wp_doing_ajax() : (defined('DOING_AJAX') && DOING_AJAX),
        'rest' => defined('REST_REQUEST') && REST_REQUEST,
        'network' => function_exists('is_network_admin') && is_network_admin(),
        'bulk' => $bulk,
    );
}

/** True when the request is one that must never be redirected. */
function webmcp_canary_wizard_context_blocks($context) {
    $context = wp_parse_args(is_array($context) ? $context : array(), array('cli' => false, 'ajax' => false, 'rest' => false, 'network' => false, 'bulk' => false));
    return $context['cli'] || $context['ajax'] || $context['rest'] || $context['network'] || $context['bulk'];
}

/**
 * Called from the activation hook. Flags a redirect only for a single,
 * interactive, per-site activation by an administrator of a site that is not
 * already set up. Returns whether the flag was set.
 */
function webmcp_canary_wizard_flag_redirect($network_wide = false, $context = null) {
    $context = is_array($context) ? $context : webmcp_canary_wizard_request_context();
    if ($network_wide || webmcp_canary_wizard_context_blocks($context)) {
        return false;
    }
    if (!current_user_can('manage_options') || webmcp_canary_wizard_site_configured()) {
        return false;
    }
    $state = webmcp_canary_wizard_state();
    if (in_array($state['status'], array('done', 'skipped'), true)) {
        return false;
    }
    set_transient(WEBMCP_CANARY_WIZARD_REDIRECT_TRANSIENT, (int) get_current_user_id(), 60);
    return true;
}

/**
 * Consume the flag. Returns the URL to redirect to, or '' for no redirect.
 * The flag is deleted whatever the outcome, so it can fire at most once.
 */
function webmcp_canary_wizard_redirect_target($context = null) {
    $flag = get_transient(WEBMCP_CANARY_WIZARD_REDIRECT_TRANSIENT);
    if ($flag === false) {
        return '';
    }
    delete_transient(WEBMCP_CANARY_WIZARD_REDIRECT_TRANSIENT);
    $context = is_array($context) ? $context : webmcp_canary_wizard_request_context();
    if (webmcp_canary_wizard_context_blocks($context)) {
        return '';
    }
    if (!current_user_can('manage_options') || (int) $flag !== (int) get_current_user_id()) {
        return '';
    }
    if (webmcp_canary_wizard_site_configured()) {
        return '';
    }
    return webmcp_canary_wizard_url();
}

add_action('admin_init', 'webmcp_canary_wizard_maybe_redirect', 1);
function webmcp_canary_wizard_maybe_redirect() {
    $target = webmcp_canary_wizard_redirect_target();
    if ($target === '') {
        return;
    }
    wp_safe_redirect($target);
    exit;
}

/* -----------------------------------------------------------------------
 * Menu, assets and the "not finished" notice.
 * --------------------------------------------------------------------- */

add_action('admin_menu', 'webmcp_canary_wizard_menu', 20);
function webmcp_canary_wizard_menu() {
    if (!current_user_can('manage_options')) {
        return;
    }
    add_submenu_page(
        'webmcp-canary',
        __('Set up Nurevo AEO', 'nurevo-webmcp'),
        __('Setup', 'nurevo-webmcp'),
        'manage_options',
        WEBMCP_CANARY_WIZARD_PAGE,
        'webmcp_canary_wizard_page'
    );
}

add_action('admin_enqueue_scripts', 'webmcp_canary_wizard_enqueue', 20);
function webmcp_canary_wizard_enqueue($hook_suffix) {
    if (strpos((string) $hook_suffix, WEBMCP_CANARY_WIZARD_PAGE) === false) {
        return;
    }
    // The shared chrome stylesheet is registered by webmcp_canary_admin_enqueue_styles().
    wp_add_inline_style('webmcp-canary-admin', webmcp_canary_wizard_styles());
    wp_enqueue_script('webmcp-canary-setup-wizard', webmcp_canary_asset_url('setup-wizard.js'), array(), WEBMCP_CANARY_VERSION, true);
}

function webmcp_canary_wizard_styles() {
    return <<<'CSS'
        .webmcp-wizard{max-width:880px}
        .webmcp-wizard-steps{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:14px 0 18px;padding:0}
        .webmcp-wizard-steps li{display:flex;align-items:center;gap:8px;margin:0;padding:5px 14px 5px 5px;border-radius:999px;background:#f0f0f1;color:#50575e;font-weight:500}
        .webmcp-wizard-steps .webmcp-wizard-num{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#fff;border:1px solid #c3c4c7;font-weight:600;color:#1d2327}
        .webmcp-wizard-steps li.is-done .webmcp-wizard-num{background:#00a32a;border-color:#00a32a;color:#fff}
        .webmcp-wizard-steps li.is-current{background:#2271b1;color:#fff}
        .webmcp-wizard-steps li.is-current .webmcp-wizard-num{border-color:#fff;color:#2271b1}
        .webmcp-wizard-panel{background:#fff;border:1px solid #c3c4c7;border-radius:8px;padding:8px 24px 20px;box-shadow:0 1px 1px rgba(0,0,0,.04)}
        .webmcp-wizard-panel h2{font-size:20px;margin:16px 0 4px}
        .webmcp-wizard-panel h2:focus{outline:none}
        .webmcp-wizard-stepnum{margin:16px 0 0;color:#646970;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
        .webmcp-wizard-lead{margin:4px 0 16px;color:#50575e;font-size:14px}
        .webmcp-wizard fieldset{margin:0 0 18px;padding:0;border:0;min-width:0}
        .webmcp-wizard legend{padding:0;margin:0 0 8px;font-size:14px;font-weight:600;color:#1d2327}
        .webmcp-wizard-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
        .webmcp-wizard-card{position:relative;display:block;margin:0;padding:14px 14px 14px 42px;border:1px solid #c3c4c7;border-radius:8px;background:#fff;cursor:pointer;min-height:44px}
        .webmcp-wizard-card input[type=radio]{position:absolute;left:14px;top:16px;margin:0}
        .webmcp-wizard-card strong{display:block;font-size:14px;line-height:1.4;color:#1d2327}
        .webmcp-wizard-card .webmcp-wizard-card-hint{display:block;margin-top:2px;color:#646970;font-size:13px;line-height:1.4}
        .webmcp-wizard-card:hover{border-color:#8c8f94}
        .webmcp-wizard-card.is-selected,.webmcp-wizard-card:has(input:checked){border-color:#2271b1;box-shadow:0 0 0 1px #2271b1;background:#f0f6fc}
        .webmcp-wizard-card:focus-within{outline:2px solid #2271b1;outline-offset:2px}
        .webmcp-wizard-note{margin:12px 0 0;padding:10px 12px;background:#f0f6fc;border-left:4px solid #72aee6;color:#1d2327}
        .webmcp-wizard-field{margin:0 0 14px}
        .webmcp-wizard-field label{display:block;margin:0 0 4px;font-weight:600;color:#1d2327}
        .webmcp-wizard-field input[type=text],.webmcp-wizard-field input[type=tel],.webmcp-wizard-field textarea{width:100%;max-width:600px}
        .webmcp-wizard-field .description{margin:4px 0 0}
        .webmcp-wizard-field.is-missing input,.webmcp-wizard-field.is-missing textarea{border-color:#d63638;box-shadow:0 0 0 1px #d63638}
        .webmcp-wizard-missing{color:#b32d2e;font-weight:600}
        .webmcp-wizard-hours{margin:6px 0 0;padding:8px 12px;max-width:576px;background:#f6f7f7;border-radius:4px}
        .webmcp-wizard-hours ul{margin:4px 0 0 18px;list-style:disc}
        .webmcp-wizard-hours li{margin:0}
        .webmcp-wizard-switch{display:flex;gap:10px;align-items:flex-start;margin:0;padding:14px;border:1px solid #c3c4c7;border-radius:8px;background:#fff}
        .webmcp-wizard-switch input{margin-top:3px}
        .webmcp-wizard-switch strong{display:block;font-size:14px}
        .webmcp-wizard-choice{display:block;margin:0 0 8px}
        .webmcp-wizard-choice .description{display:block;margin:2px 0 0 24px}
        .webmcp-wizard fieldset.webmcp-wizard-consent{padding:14px 16px;border:1px solid #dcdcde;border-radius:8px;background:#f6f7f7}
        .webmcp-wizard-consent p{margin:0 0 8px}
        .webmcp-wizard-consent legend{float:left;width:100%;margin:0 0 8px}
        .webmcp-wizard-consent legend+*{clear:both}
        .webmcp-wizard-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:22px 0 0;padding-top:16px;border-top:1px solid #f0f0f1}
        .webmcp-wizard-actions .webmcp-wizard-skip{margin-left:auto}
        .webmcp-wizard-score{display:flex;align-items:center;gap:16px;margin:8px 0 16px}
        .webmcp-wizard-score strong{font-size:40px;line-height:1}
        .webmcp-wizard-next{margin:0 0 0 18px;list-style:disc}
        .webmcp-wizard-next li{margin:0 0 8px}
        .webmcp-wizard-upsell{color:#646970}
        @media(max-width:600px){.webmcp-wizard-panel{padding:4px 14px 16px}.webmcp-wizard-actions .webmcp-wizard-skip{margin-left:0}}
CSS;
}

add_action('admin_notices', 'webmcp_canary_wizard_skipped_notice');
/**
 * One quiet notice after a skip, on Nurevo's own screens only, until it is
 * dismissed or setup is finished.
 */
function webmcp_canary_wizard_skipped_notice() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $page = isset($_GET['page']) ? sanitize_key(wp_unslash($_GET['page'])) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only screen check.
    if (strpos($page, 'webmcp-canary') !== 0 || $page === WEBMCP_CANARY_WIZARD_PAGE) {
        return;
    }
    if (webmcp_canary_wizard_state()['status'] !== 'skipped') {
        return;
    }
    if (get_user_meta(get_current_user_id(), WEBMCP_CANARY_WIZARD_NOTICE_META, true)) {
        return;
    }
    $dismiss_url = wp_nonce_url(add_query_arg(array('page' => $page, 'nurevo_dismiss_setup' => '1'), admin_url('admin.php')), 'webmcp_canary_dismiss_setup');
    printf(
        '<div id="nurevo-setup-notice" class="notice notice-info is-dismissible"><p>%1$s <a href="%2$s">%3$s</a> <a class="webmcp-setup-notice-hide" href="%4$s">%5$s</a></p></div>',
        esc_html__('Nurevo AEO setup is not finished. It takes about three minutes.', 'nurevo-webmcp'),
        esc_url(webmcp_canary_wizard_url()),
        esc_html__('Resume setup', 'nurevo-webmcp'),
        esc_url($dismiss_url),
        esc_html__('Do not show again', 'nurevo-webmcp')
    );
    // The close button is JavaScript-only in WordPress; this tells the server.
    printf(
        '<script>(function(){var n=document.getElementById("nurevo-setup-notice");if(!n){return;}n.addEventListener("click",function(e){if(!e.target||!e.target.classList||!e.target.classList.contains("notice-dismiss")){return;}var b=new URLSearchParams({action:"webmcp_canary_dismiss_setup_notice",nonce:%1$s});fetch(%2$s,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:b.toString()});});}());</script>',
        wp_json_encode(wp_create_nonce('webmcp_canary_dismiss_setup')),
        wp_json_encode(admin_url('admin-ajax.php'))
    );
}

/** Remember that this user dismissed the notice. */
function webmcp_canary_wizard_dismiss_notice_for_user($user_id) {
    $user_id = (int) $user_id;
    if ($user_id <= 0) {
        return false;
    }
    update_user_meta($user_id, WEBMCP_CANARY_WIZARD_NOTICE_META, 1);
    return true;
}

add_action('wp_ajax_webmcp_canary_dismiss_setup_notice', 'webmcp_canary_wizard_dismiss_notice_ajax');
function webmcp_canary_wizard_dismiss_notice_ajax() {
    check_ajax_referer('webmcp_canary_dismiss_setup', 'nonce');
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'forbidden'), 403);
    }
    webmcp_canary_wizard_dismiss_notice_for_user(get_current_user_id());
    wp_send_json_success();
}

add_action('admin_init', 'webmcp_canary_wizard_maybe_dismiss_notice');
/** The no-JavaScript route: the "Do not show again" link. */
function webmcp_canary_wizard_maybe_dismiss_notice() {
    if (empty($_GET['nurevo_dismiss_setup']) || !current_user_can('manage_options')) {
        return false;
    }
    $nonce = isset($_GET['_wpnonce']) ? sanitize_text_field(wp_unslash($_GET['_wpnonce'])) : '';
    if (!wp_verify_nonce($nonce, 'webmcp_canary_dismiss_setup')) {
        return false;
    }
    return webmcp_canary_wizard_dismiss_notice_for_user(get_current_user_id());
}

/* -----------------------------------------------------------------------
 * Step data.
 * --------------------------------------------------------------------- */

/** Steps: number => title. */
function webmcp_canary_wizard_steps() {
    return array(
        1 => __('Site type', 'nurevo-webmcp'),
        2 => __('Business info', 'nurevo-webmcp'),
        3 => __('Visibility to AI', 'nurevo-webmcp'),
        4 => __('Done', 'nurevo-webmcp'),
    );
}

/**
 * The cards on step 1, each mapped to the business_type setting.
 *
 * `type` is what a card sets; `family` is every type in
 * webmcp_canary_local_business_types() that already counts as that card, so a
 * site set up as a Dentist is shown "Clinic or dental" and stays a Dentist.
 * "Other" sets no type: the plugin then publishes LocalBusiness or
 * Organization depending on whether there is an address, phone or hours.
 */
function webmcp_canary_wizard_site_types() {
    return array(
        'restaurant' => array(
            'label' => __('Restaurant or café', 'nurevo-webmcp'),
            'hint' => __('Restaurants, cafés, bakeries and bars', 'nurevo-webmcp'),
            'type' => 'Restaurant',
            'family' => array('Restaurant', 'CafeOrCoffeeShop', 'Bakery', 'BarOrPub'),
        ),
        'beauty' => array(
            'label' => __('Beauty salon', 'nurevo-webmcp'),
            'hint' => __('Hair, nail and beauty salons, spas', 'nurevo-webmcp'),
            'type' => 'BeautySalon',
            'family' => array('BeautySalon', 'HairSalon', 'NailSalon', 'DaySpa', 'HealthAndBeautyBusiness'),
        ),
        'clinic' => array(
            'label' => __('Clinic or dental', 'nurevo-webmcp'),
            'hint' => __('Clinics, dentists, doctors and vets', 'nurevo-webmcp'),
            'type' => 'MedicalBusiness',
            'family' => array('MedicalBusiness', 'Dentist', 'Physician', 'Hospital', 'VeterinaryCare'),
        ),
        'professional' => array(
            'label' => __('Professional services', 'nurevo-webmcp'),
            'hint' => __('Lawyers, accountants, agencies and trades', 'nurevo-webmcp'),
            'type' => 'ProfessionalService',
            'family' => array('ProfessionalService', 'LegalService', 'AccountingService', 'FinancialService', 'RealEstateAgent', 'HomeAndConstructionBusiness', 'Plumber', 'Electrician', 'GeneralContractor', 'AutoRepair', 'AutomotiveBusiness', 'TravelAgency'),
        ),
        'retail' => array(
            'label' => __('Retail shop', 'nurevo-webmcp'),
            'hint' => __('Shops and stores, on the street or online', 'nurevo-webmcp'),
            'type' => 'Store',
            'family' => array('Store', 'ClothingStore', 'GroceryStore', 'Pharmacy', 'PetStore', 'FurnitureStore', 'ShoppingCenter'),
        ),
        'lodging' => array(
            'label' => __('Lodging', 'nurevo-webmcp'),
            'hint' => __('Hotels, inns and guesthouses', 'nurevo-webmcp'),
            'type' => 'LodgingBusiness',
            'family' => array('LodgingBusiness', 'Hotel'),
        ),
        'other' => array(
            'label' => __('Other', 'nurevo-webmcp'),
            'hint' => __('Any other business or organization', 'nurevo-webmcp'),
            'type' => '',
            'family' => array(),
        ),
    );
}

/** The card the current business_type belongs to, or '' when none is set. */
function webmcp_canary_wizard_current_site_type($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $type = (string) ($settings['business_type'] ?? '');
    if ($type === '') {
        return '';
    }
    foreach (webmcp_canary_wizard_site_types() as $key => $card) {
        if (in_array($type, $card['family'], true)) {
            return $key;
        }
    }
    return 'other';
}

/** The business_type to store for a chosen card, keeping a more specific type. */
function webmcp_canary_wizard_business_type_for($card_key, $current_type) {
    $cards = webmcp_canary_wizard_site_types();
    if (!isset($cards[$card_key])) {
        return null;
    }
    $current_type = (string) $current_type;
    if ($card_key === 'other') {
        // Keep a type of the owner's own that no card claims; otherwise none.
        return webmcp_canary_wizard_current_site_type(array('business_type' => $current_type)) === 'other' ? $current_type : '';
    }
    return in_array($current_type, $cards[$card_key]['family'], true) ? $current_type : $cards[$card_key]['type'];
}

/** The business fields on step 2, in order. */
function webmcp_canary_wizard_business_fields() {
    return array(
        'business_name' => array('label' => __('Business name', 'nurevo-webmcp'), 'kind' => 'text'),
        'business_address' => array('label' => __('Address', 'nurevo-webmcp'), 'kind' => 'text'),
        'business_phone' => array('label' => __('Phone', 'nurevo-webmcp'), 'kind' => 'tel'),
        'business_hours' => array('label' => __('Opening hours', 'nurevo-webmcp'), 'kind' => 'textarea'),
        'business_description' => array('label' => __('Description', 'nurevo-webmcp'), 'kind' => 'textarea'),
    );
}

/**
 * Values to show on step 2: what Nurevo already holds, then what the SEO
 * plugin holds, then the site title and tagline. Each comes with its source.
 */
function webmcp_canary_wizard_prefill($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $seo = webmcp_canary_extract_from_seo_plugins();
    $site = array(
        'business_name' => (string) get_option('blogname', ''),
        'business_description' => (string) get_option('blogdescription', ''),
    );
    $values = array();
    foreach (array_keys(webmcp_canary_wizard_business_fields()) as $field) {
        $saved = trim((string) ($settings[$field] ?? ''));
        if ($saved !== '') {
            $values[$field] = array('value' => $saved, 'source' => 'saved');
        } elseif (!empty($seo[$field]) && trim((string) $seo[$field]) !== '') {
            $values[$field] = array('value' => trim((string) $seo[$field]), 'source' => 'seo');
        } elseif (!empty($site[$field]) && trim($site[$field]) !== '') {
            $values[$field] = array('value' => trim($site[$field]), 'source' => 'site');
        } else {
            $values[$field] = array('value' => '', 'source' => '');
        }
    }
    return $values;
}

/**
 * The opening hours as the parser read them, one line per group of days, or
 * null when the text could not be read (it is then published as written).
 */
function webmcp_canary_wizard_hours_lines($text) {
    $specs = webmcp_canary_opening_hours_specification($text);
    if (!is_array($specs) || empty($specs)) {
        return null;
    }
    $order = array('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
    $lines = array();
    foreach ($specs as $spec) {
        $days = array();
        foreach ((array) $spec['dayOfWeek'] as $url) {
            $index = array_search(substr((string) $url, strlen('https://schema.org/')), $order, true);
            if ($index !== false) {
                $days[] = $index;
            }
        }
        sort($days);
        $runs = array();
        foreach ($days as $day) {
            $last = count($runs) - 1;
            if ($last >= 0 && $runs[$last][1] === $day - 1) {
                $runs[$last][1] = $day;
            } else {
                $runs[] = array($day, $day);
            }
        }
        $labels = array();
        foreach ($runs as $run) {
            $labels[] = $run[0] === $run[1]
                ? webmcp_canary_wizard_day_name($run[0])
                : webmcp_canary_wizard_day_name($run[0]) . '–' . webmcp_canary_wizard_day_name($run[1]);
        }
        $lines[] = implode(', ', $labels) . ' ' . $spec['opens'] . '–' . $spec['closes'];
    }
    return $lines;
}

/** A short weekday name (0 = Monday) in the site language, from core's own translations. */
function webmcp_canary_wizard_day_name($index) {
    global $wp_locale;
    $english = array('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
    $index = (int) $index;
    if (is_object($wp_locale) && method_exists($wp_locale, 'get_weekday') && method_exists($wp_locale, 'get_weekday_abbrev')) {
        // WP_Locale counts from Sunday.
        return $wp_locale->get_weekday_abbrev($wp_locale->get_weekday(($index + 1) % 7));
    }
    return substr($english[$index], 0, 3);
}

/* -----------------------------------------------------------------------
 * Saving.
 * --------------------------------------------------------------------- */

/**
 * Save changes to the settings through the plugin's own sanitize callback.
 *
 * The callback treats a missing checkbox as "off", so the current settings are
 * passed in full with only the changed keys replaced.
 */
function webmcp_canary_wizard_save_settings($changes) {
    $input = array_merge(webmcp_canary_settings(), is_array($changes) ? $changes : array());
    $clean = webmcp_canary_sanitize_settings($input);
    update_option(WEBMCP_CANARY_OPTION, $clean);
    return $clean;
}

/**
 * Handle one submitted step. Split from the admin-post handler so it can be
 * tested without exiting. Returns array{ok:bool, error?:string, redirect:string}.
 */
function webmcp_canary_wizard_process($post) {
    $post = is_array($post) ? $post : array();
    if (!current_user_can('manage_options')) {
        return array('ok' => false, 'error' => 'forbidden', 'redirect' => '');
    }
    $nonce = isset($post['_wpnonce']) ? sanitize_text_field((string) $post['_wpnonce']) : '';
    if (!wp_verify_nonce($nonce, 'webmcp_canary_wizard')) {
        return array('ok' => false, 'error' => 'nonce', 'redirect' => '');
    }
    $step = isset($post['step']) ? (int) $post['step'] : 0;
    if ($step < 1 || $step > WEBMCP_CANARY_WIZARD_STEPS) {
        return array('ok' => false, 'error' => 'step', 'redirect' => webmcp_canary_wizard_url());
    }

    // "Skip / later" leaves this step unsaved and keeps earlier progress.
    if (!empty($post['nurevo_wizard_skip'])) {
        webmcp_canary_wizard_save_state(0, 'skipped');
        return array('ok' => true, 'skipped' => true, 'redirect' => add_query_arg(array('page' => 'webmcp-canary'), admin_url('admin.php')));
    }

    $settings = webmcp_canary_settings();
    if ($step === 1) {
        $card = isset($post['site_type']) ? sanitize_key((string) $post['site_type']) : '';
        $type = webmcp_canary_wizard_business_type_for($card, $settings['business_type']);
        if ($type === null) {
            return array('ok' => false, 'error' => 'site_type', 'redirect' => webmcp_canary_wizard_url(1, array('nurevo_error' => 'site_type')));
        }
        webmcp_canary_wizard_save_settings(array('business_type' => $type));
    } elseif ($step === 2) {
        $changes = array();
        foreach (array_keys(webmcp_canary_wizard_business_fields()) as $field) {
            if (isset($post[$field])) {
                $changes[$field] = (string) $post[$field];
            }
        }
        webmcp_canary_wizard_save_settings($changes);
        if (!empty($post['nurevo_wizard_check_hours'])) {
            webmcp_canary_wizard_save_state(1, 'in_progress');
            return array('ok' => true, 'redirect' => webmcp_canary_wizard_url(2, array('nurevo_saved' => '1')) . '#webmcp-wizard-hours');
        }
    } elseif ($step === 3) {
        $changes = array('ai_training' => isset($post['ai_training']) ? sanitize_key((string) $post['ai_training']) : $settings['ai_training']);
        if (!empty($post['nurevo_publish'])) {
            $changes += array('enabled' => '1', 'serve_schema' => '1', 'serve_llms_txt' => '1', 'allow_ai_crawlers' => '1');
        } else {
            $changes['enabled'] = '';
        }
        webmcp_canary_wizard_save_settings($changes);
        if (!empty($post['nurevo_consent'])) {
            // The same record the AEO Score screen keeps. Nothing is sent here.
            webmcp_canary_record_consent('setup');
        }
    }

    $status = $step >= WEBMCP_CANARY_WIZARD_STEPS - 1 ? 'done' : 'in_progress';
    webmcp_canary_wizard_save_state($step, $status);
    $next = min(WEBMCP_CANARY_WIZARD_STEPS, $step + 1);
    if ($step === WEBMCP_CANARY_WIZARD_STEPS) {
        return array('ok' => true, 'redirect' => add_query_arg(array('page' => 'webmcp-canary'), admin_url('admin.php')));
    }
    return array('ok' => true, 'redirect' => webmcp_canary_wizard_url($next, array('nurevo_saved' => '1')));
}

add_action('admin_post_webmcp_canary_wizard', 'webmcp_canary_wizard_action');
function webmcp_canary_wizard_action() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to perform this action.', 'nurevo-webmcp'), '', array('response' => 403));
    }
    check_admin_referer('webmcp_canary_wizard');
    $result = webmcp_canary_wizard_process(wp_unslash($_POST)); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified above; each field is sanitized in webmcp_canary_wizard_process() and webmcp_canary_sanitize_settings().
    if (empty($result['ok']) && $result['redirect'] === '') {
        wp_die(esc_html__('You do not have permission to perform this action.', 'nurevo-webmcp'), '', array('response' => 403));
    }
    wp_safe_redirect($result['redirect']);
    exit;
}

/* -----------------------------------------------------------------------
 * Rendering.
 * --------------------------------------------------------------------- */

function webmcp_canary_wizard_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    // phpcs:disable WordPress.Security.NonceVerification.Recommended -- display only: which step to show, and the result of the redirect.
    $state = webmcp_canary_wizard_state();
    $step = isset($_GET['step']) ? (int) $_GET['step'] : webmcp_canary_wizard_resume_step($state);
    $step = max(1, min(WEBMCP_CANARY_WIZARD_STEPS, $step));
    $saved = !empty($_GET['nurevo_saved']);
    $error = isset($_GET['nurevo_error']) ? sanitize_key(wp_unslash($_GET['nurevo_error'])) : '';
    // phpcs:enable
    $steps = webmcp_canary_wizard_steps();
    $settings = webmcp_canary_settings();
    ?>
    <div class="wrap webmcp-wizard">
        <?php echo webmcp_canary_screen_title(__('Set up Nurevo AEO', 'nurevo-webmcp')); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in webmcp_canary_screen_title() ?>
        <nav aria-label="<?php esc_attr_e('Setup progress', 'nurevo-webmcp'); ?>">
            <ol class="webmcp-wizard-steps">
                <?php foreach ($steps as $number => $title) : ?>
                    <?php
                    $classes = array();
                    if ($number === $step) {
                        $classes[] = 'is-current';
                    } elseif ($number <= $state['step']) {
                        $classes[] = 'is-done';
                    }
                    ?>
                    <li class="<?php echo esc_attr(implode(' ', $classes)); ?>"<?php echo $number === $step ? ' aria-current="step"' : ''; ?>>
                        <span class="webmcp-wizard-num" aria-hidden="true"><?php echo esc_html((string) $number); ?></span>
                        <span><?php echo esc_html($title); ?></span>
                    </li>
                <?php endforeach; ?>
            </ol>
        </nav>
        <?php if ($saved && $step > 1) : ?>
            <div class="notice notice-success inline"><p><?php esc_html_e('Saved.', 'nurevo-webmcp'); ?></p></div>
        <?php endif; ?>
        <?php if ($error === 'site_type') : ?>
            <div class="notice notice-error inline"><p><?php esc_html_e('Choose the kind of business this site is for.', 'nurevo-webmcp'); ?></p></div>
        <?php endif; ?>
        <div class="webmcp-wizard-panel">
            <p class="webmcp-wizard-stepnum">
                <?php
                /* translators: 1: current step number, 2: total number of steps. */
                echo esc_html(sprintf(__('Step %1$d of %2$d', 'nurevo-webmcp'), $step, WEBMCP_CANARY_WIZARD_STEPS));
                ?>
            </p>
            <?php
            if ($step === 1) {
                webmcp_canary_wizard_render_step_1($settings);
            } elseif ($step === 2) {
                webmcp_canary_wizard_render_step_2($settings);
            } elseif ($step === 3) {
                webmcp_canary_wizard_render_step_3($settings);
            } else {
                webmcp_canary_wizard_render_step_4($settings);
            }
            ?>
        </div>
    </div>
    <?php
}

/** Form opening shared by steps 1-3. */
function webmcp_canary_wizard_form_open($step) {
    printf('<form method="post" action="%s" class="webmcp-wizard-form">', esc_url(admin_url('admin-post.php')));
    echo '<input type="hidden" name="action" value="webmcp_canary_wizard">';
    printf('<input type="hidden" name="step" value="%d">', (int) $step);
    wp_nonce_field('webmcp_canary_wizard');
}

/** Back, Skip and Continue. */
function webmcp_canary_wizard_form_close($step, $continue_label = '') {
    echo '<div class="webmcp-wizard-actions">';
    printf('<button type="submit" class="button button-primary">%s</button>', esc_html($continue_label !== '' ? $continue_label : __('Save and continue', 'nurevo-webmcp')));
    if ($step > 1) {
        printf('<a class="button" href="%1$s">%2$s</a>', esc_url(webmcp_canary_wizard_url($step - 1)), esc_html__('Back', 'nurevo-webmcp'));
    }
    printf(
        '<button type="submit" name="nurevo_wizard_skip" value="1" class="button-link webmcp-wizard-skip" formnovalidate>%s</button>',
        esc_html__('Skip for now', 'nurevo-webmcp')
    );
    echo '</div></form>';
}

function webmcp_canary_wizard_heading($text) {
    printf('<h2 id="webmcp-wizard-heading" tabindex="-1">%s</h2>', esc_html($text));
}

function webmcp_canary_wizard_render_step_1($settings) {
    $current = webmcp_canary_wizard_current_site_type($settings);
    webmcp_canary_wizard_heading(__('What kind of business is this site for?', 'nurevo-webmcp'));
    echo '<p class="webmcp-wizard-lead">' . esc_html__('This sets the schema.org type AI reads your business as. You can refine it later in Settings.', 'nurevo-webmcp') . '</p>';
    webmcp_canary_wizard_form_open(1);
    echo '<fieldset><legend>' . esc_html__('Business category', 'nurevo-webmcp') . '</legend><div class="webmcp-wizard-cards">';
    foreach (webmcp_canary_wizard_site_types() as $key => $card) {
        printf(
            '<label class="webmcp-wizard-card%5$s" for="webmcp-site-type-%1$s"><input type="radio" id="webmcp-site-type-%1$s" name="site_type" value="%1$s"%2$s required> <strong>%3$s</strong><span class="webmcp-wizard-card-hint">%4$s</span></label>',
            esc_attr($key),
            checked($current, $key, false),
            esc_html($card['label']),
            esc_html($card['hint']),
            $current === $key ? ' is-selected' : ''
        );
    }
    echo '</div></fieldset>';
    $seo = webmcp_canary_detect_active_seo_plugins();
    if (!empty($seo)) {
        echo '<p class="webmcp-wizard-note">' . esc_html(sprintf(
            /* translators: %s: comma-separated names of the active SEO plugins, e.g. "Yoast SEO". */
            __('%s is active. Nurevo adds only the facts missing from its schema graph, with no duplicates.', 'nurevo-webmcp'),
            implode(', ', array_values($seo))
        )) . '</p>';
    }
    webmcp_canary_wizard_form_close(1);
}

function webmcp_canary_wizard_render_step_2($settings) {
    $values = webmcp_canary_wizard_prefill($settings);
    $missing = array_keys(array_filter($values, function ($entry) { return $entry['value'] === ''; }));
    webmcp_canary_wizard_heading(__('Your business information', 'nurevo-webmcp'));
    echo '<p class="webmcp-wizard-lead">' . esc_html__('These are the facts AI answers with. They are published as structured data and in llms.txt.', 'nurevo-webmcp') . '</p>';
    if (!empty($missing)) {
        echo '<p class="webmcp-wizard-missing">' . esc_html(sprintf(
            /* translators: %d: number of business fields that are still empty. */
            __('%d field(s) are still empty. AI cannot answer with what is not here.', 'nurevo-webmcp'),
            count($missing)
        )) . '</p>';
    }
    webmcp_canary_wizard_form_open(2);
    echo '<fieldset><legend>' . esc_html__('Business information', 'nurevo-webmcp') . '</legend>';
    foreach (webmcp_canary_wizard_business_fields() as $field => $definition) {
        $entry = $values[$field];
        $id = 'webmcp-wizard-' . str_replace('_', '-', $field);
        $is_missing = $entry['value'] === '';
        $notes = array();
        if ($is_missing) {
            $notes[] = '<span class="webmcp-wizard-missing">' . esc_html__('Missing', 'nurevo-webmcp') . '</span>';
        } elseif ($entry['source'] === 'seo') {
            $notes[] = esc_html__('Suggested from your SEO plugin. Please check it.', 'nurevo-webmcp');
        } elseif ($entry['source'] === 'site') {
            $notes[] = esc_html__('Suggested from your site title and tagline. Please check it.', 'nurevo-webmcp');
        }
        if ($field === 'business_hours') {
            $notes[] = esc_html__('Free text, for example "Mon-Fri 9:00-18:00, Sat 10:00-15:00, closed Sunday".', 'nurevo-webmcp');
        }
        echo '<div class="webmcp-wizard-field' . ($is_missing ? ' is-missing' : '') . '">';
        printf('<label for="%1$s">%2$s</label>', esc_attr($id), esc_html($definition['label']));
        $describedby = $notes ? ' aria-describedby="' . esc_attr($id . '-desc') . '"' : '';
        if ($definition['kind'] === 'textarea') {
            printf(
                '<textarea id="%1$s" name="%2$s" rows="3" class="large-text"%4$s>%3$s</textarea>',
                esc_attr($id),
                esc_attr($field),
                esc_textarea($entry['value']),
                $describedby // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
            );
        } else {
            printf(
                '<input type="%1$s" id="%2$s" name="%3$s" value="%4$s" class="regular-text"%5$s>',
                esc_attr($definition['kind']),
                esc_attr($id),
                esc_attr($field),
                esc_attr($entry['value']),
                $describedby // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
            );
        }
        if ($notes) {
            printf('<p class="description" id="%1$s">%2$s</p>', esc_attr($id . '-desc'), implode(' ', $notes)); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- each note is escaped above.
        }
        if ($field === 'business_hours' && $entry['value'] !== '') {
            $lines = webmcp_canary_wizard_hours_lines($entry['value']);
            echo '<div class="webmcp-wizard-hours" id="webmcp-wizard-hours" role="status">';
            if ($lines === null) {
                echo esc_html__('These hours could not be read day by day, so they will be published exactly as written.', 'nurevo-webmcp');
            } else {
                echo esc_html__('Read as:', 'nurevo-webmcp') . '<ul>';
                foreach ($lines as $line) {
                    echo '<li>' . esc_html($line) . '</li>';
                }
                echo '</ul>';
            }
            echo '</div>';
        }
        if ($field === 'business_hours') {
            printf(
                '<p><button type="submit" name="nurevo_wizard_check_hours" value="1" class="button">%s</button></p>',
                esc_html__('Save and check the hours', 'nurevo-webmcp')
            );
        }
        echo '</div>';
    }
    echo '</fieldset>';
    webmcp_canary_wizard_form_close(2);
}

function webmcp_canary_wizard_render_step_3($settings) {
    // Recommended, so it is on unless the owner turned output off before.
    $first_visit = webmcp_canary_wizard_state()['step'] < 3;
    $publish = $settings['enabled'] === '1' || $first_visit;
    $consented = webmcp_canary_has_consent($settings);
    webmcp_canary_wizard_heading(__('What AI can see', 'nurevo-webmcp'));
    echo '<p class="webmcp-wizard-lead">' . esc_html__('Everything here is produced on your own server. Nothing is sent anywhere by these switches.', 'nurevo-webmcp') . '</p>';
    webmcp_canary_wizard_form_open(3);

    echo '<fieldset><legend>' . esc_html__('Publishing', 'nurevo-webmcp') . '</legend>';
    printf(
        '<label class="webmcp-wizard-switch" for="webmcp-wizard-publish"><input type="checkbox" id="webmcp-wizard-publish" name="nurevo_publish" value="1"%1$s> <span><strong>%2$s</strong>%3$s</span></label>',
        checked($publish, true, false),
        esc_html__('Publish AI-readable information (recommended)', 'nurevo-webmcp'),
        esc_html__('Turns on JSON-LD structured data, /llms.txt, and access for AI search crawlers in robots.txt.', 'nurevo-webmcp')
    );
    echo '</fieldset>';

    $choices = array(
        'default' => array(__('Leave to my robots.txt (no change)', 'nurevo-webmcp'), __('Nurevo adds nothing for these crawlers; your existing robots.txt decides.', 'nurevo-webmcp')),
        'allow' => array(__('Allow', 'nurevo-webmcp'), __('Your content may be used to train AI models.', 'nurevo-webmcp')),
        'block' => array(__('Block', 'nurevo-webmcp'), __('Asks training crawlers to stay away. AI search and your score are not affected.', 'nurevo-webmcp')),
    );
    $current = isset($choices[$settings['ai_training']]) ? $settings['ai_training'] : 'default';
    echo '<fieldset class="webmcp-radio-group"><legend>' . esc_html__('AI training crawlers', 'nurevo-webmcp') . '</legend>';
    foreach ($choices as $value => $choice) {
        printf(
            '<label class="webmcp-wizard-choice" for="webmcp-wizard-training-%1$s"><input type="radio" id="webmcp-wizard-training-%1$s" name="ai_training" value="%1$s"%2$s aria-describedby="webmcp-wizard-training-%1$s-desc"> %3$s <span class="description" id="webmcp-wizard-training-%1$s-desc">%4$s</span></label>',
            esc_attr($value),
            checked($current, $value, false),
            esc_html($choice[0]),
            esc_html($choice[1])
        );
    }
    echo '</fieldset>';

    echo '<fieldset class="webmcp-wizard-consent"><legend>' . esc_html__('AEO diagnosis (optional)', 'nurevo-webmcp') . '</legend>';
    if ($consented) {
        echo '<p>' . esc_html__('You have already agreed to the diagnosis. Your score is shown on the next step.', 'nurevo-webmcp') . '</p>';
    } else {
        echo '<p>' . esc_html__('The diagnosis is run by the Nurevo service at nurevo.jp. It sends your home page URL and WordPress language; the service then reads your public front page, robots.txt and llms.txt. Nothing is sent unless you tick this box.', 'nurevo-webmcp') . '</p>';
        printf(
            '<label for="webmcp-wizard-consent"><input type="checkbox" id="webmcp-wizard-consent" name="nurevo_consent" value="1"> %1$s</label>',
            esc_html__('I agree to send this site’s URL to the Nurevo service for diagnosis, under its Terms of Service and Privacy Policy.', 'nurevo-webmcp')
        );
        printf(
            '<p><a href="https://nurevo.jp/terms" target="_blank" rel="noopener">%1$s</a> · <a href="https://nurevo.jp/privacy" target="_blank" rel="noopener">%2$s</a></p>',
            esc_html__('Terms of Service', 'nurevo-webmcp'),
            esc_html__('Privacy Policy', 'nurevo-webmcp')
        );
    }
    echo '</fieldset>';
    webmcp_canary_wizard_form_close(3, __('Save and finish', 'nurevo-webmcp'));
}

function webmcp_canary_wizard_render_step_4($settings) {
    webmcp_canary_wizard_heading(__('You are set up', 'nurevo-webmcp'));
    $enabled = $settings['enabled'] === '1';
    echo '<p class="webmcp-wizard-lead">' . esc_html($enabled
        ? __('AI-readable information is now published from this site.', 'nurevo-webmcp')
        : __('Output is off, so nothing is published yet. You can switch it on in Settings at any time.', 'nurevo-webmcp')) . '</p>';

    echo '<h3>' . esc_html__('AEO score', 'nurevo-webmcp') . '</h3>';
    if (webmcp_canary_has_consent($settings)) {
        // The same function, cache and retry rules as the AEO Score screen.
        $result = webmcp_canary_get_aeo_score(false);
        $view = webmcp_canary_aeo_view(is_wp_error($result) ? null : $result, is_wp_error($result) ? $result : null);
        if ($view['score'] !== null) {
            printf(
                '<div class="webmcp-wizard-score"><strong style="color:%1$s">%2$s</strong><span>/100 · %3$s</span></div>',
                esc_attr($view['color']),
                esc_html((string) $view['score']),
                esc_html($view['badge'])
            );
        } else {
            echo '<p>' . esc_html($view['heading']) . '</p>';
        }
        printf('<p><a class="button button-primary" href="%1$s">%2$s</a></p>', esc_url(admin_url('admin.php?page=webmcp-canary')), esc_html__('See the full diagnosis', 'nurevo-webmcp'));
    } else {
        echo '<p>' . esc_html__('The diagnosis has not been run, and nothing has been sent. You can run it any time from the AEO Score screen.', 'nurevo-webmcp') . '</p>';
        printf('<p><a class="button" href="%1$s">%2$s</a></p>', esc_url(admin_url('admin.php?page=webmcp-canary')), esc_html__('Open the AEO Score screen', 'nurevo-webmcp'));
    }

    echo '<h3>' . esc_html__('Next steps', 'nurevo-webmcp') . '</h3><ul class="webmcp-wizard-next">';
    printf(
        '<li>%1$s <a href="%2$s">%3$s</a></li>',
        esc_html__('Add the Nurevo FAQ block to a page, so AI can quote your answers.', 'nurevo-webmcp'),
        esc_url(admin_url('edit.php?post_type=page')),
        esc_html__('Open your pages', 'nurevo-webmcp')
    );
    printf(
        '<li>%1$s <a href="%2$s">%3$s</a></li>',
        esc_html__('Connect this site to nurevo.jp to see it in the dashboard (optional, free).', 'nurevo-webmcp'),
        esc_url(admin_url('admin.php?page=webmcp-canary-settings')),
        esc_html__('Connect to nurevo.jp', 'nurevo-webmcp')
    );
    printf(
        '<li>%s</li>',
        esc_html__('Per-page settings: leave a page out, or give it its own FAQ, from the Nurevo AEO panel in the editor.', 'nurevo-webmcp')
    );
    echo '</ul>';
    if (($settings['plan'] ?? 'free') === 'free') {
        echo '<p class="webmcp-wizard-upsell">' . esc_html__('Standard keeps your output following new AI criteria automatically, if you ever want that.', 'nurevo-webmcp') . '</p>';
    }
    printf(
        '<div class="webmcp-wizard-actions"><a class="button button-primary" href="%1$s">%2$s</a></div>',
        esc_url(admin_url('admin.php?page=webmcp-canary')),
        esc_html__('Go to Nurevo AEO', 'nurevo-webmcp')
    );
}
