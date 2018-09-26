import EventDispatcher from './event-dispatcher';
import Delta from './delta';
import { shallowEqual, deepEqual } from './equal';

const SOURCE_API = 'api';
const SOURCE_USER = 'user';
const SOURCE_SILENT = 'silent';
const empty = {};

/**
 * Event for text changes, called before the change has occurred. If a listener returns false the change will be
 * canceled and not committed.
 *
 * @event Editor#text-changing
 * @type  {Object}
 * @property {Delta} change       The change which is being applied to the content
 * @property {Delta} content      The new content after the change
 * @property {Delta} oldContent   The old content before the change
 * @property {Array} seleciton    The selection after the change
 * @property {Array} oldSelection The selection before the change
 * @property {String} source      The source of the change, api, user, or silent
 */

/**
 * Event for text changes, called after the change has occurred.
 *
 * @event Editor#text-change
 * @type  {Object}
 * @property {Delta} change       The change which is being applied to the content
 * @property {Delta} content      The new content after the change
 * @property {Delta} oldContent   The old content before the change
 * @property {Array} seleciton    The selection after the change
 * @property {Array} oldSelection The selection before the change
 * @property {String} source      The source of the change, api, user, or silent
 */

/**
 * Event for selection changes. If part of a text change the `change`, `content`, and `oldContent` properties will be
 * set. Otherwise they will not be set.
 *
 * @event Editor#selection-change
 * @type  {Object}
 * @property {Delta} change       [ Optional ] The change which is being applied to the content
 * @property {Delta} content      [ Optional ] The new content after the change
 * @property {Delta} oldContent   [ Optional ] The old content before the change
 * @property {Array} seleciton    The selection after the change
 * @property {Array} oldSelection The selection before the change
 * @property {String} source      The source of the change, api, user, or silent
 */

/**
 * A Typewriter Editor handles the logic for selection and editing of contents. It has no dependency on browser APIs
 * and can be used in Node.js as easily as the browser. It has no logic to limit formatting (i.e. it does not disallow
 * using bold, headers, links, or FOOBAR), that will need to be limited outside of the editor itself.
 *
 * @fires Editor#text-changing
 * @fires Editor#text-change
 * @fires Editor#selection-change
 *
 * @readonly @property {Delta}  contents      The data model for the text editor
 * @readonly @property {Number} length        The length of the contents
 * @readonly @property {String} text          The text of the contents
 * @readonly @property {Array}  selection     The current editor selection, a tuple of `[ from, to ]` or `null`
 * @readonly @property {Object} activeFormats The currently active formats (formats that will apply on the next insert)
 */
export default class Editor extends EventDispatcher {

  /**
   * Create a new Typewriter editor.
   *
   * @param {Object} options Options for this editor include initial `contents` and `modules`:
   * @param {Delta}  options.contents The initial contents of this editor
   * @param {Array}  options.modules  An array of functions which will be executed with the editor being passed as an
   *                                  argument.
   */
  constructor(options = {}) {
    super();
    this.contents = null;
    this.length = 0;
    this.selection = null;
    this.activeFormats = empty;
    setContents(this, options.contents || this.delta().insert('\n'));
    this.modules = {};
    this._queuedEvents = []; // Event queuing ensure they are fired in order
    if (options.modules) Object.keys(options.modules).forEach(key => this.modules[key] = options.modules[key](this));
  }

  /**
   * Convenience method for creating a new delta (allows other modules to not need to require Delta). Used for creating
   * change deltas for updating the contents.
   *
   * @param {Array} ops [Optional] The initial ops for the delta
   * @returns {Delta}   A new Delta object
   */
  delta(ops) {
    return new Delta(ops);
  }

  /**
   * Returns the contents or a slice of them.
   *
   * @param {Number} from The starting index
   * @param {Number} to   The ending index
   * @returns {Delta}     The contents of this editor
   */
  getContents(from = 0, to = this.length) {
    [ from, to ] = this._normalizeRange(from, to);
    return this.contents.slice(from, to);
  }

  /**
   * Returns the text for the editor or a slice of it.
   *
   * @param {Number} from The starting index
   * @param {Number} to   The ending index
   * @returns {String}    The text in the editor
   */
  getText(from = 0, to = this.length - 1) {
    [ from, to ] = this._normalizeRange(from, to);
    return this.getContents(from, to)
      .filter(op => typeof op.insert === 'string')
      .map(op => op.insert)
      .join('');
  }

  /**
   * Returns the text for the editor with spaces in place of embeds. This can be used to determine the index of given
   * words or lines of text within the contents.
   *
   * @param {Number} from The starting index
   * @param {Number} to   The ending index
   * @returns {String}    The text in the editor with embed spaces
   */
  getExactText(from = 0, to = this.length - 1) {
    [ from, to ] = this._normalizeRange(from, to);
    return this.getContents(from, to)
      .map(op => typeof op.insert === 'string' ? op.insert : ' ')
      .join('');
  }

  /**
   * Set the selection to a new location (or null for no selection). Will return false if the new selection is the same
   * as the old selection. Dispatches "selection-change" once the selection is changed. This "selection-change" event
   * won't have { contents, oldContnts, change } in it since the selection is changing without any content updates.
   *
   * @param {Number} from      The starting index
   * @param {Number} to        The ending index
   * @param {String} source    The source of the change, user, api, or silent
   * @returns {Boolean}        Whether the selection changed or not
   */
  setSelection(from, to, source = SOURCE_USER) {
    const oldSelection = this.selection;
    let selection;

    if (from === null) {
      selection = null;
      if (typeof to === 'string') source = to;
    } else {
      [from, to, source ] = this._normalizeSelection(from, to, source);
      selection = [ from, to ].map(i => Math.min(i, this.length - 1));
    }

    if (shallowEqual(oldSelection, selection)) return false;

    // Reset the active formats when selection changes (do this before setting selection)
    this.activeFormats = selection ? this.getTextFormat(Math.min(selection[0], selection[1])) : empty;
    this.selection = selection;
    const event = { selection, oldSelection, source };

    if (source !== SOURCE_SILENT) this.fire('selection-change', event);
    this.fire('editor-change', event);
    return true;
  }

  /**
   * The method that all other methods use to update the contents (even setContents & setText). This method will
   * dispatch the event "text-changing". If a listener returns `false` then the change will be canceled and null will
   * be returned. Otherwise, the change will be successful and if the `source` is not "silent" a "text-change" event
   * will be fired with an event object containing `{ contents, oldContents, selection, oldSelection, source }`. If the
   * selection has changed as part of this update a "selection-change" event will also be fired with the same event
   * object.
   *
   * @param {Delta} change    A delta change to the document
   * @param {String} source   The source of the change, user, api, or silent
   * @param {Array} selection Optional selection after the change has been applied
   * @returns {Delta}         Returns the change when successful, or null if not
   */
  updateContents(change, source = SOURCE_API, selection) {
    if (!change.chop().ops.length) return null;

    const oldContents = this.contents;
    const contents = normalizeContents(oldContents.compose(change));
    const length = contents.length();
    const oldSelection = this.selection;
    if (!selection) selection = oldSelection ? oldSelection.map(i => change.transform(i)) : oldSelection;
    selection = selection && this.getSelectedRange(selection, length - 1);

    const changeEvent = { contents, oldContents, change, selection, oldSelection, source };
    const selectionChanged = !shallowEqual(oldSelection, selection);

    if (!this.fire('text-changing', changeEvent)) return null;

    setContents(this, contents);

    if (selection) {
      // Reset the active formats when selection changes (do this before setting selection)
      this.activeFormats = selection ? this.getTextFormat(Math.min(selection[0], selection[1])) : empty;
      this.selection = selection;
    }

    const events = [];
    if (source !== SOURCE_SILENT) {
      events.push([ 'text-change', changeEvent ]);
      if (selectionChanged) events.push([ 'selection-change', changeEvent ]);
    }
    events.push([ 'editor-change', changeEvent ]);
    this._queueEvents(events);
    return change;
  }

  /**
   * Sets the entire contents of the editor. This will calculate the difference between the old content and the new and
   * only apply the difference, if any.
   *
   * @param {Delta} newContents The contents of the editor, as a delta object
   * @param {String} source     The source of the change, user, api, or silent
   * @param {Array} selection   Optional selection after the change has been applied
   * @returns {Delta}           Returns the change when successful, or null if not
   */
  setContents(newContents, source, selection) {
    const change = this.contents.diff(normalizeContents(newContents));
    return this.updateContents(change, source, selection);
  }

  /**
   * Sets the text content of the editor, removing existing contents and formatting.
   *
   * @param {String} text     Set the contents of this editor as text
   * @param {String} source   The source of the change, user, api, or silent
   * @param {Array} selection Optional selection after the change has been applied
   * @returns {Delta}         Returns the change when successful, or null if not
   */
  setText(text, source, selection) {
    return this.setContents(this.delta().insert(text + '\n'), source, selection);
  }

  /**
   * Inserts text into the content of the editor, removing text between from and to if provided. If `text` is a newline
   * ("\n") then the formats will apply to the line, otherwise they will apply to the text only (even if there are
   * newlines in the text).
   *
   * @param {Number} from      Insert the text at this index, can also be a range Array tuple, default 0
   * @param {Number} to        If provided and not equal to `from` will delete the text between `from` and `to`
   * @param {String} text      The text to insert into the editor's contents
   * @param {String} formats   The formats of the inserted text. If null the formats at `from` will be used.
   * @param {String} source    The source of the change, user, api, or silent
   * @param {Array}  selection Optional selection after the change has been applied
   * @returns {Delta}          Returns the change when successful, or null if not
   */
  insertText(from, to, text, formats, source, selection) {
    [ from, to, text, formats, source, selection ] =
      this._normalizeRange(from, to, text, formats, source, selection);

    // If we are not inserting a newline, make sure from and to are within the selectable range
    if (text !== '\n') [ from, to ] = this.getSelectedRange([ from, to ]);

    if (typeof formats === 'string') [ formats, source, selection ] = [ null, formats, source ];
    if (selection == null && this.selection !== null) selection = from + text.length;
    let change = this.delta().retain(from).delete(to - from);

    if (text === '\n') {
      change.insert('\n', formats || this.getLineFormat(from));
    } else {
      const lineFormat = text.indexOf('\n') === -1 ? null : this.getLineFormat(from);
      const textFormat = formats || this.getTextFormat(from);
      text.split('\n').forEach((line, i) => {
        if (i) change.insert('\n', lineFormat);
        line.length && change.insert(line, textFormat);
      });
    }

    change = cleanDelete(this, from, to, change);
    return this.updateContents(change, source, selection);
  }

  /**
   * Inserts an embed into the content of the editor, removing text between from and to if provided.
   *
   * @param {Number} from      Insert the embed at this index, can also be a range Array tuple, default 0
   * @param {Number} to        If provided and not equal to `from` will delete the text between `from` and `to`
   * @param {String} embed     Insert the text into the editor's contents
   * @param {mixed}  value     Insert the text into the editor's contents
   * @param {String} formats   The formats of the inserted text. If null the formats at `from` will be used.
   * @param {String} source    The source of the change, user, api, or silent
   * @param {Array}  selection Optional selection after the change has been applied
   * @returns {Delta}          Returns the change when successful, or null if not
   */
  insertEmbed(from, to, embed, value, formats, source, selection) {
    [ from, to, embed, value, source, selection ] =
      this._normalizeRange(from, to, embed, value, source, selection);
    if (typeof formats === 'string') [ formats, source, selection ] = [ null, formats, source ];
    if (from >= this.length) from = this.length - 1;
    if (to >= this.length) to = this.length - 1;
    if (selection == null && this.selection !== null) selection = from + 1;
    const textFormat = formats || this.getTextFormat(from);
    let change = this.delta().retain(from).delete(to - from).insert({ [embed]: value }, textFormat);
    change = cleanDelete(this, from, to, change);
    return this.updateContents(change, source, selection);
  }

  /**
   * Deletes text from `from` to `to`.
   *
   * @param {Number} from      Insert the text as this index, can also be a range Array tuple, default 0
   * @param {Number} to        Will delete the text between `from` and `to`
   * @param {String} source    The source of the change, user, api, or silent
   * @param {Array}  selection Optional selection after the change has been applied
   * @returns {Delta}          Returns the change when successful, or null if not
   */
  deleteText(from, to, source, selection) {
    [ from, to, source, selection ] = this._normalizeRange(from, to, source, selection);
    if (from === to) return null;
    if (selection == null && this.selection !== null) selection = from;
    let change = this.delta().retain(from).delete(to - from);
    change = cleanDelete(this, from, to, change);
    return this.updateContents(change, source, selection);
  }

  /**
   * Get the line formats for the line that `from` is in to the line that `to` is in. Returns only the common formats
   * between all the lines. If `from` equals `to` (or `to` is not provided) the formats will be all of those for the
   * line `from` is on. If two lines are touched and they have different formats, an empty object will be returned.
   *
   * @param {Number} from Getting line formats starting at `from`
   * @param {Number} to   Getting line formats ending at `to`
   * @returns {Object}    An object with all the common formats among the lines which intersect from and to
   */
  getLineFormat(from, to) {
    [ from, to ] = this._normalizeRange(from, to);
    let formats;

    this.contents.getLines(from, to).forEach(line => {
      if (!line.attributes) formats = {};
      else if (!formats) formats = { ...line.attributes };
      else formats = combineFormats(formats, line.attributes);
    });

    return formats;
  }

  /**
   * Get the text formats for all the text from `from` to `to`. Returns only the common formats between the two indexes.
   * Will also return the `activeFormats`. Active formats are those which are toggled on when the selection is collapsed
   * (from and to are equal) indicating inserted text should use (or not use) those formats.
   *
   * @param {Number} from Getting text formats starting at `from`
   * @param {Number} to   Getting text formats ending at `to`
   * @returns {Object}    An object with all the common formats among the text
   */
  getTextFormat(from, to) {
    [ from, to ] = this._normalizeRange(from, to);
    let formats;

    // optimize for current selection
    const seleciton = this.selection;
    if (from === to && shallowEqual(this.selection, [ from, to ])) {
      return this.activeFormats;
    }

    this.contents.getOps(from, to).forEach(({ op }) => {
      if (/^\n+$/.test(op.insert)) return;
      if (!op.attributes) formats = {};
      else if (!formats) formats = { ...op.attributes };
      else formats = combineFormats(formats, op.attributes);
    });

    if (!formats) formats = {};

    return formats;
  }

  /**
   * Get the text and line formats for all the lines and text from `from` to `to`.
   *
   * @param {Number} from Getting line and text formats starting at `from`
   * @param {Number} to   Getting line and text formats ending at `to`
   * @returns {Object}    An object with all the common formats among the lines and text which intersect from and to
   */
  getFormat(from, to) {
    return { ...this.getTextFormat(from, to), ...this.getLineFormat(from, to) };
  }

  /**
   * Formats the lines intersected by `from` and `to` with the given line formats. To remove an existing format pass in
   * `null` or `false` to turn it off (e.g. `{ blockquote: false }`).
   *
   * @param {Number} from      The starting index
   * @param {Number} to        The ending index
   * @param {String} formats   The formats for the line
   * @param {String} source    The source of the change, user, api, or silent
   * @returns {Delta}          Returns the change when successful, or null if not
   */
  formatLine(from, to, formats, source) {
    [ from, to, formats, source ] = this._normalizeRange(from, to, formats, source);
    const change = this.delta();

    this.contents.getLines(from, to).forEach(line => {
      if (!change.ops.length) change.retain(line.end - 1);
      else change.retain(line.end - line.start - 1);
      // Clear out old formats on the line
      Object.keys(line.attributes).forEach(name => !formats[name] && (formats[name] = null));
      change.retain(1, formats);
    });
    change.chop();

    return change.ops.length ? this.updateContents(change, source) : null;
  }

  /**
   * Adds additional attributes or classes to the lines intersected by `from` and `to`. Markups are easy to nest to add
   * additional attributes/classes, but you cannot do that with lines/blocks.
   * Setting a class to false will remove a previous decoration, but it will not remove a class which is part of the
   * block definition. This method is a cross-over with HTML view and should be used sparingly.
   *
   * Example:
   * ```js
   * editor.decorateLine(0, {
   *   attributes: { 'data-placeholder': 'Enter Text' },
   *   classes: { active: true, empty: true }
   * });
   * // <p data-placeholder="Enter Text" class="active empty">
   * ```
   *
   * @param {Number} from        The starting index
   * @param {Number} to          The ending index
   * @param {String} decorations The attributes/classes for the line.
   * @param {String} source      The source of the change, user, api, or silent
   * @returns {Delta}            Returns the change when successful, or null if not
   */
  decorateLine(from, to, decorations, source) {
    [ from, to, decorations, source ] = this._normalizeRange(from, to, decorations, source);
    const change = this.delta();

    if (decorations.attributes) {
      Object.keys(decorations.attributes).forEach(name => {
        if (decorations.attributes[name] === '') decorations.attributes[name] = true;
      });
    }

    this.contents.getLines(from, to).forEach(line => {
      if (!change.ops.length) change.retain(line.end - 1);
      else change.retain(line.end - line.start - 1);
      let { attributes, classes } = decorations;

      // Merge with any existing formats on the line
      if (attributes) {
        if (line.attributes.attributes) {
          decorations = { ...decorations, attributes: { ...line.attributes.attributes, ...attributes }};
        }

        Object.keys(attributes).forEach(name => {
          const value = attributes[name];
          if (value == null || value === false) delete decorations.attributes[name];
        });

        if (!Object.keys(decorations.attributes).length) {
          decorations = { ...decorations, attributes: null };
        }
      }
      if (classes) {
        if (line.attributes.classes) {
          decorations = { ...decorations, classes: { ...line.attributes.classes, ...classes }};
        }

        Object.keys(classes).forEach(name => {
          if (!classes[name]) delete decorations.classes[name];
        });

        if (!Object.keys(decorations.classes).length) {
          decorations = { ...decorations, classes: null };
        }
      }

      change.retain(1, decorations);
    });
    change.chop();

    return change.ops.length ? this.updateContents(change, source) : null;
  }

  /**
   * Formats the text from `from` to `to` with the given text formats. To remove an existing format pass in `null` or
   * `false` to turn it off (e.g. `{ bold: false }`).
   *
   * @param {Number} from      The starting index
   * @param {Number} to        The ending index
   * @param {String} formats   The formats for the text
   * @param {String} source    The source of the change, user, api, or silent
   * @returns {Delta}          Returns the change when successful, or null if not
   */
  formatText(from, to, formats, source) {
    [ from, to, formats, source ] = this._normalizeRange(from, to, formats, source);
    if (from === to) {
      if (this.activeFormats === empty) this.activeFormats = {};
      Object.keys(formats).forEach(key => {
        const value = formats[key];
        if (value == null || value === false) delete this.activeFormats[key];
        else this.activeFormats[key] = value;
      });
      return;
    }
    Object.keys(formats).forEach(name => formats[name] === false && (formats[name] = null));
    const change = this.delta().retain(from);
    this.getText(from, to).split('\n').forEach(line => {
      line.length && change.retain(line.length, formats);
      change.retain(1);
    });
    change.chop();

    return this.updateContents(change, source);
  }

  /**
   * Toggles the line formats from `from` to `to` with the given line formats. If the line has the exact formats already
   * they will be removed, otherwise they will be added.
   *
   * @param {Number} from      The starting index
   * @param {Number} to        The ending index
   * @param {String} formats   The formats for the line
   * @param {String} source    The source of the change, user, api, or silent
   * @returns {Delta}          Returns the change when successful, or null if not
   */
  toggleLineFormat(from, to, format, source) {
    [ from, to, format, source ] = this._normalizeRange(from, to, format, source);
    const existing = this.getLineFormat(from, to);
    if (deepEqual(existing, format)) {
      Object.keys(format).forEach(key => format[key] = null);
    }
    return this.formatLine(from, to, format, source);
  }

  /**
   * Toggles the text formats from `from` to `to` with the given text formats. If the text has the exact formats already
   * they will be removed, otherwise they will be added.
   *
   * @param {Number} from      The starting index
   * @param {Number} to        The ending index
   * @param {String} formats   The formats for the text
   * @param {String} source    The source of the change, user, api, or silent
   * @returns {Delta}          Returns the change when successful, or null if not
   */
  toggleTextFormat(from, to, format, source) {
    [ from, to, format, source ] = this._normalizeRange(from, to, format, source);
    const existing = this.getTextFormat(from, to);
    const isSame = Object.keys(format).every(key => format[key] === existing[key]);
    if (isSame) {
      Object.keys(format).forEach(key => format[key] = null);
    }
    return this.formatText(from, to, format, source);
  }

  /**
   * Removes all formatting, text and line formats, for the text and lines from `from` to `to`.
   *
   * @param {Number} from      The starting index
   * @param {Number} to        The ending index
   * @param {String} formats   The formats for the text
   * @param {String} source    The source of the change, user, api, or silent
   * @returns {Delta}          Returns the change when successful, or null if not
   */
  removeFormat(from, to, source) {
    [ from, to, source ] = this._normalizeRange(from, to, source);
    const formats = {};

    this.contents.getOps(from, to).forEach(({ op }) => {
      op.attributes && Object.keys(op.attributes).forEach(key => formats[key] = null);
    });

    let change = this.delta().retain(from).retain(to - from, formats);

    // If the last block was not captured be sure to clear that too
    this.contents.getLines(from, to).forEach(line => {
      const formats = {};
      Object.keys(line.attributes).forEach(key => formats[key] = null);
      change = change.compose(this.delta().retain(line.end - 1).retain(1, formats));
    });

    return this.updateContents(change, source);
  }

  /**
   * Create a change delta calling one or more methods on the editor. The changes will not be applied as normal but will
   * be collated into a single change delta and returned from this methnod. Example:
   * ```js
   * var change = editor.getChange(function() {
   *   editor.deleteText(0, 5);
   *   editor.insertText('\n', { blockquote: true });
   *   editor.formatText(10, 20, { bold: true });
   * });
   *
   * editor.updateContents(change, 'user');
   * ```
   *
   * @param {Function} producer A function in which to call methods on the editor to produce a change
   * @returns {Delta}           The sum of all the changes made within the producer
   */
  getChange(producer) {
    let change = this.delta();
    this.updateContents = singleChange => {
      if (singleChange.ops.length) {
        change = change.compose(singleChange);
        return singleChange;
      } else {
        return null;
      }
    };
    producer(this);
    delete this.updateContents;
    return change;
  }

  /**
   * Make several changes to the editor apply all at one in one commit. Changes made with the transaction will be
   * applied all together and the "text-changing", "text-change", and "selection-change" events will be dispatched only
   * once. Use this to combine multiple changes into one.
   *
   * @param {Function} producer A function which should make changes with the editor
   * @param {String} source     The source of the change, user, api, or silent
   * @param {Array} selection   Optional selection after the change has been applied
   * @returns {Delta}           Returns the change when successful, or null if not
   */
  transaction(producer, source, selection) {
    const change = this.getChange(producer);
    return this.updateContents(change, source, selection);
  }

  /**
   * Returns the selected range (or the provided range) in index order (lowest number first) and within the bounds of
   * the content, between 0 and content.length() - 1 (the selection cannot be past the trailing newline).
   *
   * @param {Array} range Optional range, defaults to current selection
   * @param {Number} max  The maxium number the range can be
   */
  getSelectedRange(range = this.selection, max = this.length - 1) {
    if (range == null) return range;
    if (typeof range === 'number') range = [ range, range ];
    if (range[0] > range[1]) [range[0], range[1]] = [range[1], range[0]];
    return range.map(index => Math.max(0, Math.min(max, index)));
  }

  _queueEvents(events) {
    const alreadyRunning = this._queuedEvents.length;
    this._queuedEvents.push(...events);
    if (alreadyRunning) return;
    while (this._queuedEvents.length) {
      const event = this._queuedEvents.shift();
      this.fire(...event);
    }
  }

  /**
   * Normalizes range values to a proper range if it is not already. A range is a `from` and a `to` index, e.g. 0, 4.
   * This will ensure the lower index is first. Example usage:
   * editor._normalizeRange(5); // [5, 5]
   * editor._normalizeRange(-4, 100); // for a doc with length 10, [0, 10]
   * editor._normalizeRange(25, 18); // [18, 25]
   * editor._normalizeRange([12, 13]); // [12, 13]
   * editor._normalizeRange(5, { bold: true }); // [5, 5, { bold: true }]
   */
  _normalizeRange(from, to, ...rest) {
    [ from, to, ...rest ] = this._normalizeSelection(from, to, ...rest);
    if (from > to) [from, to] = [to, from];
    return [from, to].concat(rest);
  }

  _normalizeSelection(from, to, ...rest) {
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
    from = Math.max(0, Math.min(this.length, Math.floor(from)));
    to = Math.max(0, Math.min(this.length, Math.floor(to)));
    return [from, to].concat(rest);
  }
}

// Ensures the format for the current line in a delete remains the same when multiple lines are deleted. This is needed
// because the last line holds the formatting after a delete, but the first line is expected to be the retained format
function cleanDelete(editor, from, to, change) {
  if (from !== to) {
    const line = editor.contents.getLine(from);
    if (!line.ops.length() && to === from + 1) return change;
    const lineFormat = editor.getLineFormat(from);
    if (!deepEqual(lineFormat, editor.getLineFormat(to))) {
      const lineChange = editor.getChange(() => editor.formatLine(to, lineFormat))
      change = change.compose(change.transform(lineChange));
    }
  }
  return change;
}

// Ensures contents end with a newline
function normalizeContents(contents) {
  // Contents only have inserts. Deletes and retains belong to changes only.
  contents.ops = contents.ops.filter(op => op.insert);
  const lastOp = contents.ops[contents.ops.length - 1];
  if (!lastOp || typeof lastOp.insert !== 'string' || lastOp.insert.slice(-1) !== '\n') contents.insert('\n');
  return contents;
}

// Delta no operation method
function deltaNoop() {
  return this;
}

// Sets the contents onto the editor after ensuring they end in a newline, freezes the contents from change, and
// updates the length and text of the editor to the latest
function setContents(editor, contents) {
  contents = normalizeContents(contents);
  contents.freeze();
  editor.contents = contents;
  editor.length = contents.length();
}

// Combine formats removing ones that don't exist in both and creating an array for those with multiple values
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
