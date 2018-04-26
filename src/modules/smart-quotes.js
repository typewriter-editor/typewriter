
/**
 * Replaces regular quotes with smart quotes as they are typed. Does not affect pasted content.
 * Uses the text-changing event to prevent the original change and replace it with the new one. This makes the smart-
 * quotes act more seemlessly and includes them as part of regular text undo/redo instead of breaking it like the smart-
 * entry conversions do.
 */
export default function smartQuotes() {
  return view => {
    const editor = view.editor;

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
      destroy() {
        editor.off('text-changing', onTextChange);
      }
    }
  }
}


/**
 * Adds smartquotes to a document as a decorator. This does not affect the source, allowing you to store regular quotes
 * in your source data but display smart quotes to the user. Use this as an alternative to the module above, not in
 * addition to it.
 */
export function smartQuotesDecorator() {
  return view => {
    const quotes = [
      [ /(^|\s)"/g, /(^|\s)"/, '$1“' ],
      [ /"/g, /"/, '”'],
      [ /\b'/g, /'/, '’'],
      [ /'/g, /'/, '‘'],
    ];

    function onDecorate(editor) {
      let { text } = editor;
      quotes.forEach(([ expr, replacer, replaceWith ]) => {
        let match;
        while ((match = expr.exec(text))) {
          const replacement = match[0].replace(replacer, replaceWith);
          text = text.slice(0, match.index) + replacement + text.slice(expr.lastIndex);
          editor.insertText(match.index, expr.lastIndex, replacement);
        }
      });
    }

    view.on('decorate', onDecorate);

    return {
      destroy() {
        view.off('decorate', onDecorate);
      }
    }
  }
}


function isTextEntry(change) {
  return (
    change.ops.length === 1 ||
    (change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes)
  ) &&
    change.ops[change.ops.length - 1].insert &&
    change.ops[change.ops.length - 1].insert !== '\n';
}
