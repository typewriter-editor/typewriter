import { TextDocument } from '@typewriter/document';
import Editor, { EditorChangeEvent } from '../Editor';
import { renderChanges, render as renderWhole } from '../rendering/rendering';

export interface RenderWhat {
  old?: TextDocument;
  doc?: TextDocument;
}

export function rendering(editor: Editor) {
  editor.on('change', onChange);

  function render(what?: RenderWhat) {
    if (!what) {
      const { doc } = (editor.modules.decorations as { doc: TextDocument }) || editor;
      renderWhole(editor, doc);
    } else {
      const { doc, old } = what;
      if (old && doc) {
        renderChanges(editor, old, doc);
      } else if (doc) {
        renderWhole(editor, doc);
      }
    }
  }

  function onChange(event: EditorChangeEvent) {
    const { doc, old } = (editor.modules.decorations as { old: TextDocument; doc: TextDocument }) || event;
    if (old.lines !== doc.lines) {
      renderChanges(editor, old, doc);
    }
  }

  return {
    render,
    destroy() {
      editor.off('change', onChange);
    },
  };
}
