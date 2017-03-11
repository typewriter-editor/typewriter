var Rect = require('./rect');

exports.get = function() {
  var selection = window.getSelection();
  if (!selection.rangeCount) {
    return;
  } else if (selection.isCollapsed) {
    var range = selection.getRangeAt(0);
    var rects = range.getClientRects();
    var rect = rects[rects.length - 1];
    if (!rect && range.startContainer.nodeType === Node.ELEMENT_NODE) {
      var child = range.startContainer.childNodes[range.startOffset];
      if (child && child.getBoundingClientRect) {
        rect = child.getBoundingClientRect();
      } else {
        return;
      }
    }
    // if (!rect) {
    //   var shadowCaret = document.createTextNode('|');
    //   range.insertNode(shadowCaret);
    //   rect = range.getBoundingClientRect();
    //   shadowCaret.parentNode.removeChild(shadowCaret);
    // }
    return new Rect(rect);
  } else {
    return new Rect(selection.getRangeAt(0).getBoundingClientRect());
  }
};
