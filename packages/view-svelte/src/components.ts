import Paragraph from './components/Paragraph.svelte';
import Header from './components/Header.svelte';
import List from './components/List.svelte';
import Blockquote from './components/Blockquote.svelte';
import Codeblock from './components/Codeblock.svelte';
import Hr from './components/Hr.svelte';
import Bold from './components/Bold.svelte';
import Italic from './components/Italic.svelte';
import Code from './components/Italic.svelte';
import Link from './components/Link.svelte';
import Image from './components/Image.svelte';
import Br from './components/Br.svelte';
import Decorator from './components/Decorator.svelte';
import BlockContents from './components/BlockContents.svelte';

export {
  Paragraph,
  Header,
  List,
  Blockquote,
  Codeblock,
  Hr,
  Bold,
  Italic,
  Code,
  Link,
  Image,
  Br,
  Decorator,
  BlockContents,
};


interface ComponentCache {
  [name: string]: Function;
}

const components: ComponentCache = {};

export function registerComponent(name: string, component: Function, rendersMultiple?: boolean) {
  (component as any).rendersMultiple = rendersMultiple;
  components[name] = component;
}

export function getComponent(name: string): Function {
  return components[name];
}

registerComponent('paragraph', Paragraph);
registerComponent('header', Header);
registerComponent('list', List, true);
registerComponent('blockquote', Blockquote, true);
registerComponent('code-block', Codeblock, true);
registerComponent('hr', Hr);
registerComponent('bold', Bold);
registerComponent('italic', Italic);
registerComponent('code', Code);
registerComponent('link', Link);
registerComponent('image', Image);
registerComponent('br', Br);
registerComponent('decorator', Decorator);
