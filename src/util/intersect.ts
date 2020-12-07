

export default function intersect(value: object, other: object) {
  const obj: object = {};
  Object.keys(value).forEach(key => {
    if (value[key] === other[key]) obj[key] = value[key];
  });
  return obj;
}
