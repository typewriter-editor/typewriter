<script>
import { onMount } from 'svelte';
import { Editor } from 'typewriter-editor';
import asRoot from 'typewriter-editor/lib/asRoot';
import BubbleMenu from 'typewriter-editor/lib/BubbleMenu.svelte';

const editor = window.editor = new Editor();

onMount(() => {
  editor.select([ 55, 61 ]);
});
</script>

<div class="description">
  <h1>Bubble Menu</h1>
  <p>
    Create a popup menu to display when text is selected without worrying about positioning.
  </p>
</div>

<BubbleMenu {editor} let:active let:commands let:placement placement="bottom-end">
  <div class="menu">
    <div data-arrow class="arrow {placement}"></div>
    <button
      class="menu-button"
      class:active={active.header === 2}
      on:click={commands.header2}
    >
      <i class="material-icons">title</i>
    </button>

    <button
      class="menu-button header3"
      class:active={active.header === 3}
      on:click={commands.header3}
    >
      <i class="material-icons">title</i>
    </button>

    <button
      class="menu-button"
      class:active={active.bold}
      on:click={commands.bold}
    >
      <i class="material-icons">format_bold</i>
    </button>

    <button
      class="menu-button"
      class:active={active.italic}
      on:click={commands.italic}
    >
      <i class="material-icons">format_italic</i>
    </button>
 </div>
</BubbleMenu>

<div use:asRoot={editor} class="text-content">
  <h2>Typewriter</h2>
  <p>
    Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
    expressive API, it is completely customizable to fit any need.
  </p>
  <h3>Choose which element is your root</h3>
  <pre><code>&lt;script&gt;</code>
    <code>import &lbrace; Editor, asRoot, BubbleMenu &rbrace; from 'typewriter-editor';</code>
    <code>import asRoot from 'typewriter-editor/lib/asRoot';</code>
    <code>import BubbleMenu from 'typewriter-editor/lib/BubbleMenu.svelte';</code>
    <code></code>
    <code>// Open your browser's developer console to try out the API!</code>
    <code>&lt;BubbleMenu &lbrace;editor&rbrace; let:active let:commands let:placement&gt;</code>
    <code>&nbsp; &lt;div class="menu"&gt;</code>
    <code>&nbsp; &nbsp; &lt;div data-arrow class="arrow &lbrace;placement}"&gt;&lt;/div&gt;</code>
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
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.bold&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.bold&rbrace;&gt;B&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &nbsp; &lt;button</code>
    <code>&nbsp; &nbsp; &nbsp; class="menu-button"</code>
    <code>&nbsp; &nbsp; &nbsp; class:active=&lbrace;active.italic&rbrace;</code>
    <code>&nbsp; &nbsp; &nbsp; on:click=&lbrace;commands.italic&rbrace;&gt;I&lt;/button&gt;</code>
    <code></code>
    <code>&nbsp; &lt;/div&gt;</code>
    <code>&lt;/BubbleMenu&gt;</code>
    <code></code>
    <code>&lt;div use:asRoot=&lbrace;editor&rbrace;&gt;&lt;/div&gt;</code>
  </pre>
</div>

<style>
.menu {
  display: flex;
  align-items: baseline;
  height: 42px;
  background-image: linear-gradient(to bottom, rgba(49, 49, 47, .99), #262625);
  border-radius: 5px;
  z-index: 100;
  white-space: nowrap;
  animation: pop-upwards 180ms forwards linear;
}
.menu-button {
  height: 42px;
  width: 42px;
  text-align: center;
  border: none;
  margin: 0;
  color: #fff;
  background: none;
  outline: none;
  cursor: pointer;
}
.menu-button:first-child {
  padding-left: 14px;
}
.menu-button:last-child {
  padding-right: 14px;
}
.menu-button.active .material-icons {
  color: #74b6ff;
}
.material-icons {
  font-size: 24px;
}
.header3 .material-icons {
  font-size: 18px;
}

:global(.bubble-menu.active) {
  transition: all 75ms ease-out;
}
.arrow {
  display: block;
  border: 6px solid transparent;
}
.arrow.top {
  bottom: -12px;
  border-top-color: #262625;
}
.arrow.bottom {
  top: -12px;
  border-bottom-color: rgba(49, 49, 47, .99);
}

@keyframes pop-upwards {
  0% {
    transform: matrix(.97, 0, 0, 1, 0, 12);
    opacity: 0
  }
  20% {
    transform: matrix(.99, 0, 0, 1, 0, 2);
    opacity: .7
  }
  40% {
    transform: matrix(1, 0, 0, 1, 0, -1);
    opacity: 1
  }
  70% {
    transform: matrix(1, 0, 0, 1, 0, 0);
    opacity: 1
  }
  100% {
    transform: matrix(1, 0, 0, 1, 0, 0);
    opacity: 1
  }
}
</style>
