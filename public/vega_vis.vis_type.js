import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';
import visTypesRegistry from 'ui/registry/vis_types';

import './vega_vis.directive';

// register the provider with the visTypes registry
visTypesRegistry.register(function MetricVisProvider(Private) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const VisSchemas = Private(VisSchemasProvider);

  // return the visType object, which kibana will use to display and configure new
  // Vis object of this type.
  return new TemplateVisType({
    name: 'vega',
    title: 'Vega Vis',
    description: '',
    icon: 'fa-code',
    template: `<vega-vis es-response="esResponse"></vega-vis>`,
    params: {
      defaults: {},
      editor: ``
    },
    // implementsRenderComplete: true,
    schemas: new VisSchemas([
      {
        group: 'metrics',
        name: 'metric',
        title: 'Metric',
        min: 0,
        defaults: [
          { type: 'count', schema: 'metric' }
        ]
      },
      {
        group: 'buckets',
        name: 'bucket',
        title: 'Bucket Agg'
      },
    ])
  });
});