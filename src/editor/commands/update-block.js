module.exports = UpdateBlockCommand;
var Command = require('../command');
var Block = require('../blocks/block');
var mapping = require('../mapping');
var stylesExp = / style="[^"]+"/g;
/**
 * Udates a block in an editor.
 * @param {Number} index The index as which this block is located
 * @param {Object} block The new block object which will update the old
 */
function UpdateBlockCommand(args) {
  if (!args || typeof args.index !== 'number' || args.index < 0 || !(args.block instanceof Block)) {
    throw new TypeError('Invalid arguments, UpdateBlockCommand requires a valid index and block');
  }
  this.index = args.index;
  this.block = args.block;
  this.oldBlock = null;
}

Command.extend(UpdateBlockCommand, {

  exec: function() {
    this.oldBlock = this.editor.blocks.splice(this.index, 1, this.block)[0];
    this.block.id = this.oldBlock.id;
    mapping.generateElement(this.editor, this.block);
  },

  undo: function() {
    var newBlock = this.editor.blocks.splice(this.index, 1, this.oldBlock)[0];
    this.oldBlock.id = newBlock.id;
    mapping.generateElement(this.editor, this.oldBlock);
  }
});
