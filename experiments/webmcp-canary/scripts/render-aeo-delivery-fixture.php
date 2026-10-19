<?php
// Real plugin sync + output with the repository's WordPress API stubs.
ob_start();
require __DIR__ . '/test-wordpress-aeo-admin.php';
ob_end_clean();
function do_action($hook, ...$args) { $GLOBALS['aeo_fixture_actions'][] = $hook; }
function wp_cache_flush() { $GLOBALS['aeo_fixture_flushes'] = 1 + ($GLOBALS['aeo_fixture_flushes'] ?? 0); }
$body = json_decode(file_get_contents($argv[1]), true);
$GLOBALS['webmcp_test_active_plugins'] = array();
$GLOBALS['webmcp_test_posts'] = array((object)array('post_content' => '住所: 〒100-0001 東京都千代田区千代田1-1'));
$GLOBALS['webmcp_test_options'][WEBMCP_CANARY_OPTION] = array_merge(webmcp_canary_default_settings(), array(
 'enabled'=>'1','serve_schema'=>'0','serve_llms_txt'=>'0','allow_ai_crawlers'=>'0',
 'plan'=>'standard','site_key'=>'nrv_test','site_id'=>'s1','tag_url'=>'https://nurevo.jp/tag.js',
 'business_name'=>'Fixture Cafe','business_url'=>'https://example.test/',
 'business_type'=>$body['jsonld']['@type'], 'business_description'=>$body['jsonld']['description'] ?? '',
 'business_email'=>$body['jsonld']['email'] ?? '', 'business_phone'=>$body['jsonld']['telephone'] ?? '', 'business_hours'=>$body['jsonld']['openingHours'] ?? ''
));
$GLOBALS['webmcp_test_options']['blog_public'] = 1;
delete_option(WEBMCP_CANARY_RULESET_OPTION);
delete_option('webmcp_canary_autofix_state');
$GLOBALS['webmcp_test_remote_get'] = array('api/tag/config'=>array('status'=>200,'body'=>json_encode($body)));
$state = webmcp_canary_sync_ruleset(true);
$flushes = $GLOBALS['aeo_fixture_flushes'] ?? 0;
webmcp_canary_sync_ruleset(true);
expect(($GLOBALS['aeo_fixture_flushes'] ?? 0) === $flushes, 'same autofix job does not reapply or purge again');
expect(webmcp_canary_settings()['serve_schema'] === '1', 'daily autofix enables raw schema');
expect(webmcp_canary_settings()['business_address'] !== '', 'existing local harvester fills published address');
ob_start(); webmcp_canary_output_server_schema(); $html = ob_get_clean();
expect(strpos($html,'nurevo-aeo-delivery') !== false, 'central payload emits delivery marker');
ob_start(); webmcp_canary_autofix_notice(); $notice=ob_get_clean();
expect(strpos($notice,'confirmation') !== false, 'missing facts notify the WP owner');
$local_check = webmcp_canary_central_business_node(array('@type'=>'CafeOrCoffeeShop','name'=>'Local real name','url'=>'https://example.test/','logo'=>'https://example.test/logo.png'), array_merge(webmcp_canary_settings(),array('business_address'=>'Different actual address')), $state);
expect($local_check['name'] === 'Local real name' && !empty($local_check['logo']), 'central templates retain unsynced local facts and logo');
expect(!isset($local_check['geo']), 'central coordinates cannot contradict the local owner address');
$robots = webmcp_canary_allow_ai_crawlers_robots_txt('', true);
echo json_encode(array('robots'=>$robots,'html'=>$html,'state'=>$state,'notice'=>$notice,'flushes'=>$flushes));
