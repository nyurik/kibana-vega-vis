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

  // FIXME TODO:   remove this switch statement once Vega 3.0 & Vega-lite 2.0 is released
  switch (spec.$schema) {
    case 'https://vega.github.io/schema/vega/v3.0.json':
      spec.$schema = 'https://vega.github.io/schema/vega/v3.0.0-beta.json';
      break;
    case 'https://vega.github.io/schema/vega-lite/v2.json':
      spec.$schema = 'https://vega.github.io/schema/vega-lite/v2.0.0-beta.json';
      break;
  }

  const schema = schemaParser(spec.$schema);
  const isVegaLite = schema.library === 'vega-lite';
  const ourVersion = isVegaLite ? vegaLite.version : vega.version;
  const ourVersionIsOld = versionCompare(schema.version, ourVersion) > 0;

  if (ourVersionIsOld) {
    onWarning(
      `The input spec uses "${schema.library}" ${schema.version}, but ` +
      `current version of "${schema.library}" is ${ourVersion}.`
    );
  }

  const mapConfig = spec._map;
  if (mapConfig) {
    delete spec._map;
  }

  if (isVegaLite) {
    if (mapConfig) {
      throw new Error('"_map" configuration is not compatible with vega-lite spec');
    }

    spec = vegaLite.compile(spec).spec;
  }

  const padding = spec.padding;
  let widthPadding = 0;
  let heightPadding = 0;

  // Convert default Vega padding into the width/height shift at the bottom/right
  // TODO: we might want to do this differently, e.g. by creating a separate container
  // for the vega-created controls
  if (padding) {
    if (mapConfig) {
      onWarning(`"padding" is not supported with the "_map"`);
    }

    delete spec.padding;

    if (typeof padding === 'number') {
      heightPadding += padding;
    } else {
      if (padding.right) widthPadding += padding.right;
      if (padding.bottom) heightPadding += padding.bottom;
    }
  }

  // const margin = spec._margin;
  // if (margin) {
  //   delete spec._margin;
  // }

  if (spec.autosize === undefined) {
    spec.autosize = 'fit';
  }

  return { spec, widthPadding, heightPadding, mapConfig, supportHover: !isVegaLite };
}
