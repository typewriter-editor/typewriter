module.exports = UpdateBlockCommand;
var mapping = require('../mapping');
var Command = require('../command');
var Block = require('../blocks/block');
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
    var editor = this.history.editor;
    this.oldBlock = editor.blocks[this.index];
    editor.blocks.splice(this.index, 1, this.block);
    var element = mapping.blockToDOM(editor.schema, this.block);
    var replace = editor.element.children[this.index];
    if (element.outerHTML !== replace.outerHTML.replace(stylesExp, '')) {
      editor.element.replaceChild(element, replace);
    }
  },

  undo: function() {
    var editor = this.history.editor;
    editor.blocks.splice(this.index, 1, this.oldBlock);
    var element = mapping.blockToDOM(editor.schema, this.oldBlock);
    var replace = editor.element.children[this.index];
    editor.element.replaceChild(element, replace);
  }
});
