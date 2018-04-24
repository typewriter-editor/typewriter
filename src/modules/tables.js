import { h } from '../view/vdom'

const directions = {
  Tab: 'next',
  'Shift+Tab': 'prev',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right'
};

export default function tables(view) {
  const editor = view.editor;

  // TODO add APIs for managing and working with tables


  // Each cell, row, and table is treated as a block with this setup. Gives lots of flexibility, even if it doesn't look
  // as great when exported as text.
  view.paper.blocks.add({
    name: 'table',
    optimize: true,
    selector: 'table, table tr, table tr td, table tr th',
    dom: node => {
      const attributes = {};
      const name = node.nodeName.toLowerCase();
      if (name === 'td' || name === 'th') {
        attributes.table === 'cell';
        // Add other properties that we want
      } else if (name === 'table') {
        attributes.table = 'table';
        // Add other properties that we want
      } else {
        const section = node.parentNode.nodeName.toLowerCase();
        attributes.table = 'row';
        if (section === 'thead' || section === 'tfoot') {
          attributes.section = section;
        }
        // Add other properties that we want
      }
      return attributes;
    },

    vdom: (tableElements) => {
      const tables = [];
      let table;
      let row;
      let section;
      let sections = [];
      let cells = [];

      console.log(tableElements);

      tableElements.forEach((line) => {
        let [children, attr] = line;
        if (attr.table === 'cell') {
          // We will change the td to th when we know the row is a header
          // We don't have any other properties we are tracking yet, but we could add them here too
          const cell = <td>{children}</td>;
          cells.push(cell);
        } else if (attr.table === 'row') {
          const RowSection = attr.section || 'tbody';
          if (!section || section.name !== RowSection) {
            section = <RowSection/>;
            sections.push(section);
          }
          if (section.name === 'thead') cells.forEach(cell => cell.name = 'th');
          // We don't have any other properties we are tracking yet, but we could add them here too
          const row = <tr>{cells}</tr>;
          section.children.push(row);
          // Reset cells for next row
          cells = [];
        } else if (attr.table === 'table') {
          // We don't have any other properties we are tracking yet, but we could add them here too
          const table = <table>{sections}</table>;
          // There might be 2+ tables next to each other. Optimize will pass them all in together
          tables.push(table);
        }
      });

      return tables;
    }
  });


  function selectionInTable() {
    if (!editor.selection) return null;
    const [ from, to ] = editor.getSelectedRange();
    const lines = editor.contents.getLines(from, to);

    // If the selection is AROUND a table we can allow the native interaction I think
    return Boolean(lines.length && (lines[0].attributes.table || !lines[lines.length - 1].attributes.table));
  }


  function onEnter(event) {
    if (event.defaultPrevented) return;

    // Check if the selection is within a table, if so, preventDefault and handle the custom interaction
    if (!selectionInTable()) return;
    event.preventDefault();
  }

  function onSelectionMove(event, shortcut) {
    if (event.defaultPrevented) return;

    // Check if the selection is within a table, if so, preventDefault and move the selection from one cell to another
    if (!selectionInTable()) return;
    event.preventDefault();

    const direction = directions[shortcut];

    // Figure out where that cell is and move there (or outside of the table).
  }

  function onDelete(event) {
    if (event.defaultPrevented) return;

    // Check if the selection is within a table, if so, preventDefault and handle the custom interaction
    if (!selectionInTable()) return;
    event.preventDefault();

  }

  function onBackspace(event) {
    if (event.defaultPrevented) return;

    // Check if the selection is within a table, if so, preventDefault and handle the custom interaction
    if (!selectionInTable()) return;
    event.preventDefault();

  }


  view.on('shortcut:Enter', onEnter);
  view.on('shortcut:Tab', onSelectionMove);
  view.on('shortcut:Shift+Tab', onSelectionMove);
  view.on('shortcut:Delete', onDelete);
  view.on('shortcut:Backspace', onBackspace);
  view.on('shortcut:ArrowUp', onSelectionMove);
  view.on('shortcut:ArrowRight', onSelectionMove);
  view.on('shortcut:ArrowLeft', onSelectionMove);
  view.on('shortcut:ArrowDown', onSelectionMove);


  // API for working with tables. View needs to be updated to do something with the return for modules
  return {

    insertTable(index, columns, rows, options = { header: true, footer: false }) {

      editor.transaction(() => {
        // Insert table separator
        editor.insertText(index++, '\n', { table: 'table' });

        for (let i = 0; i < rows; i++) {
          let attributes;
          const isHeader = options.header && i === rows - 1;

          if (isHeader) attributes = { table: 'row', section: 'thead' };
          else if (options.footer && i === 0) attributes = { table: 'row', section: 'tfoot' };
          else attributes = { table: 'row' };

          // Insert row separators
          editor.insertText(index++, '\n', attributes);

          for (let j = 0; j < columns; j++) {
            // Insert cell separators
            editor.insertText(index++, '\n', { table: 'cell' });
          }
        }
      });
    }
  };
}
