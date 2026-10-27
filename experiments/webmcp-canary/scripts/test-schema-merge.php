<?php
/**
 * Tests for merging Nurevo's facts into an SEO plugin's JSON-LD graph.
 *
 * Runs without WordPress: the merge functions are pulled out of the plugin
 * source with the tokenizer, so this exercises the shipped code.
 *
 *   php scripts/test-schema-merge.php
 */

$plugin = __DIR__ . '/../wordpress-plugin/webmcp-canary/nurevo-webmcp.php';
$wanted = array(
    'webmcp_canary_merge_graph', 'webmcp_canary_fill_missing', 'webmcp_canary_merge_business_type',
    'webmcp_canary_question_key', 'webmcp_canary_remap_ids', 'webmcp_canary_page_type_families',
    'webmcp_canary_page_type_family', 'webmcp_canary_schema_node_types', 'webmcp_canary_is_business_node',
    'webmcp_canary_local_business_types', 'webmcp_canary_schema_has_property', 'webmcp_canary_schema_merged',
    'webmcp_canary_merge_into_slim_seo_graph',
);

$tokens = token_get_all(file_get_contents($plugin));
$code = '';
for ($i = 0, $n = count($tokens); $i < $n; $i++) {
    if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_FUNCTION) {
        continue;
    }
    $j = $i + 1;
    while (is_array($tokens[$j]) && $tokens[$j][0] === T_WHITESPACE) {
        $j++;
    }
    if (!is_array($tokens[$j]) || !in_array($tokens[$j][1], $wanted, true)) {
        continue;
    }
    $src = '';
    $depth = 0;
    $opened = false;
    for ($k = $i; $k < $n; $k++) {
        $t = $tokens[$k];
        $text = is_array($t) ? $t[1] : $t;
        $src .= $text;
        if ($text === '{' || (is_array($t) && in_array($t[0], array(T_CURLY_OPEN, T_DOLLAR_OPEN_CURLY_BRACES), true))) {
            $depth++;
            $opened = true;
        } elseif ($text === '}') {
            $depth--;
            if ($opened && $depth === 0) {
                break;
            }
        }
    }
    $code .= $src . "\n";
    $i = $k;
}

// Minimal WordPress stand-ins.
$GLOBALS['test_settings'] = array('business_type' => 'HairSalon');
function webmcp_canary_settings() { return $GLOBALS['test_settings']; }
function wp_strip_all_tags($s) { return strip_tags($s); }
$GLOBALS['test_request_allowed'] = true;
function webmcp_canary_schema_request_allowed() { return $GLOBALS['test_request_allowed']; }
// What the filter callbacks build on a real request; set per test as $GLOBALS['test_own'].
$GLOBALS['test_own'] = array();
function webmcp_canary_own_schema_bundle() { return array('core' => $GLOBALS['test_own'], 'extra' => array(), 'central' => false, 'delivery' => array()); }
function webmcp_canary_finalize_own_graph($graph, $bundle) { return $graph; }
eval($code);
foreach ($wanted as $fn) {
    if (!function_exists($fn)) {
        fwrite(STDERR, "missing function in plugin source: $fn\n");
        exit(1);
    }
}

$failures = 0;
function check($label, $ok) {
    global $failures;
    echo ($ok ? "ok   " : "FAIL ") . $label . "\n";
    if (!$ok) {
        $failures++;
    }
}
function count_types($graph, $type) {
    $c = 0;
    foreach ($graph as $node) {
        if (in_array($type, webmcp_canary_schema_node_types($node), true)) {
            $c++;
        }
    }
    return $c;
}
function find_type($graph, $type) {
    foreach ($graph as $node) {
        if (in_array($type, webmcp_canary_schema_node_types($node), true)) {
            return $node;
        }
    }
    return null;
}

// What Nurevo would publish on the FAQ page of a hair salon.
$own = array(
    array('@type' => 'HairSalon', '@id' => 'https://salon.test/#organization', 'name' => 'Lumina',
        'url' => 'https://salon.test/', 'description' => 'Cut and colour',
        'address' => array('@type' => 'PostalAddress', 'streetAddress' => '1-2-3 Omotesando'),
        'telephone' => '+81-3-0000-0000', 'openingHours' => 'Tu-Su 11:00-20:00'),
    array('@type' => 'WebSite', '@id' => 'https://salon.test/#website', 'url' => 'https://salon.test/',
        'name' => 'Lumina', 'publisher' => array('@id' => 'https://salon.test/#organization')),
    array('@type' => 'WebPage', '@id' => 'https://salon.test/#webpage', 'url' => 'https://salon.test/',
        'inLanguage' => 'ja', 'isPartOf' => array('@id' => 'https://salon.test/#website')),
    array('@type' => 'FAQPage', '@id' => 'https://salon.test/#nurevo-faq', 'mainEntity' => array(
        array('@type' => 'Question', 'name' => 'Is there parking?', 'acceptedAnswer' => array('@type' => 'Answer', 'text' => 'Two spaces.')),
        array('@type' => 'Question', 'name' => 'Do you take cards?', 'acceptedAnswer' => array('@type' => 'Answer', 'text' => 'Yes.')),
    )),
    array('@type' => 'Service', '@id' => 'https://salon.test/#service-cut', 'name' => 'Cut',
        'provider' => array('@id' => 'https://salon.test/#organization')),
);

// 1. Yoast free: Organization with name/url/logo only, Yoast FAQ block with one overlapping question.
$yoast = array(
    array('@type' => array('WebPage', 'FAQPage'), '@id' => 'https://salon.test/', 'url' => 'https://salon.test/',
        'isPartOf' => array('@id' => 'https://salon.test/#website'),
        'mainEntity' => array(array('@id' => 'https://salon.test/#faq-q1'))),
    array('@type' => 'Question', '@id' => 'https://salon.test/#faq-q1', 'name' => 'Is there parking?',
        'acceptedAnswer' => array('@type' => 'Answer', 'text' => 'Yes, two.')),
    array('@type' => 'WebSite', '@id' => 'https://salon.test/#website', 'url' => 'https://salon.test/', 'name' => 'Lumina',
        'publisher' => array('@id' => 'https://salon.test/#organization')),
    array('@type' => 'Organization', '@id' => 'https://salon.test/#organization', 'name' => 'Lumina',
        'url' => 'https://salon.test/', 'logo' => array('@type' => 'ImageObject', 'url' => 'https://salon.test/logo.png')),
);
$merged = array_values(webmcp_canary_merge_graph($yoast, $own));
$org = find_type($merged, 'Organization');
check('yoast: one business node', count_types($merged, 'Organization') === 1 && count_types($merged, 'HairSalon') === 1);
check('yoast: address, telephone and hours added to their node', isset($org['address'], $org['telephone'], $org['openingHours']));
check('yoast: their logo and name kept', $org['logo']['url'] === 'https://salon.test/logo.png' && $org['name'] === 'Lumina');
check('yoast: type refined to [Organization, HairSalon]', $org['@type'] === array('Organization', 'HairSalon'));
check('yoast: one WebSite', count_types($merged, 'WebSite') === 1);
check('yoast: one WebPage', count_types($merged, 'WebPage') === 1);
check('yoast: their WebPage gets missing inLanguage', find_type($merged, 'WebPage')['inLanguage'] === 'ja');
check('yoast: one FAQPage', count_types($merged, 'FAQPage') === 1);
$faq = find_type($merged, 'FAQPage');
check('yoast: only the unanswered question is added', count($faq['mainEntity']) === 2 && $faq['mainEntity'][1]['name'] === 'Do you take cards?');
check('yoast: service appended, provider points at their business', find_type($merged, 'Service')['provider']['@id'] === 'https://salon.test/#organization');
check('yoast: result is a list after array_values', array_keys($merged) === range(0, count($merged) - 1));

// 2. Rank Math: keyed graph, business is a LocalBusiness with telephone already set, different @id.
$rank_math = array(
    'publisher' => array('@type' => array('LocalBusiness', 'Organization'), '@id' => 'https://salon.test/#org-rm',
        'name' => 'Lumina Salon', 'telephone' => '03-1111-1111'),
    'WebSite' => array('@type' => 'WebSite', '@id' => 'https://salon.test/#website-rm', 'url' => 'https://salon.test/',
        'publisher' => array('@id' => 'https://salon.test/#org-rm')),
    'WebPage' => array('@type' => 'WebPage', '@id' => 'https://salon.test/#webpage-rm', 'url' => 'https://salon.test/'),
);
$merged = webmcp_canary_merge_graph($rank_math, $own);
check('rank math: keys preserved', isset($merged['publisher'], $merged['WebSite'], $merged['WebPage']));
check('rank math: their telephone not overwritten', $merged['publisher']['telephone'] === '03-1111-1111');
check('rank math: their name not overwritten', $merged['publisher']['name'] === 'Lumina Salon');
check('rank math: address and hours added', isset($merged['publisher']['address'], $merged['publisher']['openingHours']));
check('rank math: HairSalon added to their types', in_array('HairSalon', (array) $merged['publisher']['@type'], true) && in_array('LocalBusiness', (array) $merged['publisher']['@type'], true));
check('rank math: no second business node', count_types($merged, 'HairSalon') === 1 && count_types($merged, 'LocalBusiness') === 1);
check('rank math: no FAQ of theirs, ours appended once', count_types($merged, 'FAQPage') === 1 && count(find_type($merged, 'FAQPage')['mainEntity']) === 2);
check('rank math: service provider remapped to their id', find_type($merged, 'Service')['provider']['@id'] === 'https://salon.test/#org-rm');
check('rank math: new nodes under nurevo-* keys', isset($merged['nurevo-0']));

// 3. AIOSEO with a complete business node and opening hours as a specification.
$aioseo = array(
    array('@type' => 'HairSalon', '@id' => 'https://salon.test/#organization', 'name' => 'Lumina', 'url' => 'https://salon.test/',
        'address' => array('@type' => 'PostalAddress', 'streetAddress' => 'Theirs'), 'telephone' => '+81-3-2222-2222',
        'openingHoursSpecification' => array(array('@type' => 'OpeningHoursSpecification', 'dayOfWeek' => 'Tuesday', 'opens' => '11:00', 'closes' => '20:00'))),
    array('@type' => 'WebSite', '@id' => 'https://salon.test/#website'),
);
$merged = array_values(webmcp_canary_merge_graph($aioseo, $own));
$biz = find_type($merged, 'HairSalon');
check('aioseo: their address kept', $biz['address']['streetAddress'] === 'Theirs');
check('aioseo: no openingHours added next to their specification', !isset($biz['openingHours']));
check('aioseo: type unchanged when already specific', $biz['@type'] === 'HairSalon');
check('aioseo: only description is new on the business', $biz['description'] === 'Cut and colour');
check('aioseo: one business node', count_types($merged, 'HairSalon') === 1);

// 4. A personal site: Yoast's representative is a Person. The business is new information.
$person_site = array(
    array('@type' => 'Person', '@id' => 'https://salon.test/#/schema/person/1', 'name' => 'Aki'),
    array('@type' => 'WebSite', '@id' => 'https://salon.test/#website', 'publisher' => array('@id' => 'https://salon.test/#/schema/person/1')),
);
$merged = array_values(webmcp_canary_merge_graph($person_site, $own));
check('person site: Person left untouched', !isset(find_type($merged, 'Person')['address']));
check('person site: business node added once', count_types($merged, 'HairSalon') === 1);
check('person site: their WebSite publisher unchanged', find_type($merged, 'WebSite')['publisher']['@id'] === 'https://salon.test/#/schema/person/1');

// 4b. Structured hours from Nurevo fill a node with no hours, and never sit
// beside hours of theirs in either form.
$own_spec = $own;
unset($own_spec[0]['openingHours']);
$own_spec[0]['openingHoursSpecification'] = array(array('@type' => 'OpeningHoursSpecification',
    'dayOfWeek' => array('https://schema.org/Tuesday'), 'opens' => '11:00', 'closes' => '20:00'));
$merged = array_values(webmcp_canary_merge_graph($yoast, $own_spec));
$org = find_type($merged, 'Organization');
check('spec: added to a node without hours', !empty($org['openingHoursSpecification']) && !isset($org['openingHours']));
$their_text = $yoast;
$their_text[3]['openingHours'] = 'Mo-Fr 9:00-17:00';
$merged = array_values(webmcp_canary_merge_graph($their_text, $own_spec));
$org = find_type($merged, 'Organization');
check('spec: not added next to their openingHours text', !isset($org['openingHoursSpecification']) && $org['openingHours'] === 'Mo-Fr 9:00-17:00');

// 5. Merge marks the request, so the standalone output is skipped.
check('merge sets the merged flag', webmcp_canary_schema_merged() === true);

/* 6. Slim SEO (github.com/elightup/slim-seo, src/Schema/Manager.php).
 *
 * Its slim_seo_schema_graph filter receives the entities keyed by context
 * ('website', 'searchaction', 'breadcrumblist', 'webpage', 'readaction',
 * 'organization', 'logo', then 'thumbnail'/'article'/'author' on posts), each
 * built by Types\Base::get_schema(): @id is trailingslashit(url) . '#' . context,
 * references are {"@id": ...}, empty values are array_filter()ed away. After the
 * filter Slim SEO array_values()es the graph and prints it as one block. This is
 * that graph for the front page of a static-front-page site with a logo. */
function slim_seo_front_page_graph() {
    return array(
        'website' => array('@type' => 'WebSite', '@id' => 'https://salon.test/#website', 'url' => 'https://salon.test/',
            'name' => 'Lumina Hair', 'description' => 'Hair salon in Omotesando', 'inLanguage' => 'ja',
            'potentialAction' => array('@id' => 'https://salon.test/#searchaction'), 'publisher' => array('@id' => 'https://salon.test/#organization')),
        'searchaction' => array('@type' => 'SearchAction', '@id' => 'https://salon.test/#searchaction',
            'target' => 'https://salon.test/?s={search_term_string}', 'query-input' => 'required name=search_term_string'),
        'webpage' => array('@type' => 'WebPage', '@id' => 'https://salon.test/#webpage', 'url' => 'https://salon.test/',
            'inLanguage' => 'ja', 'name' => 'Lumina Hair', 'datePublished' => '2026-01-10T09:00:00+09:00', 'dateModified' => '2026-10-01T09:00:00+09:00',
            'isPartOf' => array('@id' => 'https://salon.test/#website'), 'potentialAction' => array('@id' => 'https://salon.test/#readaction'),
            'about' => array('@id' => 'https://salon.test/#organization')),
        'readaction' => array('@type' => 'ReadAction', '@id' => 'https://salon.test/#readaction', 'target' => 'https://salon.test/'),
        'organization' => array('@type' => 'Organization', '@id' => 'https://salon.test/#organization', 'url' => 'https://salon.test/',
            'name' => 'Lumina Hair', 'logo' => array('@id' => 'https://salon.test/#logo'), 'image' => array('@id' => 'https://salon.test/#logo')),
        'logo' => array('@type' => 'ImageObject', '@id' => 'https://salon.test/#logo', 'url' => 'https://salon.test/logo.png',
            'contentUrl' => 'https://salon.test/logo.png', 'width' => 512, 'height' => 512),
    );
}
function all_ids_unique($graph) {
    $ids = array();
    foreach ($graph as $node) {
        if (isset($node['@id'])) {
            if (isset($ids[$node['@id']])) {
                return false;
            }
            $ids[$node['@id']] = true;
        }
    }
    return true;
}

webmcp_canary_schema_merged(false);
$GLOBALS['test_own'] = $own;
$slim = slim_seo_front_page_graph();
$keyed = webmcp_canary_merge_into_slim_seo_graph($slim);
check('slim seo: entity keys preserved', isset($keyed['website'], $keyed['searchaction'], $keyed['webpage'], $keyed['readaction'], $keyed['organization'], $keyed['logo']));
check('slim seo: new nodes under nurevo-* keys', isset($keyed['nurevo-0']));
check('slim seo: merge sets the merged flag', webmcp_canary_schema_merged() === true);
$merged = array_values($keyed);   // what Slim SEO prints
$org = $keyed['organization'];
check('slim seo: one business node, under its @id', count_types($merged, 'Organization') === 1 && count_types($merged, 'HairSalon') === 1 && $org['@id'] === 'https://salon.test/#organization');
check('slim seo: type refined to [Organization, HairSalon]', $org['@type'] === array('Organization', 'HairSalon'));
check('slim seo: address, telephone, hours and description added', isset($org['address'], $org['telephone'], $org['openingHours']) && $org['description'] === 'Cut and colour');
check('slim seo: its name, url and logo reference kept', $org['name'] === 'Lumina Hair' && $org['url'] === 'https://salon.test/' && $org['logo'] === array('@id' => 'https://salon.test/#logo'));
check('slim seo: one WebSite, its description kept', count_types($merged, 'WebSite') === 1 && $keyed['website']['description'] === 'Hair salon in Omotesando');
check('slim seo: its WebSite publisher still points at its Organization', $keyed['website']['publisher']['@id'] === 'https://salon.test/#organization');
check('slim seo: one WebPage, its name kept', count_types($merged, 'WebPage') === 1 && $keyed['webpage']['name'] === 'Lumina Hair');
check('slim seo: SearchAction, ReadAction and logo untouched', $keyed['searchaction'] === $slim['searchaction'] && $keyed['readaction'] === $slim['readaction'] && $keyed['logo'] === $slim['logo']);
check('slim seo: no FAQ of its own, ours added once with both questions', count_types($merged, 'FAQPage') === 1 && count(find_type($merged, 'FAQPage')['mainEntity']) === 2);
check('slim seo: service added once, provider is its Organization', count_types($merged, 'Service') === 1 && find_type($merged, 'Service')['provider']['@id'] === 'https://salon.test/#organization');
check('slim seo: no @id appears twice', all_ids_unique($merged));

// No overwrite: values a developer added through slim_seo_schema_organization stay.
webmcp_canary_schema_merged(false);
$slim_full = slim_seo_front_page_graph();
$slim_full['organization']['@type'] = 'HairSalon';
$slim_full['organization']['telephone'] = '+81-3-9999-9999';
$slim_full['organization']['address'] = array('@type' => 'PostalAddress', 'streetAddress' => 'Theirs');
$slim_full['organization']['openingHoursSpecification'] = array(array('@type' => 'OpeningHoursSpecification', 'dayOfWeek' => 'Monday', 'opens' => '10:00', 'closes' => '19:00'));
$org = webmcp_canary_merge_into_slim_seo_graph($slim_full)['organization'];
check('slim seo no-overwrite: telephone kept', $org['telephone'] === '+81-3-9999-9999');
check('slim seo no-overwrite: address kept', $org['address']['streetAddress'] === 'Theirs');
check('slim seo no-overwrite: no openingHours beside their specification', !isset($org['openingHours']));
check('slim seo no-overwrite: type left as is', $org['@type'] === 'HairSalon');

// Organization entity switched off (slim_seo_schema_organization_enable): Slim SEO drops the
// node and every reference to it, so the business is new information, added once.
webmcp_canary_schema_merged(false);
$no_org = slim_seo_front_page_graph();
unset($no_org['organization'], $no_org['logo'], $no_org['website']['publisher'], $no_org['webpage']['about']);
$merged = array_values(webmcp_canary_merge_into_slim_seo_graph($no_org));
check('slim seo without Organization: our business node added once', count_types($merged, 'HairSalon') === 1 && find_type($merged, 'HairSalon')['@id'] === 'https://salon.test/#organization');
check('slim seo without Organization: still one WebSite', count_types($merged, 'WebSite') === 1);

// A blog post: Slim SEO's Article and author Person stay; our BlogPosting is not added beside them.
webmcp_canary_schema_merged(false);
$post = slim_seo_front_page_graph();
unset($post['webpage']['about']);
$post['webpage']['@id'] = 'https://salon.test/news/open/#webpage';
$post['article'] = array('@type' => 'Article', '@id' => 'https://salon.test/news/open/#article', 'url' => 'https://salon.test/news/open/',
    'headline' => 'We are open', 'isPartOf' => array('@id' => 'https://salon.test/news/open/#webpage'),
    'mainEntityOfPage' => array('@id' => 'https://salon.test/news/open/#webpage'), 'publisher' => array('@id' => 'https://salon.test/#organization'),
    'author' => array('@id' => 'https://salon.test/#/schema/person/0c8e2f9b'));
$post['author'] = array('@type' => 'Person', '@id' => 'https://salon.test/#/schema/person/0c8e2f9b', 'name' => 'Aki');
$own_post = array(
    $own[0], $own[1],
    array('@type' => 'BlogPosting', '@id' => 'https://salon.test/news/open#article', 'headline' => 'We are open',
        'description' => 'Opening news', 'publisher' => array('@id' => 'https://salon.test/#organization')),
);
$GLOBALS['test_own'] = $own_post;
$merged = array_values(webmcp_canary_merge_into_slim_seo_graph($post));
$GLOBALS['test_own'] = $own;
check('slim seo post: one article, theirs, with our missing description', count_types($merged, 'Article') === 1 && count_types($merged, 'BlogPosting') === 0 && find_type($merged, 'Article')['description'] === 'Opening news' && find_type($merged, 'Article')['headline'] === 'We are open');
check('slim seo post: author Person untouched', find_type($merged, 'Person') === $post['author']);

// Site types: an online shop is an OnlineStore with no opening hours, a B2B site an Organization.
webmcp_canary_schema_merged(false);
$own_ec = array(
    array('@type' => 'OnlineStore', '@id' => 'https://salon.test/#organization', 'name' => 'Lumina Shop', 'url' => 'https://salon.test/',
        'telephone' => '+81-3-0000-0000', 'email' => 'shop@salon.test',
        'hasMerchantReturnPolicy' => array('@type' => 'MerchantReturnPolicy', 'merchantReturnLink' => 'https://salon.test/returns'),
        'hasOfferCatalog' => array('@id' => 'https://salon.test/#catalog')),
    array('@type' => 'WebSite', '@id' => 'https://salon.test/#website', 'url' => 'https://salon.test/'),
    array('@type' => 'OfferCatalog', '@id' => 'https://salon.test/#catalog', 'name' => 'Products', 'itemListElement' => array()),
);
$keyed = webmcp_canary_merge_graph(slim_seo_front_page_graph(), $own_ec);
$org = $keyed['organization'];
check('slim seo ec: OnlineStore added to their Organization', $org['@type'] === array('Organization', 'OnlineStore'));
check('slim seo ec: no opening hours added', !isset($org['openingHours']) && !isset($org['openingHoursSpecification']));
check('slim seo ec: return policy, catalogue link, telephone and email added', isset($org['hasMerchantReturnPolicy'], $org['telephone'], $org['email']) && $org['hasOfferCatalog']['@id'] === 'https://salon.test/#catalog');
check('slim seo ec: catalogue appended once', count_types(array_values($keyed), 'OfferCatalog') === 1);
check('slim seo ec: their name kept', $org['name'] === 'Lumina Hair');

$own_b2b = array(
    array('@type' => 'Organization', '@id' => 'https://salon.test/#organization', 'name' => 'Lumina Inc.', 'url' => 'https://salon.test/',
        'description' => 'Payroll software', 'address' => array('@type' => 'PostalAddress', 'streetAddress' => '1-2-3 Marunouchi')),
    array('@type' => 'SoftwareApplication', '@id' => 'https://salon.test/#service-payroll', 'name' => 'Payroll Cloud',
        'provider' => array('@id' => 'https://salon.test/#organization')),
);
$keyed = webmcp_canary_merge_graph(slim_seo_front_page_graph(), $own_b2b);
$org = $keyed['organization'];
check('slim seo b2b: type stays Organization', $org['@type'] === 'Organization');
check('slim seo b2b: description and address added, no hours', $org['description'] === 'Payroll software' && isset($org['address']) && !isset($org['openingHours']));
check('slim seo b2b: software added once, provided by their Organization', count_types(array_values($keyed), 'SoftwareApplication') === 1 && find_type(array_values($keyed), 'SoftwareApplication')['provider']['@id'] === 'https://salon.test/#organization');

// Guards: an empty graph, a request without Nurevo schema, and a request already merged elsewhere.
webmcp_canary_schema_merged(false);
check('slim seo guard: empty graph left empty', webmcp_canary_merge_into_slim_seo_graph(array()) === array() && webmcp_canary_schema_merged() === false);
$GLOBALS['test_request_allowed'] = false;
check('slim seo guard: request without Nurevo schema untouched', webmcp_canary_merge_into_slim_seo_graph(slim_seo_front_page_graph()) === slim_seo_front_page_graph());
$GLOBALS['test_request_allowed'] = true;
webmcp_canary_schema_merged(true);
check('slim seo guard: not merged twice on one request', webmcp_canary_merge_into_slim_seo_graph(slim_seo_front_page_graph()) === slim_seo_front_page_graph());

echo $failures === 0 ? "\nall passed\n" : "\n$failures failed\n";
exit($failures === 0 ? 0 : 1);
