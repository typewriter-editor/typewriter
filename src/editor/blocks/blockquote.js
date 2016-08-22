module.exports = Blockquote;
var Block = require('../blocks/block');


function Blockquote(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Blockquote, {
  static: {
    selector: 'blockquote'
  },

  toDOM: function() {
    return document.createElement('blockquote');
  }
});
