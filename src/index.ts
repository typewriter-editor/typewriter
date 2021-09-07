import cloneDeep from './util/cloneDeep';
import intersect from './util/intersect';
import isEqual from './util/isEqual';
import diff from 'fast-diff';
import EventDispatcher from './util/EventDispatcher';
export { cloneDeep, intersect, isEqual, diff, EventDispatcher };

import AttributeMap from './delta/AttributeMap';
import Delta from './delta/Delta';
import Op, { OpIterator } from './delta/Op';
export { AttributeMap, Delta, Op, OpIterator };

export * from './doc/EditorRange';
export * from './doc/deltaToText';

import Line, { LineIterator } from './doc/Line';
import LineOp, { LineOpIterator } from './doc/LineOp';
import TextChange from './doc/TextChange';
import TextDocument from './doc/TextDocument';
export { Line, LineIterator, LineOp, LineOpIterator, TextChange as TextChange, TextDocument as TextDocument };

export * from './rendering/vdom';
export * from './typesetting/typeset';
export * from './rendering/position';
export * from './rendering/selection';
export * from './rendering/rendering';
export * from './rendering/html';
export * from './modules';
export * from './stores';
export * from './typesetting/defaults';

export * from './Source';
export * from './Editor';

import Editor from './Editor';
export { Editor };
