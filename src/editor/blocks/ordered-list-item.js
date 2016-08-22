module.exports = OrderedListItem;
var Block = require('../blocks/block');


function OrderedListItem(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(OrderedListItem, {
  static: {
    selector: 'ol > li'
  },

  toDOM: function() {
    return document.createElement('li');
  }
});
