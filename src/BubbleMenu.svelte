<script>
import { onDestroy } from 'svelte';
import { createPopper } from '@popperjs/core';
import { editorStores } from './stores';

export let editor;
let className = 'bubble-menu';
export { className as class };
export let offset = 0;
export let padding = 4;

let menu;
let popper;
let oldRoot;
let mouseDown = false;
let menuHasFocus = false;
let placement = 'top';
const { active, doc, selection, focus, root, updateEditor } = editorStores(editor);

$: updateEditor(editor);
$: activeSelection = getActive(mouseDown, menuHasFocus, $selection);
$: update(menu, $doc);
$: updateRoot($root);


function update() {
  if (mouseDown) return;
  if (menu) {
    if (popper) {
      popper.update();
    } else {
      const element = {
        getBoundingClientRect: () => editor.getBounds(activeSelection),
        contextElement: editor.root,
      };
      popper = createPopper(element, menu, {
        placement: 'top',
        modifiers: [
          { name: 'arrow', options: { element: '[data-arrow]' }},
          { name: 'computeStyles', options: { adaptive: false }},
          { name: 'offset', options: { offset: [0, offset] }},
          { name: 'preventOverflow', options: { padding }},
          { name: 'dataOutput', enabled: true, phase: 'write', fn({ state }) { placement = state.placement.split('-')[0] }}
        ],
      });
      requestAnimationFrame(() => menu.classList.add('active'))
    }
  } else {
    if (popper && !menuHasFocus) {
      popper.destroy();
      popper = null;
    }
  }
}

function getActive(mouseDown, menuHasFocus, selection) {
  return mouseDown || menuHasFocus ? activeSelection : selection;
}

function onMouseDown() {
  mouseDown = true;
}

function onMouseUp() {
  mouseDown = false;
  update();
}

function updateRoot(root) {
  if (oldRoot) {
    oldRoot.removeEventListener('mousedown', onMouseDown);
    oldRoot.removeEventListener('mouseup', onMouseUp);
  }
  if (root) {
    root.addEventListener('mousedown', onMouseDown);
    root.addEventListener('mouseup', onMouseUp);
  }
  oldRoot = root;
}

function onGainFocus(event) {
  if (menuHasFocus || event.target.nodeName === 'BUTTON') return;
  console.log('paused');
  editor.modules.selection.pause();
  menuHasFocus = true;
}

function onLoseFocus() {
  if (!menuHasFocus) return;
  editor.modules.selection.resume();
  console.log('resumed');
  menuHasFocus = false;
}

onDestroy(() => {
  updateRoot();
  onLoseFocus();
  if (popper) popper.destroy();
});
</script>

{#if activeSelection && activeSelection[0] !== activeSelection[1]}
<div class={className} on:focusin={onGainFocus} on:focusout={onLoseFocus} bind:this={menu}>
  <slot commands={editor.commands} active={$active} selection={activeSelection} focus={$focus} {placement}></slot>
</div>
{/if}
