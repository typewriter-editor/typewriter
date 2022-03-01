import { isEqual, TextDocument, AttributeMap, Line, EditorRange, Delta, Op } from '@typewriter/document';
import { h, patch, VChild, VNode } from './vdom';
import Editor from '../Editor';
import { LineType } from '../typesetting/typeset';
import { applyDecorations } from '../modules/decorations';

const EMPTY_ARR = [];
const BR = h('br', {});
const nodeFormatType = new WeakMap();
const linesType = new WeakMap<AttributeMap, LineType>();
const linesMultiples = new WeakMap<Line, Line[]>();
const linesCombined = new WeakMap<Line[], CombinedData>();
const nodeRanges = new WeakMap<HTMLElement, WeakMap<Node, EditorRange>>();

export type CombinedEntry = Line | Line[];
export type Combined = CombinedEntry[];
interface CombinedData {
  combined: Combined;
  byKey:  Record<string, CombinedEntry>;
}
type LineRanges = [EditorRange, EditorRange];
export interface HTMLLineElement extends HTMLElement {
  key: string;
}

export function getLineNodeStart(root: HTMLElement, node: Node) {
  return nodeRanges.get(root)?.get(node)?.[0] as number;
}

export function getLineNodeEnd(root: HTMLElement, node: Node) {
  return nodeRanges.get(root)?.get(node)?.[1] as number;
}

export function setLineNodesRanges(editor: Editor) {
  const { root, doc } = editor;
  const combined = combineLines(editor, doc.lines);
  const ranges = new WeakMap<Node, EditorRange>();
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i] as HTMLLineElement;
    if (!child.key) continue;
    const entry = combined.byKey[child.key];
    if (!entry) continue;
    if (Array.isArray(entry)) {
      // set the range for the entire combined section
      ranges.set(child, [ doc.getLineRange(entry[0])[0], doc.getLineRange(entry[entry.length - 1])[1] ]);

      // set the ranges for each line inside
      const lineElements = child.querySelectorAll(editor.typeset.lines.selector) as any as HTMLLineElement[];
      for (let i = 0; i < lineElements.length; i++) {
        const lineElement = lineElements[i];
        const line = doc.getLineBy(lineElement.key);
        if (!line) continue;
        ranges.set(lineElement, doc.getLineRange(line));
      }
    } else {
      ranges.set(child, doc.getLineRange(entry));
    }
  }
  const lineElements = root.querySelectorAll(editor.typeset.lines.selector) as any as HTMLLineElement[];
  for (let i = 0; i < lineElements.length; i++) {
    const lineElement = lineElements[i];
    if (ranges.has(lineElement) || !lineElement.key) continue;
    const line = doc.getLineBy(lineElement.key);
    ranges.set(lineElement, doc.getLineRange(line));
  }
  nodeRanges.set(root, ranges);
}


export function render(editor: Editor, doc: TextDocument) {
  const { root } = editor;
  editor.dispatchEvent(new Event('rendering'));
  patch(root, renderDoc(editor, doc)) as HTMLElement;
  setLineNodesRanges(editor);
  editor.dispatchEvent(new Event('render'));
  editor.dispatchEvent(new Event('rendered'));
}


export function renderChanges(editor: Editor, oldDoc: TextDocument, newDoc: TextDocument) {
  const { root } = editor;
  // Ranges of line indexes, not document indexes
  const oldCombined = combineLines(editor, oldDoc.lines).combined;
  const newCombined = combineLines(editor, newDoc.lines).combined;
  const [ oldRange, newRange ] = getChangedRanges(oldCombined, newCombined);

  // If the changes include added or deleted lines, expand ranges by 1 on each side to ensure the vdom can rerender
  if (!isEqual(oldRange, newRange)) {
    oldRange[0] = Math.max(0, oldRange[0] - 1);
    newRange[0] = Math.max(0, newRange[0] - 1);
    oldRange[1] = Math.min(oldCombined.length, oldRange[1] + 1);
    newRange[1] = Math.min(newCombined.length, newRange[1] + 1);
    if (root.childNodes.length !== oldCombined.length) {
      // The DOM has changed since we last rendered, adjust the oldRange accordingly to get the correct slice
      oldRange[1] += root.childNodes.length - oldCombined.length;
    }
  }

  const oldSlice = Array.from(root.childNodes).slice(oldRange[0], oldRange[1]);
  const newSlice = newCombined.slice(newRange[0], newRange[1]);
  if (!oldSlice.length && !newSlice.length) return render(editor, newDoc);
  editor.dispatchEvent(new Event('rendering'));
  patch(root, renderCombined(editor, newSlice), oldSlice) as HTMLElement;
  setLineNodesRanges(editor);
  editor.dispatchEvent(new Event('render'));
  editor.dispatchEvent(new Event('rendered'));
}

export function renderDoc(editor: Editor, doc: TextDocument, forHTML?: boolean) {
  return renderCombined(editor, combineLines(editor, doc.lines).combined, forHTML);
}

export function renderCombined(editor: Editor, combined: Combined, forHTML?: boolean) {
  return combined.map(line => renderLine(editor, line, forHTML)).filter(Boolean) as VNode[];
}

export function renderLine(editor: Editor, line: CombinedEntry, forHTML?: boolean) {
  return Array.isArray(line) ? renderMultiLine(editor, line, forHTML) : renderSingleLine(editor, line, forHTML);
}

export function renderSingleLine(editor: Editor, line: Line, forHTML?: boolean) {
  const type = getLineType(editor, line);
  if (!type.render) throw new Error('No render method defined for line');
  const node = type.render(line.attributes as AttributeMap, renderInline(editor, line.content), editor, forHTML);
  applyDecorations(node, line.attributes);
  node.key = line.id;
  return node;
}

export function renderMultiLine(editor: Editor, lines: Line[], forHTML?: boolean) {
  const type = getLineType(editor, lines[0]);
  if (!type.renderMultiple) throw new Error('No render method defined for line');
  const node = type.renderMultiple(lines.map(line => [ line.attributes, renderInline(editor, line.content), line.id ]), editor, forHTML);
  node.key = lines[0].id;
  return node;
}

// Join multi-lines into arrays. Memoize the results.
export function combineLines(editor: Editor, lines: Line[]): CombinedData {
  const cache = linesCombined.get(lines);
  if (cache) return cache;

  const combined: Combined = [];
  const byKey: Record<string, CombinedEntry> = {};
  let collect: Line[] = [];

  lines.forEach((line, i) => {
    const type = getLineType(editor, line);

    if (type.shouldCombine) {
      collect.push(line);
      const next = lines[i + 1];
      if (!next || getLineType(editor, next) !== type || !type.shouldCombine(line.attributes, next.attributes)) {
        // By keeping the last array reference we can optimize updates
        const last = linesMultiples.get(collect[0]);
        if (last && last.length === collect.length && collect.every((v, i) => last[i] === v)) {
          collect = last;
        } else {
          linesMultiples.set(collect[0], collect);
        }
        combined.push(collect);
        byKey[collect[0].id] = collect;
        collect = [];
      }
    } else if (type.render) {
      combined.push(line);
      byKey[line.id] = line;
    }
  });

  const data = { combined, byKey };
  linesCombined.set(lines, data);
  return data;
}

// Most changes will occur to adjacent lines, so the simplistic approach
export function getChangedRanges(oldC: Combined, newC: Combined): LineRanges {
  const oldLength = oldC.length;
  const newLength = newC.length;
  const minLength = Math.min(oldLength, newLength);
  let oldStart = 0, oldEnd = 0, newStart = 0, newEnd = 0;
  for (let i = 0; i < minLength; i++) {
    if (!isSame(oldC[i], newC[i])) {
      oldStart = newStart = i;
      break;
    }
  }
  for (let i = 0; i < minLength; i++) {
    if (!isSame(oldC[oldLength - i - 1], newC[newLength - i - 1])) {
      oldEnd = oldLength - i;
      newEnd = newLength - i;
      break;
    }
  }
  return [[ oldStart, oldEnd ], [ newStart, newEnd ]];
}


export function renderInline(editor: Editor, delta: Delta, forHTML?: boolean) {
  const { formats, embeds } = editor.typeset;
  let inlineChildren: VChild[] = [];
  let trailingBreak = true;

  delta.ops.forEach((op, i, array) => {
    let children: VChild[] = [];
    if (typeof op.insert === 'string') {
      const prev = array[i - 1];
      const next = array[i + 1];
      let str: string = op.insert.replace(/  /g, '\xA0 ').replace(/  /g, ' \xA0');
      if (!prev || typeof prev.insert === 'object') str = str.replace(/^ /, '\xA0');
      if (!next || typeof next.insert === 'object' || startsWithSpace(next)) str = str.replace(/ $/, '\xA0');
      trailingBreak = false;
      children.push(str);
    } else if (op.insert) {
      const embed = embeds.findByAttributes(op.insert);
      if (embed?.render) {
        children.push(embed.render(op.insert, EMPTY_ARR, editor, forHTML));
        if (embed.name === 'br') trailingBreak = true;
        else if (!embed.noFill) trailingBreak = false;
      }
    }

    if (op.attributes) {
      // Sort them by the order found in formats
      Object.keys(op.attributes).sort((a, b) => formats.priority(b) - formats.priority(a)).forEach(name => {
        const type = formats.get(name);
        if (type?.render) {
          const node = type.render(op.attributes as AttributeMap, children, editor, forHTML);
          if (node) {
            nodeFormatType.set(node, type); // Store for merging
            children = [ node ];
          }
        }
      });
    }

    inlineChildren.push.apply(inlineChildren, children);
  });

  // Merge marks to optimize
  inlineChildren = mergeChildren(inlineChildren);
  if (trailingBreak) inlineChildren.push(BR);

  return inlineChildren;
}


function isSame(oldEntry: CombinedEntry, newEntry: CombinedEntry): boolean {
  if (oldEntry === newEntry) return true;
  return Array.isArray(oldEntry)
    && Array.isArray(newEntry)
    && oldEntry.length === newEntry.length
    && oldEntry.every((b, i) => b === newEntry[i]);
}


function getLineType(editor: Editor, line: Line): LineType {
  let type = linesType.get(line.attributes);
  if (!type) {
    type = editor.typeset.lines.findByAttributes(line.attributes, true);
    linesType.set(line.attributes, type);
  }
  return type;
}



// Joins adjacent mark nodes
function mergeChildren(oldChildren: VChild[]) {
  const children: VChild[] = [];
  oldChildren.forEach((next, i) => {
    const index = children.length - 1;
    const prev = children[index];

    if (prev && typeof prev !== 'string' && typeof next !== 'string' && nodeFormatType.has(prev) &&
      nodeFormatType.get(prev) === nodeFormatType.get(next) && isEqual(prev.props, next.props))
    {
      prev.children = prev.children.concat(next.children);
    } else if (prev && typeof prev === 'string' && typeof next === 'string') {
      children[index] += next; // combine adjacent text nodes
    } else {
      children.push(next);
      if (prev && typeof prev !== 'string' && prev.children) {
        prev.children = mergeChildren(prev.children);
      }
    }
  });
  if (children.length) {
    const last = children[children.length - 1];
    if (last && typeof last !== 'string' && last.children) {
      last.children = mergeChildren(last.children);
    }
  }
  return children;
}

function startsWithSpace(op: Op) {
  return typeof op.insert === 'string' && op.insert[0] === ' ';
}
