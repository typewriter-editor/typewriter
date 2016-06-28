/**
 * Dispatches selectionchanged (note the "d" at the end) events for browsers which do not support the "selectionchange"
 * event, as well as for browsers who do that don't dispatch the event when DOM modifications change the selection.
 * Since the order of events matters I am not naming this the same as "selectionchange" because it would then behave
 * differently on different browsers.
 */
var anchorNode = null, anchorOffset = 0, focusNode = null, focusOffset = 0;

function checkSelection() {
  var selection = window.getSelection();
  if (anchorNode !== selection.anchorNode ||
      anchorOffset !== selection.anchorOffset ||
      focusNode !== selection.focusNode ||
      focusOffset !== selection.focusOffset) {

    // The selection has changed during the last frame, name it with an "ed" to differentiate from "selectionchange" in
    // browsers that fire it
    var selectionEvent = new Event('selectionchanged');
    selectionEvent.selection = selection;
    document.dispatchEvent(selectionEvent);
    anchorNode = selection.anchorNode;
    anchorOffset = selection.anchorOffset;
    focusNode = selection.focusNode;
    focusOffset = selection.focusOffset;
  }

  requestAnimationFrame(checkSelection);
}

checkSelection();
