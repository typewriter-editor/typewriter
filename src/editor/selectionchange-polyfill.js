/**
 * Dispatches selectionchange events for browsers which do not support the event, as well as for browsers who do that
 * don't dispatch the event when DOM modifications change the selection.
 */
var anchorNode = null, anchorOffset = 0, focusNode = null, focusOffset = 0;

function checkSelection() {
  var selection = window.getSelection();
  if (anchorNode !== selection.anchorNode ||
      anchorOffset !== selection.anchorOffset ||
      focusNode !== selection.focusNode ||
      focusOffset !== selection.focusOffset) {

    var selectionEvent = new Event('selectionchange');
    selectionEvent.selection = selection;
    document.dispatchEvent(selectionEvent);
    anchorNode = selection.anchorNode;
    anchorOffset = selection.anchorOffset;
    focusNode = selection.focusNode;
    focusOffset = selection.focusOffset;
  }

  requestAnimationFrame(checkSelection);
}

document.addEventListener('selectionchange', function() {
  // When dispatched by the browser the animationFrame will no-op
  var selection = window.getSelection();
  anchorNode = selection.anchorNode;
  anchorOffset = selection.anchorOffset;
  focusNode = selection.focusNode;
  focusOffset = selection.focusOffset;
});

checkSelection();
