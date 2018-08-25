import { Editor, View } from './src/index';

const editor = new Editor();
const view = new View(editor, document.body);

window.editor = editor;
window.view = view;

