import Editor from './editor';
import View from './view';
import { h } from './view/vdom';

import input from './modules/input';
import keyShortcuts from './modules/key-shortcuts';
import history from './modules/history';
import placeholder from './modules/placeholder';
import smartEntry from './modules/smart-entry';
import smartQuotes from './modules/smart-quotes';

const defaultViewModules = {
  input: input(),
  keyShortcuts: keyShortcuts(),
  history: history()
};

export { Editor, View, h, input, keyShortcuts, history, placeholder, smartEntry, smartQuotes, defaultViewModules };
