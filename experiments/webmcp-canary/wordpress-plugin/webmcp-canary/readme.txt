=== Nurevo AEO ===
Contributors: tuyopon
Tags: aeo, ai-search, schema, structured-data, llms-txt
Requires at least: 6.1
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.5.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Be read correctly by AI search. Diagnose AI readability and publish schema.org structured data, llms.txt and AI crawler rules, free.

== Description ==

Nurevo AEO prepares your WordPress site for AEO (Answer Engine Optimization): being found, read and quoted correctly by AI search services such as ChatGPT, Perplexity, Google AI Overviews, Gemini and Claude.

Those crawlers usually read raw HTML without running JavaScript. Anything meant for them therefore has to be rendered server-side. Nurevo AEO does that rendering, and tells you what is still missing.

= Free, and genuinely complete =

Everything below runs on the free plan. No license key, no trial period, no feature timer.

* **AEO score** — a 0 to 100 score with traffic-light alerts and a concrete checklist of what to fix.
* **One-click fixes** — basic schema.org structured data, llms.txt and AI crawler access are fixed from the admin screen.
* **Server-rendered schema.org JSON-LD** — emitted into the page HTML, so crawlers that never run JavaScript still read it.
* **llms.txt** — served at `/llms.txt`. Generated inside the plugin from your WordPress content, so it works with no site key and no network access.
* **AI crawler rules** — robots.txt entries that explicitly allow GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended and Bytespider.
* **Business data extraction** — reads your existing SEO plugin settings, WordPress options and clearly labelled public content to fill in blank fields only. Values you have typed are never overwritten.

= Works alongside Yoast SEO and Rank Math =

Keep your SEO plugin. The two jobs are different: Yoast SEO or Rank Math handle search ranking, Nurevo AEO handles whether an AI can read your facts.

Nurevo AEO reads the structured data your site actually serves and suppresses only the nodes your SEO plugin genuinely publishes in full. Nothing is assumed from the fact that a plugin is installed.

That distinction matters. The free tiers of these plugins publish an Organization with a name, a URL and a logo, but no address, telephone or opening hours - those belong to their paid local-SEO add-ons. A plugin that stepped aside merely because Yoast was present would leave your page with no address, phone or hours at all, which is worse than a duplicate: a duplicate is visible, a gap is silent.

So when your SEO plugin publishes a complete business entity, Nurevo AEO stays out of the way. When it publishes an incomplete one, Nurevo AEO supplies the missing facts under the same @id, so the two describe one business rather than two. The result is no duplicate schema and no missing information.

Page-level nodes - WebSite, WebPage, Article, BreadcrumbList and the rest - are always left to your SEO plugin when it publishes them, because it owns that context. AEO-specific nodes such as FAQPage and opening hours are always Nurevo's. You can turn the whole arrangement off in the settings.

The Nurevo AEO screen shows which plugin publishes each schema type, including where Nurevo is filling a gap.

= Plans =

* **Free — 0 JPY.** Everything listed above, in full.
* **Standard — 3,000 JPY/month.** "Always current". AEO criteria keep changing. Licensed sites receive the current central ruleset from the Nurevo service and get a notice in wp-admin when the criteria change. Free sites keep running on the ruleset bundled with the plugin.
* **Pro — from 14,800 JPY/month.** AI visibility measurement: how often your business appears in AI answers, with competitor comparison and history. **This is a beta feature** and the numbers should be read as indicative.

No paid PHP is bundled in this plugin and nothing in the download is locked. The only difference a license makes is which ruleset the Nurevo service returns and whether the measurement screen is enabled. Paid plans require an account at https://nurevo.jp/ and are billed there, not through WordPress.

= External services =

This plugin relies on the Nurevo service, operated by Bestie. LLC. It is not required for the free output described above.

**Nothing is sent from your public pages by default.** Installing and enabling the plugin adds no third-party script to your site and transmits no visitor data. The structured data, llms.txt and AI crawler rules are all produced by the plugin itself, on your own server.

**The browser tag is opt-in and off by default.** Settings has an optional "Load the Nurevo browser tag on public pages" checkbox, unchecked unless you tick it. While it is off, no script is enqueued and nothing about your visitors reaches the service. If you turn it on, a script is loaded from the configured service URL (by default `https://nurevo.jp/tag.js`) on every public page view, carrying your public site key. It reports public form structure — field names, types, labels, selectors and option counts — and privacy-safe submission outcomes. It is designed not to transmit values a visitor typed: no names, email addresses, phone numbers, message bodies or payment details. Unticking the box stops it immediately. You do not need it for AEO.

**Admin requests.** These are the requests the plugin does make, and they happen only in wp-admin, when you open or refresh the relevant screen. No visitor is involved:

* AEO score — the service fetches and inspects your site's public pages. Sends your site URL, and the site key when registered. Endpoints: `/api/aeo/score`, `/api/sites/{id}/aeo-score`.
* License verification — sends the license key and site key when you save a license. Endpoint: `/api/license/verify`.
* Site registration and key management — sends your site host and URL. Endpoints: `/api/site-key`, `/api/site-key/regenerate`, `/api/site-key/disable`.
* Hosted llms.txt and site insights — sends the site key and host. Endpoints: `/api/llms.txt`, `/api/site-insights`, `/api/tag/config`.
* AI visibility measurement (Pro, beta) — sends the site key and site id. Endpoint: `/api/sites/{id}/sov`.

Business information you have configured — name, address, phone, opening hours, business type and similar public details — is sent with registration and profile requests so the service can produce the same structured data your site publishes.

The site key is a public identifier. It appears in markup served to browsers, so never put a server secret in it. The license key is separate and is never printed into public pages.

By using these features you agree to the service's terms. Please read them before entering a key:

* Privacy Policy: https://nurevo.jp/privacy
* Terms of Service: https://nurevo.jp/terms

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`, or install the zip from Plugins > Add New > Upload Plugin.
2. Activate **Nurevo AEO** on the Plugins screen.
3. Open **Nurevo AEO > Settings** and enable it.
4. Check the business information the plugin extracted automatically and correct anything wrong. It only fills blanks, so nothing you typed was replaced.
5. Open **Nurevo AEO > AEO Score** to run the diagnosis and apply the free fixes.
6. A site key and a license key are optional. They are only needed for diagnostics history held by the service and for the Standard "always current" ruleset.

== Frequently Asked Questions ==

= What is AEO? =

AEO (Answer Engine Optimization) is about being quoted correctly inside AI answers from ChatGPT, Perplexity, Google AI and others. Classic SEO is about where you rank in a list of links. AEO is about whether a machine can read your facts at all.

= Can I use this with Yoast SEO or Rank Math? =

Yes, and you should. Keep your SEO plugin for search ranking and let Nurevo AEO handle the AI-facing output. Nurevo AEO looks at what your site actually publishes and only suppresses what your SEO plugin already covers completely, so you get neither duplicate schema nor a gap.

= My SEO plugin already outputs schema. Will this duplicate it? =

No. Nurevo AEO checks the structured data your pages actually serve. Where your SEO plugin publishes a complete business entity it publishes nothing of its own; where that entity is missing an address, telephone or opening hours - which is the normal case on the free tiers - it adds those under the same @id, so search engines and AI read one business, not two.

= How much works without paying? =

All of it, except the two things listed under Plans. The score, alerts and checklist, the one-click fixes, server-rendered JSON-LD, llms.txt, AI crawler rules, data extraction and SEO plugin coexistence are free and unlimited.

= What does "always current" actually mean? =

What counts as good AEO keeps moving. On Standard, the service returns the current central ruleset and wp-admin tells you when the criteria changed so you can re-run the diagnosis. On Free the plugin keeps using the ruleset it shipped with; your existing output does not stop working or degrade.

= Is paid functionality hidden in the download? =

No. There is no locked or encrypted PHP in this plugin. A license changes which ruleset the service returns and unlocks the measurement screen. Nothing else.

= Does llms.txt work without the external service? =

Yes. With no site key, or when the service cannot be reached, the plugin builds `/llms.txt` from your WordPress content and serves it itself.

= Does this replace my SEO plugin? =

No. Keep using a traditional SEO plugin for ordinary search. Nurevo AEO adds AI-facing diagnosis, llms.txt, crawler rules and structured data that coexists with it.

= Does the plugin put anything on my public pages that talks to your servers? =

Not unless you ask it to. The optional browser tag is off by default, and with it off no third-party script is loaded and no visitor data is sent anywhere. The AEO features do not use it. The requests the plugin does make happen in wp-admin, when you open the relevant screen.

= Does it send what my visitors type into forms? =

No. Even with the optional browser tag turned on, it reads public form structure and privacy-safe outcomes only. It is designed not to transmit entered values such as names, email addresses, phone numbers, message bodies or payment details.

= Is the site key a secret? =

No. It is a public identifier that appears in markup sent to browsers. Never use a server secret as a site key. The license key is a different value and is never output to public pages.

= How accurate is the AI visibility measurement? =

It is a beta feature. It samples AI answers rather than observing every response, so treat the figures as a direction of travel rather than an exact share. This is why the screen is labelled beta.

== Screenshots ==

1. Your AEO score and a checklist of exactly what to fix — read from your live pages.
2. One-click fixes: publish llms.txt and server-side schema without touching code.
3. Works with Yoast SEO and Rank Math — Nurevo fills the business details they leave out, no duplicate schema.

== Changelog ==

= 0.5.1 =

* Smart coexistence: fills the business data your SEO plugin leaves out (same @id, no duplicate schema). Previously any supported SEO plugin suppressed the business node outright, so sites running the free tiers published no address, telephone or opening hours at all.
* The admin screens are now in English, and Japanese is supplied as a translation. Previously much of the interface was hardcoded Japanese and showed Japanese whatever your site language was.
* Japanese sites are unaffected: every existing Japanese wording is carried over in the bundled translation.
* Dropped the en_US catalogue, which could only repeat the English source back to itself.
* No change to behaviour, output or settings.

= 0.5.0 =

* Renamed the plugin to Nurevo AEO and refocused it on AI-search readiness.
* Added the AEO score: 0 to 100 with traffic-light alerts and a checklist.
* Added free one-click fixes for basic schema, llms.txt and AI crawler access.
* Added server-rendered schema.org JSON-LD, locally generated llms.txt and robots.txt rules for the major AI crawlers.
* Added automatic business-data extraction that fills blank fields only.
* Added Yoast SEO, Rank Math and All in One SEO coexistence with automatic duplicate-schema avoidance.
* Added the optional Standard "always current" ruleset with a wp-admin notice when AEO criteria change.
* Added the Pro AI visibility measurement screen (beta).
* The browser tag is now opt-in and off by default. A fresh install, and an upgrade from 0.4.0, load no third-party script on public pages and send no visitor data. Enable it under Settings if you need it.
* Renamed the main plugin file to `nurevo-webmcp.php` so the plugin keeps its identity across the update.

= 0.4.0 =

* Server-side LocalBusiness JSON-LD, llms.txt and robots.txt output under the Nurevo WebMCP name.

== Upgrade Notice ==

= 0.5.1 =

Smart coexistence: Nurevo now fills in the business details your SEO plugin leaves out instead of staying silent, so your address, phone and hours reach AI. The admin screens are now in English, with Japanese supplied as a translation.

= 0.5.0 =

Nurevo WebMCP is now Nurevo AEO. Adds a free AEO score, one-click fixes, llms.txt and AI crawler rules, and coexistence with Yoast SEO and Rank Math. Your settings are preserved. Note that the browser tag is now off by default: if you were relying on it, re-enable it under Settings.
