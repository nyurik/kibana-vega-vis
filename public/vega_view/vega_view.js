import $ from 'jquery';
import * as Vega from 'vega';

export function createVegaView(el, spec) {
  const $el = $(el);

  const getWidth = () => $el.width() - 100;
  const getHeight = () => $el.height() - 100;

  const view = new Vega.View(Vega.parse(spec))
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

    setData(data) {
      const changeset = Vega.changeset()
        .remove(view.data('esResp'))
        .insert(data);

      view
        .change('esResp', changeset)
        .run();
    }

    destroy() {
      view.finalize();
      $el.empty();
    }
  }

  return new VegaView();
}
