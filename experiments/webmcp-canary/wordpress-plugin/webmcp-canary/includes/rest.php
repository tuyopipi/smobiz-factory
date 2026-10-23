<?php
/**
 * Read-only REST route: GET /wp-json/nurevo/v1/status
 *
 * Reports what this site publishes (see webmcp_canary_status_report()), for
 * administrators only. It changes nothing and returns no keys or tokens.
 *
 * @package WebMCP_Canary
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', 'webmcp_canary_register_rest_routes');
function webmcp_canary_register_rest_routes() {
    register_rest_route('nurevo/v1', '/status', array(
        'methods' => 'GET',
        'callback' => 'webmcp_canary_rest_status',
        'permission_callback' => 'webmcp_canary_rest_can_manage',
    ));
}

function webmcp_canary_rest_can_manage() {
    return current_user_can('manage_options');
}

function webmcp_canary_rest_status() {
    $report = webmcp_canary_status_report();
    return function_exists('rest_ensure_response') ? rest_ensure_response($report) : $report;
}
