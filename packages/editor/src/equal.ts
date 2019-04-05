
export function shallowEqual(valueA: any, valueB: any): boolean {
  return valueEqual(valueA, valueB, strictEqual);
}

export function deepEqual(valueA: any, valueB: any): boolean {
  return valueEqual(valueA, valueB, valueEqual);
}

function strictEqual(valueA: any, valueB: any): boolean {
  return valueA === valueB;
}

function valueEqual(valueA: any, valueB: any, propEqual: Function) {
  if (valueA === valueB) return true;
  if (valueA instanceof Date && valueB instanceof Date) return valueA.getTime() === valueB.getTime();
  if (!valueA || !valueB || typeof valueA !== 'object' && typeof valueB !== 'object')
    return valueA === valueB;
  return objectEqual(valueA, valueB, propEqual);
}

function objectEqual(objA: any, objB: any, propEqual: Function): boolean {
  if (objA.prototype !== objB.prototype) return false;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key, i) => key === keysB[i] && propEqual(objA[key], objB[key], propEqual));
}
