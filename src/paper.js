

export default class Paper {
  constructor(types) {
    this.blocks = new Types();
    this.markups = new Types();
    this.embeds = new Types();
    if (types && types.blocks) types.blocks.forEach(block => this.blocks.add(block));
    if (types && types.markups) types.markups.forEach(markup => this.markups.add(markup));
    if (types && types.embeds) types.embeds.forEach(embed => this.embeds.add(embed));
  }
}


class Types {
  constructor() {
    this.selector = '';
    this.types = {};
    this.array = [];
    this.priorities = {};
  }

  add(definition, index) {
    if (!definition.name || !definition.selector || !definition.vdom) {
      throw new Error('DOMType definitions must include a name, selector, and vdom function');
    }
    if (this.types[definition.name]) this.remove(definition.name);
    this.selector += (this.selector ? ', ' : '') + definition.selector;
    this.types[definition.name] = definition;
    if (typeof index !== 'number') {
      this.priorities[name] = this.array.length;
      this.array.push(definition);
    } else {
      this.array.splice(i, 0, definition);
      this.array.forEach(({ name }, i) => this.priorities[name] = i);
    }
  }

  remove(name) {
    if (!this.types[name]) return;
    delete this.types[name];
    this.array = this.array.filter(domType => domType.name !== name);
    this.array.forEach(({ name }, i) => this.priorities[name] = i);
    this.selector = this.array.map(type => type.selector).join(', ');
  }

  get(name) {
    return this.types[name];
  }

  priority(name) {
    return this.priorities[name];
  }

  getDefault() {
    return this.array[0];
  }

  matches(node) {
    if (node instanceof Node) {
      return this.selector ? node.matches(this.selector) : false;
    } else {
      throw new Error('Cannot match against ' + node);
    }
  }

  find(nodeOrAttr) {
    if (nodeOrAttr instanceof Node) {
      let i = this.array.length;
      while (i--) {
        let domType = this.array[i];
        if (nodeOrAttr.matches(domType.selector)) return domType;
      }
    } else if (nodeOrAttr && typeof nodeOrAttr === 'object') {
      let domType;
      Object.keys(nodeOrAttr).some(name => domType = this.get(name));
      return domType;
    }
  }
}
