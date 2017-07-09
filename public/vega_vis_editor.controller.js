import chrome from 'ui/chrome';
import hjson from 'hjson';
import compactStringify from 'json-stringify-pretty-compact';

export function createVegaVisEditorController(getAppState) {

  class VegaVisEditorController {
    link($scope, /*$el, $attr*/) {
      $scope.$watchMulti(
        ['=vegaEditor.vis.params'],
        () => getAppState().save(true)
        // this.persistAppState()
      );
    }
    shouldShowSpyPanel() {
      return chrome.getVisible();
    }

    formatJson() {
      this._format(compactStringify, { maxLength: 65 });
    }

    formatHJson() {
      this._format(hjson.stringify);
    }

    _format(stringify, opts) {
      // TODO: error handling and reporting
      try {
        const spec = hjson.parse(this.vis.params.spec);
        this.vis.params.spec = stringify(spec, opts);
      } catch (err) {
        // FIXME!
        alert(err);
      }
    }
  }

  return new VegaVisEditorController();
}
