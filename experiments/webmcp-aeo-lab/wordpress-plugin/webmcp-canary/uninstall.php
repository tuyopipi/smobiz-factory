<?php
/**
 * Uninstall cleanup for Nurevo WebMCP Canary.
 *
 * @package WebMCP_Canary
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

delete_option('webmcp_canary_settings');
delete_site_option('webmcp_canary_settings');
