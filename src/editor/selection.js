module.exports = EditorSelection;
var Class = require('chip-utils/class');
var selectionRect = require('./selection-rect');
var EditorRange = require('./range');
var indexOf = Array.prototype.indexOf;

var lastRange = new EditorRange();
var currentRange = new EditorRange();
var paused = false;


function EditorSelection(editor) {
  this.editor = editor;
}


Class.extend(EditorSelection, {
  static: {
    get activeEditor() {
      return currentRange.editor;
    },

    pause: function() {
      paused = true;
    },

    resume: function() {
      paused = false;
    },

    get range() {
      return getEditorRange();
    },

    set range(editorRange) {
      selectEditorRange(editorRange);
    }
  },

  /**
   * Selects the range provided
   * @param {String} type Selection type, text or media
   * @param {Number} anchorBlockIndex Anchor block of the selection
   * @param {Number} anchorOffset Anchor offset of the selection
   * @param {Number} focusBlockIndex [Optional] Focus block of the selection
   * @param {Number} focusOffset [Optional] Focus offset of the selection
   */
  select: function(type, anchorBlockIndex, anchorOffset, focusBlockIndex, focusOffset) {
    if (focusBlockIndex === undefined) {
      focusBlockIndex = anchorBlockIndex;
      focusOffset = anchorOffset;
    }
    this.range = new EditorRange(this.editor, type, anchorBlockIndex, anchorOffset, focusBlockIndex, focusOffset);
  },

  /**
   * The type of this selection, either text, media, or none
   * @return {String} One of 'text', 'media', or 'none'
   */
  get type() {
    return this.editor === currentRange.editor ? currentRange.type : 'none';
  },

  /**
   * The selection's anchor block's index, the block the selection starts in
   * @return {Number} The index of the block the selection starts in
   */
  get anchorBlockIndex() {
    return this.editor === currentRange.editor ? currentRange.anchorBlockIndex : -1;
  },

  /**
   * The selection's anchor block, the block the selection starts in
   * @return {Block} The block the selection starts in
   */
  get anchorBlock() {
    return this.editor === currentRange.editor ? this.editor.blocks[currentRange.anchorBlockIndex] : null;
  },

  /**
   * The selection's anchor block element, the element the selection starts in
   * @return {HTMLElement} The element the selection starts in
   */
  get anchorBlockElement() {
    return this.editor === currentRange.editor ? this.editor.blockElements[currentRange.anchorBlockIndex] : null;
  },

  /**
   * The selection's anchor offset, the index into the text the selection starts at
   * @return {Number} The text offset the selection starts at
   */
  get anchorOffset() {
    return this.editor === currentRange.editor ? currentRange.anchorOffset : -1;
  },

  /**
   * The selection's focus block's index, the block the selection ends in
   * @return {Number} The index of the block the selection ends in
   */
  get focusBlockIndex() {
    return this.editor === currentRange.editor ? currentRange.focusBlockIndex : -1;
  },

  /**
   * The selection's focus block, the block the selection ends in
   * @return {Block} The block the selection ends in
   */
  get focusBlock() {
    return this.editor === currentRange.editor ? this.editor.blocks[currentRange.focusBlockIndex] : null;
  },

  /**
   * The selection's anchor block element, the element the selection ends in
   * @return {HTMLElement} The element the selection ends in
   */
  get focusBlockElement() {
    return this.editor === currentRange.editor ? this.editor.blockElements[currentRange.focusBlockIndex] : null;
  },

  /**
   * The selection's focus offset, the index into the text the selection ends at
   * @return {Number} The text offset the selection ends at
   */
  get focusOffset() {
    return this.editor === currentRange.editor ? currentRange.focusOffset : -1;
  },

  /**
   * The selection's start block index. This is the first of anchor or focus as it appears in the document.
   * @return {Number} The index of the first block in the selection
   */
  get startBlockIndex() {
    return this.editor === currentRange.editor ? currentRange.startBlockIndex : -1;
  },

  /**
   * The selection's start block. This is the first of anchor or focus as it appears in the document.
   * @return {Number} The first block in the selection
   */
  get startBlock() {
    return this.editor === currentRange.editor ? this.editor.blocks[currentRange.startBlockIndex] : null;
  },

  /**
   * The selection's start block element, the element the selection starts in
   * @return {HTMLElement} The element the selection starts in
   */
  get startBlockElement() {
    return this.editor === currentRange.editor ? this.editor.blockElements[currentRange.startBlockIndex] : null;
  },

  /**
   * The selection's starting offset. This is the first of anchor or focus as it appears in the document.
   * @return {Number} The offset of the first block in the selection
   */
  get startOffset() {
    return this.editor === currentRange.editor ? currentRange.startOffset : -1;
  },

  /**
   * The selection's end block index. This is the last of anchor or focus as it appears in the document.
   * @return {Number} The index of the last block in the selection
   */
  get endBlockIndex() {
    return this.editor === currentRange.editor ? currentRange.endBlockIndex : -1;
  },

  /**
   * The selection's end block. This is the last of anchor or focus as it appears in the document.
   * @return {Number} The last block in the selection
   */
  get endBlock() {
    return this.editor === currentRange.editor ? this.editor.blocks[currentRange.endBlockIndex] : null;
  },

  /**
   * The selection's end block element, the element the selection ends in
   * @return {HTMLElement} The element the selection ends in
   */
  get endBlockElement() {
    return this.editor === currentRange.editor ? this.editor.blockElements[currentRange.endBlockIndex] : null;
  },

  /**
   * The selection's ending offset. This is the first of anchor or focus as it appears in the document.
   * @return {Number} The offset of the first block in the selection
   */
  get endOffset() {
    return this.editor === currentRange.editor ? currentRange.endOffset : -1;
  },

  get selectedBlocks() {
    return this.editor === currentRange.editor ?
      this.editor.blocks.slice(currentRange.startBlockIndex, currentRange.endBlockIndex + 1) :
      [];
  },

  /**
   * The Rect of the current caret position
   * @return {Rect} Contains top, left, right, bottom, width, and height
   */
  get rect() {
    return this.editor === currentRange.editor ? selectionRect.get() : null;
  },

  /**
   * Indicates if the selection is a single point rather than a range of items
   * @return {Boolean} Whether the selection is collapsed
   */
  get isCollapsed() {
    return this.editor !== currentRange.editor || currentRange.isCollapsed;
  },

  /**
   * Whether or not the selection is at the very beginning of the editor (and collapsed)
   * @return {Boolean}
   */
  get atBeginning() {
    if (this.editor !== currentRange.editor) return false;
    return currentRange.isCollapsed && currentRange.anchorBlockIndex === 0 && currentRange.anchorOffset === 0;
  },

  /**
   * Whether or not the selection is at the very end of the editor (and collapsed)
   * @return {Boolean}
   */
  get atEnd() {
    if (this.editor !== currentRange.editor) return false;
    var lastIndex = this.editor.blocks.length - 1;
    var textLength = this.editor.blocks[lastIndex].text.length;
    return currentRange.isCollapsed &&
           currentRange.anchorBlockIndex === lastIndex &&
           currentRange.anchorOffset === textLength;
  },

  /**
   * Returns a range for this selection
   * @return {EditorRange} The range of the selection in the given editor
   */
  get range() {
    return this.editor === currentRange.editor ? currentRange.clone() : null;
  },

  set range(editorRange) {
    var actualRange = getEditorRange();
    if (!editorRange || editorRange.equals(actualRange)) {
      if (!currentRange.equals(actualRange)) {
        currentRange = actualRange;
      }
      return;
    }
    editorRange.editor = this.editor;
    selectEditorRange(editorRange);
  },

  getRange: function() {
    return getEditorRange();
  },

  /**
   * Returns the last range for this selection before the current selection
   * @return {EditorRange} The last range of the selection in the given editor
   */
  get lastRange() {
    return this.editor === lastRange.editor ? lastRange.clone() : null;
  },

  /**
   * Updates the selection immediately to match the browser selection
   */
  update: function() {
    updateSelectionRange(true);
  },

  /**
   * Convert the selection into an object for storage
   * @return {Object} A plain JavaScript object with all the information for the current selection
   */
  toJSON: function() {
    return this.toRange();
  }
});


// Update the selections whenever selection changes
document.addEventListener('selectionchanged', updateSelectionRange);

function updateSelectionRange(forceLastRangeUpdate) {
  if (!paused) {
    var previousRange = currentRange;
    currentRange = getEditorRange();

    if (previousRange && previousRange.anchorBlockIndex !== -1 && previousRange.anchorBlockIndex === previousRange.focusBlockIndex && previousRange.editor.element) {
      var prevBlock = previousRange.editor.blockElements[previousRange.anchorBlockIndex];
      prevBlock && prevBlock.classList.remove('selected');
    }

    if (currentRange && currentRange.anchorBlockIndex !== -1 && currentRange.anchorBlockIndex === currentRange.focusBlockIndex && currentRange.editor.element) {
      currentRange.editor.blockElements[currentRange.anchorBlockIndex].classList.add('selected');
    }

    if (previousRange.equals(currentRange)) {
      if (forceLastRangeUpdate) lastRange = previousRange;
      return;
    }

    lastRange = previousRange;
    // Dispatch one selection change event per editor that was affected
    if (lastRange.editor) {
      dispatchSelectionEvent(lastRange.editor, 'selectionchange');
    }
    if (currentRange.editor && currentRange.editor !== lastRange.editor) {
      dispatchSelectionEvent(currentRange.editor, 'selectionchange');
    }

    // Dispatch an editor selection change event once, with the target being either the current editor or the last
    // editor if there are no current editor's selected. This one bubbles
    dispatchSelectionEvent(currentRange.editor || lastRange.editor, 'editorselectionchange', { bubbles: true });
  }
}

function getEditorRange() {
  var selection = window.getSelection();
  var editorRange = new EditorRange();
  if (!selection.anchorNode || !selection.rangeCount) {
    return editorRange;
  }

  var anchorElement = getElement(selection.anchorNode);
  var focusElement = getElement(selection.focusNode);
  var editorElement = anchorElement.closest('.editable');
  var editor = editorElement && editorElement.editor;

  if (!editor || anchorElement === editorElement) {
    return editorRange;
  }

  var blockElements = editor.blockElements;
  editorRange.editor = editor;
  var anchor = getBlock(anchorElement, editor);
  var focus = getBlock(focusElement, editor);
  if (!anchor || !focus) {
    return editorRange;
  }
  editorRange.anchorBlockIndex = indexOf.call(blockElements, anchor);
  editorRange.focusBlockIndex = indexOf.call(blockElements, focus);

  editorRange.type = getType(selection);
  if (editorRange.type === 'none') {
    editorRange.anchorBlockIndex = editorRange.focusBlockIndex = -1;
  } else if (editorRange.type === 'media') {
    var element = getSelectedElement(selection);
    editorRange.anchorOffset = focusOffset = getElementIndex(anchor, element);
  } else {
    editorRange.anchorOffset = getTextOffset(anchor, selection.anchorNode, selection.anchorOffset);
    if (selection.isCollapsed) {
      editorRange.focusOffset = editorRange.anchorOffset;
    } else {
      editorRange.focusOffset = getTextOffset(focus, selection.focusNode, selection.focusOffset);
    }
  }

  if (editorRange.type === 'text' && editorRange.anchorBlockIndex !== editorRange.focusBlockIndex && editorRange.endOffset === 0) {
    var which = editorRange.anchorBlockIndex === editorRange.endBlockIndex ? 'anchor' : 'focus';
    var index = --editorRange[which + 'BlockIndex'];
    editorRange[which + 'Offset'] = editor.blocks[index].text.length;
    selectEditorRange(editorRange);
  }

  return editorRange;
}


function selectEditorRange(editorRange) {
  if (!editorRange.editor) {
    return;
  }
  var blockElements = editorRange.editor.blockElements;
  var anchorBlockElement = blockElements[editorRange.anchorBlockIndex];
  var focusBlockElement = blockElements[editorRange.focusBlockIndex];
  var selection = window.getSelection();
  var range = document.createRange();

  if (editorRange.type === 'media') {
    // TODO support media selection
  } else {
    var anchor = getDOMOffset(anchorBlockElement, editorRange.anchorOffset);
    var focus = editorRange.isCollapsed ? anchor : getDOMOffset(focusBlockElement, editorRange.focusOffset);

    // Only change the selection if it is not correct
    if (selection.anchorNode !== anchor.node ||
      selection.focusNode !== focus.node ||
      selection.anchorOffset !== anchor.offset ||
      selection.focusOffset !== focus.offset)
    {
      range.setStart(anchor.node, anchor.offset);
      selection.removeAllRanges();
      selection.addRange(range);

      // Since native browser Ranges don't allow the "start" to be after the "end" we need to use the selection APIs to
      // move the focus so that it may go in reverse
      if (!editorRange.isCollapsed) {
        selection.extend(focus.node, focus.offset);
      }
    }
  }
}

function getElement(node) {
  return node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
}

function getSelectedElement(selection) {
  return selection.anchorNode.childNodes[selection.anchorOffset] || selection.anchorNode.childNodes[selection.anchorOffset - 1];
}

function getBlock(node, editor) {
  return node.closest(editor.schema.blocksSelector);
  while (node && node.parentNode !== editorElement) {
    node = node.parentNode;
  }

  if (!node) throw new Error('Somehow the selection was inside an editor but not inside selection block');
  return node;
}

function getType(selection) {
  if (selection.isCollapsed && selection.anchorNode.nodeType === Node.ELEMENT_NODE) {
    var selectedNode = getSelectedElement(selection);
    if (!selectedNode) {
      return 'none';
    } else if (selectedNode.nodeType === Node.ELEMENT_NODE && selectedNode.tagName !== 'BR') {
      return 'media';
    }
  }
  return 'text';
}

// Given a text node and local offset, get the text offset within the block element
function getTextOffset(within, selectionNode, offset) {
  if (within === selectionNode) {
    if (offset === 0) return 0;
    selectionNode = within.childNodes[offset];
    offset = 0;
    // This happens when there is a single BR child and no text nodes
    // return offset;
  }

  var walker = getTextWalker(within);
  var node, i = 0;
  while ( (node = walker.nextNode())) {
    if (node === selectionNode) {
      i += offset;
      break;
    } else if (node.nodeName === 'BR') {
      i++;
    } else {
      i += node.nodeValue.length;
    }
  }
  return i;
}

function getElementIndex(within, element) {
  var likeElements = within.querySelectorAll(element.tagName);
  return indexOf.call(likeElements, element);
}


// Given the block element and text offset within it, find the text node + local offset of that node for selecting
function getDOMOffset(within, index) {
  if (index === 0 && within.firstChild.nodeName === 'BR') {
    return { node: within, offset: 0 };
  }

  var walker = getTextWalker(within);
  var node, i = 0;
  while ( (node = walker.nextNode())) {
    if (node.nodeName === 'BR') {
      i++; // newline
      if (i === index) {
        return { node: node.parentNode, offset: indexOf.call(node.parentNode.childNodes, node) + 1 };
      }
    } else {
      if (i + node.nodeValue.length >= index) {
        return { node: node, offset: index - i };
      } else {
        i += node.nodeValue.length;
      }
    }
  }
}

function getTextWalker(root) {
  return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, function(node) {
    if (node.nodeName === '#text' || node.nodeName === 'BR') {
      return NodeFilter.FILTER_ACCEPT;
    } else {
      return NodeFilter.FILTER_SKIP;
    }
  });
}

function dispatchSelectionEvent(editor, name, options) {
  var options = options || {};
  options.selection = editor.selection;
  return editor.dispatch(name, options);
}
