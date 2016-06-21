module.exports = DeleteBlockCommand;
var mapping = require('../mapping');
var Command = require('../command');

/**
 * Deletes a block from an editor.
 * @param {Editor} index The index as where this block is being deleted
 * @param {Number} index The index as where this block is being deleted
 */
function DeleteBlockCommand(args) {
  if (!args || typeof args.index !== 'number' || args.index < 0) {
    throw new TypeError('Invalid arguments, DeleteBlockCommand requires a valid index');
  }
  this.index = args.index;
}

Command.extend(DeleteBlockCommand, {

  exec: function() {
    this.block = this.history.editor.blocks.splice(this.index, 1)[0];
  },

  undo: function() {
    var editor = this.history.editor;
    editor.blocks.splice(this.index, 0, this.block);
    var element = mapping.blockToDOM(editor.schema, this.block);
    var after = editor.element.children[this.index];
    editor.element.insertBefore(element, after);
  },

  redo: function() {
    var editor = this.history.editor;
    this.block = editor.blocks.splice(this.index, 1)[0];
    var element = editor.element.children[this.index];
    editor.element.removeChild(element);
  }
});
