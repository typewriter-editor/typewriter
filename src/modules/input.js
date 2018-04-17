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
    const [ from, to ] = editor.getSelectedRange();

    if (shortcut === 'Shift+Enter') {
      editor.insertText(from, to, '\r');
    } else {
      const line = editor.contents.getLine(from);
      editor.insertText([from, to], '\n', line.attributes);
    }
  }

  function onBackspace(event, shortcut) {
    if (event.defaultPrevented) return;
    event.preventDefault();

    let [ from, to ] = editor.selection;
    if (from + to === 0) {
      editor.formatLine(0, {});
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
          from--;
        }
      }
      editor.deleteText([from, to]);
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
    editor.deleteText([from, to]);
  }

  view.on('shortcut:Enter', onEnter);
  view.on('shortcut:Shift+Enter', onEnter);
  view.on('shortcut:Backspace', onBackspace);
  view.on('shortcut:Alt+Backspace', onBackspace);
  view.on('shortcut:Cmd+Backspace', onBackspace);
  view.on('shortcut:Delete', onDelete);
  view.on('shortcut:Alt+Delete', onDelete);
}
