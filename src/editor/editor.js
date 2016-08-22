module.exports = Editor;
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
var modifiedEvents = [ 'input', 'focus', 'blur', 'focusin', 'focusout', 'paste' ];
require('./selectionchange-polyfill');


/**
 * Creates a rich text editor within the element provided.
 * @param {HTMLElement} element An HTML element which will be used as the container for the editable content
 * @param {Object} options A hash of options for the editor
 */
function Editor(element, options) {
  this.element = element;
  this.options = options || {};
  this.schema = this.options.schema || defaultSchema;
  this.history = new History();
  this.history.editor = this;
  this.selection = new EditorSelection(this);
  this.blocks = this.schema.getInitial();
  this.onKeyDown = this.onKeyDown.bind(this);
  modifiedEvents.forEach(addEditorToEvent.bind(null, this));
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
    if (value) {
      this.element.setAttribute('spellcheck', 'true');
      this.element.classList.add('editable');
      this.on('keydown', this.onKeyDown);
      this.on('input', this.onInput);
      this.on('focus', this.onFocus);
      this.on('blur', this.onBlur);
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
    return this.element.innerHTML;
  },

  set html(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    this.blocks = mapping.blocksFromDOM(this.schema, div);
    this.render();
  },


  /**
   * The HTML contents of the editor. Internally the editor contains blocks of content, but this gets or sets the
   * current HTML representation of that content.
   * TODO allow blocks to parse/output text so lists can work with "1. List item" and "* item" correctly
   * @type {String}
   */
  get text() {
    return this.blocks.map(function(block) {
      return block.text;
    }).join('\n');
  },

  set text(text) {
    this.blocks = text.split(/\n/).map(function(text) {
      var block = new Block('p');
      block.text = text;
      return block;
    });
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
    if (this._history) delete this._history.editor;
    if (value) Object.defineProperty(value, 'editor', { configurable: true, value: this });
    this._history = value;
  },

  toggleBlockType: function(type) {
    var BlockType = this.schema.getBlockType(type);
    if (!BlockType) return;

    var selectedBlocks = this.selection.selectedBlocks;
    var blockStart = this.selection.startBlockIndex;

    var toggleOff = selectedBlocks.every(function(block) {
      return block instanceof BlockType;
    });

    if (toggleOff) BlockType = this.schema.defaultBlock;

    this.startTransaction();
    selectedBlocks.forEach(function(block, index) {
      if (block instanceof BlockType) return;
      block = block.clone(BlockType);
      this.exec('updateBlock', { index: blockStart + index, block: block });
    }, this);
    this.commit();
  },

  toggleMarkup: function(type) {
    var MarkupType = this.schema.getMarkupType(type);
    if (!MarkupType) return;

    var selectedBlocks = this.selection.selectedBlocks;
    var blockStart = this.selection.startBlockIndex;
    var textStart = this.selection.startIndex;
    var blockEnd = this.selection.endBlockIndex;
    var textEnd = this.selection.endIndex;

    var toggleOff = selectedBlocks.every(function(block, index) {
      // check if the selected range in this block is already marked up with the same type
      var startIndex = index === 0 ? textStart : 0;
      var endIndex = index === selectedBlocks.length - 1 ? textEnd : block.text.length - 1;
      return block.markups.some(function(markup) {
        return markup instanceof MarkupType && markup.startIndex <= startIndex && markup.endIndex >= endIndex;
      });
    });

    this.startTransaction();

    // TODO clean this up, moving methods to block/markup/schema where necessary

    selectedBlocks.forEach(function(block, index) {
      var startIndex = index === 0 ? textStart : 0;
      var endIndex = index === selectedBlocks.length - 1 ? textEnd : block.text.length - 1;
      block = block.clone();

      // Remove the markup (or reduce it)
      // TODO determine if this could be part of the Add Markup code, but with a negative markup object, (flag for remove?)
      if (toggleOff) {
        block.markups.some(function(markup, i) {
          if (!(markup instanceof MarkupType) || markup.startIndex > startIndex || markup.endIndex < endIndex) {
            return false;
          }
          markup = markup.clone();
          block.markups[i] = markup;

          // If the whole markup needs to be removed
          if (markup.startIndex === startIndex && markup.endIndex === endIndex) {
            block.markups.splice(i, 1);
          // If the markup needs to be split into two
          } else if (markup.startIndex !== startIndex && markup.endIndex !== endIndex) {
            var secondMarkup = markup.clone();
            markup.endIndex = startIndex;
            secondMarkup.startIndex = endIndex;
            block.markups.splice(i + 1, 0, secondMarkup);
          // If the markup needs to be shortened at the front or back
          } else if (markup.startIndex === startIndex) {
            markup.startIndex = endIndex;
          } else {
            markup.endIndex = startIndex;
          }

          return true;
        });

      // Add the markup
      } else {

        var markup = new MarkupType(startIndex, endIndex);
        block.markups.push(markup);

        this.schema.normalizeMarkups(block);
      }

      this.exec('updateBlock', { index: blockStart + index, block: block });
    }, this);
    this.commit();
  },

  exec: function(commandName, action) {
    return this.history.exec.apply(this.history, arguments);
  },

  startTransaction: function() {
    return this.history.start();
  },

  commit: function() {
    return this.history.commit();
  },

  on: function(event, listener) {
    this.element.addEventListener(event, listener);
  },

  off: function(event, listener) {
    this.element.removeEventListener(event, listener);
  },

  dispatch: function(eventName, data) {
    var event = new Event(eventName, data);
    if (data) Object.keys(data).forEach(function(key) {
      event[key] = data[key];
    });
    event.editor = this;
    return this.element.dispatchEvent(event);
  },

  render: function() {
    var fragment = mapping.blocksToDOM(this.schema, this.blocks);
    while (this.element.lastChild) this.element.removeChild(this.element.lastChild);
    this.element.appendChild(fragment);
    if (this.element.hasAttribute('placeholder')) {
      this.element.firstChild.setAttribute('placeholder', this.element.getAttribute('placeholder'));
    }
  },

  onKeyDown: function(event) {
    var shortcut = shortcuts.fromEvent(event);
    if (!this.dispatch('shortcut', { shortcut: shortcut, originalEvent: event })) {
      event.preventDefault();
    }
  }
});


function addEditorToEvent(editor, eventName) {
  editor.on(eventName, function(event) {
    event.editor = editor;
  });
}
