import Delta from 'quill-delta';
import { deepEqual } from 'fast-equals';
import escape from 'escape-html';
import { h } from './vdom';
const nodeMarkup = new WeakMap();

const br = <br/>;
const voidElements = {
  area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true,
  link: true, meta: true, param: true, source: true, track: true, wbr: true
};


export function deltaToVdom(view, delta) {
  const paper = view.paper;
  const { blocks, markups, embeds } = paper;
  const blockData = [];

  delta.eachLine((line, attr) => {
    let inlineChildren = [];

    // Collect block children
    line.forEach(op => {
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
        const children = block.vdom.call(paper, collect);
        children.forEach(child => child.key = Math.random());
        blockChildren = blockChildren.concat(children);
        collect = [];
      }
    } else {
      const node = block.vdom.call(paper, children, attr);
      blockChildren.push(node);
    }
  });

  return blocks.get('container').vdom.call(paper, blockChildren);
}


export function deltaFromDom(view, root = view.root, notInDOM) {
  const paper = view.paper;
  const { blocks, markups, embeds } = paper;

  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      return (node.nodeType === Node.TEXT_NODE || notInDOM || node.offsetParent) &&
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
      // BRs are represented with \r, non-breaking spaces are space, and newlines should not exist
      const text = isBr ? '\r' : node.nodeValue.replace(/\xA0/g, ' ').replace(/\n/g, '');
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
        currentBlock = undefined;
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
  return deltaFromDom(view, template.content.firstChild, true);
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
