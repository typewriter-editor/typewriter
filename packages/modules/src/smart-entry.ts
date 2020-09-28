import { Editor, Delta, TextChangeEvent } from '@typewriter/editor';
import { Paper } from '@typewriter/view';
const SOURCE_USER = 'user';

export type Replacement = [RegExp, Function];
const httpExpr = /(?:http(?:s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
const wwwExpr = /(?:www\.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
const nakedExpr = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.(?:com|org|net|io)\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;

/**
 * A list of [ RegExp, Function ] tuples to convert text into a formatted block with the attributes returned by the
 * function. The function's argument will be the captured text from the regular expression.
 */
export const blockReplacements: Replacement[] = [
  [ /^(#{1,6}) $/, capture => ({ header: capture.length }) ],
  [ /^[-*] $/, () => ({ list: 'bullet' }) ],
  [ /^1\. $/, () => ({ list: 'ordered' }) ],
  [ /^([AaIi])\. $/, type => ({ list: 'ordered', type }) ],
  [ /^(-?\d+)\. $/, start => ({ list: 'ordered', start }) ], // Use /^(-?\d+)\. $/ to support lists starting at something other than 1.
  [ /^([A-Z])\. $/, char => ({ list: 'ordered', type: 'A', start: char.charCodeAt(0) - 'A'.charCodeAt(0) + 1 }) ],
  [ /^([a-z])\. $/, char => ({ list: 'ordered', type: 'a', start: char.charCodeAt(0) - 'a'.charCodeAt(0) + 1 }) ],
  [ /^([IVXLCDM]+)\. $/i, chars => ({ list: 'ordered', type: chars[0].toUpperCase() === chars[0] ? 'I' : 'i', start: fromRomanNumeral(chars) }) ],
  [ /^> $/, () => ({ blockquote: true }) ],
];

/**
 * A list of [ RegExp, Function ] tuples to convert text into formatted text with the attributes returned by the
 * function. The function's argument will be the captured text from the regular expression.
 */
export const markReplacements: Replacement[] = [
  [ /(\*|_){3}((?:(?!\1).)+)\1{3}((?:(?!\1)[.\n]))$/m, () => ({ bold: true, italic: true })],
  [ /(\*|_){2}((?:(?!\1).)+)\1{2}((?:(?!\1)[.\n]))$/m, () => ({ bold: true })],
  [ /(\*|_){1}((?:(?!\1).)+)\1{1}((?:(?!\1)[.\n]))$/m, () => ({ italic: true })],
];

export const linkReplacements: Replacement[] = [
  [ httpExpr, capture => ({ link: capture }) ],
  [ wwwExpr, capture => ({ link: 'https://' + capture }) ],
  [ nakedExpr, capture => ({ link: 'https://' + capture }) ],
];

/**
 * A list of [ RegExp, Function ] tuples to convert text into another string of text which is returned by the function.
 * The function's argument will be the captured text from the regular expression.
 */
export const textReplacements: Replacement[] = [
  [ /--$/, () => '—' ],
  [ /\.\.\.$/, () => '…' ],
];

/**
 * Allow text representations to format a block
 */
export function blockReplace(editor: Editor, index: number, prefix: string, paper: Paper) {
  return blockReplacements.some(([ regexp, getAttributes ]) => {
    const match = prefix.match(regexp);
    if (match) {
      const attributes = getAttributes(match[1]);
      if (!paper.blocks.findByAttributes(attributes)) {
        return false;
      }
      const change = editor.getChange(() => {
        editor.formatLine([ index, index ], attributes);
        editor.deleteText([ index - prefix.length, index ]);
      });
      const end = index - prefix.length;
      editor.updateContents(change, SOURCE_USER, [ end, end ]);
      return true;
    } else {
      return false;
    }
  });
}

export function linkReplace(editor: Editor, index: number, prefix: string, paper: Paper) {
  return linkReplacements.some(([ regexp, getAttributes ]) => {
    const match = prefix.match(regexp);
    if (match) {
      const text = match[0];
      const attributes = getAttributes(text);
      if (!paper.marks.findByAttributes(attributes)) {
        return false;
      }
      editor.formatText([ index - text.length, index ], attributes, SOURCE_USER);
      return true;
    } else {
      return false;
    }
  });
}

export function markReplace(editor: Editor, index: number, prefix: string, paper: Paper, wholeText: string) {
  return markReplacements.some(([ regexp, getAttributes ]) => {
    const match = prefix.match(regexp);
    if (match) {
      let [ text, _, matched, last ] = match;
      const attributes = getAttributes(matched);
      if (!paper.marks.findByAttributes(attributes)) {
        return false;
      }
      let selection = index - (text.length - matched.length) + last.length;
      if (last === ' ' && wholeText[index] === ' ') last = '';
      const end = index - last.length;
      editor.insertText([ end - text.length + last.length, end ], matched, attributes, SOURCE_USER, [ selection, selection ]);
      return true;
    } else {
      return false;
    }
  });
}

export function textReplace(editor: Editor, index: number, prefix: string) {
  return textReplacements.some(([ regexp, replaceWith ]) => {
    const match = prefix.match(regexp);
    if (match) {
      editor.insertText([ index - match[0].length, index ], replaceWith(match[1]), undefined, SOURCE_USER);
      return true;
    } else {
      return false;
    }
  });
}

export const defaultHandlers = [ blockReplace, markReplace, textReplace, linkReplace ];


export default function(handlers = defaultHandlers) {

  return (editor: Editor, root: HTMLElement, paper: Paper) => {
    let ignore = false;

    function onTextChange({ change, source }: TextChangeEvent) {
      if (ignore || source !== 'user' || !editor.selection || !isTextEntry(change)) return;
      const index = editor.selection[1];
      const text = editor.getExactText();
      const lineStart = text.lastIndexOf('\n', index - 2) + 1;
      const prefix = text.slice(lineStart, index);

      ignore = true;
      handlers.some(handler => handler(editor, index, prefix, paper, text));
      ignore = false;
    }

    editor.on('text-change', onTextChange);

    return {
      onDestroy() {
        editor.off('text-change', onTextChange);
      }
    }
  };
}


function isTextEntry(change: Delta) {
  return (
    change.ops.length === 1 ||
    (change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes)
  ) &&
    change.ops[change.ops.length - 1].insert// &&
    // change.ops[change.ops.length - 1].insert !== '\n';
}

const DIGIT_VALUES = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000
};

function fromRomanNumeral(romanNumeral: string): number | undefined {
  romanNumeral = romanNumeral.toUpperCase();
  let result = 0;
  for (let i = 0; i < romanNumeral.length; i++) {
    const currentLetter = DIGIT_VALUES[romanNumeral[i]];
    const nextLetter = DIGIT_VALUES[romanNumeral[i + 1]];
    if (currentLetter === undefined) return undefined;
    if (currentLetter < nextLetter) {
      result += nextLetter - currentLetter;
      i++;
    } else {
      result += currentLetter;
    }
  };

  return result;
}