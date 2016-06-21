var platform = require('../../util/platform');

// Map the interactions to their keyboard shortcut
var shortcuts = {
  Enter: onEnter,
  Del: onDelete,
  Backspace: onBackspace,
};

// Undo/Redo
if (platform.isMac) {
  shortcuts['Cmd+Z'] = undo;
  shortcuts['Cmd+Shift+Z'] = redo;
} else {
  shortcuts['Ctrl+Z'] = undo;
  shortcuts['Ctrl+Y'] = redo;
}


exports.register = function(shortcut, method) {
  shortcuts[shortcut] = method;
};


exports.enable = function(editor) {
  editor.on('shortcut', onShortcut);
};


exports.disable = function(editor) {
  editor.off('shortcut', onShortcut);
};


function onShortcut(event) {
  var shortcut = event.shortcut;
  if (shortcuts.hasOwnProperty(shortcut)) {
    if (shortcuts[shortcut](event.editor) === false) {
      event.originalEvent.preventDefault();
    }
  }
}


function undo(editor) {
  editor.history.undo();
  return false;
}


function redo(editor) {
  editor.history.redo();
  return false;
}


function onEnter(editor) {
  return true;
}


function onDelete(editor) {
  if (editor.selection.isCollapsed && editor.selection.anchorIndex === editor.selection.anchorBlock.text.length) {
    // Handle deleting the block
    // return true;
  }
}


function onBackspace(editor) {
  if (editor.selection.isCollapsed && editor.selection.anchorBlockIndex === 0 && editor.selection.anchorIndex === 0) {
    return true;
  }
}
