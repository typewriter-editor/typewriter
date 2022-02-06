import Editor from '../Editor';
import { Delta, TextChange, normalizeRange, diff } from 'typewriter-document';
import { deltaFromDom } from '../rendering/html';
import { getLineNodeEnd, getLineNodeStart, HTMLLineElement } from '../rendering/rendering';
import { getSelection } from '../rendering/selection';
import { getIndexFromNode } from '../rendering/position';
import { cleanText } from '../rendering/html';
import { Source } from '../Source';

const isIPad = navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform);
const isIOS = isIPad || /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isAndroid = !isIOS && /Mobi|Android/.test(navigator.userAgent) && !(window as any).MSStream;


const MUTATION_OPTIONS = {
  characterData: true,
  characterDataOldValue: true,
  subtree: true,
  childList: true
};

type HTMLLineRange = [HTMLLineElement, HTMLLineElement];

export function input(editor: Editor) {
  let gboardEnter = false;
  // Browsers have had issues in the past with mutation observers firing consistently, so use the observer with the input
  // event as fallback
  function onInput() {
    const mutations = observer.takeRecords();
    if (mutations.length) onMutate(mutations);
  }

  // for Gboard fix -- checks if start of line is an insert br
  function isBr(change: Delta) {
    let isBr = false;
    const lastOp = change.ops[change.ops.length - 1];
    if (lastOp.insert) {
      const insert = lastOp.insert as any;
      if (insert.br) {
        isBr = true;
      }
    }
    return isBr;
  }

  // Final fallback. Handles composition text etc. Detects text changes from e.g. spell-check or Opt+E to produce
  function onMutate(list: MutationRecord[]) {
    if (!editor.enabled) {
      return editor.render();
    }

    // Optimize for text changes (typing text)
    let change = getTextChange(list) as Delta;
    let selection = getSelection(editor);

    if (!change) {
      const range = getChangedLineRange(editor.root, list);
      change = getChangeFromRange(range);
    }

    // Gboard fix to move to next line
    if (gboardEnter) {
      // Sometimes gBoard adds a br instead of a new line (seen with h2)
      if (isBr(change)) {
        change.ops.pop();
        change.insert('\n');
      }

      // advance to next line
      if (selection !== null) {
        selection[0]++;
        selection[1]++;
      }
      gboardEnter = false;
    }

    if (change && change.ops.length) {
      cleanText(change);
      const old = editor.doc;
      editor.update(new TextChange(editor.doc, change, selection, editor.activeFormats), Source.input);
      if (editor.doc.lines === old.lines) {
        editor.render();
      }
    }
  }

  function getTextChange(list: MutationRecord[]): Delta | null {
    const mutation = getTextChangeMutation(list);
    if (!mutation || mutation.oldValue == null || mutation.target.nodeValue == null) return null;

    const change = new Delta();
    const index = getIndexFromNode(editor, mutation.target);
    change.retain(index);

    let relativeEditLocation: undefined | number = undefined;
    if (editor.doc.selection) {
      const selection = normalizeRange(editor.doc.selection);
      relativeEditLocation = selection[0] - index;

      if (relativeEditLocation < 0) {
        relativeEditLocation = 0;
      }
    }

    const diffs = diff(mutation.oldValue.replace(/\xA0/g, ' '), mutation.target.nodeValue.replace(/\xA0/g, ' '), relativeEditLocation);
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
      const start = getLineNodeStart(editor.root, startNode);
      const end = getLineNodeEnd(editor.root, endNode);
      const delta = deltaFromDom(editor, { startNode, endNode: endNode.nextElementSibling || undefined, collapseWhitespace: false });
      let change = doc.toDelta().slice(start, end).diff(delta);
      if (change.ops.length && start) change = new Delta().retain(start).concat(change);
      return change;
    } else {
      const delta = deltaFromDom(editor, { collapseWhitespace: false });
      return doc.toDelta().diff(delta);
    }
  }


  const observer = new window.MutationObserver(onMutate);

  // Don't observe the changes that occur when the view updates, we only want to respond to changes that happen
  // outside of our API to read them back in
  function onRendering() {
    observer.disconnect();
  }

  function onRender() {
    observer.observe(editor.root, MUTATION_OPTIONS);
  }

  // Function to detect if Gboard is sending new lines with composed input
  function onBeforeInput(event: InputEvent) {
    if (! event.data) return;
    if (event.data.includes('\n')) {
      gboardEnter = true;
    }
  }

  return {
    init() {
      editor.root.addEventListener('input', onInput);
      editor.on('rendering', onRendering);
      editor.on('render', onRender);
      if (isAndroid) {
        editor.root.addEventListener('beforeinput', onBeforeInput); // needed for Gboard fix
      }
    },
    destroy() {
      observer.disconnect();
      editor.root.removeEventListener('input', onInput);
      editor.off('rendering', onRendering);
      editor.off('render', onRender);
      if (isAndroid) {
        editor.root.removeEventListener('beforeinput', onBeforeInput); // gboard fix
      }
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
    if (record.target === root) return; // line added/removed

    const line = getTopLine(root, record.target);
    if (line && line.key) {
      if (!start || getLineNodeStart(root, line) < getLineNodeStart(root, start)) start = line;
      if (!end || getLineNodeStart(root, line) > getLineNodeStart(root, end)) end = line;
    } else {
      // If a line is deleted or new line added we will return null and diff the whole thing (rare fallback case)
      return;
    }
  }

  if (start && end) return [ start, end ];
}

function getTopLine(root: HTMLElement, node: any) {
  while (node && node.parentNode !== root) node = node.parentNode;
  return node as HTMLLineElement | null;
}
