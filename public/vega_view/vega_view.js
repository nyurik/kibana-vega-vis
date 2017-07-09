import $ from 'jquery';
import L from 'leaflet';
import 'leaflet-vega';
import * as vega from 'vega';

import { parseInputSpec } from './parse_input_spec';
import { createVegaLoader } from './vega_loader';

// FIXME: handle runtime errors by overrwriting  vega.logging.error ...
export class VegaView {
  constructor(parentEl, inputSpec, timefilter, es, serviceSettings, onError, onWarn) {
    this._onWarn = onWarn;
    this._onError = (errOrMessage) => {
      const error = errOrMessage instanceof Error
        ? errOrMessage
        : new Error(errOrMessage);

      onError(error);
      throw error;
    };

    this._parentEl = parentEl;
    this._serviceSettings = serviceSettings;

    const { spec, widthPadding, heightPadding, mapConfig, supportHover } = parseInputSpec(inputSpec, this._onWarn);
    this._spec = spec;
    this._widthPadding = widthPadding;
    this._heightPadding = heightPadding;
    this._mapConfig = mapConfig;
    this._supportHover = supportHover;

    this._viewConfig = {
      loader: createVegaLoader(es, timefilter),
      logLevel: vega.Warn,
      renderer: 'canvas',
    };
  }

  async init() {
    this._$container = $('<div class="vega-view-container">').appendTo(this._parentEl);
    this._addDestroyHandler(() => {
      this._$container.remove();
      this._$container = null;
    });

    if (this._mapConfig) {
      await this._initLeafletVega();
    } else {
      await this._initRawVega();
    }
  }

  resize() {
    // needs to wait for init() to complete and return promise for when
    // resize is complete, and not resize when destroyed
    viewP.then(v =>
      v.view
        .width(this._$container.width())
        .height(this._$container.height())
        .run());
  }

  async destroy() {
    if (this._destroyHandlers) {
      const handlers = this._destroyHandlers;
      this._destroyHandlers = null;
      for (const handler of handlers) {
        await handler();
      }
    }
  }

  _destroyHandlers = [];

  _addDestroyHandler(handler) {
    if (this._destroyHandlers) {
      this._destroyHandlers.push(handler);
    } else {
      handler();
    }
  }

  updateVegaSize(view) {
    view
      .width(this._$container.width() - this._widthPadding)
      .height(this._$container.height() - this._heightPadding);
  }

  async _initRawVega() {
    const view = new vega.View(vega.parse(this._spec), this._viewConfig);
    view.warn = this._onWarn;
    view.error = this._onError;
    this.updateVegaSize(view);

    view.padding({
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    });

    view.initialize(this._$container.get(0));

    if (this._supportHover) view.hover();

    await view.runAsync();

    // if (view._pending) {
    //   await view._pending;
    // }

    this._addDestroyHandler(() => {
      view.finalize();
    });
  }

  async _initLeafletVega() {
    const tmsService = await this._serviceSettings.getTMSService();

    const url = tmsService.getUrl();
    const options = tmsService.getTMSOptions();

    const delayRepaint = this._mapConfig.delayRepaint === undefined ? true : this._mapConfig.delayRepaint;
    const lon = this._mapConfig.longitude || 0;
    const lat = this._mapConfig.latitude || 0;
    const zoom = this._mapConfig.zoom === undefined ? 2 : this._mapConfig.zoom;

    const map = L.map(this._$container.get(0), {
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      center: [lat, lon],
      zoom: Math.min(options.maxZoom, Math.max(options.minZoom, zoom))
    });

    const baseLayer = L
      .tileLayer(url, {
        minZoom: options.minZoom,
        maxZoom: options.maxZoom,
        subdomains: options.subdomains || [],
        attribution: options.attribution
      })
      .addTo(map);

    const vegaLayer = L
      .vega(this._spec, {
        vega,
        delayRepaint,
        viewConfig: this._viewConfig,
        onWarning: this._onWarn,
        onError: this._onError
      })
      .addTo(map);

    this._addDestroyHandler(() => {
      map.removeLayer(vegaLayer);
      map.removeLayer(baseLayer);
      map.remove();
    });
  }
}
