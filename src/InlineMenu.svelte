<script>
import { createPopper } from '@popperjs/core';
import { OFFSCREEN_RECT } from './popper';
import { getLineElementAt } from './rendering/position';
import { editorStores } from './stores';

export let editor;
export let atLine = false; // Whether to display at the line left-most point or the cursor left-most point (this point will be different with indented text)
export let hover = false; // Display on empty lines when hovering over them with the mouse vs where the text cursor is at
export let any = false; // Show on any empty line, not just a default (paragraph) line
let className = 'inline-menu';
export { className as class };
export let line = null;

let menu;
let popper;
let oldRoot;
let menuHasFocus = false;
const { active, doc, selection, focus, root, updateEditor } = editorStores(editor);

$: updateEditor(editor);
$: activeSelection = getActive(menuHasFocus, $selection);
$: sel = !hover && activeSelection && activeSelection[0] === activeSelection[1] ? activeSelection : null;
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
        getBoundingClientRect: () => {
          if (atLine) {
            if (!lineElement) return OFFSCREEN_RECT;
            const { x, y, left, top, bottom, height } = lineElement.getBoundingClientRect();
            return { x, y, left, right: left, top, bottom, height, width: 0 };
          }
          else return editor.getBounds(at) || OFFSCREEN_RECT;
        },
        contextElement: editor.root,
      };
      popper = createPopper(element, menu, {
        placement: 'right',
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
  const line = $doc.getLineBy(node.key);
  if (line) {
    at = $doc.getLineRange(line)[0];
  }
}

function onMouseLeave(event) {
  if (menu && menu.contains(event.relatedTarget)) {
    return;
  }
  at = null;
}

function listen(root) {
  if (oldRoot) {
    oldRoot.removeEventListener('mouseover', onMouseOver);
    oldRoot.removeEventListener('mouseleave', onMouseLeave);
  }
  if (root) {
    root.addEventListener('mouseover', onMouseOver);
    root.addEventListener('mouseleave', onMouseLeave);
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
