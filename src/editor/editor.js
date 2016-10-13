module.exports = Editor;
require('es6-object-assign').polyfill();
var Class = require('chip-utils/class');
var shortcuts = require('shortcut-string');
var History = require('./history');
var EditorSelection = require('./selection');
var EditorRange = require('./range');
var defaultSchema = require('./schema/default');
var mapping = require('./mapping');
var menu = require('./menu');
var Block = require('./blocks/block');
var interactions = require('./interactions');
var slice = Array.prototype.slice;
var modifiedEvents = [ 'input', 'focus', 'blur', 'focusin', 'focusout', 'paste' ];
require('./selectionchange-polyfill');
require('./arrayfind-polyfill');


/**
 * Creates a rich text editor within the element provided.
 * @param {HTMLElement} element An HTML element which will be used as the container for the editable content
 * @param {Object} options A hash of options for the editor
 */
function Editor(element, options) {
  this.element = element;
  this.options = options || {};
  this.schema = this.options.schema || defaultSchema.get();
  this.history = new History();
  this.selection = new EditorSelection(this);
  this.blocks = this.schema.getInitial();
  this.onKeyDown = this.onKeyDown.bind(this);
  this.enabled = true;
  this.render();
}


Class.extend(Editor, {
  static: {
    menu: menu,

    /**
     * The currently active editor, or null if there is none. The active editor is the one which has focus.
     * @type {Editor}
     */
    get active() {
      return EditorSelection.activeEditor;
    }
  },

  menu: menu,


  /**
   * Whether an editor is enabled. By default it is enabled, but if disabled you cannot type or edit within it.
   * @type {Boolean}
   */
  get enabled() {
    return this.element.contentEditable;
  },

  set enabled(value) {
    if (value === this.enabled) return;
    if (value) {
      this.element.setAttribute('spellcheck', 'false');
      this.element.classList.add('editable');
      this.on('keydown', this.onKeyDown);
      this.on('input', this.onInput);
      this.on('focus', this.onFocus);
      this.on('blur', this.onBlur);
      modifiedEvents.forEach(addEditorToEvent.bind(null, this));
      this.element.editor = this;
      Object.keys(interactions).forEach(function(key) {
        interactions[key].enable(this);
      }, this);
    } else {
      this.element.removeAttribute('spellcheck');
      this.element.classList.remove('editable');
      this.off('keydown', this.onKeyDown);
      this.off('input', this.onInput);
      this.off('focus', this.onFocus);
      this.off('blur', this.onBlur);
      modifiedEvents.forEach(removeEditorToEvent.bind(null, this));
      this.element.editor = null;
      Object.keys(interactions).forEach(function(key) {
        interactions[key].disable(this);
      }, this);
    }
    this.element.contentEditable = value;
  },


  /**
   * The HTML contents of the editor. Internally the editor contains blocks of content, but this gets or sets the
   * current HTML representation of that content.
   * @type {String}
   */
  get html() {
    var content = this.element.cloneNode(true);
    slice.call(content.querySelectorAll(this.schema.blocksSelector)).forEach(function(blockElement) {
      blockElement.removeAttribute('name');
      blockElement.removeAttribute('placeholder');
      blockElement.classList.remove('empty', 'selected');
      if (blockElement.getAttribute('class') === '') {
        blockElement.removeAttribute('class');
      }
    });
    return content.innerHTML;
  },

  set html(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    this.blocks = mapping.blocksFromDOM(this, div);
    this.render();
  },


  /**
   * The HTML contents of the editor. Internally the editor contains blocks of content, but this gets or sets the
   * current HTML representation of that content.
   * TODO allow blocks to parse/output text so lists can work with "1. List item" and "* item" correctly
   * @type {String}
   */
  get text() {
    var count = 0;
    var tagExp = /^[a-z1-6]+/;
    var headerExp = /^h(\d)$/;

    return this.blocks.map(function(block, i, blocks) {
      var tag = block.selector.match(tagExp)[0];
      var prev = blocks[i - 1];
      var text = block.text;
      var match;

      if (tag === 'ol') {
        text = ++count + '. ' + text;
      } else {
        count = 0;
      }

      if (tag === 'ul') {
        text = '* ' + text;
      } else if (tag === 'blockquote') {
        text = '> ' + text;
      } else if ((match = tag.match(headerExp))) {
        text = ' ' + text;
        var i = parseInt(match[1]);
        while (i--) text = '#' + text;
      }

      if (prev) {
        if ((tag === 'ul' || tag === 'ol') && prev.selector === block.selector) {
          text = '\n' + text;
        } else {
          text = '\n\n' + text;
        }
      }
      return text;
    }).join('');
  },

  set text(text) {
    var prefixExp = /^(#+|\d+\.|\*|>) /;

    this.blocks = text.split(/\n/).map(function(text) {
      if (!text) return;
      var selector = this.schema.defaultBlock;
      var match = text.match(prefixExp);
      if (match) {
        var prefix = match[1];
        if (prefix[0] === '#') {
          selector = 'h' + prefix.length;
        } else if (prefix === '*') {
          selector = 'ul>li';
        } else if (prefix === '>') {
          selector = 'blockquote';
        } else {
          selector = 'ol>li';
        }
        if (!this.schema.blocks[selector]) {
          selector = this.schema.defaultBlock;
        } else {
          text = text.replace(prefixExp, '');
        }
      }

      var BlockType = this.schema.blocks[selector];
      var block = new BlockType(selector);
      block.text = text;
      return block;
    }, this).filter(Boolean);
    this.render();
  },

  /**
   * The history object for this editor
   * @return {History} This editor's history for undo/redo
   */
  get history() {
    return this._history;
  },

  set history(value) {
    this._history = value;
  },

  /**
   * Returns all the block elements
   * @return {Array} An array of all the block elements
   */
  get blockElements() {
    return slice.call(this.element.querySelectorAll(this.schema.blocksSelector));
  },

  isBlockType: function(selector) {
    return this.selection.selectedBlocks.every(function(block) {
      return block.selector === selector;
    });
  },

  isMarkupType: function(selector) {
    var selection = this.selection;
    return selection.selectedBlocks.every(function(block, index) {
      // check if the selected range in this block is already marked up with the same type
      var startOffset = index === 0 ? selection.startOffset : 0;
      var endOffset = index === selection.endBlockIndex - selection.startBlockIndex ?
                                selection.endOffset : block.text.length;
      return block.markups.some(function(markup) {
        return markup.selector === selector && markup.startOffset <= startOffset && markup.endOffset >= endOffset;
      });
    });
  },


  setBlockType: function(selector, toggle) {
    var BlockType = this.schema.blocks[selector];
    if (!BlockType) return;

    var selectedBlocks = this.selection.selectedBlocks;
    var blockStart = this.selection.startBlockIndex;

    if (toggle) {
      if (this.isBlockType(selector)) {
        selector = this.schema.defaultBlock;
        BlockType = this.schema.blocks[selector];
      }
    }

    this.startTransaction();
    selectedBlocks.forEach(function(block, index) {
      if (block.selector === selector) return;
      block = block.clone(BlockType);
      block = new BlockType(selector, block.text, block.markups);
      this.exec('updateBlock', { index: blockStart + index, block: block });
    }, this);
    this.setTransactionSelection(this.selection.range);
    this.commit();
  },


  toggleBlockType: function(selector) {
    this.setBlockType(selector, true);
  },


  toggleMarkup: function(selector) {
    var MarkupType = this.schema.markups[selector];
    if (!MarkupType) return;

    var selectedBlocks = this.selection.selectedBlocks;
    var blockStart = this.selection.startBlockIndex;
    var textStart = this.selection.startOffset;
    var blockEnd = this.selection.endBlockIndex;
    var textEnd = this.selection.endOffset;

    var toggleOff = selectedBlocks.every(function(block, index) {
      // check if the selected range in this block is already marked up with the same type
      var startOffset = index === 0 ? textStart : 0;
      var endOffset = index === selectedBlocks.length - 1 ? textEnd : block.text.length;
      if (startOffset === endOffset) return true;
      return block.markups.some(function(markup) {
        return markup.selector === selector && markup.startOffset <= startOffset && markup.endOffset >= endOffset;
      });
    });

    this.startTransaction();

    // TODO clean this up, moving methods to block/markup/schema where necessary

    selectedBlocks.forEach(function(block, index) {
      var startOffset = index === 0 ? textStart : 0;
      var endOffset = index === selectedBlocks.length - 1 ? textEnd : block.text.length;
      if (startOffset === endOffset) return;
      block = block.clone();

      // Remove the markup (or reduce it)
      // TODO determine if this could be part of the Add Markup code, but with a negative markup object, (flag for remove?)
      if (toggleOff) {
        block.markups.some(function(markup, i) {
          if (markup.selector !== selector || markup.startOffset > startOffset || markup.endOffset < endOffset) {
            return false;
          }

          // If the whole markup needs to be removed
          if (markup.startOffset === startOffset && markup.endOffset === endOffset) {
            block.markups.splice(i, 1);
          // If the markup needs to be split into two
          } else if (markup.startOffset !== startOffset && markup.endOffset !== endOffset) {
            var secondMarkup = markup.clone();
            markup.endOffset = startOffset;
            secondMarkup.startOffset = endOffset;
            block.markups.splice(i + 1, 0, secondMarkup);
          // If the markup needs to be shortened at the front or back
          } else if (markup.startOffset === startOffset) {
            markup.startOffset = endOffset;
          } else {
            markup.endOffset = startOffset;
          }

          return true;
        });

      // Add the markup
      } else {

        var markup = new MarkupType(selector, startOffset, endOffset);
        block.markups.push(markup);

        this.schema.normalizeMarkups(block);
      }

      this.setTransactionSelection(this.selection.range);
      this.exec('updateBlock', { index: blockStart + index, block: block });
    }, this);
    this.commit();
  },

  exec: function(commandName, action) {
    return this.history.exec(this, commandName, action);
  },

  startTransaction: function() {
    return this.history.start(this);
  },

  commit: function() {
    return this.history.commit();
  },

  setTransactionSelection: function(type, anchorIndex, anchorOffset, focusIndex, focusOffset) {
    if (type instanceof EditorRange) {
      this.history.setNextSelection(type);
    } else {
      this.history.setNextSelection(new EditorRange(this, type, anchorIndex, anchorOffset,
        focusIndex !== undefined ? focusIndex : anchorIndex,
        focusOffset !== undefined ? focusOffset : anchorOffset));
    }
  },

  on: function(event, listener) {
    this.element.addEventListener(event, listener);
  },

  off: function(event, listener) {
    this.element.removeEventListener(event, listener);
  },

  dispatch: function(eventName, data) {
    if (!this.element) return;
    var event = new Event(eventName, data);
    if (data) Object.keys(data).forEach(function(key) {
      event[key] = data[key];
    });
    event.editor = this;
    return this.element.dispatchEvent(event);
  },

  render: function() {
    mapping.generateElements(this);
  },

  onKeyDown: function(event) {
    var shortcut = shortcuts.fromEvent(event);
    if (!this.dispatch('shortcut', { cancelable: true, shortcut: shortcut, originalEvent: event })) {
      event.preventDefault();
    }
  }
});


function addEditorToEvent(editor, eventName) {
  editor._modifiedEvents = {};
  editor.on(eventName, editor._modifiedEvents[eventName] = function(event) {
    event.editor = editor;
  });
}

function removeEditorToEvent(editor, eventName) {
  editor.off(eventName, editor._modifiedEvents[eventName]);
}
