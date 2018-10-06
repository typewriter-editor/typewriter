import EventDispatcher from './event-dispatcher';
import Editor from './editor';
import { renderChildren } from './view/vdom';
import defaultPaper from './view/defaultPaper';
import { getSelection, setSelection, getBrowserRange } from './view/selection';
import { deltaToVdom, deltaFromDom, deltaToHTML, deltaFromHTML } from './view/dom';
import Paper from './paper';
import { shortcutFromEvent } from './shortcut-string';
import { shallowEqual } from './equal';

const SOURCE_API = 'api';
const SOURCE_USER = 'user';
const SOURCE_SILENT = 'silent';
const isMac = navigator.userAgent.indexOf('Macintosh') !== -1;
const modExpr = isMac ? /Cmd/ : /Ctrl/;

/**
 * Triggers before each render inside an editor transaction. Use this event to alter the contents of the editor with
 * decorators which will only be visible in the view and will not save to the editor. To add decorators, simply use the
 * editor APIs to format text, insert embeds, etc.
 *
 * @event View#decorate
 */

/**
 * Triggers right before the view renders the latest contents to the DOM. May pass a change event if the render is
 * triggered by an editor change.
 *
 * @event View#rendering
 */

/**
 * Triggers when the view renders the latest contents to the DOM. May pass a change event if the render is
 * triggered by an editor change.
 *
 * @event View#render
 */

/**
 * Triggers on a keydown event, calling listeners with the keydown event and a shortcut string. These shortcut strings
 * will contain all the modifiers being pressed along with the key. Examples are:
 * Ctrl+B, Ctrl+Shift+Tab, Alt+A, Enter, Shift+Enter, Cmd+Enter, Cmd+Backspace, Space, Tab, Ctrl+Shift+Alt+F11, Ctrl++
 *
 * In addition to the normal modifiers, Cmd, Ctrl, Alt, and Shift, a special modifier called Mod can be used to match
 * Cmd on Mac and Ctrl on other OSes. This allows Mod+B to be used for bold and work correctly on all systems.
 *
 * You can listen for all shortcuts using the "shortcut" event, or you can listen for a specific shortcut using
 * "shortcut:{shortcut}".
 *
 * @event View#shortcut
 * @event View#shortcut:{shortcut} E.g. "shortcut:Mod+Bold"
 */

/**
 * The Typewriter View displays and Editor's contents and selection. The contents are displayed as HTML using a tiny
 * virtual dom implementation and Paper to describe the HTML. The selection is displayed with the native browser
 * selection.
 *
 * View also sends changes to the editor using contenteditable and a mutation observer to capture text entry, keyboard
 * shortcuts to capture other types of edits, and the native selectionchange event to update selection.
 */
export default class View extends EventDispatcher {

  /**
   * Create a new View to display an Editor's contents.
   *
   * @param {Editor} editor  A Typewriter editor this View will display the contents for
   * @param {Object} options Options include:
   *   @param {HTMLElement} root   The root HTML element of this view. If not provided, you must append view.root to the
   *                               DOM yourself
   *   @param {Object} paper       The blocks, markups, embeds, and/or container to be used in this editor
   *   @param {Object} modules     Modules which can be used with this view
   */
  constructor(editor, options = {}) {
    super();
    if (!editor) throw new Error('Editor view requires an editor');
    this.editor = editor;
    this.root = options.root || document.createElement('div');
    if (!options.root) this.root.className = 'typewriter-editor';
    this.paper = new Paper({ ...defaultPaper, ...options.paper });
    this.enable();
    this.isMac = isMac;
    this._settingEditorSelection = false;
    this._settingBrowserSelection = false;
    this.init();
    this.modules = {};
    if (options.modules) Object.keys(options.modules).forEach(key => this.modules[key] = options.modules[key](this));
    this.render();
  }

  /**
   * Returns whether or not the view has browser focus.
   *
   * @returns {Boolean} Whether the view has focus
   */
  hasFocus() {
    return this.root.contains(this.root.ownerDocument.activeElement);
  }

  /**
   * Focuses the view using the last known selection.
   */
  focus() {
    if (this.lastSelection) this.editor.setSelection(this.lastSelection);
    else this.root.focus();
  }

  /**
   * Removes focus from the view.
   */
  blur() {
    this.root.blur();
  }

  /**
   * Disables view text entry and key shortcuts.
   */
  disable() {
    this.enable(false);
  }

  /**
   * Enables (or disables) view text entry and key shortcuts.
   *
   * @param {Boolean} enabled Whether to make it enabled or disabled, default being true
   */
  enable(enabled = true) {
    this.enabled = enabled;
    this.root.contentEditable = enabled;
  }

  /**
   * Get the position and size of a range as it is displayed in the DOM relative to the top left of visible document.
   * You can use `getBounds(editor.selection)` to find the coordinates of the current selection and display a popup at
   * that location.
   *
   * @param {Number} from The start of the range
   * @param {Number} to   The end of the range
   * @returns {DOMRect}   A native DOMRect object with the bounds of the range
   */
  getBounds(from, to) {
    let range = this.editor._normalizeRange(from, to);
    range = this.editor.getSelectedRange(range);
    if (range && this.decorators.ops.length) {
      range = range.map(i => this.decorators.transform(i));
    }
    const browserRange = getBrowserRange(this, range);
    if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
      browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
    }
    return browserRange.getBoundingClientRect();
  }

  /**
   * Get all positions and sizes of a range as it is displayed in the DOM relative to the top left of visible document.
   * This is different from `getBounds` because instead of a single bounding box you may get multiple rects such as when
   * the selection is split across lines. You can use `getAllBounds` to draw a highlight behind the text within this
   * range.
   *
   * @param {Number} from The start of the range
   * @param {Number} to   The end of the range
   * @returns {DOMRectList}   A native DOMRect object with the bounds of the range
   */
  getAllBounds(from, to) {
    let range = this.editor._normalizeRange(from, to);
    range = this.editor.getSelectedRange(range);
    if (range && this.decorators.ops.length) {
      range = range.map(i => this.decorators.transform(i));
    }
    const browserRange = getBrowserRange(this, range);
    if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
      browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
    }
    return browserRange.getClientRects();
  }

  /**
   * Get the HTML text of the View (minus any decorators). You could use this to store the HTML contents rather than
   * storing the editor contents. If you don't care about collaborative editing this may be easier than storing Deltas.
   *
   * @returns {String} A string of HTML
   */
  getHTML() {
    return deltaToHTML(this.editor.contents, this.paper);
  }

  /**
   * Set a string of HTML to be the contents of the editor. It will be parsed using Paper so incorrectly formatted HTML
   * cannot be set in Typewriter.
   *
   * @param {String} html A string of HTML to set in the editor
   * @param {*} source    The source of the change being made, api, user, or silent
   */
  setHTML(html, source) {
    this.editor.setContents(deltaFromHTML(this, html), source);
  }

  /**
   * Re-render the current editor state to the DOM.
   */
  render(changeEvent) {
    let contents = this.editor.contents;
    this.decorators = this.editor.getChange(() => this.fire('decorate', this.editor, changeEvent));
    if (this.decorators.ops.length) {
      contents = contents.compose(this.decorators);
      this.reverseDecorators = contents.diff(this.editor.contents);
    } else {
      this.reverseDecorators = this.decorators;
    }
    const vdom = deltaToVdom(contents, this.paper);
    if (!this.enabled) vdom.attributes.contenteditable = undefined;
    const renderEvent = { changeEvent, vdom };
    this.fire('rendering', renderEvent);
    renderChildren(vdom, this.root);
    if (this.hasFocus()) this.updateBrowserSelection();
    this.fire('render', renderEvent);
  }

  /**
   * Update the browser's selection to match the editor's selection.
   */
  updateBrowserSelection() {
    if (this._settingEditorSelection) return;
    this._settingBrowserSelection = true;
    this.setSelection(this.editor.selection);
    setTimeout(() => this._settingBrowserSelection = false, 20); // sad hack :(
  }

  /**
   * Update the editor's selection to match the browser's selection.
   *
   * @param {String} source The source of the selection change, api, user, or silent
   */
  updateEditorSelection(source = SOURCE_API) {
    if (this._settingBrowserSelection) return this._settingBrowserSelection = false;
    const range = this.getSelection();

    // Store the last non-null selection for restoration on focus()
    if (range) this.lastSelection = range;

    this._settingEditorSelection = true;
    this.editor.setSelection(range, source);
    this._settingEditorSelection = false;

    // If the selection was adjusted when set then update the browser's selection
    if (!shallowEqual(range, this.editor.selection)) this.updateBrowserSelection();
  }

  /**
   * Get the mapped editor range from the current browser selection.
   *
   * @returns {Array} A range (or null) that represents the current browser selection
   */
  getSelection(nativeRange) {
    let range = getSelection(this, nativeRange);
    if (range && this.reverseDecorators.ops.length) {
      range = range.map(i => this.reverseDecorators.transform(i));
    }
    return range;
  }

  /**
   * Set's the browser selection to the given range.
   *
   * @param {Array} range The range to set selection to
   */
  setSelection(range) {
    if (range && this.decorators.ops.length) {
      range = range.map(i => this.decorators.transform(i));
    }
    setSelection(this, range);
  }

  /**
   * Initializes the view, setting up listeners in the DOM and on the editor.
   */
  init() {
    this.root.ownerDocument.execCommand('defaultParagraphSeparator', false, this.paper.blocks.getDefault().selector);

    const onKeyDown = event => {
      let shortcut = shortcutFromEvent(event);
      this.fire(`shortcut:${shortcut}`, event, shortcut);
      this.fire(`shortcut`, event, shortcut);
      if (modExpr.test(shortcut)) {
        shortcut = shortcut.replace(modExpr, 'Mod');
        this.fire(`shortcut:${shortcut}`, event, shortcut);
        this.fire(`shortcut`, event, shortcut);
      }
    };

    // The browser does a better job of adding the text correctly
    // const onPaste = event => {
    //   const html = event.clipboardData.getData('text/html');
    //   if (!html || !this.editor.selection) return;
    //   event.preventDefault();
    //   const root = document.createElement('div');
    //   root.innerHTML = html;
    //   let delta = deltaFromDom(this, root, { ignoreAttributes: true, notInDom: true });
    //   const [ from , to ] = this.editor.selection;
    //   const change = this.editor.delta().retain(from).delete(to - from);
    //   change.ops.push(...delta.ops);
    //   this.editor.updateContents(change, SOURCE_USER, change.length());
    // };

    const onSelectionChange = () => {
      this.updateEditorSelection(SOURCE_USER);
    };

    const onTextChanging = ({ contents }) => {
      // Prevent incorrect formats
      return !contents.ops.some(op => {
        if (typeof op.insert === 'object') {
          return !this.paper.embeds.find(op.insert);
        } else if (op.attributes) {
          // If attributes is empty except for classes/attributes than it is the default block
          if (!Object.keys(op.attributes).filter(key => key !== 'classes' && key !== 'attributes').length) return;
          return !(this.paper.blocks.find(op.attributes) || this.paper.markups.find(op.attributes));
        }
      });
    };

    const onEditorChange = event => {
      if (event.change) this.render(event);
      this.updateBrowserSelection();
    };

    // Use mutation tracking during development to catch errors
    // TODO delete this mutation observer when we're confident in core (or put it behind a development flag)
    // let checking = 0;
    // const devObserver = new MutationObserver(list => {
    //   if (checking) clearTimeout(checking);
    //   checking = setTimeout(() => {
    //     checking = 0;
    //     const diff = this.editor.contents.compose(this.decorators).diff(deltaFromDom(this));
    //     if (diff.length()) {
    //       console.error('Delta out of sync with DOM:', diff, this.editor.contents, deltaFromDom(this), this.decorators);
    //     }
    //   }, 20);
    // });
    // devObserver.observe(this.root, { characterData: true, characterDataOldValue: true, childList: true, attributes: true, subtree: true });


    this.root.addEventListener('keydown', onKeyDown);
    // this.root.addEventListener('paste', onPaste);
    this.root.ownerDocument.addEventListener('selectionchange', onSelectionChange);
    this.editor.on('text-changing', onTextChanging);
    this.editor.on('editor-change', onEditorChange);
    this.render();

    this.uninit = () => {
      // devObserver.disconnect();
      this.root.removeEventListener('keydown', onKeyDown);
      // this.root.removeEventListener('paste', onPaste);
      this.root.ownerDocument.removeEventListener('selectionchange', onSelectionChange);
      this.editor.off('text-changing', onTextChanging);
      this.editor.off('editor-change', onEditorChange);
      delete this.uninit;
    }
  }

  /**
   * Cleans up the listeners on the DOM and editor after they have been added.
   */
  uninit() {
    // This is overwritten inside `init`
  }

  /**
   * Clean up and allow modules to clean up before the editor is removed from the DOM.
   */
  destroy() {
    this.uninit();
    this.fire('destroy');
    Object.keys(this.modules).forEach(key => {
      const api = this.modules[key];
      if (api && typeof api.destroy === 'function') api.destroy();
    });
  }
}
