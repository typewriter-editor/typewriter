import { isBRPlaceholder } from './br';
import { Paper } from './paper';
import { Delta } from '@typewriter/editor';

const SKIP_ELEMENTS = { STYLE: true, SCRIPT: true, LINK: true, META: true, TITLE: true, };
const BLOCK_ELEMENTS = 'address, article, aside, blockquote, canvas, dd, div, dl, dt, fieldset, figcaption, figure, footer, form, header, hr, li, main, nav, noscript, ol, output, p, pre, section, table, tfoot, ul, video';
const defaultOptions = { notInDom: false, };


export function deltaFromDom(root: Element, paper: Paper, options: any = {}): Delta {
  if (!root.ownerDocument) return new Delta();
  const inDom: boolean = root.ownerDocument && root.ownerDocument.contains(root);
  const { blocks, embeds } = paper;
  if (!options) options = defaultOptions;

  var walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      if (SKIP_ELEMENTS[node.nodeName]) {
        return NodeFilter.FILTER_REJECT;
      } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue === '') {
        return NodeFilter.FILTER_REJECT;
      } else if (node.nodeType === Node.TEXT_NODE || options.notInDom || inDom) {
        return NodeFilter.FILTER_ACCEPT;
      } else {
        return NodeFilter.FILTER_REJECT;
      }
    }
  });
  const delta = new Delta();
  let currentBlock: any, firstBlockSeen = false, unknownBlock = false, empty = true, node: Node | null;
  let lastNode = false;

  if (options.startNode) {
    walker.currentNode = options.startNode;
    walker.previousNode();
    if (options.offset) delta.retain(options.offset, undefined);
  } else {
    walker.currentNode = root;
  }

  while ((node = walker.nextNode())) {
    if (node === options.endNode) lastNode = true;
    else if (lastNode) break;

    if (isBRPlaceholder(paper, node)) {
      empty = false;
    } else if (node.nodeType === Node.TEXT_NODE) {
      let parent = node.parentNode as Element;

      // If all newlines, we can ignore
      if (node.nodeValue == null || node.nodeValue.replace(/\n+/g, '') === '') continue;

      // non-breaking spaces (&nbsp;) are spaces in a delta, but first collapse all whitespace to 1
      const text = node.nodeValue.replace(/\s+/g, ' ').replace(/\xA0/g, ' ');

      // Word gives us end-of-paragraph nodes with a single space. Ignore them.
      if (!text || (text === ' ' && parent.classList.contains('EOP'))) continue;

      // Gather up all the marks for this text node, walking up to the block level
      const attributes = gatherMarks(parent, root, paper);

      empty = false;
      delta.insert(text, attributes);
    } else if (embeds.matches(node)) {
      const embed = embeds.findByNode(node);
      if (embed) {
        const attributes = gatherMarks(node.parentNode as Element, root, paper);
        if (embed.fromDom !== false) {
          delta.insert(embed.fromDom ? embed.fromDom(node, paper) : { [embed.name]: true }, attributes);
        }
      }
    } else if (blocks.matches(node) || (node.nodeType === Node.ELEMENT_NODE && (node as Element).matches(BLOCK_ELEMENTS))) {
      unknownBlock = !blocks.matches(node);

      if (unknownBlock) {
        let parent = node.parentNode;
        while (parent && !blocks.matches(parent) && parent !== root) {
          parent = parent.parentNode;
        }
        // If this block element is inside a recognized block, ignore it
        if (parent && parent !== root) {
          continue;
        }
      }

      const block = blocks.findByNode(node, true);

      // Skip paragraphs/divs inside blockquotes and list items etc.
      if (block === blocks.getDefault() && (!node.parentNode || blocks.matches(node.parentNode))) {
        continue;
      }

      if (firstBlockSeen) {
        if (!currentBlock.unknownBlock || !empty) {
          delta.insert('\n', currentBlock.unknownBlock ? {} : currentBlock);
          empty = true;
        }
      } else {
        firstBlockSeen = true;
      }

      if (unknownBlock) {
        currentBlock = { unknownBlock };
      } else if (block && block !== blocks.getDefault()) {
        currentBlock = block.fromDom ? block.fromDom(node, paper) : { [block.name]: true };
      } else {
        currentBlock = {};
      }
    }
  }

  // Delta documents should always end with a newline, unless they are partial documents
  if (!unknownBlock || !empty) {
    delta.insert('\n', currentBlock.unknownBlock ? {} : currentBlock);
  }

  return delta;
}


// Walk up the DOM to the closest parent, finding marks
function gatherMarks(parent: Element, root: Element, paper: Paper) {
  const { blocks, marks } = paper;
  const attributes = {};

  while (parent && !blocks.matches(parent) && parent !== root) {
    if (marks.matches(parent)) {
      const mark = marks.findByNode(parent);
      if (mark && mark.fromDom !== false) {
        attributes[mark.name] = mark.fromDom ? mark.fromDom(parent, paper) : true;
      }
    } else if (parent.hasAttribute('style')) {
      marks.list.forEach(mark => {
        if (mark.styleSelector && parent.matches(mark.styleSelector)) {
          attributes[mark.name] = mark.fromDom ? mark.fromDom(parent, paper) : true;
        }
      });
    }
    parent = parent.parentNode as Element;
  }

  return attributes;
}
