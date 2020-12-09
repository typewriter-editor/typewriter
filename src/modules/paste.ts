import Delta from '../delta/Delta';
import Editor from '../Editor';
import { deltaFromHTML } from '../rendering/html';
import Line from '../doc/Line';
import { EditorRange, normalizeRange } from '../doc/EditorRange';
import isEqual from '../util/isEqual';

const dontFixNewline = { dontFixNewline: true };

export interface PasteEventInit extends EventInit {
  delta: Delta;
}

export class PasteEvent extends Event {
  delta: Delta;

  constructor(type: string, init: PasteEventInit) {
    super(type, init);
    this.delta = init.delta;
  }
}


export function paste(editor: Editor) {

  function onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const dataTransfer = event.clipboardData;
    const { doc } = editor;
    const selection = doc.selection && normalizeRange(doc.selection);
    if (!dataTransfer || !selection) return;
    let range = selection.slice() as EditorRange;
    const html = dataTransfer.getData('text/html');
    let delta: Delta;

    if (!html) {
      let text = dataTransfer.getData('text/plain');
      if (!text) return;
      delta = new Delta().insert(text);
    } else {
      delta = deltaFromHTML(editor, html, { possiblePartial: true });
    }

    const hasLines = delta.filter(op => typeof op.insert === 'string' && op.insert.includes('\n')).length > 0;

    if (hasLines) {
      // check the boundaries to see if they can be merged with the current line or need to make a new line
      let lines = Line.fromDelta(delta, doc.byId);
      delta = Line.toDelta(lines);

      const startLine = doc.getLineAt(range[0]);
      const endLine = doc.getLineAt(range[1]);
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

      if (!isEqual(startAttrs, pastedStartAttrs)) {
        delta = new Delta().insert('\n', startAttrs).concat(delta);
      }

      if (isEqual(endAttrs, pastedEndAttrs)) {
        delta = delta.slice(0, delta.length() - 1);
      }
    }

    const viewEvent = new PasteEvent('paste', { delta, cancelable: true });
    editor.dispatchEvent(viewEvent);
    delta = viewEvent.delta;

    if (!viewEvent.defaultPrevented && delta && delta.ops.length) {
      const change = editor.change
        .delete(range, dontFixNewline)
        .insertContent(range[0], delta)
        .select(selection[0] + delta.length());
      editor.update(change);
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
