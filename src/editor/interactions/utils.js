exports.insertAfter = insertAfter;
exports.deleteSelection = deleteSelection;
exports.mergeBlocks = mergeBlocks;
exports.splitBlock = splitBlock;
exports.deleteTextInBlock = deleteTextInBlock;



function insertAfter(editor, index) {
  var block = editor.blocks[index];
  var enterMode = block.getEnterMode();
  var defaultSelector = editor.schema.defaultBlock;
  var BlockClass = editor.schema.blocks[defaultSelector];
  var newBlock;

  if (enterMode === 'continuation') {
    if (block.text) {
      newBlock = new block.constructor(block.selector);
    } else {
      update = new BlockClass(defaultSelector);
      editor.setTransactionSelection('text', index, 0);
      editor.exec('updateBlock', { index: index, block: update });
    }
  } else if (enterMode !== 'none') {
    newBlock = new BlockClass(defaultSelector);
  }

  if (newBlock) {
    editor.exec('insertBlock', { index: index + 1, block: newBlock });
  }
}



function deleteSelection(editor, includeLastBlock) {
  var startBlockIndex = editor.selection.startBlockIndex;
  var endBlockIndex = editor.selection.endBlockIndex;
  var startBlock = editor.blocks[startBlockIndex];
  var endBlock = editor.blocks[endBlockIndex];
  var updatedStartBlock;

  if (startBlock === endBlock) {
    updatedStartBlock = deleteTextInBlock(editor, startBlock, editor.selection.startOffset, editor.selection.endOffset);
  } else {
    updatedStartBlock = deleteTextInBlock(editor, startBlock, editor.selection.startOffset);

    if (includeLastBlock) {
      editor.exec('deleteBlock', { index: endBlockIndex });
      var mergedBlock = mergeBlocks(editor, updatedStartBlock, endBlock, editor.selection.endOffset);
      if (mergedBlock) {
        updatedStartBlock = mergedBlock;
      }
    } else {
      var updatedEndBlock = deleteTextInBlock(editor, endBlock, 0, editor.selection.endOffset);
      // Since we've deleted the other blocks, the end block is now just 1 after the start block
      editor.exec('updateBlock', { index: startBlockIndex + 1, block: updatedEndBlock });
    }
  }

  // Delete all blocks but the start, and merge any text/markups after the selection in the end into the start
  // Go backwards, otherwise the indexes will be trying to delete the wrong blocks
  for (var i = endBlockIndex - 1; i > startBlockIndex; i--) {
    editor.exec('deleteBlock', { index: i });
  }

  editor.exec('updateBlock', { index: startBlockIndex, block: updatedStartBlock });

  return updatedStartBlock;
}


function splitBlock(editor, blockIndex, offset) {
  var block = editor.blocks[blockIndex];
  editor.exec('updateBlock', { index: blockIndex, block: deleteTextInBlock(editor, block, offset) });
  editor.exec('insertBlock', { index: blockIndex + 1, block: deleteTextInBlock(editor, block, 0, offset) });
}


function mergeBlocks(editor, target, source, fromOffset) {
  fromOffset = fromOffset || 0;
  var text = source.text.slice(fromOffset);
  if (!text) return false;

  var markups = [];
  var newStart = target.text.length;

  source.markups.forEach(function(markup) {
    if (markup.endOffset <= fromOffset) return;
    markup = markup.clone();

    // Move it to 0-based from the fromOffset
    markup.startOffset -= fromOffset;
    markup.endOffset -= fromOffset;

    // Shorten it if it went behind fromOffset
    if (markup.startOffset < 0) markup.startOffset = 0;

    // Move it out to the new position
    markup.startOffset += newStart;
    markup.endOffset += newStart;
  });

  var merged = target.clone();
  merged.text += text;
  merged.markups = merged.markups.concat(markups);
  editor.schema.normalizeMarkups(merged);

  return merged;
}


function deleteTextInBlock(editor, target, startOffset, endOffset) {
  if (startOffset === undefined) startOffset = 0;
  if (endOffset === undefined) endOffset = target.text.length;
  var updated = target.clone();
  updated.text = updated.text.slice(0, startOffset) + updated.text.slice(endOffset);

  updated.markups = updated.markups.filter(function(markup) {
    if (markup.endOffset <= startOffset || markup.startOffset >= endOffset) return;

    // If it was contained, remove it
    if (markup.startOffset >= startOffset && markup.endOffset <= endOffset) {
      return false;
    }

    if (markup.startOffset < endOffset) {
      markup.startOffset = endOffset;
    }

    if (markup.endOffset > startOffset) {
      markup.endOffset = startOffset;
    }
    return true;
  });

  editor.schema.normalizeMarkups(updated);
  return updated;
}

