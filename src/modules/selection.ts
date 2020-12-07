import isEqual from '../util/isEqual';
import Editor, { EditorChangeEvent } from '../Editor';
import { EditorRange } from '../doc/EditorRange';
import { getSelection, setSelection } from '../rendering/selection';
import { getLineNodeStart } from '../rendering/rendering';
import { DecorationsModule } from './decorations';


export function selection(editor: Editor) {

  const { root } = editor;
  const document = root.ownerDocument;
  const window = document.defaultView as Window;
  let lastSelection: EditorRange;
  let paused = false;

  document.addEventListener('selectionchange', onSelectionChange);
  root.addEventListener('mousedown', onMouseDown);
  window.addEventListener('focus', onWindowFocus);
  window.addEventListener('blur', onWindowFocus);
  editor.on('change', onChange);
  editor.on('decorate', onDecorate);

  function onSelectionChange() {
    if (paused) return;
    const selection = getSelection(editor);
    const { doc } = editor;
    if (!isEqual(doc.selection, selection)) {
      if (selection && selection[0] === selection[1] && selection[0] >= doc.length) {
        return; // Assuming this is a text composition at the end of the document, allow the entry
      }
      if (selection) lastSelection = selection;
      editor.select(selection);
    } else {
      paused = true;
      setTimeout(() => paused = false);
      setSelection(editor, selection);
    }
  }

  function renderSelection() {
    if (paused) return;
    setSelection(editor, editor.doc.selection);
  }

  function onDecorate() {
    const { doc, typeset: { lines }} = editor;
    const decorator = (editor.modules.decorations as DecorationsModule).getDecorator('selection');
    decorator.clear();
    const selection = doc.selection;
    if (selection) {
      doc.getLinesAt(selection).forEach(line => {
        if (line.length === 1 && lines.findByAttributes(line.attributes, true).frozen) {
          const focused = selection[0] === selection[1];
          decorator.decorateLine(doc.getLineRange(line)[0], { class: 'selected' + (focused ? ' focus' : '') });
        }
      });
    }
    decorator.apply();
  }

  function onMouseDown(event: MouseEvent) {
    // Helps select lines that are not easily selectable (e.g. <hr>)
    const start = getLineNodeStart(root, event.target as Node);
    const line = start != null && editor.doc.getLineAt(start);
    const type = line && editor.typeset.lines.findByAttributes(line.attributes);
    if (start != null && line && line.length === 1 && type && type.frozen) {
      event.preventDefault();
      editor.select(start);
    }
  }

  function onChange(event: EditorChangeEvent) {
    const selection = event.doc?.selection || editor.doc.selection;
    paused = true;
    setTimeout(() => paused = false);
    setSelection(editor, selection);
  }

  function onWindowFocus() {
    root.classList.toggle('window-inactive', !document.hasFocus());
  }

  function pause() {
    paused = true;
    const { selection } = editor.doc;
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
    destroy() {
      document.removeEventListener('selectionchange', onSelectionChange);
      root.addEventListener('mousedown', onMouseDown);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('blur', onWindowFocus);
      editor.off('change', onChange);
    }
  }
};
