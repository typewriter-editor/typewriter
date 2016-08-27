var Schema = require('./schema');
var Block = require('../block');
var blocks = [ 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote', 'figure' ];
var markups = [ 'a[href]', 'b', 'i' ];


module.exports = new Schema(blocks, markups, [ new Block('p') ]);
