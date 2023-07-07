import { AttributeMap, Line } from '@typewriter/document';
import { VChild, VNode } from '../rendering/vdom';
import Editor, { Shortcuts } from '../Editor';
const EMPTY_ARR = [];

const lineTypes: Record<string, LineType> = {};
const formatTypes: Record<string, FormatType> = {};
const embedTypes: Record<string, BasicType> = {};
const shouldCombine: ShouldCombine = (prev, next) => true;


export class Typeset {
  lines: Types<LineType>;
  formats: Types<FormatType>;
  embeds: Types<EmbedType>;

  static line = line;
  static format = format;
  static embed = embed;

  constructor(types: TypesetTypes) {
    const lines = types.lines?.map(entry => typeof entry === 'string' ? lineTypes[entry] : entry).filter(Boolean);
    const formats = types.formats?.map(entry => typeof entry === 'string' ? formatTypes[entry] : entry).filter(Boolean);
    const embeds = types.embeds?.map(entry => typeof entry === 'string' ? embedTypes[entry] : entry).filter(Boolean);
    this.lines = new Types<LineType>(lines || EMPTY_ARR);
    this.formats = new Types(formats || EMPTY_ARR);
    this.embeds = new Types(embeds || EMPTY_ARR);
  }
}

export function line(type: LineType) {
  if (type.renderMultiple && !type.shouldCombine) type.shouldCombine = shouldCombine;
  return lineTypes[type.name] = type;
}

export function format(type: FormatType) {
  return formatTypes[type.name] = type;
}

export function embed(type: EmbedType) {
  return embedTypes[type.name] = type;
}

export type FromDom = (node: Node) => any;
export type LineData = [attributes: AttributeMap, children: VChild[], id:string];
export type Renderer = (attributes: AttributeMap, children: VChild[], editor: Editor, forHTML?: boolean) => VNode;
export type MultiLineRenderer = (lines: LineData[], editor: Editor, forHTML?: boolean) => VNode;
export type ShouldCombine = (prev: AttributeMap, next: AttributeMap) => boolean;
export interface Commands {
  [name: string]: Function;
}

// A basic DOM type used in Typewriter views, either a line, format, or embed
export interface BasicType {
  // Type name
  name: string;

  // A selector which matches this Type in the DOM
  selector: string;

  // A selector which matches this Type when found in a style (e.g. '[style*="italic"]')
  styleSelector?: string;

  // Returns the attributes object for the Delta given a matching DOM node, or false if this DOM node should be ignored
  fromDom?: FromDom | false;

  commands?: (editor: Editor) => Commands | Function;

  // Map of shortcuts to their command name
  shortcuts?: Shortcuts | string;

  // Renders the attributes from the format, or embed into a virtual dom representation
  render?: Renderer;
}

export interface FormatType extends BasicType {
  greedy?: boolean;
}

export interface EmbedType extends BasicType {
  // If this embed doesn't fill any space, set noFill to true to add a <br> afterwards if nothing else is in the line
  noFill?: boolean;
}

export interface LineType extends BasicType {
  // Whether this line can be indented/unindented with the tab key
  indentable?: boolean;

  // A child line of another line useing the tab character instead of the newline character (\t instead of \n). Supports
  // child blocks like cells for a table (tr = newline, td = tab)
  child?: boolean;

  // Whether the next line after this should be the default line or the same type
  defaultFollows?: boolean;

  // If this line is frozen, it cannot have contents and the selection cannot be inside it (an hr or custom line)
  frozen?: boolean;

  // If Enter and Delete on an empty line will remain contained within this line rather than converting it to a paragraph
  contained?: boolean;

  // Special override handling for the enter key within this line type
  onEnter?: (editor: Editor) => void;

  // Special override handling for the tab key within this line type, handles both tab and shift+tab
  onTab?: (editor: Editor, shiftKey: boolean) => void;

  // When the Enter key is pressed within this line, what the next line's attributes should be
  nextLineAttributes?: (attributes: AttributeMap) => AttributeMap;

  // Explicit behavior when pressing Enter on the current line when it is empty. `true` will unindent or format line as
  // paragraph. `false` allows the next line to be created. Use `nextLineAttributes` or `defaultFollows` to control it.
  onEmptyEnter?: (editor: Editor, line: Line) => boolean;

  // Renders the attributes from the delta line, format, or embed into a virtual dom representation
  render?: Renderer;

  // Renders the attributes from multiple delta lines into a virtual dom representation
  renderMultiple?: MultiLineRenderer;

  shouldCombine?: ShouldCombine;
}

export interface TypesetTypes {
  lines?: Array<string | LineType>;
  formats?: Array<string | FormatType>;
  embeds?: Array<string | EmbedType>;
}

export interface TypeMap<T extends BasicType = BasicType> {
  [name: string]: T;
}

/**
 * A type store to hold types and make it easy to manage them.
 */
export class Types<T extends BasicType = BasicType> {
  // An array of the types
  list: T[];

  // A selector which will match all nodes of this type (e.g. all lines)
  selector!: string;

  // A map of all types by name
  types!: TypeMap<T>;

  // A reverse lookup of priority by type name
  priorities!: { [name: string]: number };

  constructor(types: T[]) {
    this.list = types;
    this.init();
  }

  get default() {
    return this.list[0];
  }

  init() {
    this.selector = this.list.map(type => type.selector || '').filter(Boolean).join(', ');
    this.types = this.list.reduce((types, type) => {types[type.name] = type; return types}, {});
    this.priorities = this.list.reduce((priorities, type, i) => {priorities[type.name] = i; return priorities}, {});
  }

  add(type: T) {
    this.list.push(type);
    this.init();
  }

  remove(type: T | string) {
    const name = typeof type === 'string' ? type : type.name;
    this.list = this.list.filter(type => type.name !== name);
    this.init();
  }

  get(name: string) {
    return this.types[name];
  }

  priority(name: string) {
    // Attribute keys that do not have types assigned to them need a default sorting value.
    // A default value of -1 means that "loose" attribute keys do not corrupt priority sorting
    //   and are sorted to the back of the list in rendering.ts::renderInline()
    const priority = this.priorities[name];
    return priority !== undefined ? priority : -1;
  }

  // Whether or not the provided element is one of our types
  matches(node: Node | null) {
    if (!node) return false;
    if (!node.nodeType) throw new Error('Cannot match against ' + node);
    if (node.nodeType === Node.ELEMENT_NODE) {
      return this.selector ? (node as Element).matches(this.selector) : false;
    }
  }

  // Find the first type by priority that matches this element
  findByNode(node: Node, fallbackToDefault: true): T;
  findByNode(node: Node, fallbackToDefault?: boolean): T | undefined;
  findByNode(node: Node, fallbackToDefault = false) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    let i = this.list.length;
    while (i--) {
      let type = this.list[i];
      if ((node as Element).matches(type.selector)) return type;
    }
    if (fallbackToDefault) return this.default;
  }

  // Find the first type by priority that matches this attributes object. Can return the default for no match.
  findByAttributes(attributes: AttributeMap | undefined, fallbackToDefault: true): T;
  findByAttributes(attributes: AttributeMap | undefined, fallbackToDefault?: boolean): T | undefined;
  findByAttributes(attributes: AttributeMap | undefined, fallbackToDefault = false): T | undefined {
    const keys = attributes && Object.keys(attributes);
    let type: T | undefined;
    keys && keys.every(name => !(type = this.get(name)));
    return type || (fallbackToDefault ? this.default : undefined);
  }
}
