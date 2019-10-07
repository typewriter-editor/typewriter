import { EventDispatcher, Editor, EditorRange, shallowEqual } from '@typewriter/editor';
import { Paper, decorate, getSelection, setSelection, getBounds, getAllBounds, deltaFromHTML } from '@typewriter/view';

import { renderChildren } from './vdom';
import { deltaToVdom, deltaToHTML } from './dom';

const SOURCE_API = 'api';
const SOURCE_USER = 'user';

/**
 * Triggers before each render inside an editor transaction. Respond to this event to add decorations (span elements
 * with the provided attributes at the given ranges).
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
  editor: Editor;
  root: HTMLElement;
  paper: Paper;
  modules: { [name: string]: any };
  options: any;
  enabled: boolean;
  private lastSelection?: EditorRange;
  private _settingEditorSelection: boolean;
  private _settingBrowserSelection: boolean;

  /**
   * Create a new View to display an Editor's contents.
   *
   * @param {Editor} editor  A Typewriter editor this View will display the contents for
   * @param {Paper}  paper   The blocks, marks, embeds, and/or container to be used in this editor
   * @param {Object} options Options include:
   *   @param {HTMLElement} root   The root HTML element of this view. If not provided, you must append view.root to the
   *                               DOM yourself
   *   @param {Object} modules     Modules which can be used with this view
   */
  constructor(editor: Editor, paper: Paper, options: any = {}) {
    super(options.catchEventErrors);
    if (!editor) throw new Error('Editor view requires an editor');
    this.editor = editor;
    this.root = options.root || document.createElement('div');
    if (!options.root) this.root.className = 'typewriter-editor';
    this.paper = paper;
    this.enabled = true;
    this.enable();
    this.lastSelection = undefined;
    this._settingEditorSelection = false;
    this._settingBrowserSelection = false;
    this.modules = {};
    this.options = options;
    this.init();
  }

  get doc() {
    return this.root.ownerDocument;
  }

  getBrowserSelection() {
    return this.doc && this.doc.getSelection();
  }

  /**
   * Returns whether or not the view has browser focus.
   *
   * @returns {Boolean} Whether the view has focus
   */
  hasFocus(): boolean {
    const selection = this.getBrowserSelection();
    return !!(selection && selection.anchorNode && this.root.contains(selection.anchorNode));
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
  enable(enabled: boolean = true) {
    this.enabled = enabled;
    (this.root as any).contentEditable = enabled;
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
  getBounds(range: EditorRange | null): ClientRect | DOMRect | null {
    range = this.editor.getSelectedRange(range);
    if (!range) return null;
    return getBounds(this.root, this.paper, range);
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
  getAllBounds(range: EditorRange | null): ClientRectList | DOMRectList | null {
    range = this.editor.getSelectedRange(range);
    if (!range) return null;
    return getAllBounds(this.root, this.paper, range);
  }

  /**
   * Get the HTML text of the View. You could use this to store the HTML contents rather than
   * storing the editor contents. If you don't care about collaborative editing this may be easier than storing Deltas.
   *
   * @returns {String} A string of HTML
   */
  getHTML(): string {
    return deltaToHTML(this.editor.contents, this.paper);
  }

  /**
   * Set a string of HTML to be the contents of the editor. It will be parsed using Paper so incorrectly formatted HTML
   * cannot be set in Typewriter.
   *
   * @param {String} html A string of HTML to set in the editor
   * @param {*} source    The source of the change being made, api, user, or silent
   */
  setHTML(html: string, source: any) {
    this.editor.setContents(deltaFromHTML(this.paper, html), source);
  }

  /**
   * Re-render the current editor state to the DOM.
   */
  render() {
    const contents = decorate(this.root, this.editor.contents);
    const vdom = deltaToVdom(contents, this.paper);
    this.root.dispatchEvent(new Event('rendering'));
    renderChildren(vdom, this.root);
    if (this.hasFocus()) this.updateBrowserSelection();
    this.root.dispatchEvent(new Event('render'));
  }

  /**
   * Update the browser's selection to match the editor's selection.
   */
  updateBrowserSelection() {
    if (this._settingEditorSelection) return;
    this._settingBrowserSelection = true;
    this.editor.selection && this.setSelection(this.editor.selection);
    setTimeout(() => this._settingBrowserSelection = false, 20); // sad hack :(
  }

  /**
   * Update the editor's selection to match the browser's selection.
   *
   * @param {String} source The source of the selection change, api, user, or silent
   */
  updateEditorSelection(source: string = SOURCE_API) {
    if (this._settingBrowserSelection) return this._settingBrowserSelection = false;
    const range = this.getSelection();

    // Store the last non-null selection for restoration on focus()
    if (range) this.lastSelection = range;

    this._settingEditorSelection = true;
    this.editor.setSelection(range, source);
    this._settingEditorSelection = false;

    // If the selection was adjusted when set then update the browser's selection
    const selection = this.getBrowserSelection();
    if (!shallowEqual(range, this.editor.selection) || (range && range[0] === range[1] && selection && selection.type === 'Range')) {
      this.updateBrowserSelection();
    }
  }

  /**
   * Get the mapped editor range from the current browser selection.
   *
   * @returns {Array} A range (or null) that represents the current browser selection
   */
  getSelection(nativeRange?: Range): EditorRange {
    return getSelection(this.root, this.paper, nativeRange) as EditorRange;
  }

  /**
   * Set's the browser selection to the given range.
   *
   * @param {Array} range The range to set selection to
   */
  setSelection(range: EditorRange) {
    setSelection(this.root, this.paper, range);
  }

  /**
   * Initializes the view, setting up listeners in the DOM and on the editor.
   */
  init() {
    // already inited
    let renderQueued = false;
    if (this.hasOwnProperty('uninit') || !this.doc) return;

    const doc = this.doc;

    const onSelectionChange = () => {
      this.updateEditorSelection(SOURCE_USER);
    };

    const onEditorChange = async event => {
      if (renderQueued) return;
      renderQueued = true;
      await Promise.resolve();
      if (event.change) this.render();
      else this.updateBrowserSelection();
      renderQueued = false;
    };

    const rerender = () => this.render();

    doc.addEventListener('selectionchange', onSelectionChange);
    this.editor.on('editor-change', onEditorChange);
    this.editor.on('render', rerender);

    if (this.options.modules) {
      Object.keys(this.options.modules).forEach(key => this.modules[key] = this.options.modules[key](this.editor, this.root, this.paper));
    }

    this.render();

    this.uninit = () => {
      doc.removeEventListener('selectionchange', onSelectionChange);
      this.editor.off('editor-change', onEditorChange);
      this.editor.off('render', rerender);
      Object.keys(this.modules).forEach(key => {
        const api = this.modules[key];
        if (api && typeof api.onDestroy === 'function') api.onDestroy();
        delete this.modules[key];
      });
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
  }
}
