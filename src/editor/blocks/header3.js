module.exports = Header3;
var Block = require('../blocks/block');


function Header3(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Header3, {
  static: {
    selector: 'h3'
  },

  toDOM: function() {
    return document.createElement('h3');
  }
});
