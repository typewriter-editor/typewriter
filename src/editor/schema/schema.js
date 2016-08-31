module.exports = Schema;
var Class = require('chip-utils/class');
var map = Array.prototype.map;


function Schema(blocks, markups, defaultBlock, initial) {
  this.blocks = blocks || [];
  this.markups = markups || [];
  this.defaultBlock = defaultBlock;
  this.initial = initial;
  this.blocksSelector = Object.keys(this.blocks).join(',');
  this.markupsSelector = Object.keys(this.markups).join(',');
}

Class.extend(Schema, {

  getBlockType: function(element) {
    return findType(this.blocks, element);
  },

  getMarkupType: function(element) {
    return findType(this.blocks, element);
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
      var indexA = schema.markups.indexOf(markupA.constructor);
      var indexB = schema.markups.indexOf(markupB.constructor);
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
  var selector = Object.keys(items).find(function(selector) {
    return element.matches(selector);
  });
  return items[selector];
}
