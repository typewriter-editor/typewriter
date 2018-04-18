const SOURCE_USER = 'user';
const lastWord = /\w+[^\w]*$/;
const firstWord = /^[^\w]*\w+/;
const lastLine = /[^\n]*$/;
const firstLine = /^[^\n]*/;

// Basic text input module. Prevent any actions other than typing characters and handle with the API.
export default function input(view) {
  const editor = view.editor;

  function onEnter(event, shortcut) {
    if (event.defaultPrevented) return;
    event.preventDefault();
    let [ from, to ] = editor.getSelectedRange();

    if (shortcut === 'Shift+Enter') {
      editor.insertText(from, to, '\r', null, SOURCE_USER);
    } else {
      const line = editor.contents.getLine(from);
      let attributes = line.attributes;
      const block = view.dom.blocks.find(attributes);
      const isDefault = !block;
      const length = line.contents.length();
      if (isDefault || block.defaultFollows) {
        attributes = {};
      }
      if (!length && !block.defaultFollows && !isDefault && from === to) {
        editor.formatLine(from, to, {}, SOURCE_USER);
      } else {
        let selection = from + 1;
        if (from === to && from === line.endIndex - 1) {
          from++;
          to++;
        }
        editor.insertText(from, to, '\n', attributes, SOURCE_USER, selection);
      }
    }
  }

  function onBackspace(event, shortcut) {
    if (event.defaultPrevented) return;
    event.preventDefault();

    let [ from, to ] = editor.selection;
    if (from + to === 0) {
      const line = editor.contents.getLine(from);
      const block = view.dom.blocks.find(line.attributes);
      if (block) editor.formatLine(0, {}, SOURCE_USER);
    } else {
      // The "from" block needs to stay the same. The "to" block gets merged into it
      if (from === to) {
        if (shortcut === 'Alt+Backspace' && view.isMac) {
          const match = editor.getText().slice(0, from).match(lastWord);
          if (match) from -= match[0].length;
        } else if (shortcut === 'Cmd+Backspace' && view.isMac) {
          const match = editor.getText().slice(0, from).match(lastLine);
          if (match) from -= match[0].length;
        } else {
          const line = editor.contents.getLine(from);
          if (from === line.startIndex) {
            const block = view.dom.blocks.find(line.attributes);
            if (block && !block.defaultFollows) {
              const prevLine = editor.contents.getLine(line.startIndex - 1);
              const prevBlock = prevLine && view.dom.blocks.find(prevLine.attributes);
              if (block !== prevBlock) {
                editor.formatLine(from, {}, SOURCE_USER);
                return;
              }
            }
          }

          from--;
        }
      }
      editor.deleteText(from, to, SOURCE_USER);
    }
  }

  function onDelete(event, shortcut) {
    if (event.defaultPrevented) return;
    event.preventDefault();

    let [ from, to ] = editor.selection;
    if (from === to && from === editor.length) return;

    if (from === to) {
      if (shortcut === 'Alt+Delete' && view.isMac) {
        const match = editor.getText().slice(from).match(firstWord);
        if (match) to += match[0].length;
      } else {
        to++;
      }
    }
    editor.deleteText(from, to, SOURCE_USER);
  }

  view.on('shortcut:Enter', onEnter);
  view.on('shortcut:Shift+Enter', onEnter);
  view.on('shortcut:Backspace', onBackspace);
  view.on('shortcut:Alt+Backspace', onBackspace);
  view.on('shortcut:Cmd+Backspace', onBackspace);
  view.on('shortcut:Delete', onDelete);
  view.on('shortcut:Alt+Delete', onDelete);
}
