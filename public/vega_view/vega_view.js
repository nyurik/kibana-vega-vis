import $ from 'jquery';
import * as Vega from 'vega';

export function createVegaView(el, spec) {
  const $el = $(el);

  const getWidth = () => $el.width() - 100;
  const getHeight = () => $el.height() - 100;

  const opts = {
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
              let header = uri._header;
              if (header !== undefined) {
                delete uri._header;
              } else {
                header = {index: '*'};
              }
              $.ajax({
                type: 'POST',
                url: 'https://localhost:5601/tla/elasticsearch/_msearch',
                dataType: 'json',
                data: JSON.stringify(header) + '\n' + JSON.stringify(uri) + '\n',
                headers: {
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
  };

  const view = new Vega.View(Vega.parse(spec), opts)
    .logLevel(Vega.Warn)
    .renderer('canvas')
    .padding({ left: 0, right: 0, top: 0, bottom: 0 })
    .initialize($el.get(0))
    .width(getWidth())
    .height(getHeight())
    .hover()
    .run();

  class VegaView {
    resize() {
      view
        .width(getWidth())
        .height(getHeight())
        .run();
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
      view.finalize();
      $el.empty();
    }
  }

  return new VegaView();
}
