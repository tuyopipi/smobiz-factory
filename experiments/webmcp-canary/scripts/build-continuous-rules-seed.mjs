// Regenerate the migration's default snapshot from the sole bootstrap source.
import {readFileSync,writeFileSync} from 'node:fs';
import {DEFAULT_SCORING,DEFAULT_GENERATION} from '../worker/aeo-rules.mjs';
import {ENTITY_SCHEMA_FIELDS} from '../worker/aeo-fields.mjs';
const file=new URL('../nurevo-impl/db/0032_continuous_optimization.sql',import.meta.url);
const prefix=readFileSync(file,'utf8').split('-- Snapshot existing runtime defaults')[0];
const q=x=>JSON.stringify(x).replaceAll("'","''");
writeFileSync(file,prefix+`-- Snapshot existing runtime defaults into a NEW version. Historical definitions
-- are immutable. Preserve the effective legacy LocalBusiness field list, rather
-- than silently replacing it with another industry's criteria.
INSERT INTO aeo_rulesets(version,created_at,definition_json,active,notes)
SELECT (SELECT COALESCE(MAX(version),0)+1 FROM aeo_rulesets),strftime('%Y-%m-%dT%H:%M:%fZ','now'),
 json_set(definition_json,'$.scoring',json('${q(DEFAULT_SCORING)}'),'$.generation',json('${q(DEFAULT_GENERATION)}'),
 '$.schema.entityFields',COALESCE(json_extract(definition_json,'$.schema.entityFields'),
   json_set(json('${q(ENTITY_SCHEMA_FIELDS)}'),'$.LocalBusiness',
     CASE WHEN json_array_length(json_extract(definition_json,'$.schema.scoredProps'))>0 THEN
       (SELECT json_group_object(CASE WHEN value='openinghours' THEN 'openingHours' ELSE value END,json('true'))
        FROM json_each(json_extract(definition_json,'$.schema.scoredProps'))
        WHERE value='name' OR COALESCE(json_extract(definition_json,'$.schema.fields.' || value),1)<>0)
     WHEN json_type(definition_json,'$.schema.fields')='object' THEN
       json_patch(json('{"name":true}'),json_extract(definition_json,'$.schema.fields'))
     ELSE json_extract(json('${q(ENTITY_SCHEMA_FIELDS)}'),'$.LocalBusiness') END))),
 0,'migration:0032 centralized runtime defaults'
FROM aeo_rulesets WHERE active=1 ORDER BY version DESC LIMIT 1;
UPDATE aeo_rulesets SET active=0 WHERE active=1;
UPDATE aeo_rulesets SET active=1 WHERE notes='migration:0032 centralized runtime defaults';
INSERT INTO aeo_ruleset_activations(id,ruleset_version,activated_at,activated_by,notes)
SELECT 'act_0032',version,created_at,'migration:0032',notes FROM aeo_rulesets WHERE active=1;
`);
