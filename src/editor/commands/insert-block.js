module.exports = InsertBlockCommand;
var mapping = require('../mapping');
var Command = require('../command');
var Block = require('../blocks/block');

/**
 * Creates and adds a block to an editor.
 * @param {Number} index The index as which this block is being inserted
 * @param {Object} block A block object which will be added to the editor
 */
function InsertBlockCommand(args) {
  if (!args || typeof args.index !== 'number' || args.index < 0 || !(args.block instanceof Block)) {
    throw new TypeError('Invalid arguments, InsertBlockCommand requires a valid index and block');
  }
  this.index = args.index;
  this.block = args.block;
}

Command.extend(InsertBlockCommand, {

  exec: function() {
    this.history.editor.blocks.splice(this.index, 0, this.block);
  },

  undo: function() {
    var editor = this.history.editor;
    editor.blocks.splice(this.index, 1);
    var element = editor.element.children[this.index];
    editor.element.removeChild(element);
  },

  redo: function() {
    var editor = this.history.editor;
    editor.blocks.splice(this.index, 0, this.block);
    var element = mapping.blockToDOM(editor.schema, this.block);
    var after = editor.element.children[this.index];
    editor.element.insertBefore(element, after);
  }
});
