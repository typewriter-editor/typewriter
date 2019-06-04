import Delta from './Delta';
import Op from './Op';
import AttributeMap from './AttributeMap';

export interface Line {
  ops: Delta;
  attributes: AttributeMap;
  start: number;
  end: number;
  index: number;
}

export interface OpInfo {
  op: Op;
  start: number;
  end: number;
}

// Get the content lines from `from` to `to`.
export function getLines(delta: Delta, from = 0, to = Infinity, newline?: string): Line[] {
  const lines: Line[] = [];
  eachLine(delta, (ops: Delta, attributes: AttributeMap, index: number, start: number, end: number) => {
    if (start > to || (start === to && from !== to)) return false;
    if (end > from) {
      lines.push({ ops, attributes, start, end, index });
    }
  }, newline);
  return lines;
}

// Get the line at `at`.
export function getLine(delta: Delta, at: number, newline?: string): Line {
  return getLines(delta, at, at, newline)[0];
}

// Extends Delta, get the ops from `from` to `to`.
export function getOps(delta: Delta, from: number, to: number): OpInfo[] {
  let start = 0;
  const ops: OpInfo[] = [];
  delta.ops.some(op => {
    if (start >= to) return true;
    const end = start + Op.length(op);
    if (end > from || (from === to && end === to)) {
      ops.push({ op, start, end });
    }
    start = end;
    return false;
  });
  return ops;
}

// Extends Delta, get the op at `at`.
export function getOp(delta: Delta, at: number): OpInfo {
  return getOps(delta, at, at)[0];
}


// Like Delta's eachLine, but providing a start/end length/index for the line, where it starts and stops in the delta.
export function eachLine(delta: Delta,
  predicate: (
    line: Delta,
    attributes: AttributeMap,
    index: number,
    start: number,
    end: number
  ) => boolean | void,
  newline: string = '\n',
): void {
  const iter = Op.iterator(delta.ops);
  let line = new Delta();
  let i = 0;
  let start = 0;
  let end = 0;
  while (iter.hasNext()) {
    if (iter.peekType() !== 'insert') {
      return;
    }
    const thisOp = iter.peek();
    const length = iter.peekLength();
    const opStart = Op.length(thisOp) - length;
    const index =
      typeof thisOp.insert === 'string'
        ? thisOp.insert.indexOf(newline, opStart) - opStart
        : -1;
    if (index < 0) {
      end += length;
      line.push(iter.next());
    } else if (index > 0) {
      end += index;
      line.push(iter.next(index));
    } else {
      end += 1;
      if (predicate(line, iter.next(1).attributes || {}, i, start, end) === false) {
        return;
      }
      i += 1;
      start = end;
      line = new Delta();
    }
  }
  if (line.length() > 0) {
    predicate(line, {}, i, start, end);
  }
}