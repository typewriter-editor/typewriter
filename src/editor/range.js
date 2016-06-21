module.exports = EditorRange;
var Class = require('chip-utils/class');


function EditorRange(editor, type, anchorBlockIndex, anchorIndex, focusBlockIndex, focusIndex) {
  // Keep editor from enumeration so it won't serialize into JSON
  Object.defineProperty(this, 'editor', { value: editor, writable: true, configurable: true });
  this.type = type || 'none';
  this.anchorBlockIndex = anchorBlockIndex !== undefined ? anchorBlockIndex : -1;
  this.anchorIndex = anchorIndex !== undefined ? anchorIndex : -1;
  this.focusBlockIndex = focusBlockIndex !== undefined ? focusBlockIndex : -1;
  this.focusIndex = focusIndex !== undefined ? focusIndex : -1;
}

Class.extend(EditorRange, {
  static: {
    fromJSON: function(value) {
      return new EditorRange(null,
        value.type,
        value.anchorBlockIndex,
        value.anchorIndex,
        value.focusBlockIndex,
        value.focusIndex
      );
    }
  },

  get valid() {
    return this.editor &&
      this.type !== 'none' &&
      this.anchorBlockIndex !== -1 &&
      this.anchorIndex !== -1 &&
      this.focusBlockIndex !== -1 &&
      this.focusIndex !== -1;
  },

  get startBlockIndex() {
    return Math.min(this.anchorBlockIndex, this.focusBlockIndex);
  },

  get startIndex() {
    if (this.anchorBlockIndex === this.focusBlockIndex) {
      return Math.min(this.anchorIndex, this.focusIndex);
    } else if (this.anchorBlockIndex < this.focusBlockIndex) {
      return this.anchorIndex;
    } else {
      return this.focusIndex;
    }
  },

  get endBlockIndex() {
    return Math.max(this.anchorBlockIndex, this.focusBlockIndex);
  },

  get endIndex() {
    if (this.anchorBlockIndex === this.focusBlockIndex) {
      return Math.max(this.anchorIndex, this.focusIndex);
    } else if (this.anchorBlockIndex > this.focusBlockIndex) {
      return this.anchorIndex;
    } else {
      return this.focusIndex;
    }
  },

  get collapsed() {
    return this.anchorBlockIndex === this.focusBlockIndex && this.anchorIndex === this.focusIndex;
  },

  equals: function(range) {
    return range &&
      this.editor === range.editor &&
      this.type === range.type &&
      this.anchorBlockIndex === range.anchorBlockIndex &&
      this.anchorIndex === range.anchorIndex &&
      this.focusBlockIndex === range.focusBlockIndex &&
      this.focusIndex === range.focusIndex;
  },

  clone: function() {
    return new EditorRange(this.editor,
      this.type,
      this.anchorBlockIndex,
      this.anchorIndex,
      this.focusBlockIndex,
      this.focusIndex);
  }
});
