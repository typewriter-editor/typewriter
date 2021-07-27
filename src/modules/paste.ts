import Delta from '../delta/Delta';
import Editor from '../Editor';
import { deltaFromHTML } from '../rendering/html';
import Line from '../doc/Line';
import { EditorRange, normalizeRange } from '../doc/EditorRange';
import isEqual from '../util/isEqual';

const dontFixNewline = { dontFixNewline: true };
const ignoreId = { excludeProps: new Set([ 'id' ]) };

export interface PasteEventInit extends EventInit {
  delta: Delta;
  html?: string;
  text?: string;
}

export class PasteEvent extends Event {
  delta: Delta;
  html?: string;
  text?: string;

  constructor(type: string, init: PasteEventInit) {
    super(type, init);
    this.delta = init.delta;
    this.html = init.html;
    this.text = init.text;
  }
}


export function paste(editor: Editor) {

  function onPaste(event: ClipboardEvent) {
    if (!editor.enabled || !editor.doc.selection) return;
    event.preventDefault();
    const dataTransfer = event.clipboardData;
    const { doc } = editor;
    const selection = doc.selection && normalizeRange(doc.selection);
    if (!dataTransfer || !selection) return;
    const [ at, to ] = selection;
    const html = dataTransfer.getData('text/html');
    const text = dataTransfer.getData('text/plain');
    let delta: Delta;

    if (!html) {
      if (!text) return;
      delta = new Delta().insert(text);
    } else {
      delta = deltaFromHTML(editor, html, { possiblePartial: true });
    }

    const hasLines = delta.filter(op => typeof op.insert === 'string' && op.insert.includes('\n')).length > 0;
    let length = delta.length();

    if (hasLines) {
      // check the boundaries to see if they can be merged with the current line or need to make a new line
      let lines = Line.fromDelta(delta, doc.byId);
      delta = Line.toDelta(lines);
      length = delta.length();

      const startLine = doc.getLineAt(at);
      const endLine = doc.getLineAt(to);
      const startAttrs = getAttributes(startLine);
      const endAttrs = startLine === endLine ? startAttrs : getAttributes(endLine);

      // plain text should merge better with the existing content
      if (!html) {
        lines = lines.map(line => ({ ...line, attributes: startLine.attributes }));
        if (startAttrs !== endAttrs) lines[lines.length - 1].attributes = endLine.attributes;
      }

      const pastedStartLine = lines[0];
      const pastedStartAttrs = getAttributes(pastedStartLine);
      const pastedEndLine = lines[lines.length - 1];
      const pastedEndAttrs = pastedStartLine === pastedEndLine ? pastedStartAttrs : getAttributes(pastedEndLine);

      if (at !== doc.getLineRange(startLine)[0] && !isEqual(startAttrs, pastedStartAttrs, ignoreId)) {
        delta = new Delta().insert('\n', startAttrs).concat(delta);
        length++;
      }

      const lastInsert = delta.ops[delta.ops.length - 1].insert;
      const endsInNewline = typeof lastInsert === 'string' && lastInsert.endsWith('\n');

      // Does the last line of a multi-line paste merge with the last line?
      if (endsInNewline && to !== doc.getLineRange(endLine)[1] && isEqual(endAttrs, pastedEndAttrs, ignoreId)) {
        // Remove the trailing newline to merge with the last line
        delta = delta.slice(0, --length);
      // If a multi-line paste is inserted at the end of a line, delete the line's newline and let the inserted one take
      } else if (endsInNewline && to === doc.getLineRange(endLine)[1] - 1) {
        delta.delete(1);
        length--;
      }
    }

    const viewEvent = new PasteEvent('paste', { delta, html, text, cancelable: true });
    editor.dispatchEvent(viewEvent);
    delta = viewEvent.delta;

    if (!viewEvent.defaultPrevented) {
      if (delta && delta.ops.length) {
        const change = editor.change.delete(selection, hasLines ? dontFixNewline : undefined);
        change.insertContent(at, delta).select(at + length);
        editor.update(change);
      } else if (at !== to) {
        editor.delete([ at, to ]);
      }
    }

  }

  return {
    init() {
      editor.root.addEventListener('paste', onPaste);
    },
    destroy() {
      editor.root.removeEventListener('paste', onPaste);
    }
  }
}

function getAttributes(line: Line) {
  const { id, ...attributes } = line.attributes;
  return attributes;
}
