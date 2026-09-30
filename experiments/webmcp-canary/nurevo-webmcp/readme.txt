=== Nurevo WebMCP ===
Contributors: Nurevo
Tags: seo, schema, json-ld, ai-search, localbusiness
Requires at least: 6.0
Requires PHP: 7.4
Tested up to: 7.1.2
Stable tag: 0.4.0
License: GPLv2 or later

== Description ==

Nurevo outputs LocalBusiness structured data (schema.org JSON-LD) server-side,
so ChatGPT and other AI search engines can read your store information directly.
It does not depend on JavaScript: AI crawlers receive the JSON-LD in the HTML
response. The plugin also provides llms.txt and allows the supported AI crawlers
through robots.txt.

== Main features ==

= 1. Server-rendered schema.org JSON-LD =

After you enter your Nurevo site key, the plugin outputs a complete
`LocalBusiness` JSON-LD block from `wp_head`, including the store name,
address, telephone, URL, geo coordinates, opening hours, and price range.
Because it is rendered on the server, it is available to crawlers that do not
execute JavaScript.

= 2. llms.txt =

The plugin serves a plain-text `/llms.txt` page containing the store details
and the supported AI crawler list.

= 3. AI crawler access in robots.txt =

The supported AI crawler user agents are explicitly allowed in robots.txt when
the site is enabled in Nurevo.

== Optional browser features ==

The separate JavaScript/WebMCP tag may be used for browser-side form analytics
or WebMCP features. It is optional, is not loaded by this plugin, and does not
deliver schema to AI search engines. Use this only for analytics; use the
server-rendered plugin output for AI search.

== Installation ==

1. Upload the `nurevo-webmcp` folder to `/wp-content/plugins/`.
2. Activate **Nurevo WebMCP**.
3. Open **Settings > Nurevo WebMCP**.
4. Paste the public site key issued by the Nurevo dashboard.
5. View the page source and confirm a `script type="application/ld+json"`
   block containing `@type: LocalBusiness`.

The plugin caches the API response briefly in a WordPress transient. No
visitor-entered form values or privileged server secrets are sent.
