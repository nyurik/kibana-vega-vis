# vega_vis

> Build [Vega](https://vega.github.io/vega/examples/) and [Vega Lite](https://vega.github.io/vega-lite/examples/) visualizations into Kibana, either standalone, or on top of a map.

# Quick Demo

* Add this plugin to Kibana.
* In Kibana, choose Visualize, and add Vega visualization.
* Copy this Vega-Lite into the left panel. You should immediatelly see the graph.
```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v2.json",
  "description": "A simple bar chart with embedded data.",
  "width": 300, "height": 200, "padding": 5,
  "data": {
    "values": [
      {"a": "A","b": 28}, {"a": "B","b": 55}, {"a": "C","b": 43},
      {"a": "D","b": 91}, {"a": "E","b": 81}, {"a": "F","b": 53},
      {"a": "G","b": 19}, {"a": "H","b": 87}, {"a": "I","b": 52}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "a", "type": "ordinal"},
    "y": {"field": "b", "type": "quantitative"}
  }
}
```
* Try changing `mark` from `bar` to `point`, `line`, `area`, `circle`, `square`, ... (see [docs](https://vega.github.io/vega-lite/docs/mark.html#mark-def))
* Try other [Vega](https://vega.github.io/vega/examples/) or [Vega Lite](https://vega.github.io/vega-lite/examples/) visualizations (see notes below)
* Try a [map example](examples/map.simple.json)

# Vega with a map
Kibana's default map can be used as a base of the Vega graph. To enable, the graph must specify `type=map` in the host configuration:

```json
{
  "_hostConfig": {
    "type": "map",
    
    // Initial map position
    "latitude": 40.7,     // default 0
    "longitude": -74,     // default 0
    "zoom": 7,            // default 2

    // When false, repaints on each move frame. Makes the graph much slower
    "delayRepaint": true, // default true
  },
  /* the rest of Vega JSON */
}
```

This plugin will automatically inject a projection called `"projection"`. Use it to calculate positioning of all geo-aware marks. Additionally, you may use `latitude`, `longitude`, and `zoom` signals. These signals can be used in the graph, or can be updated to modify the positioning of the map.


# Notes

### Using Vega and Vega-lite examples
When using [Vega](https://vega.github.io/vega/examples/) and [Vega Lite](https://vega.github.io/vega-lite/examples/) examples, you may need to modify the "data" section to use absolute URL. For example, replace `"url": "data/world-110m.json"` with `"url": "https://vega.github.io/editor/data/world-110m.json"`. Also, regular Vega (not Vega-lite) examples use `"autosize": "pad"` layout model, whereas Kibana plugin uses `fit`. See [sizing and positioning](#Sizing and positioning) below.

### Additional configuration options
```json
{
  "_hostConfig": {
    // Placement of the Vega-defined signal bindings.
    // Can be `left`, `right`, `top`, or `bottom` (default).
    "controlsLocation": "top",
    // Can be `vertical` or `horizontal` (default).
    "controlsDirection": "vertical"
  },
  /* the rest of Vega JSON */
}
```


### Sizing and positioning
##### Vega
By default, Kibana Vega graphs will use `autosize="fit"` layout model for Vega graphs, use all available space, and ignore `width` and `height` values. You may override this behaviour by specifying a different `autosize` value.
 
##### Vega on a map
All Vega graphs will ignore `autosize`, `width`, `height`, and `padding` values, using `fit` model with zero padding.

##### Vega-Lite
Vega lite [does not support](https://github.com/vega/vega-lite/issues/618) flexible resizing. By default, the graph will be at least 200x200 plus padding and additional elements like the legend and axes.


---

## development

See the [kibana contributing guide](https://github.com/elastic/kibana/blob/master/CONTRIBUTING.md) for instructions setting up your development environment. Once you have completed that, use the following npm tasks.

  - `npm start`

    Start kibana and have it include this plugin

  - `npm start -- --config kibana.yml`

    You can pass any argument that you would normally send to `bin/kibana` by putting them after `--` when running `npm start`

  - `npm run build`

    Build a distributable archive

  - `npm run test:browser`

    Run the browser tests in a real web browser

  - `npm run test:server`

    Run the server tests using mocha

For more information about any of these commands run `npm run ${task} -- --help`.
