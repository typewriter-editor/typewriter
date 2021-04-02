import Editor from '../Editor';
import { createTreeWalker } from './walker';
import { BLOCK_ELEMENTS } from './html';


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
  const next = walker.nextNode();
  return !next || next instanceof HTMLElement && next.matches(BLOCK_ELEMENTS);
}
