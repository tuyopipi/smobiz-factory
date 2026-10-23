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

echo $failures === 0 ? "\nall passed\n" : "\n$failures failed\n";
exit($failures === 0 ? 0 : 1);
