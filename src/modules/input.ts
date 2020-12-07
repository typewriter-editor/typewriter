import diff from 'fast-diff';
import Editor from '../Editor';
import Delta from '../delta/Delta';
import TextChange from '../doc/TextChange';
import { deltaFromDom } from '../rendering/html';
import { getLineNodeEnd, getLineNodeStart, HTMLLineElement } from '../rendering/rendering';
import { getSelection } from '../rendering/selection';
import { getIndexFromNode } from '../rendering/position';
import { cleanText } from '../rendering/html';

const MUTATION_OPTIONS = {
  characterData: true,
  characterDataOldValue: true,
  subtree: true,
  childList: true
};

type HTMLLineRange = [HTMLLineElement, HTMLLineElement];

export function input(editor: Editor) {
  const { root } = editor;
  let inputHandled = false; // this is only a fallback for when mutate doesn't fire on buggy browsers

  function onInput(event: InputEvent) {
    if (event.isComposing || inputHandled) return;
    const range = getLineRange(root);
    const change = getChangeFromRange(range);
    if (change && change.ops.length) {
      const selection = getSelection(editor);
      cleanText(change);
      editor.update(new TextChange(editor.doc, change, selection));
    }
  }

  // Final fallback. Handles composition text etc. Detects text changes from e.g. spell-check or Opt+E to produce ´
  function onMutate(list: MutationRecord[]) {
    // Firefox has issues with mutation observers fireing consistently
    inputHandled = true;
    setTimeout(() => inputHandled = false);

    if (!editor.enabled) {
      return editor.render();
    }

    // Optimize for text changes (typing text)
    let change = getTextChange(list) as Delta;
    const selection = getSelection(editor);

    if (!change) {
      const range = getChangedLineRange(root, list);
      change = getChangeFromRange(range);
    }

    if (change && change.ops.length) {
      cleanText(change);
      editor.update(new TextChange(editor.doc, change, selection));
    }
  }

  function getTextChange(list: MutationRecord[]): Delta | null {
    const mutation = getTextChangeMutation(list);
    if (!mutation || mutation.oldValue == null || mutation.target.nodeValue == null) return null;

    const change = new Delta();
    const index = getIndexFromNode(editor, mutation.target);
    change.retain(index);
    const diffs = diff(mutation.oldValue.replace(/\xA0/g, ' '), mutation.target.nodeValue.replace(/\xA0/g, ' '));
    diffs.forEach(([ action, string ]) => {
      if (action === diff.EQUAL) change.retain(string.length);
      else if (action === diff.DELETE) change.delete(string.length);
      else if (action === diff.INSERT) {
        change.insert(string, editor.activeFormats);
      }
    });
    change.chop();
    return change;
  }

  // Fallback to commit whatever was changed, least performant
  function getChangeFromRange(range?: HTMLLineRange) {
    const { doc } = editor;
    if (range) {
      const [ startNode, endNode ] = range;
      const start = getLineNodeStart(root, startNode);
      const end = getLineNodeEnd(root, endNode);
      const delta = deltaFromDom(editor, { startNode, endNode: endNode.nextElementSibling || undefined });
      let change = doc.toDelta().slice(start, end).diff(delta);
      if (change.ops.length && start) change = new Delta().retain(start).concat(change);
      return change;
    } else {
      const delta = deltaFromDom(editor);
      return doc.toDelta().diff(delta);
    }
  }


  const observer = new window.MutationObserver(onMutate);
  // observer.observe(root, MUTATION_OPTIONS);

  // Don't observe the changes that occur when the view updates, we only want to respond to changes that happen
  // outside of our API to read them back in
  function onRendering() {
    observer.disconnect();
  }

  function onRender() {
    observer.observe(root, MUTATION_OPTIONS);
  }

  root.addEventListener('input', onInput);
  editor.on('rendering', onRendering);
  editor.on('render', onRender);

  return {
    destroy() {
      observer.disconnect();
      root.removeEventListener('input', onInput);
      editor.off('rendering', onRendering);
      editor.off('render', onRender);
    }
  }
}

function getTextChangeMutation(list: MutationRecord[]) {
  // Shrink the list down to one entry per text node
  const textNodes = new Set();
  list = list.filter(record => {
    if (record.type !== 'characterData') return true;
    if (textNodes.has(record.target)) return false;
    textNodes.add(record.target);
    return true;
  });

  if (list.length > 3) return null;

  const text = list.find(record => record.type === 'characterData');
  if (!text) return null;
  const textAdd = list.find(record => record.addedNodes.length === 1 && record.addedNodes[0].nodeName === '#text');
  const brAddRemove = list.find(record => {
    return (record.addedNodes.length === 1 && record.addedNodes[0].nodeName === 'BR') ||
           (record.removedNodes.length === 1 && record.removedNodes[0].nodeName === 'BR');
  });
  const count = 1 + (textAdd ? 1 : 0) + (brAddRemove ? 1 : 0);
  if (count < list.length) return null;
  if (textAdd && textAdd.addedNodes[0] !== text.target) return null;
  return text;
}


function getChangedLineRange(root: HTMLElement, records: MutationRecord[]): HTMLLineRange | undefined {
  let start: HTMLLineElement | undefined, end: HTMLLineElement | undefined;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    let line = getTopLine(root, record.target);
    if (!line && record.nextSibling) line = getTopLine(root, record.nextSibling);
    if (!line && record.previousSibling) line = getTopLine(root, record.previousSibling);
    if (line && line.key) {
      if (!start || getLineNodeStart(root, line) < getLineNodeStart(root, start)) start = line;
      if (!end || getLineNodeStart(root, line) > getLineNodeStart(root, end)) end = line;
    } else if ((record.target as HTMLLineElement).key) {
      // If a line is deleted or new line added we will return null and diff the whole thing (rare fallback case)
      return;
    }
  }

  if (start && end) return [ start, end ];
}

function getLineRange(root: HTMLElement): HTMLLineRange | undefined {
  // With & w/o virutalization we may have 0123456789, 123-9, 1-789, 1-456-9, we need to find the "on screen" range
  const children = root.children as any as HTMLLineElement[];
  const length = children.length;
  if (!length) return;
  if (length === 1 && children[0].key) return [ children[0], children[0] ];
  const start = children[!children[0].key || getLineNodeEnd(root, children[0]) === getLineNodeStart(root, children[1]) ? 0 : 1];
  const end = children[!children[length - 1].key || getLineNodeEnd(root, children[length - 2]) === getLineNodeStart(root, children[length - 1]) ? length - 1 : length - 2];
  return [ start, end ];
}

function getTopLine(root: HTMLElement, node: any) {
  if (node === root) {

  }
  while (node && node.parentNode !== root) node = node.parentNode;
  return node as HTMLLineElement | null;
}
