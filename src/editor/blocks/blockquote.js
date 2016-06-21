module.exports = Blockquote;
var Block = require('../blocks/block');


function Blockquote(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Blockquote, {
  static: {
    matches: function(element) {
      return element.nodeName === 'BLOCKQUOTE';
    }
  },

  toDOM: function() {
    return document.createElement('blockquote');
  }
});
