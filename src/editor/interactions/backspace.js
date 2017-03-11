var utils = require('./utils');
var mergeDeletes = false;
var changing = false;
var isDeletion = /Backspace|Delete/;
var isOption = /Alt\+/;
var isBackspace = /Backspace/;

/**
 * Handle when a user preses the backspace key or delete key
 */

exports.enable = function(editor) {
  editor.on('shortcut', onShortcut);
  editor.on('change', onChange);
  editor.on('selectionchange', onSelectionChange);
};

exports.disable = function(editor) {
  editor.off('shortcut', onShortcut);
  editor.off('change', onChange);
  editor.off('selectionchange', onSelectionChange);
};

function onShortcut(event) {
  // Let text-entry handle Option+Deletes within the block
  if (isDeletion.test(event.shortcut)) {
    var sel = event.editor.selection;
    var back = isBackspace.test(event.shortcut);
    var del = !back;
    var end = sel.startBlock.text.length;

    if (sel.isCollapsed && !(back && sel.startOffset === 0) && !(del && sel.startOffset === end)) {
      return;
    }

    event.preventDefault();
    onDelete(event.editor, back ? -1 : 1);
  }
}

// If the selection changed and it wasn't the result of an delete, don't merge next deletes
function onSelectionChange(event) {
  if (!changing && mergeDeletes) {
    mergeDeletes = false;
  }
}

// If something changed that wasn't an delete, don't merge next deletes
function onChange(event) {
  if (!changing && mergeDeletes) {
    mergeDeletes = false;
  }
}


function onDelete(editor, direction) {
  changing = true;

  editor.startTransaction();

  var start = editor.selection.startBlock;
  var startBlockIndex = editor.selection.startBlockIndex;
  var startOffset = editor.selection.startOffset;
  var endIndex = start.text.length;

  if (editor.selection.isCollapsed) {
    var updated, merged;

    if (direction === -1 && startOffset === 0) {
      var previous = editor.blocks[startBlockIndex - 1];
      var enterMode = previous && previous.getEnterMode();
      if (previous && enterMode !== 'none' || enterMode === 'leaveOnly') {
        editor.setTransactionSelection('text', startBlockIndex - 1, previous.text.length);
        // merge with the previous block
        merged = utils.mergeBlocks(editor, previous, start, 0);
        editor.exec('deleteBlock', { index: startBlockIndex });
        if (merged) {
          editor.exec('updateBlock', { index: startBlockIndex - 1, block: merged });
        }
      }
    } else if (direction === 1 && startOffset === endIndex) {
      var next = editor.blocks[startBlockIndex + 1];
      var enterMode = next && next.getEnterMode();
      editor.setTransactionSelection('text', startBlockIndex, startOffset);
      if (next && enterMode !== 'none' || enterMode === 'leaveOnly') {
        // merge with the following block
        merged = utils.mergeBlocks(editor, start, next, 0);
        editor.exec('deleteBlock', { index: startBlockIndex + 1 });
        editor.exec('updateBlock', { index: startBlockIndex, block: merged });
      }
    } else {
      // No special cases, just make text less
      editor.setTransactionSelection('text', startBlockIndex, (direction < 0 ? startOffset + direction : startOffset));
      var endOffset = startOffset + direction;
      var first = Math.min(startOffset, endOffset), second = Math.max(startOffset, endOffset);
      updated = utils.deleteTextInBlock(editor, start, first, second);
      editor.exec('updateBlock', { index: startBlockIndex, block: updated });
      editor.commit();

      if (mergeDeletes) {
        // Remove the newly added command and merge it with the previous
        var undoStack = editor.history.undoStack;
        var command = undoStack.pop();
        var lastCommand = undoStack[undoStack.length - 1];
        var updateCommand = lastCommand.commands ? lastCommand.commands[lastCommand.commands.length - 1] : lastCommand;
        // Update the previous command
        updateCommand.block = command.block;
        lastCommand.selectionAfter = command.selectionAfter;
      }
    }

  } else {
    editor.setTransactionSelection('text', startBlockIndex, startOffset);
    utils.deleteSelection(editor, true);
  }

  editor.commit();

  mergeDeletes = true;
  changing = false;
}
