import { Editor } from '@typewriter/editor';
import { Paper } from '@typewriter/view';
import HoverMenu from '../ui/HoverMenu.svelte';


export function hoverMenu() {

  return function(editor: Editor, root: HTMLElement, paper: Paper) {
    let menu: any = null, mousedown = false;

    function show(range = editor.selection) {
      if (!menu) {
        menu = new HoverMenu({
          target: root.parentNode as HTMLElement,
          props: { editor, root, paper, range },
        });
        if (menu.items.length) {
          requestAnimationFrame(() => menu && (menu.active = true));
        }
      } else {
        menu.range = range;
      }
    }

    function hide() {
      if (menu) {
        menu.$destroy();
        menu = null;
      }
    }

    function update() {
      const selection = editor.selection;
      const validSelection = selection && selection[0] !== selection[1];
      const inputMode = menu && menu.inputMode;
      if (!validSelection || !root.contentEditable) {
        if (!inputMode) hide();
        return;
      }
      show();
    }

    function onEditorChange() {
      if (!mousedown) update();
    }

    function onMouseDown() {
      root.ownerDocument && root.ownerDocument.addEventListener('mouseup', onMouseUp);
      mousedown = true;
    }

    function onMouseUp() {
      mousedown = false;
      setTimeout(update);
    }

    editor.on('editor-change', onEditorChange);
    root.addEventListener('mousedown', onMouseDown);

    return {
      show,
      hide,
      onDestroy() {
        editor.off('editor-change', onEditorChange);
        root.removeEventListener('mousedown', onMouseDown);
        root.ownerDocument && root.ownerDocument.removeEventListener('mouseup', onMouseUp);
        hide();
      }
    }
  }
}
