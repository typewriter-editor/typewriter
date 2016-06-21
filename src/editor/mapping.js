var slice = Array.prototype.slice;
var Schema = require('./schema/schema');
var mapping = exports;


mapping.blocksFromDOM = function(schema, element, startIndex, endIndex) {
  if (!(schema instanceof Schema)) throw new TypeError('Must include schema for mapping');
  if (!(element instanceof HTMLElement)) throw new TypeError('Must include element for mapping');

  var blocks = slice.call(element.children, startIndex, endIndex).map(function(blockElement) {
    return mapping.blockFromDOM(schema, blockElement);
  }).filter(Boolean);

  if (!blocks.length) {
    blocks = schema.getInitial();
  }

  return blocks;
};


mapping.blocksToDOM = function(schema, blocks) {
  if (!(schema instanceof Schema)) throw new TypeError('Must include schema for mapping');
  if (!Array.isArray(blocks)) throw new TypeError('Must include blocks array for mapping');
  var fragment = document.createDocumentFragment();
  blocks.forEach(function(block) {
    fragment.appendChild(mapping.blockToDOM(schema, block));
  });
  return fragment;
};


mapping.blockFromDOM = function(schema, element) {
  if (!(schema instanceof Schema)) throw new TypeError('Must include schema for mapping');
  if (!(element instanceof HTMLElement)) throw new TypeError('Must include element for mapping');
  var block = schema.blockFromDOM(element);
  if (block) {
    var result = mapping.textFromDOM(schema, element);
    block.text = result.text;
    block.markups = result.markups;
    return block;
  }
};


mapping.blockToDOM = function(schema, block) {
  if (!(schema instanceof Schema)) throw new TypeError('Must include schema for mapping');
  if (!block.markups) throw new TypeError('Must include block for mapping');
  var element = block.toDOM();
  var fragment = mapping.textToDOM(schema, block);
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
  }

  return element;
};


mapping.textFromDOM = function(schema, element) {
  if (!(schema instanceof Schema)) throw new TypeError('Must include schema for mapping');
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
      result.text += node.data;
    } else if (name === 'br') {
      result.text += '\n';
    } else if (node.textContent.trim() !== '') {
      markup = schema.markupFromDOM(node);
      if (markup) {
        markup.startIndex = result.text.length;
        markupMap.set(node, markup);
        result.markups.push(markup);
      }
    }

    if (name === '#text' || name === 'br') {
      while (node !== element && node.parentNode.lastChild === node) {
        if (markupMap.has(node.parentNode)) {
          markup = markupMap.get(node.parentNode);
          if (markup) {
            markup.endIndex = result.text.length;
          }
        }
        node = node.parentNode;
      }
    }
  }

  schema.normalizeMarkups(result);

  return result;
}


mapping.textToDOM = function(schema, block) {
  if (!(schema instanceof Schema)) throw new TypeError('Must include schema for mapping');
  if (!block.markups) throw new TypeError('Must include block for mapping');
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
    var remainingLength = markup.endIndex - markup.startIndex;
    walker.currentNode = fragment;
    var textNode = walker.nextNode();

    // Find the first textNode this markup starts in
    var currentIndex = 0;
    while (textNode) {
      if (currentIndex + textNode.data.length > markup.startIndex) {
        if (markup.startIndex !== currentIndex) {
          breakTextNode(textNode, markup.startIndex - currentIndex);
          textNode = walker.nextNode();
        }
        break;
      }
      currentIndex += textNode.data.length;
      textNode = walker.nextNode();
    }

    // Add the elements to each text node necessary
    while (remainingLength > 0) {
      if (textNode.data.length > remainingLength) {
        breakTextNode(textNode, remainingLength);
      }

      var element = markup.toDOM();
      textNode.parentNode.replaceChild(element, textNode);
      element.appendChild(textNode);
      remainingLength -= textNode.data.length;
      textNode = walker.nextNode();
    }
  });

  // Insert the BRs
  walker.currentNode = fragment;
  var textNode = walker.nextNode();
  while ((textNode = walker.nextNode())) {
    var index = textNode.data.indexOf('\n');
    if (index !== -1) {
      breakTextNode(textNode, index + 1);
      textNode.parentNode.insertBefore(document.createElement('br'), textNode.nextSibling);
      textNode.data = textNode.data.slice(0, index);
    }
    textNode.data = textNode.data.replace(/  /g, ' &nbsp;')
  }

  return fragment;
}

function breakTextNode(node, index) {
  node.parentNode.insertBefore(document.createTextNode(node.data.slice(index)), node.nextSibling);
  node.data = node.data.slice(0, index);
}
