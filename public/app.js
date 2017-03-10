import moment from 'moment';
import chrome from 'ui/chrome';
import uiModules from 'ui/modules';
import uiRoutes from 'ui/routes';

import 'ui/autoload/styles';
import './less/main.less';
import template from './templates/index.html';

uiRoutes.enable();
uiRoutes
.when('/', {
  template,
  resolve: {
    currentTime($http) {
      return $http.get('../api/vega_vis/example').then(function (resp) {
        return resp.data.time;
      });
    }
  }
});

uiModules
.get('app/vega_vis', [])
.controller('vegaVisHelloWorld', function ($scope, $route, $interval) {
  $scope.title = 'Vega Vis';
  $scope.description = 'Build vega visualizations into Kibana';

  const currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  const unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);
});
