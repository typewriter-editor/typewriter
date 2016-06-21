module.exports = Italic;
var Markup = require('./markup');

function Italic(startIndex, endIndex) {
  Markup.call(this, startIndex, endIndex);
}

Markup.extend(Italic, {
  static: {
    matches: function(element) {
      return element.tagName === 'EM' || element.tagName === 'I';
    }
  },

  toDOM: function() {
    return document.createElement('em');
  }
});
