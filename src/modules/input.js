import { getNodeIndex } from '../selection';
import diff from 'fast-diff';

const SOURCE_USER = 'user';
const lastWord = /\w+[^\w]*$/;
const firstWord = /^[^\w]*\w+/;
const lastLine = /[^\n]*$/;
const firstLine = /^[^\n]*/;

// Basic text input module. Prevent any actions other than typing characters and handle with the API.
export default function input() {
  return view => {
    const editor = view.editor;
    const mutationOptions = {
      characterData: true,
      characterDataOldValue: true,
      subtree: true,childList: true,
      attributes: true
    };

    // Detects changes from spell-check and the user typing
    function onMutate(list) {
      const seen = new Set();
      list = list.filter(m => {
        if (seen.has(m.target)) return false;
        seen.add(m.target);
        return true;
      });

      const selection = view.getSelection();
      const mutation = list[0];
      const isTextChange = list.length === 1 && mutation.type === 'characterData' ||
        (mutation.type === 'childList' && mutation.addedNodes.length === 1 &&
         mutation.addedNodes[0].nodeType === Node.TEXT_NODE);

      // Only one text node has been altered. Optimize for view most common case.
      if (isTextChange) {
        const change = editor.delta();
        let index = getNodeIndex(view,
          mutation.target);
        index = view.reverseDecorations.transform(index);
        change.retain(index);
        if (mutation.type === 'characterData') {
          const diffs = diff(mutation.oldValue.replace(/\xA0/g, ' '), mutation.target.nodeValue.replace(/\xA0/g, ' '));
          diffs.forEach(([ action, string ]) => {
            if (action === diff.EQUAL) change.retain(string.length);
            else if (action === diff.DELETE) change.delete(string.length);
            else if (action === diff.INSERT) {
              change.insert(string, editor.activeFormats);
            }
          });
          change.chop();
        } else {
          change.insert(mutation.addedNodes[0].nodeValue.replace(/\xA0/g, ' '), editor.activeFormats);
        }

        if (change.ops.length) {
          // console.log('changing a little', change);
          editor.updateContents(change, SOURCE_USER, selection);
        }
      } else if (list.length === 1 && mutation.type === 'childList' &&
        addedNodes.length === 1 && mutation.addedNodes[0].nodeType === Node.TEXT_NODE)
      {

      } else {
        let contents = deltaFromDom(view, view.root);
        contents = contents.compose(view.reverseDecorations);
        const change = editor.contents.diff(contents);
        // console.log('changing a lot (possibly)', change);
        editor.updateContents(change, SOURCE_USER, selection);
      }
    }


    function onEnter(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      let [ from, to ] = editor.getSelectedRange();

      if (shortcut === 'Shift+Enter') {
        editor.insertText(from, to, '\r', null, SOURCE_USER);
      } else {
        const line = editor.contents.getLine(from);
        let attributes = line.attributes;
        const block = view.paper.blocks.find(attributes);
        const isDefault = !block;
        const length = line.contents.length();
        if (isDefault || block.defaultFollows) {
          attributes = {};
        }
        if (!length && !isDefault && !block.defaultFollows && from === to) {
          editor.formatLine(from, to, {}, SOURCE_USER);
        } else {
          let selection = from + 1;
          if (from === to && from === line.endIndex - 1) {
            from++;
            to++;
          }
          editor.insertText(from, to, '\n', attributes, SOURCE_USER, selection);
        }
      }
    }

    function onBackspace(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      let [ from, to ] = editor.getSelectedRange();
      if (from + to === 0) {
        const line = editor.contents.getLine(from);
        const block = view.paper.blocks.find(line.attributes);
        if (block) editor.formatLine(0, {}, SOURCE_USER);
      } else {
        // The "from" block needs to stay the same. The "to" block gets merged into it
        if (from === to) {
          if (shortcut === 'Alt+Backspace' && view.isMac) {
            const match = editor.getText().slice(0, from).match(lastWord);
            if (match) from -= match[0].length;
          } else if (shortcut === 'Mod+Backspace' && view.isMac) {
            const match = editor.getText().slice(0, from).match(lastLine);
            if (match) from -= match[0].length;
          } else {
            const line = editor.contents.getLine(from);
            if (from === line.startIndex) {
              const block = view.paper.blocks.find(line.attributes);
              if (block && !block.defaultFollows) {
                const prevLine = editor.contents.getLine(line.startIndex - 1);
                const prevBlock = prevLine && view.paper.blocks.find(prevLine.attributes);
                if (block !== prevBlock) {
                  editor.formatLine(from, {}, SOURCE_USER);
                  return;
                }
              }
            }

            from--;
          }
        }
        editor.deleteText(from, to, SOURCE_USER);
      }
    }

    function onDelete(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      let [ from, to ] = editor.getSelectedRange();
      if (from === to && from === editor.length) return;

      if (from === to) {
        if (shortcut === 'Alt+Delete' && view.isMac) {
          const match = editor.getText().slice(from).match(firstWord);
          if (match) to += match[0].length;
        } else {
          to++;
        }
      }
      editor.deleteText(from, to, SOURCE_USER);
    }

    function onTab(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      const direction = shortcut === 'Tab' || shortcut === 'Mod+]' ? 1 : -1;
      const [ from, to ] = editor.getSelectedRange();
      const lines = editor.contents.getLines(from, to);

      editor.transaction(() => {
        lines.forEach((line, i) => {
          if (line.attributes.list) {
            let prevLine = lines[i -1];
            if (!prevLine && line.number > 1) prevLine = editor.contents.getLine(line.startIndex - 1);
            const prevIndent = prevLine && prevLine.attributes.list ? prevLine.attributes.indent || 0 : -1;

            let indent = line.attributes.indent || 0;
            indent += direction;
            if (indent > prevIndent + 1) return console.log('will not indent too much');
            if (indent < 0) {
              editor.formatLine(line.startIndex, {});
            } else {
              const attributes = { ...line.attributes, indent };
              editor.formatLine(line.startIndex, attributes);
            }
          }
        });
      }, SOURCE_USER);
    }

    const observer = new MutationObserver(onMutate);
    observer.observe(view.root, mutationOptions);

    // Don't observe the changes that occur when the view updates, we only want to respond to changes that happen
    // outside of our API to read them back in
    function onUpdating() {
      observer.disconnect();
    }

    // Once the view update is complete, continue observing for changes
    function onUpdate() {
      observer.observe(view.root, mutationOptions);
    }

    view.on('updating', onUpdating);
    view.on('update', onUpdate);
    view.on('shortcut:Enter', onEnter);
    view.on('shortcut:Shift+Enter', onEnter);
    view.on('shortcut:Backspace', onBackspace);
    view.on('shortcut:Alt+Backspace', onBackspace);
    view.on('shortcut:Mod+Backspace', onBackspace);
    view.on('shortcut:Delete', onDelete);
    view.on('shortcut:Alt+Delete', onDelete);
    view.on('shortcut:Tab', onTab);
    view.on('shortcut:Shift+Tab', onTab);

    return {
      destroy() {
        observer.disconnect();
        view.off('updating', onUpdating);
        view.off('update', onUpdate);
        view.off('shortcut:Enter', onEnter);
        view.off('shortcut:Shift+Enter', onEnter);
        view.off('shortcut:Backspace', onBackspace);
        view.off('shortcut:Alt+Backspace', onBackspace);
        view.off('shortcut:Mod+Backspace', onBackspace);
        view.off('shortcut:Delete', onDelete);
        view.off('shortcut:Alt+Delete', onDelete);
        view.off('shortcut:Tab', onTab);
        view.off('shortcut:Shift+Tab', onTab);
      }
    }
  }
}
