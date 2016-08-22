module.exports = Header1;
var Block = require('../blocks/block');


function Header1(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Header1, {
  static: {
    selector: 'h1'
  },

  toDOM: function() {
    return document.createElement('h1');
  }
});
