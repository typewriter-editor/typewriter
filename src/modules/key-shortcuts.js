const SOURCE_USER = 'user';


export const keymap = {
  'Mod+B': editor => editor.toggleTextFormat(editor.selection, { bold: true }, SOURCE_USER),
  'Mod+I': editor => editor.toggleTextFormat(editor.selection, { italic: true }, SOURCE_USER),
  'Mod+1': editor => editor.toggleLineFormat(editor.selection, { header: 1 }, SOURCE_USER),
  'Mod+2': editor => editor.toggleLineFormat(editor.selection, { header: 2 }, SOURCE_USER),
  'Mod+3': editor => editor.toggleLineFormat(editor.selection, { header: 3 }, SOURCE_USER),
  'Mod+4': editor => editor.toggleLineFormat(editor.selection, { header: 4 }, SOURCE_USER),
  'Mod+5': editor => editor.toggleLineFormat(editor.selection, { header: 5 }, SOURCE_USER),
  'Mod+6': editor => editor.toggleLineFormat(editor.selection, { header: 6 }, SOURCE_USER),
  'Mod+0': editor => editor.formatLine(editor.selection, { }, SOURCE_USER),
};

export const macKeymap = { ...keymap };

// Basic text input module. Prevent any actions other than typing characters and handle with the API.
export default function keyShortcuts(customShortcuts = {}) {
  return view => {
    const shortcuts = { ...(view.isMac ? macKeymap : keymap), ...customShortcuts };
    const editor = view.editor;

    function onShortcut(event, shortcut) {
      if (event.defaultPrevented) return;
      if (shortcut in shortcuts) {
        event.preventDefault();
        shortcuts[shortcut](editor);
      }
    }

    view.on('shortcut', onShortcut);

    return {
      destroy() {
        view.off('shortcut', onShortcut);
      }
    }
  };
}
