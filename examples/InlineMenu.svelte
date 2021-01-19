<script>
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import { Editor } from 'typewriter-editor';
import Root from 'typewriter-editor/lib/Root.svelte';
import InlineMenu from 'typewriter-editor/lib/InlineMenu.svelte';

const editor = window.editor = new Editor();

onMount(() => {
  editor.select(185);
});
</script>

<div class="description">
  <h1>Inline Menu</h1>
  <p>
    Display a menu when the cursor is in an empty paragraph.
  </p>
</div>

<InlineMenu {editor} let:active let:commands>
  <div class="menu" in:fade={{ duration: 100 }}>
    <button
      class="menu-button"
      class:active={active.header === 1}
      on:click={commands.header1}
    >H1</button>
    <span class="separator"></span>
    <button
      class="menu-button"
      class:active={active.header === 2}
      on:click={commands.header2}
    >H2</button>
    <span class="separator"></span>
    <button
      class="menu-button"
      class:active={active.header === 3}
      on:click={commands.header3}
    >H3</button>
    <span class="separator"></span>
    <button
      class="menu-button"
      class:active={active.header === 4}
      on:click={commands.header4}
    >H4</button>
    <span class="separator"></span>
    <button
      class="menu-button"
      class:active={active.hr}
      on:click={commands.hr}
    >–</button>
 </div>
</InlineMenu>

<Root {editor} class="text-content">
  <h2>Typewriter</h2>
  <p>
    Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
    expressive API, it is completely customizable to fit any need.
  </p>
  <p><br></p>
  <p><br></p>
  <h3>Choose which element is your root</h3>
  <pre><code>&lt;script&gt;</code>
    <code>import &lbrace; Editor, Root, InlineMenu &rbrace; from 'typewriter-editor';</code>
    <code>import Root from 'typewriter-editor/lib/Root.svelte';</code>
    <code>import InlineMenu from 'typewriter-editor/lib/InlineMenu.svelte';</code>
    <code></code>
    <code>// Open your browser's developer console to try out the API!</code>
    <code>&lt;InlineMenu &lbrace;editor&rbrace; let:active let:commands&gt;</code>
    <code>&nbsp; &lt;div class="menu" in:fade=&lbrace;&lbrace; duration: 100 &rbrace;&rbrace;&gt;</code>
    <code>&nbsp; &nbsp; &lt;div data-popper-arrow class="arrow"&gt;&lt;/div&gt;</code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="menu-button"</code>
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.header === 1&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.header1&rbrace;&gt;H1&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &lt;div class="menu"&gt;</code>
    <code>&nbsp; &nbsp; &lt;div data-popper-arrow class="arrow"&gt;&lt;/div&gt;</code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="menu-button"</code>
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.header === 2&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.header2&rbrace;&gt;H2&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="menu-button"</code>
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.header === 3&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.header3&rbrace;&gt;H3&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="menu-button"</code>
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.header === 4&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.header4&rbrace;&gt;H4&lt;/button&gt;</code>
    <code>&nbsp; &lt;/div&gt;</code>
    <code>&lt;/InlineMenu&gt;</code>
    <code></code>
    <code>&lt;Root &lbrace;editor&rbrace;/&gt;</code>
    <code></code>
    <code>&lt;style&gt;</code>
    <code>&nbsp; .menu &lbrace;</code>
    <code>&nbsp; &nbsp; position: absolute;</code>
    <code>&nbsp; &nbsp; display: flex;</code>
    <code>&nbsp; &nbsp; z-index: 100;</code>
    <code>&nbsp; &nbsp; height: 32px;</code>
    <code>&nbsp; &nbsp; color: #666;</code>
    <code>&nbsp; &nbsp; white-space: nowrap;</code>
    <code>&nbsp; }</code>
    <code>&nbsp; .menu-button &lbrace;</code>
    <code>&nbsp; &nbsp; text-align: center;</code>
    <code>&nbsp; &nbsp; border: none;</code>
    <code>&nbsp; &nbsp; margin: 0;</code>
    <code>&nbsp; &nbsp; padding: 0;</code>
    <code>&nbsp; &nbsp; width: 48px;</code>
    <code>&nbsp; &nbsp; height: 32px;</code>
    <code>&nbsp; &nbsp; line-height: 32px;</code>
    <code>&nbsp; &nbsp; color: #777;</code>
    <code>&nbsp; &nbsp; font-size: 12px;</code>
    <code>&nbsp; &nbsp; background: none;</code>
    <code>&nbsp; &nbsp; outline: none;</code>
    <code>&nbsp; &nbsp; cursor: pointer;</code>
    <code>&nbsp; }</code>
    <code>&nbsp; .menu-button:hover &lbrace;</code>
    <code>&nbsp; &nbsp; color: #444;</code>
    <code>&nbsp; }</code>
    <code>&nbsp; .separator &lbrace;</code>
    <code>&nbsp; &nbsp; height: 16px;</code>
    <code>&nbsp; &nbsp; margin: 8px 0;</code>
    <code>&nbsp; &nbsp; border-right: 1px solid #999;</code>
    <code>&nbsp; }</code>
    <code>&lt;/style&gt;</code>
  </pre>
</Root>

<style>
.menu {
  display: flex;
  height: 32px;
  color: #999;
  white-space: nowrap;
}
.menu-button {
  text-align: center;
  border: none;
  margin: 0;
  padding: 0;
  width: 48px;
  height: 32px;
  line-height: 32px;
  color: inherit;
  font-size: 12px;
  background: none;
  outline: none;
  cursor: pointer;
}
.menu-button:hover {
  color: #444;
}
.separator {
  height: 16px;
  margin: 8px 0;
  border-right: 1px solid #aaa;
}
</style>
