import Delta from '../delta/Delta';
import AttributeMap from '../delta/AttributeMap';
import Iterator from './Iterator';
import { EditorRange } from './EditorRange';
import isEqual from '../util/isEqual';

const EMPTY_MAP = new Map();

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
    return new Iterator(lines, lineIds);
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

  export function createFrom(line?: Line, lineIds?: LineIds): Line {
    const id = line ? line.id : createId(lineIds);
    const attributes = line ? line.attributes : {};
    return { id, attributes, content: new Delta(), length: 1 };
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
