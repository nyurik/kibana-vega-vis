import * as vega from 'vega';
import * as vegaLite from 'vega-lite';
import schemaParser from 'vega-schema-url-parser';
import versionCompare from 'compare-versions';

const DEFAULT_SCHEMA = 'https://vega.github.io/schema/vega/v3.0.json';

export function parseInputSpec(inputSpec, onWarning) {
  let spec = { ...inputSpec };

  if (!spec.$schema) {
    onWarning(`The input spec does not specify a "$schema", defaulting to "${DEFAULT_SCHEMA}"`);
    spec.$schema = DEFAULT_SCHEMA;
  }

  const schema = schemaParser(spec.$schema);
  const ourVersion = schema.library === 'vega' ? vega.version : vegaLite.version;
  const ourVersionIsOld = versionCompare(schema.version, ourVersion) > 0;

  if (ourVersionIsOld) {
    onWarning(
      `The input spec uses "${schema.library}" ${schema.version}, but ` +
      `current version of "${schema.library}" is ${ourVersion}.`
    );
  }

  const baseMapSpec = spec.baseMap;
  if (baseMapSpec) {
    delete spec.baseMapSpec;
  }

  if (schema.library === 'vega-lite') {
    if (baseMapSpec) {
      throw new Error('"baseMap" configuration is not compatible with vega-lite spec');
    }

    spec = vegaLite.compile(spec).spec;
  }

  if (!spec.autosize) {
    spec.autosize = 'fit';
  }

  return { spec, baseMapSpec };
}
