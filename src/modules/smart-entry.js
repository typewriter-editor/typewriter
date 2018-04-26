const SOURCE_USER = 'user';
const bullet = /^[-*] $/;
const ordered = /^(-?\d+)\. $/;
const header = /^#{1,6} $/;

/**
 * A list of [ RegExp, Function ] tuples to convert text into a formatted block with the attributes returned by the
 * function. The function's argument will be the captured text from the regular expression.
 */
export const blockReplacements = [
  [ /^(#{1,6}) $/, capture => ({ header: capture.length }) ],
  [ /^[-*] $/, () => ({ list: 'bullet' }) ],
  [ /^1\. $/, () => ({ list: 'ordered' }) ],
  [ /^> $/, () => ({ blockquote: true }) ],
];

/**
 * A list of [ RegExp, Function ] tuples to convert text into another string of text which is returned by the function.
 * The function's argument will be the captured text from the regular expression.
 */
export const textReplacements = [
  [ /--$/, () => '—' ],
  [ /\.\.\.$/, () => '…' ],
];

/**
 * Allow text representations to format a block
 */
export function blockReplace(index, prefix) {
  return blockReplacements.some(([ regexp, getAttributes ]) => {
    const match = prefix.match(regexp);
    if (match) {
      const attributes = getAttributes(match[1]);
      const change = editor.getChange(() => {
        editor.formatLine(index, attributes);
        editor.deleteText(index - prefix.length, index);
      });
      editor.updateContents(change, SOURCE_USER, index - prefix.length);
      return true;
    }
  });
}

export function textReplace(index, prefix) {
  return textReplacements.some(([ regexp, replaceWith ]) => {
    const match = prefix.match(regexp);
    if (match) {
      editor.insertText(index - match[0].length, index, replaceWith(match[1]), null, SOURCE_USER);
      return true;
    }
  });
}

export const defaultHandlers = [ blockReplace, textReplace ];


export default function(handlers = defaultHandlers) {

  return view => {
    const editor = view.editor;
    let ignore = false;

    function onTextChange({ change, source }) {
      if (ignore || source !== 'user' || !editor.selection || !isTextEntry(change)) return;
      const index = editor.selection[1];
      const text = editor.getExactText();
      const lineStart = text.lastIndexOf('\n', index - 1) + 1;
      const prefix = text.slice(lineStart, index);

      ignore = true;
      handlers.some(handler => handler(index, prefix));
      ignore = false;
    }

    editor.on('text-change', onTextChange);

    return {
      destroy() {
        editor.off('text-change', onTextChange);
      }
    }
  };
}


function isTextEntry(change) {
  return (
    change.ops.length === 1 ||
    (change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes)
  ) &&
    change.ops[change.ops.length - 1].insert &&
    change.ops[change.ops.length - 1].insert !== '\n';
}
