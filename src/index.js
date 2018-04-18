import Editor from './editor';
import HTMLView from './html-view';

import input from './modules/input';
import keyShortcuts from './modules/key-shortcuts';
import history from './modules/history';
import placeholder from './modules/placeholder';
import smartEntry from './modules/smart-entry';
import smartQuotes from './modules/smart-quotes';

const defaultViewModules = [ input, keyShortcuts, history ];

export { Editor, HTMLView, input, keyShortcuts, history, placeholder, smartEntry, smartQuotes, defaultViewModules };
