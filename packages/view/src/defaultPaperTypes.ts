import { Paper } from './paper';

export function getDefaultPaper() {
  return new Paper({
    blocks: [ paragraph, header, list, blockquote, codeblock, hr ],
    marks: [ link, decorator, bold, italic, code ],
    embeds: [ image, br, decorator ],
  });
}

export const paragraph = {
  name: 'paragraph',
  selector: 'p',
};

export const header = {
  name: 'header',
  selector: 'h1, h2, h3, h4, h5, h6',
  defaultFollows: true,
  fromDom: (node: Node) => ({ header: parseInt(node.nodeName.replace('H', '')) }),
};

export const list = {
  name: 'list',
  selector: 'ul > li, ol > li',
  indentable: true,
  fromDom(node: Node) {
    let indent = -1, parent = node.parentNode;
    const list = parent && parent.nodeName === 'OL' ? 'ordered' : 'bullet';
    while (parent) {
      if (/^UL|OL$/.test(parent.nodeName)) indent++;
      else if (parent.nodeName !== 'LI') break;
      parent = parent.parentNode;
    }
    const attr: { list: string, indent?: number } = { list };
    if (indent) attr.indent = indent;
    return attr;
  },
  getNextLineAttributes(attrs) {
    const { start, ...rest } = attrs;
    return rest;
  }
};

export const blockquote = {
  name: 'blockquote',
  selector: 'blockquote p',
  fromDom(node: HTMLParagraphElement) {
    const { className } = (node.parentNode as HTMLElement);
    const match = className.match(/quote-(\S+)/);
    const blockquote = match && match[1] !== 'true' && match[1] || true;
    return { blockquote };
  }
};

export const codeblock = {
  name: 'code-block',
  selector: 'pre code, pre',
};

export const hr = {
  name: 'hr',
  selector: 'hr',
};

export const bold = {
  name: 'bold',
  selector: 'strong, b',
  styleSelector: '[style*="font-weight:bold"], [style*="font-weight: bold"]',
};

export const italic = {
  name: 'italic',
  selector: 'em, i',
  styleSelector: '[style*="font-style:italic"], [style*="font-style: italic"]',
};

export const code = {
  name: 'code',
  selector: 'code',
};

export const link = {
  name: 'link',
  selector: 'a[href]',
  fromDom: (node: HTMLAnchorElement) => node.href
};

export const image = {
  name: 'image',
  selector: 'img',
  fromDom: (node: HTMLImageElement) => {
    const image = {};
    ['src', 'alt', 'width', 'height'].forEach(name => {
      if (!node.hasAttribute(name)) return;
      const value = node.getAttribute(name);
      if (name === 'src') name = 'image';
      image[name] = value;
    });
    return image;
  },
};

export const br = {
  name: 'br',
  selector: 'br',
};

// Decorators are not part of the content
export const decorator = {
  name: 'decorator',
  selector: 'span.decorator',
  fromDom: false,
};
