module.exports = PreformattedBlock;
var Block = require('./block');


function PreformattedBlock(selector, text, markups) {
  Block.call(this, selector, text, markups);
}

Block.extend(PreformattedBlock, {
  static: {
    enterMode: 'contained'
  }
});
