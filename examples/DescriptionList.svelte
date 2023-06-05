<script>
  import { onMount } from 'svelte';
import { Editor, h } from 'typewriter-editor';
import Root from 'typewriter-editor/lib/Root.svelte';

const editor = window.editor = new Editor();

editor.typeset.lines.add({
  name: 'dl',
  selector: 'dl dt, dl dd',
  fromDom(node) {
    return { dl: node.nodeName.toLowerCase() };
  },
  onTab: (editor, shiftKey) => {
    const { doc } = editor;
    const { selection } = doc;
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
  shouldCombine: () => true,
  nextLineAttributes: (attrs) => ({ dl: attrs.dl === 'dt' ? 'dd' : 'dt' }),
  renderMultiple: (lines) => {
    const children = [];
    let last = '';
    for (const [ attrs, chdlrn, key ] of lines) {
      if (!last || (last !== attrs.dl && attrs.dl === 'dt')) {
        children.push(h('div', {}, []));
      }
      children[children.length - 1].children.push(h(attrs.dl, { key }, chdlrn));
      last = attrs.dl;
    }
    console.log(children);
    return h('dl', {}, children);
  }
});

</script>

<div class="description">
  <h1>Tabbed Lists</h1>
  <p>
    Work with tabbed lists
  </p>
</div>

<Root {editor} class="text-content">
  <h2>Typewriter</h2>
  <p>
    Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
    expressive API, it is completely customizable to fit any need.
  </p>
  <dl>
    <dt>Age</dt>
    <dd>21</dd>
  </dl>
</Root>

<style>
  :global(dl) {
    tab-size: 20;
  }
  :global(dl > div) {
    display: flex;
    align-items: start;
  }
  :global(dl dt) {
    display: flex;
    flex: 1 1 50%;
    max-width: 50%;
    font-weight: bold;
    margin-right: 4px;
  }
  :global(dl dt:has(br:only-child)) {
    display: block;
    background: linear-gradient(to bottom, transparent, transparent 1em, #eee 1em, #eee calc(1em + 1px), transparent calc(1em + 1px)) no-repeat 100% 0;
    background-size: calc(100% - 4px) 100%;
  }
  :global(dl dt:not(:has(br:only-child))::after) {
    content: '';
    flex: 1 1;
    margin-left: 2px;
    background: linear-gradient(to bottom, transparent, transparent 1em, #eee 1em, #eee calc(1em + 1px), transparent calc(1em + 1px));
    pointer-events: none;
  }
  :global(dl dd) {
    flex: 1 1 50%;
    margin: 0;
  }
</style>
