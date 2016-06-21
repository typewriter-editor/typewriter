var History = require('../../src/editor/history');
var Command = require('../../src/editor/command');

describe('History', function() {
  var history, CommandClass;

  beforeEach(function() {
    history = new History();
    history.editor = {
      selection: {
        lastRange: {},
        range: {}
      }
    };
    history.commands = {};
    history.options = Object.assign({}, history.options);
    CommandClass = function(args) {
      Object.assign(this, args);
    };
    Command.extend(CommandClass);
  });

  it('should execute an action', function() {
    var executed = false;
    CommandClass.prototype.exec = function() {
      executed = true;
      return true;
    };

    history.commands.test = CommandClass;

    var command = history.exec('test', { foo: 'bar' });
    expect(command).to.have.property('foo', 'bar');
    expect(executed).to.be.true;
  });

  it('should undo an action', function() {
    var undone = false;
    CommandClass.prototype.exec = function() {
      executed = true;
      return true;
    };
    CommandClass.prototype.undo = function() {
      undone = true;
      return true;
    };

    history.commands.test = CommandClass;

    history.exec('test');
    var result = history.undo();
    expect(result).to.be.true;
    expect(undone).to.be.true;
  });

  it('should redo an action', function() {
    var executed = 0;
    CommandClass.prototype.exec = function() {
      executed++;
      return true;
    };
    CommandClass.prototype.undo = function() {
      return true;
    };

    history.commands.test = CommandClass;

    history.exec('test');
    history.undo();
    var result = history.redo();
    expect(result).to.be.true;
    expect(executed).to.equal(2);
  });

  it('should indicate if undo and redo can run', function() {
    CommandClass.prototype.exec = function() {
      return true;
    };
    CommandClass.prototype.undo = function() {
      return true;
    };
    history.commands.test = CommandClass;

    expect(history.canUndo).to.be.false;
    expect(history.canRedo).to.be.false;

    history.exec('test');

    expect(history.canUndo).to.be.true;
    expect(history.canRedo).to.be.false;

    history.undo();

    expect(history.canUndo).to.be.false;
    expect(history.canRedo).to.be.true;

    history.redo();

    expect(history.canUndo).to.be.true;
    expect(history.canRedo).to.be.false;
  });

  it('should clear redo after actions', function() {
    CommandClass.prototype.exec = function() {
      return true;
    };
    CommandClass.prototype.undo = function() {
      return true;
    };
    history.commands.test = CommandClass;

    history.exec('test', {});
    history.undo();

    expect(history.canRedo).to.be.true;
    history.exec('test', {});

    expect(history.canRedo).to.be.false;

    var result = history.redo();

    expect(result).to.be.false;
  });

});
