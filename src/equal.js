
export function shallowEqual(objA, objB) {
  return valueEqual(objA, objB, strictEqual);
}

export function deepEqual(objA, objB) {
  return valueEqual(objA, objB, valueEqual);
}

function strictEqual(valueA, valueB) {
  return valueA === valueB;
}

function valueEqual(valueA, valueB, propEqual) {
  if (valueA === valueB) return true;
  if (valueA instanceof Date && valueB instanceof Date) return valueA.getTime() === valueB.getTime();
  if (!valueA || !valueB || typeof valueA !== 'object' && typeof valueB !== 'object')
    return valueA === valueB;
  return objectEqual(valueA, valueB, propEqual);
}

function objectEqual(objA, objB, propEqual) {
  if (objA.prototype !== objB.prototype) return false;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key, i) => key === keysB[i] && propEqual(objA[key], objB[key], propEqual));
}
