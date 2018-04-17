import EventDispatcher from './eventdispatcher';
import Delta from 'quill-delta';
import deltaOp from 'quill-delta/lib/op';
import { shallowEqual, deepEqual } from 'fast-equals';

const SOURCE_API = 'api';
const SOURCE_USER = 'user';
const SOURCE_SILENT = 'silent';
const empty = {};

export default class Editor extends EventDispatcher {

  constructor(options = {}) {
    super();
    this.selection = null;
    this.activeFormats = empty;
    setContents(this, options.contents || this.delta().insert('\n'));
    if (options.modules) options.modules.forEach(module => module(this));
  }

  delta(ops) {
    return new Delta(ops);
  }

  getContents(from = 0, to = this.length) {
    [ from, to ] = this._normalizeArguments(from, to);
    return this.contents.slice(from, to);
  }

  getText(from, to) {
    return this.getContents(from, to)
      .filter(op => typeof op.insert === 'string')
      .map(op => op.insert)
      .join('')
      .slice(0, -1); // remove the trailing newline
  }

  getChange(producer) {
    let change = this.delta();
    this.updateContents = singleChange => change = change.compose(singleChange);
    producer();
    delete this.updateContents;
    return change;
  }

  setContents(newContents, source, selection) {
    const change = this.contents.diff(newContents);
    return this.updateContents(change, source, selection);
  }

  setText(text, source, selection) {
    return this.setContents(this.delta().insert(text + '\n'), source, selection);
  }

  insertText(from, to, text, formats, source, selection) {
    [ from, to, text, formats, source, selection ] =
      this._normalizeArguments(from, to, text, formats, source, selection);
    if (selection == null) selection = from + text.length;
    let change = this.delta().retain(from).delete(to - from);
    const lineFormat = from === to && text.indexOf('\n') === -1 ? null : this.getLineFormat(from);
    text.split('\n').forEach((line, i) => {
      if (i) change.insert('\n', lineFormat);
      line.length && change.insert(line, formats);
    });

    change = cleanDelete(this, from, to, change);
    return this.updateContents(change, source, selection);
  }

  insertEmbed(from, to, embed, value, source, selection) {
    [ from, to, embed, value, source, selection ] =
      this._normalizeArguments(from, to, embed, value, source, selection);
    if (selection == null) selection = from + 1;
    let change = this.delta().retain(index).delete(to - from).insert({ [embed]: value });
    change = cleanDelete(this, from, to, change);
    return this.updateContents(change, source, selection);
  }

  deleteText(from, to, source, selection) {
    [ from, to, source, selection ] = this._normalizeArguments(from, to, source, selection);
    if (selection == null) selection = from;
    let change = this.delta().retain(from).delete(to - from);
    change = cleanDelete(this, from, to, change);
    return this.updateContents(change, source, from);
  }

  getLineFormat(from, to) {
    [ from, to ] = this._normalizeArguments(from, to);
    let formats;

    this.contents.getLines(from, to).forEach(line => {
      if (!line.attributes) formats = {};
      else if (!formats) formats = { ...line.attributes };
      else formats = combineFormats(formats, line.attributes);
    });

    return formats;
  }

  getTextFormat(from, to) {
    [ from, to ] = this._normalizeArguments(from, to);
    let formats;

    this.contents.getOps(from, to).forEach(({ op }) => {
      if (!op.attributes) formats = {};
      else if (!formats) formats = { ...op.attributes };
      else formats = combineFormats(formats, op.attributes);
    });

    if (!formats) formats = {};

    if (this.activeFormats !== empty) {
      Object.keys(this.activeFormats).forEach(name => {
        const value = this.activeFormats[name];
        if (value === null) delete formats[name];
        else formats[name] = value;
      });
    }

    return formats;
  }

  getFormat(from, to) {
    return { ...this.getTextFormat(from, to), ...this.getLineFormat(from, to) };
  }

  formatLine(from, to, formats, source) {
    [ from, to, formats, source ] = this._normalizeArguments(from, to, formats, source);
    const change = this.delta();

    this.contents.getLines(from, to).forEach(line => {
      if (!change.ops.length) change.retain(line.endIndex - 1);
      else change.retain(line.endIndex - line.startIndex - 1);
      // Clear out old formats on the line
      Object.keys(line.attributes).forEach(name => !formats[name] && (formats[name] = null));
      change.retain(1, formats);
    });

    return change.ops.length ? this.updateContents(change, source) : this.contents;
  }

  formatText(from, to, formats, source) {
    [ from, to, formats, source ] = this._normalizeArguments(from, to, formats, source);
    if (from === to) {
      if (this.activeFormats === empty) this.activeFormats = {};
      Object.keys(formats).forEach(key => this.activeFormats[key] = formats[key]);
      return;
    }
    Object.keys(formats).forEach(name => formats[name] === false && (formats[name] = null));
    const text = this.getText();
    const change = this.delta().retain(from);
    text.slice(from, to).split('\n').forEach(line => {
      line.length && change.retain(line.length, formats).retain(1);
    });

    return this.updateContents(change, source);
  }

  toggleLineFormat(from, to, format, source) {
    [ from, to, format, source ] = this._normalizeArguments(from, to, format, source);
    const existing = this.getLineFormat(from, to);
    if (deepEqual(existing, format)) {
      Object.keys(format).forEach(key => format[key] = null);
    }
    return this.formatLine(from, to, format, source);
  }

  toggleTextFormat(from, to, format, source) {
    [ from, to, format, source ] = this._normalizeArguments(from, to, format, source);
    const existing = this.getTextFormat(from, to);
    const isSame = Object.keys(format).every(key => format[key] === existing[key]);
    if (isSame) {
      Object.keys(format).forEach(key => format[key] = null);
    }
    return this.formatText(from, to, format, source);
  }

  removeFormat(from, to, source) {
    [ from, to, source ] = this._normalizeArguments(from, to, source);
    const formats = {};

    this.contents.getOps(from, to).forEach(({ op }) => {
      op.attributes && Object.keys(op.attributes).forEach(key => formats[key] = null);
    });

    let change = this.delta().retain(from).retain(to - from, formats);

    // If the last block was not captured be sure to clear that too
    this.contents.getLines(from, to).forEach(line => {
      const formats = {};
      Object.keys(line.attributes).forEach(key => formats[key] = null);
      change = change.compose(this.delta().retain(line.endIndex - 1).retain(1, formats));
    });

    return this.updateContents(change, source);
  }

  updateContents(change, source = SOURCE_USER, selection) {
    const oldContents = this.contents;
    const contents = normalizeContents(oldContents.compose(change));
    const length = contents.length();
    const oldSelection = this.selection;
    if (!selection) selection = this.selection ? this.selection.map(i => change.transform(i)) : oldSelection;
    selection = selection && this.getSelectedRange(selection, length - 1);

    const changeEvent = { contents, oldContents, change, selection, oldSelection, source };
    const selectionEvent = shallowEqual(oldSelection, selection) ? null : { selection, oldSelection, source };

    if (change.ops.length && this.fire('text-changing', changeEvent)) {
      setContents(this, contents);
      if (selection) this.selection = selection;

      if (source !== SOURCE_SILENT) {
        this.fire('text-change', changeEvent);
        if (selectionEvent) this.fire('selection-change', selectionEvent);
      }
      this.fire('editor-change', changeEvent);
    }

    return this.contents;
  }

  setSelection(selection, source = SOURCE_USER) {
    const oldSelection = this.selection;
    selection = this.getSelectedRange(selection);
    this.activeFormats = empty;

    if (shallowEqual(oldSelection, selection)) return false;

    this.selection = selection;
    const event = { selection, oldSelection, source };

    if (source !== SOURCE_SILENT) this.fire('selection-change', event);
    this.fire('editor-change', event);
    return true;
  }

  getSelectedRange(range = this.selection, max = this.length - 1) {
    if (range == null) return range;
    if (typeof range === 'number') range = [ range, range ];
    if (range[0] > range[1]) [range[0], range[1]] = [range[1], range[0]];
    return range.map(index => Math.max(0, Math.min(max, index)));
  }

  /**
   * Normalizes range values to a proper range if it is not already. A range is a `from` and a `to` index, e.g. 0, 4.
   * This will ensure the lower index is first. Example usage:
   * editor._normalizeArguments(5); // [5, 5]
   * editor._normalizeArguments(-4, 100); // for a doc with length 10, [0, 10]
   * editor._normalizeArguments(25, 18); // [18, 25]
   * editor._normalizeArguments([12, 13]); // [12, 13]
   * editor._normalizeArguments(5, { bold: true }); // [5, 5, { bold: true }]
   */
  _normalizeArguments(from, to, ...rest) {
    if (Array.isArray(from)) {
      if (to !== undefined || rest.length) rest.unshift(to);
      [from, to] = from;
      if (to === undefined) to = from;
    } else if (typeof from !== 'number') {
      if (to !== undefined || rest.length) rest.unshift(to);
      if (from !== undefined || rest.length) rest.unshift(from);
      from = to = 0;
    } else if (typeof to !== 'number') {
      if (to !== undefined || rest.length) rest.unshift(to);
      to = from;
    }
    from = Math.max(0, Math.min(this.length, ~~from));
    to = Math.max(0, Math.min(this.length, ~~to));
    if (from > to) {
      [from, to] = [to, from];
    }
    return [from, to].concat(rest);
  }
}

function cleanDelete(editor, from, to, change) {
  if (from !== to) {
    const lineFormat = editor.getLineFormat(from);
    if (!deepEqual(lineFormat, editor.getLineFormat(to))) {
      const lineChange = editor.getChange(() => editor.formatLine(to, lineFormat))
      change = change.compose(change.transform(lineChange));
    }
  }
  return change;
}

function normalizeContents(contents) {
  if (!contents.ops.length || contents.ops[contents.ops.length - 1].insert.slice(-1) !== '\n') contents.insert('\n');
  return contents;
}

function setContents(editor, contents) {
  normalizeContents(contents);
  contents.push = function() { return this; } // freeze from modification
  editor.contents = contents;
  editor.length = contents.length();
}

function combineFormats(formats, combined) {
  return Object.keys(combined).reduce(function(merged, name) {
    if (formats[name] == null) return merged;
    if (combined[name] === formats[name]) {
      merged[name] = combined[name];
    } else if (Array.isArray(combined[name])) {
      if (combined[name].indexOf(formats[name]) < 0) {
        merged[name] = combined[name].concat([formats[name]]);
      }
    } else {
      merged[name] = [combined[name], formats[name]];
    }
    return merged;
  }, {});
}

Delta.prototype.getLines = function(from, to, predicate) {
  let startIndex = 0;
  const lines = [];
  this.eachLine((contents, attributes, number) => {
    if (startIndex >= to) return false;
    const endIndex = startIndex + contents.length() + 1;
    if (endIndex > from || (from === to && endIndex === to)) {
      lines.push({ contents, attributes, number, startIndex, endIndex });
    }
    startIndex = endIndex;
  });
  return lines;
}

Delta.prototype.getLine = function(at) {
  return this.getLines(at, at)[0];
}

Delta.prototype.getOps = function(from, to) {
  let startIndex = 0;
  const ops = [];
  this.ops.some(op => {
    if (startIndex >= to) return true;
    const endIndex = startIndex + deltaOp.length(op);
    if (endIndex > from || (from === to && endIndex === to)) {
      ops.push({ op, startIndex, endIndex });
    }
    startIndex = endIndex;
  });
  return ops;
}

Delta.prototype.getOp = function(from) {
  return this.getOps(from, from)[0];
}
