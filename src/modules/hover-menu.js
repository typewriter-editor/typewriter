import HoverMenu from '../ui/HoverMenu.html';

export default function hoverMenu() {

  return view => {
    const editor = view.editor;
    let menu;


    function show(range = editor.selection) {
      if (!menu) {
        menu = new HoverMenu({
          target: view.root.parentNode,
          data: { view, range },
        });
        if (menu.get().items.length) {
          requestAnimationFrame(() => menu.set({ active: true }));
        }
      } else {
        menu.set({ range });
      }
    }

    function hide() {
      if (menu) menu.destroy();
      menu = null;
    }

    function onEditorChange({ selection }) {
      const validSelection = selection && selection[0] !== selection[1];
      const inputMode = menu && menu.get().inputMode;
      if (!validSelection || !view.enabled) {
        if (!inputMode) hide();
        return;
      }
      let [ from, to ] = selection;

      // Don't show when selection goes across lines
      if (from > to) [ from, to ] = [ to, from ];
      if (editor.contents.getLines(from, to).length > 1) return;

      show();
    }


    editor.on('editor-change', onEditorChange);

    return {
      show,
      hide,
      destroy() {
        editor.off('editor-change', onEditorChange);
        hide();
      }
    }
  }
}
