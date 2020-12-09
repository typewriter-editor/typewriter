const modifierKeys = {
  Control: true,
  Meta: true,
  Shift: true,
  Alt: true
};
const isMac = navigator.userAgent.indexOf('Macintosh') !== -1;

/**
 * Returns the textual representation of a shortcut given a keyboard event. Examples of shortcuts:
 * Cmd+L
 * Cmd+Shift+M
 * Ctrl+O
 * Backspace
 * T
 * Right
 * Shift+Down
 * Shift+F1
 * Space
 */
export function shortcutFromEvent(event) {
  const shortcutArray: string[] = [];
  let key = event.key;
  if (!key) return '';
  if (key === ' ') key = 'Space';

  if (event.metaKey) shortcutArray.push('Cmd');
  if (event.ctrlKey) shortcutArray.push('Ctrl');
  if (event.altKey) shortcutArray.push('Alt');
  if (event.shiftKey) shortcutArray.push('Shift');

  if (!modifierKeys[key]) {
    if (isMac && event.altKey && event.code && event.code.startsWith('Key')) {
      // The altKey on mac can change the key value (e.g. Cmd+Alt+R will show up as Cmd+Alt+® if we don't do this)
      key = event.code.replace('Key', '');
    }
    // a and A, b and B, should be the same shortcut

    if (key.length === 1) key = key.toUpperCase();
    shortcutArray.push(key);
  }

  return shortcutArray.join('+');
}
