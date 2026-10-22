import { diagnosisText, formatMessage, resolveDiagnosisLang } from "./diagnosis-i18n.mjs";

export const ENTITY_SCHEMA_FIELDS = Object.freeze({
  "LocalBusiness": {
    "name": true,
    "address": true,
    "telephone": true,
    "openingHoursSpecification": true,
    "geo": true,
    "priceRange": true,
    "url": true,
    "sameAs": true
  },
  "SoftwareApplication": {
    "name": true,
    "applicationCategory": true,
    "operatingSystem": true,
    "offers.price": true,
    "offers.priceCurrency": true,
    "description": true
  },
  "Product": {
    "name": true,
    "image": true,
    "description": true,
    "brand": true,
    "sku": true,
    "offers.price": true,
    "offers.priceCurrency": true,
    "offers.availability": true,
    "aggregateRating": true
  },
  "Service": {
    "name": true,
    "description": true,
    "provider": true,
    "areaServed": true,
    "serviceType": true,
    "offers.price": true
  },
  "Article": {
    "headline": true,
    "author": true,
    "datePublished": true,
    "dateModified": true,
    "image": true,
    "publisher": true
  },
  "WebSite": {
    "name": true,
    "url": true
  },
  "FAQPage": {
    "mainEntity": true
  },
  "Organization": {
    "sameAs": true
  }
});
/*
 * Field wording lives in the message catalogs (worker/i18n/diagnosis/*.json):
 *   field.label.<key>        short label shown next to Entity.field
 *   field.meaning.<key>      what the property tells AI
 *   field.instruction.<key>  a field-specific fix, where one exists
 *   field.howto.*            where in Nurevo / WordPress the field is set
 *   field.unsupported, field.publish, field.software.location, field.about
 *   field.summary, field.textHint
 * Every lookup falls back through the language chain to English.
 */
const HOWTO_BY_ENTITY = { Product: "field.howto.reviews", Service: "field.howto.services", Article: "field.howto.article", FAQPage: "field.howto.faq" };

/**
 * The catalog a field list is worded from. Kept under its old name for callers
 * that already import it; it now accepts any WordPress locale or BCP 47 tag.
 */
export function fieldLang(requested) {
  return resolveDiagnosisLang(requested);
}
export function localizeFields(fields, requested) {
  const lang = fieldLang(requested);
  const t = (key, params) => diagnosisText(lang, key, params);
  return fields.map(item => {
    const key = item.field === 'openingHours' || item.field === 'openinghours' ? 'openingHoursSpecification' : item.field;
    const label = t(`field.label.${key}`) || item.field;
    const hint = HOWTO_BY_ENTITY[item.entityType] || "field.howto.business";
    const supported = item.entityType === 'LocalBusiness' ? ['name','address','telephone','openingHours','openingHoursSpecification','url'].includes(item.field)
      : item.entityType === 'Service' ? ['name','provider','serviceType','offers.price'].includes(item.field)
      : !['sameAs','brand'].includes(item.field);
    return {...item, label, description: t(`field.meaning.${key}`) || t('field.about', { label }), howTo: fieldHowTo(item.entityType, key, lang, label, supported ? t(hint) : t('field.unsupported'))};
  });
}
export function fieldsSummary(fields, requested) {
  return diagnosisText(fieldLang(requested), 'field.summary', { filled: fields.filter(f => f.present).length, total: fields.length });
}
export function textHint(requested) { return diagnosisText(fieldLang(requested), 'field.textHint'); }

function fieldHowTo(entity, key, lang, label, fallback) {
  const t = (k, params) => diagnosisText(lang, k, params);
  const path = `${entity}.${key}`;
  const instruction = t(`field.instruction.${key}`);
  const publish = formatMessage(t('field.publish'), { field: path });
  if (entity === 'SoftwareApplication') return `${instruction || publish} ${t('field.software.location')}`;
  if (instruction) return instruction;
  if (entity !== 'Product') return `${fallback} ${publish}`;
  // Every field gets its own path; review instructions belong only to aggregateRating.
  if (key === 'aggregateRating') return t('field.howto.reviews');
  return publish + ' ' + (t(`field.meaning.${key}`) || label);
}
