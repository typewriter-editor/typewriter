module.exports = ListItem;
var Block = require('./block');


function ListItem(type) {
  Block.call(this, type);
}

Block.extend(ListItem, {
  static: {
    types: {
      ol_li: true,
      ul_li: true
    },

    matches: function(element) {
      return element.nodeName === 'LI';
    }
  },

  toDOM: function() {

  }
});
