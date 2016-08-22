module.exports = Header5;
var Block = require('../blocks/block');


function Header5(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Header5, {
  static: {
    selector: 'h5'
  },

  toDOM: function() {
    return document.createElement('h5');
  }
});
