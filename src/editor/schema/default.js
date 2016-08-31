var Schema = require('./schema');
var Block = require('../blocks/block');
var HeaderBlock = require('../blocks/header');
var ListBlock = require('../blocks/list');
var PreformattedBlock = require('../blocks/preformatted');
var ImageBlock = require('../blocks/image');
var Markup = require('../markups/markup');


var blocks = {
  p: Block,
  h1: HeaderBlock,
  h2: HeaderBlock,
  h3: HeaderBlock,
  h4: HeaderBlock,
  h5: HeaderBlock,
  h6: HeaderBlock,
  pre: PreformattedBlock,
  'blockquote.pullquote': Block,
  blockquote: Block,
  'ul>li': ListBlock,
  'ol>li': ListBlock,
  figure: ImageBlock
};


var markups = {
  'a[href]': Markup,
  strong: Markup,
  em: Markup
};


module.exports = new Schema(blocks, markups, 'p', [ new Block('p') ]);
