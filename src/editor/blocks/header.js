module.exports = HeaderBlock;
var Block = require('./block');


function HeaderBlock(selector, text, markups) {
  Block.call(this, selector, text, markups);
}

Block.extend(HeaderBlock, {
  static: {
    limitMarkups: [ 'a[href]' ]
  },

  createElement: function() {
    var element = Block.prototype.createElement.call(this);
    element.id = this.text.toLowerCase().replace("'", '').replace(/[^a-z]+/, '-').replace(/^-|-$/g, '');
    return element;
  }
});
