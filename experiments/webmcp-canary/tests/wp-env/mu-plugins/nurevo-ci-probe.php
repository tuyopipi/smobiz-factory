<?php
/**
 * Plugin Name: Nurevo CI probe
 * Description: Test-only helper for scripts/wp-env-smoke.mjs. Records (and blocks) outbound HTTP and adds a `wp nurevo-ci` command. Never shipped with the plugin.
 *
 * Mounted as an mu-plugin by tests/wp-env/.wp-env.json, so it is loaded on every
 * request, in both the web and the WP-CLI container, before any plugin.
 *
 * Outbound HTTP:
 *   Every request that reaches pre_http_request is appended to
 *   wp-content/nurevo-ci-http.jsonl with its URL, whether the host is external
 *   (not this site / localhost) and whether a Nurevo file is on the call stack.
 *   External requests are then answered with a WP_Error, so the smoke test never
 *   talks to nurevo.jp, wordpress.org or anything else on the network. Loopback
 *   requests pass through unchanged.
 *
 * Output for the orchestrator is one line per command, prefixed NUREVO_CI_JSON,
 * so it can be told apart from wp-env's own progress messages.
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Fixture written by `wp nurevo-ci configure` and asserted by the smoke test. */
function nurevo_ci_fixture() {
    return array(
        'business_name'    => 'Nurevo CI Bakery',
        'business_phone'   => '+81-3-0000-0000',
        'business_address' => '1-2-3 Test Street, Chiyoda, Tokyo',
        'business_hours'   => 'Mo-Fr 09:00-18:00',
        'business_type'    => 'Bakery',
        'service_name'     => 'Bread tasting',
    );
}

function nurevo_ci_http_log_path() {
    return WP_CONTENT_DIR . '/nurevo-ci-http.jsonl';
}

function nurevo_ci_debug_log_path() {
    if (defined('WP_DEBUG_LOG') && is_string(WP_DEBUG_LOG) && WP_DEBUG_LOG !== '' && !in_array(strtolower(WP_DEBUG_LOG), array('1', 'true'), true)) {
        return WP_DEBUG_LOG;
    }
    return WP_CONTENT_DIR . '/debug.log';
}

function nurevo_ci_is_loopback_host($host) {
    $host = strtolower(trim((string) $host, '[]'));
    $home = strtolower((string) wp_parse_url(home_url(), PHP_URL_HOST));
    return $host === '' || $host === $home || in_array($host, array('localhost', '127.0.0.1', '::1'), true);
}

/** True when a file of the Nurevo plugin is on the current call stack. */
function nurevo_ci_called_from_nurevo() {
    foreach (debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS) as $frame) {
        if (!empty($frame['file']) && strpos(str_replace('\\', '/', $frame['file']), '/plugins/nurevo-webmcp/') !== false) {
            return true;
        }
    }
    return false;
}

add_filter('pre_http_request', 'nurevo_ci_record_http', -1000, 3);
function nurevo_ci_record_http($pre, $args, $url) {
    $host = wp_parse_url($url, PHP_URL_HOST);
    $external = !nurevo_ci_is_loopback_host($host);
    $entry = array(
        'time'     => microtime(true),
        'context'  => (defined('WP_CLI') && WP_CLI) ? 'cli' : 'web',
        'method'   => isset($args['method']) ? (string) $args['method'] : 'GET',
        'url'      => (string) $url,
        'host'     => (string) $host,
        'external' => $external,
        'nurevo'   => nurevo_ci_called_from_nurevo(),
        'blocked'  => $external,
    );
    // Best effort: a failed write must not turn into a warning in debug.log.
    @file_put_contents(nurevo_ci_http_log_path(), wp_json_encode($entry) . "\n", FILE_APPEND | LOCK_EX); // phpcs:ignore
    if ($pre !== false) {
        return $pre;
    }
    if ($external) {
        return new WP_Error('nurevo_ci_blocked', 'External HTTP is blocked in the CI smoke test: ' . $url);
    }
    return $pre;
}

if (defined('WP_CLI') && WP_CLI) {
    /**
     * Helpers for scripts/wp-env-smoke.mjs. Test-only.
     */
    class Nurevo_CI_Command {

        private function emit($data) {
            WP_CLI::line('NUREVO_CI_JSON ' . wp_json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        }

        /**
         * Empty the HTTP record and debug.log.
         */
        public function reset() {
            foreach (array(nurevo_ci_http_log_path(), nurevo_ci_debug_log_path()) as $file) {
                if (file_exists($file)) {
                    file_put_contents($file, '');
                }
            }
            $this->emit(array('reset' => true));
        }

        /**
         * Print the recorded outbound HTTP requests.
         */
        public function http() {
            $entries = array();
            $file = nurevo_ci_http_log_path();
            if (file_exists($file)) {
                foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                    $decoded = json_decode($line, true);
                    if (is_array($decoded)) {
                        $entries[] = $decoded;
                    }
                }
            }
            $this->emit($entries);
        }

        /**
         * Print what the smoke test asserts on: versions, active plugins,
         * Nurevo's options and its cron event.
         */
        public function state() {
            global $wpdb;
            if (!function_exists('is_plugin_active')) {
                require_once ABSPATH . 'wp-admin/includes/plugin.php';
            }
            $like = array(
                $wpdb->esc_like('webmcp_canary_') . '%',
                $wpdb->esc_like('_transient_webmcp_canary_') . '%',
                $wpdb->esc_like('_transient_timeout_webmcp_canary_') . '%',
                $wpdb->esc_like('_site_transient_webmcp_canary_') . '%',
            );
            $names = array();
            foreach ($like as $pattern) {
                $names = array_merge($names, (array) $wpdb->get_col(
                    $wpdb->prepare("SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $pattern)
                ));
            }
            sort($names);
            $settings = get_option('webmcp_canary_settings', null);
            if (is_array($settings)) {
                foreach (array('site_key', 'license_key', 'pairing_code', 'admin_token', 'profile_token') as $secret) {
                    if (!empty($settings[$secret])) {
                        $settings[$secret] = '[redacted]';
                    }
                }
            }
            $this->emit(array(
                'php'            => PHP_VERSION,
                'wp'             => get_bloginfo('version'),
                'home'           => home_url('/'),
                'yoast'          => defined('WPSEO_VERSION') ? WPSEO_VERSION : null,
                'yoast_active'   => is_plugin_active('wordpress-seo/wp-seo.php'),
                'slim_seo'       => defined('SLIM_SEO_VER') ? SLIM_SEO_VER : null,
                'slim_seo_active' => is_plugin_active('slim-seo/slim-seo.php'),
                'nurevo_active'  => is_plugin_active('nurevo-webmcp/nurevo-webmcp.php'),
                'nurevo_version' => defined('WEBMCP_CANARY_VERSION') ? WEBMCP_CANARY_VERSION : null,
                'options'        => array_values(array_unique($names)),
                'cron'           => wp_next_scheduled('webmcp_canary_ruleset_check'),
                'settings'       => $settings,
                'blog_public'    => (string) get_option('blog_public'),
                'permalinks'     => (string) get_option('permalink_structure'),
            ));
        }

        /**
         * Turn Nurevo's public output on with fixture business data and one
         * service, and give Yoast an organization, so the two graphs meet.
         * (Slim SEO needs nothing: it always publishes an Organization named
         * after the site.)
         */
        public function configure() {
            $fixture = nurevo_ci_fixture();
            $settings = get_option('webmcp_canary_settings', array());
            $settings = array_merge(is_array($settings) ? $settings : array(), array(
                'enabled'          => '1',
                'serve_schema'     => '1',
                'serve_llms_txt'   => '1',
                'business_name'    => $fixture['business_name'],
                'business_phone'   => $fixture['business_phone'],
                'business_address' => $fixture['business_address'],
                'business_hours'   => $fixture['business_hours'],
                'business_type'    => $fixture['business_type'],
            ));
            update_option('webmcp_canary_settings', $settings);
            update_option('webmcp_canary_services', array(array(
                'name'        => $fixture['service_name'],
                'minutes'     => 30,
                'price'       => '3000',
                'currency'    => 'JPY',
                'category'    => '',
                'reserve_url' => '',
            )), false);
            update_option('blog_public', '1');
            $yoast = false;
            if (class_exists('WPSEO_Options')) {
                WPSEO_Options::set('company_or_person', 'company');
                WPSEO_Options::set('company_name', $fixture['business_name']);
                $yoast = true;
            }
            $this->emit(array('configured' => true, 'yoast_org' => $yoast, 'fixture' => $fixture));
        }

        /**
         * Turn Slim SEO's "Schema" feature off: its own feature list without
         * 'schema' (SlimSEO\Settings\Settings::is_feature_active() reads
         * get_option('slim_seo')['features']). Its schema printer is then never
         * hooked to wp_footer.
         *
         * @subcommand slimseo-schema-off
         */
        public function slimseo_schema_off() {
            $features = array('meta_title', 'meta_description', 'meta_robots', 'open_graph', 'twitter_cards', 'canonical_url',
                'rel_links', 'sitemaps', 'images_alt', 'breadcrumbs', 'feed', 'redirection');
            $option = get_option('slim_seo', array());
            $option = is_array($option) ? $option : array();
            $option['features'] = $features;
            update_option('slim_seo', $option);
            $this->emit(array('slim_seo_features' => $features));
        }

        /**
         * Nurevo's structured data output off, everything else unchanged.
         *
         * @subcommand nurevo-schema-off
         */
        public function nurevo_schema_off() {
            $this->set_nurevo_schema('0');
        }

        /**
         * Nurevo's structured data output back on.
         *
         * @subcommand nurevo-schema-on
         */
        public function nurevo_schema_on() {
            $this->set_nurevo_schema('1');
        }

        private function set_nurevo_schema($value) {
            $settings = get_option('webmcp_canary_settings', array());
            $settings = is_array($settings) ? $settings : array();
            $settings['serve_schema'] = $value;
            update_option('webmcp_canary_settings', $settings);
            $this->emit(array('serve_schema' => $value));
        }

        /**
         * Back to Slim SEO's defaults, where the Schema feature is on.
         *
         * @subcommand slimseo-schema-on
         */
        public function slimseo_schema_on() {
            delete_option('slim_seo');
            $this->emit(array('slim_seo_features' => 'default'));
        }

        /**
         * Pretty permalinks, with the standard .htaccess if the image has none,
         * so /llms.txt reaches WordPress.
         */
        public function permalinks() {
            $htaccess = ABSPATH . '.htaccess';
            $wrote = false;
            if (!file_exists($htaccess)) {
                $rules = "# BEGIN WordPress\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]\nRewriteBase /\nRewriteRule ^index\\.php$ - [L]\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule . /index.php [L]\n</IfModule>\n# END WordPress\n";
                $wrote = file_put_contents($htaccess, $rules) !== false;
            }
            update_option('permalink_structure', '/%postname%/');
            flush_rewrite_rules(false);
            $this->emit(array('permalinks' => get_option('permalink_structure'), 'wrote_htaccess' => $wrote));
        }

        /**
         * Print debug.log.
         */
        public function debuglog() {
            $file = nurevo_ci_debug_log_path();
            $this->emit(array(
                'path'    => $file,
                'exists'  => file_exists($file),
                'content' => file_exists($file) ? (string) file_get_contents($file) : '',
            ));
        }
    }

    WP_CLI::add_command('nurevo-ci', 'Nurevo_CI_Command');
}
