var utils = require('./utils');
var mapping = require('../mapping');
var newlineExp = /\r?\n/g;
var tagAliases = {
  b: 'strong',
  i: 'em'
};
var blockElements = {
  address: true,
  article: true,
  aside: true,
  blockquote: true,
  canvas: true,
  dd: true,
  div: true,
  dl: true,
  fieldset: true,
  figcaption: true,
  figure: true,
  form: true,
  h1: true,
  header: true,
  hgroup: true,
  hr: true,
  li: true,
  main: true,
  nav: true,
  noscript: true,
  ol: true,
  output: true,
  p: true,
  pre: true,
  section: true,
  table: true,
  tfoot: true,
  ul: true,
  video: true
};


/*

******* PASTED CONTENT NEEDS TO BE CLEANED **********
13. the user pastes multiple blocks into the editor
  * delete before.start + 1 to before.end
  * update before.start
  * insert before.start + 1 to after.end

If the paste contains blocks, replace the current block if it is empty, or merge the first block of the paste into it if
it is not empty

*/


exports.enable = function(editor) {
  editor.on('paste', onPaste);
};

exports.disable = function(editor) {
  editor.off('paste', onPaste);
};


/**
 * Handle paste
 */
function onPaste(event) {
  event.preventDefault();
  var editor = event.editor;
  var data = event.clipboardData;

  if (data.types.indexOf('text/html') !== -1) {
    pasteHTML(editor, data.getData('text/html'));
  } else if (data.types.indexOf('text/plain') !== -1) {
    pasteText(editor, data.getData('text/plain'));
  }
}


/**
 * Handles pasting text
 */
function pasteText(editor, text) {
  if (!text) return;
  var sel = editor.selection;
  var startIndex = sel.startBlockIndex;
  var start = sel.startBlock;
  var offset = sel.startOffset;

  editor.startTransaction();
  var updated = utils.deleteSelection(editor, true);
  var lines = text.split(newlineExp);

  // If it will not add blocks, just add text to the selected block
  if (editor.schema.locked || lines.length === 1) {
    if (updated.getEnterMode() === 'none') {
      text = text.replace(newlineExp, ' ');
    }
    editor.setTransactionSelection('text', startIndex, offset + text.length);
    updated.text = updated.text.slice(0, offset) + text + updated.text.slice(offset);
  } else {
    var trailing = updated.text.slice(offset);
    updated.text = updated.text.slice(0, offset) + lines[0];

    editor.setTransactionSelection('text', startIndex + lines.length - 1, lines[lines.length - 1].length);
    lines.slice(1).forEach(function(line, i) {
      var block = editor.schema.createDefaultBlock(line);
      if (i == lines.length - 1) {
        block.text += trailing;
      }
      editor.exec('insertBlock', { index: startIndex + i + 1, block: block });
    });
  }

  editor.commit();
}


/**
 * Handles pasting text
 *
 *
 * TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO
 * Merge the end block of the selected text
 *
 */
function pasteHTML(editor, html) {
  if (!html) return;

  editor.startTransaction();

  var blocks = getBlocks(editor, html);

  // Set selection
  var selectOffset = blocks[blocks.length - 1].text.length;
  if (blocks.length === 1) selectOffset += editor.selection.startOffset;
  editor.setTransactionSelection('text', editor.selection.startBlockIndex + blocks.length - 1, selectOffset);

  utils.mergeIntoSelection(editor, blocks);

  editor.commit();
}


function getBlocks(editor, html) {
  var schema = editor.schema;
  var blocks = [];
  var div = document.createElement('div');
  div.innerHTML = html;


  var walker = document.createTreeWalker(div, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  var node;
  var currentBlock;

  while ( (node = walker.nextNode()) ) {
    var name = node.nodeName.toLowerCase();

    if (name === 'style' || name === 'script') {
      walker.previousNode();
      node.parentNode.removeChild(node);
      continue;
    }

    // Text
    if (name === '#text') {
      var value = node.nodeValue;
      if (value.trim() === '') {
        if (value && currentBlock && currentBlock.text) {
          currentBlock.text += ' ';
        }
      } else {
        if (!currentBlock) {
          currentBlock = schema.createDefaultBlock();
          blocks.push(currentBlock);
        }
        var normalized = value.replace(/\s+/g, ' ');
        if (normalized[0] === ' ' && currentBlock.text.slice(-1) === ' ') {
          normalized = normalized.slice(1);
        }
        currentBlock.text += normalized;
      }
      continue;
    }

    // Newline
    if (name === 'br') {
      if (!currentBlock) {
        currentBlock = schema.createDefaultBlock();
        blocks.push(currentBlock);
      }
      currentBlock.text += '\n';
      continue;
    }

    // Markup
    var tag = tagAliases[name] || name;
    var MarkupType = schema.markups[tag];
    if (MarkupType) {
      if (!currentBlock) {
        currentBlock = schema.createDefaultBlock();
        blocks.push(currentBlock);
      }
      var startOffset = currentBlock.text.length;
      var endOffset = startOffset + getTextLength(node);
      if (startOffset !== endOffset) {
        var markup = new MarkupType(tag, startOffset, endOffset);
        currentBlock.markups.push(markup);
      }
      continue;
    }

    // Block
    var blockSelector = schema.getBlockSelector(node);
    var BlockType = blockSelector && schema.blocks[blockSelector];
    if (BlockType) {
      if (currentBlock) {
        currentBlock.text = currentBlock.text.replace(/\n$/, '');
        schema.normalizeMarkups(currentBlock);
      }
      currentBlock = new BlockType(blockSelector);
      blocks.push(currentBlock);
      continue;
    }

    // Add a new default block for unsupported block types, but only if the current one has text
    if (blockElements[tag] && (!currentBlock || currentBlock.text)) {
      if (currentBlock) {
        currentBlock.text = currentBlock.text.replace(/\n$/, '');
        schema.normalizeMarkups(currentBlock);
      }
      currentBlock = schema.createDefaultBlock();
      blocks.push(currentBlock);
    }
  }

  return blocks;
}


function getTextLength(markupElement) {
  var walker = document.createTreeWalker(markupElement, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  var node, length = 0;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      length += node.nodeValue.length;
    } else if (node.nodeName === 'BR') {
      length += 1;
    }
  }
  return length;
}
