import Editor from './Editor';
import { docFromDom } from './rendering/html';

// A svelte action to set the root for your Editor to an element. E.g.
// <div class="my-editor" use:asRoot={myEditor}></div>
export default function asRoot(root: HTMLElement, editor: Editor) {

  function update(newEditor: Editor) {
    if (editor !== newEditor) destroy();
    if (newEditor) newEditor.setRoot(root);
    editor = newEditor;
  }

  if (root.children.length) {
    editor.set(docFromDom(editor, root));
  }

  update(editor);

  function destroy() {
    if (editor) editor.destroy();
  }

  return { update, destroy };
}
