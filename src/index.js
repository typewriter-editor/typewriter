import EventDispatcher from './event-dispatcher';
import Delta from './delta';
import Editor from './editor';
import View from './view';
import Paper, { container } from './paper';
import * as blocks from './view/blocks';
import * as markups from './view/markups';
import * as embeds from './view/embeds';
import defaultPaper from './view/defaultPaper';
import { h } from './view/vdom';

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
  defaultPaper,
  container,
  blocks,
  markups,
  embeds,
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
