import hjson from 'hjson';
import 'brace/ext/searchbox';
import compactStringify from 'json-stringify-pretty-compact';
import split from 'split.js';

export function createVegaVisEditorController(getAppState) {

  class VegaVisEditorController {
    link($scope, $el /*, $attr*/) {

      split([$el.find('.vegaEditor').get(0), $el.find('.vegaEditorPreview').get(0)], {
        sizes: [40, 60],
        minSize: [200, 200],
        elementStyle: (dim, size, gutterSize) => ({ 'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)' }),
        gutterStyle: (dim, gutterSize) => ({ 'flex-basis': gutterSize + 'px' })
      });

      $scope.$watchMulti(
        ['=vegaEditor.vis.params'],
        () => {
          const appState = getAppState();
          appState.vis.params = $scope.vegaEditor.vis.params;
          appState.save(true)
        }
      );

      $scope.formatJson = (event) => {
        this._format($scope, event, compactStringify, {
          maxLength: this._getCodeWidth()
        });
      };

      $scope.formatHJson = (event) => {
        this._format($scope, event, hjson.stringify, {
          condense: this._getCodeWidth(),
          bracesSameLine: true,
          keepWsc: true,
        });
      }

    }

    shouldShowSpyPanel() {
      return false;
    }

    _getCodeWidth() {
      return 85; // this.aceEditor.getSession().getWrapLimit();
    }

    _format($scope, event, stringify, opts) {
      event.preventDefault();

      // FIXME: is this the right eval method?
      $scope.$evalAsync(() => {
        // TODO: error handling and reporting
        try {
          const spec = hjson.parse(this.vis.params.spec, { legacyRoot: false, keepWsc: true });
          this.vis.params.spec = stringify(spec, opts);
        } catch (err) {
          // FIXME!
          alert(err);
        }
      });
    }
  }

  return new VegaVisEditorController();
}
