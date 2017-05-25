import uiModules from 'ui/modules';

import { createVegaVisController } from './vega_vis.controller.js';
import VegaVisTemplate from './vega_vis.template.html';
import './vega_vis.style.less';

uiModules.get('kibana')
  .directive('vegaVis', () => ({
    restrict: 'E',
    controller: createVegaVisController,
    controllerAs: 'vega',
    link($scope, ...args) {
      $scope.vega.link($scope, ...args);

      $scope.$watchMulti([
        'vis',
        'esResponse'
      ], () => {
        $scope.vega.onEsResponse($scope.vis, $scope.esResponse);
      });
    }
  }));