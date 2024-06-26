import { Line, normalizeRange } from '@typewriter/document';
import Editor from '../Editor';
import { Source } from '../Source';
import { LineType, Types } from '../typesetting';
import { addShortcutsToEvent, KeyboardEventWithShortcut, ShortcutEvent } from './shortcutFromEvent';


// A list of bad characters that we don't want coming in from pasted content (e.g. "\f" aka line feed)
const EMPTY_OBJ = {};
const IS_CHROME = (window as any).chrome && typeof (window as any).chrome === 'object';

// Basic keyboard module.
export function keyboard(editor: Editor) {


  function onEnter(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (editor.doc.selection) {
      const { lines } = editor.typeset;
      const selected = editor.doc.getLinesAt(editor.doc.selection);
      if (selected.length) {
        const format = lines.findByAttributes(selected[0].attributes);
        if (format?.onEnter && selected.every(line => format === lines.findByAttributes(line.attributes))) {
          event.preventDefault();
          format.onEnter(editor);
          return;
        }
      }
    }

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

    if (isCollapsed && isEmpty(line)) {
      const explicitUnindent = type.onEmptyEnter && type.onEmptyEnter(editor, line);
      const nativeUnindent = !type.onEmptyEnter
        && type !== lines.default
        && !type.contained
        && !type.defaultFollows
        && !type.frozen;
      if (explicitUnindent || nativeUnindent) {
        // Convert a bullet point into a paragraph
        if (unindent(lines, doc.getLineAt(at))) return;
      }
    }

    if (at === start && to === end && type.frozen) {
      if (at === 0) {
        // if single selection and line element (hr, image etc) insert new line before
        options = { dontFixNewline: true };
        selection = [ at, at ];
      } else if (to === doc.length) {
        selection = [ to - 1, to - 1 ];
      } else {
        options = { dontFixNewline: true };
        selection = [ to, to ];
      }
      attributes = type.nextLineAttributes ? type.nextLineAttributes(attributes) : EMPTY_OBJ;
    } else if (atEnd && (type.nextLineAttributes || type.defaultFollows || type.frozen)) {
      attributes = type.nextLineAttributes ? type.nextLineAttributes(attributes) : EMPTY_OBJ;
    } else if (atStart && !atEnd) {
      if (type.defaultFollows) attributes = EMPTY_OBJ;
      options = { dontFixNewline: true };
    }
    editor.insert('\n', attributes, selection, options);
    if (at === start && to === end && type.frozen) {
      editor.select(at === 0 ? 0 : to);
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
      unindent(lines, doc.getLineAt(at), true);
    } else {
      const range = normalizeRange(selection);
      const line = doc.getLineAt(range[0]);
      const type = lines.findByAttributes(line.attributes, true);
      // If the deletion will move outside a line (collapsing 2 lines)
      const outside = isCollapsed && ((direction === -1 && at === start) || (direction === 1 && at === end - 1));

      if (outside && !type.contained) {
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
  }


  function unindent(lines: Types<LineType>, line: Line, force?: boolean) {
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


  function onTab(event: KeyboardEventWithShortcut) {
    if (event.defaultPrevented) return;
    if (editor.doc.selection) {
      const { lines } = editor.typeset;
      const selected = editor.doc.getLinesAt(editor.doc.selection);
      if (selected.length) {
        const format = lines.findByAttributes(selected[0].attributes);
        if (format?.onTab && selected.every(line => format === lines.findByAttributes(line.attributes))) {
          event.preventDefault();
          format.onTab(editor, event.shiftKey);
          return;
        }
      }
    }
    event.preventDefault();
    const shortcut = event.modShortcut;
    if (shortcut === 'Tab' || shortcut === 'Mod+]') editor.indent();
    else editor.outdent();
  }



  function onKeyDown(event: KeyboardEventWithShortcut) {
    if (event.isComposing) return;

    addShortcutsToEvent(event);

    const checkShortcut = (shortcut: string | undefined) => {
      const command = shortcut && editor.shortcuts[shortcut];
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
      case 'Shift+Tab': return onTab(event);
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

  return {
    init() {
      editor.root.addEventListener('keydown', onKeyDown);
    },
    destroy() {
      editor.root.removeEventListener('keydown', onKeyDown);
    }
  }
}
