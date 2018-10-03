import { h } from './vdom';


export const bold = {
  name: 'bold',
  selector: 'strong, b',
  styleSelector: '[style*="bold"]',
  vdom: children => <strong>{children}</strong>,
};


export const italic = {
  name: 'italic',
  selector: 'em, i',
  styleSelector: '[style*="italic"]',
  vdom: children => <em>{children}</em>,
};


export const code = {
  name: 'code',
  selector: 'code',
  vdom: children => <code>{children}</code>,
};


export const link = {
  name: 'link',
  selector: 'a[href]',
  dom: node => node.href,
  vdom: (children, attr) => <a href={attr.link} target="_blank">{children}</a>,
};
