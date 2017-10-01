# Logstash Examples

Start with the `logstash` examples to see how Elasticsearch data can be visualized with Vega.
 Before using any of the examples, you will need to generate some data with the [makelogs utility](https://www.npmjs.com/package/makelogs):

```bash
$ npm install -g makelogs
$ makelogs
```  

Use `--help` for additional parameters. By default, it will generate 14000 datapoints ±1 day of today on the local elasticsearch instance.
