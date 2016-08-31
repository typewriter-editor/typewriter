module.exports = DeleteBlockCommand;
var Command = require('../command');
var mapping = require('../mapping');

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
    this.block = this.editor.blocks.splice(this.index, 1)[0];
    mapping.removeElement(this.editor, this.block);
  },

  undo: function() {
    this.editor.blocks.splice(this.index, 0, this.block);
    mapping.generateElement(this.editor, this.block);
  }
});
