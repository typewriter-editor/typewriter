module.exports = Schema;
var Class = require('chip-utils/class');
var Block = require('../blocks/block');
var Paragraph = require('../blocks/paragraph');
var Markup = require('../markups/markup');


function Schema(blocks, markups, initial) {
  this.blocks = blocks || [];
  this.markups = markups || [];
  this.initial = initial;
  this.defaultBlock = Paragraph;
  this.register(this.blocks);
  this.register(this.markups);
}

Class.extend(Schema, {

  register: function(item) {
    if (Array.isArray(item)) item.forEach(this.register, this);
    else if (item.prototype instanceof Block) this.blocks[item.name.toLowerCase()] = item;
    else if (item.prototype instanceof Markup) this.markups[item.name.toLowerCase()] = item;
  },

  getBlockType: function(name) {
    return this.blocks[name.toLowerCase()];
  },

  getMarkupType: function(name) {
    return this.markups[name.toLowerCase()];
  },

  blockFromDOM: function(element) {
    return fromDOM(this.blocks, element);
  },

  markupFromDOM: function(element) {
    return fromDOM(this.markups, element);
  },

  getInitial: function() {
    return this.initial.map(function(block) {
      return block.clone();
    });
  },

  // Sort the markups by type first, then by location
  sortMarkups: function(block) {
    var schema = this;
    block.markups.sort(function(markupA, markupB) {
      var indexA = schema.markups.indexOf(markupA.constructor);
      var indexB = schema.markups.indexOf(markupB.constructor);
      if (indexA === indexB) return markupA.startIndex - markupB.startIndex;
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
      if (prevMarkup.constructor !== currentMarkup.constructor) continue;

      // If they don't overlap in any way don't try to merge either
      if (currentMarkup.startIndex > prevMarkup.endIndex) continue;

      // If they are the same, merge them together
      if (prevMarkup.same(currentMarkup)) {
        prevMarkup = prevMarkup.clone();
        block.markups[i - 1] = prevMarkup;
        prevMarkup.endIndex = Math.max(currentMarkup.endIndex, prevMarkup.endIndex);
        block.markups.splice(i--, 1);
      } else {
        // If they start at the same location, the just-added markup will override the old one
        if (prevMarkup.startIndex === currentMarkup.startIndex) {
          // If the currentMarkup is the newly added one, alter the previous
          if (currentMarkup === markup) {
            // If the previous extends past this one, adjust it and swap their location
            if (prevMarkup.endIndex > currentMarkup.endIndex) {
              prevMarkup = prevMarkup.clone();
              block.markups[i - 1] = prevMarkup;
              prevMarkup.startIndex = currentMarkup.endIndex + 1;
              block.markups[i - 1] = currentMarkup;
              block.markups[i++] = prevMarkup;
            // Otherwise delete the previous markup
            } else {
              block.markups.splice(i++ - 1, 1);
            }
          // Let the previous markup override the current
          } else {
            // Delete or adjust the current markup
            if (currentMarkup.endIndex > prevMarkup.endIndex) {
              currentMarkup = currentMarkup.clone();
              block.markups[i] = currentMarkup;
              currentMarkup.startIndex = prevMarkup.endIndex + 1;
            } else {
              blocks.markups.splice(i++, 1);
            }
          }

        // They don't start at the same location, adjust if they overlap
        } else {

          // If the current markup cuts the previous markup in the middle, clone the previous and add it after
          if (prevMarkup.endIndex > currentMarkup.endIndex) {
            var nextMarkup = prevMarkup.clone();
            nextMarkup.startIndex = currentMarkup.endIndex + 1;
            block.markups.splice(i++ + 1, 0, nextMarkup);
          }

          prevMarkup = prevMarkup.clone();
          block.markups[i - 1] = prevMarkup;
          prevMarkup.endIndex = currentMarkup.startIndex - 1;
        }
      }
    }
  }

});


function fromDOM(items, element) {
  for (var i = items.length; i > 0; i--) {
    var ItemClass = items[i - 1];
    if (ItemClass.matches(element)) {
      return ItemClass.fromDOM(element);
    }
  }
}
