module.exports = Preformatted;
var Block = require('../blocks/block');


function Preformatted(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(Preformatted, {
  static: {
    selector: 'pre'
  },

  toDOM: function() {
    return document.createElement('pre');
  }
});
