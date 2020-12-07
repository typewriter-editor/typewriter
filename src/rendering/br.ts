import Editor from '../Editor';
import { createTreeWalker } from './walker';

const SHOW = NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT;
const FILTER: NodeFilter = {
  acceptNode(node) {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue === '') {
      return NodeFilter.FILTER_REJECT;
    } else {
      return NodeFilter.FILTER_ACCEPT;
    }
  }
};


// Determines if a <br> in the editable area is part of the document or a doorstop at the end of a line.
export function isBRPlaceholder(editor: Editor, node: Node) {
  if (node.nodeName !== 'BR') return false;
  return isLastNode(editor, node);
}

// Check if this is the last node (not counting empty text nodes)
function isLastNode(editor: Editor, node: Node) {
  const containingLine = (node as Element).closest && (node as Element).closest(editor.typeset.lines.selector);
  if (!containingLine) return false;
  const walker = createTreeWalker(containingLine);
  walker.currentNode = node;
  return !walker.nextNode();
}
