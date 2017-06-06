import $ from 'jquery';

// Strangely, importing from vega-embed directly doesn't compile
import embed from 'vega-embed/src/embed';

export function createVegaView($scope, el, spec, timefilter, es) {
  const $el = $(el);

  const getWidth = () => $el.width() - 100;
  const getHeight = () => $el.height() - 100;

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
      loader: {
        load: (uri, opts) => {
          switch (opts.context) {
            case 'dataflow':
              return queryEsData(uri);
          }
        },
        sanitize: (uri, opts) => {
          return Promise.resolve({});
        }
      }
    },
    width: getWidth(),
    height: getHeight(),
    padding: { left: 0, right: 0, top: 0, bottom: 0 },
    actions: false
  };

  const viewP = new Promise((accept, reject) => {
    embed($el.get(0), spec, opts, (err, v) => {
      if (err) {
        reject(err);
      } else {
        accept(v);
      }
    });
  });

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
