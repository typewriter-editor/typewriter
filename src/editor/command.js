module.exports = Command;
var Class = require('chip-utils/class');

function Command(args) {

}

Class.extend(Command, {
  // Set by the history that executes the command
  history: null,
  selectionAfter: null,
  selectionBefore: null,

  exec: function() {
    throw new Error('Abstract method `exec` needs to be overridden');
  },

  undo: function() {
    throw new Error('Abstract method `undo` needs to be overridden');
  },

  redo: function() {
    // Default implementation, only override if there is a difference in implementation
    this.exec();
  }
});
