<script>
import { onDestroy } from 'svelte';
import { createPopper } from '@popperjs/core';
import { OFFSCREEN_RECT } from './popper';
import { editorStores } from './stores';

export let editor;
let className = 'bubble-menu';
export { className as class };
export let offset = 0;
export let padding = 4;
let forLineType = undefined;
export { forLineType as for };
export let placement = 'top';

let menu;
let popper;
let oldRoot;
let oldDoc;
let mouseDown = false;
let menuHasFocus = false;
let actualPlacement = placement;
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
        getBoundingClientRect: () => editor.getBounds(activeSelection) || OFFSCREEN_RECT,
        contextElement: editor.root,
      };
      popper = createPopper(element, menu, {
        placement,
        modifiers: [
          { name: 'arrow', options: { element: '[data-arrow]' }},
          { name: 'computeStyles', options: { adaptive: false }},
          { name: 'offset', options: { offset: [0, offset] }},
          { name: 'preventOverflow', options: { padding }},
          { name: 'dataOutput', enabled: true, phase: 'write', fn({ state }) { actualPlacement = state.placement.split('-')[0] }}
        ],
      });
      requestAnimationFrame(() => menu && menu.classList.add('active'))
    }
  } else {
    if (popper && !menuHasFocus) {
      popper.destroy();
      popper = null;
    }
  }
}

function getActive(mouseDown, menuHasFocus, selection) {
  let fixedSelection = editor?.trimSelection(selection);
  let lineType;
  if (fixedSelection && fixedSelection[0] === fixedSelection[1] - 1) {
    const line = editor.doc.getLineAt(fixedSelection[0]);
    const type = editor.typeset.lines.findByAttributes(line.attributes, true);
    if (type.frozen) {
      lineType = type.name;
    }
  }
  if (lineType != forLineType) fixedSelection = null;
  return mouseDown || menuHasFocus ? activeSelection : fixedSelection;
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
    (oldDoc || oldRoot).removeEventListener('mouseup', onMouseUp);
  }
  oldRoot = root;
  oldDoc = root && root.ownerDocument;
  if (oldRoot) {
    oldRoot.addEventListener('mousedown', onMouseDown);
    (oldDoc || oldRoot).addEventListener('mouseup', onMouseUp);
  }
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

onDestroy(() => {
  updateRoot();
  onLoseFocus();
  if (popper) popper.destroy();
});
</script>

{#if activeSelection && activeSelection[0] !== activeSelection[1]}
<div class={className} on:focusin={onGainFocus} on:focusout={onLoseFocus} bind:this={menu}>
  <slot commands={editor.commands} active={$active} selection={activeSelection} focus={$focus} placement={actualPlacement}></slot>
</div>
{/if}
