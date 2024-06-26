<script lang="ts">
  import { type AttributeMap, Editor, h, Root } from '$lib';

  const editor = (globalThis.editor = new Editor());
  editor.typeset.lines.add({
    name: 'cell',
    selector: 'table th, table td',
    child: true,
    fromDom: node => {
      const colspan = (node as HTMLTableCellElement).colSpan;
      const attrs: AttributeMap = { cell: node.nodeName.toLowerCase() };
      if (colspan) attrs.colspan = colspan;
      return attrs;
    },
    render: ({ cell, colspan }, children) => h(cell, { colspan }, children),
  });

  editor.typeset.lines.add({
    name: 'table',
    selector: 'table tr',
    fromDom(node) {
      const tableNode = node.closest('table') as HTMLTableElement;
      const table = tableNode.dataset.key || (tableNode.dataset.key = Math.random().toString(36).slice(-4));
      return { table };
    },
    shouldCombine: (a, b) => a.table === b.table,
    renderMultiple: rows => {
      const sections = [];
      const trs = rows.map(([attrs, children, key]) => h('tr', { key }, children));
      if (trs[0].children.every(c => typeof c !== 'string' && c.type === 'th')) {
        sections.push(h('thead', {}, trs.shift()));
      }
      sections.push(h('tbody', {}, trs));
      return h('table', { 'data-key': rows[0][0].table }, sections);
    },
  });
</script>

<div class="description">
  <h1>Tables (early alpha, interactions need a lot of work)</h1>
  <p>Work with tables</p>
</div>

<Root {editor} class="text-content">
  <h2>Typewriter</h2>
  <p>
    Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
    expressive API, it is completely customizable to fit any need.
  </p>
  <table>
    <tr>
      <th>Name</th>
      <th>Color</th>
      <th>Size</th>
    </tr>
    <tr>
      <th> Mouse </th>
      <td> Gray </td>
      <td> Small </td>
    </tr>
    <tr>
      <th> Elephant </th>
      <td> Gray </td>
      <td> Large </td>
    </tr>
    <tr>
      <th> Tiger </th>
      <td> Orange and Black </td>
      <td> Medium </td>
    </tr>
  </table>
  <p><br /></p>
</Root>

<style>
  :global(table) {
    width: 100%;
  }
  :global(th, td) {
    padding: 0.5rem;
  }
  :global(th) {
    text-align: left;
    font-weight: bold;
  }
  :global(th) {
    background-color: #f5f5f5;
  }
</style>
