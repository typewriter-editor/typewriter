module.exports = Block;
var Class = require('chip-utils/class');
var Markup = require('./markup');

/**
 * A block of content such as a paragraph or list-item
 * @param {String} selector The selector for this block
 * @param {String} text The text within the block
 * @param {String} markups An array of markups for this block
 */
function Block(selector, text, markups, metadata) {
  if (selector) throw new TypeError('A selector is required to create a block');
  this.selector = selector;
  this.text = text || '';
  this.markups = markups || [];
  this.metadata = metadata;
}

Class.extend(Block, {

  equals: function(block) {
    return this.selector === block.selector &&
      this.text === block.text &&
      this.markups.length === block.markups.length &&
      this.markups.every(function(markup, index) {
        return markup.equals(block.markups[index]);
      });
  },

  clone: function(constructor) {
    return new Block(this.selector, this.text, this.markups.map(function(markup) {
      return markup.clone();
    }));
  }
});
