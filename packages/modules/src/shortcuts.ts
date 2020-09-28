import { shortcutFromEvent } from '@typewriter/view';
import { Editor } from '@typewriter/editor';
const isMac = navigator.userAgent.indexOf('Macintosh') !== -1;
const modExpr = isMac ? /Cmd/ : /Ctrl/;

export interface KeyboardEventWithShortcut extends KeyboardEvent {
  shortcut?: string;
  osShortcut?: string;
  modShortcut?: string;
}


export function shortcuts(options?: {bubbles?: boolean}) {

  return function(editor: Editor, root: HTMLElement) {

    function onKeyDown(event: KeyboardEventWithShortcut) {
      event.shortcut = shortcutFromEvent(event);
      event.osShortcut = `${isMac ? 'mac' : 'win'}:${event.shortcut}`;
      event.modShortcut = event.shortcut.replace(modExpr, 'Mod');
    }

    root.addEventListener('keydown', onKeyDown, true);

    return {
      options,
      onDestroy() {
        root.removeEventListener('keydown', onKeyDown, true);
      }
    };
  }
}
