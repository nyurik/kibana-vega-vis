import { uiModules } from 'ui/modules';

import { createVegaVisController } from './vega_vis.controller.js';
import VegaVisTemplate from './vega_vis.template.html';
import './vega_vis.less';

uiModules.get('kibana')
  .directive('vegaVis', () => ({
    restrict: 'E',
    controller: createVegaVisController,
    controllerAs: 'vega',
    scope: {
      vis: '='
    },
    bindToController: true,
    link($scope, ...args) {
      $scope.vega.link($scope, ...args);
    }
  }));
