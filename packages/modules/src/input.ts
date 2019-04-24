import { Editor, EditorRange, Delta, diff, Line, SOURCE_USER, DIFF_EQUAL, DIFF_INSERT, DIFF_DELETE } from '@typewriter/editor';
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
    function getTextChange(list: MutationRecord[]): Delta {
      const mutation = getTextChangeMutation(list);
      if (!mutation) return;

      const change = editor.delta();
      const index = getNodeIndex(root, paper, mutation.target);
      change.retain(index);
      const diffs = diff(mutation.oldValue.replace(/\xA0/g, ' '), mutation.target.nodeValue.replace(/\xA0/g, ' '));
      diffs.forEach(([ action, string ]) => {
        if (action === DIFF_EQUAL) change.retain(string.length);
        else if (action === DIFF_DELETE) change.delete(string.length);
        else if (action === DIFF_INSERT) {
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
        if (!exceptText && mutation.type === 'characterData') (mutation.target as Text).data = mutation.oldValue;
      });
      observer.observe(root, mutationOptions);
    }


    function onEnter(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      const range = editor.getSelectedRange();
      const isCollapsed = range[0] === range[1];

      const line = editor.contents.getLine(range[0]);
      let attributes = line.attributes;
      const block = paper.blocks.findByAttributes(attributes, true);
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
      editor.insertEmbed(range, 'br', true, null, SOURCE_USER);
    }


    function onBackspace(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      const range = editor.getSelectedRange();

      function flattenBlock(line: Line, force?: boolean) {
        const block = paper.blocks.findByAttributes(line.attributes, true);
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
        const line = editor.contents.getLine(range[0]);
        if (flattenBlock(line, true)) return true;
      } else {
        // The "from" block needs to stay the same. The "to" block gets merged into it
        if (range[0] === range[1]) {
          const line = editor.contents.getLine(range[0]);
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
      const [ from, to ] = editor.getSelectedRange();
      const lines: Line[] = editor.contents.getLines(from, to);

      editor.transaction(() => {
        lines.forEach((line: Line) => {
          const block = paper.blocks.findByAttributes(line.attributes, true);
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
  if (list.length > 3) return null;
  const last = list[list.length - 1];
  if (last.type !== 'characterData') return null;
  if (list.length < 3) return list[0].type === 'characterData' ? list[0] : last;
  const [ textAdd, brRemove ] = list;
  if (textAdd.addedNodes[0] !== last.target) return null;
  if (!brRemove.removedNodes.length || brRemove.removedNodes[0].nodeName !== 'BR') return null;
  return last;
}
