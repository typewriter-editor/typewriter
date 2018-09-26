import { h } from './vdom';
import { decorateBlock } from './dom-utils';


export const paragraph = {
  name: 'paragraph',
  selector: 'p',
  vdom: children => <p>{children}</p>,
};


export const header = {
  name: 'header',
  selector: 'h1, h2, h3, h4, h5, h6',
  defaultFollows: true,
  dom: node => ({ header: parseInt(node.nodeName.replace('H', '')) }),
  vdom: (children, attr) => {
    const H = `h${attr.header}`;
    return <H>{children}</H>;
  },
};


export const list = {
  name: 'list',
  selector: 'ul > li, ol > li',
  optimize: true,
  dom: node => {
    let indent = -1, parent = node.parentNode;
    const list = parent.nodeName === 'OL' ? 'ordered' : 'bullet';
    while (parent) {
      if (/^UL|OL$/.test(parent.nodeName)) indent++;
      else if (parent.nodeName !== 'LI') break;
      parent = parent.parentNode;
    }
    const attr = { list };
    if (indent) attr.indent = indent;
    return attr;
  },
  vdom: lists => {
    const topLevelChildren = [];
    const levels = [];
    // e.g. levels = [ul, li, ul, li]

    lists.forEach(([children, attr]) => {
      const List = attr.list === 'ordered' ? 'ol' : 'ul';
      const index = Math.min((attr.indent || 0) * 2, levels.length);
      const item = decorateBlock(<li>{children}</li>, attr);
      let list = levels[index];
      if (list && list.name === List) {
        list.children.push(item);
      } else {
        list = <List>{item}</List>;
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
  selector: 'blockquote p',
  optimize: true,
  vdom: quotes => {
    return <blockquote>{quotes.map(([children, attr]) => decorateBlock(<p>{children}</p>, attr))}</blockquote>;
  },
};
