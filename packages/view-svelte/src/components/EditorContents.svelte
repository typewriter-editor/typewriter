{#each handlers as handler}
  {#if handler.blocks}
    <svelte:component this={handler.component} blocks={handler.blocks} let:block><BlockContents contents={block.contents} {paper}/></svelte:component>
  {:else}
    <svelte:component this={handler.component} block={handler.block}><BlockContents contents={handler.block.contents} {paper}/></svelte:component>
  {/if}
{/each}

<svelte:options accessors/>
<script>
import { onDestroy, tick } from 'svelte';
import BlockContents from './BlockContents.svelte';
import { getComponent } from '../components';
import { Delta, shallowEqual } from '@typewriter/editor';
import { decorate, getSelection, setSelection, getBounds as viewGetBounds } from '@typewriter/view';
import { fromDelta } from '../data';

export let api = {};
export let editor;
export let paper;
export let modules = {};
export let root = null;

export function getBounds(from, to) {
  const range = from != null && to != null ? [ from, to ] : from != null ? [ from, from ] : editor.selection;
  if (range === null) return null;
  return viewGetBounds(root, paper, range);
}

let oldEditor;
let handlers;
let moduleCleanup = [];
let blocks = []; // derive blocks from editor
let lastSelection;
let doc;
let settingEditorSelection = false;
let settingDomSelection = false;

// Get components for each block and combine blocks that are rendered together in one component like lists
$: updateHandlers(blocks);

$: {
  cleanupEditor();
  setupEditor(root, editor);
}

$: {
  cleanupModules();
  setupModules(root, paper, modules);
}


async function updateHandlers(blocks) {
  if (root) root.dispatchEvent(new Event('rendering'));

  handlers = [];
  blocks.forEach(block => {
    const component = getComponent(paper.blocks.findByAttributes(block.attributes, true).name);
    if (!component) throw new Error(`No component for block: ${block.node.name}`);

    if (component.rendersMultiple) {
      const last = handlers[handlers.length - 1];
      if (last && last.component === component) {
        last.blocks.push(block);
      } else {
        handlers.push({ component, blocks: [ block ] });
      }
    } else {
      handlers.push({ component, block });
    }

    return handlers;
  });

  await tick();
  if (root) root.dispatchEvent(new Event('render'));
}


function onFocus() {
  if (lastSelection) editor.setSelection(lastSelection);
  else root.focus();
}


onDestroy(() => {
  cleanupEditor();
  cleanupModules();
});

async function setupEditor(root, editor) {
  if (root && editor) {
    editor.on('editor-change', onEditorChange);
    doc = root.ownerDocument;
    doc.addEventListener('selectionchange', updateEditorSelection);
    oldEditor = editor;
    await tick();
    onEditorChange({ contents: editor.contents, change: editor.contents });
  }
}

function cleanupEditor() {
  if (oldEditor) {
    oldEditor.off('editor-change', onEditorChange);
    doc.removeEventListener('selectionchange', updateEditorSelection);
    doc = null;
  }
}

function setupModules(root, paper, modules) {
  if (root && paper) {
    Object.keys(modules).map(name => api[name] = modules[name](editor, root, paper));
  }
}

function cleanupModules() {
  Object.values(api).forEach(module => {
    if (module && typeof module.onDestroy === 'function') module.onDestroy();
  });
  api = {};
}

async function onEditorChange({ contents, change }) {
  // Update in-memory block version of document with this change
  if (change) {
    contents = decorate(root, contents);
    blocks = fromDelta(contents.ops);
    await tick();
  }
  updateDomSelection();
}

function onEditorSelectionChange({ selection }) {
  setSelection(root, paper, selection);
}

function updateEditorSelection() {
  if (settingDomSelection) {
    settingDomSelection = false;
    return;
  }
  const range = getSelection(root, paper);

  // Store the last non-null selection for restoration on focus()
  if (range) lastSelection = range;

  settingEditorSelection = true;
  editor.setSelection(range, 'user');
  settingEditorSelection = false;

  // If the selection was adjusted when set then update the browser's selection
  if (!shallowEqual(range, editor.selection)) {
    updateDomSelection();
  }
}

function updateDomSelection() {
  if (settingEditorSelection) return;
  settingDomSelection = true;
  setSelection(root, paper, editor.selection);
  setTimeout(() => settingDomSelection = false, 20); // sad hack :(
}

</script>
