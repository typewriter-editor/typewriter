import AttributeMap from '../delta/AttributeMap';
import Delta from '../delta/Delta';
import TextDocument from './TextDocument';
import { EditorRange, normalizeRange } from './EditorRange';
import Line from './Line';
import intersect from '../util/intersect';
import isEqual from '../util/isEqual';



export default class TextChange {
  private _pos: number;
  doc: TextDocument | null;
  delta: Delta;
  selection?: EditorRange | null;

  constructor(doc: TextDocument | null, delta = new Delta(), selection?: EditorRange | null) {
    this._pos = 0;
    this.doc = doc;
    this.delta = delta;
    this.selection = selection;
  }

  get contentChanged() {
    return this.delta.ops.length > 0;
  }

  get selectionChanged() {
    return this.selection !== undefined && !isEqual(this.selection, this.doc?.selection);
  }

  apply() {
    throw new Error('Must be overridden by creator of change (e.g. Editor).');
  }

  setDelta(delta: Delta) {
    this.delta = delta;
    this._pos = delta.length();
  }

  select(at: EditorRange | number | null) {
    this.selection = typeof at === 'number' ? [ at, at ] : at;
    return this;
  }

  delete(range: EditorRange | null, options?: { dontFixNewline?: boolean }) {
    if (!range || !this.doc) return this;
    let [ at, to ] = normalizeRange(range);
    at = Math.max(0, at);
    to = Math.min(this.doc.length - 1, to);
    if (at === to) return this;
    const length = to - at;
    if (this.doc.selection) this.selection = [ at, at ];
    this.compose(at, delta => delta.delete(length), length);

    const lineRange = this.doc.getLineRange(at);
    if (!options?.dontFixNewline && lineRange[1] <= to) {
      const format = this.doc.getLineFormat(at);
      format.id = this.doc.getLineAt(at).attributes.id;
      this.formatLine(to, format);
    }
    return this;
  }

  insert(at: number, insert: string | object, format?: AttributeMap, options?: { dontFixNewline?: boolean }) {
    if (!this.doc) return this;
    at = this.normalizePoint(at);

    if (this.doc.selection) {
      const end = at + (typeof insert === 'string' ? insert.length : 1);
      this.selection = [ end, end ];
    }

    const ids = this.doc.byId;
    const lineFormat = this.doc.getLineFormat(at);

    if (typeof insert !== 'string') {
      this.compose(at, delta => delta.insert(insert, format));
    } else if (insert === '\n') {
      if (options?.dontFixNewline) {
        this.compose(at, delta => delta.insert('\n', { ...format, id: Line.createId(ids) }));
      } else {
        lineFormat.id = this.doc.getLineAt(at).attributes.id;
        this.compose(at, delta => delta.insert('\n', lineFormat));
        this.formatLine(at, { ...format, id: Line.createId(ids) });
      }
    } else {
      if (!format) format = this.getFormatAt(at);
      const lines = insert.split('\n');
      lines.forEach((line, i) => {
        if (i) this.compose(at, delta => delta.insert('\n', i === 1 ? lineFormat : { id: Line.createId(ids) }));
        if (line.length) this.compose(at, delta => delta.insert(line, format))
      });
      if (lines.length > 1 && lineFormat) {
        this.formatLine(at, { ...lineFormat, id: Line.createId(ids) });
      }
    }
    return this;
  }

  insertContent(at: number, content: Delta) {
    if (!this.doc) return this;
    at = this.normalizePoint(at);
    this.compose(at, delta => delta.concat(content));
    return this;
  }

  formatText(range: EditorRange, format?: AttributeMap) {
    if (!this.doc) return this;
    range = normalizeRange(range);
    const length = range[1] - range[0];
    if (!length) return this;
    if (format) {
      Object.keys(format).forEach(name => format[name] === false && (format[name] = null));
    }

    // get lines for at-to and apply, skipping newlines
    this.doc.getLineRanges(range).forEach(([ start, end ]) => {
      start = Math.max(range[0], start);
      end = Math.min(range[1], end - 1);
      const length = end - start;
      this.compose(start, delta => delta.retain(length, format), length);
    });
    return this;
  }

  toggleTextFormat(range: EditorRange, format: AttributeMap) {
    if (!this.doc) return this;
    if (typeof range === 'number') range = [ range, range ];
    range = normalizeRange(range);
    const existing = this.doc.getTextFormat(range);
    if (hasFormat(format, existing)) format = AttributeMap.invert(format);
    return this.formatText(range, format);
  }

  formatLine(range: EditorRange | number, format: AttributeMap, decoration?: boolean) {
    if (!this.doc) return this;
    const doc = this.doc;
    if (typeof range === 'number') range = [ range, range ];
    range = normalizeRange(range);
    this.doc.getLineRanges(range).forEach(([ start, end ]) => {
      end--;
      if (!decoration) {
        const undoFormat = AttributeMap.invert(doc.getLineFormat(end));
        delete undoFormat.id;
        format = { ...undoFormat, ...format };
      }
      this.compose(end, delta => delta.retain(1, format), 1);
    });
    return this;
  }

  toggleLineFormat(range: EditorRange | number, format: AttributeMap) {
    if (!this.doc) return this;
    if (typeof range === 'number') range = [ range, range ];
    range = normalizeRange(range);
    const existing = this.doc.getLineFormat(range);
    if (hasFormat(format, existing)) format = AttributeMap.invert(format);
    return this.formatLine(range, format);
  }

  removeFormat(range: EditorRange) {
    if (!this.doc) return this;
    range = normalizeRange(range);
    const undo = AttributeMap.invert(this.doc.getFormats(range));
    const length = range[1] - range[0];
    return this.compose(range[0], delta => delta.retain(length, undo), length);
  }

  transform(change: TextChange, priority?: boolean) {
    const delta = this.delta.transform(change.delta, priority);
    const selection = change.selection && this.transformSelection(change.selection);
    return new TextChange(null, delta, selection);
  }

  transformSelection(selection: EditorRange | null, priority?: boolean): EditorRange | null {
    if (!selection) return selection;
    const from = this.delta.transformPosition(selection[0], priority);
    const to = this.delta.transformPosition(selection[1], priority);
    if (from === selection[0] && to === selection[1]) return selection;
    return [ from, to ];
  }

  transformAgainst(delta: TextChange | Delta, priority?: boolean) {
    const change = delta instanceof Delta ? new TextChange(null, delta) : delta;
    return change.transform(this, !priority);
  }

  isFor(doc: TextDocument) {
    return this.doc === doc;
  }

  clone() {
    return new TextChange(this.doc, new Delta(this.delta.ops.slice()), this.selection?.slice() as EditorRange);
  }

  private compose(at: number, applicator: (delta: Delta) => Delta, length?: number) {
    if (this._pos <= at) {
      this.delta = applicator(this.delta.retain(at - this._pos));
    } else {
      this.delta = this.delta.compose(applicator(new Delta().retain(at)));
    }
    this._pos = Math.max(at + (length || 0), this._pos);
    return this;
  }

  private normalizePoint(at: number, maxLength: number = this.doc ? this.doc.length - 1 : 0): number {
    return Math.max(0, Math.min(maxLength, at));
  }

  private getFormatAt(at: number) {
    let format: AttributeMap | undefined = undefined;
    if (this.doc) {
      // Only keep the format if it is present on both sides of the cursor
      const attr1 = this.doc.getTextFormat(at);
      const attr2 = this.doc.getTextFormat(at + 1);
      if (attr1 && attr2) {
        format = attr1 === attr2 ? attr1 : intersect(attr2, Object.keys(attr1));
      }
    }
    return format;
  }
}


export function hasFormat(format: AttributeMap, attributes: AttributeMap) {
  return Object.keys(format).every(name => attributes[name] === format[name]);
}
