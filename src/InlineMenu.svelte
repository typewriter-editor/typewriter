<script lang="ts">
import { createPopper, Instance as Popper } from '@popperjs/core';
import { EditorRange, Line } from '@typewriter/document';
import Editor from './Editor';
import { OFFSCREEN_RECT } from './popper';
import { getLineElementAt } from './rendering/position';
import { HTMLLineElement } from './rendering/rendering';
import { editorStores } from './stores';

export let editor: Editor;
export let atLine = false; // Whether to display at the line left-most point or the cursor left-most point (this point will be different with indented text)
export let hover = false; // Display on empty lines when hovering over them with the mouse vs where the text cursor is at
export let any = false; // Show on any empty line, not just a default (paragraph) line
let className = 'inline-menu';
export { className as class };
export let line: Line | null = null;

let menu: HTMLElement;
let popper: Popper | null = null;
let oldRoot: HTMLElement | undefined;
let menuHasFocus = false;
let isMouseDown = false;
const { active, doc, selection, focus, root, updateEditor } = editorStores(editor);

$: updateEditor(editor);
$: activeSelection = getActive(menuHasFocus, $selection);
$: sel = !hover && activeSelection && activeSelection[0] === activeSelection[1] ? activeSelection : null;
$: at = sel && sel[0];
$: line = at || at === 0 ? $doc.getLineAt(at) : null;
$: lineElement = line && at !== null && getLineElementAt(editor, at) || null;
$: show = canShow(line);
$: update(menu, lineElement);
$: listen(hover, $root);

function update(menu: HTMLElement, lineElement: HTMLElement | null) {
  if (menu) {
    if (popper) {
      popper.update();
    } else {
      const element = {
        getBoundingClientRect: () => {
          if (atLine) {
            if (!lineElement) return OFFSCREEN_RECT;
            const { x, y, height } = lineElement.getBoundingClientRect();
            return new DOMRect(x, y, 0, height);
          }
          else return editor.getBounds(at!) || OFFSCREEN_RECT;
        },
        contextElement: editor.root,
      };
      popper = createPopper(element, menu, {
        placement: 'right',
      });
      if (isMouseDown) menu.style.pointerEvents = 'none';
      requestAnimationFrame(() => menu && menu.classList.add('active'))
    }
  } else {
    if (popper && !menuHasFocus) {
      popper.destroy();
      popper = null;
    }
  }
}

function canShow(line: Line | null) {
  if (!line || line.length !== 1) return false;
  const { lines } = editor.typeset;
  const type = lines.findByAttributes(line.attributes, true);
  return type === lines.default || (any && !type.frozen);
}

function getActive(menuHasFocus: boolean, selection: EditorRange | null): EditorRange | null {
  return menuHasFocus ? activeSelection : selection;
}

function onMouseOver(event: MouseEvent) {
  const { root } = editor;
  let node = event.target as HTMLElement;
  while (node && node !== root && node.parentNode !== root) {
    node = node.parentNode as HTMLElement;
  }
  if (!node) return;
  const line = $doc.getLineBy((node as HTMLLineElement).key);
  if (line) {
    at = $doc.getLineRange(line)[0];
  }
}

function onMouseLeave(event: MouseEvent) {
  if (menu && menu.contains(event.relatedTarget as HTMLElement)) {
    return;
  }
  at = null;
}

function onRootMouseDown() {
  if (!$root) return;
  isMouseDown = true;
  $root.ownerDocument.addEventListener('mouseup', onDocumentMouseUp);
}

function onDocumentMouseUp(event: MouseEvent) {
  isMouseDown = false;
  if (menu?.style.pointerEvents) menu.style.pointerEvents = '';
  (event.target as Document).removeEventListener('mouseup', onDocumentMouseUp);
}

function listen(hover: boolean, root?: HTMLElement) {
  if (oldRoot) {
    oldRoot.removeEventListener('mousedown', onRootMouseDown);
    oldRoot.removeEventListener('mouseover', onMouseOver);
    oldRoot.removeEventListener('mouseleave', onMouseLeave);
  }
  if (root) {
    root.addEventListener('mousedown', onRootMouseDown);
    if (hover) {
      root.addEventListener('mouseover', onMouseOver);
      root.addEventListener('mouseleave', onMouseLeave);
    }
  }
  oldRoot = root;
}

function onGainFocus(event: FocusEvent) {
  if (menuHasFocus || (event.target as HTMLElement).nodeName === 'BUTTON') return;
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
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class={className} on:focusin={onGainFocus} on:focusout={onLoseFocus} on:mousedown={onMouseDown} bind:this={menu}>
  <slot commands={editor.commands} active={$active} selection={$selection} focus={$focus}></slot>
</div>
{/if}
