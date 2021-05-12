<script>
import { createPopper } from '@popperjs/core';
import { OFFSCREEN_RECT } from './popper';
import { getLineElementAt } from './rendering/position';
import { editorStores } from './stores';

export let editor;
export let hover;
export let any; // Show on any empty line, not just a default (paragraph) line
let className = 'inline-menu';
export { className as class };

let menu;
let popper;
let oldRoot;
let menuHasFocus = false;
const { active, doc, selection, focus, root, updateEditor } = editorStores(editor);

$: updateEditor(editor);
$: activeSelection = getActive(menuHasFocus, $selection);
$: sel = !hover && activeSelection && activeSelection[0] === activeSelection[1];
$: at = sel && sel[0];
$: line = at || at === 0 ? $doc.getLineAt(at) : null;
$: lineElement = line && getLineElementAt(editor, at);
$: show = canShow(line);
$: update(menu, lineElement);
$: listen(hover && $root);


function update() {
  if (menu) {
    if (popper) {
      popper.update();
    } else {
      const element = {
        getBoundingClientRect: () => editor.getBounds(at) || OFFSCREEN_RECT,
        contextElement: editor.root,
      };
      popper = createPopper(element, menu, {
        placement: 'right',
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

function canShow(line) {
  if (!line || line.length !== 1) return false;
  const { lines } = editor.typeset;
  const type = lines.findByAttributes(line.attributes, true);
  return type === lines.default || (any && !type.frozen);
}

function getActive(menuHasFocus, selection) {
  return menuHasFocus ? activeSelection : selection;
}

function onMouseOver(event) {
  const { root } = editor;
  let node = event.target;
  while (node !== root && node.parentNode !== root) {
    node = node.parentNode;
  }
  const line = $doc.byId[node.key];
  if (line) {
    at = $doc.getLineRange(line)[0];
  }
}

function listen(root) {
  if (oldRoot) {
    oldRoot.removeEventListener('mouseover', onMouseOver);
  }
  if (root) {
    root.addEventListener('mouseover', onMouseOver);
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

function onMouseDown() {
  if (!activeSelection || activeSelection[0] !== at) {
    editor.select(at);
  }
}
</script>

{#if show}
<div class={className} on:focusin={onGainFocus} on:focusout={onLoseFocus} on:mousedown={onMouseDown} bind:this={menu}>
  <slot commands={editor.commands} active={$active} selection={$selection} focus={$focus}></slot>
</div>
{/if}
