import { Editor, EditorRange, Delta, getLines, getLine, Line, SOURCE_USER } from '@typewriter/editor';
import { Paper, getSelection, deltaFromDom } from '@typewriter/view';


// A list of bad characters that we don't want coming in from pasted content (e.g. "\f" aka line feed)
const BAD_CHARS = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm;


// Basic text input module. Prevent any actions other than typing characters and handle with the API.
export default function input() {

  return function(editor: Editor, root: HTMLElement, paper: Paper) {

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
        cleanText(delta);
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
      const activeFormats = editor.activeFormats;
      if (!length && !isDefault && !block.defaultFollows && isCollapsed) {
        // Convert a bullet point line into a paragraph
        editor.formatLine(range, {}, SOURCE_USER);
      } else {
        const selection: EditorRange = [ range[0] + 1, range[0] + 1 ];
        if (atEnd && !isDefault && block.defaultFollows) {
          editor.transaction(() => {
            const reverse = {};
            Object.keys(attributes).forEach(key => reverse[key] = null);
            editor.insertText(range, '\n', attributes, SOURCE_USER, selection);
            editor.updateContents(editor.delta().retain(selection[0]).retain(1, reverse));
          }, SOURCE_USER);
        } else {
          if (typeof block.getNextLineAttributes === 'function') {
            attributes = block.getNextLineAttributes(attributes);
          }
          editor.insertText(range, '\n', attributes, SOURCE_USER, selection);
        }
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

    function onInput(event) {
      const selection = getSelection(root, paper);
      if (event.inputType === 'insertText' && editor.selection) {
        editor.insertText(editor.selection, event.data, undefined, SOURCE_USER, selection);
      } else {
        updateContents();
      }
    }

    // Fallback to commit whatever was changed, least performant
    function updateContents() {
      const selection = getSelection(root, paper);
      const delta = deltaFromDom(root, paper);
      const change = editor.contents.diff(delta);
      cleanText(change);
      const committed = editor.updateContents(change, SOURCE_USER, selection);
      if (!committed) editor.render();
    }

    root.addEventListener('input', onInput);

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
        root.removeEventListener('input', onInput);
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


function cleanText(delta: Delta) {
  delta.forEach(op => {
    if (typeof op.insert === 'string') {
      op.insert = op.insert.replace(BAD_CHARS, '').replace(/[ \xa0]*\n[ \xa0]*/g, '\n');
    }
  });
}
