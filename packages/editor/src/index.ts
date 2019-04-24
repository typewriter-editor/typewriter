export { default as EventDispatcher } from './event-dispatcher';
export { default as Delta, Embed, Attributes, DeltaEmbedOp, DeltaOp, DeltaTextOp, Line } from './delta';
export { default as Editor, EditorRange, SOURCE_USER, SOURCE_API, SOURCE_SILENT } from './editor';
export type Selection = [number, number];
export { default as diff, DIFF_EQUAL, DIFF_INSERT, DIFF_DELETE } from './diff';
export { shallowEqual, deepEqual } from './equal';
