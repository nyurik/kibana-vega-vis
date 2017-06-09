import $ from 'jquery';

// Strangely, importing from vega-embed directly doesn't compile
import embed from 'vega-embed/src/embed';

export function createVegaView($scope, el, spec, timefilter, es) {
  const $el = $(el);

  const getWidth = () => $el.width() - 100;
  const getHeight = () => $el.height() - 100;

  const loader = embed.vega.loader();
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

  const opts = {
    viewConfig: {
      /**
       * ... the loader instance to use for data file loading. A
       * loader object must provide a "load" method for loading files and a
       * "sanitize" method for checking URL/filename validity. Both methods
       * should accept a URI and options hash as arguments, and return a Promise
       * that resolves to the loaded file contents (load) or a hash containing
       * sanitized URI data with the sanitized url assigned to the "href" property
       * (sanitize).
       */
      loader: loader
    },
    width: getWidth(),
    height: getHeight(),
    padding: { left: 0, right: 0, top: 0, bottom: 0 },
    actions: false,
    onBeforeParse: spec => {
      if (!spec.autosize) {
        spec.autosize = 'fit';
      }
      return spec;
    }
  };

  // FIXME: rework promises - it should be much more straightforward
  const viewP = embed($el.get(0), spec, opts);

  class VegaView {
    promise() {
      return viewP;
    }

    resize() {
      // viewP.then(v =>
      //   v.view
      //     .width(getWidth())
      //     .height(getHeight())
      //     .run());
    }

    destroy() {
      viewP.then(v=> v.view.finalize());
      $el.empty();
    }
  }

  function queryEsData(uri) {

    updateTimeRecursive(uri);

    return es.search(uri).then(resp => {
      // FIXME - report warnings?
      if (resp.hits) {
        if (resp.hits.total < 1) {
          $scope.status = 'notFound';
        } else {
          $scope.status = 'found';
          $scope.hit = resp.hits.hits[0];
        }
      }
      // return JSON.stringify(resp);
      return resp;
    }).catch(err => {
      // FIXME - report errors
      if (err.status === 404) {
        $scope.status = 'notFound';
      } else {
        $scope.status = 'error';
        $scope.resp = err;
      }
    });
  }

  function updateTimeRecursive(obj) {
    if (obj && typeof obj === 'object') {
      if (obj['%timefilter%']) {
        delete obj['%timefilter%'];
        const bounds = timefilter.getBounds();
        obj.gte = bounds.min.valueOf();
        obj.lte = bounds.max.valueOf();
        obj.format = 'epoch_millis';

        if (obj['shift']) {
          const shift = obj['shift'];
          if (typeof shift !== 'number') {
            throw new Error('shift must be a numeric value');
          }
          delete obj['shift'];
          let unit = 'd';
          if (obj['unit']) {
            unit = obj['unit'];
            delete obj['unit'];
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
            updateTimeRecursive(obj[prop]);
          }
        }
      }
    }
  }

  return new VegaView();
}
