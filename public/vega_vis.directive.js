import uiModules from 'ui/modules';

import { VegaVisController } from './vega_vis.controller.js';
import VegaVisTemplate from './vega_vis.template.html';
import './vega_vis.style.less';

uiModules.get('kibana')
  .directive('vegaVis', () => ({
    restrict: 'E',
    controller: VegaVisController,
    controllerAs: 'vega',
    scope: {
      esResponse: '='
    },
    bindToController: true,
    link($scope, ...args) {
      $scope.vega.link($scope, ...args);
    }
  }));