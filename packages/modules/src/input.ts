import { Editor, EditorRange, Delta, diff, getLines, getLine, Line, SOURCE_USER } from '@typewriter/editor';
import { Paper, getSelection, deltaFromDom, getNodeIndex, getNodeAndOffset } from '@typewriter/view';

const mutationOptions = {
  characterData: true,
  characterDataOldValue: true,
  subtree: true,
  childList: true
};

interface InputOptions {
  forceTextUpdates?: boolean;
}


// Basic text input module. Prevent any actions other than typing characters and handle with the API.
export default function input(options: InputOptions = {}) {

  return function(editor: Editor, root: HTMLElement, paper: Paper) {

    // Final fallback. Handles composition text etc. Detects text changes from e.g. spell-check or Opt+E to produce ´
    function onMutate(list: MutationRecord[]) {
      // Optimize for text changes (typing text)
      const textChange = getTextChange(list);
      const selection = getSelection(root, paper);

      if (textChange) {
        const committed = !!editor.updateContents(textChange, SOURCE_USER, selection);
        undoMutation(list, !options.forceTextUpdates && committed);
        if (!committed) editor.render();
      } else {
        // Handle everything else, pasted content, cut, spellcheck replacements
        const delta = deltaFromDom(root, paper);
        const change = editor.contents.diff(delta);
        undoMutation(list);
        const committed = editor.updateContents(change, SOURCE_USER, selection);
        if (!committed) editor.render();
      }
    }

    // Undo a DOM mutation so that the view can update it correctly if needed
    function getTextChange(list: MutationRecord[]): Delta | null {
      const mutation = getTextChangeMutation(list);
      if (!mutation || mutation.oldValue == null || mutation.target.nodeValue == null) return null;

      const change = editor.delta();
      const index = getNodeIndex(root, paper, mutation.target);
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

    // Undo a DOM mutation so that the view can update it correctly if needed
    function undoMutation(list: MutationRecord[], exceptText = false) {
      observer.disconnect();
      list.reverse().forEach(mutation => {
        mutation.addedNodes.forEach((node: Element) => node.remove());
        mutation.removedNodes.forEach(node => mutation.target.insertBefore(node, mutation.nextSibling));
        if (!exceptText && mutation.type === 'characterData' && mutation.target) {
          (mutation.target as Text).nodeValue = mutation.oldValue;
        }
      });
      observer.observe(root, mutationOptions);
    }


    function onPaste(event: ClipboardEvent) {
      event.preventDefault();
      const dataTransfer = event.clipboardData;
      if (!dataTransfer || !editor.selection) return;
      const html = dataTransfer.getData('text/html');

      if (!html) {
        const text = dataTransfer.getData('text/plain');
        if (text) {
          editor.insertText(editor.selection, text);
        }
      } else {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html' );
        const delta = deltaFromDom(doc.body, paper);
        const lastOp = delta.ops[delta.ops.length - 1];
        if (lastOp && typeof lastOp.insert === 'string' && lastOp.insert !== '\n') {
          lastOp.insert = lastOp.insert.replace(/\n$/, '');
        }
        editor.insertContent(editor.selection, delta);
      }
    }


    function onEnter(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      const range = editor.getSelectedRange();
      if (!range) return;
      const isCollapsed = range[0] === range[1];

      const line = getLine(editor.contents, range[0]);
      let attributes = line.attributes;
      const block = paper.blocks.findByAttributes(attributes) || paper.blocks.getDefault();
      const isDefault = block === paper.blocks.getDefault();
      const length = line.end - line.start - 1;
      const atEnd = range[1] === line.end - 1;
      if (atEnd && !isDefault && block.defaultFollows) {
        attributes = {};
      } else if (typeof block.getNextLineAttributes === 'function') {
        attributes = block.getNextLineAttributes(attributes);
      }
      const activeFormats = editor.activeFormats;
      if (!length && !isDefault && !block.defaultFollows && isCollapsed) {
        editor.formatLine(range, {}, SOURCE_USER);
      } else {
        const selection: EditorRange = [ range[0] + 1, range[0] + 1 ];
        // Insert the newline after the current newline, not before it
        if (atEnd && isCollapsed) range[0] = range[1] = range[0] + 1;
        editor.insertText(range, '\n', attributes, SOURCE_USER, selection);
      }
      editor.activeFormats = activeFormats;
    }


    function onShiftEnter(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (!paper.embeds.get('br')) return;
      const range = editor.getSelectedRange();
      if (!range) return;
      editor.insertEmbed(range, 'br', true, undefined, SOURCE_USER);
    }


    function onBackspace(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      const range = editor.getSelectedRange();
      if (!range) return;

      function flattenBlock(line: Line, force?: boolean) {
        if (!range) return;
        const block = paper.blocks.findByAttributes(line.attributes) || paper.blocks.getDefault();
        if (block.indentable && line.attributes.indent) {
          onTab(new CustomEvent('shortcut', { detail: 'Shift+Tab' }));
          return true;
        }
        if (block && (force || block !== paper.blocks.getDefault() && !block.defaultFollows)) {
          editor.formatLine([ range[0], range[0] ], {}, SOURCE_USER);
          return true;
        }
      }

      if (range[0] + range[1] === 0) {
        const line = getLine(editor.contents, range[0]);
        if (flattenBlock(line, true)) return true;
      } else {
        // The "from" block needs to stay the same. The "to" block gets merged into it
        if (range[0] === range[1]) {
          const line = getLine(editor.contents, range[0]);
          if (range[0] === line.start && flattenBlock(line)) {
            return;
          }

          range[0]--;
        }
        editor.deleteText(range, SOURCE_USER);
      }
    }


    function onDelete(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      const range = editor.getSelectedRange();
      if (!range) return;
      const isCollapsed = range[0] === range[1];
      if (isCollapsed && range[0] >= editor.length - 1) return;

      if (isCollapsed) {
        range[1]++;
      }
      editor.deleteText(range, SOURCE_USER);
    }


    function onTab(event: CustomEvent) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      const shortcut = event.detail;

      const direction = shortcut === 'Tab' || shortcut === 'Mod+]' ? 1 : -1;
      const range = editor.getSelectedRange();
      if (!range) return;
      const [ from, to ] = range;
      const lines: Line[] = getLines(editor.contents, from, to);

      editor.transaction(() => {
        lines.forEach(line => {
          const block = paper.blocks.findByAttributes(line.attributes) || paper.blocks.getDefault();
          if (block.indentable) {
            const indent = (line.attributes.indent || 0) + direction;
            const range: EditorRange = [ line.start, line.start ];
            if (indent < 0) {
              editor.formatLine(range, {});
            } else {
              const attributes = { ...line.attributes, indent };
              editor.formatLine(range, attributes);
            }
          }
        });
      }, SOURCE_USER);
    }


    const observer = new MutationObserver(onMutate);
    observer.observe(root, mutationOptions);

    // Don't observe the changes that occur when the view updates, we only want to respond to changes that happen
    // outside of our API to read them back in
    function onRendering() {
      observer.disconnect();
    }

    // Once the view update is complete, continue observing for changes
    function onRender() {
      observer.observe(root, mutationOptions);
    }

    root.addEventListener('rendering', onRendering);
    root.addEventListener('render', onRender);
    root.addEventListener('paste', onPaste);
    root.addEventListener('shortcut:Enter', onEnter);
    root.addEventListener('shortcut:Shift+Enter', onShiftEnter);
    root.addEventListener('shortcut:Backspace', onBackspace);
    root.addEventListener('shortcut:Delete', onDelete);
    root.addEventListener('shortcut:Tab', onTab);
    root.addEventListener('shortcut:Shift+Tab', onTab);
    root.addEventListener('shortcut:Mod+]', onTab);
    root.addEventListener('shortcut:Mod+[', onTab);

    return {
      onDestroy() {
        observer.disconnect();
        root.removeEventListener('rendering', onRendering);
        root.removeEventListener('render', onRender);
        root.removeEventListener('paste', onPaste);
        root.removeEventListener('shortcut:Enter', onEnter);
        root.removeEventListener('shortcut:Shift+Enter', onShiftEnter);
        root.removeEventListener('shortcut:Backspace', onBackspace);
        root.removeEventListener('shortcut:Delete', onDelete);
        root.removeEventListener('shortcut:Tab', onTab);
        root.removeEventListener('shortcut:Shift+Tab', onTab);
        root.removeEventListener('shortcut:Mod+]', onTab);
        root.removeEventListener('shortcut:Mod+[', onTab);
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
