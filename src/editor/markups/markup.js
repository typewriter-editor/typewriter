module.exports = Markup;
var Class = require('chip-utils/class');
var selectors = require('../selectors');


function Markup(selector, startOffset, endOffset) {
  if (!selector) throw new TypeError('A selector is required to create a markup');
  this.selector = selector;
  this.startOffset = startOffset || 0;
  this.endOffset = endOffset || 0;
}

Class.extend(Markup, {


  createElement: function() {
    return selectors.createElement(this.selector);
  },

  same: function(markup) {
    return markup && this.constructor === markup.constructor && this.selector === markup.selector;
  },

  equals: function(markup) {
    return this.same(markup) && this.startOffset === markup.startOffset && this.endOffset === markup.endOffset;
  },

  clone: function(constructor) {
    return new Markup(this.selector, this.startOffset, this.endOffset);
  }
});
