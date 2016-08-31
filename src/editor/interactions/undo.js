var platform = require('../platform');
var shortcuts = {};

// Undo/Redo
if (platform.isMac) {
  shortcuts['Cmd+Z'] = undo;
  shortcuts['Cmd+Shift+Z'] = redo;
} else {
  shortcuts['Ctrl+Z'] = undo;
  shortcuts['Ctrl+Y'] = redo;
}

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
