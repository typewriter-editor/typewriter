import Editor from '../Editor';
import Line from '../doc/Line';
import { addShortcutsToEvent, KeyboardEventWithShortcut, ShortcutEvent } from './shortcutFromEvent';
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

    let { id, ...attributes } = line.attributes;
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
      } else if (atStart && !atEnd) {
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
    handleDelete(event, -1);
  }


  function onDelete(event: KeyboardEvent) {
    handleDelete(event, 1);
  }


  function handleDelete(event: KeyboardEvent, direction: 1 | -1) {
    if (event.defaultPrevented) return;
    const { typeset: { lines }, doc } = editor;
    const { selection } = doc;
    if (!selection) return;
    const [ at, to ] = selection;
    const isCollapsed = at === to;
    const [ start, end ] = doc.getLineRange(at);

    // Allow the system to handle non-line-collapsing deletes
    if (isCollapsed) {
      if (direction === -1 && at !== start) return;
      if (direction === 1 && at !== end - 1) return;
    }

    event.preventDefault();

    if (direction === -1 && selection[0] + selection[1] === 0) {
      // At the beginning of the document
      unindent(doc.getLineAt(at), true);
    } else {
      const range = normalizeRange(selection);
      const line = doc.getLineAt(range[0]);
      const type = lines.findByAttributes(line.attributes, true);
      const outside = (direction === -1 && at === start) || (direction === 1 && at === end - 1);

      if (isCollapsed && outside && !type.contained) {
        // At the beginning of a line
        if (direction === -1 && unindent(doc.getLineAt(at))) return;

        // Delete the next line if it is empty
        const mergingLine = doc.lines[doc.lines.indexOf(line) + direction];
        const [ first, second ] = direction === 1 ? [ line, mergingLine] : [ mergingLine, line ];
        if (first && first.length === 1 && second && second.length !== 1) {
          return editor.update(
            editor.change.delete([ range[0] + direction, range[0] ], { dontFixNewline: true })
          );
        }
      }

      editor.delete(direction, { dontFixNewline: type.frozen });
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

    if (
      !editor.root.dispatchEvent(ShortcutEvent.fromKeyboardEvent(event))
      || checkShortcut(event.shortcut)
      || checkShortcut(event.osShortcut)
      || checkShortcut(event.modShortcut)
    ) {
      event.preventDefault();
      return;
    }

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
