import Delta from '../delta';
import { deepEqual } from '../equal';
import escape from '../escape-html';
import { h } from './vdom';
import { isBRPlaceholder } from './selection';
import { decorateBlock, undecorateBlock } from './dom-utils';
import defaultPaper from './defaultPaper';
import Paper from '../paper';
const nodeMarkup = new WeakMap();

const BR = <br/>;
const VOID_ELEMENTS = {
  area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true,
  link: true, meta: true, param: true, source: true, track: true, wbr: true
};
const SKIP_ELEMENTS = {
  STYLE: true, SCRIPT: true, LINK: true, META: true, TITLE: true
};
const BLOCK_ELEMENTS = 'address, article, aside, blockquote, canvas, dd, div, dl, dt, fieldset, figcaption, figure, footer, form, header, hr, li, main, nav, noscript, ol, output, p, pre, section, table, tfoot, ul, video';


export function deltaToVdom(delta, paper = new Paper(defaultPaper)) {
  const { blocks, markups, embeds, container } = paper;
  const blockData = [];

  delta.eachLine(({ ops, attributes }) => {
    let inlineChildren = [];

    // Collect block children
    ops.forEach(op => {
      if (op.insert) {
        let children = [];
        if (typeof op.insert === 'string') {
          children.push(op.insert.replace(/  /g, '\xA0 ').replace(/^ | $/g, '\xA0'));
        } else {
          const embed = embeds.find(op.insert);
          if (embed) {
            const node = embed.vdom(op.insert[embed.name], paper);
            children.push(node);
          }
        }

        if (op.attributes) {
          // Sort them by the order found in markups and be efficient
          Object.keys(op.attributes).sort((a, b) => markups.priority(b) - markups.priority(a)).forEach(name => {
            const markup = markups.get(name);
            if (markup) {
              const node = markup.vdom(children, op.attributes, paper);
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
    const lastChild = inlineChildren[inlineChildren.length - 1];
    if (!inlineChildren.length || (lastChild && lastChild.name === 'br')) {
      inlineChildren.push(BR);
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

  return container(blockChildren, paper);
}


export function deltaFromDom(view, root = view.root, opts) {
  const inDom = root.ownerDocument.contains(root);
  const paper = view.paper;
  const { blocks, markups, embeds } = paper;

  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      if (SKIP_ELEMENTS[node.nodeName]) {
        return NodeFilter.FILTER_REJECT;
      } else if (node.nodeType === Node.TEXT_NODE || (!opts || opts.notInDom) || inDom) {
        return NodeFilter.FILTER_ACCEPT;
      } else {
        return NodeFilter.FILTER_REJECT;
      }
    }
  });
  const delta = new Delta();
  let currentBlock, firstBlockSeen = false, unknownBlock = false, empty = true, node;

  walker.currentNode = root;

  while ((node = walker.nextNode())) {

    if (isBRPlaceholder(view, node)) {
      empty = false;
    } else if (node.nodeType === Node.TEXT_NODE) {
      // non-breaking spaces are a space, newlines may exist with pasted content but should only be acknowledged within
      // text
      if (node.nodeValue.replace(/\n+/g, '') === '') continue;
      const text = node.nodeValue.replace(/\xA0/g, ' ').replace(/\n+/g, ' ');
      if (!text || (text === ' ' && node.parentNode.classList.contains('EOP'))) continue;
      let parent = node.parentNode, attr = {};

      while (parent && !blocks.matches(parent) && parent !== root) {
        if (markups.matches(parent)) {
          const markup = markups.find(parent);
          attr[markup.name] = markup.dom ? markup.dom(parent, paper) : true;
        } else if (parent.hasAttribute('style')) {
          markups.array.forEach(markup => {
            if (markup.styleSelector && parent.matches(markup.styleSelector)) {
              attr[markup.name] = markup.dom ? markup.dom(parent, paper) : true;
            }
          })
        }
        parent = parent.parentNode;
      }

      empty = false;
      delta.insert(text, attr);
    } else if (embeds.matches(node)) {
      const embed = embeds.find(node);
      if (embed) {
        delta.insert({ [embed.name]: embed.dom ? embed.dom(node, paper) : true });
      }
    } else if (blocks.matches(node) || (node.matches && node.matches(BLOCK_ELEMENTS))) {
      unknownBlock = !blocks.matches(node);

      if (!blocks.matches(node)) {
        let parent = node.parentNode;
        while (parent && !blocks.matches(parent) && parent !== root) {
          parent = parent.parentNode;
        }
        // If this block element is inside a recognized block, ignore it
        if (parent !== root && blocks.matches(parent)) {
          continue;
        }
      }

      const block = blocks.find(node) || blocks.getDefault();
      // Skip paragraphs/divs inside blockquotes and list items etc.
      if (block === blocks.getDefault() && blocks.matches(node.parentNode)) {
        continue;
      }

      if (firstBlockSeen) {
        if (!unknownBlock || !empty) {
          delta.insert('\n', currentBlock);
          empty = true;
        }
      } else {
        firstBlockSeen = true;
      }

      if (block !== blocks.getDefault()) {
        currentBlock = block.dom ? block.dom(node, paper) : { [block.name]: true };
      } else {
        currentBlock = {};
      }
      if (!opts || !opts.ignoreAttributes) {
        currentBlock = undecorateBlock(node, block, currentBlock);
      }
    }
  }
  if (!unknownBlock || !empty) {
    delta.insert('\n', currentBlock);
  }
  return delta;
}

/**
 * Converts a delta object into an HTML string based off of the supplied Paper definition.
 */
export function deltaToHTML(delta, paper) {
  return childrenToHTML(deltaToVdom(delta, paper).children);
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
  const closingTag = children || !VOID_ELEMENTS[node.name] ? `</${node.name}>` : '';
  return `<${node.name}${attr}>${children}${closingTag}`;
}

// vdom children to HTML string
function childrenToHTML(children) {
  if (!children || !children.length) return '';
  return children.reduce((html, child) => html + (child.name ? nodeToHTML(child) : escape(child).replace(/\xA0/g, '&nbsp;')), '');
}
