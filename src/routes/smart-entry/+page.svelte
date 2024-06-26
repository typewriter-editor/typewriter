<script lang="ts">
  import { Editor, Root, smartEntry, smartQuotes } from '$lib';

  const editor = (globalThis.editor = new Editor({
    modules: { smartEntry: smartEntry(), smartQuotes },
  }));
</script>

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
  <p><br /></p>
</Root>

<style>
  :global(ul[type='dash']) {
    list-style-type: '– ';
  }
</style>
