# Vega visualization plugin for Kibana

> Build [Vega](https://vega.github.io/vega/examples/) and [VegaLite](https://vega.github.io/vega-lite/examples/) data visualizations into Kibana, either standalone, or on top of a map.

# Watch a short introduction video
[![Leaflet Vega layer demo](https://i.ytimg.com/vi_webp/lQGCipY3th8/maxresdefault.webp)](https://www.youtube.com/watch?v=lQGCipY3th8)


# Quick Demo

* Follow Kibana plugin installation [instructions](https://www.elastic.co/guide/en/kibana/current/_installing_plugins.html). For URL, use a direct download link from the [releases page](https://github.com/nyurik/kibana-vega-vis/releases)
* In Kibana, choose Visualize, and add Vega visualization.
* Copy this VegaLite into the left panel. You should immediatelly see the graph.
```yaml
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
* Try other [Vega](https://vega.github.io/vega/examples/) or [VegaLite](https://vega.github.io/vega-lite/examples/) visualizations (see notes below)
* Try a [map example](public/examples/external_and_embedded_data/map_unemployment_data.json)

# Vega with a map
Kibana's default map can be used as a base of the Vega graph. To enable, the graph must specify `type=map` in the host configuration:

```yaml
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

# Querying ElasticSearch
By default, Vega's [data](https://vega.github.io/vega/docs/data/) element can use embedded and external data with a `"url"` parameter. Kibana plugin adds support for the direct ElasticSearch queries by overloading the "url"` value.

Here is an example of an ES query that gets data from `logstash-*` index, filtering by 

```yaml
{
  "data": [
    {
      "name": "myEsDataSource",
      "url": {
        // Index name
        "index": "logstash-*",

        // Use current dashboard search string and time range filter with the "@timestamp" field.
        // Set value to true to ignore the time filter
        "%context_query%": "@timestamp",

        // TIP: request can be copied from the debug view of another visualizer
        // You can try this query in Kibana Dev tools (hardcode or remove the `%...%` values first)
        "body": {
          // When aggegating, do not return individual documents that match the query
          "size": 0,

          // Data aggegation...
          "aggs": {
            // Name of the aggegation - your Vega graph will use it to parse the results
            "hist": {
              "date_histogram": {
                "field": "@timestamp",
                "interval": "2h",
                "time_zone": "America/New_York",
                "min_doc_count": 1
              }
            }
          }
        }
      },

      // This is a useful trick to access just the list of aggregation results named "hist"
      //
      "format": {
        "type": "json",
        "property": "aggregations.hist.buckets"
      },

    }
  ],
  ...
}
```

As a result, "myEsDataSource" will be a list of objects. Note that `"key"` is a unix timestamp, and can be used without conversions by the Vega date expressions.
```yaml
[
    {
      "key_as_string": "2017-06-13T04:00:00.000-04:00",
      "key": 1497340800000,
      "doc_count": 6
    },
    {
      "key_as_string": "2017-06-13T06:00:00.000-04:00",
      "key": 1497348000000,
      "doc_count": 14
    },
    ...
]
```

Query may be specified with individual range and dashboard context as well. This query is equivalent to `"%context_query%": "@timestamp"`, except that the timerange is shifted back by 10 minutes:

```yaml
{
  "data": [
    {
      "name": "myEsDataSource",
      "url": {
        // Index name
        "index": "logstash-*",

        "body": {
          "query": {
            "bool": {
              "must": [
                "range": {
                  // apply timefilter (upper right corner) to the @timestamp variable
                  "@timestamp": {
                    // "%timefilter%" will be replaced with the current
                    // values of the time filter (from the upper right corner)
                    "%timefilter%": true
    
                    // Only work with %timefilter%
                    // Shift the current timefilter by 10 units back
                    "shift": 10,
                    
                    // supports week, day (default), hour, minute, second.
                    "unit": "minute"
                  }
                }
              ],
              "must_not": [
                // This string will be replaced with the auto-generated "MUST-NOT" clause
                "%dashboard_context-must_not_clause%"
              ]
            }
          },
     ...
```


# Vega vs VegaLite
VegaLite is a simplified version of Vega, useful to quickly get started, but has a number of limitations.  VegaLite is automatically converted into Vega before rendering. Compare [logstash-simple_line-vega](public/examples/logstash/logstash-simple_line-vega.json) and [logstash-simple_line-vegalite](public/examples/logstash/logstash-simple_line-vegalite.json) (both use the same ElasticSearch logstash data). You may use [this editor](https://vega.github.io/editor/) to convert VegaLite into Vega.

# Notes

### Useful Links
* [Editor](https://vega.github.io/editor/) - includes examples for Vega & VegaLite, but does not support any Kibana-Plugin-specific features like ElasticSearch requests and interactive base maps.
* VegaLite [Tutorials](https://vega.github.io/vega-lite/tutorials/getting_started.html), [docs](https://vega.github.io/vega-lite/docs/), and [examples](https://vega.github.io/vega-lite/examples/)
* Vega [Tutorial](https://vega.github.io/vega/tutorials/), [docs](https://vega.github.io/vega/docs/), [examples](https://vega.github.io/vega/examples/)

### Using Vega and VegaLite examples
When using [Vega](https://vega.github.io/vega/examples/) and [VegaLite](https://vega.github.io/vega-lite/examples/) examples, you may need to modify the "data" section to use absolute URL. For example, replace `"url": "data/world-110m.json"` with `"url": "https://vega.github.io/editor/data/world-110m.json"`. Also, regular Vega (not VegaLite) examples use `"autosize": "pad"` layout model, whereas Kibana plugin uses `fit`. See [sizing and positioning](#Sizing and positioning) below.

### Additional configuration options
```yaml
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

##### VegaLite
VegaLite [does not support](https://github.com/vega/vega-lite/issues/618) flexible resizing. By default, the graph will be at least 200x200 plus padding and additional elements like the legend and axes.


## Development

See the [kibana contributing guide](https://github.com/elastic/kibana/blob/master/CONTRIBUTING.md) for instructions setting up your development environment. Once you have completed that, use the following npm tasks.

  - `npm start`

    Start kibana and have it include this plugin

  - `npm run build`

    Build a distributable archive

  - `npm run test:browser`

    Run the browser tests in a real web browser

  - `npm run test:server`

    Run the server tests using mocha

For more information about any of these commands run `npm run ${task} -- --help`.
