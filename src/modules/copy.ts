import Editor from '../Editor';
import { docToHTML, inlineToHTML } from '../rendering/html';
import TextDocument from '../doc/TextDocument';
import { normalizeRange } from '../doc/EditorRange';



export function copy(editor: Editor) {

  function onCopy(event: ClipboardEvent) {
    event.preventDefault();
    const dataTransfer = event.clipboardData;
    const { doc } = editor;
    const { selection } = doc;
    if (!doc.selection) return;
    if (!dataTransfer || !selection) return;
    const range = normalizeRange(doc.selection);
    const slice = doc.slice(range[0], range[1]);
    if (!slice.ops.length) return;
    const text = slice
      .map(op => typeof op.insert === 'string' ? op.insert : ' ')
      .join('');
    let html: string;
    if (text.includes('\n')) {
      slice.push({ insert: '\n', attributes: doc.getLineFormat(range[1]) });
      html = docToHTML(editor, new TextDocument(slice));
    } else {
      html = inlineToHTML(editor, slice);
    }
    dataTransfer.setData('text/plain', text);
    dataTransfer.setData('text/html', html);
  }

  function onCut(event: ClipboardEvent) {
    onCopy(event);
    editor.delete();
  }


  const { root } = editor;
  root.addEventListener('copy', onCopy);
  root.addEventListener('cut', onCut);

  return {
    destroy() {
      root.removeEventListener('copy', onCopy);
    }
  }
}
