=== Nurevo WebMCP ===
Contributors: tuyopon
Tags: forms, automation, analytics, contact form 7, wpforms
Requires at least: 6.0
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Adds the Nurevo WebMCP tag to WordPress forms for agent-readable metadata, privacy-safe footprints, and measured form insights.

== Description ==

Nurevo WebMCP Canary loads an external WebMCP tag on public WordPress pages. The tag reads public form structure in the browser and requests MCP, AEO, and autofill metadata from the configured Nurevo WebMCP server.

The plugin is designed for standard HTML forms and common WordPress form plugins.

Administrators can issue a site key, configure the hosted tag URL, and view a WebMCP dashboard. The dashboard shows collection progress while sample size is low, then measured form completion stats, benchmark panels, and real improvement suggestions once enough data exists.

= External Service Disclosure =

This plugin connects to an external service operated by Nurevo when enabled.

Default service endpoints:

* Service website: https://nurevo.jp/
* WebMCP Worker: https://nurevo.jp/
* Default script URL: https://nurevo.jp/tag.js

Data sent to the WebMCP service:

* Public form structure, such as field selectors, field names, field types, labels, and option counts.
* Site host and page path.
* Site key used for authorization.
* Form execution outcome, such as success, failure, abandoned, or unknown.
* Validation metadata, such as error type, validity flags, sanitized error text, completed step, and duration.
* Browser-side WebMCP registration events needed to detect integration failures.

Data not sent by design:

* Visitor-entered input values.
* Names, email addresses, phone numbers, postal addresses, message bodies, or payment details typed into forms.
* Raw HTML content, text content, or full page content.

The WebMCP tag and server are intended to store privacy-safe structure and outcome data only. Site owners are responsible for confirming that their own use of external services complies with applicable privacy laws.

Service links:

* Privacy Policy: https://nurevo.jp/privacy
* Terms of Service: https://nurevo.jp/terms

== Installation ==

1. Upload the `nurevo-webmcp` folder to `/wp-content/plugins/`.
2. Activate **Nurevo WebMCP Canary** through the WordPress Plugins screen.
3. Open **WebMCP > Settings**.
4. Confirm the `tag.js` URL.
5. Enter an owner email address.
6. Click **Issue site key** or paste an existing site key.
7. Enable the tag.
8. Open **WebMCP** in the admin side menu to view the dashboard.

== Frequently Asked Questions ==

= Does this plugin include tag.js? =

No. The plugin loads `tag.js` from the configured external URL. The default points to the Nurevo WebMCP Worker.

= Does this plugin send visitor input values to Nurevo? =

No. The browser tag is designed to send public form structure and privacy-safe outcome data only. It does not send typed form values.

= Is the site key secret? =

No. Treat the site key as a public site authorization key. It is printed as a script data attribute so the browser tag can use it.

= Is the admin token public? =

No. The optional admin token is stored in the WordPress options table and is only used for protected management actions from the WordPress admin screen. It is not printed on public pages.

= Does this modify form plugin settings? =

No. The plugin only enqueues the configured external tag on public pages. The tag reads standard form DOM structure at runtime.

== Screenshots ==

1. WebMCP settings page with tag URL, site key, owner email, and key actions.
2. WebMCP dashboard while enough data has been collected to show measured stats, benchmark panels, and improvement suggestions.
3. WebMCP dashboard collecting state before the minimum sample size is reached.

== Changelog ==

= 0.1.0 =

* Initial public submission package for Nurevo WebMCP Canary.
* Adds settings for tag URL, site key, owner email, and admin token.
* Adds external WebMCP tag injection.
* Adds WordPress admin dashboard for privacy-safe form insights.
* Adds site key issue, regenerate, and disable actions.
* Adds i18n template and Japanese/English translation files.

== Upgrade Notice ==

= 0.1.0 =

Initial release.

== Assets ==

WordPress.org plugin directory assets belong in the top-level SVN `assets/` directory, next to `trunk/` and `tags/`, not inside the plugin folder.

Included placeholder asset files:

* `assets/icon-128x128.png`
* `assets/icon-256x256.png`
* `assets/banner-772x250.png`
* `assets/banner-1544x500.png`
* `assets/screenshot-1.png`
* `assets/screenshot-2.png`
* `assets/screenshot-3.png`

Replace these placeholders with final branded images before public launch.

== Pre-submission Checklist ==

= Completed =

* Main plugin file declares `Text Domain: nurevo-webmcp`.
* Main plugin file declares `Domain Path: /languages`.
* WordPress.org-compatible just-in-time translation loading is used.
* Translatable strings use WordPress translation functions.
* Direct file access is blocked with `defined( 'ABSPATH' ) || exit`.
* Admin pages and admin-post actions check `current_user_can( 'manage_options' )`.
* Admin form submissions use WordPress settings API nonces or explicit `check_admin_referer()`.
* Saved settings are sanitized with WordPress sanitization functions.
* Admin output is escaped with `esc_html()`, `esc_attr()`, or `esc_url()`.
* External HTTP requests use `wp_remote_get()` and `wp_remote_post()`.
* No direct SQL queries are used by the plugin.
* GPLv2 license text is included in `LICENSE`.
* The plugin header includes License and License URI.
* No external PHP libraries are bundled.
* The readme discloses the Nurevo external service, data sent, data not sent, privacy policy URL, and planned terms URL.
* Placeholder directory assets are provided.
* Official Plugin Check reports no errors or warnings in the local Docker test environment.

= Remaining Before Submission =

* Publish the terms URL or replace it with the final reachable terms page.
* Replace placeholder icons, banners, and screenshots with final branded assets.
* Replace `Contributors: tuyopon` with the actual WordPress.org user ID if different.
* Confirm `Tested up to` against the latest stable WordPress version at submission time.
* Re-run the official Plugin Check plugin immediately before uploading to WordPress.org SVN.
