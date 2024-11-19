import { Editor } from '../Editor';

export function input(editor: Editor) {
  // Function to detect if Gboard is sending new lines with composed input
  function onBeforeInput(event: InputEvent) {
    // event.preventDefault();
    console.log(event.inputType, event.data);

    switch (event.inputType) {
      case 'insertText':
        // if (event.data) editor.insert(event.data);
        break;
      case 'deleteWordBackward':
        break;
    }
  }

  function onComposition(event: CompositionEvent) {
    event.preventDefault();
    console.log(event.type, event.data);
  }

  return {
    init() {
      editor.root.addEventListener('beforeinput', onBeforeInput);
      editor.root.addEventListener('compositionstart', onComposition);
      editor.root.addEventListener('compositionupdate', onComposition);
      editor.root.addEventListener('compositionend', onComposition);
    },
    destroy() {
      editor.root.removeEventListener('beforeinput', onBeforeInput);
      editor.root.removeEventListener('compositionstart', onComposition);
      editor.root.removeEventListener('compositionupdate', onComposition);
      editor.root.removeEventListener('compositionend', onComposition);
    },
  };
}
