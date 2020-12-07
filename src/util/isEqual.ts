const EMPTY_OBJ = {};
const EXCLUDE_NONE = () => false;

interface IsEqualOptions {
  shallow?: boolean;
  partial?: boolean;
  excludeProps?: Set<string>;
}

export default function isEqual(value: any, other: any, options: IsEqualOptions = EMPTY_OBJ): boolean {
  if (value === other) return true;
  const valueType = typeof value;
  const otherType = typeof value;

  // Special case for NaN
  if (valueType === 'number' && otherType === 'number' && isNaN(value) && isNaN(other)) return true;

  // If a basic type or not the same class
  if (!value || !other || valueType !== 'object' || otherType !== 'object' || value.constructor !== other.constructor) {
    return false;
  }

  // Dates
  if (value.valueOf() !== value) {
    return isEqual(value.valueOf(), other.valueOf(), options);
  }

  const compare = options.shallow ? exactlyEqual : isEqual;

  // Iterables including arrays
  if (typeof value[Symbol.iterator] === 'function') {
    const valueIter = value[Symbol.iterator]();
    const otherIter = other[Symbol.iterator]();
    let valueResult = valueIter.next();
    let otherResult = otherIter.next();
    while (!valueResult.done && !otherResult.done) {
      if (!compare(valueResult.value, otherResult.value, options)) return false;
      valueResult = valueIter.next();
      otherResult = otherIter.next();
    }
    return valueResult.done === otherResult.done;
  }

  const excluded = options.excludeProps ? options.excludeProps.has.bind(options.excludeProps) : EXCLUDE_NONE;

  // Objects
  const valueKeys = Object.keys(value);
  const otherKeys = Object.keys(other);
  return (options.partial || valueKeys.length === otherKeys.length)
    && otherKeys.every(key => excluded(key) || (value.hasOwnProperty(key) && compare(other[key], value[key], options)));
}

function exactlyEqual(value: any, other: any) {
  return value === other;
}
