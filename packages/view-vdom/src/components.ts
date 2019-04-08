import * as blocks from './blocks';
import * as marks from './marks';
import * as embeds from './embeds';

interface ComponentCache {
  [name: string]: Function;
}

const components: ComponentCache = {};

export function registerComponent(name: string, component: Function, rendersMultiple?: boolean) {
  if (rendersMultiple != null) (component as any).rendersMultiple = rendersMultiple;
  components[name] = component;
}

export function getComponent(name: string): Function {
  return components[name];
}

// Register the default components
const all = { ...blocks, ...marks, ...embeds};
Object.keys(all).forEach(name => registerComponent(name, all[name]));
