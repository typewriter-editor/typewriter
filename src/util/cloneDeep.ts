
// Just work with plain objects and arrays
export default function cloneDeep(value: any): any {
  if (!value) return value;
  if (typeof value.toJSON === 'function') value = value.toJSON();
  if (Array.isArray(value)) return value.map(cloneDeep);
  if (typeof value === 'object') {
    const clone = {};
    Object.keys(value).forEach(key => clone[key] = cloneDeep(value[key]));
    return clone;
  }
  return value;
}
