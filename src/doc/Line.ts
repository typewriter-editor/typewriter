import Delta from '../delta/Delta';
import AttributeMap from '../delta/AttributeMap';
import Iterator from './Iterator';
import { EditorRange } from './EditorRange';
import isEqual from '../util/isEqual';

const EMPTY_OBJ = {};
const lineInfoCache = new WeakMap<Line[], LineInfo>();

export type LineRanges = Map<Line, EditorRange>;
export type LineIds = Record<string, Line>;
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

  export function fromDelta(delta: Delta, existing: LineIds = EMPTY_OBJ) {
    const lines: Line[] = [];

    delta.eachLine((line, attr) => {
      lines.push(Line.create(line, Object.keys(attr).length ? attr : undefined, existing));
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

  export function create(content: Delta = new Delta(), attributes: AttributeMap = {}, existing: LineIds = EMPTY_OBJ): Line {
    const length = content.length() + 1;
    if (!attributes.id) attributes = { ...attributes, id: createId(existing) };
    return { attributes, content: content, length };
  }

  export function getLineInfo(lines: Line[]) {
    let info = lineInfoCache.get(lines) as LineInfo;
    if (!info) {
      const ranges = new Map<Line, EditorRange>() as LineRanges;
      const ids: LineIds = {};
      let pos = 0;
      lines.forEach(line => {
        ids[getId(line)] = line;
        ranges.set(line, [ pos, pos += line.length ])
      });
      info = { ranges, ids };
      lineInfoCache.set(lines, info);
    }
    return info;
  }

  export function createId(existing: LineIds = EMPTY_OBJ) {
    let id: string;
    while (existing[(id = Math.random().toString(36).slice(2))]);
    return id;
  }
}

function arrayShallowEqual(value: Array<any>, other: Array<any>) {
  return value.length === other.length && value.every((item, i) => other[i] === item);
}

export default Line;
