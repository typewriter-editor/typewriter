<script>
import { Editor, fromDelta } from '@typewriter/editor';
import { getDefaultPaper } from '@typewriter/view';
import { shortcuts, input, history, keyShortcuts, smartEntry, smartQuotes, placeholder } from '@typewriter/modules';
import { hoverMenu, HoverMenu } from '@typewriter/ui';
import Frame from './Frame.svelte';
// import Svelte from './Svelte.svelte';
import VDom from './VDom.svelte';

export const editor = new Editor();
const paper = getDefaultPaper();
const modules = {
  shortcuts: shortcuts(),
  input: input(),
  history: history(),
  keyShortcuts: keyShortcuts(),
  smartEntry: smartEntry(),
  smartQuotes: smartQuotes(),
  // placeholder: placeholder('Write here...'),
  hoverMenu: hoverMenu(),
  highlightAs: (editor, root) => {
    const exp = /the/ig;
    function onDecorate(event) {
      const decorators = event.detail;
      const text = editor.getText();
      let match;
      while ((match = exp.exec(text))) {
        decorators.mark(exp.lastIndex - match[0].length, exp.lastIndex, { class: 'highlight' });
      }
      decorators.line(45, { 'data-testing': 123 });
    }
    root.addEventListener('decorate', onDecorate);
    return {
      onDestroy() {
        root.removeEventListener('decorate', onDecorate);
      }
    }
  }
};
const svelteModules = { ...modules, input: input({ forceTextUpdates: true }) };
window.editor = editor;
editor.on('text-change', ({ contents }) => {
  window.blocks = fromDelta(contents);
});

function populate() {
  editor.setContents(editor.delta([
    { insert: 'The Two Towers' },
    { insert: '\n', attributes: { header: 1 } },
    { insert: 'Aragorn sped on up the hill.\n' },
    { insert: 'Gandalf', attributes: { bold: true } },
    { insert: ' the ', attributes: { bold: true, italic: true } },
    { insert: 'Grey', attributes: { italic: true } },
    { insert: '\n' },
    { insert: 'asdf123' },
    { insert: '\n', attributes: { list: 'bullet' } },
    { insert: 'asdf' },
    { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
    { insert: { image: 'https://uploads-ssl.webflow.com/5c3e4c64d1dbdf089664a286/5c3e841bb511dcf520fcc2cd_cabin-sm.jpg', width: 400, alt: 'Cabin' },
      attributes: { link: 'https://github.com/typewriter-editor/typewriter/' } },
    { insert: '\n' },
  ]), 'user');
}

function clear() {
  editor.setContents(editor.delta(), 'user');
}

</script>

<svelte:options accessors/>
<div class="container">
  <p>
    <button on:click={populate}>Populate</button> | <button on:click={clear}>Clear</button>
  </p>
  <p class="help">
    <span class="category">Keyboard shortcuts:</span><br>
    <strong>Headers (1-6 &amp; 0)</strong>: <code>Ctrl+1</code>,
    <strong>Undo</strong>: <code>Ctrl+Z</code>,
    <strong>Indent List</strong>: <code>Tab</code> / <code>Shift+Tab</code>
  </p>
  <p class="help">
    <span class="category">Text entry:</span><br>
    <strong>Bullet List</strong>: <code>* </code> / <code>- </code>,
    <strong>Ordered List</strong>: <code>1._</code> / <code>a._</code> / <code>i._</code> / <code>5._</code>,
    <strong>Headers 1-6</strong>: <code>#_</code> / <code>##_</code>
  </p>

  <h3>Virtual DOM Renderer</h3>
  <Frame component={VDom} {editor} {paper} {modules}/>

  <!-- <h3>Svelte Renderer <small>(experimental)</small></h3>
  <Frame component={Svelte} {editor} {paper} modules={svelteModules}/> -->
</div>

<style>
:global(body) {
  margin: 0;
}
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.container :global(iframe) {
  flex: 1 1;
}
h3 {
  margin-bottom: 0;
}
.help {
  margin: 4px 0;
  font-size: 12px;
}
.help .category {
  font-weight: bold;
  text-decoration: underline;
}
.help code {
  font-family: monospace;
  border: 1px solid #ddd;
  border-radius: 3px;
  background: #f4f4f4;
  font-size: 11px;
  line-height: 1;
  padding: 2px 4px;
}
:global(.placeholder::before) {
  position: absolute;
  content: attr(data-placeholder);
  opacity: 0.5;
}
:global(.highlight) {
  background: yellow;
}
</style>
