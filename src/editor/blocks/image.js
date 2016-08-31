module.exports = ImageBlock;
var Block = require('./block');
var selectors = require('../selectors');


function ImageBlock(selector, text, markups, metadata) {
  if (!metadata) metadata = { src: '' };
  Block.call(this, selector, text, markups, metadata);
}

Block.extend(ImageBlock, {
  static: {
    enterMode: 'leaveOnly',
  },

  createElement: function() {
    var figure = selectors.createElement('figure[contenteditable="false"]');
    var image = selectors.createElement('img[src="' + this.metadata.src + '"]');
    var caption = selectors.createElement('figcaption[contenteditable="true"]');
    figure.setAttribute('name', this.id);
    figure.appendChild(image);
    figure.appendChild(caption);
    return figure;
  },

  equals: function(block) {
    return Block.prototype.equals.call(this, block) && this.metadata.src === block.metadata.src;
  },

  clone: function(constructor) {
    return new Block(this.selector, this.text, this.markups.map(function(markup) {
      return markup.clone();
    }), { src: this.metadata.src });
  }
});
