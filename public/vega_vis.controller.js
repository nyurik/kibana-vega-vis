import * as vega from 'vega';

import { ResizeCheckerProvider } from 'ui/resize_checker';

import voyagerSpec from './voyager.vg.json';

export class VegaVisController {
  constructor(Private) {
    this.ResizeChecker = Private(ResizeCheckerProvider);
  }

  link($scope, $el, $attr) {
    this.resizeChecker = new this.ResizeChecker($el);

    const view = new vega.View(vega.parse(voyagerSpec))
      .logLevel(vega.Warn)    // set view logging level
      .renderer('svg')        // set renderer (canvas or svg)
      .initialize($el.get(0)) // initialize view within parent DOM container
      .hover()                // enable hover encode set processing
      .width($el.width() - 100)
      .height($el.height() - 100)
      .padding({ left: 0, right: 0, top: 0, bottom: 0 });

    this.resizeChecker.modifySizeWithoutTriggeringResize(() => {
      view.run();                 // run the dataflow and render the view
    });

    this.resizeChecker.on('resize', () => {
      view
        .width($el.width() - 100)
        .height($el.height() - 100)
        .run();
    });

    $scope.$on('$destroy', () => {
      view.finalize();
    });
  }
}