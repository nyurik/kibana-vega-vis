import chrome from 'ui/chrome';
import hjson from 'hjson';
import compactStringify from 'json-stringify-pretty-compact';

export function createVegaVisEditorController(getAppState) {

  class VegaVisEditorController {
    link($scope, $el, $attr) {
      $scope.$watchMulti(
          ['=vegaEditor.vis.params'],
          () =>
            getAppState().save(true)
            // this.persistAppState()
      );
    }
    shouldShowSpyPanel() {
      return chrome.getVisible();
    }

    formatJson() {
      this._format(compactStringify);
    }

    formatHJson() {
      this._format(hjson.stringify);
    }

    _format(stringify) {
      // TODO: error handling and reporting
      try {
        const spec = hjson.parse(this.vis.params.spec);
        this.vis.params.spec = stringify(spec);
      } catch (err) {
        // FIXME!
        alert(err);
      }
    }
  }

  return new VegaVisEditorController();
}
