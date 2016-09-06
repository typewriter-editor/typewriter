var slice = Array.prototype.slice;
var forEach = Array.prototype.forEach;
var selectors = require('./selectors');
var Editor = require('./editor');
var Block = require('./blocks/block');
var mapping = exports;

/**
 * Generate (and insert/replace) an element for the given block
 * @param {Editor} editor The editor
 * @param {Block} block The block to generate the element from
 */
mapping.generateElement = function(editor, block) {
  if (!(editor instanceof Editor)) throw new TypeError('Must include editor for mapping');
  if (!(block instanceof Block)) throw new TypeError('Must include block for mapping');
  var index = editor.blocks.indexOf(block);
  if (index === -1) throw new TypeError('Must be a block in the editor');
  var blockElements = editor.blockElements;
  var isDeep = selectors.isDeep(block.selector);
  var prev = editor.blocks[index - 1];
  var next = editor.blocks[index + 1];
  var prevElement = blockElements[index - 1];
  var nextElement = blockElements[index];
  var element = mapping.blockToDOM(editor, block);

  // If there is an existing element we can update it or remove it to be replaced
  if (nextElement && nextElement.getAttribute('name') === block.id) {
    // Update the element in-place and don't worry about the rest
    if (nextElement.nodeName === element.nodeName) {
      cloneElementTo(nextElement, element);
      return;
    }

    // Remove the element for replacing
    removeElement(editor, block, nextElement);
    nextElement = blockElements[index + 1];
    blockElements.splice(index, 1, element);
  } else {
    blockElements.splice(index, 0, element);
  }

  // Add the new element to the DOM
  if (isDeep && prev && prev.selector === block.selector && prevElement) {
    prevElement.parentNode.insertBefore(element, prevElement.nextSibling);

    // If next is also the same but with a different parent, we need to join it to this list
    if (next && next.selector === block.selector && nextElement) {
      var prevSibling = outerElement(editor, prevElement);
      var nextSibling = outerElement(editor, nextElement);

      if (prevSibling !== nextSibling) {
        var i = index, sibling;
        while ((sibling = editor.blocks[++i]) && sibling.selector === block.selector && blockElements[i]) {
          prevElement.parentNode.appendChild(blockElements[i]);
        }
        nextSibling.parentNode.removeChild(nextSibling);
      }
    }
  } else if (isDeep && next && next.selector === block.selector && nextElement) {
    nextElement.parentNode.insertBefore(element, nextElement);
  } else {
    // If this is a list, be sure to get the outermost element (the ul/ol)
    element = selectors.createElementDeep(block.selector, element);
    var prevSibling = outerElement(editor, prevElement);
    var nextSibling = outerElement(editor, nextElement);

    // If we need to split a list into two to insert our element
    if (prev && next && prev.selector === next.selector && selectors.isDeep(prev.selector)
             && prevElement && nextElement) {
      nextSibling = selectors.createElementDeep(next.selector, nextElement);
      var i = index + 1, sibling;
      while ((sibling = editor.blocks[++i]) && sibling.selector === prev.selector && blockElements[i]) {
        nextElement.parentNode.appendChild(blockElements[i]);
      }
      prevSibling.parentNode.insertBefore(nextSibling, prevSibling.nextSibling);
    }

    if (prevSibling) {
      editor.element.insertBefore(element, prevSibling.nextSibling);
    } else {
      editor.element.insertBefore(element, nextSibling);
    }
  }
};

/**
 * Generate (and insert/replace) all elements in the editor
 * @param {Editor} editor The editor
 * @param {Block} block The block to generate the element from
 */
mapping.generateElements = function(editor) {
  editor.element.innerHTML = '';
  editor.blocks.forEach(mapping.generateElement.bind(null, editor));
};



mapping.removeElement = function(editor, block) {
  var element = editor.blockElements.find(function(elem) {
    return elem.getAttribute('name') === block.id;
  });
  removeElement(editor, block, element);
};



mapping.blocksFromDOM = function(editor, container, options) {
  if (!(editor instanceof Editor)) throw new TypeError('Must include editor for mapping');
  if (!container) container = editor.element;
  var blockElements = slice.call(container.querySelectorAll(editor.schema.blocksSelector));
  var blocks = blockElements.map(function(blockElement) {
    return mapping.blockFromDOM(editor, blockElement, container);
  }).filter(Boolean);

  if (!blocks.length && (!options || !options.noDefault)) {
    blocks = editor.schema.getInitial();
    if (blocks.length) {
      blocks[0]
    }
  }

  return blocks;
};


mapping.blockFromDOM = function(editor, element, container) {
  if (!(editor instanceof Editor)) throw new TypeError('Must include editor for mapping');
  if (!(element instanceof HTMLElement)) throw new TypeError('Must include element for mapping');
  if (!container) container = editor.element;
  var Type = editor.schema.getBlockType(element);
  var block = Type && new Type(selectors.fromElement(element, container));
  if (block) {
    return mapping.updateBlock(editor, block, element);
  }
};


mapping.updateBlock = function(editor, block, element) {
  var result = mapping.textFromDOM(editor, element);
  block.text = result.text;
  block.markups = result.markups;
  return block;
};


mapping.blockToDOM = function(editor, block) {
  if (!(editor instanceof Editor)) throw new TypeError('Must include editor for mapping');
  if (!block.markups) throw new TypeError('Must include block for mapping');
  var element = block.createElement();
  var fragment = mapping.textToDOM(editor, block);
  var contentElement = element;

  if (contentElement.contentEditable === 'false') {
    // If this block is e.g. a figure look for the editable section inside
    contentElement = element.querySelector('[contenteditable="true"]');
  }

  if (contentElement) {
    contentElement.appendChild(fragment);

    if (!block.text) {
      contentElement.classList.add('empty');
    }
    if (editor.blocks[0] === block && editor.element.getAttribute('placeholder')) {
      contentElement.setAttribute('placeholder', editor.element.getAttribute('placeholder'));
    }
  }

  return element;
};


mapping.textFromDOM = function(editor, element) {
  if (!(editor instanceof Editor)) throw new TypeError('Must include editor for mapping');
  if (!(element instanceof HTMLElement)) throw new TypeError('Must include element for mapping');
  var result = { text: '', markups: [] };

  if (element.contentEditable === 'false') {
    // If this block is e.g. a figure look for the editable section inside
    element = element.querySelector('[contenteditable="true"]');
    if (!element) {
      return result;
    }
  }

  if (element.innerHTML === '<br>') {
    return result;
  }

  var walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  var markupMap = new Map();

  while ((node = walker.nextNode())) {
    var name = node.nodeName.toLowerCase();
    var lastNode = node;
    var markup;

    if (name === '#text') {
      result.text += node.nodeValue;
    } else if (name === 'br') {
      result.text += '\n';
    } else if (node.textContent.trim() !== '') {
      var Type = editor.schema.getMarkupType(node);
      var markup = Type && new Type(selectors.fromElement(node));
      if (markup) {
        markup.startOffset = result.text.length;
        markupMap.set(node, markup);
        result.markups.push(markup);
      }
    }

    if (name === '#text' || name === 'br') {
      while (node !== element && node.parentNode.lastChild === node) {
        if (markupMap.has(node.parentNode)) {
          markup = markupMap.get(node.parentNode);
          if (markup) {
            markup.endOffset = result.text.length;
          }
        }
        node = node.parentNode;
      }
    }
  }

  // If the block.text ends in <br> there will be 1 extra \n, we can always take off the last \n
  result.text = result.text.replace(/\n$/, '');

  editor.schema.normalizeMarkups(result);

  return result;
}


mapping.textToDOM = function(editor, block) {
  if (!(editor instanceof Editor)) throw new TypeError('Must include editor for mapping');
  if (!(block instanceof Block)) throw new TypeError('Must include block for mapping');
  var fragment = document.createDocumentFragment();
  var text = block.text;
  var markups = block.markups;
  var elements = [];

  if (!text) {
    fragment.appendChild(document.createElement('br'));
    return fragment;
  }

  // TODO update to follow algorithm, respecting schema correctly
  fragment.appendChild(document.createTextNode(text));
  var walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);

  markups.forEach(function(markup) {
    // Start at the beginning and find the text node this markup starts before
    var remainingLength = markup.endOffset - markup.startOffset;
    walker.currentNode = fragment;
    var textNode = walker.nextNode();

    // Find the first textNode this markup starts in
    var currentIndex = 0;
    while (textNode) {
      if (currentIndex + textNode.nodeValue.length > markup.startOffset) {
        if (markup.startOffset !== currentIndex) {
          breakTextNode(textNode, markup.startOffset - currentIndex);
          textNode = walker.nextNode();
        }
        break;
      }
      currentIndex += textNode.nodeValue.length;
      textNode = walker.nextNode();
    }

    // Add the elements to each text node necessary
    while (remainingLength > 0) {
      if (textNode.nodeValue.length > remainingLength) {
        breakTextNode(textNode, remainingLength);
      }

      var element = markup.createElement();
      textNode.parentNode.replaceChild(element, textNode);
      element.appendChild(textNode);
      remainingLength -= textNode.nodeValue.length;
      textNode = walker.nextNode();
    }
  });

  // Insert the BRs
  walker.currentNode = fragment;
  var textNode;
  while ((textNode = walker.nextNode())) {
    var index = textNode.nodeValue.indexOf('\n');
    if (index !== -1) {
      breakTextNode(textNode, index + 1);
      textNode.parentNode.insertBefore(document.createElement('br'), textNode.nextSibling);
      textNode.nodeValue = textNode.nodeValue.slice(0, index);
      if (textNode.nodeValue.length === 0) {
        walker.previousNode();
        textNode.remove();
      }
    }
    // You can't tell, but that second space is a non-breaking space (&nbsp;)
    textNode.nodeValue = textNode.nodeValue.replace(/  /g, '  ');
  }

  if (fragment.lastChild.nodeType === Node.TEXT_NODE && fragment.lastChild.nodeValue.length === 0) {
    fragment.lastChild.remove();
  }

  if (text.slice(-1) === '\n') {
    var parent = fragment;
    while (parent.lastChild.nodeType !== Node.TEXT_NODE && parent.lastChild.nodeName !== 'BR') {
      parent = parent.lastChild;
    }
    parent.appendChild(document.createElement('br'));
  }

  return fragment;
}

function breakTextNode(node, index) {
  node.parentNode.insertBefore(document.createTextNode(node.nodeValue.slice(index)), node.nextSibling);
  node.nodeValue = node.nodeValue.slice(0, index);
}

function outerElement(editor, element) {
  while (element && element.parentNode !== editor.element) {
    element = element.parentNode;
  }
  return element;
}

function removeElement(editor, block, element) {
  if (element) {
    if (selectors.isDeep(block.selector) && !element.previousSibling && !element.nextSibling) {
      var element = outerElement(editor, element);
    }
    element.parentNode.removeChild(element);
  }
}

function cloneElementTo(target, source) {
  // remove attributes that are not on the source
  forEach.call(target.attributes, function(attr) {
    if (!source.attributes[attr.name]) {
      target.removeAttribute(attr.name);
    }
  });

  // set the attributes that are on the source
  forEach.call(source.attributes, function(attr) {
    if (target.getAttribute(attr.name) !== attr.value) {
      target.setAttribute(attr.name, attr.value);
    }
  });

  if (target.innerHTML !== source.innerHTML) {
    target.innerHTML = source.innerHTML;
  }
}
