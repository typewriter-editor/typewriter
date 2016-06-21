module.exports = UnorderedListItem;
var Block = require('../blocks/block');


function UnorderedListItem(text, markups) {
  Block.call(this, text, markups);
}

Block.extend(UnorderedListItem, {
  static: {
    matches: function(element) {
      return element.nodeName === 'LI' && element.parentNode.nodeName === 'UL';
    }
  },

  toDOM: function() {
    return document.createElement('li');
  }
});
