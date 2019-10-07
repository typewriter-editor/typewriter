// A basic DOM type used in Typewriter views, either a block, mark, or embed
export interface Type {
  // Type name
  name: string;

  // A selector which matches this Type in the DOM
  selector: string;

  // A selector which matches this Type when found in a style (e.g. '[style*="italic"]')
  styleSelector?: string;

  // Returns the attributes object for the Delta given a matching DOM node, if false indicate should be ignored
  fromDom?: Function | false;

  // Different views will have different requirements on the data they need to render each type
  [other: string]: any;
}

export interface TypeMap {
  [name: string]: Type;
}

export interface PaperTypes {
  blocks?: Type[];
  marks?: Type[];
  embeds?: Type[];
}


/**
 * Defines the blocks, marks, and embeds that can be used in a Typewriter document.
 */
export class Paper {
  private subscribers: Function[];
  blocks: Types;
  marks: Types;
  embeds: Types;

  constructor(types?: PaperTypes) {
    this.subscribers = [];
    this.blocks = new Types(this, types && types.blocks);
    this.marks = new Types(this, types && types.marks);
    this.embeds = new Types(this, types && types.embeds);
  }

  subscribe(run: Function) {
		this.subscribers.push(run);
		run(this);
		return () => {
			const index = this.subscribers.indexOf(run);
			if (index !== -1) this.subscribers.splice(index, 1);
		};
  }

  updated() {
    this.subscribers.forEach(run => run(this));
  }
}

/**
 * A type store to hold types and make it easy to manage them.
 */
export class Types {
  private paper: Paper;

  // A selector which will match all nodes of this type (e.g. all blocks)
  selector: string;

  // A map of all types by name
  types: TypeMap;

  // An array of the types in priority order
  list: Type[];

  // A reverse lookup of priority by type name
  priorities: { [name: string]: number };

  constructor(paper: Paper, types?: Type[]) {
    this.paper = paper;
    this.selector = '';
    this.types = {};
    this.list = [];
    this.priorities = {};
    if (types) types.forEach(type => this.add(type, undefined, true));
  }

  // Add a type to the store, optionally by priority (zero being highest priority, and the default type).
  add(type: any, priority?: number, skipUpdate = false) {
    if (!type.name || !type.selector) {
      throw new Error('Paper Type definitions must include a name and selector');
    }
    if (this.types[type.name]) this.remove(type.name);
    this.selector += (this.selector ? ', ' : '') + type.selector;
    this.types[type.name] = type;

    if (priority === undefined) {
      this.priorities[type.name] = this.list.length;
      this.list.push(type);
    } else {
      this.list.splice(priority, 0, type);
      this.list.forEach(({ name }, i) => this.priorities[name] = i);
    }
    if (!skipUpdate) this.paper.updated();
  }

  // Remove a type from the store
  remove(name: string) {
    if (!this.types[name]) return;
    delete this.types[name];
    this.list = this.list.filter(type => type.name !== name);
    this.list.forEach(({ name }, i) => this.priorities[name] = i);
    this.selector = this.list.map(type => type.selector).join(', ');
    this.paper.updated();
  }

  // Clear all types from the store
  clear() {
    this.selector = '';
    this.types = {};
    this.list = [];
    this.priorities = {};
    this.paper.updated();
  }

  // Get a types from the store
  get(name: string) {
    return this.types[name];
  }

  // Get a type's priority
  priority(name: string) {
    return this.priorities[name];
  }

  // Get the default type, also the one with highest priority
  getDefault() {
    return this.list[0];
  }

  // Whether or not the provided element is one of our types
  matches(node: Node) {
    if (!node.nodeType) throw new Error('Cannot match against ' + node);
    if (node.nodeType === Node.ELEMENT_NODE) {
      return this.selector ? (node as Element).matches(this.selector) : false;
    }
  }

  // Find the first type by priority that matches this element
  findByNode(node: Node, fallbackToDefault = false) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    let i = this.list.length;
    while (i--) {
      let type = this.list[i];
      if ((node as Element).matches(type.selector)) return type;
    }
    if (fallbackToDefault) return this.getDefault();
  }

  // Find the first type by priority that matches this attributes object. Can return the default for no match.
  findByAttributes(attributes: object, fallbackToDefault = false) {
    const keys = attributes && Object.keys(attributes);
    let type: Type | undefined;
    keys && keys.every(name => !(type = this.get(name)));
    return type || (fallbackToDefault ? this.getDefault() : undefined);
  }
}
