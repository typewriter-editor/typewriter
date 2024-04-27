import { Delta, TextChange, TextDocument } from '@typewriter/document';
import Editor, { EditorChangeEvent } from '../Editor';
import { Source, SourceString } from '../Source';

export interface StackEntry {
  redo: TextChange;
  undo: TextChange;
}

export interface UndoStack {
  undo: StackEntry[],
  redo: StackEntry[],
}

export interface Options {
  delay: number;
  maxStack: number;
  unrecordedSources: Set<SourceString>;
}

// Default history module
export const history = initHistory();

export interface HistoryModule {
  options: Options;
  hasUndo: () => boolean;
  hasRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  cutoffHistory: () => void;
  clearHistory: () => void;
  setStack: (value: UndoStack) => void;
  getStack: () => UndoStack;
  destroy(): void;
}

/**
 * History is a view module for storing user changes and undoing/redoing those changes.
 *
 * Stores history for all user-generated changes. Like-changes will be combined until a selection or a delay timeout
 * cuts off the combining. E.g. if a user types "Hello" the 5 changes will be combined into one history entry. If
 * the user moves the cursor somewhere and then back to the end and types " World" the next 6 changes are combined
 * separately from the first 5 because selection changes add a cutoff history entries.
 *
 * The default options can be overridden by passing alternatives to history. To add a timeout to force a cutoff after
 * so many milliseconds set a delay like this:
 * ```js
 * const modules = {
 *   history: history({ delay: 4000 })
 * };
 * ```
 */
export function initHistory(initOptions: Partial<Options> = {}) {

  return function(editor: Editor) {
    let lastRecorded = 0;
    let lastAction = '';
    let ignoreChange = false;
    let stack = undoStack();
    const options: Options = { maxStack: 500, delay: 0, unrecordedSources: new Set(), ...initOptions };

    function onBeforeInput(event: InputEvent) {
      if (event.inputType === 'historyUndo') {
        event.preventDefault();
        undo();
      } else if (event.inputType === 'historyRedo') {
        event.preventDefault();
        redo();
      }
    }

    function undo() {
      action('undo', 'redo');
    }

    function redo() {
      action('redo', 'undo');
    }

    function hasUndo() {
      return stack.undo.length > 0;
    }

    function hasRedo() {
      return stack.redo.length > 0;
    }

    function cutoffHistory() {
      lastRecorded = 0;
    }

    function clearHistory() {
      stack = undoStack();
    }

    function action(source: string, dest: string) {
      if (stack[source].length === 0) return;
      const entry = stack[source].pop();
      stack[dest].push(entry);
      cutoffHistory();
      ignoreChange = true;
      if (typeof entry[source] === 'function') {
        entry[source]();
      } else {
        editor.update(entry[source], Source.history);
      }
      ignoreChange = false;
    }


    function record(change: TextChange, oldDoc: TextDocument) {
      const timestamp = Date.now();
      const action = getAction(change);
      stack.redo.length = 0;

      const undo = new TextChange(null, change.delta.invert(oldDoc.toDelta()), oldDoc.selection);

      // Break combining if actions are different (e.g. a delete then an insert should break it)
      if (!action || lastAction !== action) cutoffHistory();
      lastAction = action;

      if (lastRecorded && (!options.delay || lastRecorded + options.delay > timestamp) && stack.undo.length) {
        // Combine with the last change
        const entry = stack.undo[stack.undo.length - 1];
        entry.redo.delta = entry.redo.delta.compose(change.delta);
        entry.redo.selection = change.selection;
        entry.undo.delta = undo.delta.compose(entry.undo.delta);
      } else {
        const redo = new TextChange(null, change.delta, change.selection);
        lastRecorded = timestamp;
        stack.undo.push({ redo, undo });
      }

      if (stack.undo.length > options.maxStack) {
        stack.undo.shift();
      }
    }


    function onChange({ change, old, source }: EditorChangeEvent) {
      if (!change) return clearHistory();
      if (ignoreChange) return;
      if (!change.contentChanged) return cutoffHistory();
      if (source !== Source.api && !options.unrecordedSources.has(source)) {
        record(change, old);
      } else {
        transformHistoryStack(stack, change);
      }
    }

    // Advanced, only use this if the stack matches the document
    // e.g. use transformStack when changes come in for a document that isn't loaded
    function setStack(value: UndoStack) {
      stack = value;
    }

    function getStack() {
      return stack;
    }


    return {
      options,
      hasUndo,
      hasRedo,
      undo,
      redo,
      cutoffHistory,
      clearHistory,
      setStack,
      getStack,
      getActive() {
        return { undo: hasUndo(), redo: hasRedo() };
      },
      commands: {
        undo,
        redo,
      },
      shortcuts: {
        'win:Ctrl+Z': 'undo',
        'mac:Cmd+Z': 'undo',
        'win:Ctrl+Y': 'redo',
        'mac:Cmd+Shift+Z': 'redo',
      },
      init() {
      editor.on('change', onChange);
      editor.root.addEventListener('beforeinput', onBeforeInput);
      },
      destroy() {
        editor.off('change', onChange);
        editor.root.removeEventListener('beforeinput', onBeforeInput);
      }
    }
  }
}

export function undoStack(): UndoStack {
  return {
    undo: [],
    redo: [],
  };
}

export function transformHistoryStack(stack: UndoStack, delta: TextChange | Delta) {
  const change = (delta as Delta).ops ? new TextChange(null, delta as Delta) : delta as TextChange;

  stack.undo.forEach(entry => {
    entry.undo = change.transform(entry.undo, true);
    entry.redo = change.transform(entry.redo, true);
  });
  stack.redo.forEach(entry => {
    entry.undo = change.transform(entry.undo, true);
    entry.redo = change.transform(entry.redo, true);
  });
}

function getAction(change: TextChange) {
  const { ops } = change.delta;
  let head = 0, tail = ops.length - 1;
  if (ops[head].retain && !ops[head].attributes) head++
  if (ops[tail].retain === 1 && ops[tail].attributes?.id) tail--;
  if (head === tail) {
    const changeOp = ops[head];
    if (changeOp.delete) return 'delete';
    if (changeOp.insert === '\n') return 'newline';
    if (typeof changeOp.insert === 'string') return 'insert';
  }
  return '';
}
