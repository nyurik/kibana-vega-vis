### Getting download counts per release per Kibana version
```
curl -s https://api.github.com/repos/nyurik/kibana-vega-vis/releases | \
  grep -E '("download_count"|        "name")' | \
  sed '$!N;s/\n/ /;s/.*vega_vis-\+//;s/\.zip.*: /\t\t/;s/,$//'
``'
