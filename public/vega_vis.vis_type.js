import { CATEGORY } from 'ui/vis/vis_category';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';

import './vega_vis.directive';
import './vega_vis_editor.directive';

import demoSpec from '!!raw-loader!./examples/demo.spec.json';

// register the provider with the visTypes registry
VisTypesRegistryProvider.register(VegaVisProvider);

function VegaVisProvider(Private) {
  const VisFactory = Private(VisFactoryProvider);

  // return the visType object, which kibana will use to display and configure new
  // Vis object of this type.
  return VisFactory.createAngularVisualization({
    name: 'vega',
    title: 'Vega Vis',
    description: '',
    icon: 'fa-code',
    visConfig: {
      template: `<vega-vis vis="vis" es-response="esResponse"></vega-vis>`,
    },
    editorConfig: {
      optionsTemplate: `<vega-vis-editor
                          vis="vis"
                          persist-app-state="state.save(true)"
                          ui-state="uiState"
                          ></vega-vis-editor>`
    },
    params: {
      defaults: {
        spec: '' // FIXME!!!!!!!!!!!!!!!!!!  ---  demoSpec
      },
    },
    requestHandler: 'none',
    requiresTimePicker: true,
    fullEditor: true,
    category: CATEGORY.OTHER
  });
};
