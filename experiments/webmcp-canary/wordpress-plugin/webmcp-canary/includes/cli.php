<?php
/**
 * WP-CLI commands: wp nurevo status|diagnose|export|import
 *
 * Loaded only when WP-CLI is running. Each command is a thin wrapper around the
 * same functions the admin screens use.
 *
 * @package WebMCP_Canary
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('WP_CLI') || !WP_CLI || !class_exists('WP_CLI')) {
    return;
}

/**
 * Inspect and manage Nurevo AEO.
 */
class Webmcp_Canary_CLI_Command {

    /**
     * Show what this site publishes.
     *
     * ## OPTIONS
     *
     * [--format=<format>]
     * : Output format.
     * ---
     * default: text
     * options:
     *   - text
     *   - json
     * ---
     *
     * ## EXAMPLES
     *
     *     wp nurevo status
     *     wp nurevo status --format=json
     */
    public function status($args, $assoc_args) {
        $report = webmcp_canary_status_report();
        if (($assoc_args['format'] ?? 'text') === 'json') {
            WP_CLI::line(wp_json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            return;
        }
        foreach ($this->flatten($report) as $key => $value) {
            WP_CLI::line($key . ': ' . $value);
        }
    }

    /**
     * Run the AEO diagnosis now.
     *
     * The diagnosis is run by the Nurevo service: it sends this site's home URL
     * and language, and the service reads the public front page, robots.txt
     * and llms.txt. The first run needs --consent.
     *
     * ## OPTIONS
     *
     * [--consent]
     * : Agree to contact the Nurevo service (needed once, like the button in wp-admin).
     *
     * [--format=<format>]
     * : Output format.
     * ---
     * default: text
     * options:
     *   - text
     *   - json
     * ---
     */
    public function diagnose($args, $assoc_args) {
        if (!webmcp_canary_has_consent()) {
            if (empty($assoc_args['consent'])) {
                WP_CLI::error(__('The diagnosis sends this site’s URL to the Nurevo service. Run again with --consent to agree.', 'nurevo-webmcp'));
                return;
            }
            webmcp_canary_record_consent('cli');
        }
        $result = webmcp_canary_get_aeo_score(true);
        if (is_wp_error($result)) {
            WP_CLI::error($result->get_error_message());
            return;
        }
        if (($assoc_args['format'] ?? 'text') === 'json') {
            WP_CLI::line(wp_json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            return;
        }
        foreach ((array) $result['checks'] as $check) {
            $view = webmcp_canary_aeo_check_view($check);
            WP_CLI::line(strtoupper((string) $check['status']) . "\t" . $view['label'] . ' - ' . $view['message']);
        }
        /* translators: 1: AEO score out of 100. 2: band, e.g. "green". */
        WP_CLI::success(sprintf(__('AEO score: %1$d/100 (%2$s)', 'nurevo-webmcp'), (int) $result['score'], (string) $result['band']));
    }

    /**
     * Export the settings as JSON. Keys, tokens, the plan and the connection
     * are never included.
     *
     * ## OPTIONS
     *
     * [--file=<path>]
     * : Write to this file instead of standard output.
     */
    public function export($args, $assoc_args) {
        $json = wp_json_encode(webmcp_canary_export_settings(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if (!empty($assoc_args['file'])) {
            if (file_put_contents($assoc_args['file'], $json . "\n") === false) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- CLI output file.
                WP_CLI::error(__('Could not write the file.', 'nurevo-webmcp'));
                return;
            }
            WP_CLI::success(__('Settings exported.', 'nurevo-webmcp'));
            return;
        }
        WP_CLI::line($json);
    }

    /**
     * Import settings exported from Nurevo AEO.
     *
     * Files that contain keys, tokens or settings this version does not know
     * are refused.
     *
     * ## OPTIONS
     *
     * <file>
     * : The JSON file to import, or - for standard input.
     */
    public function import($args, $assoc_args) {
        $file = isset($args[0]) ? (string) $args[0] : '';
        if ($file === '-') {
            $json = stream_get_contents(STDIN);
        } elseif ($file !== '' && is_readable($file)) {
            $json = file_get_contents($file); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a local file named on the command line.
        } else {
            WP_CLI::error(__('Could not read the file.', 'nurevo-webmcp'));
            return;
        }
        $result = webmcp_canary_import_settings_json($json);
        if (is_wp_error($result)) {
            WP_CLI::error($result->get_error_message());
            return;
        }
        WP_CLI::success(__('Settings imported.', 'nurevo-webmcp'));
    }

    /** Nested report as "a.b: value" lines. */
    private function flatten($data, $prefix = '') {
        $lines = array();
        foreach ((array) $data as $key => $value) {
            $name = $prefix === '' ? (string) $key : $prefix . '.' . $key;
            if (is_array($value)) {
                $lines = array_merge($lines, $this->flatten($value, $name));
            } elseif (is_bool($value)) {
                $lines[$name] = $value ? 'yes' : 'no';
            } else {
                $lines[$name] = $value === null ? '-' : (string) $value;
            }
        }
        return $lines;
    }
}

WP_CLI::add_command('nurevo', 'Webmcp_Canary_CLI_Command');
