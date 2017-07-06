import $ from 'jquery';
import L from 'leaflet';
import 'leaflet-vega';
import * as vega from 'vega';

import { parseInputSpec } from './parse_input_spec';
import { createVegaLoader } from './vega_loader';

// FIXME: handle runtime errors by overrwriting  vega.logging.error ...
export class VegaView {
  constructor(parentEl, inputSpec, timefilter, es, serviceSettings, onMessage) {
    this._onMessage = onMessage;
    const parsed = parseInputSpec(inputSpec, (warning) => this._onMessage({ type: 'warning', warning }));
    this._spec = parsed.spec;
    this._baseMapSpec = parsed.baseMapSpec;
    this._parentEl = parentEl;
    this._serviceSettings = serviceSettings;
    this._viewConfig = {
      loader: createVegaLoader(es, timefilter)
    };
  }

  async init() {
    this._$container = $('<div class="vega-view-container">').appendTo(this._parentEl);
    this._addDestroyHandler(() => {
      this._$container.remove();
      this._$container = null;
    });

    if (this._baseMapSpec) {
      await this._initBaseMap();
    } else {
      await this._initVega();
    }
  }

  // resize() {
  //   // needs to wait for init() to complete and return promise for when
  //   // resize is complete, and not resize when destroyed
  //   viewP.then(v =>
  //     v.view
  //       .width(getWidth())
  //       .height(getHeight())
  //       .run());
  // }

  async destroy() {
    if (!this._destroyHandlers) {
      throw new Error('VegaView already destroyed');
    }

    const handlers = this._destroyHandlers;
    this._destroyHandlers = null;
    for (const handler of handlers) {
      await handler();
    }
  }

  _destroyHandlers = []
  _addDestroyHandler(handler) {
    if (this._destroyHandlers) {
      this._destroyHandlers.push(handler);
    } else {
      handler();
    }
  }

  async _initVega() {
    const view = new vega.View(vega.parse(this._spec), this._viewConfig);

    view.warn = (warning) => {
      this._onMessage({ type: 'warning', warning });
    };

    view.error = (errOrMessage) => {
      const error = errOrMessage instanceof Error
        ? errOrMessage
        : new Error(errOrMessage);

      this._onMessage({ type: 'error', error });
      throw error;
    };

    view
      .initialize(this._$container.get(0))
      .width(() => {
        console.log('width', this._$container.width() - 100);
        return this._$container.width() - 100;
      })
      .height(() => {
        console.log('height', this._$container.height() - 100);
        return this._$container.height() - 100;
      })
      .padding({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      })
      .run();

    if (view._pending) {
      await view._pending;
    }

    this._addDestroyHandler(() => {
      view.finalize();
    });
  }

  async _initBaseMap() {
    const tmsService = await this._serviceSettings.getTMSService();

    const url = tmsService.getUrl();
    const options = tmsService.getTMSOptions();

    const map = L.map(this._$container.get(0), {
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      center: [0, 0],
      zoom: 2
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
      .vega(this._spec, { vega, viewConfig: this._viewConfig })
      .addTo(map);

    this._addDestroyHandler(() => {
      map.removeLayer(baseLayer);
      map.removeLayer(vegaLayer);
      map.remove();
    });
  }
}