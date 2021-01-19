import Editor from '../Editor';
import Line from '../doc/Line';
import { addShortcutsToEvent, KeyboardEventWithShortcut } from './shortcutFromEvent';
import { normalizeRange } from '../doc/EditorRange';


// A list of bad characters that we don't want coming in from pasted content (e.g. "\f" aka line feed)
const EMPTY_OBJ = {};

// Basic keyboard module.
export function keyboard(editor: Editor) {


  function onEnter(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();

    const { typeset: { lines }, doc } = editor;
    const { selection } = doc;

    if (!selection) return;
    const [ at, to ] = selection;
    const isCollapsed = at === to;

    const line = doc.getLineAt(selection[0]);
    const [ start, end ] = doc.getLineRange(selection[0]);

    let attributes = line.attributes;
    let options: { dontFixNewline?: boolean } | undefined;
    const type = lines.findByAttributes(attributes, true);
    const contentLength = line.length - 1;
    const atStart = to === start;
    const atEnd = to === end - 1;

    if (!contentLength && type !== lines.default && !type.contained && !type.defaultFollows && !type.frozen && isCollapsed) {
      // Convert a bullet point into a paragraph
      editor.formatLine(EMPTY_OBJ);
    } else {
      if (atEnd && (type.nextLineAttributes || type.defaultFollows || type.frozen)) {
        attributes = type.nextLineAttributes ? type.nextLineAttributes(attributes) : EMPTY_OBJ;
      } else if (atStart) {
        if (type.defaultFollows) attributes = EMPTY_OBJ;
        options = { dontFixNewline: true };
      }
      editor.insert('\n', attributes, selection, options);
    }
  }


  function onShiftEnter(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();
    const { typeset, doc } = editor;
    if (!typeset.embeds.get('br')) return;
    if (!doc.selection) return;
    editor.insert({ br: true });
  }


  function onBackspace(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const { typeset: { lines }, doc } = editor;
    const { selection } = doc;
    if (!selection) return;
    const isCollapsed = selection[0] === selection[1], at = selection[0];
    const [ start ] = doc.getLineRange(selection[0]);

    if (isCollapsed && at !== start) return; // Allow the system to handle non-line-collapsing deletes

    event.preventDefault();

    if (selection[0] + selection[1] === 0) {
      // At the beginning of the document
      unindent(doc.getLineAt(selection[0]), true);
    } else {
      const range = normalizeRange(selection);
      const line = doc.getLineAt(range[0]);
      const type = lines.findByAttributes(line.attributes, true);

      if (selection[0] === selection[1] && selection[0] === doc.getLineRange(selection[0])[0] && !type.contained) {
        // At the beginning of a line
        if (unindent(doc.getLineAt(selection[0]))) return;

        // Delete the previous line if it is empty
        const prev = doc.lines[doc.lines.indexOf(line) - 1];
        if (prev && prev.length === 1 && line.length !== 1) {
          return editor.update(
            editor.change.delete([ range[0] - 2, range[1] - 1 ]).select(range[0] - 1)
          );
        }
      }

      editor.delete(-1, { dontFixNewline: type.frozen });
    }


    function unindent(line: Line, force?: boolean) {
      if (!line) return;
      const type = lines.findByAttributes(line.attributes, true);
      if (!type) return;
      if (type.indentable && line.attributes.indent) {
        editor.outdent();
        return true;
      }
      if (force || type !== lines.default && !type.defaultFollows) {
        editor.formatLine(EMPTY_OBJ);
        return true;
      }
    }
  }


  function onDelete(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const { doc } = editor;
    const { selection } = doc;
    if (!selection) return;
    const isCollapsed = selection[0] === selection[1], at = selection[0];
    const [ start, end ] = doc.getLineRange(selection[0]);

    if (isCollapsed && at !== end - 1) return; // Allow the system to handle non-line-collapsing deletes
    event.preventDefault();

    let options: {dontFixNewline: boolean} | undefined;
    if (selection[0] === selection[1]) {
      const range = normalizeRange(selection);
      const line = doc.getLineAt(range[0]);
      // Delete the next line if it is empty
      const next = doc.lines[doc.lines.indexOf(line) - 1];
      if (line.length === 1 && next && next.length !== 1) {
        options = { dontFixNewline: true };
      }
    }

    editor.delete(1, options);
  }


  function onTab(event: KeyboardEventWithShortcut) {
    if (event.defaultPrevented) return;
    event.preventDefault();
    const shortcut = event.modShortcut;
    if (shortcut === 'Tab' || shortcut === 'Mod+]') editor.indent();
    else editor.outdent();
  }



  function onKeyDown(event: KeyboardEventWithShortcut) {
    if (event.isComposing) return;

    addShortcutsToEvent(event);

    const checkShortcut = shortcut => {
      const command = editor.shortcuts[shortcut];
      if (command && editor.commands[command]) {
        event.preventDefault();
        return editor.commands[command]() !== false;
      }
    }

    if (checkShortcut(event.shortcut)) return;
    if (checkShortcut(event.osShortcut)) return;
    if (checkShortcut(event.modShortcut)) return;

    switch (event.modShortcut) {
      case 'Enter': return onEnter(event);
      case 'Shift+Enter': return onShiftEnter(event);
      case 'Tab':
      case 'Shift+Tab':
      case 'Mod+]':
      case 'Mod+[': return onTab(event);
    }

    switch (event.modShortcut?.split('+').pop()) {
      case 'Backspace': return onBackspace(event);
      case 'Delete': return onDelete(event);
      default: return;
    }
  }

  return {
    init() {
      editor.root.addEventListener('keydown', onKeyDown);
    },
    destroy() {
      editor.root.removeEventListener('keydown', onKeyDown);
    }
  }
}
