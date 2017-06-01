import $ from 'jquery';

// Strangely, importing from vega-embed directly doesn't compile
import embed from 'vega-embed/src/embed';

export function createVegaView(el, spec) {
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
          return new Promise((accept, reject) => {
            switch (opts.context) {
              case 'dataflow':
                // FIXME!!! - should use standard Kibana requester
                let body = uri.body;
                if (body === undefined) {
                  throw new Error('Missing request body');
                }
                delete uri.body;
                $.ajax({
                  type: 'POST',
                  url: 'https://localhost:5601/uvx/elasticsearch/_msearch',
                  dataType: 'json',
                  data: JSON.stringify(uri) + '\n' + JSON.stringify(body) + '\n',
                  headers: {
                    'kbn-name': 'kibana',
                    'kbn-version': '6.0.0-alpha2',
                    'content-type': 'application/x-ndjson',
                    'accept': 'application/json, text/plain, */*'
                  },
                  success: (result) => {
                    accept(result);
                  }
                });
                break;
            }
          });
        },
        sanitize: (uri, opts) => {
          return Promise.resolve({});
        }
      }
    },
    "width": getWidth(),
    "height": getHeight(),
    "padding": {left: 0, right: 0, top: 0, bottom: 0}
  };

  let viewP = new Promise((accept, reject) => {
    embed($el.get(0), spec, opts, (err, v) => {
      if (err)
        reject(err);
      else
        accept(v);
    });
  });

  class VegaView {
    resize() {
      viewP.then(v =>
        v.view
          .width(getWidth())
          .height(getHeight())
          .run());
    }

    // setData(data) {
    //   const changeset = Vega.changeset()
    //     .remove(view.data('esResp'))
    //     .insert(data);
    //
    //   view
    //     .change('esResp', changeset)
    //     .run();
    // }
    //
    destroy() {
      viewP.then(v=> v.view.finalize());
      $el.empty();
    }
  }

  return new VegaView();
}
