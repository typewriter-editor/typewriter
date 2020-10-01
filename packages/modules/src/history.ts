import { Editor, Delta, EditorRange, TextChangeEvent, SelectionChangeEvent } from '@typewriter/editor';
import { KeyboardEventWithShortcut } from './shortcuts';

const SOURCE_USER = 'user';
const SOURCE_SILENT = 'silent';

export interface StackEntry {
  redo: Delta;
  undo: Delta;
  redoSelection: EditorRange;
  undoSelection: EditorRange;
}

export interface Stack {
  undo: StackEntry[],
  redo: StackEntry[],
}

export interface Options {
  delay?: number;
  maxStack?: number;
  stack?: Stack;
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
export default function history({ maxStack = 500, delay = 0, stack = newStack() }: Options = {}) {

  return function(editor: Editor, root: HTMLElement) {
    let lastRecorded = 0;
    let lastAction = '';
    let ignoreChange = false;

    function onKeyDown(event: KeyboardEventWithShortcut) {
      switch(event.osShortcut) {
        case 'win:Ctrl+Z':
        case 'mac:Cmd+Z':
          event.preventDefault();
          undo();
          break;
        case 'win:Ctrl+Y':
        case 'mac:Cmd+Shift+Z':
          event.preventDefault();
          redo();
          break;
      }
    }

    function onInput(event: InputEvent) {
      if (event.inputType === 'historyUndo') {
        event.preventDefault();
        undo();
      } else if (event.inputType === 'historyRedo') {
        event.preventDefault();
        redo();
      }
    }

    function undo(event?: Event) {
      action(event, 'undo', 'redo');
    }

    function redo(event?: Event) {
      action(event, 'redo', 'undo');
    }

    function hasUndo() {
      return stack.undo.length > 0;
    }

    function hasRedo() {
      return stack.redo.length > 0;
    }

    function cutoff() {
      lastRecorded = 0;
    }

    function clear() {
      stack.undo.length = 0;
      stack.redo.length = 0;
    }

    function action(event: Event | undefined, source: string, dest: string) {
      if (event) {
        if (event.defaultPrevented) return;
        event.preventDefault();
      }
      if (stack[source].length === 0) return;
      const entry = stack[source].pop();
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

    function record(change: Delta, oldContents: Delta, selection: EditorRange, oldSelection: EditorRange) {
      const timestamp = Date.now();
      const action = getAction(change);
      stack.redo.length = 0;

      let undoChange = change.invert(oldContents);
      // Break combining if actions are different (e.g. a delete then an insert should break it)
      if (!action || lastAction !== action) cutoff();
      lastAction = action;

      if (lastRecorded && (!delay || lastRecorded + delay > timestamp) && stack.undo.length > 0) {
        // Combine with the last change
        const entry = stack.undo.pop();
        if (entry) {
          oldSelection = entry.undoSelection;
          undoChange = undoChange.compose(entry.undo);
          change = entry.redo.compose(change);
        }
      } else {
        lastRecorded = timestamp;
      }

      stack.undo.push({
        redo: change,
        undo: undoChange,
        redoSelection: selection,
        undoSelection: oldSelection,
      });

      if (stack.undo.length > maxStack) {
        stack.undo.shift();
      }
    }


    function transform(change: Delta) {
      stack.undo.forEach(entry => {
        entry.undo = change.transform(entry.undo, true) as Delta;
        entry.redo = change.transform(entry.redo, true) as Delta;
      });
      stack.redo.forEach(entry => {
        entry.undo = change.transform(entry.undo, true) as Delta;
        entry.redo = change.transform(entry.redo, true) as Delta;
      });
    }


    function onTextChange({ change, oldContents, selection, oldSelection, source }: TextChangeEvent) {
      if (ignoreChange) return;
      if (source === SOURCE_USER) {
        record(change, oldContents, selection, oldSelection);
      } else if (source !== SOURCE_SILENT) {
        transform(change);
      }
    }

    function onSelectionChange({ change }: TextChangeEvent) {
      if (change) return;
      // Break the history merging when selection changes without a text change
      cutoff();
    }


    editor.on('text-change', onTextChange);
    editor.on('selection-change', onSelectionChange);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('beforeinput', onInput);

    return {
      hasUndo,
      hasRedo,
      undo,
      redo,
      cutoff,
      clear,
      onDestroy() {
        editor.off('text-change', onTextChange);
        editor.off('selection-change', onSelectionChange);
        root.removeEventListener('keydown', onKeyDown);
        root.removeEventListener('beforeinput', onInput);
      }
    }
  }
}

function newStack(): Stack {
  return {
    undo: [],
    redo: [],
  };
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
