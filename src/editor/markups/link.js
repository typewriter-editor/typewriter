module.exports = Link;
var Markup = require('./markup');

function Link(startIndex, endIndex, href) {
  Markup.call(this, startIndex, endIndex);
  this.href = href;
}

Markup.extend(Link, {
  static: {
    matches: function(element) {
      return element.nodeName === 'A' && element.href;
    },

    fromDOM: function(element) {
      var markup = new Link();
      markup.href = element.getAttribute('href');
      return markup;
    }
  },

  toDOM: function() {
    var element = document.createElement('a');
    element.setAttribute('href', this.href);
    return element;
  },

  same: function(markup) {
    return Markup.prototype.same.call(this, markup) && this.href === markup.href;
  }
});
