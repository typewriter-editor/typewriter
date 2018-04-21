import { h } from './vdom';


export const bold = {
  name: 'bold',
  selector: 'strong, b',
  vdom: children => <strong>{children}</strong>,
};


export const italics = {
  name: 'italic',
  selector: 'em, i',
  vdom: children => <em>{children}</em>,
};


export const link = {
  name: 'link',
  selector: 'a[href]',
  attr: node => node.href,
  vdom: (children, attr) => <a href={attr.link} target="_blank">{children}</a>,
};
