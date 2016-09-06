module.exports = Schema;
var Class = require('chip-utils/class');
var map = Array.prototype.map;
var aliases = {
  strong: 'b',
  em: 'i'
};


function Schema(blocks, markups, defaultBlock, initial) {
  this.locked = false;
  this.blocks = blocks || [];
  this.markups = markups || [];
  this.defaultBlock = defaultBlock;
  this.initial = initial;
  this.blocksSelector = Object.keys(this.blocks).join(',');
  this.markupsSelector = Object.keys(this.markups).join(',');
}

Class.extend(Schema, {

  createDefaultBlock: function(text, markups) {
    return new this.blocks[this.defaultBlock](this.defaultBlock, text, markups);
  },

  getBlockSelector: function(element) {
    return findSelector(this.blocks, element);
  },

  getMarkupSelector: function(element) {
    return findSelector(this.markups, element);
  },

  getBlockType: function(element) {
    return findType(this.blocks, element);
  },

  getMarkupType: function(element) {
    return findType(this.markups, element);
  },

  getInitial: function() {
    return this.initial.map(function(block) {
      return block.clone(true);
    });
  },

  // Sort the markups by type first, then by location
  sortMarkups: function(block) {
    var schema = this;
    block.markups.sort(function(markupA, markupB) {
      var indexA = schema.markupsSelector.indexOf(markupA.selector);
      var indexB = schema.markupsSelector.indexOf(markupB.selector);
      if (indexA === indexB) return markupA.startOffset - markupB.startOffset;
      return indexA - indexB;
    });
  },

  normalizeMarkups: function(block) {
    // Ensure the markups are in order first
    this.sortMarkups(block);

    // Merge the markups together that need to be merged
    for (var i = 1; i < block.markups.length; i++) {
      var currentMarkup = block.markups[i];
      var prevMarkup = block.markups[i - 1];
      if (currentMarkup.endOffset > block.text.length) {
        currentMarkup.endOffset = block.text.length;
      }

      // If it is a different type of markup don't try to merge
      // If they don't overlap in any way don't try to merge either
      if (!prevMarkup.same(currentMarkup) || currentMarkup.startOffset > prevMarkup.endOffset) {
        continue;
      }

      // Merge the current into the previous and remove the current
      prevMarkup.endOffset = Math.max(currentMarkup.endOffset, prevMarkup.endOffset);
      block.markups.splice(i--, 1);
    }
  }

});


function findType(items, element) {
  return items[findSelector(items, element)];
}

function findSelector(items, element) {
  return Object.keys(items).find(function(selector) {
    if (aliases[selector]) selector += ',' + aliases[selector];
    return element.matches(selector);
  });
}
