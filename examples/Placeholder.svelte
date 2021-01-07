<script>
  import { Editor, placeholder } from 'typewriter-editor';
  import asRoot from 'typewriter-editor/lib/asRoot';

  let alignment = 'left';
  let valignment = 'top';

  const editor = window.editor = new Editor({
    modules: {
      placeholder: placeholder('Write here...')
    }
  });

  editor.select(0);

  function align(value) {
    alignment = value;
    editor.root.focus();
  }

  function valign(value) {
    valignment = value;
    editor.root.focus();
  }

</script>

<div class="description">
  <h1>Placeholder Module</h1>
  <p>
    Provide a placeholder in an empty text area. And ensure it works with various text alignments.
  </p>
</div>

<div class="align-buttons">
  <button class:active={alignment === 'left'} on:click={() => align('left')}>Left</button>
  <button class:active={alignment === 'center'} on:click={() => align('center')}>Center</button>
  <button class:active={alignment === 'right'} on:click={() => align('right')}>Right</button>
</div>

<div class="content-area">
  <div
    class="text-content"
    class:center={alignment === 'center'}
    class:right={alignment === 'right'}
    class:middle={valignment === 'middle'}
    class:bottom={valignment === 'bottom'}
    use:asRoot={editor}
  ></div>

  <div class="valign-buttons">
    <button class:active={valignment === 'top'} on:click={() => valign('top')}>Top</button>
    <button class:active={valignment === 'middle'} on:click={() => valign('middle')}>Middle</button>
    <button class:active={valignment === 'bottom'} on:click={() => valign('bottom')}>Bottom</button>
  </div>
</div>

<style>
.text-content :global(.placeholder) {
  display: block;
  position: relative;
}
.text-content :global(.placeholder::before) {
  position: absolute;
  left: 0;
  right: 0;
  opacity: .5;
  content: attr(data-placeholder);
}
.text-content.center {
  text-align: center;
}
.text-content.right {
  text-align: right;
}
.text-content.middle {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.text-content.bottom {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.content-area {
  position: relative;
}
.align-buttons {
  display: flex;
  justify-content: space-between;
}
.valign-buttons {
  position: absolute;
  top: 0;
  right: -80px;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.active {
  border-color: #80bdff;
  background: #eaf4ff;
}
</style>
