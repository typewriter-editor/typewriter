var mapping = require('../mapping');
var UpdateBlockCommand = require('../commands/update-block');
var inputMode;
var isDelete = false;
var changing = false;
var isDeletion = /Backspace|Delete/;

exports.enable = function(editor) {
  editor.on('input', onInput);
  editor.on('shortcut', onShortcut);
  editor.on('change', onChange);
  editor.on('selectionchange', onSelectionChange);
};

exports.disable = function(editor) {
  editor.off('input', onInput);
  editor.off('shortcut', onShortcut);
  editor.off('change', onChange);
  editor.off('selectionchange', onSelectionChange);
};

// If the selection changed and it wasn't the result of an input, don't merge next inputs
function onSelectionChange(event) {
  if (!changing && inputMode) {
    inputMode = null;
  }
}

// If something changed that wasn't an input, don't merge next inputs
function onChange(event) {
  if (!changing && inputMode) {
    inputMode = null;
  }
}

function onShortcut(event) {
  isDelete = isDeletion.test(event.shortcut);
  setTimeout(function() {
    isDelete = false;
  });
}


/*
Will only be called when the user is typing text. We handle delete/enter/paste in other interations.
The following actions need to be captured correctly by this method:

1. the user types one or more characters
  * update the before.start block

2. the user deletes or backspaces one or more characters
  * update the before.start block

3. the user selects some text in one block and types characters
  * update the before.start block

4. the user selects some text in one block and deletes it
  * update the before.start block

5. the user selects text across multiple blocks and types characters
  * update the before.start block
  * delete the before.start + 1 to before.end blocks (end becomes merged with start)

6. the user selects text across multiple blocks and deletes it
  * update the before.start block
  * delete the before.start + 1 to before.end blocks (end becomes merged with start)
*/
function onInput(event) {
  changing = true;

  var changeMode = isDelete ? 'delete' : 'input';
  var editor = event.editor;
  var element = editor.element;
  var selection = editor.selection;
  selection.update();
  var beforeRange = selection.lastRange;
  var afterRange = selection.range;

  // Delete the blocks that were selected except for the first one, update the first one
  editor.startTransaction();

  // Delete the blocks except the first
  for (var i = beforeRange.startBlockIndex + 1; i <= beforeRange.endBlockIndex; i++) {
    editor.exec('deleteBlock', { index: i });
  }

  // Update the first block with the change
  var updated = mapping.blockFromDOM(editor, editor.blockElements[afterRange.anchorBlockIndex]);
  editor.exec('updateBlock', { index: afterRange.anchorBlockIndex, block: updated });

  editor.commit();

  if (inputMode === changeMode) {
    // Remove the newly added command and merge it with the previous
    var undoStack = editor.history.undoStack;
    var command = undoStack.pop();
    var lastCommand = undoStack[undoStack.length - 1];
    var updateCommand = lastCommand.commands ? lastCommand.commands[lastCommand.commands.length - 1] : lastCommand;
    // Update the previous command
    updateCommand.block = command.block;
    lastCommand.selectionAfter = command.selectionAfter;
  }

  inputMode = changeMode;
  changing = false;
}
