import Delta from '../delta';
import { deepEqual } from 'fast-equals';
import escape from 'escape-html';
import { h } from './vdom';
import { isBRNode } from './selection';
const nodeMarkup = new WeakMap();

const br = <br/>;
const voidElements = {
  area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true,
  link: true, meta: true, param: true, source: true, track: true, wbr: true
};


export function deltaToVdom(view, delta) {
  const paper = view.paper;
  const { blocks, markups, embeds, container } = paper;
  const blockData = [];

  delta.eachLine(({ ops, attributes }) => {
    let inlineChildren = [];

    // Collect block children
    ops.forEach(op => {
      if (op.insert) {
        let children = [];
        if (typeof op.insert === 'string') {
          op.insert.split(/\r/).forEach((child, i) => {
            if (i !== 0) children.push(br);
            child && children.push(child.replace(/  /g, '\xA0 ').replace(/^ | $/g, '\xA0'));
          });
        } else {
          const embed = embeds.find(op.insert);
          if (embed) {
            const node = embed.vdom.call(paper, op.insert[embed.name]);
            children.push(node);
          }
        }

        if (op.attributes) {
          // Sort them by the order found in markups and be efficient
          Object.keys(op.attributes).sort((a, b) => markups.priority(b) - markups.priority(a)).forEach(name => {
            const markup = markups.get(name);
            if (markup) {
              const node = markup.vdom.call(paper, children, op.attributes);
              nodeMarkup.set(node, markup); // Store for merging
              children = [ node ];
            }
          });
        }
        inlineChildren.push.apply(inlineChildren, children);
      }
    });

    // Merge markups to optimize
    inlineChildren = mergeChildren(inlineChildren);
    if (!inlineChildren.length || inlineChildren[inlineChildren.length - 1] === br) {
      inlineChildren.push(br);
    }

    let block = blocks.find(attributes);
    if (!block) block = blocks.getDefault();

    blockData.push([ block, inlineChildren, attributes ]);
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
        const children = block.vdom.call(paper, collect);
        blockChildren = blockChildren.concat(children);
        collect = [];
      }
    } else {
      const node = block.vdom.call(paper, children, attr);
      decorateBlock(node, attr);
      blockChildren.push(node);
    }
  });

  return container.call(paper, blockChildren, view);
}


export function decorateBlock(vdom, attr) {
  if (!attr.attributes && !attr.classes) return vdom;
  const { attributes, classes } = attr;
  if (attributes) {
    Object.keys(attributes).forEach(name => {
      vdom.attributes[name] = attributes[name];
    });
  }
  if (classes) {
    const classArray = Object.keys(classes);
    if (classArray.length) {
      if (vdom.attributes.class) classArray.unshift(vdom.attributes.class);
      vdom.attributes.class = classArray.join(' ');
    }
  }
  return vdom;
}

function undecorateBlock(node, block, attr) {
  const ignoreClasses = {};
  const ignoreAttributes = { class: true };
  block.selector.replace(/\.([-\w])/, (_, name) => ignoreClasses[name] = true);
  block.selector.replace(/\[([-\w])[^\]]\]/, (_, name) => ignoreAttributes[name] = true);
  const attributes = {};
  let attrLength = node.attributes.length;

  if (node.classList.length) {
    attrLength--;
    const classes = {};
    let match = false;

    for (let i = 0; i < node.classList.length; i++) {
      const name = node.classList.item(i);
      if (!ignoreClasses[name]) {
        match = true;
        classes[name] = true;
      }
    }
    if (match) attr.classes = classes;
  }

  if (attrLength) {
    const attributes = {};
    let match = false;

    for (let i = 0; i < node.attributes.length; i++) {
      const attribute = node.attributes[i];
      if (!ignoreAttributes[attribute.name]) {
        match = true;
        attributes[attribute.name] = attribute.value || true;
      }
    }
    if (match) attr.attributes = attributes;
  }
  return attr;
}


export function deltaFromDom(view, root = view.root, opts) {
  const paper = view.paper;
  const { blocks, markups, embeds } = paper;

  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      return (node.nodeType === Node.TEXT_NODE || (!opts || opts.notInDom) || node.offsetParent) &&
        NodeFilter.FILTER_ACCEPT ||
        NodeFilter.FILTER_REJECT;
    }
  });
  const delta = new Delta();
  let currentBlock, firstBlockSeen = false, node;

  walker.currentNode = root;

  while ((node = walker.nextNode())) {
    const isBr = isBRNode(view, node);

    if (node.nodeType === Node.TEXT_NODE || isBr) {
      // BRs are represented with \r, non-breaking spaces are space, and newlines should not exist
      const text = isBr ? '\r' : node.nodeValue.replace(/\xA0/g, ' ').replace(/\n/g, '');
      if (!text) continue;
      let parent = node.parentNode, attr = {};

      while (parent && !blocks.matches(parent) && parent !== root) {
        if (markups.matches(parent)) {
          const markup = markups.find(parent);
          attr[markup.name] = markup.dom ? markup.dom.call(paper, parent) : true;
        }
        parent = parent.parentNode;
      }

      // If the text was not inside a block, ignore it (space between block perhaps)
      if (parent !== root) {
        delta.insert(text, attr);
      }
    } else if (embeds.matches(node)) {
      const embed = embeds.find(node);
      if (embed) {
        delta.insert({ [embed.name]: embed.dom.call(paper, node) });
      }
    } else if (blocks.matches(node)) {
      if (firstBlockSeen) delta.insert('\n', currentBlock);
      else firstBlockSeen = true;
      const block = blocks.find(node);
      if (block !== blocks.getDefault()) {
        currentBlock = block.dom ? block.dom.call(paper, node) : { [block.name]: true };
      } else {
        currentBlock = {};
      }
      if (!opts || !opts.ignoreAttributes) {
        currentBlock = undecorateBlock(node, block, currentBlock);
      }
    }
  }
  delta.insert('\n', currentBlock);
  return delta;
}

/**
 * Converts a delta object into an HTML string based off of the supplied Paper definition.
 */
export function deltaToHTML(view, delta) {
  return childrenToHTML(deltaToVdom(view, delta).children);
}

/**
 * Converts an HTML string into a delta object based off of the supplied Paper definition.
 */
export function deltaFromHTML(view, html) {
  const template = document.createElement('template');
  template.innerHTML = '<div>' + html + '</div>';
  return deltaFromDom(view, template.content.firstChild, { notInDom: true });
}


// Joins adjacent markup nodes
function mergeChildren(oldChildren) {
  const children = [];
  oldChildren.forEach((next, i) => {
    const prev = children[children.length - 1];

    if (prev && typeof prev !== 'string' && typeof next !== 'string' && nodeMarkup.get(prev) &&
      nodeMarkup.get(prev) === nodeMarkup.get(next) && deepEqual(prev.attributes, next.attributes))
    {
      prev.children = prev.children.concat(next.children);
    } else {
      children.push(next);
    }
  });
  return children;
}

// vdom node to HTML string
function nodeToHTML(node) {
  const attr = Object.keys(node.attributes)
    .reduce((attr, name) =>
      `${attr} ${escape(name)}="${escape(node.attributes[name])}"`, '');
  const children = childrenToHTML(node.children);
  const closingTag = children || !voidElements[node.name] ? `</${node.name}>` : '';
  return `<${node.name}${attr}>${children}${closingTag}`;
}

// vdom children to HTML string
function childrenToHTML(children) {
  if (!children || !children.length) return '';
  return children.reduce((html, child) => html + (child.name ? nodeToHTML(child) : escape(child).replace(/\xA0/g, '&nbsp;')), '');
}
