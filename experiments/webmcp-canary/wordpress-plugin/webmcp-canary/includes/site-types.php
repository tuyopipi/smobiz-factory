<?php
/**
 * Site types: local business (the default), online shop, or B2B / SaaS /
 * professional services.
 *
 * The type changes what this plugin publishes and what the service diagnoses
 * and measures:
 *
 *   local  LocalBusiness with name, address, phone and opening hours - exactly
 *          what the plugin did before site types existed. An unset type is local.
 *   ec     OnlineStore (an Organization subtype), the WooCommerce catalogue as
 *          an OfferCatalog on the front page, and a return policy link. No
 *          address or opening hours are needed.
 *   b2b    Organization plus a Service or SoftwareApplication per entered
 *          service, with its description and page. No address or opening hours
 *          are needed.
 *
 * Nothing is invented: every property comes from a setting the owner entered
 * or from WooCommerce. A product rating is published only when the product has
 * real reviews.
 *
 * @package WebMCP_Canary
 */

if (!defined('ABSPATH')) {
    exit;
}

/** The site types, value => label. */
function webmcp_canary_site_type_labels() {
    return array(
        'local' => __('Local business (shop, salon, clinic, restaurant ...)', 'nurevo-webmcp'),
        'ec' => __('Online shop (e-commerce)', 'nurevo-webmcp'),
        'b2b' => __('B2B / SaaS / professional services', 'nurevo-webmcp'),
    );
}

/** The type the owner chose, or '' when none was chosen yet. */
function webmcp_canary_site_type_choice($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $value = isset($settings['site_type']) ? (string) $settings['site_type'] : '';
    return array_key_exists($value, webmcp_canary_site_type_labels()) ? $value : '';
}

/** The type in effect: the owner's choice, or local. */
function webmcp_canary_site_type($settings = null) {
    $choice = webmcp_canary_site_type_choice($settings);
    return $choice === '' ? 'local' : $choice;
}

/** True for an online shop or a B2B site. */
function webmcp_canary_is_typed_site($settings = null) {
    return webmcp_canary_site_type($settings) !== 'local';
}

/**
 * A type to suggest when the owner has not chosen one: an online shop when
 * WooCommerce is active. Only a suggestion - nothing changes until it is saved.
 */
function webmcp_canary_suggested_site_type($settings = null) {
    if (webmcp_canary_site_type_choice($settings) !== '') {
        return '';
    }
    return webmcp_canary_woocommerce_active() ? 'ec' : '';
}

/**
 * schema.org type of the business node for a typed site. The owner's own type
 * is kept when it fits; otherwise OnlineStore (Google recommends the most
 * specific Organization subtype, OnlineStore for e-commerce) or Organization.
 * The same table as worker/site-type-output.mjs, so what the service expects
 * and what this plugin publishes agree.
 */
function webmcp_canary_typed_business_type($site_type, $configured) {
    $configured = (string) $configured;
    if ($site_type === 'ec') {
        return in_array($configured, array('OnlineStore', 'OnlineBusiness', 'Organization', 'Corporation'), true) ? $configured : 'OnlineStore';
    }
    if ($site_type === 'b2b') {
        $b2b = array(
            'Organization', 'Corporation', 'OnlineBusiness', 'ProfessionalService', 'LegalService', 'AccountingService',
            'FinancialService', 'EmploymentAgency', 'InsuranceAgency', 'NGO', 'EducationalOrganization', 'ResearchOrganization',
        );
        return in_array($configured, $b2b, true) ? $configured : 'Organization';
    }
    return $configured;
}

/** Properties of a place people visit, dropped from a typed site's business node. */
function webmcp_canary_non_local_properties() {
    return array('openingHours', 'openingHoursSpecification', 'geo', 'priceRange', 'potentialAction');
}

/**
 * Pages the owner pointed at, by role: return_policy, shipping_policy (online
 * shop), pricing, case_studies (B2B). For an online shop with no return page
 * entered, WooCommerce's own "Refund and Returns Policy" page is used - but only
 * once it is published, never the draft WooCommerce creates on install.
 */
function webmcp_canary_site_role_pages($settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $type = webmcp_canary_site_type($settings);
    $roles = $type === 'ec' ? array('return_policy', 'shipping_policy') : ($type === 'b2b' ? array('pricing', 'case_studies') : array());
    $pages = array();
    foreach ($roles as $role) {
        $url = trim((string) ($settings[$role . '_url'] ?? ''));
        if ($url === '' && $role === 'return_policy') {
            $url = webmcp_canary_woocommerce_refund_page_url();
        }
        if ($url !== '' && preg_match('#^https?://#i', $url)) {
            $pages[$role] = $url;
        }
    }
    return $pages;
}

/** WooCommerce's published refund/returns page, or ''. */
function webmcp_canary_woocommerce_refund_page_url() {
    if (!webmcp_canary_woocommerce_active() || !function_exists('get_option') || !function_exists('get_post_status')) {
        return '';
    }
    $page_id = (int) get_option('woocommerce_refund_returns_page_id', 0);
    if ($page_id <= 0 || get_post_status($page_id) !== 'publish') {
        return '';
    }
    $url = get_permalink($page_id);
    return is_string($url) ? $url : '';
}

/** Page titles for the catalogue sync, so the service can show what a role page is. */
function webmcp_canary_site_role_labels() {
    return array(
        'return_policy' => __('Return and refund policy', 'nurevo-webmcp'),
        'shipping_policy' => __('Shipping policy', 'nurevo-webmcp'),
        'pricing' => __('Pricing', 'nurevo-webmcp'),
        'case_studies' => __('Case studies', 'nurevo-webmcp'),
    );
}

/**
 * Turn the business node into the one a typed site publishes: its type, none
 * of the visit-a-place properties, and the return policy link of a shop.
 * A local site's node is returned untouched.
 */
function webmcp_canary_typed_business_node($org, $settings = null) {
    $settings = is_array($settings) ? $settings : webmcp_canary_settings();
    $type = webmcp_canary_site_type($settings);
    if ($type === 'local' || !is_array($org)) {
        return $org;
    }
    $org['@type'] = webmcp_canary_typed_business_type($type, isset($org['@type']) && is_string($org['@type']) ? $org['@type'] : '');
    foreach (webmcp_canary_non_local_properties() as $property) {
        unset($org[$property]);
    }
    $pages = webmcp_canary_site_role_pages($settings);
    if ($type === 'ec' && !empty($pages['return_policy'])) {
        // Google accepts a MerchantReturnPolicy with merchantReturnLink alone;
        // nothing else about the policy is stated, because nothing else is known.
        $org['hasMerchantReturnPolicy'] = array(
            '@type' => 'MerchantReturnPolicy',
            'merchantReturnLink' => $pages['return_policy'],
        );
    }
    return $org;
}

/**
 * One WooCommerce product as a Product. An Offer only with a price; a rating
 * only with real reviews; a brand only when the product has one.
 */
function webmcp_canary_product_schema_node($product) {
    if (!is_array($product) || (string) ($product['name'] ?? '') === '') {
        return null;
    }
    $node = array('@type' => 'Product', 'name' => (string) $product['name']);
    if (!empty($product['url'])) {
        $node['url'] = (string) $product['url'];
    }
    if (!empty($product['sku'])) {
        $node['sku'] = (string) $product['sku'];
    }
    if (!empty($product['image'])) {
        $node['image'] = (string) $product['image'];
    }
    if (!empty($product['brand'])) {
        $node['brand'] = array('@type' => 'Brand', 'name' => (string) $product['brand']);
    }
    $rating = isset($product['rating_value']) ? (float) $product['rating_value'] : 0.0;
    $reviews = isset($product['review_count']) ? (int) $product['review_count'] : 0;
    if ($rating > 0 && $rating <= 5 && $reviews > 0) {
        $node['aggregateRating'] = array('@type' => 'AggregateRating', 'ratingValue' => $rating, 'reviewCount' => $reviews);
    }
    if ((string) ($product['price'] ?? '') !== '') {
        $offer = array('@type' => 'Offer', 'price' => (string) $product['price']);
        if (!empty($product['currency'])) {
            $offer['priceCurrency'] = strtoupper((string) $product['currency']);
        }
        if (($product['in_stock'] ?? null) === true) {
            $offer['availability'] = 'https://schema.org/InStock';
        } elseif (($product['in_stock'] ?? null) === false) {
            $offer['availability'] = 'https://schema.org/OutOfStock';
        }
        if (!empty($product['url'])) {
            $offer['url'] = (string) $product['url'];
        }
        $node['offers'] = $offer;
    }
    return $node;
}

/**
 * The shop's catalogue as an OfferCatalog of the store, for the front page.
 *
 * Product markup for rich results belongs on each product page, which
 * WooCommerce prints itself; this does not repeat it there. It tells a reader
 * of the front page what the shop sells, with prices and availability.
 */
function webmcp_canary_offer_catalog_node($site_url, $products = null) {
    $products = is_array($products) ? $products : webmcp_canary_woocommerce_products(30);
    $items = array();
    foreach ($products as $product) {
        $node = webmcp_canary_product_schema_node($product);
        if ($node !== null) {
            $items[] = $node;
        }
        if (count($items) >= 30) {
            break;
        }
    }
    if (empty($items)) {
        return null;
    }
    return array(
        '@type' => 'OfferCatalog',
        '@id' => rtrim((string) $site_url, '/') . '/#offer-catalog',
        'numberOfItems' => count($items),
        'itemListElement' => $items,
    );
}

/** llms.txt lines for the pages a typed site pointed at. */
function webmcp_canary_site_role_llms_lines($settings = null) {
    $labels = array(
        'return_policy' => 'Returns',
        'shipping_policy' => 'Shipping',
        'pricing' => 'Pricing',
        'case_studies' => 'Case studies',
    );
    $lines = array();
    foreach (webmcp_canary_site_role_pages($settings) as $role => $url) {
        $lines[] = '- ' . $labels[$role] . ': ' . $url;
    }
    return $lines;
}

/** The site type setting, with the pages each type points at. */
function webmcp_canary_site_type_field() {
    $settings = webmcp_canary_settings();
    $choice = webmcp_canary_site_type_choice($settings);
    $suggested = webmcp_canary_suggested_site_type($settings);
    $selected = $choice !== '' ? $choice : ($suggested !== '' ? $suggested : 'local');
    echo '<fieldset id="webmcp-site-type">';
    printf('<p><select name="%1$s[site_type]" id="webmcp-site-type-select">', esc_attr(WEBMCP_CANARY_OPTION));
    foreach (webmcp_canary_site_type_labels() as $value => $label) {
        printf('<option value="%1$s"%2$s>%3$s</option>', esc_attr($value), selected($selected, $value, false), esc_html($label));
    }
    echo '</select></p>';
    if ($choice === '' && $suggested === 'ec') {
        echo '<p class="description">' . esc_html__('WooCommerce is active, so Online shop is suggested. Nothing changes until you save.', 'nurevo-webmcp') . '</p>';
    }
    echo '<p class="description">' . esc_html__('This decides what is published for AI, what the diagnosis checks and which questions the AI visibility measurement asks. Online shops and B2B sites do not need an address or opening hours.', 'nurevo-webmcp') . '</p>';
    $urls = array(
        'return_policy_url' => array(__('Return and refund policy page (online shop)', 'nurevo-webmcp'), webmcp_canary_woocommerce_refund_page_url()),
        'shipping_policy_url' => array(__('Shipping policy page (online shop)', 'nurevo-webmcp'), ''),
        'pricing_url' => array(__('Pricing page (B2B)', 'nurevo-webmcp'), ''),
        'case_studies_url' => array(__('Case studies page (B2B)', 'nurevo-webmcp'), ''),
    );
    foreach ($urls as $key => $definition) {
        printf(
            '<p><label>%1$s<br><input type="url" class="regular-text" name="%2$s[%3$s]" value="%4$s" placeholder="%5$s"></label></p>',
            esc_html($definition[0]),
            esc_attr(WEBMCP_CANARY_OPTION),
            esc_attr($key),
            esc_attr((string) ($settings[$key] ?? '')),
            esc_attr($definition[1])
        );
    }
    echo '<p class="description">' . esc_html__('Enter only pages that exist. They are listed in llms.txt; a return policy page is also published as the shop’s MerchantReturnPolicy.', 'nurevo-webmcp') . '</p>';
    echo '</fieldset>';
}

/** Sanitise the site type settings out of a submitted form. */
function webmcp_canary_sanitize_site_type_settings($input, $current) {
    $out = array();
    $type = isset($input['site_type']) ? sanitize_key((string) $input['site_type']) : (string) ($current['site_type'] ?? '');
    $out['site_type'] = array_key_exists($type, webmcp_canary_site_type_labels()) ? $type : '';
    foreach (array('return_policy_url', 'shipping_policy_url', 'pricing_url', 'case_studies_url') as $key) {
        $out[$key] = isset($input[$key]) ? esc_url_raw((string) $input[$key]) : (string) ($current[$key] ?? '');
    }
    return $out;
}
