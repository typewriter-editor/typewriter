module.exports = ListBlock;
var Block = require('./block');


function ListBlock(selector, text, markups) {
  Block.call(this, selector, text, markups);
}

Block.extend(ListBlock, {
  static: {
    enterMode: 'continuation'
  }
});
