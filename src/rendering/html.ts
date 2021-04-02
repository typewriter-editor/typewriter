import { escapeHtml } from './escape-html';
import { isBRPlaceholder } from './br';
import { VChild } from './vdom';
import TextDocument from '../doc/TextDocument';
import { renderInline } from '../rendering/rendering';
import { createTreeWalker } from './walker';
import Delta from '../delta/Delta';
import { renderDoc } from './rendering';
import Editor from '../Editor';
import { EditorRange } from '../doc/EditorRange';

// A list of bad characters that we don't want coming in from pasted content (e.g. "\f" aka line feed)
const BAD_CHARS = /[\0-\x09\x0B\x1F\x7F-\x9F\xAD\u0600-\u0605\u061C\u06DD\u070F\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB\uE000-\uF8FF]/g;
const SKIP_ELEMENTS = { STYLE: true, SCRIPT: true, LINK: true, META: true, TITLE: true, };
const BLOCK_ELEMENTS = 'address, article, aside, blockquote, editor, dd, div, dl, dt, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hr, li, main, nav, noscript, ol, output, p, pre, section, table, tfoot, ul, video';
const VOID_ELEMENTS = {
  area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true,
  link: true, meta: true, param: true, source: true, track: true, wbr: true
};
const whitespaceExp = /[ \t\n\r]+/g;
const textsNode = document.createElement('div');
const defaultOptions = {};

export interface DeltaFromHTMLOptions {
  possiblePartial?: boolean;
}

export interface FromDomOptions {
  root?: HTMLElement;
  startNode?: Node;
  endNode?: Node;
  offset?: number;
  possiblePartial?: boolean;
}


export function docToHTML(editor: Editor, doc: TextDocument) {
  return childrenToHTML(renderDoc(editor, doc));
}


export function inlineToHTML(editor: Editor, delta: Delta) {
  return childrenToHTML(renderInline(editor, delta));
}


export function docFromHTML(editor: Editor, html: string, selection?: EditorRange | null) {
  return new TextDocument(deltaFromHTML(editor, html), selection);
}


export function deltaFromHTML(editor: Editor, html: string, options?: DeltaFromHTMLOptions) {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(html, 'text/html' );
  const delta = deltaFromDom(editor, { root: doc.body, possiblePartial: options && options.possiblePartial });
  cleanText(delta);
  return delta;
}


export function docFromDom(editor: Editor, root: HTMLElement) {
  return new TextDocument(deltaFromDom(editor, { root }));
}


export function cleanText(delta: Delta) {
  delta.forEach(op => {
    if (typeof op.insert === 'string') {
      op.insert = op.insert.replace(BAD_CHARS, '');
    }
  });
}


export function deltaFromDom(editor: Editor, options: FromDomOptions = defaultOptions): Delta {
  const { lines, embeds } = editor.typeset;
  const root = options.root || editor.root;

  var walker = createTreeWalker(root, node => !SKIP_ELEMENTS[node.nodeName]);
  const delta = new Delta();
  let currentLine: any, firstLineSeen = false, unknownLine = false, empty = true, node: Node | null;

  if (options.startNode) {
    walker.currentNode = options.startNode;
    walker.previousNode();
    if (options.offset) delta.retain(options.offset, undefined);
  } else {
    walker.currentNode = root;
  }

  while ((node = walker.nextNode())) {
    if (node === options.endNode) break;

    if (isBRPlaceholder(editor, node)) {
      empty = false;
    } else if (node.nodeName === 'BR' && (node as Element).className === 'Apple-interchange-newline') {
      delta.insert('\n', !currentLine || currentLine.unknownLine ? {} : currentLine);
    } else if (node.nodeType === Node.TEXT_NODE) {
      let parent = node.parentNode as Element;

      // If all newlines, we can ignore
      if (node.nodeValue == null || node.nodeValue.replace(/\n+/g, '') === '') continue;

      // If blank text between lines, ignore
      if (!node.nodeValue.replace(/\s+/g, '')) {
        if (node.parentNode === root
          || (node.previousSibling && lines.matches(node.previousSibling))
          || (node.nextSibling && lines.matches(node.nextSibling))) {
            continue;
          }
      }

      // non-breaking spaces (&nbsp;) are spaces in a delta, but first collapse all whitespace to 1
      const text = node.nodeValue.replace(whitespaceExp, ' ').replace(/\xA0/g, ' ');

      // Word gives us end-of-paragraph nodes with a single space. Ignore them.
      if (!text || (text === ' ' && parent.classList.contains('EOP'))) continue;

      // Gather up all the formats for this text node, walking up to the line level
      const attributes = gatherFormats(parent, root, editor);

      empty = false;
      delta.insert(text, attributes);
    } else if (embeds.matches(node)) {
      const embed = embeds.findByNode(node);
      if (embed) {
        const attributes = gatherFormats(node.parentNode as Element, root, editor);
        if (embed.fromDom !== false) {
          delta.insert(embed.fromDom ? embed.fromDom(node) : { [embed.name]: true }, attributes);
        }
      }
    } else if (lines.matches(node) || (node.nodeType === Node.ELEMENT_NODE && (node as Element).matches(BLOCK_ELEMENTS))) {
      unknownLine = !lines.matches(node);

      if (unknownLine) {
        let parent = node.parentNode;
        while (parent && !lines.matches(parent) && parent !== root) {
          parent = parent.parentNode;
        }
        // If this line element is inside a recognized line, ignore it
        if (parent && parent !== root) {
          continue;
        }
      }

      const line = lines.findByNode(node, true);

      // Skip paragraphs/divs inside blockquotes and list items etc.
      if (line === lines.default && (!node.parentNode || lines.matches(node.parentNode))) {
        continue;
      }

      if (firstLineSeen) {
        if (!currentLine || !currentLine.unknownLine || !empty) {
          delta.insert('\n', !currentLine || currentLine.unknownLine ? {} : currentLine);
          empty = true;
        }
      } else {
        firstLineSeen = true;
      }

      if (unknownLine) {
        currentLine = { unknownLine };
      } else if (line && line !== lines.default) {
        currentLine = line.fromDom ? line.fromDom(node) : { [line.name]: true };
      } else {
        currentLine = {};
      }
    }
  }

  // Delta documents should always end with a newline, unless they are partial documents
  if (!unknownLine || !empty) {
    if (firstLineSeen || !options.possiblePartial) {
      delta.insert('\n', !currentLine || currentLine.unknownLine ? {} : currentLine);
    }
  }

  return delta;
}


// vdom children to HTML string
function childrenToHTML(children: VChild[]): string {
  if (!children || !children.length) return '';
  return (children as any).reduce((html: string, child: VChild) => html + (typeof child !== 'string' ? nodeToHTML(child) : escapeHtml(child).replace(/\xA0/g, '&nbsp;')), '');
}

// vdom node to HTML string
function nodeToHTML(node: VChild): string {
  if (typeof node === 'string') {
    textsNode.textContent = node;
    const html = textsNode.innerHTML;
    textsNode.textContent = '';
    return html;
  }
  const attr = Object.keys(node.props)
    .reduce((attr, name) =>
      name === 'key' || node.props[name] == null
      ? attr
      : `${attr} ${escapeHtml(name)}="${escapeHtml(node.props[name])}"`, '');
  const children = childrenToHTML(node.children);
  const closingTag = children || !VOID_ELEMENTS[node.type] ? `</${node.type}>` : '';
  return `<${node.type}${attr}>${children}${closingTag}`;
}


// Walk up the DOM to the closest parent, finding formats
function gatherFormats(parent: Element, root: Element, editor: Editor) {
  const { lines, formats } = editor.typeset;
  const attributes = {};

  while (parent && !lines.matches(parent) && parent !== root) {
    if (formats.matches(parent)) {
      const format = formats.findByNode(parent);
      if (format && format.fromDom !== false) {
        attributes[format.name] = format.fromDom ? format.fromDom(parent) : true;
      }
    } else if (parent.hasAttribute('style')) {
      formats.list.forEach(format => {
        if (format.styleSelector && parent.matches(format.styleSelector)) {
          attributes[format.name] = format.fromDom ? format.fromDom(parent) : true;
        }
      });
    }
    parent = parent.parentNode as Element;
  }

  return attributes;
}
