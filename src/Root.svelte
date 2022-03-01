<script>
import { onMount } from 'svelte';
import { docFromDom } from './rendering/html';

export let editor;
let className = undefined;
export { className as class };

let root;
let lastEditor;

$: updateEditor(editor, root);

function updateEditor(editor, root) {
  if (!root) return;
  if (lastEditor) {
    lastEditor.destroy();
  }
  lastEditor = editor;
  if (editor) {
    editor.setRoot(root);
  }
}

onMount(() => {
  const old = Array.from(root.childNodes);
  if (editor && root.children.length) {
    editor.set(docFromDom(editor, root));
  }
  return () => {
    for (let i = 0; i < old.length; i++) root.appendChild(old[i]);
  }
})
</script>

<div bind:this={root} class={className}>
  <slot></slot>
</div>
