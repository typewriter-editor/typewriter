<script lang="ts">
  import { Editor, Root, Toolbar } from '$lib';

  const editor = (globalThis.editor = new Editor());
</script>

<div class="description">
  <h1>Toolbar</h1>
  <p>Create your own toolbar with the renderless Toolbar component.</p>
</div>

<Toolbar {editor} let:active let:commands>
  <div class="toolbar">
    <button class="toolbar-button material-icons" class:active={active.header === 2} on:click={commands.header2}
      >title</button
    >

    <button class="toolbar-button material-icons header3" class:active={active.header === 3} on:click={commands.header3}
      >title</button
    >

    <button class="toolbar-button material-icons" class:active={active.bold} on:click={commands.bold}
      >format_bold</button
    >

    <button class="toolbar-button material-icons" class:active={active.italic} on:click={commands.italic}
      >format_italic</button
    >

    <button class="toolbar-button material-icons" disabled={!active.undo} on:click={commands.undo}>undo</button>

    <button class="toolbar-button material-icons" disabled={!active.redo} on:click={commands.redo}>redo</button>
  </div>
</Toolbar>

<Root {editor} class="text-content">
  <h2>Typewriter</h2>
  <p>
    Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
    expressive API, it is completely customizable to fit any need.
  </p>
  <h3>Choose which element is your root</h3>
  <pre><code>&lt;script&gt;</code>
    <code>import &lbrace; Editor &rbrace; from 'typewriter-editor';</code>
    <code>import Root from 'typewriter-editor/lib/Root.svelte';</code>
    <code>import Toolbar from 'typewriter-editor/lib/Toolbar.svelte';</code>
    <code></code>
    <code>// Open your browser's developer console to try out the API!</code>
    <code>&lt;Toolbar &lbrace;editor&rbrace; let:active let:commands&gt;</code>
    <code>&nbsp; &lt;div class="toolbar"&gt;</code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="toolbar-button"</code>
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.header === 2&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.header2&rbrace;&gt;H2&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="toolbar-button"</code>
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.header === 3&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.header3&rbrace;&gt;H3&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="toolbar-button"</code>
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.bold&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.bold&rbrace;&gt;B&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="toolbar-button"</code>
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.italic&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.italic&rbrace;&gt;I&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="toolbar-button"</code>
    <code>&nbsp; &nbsp; &nbsp; disabled=&lbrace;!active.undo&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.undo&rbrace;&gt;Undo&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="toolbar-button"</code>
    <code>&nbsp; &nbsp; &nbsp; disabled=&lbrace;!active.redo&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.redo&rbrace;&gt;Redo&lt;/button&gt;</code>
    <code>&nbsp; &lt;/div&gt;</code>
    <code>&lt;/Toolbar&gt;</code>
    <code></code>
    <code>&lt;Root &lbrace;editor&rbrace;/&gt;</code>
  </pre>
</Root>

<style>
  .toolbar {
    display: flex;
    background: #eee;
    padding: 8px;
    margin-bottom: 8px;
    border-radius: 3px;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.3),
      0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    margin: 0;
    width: 40px;
    height: 40px;
    margin-right: 4px;
    border-radius: 4px;
    border: 1px solid #ced4da;
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;
    cursor: pointer;
  }
  .toolbar-button:hover {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  .toolbar-button.active {
    border-color: #80bdff;
    background: #eaf4ff;
  }
  .header3 {
    font-size: 18px;
  }
</style>
