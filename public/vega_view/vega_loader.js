import * as vega from 'vega';

export function createVegaLoader(es, timefilter) {

  function queryEsData(uri) {
    injectTimeRange(uri);
    return es.search(uri);
  }

  function injectTimeRange(obj) {
    if (obj && typeof obj === 'object') {
      if (obj['%timefilter%']) {
        delete obj['%timefilter%'];
        const bounds = timefilter.getBounds();
        obj.gte = bounds.min.valueOf();
        obj.lte = bounds.max.valueOf();
        obj.format = 'epoch_millis';

        if (obj.shift) {
          const shift = obj.shift;
          if (typeof shift !== 'number') {
            throw new Error('shift must be a numeric value');
          }
          delete obj.shift;
          let unit = 'd';
          if (obj.unit) {
            unit = obj.unit;
            delete obj.unit;
          }
          let multiplier;
          switch (unit) {
            case 'w':
              multiplier = 1000 * 60 * 60 * 24 * 7;
              break;
            case 'd':
              multiplier = 1000 * 60 * 60 * 24;
              break;
            case 'h':
              multiplier = 1000 * 60 * 60;
              break;
            case 'm':
              multiplier = 1000 * 60;
              break;
            case 's':
              multiplier = 1000;
              break;
            default:
              throw new Error('Unknown unit value. Must be one of w,d,h,m,s');
          }
          obj.gte += shift * multiplier;
          obj.lte += shift * multiplier;
        }
      } else {
        for (const prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            injectTimeRange(obj[prop]);
          }
        }
      }
    }
  }

  /**
   * ... the loader instance to use for data file loading. A
   * loader object must provide a "load" method for loading files and a
   * "sanitize" method for checking URL/filename validity. Both methods
   * should accept a URI and options hash as arguments, and return a Promise
   * that resolves to the loaded file contents (load) or a hash containing
   * sanitized URI data with the sanitized url assigned to the "href" property
   * (sanitize).
   */
  const loader = vega.loader();
  const defaultLoad = loader.load.bind(loader);
  loader.load = (uri, opts) => {
    if (typeof uri === 'object') {
      switch (opts.context) {
        case 'dataflow':
          return queryEsData(uri);
      }
      throw new Error('Unexpected uri object');
    }
    return defaultLoad(uri, opts);
  };

  return loader;
}