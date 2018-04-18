import { h } from 'ultradom';

export const paragraph = {
  name: 'paragraph',
  selector: 'p',
  vdom: children => <p>{children}</p>,
};


export const header = {
  name: 'header',
  selector: 'h1, h2, h3, h4, h5, h6',
  defaultFollows: true,
  attr: node => ({ header: parseInt(node.nodeName.replace('H', '')) }),
  vdom: (children, attr) => {
    const H = `h${attr.header}`;
    return <H>{children}</H>;
  },
};


export const list = {
  name: 'list',
  selector: 'ul > li, ol > li',
  optimize: true,
  attr: node => {
    let indent = -1, parent = node.parentNode;
    const list = parent.nodeName === 'OL' ? 'ordered' : 'bullet';
    const start = parent.start === 1 ? undefined : parent.start;
    while (parent) {
      if (/^UL|OL$/.test(parent.nodeName)) indent++;
      else if (parent.nodeName !== 'LI') break;
      parent = parent.parentNode;
    }
    const attr = { list };
    if (indent) attr.indent = indent;
    if (start !== undefined) attr.start = start;
    return attr;
  },
  vdom: lists => {
    const topLevelChildren = [];
    let levels = [];
    // e.g. levels = [ul, li, ul, li]

    lists.forEach(([children, attr]) => {
      const List = attr.list === 'ordered' ? 'ol' : 'ul';
      const index = (attr.indent || 0) * 2;
      const item = <li>{children}</li>;
      let list = levels[index];
      if (list && list.nodeName === List) {
        list.children.push(item);
      } else {
        list = <List start={attr.start}>{item}</List>;
        const childrenArray = index ? levels[index - 1].children : topLevelChildren;
        childrenArray.push(list);
        levels[index] = list;
      }
      levels[index + 1] = item;
      levels.length = index + 2;
    });

    return topLevelChildren;
  },
};

export const blockquote = {
  name: 'blockquote',
  selector: 'blockquote',
  vdom: children => <blockquote>{children}</blockquote>,
};


export const container = {
  name: 'container',
  selector: 'div',
  vdom: (children, attr) => <div contenteditable={attr.enabled}>
    {children && children.length && children || paragraph.vdom()}
  </div>,
};


export const bold = {
  name: 'bold',
  selector: 'strong, b',
  vdom: children => <strong>{children}</strong>,
};


export const italics = {
  name: 'italics',
  selector: 'em, i',
  vdom: children => <em>{children}</em>,
};


export const link = {
  name: 'link',
  selector: 'a[href]',
  attr: node => node.href,
  vdom: (children, attr) => <a href={attr.link} target="_blank">{children}</a>,
};


export const image = {
  name: 'image',
  selector: 'img',
  attr: node => node.src,
  vdom: (children, attr) => <img src={attr.image}/>
};


export default {
  blocks: [ paragraph, header, list, blockquote, container ],
  markups: [ bold, italics, link ],
  embeds: [ image ],
};
