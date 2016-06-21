module.exports = Header4;
var Block = require('../blocks/block');


function Header4(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Header4, {
  static: {
    matches: function(element) {
      return element.nodeName === 'H4';
    }
  },

  toDOM: function() {
    return document.createElement('h4');
  }
});
