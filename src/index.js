import Editor from './editor';
import HTMLView from './html-view';

import input from './modules/input';
import keyShortcuts from './modules/key-shortcuts';
import history from './modules/history';

const defaultViewModules = [ input, keyShortcuts, history ];

export { Editor, HTMLView, input, keyShortcuts, history, defaultViewModules };
