<script>
import { Editor, h } from 'typewriter-editor';
import { options } from 'typewriter-editor/lib/rendering/vdom';
import Root from 'typewriter-editor/lib/Root.svelte';

options.renderKeys = true;
window.h = h;
const editor = window.editor = new Editor();
</script>

<div class="description">
  <h1>Basic</h1>
  <p>
    This is the editor without any user interface or advanced modules. Get and modify the contents
    via the <code>editor</code> object in the browser console.
  </p>
  <p>Try:</p>
  <ul>
    <li><code>editor.getHTML()</code></li>
    <li><code>editor.setHTML('&lt;h2&gt;Hello World&lt;/h2&gt;&lt;p&gt;Pleased to meet you.&lt;/p&gt;')</code></li>
    <li><code>editor.getText()</code></li>
    <li><code>editor.getDelta()</code></li>
    <li><code>editor.select([ 13, 25 ])</code></li>
    <li><code>editor.commands.bold()</code></li>
    <li><code>editor.commands.undo()</code></li>
  </ul>
</div>

<Root {editor} class="text-content">
  <h2>Typewriter</h2>
  <p>
    Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
    expressive API, it is completely customizable to fit any need.
  </p>
  <h3>Getting Started is Easy</h3>
  <pre>
    <code>&lt;script&gt;</code>
    <code>import &lbrace; Editor } from 'typewriter-editor';</code>
    <code>import Root from 'typewriter-editor/lib/Root.svelte';</code>
    <code><br></code>
    <code>// Open your browser's developer console to try out the API.</code>
    <code>// The editor has been added to the global scope in these examples.</code>
    <code>const editor = window.editor = new Editor();</code>
    <code>&lt;/script&gt;</code>
    <code><br></code>
    <code>&lt;Root &lbrace;editor}&gt;</code>
    <code>&nbsp; &lt;h2&gt;Hello World&lt;/h2&gt;</code>
    <code>&nbsp; &lt;p&gt;This is optional default content&lt;/p&gt;</code>
    <code>&lt;/Root&gt;</code>
  </pre>
</Root>
