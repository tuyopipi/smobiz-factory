import { ENTITY_SCHEMA_FIELDS } from "./aeo-fields.mjs";
export const DEFAULT_SCORING = Object.freeze({
  modelVersion: "u1-v4", weights: { schema:30, coverage:25, legibility:20, llms:15, consistency:10 },
  statusFactors: { OK:1, WARN:0.5, BAD:0 }, invalidSchemaFactor:0.5,
  schemaOk:0.8, coverageOk:0.8, coverageWarn:0.4, coverageMix:[0.6,0.4],
  legibilityMix:[0.6,0.2,0.2], legibilityOk:0.75, legibilityWarn:0.4,
  llmsOk:0.7, gateCap:15, greenAt:80, yellowAt:50,
  // Kept identical to the ruleset snapshot stored by migration 0032. Training
  // bots in this list are ignored by the reachability gate (gateCrawlers() in
  // aeo-score.mjs), so blocking them never lowers a score.
  aiCrawlers:[
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web",
  "PerplexityBot", "Google-Extended", "Applebot-Extended",
],
  factTextPatterns:["(住所|所在地|address|〒\\s*\\d{3})", "(?:tel|電話|phone)[\\s:：]*[+()\\d-]{7,}", "(営業時間|opening hours|月曜|monday)", "(?:latitude|longitude|緯度|経度)", "https?:\\/\\/|公式サイト|website"],
  minVisible:100, minFactText:20, minLlms:120,
  usefulTypes:[
  // Content and generic entities.
  "organization", "localbusiness", "product", "service", "softwareapplication",
  "article", "newsarticle", "blogposting", "faqpage", "website",
  // Food and drink.
  "restaurant", "cafeorcoffeeshop", "bakery", "barorpub", "fastfoodrestaurant",
  "icecreamshop", "winery", "brewery", "distillery",
  // Retail.
  "store", "clothingstore", "grocerystore", "pharmacy", "petstore",
  "furniturestore", "shoppingcenter", "bookstore", "florist", "hardwarestore",
  "jewelrystore", "liquorstore", "mobilephonestore", "officeequipmentstore",
  "shoestore", "sportinggoodsstore", "toystore", "conveniencestore",
  "departmentstore", "electronicsstore", "homegoodsstore",
  // Health and beauty.
  "healthandbeautybusiness", "hairsalon", "beautysalon", "dayspa", "nailsalon",
  "medicalbusiness", "dentist", "physician", "hospital", "veterinarycare",
  "optician", "healthclub", "tattooparlor",
  // Lodging and travel.
  "lodgingbusiness", "hotel", "motel", "hostel", "bedandbreakfast", "resort",
  "campground", "travelagency", "touristinformationcenter",
  // Professional and trade.
  "professionalservice", "legalservice", "accountingservice", "financialservice",
  "insuranceagency", "realestateagent", "notary", "employmentagency",
  "homeandconstructionbusiness", "plumber", "electrician", "generalcontractor",
  "roofingcontractor", "movingcompany", "housepainter", "locksmith",
  "autorepair", "automotivebusiness", "autodealer", "autobodyshop",
  "autopartsstore", "autorental", "autowash", "gasstation", "motorcycledealer",
  // Activity, education and the rest.
  "sportsactivitylocation", "exercisegym", "golfcourse", "skiresort",
  "swimmingpool", "tenniscomplex", "bowlingalley",
  "entertainmentbusiness", "movietheater", "nightclub", "casino", "amusementpark",
  "childcare", "educationalorganization", "school", "preschool", "library",
  "museum", "touristattraction", "selfstorage", "drycleaningorlaundry",
  "emergencyservice", "governmentoffice", "internetcafe", "recyclingcenter",
]
});
export const DEFAULT_GENERATION = {
  entityTemplates: Object.fromEntries(Object.entries({
    WebSite:['@type','@id','url','name','description','publisher'],
    WebPage:['@type','@id','url','name','headline','description','datePublished','dateModified','inLanguage','isPartOf','publisher','mainEntityOfPage','image'],
    BlogPosting:['@type','@id','url','name','headline','description','datePublished','dateModified','inLanguage','isPartOf','publisher','mainEntityOfPage','image','author'],
    FAQPage:['@type','@id','mainEntity'],
    Service:['@type','@id','name','provider','category','additionalProperty','offers','potentialAction']
  }).map(([type,keys])=>[type,Object.fromEntries(keys.map(k=>[k,{source:k}]))])),
  llmsSections: {
    identity:[{source:'name',template:'# {value}'},{source:'description',template:'> {value}'}],
    store_information:[{literal:'## 店舗情報'},{source:'address',template:'- 住所: {value}'},{source:'tel',template:'- 電話: {value}'},{source:'hours',template:'- 営業時間: {value}'},{source:'reserve_url',template:'- 予約: {value}'},{source:'url',template:'- サイト: {value}'}],
    supported_ai_crawlers:[{literal:'## 対応AIクローラー'},{source:'crawlerNames',template:'{value}'}]
  },
  properties: {
    '@context': { source: 'schemaContext', always:true },
    '@type': { source:'schemaType', always:true }, name:{source:'name',always:true},
    url:{source:'canonicalUrl'}, additionalType:{source:'typeLabel'},
    address:{object:{'@type':{literal:'PostalAddress'},streetAddress:{source:'address'}},requires:['address']},
    telephone:{source:'tel'}, openingHours:{source:'hours'}, openingHoursSpecification:{source:'structuredHours'},
    geo:{object:{'@type':{literal:'GeoCoordinates'},latitude:{source:'lat'},longitude:{source:'lng'}},requires:['lat','lng']},
    priceRange:{source:'mappedPrice'},image:{source:'image'},logo:{source:'logo'},
    potentialAction:{object:{'@type':{literal:'ReserveAction'},target:{source:'reserve_url'}},requires:['reserve_url']},
    description:{source:'description',optIn:true},email:{source:'email',optIn:true},
    sameAs:{source:'same_as',optIn:true}
  }
};
export function renderRuleSchema(definition, values, fields, explicit = false) {
  values = {schemaContext:definition.schema.context,...values};
  const present = v => v != null && v !== '' && (!Array.isArray(v) || v.length > 0);
  const read = spec => {
    if (spec.requires?.some(k=>!present(values[k]))) return undefined;
    if ('literal' in spec) return spec.literal;
    if (spec.source) return values[spec.source];
    if (spec.object) return Object.fromEntries(Object.entries(spec.object).map(([k,v])=>[k,read(v)]).filter(([,v])=>present(v)));
  };
  /*
   * optIn properties carry data only the owner can supply (description,
   * email, official/social links). They used to be published only when the
   * ruleset named them, which withheld data a Free owner had already entered
   * and then scored the site down for its absence - a plan penalty, not a real
   * gap. They are now published whenever the owner has entered the value, on
   * every plan, unless the ruleset explicitly retires one (fields[k] === false).
   * What a plan's ruleset version does decide is which properties exist at
   * all: a property a newer generation introduces is still absent from an
   * older one, and that is a real gap.
   */
  const enabled = (k, spec) => spec.always || (spec.optIn ? fields[k] !== false : explicit ? fields[k] === true : fields[k] !== false);
  return Object.fromEntries(Object.entries(definition.generation.properties).filter(([k,spec])=>enabled(k, spec)).map(([k,spec])=>[k,read(spec)]).filter(([,v])=>present(v)));
}
export const INITIAL_AEO_RULESET = Object.freeze({
  version: 1,
  created_at: "2026-09-30T00:00:00.000Z",
  active: 1,
  notes: "Initial ruleset matching the pre-AEO-brain JSON-LD output.",
  definition: Object.freeze({
    scoring: DEFAULT_SCORING,
    generation: DEFAULT_GENERATION,
    schema: Object.freeze({
      context: "https://schema.org",
      type: "LocalBusiness",
      required: ["@context", "@type", "name"],
      recommended: ["url", "additionalType", "address", "telephone", "openingHours", "openingHoursSpecification", "geo", "priceRange", "image", "potentialAction"],
      entityFields: ENTITY_SCHEMA_FIELDS,
      fields: Object.freeze({ url: true, additionalType: true, address: true, telephone: true, openingHours: true, openingHoursSpecification: true, geo: true, priceRange: true, image: true, potentialAction: true }),
      // url is here because a hosted page that does not state its own canonical
      // address was being marked down for a baseline property the publisher
      // never emitted - an unfair deduction, not a tier difference.
      hostedFields: ["url", "address", "openingHoursSpecification", "geo", "telephone", "priceRange"],
      // Which properties a diagnosis counts. Stated here rather than hardcoded
      // in the scorer, because advancing the criteria means widening this list
      // and a site that has not advanced with it should feel the difference.
      scoredProps: ["name", "url", "address", "telephone", "openingHours", "geo"],
      priceLevelMap: Object.freeze({ PRICE_LEVEL_FREE: "Free", PRICE_LEVEL_INEXPENSIVE: "¥", PRICE_LEVEL_MODERATE: "¥¥", PRICE_LEVEL_EXPENSIVE: "¥¥¥", PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥¥" }),
      hostedPriceLevelMap: Object.freeze({ PRICE_LEVEL_FREE: "¥", PRICE_LEVEL_INEXPENSIVE: "¥", PRICE_LEVEL_MODERATE: "¥¥", PRICE_LEVEL_EXPENSIVE: "¥¥¥", PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥" }),
    }),
    llmsTxt: Object.freeze({ format: "markdown", sections: ["identity", "store_information", "supported_ai_crawlers"] }),
    robots: Object.freeze({ defaultAllow: true, aiCrawlerIds: ["gptbot", "oai-search", "chatgpt-user", "claudebot", "perplexity", "google-ext", "applebot-ext", "bytespider"] }),
    defaults: Object.freeze({ schemaType: "LocalBusiness", nameSource: "settings.name_or_site.url", hostedBaseUrl: "https://nurevo.jp/s/" }),
  }),
});
