<script>
import { Editor, smartEntry, smartQuotes } from 'typewriter-editor';
import Root from 'typewriter-editor/lib/Root.svelte';

const editor = window.editor = new Editor({
  modules: { smartEntry: smartEntry(), smartQuotes }
});
</script>
<style>
  :global(ul[type="dash"]) {
    list-style-type: "– ";
  }
</style>

<div class="description">
  <h1>Smart Entry</h1>
  <p>
    Try typing <code>* </code> (an asterisk and a space), a double dash, or quotes!
  </p>
</div>

<Root {editor} class="text-content">
  <h1>Smart Entry</h1>
  <p>
    Try typing <code>* </code> (an asterisk and a space) or a double dash!
  </p>
  <p><br></p>
</Root>
