module.exports = EditorSelection;
var Class = require('chip-utils/class');
var selectionRect = require('./selection-rect');
var EditorRange = require('./range');
var indexOf = Array.prototype.indexOf;

var lastRange = new EditorRange();
var currentRange = new EditorRange();
var skip = 0;
var paused = false;


function EditorSelection(editor) {
  this.editor = editor;
}


Class.extend(EditorSelection, {
  static: {
    get activeEditor() {
      return currentRange.editor;
    },

    skip: function(count) {
      skip += (count || 1);
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
    return this.editor === currentRange.editor ? this.editor.element.children[currentRange.anchorBlockIndex] : null;
  },

  /**
   * The selection's anchor index, the index into the text the selection starts at
   * @return {Number} The text index the selection starts at
   */
  get anchorIndex() {
    return this.editor === currentRange.editor ? currentRange.anchorIndex : -1;
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
    return this.editor === currentRange.editor ? this.editor.element.children[currentRange.focusBlockIndex] : null;
  },

  /**
   * The selection's focus index, the index into the text the selection ends at
   * @return {Number} The text index the selection ends at
   */
  get focusIndex() {
    return this.editor === currentRange.editor ? currentRange.focusIndex : -1;
  },

  /**
   * The selection's start block index. This is the first of anchor or focus as it appears in the document.
   * @return {Number} The index of the first block in the selection
   */
  get startBlockIndex() {
    return this.editor === currentRange.editor ? currentRange.startBlockIndex : -1;
  },

  /**
   * The selection's starting index. This is the first of anchor or focus as it appears in the document.
   * @return {Number} The index of the first block in the selection
   */
  get startIndex() {
    return this.editor === currentRange.editor ? currentRange.startIndex : -1;
  },

  /**
   * The selection's end block index. This is the last of anchor or focus as it appears in the document.
   * @return {Number} The index of the last block in the selection
   */
  get endBlockIndex() {
    return this.editor === currentRange.editor ? currentRange.endBlockIndex : -1;
  },

  /**
   * The selection's ending index. This is the first of anchor or focus as it appears in the document.
   * @return {Number} The index of the first block in the selection
   */
  get endIndex() {
    return this.editor === currentRange.editor ? currentRange.endIndex : -1;
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
  get collapsed() {
    return this.editor !== currentRange.editor || currentRange.collapsed;
  },

  /**
   * Returns a range for this selection
   * @return {EditorRange} The range of the selection in the given editor
   */
  get range() {
    return this.editor === currentRange.editor ? currentRange.clone() : null;
  },

  set range(editorRange) {
    if (editorRange.equals(getEditorRange())) {
      return;
    }
    editorRange.editor = this.editor;
    selectEditorRange(editorRange);
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
  if (skip) {
    skip--;
  } else if (!paused) {
    var previousRange = currentRange;
    currentRange = getEditorRange();

    if (previousRange.equals(currentRange)) {
      if (forceLastRangeUpdate) lastRange = previousRange;
      return;
    }

    lastRange = previousRange;
    // Dispatch one selection change event per editor that was affected
    if (lastRange.editor) {
      dispatchSelectionEvent(lastRange.editor, 'selectionchanged');
    }
    if (currentRange.editor && currentRange.editor !== lastRange.editor) {
      dispatchSelectionEvent(currentRange.editor, 'selectionchanged');
    }

    // Dispatch an editor selection change event once, with the target being either the current editor or the last
    // editor if there are no current editor's selected. This one bubbles
    dispatchSelectionEvent(currentRange.editor || lastRange.editor, 'editorselectionchanged', { bubbles: true });
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

  editorRange.editor = editor;
  var anchor = getBlock(anchorElement, editorElement);
  var focus = getBlock(focusElement, editorElement);
  editorRange.anchorBlockIndex = indexOf.call(editorElement.children, anchor);
  editorRange.focusBlockIndex = indexOf.call(editorElement.children, focus);

  editorRange.type = getType(selection);
  if (editorRange.type === 'media') {
    var element = getSelectedElement(selection);
    editorRange.anchorIndex = focusIndex = getElementIndex(anchor, element);
  } else {
    editorRange.anchorIndex = getTextIndex(anchor, selection.anchorNode, selection.anchorOffset);
    if (selection.isCollapsed) {
      editorRange.focusIndex = editorRange.anchorIndex;
    } else {
      editorRange.focusIndex = getTextIndex(focus, selection.focusNode, selection.focusOffset);
    }
  }

  return editorRange;
}


function selectEditorRange(editorRange) {
  if (!editorRange.editor) {
    return;
  }
  var element = editorRange.editor.element;
  var anchorBlockElement = element.children[editorRange.anchorBlockIndex];
  var focusBlockElement = element.children[editorRange.focusBlockIndex];
  var selection = window.getSelection();
  var range = document.createRange();

  if (editorRange.type === 'media') {
    // TODO support media selection
  } else {
    var anchor = getDOMIndex(anchorBlockElement, editorRange.anchorIndex);
    var focus = editorRange.collapsed ? anchor : getDOMIndex(focusBlockElement, editorRange.focusIndex);

    // Only change the selection if it is not correct
    if (selection.anchorNode !== anchor.node ||
      selection.focusNode !== focus.node ||
      selection.anchorOffset !== anchor.offset ||
      selection.focusOffset !== focus.offset)
    {
      range.setStart(anchor.node, anchor.offset);
      skip++; // removeAllRanges and addRange will both trigger the selectionchange event, we only ned to update once
      selection.removeAllRanges();
      selection.addRange(range);

      // Since native browser Ranges don't allow the "start" to be after the "end" we need to use the selection APIs to
      // move the focus so that it may go in reverse
      if (!editorRange.collapsed) {
        selection.extend(focus.node, focus.offset);
      }
    }
  }
}

function getElement(node) {
  return node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
}

function getSelectedElement(selection) {
  return selection.anchorNode.childNodes[selection.anchorOffset];
}

function getBlock(node, editorElement) {
  while (node && node.parentNode !== editorElement) {
    node = node.parentNode;
  }

  if (!node) throw new Error('Somehow the selection was inside an editor but not inside selection block');
  return node;
}

function getType(selection) {
  if (selection.isCollapsed && selection.anchorNode.nodeType === Node.ELEMENT_NODE) {
    var selectedNode = getSelectedElement(selection);
    if (selectedNode.nodeType === Node.ELEMENT_NODE && selectedNode.tagName !== 'BR') {
      return 'media';
    }
  }
  return 'text';
}

function getTextIndex(within, node, offset) {
  var range = document.createRange();
  range.setStartBefore(within);
  range.setEnd(node, offset);
  return range.toString().length;
}

function getElementIndex(within, element) {
  var likeElements = within.querySelectorAll(element.tagName);
  return indexOf.call(likeElements, element);
}


function getDOMIndex(within, index) {
  if (index === 0 && within.childNodes.length === 1 && within.firstChild.nodeName === 'BR') {
    return { node: within, offset: 0 };
  }

  var walker = document.createTreeWalker(within, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  var node, i = 0;
  while ( (node = walker.nextNode())) {
    var name = node.nodeName.toLowerCase();
    if (name === 'br') {
      i++; // newline
    } else if (name === '#text') {
      if (i + node.data.length >= index) {
        return { node: node, offset: index - i };
      } else {
        i += node.data.length;
      }
    }
  }
}

function dispatchSelectionEvent(editor, name, options) {
  var options = options || {};
  options.selection = editor.selection;
  return editor.dispatch(name, options);
}
