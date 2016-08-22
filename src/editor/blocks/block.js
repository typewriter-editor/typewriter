module.exports = Block;
var Class = require('chip-utils/class');
var Markup = require('../markups/markup');

/**
 * A block of content such as a paragraph or list-item
 * @param {String} text The text within the block
 * @param {String} markups An array of markups for this block
 */
function Block(text, markups) {
  this.text = text || '';
  this.markups = markups || [];
  if (this.markups.length) this.sortAndMergeMarkups();
}

Class.extend(Block, {
  static: {
    selector: '',

    matches: function(element) {
      return true;
    },

    fromDOM: function(element) {
      return new this();
    }
  },

  toDOM: function() {
    throw new Error('Unimplemented abstract method in ' + this.constructor.name);
  },

  equals: function(block) {
    return this.constructor === block.constructor &&
      this.text === block.text &&
      this.markups.length === block.markups.length &&
      this.markups.every(function(markup, index) {
        return markup.equals(block.markups[index]);
      });
  },

  clone: function(constructor) {
    if (!constructor) constructor = this.constructor;
    return new constructor(this.text, this.markups.slice());
  },

  addMarkup: function(markup) {
    this.markups.push(markup);
    this.sortAndMergeMarkups(markup);
  },

  // set the markups, merge neighboring ones, cancel or shorten some, whatever, and sort them
  sortAndMergeMarkups: function(priorityMarkup) {
    this.markups.sort(function(markupA, markupB) {

    });
  },
});
