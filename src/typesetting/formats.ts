import { h } from '../rendering/vdom';
import { format } from './typeset';


export const bold = format({
  name: 'bold',
  selector: 'strong, b',
  styleSelector: '[style*="font-weight:bold"], [style*="font-weight: bold"]',
  commands: editor => () => editor.toggleTextFormat({ bold: true }),
  shortcuts: 'Mod+B',
  render: (attributes, children) => h('strong', null, children),
});

export const italic = format({
  name: 'italic',
  selector: 'em, i',
  styleSelector: '[style*="font-style:italic"], [style*="font-style: italic"]',
  commands: editor => () => editor.toggleTextFormat({ italic: true }),
  shortcuts: 'Mod+I',
  render: (attributes, children) => h('em', null, children),
});

export const code = format({
  name: 'code',
  selector: 'code',
  commands: editor => () => editor.toggleTextFormat({ code: true }),
  render: (attributes, children) => h('code', null, children),
});

export const link = format({
  name: 'link',
  selector: 'a[href]',
  greedy: false,
  commands: editor => (link: string) => editor.toggleTextFormat({ link }),
  fromDom: (node: HTMLAnchorElement) => node.href,
  render: (attributes, children) => h('a', { href: attributes.link, target: '_blank' }, children),
});
