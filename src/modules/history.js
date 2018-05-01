const SOURCE_USER = 'user';
const SOURCE_SILENT = 'silent';
const defaultOptions = {
  delay: 0,
  maxStack: 500,
};

/**
 * History is a view module for storing user changes.
 *
 * Stores history for all user-generated changes. Like-changes will be combined until a selection or a delay timeout
 * cuts off the combining. E.g. if a user types "Hello" the 5 changes will be combined into one history entry. If
 * the user moves the cursor somewhere and then back to the end and types " World" the next 6 changes are combined
 * separately from the first 5 because selection changes add a cutoff history entries.
 *
 * The default options can be overridden by passing alternatives to history. To add a timeout to force a cutoff after
 * so many milliseconds set a delay like this:
 * ```js
 * view = new View(editor, {
 *   modules: {
 *     history: history({ delay: 4000 })
 *   }
 * })
 * ```
 */
export default function history(options = {}) {

  return view => {
    const editor = view.editor;
    options = { ...defaultOptions, options };

    const stack = options.stack || {
      undo: [],
      redo: [],
    };
    let lastRecorded = 0;
    let lastAction;
    let ignoreChange = false;

    function undo(event) {
      action(event, 'undo', 'redo');
    }

    function redo() {
      action(event, 'redo', 'undo');
    }

    function cutoff() {
      lastRecorded = 0;
    }

    function clear() {
      stack.undo.length = 0;
      stack.redo.length = 0;
    }

    function action(event, source, dest) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (stack[source].length === 0) return;
      let entry = stack[source].pop();
      stack[dest].push(entry);
      cutoff();
      ignoreChange = true;
      if (typeof entry[source] === 'function') {
        entry[source]();
      } else {
        editor.updateContents(entry[source], SOURCE_USER, entry[source + 'Selection']);
      }
      ignoreChange = false;
    }

    function record(change, contents, oldContents, selection, oldSelection) {
      const timestamp = Date.now();
      const action = getAction(change);
      stack.redo.length = 0;

      let undoChange = contents.diff(oldContents);
      // Break combining if actions are different (e.g. a delete then an insert should break it)
      if (!action || lastAction !== action) cutoff();
      lastAction = action;

      if (lastRecorded && (!options.delay || lastRecorded + options.delay > timestamp) && stack.undo.length > 0) {
        // Combine with the last change
        let entry = stack.undo.pop();
        oldSelection = entry.undoSelection;
        undoChange = undoChange.compose(entry.undo);
        change = entry.redo.compose(change);
      } else {
        lastRecorded = timestamp;
      }

      stack.undo.push({
        redo: change,
        undo: undoChange,
        redoSelection: selection,
        undoSelection: oldSelection,
      });

      if (stack.undo.length > options.maxStack) {
        stack.undo.shift();
      }
    }


    function transform(change) {
      stack.undo.forEach(function(entry) {
        entry.undo = change.transform(entry.undo, true);
        entry.redo = change.transform(entry.redo, true);
      });
      stack.redo.forEach(function(entry) {
        entry.undo = change.transform(entry.undo, true);
        entry.redo = change.transform(entry.redo, true);
      });
    }


    function onTextChange({ change, contents, oldContents, selection, oldSelection, source }) {
      if (ignoreChange) return;
      if (source === SOURCE_USER) {
        record(change, contents, oldContents, selection, oldSelection);
      } else {
        transform(change);
      }
    }

    function onSelectionChange({ change }) {
      if (change) return;
      // Break the history merging when selection changes without a text change
      cutoff();
    }


    editor.on('text-change', onTextChange);
    editor.on('selection-change', onSelectionChange);
    if (view.isMac) {
      view.on('shortcut:Cmd+Z', undo);
      view.on('shortcut:Cmd+Shift+Z', redo);
    } else {
      view.on('shortcut:Ctrl+Z', undo);
      view.on('shortcut:Cmd+Y', redo);
    }

    return {
      undo,
      redo,
      cutoff,
      options,
      destroy() {
        editor.off('text-change', onTextChange);
        editor.off('selection-change', onSelectionChange);
        if (view.isMac) {
          view.off('shortcut:Cmd+Z', undo);
          view.off('shortcut:Cmd+Shift+Z', redo);
        } else {
          view.off('shortcut:Ctrl+Z', undo);
          view.off('shortcut:Cmd+Y', redo);
        }
      }
    }
  }
}

function getAction(change) {
  if (change.ops.length === 1 || change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes) {
    const changeOp = change.ops[change.ops.length - 1];
    if (changeOp.delete) return 'delete';
    if (changeOp.insert === '\n') return 'newline';
    if (changeOp.insert) return 'insert';
  }
  return '';
}
