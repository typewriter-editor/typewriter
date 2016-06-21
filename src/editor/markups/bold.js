module.exports = Bold;
var Markup = require('./markup');

function Bold(startIndex, endIndex) {
  Markup.call(this, startIndex, endIndex);
}

Markup.extend(Bold, {
  static: {
    matches: function(element) {
      return element.tagName === 'STRONG' || element.tagName === 'B';
    }
  },

  toDOM: function() {
    return document.createElement('strong');
  }
});
