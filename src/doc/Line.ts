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
  attributes: AttributeMap;
  content: Delta;
  length: number;
}


namespace Line {
  export function iterator(lines: Line[]) {
    return new Iterator(lines);
  }

  export function length(line: Line): number {
    return line.length;
  }

  export function getId(line: Line): string {
    return line.attributes.id;
  }

  export function equal(value: Line, other: Line) {
    return isEqual(value.attributes, other.attributes) && isEqual(value.content.ops, other.content.ops);
  }

  export function fromDelta(delta: Delta, existing?: LineIds) {
    const lines: Line[] = [];

    const ids = new Map(existing || []);

    delta.eachLine((content, attr) => {
      const line = Line.create(content, Object.keys(attr).length ? attr : undefined, ids);
      ids.set(Line.getId(line), line);
      lines.push(line);
    });

    return lines;
  }

  export function toDelta(lines: Line[], keepIds?: boolean): Delta {
    let delta = new Delta();
    lines.forEach(line => {
      delta = delta.concat(line.content);
      let attributes = line.attributes;
      if (!keepIds) {
        const { id, ...rest } = attributes;
        attributes = rest;
      }
      delta.insert('\n', attributes);
    });
    return delta;
  }

  export function create(content: Delta = new Delta(), attributes: AttributeMap = {}, existing?: LineIds): Line {
    const length = content.length() + 1;
    if (!attributes.id) attributes = { ...attributes, id: createId(existing) };
    return { attributes, content: content, length };
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
