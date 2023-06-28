<script>
import { Editor, h } from 'typewriter-editor';
import Root from 'typewriter-editor/lib/Root.svelte';

const editor = window.editor = new Editor({
  types: {
    lines: [ 'paragraph', 'header', 'list', 'blockquote', 'code-block', 'hr', 'dl' ],
    embeds: ['br']
  },
});

</script>

<div class="description">
  <h1>Description Lists</h1>
  <p>
    Work with description lists
  </p>
</div>

<Root {editor} class="text-content">
  <h2>Typewriter</h2>
  <p>
    Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
    expressive API, it is completely customizable to fit any need.
  </p>
  <dl>
    <dt>Age</dt>
    <dd>21</dd>
  </dl>
</Root>

<style>
  :global(dl) {
    tab-size: 20;
  }
  :global(dl > div) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  :global(dl dt) {
    display: flex;
    grid-column: 1 / 2;
    font-weight: bold;
    margin-right: 4px;
  }
  :global(dl dt:has(br:only-child)) {
    display: block;
    background: linear-gradient(to bottom, transparent, transparent 1em, #eee 1em, #eee calc(1em + 1px), transparent calc(1em + 1px)) no-repeat 100% 0;
    background-size: calc(100% - 4px) 100%;
  }
  :global(dl dt:not(:has(br:only-child))::after) {
    content: '';
    flex: 1 1;
    margin-left: 2px;
    background: linear-gradient(to bottom, transparent, transparent 1em, #eee 1em, #eee calc(1em + 1px), transparent calc(1em + 1px));
    pointer-events: none;
  }
  :global(dl dd) {
    grid-column: 2 / 3;
    margin: 0;
  }
</style>
