var selectionRect = require('./selection-rect');
// Store the current block the selection is in so we can reset it
var editableElement = null;
var cursor = document.createElement('div');
cursor.id = 'cursor';
cursor.className = 'blink';


document.addEventListener('selectionchanged', updateSelection);
document.addEventListener('focusout', function() {
  if (document.activeElement !== editableElement) cleanupLastCursor();
});


function cleanupLastCursor() {
  if (editableElement) {
    editableElement.style.color = '';
    editableElement.style.textShadow = '';
    editableElement.removeEventListener('resize', updateSelection);
    hide();
  }
}

function updateSelection() {
  cleanupLastCursor();

  var selection = window.getSelection();
  var selectionElement = selection.anchorNode;
  if (!selectionElement) return;
  if (selectionElement.nodeName === '#text') {
    selectionElement = selectionElement.parentNode;
  }
  editableElement = selectionElement.closest('[contenteditable="true"]');

  if (!selection.isCollapsed || !editableElement) {
    editableElement = null;
    cursor.remove();
    return;
  }

  editableElement.addEventListener('resize', updateSelection);

  if (cursor.parentNode !== editableElement.parentNode) {
    editableElement.parentNode.insertBefore(cursor, editableElement.nextSibling);
  }

  positionCursor();
  var color = window.getComputedStyle(editableElement).color;
  editableElement.style.color = 'transparent';
  editableElement.style.textShadow = '0px 0px 0px ' + color;
  cursor.style.backgroundColor = color;
  show();
}

function positionCursor() {
  if (!editableElement) return;
  var rect = selectionRect.get();
  var offsetParent = editableElement.offsetParent || document.documentElement;
  var containerRect = offsetParent.getBoundingClientRect();
  cursor.style.height = rect.height + 'px';
  cursor.style.left = (rect.left - containerRect.left) + 'px';
  cursor.style.top = (rect.top - containerRect.top) + 'px';
}

function show() {
  cursor.style.display = '';
}

function hide() {
  // If using display:none there is a visible jump after showing again
  cursor.style.display = 'none';
}

var pendingResize = false;
window.addEventListener('focus', function() {
  if (editableElement) show();
});
window.addEventListener('blur', hide);
window.addEventListener('resize', function() {
  if (!pendingResize) {
    pendingResize = true;
    requestAnimationFrame(function() {
      pendingResize = false;
      positionCursor();
    });
  }
});
