<script>
import { tick } from 'svelte';
import { Editor } from '@typewriter/editor';
import { getDefaultPaper, getBounds } from '@typewriter/view';
import { EditorView } from '@typewriter/view-svelte';
import { shortcuts, input, history, keyShortcuts, smartEntry, smartQuotes } from '@typewriter/modules';

export let editor;
export let paper;
export let modules;

let view;
let selection = editor.selection;
let selectionBox = null;

editor.on('selection-change', () => selection = editor.selection);

$: updateBox(selection);

async function updateBox(selection) {
  await tick();
  selectionBox = selection ? view.getBounds() : null;
}

function outputBox(box) {
  if (!box) return null;
  return `left: ${box.left}, top: ${box.top}, width: ${box.width}, height: ${box.height}`;
}

</script>
<svelte:options accessors/>

<div class="container">
  <EditorView bind:this={view} {editor} {paper} {modules} class="typewriter-editor" />

  <p>
    <em>Selection: {selection}</em><br>
    <em>Box: {outputBox(selectionBox)}</em>
  </p>
</div>

<style>
.container {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  height: 100%;
}
:global(.typewriter-editor) {
  flex: 1 1;
  padding: .375rem .75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
  border: 1px solid #ced4da;
  border-radius: .25rem;
  box-sizing: border-box;
  height: calc(100vh - 20px - 68px);
  overflow: auto;
  transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}
:global(.typewriter-editor:focus) {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, .25);
}
:global(.typewriter-editor p) {
  contain: layout;
}
</style>
