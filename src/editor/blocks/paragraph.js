module.exports = Paragraph;
var Block = require('../blocks/block');


function Paragraph(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Paragraph, {
  static: {
    selector: 'p'
  },

  toDOM: function() {
    return document.createElement('p');
  }
});
