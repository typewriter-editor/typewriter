import { Editor } from '@typewriter/editor';

/**
 * Replaces regular quotes with smart quotes as they are typed. Does not affect pasted content.
 * Uses the text-changing event to prevent the original change and replace it with the new one. This makes the smart-
 * quotes act more seemlessly and includes them as part of regular text undo/redo instead of breaking it like the smart-
 * entry conversions do.
 */
export default function smartQuotes() {
  return (editor: Editor) => {

    function onTextChange({ change, source, selection }) {
      if (source !== 'user' || !editor.selection || !isTextEntry(change)) return;

      const index = editor.selection[1];
      const lastOp = change.ops[change.ops.length - 1];
      const lastChars = editor.getText(index - 1, index) + lastOp.insert.slice(-1);

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

    editor.on('text-changing', onTextChange);

    return {
      onDestroy() {
        editor.off('text-changing', onTextChange);
      }
    }
  }
}

function isTextEntry(change) {
  return (
    change.ops.length === 1 ||
    (change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes)
  ) &&
    typeof change.ops[change.ops.length - 1].insert === 'string' &&
    change.ops[change.ops.length - 1].insert !== '\n';
}
