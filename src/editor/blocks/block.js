module.exports = Block;
var Class = require('chip-utils/class');
var Markup = require('../markups/markup');
var selectors = require('../selectors');

/**
 * A block of content such as a paragraph or blockquote
 * @param {String} selector The selector for this block
 * @param {String} text The text within the block
 * @param {String} markups An array of markups for this block
 */
function Block(selector, text, markups) {
  if (!selector) throw new TypeError('A selector is required to create a block');
  this.id = getId();
  this.selector = selector;
  this.text = text || '';
  this.markups = markups || [];
}

Class.extend(Block, {
  static: {
    /**
     * Determines what markups this block is limited to. If null, all markups are allowed.
     */
    limitMarkupsTo: null,

    /**
     * Determines how the enter key works within this block.
     * enterModes:
     *  * regular - moves onto a P next, allows splits, allows BRs, e.g. headers, blockquotes, paragraphs
     *  * continuation - moves onto same block unless empty then to a P, allows BRs, e.g. lists
     *  * contained - creates BRs, always followed by a block, e.g. preformatted
     *  * leaveOnly - no splits, no BRs, moves to P when at the end only, e.g. figcaption
     *  * none - no splits, no BRs, no new blocks
     */
    enterMode: 'regular'
  },

  getLimitMarkupsTo: function() {
    return this.constructor.limitMarkupsTo;
  },

  getEnterMode: function() {
    return this.constructor.enterMode;
  },

  createElement: function() {
    var block = selectors.createElement(this.selector);
    block.setAttribute('blockid', this.id);
    return block;
  },

  same: function(block) {
    return block && this.constructor === block.constructor && this.selector === block.selector;
  },

  equals: function(block) {
    return this.same(block) &&
      this.text === block.text &&
      this.markups.length === block.markups.length &&
      this.markups.every(function(markup, index) {
        return markup.equals(block.markups[index]);
      });
  },

  clone: function(newId) {
    var block = new Block(this.selector, this.text, this.markups.map(function(markup) {
      return markup.clone();
    }));
    if (!newId) block.id = this.id;
    return block;
  }
});


function getId() {
  return Math.random().toString(36).slice(2, 7);
}
