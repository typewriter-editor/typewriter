import Delta from 'quill-delta';
import { deepEqual } from 'fast-equals';
import escape from 'escape-html';
import { h } from 'ultradom';

const br = <br/>;
const voidElements = {
  area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true,
  link: true, meta: true, param: true, source: true, track: true, wbr: true
};

export class DOM {
  constructor(types) {
    this.blocks = new DOMTypes();
    this.markups = new DOMTypes();
    if (types && types.blocks) types.blocks.forEach(block => this.blocks.add(block));
    if (types && types.markups) types.markups.forEach(markup => this.markups.add(markup));
  }
}


export class DOMTypes {
  constructor() {
    this.selector = '';
    this.domTypes = {};
    this.array = [];
    this.priorities = {};
  }

  add(definition, index) {
    if (!definition.name || !definition.selector || !definition.vdom) {
      throw new Error('DOMType definitions must include a name, selector, and vdom function');
    }
    if (this.domTypes[definition.name]) this.remove(definition.name);
    this.selector += (this.selector ? ', ' : '') + definition.selector;
    this.domTypes[definition.name] = definition;
    if (typeof index !== 'number') {
      this.priorities[name] = this.array.length;
      this.array.push(definition);
    } else {
      this.array.splice(i, 0, definition);
      this.array.forEach(({ name }, i) => this.priorities[name] = i);
    }
  }

  remove(name) {
    if (!this.domTypes[name]) return;
    delete this.domTypes[name];
    this.array = this.array.filter(domType => domType.name === name);
    this.array.forEach(({ name }, i) => this.priorities[name] = i);
    this.selector = this.array.map(type => type.selector).join(', ');
  }

  get(name) {
    return this.domTypes[name];
  }

  priority(name) {
    return this.priorities[name];
  }

  getDefault() {
    return this.array[0];
  }

  matches(node) {
    return node.matches(this.selector);
  }

  find(nodeOrAttr) {
    if (nodeOrAttr instanceof Node) {
      return this.array.find(domType => nodeOrAttr.matches(domType.selector));
    } else if (nodeOrAttr && typeof nodeOrAttr === 'object') {
      let domType;
      Object.keys(nodeOrAttr).some(name => domType = this.get(name));
      return domType;
    }
  }
}



export function deltaToVdom(view, delta) {
  const { blocks, markups } = view.dom;
  const blockData = [];

  delta.eachLine((line, attr) => {
    let inlineChildren = [];

    // Collect block children
    line.forEach(op => {
      let children = [];
      op.insert.split(/\r/).forEach((child, i) => {
        if (i !== 0) children.push(br);
        child && children.push(child.replace(/  /g, '\xA0 ').replace(/ +$/, '\xA0'));
      });

      if (op.attributes) {
        // Sort them by the order found in markups and be efficient
        Object.keys(op.attributes).sort((a, b) => markups.priority(b) - markups.priority(a)).forEach(name => {
          const markup = markups.get(name);
          if (markup) {
            const node = markup.vdom.call(view.dom, children, op.attributes);
            node.markup = markup;
            children = [ node ];
          }
        });
      }
      inlineChildren = inlineChildren.concat(children);
    });

    // Merge markups to optimize
    inlineChildren = mergeChildren(inlineChildren);
    if (!inlineChildren.length || inlineChildren[inlineChildren.length - 1] === br) {
      inlineChildren.push(br);
    }

    let block = blocks.find(attr);
    if (!block) block = blocks.getDefault();

    blockData.push([ block, inlineChildren, attr ]);
  });

  // If a block has optimize=true on it, vdom will be called with all sibling nodes of the same block
  let blockChildren = [], prevBlock;
  let collect = [];
  blockData.forEach((data, i) => {
    const [ block, children, attr ] = data;
    if (block.optimize) {
      collect.push([ children, attr ]);
      const next = blockData[i + 1];
      if (!next || next[0] !== block) {
        blockChildren = blockChildren.concat(block.vdom.call(view.dom, collect));
        collect = [];
      }
    } else {
      blockChildren.push(block.vdom.call(view.dom, children, attr));
    }
  });

  return blocks.get('container').vdom.call(view.dom, blockChildren, view);
}


export function deltaFromDom(view, root = view.root) {
  const { blocks, markups } = view.dom;

  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) &&
        NodeFilter.FILTER_ACCEPT ||
        NodeFilter.FILTER_REJECT;
    }
  });
  const delta = new Delta();
  let currentBlock, firstBlockSeen = false, node;

  walker.currentNode = root;

  while ((node = walker.nextNode())) {
    const isBr = node.nodeName === 'BR' && node.parentNode.lastChild !== node;

    if (node.nodeType === Node.TEXT_NODE || isBr) {
      const text = isBr ? '\r' : node.nodeValue.replace(/\xA0/g, ' ');
      let parent = node.parentNode, attr = {};

      while (parent && !blocks.matches(parent) && parent !== root) {
        if (markups.matches(parent)) {
          const markup = markups.find(parent);
          attr[markup.name] = markup.attr ? markup.attr(parent) : true;
        }
        parent = parent.parentNode;
      }
      delta.insert(text, attr);
    } else if (blocks.matches(node)) {
      if (firstBlockSeen) delta.insert('\n', currentBlock);
      else firstBlockSeen = true;
      const block = blocks.find(node);
      if (block !== blocks.getDefault()) {
        currentBlock = block.attr ? block.attr(node) : { [block.name]: true };
      } else {
        currentBlock = undefined;
      }
    }
  }
  delta.insert('\n', currentBlock);
  return delta;
}


export function deltaToHTML(view, delta) {
  return childrenToHTML(deltaToVdom(view, delta).children);
}


export function deltaFromHTML(view, html) {
  const template = document.createElement('template');
  template.innerHTML = '<div>' + html + '</div>';
  const container = (template.content || template).firstChild;
  return deltaFromDom(view, container);
}


// Join adjacent blocks
function mergeChildren(oldChildren) {
  const children = [];
  oldChildren.forEach((next, i) => {
    const prev = children[children.length - 1];

    if (prev && typeof prev !== 'string' && typeof next !== 'string' && prev.markup &&
      prev.markup === next.markup && deepEqual(prev.attributes, next.attributes))
    {
      prev.children = prev.children.concat(next.children);
    } else {
      children.push(next);
    }
  });
  return children;
}

function elementToHTML(node) {
  const attr = Object.keys(node.attributes)
    .reduce((attr, name) =>
      `${attr} ${escape(name)}="${escape(node.attributes[name])}"`, '');
  const children = childrenToHTML(node.children);
  const closingTag = children || !voidElements[node.nodeName] ? `</${node.nodeName}>` : '';
  return `<${node.nodeName}${attr}>${children}${closingTag}`;
}

function childrenToHTML(children) {
  if (!children || !children.length) return '';
  return children.reduce((html, child) => html + (child.nodeName ? elementToHTML(child) : escape(child)), '');
}
