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
  const libVersion = isVegaLite ? vegaLite.version : vega.version;

  if (versionCompare(schema.version, libVersion) > 0) {
    onWarning(
      `The input spec uses "${schema.library}" ${schema.version}, but ` +
      `current version of "${schema.library}" is ${libVersion}.`
    );
  }

  const hostConfig = spec._hostConfig;
  if (hostConfig !== undefined) {
    delete spec.hostConfig;
    if (typeof hostConfig !== 'object') {
      throw new Error('_hostConfig must be an object');
    }
  }

  const useMap = !!(hostConfig && hostConfig.type === 'map');
  let delayRepaint = hostConfig && hostConfig.delayRepaint;
  let latitude = hostConfig && hostConfig.latitude;
  let longitude = hostConfig && hostConfig.longitude;
  let zoom = hostConfig && hostConfig.zoom;

  if (!useMap && (latitude !== undefined || longitude !== undefined || zoom !== undefined || delayRepaint !== undefined)) {
    throw new Error('_hostConfig must have type="map" when used with latitude/longitude/zoom parameters');
  }

  if (useMap) {
    longitude = longitude || 0;
    latitude = latitude || 0;
    zoom = zoom === undefined ? 2 : zoom;
    delayRepaint = delayRepaint === undefined ? true : delayRepaint;
  }

  // preserve autosize before Vega-Lite compiler
  const autosize = spec.autosize;

  if (isVegaLite) {
    if (useMap) {
      throw new Error('"_map" configuration is not compatible with vega-lite spec');
    }

    spec = vegaLite.compile(spec).spec;
  }

  // Default autosize should be fit, unless it's a map (leaflet-vega handles that)
  if (autosize === undefined && !useMap) {
    spec.autosize = 'fit';
  }

  const useResize = !isVegaLite && !useMap && spec.autosize === 'fit';
  const useHover = !isVegaLite;

  // Padding is not included in the width/height (unless a new autosize mode is introduced)
  let paddingWidth = 0;
  let paddingHeight = 0;
  if (useResize && spec.padding) {
    if (typeof spec.padding === 'object') {
      paddingWidth += (+spec.padding.left || 0) + (+spec.padding.right || 0);
      paddingHeight += (+spec.padding.top || 0) + (+spec.padding.bottom || 0);
    } else {
      paddingWidth += 2 * (+spec.padding || 0);
      paddingHeight += 2 * (+spec.padding || 0);
    }
  }

  if (useResize && (spec.width || spec.height)) {
    onWarning('The \'width\' and \'height\' params are ignored with autosize=fit');
  }

  return { spec, paddingWidth, paddingHeight, useMap, latitude, longitude, zoom, delayRepaint, useResize, useHover };
}
