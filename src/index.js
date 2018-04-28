import EventDispatcher from './event-dispatcher';
import Delta from './delta';
import Editor from './editor';
import View from './view';
import Paper from './paper';
import { h, render, renderChildren } from './view/vdom';

import input from './modules/input';
import keyShortcuts from './modules/key-shortcuts';
import history from './modules/history';
import placeholder from './modules/placeholder';
import smartEntry from './modules/smart-entry';
import smartQuotes, { smartQuotesDecorator } from './modules/smart-quotes';
import hoverMenu from './modules/hover-menu';

const defaultViewModules = {
  input: input(),
  keyShortcuts: keyShortcuts(),
  history: history(),
};

export {
  EventDispatcher,
  Delta,
  Editor,
  View,
  Paper,
  h,
  input,
  keyShortcuts,
  history,
  placeholder,
  smartEntry,
  smartQuotes,
  smartQuotesDecorator,
  hoverMenu,
  defaultViewModules,
};
