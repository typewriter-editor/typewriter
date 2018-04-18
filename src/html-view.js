import EventDispatcher from './eventdispatcher';
import Editor from './editor';
import { patch } from 'ultradom';
import defaultDom from './defaultDom';
import { getSelection, setSelection, getBrowserRange, getNodeAndOffset } from './selection';
import { DOM, deltaToVdom, deltaFromDom, deltaToHTML } from './dom';
import shortcuts from 'shortcut-string';
import { shallowEqual } from 'fast-equals';

const SOURCE_API = 'api';
const SOURCE_USER = 'user';
const SOURCE_SILENT = 'silent';
const isMac = navigator.userAgent.indexOf('Macintosh') !== -1;


export default class HTMLView extends EventDispatcher {

  constructor(editor, options = {}) {
    super();
    if (!editor) throw new Error('Editor view requires an editor');
    this.editor = editor;
    this.root = null;
    this.dom = new DOM(options.dom || defaultDom);
    this.enabled = true;
    this.isMac = isMac;
    this._settingEditorSelection = false;
    this._settingBrowserSelection = false;

    if (options.modules) options.modules.forEach(module => module(this));

    this.editor.on('text-change', () => this.update());
    this.editor.on('selection-change', () => !this._settingEditorSelection && this.updateBrowserSelection());
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

  getBounds(range) {
    range = this.editor.normalizeRange(range, this.editor.length - 1);
    const browserRange = getBrowserRange(this, range);
    if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
      browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
    }
    return browserRange.getBoundingClientRect();
  }

  getHTML() {
    return deltaToHTML(this, this.editor.contents);
  }

  setHTML(html) {
    this.editor.setContents(deltaFromHTML(this, html));
  }

  update() {
    let contents = this.editor.contents;
    let viewEditor = new Editor({ contents });
    this.decorations = viewEditor.getChange(() => this.fire('decorate', viewEditor));
    if (this.root && this.decorations.ops.length) this.root.node = null;
    const vdom = deltaToVdom(this, contents.compose(this.decorations));
    this.root = patch(vdom, this.root);
    this.updateBrowserSelection();
    this.fire('update', this);
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
    this.update();
    container.appendChild(this.root);
    this.root.ownerDocument.execCommand('defaultParagraphSeparator', false, 'p');

    const onKeyDown = event => {
      const shortcut = shortcuts.fromEvent(event);
      this.fire(`shortcut:${shortcut}`, event, shortcut);
      this.fire(`shortcut`, event, shortcut);
    };

    // TODO this was added to replace the mutation observer, however, it does not accurately capture changes that
    // occur with native changes such as spell-check replacements, cut or delete using the app menus, etc. Paste should
    // be handled elsewhere (probably?).
    const onInput = () => {
      if (!this.editor.selection) throw new Error('How did an input event occur without a selection?');
      const [ from, to ] = this.editor.getSelectedRange();
      const [ node, offset ] = getNodeAndOffset(this, from);
      if (!node || (node.nodeType !== Node.TEXT_NODE && node.nodeName !== 'BR')) {
        this.root.node = null;
        return this.update();
        //throw new Error('Text entry should always result in a text node');
      }
      if (from !== to || Object.keys(this.editor.activeFormats).length) {
        this.root.node = null; // The DOM may have (or will be) changing, refresh from scratch
      }
      const text = node.nodeValue.slice(offset, offset + 1).replace(/\xA0/g, ' ');
      const contents = this.editor.contents;
      this.editor.insertText(this.editor.selection, text, null, SOURCE_USER);
      if (this.editor.contents === contents) {
        // If the change was denied to the model, update the view which is now out of sync
        this.root.node = null;
        this.update();
      }
    };

    const onSelectionChange = () => {
      this.updateEditorSelection();
    };

    // Use mutation tracking during development to catch errors
    // TODO delete mutation observer
    let checking = 0;
    const onMutate = list => {
      if (checking) clearTimeout(checking);
      checking = setTimeout(() => {
        checking = 0;
        const diff = editor.contents.compose(this.decorations).diff(deltaFromDom(view));
        if (diff.length()) {
          console.error('Delta out of sync with DOM:', diff);
        }
      }, 20);
    };

    this.root.addEventListener('keydown', onKeyDown);
    this.root.addEventListener('input', onInput);
    container.ownerDocument.addEventListener('selectionchange', onSelectionChange);

    const observer = new MutationObserver(onMutate);
    observer.observe(this.root, { characterData: true, characterDataOldValue: true, childList: true, attributes: true, subtree: true });

    this.unmount = () => {
      observer.disconnect();
      this.root.removeEventListener('keydown', onKeyDown);
      this.root.removeEventListener('input', onInput);
      this.root.ownerDocument.removeEventListener('selectionchange', onSelectionChange);
      this.root.remove();
      this.unmount = () => {};
    }
  }

  unmount() {}

}
