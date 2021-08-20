import LineIterator from './Iterator';
import OpIterator from '../delta/Iterator';
import Line, { LineIds } from './Line';
import Op from '../delta/Op';


namespace LineOp {
  export function iterator(lines: Line[], lineIds?: LineIds) {
    return new LineOpIterator(lines, lineIds);
  }

  export const length = Op.length;
}

export default LineOp;

class LineOpIterator {
  lineIterator: LineIterator;
  opsIterator: OpIterator;

  constructor(lines: Line[], lineIds?: LineIds) {
    this.lineIterator = new LineIterator(lines, lineIds);
    const line = this.lineIterator.peek();
    this.opsIterator = new OpIterator(line?.content.ops || []);
  }

  hasNext(): boolean {
    return this.opsIterator.hasNext() || this.lineIterator.hasNext();
  }

  skip(length: number) {
    let skipped = 0;
    while (this.lineIterator.peekLength() < length) {
      const len = Line.length(this.nextLine());
      length -= len;
      skipped += len;
    }
    return skipped;
  }

  next(length?: number): Op {
    let op = this.opsIterator.next(length);
    if (op.retain === Infinity) {
      op = { insert: '\n' };
      const line = this.nextLine();
      if (line.attributes) op.attributes = line.attributes;
    }
    return op;
  }

  nextLine() {
    const line = this.lineIterator.next();
    const nextLine = this.lineIterator.peek();
    this.opsIterator = new OpIterator(nextLine?.content.ops || []);
    return line;
  }

  peek(): Op {
    return this.opsIterator.peek();
  }

  peekLength(): number {
    return this.opsIterator.peekLength();
  }
}
