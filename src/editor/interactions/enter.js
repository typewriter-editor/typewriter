var utils = require('./utils');

/**
 * Handle when a user preses the enter key
 *
 * 1. When at the end of a block, create a new block of the correct type or a BR
 * 2. When in the middle of a block, split it into two (same block type) if allowed
 * 3. When pressing Shift+Enter create a BR in the text if allowed
 *
 *
 * enterModes:
 *  * regular - moves onto a P next, allows splits, allows BRs, e.g. headers, blockquotes, paragraphs
 *  * continuation - moves onto same block unless empty then to a P, allows BRs, e.g. lists
 *  * contained - creates BRs, always followed by a block, e.g. preformatted
 *  * leaveOnly - no splits, no BRs, moves to P when at the end only, e.g. figcaption
 *  * none - no splits, no BRs, no new blocks
 */

exports.enable = function(editor) {
  editor.on('shortcut', onShortcut);
};

exports.disable = function(editor) {
  editor.off('shortcut', onShortcut);
};

function onShortcut(event) {
  if (event.shortcut.indexOf('Enter') !== -1) {
    event.preventDefault();

    if (event.shortcut === 'Enter') {
      onEnter(event.editor);
    } else if (event.shortcut === 'Shift+Enter') {
      onShiftEnter(event.editor);
    }
  }
}


function onEnter(editor) {
  var start = editor.selection.startBlock;
  var startBlockIndex = editor.selection.startBlockIndex;
  var startOffset = editor.selection.startOffset;
  var enterMode = start.getEnterMode();

  if (enterMode === 'contained') {
    return onShiftEnter(editor);
  } else if (enterMode === 'none') {
    return;
  }

  editor.startTransaction();
  editor.setTransactionSelection('text', startBlockIndex + 1, 0);

  if (editor.selection.isCollapsed) {
    var atEnd = startOffset === start.text.length;
    if (atEnd) {
      utils.insertAfter(editor, startBlockIndex)
    } else if (enterMode !== 'leaveOnly') {
      utils.splitBlock(editor, startBlockIndex, startOffset);
    }
  } else {
    utils.deleteSelection(editor);
    utils.insertAfter(editor, startBlockIndex);
  }

  editor.commit();
}


function onShiftEnter(editor) {
  var start = editor.selection.startBlock;
  var startBlockIndex = editor.selection.startBlockIndex;
  var startOffset = editor.selection.startOffset;
  if (start.getEnterMode() === 'none') {
    return;
  }

  editor.setTransactionSelection('text', startBlockIndex, startOffset + 1);

  if (editor.selection.isCollapsed) {
    var updated = start.clone();
    updated.text = updated.text.slice(0, startOffset) + '\n' + updated.text.slice(startOffset);
    editor.exec('updateBlock', { index: startBlockIndex, block: updated });
  } else {
    editor.startTransaction();
    var updated = utils.deleteSelection(editor, true);
    updated.text += '\n';
    editor.commit();
  }
}

