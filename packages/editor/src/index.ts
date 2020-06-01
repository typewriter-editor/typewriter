import EventDispatcher from './event-dispatcher';
import Editor from './editor';
import Delta from './Delta';
import Op from './Op';
import AttributeMap from './AttributeMap';
import diff from 'fast-diff';

export { fromDelta } from './DeltaBlocks';
export { EventDispatcher, Editor, Delta, Op, AttributeMap, diff };
export { EditorRange, SOURCE_USER, SOURCE_API, SOURCE_SILENT } from './editor';
export { shallowEqual, deepEqual } from './equal';
export { getLines, getLine, getOps, getOp, Line, OpInfo } from './delta-helpers';
