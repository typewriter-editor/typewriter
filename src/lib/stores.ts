import { AttributeMap, TextDocument, isEqual, type EditorRange } from '@typewriter/document';
import { readable, writable, type Readable } from 'easy-signal';
import { Editor } from './Editor';

export interface EditorStores {
  active: Readable<AttributeMap>;
  doc: Readable<TextDocument>;
  selection: Readable<EditorRange | null>;
  root: Readable<HTMLElement | undefined>;
  focus: Readable<boolean>;
  updateEditor(editor: Editor): void;
}

export function editorStores(editor: Editor): EditorStores {
  const editorStore = writable(editor);
  const active = activeStore(editorStore);
  const doc = docStore(editorStore);
  const selection = selectionStore(editorStore);
  const root = rootStore(editorStore);
  const focus = focusStore(editorStore);

  function updateEditor(value: Editor) {
    if (value === editor) return;
    editorStore.set(value);
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

export function derivedEditorStore<T>(
  editorStore: Readable<Editor>,
  defaultValue: T,
  changeEvents: string[],
  update: (editor: Editor) => T,
  checkEquality?: boolean
): Readable<T> {
  let value = defaultValue;

  return readable(value, set => {
    let editor: Editor | undefined;
    const callUpdate = () => {
      value = editor ? update(editor) : defaultValue;
      if (checkEquality && isEqual(value, set)) return;
      set(value);
    };
    const on = () => editor && changeEvents.forEach(event => editor!.on(event, callUpdate));
    const off = () => editor && changeEvents.forEach(event => editor!.off(event, callUpdate));

    const unsub = editorStore.subscribe(currentEditor => {
      off();

      editor = currentEditor;

      if (editor) {
        callUpdate();
        on();
      } else {
        set((value = defaultValue));
      }
    });

    return () => {
      off();
      unsub();
      editor = undefined;
      callUpdate();
    };
  });
}

export function activeStore(editorStore: Readable<Editor>) {
  return derivedEditorStore(editorStore, {}, ['changed', 'format'], editor => editor.getActive(), true);
}

export function docStore(editorStore: Readable<Editor>) {
  return derivedEditorStore(editorStore, new TextDocument(), ['changed'], editor => editor.doc);
}

export function selectionStore(editorStore: Readable<Editor>) {
  return derivedEditorStore(editorStore, null, ['changed'], editor => editor.doc.selection);
}

export function focusStore(editorStore: Readable<Editor>) {
  return derivedEditorStore(editorStore, false, ['changed'], editor => !!editor.doc.selection);
}

export function rootStore(editorStore: Readable<Editor>) {
  return derivedEditorStore(editorStore, undefined, ['root'], editor => editor._root);
}
