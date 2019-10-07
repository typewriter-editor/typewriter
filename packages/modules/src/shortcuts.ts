import { shortcutFromEvent } from '@typewriter/view';
import { Editor } from '@typewriter/editor';
const isMac = navigator.userAgent.indexOf('Macintosh') !== -1;
const modExpr = isMac ? /Cmd/ : /Ctrl/;

export function shortcuts(options?: {bubbles?: boolean}) {

  return function(editor: Editor, root: HTMLElement) {

    function onKeyDown(event: KeyboardEvent) {
      var shortcut = shortcutFromEvent(event);
      // Don't dispatch events for every character typed
      if (shortcut.length <= 1) return;

      var canceled = false;
      var init = {
        detail: shortcut,
        cancelable: true,
        bubbles: options && options.bubbles
      };
      var os = isMac ? 'mac' : 'win';
      var osSpecificEvent = new CustomEvent('shortcut:' + os + ':' + shortcut, init);
      var specificEvent = new CustomEvent('shortcut:' + shortcut, init);
      var generalEvent = new CustomEvent('shortcut', init);
      root.dispatchEvent(osSpecificEvent);
      root.dispatchEvent(specificEvent);
      root.dispatchEvent(generalEvent);
      canceled = osSpecificEvent.defaultPrevented || specificEvent.defaultPrevented || generalEvent.defaultPrevented;

      if (modExpr.test(shortcut)) {
        init.detail = shortcut.replace(modExpr, 'Mod');
        specificEvent = new CustomEvent('shortcut:' + init.detail, init);
        generalEvent = new CustomEvent('shortcut', init);
        root.dispatchEvent(specificEvent);
        root.dispatchEvent(generalEvent);
        canceled = canceled || specificEvent.defaultPrevented || generalEvent.defaultPrevented;
      }

      if (canceled) {
        // Prevent the original keydown if the shortcut event called preventDefault
        event.preventDefault();
      }
    }

    root.addEventListener('keydown', onKeyDown);

    return {
      options,
      onDestroy() {
        root.removeEventListener('keydown', onKeyDown);
      }
    };
  }
}
