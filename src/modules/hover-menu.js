import HoverMenu from '../ui/HoverMenu.html';

export default function hoverMenu() {

  return view => {
    const editor = view.editor;
    let menu, mousedown = false;


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

    function update() {
      const selection = editor.selection;
      const validSelection = selection && selection[0] !== selection[1];
      const inputMode = menu && menu.get().inputMode;
      if (!validSelection || !view.enabled) {
        if (!inputMode) hide();
        return;
      }
      show();
    }

    function onEditorChange() {
      if (!mousedown) update();
    }

    function onMouseDown() {
      view.root.ownerDocument.addEventListener('mouseup', onMouseUp);
      mousedown = true;
    }

    function onMouseUp() {
      mousedown = false;
      update();
    }

    editor.on('editor-change', onEditorChange);
    view.root.addEventListener('mousedown', onMouseDown);

    return {
      show,
      hide,
      destroy() {
        editor.off('editor-change', onEditorChange);
        view.root.removeEventListener('mousedown', onMouseDown);
        view.root.ownerDocument.removeEventListener('mouseup', onMouseUp);
        hide();
      }
    }
  }
}
