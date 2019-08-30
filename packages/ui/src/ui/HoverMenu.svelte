<div
  bind:this={menu}
  style="top: {pos.top}px; left: {pos.left}px"
  class:active
  class:input-mode={inputMode}
  class="menu">
  <div class="items">
    {#each items as item}
      {#if item}
        <button class="editor-menu-{item.name}" class:active={item.active} on:click={() => onClick(item)} disabled={item.disabled}>
          <i class="typewriter-icon typewriter-{item.icon || item.name}"></i>
        </button>
      {:else}
        <div class="typewriter-separator"></div>
      {/if}
    {/each}
  </div>
  <div class="link-input">
    <input bind:this={input} bind:value={href} on:keydown={onKeyDown} on:blur={createLink} placeholder="https://example.com/">
    <i on:click={exitInput} class="close">×</i>
  </div>
</div>

<svelte:options accessors/>

<script>
import { onMount, tick } from 'svelte';
import { getBounds } from '@typewriter/view';

const SOURCE_USER = 'user';
let menu
export let items = [];
export let editor = null;
export let root = null;
export let paper = null;
export let range = null;
export let active = false;
export let inputMode = false;
export let pos = { left: 0, top: 0 };
export let href = '';
let lastSelection;
let input;

$: if (menu && root && range) reposition();
$: {
  items = [];

  if (paper) {
    const { blocks, marks } = paper;
    const { header, blockquote } = blocks.types;
    const { bold, italic, link } = marks.types;
    const format = editor.getFormat(range);

    if (bold) {
      items.push({
        name: 'bold',
        active: format.bold,
        action: onMarkClick
      });
    }

    if (italic) {
      items.push({
        name: 'italic',
        active: format.italic,
        action: onMarkClick
      });
    }

    if (link) {
      items.push({
        name: 'link',
        active: format.link,
        action: onLinkClick
      });
    }

    if (items.length && (header || blockquote)) {
      items.push(null);
    }

    if (header) {
      items.push({
        name: 'header',
        icon: 'heading1',
        active: format.header === 2,
        action: onBlockClick,
        value: 2
      }, {
        name: 'header',
        icon: 'heading2',
        active: format.header === 3,
        action: onBlockClick,
        value: 3
      });
    }

    if (blockquote) {
      items.push({
        name: 'blockquote',
        active: format.blockquote,
        action: onBlockClick
      });
    }
  }
}

function reposition() {
  if (!root || !range) {
    pos = { top: -100000, left: -100000 };
  } else {
    if (!menu.offsetParent) return; // Removed from DOM
    const container = menu.offsetParent.getBoundingClientRect();
    const targetRect = getBounds(root, paper, range);
    pos = {
      top: targetRect.top - container.top - menu.offsetHeight,
      left: targetRect.left - container.left + targetRect.width / 2 - menu.offsetWidth / 2,
    };
  }
}

function exitInput() {
  inputMode = false;
  href = '';
  editor.setSelection(lastSelection);
}

function createLink() {
  href = href.trim();
  if (href) {
    editor.formatText(range, { link: href }, SOURCE_USER);
  }
  exitInput();
}

function onClick(item) {
  if (item.action) {
    item.action(item);
  }
}

function onKeyDown(event) {
  if (event.keyCode === 27) {
    event.preventDefault();
    event.stopPropagation();
    exitInput();
  } else if (event.keyCode === 13) {
    event.preventDefault();
    createLink();
  }
}

// Actions

async function inputLink() {
  lastSelection = editor.selection;
  inputMode = true;
  href = '';
  await tick();
  input.focus();
}

function onMarkClick(item) {
  editor.toggleTextFormat(range, { [item.name]: true }, SOURCE_USER);
  // Re-calculate the position of the menu
  range = range.slice();
}

function onBlockClick(item) {
  editor.toggleLineFormat(range, { [item.name]: item.value || true }, SOURCE_USER);
  // Re-calculate the position of the menu
  range = range.slice();
}

function onLinkClick() {
  if (editor.getTextFormat(range).link) {
    editor.formatText(range, { link: null }, SOURCE_USER);
  } else {
    inputLink();
  }
}

function onHeaderClick(item) {
  if (editor.getTextFormat(range).link) {
    editor.formatText(range, { link: null }, SOURCE_USER);
  } else {
    inputLink();
  }
}
</script>

<style>
  .menu {
    position: absolute;
    background-image: linear-gradient(to bottom, rgba(49, 49, 47, .99), #262625);
    border-radius: .25rem;
    opacity: 0;
    z-index: 10000;
    margin-top: -7px;
    white-space: nowrap;
  }
  .menu.active {
    opacity: 1;
    animation: pop-upwards 180ms forwards linear;
    transition: top 75ms ease-out, left 75ms ease-out;
  }
  .menu::after {
    content: '';
    position: absolute;
    bottom: -13px;
    left: 50%;
    margin-left: -7px;
    border: 7px solid transparent;
    border-top-color: #262625;
  }
  button {
    height: 42px;
    line-height: 42px;
    vertical-align: middle;
    border: none;
    padding: 0 8px;
    margin: 0;
    color: #fff;
    background: none;
    outline: none;
    cursor: pointer;
  }
  button:first-child {
    padding-left: 14px;
  }
  button:last-child {
    padding-right: 14px;
  }
  button.active {
    color: #74b6ff;
  }
  button[disabled] {
    opacity: .5;
    cursor: default;
  }
  .typewriter-icon {
    display: inline-block;
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: inherit;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
  }
  .typewriter-icon.typewriter-bold::before {
    content: '\E238';
  }
  .typewriter-icon.typewriter-italic::before {
    content: '\E23F';
  }
  .typewriter-icon.typewriter-link::before {
    content: '\E250';
  }
  .typewriter-icon.typewriter-heading1::before {
    content: '\E264';
  }
  .typewriter-icon.typewriter-heading2::before {
    font-size: .75em;
    content: '\E264';
  }
  .typewriter-icon.typewriter-blockquote::before {
    content: '\E244';
  }
  .typewriter-separator {
    display: inline-block;
    vertical-align: middle;
    width: 1px;
    margin: 0 6px;
    height: 24px;
    background: rgba(0, 0, 0, .2);
    box-shadow: 1px 0 rgba(255, 255, 255, .2);
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

  .link-input {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
  }
  .link-input input {
    width: 100%;
    height: 100%;
    background: none;
    border: none;
    color: #f7f7f9;
    padding: 10px 24px 10px 12px;
    font-size: .875rem;
    outline: none;
    box-sizing: border-box;
  }
  .link-input .close {
    position: absolute;
    right: 12px;
    top: 10px;
    color: #f7f7f9;
    opacity: .5;
  }
  .link-input .close:hover {
    color: #f7f7f9;
    opacity: 1;
  }
  .menu:not(.input-mode) .link-input {
    display: none;
  }
  .menu.input-mode .items {
    opacity: 0;
  }
</style>
