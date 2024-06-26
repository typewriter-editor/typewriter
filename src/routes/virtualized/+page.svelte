<script lang="ts">
  import { asRoot, Editor, virtualRendering } from '$lib';
  import text from './fillerText.txt?raw';

  const editor = (globalThis.editor = new Editor({
    modules: {
      rendering: virtualRendering,
    },
  }));

  setContent();

  function setContent() {
    let content = '';
    // text is 64,840 characters long, ✕100 is almost 6.5 million
    for (let i = 0; i < 100; i++) {
      content += text;
    }
    editor.setText(content);
  }
</script>

<div class="description">
  <h1>Virtualized Editor</h1>
  <p>
    Using virutalization (only rendering what needs to be rendered to work), Typewriter can work well with documents of
    any length. Here is an extreme example, a document with 6.5 million characters. Typing in a document this size would
    have severe performance issues with any other editor.
  </p>
</div>

<div use:asRoot={editor} class="text-content"></div>

<style>
  .text-content {
    height: 500px;
  }
</style>
