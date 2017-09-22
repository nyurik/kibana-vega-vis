import $ from 'jquery';
import L from 'leaflet';
import 'leaflet-vega';
import * as vega from 'vega';

import { parseInputSpec } from './parse_input_spec';
import { createVegaLoader } from './vega_loader';

// FIXME: handle runtime errors by overrwriting  vega.logging.error ...
export class VegaView {
  constructor(parentEl, inputSpec, timefilter, dashboardContext, es, serviceSettings, onError, onWarn) {
    this._onWarn = onWarn;
    this._onError = onError;
    this._parentEl = parentEl;
    this._serviceSettings = serviceSettings;

    this._specParams = parseInputSpec(inputSpec, this._onWarn);
    this._parentEl.css('flex-direction', this._specParams.containerDir);

    this._view = null;

    this._viewConfig = {
      loader: createVegaLoader(es, timefilter, dashboardContext),
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
    const specParams = this._specParams;
    const useDefaultMap = specParams.mapStyle !== false;

    let limits, url, baseLayer;

    if (useDefaultMap) {
      const tmsService = await this._serviceSettings.getTMSService();
      url = tmsService.getUrl();
      limits = tmsService.getTMSOptions();
    } else {
      limits = {minZoom: 0, maxZoom: 25};
    }

    // In some cases, Vega may be initialized twice, e.g. after awaiting... TBD
    if (!this._$container) return;

    let validate = (name, value, dflt, min, max) => {
      if (value === undefined) {
        value = dflt;
      } else if (value < min) {
        this._onWarn(`Reseting ${name} to ${min}`);
        value = min;
      } else if (value > max) {
        this._onWarn(`Reseting ${name} to ${max}`);
        value = max;
      }
      return value;
    };

    let minZoom = validate(`minZoom`, specParams.minZoom, limits.minZoom, limits.minZoom, limits.maxZoom);
    let maxZoom = validate(`maxZoom`, specParams.maxZoom, limits.maxZoom, limits.minZoom, limits.maxZoom);
    if (minZoom > maxZoom) {
      this._onWarn(`minZoom and maxZoom have been swapped`);
      [minZoom, maxZoom] = [maxZoom, minZoom];
    }
    const zoom = validate(`zoom`, specParams.zoom, 2, minZoom, maxZoom);

    const map = L.map(this._$container.get(0), {
      minZoom: minZoom,
      maxZoom: maxZoom,
      center: [specParams.latitude, specParams.longitude],
      zoom: zoom,
    });

    if (useDefaultMap) {
      baseLayer = L
        .tileLayer(url, {
          minZoom: limits.minZoom,
          maxZoom: limits.maxZoom,
          subdomains: limits.subdomains || [],
          attribution: limits.attribution
        })
        .addTo(map);
    }

    const vegaLayer = L
      .vega(specParams.spec, {
        vega,
        bindingsContainer: this._$controls.get(0),
        delayRepaint: specParams.delayRepaint,
        viewConfig: this._viewConfig,
        onWarning: this._onWarn,
        onError: this._onError
      })
      .addTo(map);

    this._addDestroyHandler(() => {
      map.removeLayer(vegaLayer);
      if (baseLayer) map.removeLayer(baseLayer);
      map.remove();
    });
  }
}
