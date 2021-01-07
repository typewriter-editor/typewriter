import Editor, { EditorChangeEvent } from '../Editor';
import TextDocument from '../doc/TextDocument';
import { EditorRange } from '../doc/EditorRange';
import { combineLines, Combined, getChangedRanges, HTMLLineElement, renderLine, setLineNodesRanges } from '../rendering/rendering';
import isEqual from '../util/isEqual';
import { h, patch, VNode } from '../rendering/vdom';
import { setSelection } from '../rendering/selection';


export interface VirtualRenderWhat {
  old?: TextDocument;
  doc?: TextDocument;
  selection: EditorRange | null;
}

type HeightInfo = [marginTop: number, height: number, marginBottom: number];


export function virtualRendering(editor: Editor) {
  let start = 0;
  let end = 0;
  let heightMap = [] as HeightInfo[];
  let children: HTMLLineElement[] = [];
  let viewport = getScrollParent(editor.root);
  let offsetTop: number;
  let viewportHeight = 0;
  let averageHeight = 40;
  let items: Combined;
  let itemsDoc: TextDocument;
  let lastSelection: EditorRange | null = null;
  let lineSelection: EditorRange | null = null; // not doc index but Combined index
  let toRender: number[];
  let hasChanged = false;
  let updateQueued = true;


  viewport.addEventListener('scroll', onScroll, { passive: true });
  editor.on('change', onChange);
  const offResize = onResize(viewport, (width, height, changed) => {
    viewportHeight = height;
    if (changed & WIDTH) heightMap = []; // content may be different heights, recalculate everything
    update();
  });



  function render(what?: VirtualRenderWhat) {
    if (!what || !items) {
      const { doc } = editor.modules.decorations as { doc: TextDocument } || editor;
      items = combineLines(editor, doc.lines).combined;
      itemsDoc = doc;
      hasChanged = true;
      lastSelection = doc.selection;
      update();
    } else {
      const { doc, old } = what;
      const selection = what.selection || null;
      const newSelection = selection && selectedLineIndexes(selection, items).sort((a, b) => a - b);

      if (!isEqual(newSelection, lineSelection)) {
        hasChanged = hasChanged || !withinRender(newSelection, true);
        lineSelection = newSelection;
      }

      if (old && doc) {
        const newItems = combineLines(editor, doc.lines).combined;
        const [ oldRange, newRange ] = getChangedRanges(items, newItems);
        if (oldRange[0] + oldRange[1] + newRange[0] + newRange[1] > 0) {
          hasChanged = true;
          const oldLength = oldRange[1] - oldRange[0], newLength = newRange[1] - newRange[0];
          if (oldLength < newLength) {
            // lines were added, add empty spots into the heightMap
            const empty = new Array(newLength - oldLength).fill(undefined)
            heightMap.splice(oldRange[1], 0, ...empty);
          } else if (oldLength > newLength) {
            heightMap.splice(oldRange[0], oldLength - newLength);
          }
        }

        items = newItems;
        itemsDoc = doc;
      } else if (doc) {
        items = combineLines(editor, doc.lines).combined;
        itemsDoc = doc;
        hasChanged = true;
      }

      lastSelection = selection;
      if (hasChanged) update();
    }
  }


  // Determine start and end of visible range
  function update() {
    updateQueued = false;
    if (!items) return;
    const { scrollTop } = viewport;
    offsetTop = getOffsetTop();
    const oldStart = start;
    const previousHeights = heightMap.slice();
    let didUpdate = false;
    let count = 0; // failsafe

    while (shouldUpdate() && count++ < 20) {
      didUpdate = true;
      hasChanged = false;
      renderToDom();
      updateHeights();
    }
    if (count >= 20) console.error('Updated virtual max times');

    setSelection(editor, lastSelection);
    if (!didUpdate) return;

    // prevent jumping if we scrolled up into unknown territory
    if (start < oldStart) {
      let expectedHeight = 0;
      let actualHeight = 0;
      let offset = toRender.indexOf(start);

      for (let i = start; i < oldStart; i++) {
        const childIndex = i - start + offset;
        if (children[childIndex]) {
          expectedHeight += getHeightFor(i, previousHeights);
          actualHeight += getHeightFor(i);
        }
      }

      const d = actualHeight - expectedHeight;
      viewport.scrollTo(0, scrollTop + d);
    }
  }


  function shouldUpdate() {
    const { scrollTop } = viewport;

    const renderSet = new Set([ 0, items.length - 1, ...(lineSelection || []) ]);

    let i = 0;
    let y = offsetTop;
    let newStart = 0;
    let newEnd = 0;

    while (i < items.length) {
      const rowHeight = getHeightFor(i);
      if (y + rowHeight > scrollTop) {
        newStart = i;
        break;
      }
      y += rowHeight;
      i += 1;
    }

    while (i < items.length) {
      renderSet.add(i);
      y += getHeightFor(i);
      i += 1;
      if (y > scrollTop + viewportHeight) break;
    }

    // Include one extra item at the bottom to make a smoother visual update (should be i - 1)
    newEnd = Math.min(i, items.length - 1);

    const newRender = Array.from(renderSet).sort((a, b) => a - b);

    if (!isEqual(newRender, toRender)) {
      start = newStart;
      end = newEnd;
      toRender = newRender;
      return true;
    }

    return hasChanged;
  }


  function renderToDom() {
    const nodes: VNode[] = [];

    // Always render the first line, the last line, and the lines with the start/end selection so that deletion and
    // selection commands will work (e.g. selecting from one line to another no in-screen and let Select All work).
    const renderSet = new Set(toRender);
    let spacerKey: string = '';
    let spacerMarginTop = 0;
    let spacerMarginBottom = 0;
    let total = 0;

    for (let i = 0, space = 0; i < items.length; i++) {
      if (renderSet.has(i)) {
        if (space) {
          spacerMarginBottom = getMarginBetween(i, -1);
          space -= spacerMarginTop;
          const spacer = h('div', { class: '-spacer-', ['data-key']: spacerKey, style: `height:${space}px;margin-top:${spacerMarginTop}px;margin-bottom:${spacerMarginBottom}px;`, key: spacerKey  });
          spacerKey = '';
          nodes.push(spacer);
        }
        space = 0;
        const node = renderLine(editor, items[i]);
        nodes.push(node);
      } else {
        if (i === 1) spacerKey = 'spacer-start';
        else if (i === items.length - 2) spacerKey = 'spacer-end';
        else if (!spacerKey && lineSelection && i > lineSelection[1]) spacerKey = 'spacer-selection-end';
        else if (!spacerKey && lineSelection && i > lineSelection[0]) spacerKey = 'spacer-selection-start';
        if (!space) spacerMarginTop = getMarginBetween(i, -1);
        space += getHeightFor(i);
      }

      total += getHeightFor(i);
    }

    editor.dispatchEvent(new Event('rendering'));
    patch(editor.root, nodes);
    setLineNodesRanges(editor);
    editor.dispatchEvent(new Event('render'));
    editor.dispatchEvent(new Event('rendered'));
  }


  function updateHeights() {
    children = Array.from(editor.root.children).filter(child => child.className !== '-spacer-') as HTMLLineElement[];
    for (let i = 0; i < children.length; i++) {
      const index = toRender[i];
      heightMap[index] = getHeightInfo(children[i]);
    }
    if (!children.length) return;
    const heights = heightMap.filter(Boolean);
    averageHeight = Math.round(
      getMarginBetween(0, -1, heights) +
      heights.reduce((a, b, i, arr) => a + getHeightFor(i, arr), 0) / heights.length
    );
  }


  function getOffsetTop() {
    const { scrollTop } = viewport;
    const { root } = editor;
    if (viewport === root) return parseInt(getComputedStyle(root).paddingTop);
    return root.getBoundingClientRect().top
      + parseInt(getComputedStyle(root).paddingTop)
      + scrollTop
      - viewport.getBoundingClientRect().top;
  }


  function getHeightInfo(node: HTMLLineElement): HeightInfo {
    const styles = getComputedStyle(node);
    return [ parseInt(styles.marginTop), node.offsetHeight, parseInt(styles.marginBottom) ];
  }


  function getHeightFor(i: number, array = heightMap) {
    if (!array[i]) return averageHeight;
    return (i === 0 ? getMarginBetween(i, -1, array) : 0) + array[i][1] + getMarginBetween(i, 1, array);
  }

  function getMarginBetween(i: number, direction: -1 | 1, array = heightMap) {
    return Math.max(array[i] && array[i][2] || 0, array[i + direction] && array[i + direction][0] || 0)
  }


  function withinRender(range: EditorRange | null, inclusive?: boolean) {
    if (!range) return false;
    let [ from, to ] = range;
    if (inclusive) to++;
    return toRender.some(i => i >= from && i < to);
  }


  function onScroll() {
    if (updateQueued) return;
    requestAnimationFrame(update);
    updateQueued = true;
  }


  function onChange(event: EditorChangeEvent) {
    const { old, doc } = editor.modules.decorations as { old: TextDocument, doc: TextDocument } || event;
    const selection = event.doc.selection;
    render({ old, doc, selection });
  }


  return {
    render,
    init() {
      if (editor.modules.decorations) {
        editor.modules.decorations.gatherDecorations();
      }
      render();
    },
    destroy() {
      offResize();
      viewport.removeEventListener('scroll', onScroll);
      editor.off('change', onChange);
    }
  }
}


const scrollable = /auto|scroll/;

function getScrollParent(node: HTMLElement) {
  while (node && node !== node.ownerDocument.scrollingElement) {
    if (scrollable.test(getComputedStyle(node).overflowY)) return node;
    node = node.parentNode as HTMLElement;
  }
  return node;
}

const WIDTH = 1;
const HEIGHT = 2;
const BOTH = 3;

function onResize(node: HTMLElement, callback: (width: number, height: number, changed: number) => void): () => void {
  let width = node.offsetWidth;
  let height = node.offsetHeight;
  callback(width, height, BOTH);

  if (typeof (window as any).ResizeObserver !== 'undefined') {
    const observer = new (window as any).ResizeObserver(onResize);
    observer.observe(node);
    return () => observer.disconnect();
  } else {
    const window = node.ownerDocument.defaultView as Window;
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }

  function onResize() {
    const { offsetWidth, offsetHeight } = node;
    const changed = (width !== offsetWidth ? WIDTH : 0) | (height !== offsetHeight ? HEIGHT : 0);
    if (changed) {
      width = offsetWidth;
      height = offsetHeight;
      callback(width, height, changed);
    }
  }
}

function selectedLineIndexes([ from, to ]: EditorRange, lines: Combined): EditorRange {
  let first: number = 0, last: number = 0;
  for (let i = 0, pos = 0; i < lines.length; i++) {
    const entry = lines[i];
    const length = Array.isArray(entry) ? entry.reduce((length, line) => length + line.length, 0) : entry.length;
    if (from >= pos && from < pos + length) first = i;
    if (to >= pos && to < pos + length) {
      last = i;
      break;
    }
    pos += length;
  }
  return [ first, last ];
}
