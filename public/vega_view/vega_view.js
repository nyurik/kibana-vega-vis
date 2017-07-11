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
    this._onError = onError;
    this._parentEl = parentEl;
    this._serviceSettings = serviceSettings;

    const { spec, paddingWidth, paddingHeight, mapConfig, useResize, useHover } = parseInputSpec(inputSpec, this._onWarn);
    this._spec = spec;
    this._paddingWidth = paddingWidth;
    this._paddingHeight = paddingHeight;
    this._mapConfig = mapConfig;
    this._useResize = useResize;
    this._useHover = useHover;
    this._view = null;

    this._viewConfig = {
      loader: createVegaLoader(es, timefilter),
      logLevel: vega.Warn,
      renderer: 'canvas',
    };
  }

  async init() {
    this._$container = $('<div class="vega-view-container">').appendTo(this._parentEl);
    this._$controls = $('<div class="vega-controls-container">').appendTo(this._parentEl);
    this._addDestroyHandler(() => {
      this._$container.remove();
      this._$container = null;
      this._$controls.remove();
      this._$controls = null;
    });

    if (this._mapConfig) {
      await this._initLeafletVega();
    } else {
      await this._initRawVega();
    }
  }

  resize() {
    if (this._useResize && this._view && this.updateVegaSize(this._view)) {
      return this._view.runAsync();
    } else {
      return Promise.resolve();
    }
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
    const width = Math.max(0, this._$container.width() - this._paddingWidth);
    const height = Math.max(0, this._$container.height() - this._paddingHeight);
    if (view.width() !== width || view.height() !== height) {
      view.width(width).height(height);
      return true;
    }
    return false;
  }

  async _initRawVega() {
    const view = new vega.View(vega.parse(this._spec), this._viewConfig);
    view.warn = this._onWarn;
    view.error = this._onError;
    if (this._useResize) this.updateVegaSize(view);
    view.initialize(this._$container.get(0), this._$controls.get(0));

    if (this._useHover) view.hover();

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
        bindingsContainer: this._$controls.get(0),
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
