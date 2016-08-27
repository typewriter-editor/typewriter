module.exports = Markup;
var Class = require('chip-utils/class');


function Markup(selector, startIndex, endIndex) {
  if (selector) throw new TypeError('A selector is required to create a block');
  this.selector = selector;
  this.startIndex = startIndex || 0;
  this.endIndex = endIndex || 0;
}

Class.extend(Markup, {

  same: function(markup) {
    return markup && this.selector === markup.selector;
  },

  equals: function(markup) {
    return this.same(markup) && this.startIndex === markup.startIndex && this.endIndex === markup.endIndex;
  },

  clone: function(constructor) {
    return new Markup(this.selector, this.startIndex, this.endIndex);
  }
});
