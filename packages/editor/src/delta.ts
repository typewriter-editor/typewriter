import diff from './diff';
import { deepEqual } from './equal';

export interface Attributes {
  [name: string]: any
}

export interface Embed {
  [name: string]: any
}

export interface DeltaOp {
  retain?: number;
  delete?: number;
  insert?: string | Embed;
  attributes?: Attributes;
}

export interface DeltaTextOp extends DeltaOp {
  insert: string;
}

export interface DeltaEmbedOp extends DeltaOp {
  insert: Embed;
}

export interface Line {
  ops: Delta;
  attributes?: Attributes;
  start: number;
  end: number;
  index: number;
}

const NULL_CHARACTER = String.fromCharCode(0);  // Placeholder char for embed in diff()

export default class Delta {
  ops: DeltaOp[];

  constructor(ops: DeltaOp[] = []) {
    this.ops = ops;
  }

  /**
   * Appends an insert operation. Returns this for chainability.
   *
   * @param {String|Object} text Represents text or embed to insert
   * @param {Object} attributes Optional attributes to apply
   */
  insert(text: string | Embed, attributes?: Attributes): Delta {
    var newOp: DeltaOp = {};
    if (text.length === 0) return this;
    newOp.insert = text;
    if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
      newOp.attributes = attributes;
    }
    return this._push(newOp);
  }

  /**
   * Appends a delete operation. Returns this for chainability.
   *
   * @param {Number} length Number of characters to delete
   */
  delete(length: number): Delta {
    if (length <= 0) return this;
    return this._push({ delete: length });
  }

  /**
   * Appends a retain operation. Returns this for chainability.
   *
   * @param {Number} length Number of characters to retain
   * @param {Object} attributes Optional attributes to apply
   * @returns {Delta} This delta
   */
  retain(length: number, attributes?: Attributes): Delta {
    if (length <= 0) return this;
    var newOp: DeltaOp = { retain: length };
    if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
      newOp.attributes = attributes;
    }
    return this._push(newOp);
  }

  /**
   * Freezes delta from future modifications. Returns this for chainability.
   *
   * @returns {Delta} This delta
   */
  freeze(): Delta {
    this._push = () => this;
    return this;
  }

  /**
   * Adds a new operation. Returns this for chainability.
   *
   * @param {Object} newOp A new operation
   * @returns {Delta} This delta
   */
  private _push(newOp: DeltaOp): Delta {
    var index = this.ops.length;
    var lastOp = this.ops[index - 1];
    if (typeof lastOp === 'object') {
      if (typeof newOp.delete === 'number' && typeof lastOp.delete === 'number') {
        this.ops[index - 1] = { delete: lastOp.delete + newOp.delete };
        return this;
      }
      // Since it does not matter if we insert before or after deleting at the same index,
      // always prefer to insert first
      if (typeof lastOp.delete === 'number' && newOp.insert != null) {
        index -= 1;
        lastOp = this.ops[index - 1];
        if (typeof lastOp !== 'object') {
          this.ops.unshift(newOp);
          return this;
        }
      }
      if (deepEqual(newOp.attributes, lastOp.attributes)) {
        if (typeof newOp.insert === 'string' && typeof lastOp.insert === 'string') {
          this.ops[index - 1] = { insert: lastOp.insert + newOp.insert };
          if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes
          return this;
        } else if (typeof newOp.retain === 'number' && typeof lastOp.retain === 'number') {
          this.ops[index - 1] = { retain: lastOp.retain + newOp.retain };
          if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes
          return this;
        }
      }
    }
    if (index === this.ops.length) {
      this.ops.push(newOp);
    } else {
      this.ops.splice(index, 0, newOp);
    }
    return this;
  }

  /**
   * Chops off trailing retain instructions to make the delta concise.
   *
   * @returns {Delta} This delta
   */
  chop(): Delta {
    var lastOp = this.ops[this.ops.length - 1];
    if (lastOp && lastOp.retain && !lastOp.attributes) {
      this.ops.pop();
    }
    return this;
  }

  /**
   * Returns an iterator to iterate over the operations of this delta.
   *
   * @returns {Iterator} An operation iterator with methods hasNext, next, peek, peekLength, & peekType
   */
  iterator(): Iterator {
    return new Iterator(this.ops);
  }

  /**
   * Returns an array of operations that passes a given function.
   *
   * @param {Function} predicate Function to test each operation against. Return true to keep the operation, false
   *                             otherwise
   * @returns {Array} Filtered resulting array
   */
  filter(predicate: (value: DeltaOp, index: number, array: DeltaOp[]) => any): DeltaOp[] {
    return this.ops.filter(predicate);
  }

  /**
   * Iterates through operations, calling the provided function for each operation.
   *
   * @param {Function} predicate Function to call during iteration, passing in the current operation
   */
  forEach(predicate: (value: DeltaOp, index: number, array: DeltaOp[]) => any) {
    this.ops.forEach(predicate);
  }

  /**
   * Returns a new array with the results of calling provided function on each operation.
   *
   * @param {Function} predicate Function to call, passing in the current operation, returning an element of the new
   *                             array to be returned
   * @returns {Array} A new array with each element being the result of the given function
   */
  map(predicate: (value: DeltaOp, index: number, array: DeltaOp[]) => any): any[] {
    return this.ops.map(predicate);
  }

  /**
   * Create an array of two arrays, the first with operations that pass the given function, the other that failed.
   *
   * @param {Function} predicate Function to call, passing in the current operation, returning whether that operation
   *                             passed
   * @returns {Array} A new array of two Arrays, the first with passed operations, the other with failed operations
   */
  partition(predicate: Function): [DeltaOp[], DeltaOp[]] {
    var passed = [], failed = [];
    this.forEach((op: DeltaOp) => {
      var target = predicate(op) ? passed : failed;
      target.push(op);
    });
    return [passed, failed];
  }

  /**
   * Applies given function against an accumulator and each operation to reduce to a single value.
   *
   * @param {Function} predicate Function to call per iteration, returning an accumulated value
   * @param {*} initial Initial value to pass to first call to predicate
   * @returns {*} The accumulated value
   */
  reduce(predicate: Function, initial: any): any {
    return this.ops.reduce(predicate as any, initial);
  }

  changeLength(): number {
    return this.reduce((length, entry) => {
      if (entry.insert) {
        return length + getOpLength(entry);
      } else if (entry.delete) {
        return length - entry.delete;
      }
      return length;
    }, 0) as number;
  }

  /**
   * Returns length of a Delta, which is the sum of the lengths of its operations.
   *
   * @returns {Number} The length of this delta
   */
  length(): number {
    return this.reduce((length, entry) => {
      return length + getOpLength(entry);
    }, 0) as number;
  }

  /**
   * Returns copy of delta with subset of operations.
   *
   * @param {Number} start Start index of subset, defaults to 0
   * @param {Number} end End index of subset, defaults to rest of operations
   * @returns {Array} An array slice of the operations
   */
  slice(start: number = 0, end?: number): Delta {
    if (typeof end !== 'number') end = Infinity;
    var ops = [];
    var iter = this.iterator();
    var index = 0;
    while (index < end && iter.hasNext()) {
      var nextOp;
      if (index < start) {
        nextOp = iter.next(start - index);
      } else {
        nextOp = iter.next(end - index);
        ops.push(nextOp);
      }
      index += getOpLength(nextOp);
    }
    return new Delta(ops);
  }

  /**
   * Returns a Delta that is equivalent to applying the operations of own Delta, followed by another Delta.
   *
   * @param {Delta} other Delta to compose
   */
  compose(other: Delta): Delta {
    var thisIter = this.iterator();
    var otherIter = other.iterator();
    var delta = new Delta();
    while (thisIter.hasNext() || otherIter.hasNext()) {
      if (otherIter.peekType() === 'insert') {
        delta._push(otherIter.next());
      } else if (thisIter.peekType() === 'delete') {
        delta._push(thisIter.next());
      } else {
        var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
        var thisOp = thisIter.next(length);
        var otherOp = otherIter.next(length);
        if (typeof otherOp.retain === 'number') {
          var newOp: DeltaOp = {};
          if (typeof thisOp.retain === 'number') {
            newOp.retain = length;
          } else {
            newOp.insert = thisOp.insert;
          }
          // Preserve null when composing with a retain, otherwise remove it for inserts
          var attributes = composeAttributes(thisOp.attributes, otherOp.attributes, typeof thisOp.retain === 'number');
          if (attributes) newOp.attributes = attributes;
          delta._push(newOp);

          // Optimization if rest of other is just retain
          if (!otherIter.hasNext() && deepEqual(delta.ops[delta.ops.length - 1], newOp)) {
            var rest = new Delta(thisIter.rest());
            return delta.concat(rest).chop();
          }

        // Other op should be delete, we could be an insert or retain
        // Insert + delete cancels out
        } else if (typeof otherOp.delete === 'number' && typeof thisOp.retain === 'number') {
          delta._push(otherOp);
        }
      }
    }
    return delta.chop();
  }

  /**
   * Returns a new Delta representing the concatenation of this and another document Delta's operations.
   *
   * @param {Delta} other Document Delta to concatenate
   * @returns {Delta} Concatenated document Delta
   */
  concat(other: Delta): Delta {
    var delta = new Delta(this.ops.slice());
    if (other.ops.length > 0) {
      delta._push(other.ops[0]);
      delta.ops = delta.ops.concat(other.ops.slice(1));
    }
    return delta;
  }

  /**
   * Returns a Delta representing the difference between two documents. Optionally, accepts a suggested index where
   * change took place, often representing a cursor position before change.
   *
   * @param {Delta} other Document Delta to diff against
   * @param {Number} index Suggested index where change took place
   * @returns {Delta} Difference between the two documents
   */
  diff(other: Delta, index?: number): Delta {
    if (this.ops === other.ops) {
      return new Delta();
    }
    var strings = [this, other].map((delta) => {
      return delta.map((op: DeltaOp) => {
        if (op.insert != null) {
          return typeof op.insert === 'string' ? op.insert : NULL_CHARACTER;
        }
        var prep = (delta === other) ? 'on' : 'with';
        throw new Error('diff() called ' + prep + ' non-document');
      }).join('');
    });
    var delta = new Delta();
    var diffResult = diff(strings[0], strings[1], index);
    var thisIter = this.iterator();
    var otherIter = other.iterator();
    diffResult.forEach((component) => {
      var length = component[1].length;
      while (length > 0) {
        var opLength = 0;
        switch (component[0]) {
          case diff.INSERT:
            opLength = Math.min(otherIter.peekLength(), length);
            delta._push(otherIter.next(opLength));
            break;
          case diff.DELETE:
            opLength = Math.min(length, thisIter.peekLength());
            thisIter.next(opLength);
            delta.delete(opLength);
            break;
          case diff.EQUAL:
            opLength = Math.min(thisIter.peekLength(), otherIter.peekLength(), length);
            var thisOp = thisIter.next(opLength);
            var otherOp = otherIter.next(opLength);
            if (deepEqual(thisOp.insert, otherOp.insert)) {
              delta.retain(opLength, diffAttributes(thisOp.attributes, otherOp.attributes));
            } else {
              delta._push(otherOp).delete(opLength);
            }
            break;
        }
        length -= opLength;
      }
    });
    return delta.chop();
  }

  /**
   * Iterates through document Delta, calling a given function with a Delta and attributes object, representing the line
   * segment.
   *
   * @param {Function} predicate Function to call on each line group
   * @param {String} newline Newline character, defaults to \n
   */
  eachLine(predicate: Function, newline: string = '\n') {
    var iter = this.iterator();
    var ops = new Delta();
    var index = 0;
    var lineStart = 0;
    var currentIndex = 0;

    while (iter.hasNext()) {
      if (iter.peekType() !== 'insert') return;

      var op = iter.peek();
      var nextLength = iter.peekLength();
      var start = getOpLength(op) - nextLength;
      var newlineIndex = typeof op.insert === 'string' ? op.insert.indexOf(newline, start) - start : -1;

      if (newlineIndex < 0) {
        currentIndex += nextLength;
        ops._push(iter.next());
      } else if (newlineIndex > 0) {
        currentIndex += newlineIndex;
        ops._push(iter.next(newlineIndex));
      } else {
        currentIndex += 1;
        var attributes = iter.next(1).attributes || {};
        var line = { ops, attributes, start: lineStart, end: currentIndex, index };
        if (predicate(line, index) === false) {
          return;
        }
        index += 1;
        lineStart = currentIndex;
        ops = new Delta();
      }
    }
    if (ops.length() > 0) {
      const line: Line = { ops, attributes: {}, start: lineStart, end: currentIndex, index };
      predicate(line, index);
    }
  }

  // Extends Delta, get the lines from `from` to `to`.
  getLines(from = 0, to = Infinity, newline?: string) {
    const lines = [];
    this.eachLine((line: Line) => {
      if (line.start > to || (line.start === to && from !== to)) return false;
      if (line.end > from) {
        lines.push(line);
      }
    }, newline);
    return lines;
  }

  // Extends Delta, get the line at `at`.
  getLine(at: number, newline?: string) {
    return this.getLines(at, at, newline)[0];
  }

  // Extends Delta, get the ops from `from` to `to`.
  getOps(from: number, to: number) {
    let start = 0;
    const ops = [];
    this.ops.some(op => {
      if (start >= to) return true;
      const end = start + getOpLength(op);
      if (end > from || (from === to && end === to)) {
        ops.push({ op, start, end });
      }
      start = end;
    });
    return ops;
  }

  // Extends Delta, get the op at `at`.
  getOp(at: number) {
    return this.getOps(at, at)[0];
  }

  /**
   * Transform given Delta against own operations. Used as an alias for transformPosition when called with a number.
   *
   * @param {Delta} other Delta to transform
   * @param {Boolean} priority Boolean used to break ties. If true, then this takes priority over other, that is, its
   *                           actions are considered to happen "first."
   * @returns {Delta} Transformed Delta
   */
  transform(other: Delta | number, priority = false): Delta | number {
    if (typeof other === 'number') {
      return this.transformPosition(other as number, priority);
    }
    var thisIter = this.iterator();
    var otherIter = other.iterator();
    var delta = new Delta();
    while (thisIter.hasNext() || otherIter.hasNext()) {
      if (thisIter.peekType() === 'insert' && (priority || otherIter.peekType() !== 'insert')) {
        delta.retain(getOpLength(thisIter.next()));
      } else if (otherIter.peekType() === 'insert') {
        delta._push(otherIter.next());
      } else {
        var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
        var thisOp = thisIter.next(length);
        var otherOp = otherIter.next(length);
        if (thisOp.delete) {
          // Our delete either makes their delete redundant or removes their retain
          continue;
        } else if (otherOp.delete) {
          delta._push(otherOp);
        } else {
          // We retain either their retain or insert
          delta.retain(length, transformAttributes(thisOp.attributes, otherOp.attributes, priority));
        }
      }
    }
    return delta.chop();
  }

  /**
   * Transform an index against the delta. Useful for representing cursor/selection positions.
   *
   * @param {Number} index Index to transform
   * @param {Boolean} priority Boolean used to break ties. If true, then this takes priority over other, that is, its
   *                           actions are considered to happen "first."
   * @returns {Number} Transformed index
   */
  transformPosition(index: number, priority: boolean = false): number {
    var thisIter = this.iterator();
    var offset = 0;
    while (thisIter.hasNext() && offset <= index) {
      var length = thisIter.peekLength();
      var nextType = thisIter.peekType();
      thisIter.next();
      if (nextType === 'delete') {
        index -= Math.min(length, index - offset);
        continue;
      } else if (nextType === 'insert' && (offset < index || !priority)) {
        index += length;
      }
      offset += length;
    }
    return index;
  }

}


/**
 * Create an attributes object that is equivalent to applying the attributes of the target followed by the source.
 *
 * @param {Object} target Target attributes object which will have the source applied to
 * @param {Object} source Source attributes object being applied to the target
 * @param {Boolean} keepNull Whether to keep null values from source
 * @returns {Object} A new attributes object (or undefined if empty) with both
 */
export function composeAttributes(target: Attributes = {}, source: Attributes = {}, keepNull: boolean): Attributes {
  var attributes = { ...target, ...source };

  if (!keepNull) Object.keys(attributes).forEach(key => {
    if (attributes[key] == null) delete attributes[key];
  });

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/**
 * Finds the difference between two attributes objects. Returns the source attributes that are different from the
 * target attributes.
 *
 * @param {Object} target An attributes object
 * @param {Object} source An attributes object
 * @returns {Object} The difference between the two attribute objects or undefined if there is none
 */
export function diffAttributes(target: Attributes = {}, source: Attributes = {}): Attributes {
  var attributes = Object.keys(target).concat(Object.keys(source)).reduce((attributes, key) => {
    if (!deepEqual(target[key], source[key])) {
      attributes[key] = source[key] === undefined ? null : source[key];
    }
    return attributes;
  }, {});

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/**
 * Transforms the attributes of source over target (or the other way around if priority is set). Will return an
 * attributes object which has all the values from source if priority if false or will have the values from source that
 * are set on target.
 *
 * @param {Object} target An attributes object
 * @param {Object} source An attributes object
 * @param {Boolean} priority If target has priority over source
 */
export function transformAttributes(target: Attributes, source: Attributes, priority: boolean): Attributes {
  if (typeof target !== 'object') return source;
  if (typeof source !== 'object') return undefined;
  if (!priority) return source;  // b simply overwrites us without priority

  var attributes = Object.keys(source).reduce((attributes, key) => {
    if (target[key] === undefined) attributes[key] = source[key];  // null is a valid value
    return attributes;
  }, {});

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/**
 * Determines the length of a Delta operation.
 *
 * @param {Object} op An operation entry from a Delta object
 * @returns {Number} The length of the op
 */
export function getOpLength(op: DeltaOp): number {
  if (typeof op.delete === 'number') {
    return op.delete;
  } else if (typeof op.retain === 'number') {
    return op.retain;
  } else {
    return typeof op.insert === 'string' ? op.insert.length : 1;
  }
}

/**
 * An iterator to handle iterating over a list of Delta operations efficiently.
 */
export class Iterator {
  ops: DeltaOp[];
  index: number;
  offset: number;

  constructor(ops: DeltaOp[]) {
    this.ops = ops;
    this.index = 0;
    this.offset = 0;
  }

  /**
   * Determine if there will be another operation returned by `next`.
   *
   * @returns {Boolean} Whether there are more operations to iterate over
   */
  hasNext(): boolean {
    return this.peekLength() < Infinity;
  }

  /**
   * Get the next operation, optionally limited/sliced by length. If an operation is sliced by length, the next call to
   * `next` will return more of that operation until it is returned in full.
   *
   * @param {Number} length Optionally limit the returned operation by length, slicing it down as needed
   */
  next(length: number = Infinity): DeltaOp {
    var nextOp = this.ops[this.index];
    if (!nextOp) return { retain: Infinity };

    var offset = this.offset;
    var opLength = getOpLength(nextOp);

    // Update index and offset
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
      var retOp: DeltaOp = {};
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
  }

  /**
   * Return the next entry.
   *
   * @returns {Object} The next entry in the ops array.
   */
  peek(): DeltaOp {
    return this.ops[this.index];
  }

  /**
   * Check the length of the next entry.
   *
   * @returns {Number} The length of the next entry or Infinity if there is no next entry
   */
  peekLength(): number {
    if (this.ops[this.index]) {
      // Should never return 0 if our index is being managed correctly
      return getOpLength(this.ops[this.index]) - this.offset;
    } else {
      return Infinity;
    }
  }

  /**
   * Check the type of the next entry, delete, retain, or insert.
   *
   * @returns {String} The type of the next entry
   */
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

  rest(): DeltaOp[] {
    if (!this.hasNext()) {
      return [];
    } else if (this.offset === 0) {
      return this.ops.slice(this.index);
    } else {
      var offset = this.offset;
      var index = this.index;
      var next = this.next();
      var rest = this.ops.slice(this.index);
      this.offset = offset;
      this.index = index;
      return [next].concat(rest);
    }
  }
}
