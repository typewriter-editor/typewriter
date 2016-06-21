module.exports = Markup;
var Class = require('chip-utils/class');


function Markup(startIndex, endIndex) {
  this.startIndex = startIndex;
  this.endIndex = endIndex;
}

Class.extend(Markup, {
  static: {
    matches: function(element) {
      throw new Error('Unimplemented abstract method in ' + this.name);
    },

    fromDOM: function(element) {
      return new this();
    }
  },

  toDOM: function() {
    throw new Error('Unimplemented abstract method in ' + this.constructor.name);
  },

  same: function(markup) {
    return markup && this.constructor === markup.constructor;
  },

  equals: function(markup) {
    return this.same(markup) &&
      this.startIndex === markup.startIndex &&
      this.endIndex === markup.endIndex;
  },

  clone: function(constructor) {
    var markup = new this.constructor();
    Object.keys(this).forEach(function(key) {
      markup[key] = this[key];
    }, this);
    return markup;
  }
});
