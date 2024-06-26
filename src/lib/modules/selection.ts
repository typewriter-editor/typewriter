import { isEqual } from '@typewriter/document';
import Editor, { EditorChangeEvent } from '../Editor';
import { getLineNodeStart } from '../rendering/rendering';
import { getSelection, setSelection } from '../rendering/selection';
import { DecorationsModule } from './decorations';


export function selection(editor: Editor) {
  let rootDocument: Document;
  let rootWindow: Window;
  let paused = false;

  function onSelectionChange() {
    if (!editor.enabled) return;
    const selection = getSelection(editor);
    const originalSelection = selection?.slice() || null;
    if (!selection && paused) return;
    if (paused) paused = false;
    if (selection) {
      if (selection[0] === selection[1] && selection[0] === editor.doc.length) {
        selection[0]--;
      }
      let line = editor.doc.getLineAt(selection[0]);
      let type = editor.typeset.lines.findByAttributes(line.attributes, true);
      if (selection && selection[0] === selection[1] && editor.doc.selection && editor.doc.selection[0] === selection[0] && editor.doc.selection[1] === selection[0] + 1) {
        // Allow a frozen line (e.g. hr) to move the cursor left with a left arrow key
        if (type.frozen) {
          selection[0]--;
          selection[1]--;
        }
        line = editor.doc.getLineAt(selection[0]);
        type = editor.typeset.lines.findByAttributes(line.attributes, true);
      }
      if (type.frozen && selection[0] === selection[1]) {
        selection[1]++;
      }
    }
    const { doc } = editor;
    if (!isEqual(doc.selection, selection)) {
      if (selection && selection[0] === selection[1] && selection[0] >= doc.length) {
        return; // Assuming this is a text composition at the end of the document, allow the entry
      }
      editor.select(selection);
    } else if (!isEqual(originalSelection, selection)) {
      setSelection(editor, selection);
    }
  }

  function renderSelection() {
    if (paused || !editor.enabled) return;
    setSelection(editor, editor.doc.selection);
  }

  function onDecorate() {
    const { doc, typeset: { lines }} = editor;
    const decorator = (editor.modules.decorations as DecorationsModule).getDecorator('selection');
    decorator.clear();
    const selection = doc.selection;
    if (selection) {
      doc.getLinesAt(selection).forEach(line => {
        if (lines.findByAttributes(line.attributes, true).frozen) {
          const focused = isEqual(selection, doc.getLineRange(line));
          decorator.decorateLine(doc.getLineRange(line)[0], { class: 'selected' + (focused ? ' focus' : '') });
        }
      });
    }
    decorator.apply();
  }

  function onMouseDown(event: MouseEvent) {
    // Helps select lines that are not easily selectable (e.g. <hr>)
    let node = event.target as Node;
    while (node.parentNode && node.parentNode !== editor.root) node = node.parentNode;
    const start = getLineNodeStart(editor.root, node);
    const line = start != null && editor.doc.getLineAt(start);
    const type = line && editor.typeset.lines.findByAttributes(line.attributes);
    if (start != null && line && type && type.frozen) {
      event.preventDefault();
      editor.select([ start, start + line.length ]);
    }
  }

  function onChange(event: EditorChangeEvent) {
    const selection = event.doc?.selection || editor.doc.selection;
    setSelection(editor, selection);
  }

  function onWindowFocus() {
    editor.root.classList.toggle('window-inactive', !rootDocument.hasFocus());
  }

  function pause() {
    paused = true;
    const { selection } = editor.doc;
    rootDocument.getSelection()?.empty();
    const { decorations } = editor.modules as {decorations: DecorationsModule}
    if (selection && selection[0] !== selection[1] && decorations) {
      const decorator = decorations.getDecorator('pausedSelection');
      decorator.decorateText(selection, { class: 'selected' }).apply();
    }
  }

  function resume() {
    paused = false;
    const { decorations } = editor.modules as {decorations: DecorationsModule}
    if (decorations) {
      decorations.removeDecorations('pausedSelection');
    }
    setTimeout(renderSelection);
  }

  return {
    pause,
    resume,
    renderSelection,
    init() {
      rootDocument = editor.root.ownerDocument;
      rootWindow = rootDocument.defaultView as Window;

      rootDocument.addEventListener('selectionchange', onSelectionChange);
      rootWindow.addEventListener('focus', onWindowFocus);
      rootWindow.addEventListener('blur', onWindowFocus);
      editor.root.addEventListener('mousedown', onMouseDown);
      editor.on('change', onChange);
      editor.on('decorate', onDecorate);
    },
    destroy() {
      rootDocument.removeEventListener('selectionchange', onSelectionChange);
      rootWindow.removeEventListener('focus', onWindowFocus);
      rootWindow.removeEventListener('blur', onWindowFocus);
      editor.root.removeEventListener('mousedown', onMouseDown);
      editor.off('change', onChange);
      editor.off('decorate', onDecorate);
      paused = false;
      rootDocument = null as any;
      rootWindow = null as any;
    }
  }
};
