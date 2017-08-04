import { TemplateVisTypeProvider } from 'ui/template_vis_type/template_vis_type';

import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisVisTypeProvider } from 'ui/vis/vis_type';

import './vega_vis.directive';
import './vega_vis_editor.directive';

import defaultSpec from '!!raw-loader!./default.spec.json';

// register the provider with the visTypes registry
VisTypesRegistryProvider.register(function MetricVisProvider(Private) {
  const VisType = Private(VisVisTypeProvider);
  const TemplateVisType = Private(TemplateVisTypeProvider);
  // const VisSchemas = Private(VisSchemasProvider);

  // return the visType object, which kibana will use to display and configure new
  // Vis object of this type.
  return new TemplateVisType({
    name: 'vega',
    title: 'Vega Vis',
    description: '',
    icon: 'fa-code',
    template: `<vega-vis vis="vis"></vega-vis>`,
    params: {
      defaults: {
        spec: defaultSpec
      },
      editor: `<vega-vis-editor
vis="vis"
persist-app-state="state.save(true)"
ui-state="uiState"
></vega-vis-editor>`
    },
    // implementsRenderComplete: true,
    requiresSearch: false,
    requiresTimePicker: true,
    fullEditor: true,
    category: VisType.CATEGORY.OTHER
  });
});
