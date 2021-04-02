import Delta from '../delta/Delta';


export function deltaToText(delta: Delta) {
  return delta.map(op => typeof op.insert === 'string' ? op.insert : ' ').join('');
}
