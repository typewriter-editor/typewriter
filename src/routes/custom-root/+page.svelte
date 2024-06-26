<script lang="ts">
  import { Editor, asRoot } from '$lib';

  const editor = (globalThis.editor = new Editor());
</script>

<div class="description">
  <h1>Content Action</h1>
  <p>
    Using an action, you may have complete control over element used as an editor’s root element which displays its
    content.
  </p>
</div>

<div class="text-content" use:asRoot={editor}>
  <h2>Typewriter</h2>
  <p>
    Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
    expressive API, it is completely customizable to fit any need.
  </p>
  <h3>Choose which element displays your content</h3>
  <pre>
      <code>&lt;script&gt;</code>
      <code>import &lbrace; Editor } from 'typewriter-editor';</code>
      <code>import asRoot from 'typewriter-editor/lib/asRoot';</code>
      <code><br /></code>
      <code>// Open your browser's developer console to try out the API!</code>
      <code>const editor = new Editor();</code>
      <code>&lt;/script&gt;</code>
      <code><br /></code>
      <code>&lt;div class="myclass" data-id="extra data" use:asRoot=&lbrace;editor}&gt;</code>
      <code>&nbsp; &lt;h2&gt;Hello World&lt;/h2&gt;</code>
      <code>&nbsp; &lt;p&gt;This is optional default content&lt;/p&gt;</code>
      <code>&lt;/div&gt;</code>
    </pre>
</div>
