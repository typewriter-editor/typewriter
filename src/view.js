import EventDispatcher from './eventdispatcher';
import Editor from './editor';
import { render } from './view/vdom';
import defaultDom from './view/defaultDom';
import { getSelection, setSelection, getBrowserRange, getNodeAndOffset, getNodeIndex } from './selection';
import { deltaToVdom, deltaFromDom, deltaToHTML } from './view/dom';
import { Paper } from './paper';
import shortcuts from 'shortcut-string';
import { shallowEqual } from 'fast-equals';
import diff from 'fast-diff';

const SOURCE_API = 'api';
const SOURCE_USER = 'user';
const SOURCE_SILENT = 'silent';
const isMac = navigator.userAgent.indexOf('Macintosh') !== -1;
const modExpr = /Ctrl|Cmd/;


export default class View extends EventDispatcher {

  constructor(editor, options = {}) {
    super();
    if (!editor) throw new Error('Editor view requires an editor');
    this.editor = editor;
    this.root = document.createElement('div');
    this.paper = new Paper(options.paper || defaultDom);
    this.enabled = true;
    this.isMac = isMac;
    this._settingEditorSelection = false;
    this._settingBrowserSelection = false;

    if (options.modules) options.modules.forEach(module => module(this));
  }

  hasFocus() {
    return this.root.contains(this.root.ownerDocument.activeElement);
  }

  focus() {
    this.root.focus();
  }

  blur() {
    this.root.blur();
  }

  disable() {
    this.enable(false);
  }

  enable(enabled = true) {
    this.enabled = enabled;
    this.update();
  }

  getBounds(from, to) {
    const range = this.editor._normalizeArguments(from, to);
    const browserRange = getBrowserRange(this, range);
    if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
      browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
    }
    return browserRange.getBoundingClientRect();
  }

  getAllBounds(from, to) {
    const range = this.editor._normalizeArguments(from, to);
    const browserRange = getBrowserRange(this, range);
    if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
      browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
    }
    return browserRange.getClientRects();
  }

  getHTML() {
    return deltaToHTML(this, this.editor.contents);
  }

  setHTML(html) {
    this.editor.setContents(deltaFromHTML(this, html));
  }

  update(changeEvent) {
    let contents = this.editor.contents;
    this.decorations = this.editor.getChange(() => this.fire('decorate', this.editor, changeEvent));
    if (this.decorations.ops.length) {
      contents = contents.compose(this.decorations);
      this.reverseDecorations = contents.diff(this.editor.contents);
    } else {
      this.reverseDecorations = this.decorations;
    }
    const vdom = deltaToVdom(this, contents);
    if (!this.enabled) vdom.attributes.contenteditable = undefined;
    this.pauseObserver();
    this.root = render(vdom, this.root);
    this.resumeObserver();
    this.updateBrowserSelection();
    this.fire('update', changeEvent);
  }

  updateBrowserSelection() {
    if (this._settingEditorSelection) return;
    this._settingBrowserSelection = true;
    setSelection(this, this.editor.selection);
    setTimeout(() => this._settingBrowserSelection = false, 20);
  }

  updateEditorSelection() {
    if (this._settingBrowserSelection) return this._settingBrowserSelection = false;
    const range = getSelection(this);
    this._settingEditorSelection = true;
    this.editor.setSelection(range);
    this._settingEditorSelection = false;
    if (!shallowEqual(range, this.editor.selection)) this.updateBrowserSelection();
  }

  mount(container) {
    container.appendChild(this.root);
    this.root.ownerDocument.execCommand('defaultParagraphSeparator', false, 'p');

    const onKeyDown = event => {
      let shortcut = shortcuts.fromEvent(event);
      this.fire(`shortcut:${shortcut}`, event, shortcut);
      this.fire(`shortcut`, event, shortcut);
      if (modExpr.test(shortcut)) {
        shortcut = shortcut.replace(modExpr, 'Mod');
        this.fire(`shortcut:${shortcut}`, event, shortcut);
        this.fire(`shortcut`, event, shortcut);
      }
    };

    // TODO this was added to replace the mutation observer, however, it does not accurately capture changes that
    // occur with native changes such as spell-check replacements, cut or delete using the app menus, etc. Paste should
    // be handled elsewhere (probably?).
    // const onInput = () => {
    //   if (!this.editor.selection) throw new Error('How did an input event occur without a selection?');
    //   const [ from, to ] = this.editor.getSelectedRange();
    //   const [ node, offset ] = getNodeAndOffset(this, from);
    //   if (!node || (node.nodeType !== Node.TEXT_NODE && node.nodeName !== 'BR')) {
    //     return this.update();
    //     //throw new Error('Text entry should always result in a text node');
    //   }
    //   const text = node.nodeValue.slice(offset, offset + 1).replace(/\xA0/g, ' ');
    //   const contents = this.editor.contents;
    //   this.editor.insertText(this.editor.selection, text, null, SOURCE_USER);
    //   if (this.editor.contents === contents) {
    //     this.update();
    //   }
    // };

    const onSelectionChange = () => {
      this.updateEditorSelection();
    };

    this.root.addEventListener('keydown', onKeyDown);
    // this.root.addEventListener('input', onInput);
    container.ownerDocument.addEventListener('selectionchange', onSelectionChange);

    const observer = new MutationObserver(list => {
      const seen = new Set();
      list = list.filter(m => {
        if (seen.has(m.target)) return false;
        seen.add(m.target);
        return true;
      });

      const selection = getSelection(this);
      const mutation = list[0];
      const isTextChange = list.length === 1 && mutation.type === 'characterData' ||
        (mutation.type === 'childList' && mutation.addedNodes.length === 1 &&
         mutation.addedNodes[0].nodeType === Node.TEXT_NODE);

      // Only one text node has been altered. Optimize for this most common case.
      if (isTextChange) {
        const change = this.editor.delta();
        let index = getNodeIndex(this, mutation.target);
        change.retain(index);
        if (mutation.type === 'characterData') {
          const diffs = diff(mutation.oldValue.replace(/\xA0/g, ' '), mutation.target.nodeValue.replace(/\xA0/g, ' '));
          diffs.forEach(([ action, string ]) => {
            if (action === diff.EQUAL) change.retain(string.length);
            else if (action === diff.DELETE) change.delete(string.length);
            else if (action === diff.INSERT) change.insert(string);
          });
          change.chop();
        } else {
          change.insert(mutation.addedNodes[0].nodeValue.replace(/\xA0/g, ' '));
        }

        if (change.ops.length) {
          // console.log('changing a little', change);
          editor.updateContents(change, SOURCE_USER, selection);
        }
      } else if (list.length === 1 && mutation.type === 'childList' &&
        addedNodes.length === 1 && mutation.addedNodes[0].nodeType === Node.TEXT_NODE)
      {

      } else {
        let contents = deltaFromDom(this, this.root);
        contents = contents.compose(this.reverseDecorations);
        const change = this.editor.contents.diff(contents);
        // console.log('changing a lot (possibly)', change);
        editor.updateContents(change, SOURCE_USER, selection);
      }
    });

    const opts = { characterData: true, characterDataOldValue: true, subtree: true,childList: true, attributes: true };
    this.resumeObserver = () => observer.observe(this.root, opts);
    this.pauseObserver = () => observer.disconnect();
    this.resumeObserver();


    // Use mutation tracking during development to catch errors
    // TODO delete mutation observer
    let checking = 0;
    const devObserver = new MutationObserver(list => {
      if (checking) clearTimeout(checking);
      checking = setTimeout(() => {
        checking = 0;
        const diff = editor.contents.compose(this.decorations).diff(deltaFromDom(view));
        if (diff.length()) {
          console.error('Delta out of sync with DOM:', diff);
        }
      }, 20);
    });
    devObserver.observe(this.root, { characterData: true, characterDataOldValue: true, childList: true, attributes: true, subtree: true });

    this.editor.on('text-changing', event => this._preventIncorrectFormats(event));
    this.editor.on('text-change', event => this.update(event));
    this.editor.on('selection-change', () => !this._settingEditorSelection && this.updateBrowserSelection());
    this.update();

    this.unmount = () => {
      devObserver.disconnect();
      observer.disconnect();
      this.root.removeEventListener('keydown', onKeyDown);
      // this.root.removeEventListener('input', onInput);
      this.root.ownerDocument.removeEventListener('selectionchange', onSelectionChange);
      this.root.remove();
      this.unmount = () => {};
    }
  }

  unmount() {}


  _preventIncorrectFormats({ change }) {
    return !change.ops.some(op => {
      if (typeof op.insert === 'object') {
        return !this.paper.embeds.find(op.insert);
      } else if (op.attributes) {
        return !(this.paper.blocks.find(op.attributes) || this.paper.markups.find(op.attributes));
      }
    });
  }

}
