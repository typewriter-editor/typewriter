module.exports = Header6;
var Block = require('../blocks/block');


function Header6(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Header6, {
  static: {
    matches: function(element) {
      return element.nodeName === 'H6';
    }
  },

  toDOM: function() {
    return document.createElement('h6');
  }
});
