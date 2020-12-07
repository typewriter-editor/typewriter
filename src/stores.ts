import { derived, readable, writable, Readable } from 'svelte/store';
import AttributeMap from './delta/AttributeMap';
import { EditorRange } from './doc/EditorRange';
import TextDocument from './doc/TextDocument';
import Editor from './Editor';
import isEqual from './util/isEqual';


export interface EditorStores {
  active: Readable<AttributeMap>;
  doc: Readable<TextDocument>;
  selection: Readable<EditorRange | null>;
  focus: Readable<boolean>;
  root: Readable<HTMLElement>;
}


export function editorStores(editor: Editor): EditorStores {
  return {
    active: activeStore(editor),
    doc: docStore(editor),
    selection: selectionStore(editor),
    focus: focusStore(editor),
    root: rootStore(editor),
  }
}


export function activeStore(editor: Editor) {
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
  return readable<TextDocument>(editor.doc, set => {
    const update = () => set(editor.doc)
    update();
    editor.on('changed', update);
    return () => editor.off('changed', update);
  });
}


export function selectionStore(editor: Editor) {
  return readable<EditorRange | null>(editor.doc.selection, set => {
    const update = () => set(editor.doc.selection)
    update();
    editor.on('changed', update);
    return () => editor.off('changed', update);
  });
}


export function focusStore(editor: Editor) {
  return derived(selectionStore(editor), selection => !!selection);
}


export function rootStore(editor: Editor) {
  return readable<HTMLElement>(editor._root, set => {
    const update = () => set(editor._root)
    update();
    editor.on('root', update);
    return () => editor.off('root', update);
  });
}


// Can be create in a component on init and set to another store async, allowing for $mystore use
export function proxy<T>(defaultValue: T) {
  const { set: write, subscribe } = writable<T>(defaultValue);
  let unsub: Function;

  function set(store: Readable<T>) {
    if (unsub) unsub();
    if (store) store.subscribe(value => write(value));
  }

  return {
    set,
    subscribe
  };
}
