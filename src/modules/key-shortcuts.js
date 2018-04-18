const SOURCE_USER = 'user';


export const keymap = {
  'Ctrl+B': editor => editor.toggleTextFormat(editor.selection, { bold: true }, SOURCE_USER),
  'Ctrl+I': editor => editor.toggleTextFormat(editor.selection, { italics: true }, SOURCE_USER),
  'Ctrl+1': editor => editor.toggleLineFormat(editor.selection, { header: 1 }, SOURCE_USER),
  'Ctrl+2': editor => editor.toggleLineFormat(editor.selection, { header: 2 }, SOURCE_USER),
  'Ctrl+3': editor => editor.toggleLineFormat(editor.selection, { header: 3 }, SOURCE_USER),
  'Ctrl+4': editor => editor.toggleLineFormat(editor.selection, { header: 4 }, SOURCE_USER),
  'Ctrl+5': editor => editor.toggleLineFormat(editor.selection, { header: 5 }, SOURCE_USER),
  'Ctrl+6': editor => editor.toggleLineFormat(editor.selection, { header: 6 }, SOURCE_USER),
  'Ctrl+0': editor => editor.formatLine(editor.selection, { }, SOURCE_USER),
};

export const macKeymap = {
  'Cmd+B': keymap['Ctrl+B'],
  'Cmd+I': keymap['Ctrl+I'],
  'Cmd+1': keymap['Ctrl+1'],
  'Cmd+2': keymap['Ctrl+2'],
  'Cmd+3': keymap['Ctrl+3'],
  'Cmd+4': keymap['Ctrl+4'],
  'Cmd+5': keymap['Ctrl+5'],
  'Cmd+6': keymap['Ctrl+6'],
  'Cmd+0': keymap['Ctrl+0'],
};

// Basic text input module. Prevent any actions other than typing characters and handle with the API.
export default function keyShortcuts(view) {
  const editor = view.editor;

  view.on('shortcut', (event, shortcut) => {
    if (event.defaultPrevented) return;
    const map = view.isMac ? macKeymap : keymap;

    if (shortcut in map) {
      event.preventDefault();
      map[shortcut](editor);
    }
  });
}
