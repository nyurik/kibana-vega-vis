import { ResizeCheckerProvider } from 'ui/resize_checker';
import { dashboardContextProvider } from 'plugins/kibana/dashboard/dashboard_context';
import { VegaView } from './vega_view';

import hjson from 'hjson';

export function createVegaVisController(Private, /*$scope,*/ timefilter, es, serviceSettings) {
  const ResizeChecker = Private(ResizeCheckerProvider);
  const dashboardContext = Private(dashboardContextProvider);

  class VegaVisController {

    messages = [];

    onError = (error) => {
      if (!error) {
        error = 'ERR';
      } else if (error instanceof Error) {
        if (console && console.log) console.log(error);
        error = error.message;
      }
      this.messages.push({ type: 'error', data: error });
    };

    onWarn = (warning) => {
      this.messages.push({ type: 'warning', data: warning });
    };

    link($scope, $el/*, $attr*/) {
      const resizeChecker = new ResizeChecker($el);

      const createGraph = async () => {
        this.messages = [];

        // FIXME!!  need to debounce editor changes

        try {
          const spec = hjson.parse($scope.vega.vis.params.spec);
          if (this.vegaView) {
            await this.vegaView.destroy();
          }
          this.vegaView = new VegaView($el, spec, timefilter, dashboardContext, es, serviceSettings, this.onError, this.onWarn);
          await this.vegaView.init();
        } catch (error) {
          this.onError(error);
        }

        resizeChecker.modifySizeWithoutTriggeringResize(() => this.vegaView.resize());
      };

      $scope.timefilter = timefilter;
      $scope.$watchMulti(
        [
          '=vega.vis.params',
          '=timefilter',
          { get: dashboardContext, deep: true }
        ],
        createGraph
      );

      resizeChecker.on('resize', () => {
        resizeChecker.modifySizeWithoutTriggeringResize(() => this.vegaView.resize());
      });

      $scope.$on('$destroy', () => {
        this.vegaView.destroy().catch(error => this.onError(error));
      });
    }
  }

  return new VegaVisController();
}
