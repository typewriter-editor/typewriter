import Delta from '../delta/Delta';
import AttributeMap from '../delta/AttributeMap';
import { EditorRange } from './EditorRange';
import isEqual from '../util/isEqual';

const EMPTY_MAP = new Map();
const INFINITY = {
  id: '',
  attributes: {},
  content: new Delta([ { retain: Infinity } ]),
  length: Infinity
};

export type LineRanges = Map<Line, EditorRange>;
export type LineIds = Map<string, Line>;
export type LineInfo = {ranges: LineRanges, ids: LineIds};

interface Line {
  id: string;
  attributes: AttributeMap;
  content: Delta;
  length: number;
}


namespace Line {
  export function iterator(lines: Line[], lineIds?: LineIds) {
    return new LineIterator(lines, lineIds);
  }

  export function linesToLineIds(lines: Line[]) {
    const lineIds = new Map();
    lines.forEach(line => lineIds.set(line.id || Line.createId(lineIds), line));
    return lineIds;
  }

  export function length(line: Line): number {
    return line.length;
  }

  export function getId(line: Line): string {
    console.warn('getId() is deprecated');
    return line.id;
  }

  export function equal(value: Line, other: Line) {
    return isEqual(value.attributes, other.attributes) && isEqual(value.content.ops, other.content.ops);
  }

  export function fromDelta(delta: Delta, existing?: LineIds) {
    const lines: Line[] = [];

    const ids = new Map(existing || []);

    delta.eachLine((content, attr) => {
      const line = Line.create(content, Object.keys(attr).length ? attr : undefined, ids);
      ids.set(line.id, line);
      lines.push(line);
    });

    return lines;
  }

  export function toDelta(lines: Line[]): Delta {
    let delta = new Delta();
    lines.forEach(line => {
      delta = delta.concat(line.content);
      delta.insert('\n', line.attributes);
    });
    return delta;
  }

  export function create(content: Delta = new Delta(), attributes: AttributeMap = {}, id?: string | LineIds): Line {
    const length = content.length() + 1;
    if (typeof id !== 'string') id = createId(id);
    return { id, attributes, content: content, length };
  }

  export function createFrom(line?: Line, content = new Delta(), lineIds?: LineIds): Line {
    const id = line ? line.id : createId(lineIds);
    const attributes = line ? line.attributes : {};
    return { id, attributes, content, length: 1 };
  }

  export function getLineRanges(lines: Line[]) {
    const ranges = new Map<Line, EditorRange>() as LineRanges;
    let pos = 0;
    lines.forEach(line => {
      ranges.set(line, [ pos, pos += line.length ])
    });
    return ranges;
  }

  export function createId(existing: LineIds = EMPTY_MAP) {
    let id: string;
    while (existing[(id = Math.random().toString(36).slice(2))]);
    return id;
  }
}

export default Line;

export class LineIterator {
  lines: Line[];
  index: number;
  offset: number;
  lineIds: LineIds;

  constructor(lines: Line[], lineIds?: LineIds) {
    this.lines = lines;
    this.index = 0;
    this.offset = 0;
    this.lineIds = lineIds ? new Map(lineIds) : Line.linesToLineIds(lines);
  }

  hasNext(): boolean {
    return !!this.peek();
  }

  next(length?: number): Line {
    if (!length) {
      length = Infinity;
    }
    const nextLine = this.lines[this.index];
    if (nextLine) {
      const offset = this.offset;
      const lineLength = nextLine.length;
      if (length >= lineLength - offset) {
        length = lineLength - offset;
        this.index += 1;
        this.offset = 0;
      } else {
        this.offset += length;
      }
      if (offset === 0 && length >= nextLine.length) {
        return nextLine;
      } else {
        const id = offset === 0 ? nextLine.id : Line.createId(this.lineIds);
        const partialLine = {
          id,
          attributes: nextLine.attributes,
          content: nextLine.content.slice(offset, length),
          length: length - offset
        };
        if (offset !== 0) this.lineIds.set(id, partialLine);
        return partialLine;
      }
    } else {
      return INFINITY;
    }
  }

  peek(): Line {
    return this.lines[this.index];
  }

  peekLength(): number {
    if (this.lines[this.index]) {
      // Should never return 0 if our index is being managed correctly
      return this.lines[this.index].length - this.offset;
    } else {
      return Infinity;
    }
  }

  rest(): Line[] {
    if (!this.hasNext()) {
      return [];
    } else if (this.offset === 0) {
      return this.lines.slice(this.index);
    } else {
      const offset = this.offset;
      const index = this.index;
      const next = this.next();
      const rest = this.lines.slice(this.index);
      this.offset = offset;
      this.index = index;
      return [next].concat(rest);
    }
  }
}
