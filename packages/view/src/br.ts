import { Paper } from "./paper";

// Determines if a <br> in the editable area is part of the document or a doorstop at the end of a block.
export function isBRPlaceholder(paper: Paper, node: Node) {
  if (node.nodeName !== 'BR') return false;
  return isLastNode(paper, node);
}

// Check if this is the last node (not counting empty text nodes)
function isLastNode(paper: Paper, node: Node) {
  let next = node.nextSibling;
  while (next && next.nodeValue === '') next = next.nextSibling;
  if (next) return false;
  return !node.parentNode || paper.blocks.matches(node.parentNode as Element) ? true : isLastNode(paper, node.parentNode);
}
