import isEqual from '../util/isEqual';
import Delta from '../delta/Delta';
import Op from '../delta/Op';
import Line, { LineRanges, LineIds } from './Line';
import LineOp from './LineOp';
import AttributeMap from '../delta/AttributeMap';
import { EditorRange, normalizeRange } from './EditorRange';
import TextChange from './TextChange';
import { deltaToText } from './deltaToText';

const EMPTY_RANGE: EditorRange = [ 0, 0 ];
const EMPTY_OBJ = {};
const DELTA_CACHE = new WeakMap<TextDocument, Delta>();
const DELTA_ID_CACHE = new WeakMap<TextDocument, Delta>();
const excludeProps = new Set([ 'id' ]);

export default class TextDocument {
  private _ranges: LineRanges;
  byId: LineIds;
  lines: Line[];
  length: number;
  selection: EditorRange | null;

  constructor(lines?: Line[] | Delta, selection: EditorRange | null = null) {
    if (Array.isArray(lines)) {
      this.lines = lines;
    } else if (lines) {
      this.lines = Line.fromDelta(lines);
    } else {
      this.lines = [ Line.create() ];
    }
    if (!this.lines.length) {
      this.lines.push(Line.create());
    }
    const info = Line.getLineInfo(this.lines);
    this._ranges = info.ranges;
    this.byId = info.ids;
    this.length = this.lines.reduce((length, line) => length + line.length, 0);
    this.selection = selection && selection.map(index => Math.min(this.length - 1, Math.max(0, index))) as EditorRange;
  }

  get change() {
    const change = new TextChange(this);
    change.apply = () => this.apply(change);
    return change;
  }

  getText(range?: EditorRange): string {
    if (range) range = normalizeRange(range);
    return deltaToText(range ? this.slice(range[0], range[1]) : this.slice(0, this.length - 1));
  }

  getLineBy(id: string) {
    return this.byId[id];
  }

  getLineAt(at: number) {
    return this.lines.find(line => {
      const [ start, end ] = this.getLineRange(line);
      return start <= at && end > at;
    }) as Line;
  }

  getLinesAt(at: number | EditorRange, encompassed?: boolean) {
    let to = at as number;
    if (Array.isArray(at)) [ at, to ] = normalizeRange(at);
    return this.lines.filter(line => {
      const [ start, end ] = this.getLineRange(line);
      return encompassed
        ? start >= at && end <= to
        : start <= to && end > at;
    });
  }

  getLineRange(at: number | string | Line): EditorRange {
    const { lines, _ranges: lineRanges } = this;
    if (typeof at === 'number') {
      for (let i = 0; i < lines.length; i++) {
        const range = lineRanges.get(lines[i]) || EMPTY_RANGE;
        if (range[0] <= at && range[1] > at) return range;
      }
      return EMPTY_RANGE;
    } else {
      if (typeof at === 'string') at = this.getLineBy(at);
      return lineRanges.get(at) as EditorRange;
    }
  }

  getLineRanges(at?: number | EditorRange) {
    if (at == null) {
      return Array.from(this._ranges.values());
    } else {
      return this.getLinesAt(at).map(line => this.getLineRange(line));
    }
  }

  getLineFormat(at: number | EditorRange) {
    let to = at as number;
    if (Array.isArray(at)) [ at, to ] = normalizeRange(at);
    if (at === to) to++;
    return getAttributes(Line, this.lines, at, to);
  }

  getTextFormat(at: number | EditorRange) {
    let to = at as number;
    if (Array.isArray(at)) [ at, to ] = normalizeRange(at);
    if (at === to) at--;
    return getAttributes(LineOp, this.lines, at, to, op => op.insert !== '\n');
  }

  getFormats(at: number | EditorRange): AttributeMap {
    return { ...this.getTextFormat(at), ...this.getLineFormat(at) };
  }

  slice(start: number = 0, end: number = Infinity): Delta {
    const ops: Op[] = [];
    const iter = LineOp.iterator(this.lines);
    let index = 0;
    while (index < end && iter.hasNext()) {
      let nextOp: Op;
      if (index < start) {
        nextOp = iter.next(start - index);
      } else {
        nextOp = iter.next(end - index);
        ops.push(nextOp);
      }
      index += Op.length(nextOp);
    }
    return new Delta(ops);
  }

  apply(change: Delta | TextChange, selection?: EditorRange | null): TextDocument {
    let delta: Delta;
    if (change instanceof TextChange) {
      delta = change.delta;
      selection = change.selection;
    } else {
      delta = change;
    }

    // If no change, do nothing
    if (!delta.ops.length && (selection === undefined || isEqual(this.selection, selection))) {
      return this;
    }

    // Optimization for selection change
    if (!delta.ops.length && selection) {
      return new TextDocument(this.lines, selection);
    }

    if (selection === undefined && this.selection) {
      selection = [ delta.transformPosition(this.selection[0]), delta.transformPosition(this.selection[1]) ];
      // If the selection hasn't changed, keep the original reference
      if (isEqual(this.selection, selection)) {
        selection = this.selection;
      }
    }

    const lineIter = Line.iterator(this.lines);
    const changeIter = Op.iterator(delta.ops);
    let lines: Line[] = [];
    const firstChange = changeIter.peek();
    if (firstChange && firstChange.retain && !firstChange.attributes) {
      let firstLeft = firstChange.retain;
      while (lineIter.peekLength() <= firstLeft) {
        firstLeft -= lineIter.peekLength();
        lines.push(lineIter.next());
      }
      if (firstChange.retain - firstLeft > 0) {
        changeIter.next(firstChange.retain - firstLeft);
      }
    }

    if (changeIter.index !== 0 || changeIter.offset !== 0) {
      delta = new Delta(changeIter.rest());
    }

    const affectedLines: Line[] = [];
    let lengthAffected = delta.reduce((length, op) => length + (op.insert ? 0 : Op.length(op)), 0);
    while (lineIter.peekLength() <= lengthAffected) {
      lengthAffected -= lineIter.peekLength();
      affectedLines.push(lineIter.next());
    }
    if (lengthAffected >= 0) {
      affectedLines.push(lineIter.next());
    }

    const updated = applyDeltaToLines(delta, affectedLines, this.byId);
    if (updated.length === affectedLines.length && updated.every((b, i) => b === affectedLines[i])) {
      return this.selection === selection ? this : new TextDocument(this.lines, selection);
    }

    lines = lines.concat(updated);
    lines = lines.concat(lineIter.rest());

    return new TextDocument(lines, selection);
  }

  replace(delta?: Delta, selection?: EditorRange | null) {
    return new TextDocument(delta, selection);
  }

  toDelta(keepIds?: boolean): Delta {
    const cache = keepIds ? DELTA_ID_CACHE : DELTA_CACHE;
    let delta = cache.get(this);
    if (!delta) {
      delta = Line.toDelta(this.lines, keepIds);
      cache.set(this, delta);
    }
    return delta;
  }

  equals(other: TextDocument, options?: { contentOnly?: boolean }) {
    return this === other
      || (options?.contentOnly || isEqual(this.selection, other.selection))
      && isEqual(this.lines, other.lines, { excludeProps });
  }

  toJSON() {
    return this.toDelta();
  }

  toString() {
    return this.lines
      .map(line => line.content
        .map(op => typeof op.insert === 'string' ? op.insert : ' ')
        .join(''))
      .join('\n') + '\n';
  }
}

function getAttributes(Type: any, data: any, from: number, to: number, filter?: (next: any) => boolean): AttributeMap {
  const iter = Type.iterator(data);
  let attributes: AttributeMap | undefined;
  let index = 0;
  if (iter.skip) index += iter.skip(from);
  while (index < to && iter.hasNext()) {
    let next = iter.next() as { attributes: AttributeMap };
    index += Type.length(next);
    if (index > from && (!filter || filter(next))) {
      if (!next.attributes) attributes = {};
      else if (!attributes) {
        attributes = { ...next.attributes };
        if (attributes) delete attributes.id;
      } else attributes = intersectAttributes(attributes, next.attributes);
    }
  }
  return attributes || EMPTY_OBJ;
}

(window as any).AttributeMap = AttributeMap;

function applyDeltaToLines(delta: Delta, lines: Line[], byId: LineIds) {
  return Line.fromDelta(Line.toDelta(lines, true).compose(delta, true)).map(line => {
    const id = Line.getId(line);
    const old = byId[id];
    return old && Line.equal(old, line) ? old : line;
  });
}

// Intersect 2 attibute maps, keeping only those that are equal in both
function intersectAttributes(attributes: AttributeMap, other: AttributeMap) {
  return Object.keys(other).reduce(function(intersect, name) {
    if (attributes[name] === other[name]) intersect[name] = attributes[name];
    return intersect;
  }, {});
}
