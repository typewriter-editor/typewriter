import { h } from './vdom';


export const image = embed => {
  const { image, ...attrs } = embed;
  attrs.src = image;
  return h('img', attrs);
};

export const br = () => h('br');
