const indexOf = [].indexOf;

// Get the range (a tuple of indexes) for this view from the browser selection
export function getSelection(view) {
  const root = view.root;
  const selection = root.ownerDocument.defaultView.getSelection();

  if (!root.contains(selection.anchorNode)) {
    return null;
  } else {
    const anchorIndex = getNodeIndex(view, selection.anchorNode);
    const focusIndex = selection.anchorNode === selection.focusNode ?
          anchorIndex : getNodeIndex(view, selection.focusNode);

    return [
      anchorIndex + selection.anchorOffset,
      focusIndex + selection.focusOffset,
    ];
  }
}

// Set the browser selection to the range (a tuple of indexes) of this view
export function setSelection(view, range) {
  const root = view.root;
  const selection = root.ownerDocument.defaultView.getSelection();
  const hasFocus = root.contains(root.ownerDocument.activeElement);

  if (range == null) {
    if (hasFocus) {
      root.blur();
      selection.setBaseAndExtent(null, 0, null, 0);
    }
  } else {
    const [ anchorNode, anchorOffset, focusNode, focusOffset ] = getNodesForRange(view, range);
    selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    if (!hasFocus) root.focus();
  }
}

// Get a browser range object for the given editor range tuple
export function getBrowserRange(view, range) {
  if (range[0] > range[1]) range = [ range[1], range[0] ];
  const [ anchorNode, anchorOffset, focusNode, focusOffset ] = getNodesForRange(view, range);
  const browserRange = document.createRange();
  browserRange.setStart(anchorNode, anchorOffset);
  browserRange.setEnd(focusNode, focusOffset);
  return browserRange;
}


// Get the browser nodes and offsets for the range (a tuple of indexes) of this view
export function getNodesForRange(view, range) {
  if (range == null) {
    return [ null, 0, null, 0 ];
  } else {
    const [ anchorNode, anchorOffset ] = getNodeAndOffset(view, range[0]);
    const [ focusNode, focusOffset ] = range[0] === range[1] ?
          [ anchorNode, anchorOffset ] : getNodeAndOffset(view, range[1]);

    return [ anchorNode, anchorOffset, focusNode, focusOffset ];
  }
}

export function getNodeAndOffset(view, index) {
  const root = view.root;
  const { blocks, embeds } = view.paper;
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) &&
        NodeFilter.FILTER_ACCEPT ||
        NodeFilter.FILTER_REJECT;
    }
  });

  let count = 0, node, firstBlockSeen = false;
  walker.currentNode = root;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const size = node.nodeValue.length
      if (index <= count + size) return [ node, index - count ];
      count += size;
    } else if (embeds.matches(node)) {
      count += 1;
    } else if (blocks.matches(node)) {
      if (firstBlockSeen) count += 1;
      else firstBlockSeen = true;

      // If the selection lands at the beginning of a block, and the first node isn't a text node, place the selection
      if (count === index && (!node.firstChild || node.firstChild.nodeType !== Node.TEXT_NODE)) {
        return [ node, 0 ];
      }
    } else if (node.nodeName === 'BR' && node.parentNode.lastChild !== node) {
      count += 1;
      // If the selection lands after this br, and the next node isn't a text node, place the selection
      if (count === index && (!node.nextSibling || node.nextSibling.nodeType !== Node.TEXT_NODE)) {
        return [ node.parentNode, indexOf.call(node.parentNode.childNodes, node) + 1 ];
      }
    }
  }
  return [ null, 0 ];
}

// Get the index the node starts at in the content
export function getNodeIndex(view, node) {
  const root = view.root;
  const { blocks, embeds } = view.paper;
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) &&
        NodeFilter.FILTER_ACCEPT ||
        NodeFilter.FILTER_REJECT;
    }
  });

  walker.currentNode = node;
  let index = node.nodeType === Node.ELEMENT_NODE ? 0 : -1;
  while ((node = walker.previousNode())) {
    if (node.nodeType === Node.TEXT_NODE) index += node.nodeValue.length;
    else if (node.nodeName === 'BR' && node.parentNode.lastChild !== node) index++;
    else if (embeds.matches(node)) index++;
    else if (node !== root && blocks.matches(node)) index++;
  }
  return index;
}

