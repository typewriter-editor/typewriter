module.exports = Header6;
var Block = require('../blocks/block');


function Header6(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Header6, {
  static: {
    selector: 'h6'
  },

  toDOM: function() {
    return document.createElement('h6');
  }
});
