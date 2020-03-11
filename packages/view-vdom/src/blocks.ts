import { h, VDomNode } from './vdom';


export const paragraph = (attr, children) => h('p', attr.decorator, children);

export const header = (attr, children) => h(`h${attr.header}`, attr.decorator, children);

export const list = lists => {
  const topLevelChildren = [];
  const levels: VDomNode[] = [];
  // e.g. levels = [ul, ul]

  lists.forEach(([attr, children]) => {
    const name = attr.list === 'ordered' ? 'ol' : 'ul';
    const index = attr.indent || 0;
    const item = h('li', attr.decorator, children);

    while (index >= levels.length) {
      const newLevel = h(name, { start: attr.start, type: attr.type });
      const childrenArray = levels.length ? levels[levels.length - 1].children : topLevelChildren;
      const lastChild = childrenArray[childrenArray.length - 1];
      if (typeof lastChild === 'object' && lastChild.name === 'li') {
        lastChild.children.push(newLevel);
      } else {
        childrenArray.push(newLevel);
      }
      levels.push(newLevel);
    }

    if (!compare(levels[index], name, attr)) {
      const newLevel = h(name, { start: attr.start, type: attr.type });
      const childrenArray = index ? levels[index - 1].children : topLevelChildren;
      childrenArray.push(newLevel);
      levels[index] = newLevel;
    }

    levels[index].children.push(item);

    levels.length = index + 1;
  });

  return topLevelChildren;
};

export const blockquote = quotes => {
  let lastType: any, container: VDomNode;
  let containers: VDomNode[] = [];
  quotes.forEach(([attr, children]) => {
    if (lastType !== attr.blockquote) {
      lastType = attr.blockquote;
      container = h('blockquote', { className: `quote-${lastType}`});
      containers.push(container);
    }
    container.children.push(h('p', attr.decorator, children));
  });
  return containers;
}

export const codeblock = lines => h('pre', undefined, lines.map(([attr, children]) => [children, '\n']));

export const hr = () => h('hr');

list.rendersMultiple = true;
blockquote.rendersMultiple = true;
codeblock.rendersMultiple = true;

function compare(list, name, attrs) {
  return list.name === name
    && (list.attributes.start === attrs.start
        || (list.attributes.start && !attrs.start))
    && list.attributes.type === attrs.type;
}
