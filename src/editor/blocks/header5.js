module.exports = Header5;
var Block = require('../blocks/block');


function Header5(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Header5, {
  static: {
    matches: function(element) {
      return element.nodeName === 'H5';
    }
  },

  toDOM: function() {
    return document.createElement('h5');
  }
});
