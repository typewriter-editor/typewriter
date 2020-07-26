import { Editor, Delta, EditorRange, SOURCE_USER } from '@typewriter/editor';

type ChangeHandlerArg = {
  change: Delta,
  source: string,
  selection: EditorRange
};

/**
 * Replaces regular quotes with smart quotes as they are typed. Does not affect pasted content.
 * Uses the text-changing event to prevent the original change and replace it with the new one. This makes the smart-
 * quotes act more seemlessly and includes them as part of regular text undo/redo instead of breaking it like the smart-
 * entry conversions do.
 */
export default function smartQuotes() {
  return (editor: Editor) => {

    function onTextChange({ change, source, selection }: ChangeHandlerArg) {
      if (source !== SOURCE_USER || !editor.selection || !isTextEntry(change)) return;

      const index = editor.selection[1];
      const lastOp = change.ops[change.ops.length - 1];
      if (typeof lastOp.insert !== 'string') return;
      const lastChars = editor.getText([ index - 1, index ]) + lastOp.insert.slice(-1);

      const replaced = lastChars.replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, '“')
              .replace(/"$/, '”')
              .replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, '‘')
              .replace(/'$/, '’');

      if (replaced !== lastChars) {
        const quote = replaced.slice(-1);
        lastOp.insert = lastOp.insert.slice(0, -1) + quote;
        editor.updateContents(change, source, selection);
        return false;
      }
    }

    function onPaste(event: { text?: string, delta?: Delta }) {
      let originalText = event.delta
        ? event.delta.ops.reduce((txt, op) => txt + (typeof op.insert === 'string' ? op.insert : ' '), '')
        : event.text || '';

      const text = originalText.replace(/(^|\s)"/g, '$1“')
        .replace(/"($|\s)/g, '”$1')
        .replace(/"($|[\s,.!])/g, '”$1')
        .replace(/\b'/g, '’')
        .replace(/'\b/g, '‘');

      if (event.delta) {
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
      } else {
        event.text = text.replace(/ +\n/g, '\n');
      }
    }

    editor.on('text-changing', onTextChange);
    editor.on('paste', onPaste);

    return {
      onDestroy() {
        editor.off('text-changing', onTextChange);
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
