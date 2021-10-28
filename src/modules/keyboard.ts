import Editor from '../Editor';
import Line from '../doc/Line';
import { addShortcutsToEvent, KeyboardEventWithShortcut, ShortcutEvent } from './shortcutFromEvent';
import { normalizeRange } from '../doc/EditorRange';
import { Source } from '../Source';


// A list of bad characters that we don't want coming in from pasted content (e.g. "\f" aka line feed)
const EMPTY_OBJ = {};
const IS_CHROME = (window as any).chrome && typeof (window as any).chrome === 'object';

// Basic keyboard module.
export function keyboard(editor: Editor) {


  function onEnter(event: KeyboardEvent) {
    if (event.defaultPrevented) return;

    const { typeset: { lines }, doc } = editor;
    let { selection } = doc;

    if (!selection) return;
    event.preventDefault();
    const [ at, to ] = selection;
    const isCollapsed = at === to;

    const line = doc.getLineAt(selection[0]);
    const [ start, end ] = doc.getLineRange(selection[0]);

    let { id, ...attributes } = line.attributes;
    let options: { dontFixNewline?: boolean } | undefined;
    const type = lines.findByAttributes(attributes, true);
    const atStart = to === start;
    const atEnd = to === end - 1;

    if (isEmpty(line) && type !== lines.default && !type.contained && !type.defaultFollows && !type.frozen && isCollapsed) {
      // Convert a bullet point into a paragraph
      editor.formatLine(EMPTY_OBJ);
    } else {
      if (at === start && to === end && type.frozen) {
        selection = [ to, to ];
        attributes = type.nextLineAttributes ? type.nextLineAttributes(attributes) : EMPTY_OBJ;
      } else if (atEnd && (type.nextLineAttributes || type.defaultFollows || type.frozen)) {
        attributes = type.nextLineAttributes ? type.nextLineAttributes(attributes) : EMPTY_OBJ;
      } else if (atStart && !atEnd) {
        if (type.defaultFollows) attributes = EMPTY_OBJ;
        options = { dontFixNewline: true };
      }
      editor.insert('\n', attributes, selection, options);
      if (at === start && to === end && type.frozen) {
        editor.select(to);
      }
    }
  }


  function onShiftEnter(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const { typeset, doc } = editor;
    if (!typeset.embeds.get('br')) return onEnter(event);
    if (!doc.selection) return;
    event.preventDefault();
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
    // (Bug in Chrome where backspace at the end of a span can delete an entire paragraph)
    if (isCollapsed && (!IS_CHROME || event.ctrlKey || event.altKey || event.metaKey)) {
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
        if (first && isEmpty(first) && second && !isEmpty(second)) {
          return editor.update(
            editor.change.delete([ range[0] + direction, range[0] ], { dontFixNewline: true }),
            Source.input
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

  function isEmpty(line: Line) {
    return line.length === 1 && !editor.typeset.lines.findByAttributes(line.attributes)?.frozen;
  }

  // Gboard new line after character fix
  // Gboard adds a br instead of a \n and does not advance to the next line
  function onCompositionEnd(event: CompositionEvent) {
    if(event.data.includes('\n')) {
      const selection = editor.doc.selection;
      if(selection === null) return;
      const nextLineSelection = selection[0] + 1;
      //const nextLine = editor.doc.getLineAt(nextLineSelection);

      editor
        .delete([nextLineSelection,nextLineSelection + 1]) // delete br
        .insert('\n',{},[nextLineSelection,nextLineSelection]); // add \n
      editor.select(nextLineSelection); // move to new line
    }
  }

  return {
    init() {
      editor.root.addEventListener('keydown', onKeyDown);
      editor.root.addEventListener('compositionend', onCompositionEnd);
    },
    destroy() {
      editor.root.removeEventListener('keydown', onKeyDown);
      editor.root.removeEventListener('compositionend', onCompositionEnd);
    }
  }
}
