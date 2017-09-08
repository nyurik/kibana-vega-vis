import $ from 'jquery';
import L from 'leaflet';
import 'leaflet-vega';
import * as vega from 'vega';

import { parseInputSpec } from './parse_input_spec';
import { createVegaLoader } from './vega_loader';

// FIXME: handle runtime errors by overrwriting  vega.logging.error ...
export class VegaView {
  constructor(parentEl, inputSpec, timefilter, indexPatterns, dashboardContext, es, serviceSettings, onError, onWarn) {
    this._onWarn = onWarn;
    this._onError = onError;
    this._parentEl = parentEl;
    this._serviceSettings = serviceSettings;

    this._specParams = parseInputSpec(inputSpec, this._onWarn);
    this._parentEl.css('flex-direction', this._specParams.containerDir);

    this._view = null;

    this._viewConfig = {
      loader: createVegaLoader(es, timefilter, indexPatterns, dashboardContext),
      logLevel: vega.Warn,
      renderer: 'canvas',
    };
  }

  async init() {
    this._$container = $('<div class="vega-view-container">').appendTo(this._parentEl);
    this._$controls = $('<div class="vega-controls-container">')
      .css('flex-direction', this._specParams.controlsDir)
      .appendTo(this._parentEl);

    this._addDestroyHandler(() => {
      this._$container.remove();
      this._$container = null;
      this._$controls.remove();
      this._$controls = null;
    });

    if (this._specParams.useMap) {
      await this._initLeafletVega();
    } else {
      await this._initRawVega();
    }
  }

  resize() {
    if (this._specParams.useResize && this._view && this.updateVegaSize(this._view)) {
      return this._view.runAsync();
    } else {
      return Promise.resolve();
    }
  }

  // BUG: FIXME: if this method is called twice without awaiting, the sceond call will return success right away
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
    // FIXME: for some reason the object is slightly scrollable without this
    const heightExtraPadding = 6;
    const width = Math.max(0, this._$container.width() - this._specParams.paddingWidth);
    const height = Math.max(0, this._$container.height() - this._specParams.paddingHeight) - heightExtraPadding;
    if (view.width() !== width || view.height() !== height) {
      view.width(width).height(height);
      return true;
    }
    return false;
  }

  async _initRawVega() {
    // In some cases, Vega may be initialized twice... TBD
    if (!this._$container) return;

    const view = new vega.View(vega.parse(this._specParams.spec), this._viewConfig);
    view.warn = this._onWarn;
    view.error = this._onError;
    if (this._specParams.useResize) this.updateVegaSize(view);
    view.initialize(this._$container.get(0), this._$controls.get(0));

    if (this._specParams.useHover) view.hover();

    this._addDestroyHandler(() => {
      this._view = null;
      view.finalize();
    });

    await view.runAsync();
    this._view = view;
  }

  async _initLeafletVega() {
    const tmsService = await this._serviceSettings.getTMSService();

    const url = tmsService.getUrl();
    const options = tmsService.getTMSOptions();

    // In some cases, Vega may be initialized twice... TBD
    if (!this._$container) return;

    const map = L.map(this._$container.get(0), {
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      center: [this._specParams.latitude, this._specParams.longitude],
      zoom: Math.min(options.maxZoom, Math.max(options.minZoom, this._specParams.zoom))
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
      .vega(this._specParams.spec, {
        vega,
        bindingsContainer: this._$controls.get(0),
        delayRepaint: this._specParams.delayRepaint,
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
