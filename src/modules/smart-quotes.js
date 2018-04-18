
/**
 * Replaces regular quotes with smart quotes as they are typed. Does not affect pasted content.
 */
export default function smartQuotes(view) {
  const editor = view.editor;

  function onTextChange({ change, source, selection }) {
    if (source !== 'user' || !editor.selection || !isTextEntry(change)) return;

    const index = editor.selection[1];
    const lastOp = change.ops[change.ops.length - 1];
    const lastChars = editor.text.slice(index - 1, index) + lastOp.insert.slice(-1);

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
}


/**
 * Adds smartquotes to a document as a decorator, not affecting the source, leaving it with regular quotes.
 */
export function smartQuotesDecorator(view) {
  const quotes = [
    [ /(^|\s)"/g, /(^|\s)"/, '$1“' ],
    [ /"/g, /"/, '”'],
    [ /\b'/g, /'/, '’'],
    [ /'/g, /'/, '‘'],
  ];

  view.on('decorate', editor => {
    let { text } = editor;
    quotes.forEach(([ expr, replacer, replaceWith ]) => {
      let match;
      while ((match = expr.exec(text))) {
        const replacement = match[0].replace(replacer, replaceWith);
        text = text.slice(0, match.index) + replacement + text.slice(expr.lastIndex);
        editor.insertText(match.index, expr.lastIndex, replacement);
      }
    });
  });
}


function isTextEntry(change) {
  return (
    change.ops.length === 1 ||
    (change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes)
  ) &&
    change.ops[change.ops.length - 1].insert &&
    change.ops[change.ops.length - 1].insert !== '\n';
}
