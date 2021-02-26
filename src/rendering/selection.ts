
import { EditorRange } from '../doc/EditorRange';
import Editor from '../Editor';
import { getIndexFromNodeAndOffset, getNodesForRange } from './position';


/**
 * Get the selection range from the current browser selection
 */
export function getSelection(editor: Editor): EditorRange | null {
  const { root } = editor;
  const current = editor.doc.selection;
  if (!root.ownerDocument) return null;
  const selection = root.ownerDocument.getSelection();

  if (selection == null || selection.anchorNode == null || selection.focusNode == null || !root.contains(selection.anchorNode)) {
    return null;
  } else {
    const anchorIndex = getIndexFromNodeAndOffset(editor, selection.anchorNode, selection.anchorOffset, current && current[0]);
    const isCollapsed = selection.anchorNode === selection.focusNode && selection.anchorOffset === selection.focusOffset;
    // selection.isCollapsed causes a re-layout on Chrome, manual detection does not.
    const focusIndex = isCollapsed ? anchorIndex : getIndexFromNodeAndOffset(editor, selection.focusNode, selection.focusOffset, current && current[1]);

    return [ anchorIndex, focusIndex ];
  }
}

/**
 * Set the current browser selection to the given selection range
 */
export function setSelection(editor: Editor, range: EditorRange | null) {
  const { root } = editor;
  if (!root.ownerDocument) return;
  const selection = root.ownerDocument.getSelection();
  if (!selection) return;
  const hasFocus = selection.anchorNode && root.contains(selection.anchorNode) && document.activeElement !== document.body;

  if (range == null) {
    if (hasFocus) {
      selection.removeAllRanges();
      if (root.classList.contains('focus')) root.classList.remove('focus');
    }
  } else {
    const [ anchorNode, anchorOffset, focusNode, focusOffset ] = getNodesForRange(editor, range);
    const type = range[0] === range[1] ? 'Caret' : 'Range';
    if (anchorNode && focusNode) {
      if (selection.anchorNode !== anchorNode || selection.anchorOffset !== anchorOffset ||
          selection.focusNode !== focusNode || selection.focusOffset !== focusOffset || selection.type !== type)
      {
        selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
      }
    }
    if (!hasFocus) root.focus();
    if (!root.classList.contains('focus')) root.classList.add('focus');
  }
  root.dispatchEvent(new Event('select', { bubbles: true }));
}
