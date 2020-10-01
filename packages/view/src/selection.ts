import { isBRPlaceholder } from './br';
import { Paper } from './paper';

type Selection = [number, number];


// Get the range (a tuple of indexes) for this view from the browser selection
export function getSelection(root: HTMLElement, paper: Paper, range?: Range): Selection | null {
  if (!root.ownerDocument) return null;
  const selection = !range ? root.ownerDocument.getSelection() : {
    anchorNode: range.startContainer, anchorOffset: range.startOffset,
    focusNode: range.endContainer, focusOffset: range.endOffset,
    isCollapsed: range.collapsed,
  };

  if (selection == null || selection.anchorNode == null || selection.focusNode == null || !root.contains(selection.anchorNode)) {
    return null;
  } else {
    const anchorIndex = getNodeAndOffsetIndex(root, paper, selection.anchorNode, selection.anchorOffset);
    const isCollapsed = selection.anchorNode === selection.focusNode && selection.anchorOffset === selection.focusOffset;
    // selection.isCollapsed causes a layout on Chrome. ?? Manual detection does not.
    let focusIndex = isCollapsed ?
      anchorIndex :
      getNodeAndOffsetIndex(root, paper, selection.focusNode, selection.focusOffset);

    return [ anchorIndex, focusIndex ];
  }
}

// Set the browser selection to the range (a tuple of indexes) of this view
export function setSelection(root: HTMLElement, paper: Paper, range: Selection) {
  if (!root.ownerDocument) return;
  const selection = root.ownerDocument.getSelection();
  if (!selection) return;
  const hasFocus = selection.anchorNode && root.contains(selection.anchorNode);

  if (range == null) {
    if (hasFocus) {
      root.blur();
      selection.removeAllRanges();
    }
  } else {
    const [ anchorNode, anchorOffset, focusNode, focusOffset ] = getNodesForRange(root, paper, range);
    const type = range[0] === range[1] ? 'Caret' : 'Range';
    if (anchorNode && focusNode) {
      if (selection.anchorNode !== anchorNode || selection.anchorOffset !== anchorOffset ||
          selection.focusNode !== focusNode || selection.focusOffset !== focusOffset || selection.type !== type)
      {
        selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
      }
    }
    if (!hasFocus) root.focus();
  }
}



/**
 * Get the position and size of a range as it is displayed in the DOM relative to the top left of visible document.
 * You can use `getBounds(editor.selection)` to find the coordinates of the current selection and display a popup at
 * that location.
 */
export function getBounds(root: HTMLElement, paper: Paper, range: Selection) {
  return getBoudingBrowserRange(root, paper, range).getBoundingClientRect();
}

/**
 * Get all positions and sizes of a range as it is displayed in the DOM relative to the top left of visible document.
 * This is different from `getBounds` because instead of a single bounding box you may get multiple rects such as when
 * the selection is split across lines. You can use `getAllBounds` to draw a highlight behind the text within this
 * range.
 *
 * @param {Number} from The start of the range
 * @param {Number} to   The end of the range
 * @returns {DOMRectList}   A native DOMRect object with the bounds of the range
 */
export function getAllBounds(root: HTMLElement, paper: Paper, range: Selection) {
  return getBoudingBrowserRange(root, paper, range).getClientRects();
}


export function getBoudingBrowserRange(root: HTMLElement, paper: Paper, range: Selection): Range {
  const browserRange = getBrowserRange(root, paper, range);
  if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
    try {
      browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
    } catch(e) {}
  }
  return browserRange;
}

// Get a browser range object for the given editor range tuple
export function getBrowserRange(root: HTMLElement, paper: Paper, range: Selection) {
  if (range[0] > range[1]) range = [ range[1], range[0] ];
  const [ anchorNode, anchorOffset, focusNode, focusOffset ] = getNodesForRange(root, paper, range);
  const browserRange = document.createRange();
  if (anchorNode && focusNode) {
    browserRange.setStart(anchorNode, anchorOffset);
    browserRange.setEnd(focusNode, focusOffset);
  }
  return browserRange;
}


// Get the browser nodes and offsets for the range (a tuple of indexes) of this view
export function getNodesForRange(root: HTMLElement, paper: Paper, range: Selection): [Node | null, number, Node | null, number] {
  if (range == null) {
    return [ null, 0, null, 0 ];
  } else {
    const [ anchorNode, anchorOffset ] = getNodeAndOffset(root, paper, range[0]);
    const [ focusNode, focusOffset ] = range[0] === range[1] ?
          [ anchorNode, anchorOffset ] : getNodeAndOffset(root, paper, range[1]);

    return [ anchorNode, anchorOffset, focusNode, focusOffset ];
  }
}

export function getNodeAndOffset(root: HTMLElement, paper: Paper, index: number): [Node | null, number] {
  if (!root.ownerDocument) return [ null, 0 ];
  const inDom = root.ownerDocument.contains(root);
  const { blocks, embeds } = paper;
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: inDom ? acceptNodeInDom : acceptNode
  });

  let count = 0, node: Node | null, firstBlockSeen = false;
  walker.currentNode = root;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const size = node.nodeValue ? node.nodeValue.length : 0;
      if (index <= count + size) return [ node, index - count ];
      count += size;
    } else if (embeds.matches(node) && !isBRPlaceholder(paper, node)) {
      const embed = embeds.findByNode(node);
      if (!embed || embed.fromDom === false) {
        continue;
      }
      count += 1;
      // If the selection lands after this embed, and the next node isn't a text node, place the selection
      const next = nextNonEmptyTextSibling(node);
      if (count === index && (!next || next.nodeType !== Node.TEXT_NODE)) {
        const children = node.parentNode ? Array.from(node.parentNode.childNodes) : [];
        return [ node.parentNode, children.indexOf(node as ChildNode) + 1 ];
      }
    } else if (blocks.matches(node)) {
      if (firstBlockSeen) count += 1;
      else firstBlockSeen = true;

      // If the selection lands at the beginning of a block, and the first node isn't a text node, place the selection
      if (count === index) {
        const first = firstNonEmptyTextChild(node);
        if (!first) return [ node, 0 ];
        else if (first.nodeType !== Node.TEXT_NODE) {
          const children = Array.from(node.childNodes);
          return [ node, children.indexOf(first as ChildNode) ];
        }
      }
    }
  }
  return [ null, 0 ];
}

export function getNodeAndOffsetIndex(root: Element, paper: Paper, node: Node, offset: number): number {
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (offset) {
      node = node.childNodes[offset - 1];
      while (node.lastChild) node = node.lastChild;
      if (node.nodeType === Node.ELEMENT_NODE) {
        offset = paper.embeds.matches(node) ? 1 : 0;
      } else {
        offset = node.nodeValue ? node.nodeValue.length : 0;
      }
    } else {
      offset = 1;
    }
  }
  return getNodeIndex(root, paper, node) + offset;
}

// Get the index the node starts at in the content
export function getNodeIndex(root: Element, paper: Paper, startNode: Node): number {
  if (!root.ownerDocument) return -1;
  const inDom = root.ownerDocument.contains(root);
  const { blocks, embeds } = paper;
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: inDom ? acceptNodeInDom : acceptNode
  });

  walker.currentNode = startNode;
  let node: Node | null;
  let index = -1;
  while ((node = walker.previousNode())) {
    if (node === root) continue;
    else if (node.nodeType === Node.TEXT_NODE) index += node.nodeValue ? node.nodeValue.length : 0;
    else if ((node as HTMLElement).className.indexOf('decorator') !== -1) index;
    else if (embeds.matches(node) && !isBRPlaceholder(paper, node)) index++;
    else if (blocks.matches(node)) index++;
  }
  return index;
}

function acceptNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue && node.nodeValue.length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  }
  return NodeFilter.FILTER_REJECT;
}

function acceptNodeInDom(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue && node.nodeValue.length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  }
  return NodeFilter.FILTER_ACCEPT;
}

function firstNonEmptyTextChild(parent: Node): Node | null {
  let node: Node | null = parent.firstChild as Node, index = 0;
  if (!node) return null;

  while (node && node.nodeValue === '') {
    node = node.nextSibling;
    index++;
  }
  return node;
}

function nextNonEmptyTextSibling(node: Node): Node | null {
  let nextSibling: Node | null = node.nextSibling;
  while (nextSibling && nextSibling.nodeValue === '') {
    nextSibling = nextSibling.nextSibling;
  }
  return nextSibling;
}
