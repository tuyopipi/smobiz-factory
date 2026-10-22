/**
 * Locale handling for AI share-of-voice measurement.
 *
 * Three questions are answered here, all conservatively:
 *   1. Which language should the measurement questions be asked in?
 *   2. What locality (city / ward) does the business's address name?
 *   3. How should a question be phrased in that language?
 *
 * Japanese is the product's home market and its behaviour is frozen: a
 * Japanese address goes through the original parser untouched and the Japanese
 * templates live in aeo-sov.mjs exactly as they were. Everything here only
 * decides when *not* to use them.
 */

export const SOV_LANGUAGES = Object.freeze(["ja", "en", "zh-Hans", "zh-Hant", "ko", "es", "fr", "de", "pt", "it"]);

/** Map a BCP-47-ish tag ("en_US", "zh-TW", "pt-BR") to a supported language, or null. */
export function normalizeLanguageTag(tag) {
  const raw = String(tag || "").trim().replace(/_/g, "-").toLowerCase();
  if (!raw) return null;
  if (/^zh(-|$)/.test(raw)) return /^zh-(tw|hk|mo|hant)/.test(raw) ? "zh-Hant" : "zh-Hans";
  const base = raw.split("-")[0];
  return ["ja", "en", "ko", "es", "fr", "de", "pt", "it"].includes(base) ? base : null;
}

/* ------------------------------------------------------------------ *
 * Script detection
 * ------------------------------------------------------------------ */

const KANA = /[぀-ヿㇰ-ㇿｦ-ﾟ]/;
const HANGUL = /[가-힯ᄀ-ᇿ㄰-㆏]/;
const HAN = /[㐀-鿿豈-﫿]/;
const JP_ADDRESS_MARKERS = /〒|\d{3}-\d{4}|丁目|番地|^\s*(?:東京都|北海道|京都府|大阪府|.{2,3}県)/;
const ZH_ADDRESS_MARKERS = /省|自治区|自治區|特别行政区|特別行政區|中国|中國|台湾|臺灣|台灣|香港|澳門|澳门|中华|中華|號|[县縣]|[路街]\d+[号號]|\d+弄/;
// Characters Chinese uses that modern Japanese does not, split by script.
const SIMPLIFIED_ONLY = /[县东车长门马龙乐书广庆汉为这过还发线现关阳华贵邮钟业园]/g;
const TRADITIONAL_ONLY = /[區縣臺灣廣號鄉與發條關樓]/g;

function chineseVariant(text) {
  const value = String(text || "");
  if (/台湾|臺灣|台灣|香港|澳門|中華民國/.test(value)) return "zh-Hant";
  const simplified = (value.match(SIMPLIFIED_ONLY) || []).length;
  const traditional = (value.match(TRADITIONAL_ONLY) || []).length;
  return traditional > simplified ? "zh-Hant" : "zh-Hans";
}

/**
 * The language a piece of text is written in, judged by script only.
 * Han text without kana is Japanese unless it carries a Chinese marker, which
 * keeps every ambiguous case on the established Japanese path.
 */
export function detectTextLanguage(text) {
  const value = String(text || "");
  if (KANA.test(value)) return "ja";
  if (HANGUL.test(value)) return "ko";
  if (HAN.test(value)) {
    const chinese = ZH_ADDRESS_MARKERS.test(value)
      || (value.match(SIMPLIFIED_ONLY) || []).length > 0 || (value.match(TRADITIONAL_ONLY) || []).length > 0;
    if (JP_ADDRESS_MARKERS.test(value) || !chinese) return "ja";
    return chineseVariant(value);
  }
  return null;
}

/** True when the address must stay on the original Japanese parser. */
export function looksJapaneseAddress(address) {
  const text = String(address || "");
  if (!HAN.test(text) && !KANA.test(text)) return false;
  if (HANGUL.test(text)) return false;
  return detectTextLanguage(text) === "ja";
}

/* ------------------------------------------------------------------ *
 * Countries
 * ------------------------------------------------------------------ */

const COUNTRY_NAMES = {
  us: ["usa", "us", "u s a", "u s", "united states", "united states of america", "estados unidos", "etats unis", "vereinigte staaten", "stati uniti", "eua"],
  gb: ["uk", "u k", "united kingdom", "great britain", "england", "scotland", "wales", "northern ireland", "royaume uni", "reino unido", "vereinigtes konigreich", "regno unito"],
  ie: ["ireland", "eire"], au: ["australia"], nz: ["new zealand"], ca: ["canada"], sg: ["singapore"], in: ["india"],
  fr: ["france"], be: ["belgium", "belgique", "belgie", "belgien"], ch: ["switzerland", "schweiz", "suisse", "svizzera"],
  de: ["germany", "deutschland", "allemagne", "alemania", "germania", "alemanha"], at: ["austria", "osterreich", "oesterreich"],
  es: ["spain", "espana", "espagne", "spanien", "spagna", "espanha"], mx: ["mexico"], ar: ["argentina"], cl: ["chile"],
  co: ["colombia"], pe: ["peru"],
  it: ["italy", "italia", "italie", "italien"], pt: ["portugal"], br: ["brazil", "brasil", "bresil", "brasilien"],
  jp: ["japan", "nippon", "japon", "japao", "giappone"], cn: ["china", "prc", "people s republic of china"],
  tw: ["taiwan", "republic of china", "roc"], hk: ["hong kong", "hong kong sar", "hongkong"], mo: ["macau", "macao"],
  kr: ["korea", "south korea", "republic of korea", "coree du sud", "corea del sur", "sudkorea"],
  nl: ["netherlands", "the netherlands", "nederland", "holland"],
};
const COUNTRY_BY_NAME = new Map(Object.entries(COUNTRY_NAMES).flatMap(([code, names]) => names.map((name) => [name, code])));
const CJK_COUNTRY_PREFIX = [
  [/^(?:日本国?|日本)/, "jp"], [/^(?:中华人民共和国|中華人民共和國|中国|中國)/, "cn"],
  [/^(?:中華民國|台湾|臺灣|台灣)/, "tw"], [/^(?:香港特别行政区|香港特別行政區|香港)/, "hk"], [/^(?:澳門|澳门)/, "mo"],
  [/^(?:대한민국|한국)/, "kr"],
];

/** Languages a country's local search is normally done in, primary first. */
const COUNTRY_LANGUAGES = {
  jp: ["ja"], us: ["en", "es"], gb: ["en"], ie: ["en"], au: ["en"], nz: ["en"], ca: ["en", "fr"], sg: ["en", "zh-Hans"], in: ["en"],
  fr: ["fr"], be: ["fr"], ch: ["de", "fr", "it"], de: ["de"], at: ["de"], es: ["es"], mx: ["es"], ar: ["es"], cl: ["es"],
  co: ["es"], pe: ["es"], it: ["it"], pt: ["pt"], br: ["pt"], cn: ["zh-Hans"], tw: ["zh-Hant"], hk: ["zh-Hant", "en"],
  mo: ["zh-Hant"], kr: ["ko"], nl: ["en"],
};

const TLD_LANGUAGE = {
  jp: "ja", kr: "ko", tw: "zh-Hant", hk: "zh-Hant", cn: "zh-Hans", de: "de", at: "de", fr: "fr", es: "es", mx: "es",
  ar: "es", it: "it", pt: "pt", br: "pt", uk: "en", au: "en", nz: "en", ie: "en", ca: "en", us: "en",
};

/**
 * ISO country code from a country value ("JP", "Japan", {name:"Deutschland"}).
 *
 * Bare two-letter codes are honoured only for a structured country field
 * (schema addressCountry). Inside a free-text address "CO", "DE", "AR" or "IN"
 * is far more often a US state or Canadian province than a country.
 */
export function countryCode(value, { isoCodes = true } = {}) {
  if (!value) return "";
  if (typeof value === "object") return countryCode(value.identifier || value.name || value["@id"] || "", { isoCodes });
  const text = String(value).trim();
  if (/^[A-Za-z]{2}$/.test(text)) {
    if (!isoCodes) return /^(?:us|uk)$/i.test(text) ? (text.toLowerCase() === "uk" ? "gb" : "us") : "";
    const code = text.toLowerCase();
    return code === "uk" ? "gb" : (COUNTRY_LANGUAGES[code] ? code : "");
  }
  for (const [pattern, code] of CJK_COUNTRY_PREFIX) if (pattern.test(text)) return code;
  return COUNTRY_BY_NAME.get(foldLatin(text).replace(/[^a-z0-9]+/g, " ").trim()) || "";
}

/** The country an address names explicitly (its last or first part), or "". */
export function addressCountry(address) {
  const text = String(address || "").trim();
  if (!text) return "";
  const cjk = text.replace(/^\s*〒?\s*[\d-]+\s*/, "");
  for (const [pattern, code] of CJK_COUNTRY_PREFIX) if (pattern.test(cjk)) return code;
  const parts = splitAddress(text);
  if (parts.length < 2) return "";
  return countryCode(parts[parts.length - 1], { isoCodes: false }) || countryCode(parts[0], { isoCodes: false });
}

/* ------------------------------------------------------------------ *
 * Language decision
 * ------------------------------------------------------------------ */

/**
 * Which language to ask the engine in, and why.
 *
 * Order of evidence, strongest first:
 *   settings   - an explicit language on the profile (not stored today; honoured if passed)
 *   country    - the address's country (schema addressCountry or the address text);
 *                the site locale breaks the tie in a multilingual country
 *   script     - a non-Latin address script (kana/Han/Hangul)
 *   name_script- a non-Latin business name / type script
 *   site_locale- the site's own declared language (JSON-LD inLanguage, which the
 *                WordPress plugin emits from get_bloginfo('language'))
 *   address_words - street words of a Latin address without a country
 *                ("rue", "calle", "Straße", "via", "rua")
 *   tld        - a country-code TLD
 *   default    - no address and nothing else to go on: Japanese, as before
 *   fallback   - Japanese if the address looks Japanese, otherwise English
 */
export function resolveSovLanguage({ settingsLanguage = "", address = "", schemaCountry = "", siteLanguage = "", name = "", businessType = "", host = "" } = {}) {
  const explicit = normalizeLanguageTag(settingsLanguage);
  if (explicit) return { language: explicit, source: "settings" };

  const site = normalizeLanguageTag(siteLanguage);
  const country = countryCode(schemaCountry) || addressCountry(address);
  if (country && COUNTRY_LANGUAGES[country]) {
    const options = COUNTRY_LANGUAGES[country];
    return { language: site && options.includes(site) ? site : options[0], source: "address_country", country };
  }

  const scripted = detectTextLanguage(address);
  if (scripted) return { language: scripted, source: "address_script" };

  // A kana/Han/Hangul business name outranks a declared site locale: plenty of
  // Japanese WordPress sites still declare the installer default "en-US".
  const named = detectTextLanguage(`${name} ${businessType}`);
  if (named) return { language: named, source: "name_script" };
  if (site) return { language: site, source: "site_locale" };

  const worded = streetWordLanguage(address);
  if (worded) return { language: worded, source: "address_words" };

  const tld = String(host || "").toLowerCase().split(".").pop();
  if (TLD_LANGUAGE[tld]) return { language: TLD_LANGUAGE[tld], source: "tld" };

  // No address at all is no evidence of a foreign market: the product's
  // existing behaviour (Japanese) is kept. A present, non-Japanese address
  // that nothing above could place is asked in English.
  if (!String(address || "").trim()) return { language: "ja", source: "default" };
  return { language: looksJapaneseAddress(address) ? "ja" : "en", source: "fallback" };
}

const STREET_WORD_LANGUAGE = [
  [/\b(?:rue|boulevard|bd|avenue de|place de|chemin|allee|impasse|quai|cedex)\b/, "fr"],
  [/\b(?:calle|carrer|avenida|avda|paseo|plaza de|camino)\b/, "es"],
  [/(?:strasse|str\.|gasse|platz|allee|weg)\b/, "de"],
  [/\b(?:via|viale|vicolo|corso|piazza|largo)\b/, "it"],
  [/\b(?:rua|travessa|praca|estrada|rodovia|alameda)\b/, "pt"],
];

/** A language implied by unambiguous street words, or null. */
function streetWordLanguage(address) {
  const text = foldLatin(address);
  if (!/[a-z]/.test(text)) return null;
  const hits = STREET_WORD_LANGUAGE.filter(([pattern]) => pattern.test(text)).map(([, language]) => language);
  return hits.length === 1 ? hits[0] : null;
}

/* ------------------------------------------------------------------ *
 * Locality extraction for non-Japanese addresses
 * ------------------------------------------------------------------ */

/** Lowercase, strip accents and fold common ligatures so "Café Müller" ~ "cafe muller". */
export function foldLatin(value, { german = false } = {}) {
  let text = String(value || "").normalize("NFKC").toLowerCase();
  if (german) text = text.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue");
  return text
    .replace(/ß/g, "ss").replace(/æ/g, "ae").replace(/œ/g, "oe").replace(/ø/g, "o").replace(/ł/g, "l").replace(/đ/g, "d").replace(/ı/g, "i")
    .normalize("NFD").replace(/\p{M}+/gu, "")
    .replace(/['’‘`´]/g, "")
    .replace(/&/g, " and ");
}

function splitAddress(text) {
  return String(text).split(/[,\n;，、]+/).map((part) => part.trim()).filter(Boolean);
}

const POSTCODE_PATTERNS = [
  /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/g, // UK
  /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/g, // Canada
  /\b\d{4}\s?[A-Z]{2}\b/g, // Netherlands
  /\b\d{3}-\d{4}\b/g, // Japan (romanised)
  /\b\d{4,5}-\d{3,4}\b/g, // Portugal, Brazil, US ZIP+4
  /\b\d{2}-\d{3}\b/g, // Poland
  /\b(?:[A-Z]{1,2}-)?\d{4,6}\b/g, // generic numeric, optionally "D-"
];

const STREET_WORDS = new Set([
  "street", "st", "str", "road", "rd", "avenue", "ave", "av", "avda", "avenida", "boulevard", "blvd", "bd", "lane", "ln",
  "drive", "dr", "way", "court", "ct", "place", "pl", "square", "sq", "highway", "hwy", "parkway", "pkwy", "terrace",
  "crescent", "close", "row", "walk", "suite", "ste", "unit", "floor", "fl", "apt", "apartment", "building", "bldg",
  "level", "shop", "box", "rue", "chemin", "allee", "impasse", "quai", "cours", "calle", "carrer", "camino", "paseo",
  "plaza", "via", "viale", "vicolo", "corso", "piazza", "largo", "rua", "travessa", "praca", "estrada", "rodovia",
  "alameda", "weg", "gasse", "platz", "ring", "damm", "ufer", "chaussee", "ul", "no", "section", "lot",
]);
const GERMAN_STREET_SUFFIX = /(strasse|str|weg|gasse|platz|allee|damm|ufer)$/;

const REGION_NAMES = new Set([
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware", "florida", "georgia",
  "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland",
  "massachusetts", "michigan", "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada", "new hampshire",
  "new jersey", "new mexico", "north carolina", "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania",
  "rhode island", "south carolina", "south dakota", "tennessee", "texas", "utah", "vermont", "virginia", "washington state",
  "west virginia", "wisconsin", "wyoming", "district of columbia",
  "new south wales", "victoria", "queensland", "western australia", "south australia", "tasmania", "northern territory",
  "australian capital territory", "ontario", "quebec", "british columbia", "alberta", "manitoba", "saskatchewan",
  "nova scotia", "new brunswick", "newfoundland and labrador", "prince edward island",
  "ile de france", "bayern", "bavaria", "nordrhein westfalen", "baden wurttemberg", "comunidad de madrid", "cataluna",
  "catalunya", "lombardia", "lazio", "toscana",
]);

function isRegionLike(value) {
  const text = String(value || "").trim();
  if (/^[A-Z]{2,3}$/.test(text)) return true;
  return REGION_NAMES.has(foldLatin(text).replace(/[^a-z0-9]+/g, " ").trim());
}

function isStreetLike(value) {
  const text = String(value || "").trim();
  if (/\d/.test(text) || /^(?:#|c\/)/i.test(text)) return true;
  const tokens = foldLatin(text).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  return tokens.some((token) => STREET_WORDS.has(token) || (token.length > 5 && GERMAN_STREET_SUFFIX.test(token)));
}

function cleanPiece(value) {
  return String(value || "").replace(/^[\s\-–—.]+|[\s\-–—.]+$/g, "").replace(/\s{2,}/g, " ").trim();
}

function stripTrailingRegion(value) {
  const stripped = cleanPiece(String(value).replace(/(?:\s*[-–]\s*|\s+)[A-Z]{2,3}$/, ""));
  return stripped || value;
}

function plausibleLocality(value) {
  const text = cleanPiece(value);
  if (text.length < 2 || text.length > 40 || /\d/.test(text) || !/\p{L}/u.test(text)) return "";
  if (text.split(/\s+/).length > 4) return "";
  return text;
}

/**
 * City / locality from a Latin-script address ("street, city, region postcode, country").
 *
 * Conservative by design: when the structure does not identify a city, the
 * result is "" and the questions are asked without an area, which is better
 * than asking about "123 Main St".
 */
export function latinLocality(address) {
  let parts = splitAddress(address);
  if (!parts.length) return "";
  const hadStructure = parts.length >= 2;
  parts = parts.filter((part) => !countryCode(part, { isoCodes: false }) || /\d/.test(part));
  const lastIndex = parts.length - 1;
  const pieces = parts.map((part, index) => {
    let remainder = part;
    let hadPostcode = false;
    for (const pattern of POSTCODE_PATTERNS) {
      const next = remainder.replace(pattern, " ");
      if (next !== remainder) { hadPostcode = true; remainder = next; }
    }
    // A short trailing number on the final part is a postcode (Taiwan "Taipei City 110").
    if (!hadPostcode && index === lastIndex && /\s\d{3}$/.test(remainder)) { hadPostcode = true; remainder = remainder.replace(/\s\d{3}$/, " "); }
    remainder = cleanPiece(remainder);
    if (!remainder) return { kind: "postcode", hadPostcode };
    if (isStreetLike(remainder)) return { kind: "street", hadPostcode };
    return { kind: "candidate", hadPostcode, region: isRegionLike(remainder), value: stripTrailingRegion(remainder) };
  });

  const usable = (piece) => piece && piece.kind === "candidate" && !piece.region;
  let postcodeAt = -1;
  pieces.forEach((piece, index) => { if (piece.hadPostcode) postcodeAt = index; });
  if (postcodeAt >= 0) {
    if (usable(pieces[postcodeAt])) return plausibleLocality(pieces[postcodeAt].value);
    for (let index = postcodeAt - 1; index >= 0; index -= 1) {
      if (pieces[index].kind === "street") break;
      if (usable(pieces[index])) return plausibleLocality(pieces[index].value);
    }
    return "";
  }

  const streets = pieces.map((piece, index) => (piece.kind === "street" ? index : -1)).filter((index) => index >= 0);
  if (streets.length) {
    const after = pieces.slice(streets[streets.length - 1] + 1).find(usable);
    if (after) return plausibleLocality(after.value);
    // Largest-to-smallest order ("Tokyo, Shibuya-ku, Jingumae 1-2-3"): the
    // unit nearest the street is the locality.
    const before = pieces.slice(0, streets[0]).filter(usable);
    return before.length ? plausibleLocality(before[before.length - 1].value) : "";
  }
  if (!hadStructure) return "";
  const first = pieces.find(usable);
  return first ? plausibleLocality(first.value) : "";
}

/** City (市) or district (区/區/县/縣) from a Chinese address. */
export function chineseLocality(address) {
  let text = String(address || "").replace(/\s+/g, "").replace(/^\d{3,6}/, "");
  let special = "";
  for (const [pattern, code] of CJK_COUNTRY_PREFIX) {
    const match = text.match(pattern);
    if (match) {
      if (code === "hk") special = "香港";
      if (code === "mo") special = /澳门/.test(match[0]) ? "澳门" : "澳門";
      text = text.slice(match[0].length).replace(/^\d{3,6}/, "");
      break;
    }
  }
  const city = text.match(/^(?:.{2,8}?(?:省|自治区|自治區))?(.{2,8}?市)/);
  if (city?.[1]) return city[1];
  const district = text.match(/^(?:.{2,8}?(?:省|自治区|自治區))?(.{1,6}?[区區县縣])/);
  if (district?.[1]) return district[1];
  return special;
}

/** City / county / district (시/군/구) from a Korean address, else the province. */
export function koreanLocality(address) {
  const tokens = String(address || "").replace(/^(?:대한민국|한국)\s*/, "").split(/\s+/).filter((token) => token && !/^\d/.test(token)).slice(0, 4);
  const region = tokens.find((token) => /(?:특별시|광역시|특별자치시|특별자치도|도)$/.test(token)) || "";
  const local = tokens.find((token) => token !== region && /.(?:시|군|구)$/.test(token));
  return local || region;
}

/* ------------------------------------------------------------------ *
 * Question templates (non-Japanese). Japanese stays in aeo-sov.mjs.
 * ------------------------------------------------------------------ */

const DEFAULT_TYPES = {
  en: "local business", es: "negocio local", fr: "commerce local", de: "Geschäfte vor Ort", it: "attività locale",
  pt: "negócio local", "zh-Hans": "店铺", "zh-Hant": "店家", ko: "가게",
};

const SCHEMA_TYPE_WORDS = {
  //                  en,                 es,                    fr,                    de,                 it,                  pt,                         zh-Hans,     zh-Hant,     ko
  Restaurant:        ["restaurant",       "restaurante",         "restaurant",          "Restaurant",       "ristorante",        "restaurante",              "餐厅",      "餐廳",      "식당"],
  FoodEstablishment: ["restaurant",       "restaurante",         "restaurant",          "Restaurant",       "ristorante",        "restaurante",              "餐厅",      "餐廳",      "식당"],
  CafeOrCoffeeShop:  ["cafe",             "cafetería",           "café",                "Café",             "caffetteria",       "cafeteria",                "咖啡店",    "咖啡店",    "카페"],
  BarOrPub:          ["bar",              "bar",                 "bar",                 "Bar",              "pub",               "bar",                      "酒吧",      "酒吧",      "술집"],
  Bakery:            ["bakery",           "panadería",           "boulangerie",         "Bäckerei",         "panetteria",        "padaria",                  "面包店",    "麵包店",    "빵집"],
  HairSalon:         ["hair salon",       "peluquería",          "salon de coiffure",   "Friseursalon",     "parrucchiere",      "salão de cabeleireiro",    "理发店",    "美髮店",    "미용실"],
  BeautySalon:       ["beauty salon",     "salón de belleza",    "institut de beauté",  "Kosmetikstudio",   "centro estetico",   "salão de beleza",          "美容院",    "美容院",    "피부관리실"],
  Dentist:           ["dentist",          "dentista",            "dentiste",            "Zahnarzt",         "dentista",          "dentista",                 "牙科诊所",  "牙醫診所",  "치과"],
  Hotel:             ["hotel",            "hotel",               "hôtel",               "Hotel",            "hotel",             "hotel",                    "酒店",      "飯店",      "호텔"],
  Store:             ["store",            "tienda",              "boutique",            "Geschäft",         "negozio",           "loja",                     "商店",      "商店",      "매장"],
  Florist:           ["florist",          "floristería",         "fleuriste",           "Blumenladen",      "fioraio",           "floricultura",             "花店",      "花店",      "꽃집"],
  MedicalClinic:     ["clinic",           "clínica",             "clinique",            "Arztpraxis",       "clinica",           "clínica",                  "诊所",      "診所",      "의원"],
  Physician:         ["doctor",           "médico",              "médecin",             "Arzt",             "medico",            "médico",                   "诊所",      "診所",      "병원"],
  AutoRepair:        ["auto repair shop", "taller mecánico",     "garage automobile",   "Autowerkstatt",    "officina meccanica", "oficina mecânica",        "汽车维修店", "汽車維修廠", "자동차 정비소"],
};
const SCHEMA_WORD_COLUMNS = ["en", "es", "fr", "de", "it", "pt", "zh-Hans", "zh-Hant", "ko"];
const GENERIC_SCHEMA_TYPES = new Set(["LocalBusiness", "Organization", "Corporation", "ProfessionalService", "Place", "Thing", "Service", "Business", "OnlineBusiness"]);

/**
 * The business-type noun to put in a question.
 *
 * Owner-written labels are used as written. A schema.org enum ("HairSalon")
 * is translated for the common types, humanised in English otherwise, and
 * replaced by the language's generic word elsewhere - a Spanish question about
 * "AutoPartsStore" would read as machine output.
 */
export function localizedBusinessType(type, language) {
  const raw = String(type || "").trim();
  const fallback = DEFAULT_TYPES[language] || DEFAULT_TYPES.en;
  if (!raw) return fallback;
  if (!/^[A-Z][A-Za-z]+$/.test(raw)) return raw;
  if (GENERIC_SCHEMA_TYPES.has(raw)) return fallback;
  const words = SCHEMA_TYPE_WORDS[raw];
  if (words) return words[SCHEMA_WORD_COLUMNS.indexOf(language)] || raw;
  const humps = raw.match(/[A-Z][a-z]+/g) || [];
  if (humps.length < 2) return raw; // a single word such as "Pizzeria" is just a word
  return language === "en" ? humps.map((word) => (word === "Or" ? "or" : word.toLowerCase())).join(" ") : fallback;
}

const frDe = (word) => (/^[aeiouyhâàäéèêëîïôöûüœ]/i.test(word) ? `d'${word}` : `de ${word}`);

/**
 * Discovery and branded-control templates per language: ten discovery
 * questions and three branded ones, mirroring the Japanese set item by item
 * (recommendation, reputation, top 3, hours, reservations, price, first visit,
 * near the station, reviews, going today).
 */
const TEMPLATES = {
  en: ({ type, area }) => {
    const inArea = area ? ` in ${area}` : "";
    return [
      `What's the best ${type}${inArea}?`,
      `I'm looking for a good ${type}${inArea}. Which ones have a good reputation?`,
      `Give me 3 popular ${type} options${inArea}.`,
      `I want to know the opening hours of a good ${type}${inArea}.`,
      `Which ${type} options${inArea} take reservations?`,
      `What are typical prices for a ${type}${inArea}, and which one do you recommend?`,
      `Which ${type}${inArea} is good for a first-time visitor?`,
      `Which ${type} options${inArea} are closest to the train station?`,
      `Which ${type}${inArea} has the best reviews?`,
      `I want to go to a ${type}${inArea} today. Give me some options.`,
    ];
  },
  es: ({ type, area }) => {
    const en = area ? ` en ${area}` : "";
    return [
      `¿Cuál es el mejor sitio de ${type}${en}?`,
      `Busco ${type}${en}. ¿Cuáles tienen buenas opiniones?`,
      `Dime 3 opciones populares de ${type}${en}.`,
      `¿Qué horario tienen los sitios de ${type}${en}?`,
      `¿Qué opciones de ${type}${en} aceptan reservas?`,
      `¿Cuánto cuesta normalmente ${type}${en} y cuál me recomiendas?`,
      `¿Qué ${type}${en} me recomiendas para una primera visita?`,
      `¿Qué opciones de ${type}${en} están más cerca de la estación?`,
      `¿Qué ${type}${en} tiene las mejores reseñas?`,
      `Quiero ir hoy. ¿Qué opciones de ${type}${en} me sugieres?`,
    ];
  },
  fr: ({ type, area }) => {
    const a = area ? ` à ${area}` : "";
    const de = frDe(type);
    return [
      `Quelles sont les meilleures adresses ${de}${a} ?`,
      `Je cherche une adresse ${de}${a}. Lesquelles ont une bonne réputation ?`,
      `Cite 3 adresses ${de} populaires${a}.`,
      `Quels sont les horaires d'ouverture des adresses ${de}${a} ?`,
      `Quelles adresses ${de}${a} acceptent les réservations ?`,
      `Quels sont les tarifs habituels ${de}${a}, et quelle adresse recommandes-tu ?`,
      `Quelle adresse ${de}${a} conseilles-tu pour une première visite ?`,
      `Quelles adresses ${de}${a} sont les plus proches de la gare ?`,
      `Quelles adresses ${de}${a} ont les meilleurs avis ?`,
      `Je veux trouver une adresse ${de}${a} aujourd'hui. Propose-moi quelques options.`,
    ];
  },
  de: ({ type, area }) => {
    const inArea = area ? ` in ${area}` : "";
    return [
      `Was sind die besten Adressen für ${type}${inArea}?`,
      `Ich suche ${type}${inArea}. Welche haben einen guten Ruf?`,
      `Nenne 3 beliebte Adressen für ${type}${inArea}.`,
      `Welche Öffnungszeiten haben Adressen für ${type}${inArea}?`,
      `Bei welchen Adressen für ${type}${inArea} kann man reservieren?`,
      `Was kostet ${type}${inArea} ungefähr, und welche Adresse empfiehlst du?`,
      `Welche Adresse für ${type}${inArea} ist gut für den ersten Besuch?`,
      `Welche Adressen für ${type}${inArea} liegen am nächsten am Bahnhof?`,
      `Welche Adressen für ${type}${inArea} haben die besten Bewertungen?`,
      `Ich möchte heute hin. Welche Adressen für ${type}${inArea} schlägst du vor?`,
    ];
  },
  it: ({ type, area }) => {
    const a = area ? ` a ${area}` : "";
    return [
      `Qual è il miglior posto per ${type}${a}?`,
      `Cerco ${type}${a}. Quali hanno una buona reputazione?`,
      `Indicami 3 opzioni popolari di ${type}${a}.`,
      `Quali sono gli orari di apertura delle opzioni di ${type}${a}?`,
      `Quali opzioni di ${type}${a} accettano prenotazioni?`,
      `Quanto costa in media ${type}${a}, e quale mi consigli?`,
      `Quale ${type}${a} mi consigli per una prima visita?`,
      `Quali opzioni di ${type}${a} sono più vicine alla stazione?`,
      `Quale ${type}${a} ha le recensioni migliori?`,
      `Vorrei andarci oggi. Quali opzioni di ${type}${a} mi suggerisci?`,
    ];
  },
  pt: ({ type, area }) => {
    const em = area ? ` em ${area}` : "";
    return [
      `Qual é o melhor lugar de ${type}${em}?`,
      `Estou procurando ${type}${em}. Quais têm boa reputação?`,
      `Cite 3 opções populares de ${type}${em}.`,
      `Qual é o horário de funcionamento das opções de ${type}${em}?`,
      `Quais opções de ${type}${em} aceitam reservas?`,
      `Quanto custa em média ${type}${em}, e qual você recomenda?`,
      `Qual ${type}${em} você recomenda para uma primeira visita?`,
      `Quais opções de ${type}${em} ficam mais perto da estação?`,
      `Qual ${type}${em} tem as melhores avaliações?`,
      `Quero ir hoje. Quais opções de ${type}${em} você sugere?`,
    ];
  },
  "zh-Hans": ({ type, area }) => {
    const where = area || "";
    const whereDe = area ? `${area}的` : "";
    return [
      `${where}有什么推荐的${type}？`,
      `我在找${whereDe}${type}，哪些口碑比较好？`,
      `列出${where}3家受欢迎的${type}。`,
      `我想知道${whereDe}${type}的营业时间。`,
      `${where}有哪些可以预约的${type}？`,
      `${whereDe}${type}一般价格是多少？推荐哪家？`,
      `${where}适合第一次去的${type}有哪些？`,
      `${where}离车站最近的${type}有哪些？`,
      `${where}评价好的${type}有哪些？`,
      `今天想去${whereDe}${type}，给我几个选择。`,
    ];
  },
  "zh-Hant": ({ type, area }) => {
    const where = area || "";
    const whereDe = area ? `${area}的` : "";
    return [
      `${where}有什麼推薦的${type}？`,
      `我在找${whereDe}${type}，哪些口碑比較好？`,
      `列出${where}3家受歡迎的${type}。`,
      `我想知道${whereDe}${type}的營業時間。`,
      `${where}有哪些可以預約的${type}？`,
      `${whereDe}${type}一般價格是多少？推薦哪家？`,
      `${where}適合第一次去的${type}有哪些？`,
      `${where}離車站最近的${type}有哪些？`,
      `${where}評價好的${type}有哪些？`,
      `今天想去${whereDe}${type}，給我幾個選擇。`,
    ];
  },
  ko: ({ type, area }) => {
    const where = area || "";
    return [
      `${where} ${type} 추천해 주세요.`,
      `${where} ${type} 찾고 있어요. 평이 좋은 곳을 알려 주세요.`,
      `${where} 인기 있는 ${type} 3곳을 알려 주세요.`,
      `${where} ${type} 영업시간이 궁금해요.`,
      `${where} 예약 가능한 ${type} 어디 있나요?`,
      `${where} ${type} 가격대와 추천할 만한 곳을 알려 주세요.`,
      `${where} 처음 가기 좋은 ${type} 어디인가요?`,
      `${where} 역에서 가까운 ${type} 알려 주세요.`,
      `${where} 리뷰가 좋은 ${type} 어디인가요?`,
      `오늘 ${where} ${type}에 가고 싶어요. 후보를 알려 주세요.`,
    ];
  },
};

const BRANDED_TEMPLATES = {
  en: ({ name, type }) => [`What kind of ${type} is ${name}?`, `What are the opening hours and address of ${name}?`, `What do people say about ${name}?`],
  es: ({ name, type }) => [`¿Qué tipo de ${type} es ${name}?`, `¿Cuál es el horario y la dirección de ${name}?`, `¿Qué opiniones tiene ${name}?`],
  fr: ({ name, type }) => [`Quel type ${frDe(type)} est ${name} ?`, `Quels sont les horaires et l'adresse ${frDe(name)} ?`, `Que disent les avis sur ${name} ?`],
  de: ({ name }) => [`Was bietet ${name} an?`, `Wie sind die Öffnungszeiten und die Adresse von ${name}?`, `Wie wird ${name} bewertet?`],
  it: ({ name, type }) => [`Che tipo di ${type} è ${name}?`, `Quali sono gli orari e l'indirizzo di ${name}?`, `Che recensioni ha ${name}?`],
  pt: ({ name, type }) => [`Que tipo de ${type} é ${name}?`, `Qual é o horário e o endereço de ${name}?`, `Quais são as avaliações de ${name}?`],
  "zh-Hans": ({ name, type }) => [`${name}是一家什么样的${type}？`, `${name}的营业时间和地址是什么？`, `${name}的评价怎么样？`],
  "zh-Hant": ({ name, type }) => [`${name}是一家什麼樣的${type}？`, `${name}的營業時間和地址是什麼？`, `${name}的評價如何？`],
  ko: ({ name, type }) => [`${name}, 어떤 ${type}인가요?`, `${name} 영업시간과 주소를 알려 주세요.`, `${name} 평판은 어떤가요?`],
};

/** Discovery questions for a non-Japanese language, or null for Japanese/unknown. */
export function localizedDiscoveryQuestions(language, { businessType = "", locality = "" } = {}) {
  const build = TEMPLATES[language];
  return build ? build({ type: localizedBusinessType(businessType, language), area: locality }) : null;
}

/** Branded control questions for a non-Japanese language, or null for Japanese/unknown. */
export function localizedBrandedQuestions(language, { name = "", businessType = "" } = {}) {
  const build = BRANDED_TEMPLATES[language];
  return build ? build({ name, type: localizedBusinessType(businessType, language) }) : null;
}
