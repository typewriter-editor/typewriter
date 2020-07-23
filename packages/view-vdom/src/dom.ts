import { deepEqual, Delta, AttributeMap } from '@typewriter/editor';
import { Paper, Type } from '@typewriter/view';
import { escapeHtml } from './escape-html';
import { h, VDomNode, VDomChild } from './vdom';
import { getComponent } from './components';

const nodeMarks = new WeakMap();
const BR = h('br');
const VOID_ELEMENTS = {
  area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true,
  link: true, meta: true, param: true, source: true, track: true, wbr: true
};

type BlockData = [Type, VDomChild[], AttributeMap];

export function deltaToVdom(delta: Delta, paper: Paper) {
  const { blocks, marks, embeds } = paper;
  const blockData: BlockData[] = [];

  delta.eachLine((line: Delta, attributes: AttributeMap) => {
    let inlineChildren: VDomChild[] = [];

    // Collect block children
    line.ops.forEach((op, i, array) => {
      if (op.insert) {
        let children: VDomChild[] = [];
        if (typeof op.insert === 'string') {
          const prev = array[i - 1];
          const next = array[i + 1];
          let text: string = op.insert.replace(/  /g, ' \xA0');
          if (!prev) text = text.replace(/^ /, '\xA0');
          if (!next || (typeof next.insert === 'string' && next.insert[0] === ' ')) text = text.replace(/ $/, '\xA0');
          children.push(text);
        } else {
          const embed = embeds.findByAttributes(op.insert);
          let component: Function;
          if (embed && (component = getComponent(embed.name))) {
            const node = component(op.insert);
            children.push(node);
          }
        }

        if (op.attributes) {
          // Sort them by the order found in marks and be efficient
          Object.keys(op.attributes).sort((a, b) => marks.priority(b) - marks.priority(a)).forEach(name => {
            const mark = marks.get(name);
            let component: Function;
            if (mark && (component = getComponent(mark.name))) {
              const node = component(op.attributes, children);
              nodeMarks.set(node, mark); // Store for merging
              children = [ node ];
            }
          });
        }
        inlineChildren.push.apply(inlineChildren, children);
      }
    });

    // Merge marks to optimize
    inlineChildren = mergeChildren(inlineChildren);
    const lastChild = inlineChildren[inlineChildren.length - 1];
    if (!inlineChildren.length || (lastChild && (lastChild as VDomNode).name === 'br')) {
      inlineChildren.push(BR);
    }

    let block = blocks.findByAttributes(attributes);
    if (!block) block = blocks.getDefault();

    blockData.push([ block, inlineChildren, attributes ]);
  });

  // If a block has optimize=true on it, vdom will be called with all sibling nodes of the same block
  let blockChildren: VDomChild[] = [], prevBlock;
  let collect: [AttributeMap, VDomChild[]][] = [];
  blockData.forEach((data, i) => {
    const [ block, children, attr ] = data;
    const component = getComponent(block.name);
    if (component && (component as any).rendersMultiple) {
      collect.push([ attr, children ]);
      const next = blockData[i + 1];
      if (!next || next[0] !== block) {
        const children = component(collect);
        blockChildren = blockChildren.concat(children);
        collect = [];
      }
    } else if (component) {
      const node = component(attr, children) as VDomChild;
      blockChildren.push(node);
    }
  });

  return blockChildren;
}


/**
 * Converts a delta object into an HTML string based off of the supplied Paper definition.
 */
export function deltaToHTML(delta, paper: Paper) {
  return childrenToHTML(deltaToVdom(delta, paper));
}


// Joins adjacent mark nodes
function mergeChildren(oldChildren) {
  const children: VDomChild[] = [];
  oldChildren.forEach((next, i) => {
    const prev = children[children.length - 1];

    if (prev && typeof prev !== 'string' && typeof next !== 'string' && nodeMarks.get(prev) &&
      nodeMarks.get(prev) === nodeMarks.get(next) && deepEqual(prev.attributes, next.attributes))
    {
      prev.children = prev.children.concat(next.children);
    } else {
      children.push(next);
      if (prev && typeof prev !== 'string' && prev.children) {
        prev.children = mergeChildren(prev.children);
      }
    }
  });
  if (children.length) {
    const last = children[children.length - 1];
    if (last && typeof last !== 'string' && last.children) {
      last.children = mergeChildren(last.children);
    }
  }
  return children;
}

// vdom node to HTML string
function nodeToHTML(node) {
  const attr = Object.keys(node.attributes)
    .reduce((attr, name) =>
      `${attr} ${escapeHtml(name)}="${escapeHtml(node.attributes[name])}"`, '');
  const children = childrenToHTML(node.children);
  const closingTag = children || !VOID_ELEMENTS[node.name] ? `</${node.name}>` : '';
  return `<${node.name}${attr}>${children}${closingTag}`;
}

// vdom children to HTML string
function childrenToHTML(children) {
  if (!children || !children.length) return '';
  return children.reduce((html, child) => html + (child.name ? nodeToHTML(child) : escapeHtml(child).replace(/\xA0/g, '&nbsp;')), '');
}
