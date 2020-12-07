<script>
import { editorStores } from 'typewriter-editor';
import { createPopper } from '@popperjs/core';

export let editor;
let className = 'bubble-menu';
export { className as class };

let menu;
let popper;
let oldRoot;
let mouseDown = false;
let menuHasFocus = false;
let placement = 'top';
const { active, doc, selection, focus, root } = editorStores(editor);

$: activeSelection = mouseDown || menuHasFocus ? activeSelection : $selection;
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
        placement: placement,
        modifiers: [
          {
            name: 'arrow',
            options: {
              element: '[data-arrow]'
            }
          },
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
          {
            name: 'dataOutput',
            enabled: true,
            phase: 'write',
            fn({ state }) {
              placement = state.placement.split('-')[0];
            },
          }
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
  editor.modules.selection.pause();
  menuHasFocus = true;
}

function onLoseFocus() {
  if (!menuHasFocus) return;
  editor.modules.selection.resume();
  menuHasFocus = false;
}
</script>

{#if activeSelection && activeSelection[0] !== activeSelection[1]}
<div class={className} on:focusin={onGainFocus} on:focusout={onLoseFocus} bind:this={menu}>
  <slot commands={editor.commands} active={$active} selection={activeSelection} focus={$focus} {placement}></slot>
</div>
{/if}
