module.exports = Preformatted;
var Block = require('../blocks/block');


function Preformatted(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Preformatted, {
  static: {
    matches: function(element) {
      return element.nodeName === 'PRE';
    }
  },

  toDOM: function() {
    return document.createElement('pre');
  }
});
