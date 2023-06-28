import { AttributeMap, Delta, normalizeRange } from '@typewriter/document';
import { VNode, h, Props, VChild } from '../rendering/vdom';
import { line } from './typeset';
import { applyDecorations } from '../modules/decorations';


export const paragraph = line({
  name: 'paragraph',
  selector: 'p',
  commands: editor => () => editor.formatLine({}),
  shortcuts: 'Mod+0',
  render: (attributes, children) => h('p', null, children)
});

export const header = line({
  name: 'header',
  selector: 'h1, h2, h3, h4, h5, h6',
  defaultFollows: true,
  commands: editor => ({
    header: (header: number) => editor.toggleLineFormat({ header }),
    header1: () => editor.toggleLineFormat({ header: 1 }),
    header2: () => editor.toggleLineFormat({ header: 2 }),
    header3: () => editor.toggleLineFormat({ header: 3 }),
    header4: () => editor.toggleLineFormat({ header: 4 }),
    header5: () => editor.toggleLineFormat({ header: 5 }),
    header6: () => editor.toggleLineFormat({ header: 6 }),
  }),
  shortcuts: {
    'Mod+1': 'header1',
    'Mod+2': 'header2',
    'Mod+3': 'header3',
    'Mod+4': 'header4',
    'Mod+5': 'header5',
    'Mod+6': 'header6',
  },
  fromDom: (node: Node) => ({ header: parseInt(node.nodeName.replace('H', '')) }),
  render: (attributes, children) => h(`h${attributes.header}` as any, null, children),
});

export const list = line({
  name: 'list',
  selector: 'ul > li, ol > li',
  indentable: true,
  commands: editor => ({
    bulletList: () => editor.toggleLineFormat({ list: 'bullet' }),
    orderedList: () => editor.toggleLineFormat({ list: 'ordered' }),
    checkList: () => editor.toggleLineFormat({ list: 'check' }),
    indent: () => editor.indent(),
    outdent: () => editor.outdent(),
    toggleCheck: (id: string) => {
      const line = typeof id === 'string'
        ? editor.doc.getLineBy(id)
        : editor.doc.selection
        ? editor.doc.getLineAt(editor.doc.selection[0])
        : null;
      if (!line) return false;
      const [ at ] = editor.doc.getLineRange(line);
      const format = { list: 'check' } as AttributeMap;
      if (!line.attributes.checked) format.checked = true;
      editor.formatLine(format, at)
    },
  }),
  shortcuts: {
    'Mod+Space': 'toggleCheck',
  },
  fromDom(node: HTMLElement) {
    let indent = -1, parent = node.parentNode, type = parent && (parent as Element).getAttribute('type');
    const list = node.hasAttribute('data-checked') ? 'check' : parent && parent.nodeName === 'OL' ? 'ordered' : 'bullet';
    while (parent) {
      if (/^UL|OL$/.test(parent.nodeName)) indent++;
      else if (parent.nodeName !== 'LI') break;
      parent = parent.parentNode;
    }
    if (!indent && node.className.startsWith('ql-indent-')) {
      // Support pasting from quilljs content
      indent = parseInt(node.className.replace('ql-indent-', ''));
    }
    const attr: { list: string, type?: string, checked?: boolean, indent?: number } = { list };
    if (indent) attr.indent = indent;
    if (type) attr.type = type;
    if (node.getAttribute('data-checked') === 'true') attr.checked = true;
    return attr;
  },
  nextLineAttributes(attributes) {
    const { start, ...rest } = attributes;
    return rest;
  },
  shouldCombine: (prev, next) => (prev.list === next.list && !next.start && prev.type === next.type) || next.indent,
  renderMultiple: (lists, editor, forHTML) => {
    const topLevelChildren: VNode[] = [];
    const levels: VNode[] = [];
    // e.g. levels = [ul, ul]

    lists.forEach(([ attributes, children, id ]) => {
      const type = attributes.list === 'ordered' ? 'ol' : 'ul';
      const index = attributes.indent as number || 0;
      let props: Props = { key: id };
      if (attributes.list === 'check') {
        function toggle(event: any) {
          if (!editor.enabled) return;
          event.preventDefault();
          editor.commands.toggleCheck(id);
        }
        const check = h('button', { class: 'check-list-check', onmousedown: toggle, ontouchstart: toggle, });
        if (children.length === 1 && (children[0] as VNode).type === 'br') children.push(check);
        else children.unshift(check);
        props = {
          ...props,
          class: 'check-list-item',
          ['data-checked']: '' + (attributes.checked || false),
        };
      }
      const item = applyDecorations(h('li', props, children), attributes);

      while (index >= levels.length) {
        const newLevel = h(type, { start: attributes.start, type: attributes.type, key: `${id}-outer` });
        const childrenArray = levels.length ? levels[levels.length - 1].children : topLevelChildren;
        const lastChild = childrenArray[childrenArray.length - 1];
        if (typeof lastChild === 'object' && lastChild.type === 'li') {
          if (forHTML) {
            // Correct HTML
            lastChild.children.push(newLevel);
          } else {
            // Technically incorrect HTML needed to fix selection bug: when clicking to the right of a list item with a
            // sub-item, the selection goes to the start of the line instead of the end
            childrenArray.push(newLevel);
          }
        } else {
          childrenArray.push(newLevel);
        }
        levels.push(newLevel);
      }

      if (!compareLists(levels[index], type, attributes)) {
        const newLevel = h(type, { start: attributes.start, type: attributes.type });
        const childrenArray = index ? levels[index - 1].children : topLevelChildren;
        childrenArray.push(newLevel);
        levels[index] = newLevel;
      }

      levels[index].children.push(item);

      levels.length = index + 1;
    });

    function compareLists(list: VNode, type: string, attributes: AttributeMap) {
      return list.type === type
        && (list.props.start === attributes.start
            || (list.props.start && !attributes.start))
        && list.props.type === attributes.type;
    }

    return topLevelChildren[0];
  }
});

export const blockquote = line({
  name: 'blockquote',
  selector: 'blockquote p',
  commands: editor => (blockquote: string | true | any = true) => {
    if (typeof blockquote !== 'string') blockquote = true;
    editor.toggleLineFormat({ blockquote })
  },
  fromDom(node: HTMLParagraphElement) {
    const { className } = (node.parentNode as HTMLElement);
    const match = className.match(/quote-(\S+)/);
    const blockquote = match && match[1] !== 'true' && match[1] || true;
    return { blockquote };
  },
  shouldCombine: (prev, next) => prev.blockquote === next.blockquote,
  renderMultiple: quotes => {
    const type = quotes[0][0].blockquote;
    const props = typeof type === 'string' ? { className: `quote-${type}`} : null;
    const children = quotes.map(([ attributes, children, id ]) => h('p', { key: id }, children));
    return h('blockquote', props, children);
  }
});

export const codeblock = line({
  name: 'code-block',
  selector: 'pre code',
  contained: true,
  commands: editor => () => editor.toggleLineFormat({ ['code-block']: true }),
  renderMultiple: lines => {
    const children: VChild[] = [];
    lines.forEach(([ attributes, inlineChildren, id ]) => {
      if (inlineChildren.length && ((inlineChildren[inlineChildren.length - 1] as VNode).type === 'br')) {
        inlineChildren.pop();
      }
      children.push(h('code', { key: id }, inlineChildren));
      children.push('\n');
    });
    return h('pre', { spellcheck: false }, children);
  }
});

export const hr = line({
  name: 'hr',
  selector: 'hr',
  frozen: true,
  commands: editor => () => {
    const { doc } = editor;
    const { selection } = doc;
    if (!selection) return;
    const range = normalizeRange(selection);
    const change = editor.change.delete(range);
    if (range[0] === range[1] && doc.getLineAt(range[0]).length === 1) {
      change
        .insert(range[0], '\n', { ...doc.getLineFormat(range[0]) })
        .formatLine(range[0], { hr: true });
    } else {
      const delta = new Delta()
        .insert('\n', doc.getLineAt(range[0]).attributes)
        .insert('\n', { hr: true });
      change.insertContent(range[0], delta);
      change.select(range[0] + 2);
    }
    editor.update(change);
  },
  render: () => h('hr'),
});

export const dl = line({
  name: 'dl',
  selector: 'dl dt, dl dd',
  fromDom(node) {
    return { dl: node.nodeName.toLowerCase() };
  },
  onTab: (editor, shiftKey) => {
    const { doc } = editor;
    const { selection } = doc;
    if (!selection) return;
    const at = shiftKey
      ? (selection[0] === selection[1] || selection[0] > selection[1] ? selection[1] : selection[1] - 1)
      : (selection[0] === selection[1] || selection[1] > selection[0] ? selection[0] : selection[0] - 1);
    const line = doc.getLineAt(at);

    const index = doc.lines.indexOf(line);
    const next = doc.lines[index + (shiftKey ? -1 : 1)];
    if ((next?.attributes.dl === line.attributes.dl || !next?.attributes.dl) && !shiftKey) {
      if (line.length === 1 && line.attributes.dl === 'dt') {
        editor.formatLine({}, doc.getLineRange(line));
      } else {
        const at = doc.getLineRange(line)[1] - 1;
        editor.insert('\n', { dl: line.attributes.dl === 'dt' ? 'dd' : 'dt' }, [ at, at ]);
      }
    } else if (next) {
      let nextRange = doc.getLineRange(next);
      nextRange = [ nextRange[0], nextRange[1] - 1 ];
      if (shiftKey && !next.attributes.dl) nextRange = [ nextRange[1], nextRange[1] ];
      editor.select(nextRange);
    }
  },
  commands: editor => () => editor.toggleLineFormat({ dl: 'dt' }),
  shouldCombine: () => true,
  nextLineAttributes: (attrs) => ({ dl: attrs.dl === 'dt' ? 'dd' : 'dt' }),
  renderMultiple: (lines) => {
    const children: VNode[] = [];
    let last = '';
    for (const [ attrs, chdlrn, key ] of lines) {
      if (!last || attrs.dl === 'dt') {
        children.push(h('div', {}, []));
      }
      children[children.length - 1].children.push(h(attrs.dl, { key }, chdlrn));
      last = attrs.dl;
    }
    return h('dl', {}, children);
  }
});
