import AttributeMap from './AttributeMap';

interface Op {
  // only one property out of {insert, delete, retain} will be present
  insert?: string | object;
  delete?: number;
  retain?: number;

  attributes?: AttributeMap;
}

namespace Op {
  export function iterator(ops: Op[]): OpIterator {
    return new OpIterator(ops);
  }

  export function length(op: Op): number {
    if (typeof op.delete === 'number') {
      return op.delete;
    } else if (typeof op.retain === 'number') {
      return op.retain;
    } else {
      return typeof op.insert === 'string' ? op.insert.length : 1;
    }
  }
}

export default Op;

export class OpIterator {
  ops: Op[];
  index: number;
  offset: number;

  constructor(ops: Op[]) {
    this.ops = ops;
    this.index = 0;
    this.offset = 0;
  }

  hasNext(): boolean {
    return !!this.peek();
  }

  next(length?: number): Op {
    if (!length) {
      length = Infinity;
    }
    const nextOp = this.ops[this.index];
    if (nextOp) {
      const offset = this.offset;
      const opLength = Op.length(nextOp);
      if (length >= opLength - offset) {
        length = opLength - offset;
        this.index += 1;
        this.offset = 0;
      } else {
        this.offset += length;
      }
      if (typeof nextOp.delete === 'number') {
        return { delete: length };
      } else {
        if (opLength === length) return nextOp;
        const retOp: Op = {};
        if (nextOp.attributes) {
          retOp.attributes = nextOp.attributes;
        }
        if (typeof nextOp.retain === 'number') {
          retOp.retain = length;
        } else if (typeof nextOp.insert === 'string') {
          retOp.insert = nextOp.insert.substr(offset, length);
        } else {
          // offset should === 0, length should === 1
          retOp.insert = nextOp.insert;
        }
        return retOp;
      }
    } else {
      return { retain: Infinity };
    }
  }

  peek(): Op {
    return this.ops[this.index];
  }

  peekLength(): number {
    if (this.ops[this.index]) {
      // Should never return 0 if our index is being managed correctly
      return Op.length(this.ops[this.index]) - this.offset;
    } else {
      return Infinity;
    }
  }

  peekType(): string {
    if (this.ops[this.index]) {
      if (typeof this.ops[this.index].delete === 'number') {
        return 'delete';
      } else if (typeof this.ops[this.index].retain === 'number') {
        return 'retain';
      } else {
        return 'insert';
      }
    }
    return 'retain';
  }

  rest(): Op[] {
    if (!this.hasNext()) {
      return [];
    } else if (this.offset === 0) {
      return this.ops.slice(this.index);
    } else {
      const offset = this.offset;
      const index = this.index;
      const next = this.next();
      const rest = this.ops.slice(this.index);
      this.offset = offset;
      this.index = index;
      return [next].concat(rest);
    }
  }
}
