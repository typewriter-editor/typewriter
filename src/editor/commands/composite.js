module.exports = CompositeCommand;
var Command = require('../command');

/**
 * Runs multiple commands at once. These will all be undone and redone together in order.
 * @param {Array} commands An array of commands which MUST be of type Command.
 */
function CompositeCommand(args) {
  if (!args || !Array.isArray(args.commands)) {
    throw new TypeError('Invalid commands for CompositeCommand. Expected Array and got:', args);
  }
  args.commands.forEach(function(command) {
    if (!(command instanceof Command)) {
      throw new TypeError('`command` is not an instance of Command in CompositeCommand');
    }
  });
  this.commands = args.commands;
}

Command.extend(CompositeCommand, {

  exec: function() {
    this.commands.forEach(function(command) {
      command.editor = this.editor;
      command.exec();
    }, this);
  },

  undo: function() {
    this.commands.slice().reverse().forEach(function(command) {
      command.undo();
    });
  },

  redo: function() {
    this.commands.forEach(function(command) {
      command.redo();
    });
  }
});
