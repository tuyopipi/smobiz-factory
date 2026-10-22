<?php
/**
 * Uninstall cleanup for Nurevo AEO.
 *
 * Removes everything the plugin stored: settings, FAQ and service entries,
 * diagnosis and measurement caches, catalog, ruleset and autofix state, the
 * hosted llms.txt cache, site-insight transients and the scheduled sync.
 * Every key the plugin writes starts with "webmcp_canary_", so a prefix match
 * also covers keys added by later versions.
 *
 * @package WebMCP_Canary
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

/**
 * Delete this plugin's options and transients from the current site.
 */
function nurevo_aeo_uninstall_site() {
    global $wpdb;

    $patterns = array(
        $wpdb->esc_like('webmcp_canary_') . '%',
        $wpdb->esc_like('_transient_webmcp_canary_') . '%',
        $wpdb->esc_like('_transient_timeout_webmcp_canary_') . '%',
    );
    foreach ($patterns as $pattern) {
        $names = $wpdb->get_col(
            $wpdb->prepare("SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $pattern)
        );
        foreach ((array) $names as $name) {
            delete_option($name);
        }
    }

    wp_clear_scheduled_hook('webmcp_canary_ruleset_check');
}

if (is_multisite()) {
    $site_ids = get_sites(array('fields' => 'ids', 'number' => 0));
    foreach ($site_ids as $site_id) {
        switch_to_blog($site_id);
        nurevo_aeo_uninstall_site();
        restore_current_blog();
    }
    delete_site_option('webmcp_canary_settings');
} else {
    nurevo_aeo_uninstall_site();
}
