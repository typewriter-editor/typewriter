var mapping = require('../mapping');
var UpdateBlockCommand = require('../commands/update-block');
var currentInputMode;
var inputMode;
var ignoreSelectionChanges = false;

exports.enable = function(editor) {
  editor.on('shortcut', onShortcut);
  editor.on('input', onInput);
  editor.on('selectionchange', onSelectionChange);
};

exports.disable = function(editor) {
  editor.off('shortcut', onShortcut);
  editor.off('input', onInput);
  editor.off('selectionchange', onSelectionChange);
};


// Set the type of input being done, delete or input
function onShortcut(event) {
  var shortcut = event.shortcut;
  var selection = event.editor.selection;
  var atBeginning = selection.collapsed && selection.anchorBlockIndex === 0 && selection.anchorIndex === 0;
  if (shortcut === 'Backspace' && atBeginning) {
    event.originalEvent.preventDefault();
    return;
  }

  if (shortcut === 'Backspace' || shortcut === 'Del') {
    inputMode = 'delete';
  } else {
    inputMode = 'input';
  }
  setTimeout(function() {
    inputMode = null;
  });
}

// If the selection changed and it wasn't the result of an input/delete, finish the current command
function onSelectionChange(event) {
  if (!ignoreSelectionChanges) currentInputMode = null;
}

/*
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

7. the user hits Enter at the end of a block
  * insert a block at after.start

8. the user hits Enter in the middle of a block, creating two blocks
  * update the before.start block
  * insert a block at after.start

9. the user selects text across multiple blocks and hits enter
  * update the before.start block
  * delete the before.start + 1 to before.end blocks (end becomes merged with start)
  * insert a block at after.start

10. the user hits delete and deletes the following empty block
  * delete the block at before.start + 1

11. the user hits delete and merges the next block and the current block
  * update the before.start block
  * delete the block at before.start + 1

12. the user selects a whole block and hits delete
  * update the block (text will be empty) if just the contents are selected

12b. the user selects a whole block and hits delete (if the selection starts at the end of the previous block)
  * delete the block at before.start + 1

******* PASTED CONTENT NEEDS TO BE CLEANED **********
13. the user pastes multiple blocks into the editor
  * delete before.start + 1 to before.end
  * update before.start
  * insert before.start + 1 to after.end

14. the user hits Enter at the start of a block, creating a new block before
  * insert a block at before.start or after.start - 1

15. the user hits Backspace at the start of an empty block
  * delete the block at before.start or after.start + 1

*/

function onInput(event) {
  ignoreSelectionChanges = true;
  setTimeout(function() {
    ignoreSelectionChanges = false;
  });

  var editor = event.editor;
  var element = editor.element;
  var selection = editor.selection;
  selection.update();
  var beforeRange = selection.lastRange;
  var afterRange = selection.range;
  if (!beforeRange || !afterRange) {
    return;
  }

  var firstChangedBlockIndex = Math.min(beforeRange.startBlockIndex, afterRange.startBlockIndex);
  var deleteIndexes = [ firstChangedBlockIndex + 1, beforeRange.endBlockIndex + 1 ];

  // Use before range for the start and after range for the end. When hitting Enter in the middle of a block you will
  // be updating the previous block and creating a new block.
  var changedBlocks = mapping.blocksFromDOM(editor.schema,
                                            editor.element,
                                            firstChangedBlockIndex,
                                            afterRange.endBlockIndex + 1);

  // Delete the blocks that were selected except for the first one, update the first one, and finally add any that were
  // added in a paste operation or with a newline
  editor.startTransaction();

  // Update the first block with the change
  if (!changedBlocks[0].equals(editor.blocks[firstChangedBlockIndex])) {
    editor.exec('updateBlock', { index: firstChangedBlockIndex, block: changedBlocks[0] });
  }

  // Delete selected blocks except the first
  if (firstChangedBlockIndex < beforeRange.endBlockIndex ) {
    editor.blocks
      .slice(firstChangedBlockIndex + 1, beforeRange.endBlockIndex + 1)
      .reverse()
      .forEach(function(block, index) {
        editor.exec('deleteBlock', { index: beforeRange.endBlockIndex - index });
      });
  }

  // If DELETE was pressed at the end of the block, we need to delete the following block
  if (beforeRange.collapsed &&
    beforeRange.startBlockIndex === afterRange.startBlockIndex &&
    editor.element.children.length < editor.blocks.length) {
    editor.exec('deleteBlock', { index: beforeRange.startBlockIndex + 1 });
  }

  // Add any blocks that were added e.g. on a newline
  changedBlocks.slice(1).forEach(function(block, index) {
    editor.exec('insertBlock', { index: firstChangedBlockIndex + index + 1, block: block });
  });

  // This command could be any one of the above or a composite command if multiple commands were executed
  var command = editor.commit();

  // If it is an updateBlock command, consider merging it with the previous updateBlock command
  if (command instanceof UpdateBlockCommand) {
    // Only merge if they are of the same type (both delete or both input)
    if (currentInputMode && currentInputMode === inputMode) {
      // Remove the newly added command
      var undoStack = editor.history.undoStack;
      undoStack.pop();
      var lastCommand = undoStack[undoStack.length - 1];
      // Update the previous command
      lastCommand.block = command.block;
      lastCommand.selectionAfter = command.selectionAfter;
    } else {
      currentInputMode = inputMode;
    }
  } else {
    currentInputMode = null;
  }
}
