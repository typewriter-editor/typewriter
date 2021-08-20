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
const excludeProps = new Set([ 'id' ]);

export default class TextDocument {
  private _ranges: LineRanges;
  byId: LineIds;
  lines: Line[];
  length: number;
  selection: EditorRange | null;

  constructor(lines?: TextDocument | Line[] | Delta, selection: EditorRange | null = null) {
    if (lines instanceof TextDocument) {
      this.lines = lines.lines;
      this.byId = lines.byId;
      this._ranges = lines._ranges;
      this.length = lines.length;
    } else {
      this.byId = new Map();
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
      this.byId = Line.linesToLineIds(this.lines);
      // Check for line id duplicates (should never happen, indicates bug)
      this.lines.forEach(line => {
        if (this.byId.get(line.id) !== line)
          throw new Error('TextDocument has duplicate line ids: ' + line.id);
      });
      this._ranges = Line.getLineRanges(this.lines);
      this.length = this.lines.reduce((length, line) => length + line.length, 0);
    }
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
    return this.byId.get(id) as Line;
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
        : (start < to || start === at) && end > at;
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

  getLineFormat(at: number | EditorRange = this.selection as EditorRange) {
    let to = at as number;
    if (Array.isArray(at)) [ at, to ] = normalizeRange(at);
    if (at === to) to++;
    return getAttributes(Line, this.lines, at, to);
  }

  getTextFormat(at: number | EditorRange = this.selection as EditorRange) {
    let to = at as number;
    if (Array.isArray(at)) [ at, to ] = normalizeRange(at);
    if (at === to) at--;
    return getAttributes(LineOp, this.lines, at, to, op => op.insert !== '\n');
  }

  getFormats(at: number | EditorRange = this.selection as EditorRange): AttributeMap {
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
      return new TextDocument(this, selection);
    }

    if (selection === undefined && this.selection) {
      selection = [ delta.transformPosition(this.selection[0]), delta.transformPosition(this.selection[1]) ];
      // If the selection hasn't changed, keep the original reference
      if (isEqual(this.selection, selection)) {
        selection = this.selection;
      }
    }

    const lineIter = Line.iterator(this.lines, this.byId);
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
    do {
      lengthAffected -= lineIter.peekLength();
      affectedLines.push(lineIter.next());
    } while (lineIter.hasNext() && lengthAffected >= 0)

    // if (lengthAffected > 0) {
    //   if (lineIter.hasNext()) {
    //     lengthAffected -= lineIter.peekLength();
    //     affectedLines.push(lineIter.next());
    //     if (lengthAffected > 0) {
    //       console.log('Extending last line!!!!!!!');
    //       const lastIndex = affectedLines.length - 1;
    //       const lastLine = affectedLines[lastIndex];
    //       affectedLines[lastIndex] = {
    //         ...lastLine,
    //         content: lastLine.content.slice().insert('#'.repeat(lengthAffected), lastLine.content.ops[lastLine.content.ops.length - 1].attributes),
    //       };
    //     }
    //   } else {
    //     console.log('Adding new line');
    //     // const lastLine = { ...this.lines[this.lines.length - 1] };
    //     affectedLines.push(Line.create(new Delta().insert('#'.repeat(lengthAffected)), undefined, this.byId));
    //     // lastLine.content = lastLine.content.slice().insert('#'.repeat(lengthAffected));
    //     // affectedLines.push(lastLine);
    //   }
    // }

    const updated = applyDeltaToLines(delta, affectedLines, this.byId);
    if (updated.length === affectedLines.length && updated.every((b, i) => b === affectedLines[i])) {
      return this.selection === selection ? this : new TextDocument(this, selection);
    }

    lines = lines.concat(updated);
    lines = lines.concat(lineIter.rest());

    return new TextDocument(lines, selection);
  }

  replace(delta?: Delta, selection?: EditorRange | null) {
    return new TextDocument(delta, selection);
  }

  toDelta(): Delta {
    const cache = DELTA_CACHE;
    let delta = cache.get(this);
    if (!delta) {
      delta = Line.toDelta(this.lines);
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
      else if (!attributes) attributes = { ...next.attributes };
      else attributes = intersectAttributes(attributes, next.attributes);
    }
  }
  return attributes || EMPTY_OBJ;
}

function applyDeltaToLines(delta: Delta, lines: Line[], byId: LineIds) {
  if (!lines.length) return lines;
  const ids = lines.map(line => line.id);
  const applied = Line.toDelta(lines).compose(delta, true);
  while (applied.ops.length && !applied.ops[applied.ops.length - 1].insert) applied.ops.pop();
  return Line.fromDelta(applied, byId).map((line, i) => {
    if (ids[i]) line.id = ids[i];
    const old = byId.get(line.id);
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
