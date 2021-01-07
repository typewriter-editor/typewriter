import Delta from '../delta/Delta';
import TextChange from '../doc/TextChange';
import Editor, { EditorChangeEvent } from '../Editor';
import { PasteEvent } from './paste';

/**
 * Replaces regular quotes with smart quotes as they are typed. Does not affect pasted content.
 * Uses the text-changing event to prevent the original change and replace it with the new one. This makes the smart-
 * quotes act more seemlessly and includes them as part of regular text undo/redo instead of breaking it like the smart-
 * entry conversions do.
 */
export function smartQuotes() {
  return (editor: Editor) => {

    function onTextChange(event: EditorChangeEvent) {
      const { change, source, doc, old } = event;
      if (source !== 'user' || !old.selection || !change || !isTextEntry(change.delta)) return;

      const index = old.selection[1];
      const lastOp = change.delta.ops[change.delta.ops.length - 1];
      if (typeof lastOp.insert !== 'string') return;
      const lastChars = doc.getText([ index - 1, index ]) + lastOp.insert.slice(-1);

      const replaced = lastChars.replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, '“')
              .replace(/"$/, '”')
              .replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, '‘')
              .replace(/'$/, '’');

      if (replaced !== lastChars) {
        const quote = replaced.slice(-1);
        const length = change.delta.length();
        event.modify(new Delta().retain(length - 1).delete(1).insert(quote));
      }
    }

    function onPaste(event: PasteEvent) {
      let originalText = event.delta.ops
        .reduce((txt, op) => txt + (typeof op.insert === 'string' ? op.insert : ' '), '')

      const text = originalText.replace(/(^|\s)"/g, '$1“')
        .replace(/"($|\s)/g, '”$1')
        .replace(/"($|[\s,.!])/g, '”$1')
        .replace(/\b'/g, '’')
        .replace(/'\b/g, '‘');

      const quotes = new Delta();
      let pos = 0;
      for (let i = 0; i < originalText.length; i++) {
        if (originalText[i] !== text[i]) {
          quotes.retain(i - pos).delete(1).insert(text[i]);
          pos = i + 1;
        }
      }
      const trailingWhitespace = new Delta();
      pos = 0;
      text.replace(/ +\n/g, (text, offset) => {
        trailingWhitespace.retain(offset - pos).delete(text.length - 1);
        pos = offset + text.length - 1;
        return '\n';
      });
      event.delta = event.delta.compose(quotes).compose(trailingWhitespace);
    }

    editor.on('changing', onTextChange);
    editor.on('paste', onPaste);

    return {
      destroy() {
        editor.off('changing', onTextChange);
        editor.off('paste', onPaste);
      }
    }
  }
}

function isTextEntry(change: Delta): boolean {
  return !!(
    change.ops.length === 1 ||
    (change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes)
  ) &&
    typeof change.ops[change.ops.length - 1].insert === 'string' &&
    change.ops[change.ops.length - 1].insert !== '\n';
}
