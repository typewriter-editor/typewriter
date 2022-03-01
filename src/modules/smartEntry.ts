import { AttributeMap, Delta } from '@typewriter/document';
import Editor, { EditorChangeEvent } from '../Editor';


export type Replacement = [RegExp, (captured: string) => AttributeMap];
export type TextReplacement = [RegExp, (captured: string) => string];
const httpExpr = /(https?:\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_+.~#?&/=]*\s$/s;
const wwwExpr = /(www\.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_+.~#?&/=]*\s$/s;
const nakedExpr = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.(com|org|net|io)\b[-a-zA-Z0-9@:%_+.~#?&/=]*\s$/s;

export type Handler = (editor?: Editor, index?: number, prefix?: string, wholeText?: string) => void;

/**
 * A list of [ RegExp, Function ] tuples to convert text into a formatted line with the attributes returned by the
 * function. The function's argument will be the captured text from the regular expression.
 */
export const lineReplacements: Replacement[] = [
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
  [ /(\*|_){3}(\b(?:(?!\1).)+\b)\1{3}((?:(?!\1).))$/s, () => ({ bold: true, italic: true })],
  [ /(\*|_){2}(\b(?:(?!\1).)+\b)\1{2}((?:(?!\1).))$/s, () => ({ bold: true })],
  [ /(\*|_){1}(\b(?:(?!\1).)+\b)\1{1}((?:(?!\1).))$/s, () => ({ italic: true })],
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
export const textReplacements: TextReplacement[] = [
  [ /--$/, () => '—' ],
  [ /\.\.\.$/, () => '…' ],
];

/**
 * Allow text representations to format a line
 */
export function lineReplace(editor: Editor, index: number, prefix: string) {
  return lineReplacements.some(([ regexp, getAttributes ]) => {
    const match = prefix.match(regexp);
    if (match) {
      const attributes = getAttributes(match[1]);
      if (!editor.typeset.lines.findByAttributes(attributes)) {
        return false;
      }
      const start = index - prefix.length;
      const change = editor.change
        .delete([ start, index ])
        .formatLine(index, attributes)
        .select([ start, start ]);
      editor.update(change);
      return true;
    } else {
      return false;
    }
  });
}

export function linkReplace(editor: Editor, index: number, prefix: string) {
  return linkReplacements.some(([ regexp, getAttributes ]) => {
    const match = prefix.match(regexp);
    if (match) {
      let text = match[0].slice(0, -1);
      if (text[text.length - 1] === '.') text = text.slice(0, -1);
      const end = index - (match[0].length - text.length);
      const attributes = getAttributes(text);
      if (!editor.typeset.formats.findByAttributes(attributes)) {
        return false;
      }
      editor.formatText(attributes, [ end - text.length, end ]);
      return true;
    } else {
      return false;
    }
  });
}

export function markReplace(editor: Editor, index: number, prefix: string, wholeText: string) {
  return markReplacements.some(([ regexp, getAttributes ]) => {
    const match = prefix.match(regexp);
    if (match) {
      let [ text, _, matched, last ] = match;
      const attributes = getAttributes(matched);
      if (!editor.typeset.formats.findByAttributes(attributes)) {
        return false;
      }
      let selection = index - (text.length - matched.length) + last.length;
      if (last === ' ' && wholeText[index] === ' ') last = '';
      const end = index - last.length;
      editor.insert(matched, attributes, [ end - text.length + last.length, end ]);
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
      editor.insert(replaceWith(match[1]), undefined, [ index - match[0].length, index ]);
      return true;
    } else {
      return false;
    }
  });
}

export const defaultHandlers = [ lineReplace, textReplace, linkReplace ];


export function smartEntry(handlers: Handler[] = defaultHandlers) {

  return (editor: Editor) => {
    let ignore = false;

    function onTextChange({ change, source }: EditorChangeEvent) {
      if (ignore || source === 'api' || !editor.doc.selection || !change || !isTextEntry(change.delta)) return;
      const index = editor.doc.selection[1];
      const text = editor.doc.getText();
      const lineStart = text.lastIndexOf('\n', index - 2) + 1;
      const prefix = text.slice(lineStart, index);

      ignore = true;
      handlers.some(handler => handler(editor, index, prefix, text));
      ignore = false;
    }

    editor.on('changed', onTextChange);

    return {
      destroy() {
        editor.off('changed', onTextChange);
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

type RomanNumeral = keyof typeof DIGIT_VALUES;

function fromRomanNumeral(romanNumeral: string): number | undefined {
  romanNumeral = romanNumeral.toUpperCase();
  let result = 0;
  for (let i = 0; i < romanNumeral.length; i++) {
    const currentLetter = DIGIT_VALUES[romanNumeral[i] as RomanNumeral];
    const nextLetter = DIGIT_VALUES[romanNumeral[i + 1] as RomanNumeral];
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
