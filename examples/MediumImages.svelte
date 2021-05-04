<script>
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import { Editor, h } from 'typewriter-editor';
import asRoot from 'typewriter-editor/lib/asRoot';
import InlineMenu from 'typewriter-editor/lib/InlineMenu.svelte';
import BubbleMenu from 'typewriter-editor/lib/BubbleMenu.svelte';

const editor = window.editor = new Editor();
editor.typeset.embeds.remove('image');
editor.typeset.lines.add({
  name: 'image',
  selector: 'div.image',
  frozen: true,
  fromDom: (node) => {
    const attr = { image: node.firstElementChild.src, alt: node.firstElementChild.alt };
    if (node.dataset.style) attr.style = node.dataset.style;
    return attr;
  },
  render: (attributes) => h('div', { class: 'image', 'data-style': attributes.style }, [
    h('img', { src: attributes.image, alt: attributes.alt }),
  ]),
});

onMount(() => {
  editor.select([ 190, 191 ]);
});
</script>

<!-- General text editing menu -->
<BubbleMenu {editor} let:active let:commands let:placement offset={8}>
  <div class="bubble-menu">
    <div data-arrow class="arrow {placement}"></div>
    <button
      class="bubble-menu-button"
      class:active={active.header === 2}
      on:click={commands.header2}
    >
      <i class="material-icons">title</i>
    </button>

    <button
      class="bubble-menu-button header3"
      class:active={active.header === 3}
      on:click={commands.header3}
    >
      <i class="material-icons">title</i>
    </button>

    <button
      class="bubble-menu-button"
      class:active={active.bold}
      on:click={commands.bold}
    >
      <i class="material-icons">format_bold</i>
    </button>

    <button
      class="bubble-menu-button"
      class:active={active.italic}
      on:click={commands.italic}
    >
      <i class="material-icons">format_italic</i>
    </button>
 </div>
</BubbleMenu>

<!-- Inline menu to show on empty lines -->
<InlineMenu {editor} let:active let:commands>
  <div class="inline-menu" in:fade={{ duration: 100 }}>
    <button
      class="inline-menu-button"
      class:active={active.header === 1}
      on:click={commands.header1}
    >H1</button>
    <span class="separator"></span>
    <button
      class="inline-menu-button"
      class:active={active.header === 2}
      on:click={commands.header2}
    >H2</button>
    <span class="separator"></span>
    <button
      class="inline-menu-button"
      class:active={active.header === 3}
      on:click={commands.header3}
    >H3</button>
    <span class="separator"></span>
    <button
      class="inline-menu-button"
      class:active={active.header === 4}
      on:click={commands.header4}
    >H4</button>
    <span class="separator"></span>
    <button
      class="inline-menu-button"
      class:active={active.hr}
      on:click={commands.hr}
    >–</button>
 </div>
</InlineMenu>

<!-- Image menu for when images are selected -->
<BubbleMenu {editor} let:active let:commands let:placement offset={8} for={'image'}>
  <div class="bubble-menu">
    <div data-arrow class="arrow {placement}"></div>
    <button
      class="bubble-menu-button"
      class:active={active.style === 'outset-left'}
      on:click={() => editor.formatLine({ ...editor.doc.getLineFormat(), style: 'outset-left' })}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <rect fill="none" width="24" height="24"/>
        <path d="M22,19 L22,21 L7,21 L7,19 L22,19 Z M22,15 L22,17 L16,17 L16,15 L22,15 Z M14,7 L14,17 L2,17 L2,7 L14,7 Z M22,11 L22,13 L16,13 L16,11 L22,11 Z M22,7 L22,9 L16,9 L16,7 L22,7 Z M22,3 L22,5 L7,5 L7,3 L22,3 Z"></path>
      </svg>
    </button>

    <button
      class="bubble-menu-button header3"
      class:active={!active.style}
      on:click={() => editor.formatLine({ ...editor.doc.getLineFormat(), style: null })}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <rect fill="none" width="24" height="24"/>
        <path d="M19,19 L19,21 L5,21 L5,19 L19,19 Z M19,7 L19,17 L5,17 L5,7 L19,7 Z M19,3 L19,5 L5,5 L5,3 L19,3 Z"></path>
      </svg>
    </button>

    <button
      class="bubble-menu-button"
      class:active={active.style === 'outset-center'}
      on:click={() => editor.formatLine({ ...editor.doc.getLineFormat(), style: 'outset-center' })}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <rect fill="none" width="24" height="24"/>
        <path d="M19,19 L19,21 L5,21 L5,19 L19,19 Z M21,7 L21,17 L3,17 L3,7 L21,7 Z M19,3 L19,5 L5,5 L5,3 L19,3 Z"></path>
      </svg>
    </button>

    <button
      class="bubble-menu-button"
      class:active={active.style === 'fill-width'}
      on:click={() => editor.formatLine({ ...editor.doc.getLineFormat(), style: 'fill-width' })}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <rect fill="none" width="24" height="24"/>
        <path d="M18,19 L18,21 L6,21 L6,19 L18,19 Z M21,3 L21,17 L3,17 L3,3 L21,3 Z"></path>
      </svg>
    </button>
 </div>
</BubbleMenu>

<div class="page">
  <div use:asRoot={editor} class="editor">
    <h1>Images as Lines</h1>
    <p>
      Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
      expressive API, it is completely customizable to fit any need.
    </p>
    <div class="image"><img src="https://images.unsplash.com/photo-1612392062422-ef19b42f74df?fit=crop&w=600" alt="hotdogs"></div>
    <p>
      Typewriter is a free, open source rich text editor built for the modern web. With its modular architecture and
      expressive API, it is completely customizable to fit any need.
    </p>
  </div>
</div>

<style>
.editor {
  outline: none;
}
.editor > :global(*) {
  max-width: 600px;
  margin: 0 auto;
}

.editor :global(.image) {
  display: flex;
  flex-direction: column;
  cursor: default;
  margin: 40px auto 20px;
}
.editor :global(.image img) {
  width: 100%;
  height: 100%;
}
.editor :global(.image *::selection) {
    background-color: rgba(0,0,0,0);
}
.editor :global(.image *::-moz-selection) {
    background-color: rgba(0,0,0,0);
}

.editor :global(.image[data-style="outset-left"] img) {
  float: left;
  margin-left: -50%;
  margin-right: 20px;
}
.editor :global(.image[data-style="outset-center"]) {
  max-width: 1032px;
  width: 100%;
}
.editor :global(.image[data-style="fill-width"]) {
  max-width: none;
  width: 100%;
}

.bubble-menu {
  display: flex;
  align-items: baseline;
  height: 42px;
  background-image: linear-gradient(to bottom, rgba(49, 49, 47, .99), #262625);
  border-radius: 5px;
  z-index: 100;
  white-space: nowrap;
  animation: pop-upwards 180ms forwards linear;
}
.bubble-menu-button {
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
.bubble-menu-button:first-child {
  padding-left: 14px;
}
.bubble-menu-button:last-child {
  padding-right: 14px;
}
.bubble-menu-button {
  fill: #ffffff;
}
.bubble-menu-button.active {
  fill: #8ad4ff;
  color: #8ad4ff;
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

.inline-menu {
  display: flex;
  height: 32px;
  color: #999;
  white-space: nowrap;
}
.inline-menu-button {
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
.inline-menu-button:hover {
  color: #444;
}
.inline-menu .separator {
  height: 16px;
  margin: 8px 0;
  border-right: 1px solid #aaa;
}
</style>
