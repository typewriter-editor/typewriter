exports.insertAfter = insertAfter;
exports.deleteSelection = deleteSelection;
exports.mergeIntoSelection = mergeIntoSelection;
exports.splitBlock = splitBlock;
exports.mergeBlocks = mergeBlocks;
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
      var updatedStartBlock = mergeBlocks(editor, updatedStartBlock, endBlock, editor.selection.endOffset);
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


function mergeIntoSelection(editor, blocks) {
  var selection = editor.selection;
  var startIndex = selection.startBlockIndex;
  var endIndex = selection.endBlockIndex;
  var startOffset = selection.startOffset;
  var endOffset = selection.endOffset;
  var start = selection.startBlock;
  var end = selection.endBlock;
  var i, updatedStart, updatedEnd, merged;
  var firstBlock = blocks[0];
  var lastBlock = blocks[blocks.length - 1];

  if (start.text) {
    updatedStart = deleteTextInBlock(editor, start, startOffset);
    updatedStart = mergeBlocks(editor, updatedStart, firstBlock);
  } else {
    updatedStart = firstBlock.clone();
  }

  updatedEnd = deleteTextInBlock(editor, end, 0, endOffset);

  if (blocks.length === 1) {
    updatedStart = mergeBlocks(editor, updatedStart, updatedEnd);
    editor.exec('updateBlock', { index: startIndex, block: updatedStart });
  } else {
    updatedEnd = mergeBlocks(editor, lastBlock, updatedEnd);
    editor.exec('updateBlock', { index: startIndex, block: updatedStart });
    if (start === end) {
      editor.exec('insertBlock', { index: startIndex + 1, block: updatedEnd });
    } else {
      editor.exec('updateBlock', { index: endIndex, block: updatedEnd });
    }
  }

  // Delete the fully-selected blocks
  for (i = endIndex - 1; i > startIndex; i--) {
    editor.exec('deleteBlock', { index: i });
  }

  // Insert the blocks other than the first/last
  for (i = 1; i < blocks.length - 1; i++) {
    editor.exec('insertBlock', { index: startIndex + i, block: blocks[i] });
  }
}


function splitBlock(editor, blockIndex, offset) {
  var block = editor.blocks[blockIndex];
  editor.exec('updateBlock', { index: blockIndex, block: deleteTextInBlock(editor, block, offset) });
  editor.exec('insertBlock', { index: blockIndex + 1, block: deleteTextInBlock(editor, block.clone(true), 0, offset) });
}


function mergeBlocks(editor, target, source, fromOffset) {
  fromOffset = fromOffset || 0;
  var text = source.text.slice(fromOffset);
  if (!text) return target.clone();

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
    markups.push(markup);
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
  var length = endOffset - startOffset;

  updated.markups = updated.markups.filter(function(markup) {

    if (markup.startOffset < startOffset) {
      markup.endOffset = Math.min(markup.endOffset, startOffset);
      return true;
    } else {

    }

    if (markup.endOffset > endOffset) {
      markup.endOffset -= length;
      markup.startOffset = Math.max(markup.startOffset, endOffset) - length;
      return true;
    } else {
      return false;
    }
  });

  editor.schema.normalizeMarkups(updated);
  return updated;
}

