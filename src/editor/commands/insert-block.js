module.exports = InsertBlockCommand;
var Command = require('../command');
var Block = require('../blocks/block');
var mapping = require('../mapping');

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
    this.editor.blocks.splice(this.index, 0, this.block);
    mapping.generateElement(this.editor, this.block);
  },

  undo: function() {
    this.editor.blocks.splice(this.index, 1);
    mapping.removeElement(this.editor, this.block);
  }
});
