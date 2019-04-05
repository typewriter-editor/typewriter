<div bind:this={root} class={className || ''} contenteditable={!disabled}>
  <EditorContents {root} {editor} {paper} {modules} bind:api bind:getBounds/>
</div>

<svelte:options accessors/>
<script>
import EditorContents from './EditorContents.svelte';

let className = null;
export { className as class };
export let disabled = false;
export let api = {};
export let editor;
export let paper;
export let modules = {};
export let root = null;
export let getBounds = null;
</script>
