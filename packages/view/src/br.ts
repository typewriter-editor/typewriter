import { Paper } from "./paper";

// Determines if a <br> in the editable area is part of the document or a doorstop at the end of a block.
export function isBRPlaceholder(paper: Paper, node: Node) {
  if (node.nodeName !== 'BR') return false;
  const { blocks } = paper;
  let next = node.nextSibling;
  while (next && next.nodeValue === '') next = next.nextSibling;
  if (next) {
    return next.nodeType === Node.ELEMENT_NODE && blocks.matches(next as Element);
  }
  return blocks.matches(node.parentNode as Element);
}
