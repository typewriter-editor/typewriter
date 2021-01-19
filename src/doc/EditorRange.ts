export type EditorRange = [number, number];

// Put it in document order (lower number first)
export function normalizeRange(range: EditorRange): EditorRange {
  if (!range) return range;
  if (range[0] > range[1]) range = [ range[1], range[0] ];
  return range;
}
