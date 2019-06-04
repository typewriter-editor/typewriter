import { h } from './vdom';


export const bold = (attr, children) => h('strong', undefined, children);

export const italic = (attr, children) => h('em', undefined, children);

export const code = (attr, children) => h('code', undefined, children);

export const link = (attr, children) => h('a', { href: attr.link, target: '_blank' }, children);

export const decorator = (attr, children) => {
  const attrs = { ...attr.decorator };
  attrs.class = attrs.class ? attrs.class + ' decorator' : 'decorator';
  return h('span', attrs, children);
};
