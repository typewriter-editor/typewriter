import { derived, readable, writable, Readable, get } from 'svelte/store';
import { AttributeMap, EditorRange, TextDocument, isEqual } from '@typewriter/document';
import Editor from './Editor';

const EMPTY_NOPTIFIER = () => {};
const EMPTY_ACTIVE = readable({} as AttributeMap, EMPTY_NOPTIFIER);
const EMPTY_DOC = readable(new TextDocument(), EMPTY_NOPTIFIER);
const EMPTY_SELECTION = readable(null, EMPTY_NOPTIFIER);
const EMPTY_ROOT = readable(undefined, EMPTY_NOPTIFIER);


export interface EditorStores {
  active: Readable<AttributeMap>;
  doc: Readable<TextDocument>;
  selection: Readable<EditorRange | null>;
  root: Readable<HTMLElement | undefined>;
  focus: Readable<boolean>;
  updateEditor(editor: Editor): void;
}


export function editorStores(editor: Editor): EditorStores {
  const active = proxy(activeStore(editor));
  const doc = proxy(docStore(editor));
  const selection = proxy(selectionStore(editor));
  const root = proxy(rootStore(editor));
  const focus = focusStore(selection);

  function updateEditor(value: Editor) {
    if (value === editor) return;
    editor = value;
    active.set(activeStore(editor));
    doc.set(docStore(editor));
    selection.set(selectionStore(editor));
    root.set(rootStore(editor));
  }

  return {
    active,
    doc,
    selection,
    root,
    focus,
    updateEditor,
  };
}


export function activeStore(editor?: Editor) {
  if (!editor) return EMPTY_ACTIVE;
  let active = editor.getActive();

  return readable<AttributeMap>(active, set => {
    const update = () => {
      const newActive = editor.getActive();
      if (!isEqual(active, newActive)) set(active = newActive);
    }
    editor.on('changed', update);
    editor.on('format', update);
    return () => {
      editor.off('changed', update);
      editor.off('format', update);
    }
  });
}


export function docStore(editor: Editor) {
  if (!editor) return EMPTY_DOC;
  return readable<TextDocument>(editor.doc, set => {
    const update = () => set(editor.doc)
    update();
    editor.on('changed', update);
    return () => editor.off('changed', update);
  });
}


export function selectionStore(editor: Editor) {
  if (!editor) return EMPTY_SELECTION;
  return readable<EditorRange | null>(editor.doc.selection, set => {
    const update = () => set(editor.doc.selection)
    update();
    editor.on('changed', update);
    return () => editor.off('changed', update);
  });
}


export function focusStore(selection: Readable<EditorRange | null>) {
  return derived(selection, selection => !!selection);
}


export function rootStore(editor: Editor) {
  if (!editor) return EMPTY_ROOT;
  return readable<HTMLElement | undefined>(editor._root, set => {
    const update = () => set(editor._root)
    update();
    editor.on('root', update);
    return () => editor.off('root', update);
  });
}


// Can be create in a component on init and set to another store async, allowing for $mystore use
export function proxy<T>(defaultValueOrStore: T | Readable<T>) {
  const isReadable = typeof (defaultValueOrStore as Readable<T>).subscribe === 'function';
  const defaultValue = isReadable ? get(defaultValueOrStore as Readable<T>) : defaultValueOrStore as T;
  const { set: write, subscribe } = writable<T>(defaultValue);
  let unsub: Function;

  if (isReadable) {
    set(defaultValueOrStore as Readable<T>);
  }

  function set(store: Readable<T>) {
    if (unsub) unsub();
    if (store) unsub = store.subscribe(value => write(value));
  }

  return {
    set,
    subscribe
  };
}
