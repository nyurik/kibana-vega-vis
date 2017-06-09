import { ResizeCheckerProvider } from 'ui/resize_checker';
//import { AggResponseTabifyProvider } from 'ui/agg_response/tabify/tabify';

import { createVegaView } from './vega_view';
// import moment from 'moment';

import hjson from 'hjson';

export function createVegaVisController(Private, /*$scope,*/ timefilter, es) {
  const ResizeChecker = Private(ResizeCheckerProvider);
  // const tabify = Private(AggResponseTabifyProvider);

  class VegaVisController {
    link($scope, $el/*, $attr*/) {
      const resizeChecker = new ResizeChecker($el);

      const onError = err => {
        console.error(err);
        $el.text(err.message || err);
      };

      // FIXME? is this the right way to monitor timefilter?
      $scope.timefilter = timefilter;
      $scope.$watchMulti(['=vega.vis.params', '=timefilter'], () => {
        try {
          const spec = hjson.parse($scope.vega.vis.params.spec);
          this.vegaView = createVegaView($scope, $el.get(0), spec, timefilter, es);
          this.vegaView.promise().catch(onError);
        } catch (err) {
          onError(err);
        }

        resizeChecker.modifySizeWithoutTriggeringResize(() => {
          this.vegaView.resize();
        });
      });

      resizeChecker.on('resize', () => {
        resizeChecker.modifySizeWithoutTriggeringResize(() => {
          this.vegaView.resize();
        });
      });
      $scope.$on('$destroy', () => {
        this.vegaView.destroy();
      });
    }
    //
    // onEsResponse(vis, esResponse) {
    //   if (!this.vegaView) {
    //     throw new Error('esResponse provided before vegaView was initialized');
    //   }
    //
    //   if (!vis || !esResponse) {
    //     this.vegaView.setData([]);
    //     return;
    //   }
    //
    //   const { columns, rows } = tabify(vis, esResponse, {
    //     canSplit: false,
    //     partialRows: true,
    //     minimalColumns: false,
    //     // metricsForAllBuckets: false,
    //     asAggConfigResults: false,
    //   });
    //
    //   const aggTypeCounters = {};
    //   const columnNames = columns.map(col => {
    //     const typeName = col.aggConfig.type.type;
    //     const count = (aggTypeCounters[typeName] || 0) + 1;
    //     aggTypeCounters[typeName] = count;
    //     return `${typeName}${count}`;
    //   });
    //
    //   const vegaTable = rows.map(row => {
    //     return columns.reduce((acc, column, i) => {
    //       let value = row[i];
    //       const field = column.aggConfig.getField();
    //       if (field && field.type === 'date') {
    //         value = moment(value);
    //       }
    //       acc[columnNames[i]] = value;
    //       return acc;
    //     }, {});
    //   });
    //
    //   this.vegaView.setData(vegaTable);
    // }
  }

  return new VegaVisController();
}
