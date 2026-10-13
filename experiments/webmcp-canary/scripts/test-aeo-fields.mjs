import assert from 'node:assert/strict';
import { extractAeoSignals, scoreAeo, buildAeoChecks, localizeAeoChecks, diagnoseSchemaFields } from '../worker/aeo-score.mjs';
import { ENTITY_SCHEMA_FIELDS, localizeFields } from '../worker/aeo-fields.mjs';
const product = {'@type':'Product',name:'Tea',image:'https://example.com/tea.jpg',description:'Green tea',brand:{name:'Tea farm'},sku:'T1',offers:{'@type':'Offer',price:0,priceCurrency:'JPY',availability:'https://schema.org/InStock'},aggregateRating:{ratingValue:4,ratingCount:2}};
const nodes = [product,{'@type':'WebSite',name:'Tea shop',url:'https://example.com'}, {'@type':'Organization',sameAs:['https://example.com/about']}, {'@type':'FAQPage',mainEntity:[{name:'Shipping?',acceptedAnswer:{text:'Free'}}]}];
const html = ns => `<h1>Tea</h1><h2>Green tea</h2><script type="application/ld+json">${JSON.stringify({'@graph':ns})}</script>`;
let signals = extractAeoSignals(html(nodes));
assert.equal(signals.schemaCoreProps,1);
assert.equal(signals.schemaFields.some(f => f.field === 'address'),false);
assert.equal(signals.schemaFields.find(f => f.field === 'offers.price').present,true,'zero price is present');
const incomplete = structuredClone(product); incomplete.offers.priceCurrency = ''; incomplete.sku = null;
signals = extractAeoSignals(html([...nodes,incomplete]));
assert.equal(signals.schemaFields.find(f => f.field === 'offers.priceCurrency').present,false,'one incomplete product must remain visible');
assert.equal(signals.schemaFields.find(f => f.field === 'sku').present,false);
const checks = buildAeoChecks(signals, scoreAeo(signals));
assert.deepEqual(checks.find(c => c.id === 'schema').fields, checks.find(c => c.id === 'coverage').fields);
assert.equal(checks.find(c => c.id === 'schema').status, checks.find(c => c.id === 'coverage').status);
for (const lang of ['ja','en','zh','zh-TW','ko','es','fr','de']) {
  const localized = localizeAeoChecks(checks,lang);
  const fields = localized.find(c => c.id === 'schema').fields;
  assert.ok(fields.every(f => f.label && f.description && f.howTo));
  assert.deepEqual(fields.map(f => f.present), signals.schemaFields.map(f => f.present));
  if (lang !== 'en') assert.notEqual(fields.find(f => f.field === 'offers.price').label,'Price');
}
const expectedProduct = extractAeoSignals('<h1>Shop</h1>', '', '', {catalog:{products:[{name:'Tea'}]}});
assert.ok(expectedProduct.schemaFields.some(f => f.entityType === 'Product' && f.field === 'offers.availability' && !f.present));
assert.ok(extractAeoSignals('<body class="woocommerce">Shop</body>').schemaFields.some(f => f.entityType === 'Product'));
const fields = diagnoseSchemaFields([{'@type':'Restaurant',name:'Shop',geo:{latitude:1},description:'mentions telephone, offers.price'}],{schemaRules:{entityFields:{LocalBusiness:{name:true,geo:true,telephone:true,description:false}}}});
assert.deepEqual(fields.map(f => [f.field,f.present]),[['name',true],['geo',false],['telephone',false]]);
const referenced = {...product, offers:{'@id':'#offer'}};
assert.equal(diagnoseSchemaFields([referenced,{'@id':'#offer','@type':'Offer',price:10}]).find(f => f.field === 'offers.price').present,true);
for (const type of ['Service','BlogPosting','HairSalon']) {
  const entityFields = diagnoseSchemaFields([{'@type':type,name:'X',headline:'X'}]);
  const family = type === 'BlogPosting' ? 'Article' : type === 'HairSalon' ? 'LocalBusiness' : type;
  assert.deepEqual(entityFields.filter(f => f.entityType === family).map(f => f.field),Object.keys(ENTITY_SCHEMA_FIELDS[family]));
}
console.log('AEO entity field diagnostics passed');
const invalid = extractAeoSignals(html(nodes) + '<script type="application/ld+json">{broken}</script>');
assert.equal(scoreAeo(invalid).statuses.schema, scoreAeo(invalid).statuses.coverage, 'invalid markup must not produce contradictory statuses');
const configured = diagnoseSchemaFields(nodes, {schemaRules:{entityFields:{Product:{name:{weight:3},sku:{enabled:false},image:false},WebSite:{url:true}}}});
assert.deepEqual(configured.map(f => [f.entityType,f.field,f.weight]), [['Product','name',3],['WebSite','url',1]], 'only enabled rules are exposed');
const hinted = diagnoseSchemaFields([{'@type':'WebSite',name:'Shop'}], {entityType:'ClothingStore'});
assert.ok(hinted.some(f => f.entityType === 'Product' && !f.present));
assert.ok(hinted.some(f => f.entityType === 'LocalBusiness' && !f.present));
const disabled = diagnoseSchemaFields([{'@type':'Restaurant',name:'Shop'}],{schemaRules:{entityFields:ENTITY_SCHEMA_FIELDS,fields:{telephone:false}}});
assert.ok(!disabled.some(f => f.entityType === 'LocalBusiness' && f.field === 'telephone'));

const software = {'@type':['SoftwareApplication'],name:'Nurevo',description:'AEO tool',applicationCategory:'BusinessApplication',operatingSystem:'WordPress',offers:[{'@type':'Offer',price:0,priceCurrency:'JPY'},{'@type':'Offer',price:3000,priceCurrency:'JPY'}]};
const saas = extractAeoSignals(html([software]));
const softwareFields = saas.schemaFields.filter(f => f.entityType === 'SoftwareApplication');
assert.deepEqual(softwareFields.map(f => f.field),Object.keys(ENTITY_SCHEMA_FIELDS.SoftwareApplication));
assert.ok(softwareFields.every(f => f.present));
assert.ok(saas.schemaTypeMatches);
assert.ok(!saas.schemaFields.some(f => ['Product','LocalBusiness'].includes(f.entityType)));
assert.ok(!extractAeoSignals(html([{'@type':'Service',offers:{'@type':'Offer',price:10}}])).schemaFields.some(f => f.entityType === 'Product'), 'a service Offer is not commerce');
assert.ok(!extractAeoSignals('<h1>Software</h1>', '', '', {entityType:'SoftwareApplication'}).schemaFields.some(f => f.entityType === 'Product'));
assert.ok(!diagnoseSchemaFields([software,product],{commerceDetected:true,catalog:{products:[product]}}).some(f => f.entityType === 'Product'), 'software classification must not require Product');
const missingCurrency = structuredClone(software); delete missingCurrency.offers[1].priceCurrency;
assert.equal(diagnoseSchemaFields([missingCurrency]).find(f => f.field === 'offers.priceCurrency').present,false);
assert.deepEqual(diagnoseSchemaFields([software],{schemaRules:{entityFields:{SoftwareApplication:{name:true,description:false,operatingSystem:{enabled:false}}}}}).map(f => f.field),['name'], 'explicit rules remain authoritative');
for (const lang of ['ja','en','zh','zh-TW','ko','es','fr','de']) {
  const fields = localizeFields(diagnoseSchemaFields([product,software]),lang);
  assert.ok(fields.every(f => f.label && f.description && f.howTo));
  assert.ok(fields.filter(f => f.entityType === 'SoftwareApplication').every(f => !f.howTo.includes('WooCommerce')));
  const products = localizeFields(diagnoseSchemaFields([product]),lang).filter(f => f.entityType === 'Product');
  assert.equal(new Set(products.map(f => f.howTo)).size,products.length);
  const review = /レビュー|reviews|评论|評論|리뷰|reseñas|avis|Rezensionen/;
  assert.ok(products.filter(f => f.field !== 'aggregateRating').every(f => !review.test(f.howTo)));
}
console.log('SaaS classification, explicit rules and field-specific hints passed');
