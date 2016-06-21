module.exports = History;
var Class = require('chip-utils/class');
var Command = require('./command');
var slice = Array.prototype.slice;
var commands = require('./commands/*', { mode: 'hash' });

/**
 * Holds the history of a project for a user. This can be serialzied and stored in the database because each action is
 * represented by a plain JavaScript object. The code to execute, undo, and redo these actions is contained in the
 * commands folder.
 */
function History(options) {
  this.undoStack = [];
  this.redoStack = [];
  this.composite = null;
}


Class.extend(History, {
  static: {
    // The default commands, more can be added using History.commands[commandName] = { exec: function, undo: function }
    commands: commands
  },

  // Make the commands available to "this", also allowing for substituting them on a single instance (for testing)
  commands: commands,

  // The default options, can be changed using History.options.maxHistory = 123
  options: {
    // limits the length of history stored in memory
    maxHistory: 100
  },


  /**
   * Execute a command by name with the given arguments. Each command may take different arguments.
   * @param {String} commandName The name of the command to be executed
   * @param {Object} args Zero or more arguments which will be passed to the command
   * @return {Boolean} `false` if the command failed, `true` otherwise
   */
  exec: function(commandName, args) {
    var command;
    if (commandName instanceof Command) {
      command = commandName;
    } else {
      var CommandClass = this.commands[commandName];
      if (!CommandClass) {
        throw new TypeError('No such command "' + commandName + '" exists');
      }
      command = new CommandClass(args);
    }

    command.history = this;

    // If we are in a command transaction started with `start` append this command to composite to be exec'ed later
    if (this.composite) {
      this.composite.commands.push(command);
      return command;
    }

    if (command.exec() === false) {
      return false;
    }

    command.selectionBefore = this.editor.selection.lastRange;
    command.selectionAfter = this.editor.selection.range;
    this.editor.selection.range = command.selectionAfter;

    this.undoStack.push(command);
    if (this.options.maxHistory && this.undoStack.length >= this.options.maxHistory) {
      this.undoStack = this.undoStack.slice(-this.options.maxHistory);
    }
    this.redoStack.length = 0;

    return command;
  },

  /**
   * Start a composite command. Every `exec` call after this will add to the composite until `commit` is called.
   */
  start: function() {
    return this.composite = new commands.composite({ commands: [] });
  },

  /**
   * Finishes a composite command started with `start` and executes it.
   * @return {Boolean} The result of executing the composite command
   */
  commit: function() {
    var command = this.composite;
    this.composite = null;
    if (command.commands.length === 0) return false;
    if (command.commands.length === 1) command = command.commands[0];
    return this.exec(command);
  },

  /**
   * Whether there are any actions that can be undone or not
   * @return {Boolean}
   */
  get canUndo() {
    return this.undoStack.length > 0;
  },


  /**
   * Whether there are any actions that can be redone or not
   * @return {Boolean}
   */
  get canRedo() {
    return this.redoStack.length > 0;
  },


  /**
   * Undo the last action taken
   * @return {Boolean} A `false` if there is no command to undo, `true` if the command was undone
   */
  undo: function() {
    var command = this.undoStack.pop();
    if (!command) return false;

    command.undo();
    this.editor.selection.range = command.selectionBefore;
    this.redoStack.push(command);
    return true;
  },


  /**
   * Redo the last undone action
   * @return {Boolean} A `false` if there is no command to redo, `true` if the command was redone
   */
  redo: function() {
    var command = this.redoStack.pop();
    if (!command) return false;

    command.redo();
    this.editor.selection.range = command.selectionAfter;
    this.undoStack.push(command);
    return true;
  }

});
