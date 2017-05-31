import chrome from 'ui/chrome';

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
  }

  return new VegaVisEditorController();
}
