import { uiModules } from 'ui/modules';

import { createVegaVisEditorController } from './vega_vis_editor.controller.js';
import VegaVisEditorTemplate from './vega_vis_editor.template.html';
import './vega_vis_editor.less';

uiModules.get('kibana')
  .directive('vegaVisEditor', () => ({
    restrict: 'E',
    template: VegaVisEditorTemplate,
    controller: createVegaVisEditorController,
    controllerAs: 'vegaEditor',
    scope: {
      vis: '=',
      persistAppState: '&',
      uiState: '='
    },
    bindToController: true,
    link($scope, ...args) {
      $scope.vegaEditor.link($scope, ...args);
    }
  }));
