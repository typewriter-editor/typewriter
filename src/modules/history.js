const SOURCE_USER = 'user';
const SOURCE_SILENT = 'silent';
const defaultSettings = {
  delay: 4000,
  maxStack: 500,
};

/**
 * Stores history for all user-generated changes. Like-changes will be combined until a selection or timeout by delay
 * breaks the combining. E.g. if a user types "Hello" the 5 changes will be combined into one history. If the user moves
 * the cursor somewhere and then back to the end and types " World" the next 6 changes are combined separately from the
 * first 5.
 *
 * The default settings can be adjusted by wrapping history. To remove the timeout and make it act like a textarea you
 * could set delay to zero like this:
 * modules = [
 *   view => history(view, { delay: 0 })
 * ]
 */
export default function history(view, settings = {}) {
  const editor = view.editor;
  settings = { ...defaultSettings, settings };

  const stack = {
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

  function action(event, source, dest) {
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (stack[source].length === 0) return;
    let entry = stack[source].pop();
    stack[dest].push(entry);
    lastRecorded = 0;
    ignoreChange = true;
    editor.updateContents(entry[source], SOURCE_SILENT, entry[source + 'Selection']);
    ignoreChange = false;
  }

  function record(change, contents, oldContents, selection, oldSelection) {
    const timestamp = Date.now();
    const action = getAction(change);
    stack.redo.length = 0;

    let undoChange = contents.diff(oldContents);
    // Break combining if actions are different (e.g. a delete then an insert should break it)
    if (!action || lastAction !== action) lastRecorded = 0;
    lastAction = action;

    if ((!settings.delay || lastRecorded + settings.delay > timestamp) && stack.undo.length > 0) {
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

    if (stack.undo.length > settings.maxStack) {
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


  editor.on('text-change', ({ change, contents, oldContents, selection, oldSelection, source }) => {
    if (ignoreChange) return;
    if (source === SOURCE_USER) {
      record(change, contents, oldContents, selection, oldSelection);
    } else {
      transform(change);
    }
  });

  editor.on('selection-change', ({ change }) => {
    if (change) return;
    // Break the history merging when selection changes
    lastRecorded = 0;
  });

  if (view.isMac) {
    view.on('shortcut:Cmd+Z', undo);
    view.on('shortcut:Cmd+Shift+Z', redo);
  } else {
    view.on('shortcut:Ctrl+Z', undo);
    view.on('shortcut:Cmd+Y', redo);
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
