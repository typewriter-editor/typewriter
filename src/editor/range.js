module.exports = EditorRange;
var Class = require('chip-utils/class');
var types = { text: true, media: true, none: true };


function EditorRange(editor, type, anchorBlockIndex, anchorOffset, focusBlockIndex, focusOffset) {
  if (type && !types[type]) {
    throw new TypeError('Invalid selection range type: ' + type);
  }
  // Keep editor from enumeration so it won't serialize into JSON
  Object.defineProperty(this, 'editor', { value: editor, writable: true, configurable: true });
  this.type = type || 'none';
  this.anchorBlockIndex = anchorBlockIndex !== undefined ? anchorBlockIndex : -1;
  this.anchorOffset = anchorOffset !== undefined ? anchorOffset : -1;
  this.focusBlockIndex = focusBlockIndex !== undefined ? focusBlockIndex : -1;
  this.focusOffset = focusOffset !== undefined ? focusOffset : -1;
}

Class.extend(EditorRange, {
  static: {
    fromJSON: function(value) {
      return new EditorRange(null,
        value.type,
        value.anchorBlockIndex,
        value.anchorOffset,
        value.focusBlockIndex,
        value.focusOffset
      );
    }
  },

  get valid() {
    return this.editor &&
      this.type !== 'none' &&
      this.anchorBlockIndex !== -1 &&
      this.anchorOffset !== -1 &&
      this.focusBlockIndex !== -1 &&
      this.focusOffset !== -1;
  },

  get startBlockIndex() {
    return Math.min(this.anchorBlockIndex, this.focusBlockIndex);
  },

  get startOffset() {
    if (this.anchorBlockIndex === this.focusBlockIndex) {
      return Math.min(this.anchorOffset, this.focusOffset);
    } else if (this.anchorBlockIndex < this.focusBlockIndex) {
      return this.anchorOffset;
    } else {
      return this.focusOffset;
    }
  },

  get endBlockIndex() {
    return Math.max(this.anchorBlockIndex, this.focusBlockIndex);
  },

  get endOffset() {
    if (this.anchorBlockIndex === this.focusBlockIndex) {
      return Math.max(this.anchorOffset, this.focusOffset);
    } else if (this.anchorBlockIndex > this.focusBlockIndex) {
      return this.anchorOffset;
    } else {
      return this.focusOffset;
    }
  },

  get isCollapsed() {
    return this.anchorBlockIndex === this.focusBlockIndex && this.anchorOffset === this.focusOffset;
  },

  collapse: function(toEnd) {
    if (toEnd) {
      this.anchorBlockIndex = this.focusBlockIndex;
      this.anchorOffset = this.focusOffset;
    } else {
      this.focusBlockIndex = this.anchorBlockIndex;
      this.focusOffset = this.anchorOffset;
    }
    return this;
  },

  equals: function(range) {
    return range &&
      this.editor === range.editor &&
      this.type === range.type &&
      this.anchorBlockIndex === range.anchorBlockIndex &&
      this.anchorOffset === range.anchorOffset &&
      this.focusBlockIndex === range.focusBlockIndex &&
      this.focusOffset === range.focusOffset;
  },

  clone: function() {
    return new EditorRange(this.editor,
      this.type,
      this.anchorBlockIndex,
      this.anchorOffset,
      this.focusBlockIndex,
      this.focusOffset);
  }
});
