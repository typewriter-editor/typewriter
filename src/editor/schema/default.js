var Schema = require('./schema');
var Paragraph = require('../blocks/paragraph');
var blocks = [
  Paragraph,
  require('../blocks/header1'),
  require('../blocks/header2'),
  require('../blocks/header3'),
  require('../blocks/header4'),
  require('../blocks/header5'),
  require('../blocks/header6'),
  require('../blocks/blockquote'),
  require('../blocks/preformatted')
];
var markups = [
  require('../markups/link'),
  require('../markups/bold'),
  require('../markups/italic')
];

module.exports = new Schema(blocks, markups, [ new Paragraph() ]);
